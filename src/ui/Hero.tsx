import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useStore } from '../state/store'
import { Combobox } from './Combobox'
import { FEATURED } from '../data/pairs'

/** State A: an invitation, set over a live universe. Leaving it is a departure, not a hide. */
export function Hero() {
  const [q, setQ] = useState('')
  const reduce = useReducedMotion()
  const enter = useStore((s) => s.enterExplore)
  const focusNode = useStore((s) => s.focusNode)
  const openAdd = useStore((s) => s.openAdd)
  return (
    <motion.section
      aria-label="Introduction"
      className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-start px-5 pt-[11vh] text-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.08, filter: 'blur(10px)', y: -18 }}
      transition={{ duration: reduce ? 0.2 : 1.5, ease: [0.22, 0.61, 0.36, 1] }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 30%, rgba(5,7,19,0.74), rgba(5,7,19,0.3) 58%, transparent 82%)' }} />
      <div className="pointer-events-none relative flex max-w-[980px] flex-col items-center">
        <div className="mb-6 flex items-center gap-4 text-[10.5px] dim">
          <span aria-hidden="true" className="block h-px w-10" style={{ background: 'linear-gradient(90deg, transparent, var(--gold))' }} />
          <span className="caps" style={{ letterSpacing: '0.46em' }}>A living universe of knowledge</span>
          <span aria-hidden="true" className="block h-px w-10" style={{ background: 'linear-gradient(270deg, transparent, var(--gold))' }} />
        </div>
        <h1 className="serif m-0 text-[clamp(46px,9vw,128px)] font-light leading-[0.92] tracking-[-0.02em]" style={{ textShadow: '0 0 60px rgba(5,7,19,0.95)' }}>
          What connects<br />
          <em className="font-normal" style={{ background: 'linear-gradient(100deg, #e8edf8 10%, #9fcbff 55%, #b7a8ff 95%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', paddingRight: '0.08em' }}>everything?</em>
        </h1>
        <p className="serif mb-0 mt-6 max-w-[34ch] text-[clamp(18px,2vw,26px)] font-light italic dim" style={{ textShadow: '0 0 20px #050713' }}>
          Two seemingly unrelated events. One hidden chain.
        </p>
        <form
          className="pointer-events-auto mt-9 flex w-[min(560px,92vw)] items-end gap-3 rounded-full border border-[var(--line)] bg-[rgba(8,11,26,0.5)] px-6 py-2.5 backdrop-blur-md"
          onSubmit={(e) => { e.preventDefault(); if (q.trim().length > 1) openAdd(q.trim()); else enter() }}
        >
          <Combobox className="flex-1 text-left" label="Search for an event" hideLabel placeholder="Search any event or idea" value={q} onValue={setQ} onPick={(n) => focusNode(n.id)} onAdd={(t) => openAdd(t)} large bare />
          <button type="button" className="btn my-0.5 shrink-0 rounded-full border-[var(--gold)] px-5 text-[var(--starlight)]" style={{ borderColor: 'rgba(232,190,121,0.6)' }} onClick={enter}>Enter the universe <span aria-hidden="true">→</span></button>
        </form>
        <button type="button" className="pointer-events-auto mt-5 border-0 bg-transparent text-[13px] dim underline-offset-4 hover:underline"
          onClick={() => useStore.getState().runDemo(FEATURED.id)}>
          or watch <span className="serif text-[19px] italic text-[var(--starlight)]">{FEATURED.title.toLowerCase().replace('u.s.', 'U.S.')}</span>
        </button>
      </div>
      <button type="button" onClick={enter} aria-label="Scroll to explore"
        className="caps pointer-events-auto absolute bottom-0 flex flex-col items-center gap-3 border-0 bg-transparent pb-[max(18px,env(safe-area-inset-bottom))] text-[10.5px] dim" style={{ letterSpacing: '0.36em' }}>
        Scroll to explore
        <span className="scroll-cue" aria-hidden="true" />
      </button>
    </motion.section>
  )
}
