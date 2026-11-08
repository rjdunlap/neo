import { Container, Graphics } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { cream, ink, swatch, wood, grass } from '../../art/palette';
import { prop } from '../../art/props';
import { windowArt } from '../../art/room';
import { musicNote, puffs } from '../../art/shapes';
import type { Friend, Place, Reason, RegionArt, Thing, WantStory, WhyAction } from './logic';
import { STAGE_H, STAGE_W, BUBBLE_W, BUBBLE_H } from './logic';

const line = (color: number, width = 4) => ({ width, color, join: 'round' as const, cap: 'round' as const });

/** A thing about 70 units across, centred on (0, 0). */
export function thingArt(thing: Thing): Container {
  if (thing === 'apple') return prop('apple', 'red');
  if (thing === 'balloon') return prop('balloon', 'purple');
  const c = new Container();
  const g = new Graphics();
  switch (thing) {
    case 'ball':
      g.circle(0, 0, 30).fill(swatch.red.fill).stroke(line(swatch.red.line));
      g.moveTo(-30, 0).quadraticCurveTo(0, 18, 30, 0).stroke(line(0xffffff, 6));
      break;
    case 'kite':
      g.poly([0, -38, 26, 0, 0, 38, -26, 0]).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line));
      g.moveTo(0, -38).lineTo(0, 38).moveTo(-26, 0).lineTo(26, 0).stroke(line(swatch.yellow.line, 3));
      g.moveTo(0, 38).quadraticCurveTo(14, 50, 4, 62).stroke(line(swatch.red.fill, 3));
      break;
    case 'cup':
      g.circle(24, 0, 12).stroke(line(swatch.blue.line, 7));
      g.roundRect(-26, -24, 50, 48, 10).fill(swatch.blue.fill).stroke(line(swatch.blue.line));
      g.ellipse(-1, -24, 25, 6).fill(swatch.blue.light).stroke(line(swatch.blue.line, 3));
      break;
    case 'book':
      g.roundRect(-30, -24, 60, 48, 6).fill(swatch.green.fill).stroke(line(swatch.green.line));
      g.rect(-30, 14, 60, 10).fill(cream);
      g.moveTo(-18, -10).lineTo(18, -10).stroke(line(swatch.green.line, 3));
      break;
    case 'drum':
      g.roundRect(-30, -16, 60, 36, 6).fill(swatch.red.fill).stroke(line(swatch.red.line));
      g.ellipse(0, -16, 30, 10).fill(cream).stroke(line(swatch.red.line));
      for (const x of [-18, 0, 18])
        g.moveTo(x, -6)
          .lineTo(x + 8, 18)
          .stroke(line(swatch.yellow.fill, 3));
      break;
    case 'boat':
      g.poly([-34, 4, 34, 4, 22, 22, -22, 22]).fill(swatch.red.fill).stroke(line(swatch.red.line));
      g.moveTo(0, 4).lineTo(0, -34).stroke(line(wood.line, 4));
      g.poly([3, -32, 26, -4, 3, -4]).fill(0xffffff).stroke(line(swatch.white.line, 3));
      break;
    case 'teddy':
      g.circle(-16, -26, 9).circle(16, -26, 9).fill(swatch.brown.fill).stroke(line(swatch.brown.line, 3));
      g.ellipse(0, 18, 22, 20).fill(swatch.brown.fill).stroke(line(swatch.brown.line, 3));
      g.circle(0, -12, 20).fill(swatch.brown.fill).stroke(line(swatch.brown.line, 3));
      g.circle(-7, -15, 3).circle(7, -15, 3).circle(0, -6, 3.5).fill(ink);
      break;
    case 'shell':
      g.moveTo(0, 22)
        .lineTo(-32, -6)
        .quadraticCurveTo(0, -42, 32, -6)
        .closePath()
        .fill(swatch.pink.light)
        .stroke(line(swatch.pink.line));
      for (const x of [-18, -6, 6, 18])
        g.moveTo(0, 22)
          .lineTo(x * 1.2, -18)
          .stroke(line(swatch.pink.line, 3));
      break;
  }
  c.addChild(g);
  return c;
}

/** A place about 120 units across, centred on (0, 0). */
export function placeArt(place: Place): Container {
  const c = new Container();
  const g = new Graphics();
  if (place === 'redBox') {
    g.roundRect(-54, -30, 108, 60, 8).fill(swatch.red.fill).stroke(line(swatch.red.line, 5));
    g.rect(-58, -38, 116, 14).fill(swatch.red.light).stroke(line(swatch.red.line, 4));
  } else if (place === 'blueBasket') {
    g.arc(0, -16, 44, Math.PI, 0).stroke(line(swatch.blue.line, 7));
    g.poly([-56, -16, 56, -16, 44, 32, -44, 32]).fill(swatch.blue.fill).stroke(line(swatch.blue.line, 5));
    for (const y of [0, 16]) g.moveTo(-50, y).lineTo(50, y).stroke(line(swatch.blue.light, 3));
  } else {
    g.rect(-60, 8, 120, 14).fill(wood.fill).stroke(line(wood.line, 4));
    g.poly([-48, 22, -36, 22, -48, 40]).poly([48, 22, 36, 22, 48, 40]).fill(wood.line);
  }
  c.addChild(g);
  return c;
}

/** A reason picture about 90 units across, centred on (0, 0): never words. */
export function reasonArt(reason: Reason): Container {
  const c = new Container();
  const g = new Graphics();
  switch (reason) {
    case 'rain':
      puffs(
        g,
        [
          [-18, -8, 20],
          [8, -16, 24],
          [28, -4, 16],
          [0, 4, 18],
        ],
        0x9aa7b8,
        0x6b7787,
        5,
      );
      for (const x of [-18, 0, 18])
        g.moveTo(x, 26)
          .lineTo(x - 6, 40)
          .stroke(line(swatch.blue.fill, 5));
      break;
    case 'cold':
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI) / 3;
        g.moveTo(Math.cos(a) * -34, Math.sin(a) * -34).lineTo(Math.cos(a) * 34, Math.sin(a) * 34);
      }
      g.stroke(line(swatch.blue.line, 7));
      break;
    case 'visitor': {
      const bunny = new Critter(CRITTERS.bunny);
      bunny.alive = false;
      bunny.scale.set(0.32);
      bunny.y = 40;
      c.addChild(bunny);
      return c;
    }
    case 'sleeping':
      g.circle(0, 0, 34).fill(swatch.yellow.light).stroke(line(swatch.yellow.line));
      g.arc(-13, -4, 8, 0.2, Math.PI - 0.2).arc(13, -4, 8, 0.2, Math.PI - 0.2);
      g.stroke(line(ink, 4));
      g.moveTo(24, -40).lineTo(36, -40).lineTo(24, -28).lineTo(36, -28).stroke(line(swatch.blue.line, 3));
      break;
    case 'birthday':
      g.roundRect(-34, -6, 68, 38, 6).fill(swatch.pink.light).stroke(line(swatch.pink.line));
      g.rect(-34, 6, 68, 8).fill(swatch.pink.fill);
      for (const x of [-16, 0, 16]) {
        g.rect(x - 3, -26, 6, 20).fill(swatch.blue.fill);
        g.ellipse(x, -32, 4, 7).fill(swatch.orange.fill);
      }
      break;
    case 'droopy':
      g.ellipse(0, 36, 34, 8).fill(wood.fill);
      droopyFlower(g, -10, 36, 1.8);
      break;
    case 'bedtime':
      g.circle(0, 0, 32).fill(0xfff3c4).stroke(line(0xe6cf8e));
      g.circle(14, -10, 28).fill(cream);
      g.circle(22, 24, 4).circle(-28, -26, 3).fill(swatch.yellow.fill);
      break;
    case 'thirsty':
      g.moveTo(0, -38)
        .quadraticCurveTo(30, 6, 22, 18)
        .arc(0, 14, 24, 0.17, Math.PI - 0.17)
        .quadraticCurveTo(-30, 6, 0, -38)
        .fill(swatch.blue.light)
        .stroke(line(swatch.blue.line, 5));
      break;
    case 'beach':
      g.circle(-14, -12, 20).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line));
      g.poly([4, 4, 40, 4, 34, 38, 10, 38]).fill(swatch.red.fill).stroke(line(swatch.red.line));
      g.arc(22, 4, 14, Math.PI, 0).stroke(line(swatch.red.line, 4));
      break;
    case 'dance':
      musicNote(g, 70, swatch.purple.fill);
      break;
    case 'bath':
      for (const [x, y, r] of [
        [-14, 10, 18],
        [14, -6, 14],
        [16, 22, 10],
        [-6, -22, 9],
      ] as const)
        g.circle(x, y, r);
      g.fill({ color: swatch.teal.light, alpha: 0.9 }).stroke(line(swatch.teal.line, 4));
      break;
    case 'hungry':
      g.ellipse(0, 10, 40, 14).fill(cream).stroke(line(swatch.orange.line));
      g.ellipse(0, 4, 32, 8).fill(swatch.orange.light);
      break;
  }
  c.addChild(g);
  return c;
}

/** A droopy flower: the stem bent and the head hanging. */
function droopyFlower(g: Graphics, x: number, y: number, s = 1) {
  g.moveTo(x, y)
    .quadraticCurveTo(x, y - 40 * s, x + 18 * s, y - 30 * s)
    .stroke(line(swatch.green.line, 4));
  g.circle(x + 20 * s, y - 22 * s, 9 * s)
    .fill(swatch.pink.fill)
    .stroke(line(swatch.pink.line, 3));
}

/** The room behind every story: wall, floor and skirting, 640 × 400. */
export function roomArt(outdoor = false): Graphics {
  const g = new Graphics();
  if (outdoor) {
    g.rect(0, 0, STAGE_W, STAGE_H).fill(swatch.blue.light);
    g.rect(0, 290, STAGE_W, 110).fill(grass);
  } else {
    g.rect(0, 0, STAGE_W, STAGE_H).fill(0xf6e6c8);
    g.rect(0, 290, STAGE_W, 110).fill(wood.light);
    g.rect(0, 284, STAGE_W, 10).fill(wood.fill);
  }
  g.roundRect(0, 0, STAGE_W, STAGE_H, 18).stroke(line(wood.line, 8));
  return g;
}

/** Each level-1 scene's furniture. */
export function wantSceneArt(story: WantStory): Container {
  const indoor = story.scene === 'table' || story.scene === 'shelf' || story.scene === 'bed';
  const c = new Container();
  c.addChild(roomArt(!indoor));
  const g = new Graphics();
  switch (story.scene) {
    case 'tree':
      g.rect(370, 190, 34, 110).fill(wood.fill).stroke(line(wood.line));
      puffs(
        g,
        [
          [390, 140, 70],
          [330, 170, 46],
          [450, 170, 46],
        ],
        swatch.green.fill,
        swatch.green.line,
        5,
      );
      break;
    case 'table':
      g.rect(200, 280, 360, 16).fill(wood.fill).stroke(line(wood.line));
      for (const x of [214, 540]) g.rect(x, 296, 12, 80).fill(wood.line);
      break;
    case 'pond':
      g.ellipse(470, 350, 150, 44).fill(swatch.blue.fill).stroke(line(swatch.blue.line));
      g.rect(296, 150, 8, 150).fill(wood.line);
      g.moveTo(300, 165).lineTo(300, 160).stroke(line(ink, 2));
      break;
    case 'shelf':
      for (const y of [140, 230]) g.rect(360, y, 140, 12).fill(wood.fill).stroke(line(wood.line));
      g.roundRect(390, 340, 60, 40, 6).fill(wood.fill).stroke(line(wood.line));
      break;
    case 'bush':
      puffs(
        g,
        [
          [380, 210, 60],
          [330, 250, 46],
          [430, 250, 46],
        ],
        swatch.green.fill,
        swatch.green.line,
        5,
      );
      for (let x = 470; x < 620; x += 30) g.rect(x, 250, 10, 60).fill(wood.light).stroke(line(wood.line, 3));
      g.rect(460, 262, 170, 10).fill(wood.light).stroke(line(wood.line, 3));
      break;
    case 'bed':
      g.roundRect(290, 250, 300, 50, 12).fill(swatch.blue.light).stroke(line(swatch.blue.line));
      g.rect(290, 300, 12, 80).rect(578, 300, 12, 80).fill(wood.line);
      g.roundRect(530, 230, 60, 28, 10).fill(0xffffff).stroke(line(swatch.white.line, 3));
      break;
  }
  c.addChild(g);
  return c;
}

/** The cottage room for level 2: the door on the left, the window at the back, the shelf on the right wall. */
export const DOOR = { x: 30, y: 150, w: 100, h: 140 };
export const WINDOW_AT = { x: 330, y: 110, r: 62 };
export const PLACE_AT: Record<Place, { x: number; y: number }> = {
  redBox: { x: 230, y: 340 },
  blueBasket: { x: 430, y: 340 },
  shelf: { x: 560, y: 200 },
};

export function doorArt(open: boolean, outside: 'sun' | 'droopy' | null = null): Graphics {
  const g = new Graphics();
  const d = DOOR;
  g.rect(d.x - 8, d.y - 8, d.w + 16, d.h + 8).fill(wood.line);
  if (open) {
    g.rect(d.x, d.y, d.w, d.h).fill(outside === 'droopy' ? grass : 0xfff3b0);
    if (outside === 'sun') g.circle(d.x + d.w / 2, d.y + 34, 20).fill(swatch.yellow.fill);
    if (outside === 'droopy')
      for (const x of [d.x + 26, d.x + 52, d.x + 76]) droopyFlower(g, x, d.y + d.h - 6);
    g.poly([d.x, d.y, d.x - 22, d.y + 12, d.x - 22, d.y + d.h + 4, d.x, d.y + d.h])
      .fill(wood.fill)
      .stroke(line(wood.line, 3));
  } else {
    g.rect(d.x, d.y, d.w, d.h).fill(wood.fill).stroke(line(wood.line, 3));
    g.circle(d.x + d.w - 18, d.y + d.h / 2, 6).fill(swatch.yellow.fill);
  }
  return g;
}

export function lookRoomArt(): Container {
  const c = new Container();
  c.addChild(roomArt(false));
  const shelf = placeArt('shelf');
  shelf.position.set(PLACE_AT.shelf.x, PLACE_AT.shelf.y);
  const win = windowArt(WINDOW_AT.r);
  win.position.set(WINDOW_AT.x, WINDOW_AT.y);
  c.addChild(win, shelf);
  for (const p of ['redBox', 'blueBasket'] as const) {
    const a = placeArt(p);
    a.position.set(PLACE_AT[p].x, PLACE_AT[p].y);
    c.addChild(a);
  }
  return c;
}

/** A level-3 region's picture, drawn in its slot rectangle (stage units). */
export function regionArt(id: RegionArt, b: { x: number; y: number; w: number; h: number }): Container {
  const c = new Container();
  const g = new Graphics();
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  const pane = (sky: number) => {
    g.roundRect(b.x + 10, b.y + 6, b.w - 20, b.h - 12, 10)
      .fill(sky)
      .stroke(line(wood.line, 8));
  };
  const bars = () =>
    g
      .moveTo(cx, b.y + 6)
      .lineTo(cx, b.y + b.h - 6)
      .moveTo(b.x + 10, cy)
      .lineTo(b.x + b.w - 10, cy)
      .stroke(line(wood.line, 6));
  switch (id) {
    case 'clouds':
      pane(0xbfd6ea);
      puffs(
        g,
        [
          [cx - 30, cy - 20, 26],
          [cx + 4, cy - 30, 30],
          [cx + 40, cy - 14, 22],
        ],
        0x7d8999,
        0x5b6573,
        4,
      );
      bars();
      break;
    case 'sunny':
      pane(swatch.blue.light);
      g.circle(cx - 36, cy - 26, 22).fill(swatch.yellow.fill);
      bars();
      break;
    case 'snow':
      pane(0xd7e2ee);
      for (let i = 0; i < 14; i++)
        g.circle(b.x + 24 + ((i * 47) % (b.w - 48)), b.y + 18 + ((i * 31) % (b.h - 36)), 5).fill(0xffffff);
      bars();
      break;
    case 'friendPath': {
      pane(swatch.blue.light);
      g.poly([cx - 10, b.y + b.h - 6, cx + 10, b.y + b.h - 6, cx + 40, cy, cx + 30, cy]).fill(wood.light);
      const bunny = new Critter(CRITTERS.bunny);
      bunny.alive = false;
      bunny.scale.set(0.24);
      bunny.position.set(cx + 34, cy + 40);
      c.addChild(g, bunny);
      const bars2 = new Graphics();
      bars2
        .moveTo(cx, b.y + 6)
        .lineTo(cx, b.y + b.h - 6)
        .stroke(line(wood.line, 6));
      c.addChild(bars2);
      return c;
    }
    case 'sunDoor':
    case 'droopyDoor':
      c.addChild(doorArtIn(b, id === 'sunDoor' ? 'sun' : 'droopy'));
      return c;
    case 'coatHook':
      g.rect(cx - 50, b.y + 40, 100, 12)
        .fill(wood.fill)
        .stroke(line(wood.line, 3));
      g.poly([cx - 30, b.y + 52, cx - 4, b.y + 52, cx + 6, b.y + 170, cx - 46, b.y + 170])
        .fill(swatch.red.fill)
        .stroke(line(swatch.red.line));
      g.roundRect(cx + 10, b.y + 52, 34, 70, 10)
        .fill(swatch.blue.fill)
        .stroke(line(swatch.blue.line));
      break;
    case 'toyBox':
      g.roundRect(b.x + 10, b.y + 50, b.w - 20, 70, 8)
        .fill(swatch.yellow.fill)
        .stroke(line(swatch.yellow.line));
      g.circle(cx - 14, b.y + 44, 14)
        .fill(swatch.red.fill)
        .circle(cx + 20, b.y + 40, 10)
        .fill(swatch.blue.fill);
      break;
    case 'chair':
      g.rect(b.x + 20, b.y + 10, 12, 110)
        .rect(b.x + b.w - 32, b.y + 70, 12, 50)
        .fill(wood.line);
      g.rect(b.x + 20, b.y + 66, b.w - 40, 12)
        .fill(wood.fill)
        .stroke(line(wood.line, 3));
      break;
    case 'doormat':
      g.roundRect(b.x + 6, b.y + b.h - 40, b.w - 12, 30, 6)
        .fill(swatch.green.fill)
        .stroke(line(swatch.green.line));
      break;
    case 'plant':
      g.poly([cx - 26, b.y + 80, cx + 26, b.y + 80, cx + 18, b.y + 124, cx - 18, b.y + 124])
        .fill(swatch.orange.fill)
        .stroke(line(swatch.orange.line));
      for (const dx of [-22, 0, 22])
        g.ellipse(cx + dx, b.y + 50, 12, 30)
          .fill(swatch.green.fill)
          .stroke(line(swatch.green.line, 3));
      break;
    case 'vase':
      g.rect(b.x + 20, b.y + b.h - 26, b.w - 40, 10).fill(wood.fill);
      for (const dx of [-22, 0, 22])
        g.moveTo(cx, b.y + 72)
          .lineTo(cx + dx, b.y + 40)
          .stroke(line(swatch.green.line, 3));
      for (const [dx, col] of [
        [-22, swatch.red],
        [0, swatch.yellow],
        [22, swatch.purple],
      ] as const)
        g.circle(cx + dx, b.y + 36, 11)
          .fill(col.fill)
          .stroke(line(col.line, 3));
      g.roundRect(cx - 18, b.y + 70, 36, 46, 12)
        .fill(swatch.blue.fill)
        .stroke(line(swatch.blue.line));
      break;
    case 'kettle':
      g.rect(b.x + 20, b.y + b.h - 26, b.w - 40, 10).fill(wood.fill);
      g.ellipse(cx, b.y + 90, 40, 28)
        .fill(swatch.red.fill)
        .stroke(line(swatch.red.line));
      g.moveTo(cx + 36, b.y + 86)
        .lineTo(cx + 58, b.y + 70)
        .stroke(line(swatch.red.line, 7));
      g.arc(cx, b.y + 64, 22, Math.PI, 0).stroke(line(ink, 4));
      break;
    case 'lamp':
      g.rect(cx - 4, b.y + 70, 8, 56).fill(ink);
      g.poly([cx - 34, b.y + 72, cx + 34, b.y + 72, cx + 20, b.y + 30, cx - 20, b.y + 30])
        .fill(swatch.yellow.light)
        .stroke(line(swatch.yellow.line));
      g.ellipse(cx, b.y + 126, 26, 8).fill(ink);
      break;
    case 'cake': {
      g.rect(b.x + 20, b.y + b.h - 26, b.w - 40, 10).fill(wood.fill);
      const cake = reasonArt('birthday');
      cake.scale.set(1.2);
      cake.position.set(cx, b.y + 90);
      c.addChild(g, cake);
      return c;
    }
    case 'rug':
      g.ellipse(cx, b.y + b.h - 40, b.w / 2 - 6, 30)
        .fill(swatch.purple.light)
        .stroke(line(swatch.purple.line));
      g.ellipse(cx, b.y + b.h - 40, b.w / 2 - 30, 16).stroke(line(swatch.purple.fill, 3));
      break;
    case 'cot': {
      g.roundRect(b.x + 14, b.y + 50, b.w - 28, 60, 10)
        .fill(swatch.blue.light)
        .stroke(line(swatch.blue.line));
      for (let x = b.x + 24; x < b.x + b.w - 20; x += 20) g.moveTo(x, b.y + 50).lineTo(x, b.y + 110);
      g.stroke(line(swatch.blue.line, 3));
      g.rect(b.x + 14, b.y + 110, 10, 24)
        .rect(b.x + b.w - 24, b.y + 110, 10, 24)
        .fill(wood.line);
      const duckling = new Critter(CRITTERS.duck);
      duckling.alive = false;
      duckling.setMood('sleepy');
      duckling.scale.set(0.2);
      duckling.position.set(cx, b.y + 96);
      c.addChild(g, duckling);
      const z = new Graphics()
        .moveTo(cx + 34, b.y + 14)
        .lineTo(cx + 50, b.y + 14)
        .lineTo(cx + 34, b.y + 30)
        .lineTo(cx + 50, b.y + 30)
        .stroke(line(swatch.blue.line, 3));
      c.addChild(z);
      return c;
    }
    case 'bucket':
      g.poly([cx - 34, b.y + 70, cx + 34, b.y + 70, cx + 26, b.y + 124, cx - 26, b.y + 124])
        .fill(swatch.red.fill)
        .stroke(line(swatch.red.line));
      g.arc(cx, b.y + 70, 30, Math.PI, 0).stroke(line(swatch.red.line, 4));
      g.rect(cx + 34, b.y + 90, 40, 10).fill(swatch.yellow.fill);
      break;
  }
  c.addChild(g);
  return c;
}

/** The door filling the left slot, open, with sunshine or droopy flowers outside. */
function doorArtIn(b: { x: number; y: number; w: number; h: number }, outside: 'sun' | 'droopy'): Graphics {
  const g = new Graphics();
  g.rect(b.x + 10, b.y + 20, b.w - 20, b.h - 20).fill(wood.line);
  g.rect(b.x + 18, b.y + 28, b.w - 36, b.h - 28).fill(outside === 'droopy' ? grass : 0xfff3b0);
  if (outside === 'sun') g.circle(b.x + b.w / 2, b.y + 70, 24).fill(swatch.yellow.fill);
  else for (const x of [b.x + 34, b.x + 64, b.x + 94]) droopyFlower(g, x, b.y + b.h - 10, 1.2);
  return g;
}

/** The level-3 room: wall and floor, with each region drawn in its slot. */
export function whyRoomArt(
  regions: { id: RegionArt; rect: { x: number; y: number; w: number; h: number } }[],
): Container {
  const c = new Container();
  c.addChild(roomArt(false));
  for (const r of regions) c.addChild(regionArt(r.id, r.rect));
  return c;
}

/** What the friend does, drawn with the friend in body coordinates (feet at (0, 0), scale 1). */
export function actionArt(action: WhyAction): Container | null {
  const g = new Graphics();
  switch (action) {
    case 'umbrella':
      g.moveTo(150, -90).lineTo(150, -330).stroke(line(ink, 8));
      g.arc(150, -330, 110, Math.PI, 0).closePath().fill(swatch.red.fill).stroke(line(swatch.red.line, 8));
      g.arc(150, -90, 18, 0, Math.PI).stroke(line(ink, 8));
      break;
    case 'cups':
      for (const x of [170, 250]) {
        g.roundRect(x - 30, -170, 60, 56, 10)
          .fill(swatch.blue.fill)
          .stroke(line(swatch.blue.line, 6));
      }
      g.rect(120, -114, 190, 16).fill(wood.fill).stroke(line(wood.line, 5));
      break;
    case 'scarf':
      g.roundRect(-110, -110, 220, 40, 18).fill(swatch.red.fill).stroke(line(swatch.red.line, 6));
      g.roundRect(40, -86, 40, 110, 14).fill(swatch.red.fill).stroke(line(swatch.red.line, 6));
      for (const x of [-140, 140])
        g.circle(x, -60, 30).fill(swatch.blue.fill).stroke(line(swatch.blue.line, 6));
      break;
    case 'present':
      g.roundRect(110, -160, 140, 120, 10).fill(swatch.purple.fill).stroke(line(swatch.purple.line, 6));
      g.rect(170, -160, 20, 120).rect(110, -110, 140, 20).fill(swatch.yellow.fill);
      g.ellipse(160, -176, 26, 16)
        .ellipse(200, -176, 26, 16)
        .fill(swatch.yellow.fill)
        .stroke(line(swatch.yellow.line, 5));
      break;
    case 'watering':
      g.roundRect(120, -170, 120, 100, 20).fill(swatch.green.fill).stroke(line(swatch.green.line, 6));
      g.moveTo(240, -140).lineTo(320, -200).stroke(line(swatch.green.line, 14));
      g.arc(180, -170, 44, Math.PI, 0).stroke(line(swatch.green.line, 8));
      break;
    case 'tiptoe':
      return null;
  }
  const c = new Container();
  c.addChild(g);
  return c;
}

/** The reaching arm and paw, in body coordinates from the shoulder, pointing `angle` degrees (0 right, negative up). */
export function reachArm(color: { fill: number; line: number }, angle: number): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(0, -18, 130, 36, 18).fill(color.fill).stroke(line(color.line, 6));
  g.circle(130, 0, 26).fill(color.fill).stroke(line(color.line, 6));
  c.addChild(g);
  c.rotation = (angle * Math.PI) / 180;
  return c;
}

/** The thought bubble: a cloud of BUBBLE_W × BUBBLE_H centred on (0, 0). `lit` brightens its edge. */
export function bubbleArt(g: Graphics, lit: boolean): Graphics {
  const w = BUBBLE_W / 2;
  const h = BUBBLE_H / 2;
  g.clear();
  puffs(
    g,
    [
      [-w * 0.55, -h * 0.2, h * 0.7],
      [0, -h * 0.35, h * 0.8],
      [w * 0.55, -h * 0.15, h * 0.7],
      [-w * 0.3, h * 0.3, h * 0.6],
      [w * 0.3, h * 0.3, h * 0.6],
    ],
    0xffffff,
    lit ? swatch.yellow.fill : swatch.white.line,
    lit ? 10 : 6,
  );
  return g;
}

/** A friend for the stage, alive and at story scale. */
export function friendNode(name: Friend): Critter {
  const c = new Critter(CRITTERS[name]);
  c.scale.set(0.45);
  c.eventMode = 'none';
  return c;
}

/** A cream card, CARD_W × CARD_H, centred on (0, 0), holding a picture. */
export function cardFace(picture: Container, w: number, h: number): Container {
  const c = new Container();
  const g = new Graphics()
    .roundRect(-w / 2, -h / 2, w, h, 18)
    .fill(cream)
    .stroke(line(wood.line, 5));
  picture.scale.set(
    Math.min(1.3, 100 / Math.max(80, picture.width), 110 / Math.max(80, picture.height)) || 1,
  );
  c.addChild(g, picture);
  return c;
}
