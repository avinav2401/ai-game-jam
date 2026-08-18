import * as THREE from 'three';
import { BaseTroll } from './BaseTroll.js';
import { events } from '../game/EventManager.js';

export class FakeCheckpointTroll extends BaseTroll {
  constructor(checkpointMgr) {
    super('fake_checkpoint', {
      triggerDistance: 3,
      triggerPosition: new THREE.Vector3(-1.5, 1, -115),
      oneShot: true, // Only triggers once to trick them
    });
    this.checkpointMgr = checkpointMgr;
  }

  onTrigger(game) {
    // When they hit the fake checkpoint, we emit the event so it looks real
    events.emit('fakeCheckpointActivated');

    // But we ACTUALLY set their respawn to a worse spot (e.g. facing a wall or near the edge)
    // Tunnel entrance is around -80. Let's spawn them inside the wall if possible, or just back at the start of the tunnel.
    const badSpawn = new THREE.Vector3(0, 2, -84);
    
    // Save this as a hidden checkpoint
    this.checkpointMgr.addCheckpoint('bad_spawn', badSpawn, null);
    this.checkpointMgr.activeId = 'bad_spawn';

    this.completed = true;
  }
}
