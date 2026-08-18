// GameState — state machine for game flow
export const STATES = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  DEAD: 'DEAD',
  RESPAWNING: 'RESPAWNING',
  VICTORY: 'VICTORY',
};

export class GameState {
  constructor() {
    this.current = STATES.MENU;
    this.deaths = 0;
    this.currentArea = 0;
    this.currentCheckpoint = 0;
    this.playTime = 0;
  }

  is(state) {
    return this.current === state;
  }

  set(state) {
    this.current = state;
  }

  get isPlaying() {
    return this.current === STATES.PLAYING;
  }

  reset() {
    this.current = STATES.MENU;
    this.deaths = 0;
    this.currentArea = 0;
    this.currentCheckpoint = 0;
    this.playTime = 0;
  }
}
