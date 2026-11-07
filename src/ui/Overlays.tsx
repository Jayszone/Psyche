import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../state/store'
import { cameraController } from '../three/cameraController'
import { describePath } from '../graph/journey'

export function Toast() {
  const toast = useStore((s) => s.toast)
  return (
    <div className="pointer-events-none flex justify-center" role="status" aria-live="polite">
      <AnimatePresence>
        {toast && (
          <motion.div key={toast.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
            className="panel max-w-[min(520px,92vw)] px-4 py-2.5 text-[13px]"
            style={{ borderColor: toast.kind === 'warn' ? 'rgba(232,190,121,.5)' : toast.kind === 'success' ? 'rgba(116,185,255,.5)' : undefined }}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function AddDialog() {
  const draft = useStore((s) => s.addDraft)
  const categories = useStore((s) => s.categories)
  const [label, setLabel] = useState('')
  const [cat, setCat] = useState('user')
  const [desc, setDesc] = useState('')
  const first = useRef<HTMLInputElement>(null)
  useEffect(() => { if (draft !== null) { setLabel(draft); setDesc(''); setCat('user'); setTimeout(() => first.current?.focus(), 60) } }, [draft])
  return (
    <AnimatePresence>
      {draft !== null && (
        <motion.div className="absolute inset-0 z-40 grid place-items-center bg-[rgba(5,7,19,0.55)] p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onPointerDown={(e) => { if (e.target === e.currentTarget) useStore.getState().openAdd(null) }}>
          <form role="dialog" aria-modal="true" aria-label="Add a new event" className="panel flex w-[min(460px,100%)] flex-col gap-4 p-5"
            onSubmit={(e) => { e.preventDefault(); useStore.getState().addNode(label, cat as never, desc) }}
            onKeyDown={(e) => { if (e.key === 'Escape') useStore.getState().openAdd(null) }}>
            <div className="eyebrow">New event</div>
            <h2 className="serif m-0 text-[26px] leading-tight">Add a star to the universe</h2>
            <label className="block"><span className="field-label">Event</span>
              <input ref={first} className="input" value={label} maxLength={80} onChange={(e) => setLabel(e.target.value)} required /></label>
            <label className="block"><span className="field-label">Constellation</span>
              <select className="input bg-[#0a0d1e]" value={cat} onChange={(e) => setCat(e.target.value)}>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.id === 'user' ? 'Your events (near what you selected)' : c.label}</option>)}
              </select></label>
            <label className="block"><span className="field-label">Description (optional)</span>
              <input className="input" value={desc} maxLength={200} onChange={(e) => setDesc(e.target.value)} /></label>
            <p className="m-0 text-[12px] faint">The new event starts with no relationships. Psyche only shows links that exist in its data or that you add yourself.</p>
            <div className="flex gap-2"><button type="submit" className="btn btn-primary" disabled={label.trim().length < 2}>Add event</button>
              <button type="button" className="btn border-transparent" onClick={() => useStore.getState().openAdd(null)}>Cancel</button></div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Hints() {
  const mode = useStore((s) => s.mode)
  const hints = useStore((s) => s.settings.hints)
  const selected = useStore((s) => s.selectedId)
  const [visible, setVisible] = useState(true)
  useEffect(() => { setVisible(true); const t = setTimeout(() => setVisible(false), 16000); return () => clearTimeout(t) }, [mode])
  const text = mode === 'explore'
    ? 'Drag to orbit · Right-drag to pan · Scroll to move closer · W A S D to travel · Click a star to focus'
    : mode === 'journey' ? 'Scroll or press ← → to move along the chain · Space to play or pause · O for the whole route' : ''
  if (!hints || !visible || !text || selected) return null
  return (
    <div className="pointer-events-none hidden text-center text-[11.5px] tracking-wide faint sm:block" aria-hidden="true">
      {text}
    </div>
  )
}

export function Keys() {
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)
      const st = useStore.getState()
      if (e.key === 'Escape') {
        if (st.drag) st.endConnect(false)
        else if (st.pending) st.dismissPending()
        else if (st.addDraft !== null) st.openAdd(null)
        else if (st.selectedId) { if (st.mode === 'journey') useStore.setState({ selectedId: null }); else st.deselect() }
        else if (st.mode === 'journey') st.exitJourney()
        return
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key
      if (k === '/') { e.preventDefault(); document.querySelector<HTMLInputElement>('input[role="combobox"]')?.focus(); return }
      if (st.mode === 'journey' && st.journey) {
        if (k === 'ArrowRight') { e.preventDefault(); st.journeyNext() }
        else if (k === 'ArrowLeft') { e.preventDefault(); st.journeyPrev() }
        else if (k === ' ' && !(t instanceof HTMLButtonElement)) { e.preventDefault(); st.journey.playing ? st.journeyPause() : st.journeyPlay() }
        else if (k === 'o' || k === 'O') st.journeyOverview()
        else if (k === 'r' || k === 'R') st.journeyRestart()
        return
      }
      if (st.mode === 'universe' && (k === 'Enter' || k === 'ArrowDown')) { st.enterExplore(); return }
      if (k === 'ArrowLeft') { e.preventDefault(); cameraController.orbit(-0.14, 0) }
      else if (k === 'ArrowRight') { e.preventDefault(); cameraController.orbit(0.14, 0) }
      else if (k === 'ArrowUp') { e.preventDefault(); cameraController.orbit(0, 0.12) }
      else if (k === 'ArrowDown') { e.preventDefault(); cameraController.orbit(0, -0.12) }
      else if (k === '+' || k === '=') cameraController.zoom(0.8)
      else if (k === '-' || k === '_') cameraController.zoom(1.25)
      else if (k === 'r' || k === 'R') st.resetCamera()
      else if (k === 'h' || k === 'H') st.resetCamera()
    }
    const travel = (down: boolean) => (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const st = useStore.getState()
      if (st.mode !== 'explore' || cameraController.onRail) return
      const v = down ? 1 : 0, K = cameraController.keys
      switch (e.key.toLowerCase()) {
        case 'w': K.f = v; break
        case 's': K.b = v; break
        case 'a': K.l = v; break
        case 'd': K.r = v; break
        case 'e': K.u = v; break
        case 'q': K.d = v; break
        case 'shift': K.fast = !!down; break
      }
    }
    const clear = () => { const K = cameraController.keys; K.f = K.b = K.l = K.r = K.u = K.d = 0; K.fast = false }
    const kd = travel(true), ku = travel(false)
    window.addEventListener('keydown', on); window.addEventListener('keydown', kd); window.addEventListener('keyup', ku); window.addEventListener('blur', clear)
    return () => { window.removeEventListener('keydown', on); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); window.removeEventListener('blur', clear) }
  }, [])
  return null
}

/** Screen-reader narration of what the 3D scene is doing. */
export function LiveRegion() {
  const mode = useStore((s) => s.mode)
  const routes = useStore((s) => s.routes)
  const routeIdx = useStore((s) => s.routeIdx)
  const journey = useStore((s) => s.journey)
  const graph = useStore((s) => s.graph)
  const sel = useStore((s) => (s.selectedId ? s.nodeById.get(s.selectedId) : undefined))
  const noPath = useStore((s) => s.noPath)
  const nodeById = useStore((s) => s.nodeById)
  let text = ''
  if (noPath) text = `No relationship was found between ${nodeById.get(noPath.from)?.label} and ${nodeById.get(noPath.to)?.label}. Psyche does not invent one.`
  else if (mode === 'journey' && routes[routeIdx] && journey) {
    const r = routes[routeIdx]
    text = `Journey, step ${journey.step} of ${r.edgeIds.length}. ${nodeById.get(r.nodeIds[journey.step])?.label}.` + (journey.step === 0 ? ' ' + describePath(r, graph) : '')
  } else if (sel) text = `${sel.label}. ${sel.description}`
  return <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{text}</div>
}

/** The full route as a plain list, for screen readers and as a no-3D fallback. */
export function NoPathNote() {
  const noPath = useStore((s) => s.noPath)
  const nodeById = useStore((s) => s.nodeById)
  if (!noPath) return null
  return (
    <div className="pointer-events-auto panel mx-auto w-[min(520px,100%)] p-4" role="alert">
      <div className="eyebrow mb-1">No computed relationship</div>
      <p className="m-0 text-[13.5px] dim">
        Psyche has no chain between <span className="text-[var(--starlight)]">{nodeById.get(noPath.from)?.label}</span> and{' '}
        <span className="text-[var(--starlight)]">{nodeById.get(noPath.to)?.label}</span> in its dataset, so it shows none.
        You can drag from one event's handle to the other to record a link of your own, clearly marked as yours.
      </p>
      <button className="btn mt-3" onClick={() => useStore.setState({ noPath: null })}>Dismiss</button>
    </div>
  )
}
