/**
 * Game Object
 * Main game state and configuration
 */

var Game = {
  score: 0,
  totalAsteroids: 5,
  lives: 0,

  // Fractal upgrade state (triples visual ship clones per level)
  upgradeLevel: 0,
  upgradeHits: 0,
  upgradeMaxLevel: 3,
  upgradeStepScore: 1000,

  canvasWidth: 800,
  canvasHeight: 600,

  sprites: [],
  ship: null,
  bigAlien: null,

  skipWaiting: false,
  nextBigAlienTime: null,

  FSM: null,

  /**
   * Spawn asteroid clusters
   * @param {number} count - Number of asteroids to spawn
   */
  spawnAsteroids: function (count) {
    if (!count) count = this.totalAsteroids;
    
    for (var i = 0; i < count; i++) {
      var roid = new Asteroid();
      var charCount = ASTEROID_CHAR_COUNT || 200;
      roid.setSize(charCount, 55 + Math.random() * 20);

      roid.x = Math.random() * this.canvasWidth;
      roid.y = Math.random() * this.canvasHeight;
      
      while (!roid.isClear()) {
        roid.x = Math.random() * this.canvasWidth;
        roid.y = Math.random() * this.canvasHeight;
      }
      
      roid.vel.x = Math.random() * 4 - 2;
      roid.vel.y = Math.random() * 4 - 2;
      roid.vel.rot = Math.random() * 2 - 1;
      roid.scale = 1;
      
      Game.sprites.push(roid);
    }
  },

  /**
   * Create explosion at position
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  explosionAt: function (x, y) {
    var splosion = new Explosion();
    splosion.x = x;
    splosion.y = y;
    splosion.visible = true;
    Game.sprites.push(splosion);
  }
};
