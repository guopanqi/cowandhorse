# Milestones

## M0 — Foundation

Implemented:

- Vite + Three.js project
- stable module structure
- game bootstrap and state machine
- responsive renderer
- HTML/CSS presentation layer
- automated build verification
- GitHub Pages deployment

## M1 — Playable stealth loop

Implemented:

- procedural office
- local third-person camera
- player movement and sprint
- standing / crouching stance
- height-aware line of sight
- collision generated from visible scene geometry
- 17:59:50 preparation phase with workstation movement boundary
- office activity routines instead of generic patrol loops
- suspicion meter
- chase and recovery
- visible cone that gradually changes from amber to red
- elevator extraction
- time / energy resources
- caught -> overtime encounter
- restartable results

## M2 — Overtime challenge framework

Implemented:

- MinigameManager
- scored minigame results
- structured time / energy penalties
- minigame assignment through NPC data
- Quick Sync: extract the real action item from management speech
- Version Hunt: infer the correct file from name, time and notes

## M3 — Level design and encounter pass

Implemented:

- three distinct escape routes
  - west cubicle route: slow, low cover, crouch-oriented
  - central route: shortest, exposed, timing/sprint-oriented
  - east meeting route: glass sight lines, manager-routine reading
- deliberate standing-vs-crouching cover heights
- tall cabinets and corners for chase line-of-sight breaks
- route-specific NPC office routines
- semantic office activities: inspect, print, sit, tea, read, meeting
- world-space activity bubbles
- data-driven one-shot routine interrupts
- cinematic catch sequence
  - controls lock
  - NPC closes distance
  - camera pushes in
  - shoulder-tap pose
  - speech bubble
  - transition to overtime minigame
- final elevator encounter
  - calling the elevator takes time
  - elevator doors visibly open
  - extraction call triggers a boss interruption route
  - player can retreat to cover while waiting
- improved HUD route and extraction feedback
- old generic patrol system removed
- old shallow Logo Bigger minigame removed

M3 should now be treated as the first full level-design baseline to playtest and tune, not as a finished balance pass.

## M4 — Art pipeline

Next:

- Blender modular office kit
- shared palette/material strategy
- GLB asset loading pipeline
- modular base character
- authored crouch / walk / office-action animations
- shoulder-tap animation
- Mixamo/custom animation experiments
- lighting and baked-light tests
- visual identity pass

## M5 — Content expansion

- preparation interactions
- distractions
- items
- hiding spots
- coworker assistance
- more NPC roles
- additional overtime minigames
- additional office layouts
