import { Container, Graphics } from 'pixi.js';
import { label } from '../../ui/text';
import { cream, ink, swatch } from '../../art/palette';
import { shapePath } from '../../art/shapes';
import { BUG_TOKENS, PLACE_TAP, signSize, type KindWant } from './logic';

export function bugToken(token: number, size = 32): Graphics {
  const t = BUG_TOKENS[token],
    color = swatch[t.color];
  return shapePath(new Graphics(), t.shape, size).fill(color.fill).stroke({ width: 4, color: color.line });
}
/** An open place on a wing: a faint cream disc where a stamp can go. */
export function openPlace(): Graphics {
  return new Graphics()
    .circle(0, 0, 50)
    .fill(cream)
    .stroke({ width: 3, color: swatch.orange.line, alpha: 0.6 });
}
/**
 * A stamp on a place that can still be tapped (lifted on the count levels, chosen on Mend the wing), over an unseen disc
 * the size of the place's touch circle: a small stamp such as a triangle then measures as large as it is to touch.
 */
export function stampedPlace(token: number): Container {
  const c = new Container();
  c.addChild(new Graphics().circle(0, 0, PLACE_TAP).fill({ color: 0xffffff, alpha: 0 }), bugToken(token, 38));
  return c;
}
/** A wing uses the body's center as its hinge, including the spots added by the game. */
export function bugWing(rows: number, columns: number, side: number): Graphics {
  const g = new Graphics(),
    ry = rows === 1 ? 105 : rows === 2 ? 156 : 207;
  const rx = columns === 1 ? 108 : 155,
    cx = columns === 1 ? 94 : 135;
  for (let row = -1; row <= 1; row++)
    g.moveTo(side * (cx + rx - 25), row * 65)
      .lineTo(side * (cx + rx + 18), row * 90 + 20)
      .stroke({ width: 9, color: swatch.purple.line, cap: 'round' });
  return g
    .ellipse(side * cx, 0, rx, ry)
    .fill(swatch.orange.light)
    .stroke({ width: 7, color: swatch.orange.line });
}
export function bugBody(rows = 3, columns = 1, wings?: readonly [Container, Container]): Container {
  const c = new Container(),
    g = new Graphics();
  const ry = rows === 1 ? 105 : rows === 2 ? 156 : 207;
  for (const [i, side] of [-1, 1].entries()) {
    const wing = bugWing(rows, columns, side);
    if (wings) {
      wings[i].addChild(wing);
      c.addChild(wings[i]);
    } else c.addChild(wing);
  }
  g.ellipse(0, 0, 26, ry + 4)
    .fill(swatch.purple.fill)
    .stroke({ width: 5, color: swatch.purple.line });
  const headY = -ry + 12;
  g.moveTo(-22, headY - 26)
    .quadraticCurveTo(-65, headY - 90, -74, headY - 46)
    .moveTo(22, headY - 26)
    .quadraticCurveTo(65, headY - 90, 74, headY - 46)
    .stroke({ width: 6, color: swatch.purple.line, cap: 'round' });
  g.ellipse(0, headY, 52, 43).fill(swatch.purple.fill).stroke({ width: 5, color: swatch.purple.line });
  for (const x of [-20, 20])
    g.circle(x, headY - 6, 12)
      .fill(cream)
      .circle(x + 2, headY - 5, 5)
      .fill(ink);
  g.moveTo(-12, headY + 17)
    .quadraticCurveTo(0, headY + 29, 12, headY + 17)
    .stroke({ width: 4, color: cream, cap: 'round' });
  c.addChild(g);
  return c;
}
export function bugSticker(seed = 0): Container {
  const c = bugBody(2);
  for (const x of [-94, 94])
    for (const y of [-58, 58]) {
      const p = bugToken(((seed % 4) + (y > 0 ? 1 : 0)) % 4);
      p.position.set(x, y);
      c.addChild(p);
    }
  c.scale.set(0.52);
  c.y = -92;
  return c;
}

const SIGN_DOT = 15,
  SIGN_GAP = 44;

/**
 * Level 8's count sign: the number asked for, written large over the same number of hollow dots, which fill as spots land
 * on the bug; each spot past the number hangs below the card as a filled dot, so "one too many" shows without a word.
 * Decoration only: it takes no touches.
 */
export class CountSign extends Container {
  private readonly card = new Graphics();
  private readonly dots = new Graphics();
  /** Level 9's shape marks, one small drawing each, redrawn with the count. */
  private readonly shapes = new Container();
  readonly halfW: number;
  readonly halfH: number;

  /** On level 9 each mark is drawn in the sign's kind: dots of its color, or its shape. */
  constructor(
    private readonly want: number,
    private readonly kind: KindWant | null = null,
  ) {
    super();
    ({ halfW: this.halfW, halfH: this.halfH } = signSize(want));
    this.card
      .roundRect(-this.halfW, -this.halfH, this.halfW * 2, this.halfH * 2, 22)
      .fill(cream)
      .stroke({ width: 5, color: swatch.orange.line });
    const numeral = label(String(want), 76, swatch.purple.line);
    numeral.y = -this.halfH + 50;
    this.addChild(this.card, numeral, this.dots, this.shapes);
    this.eventMode = 'none';
    this.show(0);
  }

  /** Redraw for the spots on the bug now. */
  show(have: number) {
    const d = this.dots.clear(),
      top = -this.halfH + 88 + 18 + SIGN_GAP / 2 - 9;
    const k = this.kind,
      shape = k?.attr === 'shape' ? k.value : 'circle',
      color = swatch[k?.attr === 'color' ? k.value : 'pink'];
    this.shapes.removeChildren().forEach((c) => c.destroy());
    const mark = (x: number, y: number): Graphics => {
      if (shape === 'circle') return d.circle(x, y, SIGN_DOT);
      const g = shapePath(new Graphics(), shape, SIGN_DOT + 2);
      g.position.set(x, y);
      return this.shapes.addChild(g);
    };
    for (let i = 0; i < this.want; i++) {
      const row = Math.floor(i / 3),
        inRow = Math.min(3, this.want - row * 3);
      const m = mark(((i % 3) - (inRow - 1) / 2) * SIGN_GAP, top + row * SIGN_GAP);
      if (i < have) m.fill(color.fill).stroke({ width: 4, color: color.line });
      // A kind sign shows its color even before a stamp lands; level 8's open dots stay white.
      else if (k?.attr === 'color')
        m.fill({ color: color.fill, alpha: 0.3 }).stroke({ width: 4, color: color.line, alpha: 0.6 });
      else m.fill(0xffffff).stroke({ width: 4, color: ink, alpha: 0.45 });
    }
    const extras = Math.max(0, have - this.want);
    for (let i = 0; i < extras; i++)
      mark((i - (extras - 1) / 2) * SIGN_GAP, this.halfH + SIGN_DOT + 12)
        .fill(color.fill)
        .stroke({ width: 4, color: color.line });
  }
}
