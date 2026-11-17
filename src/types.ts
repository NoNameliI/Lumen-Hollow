// Shared contracts between simulation, data, rendering, UI, audio and saves.
// Simulation units: cells (1 cell = 64 px), seconds. Cell (cx, cy) has its centre at (cx + 0.5, cy + 0.5).

export interface Vec2 {
  x: number;
  y: number;
}

export type DamageType = 'physical' | 'magic';
export type TowerId = 'spark' | 'boomcap' | 'frost' | 'storm' | 'owl' | 'mold' | 'beacon' | 'jar';
export type EnemyId =
  | 'grunt'
  | 'runner'
  | 'swarmling'
  | 'tank'
  | 'moth'
  | 'healer'
  | 'splitter'
  | 'shieldbearer'
  | 'phantom'
  | 'slime'
  | 'grub'
  | 'mire'
  | 'colossus'
  | 'king';
export type BossId = 'grub' | 'mire' | 'colossus' | 'king';
export type SpellId = 'starfall' | 'frostnova' | 'goldrush';
export type Difficulty = 'calm' | 'normal' | 'hard';
export type TargetMode = 'first' | 'last' | 'strong' | 'close';
export type BiomeId = 'meadow' | 'marsh' | 'cliffs' | 'dusk';
export type AttackKind = 'bolt' | 'mortar' | 'frost' | 'chain' | 'snipe' | 'spore' | 'aura' | 'income';
export type LangId = 'en' | 'ru';
export type ChallengeId = 'swift' | 'armored' | 'poor' | 'fragile' | 'nospells' | 'horde';

// ---------- Static data ----------

/** Full stat block of one tower tier (not deltas). Optional fields default to "off". */
export interface TowerStats {
  damage: number;
  rate: number; // attacks per second (0 = never attacks)
  range: number; // cells
  splash?: number; // radius in cells
  slow?: number; // 0..1 speed reduction
  slowTime?: number;
  freezeChance?: number;
  freezeTime?: number;
  stunTime?: number;
  chains?: number; // extra jumps after the first target
  chainRange?: number;
  critChance?: number;
  critMul?: number;
  armorPen?: number; // 0..1 share of armour ignored
  airMul?: number; // damage multiplier vs flying
  bossMul?: number; // damage multiplier vs bosses
  poisonDps?: number;
  poisonTime?: number;
  poisonSpread?: boolean; // poison jumps to neighbours on death
  acid?: number; // flat armour reduction applied on hit
  acidTime?: number;
  cluster?: number; // number of mini-explosions around the impact
  pulseDamage?: number; // periodic AoE around the tower
  pulseInterval?: number;
  pulseRadius?: number;
  markTime?: number; // static mark: +20% damage taken, blocks shield regen
  auraRadius?: number;
  auraDamage?: number; // +fraction damage to towers in aura
  auraRange?: number; // +fraction range
  auraRate?: number; // +fraction attack speed
  warding?: boolean; // aura protects from darkness
  revealRadius?: number;
  income?: number; // gold at the start of every wave
  bountyRadius?: number;
  bountyGold?: number;
}

export interface TowerBranchDef {
  key: string; // i18n key suffix: tower.<id>.branch.<key>
  stats: TowerStats;
}

export interface TowerDef {
  id: TowerId;
  kind: AttackKind;
  damageType: DamageType;
  hitsGround: boolean;
  hitsAir: boolean;
  /** Build cost, then the two plain upgrades, then the branch upgrade. */
  costs: [number, number, number, number];
  /** Tier 0 = built, 1 and 2 = upgrades. Tier 3 is the chosen branch. */
  tiers: [TowerStats, TowerStats, TowerStats];
  branches: [TowerBranchDef, TowerBranchDef];
  projectileSpeed?: number; // cells/s, for homing bolts
  flightTime?: number; // seconds, for lobbed shells
  maxPerLevel?: number;
  hotkey: number;
}

export interface EnemyDef {
  id: EnemyId;
  hp: number;
  speed: number; // cells/s
  reward: number;
  lives: number; // lives lost when it reaches the tree
  armor?: number;
  shield?: number;
  shieldRegenDelay?: number;
  flying?: boolean;
  healRadius?: number;
  healRate?: number; // hp/s to each neighbour
  splitInto?: { id: EnemyId; count: number };
  invisible?: boolean;
  boss?: BossId;
  ccResist?: number; // 0..1, reduces slow strength and freeze/stun durations
  radius: number; // cells, for hit tests and rendering
  scaleHp: boolean; // apply the per-wave HP curve
  threat: number; // wave budget cost
  spacing: number; // default seconds between spawns in a group
}

export interface SpawnGroup {
  enemy: EnemyId;
  count: number;
  interval: number; // seconds between spawns
  delay: number; // seconds from wave start to the first spawn
  entrance?: number; // undefined = alternate between entrances
}

export interface WaveDef {
  groups: SpawnGroup[];
}

export interface PathDef {
  entrance: number;
  /** Cell-centre coordinates. The first point may be just outside the grid. Axis-aligned segments. */
  points: Vec2[];
}

export interface HintDef {
  key: string; // i18n key: hint.<key>
  wave?: number; // show when this wave starts (1-based); 0 = on level start
  trigger?: 'start' | 'firstBuild' | 'firstUpgrade' | 'bossSpawn' | 'firstAir' | 'firstLeak';
}

export interface LevelDef {
  id: number; // 1..12, 0 = endless
  biome: BiomeId;
  paths: PathDef[];
  airSpawns?: Vec2[]; // flyers fly straight from these to the tree
  tree: Vec2; // cell coordinates of the tree centre
  slots?: Vec2[]; // if set, towers can only be built on these cells
  rocks?: Vec2[];
  high?: Vec2[];
  swamp?: Vec2[]; // path cells that slow walkers
  blocked?: Vec2[]; // decorative, unbuildable cells
  fog?: boolean;
  rockCost?: number;
  towers: TowerId[]; // available towers
  spells: SpellId[]; // available spells
  intro: { towers?: TowerId[]; enemies?: EnemyId[]; spells?: SpellId[]; features?: string[] };
  hints?: HintDef[];
  startGold: number;
  hpMul: number; // per-level HP multiplier on top of the wave curve
  waveGap: number; // seconds between the end of spawning and the next wave
  waves: WaveDef[];
  seed: number;
}

export interface SpellDef {
  id: SpellId;
  cooldown: number;
  targeted: boolean;
  radius?: number;
  damage?: number;
  delay?: number;
  duration?: number;
  power?: number;
}

export interface TalentDef {
  id: string; // i18n key: talent.<id>.name / .desc
  cost: number; // stars
  row: number; // 0..3
  col: number; // 0..2
  requires?: string;
  bonus: Partial<Bonuses>;
}

export interface ChallengeDef {
  id: ChallengeId;
  scoreMul: number;
}

// ---------- Run-time modifiers ----------

export interface Bonuses {
  startGold: number;
  extraLives: number;
  damageMul: number;
  rangeMul: number;
  buildCostMul: number;
  upgradeCostMul: number;
  spellCdMul: number;
  killGoldMul: number;
  sellRatio: number;
  earlyBonusMul: number;
  slowTimeMul: number;
  incomeMul: number;
}

export interface RunConfig {
  level: LevelDef;
  difficulty: Difficulty;
  bonuses: Bonuses;
  challenges: ChallengeId[];
  seed: number;
  endless?: boolean;
}

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

// ---------- Presentation contracts ----------

/** UI state the renderer needs to draw previews and selection. */
export interface ViewState {
  hoverCell: Vec2 | null; // cell coordinates
  buildType: TowerId | null;
  buildValid: boolean;
  buildRange: number; // effective range preview for buildType at hoverCell, cells
  selectedTowerId: number;
  spellTarget: SpellId | null;
  pointer: Vec2 | null; // world cell units
  showDamageNumbers: boolean;
  reducedMotion: boolean;
}

export interface Renderer {
  setLevel(state: GameState): void;
  /** Feed simulation events (call once per frame with the events drained after stepping). */
  consume(events: SimEvent[], state: GameState): void;
  render(state: GameState, view: ViewState, dtReal: number): void;
  resize(cssWidth: number, cssHeight: number, dpr: number): void;
}

export type SfxName =
  | 'spark'
  | 'boom'
  | 'frost'
  | 'zap'
  | 'snipe'
  | 'spore'
  | 'hit'
  | 'death'
  | 'bossDeath'
  | 'build'
  | 'upgrade'
  | 'sell'
  | 'wave'
  | 'bossWave'
  | 'leak'
  | 'coin'
  | 'spell'
  | 'freeze'
  | 'darkness'
  | 'click'
  | 'error'
  | 'win'
  | 'lose';

export interface AudioEngine {
  /** Must be called from a user gesture before sound can play. */
  unlock(): void;
  play(name: SfxName, volume?: number): void;
  handleEvents(events: SimEvent[]): void;
  setVolume(sfx: number, music: number): void;
  setMuted(muted: boolean): void;
  startMusic(biome: BiomeId | 'menu'): void;
  stopMusic(): void;
}

// ---------- Saves ----------

export interface Settings {
  sfxVolume: number; // 0..1
  musicVolume: number; // 0..1
  muted: boolean;
  lang: LangId;
  showDamage: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
}

export interface LevelProgress {
  stars: number; // 0..3
  bestLives: number;
  completed: Partial<Record<Difficulty, boolean>>;
}

export interface SaveData {
  version: number;
  levels: Record<number, LevelProgress>;
  talents: string[];
  settings: Settings;
  endlessBest: number;
  totals: { kills: number; playTime: number; wins: number; losses: number };
  seenHints: string[];
}
