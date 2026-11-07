import { useEffect, useState } from 'react'
import { useStore } from '../state/store'
import { Combobox } from './Combobox'
import { DEMO_PAIRS } from '../data/dataset'

/** Source and destination selectors plus the Trace Connection action. */
export function ConnectBar() {
  const fromId = useStore((s) => s.fromId)
  const toId = useStore((s) => s.toId)
  const nodeById = useStore((s) => s.nodeById)
  const setFrom = useStore((s) => s.setFrom)
  const setTo = useStore((s) => s.setTo)
  const trace = useStore((s) => s.trace)
  const openAdd = useStore((s) => s.openAdd)
  const focusNode = useStore((s) => s.focusNode)
  const mode = useStore((s) => s.mode)
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [open, setOpen] = useState(true)

  // Keep the text in step with the ids chosen elsewhere (node panel, demos).
  useEffect(() => { setA(fromId ? nodeById.get(fromId)?.label ?? '' : '') }, [fromId, nodeById])
  useEffect(() => { setB(toId ? nodeById.get(toId)?.label ?? '' : '') }, [toId, nodeById])
  useEffect(() => { if (typeof matchMedia !== 'undefined' && matchMedia('(max-width: 700px)').matches) setOpen(false) }, [])

  const ready = !!fromId && !!toId && fromId !== toId
  return (
    <section aria-label="Trace a connection" className="pointer-events-auto panel w-full max-w-[720px] px-4 py-3">
      <button className="eyebrow mb-1 flex w-full items-center justify-between border-0 bg-transparent p-0 text-left sm:hidden" onClick={() => setOpen(!open)} aria-expanded={open}>
        Trace a connection <span aria-hidden="true">{open ? '–' : '+'}</span>
      </button>
      <div className={(open ? 'grid' : 'hidden sm:grid') + ' grid-cols-1 items-end gap-x-4 gap-y-3 sm:grid-cols-[1fr_auto_1fr_auto]'}>
        <Combobox label="Start event" placeholder="Where does it begin?" value={a}
          onValue={(v) => { setA(v); if (fromId) setFrom(null) }}
          onPick={(n) => { setFrom(n.id); setA(n.label); if (!toId) focusNode(n.id) }} onAdd={(t) => openAdd(t)} />
        <span aria-hidden="true" className="hidden pb-2 text-[18px] faint sm:block">→</span>
        <Combobox label="Destination" placeholder="What does it reach?" value={b}
          onValue={(v) => { setB(v); if (toId) setTo(null) }}
          onPick={(n) => { setTo(n.id); setB(n.label); if (!fromId) focusNode(n.id) }} onAdd={(t) => openAdd(t)} />
        <button className="btn btn-primary" disabled={!ready} onClick={() => trace()} title={ready ? 'Find the chain between these events' : 'Choose two different events'}>
          Trace connection
        </button>
      </div>
      {open && mode !== 'journey' && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px]">
          <span className="eyebrow">Try</span>
          {DEMO_PAIRS.map((d) => (
            <button key={d.id} className="dim underline-offset-4 hover:text-[var(--starlight)] hover:underline" title={d.blurb} onClick={() => useStore.getState().runDemo(d.id)}>
              {d.title.replace(' to ', ' → ').replace('U.S. midterm elections', 'Midterms').replace(' in Japan', '')}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
