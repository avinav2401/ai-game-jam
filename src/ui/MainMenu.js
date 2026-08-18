export class MainMenu {
  constructor() {
    this.element = document.getElementById('main-menu');
    this.howtoElement = document.getElementById('howto-screen');
    this.customizeElement = document.getElementById('customize-screen');
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
  }

  setOnColorChange(callback) {
    this.onColorChange = callback;
  }

  show() {
    this.element.style.display = 'flex';
    this.howtoElement.style.display = 'none';
    this.customizeElement.style.display = 'none';
  }

  hide() {
    this.element.style.display = 'none';
    this.howtoElement.style.display = 'none';
    this.customizeElement.style.display = 'none';
  }
}
