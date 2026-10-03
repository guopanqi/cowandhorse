import * as THREE from 'three';

export class VisionSensor {
  constructor({ distance, angleDeg, collision }) {
    this.distance = distance;
    this.angle = THREE.MathUtils.degToRad(angleDeg);
    this.collision = collision;
  }

  visibility(observerEye, forward, targetEye) {
    const horizontal = new THREE.Vector3(
      targetEye.x - observerEye.x,
      0,
      targetEye.z - observerEye.z,
    );

    const distance = horizontal.length();
    if (distance > this.distance || distance < 0.001) return 0;

    horizontal.normalize();

    const flatForward = forward.clone();
    flatForward.y = 0;
    flatForward.normalize();

    const dot = THREE.MathUtils.clamp(flatForward.dot(horizontal), -1, 1);
    const angle = Math.acos(dot);
    if (angle > this.angle * 0.5) return 0;

    if (this.collision.blocksSight(observerEye, targetEye)) return 0;

    const centerFactor = 1 - angle / (this.angle * 0.5);
    const distanceFactor = 1 - distance / this.distance;

    return THREE.MathUtils.clamp(
      0.35 + centerFactor * 0.4 + distanceFactor * 0.25,
      0,
      1,
    );
  }
}
