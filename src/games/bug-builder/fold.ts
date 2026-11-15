import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, swatch } from '../../art/palette';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import { spread, type View } from '../../engine/view';
import type { Game, GameContext, TouchIntent } from '../types';
import { bugBody, bugToken, bugWing } from './art';
import { foldBoard, type BugPlan, type FoldBoard, type FoldChoice } from './logic';

/** A choice card: wide and tall enough for a whole small bug, far past the 100-unit touch target. */
const CARD_W = 250,
  CARD_H = 240,
  /** The small bugs on the cards, and their stamps (drawn a little larger than the scale would make them, to read). */
  CARD_SCALE = 0.36,
  CARD_STAMP = 19;
/** A bug's height from the antennae (-285) to the wing tips (+207), in its own units; the board centers on it. */
const BUG_TOP = 285,
  BUG_BOTTOM = 207;

interface Card {
  node: Container;
  choice: FoldChoice;
  ring: Graphics;
}

/**
 * Level 10, Fold a friend: the left wing has three spots and the right wing is folded under. She taps the finished bug
 * she thinks the fold will make; then the wing folds across the line, the true one glows and the pet says why. The
 * prediction is unscored (as in Sink or Float): no miss, no hint, and the round ends after the fold.
 */
export class FoldFriend implements Game {
  readonly fold: FoldBoard;
  readonly cards: Card[] = [];
  /** The left wing's copy that folds across the middle line onto the right wing. */
  readonly flap = new Container();
  /** The card she tapped, or -1 before she chooses. */
  chosen = -1;
  /** The wing has folded over and the answer is showing. */
  folded = false;
  done = false;
  private readonly background = new Graphics();
  private readonly board = new Container();
  private readonly wings: [Container, Container] = [new Container(), new Container()];
  private readonly crease = new Graphics();
  private clock = 0;
  /** The cards' scale for the view: 1 in a row along the bottom, larger when a tall view stacks them under the bug. */
  private cardScale = 1;

  constructor(
    private readonly ctx: GameContext,
    plan: BugPlan,
  ) {
    this.fold = foldBoard(plan, ctx.rng);
    ctx.stage.addChild(this.background, this.board);
    this.board.addChild(bugBody(plan.rows, plan.columns, this.wings));
    for (const s of this.fold.left) {
      const t = bugToken(s.token, 38);
      t.position.set(s.x, s.y);
      this.wings[0].addChild(t);
    }
    // The right wing is folded under: a pale, empty wing until the fold shows what lands there.
    this.wings[1].alpha = 0.35;
    const ry = BUG_BOTTOM;
    for (let y = -ry - 20; y < ry + 20; y += 28)
      this.crease
        .moveTo(0, y)
        .lineTo(0, y + 13)
        .stroke({ width: 4, color: swatch.white.fill });
    this.crease.eventMode = 'none';
    this.flap.addChild(bugWing(plan.rows, plan.columns, -1));
    for (const s of this.fold.left) {
      const t = bugToken(s.token, 38);
      t.position.set(s.x, s.y);
      this.flap.addChild(t);
    }
    this.flap.visible = false;
    this.flap.eventMode = 'none';
    this.board.addChild(this.crease, this.flap);
    this.board.eventMode = 'none';
    this.fold.choices.forEach((choice, i) => {
      const node = new Container();
      const bug = bugBody(plan.rows, plan.columns);
      bug.scale.set(CARD_SCALE);
      const dy = ((BUG_TOP - BUG_BOTTOM) / 2) * CARD_SCALE;
      bug.y = dy;
      const ring = new Graphics();
      node.addChild(
        new Graphics()
          .roundRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 26)
          .fill(cream)
          .stroke({ width: 5, color: swatch.orange.line }),
        bug,
      );
      for (const s of choice.spots) {
        const t = bugToken(s.token, CARD_STAMP);
        t.position.set(s.x * CARD_SCALE, s.y * CARD_SCALE + dy);
        node.addChild(t);
      }
      node.addChild(ring);
      node.hitArea = new Rectangle(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H);
      onTap(node, () => void this.choose(i));
      ctx.stage.addChild(node);
      this.cards.push({ node, choice, ring });
    });
  }

  start() {
    void this.ctx.instruct('bug.fold');
  }

  /** Her prediction: the card answers the touch at once, then the wing folds over and shows the true one. */
  async choose(i: number) {
    if (this.chosen >= 0) return;
    const ctx = this.ctx,
      tw = ctx.tw,
      card = this.cards[i];
    this.chosen = i;
    sfx.tick();
    card.ring
      .roundRect(-CARD_W / 2 - 8, -CARD_H / 2 - 8, CARD_W + 16, CARD_H + 16, 32)
      .stroke({ width: 8, color: swatch.blue.line });
    const k = this.cardScale;
    card.node.scale.set(0.94 * k);
    void tw.to(card.node.scale, { x: k, y: k }, { duration: 0.3, ease: ease.outBack });
    void ctx.say('bug.foldGo');
    await tw.wait(0.6);
    this.flap.visible = true;
    await tw.to(this.flap.scale, { x: -1 }, { duration: 1, ease: ease.inOutSine });
    this.wings[1].alpha = 1;
    this.folded = true;
    sfx.bell(7, 0.3);
    ctx.pet.cheer();
    const answer = this.cards[this.fold.answer];
    answer.ring
      .clear()
      .roundRect(-CARD_W / 2 - 8, -CARD_H / 2 - 8, CARD_W + 16, CARD_H + 16, 32)
      .stroke({ width: 9, color: swatch.yellow.line });
    const big = this.cardScale * 1.08;
    void tw.to(answer.node.scale, { x: big, y: big }, { duration: 0.35, ease: ease.outBack });
    await ctx.say(i === this.fold.answer ? 'bug.foldYes' : 'bug.foldThis');
    await ctx.say('bug.foldWhy');
    await tw.wait(0.6);
    this.done = true;
    ctx.finish({ misses: 0, hints: 0 });
  }

  resize(v: View) {
    this.background.clear().rect(0, 0, v.w, v.h).fill(swatch.green.light);
    const gap = 24,
      bugH = BUG_TOP + BUG_BOTTOM;
    let bugScale: number, k: number;
    if (v.h > v.w * 1.3) {
      // A tall view (a phone held upright): the bug across the top, the cards stacked larger in the middle below it,
      // each clear of the pet's corner at the bottom left.
      bugScale = Math.min(1, (v.w - 80) / 640);
      const top = 20 + bugH * bugScale + 40,
        room = v.h - 30 - top;
      k = Math.min(1.6, (room - 2 * gap) / (3 * CARD_H), (v.w - 2 * 175) / CARD_W);
      const step = CARD_H * k + gap,
        y0 = top + room / 2 - step;
      this.cards.forEach((c, i) => c.node.position.set(v.w / 2, y0 + i * step));
    } else {
      // The cards sit in a row along the bottom, right of the pet's corner; the bug fills the space above them.
      k = Math.min(1, (v.w - 220 - 2 * gap) / (3 * CARD_W));
      const cardY = v.h - (CARD_H * k) / 2 - 28;
      const xs = spread(3, 175, v.w - 45, CARD_W * k + gap);
      this.cards.forEach((c, i) => c.node.position.set(xs[i], cardY));
      const room = cardY - (CARD_H * k) / 2 - 40;
      bugScale = Math.min(0.85, room / bugH, (v.w - 120) / 640);
    }
    this.cardScale = k;
    this.cards.forEach((c, i) => {
      this.ctx.tw.kill(c.node.scale);
      c.node.scale.set(this.folded && i === this.fold.answer ? k * 1.08 : k);
    });
    this.board.scale.set(bugScale);
    this.board.position.set(v.w / 2, 20 + BUG_TOP * bugScale);
  }

  update(dt: number) {
    this.clock += dt;
    if (this.folded) this.cards[this.fold.answer].ring.alpha = 0.65 + 0.35 * Math.sin(this.clock * 4);
  }

  /** The ghost finger taps the true fold, and the fold shows why. */
  autotouch(): TouchIntent | null {
    if (this.chosen >= 0) return null;
    return { tap: { on: this.cards[this.fold.answer].node } };
  }

  destroy() {}
}
