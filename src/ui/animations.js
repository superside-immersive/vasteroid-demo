/* Anime.js helper utilities and level transition renderer */

var Animations = (function() {
  function pulse(targets, opts) {
    return anime(Object.assign({
      targets: targets,
      scale: [1, 1.12, 1],
      duration: 320,
      easing: 'easeOutQuad'
    }, opts || {}));
  }

  function fadeIn(targets, opts) {
    return anime(Object.assign({
      targets: targets,
      opacity: [0, 1],
      duration: 450,
      easing: 'easeOutQuad'
    }, opts || {}));
  }

  function fadeOut(targets, opts) {
    return anime(Object.assign({
      targets: targets,
      opacity: [1, 0],
      duration: 450,
      easing: 'easeInQuad'
    }, opts || {}));
  }

  function staggerLetters(el, text, opts) {
    if (!el) return null;
    el.innerHTML = '';
    var frag = document.createDocumentFragment();
    for (var i = 0; i < text.length; i++) {
      var span = document.createElement('span');
      span.textContent = text[i];
      span.style.display = 'inline-block';
      span.style.opacity = '0';
      frag.appendChild(span);
    }
    el.appendChild(frag);
    return anime(Object.assign({
      targets: el.children,
      opacity: [0, 1],
      translateY: [8, 0],
      delay: anime.stagger(40),
      duration: 320,
      easing: 'easeOutCubic'
    }, opts || {}));
  }

  return {
    pulse: pulse,
    fadeIn: fadeIn,
    fadeOut: fadeOut,
    staggerLetters: staggerLetters
  };
})();

var LevelTransitionManager = (function() {
  var active = false;
  var startTime = 0;
  // Longer transition: rotate ship first, then stars
  // Total transition time = duration + tail (ms)
  // Requested: 5 seconds total
  var duration = 4200;
  var tail = 800;
  // Start stars after rotation completes
  var starDelay = 950;
  var stars = [];
  var shipOverlay = {
    active: false,
    ship: null,
    origin: null,
    rot: 0,
    yOffset: 0,
    scale: 1,
    alpha: 1,
    textArmed: false
  };

  function createStars(count) {
    stars = [];
    for (var i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * Game.canvasWidth,
        y: -Math.random() * Game.canvasHeight * 0.6,
        speed: 4 + Math.random() * 6,
        len: 10 + Math.random() * 18,
        alpha: 0.35 + Math.random() * 0.45
      });
    }
  }

  function start(ship) {
    active = true;
    startTime = Date.now();
    createStars(90);
    setupShipOverlay(ship);
  }

  function setupShipOverlay(ship) {
    if (!ship) return;
    shipOverlay.ship = ship;
    shipOverlay.origin = {
      x: ship.x,
      y: ship.y,
      rot: ship.rot,
      visible: ship.visible,
      scale: ship.scale,
      velX: ship.vel && ship.vel.x,
      velY: ship.vel && ship.vel.y
    };
    shipOverlay.active = true;
    shipOverlay.rot = ship.rot;
    // Keep ship in place; only rotate
    shipOverlay.yOffset = 0;
    shipOverlay.scale = ship.scale;
    shipOverlay.alpha = 1;
    shipOverlay.textArmed = false;

    ship.vel.x = 0;
    ship.vel.y = 0;
    // Keep real ship visible to avoid pop-out perception
    ship.visible = true;

    var timeline = anime.timeline({ autoplay: true });
    // Rotate ship upward
    timeline.add({
      targets: shipOverlay,
      rot: 0,
      duration: 900,
      easing: 'easeOutCubic'
    });

    timeline.finished.then(function() {
      shipOverlay.textArmed = true;
    });
  }

  function render(ctx) {
    if (!active) return;
    var elapsed = Date.now() - startTime;
    var total = (duration + tail);
    var progress = elapsed / total;
    if (progress >= 1) {
      active = false;
      finishShipOverlay();
      return;
    }

    // Fade out elegantly during the last tail segment
    var fadeFactor = 1;
    if (elapsed > duration) {
      fadeFactor = (total - elapsed) / Math.max(1, tail);
      if (fadeFactor < 0) fadeFactor = 0;
      if (fadeFactor > 1) fadeFactor = 1;
    }

    // Stars only appear after ship rotation begins
    var starElapsed = Math.max(0, elapsed - starDelay);
    var starProgress = starElapsed / Math.max(1, (total - starDelay));
    if (starProgress > 1) starProgress = 1;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.lineWidth = 2;

    if (starElapsed > 0) {
      ctx.globalAlpha = fadeFactor;
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        s.y += s.speed * (1.0 + starProgress * 2.4);
        var len = s.len * (1.0 + starProgress * 1.2);
        var x = s.x + Math.sin(starProgress * 3 + i * 0.5) * 1.2; // subtle drift
        var y1 = s.y;
        var y2 = s.y + len;

        ctx.strokeStyle = 'rgba(124, 240, 255,' + (s.alpha * (1 - starProgress * 0.15)) + ')';
        ctx.beginPath();
        ctx.moveTo(x, y1);
        ctx.lineTo(x, y2);
        ctx.stroke();

        // Recycle stars so the effect lasts the whole transition
        if (y1 > Game.canvasHeight + 80) {
          s.y = -Math.random() * Game.canvasHeight * 0.6;
          s.x = Math.random() * Game.canvasWidth;
          s.alpha = 0.35 + Math.random() * 0.45;
          s.speed = 4 + Math.random() * 6;
          s.len = 10 + Math.random() * 18;
        }
      }
    }

    // Ship overlay: only drive rotation (avoid teleport/movement)
    if (shipOverlay.active && shipOverlay.ship) {
      var ship = shipOverlay.ship;
      ship.rot = shipOverlay.rot;
    }

    ctx.restore();
  }

  function isActive() { return active; }

  function finishShipOverlay() {
    if (!shipOverlay.active || !shipOverlay.ship) return;
    // Keep ship in its current position and facing forward (up)
    shipOverlay.ship.rot = 0;
    shipOverlay.ship.visible = true;
    if (shipOverlay.origin) {
      shipOverlay.ship.scale = shipOverlay.origin.scale;
    }
    if (shipOverlay.ship.vel) {
      shipOverlay.ship.vel.x = 0;
      shipOverlay.ship.vel.y = 0;
    }
    shipOverlay.active = false;
  }

  // Hook into lifecycle end
  var originalIsActive = isActive;
  isActive = function() {
    if (!active) {
      finishShipOverlay();
    }
    return active;
  };

  function resetShipOverlayIfDone() {
    if (!active) {
      finishShipOverlay();
    }
  }

  return {
    start: start,
    render: render,
    isActive: isActive,
    _finishShipOverlay: finishShipOverlay,
    _resetShipOverlayIfDone: resetShipOverlayIfDone
  };
})();

var IdleAnimationManager = (function() {
  var active = false;
  var stars = [];
  var textState = { y: -200, alpha: 1 };
  var textTimeline = null;
  var textStarted = false;
  var cycleCount = 0;
  var scoreboardShowing = false;
  var scoreboardTimeout = null;
  var lastScoreboardShowAt = 0;
  var scoreboardCadenceMs = 10000;

  function createStars(count) {
    stars = [];
    for (var i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * Game.canvasWidth,
        y: -Math.random() * Game.canvasHeight * 0.8,
        speed: 2 + Math.random() * 4,
        len: 6 + Math.random() * 12,
        alpha: 0.25 + Math.random() * 0.35
      });
    }
  }

  function resetTextState() {
    textState.y = -200;
    textState.alpha = 1;
    textStarted = false;
    cycleCount = 0;
    if (textTimeline) {
      try { textTimeline.pause(); } catch(e) {}
    }
    textTimeline = null;
  }

  function hideScoreboard() {
    if (window.Scoreboard) {
      Scoreboard.hide();
    }
    scoreboardShowing = false;
  }

  function showScoreboard() {
    if (window.Scoreboard && active) {
      Scoreboard.show(true);
      scoreboardShowing = true;
      if (scoreboardTimeout) clearTimeout(scoreboardTimeout);
      scoreboardTimeout = setTimeout(function() {
        hideScoreboard();
      }, 7000);
    }
  }

  function start() {
    if (active) return;
    active = true;
    createStars(60);
    resetTextState();
    scoreboardShowing = false;
    // Show once immediately (next render), then every 10 seconds.
    lastScoreboardShowAt = 0;
  }

  function startTextCycle() {
    if (textTimeline || !active) return;

    var startY = -200;
    var endY = Game.canvasHeight + 200;

    textStarted = true;
    textState.y = startY;
    textState.alpha = 1;

    textTimeline = anime.timeline({ loop: false });
    textTimeline
      .add({
        targets: textState,
        y: [startY, endY],
        duration: 5000,
        easing: 'linear'
      });

    textTimeline.finished.then(function() {
      if (!active) return;
      cycleCount++;
      textTimeline = null;
      textStarted = false;
      textState.y = startY;
      
      // Every 2 cycles, show scoreboard
      if (cycleCount % 2 === 0 && !scoreboardShowing) {
        showScoreboard();
        // Wait for scoreboard to finish, then restart text cycle
        setTimeout(function() {
          if (active && !scoreboardShowing) {
            startTextCycle();
          }
        }, 8000);
      } else {
        // Small delay before next cycle
        setTimeout(function() {
          if (active && !scoreboardShowing) {
            startTextCycle();
          }
        }, 1200);
      }
    });
  }

  function stop() {
    active = false;
    resetTextState();
    hideScoreboard();
    if (scoreboardTimeout) {
      clearTimeout(scoreboardTimeout);
      scoreboardTimeout = null;
    }
  }

  function maybeStartTextCycle() {
    if (textTimeline || !active || scoreboardShowing) return;
    startTextCycle();
  }

  function render(ctx) {
    if (!active) return;

    // Ensure scoreboard is initialized (some embeds may skip init ordering)
    if (window.Scoreboard && typeof Scoreboard.ensureInit === 'function') {
      Scoreboard.ensureInit(document.getElementById('game-container'));
    }

    // Show scoreboard periodically while idling in waiting state
    if (!scoreboardShowing && window.Scoreboard && window.Game && Game.FSM && Game.FSM.state === 'waiting') {
      var now = Date.now();
      if (lastScoreboardShowAt === 0 || (now - lastScoreboardShowAt >= scoreboardCadenceMs)) {
        lastScoreboardShowAt = now;
        showScoreboard();
      }
    }

    maybeStartTextCycle();

    // Always render stars
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.lineWidth = 1.5;

    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      s.y += s.speed;
      var x = s.x + Math.sin(Date.now() * 0.0005 + i) * 0.8;
      var y1 = s.y;
      var y2 = s.y + s.len;

      ctx.strokeStyle = 'rgba(124, 240, 255,' + s.alpha + ')';
      ctx.beginPath();
      ctx.moveTo(x, y1);
      ctx.lineTo(x, y2);
      ctx.stroke();

      if (y1 > Game.canvasHeight + 60) {
        s.y = -Math.random() * 100;
        s.x = Math.random() * Game.canvasWidth;
      }
    }

    // No text rendered here (keep cycle timing for scoreboard)

    ctx.restore();
  }

  function isActive() { return active; }
  function isTextVisible() { return textStarted && textState.y > 0 && textState.y < Game.canvasHeight; }

  return {
    start: start,
    stop: stop,
    render: render,
    isActive: isActive,
    isTextVisible: isTextVisible
  };
})();
