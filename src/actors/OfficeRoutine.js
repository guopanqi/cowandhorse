import * as THREE from 'three';

export class OfficeRoutine {
  constructor(nodes = [], speed = 1.4) {
    this.nodes = nodes.map(node => ({
      ...node,
      point: new THREE.Vector3(...node.position),
      facingVector: node.facing ? new THREE.Vector3(...node.facing).normalize() : null,
    }));
    this.speed = speed;
    this.index = 0;
    this.waitRemaining = 0;
    this.arrived = false;
  }

  reset() {
    this.index = 0;
    this.waitRemaining = 0;
    this.arrived = false;
  }

  get currentNode() {
    return this.nodes[this.index] ?? null;
  }

  update(position, dt) {
    const node = this.currentNode;
    if (!node) {
      return { move: new THREE.Vector3(), action: 'idle', facing: null };
    }

    const delta = node.point.clone().sub(position);
    delta.y = 0;
    const distance = delta.length();

    if (!this.arrived && distance > 0.12) {
      const direction = delta.normalize();
      return {
        move: direction.clone().multiplyScalar(Math.min(distance, this.speed * dt)),
        action: 'walk',
        facing: direction,
      };
    }

    if (!this.arrived) {
      this.arrived = true;
      this.waitRemaining = node.duration ?? 0;
    }

    if (this.waitRemaining > 0) {
      this.waitRemaining = Math.max(0, this.waitRemaining - dt);
      return {
        move: new THREE.Vector3(),
        action: node.action ?? 'idle',
        facing: node.facingVector,
      };
    }

    this.index = (this.index + 1) % this.nodes.length;
    this.arrived = false;

    return {
      move: new THREE.Vector3(),
      action: node.action ?? 'idle',
      facing: node.facingVector,
    };
  }
}
