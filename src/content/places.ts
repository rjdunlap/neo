import { Container, Graphics } from 'pixi.js';
import { cream, grass, swatch, wood } from '../art/palette';
import type { BackdropStyle } from '../art/scenery';
import { flower, puffs, starPoints } from '../art/shapes';
import type { Band } from '../progress/bands';
import type { LineId } from './voice-script';

/**
 * The island is an age trail that switches back and forth from the lagoon on the shore, up past the peak to the woods. Each place holds
 * every game for its age band, at that band's levels. Places are open to everyone.
 */
export interface Place {
  band: Band;
  /** Kid-facing name, spoken when she taps it. */
  name: string;
  line: LineId;
  /** Fractions of the map's usable rectangle. */
  x: number;
  y: number;
  backdrop: BackdropStyle;
  landmark(): Container;
}

const line = (color: number, width = 5) => ({ width, color, join: 'round' as const, cap: 'round' as const });

function lagoon(): Graphics {
  const g = new Graphics().ellipse(0, 22, 92, 40).fill(swatch.yellow.light).ellipse(0, 18, 76, 30).fill(swatch.blue.fill).stroke(line(swatch.blue.line));
  g.ellipse(-30, 14, 16, 7).fill(swatch.green.fill).ellipse(34, 26, 14, 6).fill(swatch.green.fill);
  // A little duck and some bubbles.
  const duck = swatch.yellow;
  g.circle(6, 4, 17).fill(duck.fill).circle(18, -10, 11).fill(duck.fill).poly([26, -12, 38, -8, 27, -5]).fill(swatch.orange.fill);
  for (const [x, y, r] of [[-46, -30, 14], [-22, -56, 18], [-52, -72, 10]]) g.circle(x, y, r).fill({ color: swatch.blue.light, alpha: 0.8 }).stroke(line(swatch.blue.fill, 4)).circle(x - r * 0.3, y - r * 0.3, r * 0.25).fill(swatch.white.fill);
  return g;
}

function meadow(): Container {
  const c = new Container();
  const g = new Graphics().ellipse(0, 26, 90, 30).fill(grass);
  g.roundRect(-44, -26, 16, 56, 5).fill(wood.fill).stroke(line(wood.line, 4));
  puffs(g, [[-62, -42, 26], [-36, -62, 30], [-12, -40, 24]], swatch.green.fill, swatch.green.line, 5);
  c.addChild(g);
  for (const [x, y, color] of [[14, 0, 'pink'], [44, -14, 'yellow'], [66, 6, 'purple'], [34, 18, 'red']] as const) {
    g.moveTo(x, y + 4).lineTo(x, y + 30).stroke(line(swatch.green.line, 4));
    const f = flower(new Graphics(), 13, swatch[color].fill, swatch[color].line);
    f.position.set(x, y);
    c.addChild(f);
  }
  return c;
}

function hills(): Graphics {
  const g = new Graphics();
  g.moveTo(-96, 40).quadraticCurveTo(-56, -50, -10, 40).closePath().fill(swatch.green.fill).stroke(line(swatch.green.line));
  g.moveTo(-34, 40).quadraticCurveTo(22, -78, 84, 40).closePath().fill(swatch.teal.fill).stroke(line(swatch.teal.line));
  // A puzzle-piece flag on top.
  g.moveTo(22, -40).lineTo(22, -96).stroke(line(wood.line, 5));
  g.roundRect(22, -96, 40, 30, 4).fill(swatch.orange.fill).stroke(line(swatch.orange.line, 4)).circle(62, -81, 8).fill(swatch.orange.fill);
  return g;
}

function peak(): Graphics {
  const g = new Graphics();
  g.poly([-96, 44, -8, -96, 92, 44]).fill(swatch.purple.fill).stroke(line(swatch.purple.line));
  g.poly([-34, -54, -8, -96, 20, -52, 6, -44, -8, -58, -22, -44]).fill(swatch.white.fill);
  g.poly(starPoints(22, 9).map((v, i) => v + (i % 2 ? -124 : 52))).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 4));
  g.circle(-58, -40, 5).circle(70, -70, 4).fill(swatch.yellow.fill);
  return g;
}

/** Pines, a hollow-tree post office and a signpost: the early-school woods beyond the peak. */
function woods(): Graphics {
  const g = new Graphics().ellipse(0, 28, 92, 26).fill(grass);
  for (const [x, h] of [[-64, 84], [66, 72]]) {
    g.rect(x - 6, 12, 12, 20).fill(wood.fill).stroke(line(wood.line, 3));
    g.poly([x - 30, 16, x, 16 - h * 0.62, x + 30, 16]).fill(swatch.teal.fill).stroke(line(swatch.teal.line, 4));
    g.poly([x - 22, 16 - h * 0.42, x, 16 - h, x + 22, 16 - h * 0.42]).fill(swatch.teal.fill).stroke(line(swatch.teal.line, 4));
  }
  g.roundRect(-20, -26, 40, 58, 10).fill(wood.fill).stroke(line(wood.line));
  g.ellipse(0, 6, 10, 14).fill(wood.line);
  puffs(g, [[-30, -44, 26], [0, -62, 28], [30, -44, 26]], swatch.green.fill, swatch.green.line, 5);
  g.moveTo(34, 34).lineTo(34, 8).stroke(line(wood.line, 4));
  g.roundRect(20, -2, 40, 16, 4).fill(wood.light).stroke(line(wood.line, 3));
  return g;
}

export const PLACES: Place[] = [
  {
    band: 'lap',
    name: 'Puddle Lagoon',
    line: 'place.lap',
    x: 0.1,
    y: 0.95,
    landmark: lagoon,
    backdrop: { sky: [swatch.blue.light, cream], hills: [swatch.teal.light, swatch.blue.light, swatch.yellow.light], horizon: 0.5, clouds: 3, sun: true, seed: 31 },
  },
  {
    band: 'toddler',
    name: 'Daisy Meadow',
    line: 'place.toddler',
    x: 0.62,
    y: 0.76,
    landmark: meadow,
    backdrop: { sky: [swatch.blue.light, cream], hills: [swatch.green.light, grass, grass], horizon: 0.5, clouds: 3, sun: true, seed: 47 },
  },
  {
    band: 'preschool',
    name: 'Bumpy Hills',
    line: 'place.preschool',
    x: 0.16,
    y: 0.54,
    landmark: hills,
    backdrop: { sky: [swatch.teal.light, cream], hills: [swatch.teal.light, swatch.green.light, grass], horizon: 0.5, clouds: 3, sun: true, seed: 53 },
  },
  {
    band: 'prek',
    name: 'Starry Peak',
    line: 'place.prek',
    x: 0.86,
    y: 0.34,
    landmark: peak,
    backdrop: { sky: [swatch.purple.light, cream], hills: [swatch.purple.light, swatch.blue.light, grass], horizon: 0.5, clouds: 2, sun: true, seed: 71 },
  },
  {
    band: 'school',
    name: 'Wonder Woods',
    line: 'place.school',
    x: 0.42,
    y: 0.04,
    landmark: woods,
    backdrop: { sky: [swatch.green.light, cream], hills: [swatch.teal.light, swatch.green.light, grass], horizon: 0.5, clouds: 2, sun: true, seed: 83 },
  },
];

export const placeFor = (band: Band) => PLACES.find((p) => p.band === band) ?? PLACES[0];
