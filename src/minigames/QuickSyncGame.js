export class QuickSyncGame {
  constructor() {
    this.context = null;
    this.timeLeft = 9;
    this.progress = 0;
    this.required = 4;
    this.cooldown = 0;
    this.onClick = this.onClick.bind(this);
    this.lines = [
      '“这个事情我们先拉齐一下。”',
      '“颗粒度还可以再细一点。”',
      '“最终还是要形成闭环。”',
      '“这个事情你再往前跟一下。”'
    ];
  }

  mount(container, context) {
    this.container = container;
    this.context = context;
    container.classList.add('active');
    container.innerHTML = `
      <section class="minigame-card meeting-game">
        <p class="eyebrow">${context.npcRole} · 快速同步</p>
        <h2>先快速碰一下</h2>
        <p class="meeting-line" data-line>${this.lines[0]}</p>
        <button class="meeting-button" type="button">我在听</button>
        <div class="meeting-progress" data-progress></div>
        <div class="minigame-meta">
          <span>别走神，跟上节奏</span>
          <strong data-timer>9.0s</strong>
        </div>
      </section>
    `;

    this.button = container.querySelector('.meeting-button');
    this.line = container.querySelector('[data-line]');
    this.progressEl = container.querySelector('[data-progress]');
    this.timer = container.querySelector('[data-timer]');
    this.button.addEventListener('click', this.onClick);
    this.renderProgress();
  }

  onClick() {
    if (this.cooldown > 0) return;
    this.progress += 1;
    this.cooldown = 0.55;

    if (this.progress >= this.required) {
      this.context.finish({ success: true });
      return;
    }

    this.line.textContent = this.lines[this.progress];
    this.button.textContent = ['收到', '明白', '我跟一下', '闭环'][this.progress % 4];
    this.renderProgress();
  }

  renderProgress() {
    this.progressEl.innerHTML = Array.from({ length: this.required }, (_, i) =>
      `<i class="${i < this.progress ? 'done' : ''}"></i>`
    ).join('');
  }

  update(dt) {
    this.timeLeft -= dt;
    this.cooldown = Math.max(0, this.cooldown - dt);
    if (this.button) this.button.disabled = this.cooldown > 0;
    if (this.timer) this.timer.textContent = `${Math.max(0, this.timeLeft).toFixed(1)}s`;
    if (this.timeLeft <= 0) this.context.finish({ success: false });
  }

  unmount() {
    this.button?.removeEventListener('click', this.onClick);
  }
}
