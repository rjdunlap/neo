import { Container, type FederatedPointerEvent } from 'pixi.js';
import { describe, expect, it, vi } from 'vitest';
import { GUIDE_CORNER } from '../../creatures/home-layout';
import { SCRIPT } from '../../content/voice-script';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import type { GameContext, RoundResult } from '../types';
import { frogHop } from './index';
import {
  alongLayout,
  dotsMissLine,
  dotsPadBox,
  dotsPadsFor,
  dotsPanel,
  padDots,
  dotsQuestions,
  dotsSign,
  DOTS_LEVEL,
  DOTS_SHORT_PADS,
  PLANS,
  planFor,
  SIGN_DOT_R,
  signDots,
} from './logic';
import type { DotsPond } from './dots-scene';

const { press } = vi.hoisted(() => ({ press: new Map<object, (e: FederatedPointerEvent) => void>() }));
vi.mock('../../engine/input', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../engine/input')>()),
  onTap: (node: object, fn: (e: FederatedPointerEvent) => void) => press.set(node, fn),
}));
vi.mock('../../audio/sfx', () => ({
  sfx: { pop: vi.fn(), splash: vi.fn(), croak: vi.fn(), sparkle: vi.fn(), boing: vi.fn() },
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

describe('Hop to the dots (level 17): bands and numbering', () => {
  it("is level 17, the toddler's top, an entry, and not in school", () => {
    expect(PLANS[DOTS_LEVEL - 1].mode).toBe('dots');
    expect(frogHop.levels('toddler')).toEqual({ min: 16, max: 17 });
    expect(frogHop.levels('lap')).toEqual({ min: 16, max: 16 });
    expect(frogHop.levels('school')).toEqual({ min: 3, max: 15 });
    expect(frogHop.entryLevels).toContain(17);
    expect(frogHop.describeLevel(17)).toMatch(/^Hop to the dots/);
  });

  it('has its voice lines with the slots it fills', () => {
    expect(SCRIPT['hop.dots'][0]).toContain('{n}');
    for (const id of ['hop.wrong.dots-forward', 'hop.wrong.dots-back'] as const) {
      expect(SCRIPT[id][0]).toContain('{m}');
      expect(SCRIPT[id][0]).toContain('{n}');
    }
  });
});

describe('Hop to the dots: the questions', () => {
  it('asks 1 to 3 on the short line, then 1 to 5, never the same twice running, with a 4 or 5 on the long line', () => {
    const plan = planFor(DOTS_LEVEL);
    for (let seed = 1; seed <= 400; seed++) {
      const qs = dotsQuestions(plan, new Rng(seed));
      expect(qs).toHaveLength(5);
      qs.forEach((q, i) => {
        expect(q.start).toBe(0);
        expect(q.target).toBeGreaterThanOrEqual(1);
        expect(q.target).toBeLessThanOrEqual(dotsPadsFor(i));
        if (i > 0) expect(q.target).not.toBe(qs[i - 1].target);
      });
      expect(dotsPadsFor(0)).toBe(DOTS_SHORT_PADS);
      expect(dotsPadsFor(1)).toBe(DOTS_SHORT_PADS);
      expect(qs.slice(2).some((q) => q.target >= 4)).toBe(true);
    }
  });

  it('shows on the sign exactly as many dots as the target, each at least 36 across, in one row up to five', () => {
    for (let n = 1; n <= 5; n++) {
      const dots = signDots(n);
      expect(dots).toHaveLength(n);
      expect(new Set(dots.map((d) => d.y)).size).toBe(1);
    }
    expect(2 * SIGN_DOT_R).toBeGreaterThanOrEqual(36);
  });

  it('says which way to go from the pad she tapped', () => {
    expect(dotsMissLine(3, 1)).toBe('hop.wrong.dots-forward');
    expect(dotsMissLine(2, 5)).toBe('hop.wrong.dots-back');
  });

  it("keeps the sign and every pad box on screen and apart, with each pad's dots inside its box and the water, at three and five pads", () => {
    for (const v of VIEWS)
      for (const count of [3, 5]) {
        const L = alongLayout(v, GUIDE_CORNER.w, count);
        const sign = dotsSign(v);
        expect(sign.x).toBeGreaterThanOrEqual(0);
        expect(sign.x + sign.w).toBeLessThanOrEqual(v.w);
        expect(sign.y).toBeGreaterThanOrEqual(0);
        const panel = dotsPanel(L);
        const inside = (
          p: { x: number; y: number },
          b: { x: number; y: number; w: number; h: number },
          m = 0,
        ) => p.x >= b.x + m && p.x <= b.x + b.w - m && p.y >= b.y + m && p.y <= b.y + b.h - m;
        const boxes = L.spots.slice(1).map((p) => dotsPadBox(p));
        L.spots.slice(1).forEach((p, i) => {
          const box = boxes[i];
          const where = `${v.w}×${v.h} ${count} pad ${i + 1}`;
          expect(box.w, where).toBeGreaterThanOrEqual(120);
          expect(box.h, where).toBeGreaterThanOrEqual(120);
          expect(box.x, where).toBeGreaterThanOrEqual(0);
          expect(box.x + box.w, where).toBeLessThanOrEqual(v.w);
          expect(box.y + box.h, where).toBeLessThanOrEqual(v.h);
          expect(box.y, where).toBeGreaterThan(sign.y + sign.h);
          expect(box.x < GUIDE_CORNER.w && box.y + box.h > v.h - GUIDE_CORNER.h, where).toBe(false);
          // The pad's own dots, the cue she matches, sit inside the water panel and inside the pad's tap box.
          for (const d of padDots(i + 1, p)) {
            expect(inside(d, panel, 10), `${where} dot in panel`).toBe(true);
            expect(inside(d, box, 10), `${where} dot in box`).toBe(true);
          }
        });
        // Neighbouring pads' boxes never overlap.
        for (let a = 0; a < boxes.length; a++)
          for (let b = a + 1; b < boxes.length; b++) {
            const A = boxes[a];
            const B = boxes[b];
            const overlap = A.x < B.x + B.w && B.x < A.x + A.w && A.y < B.y + B.h && B.y < A.y + A.h;
            expect(overlap, `${v.w}×${v.h} ${count} pads ${a + 1} and ${b + 1}`).toBe(false);
          }
      }
  });
});

/** A round with a tween clock that finishes at once and speech that resolves at once. */
function round(seed = 7, view = computeView(390, 844, undefined, true)) {
  const finish = vi.fn<(result: RoundResult) => void>();
  const say = vi.fn((_id: string, _vars?: Record<string, number>) => Promise.resolve());
  const instruct = vi.fn((_id: string, _vars?: Record<string, number>) => Promise.resolve());
  const ctx = {
    level: DOTS_LEVEL,
    view,
    rng: new Rng(seed),
    stage: new Container(),
    say,
    instruct,
    finish,
    pet: { cheer: vi.fn() },
    tw: {
      to: (target: Record<string, number>, props: Record<string, number>) => {
        Object.assign(target, props);
        return Promise.resolve();
      },
      wait: () => Promise.resolve(),
      busy: () => false,
    },
  } as unknown as GameContext;
  const game = frogHop.create(ctx) as DotsPond;
  game.resize(view);
  game.start();
  const tap = async (k: number) => {
    press.get(game.pads[k - 1])!({} as FederatedPointerEvent);
    for (let i = 0; i < 60; i++) await Promise.resolve();
  };
  return { game, finish, say, instruct, tap };
}

describe('Hop to the dots: a round', () => {
  it('asks with the dots line, hops pad by pad on a right pad, and finishes after five', async () => {
    const { game, finish, say, instruct, tap } = round();
    for (let i = 0; i < 5; i++) {
      const n = game.q.target;
      expect(instruct).toHaveBeenLastCalledWith('hop.dots', { n });
      expect(game.pads.filter((p) => p.visible)).toHaveLength(dotsPadsFor(i));
      say.mockClear();
      await tap(n);
      expect(say.mock.calls.filter(([id]) => id === 'count').map(([, v]) => v?.n)).toEqual(
        Array.from({ length: n }, (_, k) => k + 1),
      );
      expect(say).toHaveBeenCalledWith('hop.landed', { n });
    }
    expect(finish).toHaveBeenCalledTimes(1);
    expect(finish).toHaveBeenCalledWith({ misses: 0, hints: 0 });
  });

  it('hops to a wrong pad, names it and the way, leaps home, and after two misses glows the target; the next tap finishes', async () => {
    const { game, finish, say, tap } = round();
    const n = game.q.target;
    const wrong = n === 1 ? 2 : 1;
    await tap(wrong);
    expect(say).toHaveBeenCalledWith(dotsMissLine(n, wrong), { m: wrong, n });
    expect(game.at).toBe(0);
    expect(game.glowing).toBe(0);
    await tap(wrong);
    expect(game.glowing).toBe(n);
    expect(game.hints).toBe(1);
    // The supported finish: even a wrong pad now hops the frog to the glowing one.
    say.mockClear();
    await tap(wrong);
    expect(say).toHaveBeenCalledWith('hop.landed', { n });
    expect(game.misses).toBe(2);
    expect(game.qi).toBe(1);
    expect(game.glowing).toBe(0);
    for (let i = 1; i < 5; i++) await tap(game.q.target);
    expect(finish).toHaveBeenCalledWith({ misses: 2, hints: 1 });
  });

  it('ignores the hidden pads 4 and 5 on the short line and a tap during a hop', async () => {
    const { game, tap } = round();
    expect(game.pads[3].visible).toBe(false);
    await tap(4);
    expect(game.misses).toBe(0);
    game.busy = true;
    await tap(game.q.target);
    expect(game.qi).toBe(0);
  });

  it('has a bot that taps the target pad', async () => {
    const { game, finish, tap } = round(11);
    for (let i = 0; i < 5; i++) {
      const move = game.autotouch()!;
      const spot = 'tap' in move ? move.tap : null;
      expect(spot?.on).toBe(game.pads[game.q.target - 1]);
      await tap(game.q.target);
    }
    expect(finish).toHaveBeenCalledTimes(1);
    expect(game.autotouch()).toBeNull();
  });
});
