import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore, effects } from '../state/store'
import { journeyRuntime } from '../graph/journey'
import { baseNodeSize, categoryRgb, motionUniform, nodeScale, timeUniform } from './scale'

const CAP = 384

const vert = /* glsl */ `
attribute vec3 aColor; attribute float aSize; attribute float aAlpha; attribute float aGlow; attribute float aGold; attribute float aSeed;
uniform float uScale;
varying vec2 vUv; varying vec3 vColor; varying float vAlpha; varying float vGlow; varying float vGold; varying float vSeed; varying float vSpike;
void main(){
  vUv = uv; vColor = aColor; vAlpha = aAlpha; vGlow = aGlow; vGold = aGold; vSeed = aSeed;
  vSpike = smoothstep(0.9, 1.7, aSize);
  vec4 mv = viewMatrix * modelMatrix * instanceMatrix * vec4(0.0,0.0,0.0,1.0);
  float s = aSize * uScale * 7.0 * (1.0 + aGlow * 0.18);
  mv.xy += position.xy * s;
  gl_Position = projectionMatrix * mv;
}`
const frag = /* glsl */ `
varying vec2 vUv; varying vec3 vColor; varying float vAlpha; varying float vGlow; varying float vGold; varying float vSeed; varying float vSpike;
uniform float uTime; uniform float uMotion;
void main(){
  vec2 p = vUv - 0.5;
  float d = length(p) * 2.0;
  float tw = 1.0 + uMotion * 0.08 * sin(uTime * 1.4 + vSeed * 40.0);
  float core = smoothstep(0.13, 0.0, d);
  float halo = exp(-d * d * 11.0) * 0.46 + exp(-d * 3.4) * 0.07;
  float spike = (exp(-abs(p.x) * 90.0) * exp(-abs(p.y) * 6.0) + exp(-abs(p.y) * 90.0) * exp(-abs(p.x) * 6.0)) * vSpike;
  float ring = smoothstep(0.016, 0.0, abs(d - 0.40)) * vGlow;
  float gold = smoothstep(0.018, 0.0, abs(d - 0.50)) * vGold;
  vec3 gcol = vec3(0.91, 0.75, 0.47);
  vec3 col = vColor * (halo * tw + spike * 0.9) + vec3(1.0) * core * 1.15 + vec3(0.92,0.95,1.0) * ring * 0.9 + gcol * gold * 1.2;
  col += gcol * vGold * exp(-d * d * 14.0) * 0.12;
  gl_FragColor = vec4(col, vAlpha);
}`

const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }
const backOut = (t: number) => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2) }

/** All event nodes as one instanced, billboarded draw call. Positions stay fixed; only brightness animates. */
export function NodesLayer() {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const graph = useStore((s) => s.graph)
  const version = useStore((s) => s.graphVersion)

  const { geo, mat, cur } = useMemo(() => {
    const g = new THREE.PlaneGeometry(1, 1)
    const attr = (n: string, size: number) => { const a = new THREE.InstancedBufferAttribute(new Float32Array(CAP * size), size); a.setUsage(THREE.DynamicDrawUsage); g.setAttribute(n, a); return a }
    attr('aColor', 3); attr('aSize', 1); attr('aAlpha', 1); attr('aGlow', 1); attr('aGold', 1); attr('aSeed', 1)
    const m = new THREE.ShaderMaterial({
      vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uScale: nodeScale, uTime: timeUniform, uMotion: motionUniform },
    })
    return { geo: g, mat: m, cur: { alpha: new Float32Array(CAP).fill(0), glow: new Float32Array(CAP), gold: new Float32Array(CAP) } }
  }, [])

  // Instance transforms and static attributes follow the graph, never the frame.
  useEffect(() => {
    const m = mesh.current; if (!m) return
    const tmp = new THREE.Object3D()
    const color = geo.getAttribute('aColor') as THREE.InstancedBufferAttribute
    const seed = geo.getAttribute('aSeed') as THREE.InstancedBufferAttribute
    graph.nodes.forEach((n, i) => {
      if (i >= CAP) return
      tmp.position.set(...n.position); tmp.updateMatrix(); m.setMatrixAt(i, tmp.matrix)
      const c = categoryRgb(n.category); color.setXYZ(i, c[0], c[1], c[2])
      seed.setX(i, (i * 0.6180339) % 1)
    })
    m.count = Math.min(CAP, graph.nodes.length)
    m.instanceMatrix.needsUpdate = true; color.needsUpdate = true; seed.needsUpdate = true
  }, [graph, version, geo])

  useFrame((_, dt) => {
    const m = mesh.current; if (!m) return
    const st = useStore.getState()
    const { graph: g, selectedId, hoveredId, fromId, toId, mode, journey, routes, routeIdx, drag } = st
    const aSize = geo.getAttribute('aSize') as THREE.InstancedBufferAttribute
    const aAlpha = geo.getAttribute('aAlpha') as THREE.InstancedBufferAttribute
    const aGlow = geo.getAttribute('aGlow') as THREE.InstancedBufferAttribute
    const aGold = geo.getAttribute('aGold') as THREE.InstancedBufferAttribute
    const k = 1 - Math.exp(-dt * 7)
    const now = performance.now()
    const route = mode === 'journey' ? routes[routeIdx] : null
    const pos = new Map<string, number>()
    route?.nodeIds.forEach((id, i) => pos.set(id, i))
    const last = route ? route.nodeIds.length - 1 : -1
    const t = journeyRuntime.t
    const nearIdx = Math.round(t)
    const neighbors = new Set<string>()
    const focusId = selectedId ?? hoveredId
    if (focusId) g.edges.forEach((e) => { if (e.source === focusId) neighbors.add(e.target); else if (e.target === focusId) neighbors.add(e.source) })

    const n = Math.min(CAP, g.nodes.length)
    for (let i = 0; i < n; i++) {
      const node = g.nodes[i]
      let alphaT = 1, glowT = 0, goldT = 0
      if (route) {
        const k2 = pos.get(node.id)
        if (k2 === undefined) alphaT = 0.13
        else {
          const reveal = journey?.overview ? 1 : k2 === 0 ? 1 : smooth(k2 - 1.15, k2 - 0.35, t)
          alphaT = Math.max(reveal, k2 === last ? 0.5 : 0)
          if (k2 === 0 || k2 === last) goldT = 0.9
          if (k2 === nearIdx && Math.abs(t - k2) < 0.12 && !journey?.overview) glowT = 1
        }
        if (node.id === selectedId) glowT = 1
      } else {
        if (focusId && node.id !== focusId && !neighbors.has(node.id)) alphaT = 0.5
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
      const emphasis = 0.75 + 0.25 * cur.alpha[i]
      aSize.setX(i, baseNodeSize(node.importance) * spawn * emphasis * (node.id === drag?.target ? 1.25 : 1))
      aAlpha.setX(i, cur.alpha[i] * Math.min(1, spawn))
      aGlow.setX(i, cur.glow[i]); aGold.setX(i, cur.gold[i])
    }
    aSize.needsUpdate = aAlpha.needsUpdate = aGlow.needsUpdate = aGold.needsUpdate = true
  })

  return <instancedMesh ref={mesh} args={[geo, mat, CAP]} frustumCulled={false} renderOrder={10} />
}
