import type { FoundPath, GraphData, GraphNode } from './types'
import { cubic, edgeControls, type V3 } from './geometry'

export interface Segment { a: V3; c1: V3; c2: V3; b: V3; len: number }
export interface RailPose { pos: V3; look: V3 }
export interface JourneyGeom {
  steps: number
  nodes: V3[]
  segments: Segment[]
  /** Position along the whole route; t runs 0..steps, integers are nodes. */
  pointAt(t: number): V3
  /** Direction of travel at t (unit vector). */
  tangentAt(t: number): V3
  /** Camera pose for travelling along the route: behind and beside the head, looking ahead. */
  railAt(t: number): RailPose
  bounds: { center: V3; size: number }
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
const norm = (v: V3): V3 => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l] }

export function buildJourneyGeom(path: FoundPath, graph: GraphData): JourneyGeom {
  const byId = new Map<string, GraphNode>(graph.nodes.map((n) => [n.id, n]))
  const edgeById = new Map(graph.edges.map((e) => [e.id, e]))
  const nodes = path.nodeIds.map((id) => byId.get(id)!.position)
  const segments: Segment[] = path.edgeIds.map((eid, i) => {
    const e = edgeById.get(eid)!
    const [c1, c2] = edgeControls(byId.get(e.source)!.position, byId.get(e.target)!.position, e.id)
    const rev = path.reversed[i]
    const a = nodes[i], b = nodes[i + 1]
    // the stored controls belong to source->target; walking it backwards swaps them
    const k1 = rev ? c2 : c1, k2 = rev ? c1 : c2
    let len = 0, prev = a
    for (let k = 1; k <= 16; k++) { const p = cubic(a, k1, k2, b, k / 16); len += Math.hypot(p[0] - prev[0], p[1] - prev[1], p[2] - prev[2]); prev = p }
    return { a, c1: k1, c2: k2, b, len }
  })
  const steps = segments.length
  const pointAt = (t: number): V3 => {
    if (!steps) return nodes[0]
    const tt = clamp(t, 0, steps)
    const i = Math.min(steps - 1, Math.floor(tt))
    const s = segments[i]
    return cubic(s.a, s.c1, s.c2, s.b, tt - i)
  }
  const tangentAt = (t: number): V3 => {
    const a = pointAt(t - 0.03), b = pointAt(t + 0.03)
    return norm([b[0] - a[0], b[1] - a[1], b[2] - a[2]])
  }
  const lenAt = (t: number) => {
    if (!steps) return 30
    const tt = clamp(t, 0, steps - 0.0001), i = Math.floor(tt), s = tt - i
    return segments[i].len * (1 - s) + segments[Math.min(steps - 1, i + 1)].len * s
  }
  const railAt = (t: number): RailPose => {
    const P = pointAt(t)
    const T = tangentAt(t)
    const L = lenAt(t)
    const up: V3 = [0, 1, 0]
    // side vector: horizontal, perpendicular to travel
    let S: V3 = [T[1] * up[2] - T[2] * up[1], T[2] * up[0] - T[0] * up[2], T[0] * up[1] - T[1] * up[0]]
    S = Math.hypot(...S) < 0.05 ? [1, 0, 0] : norm(S)
    const back = clamp(L * 0.12, 7, 18), side = clamp(L * 0.07, 4.5, 11), lift = clamp(L * 0.05, 2.5, 7)
    const ahead = pointAt(Math.min(steps, t + 0.5))
    return {
      pos: [P[0] - T[0] * back + S[0] * side, P[1] - T[1] * back + lift, P[2] - T[2] * back + S[2] * side],
      look: [P[0] * 0.45 + ahead[0] * 0.55, P[1] * 0.45 + ahead[1] * 0.55, P[2] * 0.45 + ahead[2] * 0.55],
    }
  }
  const min: V3 = [Infinity, Infinity, Infinity], max: V3 = [-Infinity, -Infinity, -Infinity]
  for (let t = 0; t <= steps; t += 0.25) {
    const p = pointAt(t)
    for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], p[k]); max[k] = Math.max(max[k], p[k]) }
  }
  const center: V3 = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2]
  const size = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2])
  return { steps, nodes, segments, pointAt, tangentAt, railAt, bounds: { center, size } }
}

/** Mutable runtime state shared between the store, the camera and the 3D layers. */
export const journeyRuntime = {
  geom: null as JourneyGeom | null,
  /** Continuous progress along the route; integers are nodes. */
  t: 0,
  v: 0,
}

export function describePath(path: FoundPath, graph: GraphData): string {
  const byId = new Map(graph.nodes.map((n) => [n.id, n]))
  const edgeById = new Map(graph.edges.map((e) => [e.id, e]))
  const parts = path.nodeIds.map((id, i) => {
    const label = byId.get(id)?.label ?? id
    if (i === path.edgeIds.length) return label
    const e = edgeById.get(path.edgeIds[i])!
    return `${label}, then ${e.evidence === 'user' ? 'your own link' : e.evidence + ' link'}`
  })
  return `Route of ${path.edgeIds.length} steps. ${parts.join('. ')}. ${path.directed ? '' : 'Some links are read against their stated direction. '}These are hypotheses, not findings.`
}
