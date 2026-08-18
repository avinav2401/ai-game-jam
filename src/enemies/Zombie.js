import * as THREE from 'three';
import { physics } from '../systems/Physics.js';
import { audio } from '../systems/AudioManager.js';

export class Zombie {
  constructor(scene, x, y, z) {
    this.scene = scene;
    this.isDead = false;
    this.speed = 3.5;
    
    // Zombie Mesh
    this.mesh = new THREE.Group();
    
    // Materials
    const skinMat = new THREE.MeshStandardMaterial({ color: 0x44aa44, roughness: 0.8, flatShading: false }); // green skin
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0x554433, roughness: 0.9, flatShading: false }); // ragged brown shirt
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x222233, roughness: 0.9, flatShading: false }); // dark pants
    
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

    // Arms (raised forward like a classic zombie)
    this.armL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.2), skinMat);
    this.armL.position.set(-0.4, 1.0, 0.3);
    this.armL.rotation.x = Math.PI / 2; // point forward
    this.armL.castShadow = true;
    this.mesh.add(this.armL);

    this.armR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.6, 0.2), skinMat);
    this.armR.position.set(0.4, 1.0, 0.3);
    this.armR.rotation.x = Math.PI / 2;
    this.armR.castShadow = true;
    this.mesh.add(this.armR);

    // Legs
    this.legL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.5, 0.25), pantsMat);
    this.legL.position.set(-0.15, 0.25, 0);
    this.legL.castShadow = true;
    this.mesh.add(this.legL);

    this.legR = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.5, 0.25), pantsMat);
    this.legR.position.set(0.15, 0.25, 0);
    this.legR.castShadow = true;
    this.mesh.add(this.legR);

    this.mesh.position.set(x, y, z);
    this.scene.add(this.mesh);
    
    // Animation state
    this.walkTime = Math.random() * 10;
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
    
    // Only chase if player is within range AND has the gun
    if (canChase && dist < 50 && dist > 1.0) {
      // Look at player
      const targetPos = playerPos.clone();
      targetPos.y = this.mesh.position.y; // keep level
      this.mesh.lookAt(targetPos);
      
      // Move towards player
      const dir = new THREE.Vector3().subVectors(targetPos, this.mesh.position).normalize();
      
      this.mesh.position.x += dir.x * this.speed * dt;
      this.mesh.position.z += dir.z * this.speed * dt;
      
      // Simple physics/ground check
      const groundY = physics.getGroundY(this.mesh.position.x, this.mesh.position.z);
      if (groundY !== -Infinity) {
        this.mesh.position.y = groundY;
      }
      
      // Animation (waddle)
      this.walkTime += dt * 5;
      this.armL.rotation.x = Math.sin(this.walkTime) * 0.5;
      this.armR.rotation.x = -Math.sin(this.walkTime) * 0.5;
      this.legL.rotation.x = -Math.sin(this.walkTime) * 0.5;
      this.legR.rotation.x = Math.sin(this.walkTime) * 0.5;
    } else {
      // Just apply gravity to stay on ground if not chasing
      const groundY = physics.getGroundY(this.mesh.position.x, this.mesh.position.z);
      if (groundY !== -Infinity) {
        this.mesh.position.y = groundY;
      }
    }
  }

  destroy() {
    this.scene.remove(this.mesh);
  }
}
