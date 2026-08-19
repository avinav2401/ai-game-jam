import * as THREE from 'three';
import { physics } from '../systems/Physics.js';
import { audio } from '../systems/AudioManager.js';

export class Zombie {
  constructor(scene, x, y, z) {
    this.scene = scene;
    this.isDead = false;
    this.speed = 1.8; // Much slower than before (was 3.5)
    
    // Zombie Mesh
    this.mesh = new THREE.Group();
    
    // Materials
    const skinMat = new THREE.MeshStandardMaterial({ color: 0x44aa44, roughness: 0.8, flatShading: false }); // green skin
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0x554433, roughness: 0.9, flatShading: false }); // ragged brown shirt
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.9, flatShading: false }); // dark pants
    const swordMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9, roughness: 0.2 }); // shiny metal
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x553311, roughness: 0.9 }); // wooden handle
    
    // Head
    this.head = new THREE.Group();
    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), skinMat);
    headMesh.position.y = 1.35;
    headMesh.castShadow = true;
    this.head.add(headMesh);
    
    // Eyes (red)
    const eyeGeo = new THREE.BoxGeometry(0.08, 0.08, 0.05);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.1, 1.4, 0.26);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.1, 1.4, 0.26);
    this.head.add(eyeL, eyeR);
    this.mesh.add(this.head);

    // Body
    this.body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.3), shirtMat);
    this.body.position.y = 0.8;
    this.body.castShadow = true;
    this.mesh.add(this.body);

    // Arms - using pivots at shoulder for proper rotation
    // Left arm
    this.armLPivot = new THREE.Group();
    this.armLPivot.position.set(-0.4, 1.1, 0); // shoulder position
    this.armL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.2), skinMat);
    this.armL.position.y = -0.3; // hang down from pivot
    this.armL.castShadow = true;
    this.armLPivot.add(this.armL);
    this.mesh.add(this.armLPivot);

    // Right arm (holds sword)
    this.armRPivot = new THREE.Group();
    this.armRPivot.position.set(0.4, 1.1, 0); // shoulder position
    this.armR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.2), skinMat);
    this.armR.position.y = -0.3; // hang down from pivot
    this.armR.castShadow = true;
    this.armRPivot.add(this.armR);
    
    // Sword attached to right arm
    this.sword = new THREE.Group();
    // Blade
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.8, 0.02), swordMat);
    blade.position.y = -0.4;
    blade.castShadow = true;
    this.sword.add(blade);
    // Handle/guard
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.08), handleMat);
    handle.position.y = 0;
    this.sword.add(handle);
    // Cross-guard
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.06), swordMat);
    guard.position.y = -0.05;
    this.sword.add(guard);
    
    this.sword.position.set(0, -0.6, 0); // attach at bottom of arm
    this.armRPivot.add(this.sword);
    this.mesh.add(this.armRPivot);

    // Legs - using pivots at hip for proper rotation
    this.legLPivot = new THREE.Group();
    this.legLPivot.position.set(-0.15, 0.5, 0); // hip
    this.legL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.5, 0.25), pantsMat);
    this.legL.position.y = -0.25;
    this.legL.castShadow = true;
    this.legLPivot.add(this.legL);
    this.mesh.add(this.legLPivot);

    this.legRPivot = new THREE.Group();
    this.legRPivot.position.set(0.15, 0.5, 0); // hip
    this.legR = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.5, 0.25), pantsMat);
    this.legR.position.y = -0.25;
    this.legR.castShadow = true;
    this.legRPivot.add(this.legR);
    this.mesh.add(this.legRPivot);

    this.mesh.position.set(x, y, z);
    this.scene.add(this.mesh);
    
    // Animation state
    this.walkTime = Math.random() * 10;
    this.isSwinging = false;
    this.swingTime = 0;
    this.swingCooldown = 0;
  }
  
  getPosition() {
    return this.mesh.position;
  }

  kill() {
    this.isDead = true;
    // Simple death animation: fall backwards
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.y = 0.2;
    
    // Disable red eyes to show it's dead
    this.head.children.forEach(child => {
      if (child.material && child.material.color && child.material.color.getHex() === 0xff0000) {
        child.material.color.setHex(0x330000);
      }
    });
  }

  update(dt, playerPos, canChase) {
    if (this.isDead) return;
    
    // Calculate distance to player
    const dist = this.mesh.position.distanceTo(playerPos);
    
    // Swing cooldown
    if (this.swingCooldown > 0) this.swingCooldown -= dt;
    
    // Only chase if player is within range AND has the gun
    if (canChase && dist < 30 && dist > 0.8) {
      // Look at player
      const targetPos = playerPos.clone();
      targetPos.y = this.mesh.position.y; // keep level
      this.mesh.lookAt(targetPos);
      
      // Move towards player (slow shamble)
      const dir = new THREE.Vector3().subVectors(targetPos, this.mesh.position).normalize();
      
      this.mesh.position.x += dir.x * this.speed * dt;
      this.mesh.position.z += dir.z * this.speed * dt;
      
      // Simple physics/ground check
      const groundY = physics.getGroundY(this.mesh.position.x, this.mesh.position.z);
      if (groundY !== -Infinity) {
        this.mesh.position.y = groundY;
      }
      
      // Walk animation (slow shamble)
      this.walkTime += dt * 3; // slower leg movement
      
      // Body sway (zombie lurch)
      this.body.rotation.z = Math.sin(this.walkTime * 0.5) * 0.08;
      this.head.children[0].rotation.z = Math.sin(this.walkTime * 0.7 + 1) * 0.1; // head wobble
      
      // Leg animation
      this.legLPivot.rotation.x = Math.sin(this.walkTime) * 0.4;
      this.legRPivot.rotation.x = -Math.sin(this.walkTime) * 0.4;
      
      // Left arm swings with walk
      this.armLPivot.rotation.x = -Math.sin(this.walkTime) * 0.3;
      
      // Right arm holds sword raised
      if (!this.isSwinging) {
        // Arm held forward, ready to strike
        this.armRPivot.rotation.x = -0.5; // slight forward lean
        this.armRPivot.rotation.z = Math.sin(this.walkTime * 0.5) * 0.1;
      }
      
      // Trigger sword swing when close enough
      if (dist < 3.0 && this.swingCooldown <= 0 && !this.isSwinging) {
        this.isSwinging = true;
        this.swingTime = 0;
      }
      
    } else {
      // Idle: just apply gravity to stay on ground
      const groundY = physics.getGroundY(this.mesh.position.x, this.mesh.position.z);
      if (groundY !== -Infinity) {
        this.mesh.position.y = groundY;
      }
      
      // Idle animation: subtle sway
      this.walkTime += dt * 1.5;
      this.body.rotation.z = Math.sin(this.walkTime * 0.3) * 0.03;
      this.armLPivot.rotation.x = Math.sin(this.walkTime * 0.5) * 0.1;
      this.armRPivot.rotation.x = -0.3 + Math.sin(this.walkTime * 0.5) * 0.05;
      this.legLPivot.rotation.x = 0;
      this.legRPivot.rotation.x = 0;
    }
    
    // Sword swing animation
    if (this.isSwinging) {
      this.swingTime += dt;
      
      if (this.swingTime < 0.15) {
        // Wind up: raise arm back
        const t = this.swingTime / 0.15;
        this.armRPivot.rotation.x = THREE.MathUtils.lerp(-0.5, -2.0, t);
      } else if (this.swingTime < 0.35) {
        // Swing down: fast slash
        const t = (this.swingTime - 0.15) / 0.2;
        this.armRPivot.rotation.x = THREE.MathUtils.lerp(-2.0, 0.8, t);
      } else if (this.swingTime < 0.6) {
        // Hold at bottom briefly
        this.armRPivot.rotation.x = 0.8;
      } else {
        // Return to ready
        const t = Math.min((this.swingTime - 0.6) / 0.3, 1.0);
        this.armRPivot.rotation.x = THREE.MathUtils.lerp(0.8, -0.5, t);
        if (t >= 1.0) {
          this.isSwinging = false;
          this.swingCooldown = 1.0; // 1 second between swings
        }
      }
    }
  }

  destroy() {
    this.scene.remove(this.mesh);
  }
}
