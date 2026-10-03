import * as THREE from 'three';
import { CollisionWorld } from '../src/world/CollisionWorld.js';
import { VisionSensor } from '../src/actors/VisionSensor.js';

const collision = new CollisionWorld();

// Standard office desk low-cover semantics:
// movement body stays low; sight-only cover reaches 1.08m.
collision.addBox({
  center: [0, 0.38, 0],
  size: [2.2, 0.72, 1.0],
  movement: true,
  sight: true,
  label: 'desk-body',
});

collision.addBox({
  center: [0, 0.54, 0],
  size: [2.2, 1.08, 1.0],
  movement: false,
  sight: true,
  label: 'desk-low-cover',
});

const sensor = new VisionSensor({
  distance: 8,
  angleDeg: 70,
  collision,
});

const observer = new THREE.Vector3(0, 1.68, -4);
const forward = new THREE.Vector3(0, 0, 1);
const standing = new THREE.Vector3(0, 1.68, 1.1);
const crouched = new THREE.Vector3(0, 0.9, 1.1);

const standingVisibility =
  sensor.visibility(
    observer,
    forward,
    standing,
  );

const crouchedVisibility =
  sensor.visibility(
    observer,
    forward,
    crouched,
  );

const projectedDistance =
  collision.projectedSightDistanceAlongRay(
    observer,
    forward,
    8,
  );

const failures = [];

if (standingVisibility <= 0) {
  failures.push(
    'Standing player should remain visible over a standard desk.',
  );
}

if (crouchedVisibility !== 0) {
  failures.push(
    'Crouched player should be fully hidden behind a standard desk.',
  );
}

if (projectedDistance >= 4) {
  failures.push(
    'Projected vision cone should stop at desk cover.',
  );
}

if (failures.length) {
  console.error('\nStealth cover validation failed:\n');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  `Stealth cover passed: standing=${standingVisibility.toFixed(2)}, crouched=${crouchedVisibility.toFixed(2)}, cone=${projectedDistance.toFixed(2)}m`,
);
