import * as THREE from 'three';
import { events } from '../game/EventManager.js';
import { audio } from './AudioManager.js';

// CheckpointManager — save/restore player position on death
export class CheckpointManager {
  constructor() {
    this.checkpoints = []; // { id, position: Vector3, activated: bool, mesh }
    this.activeCheckpointIndex = 0;
    this.isFake = new Set(); // IDs of fake checkpoints
  }

  addCheckpoint(id, position, mesh, fake = false) {
    const entry = { id, position: position.clone(), activated: false, mesh };
    this.checkpoints.push(entry);
    if (fake) this.isFake.add(id);
    return entry;
  }

  tryActivate(playerPos) {
    for (let i = 0; i < this.checkpoints.length; i++) {
      const cp = this.checkpoints[i];
      if (cp.activated) continue;
      const dist = playerPos.distanceTo(cp.position);
      if (dist < 3) {
        cp.activated = true;

        if (this.isFake.has(cp.id)) {
          // Fake checkpoint: don't update active, let TrollManager handle it
          events.emit('fakeCheckpointActivated', cp);
        } else {
          this.activeCheckpointIndex = i;
          events.emit('checkpointActivated', cp);
          audio.playCheckpoint();
        }

        // Visual feedback — light the torch
        if (cp.mesh) {
          if (cp.mesh.userData.isTorch) {
            cp.mesh.userData.fireMesh.visible = true;
            cp.mesh.userData.light.intensity = 2;
          }
        }
        return cp;
      }
    }
    return null;
  }

  getSpawnPoint() {
    if (this.checkpoints.length === 0) return new THREE.Vector3(0, 2, 0);
    return this.checkpoints[this.activeCheckpointIndex].position.clone().add(new THREE.Vector3(0, 1, 0));
  }

  reset() {
    this.activeCheckpointIndex = 0;
    for (const cp of this.checkpoints) {
      cp.activated = false;
      // Revert visual
      if (cp.mesh) {
        cp.mesh.traverse(child => {
          if (child.isMesh && child.material) {
            child.material.emissive = new THREE.Color(0x000000);
          }
        });
      }
    }
  }

  clear() {
    this.checkpoints = [];
    this.activeCheckpointIndex = 0;
    this.isFake.clear();
  }
}
