import type { FoundPath, GraphData, GraphNode } from './types'
import { bezier, edgeControl, type V3 } from './geometry'

export interface Segment { a: V3; c: V3; b: V3; len: number }
export interface JourneyGeom {
  steps: number
  nodes: V3[]
  segments: Segment[]
  /** Position along the whole route; t runs 0..steps, integers are nodes. */
  pointAt(t: number): V3
  /** Preferred camera distance while travelling at t. */
  radiusAt(t: number): number
  /** A side-on viewing angle that keeps the route readable without spinning the camera. */
  view: { th: number; ph: number }
  bounds: { center: V3; size: number }
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

export function buildJourneyGeom(path: FoundPath, graph: GraphData): JourneyGeom {
  const byId = new Map<string, GraphNode>(graph.nodes.map((n) => [n.id, n]))
  const edgeById = new Map(graph.edges.map((e) => [e.id, e]))
  const nodes = path.nodeIds.map((id) => byId.get(id)!.position)
  const segments: Segment[] = path.edgeIds.map((eid, i) => {
    const e = edgeById.get(eid)!
    const s = byId.get(e.source)!.position, t = byId.get(e.target)!.position
    const c = edgeControl(s, t, e.id)
    const a = nodes[i], b = nodes[i + 1]
    let len = 0, prev = a
    for (let k = 1; k <= 12; k++) { const p = bezier(a, c, b, k / 12); len += Math.hypot(p[0] - prev[0], p[1] - prev[1], p[2] - prev[2]); prev = p }
    return { a, c, b, len }
  })
  const steps = segments.length
  const pointAt = (t: number): V3 => {
    if (!steps) return nodes[0]
    const tt = clamp(t, 0, steps)
    const i = Math.min(steps - 1, Math.floor(tt))
    const s = tt - i
    const seg = segments[i]
    return bezier(seg.a, seg.c, seg.b, s)
  }
  const radiusAt = (t: number) => {
    if (!steps) return 16
    const tt = clamp(t, 0, steps - 0.0001)
    const i = Math.floor(tt), s = tt - i
    const l = segments[i].len * (1 - s) + (segments[Math.min(steps - 1, i + 1)].len) * s
    return clamp(l * 0.5 + 9, 14, 32)
  }
  // Viewing angle: perpendicular to the overall direction of travel, slightly from above.
  const start = nodes[0], end = nodes[nodes.length - 1]
  let dx = end[0] - start[0], dz = end[2] - start[2]
  const dl = Math.hypot(dx, dz) || 1
  dx /= dl; dz /= dl
  let sx = -dz, sz = dx
  const dir: V3 = [sx, 0.38, sz]
  const dn = Math.hypot(...dir)
  const th = Math.atan2(dir[2] / dn, dir[0] / dn)
  const ph = Math.acos(dir[1] / dn)
  // Bounds from sampled points
  const min: V3 = [Infinity, Infinity, Infinity], max: V3 = [-Infinity, -Infinity, -Infinity]
  for (let t = 0; t <= steps; t += 0.25) {
    const p = pointAt(t)
    for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], p[k]); max[k] = Math.max(max[k], p[k]) }
  }
  const center: V3 = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2]
  const size = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2])
  return { steps, nodes, segments, pointAt, radiusAt, view: { th, ph }, bounds: { center, size } }
}

/** Mutable runtime state shared between the store, the camera and the 3D layers. */
export const journeyRuntime = {
  geom: null as JourneyGeom | null,
  /** Smoothed progress along the route, driven toward the integer step by a spring. */
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
