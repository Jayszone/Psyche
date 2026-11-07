import { useEffect, useMemo } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useStore } from '../state/store'
import { EvidenceBadge, EVIDENCE_LABEL } from './Evidence'
import { catColor } from './Combobox'

const DWELL_MS = 4600

/** Narration and transport for State C. */
export function JourneyCard() {
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

  // Autoplay: dwell on each stop, then travel on.
  useEffect(() => {
    if (!journey?.playing || !journey.ready) return
    const id = setTimeout(() => st().journeyNext(), journey.step === 0 ? 1600 : DWELL_MS)
    return () => clearTimeout(id)
  }, [journey?.playing, journey?.ready, journey?.step, st])

  const show = mode === 'journey' && journey && route
  const last = route ? route.nodeIds.length - 1 : 0
  const step = journey?.step ?? 0
  const node = route ? nodeById.get(route.nodeIds[step]) : undefined
  const edge = route && step < last ? edgeById.get(route.edgeIds[step]) : undefined
  const reversed = route && step < last ? route.reversed[step] : false
  const next = route && step < last ? nodeById.get(route.nodeIds[step + 1]) : undefined
  const weakIdx = route ? route.edgeIds.reduce((w, id, i) => {
    const rank = { strong: 0, plausible: 1, user: 2, speculative: 3 } as const
    return rank[edgeById.get(id)!.evidence] > rank[edgeById.get(route.edgeIds[w])!.evidence] ? i : w
  }, 0) : 0

  return (
    <AnimatePresence>
      {show && (
        <motion.section
          aria-label="Connection journey"
          className="pointer-events-auto panel mx-auto flex max-h-[52vh] w-[min(680px,100%)] flex-col gap-2 overflow-auto p-3 sm:max-h-none sm:gap-3 sm:p-4"
          initial={{ opacity: 0, y: reduce ? 0 : 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduce ? 0 : 18 }} transition={{ duration: 0.5 }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="eyebrow" style={{ color: 'var(--gold)' }}>Hypothetical chain<span className="hidden sm:inline"> · mock data, not a finding</span></div>
            {routes.length > 1 && (
              <div role="group" aria-label="Alternative routes" className="-mx-1 flex max-w-full gap-1.5 overflow-x-auto px-1 sm:mx-0 sm:flex-wrap sm:px-0">
                {routes.map((r, i) => (
                  <button key={i} className={'btn px-2 py-1 text-[11px] sm:px-2.5 sm:text-[11.5px] ' + (i === routeIdx ? 'btn-primary' : '')} aria-pressed={i === routeIdx} onClick={() => st().setRoute(i)}>
                    Route {i + 1} · {r.edgeIds.length} steps
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="dim -mt-1 hidden text-[12px] sm:block">
            {route.label}.{' '}
            {route.directed ? 'Every link follows the stated direction of cause.' : 'Some links are read against their stated direction, so this is an association, not a causal chain.'}
          </div>

          {journey.overview ? (
            <p className="m-0 text-[13px] dim">The whole route is shown. Choose any stop in the list to travel there, or press Overview again to resume.</p>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={step + '-' + routeIdx} initial={{ opacity: 0, y: reduce ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="eyebrow">{step === 0 ? 'Start' : step === last ? 'Destination' : `Step ${step} of ${last - 1}`}</span>
                  {node && <span className="dot" style={{ color: step === 0 || step === last ? 'var(--gold)' : catColor(node.category) }} />}
                </div>
                <h2 className="serif m-0 text-[24px] leading-[1.08] sm:text-[30px]" aria-live="polite">{node?.label}</h2>
                <p className="m-0 hidden text-[13.5px] dim sm:block">{node?.description}</p>
                {edge && next && (
                  <div className="mt-1 border-t border-[var(--line)] pt-3">
                    <div className="eyebrow mb-1">{edge.evidence === 'user' ? 'Your link to' : reversed ? 'Associated with' : 'Might lead to'} · {next.label}</div>
                    <p className="m-0 text-[14px]">{edge.description}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <EvidenceBadge kind={edge.evidence} />
                      {step === weakIdx && route.edgeIds.length > 1 && <span className="text-[11px] faint">weakest link in this route</span>}
                    </div>
                    {edge.references?.map((r) => (
                      <p key={r.title} className="m-0 mt-1.5 text-[11.5px] faint">Reference: {r.title}{r.note ? ` (${r.note})` : ''}</p>
                    ))}
                  </div>
                )}
                {step === last && (
                  <p className="m-0 mt-1 border-t border-[var(--line)] pt-3 text-[13px] dim">
                    The chain ends here. Its weakest link is {EVIDENCE_LABEL[route.weakest].toLowerCase()}, so treat the whole as a hypothesis worth testing.
                    {route.includesUser && ' It includes a link you added yourself.'}
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          )}

          <div className="sticky bottom-0 -mx-3 -mb-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] bg-[rgba(9,12,28,0.96)] px-3 pb-3 pt-2.5 sm:static sm:m-0 sm:gap-3 sm:bg-transparent sm:p-0 sm:pt-3">
            <div role="group" aria-label="Journey progress" className="flex items-center gap-1.5">
              {route.nodeIds.map((id, i) => (
                <button key={id + i} aria-label={`Go to ${nodeById.get(id)?.label}`} aria-current={i === step} onClick={() => st().journeyGoto(i)}
                  className="grid h-5 w-5 place-items-center border-0 bg-transparent p-0">
                  <span style={{ width: i === step ? 9 : 6, height: i === step ? 9 : 6, borderRadius: '50%', background: i === 0 || i === last ? 'var(--gold)' : i <= step ? 'var(--electric)' : 'rgba(232,237,248,.28)', boxShadow: i === step ? '0 0 10px var(--starlight)' : 'none', transition: 'all .3s' }} />
                </button>
              ))}
            </div>
            <div role="group" aria-label="Journey controls" className="flex flex-wrap items-center gap-1.5">
              <button className="btn btn-icon" aria-label="Restart" title="Restart" onClick={() => st().journeyRestart()}>⟲</button>
              <button className="btn btn-icon" aria-label="Previous step" title="Previous (←)" disabled={step === 0} onClick={() => st().journeyPrev()}>‹</button>
              <button className="btn btn-primary min-w-[78px]" onClick={() => (journey.playing ? st().journeyPause() : st().journeyPlay())}>{journey.playing ? 'Pause' : 'Play'}</button>
              <button className="btn btn-icon" aria-label="Next step" title="Next (→)" disabled={step >= last} onClick={() => st().journeyNext()}>›</button>
              <button className="btn" aria-pressed={journey.overview} onClick={() => st().journeyOverview()}>Overview</button>
              <button className="btn" onClick={() => st().exitJourney()}>Exit</button>
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
    <section aria-label="Whole route" className="pointer-events-auto panel flex max-h-full w-[min(300px,100%)] flex-col gap-1 self-start overflow-auto p-4">
      <div className="eyebrow mb-1" style={{ color: 'var(--gold)' }}>The whole chain</div>
      <ol className="m-0 flex list-none flex-col p-0">
        {route.nodeIds.map((id, i) => {
          const n = nodeById.get(id)!
          const e = i < last ? edgeById.get(route.edgeIds[i]) : null
          return (
            <li key={id + i}>
              <button className="flex w-full items-center gap-2.5 border-0 bg-transparent p-0 py-1 text-left hover:text-white"
                onClick={() => { useStore.getState().journeyOverview(false); useStore.getState().journeyGoto(i) }}>
                <span className="dot" style={{ color: i === 0 || i === last ? 'var(--gold)' : catColor(n.category) }} />
                <span className="serif text-[17px] leading-tight">{n.label}</span>
              </button>
              {e && <div className="ml-[3px] border-l border-[var(--line)] py-1 pl-4"><EvidenceBadge kind={e.evidence} /></div>}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
