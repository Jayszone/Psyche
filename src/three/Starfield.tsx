import { useMemo } from 'react'
import * as THREE from 'three'
import { motionUniform, timeUniform } from './scale'

const vert = /* glsl */ `
attribute float aSize; attribute float aPhase; attribute vec3 aColor;
uniform float uPx; uniform float uAtten; uniform float uTime; uniform float uMotion;
varying vec3 vColor; varying float vTw;
void main(){
  vec4 mv = modelViewMatrix * vec4(position,1.0);
  gl_Position = projectionMatrix * mv;
  float att = mix(1.0, clamp(300.0 / -mv.z, 0.4, 2.4), uAtten);
  gl_PointSize = max(1.0, aSize * uPx * att);
  vColor = aColor;
  vTw = 1.0 - uMotion * 0.22 * (0.5 + 0.5 * sin(uTime * (0.6 + aPhase * 0.5) + aPhase * 40.0));
}`
const frag = /* glsl */ `
varying vec3 vColor; varying float vTw;
void main(){
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = smoothstep(1.0, 0.0, d); a *= a;
  gl_FragColor = vec4(vColor * vTw, a);
}`

function mulberry(seed: number) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

function makeLayer(count: number, rMin: number, rMax: number, sizeMin: number, sizeMax: number, seed: number) {
  const rnd = mulberry(seed)
  const pos = new Float32Array(count * 3), size = new Float32Array(count), phase = new Float32Array(count), col = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const u = rnd() * 2 - 1, th = rnd() * Math.PI * 2, r = rMin + (rMax - rMin) * Math.cbrt(rnd()), s = Math.sqrt(1 - u * u)
    pos.set([r * s * Math.cos(th), r * u, r * s * Math.sin(th)], i * 3)
    size[i] = sizeMin + Math.pow(rnd(), 3) * (sizeMax - sizeMin)
    phase[i] = rnd()
    const k = rnd()
    // mostly starlight, some cool blue and violet, very rare warm gold
    const c = k < 0.06 ? [0.91, 0.75, 0.47] : k < 0.28 ? [0.55, 0.72, 1.0] : k < 0.42 ? [0.68, 0.62, 0.98] : [0.91, 0.93, 0.97]
    const dim = 0.35 + rnd() * 0.65
    col.set([c[0] * dim, c[1] * dim, c[2] * dim], i * 3)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
  g.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1))
  g.setAttribute('aColor', new THREE.BufferAttribute(col, 3))
  return g
}

function StarLayer({ count, rMin, rMax, sizeMin, sizeMax, seed, atten, dpr }: {
  count: number; rMin: number; rMax: number; sizeMin: number; sizeMax: number; seed: number; atten: number; dpr: number
}) {
  const geo = useMemo(() => makeLayer(count, rMin, rMax, sizeMin, sizeMax, seed), [count, rMin, rMax, sizeMin, sizeMax, seed])
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uPx: { value: dpr }, uAtten: { value: atten }, uTime: timeUniform, uMotion: motionUniform },
  }), [atten, dpr])
  return <points geometry={geo} material={mat} frustumCulled={false} renderOrder={-50} />
}

/** A deep field of far stars plus a sparse near layer that gives parallax when the camera moves. */
export function Starfield({ density = 1, dpr = 1 }: { density?: number; dpr?: number }) {
  return (
    <>
      <StarLayer count={Math.round(3600 * density)} rMin={900} rMax={1350} sizeMin={1.1} sizeMax={3.4} seed={11} atten={0} dpr={dpr} />
      <StarLayer count={Math.round(1100 * density)} rMin={260} rMax={900} sizeMin={1.8} sizeMax={4.6} seed={29} atten={1} dpr={dpr} />
    </>
  )
}
