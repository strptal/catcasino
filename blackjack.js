// =====================
//      BLACKJACK
// =====================

// font
let arcadeFont;

// background and cards
let blackjackBg;
let cardImages = {}; // key like AS 10H etc maps to p5 Image

// coin storage
function getCoins() {
  const saved = sessionStorage.getItem("coins");
  return saved ? int(saved) : 150;
}
function setCoins(v) {
  sessionStorage.setItem("coins", v);
}

// canvas
const CW = 900;
const CH = 600;
const CENTER_X = CW / 2;

// layout
const TABLE_TOP = 150;
const TABLE_W = 760;

// card rows
// Move dealer up to avoid overlapping player cards while keeping player Y fixed
const DEALER_Y = TABLE_TOP - 40;  // moved dealer further up
const PLAYER_Y = 320;  // keep player row at this fixed position

// info text on the right side
const INFO_X = CW - 260;
const PLAYER_TOTAL_Y = PLAYER_Y + 40;
const DEALER_INFO_Y = DEALER_Y + 40;

// message bar
const MSG_PANEL = {
  x: (CW - 600) / 2,
  y: 70,
  w: 600,
  h: 40
};

// betting buttons
const BETS = [10, 20, 50, 100];
const BET_BTN_W = 120;
const BET_BTN_H = 44;
const BET_GAP = 24;
const BET_Y = CH - 60;

// action buttons
const ACTION_W = 150;
const ACTION_H = 48;
const ACTION_GAP = 30;
const ACTION_Y = CH - 110;  // lifted up so always visible

const LOBBY_BTN = { x: CW - 180, y: 16, w: 160, h: 38 };

const TOTAL_BET_W = BETS.length * BET_BTN_W + (BETS.length - 1) * BET_GAP;
const BET_START_X = CENTER_X - TOTAL_BET_W / 2;
const BET_BTNS = BETS.map((amt, i) => ({
  x: BET_START_X + i * (BET_BTN_W + BET_GAP),
  y: BET_Y,
  w: BET_BTN_W,
  h: BET_BTN_H,
  amt
}));

const ACTION_START_X = CENTER_X - (ACTION_W * 2 + ACTION_GAP) / 2;
let HIT_BTN   = { x: ACTION_START_X,                      y: ACTION_Y, w: ACTION_W, h: ACTION_H };
let STAND_BTN = { x: ACTION_START_X + ACTION_W + ACTION_GAP, y: ACTION_Y, w: ACTION_W, h: ACTION_H };
const AGAIN_BTN = { x: CENTER_X - 120, y: ACTION_Y, w: 240, h: ACTION_H };

// greeting buttons
const YES_BTN = { x: CENTER_X - 160, y: CH / 2 + 40, w: 120, h: 44 };
const NO_BTN  = { x: CENTER_X + 40,  y: CH / 2 + 40, w: 120, h: 44 };

// game state
let coins = 0;
let state = "greet";  // greet bet player dealer result
let message = "";
let bet = 0;

// deck and hands
const ranks = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
// suit letters match filenames  C clubs  D diamonds  H hearts  S spades
const suits = ["C","D","H","S"];
let deck = [];
let player = [];
let dealer = [];
let dealerReveal = false;

// ------------ p5 preload and setup ------------
function preload() {
  arcadeFont  = loadFont("assets/arcade.ttf");
  blackjackBg = loadImage("assets/blackjack_bg.png");

  // preload all 52 card images: AS 10H KD etc
  for (let s of suits) {
    for (let r of ranks) {
      const key = r + s;
      // if your card pngs are in assets/cards change to "assets/cards/" + key + ".png"
      cardImages[key] = loadImage("assets/cards/" + key + ".png");
    }
  }
}

function setup() {
  createCanvas(CW, CH);
  textFont(arcadeFont);
  noStroke();

  // move action buttons to the far right of the canvas
  STAND_BTN.x = CW - 20 - STAND_BTN.w;
  HIT_BTN.x = STAND_BTN.x - ACTION_GAP - HIT_BTN.w;

  coins = getCoins();
  state = "greet";
  message = "Dealer says Good evening ready to play";
}

// ------------ main draw loop ------------
function draw() {
  clear();
  background(8, 80, 40);

  if (blackjackBg) {
    image(blackjackBg, 0, 0, width, height);
  }

  // header
  fill(255);
  textSize(22);
  textAlign(LEFT, BASELINE);
  text("Coins " + coins, 30, 36);

  textAlign(CENTER, BASELINE);
  textSize(26);
  text("BLACKJACK", CENTER_X, 36);

  drawButton(LOBBY_BTN.x, LOBBY_BTN.y, LOBBY_BTN.w, LOBBY_BTN.h, "Back");

  if (state !== "greet") {
    // message panel: use requested purple background
    fill('#42033D');
    rect(MSG_PANEL.x, MSG_PANEL.y, MSG_PANEL.w, MSG_PANEL.h, 14);
    fill(255);
    textSize(16);
    textAlign(CENTER, CENTER);
    text(
      message,
      MSG_PANEL.x + 10,
      MSG_PANEL.y + 4,
      MSG_PANEL.w - 20,
      MSG_PANEL.h - 8
    );
  }

  stroke(255, 60);
  line((CW - TABLE_W) / 2, TABLE_TOP, (CW + TABLE_W) / 2, TABLE_TOP);
  noStroke();

  if (state === "greet") {
    drawGreetingOverlay();
    return;
  }

  if (state === "bet") {
    drawHands();
    drawBetting();
    return;
  }

  drawHands();

  if (state === "player") {
    drawPlayerActions();
  } else if (state === "result") {
    drawAgain();
  }
}

// ------------ UI helpers ------------
function drawButton(x, y, w, h, label, enabled = true) {
  // primary button color (enabled) and muted disabled color
  const enabledColor = '#680E4B';
  const disabledColor = '#8B5B75';
  fill(enabled ? enabledColor : disabledColor);
  rect(x, y, w, h, 10);
  fill(255);
  textSize(16);
  textAlign(CENTER, CENTER);
  text(label, x + w / 2, y + h / 2);
}

function drawPanel(x, y, w, h, alpha) {
  fill(0, alpha);
  rect(x, y, w, h, 14);
}

function insideBox(mx, my, box) {
  return (
    mx >= box.x &&
    mx <= box.x + box.w &&
    my >= box.y &&
    my <= box.y + box.h
  );
}

// ------------ greeting overlay ------------
function drawGreetingOverlay() {
  // custom-colored greeting panel per user request
  const bx = (CW - 560) / 2;
  const by = (CH - 220) / 2;
  const bw = 560;
  const bh = 220;
  fill('#42033D');
  rect(bx, by, bw, bh, 14);

  fill(255);
  textSize(20);
  textAlign(CENTER, CENTER);
  text("Dealer says Good evening ready to play", CENTER_X, CH / 2 - 30);

  // Yes button (custom color)
  fill('#680E4B');
  rect(YES_BTN.x, YES_BTN.y, YES_BTN.w, YES_BTN.h, 10);
  fill(255);
  textSize(16);
  textAlign(CENTER, CENTER);
  text('Yes', YES_BTN.x + YES_BTN.w / 2, YES_BTN.y + YES_BTN.h / 2);

  // No button (custom color)
  fill('#680E4B');
  rect(NO_BTN.x, NO_BTN.y, NO_BTN.w, NO_BTN.h, 10);
  fill(255);
  text('No', NO_BTN.x + NO_BTN.w / 2, NO_BTN.y + NO_BTN.h / 2);
}

// ------------ betting ------------
function drawBetting() {
  fill(255);
  textSize(18);
  textAlign(CENTER, BASELINE);
  text("Choose your bet", CENTER_X, BET_Y - 20);

  BET_BTNS.forEach(btn => {
    const enabled = coins >= btn.amt;
    drawButton(btn.x, btn.y, btn.w, btn.h, String(btn.amt), enabled);
  });
}

// ------------ hands and cards ------------
function drawHands() {
  fill(255);
  textSize(16);
  textAlign(LEFT, BASELINE);
  const leftX = (CW - TABLE_W) / 2;
  text("Dealer", leftX, DEALER_Y - 10);
  text("Player", leftX, PLAYER_Y - 10);

  drawHand(dealer, leftX, DEALER_Y, !dealerReveal, true);
  drawHand(player, leftX, PLAYER_Y, false, false);

  const pv = handValue(player);
  textAlign(LEFT, BASELINE);
  text("Your total " + pv, INFO_X, PLAYER_TOTAL_Y);

  if (dealerReveal) {
    const dv = handValue(dealer);
    text("Dealer total " + dv, INFO_X, DEALER_INFO_Y);
  } else if (dealer.length) {
    const shownVal = cardValue(dealer[0].rank);
    text("Dealer shows " + shownVal, INFO_X, DEALER_INFO_Y);
  }
}

function drawHand(hand, x, y, hideSecond, isDealer = false) {
  // different sizes: dealer cards slightly smaller than player cards
  let CARD_W, CARD_H, GAP;
  // use the same large sizing for dealer and player visible cards
  CARD_W = 240;
  CARD_H = 350;
  GAP = -16; // overlap/very tight spacing
  for (let i = 0; i < hand.length; i++) {
    const cx = x + i * (CARD_W + GAP);
    drawCard(hand[i], cx, y, CARD_W, CARD_H, hideSecond && i === 1);
  }
}

function getCardImage(rank, suitLetter) {
  const key = rank + suitLetter; // AS 10H etc
  return cardImages[key] || null;
}

function drawCard(card, x, y, w, h, hidden) {
  if (hidden) {
    // purple back for hidden card — draw much smaller so it's not oversized
    const scale = 0.55;
    const nw = w * scale;
    const nh = h * scale;
    const ox = x + (w - nw) / 2;
    const oy = y + (h - nh) / 2;
    fill(180, 40, 160);
    rect(ox, oy, nw, nh, 10);
    fill(255);
    textAlign(CENTER, CENTER);
    // scale the hidden marker relative to the hidden card height
    textSize(nh * 0.12);
    text("X", ox + nw / 2, oy + nh / 2);
    return;
  }

  const img = getCardImage(card.rank, card.suit);
  if (img) {
    // draw only your PNG so transparency shows
    image(img, x, y, w, h);
  } else {
    // simple fallback if image missing
    fill(255);
    rect(x, y, w, h, 10);
    fill(0);
    textSize(h * 0.12);
    textAlign(CENTER, CENTER);
    text(card.rank, x + w / 2, y + h / 2);
  }
}

// ------------ actions UI ------------
function drawPlayerActions() {
  drawButton(HIT_BTN.x, HIT_BTN.y, HIT_BTN.w, HIT_BTN.h, "Hit");
  drawButton(STAND_BTN.x, STAND_BTN.y, STAND_BTN.w, STAND_BTN.h, "Stand");
}

function drawAgain() {
  drawButton(AGAIN_BTN.x, AGAIN_BTN.y, AGAIN_BTN.w, AGAIN_BTN.h, "Play Again");
}

// ------------ mouse input ------------
function mousePressed() {
  // back to lobby
  if (insideBox(mouseX, mouseY, LOBBY_BTN)) {
    setCoins(coins);
    window.location = "index.html";
    return;
  }

  if (state === "greet") {
    if (insideBox(mouseX, mouseY, YES_BTN)) {
      state = "bet";
      message = "Dealer says Great  Good luck do not get greedy";
      return;
    }
    if (insideBox(mouseX, mouseY, NO_BTN)) {
      window.location = "index.html";
      return;
    }
    return;
  }

  if (state === "bet") {
    for (const btn of BET_BTNS) {
      if (insideBox(mouseX, mouseY, btn) && coins >= btn.amt) {
        bet = btn.amt;
        startHand();
        return;
      }
    }
    return;
  }

  if (state === "player") {
    if (insideBox(mouseX, mouseY, HIT_BTN)) {
      player.push(drawCardFromDeck());
      const pv = handValue(player);
      message = "Hit or Stand";
      if (pv > 21) {
        endHand("bust");
      }
      return;
    }
    if (insideBox(mouseX, mouseY, STAND_BTN)) {
      dealerTurn();
      return;
    }
  }

  if (state === "result") {
    if (insideBox(mouseX, mouseY, AGAIN_BTN)) {
      player = [];
      dealer = [];
      dealerReveal = false;
      bet = 0;
      message = "Choose your bet";
      state = "bet";
      return;
    }
  }
}

// ------------ deck and scoring ------------
function freshDeck() {
  const d = [];
  for (let s of suits) {
    for (let r of ranks) {
      d.push({ rank: r, suit: s });
    }
  }
  for (let i = d.length - 1; i > 0; i--) {
    const j = floor(random(i + 1));
    const tmp = d[i];
    d[i] = d[j];
    d[j] = tmp;
  }
  return d;
}

function drawCardFromDeck() {
  return deck.pop();
}

function cardValue(rank) {
  if (rank === "A") return 11;
  if (rank === "K" || rank === "Q" || rank === "J") return 10;
  return int(rank);
}

function handValue(hand) {
  let total = 0;
  let aces = 0;
  for (let c of hand) {
    total += cardValue(c.rank);
    if (c.rank === "A") aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

// ------------ hand flow ------------
function startHand() {
  deck = freshDeck();
  player = [drawCardFromDeck(), drawCardFromDeck()];
  dealer = [drawCardFromDeck(), drawCardFromDeck()];
  dealerReveal = false;
  state = "player";
  message = "Bet " + bet + "  Hit or Stand";
}

function dealerTurn() {
  state = "dealer";
  dealerReveal = true;
  while (handValue(dealer) < 17) {
    dealer.push(drawCardFromDeck());
  }
  resolveHand();
}

function resolveHand() {
  const pv = handValue(player);
  const dv = handValue(dealer);

  let outcome = "push";
  if (pv > 21) outcome = "lose";
  else if (dv > 21) outcome = "win";
  else if (pv > dv) outcome = "win";
  else if (pv < dv) outcome = "lose";

  applyPayout(outcome);
  state = "result";

  if (outcome === "win") {
    message = "You win " + bet + " coins";
  } else if (outcome === "lose") {
    message = "You lose " + bet + " coins";
  } else {
    message = "Push  No coins won or lost";
  }

  if (coins <= 0) {
    message += "  You are out of coins  The dealer asks you to leave";
    setTimeout(() => window.location = "index.html", 1500);
  }
}

function endHand(reason) {
  if (reason === "bust") {
    dealerReveal = true;
    applyPayout("lose");
    state = "result";
    message = "Bust  You lose " + bet + " coins";
    if (coins <= 0) {
      message += "  You are out of coins  The dealer asks you to leave";
      setTimeout(() => window.location = "index.html", 1500);
    }
  }
}

function applyPayout(outcome) {
  if (outcome === "win") coins += bet;
  else if (outcome === "lose") coins -= bet;
  setCoins(coins);
}
