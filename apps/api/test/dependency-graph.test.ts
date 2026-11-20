import { describe, expect, it } from 'vitest';
import {
  addDependency,
  checkCompletion,
  createDependencyGraph,
  deriveReadiness,
  predecessorsOf,
  removeDependency,
  successorsOf,
  taskReadiness,
  topologicalOrder,
  withTaskStatus,
  type DependencyGraph,
  type GraphResult,
  type TaskNode,
} from '../src/modules/tasks/domain/dependency-graph.js';

const P = 'project-1';

function node(id: string, status: TaskNode['status'] = 'NOT_STARTED', projectId = P): TaskNode {
  return { id, projectId, status };
}

function unwrap<T>(result: GraphResult<T>): T {
  if (!result.ok) throw new Error(`expected ok, got ${result.error.code}`);
  return result.value;
}

/** a -> b -> c, plus a -> d (a must finish before b and d, etc.). */
function chain(): DependencyGraph {
  return unwrap(
    createDependencyGraph(
      P,
      [node('a'), node('b'), node('c'), node('d')],
      [
        { predecessorId: 'a', successorId: 'b' },
        { predecessorId: 'b', successorId: 'c' },
        { predecessorId: 'a', successorId: 'd' },
      ],
    ),
  );
}

describe('createDependencyGraph', () => {
  it('builds an empty graph', () => {
    const graph = unwrap(createDependencyGraph(P, []));
    expect(graph.projectId).toBe(P);
    expect(graph.edges).toEqual([]);
    expect(topologicalOrder(graph)).toEqual([]);
  });

  it('rejects duplicate task ids', () => {
    const result = createDependencyGraph(P, [node('a'), node('a')]);
    expect(result).toEqual({ ok: false, error: { code: 'DUPLICATE_TASK', taskId: 'a' } });
  });

  it('rejects tasks from another project', () => {
    const result = createDependencyGraph(P, [node('a'), node('x', 'NOT_STARTED', 'project-2')]);
    expect(result).toEqual({
      ok: false,
      error: { code: 'CROSS_PROJECT_TASK', taskId: 'x', projectId: 'project-2' },
    });
  });

  it('rejects persisted edges that would form a cycle', () => {
    const result = createDependencyGraph(
      P,
      [node('a'), node('b')],
      [
        { predecessorId: 'a', successorId: 'b' },
        { predecessorId: 'b', successorId: 'a' },
      ],
    );
    expect(result).toEqual({ ok: false, error: { code: 'CYCLE', cycle: ['b', 'a', 'b'] } });
  });

  it('freezes the returned graph and copies its inputs', () => {
    const tasks = [node('a')];
    const graph = unwrap(createDependencyGraph(P, tasks));
    tasks.push(node('b'));
    expect(Object.isFrozen(graph)).toBe(true);
    expect(Object.isFrozen(graph.edges)).toBe(true);
    expect(graph.tasks.size).toBe(1);
  });
});

describe('addDependency', () => {
  it('adds an edge without mutating the original graph', () => {
    const before = unwrap(createDependencyGraph(P, [node('a'), node('b')]));
    const after = unwrap(addDependency(before, { predecessorId: 'a', successorId: 'b' }));
    expect(before.edges).toEqual([]);
    expect(after.edges).toEqual([{ predecessorId: 'a', successorId: 'b' }]);
    expect(after).not.toBe(before);
  });

  it('rejects a self dependency', () => {
    const graph = chain();
    expect(addDependency(graph, { predecessorId: 'a', successorId: 'a' })).toEqual({
      ok: false,
      error: { code: 'SELF_DEPENDENCY', taskId: 'a' },
    });
  });

  it('rejects unknown predecessor and successor ids', () => {
    const graph = chain();
    expect(addDependency(graph, { predecessorId: 'zz', successorId: 'a' })).toEqual({
      ok: false,
      error: { code: 'UNKNOWN_TASK', taskId: 'zz' },
    });
    expect(addDependency(graph, { predecessorId: 'a', successorId: 'zz' })).toEqual({
      ok: false,
      error: { code: 'UNKNOWN_TASK', taskId: 'zz' },
    });
  });

  it('rejects cross-project dependencies with the foreign project id', () => {
    const graph = chain();
    const foreign = node('x', 'NOT_STARTED', 'project-2');
    expect(addDependency(graph, { predecessorId: 'a', successorId: 'x' }, foreign)).toEqual({
      ok: false,
      error: { code: 'CROSS_PROJECT_TASK', taskId: 'x', projectId: 'project-2' },
    });
  });

  it('treats a same-project external node as unknown (must be loaded into the graph)', () => {
    const graph = chain();
    expect(addDependency(graph, { predecessorId: 'a', successorId: 'y' }, node('y'))).toEqual({
      ok: false,
      error: { code: 'UNKNOWN_TASK', taskId: 'y' },
    });
  });

  it('rejects a duplicate edge', () => {
    expect(addDependency(chain(), { predecessorId: 'a', successorId: 'b' })).toEqual({
      ok: false,
      error: { code: 'DUPLICATE_DEPENDENCY', predecessorId: 'a', successorId: 'b' },
    });
  });

  it('rejects a direct two-node cycle with its path', () => {
    expect(addDependency(chain(), { predecessorId: 'b', successorId: 'a' })).toEqual({
      ok: false,
      error: { code: 'CYCLE', cycle: ['b', 'a', 'b'] },
    });
  });

  it('rejects a transitive cycle and returns the full cycle path', () => {
    expect(addDependency(chain(), { predecessorId: 'c', successorId: 'a' })).toEqual({
      ok: false,
      error: { code: 'CYCLE', cycle: ['c', 'a', 'b', 'c'] },
    });
  });

  it('finds the cycle path through a branching graph', () => {
    const graph = unwrap(
      createDependencyGraph(
        P,
        [node('a'), node('b'), node('c'), node('d'), node('e')],
        [
          { predecessorId: 'a', successorId: 'b' },
          { predecessorId: 'a', successorId: 'c' },
          { predecessorId: 'c', successorId: 'd' },
          { predecessorId: 'd', successorId: 'e' },
          { predecessorId: 'b', successorId: 'e' },
        ],
      ),
    );
    expect(addDependency(graph, { predecessorId: 'd', successorId: 'a' })).toEqual({
      ok: false,
      error: { code: 'CYCLE', cycle: ['d', 'a', 'c', 'd'] },
    });
  });

  it('allows diamonds (shared successors are not cycles)', () => {
    const graph = unwrap(addDependency(chain(), { predecessorId: 'd', successorId: 'c' }));
    expect(predecessorsOf(graph, 'c')).toEqual(['b', 'd']);
  });
});

describe('removeDependency', () => {
  it('returns a new graph without the edge', () => {
    const graph = chain();
    const next = removeDependency(graph, { predecessorId: 'a', successorId: 'b' });
    expect(next.edges).toHaveLength(2);
    expect(graph.edges).toHaveLength(3);
    expect(successorsOf(next, 'a')).toEqual(['d']);
  });

  it('returns the same graph when the edge does not exist', () => {
    const graph = chain();
    expect(removeDependency(graph, { predecessorId: 'c', successorId: 'a' })).toBe(graph);
  });
});

describe('topologicalOrder', () => {
  it('orders predecessors before successors deterministically', () => {
    expect(topologicalOrder(chain())).toEqual(['a', 'b', 'd', 'c']);
  });

  it('keeps independent tasks in insertion order', () => {
    const graph = unwrap(
      createDependencyGraph(
        P,
        [node('z'), node('y'), node('x')],
        [{ predecessorId: 'x', successorId: 'z' }],
      ),
    );
    expect(topologicalOrder(graph)).toEqual(['y', 'x', 'z']);
  });
});

describe('readiness', () => {
  it('derives READY, BLOCKED and DONE from predecessor completion', () => {
    const graph = withTaskStatus(chain(), 'a', 'DONE');
    expect(taskReadiness(graph, 'a')).toEqual({ state: 'DONE', incompletePredecessors: [] });
    expect(taskReadiness(graph, 'b')).toEqual({ state: 'READY', incompletePredecessors: [] });
    expect(taskReadiness(graph, 'c')).toEqual({ state: 'BLOCKED', incompletePredecessors: ['b'] });
  });

  it('treats tasks without predecessors as READY', () => {
    expect(taskReadiness(chain(), 'a').state).toBe('READY');
  });

  it('derives readiness for every task in topological order', () => {
    const readiness = deriveReadiness(chain());
    expect([...readiness.keys()]).toEqual(['a', 'b', 'd', 'c']);
    expect(readiness.get('d')).toEqual({ state: 'BLOCKED', incompletePredecessors: ['a'] });
  });

  it('throws for an unknown task id', () => {
    expect(() => taskReadiness(chain(), 'nope')).toThrow('Unknown task nope');
  });
});

describe('withTaskStatus', () => {
  it('returns a new graph and leaves the original untouched', () => {
    const graph = chain();
    const next = withTaskStatus(graph, 'a', 'DONE');
    expect(graph.tasks.get('a')?.status).toBe('NOT_STARTED');
    expect(next.tasks.get('a')?.status).toBe('DONE');
    expect(next.edges).toBe(graph.edges);
  });

  it('throws for an unknown task id', () => {
    expect(() => withTaskStatus(chain(), 'nope', 'DONE')).toThrow('Unknown task nope');
  });
});

describe('checkCompletion', () => {
  it('allows completion when every predecessor is done', () => {
    const graph = withTaskStatus(chain(), 'a', 'DONE');
    expect(checkCompletion(graph, 'b')).toEqual({ allowed: true, overridden: false });
  });

  it('blocks completion while predecessors are incomplete', () => {
    expect(checkCompletion(chain(), 'c')).toEqual({
      allowed: false,
      incompletePredecessors: ['b'],
    });
  });

  it('allows a documented manager override', () => {
    expect(checkCompletion(chain(), 'c', { reason: '  Customer confirmed by phone ' })).toEqual({
      allowed: true,
      overridden: true,
      overrideReason: 'Customer confirmed by phone',
    });
  });

  it('ignores a blank override reason', () => {
    expect(checkCompletion(chain(), 'c', { reason: '   ' })).toEqual({
      allowed: false,
      incompletePredecessors: ['b'],
    });
  });
});
