import { Container, Graphics } from 'pixi.js';
import { swatch } from '../../art/palette';
import { ink } from '../../art/palette';
import { label } from '../../ui/text';
import { CLUES, PICTURES, type ClueId, type PictureId } from './logic';

/** Original dream pictures, drawn on a 200 × 200 square centred on (0, 0), then scaled to `size`. */
const SCENES: ((g: Graphics, bg: number) => void)[] = [
  // moon swing: a crescent with a seat hung from it
  (g, bg) => {
    g.circle(0, -34, 50).fill(swatch.yellow.fill);
    g.circle(24, -44, 42).fill(bg);
    for (const x of [-26, 26]) g.moveTo(x, -64).lineTo(x, 46).stroke({ width: 5, color: swatch.brown.line });
    g.roundRect(-40, 44, 80, 16, 6).fill(swatch.brown.fill).stroke({ width: 4, color: swatch.brown.line });
    for (const [x, y] of [
      [-70, -70],
      [64, -56],
      [-56, 40],
    ] as [number, number][])
      g.star(x, y, 5, 8, 4).fill(swatch.yellow.light);
  },
  // cloud stairs: white steps climbing up
  (g) => {
    for (let i = 0; i < 4; i++)
      g.roundRect(-84 + i * 36, 58 - i * 34, 66, 28, 14)
        .fill(0xffffff)
        .stroke({ width: 4, color: swatch.blue.line });
    g.circle(70, -62, 14).fill(swatch.yellow.fill);
  },
  // sky whale: a round blue whale among clouds
  (g) => {
    g.ellipse(0, 6, 72, 42).fill(swatch.blue.fill).stroke({ width: 5, color: swatch.blue.line });
    g.poly([-62, 4, -96, -26, -90, 30]).fill(swatch.blue.fill).stroke({ width: 5, color: swatch.blue.line });
    g.ellipse(8, 26, 48, 14).fill(swatch.blue.light);
    g.circle(30, -6, 6).fill(ink);
    g.moveTo(34 + 16 * Math.cos(0.2), 8 + 16 * Math.sin(0.2))
      .arc(34, 8, 16, 0.2, 1.7)
      .stroke({ width: 4, color: ink });
    for (const [x, y] of [
      [-50, -58],
      [50, -62],
      [70, 56],
    ] as [number, number][])
      g.ellipse(x, y, 26, 12).fill(0xffffff);
  },
  // umbrella forest: three umbrellas standing like trees
  (g) => {
    const umbrellas: [number, number, number, number][] = [
      [-52, 20, 40, swatch.red.fill],
      [4, -6, 46, swatch.yellow.fill],
      [58, 28, 36, swatch.pink.fill],
    ];
    for (const [x, y, r, c] of umbrellas) {
      g.moveTo(x, y)
        .lineTo(x, y + r + 34)
        .stroke({ width: 6, color: swatch.brown.line });
      g.moveTo(x - r, y)
        .arc(x, y, r, Math.PI, 0)
        .fill(c)
        .stroke({ width: 4, color: ink });
    }
    g.rect(-100, 84, 200, 16).fill(swatch.green.fill);
  },
  // teacup house: a cup with a roof, a door and a round window
  (g) => {
    g.ellipse(0, 36, 62, 36).fill(0xffffff).stroke({ width: 5, color: swatch.pink.line });
    g.rect(-62, -8, 124, 44).fill(0xffffff);
    g.moveTo(-62, -8)
      .lineTo(-62, 36)
      .moveTo(62, -8)
      .lineTo(62, 36)
      .stroke({ width: 5, color: swatch.pink.line });
    g.circle(66, 26, 20).stroke({ width: 8, color: swatch.pink.line });
    g.poly([-56, -8, 0, -62, 56, -8]).fill(swatch.red.fill).stroke({ width: 5, color: swatch.red.line });
    g.roundRect(-14, 24, 28, 44, 12).fill(swatch.orange.fill);
    g.circle(-38, 30, 9).fill(swatch.yellow.fill);
    g.circle(38, 30, 9).fill(swatch.yellow.fill);
  },
  // lantern boat: a little boat with a glowing lantern on a mast
  (g) => {
    g.rect(-3, -62, 6, 66).fill(swatch.brown.line);
    g.circle(0, -62, 26).fill(swatch.yellow.light);
    g.roundRect(-12, -76, 24, 30, 8).fill(swatch.yellow.fill).stroke({ width: 4, color: swatch.orange.line });
    g.poly([-70, 4, 70, 4, 48, 40, -48, 40])
      .fill(swatch.brown.fill)
      .stroke({ width: 5, color: swatch.brown.line });
    for (const x of [-60, -20, 20, 60])
      g.moveTo(x - 16, 56)
        .arc(x, 56, 16, Math.PI, 0)
        .stroke({ width: 5, color: swatch.blue.fill });
  },
];

const BACKS = [swatch.purple, swatch.blue, swatch.teal, swatch.green, swatch.pink, swatch.orange];

/** One dream picture as a card of `size` units, centred on (0, 0). It reads nothing but its own picture. */
export function pictureCard(picture: PictureId, size: number): Container {
  const c = new Container();
  const sw = BACKS[picture];
  const back = new Graphics()
    .roundRect(-100, -100, 200, 200, 26)
    .fill(sw.light)
    .stroke({ width: 6, color: sw.line });
  const scene = new Graphics();
  SCENES[picture](scene, sw.light);
  const art = new Container();
  art.addChild(back, scene);
  art.scale.set(size / 200);
  c.addChild(art);
  return c;
}

const ICONS: ((g: Graphics) => void)[] = [
  // quiet: a sleepy face
  (g) => {
    g.circle(0, 0, 30).fill(swatch.blue.light).stroke({ width: 4, color: swatch.blue.line });
    for (const x of [-11, 11])
      g.moveTo(x + 7, -4)
        .arc(x, -4, 7, 0, Math.PI)
        .stroke({ width: 3, color: ink });
    g.circle(0, 14, 4).fill(ink);
  },
  // high up: an arrow pointing up
  (g) => {
    g.poly([0, -34, 30, -2, 12, -2, 12, 32, -12, 32, -12, -2, -30, -2])
      .fill(swatch.green.fill)
      .stroke({ width: 4, color: swatch.green.line });
  },
  // cozy: a heart
  (g) => {
    g.circle(-14, -8, 18).fill(swatch.pink.fill);
    g.circle(14, -8, 18).fill(swatch.pink.fill);
    g.poly([-30, 2, 30, 2, 0, 34]).fill(swatch.pink.fill);
  },
  // floating: a balloon on a string
  (g) => {
    g.moveTo(0, 14).quadraticCurveTo(10, 28, 0, 40).stroke({ width: 3, color: ink });
    g.ellipse(0, -8, 22, 26).fill(swatch.red.fill).stroke({ width: 4, color: swatch.red.line });
  },
  // glowing: a sun with rays
  (g) => {
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      g.moveTo(Math.cos(a) * 24, Math.sin(a) * 24)
        .lineTo(Math.cos(a) * 36, Math.sin(a) * 36)
        .stroke({ width: 5, color: swatch.yellow.line });
    }
    g.circle(0, 0, 19).fill(swatch.yellow.fill).stroke({ width: 4, color: swatch.yellow.line });
  },
  // tiny: a very small dot in a big ring
  (g) => {
    g.circle(0, 0, 32).stroke({ width: 4, color: swatch.teal.line });
    g.circle(0, 0, 7).fill(swatch.teal.fill).stroke({ width: 3, color: swatch.teal.line });
  },
];

/** A pictured clue token: its icon and its word on a round card of `size` units. */
export function clueToken(clue: ClueId, size: number): Container {
  const c = new Container();
  const r = size / 2;
  const bg = new Graphics().circle(0, 0, r).fill(0xffffff).stroke({ width: 5, color: swatch.purple.line });
  const icon = new Graphics();
  ICONS[clue](icon);
  icon.scale.set((size / 130) * 1.05);
  icon.y = -size * 0.1;
  const word = label(CLUES[clue], Math.round(size * 0.17), ink);
  word.y = size * 0.32;
  if (word.width > size * 0.8) word.scale.set((size * 0.8) / word.width);
  c.addChild(bg, icon, word);
  return c;
}

/** A coloured ring around a card, in the giver's or the listener's colour. */
export function ring(size: number, color: number, grow = 0): Graphics {
  const s = size + 14 + grow;
  return new Graphics().roundRect(-s / 2, -s / 2, s, s, 30).stroke({ width: 9, color });
}

/** A round avatar chip: the pet (a face with ears) or a person (head and shoulders). */
export function avatar(kind: 'pet' | 'person', color: number): Container {
  const c = new Container();
  const g = new Graphics().circle(0, 0, 24).fill(0xffffff).stroke({ width: 5, color });
  if (kind === 'pet') {
    g.circle(-10, -10, 7).fill(color);
    g.circle(10, -10, 7).fill(color);
    g.circle(0, 2, 12).fill(swatch.white.light).stroke({ width: 3, color });
  } else {
    g.circle(0, -6, 8).fill(color);
    g.ellipse(0, 14, 14, 9).fill(color);
  }
  c.addChild(g);
  c.eventMode = 'none';
  return c;
}

/** The blanket: a cloud that covers the three cards and nothing else. */
export function blanket(w: number, h: number): Graphics {
  const g = new Graphics();
  g.roundRect(-w / 2, -h / 2, w, h, 40)
    .fill(swatch.blue.light)
    .stroke({ width: 6, color: swatch.blue.line });
  const n = 5;
  for (let i = 0; i < n; i++)
    g.circle(-w / 2 + ((i + 0.5) * w) / n, -h / 2, h * 0.12)
      .fill(swatch.blue.light)
      .stroke({ width: 5, color: swatch.blue.line });
  g.roundRect(-w / 2 + 6, -h / 2 + 4, w - 12, h * 0.2, 12).fill(swatch.blue.light);
  for (const [x, y] of [
    [-w * 0.3, 0],
    [0, h * 0.12],
    [w * 0.28, -h * 0.05],
  ] as [number, number][])
    g.ellipse(x, y, 40, 16).fill(0xffffff);
  g.eventMode = 'none';
  return g;
}

// Button icons, drawn on a transparent 0-centred square about 60 units wide, white on the button's colour.
export const tickIcon = () =>
  new Graphics().poly([-24, 0, -10, 14, 24, -18, 24, -10, -10, 28, -24, 10]).fill(0xffffff);
export function eyeIcon() {
  const g = new Graphics();
  g.ellipse(0, 0, 28, 16).fill(0xffffff);
  g.circle(0, 0, 9).fill(swatch.blue.line);
  return g;
}
export function swapIcon() {
  const g = new Graphics();
  g.moveTo(-22, -8).lineTo(18, -8).stroke({ width: 7, color: 0xffffff });
  g.poly([14, -22, 30, -8, 14, 6]).fill(0xffffff);
  g.moveTo(22, 12).lineTo(-18, 12).stroke({ width: 7, color: 0xffffff });
  g.poly([-14, -2, -30, 12, -14, 26]).fill(0xffffff);
  return g;
}
export function passIcon() {
  const g = new Graphics();
  g.poly([-26, -10, 4, -10, 4, -24, 30, 0, 4, 24, 4, 10, -26, 10]).fill(0xffffff);
  return g;
}
/** One person next to the pet, or two people. */
export function seatIcon(two: boolean) {
  const c = new Container();
  const a = avatar('person', swatch.blue.line);
  const b = avatar(two ? 'person' : 'pet', swatch.orange.line);
  a.x = -22;
  b.x = 22;
  c.addChild(a, b);
  return c;
}

/** The sticker: the picture that was chosen, pinned to the pool index so a sticker keeps its picture. */
export const pictureSticker = (seed: number) => pictureCard(Math.abs(Math.trunc(seed)) % PICTURES.length, 96);
