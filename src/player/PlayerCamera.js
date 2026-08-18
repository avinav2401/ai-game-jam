import * as THREE from 'three';

// PlayerCamera — third-person camera with smooth follow, mouse orbit, shake effects
export class PlayerCamera {
  constructor(camera) {
    this.camera = camera;
    this.target = new THREE.Vector3();
    this.offset = new THREE.Vector3(0, 5, 8);
    this.smoothSpeed = 5;
    this.yaw = 0;
    this.pitch = 0.3;
    this.distance = 8;
    this.minPitch = -0.2;
    this.maxPitch = 1.0;
    this.minDistance = 3;
    this.maxDistance = 14;
    this.baseFov = 60;
    this.sprintFov = 70;

    // Camera shake
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeTimer = 0;

    this._locked = false;
    this._setupMouse();
  }

  _setupMouse() {
    // Pointer lock for mouse orbit
    const canvas = document.getElementById('game-container');
    canvas.addEventListener('click', () => {
      if (!this._locked) {
        canvas.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this._locked = document.pointerLockElement === document.getElementById('game-container');
    });

    document.addEventListener('mousemove', e => {
      if (!this._locked) return;
      this.yaw -= e.movementX * 0.003;
      this.pitch -= e.movementY * 0.002;
      this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));
    });

    window.addEventListener('wheel', e => {
      this.distance += e.deltaY * 0.005;
      this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance));
    });
  }

  shake(intensity, duration) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTimer = 0;
  }

  update(dt, playerPos, isSprinting) {
    // Smooth follow target
    this.target.lerp(playerPos, this.smoothSpeed * dt);

    // Orbit offset
    const offsetX = Math.sin(this.yaw) * Math.cos(this.pitch) * this.distance;
    const offsetY = Math.sin(this.pitch) * this.distance;
    const offsetZ = Math.cos(this.yaw) * Math.cos(this.pitch) * this.distance;

    const desired = new THREE.Vector3(
      this.target.x + offsetX,
      this.target.y + offsetY,
      this.target.z + offsetZ
    );

    this.camera.position.lerp(desired, this.smoothSpeed * dt);

    // Camera shake
    if (this.shakeTimer < this.shakeDuration) {
      this.shakeTimer += dt;
      const progress = this.shakeTimer / this.shakeDuration;
      const fade = 1 - progress;
      const shakeX = (Math.random() - 0.5) * this.shakeIntensity * fade;
      const shakeY = (Math.random() - 0.5) * this.shakeIntensity * fade;
      this.camera.position.x += shakeX;
      this.camera.position.y += shakeY;
    }

    // Look at player
    this.camera.lookAt(this.target);

    // Sprint FOV
    const targetFov = isSprinting ? this.sprintFov : this.baseFov;
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, 3 * dt);
    this.camera.updateProjectionMatrix();
  }

  getYaw() {
    return this.yaw;
  }
}
