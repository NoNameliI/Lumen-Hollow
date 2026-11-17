import type { Difficulty, TowerId } from '../types';
import { LEVELS } from '../data/levels';
import { ENDLESS_LEVEL } from '../data/levels/endless';
import { DIFFICULTY_ORDER } from '../data/difficulty';
import { TOWER_ORDER } from '../data/towers';
import { greedyBot, idleBot } from './bots';
import { runLevel, type RunResult } from './runner';

const args = process.argv.slice(2);
const opt = (name: string, def: string): string => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};
const seeds = Number(opt('seeds', '6'));
const onlyLevel = Number(opt('level', '0'));
const diffs = opt('diff', 'all') === 'all' ? DIFFICULTY_ORDER : (opt('diff', 'normal').split(',') as Difficulty[]);
const skill = Number(opt('skill', '0.6'));
const only = opt('only', '') as TowerId | '';

const pad = (v: string | number, n: number) => String(v).padStart(n);
const pct = (n: number) => `${Math.round(n * 100)}%`;
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

const damageTotals: Partial<Record<TowerId, number>> = {};
const header = ['lvl', 'diff', 'idle', 'idleWave', 'win', 'lives', 'minL', 'min', 'gold', 'towers', 'boss', 'lossW'];
console.log(header.map((h, i) => pad(h, i < 2 ? 6 : 8)).join(''));

const levels = LEVELS.filter((l) => !onlyLevel || l.id === onlyLevel);
const issues: string[] = [];
for (const level of levels) {
  for (const diff of diffs) {
    const idle = runLevel(level, diff, idleBot(), 1);
    const results: RunResult[] = [];
    for (let k = 0; k < seeds; k++) results.push(runLevel(level, diff, greedyBot(1000 + k * 17, skill, only || undefined), 7 + k));
    const wins = results.filter((r) => r.won);
    for (const r of results) {
      for (const [t, d] of Object.entries(r.damage) as [TowerId, number][]) damageTotals[t] = (damageTotals[t] ?? 0) + d;
    }
    const winRate = wins.length / results.length;
    const lives = avg(wins.map((r) => r.lives));
    const minL = wins.length ? Math.min(...wins.map((r) => r.lives)) : 0;
    const minutes = avg(results.map((r) => r.seconds)) / 60;
    console.log(
      [
        pad(level.id, 6),
        pad(diff, 6),
        pad(idle.won ? 'WIN' : 'lose', 8),
        pad(`${idle.wave}/${idle.totalWaves}`, 8),
        pad(pct(winRate), 8),
        pad(lives.toFixed(1), 8),
        pad(minL, 8),
        pad(minutes.toFixed(1), 8),
        pad(Math.round(avg(results.map((r) => r.goldEarned))), 8),
        pad(avg(results.map((r) => r.towers)).toFixed(1), 8),
        pad(pct(avg(results.map((r) => (r.bossKilled ? 1 : 0)))), 8),
        pad(results.filter((r) => !r.won).map((r) => r.wave).join(',') || '-', 12),
      ].join(''),
    );
    if (idle.won) issues.push(`L${level.id} ${diff}: idle bot won`);
    if (diff === 'normal' && winRate < 0.8) issues.push(`L${level.id} normal: greedy win rate ${pct(winRate)}`);
    if (diff === 'normal' && wins.length && lives >= 19.5) issues.push(`L${level.id} normal: no lives lost`);
    if (diff === 'hard' && winRate === 1 && lives > 17) issues.push(`L${level.id} hard: too easy`);
  }
}

const total = Object.values(damageTotals).reduce((a, b) => a + (b ?? 0), 0) || 1;
console.log('\nDamage share by tower:');
for (const t of TOWER_ORDER) {
  const d = damageTotals[t] ?? 0;
  if (d > 0) console.log(`  ${t.padEnd(8)} ${pct(d / total).padStart(5)}`);
}
console.log(issues.length ? `\nIssues:\n  ${issues.join('\n  ')}` : '\nNo balance issues flagged.');

if (!onlyLevel || onlyLevel === 99) {
  const waves: number[] = [];
  for (let k = 0; k < Math.min(seeds, 4); k++) {
    waves.push(runLevel(ENDLESS_LEVEL, 'normal', greedyBot(500 + k, skill), 3 + k, true).wave);
  }
  console.log(`
Endless Night (normal): greedy bot reached waves ${waves.join(', ')}`);
}
