import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { pickNodeAt, proj } from '../three/projection'
import { ui } from '../three/RigAndInput'
import { effects, useStore } from '../state/store'

/** The luminous thread that follows the cursor while dragging from a node's handle. */
function Thread() {
  const drag = useStore((s) => s.drag)
  const path = useRef<SVGPathElement>(null)
  const glow = useRef<SVGPathElement>(null)
  const tip = useRef<SVGCircleElement>(null)
  useEffect(() => {
    if (!drag) return
    let raf = 0
    const loop = () => {
      raf = requestAnimationFrame(loop)
      const st = useStore.getState()
      const si = st.indexOf.get(drag.source); if (si === undefined) return
      const sx = proj.x[si], sy = proj.y[si]
      let ex = effects.pointer.x, ey = effects.pointer.y
      const tgt = st.drag?.target
      const ti = tgt ? st.indexOf.get(tgt) : undefined
      if (ti !== undefined) { ex = proj.x[ti]; ey = proj.y[ti] }
      const dx = ex - sx, dy = ey - sy, len = Math.hypot(dx, dy) || 1
      const bend = Math.min(60, len * 0.25)
      const d = `M${sx},${sy} C${sx + dx * 0.35 - (dy / len) * bend},${sy + dy * 0.35 + (dx / len) * bend} ${sx + dx * 0.7 - (dy / len) * bend},${sy + dy * 0.7 + (dx / len) * bend} ${ex},${ey}`
      path.current?.setAttribute('d', d); glow.current?.setAttribute('d', d)
      tip.current?.setAttribute('cx', String(ex)); tip.current?.setAttribute('cy', String(ey))
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [drag?.source]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!drag) return null
  const hot = !!drag.target
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="threadGrad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#74B9FF" /><stop offset="1" stopColor="#E8EDF8" /></linearGradient>
      </defs>
      <path ref={glow} fill="none" stroke={hot ? '#E8BE79' : '#74B9FF'} strokeWidth="8" opacity="0.18" strokeLinecap="round" />
      <path ref={path} fill="none" stroke={hot ? '#F4DDB0' : '#DDEBFF'} strokeWidth="1.8" strokeLinecap="round" strokeDasharray={hot ? undefined : '2 5'} />
      <circle ref={tip} r={hot ? 11 : 5} fill="none" stroke={hot ? '#E8BE79' : '#E8EDF8'} strokeWidth="1.4" />
    </svg>
  )
}

/** A handle at the hovered or selected node that starts a drag-to-connect gesture. */
export function ConnectHandle() {
  const hoveredId = useStore((s) => s.hoveredId)
  const selectedId = useStore((s) => s.selectedId)
  const drag = useStore((s) => s.drag)
  const nodeById = useStore((s) => s.nodeById)
  const id = drag?.source ?? hoveredId ?? selectedId
  const el = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!id) return
    let raf = 0
    const loop = () => {
      raf = requestAnimationFrame(loop)
      const i = useStore.getState().indexOf.get(id)
      if (i === undefined || !el.current) return
      const reach = Math.max(14, proj.radius[i] * 0.9)
      const vis = proj.visible[i] === 1
      el.current.style.opacity = vis ? '1' : '0'
      el.current.style.pointerEvents = vis && !useStore.getState().drag ? 'auto' : 'none'
      el.current.style.transform = `translate(${proj.x[i] + reach * 0.75 + 4}px, ${proj.y[i] - reach * 0.75 - 30}px)`
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [id])

  const start = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!id) return
    e.preventDefault(); e.stopPropagation()
    const target = e.currentTarget
    target.setPointerCapture(e.pointerId)
    effects.pointer.x = e.clientX; effects.pointer.y = e.clientY
    useStore.getState().startConnect(id)
    const move = (ev: PointerEvent) => {
      effects.pointer.x = ev.clientX; effects.pointer.y = ev.clientY
      const idx = pickNodeAt(ev.clientX, ev.clientY, id, 12)
      useStore.getState().setConnectTarget(idx >= 0 ? proj.ids[idx] : null)
    }
    const end = (ev: PointerEvent) => {
      target.removeEventListener('pointermove', move); target.removeEventListener('pointerup', end); target.removeEventListener('pointercancel', cancel)
      move(ev)
      useStore.getState().endConnect(true)
    }
    const cancel = () => {
      target.removeEventListener('pointermove', move); target.removeEventListener('pointerup', end); target.removeEventListener('pointercancel', cancel)
      useStore.getState().endConnect(false)
    }
    target.addEventListener('pointermove', move); target.addEventListener('pointerup', end); target.addEventListener('pointercancel', cancel)
  }

  return (
    <>
      <Thread />
      {id && (
        <button
          ref={el} className="handle" style={{ opacity: 0 }}
          aria-label={`Drag from ${nodeById.get(id)?.label ?? 'this event'} to another event to connect them`}
          title="Drag to another event to connect"
          onPointerEnter={() => { ui.handleHot = true }} onPointerLeave={() => { ui.handleHot = false }}
          onPointerDown={start}
        />
      )}
    </>
  )
}

/** After releasing on a target: offer the honest options. Never invents a relationship. */
export function PendingLink() {
  const pending = useStore((s) => s.pending)
  const nodeById = useStore((s) => s.nodeById)
  const [note, setNote] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { setNote(''); if (pending) setTimeout(() => ref.current?.querySelector<HTMLElement>('button')?.focus(), 50) }, [pending])
  const a = pending && nodeById.get(pending.a), b = pending && nodeById.get(pending.b)
  return (
    <AnimatePresence>
      {pending && a && b && (
        <motion.div
          ref={ref} role="dialog" aria-label="Connect two events"
          className="pointer-events-auto panel absolute left-1/2 top-1/2 z-30 flex w-[min(440px,92vw)] -translate-x-1/2 -translate-y-1/2 flex-col gap-3 p-5"
          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
          onKeyDown={(e) => { if (e.key === 'Escape') useStore.getState().dismissPending() }}
        >
          <div className="eyebrow">Connect</div>
          <h2 className="serif m-0 text-[24px] leading-tight">{a.label} <span className="faint">and</span> {b.label}</h2>
          {pending.pathCount > 0 ? (
            <p className="m-0 text-[13.5px] dim">Psyche found {pending.pathCount === 1 ? 'one possible chain' : `${pending.pathCount} possible chains`} between these events in its dataset. They are hypotheses, not findings.</p>
          ) : (
            <p className="m-0 text-[13.5px] dim">No relationship between these events is available in this dataset, and Psyche will not invent one. You can still record a link of your own. It will be labelled as user-defined.</p>
          )}
          <label className="block">
            <span className="field-label">Your note (optional)</span>
            <input className="input" value={note} maxLength={160} placeholder="Why do you think they are linked?" onChange={(e) => setNote(e.target.value)} />
          </label>
          <div className="flex flex-wrap gap-2">
            {pending.pathCount > 0 && <button className="btn btn-primary" onClick={() => { const p = useStore.getState().pending!; useStore.getState().dismissPending(); useStore.getState().trace(p.a, p.b) }}>Trace the chain</button>}
            <button className="btn" onClick={() => useStore.getState().addUserEdge(a.id, b.id, note)}>Add my own link</button>
            <button className="btn border-transparent" onClick={() => useStore.getState().dismissPending()}>Cancel</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
