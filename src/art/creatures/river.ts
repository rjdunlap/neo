import { Container, Graphics } from 'pixi.js';
import { cream, ink, swatch } from '../palette';
import { blush, Creature, eye, stroke } from './creature';

const FUR = swatch.brown;
const DARK = { fill: 0x8f6142, line: 0x5e4029 };
const MOUTH = 0x7a2e3e;
/** Spine segments from the chest (0) to the hips: x position and radius. */
/** Spine segments from the chest (0) to the hips: x position and radius, close enough that the outline reads as one smooth body. */
const SPINE: [number, number][] = Array.from({ length: 10 }, (_, i) => [62 - i * 17.5, 40 - i * 0.45]);
const BASE_Y = -56;

/**
 * The long river creature: low and stretched, a small head with whiskers on a long body and a
 * flat paddle tail. Facing right, feet on (0, 0), about 330 long and 140 tall at scale 1.
 * Idle: a slow wave runs down its back and the tail swishes. Touch: it rears up to look, then settles.
 * Each segment is three stacked drawings (outline, fur, belly) so overlapping circles read as one body.
 */
export class River extends Creature {
  readonly species = 'river' as const;
  readonly touch = { x: -10, y: -70, r: 150 };
  protected readonly reactionLength = 1.3;

  private readonly segs: { outline: Graphics; fur: Graphics; belly: Graphics }[] = [];
  private readonly legs: Graphics[] = [];
  private readonly head = new Container();
  private readonly neck = new Container();
  private readonly tail = new Container();
  private readonly smile = new Graphics();
  private readonly open = new Graphics();

  constructor() {
    super();
    const legLayer = new Container();
    const outline = new Container();
    const fur = new Container();
    const belly = new Container();
    for (const [, r] of SPINE) {
      const o = new Graphics().circle(0, 0, r + 3).fill(FUR.line);
      const f = new Graphics().circle(0, 0, r - 3).fill(FUR.fill);
      const b = new Graphics().ellipse(0, r * 0.42, r * 0.72, r * 0.42).fill(cream);
      outline.addChild(o);
      fur.addChild(f);
      belly.addChild(b);
      this.segs.push({ outline: o, fur: f, belly: b });
    }
    // Four stubby legs under the chest and the hips.
    for (let i = 0; i < 4; i++) {
      const l = new Graphics().roundRect(-13, 0, 26, 34, 12).fill(DARK.fill).stroke(stroke(DARK.line, 5));
      legLayer.addChild(l);
      this.legs.push(l);
    }
    const tail = new Graphics();
    tail.moveTo(0, -8).bezierCurveTo(-40, -40, -110, -34, -128, -6).bezierCurveTo(-112, 22, -42, 26, 0, 10).closePath().fill(DARK.fill).stroke(stroke(DARK.line));
    tail.moveTo(-30, 0).lineTo(-96, -4).stroke(stroke(DARK.line, 4));
    this.tail.addChild(tail);

    // The head: round ears, a cream muzzle, a dark nose, small eyes set forward, whiskers.
    const h = new Graphics();
    for (const x of [-26, 10]) h.circle(x, -36, 13).fill(FUR.fill).stroke(stroke(FUR.line, 5));
    h.circle(0, 0, 44).fill(FUR.fill).stroke(stroke(FUR.line));
    h.ellipse(20, 14, 30, 22).fill(cream);
    h.ellipse(40, 2, 10, 7).fill(ink);
    for (const [y, a] of [
      [10, -0.15],
      [18, 0.12],
    ] as const) {
      h.moveTo(48, y).lineTo(48 + 30 * Math.cos(a), y + 30 * Math.sin(a)).stroke(stroke(FUR.line, 3));
    }
    blush(h, 2, 14, 10);
    this.head.addChild(h);
    const e = eye(9);
    e.position.set(14, -12);
    this.eyes.push(e);
    this.smile.moveTo(28, 22).quadraticCurveTo(36, 28, 44, 20).stroke(stroke(MOUTH, 4));
    this.open.moveTo(26, 20).quadraticCurveTo(36, 40, 46, 18).closePath().fill(MOUTH);
    this.open.visible = false;
    this.head.addChild(e, this.smile, this.open);

    // Slots: the scarf between head and chest, the crown between the ears.
    const crown = new Container();
    crown.position.set(-6, -40);
    this.head.addChild(crown);
    this.slots.head = { node: crown, width: 78 };
    this.slots.neck = { node: this.neck, width: 76 };

    this.addChild(this.tail, legLayer, outline, fur, belly, this.head, this.neck);
    this.animate();
  }

  protected animate() {
    const t = this.clock;
    const ex = this.excite(this.reactionLength);
    const ys: number[] = [];
    SPINE.forEach(([x], i) => {
      // A travelling wave, plus the rear: the chest lifts most, the hips stay down.
      const rear = ex * 70 * Math.pow(1 - i / (SPINE.length - 1), 2);
      const y = BASE_Y - 3 + 4 * Math.sin(t * 2.4 - i * 0.45) - rear;
      ys.push(y);
      const s = this.segs[i];
      for (const g of [s.outline, s.fur, s.belly]) g.position.set(x + rear * 0.25, y);
    });
    // Hind legs reach the ground; front legs dangle when it rears.
    const legAt = [0, 2, 7, 9];
    this.legs.forEach((l, i) => {
      const j = legAt[i];
      const top = ys[j] + 24;
      l.position.set(SPINE[j][0] + (i % 2 ? -6 : 6), top);
      l.scale.y = Math.min(j < 2 ? 1 : 2, Math.max(0.6, -top / 34));
    });
    const chestY = ys[0];
    this.head.position.set(SPINE[0][0] + 44 + ex * 10, chestY - 22 - ex * 12);
    this.head.rotation = -0.06 * Math.sin(t * 1.3) - ex * 0.35;
    // A collar across the throat, under the chin, turning with the head.
    this.neck.position.set(this.head.x - 28, this.head.y + 32);
    this.neck.rotation = -0.55 + this.head.rotation;
    this.tail.position.set(SPINE[SPINE.length - 1][0] - 24, ys[SPINE.length - 1] + 6);
    this.tail.rotation = 0.18 * Math.sin(t * 1.9) + ex * 0.4 * Math.sin(this.sincePoke * 16);
    this.open.visible = ex > 0.05;
    this.smile.visible = !this.open.visible;
  }
}
