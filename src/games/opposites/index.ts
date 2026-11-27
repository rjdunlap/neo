import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { ink, swatch, wood } from '../../art/palette';
import { starPoints } from '../../art/shapes';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import { spread, type View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { FONT } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  BIG_LEVEL,
  ONE_PAIR_LEVEL,
  CONCEPTS,
  LEVELS,
  STICKER_CONCEPTS,
  cardToTap,
  inTurn,
  makeRounds,
  opposites,
  planFor,
  word,
  type Card,
  type Concept,
  type Gradable,
  type OppPlan,
  type OppRound,
  type TwoWord,
  unParts,
} from './logic';

/** Level 6's one big card, about 290 units across. */
const BIG_SCALE = 1.7;
/** Level 6's flipped pictures, small in the row along the bottom (about 75 units across). */
const ROW_SCALE = 0.44;
/** Level 8's cards: as large as the two rows leave room for (about 1.1 sideways, 1.04 upright). */
const ORDER_SCALE = 1.1;
/** The corner guide's square at the bottom left, which level 8's line stays above. */
const GUIDE_CLEAR = 210;

/** Level 7's three cards, larger in the open middle of the screen: up to about 240 units across. */
const BETWEEN_SCALE = 1.4;
/** Level 10's two cards: larger, since there are only two (about 220 units across, 320 on an upright phone). */
const UN_SCALE = 1.3;
const UN_TALL_SCALE = 1.9;
/** Level 10's printed word grows on an upright phone, where the view is tall and every unit is small on screen. */
const UN_TALL_WORD = 1.5;

/** Level 11's four cards: one row on a wide view, two by two on an upright phone (each as large as the room leaves). */
const TWO_SCALE = 1.25;
const TWO_TALL_SCALE = 1.5;

/** Level 7's middle pictures: the same cup, mug, sky and balloon as the two sides, with the in-between amount. */
function middle(concept: Gradable): Container {
  const c = new Container();
  const g = new Graphics();
  switch (concept) {
    case 'cup':
      // The same glass, filled to half way.
      g.moveTo(-36, -50)
        .lineTo(36, -50)
        .lineTo(28, 56)
        .lineTo(-28, 56)
        .closePath()
        .fill({ color: 0xdff3ff, alpha: 0.6 })
        .stroke({ width: 5, color: swatch.blue.line });
      g.moveTo(-31, 12).lineTo(31, 12).lineTo(28, 54).lineTo(-28, 54).closePath().fill(swatch.orange.fill);
      break;
    case 'temp':
      // Warm: the hot mug's shape in a softer orange, with one small curl of steam instead of three tall ones.
      g.roundRect(-36, -14, 64, 64, 12)
        .fill(swatch.orange.fill)
        .stroke({ width: 4, color: swatch.orange.line });
      g.moveTo(28, 0).bezierCurveTo(56, 0, 56, 34, 28, 34).stroke({ width: 8, color: swatch.orange.line });
      g.moveTo(-4, -22).quadraticCurveTo(4, -32, -4, -42).stroke({ width: 5, color: 0xb9c6d1, cap: 'round' });
      break;
    case 'sky':
      // Evening: a peach sky and the sun half down behind the hill.
      g.roundRect(-64, -64, 128, 128, 18).fill(0xf6b38a);
      g.circle(0, 30, 28).fill(swatch.orange.fill).stroke({ width: 4, color: swatch.orange.line });
      g.roundRect(-64, 30, 128, 34, 18).fill(0x7a5a8c).rect(-64, 30, 128, 14).fill(0x7a5a8c);
      break;
    case 'height':
      // The same balloon and ground, held half way, with a level mark beside it instead of an arrow.
      g.moveTo(0, 27).quadraticCurveTo(10, 44, 0, 60).stroke({ width: 3, color: ink, alpha: 0.6 });
      g.ellipse(0, -3, 26, 32)
        .fill(swatch.red.fill)
        .stroke({ width: 4, color: swatch.red.line })
        .ellipse(-8, -15, 6, 9)
        .fill({ color: 0xffffff, alpha: 0.6 });
      g.rect(-60, 60, 120, 6).fill(swatch.green.fill);
      g.moveTo(38, -3).lineTo(58, -3).stroke({ width: 8, color: swatch.blue.fill, cap: 'round' });
      break;
  }
  c.addChild(g);
  return c;
}

/**
 * Level 10's un- pictures: the same thing in both, done (side 0: zipped, tied, locked, wrapped, buttoned, folded) or
 * undone (side 1, the un- word). About 140 units square, centered on (0, 0), like every other picture.
 */
function unPicture(concept: Concept, side: 0 | 1): Graphics {
  const g = new Graphics();
  const done = side === 0;
  switch (concept) {
    case 'zip': {
      // A pencil bag: zipped, the track runs shut with its pull at the right; unzipped, the top gapes open.
      g.roundRect(-60, -24, 120, 76, 22).fill(swatch.blue.fill).stroke({ width: 5, color: swatch.blue.line });
      if (done) {
        g.moveTo(-50, -12).lineTo(50, -12).stroke({ width: 6, color: ink, alpha: 0.7 });
        for (let x = -46; x <= 46; x += 8)
          g.moveTo(x, -17).lineTo(x, -7).stroke({ width: 3, color: 0xdddddd });
        g.roundRect(44, -10, 12, 26, 4)
          .fill(swatch.yellow.fill)
          .stroke({ width: 3, color: swatch.yellow.line });
      } else {
        g.ellipse(0, -14, 52, 20).fill(ink).stroke({ width: 4, color: swatch.blue.line });
        for (let x = -42; x <= 42; x += 8) {
          const dy = 18 * Math.sqrt(1 - (x / 52) ** 2);
          g.moveTo(x, -14 - dy - 4)
            .lineTo(x, -14 - dy + 4)
            .stroke({ width: 3, color: 0xdddddd });
          g.moveTo(x, -14 + dy - 4)
            .lineTo(x, -14 + dy + 4)
            .stroke({ width: 3, color: 0xdddddd });
        }
        g.roundRect(-62, -12, 12, 26, 4)
          .fill(swatch.yellow.fill)
          .stroke({ width: 3, color: swatch.yellow.line });
      }
      break;
    }
    case 'tie': {
      // A shoe: tied, a bow on top; untied, the two laces trail down to the ground.
      g.rect(-66, 54, 132, 6).fill(swatch.green.fill);
      g.moveTo(-58, 50)
        .lineTo(-58, 8)
        .quadraticCurveTo(-56, -14, -30, -16)
        .lineTo(-6, -16)
        .quadraticCurveTo(10, 10, 40, 14)
        .quadraticCurveTo(62, 18, 62, 40)
        .lineTo(62, 50)
        .closePath()
        .fill(swatch.red.fill)
        .stroke({ width: 5, color: swatch.red.line, join: 'round' });
      g.roundRect(-62, 42, 128, 12, 6).fill(0xffffff).stroke({ width: 3, color: swatch.red.line });
      for (const [x, y] of [
        [-18, -6],
        [-4, 4],
        [10, 12],
      ])
        g.moveTo(x - 8, y - 4)
          .lineTo(x + 8, y + 4)
          .stroke({ width: 4, color: 0xffffff, cap: 'round' });
      if (done) {
        const lace = { width: 5, color: swatch.blue.line, cap: 'round' } as const;
        g.ellipse(-20, -30, 16, 10).stroke(lace);
        g.ellipse(14, -30, 16, 10).stroke(lace);
        g.moveTo(-6, -22).quadraticCurveTo(-14, -6, -22, -2).stroke(lace);
        g.moveTo(0, -22).quadraticCurveTo(10, -8, 18, -4).stroke(lace);
        g.circle(-3, -26, 6).fill(0xffffff).stroke({ width: 2, color: ink, alpha: 0.4 });
      } else {
        const lace = { width: 5, color: swatch.blue.line, cap: 'round' } as const;
        g.moveTo(-6, -10).quadraticCurveTo(-40, 10, -48, 36).quadraticCurveTo(-52, 50, -68, 52).stroke(lace);
        g.moveTo(6, 8).quadraticCurveTo(30, 40, 50, 56).quadraticCurveTo(60, 62, 68, 58).stroke(lace);
      }
      break;
    }
    case 'lock': {
      // A padlock: locked, the loop goes down into the body; unlocked, it springs up and swings open.
      if (done)
        g.moveTo(-26, -6)
          .lineTo(-26, -30)
          .arc(0, -30, 26, Math.PI, 0)
          .lineTo(26, -6)
          .stroke({ width: 12, color: 0x9aa4ad, cap: 'round' });
      else
        g.moveTo(-26, -6)
          .lineTo(-26, -50)
          .arc(0, -50, 26, Math.PI, 0)
          .lineTo(26, -36)
          .stroke({ width: 12, color: 0x9aa4ad, cap: 'round' });
      g.roundRect(-46, -8, 92, 70, 14)
        .fill(swatch.yellow.fill)
        .stroke({ width: 5, color: swatch.yellow.line });
      if (!done) g.circle(26, -6, 8).fill(ink);
      g.circle(0, 18, 9).fill(ink).rect(-4, 20, 8, 20).fill(ink);
      break;
    }
    case 'wrap': {
      // A present: wrapped, paper, ribbon and bow; unwrapped, a plain box with the torn paper beside it.
      if (done) {
        g.roundRect(-50, -26, 100, 84, 8)
          .fill(swatch.purple.fill)
          .stroke({ width: 5, color: swatch.purple.line });
        g.rect(-8, -26, 16, 84).fill(swatch.yellow.fill).rect(-50, 8, 100, 14).fill(swatch.yellow.fill);
        g.ellipse(-16, -36, 16, 11).fill(swatch.yellow.fill).stroke({ width: 4, color: swatch.yellow.line });
        g.ellipse(16, -36, 16, 11).fill(swatch.yellow.fill).stroke({ width: 4, color: swatch.yellow.line });
        g.circle(0, -32, 8).fill(swatch.yellow.line);
      } else {
        g.poly([-66, 58, -54, 30, -30, 40, -18, 26, -2, 46, 8, 58])
          .fill(swatch.purple.fill)
          .stroke({ width: 4, color: swatch.purple.line, join: 'round' });
        g.moveTo(-56, 44).quadraticCurveTo(-40, 30, -26, 50).stroke({ width: 5, color: swatch.yellow.fill });
        g.roundRect(-14, -20, 76, 70, 6).fill(wood.light).stroke({ width: 5, color: wood.line });
        g.moveTo(-14, 0).lineTo(62, 0).stroke({ width: 3, color: wood.line, alpha: 0.6 });
        g.poly([-14, -20, -28, -42, 50, -42, 62, -20]).fill(wood.fill).stroke({ width: 4, color: wood.line });
      }
      break;
    }
    case 'button': {
      // A coat: buttoned, its two sides meet down the middle; unbuttoned, they part, the buttons on one side only.
      const gap = done ? 0 : 18;
      g.poly([-56, -40, -20, -54, 0, -36, 20, -54, 56, -40, 60, 60, -60, 60])
        .fill(done ? swatch.green.fill : swatch.yellow.light)
        .stroke({ width: 5, color: swatch.green.line, join: 'round' });
      g.poly([-56, -40, -20, -54, -gap, -36, -gap, 60, -60, 60]).fill(swatch.green.fill);
      g.poly([56, -40, 20, -54, gap, -36, gap, 60, 60, 60]).fill(swatch.green.fill);
      g.poly([-56, -40, -20, -54, 0, -36, 20, -54, 56, -40, 60, 60, -60, 60]).stroke({
        width: 5,
        color: swatch.green.line,
        join: 'round',
      });
      if (!done)
        g.moveTo(-gap, -36)
          .lineTo(-gap, 60)
          .moveTo(gap, -36)
          .lineTo(gap, 60)
          .stroke({ width: 4, color: swatch.green.line });
      else g.moveTo(0, -36).lineTo(0, 60).stroke({ width: 3, color: swatch.green.line });
      for (const y of [-14, 12, 38]) {
        g.circle(done ? 0 : -gap - 10, y, 7)
          .fill(wood.fill)
          .stroke({ width: 3, color: wood.line });
        if (!done)
          g.moveTo(gap + 4, y)
            .lineTo(gap + 16, y)
            .stroke({ width: 3, color: swatch.green.line });
      }
      break;
    }
    case 'fold': {
      // A striped towel: folded, a small neat stack; unfolded, spread out flat on the floor with its fringed ends.
      g.rect(-66, 54, 132, 6).fill(wood.line);
      if (done) {
        for (let k = 0; k < 3; k++)
          g.roundRect(-38, 32 - k * 18, 76, 22, 8)
            .fill(swatch.orange.light)
            .stroke({ width: 4, color: swatch.orange.line });
        for (const x of [-26, 16]) g.rect(x, -4, 10, 58).fill({ color: swatch.orange.fill, alpha: 0.9 });
      } else {
        g.poly([-62, 50, 62, 50, 46, -10, -46, -10])
          .fill(swatch.orange.light)
          .stroke({ width: 4, color: swatch.orange.line, join: 'round' });
        // Two stripes near each end, narrowing toward the far edge like the towel.
        const k = 46 / 62;
        for (const a of [-46, -32, 22, 36])
          g.poly([a, 50, a + 10, 50, (a + 10) * k, -10, a * k, -10]).fill(swatch.orange.fill);
        for (let x = -56; x <= 56; x += 10)
          g.moveTo(x, 50)
            .lineTo(x, 58)
            .moveTo(x * 0.82, -10)
            .lineTo(x * 0.82, -18)
            .stroke({ width: 3, color: swatch.orange.line, cap: 'round' });
      }
      break;
    }
  }
  return g;
}

/**
 * Level 11's pictures, each about 140 units square and centered on (0, 0): the two opposites and the picture of the word
 * itself for light (a rock, a dark room; a feather, a lamp), short (a tall flower, a long rope; a pencil, a short flower)
 * and old (a new boot, a sprout; a worn boot, an old tree). The lamp, flowers and boots reuse nothing else's drawing.
 */
function twoPicture(w: TwoWord, kind: 'right' | 'same', i: 0 | 1): Container {
  const c = new Container();
  const g = new Graphics();
  c.addChild(g);
  const boot = (fill: typeof swatch.red, worn: boolean) => {
    g.poly([-30, -44, 10, -44, 10, 6, 52, 22, 52, 52, -30, 52])
      .fill(fill.fill)
      .stroke({ width: 5, color: fill.line, join: 'round' });
    g.rect(-30, 40, 82, 12).fill(ink);
    if (worn) {
      g.rect(-14, -16, 18, 18).fill(swatch.yellow.light).stroke({ width: 3, color: swatch.brown.line });
      g.moveTo(14, 30).lineTo(40, 32).stroke({ width: 3, color: swatch.brown.line });
    } else {
      g.moveTo(-18, -34).lineTo(2, -34).stroke({ width: 5, color: 0xffffff, alpha: 0.8 });
      for (const [x, y] of [
        [-46, -20],
        [-52, 0],
        [60, -30],
      ]) {
        g.moveTo(x - 7, y)
          .lineTo(x + 7, y)
          .stroke({ width: 3, color: swatch.yellow.fill });
        g.moveTo(x, y - 7)
          .lineTo(x, y + 7)
          .stroke({ width: 3, color: swatch.yellow.fill });
      }
    }
  };
  const key = `${w}${kind}${i}`;
  switch (key) {
    case 'lightright0':
      // A heavy rock: a big grey boulder pressing a dent into the ground.
      g.ellipse(0, 56, 60, 8).fill({ color: ink, alpha: 0.25 });
      g.poly([-62, 50, -48, -14, -10, -50, 36, -40, 62, 6, 56, 50])
        .fill(0x9a9aa8)
        .stroke({ width: 6, color: 0x6b6b7a, join: 'round' });
      g.moveTo(-20, -20).lineTo(-6, 4).lineTo(-24, 24).stroke({ width: 4, color: 0x6b6b7a });
      break;
    case 'lightright1':
      // A dark room: a night window with a small moon and a dim, shut lamp.
      g.roundRect(-60, -60, 120, 120, 14).fill(0x2b2b4a).stroke({ width: 6, color: 0x15152a });
      g.rect(-4, -60, 8, 120).fill(0x15152a);
      g.rect(-60, -6, 120, 8).fill(0x15152a);
      g.circle(-32, -34, 14).fill(0xfff3b0);
      g.circle(-26, -38, 12).fill(0x2b2b4a);
      for (const [x, y] of [
        [28, -34],
        [38, 28],
        [-34, 30],
      ])
        g.circle(x, y, 3).fill(0xffffff);
      break;
    case 'lightsame0':
      // A feather: soft and curved, with its quill.
      g.ellipse(0, -6, 26, 58).fill(swatch.blue.light).stroke({ width: 5, color: swatch.blue.line });
      g.moveTo(0, 56).lineTo(0, -52).stroke({ width: 5, color: swatch.blue.line });
      for (let y = -36; y <= 30; y += 16) {
        g.moveTo(0, y)
          .lineTo(-18, y - 10)
          .stroke({ width: 3, color: swatch.blue.line });
        g.moveTo(0, y)
          .lineTo(18, y - 10)
          .stroke({ width: 3, color: swatch.blue.line });
      }
      c.rotation = 0.5;
      break;
    case 'shortright0':
      return picture({ concept: 'stature', side: 0 });
    case 'shortright1':
      // A long rope, coiled in a wide wave from edge to edge.
      g.moveTo(-64, 18);
      g.bezierCurveTo(-40, -50, -14, 60, 8, 0).bezierCurveTo(26, -40, 46, 30, 64, -14);
      g.stroke({ width: 12, color: swatch.brown.line, cap: 'round' });
      g.moveTo(-64, 18);
      g.bezierCurveTo(-40, -50, -14, 60, 8, 0).bezierCurveTo(26, -40, 46, 30, 64, -14);
      g.stroke({ width: 7, color: swatch.brown.fill, cap: 'round' });
      break;
    case 'shortsame0':
      // A pencil worn down to a stub.
      g.roundRect(-26, -4, 52, 30, 6)
        .fill(swatch.yellow.fill)
        .stroke({ width: 5, color: swatch.yellow.line });
      g.poly([-26, 26, -26, -4, -52, 11])
        .fill(swatch.brown.light)
        .stroke({ width: 4, color: swatch.brown.line, join: 'round' });
      g.poly([-45, 14, -45, 8, -52, 11]).fill(ink);
      g.roundRect(26, -4, 18, 30, 4).fill(swatch.pink.fill).stroke({ width: 4, color: swatch.pink.line });
      break;
    case 'shortsame1':
      return picture({ concept: 'stature', side: 1 });
    case 'oldright0':
      // A new boot: shiny, with little sparkles.
      boot(swatch.red, false);
      break;
    case 'oldright1':
      // A sprout: two small leaves on a thin stem, in a mound of soil.
      g.ellipse(0, 52, 52, 14).fill(swatch.brown.fill).stroke({ width: 4, color: swatch.brown.line });
      g.moveTo(0, 46).lineTo(0, -6).stroke({ width: 7, color: swatch.green.line });
      g.ellipse(-22, -14, 22, 11).fill(swatch.green.fill).stroke({ width: 4, color: swatch.green.line });
      g.ellipse(22, -22, 22, 11).fill(swatch.green.fill).stroke({ width: 4, color: swatch.green.line });
      break;
    case 'oldsame0':
      // An old boot: dull, patched and scuffed.
      boot(swatch.brown, true);
      break;
    case 'oldsame1':
      // An old tree: a thick, knotted trunk and a few bare branches.
      g.poly([
        -22, 60, -12, -8, -40, -44, -28, -48, -8, -26, -4, -60, 8, -60, 10, -30, 36, -52, 46, -42, 14, -2, 24,
        60,
      ])
        .fill(swatch.brown.fill)
        .stroke({ width: 5, color: swatch.brown.line, join: 'round' });
      g.ellipse(-4, 20, 6, 10).fill(swatch.brown.line);
      break;
    default:
      // Light's lamp is the lit lamp of level 2's pair.
      return picture({ concept: 'lamp', side: 0 });
  }
  return c;
}

/** A picture of one side of a concept, about 140 units square, centered on (0, 0). */
export function picture(card: Card): Container {
  if (card.mid) return middle(card.concept as Gradable);
  if (card.two && card.two.kind !== 'ask') return twoPicture(card.two.w, card.two.kind, card.two.i);
  const c = new Container();
  if (CONCEPTS[card.concept].family === 'un') return (c.addChild(unPicture(card.concept, card.side)), c);
  const g = new Graphics();
  const side = card.side;
  switch (card.concept) {
    case 'size': {
      const bear = new Critter(CRITTERS[card.who ?? 'bear']);
      bear.alive = false;
      // Long bunny ears still fit inside the card at both sizes.
      bear.scale.set(card.who === 'bunny' ? (side === 0 ? 0.38 : 0.17) : side === 0 ? 0.48 : 0.22);
      bear.y = 60;
      c.addChild(bear);
      return c;
    }
    case 'mood': {
      const cat = new Critter(CRITTERS[card.who ?? 'cat']);
      cat.alive = false;
      cat.scale.set(0.4);
      cat.y = 58;
      cat.setMood(side === 0 ? 'happy' : 'sad');
      c.addChild(cat);
      return c;
    }
    case 'height': {
      const y = side === 0 ? -40 : 34;
      g.moveTo(0, y + 30)
        .quadraticCurveTo(10, y + 55, 0, side === 0 ? 60 : y + 40)
        .stroke({ width: 3, color: ink, alpha: 0.6 });
      g.ellipse(0, y, 26, 32)
        .fill(swatch.red.fill)
        .stroke({ width: 4, color: swatch.red.line })
        .ellipse(-8, y - 12, 6, 9)
        .fill({ color: 0xffffff, alpha: 0.6 });
      g.rect(-60, 60, 120, 6).fill(swatch.green.fill);
      const a = side === 0 ? -1 : 1;
      g.poly([46, 0 + a * 20, 58, a * -4, 34, a * -4]).fill(swatch.blue.fill);
      g.rect(42, a * -4 - (a > 0 ? 24 : 0), 8, 24).fill(swatch.blue.fill);
      break;
    }
    case 'lid':
      g.roundRect(-50, -10, 100, 64, 8).fill(wood.fill).stroke({ width: 4, color: wood.line });
      if (side === 0)
        g.poly([-50, -10, -60, -64, 40, -74, 50, -20])
          .fill(wood.light)
          .stroke({ width: 4, color: wood.line, join: 'round' })
          .ellipse(0, -10, 44, 8)
          .fill(0x6b4a2b);
      else g.roundRect(-56, -26, 112, 22, 8).fill(wood.light).stroke({ width: 4, color: wood.line });
      break;
    case 'cup':
      g.moveTo(-36, -50)
        .lineTo(36, -50)
        .lineTo(28, 56)
        .lineTo(-28, 56)
        .closePath()
        .fill({ color: 0xdff3ff, alpha: 0.6 })
        .stroke({ width: 5, color: swatch.blue.line });
      if (side === 0)
        g.moveTo(-33, -30)
          .lineTo(33, -30)
          .lineTo(28, 54)
          .lineTo(-28, 54)
          .closePath()
          .fill(swatch.orange.fill);
      break;
    case 'temp':
      if (side === 0) {
        g.roundRect(-36, -14, 64, 64, 12).fill(swatch.red.fill).stroke({ width: 4, color: swatch.red.line });
        g.moveTo(28, 0).bezierCurveTo(56, 0, 56, 34, 28, 34).stroke({ width: 8, color: swatch.red.line });
        for (const x of [-20, -4, 12])
          g.moveTo(x, -22)
            .quadraticCurveTo(x + 10, -40, x, -58)
            .stroke({ width: 5, color: 0xb9c6d1, cap: 'round' });
      } else {
        g.roundRect(-40, -30, 80, 80, 14)
          .fill({ color: swatch.blue.light, alpha: 0.9 })
          .stroke({ width: 5, color: swatch.blue.fill });
        g.moveTo(-24, -16).lineTo(-6, -16).stroke({ width: 5, color: 0xffffff, cap: 'round' });
        for (const [x, y] of [
          [-50, -40],
          [48, -46],
          [52, 30],
        ])
          g.poly(starPoints(9, 3).map((n, i) => n + (i % 2 ? y : x)))
            .fill(0xffffff)
            .stroke({ width: 2, color: swatch.blue.fill });
      }
      break;
    case 'sky':
      g.roundRect(-64, -64, 128, 128, 18).fill(side === 0 ? 0x8fd3f7 : 0x2b2f63);
      if (side === 0)
        g.circle(20, -14, 26).fill(swatch.yellow.fill).stroke({ width: 4, color: swatch.yellow.line });
      else {
        g.circle(18, -16, 24).fill(swatch.yellow.light).circle(30, -24, 20).fill(0x2b2f63);
        for (const [x, y] of [
          [-36, -30],
          [-20, 24],
          [30, 34],
        ])
          g.poly(starPoints(8, 3).map((n, i) => n + (i % 2 ? y : x))).fill(swatch.yellow.fill);
      }
      break;
    case 'stature': {
      const top = side === 0 ? -52 : 14;
      g.rect(-64, 58, 128, 6).fill(swatch.green.fill);
      g.moveTo(0, 58).lineTo(0, top).stroke({ width: 7, color: swatch.green.line });
      g.ellipse(-14, (top + 58) / 2, 16, 7).fill(swatch.green.fill);
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        g.circle(Math.cos(angle) * 15, top + Math.sin(angle) * 15, 12).fill(swatch.purple.fill);
      }
      g.circle(0, top, 10).fill(swatch.yellow.fill);
      break;
    }
    case 'lamp':
      g.moveTo(0, 0).lineTo(0, 52).stroke({ width: 8, color: wood.line });
      g.roundRect(-34, 48, 68, 12, 6).fill(wood.fill).stroke({ width: 3, color: wood.line });
      g.poly([-28, -46, 28, -46, 46, 4, -46, 4])
        .fill(side === 0 ? swatch.yellow.light : swatch.blue.light)
        .stroke({ width: 4, color: swatch.blue.line, join: 'round' });
      if (side === 0) {
        for (const [x, y] of [
          [-58, -34],
          [58, -34],
          [0, -66],
        ])
          g.moveTo(x, y)
            .lineTo(x * 1.2, y - 10)
            .stroke({ width: 5, color: swatch.yellow.line, cap: 'round' });
        g.circle(0, 9, 8).fill(swatch.yellow.fill);
      }
      break;
    case 'wake': {
      const cat = new Critter(CRITTERS.cat);
      cat.alive = false;
      cat.scale.set(0.4);
      cat.y = 58;
      cat.setMood(side === 0 ? 'calm' : 'sleepy');
      c.addChild(cat);
      if (side === 1) {
        // Code-drawn sleep marks; the closed eyes carry the answer without reading.
        for (const [x, y, r] of [
          [30, -48, 9],
          [48, -66, 7],
        ])
          g.moveTo(x - r, y - r)
            .lineTo(x + r, y - r)
            .lineTo(x - r, y + r)
            .lineTo(x + r, y + r)
            .stroke({ width: 3, color: swatch.blue.line, cap: 'round', join: 'round' });
      }
      break;
    }
    case 'basket':
      // The same basket and ball in each picture: only the ball's position changes.
      g.ellipse(-20, 0, 32, 12).fill(wood.line);
      g.circle(side === 0 ? -20 : 52, side === 0 ? 0 : 39, 18)
        .fill(swatch.red.fill)
        .stroke({ width: 3, color: swatch.red.line });
      g.poly([-54, 0, 14, 0, 6, 60, -46, 60])
        .fill(wood.fill)
        .stroke({ width: 4, color: wood.line, join: 'round' });
      for (const y of [16, 32, 48]) g.moveTo(-48, y).lineTo(8, y).stroke({ width: 3, color: wood.line });
      for (const x of [-34, -18, -2]) g.moveTo(x, 5).lineTo(x, 57).stroke({ width: 3, color: wood.line });
      g.moveTo(-52, 0).quadraticCurveTo(-20, 13, 12, 0).stroke({ width: 4, color: wood.light });
      break;
    case 'sponge': {
      // The same sponge: wet is blue and dripping, dry is pale and crumbly.
      g.roundRect(-52, -30, 104, 62, 14)
        .fill(side === 0 ? swatch.blue.light : swatch.yellow.light)
        .stroke({ width: 5, color: side === 0 ? swatch.blue.fill : swatch.yellow.line });
      for (const [x, y] of [
        [-30, -10],
        [-6, 8],
        [20, -12],
        [32, 14],
        [-24, 16],
      ])
        g.circle(x, y, 6).fill({ color: side === 0 ? swatch.blue.fill : swatch.yellow.line, alpha: 0.5 });
      if (side === 0)
        for (const [x, y] of [
          [-28, 50],
          [4, 58],
          [34, 48],
        ])
          g.moveTo(x, y - 14)
            .quadraticCurveTo(x - 9, y + 4, x, y + 8)
            .quadraticCurveTo(x + 9, y + 4, x, y - 14)
            .fill(swatch.blue.fill);
      else
        for (const x of [-30, 0, 30])
          g.moveTo(x - 6, 52)
            .lineTo(x + 6, 52)
            .stroke({ width: 3, color: swatch.yellow.line, alpha: 0.5, cap: 'round' });
      break;
    }
    case 'plate':
      g.circle(0, 4, 56)
        .fill(0xffffff)
        .stroke({ width: 5, color: swatch.blue.line })
        .circle(0, 4, 36)
        .stroke({ width: 3, color: swatch.blue.light });
      if (side === 0)
        for (const [x, y, r] of [
          [-30, -34, 5],
          [34, -26, 7],
          [38, 26, 5],
        ])
          g.poly(starPoints(r * 2, r * 0.8).map((n, i) => n + (i % 2 ? y : x))).fill(swatch.yellow.fill);
      else
        for (const [x, y, r] of [
          [-18, -8, 14],
          [14, 14, 18],
          [20, -20, 9],
          [-10, 28, 8],
        ])
          g.circle(x, y, r)
            .fill(wood.line)
            .circle(x + r * 0.3, y - r * 0.3, r * 0.3)
            .fill(wood.fill);
      break;
    case 'book': {
      // The same book on its side: only the thickness of its pages changes.
      const h = side === 0 ? 78 : 22;
      g.roundRect(-58, 30 - h, 116, h, 6)
        .fill(swatch.purple.fill)
        .stroke({ width: 4, color: swatch.purple.line });
      g.rect(-52, 34 - h, 104, Math.max(6, h - 10))
        .fill(0xffffff)
        .stroke({ width: 2, color: swatch.purple.line });
      g.rect(-64, 30, 128, 6).fill(swatch.green.fill);
      break;
    }
    case 'ball': {
      // The house stays put; the ball sits close to its door or far along the path.
      g.rect(-60, 60, 120, 6).fill(swatch.green.fill);
      g.rect(-60, -12, 40, 50).fill(swatch.orange.light).stroke({ width: 4, color: swatch.orange.line });
      g.poly([-66, -12, -40, -40, -14, -12])
        .fill(swatch.red.fill)
        .stroke({ width: 4, color: swatch.red.line, join: 'round' });
      g.rect(-46, 12, 12, 26).fill(wood.fill);
      const x = side === 0 ? -4 : 50;
      g.circle(x, 42, 14).fill(swatch.blue.fill).stroke({ width: 3, color: swatch.blue.line });
      if (side === 1) for (const dx of [-8, 12, 32]) g.circle(dx, 50, 3).fill(swatch.green.line);
      break;
    }
    case 'speed':
      if (side === 0) {
        const bunny = new Critter(CRITTERS.bunny);
        bunny.alive = false;
        bunny.scale.set(0.34);
        bunny.position.set(10, 56);
        c.addChild(bunny);
        for (const y of [-10, 10, 30])
          g.moveTo(-70, y).lineTo(-36, y).stroke({ width: 5, color: swatch.blue.fill, cap: 'round' });
      } else {
        g.ellipse(0, 36, 46, 12).fill(swatch.green.light).stroke({ width: 4, color: swatch.green.line });
        g.circle(4, 8, 30).fill(swatch.orange.light).stroke({ width: 4, color: swatch.orange.line });
        g.moveTo(4, 8)
          .arc(4, 8, 14, 0, Math.PI * 1.5)
          .stroke({ width: 4, color: swatch.orange.line });
        g.moveTo(-40, 30)
          .lineTo(-52, 0)
          .moveTo(-42, 30)
          .lineTo(-36, 0)
          .stroke({ width: 3, color: swatch.green.line })
          .circle(-52, 0, 4)
          .circle(-36, 0, 4)
          .fill(ink);
      }
      break;
  }
  c.addChild(g);
  return c;
}

/** Level 9's speaker: a cone and two sound waves, drawn in ink. */
function speakerGlyph(): Graphics {
  return new Graphics()
    .poly([-22, -8, -10, -8, 4, -20, 4, 20, -10, 8, -22, 8])
    .fill(ink)
    .moveTo(12, -10)
    .arc(8, 0, 14, -0.8, 0.8)
    .stroke({ width: 4, color: ink, cap: 'round' })
    .moveTo(16, -18)
    .arc(8, 0, 24, -0.8, 0.8)
    .stroke({ width: 4, color: ink, cap: 'round' });
}

/**
 * Level 10's ask: the un- word in print, its "un" in a bubble of its own ("un" | "zipped"), beside a small speaker. Reading
 * is optional: the word is always heard, and a tap on the bubble says it again. Returns the bubble.
 */
function unWord(concept: Concept): { node: Container } {
  const [un, base] = unParts(concept);
  const style = { fontFamily: FONT, fontSize: 52, fontWeight: '600', fill: ink } as const;
  const prefix = new Text({ text: un, style: { ...style, fill: 0xffffff } });
  const rest = new Text({ text: base, style });
  prefix.anchor.set(0, 0.5);
  rest.anchor.set(0, 0.5);
  const pw = prefix.width + 24;
  const glyph = speakerGlyph();
  glyph.scale.set(1.1);
  const lead = 72;
  const w = lead + pw + 8 + rest.width;
  const left = -w / 2;
  glyph.position.set(left + 24, 0);
  const pill = new Graphics()
    .roundRect(left + lead, -36, pw, 72, 30)
    .fill(swatch.purple.fill)
    .stroke({ width: 4, color: swatch.purple.line });
  prefix.position.set(left + lead + 12, -2);
  rest.position.set(left + lead + pw + 8, -2);
  const half = { w: w / 2 + 30, h: 66 };
  const bubble = new Graphics()
    .roundRect(-half.w, -half.h, 2 * half.w, 2 * half.h, 40)
    .fill(0xffffff)
    .stroke({ width: 6, color: swatch.purple.line });
  const node = new Container();
  node.addChild(bubble, glyph, pill, prefix, rest);
  return { node };
}

/** Level 11's ask: the word in print beside a small speaker; reading is optional and a tap says the word again. */
function twoWord(text: string): Container {
  const label = new Text({
    text,
    style: { fontFamily: FONT, fontSize: 56, fontWeight: '600', fill: ink },
  });
  label.anchor.set(0, 0.5);
  const glyph = speakerGlyph();
  glyph.scale.set(1.1);
  const lead = 72;
  const w = lead + label.width;
  glyph.position.set(-w / 2 + 24, 0);
  label.position.set(-w / 2 + lead, -2);
  const half = { w: w / 2 + 34, h: 66 };
  const bubble = new Graphics()
    .roundRect(-half.w, -half.h, 2 * half.w, 2 * half.h, 40)
    .fill(0xffffff)
    .stroke({ width: 6, color: swatch.purple.line });
  const node = new Container();
  node.addChild(bubble, glyph, label);
  return node;
}

interface CardView {
  card: Card;
  node: Container;
  bg: Graphics;
  done: boolean;
}

class Opposites implements Game {
  readonly plan: OppPlan;
  readonly rounds: OppRound[];
  readonly cards: CardView[] = [];
  index = -1;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  picked: CardView | null = null;

  private readonly backdrop: Backdrop;
  private readonly shown = new Container();
  private readonly glow = new Graphics();
  /** Level 8: the three places along the line, and the cards lined up in them so far. */
  private readonly slots = new Graphics();
  private lined: CardView[] = [];
  private view: View;
  private wrongs = 0;
  private glowing: CardView | null = null;
  private clock = 0;
  /** Level 6: the whole view takes every touch, and each flipped picture joins the row. */
  private readonly catcher = new Container();
  private readonly row = new Container();
  /** Level 6: the picture flying to the row, which a resize leaves to finish its flight. */
  private flying: Container | null = null;
  private wiggling = false;
  private destroyed = false;
  /** Level 9: the hidden picture has been shown, after this round's first miss. */
  revealed = false;
  /** Level 9: the speaker is turning round to the picture. */
  private revealing = false;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.rounds = makeRounds(this.plan, ctx.rng);
    this.backdrop = new Backdrop(
      {
        sky: [0xffe9b8, 0xfff8ec],
        hills: [0xc8ecb0, 0xa6de8e],
        horizon: 0.75,
        clouds: 2,
        sun: false,
        seed: 17,
      },
      ctx.view,
    );
    this.glow.eventMode = 'none';
    this.shown.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.shown, this.glow);
    if (this.plan.hidden || this.plan.mode === 'un' || this.plan.mode === 'two') {
      // Level 9: the ask bubble is a speaker button; level 10: the printed un- word. A tap says the word again.
      this.shown.eventMode = 'static';
      this.shown.hitArea = new Rectangle(-95, -95, 190, 190);
      onTap(this.shown, () => this.replay(), { cooldown: 400 });
    }
    if (this.plan.mode === 'order') {
      this.slots.eventMode = 'none';
      ctx.stage.addChildAt(this.slots, 1);
    }
    if (this.plan.big) {
      // The whole screen flips the card: a touch beside it, on the sky or the hills counts the same.
      this.catcher.hitArea = new Rectangle(0, 0, ctx.view.w, ctx.view.h);
      this.row.eventMode = 'none';
      ctx.stage.addChildAt(this.catcher, 1);
      ctx.stage.addChild(this.row);
      onTap(this.catcher, () => void this.bigTouch(), { cooldown: 300 });
    }
  }

  get round() {
    return this.rounds[this.index];
  }

  start() {
    void this.next();
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    const mode = this.plan.mode;
    if (this.plan.big) {
      this.catcher.hitArea = new Rectangle(0, 0, v.w, v.h);
      this.cards.forEach((c) => c.node.position.copyFrom(this.bigSpot()));
      this.layoutRow();
    } else if (mode === 'switch') this.cards.forEach((c) => c.node.position.set(v.w / 2, v.h * 0.5));
    else if (mode === 'spot') {
      const top = spread(3, 200, v.w - 80, 230);
      const low = spread(2, 200, v.w - 80, 230);
      this.cards.forEach((c, i) =>
        c.node.position.set(i < 3 ? top[i] : low[i - 3], i < 3 ? v.h * 0.36 : v.h * 0.72),
      );
    } else if (mode === 'order') {
      // Unplaced cards wait in the top row; lined-up ones stay in their places on the line.
      const { s, top, line } = this.orderLayout();
      this.cards.forEach((c, i) => {
        const k = this.lined.indexOf(c);
        c.node.position.set(k < 0 ? top.xs[i] : line.xs[k], k < 0 ? top.y : line.y);
        if (!this.busy) c.node.scale.set(s);
      });
      this.drawSlots();
    } else if (mode === 'pairs') {
      const xs = spread(3, 200, v.w - 80, 230);
      this.cards.forEach((c, i) => c.node.position.set(xs[i % 3], i < 3 ? v.h * 0.36 : v.h * 0.72));
    } else if (mode === 'two') {
      const { xs, ys, s } = this.twoLayout();
      this.cards.forEach((c, i) => {
        c.node.position.set(xs[i], ys[i]);
        if (!this.busy) c.node.scale.set(s);
      });
    } else {
      const xs = this.rowXs();
      this.cards.forEach((c, i) =>
        c.node.position.set(xs[i], v.h * (mode === 'between' ? 0.56 : mode === 'un' ? 0.6 : 0.64)),
      );
      // Level 7's and 10's cards grow only as far as the row leaves room, so their tap areas never overlap (upright: about 1.06).
      if ((mode === 'between' || mode === 'un') && !this.busy)
        this.cards.forEach((c) => c.node.scale.set(this.wideScale()));
    }
    this.shown.position.set(v.w / 2, Math.max(150, v.h * 0.26));
    if ((mode === 'un' || mode === 'two') && this.shown.children[0]) {
      // The printed word and its tap area grow together on an upright phone.
      const word = this.shown.children[0];
      const k = this.tall() ? UN_TALL_WORD : 1;
      word.scale.set(k);
      const b = word.getLocalBounds();
      this.shown.hitArea = new Rectangle(b.x * k, b.y * k, b.width * k, b.height * k);
    }
  }

  update(dt: number) {
    this.clock += dt;
    const g = this.glow.clear();
    if (this.glowing && !this.busy) {
      const r = 100 * this.glowing.node.scale.y;
      g.roundRect(this.glowing.node.x - r, this.glowing.node.y - r, 2 * r, 2 * r, 36).stroke({
        width: 7 + 2 * Math.sin(this.clock * 5),
        color: swatch.yellow.fill,
      });
    }
  }

  /**
   * The ghost finger on the how-to card: tap the picture (it flips), the one named, the opposite, or each pair in turn. At
   * level 6 it touches the grass beside the big card, since anywhere flips it.
   */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || !this.round) return null;
    if (this.plan.big)
      return {
        tap: { on: this.catcher, x: this.view.w * 0.82, y: this.view.h * 0.6 },
        receiver: this.catcher,
      };
    const picked = this.picked ? this.cards.indexOf(this.picked) : null;
    const i = cardToTap(
      this.plan,
      this.round,
      this.cards.map((c) => c.done),
      picked,
    );
    return i === null ? null : { tap: { on: this.cards[i].node } };
  }

  destroy() {
    this.destroyed = true;
  }

  /** The row of cards' centers; level 7's and 10's larger cards use the whole width (clear of the corner buttons). */
  private rowXs(n = this.cards.length) {
    const v = this.view;
    const wide = this.plan.mode === 'between' || this.plan.mode === 'un';
    return wide
      ? spread(n, 80, v.w - 80, this.plan.mode === 'un' ? 420 : 330)
      : spread(n, 200, v.w - 80, 240);
  }

  /** Level 7's and 10's card scale: as large as their own scale, but each 180-unit tap area keeps a gap to the next. */
  private wideScale() {
    const un = this.plan.mode === 'un';
    const xs = this.rowXs(un ? 2 : 3);
    const most = un ? (this.tall() ? UN_TALL_SCALE : UN_SCALE) : BETWEEN_SCALE;
    return Math.min(most, (xs[1] - xs[0] - 16) / 180);
  }

  /**
   * Level 11's four cards: one row on a wide view, two by two on an upright phone. The scale is as large as the gaps leave
   * room for, so no two 180-unit tap areas touch; the grid's low row stays above the corner guide.
   */
  private twoLayout() {
    const v = this.view;
    if (!this.tall()) {
      const xs = spread(4, 80, v.w - 80, 330);
      return { xs, ys: xs.map(() => v.h * 0.62), s: Math.min(TWO_SCALE, (xs[1] - xs[0] - 16) / 180) };
    }
    const cols = spread(2, 60, v.w - 60, 400);
    const top = v.h * 0.46;
    const low = v.h * 0.7;
    const s = Math.min(TWO_TALL_SCALE, (cols[1] - cols[0] - 16) / 180, (low - top - 16) / 180);
    return { xs: [cols[0], cols[1], cols[0], cols[1]], ys: [top, top, low, low], s };
  }

  /** An upright phone: the view is much taller than wide. */
  private tall() {
    return this.view.h > this.view.w * 1.3;
  }

  /**
   * Level 8's two rows: the shuffled three across the top, and the line below, its places left to right from the end named
   * first. The line sits low but its cards stay above the corner guide; the rows share their columns.
   */
  private orderLayout() {
    const v = this.view;
    const xs = spread(3, 80, v.w - 80, 330);
    const s = Math.min(ORDER_SCALE, (xs[1] - xs[0] - 16) / 180);
    const y = Math.min(v.h * 0.72, v.h - GUIDE_CLEAR - 90 * s);
    return { s, top: { xs, y: v.h * 0.32 }, line: { xs, y } };
  }

  /** Level 8's line: three pale places with an arrow between each, pointing from the end named first. */
  private drawSlots() {
    const { s, line } = this.orderLayout();
    const r = 85 * s;
    const g = this.slots.clear();
    for (const x of line.xs)
      g.roundRect(x - r, line.y - r, 2 * r, 2 * r, 30 * s)
        .fill({ color: 0xffffff, alpha: 0.35 })
        .stroke({ width: 5, color: wood.line, alpha: 0.35 });
    for (let k = 0; k < 2; k++) {
      const x = (line.xs[k] + line.xs[k + 1]) / 2;
      g.poly([x - 8, line.y - 14, x + 10, line.y, x - 8, line.y + 14]).fill({ color: wood.line, alpha: 0.5 });
    }
  }

  /**
   * Level 8: a card tapped in turn lifts, slides into its place on the line and settles, and its word is said. A glow (the
   * hint) moves on to the next one. The third names the whole line, end to end ("Empty, half full, full!").
   */
  private async lineUp(c: CardView) {
    this.busy = true;
    c.done = true;
    this.lined.push(c);
    this.drawCard(c, true);
    const k = this.lined.length - 1;
    const last = k === 2;
    if (!last) void this.ctx.say('opp.word', { word: word(c.card) });
    const { s, line } = this.orderLayout();
    sfx.whoosh();
    await this.ctx.tw.to(c.node.scale, { x: s * 1.12, y: s * 1.12 }, { duration: 0.1 });
    if (this.destroyed) return;
    await this.ctx.tw.to(c.node, { x: line.xs[k], y: line.y }, { duration: 0.35, ease: ease.inOutSine });
    if (this.destroyed) return;
    await this.ctx.tw.to(c.node.scale, { x: s, y: s }, { duration: 0.12, ease: ease.outBack });
    if (this.destroyed) return;
    sfx.pop(5 + k);
    // Settle wherever a resize moved the line during the slide.
    this.resize(this.view);
    if (!last) {
      if (this.glowing)
        this.glowing =
          this.cards.find((x) => !x.done && inTurn(this.round, x.card, this.lined.length)) ?? null;
      this.busy = false;
      return;
    }
    this.glowing = null;
    sfx.sparkle();
    this.ctx.pet.cheer();
    const [a, m, b] = this.lined.map((x) => word(x.card));
    // The whole line is heard out: the two ends named out loud, with the middle between them.
    await this.ctx.say('opp.lined', { a, m, b });
    if (this.destroyed) return;
    await this.ctx.tw.wait(0.3);
    if (this.destroyed) return;
    await this.next();
  }

  /**
   * Level 7's hint, after two misses: the two ends light up, then the one in between them glows. The cards already stand
   * in their true order, so the middle is the one between the lit ends.
   */
  private async lightEnds() {
    this.busy = true;
    const ends = this.cards.filter((c) => !c.card.mid);
    for (const c of ends) this.drawCard(c, true);
    await this.ctx.tw.wait(0.8);
    if (this.destroyed) return;
    for (const c of ends) this.drawCard(c, false);
    this.busy = false;
  }

  // Level 6: one big card -------------------------------------------------------------------

  /** Where the big card stands: a little above the middle, leaving the bottom for the row. */
  private bigSpot() {
    return { x: this.view.w / 2, y: this.view.h * 0.42 };
  }

  /** Where the `i`th flipped picture sits in the row along the bottom, clear of the corner pet. */
  private rowSpot(i: number) {
    const v = this.view;
    const xs = spread(this.plan.rounds, 240, v.w - 120, 96);
    return { x: xs[i], y: v.h - 80 };
  }

  private layoutRow() {
    this.row.children.forEach((p, i) => {
      if (p !== this.flying) p.position.copyFrom(this.rowSpot(i));
    });
  }

  /** A touch while the card is flipping, moving or arriving still answers: a soft pop, and the card wiggles if it is up. */
  private async wiggle() {
    const c = this.cards[0];
    if (this.wiggling) return;
    sfx.pop(3);
    if (!c || !c.node.visible) return;
    this.wiggling = true;
    const node = c.node;
    await this.ctx.tw.to(node, { rotation: 0.08 }, { duration: 0.08 });
    await this.ctx.tw.to(node, { rotation: -0.06 }, { duration: 0.1 });
    await this.ctx.tw.to(node, { rotation: 0 }, { duration: 0.08 });
    this.wiggling = false;
  }

  /**
   * A touch anywhere: the big card flips to its opposite while the word is said and the picture acts it, then a small
   * copy flies to the row along the bottom and stays, and the next card grows in. The last word is heard out.
   */
  private async bigTouch() {
    if (this.finished) return;
    const c = this.cards[0];
    if (this.busy || !c) return void this.wiggle();
    this.busy = true;
    sfx.pop(5);
    const to: Card = { ...c.card, side: (1 - c.card.side) as 0 | 1 };
    await this.flip(c, to);
    if (this.destroyed) return;
    const said = this.ctx.say('opp.word', { word: word(to) });
    await this.act(c);
    if (this.destroyed) return;
    const kept = new Container();
    const bg = new Graphics();
    kept.addChild(bg, picture(to));
    this.drawCard({ card: to, node: kept, bg, done: true }, false);
    kept.position.copyFrom(c.node.position);
    kept.scale.set(c.node.scale.x);
    kept.rotation = 0;
    c.node.visible = false;
    this.row.addChild(kept);
    this.flying = kept;
    const spot = this.rowSpot(this.row.children.length - 1);
    sfx.whoosh();
    void this.ctx.tw.to(kept.scale, { x: ROW_SCALE, y: ROW_SCALE }, { duration: 0.45, ease: ease.inOutSine });
    await this.ctx.tw.to(kept, { x: spot.x, y: spot.y }, { duration: 0.45, ease: ease.inOutSine });
    if (this.destroyed) return;
    this.flying = null;
    this.layoutRow();
    sfx.pop(7);
    if (this.index + 1 >= this.rounds.length) await said;
    if (this.destroyed) return;
    void this.next();
  }

  private makeCard(card: Card, scale = 1): CardView {
    const node = new Container();
    const bg = new Graphics();
    node.addChild(bg, picture(card));
    node.scale.set(scale);
    const view: CardView = { card, node, bg, done: false };
    this.drawCard(view, false);
    // Level 6's card takes no touch of its own: the catcher behind it answers everywhere, the card included.
    if (this.plan.big) node.eventMode = 'none';
    else {
      node.hitArea = new Rectangle(-90, -90, 180, 180);
      onTap(node, () => void this.tap(view), { cooldown: 350 });
    }
    this.ctx.stage.addChild(node);
    return view;
  }

  private drawCard(c: CardView, on: boolean) {
    c.bg
      .clear()
      .roundRect(-85, -85, 170, 170, 30)
      .fill(on ? swatch.yellow.light : 0xffffff)
      .stroke({ width: 6, color: on ? swatch.yellow.line : wood.line });
  }

  private async next() {
    this.busy = true;
    this.index++;
    this.wrongs = 0;
    this.glowing = null;
    this.picked = null;
    this.lined = [];
    this.revealed = false;
    if (this.index >= this.rounds.length) return void this.finale();
    for (const c of this.cards.splice(0)) c.node.destroy({ children: true });
    this.shown.removeChildren().forEach((c) => c.destroy({ children: true }));
    const r = this.round;
    for (const card of r.cards)
      this.cards.push(
        this.makeCard(
          card,
          this.plan.big
            ? BIG_SCALE
            : this.plan.mode === 'switch'
              ? 1.7
              : this.plan.mode === 'two'
                ? this.twoLayout().s
                : this.plan.mode === 'between' || this.plan.mode === 'un'
                  ? this.wideScale()
                  : this.plan.mode === 'order'
                    ? this.orderLayout().s
                    : 1,
        ),
      );
    if (this.plan.mode === 'opposite') {
      const bubble = new Graphics()
        .roundRect(-95, -95, 190, 190, 40)
        .fill(0xffffff)
        .stroke({ width: 6, color: swatch.purple.line });
      if (!this.plan.hidden) this.shown.addChild(bubble, picture(r.ask!));
      else {
        // Level 9: only the word; the picture waits behind a big speaker until the first miss.
        const glyph = speakerGlyph();
        glyph.scale.set(2.4);
        this.shown.addChild(bubble, glyph);
      }
    } else if (this.plan.mode === 'two') {
      // Level 11: the asked word in print (reading is optional); the bubble replays it.
      this.shown.addChild(twoWord(word(r.ask!)));
    } else if (this.plan.mode === 'un') {
      // Level 10: the un- word in print, its "un" in a bubble of its own; the whole bubble replays the word.
      this.shown.addChild(unWord(r.ask!.concept).node);
    }
    this.resize(this.view);
    for (const c of this.cards) {
      const s = c.node.scale.x;
      c.node.scale.set(0);
      void this.ctx.tw.to(c.node.scale, { x: s, y: s }, { duration: 0.3, ease: ease.outBack });
    }
    await this.ctx.tw.wait(0.35);
    this.busy = false;
    const mode = this.plan.mode;
    if (mode === 'switch')
      return this.index === 0
        ? this.ctx.instruct(this.plan.big ? 'opp.big' : 'opp.switch')
        : this.ctx.say('opp.word', { word: word(r.cards[0]) });
    if (mode === 'find') return this.ctx.instruct('opp.find', { word: word(r.ask!) });
    if (mode === 'un') return this.ctx.instruct('opp.un', this.unVars());
    if (mode === 'two') return this.ctx.instruct('opp.two', { word: word(r.ask!) });
    if (mode === 'opposite')
      return this.ctx.instruct(this.plan.hidden ? 'opp.heard' : 'opp.opposite', { word: word(r.ask!) });
    if (mode === 'between') return this.ctx.instruct('opp.between', this.ends());
    if (mode === 'order') return this.ctx.instruct('opp.order', this.ends());
    return this.ctx.instruct(mode === 'spot' ? 'opp.spot' : 'opp.pairs');
  }

  private async flip(c: CardView, to: Card) {
    const s = c.node.scale.x;
    await this.ctx.tw.to(c.node.scale, { x: 0 }, { duration: 0.12 });
    c.node.removeChildAt(1).destroy({ children: true });
    c.node.addChild(picture(to));
    c.card = to;
    await this.ctx.tw.to(c.node.scale, { x: s }, { duration: 0.18, ease: ease.outBack });
  }

  /** Move only the picture inside its fixed card; layout and the generous tap target stay put. */
  private async act(c: CardView) {
    const pic = c.node.getChildAt<Container>(1);
    const { concept, side } = c.card;
    if (concept === 'size') {
      // Heavy stomps versus little tiptoes, both returning to the same resting pose.
      for (let step = 0; step < 2; step++) {
        await this.ctx.tw.to(
          pic,
          { y: side === 0 ? -9 : -4, rotation: side === 0 ? 0 : 0.04 },
          { duration: side === 0 ? 0.18 : 0.12 },
        );
        await this.ctx.tw.to(pic, { y: 0, rotation: 0 }, { duration: side === 0 ? 0.12 : 0.18 });
      }
    } else if (concept === 'speed') {
      await this.ctx.tw.to(pic, { x: 18 }, { duration: side === 0 ? 0.12 : 0.6, ease: ease.linear });
      await this.ctx.tw.to(pic, { x: 0 }, { duration: side === 0 ? 0.12 : 0.6, ease: ease.linear });
    } else if (concept === 'height') {
      await this.ctx.tw.to(pic, { y: side === 0 ? -14 : 14 }, { duration: 0.35, ease: ease.inOutSine });
      await this.ctx.tw.to(pic, { y: 0 }, { duration: 0.35, ease: ease.inOutSine });
    }
  }

  private async tap(c: CardView) {
    if (this.busy || this.finished || c.done) return;
    const mode = this.plan.mode;
    sfx.pop(5);
    if (mode === 'switch') {
      // Tap: it flips to its opposite, and the word is said.
      this.busy = true;
      const to: Card = { ...c.card, side: (1 - c.card.side) as 0 | 1 };
      await this.flip(c, to);
      // The word starts with the act; the next card comes after the act and the 0.5 s, its word cutting this one
      // (U7 R4). The last card's word is heard out.
      const said = this.ctx.say('opp.word', { word: word(to) });
      await this.act(c);
      if (this.index + 1 >= this.rounds.length) await said;
      await this.ctx.tw.wait(0.5);
      return void this.next();
    }
    const r = this.round;
    if (mode === 'find')
      return void (word(c.card) === word(r.ask!)
        ? this.right([c])
        : this.wrong('opp.notfind', { what: word(c.card), word: word(r.ask!) }));
    if (mode === 'un')
      return void (word(c.card) === word(r.ask!)
        ? this.right([c], () => this.ctx.say('opp.isun', this.unVars()))
        : this.wrong('opp.notun', { what: word(c.card), word: word(r.ask!) }));
    if (mode === 'two') return void this.twoTap(c);
    if (mode === 'between')
      return void (c.card.mid
        ? this.right([c], () => this.ctx.say('opp.isbetween', { word: word(c.card) }))
        : this.wrong('opp.notbetween', { what: word(c.card), ...this.ends(c.card) }));
    if (mode === 'order') {
      // In turn from the end named first; a tap out of turn asks which comes first, or which comes after the last one.
      const placed = this.lined.length;
      if (inTurn(r, c.card, placed)) return void this.lineUp(c);
      return void (placed === 0
        ? this.wrong('opp.notfirst', { a: word(r.ask!) })
        : this.wrong('opp.notnext', { prev: word(this.lined[placed - 1].card) }));
    }
    if (mode === 'opposite')
      return void (opposites(c.card, r.ask!)
        ? this.right([c])
        : this.wrong('opp.notopp', { what: word(c.card), word: word(r.ask!) }));
    // Pairs: the first tap picks, the second checks.
    if (!this.picked) {
      this.picked = c;
      this.drawCard(c, true);
      void this.ctx.say('opp.word', { word: word(c.card) });
      return;
    }
    const a = this.picked;
    this.picked = null;
    if (a === c) return void this.drawCard(c, false);
    if (opposites(a.card, c.card)) {
      a.done = c.done = true;
      this.drawCard(c, true);
      sfx.sparkle();
      void this.ctx.say('opp.pair', { a: word(a.card), b: word(c.card) });
      if (mode === 'spot' || this.cards.every((x) => x.done)) {
        this.busy = true;
        await this.ctx.tw.wait(1.2);
        return void this.next();
      }
      return;
    }
    this.drawCard(a, false);
    this.wrong('opp.notpair', { a: word(a.card), b: word(c.card) });
  }

  /**
   * Level 11: an opposite lights up and is kept (the first says to find one more, the second finishes the round, so either
   * comes first); a picture of the asked word itself is never a miss, only a gentle "that one is light too"; the unrelated
   * one is a miss. The one hint, after two misses, glows an opposite not yet found and moves to the other once one is.
   */
  private async twoTap(c: CardView) {
    const ask = word(this.round.ask!);
    const kind = c.card.two?.kind;
    if (!kind) return void this.wrong('opp.notopp', { what: word(c.card), word: ask });
    if (kind === 'same') return void this.ctx.say('opp.sametoo', { word: ask });
    if (kind !== 'right') return;
    c.done = true;
    this.drawCard(c, true);
    sfx.sparkle();
    const left = this.cards.filter((x) => !x.done && x.card.two?.kind === 'right');
    if (left.length) {
      if (this.glowing) this.glowing = left[0];
      return void this.ctx.say('opp.twofirst', { what: word(c.card), word: ask });
    }
    this.busy = true;
    this.glowing = null;
    this.ctx.pet.cheer();
    const said = this.ctx.say('opp.twodone', { what: word(c.card), word: ask });
    if (this.index + 1 >= this.rounds.length) await said;
    await this.ctx.tw.wait(0.5);
    await this.next();
  }

  /** Level 7's two ends: the one named first as `a`, or the end she tapped ("That one is full. Between full and…"). */
  private ends(first: Card = this.round.ask!) {
    return { a: word(first), b: word({ ...first, side: (1 - first.side) as 0 | 1 }) };
  }

  /** Level 10's two words: the un- word asked for and the word it turns the other way ("unzipped", "zipped"). */
  private unVars() {
    const ask = this.round.ask!;
    return { word: word(ask), base: word({ ...ask, side: 0 }) };
  }

  private wrong(
    line:
      | 'opp.notfind'
      | 'opp.notopp'
      | 'opp.notpair'
      | 'opp.notbetween'
      | 'opp.notfirst'
      | 'opp.notnext'
      | 'opp.notun',
    vars: Record<string, string>,
  ) {
    this.misses++;
    this.wrongs++;
    sfx.boing();
    void this.ctx.say(line, vars);
    // Level 9's hint is the picture, as in a flap book: the first miss turns the speaker round to show it.
    if (this.plan.hidden && !this.revealed) void this.reveal();
    if (this.wrongs >= 2 && !this.glowing) {
      this.hints++;
      const r = this.round;
      if (this.plan.mode === 'between') {
        this.glowing = this.cards.find((x) => x.card.mid)!;
        void this.lightEnds();
        return;
      }
      // Level 8: the next one in turn glows, and the glow moves along as she lines them up (one hint a round).
      this.glowing =
        this.plan.mode === 'order'
          ? this.cards.find((x) => !x.done && inTurn(r, x.card, this.lined.length))!
          : this.plan.mode === 'two'
            ? this.cards.find((x) => !x.done && x.card.two?.kind === 'right')!
            : this.plan.mode === 'find' || this.plan.mode === 'un'
              ? this.cards.find((x) => word(x.card) === word(r.ask!))!
              : this.plan.mode === 'opposite'
                ? this.cards.find((x) => opposites(x.card, r.ask!))!
                : this.plan.mode === 'spot'
                  ? this.cards.find((x) => this.cards.some((o) => o !== x && opposites(o.card, x.card)))!
                  : this.cards.find((x) => !x.done)!;
    }
  }

  /** Level 9: the speaker says the word again (before or after the picture shows); level 10: the printed un- word. */
  private replay() {
    if (this.finished || !this.round?.ask) return;
    sfx.pop(3);
    // No squash while the reveal turns the bubble round: the flip owns the scale then.
    if (!this.revealing)
      void this.ctx.tw.to(this.shown.scale, { x: 0.92, y: 0.92 }, { duration: 0.08 }).then(() => {
        if (!this.destroyed && !this.revealing)
          void this.ctx.tw.to(this.shown.scale, { x: 1, y: 1 }, { duration: 0.15, ease: ease.outBack });
      });
    void this.ctx.say('opp.word', { word: word(this.round.ask) });
  }

  /** Level 9: the speaker turns round to the asked word's own picture, with a small speaker left in its corner. */
  private async reveal() {
    this.revealed = true;
    this.revealing = true;
    const ask = this.round.ask!;
    await this.ctx.tw.to(this.shown.scale, { x: 0 }, { duration: 0.12 });
    if (this.destroyed) return;
    if (this.round?.ask !== ask) {
      // The round moved on mid-flip: leave the next bubble at full size.
      this.revealing = false;
      return void this.shown.scale.set(1);
    }
    this.shown.removeChildAt(1).destroy();
    const badge = new Container();
    badge.addChild(
      new Graphics().circle(0, 0, 24).fill(0xffffff).stroke({ width: 3, color: swatch.purple.line }),
    );
    const glyph = speakerGlyph();
    glyph.scale.set(0.7);
    badge.addChild(glyph);
    badge.position.set(76, 76);
    this.shown.addChild(picture(ask), badge);
    this.shown.scale.y = 1;
    await this.ctx.tw.to(this.shown.scale, { x: 1 }, { duration: 0.18, ease: ease.outBack });
    this.revealing = false;
  }

  /** A right answer, praised (level 7 names the middle it found, level 10 says what un- did). */
  private async right(cs: CardView[], praise = () => this.ctx.say('opp.yay')) {
    this.busy = true;
    this.glowing = null;
    for (const c of cs) this.drawCard(c, true);
    sfx.sparkle();
    this.ctx.pet.cheer();
    // The praise starts and the next question follows the 0.3 s beat (U7 R4); the last one is heard out.
    const said = praise();
    if (this.index + 1 >= this.rounds.length) await said;
    await this.ctx.tw.wait(0.3);
    await this.next();
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    sfx.tada();
    await this.ctx.say('opp.done');
    await this.ctx.tw.wait(0.4);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

class OppIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const a = picture({ concept: 'size', side: 0 });
    a.scale.set(0.8);
    a.position.set(-55, -80);
    const b = picture({ concept: 'size', side: 1 });
    b.scale.set(0.8);
    b.position.set(55, -80);
    c.addChild(a, b);
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const concept = rng.pick(STICKER_CONCEPTS);
  const a = picture({ concept, side: 0 });
  a.position.set(-70, 0);
  const b = picture({ concept, side: 1 });
  b.position.set(70, 0);
  c.addChild(a, b);
  return c;
}

export const oppositesGame: GameModule = {
  id: 'opposites',
  name: 'Opposites',
  titleLine: 'game.opposites',
  region: 'story-grove',
  challenge: 'words',
  skills: ['words', 'concepts', 'opposites', 'listening'],
  bands: ['lap', 'toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  entryLevels: [BIG_LEVEL, ONE_PAIR_LEVEL],
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  coplayHint: 'Act them out together: stretch up big, curl up small, a happy face, a sad face.',
  offScreen: 'Play opposites with toys: put the teddy up high, then down low; open the box, close the box.',
  hubIcon: () => new OppIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new Opposites(ctx),
};
