import { describe, expect, it } from 'vitest';
import type { ColorName } from '../../art/palette';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  catcher,
  copy,
  failureLine,
  friendCount,
  guidance,
  initial,
  layout,
  LEVELS,
  looks,
  PLANS,
  SeedRound,
  SEEDS,
  SHAPES,
  sharedResult,
  trace,
  type Construction,
  type Place,
} from './logic';

describe('Shape Buddies', () => {
  it('accepts both identities and both bridge shapes, with exactly the functional roles required', () => {
    for (const a of SHAPES)
      for (const b of SHAPES)
        for (const swapped of [false, true]) {
          const s = initial();
          s.friends = [
            { shape: a, place: swapped ? 'receiver' : 'bridge' },
            { shape: b, place: swapped ? 'bridge' : 'receiver' },
          ];
          const bridge = swapped ? b : a,
            cup = swapped ? a : b;
          expect(trace(s)).toBe(
            !['flatten', 'slope'].includes(bridge) ? 'bridge' : cup === 'scoop' ? 'caught' : 'receiver',
          );
        }
    expect(trace(initial())).toBe('bridge');
  });
  it('guidance solves every legal arrangement without evicting a friend or prescribing an identity', () => {
    for (const a of SHAPES)
      for (const b of SHAPES)
        for (const p of ['park', 'bridge', 'receiver'] as const)
          for (const q of ['park', 'bridge', 'receiver'] as const) {
            if (p !== 'park' && p === q) continue;
            const s = initial();
            s.friends = [
              { shape: a, place: p },
              { shape: b, place: q },
            ];
            for (let n = 0; n < 2; n++) {
              const g = guidance(s);
              if (!g) break;
              s.friends[g.friend] = { shape: g.shape, place: g.dock };
            }
            expect(trace(s)).toBe('caught');
          }
  });
  it('rejects occupied docks and restores shape, placement and selection with undo', () => {
    const r = new SeedRound();
    r.edit('flatten', 'bridge');
    r.select(1);
    const before = copy(r.state);
    expect(r.edit('scoop', 'bridge')).toBe(false);
    expect(r.state).toEqual(before);
    r.edit('scoop', 'receiver');
    expect(r.undo()).toBe(true);
    expect(r.state).toEqual(before);
  });
  it('keeps experiments free, deduplicates each role hint, locks animations and completes once', () => {
    const r = new SeedRound();
    for (let n = 0; n < 3; n++) {
      expect(r.trySeed()).toBe('bridge');
      expect(r.edit('flatten')).toBe(false);
      r.settle('bridge');
    }
    expect(r.hints).toBe(1);
    r.help();
    expect(r.hints).toBe(1);
    r.edit('slope', 'bridge');
    r.select(1);
    r.help();
    expect(r.hints).toBe(2);
    r.edit('scoop', 'receiver');
    const built = copy(r.state);
    r.trySeed();
    r.settle('caught');
    r.replay();
    expect(r.state).toEqual(built);
    r.trySeed();
    r.settle('caught');
    expect(r.carry()).toBe(true);
    expect(r.carry()).toBe(false);
    expect(r.finish()).toBe(true);
    expect(r.finish()).toBe(false);
    expect(r.misses).toBe(0);
  });
  it('undo after a caught seed returns it to the chute before changing the construction', () => {
    const r = new SeedRound();
    r.edit('flatten', 'bridge');
    r.select(1);
    r.edit('scoop', 'receiver');
    r.trySeed();
    r.settle('caught');
    r.undo();
    expect(r.phase).toBe('edit');
    expect(trace(r.state)).toBe('receiver');
  });
  it('keeps all controls separate, at least 100 units and clear of shell corners in four views', () => {
    for (const [w, h] of [
      [1024, 768],
      [768, 1024],
      [844, 390],
      [750, 369],
    ]) {
      const v = computeView(w, h),
        l = layout(v.w, v.h);
      const boxes = [
        { ...l.bridge, w: 180, h: 110 },
        { ...l.receiver, w: 110, h: 110 },
        { ...l.pot, w: 120, h: 120 },
        ...l.parks.map((p) => ({ ...p, w: 140, h: 110 })),
        ...l.tools.map((p) => ({ ...p, w: 130, h: 110 })),
        ...l.buttons.map((p) => ({ ...p, w: 150, h: 110 })),
      ];
      for (const [i, a] of boxes.entries()) {
        expect(a.x - a.w / 2).toBeGreaterThan(150);
        expect(a.x + a.w / 2).toBeLessThan(v.w);
        expect(a.y - a.h / 2).toBeGreaterThan(100);
        expect(a.y + a.h / 2).toBeLessThan(v.h);
        for (const b of boxes.slice(i + 1))
          expect(Math.abs(a.x - b.x) >= (a.w + b.w) / 2 || Math.abs(a.y - b.y) >= (a.h + b.h) / 2).toBe(true);
      }
    }
  });
  describe('level 2, a step down', () => {
    const build = (a: Construction['friends'][number], b: Construction['friends'][number]) => {
      const s = initial();
      s.friends = [a, b];
      return s;
    };
    it('only a slope reaches the low bank; every other arrangement names its first unsupported role', () => {
      for (const a of SHAPES)
        for (const b of SHAPES)
          for (const swapped of [false, true]) {
            const s = build(
              { shape: a, place: swapped ? 'receiver' : 'bridge' },
              { shape: b, place: swapped ? 'bridge' : 'receiver' },
            );
            const bridge = swapped ? b : a,
              cup = swapped ? a : b;
            expect(trace(s, 2)).toBe(bridge !== 'slope' ? 'bridge' : cup === 'scoop' ? 'caught' : 'receiver');
          }
      const flat = build({ shape: 'flatten', place: 'bridge' }, { shape: 'scoop', place: 'receiver' });
      expect(trace(flat, 2)).toBe('bridge');
      expect(trace(flat, 1)).toBe('caught');
      expect(trace(flat)).toBe('caught');
    });
    it('guidance reaches caught from every legal arrangement, including a level-1 solution, suggesting Slope', () => {
      expect(guidance(initial(), 2)?.shape).toBe('slope');
      expect(guidance(initial(), 1)?.shape).toBe('flatten');
      for (const a of SHAPES)
        for (const b of SHAPES)
          for (const p of ['park', 'bridge', 'receiver'] as const)
            for (const q of ['park', 'bridge', 'receiver'] as const) {
              if (p !== 'park' && p === q) continue;
              const s = build({ shape: a, place: p }, { shape: b, place: q });
              for (let n = 0; n < 2; n++) {
                const g = guidance(s, 2);
                if (!g) break;
                s.friends[g.friend] = { shape: g.shape, place: g.dock };
              }
              expect(trace(s, 2)).toBe('caught');
            }
    });
    it('a flat bridge fails at level 2, the hint counts once per role, and misses stay 0', () => {
      const r = new SeedRound(2);
      r.edit('flatten', 'bridge');
      r.select(1);
      r.edit('scoop', 'receiver');
      for (let n = 0; n < 3; n++) {
        expect(r.trySeed()).toBe('bridge');
        r.settle('bridge');
      }
      expect(r.hints).toBe(1);
      r.help();
      expect(r.hints).toBe(1);
      r.select(0);
      r.edit('slope');
      expect(r.trySeed()).toBe('caught');
      r.settle('caught');
      expect(r.carry()).toBe(true);
      expect(r.finish()).toBe(true);
      expect([r.misses, r.hints]).toEqual([0, 1]);
    });
    it('raises only the bridge dock, keeping every other box where level 1 has it, separate and at least 100 units', () => {
      for (const [w, h] of [
        [1024, 768],
        [768, 1024],
        [844, 390],
        [750, 369],
      ]) {
        const v = computeView(w, h),
          one = layout(v.w, v.h, 1),
          l = layout(v.w, v.h, 2);
        expect(l.bridge).toEqual({ x: one.bridge.x, y: one.bridge.y - 50 });
        expect({ ...l, bridge: one.bridge }).toEqual(one);
        const boxes = [
          { ...l.bridge, w: 180, h: 110 },
          { ...l.receiver, w: 110, h: 110 },
          { ...l.pot, w: 120, h: 120 },
          ...l.parks.map((p) => ({ ...p, w: 140, h: 110 })),
          ...l.tools.map((p) => ({ ...p, w: 130, h: 110 })),
          ...l.buttons.map((p) => ({ ...p, w: 150, h: 110 })),
        ];
        for (const [i, a] of boxes.entries()) {
          expect(a.y - a.h / 2).toBeGreaterThan(100);
          for (const b of boxes.slice(i + 1))
            expect(Math.abs(a.x - b.x) >= (a.w + b.w) / 2 || Math.abs(a.y - b.y) >= (a.h + b.h) / 2).toBe(
              true,
            );
        }
      }
    });
  });
  describe('level 3, two make one', () => {
    const build = (a: Construction['friends'][number], b: Construction['friends'][number]) => {
      const s = initial();
      s.friends = [a, b];
      return s;
    };
    const PLACES: Place[] = ['park', 'bridge', 'receiver'];
    const all = function* () {
      for (const a of SHAPES)
        for (const b of SHAPES)
          for (const p of PLACES)
            for (const q of PLACES) {
              if (p !== 'park' && p === q) continue;
              yield build({ shape: a, place: p }, { shape: b, place: q });
            }
    };
    it('only a flat path with a cup at the end catches, in either identity; every other row names how it failed', () => {
      for (const s of all()) {
        const near = s.friends.find((f) => f.place === 'bridge')?.shape,
          end = s.friends.find((f) => f.place === 'receiver')?.shape;
        const expected =
          near === 'slope'
            ? 'buddies.joinSlope'
            : near !== 'flatten'
              ? 'buddies.joinPath'
              : end === undefined
                ? 'buddies.joinShort'
                : end !== 'scoop'
                  ? 'buddies.joinCup'
                  : null;
        expect(failureLine(s, 3)).toBe(expected);
        expect(trace(s, 3)).toBe(
          expected === null
            ? 'caught'
            : ['buddies.joinSlope', 'buddies.joinPath'].includes(expected)
              ? 'bridge'
              : 'receiver',
        );
      }
      expect(
        trace(build({ shape: 'flatten', place: 'bridge' }, { shape: 'scoop', place: 'receiver' }), 3),
      ).toBe('caught');
      expect(
        trace(build({ shape: 'scoop', place: 'receiver' }, { shape: 'flatten', place: 'bridge' }), 3),
      ).toBe('caught');
    });
    it('accepts a subset of level 1: flat then flat fails only at level 3, a slope path fails only at level 3', () => {
      for (const s of all()) if (trace(s, 3) === 'caught') expect(trace(s, 1)).toBe('caught');
      const flatFlat = build({ shape: 'flatten', place: 'bridge' }, { shape: 'flatten', place: 'receiver' });
      expect(trace(flatFlat, 3)).toBe('receiver');
      expect(failureLine(flatFlat, 3)).toBe('buddies.joinCup');
      const slope = build({ shape: 'slope', place: 'bridge' }, { shape: 'scoop', place: 'receiver' });
      expect(trace(slope, 1)).toBe('caught');
      expect(trace(slope, 3)).toBe('bridge');
    });
    it('keeps the level 1 and 2 lines the scene spoke before', () => {
      for (const s of all())
        for (const level of [1, 2]) {
          const failure = trace(s, level),
            flatBridge = s.friends.some((f) => f.place === 'bridge' && f.shape === 'flatten');
          const expected =
            failure === 'caught'
              ? null
              : failure === 'receiver'
                ? 'buddies.cup'
                : level === 1
                  ? 'buddies.bridge'
                  : flatBridge
                    ? 'buddies.stepFlat'
                    : 'buddies.stepBridge';
          expect(failureLine(s, level)).toBe(expected);
        }
    });
    it('guidance never returns -1 and reaches caught within four edits from every arrangement, at every level', () => {
      for (const level of Object.keys(PLANS).map(Number))
        for (const s of all()) {
          let n = 0;
          for (; n < 4; n++) {
            const g = guidance(s, level);
            if (!g) break;
            expect(g.friend).toBeGreaterThanOrEqual(0);
            s.friends[g.friend] = {
              shape: g.shape,
              place: g.dock,
              facing: g.facing ?? s.friends[g.friend].facing,
            };
          }
          expect(trace(s, level)).toBe('caught');
        }
      expect(guidance(initial(), 3)).toEqual({ friend: 0, shape: 'flatten', dock: 'bridge' });
    });
    it('a flat-then-flat spoon charges one hint for the end, never a miss', () => {
      const r = new SeedRound(3);
      r.edit('flatten', 'bridge');
      r.select(1);
      r.edit('flatten', 'receiver');
      for (let n = 0; n < 3; n++) {
        expect(r.trySeed()).toBe('receiver');
        r.settle('receiver');
      }
      expect(r.hints).toBe(1);
      r.help();
      expect(r.hints).toBe(1);
      r.edit('scoop');
      expect(r.trySeed()).toBe('caught');
      r.settle('caught');
      expect(r.carry()).toBe(true);
      expect(r.finish()).toBe(true);
      expect([r.misses, r.hints]).toEqual([0, 1]);
    });
    it('puts the halves side by side, separate, at least 100 units, and leaves levels 1 and 2 where they were', () => {
      for (const [w, h] of [
        [1024, 768],
        [768, 1024],
        [844, 390],
        [750, 369],
      ]) {
        const v = computeView(w, h),
          one = layout(v.w, v.h, 1),
          l = layout(v.w, v.h, 3),
          left = (v.w - 1024) / 2;
        expect([
          l.bridge.x - left,
          l.receiver.x - left,
          l.receiverWidth,
          one.receiverWidth,
          layout(v.w, v.h, 2).receiverWidth,
        ]).toEqual([380, 580, 180, 110, 110]);
        expect({
          ...l,
          bridge: one.bridge,
          receiver: one.receiver,
          receiverWidth: one.receiverWidth,
        }).toEqual(one);
        const boxes = [
          { ...l.bridge, w: 180, h: 110 },
          { ...l.receiver, w: l.receiverWidth, h: 110 },
          { ...l.pot, w: 120, h: 120 },
          ...l.parks.map((p) => ({ ...p, w: 140, h: 110 })),
          ...l.tools.map((p) => ({ ...p, w: 130, h: 110 })),
          ...l.buttons.map((p) => ({ ...p, w: 150, h: 110 })),
        ];
        for (const [i, a] of boxes.entries()) {
          expect(a.x - a.w / 2).toBeGreaterThan(150);
          expect(a.y - a.h / 2).toBeGreaterThan(100);
          expect(a.y + a.h / 2).toBeLessThan(v.h);
          for (const b of boxes.slice(i + 1))
            expect(Math.abs(a.x - b.x) >= (a.w + b.w) / 2 || Math.abs(a.y - b.y) >= (a.h + b.h) / 2).toBe(
              true,
            );
        }
        // Drop radii (90 each) around the two halves never overlap.
        expect(l.receiver.x - l.bridge.x).toBeGreaterThan(180);
      }
    });
  });
  describe('level 4, down and catch', () => {
    const build = (a: Construction['friends'][number], b: Construction['friends'][number]) => {
      const s = initial();
      s.friends = [a, b];
      return s;
    };
    const PLACES: Place[] = ['park', 'bridge', 'receiver'];
    const all = function* () {
      for (const a of SHAPES)
        for (const b of SHAPES)
          for (const p of PLACES)
            for (const q of PLACES) {
              if (p !== 'park' && p === q) continue;
              yield build({ shape: a, place: p }, { shape: b, place: q });
            }
    };
    it('exactly a slope near half and a cup far half catch, in either identity; every other row names its first failing role', () => {
      let caught = 0;
      for (const s of all()) {
        const near = s.friends.find((f) => f.place === 'bridge')?.shape,
          end = s.friends.find((f) => f.place === 'receiver')?.shape;
        const expected =
          near === 'flatten'
            ? 'buddies.downFlat'
            : near !== 'slope'
              ? 'buddies.downPath'
              : end === undefined
                ? 'buddies.joinShort'
                : end !== 'scoop'
                  ? 'buddies.joinCup'
                  : null;
        expect(failureLine(s, 4)).toBe(expected);
        expect(trace(s, 4)).toBe(
          expected === null
            ? 'caught'
            : ['buddies.downFlat', 'buddies.downPath'].includes(expected)
              ? 'bridge'
              : 'receiver',
        );
        if (expected === null) caught++;
      }
      expect(caught).toBe(2);
      expect(
        trace(build({ shape: 'scoop', place: 'receiver' }, { shape: 'slope', place: 'bridge' }), 4),
      ).toBe('caught');
    });
    it("keeps level 3's joined lines, and level 3's spoon fails at level 4 with the flat line", () => {
      const spoon = build({ shape: 'flatten', place: 'bridge' }, { shape: 'scoop', place: 'receiver' });
      expect(trace(spoon, 3)).toBe('caught');
      expect(failureLine(spoon, 4)).toBe('buddies.downFlat');
      const sloped = build({ shape: 'slope', place: 'bridge' }, { shape: 'scoop', place: 'receiver' });
      expect(failureLine(sloped, 3)).toBe('buddies.joinSlope');
      expect(trace(sloped, 4)).toBe('caught');
      for (const s of all())
        expect(['buddies.downFlat', 'buddies.downPath']).not.toContain(failureLine(s, 3));
    });
    it('guidance suggests a slope to the near half first, then a cup to the far half', () => {
      expect(guidance(initial(), 4)).toEqual({ friend: 0, shape: 'slope', dock: 'bridge' });
      expect(
        guidance(build({ shape: 'slope', place: 'bridge' }, { shape: 'plain', place: 'park' }), 4),
      ).toEqual({ friend: 1, shape: 'scoop', dock: 'receiver' });
    });
    it('a flat path first charges one hint for the near half, never a miss', () => {
      const r = new SeedRound(4);
      r.edit('flatten', 'bridge');
      r.select(1);
      r.edit('scoop', 'receiver');
      for (let n = 0; n < 2; n++) {
        expect(r.trySeed()).toBe('bridge');
        r.settle('bridge');
      }
      expect(r.hints).toBe(1);
      r.select(0);
      r.edit('slope');
      expect(r.trySeed()).toBe('caught');
      r.settle('caught');
      expect(r.carry()).toBe(true);
      expect(r.finish()).toBe(true);
      expect([r.misses, r.hints]).toEqual([0, 1]);
    });
    it("raises the near half by level 2's step and keeps level 3's halves otherwise, separate and at least 100 units", () => {
      for (const [w, h] of [
        [1024, 768],
        [768, 1024],
        [844, 390],
        [750, 369],
      ]) {
        const v = computeView(w, h),
          three = layout(v.w, v.h, 3),
          l = layout(v.w, v.h, 4);
        expect(l).toEqual({ ...three, bridge: { ...three.bridge, y: layout(v.w, v.h, 2).bridge.y } });
        const boxes = [
          { ...l.bridge, w: 180, h: 110 },
          { ...l.receiver, w: l.receiverWidth, h: 110 },
          { ...l.pot, w: 120, h: 120 },
          ...l.parks.map((p) => ({ ...p, w: 140, h: 110 })),
          ...l.tools.map((p) => ({ ...p, w: 130, h: 110 })),
          ...l.buttons.map((p) => ({ ...p, w: 150, h: 110 })),
        ];
        for (const [i, a] of boxes.entries()) {
          expect(a.x - a.w / 2).toBeGreaterThan(150);
          expect(a.y - a.h / 2).toBeGreaterThan(100);
          expect(a.y + a.h / 2).toBeLessThan(v.h);
          for (const b of boxes.slice(i + 1))
            expect(Math.abs(a.x - b.x) >= (a.w + b.w) / 2 || Math.abs(a.y - b.y) >= (a.h + b.h) / 2).toBe(
              true,
            );
        }
      }
    });
  });
  describe('level 5, a cup on the ledge', () => {
    const build = (a: Construction['friends'][number], b: Construction['friends'][number]) => {
      const s = initial();
      s.friends = [a, b];
      return s;
    };
    const PLACES: Place[] = ['park', 'bridge', 'receiver'];
    const all = function* () {
      for (const a of SHAPES)
        for (const b of SHAPES)
          for (const p of PLACES)
            for (const q of PLACES) {
              if (p !== 'park' && p === q) continue;
              yield build({ shape: a, place: p }, { shape: b, place: q });
            }
    };
    const working = (s: Construction, i: number) => {
      const f = s.friends[i];
      return (
        (f.place === 'bridge' && ['flatten', 'slope'].includes(f.shape)) ||
        (f.place === 'receiver' && f.shape === 'scoop')
      );
    };
    it('catches exactly the two families: a bridge and a cup at the catch, or a cup on the ledge with the other friend anything', () => {
      let ledge = 0,
        bridged = 0;
      for (const s of all()) {
        const gap = s.friends.find((f) => f.place === 'bridge')?.shape,
          end = s.friends.find((f) => f.place === 'receiver')?.shape;
        const expected =
          gap === 'scoop'
            ? 'bridge'
            : (gap === 'flatten' || gap === 'slope') && end === 'scoop'
              ? 'receiver'
              : null;
        expect(catcher(s, 5)).toBe(expected);
        expect(trace(s, 5)).toBe(
          expected ? 'caught' : gap === 'flatten' || gap === 'slope' ? 'receiver' : 'bridge',
        );
        expect(failureLine(s, 5)).toBe(
          expected ? null : gap === 'flatten' || gap === 'slope' ? 'buddies.cup' : 'buddies.ledgeNeed',
        );
        if (expected === 'bridge') ledge++;
        else if (expected === 'receiver') bridged++;
      }
      // A cup on the ledge with the other friend parked in any shape, or at the catch in any shape, in either identity.
      expect(ledge).toBe(2 * SHAPES.length * 2);
      expect(bridged).toBe(2 * 2);
    });
    it('a cup over level 1 open water still falls, and two cups catch in the gap first', () => {
      const cupInGap = build({ shape: 'scoop', place: 'bridge' }, { shape: 'plain', place: 'park' });
      expect(trace(cupInGap, 1)).toBe('bridge');
      expect(catcher(cupInGap, 1)).toBeNull();
      expect(trace(cupInGap, 5)).toBe('caught');
      expect(
        catcher(build({ shape: 'scoop', place: 'bridge' }, { shape: 'scoop', place: 'receiver' }), 5),
      ).toBe('bridge');
      expect(
        catcher(build({ shape: 'slope', place: 'bridge' }, { shape: 'scoop', place: 'receiver' }), 5),
      ).toBe('receiver');
      for (const level of [1, 2, 3, 4])
        for (const s of all())
          expect(catcher(s, level)).toBe(trace(s, level) === 'caught' ? 'receiver' : null);
    });
    it('guidance finishes what she started and never changes a friend already in a working role', () => {
      for (const s of all()) {
        const g = guidance(s, 5);
        if (!g) continue;
        expect(working(s, g.friend)).toBe(false);
        const gapBridge = s.friends.some(
          (f) => f.place === 'bridge' && ['flatten', 'slope'].includes(f.shape),
        );
        expect(g).toMatchObject(
          gapBridge ? { shape: 'scoop', dock: 'receiver' } : { shape: 'scoop', dock: 'bridge' },
        );
        s.friends[g.friend] = { shape: g.shape, place: g.dock };
        expect(trace(s, 5)).toBe('caught');
      }
      expect(guidance(initial(), 5)).toEqual({ friend: 0, shape: 'scoop', dock: 'bridge' });
    });
    it('the carry starts from whichever dock caught, with no miss and the hint charged once', () => {
      const r = new SeedRound(5);
      r.edit('plain', 'bridge');
      r.edit('flatten');
      for (let n = 0; n < 2; n++) {
        expect(r.trySeed()).toBe('receiver');
        r.settle('receiver');
      }
      expect(r.hints).toBe(1);
      r.select(1);
      r.edit('scoop', 'receiver');
      expect(r.trySeed()).toBe('caught');
      r.settle('caught');
      expect(catcher(r.state, 5)).toBe('receiver');
      const s = new SeedRound(5);
      s.edit('scoop', 'bridge');
      expect(s.trySeed()).toBe('caught');
      s.settle('caught');
      expect(catcher(s.state, 5)).toBe('bridge');
      expect(s.carry()).toBe(true);
      expect(s.finish()).toBe(true);
      expect([s.misses, s.hints]).toEqual([0, 0]);
    });
    it('keeps level 1 geometry, so every box stays separate and at least 100 units', () => {
      for (const [w, h] of [
        [1024, 768],
        [768, 1024],
        [844, 390],
        [750, 369],
      ]) {
        const v = computeView(w, h);
        expect(layout(v.w, v.h, 5)).toEqual(layout(v.w, v.h, 1));
      }
    });
  });
  describe('level 6, which way round', () => {
    const PLACES: Place[] = ['park', 'bridge', 'receiver'];
    const FACINGS = [1, -1] as const;
    const all = function* () {
      for (const a of SHAPES)
        for (const b of SHAPES)
          for (const p of PLACES)
            for (const q of PLACES)
              for (const fa of FACINGS)
                for (const fb of FACINGS) {
                  if (p !== 'park' && p === q) continue;
                  const s = initial();
                  s.friends = [
                    { shape: a, place: p, facing: fa },
                    { shape: b, place: q, facing: fb },
                  ];
                  yield s;
                }
    };
    it('mirrors level 2: exactly a slope turned toward the low bank plus a cup catches, in either identity; an unturned slope says Turn', () => {
      let caught = 0;
      for (const s of all()) {
        const gap = s.friends.find((f) => f.place === 'bridge'),
          end = s.friends.find((f) => f.place === 'receiver');
        const good = gap?.shape === 'slope' && gap.facing === -1;
        expect(trace(s, 6)).toBe(!good ? 'bridge' : end?.shape === 'scoop' ? 'caught' : 'receiver');
        expect(failureLine(s, 6)).toBe(
          good
            ? end?.shape === 'scoop'
              ? null
              : 'buddies.cup'
            : gap?.shape === 'slope'
              ? 'buddies.turnSlope'
              : gap?.shape === 'flatten'
                ? 'buddies.stepFlat'
                : 'buddies.stepBridge',
        );
        if (trace(s, 6) === 'caught') {
          caught++;
          expect(catcher(s, 6)).toBe('receiver');
        }
        // Facing never matters before level 6, where Turn is not offered: a level-2 answer still needs a slope as drawn.
        if (s.friends.every((f) => f.facing === 1)) expect(trace(s, 6) === 'caught').toBe(false);
      }
      // A turned slope and a cup in either identity, with the cup facing either way.
      expect(caught).toBe(2 * 2);
    });
    it('turning twice restores the friend, a turn is undoable, free, and offered only at level 6', () => {
      const r = new SeedRound(6);
      r.edit('slope', 'bridge');
      const before = copy(r.state);
      expect(r.turn()).toBe(true);
      expect(r.state.friends[0].facing).toBe(-1);
      expect(r.turn()).toBe(true);
      expect(r.state).toEqual(before);
      r.turn();
      expect(r.undo()).toBe(true);
      expect(r.state).toEqual(before);
      expect([r.misses, r.hints]).toEqual([0, 0]);
      for (const level of [1, 2, 3, 4, 5]) {
        const o = new SeedRound(level);
        expect(o.turn()).toBe(false);
        expect(o.state).toEqual(initial());
      }
    });
    it("guidance from an unturned slope at the gap is that friend's Turn, and from any state reaches caught within four edits", () => {
      const s = initial();
      s.friends = [
        { shape: 'slope', place: 'bridge', facing: 1 },
        { shape: 'scoop', place: 'receiver', facing: 1 },
      ];
      expect(guidance(s, 6)).toEqual({ friend: 0, shape: 'slope', dock: 'bridge', facing: -1 });
      expect(guidance(initial(), 6)).toEqual({ friend: 0, shape: 'slope', dock: 'bridge', facing: -1 });
      for (const t of all()) {
        for (let n = 0; n < 4; n++) {
          const g = guidance(t, 6);
          if (!g) break;
          t.friends[g.friend] = {
            shape: g.shape,
            place: g.dock,
            facing: g.facing ?? t.friends[g.friend].facing,
          };
        }
        expect(trace(t, 6)).toBe('caught');
      }
    });
    it('an unturned slope charges one hint for the bridge after two Tries, never a miss, and a Turn finishes it', () => {
      const r = new SeedRound(6);
      r.edit('slope', 'bridge');
      r.select(1);
      r.edit('scoop', 'receiver');
      for (let n = 0; n < 2; n++) {
        expect(r.trySeed()).toBe('bridge');
        r.settle('bridge');
      }
      expect(r.hints).toBe(1);
      r.select(0);
      r.turn();
      expect(r.trySeed()).toBe('caught');
      r.settle('caught');
      expect(r.carry()).toBe(true);
      expect(r.finish()).toBe(true);
      expect([r.misses, r.hints]).toEqual([0, 1]);
    });
    it('mirrors the stream with Turn as a fourth button: every box separate, at least 100 units and clear of the shell corners in four views', () => {
      for (const [w, h] of [
        [1024, 768],
        [768, 1024],
        [844, 390],
        [750, 369],
      ]) {
        const v = computeView(w, h),
          two = layout(v.w, v.h, 2),
          l = layout(v.w, v.h, 6),
          left = (v.w - 1024) / 2;
        expect([l.bridge.x - left, l.receiver.x - left, l.pot.x - left, l.bridge.y]).toEqual([
          690,
          460,
          220,
          two.bridge.y,
        ]);
        expect([l.receiver.x - l.bridge.x, l.pot.x - l.bridge.x]).toEqual([
          two.bridge.x - two.receiver.x,
          two.bridge.x - two.pot.x,
        ]);
        expect(l.buttons).toHaveLength(4);
        expect(two.buttons).toHaveLength(3);
        const boxes = [
          { ...l.bridge, w: 180, h: 110 },
          { ...l.receiver, w: 110, h: 110 },
          { ...l.pot, w: 120, h: 120 },
          ...l.parks.map((p) => ({ ...p, w: 140, h: 110 })),
          ...l.tools.map((p) => ({ ...p, w: 130, h: 110 })),
          ...l.buttons.map((p) => ({ ...p, w: 150, h: 110 })),
        ];
        for (const [i, a] of boxes.entries()) {
          expect(a.x - a.w / 2).toBeGreaterThan(150);
          expect(a.x + a.w / 2).toBeLessThan(v.w);
          expect(a.y - a.h / 2).toBeGreaterThan(100);
          expect(a.y + a.h / 2).toBeLessThan(v.h);
          for (const b of boxes.slice(i + 1))
            expect(Math.abs(a.x - b.x) >= (a.w + b.w) / 2 || Math.abs(a.y - b.y) >= (a.h + b.h) / 2).toBe(
              true,
            );
        }
        // Drop radii (90 at the bridge, 70 at the catch) never overlap.
        expect(l.bridge.x - l.receiver.x).toBeGreaterThan(160);
      }
    });
  });
  describe('level 7, one friend, one job', () => {
    /** The only legal states: the first friend in any shape, parked or at the catch; the second plain and parked. */
    const legal = () =>
      SHAPES.flatMap((shape) =>
        (['park', 'receiver'] as const).map((place) => {
          const s = initial();
          s.friends[0] = { shape, place, facing: 1 };
          return s;
        }),
      );
    it('over the plank, only a cup at the catch is caught; a flat or slope rolls off, plain or empty needs a cup', () => {
      for (const s of legal()) {
        const f = s.friends[0],
          cup = f.place === 'receiver' && f.shape === 'scoop';
        expect(trace(s, 7)).toBe(cup ? 'caught' : 'receiver');
        expect(catcher(s, 7)).toBe(cup ? 'receiver' : null);
        expect(failureLine(s, 7)).toBe(
          cup
            ? null
            : f.place === 'receiver' && (f.shape === 'flatten' || f.shape === 'slope')
              ? 'buddies.oneRoll'
              : 'buddies.cup',
        );
      }
      expect(friendCount(7)).toBe(1);
      for (const level of [1, 2, 3, 4, 5, 6]) expect(friendCount(level)).toBe(2);
    });
    it('guidance names the one friend, a Cup and the catch, and reaches caught within two edits from every state', () => {
      for (const s of legal()) {
        let edits = 0;
        for (let n = 0; n < 2; n++) {
          const g = guidance(s, 7);
          if (!g) break;
          expect(g).toEqual({ friend: 0, shape: 'scoop', dock: 'receiver' });
          if (s.friends[0].shape !== g.shape) {
            s.friends[0].shape = g.shape;
            edits++;
          }
          if (s.friends[0].place !== g.dock) {
            s.friends[0].place = g.dock;
            edits++;
          }
        }
        expect(trace(s, 7)).toBe('caught');
        expect(edits).toBeLessThanOrEqual(2);
      }
    });
    it('the plank is not a friend: the bridge dock refuses her friend and the second friend cannot be chosen', () => {
      const r = new SeedRound(7);
      expect(r.edit('scoop', 'bridge')).toBe(false);
      expect(r.state).toEqual(initial());
      r.select(1);
      expect(r.state.selected).toBe(0);
      expect(r.edit('scoop', 'receiver')).toBe(true);
      expect(r.state.friends[1]).toEqual({ shape: 'plain', place: 'park', facing: 1 });
      const two = new SeedRound(1);
      two.select(1);
      expect(two.state.selected).toBe(1);
    });
    it('a flat friend at the catch first charges one hint at most, never a miss, and a Cup finishes it', () => {
      const r = new SeedRound(7);
      r.edit('flatten', 'receiver');
      for (let n = 0; n < 3; n++) {
        expect(r.trySeed()).toBe('receiver');
        r.settle('receiver');
      }
      expect(r.hints).toBe(1);
      r.help();
      expect(r.hints).toBe(1);
      r.edit('scoop');
      expect(r.trySeed()).toBe('caught');
      r.settle('caught');
      expect(r.carry()).toBe(true);
      expect(r.finish()).toBe(true);
      expect(r.misses).toBe(0);
    });
  });
  describe('level 8, your friend, my friend', () => {
    const PLACES = ['park', 'bridge', 'receiver'] as const;
    const legal = () =>
      SHAPES.flatMap((a) =>
        SHAPES.flatMap((b) =>
          PLACES.flatMap((p) =>
            PLACES.filter((q) => p === 'park' || p !== q).map((q) => {
              const s = initial();
              s.friends = [
                { shape: a, place: p, facing: 1 },
                { shape: b, place: q, facing: 1 },
              ];
              return s;
            }),
          ),
        ),
      );
    const fresh = (seats: 'two' | 'solo', s?: Construction, holder = 0) => {
      const r = new SeedRound(8);
      r.choose(seats);
      if (s) r.state = copy(s);
      r.holder = holder;
      r.state.selected = holder;
      return r;
    };
    /** A player pair under the turn rule: returns the tries and how many were only hand-offs. */
    const play = (r: SeedRound) => {
      let tries = 0,
        handOffs = 0,
        edits = 0;
      for (let n = 0; n < 20 && r.phase !== 'caught'; n++) {
        const g = guidance(r.state, 8);
        if (!g || g.friend !== r.holder) {
          tries++;
          if (g) handOffs++;
          expect(r.trySeed()).not.toBeNull();
          r.settle(trace(r.state, 8));
          continue;
        }
        if (r.state.friends[g.friend].shape !== g.shape && r.edit(g.shape)) edits++;
        expect(r.drop(g.dock)).toBe(true);
        edits++;
      }
      return { tries, handOffs, edits };
    };
    it("accepts exactly level 3's set", () => {
      for (const s of legal()) {
        expect(trace(s, 8)).toBe(trace(s, 3));
        expect(catcher(s, 8)).toBe(catcher(s, 3));
        expect(failureLine(s, 8)).toBe(failureLine(s, 3));
        expect(guidance(s, 8)).toEqual(guidance(s, 3));
      }
    });
    it('is not editable until the seat question is answered, and the answer lasts', () => {
      const r = new SeedRound(8),
        before = copy(r.state);
      r.select(1);
      expect(r.edit('flatten', 'bridge')).toBe(false);
      expect(r.drop('bridge')).toBe(false);
      expect(r.trySeed()).toBe('bridge');
      expect(r.state).toEqual(before);
      const q = new SeedRound(8);
      expect(q.editable).toBe(false);
      q.choose('two');
      expect(q.editable).toBe(true);
      q.choose('solo');
      expect(q.seats).toBe('two');
      expect(new SeedRound(3).editable).toBe(true);
    });
    it('two of us: only the holder can be chosen or changed', () => {
      const r = fresh('two'),
        before = copy(r.state);
      r.select(1);
      expect(r.state).toEqual(before);
      r.state.selected = 1;
      expect(r.edit('flatten', 'bridge')).toBe(false);
      r.state.selected = 0;
      expect(r.state).toEqual({ ...before, selected: 0 });
      r.edit('flatten');
      r.edit('flatten', 'bridge');
      expect(r.state.friends[0]).toMatchObject({ shape: 'flatten', place: 'bridge' });
    });
    it('just me: never refused, behaves like level 3', () => {
      const r = fresh('solo'),
        c = new SeedRound(3);
      for (const x of [r, c]) {
        x.select(1);
        expect(x.state.selected).toBe(1);
        x.edit('scoop', 'receiver');
        expect(x.trySeed()).toBe('bridge');
        x.settle('bridge');
      }
      expect(r.state).toEqual(c.state);
      expect(r.holder).toBe(0);
      expect(r.state.selected).toBe(1);
      expect(r.locked).toBe(false);
      expect(r.drop('bridge')).toBe(true);
      expect(r.state.selected).toBe(1);
      expect(r.holder).toBe(0);
    });
    it('two of us: a shape change keeps the turn, every drop passes it, a blocked drop does not', () => {
      const r = fresh('two');
      expect(r.edit('flatten')).toBe(true);
      expect(r.holder).toBe(0);
      expect(r.drop('bridge')).toBe(true);
      expect([r.holder, r.state.selected]).toEqual([1, 1]);
      expect(r.drop('bridge')).toBe(false);
      expect(r.holder).toBe(1);
      expect(r.drop('receiver')).toBe(true);
      expect([r.holder, r.state.selected]).toEqual([0, 0]);
      expect(r.drop('bridge')).toBe(true);
      expect(r.holder).toBe(1);
      expect(r.drop('receiver')).toBe(true);
      expect(r.holder).toBe(0);
      expect(r.drop('park')).toBe(true);
      expect(r.holder).toBe(1);
      expect(r.drop('park')).toBe(true);
      expect(r.holder).toBe(0);
    });
    it('the turn follows a failed Try and a hint to the friend guidance names; Undo and Replay restore it', () => {
      for (const s of legal()) {
        if (!guidance(s, 8)) continue;
        const r = fresh('two', s, 0),
          want = guidance(s, 8)!.friend;
        r.trySeed();
        r.settle(trace(s, 8));
        expect(r.holder).toBe(want);
        expect(r.state.selected).toBe(want);
        const h = fresh('two', s, 1);
        h.help();
        expect(h.holder).toBe(want);
      }
      const r = fresh('two');
      r.edit('flatten');
      r.drop('bridge');
      expect(r.holder).toBe(1);
      expect(r.undo()).toBe(true);
      expect(r.holder).toBe(0);
      expect(r.state.friends[0].place).toBe('park');
      expect(r.state.friends[0].shape).toBe('flatten');
      r.drop('park');
      r.undo();
      expect(r.holder).toBe(0);
      const c = fresh('two');
      play(c);
      c.settle('caught');
      expect(c.phase).toBe('caught');
      c.state.selected = 1;
      c.holder = 1;
      c.replay();
      expect(c.holder).toBe(0);
      expect(c.state.selected).toBe(0);
    });
    it('a pair obeying the turn rule finishes: four edits and one Try from the start, two Tries from every legal construction', () => {
      const r = fresh('two');
      const out = play(r);
      expect(out).toEqual({ tries: 1, handOffs: 0, edits: 4 });
      for (const s of legal())
        for (const holder of [0, 1]) {
          const x = fresh('two', s, holder),
            o = play(x);
          expect(x.phase === 'caught' || trace(x.state, 8) === 'caught').toBe(true);
          expect(o.tries).toBeLessThanOrEqual(2);
        }
    });
    it("sharedResult is never smooth with two seats and unchanged for Just me; her friend's hints alone count", () => {
      for (const h of [0, 1, 2, 5]) {
        expect(sharedResult(true, h)).toEqual({ misses: 0, hints: Math.max(h, 1) });
        expect(sharedResult(false, h)).toEqual({ misses: 0, hints: h });
      }
      for (const s of legal())
        for (const seats of ['two', 'solo'] as const) {
          const r = fresh(seats, s, 0);
          for (let n = 0; n < 6 && trace(r.state, 8) !== 'caught'; n++) {
            r.help();
            const g = guidance(r.state, 8)!;
            if (!g) break;
            r.state.friends[g.friend] = { shape: g.shape, place: g.dock, facing: 1 };
          }
          expect(r.hints).toBeLessThanOrEqual(2);
          if (seats === 'solo') expect(r.result()).toEqual({ misses: r.misses, hints: r.hints });
          else {
            expect(r.result().misses).toBe(0);
            expect(r.result().hints).toBeGreaterThanOrEqual(1);
            expect(r.result().hints).toBe(Math.max(r.hintsOnHers, 1));
          }
        }
      const r = fresh('two');
      r.help();
      expect(r.hints).toBe(1);
      expect(r.hintsOnHers).toBe(0 + (guidance(initial(), 8)!.friend === 0 ? 1 : 0));
      const p = fresh(
        'two',
        (() => {
          const s = initial();
          s.friends[0] = { shape: 'flatten', place: 'bridge', facing: 1 };
          return s;
        })(),
        0,
      );
      p.help();
      expect(guidance(p.state, 8)!.friend).toBe(1);
      expect(p.hints).toBe(1);
      expect(p.hintsOnHers).toBe(0);
      expect(p.result()).toEqual({ misses: 0, hints: 1 });
    });
    it('levels: 8 follows 3 in prek and school, school drops 7, preschool is 7 only', () => {
      const order = (b: 'prek' | 'school') => (LEVELS[b] as { order?: number[] }).order!;
      for (const b of ['prek', 'school'] as const) expect(order(b)[order(b).indexOf(3) + 1]).toBe(8);
      expect(order('school')).not.toContain(7);
      expect(order('prek')).toContain(7);
      expect(LEVELS.preschool).toEqual({ min: 7, max: 7 });
    });
    it('the two seat buttons (radius 56, tap margin 14) keep clear of everything and inside the view', () => {
      const hit = (
        c: { x: number; y: number },
        b: { x: number; y: number; w: number; h: number },
        r: number,
      ) => {
        const dx = Math.max(Math.abs(c.x - b.x) - b.w / 2, 0),
          dy = Math.max(Math.abs(c.y - b.y) - b.h / 2, 0);
        return dx * dx + dy * dy < r * r;
      };
      for (const [w, h] of [
        [1024, 768],
        [768, 1024],
        [844, 390],
        [750, 369],
      ]) {
        const v = computeView(w, h),
          l = layout(v.w, v.h, 8),
          R = 70;
        expect(l.seats).toHaveLength(2);
        const boxes = [
          { ...l.pot, w: 120, h: 120 },
          ...l.parks.map((p) => ({ ...p, w: 140, h: 110 })),
          ...l.tools.map((p) => ({ ...p, w: 130, h: 110 })),
          ...l.buttons.map((p) => ({ ...p, w: 150, h: 110 })),
        ];
        for (const [i, c] of l.seats.entries()) {
          expect(c.x - R).toBeGreaterThan(150);
          expect(c.x + R).toBeLessThan(v.w);
          expect(c.y - R).toBeGreaterThan(100);
          expect(c.y + R).toBeLessThan(v.h);
          for (const b of boxes) expect(hit(c, b, R)).toBe(false);
          for (const o of l.seats.slice(i + 1))
            expect(Math.hypot(c.x - o.x, c.y - o.y)).toBeGreaterThanOrEqual(2 * R);
        }
      }
    });
  });
  it('draws the seed kind after the friend colours, so every seed keeps its colours, and over seeds grows all three kinds', () => {
    const kinds = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) {
      const before = new Rng(seed).shuffle(['teal', 'purple', 'pink', 'blue'] as ColorName[]).slice(0, 2);
      const look = looks(new Rng(seed));
      expect(look.colors).toEqual(before);
      expect(SEEDS).toContain(look.seed);
      expect(looks(new Rng(seed))).toEqual(look);
      kinds.add(look.seed);
    }
    expect([...kinds].sort()).toEqual([...SEEDS].sort());
  });
});
