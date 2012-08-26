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
    'size': [],
    'pos': [],
    'color': [],
    'shape': [],
    'isFriendly': [],
  },

  // Barricade data.
  'barricades': {
  },

  // Bullets (fired by the player)
  'numBullets': 0,
  'maxBullets': 8,
  'bulletSize': null,
  'bulletColor': "#990000",
  'bulletXOfs': 0,
  'bulletYOfs': 0,
  'bulletPos': [],

  // Bombs (fired by the aliens)
  'numBombs': 0,
  'bombSize': null,
  'bombColor': "#999900",
  'bombXOfs': 0,
  'bombYOfs': 0,
  'bombPos': [],
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
  var aliensPerRow = 8;
  var cellWidth = canvas.width / (aliensPerRow + 2);
  var cellHeight = ICON_FONT_SIZE + 10;
  var shapes = "ABCDEFGH";
  var numRows = shapes.length;

  game.aliens.shape = [];
  game.aliens.size = [];
  game.aliens.pos = [];
  game.aliens.color = [];
  game.aliens.isFriendly = [];

  game.numAliens = numRows * aliensPerRow;
  y = (2 * canvas.height / 3);
  for (var row = 0; row < numRows; row++) {
    var shape = shapes[row];
    tw = ctx.measureText(shape);
    var xOfs = (cellWidth - tw.width) / 2;
    for (var i = 1; i <= aliensPerRow; i++) {
      game.aliens.shape.push(shape);
      game.aliens.size.push([ tw.width, ICON_FONT_SIZE ]);
      game.aliens.pos.push([ cellWidth * i + xOfs, y ]);
      game.aliens.color.push("#FFFFFF");
      game.aliens.isFriendly.push(false);
    }
    y -= cellHeight;
  }

  ctx.font = ICON_FONT_SIZE + "px " + TITLE_FONT_NAME;

  // Set up the bullets.
  tw = ctx.measureText('i');
  game.numBullets = 0;
  game.bulletSize = [ tw.width * 0.5, ICON_FONT_SIZE * 0.33 ];
  game.bulletXOfs = (game.player.size[0] - game.bulletSize[0]) / 2;
  game.bulletYOfs = game.bulletSize[1] + game.player.size[1];
  game.bulletPos = [];

  // Set up the bombs.
  tw = ctx.measureText('o');
  game.numBombs = 0;
  game.bombSize = [ tw.width, ICON_FONT_SIZE ];
  game.bombXOfs = (game.player.size[0] - game.bombSize[0]) / 2;
  game.bombYOfs = game.bombSize[1] / 2;
  game.bombPos = [];
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


function drawLose()
{
  drawPlaying();
  text(0.5, 0.25, 48, "you lose!");
  text(0.5, 0.15, 24, "press <space> to continue");
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
  ctx.fillStyle = game.bulletColor;
  for (var i = 0; i < game.numBullets; i++) {
    ctx.fillRect(
        game.bulletPos[i][0], game.bulletPos[i][1],
        game.bulletSize[0], game.bulletSize[1]
    );
  }
}


function drawBombs()
{
  ctx.fillStyle = game.bombColor;
  for (var i = 0; i < game.numBombs; i++) {
    drawText("o", ICON_FONT_SIZE,
        game.bombPos[i][0], game.bombPos[i][1],
        ALIGN_LEFT, ALIGN_TOP, TITLE_FONT_NAME);
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

function spawnBullet()
{
  if (game.numBullets >= game.maxBullets)
    return;

  var i = game.numBullets;
  game.bulletPos[i] = [ 0, 0 ];
  game.bulletPos[i][0] = game.player.pos[0] + game.bulletXOfs;
  game.bulletPos[i][1] = game.player.pos[1] - game.bulletYOfs;
  game.numBullets++;
}


function expireBullet(i)
{
  if (i >= game.numBullets)
    return;
  
  game.bulletPos[i] = game.bulletPos[game.numBullets - 1];
  game.numBullets--;
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

