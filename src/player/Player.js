import * as THREE from 'three';
import { PlayerController } from './PlayerController.js';
import { PlayerCamera } from './PlayerCamera.js';
import { physics } from '../systems/Physics.js';
import { audio } from '../systems/AudioManager.js';
import { events } from '../game/EventManager.js';

export class Player {
  constructor(scene, camera) {
    this.scene = scene;

    // Player mesh — stylized boy character
    this.mesh = new THREE.Group();
    this.visuals = new THREE.Group();
    this.mesh.add(this.visuals);
    this.visuals.position.y = -0.68; // Shift down so feet touch the ground
    
    // Materials
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdcb3, roughness: 0.6, flatShading: false });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0x2255ff, roughness: 0.7, flatShading: false });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0xddb880, roughness: 0.9, flatShading: false });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x4a3018, roughness: 0.9, flatShading: false });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8, flatShading: false });

    // Head
    this.head = new THREE.Group();
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), skinMat);
    headMesh.castShadow = true;
    this.head.add(headMesh);
    
    // Hair
    const hairMesh = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), hairMat);
    hairMesh.position.y = 0.05;
    hairMesh.castShadow = true;
    this.head.add(hairMesh);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.1, 0.05, 0.22);
    this.head.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.1, 0.05, 0.22);
    this.head.add(rightEye);
    
    this.head.position.y = 1.35;
    this.visuals.add(this.head);

    // Body (Shirt) - Capsule
    this.body = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 0.4, 4, 16), shirtMat);
    this.body.position.y = 0.85;
    this.body.castShadow = true;
    this.visuals.add(this.body);

    // Arms
    this.armL = new THREE.Group();
    const armLMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.35, 4, 16), skinMat);
    const sleeveL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.25, 16), shirtMat);
    armLMesh.position.y = -0.25;
    sleeveL.position.y = -0.05;
    armLMesh.castShadow = true;
    this.armL.add(armLMesh, sleeveL);
    this.armL.position.set(-0.35, 1.1, 0);
    this.visuals.add(this.armL);

    this.armR = new THREE.Group();
    const armRMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.35, 4, 16), skinMat);
    const sleeveR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.25, 16), shirtMat);
    armRMesh.position.y = -0.25;
    sleeveR.position.y = -0.05;
    armRMesh.castShadow = true;
    this.armR.add(armRMesh, sleeveR);
    this.armR.position.set(0.35, 1.1, 0);
    this.visuals.add(this.armR);

    // Legs
    this.legL = new THREE.Group();
    const legLMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.3, 4, 16), pantsMat);
    const shoeL = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.1, 4, 16), shoeMat);
    shoeL.rotation.x = Math.PI / 2; // point forward
    legLMesh.position.y = -0.25;
    shoeL.position.set(0, -0.45, 0.05);
    legLMesh.castShadow = true;
    shoeL.castShadow = true;
    this.legL.add(legLMesh, shoeL);
    this.legL.position.set(-0.15, 0.5, 0);
    this.visuals.add(this.legL);

    this.legR = new THREE.Group();
    const legRMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.3, 4, 16), pantsMat);
    const shoeR = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.1, 4, 16), shoeMat);
    shoeR.rotation.x = Math.PI / 2; // point forward
    legRMesh.position.y = -0.25;
    shoeR.position.set(0, -0.45, 0.05);
    legRMesh.castShadow = true;
    shoeR.castShadow = true;
    this.legR.add(legRMesh, shoeR);
    this.legR.position.set(0.15, 0.5, 0);
    this.visuals.add(this.legR);

    this.mesh.position.set(0, 2, 0);
    scene.add(this.mesh);

    // Physics state
    this.velocity = new THREE.Vector3();
    this.grounded = false;
    this.wasGrounded = false;
    this.moveSpeed = 6;
    this.sprintMultiplier = 2.2;
    this.jumpForce = 8; // Lower jump force because gravity is lower
    this.drag = 8;
    this.playerRadius = 0.35;
    this.playerHeight = 1.5; // total capsule height

    // Footstep timer and animation state
    this.footstepTimer = 0;
    this.footstepInterval = 0.35;
    this.walkTime = 0;

    // Controller & Camera
    this.controller = new PlayerController();
    this.playerCamera = new PlayerCamera(camera);

    // Dead state
    this.isDead = false;
    this.hasGun = false;

    // Gun Model
    this.gun = new THREE.Group();
    const gunBody = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 0.15), new THREE.MeshStandardMaterial({ color: 0x333333 }));
    const gunBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4), new THREE.MeshStandardMaterial({ color: 0x333333 }));
    // Cylinder is along Y. The gun body is 0.25 along Y.
    // Move barrel to the top of the body
    gunBarrel.position.set(0, 0.2, 0.05);
    this.gun.add(gunBody, gunBarrel);
    
    // Attach to hand. The arm is a capsule along Y.
    // When holding gun, arm is rotated -PI/2 on X, so its Y points backwards, -Y points forward.
    // We want the gun barrel to point in local -Y.
    // So gun needs to be rotated PI around X so its Y points to arm's -Y.
    this.gun.rotation.x = Math.PI;
    this.gun.position.set(0, -0.3, 0.05); // near bottom of the arm
    
    this.gun.visible = false;
    this.armR.add(this.gun);

    // Knockback
    this.knockback = new THREE.Vector3();
  }

  equipGun() {
    this.hasGun = true;
    this.gun.visible = true;
    
    // Raise arm to aim forward
    this.armR.rotation.x = -Math.PI / 2;
    this.armR.rotation.z = 0.2;
    this.armR.position.set(0.35, 1.2, -0.2); // bring it forward a bit
  }

  applyKnockback(force) {
    this.knockback.copy(force);
    this.velocity.add(force);
    this.grounded = false;
  }

  update(dt) {
    if (this.isDead) return;

    const { dir, sprint, jump } = this.controller.getMovement(this.playerCamera.getYaw());

    // Horizontal movement
    const speed = this.moveSpeed * (sprint ? this.sprintMultiplier : 1);
    const targetVelX = dir.x * speed;
    const targetVelZ = dir.z * speed;

    // Apply acceleration with drag
    this.velocity.x += (targetVelX - this.velocity.x) * Math.min(1, this.drag * dt);
    this.velocity.z += (targetVelZ - this.velocity.z) * Math.min(1, this.drag * dt);

    // Gravity
    this.velocity.y += physics.gravity * dt;

    // Jump
    if (jump && this.grounded) {
      this.velocity.y = this.jumpForce;
      this.grounded = false;
      audio.playJump();
      events.emit('playerJump');
    }

    // Gun recoil animation
    if (this.hasGun && this.gun.position.z < 0.1) {
      this.gun.position.z += 1.0 * dt; // recover recoil
      if (this.gun.position.z > 0.1) this.gun.position.z = 0.1;
    }

    // Move position
    let nextPos = this.mesh.position.clone();
    nextPos.x += this.velocity.x * dt;
    nextPos.z += this.velocity.z * dt;

    // Resolve horizontal collisions
    const currentFeetY = nextPos.y - this.playerHeight / 2;
    const resolved = physics.resolveHorizontalCollision(nextPos.x, currentFeetY, nextPos.z, this.playerRadius);
    nextPos.x = resolved.x;
    nextPos.z = resolved.z;

    // Apply Y velocity after resolving horizontal to avoid false ground checks
    nextPos.y += this.velocity.y * dt;

    const feetY = nextPos.y - this.playerHeight / 2;

    // Ground check — find highest ground under us that isn't a ceiling
    const groundY = physics.getGroundY(nextPos.x, nextPos.z, this.playerRadius, feetY);

    this.wasGrounded = this.grounded;

    if (feetY <= groundY && this.velocity.y <= 0) {
      nextPos.y = groundY + this.playerHeight / 2;
      this.velocity.y = 0;
      this.grounded = true;

      // Landing sound
      if (!this.wasGrounded) {
        audio.playLand();
      }
    } else {
      this.grounded = false;
    }

    // Apply position
    this.mesh.position.copy(nextPos);

    // Rotate mesh to face movement direction
    if (dir.length() > 0.1) {
      const angle = Math.atan2(dir.x, dir.z);
      let diff = angle - this.mesh.rotation.y;
      
      // Normalize the angle difference to shortest path (-PI to PI)
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      
      this.mesh.rotation.y += diff * Math.min(1, 10 * dt);
    }

    // Animation
    const speedLen = dir.length();
    if (this.grounded && speedLen > 0.1) {
      this.walkTime += dt * (sprint ? 15 : 10);
      
      // Arm swing
      this.armL.rotation.x = Math.sin(this.walkTime) * 0.8;
      if (!this.hasGun) {
        this.armR.rotation.x = -Math.sin(this.walkTime) * 0.8;
      }
      
      // Leg swing
      this.legL.rotation.x = -Math.sin(this.walkTime) * 0.6;
      this.legR.rotation.x = Math.sin(this.walkTime) * 0.6;
      
      // Body bob
      this.body.position.y = 0.85 + Math.abs(Math.sin(this.walkTime)) * 0.05;
      this.head.position.y = 1.35 + Math.abs(Math.sin(this.walkTime)) * 0.05;

      this.footstepTimer += dt * (sprint ? 1.5 : 1);
      if (this.footstepTimer >= this.footstepInterval) {
        this.footstepTimer = 0;
        audio.playFootstep();
      }
    } else {
      // Return to idle
      this.walkTime = 0;
      this.armL.rotation.x = THREE.MathUtils.lerp(this.armL.rotation.x, 0, 10 * dt);
      if (!this.hasGun) {
        this.armR.rotation.x = THREE.MathUtils.lerp(this.armR.rotation.x, 0, 10 * dt);
      }
      this.legL.rotation.x = THREE.MathUtils.lerp(this.legL.rotation.x, 0, 10 * dt);
      this.legR.rotation.x = THREE.MathUtils.lerp(this.legR.rotation.x, 0, 10 * dt);
      this.body.position.y = THREE.MathUtils.lerp(this.body.position.y, 0.85, 10 * dt);
      this.head.position.y = THREE.MathUtils.lerp(this.head.position.y, 1.35, 10 * dt);
      this.footstepTimer = 0;
    }

    // Fall off world → death
    if (this.mesh.position.y < -20) {
      events.emit('playerDeath', 'You fell into the void.');
    }

    // Update camera
    this.playerCamera.update(dt, this.mesh.position, sprint);
  }

  die() {
    this.isDead = true;
    this.controller.disable();
    this.velocity.set(0, 0, 0);
  }

  reset() {
    this.velocity.set(0, 0, 0);
    this.isDead = false;
    this.hasGun = false;
    this.gun.visible = false;
    
    // Reset arm position
    this.armR.rotation.x = 0;
    this.armR.rotation.z = 0;
    this.armR.position.set(0.35, 1.1, 0);
    
    this.mesh.rotation.z = 0;
    this.mesh.rotation.x = 0;
    this.mesh.position.y = 10;
  }

  respawnAt(position) {
    this.mesh.position.copy(position);
    this.velocity.set(0, 0, 0);
    this.knockback.set(0, 0, 0);
    this.grounded = false;
    this.isDead = false;
    this.controller.enable();
  }

  getPosition() {
    return this.mesh.position;
  }

  dispose() {
    this.scene.remove(this.mesh);
  }
}
