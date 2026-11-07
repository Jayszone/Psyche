/**
 * Shared, non-reactive screen-space projection of every node and constellation label.
 * The 3D scene writes it each frame; HTML overlays (labels, connect handle) read it in their
 * own animation loops, so React never re-renders per frame.
 */
export const MAX_NODES = 512

export const proj = {
  width: 1,
  height: 1,
  count: 0,
  ids: [] as string[],
  x: new Float32Array(MAX_NODES),
  y: new Float32Array(MAX_NODES),
  depth: new Float32Array(MAX_NODES),
  /** Approximate on-screen radius of the glowing core, in CSS pixels. */
  radius: new Float32Array(MAX_NODES),
  visible: new Uint8Array(MAX_NODES),
  /** Current rendered brightness 0..1 (after distance fading). Faded-out nodes cannot be picked. */
  alpha: new Float32Array(MAX_NODES).fill(1),
  cat: { x: new Float32Array(16), y: new Float32Array(16), visible: new Uint8Array(16), depth: new Float32Array(16) },
  reg: { x: new Float32Array(8), y: new Float32Array(8), visible: new Uint8Array(8) },
  camRadius: 130,
  camTarget: [0, 0, 0] as [number, number, number],
}

export function pickNodeAt(px: number, py: number, exclude?: string | null, slop = 0): number {
  let best = -1
  let bestD = Infinity
  for (let i = 0; i < proj.count; i++) {
    if (!proj.visible[i] || proj.ids[i] === exclude || proj.alpha[i] < 0.22) continue
    const reach = Math.max(14, proj.radius[i] * 0.9) + slop
    const d = Math.hypot(proj.x[i] - px, proj.y[i] - py)
    if (d < reach && d - reach * 0.15 + proj.depth[i] * 0.02 < bestD) { bestD = d - reach * 0.15 + proj.depth[i] * 0.02; best = i }
  }
  return best
}
