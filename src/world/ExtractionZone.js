import * as THREE from 'three';

export class ExtractionZone {
  constructor({
    position,
    radius,
    callSeconds = 3.4,
  }) {
    this.position =
      new THREE.Vector3(...position);
    this.radius = radius;
    this.callSeconds = callSeconds;

    this.state = 'idle';
    this.progress = 0;
    this.justCalled = false;
  }

  update(playerPosition, dt, active) {
    this.justCalled = false;

    const inside =
      playerPosition.distanceTo(
        this.position,
      ) <= this.radius;

    if (
      active &&
      this.state === 'idle' &&
      inside
    ) {
      this.state = 'calling';
      this.progress = 0;
      this.justCalled = true;
    }

    if (
      active &&
      this.state === 'calling'
    ) {
      this.progress = Math.min(
        1,
        this.progress +
          dt / this.callSeconds,
      );

      if (this.progress >= 1) {
        this.state = 'ready';
      }
    }

    return {
      state: this.state,
      progress: this.progress,
      justCalled: this.justCalled,
      inside,
      escaped:
        active &&
        this.state === 'ready' &&
        inside,
    };
  }

  reset() {
    this.state = 'idle';
    this.progress = 0;
    this.justCalled = false;
  }
}
