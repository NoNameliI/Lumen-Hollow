import type { SpellDef, SpellId } from '../types';

export const SPELLS: Record<SpellId, SpellDef> = {
  starfall: { id: 'starfall', cooldown: 35, targeted: true, radius: 1.6, damage: 160, delay: 0.6 },
  frostnova: { id: 'frostnova', cooldown: 55, targeted: false, duration: 2 },
  goldrush: { id: 'goldrush', cooldown: 60, targeted: false, duration: 15, power: 0.5 },
};

export const SPELL_ORDER: SpellId[] = ['starfall', 'frostnova', 'goldrush'];
