import { describe, expect, it } from 'vitest';
import { PENTATONIC } from '../../audio/notes';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import { advance, BEATS, botMove, canFinish, check, choose, conductorLayout, earlyDone, glowTarget, hint, listenAgain, makeRound, marksLit, MOTIFS, newRequests, newScore, PACES, PAD, select, signBot, submit, type BeatEvent, type PaceId, type Requests, type Round, type Score } from './logic';

const hop = MOTIFS[0];
/** Runs the clock in small frames until `n` more beats have sounded. */
function play(score: Score, n: number, dt = 1 / 60): { score: Score; events: BeatEvent[] } {
  const events: BeatEvent[] = [];
  let s = score;
  for (let guard = 0; events.length < n && guard < 100000; guard++) {
    const r = advance(s, dt, hop);
    s = r.score;
    events.push(...r.events);
  }
  return { score: s, events };
}

describe('Little Conductor motifs', () => {
  it('has three distinct four-beat tunes on the pentatonic, bass on 1 and 3 and the drum on every beat', () => {
    for (const m of MOTIFS) {
      expect(m.melody).toHaveLength(BEATS);
      for (const n of m.melody) expect(PENTATONIC).toContain(n);
      expect(Math.max(...m.melody) - Math.min(...m.melody)).toBeLessThan(12);
      expect(m.bass).toEqual([0, 2]);
      expect(m.drum).toEqual([0, 1, 2, 3]);
    }
    expect(new Set(MOTIFS.map((m) => m.melody.join())).size).toBe(3);
  });
});

describe('Little Conductor score clock', () => {
  it('stays silent until the first tap, then starts at once with nothing pending', () => {
    expect(advance(newScore(), 5, hop).events).toEqual([]);
    const s = select(newScore(), 'rabbit');
    expect(s.pending).toBeNull();
    const r = advance(s, 0, hop);
    expect(r.events.map((e) => [e.index, e.step, e.pace])).toEqual([[0, 0, 'rabbit']]);
  });

  it('plays the same notes in the same order at either pace; only the timing differs by 90/60', () => {
    const at = (pace: PaceId) => {
      let s = advance(select(newScore(), pace), 0, hop).score;
      const r = advance(s, 60 / PACES[pace] * 3 + 1e-6, hop);
      s = r.score;
      return r.events;
    };
    const slow = at('turtle'), fast = at('rabbit');
    expect(slow.map((e) => [e.step, e.melody, e.bass, e.drum])).toEqual(fast.map((e) => [e.step, e.melody, e.bass, e.drum]));
    slow.forEach((e, i) => expect(e.at).toBeCloseTo(fast[i].at * 90 / 60, 6));
  });

  it('never skips or repeats a beat, over 500 seeded runs of random taps and frame lengths', () => {
    for (let seed = 1; seed <= 500; seed++) {
      const rng = new Rng(seed);
      let s = select(newScore(), rng.pick(['turtle', 'rabbit'] as const));
      const events: BeatEvent[] = [];
      let lastPlayed = s.played;
      for (let i = 0; i < 300; i++) {
        if (rng.chance(0.1)) s = select(s, rng.pick(['turtle', 'rabbit'] as const));
        const dt = rng.chance(0.05) ? rng.range(0.5, 3.5) : rng.range(0.001, 0.05);
        const before = s;
        const r = advance(s, dt, hop);
        // A waiting change lands on the next beat, never before it.
        if (before.pending && r.events.length === 0) expect(r.score.pace).toBe(before.pace);
        if (before.pending && r.events.length > 0) expect(r.events[0].pace).toBe(before.pending);
        s = r.score;
        expect(s.played).toBeGreaterThanOrEqual(lastPlayed);
        lastPlayed = s.played;
        events.push(...r.events);
      }
      expect(events.map((e) => e.index)).toEqual(events.map((_, i) => i));
      expect(events.map((e) => e.step)).toEqual(events.map((_, i) => i % BEATS));
    }
  });

  it('lands a waiting change within one beat of the playing pace', () => {
    for (const from of ['turtle', 'rabbit'] as const) {
      const to: PaceId = from === 'turtle' ? 'rabbit' : 'turtle';
      for (const wait of [0.001, 0.3, 0.6, 0.66]) {
        let s = advance(select(newScore(), from), 0, hop).score;
        s = advance(s, wait, hop).score;
        s = select(s, to);
        const r = advance(s, 60 / PACES[from] + 1e-6, hop);
        expect(r.events[0]?.pace).toBe(to);
        expect(r.events[0].at).toBeLessThanOrEqual(60 / PACES[from] + 1e-6);
      }
    }
  });

  it('calls off a waiting change when the playing pad is tapped again', () => {
    let s = advance(select(newScore(), 'turtle'), 0, hop).score;
    s = select(select(s, 'rabbit'), 'turtle');
    expect(s.pending).toBeNull();
    expect(advance(s, 1.01, hop).events[0].pace).toBe('turtle');
  });

  it('listen again starts the tune from its first note without forgetting what was heard', () => {
    let { score } = play(select(newScore(), 'turtle'), 2);
    const heard = score.heard.turtle;
    score = listenAgain(score);
    expect(score.heard.turtle).toBe(heard);
    const r = play(score, 4);
    expect(r.events.map((e) => e.step)).toEqual([0, 1, 2, 3]);
  });
});

describe('Little Conductor heard gate', () => {
  it('level 1: a whole phrase at the pace she last chose, closed again by a change', () => {
    let { score } = play(select(newScore(), 'rabbit'), 3);
    expect(canFinish(score, 1)).toBe(false);
    expect(earlyDone(score, 1)).toBe('hear-whole');
    score = play(score, 1).score;
    expect(marksLit(score, 'rabbit')).toBe(4);
    expect(canFinish(score, 1)).toBe(true);
    score = select(score, 'turtle');
    expect(canFinish(score, 1)).toBe(false);
    score = play(score, 1).score;
    expect(score.pace).toBe('turtle');
    expect(marksLit(score, 'rabbit')).toBe(0);
    expect(canFinish(score, 1)).toBe(false);
    score = play(score, 3).score;
    expect(canFinish(score, 1)).toBe(true);
  });

  it('level 2: both ways heard whole, then the chosen one again since she chose it', () => {
    let { score } = play(select(newScore(), 'turtle'), 4);
    expect(score.heardEver.turtle).toBe(true);
    expect(canFinish(score, 2)).toBe(false);
    expect(earlyDone(score, 2)).toBe('hear-other');
    score = play(select(score, 'rabbit'), 4).score;
    expect(canFinish(score, 2)).toBe(true);
    score = select(score, 'turtle');
    expect(canFinish(score, 2)).toBe(false);
    score = play(score, 3).score;
    expect(canFinish(score, 2)).toBe(false);
    expect(earlyDone(score, 2)).toBe('hear-whole');
    score = play(score, 1).score;
    expect(canFinish(score, 2)).toBe(true);
  });

  it('listen again does not reset the gate', () => {
    let { score } = play(select(newScore(), 'turtle'), 4);
    score = listenAgain(score);
    expect(canFinish(score, 1)).toBe(true);
  });
});

describe('Little Conductor rounds and the bot', () => {
  it('seeds a motif and a three-friend band without the host bear, the same for the same seed', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 500; seed++) {
      const r = makeRound(new Rng(seed));
      seen.add(r.motif.id);
      expect(new Set(r.cast).size).toBe(3);
      expect(r.cast).not.toContain('bear');
      expect([...r.cast, r.listener]).not.toContain('pip');
      expect(r.cast).not.toContain(r.listener);
      expect(r.listener).not.toBe('bear');
      expect(makeRound(new Rng(seed))).toEqual(r);
    }
    expect(seen.size).toBe(3);
  });

  it('the bot plays turtle, then rabbit, then Done, and always reaches the gate', () => {
    for (const level of [1, 2]) {
      let s = newScore();
      const taps: string[] = [];
      for (let i = 0; i < 2000 && !taps.includes('done'); i++) {
        const move = botMove(s, level);
        if (move && (taps.at(-1) !== move)) {
          taps.push(move);
          if (move !== 'done') s = select(s, move);
        }
        s = advance(s, 1 / 30, hop).score;
      }
      expect(taps).toEqual(['turtle', 'rabbit', 'done']);
    }
  });
});

describe('Little Conductor layout', () => {
  const VIEWS: [number, number][] = [[1024, 768], [768, 1024], [1366, 768], [1194, 834]];
  const overlap = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) =>
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  const box = (d: { x: number; y: number; r: number }) => ({ x: d.x - d.r, y: d.y - d.r, w: 2 * d.r, h: 2 * d.r });
  for (const [pw, ph] of VIEWS)
    for (const level of [1, 2, 3])
      it(`keeps every target large, apart, on screen and clear of the pet at ${pw}×${ph}, level ${level}`, () => {
        const view = computeView(pw, ph);
        const l = conductorLayout(view, level);
        const targets = [l.pads.turtle, l.pads.rabbit, box(l.listen), box(l.done)];
        for (const t of targets) {
          expect(Math.min(t.w, t.h)).toBeGreaterThanOrEqual(100);
          expect(t.x).toBeGreaterThanOrEqual(0);
          expect(t.y).toBeGreaterThanOrEqual(0);
          expect(t.x + t.w).toBeLessThanOrEqual(view.w);
          expect(t.y + t.h).toBeLessThanOrEqual(view.h);
          // The pet's corner, bottom-left.
          expect(overlap(t, { x: 0, y: view.h - 220, w: 220, h: 220 })).toBe(false);
        }
        expect(l.pads.turtle.w).toBe(PAD);
        // The pads' marks sit 40 units below them; keep that clear of the stand and the buttons too.
        const withMarks = (r: typeof l.pads.turtle) => ({ ...r, h: r.h + 50 });
        for (let i = 0; i < targets.length; i++)
          for (let j = i + 1; j < targets.length; j++) expect(overlap(i < 2 ? withMarks(targets[i]) : targets[i], targets[j])).toBe(false);
        expect(overlap(l.stand, l.pads.turtle)).toBe(false);
        if (level < 3) {
          expect(l.sign).toBeUndefined();
          return;
        }
        // Level 3: the sign is on screen, clear of the bandstand, the pads (with their marks), the buttons and the pet.
        const sign = l.sign!;
        expect(sign.w).toBeGreaterThanOrEqual(200);
        expect(sign.x).toBeGreaterThanOrEqual(0);
        expect(sign.x + sign.w).toBeLessThanOrEqual(view.w);
        expect(sign.y + sign.h).toBeLessThanOrEqual(view.h);
        for (const t of [l.stand, withMarks(l.pads.turtle), withMarks(l.pads.rabbit), box(l.listen), box(l.done), { x: 0, y: view.h - 220, w: 220, h: 220 }])
          expect(overlap(sign, t)).toBe(false);
        // The listener stands under the sign, above the buttons.
        expect(l.listener!.y).toBeLessThan(l.listen.y - l.listen.r);
      });
});

describe('Little Conductor level 3 requests', () => {
  const round = (requests: [PaceId, PaceId]): Round => ({ ...makeRound(new Rng(1)), requests });
  const run = (rd: Round, taps: (PaceId | 'check' | 'hint')[]) => {
    let r: Requests = newRequests();
    for (const t of taps) {
      if (t === 'check') r = submit(r, rd).state;
      else if (t === 'hint') r = hint(r).state;
      else r = choose(r, t);
    }
    return r;
  };

  it('seeds two different requests, both orders and every motif, the same for the same seed', () => {
    const orders = new Set<string>();
    const motifs = new Set<string>();
    for (let seed = 1; seed <= 500; seed++) {
      const r = makeRound(new Rng(seed));
      expect(r.requests[0]).not.toBe(r.requests[1]);
      orders.add(r.requests.join());
      motifs.add(r.motif.id);
      expect(makeRound(new Rng(seed)).requests).toEqual(r.requests);
    }
    expect(orders.size).toBe(2);
    expect(motifs.size).toBe(3);
  });

  it('check is the truth table: right on the two matching cells, wrong on the other two', () => {
    const rd = round(['turtle', 'rabbit']);
    expect(check(rd, 0, 'turtle')).toBe(true);
    expect(check(rd, 0, 'rabbit')).toBe(false);
    expect(check(rd, 1, 'rabbit')).toBe(true);
    expect(check(rd, 1, 'turtle')).toBe(false);
    expect(check(rd, 0, null)).toBe(false);
  });

  it('a wrong Check keeps the pick; a Check with nothing picked changes nothing', () => {
    const rd = round(['turtle', 'rabbit']);
    const first = submit(newRequests(), rd);
    expect(first.result).toBe('pick-first');
    expect(first.state).toEqual(newRequests());
    const wrong = submit(choose(newRequests(), 'rabbit'), rd);
    expect(wrong.result).toBe('wrong');
    expect(wrong.state.choice).toBe('rabbit');
    expect(wrong.state.phrase).toBe(0);
  });

  it('rabbit, Check, turtle, Check, rabbit, Check: one miss, no hint, finished', () => {
    const r = run(round(['turtle', 'rabbit']), ['rabbit', 'check', 'turtle', 'check', 'rabbit', 'check']);
    expect(r).toMatchObject({ misses: 1, hints: 0, done: true });
  });

  it('two wrong Checks on a half light the requested pad once; asking again does not count it twice', () => {
    const rd = round(['rabbit', 'turtle']);
    let r = choose(newRequests(), 'turtle');
    expect(submit(r, rd).glow).toBe(false);
    r = submit(r, rd).state;
    const second = submit(r, rd);
    expect(second.glow).toBe(true);
    expect(glowTarget(rd, second.state)).toBe('rabbit');
    r = submit(second.state, rd).state;
    expect(r).toMatchObject({ misses: 3, hints: 1 });
    expect(hint(r).counted).toBe(false);
    r = submit(choose(r, glowTarget(rd, r)), rd).state;
    expect(r).toMatchObject({ phrase: 1, choice: null, missed: 0, hinted: false, hints: 1 });
    // A new half has its own hint.
    expect(hint(r).counted).toBe(true);
  });

  it('a requested hint counts once per half, and then two wrong Checks add nothing more', () => {
    const rd = round(['turtle', 'rabbit']);
    const r = run(rd, ['hint', 'hint', 'rabbit', 'check', 'check', 'turtle', 'check', 'rabbit', 'check']);
    expect(r).toMatchObject({ misses: 2, hints: 1, done: true });
  });

  it('the bot reads the sign, picks that pad and checks, finishing every seeded round with no misses', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const rd = makeRound(new Rng(seed));
      let r = newRequests();
      for (let i = 0; i < 10 && !r.done; i++) {
        const move = signBot(rd, r);
        if (move === 'check') r = submit(r, rd).state;
        else if (move) r = choose(r, move);
      }
      expect(r).toMatchObject({ done: true, misses: 0, hints: 0 });
    }
  });
});
