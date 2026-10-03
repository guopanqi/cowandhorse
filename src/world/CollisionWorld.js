export class CollisionWorld {
  constructor() {
    this.colliders = [];
  }

  addBox({
    center,
    size,
    rotation = 0,
    movement = true,
    sight = true,
    label = 'collider',
  }) {
    const [x, y, z] = center;
    const [sx, sy, sz] = size;

    this.colliders.push({
      label,
      centerX: x,
      centerZ: z,
      halfX: sx * 0.5,
      halfZ: sz * 0.5,
      minY: y - sy * 0.5,
      maxY: y + sy * 0.5,
      rotation,
      cos: Math.cos(rotation),
      sin: Math.sin(rotation),
      movement,
      sight,
    });
  }

  pointInsideCollider(x, z, padding, collider) {
    const dx = x - collider.centerX;
    const dz = z - collider.centerZ;

    const localX =
      collider.cos * dx +
      collider.sin * dz;

    const localZ =
      -collider.sin * dx +
      collider.cos * dz;

    return (
      Math.abs(localX) <
        collider.halfX + padding &&
      Math.abs(localZ) <
        collider.halfZ + padding
    );
  }

  containsPoint(
    x,
    z,
    padding = 0,
  ) {
    return this.colliders.some(
      collider =>
        collider.movement &&
        this.pointInsideCollider(
          x,
          z,
          padding,
          collider,
        ),
    );
  }

  moveAndResolve(
    position,
    delta,
    radius = 0.34,
  ) {
    const next = position.clone();

    const candidateX =
      next.x + delta.x;

    if (
      !this.containsPoint(
        candidateX,
        next.z,
        radius,
      )
    ) {
      next.x = candidateX;
    }

    const candidateZ =
      next.z + delta.z;

    if (
      !this.containsPoint(
        next.x,
        candidateZ,
        radius,
      )
    ) {
      next.z = candidateZ;
    }

    return next;
  }

  blocksSight(from, to) {
    const dx = to.x - from.x;
    const dz = to.z - from.z;

    const horizontalDistance =
      Math.hypot(dx, dz);

    if (horizontalDistance <= 0.001) {
      return false;
    }

    const steps = Math.max(
      2,
      Math.ceil(horizontalDistance / 0.08),
    );

    for (let i = 1; i < steps; i++) {
      const t = i / steps;

      const x = from.x + dx * t;
      const y =
        from.y +
        (to.y - from.y) * t;
      const z = from.z + dz * t;

      const blocked =
        this.colliders.some(
          collider =>
            collider.sight &&
            y >= collider.minY &&
            y <= collider.maxY &&
            this.pointInsideCollider(
              x,
              z,
              0,
              collider,
            ),
        );

      if (blocked) return true;
    }

    return false;
  }

  canTraverseSegment(
    from,
    to,
    radius = 0.3,
  ) {
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    const distance = Math.hypot(dx, dz);

    if (distance <= 0.001) {
      return true;
    }

    const steps = Math.max(
      2,
      Math.ceil(distance / 0.08),
    );

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = from.x + dx * t;
      const z = from.z + dz * t;

      if (
        this.containsPoint(
          x,
          z,
          radius,
        )
      ) {
        return false;
      }
    }

    return true;
  }

  projectedSightProfileAlongRay(
    origin,
    direction,
    maxDistance,
    {
      partialOccluderHeight = 0.78,
      fullOccluderHeight = 1.45,
    } = {},
  ) {
    const stepSize = 0.07;

    let partialStart = null;
    let blockedStart = null;

    for (
      let distance = stepSize;
      distance <= maxDistance;
      distance += stepSize
    ) {
      const x =
        origin.x +
        direction.x * distance;

      const z =
        origin.z +
        direction.z * distance;

      let tallest = -Infinity;

      for (const collider of this.colliders) {
        if (
          !collider.sight ||
          !this.pointInsideCollider(
            x,
            z,
            0,
            collider,
          )
        ) {
          continue;
        }

        tallest = Math.max(
          tallest,
          collider.maxY,
        );
      }

      if (
        tallest >=
        fullOccluderHeight
      ) {
        blockedStart =
          Math.max(
            0,
            distance - stepSize,
          );
        break;
      }

      if (
        partialStart === null &&
        tallest >=
          partialOccluderHeight
      ) {
        partialStart =
          Math.max(
            0,
            distance - stepSize,
          );
      }
    }

    const blockedDistance =
      blockedStart ?? maxDistance;

    return {
      clearEnd:
        partialStart ??
        blockedDistance,
      partialStart,
      partialEnd:
        partialStart === null
          ? null
          : blockedDistance,
      blockedStart,
      visibleEnd:
        blockedDistance,
    };
  }

  projectedSightDistanceAlongRay(
    origin,
    direction,
    maxDistance,
    {
      minOccluderHeight = 0.55,
    } = {},
  ) {
    const stepSize = 0.07;

    for (
      let distance = stepSize;
      distance <= maxDistance;
      distance += stepSize
    ) {
      const x =
        origin.x +
        direction.x * distance;

      const z =
        origin.z +
        direction.z * distance;

      const blocked =
        this.colliders.some(
          collider =>
            collider.sight &&
            collider.maxY >=
              minOccluderHeight &&
            this.pointInsideCollider(
              x,
              z,
              0,
              collider,
            ),
        );

      if (blocked) {
        return Math.max(
          0,
          distance - stepSize,
        );
      }
    }

    return maxDistance;
  }

  sightDistanceAlongRay(
    origin,
    direction,
    maxDistance,
    targetHeight,
  ) {
    const stepSize = 0.07;

    for (
      let distance = stepSize;
      distance <= maxDistance;
      distance += stepSize
    ) {
      const t =
        distance / maxDistance;

      const x =
        origin.x +
        direction.x * distance;

      const z =
        origin.z +
        direction.z * distance;

      const y =
        origin.y +
        (targetHeight - origin.y) * t;

      const blocked =
        this.colliders.some(
          collider =>
            collider.sight &&
            y >= collider.minY &&
            y <= collider.maxY &&
            this.pointInsideCollider(
              x,
              z,
              0,
              collider,
            ),
        );

      if (blocked) {
        return Math.max(
          0,
          distance - stepSize,
        );
      }
    }

    return maxDistance;
  }
}
