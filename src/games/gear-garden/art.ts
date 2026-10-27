import { Container, Graphics } from 'pixi.js';
import { cream, ink, swatch, wood } from '../../art/palette';
import { BLOOM_TURNS, PITCH, TEETH, TIP, type FlowerColor, type FlowerKind } from './logic';

const stroke = (color: number, width = 5) => ({ width, color, join: 'round' as const, cap: 'round' as const });

/** The gear colours, by role: the handle's gear, the idler and the loose gear, and the flower's. */
export const GEAR_COLORS = { input: 'blue', idler: 'teal', loose: 'orange', output: 'green' } as const;

/** One gear of pitch radius r with 12 rounded teeth, centred on (0, 0); tooth 0 points along +x. */
export function gearArt(r: number, color: keyof typeof swatch): Graphics {
  const sw = swatch[color];
  const g = new Graphics();
  const pts: number[] = [];
  const root = 0.86 * r;
  const tip = TIP * r;
  for (let k = 0; k < TEETH; k++) {
    const a = k * PITCH;
    for (const [da, rr] of [[-0.5, root], [-0.28, tip], [0.28, tip], [0.5, root]] as const) {
      const t = a + da * PITCH;
      pts.push(Math.cos(t) * rr, Math.sin(t) * rr);
    }
  }
  g.poly(pts).fill(sw.fill).stroke(stroke(sw.line, Math.max(3, r * 0.06)));
  g.circle(0, 0, r * 0.55).fill(sw.light).stroke(stroke(sw.line, 3));
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2 + Math.PI / 4;
    g.circle(Math.cos(a) * r * 0.32, Math.sin(a) * r * 0.32, r * 0.08).fill(sw.line);
  }
  g.circle(0, 0, r * 0.14).fill(wood.line);
  return g;
}

/** The handle: a spoke out to a big knob, riding on the input gear. */
export function handleArt(r: number): Graphics {
  return new Graphics()
    .moveTo(0, 0).lineTo(r * 0.62, 0).stroke(stroke(wood.line, r * 0.16))
    .circle(r * 0.62, 0, r * 0.24).fill(swatch.red.fill).stroke(stroke(swatch.red.line, 4))
    .circle(r * 0.56, -r * 0.06, r * 0.07).fill(0xffffff);
}

/** The flower on the output's axle, opening one ring of petals per quarter turn (`open` 0–4). */
export function flowerArt(kind: FlowerKind, color: FlowerColor, r: number, open: number): Container {
  const c = new Container();
  const sw = swatch[kind === 'sunflower' ? 'yellow' : kind === 'daisy' ? 'white' : color];
  const g = new Graphics();
  const s = r * 0.62;
  const rings = Math.max(0, Math.min(BLOOM_TURNS, open));
  if (rings === 0) {
    g.ellipse(0, 0, s * 0.42, s * 0.55).fill(swatch.green.fill).stroke(stroke(swatch.green.line, 4));
    g.ellipse(0, -s * 0.15, s * 0.26, s * 0.3).fill(sw.fill);
  }
  for (let ring = rings; ring >= 1; ring--) {
    const n = kind === 'tulip' ? 5 : kind === 'daisy' ? 10 : 12;
    const len = s * (0.35 + 0.17 * ring);
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + ring * 0.3;
      const cx = Math.cos(a) * len * 0.55;
      const cy = Math.sin(a) * len * 0.55;
      const petal = new Graphics().ellipse(0, 0, len * 0.5, kind === 'tulip' ? len * 0.36 : len * 0.2)
        .fill(ring % 2 ? sw.fill : sw.light).stroke(stroke(sw.line, 3));
      petal.position.set(cx, cy);
      petal.rotation = a;
      c.addChild(petal);
    }
  }
  c.addChild(g);
  if (rings > 0) {
    const centre = kind === 'sunflower' ? 0x8f6142 : kind === 'daisy' ? swatch.yellow.fill : swatch.yellow.light;
    c.addChild(new Graphics().circle(0, 0, s * 0.3).fill(centre).stroke(stroke(ink, 3)).circle(-s * 0.08, -s * 0.08, s * 0.07).fill(0xffffff));
  }
  return c;
}

/** A curved arrow round a gear showing which way it just turned (+1 clockwise). */
export function arrowArt(r: number, dir: 1 | -1, color: number): Graphics {
  const g = new Graphics();
  const rr = r * 1.38;
  const a0 = -Math.PI * 0.75;
  const a1 = -Math.PI * 0.25;
  const [from, to] = dir === 1 ? [a0, a1] : [a1, a0];
  g.arc(0, 0, rr, Math.min(from, to), Math.max(from, to)).stroke(stroke(color, Math.max(8, r * 0.12)));
  const tx = Math.cos(to) * rr;
  const ty = Math.sin(to) * rr;
  // The head points along the direction of travel.
  const tang = to + (dir === 1 ? Math.PI / 2 : -Math.PI / 2);
  const hs = Math.max(18, r * 0.26);
  g.poly([
    tx + Math.cos(tang) * hs, ty + Math.sin(tang) * hs,
    tx + Math.cos(tang + 2.4) * hs, ty + Math.sin(tang + 2.4) * hs,
    tx + Math.cos(tang - 2.4) * hs, ty + Math.sin(tang - 2.4) * hs,
  ]).fill(color);
  return g;
}

/** The wooden machine face behind the gears. */
export function panelArt(w: number, h: number): Graphics {
  return new Graphics()
    .roundRect(-w / 2, -h / 2 + 8, w, h, 30).fill(wood.line)
    .roundRect(-w / 2, -h / 2, w, h, 30).fill(wood.light).stroke(stroke(wood.line, 6));
}

/** The tray the loose gear rests in. */
export function trayArt(s: number): Graphics {
  return new Graphics()
    .roundRect(-s / 2, -s / 2 + 6, s, s, 26).fill(wood.line)
    .roundRect(-s / 2, -s / 2, s, s, 26).fill(cream).stroke(stroke(wood.line, 5));
}

/** An empty socket: a peg in a dashed ring the size of a gear. */
export function socketArt(r: number): Graphics {
  const g = new Graphics();
  const n = 20;
  for (let k = 0; k < n; k += 1) {
    const a = (k / n) * Math.PI * 2;
    g.moveTo(Math.cos(a) * r, Math.sin(a) * r).arc(0, 0, r, a, a + Math.PI / n);
  }
  g.stroke(stroke(wood.line, 5));
  g.circle(0, 0, r * 0.16).fill(wood.line);
  return g;
}

/** The round Turn-back button: a curved arrow anticlockwise. */
export function backArt(s: number): Container {
  const c = new Container();
  c.addChild(new Graphics().circle(0, 4, s / 2).fill(swatch.purple.line).circle(0, 0, s / 2).fill(swatch.purple.fill).stroke(stroke(swatch.purple.line, 5)));
  const arrow = arrowArt(s * 0.24, -1, 0xffffff);
  arrow.position.set(0, s * 0.14);
  c.addChild(arrow);
  return c;
}

/** A small picture of a machine, for the level-3 panels and the other-machine card. */
export function miniMachine(sockets: readonly { x: number; y: number; role: string }[], flower: FlowerKind, color: FlowerColor, r: number): Container {
  const c = new Container();
  for (const s of sockets) {
    const node = s.role === 'gap' ? socketArt(r) : gearArt(r, GEAR_COLORS[s.role as 'input' | 'idler' | 'output']);
    node.position.set(s.x * r, s.y * r);
    c.addChild(node);
    if (s.role === 'output') {
      const f = flowerArt(flower, color, r, 2);
      f.position.copyFrom(node.position);
      c.addChild(f);
    }
    if (s.role === 'input') {
      const h = handleArt(r);
      h.position.copyFrom(node.position);
      c.addChild(h);
    }
  }
  const b = c.getLocalBounds();
  c.pivot.set(b.x + b.width / 2, b.y + b.height / 2);
  return c;
}

/** Two meshed gears with a tulip on one: the hub icon and the sticker's base. */
export function gearPair(r: number, open = BLOOM_TURNS, color: FlowerColor = 'pink', kind: FlowerKind = 'tulip'): Container {
  const c = new Container();
  const a = gearArt(r, 'blue');
  a.position.set(-r, 0);
  const b = gearArt(r, 'green');
  b.position.set(r, 0);
  b.rotation = PITCH / 2;
  const h = handleArt(r);
  h.position.copyFrom(a.position);
  h.rotation = -0.6;
  const f = flowerArt(kind, color, r, open);
  f.position.copyFrom(b.position);
  c.addChild(a, b, h, f);
  return c;
}
