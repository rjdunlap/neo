import { Container, Graphics, Rectangle } from 'pixi.js';
import { cheek, ink, RAINBOW, wood, type ColorName } from '../../art/palette';
import { FRUIT_FOR, type PropKind } from '../../art/props';
import { BASKET_HIT } from './logic';

/** Fill and Dump's wicker basket and fruit, shared by the basket levels and level 6's pair. */
export const line = (color: number, width = 6) => ({ width, color, join: 'round' as const, cap: 'round' as const });

/** Fruit that sit well together in a basket, each with the color it always has. */
export const FRUITS: { kind: PropKind; color: ColorName }[] = RAINBOW.flatMap((color) => {
  const kind = FRUIT_FOR[color];
  return kind ? [{ kind, color }] : [];
});

export const GROUND_SCALE = 1.1;
export const BASKET_SCALE = 0.7;
/** The basket's body is this tall above its feet; its rim is this far up. */
export const BODY_H = 150;

/** A wicker basket with a handle, drawn in two parts so the fruit sits between the back of it and the front. */
export class Basket {
  readonly back = new Container();
  readonly front = new Container();
  private readonly face = new Graphics();
  private pop = 0;
  private shake = 0;
  private clock = 0;
  private _lean = 0;

  /** `size` scales the whole basket (level 6 stands two side by side). */
  constructor(readonly size = 1) {
    const rimW = 130;
    const inside = new Graphics().ellipse(0, -BODY_H, rimW, 26).fill(0x7a5330);
    const handle = new Graphics()
      .moveTo(-rimW + 14, -BODY_H)
      .bezierCurveTo(-rimW + 6, -BODY_H - 130, rimW - 6, -BODY_H - 130, rimW - 14, -BODY_H)
      .stroke(line(wood.line, 18))
      .moveTo(-rimW + 14, -BODY_H)
      .bezierCurveTo(-rimW + 6, -BODY_H - 130, rimW - 6, -BODY_H - 130, rimW - 14, -BODY_H)
      .stroke(line(wood.light, 8));
    this.back.addChild(handle, inside);

    const body = new Graphics()
      .moveTo(-rimW, -BODY_H)
      .lineTo(-104, -12)
      .quadraticCurveTo(-100, 0, -86, 0)
      .lineTo(86, 0)
      .quadraticCurveTo(100, 0, 104, -12)
      .lineTo(rimW, -BODY_H)
      .closePath()
      .fill(wood.fill)
      .stroke(line(wood.line));
    for (const y of [-112, -74, -36]) {
      const k = 1 - (y + BODY_H) / BODY_H; // narrower toward the bottom
      const half = rimW - (rimW - 100) * (1 - k);
      body.moveTo(-half + 6, y).lineTo(half - 6, y).stroke(line(wood.line, 3));
    }
    for (let x = -80; x <= 80; x += 40) body.moveTo(x, -BODY_H + 10).lineTo(x * 0.8, -6).stroke({ width: 3, color: wood.line, alpha: 0.35 });
    const rim = new Graphics().roundRect(-rimW - 8, -BODY_H - 14, rimW * 2 + 16, 30, 15).fill(wood.light).stroke(line(wood.line));
    this.front.addChild(body, rim, this.face);
    this.drawFace(false);

    for (const part of [this.back, this.front]) part.hitArea = new Rectangle(-BASKET_HIT.halfW, -BASKET_HIT.top, BASKET_HIT.halfW * 2, BASKET_HIT.top + BASKET_HIT.bottom);
  }

  get lean() {
    return this._lean;
  }
  set lean(v: number) {
    this._lean = v;
    this.back.rotation = this.front.rotation = v;
  }

  /** A little squish when touched, and a happy face for a moment. */
  squish() {
    this.pop = 1;
    this.drawFace(true);
  }

  /** "Not quite": a head shake. */
  nope() {
    this.shake = 1;
  }

  place(x: number, y: number) {
    this.back.position.set(x, y);
    this.front.position.set(x, y);
  }

  update(dt: number) {
    this.clock += dt;
    const was = this.pop > 0;
    this.pop = Math.max(0, this.pop - dt * 3);
    if (was && this.pop === 0) this.drawFace(false);
    this.shake = Math.max(0, this.shake - dt * 2.5);
    const s = Math.sin(this.pop * Math.PI);
    for (const part of [this.back, this.front]) {
      part.scale.set(this.size * (1 + 0.06 * s), this.size * (1 - 0.07 * s));
      part.pivot.x = -10 * Math.sin(this.shake * 22) * this.shake;
    }
  }

  private drawFace(happy: boolean) {
    const f = this.face.clear();
    f.circle(-40, -80, 13).circle(40, -80, 13).fill(0xffffff).circle(-37, -77, 7).circle(43, -77, 7).fill(ink);
    f.ellipse(-72, -58, 14, 8).ellipse(72, -58, 14, 8).fill({ color: cheek, alpha: 0.55 });
    if (happy) f.ellipse(3, -50, 20, 15).fill(0x7a2e3e);
    else f.moveTo(-20, -56).quadraticCurveTo(3, -36, 26, -56).stroke(line(ink, 5));
  }
}
