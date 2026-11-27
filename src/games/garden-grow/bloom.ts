import { Container, Graphics } from 'pixi.js';
import { ink, swatch, type ColorName } from '../../art/palette';
import { ease } from '../../engine/tween';
import type { GameContext } from '../types';
import { drawKind } from './kinds';
import type { FlowerKind } from './logic';

/** A smiling flower on a stem: the stem rises, two leaves unfold, a bud swells, then the head opens. */
export class Bloom extends Container {
  readonly stem = new Graphics();
  readonly leaves = [new Graphics(), new Graphics()];
  readonly head = new Container();
  private readonly bud = new Graphics();
  private readonly face: Graphics;
  /** Level 8's stage targets (stem, leaves, bud, open head); `step` eases toward them. */
  private readonly now = { stem: 1, leaf: 1, bud: 0, face: 1 };
  private target = { stem: 1, leaf: 1, bud: 0, face: 1 };
  /** How much of the usual stem length it grows (1 is the usual); the conditions levels set it from the plant's height. */
  private reach = 1;
  constructor(
    readonly color: ColorName,
    readonly kind: FlowerKind = 'blossom',
  ) {
    super();
    this.stem.moveTo(0, 0).lineTo(0, -130).stroke({ width: 8, color: swatch.green.line, cap: 'round' });
    // Each leaf is drawn out from the stem, so scaling x unfolds it.
    const [right, left] = this.leaves;
    right.ellipse(18, 0, 18, 8).fill(swatch.green.fill).position.set(-2, -50);
    left.ellipse(-18, 0, 18, 8).fill(swatch.green.fill).position.set(2, -80);
    const sw = swatch[color];
    this.bud.ellipse(0, -4, 12, 17).fill(sw.fill).stroke({ width: 3, color: sw.line });
    this.bud
      .moveTo(-13, 6)
      .quadraticCurveTo(0, -6, 13, 6)
      .quadraticCurveTo(0, 18, -13, 6)
      .fill(swatch.green.fill);
    this.bud.visible = false;
    this.face = drawKind(new Graphics(), kind, 42, sw.fill, sw.line);
    // A sunflower's middle is dark brown, so its face is cream there.
    const feature = kind === 'sunflower' ? 0xfff3d6 : ink;
    this.face.circle(-7, -3, 3).circle(7, -3, 3).fill(feature);
    this.face.moveTo(-7, 6).quadraticCurveTo(0, 12, 7, 6).stroke({ width: 3, color: feature, cap: 'round' });
    this.head.addChild(this.face, this.bud);
    this.head.y = -140;
    this.addChild(this.stem, ...this.leaves, this.head);
  }
  /**
   * The flower as level 8's touch has grown it: 1 is the seed (nothing above the soil), 2 a sprout, 3 leaves, 4 a bud,
   * 5 open. Whatever the last stage was still easing toward is finished at once, so no touch is lost.
   */
  setStage(n: number) {
    Object.assign(this.now, this.target);
    this.target = {
      stem: n < 2 ? 0 : n === 2 ? 0.35 : 1,
      leaf: n >= 3 ? 1 : 0,
      bud: n === 4 ? 1 : 0,
      face: n >= 5 ? 1 : 0,
    };
    if (n < 2) Object.assign(this.now, this.target);
    this.paint();
  }

  /** A taller or shorter plant of the same flower: only the stem changes length, never the head. */
  setReach(k: number) {
    this.reach = k;
    this.paint();
  }

  step(dt: number) {
    const k = Math.min(1, dt * 9);
    for (const key of ['stem', 'leaf', 'bud', 'face'] as const)
      this.now[key] += (this.target[key] - this.now[key]) * k;
    this.paint();
  }

  private paint() {
    const { stem, leaf, bud, face } = this.now;
    this.stem.scale.set(1, stem * this.reach);
    this.head.y = -10 - 130 * stem * this.reach;
    this.leaves[0].y = -50 * this.reach;
    this.leaves[1].y = -80 * this.reach;
    for (const l of this.leaves) l.scale.set(leaf, 1);
    this.bud.visible = bud > 0.02;
    this.bud.scale.set(bud);
    this.face.scale.set(face);
    this.head.visible = stem > 0.05;
  }

  async grow(tw: GameContext['tw']) {
    this.stem.scale.set(1, 0);
    for (const l of this.leaves) l.scale.set(0, 1);
    this.face.scale.set(0);
    this.bud.scale.set(0);
    this.bud.visible = true;
    await tw.to(this.stem.scale, { y: 1 }, { duration: 0.5, ease: ease.outQuad });
    this.leaves.forEach(
      (l, i) => void tw.to(l.scale, { x: 1 }, { duration: 0.3, delay: i * 0.08, ease: ease.outBack }),
    );
    await tw.to(this.bud.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
    await tw.to(this.bud.scale, { x: 1.25, y: 1.15 }, { duration: 0.15 });
    this.bud.visible = false;
    await tw.to(this.face.scale, { x: 1, y: 1 }, { duration: 0.35, ease: ease.outBack });
  }
}
