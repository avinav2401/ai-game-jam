import * as THREE from 'three';

// Simple AABB-based physics: gravity, ground check, collision boxes
export class Physics {
  constructor() {
    this.gravity = -25; // Slowed down gravity for floaty falling
    this.colliders = []; // { box: THREE.Box3, type: 'solid'|'platform'|'kill', id: string }
  }

  addCollider(mesh, type = 'solid', id = '') {
    const box = new THREE.Box3().setFromObject(mesh);
    const entry = { box, mesh, type, id, enabled: true };
    this.colliders.push(entry);
    return entry;
  }

  removeCollider(id) {
    this.colliders = this.colliders.filter(c => c.id !== id);
  }

  clear() {
    this.colliders = [];
  }

  updateColliderFromMesh(entry) {
    if (entry.mesh) {
      entry.box.setFromObject(entry.mesh);
    }
  }

  // Check if a point is inside any solid collider
  checkCollision(playerBox) {
    const hits = [];
    for (const c of this.colliders) {
      if (!c.enabled) continue;
      if (playerBox.intersectsBox(c.box)) {
        hits.push(c);
      }
    }
    return hits;
  }

  // Get the highest ground Y beneath a position within a column, ignoring ceilings
  getGroundY(x, z, radius = 0.3, currentY = Infinity) {
    let highestY = -Infinity;
    for (const c of this.colliders) {
      if (!c.enabled) continue;
      if (c.type === 'kill') continue;
      const b = c.box;
      if (x + radius > b.min.x && x - radius < b.max.x &&
          z + radius > b.min.z && z - radius < b.max.z) {
        
        // If the ground is higher than highestY, and it's not a ceiling far above us
        // A block is considered a ceiling if its bottom (b.min.y) is above our head
        // or if its top (b.max.y) is way above our current feet (currentY)
        // Let's assume player can step up at most 1.5 units
        if (b.max.y > highestY && b.max.y <= currentY + 1.5) {
          highestY = b.max.y;
        }
      }
    }
    return highestY;
  }
  // Resolve horizontal collision for a moving circle
  resolveHorizontalCollision(x, y, z, radius) {
    let newX = x;
    let newZ = z;
    const maxStepHeight = 0.6; // Can step up this high without getting blocked

    for (const c of this.colliders) {
      if (!c.enabled || c.type === 'kill') continue;
      const b = c.box;
      
      // If the top of the box is low enough to step on, ignore horizontal collision
      if (b.max.y <= y + maxStepHeight) continue;
      // If the bottom of the box is above our head, ignore
      if (b.min.y >= y + 1.5) continue;
      
      const closestX = Math.max(b.min.x, Math.min(newX, b.max.x));
      const closestZ = Math.max(b.min.z, Math.min(newZ, b.max.z));
      
      const dx = newX - closestX;
      const dz = newZ - closestZ;
      const distanceSq = dx * dx + dz * dz;
      
      if (distanceSq < radius * radius && distanceSq > 0) {
        const distance = Math.sqrt(distanceSq);
        const pushDist = radius - distance;
        newX += (dx / distance) * pushDist;
        newZ += (dz / distance) * pushDist;
      } else if (distanceSq === 0) {
        // Center is inside
        const distLeft = newX - b.min.x;
        const distRight = b.max.x - newX;
        const distFront = newZ - b.min.z;
        const distBack = b.max.z - newZ;
        const minDist = Math.min(distLeft, distRight, distFront, distBack);
        
        if (minDist === distLeft) newX -= (distLeft + radius);
        else if (minDist === distRight) newX += (distRight + radius);
        else if (minDist === distFront) newZ -= (distFront + radius);
        else newZ += (distBack + radius);
      }
    }
    return { x: newX, z: newZ };
  }
}

export const physics = new Physics();
