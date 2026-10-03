import * as THREE from 'three';
import { CollisionWorld } from '../world/CollisionWorld.js';
import { DataDrivenOfficeBuilder } from '../world/DataDrivenOfficeBuilder.js';
import { NavigationGraph } from '../world/NavigationGraph.js';

export function validateLevel(
  level,
  {
    playerRadius = 0.34,
    npcRadius = 0.3,
  } = {},
) {
  const scene = new THREE.Scene();
  const collision = new CollisionWorld();
  const builder =
    new DataDrivenOfficeBuilder(
      scene,
      collision,
      level,
    );

  builder.build();

  const navigation =
    new NavigationGraph(
      level.navigation,
      collision,
      playerRadius,
    );

  const errors = [];
  const warnings = [];
  const metrics = {
    objects:
      level.environment?.length ?? 0,
    interactions:
      level.interactions?.length ?? 0,
    navNodes:
      level.navigation?.nodes?.length ?? 0,
    navEdges:
      level.navigation?.edges?.length ?? 0,
    npcs:
      level.npcs?.length ?? 0,
    blockedEdges: 0,
    unreachableRoutineLegs: 0,
  };

  const fail = message =>
    errors.push(message);

  const warn = message =>
    warnings.push(message);

  const ids = new Set();

  for (
    const object of
    level.environment ?? []
  ) {
    if (!object.id) {
      fail('Environment object missing id');
      continue;
    }

    if (ids.has(object.id)) {
      fail(
        `Duplicate environment id: ${object.id}`,
      );
    }

    ids.add(object.id);

    if (
      !Array.isArray(object.position) ||
      object.position.length !== 3
    ) {
      fail(
        `Environment object ${object.id} has invalid position`,
      );
    }
  }

  const nodeById = new Map(
    (level.navigation?.nodes ?? [])
      .map(node => [
        node.id,
        new THREE.Vector3(
          ...node.position,
        ),
      ]),
  );

  for (
    const [
      a,
      b,
    ] of
    level.navigation?.edges ?? []
  ) {
    const from =
      nodeById.get(a);
    const to =
      nodeById.get(b);

    if (!from || !to) {
      fail(
        `Navigation edge references missing node: ${a} -> ${b}`,
      );
      continue;
    }

    if (
      !collision
        .canTraverseSegment(
          from,
          to,
          playerRadius,
        )
    ) {
      metrics.blockedEdges += 1;
      fail(
        `Navigation edge blocked: ${a} -> ${b}`,
      );
    }
  }

  const validatePoint = (
    point,
    label,
    radius,
  ) => {
    if (
      !Array.isArray(point) ||
      point.length !== 3
    ) {
      fail(
        `${label} has invalid position`,
      );
      return null;
    }

    const position =
      new THREE.Vector3(...point);

    if (
      collision.containsPoint(
        position.x,
        position.z,
        radius,
      )
    ) {
      fail(
        `${label} overlaps movement geometry`,
      );
    }

    return position;
  };

  const spawn = validatePoint(
    level.playerSpawn,
    'Player spawn',
    playerRadius,
  );

  const extraction =
    validatePoint(
      level.extraction?.position,
      'Extraction',
      playerRadius,
    );

  if (
    spawn &&
    extraction
  ) {
    const path =
      navigation.findPath(
        spawn,
        extraction,
      );

    if (
      !collision.canTraverseSegment(
        spawn,
        extraction,
        playerRadius,
      ) &&
      path.length === 0
    ) {
      fail(
        'No navigable route from player spawn to extraction',
      );
    }
  }

  for (
    const interaction of
    level.interactions ?? []
  ) {
    validatePoint(
      interaction.position,
      `Interaction ${interaction.id ?? interaction.type}`,
      0.12,
    );

    if (
      interaction.linkedObjectId &&
      !ids.has(
        interaction.linkedObjectId,
      )
    ) {
      warn(
        `Interaction ${interaction.id} links missing object ${interaction.linkedObjectId}`,
      );
    }
  }

  for (
    const npc of
    level.npcs ?? []
  ) {
    if (
      !npc.routine?.length
    ) {
      warn(
        `NPC ${npc.id} has no routine`,
      );
      continue;
    }

    let previous =
      validatePoint(
        npc.routine[0].position,
        `${npc.id} routine[0]`,
        npcRadius,
      );

    for (
      let i = 1;
      i < npc.routine.length;
      i++
    ) {
      const target =
        validatePoint(
          npc.routine[i].position,
          `${npc.id} routine[${i}]`,
          npcRadius,
        );

      if (
        !previous ||
        !target
      ) {
        previous = target;
        continue;
      }

      const path =
        navigation.findPath(
          previous,
          target,
        );

      if (
        !collision
          .canTraverseSegment(
            previous,
            target,
            npcRadius,
          ) &&
        path.length === 0
      ) {
        metrics.unreachableRoutineLegs += 1;
        fail(
          `${npc.id} cannot navigate routine[${i - 1}] -> routine[${i}]`,
        );
      }

      previous = target;
    }
  }

  for (
    const [
      eventName,
      event,
    ] of Object.entries(
      level.events ?? {},
    )
  ) {
    const npc =
      (level.npcs ?? [])
        .find(
          item =>
            item.id ===
            event.npcId,
        );

    if (!npc) {
      fail(
        `Event ${eventName} references missing NPC ${event.npcId}`,
      );
      continue;
    }

    let previous =
      npc.routine?.[0]
        ? new THREE.Vector3(
            ...npc.routine[0]
              .position,
          )
        : null;

    for (
      let i = 0;
      i <
      (event.routine?.length ?? 0);
      i++
    ) {
      const target =
        validatePoint(
          event.routine[i]
            .position,
          `event ${eventName} routine[${i}]`,
          npcRadius,
        );

      if (
        previous &&
        target
      ) {
        const path =
          navigation.findPath(
            previous,
            target,
          );

        if (
          !collision
            .canTraverseSegment(
              previous,
              target,
              npcRadius,
            ) &&
          path.length === 0
        ) {
          fail(
            `Event ${eventName} cannot navigate to routine[${i}]`,
          );
        }
      }

      previous = target;
    }
  }

  if (
    (level.environment ?? [])
      .filter(
        object =>
          object.type === 'elevator',
      )
      .length !== 1
  ) {
    warn(
      'Level should contain exactly one elevator object',
    );
  }

  builder.dispose();

  return {
    valid:
      errors.length === 0,
    errors,
    warnings,
    metrics,
  };
}
