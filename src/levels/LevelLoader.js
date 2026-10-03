const clone = value =>
  typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));

export class LevelLoader {
  constructor({
    baseUrl = import.meta.env.BASE_URL,
  } = {}) {
    this.baseUrl = baseUrl;
  }

  levelUrl(id) {
    return `${this.baseUrl}levels/${encodeURIComponent(id)}.json`;
  }

  async listPublished() {
    const response = await fetch(
      `${this.baseUrl}levels/index.json`,
      { cache: 'no-store' },
    );

    if (!response.ok) {
      throw new Error(
        `Unable to load level index (${response.status})`,
      );
    }

    return response.json();
  }

  async loadPublished(id = 'office-01') {
    const response = await fetch(
      this.levelUrl(id),
      { cache: 'no-store' },
    );

    if (!response.ok) {
      throw new Error(
        `Unable to load level "${id}" (${response.status})`,
      );
    }

    return this.normalize(
      await response.json(),
    );
  }

  normalize(data) {
    const level = clone(data);

    level.schemaVersion ??= 1;
    level.id ??= 'untitled';
    level.name ??= level.id;
    level.environment ??= [];
    level.interactions ??= [];
    level.navigation ??= {
      nodes: [],
      edges: [],
    };
    level.npcs ??= [];
    level.events ??= {};

    return level;
  }

  clone(data) {
    return clone(data);
  }
}
