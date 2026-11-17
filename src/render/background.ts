import type { GameState, LevelDef } from '../types';
import { CELL, COLS, GRID_Y, ROWS, WORLD_H, WORLD_W, toPx, toPy } from '../core/constants';
import { BIOMES, C } from './palette';
import { circle, ellipse, glow, makeCanvas, mulberry32, rgba, ring, shade } from './shapes';

type Ctx = CanvasRenderingContext2D;

function drawGround(ctx: Ctx, level: LevelDef, rnd: () => number): void {
  const p = BIOMES[level.biome];
  const g = ctx.createLinearGradient(0, 0, 0, WORLD_H);
  g.addColorStop(0, p.skyTop);
  g.addColorStop(1, p.skyBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  for (let cy = 0; cy < ROWS; cy++) {
    for (let cx = 0; cx < COLS; cx++) {
      ctx.fillStyle = (cx + cy) % 2 ? p.groundA : p.groundB;
      ctx.fillRect(cx * CELL, cy * CELL + GRID_Y, CELL, CELL);
    }
  }
  const flowers = [C.amberLight, C.pink, C.white, C.violetLight];
  ctx.lineCap = 'round';
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 1100; i++) {
    const x = rnd() * WORLD_W;
    const y = GRID_Y + rnd() * ROWS * CELL;
    const h = 4 + rnd() * 7;
    const lean = (rnd() - 0.5) * 5;
    ctx.strokeStyle = rnd() < 0.3 ? p.strokeLight : p.stroke;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + lean * 0.3, y - h * 0.6, x + lean, y - h);
    ctx.stroke();
  }
  for (let i = 0; i < 90; i++) {
    const x = rnd() * WORLD_W;
    const y = GRID_Y + rnd() * ROWS * CELL;
    circle(ctx, x, y, 1.8, flowers[Math.floor(rnd() * flowers.length)]);
    circle(ctx, x, y, 0.8, C.amber);
  }
}

function drawPaths(ctx: Ctx, level: LevelDef): void {
  const p = BIOMES[level.biome];
  const layers: [string, number, number][] = [
    [rgba(C.ink, 0.35), 54, 4],
    [p.pathEdge, 48, 0],
    [p.path, 40, 0],
    [shade(p.path, 0.25), 20, 0],
  ];
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const [col, w, dy] of layers) {
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    for (const path of level.paths) {
      ctx.beginPath();
      path.points.forEach((pt, i) => {
        const x = toPx(pt.x + 0.5);
        const y = toPy(pt.y + 0.5) + dy;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
  }
}

function drawBush(ctx: Ctx, x: number, y: number, rnd: () => number, base: string): void {
  if (rnd() < 0.45) {
    ellipse(ctx, x, y + 22, 20, 7, rgba(C.ink, 0.3));
    ctx.fillStyle = C.wood;
    ctx.fillRect(x - 3, y + 6, 6, 16);
    for (let i = 0; i < 3; i++) {
      const w = 22 - i * 5;
      ctx.fillStyle = shade(base, 0.06 + i * 0.07);
      ctx.beginPath();
      ctx.moveTo(x, y - 24 + i * 12);
      ctx.lineTo(x + w, y + 4 + i * 8);
      ctx.lineTo(x - w, y + 4 + i * 8);
      ctx.closePath();
      ctx.fill();
    }
  } else {
    ellipse(ctx, x, y + 14, 24, 8, rgba(C.ink, 0.3));
    circle(ctx, x - 10, y + 4, 14, shade(base, 0.02));
    circle(ctx, x + 10, y + 5, 13, shade(base, 0.05));
    circle(ctx, x, y - 4, 16, shade(base, 0.12));
    circle(ctx, x - 4, y - 8, 6, shade(base, 0.25));
  }
}

function drawRock(ctx: Ctx, x: number, y: number, rnd: () => number): void {
  ellipse(ctx, x, y + 20, 24, 8, rgba(C.ink, 0.35));
  const r = 17 + rnd() * 5;
  circle(ctx, x, y + 2, r, C.stoneDark);
  circle(ctx, x - 2, y - 1, r - 3, C.stone);
  circle(ctx, x - 7, y - 8, r * 0.35, shade(C.stone, 0.3));
  circle(ctx, x + 9, y + 6, r * 0.2, shade(C.stone, -0.2));
}

function drawHigh(ctx: Ctx, cx: number, cy: number, level: LevelDef): void {
  const p = BIOMES[level.biome];
  const x = cx * CELL + 3;
  const y = cy * CELL + GRID_Y + 3;
  const s = CELL - 6;
  const slab = (dy: number, fill: string) => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.roundRect(x, y + dy, s, s, 14);
    ctx.fill();
  };
  slab(6, rgba(C.ink, 0.5));
  slab(3, shade(p.groundB, -0.25));
  slab(-2, shade(p.groundA, 0.28));
  ctx.strokeStyle = rgba(C.white, 0.18);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x + 3, y + 1, s - 6, s - 6, 11);
  ctx.stroke();
}

function drawSwamp(ctx: Ctx, cx: number, cy: number, rnd: () => number): void {
  const x = cx * CELL + CELL / 2;
  const y = cy * CELL + GRID_Y + CELL / 2;
  ellipse(ctx, x, y, 28, 22, rgba('#0f2a2a', 0.85));
  ellipse(ctx, x - 3, y - 2, 22, 16, rgba(C.tealDark, 0.8));
  ring(ctx, x, y, 24, rgba(C.teal, 0.25), 2);
  for (let i = 0; i < 4; i++) {
    ring(ctx, x + (rnd() - 0.5) * 34, y + (rnd() - 0.5) * 24, 2 + rnd() * 3, rgba(C.ice, 0.55), 1.4);
  }
}

function drawSlot(ctx: Ctx, cx: number, cy: number): void {
  const x = cx * CELL + CELL / 2;
  const y = cy * CELL + GRID_Y + CELL / 2;
  ellipse(ctx, x, y + 5, 27, 22, rgba(C.ink, 0.4));
  ellipse(ctx, x, y + 2, 27, 22, C.stoneDark);
  ellipse(ctx, x, y - 1, 25, 20, C.stone);
  ellipse(ctx, x, y - 1, 18, 14, shade(C.stone, -0.12));
  ring(ctx, x, y - 1, 21, rgba(C.white, 0.2), 1.5);
}

function drawEntrance(ctx: Ctx, level: LevelDef): void {
  for (const path of level.paths) {
    const a = path.points[0];
    const b = path.points[1] ?? a;
    const x = toPx(a.x + 0.5);
    const y = toPy(a.y + 0.5);
    glow(ctx, x, y, 70, C.violet, 0.8);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.atan2(b.y - a.y, b.x - a.x));
    ellipse(ctx, 0, 0, 16, 28, C.ink);
    ellipse(ctx, 2, 0, 10, 20, rgba(C.violet, 0.6));
    ctx.restore();
  }
}

/** Renders the static layer (everything that does not animate) at the given resolution scale. */
export function buildBackground(state: GameState, scale: number): HTMLCanvasElement {
  const [canvas, ctx] = makeCanvas(WORLD_W * scale, WORLD_H * scale);
  ctx.scale(scale, scale);
  const level = state.level;
  const grid = state.grid;
  const rnd = mulberry32(level.seed * 7919 + 13);
  drawGround(ctx, level, rnd);
  drawPaths(ctx, level);
  for (let cy = 0; cy < grid.rows; cy++) {
    for (let cx = 0; cx < grid.cols; cx++) {
      const kind = grid.cells[cy * grid.cols + cx];
      const x = cx * CELL + CELL / 2;
      const y = cy * CELL + GRID_Y + CELL / 2;
      if (kind === 'high') drawHigh(ctx, cx, cy, level);
      else if (kind === 'swamp') drawSwamp(ctx, cx, cy, rnd);
      else if (kind === 'slot') drawSlot(ctx, cx, cy);
      else if (kind === 'rock') drawRock(ctx, x, y, rnd);
      else if (kind === 'blocked') drawBush(ctx, x, y, rnd, BIOMES[level.biome].bush);
    }
  }
  drawEntrance(ctx, level);
  return canvas;
}

/** Animated Heart-tree; glow follows the remaining lives. */
export function drawTree(ctx: Ctx, state: GameState, time: number): void {
  const x = toPx(state.level.tree.x + 0.5);
  const y = toPy(state.level.tree.y + 0.5);
  const health = state.maxLives > 0 ? Math.max(0, state.lives / state.maxLives) : 1;
  const pulse = 0.85 + Math.sin(time * 1.6) * 0.15;
  glow(ctx, x, y - 20, 150 * (0.6 + health * 0.5), C.amber, (0.25 + health * 0.5) * pulse);
  ellipse(ctx, x, y + 30, 46, 12, rgba(C.ink, 0.45));
  ctx.fillStyle = C.wood;
  ctx.beginPath();
  ctx.moveTo(x - 14, y + 32);
  ctx.quadraticCurveTo(x - 6, y + 4, x - 8, y - 20);
  ctx.lineTo(x + 8, y - 20);
  ctx.quadraticCurveTo(x + 6, y + 4, x + 14, y + 32);
  ctx.closePath();
  ctx.fill();
  const leaf = health > 0.3 ? C.greenDark : '#4a4a40';
  const sway = Math.sin(time * 0.9) * 2;
  circle(ctx, x - 28 + sway, y - 28, 26, shade(leaf, -0.1));
  circle(ctx, x + 28 + sway, y - 28, 26, shade(leaf, -0.1));
  circle(ctx, x + sway, y - 46, 34, leaf);
  circle(ctx, x + sway - 10, y - 54, 14, shade(leaf, 0.2));
  const n = 7;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + time * 0.4;
    const lx = x + sway + Math.cos(a) * 30;
    const ly = y - 36 + Math.sin(a) * 22;
    const on = i / n < health + 0.05;
    glow(ctx, lx, ly, 12, on ? C.amberLight : C.stone, on ? 0.9 : 0.3);
    circle(ctx, lx, ly, 3, on ? C.amberLight : C.stoneDark);
  }
}
