import { describe, expect, it } from 'vitest';
import { DEFAULT_BONUSES } from '../src/data/difficulty';
import { computeBonuses } from '../src/data/talents';
import { g } from '../src/data/waveGen';
import { testGame, testLevel, run } from './helpers';

describe('economy', () => {
  it('building and upgrading spend gold, selling refunds 70%', () => {
    const game = testGame(testLevel());
    const s = game.state;
    expect(game.build('spark', 3, 3).ok).toBe(true);
    expect(s.gold).toBe(950);
    const t = s.towers[0];
    expect(game.upgrade(t.id).ok).toBe(true);
    expect(game.upgrade(t.id).ok).toBe(true);
    expect(s.gold).toBe(950 - 40 - 70);
    expect(game.upgrade(t.id)).toEqual({ ok: false, reason: 'branch' });
    expect(game.upgrade(t.id, 1).ok).toBe(true);
    expect(t.level).toBe(3);
    expect(t.branch).toBe(1);
    expect(t.stats.critChance).toBe(0.25);
    expect(game.upgrade(t.id, 0)).toEqual({ ok: false, reason: 'max' });
    const before = s.gold;
    game.sell(t.id);
    expect(s.gold).toBe(before + Math.floor((50 + 40 + 70 + 110) * 0.7));
    expect(game.towerAt(3, 3)).toBeUndefined();
  });

  it('rejects building on the path, occupied cells and without gold', () => {
    const game = testGame(testLevel([], { startGold: 60 }));
    expect(game.build('spark', 4, 5)).toEqual({ ok: false, reason: 'cell' });
    expect(game.build('spark', 4, 4).ok).toBe(true);
    expect(game.build('spark', 4, 4)).toEqual({ ok: false, reason: 'cell' });
    expect(game.build('spark', 6, 4)).toEqual({ ok: false, reason: 'gold' });
  });

  it('slot levels only allow pads', () => {
    const game = testGame(testLevel([], { slots: [{ x: 4, y: 4 }] }));
    expect(game.build('spark', 6, 4).ok).toBe(false);
    expect(game.build('spark', 4, 4).ok).toBe(true);
  });

  it('firefly jars pay at wave start and are limited per level', () => {
    const game = testGame(testLevel([{ groups: [g('grunt', 1)] }, { groups: [g('grunt', 1)] }], { startGold: 1000 }));
    for (let i = 0; i < 5; i++) expect(game.build('jar', i, 2).ok).toBe(true);
    expect(game.build('jar', 6, 2)).toEqual({ ok: false, reason: 'limit' });
    const gold = game.state.gold;
    game.callWave();
    expect(game.state.gold).toBe(gold + 5 * 15);
  });

  it('calling early pays a bonus for the skipped countdown', () => {
    const game = testGame(testLevel([{ groups: [g('grunt', 1)] }, { groups: [g('grunt', 1)] }]));
    game.callWave();
    run(game, 1);
    const bonus = game.earlyBonus();
    expect(bonus).toBeGreaterThan(5);
    const gold = game.state.gold;
    game.callWave();
    expect(game.state.gold).toBe(gold + bonus);
  });

  it('rocks can be cleared for gold to open a cell', () => {
    const game = testGame(testLevel([], { rocks: [{ x: 3, y: 3 }], rockCost: 40 }));
    expect(game.build('spark', 3, 3).ok).toBe(false);
    expect(game.removeRock(3, 3).ok).toBe(true);
    expect(game.state.gold).toBe(960);
    expect(game.build('spark', 3, 3).ok).toBe(true);
  });

  it('talent bonuses combine as deltas', () => {
    const b = computeBonuses(['richSoil', 'sharpLight', 'salvage', 'builder']);
    expect(b.startGold).toBe(40);
    expect(b.damageMul).toBeCloseTo(1.05);
    expect(b.sellRatio).toBeCloseTo(0.8);
    expect(b.buildCostMul).toBeCloseTo(0.94);
    const game = testGame(testLevel([], { startGold: 100 }), { bonuses: b });
    expect(game.state.gold).toBe(140);
    expect(game.buildCost('spark')).toBe(47);
    expect(DEFAULT_BONUSES.sellRatio).toBe(0.7);
  });

  it('spells respect cooldowns and gold rush boosts rewards', () => {
    const game = testGame(testLevel([{ groups: [g('grunt', 1)] }]));
    expect(game.castSpell('goldrush').ok).toBe(true);
    expect(game.castSpell('goldrush')).toEqual({ ok: false, reason: 'cooldown' });
    expect(game.state.goldRushTime).toBe(15);
  });
});
