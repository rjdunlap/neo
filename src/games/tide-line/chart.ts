import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { swatch } from '../../art/palette';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { tally } from '../../progress/coach';
import type { Game, GameContext, TouchIntent } from '../types';
import { dayShore, jobArt, jobCard, scaleShore, SEA, SEA_DEEP, skyIcon } from './art';
import {
  AUTHORED_DAY,
  BOAT_FLOAT,
  CHART_AXIS,
  CHART_FOOT,
  chartLayout,
  ChartRound,
  chartX,
  chartY,
  dayWater,
  fitting,
  JOB_CARD,
  JOB_MARK,
  jobsFor,
  makeDay,
  POOL_RIM,
  POOL_TOP,
  SHELF,
  STOPS,
  stopT,
  tidePlan,
  WINDOW,
  windowAt,
  type ChartLayout,
  type Job,
  type Plan,
} from './logic';

/** The authored day and card order lead the first round of a session, and every demonstration. */
let authoredShown = false;

/** Seconds the shore picture takes to move to a looked-at window. */
const GLIDE = 0.4;
const INK = 0x35506b;

function label(text: string, size: number) {
  const t = new Text({
    text,
    style: {
      fontFamily: 'Nunito, sans-serif',
      fontSize: size,
      fontWeight: '800',
      fill: INK,
      align: 'center',
    },
  });
  t.anchor.set(0.5);
  t.eventMode = 'none';
  return t;
}

/**
 * Tide Line level 6, Read the chart (docs/definitions/tide-line-5-6.md): the island day is a line of water height over
 * time with four short windows on it. One job card at a time (the rock pool, the boat, the picnic) is dragged onto a
 * window, or tapped and then the window tapped; touching a window alone shows the shore at that time. A window that
 * fits keeps the card beside its time of day; a clashing one shows why on the shore and sends the card home.
 */
export class ChartDay implements Game {
  readonly plan: Plan;
  readonly turn: ChartRound;
  /** The time of day the small shore shows, 0 to 1. */
  readonly now = { t: 0 };
  busy = false;
  finished = false;
  /** At the stage's origin: the ghost finger's drop spots are given in its coordinates. */
  readonly board = new Container();
  readonly windows: Container[] = [];
  readonly card = new Container();
  C: ChartLayout;
  view: View;
  /** The window last looked at (touched, hovered over or answered), or null before the first. */
  look: number | null = null;
  private handle: DragHandle;
  private readonly picture = new Graphics();
  private readonly chart = new Graphics();
  private readonly marks = new Graphics();
  private readonly glow = new Graphics();
  private readonly cardArt = new Graphics();
  private readonly title = label('Island tide', 24);
  private readonly timeLabel = label('Time', 22);
  private readonly heightLabel = label('Water height', 20);
  private readonly doneLayer = new Container();
  private readonly pairs: Container[] = [];
  private hover: number | null = null;
  /** The job whose card is out and whose mark is on the chart: it changes when the next card is served, not mid-flight. */
  private shownJob: Job | undefined;
  private drawn = -1;
  private clock = 0;
  /** The next card's ask waits behind the last card's line; a tap on the guide says it at once. */
  private waitingAsk = false;
  readonly askForHint = () => this.help();
  readonly hintLabel = 'Show me';

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.C = chartLayout(ctx.view);
    this.plan = tidePlan(ctx.level);
    const authored = !!ctx.demo || !authoredShown;
    authoredShown = true;
    this.turn = new ChartRound(authored ? AUTHORED_DAY : makeDay(ctx.rng), jobsFor(ctx.rng, authored));
    for (const g of [this.picture, this.chart, this.marks, this.glow]) g.eventMode = 'none';
    this.doneLayer.eventMode = 'none';
    this.heightLabel.rotation = -Math.PI / 2;
    ctx.stage.addChild(this.board, this.picture, this.chart, this.title, this.timeLabel, this.heightLabel);
    for (let i = 0; i < STOPS; i++) {
      const node = new Container();
      onTap(node, () => this.touchWindow(i), { place: true });
      this.windows.push(node);
      ctx.stage.addChild(node);
    }
    this.card.addChild(this.cardArt);
    this.card.hitArea = new Rectangle(-JOB_CARD / 2, -JOB_CARD / 2, JOB_CARD, JOB_CARD);
    ctx.stage.addChild(this.marks, this.glow, this.doneLayer, this.card);
    this.handle = this.grip();
    this.serve();
    this.layoutAll();
  }

  start() {
    this.sayAsk();
  }

  /** The card's drag: over a window it shows that time on the shore; let go on one it answers, anywhere else it goes home. */
  private grip(): DragHandle {
    return draggable(this.card, this.ctx.tw, {
      tapToPlace: true,
      onPick: () => sfx.pop(6),
      onMove: (x, y) => {
        if (this.finished || this.busy) return;
        const i = windowAt(this.C, x, y);
        const over = i < 0 ? null : i;
        if (over === this.hover) return;
        this.hover = over;
        if (over !== null) this.show(over);
        else this.drawMarks();
      },
      onCancel: () => {
        this.hover = null;
        this.drawMarks();
      },
      onDrop: (x, y) => {
        this.hover = null;
        if (this.finished || this.busy) return false;
        const i = windowAt(this.C, x, y);
        if (i < 0) {
          this.drawMarks();
          return false;
        }
        return this.commit(i);
      },
    });
  }

  /** The small shore moves to a window's time, and the window lights. Looking is never counted. */
  private show(stop: number) {
    this.look = stop;
    this.ctx.tw.kill(this.now);
    void this.ctx.tw.to(this.now, { t: stopT(stop) }, { duration: GLIDE, ease: ease.inOutSine });
    this.drawChart();
  }

  /** A touched window: a look at that time. (A held card is put down on it by the drag helper, and answers there.) */
  private touchWindow(stop: number) {
    if (this.finished || this.busy) return;
    if (!this.handle.dragging) sfx.pop(4 + stop);
    this.show(stop);
  }

  /** The card is let go on a window. True when the window fits and keeps it. */
  private commit(stop: number): boolean {
    const out = this.turn.place(stop);
    if (!out) return false;
    this.show(stop);
    if (!out.right) {
      // The shore at that time shows why; the card floats home for another try.
      sfx.boing();
      this.drawGlow();
      void this.ctx.say(`tl.clash.${out.job}`);
      return false;
    }
    void this.pair(out.job, stop);
    return true;
  }

  private async pair(job: Job, stop: number) {
    this.busy = true;
    this.handle.enabled = false;
    this.drawGlow();
    sfx.sparkle();
    this.ctx.pet.cheer();
    const tw = this.ctx.tw;
    const slot = this.C.done[this.pairs.length];
    tw.kill(this.card);
    tw.kill(this.card.scale);
    void tw.to(this.card.scale, { x: 0.45, y: 0.45 }, { duration: 0.35, ease: ease.inOutSine });
    await tw.to(
      this.card,
      { x: slot.x + slot.w / 2, y: slot.y + slot.h * 0.28 },
      { duration: 0.35, ease: ease.inOutSine },
    );
    this.addPair(job, stop);
    this.placePairs();
    if (this.turn.done) {
      this.card.visible = false;
      this.shownJob = undefined;
      return void this.end();
    }
    // The line about this card never holds the next one (U7 R4): the next card is ready now, and its ask follows the line.
    this.serve();
    // The fade is on the card's drawing, so a grab, Help or a turned screen (which stop the card's own tweens) cannot leave it faint.
    this.cardArt.alpha = 0;
    void tw.to(this.cardArt, { alpha: 1 }, { duration: 0.25 });
    this.handle.enabled = true;
    this.busy = false;
    this.drawMarks();
    this.waitingAsk = true;
    await this.ctx.say(`tl.fit.${job}`);
    if (this.waitingAsk && !this.finished && !this.turn.done) this.sayAsk();
  }

  /** The current job's card, at home and full size. */
  private serve() {
    const job = this.turn.job;
    if (!job) return;
    this.shownJob = job;
    jobCard(this.cardArt.clear(), job);
    this.card.scale.set(1);
    this.card.position.set(this.C.card.x, this.C.card.y);
    this.handle.home = { x: this.C.card.x, y: this.C.card.y };
  }

  private sayAsk() {
    this.waitingAsk = false;
    const job = this.turn.job;
    if (job) void this.ctx.instruct(`tl.instruct.6.${job}`);
  }

  sayWaitingAsk() {
    if (!this.waitingAsk || this.finished || this.turn.done) return false;
    this.sayAsk();
    return true;
  }

  private addPair(job: Job, stop: number) {
    const node = new Container();
    const art = new Graphics();
    jobArt(art, job, 0, 0, 0.5);
    const icon = new Graphics();
    skyIcon(icon, stop, 0, 0);
    icon.scale.set(0.62);
    icon.y = 52;
    node.addChild(art, icon);
    this.pairs.push(node);
    this.doneLayer.addChild(node);
  }

  /** Show me: both fitting windows glow (one hint a card); asked again, the card goes to the earlier one. */
  private help() {
    if (this.finished || this.busy || this.handle.dragging) return;
    const out = this.turn.help();
    if (!out) return;
    const job = this.turn.job;
    if ('glow' in out) {
      sfx.sparkle();
      this.drawGlow();
      void this.ctx.say(job === 'boat' ? 'tl.glow.high' : 'tl.glow.low');
      return;
    }
    this.handle.cancel();
    this.busy = true;
    this.handle.enabled = false;
    const tw = this.ctx.tw;
    tw.kill(this.card);
    const b = this.C.windows[out.place];
    void tw
      .to(
        this.card,
        { x: b.x + b.w / 2, y: this.C.plot.y + this.C.plot.h / 2 },
        { duration: 0.5, ease: ease.inOutSine },
      )
      .then(() => {
        this.busy = false;
        if (!this.finished) this.commit(out.place);
      });
  }

  /** The three choices are looked at again, in order, before the round ends. */
  private async end() {
    if (this.finished) return;
    this.finished = true;
    this.waitingAsk = false;
    this.handle.enabled = false;
    this.look = null;
    this.drawChart();
    const tw = this.ctx.tw;
    await tw.wait(0.4);
    for (const [i, p] of this.turn.placed.entries()) {
      tw.kill(this.now);
      this.look = p.stop;
      this.drawChart();
      await tw.to(this.now, { t: stopT(p.stop) }, { duration: 0.5, ease: ease.inOutSine });
      const node = this.pairs[i];
      node.scale.set(1.3);
      void tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
      sfx.pop(5 + i);
      await tw.wait(0.55);
    }
    this.ctx.pet.cheer();
    sfx.tada();
    await this.ctx.say('tl.done.6');
    this.ctx.finish(tally(this.turn.tally));
  }

  // The ghost finger --------------------------------------------------------------------------------

  autotouch(): TouchIntent | null {
    const job = this.turn.job;
    if (this.finished || this.busy || !job || this.handle.dragging || this.handle.held) return null;
    if (this.ctx.tw.busy(this.card)) return null;
    // A real drop: the card is carried onto the earlier window that fits.
    const b = this.C.windows[fitting(job, this.turn.day)[0]];
    return {
      drag: { on: this.card },
      to: { on: this.board, x: b.x + b.w / 2, y: this.C.plot.y + this.C.plot.h / 2 },
    };
  }

  // Layout and drawing --------------------------------------------------------------------------------

  resize(v: View) {
    this.view = v;
    this.C = chartLayout(v);
    // A card in the hand, or held by a tap, is let go without answering: it is back at home.
    if (this.handle.dragging || this.handle.held) {
      const on = this.handle.enabled;
      this.handle.destroy();
      this.handle = this.grip();
      this.handle.enabled = on;
      this.card.scale.set(1);
      this.hover = null;
    }
    this.layoutAll();
  }

  private layoutAll() {
    const C = this.C;
    this.board.position.set(0, 0);
    this.picture.position.set(C.picture.x, C.picture.y);
    this.windows.forEach((n, i) => {
      const b = C.windows[i];
      n.position.set(b.x, b.y);
      n.hitArea = new Rectangle(0, 0, b.w, b.h);
    });
    this.title.position.set(C.plot.x + C.plot.w / 2, C.plot.y - 24);
    this.timeLabel.position.set(C.plot.x - CHART_AXIS / 2, C.iconY);
    this.heightLabel.position.set(C.plot.x - CHART_AXIS + 8, C.plot.y + C.plot.h / 2);
    this.handle.home = { x: C.card.x, y: C.card.y };
    if (!this.busy) {
      this.ctx.tw.kill(this.card);
      this.card.position.set(C.card.x, C.card.y);
    }
    this.placePairs();
    this.drawn = -1;
    this.drawChart();
  }

  private placePairs() {
    this.pairs.forEach((n, i) => {
      const b = this.C.done[i];
      n.position.set(b.x + b.w / 2, b.y + b.h * 0.28);
    });
  }

  /** The chart itself: the plot, its four windows with their short shaded times, the line, the scale and the finished row. */
  private drawChart() {
    const C = this.C;
    const p = C.plot;
    const day = this.turn.day;
    const g = this.chart.clear();
    g.roundRect(p.x - 6, p.y - 6, p.w + 12, p.h + CHART_FOOT + 12, 22)
      .fill(0xffffff)
      .stroke({ color: swatch.blue.line, width: 4 });
    C.windows.forEach((b, i) => {
      const on = this.look === i;
      g.roundRect(b.x, b.y, b.w, b.h, 18)
        .fill(on ? swatch.yellow.light : 0xf1f7fd)
        .stroke({ color: on ? swatch.orange.line : swatch.blue.light, width: on ? 6 : 3 });
      // The short time this window stands for.
      const x0 = chartX(C, stopT(i) - WINDOW);
      const x1 = chartX(C, stopT(i) + WINDOW);
      g.rect(x0, p.y + 8, x1 - x0, p.h - 8).fill({ color: swatch.blue.light, alpha: on ? 0.95 : 0.7 });
      skyIcon(g, i, b.x + b.w / 2, C.iconY);
    });
    // The water under the line, and the line.
    const N = 96;
    g.moveTo(p.x, p.y + p.h);
    for (let k = 0; k <= N; k++) g.lineTo(chartX(C, k / N), chartY(C, dayWater(day, k / N)));
    g.lineTo(p.x + p.w, p.y + p.h)
      .closePath()
      .fill({ color: SEA, alpha: 0.28 });
    g.moveTo(p.x, chartY(C, dayWater(day, 0)));
    for (let k = 1; k <= N; k++) g.lineTo(chartX(C, k / N), chartY(C, dayWater(day, k / N)));
    g.stroke({ color: SEA_DEEP, width: 8, cap: 'round', join: 'round' });
    g.moveTo(p.x, p.y + p.h)
      .lineTo(p.x + p.w, p.y + p.h)
      .stroke({ color: INK, width: 3, cap: 'round' });
    // The height scale: the sea low on the sand at the bottom, high on it at the top.
    const sx = p.x - 64;
    g.moveTo(p.x - 8, p.y + 8)
      .lineTo(p.x - 8, p.y + p.h)
      .stroke({ color: INK, width: 3, cap: 'round' });
    scaleShore(g, sx, chartY(C, 0.6) - 20, 48, 40, true);
    scaleShore(g, sx, chartY(C, 0.12) - 20, 48, 40, false);
    // The finished row's three places.
    for (const b of C.done)
      g.roundRect(b.x, b.y, b.w, b.h, 16)
        .fill({ color: 0xffffff, alpha: 0.7 })
        .stroke({ color: swatch.blue.light, width: 3 });
    this.drawMarks();
    this.drawGlow();
  }

  /** What moves on the chart: the current job's mark at its height, and the spot on the line the shore picture shows. */
  private drawMarks() {
    const C = this.C;
    const p = C.plot;
    const g = this.marks.clear();
    const job = this.finished ? undefined : this.shownJob;
    if (job) {
      const m = JOB_MARK[job];
      const y = chartY(C, m.h);
      for (let x = p.x + 4; x < p.x + p.w - 10; x += 26)
        g.moveTo(x, y)
          .lineTo(x + 14, y)
          .stroke({ color: swatch.orange.line, width: 5, cap: 'round' });
      // Small arrows on the side of the mark the line has to keep to.
      const d = m.side === 'below' ? 1 : -1;
      for (let i = 0; i < STOPS; i++) {
        const x = chartX(C, i / STOPS) + 14;
        g.poly([x - 9, y + 8 * d, x + 9, y + 8 * d, x, y + 22 * d]).fill(swatch.orange.fill);
      }
      const bx = p.x + p.w - 34;
      g.circle(bx, y, 30).fill(0xffffff).stroke({ color: swatch.orange.line, width: 4 });
      jobArt(g, job, bx, y - 2, 0.42);
    }
    const x = chartX(C, this.now.t);
    const y = chartY(C, dayWater(this.turn.day, this.now.t));
    g.moveTo(x, y)
      .lineTo(x, p.y + p.h)
      .stroke({ color: swatch.orange.line, width: 3, alpha: 0.7 });
    g.circle(x, y, 13).fill(0xffffff).stroke({ color: swatch.orange.line, width: 6 });
  }

  private drawGlow() {
    const g = this.glow.clear();
    const job = this.turn.job;
    if (this.finished || !job || !this.turn.glow) return;
    for (const i of fitting(job, this.turn.day)) {
      const b = this.C.windows[i];
      g.roundRect(b.x - 6, b.y - 6, b.w + 12, b.h + 12, 22).stroke({ color: swatch.orange.line, width: 10 });
    }
  }

  update(dt: number) {
    this.clock += dt;
    this.glow.alpha = 0.65 + 0.35 * Math.sin(this.clock * 4);
    if (this.now.t === this.drawn) return;
    this.drawn = this.now.t;
    const b = this.C.picture;
    dayShore(
      this.picture.clear(),
      b.w,
      b.h,
      dayWater(this.turn.day, this.now.t),
      this.now.t,
      POOL_RIM,
      POOL_TOP,
      { boat: BOAT_FLOAT, shelf: SHELF },
    );
    this.drawMarks();
  }

  destroy() {
    this.handle.destroy();
  }
}
