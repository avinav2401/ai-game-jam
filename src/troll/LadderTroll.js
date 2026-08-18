import * as THREE from 'three';
import { BaseTroll } from './BaseTroll.js';
import { audio } from '../systems/AudioManager.js';

export class LadderTroll extends BaseTroll {
  constructor(ladderGroup) {
    super('ladder_troll', {
      triggerDistance: 3,
      triggerPosition: new THREE.Vector3(5, -3, -165),
      oneShot: true, // Only trick them once
    });
    this.ladder = ladderGroup;
    this.fallSpeed = 0;
  }

  onTrigger(game) {
    audio.playTreeCreak(); // Wood creak sound
  }

  onUpdate(dt, game) {
    // Ladder falls backwards
    this.fallSpeed += 5 * dt; 
    this.ladder.rotation.x -= this.fallSpeed * dt;
    
    // Once it's flat on the ground, complete
    if (this.ladder.rotation.x <= -Math.PI / 2) {
      this.ladder.rotation.x = -Math.PI / 2;
      this.completed = true;
    }
  }

  onReset() {
    this.ladder.rotation.x = -0.1;
    this.fallSpeed = 0;
  }
}
