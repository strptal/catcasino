// =====================
//    LOBBY  sketch.js
// =====================

// font
let arcadeFont;

// images
let lobbyBg;
let blackjackIcon;
let slotsIcon;

// player coins
let coins;

// hover scale effect (separate for each icon)
let hoverScaleBJ = 1.0;
let hoverScaleSlots = 1.0;
const HOVER_SCALE_TARGET = 1.1; // 10% larger on hover
const SCALE_SPEED = 0.08; // animation speed

// Icon box positions

const BJ_BOX = {
  x: 60,
  y: 150,
  w: 430,
  h: 430
};

const SLOTS_BOX = {
  x: 520,
  y: 190,
  w: 420,
  h: 420
};

function preload() {
  arcadeFont    = loadFont("assets/arcade.ttf");
  lobbyBg       = loadImage("assets/lobby_bg.png");
  blackjackIcon = loadImage("assets/blackjack_icon.png");
  slotsIcon     = loadImage("assets/slots_icon.png");
}

function setup() {
  createCanvas(900, 600);
  textFont(arcadeFont);
  textStyle(NORMAL);

  const saved = sessionStorage.getItem("coins");
  coins = saved ? int(saved) : 150;
  sessionStorage.setItem("coins", coins);
}

function draw() {
  if (lobbyBg) {
    image(lobbyBg, 0, 0, width, height);
  } else {
    background(0);
  }

  // detect if mouse is hovering over an icon
  const hoverBJ = inside(mouseX, mouseY, BJ_BOX);
  const hoverSlots = inside(mouseX, mouseY, SLOTS_BOX);

  // smoothly animate scales independently for each icon
  if (hoverBJ) {
    hoverScaleBJ = lerp(hoverScaleBJ, HOVER_SCALE_TARGET, SCALE_SPEED);
  } else {
    hoverScaleBJ = lerp(hoverScaleBJ, 1.0, SCALE_SPEED);
  }

  if (hoverSlots) {
    hoverScaleSlots = lerp(hoverScaleSlots, HOVER_SCALE_TARGET, SCALE_SPEED);
  } else {
    hoverScaleSlots = lerp(hoverScaleSlots, 1.0, SCALE_SPEED);
  }

  // coins
  fill(255);
  textSize(24);
  textAlign(LEFT, BASELINE);
  text("Coins " + coins, 30, 40);

  // title
  textSize(26);

  // slots icon (with scale effect)
  drawIconWithScale(slotsIcon, SLOTS_BOX, "Slots", hoverScaleSlots);
  // blackjack icon (with scale effect)
  drawIconWithScale(blackjackIcon, BJ_BOX, "Blackjack", hoverScaleBJ);
}

function drawIconWithScale(img, box, label, scaleAmount) {
  push();
  // apply scale from center of box
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  translate(cx, cy);
  scale(scaleAmount);
  translate(-cx, -cy);

  if (img) {
    image(img, box.x, box.y, box.w, box.h);
  } else {
    fill(150);
    rect(box.x, box.y, box.w, box.h);
  }
  pop();

  // label text (not scaled)
  fill(255);
  textSize(20);
  textAlign(CENTER, BASELINE);
  text(label, box.x + box.w / 2, box.y - 10);
}

function mousePressed() {
  if (inside(mouseX, mouseY, BJ_BOX)) {
    sessionStorage.setItem("coins", coins);
    window.location = "blackjack.html";
    return;
  }
  if (inside(mouseX, mouseY, SLOTS_BOX)) {
    sessionStorage.setItem("coins", coins);
    window.location = "slots.html";
    return;
  }
}

function inside(mx, my, box) {
  return (
    mx >= box.x &&
    mx <= box.x + box.w &&
    my >= box.y &&
    my <= box.y + box.h
  );
}
