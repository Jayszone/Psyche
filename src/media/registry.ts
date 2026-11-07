import type { CategoryId } from '../graph/types'

/**
 * Event media registry. Every event can have:
 *  - `src`:   a curated or generated image (place files in public/art/ and reference '/art/<name>.webp')
 *  - `motif`: which procedural illustration to draw when there is no image
 * Nothing here is fetched speculatively: an image is requested only when an entry names a `src`.
 *
 * FUTURE: an image-generation or curated-library service can fill `src` per event id.
 * Procedural art is intentionally abstract and labelled as conceptual. It never claims to depict the event.
 */
export type Motif =
  | 'network' | 'sushi' | 'tourism' | 'currency' | 'ports' | 'meiji' | 'industry'
  | 'circuit' | 'orbit' | 'helix' | 'columns' | 'chart' | 'wave' | 'field' | 'cloud'
  | 'bolt' | 'book' | 'brush' | 'mind' | 'road' | 'crowd'

export interface EventMedia { src?: string; motif?: Motif; alt?: string; credit?: string }

/** Event-specific choices. Anything not listed falls back to its category's motif. */
export const EVENT_MEDIA: Record<string, EventMedia> = {
  'sushi-prices': { motif: 'sushi', alt: 'Abstract nigiri over cosmic waves' },
  'japan-tourism': { motif: 'tourism', alt: 'A mountain, a gate and drifting petals' },
  'usd-jpy': { motif: 'currency', alt: 'Flowing currency curves' },
  'japan-exports': { motif: 'ports', alt: 'A container ship and port cranes' },
  meiji: { motif: 'meiji', alt: 'A pagoda silhouette and a turning gear' },
  'industrial-rev': { motif: 'industry', alt: 'Chimneys, steam, a gear and railway lines' },
  'us-midterms': { motif: 'columns', alt: 'A columned hall' },
  'japan-import-costs': { motif: 'ports' },
  'shipping-costs': { motif: 'ports' },
  'restaurant-costs': { motif: 'sushi' },
  'printing-press': { motif: 'book' },
  transistor: { motif: 'circuit' },
  'el-nino': { motif: 'cloud' },
  'rice-prices': { motif: 'field' },
}

const BY_CATEGORY: Partial<Record<CategoryId, Motif>> = {
  politics: 'columns', geopolitics: 'columns', trade: 'ports', economics: 'chart', finance: 'chart',
  technology: 'circuit', ai: 'circuit', science: 'orbit', physics: 'orbit', mathematics: 'network', space: 'orbit',
  biology: 'helix', medicine: 'helix', healthcare: 'crowd', psychology: 'mind', sociology: 'crowd',
  environment: 'cloud', climate: 'cloud', energy: 'bolt', agriculture: 'field', food: 'field', geography: 'road',
  culture: 'brush', art: 'brush', music: 'wave', literature: 'book', philosophy: 'columns', religion: 'columns',
  education: 'book', media: 'wave', history: 'book', transportation: 'road', manufacturing: 'industry', sports: 'crowd',
}

export function motifFor(nodeId: string, category: CategoryId): Motif {
  return EVENT_MEDIA[nodeId]?.motif ?? BY_CATEGORY[category] ?? 'network'
}
