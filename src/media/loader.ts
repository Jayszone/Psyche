import * as THREE from 'three'
import type { GraphNode } from '../graph/types'
import { categoryRgb } from '../three/scale'
import { drawEventArt } from './procedural'
import { EVENT_MEDIA, motifFor } from './registry'

/**
 * Lazy, cached event textures. A named `src` is loaded on demand and falls back to procedural art
 * if it fails. Textures are capped (least recently used are disposed) to keep GPU memory bounded.
 */
const MAX = 28
const cache = new Map<string, { tex: THREE.Texture; kind: 'image' | 'procedural' }>()
const pending = new Map<string, Promise<void>>()

const hex = (id: string) => { const [r, g, b] = categoryRgb(id); return '#' + [r, g, b].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('') }

function procedural(node: GraphNode): THREE.Texture {
  const cv = document.createElement('canvas')
  drawEventArt(cv, node.id, hex(node.category), motifFor(node.id, node.category))
  const t = new THREE.CanvasTexture(cv)
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4
  return t
}

function touch(id: string) { const v = cache.get(id); if (v) { cache.delete(id); cache.set(id, v) } }
function evict() {
  while (cache.size > MAX) { const k = cache.keys().next().value as string; cache.get(k)?.tex.dispose(); cache.delete(k) }
}

/** Returns a texture immediately (procedural) and upgrades it if a curated image is registered and loads. */
export function getEventTexture(node: GraphNode, onUpgrade?: () => void): { tex: THREE.Texture; kind: 'image' | 'procedural' } {
  const hit = cache.get(node.id)
  if (hit) { touch(node.id); return hit }
  const entry = { tex: procedural(node), kind: 'procedural' as const }
  cache.set(node.id, entry); evict()
  const src = EVENT_MEDIA[node.id]?.src
  if (src && !pending.has(node.id)) {
    pending.set(node.id, new Promise<void>((resolve) => {
      new THREE.TextureLoader().load(src, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace
        cache.get(node.id)?.tex.dispose()
        cache.set(node.id, { tex, kind: 'image' }); onUpgrade?.(); resolve()
      }, undefined, () => resolve()) // failure keeps the procedural art
    }))
  }
  return entry
}

export function altFor(node: GraphNode): string {
  return EVENT_MEDIA[node.id]?.alt ?? `Conceptual artwork for ${node.label}`
}
export function isCurated(node: GraphNode): boolean { return !!EVENT_MEDIA[node.id]?.src }
