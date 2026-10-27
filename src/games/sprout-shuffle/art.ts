/**
 * Sprout Shuffle's drawings: copy tiles, parent plants, the sprout, bud cards, choice cards, the leaf Check, the hub
 * icon and the sticker. Pixi Graphics in palette colours; new art, not reused from the pet or Bug Builder.
 */
import { Container, Graphics, Text } from 'pixi.js';
import { cream, ink, swatch, type ColorName } from '../../art/palette';
import { finish } from '../../ui/buttons';
import type { Copy, Look } from './logic';

export const TILE = 120;
export const SLOT = 130;
export const BUD_W = 180;
export const BUD_H = 200;
export const CARD = 200;
export const CHECK_R = 70;

/** Three dark ovals (a spot copy) or one outlined ring (a plain copy), as a child Container so the ovals can lean. */
export function marks(copy: Copy, r: number): Container {
  const c = new Container();
  c.eventMode = 'none';
  if (copy === 'A') {
    for (const [dx, dy, rot] of [[-0.4, 0.14, 0.5], [0, -0.36, 0], [0.4, 0.14, -0.5]] as const) {
      const o = new Graphics().ellipse(0, 0, r * 0.2, r * 0.3).fill(ink);
      o.position.set(dx * r, dy * r);
      o.rotation = rot;
      c.addChild(o);
    }
  } else {
    c.addChild(new Graphics().circle(0, 0, r * 0.42).stroke({ width: Math.max(4, r * 0.14), color: ink }));
  }
  return c;
}

/** A round cream copy tile, `size` across, with its marks and the grown-up's small letter in the corner. */
export function tileArt(copy: Copy, size = TILE, letter = true): Container {
  const c = new Container();
  const r = size / 2;
  const g = new Graphics();
  g.ellipse(0, r * 0.92, r * 0.8, r * 0.18).fill({ color: 0x2b2440, alpha: 0.18 });
  g.circle(0, 0, r).fill(swatch.brown.line);
  g.circle(0, -2, r - 6).fill(cream);
  g.ellipse(-r * 0.3, -r * 0.45, r * 0.3, r * 0.16).fill({ color: 0xffffff, alpha: 0.5 });
  c.addChild(g, marks(copy, r * 0.62));
  if (letter) {
    const t = new Text({ text: copy, style: { fontFamily: 'Nunito, sans-serif', fontSize: Math.max(14, size * 0.17), fontWeight: '800', fill: swatch.brown.line } });
    t.anchor.set(0.5);
    t.position.set(r * 0.58, r * 0.58);
    t.eventMode = 'none';
    c.addChild(t);
  }
  return c;
}

/** A flower head: five petals in the plant's colour, each carrying the look's marks. `r` is the head radius. */
export function bloomArt(look: Look, color: ColorName, r: number): Container {
  const c = new Container();
  c.eventMode = 'none';
  const sw = swatch[color];
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
    const p = new Graphics().ellipse(0, 0, r * 0.3, r * 0.46).fill(sw.fill).stroke({ width: 4, color: sw.line });
    p.position.set(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55);
    p.rotation = a + Math.PI / 2;
    c.addChild(p);
    const m = marks(look === 'spotted' ? 'A' : 'a', r * 0.26);
    m.position.copyFrom(p.position);
    m.rotation = p.rotation;
    c.addChild(m);
  }
  c.addChild(new Graphics().circle(0, 0, r * 0.28).fill(swatch.yellow.fill).stroke({ width: 4, color: swatch.yellow.line }));
  return c;
}

/** A parent plant standing in a soil mound: stem, two leaves and its bloom. Its feet are at (0, 0); it stands about `h` tall. */
export function plantArt(look: Look, color: ColorName, h = 190): Container {
  const c = new Container();
  const g = new Graphics();
  g.ellipse(0, 0, h * 0.34, h * 0.09).fill(swatch.brown.fill).stroke({ width: 4, color: swatch.brown.line });
  g.moveTo(0, -4).bezierCurveTo(h * 0.04, -h * 0.3, -h * 0.04, -h * 0.5, 0, -h * 0.72).stroke({ width: 10, color: swatch.green.line, cap: 'round' });
  g.moveTo(0, -4).bezierCurveTo(h * 0.04, -h * 0.3, -h * 0.04, -h * 0.5, 0, -h * 0.72).stroke({ width: 5, color: swatch.green.fill, cap: 'round' });
  c.addChild(g);
  for (const side of [-1, 1]) {
    const leaf = new Graphics().ellipse(0, 0, h * 0.17, h * 0.075).fill(swatch.green.fill).stroke({ width: 4, color: swatch.green.line });
    leaf.position.set(side * h * 0.14, -h * (side < 0 ? 0.3 : 0.42));
    leaf.rotation = side * -0.5;
    c.addChild(leaf);
  }
  const bloom = bloomArt(look, color, h * 0.26);
  bloom.y = -h * 0.76;
  c.addChild(bloom);
  return c;
}

/** The sprout between the plants: a closed green bud that opens into a bloom carrying the sprout's look. */
export class Sprout extends Container {
  private readonly bud = new Graphics();
  private readonly stem = new Graphics();
  private bloom: Container | null = null;

  constructor(private readonly h: number) {
    super();
    this.eventMode = 'none';
    this.stem.moveTo(0, 0).bezierCurveTo(h * 0.05, -h * 0.3, -h * 0.03, -h * 0.5, 0, -h * 0.7).stroke({ width: 9, color: swatch.green.line, cap: 'round' });
    this.stem.moveTo(0, 0).bezierCurveTo(h * 0.05, -h * 0.3, -h * 0.03, -h * 0.5, 0, -h * 0.7).stroke({ width: 4, color: swatch.green.fill, cap: 'round' });
    const leaf = new Graphics().ellipse(0, 0, h * 0.15, h * 0.065).fill(swatch.green.fill).stroke({ width: 4, color: swatch.green.line });
    leaf.position.set(-h * 0.12, -h * 0.34);
    leaf.rotation = 0.5;
    this.drawBud(1);
    this.addChild(this.stem, leaf, this.bud);
  }

  /** The closed bud, `t` from 1 (closed) to 0 (gone). */
  private drawBud(t: number) {
    const h = this.h;
    this.bud.clear();
    if (t <= 0) return;
    this.bud.position.set(0, -h * 0.7);
    this.bud.ellipse(0, -h * 0.08 * t, h * 0.11 * t, h * 0.17 * t).fill(swatch.green.fill).stroke({ width: 4, color: swatch.green.line });
    this.bud.moveTo(-h * 0.08 * t, -h * 0.02).lineTo(0, -h * 0.26 * t).lineTo(h * 0.08 * t, -h * 0.02).stroke({ width: 3, color: swatch.green.line });
  }

  /** Closed again, for a new sprout. */
  close() {
    this.bloom?.destroy();
    this.bloom = null;
    this.drawBud(1);
  }

  /** The bloom at `t` of its uncurling (0 to 1): the bud shrinks away as the petals grow. */
  open(look: Look, color: ColorName, t: number) {
    this.drawBud(1 - t);
    if (!this.bloom) {
      this.bloom = bloomArt(look, color, this.h * 0.28);
      this.bloom.y = -this.h * 0.74;
      this.addChild(this.bloom);
    }
    const s = Math.max(0.01, t);
    this.bloom.scale.set(s);
  }
}

/** A slot ring under a parent's side of the sprout, outlined in that parent's colour. */
export function slotArt(color: ColorName, size = SLOT): Graphics {
  const sw = swatch[color];
  return new Graphics().circle(0, 0, size / 2).fill({ color: 0xffffff, alpha: 0.45 }).stroke({ width: 7, color: sw.line, alpha: 0.9 });
}

/** A bud card: two small source tiles at the top (left parent's, right parent's) and a closed bud, or its open sprout. */
export class BudCard extends Container {
  readonly face: Graphics;
  private readonly sproutArt: Sprout;
  private readonly glowRing = new Graphics();

  constructor(copies: readonly [Copy, Copy], colors: readonly [ColorName, ColorName], positions: readonly [0 | 1, 0 | 1]) {
    super();
    this.face = finish({ w: BUD_W, h: BUD_H, corner: 26 }, swatch.green, cream);
    this.addChild(this.glowRing, this.face);
    this.glowRing.eventMode = 'none';
    // Each source tile sits where it stands in its tray: the first tile left of centre, the second right.
    for (const side of [0, 1] as const) {
      const sx = (side === 0 ? -1 : 1) * BUD_W * 0.25;
      const ring = new Graphics().circle(0, 0, 26).stroke({ width: 4, color: swatch[colors[side]].line });
      ring.position.set(sx, -BUD_H / 2 + 42);
      const t = tileArt(copies[side], 44, false);
      t.position.copyFrom(ring.position);
      const dot = new Graphics().circle(0, 0, 5).fill(swatch[colors[side]].line);
      dot.position.set(sx + (positions[side] === 0 ? -1 : 1) * 14, -BUD_H / 2 + 76);
      ring.eventMode = t.eventMode = dot.eventMode = 'none';
      this.addChild(ring, t, dot);
    }
    const plus = new Graphics().moveTo(-8, 0).lineTo(8, 0).moveTo(0, -8).lineTo(0, 8).stroke({ width: 4, color: swatch.brown.line, cap: 'round' });
    plus.position.set(0, -BUD_H / 2 + 42);
    plus.eventMode = 'none';
    this.sproutArt = new Sprout(118);
    this.sproutArt.position.set(0, BUD_H / 2 - 16);
    this.addChild(plus, this.sproutArt);
  }

  /** Open to `t` (0 closed, 1 fully open) with the sprout's look, in the parent colour that gave the first copy. */
  open(look: Look, color: ColorName, t: number) {
    this.sproutArt.open(look, color, t);
  }

  close() {
    this.sproutArt.close();
  }

  /** A pulsing ring around the card (`r` is the pulse, about 1), or none. */
  glow(r: number | null) {
    this.glowRing.clear();
    if (r === null) return;
    this.glowRing.roundRect(-BUD_W / 2 - 10 * r, -BUD_H / 2 - 10 * r, BUD_W + 20 * r, BUD_H + 20 * r, 32).stroke({ width: 8, color: swatch.yellow.fill });
  }
}

/** A choice card: a picture of one sprout look, with a tick badge while chosen. */
export class ChoiceCard extends Container {
  private readonly badge = new Graphics();
  private readonly glowRing = new Graphics();
  chosen = false;

  constructor(readonly look: Look, color: ColorName) {
    super();
    const face = finish({ w: CARD, h: CARD, corner: 28 }, swatch.blue, cream);
    const pic = plantArt(look, color, 150);
    pic.position.set(0, CARD / 2 - 24);
    pic.eventMode = 'none';
    this.badge.eventMode = this.glowRing.eventMode = 'none';
    this.addChild(this.glowRing, face, pic, this.badge);
    this.setChosen(false);
  }

  setChosen(on: boolean) {
    this.chosen = on;
    this.badge.clear();
    if (!on) return;
    this.badge.circle(CARD / 2 - 28, -CARD / 2 + 28, 26).fill(swatch.green.fill).stroke({ width: 4, color: swatch.green.line });
    this.badge.moveTo(CARD / 2 - 40, -CARD / 2 + 28).lineTo(CARD / 2 - 31, -CARD / 2 + 38).lineTo(CARD / 2 - 15, -CARD / 2 + 18).stroke({ width: 6, color: 0xffffff, cap: 'round', join: 'round' });
  }

  glow(r: number | null) {
    this.glowRing.clear();
    if (r === null) return;
    this.glowRing.roundRect(-CARD / 2 - 10 * r, -CARD / 2 - 10 * r, CARD + 20 * r, CARD + 20 * r, 34).stroke({ width: 8, color: swatch.yellow.fill });
  }
}

/** The green leaf on the Check button. */
export function leafArt(): Graphics {
  const g = new Graphics();
  g.moveTo(-34, 26).bezierCurveTo(-40, -20, 0, -40, 36, -30).bezierCurveTo(40, 10, 10, 40, -34, 26).fill(swatch.green.light).stroke({ width: 5, color: swatch.green.line, join: 'round' });
  g.moveTo(-30, 24).lineTo(28, -24).stroke({ width: 4, color: swatch.green.line, cap: 'round' });
  return g;
}

/** The hub icon: a two-petal sprout, one petal spotted and one plain. Feet at (0, 0). */
export function iconArt(): Container {
  const c = new Container();
  const g = new Graphics();
  g.ellipse(0, 0, 54, 14).fill(swatch.brown.fill).stroke({ width: 4, color: swatch.brown.line });
  g.moveTo(0, -4).lineTo(0, -110).stroke({ width: 9, color: swatch.green.line, cap: 'round' });
  c.addChild(g);
  for (const [side, copy, color] of [[-1, 'A', 'pink'], [1, 'a', 'purple']] as const) {
    const p = new Graphics().ellipse(0, 0, 26, 44).fill(swatch[color].fill).stroke({ width: 4, color: swatch[color].line });
    p.position.set(side * 30, -130);
    p.rotation = side * 0.55;
    const m = marks(copy, 22);
    m.position.copyFrom(p.position);
    m.rotation = p.rotation;
    c.addChild(p, m);
  }
  c.addChild(new Graphics().circle(0, -108, 16).fill(swatch.yellow.fill).stroke({ width: 4, color: swatch.yellow.line }));
  return c;
}

/** A seeded sticker: a sprout in a tile ring, spotted or plain, in one petal colour. */
export function stickerArt(look: Look, color: ColorName): Container {
  const c = new Container();
  const plant = plantArt(look, color, 200);
  plant.y = 95;
  c.addChild(plant);
  return c;
}
