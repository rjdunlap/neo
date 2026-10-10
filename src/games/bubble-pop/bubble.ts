import { Container, Graphics } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { RAINBOW, swatch, type ColorName } from '../../art/palette';
import { label } from '../../ui/text';
import type { Friend } from './logic';

const PLAIN_RIM = 0x8fd0ff;

/** A highlight arc. Pixi joins an arc to the previous point, so start a fresh path first. */
function shine(g: Graphics, r: number, width: number, alpha: number) {
  const [a0, a1] = [Math.PI * 1.05, Math.PI * 1.45];
  return g
    .moveTo(Math.cos(a0) * r, Math.sin(a0) * r)
    .arc(0, 0, r, a0, a1)
    .stroke({ width, color: 0xffffff, alpha, cap: 'round' });
}

/** A soap bubble: a clear body, a colored rim and a bright highlight. */
export function drawBubble(g: Graphics, r: number, color: ColorName | null, fillAlpha?: number): Graphics {
  const tint = color ? swatch[color].fill : 0xcfeeff;
  // Colored bubbles are nearly solid so the color is unmistakable; plain ones stay see-through.
  g.circle(0, 0, r).fill({ color: tint, alpha: fillAlpha ?? (color ? 0.78 : 0.2) });
  g.circle(0, 0, r).stroke({ width: Math.max(3, r * 0.07), color: color ? swatch[color].line : PLAIN_RIM, alpha: 0.9 });
  shine(g, r * 0.72, r * 0.1, 0.85);
  return g.circle(r * 0.45, r * 0.42, r * 0.06).fill({ color: 0xffffff, alpha: 0.7 });
}

/** The finale bubble, ringed with every color. */
export function drawRainbowBubble(g: Graphics, r: number): Graphics {
  g.circle(0, 0, r).fill({ color: 0xffffff, alpha: 0.25 });
  RAINBOW.forEach((c, i) => g.circle(0, 0, r - i * r * 0.055).stroke({ width: r * 0.06, color: swatch[c].fill, alpha: 0.9 }));
  return shine(g, r * 0.6, r * 0.09, 0.9);
}

export interface BubbleOptions {
  r: number;
  color: ColorName | null;
  number?: number;
  critter?: Friend;
  rainbow?: boolean;
}

/** A bubble that floats up (or drifts in place) with a wobble. Anything inside rides along. */
export class Bubble extends Container {
  readonly r: number;
  readonly color: ColorName | null;
  readonly number?: number;
  readonly rainbow: boolean;
  /** Which friend rides inside, kept after the critter itself is let out. */
  readonly friend?: Friend;
  critter: Critter | null = null;
  vx = 0;
  vy = 0;
  popped = false;
  /** Seconds left on the "this one!" glow. */
  glow = 0;

  private readonly shell = new Container();
  private readonly ring = new Graphics();
  private clock = Math.random() * 10;
  private readonly swayAmp: number;
  private boing = 0;

  constructor(o: BubbleOptions) {
    super();
    this.r = o.r;
    this.color = o.color;
    this.number = o.number;
    this.rainbow = !!o.rainbow;
    this.swayAmp = 14 + Math.random() * 16;
    this.addChild(this.ring, this.shell);

    this.friend = o.critter;
    if (o.critter) {
      this.critter = new Critter(CRITTERS[o.critter]);
      this.critter.scale.set((o.r * 1.15) / 300);
      this.critter.y = o.r * 0.55;
      this.shell.addChild(this.critter);
    }
    const g = new Graphics();
    if (o.rainbow) drawRainbowBubble(g, o.r);
    else drawBubble(g, o.r, o.color);
    this.shell.addChild(g);
    if (o.number !== undefined) {
      const t = label(String(o.number), o.r * 1.05, 0x2b2b3a);
      t.y = o.r * 0.04;
      this.shell.addChild(t);
    }
  }

  /** A springy "not that one". */
  bounce() {
    this.boing = 1;
    this.vy -= 40;
    this.vx += (Math.random() - 0.5) * 120;
  }

  update(dt: number) {
    this.clock += dt;
    this.critter?.update(dt);
    this.boing = Math.max(0, this.boing - dt * 2.2);
    const wob = 0.04 * Math.sin(this.clock * 3) + 0.22 * this.boing * Math.sin(this.boing * 18);
    this.shell.scale.set(1 + wob, 1 - wob);
    this.shell.x = Math.sin(this.clock * 0.9) * this.swayAmp * 0.3;

    this.glow = Math.max(0, this.glow - dt);
    this.ring.clear();
    if (this.glow > 0) {
      const pulse = 1 + 0.08 * Math.sin(this.clock * 9);
      this.ring.circle(this.shell.x, 0, this.r * 1.18 * pulse).fill({ color: 0xfff3a0, alpha: 0.55 });
    }
  }
}
