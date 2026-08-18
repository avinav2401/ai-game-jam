import * as THREE from 'three';
import { BaseTroll } from './BaseTroll.js';

export class LyingNPCTroll extends BaseTroll {
  constructor(npcGroup) {
    super('lying_npc', {
      triggerDistance: 10,
      triggerPosition: new THREE.Vector3(-3, 0, -50),
    });
    this.npc = npcGroup;
    this.timer = 0;
  }

  shouldTrigger(playerPos) {
    // NPC doesn't really "trigger", it just updates whenever in range
    return true; 
  }

  onTrigger(game) {
    this.triggered = false; // Always update
  }

  onUpdate(dt, game) {
    this.timer += dt;
    
    // Idle bob
    this.npc.position.y = Math.sin(this.timer * 3) * 0.2;

    // Look at player if close
    const playerPos = game.player.getPosition();
    const dist = playerPos.distanceTo(this.npc.position);
    
    if (dist < 15) {
      // Look at player (but keep Y rotation only)
      const lookTarget = playerPos.clone();
      lookTarget.y = this.npc.position.y;
      this.npc.lookAt(lookTarget);
      
      // Make the text bubble face the camera
      this.npc.children[3].lookAt(game.camera.position); 
    }
  }

  onReset() {
    this.timer = 0;
  }
}
