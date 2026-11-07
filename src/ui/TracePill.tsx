import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useStore } from '../state/store'
import { Combobox } from './Combobox'
import { ALL_PAIRS } from '../data/pairs'

/** A floating, compact way to ask "how does A reach B?". Collapsed it is a single pill. */
export function TracePill() {
  const mode = useStore((s) => s.mode)
  const fromId = useStore((s) => s.fromId)
  const toId = useStore((s) => s.toId)
  const nodeById = useStore((s) => s.nodeById)
  const setFrom = useStore((s) => s.setFrom)
  const setTo = useStore((s) => s.setTo)
  const trace = useStore((s) => s.trace)
  const openAdd = useStore((s) => s.openAdd)
  const focusNode = useStore((s) => s.focusNode)
  const reduce = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => { setA(fromId ? nodeById.get(fromId)?.label ?? '' : '') }, [fromId, nodeById])
  useEffect(() => { setB(toId ? nodeById.get(toId)?.label ?? '' : '') }, [toId, nodeById])
  // Opening the pill because a node panel set an endpoint
  useEffect(() => { if ((fromId || toId) && mode === 'explore') setOpen(true) }, [fromId, toId, mode])
  useEffect(() => { if (mode === 'journey') setOpen(false) }, [mode])
  useEffect(() => {
    if (!open) return
    const on = (e: PointerEvent) => { if (box.current && !box.current.contains(e.target as Node) && !(e.target as HTMLElement).closest('[role="listbox"]')) setOpen(false) }
    document.addEventListener('pointerdown', on)
    return () => document.removeEventListener('pointerdown', on)
  }, [open])

  const ready = !!fromId && !!toId && fromId !== toId

  if (mode === 'journey') {
    const A = fromId && nodeById.get(fromId), B = toId && nodeById.get(toId)
    return (
      <div className="pointer-events-auto panel flex max-w-[min(560px,92vw)] items-center gap-3 rounded-full px-5 py-2 text-[13px]">
        <span className="serif truncate text-[17px] italic">{A ? A.label : ''}</span>
        <span className="faint" aria-hidden="true">→</span>
        <span className="serif truncate text-[17px] italic">{B ? B.label : ''}</span>
      </div>
    )
  }

  return (
    <div ref={box} className="pointer-events-auto relative">
      <button className="panel flex items-center gap-2.5 rounded-full px-5 py-2.5 text-[12.5px] tracking-wide hover:border-[rgba(232,237,248,0.3)]" aria-expanded={open} onClick={() => setOpen(!open)}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="3.5" cy="12.5" r="2" stroke="#e8edf8" /><circle cx="12.5" cy="3.5" r="2" stroke="#e8edf8" /><path d="M5 11C7 9 7 7 9 6s2-1.5 2.4-1.8" stroke="#74b9ff" strokeLinecap="round" strokeDasharray="1.5 2" /></svg>
        Trace a connection
        <span className="faint" aria-hidden="true">{open ? '–' : '+'}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.section
            aria-label="Trace a connection"
            className="panel absolute left-1/2 top-[calc(100%+10px)] z-20 flex w-[min(640px,92vw)] -translate-x-1/2 flex-col gap-4 rounded-[10px] p-4"
            initial={{ opacity: 0, y: reduce ? 0 : -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduce ? 0 : -8 }} transition={{ duration: 0.28 }}
          >
            <div className="grid grid-cols-1 items-end gap-x-4 gap-y-3 sm:grid-cols-[1fr_auto_1fr]">
              <Combobox label="From" placeholder="Where does it begin?" value={a} onValue={(v) => { setA(v); if (fromId) setFrom(null) }}
                onPick={(n) => { setFrom(n.id); setA(n.label); if (!toId) focusNode(n.id) }} onAdd={(t) => openAdd(t)} />
              <span aria-hidden="true" className="hidden pb-2 text-[17px] faint sm:block">→</span>
              <Combobox label="To" placeholder="What does it reach?" value={b} onValue={(v) => { setB(v); if (toId) setTo(null) }}
                onPick={(n) => { setTo(n.id); setB(n.label); if (!fromId) focusNode(n.id) }} onAdd={(t) => openAdd(t)} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button className="btn btn-primary px-5" disabled={!ready} onClick={() => { setOpen(false); trace() }}>Trace connection</button>
              <span className="text-[11.5px] faint">{ready ? 'Ready.' : 'Choose two different events.'}</span>
            </div>
            <div>
              <div className="eyebrow mb-1.5">Surprising journeys</div>
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                {ALL_PAIRS.map((d) => (
                  <button key={d.id} title={d.blurb} className="serif shrink-0 rounded-full border border-[var(--line)] bg-[rgba(232,237,248,0.03)] px-3.5 py-1 text-[15px] italic hover:border-[rgba(232,237,248,0.35)]"
                    onClick={() => { setOpen(false); useStore.getState().runDemo(d.id) }}>
                    {d.title}
                  </button>
                ))}
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}
