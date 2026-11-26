import { Container } from 'pixi.js';
import { describe, expect, it, vi } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import type { GameContext } from '../types';
import { FactorMeadow } from './factor';
import { correctCard } from './factor-logic';

const { taps } = vi.hoisted(() => ({ taps: new WeakMap<object, () => void>() }));
vi.mock('../../engine/input', () => ({ onTap: (node: object, fn: () => void) => taps.set(node, fn) }));
vi.mock('../../audio/sfx', () => ({
  sfx: { tick: vi.fn(), bell: vi.fn(), pop: vi.fn(), boing: vi.fn(), tada: vi.fn() },
}));
vi.mock('../../art/scenery', async () => {
  const { Container } = await import('pixi.js');
  return {
    Backdrop: class extends Container {
      resize() {}
    },
  };
});

function make(level: 6 | 7) {
  const companion = Object.assign(new Container(), { cheer: vi.fn(), wiggle: vi.fn() });
  const said: string[] = [];
  const say = vi.fn((line: string) => {
    said.push(line);
    return Promise.resolve();
  });
  const ctx = {
    level,
    stage: new Container(),
    view: computeView(1024, 768),
    rng: new Rng(12),
    track: <T>(x: T) => x,
    untrack: vi.fn(),
    companion: () => companion,
    pet: { cheer: vi.fn() },
    particles: { burst: vi.fn() },
    say,
    instruct: vi.fn((line: string) => say(line)),
    finish: vi.fn(),
    tw: {
      wait: vi.fn(() => Promise.resolve()),
      to: vi.fn((target: object, values: object) => {
        Object.assign(target, values);
        return Promise.resolve();
      }),
    },
  } as unknown as GameContext;
  const g = new FactorMeadow(ctx);
  const tap = (node: object) => {
    const fn = taps.get(node);
    if (!fn) throw new Error('no onTap handler');
    fn();
  };
  const settle = async () => {
    for (let n = 0; n < 300; n++) await Promise.resolve();
  };
  const card = (right: boolean) => g.cards.find((c) => (c.value === correctCard(g.task)) === right)!;
  g.start();
  return { g, ctx, said, tap, settle, card };
}

describe.each([6, 7] as const)('Meadow Pens level %i play', (level) => {
  it('asks its exact question, and free touches count nothing', async () => {
    const { g, said, tap, settle } = make(level);
    await settle();
    expect(said.slice(0, 2)).toEqual([
      `meadow.instruct.${level}`,
      `meadow.ask${level}.${level === 6 ? 'M3' : 'V1'}`,
    ]);
    for (const t of g.targetsOf) {
      tap(t);
      await settle();
    }
    tap((g as unknown as { bubble: object }).bubble);
    await settle();
    expect([g.tally.misses, g.tally.hints, g.index]).toEqual([0, 0, 0]);
    g.destroy();
  });

  it('a wrong card is one miss with an explanation, two misses glow, then any card completes with help', async () => {
    const { g, said, tap, settle, card } = make(level);
    await settle();
    tap(card(false));
    await settle();
    expect([g.tally.misses, g.tally.hints, g.tally.glowing, g.index]).toEqual([1, 0, false, 0]);
    expect(said.some((l) => /^meadow\.(try6|lift6|stack7)/.test(l))).toBe(true);
    tap(card(false));
    await settle();
    expect([g.tally.misses, g.tally.hints, g.tally.glowing]).toEqual([2, 1, true]);
    tap(card(false));
    await settle();
    expect([g.tally.misses, g.tally.hints, g.index]).toEqual([2, 1, 1]);
    g.destroy();
  });

  it('five right cards finish once with no misses; a requested hint counts once per question', async () => {
    const { g, ctx, tap, settle, card } = make(level);
    await settle();
    g.askForHint();
    await settle();
    expect(g.tally.hints).toBe(1);
    g.askForHint();
    await settle();
    expect(g.tally.hints).toBe(1);
    for (let i = 0; i < 5; i++) {
      tap(card(true));
      await settle();
    }
    await settle();
    expect(g.finished).toBe(true);
    expect(ctx.finish).toHaveBeenCalledTimes(1);
    expect(ctx.finish).toHaveBeenCalledWith({ misses: 0, hints: 1 });
    g.destroy();
  });

  it('restart keeps misses, hints and the question', async () => {
    const { g, tap, settle, card } = make(level);
    await settle();
    tap(card(false));
    await settle();
    g.restart();
    await settle();
    expect([g.index, g.tally.misses]).toEqual([0, 1]);
    g.destroy();
  });

  it('a destroyed scene resolves nothing further', async () => {
    const { g, ctx, tap, settle, card } = make(level);
    await settle();
    tap(card(true));
    g.destroy();
    await settle();
    expect(ctx.finish).not.toHaveBeenCalled();
    expect(g.index).toBe(0);
  });
});
