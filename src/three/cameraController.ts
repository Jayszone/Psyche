import type { PerspectiveCamera } from 'three'

/**
 * Camera for a very large space. Three ways of moving, one coherent state:
 *  - orbit: spherical coordinates around a focal point, with inertia
 *  - travel: pan the focal point and move forward or back through the scene
 *  - rail: follow a spatial path with a look-ahead (journeys)
 * Flights are eased, cancellable and may cross any distance. Plain TypeScript.
 */
export interface CamPose { tx: number; ty: number; tz: number; r: number; th: number; ph: number }
export interface FlyOptions { target?: [number, number, number]; r?: number; th?: number; ph?: number; duration?: number; onDone?: () => void }
export interface RailPose { pos: [number, number, number]; look: [number, number, number] }

export const R_MIN = 2.6
export const R_MAX = 520
const PH_MIN = 0.14
const PH_MAX = Math.PI - 0.14

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const wrap = (a: number) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a }
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

class CameraController {
  cur: CamPose = { tx: 0, ty: 0, tz: 0, r: 190, th: 0.6, ph: 1.2 }
  goal: CamPose = { ...this.cur }
  reducedMotion = false
  drift = true
  /** Angular velocity (rad/s) carried after a drag is released. */
  private vTh = 0
  private vPh = 0
  /** Keys held for travel: forward, back, left, right, up, down. */
  readonly keys = { f: 0, b: 0, l: 0, r: 0, u: 0, d: 0, fast: false }
  /** Journey rail: when set, the camera flies along it and spherical state is derived from the result. */
  rail: (() => RailPose | null) | null = null
  private railPos: [number, number, number] | null = null
  private railLook: [number, number, number] | null = null
  private flight: { from: CamPose; to: CamPose; t: number; dur: number; dip: number; onDone?: () => void } | null = null
  idle = 99
  /** Mouse parallax offsets (-1..1), used for a subtle sway. */
  sway = { x: 0, y: 0 }
  private swayCur = { x: 0, y: 0 }

  get flying() { return this.flight !== null }
  get onRail() { return this.rail !== null }
  cancelFlight() { this.flight = null }

  orbit(dTh: number, dPh: number, dt = 1 / 60) {
    this.flight = null; this.idle = 0
    this.goal.th -= dTh
    this.goal.ph = clamp(this.goal.ph - dPh, PH_MIN, PH_MAX)
    const k = 1 / Math.max(dt, 0.008)
    this.vTh = this.vTh * 0.5 + (-dTh * k) * 0.5
    this.vPh = this.vPh * 0.5 + (-dPh * k) * 0.5
  }
  releaseOrbit() { this.idle = 0 }
  stopInertia() { this.vTh = 0; this.vPh = 0 }

  zoom(factor: number) {
    this.idle = 0
    const t = this.flight ? this.flight.to : this.goal
    const nr = t.r * factor
    if (nr < R_MIN && factor < 1) {
      // Arrived at the focal point: keep going. Move the focus forward along the view direction.
      t.r = R_MIN
      const step = Math.max(0.4, t.r * (1 - factor) * 6)
      this.dolly(step)
    } else t.r = clamp(nr, R_MIN, R_MAX)
  }

  /** Move the focal point forward (+) or back (-) along the line of sight. */
  dolly(amount: number) {
    this.idle = 0
    const g = this.flight ? this.flight.to : this.goal
    const sp = Math.sin(g.ph)
    const dx = -sp * Math.cos(g.th), dy = -Math.cos(g.ph), dz = -sp * Math.sin(g.th)
    g.tx += dx * amount; g.ty += dy * amount; g.tz += dz * amount
  }

  /** Slide the focal point in the screen plane. */
  pan(right: number, up: number) {
    this.idle = 0; this.flight = null
    const g = this.goal
    // camera right = (sin th, 0, -cos th); camera up from spherical derivative
    const rx = Math.sin(g.th), rz = -Math.cos(g.th)
    const ux = -Math.cos(g.ph) * Math.cos(g.th), uy = Math.sin(g.ph), uz = -Math.cos(g.ph) * Math.sin(g.th)
    g.tx += rx * right + ux * up; g.ty += uy * up; g.tz += rz * right + uz * up
  }

  flyTo(o: FlyOptions) {
    this.releaseRail()
    const from = { ...this.goal }
    const to: CamPose = {
      tx: o.target?.[0] ?? from.tx, ty: o.target?.[1] ?? from.ty, tz: o.target?.[2] ?? from.tz,
      r: clamp(o.r ?? from.r, R_MIN, R_MAX),
      th: o.th !== undefined ? from.th + wrap(o.th - from.th) : from.th,
      ph: clamp(o.ph ?? from.ph, PH_MIN, PH_MAX),
    }
    const dist = Math.hypot(to.tx - from.tx, to.ty - from.ty, to.tz - from.tz)
    const dur = this.reducedMotion ? 0.3 : o.duration ?? Math.min(4.2, Math.max(1.4, 1.0 + (dist + Math.abs(to.r - from.r)) / 90))
    const dip = this.reducedMotion ? 0 : Math.min(0.5, (dist / Math.max(from.r, to.r, 20)) * 0.35)
    this.flight = { from, to, t: 0, dur, dip, onDone: o.onDone }
    this.vTh = this.vPh = 0
    this.idle = 0
  }

  setRail(fn: (() => RailPose | null) | null) {
    if (fn === this.rail) return
    this.rail = fn
    this.railPos = this.railLook = null
    this.flight = null
  }
  /** Leave the rail keeping the current view as the new orbit state. */
  releaseRail() {
    if (!this.rail) return
    this.rail = null; this.railPos = this.railLook = null
    Object.assign(this.goal, this.cur)
  }

  set(p: Partial<CamPose>) { Object.assign(this.goal, p); Object.assign(this.cur, p); this.flight = null; this.vTh = this.vPh = 0 }

  update(dt: number, camera: PerspectiveCamera) {
    dt = Math.min(dt, 0.1)
    this.idle += dt
    const g = this.goal, c = this.cur
    const kSway = 1 - Math.exp(-dt * 3)
    this.swayCur.x += (this.sway.x - this.swayCur.x) * kSway
    this.swayCur.y += (this.sway.y - this.swayCur.y) * kSway

    if (this.rail) {
      const pose = this.rail()
      if (pose) {
        if (!this.railPos) { this.railPos = [camera.position.x, camera.position.y, camera.position.z]; this.railLook = [c.tx, c.ty, c.tz] }
        const kp = 1 - Math.exp(-dt * 2.6), kl = 1 - Math.exp(-dt * 3.4)
        const P = this.railPos, L = this.railLook!
        for (let i = 0; i < 3; i++) { P[i] += (pose.pos[i] - P[i]) * kp; L[i] += (pose.look[i] - L[i]) * kl }
        camera.position.set(P[0], P[1], P[2])
        camera.lookAt(L[0], L[1], L[2])
        // keep spherical state in step, so leaving the rail is seamless
        const dx = P[0] - L[0], dy = P[1] - L[1], dz = P[2] - L[2]
        const r = Math.hypot(dx, dy, dz) || 1
        c.tx = L[0]; c.ty = L[1]; c.tz = L[2]; c.r = r
        c.ph = Math.acos(clamp(dy / r, -1, 1)); c.th = Math.atan2(dz, dx)
        Object.assign(g, c)
        return
      }
    }

    if (this.flight) {
      const f = this.flight
      f.t += dt
      const p = Math.min(1, f.t / f.dur), e = ease(p)
      g.tx = f.from.tx + (f.to.tx - f.from.tx) * e
      g.ty = f.from.ty + (f.to.ty - f.from.ty) * e
      g.tz = f.from.tz + (f.to.tz - f.from.tz) * e
      g.th = f.from.th + (f.to.th - f.from.th) * e
      g.ph = f.from.ph + (f.to.ph - f.from.ph) * e
      g.r = (f.from.r + (f.to.r - f.from.r) * e) * (1 + f.dip * Math.sin(Math.PI * p))
      if (p >= 1) { const done = f.onDone; this.flight = null; done?.() }
    } else {
      // inertia after a drag
      if (!this.reducedMotion && (Math.abs(this.vTh) > 0.01 || Math.abs(this.vPh) > 0.01)) {
        g.th += this.vTh * dt
        g.ph = clamp(g.ph + this.vPh * dt, PH_MIN, PH_MAX)
        const decay = Math.exp(-dt * 3.2)
        this.vTh *= decay; this.vPh *= decay
      } else { this.vTh = this.vPh = 0 }
      // keyboard travel
      const k = this.keys
      const mx = (k.r - k.l), my = (k.u - k.d), mz = (k.f - k.b)
      if (mx || my || mz) {
        this.idle = 0
        const speed = (k.fast ? 3.2 : 1) * Math.max(8, g.r * 0.55) * dt
        if (mz) this.dolly(mz * speed)
        if (mx || my) this.pan(mx * speed, my * speed)
      }
      if (this.drift && !this.reducedMotion && this.idle > 2.5) g.th += dt * 0.022
    }

    const kk = 1 - Math.exp(-dt * (this.flight ? 9 : 8))
    c.tx += (g.tx - c.tx) * kk; c.ty += (g.ty - c.ty) * kk; c.tz += (g.tz - c.tz) * kk
    c.r += (g.r - c.r) * kk; c.th += (g.th - c.th) * kk; c.ph += (g.ph - c.ph) * kk
    const sp = Math.sin(c.ph)
    camera.position.set(c.tx + c.r * sp * Math.cos(c.th), c.ty + c.r * Math.cos(c.ph), c.tz + c.r * sp * Math.sin(c.th))
    camera.lookAt(c.tx, c.ty, c.tz)
    if (!this.reducedMotion && (this.swayCur.x || this.swayCur.y)) {
      // gentle parallax: a few hundredths of a radian, only visible as depth
      camera.rotateY(-this.swayCur.x * 0.012); camera.rotateX(this.swayCur.y * 0.009)
    }
  }
}

export const cameraController = new CameraController()
export type { CameraController }
