const gridSize = 4;
let board = [];
let score = 0;
let userId = null; // Variable to store the user's ID

const gameBoard = document.getElementById("game-board");
const scoreDisplay = document.getElementById("score");
const newGameBtn = document.getElementById("new-game-btn");

// Firebase setup
const leaderboardRef = firebase.database().ref("leaderboard_2048");

// --- Main Game Logic ---

// This function will be called only after Firebase auth is successful
function setupGame() {
    // Attach event listeners now that we are ready
    document.addEventListener("keydown", handleKeyPress);
    newGameBtn.addEventListener("click", initGame);

    // Initial game start and leaderboard load
    initGame();
    loadLeaderboard();
}

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
                // Use the data-value attribute to apply styles from CSS
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
            // Use setTimeout to allow the board to update before the alert
            setTimeout(() => {
                alert("Game Over!");
                const highestTile = getHighestTile();
                saveScoreToFirebase(score, highestTile);
            }, 500);
        }
    }
}

function getHighestTile() {
    return Math.max(...board.flat());
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

// --- Leaderboard Functions ---

function saveScoreToFirebase(score, highestTile) {
    if (!userId) {
      console.error("User not authenticated, cannot save score.");
      return;
    }

    let playerName = prompt("Game Over! Enter your name for the leaderboard:") || "";
    if (playerName.trim() === "") {
        playerName = "Anonymous" + Math.floor(1000 + Math.random() * 9000);
    }

    leaderboardRef.push({
        name: playerName,
        score: score,
        highestTile: highestTile,
        timestamp: Date.now(),
        userId: userId
    }).then(() => {
        console.log("Score saved successfully!");
    }).catch(error => {
        console.error("Error saving score: ", error);
    });
}

function loadLeaderboard() {
    leaderboardRef.orderByChild("highestTile").limitToLast(10).on("value", snapshot => {
        const data = [];
        snapshot.forEach(childSnapshot => {
            data.push(childSnapshot.val());
        });

        // Sort descending: by highest tile first, then by score
        data.sort((a, b) => {
            if (b.highestTile === a.highestTile) {
                return b.score - a.score;
            }
            return b.highestTile - a.highestTile;
        });

        const leaderboardEl = document.getElementById("leaderboard-entries");
        leaderboardEl.innerHTML = ""; // Clear previous entries

        data.forEach((entry, index) => {
            // Create a new paragraph element
            const p = document.createElement("p");

            // Set its content as plain text. This is the security fix!
            p.textContent = `${index + 1}. ${entry.name} - Tile: ${entry.highestTile} | Score: ${entry.score}`;

            // Add the safe element to the page
            leaderboardEl.appendChild(p);
        });
    });
}

// --- Authentication and Initialization ---

// Authenticate the user anonymously FIRST
firebase.auth().signInAnonymously()
  .then((userCredential) => {
    userId = userCredential.user.uid;
    console.log("User authenticated with ID:", userId);
    // Now that we are authenticated, set up and start the game
    setupGame();
  })
  .catch((error) => {
    console.error("Authentication failed:", error);
    // Let the user know there was a problem
    alert("Could not connect to the leaderboard service. Please refresh the page.");
  });