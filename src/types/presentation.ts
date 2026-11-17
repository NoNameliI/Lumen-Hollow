// Contracts for rendering, audio and saves.
import type { Vec2, TowerId, SpellId, Difficulty, BiomeId, LangId } from './data';
import type { GameState, SimEvent } from './state';

// ---------- Presentation contracts ----------

/** Visual quality preset; the renderer may lower it automatically when the frame rate drops. */
export type Quality = 'low' | 'medium' | 'high';

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
  reducedMotion: boolean; // also disables camera shake and hit-stop
  quality: Quality;
}

export interface Renderer {
  setLevel(state: GameState): void;
  /** Feed simulation events (call once per frame with the events drained after stepping). */
  consume(events: SimEvent[], state: GameState): void;
  render(state: GameState, view: ViewState, dtReal: number): void;
  resize(cssWidth: number, cssHeight: number, dpr: number): void;
  /** Seconds of hit-stop requested since the last call (the UI pauses stepping for that long). */
  takeHitStop(): number;
  /** Quality actually used after automatic downgrades. */
  effectiveQuality(): Quality;
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
  quality: Quality;
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
