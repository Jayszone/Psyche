# Psyche

*Everything is connected. Find out how.*

Psyche is a living universe of knowledge. Events are luminous nodes, relationships are neural filaments, and
a connection journey is a flight along the thread that links two things that seem unrelated.

This is a frontend prototype on a **mock knowledge graph** (184 events, 296 relationships, 34 categories)
with deterministic pathfinding. There is no AI backend yet. Every relationship is an illustrative hypothesis,
not a finding, and the interface says so.

## Run it

Requires Node 20 or newer.

```bash
npm install
npm run dev
```

Open the address Vite prints (usually http://localhost:5173).

```bash
npm run build        # type-check and production build into dist/
npm run preview      # serve the production build
npm run typecheck
npx tsx scripts/validate-data.ts   # check the dataset: ids, links, connectivity, demo journeys
```

Add `?debug` to the URL to expose `window.__psyche` (store, projection, camera) for testing.

## What changed in 2.0

- **The Neural Cosmos.** Edges are S-curved filaments with variable width and travelling electric impulses.
  They reveal themselves by proximity and relevance, so the web never fills the screen. Evidence classes keep distinct textures.
- **A much larger universe.** 6 regions, 34 constellations and 184 events spread over a volume you can fly through,
  above, below, behind and far away, with spiral systems at the edge of the map for scale.
- **Node hierarchy.** Major events (large, spiked, breathing), supporting events, and minor points that surface only when relevant. Distance fading and level of detail.
- **Event portals.** Select an event, or arrive at one on a journey, and artwork materialises beside it in the scene, with its title and explanation.
- **Cinematic journeys.** The camera rides a rail along the route with a look-ahead, flows continuously and eases through each event.
- **Navigation.** Orbit with inertia, right-drag pan, `W A S D` + `Q E` travel (Shift is faster), scroll to move closer, double-click to approach,
  an orientation chart, a regions menu, breadcrumbs and Home.
- **Typography.** Cormorant Garamond for display and event titles, Cinzel for the wordmark and small caps, Hanken Grotesk for the interface.

## Controls

| Goal | How |
| --- | --- |
| Enter | Scroll, **Enter the universe**, search, or Enter |
| Orbit | Drag (it keeps its momentum) |
| Pan | Right-drag, or Shift-drag |
| Travel | `W A S D` forward, left, back, right; `Q` `E` down, up; Shift for speed |
| Approach | Scroll in; double-click a star (or empty space) |
| Focus | Click a star, search, or pick a constellation name |
| Find your way | Orientation chart (click a dot), **Regions**, breadcrumbs, **Home** (`H`) |
| Trace | **Trace a connection**, or pick a **Surprising journey** |
| Journey | Scroll or `←` `→` step along; `Space` play and pause; `O` overview; routes selector; Exit |
| Connect | Hover a star, drag its handle onto another star, release |

Drag-to-connect never invents an explanation. You can trace an existing chain or add a clearly marked **user-defined** link.

### Reading the threads

| Thread | Meaning |
| --- | --- |
| Continuous | Well supported (in the mock data) |
| Dashed | Plausible but uncertain |
| Faint, intermittent | Hypothetical |
| Dotted, neutral | Added by you; not verified |

The labels are **illustrative, not calibrated probabilities.**

## Adding knowledge

The graph is plain data. Add a file `src/data/universe-<anything>.ts` exporting tuples and it is merged automatically:

```ts
export const EXTRA_NODES = [['moon-landing', 'Apollo 11 Moon landing', 'space', 0.8, 'The first crewed landing on the Moon in 1969.']]
export const EXTRA_EDGES = [['apollo-program', 'moon-landing', 'causes', 'strong', 'A decade of work culminated in the landing.']]
export const EXTRA_DEMO_PAIRS = [] // optional journeys: { id, from, to, title, blurb }
```

Node tuple: `[id, label, category, importance 0..1, description]`. Edge tuple: `[source, target, type, evidence, description]`.
Importance sets the tier: 0.78 or more is major, 0.45 or more supporting, otherwise minor. Positions are computed from the category.
Run `npx tsx scripts/validate-data.ts` after editing.

## Event imagery

`src/media/` holds the event media system.

- With no image, an **abstract procedural illustration** is generated per event (about 20 motifs, chosen by event or category) and labelled
  *conceptual artwork, not a depiction of the event*.
- To use curated art, put a file in `public/art/` and point to it in `src/media/registry.ts`: `EVENT_MEDIA['sushi-prices'] = { src: '/art/sushi.webp' }`.
  Images are loaded lazily, cached (least-recently-used textures are disposed), and fall back to the procedural art if they fail.
- An image-generation or curated-library service can fill `src` per event id. Nothing is fetched speculatively and no remote URLs are required.

## Architecture

```
src/
  data/
    dataset.ts           Categories, regions, the original 49 events, demo pairs
    universe.ts          135 more events and 232 relationships (a data pack)
    pairs.ts             Demo journeys (built in + data packs)
  graph/                 Pure TypeScript. No Three.js, no React.
    types.ts repository.ts layout.ts pathfinding.ts journey.ts geometry.ts search.ts
  state/store.ts         Zustand: mode, selection, routes, journey, user content
  three/                 React Three Fiber
    cameraController.ts  Orbit with inertia, travel, rail and cinematic flights (plain TS)
    RigAndInput.tsx      Camera update, input, screen-space projection mirror
    NodesLayer.tsx       One instanced draw call; three tiers; distance fading
    EdgesLayer.tsx       Ribbon filaments; evidence textures; impulses; relevance
    JourneyLayer.tsx     Route tube, comet and flow particles, continuous progress
    PortalLayer.tsx      Event artwork in the scene
    Atmosphere.tsx       Cluster haze, drifting dust, distant galaxies
    Sky.tsx Starfield.tsx focus.ts
  media/                 Registry, procedural art, lazy texture loader
  ui/                    Accessible HTML overlays
scripts/validate-data.ts Dataset checks
```

Key decisions:

- **Graph logic knows nothing about rendering.** Swap `GraphRepository` for a service that returns nodes and edges; positions are optional.
- **React decides what to look at, the controller decides how the camera moves.** Everything is interpolated and cancellable.
- **HTML overlays read a projection mirror** written once per frame, so labels, the handle and the portal caption track the scene without per-frame React renders.
- **Detail is earned.** Edges and minor nodes fade with distance and appear when relevant; the focused node's neighbourhood is emphasised and the rest recedes.
- **Performance.** Nodes are one instanced draw call; all edges are one mesh; atmosphere is a few dozen additive sprites; the starfield is two point layers. There is no post-processing.
  Quality (`low / medium / high`) controls pixel ratio and particle counts, and a performance monitor lowers resolution when frames drop. **Reduce motion**
  (also read from the OS) shortens flights, stops drift, inertia and impulses, and steps the journey one stop at a time.
- **No WebGL?** A text version of the same data and pathfinding is shown instead.

## Mocked or limited

- All knowledge is a hand-written mock dataset. Evidence labels are fixed tags, not computed. References are placeholders.
- Event artwork is procedural and abstract. There are no curated images yet.
- Your new events and links are saved in this browser's `localStorage` only. Nothing is sent anywhere.
- Tested in headless Chromium with software rendering. Frame rates on real GPUs have not been measured.

## For the intelligence phase

1. Implement `GraphRepository` against a real service (retrieval and generation), returning per-edge evidence and real references.
2. Let `findPaths` weight by that evidence; add an explanation endpoint for the journey narration.
3. Propose links when a user adds an event, and fill `EVENT_MEDIA[...].src` from an image service.
