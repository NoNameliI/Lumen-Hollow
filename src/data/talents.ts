import type { Bonuses, TalentDef } from '../types';
import { DEFAULT_BONUSES } from './difficulty';

/** The Grove: 12 nodes, 4 rows x 3 columns. Bonuses are deltas added to DEFAULT_BONUSES. */
export const TALENTS: TalentDef[] = [
  { id: 'richSoil', cost: 1, row: 0, col: 0, bonus: { startGold: 40 } },
  { id: 'deepRoots', cost: 1, row: 0, col: 1, bonus: { extraLives: 3 } },
  { id: 'salvage', cost: 1, row: 0, col: 2, bonus: { sellRatio: 0.1 } },
  { id: 'sharpLight', cost: 2, row: 1, col: 0, requires: 'richSoil', bonus: { damageMul: 0.05 } },
  { id: 'starLore', cost: 2, row: 1, col: 1, requires: 'deepRoots', bonus: { spellCdMul: -0.15 } },
  { id: 'thrifty', cost: 2, row: 1, col: 2, requires: 'salvage', bonus: { upgradeCostMul: -0.08 } },
  { id: 'keenEyes', cost: 2, row: 2, col: 0, requires: 'sharpLight', bonus: { rangeMul: 0.05 } },
  { id: 'coldSnap', cost: 2, row: 2, col: 1, requires: 'starLore', bonus: { slowTimeMul: 0.15 } },
  { id: 'earlyBird', cost: 1, row: 2, col: 2, requires: 'thrifty', bonus: { earlyBonusMul: 0.5 } },
  { id: 'brightCore', cost: 3, row: 3, col: 0, requires: 'keenEyes', bonus: { damageMul: 0.05 } },
  { id: 'bounty', cost: 3, row: 3, col: 1, requires: 'coldSnap', bonus: { killGoldMul: 0.08, incomeMul: 0.1 } },
  { id: 'builder', cost: 3, row: 3, col: 2, requires: 'earlyBird', bonus: { buildCostMul: -0.06 } },
];

export function talentById(id: string): TalentDef | undefined {
  return TALENTS.find((t) => t.id === id);
}

export function computeBonuses(owned: string[]): Bonuses {
  const b: Bonuses = { ...DEFAULT_BONUSES };
  for (const id of owned) {
    const t = talentById(id);
    if (!t) continue;
    for (const [k, v] of Object.entries(t.bonus) as [keyof Bonuses, number][]) b[k] += v;
  }
  return b;
}

export function canUnlockTalent(owned: string[], id: string, starsAvailable: number): boolean {
  const t = talentById(id);
  if (!t || owned.includes(id)) return false;
  if (t.requires && !owned.includes(t.requires)) return false;
  return starsAvailable >= t.cost;
}

export function talentsSpent(owned: string[]): number {
  return owned.reduce((s, id) => s + (talentById(id)?.cost ?? 0), 0);
}
