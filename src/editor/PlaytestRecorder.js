const PREFIX =
  'cowandhorse:playtest-runs:';

export class PlaytestRecorder {
  constructor({
    sampleInterval = 0.14,
    maxRuns = 8,
  } = {}) {
    this.sampleInterval =
      sampleInterval;
    this.maxRuns = maxRuns;
    this.levelId = null;
    this.current = null;
    this.timer = 0;
  }

  key(levelId) {
    return `${PREFIX}${levelId}`;
  }

  start(levelId, position) {
    this.levelId = levelId;
    this.current = {
      startedAt: Date.now(),
      duration: 0,
      points: [],
    };
    this.timer = 0;

    if (position) {
      this.sample(position);
    }
  }

  sample(position) {
    if (!this.current) return;

    const point = [
      Number(position.x.toFixed(2)),
      0.06,
      Number(position.z.toFixed(2)),
    ];

    const previous =
      this.current.points.at(-1);

    if (
      previous &&
      Math.hypot(
        previous[0] - point[0],
        previous[2] - point[2],
      ) < 0.08
    ) {
      return;
    }

    this.current.points.push(point);
  }

  update(dt, position) {
    if (!this.current) return;

    this.current.duration += dt;
    this.timer += dt;

    if (
      this.timer >=
      this.sampleInterval
    ) {
      this.timer = 0;
      this.sample(position);
    }
  }

  finish() {
    if (
      !this.current ||
      !this.levelId
    ) {
      this.current = null;
      return;
    }

    if (
      this.current.points.length <
      2
    ) {
      this.current = null;
      return;
    }

    const runs =
      this.list(this.levelId);

    runs.unshift(
      this.current,
    );

    localStorage.setItem(
      this.key(this.levelId),
      JSON.stringify(
        runs.slice(
          0,
          this.maxRuns,
        ),
      ),
    );

    this.current = null;
  }

  list(
    levelId = this.levelId,
  ) {
    if (!levelId) return [];

    try {
      return JSON.parse(
        localStorage.getItem(
          this.key(levelId),
        ) ?? '[]',
      );
    } catch {
      return [];
    }
  }

  clear(
    levelId = this.levelId,
  ) {
    if (!levelId) return;

    localStorage.removeItem(
      this.key(levelId),
    );
  }
}
