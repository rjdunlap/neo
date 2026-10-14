import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, ink, swatch, type ColorName } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { at, exposed, fullMask, makePuzzle, present, rankName, remove, solver, planFor, type Removal } from './logic';

const LEVELS: BandLevels = { grownup: { min: 1, max: 3 } };
function cardArt(rank: number, color: ColorName = 'teal'): Container {
  const c = new Container();
  c.addChild(tile(100, 100, 'white'));
  const face = label(rankName(rank), 42, swatch[color].line); face.y = -10;
  const value = label(rank >= 11 || rank === 1 ? `= ${rank}` : '', 19, ink); value.y = 29;
  c.addChild(face, value); c.eventMode = 'none'; return c;
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
  private alive = true;
  private rejected = 0;
  private history: number[] = [];
  private readonly ground = new Graphics();
  private readonly glow = new Graphics();
  private readonly heading = label('Make 13 · clear the pyramid', 34, ink);
  private readonly guide = label('A = 1    J = 11    Q = 12    K = 13 (alone)', 24, ink);
  private readonly status = label('', 24, ink);
  constructor(private readonly ctx: GameContext) {
    this.puzzle = makePuzzle(ctx.level, ctx.rng); this.mask = fullMask(this.puzzle.rows);
    this.solve = solver(this.puzzle);
    for (const g of [this.ground, this.glow, this.heading, this.guide, this.status]) g.eventMode = 'none';
    ctx.stage.addChild(this.ground, this.heading, this.guide, this.status);
    this.puzzle.ranks.forEach((rank, i) => {
      const c = new Container(); c.addChild(cardArt(rank));
      c.hitArea = new Rectangle(-50, -50, 100, 100);
      onTap(c, () => this.choose(i)); this.nodes.push(c); ctx.stage.addChild(c);
    });
    for (const [node, text, action] of [
      [this.undoButton, 'Undo ↶', () => this.undo()],
      [this.hintButton, 'Hint ◇', () => this.askForHint()],
      [this.againButton, 'Start over ↺', () => this.restart()],
    ] as const) {
      node.addChild(tile(164, 100, 'teal'), label(text, 24, ink));
      node.hitArea = new Rectangle(-82, -50, 164, 100);
      onTap(node, action); ctx.stage.addChild(node);
    }
    ctx.stage.addChild(this.glow); this.resize(ctx.view);
  }
  start() { void this.ctx.instruct('pyramid.go'); }
  choose(i: number) {
    if (!this.alive || this.finished || !present(this.mask, i)) return;
    if (!exposed(this.puzzle, this.mask, i)) {
      sfx.tick(); this.status.text = 'Remove both cards directly below this one first.';
      void this.ctx.say('pyramid.covered'); return;
    }
    const rank = this.puzzle.ranks[i];
    if (rank === 13) { this.take([i]); return; }
    if (this.selected === i) { this.selected = -1; this.draw(); sfx.tick(); return; }
    if (this.selected < 0) {
      this.selected = i; sfx.tick(); this.draw();
      void this.ctx.say('pyramid.number', { n: rank }); return;
    }
    const a = this.selected;
    if (this.puzzle.ranks[a] + rank !== 13) {
      this.selected = -1; this.misses++; this.rejected++; sfx.boing(); this.draw();
      this.status.text = `${this.puzzle.ranks[a]} + ${rank} = ${this.puzzle.ranks[a] + rank}. Look for 13.`;
      void this.ctx.say('pyramid.miss', { n: 13 - this.puzzle.ranks[a] });
      if (this.rejected >= 2) this.askForHint(); return;
    }
    this.take([a, i]);
  }
  private take(move: Removal) {
    this.history.push(this.mask); this.mask = remove(this.mask, move);
    this.selected = -1; this.hinted = null; this.rejected = 0; sfx.pop(3); this.draw();
    const target = this.nodes[move[0]];
    this.ctx.particles.burst(target.x, target.y, { kind: 'star', colors: [swatch.yellow.fill, swatch.teal.fill], count: 10 });
    if (!this.mask) {
      this.finished = true; sfx.sparkle();
      void this.ctx.say('pyramid.done').then(() => {
        if (this.alive) this.ctx.finish({ misses: this.misses, hints: this.hints });
      });
    } else if (!this.solve(this.mask)) void this.ctx.say('pyramid.blocked');
  }
  askForHint() {
    if (!this.alive || this.finished || this.hinted) return;
    let route = this.solve(this.mask);
    const recovered = route === null;
    while (route === null && this.history.length) { this.mask = this.history.pop()!; route = this.solve(this.mask); }
    this.hinted = route?.[0] ?? null;
    if (!this.hinted) return;
    this.selected = -1; this.rejected = 0; this.hints++; this.draw();
    this.status.text = recovered ? 'Returned to a clearing route. Try the gold cards.' : 'Try the gold cards.';
    void this.ctx.say(recovered ? 'pyramid.recover' : 'pyramid.hint');
  }
  undo() {
    if (!this.alive || this.finished) return;
    const before = this.history.pop();
    if (before !== undefined) this.mask = before;
    this.selected = -1; this.hinted = null; this.rejected = 0; sfx.tick(); this.draw();
  }
  restart() {
    if (!this.alive || this.finished) return;
    this.mask = fullMask(this.puzzle.rows); this.history = []; this.selected = -1; this.hinted = null; this.rejected = 0;
    this.draw(); void this.ctx.say('pyramid.restart');
  }
  private draw() {
    this.status.text = this.solve(this.mask) ? 'Bright outlines show the cards you can lift.' : 'Try Undo or Hint to revise this route.';
    this.glow.clear();
    this.nodes.forEach((c, i) => {
      c.visible = present(this.mask, i); c.alpha = exposed(this.puzzle, this.mask, i) ? 1 : 0.6;
      if (!c.visible) return;
      const color = this.hinted?.includes(i) ? swatch.yellow.fill : this.selected === i ? swatch.purple.line : exposed(this.puzzle, this.mask, i) ? swatch.teal.line : null;
      if (color !== null) this.glow.roundRect(c.x - 49, c.y - 49, 98, 98, 16).stroke({ color, width: 5 });
    });
    this.hintButton.alpha = this.hinted ? 0.7 : 1;
  }
  resize(v: View) {
    this.ground.clear().rect(0, 0, v.w, v.h).fill(swatch.teal.light);
    this.ground.ellipse(v.w / 2, v.h * 0.5, Math.min(380, v.w * 0.45), v.h * 0.34).fill({ color: cream, alpha: 0.7 });
    this.heading.position.set(v.w / 2, 107); this.guide.position.set(v.w / 2, 148);
    const gapY = Math.min(104, (v.h - 470) / (this.puzzle.rows - 1));
    const top = 225;
    for (let row = 0; row < this.puzzle.rows; row++) for (let col = 0; col <= row; col++)
      this.nodes[at(row, col)].position.set(v.w / 2 + (col - row / 2) * 116, top + row * gapY);
    this.status.position.set(v.w / 2, v.h - 157);
    [this.undoButton, this.hintButton, this.againButton].forEach((b, i) => b.position.set(v.w / 2 + (i - 1) * 190, v.h - 80));
    this.draw();
  }
  autotouch(): TouchIntent | null {
    if (!this.alive || this.finished) return null;
    const move = this.solve(this.mask)?.[0];
    if (!move) return { tap: { on: this.hintButton } };
    const i = move.length === 1 || this.selected !== move[0] ? move[0] : move[1];
    return { tap: { on: this.nodes[i] }, pause: 0.3 };
  }
  update(_dt: number) {}
  destroy() { this.alive = false; }
}
function icon(seed = 0): Container {
  const c = new Container();
  [6, 7, 13].forEach((rank, i) => {
    const card = cardArt(rank, seed % 2 ? 'purple' : 'teal');
    card.position.set(i === 0 ? 0 : i === 1 ? -56 : 56, i === 0 ? -165 : -55); c.addChild(card);
  }); return c;
}
export const pyramidSolitaire: GameModule = {
  id: 'pyramid-solitaire', name: 'Pyramid Solitaire', titleLine: 'game.pyramid-solitaire', region: 'puzzle-peaks',
  skills: ['number-complements', 'planning', 'revision'], bands: ['grownup'], touchDemo: true,
  levels: band => rangeFor(LEVELS, band), describeLevel: level => planFor(level).name, music: STYLES.lullaby,
  coplayHint: 'Before lifting a pair, predict which card it will uncover. Can you save a match for that card?',
  offScreen: 'Draw a small pyramid of numbered paper cards. Lift exposed pairs that make thirteen, or a thirteen by itself.',
  hubIcon: () => new WigglyIcon(icon()),
  sticker: seed => { const c = icon(seed); c.pivot.set(0, -110); c.scale.set(0.65); return c; },
  create: ctx => new PyramidSolitaire(ctx),
};
