// Memory Match Game Logic
const symbols = ['🎮', '🎯', '🎨', '🎭', '🎪', '🎸', '🎺', '🎹'];
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let gameActive = false;
let isPaused = false;
let canFlip = true;

const movesDisplay = document.getElementById('moves');
const matchesDisplay = document.getElementById('matches');
const statusDisplay = document.getElementById('status');
const startBtn = document.getElementById('startBtn');
const cardsContainer = document.getElementById('cardsContainer');

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

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function createCards() {
    // Create pairs
    const cardSymbols = [...symbols, ...symbols];
    cards = shuffleArray(cardSymbols);
    
    // Clear container
    cardsContainer.innerHTML = '';
    
    // Create card elements
    cards.forEach((symbol, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.index = index;
        card.dataset.symbol = symbol;
        
        card.innerHTML = `
            <div class="card-front"></div>
            <div class="card-back">${symbol}</div>
        `;
        
        card.addEventListener('click', () => flipCard(card));
        cardsContainer.appendChild(card);
    });
}

function startGame() {
    moves = 0;
    matchedPairs = 0;
    flippedCards = [];
    gameActive = true;
    isPaused = false;
    canFlip = true;
    
    movesDisplay.textContent = moves;
    matchesDisplay.textContent = `0/${symbols.length}`;
    statusDisplay.textContent = 'Find all matching pairs!';
    startBtn.disabled = true;
    
    createCards();
}

function flipCard(card) {
    if (!gameActive || isPaused || !canFlip) return;
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
    if (flippedCards.length >= 2) return;
    
    card.classList.add('flipped');
    flippedCards.push(card);
    
    if (flippedCards.length === 2) {
        moves++;
        movesDisplay.textContent = moves;
        canFlip = false;
        
        setTimeout(checkMatch, 800);
    }
}

function checkMatch() {
    const [card1, card2] = flippedCards;
    const symbol1 = card1.dataset.symbol;
    const symbol2 = card2.dataset.symbol;
    
    if (symbol1 === symbol2) {
        // Match found
        card1.classList.add('matched');
        card2.classList.add('matched');
        matchedPairs++;
        matchesDisplay.textContent = `${matchedPairs}/${symbols.length}`;
        
        if (matchedPairs === symbols.length) {
            endGame();
        }
    } else {
        // No match
        card1.classList.remove('flipped');
        card2.classList.remove('flipped');
    }
    
    flippedCards = [];
    canFlip = true;
}

function pauseGame() {
    isPaused = true;
    statusDisplay.textContent = 'Game Paused';
}

function resumeGame() {
    if (!gameActive) return;
    isPaused = false;
    statusDisplay.textContent = 'Find all matching pairs!';
}

function endGame() {
    gameActive = false;
    statusDisplay.textContent = `You Won! Moves: ${moves}`;
    startBtn.disabled = false;
    
    // Calculate score (fewer moves = higher score)
    // Perfect game is 8 moves (one try per pair)
    // Score: 200 - (moves - 8) * 10, minimum 10
    const score = Math.max(200 - (moves - 8) * 10, 10);
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
startBtn.addEventListener('click', startGame);

// Notify platform game is ready
window.parent.postMessage({
    type: 'GAME_READY'
}, window.location.origin);
