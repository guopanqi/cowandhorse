import * as THREE from 'three';
import { CharacterVisual } from './CharacterVisual.js';

export class PlayerController {
  constructor({ input, collision, spawn }) {
    this.input = input;
    this.collision = collision;
    this.spawn = new THREE.Vector3(...spawn);
    this.position = this.spawn.clone();

    this.visual = new CharacterVisual({ color: 0x496b75 });
    this.visual.setPosition(this.position);

    this.walkSpeed = 3.2;
    this.sprintSpeed = 5.1;
    this.crouchSpeed = 2.05;

    this.isSprinting = false;
    this.isCrouched = false;
  }

  get eyePosition() {
    return new THREE.Vector3(
      this.position.x,
      this.isCrouched ? 0.82 : 1.68,
      this.position.z,
    );
  }

  update(dt, { enabled = true, moveRegion = null } = {}) {
    if (!enabled) {
      this.isSprinting = false;
      return;
    }

    if (this.input.consume('KeyC')) {
      this.isCrouched = !this.isCrouched;
    }

    const axis = this.input.axis();
    const move = new THREE.Vector3(axis.x, 0, axis.z);
    if (move.lengthSq() > 1) move.normalize();

    this.isSprinting =
      !this.isCrouched &&
      (this.input.isDown('ShiftLeft') || this.input.isDown('ShiftRight'));

    const speed = this.isCrouched
      ? this.crouchSpeed
      : this.isSprinting
        ? this.sprintSpeed
        : this.walkSpeed;

    if (move.lengthSq() > 0) {
      const delta = move.multiplyScalar(speed * dt);
      const next = this.collision.moveAndResolve(this.position, delta);

      if (moveRegion) {
        const center = new THREE.Vector3(...moveRegion.center);
        const offset = next.clone().sub(center);
        offset.y = 0;

        if (offset.length() > moveRegion.radius) {
          offset.setLength(moveRegion.radius);
          next.x = center.x + offset.x;
          next.z = center.z + offset.z;
        }
      }

      this.position.copy(next);
      this.visual.setFacing(delta);
      this.visual.setPosition(this.position);
    }

    this.visual.setPose(this.isCrouched ? 'crouch' : 'idle');
  }

  reset(spawn) {
    this.spawn.set(...spawn);
    this.position.copy(this.spawn);
    this.isCrouched = false;
    this.isSprinting = false;
    this.visual.setPosition(this.position);
    this.visual.setFacing(new THREE.Vector3(0, 0, -1));
    this.visual.setPose('idle');
  }
}
