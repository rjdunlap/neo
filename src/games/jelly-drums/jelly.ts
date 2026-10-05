import { Container, Graphics } from 'pixi.js';
import { cheek, ink, swatch, type ColorName } from '../../art/palette';
import { domePath } from '../../art/shapes';

const MOUTH = 0x7a2e3e;

/** A wobbly singing jelly standing on (0, 0). Squashes like a spring when tapped. */
export class Jelly extends Container {
  readonly color: ColorName;
  private readonly body = new Container();
  private readonly halo = new Graphics();
  private readonly face = new Graphics();
  private squash = 0;
  private squashV = 0;
  private singing = 0;
  private glowLeft = 0;
  private clock = Math.random() * 3;
  private wasSinging = true;

  constructor(
    color: ColorName,
    private readonly hw: number,
    private readonly h: number,
  ) {
    super();
    this.color = color;
    const sw = swatch[color];
    const shape = domePath(new Graphics(), hw, h).fill({ color: sw.fill, alpha: 0.95 }).stroke({ width: 6, color: sw.line, join: 'round' });
    const shine = new Graphics()
      .ellipse(-hw * 0.42, -h * 0.66, hw * 0.16, h * 0.12)
      .fill({ color: 0xffffff, alpha: 0.65 })
      .circle(-hw * 0.2, -h * 0.84, hw * 0.06)
      .fill({ color: 0xffffff, alpha: 0.65 });
    const belly = domePath(new Graphics(), hw * 0.62, h * 0.42).fill({ color: sw.light, alpha: 0.45 });
    this.body.addChild(shape, belly, shine, this.face);
    this.addChild(this.halo, this.body);
    this.drawFace();
  }

  /** A tap: squish and sing. */
  hit(power = 1) {
    this.squashV += 5.5 * power;
    this.singing = 0.45;
  }

  glow(seconds: number) {
    this.glowLeft = Math.max(this.glowLeft, seconds);
  }

  /** `beat` is 0..1 through the music's current beat, so idle jellies bob in time. */
  update(dt: number, beat: number) {
    this.clock += dt;
    this.squashV += (-150 * this.squash - 7 * this.squashV) * dt;
    this.squash += this.squashV * dt;
    const bob = 0.035 * Math.pow(1 - beat, 3);
    this.body.scale.set(1 + this.squash * 0.8 + bob * 0.5, 1 - this.squash - bob);

    this.singing = Math.max(0, this.singing - dt);
    if (this.singing > 0 !== this.wasSinging) this.drawFace();

    this.glowLeft = Math.max(0, this.glowLeft - dt);
    this.halo.clear();
    if (this.glowLeft > 0) {
      const pulse = 1 + 0.06 * Math.sin(this.clock * 10);
      this.halo.ellipse(0, -this.h * 0.45, this.hw * 1.35 * pulse, this.h * 0.75 * pulse).fill({ color: 0xfff3a0, alpha: 0.6 });
    }
  }

  private drawFace() {
    this.wasSinging = this.singing > 0;
    const { hw, h } = this;
    const f = this.face.clear();
    const eyeY = -h * 0.5;
    const ex = hw * 0.32;
    const r = hw * 0.15;
    if (this.wasSinging) {
      // Eyes squeezed happy, mouth wide open.
      for (const s of [-1, 1]) {
        f.moveTo(s * ex - r, eyeY + r * 0.3)
          .quadraticCurveTo(s * ex, eyeY - r, s * ex + r, eyeY + r * 0.3)
          .stroke({ width: 5, color: ink, cap: 'round' });
      }
      f.ellipse(0, -h * 0.27, hw * 0.16, h * 0.12).fill(MOUTH);
      f.ellipse(0, -h * 0.21, hw * 0.1, h * 0.04).fill(cheek);
    } else {
      for (const s of [-1, 1]) f.circle(s * ex, eyeY, r).fill(0xffffff);
      for (const s of [-1, 1]) f.circle(s * ex + r * 0.15, eyeY + r * 0.2, r * 0.6).fill(ink);
      for (const s of [-1, 1]) f.circle(s * ex + r * 0.4, eyeY - r * 0.15, r * 0.2).fill(0xffffff);
      f.moveTo(-hw * 0.14, -h * 0.3)
        .quadraticCurveTo(0, -h * 0.2, hw * 0.14, -h * 0.3)
        .stroke({ width: 5, color: ink, cap: 'round' });
    }
    for (const s of [-1, 1]) f.ellipse(s * hw * 0.55, -h * 0.34, hw * 0.12, h * 0.05).fill({ color: cheek, alpha: 0.55 });
  }
}
