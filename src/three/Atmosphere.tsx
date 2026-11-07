import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { REGIONS } from '../data/dataset'
import { useStore } from '../state/store'
import { categoryRgb, hexToRgb, motionUniform, timeUniform } from './scale'

const glowVert = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }'
const hazeFrag = /* glsl */ `
varying vec2 vUv; uniform vec3 uColor; uniform float uAlpha; uniform float uSeed; uniform float uTime;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)) + uSeed) * 43758.5453); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
void main(){
  vec2 p = vUv - 0.5; float d = length(p) * 2.0;
  float cloud = n(p * 5.0 + uSeed) * 0.6 + n(p * 11.0 - uSeed + uTime * 0.01) * 0.4;
  float a = exp(-d * d * 3.6) * (0.35 + 1.1 * cloud);
  a += smoothstep(0.012, 0.0, abs(d - 0.86)) * 0.10;
  a *= smoothstep(1.0, 0.8, d);
  gl_FragColor = vec4(uColor * a * uAlpha, a * uAlpha);
}`

/** Diffuse atmosphere: a tinted cloud around every constellation, plus a wide glow per region. */
export function ClusterHaze() {
  const graph = useStore((s) => s.graph)
  const categories = useStore((s) => s.categories)
  const group = useRef<THREE.Group>(null)
  const regionGroup = useRef<THREE.Group>(null)
  const items = useMemo(() => categories.filter((c) => c.id !== 'user').map((c) => {
    const n = graph.nodes.filter((x) => x.category === c.id)
    const cx = n.length ? n.reduce((s, x) => s + x.position[0], 0) / n.length : c.center[0]
    const cy = n.length ? n.reduce((s, x) => s + x.position[1], 0) / n.length : c.center[1]
    const cz = n.length ? n.reduce((s, x) => s + x.position[2], 0) / n.length : c.center[2]
    const rad = n.length ? Math.max(...n.map((x) => Math.hypot(x.position[0] - cx, x.position[1] - cy, x.position[2] - cz))) : 8
    return {
      id: c.id, pos: [cx, cy, cz] as [number, number, number], size: 2.9 * rad + 14, weight: Math.min(1.3, 0.55 + n.length * 0.07),
      mat: new THREE.ShaderMaterial({
        vertexShader: glowVert, fragmentShader: hazeFrag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { uColor: { value: new THREE.Vector3(...hexToRgb(c.color)) }, uAlpha: { value: 0.1 }, uSeed: { value: Math.random() * 40 }, uTime: timeUniform },
      }),
    }
  }), [categories, graph.nodes])
  const regions = useMemo(() => REGIONS.map((r) => {
    const cols = r.members.map((m) => categoryRgb(m))
    const avg = cols.reduce((a, c) => [a[0] + c[0] / cols.length, a[1] + c[1] / cols.length, a[2] + c[2] / cols.length], [0, 0, 0])
    return {
      id: r.id, pos: r.center,
      mat: new THREE.ShaderMaterial({
        vertexShader: glowVert, fragmentShader: hazeFrag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { uColor: { value: new THREE.Vector3(avg[0], avg[1], avg[2]) }, uAlpha: { value: 0.05 }, uSeed: { value: r.id.length * 7.3 }, uTime: timeUniform },
      }),
    }
  }), [])
  useFrame(({ camera }) => {
    const cp = camera.position
    group.current?.children.forEach((m, i) => {
      m.quaternion.copy(camera.quaternion)
      const it = items[i]; if (!it) return
      const d = Math.hypot(it.pos[0] - cp.x, it.pos[1] - cp.y, it.pos[2] - cp.z)
      // clearer from afar (so clusters read as clouds), thinning as you enter them
      const k = THREE.MathUtils.smoothstep(d, 14, 70) * (0.55 + 0.45 * THREE.MathUtils.smoothstep(d, 80, 230))
      it.mat.uniforms.uAlpha.value = 0.2 * it.weight * k
    })
    regionGroup.current?.children.forEach((m, i) => {
      m.quaternion.copy(camera.quaternion)
      const r = regions[i]; if (!r) return
      const d = Math.hypot(r.pos[0] - cp.x, r.pos[1] - cp.y, r.pos[2] - cp.z)
      r.mat.uniforms.uAlpha.value = 0.1 * THREE.MathUtils.smoothstep(d, 60, 200)
    })
  })
  return (
    <>
      <group ref={regionGroup}>{regions.map((r) => (<mesh key={r.id} position={r.pos} material={r.mat} renderOrder={-40}><planeGeometry args={[300, 300]} /></mesh>))}</group>
      <group ref={group}>{items.map((it) => (<mesh key={it.id} position={it.pos} material={it.mat} renderOrder={-30}><planeGeometry args={[it.size, it.size]} /></mesh>))}</group>
    </>
  )
}

const dustVert = /* glsl */ `
attribute vec3 aColor; attribute float aSeed; attribute float aSize;
uniform float uTime; uniform float uMotion; uniform float uPx;
varying vec3 vC; varying float vA;
void main(){
  vec3 p = position + uMotion * vec3(sin(uTime*0.11 + aSeed*20.0), cos(uTime*0.09 + aSeed*31.0), sin(uTime*0.07 + aSeed*13.0)) * 1.6;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float dist = -mv.z;
  vA = smoothstep(420.0, 60.0, dist) * (0.55 + 0.45 * sin(uTime*0.4 + aSeed*50.0));
  gl_PointSize = clamp(aSize * uPx * 70.0 / max(dist, 1.0), 1.0, 5.0 * uPx);
  vC = aColor;
}`
const dustFrag = 'varying vec3 vC; varying float vA; void main(){ float d = length(gl_PointCoord-0.5)*2.0; float a = smoothstep(1.0,0.0,d); gl_FragColor = vec4(vC, a*a*vA*0.8); }'

/** Slow motes drifting inside each constellation. Cheap, GPU-animated, and gone when the camera is far. */
export function Dust({ density = 1, dpr = 1 }: { density?: number; dpr?: number }) {
  const categories = useStore((s) => s.categories)
  const geo = useMemo(() => {
    const per = Math.round(60 * density)
    const cats = categories.filter((c) => c.id !== 'user')
    const n = cats.length * per
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), seed = new Float32Array(n), size = new Float32Array(n)
    let s = 7
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647 }
    cats.forEach((c, ci) => {
      const rgb = categoryRgb(c.id)
      for (let i = 0; i < per; i++) {
        const k = ci * per + i
        const u = rnd() * 2 - 1, th = rnd() * 6.283, r = 7 + Math.pow(rnd(), 0.7) * 26, q = Math.sqrt(1 - u * u)
        pos.set([c.center[0] + r * q * Math.cos(th), c.center[1] + r * u * 0.8, c.center[2] + r * q * Math.sin(th)], k * 3)
        col.set([rgb[0] * 0.8 + 0.2, rgb[1] * 0.8 + 0.2, rgb[2] * 0.8 + 0.2], k * 3)
        seed[k] = rnd(); size[k] = 0.5 + rnd() * 0.9
      }
    })
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aColor', new THREE.BufferAttribute(col, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1)); g.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    return g
  }, [categories, density])
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: dustVert, fragmentShader: dustFrag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: timeUniform, uMotion: motionUniform, uPx: { value: dpr } },
  }), [dpr])
  return <points geometry={geo} material={mat} frustumCulled={false} renderOrder={-10} />
}

const galVert = /* glsl */ `
attribute vec3 aColor; attribute float aSize;
uniform float uPx; varying vec3 vC;
void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mv; gl_PointSize = max(1.0, aSize * uPx); vC = aColor; }`
const galFrag = 'varying vec3 vC; void main(){ float d = length(gl_PointCoord-0.5)*2.0; float a = smoothstep(1.0,0.0,d); gl_FragColor = vec4(vC, a*a*0.7); }'

function spiral(count: number, seed: number, tint: [number, number, number]) {
  let s = seed
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647 }
  const pos = new Float32Array(count * 3), col = new Float32Array(count * 3), size = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    const r = Math.pow(rnd(), 0.75) * 150
    const arm = Math.floor(rnd() * 2) * Math.PI
    const a = r * 0.045 + arm + (rnd() - 0.5) * (0.5 + 1.2 * (1 - r / 150))
    const thick = (rnd() - 0.5) * (14 - r * 0.07)
    pos.set([Math.cos(a) * r, thick, Math.sin(a) * r], i * 3)
    const core = Math.max(0, 1 - r / 55)
    col.set([tint[0] * (0.55 + 0.45 * core) + core * 0.4, tint[1] * (0.55 + 0.45 * core) + core * 0.35, tint[2] * (0.6 + 0.4 * core) + core * 0.2], i * 3)
    size[i] = 1.2 + rnd() * 2.2 + core * 1.5
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aColor', new THREE.BufferAttribute(col, 3)); g.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
  return g
}

/** Far-off spiral systems: other worlds of knowledge at the edge of the map. They give scale, not content. */
export function DistantGalaxies({ dpr = 1, density = 1 }: { dpr?: number; density?: number }) {
  const refs = useRef<THREE.Points[]>([])
  const defs = useMemo(() => [
    { pos: [820, 260, -640] as [number, number, number], rot: [0.9, 0.3, 0.2] as [number, number, number], tint: hexToRgb('#8FA3FF'), seed: 11, scale: 1.1 },
    { pos: [-900, -220, -520] as [number, number, number], rot: [0.5, 1.1, -0.3] as [number, number, number], tint: hexToRgb('#C3A8FF'), seed: 23, scale: 0.9 },
    { pos: [260, -380, 960] as [number, number, number], rot: [1.2, 0.2, 0.6] as [number, number, number], tint: hexToRgb('#7FD3E8'), seed: 37, scale: 0.8 },
  ], [])
  const geos = useMemo(() => defs.map((d) => spiral(Math.round(3200 * density), d.seed, d.tint)), [defs, density])
  const mat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: galVert, fragmentShader: galFrag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uPx: { value: dpr } } }), [dpr])
  useFrame((_, dt) => { if (motionUniform.value) refs.current.forEach((p) => { if (p) p.rotation.y += dt * 0.004 }) })
  return (
    <>
      {defs.map((d, i) => (
        <points key={i} ref={(el) => { if (el) refs.current[i] = el }} geometry={geos[i]} material={mat} position={d.pos} rotation={d.rot} scale={d.scale} frustumCulled={false} renderOrder={-45} />
      ))}
    </>
  )
}
