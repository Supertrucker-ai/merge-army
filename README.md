# Merge Army

A kid-friendly merge + math-gate army game (single offline `index.html`). Drag two matching spawners together to merge them, pick the best math gate (×2, +10, ×5…), watch your army multiply, beat the waves and the boss.

- Build: `node build.js` (assembles `index.html` from `parts/`)
- Test: `node test.js` (Playwright + system Chrome, iPhone viewport; screenshots in `shots/`)
- Rename the game: change `GAME_NAME` in `parts/js/00-config.js`.
