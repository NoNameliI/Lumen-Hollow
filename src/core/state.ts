import type { GameState, PathRuntime, RunConfig, SimEvent, Vec2 } from '../types';
import { FRAGILE_LIVES, makeMods } from '../data/difficulty';
import { START_LIVES } from './constants';
import { buildGrid } from './grid';
import { makePath } from './path';

function airPathsFor(config: RunConfig, ground: PathRuntime[]): PathRuntime[] {
  const level = config.level;
  const starts: Vec2[] =
    level.airSpawns && level.airSpawns.length > 0
      ? level.airSpawns
      : ground.map((p) => ({ x: p.points[0].x - 0.5, y: p.points[0].y - 0.5 }));
  const unique = starts.filter((s, i) => starts.findIndex((o) => o.x === s.x && o.y === s.y) === i);
  return unique.map((s, i) => makePath([s, level.tree], i, true));
}

export function createState(config: RunConfig): GameState {
  const level = config.level;
  const paths = level.paths.map((p) => makePath(p.points, p.entrance));
  const mods = makeMods(config.difficulty, config.challenges);
  const lives = config.challenges.includes('fragile')
    ? FRAGILE_LIVES
    : START_LIVES + config.bonuses.extraLives;
  return {
    config,
    level,
    mods,
    grid: buildGrid(level),
    paths,
    airPaths: airPathsFor(config, paths),
    time: 0,
    tick: 0,
    gold: level.startGold + config.bonuses.startGold,
    lives,
    maxLives: lives,
    wave: { index: 0, spawns: [], clock: 0, nextIn: Number.POSITIVE_INFINITY, spawning: false },
    totalWaves: config.endless ? Number.POSITIVE_INFINITY : level.waves.length,
    enemies: [],
    towers: [],
    projectiles: [],
    zones: [],
    spells: { starfall: { cooldown: 0 }, frostnova: { cooldown: 0 }, goldrush: { cooldown: 0 } },
    goldRushTime: 0,
    darknessAt: null,
    darknessTime: 0,
    status: 'playing',
    stats: {
      kills: 0,
      leaked: 0,
      goldEarned: 0,
      goldSpent: 0,
      towersBuilt: 0,
      spellsCast: 0,
      earlyCalls: 0,
      damageByType: {},
      bossKills: 0,
    },
    events: [],
    rngState: config.seed | 0 || 1,
    nextId: 1,
  };
}

export function emit(state: GameState, ev: SimEvent): void {
  state.events.push(ev);
}

export function newId(state: GameState): number {
  return state.nextId++;
}

export function entranceCount(state: GameState): number {
  let n = 0;
  for (const p of state.paths) n = Math.max(n, p.entrance + 1);
  return Math.max(1, n);
}
