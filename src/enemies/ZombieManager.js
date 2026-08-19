import * as THREE from 'three';
import { Zombie } from './Zombie.js';
import { events } from '../game/EventManager.js';

export class ZombieManager {
  constructor(scene) {
    this.scene = scene;
    this.zombies = [];
  }

  spawnZombies(level) {
    this.clear();
    
    // Only spawn zombies in Level 2 near the house
    if (level === 2) {
      this.zombies.push(new Zombie(this.scene, -5, 5, -260));
      this.zombies.push(new Zombie(this.scene, 5, 5, -265));
      this.zombies.push(new Zombie(this.scene, 0, 5, -268));
    }
  }

  update(dt, player) {
    const playerPos = player.getPosition();
    
    for (const zombie of this.zombies) {
      zombie.update(dt, playerPos, player.hasGun);
      
      // Check collision with player
      if (!zombie.isDead && !player.isDead) {
        const dist = zombie.getPosition().distanceTo(playerPos);
        if (dist < 1.2) {
          // Zombie slashes player with sword
          events.emit('playerDeath', 'Sliced by a zombie sword!');
        }
      }
    }
  }
  
  checkRaycastHit(raycaster) {
    // Check if player shot a zombie
    let closestZombie = null;
    let minDistance = Infinity;

    for (const zombie of this.zombies) {
      if (zombie.isDead) continue;
      
      // We check intersection with the zombie's bounding box
      const box = new THREE.Box3().setFromObject(zombie.mesh);
      const target = new THREE.Vector3();
      const hit = raycaster.ray.intersectBox(box, target);
      
      if (hit) {
        const dist = raycaster.ray.origin.distanceTo(target);
        if (dist < minDistance) {
          minDistance = dist;
          closestZombie = zombie;
        }
      }
    }

    if (closestZombie) {
      closestZombie.kill();
      return true;
    }
    
    return false;
  }

  checkBulletHit(pos, radius) {
    for (const zombie of this.zombies) {
      if (zombie.isDead) continue;
      
      const dist = zombie.getPosition().distanceTo(pos);
      // Rough bounding sphere check
      if (dist < 1.5) {
        zombie.kill();
        return true;
      }
    }
    return false;
  }

  clear() {
    for (const zombie of this.zombies) {
      zombie.destroy();
    }
    this.zombies = [];
  }
}
