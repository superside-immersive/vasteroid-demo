/* Session-only scoreboard storage and rendering */

var Scoreboard = (function() {
  var scores = [];
  var overlay = null;
  var panel = null;
  var tableBody = null;
  var prompt = null;
  var lastAddedId = null;
  var scrollState = { position: 0 };
  var scrollTimeline = null;
  var autoShowInterval = null;

  var placeholderNames = [
    'ACE', 'BLAZE', 'VIPER', 'HAWK', 'NOVA', 'STORM', 'RAVEN', 'GHOST',
    'TITAN', 'FLARE', 'ORION', 'STAR', 'VOLT', 'PULSE', 'SURGE', 'DASH',
    'FROST', 'FLAME', 'SHADE', 'SPARK', 'ECHO', 'WOLF', 'EAGLE', 'COBRA',
    'RAZOR', 'BLITZ', 'PRISM', 'NEXUS', 'PYRO', 'BOLT', 'DRIFT', 'FURY',
    'ZERO', 'LUNA', 'OMEGA', 'ALPHA', 'DELTA', 'SIGMA', 'GAMMA', 'APEX'
  ];

  function generatePlaceholders() {
    if (scores.length > 0) return;
    for (var i = 0; i < 40; i++) {
      scores.push({
        id: 'placeholder-' + i,
        name: placeholderNames[i],
        score: 15000 - (i * 300) - Math.floor(Math.random() * 200)
      });
    }
  }

  function init(container) {
    generatePlaceholders();
    overlay = document.createElement('div');
    overlay.className = 'ui-overlay interactive hidden';

    panel = document.createElement('div');
    panel.className = 'ui-panel';

    var title = document.createElement('div');
    title.className = 'text-glow';
    title.style.fontSize = '22px';
    title.style.marginBottom = '10px';
    title.textContent = 'SCOREBOARD';

    var table = document.createElement('table');
    table.className = 'scoreboard-table';
    var thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>#</th><th>NAME</th><th>SCORE</th></tr>';
    tableBody = document.createElement('tbody');
    table.appendChild(thead);
    table.appendChild(tableBody);

    prompt = document.createElement('div');
    prompt.className = 'prompt-pill';
    prompt.style.marginTop = '10px';
    prompt.textContent = 'PRESS START TO PLAY';

    panel.appendChild(title);
    panel.appendChild(table);
    panel.appendChild(prompt);
    overlay.appendChild(panel);
    (container || document.body).appendChild(overlay);
  }

  function isReady() {
    return !!overlay;
  }

  function ensureInit(container) {
    // Always ensure placeholder data exists
    generatePlaceholders();
    if (!overlay) {
      init(container);
    }
  }

  function addEntry(name, score) {
    var entry = { id: Date.now() + Math.random(), name: name || 'ACE', score: score || 0 };
    scores.push(entry);
    scores.sort(function(a, b) { return b.score - a.score; });
    scores = scores.slice(0, 8);
    lastAddedId = entry.id;
  }

  function render(startIdx, endIdx) {
    if (!tableBody) return;
    tableBody.innerHTML = '';
    startIdx = startIdx || 0;
    endIdx = endIdx || Math.min(10, scores.length);
    for (var i = startIdx; i < endIdx && i < scores.length; i++) {
      var row = document.createElement('tr');
      if (scores[i].id === lastAddedId) {
        row.className = 'highlight';
      }
      var rank = document.createElement('td');
      rank.textContent = i + 1;
      var nameCell = document.createElement('td');
      nameCell.textContent = scores[i].name;
      var scoreCell = document.createElement('td');
      scoreCell.textContent = scores[i].score;
      row.appendChild(rank);
      row.appendChild(nameCell);
      row.appendChild(scoreCell);
      tableBody.appendChild(row);
    }
  }

  function animateScroll() {
    if (scrollTimeline) {
      try { scrollTimeline.pause(); } catch(e) {}
    }
    scrollState.position = Math.max(0, scores.length - 10);
    scrollTimeline = anime({
      targets: scrollState,
      position: [scrollState.position, 0],
      duration: 6000,
      easing: 'easeInOutQuad',
      update: function() {
        var idx = Math.floor(scrollState.position);
        render(idx, idx + 10);
      }
    });
  }

  function show(withAnimation) {
    // Be defensive: ensure placeholders + DOM exist
    generatePlaceholders();
    if (!overlay) {
      ensureInit(document.getElementById('game-container'));
    }
    if (!overlay) return;

    if (window.anime) {
      anime.remove(prompt);
    }
    overlay.classList.remove('hidden');
    if (withAnimation && window.anime) {
      animateScroll();
    } else {
      render(0, 10);
    }

    // Ensure panel is visible even if animations are unavailable
    if (panel) {
      panel.style.opacity = '1';
    }
    if (window.anime && window.Animations) {
      Animations.fadeIn(panel, { duration: 480 });
      Animations.pulse(prompt, { duration: 900, easing: 'easeInOutSine', loop: true });
    }
  }

  function startAutoShow() {
    stopAutoShow();
    autoShowInterval = setInterval(function() {
      if (window.Game && window.Game.FSM && Game.FSM.state === 'waiting') {
        show(true);
        setTimeout(function() {
          hide();
        }, 8000);
      }
    }, 10000);
  }

  function stopAutoShow() {
    if (autoShowInterval) {
      clearInterval(autoShowInterval);
      autoShowInterval = null;
    }
  }

  function hide() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    anime.remove(prompt);
    if (scrollTimeline) {
      try { scrollTimeline.pause(); } catch(e) {}
    }
  }

  function getLastEntryId() { return lastAddedId; }

  return {
    init: init,
    ensureInit: ensureInit,
    isReady: isReady,
    addEntry: addEntry,
    show: show,
    hide: hide,
    render: render,
    startAutoShow: startAutoShow,
    stopAutoShow: stopAutoShow,
    getLastEntryId: getLastEntryId
  };
})();
