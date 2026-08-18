import * as THREE from 'three';
import { audio } from '../systems/AudioManager.js';

// PlayerController — handles WASD input, sprint, jump
export class PlayerController {
  constructor() {
    this.keys = {};
    this.moveDir = new THREE.Vector3();
    this.isSprinting = false;
    this.jumpRequested = false;
    this.enabled = true;

    window.addEventListener('keydown', e => this._onKey(e, true));
    window.addEventListener('keyup', e => this._onKey(e, false));
  }

  _onKey(e, down) {
    this.keys[e.code] = down;
    if (e.code === 'Space' && down) {
      this.jumpRequested = true;
    }
  }

  getMovement(cameraYaw) {
    if (!this.enabled) return { dir: new THREE.Vector3(), sprint: false, jump: false };

    let x = 0, z = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) z -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) z += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) x -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) x += 1;

    const dir = new THREE.Vector3(x, 0, z);
    if (dir.length() > 0) dir.normalize();

    // Rotate movement relative to camera yaw
    dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYaw);

    this.isSprinting = !!this.keys['ShiftLeft'] || !!this.keys['ShiftRight'];
    const jump = this.jumpRequested;
    this.jumpRequested = false;

    return { dir, sprint: this.isSprinting, jump };
  }

  disable() { this.enabled = false; }
  enable() { this.enabled = true; }
}
