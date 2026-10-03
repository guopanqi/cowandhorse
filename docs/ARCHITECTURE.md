# Architecture

## Goals

Cow and Horse is a small game, but its structure should support a larger content set without turning the first playable slice into throwaway code.

The architecture separates five concerns:

1. **Runtime** — boot, main loop, scene changes, pause/restart.
2. **World** — office scene, collision, interactable objects, extraction zones.
3. **Actors** — player and NPCs.
4. **Gameplay systems** — clock, stealth/detection, encounters, resources, minigames.
5. **Presentation** — Three.js visuals, camera, UI, audio.

Game rules should not depend directly on a specific 3D model.

## Dependency direction

```text
App
 └─ Game
    ├─ SceneManager
    ├─ GameClock
    ├─ ResourceSystem
    ├─ EncounterSystem
    ├─ MinigameManager
    └─ OfficeLevel
       ├─ PlayerController
       ├─ NpcManager
       │  └─ NpcAgent
       │     ├─ PatrolBehavior
       │     └─ VisionSensor
       ├─ CollisionWorld
       └─ ExtractionZone
```

Presentation modules observe state and render it. They do not own core rules.

## Data-driven content

Level-specific content lives in `src/data/`:

- office layout
- spawn points
- NPC patrol paths
- NPC roles and penalties
- level timing
- minigame registrations

Later, these files can be moved to JSON without changing the runtime interfaces.

## Replaceable implementations

### Character visuals

Phase 1: procedural primitive-based low-poly characters.

Later: GLB characters and animation clips.

Both use the same `CharacterVisual` interface.

### Collision

Phase 1: simple axis-aligned blockers suitable for an office.

Later: BVH/capsule collision against authored GLB geometry.

Both expose `moveAndResolve(position, delta)`.

### NPC movement

Phase 1: waypoint patrol.

Later: navmesh/pathfinding and richer schedules.

NPC logic still targets destinations through `NpcAgent`.

### Stealth sensing

Phase 1: distance + angle + blocker ray test.

Later: hearing, suspicion memory, search state and distractions.

These extend `VisionSensor` / sensor components instead of rewriting NPCs.

### Minigames

Every overtime challenge implements a common lifecycle:

```text
mount(context)
update(dt)
unmount()
```

The office game never needs to know the internal mechanics.

## Game state

The authoritative state lives in the Game instance:

- phase: prep / escape / minigame / success / failure
- in-game time
- energy
- accumulated overtime
- current encounter
- player/NPC state

UI reads this state.

## Phase 1 scope

The first playable slice is intentionally small:

- one office
- one extraction target
- two patrol NPCs
- one boss NPC
- one overtime minigame
- procedural environment and characters

The architecture already reserves expansion points for:

- inventory
- multiple levels
- authored 3D assets
- animation
- distractions
- hiding spots
- social interactions
- additional minigames
- save/progression
