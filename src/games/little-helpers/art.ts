import { Container, Graphics } from 'pixi.js';
import { swatch, wood, type ColorName } from '../../art/palette';
import { FRUIT_FOR, prop, type PropKind } from '../../art/props';
import type { BackdropStyle } from '../../art/scenery';
import type { View } from '../../engine/view';
import type { CarryKind, Place } from './logic';

const line = (color: number, width = 6) => ({ width, color, join: 'round' as const, cap: 'round' as const });
const STEM = 0x8f6142;

/** The colour each fruit is drawn in (props draw a fruit in its one obvious colour). */
const FRUIT_COLOR: Partial<Record<CarryKind, ColorName>> = Object.fromEntries(
  Object.entries(FRUIT_FOR).map(([color, kind]) => [kind, color]),
) as Partial<Record<CarryKind, ColorName>>;

/** One thing to carry, about 100 units across and centred on (0, 0) like the props, so need-based scaling fits all. */
export function carryArt(kind: CarryKind): Container {
  const fruit = FRUIT_COLOR[kind];
  if (fruit) return prop(kind as PropKind, fruit);
  const c = new Container();
  const g = new Graphics();
  switch (kind) {
    case 'pumpkin': {
      const o = swatch.orange;
      for (const [x, rx] of [[-26, 26], [26, 26], [-12, 26], [12, 26], [0, 24]] as const) g.ellipse(x, 4, rx, 40).fill(o.fill).stroke(line(o.line, 5));
      g.moveTo(0, -34).quadraticCurveTo(4, -50, 14, -56).stroke(line(0x4a9a35, 8));
      g.ellipse(-30, -8, 6, 12).fill({ color: 0xffffff, alpha: 0.4 });
      break;
    }
    case 'watermelon': {
      const gr = swatch.green;
      g.ellipse(0, 0, 60, 40).fill(gr.fill).stroke(line(gr.line));
      for (const x of [-34, -12, 12, 34]) g.moveTo(x, -38 + Math.abs(x) * 0.3).quadraticCurveTo(x * 1.15, 0, x, 38 - Math.abs(x) * 0.3);
      g.stroke({ width: 6, color: gr.line, alpha: 0.6 });
      g.ellipse(-28, -16, 10, 6).fill({ color: 0xffffff, alpha: 0.4 });
      break;
    }
    case 'acorn': {
      const b = swatch.brown;
      g.moveTo(-30, -6).quadraticCurveTo(-32, 40, 0, 52).quadraticCurveTo(32, 40, 30, -6).closePath().fill(b.light).stroke(line(b.line));
      g.ellipse(0, -10, 40, 22).fill(b.fill).stroke(line(b.line));
      for (const x of [-22, -8, 8, 22]) g.circle(x, -12, 3).fill(b.line);
      g.moveTo(0, -30).lineTo(4, -46).stroke(line(STEM, 7));
      break;
    }
    case 'pinecone': {
      const b = swatch.brown;
      for (let row = 0; row < 5; row++) {
        const y = -36 + row * 18;
        const half = 14 + Math.sin(((row + 0.5) / 5) * Math.PI) * 22;
        for (let k = -1; k <= 1; k++) g.ellipse(k * half * 0.6, y, half * 0.45, 12).fill(row % 2 ? b.fill : b.light).stroke(line(b.line, 4));
      }
      g.moveTo(0, -46).lineTo(0, -58).stroke(line(STEM, 6));
      break;
    }
    case 'boat': {
      const r = swatch.red;
      g.moveTo(-56, 10).lineTo(56, 10).lineTo(38, 42).lineTo(-38, 42).closePath().fill(r.fill).stroke(line(r.line));
      g.rect(-50, 18, 100, 6).fill(0xffffff);
      g.moveTo(0, 10).lineTo(0, -50).stroke(line(wood.line, 5));
      g.poly([4, -46, 4, 2, 40, 2]).fill(0xffffff).stroke(line(swatch.blue.line, 4));
      g.poly([-4, -36, -4, 2, -30, 2]).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 4));
      break;
    }
  }
  c.addChild(g);
  return c;
}

/** Each place's sky and ground. */
export const PLACE_BACKDROP: Record<Place, BackdropStyle> = {
  orchard: { sky: [0x8fd3f7, 0xe9f7ff], hills: [0xc8ecb0, 0x9edb86], horizon: 0.5, clouds: 2, sun: true, seed: 41 },
  beach: { sky: [0x7fcdf5, 0xe6f8ff], hills: [0x6fc1e8, 0xf3dcaa], horizon: 0.52, clouds: 2, sun: true, seed: 12 },
  woods: { sky: [0xa6d8ef, 0xeaf6ea], hills: [0x8ec78a, 0x6fb06a], horizon: 0.5, clouds: 1, sun: false, seed: 23 },
};

/** Far scenery on the horizon, kept above the field where she plays: fruit trees, waves and a sail, or pines and trunks. */
export function drawScenery(g: Graphics, place: Place, v: View, groundY: number) {
  g.clear();
  const top = groundY - 40;
  if (place === 'orchard') {
    for (let x = 90, i = 0; x < v.w; x += 190, i++) {
      const y = top + (i % 2) * 14;
      g.rect(x - 7, y - 10, 14, 50).fill(wood.fill);
      g.circle(x, y - 34, 44).fill(0x7fc46a);
      for (const [dx, dy] of [[-18, -40], [14, -24], [8, -56], [-6, -18]]) g.circle(x + dx, y + dy, 7).fill(swatch.red.fill);
    }
  } else if (place === 'beach') {
    for (let x = 0; x < v.w; x += 70) g.moveTo(x, groundY - 70).quadraticCurveTo(x + 18, groundY - 80, x + 35, groundY - 70).stroke({ width: 4, color: 0xffffff, alpha: 0.7 });
    const sx = v.w * 0.78;
    g.moveTo(sx - 40, groundY - 100).lineTo(sx + 40, groundY - 100).lineTo(sx + 28, groundY - 86).lineTo(sx - 28, groundY - 86).closePath().fill(wood.fill);
    g.poly([sx, groundY - 160, sx, groundY - 104, sx + 36, groundY - 104]).fill(0xffffff);
  } else {
    for (let x = 60, i = 0; x < v.w; x += 150, i++) {
      const y = top + (i % 3) * 10;
      if (i % 2) {
        g.rect(x - 10, y - 90, 20, 130).fill(0x8a6a4a);
        g.circle(x, y - 100, 40).fill(0x4f8f4a);
      } else {
        g.rect(x - 6, y, 12, 40).fill(0x8a6a4a);
        g.poly([x - 46, y + 4, x + 46, y + 4, x, y - 110]).fill(0x3f7f50);
      }
    }
  }
  g.eventMode = 'none';
}

/** Where carried things go, its rim 180 units wide (`BASKET_HALF` each side) centred at (x, y − 40). */
export function drawDestination(g: Graphics, place: Place, x: number, y: number) {
  g.clear();
  if (place === 'beach') {
    // A rowing boat pulled up on the sand.
    const r = swatch.blue;
    g.moveTo(x - 110, y - 40).lineTo(x + 110, y - 40).quadraticCurveTo(x + 96, y + 46, x, y + 50).quadraticCurveTo(x - 96, y + 46, x - 110, y - 40).closePath().fill(r.fill).stroke(line(r.line));
    g.rect(x - 100, y - 30, 200, 10).fill(0xffffff);
    g.moveTo(x - 40, y - 40).lineTo(x - 40, y + 30).moveTo(x + 40, y - 40).lineTo(x + 40, y + 30).stroke({ width: 4, color: r.line, alpha: 0.5 });
  } else if (place === 'woods') {
    // A metal bucket with a handle.
    g.moveTo(x - 92, y - 40).lineTo(x + 92, y - 40).lineTo(x + 68, y + 50).lineTo(x - 68, y + 50).closePath().fill(0xc9d3dc).stroke(line(0x8c9aa8));
    for (const yy of [y - 10, y + 22]) g.moveTo(x - 86 + (yy - y + 40) * 0.25, yy).lineTo(x + 86 - (yy - y + 40) * 0.25, yy).stroke({ width: 4, color: 0x8c9aa8, alpha: 0.6 });
    g.moveTo(x - 92, y - 40).quadraticCurveTo(x, y - 150, x + 92, y - 40).stroke({ width: 5, color: 0x8c9aa8 });
  } else {
    g.moveTo(x - 90, y - 40).lineTo(x + 90, y - 40).lineTo(x + 70, y + 50).lineTo(x - 70, y + 50).closePath().fill(wood.fill).stroke({ width: 6, color: wood.line, join: 'round' });
    for (let yy = y - 20; yy < y + 50; yy += 20) g.moveTo(x - 84, yy).lineTo(x + 84, yy).stroke({ width: 3, color: wood.line, alpha: 0.5 });
  }
}
