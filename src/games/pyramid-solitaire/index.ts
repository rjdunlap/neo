import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, ink, swatch, type ColorName } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  LEVELS,
  at,
  covers,
  exposed,
  fullMask,
  liftable,
  makePuzzle,
  moves,
  present,
  rankName,
  remove,
  solver,
  planFor,
  type Removal,
} from './logic';

function cardArt(rank: number, color: ColorName = 'teal'): Container {
  const c = new Container();
  c.addChild(tile(100, 100, 'white'));
  const face = label(rankName(rank), 42, swatch[color].line);
  face.y = -10;
  const value = label(rank >= 11 || rank === 1 ? `= ${rank}` : '', 19, ink);
  value.y = 29;
  // The corner index keeps the rank and its value readable however much of the card the next row covers.
  const corner = label(rankName(rank), 18, swatch[color].line);
  corner.position.set(-33, -34);
  c.addChild(face, value, corner);
  if (rank >= 11 || rank === 1) {
    const cornerValue = label(String(rank), 13, ink, '500');
    cornerValue.position.set(-33, -17);
    c.addChild(cornerValue);
  }
  c.eventMode = 'none';
  return c;
}
class PyramidSolitaire implements Game {
  readonly puzzle;
  readonly solve;
  readonly nodes: Container[] = [];
  readonly undoButton = new Container();
  readonly hintButton = new Container();
  readonly againButton = new Container();
  mask: number;
  selected = -1;
  hinted: Removal | null = null;
  misses = 0;
  hints = 0;
  finished = false;
  private rejected = 0;
  private history: number[] = [];
  /** Removed cards still lifting away: drawn until their fade ends, never tappable. */
  private readonly leaving = new Set<Container>();
  private spots: { x: number; y: number }[] = [];
  private readonly ground = new Graphics();
  private readonly glow = new Graphics();
  private readonly heading = label('Make 13 · clear the pyramid', 34, ink);
  private readonly guide = label('A = 1    J = 11    Q = 12    K = 13 (alone)', 24, ink);
  private readonly status = label('', 24, ink);
  constructor(private readonly ctx: GameContext) {
    this.puzzle = makePuzzle(ctx.level, ctx.rng);
    this.mask = fullMask(this.puzzle.rows);
    this.solve = solver(this.puzzle);
    for (const g of [this.ground, this.glow, this.heading, this.guide, this.status]) g.eventMode = 'none';
    ctx.stage.addChild(this.ground, this.heading, this.guide, this.status);
    this.puzzle.ranks.forEach((rank, i) => {
      const c = new Container();
      c.addChild(cardArt(rank));
      c.hitArea = new Rectangle(-50, -50, 100, 100);
      onTap(c, () => this.choose(i));
      this.nodes.push(c);
      ctx.stage.addChild(c);
    });
    for (const [node, text, action] of [
      [this.undoButton, 'Undo ↶', () => this.undo()],
      [this.hintButton, 'Hint ◇', () => this.askForHint()],
      [this.againButton, 'Start over ↺', () => this.restart()],
    ] as const) {
      node.addChild(tile(164, 100, 'teal'), label(text, 24, ink));
      node.hitArea = new Rectangle(-82, -50, 164, 100);
      onTap(node, action);
      ctx.stage.addChild(node);
    }
    ctx.stage.addChild(this.glow);
    this.resize(ctx.view);
  }
  start() {
    void this.ctx.instruct(this.puzzle.lift ? 'pyramid.lift' : 'pyramid.go');
  }
  choose(i: number) {
    if (!this.ctx.alive || this.finished || !present(this.mask, i)) return;
    // Level 5: a covered card whose only remaining cover is the chosen card is a partner like an open one.
    // A covered king can never pair, so tapping one stays the free covered-card tap.
    const coverPartner =
      !!this.puzzle.lift &&
      this.selected >= 0 &&
      this.puzzle.ranks[i] !== 13 &&
      liftable(this.puzzle, this.mask, this.selected).includes(i);
    if (!exposed(this.puzzle, this.mask, i) && !coverPartner) {
      sfx.tick();
      // The lift hint only when the one card left on it is open, so following it can work.
      const left = covers(this.puzzle.rows, i).filter((k) => present(this.mask, k));
      const oneLeft =
        !!this.puzzle.lift &&
        this.puzzle.ranks[i] !== 13 &&
        left.length === 1 &&
        exposed(this.puzzle, this.mask, left[0]);
      this.status.text = oneLeft
        ? 'First choose the one card lying on this one. If they make 13, they lift together.'
        : 'Remove both cards directly below this one first.';
      void this.ctx.say(oneLeft ? 'pyramid.liftFirst' : 'pyramid.covered');
      return;
    }
    const rank = this.puzzle.ranks[i];
    if (rank === 13 && !coverPartner) {
      this.take([i]);
      return;
    }
    if (this.selected === i) {
      this.selected = -1;
      this.draw();
      sfx.tick();
      return;
    }
    if (this.selected < 0) {
      this.selected = i;
      sfx.tick();
      this.draw();
      void this.ctx.say('pyramid.number', { n: rank });
      return;
    }
    const a = this.selected;
    if (this.puzzle.ranks[a] + rank !== 13) {
      this.selected = -1;
      this.misses++;
      this.rejected++;
      sfx.boing();
      this.draw();
      this.status.text = `${this.puzzle.ranks[a]} + ${rank} = ${this.puzzle.ranks[a] + rank}. Look for 13.`;
      void this.ctx.say('pyramid.miss', { n: 13 - this.puzzle.ranks[a] });
      if (this.rejected >= 2) this.askForHint();
      return;
    }
    this.take([a, i]);
  }
  private take(move: Removal) {
    this.history.push(this.mask);
    const wasOpen = this.openCards();
    this.mask = remove(this.mask, move);
    this.selected = -1;
    this.hinted = null;
    this.rejected = 0;
    sfx.pop(3);
    const target = this.nodes[move[0]];
    this.ctx.particles.burst(target.x, target.y, {
      kind: 'star',
      colors: [swatch.yellow.fill, swatch.teal.fill],
      count: 10,
    });
    const middle = move.reduce((x, i) => x + this.nodes[i].x, 0) / move.length;
    for (const i of move) this.liftAway(this.nodes[i], middle);
    this.draw();
    // What the removal uncovered is the consequence to notice: each newly open card swells once, with one soft
    // pentatonic step per card, so opening two sounds fuller than opening none.
    const opened = this.openCards().filter((i) => !wasOpen.includes(i));
    opened.forEach((i, k) => {
      this.pulse(this.nodes[i]);
      sfx.bell(5 + 2 * k, 0.14);
    });
    if (!this.mask) {
      this.finished = true;
      sfx.sparkle();
      void this.ctx.say('pyramid.done').then(() => {
        if (this.ctx.alive) this.ctx.finish({ misses: this.misses, hints: this.hints });
      });
    } else if (!this.solve(this.mask)) void this.ctx.say('pyramid.blocked');
  }
  private openCards() {
    return this.puzzle.ranks.map((_, i) => i).filter((i) => exposed(this.puzzle, this.mask, i));
  }
  /** Stop a card's own animations (their promises never resolve) and put it back in its place. */
  private settle(node: Container, i: number) {
    this.ctx.tw.kill(node);
    this.ctx.tw.kill(node.scale);
    node.scale.set(1);
    node.alpha = 1;
    if (this.spots[i]) node.position.copyFrom(this.spots[i]);
  }
  /** A lifted card rises, drifts toward its partner and fades instead of vanishing. */
  private liftAway(node: Container, middle: number) {
    this.settle(node, this.nodes.indexOf(node));
    this.leaving.add(node);
    node.eventMode = 'none';
    void this.ctx.tw.to(node.scale, { x: 1.08, y: 1.08 }, { duration: 0.3 });
    void this.ctx.tw
      .to(node, { y: node.y - 30, x: node.x + (middle - node.x) * 0.3, alpha: 0 }, { duration: 0.3 })
      .then(() => {
        if (!this.leaving.delete(node)) return;
        node.visible = false;
      });
  }
  /** A card the removal just uncovered swells once as it brightens. */
  private pulse(node: Container) {
    this.settle(node, this.nodes.indexOf(node));
    void this.ctx.tw
      .to(node.scale, { x: 1.14, y: 1.14 }, { duration: 0.16, delay: 0.12 })
      .then(() => this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.24 }));
  }
  /** Undo and Start over bring cards back mid-fade: stop every lift and pulse first. */
  private settleAll() {
    this.leaving.clear();
    this.nodes.forEach((node, i) => {
      this.settle(node, i);
      node.eventMode = 'static';
    });
  }
  askForHint() {
    if (!this.ctx.alive || this.finished || this.hinted) return;
    let route = this.solve(this.mask);
    const recovered = route === null;
    while (route === null && this.history.length) {
      this.mask = this.history.pop()!;
      route = this.solve(this.mask);
    }
    if (recovered) this.settleAll();
    this.hinted = route?.[0] ?? null;
    if (!this.hinted) return;
    this.selected = -1;
    this.rejected = 0;
    this.hints++;
    this.draw();
    this.status.text = recovered
      ? 'Returned to a clearing route. Try the gold cards.'
      : 'Try the gold cards.';
    void this.ctx.say(recovered ? 'pyramid.recover' : 'pyramid.hint');
  }
  undo() {
    if (!this.ctx.alive || this.finished) return;
    const before = this.history.pop();
    if (before !== undefined) this.mask = before;
    this.settleAll();
    this.selected = -1;
    this.hinted = null;
    this.rejected = 0;
    sfx.tick();
    this.draw();
  }
  restart() {
    if (!this.ctx.alive || this.finished) return;
    this.mask = fullMask(this.puzzle.rows);
    this.history = [];
    this.settleAll();
    this.selected = -1;
    this.hinted = null;
    this.rejected = 0;
    this.draw();
    void this.ctx.say('pyramid.restart');
  }
  private draw() {
    this.status.text = this.solve(this.mask) ? this.openLine() : 'Try Undo or Hint to revise this route.';
    this.glow.clear();
    this.nodes.forEach((c, i) => {
      if (this.leaving.has(c)) return;
      c.visible = present(this.mask, i);
      c.alpha = exposed(this.puzzle, this.mask, i) ? 1 : 0.6;
      if (!c.visible) return;
      const color = this.hinted?.includes(i)
        ? swatch.yellow.fill
        : this.selected === i
          ? swatch.purple.line
          : exposed(this.puzzle, this.mask, i)
            ? swatch.teal.line
            : null;
      if (color !== null) this.glow.roundRect(c.x - 49, c.y - 49, 98, 98, 16).stroke({ color, width: 5 });
    });
    // Level 5: the covered card a chosen card could take with it is outlined too (what it is, not whether it sums).
    if (this.puzzle.lift && this.selected >= 0)
      for (const b of liftable(this.puzzle, this.mask, this.selected).filter(
        (k) => this.puzzle.ranks[k] !== 13,
      )) {
        const c = this.nodes[b];
        if (this.hinted?.includes(b)) continue;
        this.glow
          .roundRect(c.x - 49, c.y - 49, 98, 98, 16)
          .stroke({ color: swatch.purple.line, width: 3, alpha: 0.7 });
      }
    this.hintButton.alpha = this.hinted ? 0.7 : 1;
  }
  /** What a planner watches: how many pairs the bright cards make now, and whether a king can go alone. */
  private openLine() {
    const open = moves(this.puzzle, this.mask),
      pairs = open.filter((m) => m.length === 2).length,
      king = open.some((m) => m.length === 1);
    return `${pairs} ${pairs === 1 ? 'pair' : 'pairs'} open${king ? ' · a king can go alone' : ''}`;
  }
  resize(v: View) {
    const l = pyramidLayout(v, this.puzzle.rows);
    this.ground.clear().rect(0, 0, v.w, v.h).fill(swatch.teal.light);
    this.ground
      .ellipse(v.w / 2, l.middle, Math.min(380, v.w * 0.45), v.upright ? 330 : v.h * 0.34)
      .fill({ color: cream, alpha: 0.7 });
    this.heading.position.set(v.w / 2, 107);
    this.guide.position.set(v.w / 2, 148);
    this.spots = l.cards;
    this.nodes.forEach((n, i) => {
      if (!this.leaving.has(n)) n.position.copyFrom(l.cards[i]);
    });
    this.status.position.copyFrom(l.status);
    [this.undoButton, this.hintButton, this.againButton].forEach((b, i) => b.position.copyFrom(l.buttons[i]));
    this.draw();
  }
  autotouch(): TouchIntent | null {
    if (!this.ctx.alive || this.finished) return null;
    const move = this.solve(this.mask)?.[0];
    if (!move) return { tap: { on: this.hintButton } };
    const i = move.length === 1 || this.selected !== move[0] ? move[0] : move[1];
    return { tap: { on: this.nodes[i] }, pause: 0.3 };
  }
  update(_dt: number) {}
  destroy() {}
}
/**
 * Card centers (100-unit squares), the status line and the three 164 × 100 buttons. Upright (chunk 31) the pyramid, status
 * and buttons stand together in the middle of the tall view, the buttons clear of the guide's corner.
 */
export function pyramidLayout(v: View, rows: number) {
  const gapY = v.upright ? 104 : Math.min(104, (v.h - 470) / (rows - 1));
  const top = v.upright ? Math.max(225, Math.round((v.h - ((rows - 1) * gapY + 330)) / 2)) : 225;
  const cards: { x: number; y: number }[] = [];
  for (let row = 0; row < rows; row++)
    for (let col = 0; col <= row; col++)
      cards[at(row, col)] = { x: v.w / 2 + (col - row / 2) * 116, y: top + row * gapY };
  const last = top + (rows - 1) * gapY;
  const status = { x: v.w / 2, y: v.upright ? last + 110 : v.h - 157 };
  const buttonY = v.upright ? status.y + 100 : v.h - 80;
  return {
    cards,
    status,
    buttons: [-1, 0, 1].map((i) => ({ x: v.w / 2 + i * 190, y: buttonY })),
    middle: v.upright ? (top + buttonY) / 2 : v.h * 0.5,
  };
}

function icon(seed = 0): Container {
  const c = new Container();
  [6, 7, 13].forEach((rank, i) => {
    const card = cardArt(rank, seed % 2 ? 'purple' : 'teal');
    card.position.set(i === 0 ? 0 : i === 1 ? -56 : 56, i === 0 ? -165 : -55);
    c.addChild(card);
  });
  return c;
}
export const pyramidSolitaire: GameModule = {
  id: 'pyramid-solitaire',
  upright: true,
  name: 'Pyramid Solitaire',
  titleLine: 'game.pyramid-solitaire',
  region: 'puzzle-peaks',
  challenge: 'numbers',
  skills: ['number-complements', 'planning', 'revision'],
  bands: ['grownup'],
  touchDemo: true,
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.lullaby,
  coplayHint:
    'Before lifting a pair, predict which card it will uncover. Can you save a match for that card?',
  offScreen:
    'Draw a small pyramid of numbered paper cards. Lift exposed pairs that make thirteen, or a thirteen by itself.',
  hubIcon: () => new WigglyIcon(icon()),
  sticker: (seed) => {
    const c = icon(seed);
    c.pivot.set(0, -110);
    c.scale.set(0.65);
    return c;
  },
  create: (ctx) => new PyramidSolitaire(ctx),
};
