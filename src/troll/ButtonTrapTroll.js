import * as THREE from 'three';
import { BaseTroll } from './BaseTroll.js';
import { audio } from '../systems/AudioManager.js';
import { events } from '../game/EventManager.js';

export class ButtonTrapTroll extends BaseTroll {
  constructor(buttonGroup) {
    super('button_trap', {
      triggerDistance: 15,
      triggerPosition: new THREE.Vector3(0, 0, -170),
      oneShot: true,
    });
    this.btn = buttonGroup.btn;
    this.baseY = this.btn.position.y;
    this.state = 'idle'; // idle -> near -> left -> boom
    this.timer = 0;
  }

  shouldTrigger(playerPos) {
    // Keep this active while player is anywhere near area 4
    if (!this.enabled || this.completed) return false;
    return true; 
  }

  onTrigger(game) {
    this.triggered = false; // keep updating
  }

  onUpdate(dt, game) {
    const playerPos = game.player.getPosition();
    const btnWorldPos = new THREE.Vector3();
    this.btn.getWorldPosition(btnWorldPos);
    
    // Ignore Y distance mostly
    const dist = Math.hypot(playerPos.x - btnWorldPos.x, playerPos.z - btnWorldPos.z);

    if (this.state === 'idle') {
      if (dist < 1.5) {
        this.state = 'near';
        // Press button visually
        this.btn.position.y = this.baseY - 0.1;
        audio.playCheckpoint(); // click sound
      }
    } 
    else if (this.state === 'near') {
      // If player walks away after pressing
      if (dist > 5) {
        this.state = 'left';
        this.timer = 0;
        
        // Spawn falling rock above player
        this.rock = new THREE.Mesh(
          new THREE.DodecahedronGeometry(3, 0),
          new THREE.MeshStandardMaterial({ color: 0x555555 })
        );
        this.rock.position.copy(playerPos);
        this.rock.position.y += 20; // 20 units above
        game.scene.add(this.rock);
      }
    }
    else if (this.state === 'left') {
      // Rock falls
      this.rock.position.y -= 30 * dt; // Fall fast
      this.rock.rotation.x += dt * 5;
      
      if (this.rock.position.y <= playerPos.y + 1) {
        // Boom
        audio.playExplosion();
        game.player.playerCamera.shake(1.0, 1.0);
        events.emit('playerDeath', 'You pushed the button.');
        
        game.scene.remove(this.rock);
        this.completed = true;
        this.state = 'done';
      }
    }
  }

  onReset() {
    this.btn.position.y = this.baseY;
    this.state = 'idle';
    this.timer = 0;
    if (this.rock && this.rock.parent) {
      this.rock.parent.remove(this.rock);
    }
  }
}
