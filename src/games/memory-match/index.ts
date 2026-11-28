import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, swatch } from '../../art/palette';
import { shapePath, starPoints } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { idle, type CouchControls } from '../../engine/controller';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { ink } from '../../art/palette';
import { label } from '../../ui/text';
import { tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { clockFace, fractionFace, pictureFace, totalFace } from './art';
import {
  selectFractionSquares,
  type FractionSquare,
  selectTimes,
  selectSums,
  countAcross,
  groupsLabel,
  type TotalSum,
  DOT_RADIUS,
  selectDotLayouts,
  selectPictures,
  type DotSpot,
  type MemoryPicture,
  cardLabel,
  fraction,
  hintPartner,
  knownMismatch,
  LEVELS,
  boardLayout,
  makeDeck,
  nextCard,
  numberWord,
  planFor,
  pictureIdentity,
  type MemoryCard,
  type MemoryMode,
} from './logic';
import { rangeFor } from '../../progress/difficulty';
import { courseBest, courseMinimum, courseTables, isMemoryCourse, type Table } from './course';

type CardView = { node: Container; front: Container; back: Graphics; matched: boolean };
class MemoryMatch implements Game {
  cards: MemoryCard[];
  readonly views: CardView[] = [];
  readonly seen = new Set<number>();
  private plan: { pairs: number; mode: MemoryMode; name: string };
  private readonly letters: string[];
  pictures: readonly MemoryPicture[];
  readonly dots: readonly DotSpot[][];
  readonly squares: readonly FractionSquare[];
  readonly times: readonly number[];
  readonly sums: readonly TotalSum[];
  // A couch challenge course: fixed tables played in a row, scored by cards turned over (docs/DESIGN.md "Adding a challenge course").
  private readonly course: { tables: Table[]; par: number[]; minimum: number } | null = null;
  private index = 0;
  private doneBoards: number[] = [];
  /** Flips already spent on the table we are resuming, so leaving and coming back cannot erase them. */
  private carry = 0;
  private flips = 0;
  private assisted = false;
  private get boardFlips() {
    return this.carry + this.flips;
  }
  private readonly background = new Graphics();
  private readonly hint = new Graphics();
  private first: number | null = null;
  private locked = false;
  private remaining: number;
  private misses = 0;
  private hints = 0;
  private wrong = 0;
  private hintAt: number | null = null;
  private clock = 0;
  private cardSize = 140;
  private cols = 4;
  // Couch play: a ring moved with the D-pad, and in a face-off two players taking turns on one board.
  private focus = 0;
  private couchOn = false;
  private turn: 0 | 1 = 0;
  private readonly won: [number, number] = [0, 0];
  private readonly versus: boolean;
  private readonly ring = new Graphics();
  private readonly board = new Container();
  private boardTexts: ReturnType<typeof label>[] = [];
  private botWait = 1;

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.versus = !!ctx.couch?.versus;
    const run = ctx.couch?.course;
    if (run && isMemoryCourse(run.id)) {
      this.course = {
        tables: courseTables(run.id),
        par: courseBest(run.id),
        minimum: courseMinimum(run.id),
      };
      this.index = Math.min(this.course.tables.length - 1, run.resume.board);
      this.doneBoards = run.resume.done.slice();
      this.carry = run.resume.attempts;
      this.assisted = run.resume.assisted;
      const table = this.course.tables[this.index];
      this.plan = { pairs: table.pairs, mode: 'pictures', name: 'Card table' };
      this.cards = table.cards;
      this.pictures = table.pictures;
      this.times = [];
      this.letters = [];
    } else {
      this.times = this.plan.mode === 'clocks' ? selectTimes(ctx.rng) : [];
      this.cards = makeDeck(this.plan.pairs, ctx.rng);
      this.letters = ctx.rng.shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')).slice(0, this.plan.pairs);
      this.pictures = this.plan.mode === 'pictures' ? selectPictures(this.plan.pairs, ctx.rng) : [];
    }
    this.dots = this.plan.mode === 'numbers' ? selectDotLayouts(this.plan.pairs, ctx.rng) : [];
    this.squares = this.plan.mode === 'fractions' ? selectFractionSquares(ctx.rng) : [];
    this.sums = this.plan.mode === 'totals' ? selectSums(ctx.rng) : [];
    this.remaining = this.plan.pairs;
    ctx.stage.addChild(this.background, this.hint, this.ring, this.board);
    this.ring.eventMode = 'none';
    this.board.eventMode = 'none';
    this.buildCards();
  }

  /** One node per card, built again for each table of a course. */
  private buildCards() {
    for (const v of this.views) v.node.destroy({ children: true });
    this.views.length = 0;
    this.cards.forEach((card, i) => {
      const node = new Container();
      const front = new Container();
      front.addChild(tile(140, 140, 'white'), this.face(card));
      front.visible = false;
      const back = tile(140, 140, 'purple');
      back.poly(starPoints(30, 14)).fill(swatch.purple.light);
      node.addChild(front, back);
      node.hitArea = new Rectangle(-70, -70, 140, 140);
      onTap(node, () => void this.choose(i), { cooldown: 180 });
      this.ctx.stage.addChild(node);
      this.views.push({ node, front, back, matched: false });
    });
  }

  private face(card: MemoryCard): Container {
    if (this.plan.mode === 'clocks') return clockFace(this.times[card.pair], card.side);
    if (this.plan.mode === 'totals') return totalFace(this.sums[card.pair], card.side);
    if (this.plan.mode === 'pictures') return pictureFace(this.pictures[card.pair]);
    if (this.plan.mode === 'fractions') {
      const amount = fraction(card.pair)!;
      if (card.side)
        return label(
          card.pair === 2 ? 'three\nquarters' : amount.name,
          card.pair === 2 ? 26 : 30,
          swatch.orange.line,
        );
      return fractionFace(this.squares[card.pair]);
    }
    if (this.plan.mode === 'letters')
      return label(
        card.side ? this.letters[card.pair].toLowerCase() : this.letters[card.pair],
        74,
        swatch.purple.line,
      );
    if (this.plan.mode === 'number-words')
      return label(
        card.side ? String(card.pair + 1) : numberWord(card.pair),
        card.side ? 70 : 38,
        swatch.teal.line,
      );
    if (this.plan.mode === 'numbers') {
      if (!card.side) return label(String(card.pair + 1), 74, swatch.teal.line);
      const g = new Graphics();
      for (const d of this.dots[card.pair]) g.circle(d.x, d.y, DOT_RADIUS).fill(swatch.teal.fill);
      return g;
    }
    const { color, shape } = pictureIdentity(this.plan.mode, card.pair);
    return shapePath(new Graphics(), shape, 43)
      .fill(swatch[color].fill)
      .stroke({ width: 4, color: swatch[color].line });
  }

  private labelOf(i: number): string {
    return cardLabel(this.plan.mode, this.cards[i], this.letters, this.pictures, this.times, this.sums);
  }

  /**
   * Level 13's nonmatch speech, the same for exploring and a known miss (only the boing differs): a groups card names
   * its two groups and their total, so a groups card and the wrong number say "two and three make five, not seven".
   * Two numbers fall back to the ordinary line. False when this is not level 13 or both cards are numbers.
   */
  private explainTotals(first: number, second: number): boolean {
    if (this.plan.mode !== 'totals') return false;
    const [a, b] = [this.cards[first], this.cards[second]];
    if (a.side && b.side) return false;
    const word = (n: number) => numberWord(n - 1);
    const [groups, other] = a.side ? [b, a] : [a, b];
    const sum = this.sums[groups.pair],
      that = this.sums[other.pair];
    if (other.side)
      void this.ctx.say('memory.total-mix', {
        groups: groupsLabel(sum),
        total: word(sum.total),
        other: word(that.total),
      });
    else
      void this.ctx.say('memory.total-two', {
        groups: groupsLabel(sum),
        total: word(sum.total),
        others: groupsLabel(that),
        other: word(that.total),
      });
    return true;
  }

  /** Done with the round: for a course, only after its last table (between tables the cards are dealt again). */
  get finished() {
    return this.remaining === 0 && !(this.course && this.index + 1 < this.course.tables.length);
  }

  /** The next table of a course: its cards, its pictures, and nothing carried over from the last. */
  private loadTable(i: number) {
    const table = this.course!.tables[i];
    this.index = i;
    this.plan = { pairs: table.pairs, mode: 'pictures', name: 'Card table' };
    this.cards = table.cards;
    this.pictures = table.pictures;
    this.remaining = table.pairs;
    this.first = null;
    this.focus = 0;
    this.flips = 0;
    this.wrong = 0;
    this.hintAt = null;
    this.hint.clear();
    this.seen.clear();
    this.botWait = 1.5;
    this.buildCards();
  }

  /** Hand a course's numbers to the shell. `finished` means the table just ended, so none of its flips are "in progress". */
  private report(finished = false) {
    const run = this.ctx.couch?.course;
    if (!run || !this.course) return;
    run.progress({
      board: this.index,
      boards: this.course.tables.length,
      done: this.doneBoards.slice(),
      attempts: finished ? 0 : this.boardFlips,
      par: this.course.par[this.index],
      minimum: this.course.minimum,
      assisted: this.assisted,
    });
  }

  /** The flips for the table just finished, over the cards for a moment. */
  private async boardScore() {
    const par = this.course!.par[this.index],
      total = this.course!.tables.length,
      n = this.doneBoards[this.doneBoards.length - 1];
    const flips = `${n} ${n === 1 ? 'flip' : 'flips'}`;
    const text =
      n <= par
        ? `Table ${this.index + 1} of ${total}: ${flips}, on par or better!`
        : `Table ${this.index + 1} of ${total}: ${flips} (par ${par})`;
    const note = new Container();
    const t = label(text, 30, ink);
    const padX = 22,
      padY = 14;
    note.addChild(
      new Graphics()
        .roundRect(-t.width / 2 - padX, -t.height / 2 - padY, t.width + padX * 2, t.height + padY * 2, 16)
        .fill(cream)
        .stroke({ width: 3, color: swatch.green.line }),
      t,
    );
    note.position.set(this.ctx.view.w / 2, this.ctx.view.h / 2);
    note.alpha = 0;
    this.ctx.stage.addChild(note);
    await this.ctx.tw.to(note, { alpha: 1 }, { duration: 0.2 });
    await this.ctx.tw.wait(1.1);
    await this.ctx.tw.to(note, { alpha: 0 }, { duration: 0.25 });
    note.destroy({ children: true });
  }

  start() {
    if (this.course) {
      this.report();
      void this.ctx.instruct('memory.start');
      return;
    }
    void this.ctx.instruct(
      this.plan.mode === 'clocks'
        ? 'memory.clock'
        : this.plan.mode === 'totals'
          ? 'memory.total'
          : this.plan.mode === 'numbers'
            ? 'memory.number'
            : this.plan.mode === 'letters'
              ? 'memory.letter'
              : this.plan.mode === 'number-words'
                ? 'memory.number-word'
                : this.plan.mode === 'fractions'
                  ? 'memory.fraction'
                  : 'memory.start',
    );
  }

  private async choose(i: number) {
    const view = this.views[i];
    if (this.locked || view.matched || this.remaining === 0) return;
    const contents = this.labelOf(i);
    if (this.first === i) {
      void this.ctx.say('memory.card', { card: contents });
      return;
    }
    view.front.visible = true;
    view.back.visible = false;
    sfx.pop(5 + (this.cards[i].pair % 5));
    // A course counts every card turned over, and saves it at once so a reload cannot lose it.
    if (this.course) {
      this.flips++;
      this.report();
    }
    if (this.first === null) {
      void this.ctx.say('memory.card', { card: contents });
      this.first = i;
      this.seen.add(i);
      return;
    }
    const first = this.first;
    this.locked = true;
    const a = this.views[first];
    if (this.cards[first].pair === this.cards[i].pair) {
      a.matched = view.matched = true;
      a.node.alpha = view.node.alpha = 0.6;
      this.remaining--;
      this.wrong = 0;
      this.hintAt = null;
      this.hint.clear();
      // A match earns the same player another turn.
      if (this.versus) {
        this.won[this.turn]++;
        this.drawBoard();
      }
      sfx.sparkle();
      if (this.plan.mode === 'totals') {
        const sum = this.sums[this.cards[i].pair];
        void this.ctx.say('memory.total-pair', {
          groups: groupsLabel(sum),
          total: numberWord(sum.total - 1),
        });
      } else
        void this.ctx.say(this.plan.mode === 'clocks' ? 'memory.clock-pair' : 'memory.pair-card', {
          card: contents,
        });
      await this.ctx.tw.wait(0.35);
    } else {
      const known = knownMismatch(this.cards, first, i, this.seen);
      if (known) {
        this.misses++;
        this.wrong++;
        sfx.boing();
      }
      if (!this.explainTotals(first, i))
        void this.ctx.say(known ? 'memory.wrong-cards' : 'memory.explore', {
          first: this.labelOf(first),
          second: contents,
        });
      await this.ctx.tw.wait(1.2);
      a.front.visible = view.front.visible = false;
      a.back.visible = view.back.visible = true;
      // A face-off gives no glowing help: it would favor whoever asked.
      if (this.versus) {
        this.turn = this.turn === 0 ? 1 : 0;
        this.drawBoard();
      } else if (known && this.hintAt === null) {
        const partner = hintPartner(this.cards, first, this.seen, this.wrong);
        if (partner !== null) {
          this.hints++;
          if (this.course) {
            this.assisted = true;
            this.report();
          }
          this.hintAt = partner;
          if (this.plan.mode === 'clocks') {
            const time = this.times[this.cards[partner].pair];
            void this.ctx.say('memory.clock-hint', {
              card: cardLabel('clocks', this.cards[partner], [], [], this.times),
              minute: time % 60 === 0 ? 'twelve' : 'six',
              hour:
                time % 60 === 0
                  ? `on ${Math.floor(time / 60) || 12}`
                  : `halfway between ${Math.floor(time / 60) || 12} and ${(Math.floor(time / 60) % 12) + 1}`,
            });
          } else if (this.plan.mode === 'totals') {
            // Both cards of a pair share its sum: count across its two groups to reach the number.
            const sum = this.sums[this.cards[partner].pair];
            void this.ctx.say('memory.total-hint', {
              groups: groupsLabel(sum),
              count: countAcross(sum.total),
              total: numberWord(sum.total - 1),
            });
          } else void this.ctx.say('memory.hint');
          this.drawHint();
        }
      }
    }
    this.seen.add(i);
    this.first = null;
    if (!this.remaining && this.course) {
      this.doneBoards.push(this.boardFlips);
      this.report(true);
      this.carry = 0;
      if (!this.ctx.demo) await this.boardScore();
      if (this.index + 1 < this.course.tables.length) {
        this.loadTable(this.index + 1);
        this.locked = false;
        this.resize(this.ctx.view);
        this.report();
        return;
      }
    }
    this.locked = false;
    if (!this.remaining)
      this.ctx.finish({
        misses: this.misses,
        hints: this.hints,
        ...(this.versus ? { scores: [this.won[0], this.won[1]] as [number, number] } : {}),
      });
  }

  resize(v: View) {
    this.background.clear().rect(0, 0, v.w, v.h).fill(cream);
    const L = boardLayout(v, this.cards.length, this.plan.pairs);
    this.cols = L.cols;
    this.cardSize = L.size;
    this.views.forEach(({ node }, i) => {
      node.scale.set(this.cardSize / 140);
      node.position.copyFrom(L.cards[i]);
    });
    this.drawHint();
    this.board.position.copyFrom(L.board);
    this.drawBoard();
  }

  /** The face-off scoreboard: both players' pairs, with the player whose turn it is lit. */
  private drawBoard() {
    for (const t of this.boardTexts) t.destroy();
    this.boardTexts = [];
    if (!this.versus) return;
    [0, 1].forEach((player) => {
      const on = this.turn === player;
      const t = label(
        `Player ${player + 1}: ${this.won[player]}`,
        on ? 34 : 26,
        on ? (player ? swatch.pink.line : swatch.blue.line) : ink,
      );
      t.alpha = on ? 1 : 0.6;
      t.position.set(player ? 170 : -170, 0);
      this.board.addChild(t);
      this.boardTexts.push(t);
    });
  }

  /** Move the ring one card, staying on the grid. */
  private step(dir: number) {
    const n = this.cards.length,
      rows = Math.ceil(n / this.cols);
    let x = this.focus % this.cols,
      y = Math.floor(this.focus / this.cols);
    if (dir === 0) x = Math.min(this.cols - 1, x + 1);
    else if (dir === 2) x = Math.max(0, x - 1);
    else if (dir === 1) y = Math.min(rows - 1, y + 1);
    else y = Math.max(0, y - 1);
    if (y * this.cols + x < n) this.focus = y * this.cols + x;
  }

  /** D-pad or stick moves the ring, the bottom button turns the card. In a face-off with two controllers, only the player whose turn it is. */
  control(input: CouchControls) {
    this.couchOn = true;
    if (this.locked || this.remaining === 0) return;
    const players = this.versus && input.players[1].active ? [input.players[this.turn]] : input.players;
    for (const p of players) {
      if (p.direction >= 0) this.step(p.direction);
      if (p.action) void this.choose(this.focus);
    }
  }

  /** The "watch me" demo: a player who remembers what has been turned over, moving the ring one card at a time. */
  autoplay(dt: number): CouchControls {
    const out = idle();
    this.botWait -= dt;
    if (this.locked || this.botWait > 0 || this.remaining === 0) return out;
    out.players[0].active = true;
    const target = nextCard(this.cards, this.seen, (k) => this.views[k].matched, this.first);
    if (target < 0) return out;
    this.botWait = 0.4;
    if (target === this.focus) {
      out.players[0].action = true;
      this.botWait = 0.9;
    } else {
      const dx = (target % this.cols) - (this.focus % this.cols);
      out.players[0].direction = dx > 0 ? 0 : dx < 0 ? 2 : target > this.focus ? 1 : 3;
    }
    return out;
  }

  /** The ghost finger on the how-to card: the same player who remembers, tapping the card itself. */
  autotouch(): TouchIntent | null {
    if (this.locked || this.remaining === 0) return null;
    const target = nextCard(this.cards, this.seen, (k) => this.views[k].matched, this.first);
    // The first card of a pair is followed straight away by the second; a pair is given a moment to be seen.
    return target < 0
      ? null
      : { tap: { on: this.views[target].node }, pause: this.first === null ? 0.3 : 0.55 };
  }

  private drawHint() {
    this.hint.clear();
    if (this.hintAt === null) return;
    const c = this.views[this.hintAt].node,
      s = this.cardSize + 12;
    this.hint.roundRect(c.x - s / 2, c.y - s / 2, s, s, 22).stroke({ width: 7, color: swatch.yellow.line });
  }
  update(dt: number) {
    this.clock += dt;
    this.hint.alpha = 0.65 + 0.35 * Math.sin(this.clock * 3);
    const ring = this.ring.clear();
    if (!this.couchOn || !this.remaining) return;
    const c = this.views[this.focus].node,
      size = this.cardSize + 14 + 3 * Math.sin(this.clock * 6);
    const sw = this.versus ? (this.turn ? swatch.pink : swatch.blue) : swatch.teal;
    ring.roundRect(c.x - size / 2, c.y - size / 2, size, size, 24).stroke({ width: 9, color: sw.line });
  }
  destroy() {}
}

function memoryArt(): Container {
  const c = new Container();
  const back = tile(110, 140, 'purple');
  back.rotation = -0.2;
  back.position.set(-35, -90);
  const front = new Container();
  front.addChild(tile(110, 140, 'white'), shapePath(new Graphics(), 'heart', 34).fill(swatch.pink.fill));
  front.rotation = 0.2;
  front.position.set(40, -80);
  c.addChild(back, front);
  return c;
}
export const memoryMatch: GameModule = {
  id: 'memory-match',
  liveController: true,
  name: 'Memory Match',
  titleLine: 'game.memory-match',
  region: 'puzzle-peaks',
  challenge: 'noticing',
  skills: ['memory', 'matching', 'number-sense', 'letters', 'telling-time'],
  bands: ['toddler', 'preschool', 'prek', 'school'],
  upright: true,
  levels: (b) => rangeFor(LEVELS, b),
  describeLevel: (l) => planFor(l).name,
  music: STYLES.paint,
  offScreen: 'Hide two pairs of familiar objects under cups and take turns finding their partners.',
  hubIcon: () => new WigglyIcon(memoryArt()),
  touchDemo: true,
  sticker: () => memoryArt(),
  create: (ctx) => new MemoryMatch(ctx),
};
