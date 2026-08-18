import * as THREE from 'three';
import { BaseTroll } from './BaseTroll.js';
import { physics } from '../systems/Physics.js';

export class TrollPlatformTroll extends BaseTroll {
  constructor(mesh) {
    super('troll_platform', {
      triggerDistance: 20,
      triggerPosition: mesh.position.clone(),
      oneShot: false
    });
    this.mesh = mesh;
    this.initialX = mesh.position.x;
    
    // Choose a random direction to move (left or right)
    this.direction = Math.random() > 0.5 ? 1 : -1;
    this.moveDistance = 4; // Shift by 4 units
    this.targetX = this.initialX + (this.direction * this.moveDistance);
    this.speed = 15; // Move very fast (units per second)
    
    this.hasMoved = false;
    this.active = true; // ALWAYS update this troll
    
    // Find physics collider ID to update it
    this.colliderEntry = physics.colliders.find(c => c.mesh === mesh);
  }

  shouldTrigger(playerPos) {
    // Disable default trigger logic, handle it all in onUpdate
    return false; 
  }

  onTrigger(game) {
  }

  onUpdate(dt, game) {
    if (this.completed) return; // Stop entirely if done

    // Wait for the player to jump (be in the air) AND be close
    const dist = game.player.getPosition().distanceTo(this.mesh.position);
    
    if (!this.hasMoved && !game.player.grounded && dist < this.triggerDistance) {
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

        // Once reached, mark as completed
        if (this.mesh.position.x === this.targetX) {
          this.completed = true;
        }
      }
    }
  }

  onReset() {
    this.hasMoved = false;
    this.completed = false;
    this.mesh.position.x = this.initialX;
    if (this.colliderEntry) {
      physics.updateColliderFromMesh(this.colliderEntry);
    }
  }
}
