// References to UI elements
const upgradeMenu = document.getElementById('upgradeMenu');
const upgradeChoices = document.getElementById('upgradeChoices');
const rerollBtn = document.getElementById('rerollBtn');

// Player state
player.daggers = 0;
player.lasers = 0;
player.grenadeDamage = 0;
player.attackRange = 150;
let laserCooldown = 0;
const laserFireInterval = 90;

const upgradePool = [
  {
    id: 'range',
    name: 'Increase Attack Range',
    apply: () => { player.attackRange += 20; },
    desc: 'Expand the auto-attack radius.'
  },
  {
    id: 'dagger',
    name: 'Add Dagger',
    apply: () => { player.daggers += 1; },
    desc: 'Adds a dagger circling around the player.'
  },
  {
    id: 'laser',
    name: 'Add Laser',
    apply: () => { player.lasers += 1; },
    desc: 'Adds a laser shooting straight lines with cooldown.'
  },
  {
    id: 'grenade',
    name: 'Increase Grenade Damage',
    apply: () => { player.grenadeDamage += 10; },
    desc: 'Grenades explode dealing more AOE damage.'
  }
];

function showUpgradeMenu() {
  upgradeMenu.classList.remove('hidden');
  upgradeChoices.innerHTML = '';
  const choices = [];
  while (choices.length < 3) {
    const option = upgradePool[Math.floor(Math.random() * upgradePool.length)];
    if (!choices.find(c => c.id === option.id)) choices.push(option);
  }
  choices.forEach(opt => {
    const btn = document.createElement('button');
    btn.classList.add('upgradeOption');
    btn.textContent = opt.name;
    btn.title = opt.desc;
    btn.onclick = () => {
      opt.apply();
      hideUpgradeMenu();
      resumeGame();
    };
    upgradeChoices.appendChild(btn);
  });
}

function hideUpgradeMenu() {
  upgradeMenu.classList.add('hidden');
}

let paused = false;
function pauseGame() {
  paused = true;
}
function resumeGame() {
  paused = false;
  requestAnimationFrame(gameLoop);
}

function checkLevelUp() {
  if (player.xp >= player.level * 5) {
    player.level++;
    player.xp = 0;
    pauseGame();
    showUpgradeMenu();
  }
}

function update() {
  // Enemy logic, player movement etc.
  checkLevelUp();
  if (laserCooldown > 0) laserCooldown--;
  // Other updates...
}

function drawDaggers() {
  const daggerCount = player.daggers;
  for (let i = 0; i < daggerCount; i++) {
    const angle = (performance.now() / 1000) * 2 + (i * (Math.PI * 2 / daggerCount));
    const radius = 60;
    const x = player.x + Math.cos(angle) * radius;
    const y = player.y + Math.sin(angle) * radius;
    ctx.beginPath();
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 10;
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    enemies.forEach(enemy => {
      const dx = enemy.x - x;
      const dy = enemy.y - y;
      const dist = Math.hypot(dx, dy);
      if (dist < 20) enemy.hp -= 0.1;
    });
  }
}

function fireLasers() {
  if (player.lasers === 0 || laserCooldown > 0) return;
  laserCooldown = laserFireInterval;
  for (let i = 0; i < player.lasers; i++) {
    const spread = Math.PI;
    const startAngle = -spread / 2;
    const angle = startAngle + (spread / (player.lasers - 1 || 1)) * i;
    ctx.beginPath();
    ctx.strokeStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 15;
    ctx.lineWidth = 3;
    const length = player.attackRange + 50;
    const endX = player.x + Math.cos(angle) * length;
    const endY = player.y + Math.sin(angle) * length;
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.shadowBlur = 0;
    enemies.forEach(enemy => {
      const distToLaser = Math.abs((endY - player.y) * enemy.x - (endX - player.x) * enemy.y + endX * player.y - endY * player.x) / length;
      const dot = (enemy.x - player.x) * Math.cos(angle) + (enemy.y - player.y) * Math.sin(angle);
      if (distToLaser < 20 && dot > 0 && dot < length) enemy.hp -= 0.5;
    });
  }
}

function grenadeDamageAOE() {
  if (player.grenadeDamage === 0) return;
  enemies.forEach(enemy => {
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist < player.attackRange / 2) enemy.hp -= player.grenadeDamage * 0.01;
  });
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.attackRange, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(0, 255, 255, 0.2)";
  ctx.stroke();
  ctx.drawImage(shooterImg, player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);
  enemies.forEach(enemy => {
    ctx.drawImage(enemyImg, enemy.x - 25, enemy.y - 25, 50, 50);
  });
  drawDaggers();
  fireLasers();
  grenadeDamageAOE();
  document.getElementById("level").textContent = `Level: ${player.level}`;
  document.getElementById("xp").textContent = `XP: ${player.xp}`;
  document.getElementById("hp").textContent = `HP: ${player.hp}`;
}

function gameLoop() {
  if (!gameRunning || paused) return;
  update();
  draw();
  if (player.hp <= 0) {
    gameRunning = false;
    document.getElementById("gameOverScreen").classList.remove("hidden");
    document.getElementById("finalScore").textContent = `Level Reached: ${player.level}`;
    return;
  }
  requestAnimationFrame(gameLoop);
}
