export class ResourceSystem {
  constructor({ energy = 100, failHour = 22 } = {}) {
    this.maxEnergy = energy;
    this.energy = energy;
    this.failHour = failHour;
    this.overtimeMinutes = 0;
  }

  spendEnergy(amount) {
    this.energy = Math.max(0, this.energy - amount);
  }

  addOvertime(minutes) {
    this.overtimeMinutes += minutes;
  }

  reset() {
    this.energy = this.maxEnergy;
    this.overtimeMinutes = 0;
  }

  failed(clock) {
    return this.energy <= 0 || clock.seconds >= this.failHour * 3600;
  }
}
