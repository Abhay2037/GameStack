const gridSize = 4;
let board = [];
let score = 0;

const gameBoard = document.getElementById("game-board");
const scoreDisplay = document.getElementById("score");
const newGameBtn = document.getElementById("new-game-btn");

// --- Main Game Logic ---

function handleKeyPress(e) {
    if (e.key === "ArrowLeft") handleMove("left");
    if (e.key === "ArrowRight") handleMove("right");
    if (e.key === "ArrowUp") handleMove("up");
    if (e.key === "ArrowDown") handleMove("down");
}

function initGame() {
    board = Array(gridSize).fill().map(() => Array(gridSize).fill(0));
    score = 0;
    addNewTile();
    addNewTile();
    updateBoard();
}

function addNewTile() {
    let emptyCells = [];
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            if (board[r][c] === 0) {
                emptyCells.push({ r, c });
            }
        }
    }
    if (emptyCells.length > 0) {
        let { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        board[r][c] = Math.random() < 0.9 ? 2 : 4;
    }
}

function updateBoard() {
    gameBoard.innerHTML = "";
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            if (board[r][c] !== 0) {
                cell.textContent = board[r][c];
                cell.setAttribute('data-value', board[r][c]);
            }
            gameBoard.appendChild(cell);
        }
    }
    scoreDisplay.textContent = score;
}

function slide(row) {
    let arr = row.filter(val => val);
    for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] === arr[i + 1]) {
            arr[i] *= 2;
            score += arr[i];
            arr[i + 1] = 0;
        }
    }
    arr = arr.filter(val => val);
    while (arr.length < gridSize) {
        arr.push(0);
    }
    return arr;
}

function move(direction) {
    let boardBefore = JSON.stringify(board);
    if (direction === "left") {
        for (let r = 0; r < gridSize; r++) board[r] = slide(board[r]);
    } else if (direction === "right") {
        for (let r = 0; r < gridSize; r++) board[r] = slide(board[r].reverse()).reverse();
    } else if (direction === "up") {
        for (let c = 0; c < gridSize; c++) {
            let col = [board[0][c], board[1][c], board[2][c], board[3][c]];
            let newCol = slide(col);
            for (let r = 0; r < gridSize; r++) board[r][c] = newCol[r];
        }
    } else if (direction === "down") {
        for (let c = 0; c < gridSize; c++) {
            let col = [board[0][c], board[1][c], board[2][c], board[3][c]];
            let newCol = slide(col.reverse()).reverse();
            for (let r = 0; r < gridSize; r++) board[r][c] = newCol[r];
        }
    }
    return JSON.stringify(board) !== boardBefore;
}

function handleMove(direction) {
    if (move(direction)) {
        addNewTile();
        updateBoard();
        if (isGameOver()) {
            setTimeout(() => {
                alert("Game Over!");
            }, 500);
        }
    }
}

function isGameOver() {
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            if (board[r][c] === 0) return false;
            if (c < gridSize - 1 && board[r][c] === board[r][c + 1]) return false;
            if (r < gridSize - 1 && board[r][c] === board[r + 1][c]) return false;
        }
    }
    return true;
}

// --- Initialization ---
document.addEventListener("keydown", handleKeyPress);
newGameBtn.addEventListener("click", initGame);
initGame();