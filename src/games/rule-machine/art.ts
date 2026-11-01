/** Rule Machine's machine, cars, counters and changed creatures, code-drawn from the palette. Nothing here is shared art. */
import { Container, Graphics, Text } from 'pixi.js';
import { Critter, CRITTERS, type CritterSpec } from '../../art/critter';
import { cream, ink, swatch, wood } from '../../art/palette';
import { BODY_H, BODY_W, CHUTE_W, HOPPER, type Picture } from './logic';

const FONT = 'Nunito, sans-serif';

/** A party hat in the critter's body coordinates, sitting on the head. */
function hat(): Graphics {
  const g = new Graphics();
  g.poly([-46, -222, 46, -222, 0, -330]).fill(swatch.purple.fill).stroke({ width: 7, color: swatch.purple.line, join: 'round' });
  g.circle(-14, -258, 9).circle(14, -285, 8).circle(-4, -306, 6).fill(swatch.yellow.fill);
  g.circle(0, -334, 16).fill(swatch.pink.fill).stroke({ width: 5, color: swatch.pink.line });
  g.roundRect(-56, -232, 112, 22, 11).fill(swatch.yellow.fill).stroke({ width: 5, color: swatch.yellow.line });
  return g;
}

/** A creature as a picture shows it, feet on (0, 0), `size` units tall at the normal size (big is 1.35 times that). */
export function creature(p: Picture, size: number, alive = true): Critter {
  const base: CritterSpec = CRITTERS[p.creature];
  const spec: CritterSpec = p.look === 'blue' ? { ...base, color: 'blue', earColor: base.earColor ? 'blue' : undefined } : p.look === 'spots' ? { ...base, spots: true } : base;
  const c = new Critter(spec);
  c.alive = alive;
  if (p.look === 'hat') c.attach(hat());
  c.scale.set((size / 250) * (p.look === 'big' ? 1.35 : 1));
  return c;
}

/** One counter, `r` in radius. */
function counter(g: Graphics, x: number, y: number, r: number) {
  g.circle(x, y, r).fill(swatch.red.fill).stroke({ width: Math.max(2, r * 0.25), color: swatch.red.line });
}

/** Counters in rows of five (so 7 reads as five and two), centred on (0, 0). */
export function counters(n: number, r: number): Graphics {
  const g = new Graphics();
  const pitch = r * 2.5;
  const rows = Math.ceil(n / 5);
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / 5), col = i % 5;
    const inRow = Math.min(5, n - row * 5);
    counter(g, (col - (inRow - 1) / 2) * pitch, (row - (rows - 1) / 2) * pitch, r);
  }
  return g;
}

export function numeral(n: number, size: number, fill = ink): Text {
  const t = new Text({ text: String(n), style: { fontFamily: FONT, fontSize: size, fontWeight: '800', fill, align: 'center' } });
  t.anchor.set(0.5);
  return t;
}

/** A car like Pattern Train's wagons, `w` wide, standing on (0, 0), carrying `n` counters and its numeral on the side. */
export function car(n: number, w: number): Container {
  const c = new Container();
  const h = w * 0.62;
  const g = new Graphics();
  g.roundRect(-w / 2, -h - 14, w, h, 16).fill(wood.light).stroke({ width: 5, color: wood.line });
  g.circle(-w * 0.28, -12, 12).circle(w * 0.28, -12, 12).fill(ink);
  g.circle(-w * 0.28, -12, 4).circle(w * 0.28, -12, 4).fill(cream);
  c.addChild(g);
  const dots = counters(n, w * 0.055);
  dots.position.set(0, -h - 14 + h * 0.36);
  c.addChild(dots);
  const t = numeral(n, w * 0.26, wood.line);
  t.position.set(0, -14 - h * 0.24);
  c.addChild(t);
  return c;
}

export interface MachineArt {
  node: Container;
  /** The body's see-through window, where the change shows while it runs. */
  window: Container;
  /** Lights along the top that fill as rows of the current machine run. */
  lights: Graphics;
  /** The machine's small picture of what it does, on its front. */
  badge: Container;
}

/** The whole machine with the body's centre on (0, 0): the hopper on the left, the chute on the right. */
export function machine(): MachineArt {
  const node = new Container();
  const g = new Graphics();
  const bx = -BODY_W / 2, by = -BODY_H / 2;
  // Hopper: a funnel whose mouth is HOPPER wide, feeding the body's left side.
  const hx = bx - HOPPER / 2;
  g.poly([hx - HOPPER / 2, -HOPPER / 2 - 10, hx + HOPPER / 2, -HOPPER / 2 - 10, hx + 30, 30, hx - 30, 30]).fill(swatch.teal.fill).stroke({ width: 7, color: swatch.teal.line, join: 'round' });
  g.rect(hx - 30, 20, 60 + 30, 40).fill(swatch.teal.fill).stroke({ width: 6, color: swatch.teal.line });
  // Body.
  g.roundRect(bx, by, BODY_W, BODY_H, 28).fill(swatch.orange.fill).stroke({ width: 8, color: swatch.orange.line });
  g.roundRect(bx + 30, by + 26, BODY_W - 60, BODY_H - 70, 18).fill({ color: 0xffffff, alpha: 0.85 }).stroke({ width: 5, color: swatch.orange.line });
  // Chute: a slope down to the right.
  const cx = bx + BODY_W;
  g.poly([cx - 6, 10, cx + CHUTE_W, BODY_H / 2 - 30, cx + CHUTE_W, BODY_H / 2 - 4, cx - 6, 50]).fill(swatch.blue.fill).stroke({ width: 6, color: swatch.blue.line, join: 'round' });
  // Gears on the top.
  g.circle(bx + 70, by - 6, 22).circle(bx + BODY_W - 70, by - 6, 22).fill(swatch.yellow.fill).stroke({ width: 5, color: swatch.yellow.line });
  node.addChild(g);
  const window = new Container();
  window.position.set(0, by + 26 + (BODY_H - 70) / 2);
  const lights = new Graphics();
  const badge = new Container();
  badge.position.set(0, by + BODY_H - 22);
  node.addChild(window, lights, badge);
  return { node, window, lights, badge };
}

/** The lights along the body's top: `lit` of `of` glowing. */
export function drawLights(g: Graphics, lit: number, of: number) {
  g.clear();
  for (let i = 0; i < of; i++) {
    const x = (i - (of - 1) / 2) * 34;
    g.circle(x, -BODY_H / 2 + 4, 11).fill(i < lit ? swatch.yellow.fill : 0xffffff).stroke({ width: 4, color: swatch.orange.line });
  }
}

/** The machine's small picture on its front: a hat, a blue drop, a grow arrow, spots, or a plus and counters. Never an "=". */
export function badge(rule: { kind: 'look'; change: Picture['look'] } | { kind: 'num'; b: number }): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-70, -18, 140, 36, 18).fill(cream).stroke({ width: 4, color: swatch.orange.line });
  c.addChild(g);
  const d = new Graphics();
  if (rule.kind === 'num') {
    d.rect(-46, -3, 18, 6).rect(-40, -9, 6, 18).fill(ink);
    for (let i = 0; i < rule.b; i++) counter(d, -6 + i * 22, 0, 8);
  } else if (rule.change === 'hat') {
    d.poly([-14, 10, 14, 10, 0, -14]).fill(swatch.purple.fill).stroke({ width: 3, color: swatch.purple.line });
  } else if (rule.change === 'blue') {
    d.circle(0, 4, 10).poly([-9, 0, 9, 0, 0, -16]).fill(swatch.blue.fill);
  } else if (rule.change === 'big') {
    d.rect(-26, 0, 12, 12).rect(-4, -14, 26, 26).stroke({ width: 4, color: ink });
  } else {
    d.circle(-14, 0, 6).circle(2, -6, 5).circle(14, 4, 6).fill(ink);
  }
  c.addChild(d);
  return c;
}

/** A white tile with a coloured edge: a pad, a picture card or a table column. */
export function card(w: number, h: number, edge: number = swatch.blue.line): Graphics {
  return new Graphics().roundRect(-w / 2, -h / 2, w, h, 18).fill(0xffffff).stroke({ width: 5, color: edge });
}

/** The table's down arrow between in and out. */
export function arrow(size: number): Graphics {
  return new Graphics().rect(-4, -size / 2, 8, size * 0.6).poly([-12, size * 0.1, 12, size * 0.1, 0, size / 2]).fill(ink);
}
