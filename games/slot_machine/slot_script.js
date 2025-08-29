// --- DOM Elements ---
const spinButton = document.getElementById("spin");
const depositButton = document.getElementById("deposit");
const withdrawButton = document.getElementById("withdraw");
const rulesBtn = document.getElementById("rulesBtn");
const rulesModal = document.getElementById("rulesModal");
const closeModalBtn = document.querySelector(".close-btn");
const allInBtn = document.getElementById("allInBtn"); // New button element
const betInput = document.getElementById("betAmount");

const totalSpins = document.getElementById("totalSpins");
const jackpots = document.getElementById("jackpots");
const balanceDisplay = document.getElementById("balance");
const winningsDisplay = document.getElementById("totalWinnings");
const message = document.getElementById("message");

const columns = [
  document.getElementById("col1"),
  document.getElementById("col2"),
  document.getElementById("col3")
];

// --- Unique Reel Strips for realistic odds ---
const reel1 = ["🍒", "🍋", "🍇", "🍒", "🍋", "🍉", "🍒", "🍋", "🍓", "🍒", "🍋", "🍇", "7️⃣", "🍒", "🍋", "🍋", "🍒", "🍋", "💰", "🍒"];
const reel2 = ["🍋", "🍇", "🍒", "🍋", "🍓", "🍋", "🍒", "🍇", "🍉", "🍋", "🍒", "7️⃣", "🍋", "🍇", "🍒", "🍋", "💎", "🍋", "🍒", "🍇"];
const reel3 = ["🍇", "🍒", "🍋", "🍇", "🍒", "🍉", "🍇", "🍒", "🍋", "🍓", "🍇", "🍒", "🍋", "🍋", "7️⃣", "🍇", "🍒", "🍋", "🍇", "🍒"];
const allReels = [reel1, reel2, reel3];

const payTable = {
    "💰": { 3: 50, 2: 10 },
    "7️⃣": { 3: 20, 2: 5 },
    "🍓": { 3: 15 },
    "🍉": { 3: 10 },
    "🍒": { 2: 2 }
};

const paylines = [
    [ [0, 0], [1, 0], [2, 0] ], // Top row
    [ [0, 1], [1, 1], [2, 1] ], // Middle row
    [ [0, 2], [1, 2], [2, 2] ]  // Bottom row
];

// --- Game State ---
const startingBalance = 10000;
let balance = startingBalance;
let depositCount = 0;
let spinsDone = 0;
const maxSpins = 30;

// --- Rulebook Modal Logic ---
rulesBtn.onclick = () => rulesModal.style.display = "block";
closeModalBtn.onclick = () => rulesModal.style.display = "none";
window.onclick = (event) => {
    if (event.target == rulesModal) {
        rulesModal.style.display = "none";
    }
}

// --- NEW: All-In Button Logic ---
allInBtn.addEventListener("click", () => {
    betInput.value = balance; // Set bet amount to current balance
    spinButton.click(); // Programmatically click the spin button
});


// --- Core Game Functions ---
function createReelSymbol(symbol) {
  const div = document.createElement("div");
  div.className = "reel";
  div.textContent = symbol;
  return div;
}

function generateRandomSymbol(reelIndex) {
    const currentReel = allReels[reelIndex];
    return currentReel[Math.floor(Math.random() * currentReel.length)];
}

function spinColumn(column, finalSymbols, reelIndex) {
  return new Promise((resolve) => {
    let spins = 0;
    const interval = setInterval(() => {
      column.innerHTML = '';
      for (let i = 0; i < 3; i++) {
        column.appendChild(createReelSymbol(generateRandomSymbol(reelIndex)));
      }
      column.childNodes.forEach(reel => reel.style.animation = "roll 0.3s ease-in-out");
      spins++;
      if (spins >= 15) {
        clearInterval(interval);
        column.innerHTML = '';
        finalSymbols.forEach(sym => column.appendChild(createReelSymbol(sym)));
        resolve();
      }
    }, 100 + reelIndex * 20);
  });
}

function updateStats() {
  balanceDisplay.textContent = Math.floor(balance);
  winningsDisplay.textContent = Math.floor(balance - startingBalance);
  totalSpins.textContent = spinsDone;
}

function calculateWinnings(grid, bet) {
    let totalPrize = 0;
    let winMessages = [];

    let scatterCount = grid.flat().filter(s => s === '💰').length;
    if (payTable['💰'][scatterCount]) {
        const prize = bet * payTable['💰'][scatterCount];
        totalPrize += prize;
        winMessages.push(`Scatter Win! +$${prize.toFixed(0)}`);
    }

    for (const line of paylines) {
        const symbolsOnLine = line.map(([col, row]) => grid[col][row]);
        const prize = checkLineWin(symbolsOnLine, bet);
        if (prize > 0) {
            totalPrize += prize;
            if (winMessages.length < 2) {
                winMessages.push(`Line Win! +$${prize.toFixed(0)}`);
            }
        }
    }
    
    return { amount: totalPrize, message: winMessages.join(' | ') };
}

function checkLineWin(line, bet) {
    let effectiveLine = [...line];
    let wilds = effectiveLine.filter(s => s === '💎').length;
    let nonWilds = effectiveLine.filter(s => s !== '💎' && s !== '💰');

    if (wilds > 0 && nonWilds.length > 0) {
        const symbolToMatch = nonWilds[0];
        effectiveLine = effectiveLine.map(s => s === '💎' ? symbolToMatch : s);
    }
    
    const counts = {};
    effectiveLine.forEach(s => counts[s] = (counts[s] || 0) + 1);

    for (const symbol in counts) {
        const count = counts[symbol];
        if (payTable[symbol] && payTable[symbol][count]) {
            return bet * payTable[symbol][count];
        }
    }
    
    return 0;
}

spinButton.addEventListener("click", async () => {
  let betAmount = parseInt(betInput.value);

  if (isNaN(betAmount) || betAmount < 200) {
    message.textContent = "Minimum bet is $200!";
    return;
  }
  
  if (spinsDone >= maxSpins) {
    message.textContent = "No more spins left!";
    return;
  }
  if (balance < betAmount) {
    message.textContent = "Insufficient balance to spin!";
    return;
  }

  spinButton.disabled = true;
  allInBtn.disabled = true;
  message.textContent = "Spinning...";
  balance -= betAmount;
  spinsDone++;
  updateStats();

  const results = [
      Array.from({ length: 3 }, () => generateRandomSymbol(0)),
      Array.from({ length: 3 }, () => generateRandomSymbol(1)),
      Array.from({ length: 3 }, () => generateRandomSymbol(2))
  ];

  await Promise.all([
    spinColumn(columns[0], results[0], 0),
    spinColumn(columns[1], results[1], 1),
    spinColumn(columns[2], results[2], 2)
  ]);

  const winResult = calculateWinnings(results, betAmount);

  if (winResult.amount > 0) {
      if (winResult.message) {
          message.textContent = winResult.message;
      } else {
          message.textContent = `You Won +$${winResult.amount.toFixed(0)}`;
      }
      balance += winResult.amount;
      if (checkLineWin(results.map(col => col[1]), betAmount) >= betAmount * 20) {
          jackpots.textContent = parseInt(jackpots.textContent) + 1;
      }
  } else {
      message.textContent = "Try Again!";
  }

  updateStats();

  if (spinsDone >= maxSpins || balance < 200) {
    const score = Math.min((balance / 1000) * 10, 10);
    message.textContent += ` Game Over! Score: ${score.toFixed(1)}/10`;
    spinButton.disabled = true;
    allInBtn.disabled = true;
  } else {
    spinButton.disabled = false;
    allInBtn.disabled = false;
  }
});

depositButton.addEventListener("click", () => {
  if (depositCount >= 3) {
    message.textContent = "No more deposits allowed.";
    return;
  }
  balance += 1000;
  depositCount++;
  message.textContent = `Deposited $1000. (${3 - depositCount} deposits left)`;
  updateStats();
});

withdrawButton.addEventListener("click", () => {
  if (spinsDone < maxSpins) {
    message.textContent = "Finish all 30 spins before withdrawing!";
    return;
  }
  const score = Math.min((balance / 1000) * 10, 10);
  message.textContent = `You scored ${score.toFixed(1)}/10. Final Balance: $${balance}`;
});

updateStats();