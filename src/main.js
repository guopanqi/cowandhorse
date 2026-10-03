import './styles/main.css';
import { Game } from './runtime/Game.js';

const root =
  document.querySelector('#app');

const game = new Game(root);

game.start().catch(error => {
  console.error(error);

  root.innerHTML = `
    <main class="boot-error">
      <p>LOAD ERROR</p>
      <h1>关卡加载失败</h1>
      <pre>${String(error?.stack ?? error)}</pre>
    </main>
  `;
});
