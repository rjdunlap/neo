import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, grass, ink, swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { sfx } from '../../audio/sfx';
import { entryId } from '../../content/journal';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { label } from '../../ui/text';
import type { Game, GameContext, TouchIntent } from '../types';
import { DIE_COLORS, diceTray, die, drawDie, drawSumBars, sumCard, sumColor, sumSquare } from './art';
import {
  BAR_LABEL,
  SUMS,
  SUM_CARD,
  TRAY_H,
  TRAY_W,
  barsBox,
  diceLayout,
  gridRows,
  gridSide,
  moreWays,
  mostCards,
  pairCards,
  planFor,
  roll,
  rollTally,
  rollsMislead,
  sumOf,
  ways,
  waysTally,
  type Bars,
  type DiceLayout,
  type Plan,
  type Roll,
} from './logic';

/*
 * Spinner Fair level 7, Two dice: twelve rolls of two dice, each sum dropping a block on one of eleven bars; then the grid
 * of every way two dice can land builds itself a row at a time, with a second set of bars counting the squares for each
 * sum. Two questions the grid answers: which sum is most likely (seven), and which of two sums comes up more. A wrong card
 * is the only miss. Every roll is an honest seeded draw and is never judged; the journal entry files when the grid has
 * been built, whatever the dice rolled.
 */

type Phase = 'roll' | 'grid' | 'most' | 'pair';

/** Seconds the dice tumble for, and between one grid square and the next (a row takes six of these). */
const TUMBLE = 0.8;
const SQUARE = 0.2;
const DIE = 104;

export class DiceGame implements Game {
  readonly plan: Plan;
  readonly hintLabel = 'Show me';
  phase: Phase = 'roll';
  /** Every roll so far, in order. */
  rolls: Roll[] = [];
  /** Grid squares showing (0–36, row by row). */
  squares = 0;
  /** The grid has been built: the round's one discovery. */
  gridDone = false;
  readonly mostSums: number[];
  readonly pairSums: number[];
  misses = 0;
  hints = 0;
  /** Misses on the question in play; the second lights the glow. */
  askMisses = 0;
  glowing = false;
  hinted = false;
  /** The dice are tumbling. */
  rolling = false;
  busy = false;
  /** The pet is saying what the grid showed; the ghost finger waits for it, she need not. */
  talking = false;
  finished = false;
  readonly tray = new Container();
  cards: Container[] = [];
  private readonly reduce =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  private L: DiceLayout;
  private clock = 0;
  private tumble = 0;
  private talk = 0;
  private readonly dice: [Graphics, Graphics];
  private readonly backdrop: Backdrop;
  private readonly panel = new Graphics();
  private readonly rollBars = new Graphics();
  private readonly wayBars = new Graphics();
  private readonly labels = new Container();
  private readonly grid = new Container();
  private readonly cardLayer = new Container();
  private readonly glowRing = new Graphics();
  private cells: Container[] = [];

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    // Both questions' cards are drawn before any roll, so the dice never decide what is asked.
    this.mostSums = mostCards(ctx.rng);
    this.pairSums = pairCards(ctx.rng);
    this.L = diceLayout(ctx.view);
    this.backdrop = new Backdrop(
      {
        sky: [cream, swatch.blue.light],
        hills: [grass, swatch.green.light],
        horizon: 0.36,
        clouds: 2,
        sun: true,
        seed: 87,
      },
      ctx.view,
    );
    for (const g of [this.panel, this.rollBars, this.wayBars, this.labels, this.glowRing])
      g.eventMode = 'none';
    this.dice = [die(1, DIE, DIE_COLORS[0]), die(1, DIE, DIE_COLORS[1])];
    this.dice[0].position.set(-72, 0);
    this.dice[1].position.set(72, 0);
    this.tray.addChild(diceTray(TRAY_W, TRAY_H), ...this.dice);
    this.tray.hitArea = new Rectangle(-TRAY_W / 2, -TRAY_H / 2, TRAY_W, TRAY_H);
    onTap(this.tray, () => this.tapTray());
    // Taps on the grid bounce: it builds itself and answers nothing.
    onTap(this.grid, () => this.tapGrid());
    this.grid.visible = false;
    ctx.stage.addChild(
      this.backdrop,
      this.panel,
      this.rollBars,
      this.wayBars,
      this.labels,
      this.grid,
      this.tray,
      this.cardLayer,
      this.glowRing,
    );
    this.resize(ctx.view);
  }

  /** The sum cards of the question in play (none before the grid is built). */
  get cardSums(): number[] {
    return this.phase === 'most' ? this.mostSums : this.phase === 'pair' ? this.pairSums : [];
  }
  /** The right card: the one whose sum has the most squares. */
  get right(): number | null {
    return this.cardSums.length ? moreWays(this.cardSums) : null;
  }
  /** What a scripted play reads. */
  get state() {
    return {
      level: this.plan.level,
      phase: this.phase,
      rolls: this.rolls.map((r) => [...r]),
      tally: rollTally(this.rolls),
      squares: this.squares,
      gridDone: this.gridDone,
      cards: this.cardSums.slice(),
      right: this.right,
      misses: this.misses,
      hints: this.hints,
      glowing: this.glowing,
      rolling: this.rolling,
      talking: this.talking,
      busy: this.busy,
      finished: this.finished,
    };
  }

  start() {
    void this.instruct();
  }

  private instruct() {
    if (this.phase === 'most') return this.ctx.instruct('sf.most-q');
    if (this.phase === 'pair')
      return this.ctx.instruct('sf.pair-q', { a: this.pairSums[0], b: this.pairSums[1] });
    return this.ctx.instruct(this.phase === 'grid' ? 'sf.grid-intro' : 'sf.instruct.7');
  }

  destroy() {
    this.finished = true;
    this.killTweens();
  }

  private killTweens() {
    this.ctx.tw.kill(this.tray);
    this.ctx.tw.kill(this.grid);
    for (const c of [...this.cards, ...this.cells]) {
      this.ctx.tw.kill(c);
      this.ctx.tw.kill(c.scale);
    }
  }

  // ---- the rolls ----

  private tapTray() {
    // The tray rattles on every touch, whether or not a roll starts; once it is fading into the grid it takes none.
    if (this.finished || this.tray.eventMode === 'none') return;
    this.ctx.tw.kill(this.tray);
    this.tray.rotation = 0.05;
    void this.ctx.tw.to(this.tray, { rotation: 0 }, { duration: 0.3, ease: ease.outElastic });
    if (this.busy || this.rolling || this.phase !== 'roll') return;
    void this.doRoll();
  }

  /** One roll: drawn first, honestly, from the game's seeded RNG; the dice tumble and then show it. Never judged. */
  private async doRoll() {
    this.rolling = true;
    const r = roll(this.ctx.rng);
    sfx.shake();
    this.tumble = this.reduce ? 0 : TUMBLE;
    await this.ctx.tw.wait(this.reduce ? 0.25 : TUMBLE);
    if (this.finished) return;
    this.tumble = 0;
    this.showDice(r);
    this.rolls.push(r);
    this.rolling = false;
    const sum = sumOf(r);
    sfx.knock();
    sfx.pop(sum);
    this.drawBars();
    const i = SUMS.indexOf(sum);
    const b = this.L.rolls;
    this.ctx.particles.burst(
      b.x + i * b.pitch + b.w / 2,
      b.base - rollTally(this.rolls)[i] * this.blockH(b, rollTally(this.rolls)),
      {
        kind: 'dot',
        colors: [swatch[sumColor(sum)].fill, 0xffffff],
        count: 8,
        speed: [60, 150],
        gravity: 300,
        life: [0.25, 0.5],
      },
    );
    void this.ctx.say('sf.dice-sum', { n: sum });
    if (this.rolls.length >= this.plan.spins) void this.buildGrid();
  }

  private showDice(r: Roll) {
    this.dice.forEach((d, i) => {
      drawDie(d, r[i], DIE, DIE_COLORS[i]);
      d.rotation = 0;
      d.y = 0;
    });
  }

  // ---- the grid ----

  /** The grid of every way two dice can land builds itself, a row at a time; the ways bars count its squares. */
  private async buildGrid() {
    this.busy = true;
    await this.ctx.tw.wait(0.7);
    if (this.finished) return;
    this.phase = 'grid';
    await this.instruct();
    if (this.finished) return;
    sfx.whoosh();
    this.tray.eventMode = 'none';
    await this.ctx.tw.to(this.tray, { alpha: 0 }, { duration: 0.3, ease: ease.outQuad });
    if (this.finished) return;
    this.tray.visible = false;
    this.grid.visible = true;
    this.resize(this.ctx.view);
    for (let row = 0; row < 6; row++) {
      sfx.pluck(2 + row * 2);
      const line =
        row === 0
          ? this.ctx.say('sf.grid-first')
          : this.ctx.say('sf.grid-row', { die: row + 1, a: row + 2, b: row + 7 });
      for (let col = 0; col < 6; col++) {
        const cell = this.cells[this.squares];
        this.squares++;
        cell.visible = true;
        if (!this.reduce) {
          cell.scale.set(0.4);
          void this.ctx.tw.to(cell.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack });
        }
        sfx.tick();
        this.drawBars();
        await this.ctx.tw.wait(SQUARE);
        if (this.finished) return;
      }
      await line;
      if (this.finished) return;
    }
    // She has watched the picture being built: that, and never a roll, is what the journal files.
    this.gridDone = true;
    sfx.sparkle();
    this.phase = 'most';
    this.showCards();
    this.busy = false;
    const lines = [() => this.instruct()];
    if (rollsMislead(this.rolls)) lines.unshift(() => this.ctx.say('sf.few-rolls'));
    void this.chain(...lines);
  }

  private tapGrid() {
    if (this.finished) return;
    sfx.pop(4);
    this.ctx.tw.kill(this.grid);
    const y = this.L.grid.y;
    this.grid.y = y - 6;
    void this.ctx.tw.to(this.grid, { y }, { duration: 0.3, ease: ease.outElastic });
  }

  // ---- the questions ----

  private showCards() {
    for (const c of this.cards) {
      this.ctx.tw.kill(c);
      this.ctx.tw.kill(c.scale);
      c.destroy({ children: true });
    }
    const at = this.phase === 'most' ? this.L.most : this.L.pair;
    this.cards = this.cardSums.map((sum, i) => {
      const c = sumCard(sum, SUM_CARD);
      c.hitArea = new Rectangle(-SUM_CARD / 2, -SUM_CARD / 2, SUM_CARD, SUM_CARD);
      c.position.set(at[i].x, at[i].y);
      c.scale.set(0.6);
      void this.ctx.tw.to(c.scale, { x: 1, y: 1 }, { duration: 0.3, delay: i * 0.08, ease: ease.outBack });
      onTap(c, () => this.tapCard(i));
      this.cardLayer.addChild(c);
      return c;
    });
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
    const card = this.cards[i];
    this.ctx.tw.kill(card.scale);
    card.scale.set(1.08);
    void this.ctx.tw.to(card.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack });
    if (this.busy || this.right === null) return;
    if (this.cardSums[i] === this.right) {
      void this.rightCard(i);
      return;
    }
    this.misses++;
    this.askMisses++;
    sfx.boing();
    this.ctx.tw.kill(card);
    const x = (this.phase === 'most' ? this.L.most : this.L.pair)[i].x;
    void this.ctx.tw
      .to(card, { x: x + 10 }, { duration: 0.06 })
      .then(() => this.ctx.tw.to(card, { x }, { duration: 0.3, ease: ease.outElastic }));
    void this.hearWrong();
  }

  private async hearWrong() {
    const phase = this.phase;
    await this.say('sf.count-squares');
    if (this.finished || this.busy || phase !== this.phase) return;
    if (this.askMisses >= 2 && !this.glowing) {
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

  /** Asked-for help: the squares of each card's sum and the card with the most glow (one hint per question); asked again, the ghost taps that card. During the rolls and the grid it repeats the ask. */
  askForHint() {
    if (this.busy || this.finished || this.rolling) return;
    if (this.right === null) {
      void this.instruct();
      return;
    }
    if (!this.glowing) {
      this.lightHint();
      void this.say('sf.help');
      return;
    }
    this.tapCard(this.cardSums.indexOf(this.right));
  }

  private async rightCard(i: number) {
    this.busy = true;
    this.glowing = false;
    sfx.sparkle();
    const at = (this.phase === 'most' ? this.L.most : this.L.pair)[i];
    this.ctx.particles.burst(at.x, at.y - SUM_CARD / 2, {
      kind: 'star',
      colors: [swatch.yellow.fill, 0xffffff],
      count: 10,
      speed: [60, 150],
      gravity: 200,
      life: [0.3, 0.6],
    });
    this.cards.forEach((c, j) => (c.alpha = j === i ? 1 : 0.35));
    if (this.phase === 'most') {
      await this.say('sf.most-yes');
      if (this.finished) return;
      this.phase = 'pair';
      this.askMisses = 0;
      this.hinted = false;
      this.showCards();
      sfx.whoosh();
      this.busy = false;
      void this.instruct();
      return;
    }
    const right = this.cardSums[i],
      other = this.cardSums[1 - i];
    this.finished = true;
    this.talk++;
    this.talking = false;
    sfx.bell(7, 0.35);
    sfx.bell(11, 0.3);
    await this.ctx.say('sf.pair-yes', { a: right, n: ways(right), b: other, m: ways(other) });
    await this.ctx.say('sf.done-dice');
    await this.ctx.tw.wait(0.5);
    this.ctx.finish({
      misses: this.misses,
      hints: this.hints,
      discoveries: this.gridDone ? [entryId('spinner-fair', 'two-dice')] : [],
    });
  }

  // ---- drawing ----

  /** A block's height on a bar row: the row's height shared by its tallest bar (never fewer than six blocks' worth). */
  private blockH(b: Bars, counts: readonly number[]) {
    return Math.min(44, b.h / Math.max(6, ...counts));
  }

  private drawBars() {
    const rolls = rollTally(this.rolls);
    drawSumBars(this.rollBars, this.L.rolls, rolls, this.blockH(this.L.rolls, rolls));
    const shown = waysTally(this.squares);
    this.wayBars.visible = this.grid.visible;
    drawSumBars(this.wayBars, this.L.ways, shown, this.blockH(this.L.ways, waysTally()));
  }

  /** The grid's header dice and its 36 squares at the layout's size; squares not yet built stay hidden. */
  private buildGridArt() {
    for (const c of this.cells) {
      this.ctx.tw.kill(c);
      this.ctx.tw.kill(c.scale);
    }
    this.grid.removeChildren().forEach((c) => c.destroy({ children: true }));
    const { head, cell } = this.L.grid;
    const side = gridSide(this.L.grid);
    this.grid.hitArea = new Rectangle(0, 0, side, side);
    for (let i = 0; i < 6; i++) {
      const a = die(i + 1, head - 8, DIE_COLORS[0]);
      a.position.set(head / 2, head + (i + 0.5) * cell);
      const b = die(i + 1, head - 8, DIE_COLORS[1]);
      b.position.set(head + (i + 0.5) * cell, head / 2);
      this.grid.addChild(a, b);
    }
    this.cells = gridRows().flatMap((row, r) =>
      row.map((sum, c) => {
        const sq = sumSquare(sum, cell);
        sq.position.set(head + (c + 0.5) * cell, head + (r + 0.5) * cell);
        sq.visible = r * 6 + c < this.squares;
        this.grid.addChild(sq);
        return sq;
      }),
    );
  }

  /** The numerals under both bar rows. */
  private buildLabels() {
    this.labels.removeChildren().forEach((c) => c.destroy());
    const rows = this.grid.visible ? [this.L.rolls, this.L.ways] : [this.L.rolls];
    for (const b of rows)
      SUMS.forEach((sum, i) => {
        const t = label(String(sum), Math.min(26, b.pitch * 0.66));
        t.position.set(b.x + i * b.pitch + b.w / 2, b.base + BAR_LABEL / 2);
        this.labels.addChild(t);
      });
  }

  // ---- shell hooks ----

  resize(view: View) {
    const L = (this.L = diceLayout(view));
    this.backdrop.resize(view);
    // Only the rattle is killed: the tray's fade into the grid is awaited and must finish.
    if (this.phase === 'roll') this.ctx.tw.kill(this.tray);
    this.tray.rotation = 0;
    this.tray.position.set(L.tray.x, L.tray.y);
    this.ctx.tw.kill(this.grid);
    this.grid.position.set(L.grid.x, L.grid.y);
    this.buildGridArt();
    this.buildLabels();
    this.drawBars();
    const at = this.phase === 'most' ? L.most : L.pair;
    this.cards.forEach((c, i) => {
      this.ctx.tw.kill(c);
      c.position.set(at[i].x, at[i].y);
    });
    this.panel.clear();
    const plates = [barsBox(L.rolls)];
    if (this.grid.visible) {
      const side = gridSide(L.grid);
      plates.push(barsBox(L.ways), { x: L.grid.x + side / 2, y: L.grid.y + side / 2, w: side, h: side });
    }
    for (const p of plates)
      this.panel
        .roundRect(p.x - p.w / 2 - 8, p.y - p.h / 2 - 6, p.w + 16, p.h + 10, 16)
        .fill({ color: 0xffffff, alpha: 0.75 });
  }

  update(dt: number) {
    this.clock += dt;
    if (this.tumble > 0) {
      // The tumble is a show: its flickering faces are not draws, and the roll itself was made before it began.
      this.tumble -= dt;
      const step = Math.floor(this.clock / 0.07);
      this.dice.forEach((d, i) => {
        drawDie(d, ((step * (i + 2) + i * 3) % 6) + 1, DIE, DIE_COLORS[i]);
        d.rotation = Math.sin(this.clock * (17 + i * 5)) * 0.35;
        d.y = -Math.abs(Math.sin(this.clock * (11 + i * 3))) * 22;
      });
    }
    this.glowRing.clear();
    if (!this.glowing || this.finished || this.busy || this.right === null) return;
    const pulse = 5 + 3 * Math.sin(this.clock * 5);
    const { x, y, head, cell } = this.L.grid;
    // The squares that make each card's sum (its diagonal), so they can be counted; then the card with the most.
    gridRows().forEach((row, r) =>
      row.forEach((sum, c) => {
        if (!this.cardSums.includes(sum)) return;
        this.glowRing
          .roundRect(x + head + c * cell + 1, y + head + r * cell + 1, cell - 2, cell - 2, 8)
          .stroke({ width: sum === this.right ? 7 : 4, color: ink });
      }),
    );
    const at = (this.phase === 'most' ? this.L.most : this.L.pair)[this.cardSums.indexOf(this.right)];
    this.glowRing
      .roundRect(
        at.x - SUM_CARD / 2 - pulse,
        at.y - SUM_CARD / 2 - pulse,
        SUM_CARD + 2 * pulse,
        SUM_CARD + 2 * pulse,
        24,
      )
      .stroke({ width: 7, color: swatch.yellow.fill });
  }

  /** The ghost finger: the tray for each of the twelve rolls, then each question's card with the most squares. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.rolling || this.talking) return null;
    if (this.phase === 'roll') return { tap: { on: this.tray }, pause: 0.3 };
    if (this.right === null) return null;
    return { tap: { on: this.cards[this.cardSums.indexOf(this.right)] } };
  }
}
