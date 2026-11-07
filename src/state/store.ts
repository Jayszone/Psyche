import { create } from 'zustand'
import { repository } from '../graph/repository'
import { findPaths } from '../graph/pathfinding'
import { placeNewNode } from '../graph/layout'
import { buildJourneyGeom, journeyRuntime } from '../graph/journey'
import { cameraController } from '../three/cameraController'
import { ALL_PAIRS } from '../data/pairs'
import type { CategoryId, CategoryMeta, FoundPath, GraphData, GraphEdge, GraphNode } from '../graph/types'

export type Mode = 'universe' | 'explore' | 'journey'
export type ZoomLevel = 'universe' | 'constellation' | 'focus'
export type Quality = 'low' | 'medium' | 'high'
export interface Journey { step: number; playing: boolean; overview: boolean; ready: boolean }
export interface PendingLink { a: string; b: string; pathCount: number }
export interface Toast { id: number; kind: 'info' | 'success' | 'warn'; msg: string }

const DEFAULT_VIEW = { th: 0.7, ph: 1.16, r: 225 }
const HOME = [0, 8, -4] as [number, number, number]

/** Mutable, non-reactive effects shared with the renderer. */
export const effects = {
  born: new Map<string, number>(),
  flashEdge: new Map<string, number>(),
  pointer: { x: 0, y: 0 },
}

interface Store {
  ready: boolean
  graph: GraphData
  categories: CategoryMeta[]
  nodeById: Map<string, GraphNode>
  indexOf: Map<string, number>
  graphVersion: number

  mode: Mode
  zoomLevel: ZoomLevel
  selectedId: string | null
  hoveredId: string | null
  fromId: string | null
  toId: string | null
  routes: FoundPath[]
  routeIdx: number
  journey: Journey | null
  noPath: { from: string; to: string } | null
  drag: { source: string; target: string | null } | null
  pending: PendingLink | null
  toast: Toast | null
  addDraft: string | null
  settings: { reduced: boolean; quality: Quality; hints: boolean }

  load: () => Promise<void>
  setZoomLevel: (z: ZoomLevel) => void
  enterExplore: () => void
  focusNode: (id: string, opts?: { keepJourney?: boolean }) => void
  focusCategory: (c: CategoryId) => void
  deselect: () => void
  resetCamera: () => void
  setHovered: (id: string | null) => void
  setFrom: (id: string | null) => void
  setTo: (id: string | null) => void
  trace: (from?: string, to?: string, via?: string) => void
  runDemo: (id: string) => void
  setRoute: (i: number) => void
  journeyNext: () => void
  journeyPrev: () => void
  journeyGoto: (s: number) => void
  journeyPlay: () => void
  journeyPause: () => void
  journeyRestart: () => void
  journeyOverview: (on?: boolean) => void
  exitJourney: () => void
  openAdd: (label: string | null) => void
  addNode: (label: string, category: CategoryId, description?: string) => void
  addUserEdge: (a: string, b: string, note?: string) => void
  removeUserNode: (id: string) => void
  startConnect: (source: string) => void
  setConnectTarget: (id: string | null) => void
  endConnect: (dropped: boolean) => void
  dismissPending: () => void
  showToast: (msg: string, kind?: Toast['kind']) => void
  setReduced: (v: boolean) => void
  setQuality: (q: Quality) => void
  dismissHints: () => void
}

function indexGraph(graph: GraphData) {
  return {
    nodeById: new Map(graph.nodes.map((n) => [n.id, n])),
    indexOf: new Map(graph.nodes.map((n, i) => [n.id, i])),
  }
}

let toastId = 0
let toastTimer: ReturnType<typeof setTimeout> | undefined
const prefersReduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

export const useStore = create<Store>((set, get) => {
  const toast = (msg: string, kind: Toast['kind'] = 'info') => {
    const id = ++toastId
    set({ toast: { id, kind, msg } })
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => { if (get().toast?.id === id) set({ toast: null }) }, 4200)
  }

  const persist = () => repository.saveUserContent(get().graph)

  const attachRail = () => {
    const geom = journeyRuntime.geom
    if (!geom) return
    cameraController.setRail(() => geom.railAt(journeyRuntime.t))
  }

  const startJourney = (route: FoundPath, routes: FoundPath[], routeIdx: number) => {
    const g = get().graph
    const geom = buildJourneyGeom(route, g)
    journeyRuntime.geom = geom
    journeyRuntime.t = 0
    journeyRuntime.v = 0
    cameraController.releaseRail()
    set({
      mode: 'journey', routes, routeIdx, noPath: null, selectedId: null, pending: null,
      journey: { step: 0, playing: false, overview: false, ready: false },
    })
    // Glide to the first rail pose, then hand over to the rail so the move is continuous.
    const r0 = geom.railAt(0)
    const dx = r0.pos[0] - r0.look[0], dy = r0.pos[1] - r0.look[1], dz = r0.pos[2] - r0.look[2]
    const rr = Math.hypot(dx, dy, dz)
    cameraController.flyTo({
      target: r0.look, r: rr, th: Math.atan2(dz, dx), ph: Math.acos(Math.max(-1, Math.min(1, dy / rr))), duration: prefersReduced ? 0.3 : 3.2,
      onDone: () => {
        attachRail()
        const j = get().journey
        if (j) set({ journey: { ...j, ready: true, playing: true } })
      },
    })
  }

  return {
    ready: false,
    graph: { nodes: [], edges: [] },
    categories: repository.categories,
    nodeById: new Map(),
    indexOf: new Map(),
    graphVersion: 0,

    mode: 'universe', zoomLevel: 'universe', selectedId: null, hoveredId: null,
    fromId: null, toId: null, routes: [], routeIdx: 0, journey: null, noPath: null,
    drag: null, pending: null, toast: null, addDraft: null,
    settings: { reduced: prefersReduced, quality: 'high', hints: true },

    load: async () => {
      const graph = await repository.load()
      set({ graph, ...indexGraph(graph), ready: true, graphVersion: 1 })
    },

    setZoomLevel: (z) => set({ zoomLevel: z }),

    enterExplore: () => {
      if (get().mode !== 'universe') return
      set({ mode: 'explore' })
      cameraController.flyTo({ target: [-48, 10, 14], r: 100, th: 1.15, ph: 1.12, duration: 3.6 })
    },

    focusNode: (id, opts) => {
      const n = get().nodeById.get(id)
      if (!n) return
      if (get().mode === 'universe') set({ mode: 'explore' })
      set({ selectedId: id })
      if (get().mode === 'journey' && opts?.keepJourney) return
      cameraController.releaseRail()
      cameraController.flyTo({ target: n.position, r: n.importance > 0.8 ? 15 : 11 })
    },

    focusCategory: (c) => {
      const cat = get().categories.find((x) => x.id === c)
      if (!cat) return
      if (get().mode === 'universe') set({ mode: 'explore' })
      set({ selectedId: null })
      cameraController.releaseRail()
      cameraController.flyTo({ target: cat.center, r: 50, ph: 1.15 })
    },

    deselect: () => {
      const { selectedId, nodeById, mode } = get()
      if (!selectedId) return
      set({ selectedId: null })
      if (mode === 'explore') {
        const n = nodeById.get(selectedId)
        const cat = n && get().categories.find((c) => c.id === n.category)
        if (n && cat && cameraController.goal.r < 24) cameraController.flyTo({ target: n.category === 'user' ? n.position : cat.center, r: 50 })
      }
    },

    resetCamera: () => {
      if (get().mode === 'journey') { get().journeyOverview(true); return }
      set({ selectedId: null })
      cameraController.releaseRail()
      cameraController.flyTo({ target: HOME, ...DEFAULT_VIEW, duration: 2.4 })
    },

    setHovered: (id) => { if (get().hoveredId !== id) set({ hoveredId: id }) },
    setFrom: (id) => set({ fromId: id, noPath: null }),
    setTo: (id) => set({ toId: id, noPath: null }),

    trace: (from, to, via) => {
      const a = from ?? get().fromId, b = to ?? get().toId
      if (!a || !b) { toast('Choose both a start and a destination first.', 'warn'); return }
      if (a === b) { toast('Pick two different events.', 'warn'); return }
      const g = get().graph
      const routes = findPaths(g, a, b, 3)
      set({ fromId: a, toId: b })
      if (!routes.length) {
        if (get().mode === 'universe') set({ mode: 'explore' })
        set({ noPath: { from: a, to: b }, routes: [], journey: null })
        cameraController.releaseRail()
        const A = get().nodeById.get(a)!, B = get().nodeById.get(b)!
        const mid: [number, number, number] = [(A.position[0] + B.position[0]) / 2, (A.position[1] + B.position[1]) / 2, (A.position[2] + B.position[2]) / 2]
        cameraController.flyTo({ target: mid, r: Math.min(120, Math.hypot(A.position[0] - B.position[0], A.position[1] - B.position[1], A.position[2] - B.position[2]) * 1.3 + 18) })
        return
      }
      const idx = via ? Math.max(0, routes.findIndex((r) => r.nodeIds.includes(via))) : 0
      startJourney(routes[idx], routes, idx)
    },

    runDemo: (id) => {
      const d = ALL_PAIRS.find((p) => p.id === id)
      if (d) get().trace(d.from, d.to, d.via)
    },

    setRoute: (i) => {
      const { routes } = get()
      if (!routes[i]) return
      startJourney(routes[i], routes, i)
    },

    journeyNext: () => {
      const { journey } = get(); const geom = journeyRuntime.geom
      if (!journey || !geom) return
      const next = Math.min(geom.steps, Math.floor(journeyRuntime.t + 0.02) + 1)
      set({ journey: { ...journey, step: next, playing: false } })
    },
    journeyPrev: () => {
      const { journey } = get(); if (!journey) return
      set({ journey: { ...journey, step: Math.max(0, Math.ceil(journeyRuntime.t - 0.02) - 1), playing: false } })
    },
    journeyGoto: (st) => {
      const { journey } = get(); const geom = journeyRuntime.geom
      if (!journey || !geom) return
      set({ journey: { ...journey, step: Math.max(0, Math.min(geom.steps, st)), playing: false } })
    },
    journeyPlay: () => {
      const { journey } = get(); const geom = journeyRuntime.geom
      if (!journey || !geom) return
      if (journeyRuntime.t >= geom.steps - 0.01) { journeyRuntime.t = 0; journeyRuntime.v = 0 }
      set({ journey: { ...journey, step: Math.round(journeyRuntime.t), playing: true } })
    },
    journeyPause: () => { const { journey } = get(); if (journey) set({ journey: { ...journey, playing: false, step: Math.round(journeyRuntime.t) } }) },
    journeyRestart: () => {
      const { journey } = get(); if (!journey) return
      journeyRuntime.t = 0; journeyRuntime.v = 0
      set({ journey: { ...journey, step: 0, playing: true, overview: false } })
      if (journey.overview) get().journeyOverview(false)
    },
    journeyOverview: (on) => {
      const { journey } = get(); const geom = journeyRuntime.geom
      if (!journey || !geom) return
      const next = on ?? !journey.overview
      set({ journey: { ...journey, overview: next, playing: next ? false : journey.playing, step: Math.round(journeyRuntime.t) } })
      const aim = (t: number) => {
        const p = geom.railAt(t)
        const dx = p.pos[0] - p.look[0], dy = p.pos[1] - p.look[1], dz = p.pos[2] - p.look[2]
        const rr = Math.hypot(dx, dy, dz) || 1
        return { look: p.look, rr, th: Math.atan2(dz, dx), ph: Math.acos(Math.max(-1, Math.min(1, dy / rr))) }
      }
      if (next) {
        const m = aim(geom.steps * 0.5)
        cameraController.flyTo({ target: geom.bounds.center, r: Math.min(420, Math.max(46, geom.bounds.size * 1.25)), th: m.th, ph: Math.min(1.35, m.ph), duration: 2.4 })
      } else {
        const m = aim(journeyRuntime.t)
        cameraController.flyTo({ target: m.look, r: m.rr, th: m.th, ph: m.ph, duration: 2, onDone: attachRail })
      }
    },
    exitJourney: () => {
      if (get().mode !== 'journey') return
      cameraController.releaseRail()
      journeyRuntime.geom = null
      set({ mode: 'explore', journey: null, selectedId: null })
      cameraController.flyTo({ target: HOME, ...DEFAULT_VIEW, duration: 3 })
    },

    openAdd: (label) => set({ addDraft: label }),

    addNode: (label, category, description) => {
      const { graph, categories } = get()
      const trimmed = label.trim().slice(0, 80)
      if (!trimmed) return
      if (graph.nodes.some((n) => n.label.toLowerCase() === trimmed.toLowerCase())) { toast('That event already exists.', 'warn'); return }
      const id = 'u-' + Date.now().toString(36)
      const near = get().selectedId ? get().nodeById.get(get().selectedId!)?.position : undefined
      const position = placeNewNode(graph, categories, category, id, category === 'user' ? near : undefined)
      const node: GraphNode = {
        id, label: trimmed, category, importance: 0.5, position, userCreated: true,
        description: description?.trim() || 'Added by you. No relationships have been computed for this event yet.',
        metadata: { Source: 'User-added' },
      }
      const next = { nodes: [...graph.nodes, node], edges: graph.edges }
      effects.born.set(id, performance.now())
      set({ graph: next, ...indexGraph(next), graphVersion: get().graphVersion + 1, addDraft: null })
      persist()
      get().focusNode(id)
      toast('Event added. It has no computed links yet. Drag from its handle to connect it.', 'success')
    },

    addUserEdge: (a, b, note) => {
      const { graph } = get()
      const id = 'ue-' + Date.now().toString(36)
      const edge: GraphEdge = {
        id, source: a, target: b, type: 'user-defined', evidence: 'user', userCreated: true,
        description: note?.trim() || 'A connection you added. Psyche has not verified or explained it.',
      }
      const next = { nodes: graph.nodes, edges: [...graph.edges, edge] }
      effects.flashEdge.set(id, performance.now())
      set({ graph: next, graphVersion: get().graphVersion + 1, pending: null })
      persist()
      toast('Your connection was added. It is marked as user-defined.', 'success')
    },

    removeUserNode: (id) => {
      const { graph } = get()
      const n = graph.nodes.find((x) => x.id === id)
      if (!n?.userCreated) return
      const next = { nodes: graph.nodes.filter((x) => x.id !== id), edges: graph.edges.filter((e) => e.source !== id && e.target !== id) }
      set({
        graph: next, ...indexGraph(next), graphVersion: get().graphVersion + 1, selectedId: null,
        fromId: get().fromId === id ? null : get().fromId, toId: get().toId === id ? null : get().toId,
      })
      persist()
      toast('Event removed.', 'info')
    },

    startConnect: (source) => set({ drag: { source, target: null } }),
    setConnectTarget: (id) => {
      const d = get().drag
      if (d && d.target !== id) set({ drag: { ...d, target: id } })
    },
    endConnect: (dropped) => {
      const d = get().drag
      set({ drag: null })
      if (!d) return
      if (!dropped || !d.target) { toast('Connection cancelled.', 'info'); return }
      if (d.target === d.source) { toast('An event cannot connect to itself.', 'warn'); return }
      const g = get().graph
      const direct = g.edges.some((e) => (e.source === d.source && e.target === d.target) || (e.source === d.target && e.target === d.source))
      const paths = findPaths(g, d.source, d.target, 3)
      set({ pending: { a: d.source, b: d.target, pathCount: paths.length + (direct ? 0 : 0) } })
    },
    dismissPending: () => set({ pending: null }),

    showToast: toast,
    setReduced: (v) => { cameraController.reducedMotion = v; set({ settings: { ...get().settings, reduced: v } }) },
    setQuality: (q) => set({ settings: { ...get().settings, quality: q } }),
    dismissHints: () => set({ settings: { ...get().settings, hints: false } }),
  }
})

cameraController.reducedMotion = prefersReduced
cameraController.set({ ...DEFAULT_VIEW, tx: HOME[0], ty: HOME[1], tz: HOME[2] })
