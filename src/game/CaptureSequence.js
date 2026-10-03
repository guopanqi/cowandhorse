import * as THREE from 'three';

export class CaptureSequence {
  constructor({ camera, bubbles }) {
    this.camera = camera;
    this.bubbles = bubbles;
    this.active = false;
    this.stage = 'idle';
    this.timer = 0;
    this.npc = null;
    this.player = null;
    this.onComplete = null;
    this.lineShown = false;
  }

  begin(npc, player, onComplete) {
    if (this.active) return;

    this.active = true;
    this.stage = 'approach';
    this.timer = 0;
    this.npc = npc;
    this.player = player;
    this.onComplete = onComplete;
    this.lineShown = false;

    npc.beginCapture();
    player.visual.setPose('caught');
    this.camera.beginCapture(player, npc);
  }

  update(dt) {
    if (!this.active) return;

    this.timer += dt;

    if (this.stage === 'approach') {
      const reached = this.npc.updateCaptureApproach(
        dt,
        this.player.position,
      );

      if (reached) {
        this.stage = 'tap';
        this.timer = 0;
        this.npc.visual.setPose('tap');
      }
      return;
    }

    if (this.stage === 'tap') {
      if (!this.lineShown && this.timer >= 0.42) {
        this.lineShown = true;
        this.bubbles.showSpeech(
          this.npc,
          this.npc.config.catchLine ?? '你先别走。',
        );
      }

      if (this.timer >= 1.55) {
        const npc = this.npc;
        const callback = this.onComplete;

        this.bubbles.hideSpeech();
        this.camera.endCapture();

        this.active = false;
        this.stage = 'idle';
        this.timer = 0;
        this.npc = null;
        this.player = null;
        this.onComplete = null;

        callback?.(npc);
      }
    }
  }

  reset() {
    this.bubbles.hideSpeech();
    this.camera.endCapture();
    this.active = false;
    this.stage = 'idle';
    this.timer = 0;
    this.npc = null;
    this.player = null;
    this.onComplete = null;
    this.lineShown = false;
  }
}
