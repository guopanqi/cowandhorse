import * as THREE from 'three';
import { CharacterVisual } from './CharacterVisual.js';
import { OfficeRoutine } from './OfficeRoutine.js';
import { VisionSensor } from './VisionSensor.js';

export class NpcAgent {
  constructor(config, collision) {
    this.config = config;
    this.collision = collision;

    const start =
      config.routine?.[0]?.position ?? [0, 0, 0];

    this.position = new THREE.Vector3(...start);
    this.forward = new THREE.Vector3(0, 0, 1);

    this.visual = new CharacterVisual({
      color:
        config.danger === 3
          ? 0x363636
          : config.danger === 2
            ? 0x565e63
            : 0x6e665f,
      danger: config.danger,
    });
    this.visual.setPosition(this.position);

    this.routine = new OfficeRoutine(
      config.routine ?? [],
      config.speed,
    );

    this.sensor = new VisionSensor({
      distance: config.visionDistance,
      angleDeg: config.visionAngle,
      collision,
    });

    this.enabled = true;
    this.state = 'routine';
    this.activity = 'idle';
    this.detection = 0;
    this.justCaught = false;
    this.cooldown = 0;
    this.lostTime = 0;
    this.lastKnownPosition = this.position.clone();
  }

  get eyePosition() {
    const height =
      this.activity === 'sit' ? 1.18 : 1.68;

    return new THREE.Vector3(
      this.position.x,
      height,
      this.position.z,
    );
  }

  update(dt, player, canDetect = true) {
    this.justCaught = false;
    if (!this.enabled || this.state === 'capture') {
      return;
    }

    if (this.cooldown > 0) {
      this.cooldown = Math.max(0, this.cooldown - dt);
    }

    const visibility =
      canDetect && this.cooldown <= 0
        ? this.sensor.visibility(
            this.eyePosition,
            this.forward,
            player.eyePosition,
          )
        : 0;

    if (this.state === 'chase') {
      this.updateChase(dt, player, visibility);
      return;
    }

    if (!canDetect || this.cooldown > 0) {
      this.detection = Math.max(
        0,
        this.detection - dt * 0.8,
      );
      this.state = 'routine';
      this.updateRoutine(dt);
      return;
    }

    if (visibility > 0) {
      const movementFactor =
        player.isSprinting ? 1.35 : 1;
      const stanceFactor =
        player.isCrouched ? 0.84 : 1;

      this.detection = Math.min(
        1,
        this.detection +
          dt *
            visibility *
            0.72 *
            movementFactor *
            stanceFactor,
      );

      if (this.detection >= 1) {
        this.enterChase(player);
        return;
      }

      if (this.detection >= 0.28) {
        this.state = 'suspicious';
        this.activity = 'inspect';

        this.turnToward(
          player.position.clone().sub(this.position),
          dt,
          5.5,
        );

        this.visual.setPose('inspect');
        this.visual.setPosition(this.position);
        return;
      }

      this.updateRoutine(dt);
      return;
    }

    this.detection = Math.max(
      0,
      this.detection -
        dt *
          (this.state === 'suspicious'
            ? 0.42
            : 0.65),
    );

    if (
      this.state === 'suspicious' &&
      this.detection > 0.08
    ) {
      this.activity = 'inspect';
      this.visual.setPose('inspect');
      return;
    }

    this.state = 'routine';
    this.updateRoutine(dt);
  }

  enterChase(player) {
    this.state = 'chase';
    this.detection = 1;
    this.lostTime = 0;
    this.lastKnownPosition.copy(player.position);
    this.activity = 'chase';
  }

  updateChase(dt, player, visibility) {
    if (visibility > 0) {
      this.lostTime = 0;
      this.detection = 1;
      this.lastKnownPosition.copy(player.position);
    } else {
      this.lostTime += dt;
      this.detection = Math.max(
        0.18,
        1 -
          this.lostTime /
            (this.config.chaseMemory ?? 3.2),
      );
    }

    const target = this.lastKnownPosition;
    const delta = target.clone().sub(this.position);
    delta.y = 0;
    const distanceToTarget = delta.length();

    if (distanceToTarget > 0.08) {
      const direction = delta.normalize();
      const chaseSpeed =
        this.config.chaseSpeed ??
        this.config.speed * 1.75;

      const desiredMove =
        direction.multiplyScalar(
          Math.min(
            distanceToTarget,
            chaseSpeed * dt,
          ),
        );

      const next =
        this.collision.moveAndResolve(
          this.position,
          desiredMove,
          0.28,
        );

      const actualMove =
        next.clone().sub(this.position);
      this.position.copy(next);

      if (actualMove.lengthSq() > 0.0001) {
        this.forward
          .copy(actualMove)
          .normalize();
        this.visual.setFacing(this.forward);
      }
    }

    this.activity = 'chase';
    this.visual.setPose('idle');
    this.visual.setPosition(this.position);

    const distanceToPlayer =
      this.position.distanceTo(player.position);

    if (
      visibility > 0 &&
      distanceToPlayer <=
        (this.config.catchDistance ?? 0.72)
    ) {
      this.justCaught = true;
      this.state = 'capture-ready';
      this.detection = 1;
      this.activity = 'chase';
      return;
    }

    if (
      this.lostTime >=
      (this.config.chaseMemory ?? 3.2)
    ) {
      this.state = 'suspicious';
      this.detection = 0.18;
      this.activity = 'inspect';
      this.visual.setPose('inspect');
    }
  }

  beginCapture() {
    this.state = 'capture';
    this.activity = 'capture';
    this.detection = 1;
  }

  updateCaptureApproach(dt, targetPosition) {
    const delta =
      targetPosition.clone().sub(this.position);
    delta.y = 0;

    const distance = delta.length();
    if (distance <= 0.68) {
      this.turnToward(delta, dt, 9);
      this.visual.setPosition(this.position);
      return true;
    }

    const direction = delta.normalize();
    const speed =
      this.config.captureSpeed ??
      Math.max(
        1.5,
        this.config.speed * 1.35,
      );

    const move =
      direction.multiplyScalar(
        Math.min(distance - 0.62, speed * dt),
      );

    const next =
      this.collision.moveAndResolve(
        this.position,
        move,
        0.25,
      );

    const actualMove =
      next.clone().sub(this.position);
    this.position.copy(next);

    if (actualMove.lengthSq() > 0.0001) {
      this.forward
        .copy(actualMove)
        .normalize();
      this.visual.setFacing(this.forward);
    }

    this.visual.setPose('idle');
    this.visual.setPosition(this.position);

    return false;
  }

  releaseAfterCapture() {
    this.state = 'routine';
    this.activity = 'idle';
    this.detection = 0;
    this.cooldown = 4.5;
    this.lostTime = 0;
    this.visual.setPose('idle');
  }

  updateRoutine(dt) {
    const step =
      this.routine.update(this.position, dt);

    this.activity = step.action;

    if (step.move.lengthSq() > 0) {
      const next = step.ignoreCollision
        ? this.position.clone().add(step.move)
        : this.collision.moveAndResolve(
            this.position,
            step.move,
            0.28,
          );

      const actualMove =
        next.clone().sub(this.position);

      this.position.copy(next);

      if (actualMove.lengthSq() > 0.0001) {
        this.forward
          .copy(actualMove)
          .normalize();
        this.visual.setFacing(this.forward);
      }

      this.visual.setPose('idle');
    } else {
      if (step.facing) {
        this.turnToward(step.facing, dt, 4);
      }

      const pose =
        step.action === 'sit'
          ? 'sit'
          : step.action === 'print'
            ? 'print'
            : step.action === 'tea'
              ? 'tea'
              : step.action === 'read'
                ? 'read'
                : step.action === 'inspect' ||
                    step.action === 'check' ||
                    step.action === 'meeting'
                  ? 'inspect'
                  : 'idle';

      this.visual.setPose(pose);
    }

    this.visual.setPosition(this.position);
  }

  turnToward(direction, dt, speed = 4) {
    const flat = direction.clone();
    flat.y = 0;

    if (flat.lengthSq() < 0.0001) return;

    flat.normalize();

    this.forward
      .lerp(flat, Math.min(1, dt * speed))
      .normalize();

    this.visual.setFacing(this.forward);
  }

  reset() {
    const start =
      this.config.routine?.[0]?.position ??
      [0, 0, 0];

    this.position.set(...start);
    this.forward.set(0, 0, 1);
    this.routine.reset();

    this.state = 'routine';
    this.activity = 'idle';
    this.detection = 0;
    this.cooldown = 0;
    this.lostTime = 0;
    this.justCaught = false;

    this.visual.setPosition(this.position);
    this.visual.setFacing(this.forward);
    this.visual.setPose('idle');
  }
}
