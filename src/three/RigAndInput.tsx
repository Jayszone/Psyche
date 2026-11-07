import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { cameraController } from './cameraController'
import { MAX_NODES, pickNodeAt, proj } from './projection'
import { baseNodeSize, motionUniform, nodeScale, scaleForRadius, timeUniform } from './scale'
import { effects, useStore, type ZoomLevel } from '../state/store'

export const ui = { handleHot: false }

const levelFor = (r: number): ZoomLevel => (r > 74 ? 'universe' : r > 24 ? 'constellation' : 'focus')

/** Drives the camera, mirrors node positions to screen space for HTML overlays, and handles pointer input. */
export function RigAndInput() {
  const { camera, gl } = useThree()
  const orbiting = useRef(false)
  const inside = useRef(false)
  const lostAt = useRef(0)
  const v = useRef(new THREE.Vector3())

  useEffect(() => {
    const el = gl.domElement
    const pointers = new Map<number, { x: number; y: number }>()
    let downAt = 0, moved = 0, pinch = 0, wheelAcc = 0, wheelLock = 0

    const down = (e: PointerEvent) => {
      el.setPointerCapture(e.pointerId)
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (pointers.size === 1) { downAt = performance.now(); moved = 0; orbiting.current = true }
      if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y) }
      el.style.cursor = 'grabbing'
    }
    const move = (e: PointerEvent) => {
      effects.pointer.x = e.clientX; effects.pointer.y = e.clientY; inside.current = true
      const prev = pointers.get(e.pointerId)
      if (!prev) return
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (pointers.size === 1) {
        const dx = e.clientX - prev.x, dy = e.clientY - prev.y
        moved += Math.abs(dx) + Math.abs(dy)
        if (moved > 3) cameraController.orbit(dx * 0.0055, dy * 0.0045)
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y)
        if (pinch > 0) { cameraController.zoom(pinch / d); moved += 10 }
        pinch = d
      }
    }
    const up = (e: PointerEvent) => {
      const had = pointers.has(e.pointerId)
      pointers.delete(e.pointerId)
      if (!pointers.size) { orbiting.current = false; el.style.cursor = '' }
      if (!had || pointers.size) return
      if (moved < 6 && performance.now() - downAt < 600) {
        const idx = pickNodeAt(e.clientX, e.clientY)
        const st = useStore.getState()
        if (idx >= 0) {
          const id = proj.ids[idx]
          if (st.mode === 'journey') useStore.setState({ selectedId: id })
          else st.focusNode(id)
        } else if (st.selectedId) {
          if (st.mode === 'journey') useStore.setState({ selectedId: null })
          else st.deselect()
        }
      }
    }
    const leave = () => { inside.current = false }
    const wheel = (e: WheelEvent) => {
      e.preventDefault()
      const st = useStore.getState()
      if (st.mode === 'universe') st.enterExplore()
      if (st.mode === 'journey' && st.journey && !st.journey.overview && st.journey.ready) {
        wheelAcc += e.deltaY
        const now = performance.now()
        if (Math.abs(wheelAcc) > 60 && now > wheelLock) {
          wheelLock = now + 650
          if (wheelAcc > 0) st.journeyNext(); else st.journeyPrev()
          st.journeyPause()
        }
        if (Math.abs(wheelAcc) > 400) wheelAcc = 0
        return
      }
      wheelAcc = 0
      if (st.mode === 'universe') return
      cameraController.zoom(Math.exp(e.deltaY * (e.ctrlKey ? 0.01 : 0.0013)))
    }
    el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up)
    el.addEventListener('pointerleave', leave); el.addEventListener('wheel', wheel, { passive: false })
    return () => {
      el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up)
      el.removeEventListener('pointerleave', leave); el.removeEventListener('wheel', wheel)
    }
  }, [gl])

  useFrame((state, dt) => {
    const st = useStore.getState()
    timeUniform.value += dt
    motionUniform.value = st.settings.reduced ? 0 : 1
    cameraController.drift = st.mode === 'universe'
    cameraController.update(dt, camera as THREE.PerspectiveCamera)
    camera.updateMatrixWorld()
    const r = cameraController.cur.r
    nodeScale.value = scaleForRadius(r)
    proj.camRadius = r
    proj.camTarget = [cameraController.cur.tx, cameraController.cur.ty, cameraController.cur.tz]

    const W = state.size.width, H = state.size.height
    proj.width = W; proj.height = H
    const cam = camera as THREE.PerspectiveCamera
    const pxPerUnit = (H / 2) / Math.tan((cam.fov * Math.PI) / 360)
    const nodes = st.graph.nodes
    const n = Math.min(MAX_NODES, nodes.length)
    proj.count = n
    for (let i = 0; i < n; i++) {
      const node = nodes[i]
      proj.ids[i] = node.id
      v.current.set(node.position[0], node.position[1], node.position[2])
      const dist = v.current.distanceTo(camera.position)
      v.current.project(cam)
      proj.x[i] = (v.current.x * 0.5 + 0.5) * W
      proj.y[i] = (-v.current.y * 0.5 + 0.5) * H
      proj.depth[i] = dist
      proj.radius[i] = (baseNodeSize(node.importance) * nodeScale.value * 1.3 * pxPerUnit) / Math.max(dist, 0.1)
      proj.visible[i] = v.current.z < 1 && proj.x[i] > -40 && proj.x[i] < W + 40 && proj.y[i] > -40 && proj.y[i] < H + 40 ? 1 : 0
    }
    st.categories.forEach((c, i) => {
      v.current.set(c.center[0], c.center[1], c.center[2]).project(cam)
      proj.cat.x[i] = (v.current.x * 0.5 + 0.5) * W
      proj.cat.y[i] = (-v.current.y * 0.5 + 0.5) * H
      proj.cat.visible[i] = v.current.z < 1 ? 1 : 0
    })

    const lvl = levelFor(r)
    if (lvl !== st.zoomLevel) st.setZoomLevel(lvl)

    // Hover: nearest node under the pointer, with a short linger so the connect handle stays reachable.
    if (inside.current && !orbiting.current && !st.drag) {
      const idx = pickNodeAt(effects.pointer.x, effects.pointer.y)
      if (idx >= 0) { lostAt.current = 0; st.setHovered(proj.ids[idx]) }
      else if (st.hoveredId && !ui.handleHot) {
        if (!lostAt.current) lostAt.current = performance.now()
        else if (performance.now() - lostAt.current > 450) { st.setHovered(null); lostAt.current = 0 }
      }
      gl.domElement.style.cursor = idx >= 0 ? 'pointer' : ''
    } else if (!inside.current && st.hoveredId && !ui.handleHot && !st.drag) {
      if (!lostAt.current) lostAt.current = performance.now()
      else if (performance.now() - lostAt.current > 450) { st.setHovered(null); lostAt.current = 0 }
    }
  })

  return null
}
