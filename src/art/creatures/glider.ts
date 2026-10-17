import { Container, Graphics } from 'pixi.js';
import { swatch } from '../palette';
import { puffs } from '../shapes';
import { blush, Creature, eye, stroke } from './creature';

const SKIN = swatch.purple;
const BODY = { fill: SKIN.light, line: SKIN.line };
const UNDER = 0xf6f1ff;
const RIBBON = swatch.pink;
const MOUTH = 0x7a2e3e;
const LINKS = 16;

/**
 * The broad cloud glider: a flat ray with one great swept wing, cloud markings, a tiny face at the
 * front and two ribbon tails. Facing right, centred on (0, 0) (it never stands), about 380 across
 * with the ribbons at scale 1. Idle: floats, flaps slowly, ribbons wave. Touch: a quick loop-the-loop.
 * It has no neck, so it takes the crown and not the scarf (see `misfit`).
 */
export class Glider extends Creature {
  readonly species = 'glider' as const;
  readonly touch = { x: 10, y: -20, r: 140 };
  protected readonly reactionLength = 1.2;

  private readonly craft = new Container();
  private readonly wing = new Container();
  private readonly farWing = new Container();
  private readonly ribbons: Graphics[][][] = [];
  private readonly smile = new Graphics();
  private readonly open = new Graphics();

  constructor() {
    super();
    this.misfit.scarf = 'no neck: the head runs straight into the wing, so a band would hide the face or the wing root';

    const far = new Graphics();
    far.moveTo(-40, 6).bezierCurveTo(-30, 50, 10, 74, 40, 70).bezierCurveTo(40, 40, 30, 20, 30, 8).closePath().fill(SKIN.fill).stroke(stroke(SKIN.line));
    this.farWing.addChild(far);
    this.farWing.position.set(0, 10);

    // Ribbon tails: chains of shrinking discs, so they bend without redrawing. All the outlines sit
    // behind all the fills, so the chain reads as one smooth ribbon.
    const ribbonBack = new Container();
    const ribbonFront = new Container();
    for (let k = 0; k < 2; k++) {
      const chain: Graphics[][] = [];
      for (let i = 0; i < LINKS; i++) {
        const r = 10 - i * 0.38;
        const back = new Graphics().circle(0, 0, r + 2.5).fill(RIBBON.line);
        const front = new Graphics().circle(0, 0, r - 1).fill(k ? RIBBON.light : RIBBON.fill);
        ribbonBack.addChild(back);
        ribbonFront.addChild(front);
        chain.push([back, front]);
      }
      this.ribbons.push(chain);
    }
    const ribbonLayer = new Container();
    ribbonLayer.addChild(ribbonBack, ribbonFront);

    const body = new Graphics();
    body.moveTo(118, -6).bezierCurveTo(118, -40, 60, -46, 0, -40).bezierCurveTo(-60, -34, -120, -16, -134, 0).bezierCurveTo(-110, 20, -40, 34, 30, 34).bezierCurveTo(90, 34, 118, 22, 118, -6).closePath().fill(BODY.fill).stroke(stroke(BODY.line));
    body.moveTo(110, 6).bezierCurveTo(80, 28, -20, 30, -90, 14).stroke(stroke(0xffffff, 6));
    body.ellipse(60, 16, 46, 12).fill(UNDER);

    const wing = new Graphics();
    wing.moveTo(60, -30).bezierCurveTo(40, -90, 0, -150, -40, -176).bezierCurveTo(-46, -140, -80, -70, -110, -24).closePath().fill(SKIN.fill).stroke(stroke(SKIN.line));
    puffs(
      wing,
      [
        [-34, -82, 15],
        [-16, -86, 18],
        [2, -78, 14],
      ],
      0xffffff,
      0xffffff,
      2,
    );
    puffs(
      wing,
      [
        [-52, -46, 11],
        [-38, -50, 13],
        [-24, -44, 10],
      ],
      0xffffff,
      0xffffff,
      2,
    );
    this.wing.addChild(wing);
    this.wing.position.set(0, -26);
    wing.y = 26;

    const face = new Container();
    const cheeks = new Graphics();
    blush(cheeks, 84, 6, 9);
    face.addChild(cheeks);
    const e = eye(9);
    e.position.set(92, -12);
    this.eyes.push(e);
    this.smile.moveTo(100, 6).quadraticCurveTo(106, 12, 113, 5).stroke(stroke(MOUTH, 4));
    this.open.moveTo(99, 4).quadraticCurveTo(106, 20, 114, 3).closePath().fill(MOUTH);
    this.open.visible = false;
    face.addChild(e, this.smile, this.open);

    // The crown sits on the top of the head, in front of the wing root.
    const head = new Container();
    head.position.set(88, -38);
    this.slots.head = { node: head, width: 62 };

    this.craft.addChild(this.farWing, ribbonLayer, body, this.wing, face, head);
    this.addChild(this.craft);
    this.animate();
  }

  protected animate() {
    const t = this.clock;
    const p = this.sincePoke;
    const looping = p < this.reactionLength;
    const u = looping ? p / this.reactionLength : 1;
    // Ease the loop so it leaves and returns gently.
    const turn = looping ? (1 - Math.cos(u * Math.PI)) / 2 : 0;
    const a = turn * Math.PI * 2;
    // Around a circle of radius 70 above the resting place, nose leading.
    this.craft.position.set(70 * Math.sin(a), -70 * (1 - Math.cos(a)) + 8 * Math.sin(t * 1.3));
    this.craft.rotation = -a + 0.05 * Math.sin(t * 1.1);
    const beat = looping ? 9 : 2.2;
    this.wing.scale.y = 0.82 + 0.18 * Math.sin(t * beat);
    this.farWing.scale.y = 0.85 - 0.15 * Math.sin(t * beat);
    this.ribbons.forEach((chain, k) => {
      let x = -124;
      let y = 4 + k * 10;
      chain.forEach((link, i) => {
        for (const g of link) g.position.set(x, y);
        x -= 8;
        y += (k ? 2.4 : 1.6) * Math.sin(t * 2.6 - i * 0.55 + k * 1.4) + (looping ? 4 * Math.sin(u * Math.PI) : 0);
      });
    });
    const ex = this.excite(this.reactionLength);
    this.open.visible = ex > 0.05;
    this.smile.visible = !this.open.visible;
  }
}
