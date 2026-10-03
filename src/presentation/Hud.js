export class Hud {
  constructor(root) {
    this.root = root;
    this.root.innerHTML = `
      <div class="hud">
        <div class="mission-panel">
          <p class="eyebrow">MISSION</p>
          <strong data-objective>距离下班还有 10 秒</strong>
          <span data-subtitle>在自己的工位附近活动，别太早暴露意图。</span>
        </div>

        <div class="clock-panel">
          <span data-clock>17:59:50</span>
          <small>OFFICE TIME</small>
        </div>

        <div class="status-panel">
          <label>精力 <span data-energy-text>100</span></label>
          <div class="bar"><i data-energy></i></div>

          <label>警戒 <span data-danger-text>安全</span></label>
          <div class="bar danger"><i data-danger></i></div>

          <label class="stance-row">姿态 <span data-stance>站立</span></label>
        </div>

        <div class="controls">WASD 移动 · SHIFT 奔跑 · C 蹲伏 / 站起</div>

        <div class="announcement" data-announcement></div>
        <div class="result-card" data-result hidden></div>
      </div>
    `;

    this.clock =
      root.querySelector('[data-clock]');
    this.objective =
      root.querySelector('[data-objective]');
    this.subtitle =
      root.querySelector('[data-subtitle]');
    this.energy =
      root.querySelector('[data-energy]');
    this.energyText =
      root.querySelector('[data-energy-text]');
    this.danger =
      root.querySelector('[data-danger]');
    this.dangerText =
      root.querySelector('[data-danger-text]');
    this.stance =
      root.querySelector('[data-stance]');
    this.announcement =
      root.querySelector('[data-announcement]');
    this.result =
      root.querySelector('[data-result]');

    this.announceTimer = 0;
  }

  update(
    {
      clock,
      resources,
      phase,
      maxDetection = 0,
      isChased = false,
      isCrouched = false,
    },
    dt,
  ) {
    this.clock.textContent =
      clock.formatted;

    this.energy.style.width =
      `${resources.energy}%`;

    this.energyText.textContent =
      Math.round(resources.energy);

    this.danger.style.width =
      `${Math.min(
        100,
        maxDetection * 100,
      )}%`;

    this.dangerText.textContent =
      isChased
        ? '追捕中'
        : maxDetection > 0.72
          ? '即将暴露'
          : maxDetection > 0.28
            ? '被注意'
            : '安全';

    this.stance.textContent =
      isCrouched
        ? '蹲伏'
        : '站立';

    if (phase === 'prep') {
      const remain = Math.max(
        0,
        Math.ceil(
          18 * 3600 -
            clock.seconds,
        ),
      );

      this.objective.textContent =
        `距离下班还有 ${remain} 秒`;

      this.subtitle.textContent =
        '可以在工位附近移动。观察一下领导都在干什么。';
    } else if (phase === 'escape') {
      this.objective.textContent =
        '离开办公室';

      this.subtitle.textContent =
        isChased
          ? '甩掉他。利用拐角和高柜切断视线。'
          : '左边掩体多，中央最快，右边要看经理的节奏。';
    } else if (phase === 'capture') {
      this.objective.textContent =
        '被抓住了';

      this.subtitle.textContent =
        '……';

      this.dangerText.textContent =
        '完了';
    } else if (phase === 'minigame') {
      this.objective.textContent =
        '加班中';

      this.subtitle.textContent =
        '处理得越好，浪费的时间越少。';
    }

    if (this.announceTimer > 0) {
      this.announceTimer -= dt;

      if (this.announceTimer <= 0) {
        this.announcement.classList.remove(
          'show',
        );
      }
    }
  }

  announce(text) {
    this.announcement.textContent = text;
    this.announcement.classList.add(
      'show',
    );
    this.announceTimer = 2.2;
  }

  showResult(title, detail) {
    this.result.hidden = false;

    this.result.innerHTML = `
      <p class="eyebrow">END OF DAY</p>
      <h2>${title}</h2>
      <p>${detail}</p>
      <span>按 R 再来一次</span>
    `;
  }

  hideResult() {
    this.result.hidden = true;
  }
}
