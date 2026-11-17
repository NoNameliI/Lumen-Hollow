import type { EnemyState, GameState, TowerId, TowerState } from '../types';
import { Game } from '../core/game';
import { isBuildable, cellAt } from '../core/grid';
import { samplePath } from '../core/path';
import { mulberry32 } from '../core/rng';
import { TOWERS } from '../data/towers';
import { SPELLS } from '../data/spells';

export interface Bot {
  name: string;
  /** Called every decision tick (twice per sim second). */
  think(game: Game): void;
}

export const idleBot = (): Bot => ({
  name: 'idle',
  think(game) {
    if (game.state.wave.index === 0) game.callWave();
  },
});

/** Composition weights of an "average" build. */
const MIX: Record<TowerId, number> = {
  spark: 3,
  boomcap: 2,
  frost: 1.2,
  storm: 2,
  owl: 1.4,
  mold: 1.4,
  beacon: 0.6,
  jar: 0,
};

interface Spot {
  cx: number;
  cy: number;
  ground: number; // path samples within range 3
  air: number;
  rock: boolean;
}

function pathSamples(state: GameState, flying: boolean): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  const list = flying ? state.airPaths : state.paths;
  for (const p of list) {
    for (let d = 0; d < p.length; d += 0.5) {
      const s = samplePath(p, d);
      if (s.x >= 0 && s.y >= 0 && s.x <= state.grid.cols && s.y <= state.grid.rows) out.push({ x: s.x, y: s.y });
    }
  }
  return out;
}

function scanSpots(state: GameState): Spot[] {
  const ground = pathSamples(state, false);
  const air = pathSamples(state, true);
  const spots: Spot[] = [];
  for (let cy = 0; cy < state.grid.rows; cy++) {
    for (let cx = 0; cx < state.grid.cols; cx++) {
      const rock = cellAt(state.grid, cx, cy) === 'rock';
      if (!rock && !isBuildable(state.grid, cx, cy)) continue;
      const x = cx + 0.5;
      const y = cy + 0.5;
      const count = (pts: { x: number; y: number }[], r: number) =>
        pts.reduce((n, p) => n + ((p.x - x) ** 2 + (p.y - y) ** 2 <= r * r ? 1 : 0), 0);
      spots.push({ cx, cy, ground: count(ground, 3), air: count(air, 3), rock });
    }
  }
  return spots;
}

/**
 * Greedy builder with a balanced mix: keeps spending gold on the best-covered free cell,
 * alternates building and upgrading, and casts spells when they are clearly useful.
 * `skill` (0..1) scales how well it places and how often it upgrades.
 */
export function greedyBot(seed: number, skill = 0.6, only?: TowerId): Bot {
  const rnd = mulberry32(seed);
  const mix: Record<TowerId, number> = only
    ? (Object.fromEntries(Object.keys(MIX).map((k) => [k, k === only ? 1 : 0])) as Record<TowerId, number>)
    : MIX;
  let jarsWanted = 2;
  return {
    name: only ? `only-${only}` : 'greedy',
    think(game) {
      const s = game.state;
      if (s.status !== 'playing') return;
      castSpells(game, rnd);
      for (let guard = 0; guard < 4; guard++) if (!spend(game, rnd, skill, only ? 0 : jarsWanted, mix)) break;
      if (s.wave.index === 0 && attackers(s) > 0) game.callWave();
      if (s.wave.index > 12) jarsWanted = 3;
    },
  };
}

function attackers(state: GameState): number {
  return state.towers.filter((t) => t.def.kind !== 'aura' && t.def.kind !== 'income').length;
}

function wantedTowers(state: GameState): number {
  return 2 + Math.floor(state.wave.index * 0.75);
}

function pickType(game: Game, rnd: () => number, MIX: Record<TowerId, number>): TowerId | null {
  const s = game.state;
  const phantoms = s.level.waves.some((w) => w.groups.some((g) => g.enemy === 'phantom'));
  if (phantoms && MIX.beacon > 0 && s.level.towers.includes('beacon') && game.countOf('beacon') < 2 && attackers(s) >= 2 + game.countOf('beacon') * 6) {
    return 'beacon';
  }
  const avail = s.level.towers.filter((t) => MIX[t] > 0 && (t !== 'beacon' || attackers(s) >= 5));
  if (avail.length === 0) return null;
  // Pick the type that is most under-represented relative to its weight, with noise.
  let best: TowerId | null = null;
  let bestScore = -Infinity;
  const total = avail.reduce((n, t) => n + MIX[t], 0);
  for (const t of avail) {
    const share = game.countOf(t) / Math.max(1, s.towers.length);
    const score = MIX[t] / total - share + rnd() * 0.15;
    if (score > bestScore) {
      bestScore = score;
      best = t;
    }
  }
  return best;
}

function bestSpot(game: Game, type: TowerId, spots: Spot[], skill: number, rnd: () => number): Spot | null {
  const def = TOWERS[type];
  let best: Spot | null = null;
  let bestScore = -Infinity;
  for (const sp of spots) {
    if (sp.rock || !isBuildable(game.state.grid, sp.cx, sp.cy)) continue;
    let score: number;
    if (def.kind === 'aura') {
      score = game.state.towers.filter((t) => Math.hypot(t.x - sp.cx - 0.5, t.y - sp.cy - 0.5) <= 2).length;
    } else if (def.kind === 'income') {
      score = -sp.ground; // keep good cells for fighters
    } else {
      score = (def.hitsGround ? sp.ground : 0) + (def.hitsAir ? sp.air * 0.6 : 0);
      if (cellAt(game.state.grid, sp.cx, sp.cy) === 'high') score *= 1.2;
    }
    score *= 1 + (rnd() - 0.5) * (1 - skill);
    if (score > bestScore) {
      bestScore = score;
      best = sp;
    }
  }
  return best;
}

let spotCache = new WeakMap<GameState, Spot[]>();

function spend(game: Game, rnd: () => number, skill: number, jarsWanted: number, mix: Record<TowerId, number>): boolean {
  const s = game.state;
  let spots = spotCache.get(s);
  if (!spots) {
    spots = scanSpots(s);
    spotCache.set(s, spots);
  }
  // Jars early when available.
  if (s.level.towers.includes('jar') && game.countOf('jar') < jarsWanted && s.wave.index <= 10) {
    if (s.gold >= game.buildCost('jar')) {
      const sp = bestSpot(game, 'jar', spots, skill, rnd);
      if (sp && game.build('jar', sp.cx, sp.cy).ok) return true;
    }
    if (game.countOf('jar') < 1) return false;
  }
  const upgradeFirst = attackers(s) >= wantedTowers(s) || rnd() < skill * 0.35;
  if (upgradeFirst && tryUpgrade(game, rnd)) return true;
  const type = pickType(game, rnd, mix);
  if (type && s.gold >= game.buildCost(type)) {
    const sp = bestSpot(game, type, spots, skill, rnd);
    if (sp && game.build(type, sp.cx, sp.cy).ok) return true;
    // Open space by clearing the best rock when cells run out.
    const rock = spots.filter((p) => p.rock && cellAt(s.grid, p.cx, p.cy) === 'rock').sort((a, b) => b.ground - a.ground)[0];
    if (rock && s.gold >= game.rockCost() + game.buildCost(type)) {
      game.removeRock(rock.cx, rock.cy);
      spotCache = new WeakMap();
      return true;
    }
  }
  return !upgradeFirst && tryUpgrade(game, rnd);
}

function tryUpgrade(game: Game, rnd: () => number): boolean {
  const s = game.state;
  let best: TowerState | null = null;
  let bestScore = -Infinity;
  for (const t of s.towers) {
    const cost = game.upgradeCost(t);
    if (cost === null || cost > s.gold) continue;
    if (t.def.kind === 'income' && s.wave.index < 5) continue;
    const value = t.def.kind === 'income' ? 0.6 : 1 + t.damage / Math.max(1, s.time * 20);
    const score = value / cost - t.level * 0.002 + rnd() * 0.001;
    if (score > bestScore) {
      bestScore = score;
      best = t;
    }
  }
  if (!best) return false;
  const branch = best.level === 2 ? (rnd() < 0.5 ? 0 : 1) : undefined;
  return game.upgrade(best.id, branch).ok;
}

function castSpells(game: Game, rnd: () => number): void {
  const s = game.state;
  const alive = s.enemies.filter((e) => e.alive);
  if (alive.length === 0) return;
  const boss = alive.find((e) => e.def.boss);
  const danger = alive.find((e) => e.remaining < 3);
  if (s.level.spells.includes('frostnova') && s.spells.frostnova.cooldown <= 0 && (danger || (boss && boss.remaining < 8))) {
    game.castSpell('frostnova');
  }
  if (s.level.spells.includes('goldrush') && s.spells.goldrush.cooldown <= 0 && alive.length >= 12) {
    game.castSpell('goldrush');
  }
  if (s.level.spells.includes('starfall') && s.spells.starfall.cooldown <= 0) {
    const target = densest(alive, SPELLS.starfall.radius ?? 1.6);
    if (target && (target.n >= 5 || boss) && rnd() < 0.9) game.castSpell('starfall', target.x, target.y);
  }
}

function densest(list: EnemyState[], r: number): { x: number; y: number; n: number } | null {
  let best: { x: number; y: number; n: number } | null = null;
  for (const e of list) {
    let n = 0;
    for (const o of list) if ((o.x - e.x) ** 2 + (o.y - e.y) ** 2 <= r * r) n += o.def.boss ? 8 : 1;
    if (!best || n > best.n) best = { x: e.x + e.dirX * e.speed * 0.6, y: e.y + e.dirY * e.speed * 0.6, n };
  }
  return best;
}
