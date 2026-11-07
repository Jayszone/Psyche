import { useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { Sky } from './Sky'
import { Starfield } from './Starfield'
import { ClusterHaze, Dust, DistantGalaxies } from './Atmosphere'
import { PortalLayer } from './PortalLayer'
import { NodesLayer } from './NodesLayer'
import { EdgesLayer } from './EdgesLayer'
import { JourneyLayer } from './JourneyLayer'
import { RigAndInput } from './RigAndInput'
import { useStore } from '../state/store'

export default function PsycheCanvas() {
  const quality = useStore((s) => s.settings.quality)
  const cap = quality === 'low' ? 1 : quality === 'medium' ? 1.5 : Math.min(2, window.devicePixelRatio || 1)
  const [dpr, setDpr] = useState(cap)
  useEffect(() => setDpr(cap), [cap])
  const density = quality === 'low' ? 0.4 : quality === 'medium' ? 0.7 : 1
  return (
    <Canvas
      dpr={dpr}
      camera={{ fov: 52, near: 0.1, far: 3200 }}
      gl={{ antialias: quality !== 'low', alpha: false, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => { gl.setClearColor('#050713') }}
      style={{ position: 'absolute', inset: 0, touchAction: 'none' }}
      aria-hidden="true"
    >
      <PerformanceMonitor onDecline={() => setDpr((d) => Math.max(1, d - 0.25))} onIncline={() => setDpr((d) => Math.min(cap, d + 0.25))} />
      <Sky strength={quality === 'low' ? 0.7 : 1} />
      <Starfield density={density} dpr={dpr} />
      <DistantGalaxies dpr={dpr} density={density} />
      <ClusterHaze />
      <Dust density={density} dpr={dpr} />
      <EdgesLayer />
      <NodesLayer />
      <JourneyLayer />
      <PortalLayer />
      <RigAndInput />
    </Canvas>
  )
}
