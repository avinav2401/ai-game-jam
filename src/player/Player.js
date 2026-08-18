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
    this.skinMat = new THREE.MeshStandardMaterial({ color: 0xcd9a5b, roughness: 0.6, flatShading: true });
    this.shirtMat = new THREE.MeshStandardMaterial({ color: 0x0f5e9c, roughness: 0.7, flatShading: true });
    this.pantsMat = new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.9, flatShading: true });
    this.hairMat = new THREE.MeshStandardMaterial({ color: 0x3d2010, roughness: 0.9, flatShading: true });
    this.shoeMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.8, flatShading: true });
    const glassFrameMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5, flatShading: true });
    const glassLensMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, flatShading: true, opacity: 0.8, transparent: true });

    // Head (Tapered box/cube)
    this.head = new THREE.Group();
    // Using a 4-sided cylinder to create a tapered box
    const headGeo = new THREE.CylinderGeometry(0.35, 0.25, 0.5, 4);
    // Rotate 45 degrees so flat sides face front/back/left/right
    headGeo.rotateY(Math.PI / 4);
    const headMesh = new THREE.Mesh(headGeo, this.skinMat);
    headMesh.castShadow = true;
    this.head.add(headMesh);
    
    // Hair (Stylized blocky hair)
    const hairGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.2, 8);
    // Add a top bump for the afro/puffy look
    const hairTopGeo = new THREE.SphereGeometry(0.35, 8, 8);
    hairTopGeo.translate(0, 0.1, 0);
    const hairMesh = new THREE.Mesh(hairGeo, this.hairMat);
    const hairTop = new THREE.Mesh(hairTopGeo, this.hairMat);
    hairMesh.add(hairTop);
    hairMesh.position.set(0, 0.15, -0.02);
    hairMesh.castShadow = true;
    this.head.add(hairMesh);

    // Glasses
    const frameGeo = new THREE.BoxGeometry(0.24, 0.12, 0.04);
    const lensGeo = new THREE.BoxGeometry(0.18, 0.08, 0.05);
    
    const leftFrame = new THREE.Mesh(frameGeo, glassFrameMat);
    leftFrame.position.set(-0.14, 0.05, 0.25);
    leftFrame.rotation.y = -0.15;
    const leftLens = new THREE.Mesh(lensGeo, glassLensMat);
    leftLens.position.set(-0.14, 0.05, 0.25);
    leftLens.rotation.y = -0.15;
    
    const rightFrame = new THREE.Mesh(frameGeo, glassFrameMat);
    rightFrame.position.set(0.14, 0.05, 0.25);
    rightFrame.rotation.y = 0.15;
    const rightLens = new THREE.Mesh(lensGeo, glassLensMat);
    rightLens.position.set(0.14, 0.05, 0.25);
    rightLens.rotation.y = 0.15;
    
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.04), glassFrameMat);
    bridge.position.set(0, 0.05, 0.27);

    this.head.add(leftFrame, leftLens, rightFrame, rightLens, bridge);

    // Mouth (Frown)
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const mouthGeo = new THREE.BoxGeometry(0.06, 0.015, 0.02);
    const mouth = new THREE.Mesh(mouthGeo, mouthMat);
    mouth.position.set(0, -0.1, 0.25);
    // To make it look like a frown, tilt two small boxes
    const mouthL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.015, 0.02), mouthMat);
    mouthL.position.set(-0.02, -0.11, 0.25);
    mouthL.rotation.z = -0.2;
    const mouthR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.015, 0.02), mouthMat);
    mouthR.position.set(0.02, -0.11, 0.25);
    mouthR.rotation.z = 0.2;
    this.head.add(mouth, mouthL, mouthR);
    
    this.head.position.y = 1.25;
    this.visuals.add(this.head);

    // Body (Shirt) - Rounded
    this.body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.45, 16), this.shirtMat);
    this.body.position.y = 0.75;
    this.body.castShadow = true;
    this.visuals.add(this.body);

    // Arms
    this.armL = new THREE.Group();
    const armLMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.3, 16), this.shirtMat);
    armLMesh.position.y = -0.15;
    const handL = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), this.skinMat);
    handL.position.y = -0.32;
    armLMesh.castShadow = true;
    handL.castShadow = true;
    this.armL.add(armLMesh, handL);
    this.armL.position.set(-0.28, 0.9, 0);
    this.armL.rotation.z = -0.1; // Rest slightly angled outward
    this.visuals.add(this.armL);

    this.armR = new THREE.Group();
    const armRMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.3, 16), this.shirtMat);
    armRMesh.position.y = -0.15;
    const handR = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), this.skinMat);
    handR.position.y = -0.32;
    armRMesh.castShadow = true;
    handR.castShadow = true;
    this.armR.add(armRMesh, handR);
    this.armR.position.set(0.28, 0.9, 0);
    this.armR.rotation.z = 0.1; // Rest slightly angled outward
    this.visuals.add(this.armR);

    // Legs
    this.legL = new THREE.Group();
    const legLMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.4, 16), this.pantsMat);
    const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.18), this.shoeMat);
    legLMesh.position.y = -0.2;
    shoeL.position.set(0, -0.45, 0.03);
    legLMesh.castShadow = true;
    shoeL.castShadow = true;
    this.legL.add(legLMesh, shoeL);
    this.legL.position.set(-0.1, 0.5, 0);
    this.visuals.add(this.legL);

    this.legR = new THREE.Group();
    const legRMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.4, 16), this.pantsMat);
    const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.18), this.shoeMat);
    legRMesh.position.y = -0.2;
    shoeR.position.set(0, -0.45, 0.03);
    legRMesh.castShadow = true;
    shoeR.castShadow = true;
    this.legR.add(legRMesh, shoeR);
    this.legR.position.set(0.1, 0.5, 0);
    this.visuals.add(this.legR);

    this.mesh.position.set(0, 2, 0);
    scene.add(this.mesh);

    // Physics state
    this.velocity = new THREE.Vector3();
    this.grounded = false;
    this.wasGrounded = false;
    this.moveSpeed = 6;
    this.sprintMultiplier = 2.2;
    this.jumpForce = 12; // Adjust for snappier jump
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
    this.isDead = false;
  }

  setColors(skinColorHex, shirtColorHex) {
    if (skinColorHex !== null) {
      this.skinMat.color.setHex(skinColorHex);
    }
    if (shirtColorHex !== null) {
      this.shirtMat.color.setHex(shirtColorHex);
    }
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
