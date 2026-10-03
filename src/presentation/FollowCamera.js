import * as THREE from 'three';

export class FollowCamera {
  constructor(camera) {
    this.camera = camera;
    this.offset = new THREE.Vector3(4.6, 6.35, 7.4);
    this.lookOffset = new THREE.Vector3(0, 0.85, -1.45);
    this.targetPosition = new THREE.Vector3();
    this.lookTarget = new THREE.Vector3();

    this.mode = 'follow';
    this.capturePlayer = null;
    this.captureNpc = null;
  }

  snap(target) {
    this.camera.position.copy(target).add(this.offset);
    this.camera.lookAt(target.clone().add(this.lookOffset));
  }

  beginCapture(player, npc) {
    this.mode = 'capture';
    this.capturePlayer = player;
    this.captureNpc = npc;
  }

  endCapture() {
    this.mode = 'follow';
    this.capturePlayer = null;
    this.captureNpc = null;
  }

  update(target, dt) {
    if (
      this.mode === 'capture' &&
      this.capturePlayer &&
      this.captureNpc
    ) {
      this.updateCapture(dt);
      return;
    }

    this.updateFollow(target, dt);
  }

  updateFollow(target, dt) {
    this.targetPosition.copy(target).add(this.offset);
    this.lookTarget.copy(target).add(this.lookOffset);

    const t = 1 - Math.pow(0.002, dt);
    this.camera.position.lerp(this.targetPosition, t);

    const currentDirection = new THREE.Vector3();
    this.camera.getWorldDirection(currentDirection);
    const currentLook = this.camera.position
      .clone()
      .add(currentDirection.multiplyScalar(10));

    currentLook.lerp(this.lookTarget, t);
    this.camera.lookAt(currentLook);
  }

  updateCapture(dt) {
    const player = this.capturePlayer.position;
    const npc = this.captureNpc.position;

    const midpoint = player.clone().lerp(npc, 0.48);
    midpoint.y = 1.08;

    const line = player.clone().sub(npc);
    line.y = 0;

    if (line.lengthSq() < 0.001) {
      line.set(0, 0, 1);
    }
    line.normalize();

    const side = new THREE.Vector3(-line.z, 0, line.x);

    this.targetPosition
      .copy(midpoint)
      .add(side.multiplyScalar(2.4))
      .add(line.multiplyScalar(1.55));
    this.targetPosition.y += 2.55;

    const t = 1 - Math.pow(0.0003, dt);
    this.camera.position.lerp(this.targetPosition, t);
    this.camera.lookAt(midpoint);
  }
}
