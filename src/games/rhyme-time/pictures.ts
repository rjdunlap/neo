import { Container, Graphics } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { ink, swatch, wood } from '../../art/palette';
import { prop } from '../../art/props';
import { puffs, starPoints } from '../../art/shapes';

const line = (color: number, width = 5) => ({ width, color, join: 'round' as const, cap: 'round' as const });

/** A plush critter standing with its feet near the bottom of a picture card. */
function critter(name: keyof typeof CRITTERS, scale = 0.38): Container {
  const c = new Critter(CRITTERS[name]);
  c.alive = false;
  c.scale.set(scale);
  c.y = 55;
  // Wrapped, so a caller can scale the picture without undoing the critter's own size.
  const wrap = new Container();
  wrap.addChild(c);
  return wrap;
}

/** A picture for each rhyming word, about 120 units across and centered on (0, 0). */
export function picture(word: string): Container {
  const c = new Container();
  const g = new Graphics();
  switch (word) {
    case 'cat': return critter('cat');
    case 'dog': return critter('dog');
    case 'bear': return critter('bear');
    case 'duck': return critter('duck');
    case 'pear': {
      const p = prop('pear', 'green');
      p.scale.set(1.3);
      return p;
    }
    case 'king': {
      const k = critter('bear', 0.34);
      c.addChild(k);
      g.poly([-34, -42, -34, -70, -18, -54, 0, -76, 18, -54, 34, -70, 34, -42]).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 4));
      g.circle(0, -58, 5).fill(swatch.red.fill);
      c.addChild(g);
      return c;
    }
    case 'hat':
      g.ellipse(0, 36, 62, 14).fill(swatch.purple.fill).stroke(line(swatch.purple.line));
      g.roundRect(-36, -40, 72, 76, 10).fill(swatch.purple.fill).stroke(line(swatch.purple.line)).rect(-36, 14, 72, 14).fill(swatch.yellow.fill);
      break;
    case 'bat':
      g.poly([-12, -6, -60, -30, -48, 0, -60, 16, -14, 10]).poly([12, -6, 60, -30, 48, 0, 60, 16, 14, 10]).fill(swatch.purple.line);
      g.ellipse(0, 2, 20, 26).fill(swatch.purple.fill).poly([-14, -20, -8, -38, -2, -22]).poly([14, -20, 8, -38, 2, -22]).fill(swatch.purple.fill);
      g.circle(-7, -4, 4).circle(7, -4, 4).fill(0xffffff);
      break;
    case 'log':
      g.roundRect(-58, -24, 116, 48, 22).fill(wood.fill).stroke(line(wood.line));
      g.ellipse(46, 0, 14, 24).fill(wood.light).stroke(line(wood.line, 4)).ellipse(46, 0, 6, 11).stroke(line(wood.line, 3));
      break;
    case 'frog':
      g.ellipse(0, 10, 50, 34).fill(swatch.green.fill).stroke(line(swatch.green.line));
      g.circle(-24, -22, 16).circle(24, -22, 16).fill(swatch.green.fill).stroke(line(swatch.green.line, 4));
      g.circle(-24, -22, 8).circle(24, -22, 8).fill(0xffffff).circle(-23, -21, 4).circle(25, -21, 4).fill(ink);
      g.moveTo(-18, 16).quadraticCurveTo(0, 28, 18, 16).stroke(line(swatch.green.line, 4));
      break;
    case 'bee':
      g.ellipse(-12, -26, 16, 22).ellipse(12, -26, 16, 22).fill({ color: 0xffffff, alpha: 0.85 }).stroke(line(swatch.blue.light, 3));
      g.ellipse(0, 6, 46, 30).fill(swatch.yellow.fill).stroke(line(ink, 4));
      for (const x of [-12, 8]) g.rect(x, -22, 10, 56).fill(ink);
      g.poly([44, 6, 58, 2, 46, 14]).fill(ink).circle(-30, 0, 4).fill(ink);
      break;
    case 'tree':
      g.rect(-10, 10, 20, 50).fill(wood.fill).stroke(line(wood.line, 4));
      puffs(g, [[-30, -10, 30], [30, -10, 30], [0, -34, 34], [0, 6, 30]], swatch.green.fill, swatch.green.line, 5);
      break;
    case 'key':
      g.circle(-30, 0, 24).stroke(line(swatch.yellow.line, 12)).circle(-30, 0, 24).stroke(line(swatch.yellow.fill, 7));
      g.moveTo(-6, 0).lineTo(56, 0).moveTo(40, 0).lineTo(40, 18).moveTo(54, 0).lineTo(54, 14).stroke(line(swatch.yellow.fill, 10));
      break;
    case 'star':
      g.poly(starPoints(56, 24)).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line));
      break;
    case 'car':
      g.roundRect(-60, -6, 120, 36, 12).fill(swatch.red.fill).stroke(line(swatch.red.line));
      g.poly([-34, -6, -20, -34, 26, -34, 40, -6]).fill(swatch.red.fill).stroke(line(swatch.red.line));
      g.rect(-16, -28, 18, 18).rect(8, -28, 20, 18).fill(swatch.blue.light);
      g.circle(-34, 32, 14).circle(34, 32, 14).fill(ink).circle(-34, 32, 5).circle(34, 32, 5).fill(0xffffff);
      break;
    case 'jar':
      g.roundRect(-36, -30, 72, 84, 18).fill({ color: swatch.blue.light, alpha: 0.7 }).stroke(line(swatch.blue.line));
      g.roundRect(-30, 0, 60, 48, 12).fill(swatch.red.fill);
      g.roundRect(-40, -46, 80, 20, 6).fill(swatch.red.line);
      break;
    case 'moon':
      // A crescent: the outer edge round the left, the inner edge curving back.
      g.moveTo(10, -56).arc(10, 0, 56, -Math.PI / 2, Math.PI / 2, true).quadraticCurveTo(-34, 0, 10, -56).closePath().fill(swatch.yellow.light).stroke(line(swatch.yellow.line));
      break;
    case 'spoon':
      g.ellipse(0, -30, 26, 34).fill(0xdfe3ea).stroke(line(swatch.white.line));
      g.roundRect(-7, 0, 14, 64, 7).fill(0xdfe3ea).stroke(line(swatch.white.line, 4));
      break;
    case 'fish':
      g.poly([34, 0, 60, -22, 60, 22]).fill(swatch.orange.fill).stroke(line(swatch.orange.line));
      g.ellipse(0, 0, 44, 28).fill(swatch.orange.fill).stroke(line(swatch.orange.line)).circle(-22, -6, 6).fill(ink);
      break;
    case 'dish':
      g.ellipse(0, 10, 62, 26).fill(0xffffff).stroke(line(swatch.blue.line)).ellipse(0, 6, 40, 14).stroke(line(swatch.blue.light, 4));
      break;
    case 'cake':
      g.roundRect(-52, -4, 104, 54, 10).fill(swatch.pink.fill).stroke(line(swatch.pink.line));
      g.rect(-52, 14, 104, 10).fill(0xffffff);
      g.rect(-4, -40, 8, 36).fill(swatch.blue.fill).ellipse(0, -48, 6, 10).fill(swatch.orange.fill);
      break;
    case 'snake':
      g.moveTo(-58, 30).bezierCurveTo(-30, -20, 0, 60, 30, 0).stroke(line(swatch.green.line, 22)).moveTo(-58, 30).bezierCurveTo(-30, -20, 0, 60, 30, 0).stroke(line(swatch.green.fill, 14));
      g.ellipse(40, -6, 22, 16).fill(swatch.green.fill).stroke(line(swatch.green.line, 4)).circle(46, -10, 4).fill(ink);
      g.moveTo(60, -4).lineTo(72, -4).stroke(line(swatch.red.fill, 3));
      break;
    case 'chair':
      g.rect(-34, -60, 10, 110).rect(24, -60, 10, 110).fill(wood.fill);
      g.roundRect(-40, -60, 80, 40, 8).fill(wood.light).stroke(line(wood.line, 4));
      g.roundRect(-44, 0, 88, 16, 6).fill(wood.fill).stroke(line(wood.line, 4));
      g.rect(-34, 16, 10, 34).rect(24, 16, 10, 34).fill(wood.line);
      break;
    case 'truck':
      g.roundRect(-62, -36, 76, 56, 8).fill(swatch.blue.fill).stroke(line(swatch.blue.line));
      g.roundRect(14, -18, 46, 38, 8).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line)).rect(24, -10, 24, 14).fill(swatch.blue.light);
      g.circle(-38, 28, 14).circle(36, 28, 14).fill(ink).circle(-38, 28, 5).circle(36, 28, 5).fill(0xffffff);
      break;
    case 'boat':
      g.poly([-60, 10, 60, 10, 40, 40, -40, 40]).fill(wood.fill).stroke(line(wood.line));
      g.moveTo(0, 10).lineTo(0, -56).stroke(line(wood.line, 5)).poly([4, -52, 46, 0, 4, 0]).fill(0xffffff).stroke(line(swatch.white.line, 4));
      break;
    case 'coat':
      g.poly([-24, -46, -50, -30, -56, 20, -36, 20, -36, 50, 36, 50, 36, 20, 56, 20, 50, -30, 24, -46, 0, -20]).fill(swatch.red.fill).stroke(line(swatch.red.line));
      for (const y of [-4, 14, 32]) g.circle(0, y, 5).fill(swatch.yellow.fill);
      break;
    case 'bell':
      g.poly([-46, 30, -36, -20, 0, -46, 36, -20, 46, 30]).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line));
      g.roundRect(-54, 26, 108, 12, 6).fill(swatch.yellow.line).circle(0, 46, 9).fill(swatch.yellow.line);
      break;
    case 'shell':
      g.moveTo(0, 40).lineTo(-56, -10).quadraticCurveTo(0, -70, 56, -10).closePath().fill(swatch.pink.light).stroke(line(swatch.pink.line));
      for (const a of [-0.8, -0.4, 0, 0.4, 0.8]) g.moveTo(0, 40).lineTo(Math.sin(a) * 60, 40 - Math.cos(a) * 80).stroke(line(swatch.pink.line, 3));
      break;
    case 'ring':
      g.circle(0, 14, 36).stroke(line(swatch.yellow.line, 14)).circle(0, 14, 36).stroke(line(swatch.yellow.fill, 8));
      g.poly([-16, -24, 0, -48, 16, -24, 0, -14]).fill(swatch.blue.light).stroke(line(swatch.blue.line, 4));
      break;
    default:
      g.circle(0, 0, 40).fill(0xeeeeee);
  }
  c.addChild(g);
  return c;
}
