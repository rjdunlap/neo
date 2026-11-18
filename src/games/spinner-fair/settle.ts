import { Circle, Container, Graphics, Rectangle, type Text } from 'pixi.js';
import { cream, grass, swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { label } from '../../ui/text';
import type { Game, GameContext, TouchIntent } from '../types';
import {
  aboutCard,
  drawStrip,
  face,
  fastButton,
  glowSection,
  spinner as spinnerArt,
  stripRuler,
  type SpinnerArt,
} from './art';
import {
  ABOUT_CARDS,
  ABOUT_H,
  ABOUT_W,
  CHECK_SPINS,
  FF_H,
  FF_W,
  NAME_OF,
  SETTLE_R,
  SETTLE_RUNS,
  WEDGES,
  aboutRight,
  expected60,
  inBand,
  makeRound,
  planFor,
  settleLayout,
  spinRun,
  type Kind,
  type Plan,
  type SetSpec,
  type SettleLayout,
  type Spin,
  SPIN_PAD,
} from './logic';
import { RunPlayer } from './runs';

/*
 * Spinner Fair level 6, Watch it settle: a two-critter wheel spun 12, then 60, then 240 times, while a strip of the two
 * colours wobbles and settles near the favourite's share of the wheel. Then one question the wedges answer: about how
 * many of sixty more spins will be the favourite? A wrong card is the only miss. Every spin is an honest seeded draw; a
 * run that ends far from the share, or a check run outside its band, is said to be unusual and is never spun again.
 */

type Phase = 'run' | 'ask' | 'check';

/** Seconds each run plays for: twelve spins one by one, then two fast-forwards; the check run after the question. */
const RUN_SECONDS = [4.2, 3, 4];
const CHECK_SECONDS = 3;

export class SettleGame implements Game {
  readonly plan: Plan;
  readonly sets: SetSpec[];
  readonly hintLabel = 'Show me';
  setIndex = 0;
  phase: Phase = 'run';
  /** Runs finished in this set (0–3). */
  run = 0;
  /** The favourite's spins and all spins on the strip now (the three runs, or the check run after the question). */
  count = 0;
  total = 0;
  /** The check run's count of the favourite, once it has played. */
  checked: number | null = null;
  misses = 0;
  hints = 0;
  setMisses = 0;
  glowing = false;
  hinted = false;
  /** A run is playing. */
  spinning = false;
  busy = false;
  /** The pet is saying what a run showed; the ghost finger waits for it, she need not. */
  talking = false;
  finished = false;
  art!: SpinnerArt;
  cards: Container[] = [];
  readonly fast: Container;
  private L: SettleLayout;
  private clock = 0;
  /** Lands each run's spins, one by one or as a fast-forward. */
  private readonly runs: RunPlayer;
  /** Bumped by every new line of hers or the pet's, so an older chain of lines stops. */
  private talk = 0;
  private readonly backdrop: Backdrop;
  private readonly spinLayer = new Container();
  private readonly panel = new Graphics();
  private readonly strip = new Graphics();
  private readonly stripNode = new Container();
  private readonly countsNode = new Container();
  private readonly cardLayer = new Container();
  private readonly glowRing = new Graphics();
  private ruler: Graphics | null = null;
  private numbers: Text[] = [];

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.sets = makeRound(ctx.level, ctx.rng);
    this.L = settleLayout(ctx.view);
    this.runs = new RunPlayer(ctx.tw, WEDGES, {
      wheel: () => this.art.wheel,
      land: (s, loud) => this.land(s, loud),
      redraw: () => this.drawCounts(),
    });
    this.backdrop = new Backdrop(
      {
        sky: [cream, swatch.blue.light],
        hills: [grass, swatch.green.light],
        horizon: 0.36,
        clouds: 2,
        sun: true,
        seed: 86,
      },
      ctx.view,
    );
    this.panel.eventMode = this.glowRing.eventMode = 'none';
    this.stripNode.eventMode = this.countsNode.eventMode = 'none';
    this.fast = fastButton(FF_W, FF_H);
    this.fast.hitArea = new Rectangle(-FF_W / 2, -FF_H / 2, FF_W, FF_H);
    onTap(this.fast, () => this.tapFast());
    ctx.stage.addChild(
      this.backdrop,
      this.panel,
      this.countsNode,
      this.stripNode,
      this.spinLayer,
      this.fast,
      this.cardLayer,
      this.glowRing,
    );
    this.dressSet();
  }

  get set(): SetSpec {
    return this.sets[this.setIndex];
  }
  get fav(): Kind {
    return this.set.favourite!;
  }
  get friend(): Kind {
    return this.set.friend!;
  }
  get k(): number {
    return this.set.k!;
  }
  /** What a scripted play reads. */
  get state() {
    return {
      level: this.plan.level,
      set: this.setIndex,
      phase: this.phase,
      run: this.run,
      count: this.count,
      total: this.total,
      checked: this.checked,
      k: this.k,
      favourite: this.fav,
      friend: this.friend,
      wheels: this.set.wheels,
      right: expected60(this.k),
      cards: ABOUT_CARDS.slice(),
      misses: this.misses,
      hints: this.hints,
      glowing: this.glowing,
      spinning: this.spinning,
      talking: this.talking,
      busy: this.busy,
      finished: this.finished,
    };
  }

  start() {
    void this.instruct();
  }

  private instruct() {
    return this.phase === 'run'
      ? this.ctx.instruct('sf.instruct.6', { kind: NAME_OF[this.fav] })
      : this.ctx.instruct('sf.about-q', { kind: NAME_OF[this.fav] });
  }

  destroy() {
    this.finished = true;
    this.runs.stop();
    this.killTweens();
  }

  private killTweens() {
    if (this.art) {
      this.ctx.tw.kill(this.art.wheel);
      this.ctx.tw.kill(this.art.node);
    }
    this.ctx.tw.kill(this.fast.scale);
    for (const c of this.cards) {
      this.ctx.tw.kill(c);
      this.ctx.tw.kill(c.scale);
    }
  }

  // ---- building a set ----

  private dressSet() {
    this.killTweens();
    this.art?.node.destroy({ children: true });
    for (const c of this.cards) c.destroy({ children: true });
    this.count = this.total = 0;
    this.checked = null;
    this.run = 0;
    this.phase = 'run';
    this.art = spinnerArt(this.set.wheels[0], SETTLE_R, { stand: false });
    this.art.node.hitArea = new Circle(0, 0, SETTLE_R + SPIN_PAD);
    onTap(this.art.node, () => this.tapSpinner());
    this.spinLayer.addChild(this.art.node);
    this.cards = ABOUT_CARDS.map((n, i) => {
      const c = aboutCard(n, this.fav, this.friend, ABOUT_W, ABOUT_H);
      c.hitArea = new Rectangle(-ABOUT_W / 2, -ABOUT_H / 2, ABOUT_W, ABOUT_H);
      c.visible = false;
      onTap(c, () => this.tapCard(i));
      this.cardLayer.addChild(c);
      return c;
    });
    this.countsNode.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.numbers = [this.fav, this.friend].map((kind, i) => {
      const f = face(kind, 70);
      f.position.set(i === 0 ? -150 : 40, 0);
      const n = label('0', 52);
      n.position.set(i === 0 ? -75 : 115, 0);
      this.countsNode.addChild(f, n);
      return n;
    });
    this.fast.visible = true;
    this.resize(this.ctx.view);
  }

  /** The strip, its end faces, ruler and marker, rebuilt at the layout's width. */
  private buildStrip() {
    const { w, h } = this.L.strip;
    this.stripNode.removeChildren().forEach((c) => {
      if (c !== this.strip) c.destroy({ children: true });
    });
    this.ruler = stripRuler(w, h, this.k);
    this.stripNode.addChild(this.strip, this.ruler);
    this.drawCounts();
  }

  private drawCounts() {
    const { w, h } = this.L.strip;
    drawStrip(this.strip, w, h, this.fav, this.friend, this.count, this.total);
    this.numbers[0].text = String(this.count);
    this.numbers[1].text = String(this.total - this.count);
  }

  // ---- play ----

  private jiggle(node: Container) {
    this.ctx.tw.kill(node);
    node.rotation = 0.04;
    void this.ctx.tw.to(node, { rotation: 0 }, { duration: 0.3, ease: ease.outElastic });
  }

  private lift(node: Container) {
    this.ctx.tw.kill(node.scale);
    node.scale.set(1.08);
    void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack });
  }

  private tapSpinner() {
    if (this.finished) return;
    this.jiggle(this.art.node);
    this.startRun();
  }

  private tapFast() {
    if (this.finished) return;
    this.lift(this.fast);
    this.startRun();
  }

  /** Her tap starts the next run; a run plays to its end, and after the third the spinner takes no more. */
  private startRun() {
    if (this.busy || this.spinning) return;
    if (this.phase !== 'run') {
      sfx.pop(2);
      if (this.phase === 'ask') void this.say('sf.no-more-spins');
      return;
    }
    void this.playRun(SETTLE_RUNS[this.run] - this.total, RUN_SECONDS[this.run], this.run === 0);
  }

  /**
   * Plays `n` spins over `seconds`: drawn first, honestly and in order, from the game's seeded RNG, then landed on the
   * strip one by one (`slow`: each one a turn of the wheel) or as a fast-forward. Resolves when the last has landed.
   */
  private async playRun(n: number, seconds: number, slow: boolean): Promise<boolean> {
    const set = this.setIndex;
    this.talk++;
    this.talking = false;
    this.spinning = true;
    const alive = () => !this.finished && set === this.setIndex;
    if (!(await this.runs.play(spinRun(this.ctx.rng, n), seconds, slow, alive))) return false;
    this.spinning = false;
    if (this.phase === 'run') this.runDone();
    return true;
  }

  /** One spin lands on the strip. */
  private land(s: Spin, loud: boolean) {
    const kind = this.set.wheels[0][s.wedge];
    this.total++;
    if (kind === this.fav) this.count++;
    if (loud) {
      sfx.bell(kind === this.fav ? 5 : 3, 0.2);
      this.drawCounts();
    }
  }

  /** A run has ended: the pet says the two counts and what comes next. She can start the next run over it. */
  private runDone() {
    this.run++;
    const counts = {
      kind: NAME_OF[this.fav],
      n: this.count,
      other: NAME_OF[this.friend],
      m: this.total - this.count,
    };
    if (this.run < SETTLE_RUNS.length) {
      void this.chain(
        () => this.ctx.say('sf.settle-count', counts),
        () => this.ctx.say('sf.settle-more'),
      );
      return;
    }
    this.phase = 'ask';
    this.fast.visible = false;
    this.cards.forEach((c, i) => {
      c.visible = true;
      c.scale.set(0.6);
      void this.ctx.tw.to(c.scale, { x: 1, y: 1 }, { duration: 0.3, delay: i * 0.08, ease: ease.outBack });
    });
    sfx.whoosh();
    void this.chain(
      () => this.ctx.say('sf.settle-count', counts),
      () => this.ctx.say('sf.settle-close', { kind: NAME_OF[this.fav] }),
      () => this.instruct(),
    );
  }

  /** The pet's lines one after another; anything she does next stops the rest. */
  private async chain(...lines: (() => Promise<void>)[]) {
    const t = ++this.talk;
    this.talking = true;
    for (const line of lines) {
      await line();
      if (this.finished || t !== this.talk) return;
    }
    this.talking = false;
  }

  private say(...args: Parameters<GameContext['say']>) {
    this.talk++;
    this.talking = false;
    return this.ctx.say(...args);
  }

  private tapCard(i: number) {
    if (this.finished) return;
    this.lift(this.cards[i]);
    if (this.busy || this.phase !== 'ask') return;
    if (aboutRight(ABOUT_CARDS[i], this.k)) {
      void this.right(i);
      return;
    }
    this.misses++;
    this.setMisses++;
    sfx.boing();
    const card = this.cards[i];
    this.ctx.tw.kill(card);
    const x = this.L.cards[i].x;
    void this.ctx.tw
      .to(card, { x: x + 10 }, { duration: 0.06 })
      .then(() => this.ctx.tw.to(card, { x }, { duration: 0.3, ease: ease.outElastic }));
    void this.hearWrong();
  }

  private async hearWrong() {
    const set = this.setIndex;
    await this.say('sf.sixths-hint', { kind: NAME_OF[this.fav] });
    if (this.finished || this.busy || set !== this.setIndex) return;
    if (this.setMisses >= 2 && !this.glowing) {
      this.lightHint();
      await this.say('sf.help');
    }
  }

  private lightHint() {
    this.glowing = true;
    if (!this.hinted) {
      this.hinted = true;
      this.hints++;
    }
  }

  /** Asked-for help: the favourite's wedges, the share marker and its card glow (one hint per set); asked again, the ghost taps the card. During the runs it repeats the ask. */
  askForHint() {
    if (this.busy || this.finished || this.spinning) return;
    if (this.phase !== 'ask') {
      void this.instruct();
      return;
    }
    if (!this.glowing) {
      this.lightHint();
      void this.say('sf.help');
      return;
    }
    this.tapCard(ABOUT_CARDS.indexOf(expected60(this.k)));
  }

  /** The right card: sixty more spins play on a fresh strip and the pet names the count. The check run judges nothing. */
  private async right(i: number) {
    this.busy = true;
    this.glowing = false;
    this.phase = 'check';
    const set = this.setIndex;
    sfx.sparkle();
    const at = this.L.cards[i];
    this.ctx.particles.burst(at.x, at.y - ABOUT_H / 2, {
      kind: 'star',
      colors: [swatch.yellow.fill, 0xffffff],
      count: 10,
      speed: [60, 150],
      gravity: 200,
      life: [0.3, 0.6],
    });
    this.cards.forEach((c, j) => (c.alpha = j === i ? 1 : 0.35));
    const band = expected60(this.k);
    await this.say('sf.about-yes', { n: band });
    if (this.finished || set !== this.setIndex) return;
    this.count = this.total = 0;
    this.drawCounts();
    if (!(await this.playRun(CHECK_SPINS, CHECK_SECONDS, false))) return;
    this.checked = this.count;
    await this.ctx.tw.wait(0.3);
    if (this.finished || set !== this.setIndex) return;
    if (inBand(this.count, this.k)) await this.say('sf.about-right', { n: this.count, m: band });
    else await this.say('sf.unusual', { n: this.count });
    if (this.finished || set !== this.setIndex) return;
    await this.endSet();
  }

  private async endSet() {
    if (this.setIndex + 1 >= this.sets.length) {
      this.finished = true;
      sfx.bell(7, 0.35);
      sfx.bell(11, 0.3);
      await this.ctx.say('sf.done-settle');
      await this.ctx.tw.wait(0.5);
      this.ctx.finish({ misses: this.misses, hints: this.hints });
      return;
    }
    await this.ctx.tw.wait(0.4);
    if (this.finished) return;
    this.setIndex++;
    this.setMisses = 0;
    this.hinted = false;
    this.glowing = false;
    this.dressSet();
    sfx.whoosh();
    await this.say('sf.next');
    if (this.finished) return;
    this.busy = false;
    void this.instruct();
  }

  // ---- shell hooks ----

  resize(view: View) {
    const L = (this.L = settleLayout(view));
    this.backdrop.resize(view);
    this.art.node.position.set(L.spinner.x, L.spinner.y);
    this.stripNode.position.set(L.strip.x - L.strip.w / 2, L.strip.y - L.strip.h / 2);
    this.countsNode.position.set(L.counts.x, L.counts.y);
    this.buildStrip();
    this.fast.position.set(L.fast.x, L.fast.y);
    this.cards.forEach((c, i) => {
      this.ctx.tw.kill(c);
      c.position.set(L.cards[i].x, L.cards[i].y);
    });
    const left = L.strip.x - L.strip.w / 2 - 16,
      top = L.counts.y - L.counts.h / 2 - 10;
    this.panel
      .clear()
      .roundRect(left, top, L.strip.w + 32, L.strip.y + L.strip.h / 2 + 44 - top, 20)
      .fill({ color: 0xffffff, alpha: 0.75 });
  }

  update(dt: number) {
    this.clock += dt;
    if (this.finished) return;
    this.runs.update(dt);
    this.glowRing.clear();
    this.art.glow.clear();
    if (!this.glowing || this.busy || this.phase !== 'ask') return;
    const pulse = 7 + 3 * Math.sin(this.clock * 5);
    glowSection(this.art.glow, this.set.wheels[0], this.fav, SETTLE_R + pulse, this.art.wheel.rotation, 9);
    const s = this.L.strip;
    const mx = s.x - s.w / 2 + (s.w * this.k) / WEDGES;
    this.glowRing.circle(mx, s.y + s.h / 2 + 22, 24 + pulse).stroke({ width: 6, color: swatch.yellow.fill });
    const c = this.L.cards[ABOUT_CARDS.indexOf(expected60(this.k))];
    this.glowRing
      .roundRect(
        c.x - ABOUT_W / 2 - pulse,
        c.y - ABOUT_H / 2 - pulse,
        ABOUT_W + 2 * pulse,
        ABOUT_H + 2 * pulse,
        24,
      )
      .stroke({ width: 7, color: swatch.yellow.fill });
  }

  /** The ghost finger: the spinner for the first run, fast-forward for the next two, then the card at the wheel's share. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.spinning || this.talking) return null;
    if (this.phase === 'run') return { tap: { on: this.run === 0 ? this.art.node : this.fast }, pause: 0.4 };
    if (this.phase === 'ask') return { tap: { on: this.cards[ABOUT_CARDS.indexOf(expected60(this.k))] } };
    return null;
  }
}
