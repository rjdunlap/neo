import { Circle, Container, Graphics, Rectangle } from 'pixi.js';
import { cream, grass, ink, swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { label } from '../../ui/text';
import type { Game, GameContext, TouchIntent } from '../types';
import { drawGapBlock, numCard, numColor, numSpinner, pipBlock, type SpinnerArt } from './art';
import {
  BLOCK_H,
  NUM_CARD,
  SETTLE_R,
  TOWER_H,
  TOWER_W,
  extremes,
  moveBlock,
  nearlyLevel,
  nextMove,
  numWheel,
  planFor,
  range,
  rangeCards,
  spin,
  stopRotation,
  tallerMove,
  towersOf,
  typicalAccepted,
  typicalCards,
  typicalLayout,
  wedgeAt,
  type NumWheel,
  type Plan,
  type TypicalLayout,
} from './logic';

/*
 * Spinner Fair level 8, The typical spin: six spins of a number wheel, each standing as a tower of that many blocks.
 * First the range (how far apart the tallest and shortest are, counted on the outline blocks above the shortest), then
 * she drags blocks between towers until they are as level as honest spins allow (tallest and shortest within one), then
 * the typical spin: the height the level towers show, either neighbour when the mean is not whole. A wrong card is the
 * only miss. Every spin is an honest seeded draw and no block move is ever counted, whichever way it goes; the second
 * move onto a taller tower lights the set's one hint.
 */

type Phase = 'spin' | 'range' | 'level' | 'typical';

const BLOCK_W = 96;

export class TypicalGame implements Game {
  readonly plan: Plan;
  readonly hintLabel = 'Show me';
  setIndex = 0;
  phase: Phase = 'spin';
  wheel: NumWheel;
  /** What each spin of the set landed on, in order; spin `i` stands as tower `i`. */
  spins: number[] = [];
  towers: number[] = [];
  /** The cards of the question in play (none while spinning or levelling). */
  cardNums: number[] = [];
  misses = 0;
  hints = 0;
  /** Misses on the question in play; the second lights the glow. */
  askMisses = 0;
  /** Moves in this set onto a tower at least as tall; the second lights the glow. Never misses. */
  slips = 0;
  glowing = false;
  /** This set's one hint has been counted. */
  hinted = false;
  spinning = false;
  busy = false;
  /** The pet is saying what the towers showed; the ghost finger waits for it, she need not. */
  talking = false;
  finished = false;
  art: SpinnerArt;
  cards: Container[] = [];
  /** The draggable top block of each tower (none on an empty tower). */
  tops: ({ node: Container; drag: DragHandle } | null)[] = [];
  readonly towerLayer = new Container();
  private readonly reduce =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  private L: TypicalLayout;
  private dead = false;
  private clock = 0;
  private talk = 0;
  private lastWedge = -1;
  /** The phase whose ask the pet last gave; a tap on the guide gives the waiting one. */
  private asked: Phase | null = null;
  /** The number each block of each tower was spun as (its colour), bottom to top. */
  private stacks: number[][] = [];
  private popping: Container[] = [];
  private readonly backdrop: Backdrop;
  private readonly panel = new Graphics();
  private readonly marks = new Graphics();
  private readonly topLayer = new Container();
  private readonly spinLayer = new Container();
  private readonly cardLayer = new Container();
  private readonly glowRing = new Graphics();

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.L = typicalLayout(ctx.view);
    this.backdrop = new Backdrop(
      {
        sky: [cream, swatch.blue.light],
        hills: [grass, swatch.green.light],
        horizon: 0.36,
        clouds: 2,
        sun: true,
        seed: 88,
      },
      ctx.view,
    );
    for (const g of [this.panel, this.marks, this.glowRing]) g.eventMode = 'none';
    ctx.stage.addChild(
      this.backdrop,
      this.panel,
      this.spinLayer,
      this.towerLayer,
      this.marks,
      this.topLayer,
      this.cardLayer,
      this.glowRing,
    );
    this.wheel = numWheel(ctx.rng);
    this.art = this.dressWheel();
    this.resize(ctx.view);
  }

  /** The right cards of the question in play: the range, or every height the level towers show. */
  get rightCards(): number[] {
    if (this.phase === 'range') return [range(this.towers)];
    return this.phase === 'typical' ? typicalAccepted(this.towers) : [];
  }
  /** What a scripted play reads. */
  get state() {
    return {
      level: this.plan.level,
      set: this.setIndex,
      phase: this.phase,
      wheel: this.wheel.slice(),
      spins: this.spins.slice(),
      towers: this.towers.slice(),
      cards: this.cardNums.slice(),
      right: this.rightCards,
      next: this.phase === 'level' ? nextMove(this.towers) : null,
      slips: this.slips,
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
    this.asked = this.phase;
    const id = (
      { spin: 'sf.instruct.8', range: 'sf.range-q', level: 'sf.level-ask', typical: 'sf.typical-q' } as const
    )[this.phase];
    return this.ctx.instruct(id);
  }

  /** The guide was tapped while the next ask waits behind the pet's line about the last answer: say it now. */
  sayWaitingAsk() {
    if (this.finished || this.busy || this.asked === this.phase) return false;
    this.talk++;
    this.talking = false;
    void this.instruct();
    return true;
  }

  destroy() {
    this.dead = true;
    this.finished = true;
    this.clearTowers();
    this.killCards();
    this.ctx.tw.kill(this.art.wheel);
    this.ctx.tw.kill(this.art.node);
  }

  // ---- the wheel and its spins ----

  private dressWheel(): SpinnerArt {
    // Drawn at one size and scaled to the layout's radius, so a turn of the screen never interrupts a spin.
    const art = numSpinner(this.wheel, SETTLE_R);
    art.node.hitArea = new Circle(0, 0, SETTLE_R + 12);
    onTap(art.node, () => this.tapSpinner());
    this.spinLayer.addChild(art.node);
    return art;
  }

  private tapSpinner() {
    if (this.finished) return;
    const node = this.art.node;
    this.ctx.tw.kill(node);
    node.rotation = 0.04;
    void this.ctx.tw.to(node, { rotation: 0 }, { duration: 0.3, ease: ease.outElastic });
    if (this.busy || this.spinning) return;
    if (this.phase !== 'spin') {
      sfx.pop(2);
      void this.say('sf.no-more-spins');
      return;
    }
    void this.doSpin();
  }

  /** One spin: drawn first, honestly, from the game's seeded RNG; the wheel then eases out onto it. Never judged. */
  private async doSpin() {
    this.spinning = true;
    const set = this.setIndex;
    const s = spin(this.ctx.rng);
    const wheel = this.art.wheel;
    const from = wheel.rotation;
    const first = this.spins.length === 0;
    const to = stopRotation(from, s.angle, this.reduce ? 0 : first ? 3 : 2);
    this.lastWedge = wedgeAt(from);
    await this.ctx.tw.to(
      wheel,
      { rotation: to },
      { duration: this.reduce ? 0.3 : first ? 2 : 1.2, ease: ease.outCubic },
    );
    if (this.finished || set !== this.setIndex) return;
    wheel.rotation = to % (Math.PI * 2);
    const n = this.wheel[s.wedge];
    this.spins.push(n);
    this.towers = towersOf(this.spins);
    this.stacks.push(Array.from({ length: n }, () => n));
    this.spinning = false;
    sfx.bell(2 + n * 2, 0.25);
    this.buildTowers(this.spins.length - 1);
    const box = this.L.towers[this.spins.length - 1];
    this.ctx.particles.burst(box.x, this.L.base - n * BLOCK_H, {
      kind: 'dot',
      colors: [numColor(n).fill, 0xffffff],
      count: 8,
      speed: [60, 150],
      gravity: 300,
      life: [0.25, 0.5],
    });
    void this.say('sf.num', { n });
    if (this.spins.length >= this.plan.spins) void this.setSpun();
  }

  /** The six spins stand: the tallest and shortest are marked, the gap between them is outlined, and the range is asked. */
  private async setSpun() {
    this.busy = true;
    const set = this.setIndex;
    await this.ctx.tw.wait(0.9);
    if (this.finished || set !== this.setIndex) return;
    this.phase = 'range';
    this.askMisses = 0;
    this.cardNums = rangeCards(this.ctx.rng, range(this.towers));
    this.showCards();
    this.drawMarks();
    sfx.whoosh();
    this.busy = false;
    void this.instruct();
  }

  // ---- the towers ----

  private clearTowers() {
    for (const p of this.popping) this.ctx.tw.kill(p.scale);
    this.popping = [];
    for (const t of this.tops) t?.drag.destroy();
    this.tops = [];
    this.topLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.towerLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
  }

  /** Every tower from its stack: a pip block per spin point, the top one a grip whose hit area is the whole column, the count under the base. `landed` pops that tower's blocks in one by one. */
  private buildTowers(landed = -1) {
    this.clearTowers();
    const L = this.L;
    this.stacks.forEach((stack, t) => {
      const col = L.towers[t];
      stack.forEach((n, k) => {
        const b = pipBlock(n, BLOCK_W, BLOCK_H);
        const y = L.base - k * BLOCK_H - BLOCK_H / 2;
        if (t === landed && !this.reduce) {
          b.scale.set(0.2);
          this.popping.push(b);
          void this.ctx.tw.to(
            b.scale,
            { x: 1, y: 1 },
            { duration: 0.25, delay: k * 0.07, ease: ease.outBack },
          );
        }
        if (k < stack.length - 1) {
          b.position.set(col.x, y);
          this.towerLayer.addChild(b);
          return;
        }
        // The top block: the grip is the whole column, so a move needs no aim at a 45-unit block.
        const grip = new Container();
        grip.position.set(col.x, y);
        grip.addChild(b);
        b.eventMode = 'none';
        grip.hitArea = new Rectangle(-TOWER_W / 2, L.base - TOWER_H - y, TOWER_W, TOWER_H);
        this.topLayer.addChild(grip);
        const drag = draggable(grip, this.ctx.tw, {
          onPick: () => sfx.pop(4 + Math.min(6, t)),
          onDrop: (x) => this.dropBlock(t, x),
        });
        drag.enabled = this.phase === 'level';
        this.tops[t] = { node: grip, drag };
      });
      if (!stack.length) this.tops[t] = null;
      const count = label(String(stack.length), 26);
      count.position.set(col.x, L.base + 18);
      this.towerLayer.addChild(count);
    });
    this.drawMarks();
  }

  /** A block let go over another tower joins it. Over its own tower, a full one or no tower it floats home. No move is a miss. */
  private dropBlock(from: number, x: number): boolean {
    if (this.phase !== 'level' || this.busy || this.finished) return false;
    const cols = this.L.towers;
    const pitch = cols[1].x - cols[0].x;
    const to = cols.findIndex((c) => Math.abs(x - c.x) <= pitch / 2);
    if (to < 0) return false;
    return this.move(from, to);
  }

  private move(from: number, to: number): boolean {
    const next = moveBlock(this.towers, from, to);
    if (!next) return false;
    const taller = tallerMove(this.towers, from, to);
    this.towers = next;
    this.stacks[to].push(this.stacks[from].pop()!);
    // A soft pop and a pentatonic step that rises with the tower it joined.
    sfx.pop(3 + next[to]);
    sfx.pluck(2 + next[to], 0.2);
    // Rebuilt after the drag has finished with the block it carried.
    void Promise.resolve().then(() => {
      if (this.dead) return;
      this.buildTowers();
      if (nearlyLevel(this.towers)) this.levelled();
      else if (taller) this.slip();
    });
    return true;
  }

  /** A move that made a tower taller: said gently, not a miss; the second in a set glows the sure move and counts the set's hint. */
  private slip() {
    sfx.tick();
    this.slips++;
    if (this.slips >= 2 && !this.glowing) this.lightHint();
    void this.say('sf.taller');
  }

  /** The towers are as level as they can be: the level line glows and the typical spin is asked. */
  private levelled() {
    this.phase = 'typical';
    this.glowing = false;
    this.askMisses = 0;
    for (const t of this.tops) if (t) t.drag.enabled = false;
    this.cardNums = typicalCards(this.ctx.rng, this.towers);
    this.showCards();
    this.drawMarks();
    sfx.bell(7, 0.3);
    sfx.bell(9, 0.25);
    void this.chain(() => this.instruct());
  }

  /** The standing marks: rings on the tallest and shortest and the outline gap (range); the level line (typical). */
  private drawMarks() {
    const g = this.marks.clear();
    const L = this.L;
    if (this.phase === 'range') {
      const { tall, short } = extremes(this.towers);
      for (const i of [tall, short]) {
        const c = L.towers[i];
        const h = Math.max(1, this.towers[i]) * BLOCK_H;
        g.roundRect(c.x - BLOCK_W / 2 - 5, L.base - h - 3, BLOCK_W + 10, h + 6, 12).stroke({
          width: 5,
          color: swatch.yellow.line,
        });
      }
      for (let k = this.towers[short]; k < this.towers[tall]; k++)
        drawGapBlock(g, L.towers[short].x, L.base - k * BLOCK_H - BLOCK_H / 2, BLOCK_W, BLOCK_H);
    } else if (this.phase === 'typical') {
      const y = L.base - Math.min(...this.towers) * BLOCK_H;
      const x0 = L.towers[0].x - TOWER_W / 2,
        x1 = L.towers[5].x + TOWER_W / 2;
      g.moveTo(x0, y).lineTo(x1, y).stroke({ width: 10, color: ink, cap: 'round' });
      g.moveTo(x0, y).lineTo(x1, y).stroke({ width: 6, color: swatch.yellow.fill, cap: 'round' });
    }
  }

  // ---- the questions ----

  private killCards() {
    for (const c of this.cards) {
      this.ctx.tw.kill(c);
      this.ctx.tw.kill(c.scale);
      c.destroy({ children: true });
    }
    this.cards = [];
  }

  private showCards() {
    this.killCards();
    const kind = this.phase === 'range' ? 'gap' : 'die';
    this.cards = this.cardNums.map((n, i) => {
      const c = numCard(n, NUM_CARD, kind);
      const at = this.L.cards[i];
      c.hitArea = new Rectangle(-NUM_CARD / 2, -NUM_CARD / 2, NUM_CARD, NUM_CARD);
      c.position.set(at.x, at.y);
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
    const right = this.rightCards;
    if (this.busy || !right.length) return;
    if (right.includes(this.cardNums[i])) {
      if (this.phase === 'range') this.rightRange(i);
      else void this.rightTypical(i);
      return;
    }
    this.misses++;
    this.askMisses++;
    sfx.boing();
    this.ctx.tw.kill(card);
    const x = this.L.cards[i].x;
    void this.ctx.tw
      .to(card, { x: x + 10 }, { duration: 0.06 })
      .then(() => this.ctx.tw.to(card, { x }, { duration: 0.3, ease: ease.outElastic }));
    void this.hearWrong();
  }

  private async hearWrong() {
    const phase = this.phase;
    await this.say(phase === 'range' ? 'sf.count-outline' : 'sf.look-line');
    if (this.finished || this.busy || phase !== this.phase) return;
    if (this.askMisses >= 2 && !this.glowing) {
      this.lightHint();
      await this.say('sf.help');
    }
  }

  /** The glow counts once per set, however many of its questions light it. */
  private lightHint() {
    this.glowing = true;
    if (!this.hinted) {
      this.hinted = true;
      this.hints++;
    }
  }

  /**
   * Asked-for help: the outline gap and its card (range), the sure move (levelling) or the level line and its cards
   * (typical) glow, one hint per set; asked again, the ghost answers or makes the move. During the spins it repeats the ask.
   */
  askForHint() {
    if (this.busy || this.finished || this.spinning) return;
    if (this.phase === 'spin') {
      void this.instruct();
      return;
    }
    if (!this.glowing) {
      this.lightHint();
      void this.say('sf.help');
      return;
    }
    if (this.phase === 'level') {
      const m = nextMove(this.towers);
      if (m) this.move(m.from, m.to);
      return;
    }
    this.tapCard(this.cardNums.indexOf(this.rightCards[0]));
  }

  private celebrate(i: number) {
    this.glowing = false;
    sfx.sparkle();
    const at = this.L.cards[i];
    this.ctx.particles.burst(at.x, at.y - NUM_CARD / 2, {
      kind: 'star',
      colors: [swatch.yellow.fill, 0xffffff],
      count: 10,
      speed: [60, 150],
      gravity: 200,
      life: [0.3, 0.6],
    });
  }

  /** The range is right: the towers open for levelling at once (or, already level, the typical spin is asked), while the pet says the sum. */
  private rightRange(i: number) {
    this.celebrate(i);
    const big = Math.max(...this.towers),
      small = Math.min(...this.towers);
    const said = () =>
      big === small
        ? this.ctx.say('sf.range-none')
        : this.ctx.say('sf.range-say', { a: big, b: small, n: big - small });
    this.askMisses = 0;
    if (nearlyLevel(this.towers)) {
      this.phase = 'typical';
      this.cardNums = typicalCards(this.ctx.rng, this.towers);
      this.showCards();
      this.drawMarks();
      void this.chain(
        said,
        () => this.ctx.say('sf.already-level'),
        () => this.instruct(),
      );
      return;
    }
    this.phase = 'level';
    this.cardNums = [];
    this.killCards();
    this.buildTowers();
    void this.chain(said, () => this.instruct());
  }

  private async rightTypical(i: number) {
    this.busy = true;
    this.celebrate(i);
    this.cards.forEach((c, j) => (c.alpha = j === i ? 1 : 0.35));
    const right = typicalAccepted(this.towers);
    const last = this.setIndex + 1 >= this.plan.sets;
    if (last) this.finished = true;
    this.talk++;
    this.talking = false;
    if (right.length === 1) await this.ctx.say('sf.typical-exact', { n: right[0] });
    else await this.ctx.say('sf.typical-about', { n: this.cardNums[i], a: right[0], b: right[1] });
    if (this.dead) return;
    if (last) {
      sfx.bell(7, 0.35);
      sfx.bell(11, 0.3);
      await this.ctx.say('sf.done-typical');
      await this.ctx.tw.wait(0.5);
      this.ctx.finish({ misses: this.misses, hints: this.hints });
      return;
    }
    await this.ctx.tw.wait(0.4);
    if (this.dead) return;
    // The next set: a fresh wheel and six more honest spins.
    this.setIndex++;
    this.phase = 'spin';
    this.spins = [];
    this.towers = [];
    this.stacks = [];
    this.cardNums = [];
    this.askMisses = 0;
    this.slips = 0;
    this.hinted = false;
    this.glowing = false;
    this.killCards();
    this.clearTowers();
    this.drawMarks();
    this.ctx.tw.kill(this.art.wheel);
    this.ctx.tw.kill(this.art.node);
    this.art.node.destroy({ children: true });
    this.wheel = numWheel(this.ctx.rng);
    this.art = this.dressWheel();
    this.resize(this.ctx.view);
    sfx.whoosh();
    await this.ctx.say('sf.next');
    if (this.dead) return;
    this.busy = false;
    void this.instruct();
  }

  // ---- shell hooks ----

  resize(view: View) {
    const L = (this.L = typicalLayout(view));
    this.backdrop.resize(view);
    const node = this.art.node;
    this.ctx.tw.kill(node);
    node.rotation = 0;
    node.scale.set(L.spinner.r / SETTLE_R);
    node.position.set(L.spinner.x, L.spinner.y);
    this.cards.forEach((c, i) => {
      this.ctx.tw.kill(c);
      c.position.set(L.cards[i].x, L.cards[i].y);
    });
    const x0 = L.towers[0].x - TOWER_W / 2 - 8,
      x1 = L.towers[5].x + TOWER_W / 2 + 8;
    this.panel
      .clear()
      .roundRect(x0, L.base - TOWER_H - 6, x1 - x0, TOWER_H + 44, 20)
      .fill({ color: 0xffffff, alpha: 0.75 });
    this.panel
      .moveTo(x0 + 10, L.base)
      .lineTo(x1 - 10, L.base)
      .stroke({ width: 4, color: ink, alpha: 0.5 });
    this.buildTowers();
  }

  update(dt: number) {
    this.clock += dt;
    if (this.spinning) {
      const w = wedgeAt(this.art.wheel.rotation);
      if (w !== this.lastWedge) {
        this.lastWedge = w;
        sfx.tick();
      }
    }
    const g = this.glowRing.clear();
    if (!this.glowing || this.finished || this.busy) return;
    const pulse = 5 + 3 * Math.sin(this.clock * 5);
    const L = this.L;
    const ring = (x: number, y: number, w: number, h: number) =>
      g
        .roundRect(x - w / 2 - pulse, y - h / 2 - pulse, w + 2 * pulse, h + 2 * pulse, 20)
        .stroke({ width: 7, color: swatch.yellow.fill });
    if (this.phase === 'level') {
      // The sure move: the top block of the tallest tower, and the space above the shortest where it goes.
      const m = nextMove(this.towers);
      if (!m) return;
      const from = L.towers[m.from],
        to = L.towers[m.to];
      ring(from.x, L.base - this.towers[m.from] * BLOCK_H + BLOCK_H / 2, BLOCK_W, BLOCK_H);
      drawGapBlock(
        g,
        to.x,
        L.base - this.towers[m.to] * BLOCK_H - BLOCK_H / 2,
        BLOCK_W,
        BLOCK_H,
        swatch.yellow.line,
      );
      return;
    }
    if (this.phase === 'range') {
      const { tall, short } = extremes(this.towers);
      const gap = this.towers[tall] - this.towers[short];
      if (gap > 0)
        ring(
          L.towers[short].x,
          L.base - ((this.towers[tall] + this.towers[short]) / 2) * BLOCK_H,
          BLOCK_W,
          gap * BLOCK_H,
        );
    } else if (this.phase === 'typical') {
      const y = L.base - Math.min(...this.towers) * BLOCK_H;
      g.moveTo(L.towers[0].x - TOWER_W / 2, y)
        .lineTo(L.towers[5].x + TOWER_W / 2, y)
        .stroke({ width: 12 + pulse, color: swatch.yellow.fill, alpha: 0.6, cap: 'round' });
    }
    // The card, or cards, the picture answers with.
    for (const n of this.rightCards) {
      const at = L.cards[this.cardNums.indexOf(n)];
      if (at) ring(at.x, at.y, NUM_CARD, NUM_CARD);
    }
  }

  /** The ghost finger: six spins, the range card, a block from the tallest tower to the shortest until they are level, then a card the level towers show. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.spinning || this.talking) return null;
    if (this.phase === 'spin') return { tap: { on: this.art.node }, pause: 0.3 };
    if (this.phase === 'level') {
      const m = nextMove(this.towers);
      const top = m && this.tops[m.from];
      if (!m || !top) return null;
      return {
        drag: { on: top.node },
        to: {
          on: this.towerLayer,
          x: this.L.towers[m.to].x,
          y: this.L.base - this.towers[m.to] * BLOCK_H - BLOCK_H / 2,
        },
      };
    }
    const i = this.cardNums.indexOf(this.rightCards[0]);
    return i < 0 ? null : { tap: { on: this.cards[i] } };
  }
}
