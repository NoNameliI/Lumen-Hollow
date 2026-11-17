// Static data contracts: ids, tower/enemy/level/spell/talent tables and run configuration.
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
