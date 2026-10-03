import * as THREE from 'three';

export class FollowCamera {
  constructor(camera) {
    this.camera = camera;
    this.offset = new THREE.Vector3(7.8, 10.5, 10.5);
    this.lookOffset = new THREE.Vector3(0, 0.7, -1.2);
    this.targetPosition = new THREE.Vector3();
    this.lookTarget = new THREE.Vector3();
  }

  snap(target) {
    this.camera.position.copy(target).add(this.offset);
    this.camera.lookAt(target.clone().add(this.lookOffset));
  }

  update(target, dt) {
    this.targetPosition.copy(target).add(this.offset);
    this.lookTarget.copy(target).add(this.lookOffset);
    const t = 1 - Math.pow(0.001, dt);
    this.camera.position.lerp(this.targetPosition, t);
    const currentDirection = new THREE.Vector3();
    this.camera.getWorldDirection(currentDirection);
    const currentLook = this.camera.position.clone().add(currentDirection.multiplyScalar(10));
    currentLook.lerp(this.lookTarget, t);
    this.camera.lookAt(currentLook);
  }
}
