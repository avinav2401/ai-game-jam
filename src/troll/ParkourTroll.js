import * as THREE from 'three';
import { BaseTroll } from './BaseTroll.js';
import { audio } from '../systems/AudioManager.js';
import { physics } from '../systems/Physics.js';
import { events } from '../game/EventManager.js';

export class ParkourTroll extends BaseTroll {
  constructor(mesh) {
    // Trigger distance is small because we want it to trigger when the player is on top of it.
    super('parkour_troll_' + mesh.uuid, {
      triggerDistance: 2.5,
      triggerPosition: mesh.position.clone(),
      oneShot: false
    });
    this.mesh = mesh;
    this.initialY = mesh.position.y;
    this.state = 'idle'; // idle, shaking, falling
    this.timer = 0;
  }

  // Override shouldTrigger to also check if player is ABOVE the platform
  shouldTrigger(playerPos) {
    if (!this.enabled || this.completed || this.triggered) return false;
    
    // Check horizontal distance
    const dx = playerPos.x - this.triggerPosition.x;
    const dz = playerPos.z - this.triggerPosition.z;
    const dist2D = Math.sqrt(dx * dx + dz * dz);
    
    // Player is roughly on the platform and slightly above it
    if (dist2D < 2.5 && playerPos.y > this.triggerPosition.y && playerPos.y < this.triggerPosition.y + 3) {
      return true;
    }
    return false;
  }

  onTrigger(game) {
    this.state = 'shaking';
    this.timer = 0;
    
    // Slight camera shake and sound
    game.player.playerCamera.shake(0.2, 0.5);
    audio.playDeath(); // Reusing playDeath as a loud noise, or we can use another sound. Let's use it as a jump scare sound.
  }

  onUpdate(dt, game) {
    if (this.state === 'shaking') {
      this.timer += dt;
      // Vibrate the platform
      this.mesh.position.x = this.triggerPosition.x + (Math.random() - 0.5) * 0.2;
      this.mesh.position.z = this.triggerPosition.z + (Math.random() - 0.5) * 0.2;
      
      if (this.timer > 0.4) {
        this.state = 'falling';
        // Remove collision so player falls
        physics.removeCollider(this.mesh.userData.collider.id);
      }
    } else if (this.state === 'falling') {
      this.mesh.position.y -= 25 * dt;
      this.mesh.rotation.x += dt * 2;
      this.mesh.rotation.z += dt * 1.5;
      
      if (this.mesh.position.y < -30) {
        this.completed = true;
      }
    }
  }

  onReset() {
    this.state = 'idle';
    this.timer = 0;
    this.mesh.position.copy(this.triggerPosition);
    this.mesh.rotation.set(0, 0, 0);
    
    // Re-add collider if it was removed
    if (this.mesh.userData.collider) {
      physics.removeCollider(this.mesh.userData.collider.id); // Ensure no duplicates
      const newCollider = physics.addCollider(this.mesh, 'solid', this.mesh.userData.collider.id);
      this.mesh.userData.collider = newCollider;
    }
  }
}
