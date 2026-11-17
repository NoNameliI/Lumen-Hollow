import type { TowerStats } from '../types';
import { t } from '../i18n';

const pct = (v: number): number => Math.round(v * 100);
const num = (v: number): string => String(Math.round(v * 10) / 10);

/** Short human-readable lines for the special effects of a stat block. */
export function specialLines(s: TowerStats): string[] {
  const out: string[] = [];
  if (s.splash) out.push(t('stat.splash', { n: num(s.splash) }));
  if (s.cluster) out.push(t('stat.cluster', { n: s.cluster }));
  if (s.stunTime) out.push(t('stat.stun', { n: num(s.stunTime) }));
  if (s.slow) out.push(t('stat.slow', { n: pct(s.slow) }));
  if (s.freezeChance) out.push(t('stat.freeze', { n: pct(s.freezeChance), s: num(s.freezeTime ?? 1) }));
  if (s.pulseDamage) out.push(t('stat.pulse', { n: Math.round(s.pulseDamage) }));
  if (s.chains) out.push(t('stat.chains', { n: s.chains }));
  if (s.markTime) out.push(t('stat.mark'));
  if (s.critChance) out.push(t('stat.crit', { n: pct(s.critChance), m: num(s.critMul ?? 2) }));
  if (s.armorPen) out.push(t('stat.armorPen', { n: pct(s.armorPen) }));
  if (s.airMul && s.airMul !== 1) out.push(t('stat.air', { m: num(s.airMul) }));
  if (s.bossMul && s.bossMul !== 1) out.push(t('stat.boss', { m: num(s.bossMul) }));
  if (s.poisonDps) out.push(t(s.poisonSpread ? 'stat.poisonSpread' : 'stat.poison', { n: num(s.poisonDps) }));
  if (s.acid) out.push(t('stat.acid', { n: num(s.acid) }));
  if (s.auraRadius) {
    const parts: string[] = [];
    if (s.auraDamage) parts.push(t('stat.auraDamage', { n: pct(s.auraDamage) }));
    if (s.auraRange) parts.push(t('stat.auraRange', { n: pct(s.auraRange) }));
    if (s.auraRate) parts.push(t('stat.auraRate', { n: pct(s.auraRate) }));
    if (parts.length) out.push(parts.join(', '));
  }
  if (s.warding) out.push(t('stat.warding'));
  if (s.revealRadius) out.push(t('stat.reveal'));
  if (s.income) out.push(t('stat.income', { n: s.income }));
  if (s.bountyGold) out.push(t('stat.bounty', { n: s.bountyGold }));
  return out;
}
