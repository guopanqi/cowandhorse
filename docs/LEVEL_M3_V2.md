# M3 V2 — Offset Double-Loop Office Level

This document is the paper-level reference for the current first office level.

The goal is to keep the level readable as a stealth space before art detail is added.

## Core topology

```text
                           [ ELEVATOR ]
                               EV
                            /      \
                          EL        ER
                           \        /
                         S3L      S3R
                            \    /
                         [ S3 SAFE ]
                              |
               ┌──────────────┴──────────────┐
               |                             |
          WEST EXEC                      EAST EXEC
           W5-W6-W7                     E5-E6-E7
               |                             |
          BOSS OFFICE                  MEETING ROOM
               |                             |
               └──────────────┬──────────────┘
                              |
                         [ S2 SAFE ]
                              |
               ┌──────────────┼──────────────┐
               |              |              |
             WEST          CENTRAL          EAST
          W1-W2-W3       C1/C2 CUT       E1-E2-E3
               |              |              |
               └──────────────┼──────────────┘
                         [ S1 SAFE ]
                           /     \
                         SL       SR
                          \       /
                        [ PLAYER ]
```

The important property is not the visual left / center / right split.

The important property is:

```text
observe
  ↓
split
  ↓
cross / reroute
  ↓
recombine at a sight-line break
  ↓
observe again
  ↓
split again
```

The player should repeatedly regain information, not commit to one corridor for the entire level.

## Safe islands

### Start — personal workstation

The desk sits between the player and the office.

The player can move locally during 17:59:50–18:00 and watch office routines.

Leaving requires going around the left or right edge of the desk.

This prevents a straight spawn-to-exit line.

### S1 — file cabinet

S1 hides part of Encounter B.

The player reaches it after leaving the workstation and can read:

- team lead movement toward / away from the left route
- manager movement toward the central route
- whether the exposed central cut is currently viable

The cabinet itself blocks the straight route, so the player must expose left or right before advancing.

### S2 — file bank

The first ring recombines at S2.

S2 prevents the entire second half from being visible at once.

From here the player can choose:

- west near the boss office
- center, shortest and most exposed
- east around the meeting room

### S3 — final file bank

S3 is the final observation point.

The elevator is close, but the cabinet prevents a clean straight sprint.

The player must reveal left or right and then enter the elevator lobby.

## Encounter A — leaving work

Purpose:

- establish that NPCs are office workers with routines
- teach that standing / crouching affects cover
- make the 10-second preparation phase useful

Timing target at 18:00:

- team lead is arriving around S1
- manager is entering the central observation point
- boss is near the office doorway

The fastest line should look tempting but be temporarily unsafe.

## Encounter B — first double loop

### West

Characteristics:

- longer
- more opaque / low cover
- team lead has repeated presence
- best route for cautious crouched movement

### Center

Characteristics:

- shortest
- least forgiving
- crosses team lead and manager coverage
- intended for players who understand timing

### East

Characteristics:

- more visually open
- manager controls the route
- tea / meeting routines create changing windows

The player can leave a route and switch at the recombination points.

## Encounter C — executive ring

The second ring changes the type of threat.

### West

- hard cover
- boss office
- boss is low-frequency but high-cost
- route is visually safer until the boss exits

### Center

- shortest second-half line
- little cover
- can become dangerous if manager and boss timings overlap

### East

- meeting-room glass
- longer traversal
- useful line-of-sight breaks at privacy cabinets and room corners

## Encounter D — elevator lobby

Reaching the elevator does not end the level.

Calling it starts a 3.8-second arrival window.

That event interrupts the boss routine:

```text
boss office
   ↓
S3 area
   ↓
elevator lobby
```

The player can:

- retreat behind S3
- move around the opposite side
- commit to the elevator timing

This is the final React beat.

## NPC coverage

### Team lead

Primary responsibility:

- Encounter A exit
- west ring
- S1 / S2 crossover

Behavior language:

- print
- read/check workstation
- inspect central lane

Approximate cycle is intentionally different from the manager.

### Manager

Primary responsibility:

- east ring
- central crossover
- meeting-room side

Behavior language:

- check team area
- inspect central lane
- tea
- meeting

The initial routine is phased so the manager reaches central coverage around 18:00.

### Boss

Primary responsibility:

- executive ring
- S3 / elevator endgame

The boss should not feel like a normal guard.

Most time is spent in / near the office.

Leaving the office is rarer and more consequential.

## Whitebox rules

These are design constraints, not suggestions.

1. Every authored navigation edge must have full player clearance.
2. Every NPC routine point must be outside movement collision.
3. A safe island must break sight but must never become a movement choke.
4. No critical route may depend on squeezing between two colliders at less than validated clearance.
5. Glass blocks movement but not sight.
6. Low partitions should reward crouching, not behave like full walls.
7. The central path must never be globally optimal at all times.
8. At least one NPC should meaningfully cover the central path around 18:00.
9. Patrol / routine cycles should not share the same period.
10. The player should be able to change route after new information appears.

## Validation

`npm run validate` currently checks:

- every authored navigation edge
- both opening exits
- three first-ring options
- three second-ring options
- two final elevator approaches
- player spawn
- S1 / S2 / S3 safe-island positions
- all NPC routine points and transitions
- temporary office events
- elevator reachability

The validator uses player clearance for authored level routes, so a route that only fits an NPC cannot silently become a player route.

## Next playtest questions

Do not add art before answering these:

1. Does the player actually stop and observe at S1 / S2 / S3?
2. Is central clearly faster without becoming the automatic best route?
3. Does crouching materially improve the west route?
4. Does the east route feel different because of visibility, not merely distance?
5. At 18:00 is at least one central threat readable before the player moves?
6. Can a player recover from a bad plan by switching routes?
7. Can chase break line of sight at intentional places rather than random furniture?
8. Does the boss feel like an event rather than a third generic patrol guard?
9. Does the elevator call create a final decision instead of simple waiting?
10. Are there dead zones where no NPC or decision matters?
