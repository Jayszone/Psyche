import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore, effects } from '../state/store'
import { bezier, edgeEndpoints } from '../graph/geometry'
import { categoryRgb, motionUniform, timeUniform } from './scale'
import type { Evidence } from '../graph/types'

const SEG = 18
const STYLE: Record<Evidence, number> = { strong: 0, plausible: 1, speculative: 2, user: 3 }
const BASE: Record<Evidence, number> = { strong: 0.42, plausible: 0.32, speculative: 0.22, user: 0.5 }

const vert = /* glsl */ `
attribute vec3 aColor; attribute float aDist; attribute float aStyle; attribute float aAlpha; attribute float aU;
varying vec3 vColor; varying float vDist; varying float vStyle; varying float vAlpha; varying float vU;
void main(){ vColor = aColor; vDist = aDist; vStyle = aStyle; vAlpha = aAlpha; vU = aU; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`
const frag = /* glsl */ `
varying vec3 vColor; varying float vDist; varying float vStyle; varying float vAlpha; varying float vU;
uniform float uTime; uniform float uMotion;
void main(){
  float pat = 1.0; vec3 col = vColor;
  if (vStyle > 2.5) { col = vec3(0.84, 0.88, 0.97); pat = smoothstep(0.30, 0.22, abs(fract(vDist * 0.9) - 0.5)); }
  else if (vStyle > 1.5) { float w = 0.5 + 0.5 * sin(vDist * 0.35 - uTime * 0.45 * uMotion); pat = smoothstep(0.55, 0.95, w) * 0.85 + 0.05; }
  else if (vStyle > 0.5) { float f = fract(vDist * 0.42); pat = smoothstep(0.0, 0.06, f) * smoothstep(0.70, 0.60, f); }
  else { pat = 0.82 + 0.18 * sin(vDist * 0.22 - uTime * 0.8 * uMotion); }
  float fade = smoothstep(0.0, 0.07, vU) * smoothstep(1.0, 0.93, vU);
  gl_FragColor = vec4(col, vAlpha * pat * fade);
}`

/** Every relationship as a delicate thread. Evidence level decides the thread's character. */
export function EdgesLayer() {
  const graph = useStore((s) => s.graph)
  const version = useStore((s) => s.graphVersion)
  const lines = useRef<THREE.LineSegments>(null)
  const cur = useRef<Float32Array>(new Float32Array(0))

  const built = useMemo(() => {
    const byId = new Map(graph.nodes.map((n) => [n.id, n]))
    const edges = graph.edges.filter((e) => edgeEndpoints(e, byId))
    const verts = edges.length * SEG * 2
    const pos = new Float32Array(verts * 3), col = new Float32Array(verts * 3)
    const dist = new Float32Array(verts), style = new Float32Array(verts), alpha = new Float32Array(verts), u = new Float32Array(verts)
    edges.forEach((e, ei) => {
      const ep = edgeEndpoints(e, byId)!
      const ca = categoryRgb(byId.get(e.source)!.category), cb = categoryRgb(byId.get(e.target)!.category)
      let acc = 0
      let prev = ep.a
      const pts: { p: [number, number, number]; d: number; t: number }[] = []
      for (let s = 0; s <= SEG; s++) {
        const t = s / SEG, p = bezier(ep.a, ep.c, ep.b, t)
        if (s > 0) acc += Math.hypot(p[0] - prev[0], p[1] - prev[1], p[2] - prev[2])
        pts.push({ p, d: acc, t }); prev = p
      }
      for (let s = 0; s < SEG; s++) {
        for (let side = 0; side < 2; side++) {
          const q = pts[s + side], vi = (ei * SEG + s) * 2 + side
          pos.set(q.p, vi * 3)
          col.set([ca[0] + (cb[0] - ca[0]) * q.t, ca[1] + (cb[1] - ca[1]) * q.t, ca[2] + (cb[2] - ca[2]) * q.t], vi * 3)
          dist[vi] = q.d; style[vi] = STYLE[e.evidence]; u[vi] = q.t
        }
      }
    })
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aColor', new THREE.BufferAttribute(col, 3))
    g.setAttribute('aDist', new THREE.BufferAttribute(dist, 1))
    g.setAttribute('aStyle', new THREE.BufferAttribute(style, 1))
    g.setAttribute('aU', new THREE.BufferAttribute(u, 1))
    const a = new THREE.BufferAttribute(alpha, 1); a.setUsage(THREE.DynamicDrawUsage); g.setAttribute('aAlpha', a)
    cur.current = new Float32Array(edges.length)
    return { geo: g, edges, cats: edges.map((e) => [byId.get(e.source)!.category, byId.get(e.target)!.category]) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph, version])

  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: timeUniform, uMotion: motionUniform },
  }), [])

  useFrame((_, dt) => {
    const st = useStore.getState()
    const { selectedId, hoveredId, mode, routes, routeIdx, drag } = st
    const attr = built.geo.getAttribute('aAlpha') as THREE.BufferAttribute
    const arr = attr.array as Float32Array
    const k = 1 - Math.exp(-dt * 6)
    const focus = selectedId ?? hoveredId
    const routeEdges = mode === 'journey' ? new Set(routes[routeIdx]?.edgeIds ?? []) : null
    const farZoom = Math.min(1, Math.max(0, (st.zoomLevel === 'universe' ? 1 : 0)))
    const now = performance.now()
    built.edges.forEach((e, i) => {
      let t = BASE[e.evidence]
      const cross = built.cats[i][0] !== built.cats[i][1]
      if (farZoom && !focus) t *= cross ? 0.5 : 0.75
      if (focus) t *= e.source === focus || e.target === focus ? 2.4 : 0.4
      if (routeEdges) t *= routeEdges.has(e.id) ? 0.55 : 0.12
      if (drag && (e.source === drag.source || e.target === drag.source)) t *= 1.6
      const flash = effects.flashEdge.get(e.id)
      if (flash !== undefined) { const age = (now - flash) / 2200; if (age < 1) t += (1 - age) * 0.9; else effects.flashEdge.delete(e.id) }
      cur.current[i] += (Math.min(t, 1) - cur.current[i]) * k
      const base = i * SEG * 2
      for (let v = 0; v < SEG * 2; v++) arr[base + v] = cur.current[i]
    })
    attr.needsUpdate = true
  })

  return <lineSegments ref={lines} geometry={built.geo} material={mat} frustumCulled={false} renderOrder={5} />
}
