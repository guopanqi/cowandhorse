export class LogoBiggerGame {
  constructor() {
    this.progress = 0;
    this.timeLeft = 8;
    this.context = null;
    this.onClick = this.onClick.bind(this);
  }

  mount(container, context) {
    this.container = container;
    this.context = context;
    container.classList.add('active');
    container.innerHTML = `
      <section class="minigame-card">
        <p class="eyebrow">${context.npcRole} · ${context.title}</p>
        <h2>LOGO 再大一点</h2>
        <p class="manager-line">“整体感觉差一点。Logo 再大一点。”</p>
        <button class="logo-target" type="button">C&H</button>
        <div class="minigame-meta">
          <span>点击 Logo 放大</span>
          <strong data-timer>8.0s</strong>
        </div>
      </section>
    `;
    this.button = container.querySelector('.logo-target');
    this.timer = container.querySelector('[data-timer]');
    this.button.addEventListener('click', this.onClick);
  }

  onClick() {
    this.progress += 1;
    const scale = Math.min(3.1, 1 + this.progress * 0.27);
    this.button.style.transform = `scale(${scale})`;
    if (this.progress >= 7) this.context.finish({ success: true });
  }

  update(dt) {
    this.timeLeft -= dt;
    if (this.timer) this.timer.textContent = `${Math.max(0, this.timeLeft).toFixed(1)}s`;
    if (this.timeLeft <= 0) this.context.finish({ success: false });
  }

  unmount() {
    this.button?.removeEventListener('click', this.onClick);
  }
}
