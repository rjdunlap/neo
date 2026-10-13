import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, ink, RAINBOW, swatch } from '../../art/palette';
import { shapePath, SHAPES } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { HeldDirection, idle, type CouchControls } from '../../engine/controller';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { botTarget, clear, makePuzzle, neighbors, planFor, solve, swap, type Step, type Swap } from './logic';

const LEVELS: BandLevels = { grownup: { min: 1, max: 4 } };
function gem(g: Graphics, kind: number, size: number) {
  const color = swatch[RAINBOW[kind]];
  shapePath(g, SHAPES[kind], size).fill(color.fill).stroke({ width: 4, color: color.line });
}

class GemSwap implements Game {
  readonly puzzle;
  board: number[];
  selected: number | null = null;
  hinted: Swap | null = null;
  cursor = 0;
  misses = 0;
  hints = 0;
  presses = 0;
  busy = false;
  finished = false;
  readonly tray = new Container();
  readonly nodes: Container[] = [];
  readonly undoButton = new Container();
  readonly hintButton = new Container();
  readonly restartButton = new Container();
  private readonly pictures: Graphics[] = [];
  private readonly outlines: Graphics[] = [];
  private readonly tally = label('', 28);
  private readonly help = label('Swap neighbours · make a line of three', 22, ink, '500');
  private readonly held = new HeldDirection();
  private readonly history: number[][] = [];
  private route: Swap[] | null;
  private pending: Step | null = null;
  private wave = 0;
  private clock = 0;
  private pitch = 100;
  private view: View;
  private dead = false;
  private sinceMatch = 0;
  private botWait = 0.4;
  private readonly touch: boolean;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.touch = !ctx.couch;
    this.puzzle = makePuzzle(ctx.level, ctx.rng);
    this.board = [...this.puzzle.board];
    this.route = solve(this.board, this.puzzle.size);
    ctx.stage.addChild(this.tray, this.tally, this.help);
    this.tally.eventMode = this.help.eventMode = 'none';
    this.board.forEach((_, i) => {
      const node = new Container(), background = new Graphics(), picture = new Graphics(), outline = new Graphics();
      node.addChild(background, picture, outline);
      background.eventMode = picture.eventMode = outline.eventMode = 'none';
      if (this.touch) onTap(node, () => this.choose(i), { cooldown: 80 });
      else node.eventMode = 'none';
      this.nodes.push(node); this.pictures.push(picture); this.outlines.push(outline);
      this.tray.addChild(node);
    });
    if (this.touch) {
      for (const [node, text, act] of [
        [this.undoButton, 'Undo ↶', () => this.undo()],
        [this.hintButton, 'Hint ◇', () => this.askForHint()],
        [this.restartButton, 'Restart ↺', () => this.restart()],
      ] as const) {
        node.addChild(tile(150, 88, 'purple'), label(text, 23));
        node.hitArea = new Rectangle(-75, -44, 150, 88);
        onTap(node, act); ctx.stage.addChild(node);
      }
    }
    this.resize(this.view);
  }
  start() { void this.ctx.instruct(this.touch ? 'gem-swap.go' : 'couch.how.gem-swap'); }
  resize(v: View) {
    this.view = v;
    const size = this.puzzle.size;
    this.pitch = Math.min(108, (v.w - 180) / size, (v.h - 290) / size);
    this.tray.position.set(v.w / 2 - (size - 1) * this.pitch / 2, (v.h - 10) / 2 - (size - 1) * this.pitch / 2);
    this.nodes.forEach((n, i) => {
      n.position.set(i % size * this.pitch, Math.floor(i / size) * this.pitch);
      n.hitArea = new Rectangle(-this.pitch / 2, -this.pitch / 2, this.pitch, this.pitch);
      const bg = n.children[0] as Graphics;
      bg.clear().roundRect(-this.pitch / 2 + 3, -this.pitch / 2 + 3, this.pitch - 6, this.pitch - 6, 12)
        .fill(swatch.purple.light).stroke({ width: 2, color: swatch.purple.fill });
    });
    this.tally.position.set(v.w / 2, 64); this.help.position.set(v.w / 2, 105);
    [this.undoButton, this.hintButton, this.restartButton].forEach((n, i) => n.position.set(v.w / 2 + (i - 1) * 170, v.h - 65));
    this.draw();
  }
  private draw() {
    const shown = this.pending?.waves[this.wave];
    const board = shown?.board ?? this.board;
    this.nodes.forEach((_, i) => {
      const g = this.pictures[i].clear();
      if (board[i] >= 0) gem(g, board[i], this.pitch * 0.29);
      g.alpha = shown?.removed.includes(i) ? 0.35 + 0.3 * Math.sin(this.clock * 10) : 1;
      const ring = this.outlines[i].clear();
      const color = this.hinted?.includes(i) ? swatch.orange.line : this.selected === i ? swatch.blue.line : !this.touch && this.cursor === i ? ink : null;
      if (color !== null && !this.finished) ring.roundRect(-this.pitch / 2 + 6, -this.pitch / 2 + 6, this.pitch - 12, this.pitch - 12, 10).stroke({ width: 5, color });
    });
    this.tally.text = `${this.board.filter(k => k >= 0).length} gems · ${this.presses} swaps · best ${this.puzzle.par}`;
    this.help.text = this.pending ? `Line cleared${this.wave ? ' · a falling line!' : ''}` : this.route === null ? 'No clearing route · Undo or Restart to revise' : 'Swap neighbours · make a line of three';
  }
  private choose(i: number) {
    if (this.busy || this.finished || this.dead || this.board[i] < 0) return;
    this.cursor = i;
    if (this.selected === i) { this.selected = null; this.draw(); return; }
    if (this.selected === null || !neighbors(this.selected, i, this.puzzle.size)) {
      this.selected = i; sfx.tick(); this.draw(); return;
    }
    const pair: Swap = [this.selected, i], step = swap(this.board, this.puzzle.size, pair);
    this.selected = null;
    if (!step) {
      this.misses++; this.sinceMatch++;
      sfx.boing(); void this.ctx.say('gem-swap.miss');
      if (this.sinceMatch >= 2) this.askForHint();
      this.draw(); return;
    }
    this.history.push([...this.board]);
    this.presses++; this.sinceMatch = 0; this.hinted = null;
    this.pending = step; this.wave = 0; this.clock = 0; this.busy = true;
    sfx.pop(2); this.draw();
  }
  private undo() {
    if (this.busy || this.finished || this.dead) return;
    const last = this.history.pop();
    if (last) this.board = last;
    this.selected = this.hinted = null; this.sinceMatch = 0;
    this.route = solve(this.board, this.puzzle.size); sfx.tick(); this.draw();
  }
  restart() {
    if (this.busy || this.finished || this.dead) return;
    // Attempts and support remain counted after revision.
    this.hints++;
    this.history.push([...this.board]); this.board = [...this.puzzle.board];
    this.selected = this.hinted = null; this.sinceMatch = 0;
    this.route = solve(this.board, this.puzzle.size); this.draw();
    void this.ctx.say('gem-swap.restart');
  }
  askForHint() {
    if (this.busy || this.finished || this.dead || this.hinted) return;
    if (!this.route) { this.restart(); return; }
    const pair = this.route[0];
    if (!pair) return;
    this.hints++; this.selected = null; this.hinted = pair; this.draw();
    void this.ctx.say('gem-swap.hint');
  }
  update(dt: number) {
    if (this.dead || !this.pending) return;
    this.clock += dt;
    if (this.clock < 0.5) { this.draw(); return; }
    this.clock = 0; this.wave++;
    if (this.wave < this.pending.waves.length) { sfx.pop(3); this.draw(); return; }
    this.board = this.pending.board; this.pending = null; this.busy = false;
    this.route = solve(this.board, this.puzzle.size); this.draw();
    if (clear(this.board)) void this.complete();
    else if (!this.route) void this.ctx.say('gem-swap.stuck');
  }
  private async complete() {
    this.busy = this.finished = true; this.draw();
    this.ctx.pet.cheer(); sfx.tada();
    this.ctx.particles.burst(this.view.w / 2, this.view.h / 2, { kind: 'star', colors: [swatch.yellow.fill, swatch.teal.fill], count: 20 });
    await this.ctx.say('gem-swap.done');
    if (this.dead) return;
    this.ctx.finish({ misses: this.misses, hints: this.hints, score: this.presses - this.puzzle.par });
  }
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.dead) return null;
    const to = botTarget(this.route, this.selected);
    return { tap: { on: to === null ? this.restartButton : this.nodes[to] }, pause: 0.25 };
  }
  control(input: CouchControls, dt: number) {
    if (this.busy || this.finished || this.dead) return;
    const size = this.puzzle.size;
    for (const d of this.held.poll(input, dt)) {
      const x = this.cursor % size, y = Math.floor(this.cursor / size);
      if (d === 0 && x < size - 1) this.cursor++;
      if (d === 1 && y < size - 1) this.cursor += size;
      if (d === 2 && x > 0) this.cursor--;
      if (d === 3 && y > 0) this.cursor -= size;
    }
    if (input.players.some(p => p.action)) this.choose(this.cursor);
    else if (input.players.some(p => p.undo)) this.undo();
    this.draw();
  }
  autoplay(dt: number): CouchControls {
    const out = idle(); this.botWait -= dt;
    if (this.busy || this.finished || this.dead || this.botWait > 0) return out;
    const to = botTarget(this.route, this.selected), p = out.players[0];
    p.active = true;
    if (to === null) { p.undo = true; this.botWait = 0.25; return out; }
    if (to === this.cursor) { p.action = true; this.botWait = 0.25; return out; }
    const size = this.puzzle.size;
    p.direction = this.cursor % size < to % size ? 0 : this.cursor % size > to % size ? 2 : this.cursor < to ? 1 : 3;
    this.botWait = 0.12; return out;
  }
  destroy() { this.dead = true; this.pending = null; }
}
function sticker(seed: number) {
  const c = new Container(), rng = new Rng(seed), kinds = rng.shuffle([0, 1, 2, 3, 4, 5]);
  c.addChild(new Graphics().roundRect(-90, -46, 180, 92, 18).fill(cream).stroke({ width: 5, color: swatch.purple.line }));
  for (let i = 0; i < 3; i++) { const g = new Graphics(); gem(g, kinds[0], 24); g.x = (i - 1) * 56; c.addChild(g); }
  return c;
}
export const gemSwap: GameModule = {
  id: 'gem-swap', name: 'Gem Swap', titleLine: 'game.gem-swap', region: 'puzzle-peaks',
  skills: ['spatial-planning', 'cause-and-effect'], bands: ['grownup'], inputs: ['touch', 'controller'], touchDemo: true,
  levels: band => rangeFor(LEVELS, band), describeLevel: level => planFor(level).name, music: STYLES.lullaby,
  coplayHint: 'Predict which gems will fall after a line disappears. Compare two possible swaps before choosing.',
  offScreen: 'Arrange colored counters in a grid. Exchange neighbours to make a line of three, then slide the counters above into the gaps.',
  hubIcon: () => { const c = sticker(235); c.y = -90; return new WigglyIcon(c); }, sticker,
  create: ctx => new GemSwap(ctx),
};
