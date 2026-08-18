import * as THREE from 'three';
import { BaseTroll } from './BaseTroll.js';
import { audio } from '../systems/AudioManager.js';

export class RunningTreeTroll extends BaseTroll {
  constructor(tree) {
    super('running_tree', {
      triggerDistance: 12,
      triggerPosition: new THREE.Vector3(0, 0, -225),
      oneShot: true, // Only run away once per attempt
    });
    this.tree = tree;
    this.timer = 0;
  }

  shouldTrigger(playerPos) {
    if (!this.enabled || this.completed || this.triggered) return false;

    // Dynamically check against the tree's current position since it might have moved
    const dist = playerPos.distanceTo(this.tree.getPosition());
    return dist < 12;
  }

  onTrigger(game) {
    this.tree.startRunning(game.player.getPosition());
    audio.playTrollReveal();
  }

  onUpdate(dt, game) {
    this.timer += dt;
    
    // Stop running after 2.5 seconds
    if (this.timer > 2.5 && this.tree.isRunning) {
      this.tree.isRunning = false;
      this.completed = true;
    }
  }

  onReset() {
    this.timer = 0;
    this.tree.isRunning = false;
  }
}
