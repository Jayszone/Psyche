import { useEffect, useRef, useState } from 'react'
import { useStore } from '../state/store'
import { portalScreen } from '../three/portal'
import { catColor } from './Combobox'
import { isCurated } from '../media/loader'

/** Title and a short explanation, set beneath the event portal in the scene itself. */
export function PortalCaption() {
  const el = useRef<HTMLDivElement>(null)
  const [id, setId] = useState<string | null>(null)
  const node = useStore((s) => (id ? s.nodeById.get(id) : undefined))
  const categories = useStore((s) => s.categories)

  useEffect(() => {
    let raf = 0, last: string | null = null
    const loop = () => {
      raf = requestAnimationFrame(loop)
      const e = el.current; if (!e) return
      if (portalScreen.id !== last && portalScreen.alpha > 0.15) { last = portalScreen.id; setId(portalScreen.id) }
      const a = portalScreen.alpha
      const W = window.innerWidth, H = window.innerHeight
      const w = Math.max(240, Math.min(430, portalScreen.w * 1.02))
      const left = Math.max(12, Math.min(W - w - 12, portalScreen.x - portalScreen.w / 2))
      const narrow = W / H < 0.95
      let top = narrow ? Math.max(76, portalScreen.y - portalScreen.h / 2 - e.offsetHeight - 10) : portalScreen.y + portalScreen.h / 2 + 16
      const hCap = e.offsetHeight
      const limit = useStore.getState().mode === 'journey' ? H - 262 : H - 110
      if (!narrow && top + hCap > limit) top = Math.max(70, portalScreen.y - portalScreen.h / 2 - hCap - 12)
      e.style.width = w + 'px'
      e.style.transform = `translate(${left}px, ${top}px)`
      e.style.opacity = String(Math.max(0, Math.min(1, (a - 0.35) * 1.6)))
      e.style.visibility = a > 0.05 ? 'visible' : 'hidden'
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const cat = node && categories.find((c) => c.id === node.category)
  return (
    <div ref={el} className="pointer-events-none absolute left-0 top-0 z-[4]" style={{ opacity: 0, visibility: 'hidden' }} aria-hidden="true">
      {node && (
        <>
          <div className="caps mb-1.5 flex items-center gap-2 text-[10px]" style={{ color: catColor(node.category), letterSpacing: '0.34em' }}>
            <span className="dot" style={{ color: catColor(node.category), width: 5, height: 5 }} />{cat?.label}
          </div>
          <h2 className="serif m-0 text-[clamp(28px,3.2vw,44px)] font-normal leading-[1.02]" style={{ textShadow: '0 0 24px #050713, 0 0 6px #050713' }}>{node.label}</h2>
          <p className="m-0 mt-2 max-w-[44ch] text-[13.5px] leading-snug dim" style={{ textShadow: '0 0 12px #050713' }}>{node.description}</p>
          <div className="mt-2 text-[10.5px] faint">{isCurated(node) ? 'Curated image' : 'Conceptual artwork, generated. Not a depiction of the event.'}</div>
        </>
      )}
    </div>
  )
}
