import * as THREE from 'three';
import { CharacterVisual } from './CharacterVisual.js';

export class PlayerController {
  constructor({ input, collision, spawn }) {
    this.input = input;
    this.collision = collision;
    this.position = new THREE.Vector3(...spawn);
    this.visual = new CharacterVisual({ color: 0x496b75 });
    this.visual.setPosition(this.position);
    this.walkSpeed = 3.2;
    this.sprintSpeed = 5.1;
    this.isSprinting = false;
  }

  update(dt, enabled = true) {
    if (!enabled) return;

    const axis = this.input.axis();
    const move = new THREE.Vector3(axis.x, 0, axis.z);
    if (move.lengthSq() > 1) move.normalize();

    this.isSprinting = this.input.isDown('ShiftLeft') || this.input.isDown('ShiftRight');
    const speed = this.isSprinting ? this.sprintSpeed : this.walkSpeed;

    if (move.lengthSq() > 0) {
      const delta = move.multiplyScalar(speed * dt);
      this.position.copy(this.collision.moveAndResolve(this.position, delta));
      this.visual.setFacing(delta);
      this.visual.setPosition(this.position);
    }
  }

  reset(spawn) {
    this.position.set(...spawn);
    this.visual.setPosition(this.position);
    this.visual.setFacing(new THREE.Vector3(0, 0, -1));
  }
}
