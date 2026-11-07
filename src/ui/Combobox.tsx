import { useId, useMemo, useRef, useState } from 'react'
import { useStore } from '../state/store'
import { hasExactLabel, searchNodes } from '../graph/search'
import { categoryRgb } from '../three/scale'
import type { GraphNode } from '../graph/types'

export const catColor = (id: string) => { const [r, g, b] = categoryRgb(id); return `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})` }

interface Props {
  id?: string
  label: string
  placeholder: string
  /** Controlled text. */
  value: string
  onValue: (v: string) => void
  onPick: (n: GraphNode) => void
  /** Offer "Add as new event" when nothing matches exactly. */
  onAdd?: (text: string) => void
  hideLabel?: boolean
  className?: string
  large?: boolean
  /** No underline: the surrounding container supplies the field chrome. */
  bare?: boolean
}

/** Keyboard-operable combobox over the graph's events (ARIA 1.2 pattern). */
export function Combobox({ id, label, placeholder, value, onValue, onPick, onAdd, hideLabel, className, large, bare }: Props) {
  const nodes = useStore((s) => s.graph.nodes)
  const uid = useId()
  const inputId = id ?? uid + '-in'
  const listId = uid + '-list'
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const ref = useRef<HTMLInputElement>(null)
  const hits = useMemo(() => searchNodes(nodes, value, 6), [nodes, value])
  const canAdd = !!onAdd && value.trim().length > 1 && !hasExactLabel(nodes, value)
  const total = hits.length + (canAdd ? 1 : 0)

  const choose = (i: number) => {
    if (i < hits.length) { onPick(hits[i].node); setOpen(false) }
    else if (canAdd) { onAdd!(value.trim()); setOpen(false) }
  }

  return (
    <div className={'relative ' + (className ?? '')}>
      <label htmlFor={inputId} className={hideLabel ? 'sr-only' : 'field-label'}>{label}</label>
      <input
        ref={ref} id={inputId} className="input" style={{ ...(large ? { fontSize: 17, padding: '9px 2px' } : null), ...(bare ? { borderBottom: 'none', boxShadow: 'none' } : null) }}
        role="combobox" aria-expanded={open} aria-controls={listId} aria-autocomplete="list"
        aria-activedescendant={open && total ? `${uid}-o${active}` : undefined}
        autoComplete="off" spellCheck={false} placeholder={placeholder} value={value}
        onChange={(e) => { onValue(e.target.value); setOpen(true); setActive(0) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => (total ? (a + 1) % total : 0)) }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (total ? (a - 1 + total) % total : 0)) }
          else if (e.key === 'Enter') { if (open && total) { e.preventDefault(); choose(active) } }
          else if (e.key === 'Escape') { if (open) { e.stopPropagation(); setOpen(false) } }
        }}
      />
      {open && total > 0 && (
        <ul id={listId} role="listbox" aria-label={label + ' suggestions'} className="listbox">
          {hits.map((h, i) => (
            <li key={h.node.id} id={`${uid}-o${i}`} role="option" aria-selected={i === active} className="option"
              onMouseDown={(e) => { e.preventDefault(); choose(i) }} onMouseEnter={() => setActive(i)}>
              <span className="dot" style={{ color: catColor(h.node.category) }} aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">{h.node.label}</span>
              <span className="faint text-[10.5px] uppercase tracking-widest">{h.node.category}</span>
            </li>
          ))}
          {canAdd && (
            <li id={`${uid}-o${hits.length}`} role="option" aria-selected={active === hits.length} className="option"
              onMouseDown={(e) => { e.preventDefault(); choose(hits.length) }} onMouseEnter={() => setActive(hits.length)}>
              <span aria-hidden="true" style={{ color: 'var(--gold)' }}>+</span>
              <span className="min-w-0 flex-1 truncate">Add “{value.trim()}” as a new event</span>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
