import * as THREE from 'three';
import { BaseTroll } from './BaseTroll.js';
import { physics } from '../systems/Physics.js';

export class TrollPlatformTroll extends BaseTroll {
  constructor(mesh) {
    super('troll_platform', {
      triggerDistance: 1000, // Always active
      triggerPosition: mesh.position.clone(),
      oneShot: false
    });
    this.mesh = mesh;
    this.initialX = mesh.position.x;
    this.timer = Math.random() * Math.PI * 2; // Random starting phase
    this.active = true;
    this.amplitude = 5 + Math.random() * 3; // 5 to 8 units range
    this.speed = 1.5 + Math.random() * 1.5; // 1.5 to 3.0 rad/s
    
    // Find physics collider ID to update it
    this.colliderEntry = physics.colliders.find(c => c.mesh === mesh);
  }

  shouldTrigger(playerPos) {
    return true; // Always updating while in the level
  }

  onTrigger(game) {
    // No one-shot effect, handled in onUpdate
  }

  onUpdate(dt, game) {
    // The Troll: The platform freezes its movement when the player is mid-air!
    if (game.player.grounded) {
      this.timer += dt * this.speed;
    }

    // Move left and right
    this.mesh.position.x = this.initialX + Math.sin(this.timer) * this.amplitude;
    
    // Update physics collider
    if (this.colliderEntry) {
      physics.updateColliderFromMesh(this.colliderEntry);
    }
  }

  onReset() {
    // Keep phase is fine.
  }
}
