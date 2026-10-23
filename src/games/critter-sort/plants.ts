import { Container, Graphics } from 'pixi.js';
import { cream, ink, swatch } from '../../art/palette';
import type { Leaves, Petals } from './logic';

/** One petal colour per family, so colour is never a third difference a hoop might mean. */
export const PETAL_COLORS = [cream, swatch.pink.fill, swatch.yellow.light];
/** Pots tell two alike plants apart; they carry no meaning. */
export const POT_COLORS = [swatch.orange.fill, swatch.teal.fill, swatch.purple.fill, swatch.blue.fill, swatch.red.fill, swatch.brown.fill];

export interface PlantLook {
  leaves: Leaves;
  petals: Petals;
  petalColor: number;
  pot: number;
  /** The big plant: a wider pot and a seed-packet tag. */
  big?: boolean;
}

/** A garden flower with its feet at the origin, about 160 units tall and 120 wide. Leaf shape and petal marks carry the meaning. */
export function drawPlant(g: Graphics, look: PlantLook): Graphics {
  const potW = look.big ? 46 : 36;
  const potColor = POT_COLORS[look.pot % POT_COLORS.length];
  g.moveTo(0, -40).lineTo(0, -108).stroke({ width: 9, color: swatch.green.line, cap: 'round' });
  for (const s of [-1, 1]) {
    if (look.leaves === 'round') g.ellipse(s * 36, -74, 29, 17).fill(swatch.green.fill).stroke({ width: 4, color: swatch.green.line });
    else {
      g.moveTo(s * 6, -66).quadraticCurveTo(s * 30, -86, s * 62, -94).quadraticCurveTo(s * 42, -62, s * 6, -66).closePath()
        .fill(swatch.green.fill).stroke({ width: 4, color: swatch.green.line, join: 'round' });
    }
  }
  g.poly([-potW, -40, potW, -40, potW - 8, 0, -potW + 8, 0]).fill(potColor).stroke({ width: 4, color: ink, alpha: 0.45, join: 'round' });
  g.roundRect(-potW - 5, -48, potW * 2 + 10, 14, 6).fill(potColor).stroke({ width: 4, color: ink, alpha: 0.45 });
  const cy = -122;
  for (let i = 0; i < 5; i++) {
    const a = (i * 72 - 90) * Math.PI / 180;
    const px = Math.cos(a) * 26;
    const py = cy + Math.sin(a) * 26;
    g.circle(px, py, 18).fill(look.petalColor).stroke({ width: 3, color: swatch.white.line });
  }
  g.circle(0, cy, 14).fill(swatch.orange.fill).stroke({ width: 3, color: swatch.orange.line });
  if (look.petals === 'spotted') {
    for (let i = 0; i < 5; i++) {
      const a = (i * 72 - 90) * Math.PI / 180;
      const tx = -Math.sin(a);
      const ty = Math.cos(a);
      const cx = Math.cos(a) * 31;
      const cyy = cy + Math.sin(a) * 31;
      for (const d of [-8, 0, 8]) g.circle(cx + tx * d + Math.cos(a) * (d === 0 ? 4 : 0), cyy + ty * d + Math.sin(a) * (d === 0 ? 4 : 0), 3.6).fill(ink);
    }
  }
  if (look.big) {
    g.roundRect(potW - 14, -34, 26, 32, 5).fill(cream).stroke({ width: 3, color: swatch.brown.line });
    for (const [dx, dy] of [[-3, -14], [4, -20], [2, -9]]) g.ellipse(potW - 1 + dx, -17 + dy + 6, 3.5, 2.2).fill(swatch.brown.fill);
  }
  return g;
}

/** A little picture of a plant rule for a sign: a leaf, or a flower with or without marks. */
export function plantRuleIcon(rule: 'round' | 'pointyleaf' | 'spotted' | 'plain'): Graphics {
  const g = new Graphics();
  if (rule === 'round') g.ellipse(0, 0, 36, 22).fill(swatch.green.fill).stroke({ width: 4, color: swatch.green.line });
  else if (rule === 'pointyleaf') g.moveTo(-34, 14).quadraticCurveTo(-8, -34, 38, -24).quadraticCurveTo(14, 22, -34, 14).closePath().fill(swatch.green.fill).stroke({ width: 4, color: swatch.green.line, join: 'round' });
  else {
    for (let i = 0; i < 5; i++) {
      const a = (i * 72 - 90) * Math.PI / 180;
      const px = Math.cos(a) * 17;
      const py = Math.sin(a) * 17;
      g.circle(px, py, 12).fill(cream).stroke({ width: 3, color: swatch.white.line });
    }
    g.circle(0, 0, 8).fill(swatch.orange.fill);
    if (rule === 'spotted') {
      for (let i = 0; i < 5; i++) {
        const a = (i * 72 - 90) * Math.PI / 180;
        g.circle(Math.cos(a) * 21, Math.sin(a) * 21, 3.4).fill(ink);
      }
    }
  }
  return g;
}

/** A plant on the grass: a container with the critters' hop and cheer so the sorting code treats both alike. */
export class PlantNode extends Container {
  private readonly body = new Container();
  private hopY = 0;
  private hopV = 0;

  constructor(look: PlantLook) {
    super();
    this.body.addChild(drawPlant(new Graphics(), look));
    this.addChild(this.body);
  }

  hop(power = 1) {
    if (this.hopY < 0) return;
    this.hopV = -520 * power;
  }

  cheer() {
    this.hop(1.1);
  }

  /** Plants have no moods; this keeps the sorting code's miss reaction shared. */
  setMood(_mood?: string, _seconds?: number) {
    this.body.scale.set(1.06, 0.94);
  }

  update(dt: number) {
    this.body.scale.x += (1 - this.body.scale.x) * Math.min(1, dt * 10);
    this.body.scale.y += (1 - this.body.scale.y) * Math.min(1, dt * 10);
    if (this.hopY < 0 || this.hopV < 0) {
      this.hopV += 1900 * dt;
      this.hopY = Math.min(0, this.hopY + this.hopV * dt);
      if (this.hopY >= 0) this.hopV = 0;
      this.body.y = this.hopY;
    }
  }
}
