export class VersionHuntGame {
  constructor() {
    this.context = null;
    this.caseIndex = 0;
    this.correct = 0;
    this.locked = false;
    this.nextTimer = 0;
    this.onFileClick = this.onFileClick.bind(this);

    this.cases = [
      {
        message:
          '“发客户的是昨天傍晚那个 FINAL，18:42 的。别发客户版，那个还有批注。”',
        files: [
          {
            name: 'proposal_FINAL_v6.pptx',
            time: '18:42',
            note: '内部干净版',
            correct: true,
          },
          {
            name: 'proposal_客户版.pptx',
            time: '18:42',
            note: '含客户批注',
          },
          {
            name: 'proposal_FINAL_v7.pptx',
            time: '19:10',
            note: '今晚新改',
          },
          {
            name: 'proposal_final_old.pptx',
            time: '17:55',
            note: '旧结构',
          },
        ],
      },
      {
        message:
          '“用财务刚回我的那个版本。名字里没有 FINAL，17:26 保存的，预算页已经更新。”',
        files: [
          {
            name: 'budget_FINAL.xlsx',
            time: '17:26',
            note: '预算页未更新',
          },
          {
            name: 'budget_v12.xlsx',
            time: '17:26',
            note: '财务回传 · 预算已更新',
            correct: true,
          },
          {
            name: 'budget_v13.xlsx',
            time: '17:41',
            note: '市场部修改',
          },
          {
            name: 'budget_v12_copy.xlsx',
            time: '16:58',
            note: '本地副本',
          },
        ],
      },
    ];
  }

  mount(container, context) {
    this.container = container;
    this.context = context;

    container.classList.add('active');
    container.innerHTML = `
      <section class="minigame-card version-game">
        <div class="minigame-header">
          <div>
            <p class="eyebrow">${context.npcRole} · 发我那个文件</p>
            <h2>到底是哪个版本？</h2>
          </div>
          <strong data-case>1 / 2</strong>
        </div>

        <blockquote class="version-message" data-message></blockquote>
        <div class="file-grid" data-files></div>
        <p class="version-feedback" data-feedback></p>
      </section>
    `;

    this.caseLabel = container.querySelector('[data-case]');
    this.message = container.querySelector('[data-message]');
    this.files = container.querySelector('[data-files]');
    this.feedback = container.querySelector('[data-feedback]');

    this.renderCase();
  }

  renderCase() {
    const item = this.cases[this.caseIndex];

    this.locked = false;
    this.feedback.textContent = '';
    this.caseLabel.textContent =
      `${this.caseIndex + 1} / ${this.cases.length}`;
    this.message.textContent = item.message;

    this.files.innerHTML = item.files
      .map(
        (file, index) => `
          <button
            class="file-card"
            type="button"
            data-index="${index}"
          >
            <strong>${file.name}</strong>
            <span>${file.time}</span>
            <small>${file.note}</small>
          </button>
        `,
      )
      .join('');

    this.files
      .querySelectorAll('button')
      .forEach(button =>
        button.addEventListener('click', this.onFileClick),
      );
  }

  onFileClick(event) {
    if (this.locked) return;

    this.locked = true;

    const index = Number(event.currentTarget.dataset.index);
    const current = this.cases[this.caseIndex];
    const chosen = current.files[index];

    if (chosen.correct) {
      this.correct += 1;
      this.feedback.textContent = '对，就是这个。';
      event.currentTarget.classList.add('correct');
    } else {
      this.feedback.textContent = '不是这个版本。';
      event.currentTarget.classList.add('wrong');

      const correctIndex =
        current.files.findIndex(file => file.correct);

      this.files
        .querySelector(
          `[data-index="${correctIndex}"]`,
        )
        ?.classList.add('correct');
    }

    for (const button of this.files.querySelectorAll('button')) {
      button.disabled = true;
    }

    this.nextTimer = 1.15;
  }

  update(dt) {
    if (!this.locked) return;

    this.nextTimer -= dt;
    if (this.nextTimer > 0) return;

    this.caseIndex += 1;

    if (this.caseIndex >= this.cases.length) {
      const ratio = this.correct / this.cases.length;

      this.context.finish({
        success: ratio >= 0.5,
        score: this.correct,
        timeMultiplier:
          ratio >= 1 ? 0.86 : ratio >= 0.5 ? 1.08 : 1.35,
      });
      return;
    }

    this.renderCase();
  }

  unmount() {
    this.files
      ?.querySelectorAll('button')
      .forEach(button =>
        button.removeEventListener('click', this.onFileClick),
      );
  }
}
