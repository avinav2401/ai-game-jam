import * as THREE from 'three';
import { BaseTroll } from './BaseTroll.js';
import { audio } from '../systems/AudioManager.js';
import { events } from '../game/EventManager.js';

// FakeVictoryTroll — "YOU WIN!" appears, then the ground disappears and player falls
export class FakeVictoryTroll extends BaseTroll {
  constructor(tree, key) {
    super('fake_victory', {
      triggerDistance: 3,
      triggerPosition: null, // Dynamically set from tree position
      oneShot: true,
    });
    this.tree = tree;
    this.key = key;
    this.timer = 0;
    this.phase = 'idle'; // idle → victory → reveal → fall
  }

  shouldTrigger(playerPos) {
    if (!this.enabled || this.completed || this.triggered) return false;

    // Trigger when they get near the house/key
    const dist = playerPos.distanceTo(this.tree.getPosition());
    return dist < 6;
  }

  onTrigger(game) {
    this.phase = 'victory';
    this.timer = 0;
    game.player.controller.disable();

    // Show fake victory UI
    audio.playVictory();
    events.emit('fakeVictory');
  }

  onUpdate(dt, game) {
    // Spin the key in idle
    if (this.phase === 'idle' && this.key) {
      this.key.rotation.y += 2 * dt;
    }

    this.timer += dt;

    if (this.phase === 'victory' && this.timer > 2.5) {
      // "Actually..."
      this.phase = 'reveal';
      this.timer = 0;
      audio.playTrollReveal();
      events.emit('fakeVictoryReveal');
      game.player.playerCamera.shake(1.0, 1.0);
    }

    if (this.phase === 'reveal' && this.timer > 1.5) {
      // Ground disappears, player falls
      this.phase = 'fall';
      this.timer = 0;

      // Push the player down
      game.player.velocity.y = -5;
      game.player.grounded = false;

      // The house "kicks" the player by applying a big knockback
      const kickDir = game.player.getPosition().clone().sub(this.tree.getPosition());
      kickDir.y = 0;
      kickDir.normalize();
      game.player.applyKnockback(kickDir.multiplyScalar(15).add(new THREE.Vector3(0, 12, 0)));

      // Hide the key
      if (this.key) {
        this.key.visible = false;
      }

      events.emit('fakeVictoryFall');
    }

    if (this.phase === 'fall' && this.timer > 1.2) {
      this.completed = true;
      // Change to Level 2!
      events.emit('levelComplete');
    }
  }

  onReset() {
    this.timer = 0;
    this.phase = 'idle';
    if (this.key) {
      this.key.visible = true;
    }
  }
}
