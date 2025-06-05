let gameRunning = false;
let player = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
  img: new Image()
};
player.img.src = "https://lqy3lriiybxcejon.public.blob.vercel-storage.com/6d4172ae-28f0-4e4b-89d8-466c8eab28d3/1733672555641-removebg-preview-IVzWkVo3h7bols5hn9Yln8BxJaKBAz.png?OtWs";

function gameLoop() {
  if (!gameRunning) return;

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Draw background
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw player
  const imgSize = 64;
  ctx.drawImage(player.img, player.x - imgSize / 2, player.y - imgSize / 2, imgSize, imgSize);

  requestAnimationFrame(gameLoop);
}

document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startBtn");
  const restartBtn = document.getElementById("restartBtn");

