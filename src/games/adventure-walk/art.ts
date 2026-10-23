import { Container, Graphics } from 'pixi.js';
import { CRITTERS, Critter } from '../../art/critter';
import { swatch, wood } from '../../art/palette';
import type { FriendId, LandmarkId } from './logic';

const stroke = (color: number, width = 5) => ({ width, color, join: 'round' as const, cap: 'round' as const });
const STONE = { fill: 0xc9c9d4, line: 0x8c8c9c };
const WATER = { fill: 0x9fd4fb, line: swatch.blue.line };
const PATH = 0xfff7d6;

interface Pt { x: number; y: number }

/** Dots along a polyline: the dotted path that shows where the walker will go. */
function dotted(g: Graphics, pts: Pt[], color = PATH, r = 6) {
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const n = Math.max(1, Math.round(Math.hypot(b.x - a.x, b.y - a.y) / 20));
    for (let k = 0; k < n; k++) g.circle(a.x + ((b.x - a.x) * k) / n, a.y + ((b.y - a.y) * k) / n, r).fill(color).stroke(stroke(swatch.green.line, 2));
  }
}

/** Points along a curve from `a` through `c` to `b`. */
function curve(a: Pt, c: Pt, b: Pt, n = 10): Pt[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    return { x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * c.x + t * t * b.x, y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * c.y + t * t * b.y };
  });
}

const stone = (g: Graphics, x: number, y: number, w = 40, h = 24) => g.ellipse(x, y, w / 2, h / 2).fill(STONE.fill).stroke(stroke(STONE.line, 3));

function brook(g: Graphics) {
  g.roundRect(-130, -34, 260, 68, 18).fill(WATER.fill).stroke(stroke(WATER.line));
  for (let i = 0; i < 4; i++) g.moveTo(-100 + i * 60, -8 + (i % 2) * 14).quadraticCurveTo(-85 + i * 60, -18 + (i % 2) * 14, -70 + i * 60, -8 + (i % 2) * 14).stroke(stroke(0xffffff, 3));
}

function reeds(g: Graphics, gap: boolean) {
  const xs = gap ? [-60, -44, -28, 28, 44, 60] : [-50, -30, -10, 10, 30, 50];
  for (const x of xs) {
    g.moveTo(x, 60).quadraticCurveTo(x + (x < 0 ? -8 : 8), 0, x + (x < 0 ? -4 : 4), -62).stroke(stroke(swatch.green.line, 6));
    g.ellipse(x + (x < 0 ? -4 : 4), -66, 6, 14).fill(swatch.brown.fill).stroke(stroke(swatch.brown.line, 2));
  }
}

function logOnRocks(g: Graphics) {
  stone(g, -70, 38, 50, 50);
  stone(g, 70, 38, 50, 50);
  g.roundRect(-110, -34, 220, 54, 24).fill(wood.fill).stroke(stroke(wood.line));
  g.circle(-100, -7, 18).fill(wood.light).stroke(stroke(wood.line, 3));
  g.circle(-100, -7, 7).stroke(stroke(wood.line, 2));
}

function boulder(g: Graphics) {
  g.ellipse(0, 6, 78, 66).fill(STONE.fill).stroke(stroke(STONE.line));
  g.ellipse(-26, -14, 22, 14).fill(0xe3e3ea);
  g.ellipse(34, 30, 20, 12).fill(swatch.green.fill);
}

function puddle(g: Graphics) {
  g.ellipse(0, 0, 118, 62).fill(WATER.fill).stroke(stroke(WATER.line));
  g.ellipse(-20, -12, 34, 10).fill({ color: 0xffffff, alpha: 0.5 });
}

/** One way past a landmark, drawn inside about 260 × 220 units centred on (0, 0): the landmark and its dotted path. */
export function wayPicture(key: string): Container {
  const c = new Container();
  const g = new Graphics();
  c.addChild(g);
  const walk = (pts: Pt[]) => dotted(g, pts);
  switch (key) {
    case 'brook.over': {
      brook(g);
      g.moveTo(-52, 36).quadraticCurveTo(0, -64, 52, 36).lineTo(52, 50).lineTo(-52, 50).closePath().fill(wood.fill).stroke(stroke(wood.line));
      for (const x of [-30, 0, 30]) g.moveTo(x, -16 + Math.abs(x) * 0.5).lineTo(x, 36).stroke(stroke(wood.line, 3));
      walk([{ x: 0, y: 100 }, ...curve({ x: 0, y: 70 }, { x: 0, y: -70 }, { x: 0, y: -100 }, 8)]);
      break;
    }
    case 'brook.across': {
      brook(g);
      stone(g, -36, 24, 48, 26);
      stone(g, 16, 0, 48, 26);
      stone(g, -26, -22, 48, 26);
      walk([{ x: 0, y: 100 }, { x: -36, y: 60 }, { x: -36, y: 24 }, { x: 16, y: 0 }, { x: -26, y: -22 }, { x: -10, y: -64 }, { x: 0, y: -100 }]);
      break;
    }
    case 'reeds.through': {
      reeds(g, true);
      walk([{ x: 0, y: 100 }, { x: 0, y: 66 }, { x: 0, y: 30 }, { x: 0, y: -10 }, { x: 0, y: -50 }, { x: 0, y: -100 }]);
      break;
    }
    case 'reeds.around': {
      reeds(g, false);
      walk([{ x: 0, y: 100 }, ...curve({ x: 0, y: 80 }, { x: 118, y: 0 }, { x: 0, y: -100 }, 10)]);
      break;
    }
    case 'log.under': {
      logOnRocks(g);
      walk([{ x: 0, y: 100 }, { x: 0, y: 70 }, { x: 0, y: 40 }, { x: 0, y: 20 }, { x: 0, y: -60 }, { x: 0, y: -100 }]);
      g.rect(-24, 0, 48, 0);
      break;
    }
    case 'log.over': {
      logOnRocks(g);
      g.roundRect(-18, -52, 36, 22, 6).fill(wood.light).stroke(stroke(wood.line, 3));
      walk([{ x: 0, y: 100 }, ...curve({ x: 0, y: 70 }, { x: 0, y: -80 }, { x: 0, y: -100 }, 8)]);
      break;
    }
    case 'boulder.around': {
      boulder(g);
      walk([{ x: 0, y: 100 }, ...curve({ x: 0, y: 84 }, { x: -118, y: 0 }, { x: 0, y: -100 }, 10)]);
      break;
    }
    case 'boulder.over': {
      boulder(g);
      for (const [x, y] of [[-14, 52], [10, 20], [-6, -12], [8, -40]]) g.roundRect(x - 14, y - 6, 28, 12, 5).fill(0xe3e3ea).stroke(stroke(STONE.line, 2));
      walk([{ x: 0, y: 100 }, { x: 0, y: 70 }, { x: 0, y: 40 }, { x: 0, y: 8 }, { x: 0, y: -28 }, { x: 0, y: -60 }, { x: 0, y: -100 }]);
      break;
    }
    case 'puddle.across': {
      puddle(g);
      stone(g, -18, 20, 46, 24);
      stone(g, 24, -14, 46, 24);
      walk([{ x: 0, y: 100 }, { x: -10, y: 56 }, { x: -18, y: 20 }, { x: 24, y: -14 }, { x: 10, y: -60 }, { x: 0, y: -100 }]);
      break;
    }
    default: {
      puddle(g);
      walk([{ x: 0, y: 100 }, ...curve({ x: 0, y: 84 }, { x: 150, y: 0 }, { x: 0, y: -100 }, 10)]);
    }
  }
  return c;
}

/** The friend, as a badge picture that speaks the request. */
export function friendBadge(friend: FriendId, size: number): Container {
  const c = new Container();
  c.addChild(new Graphics().roundRect(-size / 2, -size / 2, size, size, 24).fill(0xffffff).stroke(stroke(swatch.orange.line, 5)));
  const pet = new Critter(CRITTERS[friend]);
  pet.alive = false;
  pet.scale.set((size * 0.78) / 250);
  pet.position.set(0, size * 0.42);
  c.addChild(pet);
  return c;
}

/** The picnic blanket where the walk ends. */
export function blanket(w = 300): Graphics {
  const g = new Graphics().roundRect(-w / 2, -26, w, 52, 10).fill(swatch.red.light).stroke(stroke(swatch.red.fill, 4));
  for (let i = -3; i <= 3; i++) g.rect(i * (w / 8) - 10, -26, 20, 52).fill({ color: 0xffffff, alpha: 0.7 });
  return g;
}

/** A small trail across the top: home, the stops and the picnic. `lit` is the stop in front of her. */
export function drawTrail(g: Graphics, w: number, stops: number, lit: number) {
  g.clear();
  const n = stops + 2;
  g.moveTo(10, 20).lineTo(w - 10, 20).stroke(stroke(swatch.green.line, 4));
  for (let i = 0; i < n; i++) {
    const x = 10 + (i * (w - 20)) / (n - 1);
    const on = i === lit + 1;
    g.circle(x, 20, on ? 15 : 10).fill(on ? swatch.yellow.fill : i <= lit ? swatch.green.fill : 0xffffff).stroke(stroke(swatch.green.line, 3));
  }
}

const LANDMARK_ICON: Record<LandmarkId, string> = { brook: 'brook.over', reeds: 'reeds.through', log: 'log.over', boulder: 'boulder.over', puddle: 'puddle.across' };

/** A seeded sticker: one landmark with a tiny blanket behind it. */
export function walkSticker(landmark: LandmarkId): Container {
  const c = new Container();
  const b = blanket(240);
  b.position.set(0, 60);
  const pic = wayPicture(LANDMARK_ICON[landmark]);
  pic.scale.set(0.8);
  c.addChild(b, pic);
  return c;
}
