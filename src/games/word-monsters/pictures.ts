import { Container, Graphics } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { letterPicture } from '../../art/letter-pictures';
import { ink, swatch, wood } from '../../art/palette';
import { puffs } from '../../art/shapes';
import { typingPicture } from '../../art/word-pictures';
import { picture as rhymePicture } from '../rhyme-time/pictures';
import type { PictureWord } from './logic';

/**
 * A picture for every word a building level asks for, about 260 units across and centered near (0, 0); the scene shows
 * it at half size above the slots. Each one names its word: a word no picture names is left out of the word lists
 * instead (logic.ts), and the test builds every picture.
 */
const line = (color: number, width = 6) => ({ width, color, cap: 'round' as const, join: 'round' as const });

/** A critter standing on the picture's floor; one of the picture's own children, so it cheers when the word is made. */
function critter(name: keyof typeof CRITTERS, scale = 1, x = 0, y = 110): Critter {
  const c = new Critter(CRITTERS[name]);
  c.scale.set(scale);
  c.position.set(x, y);
  return c;
}

function alone(c: Container): Container {
  const wrap = new Container();
  wrap.addChild(c);
  return wrap;
}

/** Another game's picture at `scale`, wrapped so the scene's own scaling keeps it (Rhyme Time's are about 120 across). */
function scaled(p: Container, scale: number, y = 0): Container {
  p.scale.set(scale);
  p.y = y;
  return alone(p);
}
const rhyme = (word: string) => scaled(rhymePicture(word), 2.1);

function drawn(paint: (g: Graphics) => void): Container {
  const c = new Container();
  const g = new Graphics();
  paint(g);
  c.addChild(g);
  return c;
}

const DRAW: Record<PictureWord, () => Container> = {
  cat: () => alone(critter('cat')),
  dog: () => alone(critter('dog')),
  pig: () => alone(critter('pig')),
  sun: () => letterPicture('S'),
  bat: () => rhyme('bat'),
  log: () => rhyme('log'),
  bug: () => rhyme('bug'),
  mug: () => rhyme('mug'),
  rug: () => rhyme('rug'),
  hen: () => scaled(typingPicture('hen'), 1.35),
  net: () => scaled(typingPicture('net'), 1.5, 15),
  cup: () =>
    drawn((g) => {
      g.moveTo(-70, -60)
        .lineTo(70, -60)
        .lineTo(55, 70)
        .lineTo(-55, 70)
        .closePath()
        .fill(swatch.blue.fill)
        .stroke(line(swatch.blue.line));
      g.moveTo(70, -30).bezierCurveTo(125, -30, 125, 40, 62, 40).stroke(line(swatch.blue.line, 12));
      for (const x of [-25, 5, 35])
        g.moveTo(x, -80)
          .quadraticCurveTo(x + 14, -100, x, -120)
          .stroke(line(0xb9c6d1, 5));
    }),
  hat: () =>
    drawn((g) => {
      g.ellipse(0, 50, 130, 30).fill(swatch.purple.fill).stroke(line(swatch.purple.line));
      g.roundRect(-70, -80, 140, 130, 18).fill(swatch.purple.fill).stroke(line(swatch.purple.line));
      g.rect(-70, 10, 140, 26).fill(swatch.yellow.fill);
    }),
  box: () =>
    drawn((g) => {
      g.roundRect(-100, -60, 200, 130, 10).fill(wood.light).stroke(line(wood.line));
      g.poly([-100, -60, -60, -110, 140, -110, 100, -60]).fill(wood.fill).stroke(line(wood.line));
      g.moveTo(-100, 5).lineTo(100, 5).stroke(line(wood.line, 4));
    }),
  cap: () =>
    drawn((g) => {
      g.moveTo(-120, 45)
        .quadraticCurveTo(-90, -85, 20, -85)
        .quadraticCurveTo(105, -85, 112, 35)
        .quadraticCurveTo(5, 15, -120, 45)
        .closePath()
        .fill(swatch.red.fill)
        .stroke(line(swatch.red.line));
      g.ellipse(15, 55, 115, 22).fill(swatch.red.light).stroke(line(swatch.red.line));
      g.moveTo(15, -75).lineTo(15, 0).stroke(line(swatch.red.line, 4));
    }),
  can: () =>
    drawn((g) => {
      g.ellipse(0, -72, 70, 23).fill(swatch.teal.light).stroke(line(swatch.teal.line));
      g.rect(-70, -72, 140, 145).fill(swatch.teal.fill).stroke(line(swatch.teal.line));
      g.ellipse(0, 72, 70, 23).fill(swatch.teal.fill).stroke(line(swatch.teal.line));
      g.ellipse(0, -72, 55, 13).fill(0xd9e3e8).stroke(line(swatch.teal.line, 4));
      g.roundRect(-38, -20, 76, 45, 10).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 4));
    }),
  // A door mat: bristles in a border.
  mat: () =>
    drawn((g) => {
      g.roundRect(-125, -55, 250, 110, 14).fill(wood.fill).stroke(line(wood.line));
      g.roundRect(-105, -37, 210, 74, 8).stroke(line(wood.line, 4));
      for (let x = -90; x <= 90; x += 15)
        for (const y of [-22, 0, 22])
          g.moveTo(x, y - 6)
            .lineTo(x + 4, y + 6)
            .stroke(line(wood.light, 4));
    }),
  // A grey rat side on, with round ears and a long pink tail.
  rat: () =>
    drawn((g) => {
      const grey = swatch.white.line;
      g.moveTo(-80, 40).bezierCurveTo(-140, 50, -150, -10, -120, -30).stroke(line(swatch.pink.fill, 8));
      g.ellipse(-10, 20, 85, 55).fill(grey).stroke(line(ink, 4));
      g.poly([50, -15, 135, 25, 55, 55]).fill(grey).stroke(line(ink, 4));
      g.circle(50, -30, 26).fill(grey).stroke(line(ink, 4)).circle(50, -30, 14).fill(swatch.pink.light);
      g.circle(135, 25, 9).fill(swatch.pink.fill).circle(88, 12, 7).fill(ink);
      for (const y of [22, 34])
        g.moveTo(120, y)
          .lineTo(150, y - 8 + (y - 22))
          .stroke(line(ink, 2));
      for (const x of [-50, 30]) g.ellipse(x, 75, 18, 8).fill(swatch.pink.fill);
    }),
  // Grey fog drifting over green hills.
  fog: () =>
    drawn((g) => {
      g.moveTo(-130, 80)
        .quadraticCurveTo(-60, -40, 10, 40)
        .quadraticCurveTo(70, -60, 130, 80)
        .closePath()
        .fill(swatch.green.fill);
      for (const [y, w] of [
        [-60, 200],
        [-15, 250],
        [30, 220],
        [72, 250],
      ] as const)
        g.roundRect(-w / 2, y - 14, w, 28, 14).fill({ color: 0xd8dde3, alpha: 0.85 });
    }),
  // A wild hog: brown and bristly, with tusks, so it is never the pink pig.
  hog: () =>
    drawn((g) => {
      const brown = swatch.brown;
      for (let x = -70; x <= 40; x += 18)
        g.moveTo(x, -50)
          .lineTo(x + 8, -72)
          .stroke(line(brown.line, 6));
      g.ellipse(-20, 10, 95, 60).fill(brown.fill).stroke(line(brown.line));
      g.circle(70, -5, 45).fill(brown.fill).stroke(line(brown.line));
      g.poly([45, -40, 55, -75, 75, -45]).fill(brown.line);
      g.ellipse(110, 10, 20, 24).fill(brown.light).stroke(line(brown.line, 4));
      g.circle(105, 5, 4).circle(115, 15, 4).fill(ink);
      g.moveTo(95, 30).quadraticCurveTo(115, 35, 118, 8).stroke(line(0xfffaf0, 7));
      g.circle(72, -15, 7).fill(ink);
      for (const x of [-80, -45, 10, 40]) g.roundRect(x - 10, 55, 20, 40, 6).fill(brown.line);
    }),
  // A spade in a heap of earth.
  dig: () =>
    drawn((g) => {
      g.ellipse(0, 80, 135, 45).fill(wood.line);
      g.circle(-60, 70, 9).circle(40, 95, 7).circle(85, 72, 8).fill(wood.fill);
      g.moveTo(10, -125).lineTo(10, 10).stroke(line(wood.fill, 16));
      g.moveTo(-15, -125).lineTo(35, -125).stroke(line(wood.fill, 16));
      g.moveTo(-35, 5)
        .lineTo(55, 5)
        .lineTo(50, 60)
        .quadraticCurveTo(10, 90, -30, 60)
        .closePath()
        .fill(0xb9c6d1)
        .stroke(line(swatch.white.line));
    }),
  // A curly wig on a stand.
  wig: () =>
    drawn((g) => {
      g.rect(-12, 50, 24, 60).fill(wood.fill).ellipse(0, 112, 55, 14).fill(wood.line);
      g.ellipse(0, -5, 62, 72).fill(swatch.white.light).stroke(line(swatch.white.line, 4));
      puffs(
        g,
        [
          [-60, -50, 32],
          [-25, -80, 34],
          [20, -82, 34],
          [58, -52, 32],
          [-75, -5, 30],
          [75, -5, 30],
          [-70, 40, 28],
          [70, 40, 28],
        ],
        swatch.yellow.fill,
        swatch.yellow.line,
      );
    }),
  // A purple fig, cut open beside a whole one.
  fig: () =>
    drawn((g) => {
      g.moveTo(-60, -80)
        .bezierCurveTo(-130, 10, -140, 90, -60, 90)
        .bezierCurveTo(20, 90, 10, 10, -60, -80)
        .fill(swatch.purple.fill)
        .stroke(line(swatch.purple.line));
      g.moveTo(-60, -80).lineTo(-55, -100).stroke(line(swatch.green.line, 8));
      g.ellipse(65, 30, 60, 70).fill(swatch.purple.fill).stroke(line(swatch.purple.line));
      g.ellipse(65, 30, 46, 56).fill(swatch.pink.light).ellipse(65, 35, 28, 36).fill(swatch.red.fill);
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;
        g.circle(65 + Math.cos(a) * 18, 35 + Math.sin(a) * 24, 3);
      }
      g.fill(swatch.yellow.light);
    }),
  // A bunny running, with speed lines and dust behind it.
  run: () => {
    const c = new Container();
    c.addChild(
      drawn((g) => {
        for (const y of [-60, -20, 20]) g.moveTo(-140, y).lineTo(-70, y);
        g.stroke(line(swatch.white.line, 7));
        puffs(
          g,
          [
            [-85, 95, 18],
            [-60, 100, 14],
          ],
          0xe6dccd,
          wood.light,
        );
      }),
    );
    const bunny = critter('bunny', 0.9, 20, 110);
    bunny.rotation = 0.12;
    c.addChild(bunny);
    return c;
  },
  // A soft bread bun with seeds on top.
  bun: () =>
    drawn((g) => {
      g.roundRect(-120, 20, 240, 50, 22).fill(wood.fill).stroke(line(wood.line));
      g.moveTo(-120, 30)
        .quadraticCurveTo(-120, -85, 0, -85)
        .quadraticCurveTo(120, -85, 120, 30)
        .closePath()
        .fill(swatch.orange.light)
        .stroke(line(wood.line));
      for (const [x, y] of [
        [-50, -45],
        [0, -62],
        [45, -40],
        [-15, -25],
        [70, -10],
        [-80, -5],
      ])
        g.ellipse(x, y, 7, 4);
      g.fill(0xfffaf0);
    }),
  // A spinning top.
  top: () =>
    drawn((g) => {
      g.moveTo(0, -95).lineTo(0, -125).stroke(line(wood.line, 14));
      g.moveTo(-110, -40)
        .quadraticCurveTo(0, -130, 110, -40)
        .lineTo(0, 110)
        .closePath()
        .fill(swatch.red.fill)
        .stroke(line(swatch.red.line));
      g.moveTo(-95, -30)
        .quadraticCurveTo(0, 0, 95, -30)
        .lineTo(70, 6)
        .quadraticCurveTo(0, 30, -70, 6)
        .closePath()
        .fill(swatch.yellow.fill);
      g.moveTo(-150, 60).quadraticCurveTo(-130, 80, -100, 75).stroke(line(swatch.white.line, 5));
      g.moveTo(150, 60).quadraticCurveTo(130, 80, 100, 75).stroke(line(swatch.white.line, 5));
    }),
  // A mop in a bucket.
  mop: () =>
    drawn((g) => {
      // The bucket stands behind; the mop leans out of it with its strings on the floor in front.
      g.poly([20, 20, 140, 20, 125, 110, 35, 110]).fill(swatch.blue.fill).stroke(line(swatch.blue.line));
      g.moveTo(15, 20).lineTo(145, 20).stroke(line(swatch.blue.line, 10));
      g.moveTo(80, -130).lineTo(-50, 50).stroke(line(wood.fill, 14));
      g.roundRect(-75, 35, 55, 26, 8).fill(wood.line);
      for (let i = -5; i <= 5; i++)
        g.moveTo(-48, 55)
          .quadraticCurveTo(-48 + i * 10, 80, -48 + i * 15, 112)
          .stroke(line(swatch.white.line, 13))
          .moveTo(-48, 55)
          .quadraticCurveTo(-48 + i * 10, 80, -48 + i * 15, 112)
          .stroke(line(0xf4f6fa, 8));
    }),
  // A frog in mid-hop over a dotted arc.
  hop: () => {
    const c = drawn((g) => {
      for (let i = 0; i <= 8; i++) {
        const t = i / 8;
        g.circle(-120 + 240 * t, 90 - 4 * 150 * t * (1 - t), 8);
      }
      g.fill(swatch.green.line);
      g.ellipse(-120, 95, 30, 9).fill(swatch.green.line).ellipse(110, 95, 30, 9).fill(swatch.green.line);
    });
    const frog = rhyme('frog');
    frog.scale.set(0.8);
    frog.position.set(60, -45);
    c.addChild(frog);
    return c;
  },
  // A balloon popping: torn pieces and a bang.
  pop: () =>
    drawn((g) => {
      const burst: number[] = [];
      for (let i = 0; i < 16; i++) {
        const a = (i * Math.PI) / 8;
        const r = i % 2 ? 60 : 125;
        burst.push(Math.cos(a) * r, Math.sin(a) * r - 10);
      }
      g.poly(burst).fill(swatch.yellow.light).stroke(line(swatch.yellow.line, 5));
      for (const [x, y, a] of [
        [-35, -30, 0.4],
        [30, -40, -0.5],
        [-20, 25, -0.8],
        [35, 20, 0.9],
      ]) {
        const s = Math.sin(a),
          k = Math.cos(a);
        g.poly([x, y, x + 34 * k, y + 34 * s, x + 20 * k - 18 * s, y + 20 * s + 18 * k]).fill(
          swatch.red.fill,
        );
      }
      g.moveTo(0, 30).quadraticCurveTo(15, 80, -5, 125).stroke(line(swatch.white.line, 4));
    }),
  // A pen with its cap off.
  pen: () =>
    drawn((g) => {
      g.poly([-120, 60, 70, -70, 100, -30, -90, 100]).fill(swatch.blue.fill).stroke(line(swatch.blue.line));
      g.poly([-120, 60, -90, 100, -140, 115]).fill(wood.light).stroke(line(swatch.blue.line, 4));
      g.circle(-136, 111, 6).fill(swatch.blue.line);
      g.poly([20, -36, 45, -54, 75, -12, 50, 6]).fill(swatch.blue.line);
      g.moveTo(85, -55).lineTo(125, -90).stroke(line(swatch.yellow.line, 8));
    }),
  // Ten: two rows of five counters, as on a ten-frame.
  ten: () =>
    drawn((g) => {
      g.roundRect(-130, -60, 260, 120, 12).fill(0xfffaf0).stroke(line(ink, 4));
      g.moveTo(-130, 0).lineTo(130, 0);
      for (let i = 1; i < 5; i++) g.moveTo(-130 + i * 52, -60).lineTo(-130 + i * 52, 60);
      g.stroke(line(ink, 3));
      for (let i = 0; i < 10; i++) g.circle(-104 + (i % 5) * 52, i < 5 ? -30 : 30, 19);
      g.fill(swatch.red.fill);
    }),
  // A den: a dark hole in a grassy bank, with a fox looking out.
  den: () =>
    drawn((g) => {
      g.moveTo(-135, 100)
        .quadraticCurveTo(-120, -110, 0, -110)
        .quadraticCurveTo(120, -110, 135, 100)
        .closePath()
        .fill(swatch.green.fill)
        .stroke(line(swatch.green.line));
      g.moveTo(-75, 100)
        .quadraticCurveTo(-70, -30, 0, -30)
        .quadraticCurveTo(70, -30, 75, 100)
        .closePath()
        .fill(0x3a2a20);
      g.poly([-40, 20, -25, 50, 25, 50, 40, 20, 35, 80, 0, 100, -35, 80]).fill(swatch.orange.fill);
      g.circle(-14, 62, 5).circle(14, 62, 5).circle(0, 88, 6).fill(ink);
    }),
  // A pet goldfish in its bowl.
  pet: () =>
    drawn((g) => {
      g.circle(0, 10, 105).fill({ color: swatch.blue.light, alpha: 0.9 }).stroke(line(swatch.blue.line, 5));
      g.rect(-60, -100, 120, 30).fill(0xfffaf0);
      g.moveTo(-70, -80).lineTo(70, -80).stroke(line(swatch.blue.line, 6));
      g.ellipse(0, 85, 80, 18).fill(wood.light);
      g.ellipse(-5, 10, 42, 28).fill(swatch.orange.fill).stroke(line(swatch.orange.line, 4));
      g.poly([35, 10, 75, -18, 75, 38]).fill(swatch.orange.fill).stroke(line(swatch.orange.line, 4));
      g.circle(-25, 2, 6).fill(ink);
      g.circle(-60, -35, 7).circle(-48, -55, 5).stroke(line(0xffffff, 3));
    }),
  // A jet aeroplane.
  jet: () =>
    drawn((g) => {
      g.poly([-10, -10, 40, -120, 70, -120, 50, -10]).fill(swatch.blue.line);
      g.poly([-10, 20, 40, 120, 70, 120, 50, 20]).fill(swatch.blue.line);
      g.poly([-120, 5, -140, -55, -110, -55, -85, -5]).fill(swatch.blue.line);
      g.roundRect(-135, -22, 255, 50, 25).fill(0xf4f6fa).stroke(line(swatch.white.line, 5));
      g.moveTo(120, 3).quadraticCurveTo(140, 3, 125, -14).stroke(line(swatch.white.line, 5));
      for (let x = -80; x <= 60; x += 28) g.circle(x, -2, 7);
      g.fill(swatch.blue.fill);
    }),
  // A bear hugging a bunny, with a heart above.
  hug: () => {
    const c = new Container();
    c.addChild(critter('bunny', 0.75, 45, 115), critter('bear', 0.8, -45, 120));
    c.addChild(
      drawn((g) => {
        g.moveTo(0, -95)
          .bezierCurveTo(-40, -125, -30, -160, 0, -138)
          .bezierCurveTo(30, -160, 40, -125, 0, -95)
          .fill(swatch.red.fill);
        g.moveTo(-10, 0).quadraticCurveTo(40, 30, 85, -5).stroke(line(swatch.brown.line, 22));
        g.moveTo(-10, 0).quadraticCurveTo(40, 30, 85, -5).stroke(line(swatch.brown.fill, 14));
      }),
    );
    return c;
  },
  // A folded treasure map with a dotted path to an X.
  map: () =>
    drawn((g) => {
      g.poly([-130, -80, -45, -100, 45, -80, 130, -100, 130, 90, 45, 110, -45, 90, -130, 110])
        .fill(swatch.yellow.light)
        .stroke(line(wood.line, 5));
      g.moveTo(-45, -100).lineTo(-45, 90).moveTo(45, -80).lineTo(45, 110).stroke(line(wood.light, 4));
      g.ellipse(-70, 20, 40, 30).fill(swatch.green.light);
      for (let i = 0; i < 7; i++) g.circle(-90 + i * 25, 40 - Math.sin(i * 0.9) * 40, 5);
      g.fill(wood.line);
      g.moveTo(70, -30).lineTo(100, 0).moveTo(100, -30).lineTo(70, 0).stroke(line(swatch.red.fill, 8));
    }),
  // A shopping bag with handles.
  bag: () =>
    drawn((g) => {
      g.moveTo(-45, -40).quadraticCurveTo(-45, -120, 0, -120).quadraticCurveTo(45, -120, 45, -40);
      g.stroke(line(swatch.purple.line, 10));
      g.poly([-100, -50, 100, -50, 115, 110, -115, 110])
        .fill(swatch.purple.fill)
        .stroke(line(swatch.purple.line));
      g.circle(0, 30, 26).fill(swatch.yellow.fill);
    }),
  // A spider's web with its spider.
  web: () =>
    drawn((g) => {
      const spokes = 8;
      for (let i = 0; i < spokes; i++) {
        const a = (i * Math.PI * 2) / spokes;
        g.moveTo(0, 0).lineTo(Math.cos(a) * 125, Math.sin(a) * 125);
      }
      for (const r of [30, 60, 90, 120]) {
        for (let i = 0; i <= spokes; i++) {
          const a = (i * Math.PI * 2) / spokes;
          if (i === 0) g.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          else {
            const m = a - Math.PI / spokes;
            g.quadraticCurveTo(
              Math.cos(m) * r * 0.85,
              Math.sin(m) * r * 0.85,
              Math.cos(a) * r,
              Math.sin(a) * r,
            );
          }
        }
      }
      g.stroke(line(swatch.white.line, 3));
      g.moveTo(55, -125).lineTo(55, -50).stroke(line(ink, 2));
      for (const s of [-1, 1])
        for (const y of [-52, -42, -32])
          g.moveTo(55, -42)
            .quadraticCurveTo(55 + s * 18, y - 14, 55 + s * 26, y + 4)
            .stroke(line(ink, 3));
      g.circle(55, -42, 13).fill(ink);
    }),
  // A yellow school bus.
  bus: () =>
    drawn((g) => {
      g.roundRect(-135, -80, 270, 140, 24).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line));
      for (let x = -115; x < 70; x += 50) g.roundRect(x, -62, 38, 44, 6);
      g.fill(swatch.blue.light);
      g.roundRect(80, -62, 38, 80, 6).fill(swatch.blue.light).stroke(line(swatch.yellow.line, 4));
      g.rect(-135, 8, 270, 10).fill(ink);
      g.circle(-80, 65, 26)
        .circle(80, 65, 26)
        .fill(ink)
        .circle(-80, 65, 10)
        .circle(80, 65, 10)
        .fill(0xb9c6d1);
      g.circle(126, 40, 8).fill(0xfffaf0);
    }),
  // A push pin stuck in a board.
  pin: () =>
    drawn((g) => {
      g.roundRect(-130, 50, 260, 60, 8).fill(wood.light).stroke(line(wood.line, 5));
      g.moveTo(0, 0).lineTo(0, 70).stroke(line(0xb9c6d1, 8));
      g.ellipse(0, 5, 70, 16).fill(swatch.red.line);
      g.roundRect(-35, -80, 70, 85, 12).fill(swatch.red.fill);
      g.ellipse(0, -85, 65, 22).fill(swatch.red.fill).stroke(line(swatch.red.line, 5));
      g.ellipse(-15, -40, 8, 26).fill(swatch.red.light);
    }),
};

/** The picture for a word a building level asks for. */
export function wordPicture(word: PictureWord): Container {
  return DRAW[word]();
}
