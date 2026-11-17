# Lumen Hollow — Architecture

## Goals

- Deterministic, headless-testable simulation, fully separated from rendering and the DOM.
- All balance numbers live in typed tables under `src/data/`.
- Zero runtime dependencies; procedural graphics (Canvas 2D) and synthesized audio (WebAudio).

## Layers

```
src/
  types.ts        shared interfaces (the contract between all layers)
  core/           simulation: pure TypeScript, no DOM/canvas access
  data/           towers, enemies, levels, waves, spells, talents, difficulty tables
  render/         Canvas 2D world renderer (reads GameState, consumes SimEvents)
  ui/             DOM screens, HUD, input handling, main loop
  audio/          WebAudio synthesized SFX and generative music
  i18n/           en/ru dictionaries and the t() helper
  save/           versioned localStorage saves with migrations
  sim/            headless balance simulator (bots + CLI)
tests/            vitest suites for core, data and saves
```

Dependency direction: `ui -> render, audio, core, data, i18n, save`; `render -> core (read-only), data`;
`core -> data, types`; `sim -> core, data`. Nothing imports `ui`. `core` never touches `window`,
`document`, canvas or timers.

## Units and coordinates

- Simulation works in **cells** and **seconds**. One cell is 64 px. The grid is 20 x 11 cells.
- Cell `(cx, cy)` has its centre at `(cx + 0.5, cy + 0.5)`.
- The world canvas is 1280 x 720 logical px; the grid starts at y = 8 px.
- The app frame is 1440 x 760: a 40 px top bar, the 1280 x 720 world, and a 160 px side panel.
  It is scaled uniformly to the window (letterbox).

## Simulation

`core/game.ts` exposes `Game`, which owns a `GameState` and offers commands
(`build`, `upgrade`, `sell`, `setTargetMode`, `callWave`, `castSpell`, `removeRock`) and
`step(dt)`. The fixed step is 1/60 s; the UI runs `step` 0..N times per animation frame
depending on game speed (x1/x2/x3) and an accumulator, independent of render rate.

Per step:

1. Wave runtime: spawn due enemies, count down to the next wave, grant jar income.
2. Enemies: status timers (slow, freeze, stun, poison, mark, acid), shield regen, healer auras,
   boss behaviour, movement along `PathRuntime` (swamp and puddle modifiers), leaks.
3. Towers: effective stats are cached and recomputed when the tower set changes
   (beacon auras, high ground, fog, talent bonuses). Each tower ticks cooldown, picks a target by
   its mode (first / last / strongest / closest) and attacks.
4. Projectiles: homing bolts and lobbed shells; impacts apply damage and effects.
5. Zones: delayed spell impacts and boss puddles.
6. Win / loss checks.

### Damage pipeline (`core/damage.ts`)

`raw * mark(1.2)` -> physical: `max(1, dmg - max(0, armor - acid) * (1 - armorPen))`, magic: unchanged
-> shield absorbs first (resets the regen delay) -> HP -> death handling (reward, split, plague
spread, boss on-death effects, events).

### Randomness

`core/rng.ts` implements mulberry32. The state lives in `GameState.rngState`, so a run is fully
reproducible from `RunConfig.seed` and the command sequence.

### Events

The simulation appends `SimEvent`s to `state.events`. After stepping, the UI drains the array and
hands it to the renderer (particles, floating numbers, shake) and audio (SFX). The simulation
never depends on consumers.

## Data

- `data/towers.ts`: 8 towers, 3 tiers + 2 branches, costs, hotkeys.
- `data/enemies.ts`: regular enemies and bosses, HP curve `base * (1 + 0.09w + 0.004w^2) * difficulty`.
- `data/waveGen.ts`: deterministic wave builder from compact per-level specs (budget, roster,
  hand-authored overrides such as boss waves).
- `data/levels/*.ts`: one file per biome with maps (paths, features) and wave specs.
- `data/spells.ts`, `data/talents.ts`, `data/difficulty.ts`, `data/challenges.ts`.

## Presentation

- `render/` implements the `Renderer` interface from `types.ts`. Static layers (ground, path,
  decorations) are drawn once per level into an offscreen canvas. Entities, particles and
  overlays are drawn every frame. `render/palette.ts` holds the fixed palette and biome shifts.
- `ui/` owns the main loop, input (pointer + keyboard), HUD and menu screens. It talks to the
  simulation only through `Game` commands and reads `GameState` for display.
- `audio/` implements `AudioEngine`; it maps `SimEvent`s to throttled SFX.

## Saves

`save/save.ts` stores `SaveData` in `localStorage` under one key. Every save carries `version`;
`save/migrations.ts` upgrades older shapes step by step, and unknown or corrupt data falls back to
defaults. All storage access is wrapped so private modes do not crash the game.

## Balance simulator

`npm run sim` builds `src/sim/cli.ts` for Node and runs every level on every difficulty with two
bots: an idle bot (must lose) and a greedy builder (must win Normal while losing some lives and
have a real chance to lose on Hard). It prints win rates, lives left, gold curves and duration.
