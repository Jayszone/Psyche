import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../state/store'
import { journeyRuntime } from '../graph/journey'
import { cameraController } from './cameraController'
import { getEventTexture } from '../media/loader'
import { baseNodeSize, categoryRgb, nodeScale, timeUniform } from './scale'
import { portalScreen } from './portal'

const vert = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }'
const frag = /* glsl */ `
varying vec2 vUv; uniform sampler2D uTex; uniform float uAlpha; uniform float uTime; uniform vec3 uTint; uniform vec2 uPar;
void main(){
  vec2 q = abs(vUv - 0.5) * 2.0;
  float se = pow(pow(q.x, 5.0) + pow(q.y, 5.0), 0.2);
  float m = 1.0 - smoothstep(0.80, 1.0, se);
  vec2 off = uPar * 0.012;
  vec3 base = texture2D(uTex, vUv + off).rgb;
  vec3 echo = texture2D(uTex, vUv - off * 2.5).rgb;
  vec3 col = base * 0.95 + echo * 0.16;
  float rim = smoothstep(0.86, 0.975, se) * (1.0 - smoothstep(0.975, 1.0, se));
  col += uTint * rim * (0.8 + 0.25 * sin(uTime * 1.2 + vUv.x * 14.0));
  col += uTint * exp(-pow((vUv.x - fract(uTime * 0.06)) * 8.0, 2.0)) * 0.07 * m;
  float lum = dot(col, vec3(0.3, 0.59, 0.11));
  float body = 0.22 + 0.78 * smoothstep(0.015, 0.2, lum);
  float a = m * uAlpha * mix(body, 1.0, rim);
  gl_FragColor = vec4(col * a, a * 0.96);
}`

const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }

interface Slot { id: string | null; alpha: number; mesh: THREE.Mesh; mat: THREE.ShaderMaterial; link: THREE.Line }

/** The event portal: artwork that materialises beside the focused event, in the scene's own depth.
 *  It fades in as the camera approaches and dissolves when you move on. */
export function PortalLayer() {
  const { camera, size } = useThree()
  const group = useRef<THREE.Group>(null)
  const cur = useRef(0)
  const tmp = useMemo(() => ({ right: new THREE.Vector3(), up: new THREE.Vector3(), p: new THREE.Vector3(), q: new THREE.Quaternion(), yaw: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -0.22) }), [])

  const slots = useMemo<Slot[]>(() => [0, 1].map(() => {
    const mat = new THREE.ShaderMaterial({
      vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false, depthTest: false, premultipliedAlpha: true,
      uniforms: { uTex: { value: null }, uAlpha: { value: 0 }, uTime: timeUniform, uTint: { value: new THREE.Vector3(1, 1, 1) }, uPar: { value: new THREE.Vector2() } },
    })
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.625), mat)
    mesh.renderOrder = 40; mesh.visible = false; mesh.frustumCulled = false
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3))
    const link = new THREE.Line(lg, new THREE.LineBasicMaterial({ color: 0xe8edf8, transparent: true, opacity: 0, depthTest: false, blending: THREE.AdditiveBlending }))
    link.renderOrder = 39; link.frustumCulled = false; link.visible = false
    return { id: null, alpha: 0, mesh, mat, link }
  }), [])

  useFrame((_, dt) => {
    const st = useStore.getState()
    // Which event deserves a portal right now, and how strongly.
    let id: string | null = null, want = 0
    if (st.mode === 'journey' && st.journey && st.routes[st.routeIdx]) {
      const route = st.routes[st.routeIdx]
      if (st.selectedId) { id = st.selectedId; want = 1 }
      else if (st.journey.ready && !st.journey.overview) {
        const t = journeyRuntime.t, k = Math.round(t)
        id = route.nodeIds[Math.min(route.nodeIds.length - 1, Math.max(0, k))]
        want = 1 - smooth(0.12, 0.46, Math.abs(t - k))
      }
    } else if (st.mode !== 'universe' && st.selectedId) { id = st.selectedId; want = 1 }
    const node = id ? st.nodeById.get(id) : undefined
    if (node) {
      const d = camera.position.distanceTo(new THREE.Vector3(...node.position))
      want *= smooth(88, 38, d)
    }

    // Swap content with a crossfade.
    let s = slots[cur.current]
    if (node && s.id !== node.id) {
      const next = slots[1 - cur.current]
      next.id = node.id
      const { tex } = getEventTexture(node)
      next.mat.uniforms.uTex.value = tex
      const c = categoryRgb(node.category); next.mat.uniforms.uTint.value.set(c[0], c[1], c[2])
      cur.current = 1 - cur.current; s = next
    }
    const k = 1 - Math.exp(-dt * (st.settings.reduced ? 30 : 3.6))
    slots.forEach((sl, i) => {
      const target = i === cur.current && node ? want : 0
      sl.alpha += (target - sl.alpha) * k
      if (sl.alpha < 0.004 && target === 0) { sl.mesh.visible = false; sl.link.visible = false; if (i !== cur.current) sl.id = null; return }
      const n = sl.id ? st.nodeById.get(sl.id) : undefined
      if (!n) return
      const np = tmp.p.set(n.position[0], n.position[1], n.position[2])
      const d = camera.position.distanceTo(np)
      const aspect = size.width / size.height
      const narrow = aspect < 0.95
      const visW = 2 * d * Math.tan(((camera as THREE.PerspectiveCamera).fov * Math.PI) / 360) * aspect
      const W = narrow ? THREE.MathUtils.clamp(visW * 0.74, 3, 38) : THREE.MathUtils.clamp(d * 0.46, 4, 44)
      tmp.right.setFromMatrixColumn(camera.matrixWorld, 0); tmp.up.setFromMatrixColumn(camera.matrixWorld, 1)
      const nodeR = baseNodeSize(n.importance) * nodeScale.value * 0.9
      const sw = cameraController.sway
      // wide screens: beside the node. Narrow screens: above it, so nothing leaves the viewport.
      const rx = narrow ? sw.x * W * 0.03 : W * 0.6 + nodeR + 0.4 + sw.x * W * 0.04
      const uy = narrow ? W * 0.31 + nodeR + visW * 0.2 - sw.y * W * 0.03 : W * 0.05 - sw.y * W * 0.03
      const cx = n.position[0] + tmp.right.x * rx + tmp.up.x * uy
      const cy = n.position[1] + tmp.right.y * rx + tmp.up.y * uy
      const cz = n.position[2] + tmp.right.z * rx + tmp.up.z * uy
      sl.mesh.position.set(cx, cy, cz)
      sl.mesh.quaternion.copy(camera.quaternion).multiply(tmp.yaw)
      sl.mesh.scale.set(W * (0.94 + 0.06 * sl.alpha), W * (0.94 + 0.06 * sl.alpha), 1)
      sl.mesh.visible = true
      sl.mat.uniforms.uAlpha.value = sl.alpha
      sl.mat.uniforms.uPar.value.set(sw.x, sw.y)
      // thread from the node to the portal's near edge
      const lp = (sl.link.geometry.getAttribute('position') as THREE.BufferAttribute)
      lp.setXYZ(0, n.position[0], n.position[1], n.position[2])
      if (narrow) lp.setXYZ(1, cx - tmp.up.x * W * 0.31, cy - tmp.up.y * W * 0.31, cz - tmp.up.z * W * 0.31); else lp.setXYZ(1, cx - tmp.right.x * W * 0.5, cy - tmp.right.y * W * 0.5, cz - tmp.right.z * W * 0.5)
      lp.needsUpdate = true
      ;(sl.link.material as THREE.LineBasicMaterial).opacity = sl.alpha * 0.35
      sl.link.visible = true
      if (i === cur.current) {
        // screen footprint for the caption
        const v = new THREE.Vector3(cx, cy, cz).project(camera as THREE.PerspectiveCamera)
        const pxPer = (size.height / 2) / Math.tan(((camera as THREE.PerspectiveCamera).fov * Math.PI) / 360)
        const dist = camera.position.distanceTo(sl.mesh.position)
        const wpx = (W * pxPer) / dist
        portalScreen.id = sl.id; portalScreen.alpha = sl.alpha
        portalScreen.x = (v.x * 0.5 + 0.5) * size.width; portalScreen.y = (-v.y * 0.5 + 0.5) * size.height
        portalScreen.w = wpx; portalScreen.h = wpx * 0.625
      }
    })
    if (!node && slots[cur.current].alpha < 0.01) portalScreen.alpha = 0
  })

  return (
    <group ref={group}>
      {slots.map((s, i) => (<group key={i}><primitive object={s.mesh} /><primitive object={s.link} /></group>))}
    </group>
  )
}
