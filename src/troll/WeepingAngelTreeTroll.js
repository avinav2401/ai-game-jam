import * as THREE from 'three';
import { BaseTroll } from './BaseTroll.js';

export class WeepingAngelTreeTroll extends BaseTroll {
  constructor(tree) {
    super('weeping_angel_tree', {
      triggerDistance: 60, // Starts working when in area 4/5
      triggerPosition: new THREE.Vector3(0, 0, -225),
    });
    this.tree = tree;
  }

  shouldTrigger(playerPos) {
    if (!this.enabled || this.completed) return false;
    
    // Only if tree isn't already running away or doing something else
    if (this.tree.isRunning || this.tree.isKnockedDown) return false;

    const dist = playerPos.distanceTo(this.tree.getPosition());
    return dist < this.triggerDistance && dist > 15; // Stop sneaking if too close (other trolls take over)
  }

  onTrigger(game) {
    this.triggered = false; // Always re-trigger to keep updating
  }

  onUpdate(dt, game) {
    const playerPos = game.player.getPosition();
    const lookDir = game.camera.getWorldDirection(new THREE.Vector3());
    
    this.tree.sneakToward(playerPos, lookDir, dt);
  }

  onReset() {
    // Positioning is handled by world reset, we just reset state
  }
}
