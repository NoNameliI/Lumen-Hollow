import type { GameState, Renderer, SimEvent, TowerState, ViewState } from '../types';
import { WORLD_H, WORLD_W, toPx, toPy } from '../core/constants';
import { buildBackground, drawTree } from './background';
import { drawEnemies } from './enemies';
import { drawAuras, drawBuildHighlights, drawDarkness, drawGhost, drawSelection, drawSpellTarget, FogLayer } from './overlays';
import { Effects } from './particles';
import { C } from './palette';
import { drawProjectiles, drawPuddles, drawStarfalls } from './projectiles';
import { glow, mulberry32 } from './shapes';
import { drawHighBadge, drawTower, type TowerPose } from './towers';

export { drawTowerIcon } from './towers';
export { drawEnemyIcon } from './enemies';

const FLY_COUNT = 36;
const FLASH_TIME = 0.12;

interface Firefly {
  bx: number;
  by: number;
  ax: number;
  ay: number;
  fx: number;
  fy: number;
  ph: number;
}

function makeFireflies(): Firefly[] {
  const r = mulberry32(99);
  const out: Firefly[] = [];
  for (let i = 0; i < FLY_COUNT; i++) {
    out.push({
      bx: r() * WORLD_W,
      by: r() * WORLD_H,
      ax: 20 + r() * 50,
      ay: 10 + r() * 30,
      fx: 0.1 + r() * 0.25,
      fy: 0.15 + r() * 0.3,
      ph: r() * 6.28,
    });
  }
  return out;
}

export function createRenderer(canvas: HTMLCanvasElement): Renderer {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2d context unavailable');
  const fx = new Effects();
  const fog = new FogLayer();
  const flies = makeFireflies();
  const pose: TowerPose = { level: 0, branch: -1, angle: 0, t: 0, flash: 0, disabled: false, seed: 0 };
  let bg: HTMLCanvasElement | null = null;
  let bgScale = 1;
  let sx = 1;
  let sy = 1;
  let clock = 0;
  let lastState: GameState | null = null;

  const rebuild = (state: GameState) => {
    bg = buildBackground(state, bgScale);
  };

  const drawFireflies = (c: CanvasRenderingContext2D, reduced: boolean) => {
    const n = reduced ? FLY_COUNT / 2 : FLY_COUNT;
    for (let i = 0; i < n; i++) {
      const f = flies[i];
      const x = f.bx + Math.sin(clock * f.fx + f.ph) * f.ax;
      const y = f.by + Math.cos(clock * f.fy + f.ph * 2) * f.ay;
      const a = 0.35 + 0.5 * Math.max(0, Math.sin(clock * 1.7 + f.ph * 3));
      glow(c, x, y, 10, C.amberLight, a);
    }
  };

  const drawTowers = (c: CanvasRenderingContext2D, state: GameState) => {
    const list: TowerState[] = state.towers.slice().sort((a, b) => a.y - b.y);
    for (const t of list) {
      const x = toPx(t.x);
      const y = toPy(t.y);
      pose.level = t.level;
      pose.branch = t.branch;
      pose.angle = t.angle;
      pose.t = clock;
      pose.flash = Math.max(0, 1 - (state.time - t.lastShot) / FLASH_TIME);
      pose.disabled = t.disabledTime > 0;
      pose.seed = t.id * 1.3;
      c.save();
      c.translate(x, y);
      drawTower(c, t.type, pose);
      if (t.high) drawHighBadge(c, 24, -28);
      c.restore();
    }
  };

  return {
    setLevel(state) {
      lastState = state;
      rebuild(state);
      fx.reset();
      fx.dirtyGround = false;
    },

    consume(events: SimEvent[], state: GameState) {
      lastState = state;
      fx.consume(events);
    },

    render(state, view: ViewState, dtReal) {
      lastState = state;
      const dt = Math.min(0.1, Math.max(0, dtReal));
      fx.reducedMotion = view.reducedMotion;
      fx.showDamage = view.showDamageNumbers;
      fx.update(dt, state);
      clock += dt;
      if (fx.dirtyGround || !bg) {
        rebuild(state);
        fx.dirtyGround = false;
      }
      const c = ctx;
      c.setTransform(sx, 0, 0, sy, 0, 0);
      c.clearRect(0, 0, WORLD_W, WORLD_H);
      c.save();
      if (fx.shake > 0) c.translate((Math.random() - 0.5) * 2 * fx.shake, (Math.random() - 0.5) * 2 * fx.shake);
      if (bg) c.drawImage(bg, 0, 0, WORLD_W, WORLD_H);
      drawFireflies(c, view.reducedMotion);
      drawAuras(c, state.towers, clock);
      if (view.buildType) drawBuildHighlights(c, state, clock);
      drawPuddles(c, state, clock);
      drawTree(c, state, clock);
      drawTowers(c, state);
      drawEnemies(c, state);
      drawProjectiles(c, state);
      drawStarfalls(c, state, clock);
      fx.draw(c, clock);
      if (state.level.fog) fog.draw(c, state, clock);
      drawDarkness(c, state, clock);
      drawSelection(c, state, view, clock);
      drawGhost(c, view, clock);
      drawSpellTarget(c, view, clock);
      c.restore();
      fx.drawScreen(c);
    },

    takeHitStop() {
      return 0;
    },

    effectiveQuality() {
      return 'high';
    },

    resize(cssWidth, cssHeight, dpr) {
      canvas.width = Math.max(1, Math.round(cssWidth * dpr));
      canvas.height = Math.max(1, Math.round(cssHeight * dpr));
      sx = canvas.width / WORLD_W;
      sy = canvas.height / WORLD_H;
      const want = Math.min(2, Math.max(1, Math.ceil(sx * 2) / 2));
      if (want !== bgScale) {
        bgScale = want;
        if (lastState) rebuild(lastState);
      }
    },
  };
}
