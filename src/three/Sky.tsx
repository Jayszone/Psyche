import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const vert = /* glsl */ `
varying vec3 vDir;
void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`

const frag = /* glsl */ `
varying vec3 vDir;
uniform float uStrength;
float hash(vec3 p){ p = fract(p*0.3183099 + .1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float noise(vec3 x){
  vec3 i = floor(x); vec3 f = fract(x); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(hash(i+vec3(0,0,0)),hash(i+vec3(1,0,0)),f.x), mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x), f.y),
             mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x), mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x), f.y), f.z);
}
float fbm(vec3 p){ float a=.5, s=0.; for(int i=0;i<5;i++){ s += a*noise(p); p *= 2.03; a *= .5; } return s; }
void main(){
  vec3 d = normalize(vDir);
  vec3 c = mix(vec3(0.016,0.022,0.060), vec3(0.040,0.058,0.120), smoothstep(-0.7,0.9,d.y));
  float m1 = smoothstep(0.25, 0.95, dot(d, normalize(vec3(0.62,0.22,-0.75))));
  float n1 = fbm(d*3.1 + vec3(2.,0.,5.));
  c += vec3(0.60,0.52,0.96) * pow(n1, 2.7) * m1 * 0.62 * uStrength;
  float m2 = smoothstep(0.2, 0.9, dot(d, normalize(vec3(-0.72,-0.12,0.68))));
  float n2 = fbm(d*2.5 + vec3(9.,3.,1.));
  c += vec3(0.45,0.72,1.00) * pow(n2, 2.9) * m2 * 0.50 * uStrength;
  float m3 = smoothstep(0.55, 0.98, dot(d, normalize(vec3(0.1,-0.5,-0.85))));
  c += vec3(0.91,0.75,0.47) * pow(fbm(d*4.0+vec3(4.,7.,2.)), 3.2) * m3 * 0.16 * uStrength;
  float band = exp(-pow(d.y*3.2 + 0.35*sin(d.x*2.3), 2.0));
  c += vec3(0.50,0.56,0.82) * fbm(d*7.0) * band * 0.055 * uStrength;
  gl_FragColor = vec4(c, 1.0);
}`

/** Distant nebula structure, painted on a huge sphere that follows the camera. */
export function Sky({ strength = 1 }: { strength?: number }) {
  const mesh = useRef<THREE.Mesh>(null)
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: frag, side: THREE.BackSide, depthWrite: false, depthTest: false,
    uniforms: { uStrength: { value: strength } },
  }), [strength])
  useFrame(({ camera }) => { mesh.current?.position.copy(camera.position) })
  return (
    <mesh ref={mesh} renderOrder={-100} frustumCulled={false} material={mat}>
      <sphereGeometry args={[1400, 48, 32]} />
    </mesh>
  )
}
