import * as THREE from 'three';
import { PlayerController } from './PlayerController.js';
import { PlayerCamera } from './PlayerCamera.js';
import { physics } from '../systems/Physics.js';
import { audio } from '../systems/AudioManager.js';
import { events } from '../game/EventManager.js';

export class Player {
  constructor(scene, camera) {
    this.scene = scene;

    this.mesh = new THREE.Group();
    this.visuals = new THREE.Group();
    scene.add(this.visuals);
    
    // Create a container for the imported rigged character
    this.characterGroup = new THREE.Group();
    // Typical Blender export fixes
    this.characterGroup.rotation.x = Math.PI / 2;
    this.characterGroup.scale.set(0.01, 0.01, 0.01);
    this.characterGroup.position.y = -0.75;
    this.visuals.add(this.characterGroup);

    this.mesh.position.set(0, 2, 0);
    scene.add(this.mesh);

    // Physics state
    this.velocity = new THREE.Vector3();
    this.grounded = false;
    this.wasGrounded = false;
    this.moveSpeed = 6;
    this.sprintMultiplier = 2.2;
    this.jumpForce = 12;
    this.drag = 8;
    this.playerRadius = 0.35;
    this.playerHeight = 1.5;

    // Footstep timer
    this.footstepTimer = 0;
    this.footstepInterval = 0.35;
    this.walkTime = 0;

    // Controller & Camera
    this.controller = new PlayerController();
    this.playerCamera = new PlayerCamera(camera);

    this.isDead = false;
    this.hasGun = false;

    // Knockback
    this.knockback = new THREE.Vector3();
    
    // Animation
    this.mixer = null;
    this.actions = {};
    this.activeAction = null;
    
    // Customization state
    this.customization = {
      Head: 'Head.001.glb',
      Top: 'Top.002.glb',
      Bottom: 'Bottom.001.glb',
      Shoes: 'Shoes.001.glb',
      Hair: 'Hair.004.glb',
      Eyes: 'Eyes.001.glb',
      Nose: 'Nose.001.glb',
      EyeBrow: 'EyeBrow.001.glb',
      Face: null,
      Glasses: null,
      Hat: null,
      FacialHair: null
    };
    
    this.skinColor = new THREE.Color(0xf5c6a5); // Default from r3f config
    this.loadedParts = {}; // Keeps track of meshes per category
    this.mainSkeleton = null; // Stored to bind new parts later
    this.armatureGroup = null; // Where parts are added

    // Loading flag
    this.isLoaded = false;
  }

  async loadCharacter() {
    // Import GLTFLoader dynamically or globally
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
    const loader = new GLTFLoader();

    try {
      // 1. Character container (equivalent to the outer <group ref={group}> in R3F)
      this.characterGroup = new THREE.Group();
      this.characterGroup.position.y = -this.playerHeight / 2;
      
      // We must add the new character group to visuals!
      this.visuals.clear(); 
      this.visuals.add(this.characterGroup);
      
      const sceneGroup = new THREE.Group();
      sceneGroup.name = 'Scene';
      this.characterGroup.add(sceneGroup);
      
      const armatureGroup = new THREE.Group();
      armatureGroup.name = 'Armature';
      armatureGroup.rotation.x = Math.PI / 2;
      armatureGroup.scale.set(0.01, 0.01, 0.01);
      sceneGroup.add(armatureGroup);
      this.armatureGroup = armatureGroup;

      // 2. Load Armature
      const armatureGltf = await loader.loadAsync('/models/character/Armature.glb');
      const armatureScene = armatureGltf.scene;
      
      let mainSkeleton = null;
      armatureScene.traverse((child) => {
        if (child.isSkinnedMesh) {
          child.frustumCulled = false;
          if (!mainSkeleton) {
            mainSkeleton = child.skeleton;
            this.mainSkeleton = child.skeleton;
          }
        }
      });
      
      const hips = armatureScene.getObjectByName('mixamorigHips');
      if (hips) {
        armatureGroup.add(hips);
      }
      
      // Store bones for procedural animation
      this.bones = {
        leftLeg: armatureScene.getObjectByName('mixamorigLeftUpLeg'),
        rightLeg: armatureScene.getObjectByName('mixamorigRightUpLeg'),
        leftKnee: armatureScene.getObjectByName('mixamorigLeftLeg'),
        rightKnee: armatureScene.getObjectByName('mixamorigRightLeg'),
        leftArm: armatureScene.getObjectByName('mixamorigLeftArm'),
        rightArm: armatureScene.getObjectByName('mixamorigRightArm'),
      };

      // 3. Load Clothing Parts
      for (const [category, filename] of Object.entries(this.customization)) {
        if (filename) {
          await this.loadPart(category, filename, loader);
        }
      }

      // 4. Load Animations
      const posesGltf = await loader.loadAsync('/models/character/Poses.glb');
      this.mixer = new THREE.AnimationMixer(this.characterGroup);
      this.actions = {};
      
      posesGltf.animations.forEach((clip) => {
        this.actions[clip.name] = this.mixer.clipAction(clip);
      });

      // Set default animation to Idle
      if (this.actions['Idle']) {
        this.activeAction = this.actions['Idle'];
        this.activeAction.play();
      }

      this.isLoaded = true;
      this.visuals.add(this.characterGroup);
      
      const box = new THREE.Box3().setFromObject(this.characterGroup);
      console.log('Character loaded. Bounding box:', box.min, box.max);
      events.emit('playerLoaded');
      
    } catch (err) {
      console.error("Failed to load character model:", err);
    }
  }

  async loadPart(category, filename, existingLoader = null) {
    if (!filename) return;
    
    // Import loader if not provided
    let loader = existingLoader;
    if (!loader) {
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
      loader = new GLTFLoader();
    }

    try {
      const partGltf = await loader.loadAsync(`/models/character/${filename}`);
      
      // Store meshes for this category so we can remove them later
      if (!this.loadedParts[category]) {
        this.loadedParts[category] = [];
      }
      
      partGltf.scene.traverse((child) => {
        if (child.isMesh) {
          const newMesh = new THREE.SkinnedMesh(child.geometry, child.material.clone());
          newMesh.castShadow = true;
          newMesh.receiveShadow = true;
          newMesh.frustumCulled = false;
          
          if (newMesh.material) {
            newMesh.material.roughness = 0.8;
            
            // If it's a skin material, apply the current skin color
            if (newMesh.material.name && newMesh.material.name.includes('Skin')) {
              newMesh.material.color.copy(this.skinColor);
            }
          }
          
          if (this.mainSkeleton) {
            newMesh.skeleton = this.mainSkeleton;
          }
          
          this.armatureGroup.add(newMesh);
          this.loadedParts[category].push(newMesh);
        }
      });
    } catch (err) {
      console.error(`Failed to load character part ${filename}:`, err);
    }
  }

  async updatePart(category, filename) {
    // 1. Remove old parts for this category
    if (this.loadedParts[category]) {
      this.loadedParts[category].forEach(mesh => {
        this.armatureGroup.remove(mesh);
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) mesh.material.dispose();
      });
      this.loadedParts[category] = [];
    }

    // 2. Update state
    this.customization[category] = filename;

    // 3. Load new part if one is selected
    if (filename) {
      await this.loadPart(category, filename);
    }
  }

  updateSkinColor(hexColor) {
    this.skinColor.set(hexColor);
    // Update all existing skin materials
    Object.values(this.loadedParts).forEach(meshArray => {
      meshArray.forEach(mesh => {
        if (mesh.material && mesh.material.name && mesh.material.name.includes('Skin')) {
          mesh.material.color.copy(this.skinColor);
        }
      });
    });
  }

  equipGun() {
    this.hasGun = true;
    // Gun logic needs re-implementation with right hand bone later
  }

  applyKnockback(force) {
    this.knockback.copy(force);
    this.velocity.add(force);
    this.isDead = false;
  }

  setColors(skinColorHex, shirtColorHex) {
    // Currently relying on the loaded GLB colors.
    // If needed, we can traverse the characterGroup and change specific materials.
  }

  update(dt) {
    if (this.isDead) return;

    const { dir, sprint, jump } = this.controller.getMovement(this.playerCamera.getYaw());

    // Horizontal movement
    const speed = this.moveSpeed * (sprint ? this.sprintMultiplier : 1);
    const targetVelX = dir.x * speed;
    const targetVelZ = dir.z * speed;

    // Apply acceleration with drag
    this.velocity.x += (targetVelX - this.velocity.x) * Math.min(1, this.drag * dt);
    this.velocity.z += (targetVelZ - this.velocity.z) * Math.min(1, this.drag * dt);

    // Gravity
    this.velocity.y += physics.gravity * dt;

    // Jump
    if (jump && this.grounded) {
      this.velocity.y = this.jumpForce;
      this.grounded = false;
      audio.playJump();
      events.emit('playerJump');
    }

    // Gun recoil animation
    if (this.hasGun && this.gun.position.z < 0.1) {
      this.gun.position.z += 1.0 * dt; // recover recoil
      if (this.gun.position.z > 0.1) this.gun.position.z = 0.1;
    }

    // Move position
    let nextPos = this.mesh.position.clone();
    nextPos.x += this.velocity.x * dt;
    nextPos.z += this.velocity.z * dt;

    // Resolve horizontal collisions
    const currentFeetY = nextPos.y - this.playerHeight / 2;
    const resolved = physics.resolveHorizontalCollision(nextPos.x, currentFeetY, nextPos.z, this.playerRadius);
    nextPos.x = resolved.x;
    nextPos.z = resolved.z;

    // Apply Y velocity after resolving horizontal to avoid false ground checks
    nextPos.y += this.velocity.y * dt;

    const feetY = nextPos.y - this.playerHeight / 2;

    // Ground check — find highest ground under us that isn't a ceiling
    const groundY = physics.getGroundY(nextPos.x, nextPos.z, this.playerRadius, feetY);

    this.wasGrounded = this.grounded;

    if (feetY <= groundY && this.velocity.y <= 0) {
      nextPos.y = groundY + this.playerHeight / 2;
      this.velocity.y = 0;
      this.grounded = true;

      // Landing sound
      if (!this.wasGrounded) {
        audio.playLand();
      }
    } else {
      this.grounded = false;
    }

    // Apply position
    this.mesh.position.copy(nextPos);
    this.visuals.position.copy(nextPos);

    // Rotate mesh to face movement direction
    if (dir.length() > 0.1) {
      const angle = Math.atan2(dir.x, dir.z);
      let diff = angle - this.mesh.rotation.y;
      
      // Normalize the angle difference to shortest path (-PI to PI)
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      
      this.mesh.rotation.y += diff * Math.min(1, 10 * dt);
    }
    this.visuals.rotation.copy(this.mesh.rotation);

    // Animation Mixer Update
    if (this.mixer) {
      this.mixer.update(dt);
    }

    const speedLen = dir.length();
    if (this.grounded && speedLen > 0.1) {
      this.walkTime += dt * (sprint ? 15 : 10);
      
      // Keep playing Idle for the base posture
      if (this.actions['Idle'] && this.activeAction !== this.actions['Idle']) {
        if (this.activeAction) this.activeAction.fadeOut(0.2);
        this.activeAction = this.actions['Idle'];
        this.activeAction.reset().fadeIn(0.2).play();
      }

      // Procedurally animate bones
      if (this.bones) {
        const walkCycle = this.walkTime;
        // Legs swing
        if (this.bones.leftLeg) this.bones.leftLeg.rotation.x += Math.sin(walkCycle) * 0.6;
        if (this.bones.rightLeg) this.bones.rightLeg.rotation.x += Math.sin(walkCycle + Math.PI) * 0.6;
        
        // Knees bend when swinging forward
        if (this.bones.leftKnee) this.bones.leftKnee.rotation.x += Math.max(0, Math.sin(walkCycle) * 0.8);
        if (this.bones.rightKnee) this.bones.rightKnee.rotation.x += Math.max(0, Math.sin(walkCycle + Math.PI) * 0.8);

        // Arms swing opposite to legs
        if (this.bones.leftArm) this.bones.leftArm.rotation.x += Math.sin(walkCycle + Math.PI) * 0.5;
        if (this.bones.rightArm) this.bones.rightArm.rotation.x += Math.sin(walkCycle) * 0.5;
      }

      this.footstepTimer += dt * (sprint ? 1.5 : 1);
      if (this.footstepTimer >= this.footstepInterval) {
        this.footstepTimer = 0;
        audio.playFootstep();
      }

      // Add bobbing effect to visuals
      this.visuals.position.y = this.mesh.position.y + Math.abs(Math.sin(this.walkTime * 1.5)) * 0.15;
    } else {
      // Return to idle
      this.walkTime = 0;
      this.footstepTimer = 0;
      
      // Smoothly return visual to original height
      this.visuals.position.y = THREE.MathUtils.lerp(this.visuals.position.y, this.mesh.position.y, dt * 10);

      if (this.actions['Idle'] && this.activeAction !== this.actions['Idle']) {
        if (this.activeAction) this.activeAction.fadeOut(0.2);
        this.activeAction = this.actions['Idle'];
        this.activeAction.reset().fadeIn(0.2).play();
      }
    }

    // Fall off world → death
    if (this.mesh.position.y < -20) {
      events.emit('playerDeath', 'You fell into the void.');
    }

    // Update camera
    this.playerCamera.update(dt, this.mesh.position, sprint);
  }

  die() {
    this.isDead = true;
    this.controller.disable();
    this.velocity.set(0, 0, 0);
  }

  reset() {
    this.velocity.set(0, 0, 0);
    this.isDead = false;
    this.hasGun = false;
    
    this.mesh.rotation.z = 0;
    this.mesh.rotation.x = 0;
    this.mesh.position.y = 10;
  }

  respawnAt(position) {
    this.mesh.position.copy(position);
    this.velocity.set(0, 0, 0);
    this.knockback.set(0, 0, 0);
    this.grounded = false;
    this.isDead = false;
    this.controller.enable();
  }

  getPosition() {
    return this.mesh.position;
  }

  dispose() {
    this.scene.remove(this.mesh);
  }
}
