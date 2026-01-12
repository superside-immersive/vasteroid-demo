/**
 * Game State Machine
 * Handles game states and transitions
 */

var GameFSM = {
  timer: null,
  state: 'boot',
  _startRequested: false,

  /**
   * Initial boot state
   */
  boot: function () {
    Game.spawnAsteroids(5);
    if (window.IntroManager && typeof IntroManager.reset === 'function') {
      IntroManager.reset();
    }
    Game.skipWaiting = false;
    this._startRequested = false;
    this.state = 'waiting';
  },

  /**
   * Waiting for player to start
   */
  waiting: function () {
    if (window.GameOverUI) {
      GameOverUI.hide();
    }
    // Ensure intro is ready each time we land in waiting
    if (window.IntroManager && IntroManager.state && IntroManager.state.done) {
      IntroManager.reset();
      Game.skipWaiting = false;
    }
    // Start idle animation while waiting (but not during the START intro sequence)
    if (!this._startRequested && window.IdleAnimationManager && !IdleAnimationManager.isActive()) {
      IdleAnimationManager.start();
    }

    // User pressed START/Space: play intro zoom-in (do not instantly hide logo).
    if (!this._startRequested && (KEY_STATUS.space || window.gameStart)) {
      KEY_STATUS.space = false;
      window.gameStart = false;
      this._startRequested = true;
      Game.skipWaiting = false;
      if (window.IdleAnimationManager) { IdleAnimationManager.stop(); }
      if (window.IntroManager && typeof IntroManager.requestPlay === 'function') {
        IntroManager.reset();
        IntroManager.requestPlay();
      }
    }

    // Intro signals when to begin the game.
    if (this._startRequested && Game.skipWaiting) {
      Game.skipWaiting = false;
      this._startRequested = false;

      // Prevent a one-frame flash of the "waiting" asteroids/UFO when we switch out of waiting.
      for (var i = 0; i < Game.sprites.length; i++) {
        var s = Game.sprites[i];
        if (s && (s.name === 'asteroid' || s.name === 'bigalien' || s.name === 'alienbullet')) {
          s.visible = false;
        }
      }

      this.state = 'start';
    }
  },

  /**
   * Start a new game
   */
  start: function () {
    if (window.Scoreboard) { 
      Scoreboard.hide();
    }
    if (window.GameOverUI) { GameOverUI.hide(); }
    if (window.IdleAnimationManager) { IdleAnimationManager.stop(); }
    // Clear existing asteroids
    for (var i = 0; i < Game.sprites.length; i++) {
      if (Game.sprites[i].name == 'asteroid') {
        // Avoid one-frame flicker by hiding immediately
        Game.sprites[i].visible = false;
        Game.sprites[i].die();
      } else if (Game.sprites[i].name == 'bullet' ||
                 Game.sprites[i].name == 'bigalien') {
        Game.sprites[i].visible = false;
      } else if (Game.sprites[i].name == 'alienbullet') {
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

    // Keep ship visible immediately; state gate controls when it can move/shoot.
    Game.ship.visible = true;
    
    if (Game.ship.isClear()) {
      Game.ship.rot = 0;
      Game.ship.vel.x = 0;
      Game.ship.vel.y = 0;
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
      if (window.LevelTransitionManager) {
        LevelTransitionManager.start(Game.ship);
      }

      // Hide UFO + any alien bullets during the level transition
      if (Game.bigAlien) {
        Game.bigAlien.visible = false;
      }
      for (var i = 0; i < Game.sprites.length; i++) {
        if (Game.sprites[i].name == 'alienbullet') {
          Game.sprites[i].visible = false;
        }
      }
      // Push next UFO spawn a bit so it won't pop in right after transition
      Game.nextBigAlienTime = Date.now() + 12000;
    }
    var hold = (window.LevelTransitionManager ? 5000 : 1000);
    if ((Date.now() - this.timer > hold) && (!window.LevelTransitionManager || !LevelTransitionManager.isActive())) {
      this.timer = null;
      Game.totalAsteroids++;
      if (Game.totalAsteroids > 12) Game.totalAsteroids = 12;
      Game.spawnAsteroids(null, { velY: [1.2, 3.2], velX: [-2, 2] });
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
    if (window.GameOverUI) {
      if (this.timer == null) {
        this.timer = Date.now();
        GameOverUI.start(Game.score);
      }

      if (GameOverUI.readyForRestart() && (KEY_STATUS.space || window.gameStart)) {
        KEY_STATUS.space = false;
        window.gameStart = false;
        this.timer = null;
        Game.skipWaiting = false;
        if (window.IntroManager && typeof IntroManager.reset === 'function') {
          IntroManager.reset();
        }
        this._startRequested = false;
        this.state = 'boot';
        return;
      }
    } else {
      Text.renderText('GAME OVER', 50, Game.canvasWidth/2 - 160, Game.canvasHeight/2 + 10);
      if (this.timer == null) {
        this.timer = Date.now();
      }
      if (Date.now() - this.timer > 5000) {
        this.timer = null;
        if (window.IntroManager && typeof IntroManager.reset === 'function') {
          IntroManager.reset();
        }
        this._startRequested = false;
        this.state = 'boot';
      }
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
