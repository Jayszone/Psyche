import { useEffect, useRef, useState } from 'react'
import { useStore } from '../state/store'
import { cameraController } from '../three/cameraController'
import { REGIONS } from '../data/dataset'
import { hexToRgb } from '../three/scale'

const S = 132, EXT = 190

/** A small orientation chart: the universe from above, your position and heading, and a way to jump to any region. */
export function MiniMap() {
  const cv = useRef<HTMLCanvasElement>(null)
  const categories = useStore((s) => s.categories)
  const [list, setList] = useState(false)
  const to = (x: number, z: number): [number, number] => [S / 2 + (x / EXT) * (S / 2 - 8), S / 2 + (z / EXT) * (S / 2 - 8)]

  useEffect(() => {
    const c = cv.current; if (!c) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    c.width = S * dpr; c.height = S * dpr
    const ctx = c.getContext('2d')!
    let raf = 0, last = 0
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw)
      if (now - last < 90) return
      last = now
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, S, S)
      ctx.strokeStyle = 'rgba(232,237,248,0.14)'; ctx.lineWidth = 1
      ;[0.35, 0.7, 1].forEach((k) => { ctx.beginPath(); ctx.arc(S / 2, S / 2, (S / 2 - 8) * k, 0, 7); ctx.stroke() })
      REGIONS.forEach((r) => {
        const [x, y] = to(r.center[0], r.center[2])
        const g = ctx.createRadialGradient(x, y, 0, x, y, 20); g.addColorStop(0, 'rgba(153,132,245,0.22)'); g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = g; ctx.fillRect(x - 20, y - 20, 40, 40)
      })
      categories.forEach((cat) => {
        if (cat.id === 'user') return
        const [x, y] = to(cat.center[0], cat.center[2]); const [r, g, b] = hexToRgb(cat.color)
        ctx.fillStyle = `rgba(${r * 255 | 0},${g * 255 | 0},${b * 255 | 0},0.9)`; ctx.beginPath(); ctx.arc(x, y, 2.1, 0, 7); ctx.fill()
      })
      const p = cameraController.cur
      const sp = Math.sin(p.ph)
      const cx = p.tx + p.r * sp * Math.cos(p.th), cz = p.tz + p.r * sp * Math.sin(p.th)
      const [cxp, czp] = to(cx, cz), [txp, tzp] = to(p.tx, p.tz)
      const ang = Math.atan2(tzp - czp, txp - cxp)
      // field of view
      ctx.fillStyle = 'rgba(116,185,255,0.16)'; ctx.beginPath(); ctx.moveTo(cxp, czp)
      ctx.arc(cxp, czp, 34, ang - 0.55, ang + 0.55); ctx.closePath(); ctx.fill()
      ctx.fillStyle = '#e8edf8'; ctx.beginPath(); ctx.arc(cxp, czp, 2.8, 0, 7); ctx.fill()
      ctx.strokeStyle = 'rgba(232,190,121,0.95)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(txp, tzp, 3.6, 0, 7); ctx.stroke()
      // elevation tick
      const el = (1 - p.ph / Math.PI) // 0 bottom .. 1 top
      ctx.fillStyle = 'rgba(232,237,248,0.5)'; ctx.fillRect(S - 6, 8 + (1 - el) * (S - 20), 3, 3)
      ctx.strokeStyle = 'rgba(232,237,248,0.18)'; ctx.beginPath(); ctx.moveTo(S - 4.5, 8); ctx.lineTo(S - 4.5, S - 12); ctx.stroke()
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [categories])

  const click = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - r.left, y = e.clientY - r.top
    let best: string | null = null, bd = 12
    categories.forEach((c) => { if (c.id === 'user') return; const [px, py] = to(c.center[0], c.center[2]); const d = Math.hypot(px - x, py - y); if (d < bd) { bd = d; best = c.id } })
    if (best) useStore.getState().focusCategory(best as never)
  }

  return (
    <div className="pointer-events-auto relative flex flex-col items-start gap-1.5">
      <div className="panel relative rounded-[10px] p-0 max-sm:hidden" style={{ width: S, height: S }}>
        <canvas ref={cv} style={{ width: S, height: S }} onClick={click} role="img" aria-label="Orientation chart. Click a dot to travel to that constellation." />
        <span className="caps pointer-events-none absolute left-2 top-1.5 text-[8.5px] faint" style={{ letterSpacing: '0.2em' }}>Chart</span>
      </div>
      <button className="btn px-3 py-1 text-[11px]" aria-expanded={list} onClick={() => setList(!list)}>Regions</button>
      {list && (
        <div className="panel absolute bottom-full left-0 mb-2 max-h-[52vh] w-[250px] overflow-auto rounded-[10px] p-3" role="menu" aria-label="Regions">
          {REGIONS.map((r) => (
            <div key={r.id} className="mb-2.5 last:mb-0">
              <button className="serif border-0 bg-transparent p-0 text-left text-[18px] italic hover:text-white" role="menuitem"
                onClick={() => { setList(false); cameraController.flyTo({ target: r.center, r: 120, ph: 1.15 }); useStore.setState({ mode: useStore.getState().mode === 'universe' ? 'explore' : useStore.getState().mode, selectedId: null }) }}>
                {r.name}
              </button>
              <div className="mt-0.5 flex flex-wrap gap-x-2.5 gap-y-0.5">
                {r.members.map((m) => {
                  const cat = categories.find((c) => c.id === m)!
                  return <button key={m} role="menuitem" className="border-0 bg-transparent p-0 text-[11.5px] dim hover:text-white" onClick={() => { setList(false); useStore.getState().focusCategory(m) }}>{cat.label}</button>
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
