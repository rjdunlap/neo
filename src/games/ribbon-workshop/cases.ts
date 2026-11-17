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
  CasesBench,
  casesMadeKey,
  casesRound,
  HALF,
  RAIL_CAPACITY,
  total,
  trayLayout,
  UNIT,
  WRITTEN,
  type CasesHint,
  type Piece,
  type Rail,
} from './logic';

const TAG_Y = 82;
/** The spool sits between the top controls and the benches, drawn thinner than at levels 1–3. */
const SPOOL_Y = 180;
/** The two bench rows: each 120 tall, 16 apart, and 16 above the tray's top row in a 768-tall view. */
const RAIL_Y = [286, 422] as const;
const ROW_TALL = 120;
const WHOLE = RAIL_CAPACITY * UNIT;
/**
 * Each gift stands this far past a whole's end (x = 670–790 sideways) whatever its tag asks, so a ribbon that runs past
 * its request is never under the gift and its last piece can always be tapped back.
 */
const GIFT_PAST = 60;
const RAILS: readonly Rail[] = [0, 1];
const RAIL_LINE = ['ribbon.cases.rail.top', 'ribbon.cases.rail.bottom'] as const;

/**
 * Level 7, Ribbon Cases: two gifts share one tray of a half and four quarters. Both ask for three quarters; then the
 * order card changes them to a whole and a half and she moves a quarter across. See docs/definitions/ribbon-cases.md.
 */
export class RibbonCases implements Game {
  /** The real view, and the frame the scene lays out in: the same view sideways, a scaled world upright. */
  private real: View;
  private frame: Frame;
  private view: View;
  private readonly world = new Container();
  private get giftX() {
    return this.x0 + WHOLE + GIFT_PAST;
  }
  /** Where the spool and the benches start, so a whole on one is a whole on the others. */
  private get x0() {
    return this.frame.x0;
  }
  readonly bench: CasesBench;
  /** A right check is being shown; touches wait. */
  busy = false;
  /** Both ribbons are tied round their gifts. */
  finale = false;
  /** The scissors are on: the next tap on a tray half snips it, anything else turns them off. */
  snipping = false;
  private clock = 0;
  private readonly colors = new Map<number, ColorName>();
  private readonly giftColors: [ColorName, ColorName];
  private readonly catcher = new Graphics();
  private readonly decor = new Graphics();
  private readonly outline = new Graphics();
  private readonly flash = new Graphics();
  private readonly glow = new Graphics();
  private readonly railLayer = new Container();
  private readonly trayLayer = new Container();
  /** The "1 whole" card over the spool: a tap repeats the instruction. */
  readonly tag = new Container();
  /** Tag 2's order card: the two new tags. A picture, and a second place to hear the instruction. */
  readonly orderCard = new Container();
  /** The empty part of each bench: a tap selects its gift. */
  readonly rows: [Container, Container] = [new Container(), new Container()];
  /** Each gift with its tag: the control that selects its bench. */
  readonly gifts: [Container, Container] = [new Container(), new Container()];
  /** The pieces' drawings, by id, rebuilt after every action. */
  readonly trayCards = new Map<number, Container>();
  readonly railPieces = new Map<number, Container>();
  readonly bow: RoundButton;
  readonly scissors: RoundButton;
  readonly undo: RoundButton;
  readonly hintLabel = 'Show a hint';
  private readonly cancel = () => this.snipOff();

  constructor(private readonly ctx: GameContext) {
    this.real = ctx.view;
    this.frame = frameFor(ctx.view);
    this.view = this.frame.view;
    this.bench = new CasesBench(casesRound(ctx.rng));
    const paint = new Rng(this.bench.round.paint);
    const pick = () => RAINBOW[paint.int(0, RAINBOW.length - 1)];
    for (const p of this.state.tray) this.colors.set(p.id, pick());
    const first = paint.int(0, RAINBOW.length - 1);
    this.giftColors = [
      RAINBOW[first],
      RAINBOW[(first + 1 + paint.int(0, RAINBOW.length - 2)) % RAINBOW.length],
    ];
    this.catcher.eventMode = 'static';
    this.catcher.on('pointerdown', () => this.snipOff());
    for (const c of [this.decor, this.outline, this.flash, this.glow]) c.eventMode = 'none';
    for (const r of RAILS) {
      onTap(this.rows[r], () => this.select(r), { cooldown: 250 });
      onTap(this.gifts[r], () => this.select(r), { cooldown: 250 });
    }
    for (const card of [this.tag, this.orderCard])
      onTap(
        card,
        () => {
          // The instruction waits while a right check is shown: the bench is already on the next tag, and its line would cut the one being said.
          if (this.snipOff() || this.busy || this.bench.done) return;
          this.ask();
        },
        { cooldown: 600 },
      );
    this.orderCard.visible = false;
    this.bow = new RoundButton(bowIcon(), swatch.green, 60, () => this.check());
    this.scissors = new RoundButton(scissorsIcon(), swatch.yellow, 60, () => this.toggleSnip());
    this.undo = new RoundButton(arrowIcon(-1), swatch.white, 60, () => {
      if (this.snipOff() || this.busy || this.bench.done) return;
      if (this.bench.undo()) {
        sfx.tick();
        this.draw();
      }
    });
    ctx.stage.addChild(this.catcher, this.world);
    this.world.addChild(
      this.decor,
      ...this.rows,
      this.outline,
      this.flash,
      this.railLayer,
      ...this.gifts,
      this.tag,
      this.orderCard,
      this.trayLayer,
      this.glow,
      this.bow,
      this.scissors,
      this.undo,
    );
    this.ctx.listen(window, 'pointercancel', this.cancel, true);
    this.ctx.listen(window, 'blur', this.cancel);
    this.drawTag();
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
  /** The gift that grows on tag 2. */
  private get grows(): Rail {
    return this.bench.requests[0] > this.bench.requests[1] ? 0 : 1;
  }

  private ask() {
    void this.ctx.instruct(
      this.bench.tag === 1
        ? 'ribbon.cases.ask'
        : this.grows === 0
          ? 'ribbon.cases.change.top'
          : 'ribbon.cases.change.bottom',
    );
  }

  /** A piece's ribbon colour: decoration only. A snipped half's quarters keep its colour. */
  private colorOf(p: Piece): ColorName {
    return this.colors.get(p.id) ?? 'pink';
  }

  /** Turn the scissors off; true when they were on, so the touch that did it does nothing else. */
  private snipOff(): boolean {
    if (!this.snipping) return false;
    this.snipping = false;
    this.draw();
    return true;
  }

  private toggleSnip() {
    if (this.busy || this.bench.done) return;
    if (this.snipOff()) return;
    if (!this.state.tray.some((p) => p.size === HALF)) {
      void this.ctx.say('ribbon.snip.none');
      return;
    }
    this.snipping = true;
    void this.ctx.say('ribbon.snip.on');
    this.draw();
  }

  private select(rail: Rail) {
    if (this.snipOff() || this.busy || this.bench.done) return;
    this.bench.act({ kind: 'select', rail });
    sfx.pop(rail === 0 ? 5 : 3);
    void this.ctx.say(RAIL_LINE[rail]);
    this.draw();
    const gift = this.gifts[rail];
    this.ctx.tw.kill(gift.scale);
    gift.scale.set(1.12);
    void this.ctx.tw.to(gift.scale, { x: 1, y: 1 }, { duration: 0.18 });
  }

  private tapTray(p: Piece) {
    if (this.busy || this.bench.done) return;
    if (this.snipping) {
      this.snipping = false;
      if (p.size !== HALF) {
        void this.ctx.say('ribbon.snip.quarter');
        this.draw();
        return;
      }
      const before = new Set(this.state.tray.map((q) => q.id));
      this.bench.act({ kind: 'snip', id: p.id });
      for (const q of this.state.tray) if (!before.has(q.id)) this.colors.set(q.id, this.colorOf(p));
      sfx.snip();
      void this.ctx.say('ribbon.snip.done');
      this.draw();
      return;
    }
    if (!this.bench.act({ kind: 'place', id: p.id })) {
      sfx.boing();
      void this.ctx.say('ribbon.cases.full');
      const card = this.trayCards.get(p.id);
      if (card)
        void this.ctx.tw
          .to(card, { rotation: 0.08 }, { duration: 0.06 })
          .then(() => this.ctx.tw.to(card, { rotation: -0.08 }, { duration: 0.1 }))
          .then(() => this.ctx.tw.to(card, { rotation: 0 }, { duration: 0.06 }));
      return;
    }
    sfx.pop(total(this.state.rails[this.state.active]) + 2);
    void this.ctx.say(p.size === HALF ? 'ribbon.piece.half' : 'ribbon.piece.quarter');
    this.draw(p.id);
  }

  private tapRail(p: Piece) {
    if (this.snipOff() || this.busy || this.bench.done) return;
    this.bench.act({ kind: 'return', id: p.id });
    sfx.tick();
    this.draw(p.id);
  }

  private check() {
    if (this.snipOff() || this.busy || this.bench.done) return;
    const glowing = this.bench.tally.glow,
      tag = this.bench.tag,
      made = casesMadeKey(this.state),
      v = this.bench.check();
    if (v === 'empty') {
      void this.ctx.say('ribbon.empty');
      return;
    }
    if (v === 'wrong') {
      const rails = this.bench.rails,
        wrong = rails.filter((r) => r !== 'right').length;
      sfx.boing();
      this.flashMiss();
      const hinted = this.bench.tally.glow && !glowing;
      // The line says how many ribbons are wrong, never the missing amount. The glow's own line follows it.
      void this.ctx
        .say(wrong === 1 ? 'ribbon.cases.wrong.one' : 'ribbon.cases.wrong.both')
        .then(() => (hinted ? this.ctx.say('ribbon.hint') : undefined));
      this.draw();
      return;
    }
    this.busy = true;
    this.snipping = false;
    [0, 2, 4, 5, 7].forEach((step, i) => void this.ctx.tw.wait(i * 0.12).then(() => sfx.bell(step, 0.25)));
    if (tag === 1) {
      // The benches keep her ribbons; the requests on the gifts' tags wait for the order card.
      this.requestsShown = [3, 3];
      this.draw();
      for (const r of RAILS) this.sparkle(r);
      void this.ctx
        .say(`ribbon.cases.made.${made}`)
        .then(() => this.ctx.tw.wait(0.4))
        .then(() => {
          this.requestsShown = null;
          this.busy = false;
          this.showOrder();
          this.draw();
          this.ask();
        });
      return;
    }
    void this.ctx
      .say('ribbon.cases.done')
      .then(() => {
        // Each ribbon joins into one and ties round its gift.
        this.finale = true;
        this.draw();
        for (const r of RAILS) {
          this.sparkle(r);
          const gift = this.gifts[r];
          gift.scale.set(0.7);
          void this.ctx.tw
            .to(gift.scale, { x: 1.1, y: 1.1 }, { duration: 0.2 })
            .then(() => this.ctx.tw.to(gift.scale, { x: 1, y: 1 }, { duration: 0.2 }));
        }
        return this.ctx.say('ribbon.cases.both');
      })
      .then(() => this.ctx.finish({ misses: this.misses, hints: this.hints }));
  }
  /** The requests still written on the gifts while tag 1's right check is shown (the bench has moved on to tag 2). */
  private requestsShown: readonly [number, number] | null = null;
  private get requests() {
    return this.requestsShown ?? this.bench.requests;
  }

  private sparkle(r: Rail) {
    const at = toReal(this.frame, this.giftX, RAIL_Y[r] - 30);
    this.ctx.particles.burst(at.x, at.y, {
      colors: [swatch[this.giftColors[r]].fill, swatch.yellow.fill],
      count: 12,
    });
  }

  /** The order card slides in beside the spool's card, and the gifts' tags pop as they change. */
  private showOrder() {
    this.drawOrderCard();
    this.orderCard.visible = true;
    this.orderCard.alpha = 0;
    const y = this.orderCard.y;
    this.orderCard.y = y - 40;
    void this.ctx.tw.to(this.orderCard, { alpha: 1, y }, { duration: 0.35 });
    sfx.pop(6);
    for (const gift of this.gifts) {
      this.ctx.tw.kill(gift.scale);
      gift.scale.set(1, 0.2);
      void this.ctx.tw.to(gift.scale, { x: 1, y: 1 }, { duration: 0.3 });
    }
  }

  askForHint() {
    if (this.busy || this.bench.done) return;
    if (this.bench.askHint()) void this.ctx.say('ribbon.hint');
    this.draw();
  }

  restart() {
    if (this.busy || this.bench.done) return;
    this.snipping = false;
    this.bench.restart();
    this.draw();
  }

  /** Each bench that is not right flashes its gap (too short) or the part past its request (too long). */
  private flashMiss() {
    const rails = this.bench.rails;
    this.ctx.tw.kill(this.flash);
    this.flash.clear();
    for (const r of RAILS) {
      if (rails[r] === 'right') continue;
      const end = this.x0 + total(this.state.rails[r]) * UNIT,
        goal = this.x0 + this.bench.requests[r] * UNIT;
      const [a, b] = rails[r] === 'short' ? [end, goal] : [goal, end];
      this.flash
        .roundRect(a, RAIL_Y[r] - 46, b - a, 92, 12)
        .fill({ color: rails[r] === 'short' ? swatch.yellow.fill : swatch.red.fill, alpha: 0.55 });
    }
    this.flash.alpha = 1;
    void this.ctx.tw.to(this.flash, { alpha: 0 }, { duration: 1.6 });
  }

  /** The hint glow's target for an action (or the bow). */
  private targetOf(h: CasesHint): Container | null {
    // With the scissors on, anything but a snip starts by turning them off.
    if (this.snipping && h.kind !== 'snip') return this.scissors;
    if (h.kind === 'check') return this.bow;
    if (h.kind === 'select') return this.gifts[h.rail];
    if (h.kind === 'return') return this.railPieces.get(h.id) ?? null;
    if (h.kind === 'snip') return this.snipping ? (this.trayCards.get(h.id) ?? null) : this.scissors;
    return this.trayCards.get(h.id) ?? null;
  }

  private hintTarget(): Container | null {
    const h = this.bench.hint();
    return h && this.targetOf(h);
  }

  private drawGlow() {
    this.glow.clear();
    if (!this.bench.tally.glow || this.busy || this.bench.done) return;
    const t = this.hintTarget();
    if (!t) return;
    if (t instanceof RoundButton) this.glow.circle(t.x, t.y, t.radius + 12);
    else {
      const b = t.hitArea as Rectangle;
      this.glow.roundRect(t.x + b.x - 8, t.y + b.y - 8, b.width + 16, b.height + 16, 20);
    }
    this.glow.stroke({ width: 8, color: swatch.yellow.line });
  }

  private drawTag() {
    const g = new Graphics();
    g.roundRect(-150, -52, 300, 104, 18).fill(cream).stroke({ width: 5, color: swatch.brown.line });
    g.circle(-132, 0, 7).fill(swatch.brown.line);
    spoolBar(g, -112, 0, 112, 24);
    const t = label('1 whole', 34);
    t.anchor?.set(0.5);
    t.position.set(72, 0);
    this.tag.addChild(g, t);
    this.tag.hitArea = new Rectangle(-150, -52, 300, 104);
  }

  /** A small gift and the request written beside it. */
  private miniOrder(r: Rail, request: number): Container {
    const c = new Container(),
      box = giftBox(this.giftColors[r], false);
    box.scale.set(0.42);
    box.position.set(-34, 0);
    const t = label(WRITTEN[request], 36);
    t.anchor?.set(0.5);
    t.position.set(26, 0);
    c.addChild(box, t);
    return c;
  }

  private drawOrderCard() {
    for (const c of this.orderCard.removeChildren()) c.destroy({ children: true });
    const g = new Graphics();
    g.roundRect(-90, -56, 180, 112, 16).fill(cream).stroke({ width: 5, color: swatch.orange.line });
    g.roundRect(-90, -56, 180, 14, 6).fill(swatch.orange.fill);
    g.moveTo(-70, 2).lineTo(70, 2).stroke({ width: 3, color: swatch.brown.line, alpha: 0.35 });
    this.orderCard.addChild(g);
    for (const r of RAILS) {
      const row = this.miniOrder(r, this.bench.requests[r]);
      row.position.set(0, r === 0 ? -20 : 28);
      this.orderCard.addChild(row);
    }
    this.orderCard.hitArea = new Rectangle(-90, -56, 180, 112);
  }

  /** A gift with its tag: the written request on a paper tag at its corner. */
  private drawGift(r: Rail) {
    const c = this.gifts[r],
      lit = this.state.active === r || this.finale;
    for (const k of c.removeChildren()) k.destroy({ children: true });
    const box = giftBox(this.giftColors[r], this.finale);
    box.scale.set(0.9);
    box.position.set(-12, 18);
    const paper = new Graphics();
    paper.roundRect(-32, -26, 64, 52, 10).fill(cream).stroke({ width: 4, color: swatch.brown.line });
    paper.circle(-22, -16, 4).fill(swatch.brown.line);
    const t = label(WRITTEN[this.requests[r]], 38);
    t.anchor?.set(0.5);
    t.position.set(3, 2);
    const tagC = new Container();
    tagC.addChild(paper, t);
    tagC.position.set(24, -32);
    tagC.rotation = 0.06;
    c.addChild(box, tagC);
    c.position.set(this.giftX, RAIL_Y[r]);
    c.alpha = lit ? 1 : 0.7;
    c.hitArea = new Rectangle(-60, -60, 120, 120);
  }

  /** Everything that follows the state; `moved` pops as it lands. */
  private draw(moved?: number) {
    const v = this.view,
      s = this.state;
    for (const c of [...this.trayLayer.removeChildren(), ...this.railLayer.removeChildren()]) {
      this.ctx.tw.kill(c);
      this.ctx.tw.kill(c.scale);
      c.destroy({ children: true });
    }
    this.trayCards.clear();
    this.railPieces.clear();
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
      const t = label(p.size === HALF ? '½' : '¼', 34);
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
    const o = this.outline.clear();
    for (const r of RAILS) {
      const y = RAIL_Y[r],
        lit = s.active === r && !this.finale,
        end = this.x0 + this.requests[r] * UNIT;
      // The lit bench has a soft light under it; the other is dimmed a little, never hidden.
      if (lit)
        o.roundRect(this.x0 - 24, y - ROW_TALL / 2, WHOLE + 150, ROW_TALL, 22).fill({
          color: swatch.yellow.light,
          alpha: 0.75,
        });
      o.roundRect(this.x0 - 14, y + 42, WHOLE + 28, 14, 6)
        .fill(wood.fill)
        .stroke({ width: 3, color: wood.line });
      dashed(o, this.x0, y - 36, end, y - 36, swatch.brown.line);
      dashed(o, this.x0, y + 36, end, y + 36, swatch.brown.line);
      dashed(o, this.x0, y - 36, this.x0, y + 36, swatch.brown.line);
      o.moveTo(end, y - 46)
        .lineTo(end, y + 46)
        .stroke({ width: 6, color: swatch.brown.line });
      if (this.finale) {
        const len = total(s.rails[r]) * UNIT,
          fused = ribbon(len, this.giftColors[r]);
        fused.position.set(this.x0 + len / 2, y);
        this.railLayer.addChild(fused);
      } else {
        let at = 0;
        s.rails[r].forEach((p, i) => {
          const len = p.size * UNIT,
            piece = new Container();
          piece.addChild(ribbon(len - 4, this.colorOf(p)));
          // A seam mark at each join.
          if (i > 0)
            piece.addChild(
              new Graphics()
                .moveTo(-len / 2, -26)
                .lineTo(-len / 2, 26)
                .stroke({ width: 4, color: swatch.brown.line, alpha: 0.6 }),
            );
          piece.position.set(this.x0 + (at + p.size / 2) * UNIT, y);
          piece.alpha = lit ? 1 : 0.85;
          at += p.size;
          onTap(piece, () => this.tapRail(p), { cooldown: 250 });
          piece.hitArea = new Rectangle(-len / 2, -ROW_TALL / 2, len, ROW_TALL);
          this.railLayer.addChild(piece);
          this.railPieces.set(p.id, piece);
          if (p.id === moved) {
            piece.scale.set(1, 1.25);
            void this.ctx.tw.to(piece.scale, { x: 1, y: 1 }, { duration: 0.18 });
          }
        });
      }
      this.rows[r].hitArea = new Rectangle(this.x0 - 24, y - ROW_TALL / 2, WHOLE + 24, ROW_TALL);
      this.drawGift(r);
    }
    this.scissors.alpha = this.snipping ? 1 : 0.92;
    this.undo.alpha = this.bench.canUndo ? 1 : 0.5;
    this.drawGlow();
  }

  private layout() {
    const v = this.view;
    this.world.scale.set(this.frame.s);
    this.world.position.set(0, this.frame.y);
    this.catcher.clear().rect(0, 0, this.real.w, this.real.h).fill(swatch.pink.light);
    // The spool: one whole, the same length as a whole on either bench.
    spoolBar(this.decor.clear(), this.x0, SPOOL_Y, WHOLE, 34);
    this.tag.position.set(Math.max(300, v.w / 2 - 120), TAG_Y);
    this.orderCard.position.set(this.tag.x + 150 + 20 + 90, TAG_Y);
    this.undo.position.set(v.w - 80, 82);
    this.scissors.position.set(v.w - 80, v.h - 215);
    this.bow.position.set(v.w - 80, v.h - 90);
    if (this.orderCard.visible) this.drawOrderCard();
    this.draw();
  }

  start() {
    this.ask();
  }

  resize(v: View) {
    this.real = v;
    this.frame = frameFor(v);
    this.view = this.frame.view;
    this.layout();
  }

  update(dt: number) {
    this.clock += dt;
    this.glow.alpha = 0.65 + 0.35 * Math.sin(this.clock * 3);
    if (this.snipping)
      for (const [id, card] of this.trayCards)
        if (this.state.tray.find((p) => p.id === id)?.size === HALF)
          card.rotation = Math.sin(this.clock * 14) * 0.03;
  }

  /** The ghost finger follows the hint: tray cards for the lit gift, the other gift, its cards, the bow; then the quarter across and the bow. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.bench.done) return null;
    const t = this.hintTarget();
    return t ? { tap: { on: t } } : null;
  }

  destroy() {}
}
