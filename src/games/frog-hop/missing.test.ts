import { Container, type FederatedPointerEvent } from 'pixi.js';
import { describe, expect, it, vi } from 'vitest';
import { GUIDE_CORNER } from '../../creatures/home-layout';
import { SCRIPT } from '../../content/voice-script';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import { levelsInOrder } from '../../progress/difficulty';
import type { GameContext, RoundResult } from '../types';
import { frogHop } from './index';
import {
  answerSlot,
  CARD_HIT,
  hopLayout,
  MISSING_CARDS,
  MISSING_LEVEL,
  MISSING_RUN,
  missingQuestions,
  PAD_HIT,
  PLANS,
  planFor,
  runNumbers,
  shownOnRun,
  WINDOW,
} from './logic';

const { press } = vi.hoisted(() => ({ press: new Map<object, (e: FederatedPointerEvent) => void>() }));
vi.mock('../../engine/input', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../engine/input')>()),
  onTap: (node: object, fn: (e: FederatedPointerEvent) => void) => press.set(node, fn),
}));
vi.mock('../../audio/sfx', () => ({
  sfx: {
    pop: vi.fn(),
    splash: vi.fn(),
    croak: vi.fn(),
    sparkle: vi.fn(),
    boing: vi.fn(),
    whoosh: vi.fn(),
    squeak: vi.fn(),
    tada: vi.fn(),
  },
}));
vi.mock('../../art/scenery', async () => {
  const { Container } = await import('pixi.js');
  return {
    Backdrop: class extends Container {
      resize() {}
    },
  };
});
vi.mock('../../ui/text', async () => {
  const { Container } = await import('pixi.js');
  return { label: (text: string) => Object.assign(new Container(), { text }) };
});

const VIEWS = [
  ...[
    [1024, 768],
    [768, 1024],
    [390, 844],
    [844, 390],
  ].map(([w, h]) => computeView(w, h)),
  ...[
    [390, 844],
    [360, 780],
  ].map(([w, h]) => computeView(w, h, undefined, true)),
];

const plan = planFor(MISSING_LEVEL);

describe('Which pad lost its number? (level 18): bands and numbering', () => {
  it("is level 18, pre-K's entry between 2 and 3, and not in school", () => {
    expect(PLANS[MISSING_LEVEL - 1].mode).toBe('missing');
    expect(levelsInOrder(frogHop.levels('prek'))).toEqual([1, 2, 18, 3, 4]);
    expect(frogHop.levels('school')).toEqual({ min: 3, max: 15 });
    expect(frogHop.levels('toddler')).toEqual({ min: 16, max: 17 });
    expect(frogHop.entryLevels).toEqual([16, 17, 18]);
    expect(frogHop.describeLevel(18)).toMatch(/^Which pad lost its number/);
  });

  it('has its voice lines with the slots it fills', () => {
    expect(SCRIPT['hop.missing'][0]).toContain('{n}');
    expect(SCRIPT['hop.wrong.missing'][0]).toContain('{m}');
    expect(SCRIPT['hop.missing.here'][0]).toContain('{m}');
  });
});

describe('Which pad lost its number?: the questions', () => {
  const rounds = Array.from({ length: 300 }, (_, seed) => missingQuestions(plan, new Rng(seed)));

  it('hides an interior pad of a run of 4 to 6 inside 0 to 9, starting at 0 to 4', () => {
    for (const qs of rounds) {
      expect(qs).toHaveLength(5);
      for (const q of qs) {
        expect(q.run).toBeGreaterThanOrEqual(MISSING_RUN.min);
        expect(q.run).toBeLessThanOrEqual(MISSING_RUN.max);
        expect(q.start).toBeGreaterThanOrEqual(0);
        expect(q.start).toBeLessThanOrEqual(4);
        expect(q.start + q.run! - 1).toBeLessThanOrEqual(9);
        expect(q.target).toBeGreaterThan(q.start);
        expect(q.target).toBeLessThan(q.start + q.run! - 1);
        expect(q.lo).toBe(q.start);
        expect(q.run!).toBeLessThanOrEqual(WINDOW);
      }
    }
  });

  it('offers three distinct cards: the answer, a neighbour on the run, and another number that is not an end', () => {
    for (const qs of rounds)
      for (const q of qs) {
        const cards = q.cards!;
        expect(cards).toHaveLength(MISSING_CARDS);
        expect(new Set(cards).size).toBe(3);
        expect(cards).toContain(q.target);
        const neighbours = cards.filter((c) => Math.abs(c - q.target) === 1);
        expect(neighbours.length).toBeGreaterThanOrEqual(1);
        for (const n of neighbours) expect(shownOnRun(q)).toContain(n);
        const ends = [q.start, q.start + q.run! - 1];
        for (const c of cards) {
          expect(c).toBeGreaterThanOrEqual(0);
          expect(c).toBeLessThanOrEqual(9);
        }
        // At most one card is an end, and only as the neighbour.
        for (const c of cards.filter((c) => ends.includes(c))) expect(Math.abs(c - q.target)).toBe(1);
        expect(answerSlot('missing', q, q.lo)).toBe(cards.indexOf(q.target));
      }
  });

  it('never repeats a run twice running, and hides five different numbers', () => {
    for (const qs of rounds) {
      expect(new Set(qs.map((q) => q.target)).size).toBe(5);
      for (let i = 1; i < qs.length; i++)
        expect(qs[i].start === qs[i - 1].start && qs[i].run === qs[i - 1].run).toBe(false);
    }
  });

  it('shuffles the answer card across places', () => {
    const places = new Set(rounds.flatMap((qs) => qs.map((q) => q.cards!.indexOf(q.target))));
    expect(places).toEqual(new Set([0, 1, 2]));
  });
});

describe('Which pad lost its number?: layout', () => {
  type Box = { x: number; y: number; w: number; h: number };
  const overlap = (A: Box, B: Box) =>
    A.x < B.x + B.w && B.x < A.x + A.w && A.y < B.y + B.h && B.y < A.y + A.h;
  const onScreen = (b: Box, v: { w: number; h: number }) =>
    b.x >= 0 && b.y >= 0 && b.x + b.w <= v.w && b.y + b.h <= v.h;

  it('keeps the run, the leaf, the sign and the cards on screen, apart and clear of the guide corner, at 100 units or more', () => {
    for (const v of VIEWS)
      for (let run = MISSING_RUN.min; run <= MISSING_RUN.max; run++) {
        const L = hopLayout(v, 'missing', GUIDE_CORNER.w, run);
        const where = `${v.w}×${v.h} run ${run}`;
        const pads = L.pads.slice(0, run).map((p) => ({
          x: p.x - PAD_HIT.w / 2,
          y: p.y - PAD_HIT.h / 2,
          w: PAD_HIT.w,
          h: PAD_HIT.h,
        }));
        const cards = L.cards.map((c) => ({
          x: c.x - CARD_HIT.w / 2,
          y: c.y - CARD_HIT.h / 2,
          w: CARD_HIT.w,
          h: CARD_HIT.h,
        }));
        expect(cards).toHaveLength(3);
        // The leaf covers the numeral 44 below a pad's centre, 80 wide and 60 tall.
        const leaves = L.pads.slice(0, run).map((p) => ({ x: p.x - 40, y: p.y + 14, w: 80, h: 60 }));
        const guide = { x: 0, y: v.h - GUIDE_CORNER.h, w: GUIDE_CORNER.w, h: GUIDE_CORNER.h };
        for (const b of [...pads, ...cards, ...leaves, L.sign]) {
          expect(onScreen(b, v), `${where} on screen ${JSON.stringify(b)}`).toBe(true);
        }
        for (const b of [...pads, ...cards]) {
          expect(Math.min(b.w, b.h), where).toBeGreaterThanOrEqual(100);
          expect(overlap(b, guide), `${where} guide`).toBe(false);
          expect(overlap(b, L.sign), `${where} sign`).toBe(false);
        }
        const all = [...pads, ...cards];
        for (let a = 0; a < all.length; a++)
          for (let b = a + 1; b < all.length; b++)
            expect(overlap(all[a], all[b]), `${where} ${a} and ${b}`).toBe(false);
        // The run reads left to right, row by row.
        const ps = L.pads.slice(0, run);
        for (let i = 1; i < run; i++)
          expect(ps[i].y > ps[i - 1].y || (ps[i].y === ps[i - 1].y && ps[i].x > ps[i - 1].x), where).toBe(
            true,
          );
      }
  });
});

interface MissingGame {
  q: ReturnType<typeof missingQuestions>[number];
  index: number;
  misses: number;
  hints: number;
  busy: boolean;
  at: number;
  pads: Container[];
  cards: { n: number; node: Container }[];
  glowing: Container | null;
  autotouch(): { tap: { on: Container } } | null;
  resize(v: unknown): void;
  start(): void;
}

function round(seed = 7, view = computeView(390, 844, undefined, true)) {
  const finish = vi.fn<(result: RoundResult) => void>();
  const say = vi.fn((_id: string, _vars?: Record<string, number>) => Promise.resolve());
  const instruct = vi.fn((_id: string, _vars?: Record<string, number>) => Promise.resolve());
  const ctx = {
    level: MISSING_LEVEL,
    view,
    rng: new Rng(seed),
    stage: new Container(),
    say,
    instruct,
    finish,
    pet: { cheer: vi.fn() },
    particles: { burst: vi.fn() },
    tw: {
      to: (target: Record<string, number>, props: Record<string, number>) => {
        Object.assign(target, props);
        return Promise.resolve();
      },
      wait: () => Promise.resolve(),
      busy: () => false,
    },
  } as unknown as GameContext;
  const game = frogHop.create(ctx) as unknown as MissingGame;
  game.resize(view);
  game.start();
  const flush = async () => {
    for (let i = 0; i < 200; i++) await Promise.resolve();
  };
  const tapCard = async (n: number) => {
    press.get(game.cards.find((c) => c.n === n)!.node)!({} as FederatedPointerEvent);
    await flush();
  };
  return { game, finish, say, instruct, tapCard, flush };
}

describe('Which pad lost its number?: a round', () => {
  it('asks with the pad before the leaf, hops the whole run saying every number on a right card, and finishes after five', async () => {
    const { game, finish, say, instruct, tapCard, flush } = round();
    await flush();
    for (let i = 0; i < 5; i++) {
      const q = game.q;
      expect(instruct).toHaveBeenLastCalledWith('hop.missing', { n: q.target - 1 });
      expect(game.pads.filter((p) => p.visible)).toHaveLength(q.run!);
      expect(game.at).toBe(q.start);
      expect(game.cards.map((c) => c.n)).toEqual(q.cards);
      say.mockClear();
      await tapCard(q.target);
      expect(say.mock.calls.filter(([id]) => id === 'count').map(([, v]) => v?.n)).toEqual(runNumbers(q));
    }
    expect(finish).toHaveBeenCalledWith({ misses: 0, hints: 0 });
  });

  it('names a wrong card, says when it is already on the run, and after two misses glows the answer with one hint', async () => {
    const { game, finish, say, tapCard, flush } = round(3);
    await flush();
    const q = game.q;
    const shown = q.cards!.find((c) => c !== q.target && shownOnRun(q).includes(c))!;
    await tapCard(shown);
    expect(say).toHaveBeenCalledWith('hop.wrong.missing', { m: shown });
    expect(say).toHaveBeenCalledWith('hop.missing.here', { m: shown });
    expect(game.glowing).toBeNull();
    await tapCard(shown);
    expect(game.hints).toBe(1);
    expect(game.glowing).toBe(game.cards.find((c) => c.n === q.target)!.node);
    await tapCard(shown);
    expect(game.hints).toBe(1);
    expect(game.misses).toBe(3);
    await tapCard(q.target);
    expect(game.index).toBe(1);
    for (let i = 1; i < 5; i++) await tapCard(game.q.target);
    expect(finish).toHaveBeenCalledWith({ misses: 3, hints: 1 });
  });

  it('treats a pad tap as free, and has a bot that taps the answer card', async () => {
    const { game, finish, flush } = round(11);
    await flush();
    press.get(game.pads[0])!({} as FederatedPointerEvent);
    await flush();
    expect(game.misses).toBe(0);
    for (let i = 0; i < 5; i++) {
      const move = game.autotouch()!;
      const card = game.cards.find((c) => c.node === move.tap.on)!;
      expect(card.n).toBe(game.q.target);
      press.get(card.node)!({} as FederatedPointerEvent);
      await flush();
    }
    expect(finish).toHaveBeenCalledTimes(1);
  });
});
