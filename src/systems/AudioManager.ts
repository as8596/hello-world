/**
 * AudioManager — procedural WebAudio SFX (DESIGN.md §15.2). No asset files: every
 * sound is synthesized from oscillators/noise, so it works offline and is tunable
 * in code. Structured so real samples can replace `playSfx` later without touching
 * call sites. The handbell + great-bell are the game's identity, mixed loudest.
 *
 * Browsers block audio until a user gesture, so the context starts suspended and
 * `resume()` is called on the first key/pointer input.
 */

export type SfxName =
  | 'handbell'
  | 'greatbell'
  | 'chime'
  | 'attack'
  | 'dodge'
  | 'hit'
  | 'clink'
  | 'enemyDeath'
  | 'playerHurt'
  | 'heart'
  | 'rested'
  | 'fog'
  | 'footstep';

// --- tiny synth helpers ----------------------------------------------------

function tone(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  type: OscillatorType,
  t0: number,
  dur: number,
  peak: number,
  attack = 0.004,
): void {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(dest);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

/** A glide tone (e.g. the descending "ow" of taking damage). */
function sweep(
  ctx: AudioContext,
  dest: AudioNode,
  f0: number,
  f1: number,
  type: OscillatorType,
  t0: number,
  dur: number,
  peak: number,
): void {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(dest);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

/** Inharmonic partials → a bell. Warm, slightly detuned, long decay. */
function bell(ctx: AudioContext, dest: AudioNode, fund: number, t0: number, dur: number, peak: number): void {
  const partials: [number, number][] = [
    [1, 1],
    [2.0, 0.5],
    [2.76, 0.32],
    [3.52, 0.2],
    [5.1, 0.12],
  ];
  for (const [ratio, amp] of partials) {
    tone(ctx, dest, fund * ratio, 'sine', t0, dur / (1 + (ratio - 1) * 0.45), peak * amp, 0.002);
  }
}

function noiseBurst(
  ctx: AudioContext,
  dest: AudioNode,
  t0: number,
  dur: number,
  peak: number,
  filter: BiquadFilterType,
  freq: number,
  q = 0.8,
): void {
  const src = ctx.createBufferSource();
  const buf = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * dur)), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = filter;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f).connect(g).connect(dest);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

// --- the SFX bank ----------------------------------------------------------

const SFX: Record<SfxName, (ctx: AudioContext, dest: AudioNode) => void> = {
  // The signature tool: a bright, warm handbell.
  handbell: (ctx, d) => {
    const t = ctx.currentTime;
    bell(ctx, d, 784, t, 1.1, 0.24);
    bell(ctx, d, 1175, t + 0.005, 0.7, 0.09);
  },
  // The identity sound: a deep, long resonant toll.
  greatbell: (ctx, d) => {
    const t = ctx.currentTime;
    bell(ctx, d, 138, t, 3.0, 0.34);
    bell(ctx, d, 207, t + 0.01, 2.2, 0.14);
    bell(ctx, d, 92, t, 3.4, 0.18);
  },
  chime: (ctx, d) => bell(ctx, d, 1175, ctx.currentTime, 1.0, 0.16),
  attack: (ctx, d) => noiseBurst(ctx, d, ctx.currentTime, 0.16, 0.13, 'bandpass', 1300, 0.9),
  dodge: (ctx, d) => noiseBurst(ctx, d, ctx.currentTime, 0.22, 0.08, 'bandpass', 650, 0.7),
  hit: (ctx, d) => {
    const t = ctx.currentTime;
    tone(ctx, d, 165, 'sine', t, 0.12, 0.22, 0.001);
    noiseBurst(ctx, d, t, 0.06, 0.12, 'lowpass', 2200);
  },
  // The armored "no": a bright metallic ping.
  clink: (ctx, d) => {
    const t = ctx.currentTime;
    tone(ctx, d, 2640, 'triangle', t, 0.1, 0.09, 0.001);
    tone(ctx, d, 3960, 'sine', t, 0.07, 0.05, 0.001);
  },
  enemyDeath: (ctx, d) => {
    const t = ctx.currentTime;
    sweep(ctx, d, 340, 180, 'sine', t, 0.22, 0.12);
    noiseBurst(ctx, d, t, 0.2, 0.07, 'lowpass', 1600);
  },
  playerHurt: (ctx, d) => {
    const t = ctx.currentTime;
    sweep(ctx, d, 300, 120, 'sawtooth', t, 0.22, 0.14);
    noiseBurst(ctx, d, t, 0.12, 0.08, 'lowpass', 1400);
  },
  heart: (ctx, d) => {
    const t = ctx.currentTime;
    tone(ctx, d, 659, 'sine', t, 0.16, 0.16);
    tone(ctx, d, 988, 'sine', t + 0.1, 0.24, 0.16);
  },
  rested: (ctx, d) => {
    const t = ctx.currentTime;
    for (const f of [392, 494, 587]) tone(ctx, d, f, 'sine', t, 1.3, 0.07, 0.05);
  },
  fog: (ctx, d) => noiseBurst(ctx, d, ctx.currentTime, 0.5, 0.05, 'highpass', 2200, 0.5),
  // A soft, low, slightly-varied foot plant — kept quiet so it sits under everything.
  footstep: (ctx, d) => noiseBurst(ctx, d, ctx.currentTime, 0.09, 0.045, 'lowpass', 270 + Math.random() * 90, 1.3),
};

// --- the manager -----------------------------------------------------------

class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted = false;
  private volume = 0.5;

  /** Create the (suspended) context + master bus. Safe to call repeatedly. */
  init(): void {
    if (this.ctx) return;
    const Ctx: typeof AudioContext | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : this.volume;
    this.master.connect(this.ctx.destination);
  }

  /** Unlock audio after the first user gesture (browsers require this). */
  resume(): void {
    this.init();
    void this.ctx?.resume();
  }

  playSfx(name: SfxName): void {
    if (!this.ctx || !this.master || this.ctx.state !== 'running') return;
    SFX[name](this.ctx, this.master);
  }

  setMuted(m: boolean): void {
    this.muted = m;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : this.volume, this.ctx.currentTime, 0.02);
    }
  }

  toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.master && this.ctx && !this.muted) {
      this.master.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.02);
    }
  }
}

/** Shared singleton — one mixer for the whole game. */
export const audio = new AudioManager();
