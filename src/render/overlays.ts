import type { GameState, TowerState, ViewState } from '../types';
import { CELL, COLS, GRID_Y, ROWS, WORLD_H, WORLD_W, toPx, toPy } from '../core/constants';
import { isBuildable } from '../core/grid';
import { SPELLS } from '../data/spells';
import { C } from './palette';
import { circle, glow, makeCanvas, mulberry32, rgba, ring } from './shapes';
import { drawTower } from './towers';

type Ctx = CanvasRenderingContext2D;

export function drawRange(ctx: Ctx, x: number, y: number, rCells: number, col: string, hatch = false): void {
  const r = rCells * CELL;
  ctx.fillStyle = rgba(col, 0.1);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ring(ctx, x, y, r, rgba(col, 0.75), 2);
  if (hatch) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = rgba(col, 0.22);
    ctx.lineWidth = 2;
    for (let d = -r * 2; d < r * 2; d += 14) {
      ctx.beginPath();
      ctx.moveTo(x + d - r, y + r);
      ctx.lineTo(x + d + r, y - r);
      ctx.stroke();
    }
    ctx.restore();
  }
}

/** Faint aura circles of beacon towers, drawn under the towers. */
export function drawAuras(ctx: Ctx, towers: TowerState[], time: number): void {
  for (const t of towers) {
    const r = t.stats.auraRadius ?? 0;
    if (t.type !== 'beacon' || r <= 0) continue;
    const col = t.branch === 1 ? C.teal : C.amber;
    const x = toPx(t.x);
    const y = toPy(t.y);
    ctx.fillStyle = rgba(col, 0.06);
    ctx.beginPath();
    ctx.arc(x, y, r * CELL, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.setLineDash([8, 8]);
    ctx.lineDashOffset = -time * 6;
    ring(ctx, x, y, r * CELL, rgba(col, 0.35), 1.5);
    ctx.restore();
    if (t.branch === 1) ring(ctx, x, y, r * CELL - 5, rgba(C.teal, 0.18), 3);
  }
}

export function drawBuildHighlights(ctx: Ctx, state: GameState, time: number): void {
  const a = 0.1 + 0.05 * Math.sin(time * 4);
  ctx.fillStyle = rgba(C.teal, a);
  ctx.strokeStyle = rgba(C.teal, 0.35);
  ctx.lineWidth = 1.5;
  for (let cy = 0; cy < ROWS; cy++) {
    for (let cx = 0; cx < COLS; cx++) {
      if (!isBuildable(state.grid, cx, cy)) continue;
      ctx.beginPath();
      ctx.roundRect(cx * CELL + 5, cy * CELL + GRID_Y + 5, CELL - 10, CELL - 10, 12);
      ctx.fill();
      ctx.stroke();
    }
  }
}

function drawCross(ctx: Ctx, x: number, y: number): void {
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 14, y - 14);
  ctx.lineTo(x + 14, y + 14);
  ctx.moveTo(x + 14, y - 14);
  ctx.lineTo(x - 14, y + 14);
  ctx.stroke();
  ctx.strokeStyle = C.red;
  ctx.lineWidth = 4;
  ctx.stroke();
}

export function drawGhost(ctx: Ctx, view: ViewState, time: number): void {
  if (!view.buildType || !view.hoverCell) return;
  const x = toPx(view.hoverCell.x + 0.5);
  const y = toPy(view.hoverCell.y + 0.5);
  const col = view.buildValid ? C.green : C.red;
  drawRange(ctx, x, y, view.buildRange, col, !view.buildValid);
  ctx.fillStyle = rgba(col, 0.25);
  ctx.beginPath();
  ctx.roundRect(view.hoverCell.x * CELL + 3, view.hoverCell.y * CELL + GRID_Y + 3, CELL - 6, CELL - 6, 12);
  ctx.fill();
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = 0.65;
  drawTower(ctx, view.buildType, { level: 0, branch: -1, angle: -0.6, t: time, flash: 0, disabled: false, seed: 0 }, false);
  ctx.restore();
  if (!view.buildValid) drawCross(ctx, x, y);
}

export function drawSelection(ctx: Ctx, state: GameState, view: ViewState, time: number): void {
  if (view.selectedTowerId <= 0) return;
  const t = state.towers.find((tw) => tw.id === view.selectedTowerId);
  if (!t) return;
  const x = toPx(t.x);
  const y = toPy(t.y);
  drawRange(ctx, x, y, t.stats.range, C.amberLight);
  ctx.save();
  ctx.setLineDash([6, 5]);
  ctx.lineDashOffset = -time * 14;
  ring(ctx, x, y + 8, 32, C.white, 2.5);
  ctx.restore();
}

export function drawSpellTarget(ctx: Ctx, view: ViewState, time: number): void {
  if (view.spellTarget !== 'starfall' || !view.pointer) return;
  const x = toPx(view.pointer.x);
  const y = toPy(view.pointer.y);
  const r = (SPELLS.starfall.radius ?? 1.6) * CELL;
  glow(ctx, x, y, r * 1.2, C.amberLight, 0.3);
  ctx.fillStyle = rgba(C.amber, 0.12);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.setLineDash([10, 6]);
  ctx.lineDashOffset = -time * 20;
  ring(ctx, x, y, r, C.amberLight, 3);
  ctx.restore();
  ctx.strokeStyle = rgba(C.white, 0.8);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 10, y);
  ctx.lineTo(x + 10, y);
  ctx.moveTo(x, y - 10);
  ctx.lineTo(x, y + 10);
  ctx.stroke();
}

export function drawDarkness(ctx: Ctx, state: GameState, time: number): void {
  if (state.darknessTime <= 0 || !state.darknessAt) return;
  const x = toPx(state.darknessAt.x);
  const y = toPy(state.darknessAt.y);
  const r = 2 * CELL;
  glow(ctx, x, y, r * 1.35, C.ink, 0.95);
  circle(ctx, x, y, r * 0.8, rgba(C.ink, 0.8));
  ring(ctx, x, y, r, rgba(C.violet, 0.6 + 0.2 * Math.sin(time * 5)), 2);
}

/** Drifting fog with clear holes around beacons and the tree. */
export class FogLayer {
  private pattern: HTMLCanvasElement;
  private buf: HTMLCanvasElement;
  private bctx: Ctx;
  private static W = 640;
  private static H = 360;

  constructor() {
    const [pat, pctx] = makeCanvas(FogLayer.W, FogLayer.H);
    const rnd = mulberry32(4242);
    for (let i = 0; i < 46; i++) {
      const x = rnd() * FogLayer.W;
      const y = rnd() * FogLayer.H;
      const r = 40 + rnd() * 60;
      for (const dx of [0, -FogLayer.W, FogLayer.W]) glow(pctx, x + dx, y, r, '#cfc8f0', 0.55);
    }
    this.pattern = pat;
    const [buf, bctx] = makeCanvas(FogLayer.W, FogLayer.H);
    this.buf = buf;
    this.bctx = bctx;
  }

  draw(ctx: Ctx, state: GameState, time: number): void {
    const b = this.bctx;
    const { W, H } = { W: FogLayer.W, H: FogLayer.H };
    b.globalCompositeOperation = 'source-over';
    b.clearRect(0, 0, W, H);
    b.fillStyle = rgba(C.night, 0.5);
    b.fillRect(0, 0, W, H);
    const off = (time * 9) % W;
    b.globalAlpha = 0.45;
    b.drawImage(this.pattern, -off, 0);
    b.drawImage(this.pattern, W - off, 0);
    b.globalAlpha = 1;
    b.globalCompositeOperation = 'destination-out';
    const hole = (px: number, py: number, rCells: number) => {
      const x = px / 2;
      const y = py / 2;
      const r = (rCells * CELL) / 2;
      const g = b.createRadialGradient(x, y, r * 0.35, x, y, r);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      b.fillStyle = g;
      b.beginPath();
      b.arc(x, y, r, 0, Math.PI * 2);
      b.fill();
    };
    for (const t of state.towers) {
      const r = t.stats.auraRadius ?? 0;
      if (t.type === 'beacon' && r > 0) hole(toPx(t.x), toPy(t.y), r);
    }
    hole(toPx(state.level.tree.x + 0.5), toPy(state.level.tree.y + 0.5), 2.2);
    b.globalCompositeOperation = 'source-over';
    ctx.drawImage(this.buf, 0, 0, WORLD_W, WORLD_H);
  }
}
