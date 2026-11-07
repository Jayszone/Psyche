import { useMemo, useState } from 'react'
import { useStore } from '../state/store'
import { findPaths } from '../graph/pathfinding'
import { describePath } from '../graph/journey'
import { Combobox } from './Combobox'
import { EvidenceBadge } from './Evidence'
import { Legend } from './Legend'

/** Used when WebGL is unavailable. Same graph and pathfinding, presented as plain, accessible text. */
export function Fallback({ reason }: { reason?: string }) {
  const graph = useStore((s) => s.graph)
  const nodeById = useStore((s) => s.nodeById)
  const [a, setA] = useState(''), [b, setB] = useState('')
  const [ids, setIds] = useState<{ a?: string; b?: string }>({})
  const [done, setDone] = useState(false)
  const routes = useMemo(() => (done && ids.a && ids.b ? findPaths(graph, ids.a, ids.b, 3) : []), [done, ids, graph])
  const edgeById = useMemo(() => new Map(graph.edges.map((e) => [e.id, e])), [graph.edges])
  return (
    <main className="mx-auto flex h-full max-w-[720px] flex-col gap-6 overflow-auto px-5 py-8" style={{ background: 'var(--void)' }}>
      <header>
        <div className="text-[13px] font-medium uppercase tracking-[0.46em]">Psyche</div>
        <h1 className="serif mt-3 text-[clamp(34px,8vw,56px)] leading-[1.05]">What connects <em>everything?</em></h1>
        <p className="dim mt-2">Two seemingly unrelated events. One hidden chain.</p>
        <p className="faint mt-2 text-[12.5px]">{reason ?? '3D graphics are not available here, so this is the text version of the same data.'}</p>
      </header>
      <form className="panel grid gap-4 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end" onSubmit={(e) => { e.preventDefault(); setDone(true) }}>
        <Combobox label="Start event" placeholder="Where does it begin?" value={a} onValue={(v) => { setA(v); setDone(false) }} onPick={(n) => { setA(n.label); setIds((s) => ({ ...s, a: n.id })); setDone(false) }} />
        <Combobox label="Destination" placeholder="What does it reach?" value={b} onValue={(v) => { setB(v); setDone(false) }} onPick={(n) => { setB(n.label); setIds((s) => ({ ...s, b: n.id })); setDone(false) }} />
        <button className="btn btn-primary" type="submit" disabled={!ids.a || !ids.b || ids.a === ids.b}>Trace connection</button>
      </form>
      {done && routes.length === 0 && <p role="alert" className="panel p-4 dim">No relationship between these events exists in the dataset, and Psyche will not invent one.</p>}
      {routes.map((r, i) => (
        <section key={i} className="panel p-4" aria-label={`Route ${i + 1}`}>
          <div className="eyebrow mb-1">Route {i + 1} · {r.edgeIds.length} steps · {r.label}</div>
          <p className="sr-only">{describePath(r, graph)}</p>
          <ol className="m-0 list-none p-0">
            {r.nodeIds.map((id, k) => (
              <li key={id + k} className="py-1">
                <div className="serif text-[20px]">{nodeById.get(id)?.label}</div>
                {k < r.edgeIds.length && (
                  <div className="my-1.5 ml-2 border-l border-[var(--line)] pl-4 text-[13px]">
                    <div className="dim">{edgeById.get(r.edgeIds[k])?.description}</div>
                    <EvidenceBadge kind={edgeById.get(r.edgeIds[k])!.evidence} />
                  </div>
                )}
              </li>
            ))}
          </ol>
        </section>
      ))}
      <Legend />
    </main>
  )
}
