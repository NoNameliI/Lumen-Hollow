import type { Bonuses, ChallengeDef, ChallengeId, Difficulty, RunMods } from '../types';

export const DIFFICULTY: Record<Difficulty, { hpMul: number; goldMul: number }> = {
  calm: { hpMul: 0.75, goldMul: 1.1 },
  normal: { hpMul: 1.0, goldMul: 1.0 },
  hard: { hpMul: 1.3, goldMul: 0.95 },
};

export const DIFFICULTY_ORDER: Difficulty[] = ['calm', 'normal', 'hard'];

export const CHALLENGES: Record<ChallengeId, ChallengeDef> = {
  swift: { id: 'swift', scoreMul: 1.25 },
  armored: { id: 'armored', scoreMul: 1.25 },
  poor: { id: 'poor', scoreMul: 1.3 },
  fragile: { id: 'fragile', scoreMul: 1.4 },
  nospells: { id: 'nospells', scoreMul: 1.15 },
  horde: { id: 'horde', scoreMul: 1.35 },
};

export const CHALLENGE_ORDER: ChallengeId[] = ['swift', 'armored', 'poor', 'fragile', 'nospells', 'horde'];

export const FRAGILE_LIVES = 5;

export function makeMods(difficulty: Difficulty, challenges: ChallengeId[]): RunMods {
  const d = DIFFICULTY[difficulty];
  const has = (c: ChallengeId) => challenges.includes(c);
  return {
    hpMul: d.hpMul,
    goldMul: d.goldMul * (has('poor') ? 0.7 : 1),
    speedMul: has('swift') ? 1.25 : 1,
    armorAdd: has('armored') ? 3 : 0,
    countMul: has('horde') ? 1.4 : 1,
    noSpells: has('nospells'),
  };
}

export const DEFAULT_BONUSES: Bonuses = {
  startGold: 0,
  extraLives: 0,
  damageMul: 1,
  rangeMul: 1,
  buildCostMul: 1,
  upgradeCostMul: 1,
  spellCdMul: 1,
  killGoldMul: 1,
  sellRatio: 0.7,
  earlyBonusMul: 1,
  slowTimeMul: 1,
  incomeMul: 1,
};

/** Gold per second of skipped countdown when calling a wave early. */
export const EARLY_GOLD_PER_SEC = 1;
