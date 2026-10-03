# Cow and Horse — Agent Guide

This file contains repository-wide rules for coding agents working on this project.

Keep this file concise. Put detailed design notes in `docs/`.

## Product

Cow and Horse is a small Three.js office stealth-comedy game.

The core fantasy is:
- it is 18:00;
- the player wants to leave the office;
- managers and bosses create stealth pressure by assigning more work;
- stealth should feel readable, systemic, and specific to office life.

Prefer clear gameplay language over visual complexity.

## Architecture

- Simplify implementations, not architecture.
- Keep gameplay systems modular and replaceable.
- Do not create temporary parallel implementations for systems that already have an abstraction.
- Reuse the existing unified input, navigation, collision, interaction, and level-loading layers.
- Gameplay code must not contain separate desktop-only and mobile-only game rules.

### Level source of truth

Published level JSON under `public/levels/` is the source of truth for playable levels.

For the current level:
- use `public/levels/office-01.json`;
- load it through `LevelLoader`;
- build it through `DataDrivenOfficeBuilder`.

Do not create or maintain a second competing level definition.

If an older hard-coded level file still exists for compatibility or migration, do not treat it as authoritative.

## Mobile UI is a project invariant

Every player-facing UI or control change must work on both desktop and touch devices.

Do not treat mobile as a scaled-down desktop layout.

For every UI change:

- support portrait mobile layouts;
- preserve as much gameplay viewport as possible;
- avoid large HUD panels blocking the play area;
- respect `env(safe-area-inset-*)`;
- make tap targets large enough for thumbs;
- provide a touch equivalent for every required keyboard gameplay action;
- keep contextual actions close to the thumb area;
- do not rely on hover;
- do not rely on tiny text or precise clicking;
- test narrow portrait layouts in addition to desktop.

Current core actions:
- move;
- sprint;
- crouch / stand;
- interact.

All actions should flow through the shared `Input` abstraction.

## Stealth readability

Gameplay visibility and visual feedback must agree.

### Cover semantics

Standard office desks are reliable low cover:

- standing behind a desk = partially visible;
- crouching behind a desk = fully hidden;
- tall cabinets and walls = fully block sight;
- glass blocks movement but does not block sight.

Do not change these semantics accidentally when adjusting model dimensions.

### Vision visualization

The vision cone must distinguish:

- clear visibility;
- partial visibility behind low cover;
- fully blocked visibility.

Partial visibility must be visually distinct from normal visibility, for example with weaker fill plus dashed / patterned treatment.

Fully blocked regions should not show as visible cone.

Alert / detection progression is separate from visibility shape.

Detection reaches chase when suspicion fills to 1.0; do not make the alert wave touching the player an independent chase trigger.

## Safe interaction points

Office interactions such as:
- working at a computer;
- drinking water;
- hiding;
- future office activities;

should use the shared safe-interaction system rather than custom one-off logic.

The player's own workstation starts active at the beginning of the level.

Safe interaction points are planning tools, not instant escape buttons:
- once the player is already in chase / high-alert state, entering a safe interaction must be blocked;
- leaving an interaction returns the player to normal stealth rules.

## Level design

Design stealth space before decorating it.

Use:
- observation points;
- route splits and recombinations;
- overlapping but non-synchronized NPC routines;
- readable safe islands;
- deliberate sight-line breaks;
- meaningful differences between routes.

Avoid:
- one globally optimal route;
- empty central lanes;
- generic guard-style patrols with no office purpose;
- furniture gaps that look walkable but fail collision clearance;
- NPC goals that require walking directly through furniture.

NPC office routines describe intent.
Navigation decides how to reach the intent.

Never bypass navigation by moving routine NPCs directly toward blocked targets.

## Validation

Before considering gameplay changes complete, run:

```bash
npm run verify
```

Current verification includes:
- published-level validation;
- authored navigation / clearance checks;
- stealth cover semantics;
- safe-interaction rules;
- production build.

Do not disable or weaken a validator merely to make CI pass.

Fix the underlying level, system, or data problem.

## Relevant docs

Read the relevant design documentation before large changes:

- `docs/ARCHITECTURE.md`
- `docs/MILESTONES.md`
- `docs/LEVEL_M3_V2.md`

If a major design rule changes, update the relevant doc rather than expanding this file into a full design document.

## Working style

For substantial changes:

1. inspect the current implementation first;
2. preserve working abstractions;
3. make the smallest architectural change that supports the intended long-term design;
4. validate;
5. playtest the resulting behavior conceptually or in the running build;
6. update docs when the design contract changes.

Prefer fixing root causes over adding special cases.
