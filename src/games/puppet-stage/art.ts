/**
 * Puppet Stage's code-drawn pictures: a stick puppet (a `CRITTERS` critter on a paddle with arms and a stick), the
 * proscenium with its day and night backdrops, a curtain, the tassel, the voice bubbles, Bow and the front row; for the
 * story cards, the painted places, the marquee cards, the peeking puppets and The end.
 * All colours come from the palette.
 */
import { Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { cream, ink, swatch, wood } from '../../art/palette';
import {
  BOW_H,
  BOW_W,
  BUBBLE,
  CARD_H,
  CARD_W,
  CURTAIN_W,
  PEEK_H,
  PEEK_W,
  PUPPET_H,
  PUPPET_W,
  TASSEL,
  WAY_LOOK,
  type Place,
  type Puppet,
  type Scene,
  type Way,
} from './logic';

export const CURTAIN_RED = swatch.red;
export const PUPPET_SCALE = 0.62;

export interface PuppetArt {
  node: Container;
  critter: Critter;
  stick: Graphics;
}

/** A stick puppet; (0, 0) is its feet on the floor line, the stick hangs below into the slot. */
export function puppetArt(kind: Puppet): PuppetArt {
  const node = new Container();
  const stick = new Graphics()
    .roundRect(-7, -10, 14, 110, 7)
    .fill(wood.fill)
    .stroke({ width: 3, color: wood.line });
  const critter = new Critter(CRITTERS[kind]);
  critter.scale.set(PUPPET_SCALE);
  const sw = critter.sw;
  const arms = new Graphics();
  for (const side of [-1, 1]) {
    arms
      .moveTo(side * 55, -80)
      .quadraticCurveTo(side * 95, -95, side * 100, -60)
      .stroke({ width: 16, color: sw.line, cap: 'round' });
    arms
      .moveTo(side * 55, -80)
      .quadraticCurveTo(side * 95, -95, side * 100, -60)
      .stroke({ width: 10, color: sw.fill, cap: 'round' });
    arms
      .circle(side * 100, -58, 10)
      .fill(sw.fill)
      .stroke({ width: 3, color: sw.line });
  }
  arms.eventMode = 'none';
  node.addChild(stick, arms, critter);
  node.hitArea = new Rectangle(-PUPPET_W / 2, -PUPPET_H, PUPPET_W, PUPPET_H);
  return { node, critter, stick };
}

/** The painted backdrop, day or night, filling the box between the curtains. */
export function backdropArt(w: number, h: number, night: boolean): Graphics {
  const g = new Graphics();
  if (night) {
    g.rect(0, 0, w, h).fill(0x2b2f6b);
    for (let i = 0; i < 14; i++)
      g.circle(((i * 97) % Math.max(1, w - 20)) + 10, ((i * 61) % Math.max(1, h * 0.6)) + 10, 3).fill(cream);
    g.circle(w * 0.75, h * 0.25, 34).fill(swatch.yellow.light);
    g.circle(w * 0.75 + 14, h * 0.25 - 8, 28).fill(0x2b2f6b);
    g.moveTo(0, h * 0.72)
      .quadraticCurveTo(w * 0.3, h * 0.5, w * 0.55, h * 0.74)
      .quadraticCurveTo(w * 0.8, h * 0.55, w, h * 0.7)
      .lineTo(w, h)
      .lineTo(0, h)
      .closePath()
      .fill(0x1f3b52);
  } else {
    g.rect(0, 0, w, h).fill(swatch.blue.light);
    g.circle(w * 0.78, h * 0.22, 36).fill(swatch.yellow.fill);
    for (const [cx, cy, r] of [
      [w * 0.22, h * 0.2, 26],
      [w * 0.3, h * 0.22, 32],
      [w * 0.38, h * 0.2, 24],
    ] as const)
      g.circle(cx, cy, r).fill(cream);
    g.moveTo(0, h * 0.7)
      .quadraticCurveTo(w * 0.3, h * 0.45, w * 0.55, h * 0.72)
      .quadraticCurveTo(w * 0.8, h * 0.5, w, h * 0.68)
      .lineTo(w, h)
      .lineTo(0, h)
      .closePath()
      .fill(swatch.green.fill);
  }
  g.eventMode = 'none';
  return g;
}

/** The arch across the top, the plank floor with the slot, and the apron below it. */
export function prosceniumArt(
  left: number,
  right: number,
  top: number,
  floor: number,
  bottom: number,
): Graphics {
  const g = new Graphics();
  const w = right - left;
  // Floor planks and the long dark slot along the floor line.
  g.rect(left, floor - 8, w, bottom - floor + 8)
    .fill(wood.fill)
    .stroke({ width: 4, color: wood.line });
  for (let x = left + 60; x < right; x += 90)
    g.moveTo(x, floor - 8)
      .lineTo(x, bottom)
      .stroke({ width: 2, color: wood.line });
  g.roundRect(left + CURTAIN_W, floor - 7, w - 2 * CURTAIN_W, 14, 7).fill(ink);
  // The arch: a red band with gold trim and a scalloped valance.
  g.roundRect(left - 10, top, w + 20, 80, 16)
    .fill(CURTAIN_RED.fill)
    .stroke({ width: 5, color: CURTAIN_RED.line });
  g.rect(left - 10, top + 60, w + 20, 8).fill(swatch.yellow.fill);
  for (let x = left + 20; x < right - 10; x += 40)
    g.moveTo(x, top + 80)
      .quadraticCurveTo(x + 20, top + 110, x + 40, top + 80)
      .closePath()
      .fill(CURTAIN_RED.fill)
      .stroke({ width: 3, color: CURTAIN_RED.line });
  g.eventMode = 'none';
  return g;
}

/** One side curtain, drawn from its outer edge (x = 0) toward the stage; `side` -1 hangs on the left. */
export function curtainArt(side: -1 | 1, h: number): Graphics {
  const g = new Graphics();
  const x0 = side < 0 ? 0 : -CURTAIN_W;
  g.roundRect(x0, 0, CURTAIN_W, h, 10).fill(CURTAIN_RED.fill).stroke({ width: 4, color: CURTAIN_RED.line });
  for (let i = 1; i < 4; i++)
    g.moveTo(x0 + i * (CURTAIN_W / 4), 10)
      .quadraticCurveTo(x0 + i * (CURTAIN_W / 4) - 8, h / 2, x0 + i * (CURTAIN_W / 4), h - 10)
      .stroke({ width: 4, color: CURTAIN_RED.line });
  g.roundRect(x0 + 8, h * 0.45, CURTAIN_W - 16, 22, 10)
    .fill(swatch.yellow.fill)
    .stroke({ width: 3, color: swatch.yellow.line });
  g.hitArea = new Rectangle(x0, 0, CURTAIN_W, h);
  return g;
}

/** The gold cord that swaps the backdrop. */
export function tasselArt(): Container {
  const c = new Container();
  const g = new Graphics();
  g.moveTo(0, -48).lineTo(0, 10).stroke({ width: 6, color: swatch.yellow.line });
  g.circle(0, -48, 9).fill(swatch.yellow.fill).stroke({ width: 3, color: swatch.yellow.line });
  g.roundRect(-16, 6, 32, 20, 8).fill(swatch.yellow.fill).stroke({ width: 3, color: swatch.yellow.line });
  for (let i = -2; i <= 2; i++)
    g.moveTo(i * 7, 24)
      .lineTo(i * 8, 46)
      .stroke({ width: 4, color: swatch.yellow.fill, cap: 'round' });
  c.addChild(g);
  c.hitArea = new Rectangle(-TASSEL / 2, -TASSEL / 2, TASSEL, TASSEL);
  return c;
}

/** A voice bubble showing the puppet's own face in the way's mood and size. */
export function bubbleArt(way: Way, puppet: Puppet): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-BUBBLE / 2, -BUBBLE / 2, BUBBLE, BUBBLE, 28)
    .fill(cream)
    .stroke({ width: 5, color: ink });
  g.moveTo(-18, BUBBLE / 2 - 2)
    .lineTo(-6, BUBBLE / 2 + 16)
    .lineTo(10, BUBBLE / 2 - 2)
    .closePath()
    .fill(cream)
    .stroke({ width: 5, color: ink });
  g.rect(-20, BUBBLE / 2 - 6, 32, 8).fill(cream);
  const face = new Critter(CRITTERS[puppet]);
  face.alive = false;
  face.setMood(WAY_LOOK[way].mood);
  face.scale.set(0.22 * WAY_LOOK[way].scale);
  face.y = BUBBLE / 2 - 30;
  face.eventMode = 'none';
  const marks = new Graphics();
  if (way === 'sleepy')
    marks
      .moveTo(28, -42)
      .lineTo(44, -42)
      .moveTo(36, -52)
      .lineTo(48, -52)
      .stroke({ width: 4, color: ink, cap: 'round' });
  else if (way === 'big')
    for (const d of [-1, 1])
      marks
        .moveTo(d * 44, -30)
        .lineTo(d * 56, -40)
        .moveTo(d * 46, -12)
        .lineTo(d * 60, -12)
        .stroke({ width: 4, color: ink, cap: 'round' });
  marks.eventMode = 'none';
  c.addChild(g, face, marks);
  c.hitArea = new Rectangle(-BUBBLE / 2, -BUBBLE / 2, BUBBLE, BUBBLE + 16);
  return c;
}

/** Bow: a pill with a bowing stick puppet and two stars. */
export function bowArt(): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-BOW_W / 2, -BOW_H / 2 + 5, BOW_W, BOW_H, 24).fill(swatch.pink.line);
  g.roundRect(-BOW_W / 2, -BOW_H / 2, BOW_W, BOW_H, 24)
    .fill(swatch.pink.fill)
    .stroke({ width: 4, color: swatch.pink.line });
  g.roundRect(-5, 0, 10, 40, 5).fill(wood.fill);
  g.ellipse(0, -8, 30, 22).fill(cream).stroke({ width: 4, color: ink });
  g.circle(-10, -12, 3).circle(10, -12, 3).fill(ink);
  g.moveTo(-10, 0).quadraticCurveTo(0, 8, 10, 0).stroke({ width: 3, color: ink, cap: 'round' });
  for (const x of [-46, 46])
    g.star(x, -20, 5, 12, 5).fill(swatch.yellow.fill).stroke({ width: 2, color: swatch.yellow.line });
  c.addChild(g);
  c.hitArea = new Rectangle(-BOW_W / 2, -BOW_H / 2, BOW_W, BOW_H);
  return c;
}

/** Three small critters watching from a bench, backs to us, seen from behind the floor's edge. */
export function frontRowArt(): { node: Container; critters: Critter[] } {
  const node = new Container();
  const critters: Critter[] = [];
  const bench = new Graphics()
    .roundRect(-180, 10, 360, 34, 12)
    .fill(wood.light)
    .stroke({ width: 3, color: wood.line });
  for (const [i, kind] of (['pig', 'dog', 'cow'] as const).entries()) {
    const c = new Critter(CRITTERS[kind]);
    c.alive = false;
    c.scale.set(0.3);
    c.position.set((i - 1) * 110, 18);
    c.eventMode = 'none';
    critters.push(c);
    node.addChild(c);
  }
  node.addChild(bench);
  node.eventMode = 'none';
  return { node, critters };
}

/** The hub icon: a bunny stick puppet above a little red curtain. Feet on (0, 0). */
export function iconArt(): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-110, -60, 220, 60, 12).fill(CURTAIN_RED.fill).stroke({ width: 4, color: CURTAIN_RED.line });
  g.roundRect(-110, -70, 220, 16, 8).fill(swatch.yellow.fill).stroke({ width: 3, color: swatch.yellow.line });
  const p = puppetArt('bunny');
  p.node.scale.set(0.75);
  p.node.y = -40;
  p.critter.alive = false;
  c.addChild(p.node, g);
  return c;
}

/** The sticker: a puppet peeking over the curtain with its mouth open. */
export function stickerArt(puppet: Puppet): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-130, -130, 260, 260, 24).fill(swatch.blue.light).stroke({ width: 5, color: swatch.blue.line });
  const p = puppetArt(puppet);
  p.node.scale.set(0.9);
  p.node.y = 60;
  p.critter.alive = false;
  p.critter.setMood('sing');
  const curtain = new Graphics()
    .roundRect(-120, 40, 240, 90, 16)
    .fill(CURTAIN_RED.fill)
    .stroke({ width: 4, color: CURTAIN_RED.line });
  curtain.rect(-120, 40, 240, 12).fill(swatch.yellow.fill);
  c.addChild(g, p.node, curtain);
  return c;
}

/** A painted place standing on the floor line at (0, 0): a little house front with a door, a tree, or a pond with reeds. */
export function placeArt(place: Place): Graphics {
  const g = new Graphics();
  if (place === 'door') {
    g.rect(-80, -170, 160, 170).fill(swatch.yellow.light).stroke({ width: 4, color: wood.line });
    g.moveTo(-95, -165)
      .lineTo(0, -225)
      .lineTo(95, -165)
      .closePath()
      .fill(swatch.red.fill)
      .stroke({ width: 4, color: swatch.red.line });
    g.roundRect(-30, -120, 60, 120, 26).fill(wood.fill).stroke({ width: 4, color: wood.line });
    g.circle(16, -58, 5).fill(swatch.yellow.fill);
    g.rect(-70, -150, 30, 30).fill(swatch.blue.light).stroke({ width: 3, color: wood.line });
  } else if (place === 'tree') {
    g.roundRect(-18, -130, 36, 130, 10).fill(wood.fill).stroke({ width: 4, color: wood.line });
    for (const [x, y, r] of [
      [-45, -150, 50],
      [45, -150, 50],
      [0, -195, 58],
      [0, -135, 48],
    ] as const)
      g.circle(x, y, r).fill(swatch.green.fill).stroke({ width: 4, color: swatch.green.line });
    for (const [x, y] of [
      [-30, -170],
      [35, -140],
      [10, -210],
    ] as const)
      g.circle(x, y, 7).fill(swatch.red.fill);
  } else {
    g.ellipse(0, -24, 85, 26).fill(swatch.blue.fill).stroke({ width: 4, color: swatch.blue.line });
    g.ellipse(-20, -28, 40, 8).fill(swatch.blue.light);
    for (const x of [-92, -80, 84, 96])
      g.moveTo(x, -18)
        .quadraticCurveTo(x - 4, -60, x + 2, -80)
        .stroke({ width: 5, color: swatch.green.line, cap: 'round' });
  }
  g.eventMode = 'none';
  return g;
}

export interface CardArt {
  node: Container;
  lift: Container;
  star: Graphics;
}

/** A marquee card: the scene's puppet face beside its place, a speech mark, and dots for its number; a star stamps it when acted. */
export function cardArt(scene: Scene, index: number): CardArt {
  const node = new Container();
  const lift = new Container();
  const g = new Graphics();
  g.roundRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 14)
    .fill(cream)
    .stroke({ width: 4, color: ink });
  const place = placeArt(scene.place);
  place.scale.set(0.24);
  place.position.set(24, 30);
  const face = new Critter(CRITTERS[scene.puppet]);
  face.alive = false;
  face.setMood(scene.voice === 'tiny' ? 'surprised' : 'sing');
  face.scale.set(0.2);
  face.position.set(-30, 30);
  face.eventMode = 'none';
  const marks = new Graphics();
  marks.roundRect(-8, -40, 34, 22, 9).fill(0xffffff).stroke({ width: 3, color: ink });
  marks.moveTo(-2, -20).lineTo(-8, -10).lineTo(6, -19).stroke({ width: 3, color: ink });
  for (let i = 0; i <= index; i++) marks.circle(-CARD_W / 2 + 16 + i * 14, -CARD_H / 2 + 14, 5).fill(ink);
  marks.eventMode = 'none';
  const star = new Graphics()
    .star(CARD_W / 2 - 22, -CARD_H / 2 + 20, 5, 18, 8)
    .fill(swatch.yellow.fill)
    .stroke({ width: 3, color: swatch.yellow.line });
  star.visible = false;
  lift.addChild(g, place, face, marks, star);
  node.addChild(lift);
  node.hitArea = new Rectangle(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H);
  return { node, lift, star };
}

/** A cast puppet waiting under the stage: its head peeks over a dark gap in the apron. The box is the touch. */
export function peekArt(puppet: Puppet): { node: Container; head: Critter } {
  const node = new Container();
  const gap = new Graphics()
    .roundRect(-PEEK_W / 2 + 6, -PEEK_H / 2 + 4, PEEK_W - 12, PEEK_H - 8, 18)
    .fill(0x3a2a1e)
    .stroke({ width: 4, color: wood.line });
  const head = new Critter(CRITTERS[puppet]);
  head.alive = false;
  head.scale.set(0.3);
  head.y = PEEK_H / 2 - 4;
  head.eventMode = 'none';
  const lip = new Graphics()
    .roundRect(-PEEK_W / 2, PEEK_H / 2 - 22, PEEK_W, 22, 8)
    .fill(wood.fill)
    .stroke({ width: 3, color: wood.line });
  const mask = new Graphics().rect(-PEEK_W / 2, -PEEK_H / 2, PEEK_W, PEEK_H - 20).fill(0xffffff);
  head.mask = mask;
  node.addChild(gap, mask, head, lip);
  node.hitArea = new Rectangle(-PEEK_W / 2, -PEEK_H / 2, PEEK_W, PEEK_H);
  return { node, head };
}

/** The end: closed curtains with a star. */
export function endArt(): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-BOW_W / 2, -BOW_H / 2 + 5, BOW_W, BOW_H, 24).fill(CURTAIN_RED.line);
  g.roundRect(-BOW_W / 2, -BOW_H / 2, BOW_W, BOW_H, 24)
    .fill(CURTAIN_RED.fill)
    .stroke({ width: 4, color: CURTAIN_RED.line });
  for (const x of [-30, -12, 12, 30])
    g.moveTo(x, -BOW_H / 2 + 12)
      .quadraticCurveTo(x - 6, 0, x, BOW_H / 2 - 12)
      .stroke({ width: 3, color: CURTAIN_RED.line });
  g.moveTo(0, -BOW_H / 2 + 6)
    .lineTo(0, BOW_H / 2 - 6)
    .stroke({ width: 4, color: swatch.yellow.line });
  g.star(0, 0, 5, 22, 10).fill(swatch.yellow.fill).stroke({ width: 3, color: swatch.yellow.line });
  c.addChild(g);
  c.hitArea = new Rectangle(-BOW_W / 2, -BOW_H / 2, BOW_W, BOW_H);
  return c;
}
