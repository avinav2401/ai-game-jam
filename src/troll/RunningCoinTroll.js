import * as THREE from 'three';
import { BaseTroll } from './BaseTroll.js';
import { audio } from '../systems/AudioManager.js';

export class RunningCoinTroll extends BaseTroll {
  constructor(coin) {
    super('running_coin', {
      triggerDistance: 3,
      triggerPosition: new THREE.Vector3(2, 3.5, -60),
    });
    this.coin = coin;
    this.basePos = this.triggerPosition.clone();
    this.timer = 0;
  }

  shouldTrigger(playerPos) {
    if (!this.enabled || this.completed) return false;
    
    // Coin spins while waiting
    this.coin.rotation.y += 0.05;
    this.coin.position.y = this.basePos.y + Math.sin(this.timer * 4) * 0.2;
    
    const dist = playerPos.distanceTo(this.coin.position);
    return dist < this.triggerDistance;
  }

  onTrigger(game) {
    // When triggered, the coin moves away
    audio.playTrollReveal();
    this.triggered = false; // Allow re-trigger immediately
  }

  onUpdate(dt, game) {
    this.timer += dt;
    
    const playerPos = game.player.getPosition();
    const dist = playerPos.distanceTo(this.coin.position);
    
    // If player is close, move away
    if (dist < 4) {
      const runDir = this.coin.position.clone().sub(playerPos);
      runDir.y = 0;
      runDir.normalize();
      
      // Move coin
      this.coin.position.add(runDir.multiplyScalar(8 * dt));
      
      // Don't let it run too far
      if (this.coin.position.z < -80) {
        this.coin.position.z = -80; // Stuck at the bridge
      }
    }
  }

  onReset() {
    this.coin.position.copy(this.basePos);
    this.timer = 0;
  }
}
