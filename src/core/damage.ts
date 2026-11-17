import type { DamageType, EnemyState, GameState, TowerState, TowerStats } from '../types';
import { MARK_BONUS, MAX_POISON_STACKS } from '../data/towers';
import { SPELLS } from '../data/spells';
import { emit } from './state';
import { rand } from './rng';
import { spawnEnemy } from './enemies';
import { onBossDeath } from './bosses';

export interface HitSource {
  tower?: TowerState;
  armorPen?: number;
  crit?: boolean;
  silent?: boolean;
}

export function addGold(state: GameState, amount: number): void {
  if (amount <= 0) return;
  state.gold += amount;
  state.stats.goldEarned += amount;
}

/** Final damage after mark and armour, before shields. Exposed for tests and previews. */
export function mitigate(e: EnemyState, raw: number, type: DamageType, armorPen = 0): number {
  let dmg = raw;
  if (e.markTime > 0) dmg *= MARK_BONUS;
  if (type === 'physical') {
    const armor = Math.max(0, e.armor - e.acid) * (1 - armorPen);
    dmg = Math.max(1, dmg - armor);
  }
  return dmg;
}

export function damageEnemy(
  state: GameState,
  e: EnemyState,
  raw: number,
  type: DamageType,
  src: HitSource = {},
): number {
  if (!e.alive || raw <= 0) return 0;
  const dealt = mitigate(e, raw, type, src.armorPen);
  let rest = dealt;
  if (e.shield > 0) {
    const absorbed = Math.min(e.shield, rest);
    e.shield -= absorbed;
    rest -= absorbed;
    if (e.shield <= 0) emit(state, { t: 'shieldBreak', x: e.x, y: e.y });
  }
  if (e.maxShield > 0) e.shieldDelay = e.def.shieldRegenDelay ?? 4;
  e.hp -= rest;
  e.hitFlash = 0.08;
  const t = src.tower;
  if (t) {
    t.damage += dealt;
    state.stats.damageByType[t.type] = (state.stats.damageByType[t.type] ?? 0) + dealt;
  }
  if (!src.silent) {
    emit(state, { t: 'hit', x: e.x, y: e.y, amount: Math.round(dealt), crit: !!src.crit, magic: type === 'magic' });
  }
  if (e.hp <= 0) killEnemy(state, e, t);
  return dealt;
}

export function addPoison(e: EnemyState, dps: number, time: number, spread: boolean, towerId: number): void {
  if (e.poison.length >= MAX_POISON_STACKS) {
    let min = 0;
    for (let i = 1; i < e.poison.length; i++) if (e.poison[i].time < e.poison[min].time) min = i;
    e.poison.splice(min, 1);
  }
  e.poison.push({ dps, time, spread, towerId });
}

/** Status effects carried by a tower attack. */
export function applyHitEffects(state: GameState, e: EnemyState, s: TowerStats, tower?: TowerState): void {
  if (!e.alive) return;
  const res = e.def.ccResist ?? 0;
  if (s.slow && s.slowTime) {
    const strength = s.slow * (1 - res);
    e.slow = e.slowTime > 0 ? Math.max(e.slow, strength) : strength;
    e.slowTime = Math.max(e.slowTime, s.slowTime);
  }
  if (s.freezeChance && s.freezeTime && rand(state) < s.freezeChance) {
    e.freezeTime = Math.max(e.freezeTime, s.freezeTime * (1 - res));
    emit(state, { t: 'freeze', x: e.x, y: e.y });
  }
  if (s.stunTime) e.stunTime = Math.max(e.stunTime, s.stunTime * (1 - res));
  if (s.poisonDps && s.poisonTime) addPoison(e, s.poisonDps, s.poisonTime, !!s.poisonSpread, tower?.id ?? 0);
  if (s.acid && s.acidTime) {
    e.acid = Math.max(e.acid, s.acid);
    e.acidTime = Math.max(e.acidTime, s.acidTime);
  }
  if (s.markTime) e.markTime = Math.max(e.markTime, s.markTime);
}

export function killReward(state: GameState, e: EnemyState): number {
  const rush = state.goldRushTime > 0 ? 1 + (SPELLS.goldrush.power ?? 0) : 1;
  return Math.max(1, Math.round(e.def.reward * state.config.bonuses.killGoldMul * state.mods.goldMul * rush));
}

export function killEnemy(state: GameState, e: EnemyState, tower?: TowerState): void {
  if (!e.alive) return;
  e.alive = false;
  e.hp = 0;
  state.stats.kills++;
  if (e.def.boss) state.stats.bossKills++;
  if (tower) tower.kills++;
  let reward = killReward(state, e);
  for (const j of state.towers) {
    const s = j.stats;
    if (s.bountyRadius && s.bountyGold && Math.hypot(j.x - e.x, j.y - e.y) <= s.bountyRadius) {
      reward += s.bountyGold;
    }
  }
  addGold(state, reward);
  emit(state, { t: 'death', enemy: e.type, x: e.x, y: e.y, boss: !!e.def.boss });
  emit(state, { t: 'gold', x: e.x, y: e.y, amount: reward });

  const split = e.def.splitInto;
  if (split) {
    for (let i = 0; i < split.count; i++) {
      spawnEnemy(state, split.id, { path: e.path, dist: Math.max(0, e.dist - 0.18 * i), wave: e.wave, silent: true });
    }
  }
  const plague = e.poison.find((p) => p.spread);
  if (plague) {
    for (const o of state.enemies) {
      if (!o.alive || o === e || o.def.flying) continue;
      if (Math.hypot(o.x - e.x, o.y - e.y) <= 1.2) addPoison(o, plague.dps, 2.5, true, plague.towerId);
    }
  }
  if (e.def.boss) onBossDeath(state, e);
}
