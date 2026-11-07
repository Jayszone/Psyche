import type { GraphEdge, GraphNode } from './types'
import { hash01 } from './layout'

export type V3 = [number, number, number]

/**
 * Edges are drawn as soft S-shaped filaments rather than straight lines.
 * Two control points push the curve sideways in opposite directions, stable per edge id.
 */
export function edgeControls(a: V3, b: V3, id: string): [V3, V3] {
  const d: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
  const len = Math.hypot(d[0], d[1], d[2]) || 1
  let px = -d[2], pz = d[0]
  const pl = Math.hypot(px, pz) || 1
  px /= pl; pz /= pl
  const s1 = (hash01(id) - 0.5) * 2, s2 = (hash01(id + 'b') - 0.5) * 2
  const k1 = len * (0.1 + 0.1 * Math.abs(s1)) * Math.sign(s1 || 1)
  const k2 = len * (0.08 + 0.1 * Math.abs(s2)) * -Math.sign(s1 || 1)
  const lift = len * 0.09 * (hash01(id + 'c') - 0.5) * 2
  return [
    [a[0] + d[0] * 0.33 + px * k1, a[1] + d[1] * 0.33 + lift, a[2] + d[2] * 0.33 + pz * k1],
    [a[0] + d[0] * 0.68 + px * k2, a[1] + d[1] * 0.68 - lift * 0.6, a[2] + d[2] * 0.68 + pz * k2],
  ]
}

export function cubic(a: V3, c1: V3, c2: V3, b: V3, t: number): V3 {
  const u = 1 - t, uu = u * u, tt = t * t
  const w0 = uu * u, w1 = 3 * uu * t, w2 = 3 * u * tt, w3 = tt * t
  return [
    w0 * a[0] + w1 * c1[0] + w2 * c2[0] + w3 * b[0],
    w0 * a[1] + w1 * c1[1] + w2 * c2[1] + w3 * b[1],
    w0 * a[2] + w1 * c1[2] + w2 * c2[2] + w3 * b[2],
  ]
}

export function edgeEndpoints(e: GraphEdge, byId: Map<string, GraphNode>) {
  const s = byId.get(e.source), t = byId.get(e.target)
  if (!s || !t) return null
  const [c1, c2] = edgeControls(s.position, t.position, e.id)
  return { a: s.position, b: t.position, c1, c2 }
}
