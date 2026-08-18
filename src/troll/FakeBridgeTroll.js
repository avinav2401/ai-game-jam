import * as THREE from 'three';
import { BaseTroll } from './BaseTroll.js';
import { physics } from '../systems/Physics.js';
import { audio } from '../systems/AudioManager.js';

// FakeBridgeTroll — the middle plank of the bridge disappears when player crosses
export class FakeBridgeTroll extends BaseTroll {
  constructor(bridgePlanks) {
    super('fake_bridge', {
      triggerDistance: 3,
      triggerPosition: new THREE.Vector3(0, 0, -83.4), // middle of bridge
    });
    this.bridgePlanks = bridgePlanks;
    this.plankToRemove = bridgePlanks[2]; // middle plank
    this.timer = 0;
    this.plankRemoved = false;
  }

  onTrigger(game) {
    this.timer = 0;
    this.plankRemoved = false;
    audio.playTrollReveal();
  }

  onUpdate(dt, game) {
    this.timer += dt;

    // Wait 0.5s then remove the plank
    if (!this.plankRemoved && this.timer > 0.5) {
      this.plankRemoved = true;

      // Make plank fall
      if (this.plankToRemove) {
        this.plankToRemove.visible = false;
        if (this.plankToRemove.userData.collider) {
          this.plankToRemove.userData.collider.enabled = false;
        }
      }
      game.player.playerCamera.shake(0.3, 0.3);
    }

    // Complete after 3s
    if (this.timer > 3) {
      this.completed = true;
    }
  }

  onReset() {
    if (this.plankToRemove) {
      this.plankToRemove.visible = true;
      if (this.plankToRemove.userData.collider) {
        this.plankToRemove.userData.collider.enabled = true;
      }
    }
    this.timer = 0;
    this.plankRemoved = false;
  }
}
