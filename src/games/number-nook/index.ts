import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, ink, swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { goal, makeBoard, planFor, slide, solutionStep, solved } from './logic';

function numberArt(value: number, size: number, correct = false): Container {
  const c = new Container();
  c.addChild(tile(size - 8, size - 8, correct ? 'teal' : 'purple'), label(String(value), size * 0.4, ink));
  c.eventMode = 'none';
  return c;
}
class NumberNook implements Game {
  readonly plan;
  board: number[];
  readonly initial: number[];
  readonly nodes: Container[] = [];
  readonly undoButton = new Container();
  readonly hintButton = new Container();
  readonly againButton = new Container();
  private readonly grid = new Container();
  private readonly target = new Container();
  private readonly glow = new Graphics();
  private readonly heading = label('Put the numbers in order', 32, ink);
  private readonly status = label('', 23, ink);
  private readonly targetLabel = label('Your goal', 22, ink);
  private history: number[][] = [];
  private cell = 120;
  private view: View;
  private alive = true;
  finished = false;
  misses = 0;
  hints = 0;
  hinted = -1;
  moves = 0;
  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.board = makeBoard(ctx.level, ctx.rng);
    this.initial = this.board.slice();
    this.view = ctx.view;
    this.grid.addChild(this.glow);
    this.glow.eventMode = 'none';
    for (let i = 0; i < this.board.length; i++) {
      const node = new Container();
      node.hitArea = new Rectangle(-60, -60, 120, 120);
      onTap(node, () => this.choose(i));
      this.nodes.push(node); this.grid.addChild(node);
    }
    for (const [node, text, action] of [
      [this.undoButton, 'Undo ↶', () => this.undo()],
      [this.hintButton, 'Hint ◇', () => this.askForHint()],
      [this.againButton, 'Start over ↺', () => this.restart()],
    ] as const) {
      node.addChild(tile(160, 100, 'purple'), label(text, 24, ink));
      onTap(node, action);
    }
    for (const part of [this.heading, this.status, this.target, this.targetLabel]) part.eventMode = 'none';
    ctx.stage.addChild(this.heading, this.status, this.grid, this.target, this.targetLabel, this.undoButton, this.hintButton, this.againButton);
    this.resize(this.view);
  }
  start() { void this.ctx.instruct('nook.go'); }
  choose(at: number) {
    if (this.finished || !this.alive || this.board[at] === 0) return;
    const next = slide(this.board, this.plan.cols, at);
    if (!next) {
      this.misses++; sfx.boing(); void this.ctx.say('nook.miss');
      if (this.misses % 2 === 0) this.showHint(false);
      return;
    }
    this.history.push(this.board.slice()); this.board = next; this.moves++; this.hinted = -1;
    sfx.pop(3); this.draw();
    if (solved(this.board)) {
      this.finished = true;
      void this.ctx.say('nook.done').then(() => {
        if (this.alive) this.ctx.finish({ misses: this.misses, hints: this.hints });
      });
    }
  }
  private draw() {
    this.nodes.forEach((node, i) => {
      node.removeChildren().forEach(c => c.destroy({ children: true }));
      const value = this.board[i];
      node.addChild(value ? numberArt(value, this.cell, value === i + 1) : new Graphics().roundRect(-this.cell / 2 + 4, -this.cell / 2 + 4, this.cell - 8, this.cell - 8, 18).fill(cream).stroke({ width: 3, color: swatch.teal.line }));
    });
    this.status.text = `${this.moves} slides · green tiles are in place`;
    this.glow.clear();
    if (this.hinted >= 0) {
      const node = this.nodes[this.hinted];
      this.glow.roundRect(node.x - this.cell / 2, node.y - this.cell / 2, this.cell, this.cell, 20).stroke({ width: 6, color: swatch.yellow.fill });
    }
  }
  private showHint(spoken: boolean) {
    const step = solutionStep(this.board, this.plan.cols);
    if (!step || step.next < 0) return;
    this.hinted = step.next; this.hints++; this.draw();
    if (spoken) void this.ctx.say('nook.hint');
  }
  askForHint() { if (!this.finished) this.showHint(true); }
  private undo() {
    if (this.finished) return;
    const before = this.history.pop();
    if (before) { this.board = before; this.hinted = -1; this.draw(); sfx.tick(); }
  }
  restart() {
    if (this.finished) return;
    this.board = this.initial.slice(); this.history = []; this.hinted = -1; this.draw();
    void this.ctx.say('nook.restart');
  }
  resize(v: View) {
    this.view = v;
    this.cell = Math.min(136, (v.h - 340) / this.plan.rows, (v.w - 420) / this.plan.cols);
    this.grid.position.set(v.w / 2 - this.plan.cols * this.cell / 2 + this.cell / 2 - 30, 180 + this.cell / 2);
    this.nodes.forEach((node, i) => {
      node.position.set(i % this.plan.cols * this.cell, Math.floor(i / this.plan.cols) * this.cell);
      node.hitArea = new Rectangle(-this.cell / 2, -this.cell / 2, this.cell, this.cell);
    });
    this.heading.position.set(v.w / 2, 112);
    this.status.position.set(v.w / 2, 155);
    const tx = this.grid.x + (this.plan.cols - 0.5) * this.cell + 120;
    this.targetLabel.position.set(tx, 205);
    this.target.position.set(tx - (this.plan.cols - 1) * 25, 250);
    this.target.removeChildren().forEach(c => c.destroy({ children: true }));
    goal(this.plan.rows, this.plan.cols).forEach((value, i) => {
      const art = value ? numberArt(value, 50, true) : new Graphics().roundRect(-21, -21, 42, 42, 8).fill(cream).stroke({ width: 2, color: swatch.teal.line });
      art.position.set(i % this.plan.cols * 50, Math.floor(i / this.plan.cols) * 50);
      this.target.addChild(art);
    });
    [this.undoButton, this.hintButton, this.againButton].forEach((node, i) => node.position.set(v.w / 2 + (i - 1) * 184, v.h - 110));
    this.draw();
  }
  autotouch(): TouchIntent | null {
    if (this.finished) return null;
    const step = solutionStep(this.board, this.plan.cols);
    return step && step.next >= 0 ? { tap: { on: this.nodes[step.next] }, pause: 0.5 } : null;
  }
  update(_dt: number) {}
  destroy() { this.alive = false; }
}
function iconArt(seed = 0) {
  const c = new Container();
  [1, 2, 3].forEach((v, i) => {
    const art = numberArt(v, 94, (seed + i) % 2 === 0);
    art.position.set((i % 2) * 100 - 50, Math.floor(i / 2) * 100 - 150); c.addChild(art);
  });
  c.addChild(new Graphics().roundRect(7, -93, 86, 86, 15).fill(cream).stroke({ width: 4, color: swatch.teal.line }));
  return c;
}
export const numberNook: GameModule = {
  id: 'number-nook', name: 'Number Nook', titleLine: 'game.number-nook', region: 'puzzle-peaks',
  skills: ['spatial-reasoning', 'planning', 'number-order'], bands: ['grownup'], touchDemo: true,
  levels: band => rangeFor({ grownup: { min: 1, max: 3 } }, band),
  describeLevel: level => planFor(level).name, music: STYLES.lullaby,
  coplayHint: 'Plan together: which tile needs the empty space next? A green tile can still move.',
  offScreen: 'Arrange numbered paper squares on a tray with one empty space. Slide one neighbour into the gap at a time.',
  hubIcon: () => new WigglyIcon(iconArt()),
  sticker: seed => { const c = iconArt(seed); c.pivot.set(0, -100); c.scale.set(0.65); return c; },
  create: ctx => new NumberNook(ctx),
};
