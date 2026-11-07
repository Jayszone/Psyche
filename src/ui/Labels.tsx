import { useEffect, useRef } from 'react'
import { proj } from '../three/projection'
import { journeyRuntime } from '../graph/journey'
import { useStore } from '../state/store'
import { catColor } from './Combobox'
import { portalScreen } from '../three/portal'
import { REGIONS } from '../data/dataset'

/** Labels are placed greedily by priority each frame so text never overlaps. Purely visual: the same
 *  information is reachable through search, the panel and the route list. */
export function Labels() {
  const nodes = useStore((s) => s.graph.nodes)
  const categories = useStore((s) => s.categories)
  const nodeEls = useRef<(HTMLSpanElement | null)[]>([])
  const catEls = useRef<(HTMLButtonElement | null)[]>([])
  const widths = useRef<number[]>([])
  const regEls = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    let raf = 0
    const loop = () => {
      raf = requestAnimationFrame(loop)
      const st = useStore.getState()
      const g = st.graph.nodes
      const route = st.mode === 'journey' ? st.routes[st.routeIdx] : null
      const idxInRoute = new Map<string, number>()
      route?.nodeIds.forEach((id, i) => idxInRoute.set(id, i))
      const t = journeyRuntime.t
      const [tx, ty, tz] = proj.camTarget
      const lvl = st.zoomLevel
      const hero = st.mode === 'universe'
      type C = { i: number; p: number; strong: boolean }
      const cand: C[] = []
      for (let i = 0; i < Math.min(proj.count, g.length); i++) {
        if (!proj.visible[i]) continue
        const n = g[i]
        let p = -1, strong = false
        if (hero) continue
        if (n.id === st.selectedId) { p = 1000; strong = true }
        else if (n.id === st.hoveredId) { p = 900; strong = true }
        else if (st.drag && (n.id === st.drag.target)) { p = 950; strong = true }
        else if (route) {
          const k = idxInRoute.get(n.id)
          if (k !== undefined) {
            const shown = st.journey?.overview || k === 0 || k === route.nodeIds.length - 1 || t > k - 0.6
            if (shown) { p = 800 - k; strong = true }
          }
        } else if (n.id === st.fromId || n.id === st.toId) { p = 700; strong = true }
        else {
          const d = Math.hypot(n.position[0] - tx, n.position[1] - ty, n.position[2] - tz)
          if (lvl === 'focus') { if (d < 24) p = 200 + n.importance * 100 - d }
          else if (lvl === 'constellation') { if (d < 40 && n.importance >= 0.35) p = 100 + n.importance * 100 - d * 0.5 }
          else if (n.importance >= 0.86) p = 60 + n.importance * 10
          if (p > 0 && proj.alpha[i] < 0.3) p = -1
        }
        if (p > 0) cand.push({ i, p, strong })
      }
      cand.sort((a, b) => b.p - a.p)
      const placed: { x0: number; y0: number; x1: number; y1: number }[] = []
      if (portalScreen.alpha > 0.25) {
        const pw = portalScreen.w, ph = portalScreen.h
        placed.push({ x0: portalScreen.x - pw / 2 - 10, y0: portalScreen.y - ph / 2 - 10, x1: portalScreen.x + pw / 2 + 10, y1: portalScreen.y + ph / 2 + 200 })
      }
      const on = new Set<number>()
      for (const c of cand) {
        const el = nodeEls.current[c.i]; if (!el) continue
        if (!widths.current[c.i]) widths.current[c.i] = el.offsetWidth || 120
        const w = widths.current[c.i], h = 16
        const reach = Math.max(10, proj.radius[c.i] * 0.7)
        const right = proj.x[c.i] + reach + 8 + w < proj.width - 12
        const x = right ? proj.x[c.i] + reach + 8 : proj.x[c.i] - reach - 8 - w
        const y = proj.y[c.i] - h / 2
        const rect = { x0: x - 4, y0: y - 2, x1: x + w + 4, y1: y + h + 2 }
        if (c.p < 700 && placed.some((r) => rect.x0 < r.x1 && rect.x1 > r.x0 && rect.y0 < r.y1 && rect.y1 > r.y0)) continue
        placed.push(rect); on.add(c.i)
        el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`
        el.style.opacity = '1'
        el.classList.toggle('strong', c.strong)
      }
      nodeEls.current.forEach((el, i) => { if (el && !on.has(i)) el.style.opacity = '0' })

      // Constellation names: visible when zoomed out or at constellation scale, nearest one emphasised.
      const showCats = !route && lvl === 'constellation' && st.mode !== 'journey'
      categories.forEach((c, i) => {
        const el = catEls.current[i]; if (!el) return
        if (c.id === 'user') { el.style.opacity = '0'; el.style.pointerEvents = 'none'; return }
        const near = Math.hypot(c.center[0] - tx, c.center[1] - ty, c.center[2] - tz) < 28
        const cx = proj.cat.x[i], cy = proj.cat.y[i] - 62
        const inHero = hero && ((Math.abs(cx - proj.width / 2) < proj.width * 0.34 && cy < proj.height * 0.5) || cy > proj.height - 120)
        const dT = Math.hypot(c.center[0] - tx, c.center[1] - ty, c.center[2] - tz)
        const op = showCats && proj.cat.visible[i] && !inHero && dT < 130 ? (near ? 0.95 : 0.4) : 0
        el.style.opacity = String(op)
        el.style.pointerEvents = op > 0.3 ? 'auto' : 'none'
        el.style.transform = `translate(${proj.cat.x[i] - el.offsetWidth / 2}px, ${proj.cat.y[i] - 62}px)`
      })
      REGIONS.forEach((r, i) => {
        const el = regEls.current[i]; if (!el) return
        const ry = proj.reg.y[i] - 70, rx = proj.reg.x[i]
        const inHero = hero && ((Math.abs(rx - proj.width / 2) < proj.width * 0.4 && ry < proj.height * 0.66) || ry > proj.height - 150)
        const op = lvl === 'universe' && !route && proj.reg.visible[i] && !inHero ? (hero ? 0.6 : 0.8) : 0
        el.style.opacity = String(op)
        el.style.transform = `translate(${proj.reg.x[i] - el.offsetWidth / 2}px, ${proj.reg.y[i] - 70}px)`
      })
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [categories])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="false">
      {nodes.map((n, i) => (
        <span key={n.id} ref={(el) => { nodeEls.current[i] = el; widths.current[i] = 0 }} className="node-label" aria-hidden="true">
          <span className="dot" style={{ color: catColor(n.category), display: 'inline-block', marginRight: 7, width: 5, height: 5 }} />{n.label}
        </span>
      ))}
      {REGIONS.map((r, i) => (
        <div key={r.id} ref={(el) => { regEls.current[i] = el }} className="serif absolute left-0 top-0 whitespace-nowrap text-[clamp(18px,2.1vw,30px)] font-light italic" aria-hidden="true"
          style={{ opacity: 0, transition: 'opacity .6s', color: 'rgba(232,237,248,0.85)', textShadow: '0 0 18px #050713, 0 0 4px #050713', letterSpacing: '0.01em' }}>
          {r.name}
        </div>
      ))}
      {categories.map((c, i) => (
        <button key={c.id} ref={(el) => { catEls.current[i] = el }} className="cat-label" style={{ color: catColor(c.id) }}
          tabIndex={c.id === 'user' ? -1 : 0} aria-label={`Fly to the ${c.label} constellation`}
          onClick={() => useStore.getState().focusCategory(c.id)}>
          {c.label}
        </button>
      ))}
    </div>
  )
}
