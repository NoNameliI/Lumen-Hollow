/** Small WebAudio building blocks shared by the SFX and music modules. */

export interface Bus {
  ctx: AudioContext;
  dest: AudioNode;
  noise: AudioBuffer;
}

export interface ToneOpts {
  type: OscillatorType;
  f: number;
  /** Optional end frequency (exponential glide). */
  to?: number;
  t: number;
  dur: number;
  /** Attack time in seconds. */
  a?: number;
  g: number;
  /** Optional low-pass cutoff. */
  lp?: number;
  detune?: number;
  dest?: AudioNode;
}

export interface NoiseOpts {
  type: BiquadFilterType;
  f: number;
  to?: number;
  q?: number;
  t: number;
  dur: number;
  a?: number;
  g: number;
  dest?: AudioNode;
}

const FLOOR = 0.0001;

export function midiToHz(m: number): number {
  return 440 * Math.pow(2, (m - 69) / 12);
}

export function makeNoiseBuffer(ctx: AudioContext, seconds = 2): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

export function tone(b: Bus, o: ToneOpts): void {
  const { ctx } = b;
  const osc = ctx.createOscillator();
  osc.type = o.type;
  osc.frequency.setValueAtTime(o.f, o.t);
  if (o.to !== undefined) osc.frequency.exponentialRampToValueAtTime(o.to, o.t + o.dur);
  if (o.detune) osc.detune.value = o.detune;
  const g = ctx.createGain();
  const a = Math.min(o.a ?? 0.005, o.dur * 0.9);
  g.gain.setValueAtTime(FLOOR, o.t);
  g.gain.exponentialRampToValueAtTime(Math.max(o.g, FLOOR * 2), o.t + a);
  g.gain.exponentialRampToValueAtTime(FLOOR, o.t + o.dur);
  let filter: BiquadFilterNode | null = null;
  if (o.lp) {
    filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = o.lp;
    osc.connect(filter);
    filter.connect(g);
  } else {
    osc.connect(g);
  }
  g.connect(o.dest ?? b.dest);
  osc.start(o.t);
  osc.stop(o.t + o.dur + 0.05);
  osc.onended = () => {
    osc.disconnect();
    filter?.disconnect();
    g.disconnect();
  };
}

export function noiseBurst(b: Bus, o: NoiseOpts): void {
  const { ctx } = b;
  const src = ctx.createBufferSource();
  src.buffer = b.noise;
  const filter = ctx.createBiquadFilter();
  filter.type = o.type;
  filter.Q.value = o.q ?? 0.7;
  filter.frequency.setValueAtTime(o.f, o.t);
  if (o.to !== undefined) filter.frequency.exponentialRampToValueAtTime(o.to, o.t + o.dur);
  const g = ctx.createGain();
  const a = Math.min(o.a ?? 0.003, o.dur * 0.9);
  g.gain.setValueAtTime(FLOOR, o.t);
  g.gain.exponentialRampToValueAtTime(Math.max(o.g, FLOOR * 2), o.t + a);
  g.gain.exponentialRampToValueAtTime(FLOOR, o.t + o.dur);
  src.connect(filter);
  filter.connect(g);
  g.connect(o.dest ?? b.dest);
  src.start(o.t, Math.random() * 0.4, o.dur + 0.05);
  src.onended = () => {
    src.disconnect();
    filter.disconnect();
    g.disconnect();
  };
}

/** Perceptual volume curve: 0..1 slider to linear gain. */
export function volumeCurve(v: number): number {
  const x = Math.min(1, Math.max(0, v));
  return x * x;
}
