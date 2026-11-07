import { useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useStore } from '../state/store'
import { Combobox, catColor } from './Combobox'
import { EvidenceBadge } from './Evidence'

/** Compact information overlay for the selected event. */
export function NodePanel() {
  const selectedId = useStore((s) => s.selectedId)
  const node = useStore((s) => (s.selectedId ? s.nodeById.get(s.selectedId) : undefined))
  const edges = useStore((s) => s.graph.edges)
  const nodeById = useStore((s) => s.nodeById)
  const categories = useStore((s) => s.categories)
  const reduce = useReducedMotion()
  const [linkText, setLinkText] = useState('')

  const links = useMemo(() => {
    if (!node) return []
    return edges.filter((e) => e.source === node.id || e.target === node.id).map((e) => {
      const out = e.source === node.id
      return { e, out, other: nodeById.get(out ? e.target : e.source)! }
    }).filter((l) => l.other)
  }, [node, edges, nodeById])

  const cat = node && categories.find((c) => c.id === node.category)
  return (
    <AnimatePresence>
      {node && selectedId && (
        <motion.aside
          key={node.id} role="complementary" aria-label={'Details for ' + node.label}
          className="pointer-events-auto panel flex max-h-full w-[min(340px,100%)] flex-col gap-3 overflow-auto p-4"
          initial={{ opacity: 0, x: reduce ? 0 : 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: reduce ? 0 : 14 }} transition={{ duration: 0.35 }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="eyebrow flex items-center gap-2"><span className="dot" style={{ color: catColor(node.category) }} />{cat?.label}</div>
            <button className="btn btn-icon -mr-1.5 -mt-1.5 border-transparent" aria-label="Close details" onClick={() => useStore.getState().deselect()}>✕</button>
          </div>
          <h2 className="serif m-0 text-[26px] leading-[1.1]">{node.label}</h2>
          <p className="m-0 text-[13.5px] dim">{node.description}</p>
          {node.metadata && (
            <dl className="m-0 flex flex-wrap gap-x-4 gap-y-1 text-[12px]">
              {Object.entries(node.metadata).map(([k, v]) => (<div key={k}><dt className="inline faint">{k}: </dt><dd className="m-0 inline">{v}</dd></div>))}
            </dl>
          )}
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-gold" onClick={() => useStore.getState().setFrom(node.id)}>Start here</button>
            <button className="btn btn-gold" onClick={() => useStore.getState().setTo(node.id)}>End here</button>
          </div>

          <div>
            <div className="eyebrow mb-1.5">Connections · {links.length}</div>
            {links.length === 0 && <p className="m-0 text-[12.5px] faint">No relationships yet. Drag from this event's handle to another event to add one.</p>}
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {links.slice(0, 8).map(({ e, out, other }) => (
                <li key={e.id} className="text-[12.5px]">
                  <button className="flex w-full items-baseline gap-2 border-0 bg-transparent p-0 text-left hover:text-white" onClick={() => useStore.getState().focusNode(other.id)}>
                    <span className="faint" aria-label={out ? 'leads to' : 'is influenced by'}>{out ? '→' : '←'}</span>
                    <span className="flex-1">{other.label}</span>
                  </button>
                  <div className="ml-5 mt-0.5"><EvidenceBadge kind={e.evidence} /></div>
                  <p className="m-0 ml-5 mt-0.5 text-[12px] faint">{e.description}</p>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <Combobox label="Link to another event" placeholder="Search to connect…" value={linkText} onValue={setLinkText}
              onPick={(other) => {
                setLinkText('')
                if (other.id === node.id) { useStore.getState().showToast('An event cannot connect to itself.', 'warn'); return }
                useStore.getState().startConnect(node.id); useStore.getState().setConnectTarget(other.id); useStore.getState().endConnect(true)
              }} />
          </div>
          {node.userCreated && (
            <button className="btn self-start text-[12px]" onClick={() => useStore.getState().removeUserNode(node.id)}>Remove this event</button>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
