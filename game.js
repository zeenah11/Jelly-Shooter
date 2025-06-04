const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let W, H;
function resize() {
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = W;
  canvas.height = H;
}
resize();
window.addEventListener('resize', resize);

let keys = {};
let frame = 0;
let xp = 0;
let level = 1;
let wave = 1;
let enemies = [];
let bullets = [];
let orbs = [];
let isPaused = false;

const player = {
  x: 0,
  y: 0,
  r: 15,
  color: '#00f0ff',
  speed: 3,
  hp: 100,
};

player.x = W / 2;
player.y = H / 2;

let weapon = {
  fireRate: 60, // frames per shot, lower is faster
  damage: 1,
  bulletSpeed: 6,
  lastShotFrame: 0,
  unlockedWeapons: ['basic'],
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

  // Enemy HP increases gradually by level, starting at 1
  let baseHP = 1;
  let hp = baseHP + level * 0.5; // increase by 0.5 per level

  // Enemy speed starts slower, increases with level but capped at max 3
  let baseSpeed = 0.7;
  let speed = Math.min(baseSpeed + level * 0.1, 3);

  enemies.push({ x, y, r: 12, hp, speed });
}

function drawEnemies() {
  enemies.forEach((e) => {
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
  enemies.forEach((e) => {
    let dx = player.x - e.x;
    let dy = player.y - e.y;
    let dist = Math.hypot(dx, dy);
    if (dist > 0) {
      e.x += (dx / dist) * e.speed;
      e.y += (dy / dist) * e.speed;
    }
  });
}

function shootUpdated() {
  if (frame - weapon.lastShotFrame < weapon.fireRate) return;

  weapon.lastShotFrame = frame;

  if (enemies.length === 0) {
    bullets.push({
      x: player.x,
      y: player.y,
      dx: 0,
      dy: -weapon.bulletSpeed,
      r: 5,
      color: '#0f0',
      damage: weapon.damage,
    });
    if (weapon.unlockedWeapons.includes('doubleShot')) {
      bullets.push({
        x: player.x,
        y: player.y,
        dx: 0.5 * weapon.bulletSpeed,
        dy: -weapon.bulletSpeed,
        r: 5,
        color: '#0f0',
        damage: weapon.damage,
      });
    }
    return;
  }

  let nearest = null;
  let nearestDist = Infinity;
  enemies.forEach((e) => {
    let dist = Math.hypot(e.x - player.x, e.y - player.y);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = e;
    }
  });

  let dx = nearest.x - player.x;
  let dy = nearest.y - player.y;
  let mag = Math.hypot(dx, dy);
  dx /= mag;
  dy /= mag;

  bullets.push({
    x: player.x,
    y: player.y,
    dx: dx * weapon.bulletSpeed,
    dy: dy * weapon.bulletSpeed,
    r: 5,
    color: '#0f0',
    damage: weapon.damage,
  });

  if (weapon.unlockedWeapons.includes('doubleShot')) {
    // Slight angle offset for second bullet
    const angle = Math.atan2(dy, dx);
    const spread = 0.3; // radians

    bullets.push({
      x: player.x,
      y: player.y,
      dx: Math.cos(angle + spread) * weapon.bulletSpeed,
      dy: Math.sin(angle + spread) * weapon.bulletSpeed,
      r: 5,
      color: '#0f0',
      damage: weapon.damage,
    });
  }
}

function moveBullets() {
  bullets.forEach((b) => {
    b.x += b.dx;
    b.y += b.dy;
  });
  bullets = bullets.filter(
    (b) => b.x > 0 && b.x < W && b.y > 0 && b.y < H
  );
}

function drawBullets() {
  bullets.forEach((b) => {
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
        e.hp -= b.damage;
        bullets.splice(i, 1);
        if (e.hp <= 0) {
          enemies.splice(j, 1);
          orbs.push({ x: e.x, y: e.y, r: 4 });
        }
      }
    });
  });

  orbs.forEach((o, i) => {
    let dx = player.x - o.x;
    let dy = player.y - o.y;
    if (Math.hypot(dx, dy) < player.r + o.r) {
      xp++;
      orbs.splice(i, 1);
      if (xp % 5 === 0) {
        level++;
        pauseAndShowUpgrades();
      }
    }
  });

  enemies.forEach((e) => {
    let dx = player.x - e.x;
    let dy = player.y - e.y;
    if (Math.hypot(dx, dy) < player.r + e.r) {
      player.hp -= 0.5; // damage per frame contact
      if (player.hp <= 0) {
        alert('Game Over! Reload to try again.');
        isPaused = true;
      }
    }
  });
}

function drawOrbs() {
  orbs.forEach((o) => {
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
  document.getElementById('hp').innerText = 'HP: ' + Math.floor(player.hp);
}

function pauseAndShowUpgrades() {
  isPaused = true;
  document.getElementById('upgradeMenu').style.display = 'block';
}

function hideUpgradeMenu() {
  document.getElementById('upgradeMenu').style.display = 'none';
  isPaused = false;
}

document.getElementById('upgradeFireRate').onclick = () => {
  weapon.fireRate = Math.max(10, weapon.fireRate - 10);
  hideUpgradeMenu();
};
document.getElementById('upgradeDamage').onclick = () => {
  weapon.damage += 1;
  hideUpgradeMenu();
};
document.getElementById('upgradeBulletSpeed').onclick = () => {
  weapon.bulletSpeed += 1;
  hideUpgradeMenu();
};
document.getElementById('upgradeNewWeapon').onclick = () => {
  if (!weapon.unlockedWeapons.includes('doubleShot')) {
    weapon.unlockedWeapons.push('doubleShot');
  }
  hideUpgradeMenu();
};

function movePlayer() {
  if (keys['w'] || keys['arrowup']) player.y -= player.speed;
  if (keys['s'] || keys['arrowdown']) player.y += player.speed;
  if (keys['a'] || keys['arrowleft']) player.x -= player.speed;
  if (keys['d'] || keys['arrowright']) player.x += player.speed;

  player.x = Math.min(W - player.r, Math.max(player.r, player.x));
  player.y = Math.min(H - player.r, Math.max(player.r, player.y));
}

function gameLoop() {
  if (!isPaused) {
    frame++;
    ctx.clearRect(0, 0, W, H);
    movePlayer();
    moveEnemies();
    moveBullets();

    let spawnInterval = Math.max(60, 300 - level * 20);
    if (frame % spawnInterval === 0) {
      wave++;
      spawnEnemy();
    }

    shootUpdated();
    handleCollisions();

    drawPlayer();
    drawEnemies();
    drawBullets();
    drawOrbs();
    drawUI();
  }
  requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
});
window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

gameLoop();
