let gameRunning = false;

document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startBtn");
  const restartBtn = document.getElementById("restartBtn");

  startBtn.addEventListener("click", () => {
    console.log("Start clicked");
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

function gameLoop() {
  if (!gameRunning) return;

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#0ff";
  ctx.font = "30px Arial";
  ctx.fillText("Game Running", 100, 100);

  requestAnimationFrame(gameLoop);
}
