import * as THREE from 'three';

const TRIANGLE_FLOATS = 9;
const QUAD_FLOATS = 18;
const DASHES_PER_SEGMENT = 3;
const DASH_FLOATS = 6;

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

    this.segments = 48;

    this.safeColor =
      new THREE.Color(
        0xd4b56c,
      );

    this.alertColor =
      new THREE.Color(
        0xd13f35,
      );

    this.group =
      new THREE.Group();

    // Keep the public API stable for OfficeLevel.
    this.mesh = this.group;

    this.solidGeometry =
      new THREE.BufferGeometry();

    this.solidPositions =
      new Float32Array(
        this.segments *
          TRIANGLE_FLOATS,
      );

    this.solidGeometry
      .setAttribute(
        'position',
        new THREE.BufferAttribute(
          this.solidPositions,
          3,
        ),
      );

    this.solidMaterial =
      new THREE.MeshBasicMaterial({
        color: this.safeColor,
        transparent: true,
        opacity: 0.105,
        depthWrite: false,
        side: THREE.DoubleSide,
      });

    this.solidMesh =
      new THREE.Mesh(
        this.solidGeometry,
        this.solidMaterial,
      );

    this.partialGeometry =
      new THREE.BufferGeometry();

    this.partialPositions =
      new Float32Array(
        this.segments *
          QUAD_FLOATS,
      );

    this.partialGeometry
      .setAttribute(
        'position',
        new THREE.BufferAttribute(
          this.partialPositions,
          3,
        ),
      );

    this.partialMaterial =
      new THREE.MeshBasicMaterial({
        color: this.safeColor,
        transparent: true,
        opacity: 0.035,
        depthWrite: false,
        side: THREE.DoubleSide,
      });

    this.partialMesh =
      new THREE.Mesh(
        this.partialGeometry,
        this.partialMaterial,
      );

    this.patternGeometry =
      new THREE.BufferGeometry();

    this.patternPositions =
      new Float32Array(
        this.segments *
          DASHES_PER_SEGMENT *
          DASH_FLOATS,
      );

    this.patternGeometry
      .setAttribute(
        'position',
        new THREE.BufferAttribute(
          this.patternPositions,
          3,
        ),
      );

    this.patternMaterial =
      new THREE.LineBasicMaterial({
        color: this.safeColor,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
      });

    this.patternLines =
      new THREE.LineSegments(
        this.patternGeometry,
        this.patternMaterial,
      );

    this.alertGeometry =
      new THREE.BufferGeometry();

    this.alertPositions =
      new Float32Array(
        this.segments *
          TRIANGLE_FLOATS,
      );

    this.alertGeometry
      .setAttribute(
        'position',
        new THREE.BufferAttribute(
          this.alertPositions,
          3,
        ),
      );

    this.alertMaterial =
      new THREE.MeshBasicMaterial({
        color: this.alertColor,
        transparent: true,
        opacity: 0.17,
        depthWrite: false,
        side: THREE.DoubleSide,
      });

    this.alertMesh =
      new THREE.Mesh(
        this.alertGeometry,
        this.alertMaterial,
      );

    this.waveGeometry =
      new THREE.BufferGeometry();

    this.wavePositions =
      new Float32Array(
        this.segments * 6,
      );

    this.waveGeometry
      .setAttribute(
        'position',
        new THREE.BufferAttribute(
          this.wavePositions,
          3,
        ),
      );

    this.waveMaterial =
      new THREE.LineBasicMaterial({
        color: this.alertColor,
        transparent: true,
        opacity: 0.78,
        depthWrite: false,
      });

    this.waveLines =
      new THREE.LineSegments(
        this.waveGeometry,
        this.waveMaterial,
      );

    for (const child of [
      this.solidMesh,
      this.partialMesh,
      this.patternLines,
      this.alertMesh,
      this.waveLines,
    ]) {
      child.renderOrder = 2;
      this.group.add(child);
    }

    this.partialMesh.renderOrder = 1;
    this.solidMesh.renderOrder = 2;
    this.patternLines.renderOrder = 3;
    this.alertMesh.renderOrder = 4;
    this.waveLines.renderOrder = 5;
  }

  update() {
    const hiddenState =
      this.agent.state ===
        'capture' ||
      this.agent.state ===
        'capture-ready';

    this.group.visible =
      this.agent.enabled &&
      !hiddenState;

    if (!this.group.visible) {
      return;
    }

    this.group.position.copy(
      this.agent.position,
    );

    this.group.position.y =
      0.035;

    const heading =
      Math.atan2(
        this.agent.forward.x,
        this.agent.forward.z,
      );

    const origin =
      this.agent.eyePosition;

    const profiles = [];

    for (
      let i = 0;
      i <= this.segments;
      i++
    ) {
      const angle =
        -this.halfAngle +
        (i /
          this.segments) *
          this.halfAngle *
          2;

      profiles.push(
        this.profileForAngle(
          origin,
          heading + angle,
        ),
      );
    }

    const hot =
      this.agent.state ===
        'chase'
        ? 1
        : THREE.MathUtils.clamp(
            this.agent.detection,
            0,
            1,
          );

    const alertRadius =
      this.radius * hot;

    let patternOffset = 0;

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

      const p0 = profiles[i];
      const p1 = profiles[i + 1];

      this.writeTriangle(
        this.solidPositions,
        i * TRIANGLE_FLOATS,
        a0,
        p0.clearEnd,
        a1,
        p1.clearEnd,
      );

      const partial0 =
        p0.partialStart !== null;

      const partial1 =
        p1.partialStart !== null;

      const start0 =
        partial0
          ? p0.partialStart
          : p0.clearEnd;

      const end0 =
        partial0
          ? p0.partialEnd
          : start0;

      const start1 =
        partial1
          ? p1.partialStart
          : p1.clearEnd;

      const end1 =
        partial1
          ? p1.partialEnd
          : start1;

      this.writeQuad(
        this.partialPositions,
        i * QUAD_FLOATS,
        a0,
        start0,
        end0,
        a1,
        start1,
        end1,
      );

      const centerAngle =
        (a0 + a1) * 0.5;

      const centerProfile =
        this.profileForAngle(
          origin,
          heading + centerAngle,
        );

      if (
        centerProfile.partialStart !==
        null
      ) {
        const start =
          centerProfile.partialStart;

        const end =
          centerProfile.partialEnd;

        const length =
          Math.max(
            0,
            end - start,
          );

        for (
          let dash = 0;
          dash < DASHES_PER_SEGMENT;
          dash++
        ) {
          const t0 =
            (dash * 2 + 0.35) /
            (DASHES_PER_SEGMENT * 2);

          const t1 =
            Math.min(
              1,
              t0 + 0.11,
            );

          const d0 =
            start +
            length * t0;

          const d1 =
            start +
            length * t1;

          this.writeLine(
            this.patternPositions,
            patternOffset,
            centerAngle,
            d0,
            d1,
          );

          patternOffset +=
            DASH_FLOATS;
        }
      } else {
        for (
          let dash = 0;
          dash < DASHES_PER_SEGMENT;
          dash++
        ) {
          this.writeLine(
            this.patternPositions,
            patternOffset,
            centerAngle,
            0,
            0,
          );

          patternOffset +=
            DASH_FLOATS;
        }
      }

      const visible0 =
        p0.visibleEnd;

      const visible1 =
        p1.visibleEnd;

      this.writeTriangle(
        this.alertPositions,
        i * TRIANGLE_FLOATS,
        a0,
        Math.min(
          alertRadius,
          visible0,
        ),
        a1,
        Math.min(
          alertRadius,
          visible1,
        ),
      );

      const waveOffset =
        i * 6;

      if (
        hot > 0.01 &&
        alertRadius <
          visible0 - 0.03 &&
        alertRadius <
          visible1 - 0.03
      ) {
        this.writeArcSegment(
          this.wavePositions,
          waveOffset,
          a0,
          a1,
          alertRadius,
        );
      } else {
        this.writeArcSegment(
          this.wavePositions,
          waveOffset,
          a0,
          a1,
          0,
        );
      }
    }

    for (const geometry of [
      this.solidGeometry,
      this.partialGeometry,
      this.patternGeometry,
      this.alertGeometry,
      this.waveGeometry,
    ]) {
      geometry.attributes
        .position.needsUpdate =
        true;
    }

    this.solidGeometry
      .computeBoundingSphere();

    this.partialGeometry
      .computeBoundingSphere();

    this.alertGeometry
      .computeBoundingSphere();

    this.group.rotation.y =
      heading;

    this.alertMesh.visible =
      hot > 0.01;

    this.waveLines.visible =
      hot > 0.01 &&
      hot < 0.999;

    this.alertMaterial.opacity =
      this.agent.state ===
        'chase'
        ? 0.26
        : 0.12 + hot * 0.08;
  }

  profileForAngle(
    origin,
    worldAngle,
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
      .projectedSightProfileAlongRay(
        origin,
        direction,
        this.radius,
      );
  }

  point(angle, distance) {
    return [
      Math.sin(angle) *
        distance,
      0,
      Math.cos(angle) *
        distance,
    ];
  }

  writeTriangle(
    target,
    offset,
    a0,
    d0,
    a1,
    d1,
  ) {
    const p0 =
      this.point(a0, d0);

    const p1 =
      this.point(a1, d1);

    target.set(
      [
        0, 0, 0,
        ...p0,
        ...p1,
      ],
      offset,
    );
  }

  writeQuad(
    target,
    offset,
    a0,
    start0,
    end0,
    a1,
    start1,
    end1,
  ) {
    const s0 =
      this.point(a0, start0);
    const e0 =
      this.point(a0, end0);
    const s1 =
      this.point(a1, start1);
    const e1 =
      this.point(a1, end1);

    target.set(
      [
        ...s0,
        ...e0,
        ...e1,
        ...s0,
        ...e1,
        ...s1,
      ],
      offset,
    );
  }

  writeLine(
    target,
    offset,
    angle,
    d0,
    d1,
  ) {
    const p0 =
      this.point(angle, d0);
    const p1 =
      this.point(angle, d1);

    target.set(
      [
        ...p0,
        ...p1,
      ],
      offset,
    );
  }

  writeArcSegment(
    target,
    offset,
    a0,
    a1,
    distance,
  ) {
    const p0 =
      this.point(a0, distance);
    const p1 =
      this.point(a1, distance);

    target.set(
      [
        ...p0,
        ...p1,
      ],
      offset,
    );
  }
}
