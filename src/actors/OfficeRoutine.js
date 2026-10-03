import * as THREE from 'three';

export class OfficeRoutine {
  constructor(
    nodes = [],
    speed = 1.4,
    { loop = true } = {},
  ) {
    this.nodes = nodes.map(node => ({
      ...node,
      point: new THREE.Vector3(...node.position),
      facingVector: node.facing
        ? new THREE.Vector3(...node.facing).normalize()
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
        target: null,
        action: 'idle',
        facing: null,
      };
    }

    const distance = node.point.distanceTo(position);

    if (!this.arrived && distance > 0.18) {
      return {
        target: node.point,
        action: 'walk',
        facing: null,
      };
    }

    if (!this.arrived) {
      this.arrived = true;
      this.waitRemaining = node.duration ?? 0;
    }

    if (this.waitRemaining > 0) {
      this.waitRemaining = Math.max(
        0,
        this.waitRemaining - dt,
      );

      return {
        target: null,
        action: node.action ?? 'idle',
        facing: node.facingVector,
      };
    }

    const finishedAction = {
      target: null,
      action: node.action ?? 'idle',
      facing: node.facingVector,
    };

    const next = this.index + 1;

    if (next >= this.nodes.length) {
      if (this.loop) {
        this.index = 0;
        this.arrived = false;
      } else {
        this.completed = true;
      }
    } else {
      this.index = next;
      this.arrived = false;
    }

    return finishedAction;
  }
}
