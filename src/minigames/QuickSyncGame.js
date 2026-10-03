export class QuickSyncGame {
  constructor() {
    this.context = null;
    this.roundIndex = 0;
    this.score = 0;
    this.state = 'briefing';
    this.lineIndex = 0;
    this.lineTimer = 0;
    this.answerTimer = 0;
    this.nextTimer = 0;

    this.rounds = [
      {
        lines: [
          '“方向其实是对的，不要大改。”',
          '“第一页信息有点满，客户下午就看。”',
          '“先把重点收一收，结构先别动。”',
        ],
        prompt: '现在最该做什么？',
        choices: [
          '重做整套结构',
          '精简第一页信息',
          '把主色换成红色',
        ],
        answer: 1,
      },
      {
        lines: [
          '“数据本身没问题。”',
          '“老板最关心的是为什么这个月突然掉了。”',
          '“别再补数字，先把原因讲清楚。”',
        ],
        prompt: '你应该先补什么？',
        choices: [
          '下降原因说明',
          '更多数据表',
          '新的封面页',
        ],
        answer: 0,
      },
      {
        lines: [
          '“明天早上给客户。”',
          '“不要再加新功能了，风险太高。”',
          '“把现在能跑通的流程说明白就行。”',
        ],
        prompt: '接下来要做什么？',
        choices: [
          '继续加功能',
          '推迟客户会议',
          '整理现有流程说明',
        ],
        answer: 2,
      },
    ];

    this.onChoice = this.onChoice.bind(this);
  }

  mount(container, context) {
    this.container = container;
    this.context = context;

    container.classList.add('active');
    container.innerHTML = `
      <section class="minigame-card meeting-game meeting-decode">
        <div class="minigame-header">
          <div>
            <p class="eyebrow">${context.npcRole} · 快速同步</p>
            <h2>听懂他到底要什么</h2>
          </div>
          <strong data-round>1 / 3</strong>
        </div>

        <div class="meeting-stage">
          <p class="meeting-line" data-line></p>
          <p class="meeting-prompt" data-prompt hidden></p>
          <div class="meeting-choices" data-choices></div>
          <p class="meeting-feedback" data-feedback></p>
        </div>

        <div class="meeting-score">
          <span>抓住真正的 action item</span>
          <div data-dots></div>
        </div>
      </section>
    `;

    this.line = container.querySelector('[data-line]');
    this.prompt = container.querySelector('[data-prompt]');
    this.choices = container.querySelector('[data-choices]');
    this.feedback = container.querySelector('[data-feedback]');
    this.roundLabel = container.querySelector('[data-round]');
    this.dots = container.querySelector('[data-dots]');

    this.renderDots();
    this.startRound();
  }

  startRound() {
    this.state = 'briefing';
    this.lineIndex = 0;
    this.lineTimer = 0;
    this.answerTimer = 0;
    this.nextTimer = 0;

    this.roundLabel.textContent =
      `${this.roundIndex + 1} / ${this.rounds.length}`;

    this.prompt.hidden = true;
    this.prompt.textContent = '';
    this.choices.innerHTML = '';
    this.feedback.textContent = '';
    this.line.textContent = this.rounds[this.roundIndex].lines[0];
  }

  showQuestion() {
    const round = this.rounds[this.roundIndex];

    this.state = 'answer';
    this.answerTimer = 6.5;

    this.line.textContent = '';
    this.prompt.hidden = false;
    this.prompt.textContent = round.prompt;

    this.choices.innerHTML = round.choices
      .map(
        (choice, index) => `
          <button
            class="meeting-choice"
            type="button"
            data-index="${index}"
          >
            <span>${String.fromCharCode(65 + index)}</span>
            ${choice}
          </button>
        `,
      )
      .join('');

    this.choices
      .querySelectorAll('button')
      .forEach(button =>
        button.addEventListener('click', this.onChoice),
      );
  }

  onChoice(event) {
    if (this.state !== 'answer') return;

    const round = this.rounds[this.roundIndex];
    const choice = Number(event.currentTarget.dataset.index);
    const correct = choice === round.answer;

    if (correct) this.score += 1;

    this.state = 'feedback';
    this.nextTimer = 1.15;

    for (const button of this.choices.querySelectorAll('button')) {
      const index = Number(button.dataset.index);
      button.disabled = true;
      if (index === round.answer) {
        button.classList.add('correct');
      } else if (index === choice) {
        button.classList.add('wrong');
      }
    }

    this.feedback.textContent = correct
      ? '听懂了。'
      : '你抓错重点了。';

    this.renderDots();
  }

  renderDots() {
    this.dots.innerHTML = this.rounds
      .map(
        (_, index) =>
          `<i class="${index < this.roundIndex ? 'done' : ''}"></i>`,
      )
      .join('');
  }

  update(dt) {
    if (this.state === 'briefing') {
      this.lineTimer += dt;

      if (this.lineTimer >= 1.18) {
        this.lineTimer = 0;
        this.lineIndex += 1;

        const lines = this.rounds[this.roundIndex].lines;

        if (this.lineIndex >= lines.length) {
          this.showQuestion();
        } else {
          this.line.textContent = lines[this.lineIndex];
        }
      }
      return;
    }

    if (this.state === 'answer') {
      this.answerTimer -= dt;

      if (this.answerTimer <= 0) {
        this.state = 'feedback';
        this.nextTimer = 1.0;
        this.feedback.textContent = '你沉默得太久了。';

        const round = this.rounds[this.roundIndex];
        for (const button of this.choices.querySelectorAll('button')) {
          button.disabled = true;
          if (Number(button.dataset.index) === round.answer) {
            button.classList.add('correct');
          }
        }
      }
      return;
    }

    if (this.state === 'feedback') {
      this.nextTimer -= dt;

      if (this.nextTimer <= 0) {
        this.roundIndex += 1;

        if (this.roundIndex >= this.rounds.length) {
          const ratio = this.score / this.rounds.length;
          const timeMultiplier =
            ratio >= 1
              ? 0.82
              : ratio >= 2 / 3
                ? 1
                : ratio >= 1 / 3
                  ? 1.22
                  : 1.45;

          this.context.finish({
            success: ratio >= 2 / 3,
            score: this.score,
            timeMultiplier,
          });
          return;
        }

        this.renderDots();
        this.startRound();
      }
    }
  }

  unmount() {
    this.choices
      ?.querySelectorAll('button')
      .forEach(button =>
        button.removeEventListener('click', this.onChoice),
      );
  }
}
