import { Container } from 'pixi.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { App } from './App';
import { Scene } from './Scene';

class TestScene extends Scene {}

describe('Scene lifecycle', () => {
  afterEach(() => vi.useRealTimers());

  it('keeps the detached display tree alive for a continuation already queued in the leaving frame', async () => {
    vi.useFakeTimers();
    const scene = new TestScene({} as App);
    const child = new Container();
    scene.content.addChild(child);

    const continuation = Promise.resolve().then(() => child.position.set(12, 34));
    scene.destroy();

    expect(scene.root.destroyed).toBe(false);
    expect(child.destroyed).toBe(false);
    await continuation;
    expect({ x: child.x, y: child.y }).toEqual({ x: 12, y: 34 });

    await vi.runAllTimersAsync();
    expect(scene.root.destroyed).toBe(true);
    expect(child.destroyed).toBe(true);
  });

  it('schedules destruction only once', async () => {
    vi.useFakeTimers();
    const scene = new TestScene({} as App);
    const destroy = vi.spyOn(scene.root, 'destroy');

    scene.destroy();
    scene.destroy();
    await vi.runAllTimersAsync();

    expect(destroy).toHaveBeenCalledOnce();
  });
});
