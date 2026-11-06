/** Playdate Workshop's code-drawn pictures: pages, banner cells, the stamp pad and roller, request bubbles and plan cards. */
import { Container, Graphics } from 'pixi.js';
import { Critter, CRITTERS, type CritterName } from '../../art/critter';
import { cream, ink, shadow, swatch, wood, type Swatch } from '../../art/palette';
import { againIcon, checkIcon } from '../../ui/icons';
import type { BannerTheme, Friend, PlanId, RequestId, StampPicture, Surface } from './logic';

const line = (color: number, width: number) => ({ color, width, cap: 'round' as const, join: 'round' as const });

/** Each friend's colour for marks and page borders: left warm, right cool, never the only cue. */
export const FRIEND_SWATCH: Record<Friend, Swatch> = { A: swatch.orange, B: swatch.blue };
export const THEME: Record<BannerTheme, Swatch> = { sun: swatch.yellow, sea: swatch.teal, leaf: swatch.green };

/** A stamped picture, centred, about `size` across. */
export function stampArt(pic: StampPicture, size: number, color: number): Graphics {
  const g = new Graphics();
  const r = size / 2;
  if (pic === 'star') {
    const pts: number[] = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? r * 0.45 : r;
      pts.push(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    g.poly(pts).fill(color);
  } else if (pic === 'flower') {
    for (let i = 0; i < 5; i++) {
      const a = (i * 2 * Math.PI) / 5;
      g.circle(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.42).fill(color);
    }
    g.circle(0, 0, r * 0.3).fill(0xffffff);
  } else {
    g.ellipse(-r * 0.15, 0, r * 0.7, r * 0.45).fill(color);
    g.poly([r * 0.45, 0, r, -r * 0.45, r, r * 0.45]).fill(color);
    g.circle(-r * 0.5, -r * 0.1, r * 0.1).fill(0xffffff);
  }
  return g;
}

/** A friend's page: a sheet with a border in their colour and a corner tab with their dot. */
export function pageArt(size: number, sw: Swatch): Graphics {
  const g = new Graphics();
  g.roundRect(-size / 2 + 5, -size / 2 + 7, size, size, 18).fill({ color: shadow, alpha: 0.12 });
  g.roundRect(-size / 2, -size / 2, size, size, 18).fill(0xffffff).stroke(line(sw.line, 8));
  g.circle(size / 2 - 22, -size / 2 + 22, 11).fill(sw.fill);
  return g;
}

/** One banner cell: a pennant with the theme's colour. */
export function cellArt(size: number, theme: Swatch): Graphics {
  const g = new Graphics();
  g.roundRect(-size / 2, -size / 2, size, size, 14).fill(theme.light).stroke(line(theme.line, 6));
  g.poly([-size / 2 + 8, -size / 2 + 4, size / 2 - 8, -size / 2 + 4, 0, -size / 2 + 22]).fill({ color: theme.fill, alpha: 0.7 });
  return g;
}

/** The stamp pad: an inked box with a handle. */
export function padArt(size: number): Container {
  const c = new Container();
  const g = new Graphics();
  const w = size * 0.8;
  g.roundRect(-w / 2, -size * 0.05, w, size * 0.32, 12).fill(swatch.purple.fill).stroke(line(swatch.purple.line, 5));
  g.roundRect(-w / 2 + 10, -size * 0.02, w - 20, size * 0.12, 6).fill(swatch.purple.line);
  g.roundRect(-size * 0.12, -size * 0.4, size * 0.24, size * 0.36, 10).fill(wood.fill).stroke(line(wood.line, 5));
  c.addChild(g);
  return c;
}

/** The big roller with a handle at each end. */
export function rollerArt(size: number): Container {
  const c = new Container();
  const g = new Graphics();
  const w = size * 0.55;
  g.moveTo(-size * 0.45, -size * 0.25).lineTo(-w / 2, 0).moveTo(size * 0.45, -size * 0.25).lineTo(w / 2, 0).stroke(line(wood.line, 7));
  g.circle(-size * 0.45, -size * 0.25, size * 0.08).fill(wood.fill).stroke(line(wood.line, 4));
  g.circle(size * 0.45, -size * 0.25, size * 0.08).fill(wood.fill).stroke(line(wood.line, 4));
  g.roundRect(-w / 2, -size * 0.12, w, size * 0.3, 14).fill(swatch.red.fill).stroke(line(swatch.red.line, 5));
  for (let i = -1; i <= 1; i++) g.moveTo(i * w * 0.25, -size * 0.08).lineTo(i * w * 0.25, size * 0.14).stroke(line(swatch.red.line, 3));
  c.addChild(g);
  return c;
}

/** A small face: the friend's critter colour with two eyes and a smile (always calm). */
export function faceArt(kind: CritterName, r: number): Graphics {
  const spec = CRITTERS[kind] as { color: keyof typeof swatch };
  const sw = swatch[spec.color] ?? swatch.white;
  const g = new Graphics();
  g.circle(0, 0, r).fill(sw.fill).stroke(line(sw.line, Math.max(2, r * 0.12)));
  g.circle(-r * 0.35, -r * 0.15, r * 0.12).fill(ink).circle(r * 0.35, -r * 0.15, r * 0.12).fill(ink);
  g.arc(0, r * 0.15, r * 0.35, 0.2 * Math.PI, 0.8 * Math.PI).stroke(line(ink, Math.max(2, r * 0.1)));
  return g;
}

/** A friend standing, about `height` tall, feet at (0, 0). */
export function friendArt(kind: CritterName, height: number): Critter {
  const c = new Critter(CRITTERS[kind]);
  c.scale.set(height / 250);
  c.eventMode = 'none';
  return c;
}

export interface Pictured {
  cast: [CritterName, CritterName];
  picture: StampPicture;
  theme: BannerTheme;
}

/** A tiny page with a stamp and its owner's face. */
function miniPage(p: Pictured, f: Friend, size: number, stamped = true): Container {
  const c = new Container();
  c.addChild(pageArt(size, FRIEND_SWATCH[f]));
  if (stamped) c.addChild(stampArt(p.picture, size * 0.5, FRIEND_SWATCH[f].fill));
  const face = faceArt(p.cast[f === 'A' ? 0 : 1], size * 0.2);
  face.position.set(-size / 2 + size * 0.15, size / 2 - size * 0.15);
  c.addChild(face);
  return c;
}

/** A tiny banner of `n` stamped cells with both faces under it. */
function miniBanner(p: Pictured, n: number, w: number): Container {
  const c = new Container();
  const cell = Math.min(46, (w - (n - 1) * 4) / n);
  const x0 = -((n - 1) * (cell + 4)) / 2;
  for (let i = 0; i < n; i++) {
    const g = cellArt(cell, THEME[p.theme]);
    g.position.set(x0 + i * (cell + 4), 0);
    const s = stampArt(p.picture, cell * 0.55, FRIEND_SWATCH[i % 2 ? 'B' : 'A'].fill);
    s.position.copyFrom(g.position);
    c.addChild(g, s);
  }
  return c;
}

/** What a request bubble shows: the thing asked for and who it is for. */
export function requestPicture(req: RequestId, f: Friend, p: Pictured, w: number, h: number): Container {
  const c = new Container();
  const both = () => {
    const fa = faceArt(p.cast[0], 15);
    const fb = faceArt(p.cast[1], 15);
    fa.position.set(-22, 0);
    fb.position.set(22, 0);
    const row = new Container();
    row.addChild(fa, fb);
    return row;
  };
  if (req === 'page' || req === 'own') {
    const page = miniPage(p, f, Math.min(90, h - 40));
    c.addChild(page);
  } else if (req === 'banner') {
    const b = miniBanner(p, 4, w - 50);
    b.y = -14;
    const faces = both();
    faces.y = 34;
    c.addChild(b, faces);
  } else {
    const b = miniBanner(p, 2, w * 0.45);
    b.position.set(-w * 0.22, -10);
    const faces = both();
    faces.position.set(-w * 0.22, 34);
    const or = new Graphics().circle(0, 0, 4).fill(ink);
    or.position.set(0, 0);
    const pa = miniPage(p, 'A', 44);
    const pb = miniPage(p, 'B', 44);
    pa.position.set(w * 0.16, 0);
    pb.position.set(w * 0.33, 0);
    c.addChild(b, faces, or, pa, pb);
  }
  return c;
}

/** A request bubble: round for the left friend, a cloud for the right; `state` ticks or outlines it after a Try. */
export function bubbleArt(f: Friend, w: number, h: number, state: 'none' | 'met' | 'unmet'): Graphics {
  const g = new Graphics();
  const sw = FRIEND_SWATCH[f];
  const tailX = f === 'A' ? -w / 2 + 40 : w / 2 - 40;
  g.poly([tailX - 16, h / 2 - 6, tailX + 16, h / 2 - 6, tailX + (f === 'A' ? -30 : 30), h / 2 + 30]).fill(cream).stroke(line(sw.line, 5));
  if (f === 'A') g.roundRect(-w / 2, -h / 2, w, h, h / 2.2).fill(cream).stroke(line(sw.line, 6));
  else {
    for (const [x, y, r] of [[-w / 2 + 40, 0, 46], [w / 2 - 40, 0, 46], [-w / 4, -h / 2 + 36, 40], [w / 4, -h / 2 + 36, 40], [-w / 4, h / 2 - 36, 40], [w / 4, h / 2 - 36, 40]]) g.circle(x, y, r).fill(cream).stroke(line(sw.line, 6));
    g.roundRect(-w / 2 + 24, -h / 2 + 18, w - 48, h - 36, 30).fill(cream);
  }
  if (state === 'met') {
    g.circle(w / 2 - 18, -h / 2 + 18, 22).fill(swatch.green.fill).stroke(line(swatch.green.line, 4));
  } else if (state === 'unmet') {
    for (let i = 0; i < 24; i++) {
      const a0 = (i / 24) * Math.PI * 2;
      if (i % 2) continue;
      g.moveTo(Math.cos(a0) * w * 0.56, Math.sin(a0) * h * 0.62).lineTo(Math.cos(a0 + 0.2) * w * 0.56, Math.sin(a0 + 0.2) * h * 0.62);
    }
    g.stroke(line(swatch.yellow.line, 6));
  }
  return g;
}

/** The tick drawn into a met bubble's badge. */
export function metTick(): Graphics {
  const t = checkIcon(0xffffff);
  t.scale.set(0.6);
  return t;
}

/** A plan card's picture: the plan's surfaces with arrows for order and faces for who works on what. */
export function cardPicture(id: PlanId, p: Pictured, own: Friend, w: number, h: number): Container {
  const c = new Container();
  const arrow = (x: number, y: number) => {
    const g = new Graphics().moveTo(x - 12, y).lineTo(x + 12, y).moveTo(x + 4, y - 8).lineTo(x + 12, y).lineTo(x + 4, y + 8).stroke(line(ink, 4));
    c.addChild(g);
  };
  const face = (i: 0 | 1, x: number, y: number, r = 13) => { const fc = faceArt(p.cast[i], r); fc.position.set(x, y); c.addChild(fc); };
  const tool = (t: 'pad' | 'roller', x: number, y: number, s = 56) => { const a = t === 'pad' ? padArt(s) : rollerArt(s); a.position.set(x, y); c.addChild(a); };
  const ownPage = (x: number) => { const pg = miniPage(p, own, 60); pg.position.set(x, 0); c.addChild(pg); };
  if (id === 'turns') {
    const b = miniBanner(p, 4, w - 40); b.y = -h * 0.18; c.addChild(b);
    face(0, -50, h * 0.22); tool('pad', 0, h * 0.24, 46); face(1, 50, h * 0.22);
    const g = new Graphics().arc(0, h * 0.22, 46, Math.PI * 1.15, Math.PI * 1.85).stroke(line(ink, 3)); c.addChild(g);
  } else if (id === 'roll') {
    const b = miniBanner(p, 4, w - 40); b.y = -h * 0.18; c.addChild(b);
    tool('roller', 0, h * 0.26, 90); face(0, -40, h * 0.12); face(1, 40, h * 0.12);
  } else if (id === 'side') {
    const pa = miniPage(p, 'A', 64); pa.position.set(-48, -8);
    const pb = miniPage(p, 'B', 64); pb.position.set(48, -8);
    c.addChild(pa, pb);
    tool('pad', -48, h * 0.33, 40); tool('roller', 48, h * 0.33, 52);
  } else if (id === 'bannerThenPage') {
    const b = miniBanner(p, 2, 90); b.x = -60; c.addChild(b);
    arrow(8, 0); ownPage(70);
  } else if (id === 'pageThenBanner') {
    ownPage(-70); arrow(-8, 0);
    const b = miniBanner(p, 2, 90); b.x = 60; c.addChild(b);
  } else if (id === 'justBanner') {
    const b = miniBanner(p, 2, 100); b.y = -10; c.addChild(b);
    face(0, -24, h * 0.28); face(1, 24, h * 0.28);
  } else {
    const pa = miniPage(p, 'A', 64); pa.position.set(-48, 0);
    const pb = miniPage(p, 'B', 64); pb.position.set(48, 0);
    c.addChild(pa, pb);
  }
  return c;
}

/** A card's plate; `lifted` when selected. */
export function cardPlate(w: number, h: number, lifted: boolean): Graphics {
  const g = new Graphics();
  g.roundRect(-w / 2 + 5, -h / 2 + 8, w, h, 22).fill({ color: shadow, alpha: lifted ? 0.2 : 0.1 });
  g.roundRect(-w / 2, -h / 2, w, h, 22).fill(lifted ? 0xfffbe8 : 0xffffff).stroke(line(lifted ? swatch.yellow.line : wood.line, lifted ? 8 : 4));
  return g;
}

/** A trace chip: a small picture of an executed step (not a tap target). */
export function chipArt(kind: 'give' | 'pass' | 'stamp' | 'roll', by: Friend | 'both' | null, size: number): Container {
  const c = new Container();
  const g = new Graphics().roundRect(-size / 2, -size / 2, size, size, 12).fill(0xffffff).stroke(line(by && by !== 'both' ? FRIEND_SWATCH[by].line : wood.line, 4));
  c.addChild(g);
  if (kind === 'give') { const a = padArt(size * 0.7); c.addChild(a); }
  else if (kind === 'pass') c.addChild(new Graphics().moveTo(-14, 0).lineTo(14, 0).moveTo(6, -8).lineTo(14, 0).lineTo(6, 8).stroke(line(ink, 4)));
  else if (kind === 'roll') { const r = rollerArt(size * 0.8); c.addChild(r); }
  else c.addChild(stampArt('star', size * 0.5, by && by !== 'both' ? FRIEND_SWATCH[by].fill : swatch.purple.fill));
  return c;
}

// ——— Button icons ———

export function tryIcon(): Graphics {
  const g = new Graphics();
  g.ellipse(0, 0, 30, 18).stroke(line(0xffffff, 6));
  g.circle(0, 0, 9).fill(0xffffff);
  return g;
}

export function makeIcon(): Graphics {
  const g = new Graphics();
  g.roundRect(-8, -30, 16, 40, 6).fill(0xffffff);
  g.roundRect(-26, 8, 52, 20, 8).fill(0xffffff);
  return g;
}

export function bulbIcon(): Graphics {
  const g = new Graphics();
  g.circle(0, -8, 20).fill(0xffffff);
  g.roundRect(-10, 10, 20, 16, 4).fill(0xffffff);
  return g;
}

export function undoIcon(): Graphics {
  const g = new Graphics();
  g.arc(4, 4, 20, Math.PI * 1.1, Math.PI * 2.4).stroke(line(0xffffff, 7));
  g.poly([-22, -14, -6, -6, -22, 6]).fill(0xffffff);
  return g;
}

export function finishIcon(): Graphics {
  const t = checkIcon(0xffffff);
  t.scale.set(1.6);
  return t;
}

export function watchIcon(): Graphics {
  return againIcon(0xffffff);
}

/** The pet button's picture: a paw. */
export function pawIcon(): Graphics {
  const g = new Graphics();
  g.ellipse(0, 8, 16, 13).fill(0xffffff);
  for (const [x, y] of [[-16, -10], [-5, -18], [6, -18], [17, -10]]) g.circle(x, y, 6).fill(0xffffff);
  return g;
}

// ——— Hub icon and sticker ———

/** The hub icon: two pages with a stamp pad between them. Feet on (0, 0). */
export function iconArt(): Container {
  const c = new Container();
  const p = { cast: ['bunny', 'bear'] as [CritterName, CritterName], picture: 'star' as StampPicture, theme: 'sun' as BannerTheme };
  const a = miniPage(p, 'A', 80); a.position.set(-62, -50); a.rotation = -0.12;
  const b = miniPage(p, 'B', 80); b.position.set(62, -50); b.rotation = 0.12;
  const pad = padArt(80); pad.position.set(0, -30);
  c.addChild(a, b, pad);
  return c;
}

/** A seeded sticker: a banner with stars. */
export function stickerArt(theme: BannerTheme, picture: StampPicture): Container {
  const c = new Container();
  const b = miniBanner({ cast: ['bunny', 'bear'], picture, theme }, 4, 200);
  b.y = -40;
  const cord = new Graphics().moveTo(-110, -64).quadraticCurveTo(0, -84, 110, -64).stroke(line(wood.line, 4));
  c.addChild(cord, b);
  return c;
}

/** Where a surface sits in a layout. */
export type SurfaceNode = { surface: Surface; node: Container };
