/**
 * Ship Entity
 * Player-controlled spaceship
 */

// Generate offsets so clones form readable triangles per upgrade level
function getFractalOffsets(level) {
  var offsets = [{ x: 0, y: 0 }];
  var spacing = 16; // base distance between ships for clarity

  for (var l = 0; l < level; l++) {
    var next = [];
    for (var i = 0; i < offsets.length; i++) {
      var base = offsets[i];
      next.push({ x: base.x, y: base.y });
      next.push({ x: base.x + spacing, y: base.y });
      next.push({ x: base.x + spacing * 0.5, y: base.y + spacing * 0.9 });
    }
    offsets = next;
    spacing = Math.max(8, spacing * 0.72); // shrink gently for higher levels without overlap
  }

  // Center the whole formation around (0,0) so the ship position is the group's center
  var sumX = 0;
  var sumY = 0;
  for (var i = 0; i < offsets.length; i++) {
    sumX += offsets[i].x;
    sumY += offsets[i].y;
  }
  var meanX = sumX / offsets.length;
  var meanY = sumY / offsets.length;
  for (var i = 0; i < offsets.length; i++) {
    offsets[i].x -= meanX;
    offsets[i].y -= meanY;
  }

  return offsets;
}

// Approximate a sprite radius for size comparisons (uses clusterRadius or polygon bounds)
function approxSpriteRadius(sprite) {
  if (sprite && sprite.clusterRadius) {
    return Math.abs(sprite.clusterRadius) * (sprite.scale || 1);
  }
  if (!sprite || !sprite.points || sprite.points.length < 2) return 20;
  var maxR = 0;
  for (var i = 0; i < sprite.points.length; i += 2) {
    var r = Math.sqrt(sprite.points[i] * sprite.points[i] + sprite.points[i + 1] * sprite.points[i + 1]);
    if (r > maxR) maxR = r;
  }
  return maxR * (sprite.scale || 1);
}

var Ship = function () {
  // Ship shape based on A.svg path - high resolution polygon
  this.init("ship", [
    0.0, -18.1,     // top center point
    3.5, -16.1,     // right of top
    7.0, -10.0,     // right upper slope
    11.0, -2.0,     // right mid-upper
    14.5, 6.0,      // right mid
    17.5, 13.5,     // right lower outer
    16.3, 16.9,     // right bottom curve
    14.0, 18.3,     // right bottom
    12.7, 18.3,     // right base
    10.5, 16.5,     // right inner start
    9.0, 13.5,      // right inner
    6.0, 6.0,       // right inner mid
    3.0, -1.0,      // right inner upper
    0.0, -5.3,      // center notch (top of A hole)
    -3.0, -1.0,     // left inner upper
    -6.0, 6.0,      // left inner mid
    -9.0, 13.5,     // left inner
    -10.5, 16.5,    // left inner start
    -12.7, 18.3,    // left base
    -14.0, 18.3,    // left bottom
    -16.3, 16.9,    // left bottom curve
    -17.5, 13.5,    // left lower outer
    -14.5, 6.0,     // left mid
    -11.0, -2.0,    // left mid-upper
    -7.0, -10.0,    // left upper slope
    -3.5, -16.1     // left of top
  ]);

  // Exhaust flame
  this.children.exhaust = new Sprite();
  this.children.exhaust.init("exhaust", [-4, 20, 0, 28, 4, 20]);

  this.bulletCounter = 0;
  this.hitCooldown = 0;
  this.postMove = this.wrapPostMove;
  this.collidesWith = ["asteroid", "bigalien", "alienbullet"];

  /**
   * Pre-move update - handles input and physics
   * @param {number} delta - Time delta
   */
  this.preMove = function (delta) {
    // Rotation control
    if (KEY_STATUS.left) {
      this.vel.rot = -6;
    } else if (KEY_STATUS.right) {
      this.vel.rot = 6;
    } else {
      this.vel.rot = 0;
    }

    // Thrust control
    if (KEY_STATUS.up) {
      var rad = ((this.rot - 90) * Math.PI) / 180;
      this.acc.x = 0.5 * Math.cos(rad);
      this.acc.y = 0.5 * Math.sin(rad);
      this.children.exhaust.visible = Math.random() > 0.1;
    } else {
      this.acc.x = 0;
      this.acc.y = 0;
      this.children.exhaust.visible = false;
    }

    // Shooting - fire multiple bullets based on upgrade level
    if (this.bulletCounter > 0) {
      this.bulletCounter -= delta;
    }

    if (this.hitCooldown > 0) {
      this.hitCooldown -= delta;
    }
    
    if (KEY_STATUS.space) {
      if (this.bulletCounter <= 0) {
        this.bulletCounter = 10;
        
        // Double shot at upgrade level 2+ (requested)
        var bulletsToFire = (Game.upgradeLevel >= 2) ? 2 : 1;
        var bulletsFired = 0;
        
        for (var i = 0; i < this.bullets.length && bulletsFired < bulletsToFire; i++) {
          if (!this.bullets[i].visible) {
            SFX.laser();
            var bullet = this.bullets[i];
            var rad = ((this.rot - 90) * Math.PI) / 180;
            
            // Fire from the ship center with slight angle spread for multiple bullets
            var angleSpread = 0;
            if (bulletsToFire > 1) {
              // Spread bullets in a small cone
              angleSpread = (bulletsFired - (bulletsToFire - 1) / 2) * 0.15;
            }
            var spreadRad = rad + angleSpread;
            var spreadX = Math.cos(spreadRad);
            var spreadY = Math.sin(spreadRad);
            
            // Spawn from the CENTER of the whole formation (group centered in draw)
            bullet.x = this.x + spreadX * 4;
            bullet.y = this.y + spreadY * 4;
            bullet.vel.x = 8 * spreadX;
            bullet.vel.y = 8 * spreadY;
            bullet.visible = true;
            bulletsFired++;
          }
        }
      }
    }

    // Limit speed
    if (Math.sqrt(this.vel.x * this.vel.x + this.vel.y * this.vel.y) > 8) {
      this.vel.x *= 0.95;
      this.vel.y *= 0.95;
    }
  };

  /**
   * Handle collision with another sprite
   * @param {Sprite} other - Colliding sprite
   */
  this.collision = function (other) {
    // Prevent multiple hits in the same frame/edge-bridge pass
    if (this.hitCooldown > 0) {
      return;
    }

    // Always downgrade if we have any upgrades (acts as shield)
    if (Game.upgradeLevel > 0) {
      SFX.explosion();
      Game.explosionAt(other.x, other.y);
      Game.upgradeHits++;
      // Recompute immediately so a second collision this frame can't spend a life
      var earnedSteps = Math.max(0, Math.floor(Game.score / Game.upgradeStepScore));
      if (Game.upgradeHits > earnedSteps) Game.upgradeHits = earnedSteps;
      var available = earnedSteps - Game.upgradeHits;
      Game.upgradeLevel = Math.max(0, Math.min(Game.upgradeMaxLevel, available));
      // Small knockback to separate from the collision
      this.vel.x *= -0.4;
      this.vel.y *= -0.4;
      this.hitCooldown = 15;
      return;
    }

    // Only lose life when at base level (single ship, no upgrades)
    SFX.explosion();
    Game.explosionAt(other.x, other.y);
    Game.FSM.state = 'player_died';
    this.visible = false;
    this.currentNode.leave(this);
    this.currentNode = null;
    Game.lives--;
  };
};

Ship.prototype = new Sprite();

// Draw multiple tightly overlapped ships according to current upgrade level
Ship.prototype.draw = function () {
  if (!this.visible) return;

  var ctx = this.context;
  var offsets = getFractalOffsets(Game.upgradeLevel);
  var lineW = 1.0 / this.scale;

  var count = offsets.length;
  for (var i = 0; i < count; i++) {
    var off = offsets[i];
    ctx.save();
    ctx.translate(off.x, off.y);
    ctx.lineWidth = lineW;

    // Smooth sequenced transparency across the formation
    if (count > 1) {
      ctx.globalAlpha = 1.0 - (i / (count - 1)) * 0.55;
    } else {
      ctx.globalAlpha = 1.0;
    }

    for (var child in this.children) {
      this.children[child].draw();
    }

    ctx.beginPath();
    ctx.moveTo(this.points[0], this.points[1]);
    for (var p = 1; p < this.points.length / 2; p++) {
      var xi = p * 2;
      var yi = xi + 1;
      ctx.lineTo(this.points[xi], this.points[yi]);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  }
};
