export class GameClock {
  constructor({ startHour = 17, startMinute = 59, startSecond = 50, gameSecondsPerRealSecond = 1 } = {}) {
    this.startSeconds = startHour * 3600 + startMinute * 60 + startSecond;
    this.seconds = this.startSeconds;
    this.scale = gameSecondsPerRealSecond;
  }

  update(dt) {
    this.seconds += dt * this.scale;
  }

  addMinutes(minutes) {
    this.seconds += minutes * 60;
  }

  reset() {
    this.seconds = this.startSeconds;
  }

  get isAfterSix() {
    return this.seconds >= 18 * 3600;
  }

  get formatted() {
    const total = Math.floor(this.seconds);
    const h = Math.floor(total / 3600) % 24;
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
  }
}
