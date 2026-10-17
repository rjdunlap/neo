import { Container, Graphics } from 'pixi.js';
import { cream, swatch } from '../palette';
import { blush, Creature, eye, stroke } from './creature';

const MOUTH = 0x7a2e3e;

/**
 * The squat sprout: wider than tall, short legs, a big low face and a two-leaf sprout.
 * Feet on (0, 0), about 200 wide and 230 tall to the leaf tips at scale 1.
 * Idle: breathes and sways its leaves. Touch: crouches, hops and spins its sprout.
 */
export class Sprout extends Creature {
  readonly species = 'sprout' as const;
  readonly touch = { x: 0, y: -95, r: 110 };
  protected readonly reactionLength = 0.9;

  private readonly body = new Container();
  private readonly leaf = new Container();
  private readonly smile = new Graphics();
  private readonly open = new Graphics();

  constructor() {
    super();
    const s = swatch.teal;
    const g = new Graphics();
    // Ears behind the body.
    for (const x of [-64, 64]) g.circle(x, -148, 24).fill(s.fill).stroke(stroke(s.line));
    for (const x of [-64, 64]) g.circle(x, -148, 11).fill(s.light);
    // Feet, then the round body over them.
    for (const x of [-52, 52]) g.ellipse(x, -10, 30, 16).fill(s.fill).stroke(stroke(s.line));
    g.ellipse(0, -88, 104, 86).fill(s.fill).stroke(stroke(s.line));
    g.ellipse(0, -60, 64, 50).fill(cream);
    // Little arms resting on the belly.
    for (const x of [-1, 1]) g.ellipse(x * 70, -72, 16, 24).fill(s.fill).stroke(stroke(s.line, 5));
    this.body.addChild(g);

    const face = new Container();
    const cheeks = new Graphics();
    blush(cheeks, -56, -100, 15);
    blush(cheeks, 56, -100, 15);
    face.addChild(cheeks);
    for (const x of [-34, 34]) {
      const e = eye(14);
      e.position.set(x, -116);
      face.addChild(e);
      this.eyes.push(e);
    }
    this.smile.moveTo(-12, -98).quadraticCurveTo(0, -86, 12, -98).stroke(stroke(MOUTH, 5));
    this.open.moveTo(-15, -100).quadraticCurveTo(0, -72, 15, -100).closePath().fill(MOUTH).stroke(stroke(MOUTH, 4));
    this.open.visible = false;
    face.addChild(this.smile, this.open);
    this.body.addChild(face);

    // The sprout: a stem and two leaves pivoting at the top of the head.
    const leaf = new Graphics();
    leaf.moveTo(0, 0).quadraticCurveTo(4, -22, 0, -40).stroke(stroke(swatch.green.line, 7));
    leaf.moveTo(0, -38).bezierCurveTo(-18, -70, -58, -66, -62, -50).bezierCurveTo(-46, -30, -16, -30, 0, -38).fill(swatch.green.fill).stroke(stroke(swatch.green.line, 5));
    leaf.moveTo(0, -38).bezierCurveTo(16, -78, 54, -80, 60, -64).bezierCurveTo(48, -40, 18, -34, 0, -38).fill(swatch.green.fill).stroke(stroke(swatch.green.line, 5));
    this.leaf.addChild(leaf);
    this.leaf.position.set(0, -170);
    this.body.addChild(this.leaf);

    // The crown rests on the top of the head around the sprout; the scarf where head meets body.
    const head = new Container();
    head.position.set(0, -164);
    const neck = new Container();
    neck.position.set(0, -66);
    // The scarf sits under the arms' tops but over the belly.
    this.body.addChildAt(neck, 1);
    this.body.addChild(head);
    this.slots.head = { node: head, width: 120 };
    this.slots.neck = { node: neck, width: 184 };
    this.addChild(this.body);
  }

  protected animate() {
    const t = this.clock;
    const breathe = 0.025 * Math.sin(t * 2.2);
    // The touch, as a function of time since it: crouch, a 70-unit hop, a landing squash.
    const p = this.sincePoke;
    let squash = 0;
    let lift = 0;
    if (p < 0.15) squash = 0.12 * (p / 0.15);
    else if (p < 0.55) {
      const u = (p - 0.15) / 0.4;
      lift = 70 * 4 * u * (1 - u);
      squash = -0.08 * Math.sin(u * Math.PI);
    } else if (p < 0.8) squash = 0.1 * Math.sin(((p - 0.55) / 0.25) * Math.PI);
    this.body.y = -lift;
    this.body.scale.set(1 + squash - breathe * 0.5, 1 - squash + breathe);
    const ex = this.excite(this.reactionLength);
    this.leaf.rotation = 0.12 * Math.sin(t * 1.6) + ex * 1.1 * Math.sin(p * 18);
    this.open.visible = ex > 0.05;
    this.smile.visible = !this.open.visible;
  }
}
