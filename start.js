// ===== start.js =====
let logoImg;
let playImg;
let arcadeFont;

// Play button hitbox (updated after loading image)
let playBox = { x: 0, y: 0, w: 0, h: 0 };

function preload() {
  logoImg = loadImage("assets/logo.png");
  playImg = loadImage("assets/play_icon.png");
}

function setup() {
  createCanvas(900, 600);
  textFont("monospace");
}

function draw() {
  background(20, 20, 20); // dark landing screen

  // --- Draw Logo (centered) ---
  if (logoImg) {
    const logoW = 400;
    const logoH = (logoImg.height / logoImg.width) * logoW;
    const logoX = width / 2 - logoW / 2;
    const logoY = 100;

    image(logoImg, logoX, logoY, logoW, logoH);
  }

  // --- Draw Play Button (centered below logo) ---
  if (playImg) {
    const playW = 200;
    const playH = (playImg.height / playImg.width) * playW;

    const playX = width / 2 - playW / 2;
    const playY = 350;

    playBox = { x: playX, y: playY, w: playW, h: playH };

    image(playImg, playX, playY, playW, playH);
  } else {
    // fallback rectangle
    fill(0, 200, 0);
    rect(playBox.x, playBox.y, playBox.w, playBox.h, 10);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(30);
    text("PLAY", playBox.x + playBox.w / 2, playBox.y + playBox.h / 2);
  }
}

function mousePressed() {
  if (inside(mouseX, mouseY, playBox)) {
    // Go to lobby
    window.location = "index.html";
  }
}

function inside(mx, my, box) {
  return mx >= box.x &&
         mx <= box.x + box.w &&
         my >= box.y &&
         my <= box.y + box.h;
}
