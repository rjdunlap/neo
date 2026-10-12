import { Container, Point, type FederatedPointerEvent } from 'pixi.js';
import { describe, expect, it, vi } from 'vitest';
import type { GameContext, RoundResult } from '../types';
import { stampStudio } from './index';
import type { Stamp } from './logic';

const { press } = vi.hoisted(() => ({ press: new WeakMap<object, (event?: FederatedPointerEvent) => void>() }));
vi.mock('../../engine/input', () => ({
  onTap: (node: object, callback: (event: FederatedPointerEvent) => void) => press.set(node, event => { if (event) callback(event); }),
}));
vi.mock('../../ui/buttons', async () => {
  const { Container } = await import('pixi.js');
  return { RoundButton: class extends Container {
    constructor(_icon: Container, _swatch: unknown, _radius: number, callback: () => void) { super(); press.set(this, callback); }
  } };
});
vi.mock('../../engine/drag', () => ({ draggable: () => ({ enabled: true, home: { x: 0, y: 0 }, destroy: vi.fn() }) }));
vi.mock('../../audio/sfx', () => ({ sfx: { sparkle: vi.fn(), pop: vi.fn(), tick: vi.fn() } }));

/** Exercise the game's real editing/finish callbacks, holding its scene-owned celebration wait open. */
function round(level: number) {
  let wake!: () => void;
  const finish = vi.fn<(result: RoundResult) => void>();
  const stage = new Container();
  const ctx = {
    level, stage, say: vi.fn(),
    tw: { wait: () => new Promise<void>(resolve => { wake = resolve; }), kill: vi.fn() },
    finish,
  } as unknown as GameContext;
  const game = stampStudio.create(ctx) as ReturnType<typeof stampStudio.create> & {
    paper: Container; finish: Container; undo: Container; turn: Container; grow: Container;
    stamps: { data: Stamp; node: Container; drag?: { enabled: boolean } }[];
    done: boolean;
  };
  game.resize({ w: 1024, h: 768 } as Parameters<typeof game.resize>[0]);
  const stamp = () => press.get(game.paper.children[0])!({ global: new Point(400, 300) } as FederatedPointerEvent);
  const cleanup = () => { game.destroy(); stage.destroy({ children: true }); };
  return { game, finish, stamp, wake: () => wake(), cleanup };
}

describe('Stamp Studio finished picture', () => {
  it.each([1, 2, 3, 4, 5, 6])('ignores late Undo/Turn/Big and finishes exactly once at level %i', async level => {
    const r = round(level);
    r.stamp(); r.stamp();
    // Undo and transforms remain real editing actions before finishing.
    if (level >= 4) { press.get(r.game.turn)!(); press.get(r.game.grow)!(); }
    press.get(r.game.undo)!();
    expect(r.game.stamps).toHaveLength(1);
    r.stamp();
    const before = r.game.stamps.map(s => ({ ...s.data }));
    press.get(r.game.finish)!();
    expect(r.game.done).toBe(true);
    expect(r.finish).not.toHaveBeenCalled();
    press.get(r.game.undo)!(); press.get(r.game.turn)!(); press.get(r.game.grow)!(); press.get(r.game.finish)!();
    expect(r.game.stamps.map(s => s.data)).toEqual(before);
    expect(r.game.stamps.every(s => !s.drag || !s.drag.enabled)).toBe(true);
    r.wake(); await Promise.resolve();
    expect(r.finish).toHaveBeenCalledExactlyOnceWith({ misses: 0, hints: 0, creation: { kind: 'picture', stamps: before } });
    r.cleanup();
  });

  it('copies the completed picture before the delayed handoff, independently of live marks', async () => {
    const r = round(4);
    r.stamp();
    const before = r.game.stamps.map(s => ({ ...s.data }));
    press.get(r.game.finish)!();
    // A callback retaining a mark must not change the already finished creation.
    Object.assign(r.game.stamps[0].data, { turns: 3, size: 1.3, x: 0.9 });
    r.wake(); await Promise.resolve();
    expect(r.finish.mock.calls[0][0].creation).toEqual({ kind: 'picture', stamps: before });
    r.cleanup();
  });
});
