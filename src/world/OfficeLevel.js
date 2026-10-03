import * as THREE from 'three';
import { CollisionWorld } from './CollisionWorld.js';
import { OfficeBuilder } from './OfficeBuilder.js';
import { PlayerController } from '../actors/PlayerController.js';
import { NpcAgent } from '../actors/NpcAgent.js';
import { VisionConeVisual } from '../presentation/VisionConeVisual.js';

export class OfficeLevel {
  constructor({ scene, input, data }) {
    this.scene = scene;
    this.input = input;
    this.data = data;

    this.collision = new CollisionWorld();
    this.builder = new OfficeBuilder(
      scene,
      this.collision,
      data,
    );
    this.builder.build();

    this.player = new PlayerController({
      input,
      collision: this.collision,
      spawn: data.playerSpawn,
    });
    scene.add(this.player.visual.group);

    this.npcs = data.npcs.map(config => {
      const agent = new NpcAgent(
        config,
        this.collision,
      );
      const cone = new VisionConeVisual(agent);

      scene.add(cone.mesh);
      scene.add(agent.visual.group);

      return { agent, cone };
    });
  }

  get agents() {
    return this.npcs.map(entry => entry.agent);
  }

  update(dt, { phase }) {
    const canMove =
      phase === 'prep' || phase === 'escape';

    const moveRegion =
      phase === 'prep'
        ? this.data.prepZone
        : null;

    this.player.update(dt, {
      enabled: canMove,
      moveRegion,
    });

    const worldActive =
      phase === 'prep' || phase === 'escape';

    let caughtBy = null;
    let maxDetection = 0;
    let isChased = false;

    for (const { agent, cone } of this.npcs) {
      if (worldActive) {
        agent.update(
          dt,
          this.player,
          phase === 'escape',
        );
      }

      cone.update();

      maxDetection = Math.max(
        maxDetection,
        agent.detection,
      );

      isChased ||= agent.state === 'chase';

      if (
        phase === 'escape' &&
        agent.justCaught
      ) {
        caughtBy = agent;
      }
    }

    return {
      caughtBy,
      maxDetection,
      isChased,
    };
  }

  isAtExtraction() {
    const target = new THREE.Vector3(
      ...this.data.extraction.position,
    );

    return (
      this.player.position.distanceTo(target) <=
      this.data.extraction.radius
    );
  }

  reset() {
    this.player.reset(
      this.data.playerSpawn,
    );

    for (const { agent, cone } of this.npcs) {
      agent.reset();
      cone.update();
    }
  }
}
