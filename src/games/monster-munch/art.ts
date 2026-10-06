import { Container, Graphics } from 'pixi.js';
import { cream, ink, swatch, wood, type ColorName, type Swatch } from '../../art/palette';
import { prop } from '../../art/props';
import { bodyPath } from '../../art/shapes';
import { Rng } from '../../engine/random';
import type { Food } from './logic';

const line = (color: number, width = 6) => ({ width, color, join: 'round' as const, cap: 'round' as const });

export const MONSTER_COLORS: ColorName[] = ['green', 'purple', 'orange'];
/** The mouth's middle, in the monster's own coordinates (feet on 0, 0). */
export const MOUTH_Y = -170;
/** Roughly how wide and tall a monster is at scale 1. */
export const MONSTER_W = 300;
export const MONSTER_H = 320;

/** A cookie or an apple, about 90 units across, centered on (0, 0). */
export function foodArt(food: Food): Container {
  if (food === 'apple') {
    const apple = prop('apple', 'red');
    apple.scale.set(0.8);
    return apple;
  }
  const c = new Container();
  const g = new Graphics().circle(0, 0, 42).fill(wood.fill).stroke(line(wood.line, 5));
  g.circle(-6, -4, 30).fill({ color: wood.light, alpha: 0.6 });
  for (const [x, y] of [[-16, -14], [12, -18], [-2, 4], [18, 8], [-18, 14], [4, 22]]) g.ellipse(x, y, 6, 5).fill(swatch.brown.line);
  c.addChild(g);
  return c;
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
  private clock = Math.random() * 10;

  constructor(color: ColorName) {
    super();
    this.sw = swatch[color];
    const sw = this.sw;
    const back = new Graphics();
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
    for (const side of [-1, 1]) {
      const x = side * 52;
      const y = -238;
      if (this.delight > 0) {
        g.moveTo(x - 22, y + 6).quadraticCurveTo(x, y - 18, x + 22, y + 6).stroke(line(ink, 7));
      } else if (closed) {
        g.moveTo(x - 22, y).lineTo(x + 22, y).stroke(line(ink, 6));
      } else {
        g.circle(x, y, 32).fill(swatch.white.fill).stroke(line(this.sw.line, 5));
        g.circle(x + side * -4, y + 6, 15).fill(ink).circle(x + side * -4 + 5, y, 5).fill(swatch.white.fill);
      }
    }
  }

  private drawTummy() {
    const g = this.tummy.clear();
    g.ellipse(0, -72, 96, 58).fill(this.sw.light);
    if (!this.showTummy) return;
    // Up to ten little foods in two rows of five.
    this.eaten.slice(0, 10).forEach((food, i) => {
      const row = Math.floor(i / 5);
      const inRow = Math.min(5, this.eaten.length - row * 5);
      const x = (i % 5 - (inRow - 1) / 2) * 34;
      const y = -88 + row * 34;
      if (food === 'apple') g.circle(x, y, 13).fill(swatch.red.fill).stroke(line(swatch.red.line, 3));
      else g.circle(x, y, 13).fill(wood.fill).stroke(line(wood.line, 3)).circle(x - 4, y - 3, 3).circle(x + 5, y + 3, 3).fill(swatch.brown.line);
    });
  }

  /** Redraws the tummy (after toggling `showTummy`). */
  refresh() {
    this.drawTummy();
  }
}

/** A monster sticker holding a cookie, rebuilt from its seed. */
export function monsterSticker(seed = 1): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const m = new Monster(rng.pick(MONSTER_COLORS));
  m.showTummy = false;
  m.refresh();
  m.gape(true);
  m.update(1);
  m.scale.set(0.42);
  m.y = 72;
  const cookie = foodArt('cookie');
  cookie.scale.set(0.6);
  cookie.position.set(52, -10);
  c.addChild(new Graphics().circle(0, 0, 88).fill(cream), m, cookie);
  return c;
}
