/**
 * Game State Machine
 * Handles game states and transitions
 */

var GameFSM = {
  timer: null,
  state: 'boot',

  /**
   * Initial boot state
   */
  boot: function () {
    Game.spawnAsteroids(5);
    this.state = 'waiting';
  },

  /**
   * Waiting for player to start
   */
  waiting: function () {
    if (Game.skipWaiting) {
      window.gameStart = true;
      Game.skipWaiting = false;
    }
    if (KEY_STATUS.space || window.gameStart) {
      KEY_STATUS.space = false;
      window.gameStart = false;
      this.state = 'start';
    }
  },

  /**
   * Start a new game
   */
  start: function () {
    // Clear existing asteroids
    for (var i = 0; i < Game.sprites.length; i++) {
      if (Game.sprites[i].name == 'asteroid') {
        Game.sprites[i].die();
      } else if (Game.sprites[i].name == 'bullet' ||
                 Game.sprites[i].name == 'bigalien') {
        Game.sprites[i].visible = false;
      }
    }

    Game.score = 0;
    Game.lives = 2;
    Game.upgradeLevel = 0;
    Game.upgradeHits = 0;
    Game.totalAsteroids = 2;
    Game.spawnAsteroids();

    Game.nextBigAlienTime = Date.now() + 30000 + (30000 * Math.random());

    this.state = 'spawn_ship';
  },

  /**
   * Spawn player ship
   */
  spawn_ship: function () {
    Game.ship.x = Game.canvasWidth / 2;
    Game.ship.y = Game.canvasHeight / 2;
    
    if (Game.ship.isClear()) {
      Game.ship.rot = 0;
      Game.ship.vel.x = 0;
      Game.ship.vel.y = 0;
      Game.ship.visible = true;
      this.state = 'run';
    }
  },

  /**
   * Main gameplay state
   */
  run: function () {
    // Check if all asteroids destroyed
    var asteroidsExist = false;
    for (var i = 0; i < Game.sprites.length; i++) {
      if (Game.sprites[i].name == 'asteroid') {
        asteroidsExist = true;
        break;
      }
    }
    
    if (!asteroidsExist) {
      this.state = 'new_level';
    }

    // Spawn alien
    if (!Game.bigAlien.visible && Date.now() > Game.nextBigAlienTime) {
      Game.bigAlien.visible = true;
      Game.nextBigAlienTime = Date.now() + (30000 * Math.random());
    }
  },

  /**
   * Advance to next level
   */
  new_level: function () {
    if (this.timer == null) {
      this.timer = Date.now();
    }
    
    if (Date.now() - this.timer > 1000) {
      this.timer = null;
      Game.totalAsteroids++;
      if (Game.totalAsteroids > 12) Game.totalAsteroids = 12;
      Game.spawnAsteroids();
      this.state = 'run';
    }
  },

  /**
   * Player died state
   */
  player_died: function () {
    if (Game.lives < 0) {
      this.state = 'end_game';
    } else {
      if (this.timer == null) {
        this.timer = Date.now();
      }
      
      if (Date.now() - this.timer > 1000) {
        this.timer = null;
        this.state = 'spawn_ship';
      }
    }
  },

  /**
   * Game over state
   */
  end_game: function () {
    Text.renderText('GAME OVER', 50, Game.canvasWidth/2 - 160, Game.canvasHeight/2 + 10);
    
    if (this.timer == null) {
      this.timer = Date.now();
    }
    
    if (Date.now() - this.timer > 5000) {
      this.timer = null;
      this.state = 'waiting';
    }

    window.gameStart = false;
  },

  /**
   * Execute current state
   */
  execute: function () {
    this[this.state]();
  }
};
