/* Game over and name entry flow */

var GameOverUI = (function() {
  var overlay = null;
  var panel = null;
  var title = null;
  var input = null;
  var submitBtn = null;
  var hint = null;
  var scoreValue = 0;
  var awaitingRestart = false;

  function init(container) {
    overlay = document.createElement('div');
    overlay.className = 'ui-overlay interactive hidden';

    panel = document.createElement('div');
    panel.className = 'ui-panel';

    title = document.createElement('div');
    title.className = 'text-glow';
    title.style.fontSize = '28px';
    title.style.marginBottom = '12px';
    title.textContent = 'GAME OVER';

    input = document.createElement('input');
    input.className = 'input-name';
    input.maxLength = 8;
    input.placeholder = 'ENTER NAME';

    submitBtn = document.createElement('div');
    submitBtn.className = 'prompt-pill';
    submitBtn.textContent = 'SAVE SCORE';
    submitBtn.style.cursor = 'pointer';

    hint = document.createElement('div');
    hint.className = 'prompt-pill';
    hint.style.marginTop = '10px';
    hint.textContent = 'PRESS START TO PLAY';
    hint.style.display = 'none';

    panel.appendChild(title);
    panel.appendChild(input);
    panel.appendChild(submitBtn);
    panel.appendChild(hint);
    overlay.appendChild(panel);
    (container || document.body).appendChild(overlay);

    submitBtn.addEventListener('click', finalizeName);
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        finalizeName();
      }
    });
  }

  function start(score) {
    scoreValue = score || 0;
    awaitingRestart = false;
    overlay.classList.remove('hidden');
    panel.style.opacity = '1';
    hint.style.display = 'none';
    input.value = '';
    input.focus();

    Animations.staggerLetters(title, 'GAME OVER', { duration: 520 });
    Animations.fadeIn(panel, { duration: 420 });
  }

  function finalizeName() {
    if (awaitingRestart) return;
    var name = (input.value || '').trim().toUpperCase();
    if (!name) name = 'ACE';
    Scoreboard.addEntry(name.substring(0, 8), scoreValue);
    Scoreboard.render();
    Scoreboard.show();
    hint.style.display = 'inline-block';
    awaitingRestart = true;
    try { input.blur(); } catch (e) {}
    Animations.fadeOut(panel, { duration: 320 });
    setTimeout(function() {
      overlay.classList.add('hidden');
    }, 340);
  }

  function readyForRestart() {
    return awaitingRestart;
  }

  function hide() {
    overlay.classList.add('hidden');
    Scoreboard.hide();
    awaitingRestart = false;
  }

  return {
    init: init,
    start: start,
    readyForRestart: readyForRestart,
    hide: hide
  };
})();
