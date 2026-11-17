import type { LevelDef } from '../../types';
import { g, generateWaves, type WaveSpec } from '../waveGen';
import { P } from './util';

const ALL_BUT_JAR = ['spark', 'boomcap', 'frost', 'storm', 'owl', 'mold', 'beacon'] as const;

const L7_SPEC: WaveSpec = {
  count: 20,
  budget: 12.5,
  growth: 0.16,
  rushEvery: 6,
  roster: [
    { enemy: 'grunt', from: 1, weight: 2 },
    { enemy: 'runner', from: 1, weight: 1.2 },
    { enemy: 'moth', from: 2, weight: 1.2 },
    { enemy: 'splitter', from: 3, weight: 2 },
    { enemy: 'healer', from: 4, weight: 1 },
    { enemy: 'tank', from: 4, weight: 1.4 },
  ],
};

export const LEVEL_7: LevelDef = {
  id: 7,
  biome: 'cliffs',
  seed: 707,
  paths: [
    { entrance: 0, points: P(-1, 5, 4, 5, 4, 2, 12, 2, 12, 5, 18, 5) },
    { entrance: 0, points: P(-1, 5, 4, 5, 4, 8, 12, 8, 12, 5, 18, 5) },
  ],
  tree: { x: 18, y: 5 },
  blocked: P(7, 5, 8, 5, 9, 5, 0, 0, 19, 10, 16, 1),
  towers: [...ALL_BUT_JAR],
  spells: ['starfall', 'frostnova'],
  intro: { towers: ['beacon'], enemies: ['splitter'], spells: ['frostnova'], features: ['fork'] },
  hints: [
    { key: 'fork', trigger: 'start' },
    { key: 'beacon', trigger: 'start' },
    { key: 'frostnova', wave: 2 },
    { key: 'splitter', wave: 3 },
  ],
  startGold: 340,
  hpMul: 1.35,
  waveGap: 11,
  waves: generateWaves(L7_SPEC, 707),
};

const L8_SPEC: WaveSpec = {
  count: 22,
  budget: 13.5,
  growth: 0.16,
  rushEvery: 7,
  roster: [
    { enemy: 'grunt', from: 1, weight: 2 },
    { enemy: 'runner', from: 1, weight: 1.5 },
    { enemy: 'swarmling', from: 2, weight: 1.5 },
    { enemy: 'moth', from: 2, weight: 1.2 },
    { enemy: 'splitter', from: 4, weight: 1.3 },
    { enemy: 'healer', from: 5, weight: 1 },
    { enemy: 'tank', from: 3, weight: 1.6 },
  ],
};

export const LEVEL_8: LevelDef = {
  id: 8,
  biome: 'cliffs',
  seed: 808,
  paths: [{ entrance: 0, points: P(-1, 3, 7, 3, 7, 8, 13, 8, 13, 3, 18, 3) }],
  airSpawns: P(10, -1),
  tree: { x: 18, y: 3 },
  rocks: P(6, 2, 8, 2, 6, 4, 8, 4, 6, 6, 8, 6, 8, 9, 6, 9, 10, 7, 11, 9, 12, 7, 14, 7, 12, 4, 14, 4, 12, 2, 14, 2, 16, 4, 16, 2, 3, 2, 3, 4, 10, 9, 9, 7),
  rockCost: 30,
  blocked: P(0, 10, 19, 10, 18, 9, 1, 9),
  towers: ['spark', 'boomcap', 'frost', 'storm', 'owl', 'mold', 'beacon', 'jar'],
  spells: ['starfall', 'frostnova', 'goldrush'],
  intro: { towers: ['jar'], spells: ['goldrush'], features: ['rocks'] },
  hints: [
    { key: 'rocks', trigger: 'start' },
    { key: 'jar', trigger: 'start' },
    { key: 'goldrush', wave: 3 },
  ],
  startGold: 330,
  hpMul: 1.38,
  waveGap: 11,
  waves: generateWaves(L8_SPEC, 808),
};

const L9_SPEC: WaveSpec = {
  count: 22,
  budget: 18,
  growth: 0.16,
  rushEvery: 6,
  roster: [
    { enemy: 'grunt', from: 1, weight: 1.5 },
    { enemy: 'runner', from: 1, weight: 1.2 },
    { enemy: 'swarmling', from: 2, weight: 1.2 },
    { enemy: 'moth', from: 2, weight: 1.4 },
    { enemy: 'splitter', from: 3, weight: 1.4 },
    { enemy: 'healer', from: 4, weight: 1 },
    { enemy: 'tank', from: 2, weight: 2 },
  ],
  extras: { 22: [g('colossus', 1, 8)] },
};

export const LEVEL_9: LevelDef = {
  id: 9,
  biome: 'cliffs',
  seed: 909,
  paths: [{ entrance: 0, points: P(-1, 2, 6, 2, 6, 8, 12, 8, 12, 2, 18, 2, 18, 8) }],
  airSpawns: P(-1, 10),
  tree: { x: 18, y: 8 },
  high: P(8, 5, 9, 5, 10, 5, 3, 5, 15, 5, 16, 5, 9, 0, 15, 10, 4, 9),
  blocked: P(0, 0, 19, 0, 0, 7, 1, 8, 13, 10),
  towers: ['spark', 'boomcap', 'frost', 'storm', 'owl', 'mold', 'beacon', 'jar'],
  spells: ['starfall', 'frostnova', 'goldrush'],
  intro: { enemies: ['colossus'], features: ['high'] },
  hints: [
    { key: 'high', trigger: 'start' },
    { key: 'colossusBoss', trigger: 'bossSpawn' },
  ],
  startGold: 360,
  hpMul: 1.6,
  waveGap: 11,
  waves: generateWaves(L9_SPEC, 909),
};

export const CLIFF_LEVELS: LevelDef[] = [LEVEL_7, LEVEL_8, LEVEL_9];
