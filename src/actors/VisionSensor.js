import * as THREE from 'three';

export class VisionSensor {
  constructor({
    distance,
    angleDeg,
    collision,
  }) {
    this.distance = distance;
    this.angle =
      THREE.MathUtils.degToRad(
        angleDeg,
      );
    this.collision = collision;
  }

  visibility(
    observerEye,
    forward,
    targetEye,
  ) {
    const horizontal =
      new THREE.Vector3(
        targetEye.x -
          observerEye.x,
        0,
        targetEye.z -
          observerEye.z,
      );

    const distance =
      horizontal.length();

    if (
      distance > this.distance ||
      distance < 0.001
    ) {
      return 0;
    }

    horizontal.normalize();

    const flatForward =
      forward.clone();

    flatForward.y = 0;
    flatForward.normalize();

    const dot =
      THREE.MathUtils.clamp(
        flatForward.dot(
          horizontal,
        ),
        -1,
        1,
      );

    const angle =
      Math.acos(dot);

    if (
      angle >
      this.angle * 0.5
    ) {
      return 0;
    }

    // Head / eye visibility decides whether the target is visible at all.
    if (
      this.collision
        .blocksSight(
          observerEye,
          targetEye,
        )
    ) {
      return 0;
    }

    // A second, lower sample distinguishes full exposure from low-cover
    // exposure. A standing player behind a desk can still be seen, but
    // only partially; a crouched player whose eye is below the desk's
    // sight volume is already rejected by the head test above.
    const bodyHeight =
      targetEye.y > 1.2
        ? 0.98
        : 0.55;

    const bodyPoint =
      new THREE.Vector3(
        targetEye.x,
        bodyHeight,
        targetEye.z,
      );

    const partiallyCovered =
      this.collision
        .blocksSight(
          observerEye,
          bodyPoint,
        );

    const centerFactor =
      1 -
      angle /
        (this.angle * 0.5);

    const distanceFactor =
      1 -
      distance /
        this.distance;

    const baseVisibility =
      THREE.MathUtils.clamp(
        0.35 +
          centerFactor * 0.4 +
          distanceFactor * 0.25,
        0,
        1,
      );

    return (
      baseVisibility *
      (
        partiallyCovered
          ? 0.46
          : 1
      )
    );
  }
}
