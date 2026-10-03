import * as THREE from 'three';

export class CollisionWorld {
  constructor() {
    this.blockers = [];
  }

  addBox(minX, maxX, minZ, maxZ) {
    this.blockers.push({ minX, maxX, minZ, maxZ });
  }

  containsPoint(x, z, padding = 0) {
    return this.blockers.some(b =>
      x > b.minX - padding && x < b.maxX + padding &&
      z > b.minZ - padding && z < b.maxZ + padding
    );
  }

  moveAndResolve(position, delta, radius = 0.34) {
    const next = position.clone();

    const candidateX = next.x + delta.x;
    if (!this.containsPoint(candidateX, next.z, radius)) next.x = candidateX;

    const candidateZ = next.z + delta.z;
    if (!this.containsPoint(next.x, candidateZ, radius)) next.z = candidateZ;

    return next;
  }

  blocksSegment(from, to) {
    const dir = new THREE.Vector2(to.x - from.x, to.z - from.z);
    const length = dir.length();
    if (length <= 0.001) return false;
    dir.normalize();

    const steps = Math.ceil(length / 0.2);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const x = from.x + (to.x - from.x) * t;
      const z = from.z + (to.z - from.z) * t;
      if (this.containsPoint(x, z, 0.02)) return true;
    }
    return false;
  }
}
