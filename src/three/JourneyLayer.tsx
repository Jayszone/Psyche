import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { useStore } from '../state/store'
import { journeyRuntime, type JourneyGeom } from '../graph/journey'
import { motionUniform, timeUniform } from './scale'
import type { Evidence } from '../graph/types'

const STYLE: Record<Evidence, number> = { strong: 0, plausible: 1, speculative: 2, user: 3 }

const tubeVert = /* glsl */ `
attribute float aT; attribute float aStyle; attribute float aLen;
varying float vT; varying float vStyle; varying float vLen; varying vec3 vN; varying vec3 vV;
void main(){
  vT = aT; vStyle = aStyle; vLen = aLen; vN = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position,1.0); vV = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}`
const tubeFrag = /* glsl */ `
varying float vT; varying float vStyle; varying float vLen; varying vec3 vN; varying vec3 vV;
uniform float uProgress; uniform float uTime; uniform float uGain; uniform float uMotion;
void main(){
  float facing = abs(dot(normalize(vN), normalize(vV)));
  float body = pow(facing, 1.6);
  float seg = floor(vT + 0.00001); float u = vT - seg;
  float travelled = smoothstep(uProgress + 0.0001, uProgress - 0.05, vT);
  float head = exp(-pow((vT - uProgress) * 9.0, 2.0)) * step(vT, uProgress + 0.2);
  float pat = 1.0; vec3 col = mix(vec3(0.45,0.72,1.0), vec3(0.91,0.93,0.99), 0.55);
  float dist = u * vLen;
  if (vStyle > 2.5) { col = vec3(0.84,0.88,0.97); pat = smoothstep(0.30,0.22,abs(fract(dist*0.9)-0.5)); }
  else if (vStyle > 1.5) { col = vec3(0.60,0.52,0.96); pat = 0.35 + 0.65*smoothstep(0.4,0.9,0.5+0.5*sin(dist*0.8 - uTime*0.9*uMotion)); }
  else if (vStyle > 0.5) { col = vec3(0.45,0.72,1.0); float f = fract(dist*0.45); pat = smoothstep(0.0,0.07,f)*smoothstep(0.78,0.66,f); }
  else { pat = 0.9 + 0.1*sin(dist*0.5 - uTime*1.6*uMotion); }
  float a = (travelled * pat * body + head * 0.6 * body) * uGain;
  gl_FragColor = vec4(col * (1.0 + head), a);
}`

const ptVert = /* glsl */ `
attribute float aSize; attribute float aAlpha; uniform float uPx; varying float vA;
void main(){ vA = aAlpha; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mv;
  gl_PointSize = aSize * uPx * clamp(26.0 / -mv.z, 0.4, 4.0); }`
const ptFrag = /* glsl */ `
varying float vA; void main(){ float d = length(gl_PointCoord-0.5)*2.0; float a = pow(smoothstep(1.0,0.0,d), 1.7);
  gl_FragColor = vec4(mix(vec3(0.74,0.84,1.0), vec3(1.0), a*a), a * vA); }`

function buildTube(geom: JourneyGeom, styles: number[], radius: number) {
  const parts = geom.segments.map((s, i) => {
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(...s.a), new THREE.Vector3(...s.c), new THREE.Vector3(...s.b))
    const g = new THREE.TubeGeometry(curve, 56, radius, 8, false)
    const n = g.getAttribute('position').count
    const uv = g.getAttribute('uv')
    const aT = new Float32Array(n), aStyle = new Float32Array(n).fill(styles[i]), aLen = new Float32Array(n).fill(s.len)
    for (let v = 0; v < n; v++) aT[v] = i + uv.getX(v)
    g.setAttribute('aT', new THREE.BufferAttribute(aT, 1))
    g.setAttribute('aStyle', new THREE.BufferAttribute(aStyle, 1))
    g.setAttribute('aLen', new THREE.BufferAttribute(aLen, 1))
    return g
  })
  return parts.length ? mergeGeometries(parts, false) : null
}

const N_TRAIL = 8, N_FLOW = 6

/** The selected chain: a luminous tube revealed with the journey, plus particles travelling along it. */
export function JourneyLayer() {
  const mode = useStore((s) => s.mode)
  const routes = useStore((s) => s.routes)
  const routeIdx = useStore((s) => s.routeIdx)
  const graph = useStore((s) => s.graph)
  const route = mode === 'journey' ? routes[routeIdx] : null
  const geom = journeyRuntime.geom
  const px = useRef(Math.min(2, typeof devicePixelRatio === 'number' ? devicePixelRatio : 1))

  const edgeStyles = useMemo(() => {
    if (!route) return []
    const byId = new Map(graph.edges.map((e) => [e.id, e]))
    return route.edgeIds.map((id) => STYLE[byId.get(id)!.evidence])
  }, [route, graph])

  const tubes = useMemo(() => {
    if (!route || !geom) return null
    const mk = (r: number, gain: number) => {
      const g = buildTube(geom, edgeStyles, r)
      const m = new THREE.ShaderMaterial({
        vertexShader: tubeVert, fragmentShader: tubeFrag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { uProgress: { value: 0 }, uTime: timeUniform, uGain: { value: gain }, uMotion: motionUniform },
      })
      return g ? { g, m } : null
    }
    return { core: mk(0.085, 1), halo: mk(0.3, 0.2) }
    // geom changes with route
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, geom, edgeStyles])

  useEffect(() => () => { tubes?.core?.g.dispose(); tubes?.halo?.g.dispose(); tubes?.core?.m.dispose(); tubes?.halo?.m.dispose() }, [tubes])

  const pts = useMemo(() => {
    const n = N_TRAIL + N_FLOW
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3))
    g.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(n), 1))
    g.setAttribute('aAlpha', new THREE.BufferAttribute(new Float32Array(n), 1))
    const m = new THREE.ShaderMaterial({
      vertexShader: ptVert, fragmentShader: ptFrag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uPx: { value: px.current } },
    })
    return { g, m }
  }, [])

  useFrame((_, dt) => {
    const st = useStore.getState()
    const geomNow = journeyRuntime.geom
    if (st.mode !== 'journey' || !geomNow || !st.journey) { journeyRuntime.t = 0; journeyRuntime.v = 0; (pts.g.getAttribute('aAlpha') as THREE.BufferAttribute).array.fill(0); (pts.g.getAttribute('aAlpha') as THREE.BufferAttribute).needsUpdate = true; return }
    // Spring the continuous progress toward the integer step: smooth travel, soft arrival.
    const target = st.journey.overview ? geomNow.steps : st.journey.step
    if (!st.journey.ready && !st.journey.overview) { journeyRuntime.t = 0 }
    else if (st.settings.reduced) { journeyRuntime.t = target; journeyRuntime.v = 0 }
    else {
      const K = 6.5, c = 2 * Math.sqrt(K)
      journeyRuntime.v += ((target - journeyRuntime.t) * K - journeyRuntime.v * c) * Math.min(dt, 0.05)
      journeyRuntime.t += journeyRuntime.v * Math.min(dt, 0.05)
      if (Math.abs(target - journeyRuntime.t) < 0.0005 && Math.abs(journeyRuntime.v) < 0.001) { journeyRuntime.t = target; journeyRuntime.v = 0 }
    }
    const t = journeyRuntime.t
    const prog = st.journey.ready || st.journey.overview ? t + 0.02 : 0
    if (tubes?.core) tubes.core.m.uniforms.uProgress.value = prog
    if (tubes?.halo) tubes.halo.m.uniforms.uProgress.value = prog

    const P = pts.g.getAttribute('position') as THREE.BufferAttribute
    const S = pts.g.getAttribute('aSize') as THREE.BufferAttribute
    const A = pts.g.getAttribute('aAlpha') as THREE.BufferAttribute
    const time = timeUniform.value
    const moving = st.settings.reduced ? 0 : 1
    const alive = st.journey.ready || st.journey.overview
    for (let i = 0; i < N_TRAIL; i++) {
      const tt = Math.max(0, t - i * 0.07 * (moving ? 1 : 0))
      const p = geomNow.pointAt(tt)
      P.setXYZ(i, p[0], p[1], p[2])
      S.setX(i, i === 0 ? 14 : 9 * (1 - i / N_TRAIL))
      A.setX(i, alive ? (i === 0 ? 1 : 0.7 * (1 - i / N_TRAIL)) : 0)
    }
    for (let j = 0; j < N_FLOW; j++) {
      const idx = N_TRAIL + j
      const reach = Math.max(0.0001, st.journey.overview ? geomNow.steps : t)
      const f = moving ? ((time * 0.16 + j / N_FLOW) % 1) : j / N_FLOW
      const p = geomNow.pointAt(f * reach)
      P.setXYZ(idx, p[0], p[1], p[2])
      S.setX(idx, 6)
      A.setX(idx, alive && reach > 0.05 ? 0.45 * Math.sin(Math.PI * f) : 0)
    }
    P.needsUpdate = S.needsUpdate = A.needsUpdate = true
  })

  return (
    <>
      {tubes?.halo && <mesh geometry={tubes.halo.g} material={tubes.halo.m} frustumCulled={false} renderOrder={20} />}
      {tubes?.core && <mesh geometry={tubes.core.g} material={tubes.core.m} frustumCulled={false} renderOrder={21} />}
      <points geometry={pts.g} material={pts.m} frustumCulled={false} renderOrder={22} />
    </>
  )
}
