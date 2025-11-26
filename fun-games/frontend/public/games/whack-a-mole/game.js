// Whack-a-Mole Game Logic
let score = 0;
let timeLeft = 30;
let gameActive = false;
let isPaused = false;
let moleTimer = null;
let countdownTimer = null;
let currentMole = null;

const scoreDisplay = document.getElementById('score');
const timeDisplay = document.getElementById('time');
const statusDisplay = document.getElementById('status');
const startBtn = document.getElementById('startBtn');
const holes = document.querySelectorAll('.hole');
const moles = document.querySelectorAll('.mole');

// Listen for platform events
window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin) return;
    
    if (event.data.type === 'PLATFORM_READY') {
        console.log('Platform ready');
    }
    if (event.data.type === 'PAUSE_GAME') {
        pauseGame();
    }
    if (event.data.type === 'RESUME_GAME') {
        resumeGame();
    }
});

function startGame() {
    score = 0;
    timeLeft = 30;
    gameActive = true;
    isPaused = false;
    
    scoreDisplay.textContent = score;
    timeDisplay.textContent = timeLeft;
    statusDisplay.textContent = 'Whack the moles!';
    startBtn.disabled = true;
    
    // Start countdown
    countdownTimer = setInterval(updateTimer, 1000);
    
    // Start spawning moles
    spawnMole();
}

function updateTimer() {
    if (isPaused) return;
    
    timeLeft--;
    timeDisplay.textContent = timeLeft;
    
    if (timeLeft <= 0) {
        endGame();
    }
}

function spawnMole() {
    if (!gameActive || isPaused) return;
    
    // Hide current mole
    if (currentMole) {
        currentMole.classList.remove('up');
    }
    
    // Random hole
    const randomHole = Math.floor(Math.random() * holes.length);
    currentMole = moles[randomHole];
    currentMole.classList.add('up');
    
    // Random time before next mole (500ms to 1500ms)
    const nextMoleTime = Math.random() * 1000 + 500;
    moleTimer = setTimeout(spawnMole, nextMoleTime);
}

function whackMole(event) {
    if (!gameActive || isPaused) return;
    
    const mole = event.target;
    if (mole.classList.contains('up') && !mole.classList.contains('whacked')) {
        score++;
        scoreDisplay.textContent = score;
        mole.classList.add('whacked');
        mole.classList.remove('up');
        
        setTimeout(() => {
            mole.classList.remove('whacked');
        }, 300);
    }
}

function pauseGame() {
    isPaused = true;
    statusDisplay.textContent = 'Game Paused';
}

function resumeGame() {
    if (!gameActive) return;
    isPaused = false;
    statusDisplay.textContent = 'Whack the moles!';
}

function endGame() {
    gameActive = false;
    clearInterval(countdownTimer);
    clearTimeout(moleTimer);
    
    if (currentMole) {
        currentMole.classList.remove('up');
    }
    
    statusDisplay.textContent = `Game Over! Final Score: ${score}`;
    startBtn.disabled = false;
    
    // Submit score
    submitScore(score);
}

function submitScore(finalScore) {
    window.parent.postMessage({
        type: 'GAME_SCORE',
        score: finalScore,
        timestamp: Date.now()
    }, window.location.origin);
}

// Event listeners
moles.forEach(mole => mole.addEventListener('click', whackMole));
startBtn.addEventListener('click', startGame);

// Notify platform game is ready
window.parent.postMessage({
    type: 'GAME_READY'
}, window.location.origin);
