import * as THREE from 'three';
import { CollisionWorld } from '../src/world/CollisionWorld.js';
import { VisionSensor } from '../src/actors/VisionSensor.js';

const collision =
  new CollisionWorld();

// Standard office desk low-cover semantics.
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

const sensor =
  new VisionSensor({
    distance: 8,
    angleDeg: 70,
    collision,
  });

const observer =
  new THREE.Vector3(
    0,
    1.68,
    -4,
  );

const forward =
  new THREE.Vector3(
    0,
    0,
    1,
  );

const standing =
  new THREE.Vector3(
    0,
    1.68,
    1.1,
  );

const crouched =
  new THREE.Vector3(
    0,
    0.9,
    1.1,
  );

const unobstructedCollision =
  new CollisionWorld();

const unobstructedSensor =
  new VisionSensor({
    distance: 8,
    angleDeg: 70,
    collision:
      unobstructedCollision,
  });

const clearVisibility =
  unobstructedSensor.visibility(
    observer,
    forward,
    standing,
  );

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

const profile =
  collision
    .projectedSightProfileAlongRay(
      observer,
      forward,
      8,
    );

const failures = [];

const check = (
  condition,
  message,
) => {
  if (!condition) {
    failures.push(message);
  }
};

check(
  standingVisibility > 0,
  'Standing player should remain visible over a standard desk.',
);

check(
  standingVisibility <
    clearVisibility,
  'Standing player behind a desk should be only partially visible.',
);

check(
  crouchedVisibility === 0,
  'Crouched player should be fully hidden behind a standard desk.',
);

check(
  profile.partialStart !== null,
  'Desk should create a partial-visibility region in the projected cone.',
);

check(
  profile.partialEnd >
    profile.partialStart,
  'Partial-visibility region should extend behind the desk.',
);

const fullCollision =
  new CollisionWorld();

fullCollision.addBox({
  center: [0, 0.95, 0],
  size: [2.2, 1.9, 1.0],
  movement: true,
  sight: true,
  label: 'tall-cover',
});

const fullProfile =
  fullCollision
    .projectedSightProfileAlongRay(
      observer,
      forward,
      8,
    );

check(
  fullProfile.blockedStart !==
    null,
  'Tall cover should create a fully blocked projected region.',
);

check(
  fullProfile.partialStart ===
    null,
  'Tall cover should not be presented as low-cover partial visibility.',
);

if (failures.length) {
  console.error(
    '\nStealth cover validation failed:\n',
  );

  for (const failure of failures) {
    console.error(
      '- ' + failure,
    );
  }

  process.exit(1);
}

console.log(
  [
    'Stealth cover passed:',
    'clear=' +
      clearVisibility.toFixed(2),
    'desk-standing=' +
      standingVisibility.toFixed(2),
    'desk-crouched=' +
      crouchedVisibility.toFixed(2),
    'partial-from=' +
      profile.partialStart.toFixed(2) +
      'm',
  ].join(' '),
);
