import { Container, Graphics } from 'pixi.js';
import { frogArt, owlArt, turtleArt } from '../../art/animals';
import { Critter, CRITTERS } from '../../art/critter';
import { ink, swatch, wood } from '../../art/palette';
import { drawFarBarn } from '../../art/scenery';
import { starPoints } from '../../art/shapes';
import type { Feeling, Part } from './logic';

/** Story Weaver's code-drawn tile pictures, about 100 units across around (0, 0). */

const line = (color: number, width = 4) => ({ width, color, join: 'round' as const, cap: 'round' as const });

type Glyph = (g: Graphics, x: number, y: number, s: number) => void;

const G: Record<string, Glyph> = {
  hat: (g, x, y, s) => {
    g.ellipse(x, y + 10 * s, 34 * s, 9 * s).fill(swatch.red.fill).stroke(line(swatch.red.line, 3));
    g.roundRect(x - 20 * s, y - 22 * s, 40 * s, 32 * s, 8 * s).fill(swatch.red.fill).stroke(line(swatch.red.line, 3));
    g.rect(x - 20 * s, y + 0 * s, 40 * s, 7 * s).fill(swatch.yellow.fill);
  },
  cloud: (g, x, y, s) => {
    g.circle(x - 18 * s, y, 16 * s).circle(x + 2 * s, y - 10 * s, 20 * s).circle(x + 22 * s, y, 15 * s).fill(swatch.white.light).stroke(line(swatch.white.line, 3));
  },
  drops: (g, x, y, s) => {
    for (const [dx, dy] of [[-20, 0], [0, 10], [20, -2]]) g.ellipse(x + dx * s, y + dy * s, 4 * s, 7 * s).fill(swatch.blue.fill);
  },
  mud: (g, x, y, s) => {
    g.ellipse(x, y, 42 * s, 13 * s).fill(swatch.brown.line).ellipse(x - 10 * s, y - 3 * s, 14 * s, 4 * s).fill(swatch.brown.fill);
  },
  puddle: (g, x, y, s) => {
    g.ellipse(x, y, 40 * s, 12 * s).fill(swatch.blue.light).stroke(line(swatch.blue.line, 3));
  },
  blocks: (g, x, y, s) => {
    const cols = [swatch.red, swatch.blue, swatch.yellow];
    for (let i = 0; i < 3; i++) g.rect(x - 14 * s + (i % 2) * 6 * s, y + 16 * s - i * 22 * s, 28 * s, 22 * s).fill(cols[i].fill).stroke(line(cols[i].line, 3));
  },
  bigblock: (g, x, y, s) => {
    g.rect(x - 26 * s, y + 4 * s, 52 * s, 24 * s).fill(swatch.blue.fill).stroke(line(swatch.blue.line, 3));
    g.rect(x - 16 * s, y - 16 * s, 32 * s, 20 * s).fill(swatch.red.fill).stroke(line(swatch.red.line, 3));
    g.rect(x - 9 * s, y - 30 * s, 18 * s, 14 * s).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 3));
  },
  tumble: (g, x, y, s) => {
    g.rect(x - 36 * s, y + 8 * s, 24 * s, 20 * s).fill(swatch.red.fill).stroke(line(swatch.red.line, 3));
    g.poly([x - 4 * s, y + 28 * s, x + 18 * s, y + 18 * s, x + 26 * s, y + 36 * s, x + 4 * s, y + 44 * s].map((v, i) => (i % 2 ? v - 16 * s : v))).fill(swatch.blue.fill).stroke(line(swatch.blue.line, 3));
    g.rect(x + 14 * s, y - 20 * s, 20 * s, 18 * s).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 3));
  },
  bowl: (g, x, y, s) => {
    g.moveTo(x - 32 * s, y - 6 * s).arc(x, y - 6 * s, 32 * s, 0, Math.PI).closePath().fill(wood.fill).stroke(line(wood.line, 3));
  },
  berries: (g, x, y, s) => {
    for (const [dx, dy] of [[-12, 4], [8, 6], [-2, -10], [16, -8]]) g.circle(x + dx * s, y + dy * s, 9 * s).fill(swatch.purple.fill).stroke(line(swatch.purple.line, 2));
    g.ellipse(x + 4 * s, y - 22 * s, 12 * s, 5 * s).fill(swatch.green.fill);
  },
  apple: (g, x, y, s) => {
    g.circle(x, y, 20 * s).fill(swatch.red.fill).stroke(line(swatch.red.line, 3));
    g.moveTo(x, y - 18 * s).lineTo(x + 3 * s, y - 28 * s).stroke(line(wood.line, 3));
    g.ellipse(x + 10 * s, y - 24 * s, 7 * s, 4 * s).fill(swatch.green.fill);
  },
  leaf: (g, x, y, s) => {
    g.moveTo(x - 30 * s, y + 6 * s).quadraticCurveTo(x, y - 34 * s, x + 30 * s, y + 6 * s).quadraticCurveTo(x, y + 20 * s, x - 30 * s, y + 6 * s).fill(swatch.green.fill).stroke(line(swatch.green.line, 3));
    g.moveTo(x - 24 * s, y + 6 * s).lineTo(x + 24 * s, y + 4 * s).stroke(line(swatch.green.line, 2));
  },
  leaves: (g, x, y, s) => {
    for (const [dx, c] of [[-18, swatch.orange], [14, swatch.green], [0, swatch.yellow]] as const) g.ellipse(x + dx * s, y + 8 * s, 18 * s, 9 * s).fill(c.fill).stroke(line(c.line, 2));
  },
  tree: (g, x, y, s) => {
    g.rect(x - 6 * s, y, 12 * s, 30 * s).fill(wood.line);
    g.circle(x, y - 14 * s, 28 * s).fill(swatch.green.fill).stroke(line(swatch.green.line, 3));
  },
  mushroom: (g, x, y, s) => {
    g.roundRect(x - 8 * s, y - 4 * s, 16 * s, 28 * s, 5 * s).fill(swatch.white.light).stroke(line(swatch.white.line, 2));
    g.moveTo(x - 36 * s, y).arc(x, y, 36 * s, Math.PI, 0).closePath().fill(swatch.red.fill).stroke(line(swatch.red.line, 3));
    g.circle(x - 14 * s, y - 16 * s, 5 * s).circle(x + 10 * s, y - 22 * s, 5 * s).fill(0xffffff);
  },
  friends: (g, x, y, s) => {
    g.circle(x - 16 * s, y, 15 * s).fill(swatch.orange.light).stroke(line(swatch.orange.line, 3));
    g.circle(x + 16 * s, y, 15 * s).fill(swatch.teal.light).stroke(line(swatch.teal.line, 3));
    for (const dx of [-21, -11, 11, 21]) g.circle(x + dx * s, y - 3 * s, 2.5 * s).fill(ink);
  },
  rainbow: (g, x, y, s) => {
    [swatch.red, swatch.orange, swatch.yellow, swatch.green, swatch.blue].forEach((c, i) => g.arc(x, y + 14 * s, (40 - i * 6) * s, Math.PI, 0).stroke({ width: 6 * s, color: c.fill }));
  },
  sun: (g, x, y, s) => {
    g.circle(x, y, 13 * s).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 2));
  },
  star: (g, x, y, s) => {
    g.poly(starPoints(14 * s, 6 * s).map((v, i) => v + (i % 2 ? y : x))).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 2));
  },
  up: (g, x, y, s) => {
    g.moveTo(x, y + 14 * s).lineTo(x, y - 14 * s).moveTo(x - 10 * s, y - 4 * s).lineTo(x, y - 14 * s).lineTo(x + 10 * s, y - 4 * s).stroke(line(ink, 4));
  },
  again: (g, x, y, s) => {
    g.arc(x, y, 14 * s, -0.4, Math.PI * 1.5).stroke(line(ink, 4));
    g.poly([x + 2 * s, y - 20 * s, x + 12 * s, y - 14 * s, x + 2 * s, y - 8 * s]).fill(ink);
  },
  call: (g, x, y, s) => {
    for (let i = 1; i <= 3; i++) g.arc(x, y, 7 * i * s, -0.6, 0.6).stroke(line(ink, 3));
  },
  hands: (g, x, y, s) => {
    g.ellipse(x - 32 * s, y, 9 * s, 13 * s).ellipse(x + 32 * s, y, 9 * s, 13 * s).fill(swatch.orange.light).stroke(line(swatch.orange.line, 2));
  },
  blanket: (g, x, y, s) => {
    g.poly([x - 42 * s, y + 18 * s, x + 42 * s, y + 18 * s, x + 30 * s, y - 4 * s, x - 30 * s, y - 4 * s]).fill(swatch.red.light).stroke(line(swatch.red.line, 3));
    g.roundRect(x - 14 * s, y - 22 * s, 28 * s, 20 * s, 4 * s).fill(wood.fill).stroke(line(wood.line, 2));
  },
  cozy: (g, x, y, s) => {
    g.roundRect(x - 26 * s, y - 14 * s, 52 * s, 34 * s, 6 * s).fill(wood.fill).stroke(line(wood.line, 3));
    g.poly([x - 34 * s, y - 12 * s, x, y - 36 * s, x + 34 * s, y - 12 * s]).fill(swatch.red.fill).stroke(line(swatch.red.line, 3));
    g.rect(x - 8 * s, y + 2 * s, 16 * s, 18 * s).fill(swatch.yellow.light);
  },
  splash: (g, x, y, s) => {
    for (const a of [-2.4, -1.9, -1.2, -0.7]) g.moveTo(x + Math.cos(a) * 18 * s, y + Math.sin(a) * 18 * s).lineTo(x + Math.cos(a) * 32 * s, y + Math.sin(a) * 32 * s).stroke(line(swatch.blue.fill, 4));
  },
  pop: (g, x, y, s) => {
    g.poly(starPoints(20 * s, 9 * s, 8).map((v, i) => v + (i % 2 ? y : x))).fill(swatch.yellow.light).stroke(line(swatch.yellow.line, 2));
  },
  pond: (g, x, y, s) => {
    g.ellipse(x, y + 10 * s, 44 * s, 18 * s).fill(swatch.blue.fill).stroke(line(swatch.blue.line, 3));
    for (const dx of [-36, -28, 34]) g.moveTo(x + dx * s, y + 6 * s).lineTo(x + dx * s + 3 * s, y - 22 * s).stroke(line(swatch.green.line, 4));
    g.ellipse(x + 10 * s, y + 8 * s, 10 * s, 4 * s).fill(swatch.green.fill);
  },
  meadow: (g, x, y, s) => {
    g.ellipse(x, y + 18 * s, 46 * s, 14 * s).fill(swatch.green.fill);
    for (const [dx, c] of [[-24, swatch.pink], [0, swatch.yellow], [22, swatch.purple]] as const) {
      g.moveTo(x + dx * s, y + 14 * s).lineTo(x + dx * s, y - 6 * s).stroke(line(swatch.green.line, 3));
      g.circle(x + dx * s, y - 10 * s, 8 * s).fill(c.fill).circle(x + dx * s, y - 10 * s, 3 * s).fill(swatch.yellow.light);
    }
  },
  barn: (g, x, y, s) => {
    drawFarBarn(g, x, y + 28 * s, 60 * s);
  },
  woods: (g, x, y, s) => {
    for (const [dx, h] of [[-20, 1], [18, 0.85]] as const) {
      g.rect(x + dx * s - 4 * s, y + 10 * s, 8 * s, 18 * s).fill(wood.line);
      g.poly([x + dx * s - 22 * s * h, y + 12 * s, x + dx * s, y - 36 * s * h, x + dx * s + 22 * s * h, y + 12 * s]).fill(swatch.green.fill).stroke(line(swatch.green.line, 3));
    }
  },
};

/** Each tile's picture as glyphs: [name, dx, dy, scale]. */
const TILE: Record<string, [string, number, number, number][]> = {
  pond: [['pond', 0, 0, 1]],
  meadow: [['meadow', 0, 0, 1]],
  barn: [['barn', 0, 0, 1]],
  woods: [['woods', 0, 0, 1]],
  hat: [['hat', 0, 0, 1], ['pop', 30, -26, 0.5]],
  rain: [['cloud', 0, -12, 1], ['drops', 0, 22, 1]],
  mud: [['mud', 0, 16, 1], ['drops', 0, -6, 0.6]],
  tower: [['blocks', 0, 0, 1]],
  hungry: [['bowl', 0, 0, 1]],
  'hat.leaves': [['leaves', 0, 6, 1], ['hat', 0, -16, 0.5]],
  'hat.ask': [['friends', 0, 4, 1], ['hat', 0, -28, 0.4]],
  'hat.tree': [['tree', 0, 6, 1], ['hat', 6, -22, 0.45]],
  'hat.back': [['friends', 0, 12, 1], ['hat', 0, -20, 0.55]],
  'hat.leaf': [['leaf', 0, 0, 1]],
  'rain.mushroom': [['mushroom', 0, 10, 1], ['drops', 0, -36, 0.6]],
  'rain.leaf': [['leaf', 0, -8, 1], ['drops', 0, -36, 0.6]],
  'rain.cozy': [['cozy', 0, 8, 1]],
  'rain.splash': [['puddle', 0, 18, 1], ['splash', 0, 18, 1]],
  'rain.rainbow': [['rainbow', 0, 6, 1]],
  'mud.pull': [['mud', 0, 22, 1], ['up', 0, -10, 1]],
  'mud.call': [['friends', -12, 0, 0.8], ['call', 22, 0, 1]],
  'mud.pop': [['mud', 0, 22, 1], ['pop', 0, -8, 1]],
  'mud.friends': [['friends', 0, -6, 1], ['mud', 0, 24, 0.9]],
  'mud.shake': [['drops', 0, -14, 1], ['splash', 0, 6, 0.9], ['star', 24, 18, 0.8]],
  'tower.big': [['bigblock', 0, 4, 1]],
  'tower.hold': [['blocks', 0, 0, 0.9], ['hands', 0, 0, 1]],
  'tower.tall': [['blocks', -10, 6, 0.9], ['star', 26, -24, 1]],
  'tower.again': [['blocks', -16, 6, 0.8], ['again', 24, -4, 1]],
  'tower.crash': [['tumble', 0, 0, 1]],
  'hungry.look': [['berries', -10, 4, 0.8], ['leaves', 12, 16, 0.8]],
  'hungry.share': [['friends', 0, 12, 0.9], ['apple', 0, -22, 0.7]],
  'hungry.snack': [['apple', -16, 4, 0.8], ['apple', 18, 4, 0.8]],
  'hungry.berries': [['berries', 0, 4, 1.1]],
  'hungry.picnic': [['blanket', 0, 6, 1]],
};

const MOUTH: Record<Feeling, (g: Graphics) => void> = {
  happy: (g) => void g.arc(0, 4, 18, 0.2, Math.PI - 0.2).stroke(line(ink, 5)),
  proud: (g) => {
    g.arc(0, 6, 14, 0.3, Math.PI - 0.3).stroke(line(ink, 5));
    G.star(g, 30, -30, 0.8);
  },
  relieved: (g) => {
    g.arc(0, 6, 14, 0.3, Math.PI - 0.3).stroke(line(ink, 5));
    g.ellipse(30, -18, 5, 8).fill(swatch.blue.light);
  },
  sleepy: (g) => {
    g.circle(0, 14, 6).stroke(line(ink, 4));
    g.moveTo(26, -34).lineTo(36, -34).lineTo(26, -24).lineTo(36, -24).stroke(line(swatch.blue.line, 3));
  },
  surprised: (g) => void g.ellipse(0, 14, 9, 12).fill(ink),
  sad: (g) => {
    g.arc(0, 26, 14, Math.PI + 0.4, -0.4).stroke(line(ink, 5));
    g.ellipse(-18, 2, 4, 7).fill(swatch.blue.fill);
  },
};

/** A round face for a feeling tile. */
function face(f: Feeling): Graphics {
  const g = new Graphics().circle(0, 0, 40).fill(swatch.yellow.light).stroke(line(swatch.yellow.line, 4));
  const closed = f === 'sleepy' || f === 'relieved' || f === 'proud';
  for (const x of [-14, 14]) {
    if (closed) g.arc(x, -10, 7, Math.PI + 0.3, -0.3).stroke(line(ink, 4));
    else g.circle(x, -10, f === 'surprised' ? 6 : 5).fill(ink);
  }
  MOUTH[f](g);
  return g;
}

/** A friend tile's drawing: the shared critters and animals, still. */
function friend(id: string): Container {
  if (id === 'frog') {
    const f = frogArt();
    f.scale.set(0.85);
    f.y = 24;
    return f;
  }
  if (id === 'turtle') return turtleArt(80);
  const c = new Critter(id === 'duck' ? CRITTERS.duck : CRITTERS.bunny);
  c.alive = false;
  c.scale.set(0.34);
  c.y = 42;
  return c;
}

/** The picture on a tile (or a page slot) for a part's tile id. */
export function tilePicture(part: Part, id: string): Container {
  if (part === 'who') return friend(id);
  if (part === 'feeling') return face(id as Feeling);
  const g = new Graphics();
  for (const [name, dx, dy, s] of TILE[id] ?? []) G[name](g, dx, dy, s);
  g.eventMode = 'none';
  return g;
}

/** The owl on its stump, who can only hear the words. */
export function owlOnStump(): { root: Container; owl: Critter } {
  const root = new Container();
  const stump = new Graphics().roundRect(-56, -20, 112, 60, 14).fill(wood.fill).stroke(line(wood.line, 5)).ellipse(0, -20, 56, 14).fill(wood.light).stroke(line(wood.line, 4));
  const owl = owlArt('brown');
  owl.scale.set(0.62);
  owl.y = -26;
  root.addChild(stump, owl);
  return { root, owl };
}

/** An open book with a star: the hub icon and sticker. */
export function bookArt(): Container {
  const g = new Graphics();
  g.poly([-70, -40, 0, -26, 70, -40, 70, 44, 0, 58, -70, 44]).fill(0xffffff).stroke(line(wood.line, 5));
  g.moveTo(0, -26).lineTo(0, 58).stroke(line(wood.line, 4));
  for (const y of [-14, 2, 18]) g.moveTo(-56, y - 6).lineTo(-14, y).moveTo(14, y).lineTo(56, y - 6).stroke(line(swatch.white.line, 3));
  const c = new Container();
  c.addChild(g);
  return c;
}
