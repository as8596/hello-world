/**
 * MusicEngine — procedural adaptive score (DESIGN.md §15.2). Like the SFX bank,
 * there are no audio files: a continuous A-minor pad bed underpins everything,
 * and two scheduled layers crossfade with a single `intensity` (0 = exploring,
 * 1 = in danger). Calm = sparse pentatonic plucks; danger = a driving bass pulse
 * and dissonant shimmer fade in while the calm plucks duck back.
 *
 * Scheduling uses the standard WebAudio lookahead pattern: a coarse setInterval
 * timer queues note events a short way into the future, so playback stays sample-
 * accurate regardless of timer jitter.
 */

const STEPS = 16; // an eighth-note loop
const BPM = 72;
const STEP_DUR = 60 / BPM / 2; // eighth note in seconds

// A-minor pentatonic across two octaves, for the calm melodic wander.
const PENTA = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33];

export class MusicEngine {
  private readonly ctx: AudioContext;
  private readonly bus: GainNode;
  private readonly padGain: GainNode;
  private readonly calmGain: GainNode;
  private readonly tensionGain: GainNode;

  private timer: number | null = null;
  private nextNoteTime = 0;
  private step = 0;
  private melodyIndex = 4;

  /** Smoothed danger level driving the crossfade; eases toward `target`. */
  private current = 0;
  private target = 0;

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.bus = ctx.createGain();
    this.bus.gain.value = 0.6; // sit the whole score under the SFX
    this.bus.connect(destination);

    this.padGain = ctx.createGain();
    this.padGain.gain.value = 0.5;
    this.calmGain = ctx.createGain();
    this.calmGain.gain.value = 0.9;
    this.tensionGain = ctx.createGain();
    this.tensionGain.gain.value = 0;
    for (const g of [this.padGain, this.calmGain, this.tensionGain]) g.connect(this.bus);
  }

  /** Build the continuous pad bed and start the lookahead scheduler. */
  start(): void {
    if (this.timer !== null) return;
    this.startPad();
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this.timer = window.setInterval(() => this.scheduler(), 40);
  }

  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Set the target danger level (0..1). The engine eases toward it smoothly. */
  setIntensity(v: number): void {
    this.target = Math.max(0, Math.min(1, v));
  }

  // --- the pad bed ---------------------------------------------------------

  private startPad(): void {
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 600;
    f.Q.value = 0.7;
    f.connect(this.padGain);

    // A2 + E3 + a soft C4 → a warm, open A-minor drone.
    for (const [freq, amp, detune] of [
      [110, 0.16, 0],
      [164.81, 0.12, 4],
      [261.63, 0.06, -3],
    ] as const) {
      const o = this.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq;
      o.detune.value = detune;
      const g = this.ctx.createGain();
      g.gain.value = amp;
      o.connect(g).connect(f);
      o.start();
    }

    // Slow filter sweep so the bed breathes instead of sitting static.
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.05;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 220;
    lfo.connect(lfoGain).connect(f.frequency);
    lfo.start();
  }

  // --- scheduling ----------------------------------------------------------

  private scheduler(): void {
    const ahead = this.ctx.currentTime + 0.2;
    while (this.nextNoteTime < ahead) {
      this.scheduleStep(this.step, this.nextNoteTime);
      this.nextNoteTime += STEP_DUR;
      this.step = (this.step + 1) % STEPS;
    }

    // Ease the smoothed intensity and re-balance the layer crossfade.
    this.current += (this.target - this.current) * 0.06;
    const t = this.ctx.currentTime;
    this.calmGain.gain.setTargetAtTime(0.9 - 0.55 * this.current, t, 0.4);
    this.tensionGain.gain.setTargetAtTime(this.current, t, 0.4);
    this.padGain.gain.setTargetAtTime(0.5 - 0.12 * this.current, t, 0.4);
  }

  private scheduleStep(step: number, t: number): void {
    // Calm melody: a gentle pentatonic wander on a sparse set of steps.
    if ((step === 0 || step === 6 || step === 10 || (step % 2 === 0 && Math.random() < 0.25)) && this.current < 0.97) {
      this.melodyIndex = Math.max(0, Math.min(PENTA.length - 1, this.melodyIndex + (Math.floor(Math.random() * 3) - 1)));
      this.pluck(PENTA[this.melodyIndex], t, this.calmGain, 0.14, 'triangle', 1.3);
    }

    // Tension only bothers to schedule once it's audible.
    if (this.current > 0.02) {
      // A driving bass pulse on the quarter notes, a mid octave on the offbeats.
      if (step % 4 === 0) this.bass(55, t, 0.16);
      else if (step % 4 === 2) this.bass(110, t, 0.1);
      // A dissonant minor-second shimmer for unease, in the back half of the loop.
      if (step === 8) this.pluck(233.08, t, this.tensionGain, 0.05, 'sawtooth', 0.9);
      if (step === 12 && Math.random() < 0.5) this.pluck(311.13, t, this.tensionGain, 0.05, 'sawtooth', 0.7);
    }
  }

  // --- voices --------------------------------------------------------------

  private pluck(freq: number, t: number, dest: AudioNode, peak: number, type: OscillatorType, dur: number): void {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private bass(freq: number, t: number, peak: number): void {
    const o = this.ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = freq;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 480;
    f.Q.value = 3;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.connect(f).connect(g).connect(this.tensionGain);
    o.start(t);
    o.stop(t + 0.55);
  }
}
