import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useStore } from '../state/store'
import { Combobox } from './Combobox'
import { DEMO_PAIRS } from '../data/dataset'

/** State A: the headline sits over a live, already-interactive universe. */
export function Hero() {
  const [q, setQ] = useState('')
  const reduce = useReducedMotion()
  const featured = DEMO_PAIRS.find((d) => d.featured)!
  const enter = useStore((s) => s.enterExplore)
  const focusNode = useStore((s) => s.focusNode)
  const openAdd = useStore((s) => s.openAdd)
  return (
    <motion.section
      aria-label="Introduction"
      className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-start px-5 pt-[13vh] text-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0.2 : 1.1 }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 62% 38% at 50% 27%, rgba(5,7,19,0.78), rgba(5,7,19,0.35) 55%, transparent 80%)' }} />
      <div className="pointer-events-none relative flex max-w-[860px] flex-col items-center gap-5">
        <h1 className="serif m-0 text-[clamp(40px,7.2vw,92px)] leading-[1.02] tracking-[-0.015em]" style={{ textShadow: '0 0 40px rgba(5,7,19,0.9)' }}>
          What connects <em>everything?</em>
        </h1>
        <p className="m-0 max-w-[40ch] text-[clamp(14px,1.6vw,17px)] dim" style={{ textShadow: '0 0 16px #050713' }}>
          Two seemingly unrelated events. One hidden chain.
        </p>
        <form
          className="pointer-events-auto mt-3 flex w-[min(460px,92vw)] items-end gap-3"
          onSubmit={(e) => { e.preventDefault(); if (q.trim().length > 1) openAdd(q.trim()); else enter() }}
        >
          <Combobox
            className="flex-1 text-left" label="Search for an event" hideLabel placeholder="Search an event" large
            value={q} onValue={setQ} onPick={(n) => focusNode(n.id)} onAdd={(t) => openAdd(t)}
          />
          <button type="button" className="btn btn-primary" onClick={enter}>Enter the universe</button>
        </form>
        <button
          type="button"
          className="pointer-events-auto mt-1 text-[13px] dim underline-offset-4 hover:underline"
          onClick={() => useStore.getState().runDemo(featured.id)}
        >
          Or watch: <span className="serif text-[16px] text-[var(--starlight)]">{featured.title}</span>
        </button>
      </div>
      <button
        type="button" onClick={enter} aria-label="Scroll to explore"
        className="pointer-events-auto absolute bottom-0 flex flex-col items-center gap-3 border-0 bg-transparent pb-[max(18px,env(safe-area-inset-bottom))] text-[11px] uppercase tracking-[0.3em] dim"
      >
        Scroll to explore
        <span className="scroll-cue" aria-hidden="true" />
      </button>
    </motion.section>
  )
}
