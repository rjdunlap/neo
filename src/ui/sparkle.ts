import { Container, Graphics } from 'pixi.js';
import { swatch } from '../art/palette';
import { starPoints } from '../art/shapes';
import type { Updatable } from '../app/Scene';

/**
 * A small twinkling star that marks something she has not tried yet. It only decorates: it never takes
 * a touch, never goes away on a timer and says nothing. Track it so it twinkles.
 */
export class Sparkle extends Container implements Updatable {
  private clock = Math.random() * 6;

  constructor(size = 26) {
    super();
    const gold = swatch.yellow;
    const big = new Graphics().poly(starPoints(size, size * 0.4, 4)).fill(gold.fill).stroke({ width: 4, color: gold.line, join: 'round' });
    const glint = new Graphics().circle(-size * 0.1, -size * 0.1, size * 0.14).fill({ color: 0xffffff, alpha: 0.9 });
    const small = new Graphics().poly(starPoints(size * 0.42, size * 0.17, 4)).fill(0xffffff).stroke({ width: 2.5, color: gold.line, join: 'round' });
    small.position.set(size * 0.95, size * 0.7);
    this.addChild(big, glint, small);
    this.eventMode = 'none';
  }

  update(dt: number) {
    this.clock += dt;
    this.scale.set(1 + 0.16 * Math.sin(this.clock * 3.2));
    this.rotation = 0.12 * Math.sin(this.clock * 1.6);
  }
}
