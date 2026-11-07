import { useState } from 'react'
import { EVIDENCE_LABEL, EVIDENCE_NOTE, Swatch } from './Evidence'
import type { Evidence } from '../graph/types'

const ORDER: Evidence[] = ['strong', 'plausible', 'speculative', 'user']

export function Legend() {
  const [open, setOpen] = useState(() => typeof matchMedia === 'undefined' || !matchMedia('(max-width: 900px)').matches)
  return (
    <section aria-label="Legend" className="pointer-events-auto panel max-w-[270px] px-3.5 py-2.5">
      <button className="eyebrow flex w-full items-center justify-between border-0 bg-transparent p-0" aria-expanded={open} onClick={() => setOpen(!open)}>
        How to read the threads <span aria-hidden="true">{open ? '–' : '+'}</span>
      </button>
      {open && (
        <>
          <ul className="m-0 mt-2.5 flex list-none flex-col gap-2 p-0">
            {ORDER.map((k) => (
              <li key={k} className="flex items-start gap-2.5" title={EVIDENCE_NOTE[k]}>
                <span className="mt-[5px]"><Swatch kind={k} /></span>
                <span><span className="block text-[12px]">{EVIDENCE_LABEL[k]}</span><span className="block text-[11px] faint">{EVIDENCE_NOTE[k].split('. ')[0]}.</span></span>
              </li>
            ))}
          </ul>
          <p className="m-0 mt-2.5 text-[10.5px] leading-snug faint">
            Mock data. These labels are illustrative, not calibrated probabilities, and no relationship here is an established finding.
          </p>
        </>
      )}
    </section>
  )
}
