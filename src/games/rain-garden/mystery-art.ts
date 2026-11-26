/** Level 8's pictures: the cover over the patch, the two plan slots, the two idea cards and the pond rows' badges. */
import { Container, Graphics } from 'pixi.js';
import { ink, swatch } from '../../art/palette';
import { dropArt, patchArt, resultBadge } from './art';
import { ghostRows, type Rule, type Size } from './mystery';

const WATER = swatch.blue;

/** The covered patch: soil under a pale cloth with a question mark, so nothing inside it can be read. */
export function coverArt(w: number, h: number): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-w / 2, -h / 2 + 6, w, h - 6, 26)
    .fill(0xf4efe0)
    .stroke({ width: 5, color: swatch.brown.line });
  g.moveTo(-w / 2 + 30, -h / 2 + 6)
    .lineTo(-w / 2 + 30, h / 2)
    .moveTo(w / 2 - 30, -h / 2 + 6)
    .lineTo(w / 2 - 30, h / 2)
    .stroke({ width: 3, color: swatch.brown.light, alpha: 0.7 });
  // A question mark drawn from a curve and a dot.
  g.moveTo(-16, -22)
    .bezierCurveTo(-16, -52, 22, -52, 22, -26)
    .bezierCurveTo(22, -8, 0, -8, 0, 12)
    .stroke({ width: 10, color: ink, cap: 'round', join: 'round', alpha: 0.8 });
  g.circle(0, 34, 7).fill({ color: ink, alpha: 0.8 });
  c.addChild(g);
  return c;
}

/** The soil bed under the cover, with its two pockets (drawn dashed) so a lifted cover shows how full it ended. */
export function bedArt(
  w: number,
  h: number,
  pockets: { x: number; y: number; w: number; h: number }[],
): Graphics {
  return patchArt('soil', w, h, pockets, 1);
}

/** A plan slot: nothing, a small rain of two drops, or a big rain of four. */
export function slotArt(size: 0 | Size): Container {
  const c = new Container();
  c.addChild(
    new Graphics()
      .roundRect(-56, -56, 112, 112, 24)
      .fill(size ? swatch.blue.light : 0xf4f1e6)
      .stroke({ width: size ? 5 : 4, color: size ? WATER.line : swatch.brown.line }),
  );
  if (size === 0) {
    const dash = new Graphics()
      .roundRect(-30, -30, 60, 60, 16)
      .stroke({ width: 4, color: swatch.brown.line, alpha: 0.5 });
    c.addChild(dash);
    return c;
  }
  const spots: [number, number][] =
    size === 2
      ? [
          [-18, 0],
          [18, 0],
        ]
      : [
          [-20, -22],
          [20, -22],
          [-20, 22],
          [20, 22],
        ];
  const scale = size === 2 ? 34 : 32;
  for (const [x, y] of spots) {
    const d = dropArt(scale);
    d.position.set(x, y);
    c.addChild(d);
  }
  return c;
}

/** A small cloud badge with two or four dashed drops: which rain made a pond row. */
export function sizeBadge(size: Size): Graphics {
  const g = new Graphics()
    .moveTo(-16, 16)
    .bezierCurveTo(-32, 16, -32, -6, -17, -7)
    .bezierCurveTo(-16, -24, 11, -25, 16, -8)
    .bezierCurveTo(32, -8, 34, 16, 18, 16)
    .closePath()
    .fill(0xf0faff)
    .stroke({ width: 3, color: WATER.line });
  const spots: [number, number][] =
    size === 2
      ? [
          [-7, 3],
          [7, 3],
        ]
      : [
          [-12, 0],
          [-4, 6],
          [4, 0],
          [12, 6],
        ];
  for (const [x, y] of spots) g.circle(x, y, 3.5).stroke({ width: 2, color: WATER.line });
  return g;
}

/** The mini rows on a lit idea card: what its rule would have left in the pond, ring for `reset`, square for `keep`. */
function ghostArt(rule: Rule, plan: readonly Size[]): Graphics {
  const g = new Graphics();
  ghostRows(rule, plan).forEach((pond, row) => {
    for (let i = 0; i < 4; i++) {
      const x = (i - 1.5) * 18;
      const y = 34 + row * 16;
      const on = i < pond;
      const shape = (r: number) =>
        rule === 'reset' ? g.circle(x, y, r) : g.rect(x - r, y - r, 2 * r, 2 * r);
      shape(5.5)
        .fill(on ? 0xf8fdff : 0xe8e4d8)
        .stroke({ width: 2, color: on ? WATER.line : swatch.brown.line });
    }
  });
  return g;
}

/**
 * An idea card: a patch with a wipe arrow (`reset`, "empties between rains") or a patch with a water mark that stays
 * (`keep`, "stays full"). A marked card has a bright rim and a tick, so it reads without colour; ghost rows sit under the
 * picture after the second miss.
 */
export function ideaCardArt(rule: Rule, lit: boolean, ghosts: readonly Size[] | null): Container {
  const c = new Container();
  c.addChild(
    new Graphics()
      .roundRect(-56, -56, 112, 112, 24)
      .fill(lit ? 0xfffbe6 : 0xf4f1e6)
      .stroke({ width: lit ? 8 : 4, color: lit ? swatch.yellow.fill : swatch.brown.line }),
  );
  const y = ghosts ? -26 : -8;
  const bed = new Graphics()
    .roundRect(-32, y - 14, 64, 28, 10)
    .fill(0xb98a5e)
    .stroke({ width: 3, color: swatch.brown.line });
  c.addChild(bed);
  if (rule === 'keep') {
    const d = dropArt(20);
    d.position.set(0, y);
    c.addChild(d);
  } else {
    // A wipe arrow curling out under the patch.
    c.addChild(
      new Graphics()
        .moveTo(-22, y + 20)
        .lineTo(22, y + 20)
        .moveTo(12, y + 12)
        .lineTo(22, y + 20)
        .lineTo(12, y + 28)
        .stroke({ width: 5, color: ink, cap: 'round', join: 'round', alpha: 0.8 }),
    );
  }
  if (ghosts) c.addChild(ghostArt(rule, ghosts));
  if (lit) {
    const tick = resultBadge(true);
    tick.position.set(44, -44);
    c.addChild(tick);
  }
  return c;
}
