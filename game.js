// game.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const W = canvas.width;
const H = canvas.height;

let keys = {};
let frame = 0;
let xp = 0;
let level = 1;
let wave = 1;
let enemies = [];
let bullets = [];
let orbs = [];

const player = {
  x: W / 2,
  y: H / 2,
  r: 15,
  color: '#00f0ff',
  speed: 2.5,
  hp: 100
};

function drawPlayer() {
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.fillStyle = player.color;
  ctx.shadowBlur = 20;
  ctx.shadowColor = player.color;
  ctx.fill();
  ctx.shadowBlur = 0;
}

function spawnEnemy() {
  let side = Math.floor(Math.random() * 4);
  let x = side === 0 ? 0 : side === 1 ? W : Math.random() * W;
  let y = side === 2 ? 0 : side === 3 ? H : Math.random() * H;
  enemies.push({ x, y, r: 12, hp: 10, speed: 1 });
}

function drawEnemies() {
  enemies.forEach(e => {
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
    ctx.fillStyle = '#ff0044';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff0044';
    ctx.fill();
    ctx.shadowBlur = 0;
  });
}

function moveEnemies() {
  enemies.forEach(e => {
    let dx = player.x - e.x;
    let dy = player.y - e.y;
    let dist = Math.hypot(dx, dy);
    e.x += (dx / dist) * e.speed;
    e.y += (dy / dist) * e.speed;
  });
}

function shoot() {
  bullets.push({
    x: player.x,
    y: player.y,
    dx: 0,
    dy: -5,
    r: 5,
    color: '#0f0'
  });
}

function moveBullets() {
  bullets.forEach(b => {
    b.y += b.dy;
  });
  bullets = bullets.filter(b => b.y > 0);
}

function drawBullets() {
  bullets.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fillStyle = b.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = b.color;
    ctx.fill();
    ctx.shadowBlur = 0;
  });
}

function handleCollisions() {
  bullets.forEach((b, i) => {
    enemies.forEach((e, j) => {
      let dx = b.x - e.x;
      let dy = b.y - e.y;
      if (Math.hypot(dx, dy) < b.r + e.r) {
        enemies.splice(j, 1);
        bullets.splice(i, 1);
        orbs.push({ x: e.x, y: e.y, r: 4 });
      }
    });
  });

  orbs.forEach((o, i) => {
    let dx = player.x - o.x;
    let dy = player.y - o.y;
    if (Math.hypot(dx, dy) < player.r + o.r) {
      xp++;
      orbs.splice(i, 1);
      if (xp % 5 === 0) level++;
    }
  });
}

function drawOrbs() {
  orbs.forEach(o => {
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
    ctx.fillStyle = '#fff700';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#fff700';
    ctx.fill();
    ctx.shadowBlur = 0;
  });
}

function drawUI() {
  document.getElementById('wave').innerText = 'Wave: ' + wave;
  document.getElementById('level').innerText = 'Level: ' + level;
  document.getElementById('xp').innerText = 'XP: ' + xp;
}

function update() {
  ctx.clearRect(0, 0, W, H);

  moveEnemies();
  moveBullets();
  handleCollisions();

  drawPlayer();
  drawEnemies();
  drawBullets();
  drawOrbs();
  drawUI();

  if (frame % 60 === 0) shoot();
  if (frame % 300 === 0) {
    spawnEnemy();
    wave++;
  }

  frame++;
  requestAnimationFrame(update);
}

addEventListener('keydown', e => keys[e.key] = true);
addEventListener('keyup', e => keys[e.key] = false);

function movePlayer() {
  if (keys['w'] || keys['ArrowUp']) player.y -= player.speed;
  if (keys['s'] || keys['ArrowDown']) player.y += player.speed;
  if (keys['a'] || keys['ArrowLeft']) player.x -= player.speed;
  if (keys['d'] || keys['ArrowRight']) player.x += player.speed;
}

setInterval(movePlayer, 1000 / 60);
update();
