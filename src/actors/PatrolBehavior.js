import * as THREE from 'three';

export class PatrolBehavior {
  constructor(points, speed = 1.5) {
    this.points = points.map(p => new THREE.Vector3(...p));
    this.speed = speed;
    this.index = 0;
    this.wait = 0;
  }

  reset() {
    this.index = 0;
    this.wait = 0;
  }

  update(position, dt) {
    if (this.points.length === 0) return new THREE.Vector3();

    if (this.wait > 0) {
      this.wait -= dt;
      return new THREE.Vector3();
    }

    const target = this.points[this.index];
    const delta = target.clone().sub(position);
    const distance = delta.length();

    if (distance < 0.12) {
      this.index = (this.index + 1) % this.points.length;
      this.wait = 0.7 + (this.index % 2) * 0.5;
      return new THREE.Vector3();
    }

    return delta.normalize().multiplyScalar(Math.min(distance, this.speed * dt));
  }
}
