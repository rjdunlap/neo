import { Container, Graphics } from 'pixi.js';
import { Critter, CRITTERS, type CritterName, type CritterSpec } from '../../art/critter';
import type { CompanionRig } from '../../creatures/companion';
import { cream, ink, swatch, wood, type ColorName } from '../../art/palette';
import { prop } from '../../art/props';
import { puffs, shapePath, starPoints } from '../../art/shapes';
import { Rng } from '../../engine/random';
import { tile } from '../shared';
import { FACE_PARTS, faceFrame, FEELINGS, type Feeling, type Helper } from './logic';

const line = (color: number, width = 5) => ({ width, color, join: 'round' as const, cap: 'round' as const });

/** Each feeling's bubble color in free play. */
export const FEELING_COLOR: Record<Feeling, ColorName> = { happy: 'yellow', sad: 'blue', sleepy: 'purple', surprised: 'orange' };

/** Friends for the friends level, the whole cast; every face (the duck's brows over its bill too) shows each feeling. */
export const FRIENDS: CritterName[] = ['cat', 'bunny', 'bear', 'pig', 'dog', 'cow', 'pip', 'duck'];

/** A critter wearing a feeling. `alive` keeps it breathing and blinking; the caller updates it. */
export function feelingCritter(spec: CritterSpec, feeling: Feeling | 'calm', scale: number): Critter {
  const c = new Critter(spec);
  c.setMood(feeling);
  c.scale.set(scale);
  return c;
}

/**
 * Puts the companion, wearing a feeling, behind `window` so its face fills `size` units round (0, 0): the cards and
 * bubbles show the face, grown from its parts (`faceFrame`), not the whole body.
 */
function framedFace(star: CompanionRig, feeling: Feeling, size: number, window: Graphics): Container {
  const holder = new Container();
  const frame = faceFrame(FACE_PARTS.flatMap((p) => star.partPoints(p)), size);
  star.setMood(feeling);
  star.scale.set(frame.scale);
  star.position.set(frame.x, frame.y);
  holder.addChild(star, window);
  holder.mask = window;
  return holder;
}

/** A face card on a white tile, 170 by 190 units: the companion's face wearing a feeling. */
export function faceCard(star: CompanionRig, feeling: Feeling): { node: Container; critter: CompanionRig } {
  const node = new Container();
  const face = framedFace(star, feeling, 150, new Graphics().roundRect(-79, -89, 158, 178, 14).fill(0xffffff));
  node.addChild(tile(170, 190), face);
  return { node, critter: star };
}

/** A round feeling bubble for free play, holding the companion's face. */
export function feelingBubble(star: CompanionRig, feeling: Feeling): { node: Container; critter: CompanionRig } {
  const sw = swatch[FEELING_COLOR[feeling]];
  const node = new Container();
  const face = framedFace(star, feeling, 128, new Graphics().circle(0, 0, 74).fill(0xffffff));
  node.addChild(
    new Graphics().circle(0, 6, 78).fill({ color: ink, alpha: 0.12 }).circle(0, 0, 78).fill(sw.light),
    face,
    new Graphics().circle(0, 0, 78).stroke({ width: 7, color: sw.fill }),
  );
  return { node, critter: star };
}

/** A helper drawn about 110 units across, centered on (0, 0). */
export function helperArt(helper: Helper): Container {
  const c = new Container();
  const g = new Graphics();
  switch (helper) {
    case 'hug':
      shapePath(g, 'heart', 52).fill(swatch.red.fill).stroke(line(swatch.red.line, 6));
      g.ellipse(-18, -16, 8, 12).fill({ color: 0xffffff, alpha: 0.45 });
      break;
    case 'pillow':
      g.moveTo(-58, -30)
        .quadraticCurveTo(0, -46, 58, -30)
        .quadraticCurveTo(68, 0, 58, 30)
        .quadraticCurveTo(0, 46, -58, 30)
        .quadraticCurveTo(-68, 0, -58, -30)
        .closePath()
        .fill(swatch.blue.light)
        .stroke(line(swatch.blue.line, 6));
      for (const [x, y] of [[-24, -8], [20, 10], [-4, 14], [28, -14]]) g.circle(x, y, 5).fill(swatch.white.fill);
      break;
    case 'apple':
      c.addChild(prop('apple', 'red'));
      return c;
    case 'scarf':
      // A knitted scarf: a loop with one striped tail and a fringe.
      g.ellipse(0, -18, 56, 24).fill(swatch.red.fill).stroke(line(swatch.red.line)).ellipse(0, -24, 34, 10).fill(swatch.white.light);
      g.roundRect(10, -10, 32, 56, 10).fill(swatch.red.fill).stroke(line(swatch.red.line));
      g.moveTo(14, 8).lineTo(38, 8).moveTo(14, 26).lineTo(38, 26).stroke(line(swatch.white.fill, 6));
      for (const x of [16, 26, 36]) g.moveTo(x, 48).lineTo(x, 60).stroke(line(swatch.red.line, 4));
      break;
  }
  c.addChild(g);
  return c;
}

/** A helper on a card the same size as a face card. */
export function helperCard(helper: Helper): Container {
  const node = new Container();
  const art = helperArt(helper);
  art.scale.set(1.05);
  node.addChild(tile(170, 190), art);
  return node;
}

/** A wrapped present whose lid can fly off. */
export function present(): { node: Container; lid: Graphics } {
  const node = new Container();
  const box = new Graphics()
    .roundRect(-55, -90, 110, 90, 10)
    .fill(swatch.pink.fill)
    .stroke(line(swatch.pink.line, 6))
    .rect(-10, -90, 20, 90)
    .fill(swatch.yellow.fill);
  const lid = new Graphics()
    .roundRect(-62, -24, 124, 28, 8)
    .fill(swatch.pink.fill)
    .stroke(line(swatch.pink.line, 6))
    .rect(-10, -24, 20, 28)
    .fill(swatch.yellow.fill)
    .ellipse(-20, -32, 20, 12)
    .ellipse(20, -32, 20, 12)
    .fill(swatch.yellow.fill)
    .stroke(line(swatch.yellow.line, 4));
  lid.y = -88;
  node.addChild(box, lid);
  return { node, lid };
}

/** A jack-in-the-box: `head` springs up out of the box. */
export function jackBox(): { node: Container; head: Container; spring: Graphics } {
  const node = new Container();
  const spring = new Graphics();
  const head = new Container();
  head.addChild(
    new Graphics()
      .circle(0, -30, 34)
      .fill(swatch.yellow.fill)
      .stroke(line(swatch.yellow.line, 5))
      .circle(-12, -36, 5)
      .circle(12, -36, 5)
      .fill(ink)
      .moveTo(-14, -20)
      .quadraticCurveTo(0, -8, 14, -20)
      .stroke(line(ink, 4))
      .poly([-30, -56, 0, -96, 30, -56])
      .fill(swatch.red.fill)
      .stroke(line(swatch.red.line, 4))
      .circle(0, -98, 9)
      .fill(swatch.white.fill),
  );
  head.y = -40;
  head.visible = false;
  const box = new Graphics().roundRect(-55, -80, 110, 80, 10).fill(swatch.blue.fill).stroke(line(swatch.blue.line, 6));
  box.poly(starPoints(18, 8)).fill(swatch.yellow.fill);
  node.addChild(spring, head, box);
  return { node, head, spring };
}

/** Draws the jack's spring from the box top up to `top` (negative). */
export function drawSpring(g: Graphics, top: number) {
  g.clear().moveTo(0, -80);
  const turns = 6;
  for (let i = 1; i <= turns * 2; i++) g.lineTo(i % 2 ? -18 : 18, -80 + ((top + 80) * i) / (turns * 2));
  g.stroke(line(swatch.white.line, 5));
}

/** A crescent moon with a few stars, for bedtime. */
export function moonAndStars(): Container {
  const c = new Container();
  const g = new Graphics()
    .moveTo(0, -54)
    .arc(0, 0, 54, -Math.PI / 2, Math.PI / 2, true)
    .quadraticCurveTo(-34, 0, 0, -54)
    .closePath()
    .fill(swatch.yellow.light)
    .stroke(line(swatch.yellow.line, 5));
  for (const [x, y, r] of [[-120, 40, 14], [90, 70, 10], [-60, -60, 9], [140, -30, 12]]) {
    g.poly(starPoints(r, r * 0.45).map((v, i) => v + (i % 2 ? y : x))).fill(swatch.yellow.fill);
  }
  c.addChild(g);
  return c;
}

/** A small orange butterfly, about 70 units across; `wings` flap by scaling x. */
export function butterfly(): { node: Container; wings: Graphics } {
  const node = new Container();
  const wings = new Graphics()
    .ellipse(-20, -10, 20, 16)
    .ellipse(20, -10, 20, 16)
    .ellipse(-15, 12, 13, 11)
    .ellipse(15, 12, 13, 11)
    .fill(swatch.orange.fill)
    .stroke(line(swatch.orange.line, 4))
    .circle(-20, -12, 6)
    .circle(20, -12, 6)
    .fill(swatch.yellow.light);
  const body = new Graphics()
    .roundRect(-4, -22, 8, 44, 4)
    .fill(ink)
    .moveTo(-2, -22)
    .quadraticCurveTo(-8, -34, -14, -36)
    .moveTo(2, -22)
    .quadraticCurveTo(8, -34, 14, -36)
    .stroke(line(ink, 3));
  node.addChild(wings, body);
  return { node, wings };
}

/** A striped ball, radius 34, centred on (0, 0). */
export function bouncyBall(): Container {
  const c = new Container();
  const g = new Graphics()
    .circle(0, 0, 34)
    .fill(swatch.red.fill)
    .moveTo(-34, 0)
    .quadraticCurveTo(0, 18, 34, 0)
    .lineTo(30, 14)
    .quadraticCurveTo(0, 30, -30, 14)
    .closePath()
    .fill(swatch.yellow.fill)
    .circle(0, 0, 34)
    .stroke(line(swatch.red.line, 5))
    .ellipse(-12, -14, 8, 6)
    .fill({ color: 0xffffff, alpha: 0.5 });
  c.addChild(g);
  return c;
}

/** An ice cream cone on a little table, its feet at (0, 0); `scoop` is drawn separately so it can fall off. */
export function iceCream(): { node: Container; scoop: Graphics } {
  const node = new Container();
  const table = new Graphics()
    .rect(-8, -110, 16, 110)
    .fill(wood.fill)
    .ellipse(0, 0, 36, 8)
    .fill(wood.line)
    .ellipse(0, -112, 54, 12)
    .fill(wood.light)
    .stroke(line(wood.fill, 5));
  const cone = new Graphics().poly([-28, -190, 28, -190, 0, -120]).fill(wood.light).stroke(line(wood.fill, 5));
  cone.moveTo(-16, -180).lineTo(6, -144).moveTo(16, -180).lineTo(-6, -144).stroke(line(wood.fill, 3));
  const scoop = puffs(new Graphics(), [[-16, -202, 20], [16, -202, 20], [0, -218, 24]], swatch.pink.light, swatch.pink.line, 5);
  node.addChild(table, cone, scoop);
  return { node, scoop };
}

/** A picnic basket with its lid open, and nothing inside. */
export function emptyBasket(): Container {
  const c = new Container();
  const g = new Graphics()
    .moveTo(-62, -60)
    .quadraticCurveTo(0, -150, 62, -60)
    .stroke(line(wood.fill, 8))
    .roundRect(-66, -64, 132, 64, 12)
    .fill(wood.light)
    .stroke(line(wood.fill, 6));
  for (const y of [-44, -22]) g.moveTo(-60, y).lineTo(60, y).stroke(line(wood.fill, 3));
  g.ellipse(0, -64, 60, 10).fill(wood.line);
  c.addChild(g);
  return c;
}

/** One music note, about 50 units tall, for the lullaby. */
export function musicNote(color: number): Graphics {
  return new Graphics()
    .ellipse(-8, 0, 13, 10)
    .fill(color)
    .moveTo(4, 0)
    .lineTo(4, -44)
    .quadraticCurveTo(14, -34, 22, -30)
    .stroke(line(color, 5));
}

/** A grey rain cloud for the window. */
export function windowCloud(): Graphics {
  return puffs(new Graphics(), [[-46, 8, 34], [0, -14, 44], [46, 8, 34]], swatch.white.light, swatch.blue.line, 5);
}

/** A sticker: a friend wearing a feeling, with a heart. Rebuilt from its seed. */
export function feelingsSticker(seed = 1): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const friend = feelingCritter(CRITTERS[rng.pick(FRIENDS)], rng.pick(FEELINGS), 0.5);
  friend.alive = false;
  friend.y = 70;
  const heart = shapePath(new Graphics(), 'heart', 22).fill(swatch.red.fill).stroke(line(swatch.red.line, 4));
  heart.position.set(62, -62);
  c.addChild(new Graphics().circle(0, 0, 88).fill(cream), friend, heart);
  return c;
}
