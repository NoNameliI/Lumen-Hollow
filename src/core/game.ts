import type {
  CommandResult,
  EnemyState,
  GameState,
  RunConfig,
  SimEvent,
  SpellId,
  TargetMode,
  TowerId,
  TowerState,
  WaveDef,
} from '../types';
import { TOWERS } from '../data/towers';
import { STEP } from './constants';
import { createState, emit } from './state';
import { cellAt, cellIndex, isBuildable } from './grid';
import { compactEnemies, updateEnemies } from './enemies';
import { computeStats, createTower, recalcTowers, updateTowers } from './towers';
import { updateProjectiles } from './projectiles';
import { callWave, canCallWave, earlyBonus, nextWaveDef, updateWaves } from './waves';
import { castSpell, updateSpellsAndZones } from './spells';

const DEFAULT_ROCK_COST = 40;

export class Game {
  readonly state: GameState;
  private byId = new Map<number, EnemyState>();

  constructor(config: RunConfig) {
    this.state = createState(config);
  }

  // ---------- queries ----------

  buildCost(type: TowerId): number {
    return Math.round(TOWERS[type].costs[0] * this.state.config.bonuses.buildCostMul);
  }

  /** Cost of the next upgrade, or null at max level. */
  upgradeCost(t: TowerState): number | null {
    if (t.level >= 3) return null;
    return Math.round(t.def.costs[t.level + 1] * this.state.config.bonuses.upgradeCostMul);
  }

  sellValue(t: TowerState): number {
    return Math.floor(t.spent * this.state.config.bonuses.sellRatio);
  }

  rockCost(): number {
    return this.state.level.rockCost ?? DEFAULT_ROCK_COST;
  }

  towerAt(cx: number, cy: number): TowerState | undefined {
    if (cellAt(this.state.grid, cx, cy) === null) return undefined;
    const id = this.state.grid.occupied[cellIndex(this.state.grid, cx, cy)];
    return id ? this.state.towers.find((t) => t.id === id) : undefined;
  }

  towerById(id: number): TowerState | undefined {
    return this.state.towers.find((t) => t.id === id);
  }

  countOf(type: TowerId): number {
    return this.state.towers.filter((t) => t.type === type).length;
  }

  /** Why a tower can't be built here, or null if it can. */
  buildBlocker(type: TowerId, cx: number, cy: number): CommandResult | null {
    const s = this.state;
    if (s.status !== 'playing') return { ok: false, reason: 'over' };
    if (!s.level.towers.includes(type)) return { ok: false, reason: 'locked' };
    if (!isBuildable(s.grid, cx, cy)) return { ok: false, reason: 'cell' };
    const max = TOWERS[type].maxPerLevel;
    if (max !== undefined && this.countOf(type) >= max) return { ok: false, reason: 'limit' };
    if (s.gold < this.buildCost(type)) return { ok: false, reason: 'gold' };
    return null;
  }

  /** Effective range a tower of `type` would have on this cell. */
  previewRange(type: TowerId, cx: number, cy: number): number {
    return computeStats(this.state, TOWERS[type], 0, -1, cx, cy).stats.range;
  }

  nextWave(): WaveDef | null {
    return nextWaveDef(this.state);
  }

  canCallWave(): boolean {
    return canCallWave(this.state);
  }

  earlyBonus(): number {
    return earlyBonus(this.state);
  }

  // ---------- commands ----------

  build(type: TowerId, cx: number, cy: number): CommandResult {
    const blocker = this.buildBlocker(type, cx, cy);
    if (blocker) return blocker;
    const s = this.state;
    const cost = this.buildCost(type);
    const t = createTower(s, TOWERS[type], cx, cy, cost);
    s.gold -= cost;
    s.stats.goldSpent += cost;
    s.stats.towersBuilt++;
    s.towers.push(t);
    s.grid.occupied[cellIndex(s.grid, cx, cy)] = t.id;
    recalcTowers(s);
    emit(s, { t: 'build', tower: type, x: t.x, y: t.y });
    return { ok: true };
  }

  upgrade(id: number, branch?: 0 | 1): CommandResult {
    const s = this.state;
    const t = this.towerById(id);
    if (!t || s.status !== 'playing') return { ok: false, reason: 'over' };
    const cost = this.upgradeCost(t);
    if (cost === null) return { ok: false, reason: 'max' };
    if (t.level === 2 && branch === undefined) return { ok: false, reason: 'branch' };
    if (s.gold < cost) return { ok: false, reason: 'gold' };
    s.gold -= cost;
    s.stats.goldSpent += cost;
    t.spent += cost;
    t.level = (t.level + 1) as TowerState['level'];
    if (t.level === 3) t.branch = branch ?? 0;
    recalcTowers(s);
    emit(s, { t: 'upgrade', tower: t.type, x: t.x, y: t.y, level: t.level });
    return { ok: true };
  }

  sell(id: number): CommandResult {
    const s = this.state;
    const t = this.towerById(id);
    if (!t || s.status !== 'playing') return { ok: false, reason: 'over' };
    const refund = this.sellValue(t);
    s.gold += refund;
    s.towers = s.towers.filter((o) => o !== t);
    s.grid.occupied[cellIndex(s.grid, t.cx, t.cy)] = 0;
    recalcTowers(s);
    emit(s, { t: 'sell', tower: t.type, x: t.x, y: t.y, refund });
    return { ok: true };
  }

  setTargetMode(id: number, mode: TargetMode): void {
    const t = this.towerById(id);
    if (t) t.targetMode = mode;
  }

  removeRock(cx: number, cy: number): CommandResult {
    const s = this.state;
    if (s.status !== 'playing') return { ok: false, reason: 'over' };
    if (cellAt(s.grid, cx, cy) !== 'rock') return { ok: false, reason: 'cell' };
    const cost = this.rockCost();
    if (s.gold < cost) return { ok: false, reason: 'gold' };
    s.gold -= cost;
    s.stats.goldSpent += cost;
    s.grid.cells[cellIndex(s.grid, cx, cy)] = 'grass';
    emit(s, { t: 'rock', x: cx + 0.5, y: cy + 0.5 });
    return { ok: true };
  }

  callWave(): CommandResult {
    return callWave(this.state) ? { ok: true } : { ok: false, reason: 'wave' };
  }

  castSpell(id: SpellId, x?: number, y?: number): CommandResult {
    return castSpell(this.state, id, x, y);
  }

  // ---------- simulation ----------

  step(dt = STEP): void {
    const s = this.state;
    if (s.status !== 'playing') return;
    s.time += dt;
    s.tick++;
    updateWaves(s, dt);
    updateEnemies(s, dt);
    this.byId.clear();
    for (const e of s.enemies) if (e.alive) this.byId.set(e.id, e);
    updateTowers(s, dt);
    updateProjectiles(s, dt, this.byId);
    updateSpellsAndZones(s, dt);
    compactEnemies(s);
    this.checkEnd();
  }

  private checkEnd(): void {
    const s = this.state;
    if (s.lives <= 0) {
      s.status = 'lost';
      emit(s, { t: 'lost' });
      return;
    }
    const w = s.wave;
    if (!s.config.endless && w.index >= s.totalWaves && !w.spawning && s.enemies.length === 0) {
      s.status = 'won';
      emit(s, { t: 'won' });
    }
  }

  drainEvents(): SimEvent[] {
    const ev = this.state.events;
    this.state.events = [];
    return ev;
  }
}
