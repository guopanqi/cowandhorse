# Milestones

## M0 — Foundation
Implemented: Vite/Three.js runtime, modular game loop, CI verification and GitHub Pages.

## M1 — Playable stealth loop
Implemented: movement, crouch, sprint, height-aware cover, obstacle-clipped vision, office routines, suspicion/chase/recovery, capture sequence, time/energy and extraction.

## M2 — Overtime challenges
Implemented: MinigameManager, Quick Sync action-item deduction, Version Hunt, scored time penalties.

## M3 — Level design baseline
Implemented: multi-route office stealth layout, safe observation islands, overlapping office routines, chase sight-breaks, elevator finale and mobile controls.

## M3.5 — Graybox design environment
Implemented:

- JSON level schema as the single source of truth
- DataDrivenOfficeBuilder
- rotated collision support
- in-game Play / Edit mode
- 3D selection + move / rotate controls
- office prefab palette
- editable prefab dimensions
- navigation node / edge editing
- NPC routine node editing
- gameplay interaction markers
- live shared LevelValidator
- browser drafts
- JSON import / export
- duplicate / load / revert
- direct GitHub publishing
- published level registry
- recent playtest trail overlays
- CI validation of every published level
- removal of legacy code-authored level layout

## M4 — Art pipeline
Next:

- modular Blender / GLB office kit
- shared materials and texture strategy
- rigged modular characters
- authored walk / crouch / office-action / shoulder-tap animation
- GLB prefab mapping without changing level JSON
- lighting and visual identity pass

## M5 — Office stealth verbs

- fake work as social camouflage
- toilets / rooms as hiding spaces
- distractions and remote office events
- coworker target transfer / decoy behaviors
- preparation items and messages
- richer office-state consequences
- additional encounters and levels
