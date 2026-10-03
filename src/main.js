import './styles/main.css';
import { Game } from './runtime/Game.js';

const root = document.querySelector('#app');
const game = new Game(root);
game.start();
