// Tic-Tac-Toe Game Logic
let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let gameActive = true;
let isPaused = false;
let moveCount = 0;

const statusDisplay = document.getElementById('status');
const cells = document.querySelectorAll('.cell');
const resetBtn = document.getElementById('resetBtn');

const winningConditions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

// Listen for platform events
window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin) return;
    
    if (event.data.type === 'PLATFORM_READY') {
        console.log('Platform ready');
    }
    if (event.data.type === 'PAUSE_GAME') {
        isPaused = true;
        statusDisplay.textContent = 'Game Paused';
    }
    if (event.data.type === 'RESUME_GAME') {
        isPaused = false;
        updateStatus();
    }
});

function handleCellClick(event) {
    const clickedCell = event.target;
    const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));

    if (board[clickedCellIndex] !== '' || !gameActive || isPaused) {
        return;
    }

    board[clickedCellIndex] = currentPlayer;
    clickedCell.textContent = currentPlayer;
    clickedCell.classList.add('taken', currentPlayer.toLowerCase());
    moveCount++;

    checkResult();
}

function checkResult() {
    let roundWon = false;
    let winningCells = [];

    for (let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i];
        if (board[a] === '' || board[b] === '' || board[c] === '') {
            continue;
        }
        if (board[a] === board[b] && board[b] === board[c]) {
            roundWon = true;
            winningCells = [a, b, c];
            break;
        }
    }

    if (roundWon) {
        statusDisplay.textContent = `Player ${currentPlayer} Wins! 🎉`;
        gameActive = false;
        
        // Highlight winning cells
        winningCells.forEach(index => {
            cells[index].classList.add('winner');
        });
        
        // Calculate score (fewer moves = higher score)
        const score = Math.max(100 - (moveCount * 5), 10);
        submitScore(score);
        return;
    }

    if (!board.includes('')) {
        statusDisplay.textContent = "It's a Draw! 🤝";
        gameActive = false;
        submitScore(50); // Draw score
        return;
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateStatus();
}

function updateStatus() {
    if (gameActive && !isPaused) {
        statusDisplay.textContent = `Player ${currentPlayer}'s Turn`;
    }
}

function resetGame() {
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    gameActive = true;
    moveCount = 0;
    updateStatus();
    
    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('taken', 'x', 'o', 'winner');
    });
}

function submitScore(score) {
    window.parent.postMessage({
        type: 'GAME_SCORE',
        score: score,
        timestamp: Date.now()
    }, window.location.origin);
}

// Event listeners
cells.forEach(cell => cell.addEventListener('click', handleCellClick));
resetBtn.addEventListener('click', resetGame);

// Notify platform game is ready
window.parent.postMessage({
    type: 'GAME_READY'
}, window.location.origin);
