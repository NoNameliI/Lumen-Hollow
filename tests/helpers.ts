import type { LevelDef, RunConfig, WaveDef } from '../src/types';
import { DEFAULT_BONUSES } from '../src/data/difficulty';
import { TOWER_ORDER } from '../src/data/towers';
import { SPELL_ORDER } from '../src/data/spells';
import { Game } from '../src/core/game';

/** Straight path along row 5 from the left edge to the tree at (19,5). */
export function testLevel(waves: WaveDef[] = [], extra: Partial<LevelDef> = {}): LevelDef {
  return {
    id: 99,
    biome: 'meadow',
    seed: 1,
    paths: [{ entrance: 0, points: [{ x: -1, y: 5 }, { x: 19, y: 5 }] }],
    tree: { x: 19, y: 5 },
    towers: [...TOWER_ORDER],
    spells: [...SPELL_ORDER],
    intro: {},
    startGold: 1000,
    hpMul: 1,
    waveGap: 10,
    waves,
    ...extra,
  };
}

export function testGame(level: LevelDef, cfg: Partial<RunConfig> = {}): Game {
  return new Game({
    level,
    difficulty: 'normal',
    bonuses: { ...DEFAULT_BONUSES },
    challenges: [],
    seed: 42,
    ...cfg,
  });
}

export function run(game: Game, seconds: number): void {
  const n = Math.round(seconds * 60);
  for (let i = 0; i < n && game.state.status === 'playing'; i++) game.step();
}
