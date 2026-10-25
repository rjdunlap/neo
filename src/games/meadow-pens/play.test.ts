import { Container } from 'pixi.js';
import { describe, expect, it, vi } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import type { GameContext } from '../types';
import { FixedMeadow } from './fixed';
import { correctChoice } from './logic';

const { taps } = vi.hoisted(() => ({ taps: new WeakMap<object, () => void>() }));
vi.mock('../../engine/input', () => ({ onTap: (node: object, fn: () => void) => taps.set(node, fn) }));
vi.mock('../../audio/sfx', () => ({ sfx: { tick: vi.fn(), bell: vi.fn(), pop: vi.fn(), boing: vi.fn(), tada: vi.fn() } }));
vi.mock('../../art/scenery', async () => {
  const { Container } = await import('pixi.js');
  return { Backdrop: class extends Container { resize() {} } };
});

function make(level: 4 | 5) {
  const blocked = new Map<string, (() => void)[]>();
  const hold = new Set<string>();
  const companion = Object.assign(new Container(), { cheer: vi.fn(), wiggle: vi.fn() });
  const say = vi.fn((line: string) => {
    if (!hold.has(line)) return Promise.resolve();
    return new Promise<void>((resolve) => blocked.set(line, [...(blocked.get(line) ?? []), resolve]));
  });
  const ctx = {
    level, stage: new Container(), view: computeView(1024, 768), rng: new Rng(12),
    track: <T>(x: T) => x, untrack: vi.fn(), companion: () => companion,
    pet: { cheer: vi.fn() }, particles: { burst: vi.fn() }, say,
    instruct: vi.fn(() => Promise.resolve()), finish: vi.fn(),
    tw: { wait: vi.fn(() => Promise.resolve()), to: vi.fn((target: object, values: object) => { Object.assign(target, values); return Promise.resolve(); }) },
  } as unknown as GameContext;
  const g = new FixedMeadow(ctx);
  const tap = (node: object) => {
    const fn = taps.get(node);
    if (!fn) throw new Error('Target does not have the real onTap handler');
    fn();
  };
  const flush = async () => { for (let n = 0; n < 300; n++) await Promise.resolve(); };
  const settle = async () => {
    await flush();
    if (g.busy && !g.finished) throw new Error('Input did not unlock after feedback');
  };
  const card = (right: boolean) => g.cards.find((c) => (c.value === correctChoice(g.task)) === right)!;
  const release = (line: string) => {
    hold.delete(line);
    for (const resolve of blocked.get(line) ?? []) resolve();
    blocked.delete(line);
  };
  g.start();
  return { g, ctx, say, tap, settle, flush, card, hold, blocked, release };
}

describe('Meadow Pens fixed-field input and accounting', () => {
  it('comparison targets highlight immediately before held badge speech, and unequal questions replay the same label', async () => {
    const { g, say, tap, settle, card, hold, blocked, flush, release } = make(4);
    await settle();
    const state = g as unknown as { highlight: number[]; litEdge: number; edgePart: number; bubble: Container };
    for (const material of ['grass', 'fence'] as const) {
      expect(g.task.kind === 'compare' && g.task.material).toBe(material);
      if (g.task.kind !== 'compare') throw new Error('Expected comparison');
      const line = `meadow.choice4.${g.task.badges[1]}`;
      hold.add(line);
      tap(g.partTargets[1]);
      // Synchronous touch feedback: no promise or badge announcement needs to finish first.
      expect(state.highlight).toEqual([g.task.parts[1][0]]);
      if (material === 'fence') {
        expect(state.edgePart).toBe(1);
        expect(state.litEdge).toBe(0);
      }
      await flush();
      expect(blocked.has(line)).toBe(true);
      expect(state.highlight).toEqual([g.task.parts[1][0]]);
      release(line); await settle();
      if (material === 'grass') { tap(card(true)); await settle(); }
    }
    // C1 fence has a strict winner, but the equality card still has replayable spoken support.
    expect(correctChoice(g.task)).not.toBe('same');
    say.mockClear();
    tap(state.bubble); await settle();
    expect(say.mock.calls.slice(0, 4).map(([line]) => line)).toEqual([
      'meadow.ask4.fence', 'meadow.choice4.daisy', 'meadow.choice4.tulip', 'meadow.choice4.same',
    ]);
    expect([g.index, g.tally.misses, g.tally.hints]).toEqual([1, 0, 0]);
    g.destroy();
  });

  it('a two-part counting target highlights its first square synchronously before count speech', async () => {
    const { g, tap, settle, hold, blocked, flush, release } = make(5);
    await settle();
    const state = g as unknown as { highlight: number[] };
    hold.add('count');
    tap(g.partTargets[1]);
    expect(state.highlight).toEqual([g.task.parts[1][0]]);
    expect(g.busy).toBe(true);
    expect([g.tally.misses, g.tally.hints]).toEqual([0, 0]);
    await flush();
    expect(blocked.has('count')).toBe(true);
    release('count'); await settle();
    expect(g.index).toBe(0);
    g.destroy();
  });
  it.each([4, 5] as const)('level %i: an unaided correct card opens the gate without duplicate counting; assistance still explains', async (level) => {
    const { g, say, tap, settle, card, hold, blocked, flush, release } = make(level);
    await settle();
    say.mockClear();
    const completion = level === 4 ? 'meadow.in' : 'meadow.field-in';
    const cells = [...g.task.parts.flat()];
    hold.add(completion);
    tap(card(true)); await flush();
    expect(blocked.has(completion)).toBe(true);
    expect(say.mock.calls.map(([line]) => line)).toEqual([completion]);
    const state = g as unknown as { painted: Set<number>; gateOpen: number };
    expect(state.gateOpen).toBe(1);
    expect(state.painted).toEqual(new Set(cells));
    release(completion); await settle();
    expect(g.index).toBe(1);
    g.askForHint(); await settle();
    say.mockClear();
    tap(card(false)); await settle();
    const lines = say.mock.calls.map(([line]) => line);
    if (level === 4) {
      expect(lines.some((line) => line === 'meadow.choice4.daisy' || line === 'meadow.choice4.tulip')).toBe(true);
      expect(lines).toContain('meadow.fence-total');
    } else {
      expect(lines).toContain('count');
      expect(lines.some((line) => line.startsWith('meadow.parts5.'))).toBe(true);
    }
    expect([g.index, g.tally.misses, g.tally.hints]).toEqual([2, 0, 1]);
    g.destroy();
  });

  it.each([4, 5] as const)('level %i: restart locks answers until its request replay finishes while retaining support', async (level) => {
    const { g, tap, settle, card, hold, blocked, flush, release } = make(level);
    await settle();
    g.askForHint(); await settle();
    const task = g.task, snapshot = JSON.stringify(g.tasks);
    const request = level === 4 ? 'meadow.ask4.grass' : 'meadow.ask5';
    hold.add(request); g.restart();
    expect(g.busy).toBe(true);
    tap(card(false));
    await flush();
    expect(blocked.has(request)).toBe(true);
    expect(g.task).toBe(task);
    expect(JSON.stringify(g.tasks)).toBe(snapshot);
    expect([g.index, g.tally.misses, g.tally.hints, g.tally.glowing]).toEqual([0, 0, 1, true]);
    release(request); await settle();
    tap(card(false)); await settle();
    expect([g.index, g.tally.misses, g.tally.hints]).toEqual([1, 0, 1]);
    g.destroy();
  });

  it.each([4, 5] as const)('level %i: free counts and held taps do not submit; two wrong cards give one capped hint', async (level) => {
    const { g, ctx, tap, settle, card, flush } = make(level);
    await settle();
    const task = g.task;
    tap(g.partTargets[0]);
    expect(g.busy).toBe(true);
    // Input while a count is playing cannot answer or add a miss.
    tap(card(false));
    await settle();
    expect(g.index).toBe(0);
    expect(g.task).toBe(task);
    expect([g.tally.misses, g.tally.hints]).toEqual([0, 0]);
    const wrong = card(false);
    tap(wrong); tap(wrong); tap(wrong);
    expect(g.tally.misses).toBe(1);
    await settle();
    expect(g.tally.hints).toBe(0);
    tap(wrong); await settle();
    expect([g.tally.misses, g.tally.hints, g.tally.glowing]).toEqual([2, 1, true]);
    g.askForHint(); await settle();
    g.askForHint(); await settle();
    expect([g.tally.misses, g.tally.hints]).toEqual([2, 1]);
    // Any response card is a supported completion, including the originally wrong one.
    tap(wrong); await settle();
    expect(g.index).toBe(1);
    expect([g.tally.misses, g.tally.hints, g.tally.glowing]).toEqual([2, 1, false]);
    await flush();
    expect(ctx.finish).not.toHaveBeenCalled();
    g.destroy();
  });

  it.each([4, 5] as const)('level %i: manual help and restart retain question, seed, support and round totals', async (level) => {
    const { g, ctx, tap, settle, card } = make(level);
    await settle();
    tap(card(true)); await settle();
    expect(g.index).toBe(1);
    tap(card(false)); await settle();
    g.askForHint(); await settle();
    const task = g.task, snapshot = JSON.stringify(g.tasks), cards = [...g.cards];
    g.restart(); await settle();
    expect(g.index).toBe(1);
    expect(g.task).toBe(task);
    expect(JSON.stringify(g.tasks)).toBe(snapshot);
    expect(g.cards).toEqual(cards);
    expect([g.tally.misses, g.tally.hints, g.tally.glowing]).toEqual([1, 1, true]);
    g.askForHint(); await settle();
    expect(g.tally.hints).toBe(1);
    tap(card(false)); await settle();
    expect(g.index).toBe(2);
    expect([g.tally.misses, g.tally.hints]).toEqual([1, 1]);
    expect(ctx.finish).not.toHaveBeenCalled();
    g.destroy();
  });

  it.each([4, 5] as const)('level %i: five questions finish once, including helped questions and a skipped ending', async (level) => {
    const { g, ctx, tap, settle, card, hold, blocked, flush, release } = make(level);
    await settle();
    g.askForHint(); await settle();
    for (let i = 0; i < 4; i++) {
      expect(g.index).toBe(i);
      tap(card(i !== 0)); await settle();
      expect(ctx.finish).not.toHaveBeenCalled();
    }
    hold.add('meadow.fixed-all');
    tap(card(true)); await flush();
    expect(g.index).toBe(4);
    expect(g.finished).toBe(true);
    expect(blocked.has('meadow.fixed-all')).toBe(true);
    expect(ctx.finish).not.toHaveBeenCalled();
    tap(g.cards[0]); tap(g.cards[1]); tap(g.cards[2]);
    expect(ctx.finish).toHaveBeenCalledExactlyOnceWith({ misses: 0, hints: 1 });
    release('meadow.fixed-all'); await flush();
    g.update(10); g.askForHint(); g.restart();
    expect(ctx.finish).toHaveBeenCalledTimes(1);
    g.destroy();
  });

  it.each([4, 5] as const)('level %i: resize during counting preserves current question and relocates its targets', async (level) => {
    const { g, tap, settle, card, hold, blocked, flush, release } = make(level);
    await settle();
    const task = g.task, snapshot = JSON.stringify(g.tasks), oldY = g.cards[0].y;
    hold.add('count');
    tap(g.partTargets[0]); await flush();
    expect(blocked.has('count')).toBe(true);
    g.resize(computeView(768, 1024));
    expect(g.task).toBe(task);
    expect(JSON.stringify(g.tasks)).toBe(snapshot);
    expect(g.cards[0].y).not.toBe(oldY);
    expect([g.index, g.tally.misses, g.tally.hints]).toEqual([0, 0, 0]);
    release('count'); await settle();
    tap(card(true)); await settle();
    expect(g.index).toBe(1);
    g.destroy();
  });

  it.each([4, 5] as const)('level %i: queued feedback and final speech cannot advance or finish after destroy', async (level) => {
    for (const final of [false, true]) {
      const { g, ctx, tap, settle, card, hold, blocked, flush, release } = make(level);
      await settle();
      if (final) for (let i = 0; i < 4; i++) { tap(card(true)); await settle(); }
      const line = final ? 'meadow.fixed-all' : 'count';
      hold.add(line); tap(card(final)); await flush();
      expect(blocked.has(line)).toBe(true);
      const index = g.index;
      g.destroy(); release(line); await flush();
      g.update(10);
      expect(g.index).toBe(index);
      expect(ctx.finish).not.toHaveBeenCalled();
    }
  });
});
