import { Container, Graphics, Rectangle } from 'pixi.js';
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
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  BIG_LEVEL,
  LEVELS,
  STICKER_CONCEPTS,
  cardToTap,
  makeRounds,
  opposites,
  planFor,
  word,
  type Card,
  type Gradable,
  type OppPlan,
  type OppRound,
} from './logic';

/** Level 6's one big card, about 290 units across. */
const BIG_SCALE = 1.7;
/** Level 6's flipped pictures, small in the row along the bottom (about 75 units across). */
const ROW_SCALE = 0.44;
/** Level 7's three cards, larger in the open middle of the screen: up to about 240 units across. */
const BETWEEN_SCALE = 1.4;

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

/** A picture of one side of a concept, about 140 units square, centered on (0, 0). */
export function picture(card: Card): Container {
  if (card.mid) return middle(card.concept as Gradable);
  const c = new Container();
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
    } else if (mode === 'pairs') {
      const xs = spread(3, 200, v.w - 80, 230);
      this.cards.forEach((c, i) => c.node.position.set(xs[i % 3], i < 3 ? v.h * 0.36 : v.h * 0.72));
    } else {
      const xs = this.rowXs();
      this.cards.forEach((c, i) => c.node.position.set(xs[i], v.h * (mode === 'between' ? 0.56 : 0.64)));
      // Level 7's cards grow only as far as the row leaves room, so their tap areas never overlap (upright: about 1.06).
      if (mode === 'between' && !this.busy) this.cards.forEach((c) => c.node.scale.set(this.betweenScale()));
    }
    this.shown.position.set(v.w / 2, Math.max(150, v.h * 0.26));
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

  /** The row of cards' centers; level 7's larger cards use the whole width (they stand clear of the corner buttons). */
  private rowXs(n = this.cards.length) {
    const v = this.view;
    return this.plan.mode === 'between' ? spread(n, 80, v.w - 80, 330) : spread(n, 200, v.w - 80, 240);
  }

  /** Level 7's card scale: as large as BETWEEN_SCALE, but each 180-unit tap area keeps a gap to the next. */
  private betweenScale() {
    const xs = this.rowXs(3);
    return Math.min(BETWEEN_SCALE, (xs[1] - xs[0] - 16) / 180);
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
              : this.plan.mode === 'between'
                ? this.betweenScale()
                : 1,
        ),
      );
    if (this.plan.mode === 'opposite') {
      const bubble = new Graphics()
        .roundRect(-95, -95, 190, 190, 40)
        .fill(0xffffff)
        .stroke({ width: 6, color: swatch.purple.line });
      this.shown.addChild(bubble, picture(r.ask!));
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
    if (mode === 'opposite') return this.ctx.instruct('opp.opposite', { word: word(r.ask!) });
    if (mode === 'between') return this.ctx.instruct('opp.between', this.ends());
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
    if (mode === 'between')
      return void (c.card.mid
        ? this.right([c], word(c.card))
        : this.wrong('opp.notbetween', { what: word(c.card), ...this.ends(c.card) }));
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

  /** Level 7's two ends, the one named first as `a`. */
  /** Level 7's two ends: the one named first as `a`, or the end she tapped ("That one is full. Between full and…"). */
  private ends(first: Card = this.round.ask!) {
    return { a: word(first), b: word({ ...first, side: (1 - first.side) as 0 | 1 }) };
  }

  private wrong(
    line: 'opp.notfind' | 'opp.notopp' | 'opp.notpair' | 'opp.notbetween',
    vars: Record<string, string>,
  ) {
    this.misses++;
    this.wrongs++;
    sfx.boing();
    void this.ctx.say(line, vars);
    if (this.wrongs >= 2 && !this.glowing) {
      this.hints++;
      const r = this.round;
      if (this.plan.mode === 'between') {
        this.glowing = this.cards.find((x) => x.card.mid)!;
        void this.lightEnds();
        return;
      }
      this.glowing =
        this.plan.mode === 'find'
          ? this.cards.find((x) => word(x.card) === word(r.ask!))!
          : this.plan.mode === 'opposite'
            ? this.cards.find((x) => opposites(x.card, r.ask!))!
            : this.plan.mode === 'spot'
              ? this.cards.find((x) => this.cards.some((o) => o !== x && opposites(o.card, x.card)))!
              : this.cards.find((x) => !x.done)!;
    }
  }

  /** A right answer; level 7 names the middle it found ("Yes! Warm is in between."). */
  private async right(cs: CardView[], middle?: string) {
    this.busy = true;
    this.glowing = null;
    for (const c of cs) this.drawCard(c, true);
    sfx.sparkle();
    this.ctx.pet.cheer();
    // The praise starts and the next question follows the 0.3 s beat (U7 R4); the last one is heard out.
    const said = middle ? this.ctx.say('opp.isbetween', { word: middle }) : this.ctx.say('opp.yay');
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
  bands: ['lap', 'toddler', 'preschool', 'prek'],
  levels: (band) => rangeFor(LEVELS, band),
  entryLevels: [BIG_LEVEL],
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  coplayHint: 'Act them out together: stretch up big, curl up small, a happy face, a sad face.',
  offScreen: 'Play opposites with toys: put the teddy up high, then down low; open the box, close the box.',
  hubIcon: () => new OppIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new Opposites(ctx),
};
