import { Container, Graphics, Rectangle, type Text } from 'pixi.js';
import { ink, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { idle, type CouchControls } from '../../engine/controller';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import { spread, type View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { answerOf, answerSlot, GAP_CARDS, makeQuestions, planFor, WINDOW, type HopPlan, type HopQuestion } from './logic';

const LEVELS: BandLevels = {
  preschool: { min: 1, max: 2 },
  prek: { min: 1, max: 4 },
  school: { min: 3, max: 6 },
};

const STEP = 104;

function frogArt(): Container {
  const c = new Container();
  const g = new Graphics();
  g.ellipse(-26, 4, 16, 9).ellipse(26, 4, 16, 9).fill(swatch.green.line);
  g.ellipse(0, -22, 38, 28).fill(swatch.green.fill).stroke({ width: 5, color: swatch.green.line });
  g.circle(-18, -50, 13).circle(18, -50, 13).fill(swatch.green.fill).stroke({ width: 4, color: swatch.green.line });
  g.circle(-18, -50, 7).circle(18, -50, 7).fill(0xffffff).circle(-17, -49, 4).circle(19, -49, 4).fill(ink);
  g.moveTo(-14, -18).quadraticCurveTo(0, -8, 14, -18).stroke({ width: 4, color: swatch.green.line, cap: 'round' });
  g.circle(-24, -26, 5).circle(24, -26, 5).fill({ color: swatch.pink.fill, alpha: 0.6 });
  c.addChild(g);
  return c;
}

class Pad extends Container {
  readonly num: Text;
  n = 0;
  constructor() {
    super();
    this.addChild(new Graphics().ellipse(0, 0, 48, 28).fill(swatch.green.light).stroke({ width: 5, color: swatch.green.line }).moveTo(0, 0).lineTo(30, -16).stroke({ width: 4, color: swatch.green.line }));
    this.num = label('0', 34, ink);
    this.num.y = 44;
    this.addChild(this.num);
    this.hitArea = new Rectangle(-STEP / 2, -70, STEP, 140);
  }
  set(n: number) {
    this.n = n;
    this.num.text = String(n);
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
  private readonly signText: Text;
  private readonly glow = new Graphics();
  private view: View;
  private wrongs = 0;
  private glowing: Container | null = null;
  private clock = 0;
  // Couch play: a ring over the lily pads (or the number cards on counting levels).
  private focus = 0;
  private couchOn = false;
  private readonly ring = new Graphics();
  private botWait = 1.5;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.questions = makeQuestions(this.plan, ctx.rng);
    this.backdrop = new Backdrop({ sky: [0x8fd3f7, 0xe9f7ff], hills: [0x7fd0e8, 0x5bb8d8, 0x4aa8c9], horizon: 0.42, clouds: 2, sun: true, seed: 61 }, ctx.view);
    this.sign.addChild(new Graphics().roundRect(-170, -46, 340, 92, 24).fill(wood.light).stroke({ width: 6, color: wood.line }));
    this.signText = label('', 46, ink);
    this.sign.addChild(this.signText);
    this.glow.eventMode = 'none';
    this.frog.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.sign, this.row, this.frog, this.glow);
    for (let i = 0; i < WINDOW; i++) {
      const pad = new Pad();
      pad.set(i);
      onTap(pad, () => void this.tapPad(pad.n), { cooldown: 250 });
      this.pads.push(pad);
      this.row.addChild(pad);
    }
    if (this.plan.mode === 'gap') {
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
      g.circle(at.x, at.y + (this.glowing instanceof Pad ? 6 : 0), 66 + 4 * Math.sin(this.clock * 6)).stroke({ width: 7, color: swatch.yellow.fill });
    }
    const ring = this.ring.clear();
    const spot = this.couchOn && !this.busy && !this.finished ? this.spots[this.focus] : undefined;
    if (spot) {
      if (spot instanceof Pad) ring.roundRect(spot.x - 58, spot.y - 56, 116, 118, 26).stroke({ width: 8, color: swatch.teal.line });
      else ring.roundRect(spot.x - 66, spot.y - 68, 132, 136, 26).stroke({ width: 8, color: swatch.teal.line });
    }
  }

  destroy() {}

  /** What the ring can rest on: the lily pads, or on counting levels the number cards. */
  private get spots(): Container[] {
    return this.plan.mode === 'gap' ? this.cards.map((c) => c.node) : this.pads;
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
      if (this.plan.mode === 'gap') void this.tapCard(this.cards[this.focus].n);
      else void this.tapPad(this.pads[this.focus].n);
    }
  }

  /** The "watch me" demo: move the ring to the pad (or number card) that answers the question, then press. */
  autoplay(dt: number): CouchControls {
    const out = idle();
    out.players[0].active = true;
    this.botWait -= dt;
    if (this.busy || this.finished || !this.q || this.botWait > 0) return out;
    const want = answerSlot(this.plan.mode, this.q, this.lo);
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
    const slot = answerSlot(this.plan.mode, this.q, this.lo);
    return slot < 0 ? null : { tap: { on: this.spots[slot] } };
  }

  private async next() {
    this.busy = true;
    this.index++;
    this.wrongs = 0;
    this.glowing = null;
    if (this.index >= this.questions.length) return void this.finale();
    const q = this.q;
    if (q.lo !== this.lo) await this.slideWindow(q.lo);
    if (this.at !== q.start) await this.leap(q.start);
    const mode = this.plan.mode;
    const k = Math.abs(q.hops);
    this.signText.text = mode === 'find' ? String(q.target) : mode === 'gap' ? `${q.start} → ${q.target}` : `${q.start} ${q.hops > 0 ? '+' : '−'} ${k}`;
    // The ring starts where the frog sits (or on the first card), so choosing is a few steps along.
    this.focus = mode === 'gap' ? 0 : Math.max(0, Math.min(WINDOW - 1, this.at - this.lo));
    this.busy = false;
    if (mode === 'find') return this.ctx.instruct('hop.find', { n: q.target });
    if (mode === 'next') return this.ctx.instruct(q.ask === 'more' ? 'hop.more' : 'hop.less', { n: q.start });
    if (mode === 'gap') return this.ctx.instruct('hop.gap', { n: q.start, m: q.target });
    return this.ctx.instruct(q.hops > 0 ? 'hop.add' : 'hop.back', { n: q.start, k });
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
    void this.ctx.tw.to(this.frog, { y: y - 90 }, { duration: 0.22, ease: ease.outQuad }).then(() => this.ctx.tw.to(this.frog, { y }, { duration: 0.22, ease: ease.inQuad }));
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
      void this.ctx.tw.to(this.frog, { y: y - 50 }, { duration: 0.16, ease: ease.outQuad }).then(() => this.ctx.tw.to(this.frog, { y }, { duration: 0.16, ease: ease.inQuad }));
      await this.ctx.tw.to(this.frog, { x: this.padX(next) }, { duration: 0.32 });
      this.frog.y = y;
      this.at = next;
      await this.ctx.tw.wait(0.35);
    }
    this.frogMoving = false;
  }

  private async tapPad(n: number) {
    if (this.busy || this.finished) return;
    const mode = this.plan.mode;
    if (mode === 'gap') {
      // Pads aren't the answer here; the frog just says hi.
      sfx.squeak();
      return;
    }
    if (n === this.q.target) return void this.right();
    this.miss(n);
  }

  private async tapCard(n: number) {
    if (this.busy || this.finished) return;
    if (n === answerOf('gap', this.q)) return void this.right();
    this.miss(n);
  }

  private async right() {
    this.busy = true;
    this.glowing = null;
    const q = this.q;
    if (this.plan.mode === 'find' || this.plan.mode === 'next') await this.leap(q.target);
    else {
      if (this.at !== q.start) await this.leap(q.start);
      await this.hopCount(q.target);
    }
    sfx.sparkle();
    this.ctx.particles.burst(this.frog.x, this.frog.y - 40, { kind: 'star', colors: [0xffffff, swatch.green.light, 0xfff3a0], count: 14, speed: [100, 260], gravity: 0, life: [0.5, 0.9] });
    this.ctx.pet.cheer();
    await this.ctx.say('hop.yay');
    await this.next();
  }

  private async miss(n: number) {
    this.busy = true;
    this.misses++;
    this.wrongs++;
    sfx.boing();
    const q = this.q;
    const mode = this.plan.mode;
    if (mode === 'find') await this.ctx.say('hop.wrong.find', { m: n, n: q.target });
    else if (mode === 'next') await this.ctx.say(q.ask === 'more' ? 'hop.wrong.more' : 'hop.wrong.less');
    else await this.ctx.say('hop.wrong.count', { n: q.start });
    if (this.wrongs >= 2 && !this.glowing) {
      this.hints++;
      // Show it: count the hops along the line, then hop back and let her try.
      if (mode !== 'find' && mode !== 'next') {
        await this.hopCount(q.target);
        await this.ctx.tw.wait(0.3);
        await this.leap(q.start);
      }
      this.glowing = mode === 'gap' ? this.cards.find((c) => c.n === answerOf('gap', q))!.node : this.pads[q.target - this.lo];
    }
    this.busy = false;
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
  p.set(rng.int(1, 9));
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
  name: 'Frog Hop',
  titleLine: 'game.frog-hop',
  region: 'counting-cove',
  skills: ['number-line', 'adding', 'taking-away', 'counting-on'],
  bands: ['preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.bubbles,
  coplayHint: 'Count the hops out loud together, tapping the table for each one.',
  offScreen: 'Make a number line with chalk or tape on the floor and hop along it: "Start at 2, hop 3 more!"',
  hubIcon: () => new HopIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new FrogHop(ctx),
};
