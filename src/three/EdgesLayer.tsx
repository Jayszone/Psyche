import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore, effects } from '../state/store'
import { cubic, edgeEndpoints } from '../graph/geometry'
import { hash01 } from '../graph/layout'
import { getFocus } from './focus'
import { proj } from './projection'
import { categoryRgb, motionUniform, timeUniform } from './scale'
import type { Evidence } from '../graph/types'

const SEG = 24
const STYLE: Record<Evidence, number> = { strong: 0, plausible: 1, speculative: 2, user: 3 }
const BASE: Record<Evidence, number> = { strong: 0.36, plausible: 0.27, speculative: 0.19, user: 0.55 }
const WIDTH: Record<Evidence, number> = { strong: 1.25, plausible: 1.0, speculative: 0.85, user: 1.35 }

const vert = /* glsl */ `
attribute vec3 aP1; attribute vec4 aSeg; attribute vec4 aMeta; attribute vec3 aCa; attribute vec3 aCb; attribute vec2 aDyn;
uniform vec2 uRes; uniform float uWidthScale;
varying float vU; varying float vSide; varying vec4 vMeta; varying vec3 vCol; varying vec2 vDyn;
void main(){
  vec4 c0 = projectionMatrix * viewMatrix * vec4(position, 1.0);
  vec4 c1 = projectionMatrix * viewMatrix * vec4(aP1, 1.0);
  vec4 pc = mix(c0, c1, aSeg.x);
  float ok = step(0.2, c0.w) * step(0.2, c1.w);
  vec2 s0 = c0.xy / max(c0.w, 0.2) * uRes * 0.5;
  vec2 s1 = c1.xy / max(c1.w, 0.2) * uRes * 0.5;
  vec2 dir = s1 - s0; float dl = length(dir);
  dir = dl > 0.0001 ? dir / dl : vec2(1.0, 0.0);
  vec2 nrm = vec2(-dir.y, dir.x);
  float w = aMeta.y * uWidthScale * (0.55 + 0.45 * min(1.0, 30.0 / max(pc.w, 1.0)));
  vec2 offNdc = nrm * aSeg.y * w * 2.0 / uRes;
  gl_Position = vec4(pc.xy + offNdc * pc.w, pc.z, pc.w);
  vU = mix(aSeg.z, aSeg.w, aSeg.x); vSide = aSeg.y; vMeta = aMeta;
  vCol = mix(aCa, aCb, vU); vDyn = aDyn * ok;
}`
const frag = /* glsl */ `
varying float vU; varying float vSide; varying vec4 vMeta; varying vec3 vCol; varying vec2 vDyn;
uniform float uTime; uniform float uMotion; uniform float uPulse;
void main(){
  float style = vMeta.x, seed = vMeta.z, len = vMeta.w;
  float cover = 1.0 - smoothstep(0.3, 1.0, abs(vSide));
  float dist = vU * len;
  float pat = 1.0; vec3 col = vCol;
  if (style > 2.5) { pat = smoothstep(0.36, 0.24, abs(fract(dist * 0.8) - 0.5)); col = mix(vec3(0.86, 0.88, 0.97), vec3(1.0, 0.93, 0.8), 0.4); }
  else if (style > 1.5) { pat = 0.2 + 0.8 * smoothstep(0.35, 0.95, 0.5 + 0.5 * sin(dist * 0.21 - uTime * 0.3 * uMotion + seed * 30.0)); col = mix(col, vec3(0.6, 0.52, 0.96), 0.5); }
  else if (style > 0.5) { float f = fract(dist * 0.3); pat = smoothstep(0.0, 0.07, f) * smoothstep(0.68, 0.58, f); }
  float n = floor(len / 55.0) + 1.0;
  float speed = 0.05 + 0.07 * fract(seed * 7.0);
  float d = fract((vU - uTime * speed * uMotion - seed) * n) - 0.5;
  float sigma = 3.4 * n / len;
  float pulse = exp(-d * d / (2.0 * sigma * sigma));
  float pk = style < 0.5 ? 1.0 : style < 1.5 ? 0.75 : style < 2.5 ? 0.38 : 0.0;
  pulse *= pk * vDyn.y * uPulse;
  float endFade = smoothstep(0.0, 0.05, vU) * smoothstep(1.0, 0.95, vU);
  float inten = (vDyn.x * pat + pulse * 0.9) * cover * endFade;
  vec3 c = mix(col, vec3(0.93, 0.97, 1.0), clamp(pulse * 0.85, 0.0, 0.85));
  gl_FragColor = vec4(c, inten);
}`

const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }

/** Every relationship as a neural filament: an S-curved ribbon with evidence-specific texture and travelling impulses.
 *  Visibility depends on proximity and relevance, so the web reveals itself rather than filling the screen. */
export function EdgesLayer() {
  const graph = useStore((s) => s.graph)
  const version = useStore((s) => s.graphVersion)
  const { size, gl } = useThree()
  const dyn = useRef({ alpha: new Float32Array(0), flow: new Float32Array(0) })

  const built = useMemo(() => {
    const byId = new Map(graph.nodes.map((n) => [n.id, n]))
    const edges = graph.edges.filter((e) => edgeEndpoints(e, byId))
    const nV = edges.length * SEG * 4
    const P0 = new Float32Array(nV * 3), P1 = new Float32Array(nV * 3), segA = new Float32Array(nV * 4), meta = new Float32Array(nV * 4)
    const ca = new Float32Array(nV * 3), cb = new Float32Array(nV * 3), dynA = new Float32Array(nV * 2)
    const index = new Uint32Array(edges.length * SEG * 6)
    const mid: number[] = [], imp: number[] = [], cross: boolean[] = [], lens: number[] = []
    edges.forEach((e, ei) => {
      const ep = edgeEndpoints(e, byId)!
      const A = byId.get(e.source)!, B = byId.get(e.target)!
      const colA = categoryRgb(A.category), colB = categoryRgb(B.category)
      const pts: [number, number, number][] = []
      const us: number[] = []
      let acc = 0
      for (let s = 0; s <= SEG; s++) {
        const t = s / SEG, p = cubic(ep.a, ep.c1, ep.c2, ep.b, t)
        if (s > 0) acc += Math.hypot(p[0] - pts[s - 1][0], p[1] - pts[s - 1][1], p[2] - pts[s - 1][2])
        pts.push(p); us.push(t)
      }
      const m = cubic(ep.a, ep.c1, ep.c2, ep.b, 0.5)
      mid.push(m[0], m[1], m[2]); imp.push((A.importance + B.importance) / 2); cross.push(A.category !== B.category); lens.push(acc)
      const width = WIDTH[e.evidence] * (0.85 + 0.5 * (A.importance + B.importance) / 2)
      const seed = hash01(e.id)
      for (let s = 0; s < SEG; s++) {
        for (let q = 0; q < 4; q++) {
          const end = q >> 1, side = q & 1 ? 1 : -1
          const v = (ei * SEG + s) * 4 + q
          P0.set(pts[s], v * 3); P1.set(pts[s + 1], v * 3)
          segA.set([end, side, us[s], us[s + 1]], v * 4)
          meta.set([STYLE[e.evidence], width, seed, acc], v * 4)
          ca.set(colA, v * 3); cb.set(colB, v * 3)
        }
        const b = (ei * SEG + s) * 4, i = (ei * SEG + s) * 6
        index.set([b, b + 1, b + 2, b + 2, b + 1, b + 3], i)
      }
    })
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(P0, 3))
    g.setAttribute('aP1', new THREE.BufferAttribute(P1, 3))
    g.setAttribute('aSeg', new THREE.BufferAttribute(segA, 4))
    g.setAttribute('aMeta', new THREE.BufferAttribute(meta, 4))
    g.setAttribute('aCa', new THREE.BufferAttribute(ca, 3))
    g.setAttribute('aCb', new THREE.BufferAttribute(cb, 3))
    const d = new THREE.BufferAttribute(dynA, 2); d.setUsage(THREE.DynamicDrawUsage); g.setAttribute('aDyn', d)
    g.setIndex(new THREE.BufferAttribute(index, 1))
    dyn.current = { alpha: new Float32Array(edges.length), flow: new Float32Array(edges.length) }
    return { geo: g, edges, mid, imp, cross, lens, A: edges.map((e) => byId.get(e.source)!), B: edges.map((e) => byId.get(e.target)!) }
  }, [graph, version])

  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    uniforms: { uRes: { value: new THREE.Vector2(1, 1) }, uWidthScale: { value: 1 }, uTime: timeUniform, uMotion: motionUniform, uPulse: { value: 1 } },
  }), [])

  useFrame(({ camera }, dt) => {
    const st = useStore.getState()
    const F = getFocus()
    const dpr = gl.getPixelRatio()
    mat.uniforms.uRes.value.set(size.width * dpr, size.height * dpr)
    mat.uniforms.uWidthScale.value = dpr
    mat.uniforms.uPulse.value = st.settings.reduced ? 0 : 1
    const attr = built.geo.getAttribute('aDyn') as THREE.BufferAttribute
    const arr = attr.array as Float32Array
    const k = 1 - Math.exp(-dt * 6)
    const cp = camera.position
    const tg = proj.camTarget
    const now = performance.now()
    const { alpha, flow } = dyn.current
    built.edges.forEach((e, i) => {
      const mx = built.mid[i * 3], my = built.mid[i * 3 + 1], mz = built.mid[i * 3 + 2]
      const dc = Math.hypot(mx - cp.x, my - cp.y, mz - cp.z)
      const dT = Math.hypot(mx - tg[0], my - tg[1], mz - tg[2])
      // Edges belong to the region you are looking at. Long threads fade; important trunks stay as faint cables.
      const lenF = smooth(150, 40, built.lens[i])
      let vis = 0.08 + 0.92 * smooth(150, 22, dT)
      const trunk = built.cross[i] && built.imp[i] > 0.6
      if (trunk) vis = Math.max(vis, 0.17)
      let a = BASE[e.evidence] * vis * (0.3 + 0.7 * lenF), fl = vis * 0.22
      const touches = F.focusId && (e.source === F.focusId || e.target === F.focusId)
      if (F.journey) {
        if (F.routeEdges.has(e.id)) { a = BASE[e.evidence] * 0.6; fl = 0.5 } else { a *= 0.08; fl = 0 }
      } else if (F.focusId) {
        if (touches) { a = Math.min(1, BASE[e.evidence] * 2.7); fl = 1 }
        else if (F.neighbors.has(e.source) && F.neighbors.has(e.target)) { a = Math.max(a * 0.5, BASE[e.evidence] * 0.7); fl = 0.45 }
        else a *= 0.1
      }
      if (st.drag && (e.source === st.drag.source || e.target === st.drag.source)) { a = Math.max(a, 0.7); fl = 1 }
      const fl0 = effects.flashEdge.get(e.id)
      if (fl0 !== undefined) { const age = (now - fl0) / 2200; if (age < 1) { a += (1 - age) * 0.9; fl = 1 } else effects.flashEdge.delete(e.id) }
      a *= 1 - 0.4 * smooth(220, 520, dc)
      alpha[i] += (Math.min(a, 1) - alpha[i]) * k
      flow[i] += (fl - flow[i]) * k
      const base = i * SEG * 4
      for (let v = 0; v < SEG * 4; v++) { arr[(base + v) * 2] = alpha[i]; arr[(base + v) * 2 + 1] = flow[i] }
    })
    attr.needsUpdate = true
  })

  return <mesh geometry={built.geo} material={mat} frustumCulled={false} renderOrder={5} />
}
