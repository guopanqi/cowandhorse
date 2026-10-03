# Architecture

## Principle

Cow and Horse is intentionally small, but the project should not be structured as a disposable prototype.

The rule is:

> Simplify implementations, not architecture.

The first playable build may use procedural geometry, simple AABB collision and scripted office routines, but those implementations live behind stable game-facing modules so they can later be replaced by authored GLB scenes, BVH collision, navmesh movement, richer animation and more sophisticated AI.

## Runtime structure

```text
Game
├─ Renderer
├─ Input
├─ GameClock
├─ ResourceSystem
├─ EncounterSystem
├─ MinigameManager
└─ OfficeLevel
   ├─ OfficeBuilder
   │  └─ CollisionWorld
   ├─ PlayerController
   │  └─ CharacterVisual
   └─ NpcAgent
      ├─ OfficeRoutine
      ├─ VisionSensor
      └─ CharacterVisual
```

Presentation remains separate:

```text
FollowCamera
VisionConeVisual
Hud
```

## World and collision

Visual office geometry and collision are created from the same source.

`OfficeBuilder.box(...)` can register a collider at the same transform and size as the visible mesh. This prevents the old failure mode where manually maintained collision rectangles drift away from what the player sees.

A collider stores:

- X/Z footprint
- min/max world height
- whether it blocks movement
- whether it blocks sight

This allows different physical meanings:

- wall: blocks movement and sight
- glass: blocks movement, not sight
- desk: blocks movement and low sight lines
- cubicle partition: does not need to block walking separately, but blocks sight at its actual height
- monitor: can interrupt a narrow sight line without becoming a floor obstacle

Later, this module can be replaced by BVH/capsule collision while preserving the `moveAndResolve` and sight-query responsibilities.

## Player stance

`PlayerController` owns stance state.

Current stances:

- standing: normal movement, eye height 1.68m
- crouched: slower movement, eye height 0.82m
- sprinting: standing only, faster but easier to detect

Vision is tested between NPC eye position and player eye position in 3D. Therefore crouching only helps when scene geometry is actually tall enough to cover the lowered sight line.

The same stance system can later drive authored crouch animations and capsule height changes.

## NPC behavior

NPCs are not modeled as generic patrol guards.

Each NPC owns an `OfficeRoutine`: a sequence of semantic office nodes such as:

- inspect a workstation
- sit at a desk
- print documents
- stand in a meeting room
- move between office areas

A node contains a target position, dwell time, facing and activity type.

`NpcAgent` combines routine behavior with stealth states:

```text
routine
  ↓ partial detection
suspicious
  ↓ full detection
chase
  ↓ lose line of sight for several seconds
suspicious
  ↓ detection decays
routine
```

Catching the player occurs through physical proximity during chase, not immediately when the detection meter fills.

Later, `OfficeRoutine` can be backed by schedules, navmesh movement, animation state machines or authored behavior graphs without changing the encounter system.

## Vision

`VisionSensor` is responsible for the actual perception test:

1. distance
2. horizontal field-of-view angle
3. 3D line-of-sight against height-aware colliders

`VisionConeVisual` only renders readable player feedback. Its geometry is built around the same forward axis used by the sensor, and its color interpolates from amber to red as detection rises.

Future sensors can add hearing, distraction memory, search areas and social visibility without changing the player or encounter interfaces.

## Preparation phase

17:59:50–18:00 is a distinct game phase.

The player can move, crouch and reposition, but `PlayerController` is constrained to a small data-defined `prepZone` around the workstation.

Later this phase can contain:

- grabbing items
- saving files
- messaging coworkers
- creating distractions
- preparing excuses

The movement boundary is therefore content data, not a hard-coded special case.

## Encounters and minigames

Detection does not directly cause game over.

A successful chase catch starts an overtime encounter through `EncounterSystem`.

NPC configuration selects a registered minigame by id. The office runtime does not know the minigame implementation.

Every minigame follows a small lifecycle:

```text
mount(context)
update(dt)
unmount()
```

This currently supports Logo Bigger and Quick Sync and can expand to file searching, spreadsheet work, slide editing, meeting survival and other office-comedy interactions.

## Data-driven level content

`src/data/officeLevel.js` currently defines:

- player spawn
- preparation zone
- extraction
- NPC role and penalties
- perception values
- chase tuning
- office routine nodes
- minigame mapping

The renderer and gameplay systems consume this data rather than embedding character-specific rules.

## Replacement roadmap

Current implementation -> later implementation:

- procedural boxes -> modular Blender / GLB office kit
- primitive people -> rigged GLB characters
- pose transforms -> animation clips / animation state machine
- AABB movement -> capsule + BVH collision
- direct office-node movement -> navmesh/pathfinding
- simple routine list -> schedules / authored behavior graph
- basic sight -> sight + hearing + distraction/search memory

The important constraint is that these upgrades replace modules rather than rewrite the game loop.
