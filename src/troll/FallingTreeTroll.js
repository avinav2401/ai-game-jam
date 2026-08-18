import * as THREE from 'three';
import { BaseTroll } from './BaseTroll.js';
import { audio } from '../systems/AudioManager.js';
import { events } from '../game/EventManager.js';

export class FallingTreeTroll extends BaseTroll {
  constructor(treeGroup) {
    super('falling_tree_' + treeGroup.uuid, {
      triggerDistance: 6,
      triggerPosition: treeGroup.position.clone(),
      oneShot: true, // Only trick them once
    });
    this.tree = treeGroup;
    this.fallSpeed = 0;
    this.fallDirection = this.tree.position.x > 0 ? 1 : -1; // Fall towards x=0 (the path)
  }

  onTrigger(game) {
    audio.playTreeCreak();
  }

  onUpdate(dt, game) {
    this.fallSpeed += 3 * dt; 
    
    // Rotate towards path (Z axis rotation)
    this.tree.rotation.z += this.fallDirection * this.fallSpeed * dt;
    
    const currentAngle = Math.abs(this.tree.rotation.z);
    
    // Check collision with player
    const playerPos = game.player.getPosition();
    const distZ = Math.abs(playerPos.z - this.tree.position.z);
    
    const treeX = this.tree.position.x;
    const relativeX = playerPos.x - treeX;
    const overlapX = relativeX * -this.fallDirection; 
    
    // tighter kill zone: only 1.5 units wide, and player must not be high above
    // overlapX checks if player is under the trunk
    if (currentAngle > Math.PI / 6 && distZ < 1.5 && overlapX > -1.0 && overlapX < 6.0) {
      // Allow jumping over if the tree is fully fallen
      if (currentAngle >= Math.PI / 2 - 0.1 && playerPos.y > 2.0) {
        // Player successfully jumped over the fallen tree
      } else {
        if (!this.completed) {
          events.emit('playerDeath', 'TIMBER!');
        }
      }
    }

    if (currentAngle >= Math.PI / 2) {
      if (!this.hitGround) {
        audio.playTreeCrash();
        this.hitGround = true;
      }
      this.tree.rotation.z = this.fallDirection * (Math.PI / 2);
      this.completed = true;
    }
  }

  onReset() {
    this.tree.rotation.z = 0;
    this.fallSpeed = 0;
    this.completed = false; // Important: resets the trap for the next run
    this.hitGround = false;
  }
}
