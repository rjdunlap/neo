import { Container, Graphics } from 'pixi.js';
import { ink, swatch } from '../../art/palette';
import type { Item } from './logic';

const line = (color: number, width = 6) => ({ width, color, join: 'round' as const, cap: 'round' as const });

/** The things worn in pairs, one on each point of their part: the companion wears each side on its own. */
export const PAIRED: ReadonlySet<Item> = new Set<Item>(['boots', 'mittens', 'sandals', 'earmuffs']);

/**
 * The point of the drawing that sits on its part's point (RW05 slice 2b): a hat's brim on the head, the lenses on the
 * eyes, a mitten on its hand, an umbrella's grip in the hand. The drawings are in the old pip's coordinates (feet on 0,
 * 0; about 250 tall); for a pair, `side` is the one drawn (−1 left, 1 right).
 */
export function anchorOf(item: Item, side = 1): { x: number; y: number } {
  switch (item) {
    case 'sunhat':
      return { x: 0, y: -208 };
    case 'beanie':
      return { x: 0, y: -210 };
    case 'rainhat':
      return { x: 0, y: -198 };
    case 'sunglasses':
      return { x: 0, y: -143 };
    case 'scarf':
      return { x: 0, y: -60 };
    case 'raincoat':
      return { x: 0, y: -50 };
    case 'puffycoat':
      return { x: 0, y: -45 };
    case 'umbrella':
      return { x: 150, y: -60 };
    case 'mittens':
      return { x: side * 138, y: -96 };
    case 'boots':
      return { x: side * 40, y: -12 };
    case 'sandals':
      return { x: side * 40, y: -4 };
    case 'earmuffs':
      return { x: side * 110, y: -182 };
  }
}

/**
 * A piece of clothing in the old pip's body coordinates (feet on 0, 0; about 250 tall). `sides` draws one of a pair (the
 * earmuffs' band only with both). The game hangs it on the companion's part by `anchorOf`; the tray shows it whole.
 */
export function clothing(item: Item, sides: readonly number[] = [-1, 1]): Container {
  const c = new Container();
  const g = new Graphics();
  switch (item) {
    case 'sunhat': {
      const straw = swatch.yellow;
      g.moveTo(-78, -232).quadraticCurveTo(-70, -312, 0, -314).quadraticCurveTo(70, -312, 78, -232).closePath().fill(straw.fill).stroke(line(straw.line));
      g.ellipse(0, -232, 152, 26).fill(straw.light).stroke(line(straw.line));
      g.roundRect(-76, -258, 152, 16, 6).fill(swatch.red.fill);
      break;
    }
    case 'sunglasses':
      for (const side of [-1, 1]) {
        g.moveTo(side * 66, -150).lineTo(side * 122, -168).stroke(line(ink, 6));
        g.roundRect(side * 40 - 32, -168, 64, 50, 18).fill({ color: ink, alpha: 0.9 }).stroke(line(ink, 5));
        g.ellipse(side * 40 - 12, -156, 10, 6).fill({ color: 0xffffff, alpha: 0.5 });
      }
      g.moveTo(-10, -152).quadraticCurveTo(0, -160, 10, -152).stroke(line(ink, 6));
      break;
    case 'raincoat': {
      const coat = swatch.yellow;
      g.moveTo(-118, -66).quadraticCurveTo(-136, -40, -116, -24).lineTo(116, -24).quadraticCurveTo(136, -40, 118, -66).quadraticCurveTo(0, -86, -118, -66).closePath().fill(coat.fill).stroke(line(coat.line));
      g.poly([-40, -76, 0, -46, 40, -76]).fill(coat.light).stroke(line(coat.line, 4));
      for (const y of [-38]) g.circle(0, y, 6).fill(coat.line);
      break;
    }
    case 'umbrella': {
      const canopy = swatch.red;
      g.moveTo(150, -40).lineTo(150, -320).stroke(line(ink, 7));
      g.moveTo(150, -40).quadraticCurveTo(150, -10, 128, -14).stroke(line(ink, 7));
      g.moveTo(30, -320).quadraticCurveTo(40, -440, 150, -444).quadraticCurveTo(260, -440, 270, -320);
      for (let i = 0; i < 4; i++) g.quadraticCurveTo(270 - i * 60 - 30, -344, 270 - (i + 1) * 60, -320);
      g.closePath().fill(canopy.fill).stroke(line(canopy.line));
      g.moveTo(150, -444).lineTo(150, -320).moveTo(90, -432).quadraticCurveTo(105, -370, 90, -320).moveTo(210, -432).quadraticCurveTo(195, -370, 210, -320).stroke(line(canopy.line, 4));
      break;
    }
    case 'boots':
      for (const side of sides) {
        g.roundRect(side * 40 - 26, -30, 52, 40, 10).ellipse(side * 40 + side * 10, 6, 36, 12).fill(swatch.red.fill);
        g.roundRect(side * 40 - 26, -30, 52, 40, 10).stroke(line(swatch.red.line, 5));
        g.roundRect(side * 40 - 28, -34, 56, 12, 5).fill(swatch.red.light);
      }
      break;
    case 'beanie': {
      const knit = swatch.blue;
      g.moveTo(-100, -222).quadraticCurveTo(-96, -304, 0, -308).quadraticCurveTo(96, -304, 100, -222).closePath().fill(knit.fill).stroke(line(knit.line));
      for (const x of [-50, 0, 50]) g.moveTo(x, -230).lineTo(x * 1.1, -296).stroke(line(knit.light, 5));
      g.roundRect(-106, -238, 212, 30, 14).fill(knit.light).stroke(line(knit.line, 5));
      g.circle(0, -316, 24).fill(swatch.white.fill).stroke(line(swatch.white.line, 4));
      break;
    }
    case 'scarf': {
      const wool = swatch.red;
      g.moveTo(-112, -76).quadraticCurveTo(0, -54, 112, -76).lineTo(116, -52).quadraticCurveTo(0, -28, -116, -52).closePath().fill(wool.fill).stroke(line(wool.line));
      g.moveTo(56, -54).lineTo(88, -54).lineTo(96, 4).lineTo(66, 6).closePath().fill(wool.fill).stroke(line(wool.line));
      for (const y of [-34, -16]) g.moveTo(62, y).lineTo(92, y).stroke(line(swatch.white.fill, 5));
      for (const x of [70, 80, 90]) g.moveTo(x, 6).lineTo(x, 22).stroke(line(wool.line, 4));
      break;
    }
    case 'mittens':
      for (const side of sides) {
        g.ellipse(side * 138, -96, 28, 36).fill(swatch.purple.fill).stroke(line(swatch.purple.line, 5));
        g.ellipse(side * 138 - side * 24, -108, 11, 16).fill(swatch.purple.fill).stroke(line(swatch.purple.line, 4));
        g.roundRect(side * 138 - 26, -70, 52, 14, 6).fill(swatch.purple.light);
      }
      break;
    case 'sandals':
      for (const side of sides) {
        const x = side * 40;
        g.ellipse(x + side * 6, 4, 38, 13).fill(swatch.orange.fill).stroke(line(swatch.orange.line, 5));
        g.moveTo(x - 26, -2).quadraticCurveTo(x, -26, x + 26, -2).stroke(line(swatch.pink.line, 13));
        g.moveTo(x - 26, -2).quadraticCurveTo(x, -26, x + 26, -2).stroke(line(swatch.pink.fill, 7));
        g.circle(x, -14, 7).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 3));
      }
      break;
    case 'rainhat': {
      // A sou'wester: a round crown and a wide brim that droops down at the sides to shed the rain.
      const oil = swatch.green;
      g.moveTo(-92, -232).quadraticCurveTo(-88, -306, 0, -310).quadraticCurveTo(88, -306, 92, -232).closePath().fill(oil.fill).stroke(line(oil.line));
      g.moveTo(-140, -196).quadraticCurveTo(-118, -248, 0, -250).quadraticCurveTo(118, -248, 140, -196).quadraticCurveTo(0, -222, -140, -196).closePath().fill(oil.light).stroke(line(oil.line));
      g.moveTo(0, -306).lineTo(0, -246).moveTo(-46, -298).quadraticCurveTo(-56, -270, -52, -244).moveTo(46, -298).quadraticCurveTo(56, -270, 52, -244).stroke(line(oil.line, 4));
      break;
    }
    case 'earmuffs': {
      const fluff = swatch.pink;
      if (sides.length > 1) {
        g.moveTo(-108, -186).quadraticCurveTo(-112, -324, 0, -326).quadraticCurveTo(112, -324, 108, -186).stroke(line(fluff.line, 16));
        g.moveTo(-108, -186).quadraticCurveTo(-112, -324, 0, -326).quadraticCurveTo(112, -324, 108, -186).stroke(line(fluff.light, 8));
      }
      for (const side of sides) {
        g.circle(side * 110, -182, 36).fill(fluff.fill).stroke(line(fluff.line, 5));
        for (const [dx, dy] of [[-12, -10], [12, -6], [0, 12]] as const) g.circle(side * 110 + dx, -182 + dy, 9).fill(fluff.light);
      }
      break;
    }
    case 'puffycoat': {
      // Blue and quilted, so it never looks like the yellow raincoat and still shows under the red scarf.
      const down = swatch.blue;
      g.moveTo(-128, -78).quadraticCurveTo(-154, -42, -126, -6).lineTo(126, -6).quadraticCurveTo(154, -42, 128, -78).quadraticCurveTo(0, -96, -128, -78).closePath().fill(down.fill).stroke(line(down.line));
      for (const y of [-62, -34]) g.moveTo(-140, y + 4).quadraticCurveTo(0, y - 12, 140, y + 4).stroke(line(down.line, 5));
      g.moveTo(0, -80).lineTo(0, -6).stroke(line(down.light, 6));
      break;
    }
  }
  c.addChild(g);
  return c;
}

/** A pair of mittens side by side; worn ones sit far apart at the pet's sides. */
function mittenPair(): Container {
  const c = new Container();
  const g = new Graphics();
  for (const side of [-1, 1]) {
    g.ellipse(side * 34, 0, 28, 36).fill(swatch.purple.fill).stroke(line(swatch.purple.line, 5));
    g.ellipse(side * 34 - side * 24, -12, 11, 16).fill(swatch.purple.fill).stroke(line(swatch.purple.line, 4));
    g.roundRect(side * 34 - 26, 26, 52, 14, 6).fill(swatch.purple.light);
  }
  c.addChild(g);
  return c;
}

/** The same clothing, centered on (0, 0) and scaled to fit a `size` box, for the tray. */
export function itemIcon(item: Item, size = 100): Container {
  const art = item === 'mittens' ? mittenPair() : clothing(item);
  const b = art.getLocalBounds();
  const s = Math.min(size / b.width, size / b.height);
  art.scale.set(s);
  art.position.set(-(b.x + b.width / 2) * s, -(b.y + b.height / 2) * s);
  const c = new Container();
  c.addChild(art);
  return c;
}
