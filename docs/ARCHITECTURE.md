# Architecture

## Principle

> Simplify implementations, not architecture.

The project treats **level data as the source of truth**. Visual geometry, collision, navigation, NPC routines, editor handles and CI validation all consume the same JSON level.

## Runtime

```text
public/levels/*.json
        ↓
    LevelLoader
        ↓
       Game
        ↓
   OfficeLevel
   ├─ DataDrivenOfficeBuilder
   │  └─ CollisionWorld
   ├─ NavigationGraph
   ├─ PlayerController
   ├─ NpcAgent
   │  ├─ OfficeRoutine
   │  └─ VisionSensor
   └─ Extraction / Events
```

Presentation remains separate:

```text
FollowCamera
VisionConeVisual
WorldBubbleLayer
Hud
MobileControls
```

## Editor runtime

```text
EditorSession
├─ current mutable level JSON
├─ local draft storage
├─ import / export
└─ GitHub publishing

EditorController
├─ OrbitControls
├─ TransformControls
├─ environment selection
├─ navigation nodes / links
├─ NPC routine handles
├─ interaction handles
├─ inspector
└─ live LevelValidator

PlaytestRecorder
└─ recent local player trails
```

Play and Edit never maintain separate level formats. Switching from Edit to Play destroys the previous OfficeLevel and rebuilds the runtime from the current EditorSession JSON.

## Level schema

A level contains:

- metadata: id / name / schemaVersion
- environment prefabs
- player spawn and prep zone
- extraction configuration
- navigation nodes and edges
- NPC configuration and office routines
- one-shot events
- gameplay interaction markers

Environment objects are semantic prefabs such as `desk`, `tallCover`, `glassRoom`, `printer`, `wall` and `elevator`.

This means a later GLB art pass can replace prefab rendering without changing level files.

## Geometry and collision

`DataDrivenOfficeBuilder` creates the whitebox and registers colliders from the same object data.

`CollisionWorld` supports rotated boxes. The same collision world is used by player movement, NPC path validation, runtime navigation, line of sight, projected vision-cone clipping and editor validation.

## Stealth

Player stance controls eye height. Vision uses 3D line of sight, so low cover can hide a crouched player while still exposing a standing player.

`VisionConeVisual` samples the collision world and clips the visible cone against actual sight blockers.

## Navigation

NPC routines describe semantic destinations and actions, not raw direct movement:

```text
OfficeRoutine intent
        ↓
NavigationGraph / A*
        ↓
NpcAgent movement
```

The graph is authored in the same level JSON and editable in the graybox tool.

## Validation

`src/editor/LevelValidator.js` is shared by the browser editor and CI.

It checks blocked navigation edges, spawn/extraction overlap, reachability, interaction placement, NPC routine reachability, event reachability and broken references.

CI also runs `validate-stealth.mjs`, which locks crouch-cover and vision-cone semantics.

## Storage and publishing

```text
Draft: EditorSession → localStorage

Published:
EditorSession
   ↓ GitHub Contents API
public/levels/<id>.json
public/levels/index.json
   ↓
GitHub Actions
   ↓
GitHub Pages
```

Publishing is blocked while LevelValidator has errors.

## Replacement roadmap

- procedural prefab geometry → modular GLB office kit
- primitive people → rigged GLB characters
- pose transforms → animation state machine
- sampled box collision → capsule + BVH
- authored nav graph → optional generated navmesh
- simple office routine → richer schedules / behavior graph
- interaction markers → full office stealth verbs

The JSON level schema should survive these replacements.
