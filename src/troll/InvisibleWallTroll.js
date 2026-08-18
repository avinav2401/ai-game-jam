import * as THREE from 'three';
import { BaseTroll } from './BaseTroll.js';
import { physics } from '../systems/Physics.js';
import { audio } from '../systems/AudioManager.js';

// InvisibleWallTroll — an open-looking path has an invisible wall.
// After the player bumps into it 3 times, it disappears.
export class InvisibleWallTroll extends BaseTroll {
  constructor(scene) {
    super('invisible_wall', {
      triggerDistance: 8,
      triggerPosition: new THREE.Vector3(0, 0, -125),
    });

    // Create invisible wall
    const wallGeo = new THREE.BoxGeometry(12, 5, 0.5);
    const wallMat = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0, // invisible!
    });
    this.wall = new THREE.Mesh(wallGeo, wallMat);
    this.wall.position.set(0, 2.5, -120);
    scene.add(this.wall);
    this.wallCollider = physics.addCollider(this.wall, 'solid', 'invisible_wall');

    this.bumpCount = 0;
    this.maxBumps = 3;
    this.bumpCooldown = 0;
    this.removed = false;
    this.scene = scene;
    this.flashTimer = 0;
  }

  onTrigger(game) {
    // Just mark as triggered so update runs
  }

  onUpdate(dt, game) {
    if (this.removed) return;
    this.bumpCooldown -= dt;

    // Detect player hitting the wall
    const playerPos = game.player.getPosition();
    const wallZ = this.wall.position.z;

    if (Math.abs(playerPos.z - wallZ) < 1.2 && this.bumpCooldown <= 0) {
      this.bumpCount++;
      this.bumpCooldown = 1;

      // Flash the wall briefly visible
      this.wall.material.opacity = 0.2;
      this.flashTimer = 0.3;

      audio.playTrollReveal();

      if (this.bumpCount >= this.maxBumps) {
        // Remove the wall
        this.wallCollider.enabled = false;
        this.wall.visible = false;
        this.removed = true;
        this.completed = true;
      }
    }

    // Flash fade
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      this.wall.material.opacity = 0.2 * (this.flashTimer / 0.3);
    }
  }

  onReset() {
    this.bumpCount = 0;
    this.bumpCooldown = 0;
    this.removed = false;
    this.wallCollider.enabled = true;
    this.wall.visible = true;
    this.wall.material.opacity = 0;
    this.flashTimer = 0;
  }
}
