import * as THREE from 'three';
import { physics } from '../systems/Physics.js';

// Terrain — procedural ground with areas, paths, hills
export class Terrain {
  constructor(scene) {
    this.scene = scene;
    this.grounds = [];
    this.objects = [];
    
    // Materials
    this.grassMat = new THREE.MeshStandardMaterial({
      color: 0x7ec850, // vibrant green
      roughness: 0.8,
      flatShading: true,
    });

    this.dirtMat = new THREE.MeshStandardMaterial({
      color: 0x8c6b5d, // warm grey-brown rock
      roughness: 0.9,
      flatShading: true,
    });
    
    this.pathMat = new THREE.MeshStandardMaterial({
      color: 0xaaaaaa, // stone path
      roughness: 0.9,
      flatShading: true,
    });

    this.woodMat = new THREE.MeshStandardMaterial({
      color: 0x8b5a2b, // wooden planks
      roughness: 0.9,
      flatShading: true,
    });

    this.stoneMat = new THREE.MeshStandardMaterial({
      color: 0x777777, // stone rails
      roughness: 0.8,
      flatShading: true,
    });

    // Multi-material for boxes: [right, left, top, bottom, front, back]
    this.blockMat = [
      this.dirtMat,  // right
      this.dirtMat,  // left
      this.grassMat, // top
      this.dirtMat,  // bottom
      this.dirtMat,  // front
      this.dirtMat   // back
    ];
  }

  build(currentLevel = 1) {
    const FOREST_WIDTH = 100;

    if (currentLevel === 1) {
      // LEVEL 1
      // Area 1 — Start area (Z 0 to -30), flat
      this._addGround(0, 0, -15, FOREST_WIDTH, 2, 30);
      this._addPath(0, 1, -15, 4, 0.1, 30); // Path is at ~y=1

      // Area 2 — The Fork in the Road (Z -30 to -80)
      // Ground splits into two paths: Left (x=-8) and Right (x=8)
      // Left path
      this._addGround(-8, 0, -55, 6, 2, 50);
      this._addPath(-8, 1, -55, 4, 0.1, 50);
      // Right path - broken into segments with a fake hole
      this._addGround(8, 0, -38, 6, 2, 16);   // -30 to -46
      this._addPath(8, 1, -38, 4, 0.1, 16);

      this._addFakeGround(8, 0, -48, 6, 2, 4); // Fake hole: -46 to -50
      this._addFakePath(8, 1, -48, 4, 0.1, 4);

      this._addGround(8, 0, -65, 6, 2, 30);   // -50 to -80
      this._addPath(8, 1, -65, 4, 0.1, 30);

      // Area 3 — The Giant Tree platform (Z -80 to -110)
      this._addGround(0, 0, -95, FOREST_WIDTH, 2, 30);
      // Paths merge back
      this._addPath(-4, 1, -85, 8, 0.1, 10);
      this._addPath(4, 1, -85, 8, 0.1, 10);
      this._addPath(0, 1, -100, 4, 0.1, 20);
      
      // Raised platform for Giant Tree
      this._addHill(0, 2, -105, 10, 3, 10); // top surface y=3.5

    } else if (currentLevel === 2) {
      // LEVEL 2
      // Area 1 — Start area (Z 0 to -30), flat
      this._addGround(0, 0, -15, FOREST_WIDTH, 2, 30);
      this._addPath(0, 1, -15, 4, 0.1, 30); // Path is at ~y=1

      // Area 2 — Elevated terrace (Z -30 to -80)
      // Stairs leading up to y = 4 (Height diff = +3)
      this._addStairs(0, 1, -34, 4, 3, 8, 12); 
      // Elevated terrace ground at y = 3 (top surface is y=4)
      this._addGround(0, 3, -55, FOREST_WIDTH, 2, 34);
      this._addPath(0, 4, -55, 4, 0.1, 34); // Path is at ~y=4

      // Area 3 — The Underground Tunnel through a large hill (Z -80 to -140)
      // Stairs leading down into the tunnel entrance (Height diff = -3)
      this._addStairs(0, 4, -76, 4, -3, 8, 12); 
      // The tunnel carving through the hill
      this._addTunnel(0, 0, -110, 4, 3, 60); // path at ~y=1
      // Left side of the hill
      this._addGround(-26, 6, -110, (FOREST_WIDTH/2)-2, 8, 60); 
      // Right side of the hill
      this._addGround(26, 6, -110, (FOREST_WIDTH/2)-2, 8, 60);
      // Ceiling over the tunnel
      this._addGround(0, 6, -110, 4, 3, 60);
      
      // Tunnel Exit frame to make it look intentional (Z=-140 is the end)
      this._addGround(-3, 2, -141, 2, 4, 2); // left pillar
      this._addGround(3, 2, -141, 2, 4, 2);  // right pillar
      this._addGround(0, 4, -141, 8, 2, 2);  // arch top
      
      // Area 4 — Deep Valley (Z -140 to -190) - PARKOUR SECTION
      // Stairs leading further down to y = -2 (Height diff = -3)
      this._addStairs(0, 1, -144, 4, -3, 10, 12);
      
      // Gap over the void. We place floating platforms.
      let currentZ = -153;
      let i = 0;
      while (currentZ > -229) {
        const xOffset = (Math.random() - 0.5) * 4;
        const plat = this._addParkourPlatform(xOffset, -3, currentZ, 4, 4);
        this.parkourPlatforms.push({ mesh: plat, index: i });
        currentZ -= (4.5 + Math.random() * 2); 
        i++;
      }
      
      // End of parkour landing pad
      this._addGround(0, -3, -230, 8, 2, 8);
      
      // Area 5 — Final ascent to the house (Z -230 to -280)
      this._addStairs(0, -2, -232, 6, 5, 12, 20);
      this._addGround(0, 2, -259, FOREST_WIDTH, 2, 42);
      this._addPath(0, 3, -259, 6, 0.1, 42); // path at ~y=3
      // Dramatic raised platform for the teacup house
      this._addHill(0, 4, -270, 10, 3, 10); // top surface y=5.5
    }
  }

  _addGround(x, y, z, w, h, d) {
    const geo = new THREE.BoxGeometry(w, h, d);
    // Ensure UVs are properly set for multi-material if needed, 
    // but basic colors work fine.
    const mesh = new THREE.Mesh(geo, this.blockMat);
    mesh.position.set(x, y - h / 2 + 1, z); // Adjust so y=0 is surface level for top
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    this.scene.add(mesh);
    this.grounds.push(mesh);
    this.objects.push(mesh);
    physics.addCollider(mesh, 'solid', `ground_${this.grounds.length}`);
    return mesh;
  }

  _addFakeGround(x, y, z, w, h, d) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, this.blockMat);
    mesh.position.set(x, y - h / 2 + 1, z);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    this.scene.add(mesh);
    this.grounds.push(mesh);
    this.objects.push(mesh);
    // NO PHYSICS added here, causing player to fall!
    return mesh;
  }

  _addFakePath(x, y, z, w, h, d) {
    const geo = new THREE.BoxGeometry(w, h, d);
    
    // Create a simple procedural cobblestone texture using a canvas
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#9e9e9e';
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = '#757575';
    ctx.lineWidth = 4;
    for(let i=0; i<8; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random()*128, 0);
      ctx.lineTo(Math.random()*128, 128);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, Math.random()*128);
      ctx.lineTo(128, Math.random()*128);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(w / 4, d / 4);

    const pathMaterial = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 1.0,
      flatShading: true,
    });

    const mesh = new THREE.Mesh(geo, pathMaterial);
    mesh.position.set(x, y - h / 2 + 0.01, z); // slightly above ground
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    this.objects.push(mesh);
    return mesh;
  }

  clear() {
    for (const obj of this.objects) {
      this.scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (Array.isArray(obj.material)) {
        obj.material.forEach(m => m.dispose());
      } else if (obj.material) {
        obj.material.dispose();
      }
    }
    this.grounds = [];
    this.objects = [];
    this.parkourPlatforms = [];
  }

  _addParkourPlatform(x, y, z, w, d) {
    const h = 1.0;
    const geo = new THREE.BoxGeometry(w, h, d);
    const topMat = new THREE.MeshStandardMaterial({ color: 0x44aa44, roughness: 0.9, flatShading: true });
    const sideMat = new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 1.0, flatShading: true });
    const materials = [sideMat, sideMat, topMat, sideMat, sideMat, sideMat];
    const mesh = new THREE.Mesh(geo, materials);
    // Base y is surface y+1, so mesh center is (y+1) - h/2
    mesh.position.set(x, y + 1 - h / 2, z);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    this.scene.add(mesh);
    this.objects.push(mesh);
    
    // Assign a dynamic collider so it can be removed or moved
    const collider = physics.addCollider(mesh, 'solid', `parkour_${z}`);
    mesh.userData.collider = collider;
    
    return mesh;
  }
  

  
  _addPath(x, y, z, w, h, d) {
    const geo = new THREE.BoxGeometry(w, h, d);
    
    // Create a simple procedural cobblestone texture using a canvas
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#9e9e9e';
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = '#757575';
    ctx.lineWidth = 4;
    for(let i=0; i<8; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random()*128, 0);
      ctx.lineTo(Math.random()*128, 128);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, Math.random()*128);
      ctx.lineTo(128, Math.random()*128);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(w / 4, d / 4);

    const pathMaterial = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 1.0,
      flatShading: true,
    });

    const mesh = new THREE.Mesh(geo, pathMaterial);
    mesh.position.set(x, y - h / 2 + 0.01, z); // slightly above ground
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    this.objects.push(mesh);
    return mesh;
  }

  _addStairs(x, yStart, zCenter, width, totalHeight, totalDepth, stepsCount) {
    const stepDepth = totalDepth / stepsCount;
    const stepHeight = totalHeight / stepsCount;
    
    // We start from zCenter + totalDepth/2 (front) and go to zCenter - totalDepth/2 (back)
    const startZ = zCenter + (totalDepth / 2) - (stepDepth / 2);
    
    for (let i = 0; i < stepsCount; i++) {
      const stepY = yStart + (i * stepHeight);
      const stepZ = startZ - (i * stepDepth);
      
      // Wooden tread
      const geo = new THREE.BoxGeometry(width, Math.abs(stepHeight), stepDepth);
      const mesh = new THREE.Mesh(geo, this.woodMat);
      
      mesh.position.set(x, stepY + (stepHeight / 2), stepZ);
      mesh.receiveShadow = true;
      mesh.castShadow = true;
      
      this.scene.add(mesh);
      this.grounds.push(mesh);
      this.objects.push(mesh);
      physics.addCollider(mesh, 'solid', `stair_${x}_${stepY}_${stepZ}`);

      // Stone rail left
      const railGeo = new THREE.BoxGeometry(0.4, Math.abs(stepHeight) + 0.5, stepDepth);
      const railL = new THREE.Mesh(railGeo, this.stoneMat);
      railL.position.set(x - width/2 - 0.2, stepY + (stepHeight / 2) + 0.25, stepZ);
      railL.receiveShadow = true;
      railL.castShadow = true;
      this.scene.add(railL);
      this.objects.push(railL);
      physics.addCollider(railL, 'solid', `railL_${x}_${stepY}_${stepZ}`);

      // Stone rail right
      const railR = new THREE.Mesh(railGeo, this.stoneMat);
      railR.position.set(x + width/2 + 0.2, stepY + (stepHeight / 2) + 0.25, stepZ);
      railR.receiveShadow = true;
      railR.castShadow = true;
      this.scene.add(railR);
      this.objects.push(railR);
      physics.addCollider(railR, 'solid', `railR_${x}_${stepY}_${stepZ}`);
    }
  }

  _addTunnel(x, y, z, width, height, depth) {
    // Floor of the tunnel
    this._addGround(x, y, z, width, 2, depth);
    this._addPath(x, y + 1, z, width, 0.1, depth);
    // The walls and ceiling are built separately in the layout so they can form the hill.
  }

  _addHill(x, y, z, w, h, d) {
    // Make hills blocky too for the new aesthetic
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, this.blockMat);
    mesh.position.set(x, y - h / 2 + 1, z);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    this.scene.add(mesh);
    this.objects.push(mesh);
    
    physics.addCollider(mesh, 'solid', `hill_${this.grounds.length}`);
    this.grounds.push(mesh);
    
    // Add some grass tufts on top
    this._addDecorations(x, y + 1, z, w, d);
    
    return mesh;
  }
  
  _addDecorations(x, y, z, w, d) {
    // Add low-poly bushes
    const bushCount = Math.floor((w * d) / 15); // Sparse bushes
    const bushGeo = new THREE.IcosahedronGeometry(0.8, 0); // Low poly sphere
    bushGeo.translate(0, 0.6, 0); // Rest on ground
    const bushMat = new THREE.MeshStandardMaterial({ color: 0x66cc33, flatShading: true });
    
    if (bushCount > 0) {
      const instancedBushes = new THREE.InstancedMesh(bushGeo, bushMat, bushCount);
      const dummy = new THREE.Object3D();
      for (let i = 0; i < bushCount; i++) {
        dummy.position.set(
          x + (Math.random() - 0.5) * w * 0.8,
          y,
          z + (Math.random() - 0.5) * d * 0.8
        );
        dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        dummy.scale.setScalar(0.7 + Math.random() * 0.8);
        dummy.updateMatrix();
        instancedBushes.setMatrixAt(i, dummy.matrix);
      }
      instancedBushes.castShadow = true;
      this.scene.add(instancedBushes);
      this.objects.push(instancedBushes);
    }

    // Add low-poly rocks
    const rockCount = Math.floor((w * d) / 25);
    const rockGeo = new THREE.IcosahedronGeometry(0.5, 0);
    rockGeo.translate(0, 0.3, 0);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x888888, flatShading: true });

    if (rockCount > 0) {
      const instancedRocks = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
      const dummy2 = new THREE.Object3D();
      for (let i = 0; i < rockCount; i++) {
        dummy2.position.set(
          x + (Math.random() - 0.5) * w * 0.8,
          y,
          z + (Math.random() - 0.5) * d * 0.8
        );
        dummy2.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        dummy2.scale.setScalar(0.5 + Math.random() * 0.6);
        dummy2.updateMatrix();
        instancedRocks.setMatrixAt(i, dummy2.matrix);
      }
      instancedRocks.castShadow = true;
      this.scene.add(instancedRocks);
      this.objects.push(instancedRocks);
    }
  }
}
