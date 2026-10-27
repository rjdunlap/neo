import { Container, Graphics } from 'pixi.js';
import { ink, swatch, wood } from '../../art/palette';
import { flower } from '../../art/shapes';
import { picture } from '../rhyme-time/pictures';

const line = (color: number, width = 5) => ({ width, color, join: 'round' as const, cap: 'round' as const });

/** Rhyme Time already draws these, about 120 units across. */
const SHARED = new Set(['dog', 'bee', 'cake', 'coat', 'moon', 'star', 'key', 'tree', 'car', 'hat', 'duck', 'frog', 'bell', 'spoon', 'shell', 'chair', 'jar']);

/* The parts --------------------------------------------------------------------------------------- */

function sun(g: Graphics, r = 34) {
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5;
    g.moveTo(Math.cos(a) * (r + 8), Math.sin(a) * (r + 8)).lineTo(Math.cos(a) * (r + 22), Math.sin(a) * (r + 22));
  }
  g.stroke(line(swatch.yellow.line, 7)).circle(0, 0, r).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line));
}

function house(g: Graphics, body: number, roof: number, door = true) {
  g.rect(-46, -14, 92, 66).fill(body).stroke(line(wood.line));
  g.poly([-60, -10, 0, -60, 60, -10]).fill(roof).stroke(line(swatch.red.line));
  if (door) g.roundRect(-18, 10, 36, 42, 16).fill(ink);
}

function box(g: Graphics, color = wood) {
  g.rect(-50, -20, 100, 66).fill(color.fill).stroke(line(color.line));
  g.rect(-56, -34, 112, 18).fill(color.light).stroke(line(color.line));
}

function brush(g: Graphics, handle: number) {
  g.roundRect(-60, -8, 82, 16, 8).fill(handle).stroke(line(swatch.white.line, 4));
  g.roundRect(18, -16, 44, 32, 6).fill(0xffffff).stroke(line(swatch.white.line, 4));
  for (let x = 24; x <= 56; x += 8) g.moveTo(x, -16).lineTo(x, -30);
  g.stroke(line(swatch.blue.line, 4));
}

function tooth(g: Graphics) {
  g.moveTo(-30, -30).quadraticCurveTo(-34, -46, -16, -46).quadraticCurveTo(0, -40, 16, -46).quadraticCurveTo(34, -46, 30, -30)
    .quadraticCurveTo(28, 0, 22, 30).quadraticCurveTo(14, 44, 8, 26).quadraticCurveTo(0, 10, -8, 26).quadraticCurveTo(-14, 44, -22, 30)
    .quadraticCurveTo(-28, 0, -30, -30).closePath().fill(0xffffff).stroke(line(swatch.white.line));
}

function bird(g: Graphics, color = swatch.blue) {
  g.ellipse(0, 6, 34, 28).fill(color.fill).stroke(line(color.line));
  g.circle(22, -18, 18).fill(color.fill).stroke(line(color.line));
  g.poly([38, -20, 54, -14, 38, -10]).fill(swatch.orange.fill);
  g.circle(26, -22, 4).fill(ink);
  g.moveTo(-14, 0).quadraticCurveTo(-4, -14, 8, 2).stroke(line(color.line, 4));
}

function doll(g: Graphics) {
  g.poly([-30, 50, 0, -6, 30, 50]).fill(swatch.pink.fill).stroke(line(swatch.pink.line));
  g.circle(0, -24, 22).fill(0xffe0c4).stroke(line(wood.line, 4));
  g.moveTo(-22, -30).quadraticCurveTo(0, -60, 22, -30).stroke(line(swatch.brown.line, 9));
  g.circle(-8, -24, 3).circle(8, -24, 3).fill(ink);
  g.moveTo(-6, -14).quadraticCurveTo(0, -10, 6, -14).stroke(line(swatch.red.line, 3));
}

function toy(g: Graphics) {
  g.roundRect(-52, -6, 50, 50, 8).fill(swatch.blue.fill).stroke(line(swatch.blue.line));
  g.poly([-38, 4, -28, 4, -28, 34, -38, 34]).fill(swatch.blue.light);
  g.circle(26, 14, 30).fill(swatch.red.fill).stroke(line(swatch.red.line));
  g.moveTo(-2, 14).quadraticCurveTo(26, 2, 54, 14).stroke(line(0xffffff, 6));
}

function sand(g: Graphics) {
  g.moveTo(-60, 40).quadraticCurveTo(-30, -24, 0, -20).quadraticCurveTo(30, -24, 60, 40).closePath().fill(swatch.yellow.light).stroke(line(swatch.yellow.line));
  for (const [x, y] of [[-20, 10], [6, -2], [24, 18], [-4, 26], [34, 30]]) g.circle(x, y, 3).fill(swatch.yellow.line);
}

function hair(g: Graphics) {
  g.moveTo(-40, -40).bezierCurveTo(30, -60, 40, 0, 0, 6).bezierCurveTo(-30, 10, -20, 44, 20, 40).stroke(line(swatch.brown.line, 18));
  g.moveTo(-40, -40).bezierCurveTo(30, -60, 40, 0, 0, 6).bezierCurveTo(-30, 10, -20, 44, 20, 40).stroke(line(swatch.brown.fill, 10));
}

function paint(g: Graphics, color = swatch.blue) {
  g.roundRect(-40, -20, 80, 64, 12).fill(0xdfe3ea).stroke(line(swatch.white.line));
  g.ellipse(0, -20, 40, 12).fill(color.fill).stroke(line(color.line, 4));
  g.moveTo(-26, -14).quadraticCurveTo(-30, 10, -22, 14).stroke(line(color.fill, 9));
  g.moveTo(-40, -30).quadraticCurveTo(0, -64, 40, -30).stroke(line(swatch.white.line, 4));
}

function rain(g: Graphics) {
  for (const [x, y, r] of [[-26, -26, 24], [4, -36, 28], [30, -22, 22], [0, -14, 26]]) g.circle(x, y, r);
  g.fill(0xffffff).stroke(line(swatch.blue.light, 5));
  for (const x of [-30, 0, 30]) g.moveTo(x, 12).quadraticCurveTo(x - 8, 28, x, 34).quadraticCurveTo(x + 8, 28, x, 12).fill(swatch.blue.fill);
  for (const x of [-15, 15]) g.moveTo(x, 34).quadraticCurveTo(x - 8, 50, x, 56).quadraticCurveTo(x + 8, 50, x, 34).fill(swatch.blue.fill);
}

function sail(g: Graphics) {
  g.moveTo(-14, 56).lineTo(-14, -60).stroke(line(wood.line, 6));
  g.moveTo(-8, -56).quadraticCurveTo(40, -10, 44, 40).lineTo(-8, 40).closePath().fill(0xffffff).stroke(line(swatch.white.line));
  g.moveTo(-8, -10).lineTo(30, -10).stroke(line(swatch.red.fill, 6));
}

function hull(g: Graphics) {
  g.poly([-60, -10, 60, -10, 42, 28, -42, 28]).fill(swatch.red.fill).stroke(line(swatch.red.line));
  g.rect(-46, -2, 92, 8).fill(0xffffff);
}

function mail(g: Graphics) {
  g.roundRect(-56, -36, 112, 72, 8).fill(0xffffff).stroke(line(swatch.white.line));
  g.moveTo(-54, -32).lineTo(0, 6).lineTo(54, -32).stroke(line(swatch.white.line, 4));
  g.rect(30, -28, 18, 20).fill(swatch.red.fill);
}

function hive(g: Graphics) {
  for (let i = 0; i < 4; i++) {
    const w = 40 + i * 12;
    g.roundRect(-w, -48 + i * 24, w * 2, 26, 13).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 4));
  }
  g.ellipse(0, 36, 12, 10).fill(ink);
}

function cup(g: Graphics) {
  g.poly([-40, -30, 40, -30, 28, 44, -28, 44]).fill(swatch.blue.fill).stroke(line(swatch.blue.line));
  g.moveTo(40, -16).quadraticCurveTo(66, -10, 34, 20).stroke(line(swatch.blue.line, 7));
  g.rect(-34, -12, 66, 10).fill(0xffffff);
}

/** A picture for one part or pool word, about 120 units across and centred on (0, 0). */
export function partArt(key: string): Container {
  if (SHARED.has(key)) return picture(key);
  const c = new Container();
  const g = new Graphics();
  switch (key) {
    case 'sun': sun(g); break;
    case 'flower':
      g.moveTo(0, 60).lineTo(0, 0).stroke(line(swatch.green.line, 7));
      g.ellipse(14, 34, 14, 7).fill(swatch.green.fill);
      c.addChild(g, piece((h) => flower(h, 46, swatch.pink.fill, swatch.pink.line), 0, -14));
      return c;
    case 'cup': cup(g); break;
    case 'house': house(g, swatch.yellow.light, swatch.red.fill); break;
    case 'tooth': tooth(g); break;
    case 'brush': brush(g, swatch.teal.fill); break;
    case 'rain': rain(g); break;
    case 'hive': hive(g); break;
    case 'sail': sail(g); break;
    case 'boat': hull(g); break;
    case 'mail': mail(g); break;
    case 'box': box(g); break;
    case 'bird': bird(g); break;
    case 'doll': doll(g); break;
    case 'toy': toy(g); break;
    case 'sand': sand(g); break;
    case 'hair': hair(g); break;
    case 'paint': paint(g); break;
    default: g.circle(0, 0, 40).fill(0xeeeeee);
  }
  c.addChild(g);
  return c;
}

/** A picture card: a soft tile with its picture, `size` units square. */
export function cardArt(key: string, size: number): Container {
  const c = new Container();
  const bg = new Graphics().roundRect(-size / 2, -size / 2, size, size, 28).fill(0xffffff).stroke({ width: 6, color: swatch.yellow.light });
  const p = partArt(key);
  p.scale.set((size * 0.78) / 130);
  c.addChild(bg, p);
  return c;
}

/* The made things --------------------------------------------------------------------------------- */

/** A made thing and its short "comes alive" motion, driven by the seconds since it appeared. */
export interface Made {
  node: Container;
  alive(t: number): void;
}

const piece = (draw: (g: Graphics) => void, x = 0, y = 0): Graphics => {
  const g = new Graphics();
  draw(g);
  g.position.set(x, y);
  return g;
};

/** The thing two parts make, about 160 units across, centred on (0, 0). */
export function madeArt(word: string): Made {
  const c = new Container();
  const add = (...gs: Container[]) => (c.addChild(...gs), gs);
  switch (word) {
    case 'sunflower': {
      const stem = piece((g) => g.moveTo(0, 80).lineTo(0, 0).stroke(line(swatch.green.line, 9)).ellipse(-18, 46, 18, 8).ellipse(18, 30, 18, 8).fill(swatch.green.fill));
      const head = piece((g) => {
        for (let i = 0; i < 12; i++) {
          const a = (i * Math.PI) / 6;
          g.ellipse(Math.cos(a) * 38, Math.sin(a) * 38, 16, 16);
        }
        g.fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 4)).circle(0, 0, 28).fill(swatch.brown.line);
      }, 0, -10);
      const s = piece((g) => sun(g, 18), 70, -70);
      add(stem, s, head);
      return { node: c, alive: (t) => { head.rotation = Math.min(1, t) * 0.35; head.x = Math.min(1, t) * 8; } };
    }
    case 'cupcake': {
      const base = piece((g) => {
        g.poly([-44, 0, 44, 0, 32, 56, -32, 56]).fill(swatch.blue.fill).stroke(line(swatch.blue.line));
        for (let x = -30; x <= 30; x += 15) g.moveTo(x, 4).lineTo(x * 0.75, 52);
        g.stroke(line(swatch.blue.line, 3));
        g.moveTo(-50, 2).quadraticCurveTo(-46, -40, 0, -42).quadraticCurveTo(46, -40, 50, 2).closePath().fill(swatch.pink.fill).stroke(line(swatch.pink.line));
        g.rect(-4, -76, 8, 34).fill(swatch.yellow.fill);
      });
      const flame = piece((g) => g.ellipse(0, -8, 7, 12).fill(swatch.orange.fill).ellipse(0, -4, 3, 6).fill(swatch.yellow.fill), 0, -76);
      add(base, flame);
      return { node: c, alive: (t) => { flame.scale.set(Math.min(1, t * 2) * (1 + Math.sin(t * 16) * 0.12)); } };
    }
    case 'doghouse': case 'birdhouse': case 'dollhouse': {
      const big = word === 'doghouse';
      const h = piece((g) => {
        if (big) {
          g.rect(-70, -20, 140, 90).fill(swatch.red.light).stroke(line(swatch.red.line));
          g.poly([-86, -14, 0, -84, 86, -14]).fill(swatch.red.fill).stroke(line(swatch.red.line));
          g.roundRect(-34, 10, 68, 60, 30).fill(ink);
        } else if (word === 'birdhouse') {
          g.rect(-6, 30, 12, 50).fill(wood.fill);
          g.rect(-46, -30, 92, 70).fill(swatch.green.light).stroke(line(swatch.green.line));
          g.poly([-58, -26, 0, -76, 58, -26]).fill(swatch.green.fill).stroke(line(swatch.green.line));
          g.circle(0, 0, 18).fill(ink);
        } else {
          g.rect(-70, -26, 140, 100).fill(swatch.pink.light).stroke(line(swatch.pink.line));
          g.poly([-84, -20, 0, -86, 84, -20]).fill(swatch.purple.fill).stroke(line(swatch.purple.line));
          g.moveTo(-70, 24).lineTo(70, 24).stroke(line(swatch.pink.line, 4));
        }
      });
      add(h);
      if (word === 'dollhouse') {
        const windows = [[-40, -2], [40, -2], [-40, 48], [40, 48]].map(([x, y]) => piece((g) => g.roundRect(-16, -14, 32, 28, 4).fill(swatch.yellow.fill), x, y));
        add(...windows);
        return { node: c, alive: (t) => windows.forEach((w, i) => (w.alpha = Math.min(1, Math.max(0.15, t * 2 - i * 0.4)))) };
      }
      const who = big ? partArt('dog') : piece((g) => bird(g, swatch.blue));
      who.scale.set(big ? 0.5 : 0.36);
      who.position.set(0, big ? 50 : 4);
      const mask = piece((g) => (big ? g.roundRect(-34, 10, 68, 60, 30) : g.circle(0, 0, 18)).fill(0xffffff));
      c.addChild(mask);
      who.mask = mask;
      c.addChild(who);
      return { node: c, alive: (t) => { who.y = (big ? 50 : 4) - Math.min(1, t * 1.5) * (big ? 16 : 6) + Math.sin(t * 3) * 2; } };
    }
    case 'toothbrush': {
      const t0 = piece(tooth, -30, 10);
      const b = piece((g) => brush(g, swatch.teal.fill), 40, -30);
      const shine = piece((g) => g.poly([0, -12, 4, -4, 12, 0, 4, 4, 0, 12, -4, 4, -12, 0, -4, -4]).fill(swatch.yellow.fill), -50, -30);
      add(t0, b, shine);
      return { node: c, alive: (t) => { b.x = 30 + Math.sin(t * 9) * 14 * Math.max(0, 1 - t / 2); shine.alpha = Math.min(1, t / 1.5); shine.rotation = t; } };
    }
    case 'raincoat': {
      const coat = partArt('coat');
      coat.scale.set(1.2);
      const drops = [[-70, -60], [70, -30], [-60, 20], [64, 40]].map(([x, y]) => piece((g) => g.moveTo(0, 0).quadraticCurveTo(-8, 16, 0, 22).quadraticCurveTo(8, 16, 0, 0).fill(swatch.blue.fill), x, y));
      add(coat, ...drops);
      return { node: c, alive: (t) => drops.forEach((d, i) => (d.y = -70 + i * 30 + ((t * 80 + i * 40) % 120))) };
    }
    case 'beehive': {
      const h = piece(hive);
      h.scale.set(1.3);
      const bees = [0, 1, 2].map(() => {
        const b = partArt('bee');
        b.scale.set(0.32);
        return b;
      });
      add(h, ...bees);
      return { node: c, alive: (t) => bees.forEach((b, i) => { const a = t * 2 + i * 2.1; const r = Math.min(1, t) * 80; b.position.set(Math.cos(a) * r, 46 + Math.sin(a) * r * 0.5 - 40); }) };
    }
    case 'sailboat': {
      const boat = new Container();
      boat.addChild(piece(sail, 0, -40), piece(hull, 0, 30));
      const water = piece((g) => { for (const x of [-80, -40, 0, 40]) g.moveTo(x, 70).quadraticCurveTo(x + 20, 60, x + 40, 70); g.stroke(line(swatch.blue.fill, 6)); });
      add(water, boat);
      return { node: c, alive: (t) => { boat.x = Math.sin(t * 1.6) * 26; boat.rotation = Math.sin(t * 3) * 0.05; } };
    }
    case 'mailbox': {
      const body = piece((g) => {
        g.rect(-8, 20, 16, 70).fill(wood.fill).stroke(line(wood.line, 4));
        g.moveTo(-56, 30).lineTo(-56, -20).arc(0, -20, 56, Math.PI, 0).lineTo(56, 30).closePath().fill(swatch.blue.fill).stroke(line(swatch.blue.line));
      });
      const flag = piece((g) => g.rect(-4, -50, 8, 50).rect(-4, -50, 30, 20).fill(swatch.red.fill), 62, 20);
      add(body, flag);
      return { node: c, alive: (t) => { flag.rotation = Math.PI / 2 - Math.min(1, t * 1.5) * (Math.PI / 2); } };
    }
    case 'toybox': case 'sandbox': {
      const b = piece((g) => {
        g.rect(-70, -10, 140, 70).fill(word === 'toybox' ? swatch.purple.fill : wood.fill).stroke(line(word === 'toybox' ? swatch.purple.line : wood.line));
        if (word === 'sandbox') g.rect(-62, -10, 124, 16).fill(swatch.yellow.light);
      });
      if (word === 'sandbox') {
        const castle = piece((g) => {
          g.rect(-30, -40, 60, 40).rect(-34, -52, 14, 14).rect(-7, -52, 14, 14).rect(20, -52, 14, 14).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 4));
          g.moveTo(0, -52).lineTo(0, -72).stroke(line(ink, 3)).poly([0, -72, 16, -66, 0, -60]).fill(swatch.red.fill);
        }, 0, -4);
        add(castle, b);
        return { node: c, alive: (t) => { castle.scale.y = Math.min(1, t * 1.4); } };
      }
      const toys = partArt('toy');
      toys.scale.set(0.8);
      toys.y = -30;
      const lid = piece((g) => g.rect(0, -8, 150, 18).fill(swatch.purple.light).stroke(line(swatch.purple.line)), -75, -12);
      add(toys, b, lid);
      return { node: c, alive: (t) => { lid.rotation = -1.4 * Math.max(0, 1 - t / 1.2); } };
    }
    case 'hairbrush': case 'paintbrush': {
      const b = piece((g) => brush(g, word === 'hairbrush' ? swatch.pink.fill : wood.fill));
      b.rotation = -0.5;
      if (word === 'hairbrush') {
        const curl = piece(hair, -40, 30);
        curl.scale.set(0.8);
        add(curl, b);
        return { node: c, alive: (t) => { b.position.set(-10 + Math.sin(t * 5) * 18, -20 + Math.cos(t * 5) * 8); curl.scale.x = 0.8 + Math.min(1, t) * 0.3; } };
      }
      const stripe = new Graphics();
      add(stripe, b);
      return {
        node: c,
        alive: (t) => {
          const w = Math.min(1, t / 1.2) * 150;
          stripe.clear().roundRect(-75, 40, w, 26, 13).fill(swatch.blue.fill);
          b.position.set(-75 + w + 20, 0);
        },
      };
    }
    default:
      add(partArt(word));
      return { node: c, alive: () => {} };
  }
}

/** The hub icon: a sun and a flower joined by a little spark. */
export function iconArt(): Container {
  const c = new Container();
  const s = partArt('sun');
  s.scale.set(0.55);
  s.position.set(-34, -10);
  const f = partArt('flower');
  f.scale.set(0.6);
  f.position.set(34, 0);
  const spark = piece((g) => g.poly([0, -16, 5, -5, 16, 0, 5, 5, 0, 16, -5, 5, -16, 0, -5, -5]).fill(swatch.yellow.fill).stroke(line(swatch.orange.line, 3)), 0, -40);
  c.addChild(s, f, spark);
  return c;
}
