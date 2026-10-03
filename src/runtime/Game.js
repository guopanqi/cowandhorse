import { Renderer } from './Renderer.js';
import { Input } from './Input.js';
import { GameClock } from '../game/GameClock.js';
import { ResourceSystem } from '../game/ResourceSystem.js';
import { EncounterSystem } from '../game/EncounterSystem.js';
import { CaptureSequence } from '../game/CaptureSequence.js';
import { OfficeLevel } from '../world/OfficeLevel.js';
import { LevelLoader } from '../levels/LevelLoader.js';
import { EditorSession } from '../editor/EditorSession.js';
import { EditorController } from '../editor/EditorController.js';
import { PlaytestRecorder } from '../editor/PlaytestRecorder.js';
import { FollowCamera } from '../presentation/FollowCamera.js';
import { Hud } from '../presentation/Hud.js';
import { WorldBubbleLayer } from '../presentation/WorldBubbleLayer.js';
import { MobileControls } from '../presentation/MobileControls.js';
import { MinigameManager } from '../minigames/MinigameManager.js';
import { QuickSyncGame } from '../minigames/QuickSyncGame.js';
import { VersionHuntGame } from '../minigames/VersionHuntGame.js';

export class Game {
  constructor(root) {
    this.root = root;
    this.frameHandle = null;
    this.lastTime = 0;
    this.phase = 'boot';
    this.mode = 'play';
  }

  async start() {
    this.root.innerHTML = `
      <div class="game-shell">
        <div class="game-stage" data-stage></div>
        <div class="hud-layer" data-hud></div>
        <div class="mobile-input-layer" data-mobile-input></div>
        <div class="minigame-layer" data-minigame></div>

        <button class="editor-launch" data-editor-launch type="button">
          EDIT
        </button>

        <div class="editor-layer" data-editor-layer></div>
      </div>
    `;

    this.shell =
      this.root.querySelector(
        '.game-shell',
      );

    this.hudLayer =
      this.root.querySelector(
        '[data-hud]',
      );

    this.editorLaunch =
      this.root.querySelector(
        '[data-editor-launch]',
      );

    this.input = new Input();

    this.renderer = new Renderer(
      this.root.querySelector(
        '[data-stage]',
      ),
    );

    this.clock =
      new GameClock();

    this.resources =
      new ResourceSystem({
        energy: 100,
        failHour: 22,
      });

    this.minigames =
      new MinigameManager(
        this.root.querySelector(
          '[data-minigame]',
        ),
      );

    this.minigames.register(
      'quick-sync',
      () => new QuickSyncGame(),
    );

    this.minigames.register(
      'version-hunt',
      () => new VersionHuntGame(),
    );

    this.encounters =
      new EncounterSystem({
        clock: this.clock,
        resources: this.resources,
        minigames:
          this.minigames,
      });

    this.levelLoader =
      new LevelLoader();

    this.editorSession =
      new EditorSession({
        loader:
          this.levelLoader,
      });

    this.playtestRecorder =
      new PlaytestRecorder();

    const params =
      new URLSearchParams(
        window.location.search,
      );

    const levelId =
      params.get('level') ??
      'office-01';

    const editRequested =
      params.get('edit') === '1';

    const published =
      await this.levelLoader
        .loadPublished(levelId);

    const draft =
      editRequested
        ? this.editorSession
            .loadDraft(levelId)
        : null;

    this.editorSession.setLevel(
      draft ?? published,
    );

    this.currentLevelData =
      this.editorSession.level;

    this.createLevel(
      this.currentLevelData,
    );

    this.camera =
      new FollowCamera(
        this.renderer.camera,
      );

    this.camera.snap(
      this.level.player.position,
    );

    this.hud = new Hud(
      this.hudLayer,
      {
        onRestart: () => {
          this.input.pressVirtual(
            'KeyR',
          );
        },
      },
    );

    this.mobileControls =
      new MobileControls(
        this.root.querySelector(
          '[data-mobile-input]',
        ),
        this.input,
      );

    this.hasTouch =
      navigator.maxTouchPoints >
        0 ||
      window.matchMedia(
        '(pointer: coarse)',
      ).matches;

    this.bubbles =
      new WorldBubbleLayer(
        this.shell,
        this.renderer.camera,
      );

    this.capture =
      new CaptureSequence({
        camera: this.camera,
        bubbles: this.bubbles,
      });

    this.editor =
      new EditorController({
        root:
          this.root.querySelector(
            '[data-editor-layer]',
          ),
        renderer:
          this.renderer,
        session:
          this.editorSession,
        loader:
          this.levelLoader,
        recorder:
          this.playtestRecorder,

        onPlay: () =>
          this.enterPlayMode(),

        onRebuild:
          async (
            level,
            preserveRef,
          ) => {
            this.currentLevelData =
              level;

            await this.rebuildLevel({
              editorMode: true,
              preserveRef,
            });
          },

        onReplaceLevel:
          async level => {
            if (
              this.editorSession
                .level !== level
            ) {
              this.editorSession
                .setLevel(level);
            }

            this.currentLevelData =
              this.editorSession.level;

            await this.rebuildLevel({
              editorMode: true,
            });
          },
      });

    this.editorLaunch
      .addEventListener(
        'click',
        () =>
          this.enterEditorMode(),
      );

    this.onGlobalKeyDown =
      event => {
        if (
          event.code !== 'Tab' ||
          this.mode !== 'play'
        ) {
          return;
        }

        const tag =
          document.activeElement
            ?.tagName;

        if (
          tag === 'INPUT' ||
          tag === 'TEXTAREA' ||
          tag === 'SELECT'
        ) {
          return;
        }

        if (
          this.phase ===
            'minigame' ||
          this.phase ===
            'capture'
        ) {
          return;
        }

        event.preventDefault();
        this.enterEditorMode();
      };

    window.addEventListener(
      'keydown',
      this.onGlobalKeyDown,
    );

    this.lastTime =
      performance.now();

    this.loop =
      this.loop.bind(this);

    if (editRequested) {
      await this.enterEditorMode();
    } else {
      this.enterPlayMode({
        rebuild: false,
      });
    }

    this.frameHandle =
      requestAnimationFrame(
        this.loop,
      );
  }

  createLevel(data) {
    this.level?.dispose?.();

    this.bubbles?.clear?.();

    this.level =
      new OfficeLevel({
        scene:
          this.renderer.scene,
        input: this.input,
        data,
      });
  }

  async rebuildLevel({
    editorMode =
      this.mode === 'edit',
    preserveRef = null,
  } = {}) {
    this.createLevel(
      this.editorSession.level,
    );

    if (editorMode) {
      this.level.setEditorMode(
        true,
      );

      this.editor?.bindLevel(
        this.editorSession.level,
        this.level,
        preserveRef,
      );
    } else {
      this.camera.snap(
        this.level.player.position,
      );
    }
  }

  async enterEditorMode() {
    if (
      this.mode === 'edit'
    ) {
      return;
    }

    this.playtestRecorder
      ?.finish?.();

    this.mode = 'edit';
    this.phase = 'editor';

    this.capture?.reset?.();
    this.minigames?.stop?.();

    this.level.reset();
    this.level.setEditorMode(
      true,
    );

    this.hudLayer.classList.add(
      'editor-hidden',
    );

    this.editorLaunch.hidden =
      true;

    this.mobileControls
      ?.setVisible(false);

    this.bubbles
      ?.setVisible(false);

    this.editor.bindLevel(
      this.editorSession.level,
      this.level,
    );

    await this.editor.activate();
  }

  async enterPlayMode({
    rebuild = true,
  } = {}) {
    this.mode = 'play';

    this.editor?.deactivate?.();

    if (rebuild) {
      await this.rebuildLevel({
        editorMode: false,
      });
    } else {
      this.level.setEditorMode(
        false,
      );
    }

    this.capture?.reset?.();
    this.minigames?.stop?.();

    this.clock.reset();
    this.resources.reset();
    this.level.reset();

    this.camera.snap(
      this.level.player.position,
    );

    this.hud?.hideResult?.();

    this.hudLayer.classList.remove(
      'editor-hidden',
    );

    this.editorLaunch.hidden =
      false;

    this.bubbles
      ?.setVisible(true);

    this.phase = 'prep';
    this.lastTime =
      performance.now();

    this.playtestRecorder.start(
      this.editorSession.level.id,
      this.level.player.position,
    );

    this.hud?.announce?.(
      '17:59:50',
    );
  }

  loop(now) {
    const dt = Math.min(
      0.05,
      Math.max(
        0,
        (now - this.lastTime) /
          1000,
      ),
    );

    this.lastTime = now;

    if (this.mode === 'edit') {
      this.level.update(
        dt,
        { phase: 'editor' },
      );

      this.editor.update();
      this.renderer.render();
      this.input.endFrame();

      this.frameHandle =
        requestAnimationFrame(
          this.loop,
        );

      return;
    }

    if (
      this.input.consume(
        'KeyR',
      ) &&
      (
        this.phase ===
          'success' ||
        this.phase ===
          'failure'
      )
    ) {
      this.reset();
    }

    if (
      this.phase === 'prep' ||
      this.phase === 'escape'
    ) {
      this.clock.update(dt);
    }

    if (
      this.phase === 'prep' &&
      this.clock.isAfterSix
    ) {
      this.phase = 'escape';
      this.hud.announce(
        '18:00 · 下班！',
      );
    }

    const levelState =
      this.level.update(
        dt,
        {
          phase:
            this.phase,
        },
      );

    if (
      this.phase ===
        'escape' &&
      levelState.caughtBy
    ) {
      this.beginCapture(
        levelState.caughtBy,
      );
    }

    if (
      this.phase ===
      'capture'
    ) {
      this.capture.update(dt);
    }

    if (
      this.phase ===
        'escape' &&
      levelState.extraction
        ?.escaped
    ) {
      this.finishSuccess();
    }

    if (
      (
        this.phase === 'prep' ||
        this.phase ===
          'escape'
      ) &&
      this.resources.failed(
        this.clock,
      )
    ) {
      this.finishFailure();
    }

    this.minigames.update(dt);

    if (
      this.phase === 'prep' ||
      this.phase === 'escape'
    ) {
      this.playtestRecorder.update(
        dt,
        this.level.player.position,
      );
    }

    this.camera.update(
      this.level.player
        .position,
      dt,
    );

    this.bubbles.update(
      this.level.agents,
    );

    this.mobileControls
      .setVisible(
        this.hasTouch &&
        (
          this.phase ===
            'prep' ||
          this.phase ===
            'escape'
        ),
      );

    this.mobileControls
      .setCrouched(
        this.level.player
          .isCrouched,
      );

    this.mobileControls
      .setInteraction(
        levelState.interaction,
      );

    this.hud.update(
      {
        clock: this.clock,
        resources:
          this.resources,
        phase: this.phase,
        maxDetection:
          levelState
            .maxDetection,
        isChased:
          levelState
            .isChased,
        isCrouched:
          this.level.player
            .isCrouched,
        extraction:
          levelState
            .extraction,
        interaction:
          levelState
            .interaction,
      },
      dt,
    );

    this.renderer.render();
    this.input.endFrame();

    this.frameHandle =
      requestAnimationFrame(
        this.loop,
      );
  }

  beginCapture(npc) {
    if (
      this.phase ===
        'capture' ||
      this.phase ===
        'minigame'
    ) {
      return;
    }

    this.phase = 'capture';

    this.capture.begin(
      npc,
      this.level.player,
      caughtNpc => {
        this.beginOvertime(
          caughtNpc,
        );
      },
    );
  }

  beginOvertime(npc) {
    this.phase = 'minigame';

    this.encounters.begin(
      npc,
      ({ minutes }) => {
        npc.releaseAfterCapture();

        this.level.player
          .visual.setPose(
            this.level.player
              .isCrouched
              ? 'crouch'
              : 'idle',
          );

        if (
          this.resources.failed(
            this.clock,
          )
        ) {
          this.finishFailure();
          return;
        }

        this.phase =
          'escape';

        this.hud.announce(
          `+${minutes} 分钟 · 继续逃`,
        );
      },
    );
  }

  finishSuccess() {
    if (
      this.phase ===
      'success'
    ) {
      return;
    }

    this.phase = 'success';
    this.playtestRecorder.finish();

    this.hud.showResult(
      '准点逃生',
      `${this.clock.formatted} 离开公司 · 加班 ${this.resources.overtimeMinutes} 分钟`,
    );
  }

  finishFailure() {
    if (
      this.phase ===
      'failure'
    ) {
      return;
    }

    this.phase = 'failure';
    this.playtestRecorder.finish();
    this.capture.reset();
    this.minigames.stop();

    const reason =
      this.resources.energy <=
      0
        ? '精力耗尽。你默默坐回了工位。'
        : '太晚了。今天基本算住公司了。';

    this.hud.showResult(
      '今晚加班',
      reason,
    );
  }

  reset() {
    this.capture.reset();
    this.minigames.stop();

    this.clock.reset();
    this.resources.reset();
    this.level.reset();

    this.camera.snap(
      this.level.player
        .position,
    );

    this.hud.hideResult();

    this.phase = 'prep';

    this.hud.announce(
      '17:59:50',
    );
  }
}
