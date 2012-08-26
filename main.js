var Invaders = function () {  // start of the Invaders namespace

//
// Constants
//

// Keycodes.
var KEY_ESCAPE = 27;
var KEY_LEFT_ARROW = 37;
var KEY_RIGHT_ARROW = 39;
var KEY_UP_ARROW = 38;
var KEY_DOWN_ARROW = 40;

// Text alignment.
var ALIGN_LEFT = 1;
var ALIGN_MIDDLE = 2;
var ALIGN_RIGHT = 3;
var ALIGN_TOP = 1;
var ALIGN_BOTTOM = 3;

// Font settings.
var ICON_FONT_SIZE = 42;
var ICON_FONT_NAME = "PixelInvaders";

var TITLE_FONT_SIZE = 42;
var TITLE_FONT_NAME = "Pixelate";

var DIALOGUE_FONT_SIZE = 21;
var DIALOGUE_FONT_NAME = "Pixelate";

// Movement directions for the aliens.
var ALIEN_MOVE_LEFT = 1;
var ALIEN_MOVE_RIGHT = 2;
var ALIEN_MOVE_DOWN = 3;


//
// Global variables
//

// The 2D canvas context we draw the game in.
var canvas;
var ctx;


//
// Game data
//

// Wrapper for all our globals
var game = {
  // Game state management.
  'lastT': 0,          // Time we last called game.update().
  'lastStateT': 0,     // Time we last switched into a new state.
  'states': {
    'titles':     { 'draw': drawTitles,     'update': updateTitles },
    'newGame':    { 'draw': drawNewGame,    'update': updateNewGame,  'enter': enterNewGame },
    'playing':    { 'draw': drawPlaying,    'update': updatePlaying },
    'win':        { 'draw': drawWin,        'update': updateWin },
    'lose':       { 'draw': drawLose,       'update': updateLose },
    'paused':     { 'draw': drawPaused,     'update': updatePaused },
  },
  'currentState': null,

  // Input handling.
  'keysDown': {},

  // Player data.
  'player': {
    'size': null,
    'pos': null,
    'color': "#00FF00",
    'shape': "Q",
    'speed': 128.0,  // pixels per second
  },

  // Alien data.
  'numAliens': 0,
  'aliens': {
    'cellWidth': 0,
    'cellHeight': 0,
    'numPerRow': 0,
    'speed': 48.0,      // pixels per second
    'minBombDT': 1000,   // min time, in milliseconds, between dropping two bombs.
    'bombP': 0.5,       // probability of dropping a bomb on any given frame.
    'states': [ ALIEN_MOVE_LEFT, ALIEN_MOVE_DOWN, ALIEN_MOVE_RIGHT, ALIEN_MOVE_DOWN ],
    'state': 0,
    'size': [],
    'pos': [],
    'color': [],
    'shape': [],
    'isFriendly': [],
    'lastBombT': 0,
  },

  // Barricade data.
  'barricades': {
  },

  // Bullets (fired by the player)
  'numBullets': 0,
  'maxBullets': 12,
  'bullets': {
    'size': null,
    'color': "#990000",
    'speed': 192.0, // pixels per second
    'xOfs': 0,
    'yOfs': 0,
    'pos': [],
  },

  // Bombs (fired by the aliens)
  'numBombs': 0,
  'bombs': {
    'size': null,
    'color': "#999900",
    'speed': 100.0, // pixels per second
    'xOfs': 0,
    'yOfs': 0,
    'pos': [],
  },
};



//
// Game states
//

function changeState(newState)
{
  game.lastT = Date.now();
  clearKeyboard();

  // Change the state.
  if (game.currentState.leave)
    game.currentState.leave();
  game.currentState = newState;
  if (game.currentState.enter)
    game.currentState.enter();

  // Record the timestamp of the change.
  game.lastStateT = game.lastT;
}


function drawTitles()
{
  drawBackground();

  ctx.fillStyle = "#FFFFFF";
  drawText("Invaders: Evolution", TITLE_FONT_SIZE, 0, 0, ALIGN_MIDDLE, ALIGN_MIDDLE);
  drawText("press <space> to play", TITLE_FONT_SIZE / 2, 0, TITLE_FONT_SIZE, ALIGN_MIDDLE, ALIGN_MIDDLE);
}


function updateTitles()
{
  game.lastT = Date.now();
  // Press space to start...
  if (game.keysDown[' '])
    changeState(game.states.newGame);
}


function drawNewGame()
{
  drawBackground();
}


function updateNewGame()
{
  game.lastT = Date.now();
  changeState(game.states.playing);
}


function enterNewGame()
{
  ctx.font = ICON_FONT_SIZE + "px " + ICON_FONT_NAME;

  // Set up the player.
  var tw = ctx.measureText(game.player.shape);
  var x = (canvas.width - tw.width) / 2;
  var y = (canvas.height - 10);
  game.player.pos = [ x, y ];
  game.player.size = [ tw.width - 4, ICON_FONT_SIZE / 2 ];

  // Set up the aliens.
  var shapes = "ABCDEFGH";
  var numRows = shapes.length;

  game.aliens.numPerRow = 8;
  game.aliens.cellWidth = canvas.width / (game.aliens.numPerRow + 2);
  game.aliens.cellHeight = ICON_FONT_SIZE + 10;
  game.aliens.shape = [];
  game.aliens.size = [];
  game.aliens.pos = [];
  game.aliens.color = [];
  game.aliens.isFriendly = [];
  game.aliens.lastBombT = game.lastT;
  game.aliens.state = 0;

  game.numAliens = 0;
  y = (2 * canvas.height / 3);
  for (var row = 0; row < numRows; row++) {
    var shape = shapes[row];
    spawnRowOfAliens(shape, y);
    y -= game.aliens.cellHeight;
  }

  ctx.font = ICON_FONT_SIZE + "px " + TITLE_FONT_NAME;

  // Set up the bullets.
  tw = ctx.measureText('i');
  game.numBullets = 0;
  game.bullets.size = [ tw.width * 0.5, ICON_FONT_SIZE * 0.33 ];
  game.bullets.xOfs = (game.player.size[0] - game.bullets.size[0]) / 2;
  game.bullets.yOfs = game.bullets.size[1] + game.player.size[1];
  game.bullets.pos = [];

  // Set up the bombs.
  tw = ctx.measureText('o');
  game.numBombs = 0;
  game.bombs.size = [ tw.width * 0.5, ICON_FONT_SIZE * 0.33 ];
  game.bombs.xOfs = (game.player.size[0] - game.bombs.size[0]) / 2;
  game.bombs.yOfs = game.bombs.size[1] / 2;
  game.bombs.pos = [];
}


function drawPlaying()
{
  drawBackground();
  drawAliens();
  drawBarricades();
  drawPlayer();
  drawBullets();
  drawBombs();
}


function updatePlaying()
{
  var t = Date.now();
  var dt = (t - game.lastT) / 1000.0;
  game.lastT = t;

  if (game.keysDown[27]) {
    changeState(game.states.titles);
    return;
  }
  if (game.keysDown['P']) {
    changeState(game.states.paused);
    return;
  }

  updateBullets(dt);
  updateBombs(dt);

  collisionTestBulletsToAliens();
  collisionTestBombsToPlayer();

  updatePlayer(dt);
  updateAliens(dt);
}


function drawWin()
{
  // Draw everything as if we were still playing...
  drawPlaying();
  // ... then draw the 'YOU WIN' text over it.
  drawText('You win!', 42, 0, 0, ALIGN_MIDDLE, ALIGN_MIDDLE, "Pixelate");
}


function updateWin()
{
  game.lastT = Date.now();

  var dt = (game.lastT - game.lastStateT) / 1000.0;
  var showFor = 5.0; // Time to show the message for, in seconds.

  if (game.keysDown[" "] || game.keysDown[27] || dt > showFor)
    changeState(game.states.titles);
}


function drawLose()
{
  // Draw everything as if we were still playing...
  drawPlaying();
  // ... then draw the 'YOU LOSE' text over it.
  drawText('You lose!', 42, 0, 0, ALIGN_MIDDLE, ALIGN_MIDDLE, "Pixelate");
}


function updateLose()
{
  game.lastT = Date.now();

  var dt = (game.lastT - game.lastStateT) / 1000.0;
  var showFor = 5.0; // Time to show the message for, in seconds.

  if (game.keysDown[" "] || game.keysDown[27] || dt > showFor)
    changeState(game.states.titles);
}


function drawPaused()
{
  // Draw everything as if we were still playing...
  drawPlaying();
  // ... then draw the 'PAUSED' text over it.
  drawText('paused', 42, 0, 0, ALIGN_MIDDLE, ALIGN_MIDDLE, "Pixelate");
}


function updatePaused()
{
  game.lastT = Date.now();
  if (anyKeyPressed())
    changeState(game.states.playing);
}


//
// Drawing functions
//

function drawBackground()
{
  ctx.fillStyle = "rgb(0, 0, 0);";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}


function drawPlayer()
{
  ctx.fillStyle = game.player.color;

  drawText(game.player.shape, ICON_FONT_SIZE,
      game.player.pos[0], game.player.pos[1],
      ALIGN_LEFT, ALIGN_TOP, ICON_FONT_NAME);
}


function drawAliens()
{
  for (var i = 0; i < game.numAliens; i++) {
    ctx.fillStyle = game.aliens.color[i];
    drawText(game.aliens.shape[i], ICON_FONT_SIZE,
        game.aliens.pos[i][0], game.aliens.pos[i][1],
        ALIGN_LEFT, ALIGN_TOP, ICON_FONT_NAME);
  }
}


function drawBarricades()
{
}


function drawBullets()
{
  ctx.fillStyle = game.bullets.color;
  for (var i = 0; i < game.numBullets; i++) {
    ctx.fillRect(
        game.bullets.pos[i][0], game.bullets.pos[i][1],
        game.bullets.size[0], game.bullets.size[1]
    );
  }
}


function drawBombs()
{
  ctx.fillStyle = game.bombs.color;
  for (var i = 0; i < game.numBombs; i++) {
    ctx.fillRect(
        game.bombs.pos[i][0], game.bombs.pos[i][1],
        game.bombs.size[0], game.bombs.size[1]
    );
  }
}


function drawText(msg, size, x, y, halign, valign, fontname)
{
  if (!fontname)
    fontname = TITLE_FONT_NAME;

  ctx.font = size + "px " + fontname;

  var textWidth = ctx.measureText(msg);
  var textX, textY;

  if (halign == ALIGN_LEFT)
    textX = x;
  else if (halign == ALIGN_RIGHT)
    textX = canvas.width - textWidth.width - x;
  else
    textX = (canvas.width - textWidth.width) / 2 + x;

  if (valign == ALIGN_TOP)
    textY = y;
  else if (valign == ALIGN_BOTTOM)
    textY = canvas.height - y;
  else
    textY = canvas.height / 2 + y;

  ctx.fillText(msg, textX, textY);
}


//
// Spawning functions
//

function expirePlayer()
{
  changeState(game.states.lose);
}


function spawnRowOfAliens(shape, y)
{
  ctx.font = ICON_FONT_SIZE + "px " + ICON_FONT_NAME;
  tw = ctx.measureText(shape);

  var xOfs = (game.aliens.cellWidth - tw.width) / 2;
  for (var i = 1; i <= game.aliens.numPerRow; i++) {
    game.aliens.shape.push(shape);
    game.aliens.size.push([ tw.width, ICON_FONT_SIZE ]);
    game.aliens.pos.push([ game.aliens.cellWidth * i + xOfs, y ]);
    game.aliens.color.push("#FFFFFF");
    game.aliens.isFriendly.push(false);
    game.numAliens++;
  }
}


function expireAlien(i)
{
  if (i >= game.numAliens)
    return;

  var j = game.numAliens - 1;
  game.aliens.shape[i] = game.aliens.shape[j];
  game.aliens.size[i] = game.aliens.size[j];
  game.aliens.pos[i] = game.aliens.pos[j];
  game.aliens.color[i] = game.aliens.color[j];
  game.aliens.isFriendly[i] = game.aliens.isFriendly[j];
  game.numAliens--;
}


function spawnBullet()
{
  if (game.numBullets >= game.maxBullets)
    return;

  var i = game.numBullets;
  game.bullets.pos[i] = [ 0, 0 ];
  game.bullets.pos[i][0] = game.player.pos[0] + game.bullets.xOfs;
  game.bullets.pos[i][1] = game.player.pos[1] - game.bullets.yOfs;
  game.numBullets++;
}


function expireBullet(i)
{
  if (i >= game.numBullets)
    return;
  
  game.bullets.pos[i] = game.bullets.pos[game.numBullets - 1];
  game.numBullets--;
}


function spawnBomb(alienIndex)
{
  var i = game.numBombs;
  game.bombs.pos[i] = [ 0, 0 ];
  game.bombs.pos[i][0] = game.aliens.pos[alienIndex][0];
  game.bombs.pos[i][1] = game.aliens.pos[alienIndex][1];
  game.numBombs++;

  game.aliens.lastBombT = game.lastT;
}


function expireBomb(i)
{
  if (i >= game.numBombs)
    return;

  game.bombs.pos[i] = game.bombs.pos[game.numBombs - 1];
  game.numBombs--;
}


//
// Generic player and enemy logic
//

function updatePlayer(dt)
{
  if (game.keysDown[' ']) {
    spawnBullet();
    game.keysDown[' '] = false;
  }

  var speed = game.player.speed * dt;
  var move = 0;
  if (game.keysDown[KEY_LEFT_ARROW])
    move -= speed;
  if (game.keysDown[KEY_RIGHT_ARROW])
    move += speed;
  var minX = 0;
  var maxX = canvas.width - game.player.size[0];
  game.player.pos[0] = clamp(minX, maxX, game.player.pos[0] + move);
}


function updateAliens(dt)
{
  var lowX = game.aliens.pos[0][0];
  var highX = lowX + game.aliens.size[0][0];
  var lowY = game.aliens.pos[0][1] - game.aliens.size[0][1];
  var highY = lowY + game.aliens.size[0][1];

  for (var i = 1; i < game.numAliens; i++) {
    var x = game.aliens.pos[i][0];
    var y = game.aliens.pos[i][1] - game.aliens.size[i][1];
    var x2 = x + game.aliens.size[i][0];
    var y2 = y + game.aliens.size[i][1];

    if (x < lowX)
      lowX = x;
    if (x2 > highX)
      highX = x2;

    if (y < lowY)
      lowY = y;
    if (y2 > highY)
      highY = y2;
  }

  var minX = 0;
  var maxX = canvas.width;
  var nextRow = Math.floor(highY / game.aliens.cellHeight) + 1;
  var nextRowY = nextRow * game.aliens.cellHeight;
  
  var moveDir = game.aliens.states[game.aliens.state];

  var dx = 0;
  var dy = 0;
  if (moveDir == ALIEN_MOVE_LEFT) {
    dx = game.aliens.speed * dt;
    lowX -= dx;
    if (lowX <= minX) {
      dx -= (minX - lowX);
      game.aliens.state = (game.aliens.state + 1) % game.aliens.states.length;
    }
    dx = -dx;
  }
  else if (moveDir == ALIEN_MOVE_RIGHT) {
    dx = game.aliens.speed * dt;
    highX += dx;
    if (highX >= maxX) {
      dx -= (highX - maxX);
      game.aliens.state = (game.aliens.state + 1) % game.aliens.states.length;
    }
  }
  else if (moveDir == ALIEN_MOVE_DOWN) {
    dy = game.aliens.speed * dt;
    highY += dy;
    if (highY >= nextRowY) {
      dy -= (highY - nextRowY);
      game.aliens.state = (game.aliens.state + 1) % game.aliens.states.length;
    }
  }

  for (var i = 0; i < game.numAliens; i++) {
    game.aliens.pos[i][0] += dx;
    game.aliens.pos[i][1] += dy;
  }

  moveDir = game.aliens.states[game.aliens.state];
  var dtBomb = game.lastT - game.aliens.lastBombT;
  if ((moveDir == ALIEN_MOVE_LEFT || moveDir == ALIEN_MOVE_RIGHT) && dtBomb > game.aliens.minBombDT) {
    if (Math.random() < game.aliens.bombP) {
      var i = Math.floor(Math.random() * game.numAliens);
      spawnBomb(i);
    }
  }
}


function updateBullets(dt)
{
  var move = game.bullets.speed * dt;
  for (var i = game.numBullets - 1; i >= 0; i--) {
    game.bullets.pos[i][1] -= move;
    if (game.bullets.pos[i][1] < -game.bullets.size[1])
      expireBullet(i);
  }
}


function updateBombs(dt)
{
  var move = game.bombs.speed * dt;
  for (var i = game.numBombs - 1; i >= 0; i--) {
    game.bombs.pos[i][1] += move;
    if (game.bombs.pos[i][1] > canvas.height)
      expireBomb(i);
  }
}


//
// Collision testing and handling
//

function collisionTestBulletsToAliens()
{
  for (var a = game.numAliens - 1; a >= 0; a--) {
    var aL = game.aliens.pos[a][0];
    var aR = aL + game.aliens.size[a][0];
    var aT = game.aliens.pos[a][1];
    var aB = aT - game.aliens.size[a][1];

    for (var b = game.numBullets - 1; b >= 0; b--) {
      var bL = game.bullets.pos[b][0]; 
      var bR = bL + game.bullets.size[0];
      var bT = game.bullets.pos[b][1];
      var bB = bT - game.bullets.size[1];

      if (bL <= aR && bR >= aL && bB <= aT && bT >= aT) {
        expireAlien(a);
        expireBullet(b);
      }
    }
  }
}


function collisionTestBombsToPlayer()
{
  var pL = game.player.pos[0];
  var pR = pL + game.player.size[0];
  var pT = game.player.pos[1];
  var pB = pT - game.player.size[1];

  for (var b = game.numBombs - 1; b >= 0; b--) {
    var bL = game.bombs.pos[b][0]; 
    var bR = bL + game.bombs.size[0];
    var bT = game.bombs.pos[b][1];
    var bB = bT - game.bombs.size[1];


    if (bL <= pR && bR >= pL && bB <= pT && bT >= pT) {
      expireBomb(b);
      expirePlayer();
    }
  }
}


//
// Input handling
//

function clearKeyboard()
{
  // Clear the keyboard state.
  for (key in game.keysDown)
    game.keysDown[key] = false;
}


function anyKeyPressed()
{
  for (key in game.keysDown) {
    if (game.keysDown[key])
      return true;
  }
  return false;
}


function keyDown(event)
{
  game.keysDown[event.keyCode] = true;
  game.keysDown[String.fromCharCode(event.keyCode)] = true;
}


function keyUp(event)
{
  game.keysDown[event.keyCode] = false;
  game.keysDown[String.fromCharCode(event.keyCode)] = false;
}


//
// Helpers
//

function radians(angleInDegrees)
{
  return angleInDegrees * Math.PI / 180.0;
}


function clamp(low, high, val)
{
  if (val < low)
    return low;
  else if (val > high)
    return high;
  else
    return val;
}


//
// Main
//

function init()
{
  // Initialise the random number generator.
  Math.seedrandom('Invaders');

  canvas = document.getElementById("draw-canvas");
  ctx = canvas.getContext("2d");
}


function main()
{
  init();

  window.requestAnimFrame = (function() {
    return window.requestAnimationFrame ||
           window.webkitRequestAnimationFrame ||
           window.mozRequestAnimationFrame ||
           window.oRequestAnimationFrame ||
           window.msRequestAnimationFrame ||
           function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
             window.setTimeout(callback, 1000/60);
           };
  })();
  document.onkeydown = keyDown;
  document.onkeyup = keyUp;

  tick = function () {
    window.requestAnimFrame(tick);
    if (game.currentState == null)
      game.currentState = game.states.titles;
    game.currentState.draw();

    var dt = 
    game.currentState.update();
  }
  tick();
}


return {
  'main': main
};

}(); // end of the Invaders namespace.

