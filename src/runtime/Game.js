export class Game {
  constructor(root) {
    this.root = root;
  }

  start() {
    this.root.innerHTML = `
      <main class="boot-screen">
        <section>
          <p class="eyebrow">COW AND HORSE</p>
          <h1>下班逃亡</h1>
          <p>工程骨架已建立。下一步接入正式的 Three.js 运行时、办公室关卡与潜行循环。</p>
        </section>
      </main>
    `;
  }
}
