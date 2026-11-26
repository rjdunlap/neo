import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, RAINBOW, swatch, wood, type ColorName } from '../../art/palette';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { RoundButton } from '../../ui/buttons';
import { arrowIcon } from '../../ui/icons';
import { label } from '../../ui/text';
import { frameFor, toReal, type Frame } from './frame';
import type { Game, GameContext, TouchIntent } from '../types';
import { bowIcon, dashed, giftBox, ribbon, scissorsIcon, spoolBar } from './art';
import {
  FIT_ORDER,
  FIT_WRITTEN,
  FitBench,
  fitRound,
  HALF,
  total,
  trayLayout,
  UNIT,
  WRITTEN,
  type FitChoice,
  type FitHint,
  type Piece,
} from './logic';

const TAG_Y = 82;
const SPOOL_Y = 205;
const BENCH_Y = 355;
/** The answer cards: 220 by 110 in two columns, 16 apart, standing where the tray stood. */
const CARD = { w: 220, h: 110, gap: 16 };
/** A measuring piece's label sits this far above the bench's middle. */
const LABEL_UP = 84;
/** The gift stands this far past a whole's end, clear of the unit labels and of a piece that runs long. */
const GIFT_PAST = 60;
/** Seconds the unit-comparison pulse stays up unless a tap ends it. */
const PULSE = 1.0;

/**
 * Level 8, How Many Pieces Fit?: a three-quarter order is measured with half-spool pieces, one of them snipped in half;
 * then she says how many pieces fit. See docs/definitions/how-many-pieces-fit.md.
 */
export class HowManyFit implements Game {
  /** The real view, and the frame the scene lays out in: the same view sideways, a scaled world upright. */
  private real: View;
  private frame: Frame;
  private view: View;
  private readonly world = new Container();
  private get x0() {
    return this.frame.x0;
  }
  readonly bench: FitBench;
  /** A finished round is tying its bow; touches wait. */
  busy = false;
  /** The scissors are on: the next tap on a tray piece snips it, anything else turns them off. */
  snipping = false;
  private clock = 0;
  private readonly colors = new Map<number, ColorName>();
  private readonly giftColor: ColorName;
  private pulse = 0;
  private readonly catcher = new Graphics();
  private readonly decor = new Graphics();
  private readonly flash = new Graphics();
  private readonly glow = new Graphics();
  private readonly pulseLayer = new Container();
  private readonly tag = new Container();
  private readonly giftLayer = new Container();
  private readonly benchLayer = new Container();
  private readonly trayLayer = new Container();
  /** The pieces' and answers' drawings, rebuilt after every action. */
  readonly trayCards = new Map<number, Container>();
  readonly benchPieces = new Map<number, Container>();
  readonly answerCards = new Map<FitChoice, Container>();
  readonly bow: RoundButton;
  readonly scissors: RoundButton;
  readonly undo: RoundButton;
  private spoolLabel: ReturnType<typeof label> | null = null;
  private orderLabel: ReturnType<typeof label> | null = null;
  private readonly cancel = () => this.snipOff();

  constructor(private readonly ctx: GameContext) {
    this.real = ctx.view;
    this.frame = frameFor(ctx.view);
    this.view = this.frame.view;
    this.bench = new FitBench(fitRound(ctx.rng));
    const paint = new Rng(this.bench.round.paint);
    this.giftColor = RAINBOW[paint.int(0, RAINBOW.length - 1)];
    this.colors.set(0, this.giftColor);
    this.colors.set(1, RAINBOW[paint.int(0, RAINBOW.length - 1)]);
    this.catcher.eventMode = 'static';
    this.catcher.on('pointerdown', () => {
      this.endPulse();
      this.snipOff();
    });
    for (const c of [this.flash, this.glow, this.decor, this.giftLayer, this.pulseLayer])
      c.eventMode = 'none';
    onTap(
      this.tag,
      () => {
        if (this.snipOff() || this.busy || this.bench.done) return;
        this.endPulse();
        this.ask();
      },
      { cooldown: 600 },
    );
    this.bow = new RoundButton(bowIcon(), swatch.green, 60, () => this.check());
    this.scissors = new RoundButton(scissorsIcon(), swatch.yellow, 60, () => this.toggleSnip());
    this.undo = new RoundButton(arrowIcon(-1), swatch.white, 60, () => {
      if (this.snipOff() || this.busy || this.bench.done) return;
      this.endPulse();
      if (this.bench.undo()) {
        sfx.tick();
        this.draw();
      }
    });
    ctx.stage.addChild(this.catcher, this.world);
    this.world.addChild(
      this.decor,
      this.giftLayer,
      this.tag,
      this.flash,
      this.benchLayer,
      this.pulseLayer,
      this.trayLayer,
      this.glow,
      this.bow,
      this.scissors,
      this.undo,
    );
    this.ctx.listen(window, 'pointercancel', this.cancel, true);
    this.ctx.listen(window, 'blur', this.cancel);
    this.layout();
  }

  get state() {
    return this.bench.state;
  }
  get misses() {
    return this.bench.misses;
  }
  get hints() {
    return this.bench.hints;
  }

  private colorOf(p: Piece): ColorName {
    return this.colors.get(p.id) ?? this.giftColor;
  }

  private ask() {
    void this.ctx.instruct(this.bench.tag === 1 ? 'ribbon.fit.ask' : 'ribbon.fit.ask2');
  }

  /** Turn the scissors off; true when they were on, so the touch that did it does nothing else. */
  private snipOff(): boolean {
    if (!this.snipping) return false;
    this.snipping = false;
    this.draw();
    return true;
  }

  private toggleSnip() {
    if (this.busy || this.bench.done || this.bench.tag !== 1) return;
    this.endPulse();
    if (this.snipOff()) return;
    if (!this.state.tray.some((p) => p.size === HALF)) {
      void this.ctx.say('ribbon.snip.none');
      return;
    }
    this.snipping = true;
    void this.ctx.say('ribbon.snip.on');
    this.draw();
  }

  private tapTray(p: Piece) {
    if (this.busy || this.bench.done || this.bench.tag !== 1) return;
    if (this.snipping) {
      this.snipping = false;
      if (p.size !== HALF) {
        void this.ctx.say('ribbon.snip.quarter');
        this.draw();
        return;
      }
      const color = this.colorOf(p),
        first = this.state.nextId;
      this.bench.act({ kind: 'snip', id: p.id });
      this.colors.set(first, color);
      this.colors.set(first + 1, color);
      sfx.snip();
      void this.ctx.say('ribbon.fit.snip');
      this.draw();
      return;
    }
    if (!this.bench.act({ kind: 'place', id: p.id })) {
      sfx.boing();
      void this.ctx.say('ribbon.full');
      const card = this.trayCards.get(p.id);
      if (card)
        void this.ctx.tw
          .to(card, { rotation: 0.08 }, { duration: 0.06 })
          .then(() => this.ctx.tw.to(card, { rotation: -0.08 }, { duration: 0.1 }))
          .then(() => this.ctx.tw.to(card, { rotation: 0 }, { duration: 0.06 }));
      return;
    }
    sfx.pop(total(this.state.bench) + 2);
    void this.ctx.say(p.size === HALF ? 'ribbon.fit.piece' : 'ribbon.fit.halfPiece');
    this.draw(p.id);
  }

  private tapBench(p: Piece) {
    if (this.snipOff() || this.busy || this.bench.done) return;
    if (this.bench.tag === 2) {
      // The accepted bench stays; a tap repeats the unit labels.
      sfx.tick();
      void this.ctx.say(p.size === HALF ? 'ribbon.fit.piece' : 'ribbon.fit.halfPiece');
      return;
    }
    this.bench.act({ kind: 'return', id: p.id });
    sfx.tick();
    this.draw(p.id);
  }

  private tapAnswer(c: FitChoice) {
    if (this.busy || this.bench.done || this.bench.tag !== 2) return;
    this.endPulse();
    if (this.bench.choose(c)) sfx.tick();
    this.draw();
  }

  private check() {
    if (this.snipOff() || this.busy || this.bench.done) return;
    this.endPulse();
    const glowing = this.bench.tally.glow,
      tag = this.bench.tag,
      before = this.state,
      v = this.bench.check();
    if (v === 'empty') {
      void this.ctx.say(tag === 1 ? 'ribbon.empty' : 'ribbon.fit.pick');
      return;
    }
    if (v === 'right') {
      if (tag === 1) this.measured(before.bench.length > 2);
      else this.succeed();
      return;
    }
    sfx.boing();
    if (tag === 1) this.flashMiss(v as 'short' | 'long');
    else if (v === 'wrong_unit') this.showPulse();
    const glow = this.bench.tally.glow && !glowing;
    void this.ctx.say(
      glow
        ? 'ribbon.hint'
        : v === 'short'
          ? 'ribbon.fit.short'
          : v === 'long'
            ? 'ribbon.fit.long'
            : v === 'wrong_unit'
              ? 'ribbon.fit.wrongUnit'
              : 'ribbon.fit.wrong',
    );
    this.draw();
  }

  /** Tag 1 is made: the pieces stay, and tag 2 asks how many fit. */
  private measured(allHalves: boolean) {
    this.busy = true;
    this.snipping = false;
    this.draw();
    const at = toReal(this.frame, this.x0 + FIT_ORDER * UNIT, BENCH_Y - 60);
    this.ctx.particles.burst(at.x, at.y, {
      colors: [swatch[this.giftColor].fill, swatch.yellow.fill],
      count: 12,
    });
    [0, 2, 4].forEach((step, i) => void this.ctx.tw.wait(i * 0.12).then(() => sfx.bell(step, 0.25)));
    void this.ctx
      .say(allHalves ? 'ribbon.fit.made.halves' : 'ribbon.fit.made')
      .then(() => this.ctx.tw.wait(0.3))
      .then(() => {
        this.busy = false;
        this.layout();
        this.ask();
      });
  }

  private succeed() {
    this.busy = true;
    this.draw();
    this.drawGift(true);
    const at = toReal(this.frame, this.x0 + 4 * UNIT + GIFT_PAST, BENCH_Y - 40);
    this.ctx.particles.burst(at.x, at.y, {
      colors: [swatch[this.giftColor].fill, swatch.yellow.fill],
      count: 18,
    });
    [0, 2, 4, 5, 7].forEach((step, i) => void this.ctx.tw.wait(i * 0.12).then(() => sfx.bell(step, 0.25)));
    void this.ctx
      .say('ribbon.fit.done')
      .then(() => this.ctx.tw.wait(0.4))
      .then(() => this.ctx.finish({ misses: this.misses, hints: this.hints }));
  }

  askForHint() {
    if (this.busy || this.bench.done) return;
    if (this.bench.askHint()) void this.ctx.say('ribbon.hint');
    this.draw();
  }
  readonly hintLabel = 'Show a hint';

  restart() {
    if (this.busy || this.bench.done) return;
    this.snipping = false;
    this.endPulse();
    this.bench.restart();
    this.draw();
  }

  private flashMiss(v: 'short' | 'long') {
    const end = this.x0 + total(this.state.bench) * UNIT,
      goal = this.x0 + FIT_ORDER * UNIT;
    const [a, b] = v === 'short' ? [end, goal] : [goal, end];
    this.ctx.tw.kill(this.flash);
    this.flash
      .clear()
      .roundRect(a, BENCH_Y - 46, b - a, 92, 12)
      .fill({ color: v === 'short' ? swatch.yellow.fill : swatch.red.fill, alpha: 0.55 });
    this.flash.alpha = 1;
    void this.ctx.tw.to(this.flash, { alpha: 0 }, { duration: 1.6 });
  }

  /** Two snipped halves side by side inside a one-piece outline: two halves of a piece make a piece. */
  private showPulse() {
    this.endPulse();
    const y = BENCH_Y + 105,
      g = new Graphics();
    for (let i = 0; i < 2; i++) {
      const half = ribbon(UNIT - 6, this.giftColor, 44);
      half.position.set(this.x0 + (i + 0.5) * UNIT, y);
      this.pulseLayer.addChild(half);
    }
    g.roundRect(this.x0 - 6, y - 34, 2 * UNIT + 12, 68, 12).stroke({ width: 5, color: swatch.purple.line });
    const t = label('1 piece', 28);
    t.anchor?.set(0.5);
    t.position.set(this.x0 + UNIT, y - 52);
    this.pulseLayer.addChild(g, t);
    this.pulse = PULSE;
  }
  private endPulse() {
    this.pulse = 0;
    for (const c of this.pulseLayer.removeChildren()) c.destroy({ children: true });
  }

  /** The hint glow's target for an action, the bow or an answer card. */
  private targetOf(h: FitHint): Container | null {
    if (this.snipping && h.kind !== 'snip') return this.scissors;
    if (h.kind === 'check') return this.bow;
    if (h.kind === 'choose') return this.answerCards.get(h.choice) ?? null;
    if (h.kind === 'return') return this.benchPieces.get(h.id) ?? null;
    if (h.kind === 'snip') return this.snipping ? (this.trayCards.get(h.id) ?? null) : this.scissors;
    return this.trayCards.get(h.id) ?? null;
  }

  private drawGlow() {
    this.glow.clear();
    if (!this.bench.tally.glow || this.busy || this.bench.done) return;
    const h = this.bench.hint();
    const t = h && this.targetOf(h);
    if (!t) return;
    const b = t.getLocalBounds();
    if (t instanceof RoundButton) this.glow.circle(t.x, t.y, t.radius + 12);
    else this.glow.roundRect(t.x + b.x - 10, t.y + b.y - 10, b.width + 20, b.height + 20, 20);
    this.glow.stroke({ width: 8, color: swatch.yellow.line });
  }

  private drawGift(tied: boolean) {
    for (const c of this.giftLayer.removeChildren()) {
      this.ctx.tw.kill(c.scale);
      c.destroy({ children: true });
    }
    const box = giftBox(this.giftColor, tied);
    box.position.set(this.x0 + 4 * UNIT + GIFT_PAST, BENCH_Y);
    this.giftLayer.addChild(box);
    if (tied) {
      box.scale.set(0.7);
      void this.ctx.tw
        .to(box.scale, { x: 1.1, y: 1.1 }, { duration: 0.2 })
        .then(() => this.ctx.tw.to(box.scale, { x: 1, y: 1 }, { duration: 0.2 }));
    }
  }

  private drawTag() {
    for (const c of this.tag.removeChildren()) c.destroy({ children: true });
    const g = new Graphics();
    g.roundRect(-150, -52, 300, 104, 18).fill(cream).stroke({ width: 5, color: swatch.brown.line });
    g.circle(-132, 0, 7).fill(swatch.brown.line);
    // A mini spool with the order in the gift's colour.
    g.roundRect(-110, -14, 160, 28, 6)
      .fill(swatch.white.light)
      .stroke({ width: 3, color: swatch.white.line });
    g.roundRect(-110, -14, (160 * FIT_ORDER) / 4, 28, 6)
      .fill(swatch[this.giftColor].fill)
      .stroke({ width: 3, color: swatch[this.giftColor].line });
    this.tag.addChild(g);
    const t = label(this.bench.tag === 1 ? WRITTEN[FIT_ORDER] : '?', 54);
    t.anchor?.set(0.5);
    t.position.set(105, 0);
    this.tag.addChild(t);
    this.tag.hitArea = new Rectangle(-150, -52, 300, 104);
  }

  /** A small strip for an answer card: whole pieces, then the part of a piece the answer names. */
  private answerIcon(c: FitChoice): Graphics {
    const unit = 54,
      parts: Record<FitChoice, number[]> = { '1': [1], '1_1/4': [1, 0.25], '1_1/2': [1, 0.5], '2': [1, 1] };
    const g = new Graphics();
    let x = 0;
    for (const f of parts[c]) {
      g.roundRect(x, 0, unit * f - 4, 22, 5)
        .fill(swatch[this.giftColor].fill)
        .stroke({ width: 3, color: swatch[this.giftColor].line });
      x += unit * f + 4;
    }
    g.pivot.set((x - 4) / 2, 11);
    return g;
  }

  /** Rebuild the tray (or answer cards) and the bench from the state; `moved` pops as it lands. */
  private draw(moved?: number) {
    const v = this.view,
      s = this.state,
      two = this.bench.tag === 2;
    for (const c of [...this.trayLayer.removeChildren(), ...this.benchLayer.removeChildren()]) {
      this.ctx.tw.kill(c);
      this.ctx.tw.kill(c.scale);
      c.destroy({ children: true });
    }
    this.trayCards.clear();
    this.benchPieces.clear();
    this.answerCards.clear();
    if (two) this.drawAnswers();
    else
      for (const spot of trayLayout(s.tray, this.frame.trayLeft)) {
        const p = s.tray.find((q) => q.id === spot.id)!,
          len = p.size * UNIT,
          card = new Container();
        const wiggle = this.snipping && p.size === HALF;
        card.addChild(
          new Graphics()
            .roundRect(-len / 2, -55, len, 110, 16)
            .fill(wiggle ? swatch.yellow.light : cream)
            .stroke({ width: 4, color: wiggle ? swatch.yellow.line : swatch.brown.line }),
        );
        const bar = ribbon(len - 20, this.colorOf(p), 38);
        bar.y = 22;
        card.addChild(bar);
        const t = label(p.size === HALF ? '½ spool' : '½ piece', p.size === HALF ? 30 : 24);
        t.anchor?.set(0.5);
        t.y = -22;
        card.addChild(t);
        card.position.set(spot.x, v.h - 90 - spot.row * 125);
        onTap(card, () => this.tapTray(p), { cooldown: 250 });
        card.hitArea = new Rectangle(-len / 2, -55, len, 110);
        this.trayLayer.addChild(card);
        this.trayCards.set(p.id, card);
        if (p.id === moved) {
          card.scale.set(0.8);
          void this.ctx.tw.to(card.scale, { x: 1, y: 1 }, { duration: 0.18 });
        }
      }
    let at = 0;
    for (const p of s.bench) {
      const len = p.size * UNIT,
        piece = new Container();
      piece.addChild(ribbon(len - 4, this.colorOf(p)));
      piece.position.set(this.x0 + (at + p.size / 2) * UNIT, BENCH_Y);
      at += p.size;
      onTap(piece, () => this.tapBench(p), { cooldown: 250 });
      piece.hitArea = new Rectangle(-len / 2, -60, len, 120);
      if (two) {
        // The unit brackets: a whole piece, or half of a piece.
        const b = new Graphics();
        b.moveTo(-len / 2 + 4, -LABEL_UP + 22)
          .lineTo(-len / 2 + 4, -LABEL_UP + 32)
          .lineTo(len / 2 - 4, -LABEL_UP + 32)
          .lineTo(len / 2 - 4, -LABEL_UP + 22)
          .stroke({ width: 4, color: swatch.purple.line });
        const t = label(p.size === HALF ? '1 piece' : '½ piece', 26);
        t.anchor?.set(0.5);
        t.y = -LABEL_UP + 6;
        piece.addChild(b, t);
      }
      this.benchLayer.addChild(piece);
      this.benchPieces.set(p.id, piece);
      if (p.id === moved) {
        piece.scale.set(1, 1.25);
        void this.ctx.tw.to(piece.scale, { x: 1, y: 1 }, { duration: 0.18 });
      }
    }
    this.scissors.visible = !two;
    this.scissors.alpha = this.snipping ? 1 : 0.92;
    this.undo.alpha = this.bench.canUndo ? 1 : 0.5;
    this.drawTag();
    this.drawGlow();
  }

  /** Tag 2's four answer cards in a 2 by 2 grid, in the round's order. */
  private drawAnswers() {
    const v = this.view,
      picked = this.bench.choice;
    this.bench.round.cards.forEach((c, i) => {
      const col = i % 2,
        row = Math.floor(i / 2),
        card = new Container(),
        on = picked === c;
      card.addChild(
        new Graphics()
          .roundRect(-CARD.w / 2, -CARD.h / 2, CARD.w, CARD.h, 16)
          .fill(on ? swatch.yellow.light : cream)
          .stroke({ width: on ? 7 : 4, color: on ? swatch.yellow.line : swatch.brown.line }),
      );
      const t = label(FIT_WRITTEN[c], 46);
      t.anchor?.set(0.5);
      t.y = -18;
      const icon = this.answerIcon(c);
      icon.y = 28;
      card.addChild(t, icon);
      card.position.set(
        this.frame.trayLeft + CARD.w / 2 + col * (CARD.w + CARD.gap),
        v.h - 90 - (1 - row) * (CARD.h + CARD.gap),
      );
      card.hitArea = new Rectangle(-CARD.w / 2, -CARD.h / 2, CARD.w, CARD.h);
      onTap(card, () => this.tapAnswer(c), { cooldown: 250 });
      this.trayLayer.addChild(card);
      this.answerCards.set(c, card);
    });
  }

  private layout() {
    const v = this.view;
    this.world.scale.set(this.frame.s);
    this.world.position.set(0, this.frame.y);
    this.catcher.clear().rect(0, 0, this.real.w, this.real.h).fill(swatch.pink.light);
    const g = this.decor.clear();
    // The spool: one whole, the same length as a whole on the bench.
    spoolBar(g, this.x0, SPOOL_Y, 4 * UNIT, 34);
    // The bench: a plank one spool long, and the dashed outline of the order's length.
    g.roundRect(this.x0 - 14, BENCH_Y + 44, 4 * UNIT + 28, 22, 8)
      .fill(wood.fill)
      .stroke({ width: 4, color: wood.line });
    const end = this.x0 + FIT_ORDER * UNIT;
    dashed(g, this.x0, BENCH_Y - 36, end, BENCH_Y - 36, swatch.brown.line);
    dashed(g, this.x0, BENCH_Y + 36, end, BENCH_Y + 36, swatch.brown.line);
    dashed(g, this.x0, BENCH_Y - 36, this.x0, BENCH_Y + 36, swatch.brown.line);
    g.moveTo(end, BENCH_Y - 46)
      .lineTo(end, BENCH_Y + 46)
      .stroke({ width: 6, color: swatch.brown.line });
    if (!this.spoolLabel) {
      this.spoolLabel = label('1 whole spool', 30);
      this.spoolLabel.anchor?.set(0.5);
      this.orderLabel = label('¾ spool', 28);
      this.orderLabel.anchor?.set(0.5);
      this.world.addChildAt(this.spoolLabel, 1);
      this.world.addChildAt(this.orderLabel, 1);
    }
    this.spoolLabel.position.set(this.x0 + 2 * UNIT, SPOOL_Y - 44);
    // Under the order's end, clear of the bench's plank at the left and the gift above.
    this.orderLabel!.position.set(this.x0 + 1.5 * UNIT, BENCH_Y + 84);
    this.tag.position.set(Math.max(300, v.w / 2 - 120), TAG_Y);
    this.undo.position.set(v.w - 80, TAG_Y);
    this.scissors.position.set(v.w - 80, v.h - 215);
    this.bow.position.set(v.w - 80, v.h - 90);
    // A resize while the bow ties keeps the tied gift.
    if (this.busy && this.bench.done) return;
    this.drawGift(false);
    this.draw();
  }

  start() {
    this.ask();
  }

  resize(v: View) {
    this.real = v;
    this.frame = frameFor(v);
    this.view = this.frame.view;
    this.endPulse();
    this.layout();
  }

  update(dt: number) {
    this.clock += dt;
    this.glow.alpha = 0.65 + 0.35 * Math.sin(this.clock * 3);
    if (this.pulse > 0 && (this.pulse -= dt) <= 0) this.endPulse();
    if (this.snipping)
      for (const [id, card] of this.trayCards)
        if (this.state.tray.find((p) => p.id === id)?.size === HALF)
          card.rotation = Math.sin(this.clock * 14) * 0.03;
  }

  /** The ghost finger: follow the hint path, pressing the scissors before a snip, and the bow when the bench or answer is right. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.bench.done) return null;
    const h = this.bench.hint();
    const t = h && this.targetOf(h);
    return t ? { tap: { on: t } } : null;
  }

  destroy() {
    this.endPulse();
  }
}
