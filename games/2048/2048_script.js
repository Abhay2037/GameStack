const gridSize = 4;
let board = [];
let score = 0;

const gameBoard = document.getElementById("game-board");
const scoreDisplay = document.getElementById("score");

// Firebase setup
const leaderboardRef = firebase.database().ref("leaderboard_2048");

// Initialize game
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
                cell.style.background = getTileColor(board[r][c]);
            }
            gameBoard.appendChild(cell);
        }
    }
    scoreDisplay.textContent = score;
}

function getTileColor(value) {
    const colors = {
        2: "#eee4da",
        4: "#ede0c8",
        8: "#f2b179",
        16: "#f59563",
        32: "#f67c5f",
        64: "#f65e3b",
        128: "#edcf72",
        256: "#edcc61",
        512: "#edc850",
        1024: "#edc53f",
        2048: "#edc22e"
    };
    return colors[value] || "#3c3a32";
}

function slide(row) {
    let arr = row.filter(val => val !== 0);
    for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] === arr[i + 1]) {
            arr[i] *= 2;
            score += arr[i];
            arr[i + 1] = 0;
        }
    }
    arr = arr.filter(val => val !== 0);
    while (arr.length < gridSize) {
        arr.push(0);
    }
    return arr;
}

function moveLeft() {
    let moved = false;
    for (let r = 0; r < gridSize; r++) {
        let newRow = slide(board[r]);
        if (board[r].toString() !== newRow.toString()) moved = true;
        board[r] = newRow;
    }
    return moved;
}

function moveRight() {
    let moved = false;
    for (let r = 0; r < gridSize; r++) {
        let row = board[r].slice().reverse();
        let newRow = slide(row).reverse();
        if (board[r].toString() !== newRow.toString()) moved = true;
        board[r] = newRow;
    }
    return moved;
}

function moveUp() {
    let moved = false;
    for (let c = 0; c < gridSize; c++) {
        let col = [];
        for (let r = 0; r < gridSize; r++) col.push(board[r][c]);
        let newCol = slide(col);
        for (let r = 0; r < gridSize; r++) {
            if (board[r][c] !== newCol[r]) moved = true;
            board[r][c] = newCol[r];
        }
    }
    return moved;
}

function moveDown() {
    let moved = false;
    for (let c = 0; c < gridSize; c++) {
        let col = [];
        for (let r = 0; r < gridSize; r++) col.push(board[r][c]);
        let newCol = slide(col.reverse()).reverse();
        for (let r = 0; r < gridSize; r++) {
            if (board[r][c] !== newCol[r]) moved = true;
            board[r][c] = newCol[r];
        }
    }
    return moved;
}

function handleMove(direction) {
    let moved = false;
    if (direction === "left") moved = moveLeft();
    if (direction === "right") moved = moveRight();
    if (direction === "up") moved = moveUp();
    if (direction === "down") moved = moveDown();

    if (moved) {
        addNewTile();
        updateBoard();
        if (isGameOver()) {
            alert("Game Over!");
        }
    }
}

function getHighestTile() {
    let highest = 0;
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            if (board[r][c] > highest) highest = board[r][c];
        }
    }
    return highest;
}

function isGameOver() {
    // Check if no moves are possible
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            if (board[r][c] === 0) return false;
            if (c < gridSize - 1 && board[r][c] === board[r][c + 1]) return false;
            if (r < gridSize - 1 && board[r][c] === board[r + 1][c]) return false;
        }
    }
    const highestTile = getHighestTile();
    saveScoreToFirebase(score, highestTile);
    loadLeaderboard();
    return true;
}

// ------------------- Leaderboard Functions -------------------

function saveScoreToFirebase(score, highestTile) {
    let playerName = prompt("Enter your name:") || "";
    if (playerName.trim() === "") {
        playerName = "Anonymous" + Math.floor(1000 + Math.random() * 9000);
    }

    leaderboardRef.push({
        name: playerName,
        score: score,
        highestTile: highestTile,
        timestamp: Date.now()
    });
}

function loadLeaderboard() {
    leaderboardRef.once("value", snapshot => {
        const data = [];
        snapshot.forEach(childSnapshot => {
            data.push(childSnapshot.val());
        });

        data.sort((a, b) => {
            if (b.highestTile === a.highestTile) {
                return b.score - a.score;
            }
            return b.highestTile - a.highestTile;
        });

        const leaderboardEl = document.getElementById("leaderboard-entries");
        leaderboardEl.innerHTML = "";
        data.slice(0, 10).forEach((entry, index) => {
            leaderboardEl.innerHTML += `
                <p>${index + 1}. ${entry.name} - Tile: ${entry.highestTile} | Score: ${entry.score}</p>
            `;
        });
    });
}

// ------------------- Event Listeners -------------------

document.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") handleMove("left");
    if (e.key === "ArrowRight") handleMove("right");
    if (e.key === "ArrowUp") handleMove("up");
    if (e.key === "ArrowDown") handleMove("down");
});

document.getElementById("new-game-btn").addEventListener("click", () => {
    initGame();
});

// Init
initGame();
loadLeaderboard();
