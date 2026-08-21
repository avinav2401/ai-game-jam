const PARTS = {"Armature":["Armature.glb"],"Bottom":["Bottom.001.glb","Bottom.002.glb","Bottom.003.glb"],"Bow":["Bow.001.glb","Bow.002.glb"],"Earring":["Earring.001.glb","Earring.002.glb","Earring.003.glb","Earring.004.glb","Earring.005.glb","Earring.006.glb"],"EyeBrow":["EyeBrow.001.glb","EyeBrow.002.glb","EyeBrow.003.glb","EyeBrow.004.glb","EyeBrow.005.glb","EyeBrow.006.glb","EyeBrow.007.glb","EyeBrow.008.glb","EyeBrow.009.glb","EyeBrow.010.glb"],"Eyes":["Eyes.001.glb","Eyes.002.glb","Eyes.003.glb","Eyes.004.glb","Eyes.005.glb","Eyes.006.glb","Eyes.007.glb","Eyes.008.glb","Eyes.009.glb","Eyes.010.glb","Eyes.011.glb","Eyes.012.glb"],"Face":["Face.001.glb","Face.002.glb","Face.003.glb","Face.004.glb","Face.005.glb","Face.006.glb","Face.007.glb"],"FaceMask":["FaceMask.glb"],"FacialHair":["FacialHair.001.glb","FacialHair.002.glb","FacialHair.003.glb","FacialHair.004.glb","FacialHair.005.glb","FacialHair.006.glb","FacialHair.007.glb"],"Glasses":["Glasses.001.glb","Glasses.002.glb","Glasses.003.glb","Glasses.004.glb"],"Hair":["Hair.001.glb","Hair.002.glb","Hair.003.glb","Hair.004.glb","Hair.005.glb","Hair.006.glb","Hair.007.glb","Hair.008.glb","Hair.009.glb","Hair.010.glb","Hair.011.glb"],"Hat":["Hat.001.glb","Hat.002.glb","Hat.003.glb","Hat.004.glb","Hat.005.glb","Hat.006.glb","Hat.007.glb"],"Head":["Head.001.glb","Head.002.glb","Head.003.glb","Head.004.glb"],"NakedFullBody":["NakedFullBody.glb"],"Nose":["Nose.001.glb","Nose.002.glb","Nose.003.glb","Nose.004.glb"],"Outfit":["Outfit.001.glb","Outfit.002.glb","Outfit.003.glb","Outfit.004.glb"],"Poses":["Poses.glb"],"PumpkinHead":["PumpkinHead.glb"],"Shoes":["Shoes.001.glb","Shoes.002.glb","Shoes.003.glb"],"Top":["Top.001.glb","Top.002.glb","Top.003.glb"],"WawaDress":["WawaDress.glb"]};

const SKIN_COLORS = [0xffdfc4, 0xcd9a5b, 0x8d5524, 0x4a3018, 0x2c3e50, 0xc0392b, 0x27ae60];

export class MainMenu {
  constructor() {
    this.element = document.getElementById('main-menu');
    this.howtoElement = document.getElementById('howto-screen');
    this.customizeElement = document.getElementById('customize-screen');
    this.settingsElement = document.getElementById('settings-screen');
    this.onPlay = null;
    this.player = null; // Will be passed in init
    
    this.currentCategory = 'Skin';
  }

  init(onPlay, player) {
    this.onPlay = onPlay;
    this.player = player;

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
      this.renderCustomizer();
    });

    document.getElementById('btn-cust-back').addEventListener('click', () => {
      this.customizeElement.style.display = 'none';
      this.element.style.display = 'flex';
    });

    // Customizer Category Click
    document.querySelectorAll('.cat-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.currentCategory = e.target.getAttribute('data-cat');
        this.renderCustomizer();
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
        hackBtn.textContent = 'HACKS: OFF';
        hackBtn.style.color = '#ff00ff';
        hackBtn.style.borderColor = '#ff00ff';
      }, 2000);
    });
  }

  renderCustomizer() {
    const titleEl = document.getElementById('cust-category-title');
    const gridEl = document.getElementById('cust-items-grid');
    
    titleEl.innerText = this.currentCategory;
    gridEl.innerHTML = ''; // Clear

    if (this.currentCategory === 'Skin') {
      SKIN_COLORS.forEach(color => {
        const btn = document.createElement('button');
        btn.className = 'color-btn';
        btn.style.backgroundColor = '#' + color.toString(16).padStart(6, '0');
        btn.style.width = '60px';
        btn.style.height = '60px';
        btn.style.borderRadius = '5px';
        btn.style.cursor = 'pointer';
        btn.style.border = '2px solid white';
        
        btn.onclick = () => {
          if (this.player) this.player.updateSkinColor(color);
        };
        gridEl.appendChild(btn);
      });
    } else {
      // Normal GLB parts
      const availableParts = PARTS[this.currentCategory] || [];
      
      // Option to remove the part (NONE)
      const noneBtn = document.createElement('button');
      noneBtn.className = 'menu-btn';
      noneBtn.innerText = 'NONE';
      noneBtn.style.width = '100px';
      noneBtn.style.height = '100px';
      noneBtn.onclick = () => {
        if (this.player) this.player.updatePart(this.currentCategory, null);
      };
      gridEl.appendChild(noneBtn);

      availableParts.forEach(partFile => {
        const btn = document.createElement('button');
        btn.className = 'menu-btn';
        btn.innerText = partFile.replace('.glb', '');
        btn.style.width = '100px';
        btn.style.height = '100px';
        btn.style.fontSize = '12px';
        
        btn.onclick = () => {
          if (this.player) {
            btn.innerText = "Loading...";
            this.player.updatePart(this.currentCategory, partFile).then(() => {
              btn.innerText = partFile.replace('.glb', '');
            });
          }
        };
        gridEl.appendChild(btn);
      });
    }
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
