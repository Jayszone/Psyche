import { useStore } from '../state/store'

/** What is currently relevant: the focused node, its neighbours and the active route. Memoised per change. */
export interface FocusInfo {
  focusId: string | null
  neighbors: Set<string>
  /** Neighbours of neighbours: a softer second ring so the local subgraph reads as a region. */
  ring2: Set<string>
  routeNodes: Map<string, number>
  routeEdges: Set<string>
  journey: boolean
}

let key = ''
let info: FocusInfo = { focusId: null, neighbors: new Set(), ring2: new Set(), routeNodes: new Map(), routeEdges: new Set(), journey: false }
let adjVersion = -1
let adj = new Map<string, string[]>()

export function getFocus(): FocusInfo {
  const st = useStore.getState()
  const k = [st.selectedId, st.hoveredId, st.graphVersion, st.mode, st.routeIdx, st.drag?.source ?? ''].join('|')
  if (k === key) return info
  key = k
  if (adjVersion !== st.graphVersion) {
    adjVersion = st.graphVersion
    adj = new Map()
    st.graph.edges.forEach((e) => {
      ;(adj.get(e.source) ?? adj.set(e.source, []).get(e.source)!).push(e.target)
      ;(adj.get(e.target) ?? adj.set(e.target, []).get(e.target)!).push(e.source)
    })
  }
  const focusId = st.mode === 'journey' ? st.selectedId : st.selectedId ?? st.hoveredId
  const neighbors = new Set<string>(focusId ? adj.get(focusId) ?? [] : [])
  const ring2 = new Set<string>()
  neighbors.forEach((n) => (adj.get(n) ?? []).forEach((m) => { if (m !== focusId && !neighbors.has(m)) ring2.add(m) }))
  const route = st.mode === 'journey' ? st.routes[st.routeIdx] : null
  const routeNodes = new Map<string, number>()
  route?.nodeIds.forEach((id, i) => routeNodes.set(id, i))
  info = { focusId, neighbors, ring2, routeNodes, routeEdges: new Set(route?.edgeIds ?? []), journey: !!route }
  return info
}
