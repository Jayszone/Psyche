import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'
import { Sky } from './Sky'
import { Starfield } from './Starfield'
import { FocalBody } from './FocalBody'
import { NodesLayer } from './NodesLayer'
import { EdgesLayer } from './EdgesLayer'
import { JourneyLayer } from './JourneyLayer'
import { RigAndInput } from './RigAndInput'
import { hexToRgb } from './scale'
import { useStore } from '../state/store'

const glowVert = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }'
const glowFrag = /* glsl */ `varying vec2 vUv; uniform vec3 uColor; uniform float uAlpha;
void main(){ float d = length(vUv-0.5)*2.0; float a = exp(-d*d*5.0) * uAlpha; gl_FragColor = vec4(uColor * a, a); }`

/** A faint tinted haze behind each constellation so categories read as regions. */
function ConstellationHaze() {
  const categories = useStore((s) => s.categories)
  const group = useRef<THREE.Group>(null)
  const items = useMemo(() => categories.filter((c) => c.id !== 'user').map((c) => ({
    c, mat: new THREE.ShaderMaterial({
      vertexShader: glowVert, fragmentShader: glowFrag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uColor: { value: new THREE.Vector3(...hexToRgb(c.color)) }, uAlpha: { value: 0.1 } },
    }),
  })), [categories])
  useFrame(({ camera }) => {
    const r = camera.position.length()
    const a = r > 70 ? 0.1 : r > 30 ? 0.07 : 0.035
    group.current?.children.forEach((m, i) => { m.quaternion.copy(camera.quaternion); items[i].mat.uniforms.uAlpha.value = a })
  })
  return (
    <group ref={group}>
      {items.map(({ c, mat }) => (
        <mesh key={c.id} position={c.center} material={mat} renderOrder={-30}><planeGeometry args={[46, 46]} /></mesh>
      ))}
    </group>
  )
}

export default function PsycheCanvas() {
  const quality = useStore((s) => s.settings.quality)
  const cap = quality === 'low' ? 1 : quality === 'medium' ? 1.5 : Math.min(2, window.devicePixelRatio || 1)
  const [dpr, setDpr] = useState(cap)
  useEffect(() => setDpr(cap), [cap])
  const density = quality === 'low' ? 0.4 : quality === 'medium' ? 0.7 : 1
  return (
    <Canvas
      dpr={dpr}
      camera={{ fov: 50, near: 0.1, far: 3000 }}
      gl={{ antialias: quality !== 'low', alpha: false, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => { gl.setClearColor('#050713') }}
      style={{ position: 'absolute', inset: 0, touchAction: 'none' }}
      aria-hidden="true"
    >
      <PerformanceMonitor onDecline={() => setDpr((d) => Math.max(1, d - 0.25))} onIncline={() => setDpr((d) => Math.min(cap, d + 0.25))} />
      <Sky strength={quality === 'low' ? 0.7 : 1} />
      <Starfield density={density} dpr={dpr} />
      <ConstellationHaze />
      <FocalBody />
      <EdgesLayer />
      <NodesLayer />
      <JourneyLayer />
      <RigAndInput />
    </Canvas>
  )
}
