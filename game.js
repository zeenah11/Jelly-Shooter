// Sample structure of game.js including button event handlers
let gameRunning = false;

function gameLoop() {
  if (!gameRunning) return;
  // main game loop logic here
  requestAnimationFrame(gameLoop);
}

function showLevelUpMenu() {
  document.getElementById("levelUpMenu").classList.remove("hidden");
  const options = document.getElementById("upgradeOptions");
  options.innerHTML = "";

  const upgrades = [
    "Increase Range",
    "Add Dagger",
    "Add Laser",
    "Upgrade Grenade"
  ];

  upgrades.forEach(upgrade => {
    const btn = document.createElement("button");
    btn.textContent = upgrade;
    btn.onclick = () => {
      document.getElementById("levelUpMenu").classList.add("hidden");
      // handle upgrade effect logic here
    };
    options.appendChild(btn);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startBtn");
  const restartBtn = document.getElementById("restartBtn");

  startBtn.addEventListener("click", () => {
    document.getElementById("titleScreen").classList.add("hidden");
    gameRunning = true;
    gameLoop();
  });

  if (restartBtn) {
    restartBtn.addEventListener("click", () => {
      location.reload();
    });
  }
});
