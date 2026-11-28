import { Container, Graphics, Rectangle, type Text } from 'pixi.js';
import { ink, swatch } from '../../art/palette';
import { label } from '../../ui/text';
import { DOT_R, dotLayout, PAD_HIT, type HopScene } from './logic';

// The lily pad and its dots, shared by the main line and Hop along (level 16).

/** The first row of dots under a pad's numeral, clear of the numeral (y 44) and inside the pad's step. */
export const DOTS_Y = 82;

/** Dots for a numeral, fives grouped (`dotLayout`), centred on (x, y). */
export function drawDots(g: Graphics, n: number, x: number, y: number) {
  for (const d of dotLayout(n)) g.circle(x + d.x, y + d.y, DOT_R).fill(swatch.blue.fill);
}

/** What the frog lands on in each scene, inside the lily pad's 96 × 56 oval. */
export function drawPad(g: Graphics, scene: HopScene) {
  if (scene === 'brook') {
    // A flat stepping stone with a lighter top and the brook lapping at its front.
    g.ellipse(0, 0, 48, 28)
      .fill(swatch.brown.light)
      .stroke({ width: 5, color: swatch.brown.line })
      .ellipse(-6, -6, 30, 14)
      .fill(swatch.white.light)
      .moveTo(-40, 22)
      .quadraticCurveTo(-20, 30, 0, 24)
      .quadraticCurveTo(20, 18, 40, 24)
      .stroke({ width: 3, color: swatch.teal.line });
  } else if (scene === 'flowers') {
    // A white daisy, unlike the small pink landmark bloom on 5, 10, 15 and 20.
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      g.ellipse(Math.cos(a) * 30, Math.sin(a) * 15, 16, 11)
        .fill(swatch.white.fill)
        .stroke({ width: 3, color: swatch.white.line });
    }
    g.ellipse(0, 0, 18, 11).fill(swatch.orange.fill).stroke({ width: 3, color: swatch.orange.line });
  } else {
    g.ellipse(0, 0, 48, 28)
      .fill(swatch.green.light)
      .stroke({ width: 5, color: swatch.green.line })
      .moveTo(0, 0)
      .lineTo(30, -16)
      .stroke({ width: 4, color: swatch.green.line });
  }
}

export class Pad extends Container {
  readonly num: Text;
  n = 0;
  constructor(scene: HopScene = 'pond') {
    super();
    const art = new Graphics();
    drawPad(art, scene);
    this.addChild(art);
    this.num = label('0', 34, ink);
    this.num.y = 44;
    this.addChild(this.num);
    this.hitArea = new Rectangle(-PAD_HIT.w / 2, -PAD_HIT.h / 2, PAD_HIT.w, PAD_HIT.h);
  }
  /** `n` is the pad's place on the line; `shown` is what it reads (on the tens line, ten times its place). */
  set(n: number, shown = n) {
    this.n = n;
    this.num.text = String(shown);
  }
  /** Fraction levels: show a name (or nothing) under the pad without changing which tick it is. */
  mark(text: string) {
    this.num.text = text;
  }
}
