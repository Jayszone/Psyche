/** Graph model. Pure data: nothing in this folder imports Three.js or React. */

export type CategoryId =
  | 'politics' | 'geopolitics' | 'trade' | 'economics' | 'finance'
  | 'technology' | 'ai' | 'science' | 'physics' | 'mathematics' | 'space'
  | 'biology' | 'medicine' | 'healthcare' | 'psychology' | 'sociology'
  | 'environment' | 'climate' | 'energy' | 'agriculture' | 'food' | 'geography'
  | 'culture' | 'art' | 'music' | 'literature' | 'philosophy' | 'religion' | 'education' | 'media'
  | 'history' | 'transportation' | 'manufacturing' | 'sports'
  | 'user'

/** How well a relationship is supported. These are mock labels, not calibrated probabilities. */
export type Evidence = 'strong' | 'plausible' | 'speculative' | 'user'

export type RelationType =
  | 'causes' | 'drives' | 'influences' | 'enables' | 'constrains' | 'correlates' | 'user-defined'

export interface Reference { title: string; note?: string }

export interface GraphNode {
  id: string
  label: string
  category: CategoryId
  description: string
  /** World-space position. Optional on input; layout fills it in. */
  position: [number, number, number]
  /** 0 to 1. Drives size, brightness and label priority. */
  importance: number
  metadata?: Record<string, string>
  /** Optional key into the event media registry (src/media). */
  media?: string
  userCreated?: boolean
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  description: string
  type: RelationType
  evidence: Evidence
  references?: Reference[]
  userCreated?: boolean
}

export interface GraphData { nodes: GraphNode[]; edges: GraphEdge[] }

/** What an external service may return: positions are optional. */
export interface RawNode extends Omit<GraphNode, 'position'> { position?: [number, number, number] }
export interface RawGraph { nodes: RawNode[]; edges: GraphEdge[] }

export interface CategoryMeta {
  id: CategoryId
  label: string
  color: string
  center: [number, number, number]
  blurb: string
  /** The wider region of the universe this constellation belongs to. */
  region: string
}

export interface RegionMeta { id: string; name: string; center: [number, number, number]; members: CategoryId[] }

export interface FoundPath {
  nodeIds: string[]
  edgeIds: string[]
  /** reversed[i] is true when edge i is walked from target to source. */
  reversed: boolean[]
  /** True when every step follows the stated direction of cause. */
  directed: boolean
  cost: number
  weakest: Evidence
  includesUser: boolean
  label: string
}
