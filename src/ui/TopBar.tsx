import { useMemo } from 'react'
import { useStore } from '../state/store'
import { catColor } from './Combobox'

/** Wordmark, plus a breadcrumb that always says where you are: universe, constellation, event. */
export function TopBar() {
  const mode = useStore((s) => s.mode)
  const zoom = useStore((s) => s.zoomLevel)
  const selectedId = useStore((s) => s.selectedId)
  const nodeById = useStore((s) => s.nodeById)
  const categories = useStore((s) => s.categories)
  const reset = useStore((s) => s.resetCamera)
  const focusCategory = useStore((s) => s.focusCategory)
  const routes = useStore((s) => s.routes)
  const routeIdx = useStore((s) => s.routeIdx)
  const exit = useStore((s) => s.exitJourney)

  const crumb = useMemo(() => {
    const sel = selectedId ? nodeById.get(selectedId) : null
    const cat = sel ? categories.find((c) => c.id === sel.category) : null
    return { sel, cat }
  }, [selectedId, nodeById, categories])

  return (
    <header className="pointer-events-none flex flex-col gap-2">
      <div>
        <div className="caps text-[15px]" style={{ letterSpacing: '0.5em', fontWeight: 500 }}>Psyche</div>
        <div className="serif mt-1 text-[17px] italic dim">Everything is connected. Find out how.</div>
      </div>
      {mode !== 'universe' && (
        <nav aria-label="Where you are" className="pointer-events-auto flex flex-wrap items-center gap-1.5 text-[11.5px]">
          <span className="eyebrow mr-1" style={{ color: mode === 'journey' ? 'var(--gold)' : undefined }}>
            {mode === 'journey' ? 'Journey' : 'Explore'}
          </span>
          {mode === 'journey' ? (
            <>
              <span className="dim">{routes[routeIdx]?.edgeIds.length} steps</span>
              <span className="faint">·</span>
              <button className="dim underline-offset-4 hover:underline" onClick={exit}>Back to the universe</button>
            </>
          ) : (
            <>
              <button className={'underline-offset-4 hover:underline ' + (zoom === 'universe' && !crumb.sel ? '' : 'dim')} onClick={reset}>Universe</button>
              {crumb.cat && crumb.cat.id !== 'user' && (
                <>
                  <span className="faint">›</span>
                  <button className="inline-flex items-center gap-1.5 underline-offset-4 hover:underline dim" onClick={() => focusCategory(crumb.cat!.id)}>
                    <span className="dot" style={{ color: catColor(crumb.cat.id), width: 5, height: 5 }} />{crumb.cat.label}
                  </button>
                </>
              )}
              {crumb.sel && (<><span className="faint">›</span><span className="max-w-[40vw] truncate">{crumb.sel.label}</span></>)}
              <span className="faint ml-1">· {zoom === 'universe' ? 'overview' : zoom === 'constellation' ? 'constellation' : 'event focus'}</span>
            </>
          )}
        </nav>
      )}
    </header>
  )
}
