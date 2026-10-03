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
    this.builder = new OfficeBuilder(scene, this.collision, data);
    this.builder.build();

    this.player = new PlayerController({
      input,
      collision: this.collision,
      spawn: data.playerSpawn
    });
    scene.add(this.player.visual.group);

    this.npcs = data.npcs.map(config => {
      const agent = new NpcAgent(config, this.collision);
      const cone = new VisionConeVisual(agent);
      scene.add(cone.mesh);
      scene.add(agent.visual.group);
      return { agent, cone };
    });
  }

  update(dt, { phase, secondsAfterSix }) {
    const playerEnabled = phase === 'escape';
    this.player.update(dt, playerEnabled);

    let caughtBy = null;
    let maxDetection = 0;

    for (const entry of this.npcs) {
      const { agent, cone } = entry;

      if (agent.config.activeAfterSeconds != null) {
        agent.setEnabled(secondsAfterSix >= agent.config.activeAfterSeconds);
      }

      agent.update(dt, this.player, phase === 'escape');
      cone.update();

      maxDetection = Math.max(maxDetection, agent.detection);
      if (agent.justCaught) caughtBy = agent;
    }

    return { caughtBy, maxDetection };
  }

  isAtExtraction() {
    const target = new THREE.Vector3(...this.data.extraction.position);
    return this.player.position.distanceTo(target) <= this.data.extraction.radius;
  }

  reset() {
    this.player.reset(this.data.playerSpawn);
    for (const { agent, cone } of this.npcs) {
      agent.reset();
      cone.update();
    }
  }
}
