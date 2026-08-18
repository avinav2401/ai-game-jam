import * as THREE from 'three';
import { BaseTroll } from './BaseTroll.js';
import { physics } from '../systems/Physics.js';

export class TrollPlatformTroll extends BaseTroll {
  constructor(mesh) {
    super('troll_platform', {
      triggerDistance: 15,
      triggerPosition: mesh.position.clone(),
      oneShot: true
    });
    this.mesh = mesh;
    this.initialX = mesh.position.x;
    
    // Choose a random direction to move (left or right)
    this.direction = Math.random() > 0.5 ? 1 : -1;
    this.moveDistance = 4; // Shift by 4 units
    this.targetX = this.initialX + (this.direction * this.moveDistance);
    this.speed = 15; // Move very fast (units per second)
    
    this.hasMoved = false;
    
    // Find physics collider ID to update it
    this.colliderEntry = physics.colliders.find(c => c.mesh === mesh);
  }

  shouldTrigger(playerPos) {
    // Only trigger if we are close (handled by BaseTroll triggerDistance)
    // We check the jumping condition in onUpdate since shouldTrigger doesn't get 'game'
    return super.shouldTrigger(playerPos);
  }

  onTrigger(game) {
    // The player is close, but we wait for them to jump!
  }

  onUpdate(dt, game) {
    if (!this.active) return; // Only active if close enough

    // Wait for the player to jump (be in the air) before moving
    if (!this.hasMoved && !game.player.grounded) {
      this.hasMoved = true;
    }

    // Move the platform to targetX quickly once triggered
    if (this.hasMoved) {
      if (this.mesh.position.x !== this.targetX) {
        // Move towards targetX
        const dir = Math.sign(this.targetX - this.mesh.position.x);
        this.mesh.position.x += dir * this.speed * dt;
        
        // If we overshot, snap to target
        if (dir > 0 && this.mesh.position.x > this.targetX) this.mesh.position.x = this.targetX;
        if (dir < 0 && this.mesh.position.x < this.targetX) this.mesh.position.x = this.targetX;
        
        // Update physics collider
        if (this.colliderEntry) {
          physics.updateColliderFromMesh(this.colliderEntry);
        }
      }
    }
  }

  onReset() {
    this.hasMoved = false;
    this.mesh.position.x = this.initialX;
    this.active = false;
    if (this.colliderEntry) {
      physics.updateColliderFromMesh(this.colliderEntry);
    }
  }
}
