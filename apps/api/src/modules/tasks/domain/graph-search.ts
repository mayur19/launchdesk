interface Edge {
  readonly predecessorId: string;
  readonly successorId: string;
}

/**
 * Depth-first search for a directed path `from -> ... -> to` following
 * predecessor -> successor edges. Returns the node sequence including both
 * ends, or null. Successors are explored in edge insertion order, so the
 * reported path is deterministic.
 */
export function findPath(
  edges: readonly Edge[],
  from: string,
  to: string,
): readonly string[] | null {
  const visited = new Set<string>();

  const visit = (current: string, trail: readonly string[]): readonly string[] | null => {
    if (current === to) return trail;
    visited.add(current);
    for (const edge of edges) {
      if (edge.predecessorId !== current || visited.has(edge.successorId)) continue;
      const found = visit(edge.successorId, [...trail, edge.successorId]);
      if (found) return found;
    }
    return null;
  };

  return visit(from, [from]);
}
