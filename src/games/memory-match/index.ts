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
import { cardLabel, fraction, hintPartner, knownMismatch, LEVELS, makeDeck, nextCard, numberWord, planFor, pictureIdentity, type MemoryCard } from './logic';
import { rangeFor } from '../../progress/difficulty';

type CardView = { node: Container; front: Container; back: Graphics; matched: boolean };
class MemoryMatch implements Game {
  readonly cards: MemoryCard[];
  readonly views: CardView[] = [];
  readonly seen = new Set<number>();
  private readonly plan;
  private readonly letters: string[];
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
    this.cards = makeDeck(this.plan.pairs, ctx.rng);
    this.letters = ctx.rng.shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')).slice(0, this.plan.pairs);
    this.remaining = this.plan.pairs;
    ctx.stage.addChild(this.background, this.hint, this.ring, this.board);
    this.ring.eventMode = 'none';
    this.board.eventMode = 'none';
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
      ctx.stage.addChild(node);
      this.views.push({ node, front, back, matched: false });
    });
  }

  private face(card: MemoryCard): Container {
    if (this.plan.mode === 'fractions') {
      const amount = fraction(card.pair)!;
      if (card.side) return label(card.pair === 2 ? 'three\nquarters' : amount.name, card.pair === 2 ? 26 : 30, swatch.orange.line);
      const g = new Graphics();
      const whole = 64, cellW = whole / 2, cellH = amount.denominator === 2 ? whole : whole / 2;
      for (let part = 0; part < amount.denominator; part++) {
        const x = -whole / 2 + (part % 2) * cellW;
        const y = -whole / 2 + Math.floor(part / 2) * cellH;
        g.rect(x, y, cellW, cellH).fill(part < amount.numerator ? swatch.orange.fill : cream)
          .stroke({ width: 3, color: swatch.orange.line });
      }
      return g;
    }
    if (this.plan.mode === 'letters') return label(card.side ? this.letters[card.pair].toLowerCase() : this.letters[card.pair], 74, swatch.purple.line);
    if (this.plan.mode === 'number-words') return label(card.side ? String(card.pair + 1) : numberWord(card.pair), card.side ? 70 : 38, swatch.teal.line);
    if (this.plan.mode === 'numbers') {
      if (!card.side) return label(String(card.pair + 1), 74, swatch.teal.line);
      const g = new Graphics();
      const n = card.pair + 1;
      for (let i = 0; i < n; i++) g.circle((i % 2) * 34 - (n === 1 ? 0 : 17), Math.floor(i / 2) * 25 - (Math.ceil(n / 2) - 1) * 12.5, 9).fill(swatch.teal.fill);
      return g;
    }
    const { color, shape } = pictureIdentity(this.plan.mode, card.pair);
    return shapePath(new Graphics(), shape, 43).fill(swatch[color].fill).stroke({ width: 4, color: swatch[color].line });
  }

  get finished() { return this.remaining === 0; }

  start() { void this.ctx.instruct(this.plan.mode === 'numbers' ? 'memory.number' : this.plan.mode === 'letters' ? 'memory.letter' : this.plan.mode === 'number-words' ? 'memory.number-word' : this.plan.mode === 'fractions' ? 'memory.fraction' : 'memory.start'); }

  private async choose(i: number) {
    const view = this.views[i];
    if (this.locked || view.matched || this.remaining === 0) return;
    const contents = cardLabel(this.plan.mode, this.cards[i], this.letters);
    if (this.first === i) {
      void this.ctx.say('memory.card', { card: contents });
      return;
    }
    view.front.visible = true; view.back.visible = false;
    sfx.pop(5 + this.cards[i].pair % 5);
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
      this.remaining--; this.wrong = 0; this.hintAt = null; this.hint.clear();
      // A match earns the same player another turn.
      if (this.versus) { this.won[this.turn]++; this.drawBoard(); }
      sfx.sparkle(); void this.ctx.say('memory.pair-card', { card: contents });
      await this.ctx.tw.wait(0.35);
    } else {
      const known = knownMismatch(this.cards, first, i, this.seen);
      if (known) { this.misses++; this.wrong++; sfx.boing(); }
      void this.ctx.say(known ? 'memory.wrong-cards' : 'memory.explore', {
        first: cardLabel(this.plan.mode, this.cards[first], this.letters), second: contents,
      });
      await this.ctx.tw.wait(1.2);
      a.front.visible = view.front.visible = false;
      a.back.visible = view.back.visible = true;
      // A face-off gives no glowing help: it would favor whoever asked.
      if (this.versus) { this.turn = this.turn === 0 ? 1 : 0; this.drawBoard(); }
      else if (known && this.hintAt === null) {
        const partner = hintPartner(this.cards, first, this.seen, this.wrong);
        if (partner !== null) {
          this.hints++; this.hintAt = partner;
          void this.ctx.say('memory.hint');
          this.drawHint();
        }
      }
    }
    this.seen.add(i);
    this.first = null; this.locked = false;
    if (!this.remaining) this.ctx.finish({ misses: this.misses, hints: this.hints, ...(this.versus ? { scores: [this.won[0], this.won[1]] as [number, number] } : {}) });
  }

  resize(v: View) {
    this.background.clear().rect(0, 0, v.w, v.h).fill(cream);
    const cols = this.cols = this.cards.length <= 6 ? this.plan.pairs : 4;
    const rows = Math.ceil(this.cards.length / cols);
    this.cardSize = Math.min(150, (v.h - 170) / rows - 16, (v.w - 240) / cols - 16);
    const step = this.cardSize + 16;
    const cx = v.w / 2 + 40;
    this.views.forEach(({ node }, i) => {
      node.scale.set(this.cardSize / 140);
      node.position.set(cx + (i % cols - (cols - 1) / 2) * step, 115 + this.cardSize / 2 + Math.floor(i / cols) * step);
    });
    this.drawHint();
    this.board.position.set(cx, 84);
    this.drawBoard();
  }

  /** The face-off scoreboard: both players' pairs, with the player whose turn it is lit. */
  private drawBoard() {
    for (const t of this.boardTexts) t.destroy();
    this.boardTexts = [];
    if (!this.versus) return;
    [0, 1].forEach((player) => {
      const on = this.turn === player;
      const t = label(`Player ${player + 1}: ${this.won[player]}`, on ? 34 : 26, on ? (player ? swatch.pink.line : swatch.blue.line) : ink);
      t.alpha = on ? 1 : 0.6;
      t.position.set(player ? 170 : -170, 0);
      this.board.addChild(t);
      this.boardTexts.push(t);
    });
  }

  /** Move the ring one card, staying on the grid. */
  private step(dir: number) {
    const n = this.cards.length, rows = Math.ceil(n / this.cols);
    let x = this.focus % this.cols, y = Math.floor(this.focus / this.cols);
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
    if (target === this.focus) { out.players[0].action = true; this.botWait = 0.9; }
    else {
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
    return target < 0 ? null : { tap: { on: this.views[target].node }, pause: this.first === null ? 0.3 : 0.55 };
  }

  private drawHint() {
    this.hint.clear();
    if (this.hintAt === null) return;
    const c = this.views[this.hintAt].node, s = this.cardSize + 12;
    this.hint.roundRect(c.x - s / 2, c.y - s / 2, s, s, 22).stroke({ width: 7, color: swatch.yellow.line });
  }
  update(dt: number) {
    this.clock += dt;
    this.hint.alpha = 0.65 + 0.35 * Math.sin(this.clock * 3);
    const ring = this.ring.clear();
    if (!this.couchOn || !this.remaining) return;
    const c = this.views[this.focus].node, size = this.cardSize + 14 + 3 * Math.sin(this.clock * 6);
    const sw = this.versus ? (this.turn ? swatch.pink : swatch.blue) : swatch.teal;
    ring.roundRect(c.x - size / 2, c.y - size / 2, size, size, 24).stroke({ width: 9, color: sw.line });
  }
  destroy() {}
}

function memoryArt(): Container {
  const c = new Container();
  const back = tile(110, 140, 'purple'); back.rotation = -0.2; back.position.set(-35, -90);
  const front = new Container(); front.addChild(tile(110, 140, 'white'), shapePath(new Graphics(), 'heart', 34).fill(swatch.pink.fill)); front.rotation = 0.2; front.position.set(40, -80);
  c.addChild(back, front); return c;
}
export const memoryMatch: GameModule = {
  id: 'memory-match', name: 'Memory Match', titleLine: 'game.memory-match', region: 'puzzle-peaks',
  skills: ['memory', 'matching', 'number-sense', 'letters'], bands: ['preschool', 'prek', 'school'], levels: (b) => rangeFor(LEVELS, b),
  describeLevel: (l) => planFor(l).name,
  music: STYLES.paint, offScreen: 'Hide two pairs of familiar objects under cups and take turns finding their partners.',
  hubIcon: () => new WigglyIcon(memoryArt()), touchDemo: true, sticker: () => memoryArt(), create: (ctx) => new MemoryMatch(ctx),
};
