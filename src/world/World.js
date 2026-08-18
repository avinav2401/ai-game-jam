import * as THREE from 'three';
import { Terrain } from './Terrain.js';
import { Environment } from './Environment.js';

// World — master builder that creates the entire game world
export class World {
  constructor(scene) {
    this.scene = scene;
    this.terrain = new Terrain(scene);
    this.environment = new Environment(scene);
    this.house = null;
    this.lights = [];
  }

  clear() {
    this.terrain.clear();
    this.environment.clear();
    for (const light of this.lights) {
      this.scene.remove(light);
    }
    this.lights = [];
    this.house = null;
  }

  build(checkpointMgr, currentLevel) {
    // Lighting
    this._setupLighting();

    // Build terrain and environment based on level
    this.terrain.build(currentLevel);
    this.environment.build(checkpointMgr, currentLevel);
    
    if (currentLevel === 2) {
      // Add the teacup house at the end of Level 2
      this.house = this.environment._addTeacupHouse(0, 5, -270);
    }

    // Fog — lighter, distant atmospheric fog
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.005);
    this.scene.background = new THREE.Color(0x87ceeb); // Bright sky blue
  }

  _setupLighting() {
    // Ambient — brighter
    const amb = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(amb);
    this.lights.push(amb);

    // Sun / directional - bright, warm sunlight
    const sun = new THREE.DirectionalLight(0xfffaee, 1.2);
    sun.position.set(50, 80, 40);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 4096;
    sun.shadow.mapSize.height = 4096;
    sun.shadow.bias = -0.001;
    sun.shadow.camera.left = -120;
    sun.shadow.camera.right = 120;
    sun.shadow.camera.top = 120;
    sun.shadow.camera.bottom = -120;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 300;
    this.scene.add(sun);
    this.lights.push(sun);

    // Hemisphere light for subtle ground/sky fill
    const hemi = new THREE.HemisphereLight(0x87ceeb, 0x4caf50, 0.4);
    this.scene.add(hemi);
    this.lights.push(hemi);
  }

  // Adjust fog slightly per area to change atmosphere slightly
  updateAreaAtmosphere(areaIndex) {
    const fogDensities = [0.005, 0.006, 0.007, 0.009, 0.012];
    const fogColors = [0x87ceeb, 0x7abce6, 0x6eabd1, 0x6099bd, 0x4a7a99]; 

    if (areaIndex >= 0 && areaIndex < fogDensities.length) {
      this.scene.fog.density = fogDensities[areaIndex];
      this.scene.fog.color.setHex(fogColors[areaIndex]);
      this.scene.background.setHex(fogColors[areaIndex]);
    }
  }

  update(dt) {
    if (this.environment.update) {
      this.environment.update(dt);
    }
  }
}
