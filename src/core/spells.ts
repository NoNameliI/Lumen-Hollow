import type { CommandResult, GameState, SpellId } from '../types';
import { SPELLS } from '../data/spells';
import { hpCurve } from '../data/enemies';
import { emit, newId } from './state';
import { damageEnemy } from './damage';

export function spellAvailable(state: GameState, id: SpellId): boolean {
  return state.level.spells.includes(id) && !state.mods.noSpells;
}

export function spellCooldown(state: GameState, id: SpellId): number {
  return SPELLS[id].cooldown * state.config.bonuses.spellCdMul;
}

/** Starfall damage scales with the wave so it stays relevant in later levels. */
export function starfallDamage(state: GameState): number {
  const w = Math.max(1, state.wave.index);
  return (SPELLS.starfall.damage ?? 0) * hpCurve(w) * state.level.hpMul;
}

export function castSpell(state: GameState, id: SpellId, x = 0, y = 0): CommandResult {
  if (state.status !== 'playing') return { ok: false, reason: 'over' };
  if (!spellAvailable(state, id)) return { ok: false, reason: 'locked' };
  const rt = state.spells[id];
  if (rt.cooldown > 0) return { ok: false, reason: 'cooldown' };
  const def = SPELLS[id];
  rt.cooldown = spellCooldown(state, id);
  state.stats.spellsCast++;
  switch (id) {
    case 'starfall':
      state.zones.push({
        id: newId(state),
        kind: 'starfall',
        x,
        y,
        r: def.radius ?? 1.5,
        time: 0,
        delay: def.delay ?? 0.5,
        damage: starfallDamage(state),
      });
      break;
    case 'frostnova':
      for (const e of state.enemies) {
        if (!e.alive) continue;
        const res = (e.def.ccResist ?? 0) * 0.5;
        e.freezeTime = Math.max(e.freezeTime, (def.duration ?? 2) * (1 - res));
      }
      break;
    case 'goldrush':
      state.goldRushTime = def.duration ?? 15;
      break;
  }
  emit(state, { t: 'spell', spell: id, x, y });
  return { ok: true };
}

export function updateSpellsAndZones(state: GameState, dt: number): void {
  for (const id of Object.keys(state.spells) as SpellId[]) {
    const rt = state.spells[id];
    if (rt.cooldown > 0) rt.cooldown = Math.max(0, rt.cooldown - dt);
  }
  if (state.goldRushTime > 0) state.goldRushTime = Math.max(0, state.goldRushTime - dt);
  if (state.darknessTime > 0) {
    state.darknessTime -= dt;
    if (state.darknessTime <= 0) state.darknessAt = null;
  }
  for (const z of state.zones) {
    if (z.kind === 'starfall') {
      z.delay -= dt;
      if (z.delay <= 0) {
        for (const e of state.enemies) {
          if (!e.alive) continue;
          if (Math.hypot(e.x - z.x, e.y - z.y) <= z.r + e.def.radius * 0.5) {
            damageEnemy(state, e, z.damage, 'magic');
          }
        }
        emit(state, { t: 'explode', x: z.x, y: z.y, r: z.r, kind: 'star' });
        z.time = -1;
      }
    } else {
      z.time -= dt;
      for (const e of state.enemies) {
        if (!e.alive || e.def.flying) continue;
        if (Math.hypot(e.x - z.x, e.y - z.y) <= z.r) e.hasteTime = Math.max(e.hasteTime, 0.5);
      }
    }
  }
  if (state.zones.some((z) => z.time < 0)) state.zones = state.zones.filter((z) => z.time >= 0);
}
