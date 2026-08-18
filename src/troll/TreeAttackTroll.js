import * as THREE from 'three';
import { BaseTroll } from './BaseTroll.js';
import { audio } from '../systems/AudioManager.js';
import { events } from '../game/EventManager.js';

// TreeAttackTroll — when player gets close to the tree, branches swat them backward
export class TreeAttackTroll extends BaseTroll {
  constructor(tree) {
    super('tree_attack', {
      triggerDistance: 8,
      triggerPosition: null, // We'll dynamically check against tree position
    });
    this.tree = tree;
    this.cooldown = 0;
    this.attackCount = 0;
  }

  shouldTrigger(playerPos) {
    if (!this.enabled || this.completed) return false;
    if (this.cooldown > 0) return false;

    const dist = playerPos.distanceTo(this.tree.getPosition());
    return dist < 5;
  }

  onTrigger(game) {
    const knockback = this.tree.branchAttack(game.player.getPosition());
    game.player.applyKnockback(knockback);
    game.player.playerCamera.shake(0.8, 0.5);
    this.cooldown = 4;
    this.attackCount++;
    this.triggered = false; // Allow re-triggering

    if (this.attackCount >= 2) {
      this.completed = true;
    }
  }

  onUpdate(dt, game) {
    if (this.cooldown > 0) {
      this.cooldown -= dt;
    }
  }

  onReset() {
    this.cooldown = 0;
    this.attackCount = 0;
  }
}
