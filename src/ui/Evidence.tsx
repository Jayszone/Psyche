import type { Evidence } from '../graph/types'

export const EVIDENCE_LABEL: Record<Evidence, string> = {
  strong: 'Well supported', plausible: 'Plausible but uncertain', speculative: 'Hypothetical', user: 'User-defined',
}
export const EVIDENCE_NOTE: Record<Evidence, string> = {
  strong: 'Continuous thread. Widely documented in this mock dataset.',
  plausible: 'Dashed thread. A reasonable link with real uncertainty.',
  speculative: 'Faint, intermittent thread. A hypothesis that may not hold.',
  user: 'Dotted neutral thread. Added by you; not verified by Psyche.',
}

/** A small line sample that matches how the relationship is drawn in 3D. */
export function Swatch({ kind, width = 30 }: { kind: Evidence; width?: number }) {
  const common = { x1: 1, x2: width - 1, y1: 4, y2: 4, strokeLinecap: 'round' as const }
  return (
    <svg width={width} height="8" viewBox={`0 0 ${width} 8`} aria-hidden="true" className="flex-none">
      {kind === 'strong' && <line {...common} stroke="#74B9FF" strokeWidth="2" />}
      {kind === 'plausible' && <line {...common} stroke="#74B9FF" strokeWidth="1.6" strokeDasharray="5 3.5" />}
      {kind === 'speculative' && <line {...common} stroke="#9984F5" strokeWidth="1.4" strokeDasharray="1.5 6" opacity="0.8" />}
      {kind === 'user' && <line {...common} stroke="#D6E0F7" strokeWidth="1.8" strokeDasharray="0.1 4" />}
    </svg>
  )
}

export function EvidenceBadge({ kind }: { kind: Evidence }) {
  return (
    <span className="inline-flex items-center gap-2 text-[11px] dim">
      <Swatch kind={kind} width={26} />
      {EVIDENCE_LABEL[kind]}
    </span>
  )
}
