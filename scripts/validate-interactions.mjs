import * as THREE from 'three';
import { SafeInteractionSystem } from '../src/game/SafeInteractionSystem.js';

class StubInput {
  constructor() {
    this.pressed = new Set();
  }

  press(code) {
    this.pressed.add(code);
  }

  consume(code) {
    const value =
      this.pressed.has(code);

    this.pressed.delete(code);
    return value;
  }
}

class StubPlayer {
  constructor() {
    this.position =
      new THREE.Vector3(0, 0, 0);

    this.entered = null;
    this.exited = 0;
  }

  enterInteraction(state) {
    this.entered = state;
    this.position.set(...state.position);
  }

  exitInteraction() {
    this.entered = null;
    this.exited += 1;
  }
}

const input = new StubInput();
const player = new StubPlayer();

const system =
  new SafeInteractionSystem({
    input,
    player,
    interactions: [
      {
        id: 'desk',
        type: 'fakeWork',
        position: [0, 0, 0],
        startActive: true,
        safe: true,
      },
      {
        id: 'water',
        type: 'drinkWater',
        position: [1.5, 0, 0],
        safe: true,
        range: 1,
      },
    ],
  });

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
  system.isActive,
  'Start interaction should be active.',
);

check(
  system.isSafe,
  'Start interaction should be safe.',
);

check(
  player.entered?.pose === 'sit',
  'Start interaction should use work/sit pose.',
);

input.press('KeyE');
system.update({
  enabled: true,
  canEnter: true,
});

check(
  !system.isActive,
  'Pressing E should leave the active workstation.',
);

player.position.set(1.5, 0, 0);
system.refreshNearby();

check(
  system.state.interaction?.id === 'water',
  'Water interaction should become available when nearby.',
);

input.press('KeyE');
system.update({
  enabled: true,
  canEnter: false,
});

check(
  !system.isActive,
  'Interaction entry must be blocked while threat state disallows entry.',
);

input.press('KeyE');
system.update({
  enabled: true,
  canEnter: true,
});

check(
  system.isActive &&
  system.state.interaction?.id === 'water',
  'Interaction should enter when threat gate allows it.',
);

check(
  player.entered?.pose === 'tea',
  'Water interaction should use drink/tea pose.',
);

if (failures.length) {
  console.error(
    '\nSafe interaction validation failed:\n',
  );

  for (const failure of failures) {
    console.error('- ' + failure);
  }

  process.exit(1);
}

console.log(
  'Safe interactions passed: start active, E exit, threat gate, water entry.',
);
