import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore, effects } from '../state/store'
import { journeyRuntime } from '../graph/journey'
import { getFocus } from './focus'
import { proj } from './projection'
import { TIER_FAR, baseNodeSize, categoryRgb, motionUniform, nodeScale, tierOf, timeUniform } from './scale'

const CAP = 640

const vert = /* glsl */ `
attribute vec3 aColor; attribute float aSize; attribute float aAlpha; attribute float aGlow; attribute float aGold; attribute float aSeed; attribute float aTier;
uniform float uScale;
varying vec2 vUv; varying vec3 vColor; varying float vAlpha; varying float vGlow; varying float vGold; varying float vSeed; varying float vTier;
void main(){
  vUv = uv; vColor = aColor; vAlpha = aAlpha; vGlow = aGlow; vGold = aGold; vSeed = aSeed; vTier = aTier;
  vec4 mv = viewMatrix * modelMatrix * instanceMatrix * vec4(0.0,0.0,0.0,1.0);
  float halo = aTier > 1.5 ? 8.5 : aTier > 0.5 ? 7.0 : 5.2;
  float s = aSize * uScale * halo * (1.0 + aGlow * 0.16);
  mv.xy += position.xy * s;
  gl_Position = projectionMatrix * mv;
}`
const frag = /* glsl */ `
varying vec2 vUv; varying vec3 vColor; varying float vAlpha; varying float vGlow; varying float vGold; varying float vSeed; varying float vTier;
uniform float uTime; uniform float uMotion;
void main(){
  vec2 p = vUv - 0.5;
  float d = length(p) * 2.0;
  float major = step(1.5, vTier), mid = step(0.5, vTier) - major;
  float breathe = 1.0 + uMotion * (0.07 + 0.10 * major) * sin(uTime * (0.9 + 0.5 * major) + vSeed * 40.0);
  float coreR = mix(0.085, 0.11, mid) + 0.045 * major;
  float core = smoothstep(coreR, 0.0, d);
  float haloK = mix(13.0, 9.0, mid) - 2.5 * major;
  float halo = exp(-d * d * haloK) * mix(0.34, 0.5, mid) + exp(-d * 3.1) * (0.04 + 0.05 * major);
  // luminous bloom ring around major events, a soft lens
  float lens = major * (smoothstep(0.03, 0.0, abs(d - 0.62)) * 0.12 + exp(-pow((d - 0.34) * 7.0, 2.0)) * 0.10);
  float spike = (exp(-abs(p.x) * 95.0) * exp(-abs(p.y) * 5.2) + exp(-abs(p.y) * 95.0) * exp(-abs(p.x) * 5.2)) * (0.55 * mid + 1.0 * major);
  vec2 q = mat2(0.7071, -0.7071, 0.7071, 0.7071) * p;
  float spike2 = (exp(-abs(q.x) * 130.0) * exp(-abs(q.y) * 9.0) + exp(-abs(q.y) * 130.0) * exp(-abs(q.x) * 9.0)) * 0.35 * major;
  float ring = smoothstep(0.014, 0.0, abs(d - 0.40)) * vGlow;
  float ring2 = smoothstep(0.010, 0.0, abs(d - 0.52 - 0.02 * sin(uTime * 1.6 * uMotion))) * vGlow * 0.45;
  float gold = smoothstep(0.016, 0.0, abs(d - 0.5)) * vGold;
  vec3 gcol = vec3(0.91, 0.75, 0.47);
  vec3 col = vColor * (halo * breathe + spike * 0.85 + spike2 + lens) + vec3(1.0) * core * (1.05 + 0.2 * major)
           + vec3(0.92, 0.95, 1.0) * (ring + ring2) * 0.9 + gcol * gold * 1.15;
  col += gcol * vGold * exp(-d * d * 14.0) * 0.12;
  col += vColor * vGlow * exp(-d * d * 6.0) * 0.35;
  gl_FragColor = vec4(col, vAlpha);
}`

const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }
const backOut = (t: number) => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2) }

/** All events in one instanced, billboarded draw call. Three tiers: major, supporting, minor.
 *  Minor nodes fade with distance and surface when they become relevant. Positions never move. */
export function NodesLayer() {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const graph = useStore((s) => s.graph)
  const version = useStore((s) => s.graphVersion)

  const { geo, mat, cur } = useMemo(() => {
    const g = new THREE.PlaneGeometry(1, 1)
    const attr = (n: string, size: number) => { const a = new THREE.InstancedBufferAttribute(new Float32Array(CAP * size), size); a.setUsage(THREE.DynamicDrawUsage); g.setAttribute(n, a); return a }
    attr('aColor', 3); attr('aSize', 1); attr('aAlpha', 1); attr('aGlow', 1); attr('aGold', 1); attr('aSeed', 1); attr('aTier', 1)
    const m = new THREE.ShaderMaterial({
      vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uScale: nodeScale, uTime: { value: 0 }, uMotion: motionUniform },
    })
    return { geo: g, mat: m, cur: { alpha: new Float32Array(CAP), glow: new Float32Array(CAP), gold: new Float32Array(CAP) } }
  }, [])

  useEffect(() => {
    const m = mesh.current; if (!m) return
    const tmp = new THREE.Object3D()
    const color = geo.getAttribute('aColor') as THREE.InstancedBufferAttribute
    const seed = geo.getAttribute('aSeed') as THREE.InstancedBufferAttribute
    const tier = geo.getAttribute('aTier') as THREE.InstancedBufferAttribute
    graph.nodes.forEach((n, i) => {
      if (i >= CAP) return
      tmp.position.set(...n.position); tmp.updateMatrix(); m.setMatrixAt(i, tmp.matrix)
      const c = categoryRgb(n.category); color.setXYZ(i, c[0], c[1], c[2])
      seed.setX(i, (i * 0.6180339) % 1); tier.setX(i, tierOf(n.importance))
    })
    m.count = Math.min(CAP, graph.nodes.length)
    m.instanceMatrix.needsUpdate = color.needsUpdate = seed.needsUpdate = tier.needsUpdate = true
  }, [graph, version, geo])

  useFrame(({ camera }, dt) => {
    const m = mesh.current; if (!m) return
    mat.uniforms.uTime.value = performance.now() / 1000
    const st = useStore.getState()
    const { graph: g, selectedId, hoveredId, fromId, toId, journey, drag } = st
    const F = getFocus()
    const A = (n: string) => geo.getAttribute(n) as THREE.InstancedBufferAttribute
    const aSize = A('aSize'), aAlpha = A('aAlpha'), aGlow = A('aGlow'), aGold = A('aGold')
    const k = 1 - Math.exp(-dt * 6)
    const now = performance.now()
    const last = F.journey ? st.routes[st.routeIdx].nodeIds.length - 1 : -1
    const t = journeyRuntime.t
    const nearIdx = Math.round(t)
    const n = Math.min(CAP, g.nodes.length)
    const cp = camera.position
    for (let i = 0; i < n; i++) {
      const node = g.nodes[i]
      const tier = tierOf(node.importance)
      const d = Math.hypot(node.position[0] - cp.x, node.position[1] - cp.y, node.position[2] - cp.z)
      let lod = tier === 2 ? 1 : smooth(TIER_FAR[tier], TIER_FAR[tier] * 0.62, d)
      const fog = 1 - 0.45 * smooth(240, 560, d)
      let glowT = 0, goldT = 0
      const isFocus = node.id === F.focusId
      const rel = isFocus || F.neighbors.has(node.id) || node.id === fromId || node.id === toId
      if (rel) lod = Math.max(lod, 0.9)
      let alphaT = lod * fog
      if (F.journey) {
        const k2 = F.routeNodes.get(node.id)
        if (k2 === undefined) alphaT *= 0.16
        else {
          const reveal = journey?.overview ? 1 : k2 === 0 ? 1 : smooth(k2 - 1.3, k2 - 0.4, t)
          alphaT = Math.max(reveal, k2 === last ? 0.55 : 0) * Math.max(0.85, fog)
          if (k2 === 0 || k2 === last) goldT = 0.9
          if (k2 === nearIdx && Math.abs(t - k2) < 0.18 && !journey?.overview) glowT = 1
        }
        if (node.id === selectedId) glowT = 1
      } else {
        if (F.focusId && !rel && !F.ring2.has(node.id)) alphaT *= 0.28
        else if (F.focusId && F.ring2.has(node.id)) alphaT *= 0.62
        if (node.id === hoveredId) glowT = 0.85
        if (node.id === selectedId) glowT = 1
        if (node.id === fromId || node.id === toId) goldT = 0.75
        if (drag) {
          if (node.id === drag.source) glowT = 0.7
          if (node.id === drag.target) { glowT = 1; alphaT = 1 }
        }
      }
      cur.alpha[i] += (alphaT - cur.alpha[i]) * k
      cur.glow[i] += (glowT - cur.glow[i]) * k
      cur.gold[i] += (goldT - cur.gold[i]) * k
      const born = effects.born.get(node.id)
      const spawn = born === undefined ? 1 : backOut(Math.min(1, (now - born) / 900))
      const focusScale = isFocus ? 1.28 : 1
      aSize.setX(i, baseNodeSize(node.importance) * spawn * focusScale * (node.id === drag?.target ? 1.25 : 1))
      aAlpha.setX(i, cur.alpha[i] * Math.min(1, spawn)); proj.alpha[i] = cur.alpha[i]
      aGlow.setX(i, cur.glow[i]); aGold.setX(i, cur.gold[i])
    }
    aSize.needsUpdate = aAlpha.needsUpdate = aGlow.needsUpdate = aGold.needsUpdate = true
  })

  return <instancedMesh ref={mesh} args={[geo, mat, CAP]} frustumCulled={false} renderOrder={10} />
}
