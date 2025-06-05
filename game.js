// Jelly Shooter core game logic with custom images and enhanced features

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Load images
const shooterImg = new Image();
shooterImg.src = "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/6d4172ae-28f0-4e4b-89d8-466c8eab28d3/1733672555641-removebg-preview-IVzWkVo3h7bols5hn9Yln8BxJaKBAz.png?OtWs";

const enemyImg = new Image();
enemyImg.src = "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/6d4172ae-28f0-4e4b-89d8-466c8eab28d3/Untitled__2_-removebg-preview-0avObS1jpR6Pz2aPQ1kcdSh3zdqto4.png?jumD";

let gameRunning = false;

// Player
const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  width: 60,
  height: 60,
  hp: 100,
  speed: 3,
  attackRange: 150,
  xp: 0,
  level: 1,
};

// Enemies
const enemies = [];
let enemySpawnTimer = 0;

function spawnEnemy() {
  const size = 50;
  const edge = Math.floor(Math.random() * 4);
  let x, y;
  if (edge === 0) {
    x = Math.random() * canvas.width;
    y = -size;
  } else if (edge === 1) {
    x = canvas.width + size;
    y = Math.random() * canvas.height;
  } else if (edge === 2) {
    x = Math.random() * canvas.width;
    y = canvas.height + size;
  } else {
    x = -size;
    y = Math.random() * canvas.height;
  }
  enemies.push({ x, y, hp: 1, speed: 1.5 });
}

function update() {
  // Move enemies
  enemies.forEach((enemy, i) => {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 30) {
      player.hp -= 1;
    } else {
      enemy.x += (dx / dist) * enemy.speed;
      enemy.y += (dy / dist) * enemy.speed;
    }
  });

  // Remove dead enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (enemies[i].hp <= 0) {
      enemies.splice(i, 1);
      player.xp++;
    }
  }

  if (player.xp >= player.level * 5) {
    player.level++;
    player.attackRange += 10;
    player.xp = 0;
  }

  // Spawn enemies
  enemySpawnTimer++;
  if (enemySpawnTimer > 60) {
    spawnEnemy();
    enemySpawnTimer = 0;
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw attack range
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.attackRange, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(0, 255, 255, 0.2)";
  ctx.stroke();

  // Draw player
  ctx.drawImage(shooterImg, player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);

  // Draw enemies
  enemies.forEach(enemy => {
    ctx.drawImage(enemyImg, enemy.x - 25, enemy.y - 25, 50, 50);
  });

  // HUD
  document.getElementById("level").textContent = `Level: ${player.level}`;
  document.getElementById("xp").textContent = `XP: ${player.xp}`;
  document.getElementById("hp").textContent = `HP: ${player.hp}`;
}

function gameLoop() {
  if (!gameRunning) return;

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

// UI controls
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");

startBtn.onclick = () => {
  document.getElementById("titleScreen").classList.add("hidden");
  gameRunning = true;
  gameLoop();
};

restartBtn.onclick = () => {
  location.reload();
};
