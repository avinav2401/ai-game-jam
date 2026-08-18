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
  }

  build(checkpointMgr, currentLevel = 1) {
    // Materials
    this.treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3e2b, roughness: 0.9, flatShading: false });
    this.treeLeavesMat = new THREE.MeshStandardMaterial({ color: 0x2d5a27, roughness: 0.8, flatShading: false });
    this.rockMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.8, flatShading: false });
    this.bushMat = new THREE.MeshStandardMaterial({ color: 0x3d7a37, roughness: 0.9, flatShading: false });

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
      this.trapTree = this._addFallingTree(-12, 0, -55);
      this.safeTree = this._addTree(8, 0, -55);
      
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
    }
  }

  update(dt) {
    this.time += dt;

    // Animate flags waving
    for (const flagGroup of this.flags) {
      const flagMesh = flagGroup.userData.flagMesh;
      const baseVertices = flagGroup.userData.baseVertices;
      const positions = flagMesh.geometry.attributes.position;

      for (let i = 0; i < baseVertices.length; i++) {
        const v = baseVertices[i];
        // Only move the X>0 part of the flag (the right side)
        const amountX = (v.x + 0.75) / 1.5; // normalized 0 to 1 across width
        
        // Z wave
        const wave = Math.sin(amountX * 5 - this.time * 6) * 0.3 * amountX;
        
        positions.setZ(i, v.z + wave);
      }
      positions.needsUpdate = true;
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
    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 1.0, 5);
    const trunk = new THREE.Mesh(trunkGeo, this.treeTrunkMat);
    trunk.position.y = 0.5;
    trunk.castShadow = true;
    group.add(trunk);

    // Pine needles (layered cones)
    // Bottom layer
    const cone1 = new THREE.Mesh(new THREE.ConeGeometry(1.5, 2.0, 5), this.treeLeavesMat);
    cone1.position.y = 1.5;
    cone1.castShadow = true;
    group.add(cone1);

    // Middle layer
    const cone2 = new THREE.Mesh(new THREE.ConeGeometry(1.2, 1.8, 5), this.treeLeavesMat);
    cone2.position.y = 2.5;
    cone2.castShadow = true;
    group.add(cone2);

    // Top layer
    const cone3 = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.5, 5), this.treeLeavesMat);
    cone3.position.y = 3.5;
    cone3.castShadow = true;
    group.add(cone3);

    group.position.set(x, y, z);
    this.scene.add(group);
    this.objects.push(group);
    this.trees.push(group);
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

    // Flagpole
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 3, 8),
      new THREE.MeshStandardMaterial({
        color: 0xaaaaaa,
        roughness: 0.3,
        metalness: 0.8
      })
    );
    pole.position.y = 1.5;
    pole.castShadow = true;
    group.add(pole);

    // Flag Cloth
    // Use a PlaneGeometry with more segments so we can animate the vertices
    const flagGeo = new THREE.PlaneGeometry(1.5, 1, 10, 5);
    const flagMat = new THREE.MeshStandardMaterial({
      color: 0xff3333,
      roughness: 0.8,
      side: THREE.DoubleSide
    });
    const flag = new THREE.Mesh(flagGeo, flagMat);
    // Position it so the left edge is near the pole
    flag.position.set(0.85, 2.5, 0); 
    flag.castShadow = true;
    group.add(flag);

    // Glow light (off by default, CheckpointManager sets intensity)
    const light = new THREE.PointLight(0x4ade80, 0.5, 5);
    light.position.y = 2.5;
    group.add(light);

    // Store reference to flag mesh for animation
    group.userData.flagMesh = flag;
    group.userData.baseVertices = [];
    const posAttribute = flagGeo.attributes.position;
    for (let i = 0; i < posAttribute.count; i++) {
      group.userData.baseVertices.push(new THREE.Vector3().fromBufferAttribute(posAttribute, i));
    }

    group.position.set(x, y + 1, z); // Place on top of ground surface (y+1)
    this.scene.add(group);
    
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
    const puff = new THREE.Mesh(puffGeo, this.treeLeavesMat);
    puff.position.y = 3.5;
    puff.castShadow = true;
    group.add(puff);

    group.position.set(x, y, z);
    this.scene.add(group);
    return group;
  }

  _addHammer(x, y, z) {
    const group = new THREE.Group();
    
    // Wooden Handle
    const handleGeo = new THREE.CylinderGeometry(0.15, 0.2, 6, 12);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 }); // Dark wood
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.y = -3; // Hangs down from pivot
    handle.castShadow = true;
    group.add(handle);

    // Rubber Grip at the top (near the pivot)
    const gripGeo = new THREE.CylinderGeometry(0.18, 0.18, 1.5, 12);
    const gripMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
    const grip = new THREE.Mesh(gripGeo, gripMat);
    grip.position.y = -0.75;
    group.add(grip);
    
    // Metal Head Center
    const headMat = new THREE.MeshStandardMaterial({ color: 0x9aa5af, metalness: 0.7, roughness: 0.4 });
    const centerGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const centerHead = new THREE.Mesh(centerGeo, headMat);
    centerHead.position.y = -5.7; // At the bottom of the handle
    centerHead.castShadow = true;
    group.add(centerHead);

    // Hammer Striking Faces (beveled ends)
    const faceGeo = new THREE.CylinderGeometry(0.5, 0.6, 0.8, 8);
    const face1 = new THREE.Mesh(faceGeo, headMat);
    face1.rotation.z = Math.PI / 2;
    face1.position.set(-0.9, -5.7, 0);
    face1.castShadow = true;
    group.add(face1);

    const face2 = new THREE.Mesh(faceGeo, headMat);
    face2.rotation.z = -Math.PI / 2;
    face2.position.set(0.9, -5.7, 0);
    face2.castShadow = true;
    group.add(face2);
    
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
  }
}
