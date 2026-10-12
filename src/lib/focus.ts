import type { SyntaxGraph } from "./types";

/** Hover or a pinned arc, scoped to one جملة card. */
export type CardFocus = { kind: "edge"; edge: number } | { kind: "node"; node: number };

/** The node itself, plus every node under a phrase. Includes مقدَّر boxes. */
export function spanNodes(graph: SyntaxGraph, nodeIndex: number): number[] {
  return collect(graph, nodeIndex, new Set());
}

export function brightNodes(graph: SyntaxGraph, focus: CardFocus): Set<number> {
  if (focus.kind === "edge") {
    const edge = graph.edges[focus.edge];
    if (!edge) return new Set();
    return new Set([...spanNodes(graph, edge.d), ...spanNodes(graph, edge.h)]);
  }
  const nodes = new Set<number>([focus.node]);
  for (const edge of graph.edges) {
    const ends = [...spanNodes(graph, edge.d), ...spanNodes(graph, edge.h)];
    if (!ends.includes(focus.node)) continue;
    for (const node of ends) nodes.add(node);
  }
  return nodes;
}

export function arcIsHot(
  graph: SyntaxGraph,
  source: number,
  dependent: number,
  head: number,
  focus: CardFocus,
): boolean {
  if (focus.kind === "edge") return focus.edge === source;
  const ends = [...spanNodes(graph, dependent), ...spanNodes(graph, head)];
  return ends.includes(focus.node);
}

function collect(graph: SyntaxGraph, nodeIndex: number, seen: Set<number>): number[] {
  if (seen.has(nodeIndex)) return [];
  seen.add(nodeIndex);
  const node = graph.nodes[nodeIndex];
  if (!node) return [];
  if (node.t === "ph" && node.from !== undefined && node.to !== undefined) {
    const nodes = [nodeIndex];
    for (let index = node.from; index <= node.to; index += 1) nodes.push(...collect(graph, index, seen));
    return nodes;
  }
  return [nodeIndex];
}
