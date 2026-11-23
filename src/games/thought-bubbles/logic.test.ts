import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { SCRIPT } from '../../content/voice-script';
import {
  actualPlace,
  answerOf,
  answersOf,
  beatsOf,
  bubbleAt,
  DIFFERENT_PATTERNS,
  FIRST_TWO,
  firstUnfilled,
  HOME_W,
  isDifferent,
  lastSeen,
  LEVELS,
  planFor,
  SAME_PATTERNS,
  TWO_PATTERNS,
  TWO_TEMPLATES,
  twoRound,
  twoStory,
  believedPlace,
  BUBBLE_H,
  BUBBLE_MARGIN,
  BUBBLE_W,
  cueAngle,
  CARD_H,
  CARD_W,
  clueOf,
  compile,
  FIRST_LOOK,
  glowFor,
  isAbove,
  LOOK_TEMPLATES,
  lookAnswer,
  lookStory,
  PET_H,
  PET_W,
  PLACES,
  pawDistance,
  REASONS,
  regionRect,
  rectToScreen,
  REPLAY_R,
  roundFor,
  SLOTS,
  STAGE_H,
  STAGE_W,
  Tally,
  thirdPlace,
  THINGS,
  thoughtLayout,
  WANT_STORIES,
  WHY_STORIES,
  type Box,
  type Place,
  type Story,
  type TwoStory,
  candidatesOf,
  couldTell,
  firstMissed,
  FIRST_TELL,
  oneTellerTellings,
  partsOf,
  tellerOf,
  tellersOf,
  tellEvents,
  TELL_PATTERNS,
  TELL_REDRAWS,
  tellPositions,
  tellRound,
  type Friend,
  type TellPattern,
  type TellStory,
  PART_GAP,
  PART_INSET,
  PART_W,
} from './logic';

const seeds = Array.from({ length: 300 }, (_, i) => i + 1);
const VIEWS = [
  { w: 1024, h: 768 },
  { w: 768, h: 1024 },
  { w: 1194, h: 834 },
  { w: 834, h: 1194 },
];

describe('belief model', () => {
  it('away with one move believes the start place', () => {
    const ev = compile(
      ['bear', 'duck'],
      [
        { kind: 'put', who: 'bear', thing: 'ball', to: 'redBox' },
        { kind: 'leave', who: 'bear', to: 'outside' },
        { kind: 'move', who: 'duck', thing: 'ball', from: 'redBox', to: 'shelf' },
        { kind: 'back', who: 'bear' },
      ],
    );
    expect(believedPlace(ev, 'bear', 'ball')).toBe('redBox');
    expect(actualPlace(ev, 'ball')).toBe('shelf');
  });
  it('watching from the window believes the end place', () => {
    const ev = compile(
      ['bear', 'duck'],
      [
        { kind: 'put', who: 'bear', thing: 'ball', to: 'redBox' },
        { kind: 'leave', who: 'bear', to: 'window' },
        { kind: 'move', who: 'duck', thing: 'ball', from: 'redBox', to: 'shelf' },
        { kind: 'back', who: 'bear' },
      ],
    );
    expect(believedPlace(ev, 'bear', 'ball')).toBe('shelf');
  });
  it('two moves, first seen and second not, give the middle place', () => {
    const ev = compile(
      ['bear', 'duck'],
      [
        { kind: 'put', who: 'bear', thing: 'ball', to: 'redBox' },
        { kind: 'move', who: 'duck', thing: 'ball', from: 'redBox', to: 'blueBasket' },
        { kind: 'leave', who: 'bear', to: 'outside' },
        { kind: 'move', who: 'duck', thing: 'ball', from: 'blueBasket', to: 'shelf' },
        { kind: 'back', who: 'bear' },
      ],
    );
    const b = believedPlace(ev, 'bear', 'ball');
    expect(b).toBe('blueBasket');
    expect(b).not.toBe('redBox');
    expect(b).not.toBe(actualPlace(ev, 'ball'));
  });
  it('two moves both unseen give the start place', () => {
    const ev = compile(
      ['bear', 'duck'],
      [
        { kind: 'put', who: 'bear', thing: 'ball', to: 'redBox' },
        { kind: 'leave', who: 'bear', to: 'outside' },
        { kind: 'move', who: 'duck', thing: 'ball', from: 'redBox', to: 'blueBasket' },
        { kind: 'move', who: 'duck', thing: 'ball', from: 'blueBasket', to: 'shelf' },
        { kind: 'back', who: 'bear' },
      ],
    );
    expect(believedPlace(ev, 'bear', 'ball')).toBe('redBox');
  });
  it('an owner who sees everything believes the actual place', () => {
    const ev = compile(
      ['bear', 'duck'],
      [
        { kind: 'put', who: 'bear', thing: 'ball', to: 'redBox' },
        { kind: 'move', who: 'duck', thing: 'ball', from: 'redBox', to: 'blueBasket' },
        { kind: 'move', who: 'duck', thing: 'ball', from: 'blueBasket', to: 'shelf' },
      ],
    );
    expect(believedPlace(ev, 'bear', 'ball')).toBe('shelf');
    expect(believedPlace(ev, 'bear', 'ball')).toBe(actualPlace(ev, 'ball'));
  });
});

describe('level 2 compile', () => {
  it('every template, kind and place assignment is valid', () => {
    for (const t of LOOK_TEMPLATES)
      for (const kind of ['away', 'watching'] as const)
        for (const start of PLACES)
          for (const end of PLACES) {
            if (start === end) continue;
            const s = lookStory(t, kind, start, end);
            expect(s.events).toHaveLength(4);
            expect(s.events[0]).toMatchObject({ kind: 'put', to: start });
            expect(s.events[0].saw).toContain(t.owner);
            const mv = s.events[2];
            expect(mv).toMatchObject({ kind: 'move', from: start, to: end });
            expect(mv.saw.includes(t.owner)).toBe(kind === 'watching');
            expect(actualPlace(s.events, t.thing)).toBe(end);
            const ans = lookAnswer(s);
            expect(ans === start).toBe(kind === 'away');
            expect(ans).toBe(kind === 'away' ? start : end);
            expect(ans).not.toBe(thirdPlace(s));
            expect(thirdPlace(s)).not.toBe(start);
            expect(thirdPlace(s)).not.toBe(end);
          }
  });
  it('the authored first round holds both kinds', () => {
    expect(FIRST_LOOK.map((s) => s.kind)).toEqual(['away', 'watching', 'away']);
  });
});

describe('level 2 rounds', () => {
  it('three stories, both kinds, every position, every place; deterministic', () => {
    const posKinds = [new Set<string>(), new Set<string>(), new Set<string>()];
    const answers = new Set<string>();
    for (const seed of seeds) {
      const r = roundFor(2, new Rng(seed), false);
      expect(r).toHaveLength(3);
      const kinds = r.map((s) => (s.level === 2 ? s.look.kind : ''));
      expect(kinds).toContain('away');
      expect(kinds).toContain('watching');
      expect(new Set(r.map((s) => s.level === 2 && s.look.template.id)).size).toBe(3);
      r.forEach((s, i) => {
        if (s.level !== 2) throw new Error('level');
        posKinds[i].add(s.look.kind);
        answers.add(lookAnswer(s.look));
        expect([...s.cards].sort()).toEqual([...PLACES].sort());
        expect(s.cards).toContain(answerOf(s));
        expect(s.look.start).not.toBe(s.look.end);
      });
      expect(JSON.stringify(roundFor(2, new Rng(seed), false))).toBe(JSON.stringify(r));
    }
    for (const p of posKinds) expect([...p].sort()).toEqual(['away', 'watching']);
    expect([...answers].sort()).toEqual([...PLACES].sort());
  });
  it('the first round is the authored table', () => {
    const r = roundFor(2, new Rng(5), true);
    expect(r.map((s) => (s.level === 2 ? s.look : null))).toEqual(FIRST_LOOK);
    expect(r.map((s) => lookAnswer((s as Extract<Story, { level: 2 }>).look))).toEqual([
      'redBox',
      'redBox',
      'blueBasket',
    ]);
  });
});

describe('level 1 stories', () => {
  it('cued thing is among the items, near the reach; distractors are well off it', () => {
    for (const w of WANT_STORIES) {
      expect(w.items.filter((i) => i.thing === w.cued)).toHaveLength(1);
      expect(cueAngle(w, w.cued)).toBeLessThanOrEqual(10);
      expect(w.items).toHaveLength(3);
      for (const it of w.items)
        if (it.thing !== w.cued)
          expect(cueAngle(w, it.thing), `${w.id} ${it.thing}`).toBeGreaterThanOrEqual(35);
    }
  });
  it('decoy rule', () => {
    const nearer = WANT_STORIES.filter((w) =>
      w.items.some((i) => i.thing !== w.cued && pawDistance(w, i.thing) < pawDistance(w, w.cued)),
    );
    expect(nearer.length).toBeGreaterThanOrEqual(4);
    expect(WANT_STORIES.some(isAbove)).toBe(true);
    expect(WANT_STORIES.some((w) => !isAbove(w))).toBe(true);
  });
  it('rounds: three distinct cued things, cards are the items', () => {
    for (const seed of seeds)
      for (const first of [false, true]) {
        const r = roundFor(1, new Rng(seed), first);
        expect(r).toHaveLength(3);
        expect(new Set(r.map((s) => answerOf(s))).size).toBe(3);
        for (const s of r) {
          if (s.level !== 1) throw new Error('level');
          expect([...s.cards].sort()).toEqual(s.want.items.map((i) => i.thing).sort());
          expect(s.cards).toContain(s.want.cued);
        }
      }
  });
});

describe('level 3 stories', () => {
  it('reasons and regions', () => {
    for (const w of WHY_STORIES) {
      expect(new Set(w.reasons).size).toBe(3);
      expect(w.reasons).toContain(w.supported);
      expect(w.regions.filter((r) => r.supports === w.supported)).toHaveLength(1);
      for (const r of w.regions) if (r.supports) expect(r.supports).toBe(w.supported);
      expect(
        w.regions.some((r) => r.supports && w.reasons.includes(r.supports) && r.supports !== w.supported),
      ).toBe(false);
      expect(clueOf(w).supports).toBe(w.supported);
      const boxes = w.regions.map(regionRect);
      boxes.forEach((b, i) => {
        expect(b.w).toBeGreaterThanOrEqual(120);
        expect(b.h).toBeGreaterThanOrEqual(120);
        expect(b.x).toBeGreaterThanOrEqual(0);
        expect(b.y).toBeGreaterThanOrEqual(0);
        expect(b.x + b.w).toBeLessThanOrEqual(STAGE_W);
        expect(b.y + b.h).toBeLessThanOrEqual(STAGE_H);
        boxes.slice(i + 1).forEach((c) => {
          const apart = b.x + b.w <= c.x || c.x + c.w <= b.x || b.y + b.h <= c.y || c.y + c.h <= b.y;
          expect(apart, `${w.id} regions overlap`).toBe(true);
        });
      });
    }
  });
  it('rounds: three distinct reasons-stories with answer among cards', () => {
    for (const seed of seeds) {
      const r = roundFor(3, new Rng(seed), false);
      expect(new Set(r.map((s) => s.level === 3 && s.why.id)).size).toBe(3);
      for (const s of r) {
        if (s.level !== 3) throw new Error('level');
        expect([...s.cards].sort()).toEqual([...s.why.reasons].sort());
        expect(s.cards).toContain(s.why.supported);
      }
    }
  });
});

describe('accounting', () => {
  it('a wrong card counts one miss; two on a story give one hint', () => {
    const t = new Tally();
    expect(t.wrong()).toBe(false);
    expect(t.wrong()).toBe(true);
    expect(t.wrong()).toBe(false);
    expect(t.misses).toBe(3);
    expect(t.hints).toBe(1);
    t.newStory();
    expect(t.wrong()).toBe(false);
    expect(t.misses).toBe(4);
    expect(t.hints).toBe(1);
  });
  it('free taps count nothing; the third gives one hint once per story', () => {
    const t = new Tally();
    expect(t.freeTap()).toBe(false);
    expect(t.freeTap()).toBe(false);
    expect(t.misses).toBe(0);
    expect(t.hints).toBe(0);
    expect(t.freeTap()).toBe(true);
    expect(t.freeTap()).toBe(false);
    expect(t.hints).toBe(1);
    t.newStory();
    t.freeTap();
    t.freeTap();
    expect(t.freeTap()).toBe(true);
    expect(t.hints).toBe(2);
    expect(t.misses).toBe(0);
  });
  it('show me hints once per stage and Replay never touches the tally', () => {
    const t = new Tally();
    expect(t.showMe('watch')).toBe(false);
    expect(t.showMe('card')).toBe(true);
    expect(t.showMe('card')).toBe(false);
    expect(t.wrong()).toBe(false);
    expect(t.wrong()).toBe(false);
    expect(t.hints).toBe(1);
    expect(t.misses).toBe(2);
  });
  it('misses never block the right answer', () => {
    for (const seed of seeds.slice(0, 50))
      for (const level of [1, 2, 3]) {
        const t = new Tally();
        for (const s of roundFor(level, new Rng(seed), false)) {
          t.newStory();
          for (let i = 0; i < 5; i++) t.wrong();
          expect(s.cards).toContain(answerOf(s));
          expect(glowFor(s, 'card')).toEqual({ card: answerOf(s) });
        }
      }
  });
  it('always choosing the actual place misses every away story', () => {
    for (const seed of seeds) {
      for (const s of roundFor(2, new Rng(seed), false)) {
        if (s.level !== 2) throw new Error('level');
        const actual = actualPlace(s.look.events, s.look.template.thing);
        expect(actual === answerOf(s)).toBe(s.look.kind === 'watching');
        if (s.look.kind === 'away') expect(actual).not.toBe(lookAnswer(s.look));
      }
    }
  });
});

describe('hints lead somewhere', () => {
  it('glowFor gives the right card, then the clue region', () => {
    for (const seed of seeds.slice(0, 60))
      for (const level of [1, 2, 3])
        for (const s of roundFor(level, new Rng(seed), seed % 2 === 0)) {
          expect(glowFor(s, 'card')).toEqual({ card: answerOf(s) });
          expect(glowFor(s, 'watch')).toBeNull();
          expect(glowFor(s, 'done')).toBeNull();
          if (s.level === 3) expect(glowFor(s, 'point')).toEqual({ region: clueOf(s.why).id });
          else expect(glowFor(s, 'point')).toBeNull();
        }
  });
});

const inside = (b: Box, v: { w: number; h: number }) =>
  b.x >= 0 && b.y >= 0 && b.x + b.w <= v.w && b.y + b.h <= v.h;
const overlap = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

describe('layout', () => {
  for (const v of VIEWS) {
    it(`fits ${v.w}x${v.h}`, () => {
      const l = thoughtLayout(v);
      expect(l.stage.scale).toBeGreaterThanOrEqual(0.85);
      const stageBox: Box = {
        x: l.stage.x,
        y: l.stage.y,
        w: STAGE_W * l.stage.scale,
        h: STAGE_H * l.stage.scale,
      };
      expect(inside(stageBox, v)).toBe(true);
      const pet: Box = { x: 0, y: v.h - PET_H, w: PET_W, h: PET_H };
      const cards = l.cards.map((c) => ({ x: c.x - CARD_W / 2, y: c.y - CARD_H / 2, w: CARD_W, h: CARD_H }));
      for (const c of cards) {
        expect(c.w).toBeGreaterThanOrEqual(100);
        expect(c.h).toBeGreaterThanOrEqual(100);
        expect(inside(c, v)).toBe(true);
        expect(overlap(c, stageBox)).toBe(false);
        expect(overlap(c, pet)).toBe(false);
      }
      cards.forEach((c, i) => cards.slice(i + 1).forEach((d) => expect(overlap(c, d)).toBe(false)));
      const hitW = BUBBLE_W + 2 * BUBBLE_MARGIN;
      const hitH = BUBBLE_H + 2 * BUBBLE_MARGIN;
      const bubble: Box = { x: l.bubble.x - hitW / 2, y: l.bubble.y - hitH / 2, w: hitW, h: hitH };
      expect(bubble.w).toBeGreaterThanOrEqual(100);
      expect(bubble.h).toBeGreaterThanOrEqual(100);
      expect(inside(bubble, v)).toBe(true);
      const replay: Box = {
        x: l.replay.x - REPLAY_R,
        y: l.replay.y - REPLAY_R,
        w: 2 * REPLAY_R,
        h: 2 * REPLAY_R,
      };
      expect(replay.w).toBeGreaterThanOrEqual(100);
      expect(inside(replay, v)).toBe(true);
      expect(overlap(replay, bubble)).toBe(false);
      for (const w of WHY_STORIES)
        for (const r of w.regions) {
          const b = rectToScreen(l, SLOTS[r.slot]);
          expect(b.w).toBeGreaterThanOrEqual(100);
          expect(b.h).toBeGreaterThanOrEqual(100);
          expect(inside(b, v)).toBe(true);
        }
    });
  }
});

// ---------------------------------------------------------------- level 4, Two bubbles

const ORDERS: [Place, Place, Place][] = [
  ['redBox', 'blueBasket', 'shelf'],
  ['redBox', 'shelf', 'blueBasket'],
  ['blueBasket', 'redBox', 'shelf'],
  ['blueBasket', 'shelf', 'redBox'],
  ['shelf', 'redBox', 'blueBasket'],
  ['shelf', 'blueBasket', 'redBox'],
];
const everyTwo = (): TwoStory[] =>
  TWO_TEMPLATES.flatMap((t) =>
    TWO_PATTERNS.flatMap((p) =>
      ([0, 1] as const).flatMap((more) => ORDERS.map((o) => twoStory(t, p, more, o))),
    ),
  );
const twos = (round: Story[]): TwoStory[] => round.map((s) => (s.level === 4 ? s.two : null!));

/** How many bubbles a habit that ignores who was in the room gets wrong in a story. */
const HABITS: Record<string, (s: TwoStory) => number> = {
  'always the start place': (s) => answersOf(s).filter((a) => a !== s.start).length,
  'always the middle place': (s) => answersOf(s).filter((a) => a !== s.middle).length,
  'always where it really is': (s) => answersOf(s).filter((a) => a !== s.actual).length,
  'copy the first bubble into the second': (s) => (answersOf(s)[0] === answersOf(s)[1] ? 0 : 1),
};

describe('level 4 compile', () => {
  it('every template, pattern, side and place order: both see the put, and the beliefs follow the pattern table', () => {
    for (const s of everyTwo()) {
      const [f0, f1] = s.template.friends;
      const thing = s.template.thing;
      expect(s.events[0].kind).toBe('put');
      expect(s.events[0].saw).toEqual(expect.arrayContaining([f0, f1]));
      expect(new Set([s.start, s.middle, s.actual]).size).toBe(3);
      expect(actualPlace(s.events, thing)).toBe(s.actual);
      const table = {
        oneMove: [s.middle, s.start],
        bothMoves: [s.actual, s.start],
        lastMove: [s.actual, s.middle],
        sameMiddle: [s.middle, s.middle],
        sameStart: [s.start, s.start],
      }[s.pattern];
      const answers = answersOf(s);
      expect([answers[s.more], answers[1 - s.more]], `${s.template.id} ${s.pattern}`).toEqual(table);
      // Everyone is back in the room at the end, and each friend's last-seen beat ends at its answer.
      expect(s.events.filter((e) => e.kind === 'leave').length).toBe(
        s.events.filter((e) => e.kind === 'back').length,
      );
      [f0, f1].forEach((f, b) => {
        const e = s.events[lastSeen(s.events, f, thing)];
        expect(e && (e.kind === 'put' || e.kind === 'move') && e.to).toBe(answers[b]);
        expect(answerOf({ level: 4, two: s, cards: [...PLACES] }, b)).toBe(answers[b]);
      });
    }
  });

  it('kinds: different patterns give two answers, same patterns one; only bothMoves and lastMove reach the real place', () => {
    for (const s of everyTwo()) {
      const [a, b] = answersOf(s);
      expect(a !== b).toBe(isDifferent(s.pattern));
      expect([a, b].includes(s.actual)).toBe(s.pattern === 'bothMoves' || s.pattern === 'lastMove');
    }
    expect([...DIFFERENT_PATTERNS, ...SAME_PATTERNS].sort()).toEqual([...TWO_PATTERNS].sort());
  });

  it('casts: at most three critters, never bear with dog, the second mover is a friend, every move by its mover', () => {
    for (const t of TWO_TEMPLATES) {
      const cast = new Set<string>([...t.friends, ...t.movers.filter((m) => m !== 'wind')]);
      expect(cast.size).toBeLessThanOrEqual(3);
      expect(cast.has('bear') && cast.has('dog')).toBe(false);
      expect(t.movers[1]).not.toBe('wind');
      expect(t.friends).not.toContain(t.movers[1]);
      expect(t.friends[0]).not.toBe(t.friends[1]);
      expect(THINGS).toContain(t.thing);
    }
    expect(new Set(TWO_TEMPLATES.map((t) => t.id)).size).toBe(TWO_TEMPLATES.length);
  });

  it('beats: every event is narrated once in order, and one friend who stays behind is said to stay', () => {
    for (const s of everyTwo()) {
      const beats = beatsOf(s);
      expect(beats.filter((b) => b.event !== null).map((b) => b.event)).toEqual(s.events.map((_, i) => i));
      const stays = beats.filter((b) => b.event === null);
      expect(stays.length).toBe(isDifferent(s.pattern) ? 1 : 0);
      // The friend who stays is the one who saw more, and is in the room for the next move.
      for (const st of stays) expect(st.who).toBe(s.template.friends[s.more]);
      for (const b of beats) expect(Object.prototype.hasOwnProperty.call(SCRIPT, b.line), b.line).toBe(true);
    }
  });
});

describe('level 4 rounds', () => {
  const rounds = seeds.map((seed) => twos(roundFor(4, new Rng(seed), false)));

  it('three templates; two different stories with two patterns, the friend who saw more once on each side', () => {
    const patterns = new Set<string>();
    const templates = new Set<string>();
    const answers = new Set<string>();
    for (const round of rounds) {
      expect(round.length).toBe(3);
      expect(new Set(round.map((s) => s.template.id)).size).toBe(3);
      const different = round.filter((s) => isDifferent(s.pattern));
      expect(different.length).toBeGreaterThanOrEqual(2);
      const ok = different.some((a) =>
        different.some((b) => a !== b && a.pattern !== b.pattern && a.more === 0 && b.more === 1),
      );
      expect(ok).toBe(true);
      for (const s of round) {
        patterns.add(s.pattern);
        templates.add(s.template.id);
        for (const a of answersOf(s)) answers.add(a);
      }
    }
    expect(patterns.size).toBe(5);
    expect(templates.size).toBe(TWO_TEMPLATES.length);
    expect(answers.size).toBe(3);
  });

  it('the same seed gives the same round; the cards are the three places', () => {
    for (const seed of seeds.slice(0, 40)) {
      const a = roundFor(4, new Rng(seed), false);
      expect(roundFor(4, new Rng(seed), false)).toEqual(a);
      for (const s of a) expect([...s.cards].sort()).toEqual([...PLACES].sort());
    }
    expect(twoRound(new Rng(7))).toEqual(twoRound(new Rng(7)));
  });

  it('the first round is the authored list', () => {
    const first = twos(roundFor(4, new Rng(1), true));
    expect(first).toEqual([...FIRST_TWO]);
    expect(first.map((s) => [s.template.id, s.pattern, ...answersOf(s), s.actual])).toEqual([
      ['ball-tidy', 'oneMove', 'blueBasket', 'redBox', 'shelf'],
      ['drum-room', 'sameStart', 'shelf', 'shelf', 'blueBasket'],
      ['book-dust', 'bothMoves', 'blueBasket', 'redBox', 'redBox'],
    ]);
    expect(first[0].template.friends[first[0].more]).toBe('bear');
    expect(first[2].template.friends[first[2].more]).toBe('dog');
  });

  it('the habit property: every habit that ignores who was in the room costs at least two misses a round', () => {
    const cost = (round: TwoStory[], habit: (s: TwoStory) => number) =>
      round.reduce((n, s) => n + habit(s), 0);
    expect(Object.values(HABITS).map((h) => cost([...FIRST_TWO], h))).toEqual([2, 5, 5, 2]);
    for (const round of rounds)
      for (const [name, habit] of Object.entries(HABITS))
        expect(cost(round, habit), name).toBeGreaterThanOrEqual(2);
  });

  it('the ladder: school reaches level 4, pre-K stops at 2, and level 4 says who it is for', () => {
    expect(LEVELS.prek).toEqual({ min: 1, max: 2 });
    expect(planFor(4).level).toBe(4);
    expect(planFor(4).name).toMatch(/about 9 and up/);
  });
});

describe('level 4 accounting and help', () => {
  it('a wrong card in either bubble is one miss; two on one bubble give one hint for that bubble', () => {
    const t = new Tally();
    t.newStory();
    expect(t.wrong(0)).toBe(false);
    expect(t.wrong(1)).toBe(false);
    expect([t.misses, t.hints]).toEqual([2, 0]);
    expect(t.wrong(1)).toBe(true);
    expect(t.wrong(1)).toBe(false);
    expect([t.misses, t.hints]).toEqual([4, 1]);
    expect(t.wrong(0)).toBe(true);
    expect([t.misses, t.hints]).toEqual([5, 2]);
    // The next story starts both bubbles afresh.
    t.newStory();
    expect(t.wrong(0)).toBe(false);
    expect([t.misses, t.hints]).toEqual([6, 2]);
  });

  it('show me is one hint for a bubble, unless that bubble glows already', () => {
    const t = new Tally();
    t.newStory();
    expect(t.showMe('card', 0)).toBe(true);
    expect(t.showMe('card', 0)).toBe(false);
    expect(t.showMe('card', 1)).toBe(true);
    expect([t.misses, t.hints]).toEqual([0, 2]);
    t.newStory();
    t.wrong(1);
    t.wrong(1);
    expect(t.showMe('card', 1)).toBe(false);
    expect(t.hints).toBe(3);
  });

  it('hints lead somewhere: the glow is the first unfilled bubble and its card, then the other, then nothing', () => {
    for (const s of everyTwo().filter((_, i) => i % 7 === 0)) {
      const story: Story = { level: 4, two: s, cards: [...PLACES] };
      const answers = answersOf(s);
      expect(glowFor(story, 'card', [false, false])).toEqual({ card: answers[0], bubble: 0 });
      expect(glowFor(story, 'card', [true, false])).toEqual({ card: answers[1], bubble: 1 });
      expect(glowFor(story, 'card', [false, true])).toEqual({ card: answers[0], bubble: 0 });
      expect(glowFor(story, 'card', [true, true])).toBeNull();
      expect(glowFor(story, 'watch')).toBeNull();
    }
    expect(firstUnfilled([true, true])).toBe(-1);
  });
});

describe('level 4 layout', () => {
  const hitW = BUBBLE_W + 2 * BUBBLE_MARGIN;
  const hitH = BUBBLE_H + 2 * BUBBLE_MARGIN;
  for (const v of VIEWS) {
    it(`two bubbles fit ${v.w}x${v.h}`, () => {
      const l = thoughtLayout(v, 4);
      expect(l.bubbles.length).toBe(2);
      expect(l.bubble).toEqual(l.bubbles[0]);
      expect(l.stage.scale).toBeGreaterThanOrEqual(0.85);
      const stageBox: Box = {
        x: l.stage.x,
        y: l.stage.y,
        w: STAGE_W * l.stage.scale,
        h: STAGE_H * l.stage.scale,
      };
      expect(inside(stageBox, v)).toBe(true);
      const pet: Box = { x: 0, y: v.h - PET_H, w: PET_W, h: PET_H };
      const home: Box = { x: 0, y: 0, w: HOME_W, h: 130 };
      const cards = l.cards.map((c) => ({ x: c.x - CARD_W / 2, y: c.y - CARD_H / 2, w: CARD_W, h: CARD_H }));
      const bubbles = l.bubbles.map((b) => ({ x: b.x - hitW / 2, y: b.y - hitH / 2, w: hitW, h: hitH }));
      const replay: Box = {
        x: l.replay.x - REPLAY_R,
        y: l.replay.y - REPLAY_R,
        w: 2 * REPLAY_R,
        h: 2 * REPLAY_R,
      };
      const all = [...cards, ...bubbles, replay];
      for (const b of all) {
        expect(Math.min(b.w, b.h)).toBeGreaterThanOrEqual(100);
        expect(inside(b, v)).toBe(true);
        expect(overlap(b, home)).toBe(false);
      }
      all.forEach((a, i) => all.slice(i + 1).forEach((b) => expect(overlap(a, b)).toBe(false)));
      for (const c of cards) {
        expect(overlap(c, stageBox)).toBe(false);
        expect(overlap(c, pet)).toBe(false);
      }
      expect(overlap(replay, pet)).toBe(false);
      expect(overlap(replay, stageBox)).toBe(false);
      // Bubble 0 is on the left when upright, on top when sideways; a drop finds the bubble it lands in.
      if (v.w > v.h) expect(l.bubbles[0].y).toBeLessThan(l.bubbles[1].y);
      else expect(l.bubbles[0].x).toBeLessThan(l.bubbles[1].x);
      l.bubbles.forEach((b, i) => expect(bubbleAt(l, b.x, b.y)).toBe(i));
      for (const c of l.cards) expect(bubbleAt(l, c.x, c.y)).toBe(-1);
    });
  }

  it('levels 1–3 keep one bubble where it was', () => {
    for (const v of VIEWS)
      for (const level of [1, 2, 3]) {
        const l = thoughtLayout(v, level);
        expect(l).toEqual(thoughtLayout(v));
        expect(l.bubbles).toEqual([l.bubble]);
      }
  });
});

// ---------------------------------------------------------------- level 5

const everyTell = (): {
  template: (typeof TWO_TEMPLATES)[number];
  pattern: TellPattern;
  x: 0 | 1;
  events: ReturnType<typeof tellEvents>;
}[] =>
  TWO_TEMPLATES.flatMap((template) =>
    TELL_PATTERNS.flatMap((pattern) =>
      ([0, 1] as const).flatMap((x) =>
        ORDERS.map((o) => ({ template, pattern, x, events: tellEvents(template, pattern, x, o) })),
      ),
    ),
  );
const tells = (round: Story[]): TellStory[] => round.map((s) => (s.level === 5 ? s.tell : null!));
const seenParts = (events: ReturnType<typeof tellEvents>, who: Friend) =>
  partsOf(events).flatMap((i, p) => (events[i].saw.includes(who) ? [p] : []));
/** Part numbers to the teller, as the definition's table lists them, with X, Y and H for the helper. */
const TELL_TABLE: Record<TellPattern, Record<string, 'X' | 'Y' | 'H'>> = {
  crossed: { '0,1': 'X', '0,2': 'Y', '1,2': 'H' },
  early: { '0,1': 'X', '1,2': 'H' },
  late: { '0,2': 'X', '1,2': 'H' },
  stayed: { '0,1': 'X', '0,2': 'X', '0,1,2': 'X' },
};

describe('level 5 compile and tellings', () => {
  it('compile: both owners see the put and the helper does not; the helper sees both moves; each friend sees its pattern row', () => {
    const rows: Record<TellPattern, [number[], number[]]> = {
      crossed: [
        [0, 1],
        [0, 2],
      ],
      early: [[0, 1], [0]],
      late: [[0, 2], [0]],
      stayed: [[0, 1, 2], [0]],
    };
    for (const s of everyTell()) {
      const [o0, o1, helper] = candidatesOf(s.template);
      const X = s.template.friends[s.x];
      const Y = s.template.friends[1 - s.x];
      const parts = partsOf(s.events);
      expect(parts.length).toBe(3);
      expect(s.events[parts[0]].saw).toEqual(expect.arrayContaining([o0, o1]));
      expect(seenParts(s.events, helper)).toEqual([1, 2]);
      expect([seenParts(s.events, X), seenParts(s.events, Y)], `${s.template.id} ${s.pattern}`).toEqual(
        rows[s.pattern],
      );
      // The helper comes in straight after the put, and everyone is in the room at the end.
      expect(s.events[1]).toMatchObject({ kind: 'back', who: helper });
      expect(s.events[s.events.length - 1].saw.sort()).toEqual([o0, o1, helper].sort());
      // Every friend misses one part or more.
      for (const f of [o0, o1, helper])
        expect(seenParts(s.events, f).length, f).toBeLessThan(s.pattern === 'stayed' && f === X ? 4 : 3);
    }
  });

  it('compile without the third argument starts everyone in the room, as levels 2 and 4 always have', () => {
    const acts = FIRST_TWO[0].events.map(({ saw: _, ...a }) => a);
    const cast = [...new Set(FIRST_TWO[0].events.flatMap((e) => e.saw))];
    expect(compile(cast, acts)).toEqual(FIRST_TWO[0].events);
    expect(compile(cast, acts, [])).toEqual(FIRST_TWO[0].events);
    expect(
      compile(['bear'], [{ kind: 'put', who: 'bear', thing: 'ball', to: 'shelf' }], ['bear'])[0].saw,
    ).toEqual([]);
  });

  it('the one-teller tellings are exactly the pattern table, derived from the events', () => {
    for (const s of everyTell()) {
      const parts = partsOf(s.events);
      const roles = { X: s.template.friends[s.x], Y: s.template.friends[1 - s.x], H: s.template.movers[1] };
      const found = Object.fromEntries(
        oneTellerTellings(s).map((t) => [
          t.told.map((i) => parts.indexOf(i)).join(','),
          tellersOf(s, t.told)[0],
        ]),
      );
      const want = Object.fromEntries(Object.entries(TELL_TABLE[s.pattern]).map(([k, r]) => [k, roles[r]]));
      expect(found, `${s.template.id} ${s.pattern} ${s.x}`).toEqual(want);
      // The put alone is never dealt: both owners saw it.
      expect(tellersOf(s, [parts[0]]).length).toBeGreaterThanOrEqual(2);
    }
  });

  it('beats: every event narrated once in order; the helper comes in with its own line; every line exists', () => {
    for (const s of everyTell()) {
      const beats = beatsOf(s);
      expect(beats.filter((b) => b.event !== null).map((b) => b.event)).toEqual(s.events.map((_, i) => i));
      expect(beats.find((b) => b.event === 1)!.line).toBe(`thought.tell.in.${s.template.movers[1]}`);
      expect(beats.filter((b) => b.event === null).length).toBeLessThanOrEqual(1);
      for (const b of beats) expect(Object.prototype.hasOwnProperty.call(SCRIPT, b.line), b.line).toBe(true);
    }
  });

  it('casts: three different friends per story, never bear with dog, the helper never the wind', () => {
    for (const t of TWO_TEMPLATES) {
      const c = candidatesOf(t);
      expect(new Set(c).size).toBe(3);
      expect(c.includes('bear') && c.includes('dog')).toBe(false);
      expect(c[2]).not.toBe('wind');
    }
  });

  it('hints lead somewhere: firstMissed is -1 for the teller and a told part for each other friend', () => {
    for (const s of everyTell())
      for (const t of oneTellerTellings(s)) {
        const teller = tellersOf(s, t.told)[0];
        for (const f of candidatesOf(s.template)) {
          const at = firstMissed(s.events, f, t.told);
          if (f === teller) expect(at).toBe(-1);
          else {
            expect(t.told).toContain(at);
            expect(s.events[at].saw).not.toContain(f);
            expect(couldTell(s.events, f, t.told)).toBe(false);
          }
        }
      }
  });
});

describe('level 5 rounds', () => {
  const rounds = seeds.map((seed) => tells(roundFor(5, new Rng(seed), false)));
  const HABITS5: Record<string, (r: TellStory[]) => number> = {
    'always the left card': (r) => tellPositions(r).filter((p) => p !== 0).length,
    'always the middle card': (r) => tellPositions(r).filter((p) => p !== 1).length,
    'always the right card (the helper)': (r) => tellPositions(r).filter((p) => p !== 2).length,
    'copy the first bubble into the second': (r) => r.filter((s) => tellerOf(s, 0) !== tellerOf(s, 1)).length,
  };

  it('the round rule holds over 300 seeds, and every pattern, template, telling and position occurs', () => {
    const patterns = new Set<string>();
    const templates = new Set<string>();
    const kinds = new Set<string>();
    const positions = new Set<number>();
    for (const round of rounds) {
      expect(round.length).toBe(3);
      expect(new Set(round.map((s) => s.template.id)).size).toBe(3);
      expect(round.some((s) => s.pattern === 'crossed')).toBe(true);
      expect(round.filter((s) => s.pattern === 'stayed').length).toBeLessThanOrEqual(1);
      expect(round.filter((s) => tellerOf(s, 0) !== tellerOf(s, 1)).length).toBeGreaterThanOrEqual(2);
      const pos = tellPositions(round);
      for (const p of [0, 1, 2]) {
        const n = pos.filter((x) => x === p).length;
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(3);
        positions.add(p);
      }
      for (const s of round) {
        patterns.add(s.pattern);
        templates.add(s.template.id);
        expect(s.tellings[0].told).not.toEqual(s.tellings[1].told);
        const parts = partsOf(s.events);
        for (const t of s.tellings) {
          expect(tellersOf(s, t.told).length).toBe(1);
          kinds.add(`${s.pattern} ${t.told.map((i) => parts.indexOf(i)).join(',')}`);
        }
      }
    }
    expect(patterns.size).toBe(4);
    expect(templates.size).toBe(TWO_TEMPLATES.length);
    expect(positions.size).toBe(3);
    const listed = Object.entries(TELL_TABLE).flatMap(([p, row]) => Object.keys(row).map((k) => `${p} ${k}`));
    expect([...kinds].sort()).toEqual(listed.sort());
  });

  it('the same seed gives the same round, the cards are the owners then the helper, and the redraw bound is never reached', () => {
    for (const seed of seeds) {
      const draws = { n: 0 };
      const a = tellRound(new Rng(seed), draws);
      expect(draws.n).toBeLessThan(TELL_REDRAWS);
      expect(tellRound(new Rng(seed))).toEqual(a);
    }
    for (const seed of seeds.slice(0, 40)) {
      const r = roundFor(5, new Rng(seed), false);
      expect(roundFor(5, new Rng(seed), false)).toEqual(r);
      for (const s of r) if (s.level === 5) expect(s.cards).toEqual(candidatesOf(s.tell.template));
    }
  });

  it('the first round is the authored list', () => {
    const first = tells(roundFor(5, new Rng(1), true));
    expect(first).toEqual([...FIRST_TELL]);
    expect(
      first.map((s) => [
        s.template.id,
        s.pattern,
        s.template.friends[s.x],
        s.start,
        s.middle,
        s.actual,
        tellerOf(s, 0),
        tellerOf(s, 1),
      ]),
    ).toEqual([
      ['ball-tidy', 'early', 'bear', 'redBox', 'blueBasket', 'shelf', 'bear', 'duck'],
      ['book-dust', 'crossed', 'dog', 'blueBasket', 'shelf', 'redBox', 'bunny', 'dog'],
      ['drum-room', 'stayed', 'duck', 'shelf', 'redBox', 'blueBasket', 'duck', 'duck'],
    ]);
    expect(first[0].tellings[1].told.length).toBe(2);
    expect(first[2].tellings[0].told.length).toBe(3);
    for (const s of first)
      expect(answerOf({ level: 5, tell: s, cards: candidatesOf(s.template) }, 1)).toBe(tellerOf(s, 1));
  });

  it('the habit property: always one card costs at least three, copying at least two', () => {
    expect(Object.values(HABITS5).map((h) => h([...FIRST_TELL]))).toEqual([4, 3, 5, 2]);
    for (const round of rounds) {
      const [l, m, r, copy] = Object.values(HABITS5).map((h) => h(round));
      expect(Math.min(l, m, r)).toBeGreaterThanOrEqual(3);
      expect(copy).toBeGreaterThanOrEqual(2);
    }
  });

  it('the ladder: school reaches level 5, pre-K stops at 2, and level 5 says who it is for', () => {
    expect(LEVELS.school).toEqual({ min: 1, max: 5 });
    expect(LEVELS.prek).toEqual({ min: 1, max: 2 });
    expect(planFor(5).level).toBe(5);
    expect(planFor(9).level).toBe(5);
    expect(planFor(5).name).toBe(
      'Who is telling? (about 9 and up): which friend was there for every part told',
    );
  });
});

describe('level 5 accounting, help and layout', () => {
  const story = (s: TellStory): Story => ({ level: 5, tell: s, cards: candidatesOf(s.template) });

  it('a wrong card in either bubble is one miss; two on one bubble give one hint; Show me picks the first unfilled bubble', () => {
    const t = new Tally();
    t.newStory();
    expect(t.wrong(1)).toBe(false);
    expect(t.wrong(0)).toBe(false);
    expect([t.misses, t.hints]).toEqual([2, 0]);
    expect(t.wrong(1)).toBe(true);
    expect(t.wrong(1)).toBe(false);
    expect([t.misses, t.hints]).toEqual([4, 1]);
    expect(t.showMe('card', 1)).toBe(false);
    expect(t.showMe('card', 0)).toBe(true);
    expect(t.hints).toBe(2);
  });

  it('glowFor gives the first unfilled bubble and its teller, then the other, then nothing', () => {
    for (const s of FIRST_TELL) {
      const st = story(s);
      expect(glowFor(st, 'card', [false, false])).toEqual({ card: tellerOf(s, 0), bubble: 0 });
      expect(glowFor(st, 'card', [true, false])).toEqual({ card: tellerOf(s, 1), bubble: 1 });
      expect(glowFor(st, 'card', [false, true])).toEqual({ card: tellerOf(s, 0), bubble: 0 });
      expect(glowFor(st, 'card', [true, true])).toBe(null);
    }
  });

  it("level 5 uses level 4's layout, and three part pictures fit inside a bubble", () => {
    for (const v of VIEWS) expect(thoughtLayout(v, 5)).toEqual(thoughtLayout(v, 4));
    expect(3 * PART_W + 2 * PART_GAP + 2 * PART_INSET).toBeLessThanOrEqual(BUBBLE_W);
    expect(PART_W).toBeLessThanOrEqual(BUBBLE_H - 2 * PART_INSET);
  });
});

describe('voice lines', () => {
  const has = (id: string) => expect(Object.prototype.hasOwnProperty.call(SCRIPT, id), id).toBe(true);
  it('every dynamically built id exists', () => {
    for (const t of THINGS) has(`thought.thing.${t}`);
    for (const p of PLACES) has(`thought.place.${p}`);
    for (const r of REASONS) {
      has(`thought.reason.${r}`);
      has(`thought.need.${r}`);
    }
    for (const n of [1, 2, 3, 4, 5]) has(`thought.instruct.${n}`);
    for (const w of WANT_STORIES) for (const k of ['story', 'hint', 'got']) has(`thought.want.${w.id}.${k}`);
    for (const t of LOOK_TEMPLATES)
      for (const k of ['away', 'watching', 'ask', 'saw', 'helped']) has(`thought.look.${t.id}.${k}`);
    for (const w of WHY_STORIES) {
      for (const k of ['story', 'ask', 'found', 'again']) has(`thought.why.${w.id}.${k}`);
      for (const r of w.regions) has(`thought.region.${w.id}.${r.id}`);
    }
    for (const t of TWO_TEMPLATES) {
      for (const k of ['put', 'move1', 'move2', 'ask', 'helped']) has(`thought.two.${t.id}.${k}`);
      for (const f of t.friends) {
        for (const k of ['out', 'stay', 'back']) has(`thought.two.${t.id}.${k}.${f}`);
        has(`thought.two.saw.${f}`);
      }
    }
    for (const k of ['found', 'done.different', 'done.same']) has(`thought.two.${k}`);
    for (const t of TWO_TEMPLATES) {
      has(`thought.tell.in.${t.movers[1]}`);
      for (const f of candidatesOf(t))
        for (const k of ['friend', 'tell.was', 'tell.there']) has(`thought.${k}.${f}`);
    }
    for (const k of ['intro.0', 'intro.1', 'done']) has(`thought.tell.${k}`);
  });

  it('level 5 says told, was there and saw, never wrong, lied, forgot or left out', () => {
    for (const [id, lines] of Object.entries(SCRIPT))
      if (id.startsWith('thought.tell.') || id.startsWith('thought.friend.') || id === 'thought.instruct.5')
        for (const text of lines as readonly string[])
          expect(text, id).not.toMatch(/wrong|lied|\blie\b|forgot|left out/i);
  });

  it('level 4 says thinks and saw, never wrong, trick, silly or fooled', () => {
    for (const [id, lines] of Object.entries(SCRIPT))
      if (id.startsWith('thought.two.') || id === 'thought.instruct.4')
        for (const text of lines as readonly string[])
          expect(text, id).not.toMatch(/wrong|trick|silly|fooled/i);
  });
});
