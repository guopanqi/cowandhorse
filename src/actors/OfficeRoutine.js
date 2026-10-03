import * as THREE from 'three';

export class OfficeRoutine {
  constructor(
    nodes = [],
    speed = 1.4,
    { loop = true } = {},
  ) {
    this.nodes = nodes.map(node => ({
      ...node,
      point: new THREE.Vector3(
        ...node.position,
      ),
      facingVector: node.facing
        ? new THREE.Vector3(
            ...node.facing,
          ).normalize()
        : null,
    }));

    this.speed = speed;
    this.loop = loop;

    this.index = 0;
    this.waitRemaining = 0;
    this.arrived = false;
    this.completed = false;
  }

  reset() {
    this.index = 0;
    this.waitRemaining = 0;
    this.arrived = false;
    this.completed = false;
  }

  get currentNode() {
    if (this.completed) return null;
    return this.nodes[this.index] ?? null;
  }

  update(position, dt) {
    const node = this.currentNode;

    if (!node) {
      return {
        move: new THREE.Vector3(),
        action: 'idle',
        facing: null,
        ignoreCollision: false,
      };
    }

    const delta =
      node.point.clone().sub(position);
    delta.y = 0;

    const distance = delta.length();

    if (
      !this.arrived &&
      distance > 0.12
    ) {
      const direction =
        delta.normalize();

      return {
        move:
          direction.clone().multiplyScalar(
            Math.min(
              distance,
              this.speed * dt,
            ),
          ),
        action: 'walk',
        facing: direction,
        ignoreCollision:
          !!node.ignoreCollision,
      };
    }

    if (!this.arrived) {
      this.arrived = true;
      this.waitRemaining =
        node.duration ?? 0;
    }

    if (this.waitRemaining > 0) {
      this.waitRemaining =
        Math.max(
          0,
          this.waitRemaining - dt,
        );

      return {
        move: new THREE.Vector3(),
        action:
          node.action ?? 'idle',
        facing:
          node.facingVector,
        ignoreCollision:
          !!node.ignoreCollision,
      };
    }

    const finalAction = {
      move: new THREE.Vector3(),
      action:
        node.action ?? 'idle',
      facing:
        node.facingVector,
      ignoreCollision:
        !!node.ignoreCollision,
    };

    const nextIndex =
      this.index + 1;

    if (
      nextIndex >=
      this.nodes.length
    ) {
      if (this.loop) {
        this.index = 0;
        this.arrived = false;
      } else {
        this.completed = true;
      }
    } else {
      this.index = nextIndex;
      this.arrived = false;
    }

    return finalAction;
  }
}
