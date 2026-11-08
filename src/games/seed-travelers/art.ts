import { Container, Graphics } from 'pixi.js';
import { ink, swatch, wood } from '../../art/palette';

const SKY = 0xbfe6ff;
const SKY_LOW = 0xe4f4ff;
const MEADOW = 0x9fd88a;
const MEADOW_LINE = 0x6fb35c;
const EARTH = 0x8a5a3c;
const EARTH_DARK = 0x6b4329;
const FLUFF = 0xffffff;
const STALK = 0xb08a5a;
const BURR = 0x9c7a3c;
const BURR_LINE = 0x6b5226;
const HOOK = 0x5e4620;

/** Sky, meadow and the ground line. */
export function sceneArt(w: number, h: number, ground: number): Graphics {
  const g = new Graphics();
  g.rect(0, 0, w, ground).fill(SKY);
  g.rect(0, ground * 0.55, w, ground * 0.45).fill({ color: SKY_LOW, alpha: 0.7 });
  g.circle(w - 130, 120, 54).fill({ color: 0xfff1a8, alpha: 0.9 });
  for (const [x, y, s] of [
    [w * 0.42, 150, 1],
    [w * 0.7, 230, 0.8],
  ] as const) {
    g.ellipse(x, y, 70 * s, 26 * s).fill({ color: 0xffffff, alpha: 0.85 });
    g.ellipse(x + 40 * s, y - 14 * s, 44 * s, 24 * s).fill({ color: 0xffffff, alpha: 0.85 });
  }
  g.rect(0, ground, w, h - ground).fill(MEADOW);
  g.moveTo(0, ground).lineTo(w, ground).stroke({ width: 5, color: MEADOW_LINE });
  return g;
}

/** The grassy hillock the seeds start on. */
export function hillArt(x: number, ground: number, wide: number): Graphics {
  const g = new Graphics();
  g.ellipse(x, ground + 6, wide / 2, 52)
    .fill(MEADOW)
    .stroke({ width: 5, color: MEADOW_LINE });
  for (let i = -3; i <= 3; i++) {
    const bx = x + i * (wide / 8);
    g.moveTo(bx - 6, ground - 30 + Math.abs(i) * 6)
      .lineTo(bx, ground - 46 + Math.abs(i) * 6)
      .lineTo(bx + 6, ground - 30 + Math.abs(i) * 6)
      .stroke({ width: 3, color: MEADOW_LINE, cap: 'round' });
  }
  return g;
}

/** The low wooden tray of soft earth, with a tuft of grass at its left end (where the critter brushes the burr off). */
export function trayArt(): Graphics {
  const g = new Graphics();
  g.roundRect(-120, -40, 240, 56, 12).fill(wood.fill).stroke({ width: 5, color: wood.line });
  g.roundRect(-108, -46, 216, 20, 10).fill(EARTH).stroke({ width: 3, color: EARTH_DARK });
  for (let i = 0; i < 5; i++) g.circle(-80 + i * 40, -38, 3).fill({ color: EARTH_DARK, alpha: 0.6 });
  for (const dx of [-14, -6, 2, 10])
    g.moveTo(-130, -10)
      .quadraticCurveTo(-130 + dx, -50, -128 + dx * 2, -70)
      .stroke({ width: 5, color: MEADOW_LINE, cap: 'round' });
  return g;
}

/** The fluffy seed: a little seed on a stalk under a dandelion-like parasol of fluff, about 90 across. */
export function plumeArt(): Container {
  const c = new Container();
  const g = new Graphics();
  g.moveTo(0, 12).lineTo(0, -26).stroke({ width: 4, color: STALK, cap: 'round' });
  for (let i = 0; i < 9; i++) {
    const a = Math.PI + (i / 8) * Math.PI;
    const tx = Math.cos(a) * 44;
    const ty = -26 + Math.sin(a) * 30;
    g.moveTo(0, -26).lineTo(tx, ty).stroke({ width: 3, color: 0xdfe6ee, cap: 'round' });
    g.circle(tx, ty, 9).fill(FLUFF).stroke({ width: 2, color: 0xc9d3de });
  }
  g.ellipse(0, 22, 9, 14).fill(BURR).stroke({ width: 3, color: BURR_LINE });
  c.addChild(g);
  return c;
}

/** The hooky seed: a round seed head covered in little hooks, about 90 across. */
export function burrArt(): Container {
  const c = new Container();
  const g = new Graphics();
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const x = Math.cos(a) * 30;
    const y = Math.sin(a) * 30;
    const x2 = Math.cos(a) * 44;
    const y2 = Math.sin(a) * 44;
    g.moveTo(x, y).lineTo(x2, y2).stroke({ width: 4, color: HOOK, cap: 'round' });
    g.arc(x2 + Math.cos(a + 1.6) * 5, y2 + Math.sin(a + 1.6) * 5, 5, a - 1.6, a + 1.6).stroke({
      width: 3,
      color: HOOK,
      cap: 'round',
    });
  }
  g.circle(0, 0, 32).fill(BURR).stroke({ width: 5, color: BURR_LINE });
  g.circle(-10, -10, 8).fill({ color: 0xffffff, alpha: 0.25 });
  c.addChild(g);
  return c;
}

/** The bellows, nozzle pointing right (toward the patch), about 150 across. */
export class BellowsArt extends Container {
  readonly body = new Container();
  private readonly puff = new Graphics();

  constructor() {
    super();
    const g = new Graphics();
    g.poly([-70, -46, 20, -26, 20, 26, -70, 46])
      .fill(wood.fill)
      .stroke({ width: 5, color: wood.line, join: 'round' });
    g.poly([-60, -20, 10, -12, 10, 12, -60, 20])
      .fill(swatch.red.fill)
      .stroke({ width: 3, color: swatch.red.line, join: 'round' });
    g.poly([20, -12, 66, -5, 66, 5, 20, 12])
      .fill(0xb7b7c2)
      .stroke({ width: 4, color: 0x7b7b8a, join: 'round' });
    g.roundRect(-92, -12, 26, 24, 8).fill(wood.light).stroke({ width: 3, color: wood.line });
    this.body.addChild(g);
    this.puff.alpha = 0;
    for (let i = 0; i < 3; i++)
      this.puff.circle(84 + i * 22, (i - 1) * 8, 10 + i * 4).fill({ color: 0xffffff, alpha: 0.8 });
    this.addChild(this.body, this.puff);
  }

  get puffs() {
    return this.puff;
  }
}

/** Level 1's Finish basket, about 140 across. */
export function basketArt(): Container {
  const c = new Container();
  const g = new Graphics();
  g.arc(0, -10, 46, Math.PI, 0).stroke({ width: 9, color: wood.line, cap: 'round' });
  g.roundRect(-60, -14, 120, 70, 18).fill(wood.light).stroke({ width: 5, color: wood.line });
  for (let i = 0; i < 3; i++)
    g.moveTo(-50, 4 + i * 18)
      .lineTo(50, 4 + i * 18)
      .stroke({ width: 3, color: wood.fill });
  g.circle(0, 22, 16).fill(swatch.green.fill).stroke({ width: 4, color: swatch.green.line });
  g.moveTo(-7, 22)
    .lineTo(-2, 28)
    .lineTo(8, 15)
    .stroke({ width: 4, color: 0xffffff, cap: 'round', join: 'round' });
  c.addChild(g);
  return c;
}

/** A soft ring under a chosen seed, or a glow behind a target. */
export function ringArt(r: number, color = 0xfff1a8, alpha = 0.55): Graphics {
  return new Graphics()
    .circle(0, 0, r)
    .fill({ color, alpha })
    .stroke({ width: 5, color: 0xffffff, alpha: 0.9 });
}

/** A small hill (the seed stayed) or a tray (it arrived), for the trial board. Read by picture, never by colour. */
export function boardMark(arrived: boolean, s: number): Graphics {
  const g = new Graphics();
  if (arrived) {
    g.roundRect(-s * 0.38, -s * 0.06, s * 0.76, s * 0.2, 6)
      .fill(wood.fill)
      .stroke({ width: 3, color: wood.line });
    g.roundRect(-s * 0.32, -s * 0.1, s * 0.64, s * 0.1, 5).fill(EARTH);
  } else {
    g.ellipse(0, s * 0.12, s * 0.38, s * 0.22)
      .fill(MEADOW)
      .stroke({ width: 3, color: MEADOW_LINE });
  }
  return g;
}

/** The trial board's frame: rows the plume and the burr, columns the bellows and the critter's paw. */
export function boardFrame(cell: number): Container {
  const c = new Container();
  const g = new Graphics();
  const head = cell * 0.8;
  g.roundRect(-10, -10, head + cell * 2 + 20, head + cell * 2 + 20, 18)
    .fill({ color: 0xffffff, alpha: 0.75 })
    .stroke({ width: 4, color: ink, alpha: 0.3 });
  for (let r = 0; r < 2; r++)
    for (let k = 0; k < 2; k++)
      g.roundRect(head + k * cell + 4, head + r * cell + 4, cell - 8, cell - 8, 12)
        .fill({ color: SKY_LOW })
        .stroke({ width: 3, color: ink, alpha: 0.25 });
  c.addChild(g);
  const heads: [Container, number, number, number][] = [
    [plumeArt(), head / 2, head + cell / 2, 0.5],
    [burrArt(), head / 2, head + cell * 1.5, 0.55],
    [miniBellows(), head + cell / 2, head / 2, 0.42],
    [pawArt(), head + cell * 1.5, head / 2, 0.8],
  ];
  for (const [art, x, y, s] of heads) {
    art.position.set(x, y);
    art.scale.set(s);
    c.addChild(art);
  }
  return c;
}

function miniBellows(): Container {
  const b = new BellowsArt();
  return b;
}

/** A furry paw print: stands for the critter on the board. */
function pawArt(): Graphics {
  const g = new Graphics();
  g.ellipse(0, 8, 20, 16).fill(swatch.brown.fill).stroke({ width: 3, color: swatch.brown.line });
  for (const [x, y] of [
    [-20, -14],
    [-7, -22],
    [7, -22],
    [20, -14],
  ])
    g.circle(x, y, 7).fill(swatch.brown.fill).stroke({ width: 3, color: swatch.brown.line });
  return g;
}

/** The hub icon and sticker: a plume seed drifting over a hill, sky colour given. */
export function iconArt(size: number, sky = SKY): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-size / 2, -size / 2, size, size, size * 0.18)
    .fill(sky)
    .stroke({ width: size * 0.03, color: ink, alpha: 0.5 });
  g.ellipse(0, size * 0.42, size * 0.5, size * 0.2).fill(MEADOW);
  c.addChild(g);
  const p = plumeArt();
  p.scale.set(size / 150);
  p.rotation = -0.25;
  p.position.set(-size * 0.04, -size * 0.04);
  c.addChild(p);
  return c;
}
