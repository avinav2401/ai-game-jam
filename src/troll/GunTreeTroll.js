import * as THREE from 'three';
import { BaseTroll } from './BaseTroll.js';
import { audio } from '../systems/AudioManager.js';
import { events } from '../game/EventManager.js';

export class GunTreeTroll extends BaseTroll {
  constructor(treeGroup, scene) {
    super('gun_tree', {
      triggerDistance: 15,
      triggerPosition: treeGroup.position.clone(),
      oneShot: true, // Only trick them once
    });
    this.tree = treeGroup;
    this.scene = scene;
    
    // Create a gun for the tree
    this.gun = new THREE.Group();
    
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.2 });
    
    // Gun body
    const gunBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.3), gunMat);
    // Gun barrel
    const gunBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.2), gunMat);
    gunBarrel.rotation.x = Math.PI / 2;
    gunBarrel.position.set(0, 0.2, 0.6);
    
    this.gun.add(gunBody, gunBarrel);
    
    // Attach to tree but hide initially
    this.tree.add(this.gun);
    this.gun.position.set(0, 2.5, 1.0); // Middle of tree, pointing outwards
    this.gun.visible = false;
    
    this.shotsFired = 0;
    this.fireTimer = 0;
    this.isShooting = false;
    this.bullets = [];
    
    // Listen for player death to hide gun and stop shooting if player dies
    this.onDeath = () => {
      this.isShooting = false;
      this.gun.visible = false;
      this.shotsFired = 2; // Prevent further shooting
    };
    events.on('playerDeath', this.onDeath);
  }

  onTrigger(game) {
    this.isShooting = true;
    this.gun.visible = true;
    this.fireTimer = 0.5; // Fire first shot after half a second
  }

  onUpdate(dt, game) {
    // Update active bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.age += dt;
      if (b.age > 3) {
        this.scene.remove(b.mesh);
        this.bullets.splice(i, 1);
        continue;
      }
      b.mesh.position.addScaledVector(b.dir, 30 * dt);
      
      // Check hit with player
      if (b.mesh.position.distanceTo(game.player.getPosition()) < 1.0) {
         events.emit('playerDeath', 'THE TREES ARE ARMED!');
         this.scene.remove(b.mesh);
         this.bullets.splice(i, 1);
      }
    }

    if (!this.isShooting) return;

    // Aim at player
    const target = game.player.getPosition().clone().add(new THREE.Vector3(0, 1, 0));
    // Calculate direction from tree to player
    const dirToPlayer = new THREE.Vector3().subVectors(target, this.tree.position).normalize();
    // Gun needs to point towards player
    // Since tree has no rotation, we can just use lookAt
    const gunWorldPos = new THREE.Vector3();
    this.gun.getWorldPosition(gunWorldPos);
    // Tree might not rotate, but we just rotate the gun to face player
    // Note: lookAt usually makes -Z face the target. Our gun barrel is along +Z.
    // Let's adjust lookAt logic
    const lookTarget = gunWorldPos.clone().add(dirToPlayer);
    this.gun.lookAt(lookTarget);
    // Because lookAt makes -Z face target, and our barrel is +Z, we need to flip it
    this.gun.rotateY(Math.PI);

    this.fireTimer -= dt;
    if (this.fireTimer <= 0 && this.shotsFired < 2) {
      this.fireTimer = 1.0; // 1 second between shots
      this.shotsFired++;
      
      // Spawn bullet
      const geo = new THREE.SphereGeometry(0.3, 8, 8);
      const mat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const bullet = new THREE.Mesh(geo, mat);
      
      const origin = new THREE.Vector3();
      this.gun.getWorldPosition(origin);
      
      // Our gun's forward is actually its local +Z, but due to the flip above,
      // dirToPlayer is the actual world direction we want.
      const dir = dirToPlayer.clone();
      
      origin.addScaledVector(dir, 1.5); // Offset forward from center of gun
      
      bullet.position.copy(origin);
      this.scene.add(bullet);
      
      this.bullets.push({ mesh: bullet, dir: dir, age: 0 });
      
      // Gun recoil visual
      this.gun.position.addScaledVector(dir, -0.5);
      
      audio.playZombieDeath(); // Re-use zombie sound for shot
    }
    
    // Recover recoil
    if (this.isShooting) {
      // Local position recovery
      this.gun.position.lerp(new THREE.Vector3(0, 2.5, 0), 10 * dt);
    }
    
    if (this.shotsFired >= 2 && this.bullets.length === 0) {
      this.isShooting = false;
      this.gun.visible = false;
    }
  }
}
