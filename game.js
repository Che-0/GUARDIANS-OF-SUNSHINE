/**
 * GUARDIANS OF SUNSHINE - Motor Completo 8-Bits en HTML5 Canvas
 * Fiel al episodio de Hora de Aventura (BMO)
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const zoneIndicator = document.getElementById('zone-indicator');
const comboStepBadges = document.querySelectorAll('.combo-step');

// ==========================================
// 1. SINTETIZADOR DE SONIDO 8-BITS (Web Audio API)
// ==========================================
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type, duration, slideFreq = null, gainVal = 0.12) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    if (slideFreq) {
      osc.frequency.exponentialRampToValueAtTime(slideFreq, this.ctx.currentTime + duration);
    }

    gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  jump() { this.playTone(180, 'square', 0.16, 520); }
  attack() { this.playTone(420, 'sawtooth', 0.09, 140); }
  hit() { this.playTone(140, 'square', 0.22, 55, 0.2); }
  bossHit() { this.playTone(260, 'sawtooth', 0.12, 90, 0.18); }
  swap() {
    this.playTone(330, 'square', 0.07, 660);
    setTimeout(() => this.playTone(660, 'square', 0.09, 880), 60);
  }
  comboKey() { this.playTone(520, 'triangle', 0.08, 780); }
  solarBomb() {
    this.playTone(600, 'sawtooth', 0.45, 80, 0.25);
    setTimeout(() => this.playTone(120, 'square', 0.4, 40, 0.25), 200);
  }
  win() {
    const notes = [261, 329, 392, 523, 659, 784];
    notes.forEach((n, i) => setTimeout(() => this.playTone(n, 'square', 0.14), i * 110));
  }
}

const sfx = new SoundEngine();

document.getElementById('btn-mute').addEventListener('click', (e) => {
  sfx.muted = !sfx.muted;
  e.target.textContent = sfx.muted ? '🔇' : '🔊';
});

// ==========================================
// 2. MATRICES DE PÍXELES (SPRITES 8-BITS)
// ==========================================
const PALETTE = {
  '1': '#39FF14', // Verde neón principal BMO
  '2': '#9BFF65', // Verde lima claro / brillo
  '3': '#135E09', // Verde oscuro cueva
  '4': '#000000', // Negro (ojos/boca)
  '5': '#B5B842', // Verde oliva portada
  '6': '#6E7822', // Verde musgo sombra portada
  '7': '#FF2A55'  // Destello láser / peligro
};

// Finn (12x16)
const SPRITE_FINN = [
  "  11111111  ",
  " 1122222211 ",
  " 1222222221 ",
  " 1242222421 ",
  " 1222442221 ",
  " 1111111111 ",
  "   111111   ",
  " 1111111111 ",
  " 1 111111 1 ",
  " 1 111111 1 ",
  "   111111   ",
  "   11  11   ",
  "   11  11   ",
  "   11  11   ",
  "  111  111  ",
  "            "
];

// Jake (12x16)
const SPRITE_JAKE = [
  "   222222   ",
  "  22222222  ",
  " 2244224422 ",
  " 2244224422 ",
  " 2222442222 ",
  " 2224224222 ",
  " 2222222222 ",
  " 1222222221 ",
  " 1222222221 ",
  " 1222222221 ",
  "  22222222  ",
  "   22  22   ",
  "   22  22   ",
  "   22  22   ",
  "  222  222  ",
  "            "
];

// Jefe 1: Bouncy Bee (20x16) - Abeja segmentada con rayas y aguijón
const SPRITE_BEE = [
  "        11  11      ",
  "       12211221     ",
  "      1111111111    ",
  "  1111  114114111   ",
  " 11111 11411411411  ",
  "141111 1141141141111",
  "11111111141141141111",
  "114411 1141141141111",
  " 11111 11411411411  ",
  "  1111  114114111   ",
  "        11  11      ",
  "        11  11      ",
  "       11    11     ",
  "                    ",
  "                    ",
  "                    "
];

// Jefe 2: Honey Bunny (18x22) - Conejo grande con orejas largas
const SPRITE_BUNNY = [
  "   111      111   ",
  "  11211    11211  ",
  "  11211    11211  ",
  "   1111    1111   ",
  "    1111  1111    ",
  "    1111111111    ",
  "   111111111111   ",
  "  11441111114411  ",
  "  11441144114411  ",
  "  11111444411111  ",
  "  11114422441111  ",
  " 1111144444411111 ",
  " 1111111111111111 ",
  "111111111111111111",
  "111111111111111111",
  "111111111111111111",
  " 1111111111111111 ",
  "  11111111111111  ",
  "  111 111111 111  ",
  "  111  1111  111  ",
  " 1111  1111  1111 ",
  "                  "
];

// Jefe 3: Sleepy Sam (24x18) - Rana gigante cuadrangular con boca articulada
const SPRITE_SAM_CLOSED = [
  "    111111    111111    ",
  "   11441111  11114411   ",
  "   114411111111114411   ",
  "  11144111111111144111  ",
  " 1111111111111111111111 ",
  " 1111111111111111111111 ",
  "111111111111111111111111",
  "111111111111111111111111",
  "144444444444444444444411",
  "111111111111111111111111",
  "111111111111111111111111",
  "111111111111111111111111",
  " 1111111111111111111111 ",
  "  1111  1111  1111  111 ",
  "  1111  1111  1111  111 ",
  " 11111 11111 11111 1111 ",
  "                        ",
  "                        "
];

const SPRITE_SAM_OPEN = [
  "    111111    111111    ",
  "   11441111  11114411   ",
  "   114411111111114411   ",
  "  11111111111111111111  ",
  " 1111444444444444441111 ",
  " 1114444444444444444111 ",
  "111144444422224444441111",
  "111144444422224444441111",
  "111144444422224444441111",
  "111144444444444444441111",
  "111114444444444444411111",
  "111111111111111111111111",
  " 1111111111111111111111 ",
  "  1111  1111  1111  111 ",
  "  1111  1111  1111  111 ",
  " 11111 11111 11111 1111 ",
  "                        ",
  "                        "
];

function drawPixelMatrix(matrix, x, y, scale = 3, flipX = false, customColor = null) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = matrix[r][c];
      if (ch !== ' ') {
        ctx.fillStyle = customColor || PALETTE[ch] || '#39FF14';
        const drawCol = flipX ? (cols - 1 - c) : c;
        ctx.fillRect(Math.floor(x + drawCol * scale), Math.floor(y + r * scale), scale, scale);
      }
    }
  }
}

// ==========================================
// 3. ESTADO GLOBAL DEL JUEGO Y CONTROLES
// ==========================================
const keys = {};
const COMBO_SEQUENCE = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyX'];
let comboIndex = 0;
let comboTimer = 0;

let gameState = 'TITLE'; // 'TITLE', 'PLAYING', 'VICTORY', 'GAMEOVER'
let tick = 0;
let screenShake = 0;
let cameraX = 0;
const WORLD_WIDTH = 3400;

const player = {
  x: 90,
  y: 260,
  vx: 0,
  vy: 0,
  w: 30,
  h: 44,
  character: 'FINN', // 'FINN' o 'JAKE'
  facing: 1,
  onGround: false,
  lives: 3,      // 3 puntos ●●● en HUD
  hp: 4,         // 4 barras ▮▮▮▮ en HUD
  hasBomb: false,// Icono 💣 en HUD
  attackTimer: 0,
  invulnTimer: 0
};

let bosses = [];
let projectiles = [];
let stalactites = [];
let particles = [];
let pickups = [];

// Eventos de teclado
window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
    e.preventDefault();
  }
  if (!keys[e.code]) {
    handleSingleKeyPress(e.code);
  }
  keys[e.code] = true;
});

window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
});

// Botones táctiles / clicables en la carcasa de BMO
document.querySelectorAll('[data-key]').forEach((btn) => {
  const code = btn.getAttribute('data-key');
  const press = (e) => {
    e.preventDefault();
    if (!keys[code]) handleSingleKeyPress(code);
    keys[code] = true;
  };
  const release = (e) => {
    e.preventDefault();
    keys[code] = false;
  };
  btn.addEventListener('mousedown', press);
  btn.addEventListener('mouseup', release);
  btn.addEventListener('mouseleave', release);
  btn.addEventListener('touchstart', press);
  btn.addEventListener('touchend', release);
});

function handleSingleKeyPress(code) {
  sfx.init();

  if (gameState !== 'PLAYING') {
    if (code === 'Enter' || code === 'Space' || code === 'KeyZ') {
      initGame();
      gameState = 'PLAYING';
      sfx.swap();
    }
    return;
  }

  // Alternar Finn / Jake
  if (code === 'KeyC') {
    player.character = player.character === 'FINN' ? 'JAKE' : 'FINN';
    sfx.swap();
    spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#9BFF65', 12);
  }

  // Ataque cuerpo a cuerpo
  if (code === 'KeyZ' && player.attackTimer <= 0) {
    player.attackTimer = 16;
    sfx.attack();
    checkMeleeHit();
  }

  // Verificar secuencia del Combo Secreto (Arriba, Abajo, Izquierda, Derecha, X)
  const normalizedCode = normalizeComboKey(code);
  if (normalizedCode === COMBO_SEQUENCE[comboIndex]) {
    comboIndex++;
    comboTimer = 150; // 2.5 segundos para completar el siguiente paso
    sfx.comboKey();
    updateComboUI();

    if (comboIndex === COMBO_SEQUENCE.length) {
      triggerSolarBomb();
      comboIndex = 0;
      updateComboUI();
    }
  } else if (code === 'KeyX' && player.hasBomb) {
    // Si ya tiene la bomba cargada en el inventario, X la lanza directamente
    triggerSolarBomb();
  } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'KeyA', 'KeyD'].includes(code)) {
    if (normalizedCode === 'ArrowUp') {
      comboIndex = 1;
      comboTimer = 150;
    } else {
      comboIndex = 0;
    }
    updateComboUI();
  }
}

function normalizeComboKey(code) {
  if (code === 'KeyW') return 'ArrowUp';
  if (code === 'KeyS') return 'ArrowDown';
  if (code === 'KeyA') return 'ArrowLeft';
  if (code === 'KeyD') return 'ArrowRight';
  return code;
}

function updateComboUI() {
  comboStepBadges.forEach((badge, idx) => {
    badge.classList.toggle('active-step', idx < comboIndex);
  });
}

// ==========================================
// 4. INICIALIZACIÓN DEL NIVEL CONTINUO Y JEFES
// ==========================================
function initGame() {
  player.x = 80;
  player.y = 260;
  player.vx = 0;
  player.vy = 0;
  player.lives = 3;
  player.hp = 4;
  player.hasBomb = false;
  player.character = 'FINN';
  player.invulnTimer = 0;
  cameraX = 0;
  comboIndex = 0;
  updateComboUI();

  projectiles = [];
  stalactites = [];
  particles = [];

  // Ítems recolectables (Corazones de vida y Bomba Solar extra)
  pickups = [
    { x: 750, y: 185, type: 'HEART', taken: false },
    { x: 1620, y: 270, type: 'HEART', taken: false },
    { x: 2490, y: 270, type: 'BOMB', taken: false }
  ];

  // Los 3 Jefes Canónicos en sus respectivas Zonas del Mapa Continuo
  bosses = [
    {
      id: 'BEE',
      name: 'BOUNCY BEE',
      zoneMinX: 980,
      lockX: 1480,
      x: 1320,
      y: 200,
      baseY: 205,
      w: 60,
      h: 48,
      hp: 8,
      maxHp: 8,
      alive: true,
      state: 'FLOAT',
      timer: 0
    },
    {
      id: 'BUNNY',
      name: 'HONEY BUNNY',
      zoneMinX: 1700,
      lockX: 2320,
      x: 2120,
      y: 254,
      vy: 0,
      w: 54,
      h: 66,
      hp: 12,
      maxHp: 12,
      alive: true,
      state: 'IDLE',
      timer: 0
    },
    {
      id: 'SAM',
      name: 'SLEEPY SAM',
      zoneMinX: 2520,
      lockX: 3300,
      x: 2980,
      y: 266,
      w: 72,
      h: 54,
      hp: 1, // Solo vulnerable a la Bomba Solar
      maxHp: 1,
      alive: true,
      mouthOpen: false,
      timer: 0
    }
  ];
}

// ==========================================
// 5. GEOMETRÍA DEL MAPA CONTINUO (4 ZONAS)
// ==========================================
const PITS = [
  { x1: 630, x2: 735, type: 'LAVA' },  // Primer foso clásico de BMO en Zona 1
  { x1: 1550, x2: 1640, type: 'LAVA' },// Foso entre Abeja y Conejo
  { x1: 2790, x2: 2915, type: 'LAVA' } // Foso delantero frente a Sleepy Sam
];

function isInPit(x) {
  return PITS.some(p => x >= p.x1 && x <= p.x2);
}

// Altura del suelo continuo en función de X
function getGroundY(x) {
  // Zona 1: Colina exterior y bajada a la cueva
  if (x < 250) return 320;
  if (x >= 250 && x < 430) {
    // Subida a la montaña de la imagen 2
    return 320 - ((x - 250) / 180) * 90;
  }
  if (x >= 430 && x < 540) {
    // Bajada hacia la entrada de la cueva
    return 230 + ((x - 430) / 110) * 90;
  }
  return 320;
}

// Altura del techo cavernoso
function getCeilingY(x) {
  if (x < 460) return -100; // Cielo abierto en el exterior
  if (x >= 1000 && x <= 1480) return 105; // Cueva baja de Bouncy Bee
  if (x >= 1750 && x <= 2320) return 95;  // Guarida de Honey Bunny
  return 85;
}

// ==========================================
// 6. LÓGICA DE ACTUALIZACIÓN (GAME LOOP)
// ==========================================
function update() {
  tick++;
  if (screenShake > 0) screenShake--;

  if (gameState !== 'PLAYING') return;

  // Temporizador del Combo Secreto
  if (comboTimer > 0) {
    comboTimer--;
    if (comboTimer === 0) {
      comboIndex = 0;
      updateComboUI();
    }
  }

  // Movimiento Horizontal (Finn es más rápido que Jake)
  const moveSpeed = player.character === 'FINN' ? 3.8 : 3.0;
  const jumpForce = player.character === 'FINN' ? -10.8 : -9.6;

  if (keys['ArrowLeft'] || keys['KeyA']) {
    player.vx = -moveSpeed;
    player.facing = -1;
  } else if (keys['ArrowRight'] || keys['KeyD']) {
    player.vx = moveSpeed;
    player.facing = 1;
  } else {
    player.vx *= 0.75;
  }

  // Salto
  if ((keys['Space'] || keys['ArrowUp'] || keys['KeyW']) && player.onGround) {
    player.vy = jumpForce;
    player.onGround = false;
    sfx.jump();
  }

  // Aplicar gravedad y movimiento
  player.vy += 0.48;
  player.x += player.vx;
  player.y += player.vy;

  // Barreras de Jefes Vivos (no puedes pasar la zona sin derrotar al jefe)
  let maxAllowedX = WORLD_WIDTH - 60;
  for (const b of bosses) {
    if (b.alive && b.lockX < maxAllowedX) {
      maxAllowedX = b.lockX;
    }
  }
  if (player.x < 16) player.x = 16;
  if (player.x > maxAllowedX - player.w) player.x = maxAllowedX - player.w;

  // Colisión con Suelo y Fosos de Lava/Ácido
  const centerX = player.x + player.w / 2;
  const overPit = isInPit(centerX);
  const groundY = getGroundY(centerX);

  if (!overPit && player.y + player.h >= groundY && player.vy >= 0) {
    player.y = groundY - player.h;
    player.vy = 0;
    player.onGround = true;
  } else {
    player.onGround = false;
  }

  // Si cae al foso de lava verde
  if (player.y + player.h > 368) {
    damagePlayer(2);
    // Reaparecer antes del foso
    const pit = PITS.find(p => centerX >= p.x1 - 30 && centerX <= p.x2 + 30);
    player.x = pit ? pit.x1 - 55 : Math.max(60, player.x - 120);
    player.y = 200;
    player.vy = 0;
  }

  if (player.attackTimer > 0) player.attackTimer--;
  if (player.invulnTimer > 0) player.invulnTimer--;

  // Actualizar Cámara Lateral
  const targetCamX = player.x - 190;
  cameraX += (targetCamX - cameraX) * 0.12;
  cameraX = Math.max(0, Math.min(cameraX, WORLD_WIDTH - canvas.width));

  // Actualizar Indicador de Zona en el Manual Bootstrap
  updateZoneBadge();

  // Recolección de Ítems
  pickups.forEach(item => {
    if (!item.taken && Math.abs(player.x - item.x) < 28 && Math.abs(player.y - item.y) < 36) {
      item.taken = true;
      sfx.swap();
      if (item.type === 'HEART') {
        player.hp = Math.min(4, player.hp + 2);
      } else if (item.type === 'BOMB') {
        player.hasBomb = true;
      }
      spawnParticles(item.x, item.y, '#39FF14', 15);
    }
  });

  // Actualizar IA de los 3 Jefes
  updateBosses();

  // Actualizar Proyectiles y Bomba Solar
  updateProjectiles();

  // Actualizar Estalactitas
  updateStalactites();

  // Actualizar Partículas
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function updateZoneBadge() {
  if (!zoneIndicator) return;
  if (player.x < 950) zoneIndicator.textContent = 'ZONA 1: MONTAÑA Y CUEVA';
  else if (player.x < 1680) zoneIndicator.textContent = 'ZONA 2: BOUNCY BEE';
  else if (player.x < 2480) zoneIndicator.textContent = 'ZONA 3: HONEY BUNNY';
  else zoneIndicator.textContent = 'ZONA 4: SLEEPY SAM';
}

// Combate cuerpo a cuerpo (Espada de Finn / Puño estirado de Jake)
function checkMeleeHit() {
  const reach = player.character === 'JAKE' ? 68 : 38;
  const dmg = player.character === 'JAKE' ? 2 : 1;
  const hitboxX = player.facing === 1 ? player.x + player.w : player.x - reach;
  const hitboxY = player.y + 4;

  bosses.forEach(b => {
    if (!b.alive) return;
    if (
      hitboxX < b.x + b.w &&
      hitboxX + reach > b.x &&
      hitboxY < b.y + b.h &&
      hitboxY + player.h > b.y
    ) {
      if (b.id === 'SAM') {
        // Sleepy Sam es inmune a ataques básicos: rebota el golpe
        sfx.hit();
        spawnParticles(b.x + 10, b.y + 20, '#B5B842', 8);
      } else {
        b.hp -= dmg;
        sfx.bossHit();
        spawnParticles(b.x + b.w / 2, b.y + b.h / 2, '#9BFF65', 14);
        if (b.hp <= 0) {
          b.alive = false;
          screenShake = 18;
          sfx.solarBomb();
          spawnParticles(b.x + b.w / 2, b.y + b.h / 2, '#39FF14', 35);
        }
      }
    }
  });
}

// Invocar y lanzar la Bomba Solar (Combo Secreto)
function triggerSolarBomb() {
  player.hasBomb = true;
  sfx.solarBomb();
  screenShake = 12;
  projectiles.push({
    x: player.x + player.w / 2,
    y: player.y,
    vx: player.facing * 6.5,
    vy: -4.5,
    r: 14,
    fromPlayer: true,
    type: 'SOLAR_BOMB'
  });
  player.hasBomb = false;
}

function updateBosses() {
  bosses.forEach(b => {
    if (!b.alive) return;
    if (Math.abs(player.x - b.x) > 520) return; // Solo activo cuando el jugador se acerca

    b.timer++;

    // 1. IA de BOUNCY BEE (Vuelo senoidal + aguijón + embestida)
    if (b.id === 'BEE') {
      if (b.state === 'FLOAT') {
        b.y = b.baseY + Math.sin(b.timer * 0.08) * 38;
        b.x = 1290 + Math.cos(b.timer * 0.04) * 70;

        if (b.timer % 75 === 0) {
          // Dispara aguijón hacia el jugador
          projectiles.push({
            x: b.x,
            y: b.y + 24,
            vx: -5.2,
            vy: (player.y - b.y) * 0.025,
            r: 5,
            fromPlayer: false,
            type: 'STINGER'
          });
          sfx.attack();
        }
        if (b.timer % 190 === 0) {
          b.state = 'SWOOP';
        }
      } else if (b.state === 'SWOOP') {
        b.x -= 6.5;
        b.y = 265;
        if (b.x < 1030) {
          b.x = 1360;
          b.state = 'FLOAT';
        }
      }
    }

    // 2. IA de HONEY BUNNY (Saltos sísmicos con estalactitas + Láser ocular)
    if (b.id === 'BUNNY') {
      b.y += b.vy;
      if (b.y < 254) {
        b.vy += 0.45;
      } else {
        if (b.vy > 4) {
          // Al caer al suelo hace temblar la cueva y caen estalactitas
          screenShake = 12;
          sfx.hit();
          for (let i = 0; i < 3; i++) {
            stalactites.push({
              x: 1820 + Math.random() * 420,
              y: 100,
              vy: 2.5 + Math.random() * 2
            });
          }
        }
        b.y = 254;
        b.vy = 0;
      }

      if (b.timer % 110 === 0 && b.y >= 254) {
        b.vy = -10.5;
        b.x = player.x < b.x ? Math.max(1850, b.x - 95) : Math.min(2220, b.x + 95);
        sfx.jump();
      }

      // Disparo de rayos láser blancos/verdes como en la imagen 2
      if (b.timer % 85 === 40) {
        projectiles.push({
          x: b.x,
          y: b.y + 22,
          vx: -6.8,
          vy: -0.5,
          r: 6,
          fromPlayer: false,
          type: 'LASER'
        });
        projectiles.push({
          x: b.x,
          y: b.y + 28,
          vx: -6.8,
          vy: 0.8,
          r: 6,
          fromPlayer: false,
          type: 'LASER'
        });
        sfx.attack();
      }
    }

    // 3. IA de SLEEPY SAM (Boca articulada + Aliento de fuego sobre el foso)
    if (b.id === 'SAM') {
      b.mouthOpen = (b.timer % 110) > 55;
      if (b.mouthOpen && b.timer % 18 === 0) {
        projectiles.push({
          x: b.x - 6,
          y: b.y + 24,
          vx: -5.4,
          vy: (Math.random() - 0.5) * 2.2,
          r: 9,
          fromPlayer: false,
          type: 'FIRE'
        });
        sfx.attack();
      }
    }

    // Colisión directa Jugador <-> Jefe
    if (
      player.x < b.x + b.w - 8 &&
      player.x + player.w > b.x + 8 &&
      player.y < b.y + b.h - 6 &&
      player.y + player.h > b.y + 6
    ) {
      damagePlayer(1);
    }
  });
}

function updateProjectiles() {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.x += p.vx;
    p.y += p.vy;

    if (p.type === 'SOLAR_BOMB') {
      p.vy += 0.22; // Parábola de la Bomba Solar
      if (p.y > 308) {
        p.y = 308;
        p.vy = -4.5; // Rebota hacia Sleepy Sam
      }
      spawnParticles(p.x, p.y, '#9BFF65', 2);

      // Verificar impacto de Bomba Solar contra cualquier jefe (especialmente Sleepy Sam)
      for (const b of bosses) {
        if (b.alive && p.x > b.x - 15 && p.x < b.x + b.w + 15 && p.y > b.y - 15 && p.y < b.y + b.h + 15) {
          b.alive = false;
          screenShake = 28;
          sfx.solarBomb();
          spawnParticles(b.x + b.w / 2, b.y + b.h / 2, '#39FF14', 50);
          projectiles.splice(i, 1);

          if (b.id === 'SAM') {
            setTimeout(() => {
              gameState = 'VICTORY';
              sfx.win();
            }, 900);
          }
          break;
        }
      }
    } else {
      // Proyectiles enemigos contra el jugador
      if (
        p.x > player.x &&
        p.x < player.x + player.w &&
        p.y > player.y &&
        p.y < player.y + player.h
      ) {
        damagePlayer(1);
        projectiles.splice(i, 1);
        continue;
      }
    }

    if (p.x < cameraX - 100 || p.x > cameraX + canvas.width + 150 || p.y > 400) {
      projectiles.splice(i, 1);
    }
  }
}

function updateStalactites() {
  for (let i = stalactites.length - 1; i >= 0; i--) {
    const s = stalactites[i];
    s.y += s.vy;
    s.vy += 0.18;

    if (
      s.x > player.x - 6 &&
      s.x < player.x + player.w + 6 &&
      s.y + 18 > player.y &&
      s.y < player.y + player.h
    ) {
      damagePlayer(1);
      stalactites.splice(i, 1);
      continue;
    }

    if (s.y > 325) {
      spawnParticles(s.x, 320, '#39FF14', 5);
      stalactites.splice(i, 1);
    }
  }
}

function damagePlayer(amount) {
  if (player.invulnTimer > 0) return;
  player.hp -= amount;
  player.invulnTimer = 55;
  screenShake = 10;
  sfx.hit();
  spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#FF2A55', 15);

  if (player.hp <= 0) {
    player.lives--;
    if (player.lives <= 0) {
      gameState = 'GAMEOVER';
    } else {
      player.hp = 4;
    }
  }
}

function spawnParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      color,
      life: 16 + Math.random() * 14
    });
  }
}

// ==========================================
// 7. RENDERIZADO FIEL A LAS IMÁGENES DE REFERENCIA
// ==========================================
function draw() {
  ctx.save();
  if (screenShake > 0) {
    ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
  }

  if (gameState === 'TITLE') {
    drawTitleScreen();
  } else {
    drawGameWorld();
    drawCanonicalHUD();
    if (gameState === 'VICTORY' || gameState === 'GAMEOVER') {
      drawEndOverlay();
    }
  }

  ctx.restore();
}

// Recreación exacta de la Imagen 1 (Portada GUARDIANS of SUNSHINE)
function drawTitleScreen() {
  // Fondo negro puro
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Patrón de tramado (dithering) verde oscuro estilo 8-bits
  ctx.fillStyle = '#122909';
  for (let y = 30; y < 350; y += 8) {
    for (let x = 25; x < 615; x += 8) {
      if ((x + y) % 16 === 0) {
        ctx.fillRect(x, y, 4, 4);
      }
    }
  }

  // Título Superior: GUARDIANS of SUNSHINE con sombra verde
  ctx.font = 'bold 46px "Press Start 2P", monospace';
  ctx.fillStyle = '#336618';
  ctx.fillText('GUARDIANS', 74, 96);
  ctx.fillStyle = '#B5B842';
  ctx.fillText('GUARDIANS', 70, 92);

  ctx.font = 'bold 25px "Press Start 2P", monospace';
  ctx.fillStyle = '#336618';
  ctx.fillText('of SUNSHINE', 238, 134);
  ctx.fillStyle = '#B5B842';
  ctx.fillText('of SUNSHINE', 235, 131);

  // Personaje izquierdo (Finn retro verde oliva sosteniendo la bomba negra con brillos verdes)
  ctx.fillStyle = '#B5B842';
  // Cabeza redonda pixelada
  ctx.fillRect(105, 145, 96, 86);
  ctx.fillRect(95, 158, 116, 60);
  // Ojos negros con brillo
  ctx.fillStyle = '#000';
  ctx.fillRect(124, 178, 12, 14);
  ctx.fillRect(172, 178, 12, 14);
  ctx.fillStyle = '#B5B842';
  ctx.fillRect(126, 180, 4, 4);
  ctx.fillRect(174, 180, 4, 4);
  // Sonrisa
  ctx.fillStyle = '#000';
  ctx.fillRect(142, 198, 24, 5);
  ctx.fillRect(138, 194, 5, 5);
  ctx.fillRect(165, 194, 5, 5);

  // Torso y brazos sosteniendo la bomba
  ctx.fillStyle = '#B5B842';
  ctx.fillRect(82, 238, 115, 160);
  // Sombreado tramado del brazo
  ctx.fillStyle = '#556B2F';
  for (let py = 265; py < 335; py += 6) {
    for (let px = 115; px < 155; px += 6) {
      if ((px + py) % 12 === 0) ctx.fillRect(px, py, 4, 4);
    }
  }

  // Bomba negra en las manos con reflejos verdes (fiel a hda1.png)
  ctx.fillStyle = '#000000';
  ctx.fillRect(170, 265, 92, 76);
  ctx.fillRect(182, 255, 68, 92);
  // Mecha de la bomba
  ctx.fillRect(245, 245, 18, 16);
  // Reflejos verdes redondos dentro de la bomba
  ctx.fillStyle = '#4B8B2B';
  ctx.fillRect(192, 282, 12, 10);
  ctx.fillRect(212, 272, 20, 16);

  // Brazos envolviendo la bomba
  ctx.fillStyle = '#B5B842';
  ctx.fillRect(150, 315, 115, 28);

  // Rana derecha (Sleepy Sam en la portada)
  ctx.fillStyle = '#B5B842';
  ctx.fillRect(345, 195, 195, 95);
  ctx.fillRect(365, 165, 60, 35);
  ctx.fillRect(445, 165, 60, 35);
  // Ojos verticales de la rana
  ctx.fillStyle = '#336618';
  ctx.fillRect(378, 172, 34, 28);
  ctx.fillRect(458, 172, 34, 28);
  ctx.fillStyle = '#000';
  ctx.fillRect(391, 174, 8, 24);
  ctx.fillRect(471, 174, 8, 24);
  // Boca fruncida y pecas de la rana
  ctx.fillStyle = '#336618';
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(395 + i * 18, 224, 10, 8);
  }
  ctx.fillRect(378, 234, 10, 8);
  ctx.fillRect(482, 234, 10, 8);
  // Patas de la rana
  ctx.fillStyle = '#B5B842';
  ctx.fillRect(355, 290, 36, 22);
  ctx.fillRect(415, 290, 36, 22);
  ctx.fillRect(485, 290, 42, 22);

  // Texto parpadeante "PRESS START"
  if (Math.floor(tick / 28) % 2 === 0) {
    ctx.font = 'bold 20px "Press Start 2P", monospace';
    ctx.fillStyle = '#B5B842';
    ctx.fillText('PRESS START', 345, 348);
  }

  // Icono (B) ↵ en la esquina inferior derecha
  ctx.strokeStyle = '#4B8B2B';
  ctx.lineWidth = 3;
  ctx.strokeRect(552, 358, 30, 30);
  ctx.font = 'bold 16px "Press Start 2P", monospace';
  ctx.fillStyle = '#B5B842';
  ctx.fillText('B', 559, 381);
  // Flecha Enter verde al lado de (B)
  ctx.fillStyle = '#4B8B2B';
  ctx.fillRect(594, 372, 22, 8);
  ctx.fillRect(608, 360, 8, 18);
}

// Renderizado del Mundo 2D estilo BMO (Imagen 2)
function drawGameWorld() {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(-Math.floor(cameraX), 0);

  // Textura matricial de fondo en verde oscuro (cuevas y bosque)
  ctx.fillStyle = '#081f06';
  const startGridX = Math.floor(cameraX / 16) * 16;
  for (let gx = startGridX; gx < cameraX + canvas.width; gx += 16) {
    const ceil = Math.max(70, getCeilingY(gx));
    const ground = getGroundY(gx);
    for (let gy = ceil; gy < ground; gy += 16) {
      ctx.fillRect(gx + 2, gy + 2, 6, 10);
    }
  }

  // ZONA 1: Sol radiante en píxeles y siluetas de árboles (como en la captura 1 de hda2.jpg)
  ctx.fillStyle = '#39FF14';
  const sunX = 155;
  const sunY = 128;
  ctx.fillRect(sunX - 18, sunY - 18, 36, 36);
  ctx.fillRect(sunX - 22, sunY - 12, 44, 24);
  ctx.fillRect(sunX - 12, sunY - 22, 24, 44);
  // Rayos del sol
  ctx.fillRect(sunX - 2, sunY - 36, 4, 8);
  ctx.fillRect(sunX - 2, sunY + 28, 4, 8);
  ctx.fillRect(sunX - 36, sunY - 2, 8, 4);
  ctx.fillRect(sunX + 28, sunY - 2, 8, 4);
  ctx.fillRect(sunX - 26, sunY - 26, 5, 5);
  ctx.fillRect(sunX + 21, sunY - 26, 5, 5);
  ctx.fillRect(sunX - 26, sunY + 21, 5, 5);
  ctx.fillRect(sunX + 21, sunY + 21, 5, 5);

  // Contorno verde neón brillante (#39FF14) del suelo y de la montaña
  ctx.strokeStyle = '#39FF14';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let x = 0; x <= WORLD_WIDTH; x += 6) {
    if (isInPit(x)) continue;
    const gy = getGroundY(x);
    if (x === 0 || isInPit(x - 6)) {
      ctx.moveTo(x, gy);
    } else {
      ctx.lineTo(x, gy);
    }
  }
  ctx.stroke();

  // Dibujar los Fosos de Lava/Ácido verde burbujeante con picos
  PITS.forEach(pit => {
    // Paredes verticales del foso
    ctx.strokeStyle = '#39FF14';
    ctx.beginPath();
    ctx.moveTo(pit.x1, 320);
    ctx.lineTo(pit.x1, 385);
    ctx.moveTo(pit.x2, 320);
    ctx.lineTo(pit.x2, 385);
    ctx.stroke();

    // Piscina de ácido verde neón
    ctx.fillStyle = '#39FF14';
    ctx.fillRect(pit.x1 + 2, 355, pit.x2 - pit.x1 - 4, 30);

    // Picos/burbujas animados en la superficie del foso (idéntico a captura 2 de hda2.jpg)
    for (let px = pit.x1 + 6; px < pit.x2 - 8; px += 12) {
      const wave = Math.sin(tick * 0.15 + px) * 4;
      ctx.fillRect(px, 348 + wave, 4, 8);
    }
  });

  // Techo de la Cueva y Estalactitas Fijas en verde neón
  ctx.strokeStyle = '#39FF14';
  ctx.beginPath();
  ctx.moveTo(460, 85);
  for (let x = 460; x <= WORLD_WIDTH; x += 20) {
    const cy = getCeilingY(x);
    ctx.lineTo(x, cy);
    // Estalactitas decorativas del techo
    if (x % 80 === 0) {
      ctx.lineTo(x + 6, cy + 22);
      ctx.lineTo(x + 12, cy);
    }
  }
  ctx.stroke();

  // Barreras láser de bloqueo de Jefe
  bosses.forEach(b => {
    if (b.alive) {
      ctx.fillStyle = (tick % 10 < 5) ? '#39FF14' : '#135E09';
      for (let by = 90; by < 320; by += 14) {
        ctx.fillRect(b.lockX, by, 6, 8);
      }
    }
  });

  // Dibujar Ítems Recolectables
  pickups.forEach(item => {
    if (item.taken) return;
    const floatY = item.y + Math.sin(tick * 0.1) * 4;
    ctx.fillStyle = '#39FF14';
    if (item.type === 'HEART') {
      ctx.fillRect(item.x, floatY, 16, 14);
      ctx.fillStyle = '#000';
      ctx.fillText('+', item.x + 3, floatY + 12);
    } else if (item.type === 'BOMB') {
      ctx.fillRect(item.x, floatY, 18, 18);
      ctx.fillRect(item.x + 6, floatY - 5, 6, 5);
    }
  });

  // Dibujar al Jugador (Finn o Jake mediante matriz de píxeles)
  if (player.invulnTimer % 4 < 2) {
    const sprite = player.character === 'FINN' ? SPRITE_FINN : SPRITE_JAKE;
    drawPixelMatrix(sprite, player.x - 3, player.y - 4, 3, player.facing === -1);

    // Efecto visual de ataque cuerpo a cuerpo (Espada de Finn o Puño estirado de Jake)
    if (player.attackTimer > 0) {
      const reach = player.character === 'JAKE' ? 68 : 36;
      const atkX = player.facing === 1 ? player.x + player.w : player.x - reach;
      ctx.fillStyle = player.character === 'JAKE' ? '#9BFF65' : '#39FF14';
      ctx.fillRect(atkX, player.y + 16, reach, 10);
    }
  }

  // Dibujar los 3 Jefes mediante sus Matrices de Píxeles
  bosses.forEach(b => {
    if (!b.alive) return;

    if (b.id === 'BEE') {
      drawPixelMatrix(SPRITE_BEE, b.x, b.y, 3);
    } else if (b.id === 'BUNNY') {
      drawPixelMatrix(SPRITE_BUNNY, b.x, b.y, 3);
    } else if (b.id === 'SAM') {
      const samMatrix = b.mouthOpen ? SPRITE_SAM_OPEN : SPRITE_SAM_CLOSED;
      drawPixelMatrix(samMatrix, b.x, b.y, 3);
    }

    // Barra de vida sobre el jefe
    ctx.fillStyle = '#000';
    ctx.fillRect(b.x, b.y - 16, b.w, 8);
    ctx.strokeStyle = '#39FF14';
    ctx.lineWidth = 1;
    ctx.strokeRect(b.x, b.y - 16, b.w, 8);
    ctx.fillStyle = '#39FF14';
    const hpWidth = (b.hp / b.maxHp) * (b.w - 2);
    ctx.fillRect(b.x + 1, b.y - 15, Math.max(0, hpWidth), 6);
  });

  // Dibujar Estalactitas que caen
  ctx.fillStyle = '#39FF14';
  stalactites.forEach(s => {
    ctx.beginPath();
    ctx.moveTo(s.x - 6, s.y);
    ctx.lineTo(s.x + 6, s.y);
    ctx.lineTo(s.x, s.y + 20);
    ctx.closePath();
    ctx.fill();
  });

  // Dibujar Proyectiles y la Bomba Solar
  projectiles.forEach(p => {
    if (p.type === 'SOLAR_BOMB') {
      ctx.fillStyle = '#9BFF65';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.fillRect(p.x - 4, p.y - 4, 8, 8);
    } else if (p.type === 'LASER') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(p.x - 10, p.y - 3, 20, 6);
    } else {
      ctx.fillStyle = '#39FF14';
      ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    }
  });

  // Dibujar Partículas
  particles.forEach(pt => {
    ctx.fillStyle = pt.color;
    ctx.fillRect(pt.x, pt.y, 4, 4);
  });

  // Aviso en pantalla al llegar a Sleepy Sam
  const sam = bosses.find(b => b.id === 'SAM');
  if (sam && sam.alive && player.x > 2560) {
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillStyle = '#9BFF65';
    ctx.fillText('¡COMBO SECRETO: ↑ ↓ ← → X!', 2660, 135);
  }

  ctx.restore();
}

// HUD Canónico Superior de BMO (Fiel a la segunda captura de hda2.jpg: [ ●●● | ▮▮▮▮ | 💣 ])
function drawCanonicalHUD() {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, 54);

  ctx.strokeStyle = '#39FF14';
  ctx.lineWidth = 3;

  // Contenedor principal del HUD dividido en 3 cajas
  ctx.strokeRect(20, 10, 600, 36);
  ctx.beginPath();
  ctx.moveTo(190, 10);
  ctx.lineTo(190, 46);
  ctx.moveTo(420, 10);
  ctx.lineTo(420, 46);
  ctx.stroke();

  // Caja 1: Vidas (●●●)
  ctx.fillStyle = '#39FF14';
  for (let i = 0; i < 3; i++) {
    if (i < player.lives) {
      ctx.beginPath();
      ctx.arc(55 + i * 36, 28, 8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeRect(49 + i * 36, 22, 12, 12);
    }
  }

  // Caja 2: Barras de Salud (▮▮▮▮)
  for (let i = 0; i < 4; i++) {
    if (i < player.hp) {
      ctx.fillStyle = '#39FF14';
      ctx.fillRect(230 + i * 38, 17, 16, 22);
    } else {
      ctx.strokeStyle = '#135E09';
      ctx.strokeRect(230 + i * 38, 17, 16, 22);
    }
  }

  // Caja 3: Icono de Bomba Solar + Héroe Activo
  ctx.fillStyle = (player.hasBomb || comboIndex > 0) ? '#39FF14' : '#135E09';
  ctx.beginPath();
  ctx.arc(460, 30, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(457, 16, 6, 5);

  ctx.font = '11px "Press Start 2P", monospace';
  ctx.fillStyle = '#39FF14';
  ctx.fillText(player.character, 500, 34);
}

// Pantallas de Victoria y Game Over
function drawEndOverlay() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
  ctx.fillRect(60, 90, 520, 230);
  ctx.strokeStyle = '#39FF14';
  ctx.lineWidth = 4;
  ctx.strokeRect(60, 90, 520, 230);

  ctx.textAlign = 'center';
  ctx.font = '24px "Press Start 2P", monospace';
  ctx.fillStyle = '#39FF14';

  if (gameState === 'VICTORY') {
    ctx.fillText('¡VICTORIA SOLAR!', canvas.width / 2, 155);
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillStyle = '#B5B842';
    ctx.fillText('DERROTASTE A SLEEPY SAM CON EL COMBO', canvas.width / 2, 200);
    ctx.fillText('¡FINN, JAKE Y BMO ESTÁN A SALVO!', canvas.width / 2, 230);
  } else {
    ctx.fillStyle = '#FF2A55';
    ctx.fillText('GAME OVER', canvas.width / 2, 160);
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillStyle = '#B5B842';
    ctx.fillText('LOS GUARDIANES DEL SOL TE VENCIERON', canvas.width / 2, 210);
  }

  if (Math.floor(tick / 25) % 2 === 0) {
    ctx.font = '13px "Press Start 2P", monospace';
    ctx.fillStyle = '#39FF14';
    ctx.fillText('PRESIONA [ENTER] PARA JUGAR DE NUEVO', canvas.width / 2, 285);
  }
  ctx.textAlign = 'left';
}

// Bucle Principal a 60 FPS
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// Inicializar estado y arrancar bucle
initGame();
gameState = 'TITLE';
requestAnimationFrame(gameLoop);