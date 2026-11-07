import { CATEGORIES } from '../data/dataset'

/** Shared with shaders and with the projection pass so on-screen sizes always agree. */
export const nodeScale = { value: 1 }
export const timeUniform = { value: 0 }
export const motionUniform = { value: 1 }

export function scaleForRadius(r: number) { return Math.min(1, Math.max(0.4, 0.35 + 0.65 * (r / 90))) }
export function baseNodeSize(importance: number) { return 0.55 + 1.35 * importance }

/** Hex to display-space floats. Shaders here write straight to the screen, so no colour-space conversion. */
export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}
const cache = new Map(CATEGORIES.map((c) => [c.id as string, hexToRgb(c.color)]))
export function categoryRgb(id: string): [number, number, number] { return cache.get(id) ?? [0.9, 0.93, 0.97] }
export const GOLD_RGB = hexToRgb('#E8BE79')
