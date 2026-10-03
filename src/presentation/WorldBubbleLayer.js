import * as THREE from 'three';

const ACTIVITY_LABELS = {
  sit: '💻',
  inspect: '📋',
  check: '🗂️',
  print: '🖨️',
  meeting: '💬',
  tea: '☕',
  read: '📰',
};

export class WorldBubbleLayer {
  constructor(root, camera) {
    this.camera = camera;
    this.root = document.createElement('div');
    this.root.className = 'world-bubble-layer';
    root.appendChild(this.root);

    this.entries = new Map();
    this.speech = null;
  }

  ensureActivity(agent) {
    let entry = this.entries.get(agent.config.id);
    if (entry) return entry;

    const element = document.createElement('div');
    element.className = 'activity-bubble';
    this.root.appendChild(element);

    entry = { element, agent };
    this.entries.set(agent.config.id, entry);
    return entry;
  }

  showSpeech(agent, text) {
    this.hideSpeech();

    const element = document.createElement('div');
    element.className = 'speech-bubble';
    element.textContent = text;
    this.root.appendChild(element);

    this.speech = { element, agent };
  }

  hideSpeech() {
    this.speech?.element.remove();
    this.speech = null;
  }

  clear() {
    this.hideSpeech();

    for (const entry of this.entries.values()) {
      entry.element.remove();
    }

    this.entries.clear();
  }

  setVisible(value) {
    this.root.style.display = value ? '' : 'none';
  }

  update(agents) {
    for (const agent of agents) {
      const entry = this.ensureActivity(agent);
      const label = ACTIVITY_LABELS[agent.activity];

      entry.element.textContent = label ?? '';
      entry.element.classList.toggle(
        'visible',
        !!label && agent.state !== 'chase' && agent.state !== 'capture',
      );

      this.place(entry.element, agent.position, 2.35);
    }

    if (this.speech) {
      this.place(
        this.speech.element,
        this.speech.agent.position,
        2.55,
      );
    }
  }

  place(element, position, height) {
    const point = new THREE.Vector3(
      position.x,
      height,
      position.z,
    );
    point.project(this.camera);

    const x = (point.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-point.y * 0.5 + 0.5) * window.innerHeight;
    const visible = point.z > -1 && point.z < 1;

    element.style.transform =
      `translate(-50%, -100%) translate(${x}px, ${y}px)`;
    element.style.opacity = visible ? '1' : '0';
  }
}
