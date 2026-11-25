import { Container, Graphics } from 'pixi.js';
import { cream, ink, swatch, wood } from '../../art/palette';
import { actor } from './art';
import type { Card } from './cut';

/** The glyphs of what a card shows: its pictured event, and the things the requests name. */
export type FactKey =
  | 'looks'
  | 'finds'
  | 'smiles'
  | 'cloud-passes'
  | 'arrives'
  | 'pats'
  | 'opens'
  | 'holds-kite'
  | 'flutters'
  | 'box'
  | 'kite'
  | 'hat';

const line = { color: ink, width: 3 };

function kite(g: Graphics, x: number, y: number, s: number) {
  g.poly([x, y - s, x + s * 0.7, y, x, y + s * 1.1, x - s * 0.7, y])
    .fill(swatch.pink.fill)
    .stroke({ ...line, join: 'round' });
  g.moveTo(x, y + s * 1.1)
    .quadraticCurveTo(x - s * 0.5, y + s * 1.6, x + s * 0.2, y + s * 2)
    .stroke(line);
}
function hat(g: Graphics, x: number, y: number, s: number) {
  g.ellipse(x, y, s, s * 0.3)
    .fill(swatch.yellow.fill)
    .stroke(line);
  g.roundRect(x - s * 0.55, y - s * 0.9, s * 1.1, s * 0.85, s * 0.2)
    .fill(swatch.yellow.fill)
    .stroke(line);
}
function parcel(g: Graphics, x: number, y: number, w: number, h: number, open = false) {
  g.roundRect(x - w / 2, y - h / 2, w, h, 4)
    .fill(wood.fill)
    .stroke(line);
  if (open)
    g.poly([x - w / 2, y - h / 2, x - w / 2 - 6, y - h / 2 - 18, x + 4, y - h / 2 - 18, x + w / 2, y - h / 2])
      .fill(wood.line)
      .stroke(line);
  else
    g.moveTo(x - w / 2, y - h / 6)
      .lineTo(x + w / 2, y - h / 6)
      .stroke(line);
}
function butterfly(g: Graphics, x: number, y: number, s: number, flap = 1) {
  const wing = s * (0.45 + 0.55 * Math.abs(flap));
  for (const side of [-1, 1])
    g.ellipse(x + side * s * 0.5, y - s * 0.3, wing * 0.7, s * 0.7)
      .fill(swatch.pink.fill)
      .stroke({ color: ink, width: 2 });
  g.roundRect(x - 2, y - s * 0.8, 4, s * 1.4, 2).fill(ink);
}
function cloud(g: Graphics, x: number, y: number, s: number) {
  g.circle(x - s * 0.6, y, s * 0.5)
    .circle(x, y - s * 0.25, s * 0.65)
    .circle(x + s * 0.65, y, s * 0.5)
    .fill(cream)
    .stroke({ color: ink, width: 2 });
}

export function factGlyph(key: FactKey, size = 28): Graphics {
  const g = new Graphics();
  g.eventMode = 'none';
  const s = size;
  if (key === 'looks') {
    g.ellipse(0, 0, s, s * 0.6)
      .fill(cream)
      .stroke(line);
    g.circle(s * 0.15, 0, s * 0.32).fill(swatch.blue.line);
    g.circle(s * 0.25, -s * 0.1, s * 0.1).fill(cream);
  } else if (key === 'finds') {
    g.poly([
      0,
      -s,
      s * 0.25,
      -s * 0.25,
      s,
      0,
      s * 0.25,
      s * 0.25,
      0,
      s,
      -s * 0.25,
      s * 0.25,
      -s,
      0,
      -s * 0.25,
      -s * 0.25,
    ])
      .fill(swatch.yellow.fill)
      .stroke({ ...line, join: 'round' });
  } else if (key === 'smiles') {
    g.circle(0, 0, s).fill(swatch.yellow.fill).stroke(line);
    g.circle(-s * 0.35, -s * 0.25, s * 0.1)
      .circle(s * 0.35, -s * 0.25, s * 0.1)
      .fill(ink);
    g.moveTo(-s * 0.5, s * 0.15)
      .quadraticCurveTo(0, s * 0.8, s * 0.5, s * 0.15)
      .stroke(line);
  } else if (key === 'cloud-passes') {
    cloud(g, 0, 0, s * 0.9);
    g.moveTo(-s, s * 0.75)
      .lineTo(s, s * 0.75)
      .stroke({ color: swatch.teal.line, width: 3 });
  } else if (key === 'arrives') {
    parcel(g, s * 0.2, 0, s * 1.2, s * 0.9);
    g.moveTo(-s, -s * 0.9)
      .lineTo(-s * 0.4, -s * 0.9)
      .lineTo(-s * 0.55, -s * 1.1)
      .moveTo(-s * 0.4, -s * 0.9)
      .lineTo(-s * 0.55, -s * 0.7)
      .stroke(line);
  } else if (key === 'pats') {
    parcel(g, 0, s * 0.3, s * 1.4, s * 0.9);
    g.circle(0, -s * 0.7, s * 0.35)
      .fill(cream)
      .stroke(line);
    g.moveTo(-s * 0.7, -s * 0.2)
      .lineTo(-s * 0.5, -s * 0.05)
      .moveTo(s * 0.7, -s * 0.2)
      .lineTo(s * 0.5, -s * 0.05)
      .stroke(line);
  } else if (key === 'opens') {
    parcel(g, 0, s * 0.4, s * 1.4, s * 0.9, true);
    kite(g, 0, -s * 0.55, s * 0.4);
  } else if (key === 'holds-kite') {
    kite(g, 0, -s * 0.3, s * 0.7);
    g.circle(0, s * 0.85, s * 0.18)
      .fill(cream)
      .stroke(line);
  } else if (key === 'flutters') {
    butterfly(g, 0, 0, s * 0.9);
    g.moveTo(-s, s * 0.8)
      .quadraticCurveTo(-s * 0.4, s * 0.4, s * 0.1, s * 0.8)
      .stroke({ color: swatch.teal.line, width: 3 });
  } else if (key === 'box') parcel(g, 0, 0, s * 1.5, s * 1.1);
  else if (key === 'kite') kite(g, 0, -s * 0.2, s * 0.8);
  else hat(g, 0, s * 0.4, s);
  return g;
}

/** What each card's glyph is: its pictured event. */
export const glyphKey = (card: Card): FactKey => card.event as FactKey;

/** Silent footage of one card, about two seconds, the event reaching its cue at 0.8 s (a pure function of `t`). */
export function cutFootage(card: Card, t = 1): Container {
  const c = new Container();
  c.eventMode = 'none';
  const bg = new Graphics()
    .roundRect(-160, -90, 320, 180, 16)
    .fill(swatch.blue.light)
    .rect(-160, 35, 320, 55)
    .fill(swatch.green.light);
  c.addChild(bg);
  const f = Math.max(0, Math.min(1, t / 0.8));
  const after = Math.max(0, t - 0.8);
  const art = new Graphics();
  const id = card.id;
  if (id[0] === 'B') {
    bg.roundRect(35, -78, 110, 140, 8).fill(wood.fill).stroke({ color: wood.line, width: 4 });
    bg.rect(52, -62, 70, 122).fill(wood.line);
  }
  if (id === 'G0') c.addChild(actor('bunny', -40 + 35 * Math.sin(t * 3), 62, 0.51));
  if (id === 'G1') {
    c.addChild(actor('bunny', -75, 62, 0.51));
    // The hat sits under a leaf, which lifts at the cue.
    hat(art, 35, 55, 24);
    const lift = t >= 0.8 ? 38 * Math.min(1, after / 0.6) : 0;
    art
      .ellipse(35, 52 - lift, 34, 14)
      .fill(swatch.green.fill)
      .stroke(line);
  }
  if (id === 'G2') {
    c.addChild(actor('bunny', -45, 62, 0.51));
    hat(art, 50, 12 - 6 * Math.sin(after * 6), 26);
    if (t >= 0.8) art.circle(-18, 6, 4).circle(10, 6, 4).fill(ink);
  }
  if (id === 'G3') cloud(art, -110 + 220 * Math.min(1, t / 2), -45, 36);
  if (id === 'B0') {
    c.addChild(actor('bear', -75, 62, 0.57));
    parcel(art, 125 - 135 * f, 62, 54, 42);
  }
  if (id === 'B1') {
    c.addChild(actor('bunny', -70, 62, 0.51));
    parcel(art, 0, 62, 54, 42);
    art
      .circle(-14, 25 + Math.abs(Math.sin(after * 8)) * 6 - 6, 9)
      .fill(cream)
      .stroke(line);
  }
  if (id === 'B2') {
    c.addChild(actor('bunny', -70, 62, 0.51));
    parcel(art, 0, 62, 54, 42, t >= 0.8);
    if (t >= 0.8) kite(art, 0, 30 - 60 * Math.min(1, after / 0.8), 20);
  }
  if (id === 'B3') {
    c.addChild(actor('bunny', -45, 62, 0.51));
    kite(art, 20, -30 - 6 * Math.sin(after * 6), 26);
    art.moveTo(20, 15).lineTo(-8, 25).stroke({ color: ink, width: 2 });
  }
  if (id === 'B4')
    butterfly(art, -120 + 240 * Math.min(1, t / 2), -20 + 12 * Math.sin(t * 5), 18, Math.sin(t * 20));
  c.addChild(art);
  return c;
}
