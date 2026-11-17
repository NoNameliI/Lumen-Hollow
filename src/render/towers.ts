import type { TowerId } from '../types';
import { C } from './palette';
import { circle, ellipse, glow, rgba, ring, shade, star4 } from './shapes';

type Ctx = CanvasRenderingContext2D;

export interface TowerPose {
  level: number;
  branch: number;
  angle: number;
  t: number;
  flash: number; // 0..1, recent shot intensity
  disabled: boolean;
  seed: number;
}

function stalk(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, w: number, col: string): void {
  ctx.strokeStyle = col;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(x0 + (x1 - x0) * 0.1, (y0 + y1) / 2, x1, y1);
  ctx.stroke();
}

function leaf(ctx: Ctx, x: number, y: number, a: number, len: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ellipse(ctx, len / 2, 0, len / 2, len * 0.22, C.green);
  ctx.restore();
}

function spark(ctx: Ctx, p: TowerPose): void {
  const sway = Math.sin(p.t * 1.6 + p.seed) * 2;
  stalk(ctx, 0, 24, sway, -4, 5, C.greenDark);
  leaf(ctx, 1, 14, -0.6, 14);
  leaf(ctx, 0, 8, Math.PI + 0.6, 12);
  const hx = sway;
  const hy = -14;
  const heavy = p.branch === 1;
  const r = heavy ? 14 : 11.5;
  const rec = p.flash * 4;
  glow(ctx, hx, hy, 34 + p.flash * 22, heavy ? '#ff8a3a' : C.amber, 0.55 + p.flash * 0.4);
  const ca = Math.cos(p.angle);
  const sa = Math.sin(p.angle);
  const nozzle = (off: number) => {
    ctx.save();
    ctx.translate(hx - ca * rec, hy - sa * rec);
    ctx.rotate(p.angle);
    ctx.fillStyle = C.amberDark;
    ctx.beginPath();
    ctx.roundRect(r - 4, -3.5 + off, 13, 7, 3);
    ctx.fill();
    ctx.restore();
  };
  if (p.branch === 0) {
    nozzle(-4);
    nozzle(4);
  } else nozzle(0);
  ctx.fillStyle = C.amberDark;
  ctx.beginPath();
  ctx.roundRect(hx - r * 0.7, hy - r - 3, r * 1.4, 5, 2);
  ctx.fill();
  ellipse(ctx, hx, hy, r, r * 1.1, heavy ? '#ff9a3a' : C.amber);
  ellipse(ctx, hx - 2, hy - 2, r * 0.6, r * 0.7, C.amberLight);
  circle(ctx, hx + ca * 2, hy + sa * 2, 3.5, C.white);
  if (p.flash > 0) {
    const tx = hx + ca * (r + 14);
    const ty = hy + sa * (r + 14);
    glow(ctx, tx, ty, 14, C.amberLight, p.flash);
    star4(ctx, tx, ty, 8 * p.flash + 2, C.white);
  }
}

function boomcap(ctx: Ctx, p: TowerPose): void {
  const big = p.branch === 1;
  ellipse(ctx, 0, 24, 16, 5, rgba(C.ink, 0.3));
  ctx.fillStyle = '#efe3d2';
  ctx.beginPath();
  ctx.moveTo(-8, 26);
  ctx.quadraticCurveTo(-5, 8, -6, -2);
  ctx.lineTo(6, -2);
  ctx.quadraticCurveTo(5, 8, 8, 26);
  ctx.closePath();
  ctx.fill();
  const squash = 1 - p.flash * 0.12;
  ctx.save();
  ctx.translate(0, -2);
  ctx.scale(1 + p.flash * 0.08, squash);
  ctx.rotate(Math.sin(p.t * 1.3 + p.seed) * 0.04 + Math.cos(p.angle) * 0.08);
  const cap = big ? '#d8483f' : '#c0583a';
  const rx = big ? 27 : 24;
  ctx.fillStyle = cap;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, 17, 0, Math.PI, 0);
  ctx.quadraticCurveTo(0, 7, -rx, 0);
  ctx.fill();
  ctx.fillStyle = shade(cap, 0.25);
  ctx.beginPath();
  ctx.ellipse(-6, -8, 9, 4, -0.4, 0, Math.PI * 2);
  ctx.fill();
  const spots = p.branch === 0 ? 5 : 3;
  for (let i = 0; i < spots; i++) {
    const sx = (i - (spots - 1) / 2) * (rx / (spots / 1.6)) + (i % 2) * 2;
    circle(ctx, sx, -6 - (i % 2) * 5, big ? 4.2 : 3, p.branch === 0 ? C.amberLight : C.white);
  }
  // mortar tube
  ctx.save();
  ctx.translate(0, -14);
  ctx.rotate(p.angle);
  ctx.fillStyle = C.stoneDark;
  ctx.beginPath();
  ctx.roundRect(2 - p.flash * 3, big ? -5 : -4, big ? 20 : 16, big ? 10 : 8, 3);
  ctx.fill();
  ctx.restore();
  ctx.restore();
  if (p.flash > 0) {
    const tx = Math.cos(p.angle) * 20;
    const ty = -16 + Math.sin(p.angle) * 20;
    glow(ctx, tx, ty, 22, C.amber, p.flash);
    circle(ctx, tx, ty, 5 * p.flash + 1, C.white);
  }
}

function frost(ctx: Ctx, p: TowerPose): void {
  const deep = p.branch === 0;
  const sway = Math.sin(p.t * 1.2 + p.seed) * 1.5;
  stalk(ctx, 0, 26, sway, -6, 4, C.tealDark);
  leaf(ctx, 0, 18, -0.3, 12);
  glow(ctx, sway, -10, 34 + p.flash * 18, C.ice, 0.4 + p.flash * 0.4);
  const petals = p.branch === 1 ? 8 : 6;
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * Math.PI * 2 + Math.sin(p.t * 0.7) * 0.08;
    ctx.save();
    ctx.translate(sway, -10);
    ctx.rotate(a);
    ellipse(ctx, 12, 0, 12, 4.5, i % 2 ? '#d6f8ff' : C.ice);
    ctx.restore();
  }
  ctx.save();
  ctx.translate(sway, -10);
  ctx.rotate(Math.PI / 4);
  const s = deep ? 9 : 7;
  ctx.fillStyle = deep ? C.iceDark : C.white;
  ctx.fillRect(-s, -s, s * 2, s * 2);
  ctx.fillStyle = C.white;
  ctx.fillRect(-s * 0.45, -s * 0.45, s * 0.9, s * 0.9);
  ctx.restore();
  if (p.branch === 1) {
    for (let i = 0; i < 3; i++) {
      const a = p.t * 1.5 + i * 2.1;
      star4(ctx, sway + Math.cos(a) * 24, -10 + Math.sin(a) * 18, 3, C.white);
    }
  }
}

function storm(ctx: Ctx, p: TowerPose): void {
  const over = p.branch === 0;
  for (let i = -1; i <= 1; i++) {
    const sw = Math.sin(p.t * 1.8 + i + p.seed) * 2.5;
    stalk(ctx, i * 8, 26, i * 7 + sw, -8 - (i === 0 ? 4 : 0), 3.5, '#4f7a4a');
    circle(ctx, i * 7 + sw, -8 - (i === 0 ? 4 : 0), 3, C.wood);
  }
  const f = 0.5 + 0.5 * Math.sin(p.t * 9 + p.seed);
  const oy = -20;
  glow(ctx, 0, oy, 38 + p.flash * 20, C.violetLight, 0.55 + 0.25 * f + p.flash * 0.3);
  circle(ctx, 0, oy, over ? 11 : 9, C.violet);
  circle(ctx, 0, oy, over ? 7 : 6, C.violetLight);
  circle(ctx, 0, oy, 3 + f * 2, over ? C.amberLight : C.white);
  if (p.branch === 1) ring(ctx, 0, oy, 15, rgba(C.teal, 0.8), 2);
  ctx.strokeStyle = rgba(C.white, 0.5 + 0.4 * f);
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 2; i++) {
    const a = p.t * 4 + i * 3 + Math.floor(p.t * 6) * 1.7;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 9, oy + Math.sin(a) * 9);
    ctx.lineTo(Math.cos(a + 0.2) * 15, oy + Math.sin(a + 0.2) * 15);
    ctx.lineTo(Math.cos(a - 0.1) * 21, oy + Math.sin(a - 0.1) * 21);
    ctx.stroke();
  }
}

function owl(ctx: Ctx, p: TowerPose): void {
  const hunter = p.branch === 1;
  ellipse(ctx, 0, 27, 14, 4, rgba(C.ink, 0.3));
  ctx.fillStyle = C.wood;
  ctx.fillRect(-4, 6, 8, 22);
  ellipse(ctx, 0, 28, 12, 3, shade(C.wood, -0.2));
  const bob = Math.sin(p.t * 1.4 + p.seed) * 1;
  const body = hunter ? '#5a3b55' : '#6e5a8a';
  ellipse(ctx, 0, -2 + bob, 15, 17, body);
  ellipse(ctx, 0, 3 + bob, 9, 10, shade(body, 0.3));
  ctx.fillStyle = body;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * 9, -15 + bob);
    ctx.lineTo(s * 14, -26 + bob);
    ctx.lineTo(s * 4, -17 + bob);
    ctx.fill();
    ellipse(ctx, s * 15, 2 + bob, 4, 11, shade(body, -0.2), s * 0.2);
  }
  const eyeCol = hunter ? C.red : p.branch === 0 ? C.amber : C.amberLight;
  const ca = Math.cos(p.angle);
  const sa = Math.sin(p.angle);
  for (const s of [-1, 1]) {
    glow(ctx, s * 6, -8 + bob, 12 + p.flash * 8, eyeCol, 0.45 + p.flash * 0.5);
    circle(ctx, s * 6, -8 + bob, 6.5, C.white);
    circle(ctx, s * 6 + ca * 2.5, -8 + bob + sa * 2.5, 3.6, C.ink);
    circle(ctx, s * 6 + ca * 2.5 - 1, -9 + bob + sa * 2.5, 1.1, eyeCol);
  }
  ctx.fillStyle = C.amberDark;
  ctx.beginPath();
  ctx.moveTo(-2, -3 + bob);
  ctx.lineTo(2, -3 + bob);
  ctx.lineTo(0, 2 + bob);
  ctx.fill();
  if (p.branch === 0) ring(ctx, 0, -8 + bob, 20, rgba(C.amber, 0.35), 1.5);
}

function mold(ctx: Ctx, p: TowerPose): void {
  const acid = p.branch === 1;
  const base = acid ? '#9ac83a' : p.branch === 0 ? '#5a9a4a' : C.green;
  ellipse(ctx, 0, 22, 24, 7, rgba(C.ink, 0.3));
  const pods: [number, number, number][] = [
    [-14, 12, 9],
    [13, 13, 8],
    [0, 8, 11],
    [-6, -6, 8],
    [9, -3, 7],
  ];
  pods.forEach(([x, y, r], i) => {
    const pulse = 1 + Math.sin(p.t * 2 + i * 1.3 + p.seed) * 0.06 + p.flash * 0.12;
    circle(ctx, x, y, r * pulse, shade(base, -0.25));
    circle(ctx, x - 1, y - 1.5, r * pulse * 0.82, base);
    circle(ctx, x - r * 0.3, y - r * 0.35, r * 0.28, shade(base, 0.5));
    if (p.branch === 0) circle(ctx, x + r * 0.35, y + r * 0.2, r * 0.2, C.violetLight);
  });
  for (let i = 0; i < 3; i++) {
    const a = (p.t * 0.5 + i / 3) % 1;
    circle(ctx, -8 + i * 8 + Math.sin(a * 6) * 3, -10 - a * 22, 2 * (1 - a) + 0.5, rgba(shade(base, 0.4), 1 - a));
  }
  if (acid) {
    ctx.fillStyle = C.amberLight;
    for (const x of [-12, 4, 14]) ellipse(ctx, x, 16 + ((p.t * 8 + x) % 8), 1.6, 2.6, rgba('#e8f070', 0.9));
  }
}

function beacon(ctx: Ctx, p: TowerPose): void {
  const ward = p.branch === 1;
  ellipse(ctx, 0, 26, 14, 4, rgba(C.ink, 0.3));
  ctx.fillStyle = C.stoneDark;
  ctx.fillRect(-3, -6, 6, 32);
  ellipse(ctx, 0, 26, 10, 3.5, C.stone);
  const pulse = 0.8 + Math.sin(p.t * 2 + p.seed) * 0.2;
  const col = ward ? C.teal : C.amber;
  glow(ctx, 0, -20, 46 * pulse, col, 0.65);
  ctx.fillStyle = C.stoneDark;
  ctx.beginPath();
  ctx.roundRect(-11, -36, 22, 5, 2);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(-11, -11, 22, 5, 2);
  ctx.fill();
  ctx.fillStyle = ward ? '#bff7ee' : C.amberLight;
  ctx.beginPath();
  ctx.roundRect(-8, -32, 16, 21, 5);
  ctx.fill();
  ellipse(ctx, 0, -21, 4, 7, C.white);
  ctx.strokeStyle = C.stoneDark;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-8, -32, 16, 21);
  if (ward) ring(ctx, 0, -21, 17 + Math.sin(p.t * 2) * 1.5, rgba(C.teal, 0.8), 2);
  else {
    ctx.strokeStyle = rgba(C.amberLight, 0.7);
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const a = p.t * 0.6 + (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 15, -21 + Math.sin(a) * 15);
      ctx.lineTo(Math.cos(a) * 21, -21 + Math.sin(a) * 21);
      ctx.stroke();
    }
  }
}

function jar(ctx: Ctx, p: TowerPose): void {
  const col = p.branch === 1 ? C.teal : C.amber;
  ellipse(ctx, 0, 25, 17, 5, rgba(C.ink, 0.3));
  glow(ctx, 0, 0, 40, col, 0.4);
  ctx.fillStyle = rgba(C.white, 0.16);
  ctx.beginPath();
  ctx.roundRect(-14, -16, 28, 40, 10);
  ctx.fill();
  ctx.strokeStyle = rgba(C.white, 0.6);
  ctx.lineWidth = 2;
  ctx.stroke();
  const n = 3 + (p.branch >= 0 ? 2 : 0) + p.level;
  for (let i = 0; i < n; i++) {
    const a = p.t * (0.9 + (i % 3) * 0.3) + i * 2.4 + p.seed;
    const fx = Math.cos(a) * 8;
    const fy = 4 + Math.sin(a * 1.3) * 12;
    glow(ctx, fx, fy, 8, col, 0.9);
    circle(ctx, fx, fy, 1.8, C.white);
  }
  ctx.fillStyle = C.wood;
  ctx.beginPath();
  ctx.roundRect(-11, -22, 22, 8, 3);
  ctx.fill();
  ctx.strokeStyle = C.amberDark;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -24, 6, Math.PI, 0);
  ctx.stroke();
  if (p.branch === 1) star4(ctx, 0, -4 + Math.sin(p.t * 3) * 2, 3, C.amberLight);
}

const DRAW: Record<TowerId, (ctx: Ctx, p: TowerPose) => void> = {
  spark,
  boomcap,
  frost,
  storm,
  owl,
  mold,
  beacon,
  jar,
};

function pips(ctx: Ctx, level: number, branch: number): void {
  if (level <= 0) return;
  for (let i = 0; i < level; i++) {
    const x = (i - (level - 1) / 2) * 9;
    circle(ctx, x, 31, 3.4, C.ink);
    circle(ctx, x, 31, 2.4, level === 3 ? (branch === 1 ? C.teal : C.amberLight) : C.amber);
  }
  if (level === 3) ring(ctx, 0, 24, 24, rgba(branch === 1 ? C.teal : C.amber, 0.5), 2);
}

/** Draws a tower centred on the cell centre (origin 0,0), local px units. */
export function drawTower(ctx: Ctx, type: TowerId, p: TowerPose, showPips = true): void {
  ctx.save();
  if (p.disabled) ctx.globalAlpha *= 0.55;
  DRAW[type](ctx, p);
  ctx.restore();
  if (showPips) pips(ctx, p.level, p.branch);
  if (p.disabled) {
    ctx.strokeStyle = rgba(C.ink, 0.85);
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(0, -4, 8 + i * 6, p.t * 2 + i * 2, p.t * 2 + i * 2 + 3.2);
      ctx.stroke();
    }
  }
}

export function drawHighBadge(ctx: Ctx, x: number, y: number): void {
  circle(ctx, x, y, 8, C.ink);
  circle(ctx, x, y, 6.5, C.teal);
  ctx.fillStyle = C.ink;
  ctx.beginPath();
  ctx.moveTo(x, y - 4);
  ctx.lineTo(x + 4, y + 1);
  ctx.lineTo(x + 1.5, y + 1);
  ctx.lineTo(x + 1.5, y + 4);
  ctx.lineTo(x - 1.5, y + 4);
  ctx.lineTo(x - 1.5, y + 1);
  ctx.lineTo(x - 4, y + 1);
  ctx.closePath();
  ctx.fill();
}

export function drawTowerIcon(ctx: Ctx, type: TowerId, size: number): void {
  ctx.save();
  ctx.scale(size / 72, size / 72);
  drawTower(
    ctx,
    type,
    { level: 0, branch: -1, angle: -0.6, t: 0.5, flash: 0, disabled: false, seed: 1 },
    false,
  );
  ctx.restore();
}
