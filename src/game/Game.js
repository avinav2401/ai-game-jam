import * as THREE from 'three';
import { GameState, STATES } from './GameState.js';
import { events } from './EventManager.js';
import { Player } from '../player/Player.js';
import { World } from '../world/World.js';
import { TrollManager } from '../troll/TrollManager.js';
import { FakeBridgeTroll } from '../troll/FakeBridgeTroll.js';
import { ExplodingHouseTroll } from '../troll/ExplodingHouseTroll.js';
import { MovingDoorTroll } from '../troll/MovingDoorTroll.js';
import { FakeCheckpointTroll } from '../troll/FakeCheckpointTroll.js';
import { RunningCoinTroll } from '../troll/RunningCoinTroll.js';
import { LyingNPCTroll } from '../troll/LyingNPCTroll.js';
import { ButtonTrapTroll } from '../troll/ButtonTrapTroll.js';
import { LadderTroll } from '../troll/LadderTroll.js';
import { FallingTreeTroll } from '../troll/FallingTreeTroll.js';
import { ParkourTroll } from '../troll/ParkourTroll.js';
import { TrollPlatformTroll } from '../troll/TrollPlatformTroll.js';
import { SwingingHammerTroll } from '../troll/SwingingHammerTroll.js';
import { ChasingTreeTroll } from '../troll/ChasingTreeTroll.js';
import { InvisibleWallTroll } from '../troll/InvisibleWallTroll.js';
import { CheckpointManager } from '../systems/CheckpointManager.js';
import { ParticleManager } from '../systems/ParticleManager.js';
import { audio } from '../systems/AudioManager.js';
import { MainMenu } from '../ui/MainMenu.js';
import { DeathScreen } from '../ui/DeathScreen.js';
import { HUD } from '../ui/HUD.js';
import { NextLevelTroll } from '../troll/NextLevelTroll.js';
import { physics } from '../systems/Physics.js';
import { ZombieManager } from '../enemies/ZombieManager.js';

// Area boundaries (Z values, player moves in -Z direction)
const AREA_BOUNDARIES = [
  { z: 0, name: 'The Beginning' },
  { z: -40, name: 'Something Is Wrong' },
  { z: -90, name: 'The World Hates You' },
  { z: -150, name: 'Trust Nothing' },
  { z: -200, name: 'THE TREE' },
];

export class Game {
  constructor() {
    this.state = new GameState();
    this.clock = new THREE.Clock();

    // Renderer
    const container = document.getElementById('game-container');
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    container.appendChild(this.renderer.domElement);

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a1a);

    // Camera
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 300);

    // Systems
    this.checkpointMgr = new CheckpointManager();
    this.particles = new ParticleManager(this.scene);
    this.trollManager = new TrollManager();

    // World
    this.world = new World(this.scene);

    // Player
    this.player = new Player(this.scene, this.camera);

    // UI
    this.menu = new MainMenu();
    this.deathScreen = new DeathScreen();
    this.hud = new HUD();

    // Zombies
    this.zombieManager = new ZombieManager(this.world.scene);
    this.bullets = [];

    // Fade overlay
    this.fadeOverlay = document.getElementById('fade-overlay');

    // Pause UI
    this.pauseScreen = document.getElementById('pause-screen');
    this.victoryScreen = document.getElementById('victory-screen');

    // We don't register trolls or build world yet; done in _loadLevel
    this.currentLevel = 1;

    // Event listeners
    this._setupEvents();

    // Current area tracking
    this.currentArea = -1;

    // Final troll state
    this.finalTrollActive = false;

    // Window resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Initialize menu
    this.menu.init(() => this.startGame());
  }

  _registerTrolls() {
    if (this.currentLevel === 1) {
      if (this.world.environment.trapTree) {
        const ft = new FallingTreeTroll(this.world.environment.trapTree);
        this.trollManager.register(ft);
      }
      
      const availableTrees = this.world.environment.trees.filter(t => 
        Math.abs(t.position.x) < 12 && t.position.z < -40 && t.position.z > -80
      );
      availableTrees.sort(() => Math.random() - 0.5);
      
      for (let i = 0; i < Math.min(2, availableTrees.length); i++) {
        const ct = new ChasingTreeTroll(availableTrees.pop());
        this.trollManager.register(ct);
      }
      
      this.trollManager.register(new NextLevelTroll());
      
    } else if (this.currentLevel === 2) {
      if (this.world.environment.bridgePlanks) {
        this.trollManager.register(new FakeBridgeTroll(this.world.environment.bridgePlanks));
      }
      this.trollManager.register(new InvisibleWallTroll(this.scene));
      if (this.world.environment.door) this.trollManager.register(new MovingDoorTroll(this.world.environment.door));
      this.trollManager.register(new FakeCheckpointTroll(this.checkpointMgr));
      if (this.world.environment.coin) this.trollManager.register(new RunningCoinTroll(this.world.environment.coin));
      if (this.world.environment.npc) this.trollManager.register(new LyingNPCTroll(this.world.environment.npc));
      if (this.world.environment.button) this.trollManager.register(new ButtonTrapTroll(this.world.environment.button));
      if (this.world.house) this.trollManager.register(new ExplodingHouseTroll(this.world.house));
      if (this.world.environment.ladder) this.trollManager.register(new LadderTroll(this.world.environment.ladder));
      if (this.world.environment.fallingTree) this.trollManager.register(new FallingTreeTroll(this.world.environment.fallingTree));

      if (this.world.terrain.parkourPlatforms) {
        let consecutiveFalls = 0;
        this.world.terrain.parkourPlatforms.forEach((pData, index) => {
          // Never make the very first platform a troll platform so the player doesn't instantly die on spawn
          if (index < 2) return; 

          const rand = Math.random();
          // 20% chance to fall, 30% chance to move, 50% chance to be normal
          if (rand > 0.8 && consecutiveFalls < 2) {
            this.trollManager.register(new ParkourTroll(pData.mesh));
            consecutiveFalls++;
          } else if (rand > 0.5) {
            this.trollManager.register(new TrollPlatformTroll(pData.mesh));
            consecutiveFalls = 0;
          } else {
            consecutiveFalls = 0;
          }
        });
      }

      if (this.world.environment.hammers) {
        for (const hammer of this.world.environment.hammers) {
          this.trollManager.register(new SwingingHammerTroll(hammer));
        }
      }
    }
  }

  _setupEvents() {
    // Player death
    events.on('playerDeath', (message) => {
      if (!this.state.is(STATES.PLAYING)) return;
      this.state.set(STATES.DEAD);
      this.state.deaths++;
      document.getElementById('death-count').innerText = this.state.deaths;
      this.player.die();
      audio.playDeath();
      this.player.playerCamera.shake(0.5, 0.4);
      this.deathScreen.show(message);

      // Respawn after delay
      setTimeout(() => {
        this._respawn();
      }, 2000);
    });

    // Checkpoint activated
    events.on('checkpointActivated', (cp) => {
      this.hud.showCheckpointMessage();
      this.particles.createEmitter(cp.position.clone().add(new THREE.Vector3(0, 1, 0)), {
        count: 30,
        color: 0x4ade80,
        speed: 3,
        lifetime: 1,
      });
    });

    // Fake checkpoint
    events.on('fakeCheckpointActivated', (cp) => {
      // Show checkpoint message as if it's real...
      this.hud.showCheckpointMessage();
      audio.playCheckpoint();
    });

    // Fake victory sequence
    events.on('fakeVictory', () => {
      this.victoryScreen.style.display = 'flex';
      document.getElementById('victory-title').textContent = 'YOU WIN!';
      document.getElementById('victory-title').style.color = '#4ade80';
      document.getElementById('victory-sub').textContent = 'Congratulations! You reached the tree!';
    });

    events.on('fakeVictoryReveal', () => {
      document.getElementById('victory-title').textContent = 'Actually...';
      document.getElementById('victory-title').style.color = '#ff4444';
      document.getElementById('victory-sub').textContent = '"You really thought it was that easy?"';
    });

    events.on('fakeVictoryFall', () => {
      this.victoryScreen.style.display = 'none';
      this.player.controller.enable();
      
      // Grant house key upon entering level 2
      this.hud.addItemToInventory('🔑', 'House Key');
    });

    events.on('finalTroll', () => {
      this.finalTrollActive = true;
      // Show final score screen after the player falls
      setTimeout(() => {
        this._showFinalScreen();
      }, 2000);
    });

    // Level Complete
    events.on('levelComplete', () => {
      if (!this.state.is(STATES.PLAYING)) return;
      this.state.set(STATES.PAUSED);
      
      this.fadeOverlay.classList.add('active');
      setTimeout(() => {
        this.currentLevel++;
        this._loadLevel();
        const spawn = this.checkpointMgr.getSpawnPoint();
        this.player.respawnAt(spawn);
        this.state.set(STATES.PLAYING);
        
        setTimeout(() => {
          this.fadeOverlay.classList.remove('active');
        }, 300);
      }, 500);
    });

    // Parkour platform jump shuffle
    events.on('playerJump', () => {
      if (this.currentLevel === 2 && this.state.is(STATES.PLAYING)) {
        // Only shuffle if player is actually near or in the parkour section
        const playerZ = this.player.mesh.position.z;
        if (playerZ < -130 && playerZ > -240) {
          this.world.terrain.shuffleParkourPlatforms();
        }
      }
    });

    // Keyboard events
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
        if (this.state.is(STATES.PLAYING)) {
          this._pause();
        } else if (this.state.is(STATES.PAUSED)) {
          this._unpause();
        }
      }
      if (e.code === 'KeyR' && this.state.is(STATES.PLAYING)) {
        events.emit('playerDeath', 'You gave up.');
      }
    });

    // Mouse events for shooting
    window.addEventListener('mousedown', (e) => {
      if (e.button === 0 && this.state.is(STATES.PLAYING) && this.player.hasGun && document.pointerLockElement) {
        // Spawn physical bullet
        const dir = new THREE.Vector3();
        this.camera.getWorldDirection(dir);
        
        const origin = new THREE.Vector3();
        this.player.gun.getWorldPosition(origin);
        
        const geo = new THREE.SphereGeometry(0.1, 4, 4);
        const mat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(origin);
        this.scene.add(mesh);
        
        this.bullets.push({ mesh, dir, age: 0 });
        
        // Audio
        audio.playJump(); // use jump sound for shoot for now
      }
    });

    // Pause buttons
    document.getElementById('btn-resume').addEventListener('click', () => this._unpause());
    document.getElementById('btn-quit').addEventListener('click', () => this._quitToMenu());
    document.getElementById('btn-restart').addEventListener('click', () => {
      this.victoryScreen.style.display = 'none';
      this._fullReset();
      this.startGame();
    });
  }

  _loadLevel() {
    physics.clear();
    this.world.clear();
    this.trollManager.clear();
    this.checkpointMgr.clear();
    
    // Clear bullets
    for (const b of this.bullets) {
      this.scene.remove(b.mesh);
    }
    this.bullets = [];

    this.world.build(this.checkpointMgr, this.currentLevel);
    this._registerTrolls();
    this.zombieManager.spawnZombies(this.currentLevel);
  }

  startGame() {
    audio.init();
    audio.resume();

    this.state.set(STATES.PLAYING);
    this.hud.show();
    this.menu.hide();
    this.deathScreen.hide();

    this.currentLevel = 1;
    this._loadLevel();

    // Place player at first checkpoint
    const spawn = this.checkpointMgr.getSpawnPoint();
    this.player.respawnAt(spawn);

    this.currentArea = -1;
  }

  _respawn() {
    this.deathScreen.hide();

    // Fade to black
    this.fadeOverlay.classList.add('active');

    setTimeout(() => {
      this.trollManager.resetAll(); // Fix death loop by fully resetting trolls
      const spawn = this.checkpointMgr.getSpawnPoint();
      this.player.respawnAt(spawn);
      this.state.set(STATES.PLAYING);

      // Fade back in
      setTimeout(() => {
        this.fadeOverlay.classList.remove('active');
      }, 300);
    }, 500);
  }

  _pause() {
    this.state.set(STATES.PAUSED);
    this.pauseScreen.style.display = 'flex';
    this.player.controller.disable();
    // Exit pointer lock
    document.exitPointerLock();
  }

  _unpause() {
    this.state.set(STATES.PLAYING);
    this.pauseScreen.style.display = 'none';
    this.player.controller.enable();
  }

  _quitToMenu() {
    this.pauseScreen.style.display = 'none';
    this._fullReset();
    this.menu.show();
    this.hud.hide();
  }

  _fullReset() {
    this.state.reset();
    this.deathScreen.reset();
    this.deathScreen.hide();
    this.checkpointMgr.reset();
    this.trollManager.resetAll();
    this.particles.clear();
    this.hud.clearInventory();
    this.hud.hideCrosshair();
    this.finalTrollActive = false;
    this.currentArea = -1;
  }

  _showFinalScreen() {
    this.state.set(STATES.VICTORY);
    this.player.controller.disable();
    this.hud.hide();

    const screen = this.victoryScreen;
    screen.style.display = 'flex';

    document.getElementById('victory-title').textContent = 'HOUSE: 1';
    document.getElementById('victory-title').style.color = '#ff4444';
    document.getElementById('victory-sub').textContent = `YOU: 0`;

    const scoreDiv = document.getElementById('victory-score');
    scoreDiv.style.display = 'block';
    scoreDiv.textContent = `Deaths: ${this.state.deaths}`;

    document.getElementById('btn-restart').style.display = 'block';
  }

  _checkArea() {
    const z = this.player.getPosition().z;
    let area = 0;
    for (let i = AREA_BOUNDARIES.length - 1; i >= 0; i--) {
      if (z <= AREA_BOUNDARIES[i].z) {
        area = i;
      }
    }

    if (area !== this.currentArea) {
      this.currentArea = area;
      this.hud.showAreaTitle(AREA_BOUNDARIES[area].name);
      this.world.updateAreaAtmosphere(area);

      // Play ambient drone based on area
      audio.playAmbientDrone(area);
    }
  }

  update() {
    const dt = this.clock.getDelta();
    // Clamp dt to avoid physics issues on alt-tab etc
    const clampedDt = Math.min(dt, 0.05);

    if (this.state.is(STATES.PLAYING)) {
      // Player
      this.player.update(clampedDt);

      // Checkpoints
      this.checkpointMgr.tryActivate(this.player.getPosition());

      // Trolls
      this.trollManager.update(clampedDt, this);

      // Area detection
      this._checkArea();

      // Gun pickup
      if (this.world.environment.gunPickup && this.world.environment.gunPickup.visible) {
        const gunPos = this.world.environment.gunPickup.position;
        if (this.player.getPosition().distanceTo(gunPos) < 2) {
          this.world.environment.gunPickup.visible = false;
          this.player.equipGun();
          this.hud.showCrosshair();
        } else {
          // Spin the gun pickup
          this.world.environment.gunPickup.rotation.y += clampedDt * 2;
        }
      }

      // Zombies
      this.zombieManager.update(clampedDt, this.player);
      
      // Bullets
      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const b = this.bullets[i];
        b.age += clampedDt;
        if (b.age > 2) {
          this.scene.remove(b.mesh);
          this.bullets.splice(i, 1);
          continue;
        }
        b.mesh.position.addScaledVector(b.dir, 50 * clampedDt);
        
        const hit = this.zombieManager.checkBulletHit(b.mesh.position, 0.5);
        if (hit) {
           this.scene.remove(b.mesh);
           this.bullets.splice(i, 1);
           audio.playCoin(); // hit sound
        }
      }
    }

    // World always updates (tree animation etc)
    this.world.update(clampedDt);

    // Particles
    this.particles.update(clampedDt);

    // Render
    this.renderer.render(this.scene, this.camera);
  }

  run() {
    const loop = () => {
      requestAnimationFrame(loop);
      this.update();
    };
    loop();
  }
}
