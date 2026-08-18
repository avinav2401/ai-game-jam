import * as THREE from 'three';
import { BaseTroll } from './BaseTroll.js';
import { audio } from '../systems/AudioManager.js';

// MovingTreeTroll — the giant tree subtly slides away when the player approaches
export class MovingTreeTroll extends BaseTroll {
  constructor(tree) {
    super('moving_tree', {
      triggerDistance: 25,
      triggerPosition: new THREE.Vector3(0, 0, -225),
    });
    this.tree = tree;
    this.slideCount = 0;
    this.maxSlides = 3;
    this.cooldown = 0;
    this.lastPlayerDist = Infinity;
  }

  shouldTrigger(playerPos) {
    if (!this.enabled || this.completed) return false;
    if (this.slideCount >= this.maxSlides) return false;

    const dist = playerPos.distanceTo(this.tree.getPosition());

    // Trigger when player gets within 15 units and is approaching
    if (dist < 15 && dist < this.lastPlayerDist - 0.5 && this.cooldown <= 0) {
      this.lastPlayerDist = dist;
      return true;
    }

    this.lastPlayerDist = dist;
    return false;
  }

  onTrigger(game) {
    // Slide the tree farther away
    this.tree.slideAwayFrom(game.player.getPosition(), 6);
    this.slideCount++;
    this.cooldown = 3; // Don't slide again for 3 seconds
    this.triggered = false; // Allow re-triggering

    // Update our trigger position to follow the tree
    this.triggerPosition.copy(this.tree.getPosition());

    if (this.slideCount >= this.maxSlides) {
      this.completed = true;
    }
  }

  onUpdate(dt, game) {
    if (this.cooldown > 0) {
      this.cooldown -= dt;
    }
  }

  onReset() {
    this.slideCount = 0;
    this.cooldown = 0;
    this.lastPlayerDist = Infinity;
  }
}
