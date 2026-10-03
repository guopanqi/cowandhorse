import * as THREE from 'three';

export class NavigationGraph {
  constructor(data, collision, agentRadius = 0.3) {
    this.collision = collision;
    this.agentRadius = agentRadius;
    this.nodes = new Map();
    this.edges = new Map();

    for (const node of data?.nodes ?? []) {
      this.nodes.set(
        node.id,
        new THREE.Vector3(...node.position),
      );
      this.edges.set(node.id, []);
    }

    for (const [a, b] of data?.edges ?? []) {
      if (!this.nodes.has(a) || !this.nodes.has(b)) continue;

      const pa = this.nodes.get(a);
      const pb = this.nodes.get(b);

      if (
        !this.collision.canTraverseSegment(
          pa,
          pb,
          this.agentRadius,
        )
      ) {
        continue;
      }

      const cost = pa.distanceTo(pb);
      this.edges.get(a).push({ id: b, cost });
      this.edges.get(b).push({ id: a, cost });
    }
  }

  nearestReachableNode(point) {
    let best = null;
    let bestDistance = Infinity;

    for (const [id, position] of this.nodes) {
      const distance = point.distanceTo(position);

      if (distance >= bestDistance) continue;

      if (
        this.collision.canTraverseSegment(
          point,
          position,
          this.agentRadius,
        )
      ) {
        best = id;
        bestDistance = distance;
      }
    }

    if (best) return best;

    for (const [id, position] of this.nodes) {
      const distance = point.distanceTo(position);

      if (distance < bestDistance) {
        best = id;
        bestDistance = distance;
      }
    }

    return best;
  }

  findPath(from, to) {
    if (
      this.collision.canTraverseSegment(
        from,
        to,
        this.agentRadius,
      )
    ) {
      return [to.clone()];
    }

    const start = this.nearestReachableNode(from);
    const goal = this.nearestReachableNode(to);

    if (!start || !goal) return [];

    const open = new Set([start]);
    const cameFrom = new Map();
    const g = new Map([[start, 0]]);
    const f = new Map([
      [
        start,
        this.nodes.get(start).distanceTo(
          this.nodes.get(goal),
        ),
      ],
    ]);

    while (open.size > 0) {
      let current = null;
      let currentScore = Infinity;

      for (const id of open) {
        const score = f.get(id) ?? Infinity;

        if (score < currentScore) {
          current = id;
          currentScore = score;
        }
      }

      if (current === goal) {
        const ids = [current];

        while (cameFrom.has(current)) {
          current = cameFrom.get(current);
          ids.push(current);
        }

        ids.reverse();

        const points = ids
          .slice(1)
          .map(id => this.nodes.get(id).clone());

        const last =
          points.at(-1) ??
          this.nodes.get(start).clone();

        if (
          this.collision.canTraverseSegment(
            last,
            to,
            this.agentRadius,
          )
        ) {
          points.push(to.clone());
        }

        return points;
      }

      open.delete(current);

      for (const neighbor of this.edges.get(current) ?? []) {
        const tentative =
          (g.get(current) ?? Infinity) +
          neighbor.cost;

        if (
          tentative <
          (g.get(neighbor.id) ?? Infinity)
        ) {
          cameFrom.set(neighbor.id, current);
          g.set(neighbor.id, tentative);

          const heuristic =
            this.nodes
              .get(neighbor.id)
              .distanceTo(
                this.nodes.get(goal),
              );

          f.set(
            neighbor.id,
            tentative + heuristic,
          );

          open.add(neighbor.id);
        }
      }
    }

    return [];
  }
}
