import { Container, Graphics } from 'pixi.js';
import { swatch } from '../../art/palette';
import { ease, type Tweener } from '../../engine/tween';
import { label } from '../../ui/text';
import { dotRows, GUIDE_CORNER_W, padRowY, UPRIGHT_SIDE, type PondView } from './logic';

/** Level 16: a card's widest and tallest size, and the gap between outlines (the width shrinks, never the height, to fit a view). */
const CARD_W = 120;
const CARD_H = 104;
const CARD_GAP = 20;
const DOT_R = 4.5;
const DOT_GAP = 11;

/** Where the row of `count` outlines sits in a view and how wide each is: centred in the width the guide's corner leaves upright. */
export function cardRowLayout(v: PondView, count: number) {
  const gap = v.upright ? 12 : CARD_GAP;
  const avail = v.upright ? v.w - GUIDE_CORNER_W - 2 * UPRIGHT_SIDE : v.w - 2 * GUIDE_CORNER_W;
  const w = Math.min(CARD_W, (avail - (count - 1) * gap) / count);
  const cx = v.upright ? (v.w + GUIDE_CORNER_W) / 2 : v.w / 2;
  const y = padRowY(v);
  return {
    w,
    h: CARD_H,
    gap,
    y,
    xs: Array.from({ length: count }, (_, i) => cx + (i - (count - 1) / 2) * (w + gap)),
  };
}

/**
 * Level 16's row of cards under the pond: one faint outline for every way still to find (never counted aloud), and a card
 * that slides into the next outline each time she keeps a new split. Display only: nothing here is a tap target.
 */
export class CardRow extends Container {
  private readonly outlines = new Graphics();
  private readonly cards: { right: number; node: Container }[] = [];
  private count = 0;
  private view: PondView = { w: 1366, h: 1024 };

  constructor(private readonly tw: Tweener) {
    super();
    this.eventMode = 'none';
    this.addChild(this.outlines);
  }

  /** Starts a round: `count` empty outlines (the ways to find) and no cards. */
  reset(count: number) {
    for (const c of this.cards) c.node.destroy({ children: true });
    this.cards.length = 0;
    this.count = count;
    this.layout(this.view);
  }

  layout(v: PondView) {
    this.view = v;
    const row = cardRowLayout(v, Math.max(1, this.count));
    const g = this.outlines.clear();
    row.xs.slice(0, this.count).forEach((x) => {
      g.roundRect(x - row.w / 2, row.y - row.h / 2, row.w, row.h, 14)
        .fill({ color: 0xffffff, alpha: 0.18 })
        .stroke({ width: 4, color: 0xffffff, alpha: 0.55 });
    });
    this.cards.forEach((c, i) => c.node.position.set(row.xs[i], row.y));
  }

  /** A card slides into the next empty outline: two small groups of dots in five-frame order, and the numerals. */
  add(left: number, right: number) {
    const i = this.cards.length;
    if (i >= this.count) return;
    const row = cardRowLayout(this.view, this.count);
    const node = new Container();
    const face = new Graphics()
      .roundRect(-row.w / 2, -row.h / 2, row.w, row.h, 14)
      .fill(0xffffff)
      .stroke({ width: 5, color: swatch.brown.line });
    node.addChild(face);
    const text = label(`${left} and ${right}`, Math.round(row.w * 0.26), 0x5a3a22);
    text.anchor.set(0.5);
    text.y = -row.h / 2 + 24;
    node.addChild(text);
    const dots = new Graphics();
    for (const [n, sw, dx] of [
      [left, swatch.yellow, -row.w * 0.25],
      [right, swatch.blue, row.w * 0.25],
    ] as const) {
      const rows = dotRows(n, DOT_GAP);
      const top = 10;
      for (const [x, y] of rows)
        dots
          .circle(dx + x, top + y, DOT_R)
          .fill(sw.fill)
          .stroke({ width: 2, color: sw.line });
    }
    node.addChild(dots);
    node.position.set(row.xs[i], row.y - 40);
    node.alpha = 0;
    node.scale.set(0.6);
    this.addChild(node);
    this.cards.push({ right, node });
    void this.tw.to(node, { y: row.y, alpha: 1 }, { duration: 0.4, ease: ease.outBack });
    void this.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.4, ease: ease.outBack });
  }

  /** A quick pulse on the cards that hold these right counts (a split found again, or a pair of swapped cards). */
  pulse(rights: readonly number[]) {
    for (const c of this.cards) {
      if (!rights.includes(c.right)) continue;
      void this.tw
        .to(c.node.scale, { x: 1.14, y: 1.14 }, { duration: 0.18 })
        .then(() =>
          c.node.destroyed ? undefined : this.tw.to(c.node.scale, { x: 1, y: 1 }, { duration: 0.25 }),
        );
    }
  }
}
