export class MobileControls {
  constructor(root, input) {
    this.root = root;
    this.input = input;

    this.root.innerHTML = `
      <div class="touch-controls" aria-hidden="true">
        <div class="touch-joystick" data-joystick>
          <div class="touch-stick" data-stick></div>
        </div>

        <div class="touch-actions">
          <button class="touch-action touch-interact" data-interact type="button" hidden>
            <span>使用</span>
          </button>
          <button class="touch-action touch-crouch" data-crouch type="button">
            <span>蹲伏</span>
          </button>
          <button class="touch-action touch-sprint" data-sprint type="button">
            <span>冲刺</span>
          </button>
        </div>
      </div>
    `;

    this.joystick = this.root.querySelector('[data-joystick]');
    this.stick = this.root.querySelector('[data-stick]');
    this.interact = this.root.querySelector('[data-interact]');
    this.crouch = this.root.querySelector('[data-crouch]');
    this.sprint = this.root.querySelector('[data-sprint]');

    this.pointerId = null;
    this.origin = { x: 0, y: 0 };
    this.radius = 46;

    this.onJoystickDown = this.onJoystickDown.bind(this);
    this.onJoystickMove = this.onJoystickMove.bind(this);
    this.onJoystickUp = this.onJoystickUp.bind(this);

    this.onInteract = event => {
      event.preventDefault();
      this.input.pressVirtual('KeyE');
    };

    this.onCrouch = event => {
      event.preventDefault();
      this.input.pressVirtual('KeyC');
    };

    this.onSprintDown = event => {
      event.preventDefault();
      this.sprint.setPointerCapture?.(event.pointerId);
      this.input.setVirtualHeld('ShiftLeft', true);
      this.sprint.classList.add('active');
    };

    this.onSprintUp = event => {
      event.preventDefault();
      this.input.setVirtualHeld('ShiftLeft', false);
      this.sprint.classList.remove('active');
    };

    this.joystick.addEventListener('pointerdown', this.onJoystickDown);
    window.addEventListener('pointermove', this.onJoystickMove, { passive: false });
    window.addEventListener('pointerup', this.onJoystickUp);
    window.addEventListener('pointercancel', this.onJoystickUp);

    this.interact.addEventListener('pointerdown', this.onInteract);
    this.crouch.addEventListener('pointerdown', this.onCrouch);
    this.sprint.addEventListener('pointerdown', this.onSprintDown);
    this.sprint.addEventListener('pointerup', this.onSprintUp);
    this.sprint.addEventListener('pointercancel', this.onSprintUp);
    this.sprint.addEventListener('lostpointercapture', this.onSprintUp);
  }

  onJoystickDown(event) {
    event.preventDefault();

    this.pointerId = event.pointerId;
    this.joystick.setPointerCapture?.(event.pointerId);

    const rect = this.joystick.getBoundingClientRect();
    this.origin.x = rect.left + rect.width * 0.5;
    this.origin.y = rect.top + rect.height * 0.5;

    this.updateJoystick(event.clientX, event.clientY);
  }

  onJoystickMove(event) {
    if (event.pointerId !== this.pointerId) return;
    event.preventDefault();
    this.updateJoystick(event.clientX, event.clientY);
  }

  onJoystickUp(event) {
    if (event.pointerId !== this.pointerId) return;

    this.pointerId = null;
    this.input.setVirtualAxis(0, 0);
    this.stick.style.transform = 'translate(0px, 0px)';
  }

  updateJoystick(clientX, clientY) {
    let dx = clientX - this.origin.x;
    let dy = clientY - this.origin.y;

    const length = Math.hypot(dx, dy);
    if (length > this.radius) {
      dx = (dx / length) * this.radius;
      dy = (dy / length) * this.radius;
    }

    this.stick.style.transform = `translate(${dx}px, ${dy}px)`;

    const deadzone = 0.12;
    let x = dx / this.radius;
    let z = dy / this.radius;

    if (Math.abs(x) < deadzone) x = 0;
    if (Math.abs(z) < deadzone) z = 0;

    this.input.setVirtualAxis(x, z);
  }

  setInteraction(state) {
    const visible =
      Boolean(state?.prompt);

    this.interact.hidden =
      !visible;

    this.interact.classList.toggle(
      'active',
      Boolean(state?.active),
    );

    this.interact.querySelector('span').textContent =
      state?.actionLabel ?? '使用';

    this.crouch.disabled =
      Boolean(state?.active);

    this.sprint.disabled =
      Boolean(state?.active);
  }

  setCrouched(value) {
    this.crouch.classList.toggle('active', value);
    this.crouch.querySelector('span').textContent = value ? '站起' : '蹲伏';
  }

  setVisible(value) {
    this.root.classList.toggle('visible', value);

    if (!value) {
      this.pointerId = null;
      this.input.setVirtualAxis(0, 0);
      this.input.setVirtualHeld('ShiftLeft', false);
      this.stick.style.transform = 'translate(0px, 0px)';
      this.sprint.classList.remove('active');
    }
  }

  dispose() {
    this.input.setVirtualAxis(0, 0);
    this.input.setVirtualHeld('ShiftLeft', false);

    this.joystick.removeEventListener('pointerdown', this.onJoystickDown);
    window.removeEventListener('pointermove', this.onJoystickMove);
    window.removeEventListener('pointerup', this.onJoystickUp);
    window.removeEventListener('pointercancel', this.onJoystickUp);
    this.interact.removeEventListener('pointerdown', this.onInteract);
    this.crouch.removeEventListener('pointerdown', this.onCrouch);
    this.sprint.removeEventListener('pointerdown', this.onSprintDown);
    this.sprint.removeEventListener('pointerup', this.onSprintUp);
    this.sprint.removeEventListener('pointercancel', this.onSprintUp);
    this.sprint.removeEventListener('lostpointercapture', this.onSprintUp);
  }
}
