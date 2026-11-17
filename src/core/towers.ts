import type { EnemyState, GameState, TowerDef, TowerState, TowerStats } from '../types';
import { CHAIN_FALLOFF, FOG_RANGE, HIGH_GROUND_RANGE } from '../data/towers';
import { emit, newId } from './state';
import { rand } from './rng';
import { samplePath, type PathSample } from './path';
import { applyHitEffects, damageEnemy } from './damage';
import { currentSpeed } from './enemies';
import { cellAt } from './grid';

export interface StatResult {
  stats: TowerStats;
  inAura: boolean;
  warded: boolean;
  high: boolean;
}

export function baseStats(def: TowerDef, level: number, branch: number): TowerStats {
  return level < 3 ? def.tiers[level] : def.branches[branch === 1 ? 1 : 0].stats;
}

export function isAttacker(def: TowerDef): boolean {
  return def.kind !== 'aura' && def.kind !== 'income';
}

/** Effective stats for a tower of `def` at a cell, given the current beacons. */
export function computeStats(
  state: GameState,
  def: TowerDef,
  level: number,
  branch: number,
  cx: number,
  cy: number,
  selfId = 0,
): StatResult {
  const s: TowerStats = { ...baseStats(def, level, branch) };
  const x = cx + 0.5;
  const y = cy + 0.5;
  const high = cellAt(state.grid, cx, cy) === 'high';
  let auraDamage = 0;
  let auraRange = 0;
  let auraRate = 0;
  let inAura = false;
  let warded = false;
  for (const b of state.towers) {
    if (b.def.kind !== 'aura' || b.id === selfId) continue;
    const r = b.stats.auraRadius ?? 0;
    if (Math.hypot(b.x - x, b.y - y) > r + 0.01) continue;
    inAura = true;
    if (b.stats.warding) warded = true;
    auraDamage = Math.max(auraDamage, b.stats.auraDamage ?? 0);
    auraRange = Math.max(auraRange, b.stats.auraRange ?? 0);
    auraRate = Math.max(auraRate, b.stats.auraRate ?? 0);
  }
  if (def.kind === 'aura' && s.warding) warded = true;
  if (isAttacker(def)) {
    const bonus = state.config.bonuses;
    const dmgMul = bonus.damageMul * (1 + auraDamage);
    s.damage *= dmgMul;
    if (s.pulseDamage) s.pulseDamage *= dmgMul;
    if (s.poisonDps) s.poisonDps *= dmgMul;
    let rangeMul = bonus.rangeMul * (1 + auraRange);
    if (high) rangeMul *= HIGH_GROUND_RANGE;
    if (state.level.fog && !inAura) rangeMul *= FOG_RANGE;
    s.range *= rangeMul;
    s.rate *= 1 + auraRate;
    if (s.slowTime) s.slowTime *= bonus.slowTimeMul;
  }
  return { stats: s, inAura, warded, high };
}

export function recalcTowers(state: GameState): void {
  // Beacons first so their aura radius is current when others read it.
  const order = [...state.towers].sort((a, b) => Number(b.def.kind === 'aura') - Number(a.def.kind === 'aura'));
  for (const t of order) {
    const r = computeStats(state, t.def, t.level, t.branch, t.cx, t.cy, t.id);
    t.stats = r.stats;
    t.inAura = r.inAura;
    t.warded = r.warded;
    t.high = r.high;
  }
}

export function createTower(state: GameState, def: TowerDef, cx: number, cy: number, cost: number): TowerState {
  const t: TowerState = {
    id: newId(state),
    type: def.id,
    def,
    cx,
    cy,
    x: cx + 0.5,
    y: cy + 0.5,
    level: 0,
    branch: -1,
    stats: { ...def.tiers[0] },
    cooldown: 0.2,
    pulseTimer: 1,
    targetMode: 'first',
    targetId: 0,
    angle: -Math.PI / 2,
    lastShot: -10,
    disabledTime: 0,
    spent: cost,
    kills: 0,
    damage: 0,
    high: false,
    inAura: false,
    warded: false,
  };
  return t;
}

export function canHit(t: TowerState, e: EnemyState): boolean {
  if (!e.alive || !e.revealed) return false;
  return e.def.flying ? t.def.hitsAir : t.def.hitsGround;
}

export function inRange(t: TowerState, e: EnemyState, range = t.stats.range): boolean {
  const r = range + e.def.radius * 0.5;
  const dx = e.x - t.x;
  const dy = e.y - t.y;
  return dx * dx + dy * dy <= r * r;
}

export function acquireTarget(state: GameState, t: TowerState): EnemyState | null {
  let best: EnemyState | null = null;
  let score = 0;
  for (const e of state.enemies) {
    if (!canHit(t, e) || !inRange(t, e)) continue;
    let s: number;
    switch (t.targetMode) {
      case 'first':
        s = -e.remaining;
        break;
      case 'last':
        s = e.remaining;
        break;
      case 'strong':
        s = e.hp + e.shield;
        break;
      case 'close':
        s = -Math.hypot(e.x - t.x, e.y - t.y);
        break;
    }
    if (!best || s > score) {
      best = e;
      score = s;
    }
  }
  return best;
}

export function targetMul(s: TowerStats, e: EnemyState): number {
  return (e.def.flying ? (s.airMul ?? 1) : 1) * (e.def.boss ? (s.bossMul ?? 1) : 1);
}

const tmp: PathSample = { x: 0, y: 0, dx: 1, dy: 0 };

function fireChain(state: GameState, t: TowerState, first: EnemyState, dmg: number, crit: boolean): void {
  const s = t.stats;
  const points = [{ x: t.x, y: t.y - 0.4 }];
  const hit: EnemyState[] = [];
  let cur: EnemyState | null = first;
  let d = dmg;
  for (let k = 0; cur && k <= (s.chains ?? 0); k++) {
    hit.push(cur);
    points.push({ x: cur.x, y: cur.y });
    const from: EnemyState = cur;
    damageEnemy(state, from, d * targetMul(s, from), t.def.damageType, { tower: t, crit });
    applyHitEffects(state, from, s, t);
    d *= CHAIN_FALLOFF;
    cur = null;
    let bestD = (s.chainRange ?? 1.8) ** 2;
    for (const e of state.enemies) {
      if (!canHit(t, e) || hit.includes(e)) continue;
      const dd = (e.x - from.x) ** 2 + (e.y - from.y) ** 2;
      if (dd <= bestD) {
        bestD = dd;
        cur = e;
      }
    }
  }
  emit(state, { t: 'chain', points });
}

function fire(state: GameState, t: TowerState, e: EnemyState): void {
  const s = t.stats;
  let dmg = s.damage;
  let crit = false;
  if (s.critChance && rand(state) < s.critChance) {
    dmg *= s.critMul ?? 2;
    crit = true;
  }
  t.lastShot = state.time;
  t.targetId = e.id;
  t.angle = Math.atan2(e.y - t.y, e.x - t.x);
  emit(state, { t: 'shot', tower: t.type, towerId: t.id, x: t.x, y: t.y, tx: e.x, ty: e.y });
  switch (t.def.kind) {
    case 'chain':
      fireChain(state, t, e, dmg, crit);
      return;
    case 'snipe':
      emit(state, { t: 'beam', x: t.x, y: t.y - 0.3, tx: e.x, ty: e.y });
      damageEnemy(state, e, dmg * targetMul(s, e), t.def.damageType, { tower: t, armorPen: s.armorPen, crit });
      applyHitEffects(state, e, s, t);
      return;
    case 'mortar':
    case 'spore': {
      const flight = t.def.flightTime ?? 0.8;
      samplePath(e.path, e.dist + currentSpeed(state, e) * flight, tmp);
      state.projectiles.push({
        id: newId(state), kind: t.def.kind, towerId: t.id, targetId: e.id,
        x: t.x, y: t.y, sx: t.x, sy: t.y - 0.3, tx: tmp.x, ty: tmp.y,
        t: 0, dur: flight, speed: 0, damage: dmg, crit, stats: s, dtype: t.def.damageType, alive: true,
      });
      return;
    }
    default:
      state.projectiles.push({
        id: newId(state), kind: t.def.kind, towerId: t.id, targetId: e.id,
        x: t.x, y: t.y - 0.3, sx: t.x, sy: t.y - 0.3, tx: e.x, ty: e.y,
        t: 0, dur: 0, speed: t.def.projectileSpeed ?? 10, damage: dmg, crit, stats: s,
        dtype: t.def.damageType, alive: true,
      });
  }
}

function pulse(state: GameState, t: TowerState): boolean {
  const s = t.stats;
  const r = s.pulseRadius ?? 0;
  let any = false;
  for (const e of state.enemies) {
    if (!canHit(t, e) || !inRange(t, e, r)) continue;
    any = true;
    damageEnemy(state, e, s.pulseDamage ?? 0, 'magic', { tower: t, silent: true });
    applyHitEffects(state, e, { damage: 0, rate: 0, range: 0, slow: s.slow, slowTime: s.slowTime }, t);
  }
  if (any) emit(state, { t: 'pulse', x: t.x, y: t.y, r });
  return any;
}

export function updateTowers(state: GameState, dt: number): void {
  for (const t of state.towers) {
    if (t.disabledTime > 0) {
      t.disabledTime -= dt;
      continue;
    }
    const s = t.stats;
    if (s.pulseDamage && s.pulseInterval) {
      t.pulseTimer -= dt;
      if (t.pulseTimer <= 0) t.pulseTimer = pulse(state, t) ? s.pulseInterval : 0.25;
    }
    if (s.rate <= 0) continue;
    t.cooldown -= dt;
    if (t.cooldown > 0) continue;
    const target = acquireTarget(state, t);
    if (!target) {
      t.cooldown = 0;
      continue;
    }
    fire(state, t, target);
    t.cooldown += 1 / s.rate;
  }
}
