export class Input {
  constructor() {
    this.keys = new Set();
    this.pressed = new Set();

    this.virtualHeld = new Set();
    this.virtualPressed = new Set();
    this.virtualAxis = { x: 0, z: 0 };

    this.onDown = event => {
      if (!this.keys.has(event.code)) {
        this.pressed.add(event.code);
      }

      this.keys.add(event.code);
    };

    this.onUp = event => {
      this.keys.delete(event.code);
    };

    window.addEventListener(
      'keydown',
      this.onDown,
    );

    window.addEventListener(
      'keyup',
      this.onUp,
    );
  }

  axis() {
    const left =
      this.keys.has('KeyA') ||
      this.keys.has('ArrowLeft');

    const right =
      this.keys.has('KeyD') ||
      this.keys.has('ArrowRight');

    const up =
      this.keys.has('KeyW') ||
      this.keys.has('ArrowUp');

    const down =
      this.keys.has('KeyS') ||
      this.keys.has('ArrowDown');

    let x =
      (right ? 1 : 0) -
      (left ? 1 : 0) +
      this.virtualAxis.x;

    let z =
      (down ? 1 : 0) -
      (up ? 1 : 0) +
      this.virtualAxis.z;

    const length =
      Math.hypot(x, z);

    if (length > 1) {
      x /= length;
      z /= length;
    }

    return { x, z };
  }

  setVirtualAxis(x, z) {
    this.virtualAxis.x = x;
    this.virtualAxis.z = z;
  }

  setVirtualHeld(code, value) {
    if (value) {
      this.virtualHeld.add(code);
    } else {
      this.virtualHeld.delete(code);
    }
  }

  pressVirtual(code) {
    this.virtualPressed.add(code);
  }

  isDown(code) {
    return (
      this.keys.has(code) ||
      this.virtualHeld.has(code)
    );
  }

  consume(code) {
    const value =
      this.pressed.has(code) ||
      this.virtualPressed.has(code);

    this.pressed.delete(code);
    this.virtualPressed.delete(code);

    return value;
  }

  endFrame() {
    this.pressed.clear();
    this.virtualPressed.clear();
  }

  dispose() {
    window.removeEventListener(
      'keydown',
      this.onDown,
    );

    window.removeEventListener(
      'keyup',
      this.onUp,
    );
  }
}
