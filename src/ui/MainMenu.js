export class MainMenu {
  constructor() {
    this.element = document.getElementById('main-menu');
    this.howtoElement = document.getElementById('howto-screen');
    this.onPlay = null;
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
  }

  show() {
    this.element.style.display = 'flex';
    this.howtoElement.style.display = 'none';
  }

  hide() {
    this.element.style.display = 'none';
    this.howtoElement.style.display = 'none';
  }
}
