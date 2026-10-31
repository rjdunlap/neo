import { Container, Graphics } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { cream, ink, swatch, wood } from '../../art/palette';
import { ITEM_IDS, ITEMS, KIND_OF_PLACE, type Consequence, type ItemId, type Place, type RequestId } from './logic';

const line = (color: number, width = 5) => ({ width, color, join: 'round' as const, cap: 'round' as const });

/** One used thing, drawn in a 150-unit box centred on (0, 0). `mended` draws the toy whole again. */
export function itemArt(id: ItemId, size = 150, mended = false): Container {
  const c = new Container();
  const g = new Graphics();
  c.addChild(g);
  switch (id) {
    case 'peel':
      g.ellipse(0, 30, 22, 26).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line));
      for (const [x, r] of [[-30, -0.7], [0, 0], [30, 0.7]] as const) {
        const p = new Graphics().ellipse(0, -28, 14, 40).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line));
        p.position.set(x * 0.6, 22);
        p.rotation = r;
        c.addChild(p);
      }
      g.rect(-5, 50, 10, 14).fill(swatch.brown.line);
      break;
    case 'core':
      g.moveTo(-26, -40).quadraticCurveTo(-6, 0, -26, 40).lineTo(26, 40).quadraticCurveTo(6, 0, 26, -40).closePath().fill(cream).stroke(line(swatch.red.line));
      g.ellipse(0, -44, 30, 10).fill(swatch.red.fill).ellipse(0, 44, 30, 10).fill(swatch.red.fill);
      g.ellipse(-4, -6, 4, 7).fill(swatch.brown.line).ellipse(5, 8, 4, 7).fill(swatch.brown.line);
      g.moveTo(0, -52).lineTo(4, -66).stroke(line(swatch.brown.line, 6));
      break;
    case 'carrot':
      g.moveTo(-34, 6).lineTo(34, 6).lineTo(24, 40).lineTo(-24, 40).closePath().fill(swatch.orange.fill).stroke(line(swatch.orange.line));
      for (const x of [-18, 0, 18]) g.moveTo(x * 0.5, 4).quadraticCurveTo(x * 2, -30, x * 1.6, -56).stroke(line(swatch.green.line, 9));
      break;
    case 'leaf':
      g.moveTo(0, -56).quadraticCurveTo(48, -20, 0, 50).quadraticCurveTo(-48, -20, 0, -56).fill(swatch.orange.light).stroke(line(swatch.brown.line));
      g.moveTo(0, -46).lineTo(0, 62).stroke(line(swatch.brown.line, 4));
      for (const y of [-20, 4, 26]) g.moveTo(0, y).lineTo(-18, y - 14).moveTo(0, y).lineTo(18, y - 14).stroke(line(swatch.brown.line, 3));
      break;
    case 'box':
      g.rect(-56, -26, 112, 76).fill(wood.light).stroke(line(wood.line));
      g.poly([-56, -26, -70, -56, -14, -56, 0, -26]).fill(wood.fill).stroke(line(wood.line));
      g.poly([56, -26, 70, -56, 14, -56, 0, -26]).fill(wood.fill).stroke(line(wood.line));
      g.moveTo(-56, 4).lineTo(56, 4).stroke(line(wood.line, 3));
      break;
    case 'tub':
      g.poly([-50, -36, 50, -36, 38, 50, -38, 50]).fill(swatch.teal.fill).stroke(line(swatch.teal.line));
      g.roundRect(-58, -50, 116, 20, 8).fill(swatch.teal.light).stroke(line(swatch.teal.line));
      break;
    case 'bag':
      g.moveTo(-26, -24).quadraticCurveTo(-26, -66, 0, -66).quadraticCurveTo(26, -66, 26, -24).stroke(line(swatch.purple.line, 8));
      g.roundRect(-50, -26, 100, 84, 14).fill(swatch.purple.light).stroke(line(swatch.purple.line));
      g.circle(0, 14, 12).fill(swatch.pink.fill);
      break;
    case 'teddy': {
      const fur = swatch.brown;
      g.circle(-30, -48, 16).fill(fur.fill).stroke(line(fur.line)).circle(30, -48, 16).fill(fur.fill).stroke(line(fur.line));
      g.ellipse(0, 26, 40, 38).fill(fur.fill).stroke(line(fur.line));
      g.circle(0, -26, 32).fill(fur.fill).stroke(line(fur.line));
      g.circle(-11, -30, 4).fill(ink).circle(11, -30, 4).fill(ink).ellipse(0, -16, 10, 7).fill(fur.light);
      if (mended) g.circle(0, 22, 8).fill(swatch.blue.fill).stroke(line(swatch.blue.line, 3));
      else g.circle(16, 54, 7).fill(swatch.blue.fill).stroke(line(swatch.blue.line, 3)).moveTo(0, 22).lineTo(12, 48).stroke(line(ink, 2));
      break;
    }
    case 'cart':
      g.roundRect(-58, -26, 116, 40, 8).fill(swatch.red.fill).stroke(line(swatch.red.line));
      g.moveTo(58, -10).lineTo(76, -40).stroke(line(wood.line, 6));
      for (const x of mended ? [-38, 38] : [-38]) g.circle(x, 28, 18).fill(ink).circle(x, 28, 7).fill(swatch.white.light);
      if (!mended) g.circle(38, 28, 18).stroke({ ...line(swatch.white.line, 3), alpha: 0.6 });
      break;
    case 'kite':
      g.poly([0, -60, 40, -10, 0, 40, -40, -10]).fill(swatch.blue.fill).stroke(line(swatch.blue.line));
      g.moveTo(0, -60).lineTo(0, 40).moveTo(-40, -10).lineTo(40, -10).stroke(line(swatch.blue.line, 3));
      g.moveTo(0, 40).quadraticCurveTo(14, 56, 0, mended ? 72 : 52).stroke(line(ink, 3));
      if (mended) for (const y of [52, 66]) g.poly([-6, y, 6, y - 4, 6, y + 4]).fill(swatch.yellow.fill);
      break;
    case 'tin':
      // A whole tin: rolled rim, fitted lid, no sharp edge, no label.
      g.roundRect(-44, -30, 88, 78, 12).fill(swatch.white.light).stroke(line(swatch.white.line));
      for (const y of [-8, 14, 34]) g.moveTo(-44, y).lineTo(44, y).stroke(line(swatch.white.line, 2));
      g.roundRect(-50, -46, 100, 22, 10).fill(swatch.blue.light).stroke(line(swatch.blue.line));
      g.roundRect(-14, -54, 28, 10, 5).fill(swatch.blue.fill).stroke(line(swatch.blue.line, 3));
      break;
    case 'can':
      g.poly([-30, -44, 30, -44, 22, -6, 34, 12, 26, 46, -26, 46, -34, 12, -22, -6]).fill(swatch.white.light).stroke(line(swatch.white.line));
      g.moveTo(-22, -6).lineTo(22, -6).moveTo(-34, 12).lineTo(34, 12).stroke(line(swatch.white.line, 3));
      g.rect(-26, 18, 52, 14).fill(swatch.red.fill);
      break;
    case 'crayons':
      for (const [x, col, r] of [[-30, swatch.red, -0.3], [0, swatch.blue, 0.1], [30, swatch.green, 0.4]] as const) {
        const k = new Graphics().rect(-10, -16, 20, 32).fill(col.fill).stroke(line(col.line, 4)).poly([-10, -16, 0, -32, 10, -16]).fill(col.light).stroke(line(col.line, 4));
        k.position.set(x, 14);
        k.rotation = r;
        c.addChild(k);
      }
      break;
    case 'caps':
      for (const [x, y, col] of [[-28, 20, swatch.red], [24, 24, swatch.yellow], [-2, -12, swatch.green], [30, -14, swatch.blue]] as const) {
        g.circle(x, y, 20).fill(col.fill).stroke(line(col.line, 4));
        for (let a = 0; a < 12; a++) g.circle(x + Math.cos((a * Math.PI) / 6) * 20, y + Math.sin((a * Math.PI) / 6) * 20, 3).fill(col.line);
      }
      break;
  }
  c.scale.set(size / 150);
  return c;
}

/** A place's own silhouette in a 180×200 box centred on (0, 0), with its pictured key across the top. */
export function placeArt(place: Place): Container {
  const c = new Container();
  const g = new Graphics();
  c.addChild(g);
  // The key: a little board showing two things of this place's kind.
  g.roundRect(-84, -98, 168, 64, 16).fill(cream).stroke(line(wood.line, 4));
  const kind = KIND_OF_PLACE[place];
  const examples = ITEM_IDS.filter((id) => ITEMS[id].kind === kind).slice(0, 2);
  examples.forEach((id, i) => {
    const pic = itemArt(id, 52);
    pic.position.set(i === 0 ? -40 : 40, -66);
    c.addChild(pic);
  });
  switch (place) {
    case 'worm':
      g.roundRect(-80, -10, 112, 104, 12).fill(wood.fill).stroke(line(wood.line));
      for (const y of [16, 44, 72]) g.moveTo(-80, y).lineTo(32, y).stroke(line(wood.line, 3));
      g.ellipse(-24, -8, 52, 12).fill(swatch.brown.line);
      // The worm peeking out, and the pot where sprouts gather.
      g.moveTo(-34, -10).quadraticCurveTo(-30, -36, -14, -30).stroke(line(swatch.pink.line, 12)).stroke(line(swatch.pink.fill, 8));
      g.circle(-14, -32, 2.5).fill(ink);
      g.poly([42, 40, 84, 40, 78, 94, 48, 94]).fill(swatch.orange.fill).stroke(line(swatch.orange.line));
      break;
    case 'shelf':
      g.rect(-80, -16, 10, 110).fill(wood.fill).rect(70, -16, 10, 110).fill(wood.fill);
      for (const y of [16, 80]) g.roundRect(-84, y, 168, 12, 4).fill(wood.light).stroke(line(wood.line, 4));
      break;
    case 'mend':
      g.roundRect(-84, 6, 168, 18, 6).fill(wood.fill).stroke(line(wood.line));
      g.rect(-70, 24, 12, 70).fill(wood.line).rect(58, 24, 12, 70).fill(wood.line);
      // The needle and the little hammer.
      g.moveTo(-50, -4).lineTo(-10, -20).stroke(line(swatch.white.line, 5)).circle(-12, -19, 3).stroke(line(swatch.white.line, 2));
      g.moveTo(16, 2).lineTo(52, -18).stroke(line(wood.line, 7)).roundRect(42, -30, 30, 18, 4).fill(swatch.white.line);
      break;
    case 'remake':
      g.roundRect(-70, -8, 140, 92, 30).fill(swatch.purple.fill).stroke(line(swatch.purple.line));
      g.poly([-40, -8, -54, -30, 54, -30, 40, -8]).fill(swatch.purple.light).stroke(line(swatch.purple.line));
      g.circle(0, 36, 24).fill(swatch.yellow.light).stroke(line(swatch.purple.line, 4));
      for (let a = 0; a < 6; a++) g.circle(Math.cos((a * Math.PI) / 3) * 16, 36 + Math.sin((a * Math.PI) / 3) * 16, 4).fill(swatch.purple.line);
      g.roundRect(48, 70, 40, 24, 6).fill(swatch.purple.line);
      break;
  }
  return c;
}

/** The little cart the used things arrive on. */
export function cartArt(): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-110, 50, 220, 40, 10).fill(wood.fill).stroke(line(wood.line));
  g.moveTo(110, 60).lineTo(140, 20).stroke(line(wood.line, 8));
  for (const x of [-70, 70]) g.circle(x, 98, 20).fill(ink).circle(x, 98, 8).fill(swatch.white.light);
  c.addChild(g);
  return c;
}

/** What a place made, about 110 units across. */
export function madeArt(made: Consequence, from: ItemId): Container {
  const c = new Container();
  const g = new Graphics();
  c.addChild(g);
  switch (made) {
    case 'sprout':
      g.moveTo(0, 30).lineTo(0, -10).stroke(line(swatch.green.line, 6));
      g.ellipse(-16, -14, 16, 9).fill(swatch.green.fill).stroke(line(swatch.green.line, 3));
      g.ellipse(16, -20, 16, 9).fill(swatch.green.fill).stroke(line(swatch.green.line, 3));
      break;
    case 'nap': {
      c.addChild(itemArt('box', 120));
      const bunny = new Critter(CRITTERS.bunny);
      bunny.scale.set(0.28);
      bunny.y = -8;
      bunny.setMood('sleepy');
      c.addChild(bunny);
      g.zIndex = 1;
      break;
    }
    case 'planter': {
      c.addChild(itemArt('tub', 110));
      const s = madeArt('sprout', 'tub');
      s.position.set(0, -40);
      c.addChild(s);
      break;
    }
    case 'apples': {
      c.addChild(itemArt('bag', 110));
      for (const [x, y] of [[-16, -22], [10, -26], [-2, -36]]) g.circle(x, y, 13).fill(swatch.red.fill).stroke(line(swatch.red.line, 3));
      c.setChildIndex(g, 0);
      break;
    }
    case 'button':
    case 'roll':
    case 'flutter':
      c.addChild(itemArt(from, 120, true));
      break;
    case 'medal':
      g.poly([-14, -50, 14, -50, 22, -14, -22, -14]).fill(swatch.blue.fill).stroke(line(swatch.blue.line, 3));
      g.circle(0, 10, 30).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line)).star(0, 10, 5, 16, 7).fill(swatch.white.fill);
      break;
    case 'crayon': {
      const cols = [swatch.red, swatch.orange, swatch.yellow, swatch.green, swatch.blue];
      cols.forEach((col, i) => g.rect(-30 + i * 12, -24, 12, 54).fill(col.fill));
      g.rect(-30, -24, 60, 54).stroke(line(ink, 3)).poly([-30, -24, 0, -54, 30, -24]).fill(swatch.pink.light).stroke(line(ink, 3));
      break;
    }
    case 'buttons': {
      // The pet keeps buttons in the tin.
      c.addChild(itemArt('tin', 110));
      for (const [x, y, col] of [[-16, -42, swatch.red], [8, -48, swatch.yellow], [22, -38, swatch.green]] as const) {
        g.circle(x, y, 11).fill(col.fill).stroke(line(col.line, 3));
        g.circle(x - 3, y, 2).circle(x + 3, y, 2).fill(col.line);
      }
      c.setChildIndex(g, 0);
      break;
    }
    case 'bead':
      g.circle(0, 0, 30).fill(swatch.pink.fill).stroke(line(swatch.pink.line));
      for (const [x, y] of [[-9, -9], [9, -9], [-9, 9], [9, 9]]) g.circle(x, y, 5).fill(swatch.pink.line);
      break;
  }
  return c;
}

/** The cart bell on its post, in a 120-unit box centred on (0, 0); `swing` it by rotating `bell`. */
export function bellArt(): { node: Container; bell: Container } {
  const node = new Container();
  const g = new Graphics();
  g.roundRect(-8, -40, 16, 96, 6).fill(wood.fill).stroke(line(wood.line, 4));
  g.roundRect(-44, 48, 88, 14, 6).fill(wood.fill).stroke(line(wood.line, 4));
  node.addChild(g);
  const bell = new Container();
  const b = new Graphics();
  b.moveTo(-34, 30).quadraticCurveTo(-34, -30, 0, -32).quadraticCurveTo(34, -30, 34, 30).closePath().fill(swatch.yellow.fill).stroke(line(swatch.yellow.line));
  b.roundRect(-40, 26, 80, 12, 6).fill(swatch.yellow.line);
  b.circle(0, 44, 8).fill(swatch.orange.fill).stroke(line(swatch.orange.line, 3));
  b.circle(0, -36, 7).fill(swatch.yellow.line);
  bell.addChild(b);
  bell.position.set(0, -34);
  b.position.set(0, 34);
  bell.pivot.set(0, 0);
  node.addChild(bell);
  return { node, bell };
}

function pencils(g: Graphics, x: number, y: number, scale = 1) {
  const cols = [swatch.red, swatch.blue, swatch.green];
  cols.forEach((col, i) => {
    const px = x + (i - 1) * 12 * scale, tilt = (i - 1) * 6 * scale;
    g.poly([px - 5 * scale, y, px + 5 * scale, y, px + 5 * scale + tilt, y - 44 * scale, px - 5 * scale + tilt, y - 44 * scale]).fill(col.fill).stroke(line(col.line, 2));
    g.poly([px - 5 * scale + tilt, y - 44 * scale, px + 5 * scale + tilt, y - 44 * scale, px + tilt, y - 56 * scale]).fill(wood.light).stroke(line(wood.line, 2));
  });
}

/** A friend's picture bubble, about 130×90, centred on (0, 0): what they need, never the thing that fits it. */
export function bubbleArt(r: RequestId): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-66, -44, 132, 88, 30).fill(0xffffff).stroke(line(ink, 4));
  g.poly([-10, 42, 10, 42, -4, 60]).fill(0xffffff).stroke(line(ink, 4));
  g.rect(-12, 38, 24, 6).fill(0xffffff);
  c.addChild(g);
  const p = new Graphics();
  if (r === 'pencils') {
    // Pencils standing in a dotted outline: something to stand them in.
    pencils(p, 0, 6, 0.8);
    p.roundRect(-24, 0, 48, 34, 6).stroke({ width: 3, color: ink, alpha: 0.45 });
  } else if (r === 'bed') {
    const bunny = new Critter(CRITTERS.bunny);
    bunny.alive = false;
    bunny.scale.set(0.16);
    bunny.setMood('sleepy');
    bunny.position.set(0, 26);
    c.addChild(bunny);
    p.roundRect(-46, 18, 92, 18, 8).stroke({ width: 3, color: ink, alpha: 0.45 });
    p.moveTo(30, -30).lineTo(42, -30).lineTo(30, -18).lineTo(42, -18).stroke(line(swatch.blue.line, 3));
  } else {
    madeSeedling(p, 0, 4);
    p.poly([-22, 6, 22, 6, 16, 34, -16, 34]).stroke({ width: 3, color: ink, alpha: 0.45 });
    for (const x of [-6, 0, 6]) p.moveTo(x, 38).lineTo(x, 44).stroke(line(swatch.blue.fill, 3));
  }
  c.addChild(p);
  return c;
}

function madeSeedling(g: Graphics, x: number, y: number) {
  g.moveTo(x, y + 4).lineTo(x, y - 24).stroke(line(swatch.green.line, 5));
  g.ellipse(x - 12, y - 26, 12, 7).fill(swatch.green.fill).stroke(line(swatch.green.line, 3));
  g.ellipse(x + 12, y - 30, 12, 7).fill(swatch.green.fill).stroke(line(swatch.green.line, 3));
}

/** Who asks: Bunny for a bed; a cat with pencils; a duck with a seedling. Feet on (0, 0), about 120 tall. */
export function friendArt(r: RequestId): Critter {
  const critter = new Critter(r === 'bed' ? CRITTERS.bunny : r === 'pencils' ? CRITTERS.cat : CRITTERS.duck);
  critter.scale.set(0.48);
  if (r === 'bed') critter.setMood('sleepy');
  const held = new Graphics();
  if (r === 'pencils') pencils(held, 0, 0, 1.4);
  else if (r === 'seedling') {
    madeSeedling(held, 0, 0);
    held.ellipse(0, 6, 24, 12).fill(wood.fill).stroke(line(wood.line, 3));
  }
  held.scale.set(1 / 0.48 * 0.5);
  held.position.set(78, -80);
  critter.attach(held);
  return critter;
}

/** The friend using the gift: pencils standing in it, Bunny curled in it or the seedling planted in it. */
export function filledArt(r: RequestId, gift: ItemId): Container {
  if (r === 'bed' && gift === 'box') return madeArt('nap', 'box');
  if (r === 'seedling' && gift === 'tub') return madeArt('planter', 'tub');
  const c = new Container();
  const g = new Graphics();
  if (r === 'pencils') pencils(g, 0, -20, 1.1);
  else if (r === 'seedling') madeSeedling(g, 0, -36);
  c.addChild(g, itemArt(gift, 110));
  return c;
}
