import * as THREE from 'three';

export class VisionSensor {
  constructor({ distance, angleDeg, collision }) {
    this.distance = distance;
    this.angle = THREE.MathUtils.degToRad(angleDeg);
    this.collision = collision;
  }

  visibility(observerPosition, forward, targetPosition) {
    const toTarget = targetPosition.clone().sub(observerPosition);
    const distance = toTarget.length();
    if (distance > this.distance || distance < 0.001) return 0;

    toTarget.normalize();
    const dot = THREE.MathUtils.clamp(forward.dot(toTarget), -1, 1);
    const angle = Math.acos(dot);
    if (angle > this.angle * 0.5) return 0;

    if (this.collision.blocksSegment(observerPosition, targetPosition)) return 0;

    const centerFactor = 1 - angle / (this.angle * 0.5);
    const distanceFactor = 1 - distance / this.distance;
    return 0.45 + centerFactor * 0.35 + distanceFactor * 0.2;
  }
}
