import type { Evidence, FoundPath, GraphData, GraphEdge } from './types'

/** Lower is better. Stronger evidence is cheaper, so well-supported chains are found first. */
const EVIDENCE_COST: Record<Evidence, number> = { strong: 1, plausible: 1.6, speculative: 2.4, user: 2 }
const HOP_COST = 0.15
const RANK: Record<Evidence, number> = { strong: 0, plausible: 1, user: 2, speculative: 3 }

interface Step { edge: GraphEdge; from: string; to: string; reversed: boolean }
interface Route { steps: Step[]; nodes: string[]; cost: number }

function stepCost(e: GraphEdge) { return EVIDENCE_COST[e.evidence] + HOP_COST }

function buildAdjacency(g: GraphData, directed: boolean) {
  const adj = new Map<string, Step[]>()
  const push = (k: string, s: Step) => { const l = adj.get(k); if (l) l.push(s); else adj.set(k, [s]) }
  g.edges.forEach((e) => {
    push(e.source, { edge: e, from: e.source, to: e.target, reversed: false })
    if (!directed) push(e.target, { edge: e, from: e.target, to: e.source, reversed: true })
  })
  return adj
}

function dijkstra(
  adj: Map<string, Step[]>, nodeIds: string[], src: string, dst: string,
  bannedNodes: Set<string>, bannedEdges: Set<string>,
): Route | null {
  const dist = new Map<string, number>(nodeIds.map((n) => [n, Infinity]))
  const prev = new Map<string, Step>()
  const done = new Set<string>()
  dist.set(src, 0)
  for (;;) {
    let u: string | null = null
    let best = Infinity
    for (const n of nodeIds) { const d = dist.get(n)!; if (!done.has(n) && d < best) { best = d; u = n } }
    if (u === null || u === dst) break
    done.add(u)
    for (const s of adj.get(u) ?? []) {
      if (bannedEdges.has(s.edge.id) || bannedNodes.has(s.to)) continue
      const nd = best + stepCost(s.edge)
      if (nd < dist.get(s.to)!) { dist.set(s.to, nd); prev.set(s.to, s) }
    }
  }
  if (!isFinite(dist.get(dst)!)) return null
  const steps: Step[] = []
  for (let v = dst; v !== src;) { const s = prev.get(v)!; steps.unshift(s); v = s.from }
  return { steps, nodes: [src, ...steps.map((s) => s.to)], cost: dist.get(dst)! }
}

/** Yen's algorithm for the k cheapest loop-free routes. Deterministic. */
function yen(g: GraphData, directed: boolean, src: string, dst: string, k: number): Route[] {
  const adj = buildAdjacency(g, directed)
  const ids = g.nodes.map((n) => n.id)
  const first = dijkstra(adj, ids, src, dst, new Set(), new Set())
  if (!first) return []
  const A: Route[] = [first]
  const B: Route[] = []
  const sig = (r: Route) => r.steps.map((s) => s.edge.id + (s.reversed ? 'r' : '')).join('|')
  while (A.length < k) {
    const last = A[A.length - 1]
    for (let i = 0; i < last.steps.length; i++) {
      const spur = last.nodes[i]
      const rootSteps = last.steps.slice(0, i)
      const bannedEdges = new Set<string>()
      A.forEach((p) => {
        if (p.steps.length > i && p.steps.slice(0, i).every((s, j) => s.edge.id === rootSteps[j].edge.id)) bannedEdges.add(p.steps[i].edge.id)
      })
      const bannedNodes = new Set(last.nodes.slice(0, i))
      const spurRoute = dijkstra(adj, ids, spur, dst, bannedNodes, bannedEdges)
      if (!spurRoute) continue
      const steps = [...rootSteps, ...spurRoute.steps]
      const route: Route = { steps, nodes: [src, ...steps.map((s) => s.to)], cost: steps.reduce((c, s) => c + stepCost(s.edge), 0) }
      if (!B.some((b) => sig(b) === sig(route)) && !A.some((a) => sig(a) === sig(route))) B.push(route)
    }
    if (!B.length) break
    B.sort((a, b) => a.cost - b.cost || sig(a).localeCompare(sig(b)))
    A.push(B.shift()!)
  }
  return A
}

function describe(g: GraphData, r: Route): FoundPath {
  const evs = r.steps.map((s) => s.edge.evidence)
  const weakest = evs.reduce<Evidence>((w, e) => (RANK[e] > RANK[w] ? e : w), 'strong')
  const cats = new Map(g.nodes.map((n) => [n.id, n.category]))
  const mid = r.nodes.slice(1, -1).map((id) => cats.get(id)!).filter((c, i, a) => a.indexOf(c) === i)
  return {
    nodeIds: r.nodes, edgeIds: r.steps.map((s) => s.edge.id), reversed: r.steps.map((s) => s.reversed),
    directed: r.steps.every((s) => !s.reversed), cost: r.cost, weakest,
    includesUser: evs.includes('user'), label: mid.length ? 'Via ' + mid.slice(0, 3).join(', ') : 'Direct link',
  }
}

/**
 * Finds up to k routes from `from` to `to`. Follows the stated direction of cause first.
 * Only if none exists does it fall back to an undirected search, and says so on each result.
 */
export function findPaths(g: GraphData, from: string, to: string, k = 3): FoundPath[] {
  if (from === to) return []
  let routes = yen(g, true, from, to, k)
  if (!routes.length) routes = yen(g, false, from, to, k)
  return routes.map((r) => describe(g, r))
}
