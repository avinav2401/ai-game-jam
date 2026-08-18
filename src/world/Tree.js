import * as THREE from 'three';
import { audio } from '../systems/AudioManager.js';

// THE TREE — the central antagonist of the game.
// It appears harmless but gradually reveals that IT HATES THE PLAYER.
export class Tree {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // ---- Build the Giant Tree ----
    // Massive trunk
    const trunkGeo = new THREE.CylinderGeometry(0.8, 1.5, 8, 8);
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x3d2817,
      flatShading: true,
      roughness: 0.95,
    });
    this.trunk = new THREE.Mesh(trunkGeo, trunkMat);
    this.trunk.position.y = 4;
    this.trunk.castShadow = true;
    this.group.add(this.trunk);

    // Massive canopy — multiple layered icospheres for puffy look
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0x4caf50, // Brighter green for the overhaul
      emissive: 0x1a331a, // Still a slight sinister undertone
      emissiveIntensity: 0.2,
      flatShading: true,
    });

    this.canopyParts = [];
    const canopyPositions = [
      [0, 9, 0, 3.5],
      [-1.5, 8.5, 1, 2.5],
      [1.5, 8.5, -1, 2.5],
      [0, 10, 1, 2],
      [-1, 10.5, -0.5, 1.8],
      [1, 10, 0.5, 2],
    ];

    for (const [cx, cy, cz, r] of canopyPositions) {
      const canopy = new THREE.Mesh(
        new THREE.IcosahedronGeometry(r, 0),
        canopyMat
      );
      canopy.position.set(cx, cy, cz);
      canopy.castShadow = true;
      this.group.add(canopy);
      this.canopyParts.push(canopy);
    }

    // Branches (thick cylinders sticking out)
    const branchMat = trunkMat.clone();
    this.branches = [];
    const branchAngles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
    for (const angle of branchAngles) {
      const branch = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.3, 3, 6),
        branchMat
      );
      branch.position.set(
        Math.cos(angle) * 1.8,
        6,
        Math.sin(angle) * 1.8
      );
      branch.rotation.z = Math.cos(angle) * 0.5;
      branch.rotation.x = Math.sin(angle) * 0.5;
      branch.castShadow = true;
      this.group.add(branch);
      this.branches.push(branch);
    }

    // Glowing core (mysterious center glow)
    this.glowMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0xa855f7,
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.4,
    });
    this.glow = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 16, 16),
      this.glowMat
    );
    this.glow.position.y = 9;
    this.group.add(this.glow);

    // Point light for the glow
    this.light = new THREE.PointLight(0xa855f7, 3, 30);
    this.light.position.y = 9;
    this.group.add(this.light);

    // ---- Initial position (far end of level) ----
    this.basePosition = new THREE.Vector3(0, 5.5, -230);
    this.group.position.copy(this.basePosition);
    scene.add(this.group);

    // State
    this.isRunning = false;
    this.runSpeed = 0;
    this.runDir = new THREE.Vector3();
    this.isKnockedDown = false;
    this.bobTime = 0;

    // For the "weeping angel" mechanic
    this.sneakOffset = 0;
  }

  getPosition() {
    return this.group.position.clone();
  }

  setPosition(pos) {
    this.group.position.copy(pos);
  }

  // Subtle slide away from player
  slideAwayFrom(playerPos, amount) {
    const dir = this.group.position.clone().sub(playerPos);
    dir.y = 0;
    dir.normalize();
    this.group.position.add(dir.multiplyScalar(amount));
    audio.playTreeCreak();
  }

  // Weeping angel: move toward player when they're not looking
  sneakToward(playerPos, playerLookDir, dt) {
    // Check if player is looking at the tree
    const toTree = this.group.position.clone().sub(playerPos);
    toTree.y = 0;
    toTree.normalize();

    const lookFlat = playerLookDir.clone();
    lookFlat.y = 0;
    lookFlat.normalize();

    const dot = toTree.dot(lookFlat);

    // If player is NOT looking at the tree (dot < 0.3 means tree is behind/side)
    if (dot < 0.3) {
      const sneakDir = playerPos.clone().sub(this.group.position);
      sneakDir.y = 0;
      sneakDir.normalize();
      this.group.position.add(sneakDir.multiplyScalar(2 * dt));
    }
  }

  // Start the running away animation
  startRunning(awayFromPos) {
    this.isRunning = true;
    this.runDir = this.group.position.clone().sub(awayFromPos);
    this.runDir.y = 0;
    this.runDir.normalize();
    this.runSpeed = 8;
    audio.playTreeCreak();
  }

  // Branch attack — returns knockback direction
  branchAttack(playerPos) {
    const dir = playerPos.clone().sub(this.group.position);
    dir.y = 0;
    dir.normalize();
    audio.playSwoosh();
    return dir.multiplyScalar(20).add(new THREE.Vector3(0, 8, 0));
  }

  // Fall down (pretend to be dead)
  knockDown() {
    this.isKnockedDown = true;
    this.group.rotation.z = Math.PI / 2;
    this.group.position.y = -0.5;
  }

  // Stand back up behind the player
  standUp() {
    this.isKnockedDown = false;
    this.group.rotation.z = 0;
    this.group.position.y = this.basePosition.y;
  }

  update(dt) {
    this.bobTime += dt;

    // Gentle canopy sway
    for (let i = 0; i < this.canopyParts.length; i++) {
      const c = this.canopyParts[i];
      c.position.x += Math.sin(this.bobTime * 0.8 + i) * 0.001;
    }

    // Glow pulse
    this.glowMat.emissiveIntensity = 2 + Math.sin(this.bobTime * 2) * 0.5;
    this.light.intensity = 3 + Math.sin(this.bobTime * 2) * 1;

    // Running animation
    if (this.isRunning) {
      this.group.position.add(this.runDir.clone().multiplyScalar(this.runSpeed * dt));
      // Wobble while running (funny)
      this.group.rotation.z = Math.sin(this.bobTime * 15) * 0.15;
      this.group.position.y = this.basePosition.y + Math.abs(Math.sin(this.bobTime * 10)) * 0.5;
    }
  }
}
