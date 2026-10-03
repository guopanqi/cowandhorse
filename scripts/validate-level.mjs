import * as THREE from 'three';
import { officeLevel } from '../src/data/officeLevel.js';
import { CollisionWorld } from '../src/world/CollisionWorld.js';
import { OfficeBuilder } from '../src/world/OfficeBuilder.js';
import { NavigationGraph } from '../src/world/NavigationGraph.js';

const PLAYER_RADIUS = 0.34;
const NPC_RADIUS = 0.3;

const scene = new THREE.Scene();
const collision = new CollisionWorld();

const builder = new OfficeBuilder(
  scene,
  collision,
  officeLevel,
);

builder.build();

const navigation = new NavigationGraph(
  officeLevel.navigation,
  collision,
  PLAYER_RADIUS,
);

const nodeById = new Map(
  officeLevel.navigation.nodes.map(node => [
    node.id,
    new THREE.Vector3(...node.position),
  ]),
);

const failures = [];

const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

const validatePoint = (point, label, radius = NPC_RADIUS) => {
  const position = new THREE.Vector3(...point);

  assert(
    !collision.containsPoint(
      position.x,
      position.z,
      radius,
    ),
    `${label} overlaps movement geometry`,
  );

  return position;
};

for (const [a, b] of officeLevel.navigation.edges) {
  const from = nodeById.get(a);
  const to = nodeById.get(b);

  assert(
    from && to,
    `Navigation edge references missing node: ${a} -> ${b}`,
  );

  if (!from || !to) continue;

  assert(
    collision.canTraverseSegment(from, to, PLAYER_RADIUS),
    `Navigation edge lacks player clearance: ${a} -> ${b}`,
  );
}

const authoredPlayerRoutes = {
  'opening-left': ['P', 'PL', 'SL', 'S1'],
  'opening-right': ['P', 'PR', 'SR', 'S1'],

  'first-ring-west': ['S1', 'W1', 'W2', 'W3', 'W4', 'S2'],
  'first-ring-center-left': ['S1', 'C1L', 'C2', 'S2'],
  'first-ring-center-right': ['S1', 'C1R', 'C2', 'S2'],
  'first-ring-east': ['S1', 'E1', 'E2', 'E3', 'E4', 'S2'],

  'second-ring-west': ['S2', 'S2L', 'W5', 'W6', 'W7', 'S3'],
  'second-ring-center-left': ['S2', 'S2L', 'C3', 'C4', 'S3'],
  'second-ring-center-right': ['S2', 'S2R', 'C3', 'C4', 'S3'],
  'second-ring-east': ['S2', 'S2R', 'E5', 'E6', 'E7', 'S3'],

  'final-left': ['S3', 'S3L', 'EL', 'EV'],
  'final-right': ['S3', 'S3R', 'ER', 'EV'],
};

for (const [routeName, route] of Object.entries(authoredPlayerRoutes)) {
  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i];
    const b = route[i + 1];

    const from = nodeById.get(a);
    const to = nodeById.get(b);

    assert(
      from && to,
      `Player route ${routeName} references missing node: ${a} -> ${b}`,
    );

    if (!from || !to) continue;

    assert(
      collision.canTraverseSegment(from, to, PLAYER_RADIUS),
      `Player route ${routeName} is blocked: ${a} -> ${b}`,
    );
  }
}

for (const [safeName, point] of Object.entries(
  officeLevel.levelDesign?.safeIslands ?? {},
)) {
  validatePoint(
    point,
    `Safe island ${safeName}`,
    PLAYER_RADIUS,
  );
}

const playerSpawn = validatePoint(
  officeLevel.playerSpawn,
  'Player spawn',
  PLAYER_RADIUS,
);

const extraction = validatePoint(
  officeLevel.extraction.position,
  'Extraction',
  PLAYER_RADIUS,
);

const openingLeft = navigation.findPath(
  playerSpawn,
  nodeById.get('S1'),
);

assert(
  openingLeft.length > 0,
  'Player cannot leave the starting workstation and reach S1',
);

const elevatorPath = navigation.findPath(
  nodeById.get('EV'),
  extraction,
);

assert(
  collision.canTraverseSegment(
    nodeById.get('EV'),
    extraction,
    PLAYER_RADIUS,
  ) || elevatorPath.length > 0,
  'Player cannot move from the elevator staging node into extraction',
);

for (const npc of officeLevel.npcs) {
  if (!npc.routine?.length) continue;

  let previous = validatePoint(
    npc.routine[0].position,
    `${npc.id} routine[0]`,
  );

  for (let i = 1; i < npc.routine.length; i++) {
    const target = validatePoint(
      npc.routine[i].position,
      `${npc.id} routine[${i}]`,
    );

    const path = navigation.findPath(previous, target);

    assert(
      collision.canTraverseSegment(previous, target, NPC_RADIUS) ||
        path.length > 0,
      `${npc.id} cannot navigate routine[${i - 1}] -> routine[${i}]`,
    );

    previous = target;
  }
}

for (const [eventName, event] of Object.entries(
  officeLevel.events ?? {},
)) {
  const npc = officeLevel.npcs.find(
    item => item.id === event.npcId,
  );

  assert(
    !!npc,
    `Event ${eventName} references missing NPC ${event.npcId}`,
  );

  if (!npc || !event.routine?.length) continue;

  let previous = new THREE.Vector3(
    ...npc.routine[0].position,
  );

  for (let i = 0; i < event.routine.length; i++) {
    const target = validatePoint(
      event.routine[i].position,
      `event ${eventName} routine[${i}]`,
    );

    const path = navigation.findPath(previous, target);

    assert(
      collision.canTraverseSegment(previous, target, NPC_RADIUS) ||
        path.length > 0,
      `Event ${eventName} cannot navigate to routine[${i}]`,
    );

    previous = target;
  }
}

if (failures.length > 0) {
  console.error('\nLevel validation failed:\n');

  for (const failure of failures) {
    console.error(`- ${failure}`);
  }

  console.error('');
  process.exit(1);
}

console.log(
  `Level validation passed: ${officeLevel.navigation.nodes.length} nodes, ${officeLevel.navigation.edges.length} authored edges, ${Object.keys(authoredPlayerRoutes).length} player routes, ${officeLevel.npcs.length} NPC routines.`,
);
