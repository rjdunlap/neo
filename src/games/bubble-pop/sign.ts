import { Container, Graphics } from 'pixi.js';
import { ink, swatch } from '../../art/palette';
import type { View } from '../../engine/view';
import { label } from '../../ui/text';
import { drawBubble } from './bubble';
import { numberDots, type TargetSign } from './logic';

/** The sign sits in the strip above where bubbles can drift (their tops stay 110 units below the top edge). */
const TOP = 14;
const HEIGHT = 84;
const PAD = 28;
const GAP = 16;

/** A small arrow in a bubble color, pointing the way the counting goes. */
function arrow(dir: 1 | -1, color: number): Graphics {
  return new Graphics().poly([-12 * dir, -18, 14 * dir, 0, -12 * dir, 18]).fill(color).stroke({ width: 4, color, join: 'round' });
}

/** The number to make or count from, shown the whole round beside a little picture of what to do with it. */
export class TargetSignView extends Container {
  private readonly pill = new Graphics();
  /** Whole width of the sign, kept for tests and layout. */
  readonly span: number;

  constructor(sign: TargetSign) {
    super();
    this.eventMode = 'none';
    const parts: Container[] = [];
    const add = (c: Container, width: number) => {
      parts.push(c);
      c.x = width / 2; // placed by `row` below
      (c as Container & { w: number }).w = width;
    };
    const numeral = label(sign.kind === 'by' ? `${sign.n}s` : String(sign.n), 64, ink);
    if (sign.kind === 'bond') {
      // Two bubbles together make the number.
      const two = new Container();
      for (const x of [-26, 26]) {
        const b = drawBubble(new Graphics(), 24, null, 0.3);
        b.x = x;
        two.addChild(b);
      }
      const equals = new Graphics().roundRect(-17, -14, 34, 7, 3).roundRect(-17, 7, 34, 7, 3).fill(ink);
      add(two, 100);
      add(equals, 34);
    } else if (sign.kind === 'back') {
      add(arrow(-1, swatch.orange.fill), 34);
    }
    add(numeral, Math.max(48, numeral.width));
    if (sign.dots) {
      const dice = new Graphics();
      for (const d of numberDots(sign.n)) dice.circle(d.x * 70, (d.y - 0.59) * 70, 6).fill(ink);
      add(dice, 40);
    }
    if (sign.kind === 'start' || sign.kind === 'by') add(arrow(1, swatch.green.fill), 34);

    let x = 0;
    for (const c of parts) {
      const w = (c as Container & { w: number }).w;
      c.x = x + w / 2;
      x += w + GAP;
    }
    this.span = x - GAP;
    for (const c of parts) {
      c.x -= this.span / 2;
      c.y = HEIGHT / 2;
      this.addChild(c);
    }
    const w = this.span + PAD * 2;
    this.pill.roundRect(-w / 2, 0, w, HEIGHT, HEIGHT / 2).fill({ color: 0xffffff, alpha: 0.9 }).stroke({ width: 4, color: swatch.blue.line, alpha: 0.5 });
    this.addChildAt(this.pill, 0);
    this.y = TOP;
  }

  resize(view: View) {
    this.x = view.w / 2;
  }
}
