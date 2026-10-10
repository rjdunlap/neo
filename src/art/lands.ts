import { Container, Graphics } from 'pixi.js';
import type { LandId, Land } from '../content/lands';
import { makeGardener } from './picnic';
import { Critter, CRITTERS } from './critter';
import { cream, grass, ink, RAINBOW, swatch, wood } from './palette';
import { flower, musicNote, puffs, starPoints } from './shapes';

/**
 * The map's drawing for each land, about 190 wide, standing on a patch of ground at (0, 30) and reaching about
 * 100 above it, in the style of the age places' landmarks.
 */
const line = (color: number, width = 5) => ({ width, color, join: 'round' as const, cap: 'round' as const });

function beach(): Graphics {
  // Sand, and the sea lapping at the front of it.
  const g = new Graphics().ellipse(0, 24, 94, 30).fill(0xf6d98b).stroke(line(swatch.yellow.line, 4));
  g.moveTo(-90, 34).quadraticCurveTo(-46, 18, 0, 32).quadraticCurveTo(46, 46, 90, 32).quadraticCurveTo(60, 56, 0, 56).quadraticCurveTo(-60, 56, -90, 34).fill(swatch.blue.fill).stroke(line(swatch.blue.line, 4));
  g.moveTo(-60, 42).quadraticCurveTo(-40, 36, -20, 42).moveTo(20, 46).quadraticCurveTo(40, 40, 60, 46).stroke(line(swatch.white.fill, 3));
  // A beach ball in six slices.
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    g.moveTo(-20, -6).arc(-20, -6, 26, a, a + Math.PI / 3).closePath().fill(swatch[RAINBOW[i]].fill);
  }
  g.circle(-20, -6, 26).stroke(line(ink, 3)).circle(-20, -6, 6).fill(swatch.white.fill);
  for (const [x, y, r] of [[34, -30, 16], [58, -62, 12], [30, -84, 9]]) g.circle(x, y, r).fill({ color: swatch.blue.light, alpha: 0.85 }).stroke(line(swatch.blue.fill, 4)).circle(x - r * 0.3, y - r * 0.3, r * 0.25).fill(swatch.white.fill);
  return g;
}

function mountain(): Graphics {
  const g = new Graphics().ellipse(0, 28, 92, 24).fill(grass);
  // A round green mountain with a xylophone of rainbow bars up its side, and notes floating off the top.
  g.moveTo(-88, 34).quadraticCurveTo(-30, -112, 30, -60).quadraticCurveTo(64, -30, 88, 34).closePath().fill(swatch.teal.light).stroke(line(swatch.teal.line));
  RAINBOW.forEach((name, i) => {
    const x = -52 + i * 18;
    const h = 46 - i * 5;
    g.roundRect(x, 18 - h, 14, h, 4).fill(swatch[name].fill).stroke(line(swatch[name].line, 3));
  });
  g.moveTo(-60, 22).lineTo(56, 22).stroke(line(wood.line, 4));
  const notes = new Graphics();
  musicNote(notes, 30, swatch.blue.line);
  notes.position.set(46, -78);
  g.addChild(notes);
  const more = new Graphics();
  musicNote(more, 24, swatch.pink.line);
  more.position.set(76, -100);
  g.addChild(more);
  return g;
}

function pier(): Graphics {
  const g = new Graphics().ellipse(0, 30, 94, 22).fill(swatch.blue.light);
  for (let x = -80; x <= 40; x += 24) g.roundRect(x, 12, 22, 14, 3).fill(wood.light).stroke(line(wood.line, 3));
  g.rect(-76, 24, 6, 18).rect(28, 24, 6, 18).fill(wood.line);
  // An easel with a painting of dabs.
  g.moveTo(20, 14).lineTo(40, -70).moveTo(70, 14).lineTo(50, -70).moveTo(45, -60).lineTo(45, 14).stroke(line(wood.line, 5));
  g.roundRect(12, -88, 66, 54, 6).fill(swatch.white.fill).stroke(line(swatch.white.line, 4));
  for (const [x, y, c] of [[28, -72, 'red'], [46, -64, 'yellow'], [62, -76, 'blue'], [36, -52, 'green'], [60, -50, 'purple']] as const) g.circle(x, y, 8).fill(swatch[c].fill);
  // A paint pot.
  g.roundRect(-46, -14, 30, 28, 6).fill(swatch.pink.fill).stroke(line(swatch.pink.line, 4)).moveTo(-36, -16).quadraticCurveTo(-30, -60, -8, -66).stroke(line(wood.line, 5));
  return g;
}

function barn(): Graphics {
  const g = new Graphics().ellipse(0, 28, 94, 24).fill(grass);
  g.poly([-56, 26, -56, -36, -6, -76, 44, -36, 44, 26]).fill(swatch.red.fill).stroke(line(swatch.red.line));
  g.poly([-64, -30, -6, -84, 52, -30]).stroke(line(swatch.white.fill, 8));
  g.rect(-26, -10, 40, 36).fill(swatch.white.fill).stroke(line(swatch.white.line, 3));
  g.moveTo(-26, -10).lineTo(14, 26).moveTo(14, -10).lineTo(-26, 26).stroke(line(swatch.red.line, 4));
  g.circle(-6, -44, 10).fill(swatch.white.fill).stroke(line(swatch.white.line, 3));
  // A fence.
  for (const x of [54, 70, 86]) g.rect(x - 3, -4, 6, 30).fill(wood.light).stroke(line(wood.line, 2));
  g.rect(50, 4, 40, 6).rect(50, 16, 40, 6).fill(wood.light);
  return g;
}

function cove(): Graphics {
  const g = new Graphics().ellipse(0, 22, 94, 34).fill(swatch.yellow.light);
  g.ellipse(6, 18, 78, 26).fill(swatch.teal.light).stroke(line(swatch.teal.line, 4));
  // Three buoys with one, two and three spots: something to count.
  [[-42, 10, 1, 'red'], [4, 2, 2, 'orange'], [48, 12, 3, 'purple']].forEach(([x, y, n, c]) => {
    const sw = swatch[c as 'red'];
    g.moveTo((x as number) - 16, (y as number) + 6).lineTo(x as number, (y as number) - 34).lineTo((x as number) + 16, (y as number) + 6).closePath().fill(sw.fill).stroke(line(sw.line, 4));
    for (let i = 0; i < (n as number); i++) g.circle((x as number) - ((n as number) - 1) * 4 + i * 8, (y as number) - 8, 3.5).fill(swatch.white.fill);
  });
  // A duck paddling.
  g.circle(-70, -2, 12).fill(swatch.yellow.fill).circle(-62, -14, 8).fill(swatch.yellow.fill).poly([-56, -16, -48, -13, -56, -10]).fill(swatch.orange.fill);
  return g;
}

function village(): Graphics {
  const g = new Graphics().ellipse(0, 28, 94, 24).fill(grass);
  const house = (x: number, w: number, h: number, wall: number, roof: { fill: number; line: number }) => {
    g.rect(x - w / 2, 26 - h, w, h).fill(wall).stroke(line(wood.line, 4));
    g.poly([x - w / 2 - 8, 28 - h, x, -8 - h, x + w / 2 + 8, 28 - h]).fill(roof.fill).stroke(line(roof.line, 4));
    g.roundRect(x - 9, 2, 18, 24, 4).fill(wood.fill).stroke(line(wood.line, 3));
    g.rect(x - w / 2 + 8, 30 - h, 14, 12).rect(x + w / 2 - 22, 30 - h, 14, 12).fill(swatch.yellow.light);
  };
  house(-38, 60, 56, cream, swatch.blue);
  house(40, 54, 72, swatch.pink.light, swatch.orange);
  // A little letterbox: Hazel's post.
  g.moveTo(-82, 26).lineTo(-82, -6).stroke(line(wood.line, 4)).roundRect(-94, -20, 24, 16, 5).fill(swatch.red.fill).stroke(line(swatch.red.line, 3));
  return g;
}

function rainbowMeadow(): Container {
  const c = new Container();
  const g = new Graphics().ellipse(0, 28, 94, 24).fill(grass);
  RAINBOW.forEach((name, i) => {
    const r = 82 - i * 9;
    g.moveTo(-r, 20).arc(0, 20, r, Math.PI, 0).stroke({ width: 9, color: swatch[name].fill, cap: 'round' });
  });
  puffs(g, [[-78, 14, 16], [-62, 20, 12]], swatch.white.fill, swatch.white.line, 4);
  puffs(g, [[76, 14, 16], [62, 20, 12]], swatch.white.fill, swatch.white.line, 4);
  c.addChild(g);
  for (const [x, y, color] of [[-30, 22, 'pink'], [0, 30, 'yellow'], [30, 22, 'purple']] as const) {
    const f = flower(new Graphics(), 11, swatch[color].fill, swatch[color].line);
    f.position.set(x, y);
    c.addChild(f);
  }
  return c;
}

function peaks(): Graphics {
  const g = new Graphics().ellipse(0, 28, 92, 24).fill(grass);
  // Two craggy grey peaks with a big jigsaw piece on top, and a dropped piece at their foot.
  g.poly([-92, 34, -54, -40, -30, -12, 0, -78, 40, 34]).fill(swatch.white.light).stroke(line(swatch.white.line));
  g.poly([0, 34, 46, -50, 88, 34]).fill(0xd9d9e6).stroke(line(swatch.white.line));
  const piece = (x: number, y: number, s: number, c: { fill: number; line: number }) => {
    g.roundRect(x - 18 * s, y - 18 * s, 36 * s, 36 * s, 5 * s).fill(c.fill).stroke(line(c.line, 4));
    g.circle(x, y - 22 * s, 8 * s).circle(x + 22 * s, y, 8 * s).fill(c.fill);
  };
  piece(0, -96, 1, swatch.yellow);
  piece(62, 16, 0.6, swatch.red);
  return g;
}

function grove(): Graphics {
  const g = new Graphics().ellipse(0, 28, 92, 24).fill(grass);
  // A giant storybook standing open on the grass, with little round trees behind it.
  for (const [x, r] of [[-66, 24], [66, 26]]) {
    g.rect(x - 4, -14, 8, 34).fill(wood.fill);
    puffs(g, [[x, -26, r]], swatch.green.fill, swatch.green.line, 5);
  }
  g.poly([-56, 26, -2, 10, -2, -70, -56, -54]).fill(swatch.white.fill).stroke(line(swatch.purple.line, 4));
  g.poly([2, 10, 56, 26, 56, -54, 2, -70]).fill(swatch.white.fill).stroke(line(swatch.purple.line, 4));
  g.poly([-60, 30, -2, 14, 2, 14, 60, 30, 60, 36, 2, 20, -2, 20, -60, 36]).fill(swatch.purple.fill);
  for (let i = 0; i < 4; i++) {
    g.moveTo(-48, -42 + i * 14).lineTo(-12, -54 + i * 14 + 14 * 0.0).stroke(line(swatch.purple.light, 3));
    g.moveTo(12, -54 + i * 14).lineTo(48, -42 + i * 14).stroke(line(swatch.purple.light, 3));
  }
  const star = new Graphics().poly(starPoints(10, 4)).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 2));
  star.position.set(0, -84);
  g.addChild(star);
  return g;
}

function lab(): Graphics {
  const g = new Graphics().ellipse(0, 28, 94, 24).fill(grass);
  g.roundRect(-66, -40, 84, 68, 8).fill(swatch.teal.light).stroke(line(swatch.teal.line));
  g.poly([-74, -36, -24, -76, 26, -36]).fill(swatch.blue.fill).stroke(line(swatch.blue.line, 4));
  g.roundRect(-36, -8, 24, 36, 5).fill(wood.fill).stroke(line(wood.line, 3));
  // A cog on the roof and a bubbling flask.
  g.poly(starPoints(24, 17, 8).map((v, i) => v + (i % 2 ? -74 : -24))).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 4));
  g.circle(-24, -74, 7).fill(swatch.yellow.line);
  g.moveTo(44, -40).lineTo(44, -18).lineTo(30, 20).quadraticCurveTo(52, 34, 74, 20).lineTo(60, -18).lineTo(60, -40).closePath().fill(swatch.green.light).stroke(line(swatch.green.line, 4));
  g.moveTo(34, 10).quadraticCurveTo(52, 22, 70, 10).lineTo(72, 18).quadraticCurveTo(52, 32, 32, 18).closePath().fill(swatch.green.fill);
  for (const [x, y, r] of [[50, -54, 6], [58, -70, 4], [48, -84, 3]]) g.circle(x, y, r).fill(swatch.green.light).stroke(line(swatch.green.line, 2));
  return g;
}

const DRAW: Record<LandId, () => Container> = {
  'bubble-beach': beach,
  'music-mountain': mountain,
  treehouse: pier,
  barnyard: barn,
  'counting-cove': cove,
  'cozy-village': village,
  'rainbow-meadow': rainbowMeadow,
  'puzzle-peaks': peaks,
  'story-grove': grove,
  'tinker-lab': lab,
};

export const landmarkFor = (id: LandId): Container => DRAW[id]();

/** Hazel, the squirrel postkeeper (Mail Carrier's woods, and Cozy Village's host): a critter with a bushy tail behind. */
export function makeHazel(): { node: Container; critter: Critter } {
  const node = new Container();
  const tail = new Graphics()
    .moveTo(60, -40).bezierCurveTo(190, -60, 200, -230, 120, -270).bezierCurveTo(70, -290, 40, -250, 70, -220).bezierCurveTo(130, -200, 120, -110, 50, -90).closePath()
    .fill(swatch.orange.fill).stroke(line(swatch.orange.line, 6));
  const critter = new Critter({ color: 'orange', ears: 'pointy', snout: 'nose', noseColor: ink, belly: true, tuft: true });
  node.addChild(tail, critter);
  return { node, critter };
}

/** A land's host, standing with its feet at (0, 0), and the critter inside it to track and poke. */
export function makeHost(land: Pick<Land, 'host'>): { node: Container; critter: Critter } {
  const { kind, color } = land.host;
  if (kind === 'hazel') return makeHazel();
  const critter = kind === 'juniper' ? makeGardener() : new Critter({ ...CRITTERS[kind], ...(color ? { color } : {}) });
  return { node: critter, critter };
}

/**
 * The signpost to a land's games for bigger kids: a post with an arrow board pointing on, a star on it for
 * "more to come". Turned round (`back`), it points home with a heart: back to her own games.
 */
export class Signpost extends Container {
  private readonly board = new Graphics();

  constructor() {
    super();
    const post = new Graphics().roundRect(-8, -130, 16, 132, 5).fill(wood.fill).stroke(line(wood.line, 4)).ellipse(0, 2, 34, 9).fill({ color: swatch.green.line, alpha: 0.2 });
    this.addChild(post, this.board);
    this.point(false);
  }

  point(back: boolean) {
    const g = this.board.clear();
    const d = back ? -1 : 1;
    g.poly([-56 * d, -140, 40 * d, -140, 66 * d, -112, 40 * d, -84, -56 * d, -84]).fill(wood.light).stroke(line(wood.line, 5));
    if (back) {
      g.circle(12, -118, 10).circle(-4, -118, 10).fill(swatch.pink.fill);
      g.poly([-14, -114, 22, -114, 4, -96]).fill(swatch.pink.fill);
    } else g.poly(starPoints(18, 8).map((v, i) => v + (i % 2 ? -112 : -6))).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 3));
  }
}
