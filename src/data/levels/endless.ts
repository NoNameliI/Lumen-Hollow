import type { LevelDef } from '../../types';
import { TOWER_ORDER } from '../towers';
import { SPELL_ORDER } from '../spells';

/** Endless Night arena: two entrances that merge, open air approach. Waves come from waveGen. */
export const ENDLESS_LEVEL: LevelDef = {
  id: 0,
  biome: 'dusk',
  seed: 777,
  paths: [
    {
      entrance: 0,
      points: [
        { x: -1, y: 2 },
        { x: 6, y: 2 },
        { x: 6, y: 5 },
        { x: 12, y: 5 },
        { x: 12, y: 8 },
        { x: 17, y: 8 },
        { x: 17, y: 5 },
      ],
    },
    {
      entrance: 1,
      points: [
        { x: -1, y: 9 },
        { x: 3, y: 9 },
        { x: 3, y: 7 },
        { x: 9, y: 7 },
        { x: 9, y: 5 },
        { x: 12, y: 5 },
        { x: 12, y: 8 },
        { x: 17, y: 8 },
        { x: 17, y: 5 },
      ],
    },
  ],
  airSpawns: [{ x: 9, y: -1 }],
  tree: { x: 17, y: 5 },
  high: [
    { x: 8, y: 3 },
    { x: 14, y: 6 },
  ],
  towers: [...TOWER_ORDER],
  spells: [...SPELL_ORDER],
  intro: {},
  startGold: 400,
  hpMul: 1,
  waveGap: 10,
  waves: [],
};
