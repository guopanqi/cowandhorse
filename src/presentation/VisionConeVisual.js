import * as THREE from 'three';

export class VisionConeVisual {
  constructor(
    agent,
    collision,
    player,
  ) {
    this.agent = agent;
    this.collision = collision;
    this.player = player;

    this.radius =
      agent.config.visionDistance;

    this.halfAngle =
      THREE.MathUtils.degToRad(
        agent.config.visionAngle,
      ) * 0.5;

    this.segments = 36;

    this.geometry =
      new THREE.BufferGeometry();

    this.positions =
      new Float32Array(
        this.segments *
          9,
      );

    this.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(
        this.positions,
        3,
      ),
    );

    this.safeColor =
      new THREE.Color(
        0xd4b56c,
      );

    this.alertColor =
      new THREE.Color(
        0xd13f35,
      );

    this.material =
      new THREE.MeshBasicMaterial({
        color:
          this.safeColor,
        transparent: true,
        opacity: 0.11,
        depthWrite: false,
        side:
          THREE.DoubleSide,
      });

    this.mesh =
      new THREE.Mesh(
        this.geometry,
        this.material,
      );

    this.mesh.renderOrder = 2;
  }

  update() {
    const hiddenState =
      this.agent.state ===
        'capture' ||
      this.agent.state ===
        'capture-ready';

    this.mesh.visible =
      this.agent.enabled &&
      !hiddenState;

    if (!this.mesh.visible) {
      return;
    }

    this.mesh.position.copy(
      this.agent.position,
    );

    this.mesh.position.y =
      0.035;

    const heading =
      Math.atan2(
        this.agent.forward.x,
        this.agent.forward.z,
      );

    const origin =
      this.agent.eyePosition;

    const targetHeight =
      this.player.eyePosition.y;

    for (
      let i = 0;
      i < this.segments;
      i++
    ) {
      const a0 =
        -this.halfAngle +
        (i /
          this.segments) *
          this.halfAngle *
          2;

      const a1 =
        -this.halfAngle +
        ((i + 1) /
          this.segments) *
          this.halfAngle *
          2;

      const d0 =
        this.distanceForAngle(
          origin,
          heading + a0,
          targetHeight,
        );

      const d1 =
        this.distanceForAngle(
          origin,
          heading + a1,
          targetHeight,
        );

      const offset =
        i * 9;

      this.positions[
        offset
      ] = 0;

      this.positions[
        offset + 1
      ] = 0;

      this.positions[
        offset + 2
      ] = 0;

      this.positions[
        offset + 3
      ] =
        Math.sin(a0) * d0;

      this.positions[
        offset + 4
      ] = 0;

      this.positions[
        offset + 5
      ] =
        Math.cos(a0) * d0;

      this.positions[
        offset + 6
      ] =
        Math.sin(a1) * d1;

      this.positions[
        offset + 7
      ] = 0;

      this.positions[
        offset + 8
      ] =
        Math.cos(a1) * d1;
    }

    this.geometry.attributes
      .position.needsUpdate =
      true;

    this.geometry.computeBoundingSphere();

    this.mesh.rotation.y =
      heading;

    const hot =
      this.agent.state ===
      'chase'
        ? 1
        : THREE.MathUtils.clamp(
            this.agent.detection,
            0,
            1,
          );

    this.material.color
      .copy(this.safeColor)
      .lerp(
        this.alertColor,
        hot,
      );

    this.material.opacity =
      0.09 +
      hot * 0.2;
  }

  distanceForAngle(
    origin,
    worldAngle,
    targetHeight,
  ) {
    const direction =
      new THREE.Vector3(
        Math.sin(
          worldAngle,
        ),
        0,
        Math.cos(
          worldAngle,
        ),
      );

    return this.collision
      .sightDistanceAlongRay(
        origin,
        direction,
        this.radius,
        targetHeight,
      );
  }
}
