import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Debug handle for automated checks: open the app with ?debug to expose internals on window.
if (new URLSearchParams(location.search).has('debug')) {
  void Promise.all([import('./state/store'), import('./three/projection'), import('./three/cameraController')]).then(([s, p, c]) => {
    Object.assign(window, { __psyche: { store: s.useStore, proj: p.proj, cam: c.cameraController } })
  })
}
