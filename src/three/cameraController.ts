import type { PerspectiveCamera } from 'three'

/**
 * Orbit camera with damping and cancellable cinematic flights.
 * Plain TypeScript: React components and store actions both talk to this one instance.
 * Spherical coordinates around a target: th = azimuth, ph = polar angle from +Y.
 */
export interface CamPose { tx: number; ty: number; tz: number; r: number; th: number; ph: number }
export interface FlyOptions { target?: [number, number, number]; r?: number; th?: number; ph?: number; duration?: number; onDone?: () => void }

export const R_MIN = 3.5
export const R_MAX = 150
const PH_MIN = 0.3
const PH_MAX = Math.PI - 0.3

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const wrap = (a: number) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a }
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

class CameraController {
  cur: CamPose = { tx: 0, ty: 0, tz: 0, r: 135, th: 0.6, ph: 1.2 }
  goal: CamPose = { ...this.cur }
  reducedMotion = false
  drift = true
  /** When set, the target follows this point each frame (journey mode). */
  follow: (() => [number, number, number] | null) | null = null
  followRadius: (() => number) | null = null
  private flight: { from: CamPose; to: CamPose; t: number; dur: number; dip: number; onDone?: () => void } | null = null
  /** Seconds since the user last touched the camera. */
  idle = 99

  get flying() { return this.flight !== null }
  cancelFlight() { this.flight = null }

  orbit(dTh: number, dPh: number) {
    this.flight = null; this.idle = 0
    this.goal.th -= dTh
    this.goal.ph = clamp(this.goal.ph - dPh, PH_MIN, PH_MAX)
  }

  zoom(factor: number) {
    this.idle = 0
    if (this.flight) { this.flight.to.r = clamp(this.flight.to.r * factor, R_MIN, R_MAX); return }
    this.goal.r = clamp(this.goal.r * factor, R_MIN, R_MAX)
  }

  flyTo(o: FlyOptions) {
    const from = { ...this.goal }
    const to: CamPose = {
      tx: o.target?.[0] ?? from.tx, ty: o.target?.[1] ?? from.ty, tz: o.target?.[2] ?? from.tz,
      r: clamp(o.r ?? from.r, R_MIN, R_MAX),
      th: o.th !== undefined ? from.th + wrap(o.th - from.th) : from.th,
      ph: clamp(o.ph ?? from.ph, PH_MIN, PH_MAX),
    }
    const dist = Math.hypot(to.tx - from.tx, to.ty - from.ty, to.tz - from.tz)
    const scale = Math.max(from.r, to.r)
    const dur = this.reducedMotion ? 0.3 : o.duration ?? Math.min(3.2, Math.max(1.3, 1.0 + (dist + Math.abs(to.r - from.r)) / 60))
    const dip = this.reducedMotion ? 0 : Math.min(0.55, (dist / Math.max(scale, 10)) * 0.5)
    this.flight = { from, to, t: 0, dur, dip, onDone: o.onDone }
    this.idle = 0
  }

  /** Jump without animation (initial pose, reduced motion resets). */
  set(p: Partial<CamPose>) { Object.assign(this.goal, p); Object.assign(this.cur, p); this.flight = null }

  update(dt: number, camera: PerspectiveCamera) {
    dt = Math.min(dt, 0.1)
    this.idle += dt
    const g = this.goal
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
    } else if (this.follow) {
      const pt = this.follow()
      if (pt) { g.tx = pt[0]; g.ty = pt[1]; g.tz = pt[2] }
      if (this.followRadius) g.r += (this.followRadius() - g.r) * (1 - Math.exp(-dt * 2.2))
    } else if (this.drift && !this.reducedMotion && this.idle > 2.5) {
      g.th += dt * 0.025
    }
    const k = 1 - Math.exp(-dt * (this.flight ? 9 : this.follow ? 12 : 7))
    const c = this.cur
    c.tx += (g.tx - c.tx) * k; c.ty += (g.ty - c.ty) * k; c.tz += (g.tz - c.tz) * k
    c.r += (g.r - c.r) * k; c.th += (g.th - c.th) * k; c.ph += (g.ph - c.ph) * k
    const sp = Math.sin(c.ph)
    camera.position.set(c.tx + c.r * sp * Math.cos(c.th), c.ty + c.r * Math.cos(c.ph), c.tz + c.r * sp * Math.sin(c.th))
    camera.lookAt(c.tx, c.ty, c.tz)
  }
}

export const cameraController = new CameraController()
export type { CameraController }
