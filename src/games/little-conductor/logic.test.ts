import { describe, expect, it } from 'vitest';
import { PENTATONIC } from '../../audio/notes';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  LEVELS,
  advance,
  BEATS,
  botMove,
  castKey,
  castPending,
  friendsBot,
  PART_IDS,
  SPOT,
  STAGES_AT_LEAST,
  toggleFriend,
  COMBO_IDS,
  comboOf,
  DIAL_PAD,
  dialsBot,
  canFinish,
  check,
  choose,
  conductorLayout,
  earlyDone,
  glowTarget,
  hint,
  listenAgain,
  makeRound,
  marksLit,
  MOTIFS,
  noteStep,
  newRequests,
  newScore,
  PACES,
  PAD,
  planFor,
  select,
  selectStrength,
  STRENGTH_IDS,
  STEADY_BPM,
  STRENGTH_GAIN,
  STRENGTH_OF,
  tempoOf,
  signBot,
  submit,
  type BeatEvent,
  type PartId,
  type PaceId,
  type StrengthId,
  type Requests,
  type Round,
  type Score,
  ASKS,
  changeBot,
  changedDial,
  glowAsk,
  hintChange,
  makeAsks,
  newChanges,
  setDial,
  submitChange,
  wrongDials,
  canFinishRevise,
  earlyReviseDone,
  finishRevise,
  isRevised,
  markReviseHeard,
  newRevise,
  REV_H,
  REV_W,
  reviseBot,
  reviseProperty,
  selectVersion,
  setReviseDial,
  undoRevision,
  type Ask,
  type Changes,
} from './logic';

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
  it('has six distinct four-beat tunes on the pentatonic, bass on 1 and 3 and the drum on every beat', () => {
    for (const m of MOTIFS) {
      expect(m.melody).toHaveLength(BEATS);
      for (const n of m.melody) expect(PENTATONIC).toContain(n);
      expect(Math.max(...m.melody) - Math.min(...m.melody)).toBeLessThan(12);
      expect(m.bass).toEqual([0, 2]);
      expect(m.drum).toEqual([0, 1, 2, 3]);
    }
    expect(MOTIFS).toHaveLength(6);
    expect(new Set(MOTIFS.map((m) => m.melody.join())).size).toBe(6);
    expect(new Set(MOTIFS.map((m) => m.id)).size).toBe(6);
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

  it.each(MOTIFS.map((m) => m.id))(
    '%s plays the same notes in the same order at either pace; only the timing differs by 90/60',
    (id) => {
      const motif = MOTIFS.find((m) => m.id === id)!;
      const at = (pace: PaceId) => {
        let s = advance(select(newScore(), pace), 0, motif).score;
        const r = advance(s, (60 / PACES[pace]) * 3 + 1e-6, motif);
        s = r.score;
        return r.events;
      };
      const slow = at('turtle'),
        fast = at('rabbit');
      expect(slow.map((e) => [e.step, e.melody, e.bass, e.drum])).toEqual(
        fast.map((e) => [e.step, e.melody, e.bass, e.drum]),
      );
      expect(slow.map((e) => e.melody)).toEqual(slow.map((e) => noteStep(motif.melody[e.step])));
      slow.forEach((e, i) => expect(e.at).toBeCloseTo((fast[i].at * 90) / 60, 6));
    },
  );

  it('never skips or repeats a beat, over 500 seeded runs of random taps and frame lengths', () => {
    for (let seed = 1; seed <= 500; seed++) {
      const rng = new Rng(seed);
      const motif = MOTIFS[seed % MOTIFS.length];
      let s = select(newScore(), rng.pick(['turtle', 'rabbit'] as const));
      const events: BeatEvent[] = [];
      let lastPlayed = s.played;
      for (let i = 0; i < 300; i++) {
        if (rng.chance(0.1)) s = select(s, rng.pick(['turtle', 'rabbit'] as const));
        const dt = rng.chance(0.05) ? rng.range(0.5, 3.5) : rng.range(0.001, 0.05);
        const before = s;
        const r = advance(s, dt, motif);
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
    expect(seen.size).toBe(MOTIFS.length);
  });

  it('the bot plays turtle, then rabbit, then Done, and always reaches the gate', () => {
    for (const level of [1, 2]) {
      let s = newScore();
      const taps: string[] = [];
      for (let i = 0; i < 2000 && !taps.includes('done'); i++) {
        const move = botMove(s, level);
        if (move && taps.at(-1) !== move) {
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
  const VIEWS: [number, number][] = [
    [1024, 768],
    [768, 1024],
    [1366, 768],
    [1194, 834],
  ];
  /** A phone held upright: 390 × 844, a taller 390 × 900, an iPad's 768 × 1024 and a squarer 430 × 700. */
  const UPRIGHT: [number, number][] = [
    [390, 844],
    [390, 900],
    [768, 1024],
    [430, 700],
  ];
  const overlap = (
    a: { x: number; y: number; w: number; h: number },
    b: { x: number; y: number; w: number; h: number },
  ) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  const box = (d: { x: number; y: number; r: number }) => ({
    x: d.x - d.r,
    y: d.y - d.r,
    w: 2 * d.r,
    h: 2 * d.r,
  });
  const cases = [
    ...VIEWS.map(([pw, ph]) => ({ pw, ph, upright: false })),
    ...UPRIGHT.map(([pw, ph]) => ({ pw, ph, upright: true })),
  ];
  for (const { pw, ph, upright } of cases)
    for (const level of [1, 2, 3])
      it(`keeps every target large, apart, on screen and clear of the pet at ${pw}×${ph}${upright ? ' upright' : ''}, level ${level}`, () => {
        const view = computeView(pw, ph, undefined, upright);
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
          for (let j = i + 1; j < targets.length; j++)
            expect(overlap(i < 2 ? withMarks(targets[i]) : targets[i], targets[j])).toBe(false);
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
        for (const t of [
          l.stand,
          withMarks(l.pads.turtle),
          withMarks(l.pads.rabbit),
          box(l.listen),
          box(l.done),
          { x: 0, y: view.h - 220, w: 220, h: 220 },
        ])
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
    expect(motifs.size).toBe(MOTIFS.length);
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

describe('Little Conductor level 4, soft or loud', () => {
  /** Plays a phrase at level 4 with one pad and returns its events. */
  const phrase = (pace: PaceId, motif = hop) => {
    let s = select(newScore(), pace);
    const events: BeatEvent[] = [];
    // A fixed frame length, so both pads see exactly the same clock.
    for (let i = 0; i < 2000 && events.length < BEATS; i++) {
      const r = advance(s, 1 / 60, motif, 'strength');
      s = r.score;
      events.push(...r.events);
    }
    return { score: s, events };
  };

  it('is a level of its own, for preschool and pre-K only', () => {
    expect(planFor(4).mode).toBe('strength');
    expect(planFor(4).name).toMatch(/small drum and a big drum/);
  });

  it.each(MOTIFS.map((m) => m.id))(
    '%s: pitch, order, bass, drum and timing are identical on both pads; only the gain differs',
    (id) => {
      const motif = MOTIFS.find((m) => m.id === id)!;
      const gentle = phrase('turtle', motif).events;
      const strong = phrase('rabbit', motif).events;
      expect(gentle).toHaveLength(BEATS);
      const strip = (e: BeatEvent) => ({ ...e, pace: undefined, gain: undefined });
      expect(gentle.map(strip)).toEqual(strong.map(strip));
      for (const e of gentle) expect(e.bpm).toBe(STEADY_BPM);
      for (const e of gentle) expect(e.gain).toBe(STRENGTH_GAIN.gentle);
      for (const e of strong) expect(e.gain).toBe(STRENGTH_GAIN.strong);
    },
  );

  it('keeps one steady pace for every pad, and never plays louder than the other levels', () => {
    expect(tempoOf('turtle', 'strength')).toBe(tempoOf('rabbit', 'strength'));
    expect(STRENGTH_OF).toEqual({ turtle: 'gentle', rabbit: 'strong' });
    expect(STRENGTH_GAIN.gentle).toBeGreaterThan(0.2);
    expect(STRENGTH_GAIN.gentle).toBeLessThan(STRENGTH_GAIN.strong);
    expect(STRENGTH_GAIN.strong).toBeLessThanOrEqual(1);
    // The other levels' events keep their own paces and full gain.
    const e = advance(select(newScore(), 'turtle'), 0, hop).events[0];
    expect([e.bpm, e.gain]).toEqual([PACES.turtle, 1]);
  });

  it('the gate follows the latest change: both heard whole, then the chosen one whole since she chose it', () => {
    let s = phrase('turtle').score;
    expect(canFinish(s, 4)).toBe(false);
    expect(earlyDone(s, 4)).toBe('hear-other');
    let r: { score: Score; events: BeatEvent[] } = { score: select(s, 'rabbit'), events: [] };
    for (let i = 0; i < 2000 && !canFinish(r.score, 4); i++) r = advance(r.score, 1 / 60, hop, 'strength');
    s = r.score;
    expect(canFinish(s, 4)).toBe(true);
    // A change closes the gate at once, and it opens again only after a whole phrase of the new strength.
    s = select(s, 'turtle');
    expect(canFinish(s, 4)).toBe(false);
    for (let i = 0; i < 2000 && !canFinish(s, 4); i++) s = advance(s, 1 / 60, hop, 'strength').score;
    expect(s.pace).toBe('turtle');
    expect(s.heard.turtle).toBeGreaterThanOrEqual(BEATS);
  });

  it('the ghost finger hears both drums and then finishes', () => {
    let s = newScore();
    for (let guard = 0; guard < 5000; guard++) {
      const m = botMove(s, 4);
      if (m === 'done') break;
      if (m) s = select(s, m);
      s = advance(s, 1 / 20, hop, 'strength').score;
    }
    expect(canFinish(s, 4)).toBe(true);
  });
});

describe('Little Conductor level 5, two ways at once', () => {
  /** Runs the clock in fixed frames until `stop` says so, returning the score and every event. */
  const run = (start: Score, stop: (s: Score) => boolean, motif = hop) => {
    let s = start;
    const events: BeatEvent[] = [];
    for (let i = 0; i < 5000 && !stop(s); i++) {
      const r = advance(s, 1 / 60, motif, 'dials');
      s = r.score;
      events.push(...r.events);
    }
    return { score: s, events };
  };
  const wholeAt = (s: Score) => s.pace !== null && s.comboHeard[comboOf(s.pace, s.strength)] >= BEATS;

  it('is a level of its own, for preschool, pre-K and school', () => {
    expect(planFor(5).mode).toBe('dials');
    expect(LEVELS.preschool?.max).toBe(5);
    expect(LEVELS.prek?.max).toBe(6);
    expect(LEVELS.school).toEqual({ min: 5, max: 8 });
    expect(LEVELS.toddler?.max).toBe(2);
  });

  it.each(MOTIFS.map((m) => m.id))(
    '%s: all four ways play the same notes in the same order; only the pace and the gain differ',
    (id) => {
      const motif = MOTIFS.find((m) => m.id === id)!;
      const strip = (e: BeatEvent) => ({
        ...e,
        pace: undefined,
        gain: undefined,
        bpm: undefined,
        at: undefined,
      });
      const ways = COMBO_IDS.map((combo) => {
        const [pace, strength] = combo.split('-') as [PaceId, StrengthId];
        const start = selectStrength(select(newScore(), pace), strength);
        return run(start, (s) => s.played >= BEATS, motif).events.slice(0, BEATS);
      });
      for (const w of ways) expect(w.map(strip)).toEqual(ways[0].map(strip));
      // The pace and the strength each do their own job.
      expect(ways.map((w) => [w[0].bpm, w[0].gain])).toEqual([
        [PACES.turtle, STRENGTH_GAIN.gentle],
        [PACES.turtle, STRENGTH_GAIN.strong],
        [PACES.rabbit, STRENGTH_GAIN.gentle],
        [PACES.rabbit, STRENGTH_GAIN.strong],
      ]);
      for (const w of ways) for (const e of w) expect(e.gain).toBeLessThanOrEqual(1);
    },
  );

  it('a first tap on the strength dial starts the band on the turtle, and a repeat tap calls off a change', () => {
    const started = selectStrength(newScore(), 'gentle');
    expect([started.pace, started.strength]).toEqual(['turtle', 'gentle']);
    const waiting = selectStrength(started, 'strong');
    expect(waiting.pendingStrength).toBe('strong');
    expect(selectStrength(waiting, 'gentle').pendingStrength).toBeNull();
    // Nothing changes until the next beat, and the two dials wait separately.
    const both = select(waiting, 'rabbit');
    expect([both.pending, both.pendingStrength]).toEqual(['rabbit', 'strong']);
    const r = advance(both, 0, hop, 'dials');
    expect(r.events).toHaveLength(1);
    expect([r.score.pace, r.score.strength, r.score.pending, r.score.pendingStrength]).toEqual([
      'rabbit',
      'strong',
      null,
      null,
    ]);
  });

  it('the gate follows the latest change of either dial, and needs two ways heard whole', () => {
    let s = run(select(newScore(), 'turtle'), wholeAt).score;
    expect(canFinish(s, 5)).toBe(false);
    expect(earlyDone(s, 5)).toBe('hear-other');
    // Changing the strength closes the gate at once, and it opens after a whole phrase of the new way.
    s = selectStrength(s, 'gentle');
    expect(canFinish(s, 5)).toBe(false);
    s = run(s, (x) => canFinish(x, 5)).score;
    expect(canFinish(s, 5)).toBe(true);
    expect([s.pace, s.strength]).toEqual(['turtle', 'gentle']);
    // So does changing the pace: the way she is in starts again from nothing.
    s = select(s, 'rabbit');
    expect(canFinish(s, 5)).toBe(false);
    s = advance(s, 1.1, hop, 'dials').score;
    expect(s.comboHeard[comboOf('rabbit', 'gentle')]).toBeLessThan(BEATS);
    expect(s.comboHeard[comboOf('rabbit', 'gentle')]).toBeGreaterThan(0);
    expect(canFinish(s, 5)).toBe(false);
    s = run(s, (x) => canFinish(x, 5)).score;
    expect(canFinish(s, 5)).toBe(true);
    // Not every way has to be heard: three of four never were.
    expect(COMBO_IDS.filter((c) => s.comboEver[c])).toHaveLength(3);
    expect(COMBO_IDS.filter((c) => !s.comboEver[c])).toEqual(['rabbit-strong']);
  });

  it('one way heard whole, however long it plays, never opens the gate', () => {
    const s = run(select(newScore(), 'rabbit'), () => false, hop).score;
    expect(s.played).toBeGreaterThan(100);
    expect(canFinish(s, 5)).toBe(false);
  });

  it('the ghost finger hears two ways and then finishes', () => {
    let s = newScore();
    let moves = 0;
    for (let guard = 0; guard < 5000; guard++) {
      const m = dialsBot(s, 5);
      if (m === 'done') break;
      if (m) {
        moves++;
        s = m.dial === 'pace' ? select(s, m.id) : selectStrength(s, m.id);
      }
      s = advance(s, 1 / 20, hop, 'dials').score;
    }
    expect(canFinish(s, 5)).toBe(true);
    expect(moves).toBe(2);
  });

  const UPRIGHT_VIEWS: [number, number, boolean][] = [
    [1024, 768, false],
    [768, 1024, false],
    [1366, 768, false],
    [1194, 834, false],
    [390, 844, true],
    [390, 900, true],
    [768, 1024, true],
    [430, 700, true],
  ];
  const overlap = (
    a: { x: number; y: number; w: number; h: number },
    b: { x: number; y: number; w: number; h: number },
  ) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  it.each(UPRIGHT_VIEWS)(
    'lays the four pads, hearing mark and buttons out large, apart, on screen and clear of the pet at %i×%i (upright %s)',
    (pw, ph, upright) => {
      const view = computeView(pw, ph, undefined, upright);
      const l = conductorLayout(view, 5);
      const disc = (d: { x: number; y: number; r: number }) => ({
        x: d.x - d.r,
        y: d.y - d.r,
        w: 2 * d.r,
        h: 2 * d.r,
      });
      const pads = [l.pads.turtle, l.pads.rabbit, l.strengths!.gentle, l.strengths!.strong];
      const targets = [...pads, disc(l.listen), disc(l.done)];
      const all = [...targets, ...l.cells!];
      expect(l.cells).toHaveLength(COMBO_IDS.length);
      expect(STRENGTH_IDS).toHaveLength(2);
      for (const t of targets) expect(Math.min(t.w, t.h)).toBeGreaterThanOrEqual(100);
      for (const p of pads) expect(p.w).toBe(DIAL_PAD);
      for (const t of all) {
        expect(t.x).toBeGreaterThanOrEqual(0);
        expect(t.y).toBeGreaterThanOrEqual(0);
        expect(t.x + t.w).toBeLessThanOrEqual(view.w);
        expect(t.y + t.h).toBeLessThanOrEqual(view.h);
        expect(overlap(t, { x: 0, y: view.h - 220, w: 220, h: 220 })).toBe(false);
        expect(overlap(t, l.stand)).toBe(false);
      }
      for (let i = 0; i < all.length; i++)
        for (let j = i + 1; j < all.length; j++) expect(overlap(all[i], all[j])).toBe(false);
    },
  );
});

describe('Little Conductor level 6, invite a friend', () => {
  const motif = MOTIFS[0];
  const run = (score: ReturnType<typeof newScore>, secs: number) => advance(score, secs, motif, 'friends');
  const beat = 60 / STEADY_BPM;

  it('is a pre-K and school level that holds one steady pace', () => {
    expect(planFor(6).mode).toBe('friends');
    expect(LEVELS.prek?.max).toBe(6);
    expect(LEVELS.school?.max).toBe(8);
    expect(LEVELS.preschool?.max).toBe(5);
    expect(tempoOf('turtle', 'friends')).toBe(STEADY_BPM);
    expect(tempoOf('rabbit', 'friends')).toBe(STEADY_BPM);
  });

  it('stands silent until the first tap, which brings that friend in at once', () => {
    expect(run(newScore(), 5).events).toEqual([]);
    const s = toggleFriend(newScore(), 'bass');
    expect(s.cast).toEqual({ tune: false, bass: true, beat: false });
    expect(castPending(s)).toBe(false);
    expect(run(s, beat * 0.01).events).toHaveLength(1);
  });

  it('lands every invitation and goodbye on a whole beat, never mid-note', () => {
    let s = toggleFriend(newScore(), 'tune');
    s = run(s, beat * 1.4).score;
    s = toggleFriend(s, 'beat');
    expect(s.cast.beat).toBe(false);
    expect(castPending(s)).toBe(true);
    const before = run(s, 0.001);
    expect(before.events).toHaveLength(0);
    expect(before.score.cast.beat).toBe(false);
    const after = run(s, beat);
    const landed = after.events.find((e) => e.drum);
    expect(landed).toBeDefined();
    // The friend plays from the beat the change reached: the whole step, never a part of one.
    expect(Number.isInteger(landed!.index)).toBe(true);
    expect(after.score.cast.beat).toBe(true);
    expect(castPending(after.score)).toBe(false);
  });

  it('calls a waiting change off when the friend is tapped again', () => {
    let s = run(toggleFriend(newScore(), 'tune'), beat * 1.2).score;
    s = toggleFriend(s, 'bass');
    expect(s.pendingCast.bass).toBe(true);
    s = toggleFriend(s, 'bass');
    expect(s.pendingCast.bass).toBeNull();
    expect(castPending(s)).toBe(false);
  });

  it('keeps the tune whole: the same notes in order whoever is in, never skipped or repeated', () => {
    let s = toggleFriend(newScore(), 'tune');
    const all: BeatEvent[] = [];
    const taps: PartId[] = ['bass', 'beat', 'tune', 'bass', 'beat', 'tune'];
    for (let i = 0; i < 24; i++) {
      if (i % 4 === 1) s = toggleFriend(s, taps[Math.floor(i / 4)]);
      const r = run(s, beat);
      s = r.score;
      all.push(...r.events);
    }
    all.forEach((e, i) => {
      expect(e.index).toBe(i);
      expect(e.step).toBe(i % BEATS);
      expect(e.melody).toBe(noteStep(motif.melody[i % BEATS]));
      expect(e.bpm).toBe(STEADY_BPM);
      expect(e.gain).toBe(1);
    });
  });

  it('plays only the parts of the friends who are in, and an empty stage counts its beats silently', () => {
    for (const part of PART_IDS) {
      const s = toggleFriend(newScore(), part);
      const { events } = run(s, beat * 3.5);
      expect(events).toHaveLength(4);
      for (const e of events) {
        expect(e.lead).toBe(part === 'tune');
        expect(e.bass && part !== 'bass').toBe(false);
        expect(e.drum && part !== 'beat').toBe(false);
      }
      expect(events.some((e) => (part === 'bass' ? e.bass : part === 'beat' ? e.drum : e.lead))).toBe(true);
    }
    // Nobody in: a friend leaves and the clock runs on, silent.
    let s = run(toggleFriend(newScore(), 'tune'), beat * 1.2).score;
    s = toggleFriend(s, 'tune');
    const quiet = run(s, beat * 3);
    expect(quiet.events.length).toBeGreaterThanOrEqual(2);
    const silent = quiet.events.filter((e) => !e.lead && !e.bass && !e.drum);
    expect(silent.length).toBeGreaterThan(0);
    expect(new Set(quiet.events.map((e) => e.index)).size).toBe(quiet.events.length);
  });

  it('keeps Done dim until a stage was heard whole and at least two stages were compared, and an empty stage never finishes', () => {
    let s = toggleFriend(newScore(), 'tune');
    expect(canFinish(s, 6)).toBe(false);
    s = run(s, beat * 2.5).score;
    expect(canFinish(s, 6)).toBe(false);
    expect(earlyDone(s, 6)).toBe('hear-whole');
    s = run(s, beat).score;
    expect(canFinish(s, 6)).toBe(false);
    expect(earlyDone(s, 6)).toBe('hear-other');
    s = toggleFriend(s, 'bass');
    expect(canFinish(s, 6)).toBe(false);
    s = run(s, beat * 6).score;
    expect(Object.keys(s.castEver).length).toBeGreaterThanOrEqual(STAGES_AT_LEAST);
    expect(canFinish(s, 6)).toBe(true);
    // A change waiting closes the gate; an empty stage cannot finish.
    expect(canFinish(toggleFriend(s, 'beat'), 6)).toBe(false);
    let e = toggleFriend(toggleFriend(s, 'tune'), 'bass');
    e = run(e, beat * 6).score;
    expect(e.cast).toEqual({ tune: false, bass: false, beat: false });
    expect(canFinish(e, 6)).toBe(false);
    expect(castKey(e.cast)).toBe('000');
    expect(e.castEver['000']).toBeUndefined();
  });

  it('never counts a miss: the ghost finger invites two friends and then taps Done', () => {
    let s = newScore();
    let taps = 0;
    for (let i = 0; i < 80; i++) {
      const m = friendsBot(s, 6);
      if (m === 'done') break;
      if (m) {
        s = toggleFriend(s, m.friend);
        taps++;
      }
      s = run(s, beat / 2).score;
    }
    expect(canFinish(s, 6)).toBe(true);
    expect(taps).toBe(2);
  });

  it.each([
    [1024, 768, false],
    [768, 1024, false],
    [1366, 768, false],
    [1194, 834, false],
    [390, 844, true],
    [390, 900, true],
    [768, 1024, true],
    [430, 700, true],
  ] as [number, number, boolean][])(
    'lays three large spotlights under the friends, clear of the buttons and the pet at %i×%i (upright %s)',
    (pw, ph, upright) => {
      const view = computeView(pw, ph, undefined, upright);
      const l = conductorLayout(view, 6);
      const box = (d: { x: number; y: number; r: number }) => ({
        x: d.x - d.r,
        y: d.y - d.r,
        w: 2 * d.r,
        h: 2 * d.r,
      });
      const spots = l.spots!;
      expect(spots).toHaveLength(3);
      const all = [...spots, box(l.listen), box(l.done)];
      const hits = (a: (typeof all)[0], b: (typeof all)[0]) =>
        a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
      for (const t of all) {
        expect(Math.min(t.w, t.h)).toBeGreaterThanOrEqual(100);
        expect(t.x).toBeGreaterThanOrEqual(0);
        expect(t.y).toBeGreaterThanOrEqual(0);
        expect(t.x + t.w).toBeLessThanOrEqual(view.w);
        expect(t.y + t.h).toBeLessThanOrEqual(view.h);
        expect(hits(t, { x: 0, y: view.h - 220, w: 220, h: 220 })).toBe(false);
        expect(hits(t, l.stand)).toBe(false);
      }
      for (const sp of spots) expect(sp.w).toBe(SPOT);
      for (let i = 0; i < all.length; i++)
        for (let j = i + 1; j < all.length; j++) expect(hits(all[i], all[j])).toBe(false);
    },
  );
});

describe('Little Conductor level 7, one change', () => {
  const seeds = Array.from({ length: 60 }, (_, i) => i + 1);
  const asksOf = (seed: number) => makeAsks(new Rng(seed));
  const ids = (a: Ask) => `${a.pace}-${a.strength}`;
  const set = (c: Changes, a: Ask): Changes => setDial(setDial(c, 'pace', a.pace), 'strength', a.strength);

  it('asks for two ways that differ in exactly one property, over every seed', () => {
    const changed = new Set<string>();
    for (const seed of seeds) {
      const asks = asksOf(seed);
      const same = (asks[0].pace === asks[1].pace ? 1 : 0) + (asks[0].strength === asks[1].strength ? 1 : 0);
      expect(same).toBe(1);
      changed.add(changedDial(asks));
    }
    expect([...changed].sort()).toEqual(['pace', 'strength']);
  });

  it('can start from every way to play and is satisfiable by one pad pair', () => {
    const firsts = new Set(seeds.map((seed) => ids(asksOf(seed)[0])));
    expect(firsts.size).toBe(ASKS.length);
    for (const ask of ASKS) expect(wrongDials(ask, set(newChanges(), ask))).toEqual([]);
  });

  it('is a truth table: a Check is right exactly when both dials match, and names only a wrong property', () => {
    const asks = asksOf(3);
    const ask = asks[0];
    const other = (a: Ask): Ask => ({
      pace: a.pace === 'turtle' ? 'rabbit' : 'turtle',
      strength: a.strength === 'gentle' ? 'strong' : 'gentle',
    });
    const o = other(ask);
    expect(submitChange(newChanges(), asks).result).toBe('pick-first');
    expect(submitChange(setDial(newChanges(), 'pace', ask.pace), asks).result).toBe('pick-first');
    const paceWrong = submitChange(set(newChanges(), { ...ask, pace: o.pace }), asks);
    expect([paceWrong.result, paceWrong.wrong, paceWrong.state.misses]).toEqual(['wrong', 'pace', 1]);
    const strengthWrong = submitChange(set(newChanges(), { ...ask, strength: o.strength }), asks);
    expect([strengthWrong.result, strengthWrong.wrong]).toEqual(['wrong', 'strength']);
    // Both wrong: the pace is named first, and the pick stays so she can compare it with the sign.
    const both = submitChange(set(newChanges(), o), asks);
    expect([both.wrong, both.state.pace, both.state.strength]).toEqual(['pace', o.pace, o.strength]);
    expect(submitChange(set(newChanges(), ask), asks).result).toBe('match');
  });

  it('turns to the second half, clearing the dials, and finishes after the second match', () => {
    const asks = asksOf(5);
    const first = submitChange(set(newChanges(), asks[0]), asks);
    expect([first.result, first.state.phrase, first.state.pace, first.state.strength]).toEqual([
      'match',
      1,
      null,
      null,
    ]);
    const last = submitChange(set(first.state, asks[1]), asks);
    expect([last.result, last.state.done, last.state.misses, last.state.hints]).toEqual([
      'finished',
      true,
      0,
      0,
    ]);
    expect(submitChange(last.state, asks).result).toBe('finished');
  });

  it('lights one hint on the first wrong dial after two wrong Checks, and counts it once per half', () => {
    const asks = asksOf(7);
    const ask = asks[0];
    const wrongStrength = set(newChanges(), {
      ...ask,
      strength: ask.strength === 'gentle' ? 'strong' : 'gentle',
    });
    const one = submitChange(wrongStrength, asks);
    expect(one.glow).toBe(false);
    const two = submitChange(one.state, asks);
    expect([two.glow, two.state.hints, two.state.misses]).toEqual([true, 1, 2]);
    expect(glowAsk(ask, two.state)).toEqual({ dial: 'strength', id: ask.strength });
    const three = submitChange(two.state, asks);
    expect([three.glow, three.state.hints]).toEqual([false, 1]);
    expect(hintChange(three.state).counted).toBe(false);
    // The pause sheet's hint before any pick glows the pace pad, and the half's counted hint is spent.
    const early = hintChange(newChanges());
    expect([early.counted, early.state.hints]).toEqual([true, 1]);
    expect(glowAsk(ask, newChanges())).toEqual({ dial: 'pace', id: ask.pace });
  });

  it('is finished by the ghost finger over every seed, with no misses or hints', () => {
    for (const seed of seeds) {
      const asks = asksOf(seed);
      let c = newChanges();
      for (let guard = 0; guard < 20 && !c.done; guard++) {
        const move = changeBot(asks, c);
        if (move === null) break;
        if (move === 'check') c = submitChange(c, asks).state;
        else c = setDial(c, move.dial, move.id);
      }
      expect([c.done, c.misses, c.hints]).toEqual([true, 0, 0]);
    }
  });

  it('is a school-only level, and the plan names it', () => {
    expect(LEVELS.school?.max).toBe(8);
    expect(LEVELS.prek?.max).toBe(6);
    expect(planFor(7).mode).toBe('change');
  });

  const VIEWS7: [number, number, boolean][] = [
    [1024, 768, false],
    [768, 1024, false],
    [1366, 768, false],
    [1194, 834, false],
    [390, 844, true],
    [390, 900, true],
    [768, 1024, true],
    [430, 700, true],
  ];
  const overlap = (
    a: { x: number; y: number; w: number; h: number },
    b: { x: number; y: number; w: number; h: number },
  ) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  it.each(VIEWS7)(
    'lays the four pads, sign, listener and buttons out large and clear at %i×%i (upright %s)',
    (pw, ph, upright) => {
      const view = computeView(pw, ph, undefined, upright);
      const l = conductorLayout(view, 7);
      const disc = (d: { x: number; y: number; r: number }) => ({
        x: d.x - d.r,
        y: d.y - d.r,
        w: 2 * d.r,
        h: 2 * d.r,
      });
      const pads = [l.pads.turtle, l.pads.rabbit, l.strengths!.gentle, l.strengths!.strong];
      const targets = [...pads, disc(l.listen), disc(l.done)];
      expect(l.cells).toBeUndefined();
      for (const t of targets) expect(Math.min(t.w, t.h)).toBeGreaterThanOrEqual(100);
      const sign = l.sign!;
      const all = [...targets, sign];
      for (const t of all) {
        expect(t.x).toBeGreaterThanOrEqual(0);
        expect(t.y).toBeGreaterThanOrEqual(0);
        expect(t.x + t.w).toBeLessThanOrEqual(view.w);
        expect(t.y + t.h).toBeLessThanOrEqual(view.h);
        expect(overlap(t, { x: 0, y: view.h - 220, w: 220, h: 220 })).toBe(false);
        expect(overlap(t, l.stand)).toBe(false);
      }
      for (let i = 0; i < all.length; i++)
        for (let j = i + 1; j < all.length; j++) expect(overlap(all[i], all[j])).toBe(false);
      expect(l.listener!.y).toBeLessThan(l.listen.y - l.listen.r);
    },
  );
});

describe('Little Conductor level 8, revise for a listener', () => {
  const seeds = Array.from({ length: 60 }, (_, i) => i + 1);

  it('prepares two distinct versions, and every chosen revision differs from the original in that property', () => {
    for (const seed of seeds) {
      const r0 = newRevise(new Rng(seed));
      expect(r0.versions[0]).not.toEqual(r0.versions[1]);
      for (const idx of [0, 1] as const) {
        const base = selectVersion(r0, idx);
        const orig = base.versions[idx];
        expect(isRevised(base)).toBe(false);
        const revPace = reviseProperty(base, 'pace');
        expect(revPace.current.pace).not.toBe(orig.pace);
        expect(revPace.current.strength).toBe(orig.strength);
        expect(isRevised(revPace)).toBe(true);
        const revStrength = reviseProperty(base, 'strength');
        expect(revStrength.current.strength).not.toBe(orig.strength);
        expect(revStrength.current.pace).toBe(orig.pace);
        expect(isRevised(revStrength)).toBe(true);
      }
    }
  });

  it('undo restores the active original and closes the revision gate', () => {
    let r = newRevise(new Rng(11));
    r = markReviseHeard(r);
    r = markReviseHeard(selectVersion(r, 1));
    expect(r.heardVersions).toEqual([true, true]);
    const orig = r.versions[1];
    r = reviseProperty(r, 'pace');
    r = reviseProperty(r, 'strength');
    r = markReviseHeard(r);
    expect(isRevised(r)).toBe(true);
    expect(canFinishRevise(r)).toBe(true);
    r = undoRevision(r);
    expect(r.current).toEqual(orig);
    expect(isRevised(r)).toBe(false);
    expect(r.heardRevision).toBe(false);
    expect(canFinishRevise(r)).toBe(false);
    expect(earlyReviseDone(r)).toBe('pick-revision');
  });

  it('requires both prepared versions, a deliberate change, and hearing the revision whole before Done opens', () => {
    let r = newRevise(new Rng(4));
    expect(canFinishRevise(r)).toBe(false);
    expect(earlyReviseDone(r)).toBe('hear-versions');
    r = markReviseHeard(r);
    expect(earlyReviseDone(r)).toBe('hear-versions');
    // Revising before hearing version 2 still keeps Done gated on hearing both versions.
    r = reviseProperty(r, 'pace');
    r = markReviseHeard(r);
    expect(canFinishRevise(r)).toBe(false);
    expect(earlyReviseDone(r)).toBe('hear-versions');
    // Hearing version 2 clears the revision, then changing & hearing the revision opens Done.
    r = markReviseHeard(selectVersion(r, 1));
    expect(earlyReviseDone(r)).toBe('pick-revision');
    r = setReviseDial(r, 'strength', r.versions[1].strength === 'gentle' ? 'strong' : 'gentle');
    expect(earlyReviseDone(r)).toBe('hear-revision');
    expect(canFinishRevise(r)).toBe(false);
    r = markReviseHeard(r);
    expect(earlyReviseDone(r)).toBeNull();
    expect(canFinishRevise(r)).toBe(true);
    expect(finishRevise(r).done).toBe(true);
  });

  it('voices both pace and strength in revise mode', () => {
    const gentle = advance(
      { ...select(newScore(), 'turtle'), strength: 'gentle' },
      1.1,
      MOTIFS[0],
      'revise',
    ).events;
    const strong = advance(
      { ...select(newScore(), 'rabbit'), strength: 'strong' },
      1.1,
      MOTIFS[0],
      'revise',
    ).events;
    expect(gentle[0].bpm).toBe(PACES.turtle);
    expect(gentle[0].gain).toBe(STRENGTH_GAIN.gentle);
    expect(strong[0].bpm).toBe(PACES.rabbit);
    expect(strong[0].gain).toBe(STRENGTH_GAIN.strong);
  });

  it('is finished by the ghost finger over every seed after hearing both versions and the revision', () => {
    for (const seed of seeds) {
      let r = newRevise(new Rng(seed));
      for (let guard = 0; guard < 10 && !r.done; guard++) {
        const move = reviseBot(r);
        if (move === null) break;
        if (move === 'done') r = finishRevise(r);
        else if (move === 'listen') r = markReviseHeard(r);
        else if (move.kind === 'version') r = markReviseHeard(selectVersion(r, move.index));
        else r = markReviseHeard(setReviseDial(r, move.dial, move.id));
      }
      expect(r.done).toBe(true);
      expect(r.heardVersions).toEqual([true, true]);
      expect(isRevised(r)).toBe(true);
      expect(r.heardRevision).toBe(true);
    }
  });

  it('is a school-only level at 8 and the plan names it', () => {
    expect(LEVELS.school).toEqual({ min: 5, max: 8 });
    expect(LEVELS.prek?.max).toBe(6);
    expect(planFor(8).mode).toBe('revise');
  });

  const VIEWS8: [number, number, boolean][] = [
    [1024, 768, false],
    [768, 1024, false],
    [1366, 768, false],
    [1194, 834, false],
    [390, 844, true],
    [390, 900, true],
    [768, 1024, true],
    [430, 700, true],
  ];
  const overlap = (
    a: { x: number; y: number; w: number; h: number },
    b: { x: number; y: number; w: number; h: number },
  ) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  it.each(VIEWS8)(
    'lays the four pads, version buttons, undo, sign, listener and buttons out large and clear at %i×%i (upright %s)',
    (pw, ph, upright) => {
      const view = computeView(pw, ph, undefined, upright);
      const l = conductorLayout(view, 8);
      const disc = (d: { x: number; y: number; r: number }) => ({
        x: d.x - d.r,
        y: d.y - d.r,
        w: 2 * d.r,
        h: 2 * d.r,
      });
      const pads = [l.pads.turtle, l.pads.rabbit, l.strengths!.gentle, l.strengths!.strong];
      const rev = [...l.versions!, l.undo!];
      for (const b of rev) expect([b.w, b.h]).toEqual([REV_W, REV_H]);
      const targets = [...pads, ...rev, disc(l.listen), disc(l.done)];
      expect(l.cells).toBeUndefined();
      for (const t of targets) expect(Math.min(t.w, t.h)).toBeGreaterThanOrEqual(100);
      const all = [...targets, l.sign!];
      for (const t of all) {
        expect(t.x).toBeGreaterThanOrEqual(0);
        expect(t.y).toBeGreaterThanOrEqual(0);
        expect(t.x + t.w).toBeLessThanOrEqual(view.w);
        expect(t.y + t.h).toBeLessThanOrEqual(view.h);
        expect(overlap(t, { x: 0, y: view.h - 220, w: 220, h: 220 })).toBe(false);
        expect(overlap(t, l.stand)).toBe(false);
      }
      for (let i = 0; i < all.length; i++)
        for (let j = i + 1; j < all.length; j++) expect(overlap(all[i], all[j])).toBe(false);
      expect(l.listener!.y).toBeLessThan(l.listen.y - l.listen.r);
    },
  );
});
