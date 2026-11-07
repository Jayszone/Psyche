import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { motionUniform, timeUniform } from './scale'

const planetVert = /* glsl */ `
varying vec3 vN; varying vec3 vObj; varying vec3 vV;
void main(){
  vObj = position; vN = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position,1.0); vV = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}`
const planetFrag = /* glsl */ `
varying vec3 vN; varying vec3 vObj; varying vec3 vV;
uniform vec3 uLight;
float hash(vec3 p){ p = fract(p*0.3183099 + .1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float noise(vec3 x){ vec3 i=floor(x); vec3 f=fract(x); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z); }
void main(){
  vec3 n = normalize(vN); vec3 v = normalize(vV);
  vec3 o = normalize(vObj);
  float warp = noise(o*vec3(2.0,9.0,2.0)) * 0.6;
  float bands = 0.5 + 0.5*sin(o.y*16.0 + warp*5.0);
  vec3 deep = vec3(0.07,0.10,0.25), mid = vec3(0.30,0.34,0.70), hi = vec3(0.58,0.62,0.92);
  vec3 base = mix(deep, mid, bands); base = mix(base, hi, smoothstep(0.7,1.0,bands)*0.55);
  float lit = clamp(dot(n, normalize(uLight)), 0.0, 1.0);
  float wrap = pow(lit, 0.8);
  vec3 col = base * (0.10 + 1.05*wrap);
  float fres = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 3.0);
  col += vec3(0.45,0.72,1.0) * fres * (0.25 + 0.9*lit);
  float term = smoothstep(0.0, 0.18, lit) * smoothstep(0.38, 0.12, lit);
  col += vec3(0.91,0.75,0.47) * term * 0.16;
  gl_FragColor = vec4(col, 1.0);
}`
const ringVert = /* glsl */ `
varying vec2 vP;
void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`
const ringFrag = /* glsl */ `
varying vec2 vP; uniform float uIn; uniform float uOut;
float h(float x){ return fract(sin(x*127.1)*43758.5453); }
void main(){
  float r = length(vP); float t = (r - uIn) / (uOut - uIn);
  float band = 0.35 + 0.65*h(floor(t*38.0));
  float fine = 0.7 + 0.3*sin(t*220.0);
  float a = band*fine*smoothstep(0.0,0.06,t)*smoothstep(1.0,0.82,t);
  a *= 1.0 - 0.75*smoothstep(0.3,0.38,t)*smoothstep(0.5,0.42,t);
  gl_FragColor = vec4(vec3(0.62,0.70,0.95)*a, a*0.42);
}`
const glowFrag = /* glsl */ `
varying vec2 vUv;
void main(){ float d = length(vUv-0.5)*2.0; float a = exp(-d*d*4.5); gl_FragColor = vec4(vec3(0.42,0.46,0.95)*a, a*0.30); }`

/** The one large, quiet focal object: a banded, ringed planet at the edge of the map. */
export function FocalBody({ position = [58, 16, -78] as [number, number, number] }) {
  const group = useRef<THREE.Group>(null)
  const light = useMemo(() => new THREE.Vector3(-0.9, 0.35, 0.55), [])
  const planet = useMemo(() => new THREE.ShaderMaterial({ vertexShader: planetVert, fragmentShader: planetFrag, uniforms: { uLight: { value: new THREE.Vector3(-0.9, 0.35, 0.55) } } }), [])
  const ring = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: ringVert, fragmentShader: ringFrag, transparent: true, side: THREE.DoubleSide, depthWrite: false,
    uniforms: { uIn: { value: 13 }, uOut: { value: 23 } },
  }), [])
  const glow = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: glowFrag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }), [])
  const glowMesh = useRef<THREE.Mesh>(null)
  useFrame(({ camera }) => {
    if (group.current && motionUniform.value > 0) group.current.rotation.y = timeUniform.value * 0.01
    glowMesh.current?.quaternion.copy(camera.quaternion)
    // keep the light fixed in world space, expressed in view space
    const v = light.clone().transformDirection(camera.matrixWorldInverse)
    ;(planet.uniforms.uLight.value as THREE.Vector3).copy(v)
  })
  return (
    <group position={position}>
      <mesh ref={glowMesh} material={glow} renderOrder={-20}><planeGeometry args={[78, 78]} /></mesh>
      <group ref={group} rotation={[0.42, 0, 0.22]}>
        <mesh material={planet}><sphereGeometry args={[9.5, 64, 48]} /></mesh>
        <mesh material={ring} rotation={[Math.PI / 2.0, 0, 0]}><ringGeometry args={[13, 23, 160, 1]} /></mesh>
      </group>
    </group>
  )
}
