const symbols = ["🍒", "🍋", "🍇", "🍉", "🍓", "7️⃣"];
const spinButton = document.getElementById("spin");
const depositButton = document.getElementById("deposit");
const withdrawButton = document.getElementById("withdraw");

const totalSpins = document.getElementById("totalSpins");
const jackpots = document.getElementById("jackpots");
const balanceDisplay = document.getElementById("balance");
const winningsDisplay = document.getElementById("totalWinnings");
const lossesDisplay = document.getElementById("totalLosses");
const message = document.getElementById("message");

const columns = [
  document.getElementById("col1"),
  document.getElementById("col2"),
  document.getElementById("col3")
];

let balance = 10000;
let winnings = 0;
let losses = 0;
let depositCount = 0;
let spinsDone = 0;
const maxSpins = 30;

function createReelSymbol(symbol) {
  const div = document.createElement("div");
  div.className = "reel";
  div.textContent = symbol;
  return div;
}

function spinColumn(column, finalSymbols, delay) {
  return new Promise((resolve) => {
    let spins = 0;
    const interval = setInterval(() => {
      column.innerHTML = '';
      for (let i = 0; i < 3; i++) {
        column.appendChild(createReelSymbol(symbols[Math.floor(Math.random() * symbols.length)]));
      }
      column.childNodes.forEach(reel => {
        reel.style.animation = "roll 0.3s ease-in-out";
      });
      spins++;
      if (spins >= 15) {
        clearInterval(interval);
        column.innerHTML = '';
        finalSymbols.forEach(sym => {
          column.appendChild(createReelSymbol(sym));
        });
        resolve();
      }
    }, delay);
  });
}

function updateStats() {
  balanceDisplay.textContent = balance;
  winningsDisplay.textContent = winnings;
  lossesDisplay.textContent = losses;
  totalSpins.textContent = spinsDone;
}

spinButton.addEventListener("click", async () => {
  const betInput = document.getElementById("betAmount");
  let betAmount = parseInt(betInput.value);

  if (isNaN(betAmount) || betAmount < 200) {
    message.textContent = "Minimum bet is $200!";
    return;
  }
  if (isNaN(betAmount) || betAmount > 500) {
    message.textContent = "Maximum bet is $500!";
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

  message.textContent = "Spinning...";
  balance -= betAmount;
  spinsDone++;

  const results = [
    [symbols[Math.floor(Math.random() * symbols.length)],
     symbols[Math.floor(Math.random() * symbols.length)],
     symbols[Math.floor(Math.random() * symbols.length)]],
    [symbols[Math.floor(Math.random() * symbols.length)],
     symbols[Math.floor(Math.random() * symbols.length)],
     symbols[Math.floor(Math.random() * symbols.length)]],
    [symbols[Math.floor(Math.random() * symbols.length)],
     symbols[Math.floor(Math.random() * symbols.length)],
     symbols[Math.floor(Math.random() * symbols.length)]]
  ];

  await Promise.all([
    spinColumn(columns[0], results[0], 100),
    spinColumn(columns[1], results[1], 120),
    spinColumn(columns[2], results[2], 140)
  ]);

  const centerRow = [results[0][1], results[1][1], results[2][1]];

  if (centerRow[0] === centerRow[1] && centerRow[1] === centerRow[2]) {
    let jackpotReward = betAmount * 5;
    message.textContent = `🎉 JACKPOT! 🎉 +$${jackpotReward}`;
    jackpots.textContent = parseInt(jackpots.textContent) + 1;
    balance += jackpotReward;
    winnings += jackpotReward - betAmount;
  } else {
    message.textContent = "Try Again!";
    losses += betAmount;
  }

  updateStats();
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

  const score = Math.floor(balance / 100);
  message.textContent = `You scored ${score}/10. Final Balance: $${balance}`;
});
