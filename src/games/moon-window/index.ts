import { Container, Graphics, Rectangle } from 'pixi.js';
import { swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { drawLitOutline, drawMoon, drawWall, frameArt, iconArt, laterArt, requestArt, shutterArt, stickerArt, windowArt } from './art';
import { AMOUNT_WORDS, amountOf, CardRound, center, compareBoards, LOOK_PRESSES, lookStart, lookViews, missSpot, moonPlan, sameBoards, viewLine, windowLayout, type Plan, type WindowLayout } from './logic';

/** Each level's authored first round leads its first round of a session, and every demonstration. */
const authoredShown = new Set<number>();

/** The window's stars, as fractions of its radius: a quiet sky with nothing that implies an hour. */
const STARS = [{ x: -0.62, y: -0.48 }, { x: 0.58, y: -0.62 }, { x: 0.7, y: 0.4 }, { x: -0.5, y: 0.66 }, { x: 0.1, y: -0.82 }, { x: -0.82, y: 0.08 }];
const WINDOW_D = 340;
const CARD = 220;
const THUMB_R = 36;

interface Card {
  node: Container;
  moon: Graphics;
  outline: Graphics;
  k: number;
}

const LEVELS: BandLevels = { lap: { min: 1, max: 1 }, toddler: { min: 1, max: 2 }, preschool: { min: 2, max: 3 }, prek: { min: 3, max: 3 } };

class MoonWindow implements Game {
  readonly plan: Plan;
  misses = 0;
  hints = 0;
  busy = false;
  finished = false;
  /** Level 1: the views of this round and how many have been seen (the first is on screen from the start). */
  views: number[] = [];
  shown = 1;
  presses = LOOK_PRESSES;
  readonly thumbs: Container[] = [];
  private demoReplayed = false;
  /** Levels 2–3. */
  round: CardRound | null = null;
  readonly cards: Card[] = [];

  private readonly wall = new Graphics();
  private readonly windowNode = new Container();
  private readonly moon = new Graphics();
  private readonly moonGlow = new Graphics();
  private readonly shutter: Graphics;
  readonly laterButton = new Container();
  readonly requestCard = new Container();
  private requestArt: Container | null = null;
  private readonly glow = new Graphics();
  private pulse = 0;
  private clock = 0;
  private layout: WindowLayout;
  private view: View;
  askForHint?: () => void;
  hintLabel?: string;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = moonPlan(ctx.level);
    this.layout = windowLayout(ctx.view, ctx.level) ?? windowLayout({ w: 1024, h: 768, scale: 1 }, ctx.level)!;
    const authored = !!ctx.demo || !authoredShown.has(ctx.level);
    if (!ctx.demo) authoredShown.add(ctx.level);
    ctx.stage.addChild(this.wall);
    this.shutter = shutterArt(WINDOW_D / 2);
    this.shutter.alpha = 0;
    this.windowNode.addChild(windowArt(WINDOW_D, STARS), this.moonGlow, this.moon, this.shutter);
    this.windowNode.eventMode = 'none';
    ctx.stage.addChild(this.windowNode);
    this.glow.eventMode = 'none';
    ctx.stage.addChild(this.glow);
    if (this.plan.mode === 'look') {
      this.presses = ctx.demo ? 2 : LOOK_PRESSES;
      this.views = lookViews(lookStart(ctx.rng, authored)).slice(0, this.presses + 1);
      drawMoon(this.moon, this.views[0], this.layout.moonR);
      const art = laterArt();
      this.laterButton.addChild(tile(160, 160, 'blue'), art);
      this.laterButton.hitArea = new Rectangle(-85, -85, 170, 170);
      onTap(this.laterButton, () => this.press());
      ctx.stage.addChild(this.laterButton);
      this.addThumb(this.views[0]);
      this.askForHint = () => this.nudge();
      this.hintLabel = 'Show a hint';
    } else {
      const boards = this.plan.mode === 'same' ? sameBoards(ctx.rng, authored) : compareBoards(ctx.rng, authored);
      this.round = new CardRound(ctx.demo ? boards.slice(0, 1) : boards);
      for (let i = 0; i < 2; i++) {
        const node = new Container();
        const moon = new Graphics();
        const outline = new Graphics();
        node.addChild(tile(CARD, CARD), frameArt(this.layout.cardMoonR), moon, outline);
        node.hitArea = new Rectangle(-CARD / 2, -CARD / 2, CARD, CARD);
        onTap(node, () => this.tapCard(i as 0 | 1));
        ctx.stage.addChild(node);
        this.cards.push({ node, moon, outline, k: 0 });
      }
      if (this.plan.mode === 'compare') {
        this.requestCard.addChild(tile(200, 130, 'yellow'));
        this.requestCard.hitArea = new Rectangle(-100, -65, 200, 130);
        onTap(this.requestCard, () => this.askRequest());
        ctx.stage.addChild(this.requestCard);
      }
      this.showBoard();
      this.askForHint = () => this.hint();
      this.hintLabel = 'Show a hint';
    }
    this.place();
  }

  start() {
    if (this.plan.mode === 'look') {
      void this.ctx.say('moonwindow.intro').then(() => this.ctx.say(viewLine(this.views[0]))).then(() => this.ctx.instruct('moonwindow.instruct.look'));
    } else this.askRequest();
  }

  /** The ghost finger: Later, with one free replay of the first thumbnail after the second view; the right card on a board. */
  autotouch(): TouchIntent | null {
    if (this.finished || this.busy) return null;
    if (this.plan.mode === 'look') {
      if (this.shown === 2 && !this.demoReplayed) {
        this.demoReplayed = true;
        return { tap: { on: this.thumbs[0] } };
      }
      return this.shown <= this.presses ? { tap: { on: this.laterButton } } : null;
    }
    if (!this.round || this.round.finished) return null;
    return { tap: { on: this.cards[this.round.hintFor()].node } };
  }

  // Level 1: Later ---------------------------------------------------------------------------------

  /** Later is pressed: squash at once, dim the window for a moment, open on the next view and speak it. */
  private press() {
    if (this.finished) return;
    this.pulse = 1;
    sfx.tick();
    if (this.busy || this.shown > this.presses) return;
    this.busy = true;
    void this.turn();
  }

  private async turn() {
    const tw = this.ctx.tw;
    sfx.bell(3, 0.25);
    await tw.to(this.shutter, { alpha: 1 }, { duration: 0.2, ease: ease.inQuad });
    const k = this.views[this.shown];
    this.shown++;
    drawMoon(this.moon, k, this.layout.moonR);
    this.addThumb(k);
    this.place();
    await tw.wait(0.2);
    await tw.to(this.shutter, { alpha: 0 }, { duration: 0.25, ease: ease.outQuad });
    sfx.bell(7, 0.2);
    this.busy = false;
    await this.ctx.say('moonwindow.later');
    await this.ctx.say(viewLine(k));
    if (this.shown > this.presses) void this.end();
  }

  /** One thumbnail per view seen, in order; tapping it plays its line again and pulses it. Never counted. */
  private addThumb(k: number) {
    const node = new Container();
    node.addChild(tile(120, 120), frameArt(THUMB_R), drawMoon(new Graphics(), k, THUMB_R));
    node.hitArea = new Rectangle(-60, -60, 120, 120);
    onTap(node, () => {
      if (this.ctx.tw.busy(node.scale)) return;
      sfx.tick();
      void this.ctx.say(viewLine(k));
      void this.ctx.tw.to(node.scale, { x: 1.12, y: 1.12 }, { duration: 0.12 }).then(() => this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack }));
    });
    node.scale.set(0);
    this.ctx.stage.addChild(node);
    this.thumbs.push(node);
    const slot = this.layout.ribbon[this.thumbs.length - 1];
    node.position.set(slot.x + slot.w / 2, slot.y + slot.h / 2);
    void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.35, ease: ease.outBack });
  }

  /** Show a hint at level 1: Later pulses, and nothing counts. */
  private nudge() {
    if (this.finished) return;
    this.pulse = 1;
  }

  // Levels 2–3: cards -------------------------------------------------------------------------------

  private showBoard() {
    const b = this.round!.board;
    drawMoon(this.moon, this.plan.mode === 'same' ? b.target! : 0, this.layout.moonR);
    this.cards.forEach((c, i) => {
      c.k = b.cards[i];
      drawMoon(c.moon, c.k, this.layout.cardMoonR);
      c.outline.clear();
      c.node.alpha = 1;
      c.node.scale.set(1);
    });
    if (this.plan.mode === 'compare') {
      this.requestArt?.destroy({ children: true });
      this.requestArt = requestArt(b.ask!);
      this.requestCard.addChild(this.requestArt);
    }
    this.drawGlow();
  }

  private askRequest() {
    if (!this.round || this.round.finished) return;
    const b = this.round.board;
    void this.ctx.instruct(this.plan.mode === 'same' ? 'moonwindow.instruct.same' : b.ask === 'more' ? 'moonwindow.instruct.more' : 'moonwindow.instruct.less');
  }

  private tapCard(i: 0 | 1) {
    if (this.finished || !this.round) return;
    const card = this.cards[i];
    sfx.tick();
    if (!this.ctx.tw.busy(card.node.scale)) void this.ctx.tw.to(card.node.scale, { x: 1.08, y: 1.08 }, { duration: 0.1 }).then(() => this.ctx.tw.to(card.node.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack }));
    if (this.busy) return;
    const out = this.round.tap(i);
    this.misses = this.round.misses;
    this.hints = this.round.hints;
    if (out === 'ignore') return;
    this.busy = true;
    if (out === 'wrong') void this.miss(i);
    else void this.right(i);
  }

  /** The wrong card: a boing, a comparison in words, and then the right card glows (no hint counted). */
  private async miss(i: 0 | 1) {
    const b = this.round!.board;
    const card = this.cards[i];
    const other = this.cards[1 - i];
    sfx.boing();
    if (this.plan.mode === 'same') {
      // The card slides beside the window so both show together, then returns.
      const home = { x: card.node.x, y: card.node.y };
      const beside = center(missSpot(this.view, this.layout));
      await this.ctx.tw.to(card.node, beside, { duration: 0.35, ease: ease.outQuad });
      await this.ctx.say('moonwindow.miss.same', { has: AMOUNT_WORDS[amountOf(card.k)], want: AMOUNT_WORDS[amountOf(b.target!)] });
      await this.ctx.tw.to(card.node, home, { duration: 0.35, ease: ease.outQuad });
    } else {
      // Both cards outline their lit part while the pet compares them.
      drawLitOutline(card.outline, card.k, this.layout.cardMoonR);
      drawLitOutline(other.outline, other.k, this.layout.cardMoonR);
      await this.ctx.say('moonwindow.miss.compare', { a: AMOUNT_WORDS[amountOf(card.k)], b: AMOUNT_WORDS[amountOf(other.k)] });
    }
    this.drawGlow();
    this.busy = false;
  }

  /** The right card: at level 2 it flies into the window and fits; at level 3 it glows and its amount is said. */
  private async right(i: 0 | 1) {
    const card = this.cards[i];
    const w = center(this.layout.window);
    this.glow.clear();
    sfx.bell(9, 0.3);
    this.ctx.pet.cheer();
    if (this.plan.mode === 'same') {
      const home = { x: card.node.x, y: card.node.y };
      const k = this.layout.moonR / this.layout.cardMoonR;
      await this.ctx.tw.to(card.node, { x: w.x, y: w.y }, { duration: 0.45, ease: ease.inOutSine });
      await this.ctx.tw.to(card.node.scale, { x: k, y: k }, { duration: 0.2 });
      sfx.sparkle();
      this.ctx.particles.burst(w.x, w.y, { kind: 'ring', colors: [swatch.yellow.light, swatch.white.fill], count: 10, speed: [40, 110], gravity: -20, life: [0.5, 0.9] });
      await this.ctx.say('moonwindow.right');
      await this.ctx.tw.to(card.node, { alpha: 0 }, { duration: 0.2 });
      card.node.position.set(home.x, home.y);
      card.node.scale.set(1);
    } else {
      this.ctx.particles.burst(card.node.x, card.node.y, { kind: 'ring', colors: [swatch.yellow.light, swatch.white.fill], count: 10, speed: [40, 110], gravity: -20, life: [0.5, 0.9] });
      await this.ctx.say(viewLine(card.k));
    }
    await this.ctx.tw.wait(0.3);
    if (this.round!.finished) return void this.end();
    // The next board slides in.
    for (const c of this.cards) c.node.alpha = 0;
    this.showBoard();
    this.place();
    for (const c of this.cards) {
      c.node.alpha = 0;
      c.node.y += 30;
    }
    await Promise.all(this.cards.map((c, j) => this.ctx.tw.wait(j * 0.1).then(() => this.ctx.tw.to(c.node, { alpha: 1, y: c.node.y - 30 }, { duration: 0.35, ease: ease.outBack }))));
    this.busy = false;
    this.askRequest();
  }

  /** Show a hint from the pause sheet: the right card glows; one counted hint per board, none once it already glows. */
  private hint() {
    if (this.finished || this.busy || !this.round || this.round.finished) return;
    this.round.ask();
    this.hints = this.round.hints;
    this.drawGlow();
    void this.ctx.say('moonwindow.hint');
  }

  private drawGlow() {
    const g = this.glow.clear();
    if (this.finished || !this.round || !this.round.glowing) return;
    const c = this.cards[this.round.hintFor()].node;
    g.roundRect(c.x - CARD / 2 - 12, c.y - CARD / 2 - 12, CARD + 24, CARD + 24, 30).stroke({ width: 8, color: swatch.yellow.line });
  }

  // Round end and the pause sheet -----------------------------------------------------------------------

  private async end() {
    if (this.finished) return;
    this.finished = true;
    this.glow.clear();
    const r = this.layout.moonR;
    this.moonGlow.clear().circle(0, 0, r + 26).fill({ color: swatch.yellow.light, alpha: 0.5 });
    this.moonGlow.alpha = 0;
    void this.ctx.tw.to(this.moonGlow, { alpha: 1 }, { duration: 0.6 });
    await this.ctx.tw.wait(0.6);
    this.ctx.pet.cheer();
    sfx.tada();
    await this.ctx.say('moonwindow.done');
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  /** Start again: the round from its first view or board; counts stay. */
  restart() {
    if (this.finished || this.busy) return;
    if (this.plan.mode === 'look') {
      this.shown = 1;
      for (const t of this.thumbs.splice(1)) t.destroy({ children: true });
      drawMoon(this.moon, this.views[0], this.layout.moonR);
    } else {
      this.round!.restart();
      this.showBoard();
    }
    this.place();
  }

  // Layout ------------------------------------------------------------------------------------------------

  resize(v: View) {
    this.view = v;
    this.layout = windowLayout(v, this.ctx.level) ?? this.layout;
    this.place();
  }

  private place() {
    const L = this.layout;
    drawWall(this.wall, this.view.w, this.view.h);
    const w = center(L.window);
    this.windowNode.position.set(w.x, w.y);
    const l = center(L.later);
    this.laterButton.position.set(l.x, l.y);
    const q = center(L.request);
    this.requestCard.position.set(q.x, q.y);
    this.cards.forEach((c, i) => {
      if (this.ctx.tw.busy(c.node)) return;
      const p = center(L.cards[i]);
      c.node.position.set(p.x, p.y);
    });
    this.thumbs.forEach((t, i) => {
      const slot = L.ribbon[i];
      if (slot) t.position.set(slot.x + slot.w / 2, slot.y + slot.h / 2);
    });
    this.drawGlow();
  }

  update(dt: number) {
    this.clock += dt;
    this.glow.alpha = 0.6 + 0.4 * Math.sin(this.clock * 4);
    if (this.pulse > 0) {
      this.pulse = Math.max(0, this.pulse - dt * 2.2);
      this.laterButton.scale.set(1 - 0.12 * Math.sin(this.pulse * Math.PI));
    } else this.laterButton.scale.set(1);
  }

  destroy() {
    this.requestArt?.destroy({ children: true });
  }
}

export const moonWindow: GameModule = {
  id: 'moon-window',
  name: 'Moon Window',
  titleLine: 'game.moon-window',
  region: 'tinker-lab',
  skills: ['observing', 'moon-appearance', 'matching', 'comparing'],
  bands: ['lap', 'toddler', 'preschool', 'prek'],
  levels: (b) => rangeFor(LEVELS, b),
  describeLevel: (l) => moonPlan(l).description,
  music: STYLES.lullaby,
  coplayHint: 'Before {name} presses, ask what the Moon will look like later. Then look together.',
  offScreen: "Next time you see the Moon, say how much of it is lit. If you can't see it, that counts too.",
  hubIcon: () => new WigglyIcon(iconArt()),
  touchDemo: true,
  sticker: (seed) => stickerArt(seed),
  create: (ctx) => new MoonWindow(ctx),
};
