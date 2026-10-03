import * as THREE from 'three';
import { CollisionWorld } from './CollisionWorld.js';
import { DataDrivenOfficeBuilder } from './DataDrivenOfficeBuilder.js';
import { ExtractionZone } from './ExtractionZone.js';
import { OfficeEventDirector } from '../game/OfficeEventDirector.js';
import { NavigationGraph } from './NavigationGraph.js';
import { PlayerController } from '../actors/PlayerController.js';
import { NpcAgent } from '../actors/NpcAgent.js';
import { VisionConeVisual } from '../presentation/VisionConeVisual.js';
import { SafeInteractionSystem } from '../game/SafeInteractionSystem.js';

export class OfficeLevel {
  constructor({ scene, input, data }) {
    this.scene = scene;
    this.input = input;
    this.data = data;

    this.runtimeGroup = new THREE.Group();
    this.runtimeGroup.name = 'LevelRuntime';
    this.scene.add(this.runtimeGroup);

    this.collision = new CollisionWorld();

    this.builder = new DataDrivenOfficeBuilder(
      scene,
      this.collision,
      data,
    );
    this.builder.build();

    this.navigation = new NavigationGraph(
      data.navigation,
      this.collision,
      0.3,
    );

    this.player = new PlayerController({
      input,
      collision: this.collision,
      spawn: data.playerSpawn,
    });
    this.runtimeGroup.add(
      this.player.visual.group,
    );

    this.interactions =
      new SafeInteractionSystem({
        interactions:
          data.interactions ?? [],
        player: this.player,
        input: this.input,
      });

    this.npcs = data.npcs.map(config => {
      const agent = new NpcAgent(
        config,
        this.collision,
        this.navigation,
      );

      const cone =
        new VisionConeVisual(
          agent,
          this.collision,
          this.player,
        );

      this.runtimeGroup.add(
        cone.mesh,
        agent.visual.group,
      );

      return { agent, cone };
    });

    this.extraction =
      new ExtractionZone({
        position:
          data.extraction.position,
        radius:
          data.extraction.radius,
        callSeconds:
          data.extraction.callSeconds,
      });

    this.events =
      new OfficeEventDirector(data);

    this.editorMode = false;
  }

  get agents() {
    return this.npcs.map(
      entry => entry.agent,
    );
  }

  setEditorMode(value) {
    this.editorMode = value;

    this.player.visual.group.visible =
      !value;

    for (
      const { agent, cone }
      of this.npcs
    ) {
      agent.visual.group.visible = true;
      cone.mesh.visible = true;
      cone.update();
    }
  }

  update(dt, { phase }) {
    const worldActive =
      phase === 'prep' ||
      phase === 'escape';

    const threatBlocksInteraction =
      this.agents.some(
        agent =>
          agent.state === 'chase' ||
          agent.state === 'capture' ||
          agent.state === 'capture-ready' ||
          agent.detection > 0.55,
      );

    let interaction =
      this.interactions.update({
        enabled: worldActive,
        canEnter:
          !threatBlocksInteraction,
      });

    const canMove =
      worldActive &&
      !interaction.active;

    const moveRegion =
      phase === 'prep'
        ? this.data.prepZone
        : null;

    this.player.update(dt, {
      enabled: canMove,
      moveRegion,
    });

    this.interactions.refreshNearby();
    interaction =
      this.interactions.state;

    let caughtBy = null;
    let maxDetection = 0;
    let isChased = false;

    for (
      const { agent, cone }
      of this.npcs
    ) {
      if (worldActive) {
        agent.update(
          dt,
          this.player,
          phase === 'escape' &&
            !interaction.safe,
        );
      }

      cone.update();

      maxDetection = Math.max(
        maxDetection,
        agent.detection,
      );

      isChased ||=
        agent.state === 'chase';

      if (
        phase === 'escape' &&
        agent.justCaught
      ) {
        caughtBy = agent;
      }
    }

    const extraction =
      this.extraction.update(
        this.player.position,
        dt,
        phase === 'escape',
      );

    if (extraction.justCalled) {
      this.events
        .handleExtractionCalled(
          this.agents,
        );
    }

    this.builder
      .setExtractionState(
        extraction.state,
        extraction.progress,
      );

    return {
      caughtBy,
      maxDetection,
      isChased,
      extraction,
      interaction,
    };
  }

  reset() {
    this.player.reset(
      this.data.playerSpawn,
    );

    this.interactions.reset();

    for (
      const { agent, cone }
      of this.npcs
    ) {
      agent.reset();
      cone.update();
    }

    this.extraction.reset();
    this.events.reset();

    this.builder
      .setExtractionState(
        'idle',
        0,
      );
  }

  dispose() {
    this.scene.remove(
      this.runtimeGroup,
    );

    this.runtimeGroup.traverse(
      object => {
        object.geometry?.dispose?.();

        if (
          object.material &&
          !Array.isArray(
            object.material,
          )
        ) {
          object.material.dispose?.();
        }
      },
    );

    this.builder.dispose();
    this.npcs.length = 0;
  }
}
