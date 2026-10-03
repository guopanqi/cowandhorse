export class MinigameManager {
  constructor(container) {
    this.container = container;
    this.registry = new Map();
    this.active = null;
  }

  register(id, factory) {
    this.registry.set(id, factory);
  }

  start(id, context) {
    if (this.active) this.stop();
    const factory = this.registry.get(id);
    if (!factory) throw new Error(`Unknown minigame: ${id}`);
    this.active = factory();
    this.active.mount(this.container, {
      ...context,
      finish: (result) => {
        const callback = context.onComplete;
        this.stop();
        callback?.(result);
      }
    });
  }

  update(dt) {
    this.active?.update?.(dt);
  }

  stop() {
    this.active?.unmount?.();
    this.container.innerHTML = '';
    this.container.classList.remove('active');
    this.active = null;
  }
}
