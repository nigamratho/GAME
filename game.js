let score = 0;
let timeLeft = 30;
let gameRunning = false;
let timerInterval;

const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const target = document.getElementById("target");
const gameArea = document.getElementById("gameArea");
const startBtn = document.getElementById("startBtn");

document.getElementById("year").textContent = new Date().getFullYear();

function randomPosition() {
  const areaRect = gameArea.getBoundingClientRect();
  const maxX = areaRect.width - 60;
  const maxY = areaRect.height - 60;

  const x = Math.random() * maxX;
  const y = Math.random() * maxY;

  target.style.left = x + "px";
  target.style.top = y + "px";
}

target.addEventListener("click", () => {
  if (!gameRunning) return;
  score++;
  scoreEl.textContent = score;
  randomPosition();
});

startBtn.addEventListener("click", () => {
  if (gameRunning) return;

  score = 0;
  timeLeft = 30;
  scoreEl.textContent = score;
  timeEl.textContent = timeLeft;

  gameRunning = true;
  target.style.display = "block";
  randomPosition();

  timerInterval = setInterval(() => {
    timeLeft--;
    timeEl.textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      gameRunning = false;
      target.style.display = "none";
      alert("Game Over! Your score: " + score);
    }
  }, 1000);
});
