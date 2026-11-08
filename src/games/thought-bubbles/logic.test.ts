import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { SCRIPT } from '../../content/voice-script';
import {
  actualPlace,
  answerOf,
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
  type Story,
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

describe('voice lines', () => {
  const has = (id: string) => expect(Object.prototype.hasOwnProperty.call(SCRIPT, id), id).toBe(true);
  it('every dynamically built id exists', () => {
    for (const t of THINGS) has(`thought.thing.${t}`);
    for (const p of PLACES) has(`thought.place.${p}`);
    for (const r of REASONS) {
      has(`thought.reason.${r}`);
      has(`thought.need.${r}`);
    }
    for (const n of [1, 2, 3]) has(`thought.instruct.${n}`);
    for (const w of WANT_STORIES) for (const k of ['story', 'hint', 'got']) has(`thought.want.${w.id}.${k}`);
    for (const t of LOOK_TEMPLATES)
      for (const k of ['away', 'watching', 'ask', 'saw', 'helped']) has(`thought.look.${t.id}.${k}`);
    for (const w of WHY_STORIES) {
      for (const k of ['story', 'ask', 'found', 'again']) has(`thought.why.${w.id}.${k}`);
      for (const r of w.regions) has(`thought.region.${w.id}.${r.id}`);
    }
  });
});
