import { audio } from './engine';
import { bell, marimba, noise, tone, voiced } from './instruments';
import { stepHz } from './notes';

export type AnimalSound = 'moo' | 'quack' | 'oink' | 'meow' | 'woof' | 'growl' | 'hop';

/** A few cents of random detune so repeated sounds don't grate. */
const jitter = (cents = 20) => Math.pow(2, ((Math.random() * 2 - 1) * cents) / 1200);

function out() {
  const ctx = audio.ctx;
  return ctx ? { ctx, dest: audio.sfxOut, t: ctx.currentTime } : null;
}

/** Every sound effect in the game. Pitched ones take pentatonic steps (0 = middle C). */
export const sfx = {
  /** A bubble's plip: a quick rising chirp with a splash. */
  pop(step = 7) {
    const o = out();
    if (!o) return;
    const hz = stepHz(step) * jitter();
    tone(o.ctx, o.dest, 'sine', hz, o.t, 0.45, 0.004, 0.13, hz * 2.2);
    noise(o.ctx, o.dest, o.t, 0.06, 0.18, { type: 'bandpass', hz: 2600, q: 1.5 });
  },

  bell(step: number, gain = 0.3) {
    const o = out();
    if (o) bell(o.ctx, o.dest, o.t, stepHz(step), gain);
  },

  marimba(step: number, gain = 0.45) {
    const o = out();
    if (o) marimba(o.ctx, o.dest, o.t, stepHz(step), gain);
  },

  /** A springy bounce, for a gentle "not that one". */
  boing() {
    const o = out();
    if (!o) return;
    const osc = tone(o.ctx, o.dest, 'triangle', 170 * jitter(), o.t, 0.3, 0.01, 0.35, 330);
    const lfo = o.ctx.createOscillator();
    const depth = o.ctx.createGain();
    lfo.frequency.value = 14;
    depth.gain.value = 25;
    lfo.connect(depth).connect(osc.frequency);
    lfo.start(o.t);
    lfo.stop(o.t + 0.4);
  },

  /** Little rising-and-falling chirps. */
  giggle() {
    const o = out();
    if (!o) return;
    const base = 620 * jitter(60);
    for (let i = 0; i < 5; i++) {
      const t = o.t + i * 0.085;
      const hz = base * (1 + 0.08 * Math.sin(i * 1.7));
      tone(o.ctx, o.dest, 'sine', hz, t, 0.16, 0.01, 0.06, hz * 1.35);
    }
  },

  sparkle() {
    const o = out();
    if (!o) return;
    [10, 11, 12, 13].forEach((s, i) => bell(o.ctx, o.dest, o.t + i * 0.05, stepHz(s), 0.08, 0.5));
  },

  whoosh() {
    const o = out();
    if (o) noise(o.ctx, o.dest, o.t, 0.35, 0.22, { type: 'bandpass', hz: 400, q: 2, sweepTo: 2400 });
  },

  squish() {
    const o = out();
    if (!o) return;
    tone(o.ctx, o.dest, 'sine', 300 * jitter(), o.t, 0.35, 0.005, 0.16, 120);
    noise(o.ctx, o.dest, o.t, 0.1, 0.1, { type: 'lowpass', hz: 900 });
  },

  /** Rising arpeggio for a finished round. */
  tada() {
    const o = out();
    if (!o) return;
    [5, 7, 9, 10].forEach((s, i) => bell(o.ctx, o.dest, o.t + i * 0.1, stepHz(s), 0.22, 0.9));
    [10, 12, 14].forEach((s) => bell(o.ctx, o.dest, o.t + 0.42, stepHz(s), 0.16, 1.6));
  },

  /** A soft UI tap. */
  tick() {
    const o = out();
    if (o) tone(o.ctx, o.dest, 'sine', 900, o.t, 0.12, 0.002, 0.05);
  },

  /** Cartoon animal voices, all synthesized. */
  animal(kind: AnimalSound) {
    const o = out();
    if (!o) return;
    const { ctx, dest, t } = o;
    const j = jitter(40);
    switch (kind) {
      case 'moo':
        voiced(ctx, dest, t, 0.95, [150 * j, 125 * j, 105 * j], [380, 760], 0.5, { vibrato: 3 });
        break;
      case 'quack':
        [0, 0.2].forEach((d) => voiced(ctx, dest, t + d, 0.16, [520 * j, 430 * j], [1100, 2000], 0.45));
        break;
      case 'oink':
        [0, 0.22].forEach((d) => {
          voiced(ctx, dest, t + d, 0.17, [300 * j, 230 * j], [650, 1300], 0.4);
          noise(ctx, dest, t + d, 0.12, 0.08, { type: 'bandpass', hz: 900, q: 2 });
        });
        break;
      case 'meow':
        voiced(ctx, dest, t, 0.6, [520 * j, 780 * j, 480 * j], [600, 1500], 0.4, { formantTo: [1100, 1900] });
        break;
      case 'woof':
        [0, 0.24].forEach((d) => {
          noise(ctx, dest, t + d, 0.06, 0.2, { type: 'lowpass', hz: 1400 });
          voiced(ctx, dest, t + d, 0.15, [240 * j, 150 * j], [520, 1100], 0.55);
        });
        break;
      case 'growl':
        voiced(ctx, dest, t, 0.55, [120 * j, 105 * j, 95 * j], [480, 900], 0.35, { vibrato: 14 });
        break;
      case 'hop':
        tone(ctx, dest, 'sine', 300, t, 0.3, 0.005, 0.18, 700);
        tone(ctx, dest, 'sine', 360, t + 0.18, 0.25, 0.005, 0.16, 820);
        break;
    }
  },

  splash() {
    const o = out();
    if (!o) return;
    noise(o.ctx, o.dest, o.t, 0.45, 0.28, { type: 'lowpass', hz: 3000, sweepTo: 500 });
    [0, 0.06, 0.13].forEach((d, i) => tone(o.ctx, o.dest, 'sine', 500 + i * 180, o.t + d, 0.15, 0.003, 0.08, 1100 + i * 200));
  },

  /** A clean little squeak, rising with `step`. */
  squeak(step = 8) {
    const o = out();
    if (!o) return;
    const hz = stepHz(step) * jitter(30);
    tone(o.ctx, o.dest, 'sine', hz, o.t, 0.12, 0.01, 0.09, hz * 1.25);
  },

  /** Something solid dropping into a box. */
  clunk() {
    const o = out();
    if (!o) return;
    tone(o.ctx, o.dest, 'sine', 140, o.t, 0.5, 0.003, 0.22, 70);
    noise(o.ctx, o.dest, o.t, 0.08, 0.15, { type: 'lowpass', hz: 700 });
  },

  /** A sleepy descending hum. */
  yawn() {
    const o = out();
    if (!o) return;
    const f = o.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 1100;
    f.connect(o.dest);
    tone(o.ctx, f, 'sawtooth', 420, o.t, 0.07, 0.25, 1.0, 190);
    setTimeout(() => f.disconnect(), 1800);
  },
};
