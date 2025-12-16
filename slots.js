// =====================
//       SLOTS
// =====================

// font
let arcadeFont;

// coin storage
function getCoins() {
  const saved = sessionStorage.getItem("coins");
  return saved ? int(saved) : 150;
}
function setCoins(v) {
  sessionStorage.setItem("coins", v);
}

// canvas and layout
const CW = 900, CH = 600;
// make the machine larger so slot images render bigger on screen
const MACHINE = { x: 140, y: 120, w: 520, h: 360 };
const WIN = {
  x: MACHINE.x + 40,
  y: MACHINE.y + 70,
  w: MACHINE.w - 80,
  h: 160
};
// larger reels for bigger symbols
const REEL = { w: 140, h: 140 };
const REEL_SPACING = (WIN.w - 3 * REEL.w) / 4;
const REEL_Y = WIN.y + (WIN.h - REEL.h) / 2;
const REEL_XS = [
  WIN.x + REEL_SPACING,
  WIN.x + REEL_SPACING * 2 + REEL.w,
  WIN.x + REEL_SPACING * 3 + REEL.w * 2
];
// how much to scale the symbol images inside each reel (1.0 = fit box)
const SYMBOL_SCALE = 1.35;

// stretch the lever horizontally and position it so it stays on-screen
const LEVER = {
  x: Math.min(MACHINE.x + MACHINE.w - 40, CW - 8 - 320),
  y: MACHINE.y + 20,
  w: 320,
  h: 260
};

const costPerPull = 10;

// state
let coins = 0;
let symbols = [];
let result = [];
let showPrompt = true;
let message = "";

// images
let slotsBg, leverImg;
let sevenImg, coinImg, fishImg, starImg;

function preload() {
  arcadeFont = loadFont("assets/arcade.ttf");

  slotsBg = loadImage("assets/slots_bg.png");
  leverImg = loadImage("assets/lever.png");
  sevenImg = loadImage("assets/seven.png");
  coinImg  = loadImage("assets/coin.png");
  fishImg  = loadImage("assets/fish.png");
  starImg  = loadImage("assets/star.png");
}

function setup() {
  createCanvas(CW, CH);
  textFont(arcadeFont);
  noStroke();

  coins = getCoins();

  symbols = [
    { name: "seven", img: sevenImg, weight: 1 },
    { name: "star",  img: starImg,  weight: 3 },
    { name: "coin",  img: coinImg,  weight: 4 },
    { name: "fish",  img: fishImg,  weight: 6 }
  ];
}

function draw() {
  clear();
  background(60, 30, 10);

  if (slotsBg) {
    image(slotsBg, 0, 0, width, height);
  }

  fill(255);
  textSize(22);
  textAlign(LEFT, BASELINE);
  text("Coins " + coins, 30, 40);

  textAlign(CENTER, BASELINE);
  textSize(26);
  text("SLOTS", CW / 2, 40);

  drawButton(CW - 180, 16, 160, 38, "Back");

  drawMachine();

  for (let i = 0; i < 3; i++) {
    drawReel(REEL_XS[i], REEL_Y, result[i]);
  }

  fill(255);
  textSize(18);
  textAlign(CENTER, BASELINE);
  text(message, CW / 2, MACHINE.y + MACHINE.h + 30);
  textSize(16);
  text(
    "Click the lever to pull  cost " + costPerPull + " coins",
    CW / 2,
    MACHINE.y + MACHINE.h + 55
  );

  if (leverImg) {
    image(leverImg, LEVER.x, LEVER.y, LEVER.w, LEVER.h);
  } else {
    fill(180, 50, 50);
    rect(LEVER.x, LEVER.y, LEVER.w, LEVER.h, 6);
  }

  if (showPrompt) {
    drawPromptOverlay();
  }
}

function drawMachine() {
  // machine body colored per request
  fill('#7C238C');
  rect(MACHINE.x, MACHINE.y, MACHINE.w, MACHINE.h, 12);

  // win window (where symbols display) keep a dark contrast
  fill(20);
  rect(WIN.x, WIN.y, WIN.w, WIN.h, 8);

  fill(255);
  textSize(14);
  textAlign(CENTER, BASELINE);
  // draw payout legend as an icon key in the bottom-right corner of the machine
  drawLegend();
}

function drawLegend() {
  let iconSize = Math.round(REEL.h * 0.35);
  const gap = 8;
  const itemCount = 4;

  // desired start below lever
  let startX = Math.round(LEVER.x + (LEVER.w - iconSize) / 2);
  let startY = LEVER.y + LEVER.h + 12;

  // compute total height with current iconSize
  let totalH = (iconSize + gap) * itemCount - gap;

  // available space below lever (leave a small margin)
  const availBelow = CH - (LEVER.y + LEVER.h) - 12 - 16;

  // If not enough space below, try shrinking icons so legend fits beneath the lever
  while (iconSize > 20 && totalH + 16 > availBelow) {
    iconSize -= 2;
    totalH = (iconSize + gap) * itemCount - gap;
  }

  // if still doesn't fit below, place above lever as fallback
  if (totalH + 16 > availBelow) {
    startY = LEVER.y - totalH - 12;
  }

  // clamp startX so legend stays inside canvas horizontally
  const bgW = iconSize + 64;
  if (startX + bgW + 8 > CW) startX = CW - bgW - 8;
  if (startX < 8) startX = 8;

  // background for legend
  fill(0, 160);
  rect(startX - 12, startY - 8, bgW, totalH + 16, 8);

  const items = [
    { img: sevenImg, val: 120 },
    { img: starImg,  val: 90  },
    { img: coinImg,  val: 50  },
    { img: fishImg,  val: 25  }
  ];

  textAlign(LEFT, CENTER);
  fill(255);
  textSize(14);

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const y = startY + i * (iconSize + gap);
    if (it.img) image(it.img, startX, y, iconSize, iconSize);
    text(it.val, startX + iconSize + 10, y + iconSize / 2);
  }
}

function drawReel(x, y, sym) {
  fill(245);
  rect(x, y, REEL.w, REEL.h, 6);

  if (!sym || !sym.img) return;

  // draw the symbol larger while keeping it centered in the reel box
  const iw = Math.round(REEL.w * SYMBOL_SCALE);
  const ih = Math.round(REEL.h * SYMBOL_SCALE);
  const ix = x + (REEL.w - iw) / 2;
  const iy = y + (REEL.h - ih) / 2;
  image(sym.img, ix, iy, iw, ih);
}

function drawPromptOverlay() {
  fill(0, 200);
  rect(0, 0, CW, CH);

  const bx = 150, by = 220, bw = 600, bh = 160;
  // prompt panel with requested background color
  fill('#42033D');
  rect(bx, by, bw, bh, 14);

  fill(255);
  textSize(20);
  textAlign(CENTER, CENTER);
  text(
    "Slots cost " + costPerPull + " coins each pull  Continue",
    bx + bw / 2,
    by + 50
  );

  // custom-colored Yes/No buttons per request (#680E4B)
  const btnColor = '#680E4B';
  // Yes button
  fill(btnColor);
  rect(bx + 100, by + 100, 150, 40, 8);
  fill(255);
  textSize(16);
  textAlign(CENTER, CENTER);
  text('Yes', bx + 100 + 150 / 2, by + 100 + 40 / 2);
  // No button
  fill(btnColor);
  rect(bx + 350, by + 100, 150, 40, 8);
  fill(255);
  text('No', bx + 350 + 150 / 2, by + 100 + 40 / 2);
}

function drawButton(x, y, w, h, label) {
  fill('#680E4B');
  rect(x, y, w, h, 10);
  fill(255);
  textSize(16);
  textAlign(CENTER, CENTER);
  text(label, x + w / 2, y + h / 2);
}

function mousePressed() {
  if (inside(mouseX, mouseY, CW - 180, 16, 160, 38)) {
    setCoins(coins);
    window.location = "index.html";
    return;
  }

  if (showPrompt) {
    const bx = 150, by = 220;
    if (inside(mouseX, mouseY, bx + 100, by + 100, 150, 40)) {
      showPrompt = false;
      message = "Good luck";
      return;
    }
    if (inside(mouseX, mouseY, bx + 350, by + 100, 150, 40)) {
      window.location = "index.html";
      return;
    }
    return;
  }

  if (inside(mouseX, mouseY, LEVER.x, LEVER.y, LEVER.w, LEVER.h)) {
    pullLever();
  }
}

function pullLever() {
  if (coins < costPerPull) {
    message = "Not enough coins";
    return;
  }

  coins -= costPerPull;

  result = [pickWeighted(), pickWeighted(), pickWeighted()];

  const win = computeWin(result);
  if (win > 0) {
    coins += win;
    message = "You win " + win + " coins";
  } else {
    message = "No match  Try again";
  }

  setCoins(coins);

  if (coins <= 0) {
    message = "You are out of coins  The bouncer asks you to leave";
    setTimeout(() => window.location = "index.html", 1500);
  }
}

function pickWeighted() {
  let total = 0;
  for (const s of symbols) total += s.weight;
  let r = random(total);
  for (const s of symbols) {
    if (r < s.weight) return s;
    r -= s.weight;
  }
  return symbols[symbols.length - 1];
}

function computeWin(res) {
  const allMatch =
    res.length === 3 &&
    res[0].name === res[1].name &&
    res[1].name === res[2].name;

  if (!allMatch) return 0;

  const n = res[0].name;
  if (n === "seven") return 120;
  if (n === "star")  return 90;
  if (n === "coin")  return 50;
  if (n === "fish")  return 25;
  return 0;
}

function inside(mx, my, x, y, w, h) {
  return mx >= x && mx <= x + w &&
         my >= y && my <= y + h;
}
