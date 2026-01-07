VAST Asteroids (HTML5 Canvas)
============================

A lightweight Asteroids-style game built with plain JavaScript + HTML5 Canvas, with vector visuals and a subtle glow/bloom look.

This codebase started from the classic HTML5-Asteroids approach, but the **official version in this repo is the modular entry** (`index-modular.html` loading `src/`).
For convenience, `index.html` is now the same modular entry point (an alias).

Original inspiration (Doug McInnes, 2010):
http://dougmcinnes.com/2010/05/12/html-5-asteroids/

## Run

Recommended (local server):

```bash
cd vasteroid_demo
python3 -m http.server 8000
```

Open:
- http://localhost:8000/index-modular.html (official)
- http://localhost:8000/index.html (alias)

## Controls

- Left/Right arrows: rotate
- Up arrow: thrust
- Space: fire
- P: pause
- M: mute
- F: show FPS
- G: grid debug (collision partitioning)

## Engine (very short)

- Single `requestAnimationFrame` loop.
- Global game state (`Game`) + a small finite-state machine (`GameFSM`) for boot/start/run/level-up/game-over.
- Entity system based on a `Sprite` base class:
  - `preMove`/`postMove` hooks, basic physics (vel/acc), screen wrap.
  - Vector rendering (polylines) + collision checks.

## Graphics / Rendering

- Uses the native HTML5 **Canvas 2D** context (no external engine / no WebGL).
- Wireframe/vector look: shapes drawn via canvas transforms; HUD text via `Text.renderText` (vector_battle typeface).
- Glow/Bloom: an offscreen canvas is blurred and composited additively each frame (see `applyGlowBloom` in `src/main.js`).
- Asteroids: clusters of cached character sprites drawn with `drawImage` per-character and depth-sorted each frame.

## Optimizations

- **Spatial partitioning grid**: collisions are checked against nearby cells instead of every sprite.
- **Object pooling**: bullets are pre-created and recycled (less GC / fewer allocations).
- **Asteroid character cache**: characters are pre-rendered to offscreen canvases and drawn via `drawImage`.
- **Precomputed trig**: asteroid hitbox uses an octagon with cached sin/cos values.

Main performance knob: the “characters per asteroid” density (in the modular UI) can heavily impact CPU due to per-frame depth sorting and many `setTransform` calls.

## Project layout (modular)

- `index-modular.html`: loads the modular version.
- `src/main.js`: bootstrap + main loop.
- `src/config/constants.js`: key mapping, theme, global flags.
- `src/entities/*`: `Sprite`, `Ship`, `Bullet`, `Asteroid`, `BigAlien`, `Explosion`.
- `src/game/*`: `Game` + `GameFSM` + intro.

## Credits

- Inspired by HTML5-Asteroids (Doug McInnes).
- Typeface vector font: `vector_battle_regular.typeface.js`.

