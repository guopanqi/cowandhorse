import * as THREE from 'three';
import { officeLevel } from '../src/data/officeLevel.js';
import { CollisionWorld } from '../src/world/CollisionWorld.js';
import { OfficeBuilder } from '../src/world/OfficeBuilder.js';
import { NavigationGraph } from '../src/world/NavigationGraph.js';

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
  0.3,
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

for (const [a, b] of officeLevel.navigation.edges) {
  const from = nodeById.get(a);
  const to = nodeById.get(b);

  assert(
    from && to,
    `Navigation edge references missing node: ${a} -> ${b}`,
  );

  if (!from || !to) continue;

  assert(
    collision.canTraverseSegment(from, to, 0.3),
    `Navigation edge is physically blocked: ${a} -> ${b}`,
  );
}

const centralRoute = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7'];

for (let i = 0; i < centralRoute.length - 1; i++) {
  const from = nodeById.get(centralRoute[i]);
  const to = nodeById.get(centralRoute[i + 1]);

  assert(
    collision.canTraverseSegment(from, to, 0.34),
    `Main aisle does not have player clearance: ${centralRoute[i]} -> ${centralRoute[i + 1]}`,
  );
}

const validatePoint = (point, label) => {
  const position = new THREE.Vector3(...point);

  assert(
    !collision.containsPoint(
      position.x,
      position.z,
      0.29,
    ),
    `${label} overlaps movement geometry`,
  );

  return position;
};

const playerSpawn = validatePoint(
  officeLevel.playerSpawn,
  'Player spawn',
);
const extraction = validatePoint(
  officeLevel.extraction.position,
  'Extraction',
);

const firstCenterNode = nodeById.get('C1');
const startPath = navigation.findPath(
  playerSpawn,
  firstCenterNode,
);

assert(
  startPath.length > 0,
  'Player cannot leave the workstation safe island through either side aisle',
);

const extractionPath = navigation.findPath(
  nodeById.get('C6'),
  extraction,
);

assert(
  collision.canTraverseSegment(
    nodeById.get('C6'),
    extraction,
    0.34,
  ) || extractionPath.length > 0,
  'Player cannot reach the elevator staging area',
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
      collision.canTraverseSegment(previous, target, 0.29) ||
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
      collision.canTraverseSegment(previous, target, 0.29) ||
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
  `Level validation passed: ${officeLevel.navigation.nodes.length} nodes, ${officeLevel.navigation.edges.length} authored edges, ${officeLevel.npcs.length} NPC routines.`,
);
