import { CATEGORIES, DEMO_PAIRS, RAW_EDGES, RAW_NODES } from '../src/data/dataset'
import { EXTRA_DEMO_PAIRS, EXTRA_EDGES, EXTRA_NODES } from '../src/data/universe'
import { findPaths } from '../src/graph/pathfinding'
import type { CategoryId, GraphData, GraphEdge, GraphNode } from '../src/graph/types'

let failures = 0
const fail = (msg: string) => { failures++; console.log('  FAIL: ' + msg) }
const warn = (msg: string) => console.log('  warn: ' + msg)
const head = (t: string) => console.log('\n== ' + t)

// Assemble the merged graph
const nodes: GraphNode[] = [
  ...RAW_NODES.map((n) => ({ ...n, position: n.position ?? ([0, 0, 0] as [number, number, number]) })),
  ...EXTRA_NODES.map(([id, label, category, importance, description]) => ({
    id, label, category: category as CategoryId, importance, description, position: [0, 0, 0] as [number, number, number],
  })),
]
const edges: GraphEdge[] = [
  ...RAW_EDGES.map((e) => ({ ...e })),
  ...EXTRA_EDGES.map(([source, target, type, evidence, description], i) => ({ id: `x${i + 1}`, source, target, type, evidence, description })),
]
const graph: GraphData = { nodes, edges }
const catOf = new Map(nodes.map((n) => [n.id, n.category]))
const validCats = new Set(CATEGORIES.filter((c) => c.id !== 'user').map((c) => c.id as string))

head('Totals')
console.log(`  nodes: ${RAW_NODES.length} existing + ${EXTRA_NODES.length} new = ${nodes.length}`)
console.log(`  edges: ${RAW_EDGES.length} existing + ${EXTRA_EDGES.length} new = ${edges.length}`)

head('Nodes per category')
const perCat = new Map<string, number>()
nodes.forEach((n) => perCat.set(n.category, (perCat.get(n.category) ?? 0) + 1))
for (const c of validCats) {
  const k = perCat.get(c) ?? 0
  console.log(`  ${c.padEnd(15)} ${k}`)
  if (k < 3) fail(`category ${c} has ${k} nodes`)
}
for (const c of perCat.keys()) if (!validCats.has(c)) fail(`unknown category ${c}`)

head('Ids and labels')
const ids = new Set<string>()
const labels = new Set<string>()
for (const n of nodes) {
  if (ids.has(n.id)) fail(`duplicate id ${n.id}`)
  ids.add(n.id)
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(n.id)) fail(`id not kebab-case: ${n.id}`)
  const l = n.label.toLowerCase()
  if (labels.has(l)) fail(`duplicate label ${n.label}`)
  labels.add(l)
}
console.log(`  ${ids.size} unique ids, ${labels.size} unique labels`)

head('Edges')
const seen = new Set<string>()
const deg = new Map<string, number>(nodes.map((n) => [n.id, 0]))
for (const e of edges) {
  if (!ids.has(e.source)) fail(`dangling source ${e.source} in ${e.id}`)
  if (!ids.has(e.target)) fail(`dangling target ${e.target} in ${e.id}`)
  if (e.source === e.target) fail(`self-loop ${e.id} ${e.source}`)
  const k = `${e.source}>${e.target}`
  if (seen.has(k)) fail(`duplicate pair ${k}`)
  seen.add(k)
  if (seen.has(`${e.target}>${e.source}`)) warn(`reverse pair also present: ${k}`)
  deg.set(e.source, (deg.get(e.source) ?? 0) + 1)
  deg.set(e.target, (deg.get(e.target) ?? 0) + 1)
}
const low = nodes.filter((n) => (deg.get(n.id) ?? 0) < 2)
low.forEach((n) => fail(`node ${n.id} has ${deg.get(n.id)} incident edges`))
const hubs = nodes.filter((n) => n.importance >= 0.85).map((n) => `${n.id}(${deg.get(n.id)})`)
console.log(`  hubs (importance >= 0.85): ${hubs.join(', ')}`)
const dist = [...deg.values()].sort((a, b) => a - b)
console.log(`  degree min ${dist[0]}, median ${dist[Math.floor(dist.length / 2)]}, max ${dist[dist.length - 1]}; nodes with exactly 2: ${dist.filter((d) => d === 2).length}`)

head('Connectivity')
const adj = new Map<string, string[]>(nodes.map((n) => [n.id, []]))
edges.forEach((e) => { adj.get(e.source)?.push(e.target); adj.get(e.target)?.push(e.source) })
const comp = new Set<string>()
const stack = [nodes[0].id]
while (stack.length) {
  const u = stack.pop()!
  if (comp.has(u)) continue
  comp.add(u)
  for (const v of adj.get(u) ?? []) if (!comp.has(v)) stack.push(v)
}
console.log(`  reachable from ${nodes[0].id}: ${comp.size}/${nodes.length}`)
if (comp.size !== nodes.length) fail('graph is not a single connected component: ' + nodes.filter((n) => !comp.has(n.id)).map((n) => n.id).join(', '))

head('Descriptions (new nodes must be 60-140 chars)')
let minL = 1e9, maxL = 0
for (const n of EXTRA_NODES) {
  const L = n[4].length
  minL = Math.min(minL, L); maxL = Math.max(maxL, L)
  if (L < 60 || L > 140) fail(`node ${n[0]} description length ${L}`)
}
console.log(`  new node descriptions: ${minL}..${maxL}`)
let eMin = 1e9, eMax = 0
for (const e of EXTRA_EDGES) {
  const L = e[4].length
  eMin = Math.min(eMin, L); eMax = Math.max(eMax, L)
  if (L < 30 || L > 160) warn(`edge ${e[0]}>${e[1]} description length ${L}`)
  if (e[4].includes('"')) fail(`edge ${e[0]}>${e[1]} has double quote`)
}
console.log(`  new edge descriptions: ${eMin}..${eMax}`)

head('Importance distribution (new nodes)')
const imp = EXTRA_NODES.map((n) => n[3])
const major = imp.filter((v) => v >= 0.8).length
const supp = imp.filter((v) => v >= 0.45 && v < 0.8).length
const minor = imp.filter((v) => v < 0.45).length
const pct = (k: number, t: number) => `${((100 * k) / t).toFixed(0)}%`
console.log(`  major >=0.8: ${major} (${pct(major, imp.length)}), supporting 0.45-0.8: ${supp} (${pct(supp, imp.length)}), minor <0.45: ${minor} (${pct(minor, imp.length)})`)
imp.forEach((v, i) => { if (v < 0.2 || v > 0.95) fail(`importance out of range ${EXTRA_NODES[i][0]}`) })

head('Types and evidence (new edges)')
const count = <T extends string>(xs: T[]) => xs.reduce<Record<string, number>>((m, x) => ((m[x] = (m[x] ?? 0) + 1), m), {})
const types = count(EXTRA_EDGES.map((e) => e[2]))
const evs = count(EXTRA_EDGES.map((e) => e[3]))
const T = EXTRA_EDGES.length
console.log('  types: ' + Object.entries(types).map(([k, v]) => `${k} ${v}`).join(', '))
console.log('  evidence: ' + Object.entries(evs).map(([k, v]) => `${k} ${v} (${pct(v, T)})`).join(', '))
const allowedTypes = new Set(['causes', 'drives', 'influences', 'enables', 'constrains', 'correlates'])
EXTRA_EDGES.forEach((e) => { if (!allowedTypes.has(e[2])) fail(`bad type ${e[2]}`); if (!['strong', 'plausible', 'speculative'].includes(e[3])) fail(`bad evidence ${e[3]}`) })

head('Cross-category edges')
const crossNew = EXTRA_EDGES.filter((e) => catOf.get(e[0]) !== catOf.get(e[1])).length
const crossAll = edges.filter((e) => catOf.get(e.source) !== catOf.get(e.target)).length
console.log(`  new: ${crossNew}/${T} (${pct(crossNew, T)}), all: ${crossAll}/${edges.length} (${pct(crossAll, edges.length)})`)
if (crossNew / T < 0.45) fail('less than 45% of new edges are cross-category')
const existingIds = new Set(RAW_NODES.map((n) => n.id))
const touching = EXTRA_EDGES.filter((e) => existingIds.has(e[0]) || existingIds.has(e[1])).length
console.log(`  new edges touching an existing node: ${touching}`)
for (const n of RAW_NODES) {
  const added = EXTRA_EDGES.filter((e) => e[0] === n.id || e[1] === n.id).length
  if (added === 0) warn(`existing node ${n.id} gained no new edges`)
}

head('Demo pairs')
const check = (id: string, from: string, to: string, strict: boolean) => {
  if (!ids.has(from) || !ids.has(to)) { fail(`demo ${id}: unknown endpoint`); return }
  const routes = findPaths(graph, from, to, 3)
  const label = `${id} (${from} -> ${to}, ${catOf.get(from)} -> ${catOf.get(to)})`
  if (!routes.length) { fail(`demo ${label}: no route`); return }
  console.log(`  ${label}: ${routes.length} route(s)`)
  routes.forEach((r, i) => console.log(`    #${i + 1} steps=${r.edgeIds.length} directed=${r.directed} weakest=${r.weakest}: ${r.nodeIds.join(' > ')}`))
  if (strict) {
    const r = routes[0]
    if (!r.directed) fail(`demo ${id}: first route not directed`)
    if (r.edgeIds.length < 4 || r.edgeIds.length > 9) fail(`demo ${id}: first route has ${r.edgeIds.length} steps`)
    if (catOf.get(from) === catOf.get(to)) fail(`demo ${id}: same category`)
    if (routes.length < 2) warn(`demo ${id}: only one route`)
  }
}
DEMO_PAIRS.forEach((p) => check(p.id, p.from, p.to, false))
EXTRA_DEMO_PAIRS.forEach((p) => check(p.id, p.from, p.to, true))
const dpIds = [...DEMO_PAIRS, ...EXTRA_DEMO_PAIRS].map((p) => p.id)
if (new Set(dpIds).size !== dpIds.length) fail('duplicate demo pair ids')
if (EXTRA_DEMO_PAIRS.length < 7 || EXTRA_DEMO_PAIRS.length > 8) fail('need 7-8 extra demo pairs')

console.log(failures ? `\nVALIDATION FAILED: ${failures} problem(s)` : '\nVALIDATION PASSED')
process.exit(failures ? 1 : 0)
