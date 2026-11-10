import { Container, Graphics, Rectangle, type Text } from 'pixi.js';
import { frogArt } from '../../art/animals';
import { ink, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { idle, type CouchControls } from '../../engine/controller';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import { spread, type View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  LEVELS,
  answerOf,
  answerSlot,
  GAP_CARDS,
  makeQuestions,
  planFor,
  PLANS,
  missKind,
  hintCharge,
  stickerNumber,
  WINDOW,
  type HopPlan,
  type HopQuestion,
  splitsAtTen,
  isFrac,
  fracMiss,
  matchMiss,
  fracName,
  fracWords,
  quarterName,
  hopWords,
  sizeName,
  sizeWord,
  hopsWords,
  hopPhrase,
} from './logic';

const STEP = 104;

class Pad extends Container {
  readonly num: Text;
  n = 0;
  constructor() {
    super();
    this.addChild(
      new Graphics()
        .ellipse(0, 0, 48, 28)
        .fill(swatch.green.light)
        .stroke({ width: 5, color: swatch.green.line })
        .moveTo(0, 0)
        .lineTo(30, -16)
        .stroke({ width: 4, color: swatch.green.line }),
    );
    this.num = label('0', 34, ink);
    this.num.y = 44;
    this.addChild(this.num);
    this.hitArea = new Rectangle(-STEP / 2, -70, STEP, 140);
  }
  set(n: number) {
    this.n = n;
    this.num.text = String(n);
  }
  /** Fraction levels: show a name (or nothing) under the pad without changing which tick it is. */
  mark(text: string) {
    this.num.text = text;
  }
}

class FrogHop implements Game {
  readonly plan: HopPlan;
  readonly questions: HopQuestion[];
  readonly pads: Pad[] = [];
  readonly cards: { n: number; node: Container }[] = [];
  readonly frog = frogArt();
  /** The number the frog sits on. */
  at = 0;
  lo = 0;
  index = -1;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;

  private readonly backdrop: Backdrop;
  private readonly row = new Container();
  private readonly sign = new Container();
  private readonly signBoard = new Graphics();
  private readonly signText: Text;
  /** Fraction levels: "one whole" under pads 0 to 1, and Fraction Match's flag on the first landing. */
  private readonly bracket = new Container();
  private readonly bracketLine = new Graphics();
  private readonly flag = new Graphics();
  /** Fraction Match lands on a pad first, then asks for a card. */
  private matchStage: 'land' | 'count' = 'land';
  private readonly glow = new Graphics();
  private view: View;
  private wrongs = 0;
  private helped = false;
  private inertTaps = 0;
  private glowing: Container | null = null;
  private clock = 0;
  // Couch play: a ring over the lily pads (or the number cards on counting levels).
  private focus = 0;
  private couchOn = false;
  /** Make-ten asks for the bridge to ten before its final landing. */
  private makeTenStage: 'bridge' | 'rest' = 'bridge';
  private readonly ring = new Graphics();
  private botWait = 1.5;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.questions = makeQuestions(this.plan, ctx.rng);
    this.backdrop = new Backdrop(
      {
        sky: [0x8fd3f7, 0xe9f7ff],
        hills: [0x7fd0e8, 0x5bb8d8, 0x4aa8c9],
        horizon: 0.42,
        clouds: 2,
        sun: true,
        seed: 61,
      },
      ctx.view,
    );
    this.signText = label('', 46, ink);
    this.sign.addChild(this.signBoard, this.signText);
    this.setSign('');
    this.glow.eventMode = 'none';
    this.frog.eventMode = 'none';
    this.bracket.eventMode = 'none';
    this.flag.eventMode = 'none';
    this.flag.visible = false;
    // A little code-drawn flag planted behind the pad, so the frog can land beside it.
    this.flag
      .moveTo(30, 6)
      .lineTo(30, -96)
      .stroke({ width: 6, color: wood.line })
      .poly([33, -96, 76, -82, 33, -66])
      .fill(swatch.red.fill)
      .stroke({ width: 4, color: swatch.red.line });
    const whole = label('one whole', 28, ink);
    whole.y = 30;
    this.bracket.addChild(this.bracketLine, whole);
    this.bracket.visible = isFrac(this.plan.mode);
    ctx.stage.addChild(this.backdrop, this.sign, this.row, this.bracket, this.flag, this.frog, this.glow);
    for (let i = 0; i < WINDOW; i++) {
      const pad = new Pad();
      pad.set(i);
      onTap(pad, () => void this.tapPad(pad.n), { cooldown: 250 });
      this.pads.push(pad);
      this.row.addChild(pad);
    }
    this.markPads();
    if (this.plan.mode === 'gap' || splitsAtTen(this.plan.mode) || this.plan.mode === 'frac-match') {
      for (const n of GAP_CARDS) {
        const node = new Container();
        node.addChild(tile(104, 110, 'white'), label(String(n), 52, ink));
        node.hitArea = new Rectangle(-56, -58, 112, 116);
        onTap(node, () => void this.tapCard(n), { cooldown: 300 });
        this.cards.push({ n, node });
        ctx.stage.addChild(node);
      }
    }
    // Last, so the ring sits over the cards as well as the pads.
    this.ring.eventMode = 'none';
    ctx.stage.addChild(this.ring);
  }

  get q() {
    return this.questions[this.index];
  }

  start() {
    void this.next();
  }

  /** The sign widens to its sum, up to 720 units. */
  private setSign(text: string) {
    this.signText.text = text;
    const w = Math.min(720, Math.max(340, this.signText.width + 64));
    this.signBoard
      .clear()
      .roundRect(-w / 2, -46, w, 92, 24)
      .fill(wood.light)
      .stroke({ width: 6, color: wood.line });
  }

  /** On the fraction line only the wholes are numbered; the other pads stay blank until the frog lands there. */
  private markPads() {
    if (!isFrac(this.plan.mode)) return;
    for (const p of this.pads) p.mark(p.n % 4 === 0 ? String(p.n / 4) : '');
  }

  /** Whether a number card, not a lily pad, answers what is asked now. */
  private cardStage() {
    const mode = this.plan.mode;
    return (
      mode === 'gap' ||
      (splitsAtTen(mode) && this.makeTenStage === 'bridge') ||
      (mode === 'frac-match' && this.matchStage === 'count')
    );
  }

  /** The spot that answers what is asked now, counted along `spots`. */
  private answerSpot() {
    return splitsAtTen(this.plan.mode) && this.makeTenStage === 'bridge'
      ? GAP_CARDS.indexOf(this.q.toTen!)
      : answerSlot(this.plan.mode, this.q, this.lo, this.matchStage === 'count');
  }

  private padX(n: number) {
    return (this.view.w - (WINDOW - 1) * STEP) / 2 + (n - this.lo) * STEP;
  }

  private padY() {
    return this.view.h * (this.plan.mode === 'gap' ? 0.56 : 0.62);
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    this.pads.forEach((p, i) => p.position.set(this.padX(this.lo + i), this.padY()));
    if (!this.frogMoving) this.frog.position.set(this.padX(this.at), this.padY() - 8);
    const x0 = this.padX(0);
    const x1 = this.padX(4);
    this.bracket.position.set((x0 + x1) / 2, this.padY() + 92);
    const half = (x1 - x0) / 2;
    this.bracketLine
      .clear()
      .moveTo(-half, -14)
      .lineTo(-half, 0)
      .lineTo(half, 0)
      .lineTo(half, -14)
      .stroke({ width: 5, color: ink });
    if (this.q?.target !== undefined) this.flag.position.set(this.padX(this.q.target), this.padY());
    this.sign.position.set(v.w / 2, 150);
    const xs = spread(this.cards.length, 190, v.w - 110, 124);
    this.cards.forEach((c, i) => c.node.position.set(xs[i], v.h - 90));
  }

  private frogMoving = false;

  update(dt: number) {
    this.clock += dt;
    const g = this.glow.clear();
    if (this.glowing && !this.busy) {
      const p = this.glowing.getGlobalPosition();
      const at = this.ctx.stage.toLocal(p);
      g.circle(at.x, at.y + (this.glowing instanceof Pad ? 6 : 0), 66 + 4 * Math.sin(this.clock * 6)).stroke({
        width: 7,
        color: swatch.yellow.fill,
      });
    }
    const ring = this.ring.clear();
    const spot = this.couchOn && !this.busy && !this.finished ? this.spots[this.focus] : undefined;
    if (spot) {
      if (spot instanceof Pad)
        ring.roundRect(spot.x - 58, spot.y - 56, 116, 118, 26).stroke({ width: 8, color: swatch.teal.line });
      else
        ring.roundRect(spot.x - 66, spot.y - 68, 132, 136, 26).stroke({ width: 8, color: swatch.teal.line });
    }
  }

  destroy() {}

  /** What the ring can rest on: the lily pads, or on number-card questions the cards. */
  private get spots(): Container[] {
    return this.cardStage() ? this.cards.map((c) => c.node) : this.pads;
  }

  /** Couch play: left and right move the ring; the bottom button chooses what it is on. */
  control(input: CouchControls) {
    this.couchOn = true;
    if (this.busy || this.finished || !this.q) return;
    const last = this.spots.length - 1;
    for (const p of input.players) {
      if (p.direction === 0) this.focus = Math.min(last, this.focus + 1);
      else if (p.direction === 2) this.focus = Math.max(0, this.focus - 1);
      if (!p.action) continue;
      if (this.cardStage()) void this.tapCard(this.cards[this.focus].n);
      else void this.tapPad(this.pads[this.focus].n);
    }
  }

  /** The "watch me" demo: move the ring to the pad (or number card) that answers the question, then press. */
  autoplay(dt: number): CouchControls {
    const out = idle();
    out.players[0].active = true;
    this.botWait -= dt;
    if (this.busy || this.finished || !this.q || this.botWait > 0) return out;
    const want = this.answerSpot();
    if (want < 0) return out;
    if (want === this.focus) {
      out.players[0].action = true;
      this.botWait = 1;
    } else {
      out.players[0].direction = want > this.focus ? 0 : 2;
      this.botWait = 0.4;
    }
    return out;
  }

  /** The ghost finger on the how-to card: tap the lily pad (or on counting levels the number card) that answers the question. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || !this.q) return null;
    const slot = this.answerSpot();
    return slot < 0 ? null : { tap: { on: this.spots[slot] } };
  }

  private async next() {
    this.busy = true;
    this.index++;
    this.wrongs = 0;
    this.helped = false;
    this.inertTaps = 0;
    this.makeTenStage = 'bridge';
    this.matchStage = 'land';
    const mode = this.plan.mode;
    this.cards.forEach((c) => (c.node.visible = mode !== 'frac-match'));
    this.flag.visible = false;
    this.glowing = null;
    if (this.index >= this.questions.length) return void this.finale();
    const q = this.q;
    if (q.lo !== this.lo) await this.slideWindow(q.lo);
    if (this.at !== q.start) await this.leap(q.start);
    if (isFrac(mode)) return this.askFrac();
    const k = Math.abs(q.hops);
    this.setSign(
      mode === 'find'
        ? String(q.target)
        : mode === 'gap'
          ? `${q.start} → ${q.target}`
          : mode === 'make-ten'
            ? `${q.start} + ${q.hops}`
            : mode === 'back-ten'
              ? `${q.start} − ${k}`
              : `${q.start} ${q.hops > 0 ? '+' : '−'} ${k}`,
    );
    // The ring starts where the frog sits (or on the first card), so choosing is a few steps along.
    this.focus =
      mode === 'gap' || splitsAtTen(mode) ? 0 : Math.max(0, Math.min(WINDOW - 1, this.at - this.lo));
    this.busy = false;
    if (mode === 'find') return this.ctx.instruct('hop.find', { n: q.target });
    if (mode === 'next') return this.ctx.instruct(q.ask === 'more' ? 'hop.more' : 'hop.less', { n: q.start });
    if (mode === 'gap') return this.ctx.instruct('hop.gap', { n: q.start, m: q.target });
    if (splitsAtTen(mode))
      return this.ctx.instruct(mode === 'make-ten' ? 'hop.ten' : 'hop.backten', { n: q.start, k });
    return this.ctx.instruct(q.hops > 0 ? 'hop.add' : 'hop.back', { n: q.start, k });
  }

  /** A fraction question: the sum of the start and the hops on the sign (the start left out at 0), then the spoken ask. */
  private askFrac() {
    const q = this.q;
    this.markPads();
    const terms = Array.from({ length: q.count! }, () => sizeName(q.jump!));
    this.setSign((q.start > 0 ? [fracName(q.start), ...terms] : terms).join(' + '));
    this.focus = Math.max(0, Math.min(WINDOW - 1, this.at - this.lo));
    this.busy = false;
    const hops = hopPhrase(q.jump!, q.count!);
    if (this.plan.mode === 'frac-match') return this.ctx.instruct('hop.frac.match', { hops });
    return this.ctx.instruct('hop.frac', { where: fracWords(q.start), hops });
  }

  /** The long line: slide the pads so the start and the answer are both in view. */
  private async slideWindow(lo: number) {
    await this.ctx.tw.to(this.row, { alpha: 0 }, { duration: 0.2 });
    this.lo = lo;
    this.pads.forEach((p, i) => p.set(lo + i));
    this.resize(this.view);
    await this.ctx.tw.to(this.row, { alpha: 1 }, { duration: 0.2 });
  }

  private async leap(to: number) {
    this.frogMoving = true;
    const y = this.padY() - 8;
    sfx.whoosh();
    void this.ctx.tw
      .to(this.frog, { y: y - 90 }, { duration: 0.22, ease: ease.outQuad })
      .then(() => this.ctx.tw.to(this.frog, { y }, { duration: 0.22, ease: ease.inQuad }));
    await this.ctx.tw.to(this.frog, { x: this.padX(to) }, { duration: 0.44 });
    await this.ctx.tw.wait(0.05);
    this.frog.y = y;
    this.at = to;
    this.frogMoving = false;
    sfx.splash();
  }

  /** Pad by pad, counting each hop aloud. */
  private async hopCount(to: number) {
    const dir = Math.sign(to - this.at);
    const y = this.padY() - 8;
    this.frogMoving = true;
    for (let k = 1; this.at !== to; k++) {
      const next = this.at + dir;
      void this.ctx.say('count', { n: k });
      sfx.pop(5 + k);
      void this.ctx.tw
        .to(this.frog, { y: y - 50 }, { duration: 0.16, ease: ease.outQuad })
        .then(() => this.ctx.tw.to(this.frog, { y }, { duration: 0.16, ease: ease.inQuad }));
      await this.ctx.tw.to(this.frog, { x: this.padX(next) }, { duration: 0.32 });
      this.frog.y = y;
      this.at = next;
      await this.ctx.tw.wait(0.35);
    }
    this.frogMoving = false;
  }

  /** Fraction hops: each as long as its size, saying the landing names, or on the card stage counting the hops. */
  private async hopBy(jump: number, count: number, speak: 'names' | 'counts') {
    const y = this.padY() - 8;
    this.frogMoving = true;
    for (let k = 1; k <= count; k++) {
      const next = this.at + jump;
      if (speak === 'names') void this.ctx.say('hop.frac.land', { name: hopWords(next, jump) });
      else void this.ctx.say('count', { n: k });
      sfx.pop(5 + k);
      const time = 0.26 + 0.06 * jump;
      void this.ctx.tw
        .to(this.frog, { y: y - 40 - 16 * jump }, { duration: time / 2, ease: ease.outQuad })
        .then(() => this.ctx.tw.to(this.frog, { y }, { duration: time / 2, ease: ease.inQuad }));
      await this.ctx.tw.to(this.frog, { x: this.padX(next) }, { duration: time });
      this.frog.y = y;
      this.at = next;
      await this.ctx.tw.wait(0.45);
    }
    this.frogMoving = false;
  }

  private async tapPad(n: number) {
    if (this.busy || this.finished) return;
    if (this.cardStage()) {
      this.inertTaps++;
      sfx.squeak();
      if (this.inertTaps === 2) {
        void this.ctx.say('hop.cards');
        for (const { node } of this.cards) {
          void this.ctx.tw
            .to(node.scale, { x: 1.08, y: 1.08 }, { duration: 0.15 })
            .then(() => this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.15 }));
        }
      }
      return;
    }
    if (n === this.q.target) return void (this.plan.mode === 'frac-match' ? this.landFlag() : this.right());
    this.miss(n);
  }

  private async tapCard(n: number) {
    if (this.busy || this.finished) return;
    if (this.plan.mode === 'gap' && n === answerOf('gap', this.q)) return void this.right();
    if (splitsAtTen(this.plan.mode) && this.makeTenStage === 'bridge' && n === this.q.toTen)
      return void this.bridgeTen();
    if (this.plan.mode === 'frac-match' && n === this.q.answer2) return void this.right();
    this.miss(n);
  }

  private async bridgeTen() {
    this.busy = true;
    this.glowing = null;
    await this.hopCount(10);
    this.makeTenStage = 'rest';
    this.cards.forEach((c) => (c.node.visible = false));
    this.wrongs = 0;
    this.focus = Math.max(0, Math.min(WINDOW - 1, this.at - this.lo));
    const back = this.plan.mode === 'back-ten';
    this.setSign(
      `${this.q.start} ${back ? '−' : '+'} ${this.q.toTen} ${back ? '−' : '+'} ${this.q.remaining}`,
    );
    this.busy = false;
    await this.ctx.instruct(back ? 'hop.restback' : 'hop.rest', {
      a: this.q.toTen!,
      k: Math.abs(this.q.hops),
      n: this.q.remaining!,
    });
  }

  /** Fraction Match, first stage right: hop there, plant the flag, go back to zero and ask for the other hop size. */
  private async landFlag() {
    this.busy = true;
    this.glowing = null;
    const q = this.q;
    if (this.at !== q.start) await this.leap(q.start);
    await this.hopBy(q.jump!, q.count!, 'names');
    this.pads[q.target - this.lo].mark(fracName(q.target));
    this.flag.position.set(this.padX(q.target), this.padY());
    this.flag.visible = true;
    sfx.pop(9);
    await this.ctx.tw.wait(0.4);
    await this.leap(q.start);
    this.matchStage = 'count';
    this.wrongs = 0;
    this.inertTaps = 0;
    this.cards.forEach((c) => (c.node.visible = true));
    this.focus = 0;
    this.setSign(`? hops of ${sizeName(q.jump2!)}`);
    this.busy = false;
    await this.ctx.instruct('hop.frac.second', { size: sizeWord(q.jump2!) });
  }

  private async right() {
    this.busy = true;
    this.glowing = null;
    const q = this.q;
    const mode = this.plan.mode;
    if (mode === 'frac-hop') {
      if (this.at !== q.start) await this.leap(q.start);
      await this.hopBy(q.jump!, q.count!, 'names');
      this.pads[q.target - this.lo].mark(fracName(q.target));
    } else if (mode === 'frac-match') {
      this.cards.forEach((c) => (c.node.visible = false));
      if (this.at !== q.start) await this.leap(q.start);
      await this.hopBy(q.jump2!, q.answer2!, 'counts');
    } else if (mode === 'find' || mode === 'next') await this.leap(q.target);
    else {
      const hopStart = splitsAtTen(this.plan.mode) ? 10 : q.start;
      if (this.at !== hopStart) await this.leap(hopStart);
      await this.hopCount(q.target);
    }
    sfx.sparkle();
    this.ctx.particles.burst(this.frog.x, this.frog.y - 40, {
      kind: 'star',
      colors: [0xffffff, swatch.green.light, 0xfff3a0],
      count: 14,
      speed: [100, 260],
      gravity: 0,
      life: [0.5, 0.9],
    });
    this.ctx.pet.cheer();
    const quarters = quarterName(q.target);
    if (mode === 'frac-match') {
      const first = hopsWords(q.jump!, q.count!);
      await this.ctx.say('hop.frac.same', {
        first: first[0].toUpperCase() + first.slice(1),
        second: hopsWords(q.jump2!, q.answer2!),
        name: fracWords(q.target),
      });
    } else if (mode === 'frac-hop' && quarters && q.jump === 1)
      await this.ctx.say('hop.frac.also', {
        quarters: quarters[0].toUpperCase() + quarters.slice(1),
        name: fracWords(q.target),
      });
    else await this.ctx.say('hop.yay');
    await this.next();
  }

  private async miss(n: number) {
    this.busy = true;
    this.misses++;
    this.wrongs++;
    sfx.boing();
    const q = this.q;
    const mode = this.plan.mode;
    if (mode === 'find') {
      this.frog.scale.x = q.target > n ? 1 : -1;
      await this.ctx.say(q.target > n ? 'hop.wrong.find-forward' : 'hop.wrong.find-backward', {
        m: n,
        n: q.target,
      });
    } else if (mode === 'next') await this.ctx.say(q.ask === 'more' ? 'hop.wrong.more' : 'hop.wrong.less');
    else if (isFrac(mode)) await this.sayFracMiss(n);
    else {
      const card = this.cardStage();
      const start = splitsAtTen(mode) && this.makeTenStage === 'rest' ? 10 : q.start;
      const answer = card ? (mode === 'gap' ? answerOf(mode, q) : q.toTen!) : q.target;
      const kind = missKind(start, answer, n, card);
      if (kind === 'forward' || kind === 'backward')
        await this.ctx.say(kind === 'forward' ? 'hop.wrong.forward' : 'hop.wrong.backward');
      else if (kind === 'one-more' || kind === 'one-less')
        await this.ctx.say(kind === 'one-more' ? 'hop.wrong.one-more' : 'hop.wrong.one-less');
      else await this.ctx.say('hop.wrong.count', { n: start });
    }
    if (this.wrongs >= 2 && !this.glowing) {
      this.hints += hintCharge(this.wrongs, !!this.glowing, this.helped);
      this.helped = true;
      // Show it: count the hops along the line, then hop back and let her try.
      if (isFrac(mode)) {
        const count = this.cardStage();
        if (count) await this.hopBy(q.jump2!, q.answer2!, 'counts');
        else await this.hopBy(q.jump!, q.count!, 'names');
        await this.ctx.tw.wait(0.3);
        await this.leap(q.start);
      } else if (mode !== 'find' && mode !== 'next') {
        const shown = splitsAtTen(mode) && this.makeTenStage === 'bridge' ? 10 : q.target;
        await this.hopCount(shown);
        await this.ctx.tw.wait(0.3);
        await this.leap(splitsAtTen(mode) && this.makeTenStage === 'rest' ? 10 : q.start);
      }
      this.glowing = this.cardStage()
        ? this.cards.find((c) => c.n === (splitsAtTen(mode) ? q.toTen : answerOf(mode, q)))!.node
        : this.pads[q.target - this.lo];
    }
    this.busy = false;
  }

  /** Name the slip on a fraction question: a wrong pad by `fracMiss`, a wrong card at Fraction Match by `matchMiss`. */
  private async sayFracMiss(n: number) {
    const q = this.q;
    const size = sizeWord(q.jump!);
    if (this.cardStage()) {
      const kind = matchMiss(q, n);
      if (kind === 'same') {
        const small = sizeWord(Math.min(q.jump!, q.jump2!));
        const big = sizeWord(Math.max(q.jump!, q.jump2!));
        return this.ctx.say(q.jump2! < q.jump! ? 'hop.frac.same-smaller' : 'hop.frac.same-bigger', {
          small,
          big,
        });
      }
      if (kind === 'one-more' || kind === 'one-less')
        return this.ctx.say(kind === 'one-more' ? 'hop.wrong.one-more' : 'hop.wrong.one-less');
      return this.ctx.say('hop.frac.flag', { size: sizeWord(q.jump2!) });
    }
    const kind = fracMiss(q.start, q.jump!, q.count!, n);
    if (kind === 'backward') return this.ctx.say('hop.wrong.forward');
    if (kind === 'size')
      return q.jump === 1
        ? this.ctx.say('hop.frac.size-short')
        : this.ctx.say('hop.frac.size-long', { size });
    if (kind === 'whole') return this.ctx.say('hop.frac.whole', { size });
    if (kind === 'one-more' || kind === 'one-less') return this.ctx.say('hop.frac.ticks');
    return this.ctx.say('hop.frac.count', { size, where: fracWords(q.start) });
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    sfx.tada();
    await this.ctx.say('hop.done');
    await this.ctx.tw.wait(0.5);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

class HopIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    for (let i = 0; i < 3; i++) {
      const p = new Pad();
      p.set(i + 1);
      p.position.set(-90 + i * 90, -40);
      p.scale.set(0.8);
      c.addChild(p);
    }
    const f = frogArt();
    f.position.set(0, -48);
    c.addChild(f);
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const p = new Pad();
  p.set(stickerNumber(rng));
  p.scale.set(1.4);
  p.y = 40;
  const f = frogArt();
  f.scale.set(1.5);
  f.y = 30;
  c.addChild(p, f);
  return c;
}

export const frogHop: GameModule = {
  id: 'frog-hop',
  liveController: true,
  name: 'Frog Hop',
  titleLine: 'game.frog-hop',
  region: 'counting-cove',
  challenge: 'numbers',
  skills: ['number-line', 'adding', 'taking-away', 'counting-on', 'fractions'],
  bands: ['preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => PLANS[level - 1]?.name,
  music: STYLES.bubbles,
  coplayHint: 'Count the hops out loud together, tapping the table for each one.',
  offScreen: 'Make a number line with chalk or tape on the floor and hop along it: "Start at 2, hop 3 more!"',
  hubIcon: () => new HopIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new FrogHop(ctx),
};
