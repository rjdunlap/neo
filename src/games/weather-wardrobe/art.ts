import { Container, Graphics } from 'pixi.js';
import { ink, swatch } from '../../art/palette';
import type { Item } from './logic';

const line = (color: number, width = 6) => ({ width, color, join: 'round' as const, cap: 'round' as const });

/**
 * A piece of clothing in a critter's body coordinates (feet on 0, 0; about 250 tall),
 * ready for `Critter.attach`, so it squashes and hops along with the pet.
 */
export function clothing(item: Item): Container {
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
      for (const side of [-1, 1]) {
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
      for (const side of [-1, 1]) {
        g.ellipse(side * 138, -96, 28, 36).fill(swatch.purple.fill).stroke(line(swatch.purple.line, 5));
        g.ellipse(side * 138 - side * 24, -108, 11, 16).fill(swatch.purple.fill).stroke(line(swatch.purple.line, 4));
        g.roundRect(side * 138 - 26, -70, 52, 14, 6).fill(swatch.purple.light);
      }
      break;
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
