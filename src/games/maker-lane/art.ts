/**
 * Maker Lane's code-drawn pieces: the twenty forms a bundle takes (beginnings, middle forms and products), the sixteen
 * makers' tools, the stall awning, the beginning cards (with the cow, the hen and the factory), milk and an egg, the thought
 * bubble, the icon and the sticker. Every picture is drawn in a 100-unit box centred on (0, 0) and scaled to its size.
 * The sheep and hen are the shared ones from `src/art/animals.ts`.
 */
import { Container, Graphics } from 'pixi.js';
import { henArt, sheepArt } from '../../art/animals';
import { Critter, CRITTERS } from '../../art/critter';
import { treeArt } from '../../art/picnic';
import { cream, ink, swatch, wood } from '../../art/palette';
import type { Card, Form, Tool } from './logic';

const line = (color: number, width = 4) => ({ width, color, join: 'round' as const, cap: 'round' as const });
const WOOL = { fill: 0xfaf6ea, line: 0xb9b2a0, dirty: 0xd8ccb0 };
const WHEAT = { fill: 0xf2c75c, line: 0xb98f2a };
const CARD_BROWN = { fill: 0xc89a62, line: 0x8a6436 };

const boxed = (draw: (g: Graphics) => void, size: number): Container => {
  const c = new Container();
  const g = new Graphics();
  draw(g);
  c.addChild(g);
  c.scale.set(size / 100);
  c.eventMode = 'none';
  return c;
};

const puffs = (g: Graphics, pts: readonly [number, number, number][], fill: number, edge: number) => {
  for (const [x, y, r] of pts) g.circle(x, y, r + 2.5).fill(edge);
  for (const [x, y, r] of pts) g.circle(x, y, r).fill(fill);
};

function cottonPlant(g: Graphics) {
  g.moveTo(0, 46).lineTo(0, -10).stroke(line(swatch.green.line, 5));
  for (const [x, y] of [
    [-24, -6],
    [22, -14],
    [0, -30],
  ] as const)
    g.moveTo(0, y + 20)
      .lineTo(x, y)
      .stroke(line(swatch.green.line, 4));
  for (const [x, y] of [
    [-20, 18],
    [20, 12],
  ] as const)
    g.ellipse(x, y, 13, 7).fill(swatch.green.fill).stroke(line(swatch.green.line, 2));
  for (const [x, y] of [
    [-24, -10],
    [22, -18],
    [0, -34],
  ] as const)
    puffs(
      g,
      [
        [x - 6, y, 9],
        [x + 6, y, 9],
        [x, y - 7, 9],
      ],
      0xffffff,
      0xb9b2a0,
    );
}

function wheatStalk(g: Graphics, x: number, y: number, h: number, lean = 0) {
  g.moveTo(x, y)
    .lineTo(x + lean, y - h)
    .stroke(line(WHEAT.line, 3));
  for (let k = 0; k < 4; k++) {
    const t = y - h + k * 7;
    g.ellipse(x + lean - 4, t, 3.5, 6)
      .fill(WHEAT.fill)
      .stroke(line(WHEAT.line, 1.5));
    g.ellipse(x + lean + 4, t, 3.5, 6)
      .fill(WHEAT.fill)
      .stroke(line(WHEAT.line, 1.5));
  }
}

function wheatField(g: Graphics) {
  g.roundRect(-46, 30, 92, 16, 6).fill(swatch.brown.light).stroke(line(swatch.brown.line, 3));
  for (let k = 0; k < 7; k++) wheatStalk(g, -36 + k * 12, 34, 62 + (k % 2) * 8, (k - 3) * 1.5);
}

function sheaf(g: Graphics) {
  for (let k = -3; k <= 3; k++) wheatStalk(g, k * 3, 40, 70, k * 7);
  g.roundRect(-14, 4, 28, 10, 4).fill(swatch.orange.fill).stroke(line(swatch.orange.line, 2));
}

function grain(g: Graphics) {
  g.ellipse(0, 34, 42, 12).fill(swatch.brown.fill).stroke(line(swatch.brown.line, 3));
  g.poly([-42, 34, 42, 34, 30, -6, -30, -6]).fill(swatch.brown.light).stroke(line(swatch.brown.line, 3));
  for (let k = 0; k < 18; k++) {
    const x = -26 + (k % 6) * 10 + (k > 11 ? 5 : 0),
      y = -10 - Math.floor(k / 6) * 7;
    g.ellipse(x, y, 4.5, 3).fill(WHEAT.fill).stroke(line(WHEAT.line, 1.5));
  }
}

function sack(g: Graphics, fill: number, edge: number) {
  g.moveTo(-32, -22)
    .quadraticCurveTo(-44, 40, -30, 44)
    .lineTo(30, 44)
    .quadraticCurveTo(44, 40, 32, -22)
    .closePath()
    .fill(fill)
    .stroke(line(edge, 3.5));
  g.moveTo(-26, -24)
    .lineTo(-12, -40)
    .lineTo(0, -28)
    .lineTo(12, -40)
    .lineTo(26, -24)
    .fill(fill)
    .stroke(line(edge, 3));
  g.roundRect(-28, -28, 56, 8, 3).fill(swatch.brown.fill).stroke(line(swatch.brown.line, 2));
}

function loaf(g: Graphics) {
  g.moveTo(-44, 26)
    .quadraticCurveTo(-48, -26, 0, -28)
    .quadraticCurveTo(48, -26, 44, 26)
    .closePath()
    .fill(0xd4893f)
    .stroke(line(0x8f5420, 4));
  for (const x of [-20, 0, 20])
    g.moveTo(x - 8, -8)
      .lineTo(x + 8, -18)
      .stroke(line(0xf3c48a, 4));
  // A slice cut at the front.
  g.roundRect(30, -12, 18, 40, 6).fill(0xfbe7c6).stroke(line(0x8f5420, 3));
}

function fleece(g: Graphics, clean: boolean) {
  const fill = clean ? WOOL.fill : WOOL.dirty;
  puffs(
    g,
    [
      [-24, 6, 20],
      [0, -6, 24],
      [24, 6, 20],
      [-10, 20, 18],
      [14, 20, 18],
    ],
    fill,
    WOOL.line,
  );
  if (!clean)
    for (const [x, y] of [
      [-20, 0],
      [8, -12],
      [22, 12],
      [-4, 22],
    ] as const)
      g.circle(x, y, 3.5).fill(0x8f7a52);
  if (clean)
    for (const [x, y] of [
      [-30, -24],
      [34, -20],
    ] as const)
      g.star(x, y, 4, 7, 3).fill(swatch.blue.light);
}

function yarn(g: Graphics, color: number, edge: number) {
  g.circle(0, 0, 36).fill(color).stroke(line(edge, 4));
  for (const a of [-0.6, 0, 0.6]) g.ellipse(0, 0, 36 * Math.cos(a) * 0.9, 34).stroke(line(edge, 2));
  g.moveTo(26, 24).quadraticCurveTo(44, 40, 30, 46).stroke(line(edge, 3));
}

function scarf(g: Graphics) {
  const s = swatch.red;
  g.roundRect(-40, -34, 80, 26, 12).fill(s.fill).stroke(line(s.line, 4));
  g.roundRect(10, -16, 24, 56, 10).fill(s.fill).stroke(line(s.line, 4));
  // Chunky knit and a fringe.
  for (let k = 0; k < 5; k++)
    g.moveTo(-32 + k * 14, -28)
      .lineTo(-26 + k * 14, -14)
      .stroke(line(s.light, 3));
  for (let k = 0; k < 4; k++)
    g.moveTo(14 + k * 6, 40)
      .lineTo(14 + k * 6, 50)
      .stroke(line(s.line, 3));
}

function bolls(g: Graphics) {
  for (const [x, y] of [
    [-20, 4],
    [18, -4],
    [0, 22],
  ] as const) {
    puffs(
      g,
      [
        [x - 9, y, 13],
        [x + 9, y, 13],
        [x, y - 10, 13],
      ],
      0xffffff,
      WOOL.line,
    );
    for (const d of [-4, 4]) g.circle(x + d, y - 2, 2.5).fill(ink);
  }
}

function cleanCotton(g: Graphics) {
  puffs(
    g,
    [
      [-22, 8, 18],
      [0, -6, 22],
      [22, 8, 18],
      [0, 20, 18],
    ],
    0xffffff,
    WOOL.line,
  );
}

function thread(g: Graphics) {
  g.roundRect(-30, -40, 60, 10, 4).fill(wood.fill).stroke(line(wood.line, 3));
  g.roundRect(-30, 30, 60, 10, 4).fill(wood.fill).stroke(line(wood.line, 3));
  g.rect(-22, -30, 44, 60).fill(swatch.blue.light).stroke(line(swatch.blue.line, 3));
  for (let y = -26; y <= 26; y += 6)
    g.moveTo(-22, y)
      .lineTo(22, y + 3)
      .stroke(line(swatch.blue.line, 1.5));
}

function sock(g: Graphics) {
  const s = swatch.blue;
  g.moveTo(-12, -44)
    .lineTo(14, -44)
    .lineTo(14, 10)
    .quadraticCurveTo(14, 20, 26, 22)
    .lineTo(36, 24)
    .quadraticCurveTo(48, 30, 40, 42)
    .lineTo(-2, 42)
    .quadraticCurveTo(-14, 42, -12, 26)
    .closePath()
    .fill(s.light)
    .stroke(line(s.line, 4));
  // Thin stripes and a smooth cuff.
  for (const y of [-30, -18]) g.moveTo(-12, y).lineTo(14, y).stroke(line(s.fill, 4));
  g.roundRect(-14, -48, 30, 8, 3).fill(s.fill).stroke(line(s.line, 2));
}

function log(g: Graphics) {
  g.roundRect(-40, -16, 70, 32, 10).fill(wood.fill).stroke(line(wood.line, 4));
  g.ellipse(32, 0, 12, 16).fill(wood.light).stroke(line(wood.line, 3));
  g.ellipse(32, 0, 5, 8).stroke(line(wood.line, 2));
  for (const x of [-28, -10, 10])
    g.moveTo(x, -10)
      .lineTo(x + 8, -10)
      .stroke(line(wood.line, 2));
}

function chips(g: Graphics) {
  for (let k = 0; k < 14; k++) {
    const x = -34 + (k % 5) * 17 + (k % 2) * 4,
      y = 30 - Math.floor(k / 5) * 18 - (k % 3) * 3;
    g.poly([x - 7, y, x + 6, y - 5, x + 8, y + 4, x - 4, y + 7])
      .fill(wood.light)
      .stroke(line(wood.line, 2));
  }
}

function pulp(g: Graphics) {
  g.ellipse(0, 22, 44, 18).fill(swatch.brown.line).stroke(line(ink, 3));
  g.ellipse(0, 14, 40, 14).fill(0xe8dcc4).stroke(line(swatch.brown.line, 3));
  for (const [x, y] of [
    [-16, 12],
    [6, 8],
    [20, 16],
  ] as const)
    g.circle(x, y, 5).fill(0xd2c2a2);
  g.poly([-44, 22, -40, -4, 40, -4, 44, 22]).stroke(line(swatch.brown.line, 3));
}

function box(g: Graphics) {
  g.poly([-38, -8, 0, -22, 38, -8, 38, 34, 0, 46, -38, 34])
    .fill(CARD_BROWN.fill)
    .stroke(line(CARD_BROWN.line, 4));
  g.moveTo(-38, -8).lineTo(0, 6).lineTo(38, -8).stroke(line(CARD_BROWN.line, 3));
  g.moveTo(0, 6).lineTo(0, 46).stroke(line(CARD_BROWN.line, 3));
  // Flaps and a corrugated edge.
  g.poly([-38, -8, -46, -26, -8, -38, 0, -22]).fill(0xdab07c).stroke(line(CARD_BROWN.line, 3));
  for (let k = 0; k < 6; k++) g.circle(-34 + k * 6, -6 + k * 2.3, 2).stroke(line(CARD_BROWN.line, 1.5));
}

function treePicture(g: Graphics) {
  g.ellipse(0, 44, 36, 6).fill(swatch.green.light);
  g.roundRect(-8, -4, 16, 50, 5).fill(wood.fill).stroke(line(wood.line, 3));
  puffs(
    g,
    [
      [-20, -12, 20],
      [20, -10, 20],
      [0, -32, 24],
      [0, -6, 20],
    ],
    swatch.green.fill,
    swatch.green.line,
  );
}

/** One of the twenty forms, in a `size` box. */
export function formArt(form: Form, size = 130): Container {
  if (form === 'sheep') {
    const c = new Container();
    const s = sheepArt('white', 92);
    s.position.set(-4, 42);
    c.addChild(s);
    c.scale.set(size / 100);
    c.eventMode = 'none';
    return c;
  }
  return boxed((g) => {
    switch (form) {
      case 'fleece':
        return fleece(g, false);
      case 'cleanFleece':
        return fleece(g, true);
      case 'yarn':
        return yarn(g, WOOL.fill, WOOL.line);
      case 'scarf':
        return scarf(g);
      case 'cottonPlant':
        return cottonPlant(g);
      case 'bolls':
        return bolls(g);
      case 'cleanCotton':
        return cleanCotton(g);
      case 'thread':
        return thread(g);
      case 'sock':
        return sock(g);
      case 'wheatField':
        return wheatField(g);
      case 'sheaf':
        return sheaf(g);
      case 'grain':
        return grain(g);
      case 'flour': {
        sack(g, 0xfbf7ee, 0xb9b2a0);
        g.circle(0, 14, 10).fill(0xf2e6c8);
        return;
      }
      case 'loaf':
        return loaf(g);
      case 'tree':
        return treePicture(g);
      case 'log':
        return log(g);
      case 'chips':
        return chips(g);
      case 'pulp':
        return pulp(g);
      case 'box':
        return box(g);
    }
  }, size);
}

/** A maker's tool, in a `size` box. */
export function toolArt(tool: Tool, size = 90): Container {
  return boxed((g) => {
    const metal = { fill: 0xd6dbe4, line: 0x7d8494 };
    switch (tool) {
      case 'shears':
        for (const d of [-1, 1])
          g.poly([0, 0, d * 10, -44, d * 2, -44])
            .fill(metal.fill)
            .stroke(line(metal.line, 3));
        for (const d of [-1, 1]) g.circle(d * 14, 22, 12).stroke(line(swatch.red.fill, 6));
        g.circle(0, 2, 4).fill(metal.line);
        return;
      case 'tub':
        g.poly([-42, -14, 42, -14, 32, 36, -32, 36]).fill(wood.fill).stroke(line(wood.line, 4));
        g.ellipse(0, -14, 42, 10).fill(swatch.blue.light).stroke(line(wood.line, 3));
        for (const [x, y] of [
          [-14, -30],
          [6, -36],
          [22, -28],
        ] as const)
          g.circle(x, y, 7).stroke(line(swatch.blue.fill, 2.5));
        return;
      case 'wheel':
        g.circle(-8, -6, 34).stroke(line(wood.line, 5));
        for (let k = 0; k < 6; k++) {
          const a = (k * Math.PI) / 3;
          g.moveTo(-8, -6)
            .lineTo(-8 + 34 * Math.cos(a), -6 + 34 * Math.sin(a))
            .stroke(line(wood.line, 3));
        }
        g.moveTo(-30, 44).lineTo(-8, -6).lineTo(18, 44).stroke(line(wood.line, 5));
        g.circle(36, -26, 8).fill(WOOL.fill).stroke(line(WOOL.line, 2));
        return;
      case 'loom':
        g.rect(-40, -40, 80, 80).stroke(line(wood.line, 6));
        for (let x = -30; x <= 30; x += 10)
          g.moveTo(x, -40).lineTo(x, 40).stroke(line(swatch.purple.light, 2));
        for (let y = 0; y <= 30; y += 8) g.moveTo(-40, y).lineTo(40, y).stroke(line(swatch.red.fill, 5));
        return;
      case 'bag':
        g.moveTo(-26, -40).lineTo(20, 20).stroke(line(swatch.brown.line, 4));
        g.roundRect(-34, -6, 60, 48, 14).fill(0xe8d7b2).stroke(line(swatch.brown.line, 4));
        puffs(
          g,
          [
            [-14, -8, 9],
            [4, -10, 9],
          ],
          0xffffff,
          WOOL.line,
        );
        return;
      case 'comb':
        g.roundRect(-40, -34, 80, 18, 6).fill(wood.fill).stroke(line(wood.line, 3));
        for (let x = -34; x <= 34; x += 8) g.moveTo(x, -16).lineTo(x, 30).stroke(line(wood.line, 4));
        return;
      case 'spindle':
        g.moveTo(0, -46).lineTo(0, 46).stroke(line(wood.line, 4));
        g.ellipse(0, 28, 28, 8).fill(wood.fill).stroke(line(wood.line, 3));
        g.ellipse(0, -6, 12, 22).fill(swatch.blue.light).stroke(line(swatch.blue.line, 3));
        return;
      case 'needles':
        for (const d of [-1, 1]) {
          g.moveTo(d * -30, 40)
            .lineTo(d * 26, -40)
            .stroke(line(metal.line, 5));
          g.circle(d * -30, 40, 6).fill(swatch.orange.fill);
        }
        g.roundRect(-18, 6, 36, 22, 8).fill(swatch.blue.light).stroke(line(swatch.blue.line, 3));
        return;
      case 'sickle':
        g.roundRect(-6, 14, 12, 34, 4).fill(wood.fill).stroke(line(wood.line, 3));
        g.moveTo(0, 16)
          .quadraticCurveTo(-40, 10, -30, -30)
          .quadraticCurveTo(10, -46, 30, -20)
          .stroke(line(metal.line, 8));
        return;
      case 'flail':
        g.moveTo(-36, 44).lineTo(0, -4).stroke(line(wood.line, 6));
        g.circle(0, -4, 4).fill(ink);
        g.moveTo(4, -6).lineTo(38, -36).stroke(line(wood.line, 7));
        return;
      case 'millstone':
        g.ellipse(0, 20, 44, 16).fill(0xb9b2a8).stroke(line(0x6f6a62, 4));
        g.rect(-44, 4, 88, 16).fill(0xb9b2a8);
        g.ellipse(0, 4, 44, 16).fill(0xcfc9c0).stroke(line(0x6f6a62, 4));
        g.circle(0, 4, 6).fill(0x6f6a62);
        g.moveTo(26, 0).lineTo(26, -36).stroke(line(wood.line, 6));
        return;
      case 'oven':
        g.moveTo(-44, 40)
          .lineTo(-44, 0)
          .quadraticCurveTo(0, -60, 44, 0)
          .lineTo(44, 40)
          .closePath()
          .fill(0xd98a5a)
          .stroke(line(0x9c4f2a, 4));
        g.moveTo(-18, 40).lineTo(-18, 14).quadraticCurveTo(0, -4, 18, 14).lineTo(18, 40).fill(ink);
        g.ellipse(0, 30, 12, 6).fill(swatch.orange.fill);
        return;
      case 'saw':
        g.poly([-40, -6, 30, -14, 30, 10, -40, 10]).fill(metal.fill).stroke(line(metal.line, 3));
        for (let x = -36; x < 30; x += 8) g.poly([x, 10, x + 4, 18, x + 8, 10]).fill(metal.line);
        g.roundRect(26, -22, 20, 40, 8).fill(swatch.red.fill).stroke(line(swatch.red.line, 3));
        return;
      case 'chipperBox':
        g.roundRect(-40, -16, 80, 56, 8).fill(swatch.green.fill).stroke(line(swatch.green.line, 4));
        g.poly([-26, -16, -36, -44, 10, -44, 0, -16])
          .fill(swatch.green.light)
          .stroke(line(swatch.green.line, 3));
        for (const x of [-24, 24]) g.circle(x, 42, 8).fill(ink);
        return;
      case 'vat':
        g.poly([-40, -20, 40, -20, 34, 40, -34, 40]).fill(0xb9b2a8).stroke(line(0x6f6a62, 4));
        g.ellipse(0, -20, 40, 10).fill(0xe8dcc4).stroke(line(0x6f6a62, 3));
        g.moveTo(10, -16).lineTo(30, -50).stroke(line(wood.line, 6));
        return;
      case 'press':
        g.rect(-40, 26, 80, 14).fill(wood.fill).stroke(line(wood.line, 3));
        g.rect(-40, -44, 8, 70).fill(wood.fill).stroke(line(wood.line, 3));
        g.rect(32, -44, 8, 70).fill(wood.fill).stroke(line(wood.line, 3));
        g.rect(-32, -12, 64, 12).fill(wood.light).stroke(line(wood.line, 3));
        g.moveTo(0, -12).lineTo(0, -44).stroke(line(ink, 5));
        g.moveTo(-18, -44).lineTo(18, -44).stroke(line(ink, 5));
        g.rect(-30, 18, 60, 8).fill(CARD_BROWN.fill);
        return;
    }
  }, size);
}

/** A striped awning and counter, `w` by `h`, its top-left at (0, 0). */
export function stallArt(w: number, h: number, stripe: number): Graphics {
  const g = new Graphics();
  const awn = h * 0.2;
  g.roundRect(4, awn, 10, h * 0.62, 4)
    .fill(wood.fill)
    .stroke(line(wood.line, 3));
  g.roundRect(w - 14, awn, 10, h * 0.62, 4)
    .fill(wood.fill)
    .stroke(line(wood.line, 3));
  const n = 4,
    sw = w / n;
  for (let k = 0; k < n; k++) {
    g.moveTo(k * sw, 0)
      .lineTo((k + 1) * sw, 0)
      .lineTo((k + 1) * sw, awn)
      .quadraticCurveTo((k + 0.5) * sw, awn + 12, k * sw, awn)
      .closePath()
      .fill(k % 2 ? 0xffffff : stripe)
      .stroke(line(ink, 2));
  }
  g.roundRect(0, h * 0.78, w, h * 0.22, 8)
    .fill(wood.light)
    .stroke(line(wood.line, 4));
  return g;
}

/** Milk in a jug, or an egg: what the cow and the hen give without any maker. */
export function giftArt(kind: 'milk' | 'egg', size = 100): Container {
  return boxed((g) => {
    if (kind === 'milk') {
      g.poly([-24, -30, 24, -30, 30, 40, -30, 40]).fill(0xffffff).stroke(line(swatch.blue.line, 4));
      g.moveTo(24, -20).quadraticCurveTo(46, -10, 28, 16).stroke(line(swatch.blue.line, 5));
      g.rect(-27, 4, 54, 14).fill(swatch.blue.light);
      return;
    }
    g.ellipse(0, 6, 26, 34).fill(0xfff4dc).stroke(line(swatch.brown.line, 4));
    g.ellipse(-8, -8, 6, 10).fill(0xffffff);
  }, size);
}

/** The factory card: a building with a chimney that changes things. */
function factory(g: Graphics) {
  g.poly([-44, 40, -44, -6, -22, -22, -22, -6, 0, -22, 0, -6, 22, -22, 22, 40])
    .fill(0xb0a8c4)
    .stroke(line(0x6c6484, 4));
  g.rect(26, -40, 14, 80).fill(0x9a92ae).stroke(line(0x6c6484, 3));
  for (const [x, y, r] of [
    [34, -50, 7],
    [42, -62, 9],
  ] as const)
    g.circle(x, y, r).fill(0xeeeeee);
  for (const x of [-34, -12, 10]) g.rect(x, 10, 12, 12).fill(swatch.yellow.light).stroke(line(0x6c6484, 2));
}

/** A level-3 beginning card's picture (without its card), in a `size` box. */
export function beginningArt(card: Card, size = 150): Container {
  if (card === 'cow') {
    const c = new Container();
    const k = new Critter(CRITTERS.cow);
    k.scale.set(0.38);
    k.position.set(0, 44);
    c.addChild(k);
    c.scale.set(size / 100);
    c.eventMode = 'none';
    return c;
  }
  if (card === 'hen')
    return boxed((g) => {
      g.scale.set(1.6);
      henArt(g, 0, 26, 0xffffff);
    }, size);
  if (card === 'factory') return boxed(factory, size);
  return formArt(card, size);
}

/** A card face, `w` square, centred on (0, 0). */
export function cardArt(w: number): Graphics {
  return new Graphics()
    .roundRect(-w / 2, -w / 2, w, w, 22)
    .fill(cream)
    .stroke(line(swatch.brown.line, 5));
}

/** A thought bubble `w` by `h` with its tail down-left, its top-left at (0, 0), holding the form the maker needs. */
export function bubbleArt(form: Form, w: number, h: number): Container {
  const c = new Container();
  const g = new Graphics();
  g.ellipse(w / 2, h / 2, w / 2, h / 2)
    .fill(0xffffff)
    .stroke(line(ink, 3));
  g.circle(w * 0.18, h + 6, 8)
    .fill(0xffffff)
    .stroke(line(ink, 2.5));
  g.circle(w * 0.08, h + 20, 5)
    .fill(0xffffff)
    .stroke(line(ink, 2));
  c.addChild(g);
  const f = formArt(form, Math.min(w, h) * 0.78);
  f.position.set(w / 2, h / 2);
  c.addChild(f);
  c.eventMode = 'none';
  return c;
}

/** A small fresh tree planted where the woodcutter took a log. */
export function saplingArt(): Graphics {
  return treeArt(30, 18);
}

/** The hub icon: a stall awning over a ball of yarn. */
export function iconArt(): Container {
  const c = new Container();
  const s = stallArt(120, 110, swatch.red.fill);
  s.position.set(-60, -110);
  const y = formArt('yarn', 60);
  y.position.set(0, -50);
  c.addChild(s, y);
  return c;
}

/** The sticker: a shelf holding a scarf, a sock, a loaf and a box. */
export function stickerArt(order: readonly Form[]): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-170, 40, 340, 18, 6).fill(wood.fill).stroke(line(wood.line, 4));
  for (const x of [-150, 150])
    g.rect(x - 6, 58, 12, 50)
      .fill(wood.fill)
      .stroke(line(wood.line, 3));
  c.addChild(g);
  order.forEach((f, k) => {
    const p = formArt(f, 76);
    p.position.set(-126 + k * 84, 0);
    c.addChild(p);
  });
  return c;
}
