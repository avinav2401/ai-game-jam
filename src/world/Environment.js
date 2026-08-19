import * as THREE from 'three';
import { physics } from '../systems/Physics.js';

// Environment — procedural trees, rocks, bushes, signs, bridges, checkpoint pillars
export class Environment {
  constructor(scene) {
    this.scene = scene;
    this.objects = [];
    this.door = null;
    this.coin = null;
    this.npc = null;
    this.button = null;
    this.ladder = null;
    this.fallingTree = null;
    this.trees = [];
    this.flags = [];
    this.time = 0;
    this.animatedMaterials = [];
  }

  clear() {
    for (const obj of this.objects) {
      this.scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    }
    
    // Additional removals for explicitly tracked complex troll meshes
    const complexObjs = [this.door, this.coin, this.npc, this.button, this.ladder, this.fallingTree, this.bridgePlanks, this.trapTree, this.safeTree];
    for (const obj of complexObjs) {
      if (!obj) continue;
      if (Array.isArray(obj)) {
         for(const o of obj) this.scene.remove(o);
      } else {
         this.scene.remove(obj);
      }
    }

    this.objects = [];
    this.trees = [];
    this.flags = [];
    this.door = null;
    this.coin = null;
    this.npc = null;
    this.button = null;
    this.ladder = null;
    this.fallingTree = null;
    this.bridgePlanks = [];
    this.trapTree = null;
    this.safeTree = null;
    this.gunPickup = null;
  }

  build(checkpointMgr, currentLevel = 1) {
    // Materials
    this.grassMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.8, flatShading: true });
    this.rockMat = new THREE.MeshStandardMaterial({ color: 0x8b8c89, roughness: 0.9, flatShading: true });
    this.treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9, flatShading: true });
    this.bushMat = new THREE.MeshStandardMaterial({ color: 0x66cc33, roughness: 0.9, flatShading: true });
    
    // Pine tree material
    this.pineLeavesMat = new THREE.MeshStandardMaterial({ color: 0x3a7c46, roughness: 0.9, flatShading: true });
    // Leafy tree material
    this.puffLeavesMat = new THREE.MeshStandardMaterial({ color: 0x439c4e, roughness: 0.8, flatShading: true });
    
    this.waterMat = new THREE.MeshPhysicalMaterial({ color: 0x0077be, transparent: true, opacity: 0.6, roughness: 0.1, metalness: 0.1 });

    // Spawn point for both levels
    checkpointMgr.addCheckpoint('cp0', new THREE.Vector3(0, 1, 0), null);

    if (currentLevel === 1) {
      // LEVEL 1: Start to Giant Tree, Fork in the road

      // Grass patches (BEFORE trees so getGroundY doesn't hit trees)
      for (let i = 0; i < 40; i++) {
        const x = (Math.random() - 0.5) * 30;
        const z = 5 - Math.random() * 110;
        const y = physics.getGroundY(x, z);
        if (y !== -Infinity) this._addGrassPatch(x, y, z);
      }

      // Trees, bushes, rocks scattered
      for (let i = 0; i < 80; i++) {
        const side = Math.random() > 0.5 ? 1 : -1;
        const x = side * (6 + Math.random() * 25);
        const z = 5 - Math.random() * 110;
        const y = physics.getGroundY(x, z);
        if (y === -Infinity) continue;
        if (Math.random() > 0.4) this._addTree(x, y, z);
        else this._addBush(x, y, z);
      }
      for (let i = 0; i < 20; i++) {
        const side = Math.random() > 0.5 ? 1 : -1;
        const x = side * (5 + Math.random() * 20);
        const z = 5 - Math.random() * 110;
        const y = physics.getGroundY(x, z);
        if (y === -Infinity) continue;
        this._addRock(x, y, z);
      }

      this._addSign(0, 0, -5, 'Walk toward the tree.\nIt\'s friendly. Probably.', 0);
      this._addSign(0, 0, -35, 'Left or Right?\nChoose wisely.', 0);

      const cp1 = this._addCheckpointFlag(0, 0, -25);
      checkpointMgr.addCheckpoint('cp1', new THREE.Vector3(0, 1, -25), cp1);

      // The Fork in the road trolls
      // Left path trap tree (spawn beside the path so it falls ONTO it)
      this.trapTree = this._addFallingTree(-10, 1, -55);
      this.safeTree = this._addTree(8, 1, -55);
      
      this.house = this._addTeacupHouse(0, 5.5, -225);
      this.key = this._addHouseKey(0, 6.5, -218);

    } else if (currentLevel === 2) {
      // LEVEL 2: Deep Valley, Parkour, Tunnel

      // Grass patches (BEFORE trees so getGroundY doesn't hit trees)
      for (let i = 0; i < 80; i++) {
        const x = (Math.random() - 0.5) * 30;
        const z = 5 - Math.random() * 240;
        const y = physics.getGroundY(x, z);
        if (y !== -Infinity) this._addGrassPatch(x, y, z);
      }

      // Trees, bushes, rocks scattered
      for (let i = 0; i < 150; i++) {
        const side = Math.random() > 0.5 ? 1 : -1;
        const x = side * (6 + Math.random() * 25);
        const z = 5 - Math.random() * 240;
        const y = physics.getGroundY(x, z);
        if (y === -Infinity) continue;
        if (Math.random() > 0.4) this._addTree(x, y, z);
        else this._addBush(x, y, z);
      }
      for (let i = 0; i < 40; i++) {
        const side = Math.random() > 0.5 ? 1 : -1;
        const x = side * (5 + Math.random() * 20);
        const z = 5 - Math.random() * 240;
        const y = physics.getGroundY(x, z);
        if (y === -Infinity) continue;
        this._addRock(x, y, z);
      }

      this._addSign(2, 3, -38, '→ SAFE PATH', Math.PI / 8);
      this._addSign(-2, 3, -38, '← DANGER', -Math.PI / 8);
      this._addSign(0, 3, -80, 'Tunnel ahead.\nWatch your head.', 0);
      this._addSign(0, 0, -130, 'Almost there!\n...or is it?', 0);
      this._addSign(-2, 0, -139, 'Mind the step\ngoing DOWN!', Math.PI/8);

      this.bridgePlanks = [];
      for (let i = 0; i < 5; i++) {
        const plank = this._addBridgePlank(0, -0.1, -81 - i * 1.2);
        this.bridgePlanks.push(plank);
      }

      const cp1 = this._addCheckpointFlag(0, 0, -25);
      checkpointMgr.addCheckpoint('cp1', new THREE.Vector3(0, 1, -25), cp1);

      const cp2 = this._addCheckpointFlag(0, 3, -72);
      checkpointMgr.addCheckpoint('cp2', new THREE.Vector3(0, 4, -72), cp2);

      // Gun Tree troll right before tunnel
      this.gunTree = this._addTree(6, 3, -70);

      const cp3 = this._addCheckpointFlag(-1.5, 0, -115);
      checkpointMgr.addCheckpoint('cp3_fake', new THREE.Vector3(-1.5, 1, -115), cp3, true);

      const cp3r = this._addCheckpointFlag(0, 0, -138);
      checkpointMgr.addCheckpoint('cp3', new THREE.Vector3(0, 1, -138), cp3r);

      const cp4 = this._addCheckpointFlag(0, -3, -160);
      checkpointMgr.addCheckpoint('cp4', new THREE.Vector3(0, -2, -160), cp4);

      const cp5 = this._addCheckpointFlag(0, 2, -250);
      checkpointMgr.addCheckpoint('cp5', new THREE.Vector3(0, 3, -250), cp5);

      this.door = this._addDoor(0, 0, -130);
      this.coin = this._addCoin(2, 3.5, -60);
      this.npc = this._addNPC(-3, 3, -50, 'That tunnel ahead\nis perfectly safe!');
      this.button = this._addButton(0, -3, -210);
      this.ladder = this._addLadder(5, -3, -205);
      
      this.hammers = [
        this._addHammer(0, 6, -170),
        this._addHammer(0, 6, -190),
        this._addHammer(0, 6, -210)
      ];
      
      this.gunPickup = this._addGunPickup(0, 4, -240);
    }
  }

  update(dt) {
    this.time += dt;

    // Animate torches (flags array now holds torches)
    for (const group of this.flags) {
      if (group.userData.isTorch && group.userData.fireMesh.material.opacity > 0) {
        // Flickering effect
        const fire = group.userData.fireMesh;
        const scale = 1.0 + Math.sin(this.time * 20 + group.position.z) * 0.2;
        fire.scale.set(scale, scale, scale);
        
        // Randomize light intensity slightly
        group.userData.light.intensity = 2.0 + Math.random() * 0.5;
        
        // Make the fire randomly rotate
        fire.rotation.x += dt * 5;
        fire.rotation.y += dt * 3;
      }
    }
  }

  clear() {
    for (const obj of this.objects) {
      this.scene.remove(obj);
      obj.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }
    this.objects = [];
    this.flags = [];
    this.trees = [];
    this.door = null;
    this.coin = null;
    this.npc = null;
    this.button = null;
    this.ladder = null;
    this.fallingTree = null;
    this.trapTree = null;
    this.safeTree = null;
  }

  _addTree(x, y, z) {
    const group = new THREE.Group();
    // Trunk - base is at Y=0 (so it rests exactly on the ground, growing upwards)
    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 1.2, 5);
    // Shift geometry so the origin is at the bottom center of the trunk
    trunkGeo.translate(0, 0.6, 0); 
    const trunk = new THREE.Mesh(trunkGeo, this.treeTrunkMat);
    trunk.castShadow = true;
    group.add(trunk);

    // Randomly pick between leafy tree or pine tree
    if (Math.random() > 0.5) {
      // Leafy tree: Multiple overlapping Icosahedrons (detail 1) for a realistic low-poly canopy
      const puffGeo = new THREE.IcosahedronGeometry(1, 1); 
      
      const puff1 = new THREE.Mesh(puffGeo, this.puffLeavesMat);
      puff1.position.set(0, 2.5, 0);
      puff1.scale.set(1.5, 1.3, 1.5);
      puff1.castShadow = true;
      group.add(puff1);

      const puff2 = new THREE.Mesh(puffGeo, this.puffLeavesMat);
      puff2.position.set(0.6, 2.0, 0.6);
      puff2.scale.set(1.0, 1.0, 1.0);
      puff2.castShadow = true;
      group.add(puff2);

      const puff3 = new THREE.Mesh(puffGeo, this.puffLeavesMat);
      puff3.position.set(-0.6, 2.1, 0.5);
      puff3.scale.set(0.9, 0.9, 0.9);
      puff3.castShadow = true;
      group.add(puff3);
      
      const puff4 = new THREE.Mesh(puffGeo, this.puffLeavesMat);
      puff4.position.set(0.4, 2.2, -0.6);
      puff4.scale.set(1.1, 1.0, 1.1);
      puff4.castShadow = true;
      group.add(puff4);

      const puff5 = new THREE.Mesh(puffGeo, this.puffLeavesMat);
      puff5.position.set(-0.4, 1.9, -0.5);
      puff5.scale.set(0.8, 0.8, 0.8);
      puff5.castShadow = true;
      group.add(puff5);
    } else {
      // Pine tree: 5 overlapping cone layers with 6 segments, tapering nicely
      const layers = 5;
      for (let i = 0; i < layers; i++) {
        const radius = 1.6 - (i * 0.25);
        const height = 1.8;
        const yPos = 1.8 + (i * 0.6); // Raised slightly to show trunk at the bottom
        const cone = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 6), this.pineLeavesMat);
        cone.position.y = yPos;
        // slightly tilt some layers for realism
        if (i % 2 === 0 && i > 0) {
          cone.rotation.z = (Math.random() - 0.5) * 0.1;
          cone.rotation.x = (Math.random() - 0.5) * 0.1;
        }
        cone.castShadow = true;
        group.add(cone);
      }
    }

    // group.position.set places the bottom of the trunk exactly at (x, y, z)
    group.position.set(x, y, z);
    this.scene.add(group);
    
    this.objects.push(group);
    this.trees.push(group);
    return group;
  }

  _addRock(x, y, z) {
    const geo = new THREE.IcosahedronGeometry(0.5 + Math.random() * 0.4, 0);
    const mesh = new THREE.Mesh(geo, this.rockMat);
    mesh.position.set(x, y + 0.2, z);
    mesh.rotation.set(Math.random(), Math.random(), Math.random());
    mesh.scale.set(1, 0.6 + Math.random() * 0.4, 1); // squashed a bit
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    physics.addCollider(mesh, 'solid', `rock_${x}_${z}`);
    this.objects.push(mesh);
  }

  _addSign(x, y, z, text, rotY) {
    const group = new THREE.Group();

    // Post
    const post = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 1.5, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x8B6914, flatShading: true })
    );
    post.position.y = 0.75;
    group.add(post);

    // Board
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.8, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xA0824A, flatShading: true })
    );
    board.position.y = 1.4;
    group.add(board);

    // Text as a small canvas texture
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#A0824A';
    ctx.fillRect(0, 0, 256, 128);
    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';

    const lines = text.split('\n');
    lines.forEach((line, i) => {
      ctx.fillText(line, 128, 40 + i * 28);
    });

    const tex = new THREE.CanvasTexture(canvas);
    const textPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 0.7),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true })
    );
    textPlane.position.set(0, 1.4, 0.05);
    group.add(textPlane);

    group.position.set(x, y, z);
    group.rotation.y = rotY;
    this.scene.add(group);
    this.objects.push(group);
    return group;
  }

  _addBridgePlank(x, y, z) {
    const geo = new THREE.BoxGeometry(2.5, 0.15, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x6B4226,
      flatShading: true,
      roughness: 0.9,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    const collider = physics.addCollider(mesh, 'solid', `plank_${z}`);
    mesh.userData.collider = collider;
    this.objects.push(mesh);
    return mesh;
  }

  _addCheckpointFlag(x, y, z) {
    const group = new THREE.Group();

    // Wooden Torch Handle
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.05, 1.5, 8),
      new THREE.MeshStandardMaterial({
        color: 0x5c4033, // dark wood
        roughness: 0.9,
      })
    );
    pole.position.y = 0.75;
    pole.castShadow = true;
    group.add(pole);

    // Metal Bowl at top
    const bowl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.1, 0.3, 8),
      new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.5,
        metalness: 0.8,
        side: THREE.DoubleSide
      })
    );
    bowl.position.y = 1.6;
    bowl.castShadow = true;
    group.add(bowl);

    // Fire Mesh (initially small/hidden)
    const fireGeo = new THREE.IcosahedronGeometry(0.3, 1);
    const fireMat = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0.0
    });
    const fire = new THREE.Mesh(fireGeo, fireMat);
    fire.position.y = 1.8;
    group.add(fire);

    // Glow light (off by default)
    const light = new THREE.PointLight(0xff6600, 0, 10);
    light.position.y = 2.0;
    group.add(light);

    // Store references for the manager
    group.userData.fireMesh = fire;
    group.userData.light = light;
    group.userData.isTorch = true;

    group.position.set(x, y, z); // Place on ground
    this.scene.add(group);
    
    // We add to flags array so it gets updated if we want to animate the fire
    this.flags.push(group);
    this.objects.push(group);
    return group;
  }

  _addBush(x, y, z) {
    const geo = new THREE.IcosahedronGeometry(0.6 + Math.random() * 0.3, 0);
    const mesh = new THREE.Mesh(geo, this.bushMat);
    mesh.position.set(x, y + 0.4, z);
    mesh.scale.y = 0.8;
    mesh.castShadow = true;
    this.scene.add(mesh);
    this.objects.push(mesh);
  }

  // --- NEW TROLL OBJECT HELPERS ---

  _addDoor(x, y, z) {
    const group = new THREE.Group();
    // Pillars
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x444455, flatShading: true });
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(1, 4, 1), pillarMat);
    p1.position.set(-3, 2, 0);
    const p2 = new THREE.Mesh(new THREE.BoxGeometry(1, 4, 1), pillarMat);
    p2.position.set(3, 2, 0);
    group.add(p1, p2);

    // The moving gate itself
    const gateGeo = new THREE.BoxGeometry(5, 4, 0.5);
    const gateMat = new THREE.MeshStandardMaterial({ color: 0x5C3A1E, flatShading: true });
    const gate = new THREE.Mesh(gateGeo, gateMat);
    gate.position.set(0, 2, 0);
    group.add(gate);
    
    // Add collider for the gate
    physics.addCollider(gate, 'solid', `door_gate`);

    group.position.set(x, y, z);
    this.scene.add(group);
    
    return { group, gate };
  }

  _addCoin(x, y, z) {
    const geo = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16);
    const mat = new THREE.MeshStandardMaterial({ 
      color: 0xffd700, 
      metalness: 0.8, 
      roughness: 0.2 
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + 0.5, z);
    mesh.rotation.x = Math.PI / 2;
    this.scene.add(mesh);
    return mesh;
  }

  _addNPC(x, y, z, text) {
    const group = new THREE.Group();
    
    // NPC Body (Pink Capsule)
    const bodyGeo = new THREE.CapsuleGeometry(0.4, 0.6, 4, 8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xff69b4, flatShading: true });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.7;
    group.add(body);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.08, 4, 4);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.15, 1.0, 0.35);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.15, 1.0, 0.35);
    group.add(eyeL, eyeR);

    // Speech Bubble (reusing sign logic but floating)
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(0, 0, 256, 128, 20);
    ctx.fill();
    
    // Little pointer triangle
    ctx.beginPath();
    ctx.moveTo(128, 128);
    ctx.lineTo(108, 148);
    ctx.lineTo(148, 128);
    ctx.fill();

    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    const lines = text.split('\n');
    lines.forEach((line, i) => {
      ctx.fillText(line, 128, 50 + i * 25);
    });

    const tex = new THREE.CanvasTexture(canvas);
    const bubblePlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 0.8),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true })
    );
    bubblePlane.position.set(0, 2.2, 0);
    group.add(bubblePlane);

    group.position.set(x, y, z);
    this.scene.add(group);
    
    // Face player path (-Z direction)
    group.rotation.y = Math.PI / 4; 
    
    return group;
  }

  _addButton(x, y, z) {
    const group = new THREE.Group();
    
    // Base
    const baseGeo = new THREE.CylinderGeometry(0.6, 0.7, 0.2, 16);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.1;
    group.add(base);

    // Button push part
    const btnGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 16);
    const btnMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const btn = new THREE.Mesh(btnGeo, btnMat);
    btn.position.y = 0.25;
    group.add(btn);

    // Sign next to it
    const signGroup = this._addSign(0.8, 0, 0, 'DO NOT PRESS', 0);
    group.add(signGroup);

    group.position.set(x, y, z);
    this.scene.add(group);
    return { group, btn };
  }

  _addTeacupHouse(x, y, z) {
    const group = new THREE.Group();
    
    // Teacup Body (cylinder that gets wider at top)
    const cupGeo = new THREE.CylinderGeometry(2, 1.5, 2.5, 16);
    const cupMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const cup = new THREE.Mesh(cupGeo, cupMat);
    cup.position.y = 1.25;
    cup.castShadow = true;
    group.add(cup);

    // Handle
    const handleGeo = new THREE.TorusGeometry(0.8, 0.2, 8, 16);
    const handle = new THREE.Mesh(handleGeo, cupMat);
    handle.position.set(1.6, 1.5, 0);
    handle.rotation.z = Math.PI / 2;
    handle.castShadow = true;
    group.add(handle);

    // Roof (Saucer upside down / Cone)
    const roofGeo = new THREE.ConeGeometry(2.5, 1.5, 16);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.9 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 3.25;
    roof.castShadow = true;
    group.add(roof);

    // Door
    const doorGeo = new THREE.BoxGeometry(0.8, 1.2, 0.1);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 0.6, 1.6);
    group.add(door);

    group.position.set(x, y, z);
    this.scene.add(group);
    this.objects.push(group);
    
    // Create physics collider
    const collider = physics.addCollider(cup, 'solid', 'teacup_house');
    cup.userData.collider = collider;

    return group;
  }

  _addHouseKey(x, y, z) {
    const group = new THREE.Group();
    
    // Key head
    const headGeo = new THREE.TorusGeometry(1.5, 0.5, 16, 32);
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 });
    const head = new THREE.Mesh(headGeo, goldMat);
    head.position.set(-2.5, 0, 0);
    group.add(head);
    
    // Key shaft
    const shaftGeo = new THREE.CylinderGeometry(0.5, 0.5, 6, 16);
    const shaft = new THREE.Mesh(shaftGeo, goldMat);
    shaft.rotation.z = Math.PI / 2;
    shaft.position.set(1.0, 0, 0);
    group.add(shaft);
    
    // Key teeth
    const toothGeo = new THREE.BoxGeometry(1.0, 2.0, 0.5);
    const tooth1 = new THREE.Mesh(toothGeo, goldMat);
    tooth1.position.set(2.5, -1.0, 0);
    const tooth2 = new THREE.Mesh(toothGeo, goldMat);
    tooth2.position.set(3.5, -1.0, 0);
    group.add(tooth1, tooth2);
    
    group.position.set(x, y, z);
    this.scene.add(group);
    this.objects.push(group);
    
    // Add point light to make it glow brightly
    const light = new THREE.PointLight(0xffd700, 3, 20);
    light.position.set(0, 0, 0);
    group.add(light);
    
    return group;
  }

  _addLadder(x, y, z) {
    const group = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, flatShading: true });
    
    // Rails
    const railGeo = new THREE.BoxGeometry(0.1, 4, 0.1);
    const railL = new THREE.Mesh(railGeo, woodMat);
    railL.position.set(-0.4, 2, 0);
    const railR = new THREE.Mesh(railGeo, woodMat);
    railR.position.set(0.4, 2, 0);
    group.add(railL, railR);
    
    // Rungs
    const rungGeo = new THREE.BoxGeometry(0.8, 0.1, 0.1);
    for (let i = 0; i < 7; i++) {
      const rung = new THREE.Mesh(rungGeo, woodMat);
      rung.position.set(0, 0.5 + i * 0.5, 0);
      group.add(rung);
    }
    
    group.position.set(x, y, z);
    
    // Lean it against the hill slightly
    group.rotation.x = -0.1; 
    
    this.scene.add(group);
    return group;
  }

  _addFallingTree(x, y, z) {
    const group = new THREE.Group();
    
    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.25, 0.35, 3, 5);
    const trunk = new THREE.Mesh(trunkGeo, this.treeTrunkMat);
    trunk.position.y = 1.5;
    trunk.castShadow = true;
    group.add(trunk);

    // Leaves
    const puffGeo = new THREE.IcosahedronGeometry(1.5, 0);
    const puff = new THREE.Mesh(puffGeo, this.pineLeavesMat);
    puff.position.y = 3.5;
    puff.castShadow = true;
    group.add(puff);

    group.position.set(x, y, z);
    this.scene.add(group);
    return group;
  }

  _addGunPickup(x, y, z) {
    const group = new THREE.Group();
    
    // Gun body (dark grey block)
    const bodyGeo = new THREE.BoxGeometry(0.8, 0.3, 0.2);
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.2 });
    const body = new THREE.Mesh(bodyGeo, gunMat);
    group.add(body);
    
    // Gun barrel (cylinder)
    const barrelGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.6, 8);
    const barrel = new THREE.Mesh(barrelGeo, gunMat);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(0.7, 0.05, 0);
    group.add(barrel);
    
    // Gun handle
    const handleGeo = new THREE.BoxGeometry(0.25, 0.5, 0.2);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 }); // wooden grip
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(-0.2, -0.3, 0);
    handle.rotation.z = -0.2;
    group.add(handle);

    // Glowing aura
    const light = new THREE.PointLight(0xff4444, 2, 10);
    group.add(light);
    
    group.position.set(x, y, z);
    
    // Rotate slightly so it's visible
    group.rotation.x = Math.PI / 4;

    this.scene.add(group);
    this.objects.push(group);
    
    // Add simple physics collider
    const collider = physics.addCollider(body, 'solid', 'gun_pickup');
    body.userData.collider = collider;

    return group;
  }

  _addHammer(x, y, z) {
    const group = new THREE.Group();
    
    const headMat = new THREE.MeshStandardMaterial({ color: 0x9aa5af, metalness: 1.0, roughness: 0.2 });

    // Pivot Ring (where it hangs from)
    const ringGeo = new THREE.TorusGeometry(0.25, 0.08, 8, 16);
    const ring = new THREE.Mesh(ringGeo, headMat);
    ring.position.y = 0;
    ring.rotation.y = Math.PI / 2;
    group.add(ring);

    // Top Cap (connects handle to ring)
    const capGeo = new THREE.CylinderGeometry(0.2, 0.15, 0.5, 12);
    const cap = new THREE.Mesh(capGeo, headMat);
    cap.position.y = -0.25;
    group.add(cap);

    // Wooden Handle
    const handleGeo = new THREE.CylinderGeometry(0.15, 0.2, 6, 12);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x4a2e15, roughness: 0.95 }); // Dark rich wood
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.y = -3; // Hangs down from pivot
    handle.castShadow = true;
    group.add(handle);

    // Leather Grip (middle of handle)
    const gripGeo = new THREE.CylinderGeometry(0.19, 0.19, 2.5, 12);
    const gripMat = new THREE.MeshStandardMaterial({ color: 0x6b3010, roughness: 0.8 }); // Reddish leather
    const grip = new THREE.Mesh(gripGeo, gripMat);
    grip.position.y = -3.0;
    group.add(grip);
    
    // Metal Head Center Block (at the BOTTOM)
    const centerGeo = new THREE.BoxGeometry(0.8, 1.5, 0.6);
    const centerHead = new THREE.Mesh(centerGeo, headMat);
    centerHead.position.y = -5.5; 
    centerHead.castShadow = true;
    group.add(centerHead);

    // Spike (pointing DOWN towards the player)
    const spikeGeo = new THREE.ConeGeometry(0.2, 1.0, 8);
    const spike = new THREE.Mesh(spikeGeo, headMat);
    spike.position.y = -6.5; 
    spike.rotation.x = Math.PI; // point down
    spike.castShadow = true;
    group.add(spike);

    // Axe Blades using ExtrudeGeometry
    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(0, 0.7);               
    bladeShape.lineTo(1.3, 1.4);             
    bladeShape.quadraticCurveTo(2.0, 0, 1.3, -1.4); 
    bladeShape.lineTo(0, -0.7);              
    bladeShape.lineTo(0, 0.7);               

    const extrudeSettings = { depth: 0.12, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.08, bevelThickness: 0.08 };
    const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, extrudeSettings);
    bladeGeo.translate(0, 0, -0.06); // Center on Z

    const rightBlade = new THREE.Mesh(bladeGeo, headMat);
    rightBlade.position.set(0.4, -5.5, 0); // Attach to right side of center block
    rightBlade.castShadow = true;
    group.add(rightBlade);

    const leftBlade = new THREE.Mesh(bladeGeo, headMat);
    leftBlade.position.set(-0.4, -5.5, 0); // Attach to left side
    leftBlade.rotation.y = Math.PI; // Flip for the left side
    leftBlade.castShadow = true;
    group.add(leftBlade);
    
    // Better Particle Fire!
    const createFireGroup = (xOffset) => {
      const g = new THREE.Group();
      g.position.set(xOffset, -5.5, 0);
      const parts = [];
      const fMat = new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });
      // Inner yellow core
      const coreMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });
      
      const fGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      for(let i=0; i<8; i++) {
        const p = new THREE.Mesh(fGeo, i % 2 === 0 ? fMat : coreMat);
        p.position.set((Math.random()-0.5)*0.6, (Math.random()-0.5)*0.6, (Math.random()-0.5)*0.3);
        p.userData = { 
          speedY: 1.5 + Math.random() * 2,
          speedRot: (Math.random() - 0.5) * 10
        };
        g.add(p);
        parts.push(p);
      }
      return { group: g, parts };
    };
    
    const fire1 = createFireGroup(1.4);
    group.add(fire1.group);

    const fire2 = createFireGroup(-1.4);
    group.add(fire2.group);
    
    const axeLight = new THREE.PointLight(0xff4500, 2, 15);
    axeLight.position.set(0, -5.5, 0);
    group.add(axeLight);

    if (!this.axeFires) this.axeFires = [];
    this.axeFires.push({ fire1, fire2, light: axeLight });

    group.position.set(x, y, z);
    this.scene.add(group);
    
    return group;
  }

  _addGrassPatch(x, y, z) {
    const group = new THREE.Group();
    const grassMat = new THREE.MeshStandardMaterial({ color: 0x228b22, roughness: 0.9, flatShading: true });
    
    // Add custom shader for wind animation
    grassMat.onBeforeCompile = (shader) => {
      shader.uniforms.time = { value: 0 };
      grassMat.userData.shader = shader;
      shader.vertexShader = `
        uniform float time;
        ${shader.vertexShader}
      `.replace(
        `#include <begin_vertex>`,
        `
        #include <begin_vertex>
        // Simple wind effect: bend based on height (position.y)
        float wind = sin(time * 2.0 + position.x * 0.5 + position.z * 0.5) * 0.1;
        transformed.x += wind * position.y;
        transformed.z += wind * position.y;
        `
      );
    };
    this.animatedMaterials.push(grassMat);
    
    // Create 3 to 5 blades of grass
    const numBlades = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numBlades; i++) {
      // Blade geometry: very thin at top, wider at bottom
      const height = 0.4 + Math.random() * 0.4;
      const bladeGeo = new THREE.ConeGeometry(0.05, height, 4);
      // Shift geometry so origin is at bottom
      bladeGeo.translate(0, height / 2, 0);
      
      const blade = new THREE.Mesh(bladeGeo, grassMat);
      
      // Random position spread
      blade.position.x = (Math.random() - 0.5) * 0.5;
      blade.position.z = (Math.random() - 0.5) * 0.5;
      
      // Random rotation
      blade.rotation.y = Math.random() * Math.PI * 2;
      blade.rotation.x = (Math.random() - 0.5) * 0.3; // Slight bend
      blade.rotation.z = (Math.random() - 0.5) * 0.3;
      
      blade.castShadow = true;
      group.add(blade);
    }
    
    group.position.set(x, y, z);
    this.scene.add(group);
    return group;
  }

  update(dt) {
    const time = performance.now() * 0.001;
    for (const mat of this.animatedMaterials) {
      if (mat.userData.shader) {
        mat.userData.shader.uniforms.time.value = time;
      }
    }
    
    // Animate axe fires (particle effect)
    if (this.axeFires) {
      for (const axe of this.axeFires) {
        // Animate particles for fire1
        for (let p of axe.fire1.parts) {
          p.position.y += dt * p.userData.speedY;
          p.rotation.x += dt * p.userData.speedRot;
          p.rotation.y += dt * p.userData.speedRot;
          const s = Math.max(0.01, 1.0 - (p.position.y * 0.6));
          p.scale.setScalar(s);
          if (p.position.y > 1.5) {
            p.position.y = (Math.random() - 0.5) * 0.6;
            p.scale.setScalar(1);
          }
        }
        // Animate particles for fire2
        for (let p of axe.fire2.parts) {
          p.position.y += dt * p.userData.speedY;
          p.rotation.x += dt * p.userData.speedRot;
          p.rotation.y += dt * p.userData.speedRot;
          const s = Math.max(0.01, 1.0 - (p.position.y * 0.6));
          p.scale.setScalar(s);
          if (p.position.y > 1.5) {
            p.position.y = (Math.random() - 0.5) * 0.6;
            p.scale.setScalar(1);
          }
        }
        
        axe.light.intensity = 2.0 + Math.random() * 1.5;
      }
    }
  }
}
