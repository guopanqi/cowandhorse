export class Hud {
  constructor(root) {
    this.root = root;
    this.root.innerHTML = `
      <div class="hud">
        <div class="mission-panel">
          <p class="eyebrow">MISSION</p>
          <strong data-objective>距离下班还有 10 秒</strong>
          <span data-subtitle>先别表现得太急。</span>
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
        </div>

        <div class="controls">WASD 移动 · SHIFT 奔跑</div>

        <div class="announcement" data-announcement></div>
        <div class="result-card" data-result hidden></div>
      </div>
    `;

    this.clock = root.querySelector('[data-clock]');
    this.objective = root.querySelector('[data-objective]');
    this.subtitle = root.querySelector('[data-subtitle]');
    this.energy = root.querySelector('[data-energy]');
    this.energyText = root.querySelector('[data-energy-text]');
    this.danger = root.querySelector('[data-danger]');
    this.dangerText = root.querySelector('[data-danger-text]');
    this.announcement = root.querySelector('[data-announcement]');
    this.result = root.querySelector('[data-result]');
    this.announceTimer = 0;
  }

  update({ clock, resources, phase, maxDetection = 0 }, dt) {
    this.clock.textContent = clock.formatted;
    this.energy.style.width = `${resources.energy}%`;
    this.energyText.textContent = Math.round(resources.energy);
    this.danger.style.width = `${Math.min(100, maxDetection * 100)}%`;
    this.dangerText.textContent = maxDetection > 0.72 ? '危险' : maxDetection > 0.2 ? '有人看你' : '安全';

    if (phase === 'prep') {
      const remain = Math.max(0, Math.ceil(18 * 3600 - clock.seconds));
      this.objective.textContent = `距离下班还有 ${remain} 秒`;
      this.subtitle.textContent = '先别表现得太急。';
    } else if (phase === 'escape') {
      this.objective.textContent = '离开办公室';
      this.subtitle.textContent = '别让任何能安排工作的人看见你。';
    } else if (phase === 'minigame') {
      this.objective.textContent = '加班中';
      this.subtitle.textContent = '处理完，继续逃。';
    }

    if (this.announceTimer > 0) {
      this.announceTimer -= dt;
      if (this.announceTimer <= 0) this.announcement.classList.remove('show');
    }
  }

  announce(text) {
    this.announcement.textContent = text;
    this.announcement.classList.add('show');
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
