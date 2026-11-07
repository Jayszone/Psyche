import type { GraphNode } from './types'

export interface SearchHit { node: GraphNode; score: number }

/** Small deterministic scorer: prefix beats substring beats word overlap. */
export function searchNodes(nodes: GraphNode[], query: string, limit = 7): SearchHit[] {
  const q = query.trim().toLowerCase()
  if (!q) return [...nodes].sort((a, b) => b.importance - a.importance).slice(0, limit).map((node) => ({ node, score: 0 }))
  const toks = q.split(/\s+/).filter((t) => t.length > 1)
  const hits: SearchHit[] = []
  for (const node of nodes) {
    const label = node.label.toLowerCase()
    const hay = label + ' ' + node.category + ' ' + node.description.toLowerCase()
    let s = 0
    if (label.startsWith(q)) s = 100
    else if (label.includes(q)) s = 80
    else if (toks.length && toks.every((t) => label.includes(t))) s = 65
    else if (toks.length && toks.every((t) => hay.includes(t))) s = 40
    else s = toks.filter((t) => t.length > 2 && label.includes(t)).length * 12
    if (s > 0) hits.push({ node, score: s + node.importance * 5 })
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit)
}

export function hasExactLabel(nodes: GraphNode[], query: string): boolean {
  const q = query.trim().toLowerCase()
  return nodes.some((n) => n.label.toLowerCase() === q)
}
