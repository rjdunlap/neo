import { Container, EventBoundary, Graphics, Point } from 'pixi.js';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { Tweener } from './tween';
import { GhostFinger, GHOST_POINTER } from './ghost';

// `draggable` listens on `window`; the test runs without a DOM, so give it a window that keeps its listeners.
const listeners = new Map<string, Set<(e: unknown) => void>>();
const fakeWindow = {
  addEventListener: (type: string, fn: (e: unknown) => void) => void (listeners.get(type) ?? listeners.set(type, new Set()).get(type)!).add(fn),
  removeEventListener: (type: string, fn: (e: unknown) => void) => void listeners.get(type)?.delete(fn),
};
let draggable: typeof import('./drag').draggable;
let onTap: typeof import('./input').onTap;

beforeAll(async () => {
  vi.stubGlobal('window', fakeWindow);
  ({ draggable } = await import('./drag'));
  ({ onTap } = await import('./input'));
});
afterEach(() => listeners.clear());

/** A real finger's window `pointerup`, as the browser would send after the canvas heard it. */
const windowUp = (pointerId: number) => listeners.get('pointerup')?.forEach((fn) => fn({ pointerId }));
const down = (obj: Container, pointerId: number, x: number, y: number) => obj.emit('pointerdown', { pointerId, global: new Point(x, y) } as never);

function scene() {
  const root = new Container();
  const boundary = new EventBoundary(root);
  const ghost = new GhostFinger(root, boundary);
  root.addChild(ghost.hand);
  const play = (limit = 600) => {
    let frames = 0;
    do ghost.update(1 / 60);
    while (!ghost.idle && ++frames < limit);
    return frames < limit;
  };
  return { root, ghost, play };
}

const thing = (root: Container, x: number, y: number) => {
  const g = new Graphics().circle(0, 0, 40).fill(0xffffff);
  g.position.set(x, y);
  root.addChild(g);
  return g;
};

describe('GhostFinger', () => {
  it('taps an object by sending its own pointerdown, from its own pointer, and never touches anything else', () => {
    const { root, ghost, play } = scene();
    const bubble = thing(root, 300, 200);
    const other = thing(root, 700, 500);
    const tapped: Array<{ id: number; x: number; y: number }> = [];
    const stray = vi.fn();
    onTap(bubble, (e) => tapped.push({ id: e.pointerId, x: e.global.x, y: e.global.y }));
    other.eventMode = 'static';
    other.on('pointerdown', stray);

    ghost.start({ tap: { on: bubble } });
    expect(play()).toBe(true);
    expect(tapped).toHaveLength(1);
    expect(tapped[0]).toMatchObject({ id: GHOST_POINTER, x: 300, y: 200 });
    expect(stray).not.toHaveBeenCalled();
  });

  it('aims at a spot on the object, in the object\'s own coordinates, and follows it if it moves', () => {
    const { root, ghost } = scene();
    const critter = thing(root, 100, 100);
    critter.scale.set(0.5);
    const seen: Point[] = [];
    const where: number[] = [];
    onTap(critter, (e) => (seen.push(e.global.clone()), where.push(critter.x)));
    ghost.start({ tap: { on: critter, x: 0, y: -120 } });
    // The critter drifts while the hand is on its way.
    for (let i = 0; i < 600 && !ghost.idle; i++) {
      critter.x += 0.5;
      ghost.update(1 / 60);
    }
    expect(seen).toHaveLength(1);
    expect(seen[0].y).toBeCloseTo(100 - 60, 5); // -120 units at half scale
    expect(seen[0].x).toBeGreaterThan(100);
    expect(Math.abs(seen[0].x - where[0])).toBeLessThan(1.5); // right on it at the moment of the touch
  });

  it('carries a draggable to a spot, lands it there, and leaves the drag lock free for a real finger', () => {
    const { root, ghost } = scene();
    const tw = new Tweener();
    const snack = thing(root, 200, 600);
    const plate = thing(root, 600, 300);
    const other = thing(root, 800, 600);
    const drops: Array<[number, number]> = [];
    draggable(snack, tw, { onDrop: (x, y) => (drops.push([x, y]), true) });
    const real = vi.fn(() => true);
    const second = draggable(other, tw, { onDrop: real });

    ghost.start({ drag: { on: snack }, to: { on: plate } });
    let frames = 0;
    while (!ghost.idle && frames++ < 900) {
      ghost.update(1 / 60);
      tw.update(1 / 60);
    }
    expect(ghost.idle).toBe(true);
    expect(drops).toHaveLength(1);
    expect(drops[0][0]).toBeCloseTo(600, 0);
    expect(drops[0][1]).toBeCloseTo(300, 0);

    // After Play, a real drag has to work: the ghost's drag must not have left the one-at-a-time lock held.
    down(other, 5, 800, 600);
    expect(second.dragging).toBe(true);
    other.emit('pointerup', { pointerId: 5, global: new Point(800, 560) } as never);
    windowUp(5);
    expect(real).toHaveBeenCalledOnce();
  });

  it('follows a trace through its points while the finger stays down', () => {
    const { root, ghost, play } = scene();
    const ground = thing(root, 0, 0);
    const events: string[] = [];
    const path: Point[] = [];
    for (const type of ['pointerdown', 'globalpointermove', 'pointerup']) {
      ground.on(type as 'pointerdown', (e) => {
        events.push(type);
        if (type === 'globalpointermove') path.push(e.global.clone());
      });
    }
    const a = thing(root, 400, 300);
    const b = thing(root, 700, 300);
    ghost.start({ trace: { on: ground, x: 200, y: 300 }, via: [{ on: a }, { on: b }] });
    expect(play()).toBe(true);
    expect(events[0]).toBe('pointerdown');
    expect(events[events.length - 1]).toBe('pointerup');
    expect(events.filter((t) => t === 'pointerdown')).toHaveLength(1);
    expect(path.length).toBeGreaterThan(10);
    expect(path[path.length - 1].x).toBeCloseTo(700, 0);
    for (let i = 1; i < path.length; i++) expect(path[i].x).toBeGreaterThanOrEqual(path[i - 1].x - 1e-6);
  });

  it('keeps the hand on screen when the thing it touched vanishes under it (a bubble pops at once)', () => {
    const { root, ghost, play } = scene();
    const bubble = thing(root, 300, 300);
    const pops = vi.fn(() => bubble.destroy());
    onTap(bubble, pops);
    ghost.start({ tap: { on: bubble } });
    expect(play()).toBe(true);
    expect(pops).toHaveBeenCalledOnce();
    expect(ghost.idle).toBe(true);
    expect(ghost.hand.visible).toBe(true); // it lifts where it was and waits for the next gesture
    // And it can go on to the next one.
    const next = thing(root, 600, 200);
    const taps = vi.fn();
    onTap(next, taps);
    ghost.start({ tap: { on: next } });
    expect(play()).toBe(true);
    expect(taps).toHaveBeenCalledOnce();
  });

  it('gives up quietly when the object it was heading for is destroyed', () => {
    const { root, ghost, play } = scene();
    const gone = thing(root, 300, 300);
    const fn = vi.fn();
    onTap(gone, fn);
    ghost.start({ tap: { on: gone } });
    ghost.update(0.1);
    gone.destroy();
    expect(play()).toBe(true);
    expect(fn).not.toHaveBeenCalled();
    expect(ghost.idle).toBe(true);
  });
});
