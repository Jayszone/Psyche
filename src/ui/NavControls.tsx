import { useState } from 'react'
import { cameraController } from '../three/cameraController'
import { useStore, type Quality } from '../state/store'

export function NavControls() {
  const reset = useStore((s) => s.resetCamera)
  const settings = useStore((s) => s.settings)
  const mode = useStore((s) => s.mode)
  const [open, setOpen] = useState(false)
  const disabled = mode === 'journey'
  return (
    <div className="pointer-events-auto relative flex flex-col items-end gap-2" role="group" aria-label="Navigation">
      {open && (
        <div className="panel absolute bottom-full right-0 mb-2 flex w-[220px] flex-col gap-3 p-3.5 text-[12.5px]" role="dialog" aria-label="Display settings">
          <fieldset className="m-0 border-0 p-0">
            <legend className="eyebrow mb-1.5 p-0">Visual quality</legend>
            <div className="flex gap-1.5">
              {(['low', 'medium', 'high'] as Quality[]).map((q) => (
                <button key={q} className={'btn flex-1 px-2 py-1.5 capitalize ' + (settings.quality === q ? 'btn-primary' : '')} aria-pressed={settings.quality === q} onClick={() => useStore.getState().setQuality(q)}>{q}</button>
              ))}
            </div>
          </fieldset>
          <label className="flex cursor-pointer items-center justify-between gap-3">
            Reduce motion
            <input type="checkbox" checked={settings.reduced} onChange={(e) => useStore.getState().setReduced(e.target.checked)} className="h-4 w-4 accent-[#74b9ff]" />
          </label>
          <p className="m-0 text-[11px] faint">Reduced motion shortens camera moves, stops ambient drift and twinkle.</p>
        </div>
      )}
      <div className="flex gap-1.5">
        <button className="btn btn-icon panel" aria-label="Zoom in" title="Zoom in (+)" disabled={disabled} onClick={() => cameraController.zoom(0.7)}>+</button>
        <button className="btn btn-icon panel" aria-label="Zoom out" title="Zoom out (−)" disabled={disabled} onClick={() => cameraController.zoom(1 / 0.7)}>−</button>
        <button className="btn panel" onClick={reset} title="Reset camera (R)">{mode === 'journey' ? 'Fit route' : 'Reset view'}</button>
        <button className="btn btn-icon panel" aria-label="Display settings" aria-expanded={open} title="Display settings" onClick={() => setOpen(!open)}>⚙</button>
      </div>
    </div>
  )
}
