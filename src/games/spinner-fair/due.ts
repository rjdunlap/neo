import { Circle, Container, Graphics, Rectangle, type Text } from 'pixi.js';
import { cream, grass, ink, swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { sfx } from '../../audio/sfx';
import { ease } from '../../engine/tween';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { label } from '../../ui/text';
import type { Game, GameContext, TouchIntent } from '../types';
import { dueCard, fastButton, ribbonCell, spinner as spinnerArt, sw, type SpinnerArt } from './art';
import {
  ABOUT_H,
  ABOUT_W,
  FF_H,
  FF_W,
  NAME_OF,
  RIBBON,
  RIBBON_TOP,
  SETTLE_R,
  STREAK,
  WEDGES,
  countOf,
  dueCards,
  dueLayout,
  dueRight,
  longestStreak,
  makeRound,
  planFor,
  runAt,
  sections,
  spin,
  stopRotation,
  streakRun,
  wedgeAt,
  type DueCard,
  type DueLayout,
  type Kind,
  type Plan,
  type SetSpec,
  type Spin,
  type Wheel,
} from './logic';
import { RunPlayer } from './runs';

/*
 * Spinner Fair level 10, Is it due?: two critters share a six-wedge wheel, even on one set and uneven on the other.
 * The wheel spins by itself, each honest result joining a ribbon, until one critter has come up five times running:
 * the stopping rule makes the streak, never a chosen seed. Then: who is more likely on the next spin? The answer is
 * read from the wheel (the same on the even wheel, the critter with more wedges on the uneven one) and the streak
 * never enters it. One more honest spin follows and is welcomed the same way whoever comes up.
 */

type Phase = 'run' | 'ask' | 'next';

/** Seconds a spin takes: the first twelve, those up to the sixtieth, and the rest. */
const PACE = [0.35, 0.1, 0.04];
const SLOW = 12,
  MID = 60;
/** Fresh cards take no answer for this long, so a tap aimed at the spinner never answers. */
const CARD_WAIT = 0.5;

export class DueGame implements Game {
  readonly plan: Plan;
  readonly sets: SetSpec[];
  readonly hintLabel = 'Show me';
  setIndex = 0;
  phase: Phase = 'run';
  /** Every spin of the set so far, in order: the run, then the one next spin. */
  results: Kind[] = [];
  /** The streak the question names: its critter and length (five, or the longest when the run reached the cap). */
  streak: { kind: Kind; length: number } | null = null;
  /** What the one spin after the question landed on. */
  next: Kind | null = null;
  misses = 0;
  hints = 0;
  setMisses = 0;
  glowing = false;
  hinted = false;
  /** The wheel is turning: the run, or the next spin. */
  spinning = false;
  busy = false;
  finished = false;
  art!: SpinnerArt;
  cards: Container[] = [];
  readonly fast = new Container();
  private L: DueLayout;
  private clock = 0;
  private cardsAt = 0;
  private lastWedge = -1;
  /** The ribbon ends on this result (the latest, or the longest streak's last when the run reached the cap). */
  private viewEnd = -1;
  /** Bumped by every new line of hers or the pet's, so an older chain of lines stops. */
  private talk = 0;
  private readonly runs: RunPlayer;
  private readonly backdrop: Backdrop;
  private readonly panel = new Graphics();
  private readonly ribbon = new Container();
  private readonly band = new Graphics();
  private readonly runNumber: Text = label('', 34);
  private cells: ReturnType<typeof ribbonCell>[] = [];
  private readonly cardLayer = new Container();
  private readonly spinLayer = new Container();
  private readonly glowRing = new Graphics();
  /** The wedge counts shown on the wheel while help glows: one per critter. */
  private countBadges = new Container();

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.sets = makeRound(ctx.level, ctx.rng);
    this.L = dueLayout(ctx.view);
    this.runs = new RunPlayer(ctx.tw, WEDGES, {
      wheel: () => this.art.wheel,
      land: (s, loud) => this.land(s, loud),
      redraw: () => this.drawRibbon(),
    });
    this.backdrop = new Backdrop(
      {
        sky: [cream, swatch.blue.light],
        hills: [grass, swatch.green.light],
        horizon: 0.36,
        clouds: 2,
        sun: true,
        seed: 97,
      },
      ctx.view,
    );
    this.panel.eventMode = this.glowRing.eventMode = this.ribbon.eventMode = 'none';
    this.fast.addChild(fastButton(FF_W, FF_H));
    this.fast.hitArea = new Rectangle(-FF_W / 2, -FF_H / 2, FF_W, FF_H);
    onTap(this.fast, () => this.tapFast());
    ctx.stage.addChild(
      this.backdrop,
      this.panel,
      this.ribbon,
      this.fast,
      this.cardLayer,
      this.spinLayer,
      this.glowRing,
    );
    this.dressSet();
  }

  get set(): SetSpec {
    return this.sets[this.setIndex];
  }
  get wheel(): Wheel {
    return this.set.wheels[0];
  }
  get racers(): [Kind, Kind] {
    return this.set.racers!;
  }
  get right(): DueCard {
    return dueRight(this.wheel, this.racers);
  }
  get options(): DueCard[] {
    return dueCards(this.racers);
  }
  /** What a scripted play reads. */
  get state() {
    return {
      level: this.plan.level,
      set: this.setIndex,
      phase: this.phase,
      racers: this.racers,
      favourite: this.set.favourite!,
      friend: this.set.friend!,
      wheel: this.wheel.slice(),
      counts: this.racers.map((k) => countOf(this.wheel, k)),
      even: this.right === 'same',
      right: this.right,
      options: this.options,
      results: this.results.slice(),
      run: runAt(this.results),
      streak: this.streak,
      next: this.next,
      misses: this.misses,
      hints: this.hints,
      glowing: this.glowing,
      spinning: this.spinning,
      busy: this.busy,
      finished: this.finished,
    };
  }

  start() {
    void this.instruct();
  }

  private instruct() {
    return this.ctx.instruct('sf.instruct.10');
  }

  /** The guide was tapped: once the run is over it repeats the ask that is waiting, not the round's instruction. */
  sayWaitingAsk() {
    if (this.finished || this.busy || this.spinning) return false;
    if (this.phase === 'ask' && this.streak) {
      void this.ask('sf.streak', { kind: NAME_OF[this.streak.kind], n: this.streak.length });
      return true;
    }
    if (this.phase === 'next') {
      void this.ask('sf.spin-once');
      return true;
    }
    return false;
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
    for (const c of this.cards) this.ctx.tw.kill(c.scale);
  }

  // ---- building a set ----

  private dressSet() {
    this.killTweens();
    this.art?.node.destroy({ children: true });
    for (const c of this.cards) c.destroy({ children: true });
    this.results = [];
    this.streak = null;
    this.next = null;
    this.viewEnd = -1;
    this.phase = 'run';
    this.art = spinnerArt(this.wheel, SETTLE_R, { stand: false, lines: true });
    this.art.node.hitArea = new Circle(0, 0, SETTLE_R + 12);
    onTap(this.art.node, () => this.tapSpinner());
    this.buildBadges();
    this.spinLayer.addChild(this.art.node);
    this.cards = this.options.map((card, i) => {
      const c = dueCard(card, this.racers, ABOUT_W, ABOUT_H);
      c.hitArea = new Rectangle(-ABOUT_W / 2, -ABOUT_H / 2, ABOUT_W, ABOUT_H);
      onTap(c, () => this.tapCard(i));
      c.visible = false;
      this.cardLayer.addChild(c);
      return c;
    });
    this.resize(this.ctx.view);
  }

  /** A numeral on each critter's section, near the rim: its wedges, shown with the help. */
  private buildBadges() {
    // The last set's badges went with its spinner.
    this.countBadges = new Container();
    this.art.node.addChild(this.countBadges);
    for (const s of sections(this.wheel)) {
      const b = new Container();
      b.addChild(
        new Graphics()
          .circle(0, 0, 26)
          .fill(0xffffff)
          .stroke({ width: 4, color: sw(s.kind).line }),
        label(String(s.count), 34),
      );
      this.countBadges.addChild(b);
    }
    this.countBadges.visible = false;
    this.countBadges.eventMode = 'none';
  }

  /** The ribbon's cells are rebuilt for the set's two critters and the view's cell size. */
  private buildRibbon() {
    this.ribbon.removeChildren().forEach((c) => {
      if (c !== this.band && c !== this.runNumber) c.destroy({ children: true });
    });
    const { cell } = this.L;
    this.cells = Array.from({ length: RIBBON }, (_, i) => {
      const c = ribbonCell(this.racers, cell);
      c.node.position.set(i * cell + cell / 2, cell / 2);
      this.ribbon.addChild(c.node);
      return c;
    });
    this.ribbon.addChild(this.band, this.runNumber);
    this.drawRibbon();
  }

  /**
   * The latest twelve results, the newest at the right, with the run in progress banded and its length above it. When
   * the run reached the cap the ribbon rests on the longest streak instead.
   */
  private drawRibbon() {
    const { cell } = this.L;
    const end = this.viewEnd >= 0 ? this.viewEnd : this.results.length - 1;
    const shown = this.results.slice(Math.max(0, end + 1 - RIBBON), end + 1);
    const from = RIBBON - shown.length;
    this.cells.forEach((c, i) => c.show(i >= from ? shown[i - from] : null));
    this.band.clear();
    const run = runAt(shown);
    this.runNumber.visible = run.length > 0;
    if (!run.length || !run.kind) return;
    // The whole run may be longer than the part of it still on the ribbon; the numeral says the whole.
    const whole = runAt(this.results.slice(0, end + 1)).length;
    const x0 = (RIBBON - run.length) * cell;
    this.band.roundRect(x0 + 2, 2, run.length * cell - 4, cell - 4, cell / 3).stroke({
      width: 5,
      color: whole >= STREAK ? swatch.yellow.fill : ink,
      alpha: whole >= STREAK ? 1 : 0.55,
    });
    this.runNumber.text = String(whole);
    this.runNumber.position.set(RIBBON * cell - cell / 2, -RIBBON_TOP / 2 + 2);
  }

  // ---- play ----

  private lift(node: Container, to = 1.08) {
    this.ctx.tw.kill(node.scale);
    node.scale.set(to);
    void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
  }

  private say(...args: Parameters<GameContext['say']>) {
    this.talk++;
    return this.ctx.say(...args);
  }

  /** The question after a run, and the ask for one more spin: each is the instruction while it waits, so the caption keeps it and the guide repeats it. */
  private ask(...args: Parameters<GameContext['instruct']>) {
    this.talk++;
    return this.ctx.instruct(...args);
  }

  private jiggle() {
    const node = this.art.node;
    this.ctx.tw.kill(node);
    node.rotation = 0.04;
    void this.ctx.tw.to(node, { rotation: 0 }, { duration: 0.3, ease: ease.outElastic });
  }

  private tapSpinner() {
    if (this.finished) return;
    this.jiggle();
    if (this.busy || this.spinning) return;
    if (this.phase === 'run') void this.run(true);
    else if (this.phase === 'next') void this.nextSpin();
    else {
      // The run is over and the question waits: a spin here would be the next spin, which comes after the answer.
      // A tap on the pet repeats the question; hammering the wheel never restarts it.
      sfx.pop(2);
    }
  }

  /** The arrows start the run as a fast-forward from its first spin. */
  private tapFast() {
    if (this.finished) return;
    this.lift(this.fast);
    if (this.busy || this.spinning) return;
    if (this.phase === 'run') void this.run(false);
    else sfx.pop(3);
  }

  /**
   * The run: honest spins, drawn first and in order from the game's seeded RNG, until five in a row (or the cap); then
   * landed on the ribbon, the first twelve one by one unless she chose the arrows. No spin is ever a miss.
   */
  private async run(slowFirst: boolean) {
    this.spinning = true;
    const set = this.setIndex;
    const alive = () => !this.finished && set === this.setIndex;
    const spins = streakRun(this.ctx.rng, this.wheel);
    const parts: [Spin[], number, boolean][] = [
      [spins.slice(0, SLOW), slowFirst ? PACE[0] : PACE[1], slowFirst],
      [spins.slice(SLOW, MID), PACE[1], false],
      [spins.slice(MID), PACE[2], false],
    ];
    for (const [part, pace, slow] of parts) {
      if (!part.length) continue;
      if (!(await this.runs.play(part, part.length * pace, slow, alive))) return;
    }
    this.spinning = false;
    this.busy = true;
    // Five in a row, or (at the cap) the longest streak the run held, which the ribbon goes back to.
    const best = longestStreak(this.results);
    this.streak = { kind: best.kind!, length: best.length };
    if (best.end !== this.results.length - 1) this.viewEnd = best.end;
    this.drawRibbon();
    sfx.bell(6, 0.25);
    await this.ctx.tw.wait(0.4);
    if (!alive()) return;
    this.phase = 'ask';
    this.cardsAt = this.clock;
    this.cards.forEach((c, i) => {
      c.visible = true;
      c.alpha = 0;
      void this.ctx.tw.to(c, { alpha: 1 }, { duration: 0.25, delay: i * 0.06, ease: ease.outQuad });
    });
    this.busy = false;
    void this.ask('sf.streak', { kind: NAME_OF[this.streak.kind], n: this.streak.length });
  }

  /** One spin of the run joins the ribbon; a slow one rings a step that rises while a run grows and drops when it breaks. */
  private land(s: Spin, loud: boolean) {
    const kind = this.wheel[s.wedge];
    this.results.push(kind);
    if (!loud) return;
    sfx.bell(1 + Math.min(STREAK + 1, runAt(this.results).length) * 2, 0.2);
    this.drawRibbon();
  }

  /** A card: right when it is what the wheel says. The streak never enters it. */
  private tapCard(i: number) {
    if (this.finished) return;
    this.lift(this.cards[i]);
    if (this.busy || this.phase !== 'ask' || this.clock - this.cardsAt < CARD_WAIT) return;
    if (this.options[i] === this.right) {
      this.answered(i);
      return;
    }
    this.misses++;
    this.setMisses++;
    sfx.boing();
    void this.hearWrong();
  }

  /** The reason; the second wrong card on a set lights the help. */
  private async hearWrong() {
    const set = this.setIndex;
    const live = () => !this.finished && this.phase === 'ask' && set === this.setIndex;
    const line = this.say('sf.due-hint');
    const t = this.talk;
    await line;
    if (!live()) return;
    if (this.setMisses >= 2 && !this.glowing) {
      this.lightHint();
      if (t === this.talk) await this.say('sf.help');
    }
  }

  private lightHint() {
    this.glowing = true;
    if (!this.hinted) {
      this.hinted = true;
      this.hints++;
    }
  }

  /** Asked-for help: the wheel's two sections glow with their wedge counts, and the card they point to (one hint per set); asked again, the card is tapped. Before the run it repeats the ask. */
  askForHint() {
    if (this.busy || this.finished || this.spinning) return;
    if (this.phase === 'run') {
      void this.instruct();
      return;
    }
    if (this.phase === 'next') {
      void this.ask('sf.spin-once');
      return;
    }
    if (!this.glowing) {
      this.lightHint();
      void this.say('sf.help');
      return;
    }
    this.cardsAt = -CARD_WAIT;
    this.tapCard(this.options.indexOf(this.right));
  }

  /** The right card: the reason is said while the spinner already takes the one next spin. */
  private answered(i: number) {
    this.glowing = false;
    this.phase = 'next';
    sfx.sparkle();
    const c = this.cards[i];
    this.ctx.particles.burst(c.x, c.y - ABOUT_H / 2, {
      kind: 'star',
      colors: [swatch.yellow.fill, 0xffffff],
      count: 10,
      speed: [60, 150],
      gravity: 200,
      life: [0.3, 0.6],
    });
    this.cards.forEach((card, j) => (card.alpha = j === i ? 1 : 0.45));
    void this.sayRight();
  }

  private async sayRight() {
    const set = this.setIndex;
    const [a, b] = this.racers;
    const [n, m] = this.racers.map((k) => countOf(this.wheel, k));
    const line =
      this.right === 'same'
        ? this.say('sf.due-same')
        : this.say('sf.due-more', {
            kind: NAME_OF[n > m ? a : b],
            other: NAME_OF[n > m ? b : a],
            n: Math.max(n, m),
            m: Math.min(n, m),
          });
    const t = this.talk;
    await line;
    // The ask for the one more spin follows, unless she has already spun.
    if (this.finished || set !== this.setIndex || this.phase !== 'next' || this.spinning || this.busy) return;
    if (t === this.talk) void this.ask('sf.spin-once');
  }

  /** The one spin after the question: the stream's next honest draw, welcomed the same whoever it lands on. */
  private async nextSpin() {
    this.spinning = true;
    this.busy = true;
    const set = this.setIndex;
    const alive = () => !this.finished && set === this.setIndex;
    const s = spin(this.ctx.rng);
    const wheel = this.art.wheel;
    this.lastWedge = wedgeAt(wheel.rotation);
    if (!this.runs.reduce)
      await this.ctx.tw.to(
        wheel,
        { rotation: stopRotation(wheel.rotation, s.angle, 2) },
        { duration: 1.4, ease: ease.outCubic },
      );
    if (!alive()) return;
    wheel.rotation %= Math.PI * 2;
    this.spinning = false;
    const kind = this.wheel[s.wedge];
    this.next = kind;
    this.viewEnd = -1;
    this.results.push(kind);
    this.drawRibbon();
    sfx.bell(5, 0.25);
    sfx.pop(5);
    await this.say('sf.due-next', { kind: NAME_OF[kind] });
    if (!alive()) return;
    await this.endSet();
  }

  private async endSet() {
    if (this.setIndex + 1 >= this.sets.length) {
      this.finished = true;
      sfx.bell(7, 0.35);
      sfx.bell(11, 0.3);
      await this.ctx.say('sf.done-due');
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
    // The fresh wheel takes her tap at once; the ask follows the line unless she has already started the run.
    this.busy = false;
    const set = this.setIndex;
    await this.say('sf.next');
    if (this.finished || set !== this.setIndex || this.phase !== 'run' || this.spinning) return;
    void this.instruct();
  }

  // ---- shell hooks ----

  resize(view: View) {
    const L = (this.L = dueLayout(view));
    this.backdrop.resize(view);
    this.art.node.position.set(L.spinner.x, L.spinner.y);
    this.fast.position.set(L.fast.x, L.fast.y);
    this.cards.forEach((c, i) => c.position.set(L.cards[i].x, L.cards[i].y));
    const left = L.ribbon.x - L.ribbon.w / 2,
      top = L.ribbon.y - L.ribbon.h / 2;
    this.ribbon.position.set(left, top);
    this.buildRibbon();
    this.panel
      .clear()
      .roundRect(left - 12, top - RIBBON_TOP, L.ribbon.w + 24, RIBBON_TOP + L.ribbon.h + 10, 20)
      .fill({ color: 0xffffff, alpha: 0.75 });
  }

  update(dt: number) {
    this.clock += dt;
    if (this.finished) return;
    this.runs.update(dt);
    if (this.spinning && this.phase === 'next') {
      const w = wedgeAt(this.art.wheel.rotation);
      if (w !== this.lastWedge) {
        this.lastWedge = w;
        sfx.tick();
      }
    }
    this.fast.alpha = this.phase === 'run' && !this.spinning ? 1 : 0.45;
    this.glowRing.clear();
    this.art.glow.clear();
    const help = this.glowing && !this.busy && this.phase === 'ask';
    this.countBadges.visible = help;
    if (!help) return;
    const pulse = 7 + 3 * Math.sin(this.clock * 5);
    // Both sections of the wheel, each with its count of wedges, and the card they point to.
    const rot = this.art.wheel.rotation;
    const deg = 360 / this.wheel.length;
    const rad = (wedge: number) => ((wedge * deg - 90) * Math.PI) / 180 + rot;
    sections(this.wheel).forEach((s, i) => {
      this.art.glow
        .moveTo(0, 0)
        .arc(0, 0, SETTLE_R + 4 + pulse * 0.4, rad(s.start), rad(s.start + s.count))
        .closePath()
        .stroke({ width: 8, color: swatch.yellow.fill, join: 'round' });
      const mid = rad(s.start + s.count / 2);
      this.countBadges.children[i].position.set(
        Math.cos(mid) * SETTLE_R * 0.86,
        Math.sin(mid) * SETTLE_R * 0.86,
      );
    });
    const b = this.L.cards[this.options.indexOf(this.right)];
    this.glowRing
      .roundRect(b.x - b.w / 2 - pulse, b.y - b.h / 2 - pulse, b.w + 2 * pulse, b.h + 2 * pulse, 24)
      .stroke({ width: 7, color: swatch.yellow.fill });
  }

  /** The ghost finger, from the picture: the spinner, then (after the run) the card the wheel says, then the spinner once more. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.spinning) return null;
    if (this.phase === 'ask') {
      if (this.clock - this.cardsAt < CARD_WAIT) return null;
      return { tap: { on: this.cards[this.options.indexOf(this.right)] }, pause: 0.9 };
    }
    return { tap: { on: this.art.node }, pause: 0.8 };
  }
}
