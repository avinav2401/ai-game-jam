// TrollManager — registry and lifecycle manager for all troll mechanics
export class TrollManager {
  constructor() {
    this.trolls = [];
  }

  register(troll) {
    this.trolls.push(troll);
  }

  update(dt, game) {
    const playerPos = game.player.getPosition();

    for (const troll of this.trolls) {
      // Check trigger
      if (troll.shouldTrigger(playerPos)) {
        troll.trigger(game);
      }

      // Update active trolls
      troll.update(dt, game);
    }
  }

  resetAll() {
    for (const troll of this.trolls) {
      troll.reset();
    }
  }

  // Reset only trolls that are NOT one-shot completed
  softReset() {
    for (const troll of this.trolls) {
      if (!troll.oneShot || !troll.completed) {
        troll.reset();
      }
    }
  }

  clear() {
    this.trolls = [];
  }
}
