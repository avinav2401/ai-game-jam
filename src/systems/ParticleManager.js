import * as THREE from 'three';

// ParticleManager — simple point-based particle emitters
export class ParticleManager {
  constructor(scene) {
    this.scene = scene;
    this.emitters = [];
  }

  createEmitter(position, options = {}) {
    const {
      count = 40,
      color = 0x4ade80,
      size = 0.15,
      spread = 1,
      speed = 2,
      lifetime = 1.5,
      gravity = -3,
      loop = false,
    } = options;

    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = [];
    const lifetimes = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = position.x + (Math.random() - 0.5) * spread;
      positions[i * 3 + 1] = position.y + Math.random() * spread * 0.5;
      positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * spread;
      velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * speed,
        Math.random() * speed * 1.5,
        (Math.random() - 0.5) * speed,
      ));
      lifetimes.push(Math.random() * lifetime);
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color,
      size,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(geo, mat);
    this.scene.add(points);

    const emitter = {
      points, geo, mat, velocities, lifetimes,
      origin: position.clone(),
      maxLifetime: lifetime,
      gravity,
      loop,
      age: 0,
      dead: false,
      count,
    };
    this.emitters.push(emitter);
    return emitter;
  }

  update(dt) {
    for (let e = this.emitters.length - 1; e >= 0; e--) {
      const em = this.emitters[e];
      if (em.dead) continue;
      em.age += dt;

      const pos = em.geo.attributes.position.array;
      let allDead = true;

      for (let i = 0; i < em.count; i++) {
        em.lifetimes[i] -= dt;
        if (em.lifetimes[i] <= 0) {
          if (em.loop) {
            // respawn
            pos[i * 3] = em.origin.x + (Math.random() - 0.5);
            pos[i * 3 + 1] = em.origin.y;
            pos[i * 3 + 2] = em.origin.z + (Math.random() - 0.5);
            em.lifetimes[i] = em.maxLifetime * (0.5 + Math.random() * 0.5);
            em.velocities[i].set(
              (Math.random() - 0.5) * 2,
              Math.random() * 3,
              (Math.random() - 0.5) * 2,
            );
            allDead = false;
          }
          continue;
        }
        allDead = false;

        const v = em.velocities[i];
        v.y += em.gravity * dt;
        pos[i * 3] += v.x * dt;
        pos[i * 3 + 1] += v.y * dt;
        pos[i * 3 + 2] += v.z * dt;
      }

      em.geo.attributes.position.needsUpdate = true;
      em.mat.opacity = Math.max(0, 1 - em.age / (em.maxLifetime * 2));

      if (allDead && !em.loop) {
        em.dead = true;
        this.scene.remove(em.points);
        em.geo.dispose();
        em.mat.dispose();
        this.emitters.splice(e, 1);
      }
    }
  }

  removeEmitter(emitter) {
    emitter.dead = true;
    this.scene.remove(emitter.points);
    emitter.geo.dispose();
    emitter.mat.dispose();
    const idx = this.emitters.indexOf(emitter);
    if (idx >= 0) this.emitters.splice(idx, 1);
  }

  clear() {
    for (const em of this.emitters) {
      this.scene.remove(em.points);
      em.geo.dispose();
      em.mat.dispose();
    }
    this.emitters = [];
  }
}
