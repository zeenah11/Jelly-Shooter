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
let grenades = [];
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

// --- NEW: attack range ---

let attackRange = 100;  // initial small range
const attackRangeMax = 350;

// --- Weapon System ---

const weapon = {
  fireRate: 60, // frames per shot, lower is faster
  damage: 1,
  bulletSpeed: 6,
  lastShotFrame: 0,
  unlockedWeapons: ['basic'],
};

// Daggers orbiting player
let daggers = {
  count: 1,
  angle: 0,
  radius: 40,
  damage: 1,
  speed: 0.05 // radians per frame for orbit animation
};

// Lasers
let lasers = {
  count: 3,
  cooldownFrames: 90, // 1.5 seconds at 60fps
  lastFired: 0,
  damage: 2,
};

// Grenades
let grenadeWeapon = {
  count: 1,
  damage: 5,
  blastRadius: 60,
  cooldownFrames: 180,
  lastThrown: 0,
};

function drawPlayer() {
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.fillStyle = player.color;
  ctx.shadowBlur = 20;
  ctx.shadowColor = player.color;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Draw attack range circle
  ctx.beginPath();
  ctx.strokeStyle = '#00f0ff44';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.arc(player.x, player.y, attackRange, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
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

function shootBullets() {
  if (frame - weapon.lastShotFrame < weapon.fireRate) return;

  weapon.lastShotFrame = frame;

  // Shoot only enemies inside attackRange
  let targets = enemies.filter(e => {
    return Math.hypot(e.x - player.x, e.y - player.y) <= attackRange;
  });

  if (targets.length === 0) return;

  // Shoot nearest enemy in range
  let nearest = null;
  let nearestDist = Infinity;
  targets.forEach((e) => {
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

// --- DAGGERS ORBITING PLAYER ---

function drawDaggers() {
  daggers.angle += daggers.speed;
  for (let i = 0; i < daggers.count; i++) {
    let angle = daggers.angle + (i * (2 * Math.PI / daggers.count));
    let x = player.x + daggers.radius * Math.cos(angle);
    let y = player.y + daggers.radius * Math.sin(angle);

    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#ff00ff';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff00ff';
    ctx.fill();
    ctx.shadowBlur = 0;

    // Damage enemies close to dagger
    enemies.forEach((e, idx) => {
      let dist = Math.hypot(e.x - x, e.y - y);
      if (dist < 10) {
        e.hp -= daggers.damage;
        if (e.hp <= 0) {
          enemies.splice(idx, 1);
          orbs.push({ x: e.x, y: e.y, r: 4 });
        }
      }
    });
  }
}

// --- LASERS ---

function fireLasers() {
  if (frame - lasers.lastFired < lasers.cooldownFrames) return;
  lasers.lastFired = frame;

  // Fire lasers evenly spaced around player (full circle)
  for (let i = 0; i < lasers.count; i++) {
    let angle = (i * 2 * Math.PI) / lasers.count;
    // Each laser shoots a straight line (we'll draw it and check collision)
    bullets.push({
      x: player.x,
      y: player.y,
      dx: Math.cos(angle) * 12,
      dy: Math.sin(angle) * 12,
      r: 5,
      color: '#00ffff',
      damage: lasers.damage,
      isLaser: true,
      laserAngle: angle,
      laserLength: 400,
      lifeFrames: 10, // laser bullet lasts short time
    });
  }
}

// Update laser bullets (they disappear after lifeFrames)
function updateLaserBullets() {
  bullets = bullets.filter(b => {
    if (b.isLaser) {
      b.lifeFrames--;
      return b.lifeFrames > 0;
    }
    return true;
  });
}

// Draw laser beams (long lines)
function drawLaserBeams() {
  bullets.forEach(b => {
    if (b.isLaser) {
      ctx.save();
      ctx.strokeStyle = b.color;
      ctx.shadowBlur = 15;
      ctx.shadowColor = b.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x + Math.cos(b.laserAngle) * b.laserLength,
                 b.y + Math.sin(b.laserAngle) * b.laserLength);
      ctx.stroke();
      ctx.restore();
    }
  });
}

// Laser damage collisions
function laserDamage() {
  bullets.forEach(b => {
    if (b.isLaser) {
      enemies.forEach((e, idx) => {
        // Check distance from enemy to laser line segment
        let dist = pointLineDistance(e.x, e.y, b.x, b.y, b.x + Math.cos(b.laserAngle) * b.laserLength, b.y + Math.sin(b.laserAngle) * b.laserLength);
        if (dist < e.r + 5) { // hit if close enough
          e.hp -= b.damage;
          if (e.hp <= 0) {
            enemies.splice(idx, 1);
            orbs.push({ x: e.x, y: e.y, r: 4 });
          }
        }
      });
    }
  });
}

function pointLineDistance(px, py, x1, y1, x2, y2) {
  let A = px - x1;
  let B = py - y1;
  let C = x2 - x1;
  let D = y2 - y1;

  let dot = A * C + B * D;
  let len_sq = C * C + D * D;
  let param = -1;
  if (len_sq !== 0) param = dot / len_sq;

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  let dx = px - xx;
  let dy = py - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

// --- GRENADES ---

function throwGrenades() {
  if (frame - grenadeWeapon.lastThrown < grenadeWeapon.cooldownFrames) return;
  grenadeWeapon.lastThrown = frame;

  // Grenades thrown outward in random directions
  for (let i = 0; i < grenadeWeapon.count; i++) {
    let angle = Math.random() * Math.PI * 2;
    grenades.push({
      x: player.x,
      y: player.y,
      dx: Math.cos(angle) * 5,
      dy: Math.sin(angle) * 5,
      r: 8,
      color: '#ffaa00',
      damage: grenadeWeapon.damage,
      blastRadius: grenadeWeapon.blastRadius,
      timer: 60, // explodes after 1 second (60 frames)
      exploded: false,
    });
  }
}

function updateGrenades() {
  grenades.forEach((g, idx) => {
    if (!g.exploded) {
      g.x += g.dx;
      g.y += g.dy;
      g.timer--;
      if (g.timer <= 0) {
        g.exploded = true;
        // Explosion damage:
        enemies.forEach((e, eidx) => {
          let dist = Math.hypot(e.x - g.x, e.y - g.y);
          if (dist < g.blastRadius + e.r) {
            e.hp -= g.damage;
            if (e.hp <= 0) {
              enemies.splice(eidx, 1);
              orbs.push({ x: e.x, y: e.y, r: 4 });
            }
          }
        });
      }
    } else {
      // Draw explosion animation
      g.r += 3;
      g.color = `rgba(255, 170, 0, ${1 - (g.r / (g.blastRadius * 3))})`;
      if (g.r > g.blastRadius * 3) {
        grenades.splice(idx, 1);
      }
    }
  });
}

function drawGrenades() {
  grenades.forEach((g) => {
    if (!g.exploded) {
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
      ctx.fillStyle = g.color;
      ctx.shadowBlur = 15;
      ctx.shadowColor = g.color;
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
      ctx.fillStyle = g.color;
      ctx.fill();
    }
  });
}

// --- ORBS (XP) ---

function drawOrbs() {
  orbs.forEach((o) => {
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
    ctx.fillStyle = '#0ff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#0ff';
    ctx.fill();
    ctx.shadowBlur = 0;
  });
}

function moveOrbs() {
  orbs.forEach((o, idx) => {
    // Move orbs slowly to player
    let dx = player.x - o.x;
    let dy = player.y - o.y;
    let dist = Math.hypot(dx, dy);
    if (dist < 20) {
      xp += 1;
      orbs.splice(idx, 1);
      checkLevelUp();
    } else {
      o.x += dx / dist * 2;
      o.y += dy / dist * 2;
    }
  });
}

// --- COLLISIONS ---

function handleCollisions() {
  // Bullets to enemies
  bullets.forEach((b, bidx) => {
    if (b.isLaser) return; // lasers handled separately

    enemies.forEach((e, eidx) => {
      let dist = Math.hypot(e.x - b.x, e.y - b.y);
      if (dist < e.r + b.r) {
        e.hp -= b.damage;
        bullets.splice(bidx, 1);
        if (e.hp <= 0) {
          enemies.splice(eidx, 1);
          orbs.push({ x: e.x, y: e.y, r: 4 });
        }
      }
    });
  });

  // Enemies touching player
  enemies.forEach((e, eidx) => {
    let dist = Math.hypot(e.x - player.x, e.y - player.y);
    if (dist < player.r + e.r) {
      player.hp -= 5;
      enemies.splice(eidx, 1);
      if (player.hp <= 0) {
        alert('Game Over! Reload to try again.');
        isPaused = true;
      }
    }
  });
}

// --- LEVEL UP SYSTEM ---

function checkLevelUp() {
  const xpNeeded = level * 10 + 20;
  if (xp >= xpNeeded) {
    xp -= xpNeeded;
    level++;
    showUpgradeMenu();
  }
}

function showUpgradeMenu() {
  isPaused = true;
  document.getElementById('upgradeMenu').style.display = 'block';
}

function hideUpgradeMenu() {
  isPaused = false;
  document.getElementById('upgradeMenu').style.display = 'none';
}

// --- UPGRADE BUTTONS ---

document.getElementById('upgradeFireRate').onclick = () => {
  weapon.fireRate = Math.max(10, weapon.fireRate - 10);
  hideUpgradeMenu();
};

document.getElementById('upgradeDamage').onclick = () => {
  weapon.damage++;
  daggers.damage++;
  lasers.damage++;
  grenadeWeapon.damage++;
  hideUpgradeMenu();
};

document.getElementById('upgradeBulletSpeed').onclick = () => {
  weapon.bulletSpeed += 1;
  hideUpgradeMenu();
};

document.getElementById('upgradeNewWeapon').onclick = () => {
  if (!weapon.unlockedWeapons.includes('doubleShot')) {
    weapon.unlockedWeapons.push('doubleShot');
  } else if (daggers.count < 5) {
    daggers.count++;
  } else if (lasers.count < 8) {
    lasers.count++;
  } else if (grenadeWeapon.count < 5) {
    grenadeWeapon.count++;
  }
  hideUpgradeMenu();
};

// --- MOVEMENT ---

function movePlayer() {
  if (keys['w'] || keys['arrowup']) player.y -= player.speed;
  if (keys['s'] || keys['arrowdown']) player.y += player.speed;
  if (keys['a'] || keys['arrowleft']) player.x -= player.speed;
  if (keys['d'] || keys['arrowright']) player.x += player.speed;

  // Clamp inside screen
  player.x = Math.min(Math.max(player.r, player.x), W - player.r);
  player.y = Math.min(Math.max(player.r, player.y), H - player.r);
}

// --- MAIN LOOP ---

function gameLoop() {
  if (!isPaused) {
    frame++;
    ctx.clearRect(0, 0, W, H);

    movePlayer();
    moveEnemies();
    moveBullets();
    updateLaserBullets();
    updateGrenades();
    moveOrbs();

    // Spawn enemies faster as level increases
    let spawnInterval = Math.max(40, 200 - level * 15);
    if (frame % spawnInterval === 0) {
      wave++;
      spawnEnemy();
    }

    shootBullets();
    fireLasers();
    throwGrenades();

    handleCollisions();
    laserDamage();

    drawPlayer();
    drawDaggers();
    drawEnemies();
    drawBullets();
    drawLaserBeams();
    drawGrenades();
    drawOrbs();

    // Update UI
    document.getElementById('wave').textContent = `Wave: ${wave}`;
    document.getElementById('level').textContent = `Level: ${level}`;
    document.getElementById('xp').textContent = `XP: ${xp}`;
    document.getElementById('hp').textContent = `HP: ${player.hp}`;
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
