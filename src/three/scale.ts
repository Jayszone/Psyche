import { CATEGORIES } from '../data/dataset'

/** Shared with shaders and with the projection pass so on-screen sizes always agree. */
export const nodeScale = { value: 1 }
export const timeUniform = { value: 0 }
export const motionUniform = { value: 1 }

/** Nodes grow with camera distance so the far universe stays legible, and shrink when you are close. */
export function scaleForRadius(r: number) { return Math.min(1.8, Math.max(0.16, 0.08 + r / 140)) }
/** Visual hierarchy: a few large luminous events, a middle tier, and many small points. */
export function baseNodeSize(importance: number) { return 0.42 + 2.3 * Math.pow(importance, 1.7) }
export type Tier = 0 | 1 | 2
export function tierOf(importance: number): Tier { return importance >= 0.78 ? 2 : importance >= 0.45 ? 1 : 0 }
export const TIER_FAR = [105, 230, Infinity] as const

/** Hex to display-space floats. Shaders here write straight to the screen, so no colour-space conversion. */
export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}
const cache = new Map(CATEGORIES.map((c) => [c.id as string, hexToRgb(c.color)]))
export function categoryRgb(id: string): [number, number, number] { return cache.get(id) ?? [0.9, 0.93, 0.97] }
export const GOLD_RGB = hexToRgb('#E8BE79')
