import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useStore } from '../state/store'
import { journeyRuntime } from '../graph/journey'
import { EvidenceBadge, EVIDENCE_LABEL } from './Evidence'
import { catColor } from './Combobox'
import type { Evidence } from '../graph/types'

const RANK: Record<Evidence, number> = { strong: 0, plausible: 1, user: 2, speculative: 3 }

/** Journey navigation: where you came from, where you are going, and why this link exists. Compact by design. */
export function JourneyHUD() {
  const mode = useStore((s) => s.mode)
  const journey = useStore((s) => s.journey)
  const routes = useStore((s) => s.routes)
  const routeIdx = useStore((s) => s.routeIdx)
  const graph = useStore((s) => s.graph)
  const nodeById = useStore((s) => s.nodeById)
  const reduce = useReducedMotion()
  const st = useStore.getState
  const route = routes[routeIdx]
  const edgeById = useMemo(() => new Map(graph.edges.map((e) => [e.id, e])), [graph.edges])
  const fill = useRef<HTMLDivElement>(null)
  const [seg, setSeg] = useState(0)

  // Follow continuous progress without re-rendering every frame: only a change of segment updates React.
  useEffect(() => {
    if (!route) return
    let raf = 0
    const last = route.edgeIds.length
    const loop = () => {
      raf = requestAnimationFrame(loop)
      const t = journeyRuntime.t
      if (fill.current) fill.current.style.width = `${(Math.min(last, t) / last) * 100}%`
      setSeg((p) => { const n = Math.max(0, Math.min(last - 1, Math.floor(t + 0.02))); return n === p ? p : n })
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [route])

  const show = mode === 'journey' && journey && route
  const last = route ? route.nodeIds.length - 1 : 0
  const step = journey?.step ?? 0
  const arrived = !!route && step >= last && journeyRuntime.t > last - 0.05
  const from = route ? nodeById.get(route.nodeIds[Math.min(seg, last - 1)]) : undefined
  const to = route ? nodeById.get(route.nodeIds[Math.min(seg, last - 1) + 1]) : undefined
  const edge = route ? edgeById.get(route.edgeIds[Math.min(seg, last - 1)]) : undefined
  const reversed = route ? route.reversed[Math.min(seg, last - 1)] : false
  const prev = route && step > 0 ? nodeById.get(route.nodeIds[step - 1]) : undefined
  const next = route && step < last ? nodeById.get(route.nodeIds[step + 1]) : undefined
  const weak = route ? route.edgeIds.reduce((w, id, i) => (RANK[edgeById.get(id)!.evidence] > RANK[edgeById.get(route.edgeIds[w])!.evidence] ? i : w), 0) : 0

  return (
    <AnimatePresence>
      {show && (
        <motion.section
          aria-label="Connection journey"
          className="pointer-events-auto panel mx-auto flex w-[min(780px,100%)] flex-col gap-2.5 rounded-[12px] px-4 pb-3 pt-3 sm:px-5"
          initial={{ opacity: 0, y: reduce ? 0 : 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduce ? 0 : 20 }} transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between gap-3 text-[12px]">
            <button className="serif max-w-[30%] truncate border-0 bg-transparent p-0 text-left text-[16px] italic dim hover:text-white disabled:opacity-0 max-sm:hidden" disabled={!prev} onClick={() => st().journeyGoto(step - 1)}>
              {prev ? '‹ ' + prev.label : ''}
            </button>
            <div className="caps flex-1 text-center text-[10px]" style={{ color: 'var(--gold)', letterSpacing: '0.3em' }}>
              {arrived ? 'Arrived' : `Step ${Math.min(last, Math.max(1, seg + 1))} of ${last}`}<span className="hidden sm:inline faint"> · hypothetical</span>
            </div>
            <button className="serif max-w-[30%] truncate border-0 bg-transparent p-0 text-right text-[16px] italic dim hover:text-white disabled:opacity-0 max-sm:hidden" disabled={!next} onClick={() => st().journeyGoto(step + 1)}>
              {next ? next.label + ' ›' : ''}
            </button>
          </div>

          {/* timeline: each stretch is drawn like its evidence, and fills as the journey advances */}
          <div className="relative h-[26px]" role="group" aria-label="Journey progress">
            <div className="absolute inset-x-[10px] top-1/2 -translate-y-1/2">
              <div className="relative flex w-full">
                {route.edgeIds.map((id, i) => {
                  const ev = edgeById.get(id)!.evidence
                  const css = ev === 'strong' ? { borderTop: '2px solid #74B9FF' } : ev === 'plausible' ? { borderTop: '2px dashed #74B9FF' } : ev === 'speculative' ? { borderTop: '2px dotted #9984F5', opacity: 0.8 } : { borderTop: '2px dotted #E8EDF8' }
                  return <div key={id + i} className="flex-1" aria-hidden="true" style={{ height: 0, margin: '0 10px', ...css }} />
                })}
              </div>
              <div ref={fill} className="absolute left-0" style={{ width: 0, top: -3, height: 6, borderRadius: 3, background: 'linear-gradient(90deg, rgba(116,185,255,0), rgba(232,237,248,0.75))', boxShadow: '0 0 10px rgba(116,185,255,0.6)' }} />
            </div>
            <div className="absolute inset-x-[10px] top-0 flex h-full items-center justify-between">
              {route.nodeIds.map((id, i) => {
                const n = nodeById.get(id)!
                const end = i === 0 || i === last
                return (
                  <button key={id + i} title={n.label} aria-label={`Go to ${n.label}`} aria-current={i === step} onClick={() => st().journeyGoto(i)}
                    className="relative -mx-[10px] grid h-[26px] w-[20px] place-items-center border-0 bg-transparent p-0">
                    <span style={{
                      width: i === step ? 12 : end ? 9 : 7, height: i === step ? 12 : end ? 9 : 7, borderRadius: '50%',
                      background: end ? 'var(--gold)' : i <= step ? catColor(n.category) : 'rgba(232,237,248,.3)',
                      boxShadow: i === step ? `0 0 14px ${end ? 'var(--gold)' : catColor(n.category)}, 0 0 0 3px rgba(232,237,248,0.22)` : 'none', transition: 'all .35s',
                    }} />
                  </button>
                )
              })}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={seg + '-' + routeIdx + '-' + arrived} initial={{ opacity: 0, y: reduce ? 0 : 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="min-h-[44px]">
              {journey.overview ? (
                <p className="m-0 text-[13px] dim">The whole route is in view. Choose a stop in the list, or press Overview again to resume.</p>
              ) : arrived ? (
                <p className="m-0 text-[13.5px] dim">
                  The chain ends at <span className="serif text-[17px] italic text-[var(--starlight)]">{to?.label}</span>. Its weakest link is {EVIDENCE_LABEL[route.weakest].toLowerCase()}, so treat the whole as a hypothesis worth testing.{route.includesUser && ' It includes a link you added.'}
                </p>
              ) : (
                edge && from && to && (
                  <div className="flex flex-col gap-1">
                    <div className="text-[12px] dim">
                      <span className="serif text-[16px] italic text-[var(--starlight)]">{from.label}</span>
                      <span className="mx-1.5" aria-hidden="true">{reversed ? '↔' : '→'}</span>
                      <span className="serif text-[16px] italic text-[var(--starlight)]">{to.label}</span>
                    </div>
                    <p className="m-0 line-clamp-2 text-[13.5px] leading-snug">{edge.description}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5">
                      <EvidenceBadge kind={edge.evidence} />
                      {seg === weak && route.edgeIds.length > 1 && <span className="text-[11px]" style={{ color: 'var(--gold)' }}>weakest link in this route</span>}
                      {reversed && <span className="text-[11px] faint">read against its stated direction</span>}
                    </div>
                  </div>
                )
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] pt-2.5">
            <div role="group" aria-label="Journey controls" className="flex items-center gap-1.5">
              <button className="btn btn-icon" aria-label="Restart" title="Restart (R)" onClick={() => st().journeyRestart()}>⟲</button>
              <button className="btn btn-icon" aria-label="Previous step" title="Previous (←)" disabled={step === 0} onClick={() => st().journeyPrev()}>‹</button>
              <button className="btn btn-primary min-w-[74px]" onClick={() => (journey.playing ? st().journeyPause() : st().journeyPlay())}>{journey.playing ? 'Pause' : 'Play'}</button>
              <button className="btn btn-icon" aria-label="Next step" title="Next (→)" disabled={step >= last} onClick={() => st().journeyNext()}>›</button>
              <button className="btn" aria-pressed={journey.overview} title="Whole route (O)" onClick={() => st().journeyOverview()}>Overview</button>
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              {routes.length > 1 && (
                <label className="flex min-w-0 flex-1 items-center gap-1.5 text-[11.5px] dim sm:flex-none">
                  <span className="sr-only sm:not-sr-only">Route</span>
                  <select className="btn w-full min-w-0 rounded-[4px] bg-[#0a0d1e] py-1.5 pr-2 text-[11.5px] sm:w-auto" value={routeIdx} onChange={(e) => st().setRoute(Number(e.target.value))} aria-label="Alternative routes">
                    {routes.map((r, i) => <option key={i} value={i}>{i + 1} of {routes.length} · {r.edgeIds.length} steps · {r.label.replace('Via ', '')}</option>)}
                  </select>
                </label>
              )}
              <button className="btn shrink-0" onClick={() => st().exitJourney()}>Exit</button>
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  )
}

/** Overview mode: the whole chain as a list beside the 3D view, so the route itself stays visible. */
export function RouteList() {
  const journey = useStore((s) => s.journey)
  const mode = useStore((s) => s.mode)
  const routes = useStore((s) => s.routes)
  const routeIdx = useStore((s) => s.routeIdx)
  const nodeById = useStore((s) => s.nodeById)
  const edges = useStore((s) => s.graph.edges)
  const route = routes[routeIdx]
  if (mode !== 'journey' || !journey?.overview || !route) return null
  const edgeById = new Map(edges.map((e) => [e.id, e]))
  const last = route.nodeIds.length - 1
  return (
    <section aria-label="Whole route" className="pointer-events-auto panel flex max-h-full w-[min(300px,100%)] flex-col gap-1 self-start overflow-auto rounded-[10px] p-4">
      <div className="caps mb-1 text-[10px]" style={{ color: 'var(--gold)' }}>The whole chain</div>
      <ol className="m-0 flex list-none flex-col p-0">
        {route.nodeIds.map((id, i) => {
          const n = nodeById.get(id)!
          const e = i < last ? edgeById.get(route.edgeIds[i]) : null
          return (
            <li key={id + i}>
              <button className="flex w-full items-center gap-2.5 border-0 bg-transparent p-0 py-1 text-left hover:text-white"
                onClick={() => { useStore.getState().journeyOverview(false); useStore.getState().journeyGoto(i) }}>
                <span className="dot" style={{ color: i === 0 || i === last ? 'var(--gold)' : catColor(n.category) }} />
                <span className="serif text-[18px] leading-tight">{n.label}</span>
              </button>
              {e && <div className="ml-[3px] border-l border-[var(--line)] py-1 pl-4"><EvidenceBadge kind={e.evidence} /></div>}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
