import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { bigSingerIndex, bigTouch, CHOICES, echoDots, echoRest, GAP_SECONDS, judgeEcho, LEVEL_IDS, makeQuestions, makeRhythms, MIN_APART, planFor, PLANS, ECHO_RHYTHMS as RHYTHMS, SINGERS, singerToTap, makeCast, songFor, CAST_SIZE, FAST_BEATS, SLOW_BEATS, TEMPO_SPAN, tileFor, type Gap, type Question, type Sound } from './logic';

/** Tap times for a rhythm, with each gap stretched by a factor (a child's wobble). */
const play = (r: Gap[], wobble: number[] = []) => {
  const t = [0];
  r.forEach((g, i) => t.push(t[i] + GAP_SECONDS[g] * (wobble[i] ?? 1)));
  return t;
};

describe('Sound Garden', () => {
  it('asks balanced questions with the right answers, never three alike in a row', () => {
    for (const plan of Object.values(PLANS)) {
      for (let seed = 1; seed <= 200; seed++) {
        const qs = makeQuestions(plan, new Rng(seed));
        if (plan.mode === 'play' || plan.mode === 'echo' || plan.mode === 'sing' || plan.mode === 'copy') {
          expect(qs).toHaveLength(0);
          continue;
        }
        expect(qs).toHaveLength(plan.rounds);
        for (const q of qs) expect(CHOICES[q.ask]).toContain(q.answer);
        qs.slice(2).forEach((q, i) => expect(q.answer === qs[i].answer && q.answer === qs[i + 1].answer).toBe(false));
      }
    }
  });

  it('accepts a wobbly echo but not the wrong rhythm or tap count', () => {
    for (const r of RHYTHMS) {
      expect(judgeEcho(r, play(r)), r.join('')).toBe(true);
      expect(judgeEcho(r, play(r, [1.25, 0.85, 1.2]))).toBe(true);
      expect(judgeEcho(r, play([...r, 'S']))).toBe(false);
    }
    expect(judgeEcho(['L', 'S'], play(['S', 'L']))).toBe(false);
    expect(judgeEcho(['S', 'S'], play(['S', 'L']))).toBe(false);
    expect(judgeEcho(['S'], [0, 3])).toBe(false);
  });

  it('offers twelve distinct rhythms, progressing to a four-gap last round with truthful visible spacing', () => {
    expect(RHYTHMS).toHaveLength(12);
    expect(new Set(RHYTHMS.map((r) => r.join(''))).size).toBe(12);
    const seen = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) {
      const rounds = makeRhythms(4, new Rng(seed));
      expect(rounds.map((r) => r.length)).toEqual([expect.any(Number), expect.any(Number), 3, 4]);
      expect(rounds[0].length).toBeLessThanOrEqual(2);
      expect(rounds[1].length).toBeLessThanOrEqual(2);
      expect(new Set(rounds.map((r) => r.join(''))).size).toBe(4);
      rounds.forEach((r) => seen.add(r.join('')));
      expect(makeRhythms(4, new Rng(seed))).toEqual(rounds);
    }
    expect(seen.size).toBe(12);
    for (const r of RHYTHMS) {
      const dots = echoDots(r);
      expect(dots).toHaveLength(r.length + 1);
      expect(dots[0]).toBe(0);
      r.forEach((g, i) => expect(dots[i + 1] - dots[i]).toBeCloseTo(GAP_SECONDS[g] * 100));
      expect(dots.at(-1)).toBeLessThanOrEqual(300);
    }
  });

  it('asks all three directions across seeded rounds and points the bot at the flat path too', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) for (const q of makeQuestions(PLANS[7], new Rng(seed))) {
      expect(q.ask).toBe('updownsame');
      seen.add(q.answer);
      expect(CHOICES[q.ask][tileFor(q)]).toBe(q.answer);
    }
    expect([...seen].sort()).toEqual(['down', 'same', 'up']);
  });

  it('touches every singer in free play, and the tile that shows the answer in the listening levels', () => {
    const free = PLANS[1];
    for (let seed = 1; seed <= 100; seed++) {
      const cast = makeCast(new Rng(seed));
      const heard = new Set(Array.from({ length: free.rounds }, (_, i) => singerToTap(cast, i)));
      expect([...heard].sort()).toEqual([...cast].sort());
    }
    for (const plan of Object.values(PLANS)) {
      for (let seed = 1; seed <= 100; seed++) {
        for (const q of makeQuestions(plan, new Rng(seed))) expect(CHOICES[q.ask][tileFor(q)]).toBe(q.answer);
      }
    }
  });

  it('echoes every rhythm with a hand that cannot tap faster than its own tap-and-return', () => {
    // 0.87 s is the ghost finger's least time between two taps on one spot; a somewhat slower hand (to 1.2 s, past which a long gap would pass the game's 2.2 s patience) gets the same echo.
    for (const minGap of [0.87, 1, 1.2]) {
      for (const r of RHYTHMS) {
        const taps = [0];
        r.forEach((g, i) => taps.push(taps[i] + minGap + echoRest(g, minGap)));
        expect(judgeEcho(r, taps), `${r.join('')} at ${minGap}`).toBe(true);
        // The longest wait stays under the game's two-second patience (it judges 2.2 s after the last tap if taps are missing).
        for (let i = 1; i < taps.length; i++) expect(taps[i] - taps[i - 1]).toBeLessThan(2.2);
      }
    }
    expect(echoRest('S', 0.87)).toBeLessThan(echoRest('L', 0.87));
  });

  it('keys plans by level ID and clamps unknown levels to the ladder', () => {
    expect(LEVEL_IDS).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    for (const id of LEVEL_IDS) expect(planFor(id)).toBe(PLANS[id]);
    expect(planFor(0)).toBe(PLANS[1]);
    expect(planFor(99)).toBe(PLANS[10]);
    expect(planFor(2).mode).toBe('highlow');
  });

  const questions = (seeds = 300) => {
    const out: Question[] = [];
    for (const plan of Object.values(PLANS)) for (let seed = 1; seed <= seeds; seed++) out.push(...makeQuestions(plan, new Rng(seed)));
    return out;
  };
  const steps = (s: Sound) => s.notes.map((n) => n.step);
  const voices = (s: Sound) => new Set(s.notes.map((n) => n.voice));

  it('plays every note on the pentatonic scale, in order, inside its span', () => {
    for (const q of questions()) {
      for (const s of Object.values(q.sounds)) {
        expect(s.notes.length).toBeGreaterThan(0);
        for (const n of s.notes) expect(Number.isInteger(n.step)).toBe(true);
        s.notes.slice(1).forEach((n, i) => expect(n.at).toBeGreaterThan(s.notes[i].at));
        expect(s.notes[0].at).toBe(0);
        expect(s.notes.at(-1)!.at).toBeLessThan(s.span);
      }
    }
  });

  it('makes the two answers of a question differ only in what is asked', () => {
    for (const q of questions()) {
      const [a, b] = CHOICES[q.ask].map((c) => q.sounds[c]);
      for (const c of CHOICES[q.ask]) {
        expect(voices(q.sounds[c])).toEqual(voices(a));
        expect(q.sounds[c].span).toBeCloseTo(a.span, 9);
      }
      if (q.ask === 'updownsame') {
        expect(new Set(steps(q.sounds.same)).size).toBe(1);
        expect(q.sounds.same.notes.map((n) => n.at)).toEqual(a.notes.map((n) => n.at));
        expect(q.sounds.same.notes.length).toBeGreaterThanOrEqual(3);
        expect(q.sounds.same.notes.length).toBeLessThanOrEqual(4);
      }
      expect(Object.keys(q.sounds).sort()).toEqual([...CHOICES[q.ask]].sort());
      // One instrument for the whole question, and the same span for both answers.
      expect(voices(a).size).toBe(1);
      expect([...voices(a)]).toEqual([...voices(b)]);
      expect(a.span).toBeCloseTo(b.span, 9);
      if (q.ask === 'highlow') {
        expect(a.notes.map((n) => n.at)).toEqual(b.notes.map((n) => n.at));
        expect(new Set(steps(a)).size).toBe(1);
        expect(new Set(steps(b)).size).toBe(1);
        // High is higher than low, by at least MIN_APART scale steps.
        expect(steps(a)[0] - steps(b)[0]).toBeGreaterThanOrEqual(MIN_APART);
      } else if (q.ask === 'fastslow') {
        // The same note; only the beat changes, fast twice as quick as slow.
        expect(new Set([...steps(a), ...steps(b)]).size).toBe(1);
        expect(a.notes.length).toBe(2 * b.notes.length);
        expect(a.notes[1].at * 2).toBeCloseTo(b.notes[1].at, 9);
      } else {
        expect(a.notes.map((n) => n.at)).toEqual(b.notes.map((n) => n.at));
        expect(steps(b)).toEqual([...steps(a)].reverse());
        expect(a.notes.length).toBeGreaterThanOrEqual(3);
        expect(a.notes.length).toBeLessThanOrEqual(5);
        steps(a).slice(1).forEach((s, i) => expect(s).toBeGreaterThan(steps(a)[i]));
      }
    }
  });

  it('varies the sounds from question to question, and a replay plays the same notes', () => {
    const qs = questions(60);
    for (const ask of ['highlow', 'fastslow', 'updown', 'updownsame'] as const) {
      const heard = new Set(qs.filter((q) => q.ask === ask).map((q) => JSON.stringify(q.sounds[q.answer])));
      expect(heard.size, ask).toBeGreaterThan(10);
    }
    // The sound is data on the question: the same seed builds the same notes.
    for (const plan of Object.values(PLANS)) expect(makeQuestions(plan, new Rng(7))).toEqual(makeQuestions(plan, new Rng(7)));
    const highs = new Set(qs.filter((q) => q.ask === 'highlow').map((q) => q.sounds.high.notes[0].step));
    const lows = new Set(qs.filter((q) => q.ask === 'highlow').map((q) => q.sounds.low.notes[0].step));
    expect(highs.size).toBeGreaterThan(3);
    expect(lows.size).toBeGreaterThan(3);
  });

  it('stands a seeded five of the six singers in the garden, every singer standing over a few rounds', () => {
    const seen = new Set<string>();
    const orders = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) {
      const cast = makeCast(new Rng(seed));
      expect(cast).toHaveLength(CAST_SIZE);
      expect(new Set(cast).size).toBe(CAST_SIZE);
      for (const s of cast) expect(SINGERS).toContain(s);
      cast.forEach((s) => seen.add(s));
      orders.add(cast.join());
      expect(makeCast(new Rng(seed))).toEqual(cast);
    }
    expect([...seen].sort()).toEqual([...SINGERS].sort());
    expect(orders.size).toBeGreaterThan(20);
  });

  it('has each singer sing its listening role: the bird high, the frog low, the bunny fast, the turtle slow', () => {
    for (let tap = 0; tap < 12; tap++) {
      for (const s of SINGERS) {
        const song = songFor(s, tap);
        expect(song.beats[0].at).toBe(0);
        for (const b of song.beats) expect(Number.isInteger(b.step)).toBe(true);
      }
      const bird = songFor('bird', tap).beats[0].step;
      const frog = songFor('frog', tap).beats[0].step;
      expect(bird - frog).toBeGreaterThanOrEqual(MIN_APART);
      expect(bird).toBeGreaterThanOrEqual(6);
      expect(frog).toBeLessThanOrEqual(2);
    }
    const gaps = (s: 'bunny' | 'turtle') => songFor(s, 0).beats.slice(1).map((b, i, rest) => b.at - (i ? rest[i - 1].at : 0));
    const bunny = songFor('bunny', 0).beats;
    const turtle = songFor('turtle', 0).beats;
    expect(bunny.length).toBeGreaterThan(turtle.length);
    for (const g of gaps('bunny')) expect(g).toBeCloseTo(TEMPO_SPAN / FAST_BEATS);
    for (const g of gaps('turtle')) expect(g).toBeCloseTo(TEMPO_SPAN / SLOW_BEATS);
    // Same span, more beats: the fast-or-slow level's cue, not a shorter clip.
    expect(bunny.length * (TEMPO_SPAN / FAST_BEATS)).toBeCloseTo(turtle.length * (TEMPO_SPAN / SLOW_BEATS));
  });
});

it('big friends change every four taps and all cast positions are reachable across the cycle', () => {
  expect(Array.from({ length: 12 }, (_, i) => bigSingerIndex(i, 5))).toEqual([0,0,0,0,1,1,1,1,2,2,2,2]);
  expect(new Set(Array.from({ length: 20 }, (_, i) => bigSingerIndex(i, 5))).size).toBe(5);
  expect(planFor(8)).toMatchObject({ mode: 'play', big: true, rounds: 12 });
});
it('big friend hears the view apart from corner buttons and the companion', () => {
  for (const [w, h] of [[1024,768], [1024,1365], [1365,768]]) {
    for (let x = -10; x <= w + 10; x += 10) for (let y = -10; y <= h + 10; y += 10) {
      expect(bigTouch(x, y, w, h)).toBe(x >= 0 && x <= w && y >= 0 && y <= h && !(y < 160 && (x < 180 || x > w - 180)) && !(x < 300 && y > h - 300));
    }
    expect(bigTouch(w / 2, h / 2, w, h)).toBe(true);
    expect(bigTouch(w - 10, h - 10, w, h)).toBe(true);
  }
});
