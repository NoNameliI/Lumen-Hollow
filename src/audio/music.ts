import type { BiomeId } from '../types';
import { midiToHz, tone, type Bus } from './synth';

export type MusicId = BiomeId | 'menu';

interface Theme {
  root: number; // midi of the tonic (pad register)
  scale: number[]; // semitones above root
  beat: number; // seconds per beat
  progression: number[]; // scale degrees for the chord roots, one per bar
  padWave: OscillatorType;
  leadWave: OscillatorType;
  cutoff: number;
  melodyChance: number;
  melodyOctave: number; // octaves above the pad root
  echo: number; // feedback delay wet amount
  level: number;
}

const THEMES: Record<MusicId, Theme> = {
  menu: {
    root: 55,
    scale: [0, 2, 4, 7, 9],
    beat: 0.75,
    progression: [0, 3, 1, 4],
    padWave: 'sine',
    leadWave: 'triangle',
    cutoff: 2000,
    melodyChance: 0.3,
    melodyOctave: 1,
    echo: 0.4,
    level: 0.9,
  },
  meadow: {
    root: 57,
    scale: [0, 2, 4, 7, 9],
    beat: 0.5,
    progression: [0, 2, 3, 1],
    padWave: 'triangle',
    leadWave: 'triangle',
    cutoff: 2600,
    melodyChance: 0.4,
    melodyOctave: 1,
    echo: 0.3,
    level: 0.9,
  },
  marsh: {
    root: 52,
    scale: [0, 2, 3, 7, 9],
    beat: 0.7,
    progression: [0, 2, 1, 3],
    padWave: 'sine',
    leadWave: 'sine',
    cutoff: 1500,
    melodyChance: 0.3,
    melodyOctave: 1,
    echo: 0.5,
    level: 1,
  },
  cliffs: {
    root: 45,
    scale: [0, 3, 5, 7, 10],
    beat: 0.95,
    progression: [0, 3, 0, 4],
    padWave: 'triangle',
    leadWave: 'sine',
    cutoff: 1000,
    melodyChance: 0.15,
    melodyOctave: 1,
    echo: 0.45,
    level: 1,
  },
  dusk: {
    root: 50,
    scale: [0, 3, 5, 7, 10],
    beat: 0.8,
    progression: [0, 4, 3, 2],
    padWave: 'sine',
    leadWave: 'triangle',
    cutoff: 1300,
    melodyChance: 0.25,
    melodyOctave: 1,
    echo: 0.45,
    level: 1,
  },
};

const FADE = 2.5;
const LOOKAHEAD = 0.45;
const TICK_MS = 100;

interface Session {
  id: MusicId;
  theme: Theme;
  bus: Bus;
  out: GainNode;
  nodes: AudioNode[];
  nextBar: number;
  nextStep: number;
  bar: number;
  melodyIdx: number;
  stopped: boolean;
}

export interface Music {
  start(id: MusicId): void;
  stop(): void;
}

function degree(theme: Theme, deg: number, octave = 0): number {
  const n = theme.scale.length;
  const oct = Math.floor(deg / n);
  return theme.root + theme.scale[((deg % n) + n) % n] + 12 * (oct + octave);
}

export function createMusic(base: Bus, dest: AudioNode): Music {
  const { ctx } = base;
  let timer: ReturnType<typeof setInterval> | null = null;
  const sessions: Session[] = [];

  function buildSession(id: MusicId): Session {
    const theme = THEMES[id];
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, ctx.currentTime);
    out.gain.linearRampToValueAtTime(theme.level, ctx.currentTime + FADE);
    out.connect(dest);

    const input = ctx.createBiquadFilter();
    input.type = 'lowpass';
    input.frequency.value = theme.cutoff;
    input.Q.value = 0.4;
    input.connect(out);

    // Feedback delay acting as a soft room.
    const delay = ctx.createDelay(1.5);
    delay.delayTime.value = theme.beat * 0.75;
    const fb = ctx.createGain();
    fb.gain.value = 0.42;
    const damp = ctx.createBiquadFilter();
    damp.type = 'lowpass';
    damp.frequency.value = 1400;
    const wet = ctx.createGain();
    wet.gain.value = theme.echo;
    input.connect(delay);
    delay.connect(damp);
    damp.connect(fb);
    fb.connect(delay);
    damp.connect(wet);
    wet.connect(out);

    const t0 = ctx.currentTime + 0.1;
    return {
      id,
      theme,
      bus: { ctx, dest: input, noise: base.noise },
      out,
      nodes: [out, input, delay, fb, damp, wet],
      nextBar: t0,
      nextStep: t0 + theme.beat * 0.5,
      bar: 0,
      melodyIdx: 2,
      stopped: false,
    };
  }

  function schedulePad(s: Session, t: number): void {
    const th = s.theme;
    const barLen = th.beat * 4;
    const root = th.progression[s.bar % th.progression.length];
    const dur = barLen * 1.35;
    // Root, third-ish and fifth-ish chord tones taken from the scale.
    [root, root + 2, root + 4].forEach((d, i) => {
      const f = midiToHz(degree(th, d));
      tone(s.bus, { type: th.padWave, f, t, dur, a: barLen * 0.45, g: 0.05, detune: (i - 1) * 6 });
    });
    tone(s.bus, {
      type: 'sine',
      f: midiToHz(degree(th, root, -1)),
      t,
      dur,
      a: barLen * 0.4,
      g: 0.07,
    });
    s.bar++;
  }

  function scheduleMelody(s: Session, t: number): void {
    const th = s.theme;
    if (Math.random() > th.melodyChance) return;
    const n = th.scale.length;
    const move = Math.floor(Math.random() * 5) - 2;
    s.melodyIdx = Math.min(n * 2 - 1, Math.max(0, s.melodyIdx + move));
    const f = midiToHz(degree(th, s.melodyIdx, th.melodyOctave));
    tone(s.bus, { type: th.leadWave, f, t, dur: th.beat * 3.2, a: 0.02, g: 0.07 });
    // Faint octave sparkle on some notes.
    if (Math.random() < 0.3)
      tone(s.bus, { type: 'sine', f: f * 2, t: t + 0.01, dur: th.beat * 1.8, a: 0.01, g: 0.025 });
  }

  function tick(): void {
    const horizon = ctx.currentTime + LOOKAHEAD;
    if (timer !== null && !sessions.some((s) => !s.stopped)) {
      clearInterval(timer);
      timer = null;
      return;
    }
    for (const s of sessions) {
      if (s.stopped) continue;
      const barLen = s.theme.beat * 4;
      while (s.nextBar < horizon) {
        schedulePad(s, s.nextBar);
        s.nextBar += barLen;
      }
      const stepLen = s.theme.beat * 0.5;
      while (s.nextStep < horizon) {
        scheduleMelody(s, s.nextStep);
        s.nextStep += stepLen;
      }
    }
  }

  function fadeOut(s: Session): void {
    s.stopped = true;
    const now = ctx.currentTime;
    s.out.gain.cancelScheduledValues(now);
    s.out.gain.setValueAtTime(Math.max(s.out.gain.value, 0.0001), now);
    s.out.gain.linearRampToValueAtTime(0.0001, now + FADE);
    setTimeout(
      () => {
        for (const n of s.nodes) n.disconnect();
        const i = sessions.indexOf(s);
        if (i >= 0) sessions.splice(i, 1);
      },
      (FADE + 4) * 1000,
    );
  }

  return {
    start(id) {
      if (sessions.some((s) => !s.stopped && s.id === id)) return;
      for (const s of sessions) if (!s.stopped) fadeOut(s);
      sessions.push(buildSession(id));
      if (timer === null) timer = setInterval(tick, TICK_MS);
      tick();
    },
    stop() {
      for (const s of sessions) if (!s.stopped) fadeOut(s);
    },
  };
}
