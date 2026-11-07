# Psyche

*Everything is connected. Find out how.*

Psyche is an interactive 3D universe of events and ideas. Pick any two events and it traces a chain of
possible relationships between them: a luminous thread you can travel along, step by step.

This is the **first frontend prototype**. It runs on a small, curated **mock** knowledge graph with
deterministic pathfinding. There is no AI backend yet. Every relationship is an illustrative hypothesis,
not a research finding, and the interface says so.

## Run it

Requires Node 20 or newer.

```bash
npm install
npm run dev
```

Open the address Vite prints (usually http://localhost:5173).

```bash
npm run build      # type-check and production build into dist/
npm run preview    # serve the production build
npm run typecheck
```

Add `?debug` to the URL to expose `window.__psyche` (store, projection, camera) for testing.

## What you can do

| Goal | How |
| --- | --- |
| Enter the universe | Scroll, click **Enter the universe**, search, or press Enter |
| Orbit, zoom | Drag; scroll or pinch; arrow keys and `+` `-` |
| Focus an event | Click a star, search for it, or click a constellation name |
| Search | The search box (`/` focuses it). Typing an unknown name offers **Add as a new event** |
| Trace a connection | Pick a start and a destination, then **Trace connection**, or use a **Try** shortcut |
| Journey | Scroll, `←` `→`, or the transport buttons. Play, pause, restart, **Overview**, exit |
| Alternative routes | **Route 1 / 2 / 3** buttons on the journey card |
| Drag to connect | Hover or select a star, drag its small handle onto another star, release |
| Return | **Universe** in the breadcrumb, **Reset view**, or `Esc` |

Drag-to-connect never invents an explanation. On release you can trace an existing chain (if the dataset has
one) or add a clearly labelled **user-defined** link. If the dataset has no chain, it says so.

### Reading the threads

| Thread | Meaning |
| --- | --- |
| Continuous | Well supported (in the mock data) |
| Dashed | Plausible but uncertain |
| Faint, intermittent | Hypothetical |
| Dotted, neutral | Added by you; not verified |

The labels are **illustrative, not calibrated probabilities.**

## Architecture

```
src/
  data/dataset.ts        Mock nodes, edges, categories, demo pairs. Replace this.
  graph/                 Pure TypeScript. No Three.js, no React.
    types.ts             GraphNode, GraphEdge, FoundPath
    repository.ts        GraphRepository interface + local implementation (+ localStorage for user content)
    layout.ts            Deterministic constellation layout for nodes without positions
    pathfinding.ts       Evidence-weighted Dijkstra and Yen's k-shortest routes
    journey.ts           Route geometry (curves, camera framing) and screen-reader narration
    geometry.ts          Edge arcs shared by the renderer and the journey
    search.ts            Event search
  state/store.ts         Zustand: mode, selection, routes, journey sequencing, user content
  three/                 React Three Fiber renderer
    cameraController.ts  Damped orbit camera with cancellable cinematic flights (plain TS)
    RigAndInput.tsx      Camera update, pointer input, screen-space projection mirror
    NodesLayer.tsx       All events in one instanced, shader-drawn draw call
    EdgesLayer.tsx       All relationships as one line-segment mesh; evidence sets the dash pattern
    JourneyLayer.tsx     Revealed tube, travelling particles, progress spring
    Sky, Starfield, FocalBody
  ui/                    HTML overlays (accessible, keyboard operable)
```

Key decisions:

- **Graph logic is independent of rendering.** Swap `GraphRepository` for a service that returns `{nodes, edges}`
  (positions optional) and nothing else changes. An AI service can also return a ready `FoundPath`.
- **One camera controller, imperative.** React state decides *what* to look at; the controller owns *how* the
  camera moves. Flights are interpolated, eased and cancel on user input. There are no teleports.
- **Overlays read a mirrored projection**, written once per frame, so labels and the connect handle track
  stars without re-rendering React every frame. Label collisions are resolved greedily by priority.
- **Positions are stable.** Layout is a pure function of the data. Only brightness animates.
- **No post-processing.** Glow is additive, shader-drawn sprites, which keeps the cost low.
- **Quality**: `low / medium / high` set pixel ratio and star count, and a performance monitor lowers
  resolution when frames drop. **Reduce motion** (also read from the OS) shortens flights and stops drift.
- **No WebGL?** A text version of the same data and pathfinding is shown instead.

## Mocked or limited

- All knowledge is a hand-written mock dataset (49 events, 64 relationships). References are placeholders.
- "Evidence" labels are fixed tags, not computed. Route ranking uses them only as weights.
- New events and your links are saved in this browser's `localStorage` only.
- Nothing is sent anywhere. There is no backend.
- Tested in headless Chromium with software rendering. Real-GPU frame rates are not yet measured.

## For the intelligence phase

1. Implement `GraphRepository` against a real service (graph retrieval and generation).
2. Have it return per-edge evidence with real references, and let `findPaths` weight by them.
3. Replace the "add event" stub with a call that proposes links for a new node.
4. Add an explanation endpoint for the journey card's narration.
