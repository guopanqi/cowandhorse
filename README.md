# Cow and Horse

A small 3D office stealth-comedy game built with Three.js.

## Core fantasy

It is 18:00. Get out of the office without being caught by someone who can give you more work.

The current playable slice includes:

- 10-second pre-escape phase with limited movement around your workstation
- third-person office traversal
- standing, crouching and sprinting
- three different escape routes
- height-aware cover and line of sight
- NPC office routines instead of generic guard patrols
- suspicion, chase, lost-target recovery and catch sequences
- overtime minigames
- time and energy as failure resources
- timed elevator extraction

## Engineering principle

**Simplify implementations, not architecture.**

The current build uses procedural low-poly office assets, simple height-aware box collision and scripted office routines. These sit behind stable modules so they can later be replaced by GLB assets, richer animation, BVH/capsule collision, navmesh/pathfinding, inventory and more advanced AI without rewriting the game loop.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/MILESTONES.md](docs/MILESTONES.md).

## Local development

```bash
npm install
npm run dev
```

Controls:

- `WASD` / arrow keys: move
- `Shift`: sprint
- `C`: crouch / stand
- `R`: restart after win/failure

## Current level grammar

- **West / cubicles** — slower route with repeated low cover; crouching is useful.
- **Center / main aisle** — fastest route but exposed to long sight lines and the boss.
- **East / meeting rooms** — medium route where glass walls and the manager's routine matter.

## Stack

- Three.js
- Vite
- HTML/CSS UI overlays
- GitHub Actions + GitHub Pages
