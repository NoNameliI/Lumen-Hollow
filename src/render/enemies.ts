import type { EnemyId, EnemyState, GameState } from '../types';
import { CELL, toPx, toPy } from '../core/constants';
import { C } from './palette';
import { drawBody, spriteExtent } from './enemyBodies';
import { circle, ellipse, FONT, makeCanvas, rgba, ring, star4 } from './shapes';

type Ctx = CanvasRenderingContext2D;

const RES = 2;

interface Sprite {
  canvas: HTMLCanvasElement;
  half: number; // logical half-size
}

const sprites = new Map<string, Sprite>();

function getSprite(type: EnemyId, R: number, phase: number, frame: number, flash: boolean): Sprite {
  const key = `${type}|${Math.round(R)}|${phase}|${frame}|${flash ? 1 : 0}`;
  let s = sprites.get(key);
  if (s) return s;
  const half = spriteExtent(type) * R;
  const [canvas, ctx] = makeCanvas(half * 2 * RES, half * 2 * RES);
  ctx.scale(RES, RES);
  ctx.translate(half, half);
  drawBody(ctx, type, R, phase, frame);
  if (flash) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  s = { canvas, half };
  sprites.set(key, s);
  return s;
}

export function clearEnemySprites(): void {
  sprites.clear();
}

export function drawEnemyIcon(ctx: Ctx, type: EnemyId, size: number): void {
  const R = size / (2 * spriteExtent(type)) * 1.15;
  ctx.save();
  drawBody(ctx, type, R, 0, 0);
  ctx.restore();
}

function drawBar(ctx: Ctx, x: number, y: number, w: number, h: number, hp: number, shield: number, boss: boolean): void {
  ctx.fillStyle = C.ink;
  ctx.beginPath();
  ctx.roundRect(x - w / 2 - 1.5, y - 1.5, w + 3, h + 3, 3);
  ctx.fill();
  ctx.fillStyle = rgba(C.stoneDark, 0.9);
  ctx.fillRect(x - w / 2, y, w, h);
  ctx.fillStyle = hp > 0.5 ? C.green : hp > 0.25 ? C.amber : C.red;
  ctx.fillRect(x - w / 2, y, w * hp, h);
  ctx.fillStyle = rgba(C.white, 0.35);
  ctx.fillRect(x - w / 2, y, w * hp, Math.max(1, h * 0.3));
  if (boss) {
    ctx.fillStyle = rgba(C.ink, 0.8);
    for (const t of [0.25, 0.5, 0.75]) ctx.fillRect(x - w / 2 + w * t - 0.5, y, 1, h);
  }
  if (shield >= 0) {
    const sh = Math.max(2.5, h * 0.55);
    const sy = y - sh - 2;
    ctx.fillStyle = C.ink;
    ctx.fillRect(x - w / 2 - 1, sy - 1, w + 2, sh + 2);
    ctx.fillStyle = C.iceDark;
    ctx.fillRect(x - w / 2, sy, w * shield, sh);
    ctx.fillStyle = C.ice;
    ctx.fillRect(x - w / 2, sy, w * shield, Math.max(1, sh * 0.35));
    // notch marking the end of the shield segment
    ctx.fillStyle = C.white;
    ctx.fillRect(x - w / 2 + w * shield - 1, sy - 2, 2, sh + 4);
  }
}

function drawStatus(ctx: Ctx, e: EnemyState, x: number, y: number, R: number, t: number): void {
  if (e.freezeTime > 0) {
    ctx.fillStyle = rgba(C.ice, 0.4);
    ctx.beginPath();
    ctx.ellipse(x, y, R * 1.15, R * 1.05, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rgba(C.white, 0.75);
    for (let i = 0; i < 4; i++) {
      const a = -Math.PI / 2 + (i - 1.5) * 0.7;
      const bx = x + Math.cos(a) * R * 0.95;
      const by = y + Math.sin(a) * R * 0.95;
      ctx.beginPath();
      ctx.moveTo(bx - 3, by + 2);
      ctx.lineTo(bx + Math.cos(a) * 7, by + Math.sin(a) * 9);
      ctx.lineTo(bx + 3, by + 2);
      ctx.fill();
    }
  }
  if (e.slowTime > 0) {
    for (let i = 0; i < 3; i++) {
      const k = (t * 1.2 + i / 3) % 1;
      ellipse(ctx, x + (i - 1) * R * 0.6, y - R * 0.5 + k * R * 1.5, 1.6, 2.6, rgba(C.ice, 1 - k));
    }
  }
  if (e.poison.length > 0) {
    for (let i = 0; i < 3; i++) {
      const k = (t * 0.9 + i / 3) % 1;
      circle(ctx, x + Math.sin(t * 3 + i * 2) * R * 0.5, y - R * 0.2 - k * R * 1.2, 1.5 + (1 - k) * 1.5, rgba(C.green, 1 - k * 0.7));
    }
  }
  if (e.markTime > 0) {
    ctx.save();
    ctx.setLineDash([5, 4]);
    ring(ctx, x, y, R * 1.25, rgba(C.violetLight, 0.9), 2);
    ctx.restore();
    ring(ctx, x, y, R * 1.25 + 3, rgba(C.violet, 0.5), 1);
  }
  if (e.stunTime > 0) {
    for (let i = 0; i < 3; i++) {
      const a = t * 4 + i * 2.1;
      star4(ctx, x + Math.cos(a) * R * 0.7, y - R * 1.05 + Math.sin(a) * 3, 3, C.amberLight);
    }
  }
}

const scratch: EnemyState[] = [];

/** Draws ground units (sorted by depth), then flyers above them. */
export function drawEnemies(ctx: Ctx, state: GameState): void {
  const t = state.time;
  scratch.length = 0;
  for (const e of state.enemies) if (e.alive) scratch.push(e);
  scratch.sort((a, b) => a.y - b.y);
  for (const e of scratch) {
    const R = e.def.radius * CELL;
    if (e.def.flying) {
      ellipse(ctx, toPx(e.x), toPy(e.y) + R * 0.6, R * 0.8, R * 0.3, rgba(C.ink, 0.3));
    } else {
      drawOne(ctx, e, t);
    }
  }
  for (const e of scratch) if (e.def.flying) drawOne(ctx, e, t);
  for (const e of scratch) drawBars(ctx, e);
}

function drawOne(ctx: Ctx, e: EnemyState, t: number): void {
  const R = e.def.radius * CELL;
  const frozen = e.freezeTime > 0;
  const phase = e.boss?.phase ?? 0;
  const bob = frozen ? 0 : Math.sin(t * 5 + e.id * 1.7) * R * 0.07;
  const sq = frozen ? 0 : Math.sin(t * 9 + e.id) * 0.06;
  const lift = e.def.flying ? R * 1.1 + 6 : R * 0.2;
  const x = toPx(e.x);
  const y = toPy(e.y) - lift + bob;
  if (!e.def.flying) ellipse(ctx, x, toPy(e.y) + R * 0.55, R * 0.85, R * 0.28, rgba(C.ink, 0.32));
  const frame = e.type === 'moth' ? Math.floor(t * 10 + e.id) & 1 : 0;
  const sp = getSprite(e.type, R, phase, frame, e.hitFlash > 0);
  ctx.save();
  if (e.type === 'phantom') ctx.globalAlpha = e.revealed ? 0.85 : 0.25;
  ctx.translate(x, y);
  ctx.scale((e.dirX < 0 ? -1 : 1) * (1 + sq), 1 - sq);
  ctx.drawImage(sp.canvas, -sp.half, -sp.half, sp.half * 2, sp.half * 2);
  ctx.restore();
  if (e.freezeTime > 0 || e.slowTime > 0 || e.poison.length > 0 || e.markTime > 0 || e.stunTime > 0) {
    drawStatus(ctx, e, x, y, R, t);
  }
}

function drawBars(ctx: Ctx, e: EnemyState): void {
  const boss = !!e.def.boss;
  if (!boss && e.hp >= e.maxHp && !(e.shield > 0 && e.shield < e.maxShield)) return;
  const R = e.def.radius * CELL;
  const lift = e.def.flying ? R * 1.1 + 6 : R * 0.2;
  const w = boss ? 76 : Math.max(20, R * 2);
  const h = boss ? 7 : 4;
  const x = toPx(e.x);
  const top = toPy(e.y) - lift - R * (boss ? 1.55 : 1.2) - h - (e.maxShield > 0 ? 6 : 4);
  const shield = e.maxShield > 0 ? Math.max(0, e.shield / e.maxShield) : -1;
  drawBar(ctx, x, top, w, h, Math.max(0, e.hp / e.maxHp), shield, boss);
  if (boss) {
    ctx.font = `600 11px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = C.white;
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 3;
    const label = `${Math.ceil(e.hp)}`;
    ctx.strokeText(label, x, top - 4);
    ctx.fillText(label, x, top - 4);
  }
}
