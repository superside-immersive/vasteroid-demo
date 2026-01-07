/**
 * Intro Animation
 * Logo animation at game start
 */

var IntroManager = {
  logo: null,
  logoLoaded: false,
  logoSize: { w: 1438, h: 356 },

  state: {
    done: false,
    startTime: null,
    duration: 5000,
    fadeStart: 3600,
    shipAppear: 1400,
    endHold: 0,
    targetScale: null,
    gameTriggered: false
  },

  /**
   * Initialize intro logo
   */
  init: function() {
    var self = this;
    this.logo = new Image();
    // Official asset location
    this.logo.src = 'assets/images/logo.svg';

    this.logo.onload = function() {
      self.logoLoaded = true;
      if (self.logo.naturalWidth && self.logo.naturalHeight) {
        self.logoSize = { w: self.logo.naturalWidth, h: self.logo.naturalHeight };
      }
    };

    this.logo.onerror = function() {
      // Backwards-compatible fallbacks (older layouts)
      if (self.logo.src && self.logo.src.indexOf('assets/images/logo.svg') !== -1) {
        self.logo.src = 'LOGO.svg';
        return;
      }
      if (self.logo.src && self.logo.src.indexOf('LOGO.svg') !== -1) {
        self.logo.src = 'logo.svg';
      }
    };
  },

  /**
   * Render intro animation
   * @param {CanvasRenderingContext2D} context - Canvas context
   * @param {Ship} ship - Ship instance for overlay
   */
  render: function(context, ship) {
    if (this.state.done || !this.logoLoaded) return;

    if (!this.state.startTime) {
      this.state.startTime = Date.now();
    }

    var elapsed = Date.now() - this.state.startTime;

    // Trigger game start during fade
    if (!this.state.gameTriggered && elapsed >= this.state.fadeStart) {
      this.state.gameTriggered = true;
      Game.skipWaiting = true;
    }

    // Calculate target scale
    if (this.state.targetScale == null) {
      var fitBase = Math.min(
        (Game.canvasWidth * 0.58) / this.logoSize.w,
        (Game.canvasHeight * 0.43) / this.logoSize.h
      );
      var shipBaseHeight = 36.4;
      var shipBaseWidth = 35.0;
      var desiredShipScale = ship.scale;
      var scaleFromHeight = desiredShipScale * shipBaseHeight / (185 * fitBase);
      var scaleFromWidth = desiredShipScale * shipBaseWidth / (179 * fitBase);
      this.state.targetScale = Math.min(scaleFromHeight, scaleFromWidth);
    }

    var startScale = this.state.targetScale * 0.6;
    var progress = Math.min(1, elapsed / this.state.fadeStart);
    var introScale = startScale + progress * (this.state.targetScale - startScale);

    var introAlpha = 1;
    if (elapsed > this.state.fadeStart) {
      introAlpha = 1 - Math.min(1, (elapsed - this.state.fadeStart) / (this.state.duration - this.state.fadeStart));
    }

    if (introAlpha <= 0 || elapsed >= this.state.duration + this.state.endHold) {
      this.state.done = true;
      return;
    }

    // Draw logo
    this._drawLogo(context, introScale, introAlpha);

    // Draw ship overlay
    if (elapsed > this.state.shipAppear) {
      this._drawShipOverlay(context, ship, elapsed, introScale);
    }
  },

  /**
   * Draw logo image
   */
  _drawLogo: function(context, introScale, introAlpha) {
    var fit = Math.min(
      (Game.canvasWidth * 0.58) / this.logoSize.w,
      (Game.canvasHeight * 0.43) / this.logoSize.h
    );
    var logoTargetW = this.logoSize.w * fit * introScale;
    var logoTargetH = this.logoSize.h * fit * introScale;

    var aXRatio = 0.59;
    var aYRatio = 0.51;
    var offsetX = -logoTargetW / 2 - (aXRatio - 0.5) * logoTargetW;
    var offsetY = -logoTargetH / 2 - (aYRatio - 0.5) * logoTargetH;

    context.save();
    context.globalAlpha = introAlpha;
    context.translate(Game.canvasWidth / 2, Game.canvasHeight / 2);
    context.drawImage(this.logo, offsetX, offsetY, logoTargetW, logoTargetH);
    context.restore();
  },

  /**
   * Draw ship during intro
   */
  _drawShipOverlay: function(context, ship, elapsed, introScale) {
    var shipFadeTime = this.state.fadeStart - this.state.shipAppear;
    var shipProgress = (elapsed - this.state.shipAppear) / shipFadeTime;
    var shipAlpha = Math.min(1, shipProgress * 1.1);

    var fit = Math.min(
      (Game.canvasWidth * 0.58) / this.logoSize.w,
      (Game.canvasHeight * 0.43) / this.logoSize.h
    );
    
    var shipBaseHeight = 36.4;
    var shipBaseWidth = 35.0;
    var aHeightPixels = 185 * fit * introScale;
    var aWidthPixels = 179 * fit * introScale;
    var shipScaleH = aHeightPixels / shipBaseHeight;
    var shipScaleW = aWidthPixels / shipBaseWidth;
    var shipScale = Math.min(shipScaleH, shipScaleW);

    context.save();
    context.globalAlpha = shipAlpha;
    context.strokeStyle = THEME.primary;
    context.lineWidth = 1.0;
    
    ship.x = Game.canvasWidth / 2;
    ship.y = Game.canvasHeight / 2;
    
    var originalScale = ship.scale;
    var originalVisible = ship.visible;
    
    ship.visible = true;
    ship.scale = shipScale;
    ship.configureTransform();
    ship.draw();
    ship.scale = originalScale;
    ship.visible = originalVisible;
    
    context.restore();
  }
};
