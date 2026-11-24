import { Container, Graphics, Rectangle } from 'pixi.js';
import { ink, swatch, wood, type ColorName } from '../../art/palette';
import type { Lane, Light, Road, Vehicle } from './logic';

export const LAMP: Record<Light, number> = {
  red: swatch.red.fill,
  yellow: swatch.yellow.fill,
  green: swatch.green.fill,
};
export const CAR_COLORS: ColorName[] = ['blue', 'pink', 'orange', 'purple', 'teal', 'red'];

/** A three-lamp traffic light on a pole; the lit lamp is bright, the others dim. */
export class TrafficLight extends Container {
  light: Light = 'red';
  /** Level 10's light has only a red and a green lamp, with the same sizes and spacing as the three-lamp one. */
  twoLamp = false;
  private readonly box = new Graphics();
  constructor(pole = true) {
    super();
    if (pole) this.addChild(new Graphics().rect(-8, 0, 16, 150).fill(0x6b778a));
    this.addChild(this.box);
    this.hitArea = new Rectangle(-60, -170, 120, 180);
    this.set('red');
  }
  set(l: Light) {
    this.light = l;
    const top = this.twoLamp ? -112 : -164;
    const lamps: Light[] = this.twoLamp ? ['red', 'green'] : ['red', 'yellow', 'green'];
    const g = this.box
      .clear()
      .roundRect(-44, top, 88, this.twoLamp ? 116 : 168, 22)
      .fill(ink);
    lamps.forEach((x, i) =>
      g.circle(0, top + 30 + i * 52, 22).fill({ color: LAMP[x], alpha: x === l ? 1 : 0.22 }),
    );
  }
}

/** A car (or another vehicle): its drawing (`art`, which bounces, squashes and idles inside the car's place) and its headlight. */
export type Car = Container & { art: Container; lamp: Graphics; kind: Vehicle; road?: Road; lane?: Lane };

/** The windshield face every vehicle shares: two eyes and a smile around (x, y). */
function face(g: Graphics, x: number, y: number) {
  g.circle(x - 12, y, 5)
    .circle(x + 12, y, 5)
    .fill(ink);
  g.moveTo(x - 10, y + 10)
    .quadraticCurveTo(x, y + 16, x + 10, y + 10)
    .stroke({ width: 3, color: ink, cap: 'round' });
}

function wheel(g: Graphics, x: number, y: number, r: number) {
  g.circle(x, y, r)
    .fill(ink)
    .circle(x, y, r * 0.4)
    .fill(0xdfe3ea);
}

const GLASS = 0xdff3ff;

/**
 * The six vehicles, drawn inside the same 160-wide box (x −80…80, y −90…30) so the line-up, the hit area and the
 * north–south queue fit every kind; the headlamp sits at the front, drawn about its own centre so its blink stays put.
 */
const DRAW: Record<Vehicle, (g: Graphics, sw: (typeof swatch)[ColorName]) => [number, number]> = {
  car: (g, sw) => {
    g.roundRect(-70, -40, 140, 50, 18).fill(sw.fill).stroke({ width: 5, color: sw.line });
    g.roundRect(-40, -78, 76, 44, 16).fill(sw.fill).stroke({ width: 5, color: sw.line });
    g.roundRect(-30, -70, 56, 30, 10).fill(GLASS);
    face(g, -2, -56);
    for (const x of [-40, 40]) wheel(g, x, 12, 18);
    return [66, -20];
  },
  bus: (g, sw) => {
    g.roundRect(-76, -84, 152, 94, 18).fill(sw.fill).stroke({ width: 5, color: sw.line });
    for (const x of [-64, -26]) g.roundRect(x, -72, 30, 28, 8).fill(GLASS);
    g.roundRect(14, -72, 52, 34, 10).fill(GLASS);
    face(g, 40, -58);
    g.rect(-72, -26, 144, 8).fill(sw.line);
    for (const x of [-46, 46]) wheel(g, x, 12, 17);
    return [70, -8];
  },
  bike: (g, sw) => {
    for (const x of [-46, 46]) g.circle(x, 8, 22).stroke({ width: 7, color: ink }).circle(x, 8, 5).fill(ink);
    g.moveTo(-46, 8)
      .lineTo(-10, -26)
      .lineTo(30, -26)
      .lineTo(46, 8)
      .moveTo(-10, -26)
      .lineTo(2, 8)
      .lineTo(-46, 8)
      .stroke({ width: 7, color: sw.line, cap: 'round', join: 'round' });
    g.moveTo(30, -26).lineTo(38, -44).stroke({ width: 7, color: ink, cap: 'round' });
    // The rider leans to the handlebars, with the shared face and a helmet in the bike's colour.
    g.roundRect(-30, -58, 32, 40, 12).fill(sw.fill).stroke({ width: 4, color: sw.line });
    g.moveTo(-2, -48).lineTo(36, -44).stroke({ width: 8, color: sw.fill, cap: 'round' });
    g.circle(-10, -70, 20).fill(0xf6d2b0);
    g.moveTo(-31, -72).arc(-10, -72, 21, Math.PI, 0).fill(sw.line);
    face(g, -8, -66);
    return [42, -40];
  },
  tractor: (g, sw) => {
    g.roundRect(-8, -34, 76, 38, 10).fill(sw.fill).stroke({ width: 5, color: sw.line });
    g.rect(36, -60, 9, 28).fill(ink);
    g.roundRect(-64, -88, 60, 76, 12).fill(sw.fill).stroke({ width: 5, color: sw.line });
    g.roundRect(-56, -80, 44, 36, 10).fill(GLASS);
    face(g, -34, -64);
    wheel(g, -36, 0, 30);
    wheel(g, 48, 14, 16);
    return [66, -20];
  },
  van: (g, sw) => {
    g.roundRect(-74, -78, 148, 88, 20).fill(0xfff7ef).stroke({ width: 5, color: sw.line });
    // A stripe awning over the serving hatch, and an ice-cream cone painted on the side.
    g.roundRect(-62, -58, 64, 36, 8).fill(sw.light);
    for (let i = 0; i < 4; i++) g.rect(-62 + i * 16, -66, 16, 10).fill(i % 2 ? 0xffffff : sw.fill);
    g.poly([-38, -24, -26, -24, -32, -6]).fill(wood.fill);
    g.circle(-32, -30, 9).fill(sw.fill);
    g.roundRect(16, -68, 48, 34, 10).fill(GLASS);
    face(g, 40, -54);
    g.rect(-70, -14, 140, 8).fill(sw.fill);
    for (const x of [-44, 44]) wheel(g, x, 12, 17);
    return [70, -14];
  },
  digger: (g, sw) => {
    // The arm reaches up and forward, the bucket resting low at the front.
    g.moveTo(-8, -50)
      .lineTo(40, -76)
      .lineTo(62, -30)
      .stroke({ width: 13, color: sw.line, cap: 'round', join: 'round' });
    g.poly([50, -32, 78, -30, 74, -4, 54, -8]).fill(ink);
    g.roundRect(-70, -4, 112, 34, 17).fill(ink);
    for (const x of [-52, -24, 4, 26]) g.circle(x, 13, 8).fill(0xdfe3ea);
    g.roundRect(-64, -84, 64, 80, 12).fill(sw.fill).stroke({ width: 5, color: sw.line });
    g.roundRect(-56, -76, 48, 36, 10).fill(GLASS);
    face(g, -32, -60);
    return [-4, -22];
  },
};

/** A vehicle with a face on its windshield (or on its rider). */
export function carArt(color: ColorName, kind: Vehicle = 'car'): Car {
  const c = new Container() as Car;
  const art = new Container();
  const g = new Graphics();
  const [lx, ly] = DRAW[kind](g, swatch[color]);
  const lamp = new Graphics().circle(0, 0, 7).fill(0xffffff);
  lamp.position.set(lx, ly);
  lamp.tint = swatch.yellow.light;
  art.addChild(g, lamp);
  c.addChild(art);
  c.art = art;
  c.lamp = lamp;
  c.kind = kind;
  return c;
}
