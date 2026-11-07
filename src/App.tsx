import { Component, Suspense, lazy, useEffect, useMemo, type ReactNode } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useStore } from './state/store'
import { Hero } from './ui/Hero'
import { TopBar } from './ui/TopBar'
import { ConnectBar } from './ui/ConnectBar'
import { Combobox } from './ui/Combobox'
import { NodePanel } from './ui/NodePanel'
import { Legend } from './ui/Legend'
import { JourneyCard, RouteList } from './ui/JourneyCard'
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
    <div className="pointer-events-auto panel w-full max-w-[300px] px-4 py-3">
      <Combobox label="Search events" placeholder="Search, or add your own  ( / )" value={q} onValue={setQ}
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
          <ConnectHandle />
          <div className="pointer-events-none absolute inset-0 z-[5] grid grid-rows-[auto_minmax(0,1fr)_auto] gap-3"
            style={{ padding: 'var(--safe-t) var(--safe-r) var(--safe-b) var(--safe-l)' }}>
            <div className="flex flex-wrap items-start justify-between gap-x-5 gap-y-3">
              <TopBar />
              {mode !== 'universe' && (
                <>
                  <div className={'order-3 w-full justify-center lg:order-none lg:flex lg:w-auto lg:flex-1 ' + (mode === 'journey' ? 'hidden md:flex' : 'flex')}><ConnectBar /></div>
                  <div className={mode === 'journey' ? 'hidden md:block' : ''}><SearchBox /></div>
                </>
              )}
            </div>
            <div className="flex min-h-0 justify-between gap-3"><RouteList />{mode !== 'universe' && <div className="ml-auto flex min-h-0"><NodePanel /></div>}</div>
            <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-[1fr_minmax(0,auto)_1fr]">
              <div className={'order-2 md:order-none md:flex ' + (mode === 'journey' ? 'hidden' : 'flex')}>{mode !== 'universe' && <Legend />}</div>
              <div className="order-1 flex min-w-0 flex-col gap-2 md:order-none md:w-[min(700px,60vw)]">
                <Toast />
                <NoPathNote />
                <Hints />
                <JourneyCard />
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
