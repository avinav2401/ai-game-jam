import * as THREE from 'three';
import { BaseTroll } from './BaseTroll.js';
import { events } from '../game/EventManager.js';
import { audio } from '../systems/AudioManager.js';

export class SwingingHammerTroll extends BaseTroll {
  constructor(hammerGroup) {
    super('swinging_hammer', {
      triggerDistance: 1000,
      triggerPosition: hammerGroup.position.clone(),
      oneShot: false
    });
    this.hammer = hammerGroup;
    this.timer = Math.random() * Math.PI * 2;
    this.speed = 2.0 + Math.random() * 1.5; // 2.0 to 3.5 rad/s
    this.amplitude = 1.0 + Math.random() * 0.5; // Up to ~85 degrees
    
    // We don't need a physics collider for the hammer since we'll check manually
    // The head is at y = -6 relative to the pivot (hammerGroup.position)
  }

  shouldTrigger(playerPos) {
    return true; // Always active
  }

  onTrigger(game) {
    // No one-shot effect
  }

  onUpdate(dt, game) {
    this.timer += dt * this.speed;
    
    // Swing on the Z axis (so it sweeps across X)
    this.hammer.rotation.z = Math.sin(this.timer) * this.amplitude;
    
    // Check collision with player
    // The hammer head is at local y=-6. Let's find its world position.
    const headLocal = new THREE.Vector3(0, -6, 0);
    const headWorld = headLocal.applyMatrix4(this.hammer.matrixWorld);
    
    const playerPos = game.player.getPosition();
    const dist = playerPos.distanceTo(headWorld);
    
    // The head is a 2x1.5x1.5 box, let's use a rough radius of 1.5 for collision
    if (dist < 1.5 && !this.cooldown) {
      this.cooldown = 1.0; // 1 second cooldown before hitting again
      
      // Knock the player off
      // Direction from head to player
      const dir = playerPos.clone().sub(headWorld);
      dir.y = 0.5; // Knock slightly upward
      dir.normalize();
      
      game.player.applyKnockback(dir.multiplyScalar(25));
      audio.playDeath(); // Ouch sound
    }
    
    if (this.cooldown > 0) {
      this.cooldown -= dt;
    }
  }

  onReset() {
    this.cooldown = 0;
  }
}
