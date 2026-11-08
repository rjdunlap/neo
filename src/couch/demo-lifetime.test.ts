import { Container } from 'pixi.js';
import { describe, expect, it, vi } from 'vitest';
import type { Renderer } from 'pixi.js';
import type { GameContext, GameModule } from '../games/types';
import { Demo } from './demo';

vi.mock('../creatures/companion', () => ({
  makeCompanion: () => Object.assign(new Container(), { update() {} }),
  makeStar: vi.fn(),
}));
vi.mock('../art/particles', () => ({ Particles: class extends Container {} }));

describe('demonstration cleanup ownership', () => {
  it('destroys each replay lifetime before the game, without killing the next replay', () => {
    const contexts: GameContext[] = [];
    const target = new EventTarget();
    const heard: number[] = [];
    const released: number[] = [];
    const mod = {
      create(ctx: GameContext) {
        const round = contexts.length;
        contexts.push(ctx);
        ctx.listen(target, 'touch', () => heard.push(round));
        ctx.own(() => released.push(round));
        return {
          start() {},
          update() {},
          resize() {},
          destroy() {
            expect(ctx.alive).toBe(false);
          },
        };
      },
    } as unknown as GameModule;
    const demo = new Demo(mod, { level: 1, band: 'lap', renderer: {} as Renderer });
    target.dispatchEvent(new Event('touch'));
    expect(heard).toEqual([0]);
    demo.restart();
    expect(released).toEqual([0]);
    expect(contexts.map((ctx) => ctx.alive)).toEqual([false, true]);
    target.dispatchEvent(new Event('touch'));
    expect(heard).toEqual([0, 1]);
    demo.destroy();
    demo.destroy();
    expect(released).toEqual([0, 1]);
    expect(contexts.every((ctx) => !ctx.alive)).toBe(true);
    target.dispatchEvent(new Event('touch'));
    expect(heard).toEqual([0, 1]);
  });
});
