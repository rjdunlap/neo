import { Container, Graphics } from 'pixi.js';
import { swatch } from '../palette';
import { flower } from '../shapes';
import { stroke, type Accessory, type AccessoryKind } from './creature';

/**
 * The two RW02 accessories. Each is drawn for the slot's width and centred on the slot's origin,
 * so one drawing fits a squat neck and a slim one. Only the scarf's tails move.
 */
class Worn extends Container implements Accessory {
  private clock = Math.random() * 10;
  constructor(
    readonly kind: AccessoryKind,
    private readonly tails: Container[] = [],
  ) {
    super();
  }

  sway(dt: number, excite: number) {
    this.clock += dt;
    this.tails.forEach((t, i) => {
      t.rotation = 0.1 * Math.sin(this.clock * 2.4 + i * 1.3) + excite * (0.5 + 0.25 * i) * Math.sin(this.clock * 14 + i);
    });
  }
}

/** A striped scarf: a band across the neck, a knot on one side and two hanging tails. */
export function makeScarf(width: number): Accessory {
  const s = swatch.red;
  const hw = width / 2;
  const h = Math.max(18, width * 0.16);
  const band = new Graphics();
  band.roundRect(-hw, -h / 2, width, h, h / 2).fill(s.fill).stroke(stroke(s.line, 5));
  for (let x = -hw + h; x < hw - h / 2; x += h * 1.1) band.rect(x, -h / 2 + 3, h * 0.35, h - 6).fill(swatch.orange.fill);
  const knotX = hw * 0.55;
  const tails: Container[] = [];
  for (const [dx, len, rot] of [
    [-h * 0.25, h * 2.4, 0.18],
    [h * 0.35, h * 1.9, -0.12],
  ] as const) {
    const t = new Container();
    t.position.set(knotX + dx, h * 0.2);
    const g = new Graphics();
    g.roundRect(-h * 0.4, 0, h * 0.8, len, h * 0.3).fill(s.fill).stroke(stroke(s.line, 5));
    g.rect(-h * 0.4 + 3, len - h * 0.5, h * 0.8 - 6, h * 0.22).fill(swatch.orange.fill);
    g.rotation = rot;
    t.addChild(g);
    tails.push(t);
  }
  const knot = new Graphics().circle(knotX, 0, h * 0.62).fill(s.fill).stroke(stroke(s.line, 5));
  const w = new Worn('scarf', tails);
  w.addChild(...tails, band, knot);
  return w;
}

/** A ring of flowers resting on the head; its centre stays open so a sprout or ears show through. */
export function makeCrown(width: number): Accessory {
  const hw = width / 2;
  const g = new Graphics();
  g.ellipse(0, 0, hw, hw * 0.22).stroke(stroke(swatch.green.line, 7));
  const w = new Worn('crown');
  w.addChild(g);
  const colors = [swatch.pink, swatch.yellow, swatch.purple, swatch.yellow, swatch.pink];
  colors.forEach((c, i) => {
    const a = Math.PI * (0.1 + (0.8 * i) / (colors.length - 1));
    const f = flower(new Graphics(), Math.max(11, width * 0.12), c.fill, c.line);
    f.position.set(-Math.cos(a) * hw, Math.sin(a) * hw * 0.22);
    w.addChild(f);
  });
  return w;
}

export const makeAccessory = (kind: AccessoryKind, width: number): Accessory => (kind === 'scarf' ? makeScarf(width) : makeCrown(width));
