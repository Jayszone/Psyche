import type { GraphEdge, GraphNode } from './types'
import { hash01 } from './layout'

export type V3 = [number, number, number]

/** Control point for the gentle arc of an edge. Stable per edge id. */
export function edgeControl(a: V3, b: V3, id: string): V3 {
  const d: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
  const len = Math.hypot(d[0], d[1], d[2]) || 1
  // perpendicular in the horizontal plane
  let px = -d[2], pz = d[0]
  const pl = Math.hypot(px, pz) || 1
  px /= pl; pz /= pl
  const sign = hash01(id) > 0.5 ? 1 : -1
  const k = len * 0.13 * sign
  return [(a[0] + b[0]) / 2 + px * k, (a[1] + b[1]) / 2 + len * 0.05, (a[2] + b[2]) / 2 + pz * k]
}

export function bezier(a: V3, c: V3, b: V3, t: number): V3 {
  const u = 1 - t
  return [
    u * u * a[0] + 2 * u * t * c[0] + t * t * b[0],
    u * u * a[1] + 2 * u * t * c[1] + t * t * b[1],
    u * u * a[2] + 2 * u * t * c[2] + t * t * b[2],
  ]
}

export function edgeEndpoints(e: GraphEdge, byId: Map<string, GraphNode>) {
  const s = byId.get(e.source), t = byId.get(e.target)
  return s && t ? { a: s.position, b: t.position, c: edgeControl(s.position, t.position, e.id) } : null
}
