import { Container, Graphics, Rectangle, type Text } from 'pixi.js';
import { frogArt } from '../../art/animals';
import { grass, ink, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { idle, type CouchControls } from '../../engine/controller';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
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
  countsHops,
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
  saysNumbers,
  showsDots,
  dotLayout,
  DOT_GAP,
  DOT_R,
  flowerOn,
  TEN,
  padValue,
  hopLayout,
  sceneFor,
  PAD_HIT,
  CARD_HIT,
  type HopScene,
  type HopLayout,
} from './logic';
import { GUIDE_CORNER } from '../../creatures/home-layout';
/** The first row of dots under a pad's numeral, clear of the numeral (y 44) and inside the pad's step. */
const DOTS_Y = 82;

/** Dots for a numeral, fives grouped (`dotLayout`), centred on (x, y). */
function drawDots(g: Graphics, n: number, x: number, y: number) {
  for (const d of dotLayout(n)) g.circle(x + d.x, y + d.y, DOT_R).fill(swatch.blue.fill);
}

/** A small code-drawn bloom at the front edge of a landmark pad: five petals round a yellow middle. */
function drawFlower(g: Graphics, x: number, y: number) {
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    g.circle(x + Math.cos(a) * 9, y + Math.sin(a) * 9, 8)
      .fill(swatch.pink.fill)
      .stroke({ width: 2, color: swatch.pink.line });
  }
  g.circle(x, y, 6).fill(swatch.yellow.fill);
}

/** What the frog lands on in each scene, inside the lily pad's 96 × 56 oval. */
function drawPad(g: Graphics, scene: HopScene) {
  if (scene === 'brook') {
    // A flat stepping stone with a lighter top and the brook lapping at its front.
    g.ellipse(0, 0, 48, 28)
      .fill(swatch.brown.light)
      .stroke({ width: 5, color: swatch.brown.line })
      .ellipse(-6, -6, 30, 14)
      .fill(swatch.white.light)
      .moveTo(-40, 22)
      .quadraticCurveTo(-20, 30, 0, 24)
      .quadraticCurveTo(20, 18, 40, 24)
      .stroke({ width: 3, color: swatch.teal.line });
  } else if (scene === 'flowers') {
    // A white daisy, unlike the small pink landmark bloom on 5, 10, 15 and 20.
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      g.ellipse(Math.cos(a) * 30, Math.sin(a) * 15, 16, 11)
        .fill(swatch.white.fill)
        .stroke({ width: 3, color: swatch.white.line });
    }
    g.ellipse(0, 0, 18, 11).fill(swatch.orange.fill).stroke({ width: 3, color: swatch.orange.line });
  } else {
    g.ellipse(0, 0, 48, 28)
      .fill(swatch.green.light)
      .stroke({ width: 5, color: swatch.green.line })
      .moveTo(0, 0)
      .lineTo(30, -16)
      .stroke({ width: 4, color: swatch.green.line });
  }
}

/** Each scene's sky and ground. The ground stays light in every scene, so the ink numerals and dots read on it. */
const SKIES: Record<HopScene, ConstructorParameters<typeof Backdrop>[0]> = {
  pond: {
    sky: [0x8fd3f7, 0xe9f7ff],
    hills: [0x7fd0e8, 0x5bb8d8, 0x4aa8c9],
    horizon: 0.42,
    clouds: 2,
    sun: true,
    seed: 61,
  },
  brook: {
    sky: [0x8fd3f7, 0xe9f7ff],
    hills: [swatch.green.light, swatch.green.fill, swatch.teal.light],
    horizon: 0.42,
    clouds: 2,
    sun: true,
    seed: 62,
  },
  flowers: {
    sky: [0x8fd3f7, 0xe9f7ff],
    hills: [swatch.teal.light, swatch.green.fill, grass],
    horizon: 0.42,
    clouds: 3,
    sun: true,
    seed: 63,
  },
  evening: {
    sky: [swatch.purple.line, swatch.orange.light],
    hills: [swatch.purple.fill, swatch.blue.line, swatch.purple.light],
    horizon: 0.42,
    seed: 64,
  },
};

/** The evening's fireflies: a place in the sky as a fraction of the view, and a phase for their slow drift and glow. */
const FIREFLIES = Array.from({ length: 8 }, (_, i) => ({
  fx: 0.06 + i * 0.125,
  fy: (i * 37) % 10,
  phase: i * 1.7,
}));

class Pad extends Container {
  readonly num: Text;
  n = 0;
  constructor(scene: HopScene = 'pond') {
    super();
    const art = new Graphics();
    drawPad(art, scene);
    this.addChild(art);
    this.num = label('0', 34, ink);
    this.num.y = 44;
    this.addChild(this.num);
    this.hitArea = new Rectangle(-PAD_HIT.w / 2, -PAD_HIT.h / 2, PAD_HIT.w, PAD_HIT.h);
  }
  /** `n` is the pad's place on the line; `shown` is what it reads (on the tens line, ten times its place). */
  set(n: number, shown = n) {
    this.n = n;
    this.num.text = String(shown);
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
  /** The next question's spoken ask, waiting behind the last right answer's line (U7 R4), or said at her first tap. */
  private unasked: (() => unknown) | null = null;

  private readonly backdrop: Backdrop;
  /** The round's scene (slice 6): only the art differs, never a pad's place, numeral or hit area. */
  readonly scene: HopScene;
  /** The scene's own touches behind the line: ripples in the brook, grass on the path, the evening moon. */
  private readonly sceneArt = new Graphics();
  private readonly fireflies = new Graphics();
  private readonly row = new Container();
  /** Dots under the numerals and landmark flowers: the scene's own layer, so the sticker and icon pads never change. */
  private readonly marks = new Graphics();
  /** One dot over the frog for each hop on the levels that say the numbers. */
  private readonly tally = new Graphics();
  private tallied = 0;
  private readonly signDots = new Graphics();
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
  /** Make-ten asks for the bridge to ten before its final landing; on Over ten, your way, 'rest' means she stopped at 10. */
  private makeTenStage: 'bridge' | 'rest' = 'bridge';
  private readonly ring = new Graphics();
  private botWait = 1.5;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.layout = hopLayout(ctx.view, this.plan.mode, GUIDE_CORNER.w);
    this.questions = makeQuestions(this.plan, ctx.rng);
    this.scene = sceneFor(ctx.rng);
    this.backdrop = new Backdrop(SKIES[this.scene], ctx.view);
    this.sceneArt.eventMode = 'none';
    this.fireflies.eventMode = 'none';
    this.signText = label('', 46, ink);
    this.sign.addChild(this.signBoard, this.signText, this.signDots);
    this.marks.eventMode = 'none';
    this.tally.eventMode = 'none';
    this.signDots.eventMode = 'none';
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
    ctx.stage.addChild(
      this.backdrop,
      this.sceneArt,
      this.fireflies,
      this.sign,
      this.row,
      this.bracket,
      this.flag,
      this.frog,
      this.tally,
      this.glow,
    );
    for (let i = 0; i < WINDOW; i++) {
      const pad = new Pad(this.scene);
      pad.set(i, padValue(this.plan, i));
      onTap(pad, () => void this.tapPad(pad.n), { cooldown: 250 });
      this.pads.push(pad);
      this.row.addChild(pad);
    }
    // Last in the row, so the marks fade with the pads when the long line slides.
    this.row.addChild(this.marks);
    this.markPads();
    if (countsHops(this.plan.mode) || splitsAtTen(this.plan.mode) || this.plan.mode === 'frac-match') {
      for (const n of GAP_CARDS) {
        const node = new Container();
        node.addChild(tile(104, 110, 'white'), label(String(n), 52, ink));
        node.hitArea = new Rectangle(-CARD_HIT.w / 2, -CARD_HIT.h / 2, CARD_HIT.w, CARD_HIT.h);
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

  /** The sign widens to its sum, up to 720 units; on level 1 the number's dots sit beside it. */
  private setSign(text: string, dots = 0) {
    this.signText.text = text;
    const dotsW = dots === 0 ? 0 : (Math.min(5, dots) - 1) * DOT_GAP + 2 * DOT_R;
    const gap = dots === 0 ? 0 : 28;
    const w = Math.min(720, Math.max(340, this.signText.width + gap + dotsW + 64));
    this.signText.x = -(gap + dotsW) / 2;
    this.signDots.clear();
    if (dots > 0) {
      const x = this.signText.x + this.signText.width / 2 + gap + dotsW / 2;
      drawDots(this.signDots, dots, x, dots > 5 ? -DOT_GAP / 2 : 0);
    }
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
      countsHops(mode) ||
      (splitsAtTen(mode) && this.makeTenStage === 'bridge') ||
      (mode === 'frac-match' && this.matchStage === 'count')
    );
  }

  /** The spot that answers what is asked now, counted along `spots`. */
  private answerSpot() {
    // Over ten, your way: the ghost finger shows the strategy, a stop at 10 and then the landing.
    if (this.plan.mode === 'your-way' && this.makeTenStage === 'bridge') return TEN - this.lo;
    return splitsAtTen(this.plan.mode) && this.makeTenStage === 'bridge'
      ? GAP_CARDS.indexOf(this.q.toTen!)
      : answerSlot(this.plan.mode, this.q, this.lo, this.matchStage === 'count');
  }

  /** Redraws the dots and flowers for the pads in view. */
  private drawMarks() {
    const g = this.marks.clear();
    const mode = this.plan.mode;
    for (const p of this.pads) {
      if (showsDots(mode)) drawDots(g, p.n, p.x, p.y + DOTS_Y);
      if (flowerOn(mode, p.n)) drawFlower(g, p.x - 40, p.y + 14);
    }
  }

  /** Clears the hop tally over the frog. */
  private clearTally() {
    this.tallied = 0;
    this.tally.clear();
  }

  private layout: HopLayout;

  private padX(n: number) {
    const [a, b] = this.layout.pads;
    return a.x + (n - this.lo) * (b.x - a.x);
  }

  private padY() {
    return this.layout.pads[0].y;
  }

  /** The scene's still touches, laid out for the view: ripples in the brook, tufts on the flower path, the evening moon. */
  private drawScene(v: View) {
    const g = this.sceneArt.clear();
    const y = this.padY();
    if (this.scene === 'brook')
      for (let i = 0; i < 6; i++) {
        const x = ((i + 0.5) / 6) * v.w;
        const yy = y + (i % 2 ? 140 : -96);
        g.moveTo(x - 36, yy)
          .quadraticCurveTo(x - 18, yy - 8, x, yy)
          .quadraticCurveTo(x + 18, yy + 8, x + 36, yy)
          .stroke({ width: 4, color: swatch.teal.fill });
      }
    else if (this.scene === 'flowers')
      for (let i = 0; i < 10; i++) {
        const x = ((i + 0.5) / 10) * v.w;
        const yy = y + (i % 2 ? 150 : -100);
        g.moveTo(x - 10, yy)
          .lineTo(x - 14, yy - 16)
          .moveTo(x, yy)
          .lineTo(x, yy - 20)
          .moveTo(x + 10, yy)
          .lineTo(x + 14, yy - 16)
          .stroke({ width: 4, color: swatch.green.line });
      }
    else if (this.scene === 'evening') {
      // Out of the sign's band, above the line.
      const mx = v.w - 90;
      // Above the line in a short view as well.
      const my = Math.min(262, y - 130);
      g.circle(mx, my, 36).fill(swatch.yellow.light).stroke({ width: 4, color: swatch.yellow.line });
      g.circle(mx - 10, my - 8, 6)
        .fill(swatch.yellow.fill)
        .circle(mx + 12, my + 10, 4)
        .fill(swatch.yellow.fill);
    }
  }

  resize(v: View) {
    this.view = v;
    this.layout = hopLayout(v, this.plan.mode, GUIDE_CORNER.w);
    this.backdrop.resize(v);
    this.drawScene(v);
    this.pads.forEach((p, i) => p.position.set(this.padX(this.lo + i), this.padY()));
    this.drawMarks();
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
    this.sign.position.set(v.w / 2, this.layout.sign.y + this.layout.sign.h / 2);
    this.cards.forEach((c, i) => c.node.position.set(this.layout.cards[i].x, this.layout.cards[i].y));
  }

  private frogMoving = false;

  update(dt: number) {
    this.clock += dt;
    if (this.scene === 'evening') {
      // Fireflies drift and glow in the sky between the sign and the line.
      const f = this.fireflies.clear();
      // Between the sign and the line; a view too short for that band shows none.
      const top = this.layout.sign.y + this.layout.sign.h + 24,
        bottom = this.padY() - 110;
      for (const fly of bottom - top < 40 ? [] : FIREFLIES) {
        const t = this.clock * 0.6 + fly.phase;
        const x = fly.fx * this.view.w + 24 * Math.sin(t);
        const y = top + ((bottom - top) * fly.fy) / 10 + 12 * Math.sin(t * 1.3);
        const glow = 0.5 + 0.5 * Math.sin(t * 2);
        f.circle(x, y, 12).fill({ color: swatch.yellow.light, alpha: 0.35 * glow });
        f.circle(x, y, 5).fill({ color: swatch.yellow.fill, alpha: 0.6 + 0.4 * glow });
      }
    }
    this.tally.position.set(this.frog.x, this.frog.y - 112);
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

  /**
   * On to the next question. A right answer's line never holds it (U7 R4): the frog's leap and the next question's sign
   * follow at once with input open, and the spoken ask waits for the line, or is said at her first tap.
   */
  private async next(line?: Promise<unknown>) {
    this.busy = true;
    this.unasked = null;
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
    this.clearTally();
    if (this.index >= this.questions.length) return void this.finale();
    const q = this.q;
    if (q.lo !== this.lo) await this.slideWindow(q.lo);
    if (this.at !== q.start) await this.leap(q.start);
    if (mode === 'count-up') {
      // The flag marks the bigger number; the frog stands on the one taken away.
      this.flag.position.set(this.padX(q.target), this.padY());
      this.flag.visible = true;
    }
    if (isFrac(mode)) return this.askFrac(line);
    if (mode === 'tens') return this.askTens(line);
    const k = Math.abs(q.hops);
    this.setSign(
      mode === 'find'
        ? String(q.target)
        : mode === 'gap'
          ? `${q.start} → ${q.target}`
          : mode === 'count-up'
            ? `${q.target} − ${q.start}`
            : mode === 'make-ten'
              ? `${q.start} + ${q.hops}`
              : mode === 'back-ten'
                ? `${q.start} − ${k}`
                : `${q.start} ${q.hops > 0 ? '+' : '−'} ${k}`,
      mode === 'find' ? q.target : 0,
    );
    // The ring starts where the frog sits (or on the first card), so choosing is a few steps along.
    this.focus =
      countsHops(mode) || splitsAtTen(mode) ? 0 : Math.max(0, Math.min(WINDOW - 1, this.at - this.lo));
    this.busy = false;
    this.ask(() => {
      if (mode === 'find') return this.ctx.instruct('hop.find', { n: q.target });
      if (mode === 'next')
        return this.ctx.instruct(q.ask === 'more' ? 'hop.more' : 'hop.less', { n: q.start });
      if (mode === 'gap') return this.ctx.instruct('hop.gap', { n: q.start, m: q.target });
      if (mode === 'count-up') return this.ctx.instruct('hop.countup', { n: q.start, m: q.target });
      if (mode === 'your-way')
        return this.ctx.instruct(q.hops > 0 ? 'hop.yourway' : 'hop.yourway.back', { n: q.start, k });
      if (splitsAtTen(mode))
        return this.ctx.instruct(mode === 'make-ten' ? 'hop.ten' : 'hop.backten', { n: q.start, k });
      return this.ctx.instruct(q.hops > 0 ? 'hop.add' : 'hop.back', { n: q.start, k });
    }, line);
  }

  /** Says the question's ask now, or when the last right answer's line ends if one is still playing. */
  private ask(say: () => unknown, line?: Promise<unknown>) {
    if (!line) return void say();
    this.unasked = say;
    const at = this.index;
    void line.then(() => {
      if (this.index === at) this.askNow();
    });
  }

  /** Says the question's ask if it is still waiting behind the last right answer's line. */
  private askNow() {
    const say = this.unasked;
    if (!say || this.finished) return false;
    this.unasked = null;
    void say();
    return true;
  }

  /** The guide was tapped while the ask waits: say this question's ask, not the last one's. */
  sayWaitingAsk() {
    return this.askNow();
  }

  /** Hop by tens: `30 + 20` on the sign, said as "hop two tens" (or "one ten"). */
  private askTens(line?: Promise<unknown>) {
    const q = this.q;
    const k = Math.abs(q.hops);
    const start = padValue(this.plan, q.start);
    this.setSign(`${start} ${q.hops > 0 ? '+' : '−'} ${padValue(this.plan, k)}`);
    this.focus = Math.max(0, Math.min(WINDOW - 1, this.at - this.lo));
    this.busy = false;
    const id =
      k === 1
        ? q.hops > 0
          ? 'hop.tens.one'
          : 'hop.tens.oneback'
        : q.hops > 0
          ? 'hop.tens'
          : 'hop.tens.back';
    this.ask(() => this.ctx.instruct(id, { n: start, k }), line);
  }

  /** A fraction question: the sum of the start and the hops on the sign (the start left out at 0), then the spoken ask. */
  private askFrac(line?: Promise<unknown>) {
    const q = this.q;
    this.markPads();
    const terms = Array.from({ length: q.count! }, () => sizeName(q.jump!));
    this.setSign((q.start > 0 ? [fracName(q.start), ...terms] : terms).join(' + '));
    this.focus = Math.max(0, Math.min(WINDOW - 1, this.at - this.lo));
    this.busy = false;
    const hops = hopPhrase(q.jump!, q.count!);
    this.ask(
      () =>
        this.plan.mode === 'frac-match'
          ? this.ctx.instruct('hop.frac.match', { hops })
          : this.ctx.instruct('hop.frac', { where: fracWords(q.start), hops }),
      line,
    );
  }

  /** The long line: slide the pads so the start and the answer are both in view. */
  private async slideWindow(lo: number) {
    await this.ctx.tw.to(this.row, { alpha: 0 }, { duration: 0.2 });
    this.lo = lo;
    this.pads.forEach((p, i) => p.set(lo + i, padValue(this.plan, lo + i)));
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

  /**
   * Pad by pad, counting each hop aloud, or with `numerals` saying the pad it lands on and adding a tally dot over the
   * frog, so the hop count and the numerals are both there (`landingNumbers` is the rule).
   */
  private async hopCount(to: number, numerals = false) {
    const dir = Math.sign(to - this.at);
    const y = this.padY() - 8;
    this.frogMoving = true;
    for (let k = 1; this.at !== to; k++) {
      const next = this.at + dir;
      void this.ctx.say('count', { n: numerals ? padValue(this.plan, next) : k });
      if (numerals) this.addTally();
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

  /** One more tally dot over the frog, in a centred row. */
  private addTally() {
    this.tallied++;
    const g = this.tally.clear();
    for (let i = 0; i < this.tallied; i++)
      g.circle((i - (this.tallied - 1) / 2) * 22, 0, 8)
        .fill(swatch.yellow.fill)
        .stroke({ width: 3, color: swatch.yellow.line });
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
    this.askNow();
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
    if (this.plan.mode === 'your-way' && n === TEN) {
      // The stop at 10 is never wrong: the first time the frog hops there, and once it sits there a tap is just a squeak.
      if (this.makeTenStage === 'bridge') return void this.stopAtTen();
      return void sfx.squeak();
    }
    if (n === this.q.target) return void (this.plan.mode === 'frac-match' ? this.landFlag() : this.right());
    this.miss(n);
  }

  /** Over ten, your way: she chose to stop at 10. The frog counts the hops there and the sign shows the split so far. */
  private async stopAtTen() {
    this.busy = true;
    const q = this.q;
    await this.hopCount(TEN);
    this.makeTenStage = 'rest';
    this.focus = Math.max(0, Math.min(WINDOW - 1, this.at - this.lo));
    const op = q.hops > 0 ? '+' : '−';
    this.setSign(`${q.start} ${op} ${q.toTen} ${op} ?`);
    this.busy = false;
    await this.ctx.instruct(q.hops > 0 ? 'hop.yourway.stop' : 'hop.yourway.stopback', {
      a: q.toTen!,
      k: Math.abs(q.hops),
    });
  }

  private async tapCard(n: number) {
    if (this.busy || this.finished) return;
    this.askNow();
    if (countsHops(this.plan.mode) && n === answerOf(this.plan.mode, this.q)) return void this.right();
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
      const hopStart =
        splitsAtTen(mode) || (mode === 'your-way' && this.makeTenStage === 'rest') ? TEN : q.start;
      if (this.at !== hopStart) await this.leap(hopStart);
      await this.hopCount(q.target, saysNumbers(mode));
    }
    sfx.croak();
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
    let line: Promise<unknown>;
    if (mode === 'frac-match') {
      const first = hopsWords(q.jump!, q.count!);
      line = this.ctx.say('hop.frac.same', {
        first: first[0].toUpperCase() + first.slice(1),
        second: hopsWords(q.jump2!, q.answer2!),
        name: fracWords(q.target),
      });
    } else if (mode === 'frac-hop' && quarters && q.jump === 1)
      line = this.ctx.say('hop.frac.also', {
        quarters: quarters[0].toUpperCase() + quarters.slice(1),
        name: fracWords(q.target),
      });
    else if (saysNumbers(mode)) line = this.ctx.say('hop.landed', { n: padValue(this.plan, q.target) });
    else if (mode === 'count-up')
      line = this.ctx.say('hop.countup.yay', { m: q.target, n: q.start, k: q.hops });
    else if (mode === 'your-way')
      line = this.ctx.say(q.hops > 0 ? 'hop.yourway.yay' : 'hop.yourway.yayback', {
        n: q.start,
        k: Math.abs(q.hops),
        m: q.target,
      });
    else line = this.ctx.say('hop.yay');
    // The last question's line is heard out, because the closing line would cut it.
    if (this.index + 1 >= this.questions.length) await line;
    await this.next(line);
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
      const stopped = (splitsAtTen(mode) || mode === 'your-way') && this.makeTenStage === 'rest';
      const start = stopped ? TEN : q.start;
      const answer = card ? (countsHops(mode) ? answerOf(mode, q) : q.toTen!) : q.target;
      const kind = missKind(start, answer, n, card);
      if (kind === 'forward' || kind === 'backward')
        await this.ctx.say(kind === 'forward' ? 'hop.wrong.forward' : 'hop.wrong.backward');
      else if (kind === 'one-more' || kind === 'one-less')
        await this.ctx.say(kind === 'one-more' ? 'hop.wrong.one-more' : 'hop.wrong.one-less');
      else await this.ctx.say('hop.wrong.count', { n: padValue(this.plan, start) });
      // She stopped at 10 of her own choice: the remainder is still named.
      if (mode === 'your-way' && stopped) await this.ctx.say('hop.yourway.more', { n: q.remaining! });
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
      } else if (mode === 'your-way') {
        // The demonstration stops at 10 and names the split, then hops the rest and goes back to where she was.
        const from = this.at;
        if (from !== TEN) await this.hopCount(TEN);
        await this.ctx.say('hop.yourway.split', { a: q.toTen!, n: q.remaining! });
        await this.hopCount(q.target);
        await this.ctx.tw.wait(0.3);
        await this.leap(from);
      } else if (mode !== 'find' && mode !== 'next') {
        const shown = splitsAtTen(mode) && this.makeTenStage === 'bridge' ? 10 : q.target;
        await this.hopCount(shown, saysNumbers(mode));
        await this.ctx.tw.wait(0.3);
        await this.leap(splitsAtTen(mode) && this.makeTenStage === 'rest' ? 10 : q.start);
        this.clearTally();
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
