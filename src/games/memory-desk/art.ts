/** Memory Desk's code-drawn pieces: the six tokens, the three panels with their picture labels, the buttons' arrows and the icons. */
import { Container, Graphics } from 'pixi.js';
import { cream, ink, shadow, swatch, wood } from '../../art/palette';
import { starPoints } from '../../art/shapes';
import type { Slot, Token } from './logic';

const line = (color: number, width = 5) => ({ width, color, join: 'round' as const, cap: 'round' as const });
const GLASS = { fill: swatch.blue.light, line: swatch.blue.line };

/** A token about `2r` across, centred on (0, 0). Each has its own outline as well as its own colour. */
export function tokenArt(token: Token, r = 40): Graphics {
  const g = new Graphics();
  if (token === 'star') {
    g.poly(starPoints(r * 1.1, r * 0.5))
      .fill(swatch.yellow.fill)
      .stroke(line(swatch.yellow.line));
  } else if (token === 'leaf') {
    g.moveTo(0, -r * 1.1)
      .quadraticCurveTo(r * 1.05, -r * 0.2, 0, r * 1.05)
      .quadraticCurveTo(-r * 1.05, -r * 0.2, 0, -r * 1.1)
      .fill(swatch.green.fill)
      .stroke(line(swatch.green.line));
    g.moveTo(0, -r * 0.7)
      .lineTo(0, r * 1.25)
      .stroke(line(swatch.green.line, 4));
    for (const y of [-0.25, 0.2]) {
      g.moveTo(0, r * (y + 0.2))
        .lineTo(r * 0.36, r * y - 2)
        .moveTo(0, r * (y + 0.2))
        .lineTo(-r * 0.36, r * y - 2)
        .stroke(line(swatch.green.line, 3));
    }
  } else if (token === 'shell') {
    // A scallop: a fan of five lobes over a small hinge.
    const pts: number[] = [-r * 0.3, r * 0.85];
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI + (i / 10) * Math.PI;
      const rr = r * (i % 2 === 0 ? 1.05 : 0.92);
      pts.push(Math.cos(a) * rr, Math.sin(a) * rr * 0.95 + r * 0.15);
    }
    pts.push(r * 0.3, r * 0.85);
    g.poly(pts).fill(swatch.pink.fill).stroke(line(swatch.pink.line));
    for (const k of [-0.6, -0.3, 0, 0.3, 0.6])
      g.moveTo(k * r * 0.4, r * 0.7)
        .lineTo(k * r * 1.2, -r * 0.5 + Math.abs(k) * r * 0.5)
        .stroke(line(swatch.pink.line, 3));
  } else if (token === 'acorn') {
    g.moveTo(-r * 0.72, -r * 0.2)
      .quadraticCurveTo(-r * 0.7, r * 0.9, 0, r * 1.15)
      .quadraticCurveTo(r * 0.7, r * 0.9, r * 0.72, -r * 0.2)
      .closePath()
      .fill(swatch.orange.fill)
      .stroke(line(swatch.orange.line));
    g.roundRect(-r * 0.92, -r * 0.72, r * 1.84, r * 0.62, r * 0.3)
      .fill(swatch.brown.fill)
      .stroke(line(swatch.brown.line));
    g.moveTo(0, -r * 0.72)
      .lineTo(r * 0.12, -r * 1.12)
      .stroke(line(swatch.brown.line, 6));
  } else if (token === 'feather') {
    const f = new Graphics();
    f.ellipse(0, -r * 0.15, r * 0.48, r * 1.0)
      .fill(swatch.blue.fill)
      .stroke(line(swatch.blue.line));
    f.moveTo(0, -r * 1.05)
      .lineTo(0, r * 1.3)
      .stroke(line(swatch.blue.line, 4));
    for (const y of [-0.5, -0.1, 0.3])
      f.moveTo(0, r * (y + 0.22))
        .lineTo(r * 0.4, r * y)
        .moveTo(0, r * (y + 0.22))
        .lineTo(-r * 0.4, r * y)
        .stroke(line(swatch.blue.light, 3));
    f.rotation = 0.6;
    g.addChild(f);
  } else {
    // A pebble: a lopsided smooth stone with a band.
    g.moveTo(-r * 1.05, r * 0.1)
      .bezierCurveTo(-r * 1.1, -r * 0.75, r * 0.2, -r * 0.95, r * 0.85, -r * 0.45)
      .bezierCurveTo(r * 1.35, 0, r * 0.8, r * 0.8, 0, r * 0.75)
      .bezierCurveTo(-r * 0.6, r * 0.75, -r * 1.0, r * 0.55, -r * 1.05, r * 0.1)
      .fill(swatch.white.light)
      .stroke(line(swatch.white.line));
    g.moveTo(-r * 0.75, -r * 0.1)
      .quadraticCurveTo(0, -r * 0.45, r * 0.85, -r * 0.05)
      .stroke(line(swatch.white.line, 4));
  }
  return g;
}

/** "Nothing": a dotted outline where a token would sit. */
export function emptyArt(r = 40): Graphics {
  const g = new Graphics();
  const n = 14;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    g.circle(Math.cos(a) * r, Math.sin(a) * r, 4).fill({ color: ink, alpha: 0.35 });
  }
  return g;
}

export const slotArt = (slot: Slot, r = 40): Graphics => (slot === null ? emptyArt(r) : tokenArt(slot, r));

/** A fat arrow pointing right, centred on (0, 0), `len` long; rotate it for other directions. */
export function fatArrow(len: number, color = ink): Graphics {
  const h = len * 0.2;
  return new Graphics()
    .poly([
      -len / 2,
      -h,
      len * 0.1,
      -h,
      len * 0.1,
      -h * 2.2,
      len / 2,
      0,
      len * 0.1,
      h * 2.2,
      len * 0.1,
      h,
      -len / 2,
      h,
    ])
    .fill(color);
}

export type PanelKind = 'tray' | 'drawer' | 'window';

/**
 * One of the desk's three places, `size` square and centred on (0, 0), with its picture label on the top edge: an arrow
 * going in over the tray, a little drawer over the drawer and an arrow coming out over the window. The token sits at (0, 12).
 */
export function panelArt(kind: PanelKind, size: number): Container {
  const c = new Container();
  const s = size / 2;
  const g = new Graphics();
  g.ellipse(0, s + 4, s * 0.86, 12).fill({ color: shadow, alpha: 0.2 });
  if (kind === 'tray') {
    g.roundRect(-s, -s, size, size, 22).fill(cream).stroke(line(wood.line, 6));
    // The tray: a shallow dish under the token.
    g.roundRect(-s + 22, 54, size - 44, 18, 9)
      .fill(wood.fill)
      .stroke(line(wood.line, 4));
  } else if (kind === 'drawer') {
    g.roundRect(-s, -s, size, size, 22).fill(wood.fill).stroke(line(wood.line, 6));
    // The glass front, so what is kept always shows.
    g.roundRect(-s + 16, -s + 30, size - 32, size - 62, 14)
      .fill(GLASS.fill)
      .stroke(line(GLASS.line, 4));
    g.moveTo(-s + 34, -s + 70)
      .lineTo(-s + 62, -s + 42)
      .stroke(line(0xffffff, 6));
    g.roundRect(-22, s - 24, 44, 12, 6).fill(wood.line);
  } else {
    g.roundRect(-s, -s, size, size, 22).fill(swatch.teal.fill).stroke(line(swatch.teal.line, 6));
    g.roundRect(-s + 18, -s + 30, size - 36, size - 52, 12)
      .fill(cream)
      .stroke(line(swatch.teal.line, 4));
    g.moveTo(0, -s + 30)
      .lineTo(0, s - 22)
      .moveTo(-s + 18, 12)
      .lineTo(s - 18, 12)
      .stroke({ width: 3, color: swatch.teal.line, alpha: 0.25 });
  }
  c.addChild(g);
  // The picture label, on a cream badge straddling the top edge.
  const badge = new Container();
  badge.addChild(new Graphics().roundRect(-34, -24, 68, 48, 16).fill(cream).stroke(line(ink, 4)));
  if (kind === 'drawer') {
    badge.addChild(
      new Graphics()
        .roundRect(-20, -12, 40, 24, 5)
        .fill(wood.fill)
        .stroke(line(wood.line, 3))
        .roundRect(-7, -3, 14, 6, 3)
        .fill(wood.line),
    );
  } else {
    const a = fatArrow(34, kind === 'tray' ? swatch.green.line : swatch.teal.line);
    a.rotation = kind === 'tray' ? Math.PI / 2 : -Math.PI / 2;
    badge.addChild(a);
  }
  badge.y = -s;
  c.addChild(badge);
  c.eventMode = 'none';
  return c;
}

/** What Keep and Show wear: a small picture of where the copy comes from, an arrow, and where it goes. */
export function actionIcon(kind: 'keep' | 'show'): Container {
  const c = new Container();
  const mini = (k: PanelKind, x: number) => {
    const g = new Graphics();
    if (k === 'tray') g.roundRect(-16, 4, 32, 9, 4).fill(wood.fill).stroke(line(wood.line, 3));
    else if (k === 'drawer')
      g.roundRect(-16, -13, 32, 26, 5)
        .fill(wood.fill)
        .stroke(line(wood.line, 3))
        .roundRect(-6, -2, 12, 5, 2)
        .fill(wood.line);
    else g.roundRect(-16, -14, 32, 28, 5).fill(cream).stroke(line(swatch.teal.line, 4));
    g.x = x;
    return g;
  };
  c.addChild(
    mini(kind === 'keep' ? 'tray' : 'drawer', -42),
    fatArrow(36, ink),
    mini(kind === 'keep' ? 'drawer' : 'window', 42),
  );
  return c;
}

/** The hub icon: a drawer with a star behind its glass. Feet on (0, 0). */
export function iconArt(): Container {
  const c = new Container();
  const p = panelArt('drawer', 120);
  p.removeChildAt(1).destroy();
  const star = tokenArt('star', 26);
  star.y = 4;
  p.addChild(star);
  p.y = -64;
  c.addChild(p);
  return c;
}

/** The sticker: a token in the drawer. */
export function stickerArt(token: Token): Container {
  const c = new Container();
  const p = panelArt('drawer', 150);
  p.removeChildAt(1).destroy();
  const t = tokenArt(token, 34);
  t.y = 6;
  p.addChild(t);
  p.y = -80;
  c.addChild(p);
  return c;
}

/**
 * A hatch, `size` square and centred on (0, 0): a little box whose lid is up with an arrow going in (open) or flat
 * with a bar across it (shut). The lid's shape tells the two apart, not the colour.
 */
export function hatchArt(open: boolean, size: number): Container {
  const c = new Container();
  const s = size / 2;
  const sw = open ? swatch.green : swatch.orange;
  const g = new Graphics();
  g.ellipse(0, s + 4, s * 0.8, 10).fill({ color: shadow, alpha: 0.2 });
  g.roundRect(-s, -s, size, size, 22).fill(sw.light).stroke(line(sw.line, 6));
  // The box the token drops into.
  g.roundRect(-s + 22, 4, size - 44, s - 20, 10)
    .fill(wood.fill)
    .stroke(line(wood.line, 5));
  if (open) {
    // The lid, swung up on its hinge at the left.
    g.moveTo(-s + 22, 2)
      .lineTo(-s + 40, -s + 16)
      .stroke(line(wood.line, 10));
    const a = fatArrow(40, swatch.green.line);
    a.rotation = Math.PI / 2;
    a.position.set(8, -18);
    c.addChild(g, a);
  } else {
    g.roundRect(-s + 16, -8, size - 32, 16, 8)
      .fill(wood.light)
      .stroke(line(wood.line, 5));
    // The bar: nothing goes in.
    g.roundRect(-s + 26, -34, size - 52, 14, 7).fill(ink);
    c.addChild(g);
  }
  return c;
}

/**
 * One step's two results, `w` wide and centred on (0, 0): the drawer's token after the step in a little drawer, and the
 * window's in a little window. Not yet run: two empty frames.
 */
export function traceArt(cell: { stored: Slot; output: Slot } | null, w: number, h: number): Container {
  const c = new Container();
  const g = new Graphics();
  const bw = w / 2 - 6;
  const x = w / 4;
  g.roundRect(-x - bw / 2, -h / 2 + 2, bw, h - 4, 8)
    .fill(cell ? GLASS.fill : cream)
    .stroke(line(wood.line, 4));
  g.roundRect(-9 - x, h / 2 - 9, 18, 5, 2).fill(wood.line);
  g.roundRect(x - bw / 2, -h / 2 + 2, bw, h - 4, 8)
    .fill(cream)
    .stroke(line(swatch.teal.line, 4));
  c.addChild(g);
  if (cell) {
    const a = slotArt(cell.stored, 13);
    a.position.set(-x, -3);
    const b = slotArt(cell.output, 13);
    b.position.set(x, 0);
    c.addChild(a, b);
  }
  c.eventMode = 'none';
  return c;
}

/** The sign: a picture of the window with the wanted token in it, under a little flag pin. */
export function signArt(token: Token, size: number): Container {
  const c = new Container();
  const s = size / 2;
  const g = new Graphics();
  g.roundRect(-s, -s, size, size, 20).fill(swatch.yellow.light).stroke(line(ink, 6));
  g.roundRect(-s + 16, -s + 16, size - 32, size - 32, 12)
    .fill(cream)
    .stroke(line(swatch.teal.line, 5));
  const t = tokenArt(token, size * 0.24);
  // A star-shaped pin at the corner marks this as the one that is wanted.
  const pin = new Graphics().poly(starPoints(15, 7)).fill(swatch.red.fill).stroke(line(swatch.red.line, 3));
  pin.position.set(s - 8, -s + 8);
  c.addChild(g, t, pin);
  c.eventMode = 'none';
  return c;
}

/** A turtle for the Slow toggle: a filled shell when Slow is on. */
export function turtleArt(on: boolean): Graphics {
  const g = new Graphics();
  const sh = on ? swatch.green : swatch.white;
  g.ellipse(-4, 2, 26, 17).fill(sh.fill).stroke(line(sh.line, 4));
  g.ellipse(-4, 0, 14, 9).stroke(line(sh.line, 3));
  g.circle(25, 0, 9).fill(swatch.green.light).stroke(line(swatch.green.line, 3));
  g.circle(28, -2, 2).fill(ink);
  for (const x of [-20, 8])
    g.roundRect(x, 12, 11, 9, 4).fill(swatch.green.light).stroke(line(swatch.green.line, 3));
  return g;
}

/** Step: one arrow up to a stop bar, "run one". */
export function stepArt(): Graphics {
  return new Graphics()
    .poly([-20, -22, 12, 0, -20, 22])
    .fill(0xffffff)
    .roundRect(16, -22, 9, 44, 4)
    .fill(0xffffff);
}
