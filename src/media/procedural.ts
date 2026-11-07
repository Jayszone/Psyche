import type { Motif } from './registry'

/** Procedural cosmic illustrations. Deterministic per event, abstract by design, drawn at W x H. */
export const ART_W = 640
export const ART_H = 400

function rng(seed: number) {
  let s = seed >>> 0
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
}
const hashStr = (str: string) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }

type Ctx = CanvasRenderingContext2D
type P = { c: Ctx; w: number; h: number; r: () => number; col: string; rgb: [number, number, number] }

const rgba = (rgb: [number, number, number], a: number) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`
const mix = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)]
const GOLD: [number, number, number] = [232, 190, 121]
const WHITE: [number, number, number] = [232, 237, 248]
const BLUE: [number, number, number] = [116, 185, 255]
const VIOLET: [number, number, number] = [153, 132, 245]

function glow(c: Ctx, color: string, blur: number) { c.shadowColor = color; c.shadowBlur = blur }
function noglow(c: Ctx) { c.shadowBlur = 0; c.shadowColor = 'transparent' }

function backdrop({ c, w, h, r, rgb }: P) {
  const g = c.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, '#060818'); g.addColorStop(1, '#0d1330')
  c.fillStyle = g; c.fillRect(0, 0, w, h)
  const n = c.createRadialGradient(w * (0.3 + r() * 0.4), h * (0.35 + r() * 0.3), 0, w * 0.5, h * 0.5, w * 0.7)
  n.addColorStop(0, rgba(rgb, 0.34)); n.addColorStop(0.5, rgba(mix(rgb, VIOLET, 0.5), 0.12)); n.addColorStop(1, 'rgba(0,0,0,0)')
  c.fillStyle = n; c.fillRect(0, 0, w, h)
  for (let i = 0; i < 90; i++) {
    c.fillStyle = `rgba(232,237,248,${0.12 + r() * 0.6})`
    const s = r() < 0.08 ? 1.8 : 0.9
    c.fillRect(r() * w, r() * h, s, s)
  }
}

const M: Record<Motif, (p: P) => void> = {
  network({ c, w, h, r, rgb }) {
    const pts = Array.from({ length: 16 }, () => [w * (0.1 + r() * 0.8), h * (0.12 + r() * 0.76), 1.5 + r() * 3.5])
    c.lineWidth = 1; glow(c, rgba(rgb, 0.9), 8)
    pts.forEach((a, i) => pts.slice(i + 1).forEach((b) => {
      const d = Math.hypot(a[0] - b[0], a[1] - b[1])
      if (d < 190) { c.strokeStyle = rgba(rgb, 0.55 * (1 - d / 190)); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke() }
    }))
    pts.forEach((a) => { c.fillStyle = rgba(WHITE, 0.95); c.beginPath(); c.arc(a[0], a[1], a[2], 0, 7); c.fill() })
    noglow(c)
  },
  sushi({ c, w, h, r, rgb }) {
    // seigaiha waves
    for (let row = 0; row < 6; row++) {
      for (let i = -1; i < 9; i++) {
        const x = i * 90 + (row % 2 ? 45 : 0), y = h * 0.62 + row * 24
        for (let k = 4; k >= 1; k--) { c.strokeStyle = rgba(mix(BLUE, rgb, 0.4), 0.1 + 0.07 * k); c.lineWidth = 1.2; c.beginPath(); c.arc(x, y, k * 11, Math.PI, 0); c.stroke() }
      }
    }
    // nigiri: rice and topping, floating and softly lit
    const cx = w * 0.5, cy = h * 0.42
    glow(c, rgba(rgb, 0.8), 28)
    const rice = c.createLinearGradient(cx - 110, cy, cx + 110, cy + 60)
    rice.addColorStop(0, '#f4f1e6'); rice.addColorStop(1, '#b9bfd8')
    c.fillStyle = rice
    c.beginPath(); c.roundRect(cx - 105, cy + 4, 210, 62, 28); c.fill()
    const top = c.createLinearGradient(cx, cy - 40, cx, cy + 30)
    top.addColorStop(0, '#ffb08a'); top.addColorStop(0.55, '#ff7f66'); top.addColorStop(1, '#d9546a')
    c.fillStyle = top
    c.beginPath(); c.ellipse(cx, cy - 6, 128, 34, -0.03, 0, 7); c.fill()
    noglow(c)
    c.strokeStyle = 'rgba(255,240,230,0.55)'; c.lineWidth = 1.4
    for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(cx + i * 30 - 12, cy - 30); c.quadraticCurveTo(cx + i * 30, cy - 6, cx + i * 30 - 8, cy + 18); c.stroke() }
  },
  tourism({ c, w, h, r, rgb }) {
    c.fillStyle = rgba(mix(WHITE, rgb, 0.3), 0.9); glow(c, rgba(rgb, 0.9), 40)
    c.beginPath(); c.arc(w * 0.72, h * 0.26, 38, 0, 7); c.fill(); noglow(c)
    // mountain
    const mg = c.createLinearGradient(0, h * 0.3, 0, h)
    mg.addColorStop(0, '#2a3566'); mg.addColorStop(1, '#0a0e24')
    c.fillStyle = mg; c.beginPath(); c.moveTo(w * 0.1, h); c.lineTo(w * 0.42, h * 0.3); c.lineTo(w * 0.74, h); c.closePath(); c.fill()
    c.fillStyle = 'rgba(232,237,248,0.9)'; c.beginPath(); c.moveTo(w * 0.42, h * 0.3); c.lineTo(w * 0.35, h * 0.46); c.lineTo(w * 0.4, h * 0.43); c.lineTo(w * 0.43, h * 0.5); c.lineTo(w * 0.47, h * 0.44); c.lineTo(w * 0.51, h * 0.47); c.closePath(); c.fill()
    // torii
    c.fillStyle = rgba(mix([230, 90, 80], rgb, 0.2), 0.95); glow(c, 'rgba(255,120,110,0.6)', 14)
    c.fillRect(w * 0.62, h * 0.52, 12, h * 0.4); c.fillRect(w * 0.82, h * 0.52, 12, h * 0.4)
    c.beginPath(); c.moveTo(w * 0.58, h * 0.5); c.quadraticCurveTo(w * 0.72, h * 0.43, w * 0.86, h * 0.5); c.lineTo(w * 0.86, h * 0.55); c.quadraticCurveTo(w * 0.72, h * 0.49, w * 0.58, h * 0.55); c.closePath(); c.fill()
    c.fillRect(w * 0.615, h * 0.6, w * 0.235, 9); noglow(c)
    for (let i = 0; i < 34; i++) { c.fillStyle = `rgba(255,190,215,${0.25 + r() * 0.6})`; c.beginPath(); c.ellipse(r() * w, r() * h, 3, 1.6, r() * 3, 0, 7); c.fill() }
  },
  currency({ c, w, h, r, rgb }) {
    for (let k = 0; k < 7; k++) {
      c.strokeStyle = rgba(k % 2 ? BLUE : GOLD, 0.28 + 0.1 * (k % 3)); c.lineWidth = 1.4; glow(c, rgba(k % 2 ? BLUE : GOLD, 0.6), 10)
      c.beginPath()
      for (let x = 0; x <= w; x += 6) { const y = h * (0.28 + 0.07 * k) + Math.sin(x / 70 + k * 0.9) * 32 * (1 - k * 0.05) + Math.sin(x / 31 + k) * 6; x ? c.lineTo(x, y) : c.moveTo(x, y) }
      c.stroke()
    }
    noglow(c)
    const coin = (x: number, y: number, rad: number, g: string, col: [number, number, number]) => {
      glow(c, rgba(col, 0.9), 22); c.fillStyle = rgba(col, 0.18); c.strokeStyle = rgba(col, 0.95); c.lineWidth = 2.4
      c.beginPath(); c.arc(x, y, rad, 0, 7); c.fill(); c.stroke(); noglow(c)
      c.beginPath(); c.arc(x, y, rad * 0.78, 0, 7); c.lineWidth = 1; c.stroke()
      c.fillStyle = rgba(WHITE, 0.95); c.font = `500 ${rad * 1.05}px 'Cormorant Garamond', Georgia, serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(g, x, y + 2)
    }
    coin(w * 0.3, h * 0.46, 54, '$', BLUE); coin(w * 0.7, h * 0.54, 54, '¥', GOLD)
    c.strokeStyle = rgba(WHITE, 0.55); c.lineWidth = 1.6; c.setLineDash([6, 7])
    c.beginPath(); c.moveTo(w * 0.38, h * 0.4); c.bezierCurveTo(w * 0.5, h * 0.18, w * 0.6, h * 0.2, w * 0.66, h * 0.4); c.stroke()
    c.beginPath(); c.moveTo(w * 0.62, h * 0.62); c.bezierCurveTo(w * 0.52, h * 0.84, w * 0.42, h * 0.82, w * 0.34, h * 0.62); c.stroke(); c.setLineDash([])
  },
  ports({ c, w, h, r, rgb }) {
    const hor = h * 0.62
    c.fillStyle = rgba(rgb, 0.12); c.fillRect(0, hor, w, h - hor)
    for (let i = 0; i < 9; i++) { c.strokeStyle = rgba(WHITE, 0.12); c.beginPath(); c.moveTo(0, hor + i * 20); c.lineTo(w, hor + i * 20); c.stroke() }
    // cranes
    c.strokeStyle = rgba(BLUE, 0.85); c.lineWidth = 3; glow(c, rgba(BLUE, 0.8), 10)
    ;[0.12, 0.88].forEach((fx) => { const x = w * fx; c.beginPath(); c.moveTo(x, hor); c.lineTo(x, h * 0.2); c.lineTo(fx < 0.5 ? x + 110 : x - 110, h * 0.2); c.moveTo(fx < 0.5 ? x + 12 : x - 12, hor); c.lineTo(fx < 0.5 ? x + 12 : x - 12, h * 0.26); c.stroke() })
    // ship
    c.fillStyle = '#0b1230'; c.strokeStyle = rgba(WHITE, 0.7); c.lineWidth = 2
    c.beginPath(); c.moveTo(w * 0.2, hor - 8); c.lineTo(w * 0.8, hor - 8); c.lineTo(w * 0.74, hor + 26); c.lineTo(w * 0.27, hor + 26); c.closePath(); c.fill(); c.stroke()
    noglow(c)
    const cols = [rgb, GOLD, BLUE, VIOLET, WHITE]
    for (let row = 0; row < 3; row++) for (let i = 0; i < 12; i++) { c.fillStyle = rgba(cols[(i * 3 + row * 5) % 5], 0.75); c.fillRect(w * 0.26 + i * 28, hor - 22 - row * 16, 24, 14) }
    c.fillStyle = rgba(WHITE, 0.9); c.fillRect(w * 0.7, hor - 62, 28, 40); c.fillRect(w * 0.73, hor - 78, 6, 16)
    for (let i = 0; i < 20; i++) { c.fillStyle = `rgba(255,220,160,${0.2 + r() * 0.5})`; c.fillRect(r() * w, hor + 30 + r() * 80, 2 + r() * 14, 1) }
  },
  meiji({ c, w, h, r, rgb }) {
    c.fillStyle = rgba(GOLD, 0.85); glow(c, rgba(GOLD, 0.8), 36); c.beginPath(); c.arc(w * 0.74, h * 0.3, 42, 0, 7); c.fill(); noglow(c)
    // pagoda
    const cx = w * 0.36, base = h * 0.88
    c.fillStyle = '#0a0e28'; c.strokeStyle = rgba(WHITE, 0.8); c.lineWidth = 2; glow(c, rgba(rgb, 0.7), 12)
    for (let i = 0; i < 5; i++) {
      const y = base - i * 50, hw = 98 - i * 14
      c.beginPath(); c.moveTo(cx - hw - 22, y); c.quadraticCurveTo(cx - hw * 0.4, y - 8, cx, y - 26); c.quadraticCurveTo(cx + hw * 0.4, y - 8, cx + hw + 22, y); c.lineTo(cx + hw, y + 4); c.lineTo(cx - hw, y + 4); c.closePath(); c.fill(); c.stroke()
      c.fillRect(cx - hw * 0.62, y + 4, hw * 1.24, 18); c.strokeRect(cx - hw * 0.62, y + 4, hw * 1.24, 18)
    }
    c.beginPath(); c.moveTo(cx, base - 5 * 50 - 6); c.lineTo(cx, base - 5 * 50 - 44); c.stroke(); noglow(c)
    // gear of the new age, and a rail line
    c.strokeStyle = rgba(BLUE, 0.7); c.lineWidth = 2; glow(c, rgba(BLUE, 0.7), 14)
    const gx = w * 0.72, gy = h * 0.66
    c.beginPath(); for (let i = 0; i < 24; i++) { const a = (i / 24) * 6.283, rad = i % 2 ? 58 : 72; c.lineTo(gx + Math.cos(a) * rad, gy + Math.sin(a) * rad) } c.closePath(); c.stroke()
    c.beginPath(); c.arc(gx, gy, 24, 0, 7); c.stroke(); noglow(c)
    c.strokeStyle = rgba(WHITE, 0.4); c.beginPath(); c.moveTo(w * 0.52, h * 0.95); c.lineTo(w, h * 0.78); c.moveTo(w * 0.52, h * 0.99); c.lineTo(w, h * 0.84); c.stroke()
  },
  industry({ c, w, h, r, rgb }) {
    // chimneys and steam
    ;[0.16, 0.3, 0.44].forEach((fx, i) => {
      const x = w * fx, top = h * (0.34 + i * 0.05)
      c.fillStyle = '#0b1030'; c.strokeStyle = rgba(WHITE, 0.55); c.lineWidth = 1.6
      c.beginPath(); c.moveTo(x - 18, h * 0.88); c.lineTo(x - 11, top); c.lineTo(x + 11, top); c.lineTo(x + 18, h * 0.88); c.closePath(); c.fill(); c.stroke()
      for (let k = 0; k < 5; k++) { c.fillStyle = `rgba(210,222,245,${0.2 - k * 0.03})`; c.beginPath(); c.arc(x + k * 16 + Math.sin(k) * 8, top - 14 - k * 24, 14 + k * 8, 0, 7); c.fill() }
    })
    c.fillStyle = '#0b1030'; c.fillRect(0, h * 0.86, w, h * 0.14)
    // gear
    const gx = w * 0.7, gy = h * 0.46
    c.strokeStyle = rgba(GOLD, 0.85); c.lineWidth = 3; glow(c, rgba(GOLD, 0.8), 22)
    c.beginPath(); for (let i = 0; i < 32; i++) { const a = (i / 32) * 6.283, rad = i % 2 ? 92 : 112; c.lineTo(gx + Math.cos(a) * rad, gy + Math.sin(a) * rad) } c.closePath(); c.stroke()
    c.beginPath(); c.arc(gx, gy, 34, 0, 7); c.stroke()
    for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.283; c.beginPath(); c.moveTo(gx + Math.cos(a) * 34, gy + Math.sin(a) * 34); c.lineTo(gx + Math.cos(a) * 88, gy + Math.sin(a) * 88); c.stroke() }
    noglow(c)
    // rails in perspective
    c.strokeStyle = rgba(BLUE, 0.7); c.lineWidth = 1.6
    for (const off of [-40, 40]) { c.beginPath(); c.moveTo(w * 0.5 + off * 0.1, h * 0.7); c.lineTo(w * 0.5 + off * 9, h); c.stroke() }
    for (let i = 0; i < 8; i++) { const y = h * 0.7 + Math.pow(i / 8, 1.8) * h * 0.3, hw = 4 + (y - h * 0.7) * 0.34; c.beginPath(); c.moveTo(w * 0.5 - hw, y); c.lineTo(w * 0.5 + hw, y); c.stroke() }
  },
  circuit({ c, w, h, r, rgb }) {
    const cols = 6, rows = 5
    const nodes: [number, number][][] = []
    for (let i = 0; i < cols; i++) {
      const n = 3 + (i % 3), col: [number, number][] = []
      for (let j = 0; j < n; j++) col.push([w * (0.1 + i * 0.16), h * (0.5 + (j - (n - 1) / 2) * 0.17)])
      nodes.push(col)
    }
    c.lineWidth = 1; glow(c, rgba(rgb, 0.7), 6)
    nodes.forEach((col, i) => i < cols - 1 && col.forEach((a) => nodes[i + 1].forEach((b) => { c.strokeStyle = rgba(rgb, 0.12 + r() * 0.4); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke() })))
    nodes.flat().forEach((p) => { c.fillStyle = rgba(WHITE, 0.95); c.beginPath(); c.arc(p[0], p[1], 5 + r() * 3, 0, 7); c.fill(); c.strokeStyle = rgba(rgb, 0.9); c.beginPath(); c.arc(p[0], p[1], 11, 0, 7); c.stroke() })
    noglow(c); c.strokeStyle = rgba(BLUE, 0.35); void rows
    for (let i = 0; i < 12; i++) { const y = r() * h; c.beginPath(); c.moveTo(0, y); c.lineTo(30 + r() * 60, y); c.lineTo(50 + r() * 60, y + 16); c.stroke() }
  },
  orbit({ c, w, h, r, rgb }) {
    const cx = w * 0.5, cy = h * 0.5
    for (let k = 0; k < 4; k++) { c.strokeStyle = rgba(mix(rgb, WHITE, 0.3), 0.3 - k * 0.04); c.lineWidth = 1.2; c.beginPath(); c.ellipse(cx, cy, 90 + k * 52, 34 + k * 16, -0.38, 0, 7); c.stroke() }
    const g = c.createRadialGradient(cx - 24, cy - 24, 6, cx, cy, 70)
    g.addColorStop(0, rgba(WHITE, 1)); g.addColorStop(0.4, rgba(mix(rgb, WHITE, 0.3), 1)); g.addColorStop(1, rgba(mix(rgb, [8, 12, 36], 0.7), 1))
    glow(c, rgba(rgb, 0.8), 40); c.fillStyle = g; c.beginPath(); c.arc(cx, cy, 64, 0, 7); c.fill(); noglow(c)
    c.fillStyle = rgba(WHITE, 0.95); for (let k = 0; k < 4; k++) { const a = r() * 6.28; c.beginPath(); c.arc(cx + Math.cos(a) * (142 + k * 52 - 52) * 0.9, cy + Math.sin(a) * (50 + k * 16) , 3.5, 0, 7); c.fill() }
  },
  helix({ c, w, h, r, rgb }) {
    glow(c, rgba(rgb, 0.8), 12)
    const A: [number, number][] = [], B: [number, number][] = []
    for (let i = 0; i <= 60; i++) { const t = i / 60, x = w * (0.12 + 0.76 * t), a = t * 12.5; A.push([x, h * 0.5 + Math.sin(a) * 78]); B.push([x, h * 0.5 + Math.sin(a + Math.PI) * 78]) }
    ;[A, B].forEach((S, k) => { c.strokeStyle = rgba(k ? BLUE : mix(rgb, WHITE, 0.3), 0.9); c.lineWidth = 3; c.beginPath(); S.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke() })
    for (let i = 2; i < 60; i += 3) { c.strokeStyle = rgba(WHITE, 0.35); c.lineWidth = 1.4; c.beginPath(); c.moveTo(A[i][0], A[i][1]); c.lineTo(B[i][0], B[i][1]); c.stroke(); c.fillStyle = rgba(WHITE, 0.9); c.beginPath(); c.arc(A[i][0], A[i][1], 3.4, 0, 7); c.arc(B[i][0], B[i][1], 3.4, 0, 7); c.fill() }
    noglow(c)
  },
  columns({ c, w, h, r, rgb }) {
    const rays = c.createRadialGradient(w * 0.5, h * 0.05, 0, w * 0.5, h * 0.05, h * 1.1)
    rays.addColorStop(0, rgba(mix(rgb, WHITE, 0.4), 0.45)); rays.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = rays; c.fillRect(0, 0, w, h)
    c.fillStyle = '#0a0f2c'; c.strokeStyle = rgba(WHITE, 0.75); c.lineWidth = 1.8; glow(c, rgba(rgb, 0.7), 14)
    c.beginPath(); c.moveTo(w * 0.1, h * 0.3); c.lineTo(w * 0.5, h * 0.12); c.lineTo(w * 0.9, h * 0.3); c.closePath(); c.fill(); c.stroke()
    c.fillRect(w * 0.1, h * 0.3, w * 0.8, 14); c.strokeRect(w * 0.1, h * 0.3, w * 0.8, 14)
    for (let i = 0; i < 6; i++) { const x = w * (0.14 + i * 0.145); c.fillRect(x, h * 0.34, 28, h * 0.5); c.strokeRect(x, h * 0.34, 28, h * 0.5); for (let k = 1; k < 3; k++) { c.beginPath(); c.moveTo(x + k * 9.3, h * 0.36); c.lineTo(x + k * 9.3, h * 0.82); c.stroke() } }
    c.fillRect(w * 0.08, h * 0.84, w * 0.84, 14); c.strokeRect(w * 0.08, h * 0.84, w * 0.84, 14); noglow(c)
  },
  chart({ c, w, h, r, rgb }) {
    c.strokeStyle = rgba(WHITE, 0.08); c.lineWidth = 1
    for (let i = 1; i < 8; i++) { c.beginPath(); c.moveTo(0, h * i / 8); c.lineTo(w, h * i / 8); c.stroke() }
    let y = h * 0.72; const pts: [number, number][] = []
    for (let i = 0; i <= 40; i++) { y += (r() - 0.56) * 22; y = Math.max(h * 0.14, Math.min(h * 0.86, y)); pts.push([w * (0.04 + 0.92 * i / 40), y]) }
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, rgba(rgb, 0.4)); g.addColorStop(1, 'rgba(0,0,0,0)')
    c.fillStyle = g; c.beginPath(); c.moveTo(pts[0][0], h); pts.forEach((p) => c.lineTo(p[0], p[1])); c.lineTo(pts[pts.length - 1][0], h); c.closePath(); c.fill()
    glow(c, rgba(rgb, 0.9), 14); c.strokeStyle = rgba(WHITE, 0.95); c.lineWidth = 2.4; c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke(); noglow(c)
    for (let i = 3; i < 40; i += 5) { const p = pts[i], up = r() > 0.5; c.strokeStyle = rgba(up ? BLUE : GOLD, 0.8); c.lineWidth = 1.2; c.beginPath(); c.moveTo(p[0], p[1] - 30); c.lineTo(p[0], p[1] + 30); c.stroke(); c.fillStyle = rgba(up ? BLUE : GOLD, 0.7); c.fillRect(p[0] - 5, p[1] - 12, 10, 24) }
  },
  wave({ c, w, h, r, rgb }) {
    glow(c, rgba(rgb, 0.8), 10)
    for (let i = 0; i < 64; i++) { const x = w * (0.06 + 0.88 * i / 63), a = (Math.sin(i * 0.33) * 0.5 + 0.5) * (0.4 + 0.6 * Math.sin(i * 0.11 + 1) ** 2), hh = 10 + a * 150 + r() * 14
      c.strokeStyle = rgba(mix(rgb, WHITE, i / 90), 0.9); c.lineWidth = 3.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, h / 2 - hh / 2); c.lineTo(x, h / 2 + hh / 2); c.stroke() }
    noglow(c)
    for (let k = 1; k < 4; k++) { c.strokeStyle = rgba(rgb, 0.18); c.beginPath(); c.arc(w * 0.5, h * 0.5, 60 * k + 40, 0, 7); c.stroke() }
  },
  field({ c, w, h, r, rgb }) {
    const hor = h * 0.42
    c.fillStyle = rgba(GOLD, 0.8); glow(c, rgba(GOLD, 0.8), 40); c.beginPath(); c.arc(w * 0.5, hor - 6, 36, 0, 7); c.fill(); noglow(c)
    const g = c.createLinearGradient(0, hor, 0, h); g.addColorStop(0, '#16224a'); g.addColorStop(1, '#070a1c'); c.fillStyle = g; c.fillRect(0, hor, w, h - hor)
    c.strokeStyle = rgba(mix(rgb, WHITE, 0.2), 0.55); c.lineWidth = 1.4
    for (let i = -14; i <= 14; i++) { c.beginPath(); c.moveTo(w * 0.5 + i * 4, hor); c.lineTo(w * 0.5 + i * 62, h); c.stroke() }
    for (let k = 0; k < 40; k++) { const t = Math.pow(r(), 1.5), y = hor + t * (h - hor), x = w * 0.5 + (r() - 0.5) * 2 * (6 + t * w * 0.8), s = 4 + t * 16
      c.strokeStyle = rgba(mix(rgb, [150, 230, 140], 0.5), 0.9); c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x - s * 0.4, y - s, x - s * 0.7, y - s * 1.5); c.moveTo(x, y); c.quadraticCurveTo(x + s * 0.4, y - s, x + s * 0.7, y - s * 1.4); c.stroke() }
  },
  cloud({ c, w, h, r, rgb }) {
    for (let i = 0; i < 9; i++) { const x = w * (0.12 + r() * 0.76), y = h * (0.22 + r() * 0.3); for (let k = 0; k < 7; k++) { const g = c.createRadialGradient(x + k * 22, y + Math.sin(k) * 10, 0, x + k * 22, y, 46); g.addColorStop(0, rgba(mix(WHITE, rgb, 0.4), 0.2)); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x + k * 22 - 50, y - 50, 100, 100) } }
    c.strokeStyle = rgba(BLUE, 0.55); c.lineWidth = 1.2
    for (let i = 0; i < 70; i++) { const x = r() * w, y = h * (0.5 + r() * 0.5); c.beginPath(); c.moveTo(x, y); c.lineTo(x - 5, y + 16); c.stroke() }
    for (let k = 1; k < 6; k++) { c.strokeStyle = rgba(rgb, 0.22); c.beginPath(); c.ellipse(w * 0.5, h * 0.82, 60 * k, 9 * k, 0, Math.PI, 0); c.stroke() }
  },
  bolt({ c, w, h, r, rgb }) {
    glow(c, rgba(GOLD, 0.95), 30); c.fillStyle = rgba(mix(GOLD, WHITE, 0.4), 0.95)
    c.beginPath(); c.moveTo(w * 0.54, h * 0.08); c.lineTo(w * 0.36, h * 0.52); c.lineTo(w * 0.5, h * 0.52); c.lineTo(w * 0.44, h * 0.92); c.lineTo(w * 0.68, h * 0.4); c.lineTo(w * 0.53, h * 0.4); c.closePath(); c.fill(); noglow(c)
    c.strokeStyle = rgba(BLUE, 0.6); c.lineWidth = 1.6
    for (const fx of [0.1, 0.22, 0.78, 0.9]) { const x = w * fx; c.beginPath(); c.moveTo(x, h); c.lineTo(x, h * 0.4); c.moveTo(x - 24, h * 0.5); c.lineTo(x + 24, h * 0.5); c.moveTo(x - 16, h * 0.42); c.lineTo(x + 16, h * 0.42); c.stroke() }
    c.strokeStyle = rgba(WHITE, 0.25); c.beginPath(); c.moveTo(0, h * 0.5); c.quadraticCurveTo(w * 0.16, h * 0.62, w * 0.34, h * 0.5); c.moveTo(w * 0.66, h * 0.5); c.quadraticCurveTo(w * 0.84, h * 0.62, w, h * 0.5); c.stroke()
  },
  book({ c, w, h, r, rgb }) {
    const cx = w * 0.5, cy = h * 0.62
    glow(c, rgba(rgb, 0.8), 30)
    c.fillStyle = rgba(mix(WHITE, rgb, 0.25), 0.16); c.strokeStyle = rgba(WHITE, 0.85); c.lineWidth = 2
    c.beginPath(); c.moveTo(cx, cy - 20); c.quadraticCurveTo(cx - 110, cy - 70, cx - 230, cy - 40); c.lineTo(cx - 230, cy + 90); c.quadraticCurveTo(cx - 110, cy + 60, cx, cy + 96); c.closePath(); c.fill(); c.stroke()
    c.beginPath(); c.moveTo(cx, cy - 20); c.quadraticCurveTo(cx + 110, cy - 70, cx + 230, cy - 40); c.lineTo(cx + 230, cy + 90); c.quadraticCurveTo(cx + 110, cy + 60, cx, cy + 96); c.closePath(); c.fill(); c.stroke(); noglow(c)
    c.strokeStyle = rgba(WHITE, 0.4); c.lineWidth = 1
    for (let i = 0; i < 7; i++) { c.beginPath(); c.moveTo(cx - 205, cy - 22 + i * 14); c.quadraticCurveTo(cx - 110, cy - 46 + i * 14, cx - 20, cy - 4 + i * 14); c.moveTo(cx + 205, cy - 22 + i * 14); c.quadraticCurveTo(cx + 110, cy - 46 + i * 14, cx + 20, cy - 4 + i * 14); c.stroke() }
    c.font = "500 22px 'Cormorant Garamond', Georgia, serif"; c.textAlign = 'center'
    for (let i = 0; i < 18; i++) { c.fillStyle = `rgba(232,237,248,${0.15 + r() * 0.55})`; c.fillText('AΩΨabcdefg*'.charAt(Math.floor(r() * 11)), w * (0.15 + r() * 0.7), h * (0.06 + r() * 0.3)) }
  },
  brush({ c, w, h, r, rgb }) {
    const cols = [rgb, BLUE, VIOLET, GOLD, [245, 163, 208] as [number, number, number]]
    for (let i = 0; i < 9; i++) { const col = cols[i % cols.length]; c.strokeStyle = rgba(col, 0.55); c.lineWidth = 8 + r() * 26; c.lineCap = 'round'; glow(c, rgba(col, 0.6), 14)
      c.beginPath(); c.moveTo(w * (0.05 + r() * 0.3), h * (0.1 + r() * 0.8)); c.bezierCurveTo(w * (0.3 + r() * 0.2), h * r(), w * (0.5 + r() * 0.2), h * r(), w * (0.7 + r() * 0.25), h * (0.1 + r() * 0.8)); c.stroke() }
    noglow(c); c.strokeStyle = rgba(WHITE, 0.55); c.lineWidth = 1.5; c.strokeRect(w * 0.07, h * 0.09, w * 0.86, h * 0.82)
  },
  mind({ c, w, h, r, rgb }) {
    const cx = w * 0.5, cy = h * 0.5
    glow(c, rgba(rgb, 0.8), 16); c.strokeStyle = rgba(WHITE, 0.8); c.lineWidth = 2
    c.beginPath(); c.moveTo(cx - 70, h * 0.88); c.quadraticCurveTo(cx - 110, h * 0.5, cx - 70, h * 0.28); c.quadraticCurveTo(cx - 10, h * 0.06, cx + 62, h * 0.24); c.quadraticCurveTo(cx + 108, h * 0.4, cx + 72, h * 0.54); c.lineTo(cx + 84, h * 0.62); c.lineTo(cx + 40, h * 0.62); c.lineTo(cx + 40, h * 0.88); c.stroke()
    const pts = Array.from({ length: 14 }, () => [cx - 60 + r() * 120, h * 0.18 + r() * h * 0.36])
    pts.forEach((a, i) => pts.slice(i + 1).forEach((b) => { if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 62) { c.strokeStyle = rgba(rgb, 0.7); c.lineWidth = 1; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke() } }))
    pts.forEach((p) => { c.fillStyle = rgba(WHITE, 0.95); c.beginPath(); c.arc(p[0], p[1], 3, 0, 7); c.fill() }); noglow(c); void cy
  },
  road({ c, w, h, r, rgb }) {
    const vx = w * 0.5, vy = h * 0.36
    c.strokeStyle = rgba(WHITE, 0.45); c.lineWidth = 1.6
    for (const x of [-0.1, 0.2, 0.8, 1.1]) { c.beginPath(); c.moveTo(vx + (x - 0.5) * 12, vy); c.lineTo(w * x, h); c.stroke() }
    c.strokeStyle = rgba(GOLD, 0.7); c.setLineDash([14, 14]); c.beginPath(); c.moveTo(vx, vy); c.lineTo(vx + 4, h); c.stroke(); c.setLineDash([])
    for (let i = 0; i < 26; i++) { const t = Math.pow(r(), 2), y = vy + t * (h - vy), x = vx + (r() > 0.5 ? 1 : -1) * (14 + t * w * 0.42); glow(c, rgba(rgb, 0.9), 10); c.fillStyle = rgba(WHITE, 0.9); c.beginPath(); c.arc(x, y, 1.5 + t * 3, 0, 7); c.fill() }
    noglow(c)
    for (let k = 1; k < 5; k++) { c.strokeStyle = rgba(rgb, 0.2); c.beginPath(); c.ellipse(w * 0.5, h * 0.28, 70 * k, 10 * k, 0, 0, 7); c.stroke() }
  },
  crowd({ c, w, h, r, rgb }) {
    for (let i = 0; i < 70; i++) { const x = w * (0.05 + r() * 0.9), y = h * (0.35 + r() * 0.55), s = 7 + (y / h) * 18
      glow(c, rgba(rgb, 0.6), 8); c.fillStyle = rgba(mix(rgb, WHITE, r() * 0.5), 0.25 + 0.55 * (y / h)); c.beginPath(); c.arc(x, y - s, s * 0.42, 0, 7); c.fill()
      c.beginPath(); c.moveTo(x - s * 0.55, y + s * 0.5); c.quadraticCurveTo(x, y - s * 0.8, x + s * 0.55, y + s * 0.5); c.closePath(); c.fill() }
    noglow(c); c.strokeStyle = rgba(WHITE, 0.2); c.lineWidth = 1.2
    for (let i = 0; i < 12; i++) { c.beginPath(); c.moveTo(w * (0.2 + r() * 0.6), h * (0.3 + r() * 0.5)); c.lineTo(w * (0.2 + r() * 0.6), h * (0.3 + r() * 0.5)); c.stroke() }
  },
}

export function drawEventArt(canvas: HTMLCanvasElement, nodeId: string, color: string, motif: Motif) {
  canvas.width = ART_W; canvas.height = ART_H
  const c = canvas.getContext('2d')!
  const n = parseInt(color.slice(1), 16)
  const rgb: [number, number, number] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  const r = rng(hashStr(nodeId))
  const p: P = { c, w: ART_W, h: ART_H, r, col: color, rgb }
  backdrop(p)
  c.save(); M[motif](p); c.restore()
  // film grain and a gentle colour grade so every motif belongs to the same universe
  c.globalCompositeOperation = 'overlay'
  c.fillStyle = rgba(mix(rgb, VIOLET, 0.4), 0.16); c.fillRect(0, 0, ART_W, ART_H)
  c.globalCompositeOperation = 'source-over'
  const g = rng(hashStr(nodeId) ^ 77)
  for (let i = 0; i < 2600; i++) { c.fillStyle = `rgba(255,255,255,${g() * 0.05})`; c.fillRect(g() * ART_W, g() * ART_H, 1, 1) }
}
