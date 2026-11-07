import type { CategoryMeta, GraphData, GraphNode, RawGraph } from './types'

/** Deterministic string hash in [0, 1). Keeps node placement stable between sessions. */
export function hash01(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return ((h >>> 0) % 100000) / 100000
}

/**
 * Places nodes without a position into their category's constellation.
 * Uses a flattened Fibonacci sphere around the category centre, so clusters read as
 * recognisable regions with a bit of depth, and the result never changes between runs.
 */
export function layoutGraph(raw: RawGraph, categories: CategoryMeta[]): GraphData {
  const centers = new Map(categories.map((c) => [c.id, c.center]))
  const byCat = new Map<string, number[]>()
  raw.nodes.forEach((n, i) => {
    if (n.position) return
    byCat.set(n.category, [...(byCat.get(n.category) ?? []), i])
  })
  const nodes: GraphNode[] = raw.nodes.map((n) => ({ ...n, position: n.position ?? [0, 0, 0] }))
  byCat.forEach((idxs, cat) => {
    const c = centers.get(cat as never) ?? [0, 0, 0]
    const k = idxs.length
    const R = 5.2 + 1.5 * Math.sqrt(k)
    // Most important nodes sit nearer the core; minor ones drift to the cluster's edge.
    const order = [...idxs].sort((x, y) => nodes[y].importance - nodes[x].importance)
    order.forEach((nodeIdx, i) => {
      const n = nodes[nodeIdx]
      const y = 1 - (2 * (i + 0.5)) / k
      const rad = Math.sqrt(Math.max(0, 1 - y * y))
      const theta = i * 2.399963 + hash01(cat) * 6.28
      const shell = 0.35 + 0.65 * Math.sqrt((i + 0.5) / k)
      const jitter = 0.82 + 0.36 * hash01(n.id)
      n.position = [
        c[0] + Math.cos(theta) * rad * R * shell * jitter,
        c[1] + y * R * 0.8 * shell * jitter,
        c[2] + Math.sin(theta) * rad * R * shell * jitter,
      ]
    })
  })
  return { nodes, edges: raw.edges }
}

/** Chooses a free spot for a new node, near a neighbour or inside its category region. */
export function placeNewNode(
  graph: GraphData,
  categories: CategoryMeta[],
  category: string,
  seed: string,
  near?: [number, number, number],
): [number, number, number] {
  const base = near ?? categories.find((c) => c.id === category)?.center ?? [0, 0, 0]
  let best: [number, number, number] = base
  let bestScore = -1
  for (let i = 0; i < 24; i++) {
    const a = hash01(seed + 'a' + i) * Math.PI * 2
    const b = (hash01(seed + 'b' + i) - 0.5) * 1.6
    const r = 5 + hash01(seed + 'r' + i) * 4
    const p: [number, number, number] = [base[0] + Math.cos(a) * Math.cos(b) * r, base[1] + Math.sin(b) * r, base[2] + Math.sin(a) * Math.cos(b) * r]
    let minD = Infinity
    for (const n of graph.nodes) {
      const d = Math.hypot(n.position[0] - p[0], n.position[1] - p[1], n.position[2] - p[2])
      if (d < minD) minD = d
    }
    if (minD > bestScore) { bestScore = minD; best = p }
  }
  return best
}
