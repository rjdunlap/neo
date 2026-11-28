import { afterEach, describe, expect, it, vi } from 'vitest';
import { Container, Graphics } from 'pixi.js';
import { paperPass } from './paperize';

/** Runs `n` passes, the clock moving `ms` each, calling `each` before every pass (a game's tick). */
function passes(root: Container, n: number, ms: number, each?: () => void) {
  for (let i = 0; i < n; i++) {
    now += ms;
    each?.();
    paperPass(root, 2);
  }
}
let now = 1000;

describe('paper pass auto-bake', () => {
  afterEach(() => vi.restoreAllMocks());

  function scene() {
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    const root = new Container();
    const g = root.addChild(new Graphics().circle(0, 0, 60).fill(0x3388dd));
    return { root, g };
  }

  it('keeps a still paper piece as one picture once it has held still', () => {
    const { root, g } = scene();
    passes(root, 2, 16);
    expect(g.isCachedAsTexture).toBe(false);
    passes(root, 30, 16);
    expect(g.isCachedAsTexture).toBe(true);
  });

  it('draws a piece live again while the game redraws it every frame', () => {
    const { root, g } = scene();
    passes(root, 40, 16);
    expect(g.isCachedAsTexture).toBe(true);
    passes(root, 5, 16, () => g.clear().circle(0, 0, 60).fill(0xdd3333));
    expect(g.isCachedAsTexture).toBe(false);
    passes(root, 90, 16);
    expect(g.isCachedAsTexture).toBe(true);
  });

  it('goes live while it pops much bigger, and bakes again when it settles', () => {
    const { root, g } = scene();
    passes(root, 40, 16);
    // The renderer refreshes a baked piece's world transform each frame; set it as a frame would.
    g.renderGroup!.worldTransform.scale(1.4, 1.4);
    passes(root, 1, 16);
    expect(g.isCachedAsTexture).toBe(false);
    passes(root, 40, 16);
    expect(g.isCachedAsTexture).toBe(true);
  });

  it('leaves flat drawings, and drawings with children, live', () => {
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    const root = new Container();
    const glow = root.addChild(new Graphics().circle(0, 0, 60).fill({ color: 0xffffff, alpha: 0.3 }));
    const parent = root.addChild(new Graphics().circle(0, 0, 60).fill(0x3388dd));
    parent.addChild(new Graphics().circle(0, 0, 20).fill(0x33dd88));
    passes(root, 40, 16);
    expect(glow.isCachedAsTexture).toBe(false);
    expect(parent.isCachedAsTexture).toBe(false);
    expect((parent.children[0] as Graphics).isCachedAsTexture).toBe(true);
  });
});
