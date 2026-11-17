// Simulation state, events emitted by the simulation and command results.
import type { Vec2, DamageType, TowerId, EnemyId, BossId, SpellId, TargetMode, AttackKind, TowerStats, TowerDef, EnemyDef, LevelDef, RunConfig } from './data';

// ---------- Simulation state ----------

export type CellKind = 'grass' | 'path' | 'swamp' | 'rock' | 'high' | 'slot' | 'blocked' | 'tree';

export interface Grid {
  cols: number;
  rows: number;
  cells: CellKind[]; // row-major
  occupied: number[]; // tower id per cell, 0 = free
  slotsOnly: boolean; // towers only on 'slot' cells
}

export interface PathRuntime {
  entrance: number;
  points: Vec2[];
  segLen: number[];
  cum: number[]; // cumulative length at each point
  length: number;
  flying: boolean;
}

export interface PoisonStack {
  dps: number;
  time: number;
  spread: boolean;
  towerId: number;
}

export interface EnemyState {
  id: number;
  type: EnemyId;
  def: EnemyDef;
  alive: boolean;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  shieldDelay: number;
  armor: number;
  speed: number; // base speed after modifiers like boss phases
  path: PathRuntime;
  dist: number;
  x: number;
  y: number;
  dirX: number;
  dirY: number;
  remaining: number; // distance left to the tree
  slow: number;
  slowTime: number;
  freezeTime: number;
  stunTime: number;
  poison: PoisonStack[];
  markTime: number;
  acid: number;
  acidTime: number;
  hasteTime: number;
  revealed: boolean;
  age: number;
  hitFlash: number;
  boss?: BossState;
  wave: number;
}

export interface BossState {
  phase: number;
  timer: number;
  timer2: number;
  thresholds: number; // count of thresholds already triggered
}

export interface TowerState {
  id: number;
  type: TowerId;
  def: TowerDef;
  cx: number;
  cy: number;
  x: number;
  y: number;
  level: 0 | 1 | 2 | 3;
  branch: -1 | 0 | 1;
  stats: TowerStats; // effective stats incl. auras, terrain, fog, bonuses
  cooldown: number;
  pulseTimer: number;
  targetMode: TargetMode;
  targetId: number;
  angle: number;
  lastShot: number; // sim time of the last attack
  disabledTime: number;
  spent: number;
  kills: number;
  damage: number;
  high: boolean;
  inAura: boolean;
  warded: boolean;
}

export interface Projectile {
  id: number;
  kind: AttackKind;
  towerId: number;
  targetId: number;
  x: number;
  y: number;
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  t: number; // elapsed seconds
  dur: number; // lobbed flight time, 0 for homing
  speed: number;
  damage: number;
  crit: boolean;
  stats: TowerStats;
  dtype: DamageType;
  alive: boolean;
}

export type ZoneKind = 'puddle' | 'starfall';

export interface Zone {
  id: number;
  kind: ZoneKind;
  x: number;
  y: number;
  r: number;
  time: number; // remaining seconds
  delay: number; // seconds before it takes effect
  damage: number;
}

export interface WaveRuntime {
  index: number; // 1-based wave number currently spawning or last spawned, 0 = not started
  spawns: { at: number; enemy: EnemyId; entrance: number }[];
  clock: number;
  nextIn: number; // seconds until the next wave auto-starts; Infinity = waits for the player
  spawning: boolean;
}

export interface RunStats {
  kills: number;
  leaked: number;
  goldEarned: number;
  goldSpent: number;
  towersBuilt: number;
  spellsCast: number;
  earlyCalls: number;
  damageByType: Partial<Record<TowerId, number>>;
  bossKills: number;
}

export interface SpellRuntime {
  cooldown: number;
}

export type GameStatus = 'playing' | 'won' | 'lost';

/** Multipliers derived once from difficulty and challenges. */
export interface RunMods {
  hpMul: number;
  goldMul: number;
  speedMul: number;
  armorAdd: number;
  countMul: number;
  noSpells: boolean;
}

export interface GameState {
  config: RunConfig;
  level: LevelDef;
  mods: RunMods;
  grid: Grid;
  paths: PathRuntime[];
  airPaths: PathRuntime[];
  time: number;
  tick: number;
  gold: number;
  lives: number;
  maxLives: number;
  wave: WaveRuntime;
  totalWaves: number; // Infinity in endless
  enemies: EnemyState[];
  towers: TowerState[];
  projectiles: Projectile[];
  zones: Zone[];
  spells: Record<SpellId, SpellRuntime>;
  goldRushTime: number;
  darknessAt: Vec2 | null;
  darknessTime: number;
  status: GameStatus;
  stats: RunStats;
  events: SimEvent[];
  rngState: number;
  nextId: number;
}

// ---------- Events (simulation -> render/audio/UI) ----------

export type SimEvent =
  | { t: 'shot'; tower: TowerId; towerId: number; x: number; y: number; tx: number; ty: number }
  | { t: 'hit'; x: number; y: number; amount: number; crit: boolean; magic: boolean }
  | { t: 'chain'; points: Vec2[] }
  | { t: 'beam'; x: number; y: number; tx: number; ty: number }
  | { t: 'explode'; x: number; y: number; r: number; kind: 'boom' | 'spore' | 'frost' | 'star' }
  | { t: 'pulse'; x: number; y: number; r: number }
  | { t: 'freeze'; x: number; y: number }
  | { t: 'death'; enemy: EnemyId; x: number; y: number; boss: boolean }
  | { t: 'gold'; x: number; y: number; amount: number }
  | { t: 'leak'; enemy: EnemyId; lives: number }
  | { t: 'spawn'; enemy: EnemyId; x: number; y: number; boss: boolean }
  | { t: 'heal'; x: number; y: number }
  | { t: 'shieldBreak'; x: number; y: number }
  | { t: 'build'; tower: TowerId; x: number; y: number }
  | { t: 'upgrade'; tower: TowerId; x: number; y: number; level: number }
  | { t: 'sell'; tower: TowerId; x: number; y: number; refund: number }
  | { t: 'rock'; x: number; y: number }
  | { t: 'waveStart'; wave: number; boss: boolean }
  | { t: 'income'; amount: number }
  | { t: 'spell'; spell: SpellId; x: number; y: number }
  | { t: 'bossPhase'; boss: BossId; phase: number; x: number; y: number }
  | { t: 'darkness'; x: number; y: number; r: number }
  | { t: 'won' }
  | { t: 'lost' };

// ---------- Commands ----------

export type CommandResult =
  | { ok: true }
  | { ok: false; reason: 'gold' | 'cell' | 'limit' | 'locked' | 'max' | 'branch' | 'cooldown' | 'wave' | 'over' };
