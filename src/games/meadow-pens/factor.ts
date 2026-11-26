import { Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { Backdrop } from '../../art/scenery';
import { ink, swatch } from '../../art/palette';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { label } from '../../ui/text';
import type { Game, GameContext, TouchIntent } from '../types';
import {
  baleCell,
  blanketCell,
  bubbleFrame,
  Card,
  drawGate,
  heapPicture,
  meadowCell,
  rungCell,
  turfCell,
} from './art';
import {
  askVars,
  cap,
  columnCells,
  correctCard,
  factorTasks,
  running,
  word,
  type FactorTask,
  type LoftTask,
  type MissingTask,
} from './factor-logic';
import { cellRect, centre, CELLS, GAP, meadowLayout, PenTally, type Cell, type MeadowLayout } from './logic';

/**
 * Levels 6 and 7: a hidden number found by multiplying. Level 6 lifts a blanket column by column over a strip of
 * grass whose rows she can count; level 7 stacks identical trays of bales into a loft. Fixed fields and cards like
 * levels 4 and 5: only a wrong card is a miss, counting and replays are free, no painting and no bell.
 */
export class FactorMeadow implements Game {
  readonly tasks: FactorTask[];
  readonly tally = new PenTally();
  index = 0;
  busy = true;
  finished = false;
  cards: Card[] = [];
  private alive = true;
  private epoch = 0;
  private clock = 0;
  private lay: MeadowLayout;
  private view: View;
  private gateOpen = 0;
  private botStep = 0;
  private finishSent = false;
  private unasked: (() => unknown) | null = null;
  /** Level 6: blanket columns lifted so far, and the running count shown at each. */
  private lifted = new Set<Cell>();
  private counts: { cell: Cell; n: number }[] = [];
  /** Level 7: trays stacked so far, the layer light and the running total. */
  private stacked = 1;
  private litLayer = -1;
  private litBales = 0;
  private stackTotal: number | null = null;
  private readonly backdrop: Backdrop;
  private readonly drawing = new Graphics();
  private readonly decorations = new Container();
  private readonly countTargets = new Container();
  private readonly bubble = new Container();
  private readonly gate = new Graphics();
  private readonly lane = new Graphics();
  private readonly friend: Critter;
  private readonly companion;
  /** The free targets: level 6 the blanket, level 7 the tray and each layer mark. */
  targetsOf: Container[] = [];
  constructor(
    private readonly ctx: GameContext,
    authored = true,
  ) {
    this.view = ctx.view;
    this.lay = meadowLayout(ctx.view, ctx.level)!;
    this.tasks = factorTasks(ctx.level === 7 ? 7 : 6, ctx.rng, ctx.demo || authored);
    this.backdrop = ctx.track(
      new Backdrop(
        {
          sky: [0xc4ecff, 0xfff6e0],
          hills: [0xf5d0e6, 0xbfe39a, 0x9ad77e],
          horizon: 0.22,
          clouds: 3,
          sun: true,
          seed: 131,
        },
        ctx.view,
      ),
    );
    this.friend = ctx.track(new Critter(CRITTERS.bunny));
    this.friend.scale.set(0.42);
    this.companion = ctx.track(ctx.companion());
    this.companion.scale.set(0.42);
    this.companion.eventMode = 'none';
    for (const n of [this.drawing, this.decorations, this.gate, this.lane]) n.eventMode = 'none';
    onTap(
      this.friend,
      () => {
        if (!this.busy) {
          this.friend.poke();
          void this.replayQuestion();
        }
      },
      { cooldown: 600 },
    );
    this.friend.hitArea = new Rectangle(-150, -320, 300, 330);
    ctx.stage.addChild(
      this.backdrop,
      this.drawing,
      this.decorations,
      this.gate,
      this.countTargets,
      this.lane,
      this.bubble,
      this.friend,
      this.companion,
    );
  }
  get task() {
    return this.tasks[this.index];
  }
  start() {
    this.build();
    void this.intro();
  }
  private async intro() {
    await (this.ctx.level === 7
      ? this.ctx.instruct('meadow.instruct.7', { unit: 'trays' })
      : this.ctx.instruct('meadow.instruct.6', { unit: 'rows' }));
    if (!this.alive) return;
    await this.ask();
    if (this.alive) this.busy = false;
  }
  destroy() {
    this.alive = false;
    this.epoch++;
  }
  resize(view: View) {
    this.view = view;
    this.backdrop.resize(view);
    this.lay = meadowLayout(view, this.ctx.level)!;
    this.position();
    this.redraw();
  }
  update(dt: number) {
    this.clock += dt;
    for (const card of this.cards)
      card.glow(this.tally.glowing && card.value === correctCard(this.task), this.clock);
  }
  private ask() {
    const t = this.task;
    return this.ctx.instruct(t.kind === 'missing' ? 'meadow.ask6' : 'meadow.ask7', askVars(t));
  }
  private askAfter(prev: Promise<unknown>) {
    this.unasked = () => this.ask();
    const at = this.index;
    void prev.then(() => {
      if (this.index === at && this.alive) this.askNow();
    });
  }
  private askNow() {
    const say = this.unasked;
    if (!say || this.finished) return false;
    this.unasked = null;
    void say();
    return true;
  }
  /** The guide was tapped while the ask waits: say this question's, not the last one's. */
  sayWaitingAsk() {
    return this.askNow();
  }
  private takeOver() {
    this.epoch++;
    this.unasked = null;
    this.litLayer = -1;
    this.litBales = 0;
  }
  private valid(token: number) {
    return this.alive && this.epoch === token;
  }
  private clear(c: Container) {
    c.removeChildren().forEach((n) => n.destroy({ children: true }));
  }

  // ----- building and drawing -----

  private resetReveal() {
    this.lifted.clear();
    this.counts = [];
    this.stacked = 1;
    this.stackTotal = null;
    this.litLayer = -1;
    this.litBales = 0;
  }
  private build() {
    this.clear(this.decorations);
    this.clear(this.countTargets);
    this.clear(this.bubble);
    this.cards.forEach((c) => c.destroy({ children: true }));
    this.cards = [];
    this.targetsOf = [];
    this.resetReveal();
    // The first question shows the bot's free touches; later ones go straight to the card.
    this.botStep = this.index === 0 ? 0 : 3;
    const t = this.task;
    this.bubble.addChild(
      bubbleFrame(this.lay.bubble.w, this.lay.bubble.h),
      t.kind === 'missing'
        ? heapPicture(t.total, 6, false)
        : heapPicture(t.floor.length, t.w, true, t.layers),
    );
    onTap(
      this.bubble,
      () => {
        if (!this.busy) {
          this.bubble.scale.set(0.96);
          void this.ctx.tw.to(this.bubble.scale, { x: 1, y: 1 }, { duration: 0.15 });
          void this.replayQuestion();
        }
      },
      { cooldown: 600 },
    );
    const free = (cells: () => Cell[], act: () => void) => {
      const target = new Container();
      onTap(target, () => {
        if (!this.busy) act();
      });
      (target as Container & { cells: () => Cell[] }).cells = cells;
      this.targetsOf.push(target);
      this.countTargets.addChild(target);
    };
    if (t.kind === 'missing')
      free(
        () => t.blanket,
        () => void this.touchBlanket(),
      );
    else {
      free(
        () => t.floor,
        () => void this.countTray(),
      );
      t.gauge.forEach((c, i) =>
        free(
          () => [c],
          () => void this.lightLayer(i),
        ),
      );
    }
    t.cards.forEach((value) => {
      const card = new Card(value);
      card.hitArea = new Rectangle(-65, -65, 130, 130);
      onTap(card, () => void this.pickCard(card), { cooldown: 350 });
      this.cards.push(card);
      this.ctx.stage.addChild(card);
    });
    this.position();
    this.redraw();
  }
  private position() {
    const l = this.lay;
    this.friend.position.set(l.friend.x + l.friend.w / 2, l.friend.y + l.friend.h - 6);
    this.companion.position.set(l.companion.x, l.companion.y);
    const b = centre(l.bubble);
    this.bubble.position.set(b.x, b.y);
    this.bubble.hitArea = new Rectangle(-l.bubble.w / 2, -l.bubble.h / 2, l.bubble.w, l.bubble.h);
    this.cards.forEach((card, i) => {
      const p = centre(l.cards![i]);
      card.position.set(p.x, p.y);
    });
    for (const target of this.targetsOf) {
      const rects = (target as Container & { cells: () => Cell[] }).cells().map((c) => cellRect(l, c));
      target.hitArea = {
        contains: (x: number, y: number) =>
          rects.some((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h),
      };
    }
    const first = l.cards![0],
      last = l.cards![2];
    this.lane
      .clear()
      .roundRect(first.x - 14, first.y - 14, last.x + last.w - first.x + 28, first.h + 28, 28)
      .fill({ color: swatch.blue.fill, alpha: 0.15 });
  }
  private redraw() {
    const g = this.drawing.clear(),
      t = this.task,
      l = this.lay;
    this.clear(this.decorations);
    const used = new Set<Cell>(t.kind === 'missing' ? [...t.grass, ...t.blanket] : [...t.floor, ...t.gauge]);
    for (let c = 0; c < CELLS; c++) if (!used.has(c)) meadowCell(g, cellRect(l, c));
    if (t.kind === 'missing') this.drawStrip(g, t);
    else this.drawLoft(g, t);
    drawGate(this.gate, l.gate, this.gateOpen);
  }
  private drawStrip(g: Graphics, t: MissingTask) {
    const l = this.lay;
    for (const c of t.grass) turfCell(g, cellRect(l, c), c);
    for (const c of t.blanket) {
      const r = cellRect(l, c);
      if (this.lifted.has(c)) turfCell(g, r, c);
      else blanketCell(g, r, GAP);
    }
    for (const { cell, n } of this.counts) {
      const p = centre(cellRect(l, cell));
      const text = label(String(n), 44, ink);
      text.position.set(p.x, p.y);
      this.decorations.addChild(text);
    }
  }
  private drawLoft(g: Graphics, t: LoftTask) {
    const l = this.lay;
    t.gauge.forEach((c, i) => {
      meadowCell(g, cellRect(l, c));
      rungCell(g, cellRect(l, c), this.litLayer === i);
    });
    // Each tray is the whole floor again, drawn as a sheet a little higher: the pile's edges show the layers.
    for (let layer = 0; layer < this.stacked; layer++)
      t.floor.forEach((c, i) => {
        const r = cellRect(l, c);
        baleCell(g, { ...r, y: r.y - layer * 16 });
        if (layer === 0 && i < this.litBales)
          g.roundRect(r.x + 4, r.y + 4, r.w - 8, r.h - 8, 10).fill({ color: 0xffffff, alpha: 0.6 });
      });
    if (this.stackTotal !== null) {
      const top = centre(cellRect(l, t.floor[0]));
      const text = label(String(this.stackTotal), 44, ink);
      text.position.set(top.x, top.y - (this.stacked - 1) * 16);
      this.decorations.addChild(text);
    }
  }

  // ----- free touches -----

  private async touchBlanket() {
    this.takeOver();
    sfx.pop(5);
    await this.ctx.say('meadow.blanket6', { thing: 'grass' });
  }
  private async countTray() {
    this.takeOver();
    const token = this.epoch,
      t = this.task as LoftTask;
    for (let i = 1; i <= t.floor.length; i++) {
      this.litBales = i;
      this.redraw();
      sfx.bell(5);
      await this.ctx.tw.wait(0.06);
      if (!this.valid(token)) return;
      await this.ctx.say('count', { n: i });
      if (!this.valid(token)) return;
    }
    await this.ctx.say('meadow.bales7', { n: t.floor.length });
    if (!this.valid(token)) return;
    this.litBales = 0;
    this.redraw();
  }
  private async lightLayer(i: number) {
    this.takeOver();
    const token = this.epoch;
    this.litLayer = i;
    this.redraw();
    sfx.pop(5);
    await this.ctx.say('count', { n: i + 1 });
    if (this.valid(token)) {
      this.litLayer = -1;
      this.redraw();
    }
  }
  private async replayQuestion() {
    this.takeOver();
    this.busy = true;
    const token = this.epoch;
    await this.ask();
    if (this.valid(token)) this.busy = false;
  }

  // ----- explanations -----

  /** Level 6: lift the blanket one column at a time, each column adding the rows to a running count. */
  private async liftTo(upTo: number, token: number) {
    const t = this.task as MissingTask;
    for (let x = 0; x < upTo; x++) {
      const col = columnCells(t, x);
      if (x > 0) col.forEach((c) => this.lifted.add(c));
      this.counts.push({ cell: col[0], n: t.rows * (x + 1) });
      this.redraw();
      sfx.bell(5 + (x % 4));
      await this.ctx.tw.wait(0.35);
      if (!this.valid(token)) return false;
    }
    return true;
  }
  private async explainMissing(card: number, token: number) {
    const t = this.task as MissingTask;
    const len = t.length;
    const vars = { rows: cap(word(t.rows)), total: word(t.total), cols: cap(word(len)) };
    const lift = () =>
      this.ctx.say('meadow.lift6', {
        run: running(t.rows, t.total),
        cols: cap(word(len)),
      });
    if (card < len) {
      if (!(await this.liftTo(card, token))) return;
      await this.ctx.say('meadow.try6.short', {
        ...vars,
        cols: word(card),
        sum: word(t.rows * card),
      });
      if (!this.valid(token)) return;
      if (!(await this.liftTo(len, token))) return;
      this.counts = [];
      await lift();
    } else if (card > len) {
      if (!(await this.liftTo(len, token))) return;
      await this.ctx.say('meadow.try6.many', vars);
    } else {
      if (!(await this.liftTo(len, token))) return;
      await lift();
    }
  }
  /** Level 7: stack the trays one at a time; the count goes up by the whole floor each time. */
  private async explainLoft(token: number) {
    const t = this.task as LoftTask;
    this.stacked = 1;
    for (let layer = 1; layer <= t.layers; layer++) {
      this.stacked = layer;
      this.stackTotal = t.floor.length * layer;
      this.redraw();
      sfx.bell(5 + layer);
      await this.ctx.tw.wait(0.45);
      if (!this.valid(token)) return;
    }
    await this.ctx.say('meadow.stack7', { run: running(t.floor.length, t.floor.length * t.layers, true) });
  }
  private async explanation(card: number) {
    const token = this.epoch;
    if (this.task.kind === 'missing') await this.explainMissing(card, token);
    else await this.explainLoft(token);
  }
  /** A wrong card's picture goes away again so the next try has to count. */
  private reset() {
    this.resetReveal();
    this.redraw();
  }
  private showAnswer() {
    const t = this.task;
    if (t.kind === 'missing') {
      this.lifted.clear();
      for (let x = 1; x < t.length; x++) columnCells(t, x).forEach((c) => this.lifted.add(c));
    } else {
      this.stacked = t.layers;
      this.stackTotal = t.floor.length * t.layers;
    }
    this.redraw();
  }

  // ----- judging -----

  private async pickCard(card: Card) {
    if (this.busy || this.finished || !this.alive) return;
    this.takeOver();
    this.busy = true;
    const token = this.epoch;
    card.scale.set(0.94);
    void this.ctx.tw.to(card.scale, { x: 1, y: 1 }, { duration: 0.15 });
    const supported = this.tally.glowing;
    const result = this.tally.card(supported || card.value === correctCard(this.task));
    if (result !== 'ok') {
      sfx.boing();
      this.companion.wiggle();
    } else sfx.bell(8);
    if (result !== 'ok' || supported) {
      await this.explanation(supported ? correctCard(this.task) : card.value);
      if (!this.valid(token)) return;
    }
    if (result !== 'ok') {
      this.reset();
      if (result === 'glow') {
        await this.ctx.say('meadow.hint-fixed');
        if (!this.valid(token)) return;
      }
      this.busy = false;
      return;
    }
    this.showAnswer();
    await this.complete(token);
  }
  private async complete(token: number) {
    this.gateOpen = 1;
    this.redraw();
    this.friend.cheer();
    this.companion.cheer();
    this.ctx.pet.cheer();
    const t = this.task;
    const spot = centre(cellRect(this.lay, (t.kind === 'missing' ? t.grass : t.floor)[0]));
    await this.ctx.tw.to(this.friend, { x: spot.x, y: spot.y + 40 }, { duration: 0.4 });
    if (!this.valid(token)) return;
    const thanks = this.ctx.say('meadow.in');
    const last = this.index === this.tasks.length - 1;
    if (last) {
      await thanks;
      if (!this.valid(token)) return;
    }
    await this.ctx.tw.wait(0.4);
    if (!this.valid(token)) return;
    if (last) return this.finale();
    this.index++;
    this.epoch++;
    this.tally.next();
    this.gateOpen = 0;
    this.build();
    this.busy = false;
    this.askAfter(thanks);
  }
  private async finale() {
    this.finished = true;
    this.busy = true;
    const token = this.epoch;
    this.ctx.particles.burst(this.view.w / 2, this.view.h * 0.35, {
      kind: 'star',
      colors: [0xffd54a, 0xffffff],
      count: 32,
      speed: [100, 300],
      gravity: 100,
      life: [0.5, 1],
    });
    for (const card of this.cards) onTap(card, () => this.sendFinish());
    sfx.tada();
    await this.ctx.say('meadow.fixed-all');
    if (!this.valid(token)) return;
    await this.ctx.tw.wait(0.5);
    if (this.valid(token)) this.sendFinish();
  }
  private sendFinish() {
    if (this.alive && !this.finishSent) {
      this.finishSent = true;
      this.ctx.finish({ misses: this.tally.misses, hints: this.tally.hints });
    }
  }
  askForHint() {
    if (this.busy || this.finished || !this.alive) return;
    this.tally.glow();
    this.takeOver();
    this.busy = true;
    const token = this.epoch;
    void this.explanation(correctCard(this.task)).then(async () => {
      if (!this.valid(token)) return;
      this.reset();
      await this.ctx.say('meadow.hint-fixed');
      if (this.valid(token)) this.busy = false;
    });
  }
  restart() {
    if (this.busy || this.finished || !this.alive) return;
    this.takeOver();
    this.reset();
    void this.replayQuestion();
  }
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.unasked) return null;
    const free =
      this.task.kind === 'missing'
        ? [this.bubble, this.targetsOf[0]]
        : [this.targetsOf[0], this.targetsOf[1]];
    if (this.botStep < 2) {
      const on = free[this.botStep++];
      if (on === this.bubble) return { tap: { on }, pause: 0.3 };
      const rect = cellRect(this.lay, (on as Container & { cells: () => Cell[] }).cells()[0]);
      const p = centre(rect);
      return { tap: { on, x: p.x, y: p.y }, pause: 0.3 };
    }
    const card = this.cards.find((c) => c.value === correctCard(this.task));
    return card ? { tap: { on: card }, pause: 0.4 } : null;
  }
}
