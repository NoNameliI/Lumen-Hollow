import type { EnemyId, EnemyState, GameState, PathRuntime } from '../types';
import { BOSS_TUNING, ENEMIES, HEAL_INTERVAL, SWAMP_SLOW, hpCurve } from '../data/enemies';
import { TOWER_REVEAL_RADIUS } from '../data/towers';
import { endlessBossHp } from '../data/waveGen';
import { emit, newId } from './state';
import { rand } from './rng';
import { samplePath, type PathSample } from './path';
import { damageEnemy } from './damage';
import { initBoss, updateBoss } from './bosses';

export interface SpawnOpts {
  entrance?: number;
  path?: PathRuntime;
  dist?: number;
  wave: number;
  silent?: boolean;
}

const sample: PathSample = { x: 0, y: 0, dx: 1, dy: 0 };

export function pickPath(state: GameState, type: EnemyId, entrance: number): PathRuntime {
  if (ENEMIES[type].flying) {
    const air = state.airPaths;
    return air[entrance % air.length];
  }
  const options = state.paths.filter((p) => p.entrance === entrance);
  const list = options.length > 0 ? options : state.paths;
  if (list.length === 1) return list[0];
  return list[Math.floor(rand(state) * list.length)];
}

export function enemyHpScale(state: GameState, type: EnemyId, wave: number): number {
  const def = ENEMIES[type];
  if (def.scaleHp) return hpCurve(wave) * state.level.hpMul * state.mods.hpMul;
  return state.mods.hpMul * (state.config.endless ? endlessBossHp(wave) : 1);
}

export function spawnEnemy(state: GameState, type: EnemyId, opts: SpawnOpts): EnemyState {
  const def = ENEMIES[type];
  const path = opts.path ?? pickPath(state, type, opts.entrance ?? 0);
  const scale = enemyHpScale(state, type, opts.wave);
  const hp = def.hp * scale;
  const shield = (def.shield ?? 0) * scale;
  const dist = opts.dist ?? 0;
  samplePath(path, dist, sample);
  const e: EnemyState = {
    id: newId(state),
    type,
    def,
    alive: true,
    hp,
    maxHp: hp,
    shield,
    maxShield: shield,
    shieldDelay: 0,
    armor: (def.armor ?? 0) + state.mods.armorAdd,
    speed: def.speed * state.mods.speedMul,
    path,
    dist,
    x: sample.x,
    y: sample.y,
    dirX: sample.dx,
    dirY: sample.dy,
    remaining: path.length - dist,
    slow: 0,
    slowTime: 0,
    freezeTime: 0,
    stunTime: 0,
    poison: [],
    markTime: 0,
    acid: 0,
    acidTime: 0,
    hasteTime: 0,
    revealed: !def.invisible,
    age: 0,
    hitFlash: 0,
    wave: opts.wave,
  };
  if (def.boss) initBoss(e);
  state.enemies.push(e);
  if (!opts.silent) emit(state, { t: 'spawn', enemy: type, x: e.x, y: e.y, boss: !!def.boss });
  return e;
}

export function currentSpeed(state: GameState, e: EnemyState): number {
  if (e.freezeTime > 0 || e.stunTime > 0) return 0;
  let mul = 1;
  if (e.slowTime > 0) mul *= 1 - e.slow;
  if (!e.def.flying) {
    const cx = Math.floor(e.x);
    const cy = Math.floor(e.y);
    if (cx >= 0 && cy >= 0 && cx < state.grid.cols && cy < state.grid.rows) {
      if (state.grid.cells[cy * state.grid.cols + cx] === 'swamp') mul *= SWAMP_SLOW;
    }
  }
  if (e.hasteTime > 0) mul *= BOSS_TUNING.puddleHaste;
  return e.speed * mul;
}

function updateReveal(state: GameState, e: EnemyState): void {
  let seen = false;
  for (const t of state.towers) {
    const d = Math.hypot(t.x - e.x, t.y - e.y);
    const r = Math.max(TOWER_REVEAL_RADIUS, t.stats.auraRadius ?? 0);
    if (d <= r) {
      seen = true;
      break;
    }
  }
  e.revealed = seen;
}

function tickStatus(state: GameState, e: EnemyState, dt: number): void {
  e.age += dt;
  if (e.hitFlash > 0) e.hitFlash -= dt;
  if (e.slowTime > 0) e.slowTime -= dt;
  if (e.freezeTime > 0) e.freezeTime -= dt;
  if (e.stunTime > 0) e.stunTime -= dt;
  if (e.markTime > 0) e.markTime -= dt;
  if (e.hasteTime > 0) e.hasteTime -= dt;
  if (e.acidTime > 0) {
    e.acidTime -= dt;
    if (e.acidTime <= 0) e.acid = 0;
  }
  if (e.maxShield > 0 && e.shield < e.maxShield) {
    if (e.markTime > 0) e.shieldDelay = Math.max(e.shieldDelay, 0.5);
    else if (e.shieldDelay > 0) e.shieldDelay -= dt;
    else e.shield = Math.min(e.maxShield, e.shield + e.maxShield * dt);
  }
  if (e.poison.length > 0) {
    for (let i = e.poison.length - 1; i >= 0; i--) {
      const p = e.poison[i];
      const tick = Math.min(dt, p.time);
      p.time -= dt;
      const tower = p.towerId ? state.towers.find((t) => t.id === p.towerId) : undefined;
      damageEnemy(state, e, p.dps * tick, 'magic', { tower, silent: true });
      if (!e.alive) return;
      if (p.time <= 0) e.poison.splice(i, 1);
    }
  }
}

function healPulse(state: GameState, h: EnemyState): void {
  const r = h.def.healRadius ?? 0;
  const amount = (h.def.healRate ?? 0) * HEAL_INTERVAL;
  let any = false;
  for (const o of state.enemies) {
    if (!o.alive || o === h || o.hp >= o.maxHp) continue;
    if (Math.hypot(o.x - h.x, o.y - h.y) > r) continue;
    const scale = o.def.boss ? BOSS_TUNING.bossHealFactor : 1;
    o.hp = Math.min(o.maxHp, o.hp + amount * scale * (o.maxHp / o.def.hp > 1 ? Math.sqrt(o.maxHp / o.def.hp) : 1));
    any = true;
  }
  if (any) emit(state, { t: 'heal', x: h.x, y: h.y });
}

function leak(state: GameState, e: EnemyState): void {
  e.alive = false;
  state.lives = Math.max(0, state.lives - e.def.lives);
  state.stats.leaked += 1;
  emit(state, { t: 'leak', enemy: e.type, lives: e.def.lives });
}

export function updateEnemies(state: GameState, dt: number): void {
  const list = state.enemies;
  for (let i = 0; i < list.length; i++) {
    const e = list[i];
    if (!e.alive) continue;
    tickStatus(state, e, dt);
    if (!e.alive) continue;
    if (e.def.invisible) updateReveal(state, e);
    if (e.def.healRadius) {
      const before = Math.floor((e.age - dt) / HEAL_INTERVAL);
      if (Math.floor(e.age / HEAL_INTERVAL) !== before) healPulse(state, e);
    }
    if (e.boss) updateBoss(state, e, dt);
    const v = currentSpeed(state, e);
    if (v > 0) {
      e.dist += v * dt;
      samplePath(e.path, e.dist, sample);
      e.x = sample.x;
      e.y = sample.y;
      e.dirX = sample.dx;
      e.dirY = sample.dy;
    }
    e.remaining = e.path.length - e.dist;
    if (e.dist >= e.path.length) leak(state, e);
  }
}

export function compactEnemies(state: GameState): void {
  if (state.enemies.some((e) => !e.alive)) state.enemies = state.enemies.filter((e) => e.alive);
}
