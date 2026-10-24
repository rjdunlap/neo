import { Container, Graphics } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { cheek, ink, swatch } from '../../art/palette';
import type { Organism, Pt } from './logic';

/** Food Web Workshop's pictures, code-drawn and centred on (0, 0) in a box about 120 units across. */

const eye = (g: Graphics, x: number, y: number, r = 5) => g.circle(x, y, r).fill(ink).circle(x + r * 0.35, y - r * 0.35, r * 0.35).fill(0xffffff);

function clover(): Graphics {
  const g = new Graphics();
  g.moveTo(0, 50).quadraticCurveTo(4, 20, 0, -4).stroke({ width: 6, color: swatch.green.line, cap: 'round' });
  for (const [x, y, s] of [[-30, 10, 1], [26, 18, 0.9], [0, -22, 1.1]] as const) {
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / 3;
      g.circle(x + Math.cos(a) * 12 * s, y + Math.sin(a) * 12 * s, 13 * s);
    }
    g.fill(swatch.green.fill).stroke({ width: 3, color: swatch.green.line });
    g.circle(x, y, 4 * s).fill(swatch.green.light);
  }
  return g;
}

function dandelion(): Graphics {
  // Leaves only, no seed head, so it never looks like Seed Travelers' seeds.
  const g = new Graphics();
  for (const [a, len] of [[-2.3, 58], [-1.55, 64], [-0.8, 58], [-2.8, 44], [-0.3, 44]] as const) {
    const ex = Math.cos(a) * len, ey = Math.sin(a) * len + 40;
    const nx = -Math.sin(a) * 14, ny = Math.cos(a) * 14;
    g.moveTo(0, 40);
    // A toothed edge: three notches each side.
    for (let k = 1; k <= 3; k++) g.lineTo((ex * k) / 3.4 + nx * (k % 2 ? 1.2 : 0.6), 40 + ((ey - 40) * k) / 3.4 + ny * (k % 2 ? 1.2 : 0.6));
    g.lineTo(ex, ey);
    for (let k = 3; k >= 1; k--) g.lineTo((ex * k) / 3.4 - nx * (k % 2 ? 1.2 : 0.6), 40 + ((ey - 40) * k) / 3.4 - ny * (k % 2 ? 1.2 : 0.6));
    g.closePath().fill(0x5fbf4a).stroke({ width: 3, color: swatch.green.line, join: 'round' });
  }
  return g;
}

function caterpillar(): Graphics {
  const g = new Graphics();
  const segs = 5;
  for (let i = segs - 1; i >= 0; i--) {
    const x = -44 + i * 22, y = 18 + Math.sin(i * 1.2) * 6;
    g.circle(x, y, i === segs - 1 ? 21 : 17).fill(i % 2 ? swatch.green.fill : 0x9adf6a).stroke({ width: 3, color: swatch.green.line });
  }
  const hx = -44 + (segs - 1) * 22, hy = 18 + Math.sin((segs - 1) * 1.2) * 6;
  eye(g, hx + 6, hy - 5);
  g.circle(hx + 12, hy + 6, 3).fill(cheek);
  g.moveTo(hx - 4, hy - 18).lineTo(hx - 8, hy - 32).moveTo(hx + 6, hy - 18).lineTo(hx + 10, hy - 32).stroke({ width: 3, color: ink, cap: 'round' });
  g.circle(hx - 8, hy - 33, 3).circle(hx + 10, hy - 33, 3).fill(ink);
  return g;
}

function snail(): Graphics {
  const g = new Graphics();
  g.moveTo(-50, 40).quadraticCurveTo(-50, 22, -20, 22).lineTo(36, 22).quadraticCurveTo(52, 22, 52, 0).lineTo(56, -14)
    .quadraticCurveTo(62, 24, 40, 40).closePath().fill(0xf3d7a8).stroke({ width: 3, color: 0xb98c55, join: 'round' });
  g.moveTo(48, -6).lineTo(44, -30).moveTo(56, -6).lineTo(62, -28).stroke({ width: 3, color: 0xb98c55, cap: 'round' });
  g.circle(44, -31, 4).circle(62, -29, 4).fill(ink);
  g.circle(-6, -2, 34).fill(swatch.orange.fill).stroke({ width: 4, color: swatch.orange.line });
  g.moveTo(-6, -2);
  for (let t = 0; t < 4 * Math.PI; t += 0.25) g.lineTo(-6 + Math.cos(t) * t * 2.3, -2 + Math.sin(t) * t * 2.3);
  g.stroke({ width: 4, color: swatch.orange.line, cap: 'round' });
  return g;
}

function bird(): Graphics {
  const g = new Graphics();
  g.ellipse(-4, 8, 46, 38).fill(swatch.blue.fill).stroke({ width: 4, color: swatch.blue.line });
  g.ellipse(4, 22, 30, 20).fill(0xffe1b8);
  g.moveTo(-30, 0).quadraticCurveTo(-56, 14, -40, 34).quadraticCurveTo(-20, 26, -30, 0).fill(swatch.blue.line);
  g.moveTo(-48, 0).lineTo(-66, -12).lineTo(-62, 10).closePath().fill(swatch.blue.line);
  eye(g, 20, -6, 6);
  g.moveTo(38, -2).lineTo(56, 4).lineTo(38, 10).closePath().fill(swatch.yellow.fill).stroke({ width: 2, color: swatch.yellow.line, join: 'round' });
  g.moveTo(-10, 44).lineTo(-12, 54).moveTo(8, 44).lineTo(10, 54).stroke({ width: 4, color: swatch.orange.line, cap: 'round' });
  return g;
}

function bunny(): Container {
  const c = new Container();
  const b = new Critter(CRITTERS.bunny);
  b.alive = false;
  b.scale.set(0.3);
  b.y = 52;
  c.addChild(b);
  return c;
}

/** One organism at station size (about 120 units). */
export function organismArt(o: Organism): Container {
  switch (o) {
    case 'clover': return clover();
    case 'dandelion': return dandelion();
    case 'caterpillar': return caterpillar();
    case 'snail': return snail();
    case 'bird': return bird();
    case 'bunny': return bunny();
  }
}

/** A small (about 60-unit) picture of the organism, for cards and badges. */
export function iconArt(o: Organism, size = 60): Container {
  const c = new Container();
  const art = organismArt(o);
  art.scale.set(size / 120);
  c.addChild(art);
  return c;
}

export const STATION_TINT: Record<Organism, number> = {
  clover: 0xe4f7d8,
  dandelion: 0xeef9cf,
  caterpillar: 0xfff3c4,
  snail: 0xffe6cf,
  bunny: 0xfde3ee,
  bird: 0xdcefff,
};

/** A station's round ground. */
export function stationArt(o: Organism, r: number): Container {
  const c = new Container();
  c.addChild(new Graphics().circle(0, 0, r).fill(STATION_TINT[o]).stroke({ width: 6, color: 0xffffff }).circle(0, 0, r).stroke({ width: 3, color: swatch.white.line, alpha: 0.5 }));
  const art = organismArt(o);
  art.y = -18;
  c.addChild(art);
  return c;
}

/** A station's food badge: a round tag with the organism's icon. */
export function badgeArt(o: Organism, size: number): Container {
  const c = new Container();
  c.addChild(new Graphics().roundRect(-size / 2, -size / 2, size, size, 28).fill(0xffffff).stroke({ width: 5, color: swatch.yellow.line }));
  const icon = iconArt(o, size * 0.62);
  icon.y = 2;
  c.addChild(icon);
  return c;
}

/** A card: the eater with the food's icon at its mouth, and a replay mark. */
export function cardArt(food: Organism, eater: Organism, w: number, h: number): Container {
  const c = new Container();
  c.addChild(new Graphics().roundRect(-w / 2, -h / 2, w, h, 22).fill(0xfffdf6).stroke({ width: 5, color: 0xb98c55 }));
  const e = iconArt(eater, 100);
  e.position.set(-18, 6);
  const f = iconArt(food, 48);
  f.position.set(48, -10);
  c.addChild(e, f);
  // The replay mark: a small round arrow in the corner.
  const mark = new Graphics().circle(w / 2 - 26, h / 2 - 26, 17).fill(swatch.yellow.fill).stroke({ width: 3, color: swatch.yellow.line });
  mark.moveTo(w / 2 - 31, h / 2 - 35).lineTo(w / 2 - 18, h / 2 - 26).lineTo(w / 2 - 31, h / 2 - 17).closePath().fill(ink);
  c.addChild(mark);
  return c;
}

/** The Show our web picture: three dots joined by arrows, and a tick. */
export function webPicture(): Graphics {
  const g = new Graphics();
  const pts: Pt[] = [{ x: -40, y: 20 }, { x: 0, y: -24 }, { x: 40, y: 20 }];
  arrowShape(g, pts[0], pts[1], 0xffffff, 6, 14);
  arrowShape(g, pts[1], pts[2], 0xffffff, 6, 14);
  for (const p of pts) g.circle(p.x, p.y, 11).fill(0xffffff);
  g.moveTo(22, 40).lineTo(32, 50).lineTo(52, 28).stroke({ width: 7, color: 0xffffff, cap: 'round', join: 'round' });
  return g;
}

/** A straight arrow with a head at `b`, stopping `inset` short of both ends. */
export function arrowShape(g: Graphics, a: Pt, b: Pt, color: number, width: number, head: number, inset = 14) {
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const sx = a.x + ux * inset, sy = a.y + uy * inset, ex = b.x - ux * inset, ey = b.y - uy * inset;
  g.moveTo(sx, sy).lineTo(ex - ux * head * 0.8, ey - uy * head * 0.8).stroke({ width, color, cap: 'round' });
  g.moveTo(ex, ey).lineTo(ex - ux * head * 1.6 - uy * head, ey - uy * head * 1.6 + ux * head).lineTo(ex - ux * head * 1.6 + uy * head, ey - uy * head * 1.6 - ux * head).closePath().fill(color);
}

/** The hub icon: three creature circles joined by two arrows. */
export function webIcon(orgs: readonly [Organism, Organism, Organism] = ['clover', 'caterpillar', 'bird']): Container {
  const c = new Container();
  const pts: Pt[] = [{ x: -62, y: -20 }, { x: 0, y: -92 }, { x: 62, y: -20 }];
  const g = new Graphics();
  arrowShape(g, pts[0], pts[1], swatch.orange.fill, 8, 14, 40);
  arrowShape(g, pts[1], pts[2], swatch.orange.fill, 8, 14, 40);
  c.addChild(g);
  pts.forEach((p, i) => {
    const disc = new Graphics().circle(0, 0, 36).fill(STATION_TINT[orgs[i]]).stroke({ width: 4, color: swatch.white.line });
    disc.position.set(p.x, p.y);
    const icon = iconArt(orgs[i], 54);
    icon.position.set(p.x, p.y - 4);
    c.addChild(disc, icon);
  });
  return c;
}
