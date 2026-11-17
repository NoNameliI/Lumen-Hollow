import type { SfxName } from '../types';
import { midiToHz as hz, noiseBurst, tone, type Bus } from './synth';

/** t = start time, v = volume 0..1, p = random pitch multiplier. */
type Voice = (b: Bus, t: number, v: number, p: number) => void;

const arp = (
  b: Bus,
  t: number,
  notes: number[],
  step: number,
  v: number,
  p: number,
  type: OscillatorType,
  dur = 0.3,
) => {
  notes.forEach((m, i) => {
    tone(b, { type, f: hz(m) * p, t: t + i * step, dur, g: 0.16 * v, a: 0.006, lp: 5000 });
  });
};

export const SFX: Record<SfxName, Voice> = {
  spark(b, t, v, p) {
    tone(b, { type: 'triangle', f: 1800 * p, to: 1200 * p, t, dur: 0.07, g: 0.12 * v });
    tone(b, { type: 'sine', f: 3600 * p, t, dur: 0.05, g: 0.05 * v });
  },
  boom(b, t, v, p) {
    tone(b, { type: 'sine', f: 130 * p, to: 45, t, dur: 0.28, g: 0.4 * v, a: 0.006 });
    noiseBurst(b, { type: 'lowpass', f: 900, to: 200, t, dur: 0.22, g: 0.22 * v });
  },
  frost(b, t, v, p) {
    tone(b, { type: 'sine', f: 1760 * p, t, dur: 0.45, g: 0.1 * v });
    tone(b, { type: 'sine', f: 2637 * p, t: t + 0.02, dur: 0.35, g: 0.07 * v });
    tone(b, { type: 'sine', f: 3951 * p, t: t + 0.04, dur: 0.25, g: 0.04 * v });
  },
  zap(b, t, v, p) {
    tone(b, { type: 'sawtooth', f: 520 * p, to: 140, t, dur: 0.14, g: 0.07 * v, lp: 2200 });
    noiseBurst(b, { type: 'bandpass', f: 3200, to: 1400, q: 2, t, dur: 0.12, g: 0.12 * v });
    noiseBurst(b, { type: 'highpass', f: 5000, t: t + 0.05, dur: 0.04, g: 0.06 * v });
  },
  snipe(b, t, v, p) {
    noiseBurst(b, {
      type: 'bandpass',
      f: 600,
      to: 3000,
      q: 1.2,
      t,
      dur: 0.16,
      a: 0.05,
      g: 0.1 * v,
    });
    tone(b, { type: 'sine', f: 320 * p, to: 180, t: t + 0.12, dur: 0.1, g: 0.22 * v });
  },
  spore(b, t, v, p) {
    tone(b, { type: 'sine', f: 280 * p, to: 640 * p, t, dur: 0.09, g: 0.2 * v });
    noiseBurst(b, { type: 'bandpass', f: 1200, q: 3, t: t + 0.06, dur: 0.05, g: 0.06 * v });
  },
  hit(b, t, v, p) {
    tone(b, { type: 'triangle', f: 900 * p, to: 600, t, dur: 0.035, g: 0.06 * v });
  },
  death(b, t, v, p) {
    tone(b, { type: 'sine', f: 520 * p, to: 180, t, dur: 0.16, g: 0.16 * v });
    noiseBurst(b, { type: 'lowpass', f: 1500, to: 400, t, dur: 0.08, g: 0.06 * v });
  },
  bossDeath(b, t, v, p) {
    tone(b, { type: 'sine', f: 110 * p, to: 38, t, dur: 1.6, a: 0.25, g: 0.4 * v });
    tone(b, { type: 'triangle', f: 220 * p, to: 70, t, dur: 1.3, a: 0.2, g: 0.12 * v, lp: 700 });
    noiseBurst(b, { type: 'lowpass', f: 300, to: 1200, t, dur: 1.2, a: 0.5, g: 0.18 * v });
    arp(b, t + 0.9, [72, 76, 79], 0.14, v, p, 'sine', 0.9);
  },
  build(b, t, v, p) {
    tone(b, { type: 'sine', f: 190 * p, to: 110, t, dur: 0.1, g: 0.3 * v });
    noiseBurst(b, { type: 'bandpass', f: 700, q: 2, t, dur: 0.04, g: 0.1 * v });
    tone(b, { type: 'sine', f: hz(84) * p, t: t + 0.08, dur: 0.4, g: 0.09 * v });
  },
  upgrade(b, t, v, p) {
    arp(b, t, [72, 76, 79, 84], 0.07, v, p, 'triangle', 0.35);
  },
  sell(b, t, v, p) {
    tone(b, { type: 'triangle', f: 1568 * p, t, dur: 0.12, g: 0.1 * v });
    tone(b, { type: 'triangle', f: 2093 * p, t: t + 0.06, dur: 0.14, g: 0.1 * v });
    tone(b, { type: 'triangle', f: 1760 * p, t: t + 0.12, dur: 0.16, g: 0.08 * v });
  },
  wave(b, t, v, p) {
    tone(b, { type: 'triangle', f: hz(62) * p, t, dur: 0.9, a: 0.12, g: 0.18 * v, lp: 1800 });
    tone(b, { type: 'sine', f: hz(69) * p, t: t + 0.25, dur: 1.2, a: 0.1, g: 0.14 * v });
    tone(b, { type: 'sine', f: hz(81) * p, t: t + 0.25, dur: 1.4, g: 0.05 * v });
  },
  bossWave(b, t, v, p) {
    tone(b, { type: 'sine', f: 55 * p, to: 48, t, dur: 1.8, a: 0.06, g: 0.4 * v });
    tone(b, { type: 'triangle', f: 82 * p, t, dur: 1.6, a: 0.3, g: 0.14 * v, lp: 500 });
    tone(b, { type: 'triangle', f: 116 * p, t: t + 0.4, dur: 1.4, a: 0.3, g: 0.1 * v, lp: 500 });
    noiseBurst(b, { type: 'lowpass', f: 200, t, dur: 1, g: 0.1 * v });
  },
  leak(b, t, v, p) {
    tone(b, { type: 'sine', f: 100 * p, to: 55, t, dur: 0.3, g: 0.4 * v });
    noiseBurst(b, { type: 'lowpass', f: 400, t, dur: 0.15, g: 0.12 * v });
  },
  coin(b, t, v, p) {
    tone(b, { type: 'triangle', f: 1976 * p, t, dur: 0.08, g: 0.1 * v });
    tone(b, { type: 'triangle', f: 2637 * p, t: t + 0.06, dur: 0.22, g: 0.1 * v });
  },
  spell(b, t, v, p) {
    arp(b, t, [88, 91, 95, 100, 103, 107], 0.045, v * 0.8, p, 'sine', 0.6);
    noiseBurst(b, { type: 'highpass', f: 6000, t, dur: 0.5, a: 0.1, g: 0.03 * v });
  },
  freeze(b, t, v, p) {
    tone(b, { type: 'sine', f: 600 * p, to: 3200 * p, t, dur: 0.55, a: 0.2, g: 0.1 * v });
    tone(b, { type: 'sine', f: 900 * p, to: 4800 * p, t, dur: 0.55, a: 0.2, g: 0.06 * v });
    noiseBurst(b, { type: 'highpass', f: 5000, t: t + 0.3, dur: 0.3, g: 0.05 * v });
  },
  darkness(b, t, v, p) {
    tone(b, { type: 'sine', f: 60 * p, to: 100, t, dur: 1.4, a: 1.0, g: 0.3 * v });
    noiseBurst(b, { type: 'lowpass', f: 150, to: 900, t, dur: 1.4, a: 1.0, g: 0.2 * v });
    tone(b, { type: 'triangle', f: 90 * p, t: t + 0.2, dur: 1.2, a: 0.8, g: 0.08 * v, lp: 400 });
  },
  click(b, t, v, p) {
    tone(b, { type: 'sine', f: 1100 * p, to: 800, t, dur: 0.04, g: 0.1 * v });
  },
  error(b, t, v, p) {
    tone(b, { type: 'triangle', f: 140 * p, to: 110, t, dur: 0.18, g: 0.16 * v, lp: 500 });
    tone(b, { type: 'triangle', f: 147 * p, to: 115, t, dur: 0.18, g: 0.1 * v, lp: 500 });
  },
  win(b, t, v, p) {
    arp(b, t, [67, 72, 76, 79, 84], 0.16, v, p, 'triangle', 0.9);
    [72, 76, 79, 84].forEach((m) =>
      tone(b, { type: 'sine', f: hz(m) * p, t: t + 0.9, dur: 2.2, a: 0.08, g: 0.09 * v }),
    );
  },
  lose(b, t, v, p) {
    arp(b, t, [69, 67, 64, 62, 57], 0.3, v, p, 'sine', 1.1);
    tone(b, {
      type: 'triangle',
      f: hz(45) * p,
      t: t + 0.9,
      dur: 2.2,
      a: 0.2,
      g: 0.16 * v,
      lp: 400,
    });
  },
};

/** Plays a named effect at time t with a small random pitch drift. */
export function playSfx(b: Bus, name: SfxName, t: number, volume: number): void {
  const pitch = 1 + (Math.random() - 0.5) * 0.08;
  SFX[name](b, t, Math.min(1.5, Math.max(0, volume)), pitch);
}
