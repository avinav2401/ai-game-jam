import * as THREE from 'three';
import { BaseTroll } from './BaseTroll.js';
import { audio } from '../systems/AudioManager.js';
import { events } from '../game/EventManager.js';
import { physics } from '../systems/Physics.js';

export class ExplodingHouseTroll extends BaseTroll {
  constructor(houseGroup) {
    super('exploding_house', {
      triggerDistance: 4, // Very close, basically at the door
      triggerPosition: houseGroup.position.clone(),
      oneShot: true
    });
    this.house = houseGroup;
    this.explosionTimer = 0;
    this.exploded = false;
    this.particles = [];
  }

  onTrigger(game) {
    // Stop normal gameplay inputs just before the explosion?
    // Let's just explode immediately.
    this.exploded = true;
    audio.playDeath(); // Loud boom
    
    // Hide original house
    this.house.visible = false;
    
    // Create explosion debris
    const colors = [0xffffff, 0x8b4513, 0xff0000]; // white teacup, brown roof, red door
    for (let i = 0; i < 50; i++) {
      const size = 0.2 + Math.random() * 0.8;
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(size, size, size),
        new THREE.MeshStandardMaterial({ color: colors[Math.floor(Math.random() * colors.length)] })
      );
      mesh.position.copy(this.triggerPosition).add(new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        (Math.random()) * 4,
        (Math.random() - 0.5) * 4
      ));
      
      // Velocity
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        10 + Math.random() * 20,
        (Math.random() - 0.5) * 20
      );
      
      game.scene.add(mesh);
      this.particles.push({ mesh, velocity: vel });
    }

    // Apply massive knockback to player
    const pVelocity = game.player.velocity;
    pVelocity.set(0, 25, 30); // Knocked high and backwards

    // Delay the death screen slightly so they can watch themselves fly
    setTimeout(() => {
      events.emit('playerDeath', 'BOOM! Welcome home.');
    }, 1500);
  }

  onUpdate(dt, game) {
    if (this.exploded) {
      // Animate debris
      for (const p of this.particles) {
        p.mesh.position.addScaledVector(p.velocity, dt);
        p.velocity.y -= 30 * dt; // gravity
        p.mesh.rotation.x += dt * Math.random() * 5;
        p.mesh.rotation.y += dt * Math.random() * 5;
      }
    }
  }

  onReset() {
    this.exploded = false;
    this.house.visible = true;
    for (const p of this.particles) {
      if (p.mesh.parent) {
        p.mesh.parent.remove(p.mesh);
      }
    }
    this.particles = [];
  }
}
