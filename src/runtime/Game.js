import { Renderer } from './Renderer.js';
import { Input } from './Input.js';
import { GameClock } from '../game/GameClock.js';
import { ResourceSystem } from '../game/ResourceSystem.js';
import { EncounterSystem } from '../game/EncounterSystem.js';
import { OfficeLevel } from '../world/OfficeLevel.js';
import { officeLevel } from '../data/officeLevel.js';
import { FollowCamera } from '../presentation/FollowCamera.js';
import { Hud } from '../presentation/Hud.js';
import { MinigameManager } from '../minigames/MinigameManager.js';
import { LogoBiggerGame } from '../minigames/LogoBiggerGame.js';
import { QuickSyncGame } from '../minigames/QuickSyncGame.js';

export class Game {
  constructor(root) {
    this.root = root;
    this.frameHandle = null;
    this.lastTime = 0;
    this.phase = 'boot';
  }

  start() {
    this.root.innerHTML = `
      <div class="game-shell">
        <div class="game-stage" data-stage></div>
        <div class="hud-layer" data-hud></div>
        <div class="minigame-layer" data-minigame></div>
      </div>
    `;

    this.input = new Input();
    this.renderer = new Renderer(
      this.root.querySelector('[data-stage]'),
    );
    this.clock = new GameClock();
    this.resources = new ResourceSystem({
      energy: 100,
      failHour: 22,
    });

    this.minigames = new MinigameManager(
      this.root.querySelector('[data-minigame]'),
    );
    this.minigames.register(
      'logo-bigger',
      () => new LogoBiggerGame(),
    );
    this.minigames.register(
      'quick-sync',
      () => new QuickSyncGame(),
    );

    this.encounters = new EncounterSystem({
      clock: this.clock,
      resources: this.resources,
      minigames: this.minigames,
    });

    this.level = new OfficeLevel({
      scene: this.renderer.scene,
      input: this.input,
      data: officeLevel,
    });

    this.camera = new FollowCamera(this.renderer.camera);
    this.camera.snap(this.level.player.position);

    this.hud = new Hud(
      this.root.querySelector('[data-hud]'),
    );

    this.phase = 'prep';
    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    this.frameHandle = requestAnimationFrame(this.loop);
  }

  loop(now) {
    const dt = Math.min(
      0.05,
      Math.max(0, (now - this.lastTime) / 1000),
    );
    this.lastTime = now;

    if (
      this.input.consume('KeyR') &&
      (this.phase === 'success' || this.phase === 'failure')
    ) {
      this.reset();
    }

    if (this.phase === 'prep' || this.phase === 'escape') {
      this.clock.update(dt);
    }

    if (this.phase === 'prep' && this.clock.isAfterSix) {
      this.phase = 'escape';
      this.hud.announce('18:00 · 下班！');
    }

    const levelState = this.level.update(dt, {
      phase: this.phase,
    });

    if (
      this.phase === 'escape' &&
      levelState.caughtBy
    ) {
      this.beginOvertime(levelState.caughtBy);
    }

    if (
      this.phase === 'escape' &&
      this.level.isAtExtraction()
    ) {
      this.finishSuccess();
    }

    if (
      (this.phase === 'prep' || this.phase === 'escape') &&
      this.resources.failed(this.clock)
    ) {
      this.finishFailure();
    }

    this.minigames.update(dt);
    this.camera.update(this.level.player.position, dt);

    this.hud.update({
      clock: this.clock,
      resources: this.resources,
      phase: this.phase,
      maxDetection: levelState.maxDetection,
      isChased: levelState.isChased,
      isCrouched: this.level.player.isCrouched,
    }, dt);

    this.renderer.render();
    this.input.endFrame();
    this.frameHandle = requestAnimationFrame(this.loop);
  }

  beginOvertime(npc) {
    this.phase = 'minigame';
    this.hud.announce(
      `${npc.config.role}： “你先别走。”`,
    );

    this.encounters.begin(npc, ({ minutes }) => {
      if (this.resources.failed(this.clock)) {
        this.finishFailure();
        return;
      }

      this.phase = 'escape';
      this.hud.announce(
        `+${minutes} 分钟 · 继续逃`,
      );
    });
  }

  finishSuccess() {
    if (this.phase === 'success') return;

    this.phase = 'success';
    this.hud.showResult(
      '准点逃生',
      `${this.clock.formatted} 离开公司 · 加班 ${this.resources.overtimeMinutes} 分钟`,
    );
  }

  finishFailure() {
    if (this.phase === 'failure') return;

    this.phase = 'failure';
    this.minigames.stop();

    const reason =
      this.resources.energy <= 0
        ? '精力耗尽。你默默坐回了工位。'
        : '太晚了。今天基本算住公司了。';

    this.hud.showResult('今晚加班', reason);
  }

  reset() {
    this.minigames.stop();
    this.clock.reset();
    this.resources.reset();
    this.level.reset();
    this.camera.snap(this.level.player.position);
    this.hud.hideResult();

    this.phase = 'prep';
    this.hud.announce('17:59:50');
  }
}
