import { CATEGORIES, RAW_EDGES, RAW_NODES } from '../data/dataset'
import { layoutGraph } from './layout'
import type { CategoryMeta, GraphData, GraphEdge, GraphNode, RawGraph } from './types'

/**
 * The only seam between the frontend and its data. A future AI or knowledge-graph service
 * implements this interface and returns nodes and edges. Positions are optional: nodes
 * without one are placed by layoutGraph.
 */
export interface GraphRepository {
  categories: CategoryMeta[]
  load(): Promise<GraphData>
  /** Persist user-created nodes and edges. May be a no-op. */
  saveUserContent(graph: GraphData): void
}

const KEY = 'psyche.user.v1'

export class LocalGraphRepository implements GraphRepository {
  categories = CATEGORIES

  async load(): Promise<GraphData> {
    const base = layoutGraph({ nodes: RAW_NODES, edges: RAW_EDGES } as RawGraph, this.categories)
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) {
        const saved = JSON.parse(raw) as { nodes?: GraphNode[]; edges?: GraphEdge[] }
        const ids = new Set(base.nodes.map((n) => n.id))
        const nodes = (saved.nodes ?? []).filter((n) => n && n.id && !ids.has(n.id) && Array.isArray(n.position))
        nodes.forEach((n) => ids.add(n.id))
        const edges = (saved.edges ?? []).filter((e) => e && ids.has(e.source) && ids.has(e.target))
        return { nodes: [...base.nodes, ...nodes], edges: [...base.edges, ...edges] }
      }
    } catch { /* storage unavailable or corrupt: start clean */ }
    return base
  }

  saveUserContent(graph: GraphData) {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        nodes: graph.nodes.filter((n) => n.userCreated),
        edges: graph.edges.filter((e) => e.userCreated),
      }))
    } catch { /* ignore */ }
  }
}

export const repository: GraphRepository = new LocalGraphRepository()
