import { Container, Graphics } from 'pixi.js';
import { blanketArt } from '../../art/picnic';
import { cream, ink, swatch, wood, type ColorName } from '../../art/palette';
import { prop, type PropKind } from '../../art/props';
import { label } from '../../ui/text';
import type { Case, Dish, Ingredient } from './logic';

/** Picnic Pantry's drawings: tokens, jars, dish pictures, cards, the blanket, cushions and the basket bell. All pretend food. */

const round = (color: number, width = 4) => ({ width, color, join: 'round' as const, cap: 'round' as const });

const FRUIT_COLOR: Record<Exclude<Ingredient, 'oat'>, ColorName> = {
  blueberries: 'blue',
  apple: 'red',
  pear: 'green',
  plum: 'purple',
  orange: 'orange',
  banana: 'yellow',
  strawberry: 'red',
  lemon: 'yellow',
};

/** The oat token: a pale cluster of three flat flakes, so its shape differs from every round fruit. About 100 units across. */
function oatArt(): Container {
  const g = new Graphics();
  for (const [x, y, a] of [
    [-22, 12, -0.5],
    [22, 12, 0.5],
    [0, -16, 0],
  ] as const) {
    const flake = new Graphics()
      .ellipse(0, 0, 30, 19)
      .fill(wood.light)
      .stroke(round(wood.line, 5))
      .moveTo(-18, 0)
      .lineTo(18, 0)
      .stroke(round(wood.line, 3));
    flake.position.set(x, y);
    flake.rotation = a;
    g.addChild(flake);
  }
  return g;
}

/** One ingredient token, `size` units across, centered on (0, 0). */
export function tokenArt(kind: Ingredient, size = 44): Container {
  const c = kind === 'oat' ? oatArt() : prop(kind as PropKind, FRUIT_COLOR[kind]);
  c.scale.set(size / 100);
  c.eventMode = 'none';
  return c;
}

/** A token a jar could not give: the ingredient's own shape, faint, inside a dashed ring. */
export function outlineArt(kind: Ingredient, size = 44): Container {
  const c = new Container();
  const ghost = tokenArt(kind, size * 0.8);
  ghost.alpha = 0.28;
  const ring = new Graphics();
  const r = size / 2;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ring.moveTo(Math.cos(a) * r, Math.sin(a) * r).arc(0, 0, r, a, a + 0.45);
  }
  ring.stroke(round(ink, 3));
  c.addChild(ghost, ring);
  c.eventMode = 'none';
  return c;
}

/** Where a jar's four tokens sit (a 2 by 2 stack), relative to the jar's center. */
export const JAR_SLOTS = [
  { x: -30, y: 2 },
  { x: 30, y: 2 },
  { x: -30, y: -46 },
  { x: 30, y: -46 },
] as const;

/** A glass jar 150 wide and 170 tall with a lid and a picture tag on its front, centered on (0, 0). Tokens are added by the game. */
export function jarArt(kind: Ingredient): Container {
  const c = new Container();
  const glass = new Graphics()
    .roundRect(-70, -72, 140, 150, 26)
    .fill({ color: swatch.blue.light, alpha: 0.55 })
    .stroke(round(swatch.blue.line, 5))
    .roundRect(-52, -88, 104, 22, 8)
    .fill(wood.fill)
    .stroke(round(wood.line, 4))
    .roundRect(-56, -62, 10, 60, 5)
    .fill({ color: 0xffffff, alpha: 0.6 });
  const tag = new Graphics().roundRect(-30, 30, 60, 42, 10).fill(cream).stroke(round(wood.line, 3));
  const picture = tokenArt(kind, 30);
  picture.position.set(0, 51);
  c.addChild(glass, tag, picture);
  return c;
}

/** A dish picture about 110 units across, centered on (0, 0): its container, topped with the ingredients it uses. */
export function dishArt(c: Case, dish: Dish, size = 110): Container {
  const out = new Container();
  const g = new Graphics();
  const tone = swatch.white;
  if (dish.shape === 'bowl') {
    g.moveTo(-50, -4)
      .bezierCurveTo(-46, 50, 46, 50, 50, -4)
      .closePath()
      .fill(tone.fill)
      .stroke(round(tone.line));
    g.ellipse(0, -4, 50, 12).fill(tone.light).stroke(round(tone.line));
  } else if (dish.shape === 'cup') {
    g.moveTo(-34, -10)
      .lineTo(-24, 42)
      .lineTo(24, 42)
      .lineTo(34, -10)
      .closePath()
      .fill(swatch.teal.light)
      .stroke(round(swatch.teal.line));
    g.ellipse(0, -10, 34, 9).fill(swatch.white.fill).stroke(round(swatch.teal.line));
  } else if (dish.shape === 'square') {
    g.roundRect(-46, -6, 92, 46, 8).fill(wood.light).stroke(round(wood.line));
    g.moveTo(0, -6).lineTo(0, 40).moveTo(-46, 17).lineTo(46, 17).stroke(round(wood.line, 3));
  } else if (dish.shape === 'boat') {
    g.moveTo(-54, -2)
      .quadraticCurveTo(0, 62, 54, -2)
      .closePath()
      .fill(swatch.orange.light)
      .stroke(round(swatch.orange.line));
  } else {
    for (const y of [28, 10, -8])
      g.ellipse(0, y, 44 - (28 - y) * 0.3, 12)
        .fill(swatch.yellow.light)
        .stroke(round(swatch.yellow.line));
  }
  out.addChild(g);
  const used = c.ingredients.filter((_, j) => dish.cost[j] > 0);
  used.forEach((kind, i) => {
    const t = tokenArt(kind, 40);
    t.position.set(used.length === 1 ? 0 : i === 0 ? -20 : 20, -26);
    out.addChild(t);
  });
  out.scale.set(size / 110);
  out.eventMode = 'none';
  return out;
}

/** A small cushion: "serves two" on a card, a seat on the blanket. Centered on (0, 0), `w` units across. */
export function cushionArt(w = 70, color: ColorName = 'pink'): Graphics {
  const sw = swatch[color];
  return new Graphics()
    .ellipse(0, 0, w / 2, w * 0.22)
    .fill(sw.fill)
    .stroke(round(sw.line, Math.max(2, w / 18)))
    .circle(0, 0, w * 0.05)
    .fill(sw.line);
}

export const CARD_W = 236;
export const CARD_H = 150;

/** A dish card: the picture, the name, the cost as a row of token pictures and two small cushions for "serves two". */
export function cardArt(c: Case, dish: Dish): Container {
  const out = new Container();
  const back = new Graphics()
    .roundRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 20)
    .fill(cream)
    .stroke(round(wood.line, 5));
  const picture = dishArt(c, dish, 92);
  picture.position.set(-64, -8);
  const name = label(dish.name, 22, ink);
  name.position.set(48, -50);
  name.scale.set(Math.min(1, 124 / name.width));
  out.addChild(back, picture, name);
  let i = 0;
  const total = dish.cost[0] + dish.cost[1] + dish.cost[2];
  c.ingredients.forEach((kind, j) => {
    for (let k = 0; k < dish.cost[j]; k++) {
      const t = tokenArt(kind, 30);
      t.position.set(48 + (i - (total - 1) / 2) * 31, 0);
      out.addChild(t);
      i++;
    }
  });
  for (const dx of [-14, 14]) {
    const seat = cushionArt(24);
    seat.position.set(48 + dx, 44);
    out.addChild(seat);
  }
  for (const child of out.children) child.eventMode = 'none';
  return out;
}

/** The picnic blanket with a soft edge, centered on (0, 0). */
export function picnicBlanket(w: number, h: number): Container {
  const c = new Container();
  const edge = new Graphics().roundRect(-w / 2 - 6, -h / 2 - 6, w + 12, h + 12, 14).fill(swatch.green.line);
  const cloth = blanketArt('checks', w, h);
  cloth.alpha = 0.55;
  c.addChild(edge, new Graphics().roundRect(-w / 2, -h / 2, w, h, 8).fill(swatch.white.fill), cloth);
  c.eventMode = 'none';
  return c;
}

/** An empty dish place on the blanket: a dashed plate ring. */
export function placeArt(): Graphics {
  const g = new Graphics();
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2,
      b = a + 0.24;
    g.moveTo(Math.cos(a) * 60, Math.sin(a) * 42 - 40).lineTo(Math.cos(b) * 60, Math.sin(b) * 42 - 40);
  }
  g.stroke(round(swatch.green.line, 4));
  g.alpha = 0.7;
  return g;
}

/** The basket bell, "Lay the picnic": a picnic basket with a bell on its handle, 150 units across, centered on (0, 0). */
export function bellArt(): Container {
  const c = new Container();
  const pad = new Graphics().circle(0, 0, 73).fill(swatch.yellow.light).stroke(round(swatch.yellow.line, 5));
  const basket = new Graphics()
    .moveTo(-38, 0)
    .quadraticCurveTo(0, -78, 38, 0)
    .stroke(round(wood.line, 7))
    .roundRect(-48, -2, 96, 50, 12)
    .fill(wood.fill)
    .stroke(round(wood.line, 5));
  for (const x of [-24, 0, 24]) basket.moveTo(x, 4).lineTo(x, 42);
  basket.moveTo(-42, 22).lineTo(42, 22).stroke(round(wood.line, 3));
  const bell = new Graphics()
    .moveTo(-17, -22)
    .quadraticCurveTo(-15, -52, 0, -52)
    .quadraticCurveTo(15, -52, 17, -22)
    .closePath()
    .fill(swatch.yellow.fill)
    .stroke(round(swatch.yellow.line, 4))
    .circle(0, -18, 5)
    .fill(swatch.yellow.line);
  c.addChild(pad, basket, bell);
  for (const child of c.children) child.eventMode = 'none';
  return c;
}

/** A wide button with a picture and a word: an arrow for Next, two looping arrows for Another way? */
export function controlArt(kind: 'next' | 'another', w: number, h: number): Container {
  const c = new Container();
  const sw = kind === 'next' ? swatch.green : swatch.purple;
  const back = new Graphics()
    .roundRect(-w / 2, -h / 2, w, h, 26)
    .fill(sw.light)
    .stroke(round(sw.line, 5));
  const icon = new Graphics();
  if (kind === 'next') {
    icon.moveTo(-18, -22).lineTo(16, 0).lineTo(-18, 22).closePath().fill(sw.fill).stroke(round(sw.line, 4));
  } else {
    icon.arc(0, 0, 20, 0.5, Math.PI * 1.6).stroke(round(sw.line, 6));
    icon.moveTo(8, -28).lineTo(8, -8).lineTo(-12, -18).closePath().fill(sw.line);
  }
  icon.position.set(-w / 2 + 48, 0);
  const text = label(kind === 'next' ? 'Next' : 'Another way?', 26, ink);
  text.position.set(24, 0);
  c.addChild(back, icon, text);
  for (const child of c.children) child.eventMode = 'none';
  return c;
}

/** The hub icon and the sticker: a jar with two tokens beside a small dish; the sticker's basket holds two of a case's dishes. */
export function iconArt(c: Case): Container {
  const out = new Container();
  const jar = jarArt(c.ingredients[0]);
  jar.scale.set(0.62);
  jar.position.set(-28, -62);
  [0, 1].forEach((i) => {
    const t = tokenArt(c.ingredients[0], 30);
    t.position.set(JAR_SLOTS[i].x, JAR_SLOTS[i].y);
    jar.addChild(t);
  });
  const dish = dishArt(c, c.dishes[0], 64);
  dish.position.set(40, -24);
  out.addChild(jar, dish);
  return out;
}

export function stickerArt(c: Case, pair: readonly [number, number]): Container {
  const out = new Container();
  const basket = new Graphics()
    .moveTo(-52, 4)
    .quadraticCurveTo(0, -96, 52, 4)
    .stroke(round(wood.line, 8))
    .roundRect(-64, 0, 128, 62, 14)
    .fill(wood.fill)
    .stroke(round(wood.line, 5));
  for (const x of [-32, 0, 32]) basket.moveTo(x, 8).lineTo(x, 54);
  basket.moveTo(-56, 30).lineTo(56, 30).stroke(round(wood.line, 3));
  pair.forEach((d, i) => {
    const dish = dishArt(c, c.dishes[d], 62);
    dish.position.set(i ? 30 : -30, -18);
    out.addChild(dish);
  });
  out.addChild(basket);
  return out;
}
