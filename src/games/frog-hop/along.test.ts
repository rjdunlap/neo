import { Container, Point, type FederatedPointerEvent } from 'pixi.js';
import { describe, expect, it, vi } from 'vitest';
import { computeView } from '../../engine/view';
import { GUIDE_CORNER } from '../../creatures/home-layout';
import { SCRIPT } from '../../content/voice-script';
import type { GameContext, RoundResult } from '../types';
import { frogHop } from './index';
import {
  ALONG_BOT,
  ALONG_HIT,
  ALONG_LEVEL,
  ALONG_PADS,
  ALONG_TAPS,
  alongLayout,
  alongNote,
  alongPads,
  alongRoute,
  LEVELS,
  nearestPad,
  PLANS,
  planFor,
} from './logic';
import type { AlongPond } from './along-scene';

const { press } = vi.hoisted(() => ({ press: new Map<object, (e: FederatedPointerEvent) => void>() }));
vi.mock('../../engine/input', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../engine/input')>()),
  onTap: (node: object, fn: (e: FederatedPointerEvent) => void) => press.set(node, fn),
}));
vi.mock('../../audio/sfx', () => ({
  sfx: { pop: vi.fn(), splash: vi.fn(), croak: vi.fn(), tada: vi.fn() },
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

// The design area, an upright iPad, and a phone either way round, plus the upright phone areas.
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

describe('Hop along (level 16): bands and numbering', () => {
  it('is level 16, the only level at lap and toddler, an entry, and school keeps 3 to 15', () => {
    expect(planFor(ALONG_LEVEL).mode).toBe('along');
    expect(PLANS.length).toBe(ALONG_LEVEL);
    expect(frogHop.levels('lap')).toEqual({ min: 16, max: 16 });
    expect(frogHop.levels('toddler')).toEqual({ min: 16, max: 16 });
    expect(frogHop.levels('school')).toEqual({ min: 3, max: 15 });
    expect(frogHop.bands).toEqual(['lap', 'toddler', 'preschool', 'prek', 'school']);
    expect(frogHop.entryLevels).toEqual([16]);
    expect(frogHop.describeLevel(16)).toMatch(/^Hop along/);
  });

  it('puts every plan in at least one band', () => {
    const inBand = (id: number) =>
      Object.values(LEVELS).some((r) => r && (r.order ? r.order.includes(id) : id >= r.min && id <= r.max));
    for (let id = 1; id <= PLANS.length; id++) expect(inBand(id), `level ${id}`).toBe(true);
  });

  it('has its voice lines with the slots it fills', () => {
    expect(SCRIPT['hop.along'][0]).toContain('{n}');
    expect(SCRIPT['hop.along.home'][0]).toContain('{n}');
    expect(SCRIPT['hop.along.done'][0]).toContain('{n}');
  });
});

describe('Hop along: the pond', () => {
  it('lays out a bank and five pads, every pad owning a square of at least 120 on screen', () => {
    for (const v of VIEWS) {
      const L = alongLayout(v, GUIDE_CORNER.w);
      const pads = alongPads(v);
      expect(pads).toHaveLength(ALONG_PADS);
      pads.forEach((p, i) => {
        const half = ALONG_HIT / 2;
        // Every point of the pad's 120 square goes to that pad, inside the pond and on screen.
        for (const dx of [-half, 0, half])
          for (const dy of [-half, 0, half]) {
            const pt = { x: p.x + dx, y: p.y + dy };
            expect(nearestPad(pt, pads), `${v.w}×${v.h} pad ${i + 1}`).toBe(i + 1);
            expect(pt.x).toBeGreaterThanOrEqual(L.pond.x);
            expect(pt.x).toBeLessThanOrEqual(L.pond.x + L.pond.w);
            expect(pt.y).toBeGreaterThanOrEqual(L.pond.y);
            expect(pt.y).toBeLessThanOrEqual(L.pond.y + L.pond.h);
            expect(pt.x).toBeGreaterThanOrEqual(0);
            expect(pt.x).toBeLessThanOrEqual(v.w);
          }
        // No pad sits under the bank's tap box or the guide's corner.
        const inBank =
          p.x > L.bank.x && p.x < L.bank.x + L.bank.w && p.y > L.bank.y && p.y < L.bank.y + L.bank.h;
        expect(inBank).toBe(false);
        expect(p.x - half < GUIDE_CORNER.w && p.y + half > v.h - GUIDE_CORNER.h).toBe(false);
      });
      expect(L.bank.w).toBeGreaterThanOrEqual(ALONG_HIT);
      expect(L.bank.h).toBeGreaterThanOrEqual(ALONG_HIT);
      expect(L.bank.x).toBeGreaterThanOrEqual(0);
      expect(L.bank.y + L.bank.h).toBeLessThanOrEqual(v.h - GUIDE_CORNER.h + 1);
    }
  });

  it('resolves every point of the pond to exactly one pad, ties to the lower', () => {
    for (const v of VIEWS) {
      const { pond } = alongLayout(v);
      const pads = alongPads(v);
      for (let x = pond.x; x <= pond.x + pond.w; x += 23)
        for (let y = pond.y; y <= pond.y + pond.h; y += 23) {
          const k = nearestPad({ x, y }, pads);
          expect(k).toBeGreaterThanOrEqual(1);
          expect(k).toBeLessThanOrEqual(5);
        }
    }
    const row = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ];
    expect(nearestPad({ x: 50, y: 0 }, row)).toBe(1);
  });

  it('routes pad by pad, in order, ending on the target and never saying the start', () => {
    for (let a = 0; a <= 5; a++)
      for (let b = 0; b <= 5; b++) {
        const r = alongRoute(a, b);
        expect(r).toHaveLength(Math.abs(b - a));
        if (a !== b) expect(r.at(-1)).toBe(b);
        expect(r).not.toContain(a);
        r.forEach((k, i) => expect(Math.abs(k - (i === 0 ? a : r[i - 1]))).toBe(1));
      }
  });

  it('plays a note that strictly rises with the pad, the bank lowest', () => {
    for (let k = 1; k <= 5; k++) expect(alongNote(k)).toBeGreaterThan(alongNote(k - 1));
  });
});

/** A round with a tween clock that finishes at once and speech that resolves at once. */
function round(view = computeView(1024, 768)) {
  const finish = vi.fn<(result: RoundResult) => void>();
  const say = vi.fn((_id: string, _vars?: { n: number }) => Promise.resolve());
  const instruct = vi.fn((_id: string, _vars?: { n: number }) => Promise.resolve());
  const ctx = {
    level: ALONG_LEVEL,
    view,
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
  const game = frogHop.create(ctx) as AlongPond;
  game.resize(view);
  game.start();
  const tapAt = async (node: Container, x: number, y: number) => {
    press.get(node)!({ global: new Point(x, y) } as FederatedPointerEvent);
    for (let i = 0; i < 40; i++) await Promise.resolve();
  };
  return { game, finish, say, instruct, tapAt, view };
}

describe('Hop along: a round', () => {
  it('invites, hops and counts each landing, sends the frog home from the bank, and ends on the sixth tap only', async () => {
    const { game, finish, say, instruct, tapAt, view } = round();
    expect(instruct).toHaveBeenCalledWith('hop.along', { n: 5 });
    const pads = alongPads(view);
    const L = alongLayout(view);
    await tapAt(game.pond, pads[2].x, pads[2].y + 40);
    expect(game.at).toBe(3);
    expect(say.mock.calls.filter(([id]) => id === 'count').map(([, s]) => s?.n)).toEqual([1, 2, 3]);
    await tapAt(game.pond, pads[2].x, pads[2].y);
    expect(game.at).toBe(3);
    await tapAt(game.bank, L.bank.x + 10, L.bank.y + 10);
    expect(game.at).toBe(0);
    expect(say).toHaveBeenCalledWith('hop.along.home', { n: 3 });
    for (let t = 4; t <= 5; t++) {
      await tapAt(game.pond, pads[4].x, pads[4].y);
      expect(finish).not.toHaveBeenCalled();
    }
    await tapAt(game.pond, pads[0].x, pads[0].y);
    expect(game.taps).toBe(ALONG_TAPS);
    expect(finish).toHaveBeenCalledTimes(1);
    expect(finish).toHaveBeenCalledWith({ misses: 0, hints: 0 });
    expect(say).toHaveBeenCalledWith('hop.along.done', { n: 6 });
  });

  it('ignores a tap during a hop instead of queueing it', async () => {
    const { game, tapAt, view } = round();
    const pads = alongPads(view);
    game.busy = true;
    await tapAt(game.pond, pads[4].x, pads[4].y);
    expect(game.taps).toBe(0);
    expect(game.at).toBe(0);
  });

  it("has a bot that taps pads 1, 3, 5, 2, 4, 5 at each pad's centre", async () => {
    const { game, finish, tapAt, view } = round(computeView(390, 844, undefined, true));
    const seen: number[] = [];
    for (let t = 0; t < ALONG_TAPS; t++) {
      const move = game.autotouch()!;
      expect(move).not.toBeNull();
      const spot = 'tap' in move ? move.tap : null;
      expect(spot?.on).toBe(game.pond);
      await tapAt(game.pond, spot!.x!, spot!.y!);
      seen.push(game.at);
    }
    expect(seen).toEqual([...ALONG_BOT]);
    expect(finish).toHaveBeenCalledTimes(1);
    expect(game.autotouch()).toBeNull();
    void view;
  });
});
