import { events } from '../game/EventManager.js';

// Death messages — randomly selected, context-aware
const DEATH_MESSAGES = [
  "The tree remembers.",
  "That was probably your fault.",
  "You trusted a sign.",
  "Why did you press that?",
  "The bridge was suspicious.",
  "You really thought that was a checkpoint?",
  "The tree is disappointed.",
  "Skill issue.",
  "The world hates you. Remember?",
  "You should have looked down.",
  "Trust nothing.",
  "That's what you get for being brave.",
  "The tree saw that.",
  "Maybe try running next time.",
  "Gravity is not your friend.",
  "The tree says 'hi'.",
  "Bold strategy. Didn't work.",
  "You walked right into that one.",
  "The ground here is... unreliable.",
  "Nature: 1, You: 0",
];

export class DeathScreen {
  constructor() {
    this.element = document.getElementById('death-screen');
    this.messageEl = document.getElementById('death-message');
    this.deathCountEl = document.getElementById('death-count');
    this.deaths = 0;
  }

  show(customMessage) {
    this.deaths++;
    this.deathCountEl.textContent = this.deaths;

    const msg = customMessage || DEATH_MESSAGES[Math.floor(Math.random() * DEATH_MESSAGES.length)];
    this.messageEl.textContent = msg;
    this.element.style.display = 'flex';
  }

  hide() {
    this.element.style.display = 'none';
  }

  reset() {
    this.deaths = 0;
    this.deathCountEl.textContent = 0;
  }
}
