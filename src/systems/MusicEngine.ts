/**
 * MusicEngine — procedural adaptive score (DESIGN.md §15.2). No audio files. A
 * slow chord progression drives everything: a low pad drones the current chord,
 * a gentle arpeggio plays its tones (the melody — always in key, not random),
 * and a danger layer (driving bass on the chord root + a dissonant shimmer)
 * fades in with `intensity` while the calm arpeggio ducks back.
 *
 * The score is a small playlist of SONGS — each its own key, progression, tempo
 * and set of chiptune lead phrases. The engine plays through a song's phrases
 * (one per cycle), then segues to the next song, looping the playlist.
 *
 * Scheduling uses the standard WebAudio lookahead pattern: a coarse setInterval
 * timer queues note events a short way into the future, so playback stays
 * sample-accurate regardless of timer jitter.
 */

const STEPS = 32; // the full progression cycle (an eighth-note grid)
const STEPS_PER_CHORD = 8; // each chord lasts a bar
const BUS_GAIN = 0.6; // the whole score sits under the SFX

interface Chord {
  /** Low drone tones (root + fifth) for the pad. */
  pad: [number, number];
  /** Mid chord tones, ascending — the arpeggio/melody. */
  arp: [number, number, number, number];
  /** Low root for the danger bass pulse. */
  bass: number;
}

/** A lead-melody phrase over the 32-step cycle: [step, freq, dur] events. */
type Melody = [number, number, number][];

interface Song {
  /** For readability/debugging — the tune's working title. */
  name: string;
  /** Tempo (beats per minute); sets the eighth-note step length. */
  bpm: number;
  /** Four chords, one per bar, cycled across the 32 steps. */
  progression: Chord[];
  /** Rotating lead phrases; the engine plays one per cycle, then the next song. */
  melodies: Melody[];
}

// 1) "Thistledown" — the original warm folk tune in A minor: Am–F–C–G.
const THISTLEDOWN: Song = {
  name: 'Thistledown',
  bpm: 70,
  progression: [
    { pad: [110.0, 164.81], arp: [220.0, 261.63, 329.63, 440.0], bass: 55.0 }, // Am
    { pad: [87.31, 130.81], arp: [174.61, 220.0, 261.63, 349.23], bass: 43.65 }, // F
    { pad: [130.81, 196.0], arp: [261.63, 329.63, 392.0, 523.25], bass: 65.41 }, // C
    { pad: [98.0, 146.83], arp: [196.0, 246.94, 293.66, 392.0], bass: 49.0 }, // G
  ],
  melodies: [
    // gentle
    [
      [0, 659.25, 1.8], [6, 523.25, 1.0], // Am: E5 .. C5
      [8, 587.33, 1.8], [14, 440.0, 1.0], // F:  D5 .. A4
      [16, 659.25, 1.4], [20, 783.99, 1.4], // C: E5 G5
      [24, 587.33, 1.4], [28, 493.88, 1.6], // G: D5 B4
    ],
    // rising runs
    [
      [0, 440.0, 0.7], [2, 523.25, 0.7], [4, 659.25, 1.2], // Am: A4 C5 E5
      [8, 698.46, 0.7], [10, 587.33, 0.7], [12, 523.25, 1.2], // F: F5 D5 C5
      [16, 659.25, 0.7], [18, 783.99, 0.7], [20, 659.25, 1.2], // C: E5 G5 E5
      [24, 587.33, 0.7], [26, 493.88, 0.7], [28, 392.0, 1.4], // G: D5 B4 G4
    ],
    // sparse + high (a rest from the busier ones)
    [
      [0, 659.25, 2.6], // Am: E5
      [8, 523.25, 2.6], // F:  C5
      [16, 783.99, 2.6], // C: G5
      [24, 493.88, 1.2], [28, 587.33, 1.4], // G: B4 D5
    ],
    // playful descents
    [
      [0, 880.0, 0.7], [2, 783.99, 0.7], [4, 659.25, 0.7], [6, 523.25, 1.0], // Am: A5 G5 E5 C5
      [8, 440.0, 0.7], [10, 523.25, 0.7], [12, 698.46, 1.2], // F: A4 C5 F5
      [16, 783.99, 0.7], [18, 659.25, 0.7], [20, 523.25, 1.0], // C: G5 E5 C5
      [24, 493.88, 0.7], [26, 587.33, 0.7], [28, 783.99, 1.2], // G: B4 D5 G5
    ],
  ],
};

// 2) "Sunlit Square" — a brighter, livelier tune in C major: C–G–Am–F (I–V–vi–IV).
const SUNLIT: Song = {
  name: 'Sunlit Square',
  bpm: 78,
  progression: [
    { pad: [130.81, 196.0], arp: [261.63, 329.63, 392.0, 523.25], bass: 65.41 }, // C
    { pad: [98.0, 146.83], arp: [392.0, 493.88, 587.33, 783.99], bass: 49.0 }, // G
    { pad: [110.0, 164.81], arp: [440.0, 523.25, 659.25, 880.0], bass: 55.0 }, // Am
    { pad: [87.31, 130.81], arp: [349.23, 440.0, 523.25, 698.46], bass: 43.65 }, // F
  ],
  melodies: [
    // gentle, open
    [
      [0, 523.25, 1.8], [6, 659.25, 1.0], // C: C5 .. E5
      [8, 587.33, 1.8], [14, 493.88, 1.0], // G: D5 .. B4
      [16, 659.25, 1.4], [20, 880.0, 1.4], // Am: E5 A5
      [24, 698.46, 1.4], [28, 523.25, 1.6], // F: F5 C5
    ],
    // rising runs
    [
      [0, 392.0, 0.7], [2, 523.25, 0.7], [4, 659.25, 1.2], // C: G4 C5 E5
      [8, 493.88, 0.7], [10, 587.33, 0.7], [12, 783.99, 1.2], // G: B4 D5 G5
      [16, 440.0, 0.7], [18, 523.25, 0.7], [20, 659.25, 1.2], // Am: A4 C5 E5
      [24, 349.23, 0.7], [26, 523.25, 0.7], [28, 698.46, 1.4], // F: F4 C5 F5
    ],
    // sparse + high
    [
      [0, 783.99, 2.6], // C: G5
      [8, 587.33, 2.6], // G: D5
      [16, 659.25, 2.6], // Am: E5
      [24, 698.46, 1.2], [28, 880.0, 1.4], // F: F5 A5
    ],
  ],
};

// 3) "Mistfall" — a pensive, wandering tune in E minor: Em–C–G–D (i–VI–III–VII).
const MISTFALL: Song = {
  name: 'Mistfall',
  bpm: 64,
  progression: [
    { pad: [82.41, 123.47], arp: [329.63, 392.0, 493.88, 659.25], bass: 41.2 }, // Em
    { pad: [130.81, 196.0], arp: [261.63, 329.63, 392.0, 523.25], bass: 65.41 }, // C
    { pad: [98.0, 146.83], arp: [392.0, 493.88, 587.33, 783.99], bass: 49.0 }, // G
    { pad: [73.42, 110.0], arp: [293.66, 369.99, 440.0, 587.33], bass: 36.71 }, // D
  ],
  melodies: [
    // gentle, longing
    [
      [0, 493.88, 1.8], [6, 392.0, 1.0], // Em: B4 .. G4
      [8, 523.25, 1.8], [14, 659.25, 1.0], // C: C5 .. E5
      [16, 587.33, 1.4], [20, 783.99, 1.4], // G: D5 G5
      [24, 587.33, 1.4], [28, 440.0, 1.6], // D: D5 A4
    ],
    // rising runs
    [
      [0, 329.63, 0.7], [2, 392.0, 0.7], [4, 493.88, 1.2], // Em: E4 G4 B4
      [8, 523.25, 0.7], [10, 659.25, 0.7], [12, 783.99, 1.2], // C: C5 E5 G5
      [16, 587.33, 0.7], [18, 493.88, 0.7], [20, 392.0, 1.2], // G: D5 B4 G4
      [24, 440.0, 0.7], [26, 587.33, 0.7], [28, 369.99, 1.4], // D: A4 D5 F#4
    ],
    // sparse + high
    [
      [0, 659.25, 2.6], // Em: E5
      [8, 523.25, 2.6], // C: C5
      [16, 783.99, 2.6], // G: G5
      [24, 587.33, 1.2], [28, 440.0, 1.4], // D: D5 A4
    ],
  ],
};

const SONGS: Song[] = [THISTLEDOWN, SUNLIT, MISTFALL];

export class MusicEngine {
  private readonly ctx: AudioContext;
  private readonly bus: GainNode;
  private readonly padGain: GainNode;
  private readonly calmGain: GainNode;
  private readonly tensionGain: GainNode;
  private readonly melodyGain: GainNode;
  private readonly padOscs: OscillatorNode[] = [];

  private timer: number | null = null;
  private nextNoteTime = 0;
  private step = 0;
  private song: Song = SONGS[0];
  private songIndex = 0;
  private stepDur = 60 / SONGS[0].bpm / 2; // eighth note in seconds (per song tempo)
  private chord: Chord = SONGS[0].progression[0];
  private melodyVariant = 0;
  private firstCycle = true;

  /** Smoothed danger level driving the crossfade; eases toward `target`. */
  private current = 0;
  private target = 0;

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.bus = ctx.createGain();
    this.bus.gain.value = BUS_GAIN;
    this.bus.connect(destination);

    this.padGain = ctx.createGain();
    this.padGain.gain.value = 0.5;
    this.calmGain = ctx.createGain();
    this.calmGain.gain.value = 0.9;
    this.tensionGain = ctx.createGain();
    this.tensionGain.gain.value = 0;
    this.melodyGain = ctx.createGain();
    this.melodyGain.gain.value = 0.85;
    for (const g of [this.padGain, this.calmGain, this.tensionGain]) g.connect(this.bus);
    // Soften the square lead's high harmonics → a warm chiptune, not a harsh buzz.
    const melFilter = ctx.createBiquadFilter();
    melFilter.type = 'lowpass';
    melFilter.frequency.value = 2400;
    melFilter.Q.value = 0.6;
    this.melodyGain.connect(melFilter).connect(this.bus);
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

  /** Mute/unmute the score by riding the bus gain (scheduler keeps running). */
  setEnabled(on: boolean): void {
    this.bus.gain.setTargetAtTime(on ? BUS_GAIN : 0, this.ctx.currentTime, 0.05);
  }

  // --- the pad bed ---------------------------------------------------------

  private startPad(): void {
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 620;
    f.Q.value = 0.7;
    f.connect(this.padGain);

    // Two voices (root + fifth) retuned per chord — warm, open drone.
    for (const [freq, amp, detune] of [
      [this.chord.pad[0], 0.16, 0],
      [this.chord.pad[1], 0.12, 4],
    ] as const) {
      const o = this.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq;
      o.detune.value = detune;
      const g = this.ctx.createGain();
      g.gain.value = amp;
      o.connect(g).connect(f);
      o.start();
      this.padOscs.push(o);
    }

    // Slow filter sweep so the bed breathes instead of sitting static.
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.05;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 200;
    lfo.connect(lfoGain).connect(f.frequency);
    lfo.start();
  }

  /** Glide the pad voices to the new chord's root + fifth. */
  private applyChord(t: number): void {
    this.padOscs.forEach((o, i) => o.frequency.setTargetAtTime(this.chord.pad[i], t, 0.25));
  }

  // --- scheduling ----------------------------------------------------------

  private scheduler(): void {
    const ahead = this.ctx.currentTime + 0.2;
    while (this.nextNoteTime < ahead) {
      this.scheduleStep(this.step, this.nextNoteTime);
      this.nextNoteTime += this.stepDur;
      this.step = (this.step + 1) % STEPS;
    }

    // Ease the smoothed intensity and re-balance the layer crossfade.
    this.current += (this.target - this.current) * 0.06;
    const t = this.ctx.currentTime;
    this.calmGain.gain.setTargetAtTime(0.9 - 0.5 * this.current, t, 0.4);
    this.melodyGain.gain.setTargetAtTime(0.85 - 0.55 * this.current, t, 0.4);
    this.tensionGain.gain.setTargetAtTime(this.current, t, 0.4);
    this.padGain.gain.setTargetAtTime(0.5 - 0.1 * this.current, t, 0.4);
  }

  /**
   * Called at the top of each 32-step cycle. Rotate to the song's next lead
   * phrase; once it has played all of them, segue to the next song in the
   * playlist (which switches key, progression and tempo). The very first cycle
   * keeps phrase 0 so a fresh start opens on the tune's main theme.
   */
  private advanceCycle(): void {
    if (this.firstCycle) {
      this.firstCycle = false;
      return;
    }
    this.melodyVariant += 1;
    if (this.melodyVariant >= this.song.melodies.length) {
      this.songIndex = (this.songIndex + 1) % SONGS.length;
      this.song = SONGS[this.songIndex];
      this.stepDur = 60 / this.song.bpm / 2;
      this.melodyVariant = 0;
    }
  }

  private scheduleStep(step: number, t: number): void {
    // At the top of each cycle, advance the playlist: each song plays through its
    // phrases (one per cycle), then we segue to the next song (new key + tempo).
    if (step === 0) this.advanceCycle();

    // Advance the chord progression (and retune the pad) each bar.
    if (step % STEPS_PER_CHORD === 0) {
      const prog = this.song.progression;
      this.chord = prog[Math.floor(step / STEPS_PER_CHORD) % prog.length];
      this.applyChord(t);
    }

    // Harmony: an ascending arpeggio of the current chord, one tone per beat
    // (every other step) — always consonant, with clear forward motion.
    if (step % 2 === 0 && this.current < 0.97) {
      this.pluck(this.chord.arp[(step % STEPS_PER_CHORD) / 2], t, this.calmGain, 0.12, 'triangle', 1.1);
    }

    // Lead melody: the current song's rotating chiptune phrase, on a square voice
    // above the arpeggio. Recedes under danger.
    if (this.current < 0.85) {
      const note = this.song.melodies[this.melodyVariant].find((m) => m[0] === step);
      if (note) this.pluck(note[1], t, this.melodyGain, 0.08, 'square', note[2]);
    }

    // Danger layer — only scheduled once it's audible.
    if (this.current > 0.02) {
      if (step % 4 === 0) this.bass(this.chord.bass, t, 0.16); // pulse on the chord root
      else if (step % 4 === 2) this.bass(this.chord.bass * 2, t, 0.1);
      // A dissonant minor-second shimmer above the root, for unease.
      if (step % 16 === 8) this.pluck(this.chord.bass * 4.24, t, this.tensionGain, 0.05, 'sawtooth', 0.9);
    }
  }

  // --- voices --------------------------------------------------------------

  private pluck(freq: number, t: number, dest: AudioNode, peak: number, type: OscillatorType, dur: number): void {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.015);
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
