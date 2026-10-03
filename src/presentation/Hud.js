export class Hud {
  constructor(root, { onRestart = null } = {}) {
    this.root = root;
    this.onRestart = onRestart;

    this.onClick = event => {
      if (event.target.closest('[data-restart]')) {
        this.onRestart?.();
      }
    };

    this.root.addEventListener('click', this.onClick);

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

        <div class="controls">WASD 移动 · SHIFT 奔跑 · C 蹲伏 · E 交互</div>

        <div class="interaction-prompt" data-interaction-prompt hidden></div>
        <div class="announcement" data-announcement></div>
        <div class="result-card" data-result hidden></div>
      </div>
    `;

    this.clock =
      root.querySelector(
        '[data-clock]',
      );

    this.objective =
      root.querySelector(
        '[data-objective]',
      );

    this.subtitle =
      root.querySelector(
        '[data-subtitle]',
      );

    this.energy =
      root.querySelector(
        '[data-energy]',
      );

    this.energyText =
      root.querySelector(
        '[data-energy-text]',
      );

    this.danger =
      root.querySelector(
        '[data-danger]',
      );

    this.dangerText =
      root.querySelector(
        '[data-danger-text]',
      );

    this.stance =
      root.querySelector(
        '[data-stance]',
      );

    this.interactionPrompt =
      root.querySelector(
        '[data-interaction-prompt]',
      );

    this.announcement =
      root.querySelector(
        '[data-announcement]',
      );

    this.result =
      root.querySelector(
        '[data-result]',
      );

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
      extraction = null,
      interaction = null,
    },
    dt,
  ) {
    this.clock.textContent =
      clock.formatted;

    this.energy.style.width =
      `${resources.energy}%`;

    this.energyText.textContent =
      Math.round(
        resources.energy,
      );

    this.danger.style.width =
      `${Math.min(
        100,
        maxDetection * 100,
      )}%`;

    this.dangerText.textContent =
      interaction?.safe
        ? '伪装中'
        : isChased
          ? '追捕中'
        : maxDetection > 0.72
          ? '即将暴露'
          : maxDetection > 0.28
            ? '被注意'
            : '安全';

    this.stance.textContent =
      interaction?.active
        ? interaction.label
        : isCrouched
          ? '蹲伏'
          : '站立';

    if (interaction?.prompt) {
      this.interactionPrompt.hidden = false;
      this.interactionPrompt.textContent =
        interaction.prompt;
      this.interactionPrompt.classList.toggle(
        'active',
        Boolean(interaction.active),
      );
    } else {
      this.interactionPrompt.hidden = true;
      this.interactionPrompt.textContent = '';
      this.interactionPrompt.classList.remove('active');
    }

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
        interaction?.active
          ? '你还坐在自己的电脑前。按 E 起身，再观察离开的时机。'
          : '可以在工位附近移动。观察一下领导都在干什么。';
    } else if (
      phase === 'escape'
    ) {
      if (
        extraction?.state ===
        'calling'
      ) {
        const percent =
          Math.round(
            extraction.progress *
              100,
          );

        this.objective.textContent =
          '电梯正在上来';

        this.subtitle.textContent =
          `坚持一下 · ${percent}% · 有人好像往这边来了`;
      } else if (
        extraction?.state ===
        'ready'
      ) {
        this.objective.textContent =
          '电梯到了';

        this.subtitle.textContent =
          '现在进去。';
      } else {
        this.objective.textContent =
          '离开办公室';

        this.subtitle.textContent =
          interaction?.active
            ? '暂时安全。等领导走开，再按 E 离开这个位置。'
            : isChased
              ? '甩掉他。利用拐角和高柜切断视线。'
              : '利用办公桌、饮水机和其他安全交互点隐藏意图。';
      }
    } else if (
      phase === 'capture'
    ) {
      this.objective.textContent =
        '被抓住了';

      this.subtitle.textContent =
        '……';

      this.dangerText.textContent =
        '完了';
    } else if (
      phase === 'minigame'
    ) {
      this.objective.textContent =
        '加班中';

      this.subtitle.textContent =
        '处理得越好，浪费的时间越少。';
    }

    if (
      this.announceTimer > 0
    ) {
      this.announceTimer -= dt;

      if (
        this.announceTimer <= 0
      ) {
        this.announcement
          .classList.remove(
            'show',
          );
      }
    }
  }

  announce(text) {
    this.announcement.textContent =
      text;

    this.announcement
      .classList.add('show');

    this.announceTimer = 2.2;
  }

  showResult(
    title,
    detail,
  ) {
    this.result.hidden = false;

    this.result.innerHTML = `
      <p class="eyebrow">END OF DAY</p>
      <h2>${title}</h2>
      <p>${detail}</p>
      <button class="restart-button" data-restart type="button">再来一次</button>
      <span class="keyboard-restart">键盘按 R</span>
    `;
  }

  hideResult() {
    this.result.hidden = true;
  }
}
