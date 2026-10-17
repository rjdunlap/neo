import { describe, expect, it } from 'vitest';
import { computeView } from '../../engine/view';
import { copy, guidance, initial, layout, SeedRound, SHAPES, trace, type Construction } from './logic';

describe('Shape Buddies', () => {
  it('accepts both identities and both bridge shapes, with exactly the functional roles required', () => {
    for (const a of SHAPES) for (const b of SHAPES) for (const swapped of [false, true]) {
      const s = initial();
      s.friends = [{ shape: a, place: swapped ? 'receiver' : 'bridge' }, { shape: b, place: swapped ? 'bridge' : 'receiver' }];
      const bridge = swapped ? b : a, cup = swapped ? a : b;
      expect(trace(s)).toBe(!['flatten', 'slope'].includes(bridge) ? 'bridge' : cup === 'scoop' ? 'caught' : 'receiver');
    }
    expect(trace(initial())).toBe('bridge');
  });
  it('guidance solves every legal arrangement without evicting a friend or prescribing an identity', () => {
    for (const a of SHAPES) for (const b of SHAPES) for (const p of ['park', 'bridge', 'receiver'] as const) for (const q of ['park', 'bridge', 'receiver'] as const) {
      if (p !== 'park' && p === q) continue;
      const s = initial(); s.friends = [{ shape: a, place: p }, { shape: b, place: q }];
      for (let n = 0; n < 2; n++) {
        const g = guidance(s); if (!g) break;
        s.friends[g.friend] = { shape: g.shape, place: g.dock };
      }
      expect(trace(s)).toBe('caught');
    }
  });
  it('rejects occupied docks and restores shape, placement and selection with undo', () => {
    const r = new SeedRound(); r.edit('flatten', 'bridge'); r.select(1);
    const before = copy(r.state);
    expect(r.edit('scoop', 'bridge')).toBe(false); expect(r.state).toEqual(before);
    r.edit('scoop', 'receiver'); expect(r.undo()).toBe(true); expect(r.state).toEqual(before);
  });
  it('keeps experiments free, deduplicates each role hint, locks animations and completes once', () => {
    const r = new SeedRound();
    for (let n = 0; n < 3; n++) {
      expect(r.trySeed()).toBe('bridge'); expect(r.edit('flatten')).toBe(false);
      r.settle('bridge');
    }
    expect(r.hints).toBe(1); r.help(); expect(r.hints).toBe(1);
    r.edit('slope', 'bridge'); r.select(1); r.help(); expect(r.hints).toBe(2);
    r.edit('scoop', 'receiver'); const built = copy(r.state);
    r.trySeed(); r.settle('caught'); r.replay(); expect(r.state).toEqual(built);
    r.trySeed(); r.settle('caught'); expect(r.carry()).toBe(true); expect(r.carry()).toBe(false);
    expect(r.finish()).toBe(true); expect(r.finish()).toBe(false); expect(r.misses).toBe(0);
  });
  it('undo after a caught seed returns it to the chute before changing the construction', () => {
    const r = new SeedRound(); r.edit('flatten', 'bridge'); r.select(1); r.edit('scoop', 'receiver');
    r.trySeed(); r.settle('caught'); r.undo(); expect(r.phase).toBe('edit'); expect(trace(r.state)).toBe('receiver');
  });
  it('keeps all controls separate, at least 100 units and clear of shell corners in four views', () => {
    for (const [w, h] of [[1024, 768], [768, 1024], [844, 390], [750, 369]]) {
      const v = computeView(w, h), l = layout(v.w, v.h);
      const boxes = [{ ...l.bridge, w: 180, h: 110 }, { ...l.receiver, w: 110, h: 110 }, { ...l.pot, w: 120, h: 120 }, ...l.parks.map(p => ({ ...p, w: 140, h: 110 })), ...l.tools.map(p => ({ ...p, w: 130, h: 110 })), ...l.buttons.map(p => ({ ...p, w: 150, h: 110 }))];
      for (const [i, a] of boxes.entries()) {
        expect(a.x - a.w / 2).toBeGreaterThan(150); expect(a.x + a.w / 2).toBeLessThan(v.w);
        expect(a.y - a.h / 2).toBeGreaterThan(100); expect(a.y + a.h / 2).toBeLessThan(v.h);
        for (const b of boxes.slice(i + 1)) expect(Math.abs(a.x - b.x) >= (a.w + b.w) / 2 || Math.abs(a.y - b.y) >= (a.h + b.h) / 2).toBe(true);
      }
    }
  });
  describe('level 2, a step down', () => {
    const build = (a: Construction['friends'][number], b: Construction['friends'][number]) => { const s = initial(); s.friends = [a, b]; return s; };
    it('only a slope reaches the low bank; every other arrangement names its first unsupported role', () => {
      for (const a of SHAPES) for (const b of SHAPES) for (const swapped of [false, true]) {
        const s = build({ shape: a, place: swapped ? 'receiver' : 'bridge' }, { shape: b, place: swapped ? 'bridge' : 'receiver' });
        const bridge = swapped ? b : a, cup = swapped ? a : b;
        expect(trace(s, 2)).toBe(bridge !== 'slope' ? 'bridge' : cup === 'scoop' ? 'caught' : 'receiver');
      }
      const flat = build({ shape: 'flatten', place: 'bridge' }, { shape: 'scoop', place: 'receiver' });
      expect(trace(flat, 2)).toBe('bridge'); expect(trace(flat, 1)).toBe('caught'); expect(trace(flat)).toBe('caught');
    });
    it('guidance reaches caught from every legal arrangement, including a level-1 solution, suggesting Slope', () => {
      expect(guidance(initial(), 2)?.shape).toBe('slope'); expect(guidance(initial(), 1)?.shape).toBe('flatten');
      for (const a of SHAPES) for (const b of SHAPES) for (const p of ['park', 'bridge', 'receiver'] as const) for (const q of ['park', 'bridge', 'receiver'] as const) {
        if (p !== 'park' && p === q) continue;
        const s = build({ shape: a, place: p }, { shape: b, place: q });
        for (let n = 0; n < 2; n++) { const g = guidance(s, 2); if (!g) break; s.friends[g.friend] = { shape: g.shape, place: g.dock }; }
        expect(trace(s, 2)).toBe('caught');
      }
    });
    it('a flat bridge fails at level 2, the hint counts once per role, and misses stay 0', () => {
      const r = new SeedRound(2); r.edit('flatten', 'bridge'); r.select(1); r.edit('scoop', 'receiver');
      for (let n = 0; n < 3; n++) { expect(r.trySeed()).toBe('bridge'); r.settle('bridge'); }
      expect(r.hints).toBe(1); r.help(); expect(r.hints).toBe(1);
      r.select(0); r.edit('slope'); expect(r.trySeed()).toBe('caught'); r.settle('caught');
      expect(r.carry()).toBe(true); expect(r.finish()).toBe(true); expect([r.misses, r.hints]).toEqual([0, 1]);
    });
    it('raises only the bridge dock, keeping every other box where level 1 has it, separate and at least 100 units', () => {
      for (const [w, h] of [[1024, 768], [768, 1024], [844, 390], [750, 369]]) {
        const v = computeView(w, h), one = layout(v.w, v.h, 1), l = layout(v.w, v.h, 2);
        expect(l.bridge).toEqual({ x: one.bridge.x, y: one.bridge.y - 50 });
        expect({ ...l, bridge: one.bridge }).toEqual(one);
        const boxes = [{ ...l.bridge, w: 180, h: 110 }, { ...l.receiver, w: 110, h: 110 }, { ...l.pot, w: 120, h: 120 }, ...l.parks.map(p => ({ ...p, w: 140, h: 110 })), ...l.tools.map(p => ({ ...p, w: 130, h: 110 })), ...l.buttons.map(p => ({ ...p, w: 150, h: 110 }))];
        for (const [i, a] of boxes.entries()) {
          expect(a.y - a.h / 2).toBeGreaterThan(100);
          for (const b of boxes.slice(i + 1)) expect(Math.abs(a.x - b.x) >= (a.w + b.w) / 2 || Math.abs(a.y - b.y) >= (a.h + b.h) / 2).toBe(true);
        }
      }
    });
  });
});
