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
    'titles':     { 'draw': drawTitles,      'update': updateTitles },

    'newGame':    { 'draw': drawNewGame,     'update': updateNewGame,     'enter': enterNewGame },

    'level1':     { 'draw': drawLevel1,      'update': updateLevel1,      'enter': enterLevel1 },
    'interlude1': { 'draw': drawInterlude1,  'update': updateInterlude1,  'enter': enterInterlude1 },
    'level2':     { 'draw': drawLevel2,      'update': updateLevel2,      'enter': enterLevel2 },
    'interlude2': { 'draw': drawInterlude2,  'update': updateInterlude2,  'enter': enterInterlude2 },
    'level3':     { 'draw': drawLevel3,      'update': updateLevel3,      'enter': enterLevel3 },
    'interlude3': { 'draw': drawInterlude3,  'update': updateInterlude3,  'enter': enterInterlude3 },
    'level4':     { 'draw': drawLevel4,      'update': updateLevel4,      'enter': enterLevel4 },
    'peaceTalks': { 'draw': drawPeaceTalks,  'update': updatePeaceTalks,  'enter': enterPeaceTalks },
    'extinction': { 'draw': drawExtinction,  'update': updateExtinction,  'enter': enterExtinction },

    'win':        { 'draw': drawWin,         'update': updateWin },
    'lose':       { 'draw': drawLose,        'update': updateLose },
    'paused':     { 'draw': drawPaused,      'update': updatePaused },
  },
  'currentState': null,

  // Input handling.
  'keysDown': {},

  // Player data.
  'player': {
    'x': 0,
    'y': 0,
    'w': 0,
    'h': 0,
    'color': "#00FF00",
    'shape': "Q",
    'speed': 128.0,   // pixels per second
    'canMove': true,  // Whether the player can move at the moment.
    'canFire': true,  // Whether the player can fire at the moment.
  },

  // Alien data.
  'numAliens': 0,
  'numAliensSpawned': 0,
  'aliens': {
    'cellWidth': 0,
    'cellHeight': 0,
    'numPerRow': 8,
    'showFriends': false,
    'speed': 48.0,      // pixels per second
    'minBombDT': 1000,  // min time, in milliseconds, between dropping two bombs.
    'bombP': 0.5,       // probability of dropping a bomb on any given frame.
    'friendColor': "#00FF00",
    'enemyColor': "#FFFFFF",
    'states': [ ALIEN_MOVE_LEFT, ALIEN_MOVE_DOWN, ALIEN_MOVE_RIGHT, ALIEN_MOVE_DOWN ],
    'state': 0,
    'x': [],
    'y': [],
    'w': [],
    'h': [],
    'shape': [],
    'isFriendly': [],
    'lastBombT': 0,
    'canMove': true,  // Whether the aliens can move at the moment.
    'canFire': true,  // Whether the aliens can fire at the moment.
  },

  // Barricade data.
  'barricades': {
  },

  // Bullets (fired by the player)
  'numBullets': 0,
  'maxBullets': 12,
  'bullets': {
    'w': 0,
    'h': 0,
    'color': "#990000",
    'speed': 192.0, // pixels per second
    'xOfs': 0,
    'yOfs': 0,
    'x': [],
    'y': [],
  },

  // Bombs (fired by the aliens)
  'numBombs': 0,
  'bombs': {
    'w': 0,
    'h': 0,
    'color': "#999900",
    'speed': 100.0, // pixels per second
    'xOfs': 0,
    'yOfs': 0,
    'x': [],
    'y': [],
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
  changeState(game.states.level1);
}


function enterNewGame()
{
  ctx.font = ICON_FONT_SIZE + "px " + ICON_FONT_NAME;

  // Set up the player.
  var tw = ctx.measureText(game.player.shape);
  game.player.x = (canvas.width - tw.width) / 2;
  game.player.y = (canvas.height - 10);
  game.player.w = tw.width - 4;
  game.player.h = ICON_FONT_SIZE / 2;

  // Set up the aliens.
  game.aliens.cellWidth = canvas.width / (game.aliens.numPerRow + 2);
  game.aliens.cellHeight = ICON_FONT_SIZE + 10;

  ctx.font = ICON_FONT_SIZE + "px " + TITLE_FONT_NAME;

  // Set up the bullets.
  tw = ctx.measureText('i');
  game.numBullets = 0;
  game.bullets.w = tw.width * 0.5;
  game.bullets.h = ICON_FONT_SIZE * 0.33;
  game.bullets.xOfs = (game.player.w - game.bullets.w) / 2;
  game.bullets.yOfs = game.bullets.h + game.player.h;

  // Set up the bombs.
  tw = ctx.measureText('o');
  game.numBombs = 0;
  game.bombs.w = tw.width * 0.5;
  game.bombs.h = ICON_FONT_SIZE * 0.33;
  game.bombs.xOfs = (game.player.w - game.bombs.w) / 2;
  game.bombs.yOfs = game.bombs.h / 2;
}


function drawPlaying()
{
  drawBackground();
  drawAliens();
  drawPlayer();
  drawBullets();
  drawBombs();
  drawEvents();
}


// Generic update function for use during the levels.
// Returns true if, after updating, the game is still in the same state.
function updatePlaying(dt)
{
  var stateOnEntry = game.currentState;

  if (game.keysDown[27]) {
    changeState(game.states.titles);
    return false;
  }
  if (game.keysDown['P']) {
    changeState(game.states.paused);
    return false;
  }

  updateBullets(dt);
  updateBombs(dt);

  collisionTestBulletsToAliens();
  collisionTestBombsToPlayer();

  updatePlayer(dt);
  updateAliens(dt);

  updateEvents(dt);
  
  var stateOnExit = game.currentState;

  return stateOnEntry == stateOnExit;
}


function drawLevel1()
{
  drawPlaying();
}


function updateLevel1()
{
  var t = Date.now();
  var dt = (t - game.lastT) / 1000.0;
  game.lastT = t;

  // Check victory conditions.
  if (game.numAliensSpawned > 0 && game.numAliens == 0) {
    changeState(game.states.interlude1);
    return;
  }

  updatePlaying(dt)
}


function enterLevel1()
{
  // Set up everything.
  resetAll();
  game.aliens.canFire = false;

  // Set up the scripted events.
  game.states.level1.pendingEvents = [
    { 't': 0.5, 'enter': function(){ spawnAlien("G", 20, 100); } },
  ];
}


function drawInterlude1()
{
  drawBackground();
  drawAliens();
  drawEvents();
}


function updateInterlude1()
{
  var t = Date.now();
  var dt = (t - game.lastT) / 1000.0;
  game.lastT = t;

  updatePlaying(dt);
}


function enterInterlude1()
{
  // Set up everything.
  resetAll();
  game.player.canMove = false;
  game.player.canFire = false;
  game.aliens.canFire = false;
  game.aliens.canMove = false;

  // Set up the scripted events.
  game.states.interlude1.pendingEvents = [
    { 't': 0.1, 'd': 1.8,
      'draw': function () {
        drawDialogue("Meanwhile, back on Zorlaxx...", 0, 0, ALIGN_MIDDLE, ALIGN_MIDDLE);
      }
    },
    { 't': 0.5, 'enter': function(){ spawnAlien("G", 100, 100); } },
    { 't': 0.5, 'enter': function(){ spawnAlien("H", 150, 80); } },
    { 't': 2.0, 'd': 2.0,
      'draw': function () {
        drawDialogue("The humans shot down our trade envoy!", 0, 10, ALIGN_MIDDLE, ALIGN_TOP);
      }
    },
    { 't': 4.0, 'd': 2.0,
      'draw': function () {
        drawDialogue("This means war!", 0, 10, ALIGN_MIDDLE, ALIGN_TOP);
      }
    },
    { 't': 6.0, 'd': 2.0,
      'draw': function () {
        drawDialogue("Maybe it was just a misunderstanding?", 0, 10, ALIGN_MIDDLE, ALIGN_BOTTOM);
      }
    },
    { 't': 8.0, 'd': 2.0,
      'draw': function () {
        drawDialogue("No one could be that stupid.", 0, 10, ALIGN_MIDDLE, ALIGN_TOP);
      }
    },
    { 't': 10.0, 'd': 2.0,
      'draw': function () {
        drawDialogue("Not even the humans!", 0, 10, ALIGN_MIDDLE, ALIGN_TOP);
      }
    },
    { 't': 13.0,
      'enter': function () {
        expireAlien(1);
        expireAlien(0);
      }
    },
    { 't': 14.0, 'enter': function () { changeState(game.states.level2); } },
  ];
}


function drawLevel2()
{
  drawPlaying();
}


function updateLevel2()
{
  var t = Date.now();
  var dt = (t - game.lastT) / 1000.0;
  game.lastT = t;

  // Check victory conditions.
  if (game.numAliensSpawned >= (4 * game.aliens.numPerRow) && game.numAliens == 0) {
    changeState(game.states.interlude2);
    return;
  }

  updatePlaying(dt);
}


function enterLevel2()
{
  // Set up everything.
  resetAll();

  // Set up the scripted events.
  var dt = (game.aliens.cellWidth * 4 + game.aliens.cellHeight) / game.aliens.speed;
  game.states.level2.pendingEvents = [
    { 't': 0.5,          'enter': function () { spawnRowOfAliens("A", 0); } },
    { 't': 0.5 + 1 * dt, 'enter': function () { spawnRowOfAliens("B", 0); } },
    { 't': 0.5 + 2 * dt, 'enter': function () { spawnRowOfAliens("C", 0); } },
    { 't': 0.5 + 3 * dt, 'enter': function () { spawnRowOfAliens("D", 0); } },
  ];
}


function drawInterlude2()
{
  drawBackground();
  drawAliens();
  drawEvents();
}


function updateInterlude2()
{
  var t = Date.now();
  var dt = (t - game.lastT) / 1000.0;
  game.lastT = t;

  updatePlaying(dt);
}


function enterInterlude2()
{
  // Set up everything.
  resetAll();
  game.player.canMove = false;
  game.player.canFire = false;
  game.aliens.canFire = false;
  game.aliens.canMove = false;

  // Set up the scripted events.
  game.states.interlude2.pendingEvents = [
    { 't': 0.5, 'enter': function(){ spawnAlien("G", 100, 100); } },
    { 't': 0.5, 'enter': function(){ spawnAlien("H", 150, 80); } },
    { 't': 0.5, 'enter': function(){ spawnAlien("I", 200, 110); } },
    { 't': 1.0, 'd': 2.0,
      'draw': function () {
        drawDialogue("We lost ALL our ships?!", 0, 10, ALIGN_MIDDLE, ALIGN_TOP);
      }
    },
    { 't': 3.0, 'd': 2.0,
      'draw': function () {
        drawDialogue("This is an outrage!", 0, 10, ALIGN_MIDDLE, ALIGN_MIDDLE);
      }
    },
    { 't': 5.0, 'd': 2.0,
      'draw': function () {
        drawDialogue("The only thing these humans understand is force.", 0, 10, ALIGN_MIDDLE, ALIGN_BOTTOM);
      }
    },
    { 't': 7.0, 'd': 2.0,
      'draw': function () {
        drawDialogue("I say we strike again, even harder!", 0, 10, ALIGN_MIDDLE, ALIGN_TOP);
      }
    },
    { 't': 10.0,
      'enter': function () {
        expireAlien(2);
        expireAlien(1);
        expireAlien(0);
      }
    },
    { 't': 11.0, 'enter': function () { changeState(game.states.level3); } }
  ];
}


function drawLevel3()
{
  drawPlaying();
}


function updateLevel3()
{
  var t = Date.now();
  var dt = (t - game.lastT) / 1000.0;
  game.lastT = t;

  // Check victory conditions.
  if (game.numAliensSpawned >= (game.aliens.numPerRow * 12) && game.numAliens == 0) {
    changeState(game.states.interlude3);
    return;
  }

  updatePlaying(dt);
}


function enterLevel3()
{
  // Set up everything.
  resetAll();

  // Set up the scripted events.
  game.states.level3.pendingEvents = [
    { 't': 0.5, 'enter': function(){ spawnRowOfAliens("A", 0); } },
    { 't': 1.5, 'enter': function(){ spawnRowOfAliens("B", 0); } },
    { 't': 2.5, 'enter': function(){ spawnRowOfAliens("C", 0); } },
    { 't': 3.5, 'enter': function(){ spawnRowOfAliens("D", 0); } },
    { 't': 4.0, 'd': 2.0,
      'draw': function () {
        drawDialogue("Die, human!", 0, 10, ALIGN_MIDDLE, ALIGN_TOP);
      }
    },
    { 't': 4.5, 'enter': function(){ spawnRowOfAliens("A", 0); } },
    { 't': 5.5, 'enter': function(){ spawnRowOfAliens("B", 0); } },
    { 't': 6.5, 'enter': function(){ spawnRowOfAliens("C", 0); } },
    { 't': 7.5, 'enter': function(){ spawnRowOfAliens("D", 0); } },
    { 't': 8.0, 'd': 2.0,
      'draw': function () {
        drawDialogue("Soon you will be extinct!", 0, 10, ALIGN_MIDDLE, ALIGN_TOP);
      }
    },
    { 't': 8.5, 'enter': function(){ spawnRowOfAliens("A", 0); } },
    { 't': 9.5, 'enter': function(){ spawnRowOfAliens("B", 0); } },
    { 't': 10.5,'enter': function(){ spawnRowOfAliens("C", 0); } },
    { 't': 11.5,'enter': function(){ spawnRowOfAliens("D", 0); } },
  ];
}


function drawInterlude3()
{
  drawPlaying();
}


function updateInterlude3()
{
  var t = Date.now();
  var dt = (t - game.lastT) / 1000.0;
  game.lastT = t;

  updatePlaying(dt);
}


function enterInterlude3()
{
  // Set up everything.
  game.player.canMove = false;
  game.player.canFire = false;
  game.aliens.canFire = false;
  game.aliens.canMove = false;

  // Set up the scripted events.
  game.states.interlude3.pendingEvents = [
    { 't': 0.0, 'd': 1.0,
      'draw': function () {
        drawDialogue("Wait!", 0, 10, ALIGN_MIDDLE, ALIGN_TOP);
      }
    },
    { 't': 1.0, 'd': 2.0,
      'draw': function () {
        drawDialogue("Look... it doesn't have to be like this!", 0, 10, ALIGN_MIDDLE, ALIGN_TOP);
      }
    },
    { 't': 3.0, 'd': 2.0,
      'draw': function () {
        drawDialogue("Some of us would rather work this out peacefully.", 0, 10, ALIGN_MIDDLE, ALIGN_TOP);
      }
    },
    { 't': 5.0, 'enter': function(){ game.aliens.showFriends = true; } },
    { 't': 6.0, 'd': 2.0,
      'draw': function () {
        drawDialogue("What?! This... this is treason!", 0, 10, ALIGN_MIDDLE, ALIGN_MIDDLE);
      }
    },
    { 't': 8.0, 'd': 2.0,
      'draw': function () {
        drawDialogue("I'll have you all court martialled!", 0, 10, ALIGN_MIDDLE, ALIGN_MIDDLE);
      }
    },
    { 't': 10.0, 'd': 2.0,
      'draw': function () {
        drawDialogue("Attack!", 0, 10, ALIGN_MIDDLE, ALIGN_MIDDLE);
      }
    },
    { 't': 11.0, 'enter': function () { changeState(game.states.level4); } },
  ];
}


function drawLevel4()
{
  drawPlaying();
}


function updateLevel4()
{
  var t = Date.now();
  var dt = (t - game.lastT) / 1000.0;
  game.lastT = t;

  // Check victory conditions.
  var numFriendlies = 0;
  var numHostiles = 0;
  for (var i = 0; i < game.numAliens; i++) {
    if (game.aliens.isFriendly[i])
      numFriendlies++;
    else
      numHostiles++;
  }
  if (numFriendlies >= 2 * numHostiles) {
    changeState(game.states.peaceTalks);
    return;
  }
  else if (numHostiles >= 2 * numFriendlies) {
    changeState(game.states.extinction);
    return;
  }

  updatePlaying(dt);

  var dSpawnT = (game.lastT - game.states.level4.lastSpawnT) / 1000.0;
  if (dSpawnT > 1.0) {
    spawnRowOfAliens("A", 0);
    game.states.level4.lastSpawnT = game.lastT;
  }
}


function enterLevel4()
{
  game.states.level4.lastSpawnT = game.lastT;
}


function drawPeaceTalks()
{
  drawPlaying();
}


function updatePeaceTalks()
{
  var t = Date.now();
  var dt = (t - game.lastT) / 1000.0;
  game.lastT = t;

  updatePlaying(dt);
}


function enterPeaceTalks()
{
  // Set up everything.
  game.player.canMove = false;
  game.player.canFire = false;
  game.aliens.canFire = false;
  game.aliens.canMove = false;

  // Set up the scripted events.
  game.states.peaceTalks.pendingEvents = [
    { 't': 0.0, 'd': 2.0,
      'draw': function () {
        drawDialogue("Enough!!", 0, 10, ALIGN_LEFT, ALIGN_TOP);
      }
    },
    { 't': 2.0, 'd': 2.0,
      'draw': function () {
        drawDialogue("This madness must end.", 0, 10, ALIGN_LEFT, ALIGN_TOP);
      }
    },
    { 't': 4.0, 'd': 2.0,
      'draw': function () {
        drawDialogue("Human, we apologise.", 0, 10, ALIGN_LEFT, ALIGN_TOP);
      }
    },
    { 't': 6.0, 'd': 2.0,
      'draw': function () {
        drawDialogue("We would make peace with you, if you'll let us.", 0, 10, ALIGN_LEFT, ALIGN_TOP);
      }
    },
    { 't': 10.0, 'enter': function () { changeState(game.states.win); } },
  ];
}


function drawExtinction()
{
  drawPlaying();
}


function updateExtinction()
{
  var t = Date.now();
  var dt = (t - game.lastT) / 1000.0;
  game.lastT = t;

  updatePlaying(dt);

  var dSpawnT = (game.lastT - game.states.level4.lastSpawnT) / 1000.0;
  if (dSpawnT > 1.0) {
    var shapes = "ABCDEFGHI";
    var i = Math.floor(Math.random() * (shapes.length - 1));
    spawnRowOfAliens(shapes[i], 0);
  }
}


function enterExtinction()
{
  game.showFriends = false;
}


function drawWin()
{
  drawPlaying();
  drawText('You win!', TITLE_FONT_SIZE, 0, 0, ALIGN_MIDDLE, ALIGN_MIDDLE);
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
  drawPlaying();
  drawText('You lose!', TITLE_FONT_SIZE, 0, 0, ALIGN_MIDDLE, ALIGN_MIDDLE);
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
  drawPlaying();
  drawText('paused', TITLE_FONT_SIZE, 0, 0, ALIGN_MIDDLE, ALIGN_MIDDLE);
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
  drawIcon(game.player.shape, game.player.x, game.player.y);
}


function drawAliens()
{
  for (var i = 0; i < game.numAliens; i++) {
    if (game.aliens.showFriends && game.aliens.isFriendly[i])
      ctx.fillStyle = game.aliens.friendColor;
    else
      ctx.fillStyle = game.aliens.enemyColor;
    drawIcon(game.aliens.shape[i], game.aliens.x[i], game.aliens.y[i]);
  }
}


function drawBullets()
{
  ctx.fillStyle = game.bullets.color;
  for (var i = 0; i < game.numBullets; i++)
    ctx.fillRect(game.bullets.x[i], game.bullets.y[i], game.bullets.w, game.bullets.h);
}


function drawBombs()
{
  ctx.fillStyle = game.bombs.color;
  for (var i = 0; i < game.numBombs; i++)
    ctx.fillRect(game.bombs.x[i], game.bombs.y[i], game.bombs.w, game.bombs.h);
}


function drawEvents()
{
  if (!game.currentState.activeEvents)
    return;

  var active = game.currentState.activeEvents;
  for (var i = 0; i < active.length; i++) {
    var ev = active[i];
    if (ev.draw)
      ev.draw();
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
    textY = size + y;
  else if (valign == ALIGN_BOTTOM)
    textY = canvas.height - y;
  else
    textY = canvas.height / 2 + y;

  ctx.fillText(msg, textX, textY);
}


function drawIcon(icon, x, y)
{
  ctx.font = ICON_FONT_SIZE + "px " + ICON_FONT_NAME;
  ctx.fillText(icon, x, y);
}


function drawDialogue(msg, x, y, halign, valign)
{
  drawText(msg, DIALOGUE_FONT_SIZE, x, y, halign, valign, DIALOGUE_FONT_NAME);
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

  var pFriendly = 0.4;

  var xOfs = (game.aliens.cellWidth - tw.width) / 2;
  for (var i = 1; i <= game.aliens.numPerRow; i++) {
    game.aliens.shape.push(shape);
    game.aliens.w.push(tw.width);
    game.aliens.h.push(ICON_FONT_SIZE);
    game.aliens.x.push(game.aliens.cellWidth * i + xOfs);
    game.aliens.y.push(y);
    game.aliens.isFriendly.push(Math.random() < pFriendly);
    game.numAliens++;
    game.numAliensSpawned++;
  }
}


function spawnAlien(shape, x, y)
{
  ctx.font = ICON_FONT_SIZE + "px " + ICON_FONT_NAME;
  tw = ctx.measureText(shape);

  var xOfs = (game.aliens.cellWidth - tw.width) / 2;
  game.aliens.shape.push(shape);
  game.aliens.w.push(tw.width);
  game.aliens.h.push(ICON_FONT_SIZE);
  game.aliens.x.push(x);
  game.aliens.y.push(y);
  game.aliens.isFriendly.push(false);
  game.numAliens++;
  game.numAliensSpawned++;
}


function expireAlien(i)
{
  if (i >= game.numAliens)
    return;

  var j = game.numAliens - 1;
  game.aliens.shape[i] = game.aliens.shape[j];
  game.aliens.w[i] = game.aliens.w[j];
  game.aliens.h[i] = game.aliens.h[j];
  game.aliens.x[i] = game.aliens.x[j];
  game.aliens.y[i] = game.aliens.y[j];
  game.aliens.isFriendly[i] = game.aliens.isFriendly[j];
  game.numAliens--;
}


function spawnBullet()
{
  if (game.numBullets >= game.maxBullets)
    return;

  var i = game.numBullets;
  game.bullets.x[i] = game.player.x + game.bullets.xOfs;
  game.bullets.y[i] = game.player.y - game.bullets.yOfs;
  game.numBullets++;
}


function expireBullet(i)
{
  if (i >= game.numBullets)
    return;
  
  var j = game.numBullets - 1;
  game.bullets.x[i] = game.bullets.x[j];
  game.bullets.y[i] = game.bullets.y[j];
  game.numBullets--;
}


function spawnBomb(alienIndex)
{
  var i = game.numBombs;
  game.bombs.x[i] = game.aliens.x[alienIndex];
  game.bombs.y[i] = game.aliens.y[alienIndex];
  game.numBombs++;

  game.aliens.lastBombT = game.lastT;
}


function expireBomb(i)
{
  if (i >= game.numBombs)
    return;

  var j = game.numBombs - 1;
  game.bombs.x[i] = game.bombs.x[j];
  game.bombs.y[i] = game.bombs.y[j];
  game.numBombs--;
}


//
// Generic player and enemy logic
//

function resetAll()
{
  resetPlayer();
  resetAliens();
  resetBullets();
  resetBombs();
}


function resetPlayer()
{
  game.player.canMove = true;
  game.player.canFire = true;
}


function updatePlayer(dt)
{
  if (game.player.canFire && game.keysDown[' ']) {
    spawnBullet();
    game.keysDown[' '] = false;
  }

  if (game.player.canMove) {
    var speed = game.player.speed * dt;
    var move = 0;
    if (game.keysDown[KEY_LEFT_ARROW])
      move -= speed;
    if (game.keysDown[KEY_RIGHT_ARROW])
      move += speed;
    var minX = 0;
    var maxX = canvas.width - game.player.w;
    game.player.x = clamp(minX, maxX, game.player.x + move);
  }
}


function resetAliens()
{
  game.numAliens = 0;
  game.numAliensSpawned = 0;
  game.aliens.showFriends = false;
  game.aliens.state = ALIEN_MOVE_LEFT;
  game.aliens.w = [];
  game.aliens.h = [];
  game.aliens.x = [];
  game.aliens.y = [];
  game.aliens.shape = [];
  game.aliens.isFriendly = [];
  game.aliens.lastBombT = game.lastT;
  game.aliens.canMove = true;
  game.aliens.canFire = false;
}


function updateAliens(dt)
{
  if (game.numAliens == 0)
    return;

  var lowX = game.aliens.x[0];
  var highX = lowX + game.aliens.w[0];
  var lowY = game.aliens.y[0] - game.aliens.h[0];
  var highY = lowY + game.aliens.h[0];

  for (var i = 1; i < game.numAliens; i++) {
    var x = game.aliens.x[i];
    var y = game.aliens.y[i] - game.aliens.h[i];
    var x2 = x + game.aliens.w[i];
    var y2 = y + game.aliens.h[i];

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
    game.aliens.x[i] += dx;
    game.aliens.y[i] += dy;
  }

  moveDir = game.aliens.states[game.aliens.state];
  var dtBomb = game.lastT - game.aliens.lastBombT;
  var canBomb = game.aliens.canFire && (dtBomb > game.aliens.minBombDT);
  canBomb = canBomb && (moveDir == ALIEN_MOVE_LEFT || moveDir == ALIEN_MOVE_RIGHT);
  if (canBomb) {
    if (Math.random() < game.aliens.bombP) {
      var i = Math.floor(Math.random() * game.numAliens);
      spawnBomb(i);
    }
  }
}


function resetBullets()
{
  game.numBullets = 0;
  game.bullets.x = [];
  game.bullets.y = [];
}


function updateBullets(dt)
{
  var move = game.bullets.speed * dt;
  for (var i = game.numBullets - 1; i >= 0; i--) {
    game.bullets.y[i] -= move;
    if (game.bullets.y[i] < -game.bullets.h)
      expireBullet(i);
  }
}


function resetBombs()
{
  game.numBombs = 0;
  game.bombs.x = [];
  game.bombs.y = [];
}


function updateBombs(dt)
{
  var move = game.bombs.speed * dt;
  for (var i = game.numBombs - 1; i >= 0; i--) {
    game.bombs.y[i] += move;
    if (game.bombs.y[i] > canvas.height)
      expireBomb(i);
  }
}


function updateEvents(dt)
{
  var levelT = (game.lastT - game.lastStateT) / 1000.0;

  // Save the current state, because the events may change it.
  var state = game.currentState;
  if (!state.activeEvents)
    state.activeEvents = [];

  // Expire old events
  var active = state.activeEvents;
  var newEvents = []
  for (var i = 0; i < active.length; i++) {
    var ev = active[i];
    if (!ev.d || levelT >= ev.t + ev.d) {
      if (ev.leave)
        ev.leave();
    }
    else {
      newEvents.push(ev);
    }
  }
  state.activeEvents = newEvents;
  active = state.activeEvents;

  // Update current events
  for (var i = 0; i < active.length; i++) {
    if (ev.update)
      ev.update(dt);
  }

  // Activate new events
  var pending = state.pendingEvents;
  if (!pending)
    return;
  newEvents = [];
  for (var i = 0; i < pending.length; i++) {
    var ev = pending[i];
    if (ev.t <= levelT) {
      if (ev.enter)
        ev.enter();
      if (ev.d && ev.d > 0.0)
        active.push(ev);
    }
    else {
      newEvents.push(ev);
    }
  }
  state.pendingEvents = newEvents;
}


//
// Collision testing and handling
//

function collisionTestBulletsToAliens()
{
  for (var a = game.numAliens - 1; a >= 0; a--) {
    var aL = game.aliens.x[a];
    var aR = aL + game.aliens.w[a];
    var aT = game.aliens.y[a];
    var aB = aT - game.aliens.h[a];

    for (var b = game.numBullets - 1; b >= 0; b--) {
      var bL = game.bullets.x[b]; 
      var bR = bL + game.bullets.w;
      var bT = game.bullets.y[b];
      var bB = bT - game.bullets.h;

      if (bL <= aR && bR >= aL && bB <= aT && bT >= aT) {
        expireAlien(a);
        expireBullet(b);
      }
    }
  }
}


function collisionTestBombsToPlayer()
{
  var pL = game.player.x;
  var pR = pL + game.player.w;
  var pT = game.player.y;
  var pB = pT - game.player.h;

  for (var b = game.numBombs - 1; b >= 0; b--) {
    var bL = game.bombs.x[b]; 
    var bR = bL + game.bombs.w;
    var bT = game.bombs.y[b];
    var bB = bT - game.bombs.h;


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
    game.currentState.update();
  }
  tick();
}


return {
  'main': main
};

}(); // end of the Invaders namespace.

