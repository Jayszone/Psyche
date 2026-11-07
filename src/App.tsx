import { Component, Suspense, lazy, useEffect, useMemo, type ReactNode } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useStore } from './state/store'
import { Hero } from './ui/Hero'
import { TopBar } from './ui/TopBar'
import { TracePill } from './ui/TracePill'
import { PortalCaption } from './ui/PortalCaption'
import { MiniMap } from './ui/MiniMap'
import { Combobox } from './ui/Combobox'
import { NodePanel } from './ui/NodePanel'
import { Legend } from './ui/Legend'
import { JourneyHUD, RouteList } from './ui/JourneyCard'
import { NavControls } from './ui/NavControls'
import { Labels } from './ui/Labels'
import { ConnectHandle, PendingLink } from './ui/ConnectHandle'
import { AddDialog, Hints, Keys, LiveRegion, NoPathNote, Toast } from './ui/Overlays'
import { Fallback } from './ui/Fallback'
import { useState } from 'react'

const PsycheCanvas = lazy(() => import('./three/PsycheCanvas'))

function webglAvailable() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch { return false }
}

class Boundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onError() }
  render() { return this.state.failed ? null : this.props.children }
}

function SearchBox() {
  const [q, setQ] = useState('')
  return (
    <div className="pointer-events-auto panel w-full max-w-[260px] rounded-full px-5 py-1.5">
      <Combobox label="Search events" hideLabel placeholder="Search events  ( / )" value={q} onValue={setQ} bare
        onPick={(n) => { setQ(''); useStore.getState().focusNode(n.id) }} onAdd={(t) => { setQ(''); useStore.getState().openAdd(t) }} />
    </div>
  )
}

export default function App() {
  const load = useStore((s) => s.load)
  const ready = useStore((s) => s.ready)
  const mode = useStore((s) => s.mode)
  const [gl, setGl] = useState(true)
  const supported = useMemo(() => webglAvailable(), [])

  useEffect(() => { void load() }, [load])

  if (!supported || !gl) return ready ? <Fallback /> : null

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: 'var(--void)' }}>
      <Boundary onError={() => setGl(false)}>
        <Suspense fallback={null}>{ready && <PsycheCanvas />}</Suspense>
      </Boundary>
      {ready && (
        <>
          <Labels />
          <PortalCaption />
          <ConnectHandle />
          <div className="pointer-events-none absolute inset-0 z-[5] grid grid-rows-[auto_minmax(0,1fr)_auto] gap-3"
            style={{ padding: 'var(--safe-t) var(--safe-r) var(--safe-b) var(--safe-l)' }}>
            <div className="relative flex flex-wrap items-start justify-between gap-x-5 gap-y-3">
              <TopBar />
              {mode !== 'universe' && (
                <>
                  <div className="order-3 flex w-full justify-center md:absolute md:left-1/2 md:top-0 md:order-none md:w-auto md:-translate-x-1/2"><TracePill /></div>
                  <div className={mode === 'journey' ? 'hidden md:block' : ''}><SearchBox /></div>
                </>
              )}
            </div>
            <div className="flex min-h-0 flex-col items-start gap-3 overflow-hidden">
              <RouteList />
              {mode !== 'universe' && <NodePanel />}
            </div>
            <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-[1fr_minmax(0,auto)_1fr]">
              <div className={'order-2 items-end gap-3 md:order-none md:flex ' + (mode === 'journey' ? 'hidden' : 'flex')}>{mode !== 'universe' && (<><MiniMap /><Legend /></>)}</div>
              <div className="order-1 flex min-w-0 flex-col gap-2 md:order-none md:w-[min(780px,58vw)]">
                <Toast />
                <NoPathNote />
                <Hints />
                <JourneyHUD />
              </div>
              <div className={'order-3 justify-end md:order-none md:flex ' + (mode === 'journey' ? 'hidden' : 'flex')}>{mode !== 'universe' && <NavControls />}</div>
            </div>
          </div>
          <AnimatePresence>{mode === 'universe' && <Hero key="hero" />}</AnimatePresence>
          <PendingLink />
          <AddDialog />
          <LiveRegion />
          <Keys />
        </>
      )}
    </div>
  )
}
