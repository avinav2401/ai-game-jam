export class MainMenu {
  constructor() {
    this.element = document.getElementById('main-menu');
    this.howtoElement = document.getElementById('howto-screen');
    this.customizeElement = document.getElementById('customize-screen');
    this.settingsElement = document.getElementById('settings-screen');
    this.onPlay = null;
    this.onColorChange = null;
  }

  init(onPlay) {
    this.onPlay = onPlay;

    document.getElementById('btn-play').addEventListener('click', () => {
      this.hide();
      if (this.onPlay) this.onPlay();
    });

    document.getElementById('btn-howto').addEventListener('click', () => {
      this.element.style.display = 'none';
      this.howtoElement.style.display = 'flex';
    });

    document.getElementById('btn-back').addEventListener('click', () => {
      this.howtoElement.style.display = 'none';
      this.element.style.display = 'flex';
    });

    document.getElementById('btn-customize').addEventListener('click', () => {
      this.element.style.display = 'none';
      this.customizeElement.style.display = 'flex';
    });

    document.getElementById('btn-cust-back').addEventListener('click', () => {
      this.customizeElement.style.display = 'none';
      this.element.style.display = 'flex';
    });

    document.querySelectorAll('.color-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = e.target.getAttribute('data-type');
        const color = parseInt(e.target.getAttribute('data-color'), 16);
        if (this.onColorChange) {
          this.onColorChange(type, color);
        }
      });
    });

    // Settings
    document.getElementById('btn-settings').addEventListener('click', () => {
      this.element.style.display = 'none';
      this.settingsElement.style.display = 'flex';
    });

    document.getElementById('btn-settings-back').addEventListener('click', () => {
      this.settingsElement.style.display = 'none';
      this.element.style.display = 'flex';
    });

    const volSlider = document.getElementById('volume-slider');
    volSlider.addEventListener('input', (e) => {
      import('../systems/AudioManager.js').then(({ audio }) => {
        if (audio.masterGain) {
          audio.masterGain.gain.value = parseFloat(e.target.value);
        }
      });
    });

    // Hack button
    const hackBtn = document.getElementById('btn-hack');
    hackBtn.addEventListener('click', () => {
      hackBtn.textContent = 'NO HACKS FOR YOU. GAME HATES YOU.';
      hackBtn.style.color = 'red';
      hackBtn.style.borderColor = 'red';
      setTimeout(() => {
        hackBtn.textContent = 'HACKS / CHEATS';
        hackBtn.style.color = '#ff00ff';
        hackBtn.style.borderColor = '#ff00ff';
      }, 2000);
    });
  }

  setOnColorChange(callback) {
    this.onColorChange = callback;
  }

  show() {
    this.element.style.display = 'flex';
    this.howtoElement.style.display = 'none';
    this.customizeElement.style.display = 'none';
    this.settingsElement.style.display = 'none';
  }

  hide() {
    this.element.style.display = 'none';
    this.howtoElement.style.display = 'none';
    this.customizeElement.style.display = 'none';
  }
}
