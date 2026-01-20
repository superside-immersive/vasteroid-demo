/* DOM-based HUD for score and lives */

var HUD = (function() {
  var container = null;
  var root = null;
  var scoreNode = null;
  var livesNode = null;
  var lastScore = null;
  var lastLives = null;

  function init(gameContainer) {
    container = gameContainer || document.body;
    root = document.createElement('div');
    // Hidden by default; only show during active gameplay.
    root.className = 'ui-overlay hidden';

    var bar = document.createElement('div');
    bar.className = 'hud-bar';

    scoreNode = document.createElement('div');
    scoreNode.className = 'hud-score text-glow';
    scoreNode.textContent = 'SCORE 0';

    livesNode = document.createElement('div');
    livesNode.className = 'hud-chip';
    livesNode.textContent = 'LIVES ×0';
    livesNode.style.display = 'none'; // Hide lives display

    bar.appendChild(scoreNode);
    bar.appendChild(livesNode);
    root.appendChild(bar);
    container.appendChild(root);
  }

  function show() {
    if (!root) return;
    root.classList.remove('hidden');
  }

  function hide() {
    if (!root) return;
    root.classList.add('hidden');
  }

  function updateScore(score) {
    if (score === lastScore) return;
    lastScore = score;
    if (!scoreNode) return;
    scoreNode.textContent = 'SCORE ' + score;
    Animations.pulse(scoreNode, { duration: 360 });
  }

  function updateLives(lives) {
    if (lives === lastLives) return;
    lastLives = lives;
    if (!livesNode) return;
    livesNode.textContent = 'LIVES ×' + Math.max(0, lives);
    Animations.pulse(livesNode, { duration: 320, scale: [1, 1.08, 1] });
  }

  return {
    init: init,
    show: show,
    hide: hide,
    updateScore: updateScore,
    updateLives: updateLives
  };
})();
