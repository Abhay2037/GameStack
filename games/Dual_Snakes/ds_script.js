const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// DOM Elements
const score1Display = document.getElementById('score1');
const score2Display = document.getElementById('score2');
const messageDisplay = document.getElementById('message');
const mainMenu = document.getElementById('mainMenu');
const gameContainer = document.getElementById('gameContainer');
const countdownOverlay = document.getElementById('countdownOverlay');
const countdownTimer = document.getElementById('countdownTimer');

// Menu Buttons
const easyBtn = document.getElementById('easyBtn');
const mediumBtn = document.getElementById('mediumBtn');
const hardBtn = document.getElementById('hardBtn');
const dualPlayerBtn = document.getElementById('dualPlayerBtn');

const GRID_SIZE = 20;
const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;

// Game State
let snake1, snake2, orb, gameInterval, gameMode, gameSpeed;

// --- Menu Controls ---
easyBtn.addEventListener('click', () => preGameStart('single', 120));
mediumBtn.addEventListener('click', () => preGameStart('single', 90));
hardBtn.addEventListener('click', () => preGameStart('single', 60));
dualPlayerBtn.addEventListener('click', () => preGameStart('dual', 90));

function preGameStart(mode, speed) {
    gameMode = mode;
    gameSpeed = speed;
    mainMenu.style.display = 'none';
    gameContainer.style.display = 'flex';
    messageDisplay.textContent = '';
    
    clearCanvas();
    
    let count = 3;
    countdownTimer.textContent = count;
    countdownOverlay.classList.remove('hidden');

    const countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownTimer.textContent = count;
        } else {
            clearInterval(countdownInterval);
            countdownTimer.textContent = 'Go!';
            setTimeout(() => {
                countdownOverlay.classList.add('hidden');
                init();
            }, 500);
        }
    }, 1000);
}


function init() {
    snake1 = { body: [{ x: 5 * GRID_SIZE, y: 5 * GRID_SIZE }], dx: GRID_SIZE, dy: 0, color: '#4CAF50', score: 0 };
    snake2 = { body: [{ x: 25 * GRID_SIZE, y: 25 * GRID_SIZE }], dx: -GRID_SIZE, dy: 0, color: '#2196F3', score: 0 };
    
    score1Display.textContent = 0;
    score2Display.textContent = 0;

    generateOrb();

    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(update, gameSpeed);
}

function update() {
    clearCanvas();
    moveSnake(snake1);
    if (gameMode === 'dual') {
        moveSnake(snake2);
    } else {
        moveAISnake();
        moveSnake(snake2);
    }

    if (checkCollisions()) {
        clearInterval(gameInterval);
        return;
    }
    drawOrb();
    drawSnake(snake1);
    drawSnake(snake2);
}

function clearCanvas() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawSnake(snake) {
    ctx.fillStyle = snake.color;
    snake.body.forEach(segment => ctx.fillRect(segment.x, segment.y, GRID_SIZE, GRID_SIZE));
}

function drawOrb() {
    ctx.fillStyle = '#FFC107';
    ctx.fillRect(orb.x, orb.y, GRID_SIZE, GRID_SIZE);
}

function moveSnake(snake) {
    const head = { x: snake.body[0].x + snake.dx, y: snake.body[0].y + snake.dy };
    snake.body.unshift(head);
    if (head.x === orb.x && head.y === orb.y) {
        snake.score++;
        (snake === snake1 ? score1Display : score2Display).textContent = snake.score;
        generateOrb();
    } else {
        snake.body.pop();
    }
}

function generateOrb() {
    orb = {
        x: Math.floor(Math.random() * (CANVAS_WIDTH / GRID_SIZE)) * GRID_SIZE,
        y: Math.floor(Math.random() * (CANVAS_HEIGHT / GRID_SIZE)) * GRID_SIZE
    };
    if (isPositionOnSnake(orb, snake1) || (snake2 && isPositionOnSnake(orb, snake2))) {
        generateOrb();
    }
}

function isPositionOnSnake(position, snake) {
    return snake.body.some(segment => segment.x === position.x && segment.y === position.y);
}

function moveAISnake() {
    const head = snake2.body[0];
    const diffX = orb.x - head.x;
    const diffY = orb.y - head.y;
    let possibleMoves = [];

    // Determine primary and secondary moves toward the orb
    if (Math.abs(diffX) > Math.abs(diffY)) {
        possibleMoves.push(diffX > 0 ? 'right' : 'left');
        possibleMoves.push(diffY > 0 ? 'down' : 'up');
    } else {
        possibleMoves.push(diffY > 0 ? 'down' : 'up');
        possibleMoves.push(diffX > 0 ? 'right' : 'left');
    }
    
    // Hard AI tries to find a safe move
    if (gameSpeed <= 60) {
        for (const move of possibleMoves) {
            const { dx, dy } = getDirection(move);
            if (isMoveSafe(snake2, dx, dy)) {
                snake2.dx = dx; snake2.dy = dy;
                return;
            }
        }
        // If preferred moves are unsafe, try any move that is safe
        const allMoves = ['up', 'down', 'left', 'right'];
        for(const move of allMoves) {
            const { dx, dy } = getDirection(move);
            if(isMoveSafe(snake2, dx, dy)) {
                snake2.dx = dx; snake2.dy = dy;
                return;
            }
        }
    }
    
    // Easy/Medium AI uses simpler logic (no safety check)
    const primaryMove = getDirection(possibleMoves[0]);
    if (snake2.dx !== -primaryMove.dx && snake2.dy !== -primaryMove.dy) {
        snake2.dx = primaryMove.dx;
        snake2.dy = primaryMove.dy;
    }
}

function getDirection(move) {
    if (move === 'right') return { dx: GRID_SIZE, dy: 0 };
    if (move === 'left') return { dx: -GRID_SIZE, dy: 0 };
    if (move === 'down') return { dx: 0, dy: GRID_SIZE };
    if (move === 'up') return { dx: 0, dy: -GRID_SIZE };
    return { dx: 0, dy: 0 };
}

// --- UPDATED: AI now checks for collisions with the player ---
function isMoveSafe(snake, dx, dy) {
    const nextHead = { x: snake.body[0].x + dx, y: snake.body[0].y + dy };

    // 1. Check wall collision
    if (nextHead.x < 0 || nextHead.x >= CANVAS_WIDTH || nextHead.y < 0 || nextHead.y >= CANVAS_HEIGHT) {
        return false;
    }
    // 2. Check self-collision
    if (isPositionOnSnake(nextHead, snake)) {
        return false;
    }
    // 3. NEW: Check player collision
    if (isPositionOnSnake(nextHead, snake1)) {
        return false;
    }

    return true;
}

function checkCollisions() {
    const p1_crashed = hasHitWall(snake1) || hasHitSelf(snake1) || hasHitOpponent(snake1, snake2);
    const p2_crashed = hasHitWall(snake2) || hasHitSelf(snake2) || hasHitOpponent(snake2, snake1);

    if (p1_crashed && p2_crashed) {
        gameOver("It's a Draw!");
        return true;
    }
    if (p1_crashed) {
        gameOver("Player 2 Wins!");
        return true;
    }
    if (p2_crashed) {
        gameOver("Player 1 Wins!");
        return true;
    }
    return false;
}

function hasHitWall(snake) {
    const head = snake.body[0];
    return head.x < 0 || head.x >= CANVAS_WIDTH || head.y < 0 || head.y >= CANVAS_HEIGHT;
}

function hasHitSelf(snake) {
    const head = snake.body[0];
    return snake.body.slice(1).some(segment => segment.x === head.x && segment.y === head.y);
}

function hasHitOpponent(snake, opponent) {
    const head = snake.body[0];
    return opponent.body.some(segment => head.x === segment.x && segment.y === segment.y);
}

function gameOver(message) {
    messageDisplay.textContent = message;
    setTimeout(() => {
        gameContainer.style.display = 'none';
        mainMenu.style.display = 'block';
    }, 2000);
}

document.addEventListener('keydown', e => {
    if (e.key === 'a' && snake1.dx === 0) { snake1.dx = -GRID_SIZE; snake1.dy = 0; }
    if (e.key === 'd' && snake1.dx === 0) { snake1.dx = GRID_SIZE; snake1.dy = 0; }
    if (e.key === 'w' && snake1.dy === 0) { snake1.dx = 0; snake1.dy = -GRID_SIZE; }
    if (e.key === 's' && snake1.dy === 0) { snake1.dx = 0; snake1.dy = GRID_SIZE; }
    if (gameMode === 'dual') {
        if (e.key === 'ArrowLeft' && snake2.dx === 0) { snake2.dx = -GRID_SIZE; snake2.dy = 0; }
        if (e.key === 'ArrowRight' && snake2.dx === 0) { snake2.dx = GRID_SIZE; snake2.dy = 0; }
        if (e.key === 'ArrowUp' && snake2.dy === 0) { snake2.dx = 0; snake2.dy = -GRID_SIZE; }
        if (e.key === 'ArrowDown' && snake2.dy === 0) { snake2.dx = 0; snake2.dy = GRID_SIZE; }
    }
});