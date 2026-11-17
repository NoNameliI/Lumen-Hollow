import type { AudioEngine, BiomeId, SfxName, SimEvent } from '../types';
import { createMusic, type Music } from './music';
import { playSfx } from './sfx';
import { makeNoiseBuffer, volumeCurve, type Bus } from './synth';

/** Minimum seconds between two plays of the same effect when driven by events. */
const MIN_INTERVAL: Partial<Record<SfxName, number>> = {
  hit: 0.04,
  death: 0.03,
  spark: 0.05,
  boom: 0.05,
  frost: 0.05,
  zap: 0.05,
  snipe: 0.05,
  spore: 0.05,
  coin: 0.06,
  leak: 0.12,
  build: 0.06,
};
const DEFAULT_INTERVAL = 0.05;
const VOICE_WINDOW = 0.1;
const VOICE_CAP = 12;
const CROWD_WINDOW = 0.25;

type Ctor = typeof AudioContext;

function contextCtor(): Ctor | null {
  const g = globalThis as { AudioContext?: Ctor; webkitAudioContext?: Ctor };
  return g.AudioContext ?? g.webkitAudioContext ?? null;
}

export function createAudio(): AudioEngine {
  let ctx: AudioContext | null = null;
  let sfxBus: Bus | null = null;
  let sfxGain: GainNode | null = null;
  let musicGain: GainNode | null = null;
  let master: GainNode | null = null;
  let music: Music | null = null;
  let sfxVol = 0.8;
  let musicVol = 0.6;
  let muted = false;
  let pendingMusic: BiomeId | 'menu' | null = null;
  let failed = false;

  const lastPlay = new Map<SfxName, number>();
  const crowd = new Map<SfxName, number[]>();
  let recent: number[] = [];

  function unlock(): void {
    if (failed) return;
    if (ctx) {
      if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined);
      return;
    }
    const Ctor = contextCtor();
    if (!Ctor) {
      failed = true;
      return;
    }
    try {
      const c = new Ctor();
      const comp = c.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.knee.value = 24;
      comp.ratio.value = 3;
      comp.attack.value = 0.01;
      comp.release.value = 0.25;
      master = c.createGain();
      master.gain.value = muted ? 0 : 1;
      master.connect(comp);
      comp.connect(c.destination);
      sfxGain = c.createGain();
      sfxGain.gain.value = volumeCurve(sfxVol);
      sfxGain.connect(master);
      musicGain = c.createGain();
      musicGain.gain.value = volumeCurve(musicVol) * 0.7;
      musicGain.connect(master);
      const noise = makeNoiseBuffer(c);
      sfxBus = { ctx: c, dest: sfxGain, noise };
      music = createMusic({ ctx: c, dest: musicGain, noise }, musicGain);
      ctx = c;
      if (c.state === 'suspended') void c.resume().catch(() => undefined);
      if (pendingMusic) {
        music.start(pendingMusic);
      }
    } catch {
      failed = true;
      ctx = null;
    }
  }

  function play(name: SfxName, volume = 1): void {
    if (!ctx || !sfxBus || muted) return;
    try {
      playSfx(sfxBus, name, ctx.currentTime + 0.005, volume);
    } catch {
      // Audio failures must never affect gameplay.
    }
  }

  function trigger(name: SfxName, volume: number): void {
    if (!ctx || muted) return;
    const now = ctx.currentTime;
    const last = lastPlay.get(name) ?? -1;
    if (now - last < (MIN_INTERVAL[name] ?? DEFAULT_INTERVAL)) return;
    recent = recent.filter((t) => now - t < VOICE_WINDOW);
    if (recent.length >= VOICE_CAP) return;
    const same = (crowd.get(name) ?? []).filter((t) => now - t < CROWD_WINDOW);
    same.push(now);
    crowd.set(name, same);
    lastPlay.set(name, now);
    recent.push(now);
    play(name, volume / (1 + (same.length - 1) * 0.35));
  }

  function handleEvents(events: SimEvent[]): void {
    if (!ctx || muted) return;
    for (const e of events) {
      switch (e.t) {
        case 'shot':
          switch (e.tower) {
            case 'spark':
              trigger('spark', 1);
              break;
            case 'boomcap':
              trigger('boom', 0.45);
              break;
            case 'frost':
              trigger('frost', 1);
              break;
            case 'storm':
              trigger('zap', 1);
              break;
            case 'owl':
              trigger('snipe', 1);
              break;
            case 'mold':
              trigger('spore', 1);
              break;
            default:
              break;
          }
          break;
        case 'explode':
          if (e.kind === 'boom') trigger('boom', 0.8);
          break;
        case 'chain':
          trigger('zap', 0.8);
          break;
        case 'hit':
          trigger('hit', 0.35);
          break;
        case 'death':
          trigger(e.boss ? 'bossDeath' : 'death', 1);
          break;
        case 'income':
          trigger('coin', 1);
          break;
        case 'leak':
          trigger('leak', 1);
          break;
        case 'build':
          trigger('build', 1);
          break;
        case 'rock':
          trigger('build', 1);
          break;
        case 'upgrade':
          trigger('upgrade', 1);
          break;
        case 'sell':
          trigger('sell', 1);
          break;
        case 'waveStart':
          trigger(e.boss ? 'bossWave' : 'wave', 1);
          break;
        case 'spell':
          trigger(e.spell === 'frostnova' ? 'freeze' : 'spell', 1);
          break;
        case 'bossPhase':
          trigger('bossWave', 1);
          break;
        case 'darkness':
          trigger('darkness', 1);
          break;
        case 'won':
          trigger('win', 1);
          break;
        case 'lost':
          trigger('lose', 1);
          break;
        default:
          break;
      }
    }
  }

  function ramp(node: GainNode | null, value: number, tc = 0.05): void {
    if (!ctx || !node) return;
    node.gain.setTargetAtTime(value, ctx.currentTime, tc);
  }

  return {
    unlock,
    play,
    handleEvents,
    setVolume(sfx, musicV) {
      sfxVol = Math.min(1, Math.max(0, sfx));
      musicVol = Math.min(1, Math.max(0, musicV));
      ramp(sfxGain, volumeCurve(sfxVol));
      ramp(musicGain, volumeCurve(musicVol) * 0.7);
    },
    setMuted(m) {
      muted = m;
      ramp(master, m ? 0 : 1, 0.08);
    },
    startMusic(biome) {
      pendingMusic = biome;
      if (music) music.start(biome);
    },
    stopMusic() {
      pendingMusic = null;
      music?.stop();
    },
  };
}
