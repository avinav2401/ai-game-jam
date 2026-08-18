import * as THREE from 'three';
import { BaseTroll } from './BaseTroll.js';
import { audio } from '../systems/AudioManager.js';
import { events } from '../game/EventManager.js';
import { physics } from '../systems/Physics.js';

export class ChasingTreeTroll extends BaseTroll {
  constructor(treeGroup) {
    super('chasing_tree_' + treeGroup.uuid, {
      triggerDistance: 12,
      triggerPosition: treeGroup.position.clone(),
      oneShot: true, // Only ambush once
    });
    this.tree = treeGroup;
    this.basePosition = this.tree.position.clone();
    this.chaseTimer = 0;
    this.chaseDuration = 4.0 + Math.random() * 2.0; // Chases for 4-6 seconds
    this.speed = 10;
  }

  onTrigger(game) {
    this.chaseTimer = this.chaseDuration;
    audio.playTreeCreak();
  }

  onUpdate(dt, game) {
    if (this.chaseTimer > 0) {
      this.chaseTimer -= dt;

      const playerPos = game.player.getPosition();
      
      // Move towards player
      const dir = new THREE.Vector3().subVectors(playerPos, this.tree.position);
      dir.y = 0; // Don't fly
      
      // Face the player
      this.tree.lookAt(playerPos.x, this.tree.position.y, playerPos.z);
      
      const distance = dir.length();
      
      if (distance > 0.1) {
        dir.normalize();
        this.tree.position.addScaledVector(dir, this.speed * dt);
      }

      // Bobbing animation for running, keeping it on the ground
      let groundY = physics.getGroundY(this.tree.position.x, this.tree.position.z, 0.5);
      if (groundY === -Infinity) groundY = this.basePosition.y; // fallback if chasing over void
      
      const bounce = Math.sin(this.chaseTimer * 15);
      this.tree.position.y = groundY + Math.abs(bounce) * 0.5;

      // Play sound when hitting the ground (bounce crosses 0)
      if (bounce > -0.2 && bounce < 0.2 && !this.wasBouncing) {
        audio.playHeavyFootstep();
        this.wasBouncing = true;
      } else if (Math.abs(bounce) > 0.2) {
        this.wasBouncing = false;
      }

      // Check caught
      if (distance < 2.0) {
        if (!this.completed) {
          events.emit('playerDeath', 'The forest is alive. And hungry.');
          this.completed = true;
        }
      }

      // If timer runs out, stop completely where it stands
      if (this.chaseTimer <= 0) {
        this.completed = true;
        this.tree.position.y = groundY; // Plant it firmly on the ground
      }
    }
  }

  onReset() {
    this.tree.position.copy(this.basePosition);
    this.tree.rotation.set(0, 0, 0);
    this.chaseTimer = 0;
  }
}
