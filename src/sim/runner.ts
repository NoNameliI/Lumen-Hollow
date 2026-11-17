import type { Difficulty, LevelDef, TowerId } from '../types';
import { Game } from '../core/game';
import { DEFAULT_BONUSES } from '../data/difficulty';
import type { Bot } from './bots';

export interface RunResult {
  level: number;
  difficulty: Difficulty;
  bot: string;
  won: boolean;
  lives: number;
  maxLives: number;
  wave: number;
  totalWaves: number;
  seconds: number;
  goldEarned: number;
  towers: number;
  damage: Partial<Record<TowerId, number>>;
  bossKilled: boolean;
}

const MAX_SECONDS = 60 * 90;

export function runLevel(level: LevelDef, difficulty: Difficulty, bot: Bot, seed: number, endless = false): RunResult {
  const game = new Game({ level, difficulty, bonuses: { ...DEFAULT_BONUSES }, challenges: [], seed, endless });
  const s = game.state;
  while (s.status === 'playing' && s.time < MAX_SECONDS) {
    if (s.tick % 30 === 0) bot.think(game);
    game.step();
    if (s.events.length > 2000) s.events.length = 0;
  }
  s.events.length = 0;
  return {
    level: level.id,
    difficulty,
    bot: bot.name,
    won: s.status === 'won',
    lives: s.lives,
    maxLives: s.maxLives,
    wave: s.wave.index,
    totalWaves: s.totalWaves,
    seconds: s.time,
    goldEarned: s.stats.goldEarned,
    towers: s.towers.length,
    damage: s.stats.damageByType,
    bossKilled: s.stats.bossKills > 0,
  };
}
