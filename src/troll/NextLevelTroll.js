import * as THREE from 'three';
import { BaseTroll } from './BaseTroll.js';
import { events } from '../game/EventManager.js';

export class NextLevelTroll extends BaseTroll {
  constructor() {
    super('next_level_troll');
    this.oneShot = true;
  }

  shouldTrigger(playerPos) {
    // If player reaches the Giant Tree platform (Z < -100)
    return playerPos.z < -100 && !this.completed;
  }

  onTrigger(game) {
    this.completed = true;
    events.emit('levelComplete');
  }

  onUpdate(dt, game) {
    // No continuous update needed
  }

  onReset() {
    this.completed = false;
  }
}
