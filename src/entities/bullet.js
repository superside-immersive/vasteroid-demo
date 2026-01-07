/**
 * Bullet Entity
 * Player projectile with sci-fi glow effect
 */

var Bullet = function () {
  this.init("bullet", [0, 0]);
  this.time = 0;
  this.bridgesH = false;
  this.bridgesV = false;
  this.postMove = this.wrapPostMove;

  /**
   * Override transform (bullets don't rotate)
   */
  this.configureTransform = function () {};

  /**
   * Draw bullet as a glowing sci-fi projectile
   */
  this.draw = function () {
    if (this.visible) {
      var ctx = this.context;
      var x = this.x;
      var y = this.y;
      
      // Calculate bullet direction for elongated shape
      var speed = Math.sqrt(this.vel.x * this.vel.x + this.vel.y * this.vel.y);
      var dirX = speed > 0 ? this.vel.x / speed : 0;
      var dirY = speed > 0 ? this.vel.y / speed : 0;
      
      // Bullet length based on speed
      var length = 8;
      var tailX = x - dirX * length;
      var tailY = y - dirY * length;
      
      ctx.save();
      ctx.lineCap = 'round';
      
      // Layer 1: Outer glow (large, faint)
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(x + dirX * 2, y + dirY * 2);
      ctx.strokeStyle = 'rgba(31, 217, 254, 0.15)';
      ctx.lineWidth = 12;
      ctx.stroke();
      
      // Layer 2: Medium glow
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(x + dirX * 2, y + dirY * 2);
      ctx.strokeStyle = 'rgba(31, 217, 254, 0.3)';
      ctx.lineWidth = 8;
      ctx.stroke();
      
      // Layer 3: Inner glow
      ctx.beginPath();
      ctx.moveTo(tailX + dirX * 2, tailY + dirY * 2);
      ctx.lineTo(x + dirX * 2, y + dirY * 2);
      ctx.strokeStyle = 'rgba(31, 217, 254, 0.6)';
      ctx.lineWidth = 5;
      ctx.stroke();
      
      // Layer 4: Core bright line
      ctx.beginPath();
      ctx.moveTo(tailX + dirX * 3, tailY + dirY * 3);
      ctx.lineTo(x + dirX * 2, y + dirY * 2);
      ctx.strokeStyle = 'rgba(200, 240, 255, 0.9)';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Layer 5: Hot center (white core)
      ctx.beginPath();
      ctx.moveTo(tailX + dirX * 4, tailY + dirY * 4);
      ctx.lineTo(x + dirX * 1, y + dirY * 1);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      
      // Front tip glow point
      ctx.beginPath();
      ctx.arc(x + dirX * 2, y + dirY * 2, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(31, 217, 254, 0.5)';
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(x + dirX * 2, y + dirY * 2, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      
      ctx.restore();
    }
  };

  /**
   * Update bullet lifetime
   * @param {number} delta - Time delta
   */
  this.preMove = function (delta) {
    if (this.visible) {
      this.time += delta;
    }
    if (this.time > 50) {
      this.visible = false;
      this.time = 0;
    }
  };

  /**
   * Handle collision
   * @param {Sprite} other - Colliding sprite
   */
  this.collision = function (other) {
    this.time = 0;
    this.visible = false;
    this.currentNode.leave(this);
    this.currentNode = null;
  };

  /**
   * Get collision point (single point for bullet)
   * @returns {Array} - Point coordinates
   */
  this.transformedPoints = function (other) {
    return [this.x, this.y];
  };
};

Bullet.prototype = new Sprite();

/**
 * Alien Bullet Entity
 * Enemy projectile with red/orange glow
 */
var AlienBullet = function () {
  this.init("alienbullet");

  /**
   * Draw bullet as a glowing enemy projectile
   */
  this.draw = function () {
    if (this.visible) {
      var ctx = this.context;
      var x = this.x;
      var y = this.y;
      
      // Calculate bullet direction
      var speed = Math.sqrt(this.vel.x * this.vel.x + this.vel.y * this.vel.y);
      var dirX = speed > 0 ? this.vel.x / speed : 0;
      var dirY = speed > 0 ? this.vel.y / speed : 0;
      
      var length = 6;
      var tailX = x - dirX * length;
      var tailY = y - dirY * length;
      
      ctx.save();
      ctx.lineCap = 'round';
      
      // Layer 1: Outer glow (red/orange)
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(x + dirX * 1, y + dirY * 1);
      ctx.strokeStyle = 'rgba(255, 100, 50, 0.2)';
      ctx.lineWidth = 10;
      ctx.stroke();
      
      // Layer 2: Medium glow
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(x + dirX * 1, y + dirY * 1);
      ctx.strokeStyle = 'rgba(255, 80, 30, 0.4)';
      ctx.lineWidth = 6;
      ctx.stroke();
      
      // Layer 3: Inner glow
      ctx.beginPath();
      ctx.moveTo(tailX + dirX * 1, tailY + dirY * 1);
      ctx.lineTo(x + dirX * 1, y + dirY * 1);
      ctx.strokeStyle = 'rgba(255, 150, 50, 0.7)';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Layer 4: Hot center
      ctx.beginPath();
      ctx.moveTo(tailX + dirX * 2, tailY + dirY * 2);
      ctx.lineTo(x, y);
      ctx.strokeStyle = 'rgba(255, 220, 150, 0.95)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      
      ctx.restore();
    }
  };
};

AlienBullet.prototype = new Bullet();
