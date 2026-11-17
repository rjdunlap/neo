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
  cover,
  drawStrip,
  face,
  fastButton,
  glowSection,
  shareCard,
  spinner as spinnerArt,
  stripRuler,
  type CoverArt,
  type SpinnerArt,
} from './art';
import {
  ABOUT_H,
  ABOUT_W,
  FF_H,
  FF_W,
  HIDDEN_K,
  HIDDEN_RUNS,
  NAME_OF,
  RIG_WEDGES,
  SETTLE_R,
  SHARE_NAME,
  makeRound,
  planFor,
  readCards,
  revealMatches,
  settleLayout,
  spinRun,
  type Kind,
  type Plan,
  type SetSpec,
  type SettleLayout,
  type Spin,
} from './logic';
import { RunPlayer } from './runs';

/*
 * Spinner Fair level 11, The hidden spinner: an eight-wedge, two-critter wheel under a cover, spun 8, then 40, then
 * 160 times while level 6's strip (quarter ticks, no marker) fills. Only who the wheel stops on shows, in a window at
 * the pointer. Then one question the strip answers: about how much of the wheel is the favourite's? A card the strip
 * does not read to is the only miss; the right card is computed from the run alone, never from the wheel. Then the
 * cover lifts. Every spin is an honest seeded draw; a wheel that differs from what the run said is called unusual,
 * and the reveal never judges her.
 */

type Phase = 'run' | 'ask' | 'reveal';

/** Seconds each run plays for: eight spins one by one (each landing is named), then two fast-forwards. */
const RUN_SECONDS = [6.4, 2.6, 3.6];
/** The strip's ruler: a tick at every quarter. */
const QUARTERS = 4;

export class HiddenGame implements Game {
  readonly plan: Plan;
  readonly sets: SetSpec[];
  readonly hintLabel = 'Show me';
  setIndex = 0;
  phase: Phase = 'run';
  /** Runs finished in this set (0–3). */
  run = 0;
  /** The favourite's spins and all spins on the strip. */
  count = 0;
  total = 0;
  /** The cover has lifted on this set's wheel. */
  revealed = false;
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
  private lid!: CoverArt;
  /** Who the wheel last stopped on: all the window ever shows. */
  private last: Kind | null = null;
  /** The reveal is counting the favourite's wedges: its section glows. */
  private counting = false;
  private L: SettleLayout;
  private clock = 0;
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
  private numbers: Text[] = [];

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.sets = makeRound(ctx.level, ctx.rng);
    this.L = settleLayout(ctx.view);
    this.runs = new RunPlayer(ctx.tw, RIG_WEDGES, {
      wheel: () => this.art.wheel,
      land: (s, loud) => this.land(s, loud),
      redraw: () => {
        this.drawCounts();
        this.lid.show(this.last);
      },
    });
    this.backdrop = new Backdrop(
      {
        sky: [cream, swatch.blue.light],
        hills: [grass, swatch.green.light],
        horizon: 0.36,
        clouds: 2,
        sun: true,
        seed: 91,
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
  /** The card or cards the strip reads to, once the three runs stand; nothing before. */
  get right(): number[] {
    return this.total >= this.plan.spins ? readCards(this.count, this.total) : [];
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
      k: this.k,
      favourite: this.fav,
      friend: this.friend,
      wheels: this.set.wheels,
      right: this.right,
      cards: HIDDEN_K.slice(),
      revealed: this.revealed,
      covered: this.lid.dome.visible,
      last: this.last,
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
    const vars = { kind: NAME_OF[this.fav], other: NAME_OF[this.friend] };
    return this.ctx.instruct(this.phase === 'run' ? 'sf.instruct.11' : 'sf.hidden-q', vars);
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
      this.ctx.tw.kill(this.lid.dome);
      this.ctx.tw.kill(this.lid.dome.scale);
      this.ctx.tw.kill(this.lid.window);
      this.ctx.tw.kill(this.lid.window.scale);
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
    this.run = 0;
    this.last = null;
    this.revealed = this.counting = false;
    this.phase = 'run';
    this.art = spinnerArt(this.set.wheels[0], SETTLE_R, { stand: false, lines: true });
    this.art.node.hitArea = new Circle(0, 0, SETTLE_R + 12);
    onTap(this.art.node, () => this.tapSpinner());
    // The dome turns with the wheel; the window sits still over it, under the pointer (the node's last child).
    this.lid = cover([this.fav, this.friend], SETTLE_R);
    this.art.wheel.addChild(this.lid.dome);
    this.art.node.addChildAt(this.lid.window, this.art.node.children.length - 1);
    this.spinLayer.addChild(this.art.node);
    this.cards = HIDDEN_K.map((k, i) => {
      const c = shareCard(k, this.fav, this.friend, ABOUT_W, ABOUT_H);
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

  /** The strip and its quarter ruler, rebuilt at the layout's width. No marker: where the share lies is the question. */
  private buildStrip() {
    const { w, h } = this.L.strip;
    this.stripNode.removeChildren().forEach((c) => {
      if (c !== this.strip) c.destroy({ children: true });
    });
    this.stripNode.addChild(this.strip, stripRuler(w, h, null, QUARTERS));
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

  private lift(node: Container, to = 1.08) {
    this.ctx.tw.kill(node.scale);
    node.scale.set(to);
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
    if (this.spinning) return;
    if (this.busy) {
      // Between sets or at the reveal: the tap is heard, though no run starts.
      sfx.pop(2);
      return;
    }
    if (this.phase !== 'run') {
      sfx.pop(2);
      if (this.phase === 'ask') void this.say('sf.no-more-spins');
      return;
    }
    void this.playRun(HIDDEN_RUNS[this.run] - this.total, RUN_SECONDS[this.run], this.run === 0);
  }

  /** Plays `n` spins: drawn first, honestly and in order, from the game's seeded RNG, then landed on the strip. */
  private async playRun(n: number, seconds: number, slow: boolean) {
    const set = this.setIndex;
    this.talk++;
    this.talking = false;
    this.spinning = true;
    const alive = () => !this.finished && set === this.setIndex;
    if (!(await this.runs.play(spinRun(this.ctx.rng, n, RIG_WEDGES), seconds, slow, alive))) return;
    this.spinning = false;
    this.runDone();
  }

  /** One spin lands on the strip; landing by itself, its critter pops up in the window and is named. */
  private land(s: Spin, loud: boolean) {
    const kind = this.set.wheels[0][s.wedge];
    this.last = kind;
    this.total++;
    if (kind === this.fav) this.count++;
    if (!loud) return;
    sfx.bell(kind === this.fav ? 5 : 3, 0.2);
    this.drawCounts();
    this.lid.show(kind);
    this.lift(this.lid.window, 1.25);
    void this.ctx.say('sf.critter', { kind: NAME_OF[kind] });
  }

  /** A run has ended: the pet says the two counts and what comes next. She can start the next run over it. */
  private runDone() {
    this.run++;
    this.lid.show(this.last);
    const counts = {
      kind: NAME_OF[this.fav],
      n: this.count,
      other: NAME_OF[this.friend],
      m: this.total - this.count,
    };
    if (this.run < HIDDEN_RUNS.length) {
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
    if (this.right.includes(HIDDEN_K[i])) {
      void this.rightCard(i);
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
    await this.say('sf.strip-hint');
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

  /** Asked-for help: the strip's end against the ruler and the card it reads to glow (one hint per set); asked again, the ghost taps the card. During the runs it repeats the ask. */
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
    this.tapCard(HIDDEN_K.indexOf(this.right[0]));
  }

  /** The right card: the cover lifts and the wedges are counted aloud. The reveal judges nothing. */
  private async rightCard(i: number) {
    this.busy = true;
    this.glowing = false;
    this.phase = 'reveal';
    const set = this.setIndex;
    const alive = () => !this.finished && set === this.setIndex;
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
    await this.say('sf.hidden-yes');
    if (!alive()) return;
    await this.liftCover(alive);
    if (!alive()) return;
    this.revealed = this.counting = true;
    const vars = { kind: NAME_OF[this.fav], n: this.k, share: SHARE_NAME[this.k] };
    // The wheel matches when it is a card the strip read to (either, on a strip exactly halfway).
    if (this.right.some((card) => revealMatches(card, this.k))) await this.say('sf.reveal', vars);
    else await this.say('sf.reveal-unusual', vars);
    if (!alive()) return;
    await this.ctx.tw.wait(0.5);
    if (!alive()) return;
    this.counting = false;
    // The last set ends the game, and a finished game no longer redraws: take the counting glow off first.
    this.art.glow.clear();
    await this.endSet();
  }

  /** The cover lifts off the wheel with a rising run of three notes and a puff. */
  private async liftCover(alive: () => boolean) {
    const { dome, window } = this.lid;
    [5, 7, 9].forEach((step, i) => {
      void this.ctx.tw.wait(i * 0.14).then(() => {
        if (alive()) sfx.bell(step, 0.25);
      });
    });
    const s = this.L.spinner;
    this.ctx.particles.burst(s.x, s.y, {
      kind: 'dot',
      colors: [swatch.purple.light, 0xffffff],
      count: 18,
      speed: [80, 220],
      gravity: 120,
      life: [0.4, 0.8],
    });
    void this.ctx.tw.to(window, { alpha: 0 }, { duration: 0.3, ease: ease.outQuad });
    void this.ctx.tw.to(dome.scale, { x: 1.2, y: 1.2 }, { duration: 0.6, ease: ease.outQuad });
    await this.ctx.tw.to(dome, { alpha: 0 }, { duration: 0.6, ease: ease.outQuad });
    if (!alive()) return;
    dome.visible = window.visible = false;
  }

  private async endSet() {
    if (this.setIndex + 1 >= this.sets.length) {
      this.finished = true;
      sfx.bell(7, 0.35);
      sfx.bell(11, 0.3);
      await this.ctx.say('sf.done-hidden');
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
    const pulse = 7 + 3 * Math.sin(this.clock * 5);
    if (this.counting)
      glowSection(this.art.glow, this.set.wheels[0], this.fav, SETTLE_R + pulse, this.art.wheel.rotation, 9);
    if (!this.glowing || this.busy || this.phase !== 'ask') return;
    // The hint names the picture: where the strip's two colours meet, against the ruler, and the card it reads to.
    const s = this.L.strip;
    const mx = s.x - s.w / 2 + (s.w * this.count) / this.total;
    this.glowRing.circle(mx, s.y + s.h / 2 + 12, 22 + pulse).stroke({ width: 6, color: swatch.yellow.fill });
    for (const k of this.right) {
      const c = this.L.cards[HIDDEN_K.indexOf(k)];
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
  }

  /** The ghost finger: the spinner for the first run, fast-forward for the next two, then a card the strip reads to. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.spinning || this.talking) return null;
    if (this.phase === 'run') return { tap: { on: this.run === 0 ? this.art.node : this.fast }, pause: 0.4 };
    if (this.phase === 'ask') return { tap: { on: this.cards[HIDDEN_K.indexOf(this.right[0])] } };
    return null;
  }
}
