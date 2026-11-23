import { Lifetime } from '../../engine/lifetime';
import { Container, Rectangle } from 'pixi.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Rng } from '../../engine/random';
import { Tweener } from '../../engine/tween';
import type { GameContext } from '../types';
import { VillageVote } from './index';
const { taps, listeners } = vi.hoisted(() => ({
  taps: new WeakMap<object, (e: unknown) => void>(),
  listeners: new Map<string, (e: Event) => void>(),
}));
vi.mock('../../engine/input', () => ({
  onTap: (n: object, f: (e: unknown) => void) => taps.set(n, f),
  gaze: { x: 0, y: 0, at: 0 },
}));
vi.mock('../../art/scenery', async () => {
  const { Container } = await import('pixi.js');
  return {
    Backdrop: class extends Container {
      resize() {}
    },
  };
});
vi.mock('../../audio/sfx', () => ({ sfx: { boing: vi.fn(), bell: vi.fn(), pop: vi.fn() } }));
const lifetimes: Lifetime[] = [];
function make(level: number, seed = 1) {
  vi.stubGlobal('window', {
    addEventListener: (kind: string, fn: (e: Event) => void) => listeners.set(kind, fn),
    removeEventListener: vi.fn(),
  });
  vi.stubGlobal(
    'PointerEvent',
    class extends Event {
      pointerId: number;
      constructor(type: string, p: { pointerId: number }) {
        super(type);
        this.pointerId = p.pointerId;
      }
    },
  );
  const tw = new Tweener(),
    companion = Object.assign(new Container(), { bodyBounds: () => new Rectangle(-100, -300, 200, 300) });
  const lifetime = new Lifetime();
  lifetimes.push(lifetime);
  const ctx = {
    get alive() {
      return lifetime.alive;
    },
    own: lifetime.own,
    listen: lifetime.listen.bind(lifetime),
    level,
    stage: new Container(),
    view: { w: 1024, h: 768, scale: 1 },
    rng: new Rng(seed),
    tw,
    companion: () => companion,
    track: <T>(x: T) => x,
    untrack: vi.fn(),
    say: vi.fn(() => Promise.resolve()),
    instruct: vi.fn(() => Promise.resolve()),
    finish: vi.fn(),
  } as unknown as GameContext;
  const g = new VillageVote(ctx);
  g.start();
  const event = (node: Container, pointerId = 1) => ({ pointerId, global: node.toGlobal({ x: 0, y: 0 }) });
  const down = (n: Container, id = 1) => taps.get(n)!(event(n, id));
  const up = (n: Container, id = 1) => n.emit('pointerup', event(n, id) as never);
  const tap = (n: Container) => {
    down(n);
    up(n);
  };
  const settle = async () => {
    for (let i = 0; i < 100; i++) {
      tw.update(0.1);
      await Promise.resolve();
      if (!g.busy) break;
    }
  };
  return { g, ctx, tap, down, up, settle, tw };
}
afterEach(() => {
  for (const lifetime of lifetimes.splice(0)) lifetime.destroy();
  vi.unstubAllGlobals();
});
describe('Village Vote public taps and lifecycle', () => {
  it('ignores native cancellation, outside release, wrong pointer and stale node after resize', () => {
    const { g, down, up } = make(2),
      n = g.options[0];
    down(n);
    listeners.get('pointercancel')!(new PointerEvent('pointercancel', { pointerId: 1 }));
    up(n);
    expect(g.election.pet).toBeNull();
    down(n);
    up(n, 2);
    expect(g.election.pet).toBeNull();
    n.emit('pointerupoutside', { pointerId: 1 } as never);
    up(n);
    expect(g.election.pet).toBeNull();
    down(n);
    listeners.get('pointercancel')!(new PointerEvent('pointercancel', { pointerId: 2 }));
    g.resize({ w: 1024, h: 1365, scale: 1 });
    expect(g.election.pet).toBeNull();
    expect([g.misses, g.hints]).toEqual([0, 0]);
    g.destroy();
  });
  it('a down alone is immediate feedback; second pointer cancel cannot cancel the active inside release', async () => {
    const { g, down, up, settle } = make(2),
      n = g.options[0];
    down(n);
    expect(n.alpha).toBe(0.68);
    expect(g.election.pet).toBeNull();
    listeners.get('pointercancel')!(new PointerEvent('pointercancel', { pointerId: 2 }));
    up(n);
    expect(g.election.pet).not.toBeNull();
    await settle();
    expect(g.election.voters).toHaveLength(5);
    g.destroy();
  });
  it('locks double declarations, counts only deliberate mistakes, and preserves help through resized shared play', async () => {
    const { g, ctx, tap, settle } = make(3);
    const wrong = () => g.options[g.election.plan.options.findIndex((o) => o !== g.election.winner)];
    tap(wrong());
    tap(wrong());
    expect(g.misses).toBe(1);
    await settle();
    tap(wrong());
    await settle();
    expect(g.hints).toBe(1);
    g.askForHint();
    await settle();
    tap(g.options[g.election.plan.options.indexOf(g.election.winner)]);
    g.resize({ w: 1024, h: 1365, scale: 1 });
    await settle();
    expect(ctx.finish).toHaveBeenCalledExactlyOnceWith({ misses: 2, hints: 1 });
    g.destroy();
  });
  it('never finishes after leaving during pet travel, count feedback or shared play', async () => {
    for (const phase of ['preference', 'feedback', 'playing']) {
      const { g, ctx, tap, tw } = make(phase === 'preference' ? 2 : 1);
      tap(
        g.options[
          g.election.plan.options.findIndex((o) =>
            phase === 'playing' ? o === g.election.winner : o !== g.election.winner,
          )
        ],
      );
      g.destroy();
      for (let i = 0; i < 100; i++) {
        tw.update(0.1);
        await Promise.resolve();
      }
      expect(ctx.finish).not.toHaveBeenCalled();
      expect(ctx.untrack).toHaveBeenCalledTimes(1);
    }
  });
  it('the public-input bot finishes every level/family with clean accounting, including losing-pet choices', async () => {
    const seen = new Set<string>();
    for (const level of [1, 2, 3, 4, 5, 6])
      for (let seed = 1; seed <= 12; seed++) {
        const { g, ctx, tap, settle } = make(level, seed);
        seen.add(
          `${level}:${g.election.plan.options
            .map((o) => g.election.total(o))
            .sort((a, b) => b - a)
            .join()}`,
        );
        for (let i = 0; i < 30 && !g.finished; i++) {
          await settle();
          const a = g.autotouch();
          if (a && 'tap' in a) tap(a.tap.on);
        }
        await settle();
        expect(g.finished).toBe(true);
        expect(ctx.finish).toHaveBeenCalledExactlyOnceWith({ misses: 0, hints: 0 });
        if (level === 2) expect(g.election.pet).not.toBe(g.election.winner);
        g.destroy();
      }
    expect(seen.size).toBe(12);
  });
  it('level 4: the tie, a wrong send, the run-off glow and ghost, and the final choice count one hint per decision', async () => {
    const { g, ctx, tap, settle } = make(4);
    const e = g.election,
      pic = (o: string) => g.options[e.plan.options.indexOf(o as never)];
    tap(pic(e.fewest));
    await settle();
    expect(g.misses).toBe(1);
    const tied = e.plan.options.filter((o) => o !== e.fewest);
    tap(pic(tied[0]));
    await settle();
    expect([e.phase, e.closed, g.misses]).toEqual(['runoff', e.fewest, 1]);
    expect(ctx.say).toHaveBeenCalledWith('village-vote.tie', expect.anything());
    tap(pic(tied[0]));
    expect(ctx.say).toHaveBeenLastCalledWith('village-vote.nudge', { thing: e.fewest });
    tap(pic(e.fewest));
    expect(ctx.say).toHaveBeenLastCalledWith('village-vote.closed', { thing: e.fewest });
    const first = e.waiting[0],
      wrong = tied.find((o) => o !== first.next)!;
    tap(g.friends.get(first.id)!);
    expect(e.selected).toBe(first.id);
    tap(pic(wrong));
    await settle();
    expect([g.misses, e.phase, e.selected]).toEqual([2, 'runoff', first.id]);
    g.askForHint();
    await settle();
    expect(g.hints).toBe(1);
    g.askForHint();
    expect(g.ghost.idle).toBe(false);
    expect(g.hints).toBe(1);
    g.ghost.stop();
    tap(pic(first.next!));
    await settle();
    expect(e.moved.has(first.id)).toBe(true);
    for (let i = 0; i < 20 && !g.finished; i++) {
      await settle();
      const a = g.autotouch();
      if (a && 'tap' in a) tap(a.tap.on);
    }
    await settle();
    expect(ctx.finish).toHaveBeenCalledExactlyOnceWith({ misses: 2, hints: 1 });
    g.destroy();
  });
  it('level 4: a resize mid run-off keeps the run-off and the selected friend', async () => {
    const { g, tap, settle } = make(4);
    const e = g.election;
    tap(g.options[e.plan.options.indexOf(e.winner)]);
    await settle();
    tap(g.friends.get(e.waiting[0].id)!);
    g.resize({ w: 1024, h: 1365, scale: 1 });
    expect([e.phase, e.selected]).toEqual(['runoff', e.waiting[0].id]);
    tap(g.options[e.plan.options.indexOf(e.selectedNext!)]);
    await settle();
    expect(e.moved.size).toBe(1);
    g.destroy();
  });
  it('level 5: an on-slide tap is one miss, a found friend again is free, Hint glows then shows, and a fix finishes once', async () => {
    const { g, ctx, tap, settle } = make(5);
    await settle();
    const e = g.election;
    expect(ctx.say).toHaveBeenCalledWith('village-vote.won', {
      n: e.total('tall-slide'),
      a: expect.any(Number),
    });
    expect(ctx.instruct).toHaveBeenLastCalledWith('village-vote.access');
    const onSlide = e.plan.voters.find((v) => !e.leftOut.includes(v.id))!.id;
    tap(g.friends.get(onSlide)!);
    tap(g.friends.get(onSlide)!);
    await settle();
    expect(g.misses).toBe(1);
    expect(ctx.say).toHaveBeenCalledWith('village-vote.on-slide');
    const first = e.unfound[0];
    tap(g.friends.get(first)!);
    await settle();
    tap(g.friends.get(first)!);
    await settle();
    expect([g.misses, e.found.size]).toEqual([1, 1]);
    if (e.unfound.length) {
      g.askForHint();
      await settle();
      expect([g.hints, e.glowing]).toEqual([1, true]);
      g.askForHint();
      expect(g.ghost.idle).toBe(false);
      expect(g.hints).toBe(1);
      g.ghost.stop();
      while (e.unfound.length) {
        tap(g.friends.get(e.unfound[0])!);
        await settle();
      }
    }
    expect(e.phase).toBe('fix');
    expect(ctx.instruct).toHaveBeenLastCalledWith('village-vote.fixes');
    expect(g.cards).toHaveLength(2);
    tap(g.cards[1]);
    // The cards are gone with the build: no second fix.
    expect(g.cards).toHaveLength(0);
    await settle();
    expect(e.fix).toBe('lower');
    expect(ctx.say).toHaveBeenCalledWith('village-vote.fix-lower');
    expect(ctx.finish).toHaveBeenCalledExactlyOnceWith({ misses: 1, hints: e.leftOut.length > 1 ? 1 : 0 });
    g.destroy();
  });
  it('level 5: Hint at the free fix choice records nothing; resizes keep the round; leaving during the fix never finishes', async () => {
    const { g, ctx, tap, settle, tw } = make(5, 3);
    g.resize({ w: 1024, h: 1365, scale: 1 });
    await settle();
    const e = g.election;
    expect([e.phase, g.busy]).toEqual(['access', false]);
    expect(ctx.instruct).toHaveBeenLastCalledWith('village-vote.access');
    while (e.unfound.length) {
      tap(g.friends.get(e.unfound[0])!);
      await settle();
    }
    g.resize({ w: 1024, h: 768, scale: 1 });
    expect([e.phase, g.cards.length]).toEqual(['fix', 2]);
    g.askForHint();
    expect(g.hints).toBe(0);
    expect(ctx.instruct).toHaveBeenLastCalledWith('village-vote.fixes');
    tap(g.cards[0]);
    g.destroy();
    for (let i = 0; i < 100; i++) {
      tw.update(0.1);
      await Promise.resolve();
    }
    expect(ctx.finish).not.toHaveBeenCalled();
  });
});
