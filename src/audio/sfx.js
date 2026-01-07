/**
 * Sound Effects Manager
 * Handles audio loading and playback
 */

var SFX = {
  laser:     new Audio('assets/audio/39459__THE_bizniss__laser.wav'),
  explosion: new Audio('assets/audio/51467__smcameron__missile_explosion.wav'),
  muted: false,
  _unlocked: false,
  unlock: function () {
    if (SFX._unlocked) return;
    // Try to unlock audio playback on first user gesture
    for (var key in SFX) {
      if (typeof SFX[key] === 'object' && SFX[key] instanceof Audio) {
        try {
          var a = SFX[key];
          a.preload = 'auto';
          a.muted = true;
          var p = a.play();
          if (p && typeof p.then === 'function') {
            p.then(function () {}).catch(function () {});
          }
          a.pause();
          a.currentTime = 0;
          a.muted = false;
        } catch (e) {}
      }
    }
    SFX._unlocked = true;
  }
};

// Replace Audio objects with safe play functions (allows overlapping playback)
(function() {
  for (var sfx in SFX) {
    if (typeof SFX[sfx] === 'object' && SFX[sfx] instanceof Audio) {
      (function (key) {
        var base = SFX[key];
        base.preload = 'auto';
        SFX[key] = function () {
          if (SFX.muted) return null;
          if (!SFX._unlocked) {
            // Attempt unlock lazily (some browsers require direct user gesture)
            try { SFX.unlock(); } catch (e) {}
          }
          try {
            var a = base.cloneNode(true);
            a.preload = 'auto';
            a.volume = 1.0;
            var p = a.play();
            if (p && typeof p.catch === 'function') {
              p.catch(function () {});
            }
            return a;
          } catch (e) {
            return null;
          }
        };
      })(sfx);
    }
  }
})();
