import { Rng } from '../engine/random';
import { audio } from './engine';
import { bell, marimba, noise, pluck, tone } from './instruments';
import { midiToHz, stepToMidi } from './notes';

export interface MusicStyle {
  bpm: number;
  /** One chord per bar, as MIDI notes; the first is the root. */
  chords: number[][];
  lead: 'bell' | 'marimba' | 'pluck' | 'none';
  /** Chance of a lead note on each eighth. */
  density: number;
  /** Lead range in pentatonic steps (0 = middle C). */
  range: [number, number];
  bass: boolean;
  pad: boolean;
  shaker: boolean;
  volume: number;
  seed: number;
}

const I = [60, 64, 67];
const IV = [53, 57, 60];
const V = [55, 59, 62];
const vi = [57, 60, 64];

/** Every region's loop is in C major pentatonic, so tap sounds always fit the music. */
export const STYLES = {
  hub: { bpm: 96, chords: [I, vi, IV, V], lead: 'bell', density: 0.32, range: [3, 10], bass: true, pad: true, shaker: false, volume: 0.5, seed: 11 },
  bubbles: { bpm: 104, chords: [I, IV, I, V], lead: 'pluck', density: 0.3, range: [4, 11], bass: true, pad: true, shaker: true, volume: 0.45, seed: 23 },
  jelly: { bpm: 92, chords: [I, IV, vi, V], lead: 'none', density: 0, range: [0, 0], bass: true, pad: true, shaker: true, volume: 0.4, seed: 5 },
  paint: { bpm: 76, chords: [I, IV, vi, IV], lead: 'bell', density: 0.14, range: [6, 12], bass: false, pad: true, shaker: false, volume: 0.38, seed: 41 },
  stickers: { bpm: 100, chords: [I, IV, V, I], lead: 'marimba', density: 0.3, range: [3, 9], bass: true, pad: false, shaker: true, volume: 0.42, seed: 8 },
  lullaby: { bpm: 66, chords: [I, IV, I, V], lead: 'bell', density: 0.6, range: [5, 12], bass: false, pad: true, shaker: false, volume: 0.42, seed: 3 },
} satisfies Record<string, MusicStyle>;

/** Generative background music: a short seeded melody over a chord loop, slowly mutating. */
class Music {
  private style: MusicStyle | null = null;
  private out: GainNode | null = null;
  private timer: number | undefined;
  private next = 0;
  private step = 0;
  private start = 0;
  private phrase: (number | null)[] = [];
  private rng = new Rng(1);

  play(style: MusicStyle) {
    const ctx = audio.ctx;
    if (!ctx || this.style === style) return;
    this.stop();
    this.style = style;
    this.rng = new Rng(style.seed);
    this.phrase = this.makePhrase(style);
    this.out = ctx.createGain();
    this.out.gain.setValueAtTime(0.0001, ctx.currentTime);
    this.out.gain.exponentialRampToValueAtTime(style.volume, ctx.currentTime + 1.2);
    this.out.connect(audio.musicOut);
    this.start = this.next = ctx.currentTime + 0.1;
    this.step = 0;
    this.timer = window.setInterval(() => this.schedule(), 25);
  }

  stop(fade = 0.6) {
    if (this.timer !== undefined) window.clearInterval(this.timer);
    this.timer = undefined;
    const ctx = audio.ctx;
    const out = this.out;
    if (ctx && out) {
      out.gain.cancelScheduledValues(ctx.currentTime);
      out.gain.setTargetAtTime(0.0001, ctx.currentTime, fade / 4);
      window.setTimeout(() => out.disconnect(), fade * 1000 + 800);
    }
    this.out = null;
    this.style = null;
  }

  /** 0..1 through the current beat, so things can bob along. */
  beat(): number {
    const ctx = audio.ctx;
    if (!ctx || !this.style) return 0;
    const x = (ctx.currentTime - this.start) / (60 / this.style.bpm);
    return x < 0 ? 0 : x % 1;
  }

  private schedule() {
    const ctx = audio.ctx;
    const s = this.style;
    const out = this.out;
    if (!ctx || !s || !out || ctx.state !== 'running') return;
    const eighth = 60 / s.bpm / 2;
    // After a long pause (backgrounded tab), skip ahead rather than playing a pile-up.
    if (this.next < ctx.currentTime - 0.5) this.next = ctx.currentTime + 0.05;
    while (this.next < ctx.currentTime + 0.15) {
      this.playEighth(ctx, s, out, this.step, this.next, eighth);
      this.next += eighth;
      this.step++;
    }
  }

  private playEighth(ctx: AudioContext, s: MusicStyle, out: GainNode, i: number, t: number, eighth: number) {
    const inBar = i % 8;
    const chord = s.chords[Math.floor(i / 8) % s.chords.length];
    if (s.pad && inBar === 0) {
      for (const m of chord) tone(ctx, out, 'triangle', midiToHz(m), t, 0.035, 0.3, eighth * 8 - 0.2);
    }
    if (s.bass && (inBar === 0 || inBar === 4)) tone(ctx, out, 'sine', midiToHz(chord[0] - 12), t, 0.22, 0.01, 0.45);
    if (s.shaker && inBar % 2 === 1) noise(ctx, out, t, 0.05, 0.03, { type: 'highpass', hz: 7000 });
    if (s.lead === 'none') return;
    if (i > 0 && i % 32 === 0) this.mutate(s);
    const note = this.phrase[i % this.phrase.length];
    if (note === null) return;
    const hz = midiToHz(stepToMidi(note));
    if (s.lead === 'bell') bell(ctx, out, t, hz, 0.16, 1.0);
    else if (s.lead === 'marimba') marimba(ctx, out, t, hz, 0.22);
    else pluck(ctx, out, t, hz, 0.16);
  }

  private makePhrase(s: MusicStyle): (number | null)[] {
    const [lo, hi] = s.range;
    let at = Math.round((lo + hi) / 2);
    return Array.from({ length: 16 }, (_, i) => {
      const strong = i % 4 === 0;
      if (!this.rng.chance(strong ? Math.min(1, s.density * 1.8) : s.density)) return null;
      at = Math.max(lo, Math.min(hi, at + this.rng.pick([-2, -1, -1, 0, 1, 1, 2])));
      return at;
    });
  }

  /** Nudge two notes every few bars so the loop never feels stuck. */
  private mutate(s: MusicStyle) {
    for (let k = 0; k < 2; k++) {
      const i = this.rng.int(0, this.phrase.length - 1);
      const was = this.phrase[i];
      if (was === null) continue;
      this.phrase[i] = Math.max(s.range[0], Math.min(s.range[1], was + this.rng.pick([-1, 1])));
    }
  }
}

export const music = new Music();
