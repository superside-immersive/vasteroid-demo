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
    gameTriggered: false,
    timeline: null,
    playRequested: false,
    props: {
      logoScale: 0.6,
      logoAlpha: 1,
      shipAlpha: 0,
      shipScale: 0.6
    }
  },

  reset: function() {
    if (this.state.timeline) {
      try { this.state.timeline.pause(); } catch (e) {}
    }
    this.state.done = false;
    this.state.startTime = null;
    this.state.targetScale = null;
    this.state.gameTriggered = false;
    this.state.timeline = null;
    this.state.playRequested = false;
    this.state.props.logoScale = 0.6;
    this.state.props.logoAlpha = 1;
    this.state.props.shipAlpha = 0;
    this.state.props.shipScale = 0.6;
  },

  /**
   * Request playing the intro sequence (zoom-in) and then starting the game.
   */
  requestPlay: function() {
    this.state.playRequested = true;
    this.state.done = false;
    this.state.startTime = null;
    this.state.gameTriggered = false;
    if (this.state.timeline) {
      try { this.state.timeline.pause(); } catch (e) {}
    }
    this.state.timeline = null;
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
   * Check if logo is currently visible (for coordination with other animations)
   */
  isLogoVisible: function() {
    if (this.state.done) return false;
    return this.state.props.logoAlpha > 0.05;
  },

  /**
   * Render intro animation
   * @param {CanvasRenderingContext2D} context - Canvas context
   * @param {Ship} ship - Ship instance for overlay
   */
  render: function(context, ship) {
    // Only render intro during waiting state
    if (window.Game && Game.FSM && Game.FSM.state !== 'waiting') {
      return;
    }

    if (this.state.done || !this.logoLoaded) return;

    // If user hasn't requested start yet, keep logo visible (no autoplay).
    if (!this.state.playRequested) {
      this._ensureStaticProps();
      if (this.state.props.logoAlpha > 0.01) {
        this._drawLogo(context, this.state.props.logoScale, this.state.props.logoAlpha);
      }
      return;
    }

    if (!this.state.startTime) {
      this.state.startTime = Date.now();
    }

    this._ensureTimeline(ship);

    var elapsed = Date.now() - this.state.startTime;

    // Trigger game start near the end so the logo doesn't disappear abruptly.
    if (!this.state.gameTriggered && (this.state.props.logoAlpha <= 0.06 || elapsed >= (this.state.duration - 120))) {
      this.state.gameTriggered = true;
      Game.skipWaiting = true;
    }

    if (elapsed >= this.state.duration + this.state.endHold) {
      this.state.done = true;
      return;
    }

    // Draw logo only if it has some opacity
    if (this.state.props.logoAlpha > 0.01) {
      this._drawLogo(context, this.state.props.logoScale, this.state.props.logoAlpha);
    }

    // Draw ship overlay
    if (elapsed > this.state.shipAppear) {
      this._drawShipOverlay(context, ship, elapsed, this.state.props.shipScale, this.state.props.shipAlpha);
    }
  },

  _ensureStaticProps: function() {
    // Keep it simple: show logo at default scale until START is pressed.
    this.state.props.logoScale = 0.6;
    this.state.props.logoAlpha = 1;
    this.state.props.shipAlpha = 0;
    this.state.props.shipScale = 0.6;
  },

  _ensureTimeline: function(ship) {
    if (this.state.timeline) return;

    // Compute targetScale once per play cycle
    if (this.state.targetScale === null) {
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
    this.state.props.logoScale = startScale;
    this.state.props.shipScale = startScale;
    this.state.props.logoAlpha = 1;
    this.state.props.shipAlpha = 0;

    var self = this;
    this.state.timeline = anime.timeline({ autoplay: true });

    this.state.timeline
      .add({
        targets: this.state.props,
        logoScale: this.state.targetScale,
        duration: 1400,
        easing: 'easeOutExpo'
      })
      .add({
        targets: this.state.props,
        shipAlpha: 1,
        shipScale: this.state.targetScale,
        duration: 900,
        easing: 'easeOutQuad'
      }, '-=700')
      .add({
        targets: this.state.props,
        logoAlpha: 0,
        // Keep ship visible for a smoother handoff to gameplay.
        shipAlpha: 1,
        duration: 1100,
        delay: 300,
        easing: 'easeInQuad'
      });

    this.state.timeline.finished.then(function() {
      self.state.done = true;
    });
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
  _drawShipOverlay: function(context, ship, elapsed, introScale, shipAlpha) {
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
