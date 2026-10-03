import * as THREE from 'three';
import { CharacterVisual } from './CharacterVisual.js';
import { PatrolBehavior } from './PatrolBehavior.js';
import { VisionSensor } from './VisionSensor.js';

export class NpcAgent {
  constructor(config, collision) {
    this.config = config;
    this.position = new THREE.Vector3(...config.patrol[0]);
    this.forward = new THREE.Vector3(0, 0, 1);
    this.visual = new CharacterVisual({
      color: config.danger === 3 ? 0x363636 : config.danger === 2 ? 0x565e63 : 0x6e665f,
      danger: config.danger
    });
    this.visual.setPosition(this.position);

    this.patrol = new PatrolBehavior(config.patrol, config.speed);
    this.sensor = new VisionSensor({
      distance: config.visionDistance,
      angleDeg: config.visionAngle,
      collision
    });

    this.enabled = config.activeAfterSeconds == null;
    this.detection = 0;
    this.justCaught = false;
    this.cooldown = 0;
  }

  setEnabled(value) {
    this.enabled = value;
    this.visual.group.visible = value;
  }

  update(dt, player, canDetect = true) {
    this.justCaught = false;
    if (!this.enabled) return;

    if (this.cooldown > 0) this.cooldown -= dt;

    const move = this.patrol.update(this.position, dt);
    if (move.lengthSq() > 0) {
      this.position.add(move);
      this.forward.copy(move).normalize();
      this.visual.setFacing(this.forward);
      this.visual.setPosition(this.position);
    }

    if (!canDetect || this.cooldown > 0) {
      this.detection = Math.max(0, this.detection - dt * 1.8);
      return;
    }

    const visibility = this.sensor.visibility(this.position, this.forward, player.position);
    const sprintFactor = player.isSprinting ? 1.35 : 1;
    if (visibility > 0) {
      this.detection += dt * visibility * sprintFactor * 1.15;
    } else {
      this.detection = Math.max(0, this.detection - dt * 0.7);
    }

    if (this.detection >= 1) {
      this.detection = 0;
      this.justCaught = true;
      this.cooldown = 4;
    }
  }

  reset() {
    this.position.set(...this.config.patrol[0]);
    this.forward.set(0, 0, 1);
    this.visual.setPosition(this.position);
    this.visual.setFacing(this.forward);
    this.patrol.reset();
    this.detection = 0;
    this.cooldown = 0;
    this.enabled = this.config.activeAfterSeconds == null;
    this.visual.group.visible = this.enabled;
  }
}
