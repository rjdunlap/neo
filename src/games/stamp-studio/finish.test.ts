import { Container, Point, type FederatedPointerEvent } from 'pixi.js';
import { describe, expect, it, vi } from 'vitest';
import type { GameContext, RoundResult } from '../types';
import { stampStudio } from './index';
import { Rng } from '../../engine/random';
import { LIMIT, STAMP_NAMES, type StampPlan, type Stamp } from './logic';
import * as artwork from './art';

const { press, pick } = vi.hoisted(() => ({ press: new WeakMap<object, (event?: FederatedPointerEvent) => void>(), pick: new WeakMap<object, () => void>() }));
vi.mock('../../engine/input', () => ({
  onTap: (node: object, callback: (event: FederatedPointerEvent) => void) => press.set(node, event => { if (event) callback(event); }),
}));
vi.mock('../../ui/buttons', async () => {
  const { Container } = await import('pixi.js');
  return { RoundButton: class extends Container {
    constructor(_icon: Container, _swatch: unknown, _radius: number, callback: () => void) { super(); this.addChild(new Container(), _icon); press.set(this, callback); }
  } };
});
vi.mock('../../engine/drag', () => ({ draggable: (node: object, _tw: unknown, opts: { onPick: () => void }) => { pick.set(node, opts.onPick); return { enabled: true, home: { x: 0, y: 0 }, destroy: vi.fn() }; } }));
vi.mock('../../audio/sfx', () => ({ sfx: { sparkle: vi.fn(), pop: vi.fn(), tick: vi.fn(), marimba: vi.fn() } }));

/** Exercise the game's real editing/finish callbacks, holding its scene-owned celebration wait open. */
function round(level: number) {
  let wake!: () => void;
  const finish = vi.fn<(result: RoundResult) => void>();
  const stage = new Container();
  const say = vi.fn();
  const ctx = {
    level, stage, say, rng: new Rng(42),
    tw: { wait: () => new Promise<void>(resolve => { wake = resolve; }), kill: vi.fn(), to: vi.fn(() => Promise.resolve()) },
    finish,
  } as unknown as GameContext;
  const game = stampStudio.create(ctx) as ReturnType<typeof stampStudio.create> & {
    paper: Container; finish: Container; undo: Container; turn: Container; grow: Container; bin: Container; play: Container; played: Stamp[];
    stamps: { data: Stamp; node: Container; drag?: { enabled: boolean; destroy: () => void } }[];
    done: boolean; plan: StampPlan; color: Stamp["color"]; choices: Container[]; colors: Container[];
  };
  game.resize({ w: 1024, h: 768 } as Parameters<typeof game.resize>[0]);
  const stamp = (x = 400, y = 300) => press.get(game.paper.children[0])!({ global: new Point(x, y) } as FederatedPointerEvent);
  const cleanup = () => { game.destroy(); stage.destroy({ children: true }); };
  return { game, finish, say, kill: ctx.tw.kill, stamp, wake: () => wake(), cleanup };
}

describe('Stamp Studio play the picture', () => {
  it('plays stamps left to right, skips one removed mid-play, and stops when the picture is finished', async () => {
    const { sfx } = await import('../../audio/sfx');
    const r = round(4);
    r.stamp(700, 300); r.stamp(300, 500); r.stamp(500, 200); r.stamp(900, 400);
    expect(r.game.play.visible).toBe(true);
    press.get(r.game.play)!();
    r.game.update(0.05);
    expect(r.game.played.map(s => s.x)).toEqual([r.game.stamps[1].data.x]);
    // The bin takes away the latest-picked stamp (the rightmost), which then never sounds.
    press.get(r.game.bin)!();
    for (let i = 0; i < 10; i++) r.game.update(0.1);
    expect(r.game.played.map(s => s.x)).toEqual([1, 2, 0].map(i => r.game.stamps[i].data.x));
    // Playing again starts over; finishing stops it, and play does nothing after the arrow.
    press.get(r.game.play)!(); r.game.update(0.05);
    press.get(r.game.finish)!();
    const sounded = vi.mocked(sfx.marimba).mock.calls.length;
    for (let i = 0; i < 10; i++) r.game.update(0.1);
    press.get(r.game.play)!(); for (let i = 0; i < 10; i++) r.game.update(0.1);
    expect(vi.mocked(sfx.marimba).mock.calls.length).toBe(sounded);
    expect(r.game.play.visible).toBe(false);
    r.wake(); await Promise.resolve();
    expect(r.finish).toHaveBeenCalledWith(expect.objectContaining({ misses: 0, hints: 0 }));
    r.cleanup();
  });
  it('has no play button at levels 1, 2 and 7', () => {
    for (const level of [1, 2, 7]) { const r = round(level); r.stamp(); expect(r.game.play.visible).toBe(false); r.cleanup(); }
  });
});

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

describe('Stamp Studio choices and speech', () => {
  it('draws the choice in the color it places, and redraws choices when the color changes', () => {
    const draw = vi.spyOn(artwork, 'stampArt');
    const r = round(3);
    expect(draw.mock.calls.filter(([, , radius]) => radius === 33).map(([, color]) => color)).toEqual(Array(3).fill(r.game.color));
    draw.mockClear();
    press.get(r.game.colors[r.game.color === 'blue' ? 2 : 1])!();
    expect(draw.mock.calls.filter(([, , radius]) => radius === 33).map(([, color]) => color)).toEqual(Array(3).fill(r.game.color));
    r.stamp(); expect(r.game.stamps[0].data.color).toBe(r.game.color);
    r.cleanup(); draw.mockRestore();
  });

  it('says each chosen kind once per round, using its spoken name', () => {
    const r = round(2);
    press.get(r.game.choices[0])!(); press.get(r.game.choices[0])!();
    press.get(r.game.choices[1])!(); press.get(r.game.choices[0])!();
    expect(r.say.mock.calls.filter(([line]) => line === 'stamp.kind')).toEqual(r.game.plan.kinds.map(kind => ['stamp.kind', { kind: STAMP_NAMES[kind] }]));
    r.cleanup();
  });

  it('says paper full once, keeps choices free, and lets Undo make room', () => {
    const r = round(3);
    for (let i = 0; i < LIMIT + 4; i++) r.stamp();
    expect(r.game.stamps).toHaveLength(LIMIT);
    expect(r.say.mock.calls.filter(([line]) => line === 'stamp.full')).toHaveLength(1);
    press.get(r.game.undo)!(); r.stamp(); r.stamp();
    expect(r.game.stamps).toHaveLength(LIMIT);
    expect(r.say.mock.calls.filter(([line]) => line === 'stamp.full')).toHaveLength(1);
    r.cleanup();
  });
});


describe('Stamp Studio bin and early stopping', () => {
  it.each([3, 4, 6])('removes the picked stamp, frees its drag/tweens and selects a survivor at level %i', level => {
    const r = round(level); r.stamp(); r.stamp(); r.stamp();
    const [first, middle, last] = r.game.stamps;
    const removedScale = middle.node.scale;
    pick.get(middle.node)!(); press.get(r.game.bin)!();
    expect(r.game.stamps).toEqual([first, last]);
    expect(middle.node.destroyed).toBe(true); expect(middle.drag!.destroy).toHaveBeenCalledOnce();
    expect(r.kill).toHaveBeenCalledWith(middle.node); expect(r.kill).toHaveBeenCalledWith(removedScale);
    expect(r.game.bin.visible).toBe(true);
    press.get(r.game.bin)!(); expect(r.game.stamps).toEqual([first]);
    press.get(r.game.undo)!(); expect(r.game.stamps).toHaveLength(0);
    expect(r.game.bin.visible).toBe(false); expect(r.game.finish.visible).toBe(false);
    expect(r.game.paper.children[1].getLocalBounds().width).toBe(0);
    r.stamp(); expect(r.game.bin.visible).toBe(true);
    press.get(r.game.finish)!(); const frozen = r.game.stamps.map(s => ({ ...s.data }));
    press.get(r.game.bin)!(); expect(r.game.stamps.map(s => s.data)).toEqual(frozen);
    r.cleanup();
  });
  it.each([1, 2])('nudges after five and auto-finishes exactly once at the limit at level %i', async level => {
    const r = round(level);
    expect(r.game.bin.visible).toBe(false);
    for (let i = 0; i < 4; i++) r.stamp();
    r.game.update(0.2); expect(r.game.finish.rotation).toBe(0);
    r.stamp(); r.game.update(0.2); expect(r.game.finish.rotation).not.toBe(0);
    press.get(r.game.undo)!(); expect(r.game.finish.rotation).toBe(0);
    for (let i = 4; i < LIMIT - 1; i++) r.stamp();
    expect(r.game.done).toBe(false);
    r.stamp(); expect(r.game.done).toBe(true); expect(r.game.finish.rotation).toBe(0);
    const frozen = r.game.stamps.map(s => ({ ...s.data }));
    r.stamp(); press.get(r.game.undo)!(); press.get(r.game.finish)!();
    expect(r.game.stamps.map(s => s.data)).toEqual(frozen);
    r.wake(); await Promise.resolve();
    expect(r.finish).toHaveBeenCalledExactlyOnceWith({ misses: 0, hints: 0, creation: { kind: 'picture', stamps: frozen } });
    r.cleanup();
  });
  it('keeps the bin and side controls apart and large in four views', () => {
    const r = round(4); r.stamp();
    for (const [w, h] of [[1024, 768], [1024, 1365], [1365, 768], [1664, 768]]) {
      r.game.resize({ w, h } as Parameters<typeof r.game.resize>[0]);
      const buttons = [r.game.finish, r.game.bin, r.game.turn, r.game.grow, r.game.undo];
      for (const b of buttons) {
        expect(b.x - 62).toBeGreaterThanOrEqual(0); expect(b.x + 62).toBeLessThanOrEqual(w);
        expect(b.y - 62).toBeGreaterThanOrEqual(0); expect(b.y + 62).toBeLessThanOrEqual(h);
        expect(b.scale.x).toBe(1);
      }
      for (let i = 1; i < buttons.length; i++) expect(buttons[i].y - buttons[i - 1].y).toBeGreaterThanOrEqual(124);
    }
    r.cleanup();
  });
  it('keeps a full level 3 picture editable without nudging or auto-finishing', () => {
    const r = round(3); for (let i = 0; i < LIMIT; i++) r.stamp();
    r.game.update(0.2); expect(r.game.finish.rotation).toBe(0); expect(r.game.done).toBe(false);
    press.get(r.game.bin)!(); r.stamp(); expect(r.game.stamps).toHaveLength(LIMIT); expect(r.game.done).toBe(false);
    r.cleanup();
  });

  it('level 7 pats: every pat is kept, big, and the eighth finishes once', async () => {
    const r = round(7);
    for (let i = 0; i < 12; i++) r.stamp();
    expect(r.game.stamps).toHaveLength(8);
    expect(r.game.stamps.every(s => s.data.size * 48 * 2 >= 170)).toBe(true);
    expect(r.game.done).toBe(true);
    r.wake(); await Promise.resolve();
    expect(r.finish).toHaveBeenCalledTimes(1);
    expect(r.finish.mock.calls[0][0]).toMatchObject({ misses: 0, hints: 0 });
    r.cleanup();
  });
});
