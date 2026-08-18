// BaseTroll — lifecycle: trigger → foreshadow → activate → effect → reset
export class BaseTroll {
  constructor(id, options = {}) {
    this.id = id;
    this.triggered = false;
    this.activated = false;
    this.completed = false;
    this.enabled = true;
    this.oneShot = options.oneShot || false; // Only triggers once

    // Override these in subclasses
    this.triggerDistance = options.triggerDistance || 5;
    this.triggerPosition = options.triggerPosition || null; // THREE.Vector3
  }

  // Check if the troll should trigger based on player position
  shouldTrigger(playerPos) {
    if (!this.enabled || this.completed) return false;
    if (this.triggered) return false;
    if (!this.triggerPosition) return false;

    const dist = playerPos.distanceTo(this.triggerPosition);
    return dist < this.triggerDistance;
  }

  // Called when trigger condition is met
  trigger(game) {
    this.triggered = true;
    this.onTrigger(game);
  }

  // Called each frame while the troll is triggered but not yet complete
  update(dt, game) {
    if (!this.triggered || this.completed) return;
    this.onUpdate(dt, game);
  }

  // Reset the troll
  reset() {
    this.triggered = false;
    this.activated = false;
    if (!this.oneShot) {
      this.completed = false;
    }
    this.onReset();
  }

  // Override these in subclasses
  onTrigger(game) {}
  onUpdate(dt, game) {}
  onReset() {}
  onComplete() {}
}
