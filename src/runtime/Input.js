export class Input {
  constructor() {
    this.keys = new Set();
    this.pressed = new Set();

    this.onDown = (event) => {
      if (!this.keys.has(event.code)) this.pressed.add(event.code);
      this.keys.add(event.code);
    };
    this.onUp = (event) => this.keys.delete(event.code);

    window.addEventListener('keydown', this.onDown);
    window.addEventListener('keyup', this.onUp);
  }

  axis() {
    const left = this.keys.has('KeyA') || this.keys.has('ArrowLeft');
    const right = this.keys.has('KeyD') || this.keys.has('ArrowRight');
    const up = this.keys.has('KeyW') || this.keys.has('ArrowUp');
    const down = this.keys.has('KeyS') || this.keys.has('ArrowDown');
    return {
      x: (right ? 1 : 0) - (left ? 1 : 0),
      z: (down ? 1 : 0) - (up ? 1 : 0),
    };
  }

  isDown(code) {
    return this.keys.has(code);
  }

  consume(code) {
    const value = this.pressed.has(code);
    this.pressed.delete(code);
    return value;
  }

  endFrame() {
    this.pressed.clear();
  }

  dispose() {
    window.removeEventListener('keydown', this.onDown);
    window.removeEventListener('keyup', this.onUp);
  }
}
