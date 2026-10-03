import * as THREE from 'three';
import { CharacterVisual } from './CharacterVisual.js';
import { OfficeRoutine } from './OfficeRoutine.js';
import { VisionSensor } from './VisionSensor.js';

export class NpcAgent {
  constructor(config, collision, navigation) {
    this.config = config;
    this.collision = collision;
    this.navigation = navigation;

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

    this.interruptRoutine = null;

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

    this.path = [];
    this.pathIndex = 0;
    this.plannedTarget = null;
    this.repathTimer = 0;
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

  clearPath() {
    this.path = [];
    this.pathIndex = 0;
    this.plannedTarget = null;
    this.repathTimer = 0;
  }

  update(dt, player, canDetect = true) {
    this.justCaught = false;

    if (!this.enabled || this.state === 'capture') {
      return;
    }

    this.repathTimer = Math.max(
      0,
      this.repathTimer - dt,
    );

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
        this.clearPath();

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
    this.clearPath();
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

    const chaseSpeed =
      this.config.chaseSpeed ??
      this.config.speed * 1.75;

    this.moveToward(
      this.lastKnownPosition,
      dt,
      chaseSpeed,
      0.24,
    );

    this.activity = 'chase';
    this.visual.setPose('idle');
    this.visual.setPosition(this.position);

    const distanceToPlayer =
      this.position.distanceTo(player.position);

    if (
      visibility > 0 &&
      distanceToPlayer <=
        (this.config.catchDistance ?? 0.76)
    ) {
      this.justCaught = true;
      this.state = 'capture-ready';
      this.detection = 1;
      this.activity = 'chase';
      this.clearPath();
      return;
    }

    if (
      this.lostTime >=
      (this.config.chaseMemory ?? 3.2)
    ) {
      this.state = 'suspicious';
      this.detection = 0.18;
      this.activity = 'inspect';
      this.clearPath();
      this.visual.setPose('inspect');
    }
  }

  beginCapture() {
    this.state = 'capture';
    this.activity = 'capture';
    this.detection = 1;
    this.clearPath();
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

    this.moveToward(
      targetPosition,
      dt,
      this.config.captureSpeed ??
        Math.max(1.5, this.config.speed * 1.35),
      0.12,
    );

    this.visual.setPose('idle');
    this.visual.setPosition(this.position);

    return this.position.distanceTo(targetPosition) <= 0.68;
  }

  releaseAfterCapture() {
    this.state = 'routine';
    this.activity = 'idle';
    this.detection = 0;
    this.cooldown = 4.5;
    this.lostTime = 0;
    this.clearPath();
    this.visual.setPose('idle');
  }

  triggerInterrupt(nodes = []) {
    if (
      this.state === 'chase' ||
      this.state === 'capture' ||
      this.state === 'capture-ready'
    ) {
      return false;
    }

    this.interruptRoutine = new OfficeRoutine(
      nodes,
      this.config.speed * 1.15,
      { loop: false },
    );

    this.state = 'routine';
    this.detection = 0;
    this.clearPath();
    return true;
  }

  updateRoutine(dt) {
    const activeRoutine =
      this.interruptRoutine ?? this.routine;

    const intent =
      activeRoutine.update(this.position, dt);

    if (this.interruptRoutine?.completed) {
      this.interruptRoutine = null;
      this.clearPath();
    }

    this.activity = intent.action;

    if (intent.target) {
      this.moveToward(
        intent.target,
        dt,
        activeRoutine.speed,
        0.5,
      );

      this.visual.setPose('idle');
      this.visual.setPosition(this.position);
      return;
    }

    this.clearPath();

    if (intent.facing) {
      this.turnToward(intent.facing, dt, 4);
    }

    const pose =
      intent.action === 'sit'
        ? 'sit'
        : intent.action === 'print'
          ? 'print'
          : intent.action === 'tea'
            ? 'tea'
            : intent.action === 'read'
              ? 'read'
              : intent.action === 'inspect' ||
                  intent.action === 'check' ||
                  intent.action === 'meeting'
                ? 'inspect'
                : 'idle';

    this.visual.setPose(pose);
    this.visual.setPosition(this.position);
  }

  moveToward(
    target,
    dt,
    speed,
    replanEvery = 0.45,
  ) {
    const targetChanged =
      !this.plannedTarget ||
      this.plannedTarget.distanceTo(target) > 0.35;

    const direct =
      this.collision.canTraverseSegment(
        this.position,
        target,
        0.29,
      );

    if (direct) {
      this.clearPath();
      this.stepToward(target, dt, speed);
      return;
    }

    if (
      targetChanged ||
      this.repathTimer <= 0 ||
      this.path.length === 0
    ) {
      this.path =
        this.navigation?.findPath(
          this.position,
          target,
        ) ?? [];

      this.pathIndex = 0;
      this.plannedTarget = target.clone();
      this.repathTimer = replanEvery;
    }

    while (
      this.pathIndex < this.path.length &&
      this.position.distanceTo(
        this.path[this.pathIndex],
      ) < 0.18
    ) {
      this.pathIndex += 1;
    }

    const waypoint =
      this.path[this.pathIndex];

    if (!waypoint) {
      return;
    }

    const moved =
      this.stepToward(
        waypoint,
        dt,
        speed,
      );

    if (!moved) {
      this.repathTimer = 0;
    }
  }

  stepToward(target, dt, speed) {
    const delta =
      target.clone().sub(this.position);
    delta.y = 0;

    const distance = delta.length();

    if (distance <= 0.001) {
      return false;
    }

    const direction = delta.normalize();

    const desired =
      direction.multiplyScalar(
        Math.min(distance, speed * dt),
      );

    const next =
      this.collision.moveAndResolve(
        this.position,
        desired,
        0.28,
      );

    const actual =
      next.clone().sub(this.position);

    if (actual.lengthSq() <= 0.000001) {
      return false;
    }

    this.position.copy(next);
    this.forward.copy(actual).normalize();
    this.visual.setFacing(this.forward);

    return true;
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
    this.interruptRoutine = null;

    this.state = 'routine';
    this.activity = 'idle';
    this.detection = 0;
    this.cooldown = 0;
    this.lostTime = 0;
    this.justCaught = false;

    this.clearPath();

    this.visual.setPosition(this.position);
    this.visual.setFacing(this.forward);
    this.visual.setPose('idle');
  }
}
