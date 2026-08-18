export class HUD {
  constructor() {
    this.element = document.getElementById('hud');
    this.objectiveEl = document.getElementById('hud-objective');
    this.checkpointEl = document.getElementById('hud-checkpoint');
    this.areaEl = document.getElementById('hud-area');
    this.checkpointTimer = 0;
    this.crosshairEl = document.getElementById('crosshair');
  }

  showCrosshair() {
    if (this.crosshairEl) this.crosshairEl.style.display = 'block';
  }

  hideCrosshair() {
    if (this.crosshairEl) this.crosshairEl.style.display = 'none';
  }

  show() {
    this.element.style.display = 'block';
  }

  hide() {
    this.element.style.display = 'none';
  }

  showCheckpointMessage() {
    this.checkpointEl.style.display = 'block';
    // CSS animation handles fade; reset by re-triggering
    this.checkpointEl.style.animation = 'none';
    // Force reflow
    void this.checkpointEl.offsetHeight;
    this.checkpointEl.style.animation = 'fadeInOut 2.5s ease forwards';
  }

  showAreaTitle(title) {
    this.areaEl.textContent = title;
    this.areaEl.style.display = 'block';
    this.areaEl.style.animation = 'none';
    void this.areaEl.offsetHeight;
    this.areaEl.style.animation = 'areaFadeIn 3s ease forwards';

    setTimeout(() => {
      this.areaEl.style.display = 'none';
    }, 3000);
  }

  setObjective(text) {
    this.objectiveEl.innerHTML = `<span class="obj-icon">🌳</span> ${text}`;
  }

  addItemToInventory(icon, name) {
    const slots = document.getElementById('inventory-slots');
    if (!slots) return;

    const el = document.createElement('div');
    el.className = 'inv-item';
    el.innerHTML = `
      <span class="inv-item-icon">${icon}</span>
      <span class="inv-item-name">${name}</span>
    `;
    slots.appendChild(el);
  }

  clearInventory() {
    const slots = document.getElementById('inventory-slots');
    if (slots) slots.innerHTML = '';
  }
}
