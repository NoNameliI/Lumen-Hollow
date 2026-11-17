import type { LevelDef } from '../../types';
import { MEADOW_LEVELS } from './meadow';

export const LEVELS: LevelDef[] = [...MEADOW_LEVELS];

export function levelById(id: number): LevelDef | undefined {
  return LEVELS.find((l) => l.id === id);
}
