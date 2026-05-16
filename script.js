// ============================================================================
//  НАСТРОЙКИ ИГРЫ 
// ============================================================================

//  НАСТРОЙКИ МИРА
const WORLD_SHAPE = 'circle';
const WORLD_SIZE = 4000;
const WORLD_RADIUS = WORLD_SIZE / 2;
const WORLD_CENTER = { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 };

//  НАСТРОЙКИ ЗМЕЙКИ
const SNAKE_START_LENGTH = 15;
const SNAKE_RADIUS = 12;
const SNAKE_HEAD_SCALE = 1.2;
const SNAKE_SPEED = 3.5;
const SNAKE_TURN_SMOOTHNESS = 0.15;

//  НАСТРОЙКИ ЕДЫ
const FOOD_COUNT = 400;
const FOOD_MIN_SIZE = 2;
const FOOD_MAX_SIZE = 5;
const FOOD_GROWTH = 1;
const FOOD_FROM_DEATH_RATIO = 3;

//  НАСТРОЙКИ БОТОВ
const BOT_COUNT = 40;
const BOT_TURN_CHANCE = 0.02;
const BOT_TURN_AMOUNT = 2;
const BOT_RESPAWN_DELAY = 3000;
const BOT_SAFE_MARGIN = 200;

//  НАСТРОЙКИ КАМЕРЫ И УПРАВЛЕНИЯ
const CAMERA_SMOOTHNESS = 0.08;
const MOUSE_DEADZONE = 5;

//  НАСТРОЙКИ ВИЗУАЛА
const GRID_SIZE = 100;
const GRID_COLOR = '#1a1a2e';
const BACKGROUND_COLOR = '#0a0a1a';
const BORDER_COLOR = '#ff4757';
const BORDER_WIDTH = 8;
const WARNING_RING_WIDTH = 20;
const SHADOW_BLUR_BODY = 15;
const SHADOW_BLUR_FOOD = 5;

//  НАСТРОЙКИ ГЕЙМПЛЕЯ
const GAME_OVER_DELAY = 150;

//  НАСТРОЙКИ БАФФОВ
const BUFF_MAGNET_COOLDOWN = 60;
const BUFF_MAGNET_DURATION = 7000;
const BUFF_MAGNET_RADIUS = 300;
const BUFF_MAGNET_PULL_SPEED = 8;

const BUFF_SHIELD_COOLDOWN = 60;
const BUFF_SHIELD_DURATION = 10000;
const BUFF_SHIELD_COLOR = '#4ecdc4';

const BUFF_SPEED_COOLDOWN = 60;
const BUFF_SPEED_DURATION = 5000;
const BUFF_SPEED_MULTIPLIER = 2.0;

const BUFF_FREEZE_COOLDOWN = 60;
const BUFF_FREEZE_DURATION = 10000;
const BUFF_FREEZE_SLOW_FACTOR = 0.2;

//  НАСТРОЙКИ КАСТОМНЫХ СКИНОВ
const CUSTOM_SKIN_CONFIG = {
    segments: 2000,
    spacing: 0.1,
    headSmooth: 1,
    headImageWidth: 130,
    headToBodyGap: 20,
    segmentOverlap: 20,
    skinThickness: 130
};

// ============================================================================
//  ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ============================================================================
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const menuScreen = document.querySelector('.menu-screen');
const skinsScreen = document.querySelector('.skins-screen');
const gameoverScreen = document.querySelector('.gameover-screen');
const gameScreen = document.querySelector('.game-screen');
const goLengthEl = document.querySelector('.go-length');
const goBestEl = document.querySelector('.go-best');
const skinsPreview = document.querySelector('.skins-preview');

let camera = { x: 0, y: 0 };
let mouse = { x: canvas.width / 2, y: canvas.height / 2 };
let isGameOver = false;
let isGameRunning = false;
let currentScreen = 'menu';

const skins = [
    { name: 'Кастом 1', imagePath: 'img//skin/skin1.png'},
    { name: 'Кастом 2', imagePath: 'img//skin/skin2.png'},
    { name: 'Кастом 3', imagePath: 'img//skin/skin3.png'},
    { name: 'Кастом 4', imagePath: 'img//skin/skin4.png'},
    { name: 'Кастом 5', imagePath: 'img//skin/skin5.png'},
    { name: 'Кастом 6', imagePath: 'img//skin/skin6.png'},
    { color: '#00ffcc', name: 'Неон' },
    { color: '#ff6b6b', name: 'Огонь' },
    { color: '#4ecdc4', name: 'Мята' },
    { color: '#a5d8ff', name: 'Лёд' },
    { color: '#ffd43b', name: 'Золото' },
    { color: '#da77f2', name: 'Фиолет' }
];
let selectedSkinIndex = 0;
let previewSkinIndex = 0;

let bestScore = parseInt(localStorage.getItem('snakeBestScore')) || 0;
if (goBestEl) goBestEl.textContent = bestScore;

let foods = [];
let player = null;
let bots = [];
let animationId = null;
let lastFrameTime = 0;

const playerBuffs = {
    magnet: { ready: true, cooldown: BUFF_MAGNET_COOLDOWN, lastUsed: 0, endTime: 0, active: false, name: '🧲 Магнит', rafId: null },
    shield: { ready: true, cooldown: BUFF_SHIELD_COOLDOWN, lastUsed: 0, endTime: 0, active: false, name: '🛡️ Щит', rafId: null },
    speed:  { ready: true, cooldown: BUFF_SPEED_COOLDOWN,  lastUsed: 0, endTime: 0, active: false, name: '⚡ Ускорение', rafId: null },
    freeze: { ready: true, cooldown: BUFF_FREEZE_COOLDOWN, lastUsed: 0, endTime: 0, active: false, name: '❄️ Заморозка', rafId: null }
};

const buffButtons = {
    magnet: document.getElementById('buff-magnet'),
    shield: document.getElementById('buff-shield'),
    speed:  document.getElementById('buff-speed'),
    freeze: document.getElementById('buff-freeze')
};

const buffIndicators = {
    shield: document.getElementById('shield-indicator'),
    speed:  document.getElementById('speed-indicator'),
    magnet: document.getElementById('magnet-indicator'),
    freeze: document.getElementById('freeze-indicator')
};

// ============================================================================
//  🎮 СИСТЕМА ВИРТУАЛЬНОГО ДЖОЙСТИКА
// ============================================================================
const joystick = {
  container: document.getElementById('joystick-container'),
  base: document.getElementById('joystick-base'),
  knob: document.getElementById('joystick-knob'),
  baseRadius: 70,
  knobRadius: 30,
  maxDistance: 40,
  isActive: false,
  touchId: null,
  angle: 0,
  magnitude: 0,
  baseCenter: { x: 0, y: 0 },
  knobPos: { x: 0, y: 0 }
};

function initJoystick() {
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth <= 1024;
  
  if (isTouchDevice || isSmallScreen) {
    document.body.classList.add('touch-device');
    if (joystick.container) joystick.container.hidden = false;
    updateJoystickBasePosition();
    setupJoystickEvents();
  }
}

function updateJoystickBasePosition() {
  if (!joystick.base) return;
  const rect = joystick.base.getBoundingClientRect();
  joystick.baseCenter.x = rect.left + rect.width / 2;
  joystick.baseCenter.y = rect.top + rect.height / 2;
  joystick.baseRadius = rect.width / 2;
  joystick.maxDistance = joystick.baseRadius - joystick.knobRadius - 10;
}

function setupJoystickEvents() {
  if (!joystick.base) return;
  const base = joystick.base;
  
  base.addEventListener('touchstart', handleJoystickStart, { passive: false });
  base.addEventListener('touchmove', handleJoystickMove, { passive: false });
  base.addEventListener('touchend', handleJoystickEnd);
  base.addEventListener('touchcancel', handleJoystickEnd);
  
  base.addEventListener('mousedown', handleJoystickStart);
  document.addEventListener('mousemove', handleJoystickMove);
  document.addEventListener('mouseup', handleJoystickEnd);
  
  window.addEventListener('resize', updateJoystickBasePosition);
}

function handleJoystickStart(e) {
  e.preventDefault();
  const touch = e.type.includes('touch') ? e.changedTouches[0] : e;
  if (e.type.includes('touch')) joystick.touchId = e.changedTouches[0].identifier;
  joystick.isActive = true;
  if (joystick.knob) joystick.knob.classList.add('active');
  updateJoystickBasePosition();
  handleJoystickMove(e);
}

function handleJoystickMove(e) {
  if (!joystick.isActive) return;
  if (e.type.includes('touch')) {
    const touch = Array.from(e.touches).find(t => t.identifier === joystick.touchId);
    if (!touch) return;
    e = touch;
  }
  e.preventDefault();
  
  const dx = e.clientX - joystick.baseCenter.x;
  const dy = e.clientY - joystick.baseCenter.y;
  const distance = Math.min(Math.hypot(dx, dy), joystick.maxDistance);
  const angle = Math.atan2(dy, dx);
  
  joystick.angle = angle;
  joystick.magnitude = distance / joystick.maxDistance;
  
  const knobX = Math.cos(angle) * distance;
  const knobY = Math.sin(angle) * distance;
  
  if (joystick.knob) {
    joystick.knob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
  }
  
  if (currentScreen === 'game' && player?.alive && !player.isBot) {
    player.targetAngle = angle;
  }
}

function handleJoystickEnd(e) {
  if (!joystick.isActive) return;
  if (e.type.includes('touch') && joystick.touchId !== null) {
    const touch = Array.from(e.changedTouches || []).find(t => t.identifier === joystick.touchId);
    if (!touch && e.type !== 'touchcancel') return;
  }
  joystick.isActive = false;
  joystick.touchId = null;
  joystick.magnitude = 0;
  if (joystick.knob) joystick.knob.classList.remove('active');
  
  if (joystick.knob) {
    joystick.knob.style.transition = 'transform 0.15s ease-out';
    joystick.knob.style.transform = 'translate(-50%, -50%)';
    setTimeout(() => { if (joystick.knob) joystick.knob.style.transition = ''; }, 150);
  }
}

function getJoystickDirection() {
  if (!joystick.isActive || joystick.magnitude < 0.1) return null;
  return { angle: joystick.angle, strength: joystick.magnitude };
}

// ============================================================================
//  КЛАССЫ
// ============================================================================
class Food {
    constructor(x, y, size, color) {
        this.x = x !== undefined ? x : Math.random() * WORLD_SIZE;
        this.y = y !== undefined ? y : Math.random() * WORLD_SIZE;
        this.size = size !== undefined ? size : Math.random() * (FOOD_MAX_SIZE - FOOD_MIN_SIZE) + FOOD_MIN_SIZE;
        this.color = color || `hsl(${Math.random() * 360}, 100%, 50%)`;
    }
    draw() {
        const sx = this.x - camera.x;
        const sy = this.y - camera.y;
        if (sx < -20 || sx > canvas.width + 20 || sy < -20 || sy > canvas.height + 20) return;
        ctx.beginPath();
        ctx.arc(sx, sy, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = SHADOW_BLUR_FOOD;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

class Snake {
    constructor(x, y, color, isBot = false, skinData = null) {
        this.body = [];
        this.length = SNAKE_START_LENGTH;
        this.radius = SNAKE_RADIUS;
        this.color = color;
        this.isBot = isBot;
        this.angle = Math.random() * Math.PI * 2;
        this.targetAngle = this.angle;
        this.speed = SNAKE_SPEED;
        this.alive = true;
        
        this.skinData = skinData;
        this.useCustomSkin = !isBot && skinData?.imagePath;
        this.customImage = null;
        this.customPoints = [];
        this.customImageLoaded = false;
        
        if (this.useCustomSkin) {
            this.customImage = new Image();
            this.customImage.crossOrigin = "Anonymous";
            this.customImage.src = skinData.imagePath;
            this.customImage.onload = () => {
                this.customImageLoaded = true;
                for (let i = 0; i < CUSTOM_SKIN_CONFIG.segments; i++) {
                    this.customPoints.push({ x: x - i * CUSTOM_SKIN_CONFIG.spacing, y: y });
                }
            };
            this.customImage.onerror = () => {
                console.warn(`⚠️ Не загружен: ${skinData.imagePath}`);
                this.useCustomSkin = false;
            };
        }
        
        for (let i = 0; i < this.length; i++) this.body.push({ x, y });
    }

    addCustomPoints(count) {
        if (!this.useCustomSkin || !this.customImageLoaded) return;
        const insertIndex = 2;
        const referencePoint = this.customPoints[Math.min(insertIndex, this.customPoints.length - 1)];
        for (let i = 0; i < count; i++) {
            this.customPoints.splice(insertIndex + i, 0, { x: referencePoint.x, y: referencePoint.y });
        }
    }

    update(dtMultiplier) {
        if (!this.alive) return;
        const head = this.body[0];

        if (this.isBot) {
            if (Math.random() < BOT_TURN_CHANCE) this.targetAngle += (Math.random() - 0.5) * BOT_TURN_AMOUNT;
            const dist = Math.hypot(head.x - WORLD_CENTER.x, head.y - WORLD_CENTER.y);
            if (dist > WORLD_RADIUS - BOT_SAFE_MARGIN) this.targetAngle = Math.atan2(WORLD_CENTER.y - head.y, WORLD_CENTER.x - head.x);
        } else {
            // Приоритет джойстику
            if (joystick.isActive && joystick.magnitude >= 0.1) {
                this.targetAngle = joystick.angle;
            } else {
                const dx = mouse.x - canvas.width / 2;
                const dy = mouse.y - canvas.height / 2;
                if (Math.hypot(dx, dy) > MOUSE_DEADZONE) this.targetAngle = Math.atan2(dy, dx);
            }
        }

        let diff = this.targetAngle - this.angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.angle += diff * SNAKE_TURN_SMOOTHNESS;

        head.x += Math.cos(this.angle) * this.speed * dtMultiplier;
        head.y += Math.sin(this.angle) * this.speed * dtMultiplier;

        if (this.useCustomSkin && this.customImageLoaded && this.customPoints.length > 0) {
            this.customPoints[0].x += (head.x - this.customPoints[0].x) * CUSTOM_SKIN_CONFIG.headSmooth;
            this.customPoints[0].y += (head.y - this.customPoints[0].y) * CUSTOM_SKIN_CONFIG.headSmooth;
            for (let i = 1; i < this.customPoints.length; i++) {
                const prev = this.customPoints[i - 1];
                const curr = this.customPoints[i];
                const dx = prev.x - curr.x;
                const dy = prev.y - curr.y;
                const angle = Math.atan2(dy, dx);
                const currentSpacing = (i === 1) 
                    ? CUSTOM_SKIN_CONFIG.spacing + CUSTOM_SKIN_CONFIG.headToBodyGap 
                    : CUSTOM_SKIN_CONFIG.spacing;
                curr.x = prev.x - Math.cos(angle) * currentSpacing;
                curr.y = prev.y - Math.sin(angle) * currentSpacing;
            }
        }

        this.body.unshift({ x: head.x, y: head.y });
        if (this.body.length > this.length) this.body.pop();

        const distFromCenter = Math.hypot(head.x - WORLD_CENTER.x, head.y - WORLD_CENTER.y);
        if (distFromCenter >= WORLD_RADIUS - this.radius) {
            if (!this.isBot && playerBuffs.shield.active) {
                deactivateShield();
                showNotification('🛡️ Щит поглотил удар!', 'shield');
                head.x -= Math.cos(this.angle) * this.speed * dtMultiplier * 3;
                head.y -= Math.sin(this.angle) * this.speed * dtMultiplier * 3;
                return;
            }
            this.die();
            return;
        }

        this.checkCollisions();

        if (!this.isBot) {
            const camSmooth = joystick.isActive ? CAMERA_SMOOTHNESS * 1.2 : CAMERA_SMOOTHNESS;
            camera.x += (this.body[0].x - canvas.width / 2 - camera.x) * camSmooth;
            camera.y += (this.body[0].y - canvas.height / 2 - camera.y) * camSmooth;
        }
    }

    checkCollisions() {
        const head = this.body[0];
        for (let i = foods.length - 1; i >= 0; i--) {
            const f = foods[i];
            if (Math.hypot(head.x - f.x, head.y - f.y) < this.radius + f.size) {
                this.length += FOOD_GROWTH;
                this.addCustomPoints(FOOD_GROWTH);
                foods.splice(i, 1);
                foods.push(new Food());
            }
        }
        const all = [player, ...bots].filter(s => s && s.alive);
        for (const other of all) {
            if (other === this) continue;
            for (const seg of other.body) {
                if (Math.hypot(head.x - seg.x, head.y - seg.y) < this.radius + other.radius * 0.85) {
                    if (!this.isBot && playerBuffs.shield.active) {
                        deactivateShield();
                        showNotification('🛡️ Щит поглотил удар!', 'shield');
                        const pushAngle = Math.atan2(head.y - seg.y, head.x - seg.x);
                        head.x += Math.cos(pushAngle) * 15;
                        head.y += Math.sin(pushAngle) * 15;
                        return;
                    }
                    this.die();
                    return;
                }
            }
        }
    }

    die() {
        this.alive = false;
        this.body.forEach((p, i) => { if (i % FOOD_FROM_DEATH_RATIO === 0) foods.push(new Food(p.x, p.y, 6, this.color || '#fff')); });
        if (!this.isBot) {
            isGameOver = true;
            stopGame();
            if (this.length > bestScore) { bestScore = this.length; localStorage.setItem('snakeBestScore', bestScore); if (goBestEl) goBestEl.textContent = bestScore; }
            if (goLengthEl) goLengthEl.textContent = this.length;
            setTimeout(() => showScreen('gameover'), GAME_OVER_DELAY);
        } else {
            setTimeout(() => { const idx = bots.indexOf(this); if (idx > -1 && isGameRunning) bots[idx] = createBot(); }, BOT_RESPAWN_DELAY);
        }
    }

    draw() {
        if (!this.alive) return;
        if (this.useCustomSkin && this.customImageLoaded && this.customImage.complete) {
            this.drawCustomSkin();
        } else {
            this.drawCircleSkin();
        }
    }
    
    drawCircleSkin() {
        ctx.shadowBlur = SHADOW_BLUR_BODY;
        ctx.shadowColor = this.color;
        for (let i = this.body.length - 1; i >= 0; i--) {
            const p = this.body[i];
            const sx = p.x - camera.x, sy = p.y - camera.y;
            if (sx < -40 || sx > canvas.width + 40 || sy < -40 || sy > canvas.height + 40) continue;
            ctx.beginPath();
            const r = i === 0 ? this.radius * SNAKE_HEAD_SCALE : this.radius;
            ctx.arc(sx, sy, r, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
            if (i === 0) {
                ctx.fillStyle = '#fff';
                const eo = this.radius * 0.45;
                const a1 = this.angle - 0.4, a2 = this.angle + 0.4;
                ctx.beginPath();
                ctx.arc(sx + Math.cos(a1)*eo, sy + Math.sin(a1)*eo, 4, 0, Math.PI*2);
                ctx.arc(sx + Math.cos(a2)*eo, sy + Math.sin(a2)*eo, 4, 0, Math.PI*2);
                ctx.fill();
            }
        }
        ctx.shadowBlur = 0;
    }
    
    drawCustomSkin() {
        if (!this.customImage?.complete || this.customPoints.length === 0) return;
        const img = this.customImage;
        const headImgW = this.skinData.headImageWidth || CUSTOM_SKIN_CONFIG.headImageWidth;
        const bodyImgW = img.width - headImgW;
        const bodySegments = CUSTOM_SKIN_CONFIG.segments - 1;
        const segmentWidth = bodyImgW / bodySegments;
        const overlapPx = CUSTOM_SKIN_CONFIG.segmentOverlap;
        const targetHeight = CUSTOM_SKIN_CONFIG.skinThickness;
        const scale = targetHeight / img.height;
        const headDrawWidth = headImgW * scale;
        const bodyDrawWidth = (segmentWidth + overlapPx) * scale;

        for (let i = 0; i < this.customPoints.length; i++) {
            const p = this.customPoints[i];
            const sx = p.x - camera.x;
            const sy = p.y - camera.y;
            if (sx < -100 || sx > canvas.width + 100 || sy < -100 || sy > canvas.height + 100) continue;
            
            let angle;
            if (i === 0 && this.customPoints.length > 1) {
                angle = Math.atan2(this.customPoints[1].y - p.y, this.customPoints[1].x - p.x);
            } else if (i === this.customPoints.length - 1 && i > 0) {
                angle = Math.atan2(p.y - this.customPoints[i-1].y, p.x - this.customPoints[i-1].x);
            } else if (i > 0 && i < this.customPoints.length - 1) {
                angle = Math.atan2(
                    this.customPoints[i+1].y - this.customPoints[i-1].y, 
                    this.customPoints[i+1].x - this.customPoints[i-1].x
                );
            } else {
                angle = this.angle;
            }

            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(angle);
            if (i === 0) {
                ctx.drawImage(img, 0, 0, headImgW, img.height, -headDrawWidth / 2, -targetHeight / 2, headDrawWidth, targetHeight);
            } else {
                const sliceIdx = (i - 1) % bodySegments;
                const srcW = segmentWidth + overlapPx;
                ctx.drawImage(img, headImgW + sliceIdx * segmentWidth, 0, srcW, img.height, -bodyDrawWidth / 2, -targetHeight / 2, bodyDrawWidth, targetHeight);
            }
            ctx.restore();
        }
        ctx.shadowBlur = 0;
    }
}

// ============================================================================
//  ОТРИСОВКА
// ============================================================================
function drawGrid() {
    ctx.strokeStyle = GRID_COLOR; ctx.lineWidth = 1;
    const ox = -camera.x % GRID_SIZE, oy = -camera.y % GRID_SIZE;
    ctx.beginPath();
    for (let x = ox; x < canvas.width; x += GRID_SIZE) { ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); }
    for (let y = oy; y < canvas.height; y += GRID_SIZE) { ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); }
    ctx.stroke();
}

function drawBorder() {
    ctx.beginPath();
    ctx.arc(WORLD_CENTER.x - camera.x, WORLD_CENTER.y - camera.y, WORLD_RADIUS, 0, Math.PI*2);
    ctx.lineWidth = WARNING_RING_WIDTH;
    ctx.strokeStyle = BORDER_COLOR + '33';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(WORLD_CENTER.x - camera.x, WORLD_CENTER.y - camera.y, WORLD_RADIUS, 0, Math.PI*2);
    ctx.lineWidth = BORDER_WIDTH;
    ctx.strokeStyle = BORDER_COLOR;
    ctx.setLineDash([15, 10]);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawShield() {
    if (!player?.alive || !playerBuffs.shield.active) return;
    ctx.save();
    ctx.strokeStyle = BUFF_SHIELD_COLOR;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 20;
    ctx.shadowColor = BUFF_SHIELD_COLOR;
    const head = player.body[0];
    const sx = head.x - camera.x;
    const sy = head.y - camera.y;
    ctx.beginPath();
    ctx.arc(sx, sy, player.radius + 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}

// ============================================================================
//  УВЕДОМЛЕНИЯ
// ============================================================================
function showNotification(message, type = 'default') {
    const container = document.getElementById('buff-notifications');
    if (!container) return;
    const notif = document.createElement('div');
    notif.className = `buff-notification ${type}`;
    notif.textContent = message;
    container.appendChild(notif);
    setTimeout(() => {
        notif.style.opacity = '0';
        notif.style.transform = 'translateX(20px)';
        setTimeout(() => notif.remove(), 300);
    }, 2700);
}

function showCooldownNotification(buffName) {
    const buff = playerBuffs[buffName];
    if (!buff) return;
    const elapsed = (Date.now() - buff.lastUsed) / 1000;
    const remaining = Math.ceil(buff.cooldown - elapsed);
    if (remaining > 0) {
        showNotification(`${buff.name}: можно использовать через ${remaining} сек.`, 'cooldown');
    }
}

// ============================================================================
//  СИСТЕМА БАФФОВ
// ============================================================================
function isBuffOnCooldown(name) {
    const b = playerBuffs[name];
    if (!b) return false;
    return (Date.now() - b.lastUsed) / 1000 < b.cooldown;
}

function canUseBuff(name) {
    const b = playerBuffs[name];
    if (!b?.ready) return false;
    return (Date.now() - b.lastUsed) / 1000 >= b.cooldown;
}

function activateBuff(name) {
    if (isBuffOnCooldown(name)) { showCooldownNotification(name); return false; }
    if (!canUseBuff(name)) return false;
    const b = playerBuffs[name];
    const now = Date.now();
    b.lastUsed = now;
    b.ready = false;
    switch(name) {
        case 'magnet': activateMagnet(now); showNotification('🧲 Магнит активирован!', 'magnet'); break;
        case 'shield': activateShield(now); showNotification('🛡️ Щит активирован!', 'shield'); break;
        case 'speed':  activateSpeed(now); showNotification('⚡ Ускорение активировано!', 'speed'); break;
        case 'freeze': activateFreeze(now); showNotification('❄️ Боты заморожены!', 'freeze'); break;
    }
    startBuffCooldown(name);
    updateBuffButton(name);
    return true;
}

function activateMagnet(now) {
    if (!player?.alive) return;
    playerBuffs.magnet.active = true;
    playerBuffs.magnet.endTime = now + BUFF_MAGNET_DURATION;
    toggleBuffIndicator('magnet', true);
    applyMagnetEffect();
}

function applyMagnetEffect() {
    if (!player?.alive) return;
    const head = player.body[0];
    for (let i = foods.length - 1; i >= 0; i--) {
        const food = foods[i];
        const dist = Math.hypot(head.x - food.x, head.y - food.y);
        if (dist < BUFF_MAGNET_RADIUS) {
            const angle = Math.atan2(head.y - food.y, head.x - food.x);
            food.x += Math.cos(angle) * BUFF_MAGNET_PULL_SPEED * 3;
            food.y += Math.sin(angle) * BUFF_MAGNET_PULL_SPEED * 3;
            const newDist = Math.hypot(head.x - food.x, head.y - food.y);
            if (newDist < player.radius + food.size + 10) {
                player.length += FOOD_GROWTH;
                player.addCustomPoints(FOOD_GROWTH);
                foods.splice(i, 1);
                foods.push(new Food());
            }
        }
    }
}

function updateMagnet() {
    if (!playerBuffs.magnet.active) return;
    if (Date.now() >= playerBuffs.magnet.endTime) { deactivateMagnet(); return; }
    applyMagnetEffect();
}

function deactivateMagnet() { playerBuffs.magnet.active = false; toggleBuffIndicator('magnet', false); }
function activateShield(now) { playerBuffs.shield.active = true; playerBuffs.shield.endTime = now + BUFF_SHIELD_DURATION; toggleBuffIndicator('shield', true); }
function updateShield() { if (!playerBuffs.shield.active || !player?.alive) return; if (Date.now() >= playerBuffs.shield.endTime) { deactivateShield(); return; } drawShield(); }
function deactivateShield() { playerBuffs.shield.active = false; toggleBuffIndicator('shield', false); }
function activateSpeed(now) { playerBuffs.speed.active = true; playerBuffs.speed.endTime = now + BUFF_SPEED_DURATION; toggleBuffIndicator('speed', true); }
function updateSpeed() { if (!playerBuffs.speed.active) return; if (Date.now() >= playerBuffs.speed.endTime) { deactivateSpeed(); return; } }
function deactivateSpeed() { playerBuffs.speed.active = false; toggleBuffIndicator('speed', false); }
function getSpeedMultiplier() { return playerBuffs.speed.active ? BUFF_SPEED_MULTIPLIER : 1; }
function activateFreeze(now) { playerBuffs.freeze.active = true; playerBuffs.freeze.endTime = now + BUFF_FREEZE_DURATION; toggleBuffIndicator('freeze', true); }
function updateFreeze() { if (!playerBuffs.freeze.active) return; if (Date.now() >= playerBuffs.freeze.endTime) { deactivateFreeze(); return; } }
function deactivateFreeze() { playerBuffs.freeze.active = false; toggleBuffIndicator('freeze', false); }
function getBotSpeedMultiplier() { return playerBuffs.freeze.active ? BUFF_FREEZE_SLOW_FACTOR : 1; }
function toggleBuffIndicator(name, show) { const el = buffIndicators[name]; if (!el) return; el.hidden = !show; el.classList.toggle('visible', show); }

function startBuffCooldown(name) {
    const buff = playerBuffs[name];
    const btn = buffButtons[name];
    if (!btn) return;
    if (buff.rafId) cancelAnimationFrame(buff.rafId);
    btn.classList.add('on-cooldown', 'disabled');
    btn.disabled = true;
    const duration = buff.cooldown * 1000;
    const start = Date.now();
    function update() {
        const elapsed = Date.now() - start;
        if (elapsed < duration) { buff.rafId = requestAnimationFrame(update); }
        else { buff.ready = true; btn.classList.remove('on-cooldown', 'disabled'); btn.disabled = false; buff.rafId = null; }
    }
    buff.rafId = requestAnimationFrame(update);
}

function updateBuffButton(name) { const btn = buffButtons[name]; const buff = playerBuffs[name]; if (!btn || buff.ready) return; btn.disabled = false; btn.classList.remove('on-cooldown', 'disabled'); }
let buffActivationLock = {};
function setupBuffButtons() {
    Object.entries(buffButtons).forEach(([name, btn]) => {
        if (!btn) return;
        buffActivationLock[name] = false;
        const handler = (e) => {
            if (buffActivationLock[name]) return;
            buffActivationLock[name] = true;
            setTimeout(() => buffActivationLock[name] = false, 300);
            e?.stopPropagation?.();
            if (currentScreen === 'game') activateBuff(name);
        };
        btn.addEventListener('click', handler);
        btn.addEventListener('touchstart', handler, { passive: true });
    });
}

function updateBuffsInLoop(dtMultiplier) {
    bots.forEach(bot => {
        const original = bot.speed;
        bot.speed *= getBotSpeedMultiplier();
        bot.update(dtMultiplier);
        bot.draw();
        bot.speed = original;
    });
    if (player?.alive) {
        const original = player.speed;
        player.speed *= getSpeedMultiplier();
        player.update(dtMultiplier);
        player.draw();
        player.speed = original;
        updateShield(); updateSpeed(); updateFreeze(); updateMagnet();
    }
}

function resetBuffs() {
    Object.values(playerBuffs).forEach(b => { b.ready = true; b.active = false; b.lastUsed = 0; b.endTime = 0; if (b.rafId) { cancelAnimationFrame(b.rafId); b.rafId = null; } });
    Object.values(buffButtons).forEach(btn => { if (btn) { btn.disabled = false; btn.classList.remove('on-cooldown', 'disabled'); } });
    Object.values(buffIndicators).forEach(el => { if (el) { el.hidden = true; el.classList.remove('visible'); } });
    const container = document.getElementById('buff-notifications');
    if (container) container.innerHTML = '';
}

// ============================================================================
//  ЛОГИКА ИГРЫ
// ============================================================================
function createBot() {
    let x, y, d;
    do { x = Math.random()*WORLD_SIZE; y = Math.random()*WORLD_SIZE; d = Math.hypot(x-WORLD_CENTER.x, y-WORLD_CENTER.y); } while (d < WORLD_RADIUS * 0.3);
    return new Snake(x, y, `hsl(${Math.random()*360},70%,50%)`, true);
}

function stopGame() { isGameRunning = false; if (animationId) { cancelAnimationFrame(animationId); animationId = null; } lastFrameTime = 0; }

function initGame() {
    foods = Array.from({length: FOOD_COUNT}, () => new Food());
    const selectedSkin = skins[selectedSkinIndex];
    player = new Snake(WORLD_CENTER.x, WORLD_CENTER.y, selectedSkin.color || null, false, selectedSkin);
    bots = Array.from({length: BOT_COUNT}, createBot);
    camera = { x: WORLD_CENTER.x - canvas.width/2, y: WORLD_CENTER.y - canvas.height/2 };
    mouse = { x: canvas.width/2, y: canvas.height/2 };
    isGameOver = false;
    resetBuffs();
    initJoystick(); // 🔹 Инициализация джойстика
}

function startGame() {
    stopGame();
    initGame();
    isGameRunning = true;
    lastFrameTime = performance.now();
    loop(lastFrameTime);
}

function loop(timestamp) {
    if (!isGameRunning || isGameOver) return;
    const dt = timestamp - lastFrameTime || 16.67;
    lastFrameTime = timestamp;
    const dtMultiplier = dt / 16.67;
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    foods.forEach(f => f.draw());
    updateBuffsInLoop(dtMultiplier);
    drawBorder();
    animationId = requestAnimationFrame(loop);
}

// ============================================================================
//  ЭКРАНЫ И СОБЫТИЯ
// ============================================================================
function showScreen(name) {
    [menuScreen, skinsScreen, gameoverScreen, gameScreen].forEach(el => { if (el) el.style.display = 'none'; });
    currentScreen = name;
    if (name === 'menu' && menuScreen) menuScreen.style.display = 'flex';
    if (name === 'skins' && skinsScreen) { updateSkinsPreview(); skinsScreen.style.display = 'flex'; }
    if (name === 'game' && gameScreen) { 
        gameScreen.style.display = 'block'; 
        startGame(); 
        setTimeout(updateJoystickBasePosition, 100); // 🔹 Обновить позицию джойстика
    }
    if (name === 'gameover' && gameoverScreen) gameoverScreen.style.display = 'flex';
}

function updateSkinsPreview() {
    if (!skinsPreview) return;
    const s = skins[previewSkinIndex];
    const sel = previewSkinIndex === selectedSkinIndex;
    let previewContent = '';
    if (s.imagePath) {
        previewContent = `<img src="${s.imagePath}" style="width:96px;height:48px;object-fit:contain;border-radius:6px;margin:20px auto;display:block;border:${sel?'3px solid #fff':'3px solid transparent'};background:#1a1a2e">`;
    } else {
        previewContent = `<div style="width:100px;height:100px;background:${s.color};border-radius:50%;box-shadow:0 0 30px ${s.color},0 0 60px ${s.color}55;margin:20px auto;border:${sel?'3px solid #fff':'3px solid transparent'}"></div>`;
    }
    skinsPreview.innerHTML = `${previewContent}<p style="color:#fff;font-size:1.2em;margin-top:10px">${s.name}</p>${sel ? '<p style="color:#4ecdc4;font-size:0.9em">✓ Выбран</p>' : ''}${s.imagePath ? '<p style="color:#888;font-size:0.8em">🖼️ PNG</p>' : ''}`;
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    updateJoystickBasePosition();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Управление мышью (с приоритетом джойстика)
window.addEventListener('mousemove', e => {
    if (currentScreen !== 'game' || !player?.alive || player.isBot) return;
    if (joystick.isActive) return; // 🔹 Джойстик имеет приоритет
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

// Управление тачем (резервное + джойстик)
window.addEventListener('touchmove', e => {
    if (currentScreen !== 'game' || !player?.alive || player.isBot) return;
    if (joystick.isActive) { e.preventDefault(); return; } // 🔹 Джойстик обрабатывает
    if (e.touches[0]) { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; e.preventDefault(); }
}, { passive: false });

// События кнопок
document.querySelectorAll('.menu-play').forEach(btn => btn.onclick = () => showScreen('game'));
document.querySelectorAll('.menu-skins').forEach(btn => btn.onclick = () => showScreen('skins'));
document.querySelector('.skins-arrow-left')?.addEventListener('click', () => { previewSkinIndex = (previewSkinIndex - 1 + skins.length) % skins.length; updateSkinsPreview(); });
document.querySelector('.skins-arrow-right')?.addEventListener('click', () => { previewSkinIndex = (previewSkinIndex + 1) % skins.length; updateSkinsPreview(); });
document.querySelector('.skins-select')?.addEventListener('click', () => { selectedSkinIndex = previewSkinIndex; showScreen('menu'); });
document.querySelector('.gameover-screen .menu-play')?.addEventListener('click', () => showScreen('game'));
document.querySelector('.gameover-screen .menu-skins')?.addEventListener('click', () => showScreen('menu'));

// ============================================================================
// 🚀 СТАРТ
// ============================================================================
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
showScreen('menu');
updateSkinsPreview();
setupBuffButtons();
