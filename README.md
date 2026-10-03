# Cow and Horse

A small 3D office stealth-comedy game built with Three.js.

## Core fantasy

It is 18:00. Get out of the office without being caught by someone who can give you more work.

The first playable slice keeps the content deliberately small while using the same architecture intended for later versions:

- 10-second pre-escape countdown
- third-person office traversal
- data-driven NPC patrol routes
- visible vision cones and detection
- work encounters instead of instant game-over
- pluggable overtime minigames
- time and energy as failure resources
- extraction at the elevator

## Engineering principle

**Simplify implementations, not architecture.**

Phase 1 uses procedural low-poly office assets, waypoint patrols and simple collision. These are behind stable modules so they can later be replaced by GLB assets, richer animation, navmesh/pathfinding, more advanced sensing, inventory and additional minigames without rewriting the game loop.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/MILESTONES.md](docs/MILESTONES.md).

## Local development

```bash
npm install
npm run dev
```

Controls:

- `WASD` / arrow keys: move
- `Shift`: sprint
- `R`: restart after win/failure

## Stack

- Three.js
- Vite
- HTML/CSS UI overlays

No 3D asset dependency is required for the first slice.
