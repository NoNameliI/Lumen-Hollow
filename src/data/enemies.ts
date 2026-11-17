import type { EnemyDef, EnemyId } from '../types';

export const ENEMIES: Record<EnemyId, EnemyDef> = {
  grunt: { id: 'grunt', hp: 40, speed: 1.0, reward: 5, lives: 1, radius: 0.28, scaleHp: true, threat: 1, spacing: 0.9 },
  runner: { id: 'runner', hp: 25, speed: 1.8, reward: 4, lives: 1, radius: 0.24, scaleHp: true, threat: 0.9, spacing: 0.7 },
  swarmling: { id: 'swarmling', hp: 12, speed: 1.3, reward: 2, lives: 1, radius: 0.16, scaleHp: true, threat: 0.5, spacing: 0.28 },
  tank: { id: 'tank', hp: 220, speed: 0.6, reward: 18, lives: 2, armor: 4, radius: 0.42, scaleHp: true, threat: 5, spacing: 2.2 },
  moth: { id: 'moth', hp: 35, speed: 1.4, reward: 8, lives: 1, flying: true, radius: 0.26, scaleHp: true, threat: 1.8, spacing: 1.0 },
  healer: { id: 'healer', hp: 70, speed: 0.9, reward: 14, lives: 1, healRadius: 1.5, healRate: 5, radius: 0.3, scaleHp: true, threat: 3.5, spacing: 1.6 },
  splitter: { id: 'splitter', hp: 90, speed: 0.9, reward: 10, lives: 1, splitInto: { id: 'swarmling', count: 3 }, radius: 0.36, scaleHp: true, threat: 2.6, spacing: 1.6 },
  shieldbearer: { id: 'shieldbearer', hp: 80, speed: 0.85, reward: 15, lives: 1, shield: 60, shieldRegenDelay: 4, radius: 0.34, scaleHp: true, threat: 3, spacing: 1.5 },
  phantom: { id: 'phantom', hp: 50, speed: 1.2, reward: 12, lives: 1, invisible: true, radius: 0.28, scaleHp: true, threat: 3, spacing: 1.2 },
  slime: { id: 'slime', hp: 20, speed: 1.1, reward: 1, lives: 1, radius: 0.16, scaleHp: true, threat: 0.3, spacing: 0.4 },
  grub: { id: 'grub', hp: 800, speed: 0.45, reward: 80, lives: 5, boss: 'grub', ccResist: 0.5, radius: 0.6, scaleHp: false, threat: 40, spacing: 1 },
  mire: { id: 'mire', hp: 2500, speed: 0.42, reward: 150, lives: 8, boss: 'mire', ccResist: 0.6, radius: 0.7, scaleHp: false, threat: 90, spacing: 1 },
  colossus: { id: 'colossus', hp: 5000, speed: 0.38, reward: 250, lives: 10, armor: 10, boss: 'colossus', ccResist: 0.7, radius: 0.75, scaleHp: false, threat: 160, spacing: 1 },
  king: { id: 'king', hp: 9000, speed: 0.4, reward: 400, lives: 20, shield: 1500, shieldRegenDelay: 4, boss: 'king', ccResist: 0.7, radius: 0.8, scaleHp: false, threat: 280, spacing: 1 },
};

export const BOSS_IDS: EnemyId[] = ['grub', 'mire', 'colossus', 'king'];

/** Per-wave HP curve: base * (1 + 0.09w + 0.004w^2). */
export function hpCurve(wave: number): number {
  return 1 + 0.09 * wave + 0.004 * wave * wave;
}

/** Tunables for boss behaviour. */
export const BOSS_TUNING = {
  grubSpawn: 4,
  mireInterval: 5,
  mireSpawn: 3,
  puddleRadius: 1.2,
  puddleTime: 20,
  puddleHaste: 1.3,
  colossusArmorDrop: 5,
  colossusSpeedUp: 1.35,
  kingPhantomInterval: 6,
  kingPhantomCount: 2,
  kingDarknessInterval: 15,
  kingDarknessRadius: 2,
  kingDarknessTime: 3,
  bossHealFactor: 0.5,
};

export const SWAMP_SLOW = 0.6;
export const HEAL_INTERVAL = 0.5;
