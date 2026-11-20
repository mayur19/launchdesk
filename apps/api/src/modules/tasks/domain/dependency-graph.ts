/**
 * Task dependency graph (PRD FR-02, FR-04; ADR-0014).
 *
 * Pure, immutable domain model. Every edge is finish-to-start: the
 * predecessor must be DONE before the successor can be completed. Graphs are
 * only built through `createDependencyGraph` / `addDependency`, which reject
 * cycles, so every value of `DependencyGraph` is acyclic by construction.
 *
 * Persistence (TODO(LD-030)) loads a project's tasks and edges, applies one
 * of these operations and writes the result under a project row lock.
 */
import { findPath } from './graph-search.js';
import type { TaskStatus } from './task-status.js';

export type { TaskStatus } from './task-status.js';

export interface TaskNode {
  readonly id: string;
  readonly projectId: string;
  readonly status: TaskStatus;
}

export interface DependencyEdge {
  readonly predecessorId: string;
  readonly successorId: string;
}

export interface DependencyGraph {
  readonly projectId: string;
  /** Task ids in insertion order; drives deterministic ordering. */
  readonly taskOrder: readonly string[];
  readonly tasks: ReadonlyMap<string, TaskNode>;
  readonly edges: readonly DependencyEdge[];
}

export type GraphError =
  | { readonly code: 'DUPLICATE_TASK'; readonly taskId: string }
  | { readonly code: 'UNKNOWN_TASK'; readonly taskId: string }
  | { readonly code: 'CROSS_PROJECT_TASK'; readonly taskId: string; readonly projectId: string }
  | { readonly code: 'SELF_DEPENDENCY'; readonly taskId: string }
  | {
      readonly code: 'DUPLICATE_DEPENDENCY';
      readonly predecessorId: string;
      readonly successorId: string;
    }
  | { readonly code: 'CYCLE'; readonly cycle: readonly string[] };

export type GraphResult<T> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: GraphError };

export type ReadinessState = 'READY' | 'BLOCKED' | 'DONE';

export interface TaskReadiness {
  readonly state: ReadinessState;
  readonly incompletePredecessors: readonly string[];
}

export type CompletionCheck =
  | { readonly allowed: true; readonly overridden: false }
  | { readonly allowed: true; readonly overridden: true; readonly overrideReason: string }
  | { readonly allowed: false; readonly incompletePredecessors: readonly string[] };

const ok = <T>(value: T): GraphResult<T> => ({ ok: true, value });
const fail = <T>(error: GraphError): GraphResult<T> => ({ ok: false, error });

function freezeGraph(
  projectId: string,
  taskOrder: readonly string[],
  tasks: ReadonlyMap<string, TaskNode>,
  edges: readonly DependencyEdge[],
): DependencyGraph {
  return Object.freeze({
    projectId,
    taskOrder: Object.freeze([...taskOrder]),
    tasks,
    edges: Object.freeze([...edges]),
  });
}

/** Build a validated graph from persisted tasks and edges. */
export function createDependencyGraph(
  projectId: string,
  tasks: readonly TaskNode[],
  edges: readonly DependencyEdge[] = [],
): GraphResult<DependencyGraph> {
  const byId = new Map<string, TaskNode>();
  for (const task of tasks) {
    if (task.projectId !== projectId) {
      return fail({ code: 'CROSS_PROJECT_TASK', taskId: task.id, projectId: task.projectId });
    }
    if (byId.has(task.id)) return fail({ code: 'DUPLICATE_TASK', taskId: task.id });
    byId.set(task.id, Object.freeze({ ...task }));
  }
  let graph = freezeGraph(projectId, [...byId.keys()], byId, []);
  for (const edge of edges) {
    const next = addDependency(graph, edge);
    if (!next.ok) return next;
    graph = next.value;
  }
  return ok(graph);
}

function validateEndpoint(
  graph: DependencyGraph,
  taskId: string,
  external: TaskNode | undefined,
): GraphError | null {
  if (external && external.id === taskId && external.projectId !== graph.projectId) {
    return { code: 'CROSS_PROJECT_TASK', taskId, projectId: external.projectId };
  }
  return graph.tasks.has(taskId) ? null : { code: 'UNKNOWN_TASK', taskId };
}

/**
 * Add `predecessor -> successor`. `external` lets callers pass a task they
 * looked up outside the graph so a cross-project reference is reported
 * explicitly instead of as an unknown id.
 */
export function addDependency(
  graph: DependencyGraph,
  edge: DependencyEdge,
  external?: TaskNode,
): GraphResult<DependencyGraph> {
  const { predecessorId, successorId } = edge;
  if (predecessorId === successorId) return fail({ code: 'SELF_DEPENDENCY', taskId: successorId });
  const endpointError =
    validateEndpoint(graph, predecessorId, external) ??
    validateEndpoint(graph, successorId, external);
  if (endpointError) return fail(endpointError);
  if (graph.edges.some((e) => e.predecessorId === predecessorId && e.successorId === successorId)) {
    return fail({ code: 'DUPLICATE_DEPENDENCY', predecessorId, successorId });
  }
  const path = findPath(graph.edges, successorId, predecessorId);
  if (path) return fail({ code: 'CYCLE', cycle: [predecessorId, ...path] });
  return ok(
    freezeGraph(graph.projectId, graph.taskOrder, graph.tasks, [
      ...graph.edges,
      { predecessorId, successorId },
    ]),
  );
}

export function removeDependency(graph: DependencyGraph, edge: DependencyEdge): DependencyGraph {
  const remaining = graph.edges.filter(
    (e) => !(e.predecessorId === edge.predecessorId && e.successorId === edge.successorId),
  );
  return remaining.length === graph.edges.length
    ? graph
    : freezeGraph(graph.projectId, graph.taskOrder, graph.tasks, remaining);
}

export function predecessorsOf(graph: DependencyGraph, taskId: string): readonly string[] {
  return graph.edges.filter((e) => e.successorId === taskId).map((e) => e.predecessorId);
}

export function successorsOf(graph: DependencyGraph, taskId: string): readonly string[] {
  return graph.edges.filter((e) => e.predecessorId === taskId).map((e) => e.successorId);
}

/** Kahn's algorithm; ties resolve in task insertion order, so output is stable. */
export function topologicalOrder(graph: DependencyGraph): readonly string[] {
  const indegree = new Map(graph.taskOrder.map((id) => [id, predecessorsOf(graph, id).length]));
  const queue = graph.taskOrder.filter((id) => indegree.get(id) === 0);
  const order: string[] = [];
  for (let head = 0; head < queue.length; head += 1) {
    const id = queue[head]!;
    order.push(id);
    for (const next of successorsOf(graph, id)) {
      const remaining = indegree.get(next)! - 1;
      indegree.set(next, remaining);
      if (remaining === 0) queue.push(next);
    }
  }
  return order;
}

function requireTask(graph: DependencyGraph, taskId: string): TaskNode {
  const task = graph.tasks.get(taskId);
  if (!task) throw new Error(`Unknown task ${taskId}`);
  return task;
}

export function taskReadiness(graph: DependencyGraph, taskId: string): TaskReadiness {
  const task = requireTask(graph, taskId);
  const incompletePredecessors = predecessorsOf(graph, taskId).filter(
    (id) => graph.tasks.get(id)?.status !== 'DONE',
  );
  if (task.status === 'DONE') return { state: 'DONE', incompletePredecessors };
  return { state: incompletePredecessors.length > 0 ? 'BLOCKED' : 'READY', incompletePredecessors };
}

export function deriveReadiness(graph: DependencyGraph): ReadonlyMap<string, TaskReadiness> {
  return new Map(topologicalOrder(graph).map((id) => [id, taskReadiness(graph, id)] as const));
}

export function withTaskStatus(
  graph: DependencyGraph,
  taskId: string,
  status: TaskStatus,
): DependencyGraph {
  const task = requireTask(graph, taskId);
  const tasks = new Map(graph.tasks);
  tasks.set(taskId, Object.freeze({ ...task, status }));
  return Object.freeze({ ...graph, tasks });
}

/** Gate for moving a task to DONE (FR-04, L-05). Override needs a non-blank reason. */
export function checkCompletion(
  graph: DependencyGraph,
  taskId: string,
  override?: { readonly reason: string },
): CompletionCheck {
  const { incompletePredecessors } = taskReadiness(graph, taskId);
  if (incompletePredecessors.length === 0) return { allowed: true, overridden: false };
  const reason = override?.reason.trim() ?? '';
  return reason.length > 0
    ? { allowed: true, overridden: true, overrideReason: reason }
    : { allowed: false, incompletePredecessors };
}
