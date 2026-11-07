import { CATEGORIES, RAW_EDGES, RAW_NODES } from '../data/dataset'
import { layoutGraph } from './layout'
import type { CategoryId, CategoryMeta, Evidence, GraphData, GraphEdge, GraphNode, RawGraph, RawNode, RelationType } from './types'

/** Any file in src/data named universe*.ts can export EXTRA_NODES / EXTRA_EDGES tuples; they are merged in.
 *  This is how the demonstration graph grows without touching code. */
type NodeTuple = [string, string, string, number, string]
type EdgeTuple = [string, string, RelationType, Evidence, string]
const packs = import.meta.glob<{ EXTRA_NODES?: NodeTuple[]; EXTRA_EDGES?: EdgeTuple[] }>('../data/universe*.ts', { eager: true })

function extraGraph(): { nodes: RawNode[]; edges: GraphEdge[] } {
  const nodes: RawNode[] = []
  const edges: GraphEdge[] = []
  let n = 0
  Object.values(packs).forEach((m) => {
    ;(m.EXTRA_NODES ?? []).forEach(([id, label, category, importance, description]) => {
      nodes.push({ id, label, category: category as CategoryId, importance, description })
    })
    ;(m.EXTRA_EDGES ?? []).forEach(([source, target, type, evidence, description]) => {
      edges.push({ id: 'x' + ++n, source, target, type, evidence, description })
    })
  })
  return { nodes, edges }
}

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
    const extra = extraGraph()
    const known = new Set(RAW_NODES.map((n) => n.id))
    const nodes = [...RAW_NODES, ...extra.nodes.filter((n) => !known.has(n.id))]
    const ids = new Set(nodes.map((n) => n.id))
    const edges = [...RAW_EDGES, ...extra.edges.filter((e) => ids.has(e.source) && ids.has(e.target) && e.source !== e.target)]
    const base = layoutGraph({ nodes, edges } as RawGraph, this.categories)
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
