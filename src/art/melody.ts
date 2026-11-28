import { Container, Graphics } from 'pixi.js';
import type { MelodyStep } from '../content/world';
import { frogArt } from './animals';
import { Critter, CRITTERS } from './critter';
import { cream, grass, swatch, wood, type ColorName } from './palette';
import { treeArt } from './picnic';

/** Art for the Missing Melody, Wren's story on Bumpy Hills. Everything is drawn with feet (or center) at (0, 0). */

const line = (color: number, width = 5) => ({ width, color, join: 'round' as const, cap: 'round' as const });

/** The five song notes' flower colors, lowest to highest: the island's one rainbow, red low and blue high. */
export const NOTE_COLORS: ColorName[] = ['red', 'orange', 'yellow', 'green', 'blue'];

/** Wren, a small blue songbird with a tuft, wings and a beak, standing about 270 tall at scale 1. */
export function makeWren(): Critter {
  return new Critter({
    ...CRITTERS.duck,
    color: 'blue',
    snout: 'beak',
    feet: 'orange',
    tuft: true,
    wings: true,
  });
}

/** One note-flower on a short stem, feet at (0, 0); a faint one is only a pale ring (the song's shadow). */
export function noteFlower(index: number, lit: boolean, g = new Graphics()): Graphics {
  const sw = swatch[NOTE_COLORS[index % NOTE_COLORS.length]];
  g.clear().moveTo(0, 0).lineTo(0, -34).stroke(line(swatch.green.line, 5));
  if (lit) {
    for (const [dx, dy] of [
      [0, -16],
      [16, 0],
      [0, 16],
      [-16, 0],
    ])
      g.circle(dx, -52 + dy, 11)
        .fill(sw.fill)
        .stroke(line(sw.line, 3));
    g.circle(0, -52, 9).fill(swatch.yellow.light).stroke(line(swatch.yellow.line, 3));
  } else
    g.circle(0, -52, 24)
      .fill({ color: sw.light, alpha: 0.35 })
      .stroke({ width: 3, color: sw.line, alpha: 0.4 });
  return g;
}

/** A vine strung across `w`, sagging in the middle, with its left end at (0, 0). */
export function vineArt(w: number): Graphics {
  return new Graphics()
    .moveTo(0, 0)
    .quadraticCurveTo(w / 2, 46, w, 0)
    .stroke(line(swatch.green.line, 7));
}

/** How far the vine hangs below its ends at `t` (0 to 1): the quadratic curve above, whose control point is 46 down. */
export const vineSag = (t: number) => 2 * t * (1 - t) * 46;

/** The top branch Wren hops to: a short wooden bough with a leaf. */
export function branchArt(): Graphics {
  return new Graphics()
    .roundRect(-70, -8, 140, 16, 8)
    .fill(wood.fill)
    .stroke(line(wood.line, 3))
    .ellipse(46, -18, 16, 8)
    .fill(swatch.green.fill)
    .stroke(line(swatch.green.line, 3));
}

/** The stone below, where Frog sits. */
export function stoneSeat(): Container {
  const c = new Container();
  c.addChild(new Graphics().ellipse(0, 0, 58, 22).fill(0xd9d2c4).stroke(line(0xb3aa98, 4)));
  const frog = frogArt();
  frog.scale.set(0.8);
  frog.position.set(0, -4);
  c.addChild(frog);
  return c;
}

export function treeFor(crown = 150): Graphics {
  return treeArt(crown, 14);
}

/** The faint-then-bright sun for the ending, `r` wide. */
export function sunArt(r = 60): Graphics {
  const g = new Graphics();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    g.moveTo(Math.cos(a) * r * 1.2, Math.sin(a) * r * 1.2)
      .lineTo(Math.cos(a) * r * 1.6, Math.sin(a) * r * 1.6)
      .stroke(line(swatch.yellow.line, 6));
  }
  return g.circle(0, 0, r).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 5));
}

/** Pictures for Wren's three request cards, about 80 units across. */
export function melodyRequestArt(step: MelodyStep): Container {
  const c = new Container();
  if (step === 'notes') {
    const g = new Graphics()
      .ellipse(-10, 20, 17, 12)
      .fill(swatch.purple.fill)
      .stroke(line(swatch.purple.line, 4))
      .moveTo(6, 18)
      .lineTo(6, -34)
      .quadraticCurveTo(26, -28, 28, -10)
      .stroke(line(swatch.purple.line, 6));
    c.addChild(g);
  } else if (step === 'highlow') {
    const bird = makeWren();
    bird.alive = false;
    bird.scale.set(0.15);
    bird.position.set(0, -4);
    const frog = frogArt();
    frog.scale.set(0.42);
    frog.position.set(0, 40);
    c.addChild(bird, frog);
  } else {
    for (const [i, kind] of (['bear', 'bunny'] as const).entries()) {
      const f = new Critter(CRITTERS[kind]);
      f.alive = false;
      f.scale.set(0.2);
      f.position.set(-22 + i * 44, 36);
      c.addChild(f);
    }
  }
  return c;
}

/** The two friends from the barn who come to sing, standing about 90 tall. */
export function melodyFriend(kind: 'bear' | 'bunny'): Critter {
  const f = new Critter(CRITTERS[kind]);
  f.scale.set(0.36);
  return f;
}

/** The keepsake: the morning song card, `w` wide, centered on (0, 0): a sunrise over the hills with the five notes in bloom. */
export function melodyCard(w = 240): Container {
  const c = new Container();
  const frame = new Graphics()
    .roundRect(-120, -100, 240, 200, 10)
    .fill(0xffffff)
    .stroke(line(swatch.white.line, 4));
  frame.rect(-106, -86, 212, 150).fill(swatch.yellow.light).rect(-106, 10, 212, 54).fill(grass);
  c.addChild(frame);
  const sun = sunArt(18);
  sun.position.set(0, -34);
  c.addChild(sun);
  NOTE_COLORS.forEach((_, i) => {
    const f = noteFlower(i, true);
    f.scale.set(0.55);
    f.position.set(-80 + i * 40, 56 + Math.sin((i / 4) * Math.PI) * -6);
    c.addChild(f);
  });
  const wren = makeWren();
  wren.alive = false;
  wren.scale.set(0.16);
  wren.position.set(-70, 20);
  c.addChild(wren);
  const heart = new Graphics()
    .moveTo(96, -60)
    .bezierCurveTo(82, -72, 92, -84, 96, -74)
    .bezierCurveTo(100, -84, 110, -72, 96, -60)
    .fill(swatch.pink.fill);
  c.addChild(heart);
  c.scale.set(w / 240);
  return c;
}

/** The spot on Bumpy Hills: a music stand with a faint note and a small blue bird on top. */
export function melodyLandmark(): Container {
  const c = new Container();
  c.addChild(new Graphics().ellipse(0, 26, 80, 22).fill(grass));
  c.addChild(
    new Graphics()
      .moveTo(0, 24)
      .lineTo(0, -34)
      .stroke(line(wood.line, 6))
      .roundRect(-38, -80, 76, 52, 6)
      .fill(cream)
      .stroke(line(wood.line, 4)),
  );
  const note = melodyRequestArt('notes');
  note.scale.set(0.4);
  note.position.set(0, -54);
  c.addChild(note);
  const wren = makeWren();
  wren.alive = false;
  wren.scale.set(0.16);
  wren.position.set(52, 12);
  c.addChild(wren);
  return c;
}
