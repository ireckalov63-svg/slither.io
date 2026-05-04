// ============================================================================
//  НАСТРОЙКИ ИГРЫ 
// ============================================================================

//  НАСТРОЙКИ МИРА
const WORLD_SHAPE = 'circle';           // ФОРМА ГРАНИЦЫ: 'circle' (круг) или 'rect' (квадрат).
const WORLD_SIZE = 4000;                // РАЗМЕР МИРА: Диаметр игрового поля в пикселях.
const WORLD_RADIUS = WORLD_SIZE / 2;    // РАДИУС КРУГА: Вычисляется автоматически. НЕ МЕНЯЙ вручную.
const WORLD_CENTER = { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 }; // ЦЕНТР КАРТЫ: Точка старта игрока.

//  НАСТРОЙКИ ЗМЕЙКИ
const SNAKE_START_LENGTH = 15;          // НАЧАЛЬНАЯ ДЛИНА: Сколько сегментов у змейки при старте.
const SNAKE_RADIUS = 12;                // ТОЛЩИНА ТЕЛА: Радиус одного кружка змейки.
const SNAKE_HEAD_SCALE = 1.2;           // РАЗМЕР ГОЛОВЫ: 1.0 = как тело, 1.5 = голова в полтора раза больше.
const SNAKE_SPEED = 3.5;                // СКОРОСТЬ: Базовая скорость за 1 кадр при 60 FPS. Теперь нормализуется автоматически!
const SNAKE_TURN_SMOOTHNESS = 0.15;     // ПЛАВНОСТЬ ПОВОРОТА: 0.05 (очень плавно) → 1.0 (мгновенно).

//  НАСТРОЙКИ ЕДЫ
const FOOD_COUNT = 400;                 // КОЛИЧЕСТВО ЕДЫ: Сколько кружков одновременно на поле.
const FOOD_MIN_SIZE = 2;                // МИНИМАЛЬНЫЙ РАЗМЕР ЕДЫ: Самый мелкий кружок.
const FOOD_MAX_SIZE = 5;                // МАКСИМАЛЬНЫЙ РАЗМЕР ЕДЫ: Самый крупный кружок.
const FOOD_GROWTH = 1;                  // ПРИРОСТ: На сколько сегментов растёт змейка за 1 еду.
const FOOD_FROM_DEATH_RATIO = 3;        // РАЗМЕР КРОШЕК: Каждое N-е звено умершей змейки становится едой.

//  НАСТРОЙКИ БОТОВ
const BOT_COUNT = 20;                   // КОЛИЧЕСТВО БОТОВ: Сколько ИИ-змейек на карте.
const BOT_TURN_CHANCE = 0.02;           // ВЕРОЯТНОСТЬ ПОВОРОТА: 0.01-0.1. Чем выше, тем "нервнее" бот.
const BOT_TURN_AMOUNT = 2;              // УГОЛ ПОВОРОТА: Максимальный градус разворота за срабатывание.
const BOT_RESPAWN_DELAY = 3000;         // ЗАДЕРЖКА ВОЗРОЖДЕНИЯ: Время в мс до появления нового бота.
const BOT_SAFE_MARGIN = 200;            // ЗОНА ВОЗВРАТА: Расстояние до границы, где бот начинает разворачиваться.

//  НАСТРОЙКИ КАМЕРЫ И УПРАВЛЕНИЯ
const CAMERA_SMOOTHNESS = 0.08;         // ПЛАВНОСТЬ КАМЕРЫ: 0.05 (очень плавно) → 0.3 (резко).
const MOUSE_DEADZONE = 5;               // МЁРТВАЯ ЗОНА: Если мышь ближе 5 пикселей к центру, поворота не будет.

//  НАСТРОЙКИ ВИЗУАЛА
const GRID_SIZE = 100;                  // РАЗМЕР КЛЕТКИ: Расстояние между линиями сетки фона.
const GRID_COLOR = '#1a1a2e';         // ЦВЕТ СЕТКИ: Цвет линий на фоне.
const BACKGROUND_COLOR = '#0a0a1a';   // ЦВЕТ ФОНА: Основной цвет игровой зоны.
const BORDER_COLOR = '#ff4757';       // ЦВЕТ ГРАНИЦЫ: Цвет опасной круглой зоны.
const BORDER_WIDTH = 8;                 // ТОЛЩИНА ГРАНИЦЫ: Ширина линии круга.
const WARNING_RING_WIDTH = 20;          // ТОЛЩИНА ПРЕДУПРЕЖДЕНИЯ: Красная зона перед границей.
const SHADOW_BLUR_BODY = 15;            // СВЕЧЕНИЕ ТЕЛА: Неоновый ореол вокруг змейки.
const SHADOW_BLUR_FOOD = 5;             // СВЕЧЕНИЕ ЕДЫ: Неоновый ореол вокруг еды.

//  НАСТРОЙКИ ГЕЙМПЛЕЯ
const GAME_OVER_DELAY = 150;            // ЗАДЕРЖКА ЭКРАНА СМЕРТИ: Время в мс перед показом меню проигрыша.

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
    constructor(x, y, color, isBot = false) {
        this.body = [];
        this.length = SNAKE_START_LENGTH;
        this.radius = SNAKE_RADIUS;
        this.color = color;
        this.isBot = isBot;
        this.angle = Math.random() * Math.PI * 2;
        this.targetAngle = this.angle;
        this.speed = SNAKE_SPEED; 
        this.alive = true;
        for (let i = 0; i < this.length; i++) this.body.push({ x, y });
    }

    update(dtMultiplier) {
        if (!this.alive) return;
        const head = this.body[0];

        // Управление
        if (this.isBot) {
            if (Math.random() < BOT_TURN_CHANCE) this.targetAngle += (Math.random() - 0.5) * BOT_TURN_AMOUNT;
            const dist = Math.hypot(head.x - WORLD_CENTER.x, head.y - WORLD_CENTER.y);
            if (dist > WORLD_RADIUS - BOT_SAFE_MARGIN) this.targetAngle = Math.atan2(WORLD_CENTER.y - head.y, WORLD_CENTER.x - head.x);
        } else {
            const dx = mouse.x - canvas.width / 2;
            const dy = mouse.y - canvas.height / 2;
            if (Math.hypot(dx, dy) > MOUSE_DEADZONE) this.targetAngle = Math.atan2(dy, dx);
        }

        // Плавный поворот
        let diff = this.targetAngle - this.angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.angle += diff * SNAKE_TURN_SMOOTHNESS;

        //  Движение с нормализацией по времени (скорость всегда одинаковая)
        head.x += Math.cos(this.angle) * this.speed * dtMultiplier;
        head.y += Math.sin(this.angle) * this.speed * dtMultiplier;

        //  ПРОВЕРКА КРУГЛОЙ ГРАНИЦЫ
        const distFromCenter = Math.hypot(head.x - WORLD_CENTER.x, head.y - WORLD_CENTER.y);
        if (distFromCenter >= WORLD_RADIUS - this.radius) {
            this.die();
            return;
        }

        // Обновление тела
        this.body.unshift({ x: head.x, y: head.y });
        if (this.body.length > this.length) this.body.pop();

        this.checkCollisions();

        // Камера
        if (!this.isBot) {
            camera.x += (this.body[0].x - canvas.width / 2 - camera.x) * CAMERA_SMOOTHNESS;
            camera.y += (this.body[0].y - canvas.height / 2 - camera.y) * CAMERA_SMOOTHNESS;
        }
    }

    checkCollisions() {
        const head = this.body[0];
        for (let i = foods.length - 1; i >= 0; i--) {
            const f = foods[i];
            if (Math.hypot(head.x - f.x, head.y - f.y) < this.radius + f.size) {
                this.length += FOOD_GROWTH;
                foods.splice(i, 1);
                foods.push(new Food());
            }
        }
        const all = [player, ...bots].filter(s => s && s.alive);
        for (const other of all) {
            if (other === this) continue;
            for (const seg of other.body) {
                if (Math.hypot(head.x - seg.x, head.y - seg.y) < this.radius + other.radius * 0.85) {
                    this.die();
                    return;
                }
            }
        }
    }

    die() {
        this.alive = false;
        this.body.forEach((p, i) => { if (i % FOOD_FROM_DEATH_RATIO === 0) foods.push(new Food(p.x, p.y, 6, this.color)); });
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

// ============================================================================
//  ЛОГИКА ИГРЫ
// ============================================================================
function createBot() {
    let x, y, d;
    do { x = Math.random()*WORLD_SIZE; y = Math.random()*WORLD_SIZE; d = Math.hypot(x-WORLD_CENTER.x, y-WORLD_CENTER.y); } while (d < WORLD_RADIUS * 0.3);
    return new Snake(x, y, `hsl(${Math.random()*360},70%,50%)`, true);
}

function stopGame() {
    isGameRunning = false;
    if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
    lastFrameTime = 0; 
}

function initGame() {
    foods = Array.from({length: FOOD_COUNT}, () => new Food());
    player = new Snake(WORLD_CENTER.x, WORLD_CENTER.y, skins[selectedSkinIndex].color, false);
    bots = Array.from({length: BOT_COUNT}, createBot);
    camera = { x: WORLD_CENTER.x - canvas.width/2, y: WORLD_CENTER.y - canvas.height/2 };
    mouse = { x: canvas.width/2, y: canvas.height/2 }; 
    isGameOver = false;
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
    bots.forEach(b => { b.update(dtMultiplier); b.draw(); });
    if (player?.alive) { player.update(dtMultiplier); player.draw(); }
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
    if (name === 'game' && gameScreen) { gameScreen.style.display = 'block'; startGame(); }
    if (name === 'gameover' && gameoverScreen) gameoverScreen.style.display = 'flex';
}

function updateSkinsPreview() {
    if (!skinsPreview) return;
    const s = skins[previewSkinIndex];
    const sel = previewSkinIndex === selectedSkinIndex;
    skinsPreview.innerHTML = `
        <div style="width:100px;height:100px;background:${s.color};border-radius:50%;
            box-shadow:0 0 30px ${s.color},0 0 60px ${s.color}55;margin:20px auto;
            border:${sel?'3px solid #fff':'3px solid transparent'}"></div>
        <p style="color:#fff;font-size:1.2em">${s.name}</p>
        ${sel ? '<p style="color:#4ecdc4;font-size:0.9em">✓ Выбран</p>' : ''}
    `;
}

// События
window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });
window.addEventListener('mousemove', e => { if (currentScreen === 'game') { mouse.x = e.clientX; mouse.y = e.clientY; } });
window.addEventListener('touchmove', e => { if (currentScreen === 'game' && e.touches[0]) { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; e.preventDefault(); } }, { passive: false });

// Кнопки
document.querySelectorAll('.menu-play').forEach(btn => btn.onclick = () => showScreen('game'));
document.querySelectorAll('.menu-skins').forEach(btn => btn.onclick = () => showScreen('skins'));
document.querySelector('.skins-arrow-left')?.addEventListener('click', () => { previewSkinIndex = (previewSkinIndex - 1 + skins.length) % skins.length; updateSkinsPreview(); });
document.querySelector('.skins-arrow-right')?.addEventListener('click', () => { previewSkinIndex = (previewSkinIndex + 1) % skins.length; updateSkinsPreview(); });
document.querySelector('.skins-select')?.addEventListener('click', () => { selectedSkinIndex = previewSkinIndex; showScreen('menu'); });
document.querySelector('.gameover-screen .menu-play')?.addEventListener('click', () => showScreen('game'));
document.querySelector('.gameover-screen .menu-skins')?.addEventListener('click', () => showScreen('menu'));

// ============================================================================
//  СТАРТ
// ============================================================================
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
showScreen('menu');
updateSkinsPreview();