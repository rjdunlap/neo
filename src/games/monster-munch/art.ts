import { Container, Graphics } from 'pixi.js';
import { cream, ink, swatch, wood, type ColorName, type Swatch } from '../../art/palette';
import { prop } from '../../art/props';
import { bodyPath, puffs } from '../../art/shapes';
import { Rng } from '../../engine/random';
import { FOODS, type Food } from './logic';

const line = (color: number, width = 6) => ({ width, color, join: 'round' as const, cap: 'round' as const });

export const MONSTER_COLORS: ColorName[] = ['green', 'purple', 'orange', 'blue', 'pink'];

/** What sits on a monster's head: two horns, or a fuzzy crest of puffs. */
export type MonsterTop = 'horns' | 'fuzz';
export interface MonsterLook {
  color: ColorName;
  top: MonsterTop;
  /** One big eye or two. */
  eyes: 1 | 2;
}

/** `n` monsters for a round, each a different colour, with seeded heads and eyes. */
export function monsterLooks(n: number, rng: Rng): MonsterLook[] {
  return rng.shuffle([...MONSTER_COLORS]).slice(0, n).map((color) => ({ color, top: rng.pick(['horns', 'fuzz'] as const), eyes: rng.chance(0.3) ? 1 : 2 }));
}

/** Where the feast happens; the game picks one per visit. */
export const MUNCH_PLACES = ['beach', 'cave', 'picnic'] as const;
export type MunchPlace = (typeof MUNCH_PLACES)[number];

/** The crumbs that fly when a food is eaten. */
export const FOOD_TINT: Record<Food, number> = {
  cookie: wood.fill,
  apple: swatch.red.fill,
  carrot: swatch.orange.fill,
  berry: swatch.red.fill,
  cracker: swatch.yellow.fill,
};
/** The mouth's middle, in the monster's own coordinates (feet on 0, 0). */
export const MOUTH_Y = -170;
/** Roughly how wide and tall a monster is at scale 1. */
export const MONSTER_W = 300;
export const MONSTER_H = 320;

/** One food, about 90 units across, centered on (0, 0). Each has its own shape and colour so two kinds never look alike. */
export function foodArt(food: Food): Container {
  if (food === 'apple') {
    const apple = prop('apple', 'red');
    apple.scale.set(0.8);
    return apple;
  }
  const c = new Container();
  const g = new Graphics();
  switch (food) {
    case 'carrot': {
      // A fat orange cone pointing down, with a green tuft.
      for (const a of [-0.5, 0, 0.5]) g.ellipse(Math.sin(a) * 18, -36 - Math.cos(a) * 8, 8, 18).fill(swatch.green.fill).stroke(line(swatch.green.line, 3));
      g.moveTo(-26, -28).quadraticCurveTo(0, -36, 26, -28).quadraticCurveTo(12, 14, 0, 44).quadraticCurveTo(-12, 14, -26, -28).closePath();
      g.fill(swatch.orange.fill).stroke(line(swatch.orange.line, 5));
      for (const [y, w] of [[-12, 12], [6, 9], [22, 6]]) g.moveTo(-w, y).lineTo(w * 0.2, y + 3).stroke(line(swatch.orange.line, 3));
      break;
    }
    case 'berry': {
      // A strawberry: a rounded heart with seeds and a leafy cap.
      g.moveTo(0, 42).bezierCurveTo(-30, 30, -44, -6, -32, -22).bezierCurveTo(-18, -38, 18, -38, 32, -22).bezierCurveTo(44, -6, 30, 30, 0, 42).closePath();
      g.fill(swatch.red.fill).stroke(line(swatch.red.line, 5));
      for (const [x, y] of [[-16, -10], [4, -14], [20, -4], [-6, 6], [12, 14], [-18, 12], [0, 26]]) g.ellipse(x, y, 3, 4).fill(swatch.yellow.light);
      g.poly([-28, -26, -10, -30, 0, -44, 10, -30, 28, -26, 8, -20, 0, -16, -8, -20]).fill(swatch.green.fill).stroke(line(swatch.green.line, 3));
      break;
    }
    case 'cracker': {
      // A square, golden cracker with a frilled edge and pricked holes.
      g.roundRect(-38, -38, 76, 76, 12).fill(swatch.yellow.fill).stroke(line(swatch.orange.line, 5));
      g.roundRect(-28, -28, 56, 56, 8).fill({ color: swatch.yellow.light, alpha: 0.5 });
      for (const x of [-16, 0, 16]) for (const y of [-16, 0, 16]) g.circle(x, y, 3.5).fill(swatch.orange.line);
      break;
    }
    default: {
      g.circle(0, 0, 42).fill(wood.fill).stroke(line(wood.line, 5));
      g.circle(-6, -4, 30).fill({ color: wood.light, alpha: 0.6 });
      for (const [x, y] of [[-16, -14], [12, -18], [-2, 4], [18, 8], [-18, 14], [4, 22]]) g.ellipse(x, y, 6, 5).fill(swatch.brown.line);
    }
  }
  c.addChild(g);
  return c;
}

/** A little food in the tummy window, about 26 units across. */
function tummyIcon(g: Graphics, food: Food, x: number, y: number) {
  switch (food) {
    case 'apple':
      g.circle(x, y, 13).fill(swatch.red.fill).stroke(line(swatch.red.line, 3));
      break;
    case 'carrot':
      g.poly([x - 10, y - 11, x + 10, y - 11, x, y + 14]).fill(swatch.orange.fill).stroke(line(swatch.orange.line, 3));
      g.circle(x, y - 14, 4).fill(swatch.green.fill);
      break;
    case 'berry':
      g.moveTo(x, y + 13).quadraticCurveTo(x - 16, y - 2, x - 9, y - 9).quadraticCurveTo(x, y - 14, x + 9, y - 9).quadraticCurveTo(x + 16, y - 2, x, y + 13).closePath();
      g.fill(swatch.red.fill).stroke(line(swatch.red.line, 3));
      g.circle(x, y - 11, 3.5).fill(swatch.green.fill);
      break;
    case 'cracker':
      g.roundRect(x - 11, y - 11, 22, 22, 4).fill(swatch.yellow.fill).stroke(line(swatch.orange.line, 3));
      g.circle(x - 4, y - 4, 2).circle(x + 4, y + 4, 2).fill(swatch.orange.line);
      break;
    default:
      g.circle(x, y, 13).fill(wood.fill).stroke(line(wood.line, 3)).circle(x - 4, y - 3, 3).circle(x + 5, y + 3, 3).fill(swatch.brown.line);
  }
}

/** The backdrop behind the feast, redrawn on every resize. */
export function drawPlace(g: Graphics, place: MunchPlace, w: number, h: number) {
  const sea = h * 0.36;
  const clouds = () => {
    for (const [cx, cy, r] of [[w * 0.55, 95, 1], [w * 0.82, 210, 0.7]]) {
      puffs(g, [[-46 * r, 8 * r, 34 * r], [0, -12 * r, 46 * r], [46 * r, 8 * r, 34 * r]].map(([x, y, rr]) => [cx + x, cy + y, rr] as [number, number, number]), swatch.white.fill, swatch.white.fill, 0);
    }
  };
  g.clear();
  switch (place) {
    case 'cave': {
      // A rocky hillside with a big dark cave mouth behind the monsters, and a sandy floor.
      g.rect(0, 0, w, h).fill(swatch.blue.light);
      g.rect(0, sea * 0.5, w, h).fill(swatch.brown.light);
      for (let x = 0; x < w + 120; x += 120) g.circle(x, sea * 0.5, 64).fill(swatch.brown.light);
      g.ellipse(w * 0.62, sea + 70, w * 0.3, sea * 0.95).fill(0x4a3a40).stroke(line(swatch.brown.line, 10));
      for (let i = 0; i < 5; i++) {
        const x = w * 0.42 + i * w * 0.1;
        g.poly([x - 18, sea * 0.25 + 30, x + 18, sea * 0.25 + 30, x, sea * 0.25 + 70 + (i % 2) * 24]).fill(swatch.brown.fill);
      }
      g.rect(0, sea + 50, w, h - sea - 50).fill(swatch.brown.fill);
      puffs(g, [[60, sea + 40, 46], [118, sea + 56, 30], [w - 40, sea + 46, 40]], swatch.white.light, swatch.white.line, 5);
      break;
    }
    case 'picnic': {
      // A sunny meadow with a red-and-white checked blanket under the tray.
      g.rect(0, 0, w, h).fill(swatch.blue.light);
      g.rect(0, sea, w, h - sea).fill(swatch.green.light);
      puffs(g, [[w * 0.12, sea, 52], [w * 0.22, sea + 8, 40], [w * 0.92, sea + 4, 46]], swatch.green.fill, swatch.green.line, 5);
      const top = sea + 60;
      const sq = 60;
      for (let y = top, row = 0; y < h; y += sq, row++) {
        for (let x = 0, col = 0; x < w; x += sq, col++) g.rect(x, y, sq, sq).fill((row + col) % 2 ? swatch.red.light : swatch.white.fill);
      }
      g.rect(0, top, w, 6).fill(swatch.red.line);
      clouds();
      break;
    }
    default:
      g.rect(0, 0, w, h).fill(swatch.blue.light).rect(0, sea, w, h - sea).fill(swatch.teal.fill).rect(0, sea + 50, w, h - sea - 50).fill(swatch.yellow.light);
      for (let x = 0; x < w + 60; x += 60) g.circle(x, sea + 50, 31).fill(swatch.yellow.light);
      clouds();
  }
}

/**
 * A friendly, always-hungry monster. Its mouth gapes when food comes near, chews,
 * and its tummy window shows what it has eaten. Call `update(dt)` every frame.
 */
export class Monster extends Container {
  readonly sw: Swatch;
  readonly eaten: Food[] = [];
  /** Show eaten food as little icons in the tummy window. */
  showTummy = true;
  /** Big bites: the belly swells a little with every bite and rumbles. */
  grows = false;
  private belly = 0;

  private readonly body = new Container();
  private readonly mouth = new Graphics();
  private readonly eyes = new Graphics();
  private readonly tummy = new Graphics();
  private open = 0.15;
  private openTarget = 0.15;
  private chew = 0;
  private squash = 0;
  private squashV = 0;
  private shake = 0;
  private delight = 0;
  private blinkIn = 2;
  private blinkT = 0;
  private leanT = 0;
  private leanDir = 0;
  /** The tummy icon being counted along, ringed; -1 for none. */
  private lit = -1;
  private clock = Math.random() * 10;

  readonly look: MonsterLook;

  constructor(look: MonsterLook | ColorName) {
    super();
    this.look = typeof look === 'string' ? { color: look, top: 'horns', eyes: 2 } : look;
    this.sw = swatch[this.look.color];
    const sw = this.sw;
    const back = new Graphics();
    if (this.look.top === 'fuzz') {
      // A fuzzy crest peeking over the head; it stays inside the horns' height.
      puffs(back, [[-96, -250, 30], [-56, -284, 34], [0, -300, 38], [56, -284, 34], [96, -250, 30]], sw.light, sw.line, 6);
    } else {
      // Horns and a row of soft spikes.
      for (const side of [-1, 1]) {
        back
          .moveTo(side * 70, -270)
          .quadraticCurveTo(side * 98, -320, side * 82, -345)
          .quadraticCurveTo(side * 64, -312, side * 44, -282)
          .closePath()
          .fill(swatch.yellow.fill)
          .stroke(line(swatch.yellow.line, 5));
      }
      for (let i = -2; i <= 2; i++) back.poly([i * 34 - 16, -292, i * 34, -322 + Math.abs(i) * 8, i * 34 + 16, -292]).fill(sw.line);
    }
    const shell = bodyPath(new Graphics(), 150, 300).fill(sw.fill).stroke(line(sw.line, 7));
    const arms = new Graphics();
    for (const side of [-1, 1]) arms.ellipse(side * 150, -120, 26, 40).fill(sw.fill).stroke(line(sw.line, 6));
    const feet = new Graphics();
    for (const side of [-1, 1]) feet.ellipse(side * 55, 0, 42, 18).fill(sw.line);
    this.body.addChild(back, arms, shell, this.tummy, this.mouth, this.eyes, feet);
    this.addChild(this.body);
    this.drawEyes();
    this.drawTummy();
  }

  /** The mouth's middle in the parent's coordinates. */
  mouthPoint() {
    return { x: this.x, y: this.y + MOUTH_Y * this.scale.y };
  }

  /** Whether a point in the parent's coordinates is over this monster (generously). */
  covers(x: number, y: number) {
    const s = this.scale.x;
    return Math.abs(x - this.x) < (MONSTER_W / 2 + 30) * s && y > this.y - (MONSTER_H + 40) * s && y < this.y + 40 * s;
  }

  gape(on: boolean) {
    this.openTarget = on ? 1 : 0.15;
  }

  eat(food: Food) {
    this.eaten.push(food);
    this.chew = 0.9;
    this.squashV += 3;
    if (this.grows) {
      this.belly++;
      this.shake = 0.5;
    }
    this.drawTummy();
  }

  /** Takes back the last eaten `food`; returns false if there is none. */
  giveBack(food: Food = 'cookie') {
    const i = this.eaten.lastIndexOf(food);
    if (i < 0) return false;
    this.eaten.splice(i, 1);
    this.squashV -= 2;
    this.drawTummy();
    return true;
  }

  count(food: Food) {
    return this.eaten.filter((f) => f === food).length;
  }

  /** A head shake: "no thank you". */
  refuse() {
    this.shake = 1;
  }

  /** A curious lean towards a point in the parent's coordinates: "hm?". */
  lean(x: number) {
    this.leanDir = Math.sign(x - this.x) || 1;
    this.leanT = 1;
  }

  /** Rings tummy icon `i` while it is counted aloud; -1 clears it. */
  light(i: number) {
    this.lit = i;
    this.drawTummy();
  }

  /** Happy squinting eyes for a moment. */
  beam(seconds = 1.5) {
    this.delight = seconds;
    this.squashV += 2;
    this.drawEyes();
  }

  burp() {
    this.squashV -= 5;
    this.open = 1;
    this.beam(1.2);
  }

  update(dt: number) {
    this.clock += dt;
    this.squashV += (-160 * this.squash - 9 * this.squashV) * dt;
    this.squash += this.squashV * dt;
    const breathe = 0.02 * Math.sin(this.clock * 2.2);
    this.body.scale.set(1 + this.squash - breathe * 0.5, 1 - this.squash + breathe);
    this.shake = Math.max(0, this.shake - dt * 1.8);
    this.body.x = Math.sin(this.shake * 30) * 14 * this.shake;
    this.leanT = Math.max(0, this.leanT - dt * 1.4);
    this.body.rotation = this.leanDir * 0.14 * Math.sin(this.leanT * Math.PI);
    if (this.delight > 0) {
      this.delight -= dt;
      if (this.delight <= 0) this.drawEyes();
    }
    if (this.blinkT > 0) {
      this.blinkT -= dt;
      if (this.blinkT <= 0) this.drawEyes();
    } else if ((this.blinkIn -= dt) <= 0) {
      this.blinkIn = 2 + Math.random() * 3;
      this.blinkT = 0.14;
      this.drawEyes(true);
    }
    // Chewing snaps the mouth open and shut; otherwise it eases toward its target.
    if (this.chew > 0) {
      this.chew -= dt;
      this.open = 0.25 + 0.25 * Math.abs(Math.sin(this.chew * 18));
    } else {
      this.open += (this.openTarget - this.open) * Math.min(1, dt * 10);
    }
    this.drawMouth();
  }

  private drawMouth() {
    const m = this.mouth.clear();
    const ry = 10 + 58 * this.open;
    m.ellipse(0, MOUTH_Y, 74, ry).fill(0x7a2e3e).stroke(line(this.sw.line, 6));
    if (this.open > 0.35) {
      m.ellipse(0, MOUTH_Y + ry * 0.55, 40, ry * 0.35).fill(swatch.pink.fill);
      for (const x of [-34, 34]) m.poly([x - 13, MOUTH_Y - ry + 4, x + 13, MOUTH_Y - ry + 4, x, MOUTH_Y - ry + 26]).fill(swatch.white.fill);
    }
  }

  private drawEyes(closed = false) {
    const g = this.eyes.clear();
    // Two eyes, or one big one in the middle.
    const one = this.look.eyes === 1;
    const k = one ? 1.4 : 1;
    for (const side of one ? [0] : [-1, 1]) {
      const x = side * 52;
      const y = one ? -246 : -238;
      if (this.delight > 0) {
        g.moveTo(x - 22 * k, y + 6).quadraticCurveTo(x, y - 18 * k, x + 22 * k, y + 6).stroke(line(ink, 7));
      } else if (closed) {
        g.moveTo(x - 22 * k, y).lineTo(x + 22 * k, y).stroke(line(ink, 6));
      } else {
        g.circle(x, y, 32 * k).fill(swatch.white.fill).stroke(line(this.sw.line, 5));
        g.circle(x - side * 4, y + 6, 15 * k).fill(ink).circle(x - side * 4 + 5 * k, y, 5 * k).fill(swatch.white.fill);
      }
    }
  }

  private drawTummy() {
    const g = this.tummy.clear();
    const swell = 1 + 0.12 * this.belly;
    g.ellipse(0, -72, 96 * swell, 58 * swell).fill(this.sw.light).stroke(line(this.sw.line, this.belly ? 4 : 0));
    if (!this.showTummy) return;
    // Up to ten little foods in two rows of five.
    this.eaten.slice(0, 10).forEach((food, i) => {
      const row = Math.floor(i / 5);
      const inRow = Math.min(5, this.eaten.length - row * 5);
      const x = (i % 5 - (inRow - 1) / 2) * 34;
      const y = -88 + row * 34;
      tummyIcon(g, food, x, y);
      if (i === this.lit) g.circle(x, y, 19).stroke(line(swatch.yellow.line, 5));
    });
  }

  /** Redraws the tummy (after toggling `showTummy`). */
  refresh() {
    this.drawTummy();
  }
}

/** A monster sticker holding a food, both drawn from the game's pools and rebuilt from its seed. */
export function monsterSticker(seed = 1): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const m = new Monster(monsterLooks(1, rng)[0]);
  m.showTummy = false;
  m.refresh();
  m.gape(true);
  m.update(1);
  m.scale.set(0.42);
  m.y = 72;
  const food = foodArt(rng.pick(FOODS));
  food.scale.set(0.6);
  food.position.set(52, -10);
  c.addChild(new Graphics().circle(0, 0, 88).fill(cream), m, food);
  return c;
}
