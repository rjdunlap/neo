import { Container, Graphics } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { ink, swatch, type ColorName } from '../../art/palette';
import { prop } from '../../art/props';
import { picture } from '../rhyme-time/pictures';

const line = (color: number, width = 5) => ({ width, color, join: 'round' as const, cap: 'round' as const });

/** Words drawn here (the rest are Rhyme Time's pictures). Listed so a test can tell every word has a picture. */
export const OWN_PICTURES = ['apple', 'orange', 'lemon', 'balloon', 'flower', 'bunny', 'blueberries', 'banana', 'butterfly', 'umbrella', 'ladybug', 'watermelon', 'helicopter', 'pizza', 'rainbow', 'pencil', 'window', 'spider', 'tomato', 'strawberry', 'pineapple', 'caterpillar'];

/** Scales a drawing to fit a square and centers it on (0, 0). */
export function fitTo(art: Container, size: number): Container {
  const b = art.getLocalBounds();
  const s = Math.min(size / Math.max(1, b.width), size / Math.max(1, b.height));
  art.scale.set(s);
  art.position.set(-(b.x + b.width / 2) * s, -(b.y + b.height / 2) * s);
  const holder = new Container();
  holder.addChild(art);
  return holder;
}

/** The picture for a word, about 120 units across and centered on (0, 0). */
export function wordPicture(word: string): Container {
  const c = new Container();
  const g = new Graphics();
  switch (word) {
    case 'apple': return fitTo(prop('apple', 'red'), 110);
    case 'orange': return fitTo(prop('orange', 'orange'), 110);
    case 'lemon': return fitTo(prop('lemon', 'yellow'), 110);
    case 'balloon': return fitTo(prop('balloon', 'pink'), 120);
    case 'flower': return fitTo(prop('flower', 'pink'), 120);
    case 'blueberries': return fitTo(prop('blueberries', 'blue'), 110);
    case 'bunny': {
      const b = new Critter(CRITTERS.bunny);
      b.alive = false;
      b.scale.set(0.38);
      b.y = 55;
      c.addChild(b);
      return c;
    }
    case 'banana':
      g.moveTo(-54, -16).bezierCurveTo(-32, 52, 30, 58, 58, -34).lineTo(48, -40).bezierCurveTo(22, 20, -26, 14, -44, -32).closePath()
        .fill(swatch.yellow.fill).stroke(line(swatch.yellow.line));
      g.roundRect(54, -48, 12, 18, 4).fill(swatch.brown.line);
      g.moveTo(-50, -22).lineTo(-44, -30).stroke(line(swatch.brown.line, 6));
      break;
    case 'butterfly':
      g.ellipse(-30, -16, 30, 38).fill(swatch.purple.fill).stroke(line(swatch.purple.line));
      g.ellipse(30, -16, 30, 38).fill(swatch.purple.fill).stroke(line(swatch.purple.line));
      g.ellipse(-24, 26, 22, 26).fill(swatch.pink.fill).stroke(line(swatch.pink.line));
      g.ellipse(24, 26, 22, 26).fill(swatch.pink.fill).stroke(line(swatch.pink.line));
      for (const [x, y] of [[-34, -20], [34, -20], [-26, 28], [26, 28]]) g.circle(x, y, 7).fill({ color: 0xffffff, alpha: 0.85 });
      g.roundRect(-6, -38, 12, 84, 6).fill(ink);
      g.moveTo(-3, -38).quadraticCurveTo(-14, -60, -24, -58).moveTo(3, -38).quadraticCurveTo(14, -60, 24, -58).stroke(line(ink, 3));
      break;
    case 'umbrella':
      g.moveTo(-60, 4).arc(0, 4, 60, Math.PI, Math.PI * 2).closePath().fill(swatch.red.fill).stroke(line(swatch.red.line));
      g.moveTo(-20, 4).quadraticCurveTo(-14, -34, 0, -56).moveTo(20, 4).quadraticCurveTo(14, -34, 0, -56).stroke(line(swatch.white.fill, 6));
      g.moveTo(0, 4).lineTo(0, 46).quadraticCurveTo(0, 62, -16, 58).stroke(line(swatch.brown.line, 7));
      break;
    case 'ladybug':
      g.circle(0, 8, 46).fill(swatch.red.fill).stroke(line(swatch.red.line));
      g.moveTo(0, -36).lineTo(0, 54).stroke(line(ink, 4));
      for (const [x, y] of [[-22, -4], [22, -4], [-24, 26], [24, 26]]) g.circle(x, y, 8).fill(ink);
      g.ellipse(0, -38, 26, 16).fill(ink);
      g.circle(-9, -42, 5).circle(9, -42, 5).fill(0xffffff);
      for (const dx of [-1, 1]) g.moveTo(dx * 8, -52).lineTo(dx * 18, -66).stroke(line(ink, 3));
      break;
    case 'watermelon':
      g.ellipse(0, 0, 58, 45).fill(swatch.green.fill).stroke(line(swatch.green.line, 5));
      g.ellipse(0, 0, 46, 34).fill(swatch.red.fill).stroke(line(swatch.red.line, 3));
      for (const x of [-24, -8, 9, 25]) g.ellipse(x, 0, 2.5, 5).fill(ink);
      break;
    case 'helicopter':
      g.roundRect(-42, -8, 78, 45, 22).fill(swatch.blue.fill).stroke(line(swatch.blue.line, 5));
      g.moveTo(30, 12).lineTo(60, -4).lineTo(63, 4).lineTo(37, 22).stroke(line(swatch.blue.line, 8));
      g.moveTo(-12, -10).lineTo(-12, -30).moveTo(-44, -31).lineTo(20, -31).stroke(line(swatch.brown.line, 5));
      g.moveTo(-30, -38).lineTo(8, -38).stroke(line(swatch.brown.line, 4));
      g.moveTo(-30, 40).lineTo(32, 40).moveTo(-18, 34).lineTo(-25, 42).moveTo(18, 34).lineTo(25, 42).stroke(line(swatch.brown.line, 5));
      g.ellipse(-6, 4, 20, 14).fill(swatch.white.fill).stroke(line(swatch.blue.line, 3));
      break;
    case 'pizza':
      g.moveTo(-52, -36).quadraticCurveTo(0, -62, 52, -36).lineTo(0, 54).closePath().fill(swatch.yellow.fill).stroke(line(swatch.orange.line));
      g.moveTo(-52, -36).quadraticCurveTo(0, -62, 52, -36).stroke(line(swatch.orange.line, 9));
      for (const [x, y] of [[-20, -26], [18, -22], [0, 8]]) g.circle(x, y, 9).fill(swatch.red.fill).stroke(line(swatch.red.line, 3));
      break;
    case 'rainbow':
      for (const [i, name] of (['red', 'orange', 'yellow', 'green', 'blue'] as ColorName[]).entries()) {
        g.moveTo(-60 + i * 9, 36).arc(0, 36, 60 - i * 9, Math.PI, Math.PI * 2).stroke(line(swatch[name].fill, 10));
      }
      g.ellipse(-62, 44, 18, 10).ellipse(62, 44, 18, 10).fill(0xffffff).stroke(line(0xcfd8e3, 3));
      break;
    case 'pencil':
      g.rect(-14, -58, 28, 90).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line));
      g.rect(-14, -58, 28, 14).fill(swatch.pink.fill).stroke(line(swatch.pink.line, 3));
      g.moveTo(-14, 32).lineTo(0, 62).lineTo(14, 32).closePath().fill(0xf2d3a5).stroke(line(swatch.brown.line, 3));
      g.moveTo(-5, 52).lineTo(0, 62).lineTo(5, 52).closePath().fill(ink);
      break;
    case 'window':
      g.roundRect(-50, -50, 100, 100, 8).fill(swatch.blue.fill).stroke(line(swatch.brown.line, 8));
      g.moveTo(0, -50).lineTo(0, 50).moveTo(-50, 0).lineTo(50, 0).stroke(line(swatch.brown.line, 6));
      g.moveTo(-34, -30).lineTo(-20, -44).stroke(line(0xffffff, 5));
      break;
    case 'spider':
      for (const dir of [-1, 1]) for (const k of [0, 1, 2, 3]) {
        g.moveTo(dir * 14, -6 + k * 8).quadraticCurveTo(dir * 46, -34 + k * 12, dir * 58, 14 + k * 12).stroke(line(ink, 4));
      }
      g.circle(0, 10, 28).fill(swatch.purple.fill).stroke(line(swatch.purple.line));
      g.circle(0, -22, 18).fill(swatch.purple.fill).stroke(line(swatch.purple.line));
      g.circle(-7, -25, 4.5).circle(7, -25, 4.5).fill(0xffffff);
      g.circle(-7, -25, 2).circle(7, -25, 2).fill(ink);
      break;
    case 'tomato':
      g.circle(0, 6, 46).fill(swatch.red.fill).stroke(line(swatch.red.line));
      g.moveTo(0, -36).lineTo(-18, -26).lineTo(-8, -40).lineTo(0, -52).lineTo(8, -40).lineTo(18, -26).closePath().fill(swatch.green.fill).stroke(line(swatch.green.line, 3));
      break;
    case 'strawberry':
      g.moveTo(-42, -20).quadraticCurveTo(0, -40, 42, -20).quadraticCurveTo(34, 34, 0, 56).quadraticCurveTo(-34, 34, -42, -20).fill(swatch.red.fill).stroke(line(swatch.red.line));
      for (const [x, y] of [[-20, -4], [0, -8], [20, -4], [-10, 16], [10, 16], [0, 34]]) g.ellipse(x, y, 3, 5).fill(swatch.yellow.fill);
      g.moveTo(0, -30).lineTo(-22, -34).lineTo(-12, -44).lineTo(0, -40).lineTo(12, -44).lineTo(22, -34).closePath().fill(swatch.green.fill).stroke(line(swatch.green.line, 3));
      break;
    case 'pineapple':
      g.ellipse(0, 16, 36, 46).fill(swatch.yellow.fill).stroke(line(swatch.orange.line));
      for (const x of [-18, 0, 18]) g.moveTo(x - 14, -14).lineTo(x + 14, 46).moveTo(x + 14, -14).lineTo(x - 14, 46).stroke(line(swatch.orange.line, 2.5));
      for (const dx of [-22, -10, 0, 10, 22]) g.moveTo(dx * 0.3, -26).lineTo(dx, -56).stroke(line(swatch.green.line, 7));
      break;
    case 'caterpillar':
      for (let i = 0; i < 4; i++) g.circle(-54 + i * 34, 10 - (i % 2) * 8, 20).fill(swatch.green.fill).stroke(line(swatch.green.line));
      g.circle(-54, 10, 20).fill(swatch.green.fill).stroke(line(swatch.green.line));
      g.circle(-60, 4, 4).circle(-48, 4, 4).fill(ink);
      g.moveTo(-60, -10).lineTo(-66, -26).moveTo(-48, -10).lineTo(-42, -26).stroke(line(ink, 3));
      break;
    default:
      return picture(word);
  }
  c.addChild(g);
  return c;
}

/** Two clapping hands with sparks, about `size` across, centered on (0, 0). */
export function handsArt(size = 100): Container {
  const c = new Container();
  const skin = 0xffd2a8;
  const edge = 0xd9976a;
  for (const dir of [-1, 1]) {
    const hand = new Graphics().ellipse(0, 0, 22, 42).fill(skin).stroke(line(edge, 4));
    for (const f of [-2, -1, 0, 1]) hand.moveTo(f * 9 + 4.5, -34).lineTo(f * 9 + 4.5, -14).stroke(line(edge, 2.5));
    hand.position.set(dir * 24, 6);
    hand.rotation = dir * 0.38;
    c.addChild(hand);
  }
  const sparks = new Graphics();
  for (const [x1, y1, x2, y2] of [[0, -54, 0, -72], [-26, -46, -40, -60], [26, -46, 40, -60]]) sparks.moveTo(x1, y1).lineTo(x2, y2);
  sparks.stroke(line(swatch.yellow.line, 5));
  c.addChild(sparks);
  c.scale.set(size / 100);
  return c;
}

/** One beat as a ball that lights up. */
export class Bead extends Graphics {
  lit = false;
  constructor(readonly color: ColorName, readonly radius = 24) {
    super();
    this.draw();
  }

  light(on: boolean) {
    this.lit = on;
    this.draw();
  }

  private draw() {
    const sw = swatch[this.color];
    this.clear().circle(0, 0, this.radius);
    if (this.lit) this.fill(sw.fill).stroke({ width: 5, color: sw.line });
    else this.fill({ color: 0xffffff, alpha: 0.55 }).stroke({ width: 4, color: sw.line, alpha: 0.5 });
    this.eventMode = 'none';
  }
}
