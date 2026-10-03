const clone = value =>
  typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));

const DRAFT_PREFIX =
  'cowandhorse:level-draft:';

const GITHUB_TOKEN_KEY =
  'cowandhorse:github-token';

function toBase64(text) {
  const bytes =
    new TextEncoder().encode(text);

  let binary = '';

  for (const byte of bytes) {
    binary +=
      String.fromCharCode(byte);
  }

  return btoa(binary);
}

function fromBase64(value) {
  const binary = atob(
    value.replace(/\n/g, ''),
  );

  const bytes =
    Uint8Array.from(
      binary,
      character =>
        character.charCodeAt(0),
    );

  return new TextDecoder().decode(bytes);
}

export class EditorSession {
  constructor({
    loader,
    repository = 'guopanqi/cowandhorse',
    branch = 'main',
  }) {
    this.loader = loader;
    this.repository = repository;
    this.branch = branch;
    this.level = null;
    this.dirty = false;
  }

  setLevel(level) {
    this.level = clone(level);
    this.dirty = false;
    return this.level;
  }

  markDirty() {
    this.dirty = true;
  }

  getRememberedGithubToken() {
    return (
      localStorage.getItem(
        GITHUB_TOKEN_KEY,
      ) ?? ''
    );
  }

  rememberGithubToken(token) {
    const value =
      token?.trim();

    if (!value) return;

    localStorage.setItem(
      GITHUB_TOKEN_KEY,
      value,
    );
  }

  forgetGithubToken() {
    localStorage.removeItem(
      GITHUB_TOKEN_KEY,
    );
  }

  hasRememberedGithubToken() {
    return Boolean(
      this.getRememberedGithubToken(),
    );
  }

  draftKey(id = this.level?.id) {
    return `${DRAFT_PREFIX}${id}`;
  }

  saveDraft() {
    if (!this.level) return;

    localStorage.setItem(
      this.draftKey(),
      JSON.stringify(this.level),
    );

    this.dirty = false;
  }

  loadDraft(id) {
    const raw =
      localStorage.getItem(
        this.draftKey(id),
      );

    if (!raw) return null;

    return this.loader.normalize(
      JSON.parse(raw),
    );
  }

  deleteDraft(id = this.level?.id) {
    if (!id) return;

    localStorage.removeItem(
      this.draftKey(id),
    );
  }

  listDrafts() {
    const result = [];

    for (
      let index = 0;
      index < localStorage.length;
      index++
    ) {
      const key =
        localStorage.key(index);

      if (
        !key?.startsWith(
          DRAFT_PREFIX,
        )
      ) {
        continue;
      }

      try {
        const value =
          JSON.parse(
            localStorage.getItem(
              key,
            ),
          );

        result.push({
          id:
            value.id ??
            key.slice(
              DRAFT_PREFIX.length,
            ),
          name:
            value.name ??
            value.id ??
            'Draft',
          source: 'draft',
        });
      } catch {
        // Ignore corrupted local drafts.
      }
    }

    return result;
  }

  duplicate({
    id,
    name,
  }) {
    const copy = clone(this.level);

    copy.id = id;
    copy.name =
      name ??
      `${this.level.name} Copy`;

    this.setLevel(copy);
    this.markDirty();
    this.saveDraft();

    return this.level;
  }

  exportJson() {
    return (
      JSON.stringify(
        this.level,
        null,
        2,
      ) + '\n'
    );
  }

  downloadJson() {
    const blob = new Blob(
      [this.exportJson()],
      {
        type:
          'application/json;charset=utf-8',
      },
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement('a');

    link.href = url;
    link.download =
      `${this.level.id}.json`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  async importFile(file) {
    const text =
      await file.text();

    const level =
      this.loader.normalize(
        JSON.parse(text),
      );

    this.setLevel(level);
    this.markDirty();

    return this.level;
  }

  async revertPublished() {
    const published =
      await this.loader
        .loadPublished(
          this.level.id,
        );

    this.setLevel(published);
    this.deleteDraft(
      published.id,
    );

    return this.level;
  }

  githubHeaders(token) {
    return {
      Accept:
        'application/vnd.github+json',
      Authorization:
        `Bearer ${token}`,
      'X-GitHub-Api-Version':
        '2022-11-28',
      'Content-Type':
        'application/json',
    };
  }

  async getGithubFile(
    path,
    token,
  ) {
    const response =
      await fetch(
        `https://api.github.com/repos/${this.repository}/contents/${path}?ref=${encodeURIComponent(this.branch)}`,
        {
          headers:
            this.githubHeaders(
              token,
            ),
        },
      );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(
        `GitHub read failed: ${response.status} ${await response.text()}`,
      );
    }

    return response.json();
  }

  async putGithubFile({
    path,
    text,
    token,
    message,
  }) {
    const existing =
      await this.getGithubFile(
        path,
        token,
      );

    const body = {
      message,
      branch: this.branch,
      content:
        toBase64(text),
    };

    if (existing?.sha) {
      body.sha = existing.sha;
    }

    const response =
      await fetch(
        `https://api.github.com/repos/${this.repository}/contents/${path}`,
        {
          method: 'PUT',
          headers:
            this.githubHeaders(
              token,
            ),
          body:
            JSON.stringify(body),
        },
      );

    if (!response.ok) {
      throw new Error(
        `GitHub publish failed: ${response.status} ${await response.text()}`,
      );
    }

    return response.json();
  }

  async publishToGitHub({
    token,
    message,
  }) {
    if (!token) {
      throw new Error(
        'GitHub token is required.',
      );
    }

    const levelPath =
      `public/levels/${this.level.id}.json`;

    const commitMessage =
      message?.trim() ||
      `level: update ${this.level.id} from graybox editor`;

    const levelResult =
      await this.putGithubFile({
        path: levelPath,
        text: this.exportJson(),
        token,
        message:
          commitMessage,
      });

    const indexPath =
      'public/levels/index.json';

    const existingIndex =
      await this.getGithubFile(
        indexPath,
        token,
      );

    let index = [];

    if (
      existingIndex?.content
    ) {
      index =
        JSON.parse(
          fromBase64(
            existingIndex.content,
          ),
        );
    }

    const existingEntry =
      index.find(
        entry =>
          entry.id ===
          this.level.id,
      );

    if (existingEntry) {
      existingEntry.name =
        this.level.name;
    } else {
      index.push({
        id: this.level.id,
        name: this.level.name,
      });
    }

    index.sort(
      (a, b) =>
        a.id.localeCompare(b.id),
    );

    await this.putGithubFile({
      path: indexPath,
      text:
        JSON.stringify(
          index,
          null,
          2,
        ) + '\n',
      token,
      message:
        `level: update level index for ${this.level.id}`,
    });

    this.deleteDraft();
    this.dirty = false;

    return {
      commit:
        levelResult.commit,
      path:
        levelPath,
    };
  }
}
