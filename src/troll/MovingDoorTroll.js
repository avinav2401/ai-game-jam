import * as THREE from 'three';
import { BaseTroll } from './BaseTroll.js';
import { audio } from '../systems/AudioManager.js';
import { physics } from '../systems/Physics.js';

export class MovingDoorTroll extends BaseTroll {
  constructor(door) {
    super('moving_door', {
      triggerDistance: 15,
      triggerPosition: new THREE.Vector3(0, 0, -130),
    });
    this.doorGroup = door.group;
    this.gate = door.gate;
    this.baseZ = -130;
    this.retreatSpeed = 12;
    this.maxRetreat = 30; // Will stop retreating at -160
    this.activeRetreat = false;
  }

  shouldTrigger(playerPos) {
    if (!this.enabled || this.completed) return false;

    // Trigger when player approaches
    return playerPos.z < this.baseZ + 8 && playerPos.z > this.baseZ - this.maxRetreat;
  }

  onTrigger(game) {
    this.activeRetreat = true;
    audio.playTreeCreak(); // Reusing creak for moving heavy object
  }

  onUpdate(dt, game) {
    const playerPos = game.player.getPosition();
    
    if (this.activeRetreat) {
      // Move door backward (-z) faster than the player
      const targetZ = playerPos.z - 5;
      
      if (this.doorGroup.position.z > targetZ && !this.completed) {
        this.doorGroup.position.z -= this.retreatSpeed * dt;
        
        // If it goes past the cliff edge (-140), it falls
        if (this.doorGroup.position.z < -140) {
          this.doorGroup.position.y -= 20 * dt; // fall fast
        }

        // Update physics collider position
        this.gate.updateMatrixWorld();
        const entry = physics.colliders.find(c => c.id === 'door_gate');
        if (entry) physics.updateColliderFromMesh(entry);
      }
      
      // Stop retreating if player gives up (only if it hasn't fallen)
      if (playerPos.z > this.doorGroup.position.z + 10 && this.doorGroup.position.z >= -140) {
        this.activeRetreat = false;
        this.triggered = false; // Allow re-trigger
      }
      
      if (this.doorGroup.position.z <= this.baseZ - this.maxRetreat || this.doorGroup.position.y < -20) {
        this.completed = true;
        physics.removeCollider(`door_gate`);
      }
    }
  }

  onReset() {
    this.doorGroup.position.z = this.baseZ;
    this.doorGroup.position.y = 0; // reset falling
    
    // Check if collider needs to be added back
    const entry = physics.colliders.find(c => c.id === 'door_gate');
    if (entry) {
      physics.updateColliderFromMesh(entry);
    } else {
      physics.addCollider(this.gate, 'solid', 'door_gate');
    }

    this.activeRetreat = false;
    this.triggered = false;
    this.completed = false;
  }
}
