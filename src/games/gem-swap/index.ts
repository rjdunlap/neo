import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, ink, RAINBOW, swatch } from '../../art/palette';
import { shapePath, SHAPES } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { HeldDirection, idle, type CouchControls } from '../../engine/controller';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  LEVELS,
  botTarget,
  clear,
  drops,
  makePuzzle,
  neighbors,
  planFor,
  solve,
  STONE,
  swap,
  type Step,
  type Swap,
} from './logic';

function gem(g: Graphics, kind: number, size: number) {
  const color = swatch[RAINBOW[kind]];
  shapePath(g, SHAPES[kind], size).fill(color.fill).stroke({ width: 4, color: color.line });
}

/** A grey stone: a rounded boulder with a darker rim and two cracks, plainly not a gem (no colour, no shape of the six). */
function stone(g: Graphics, pitch: number) {
  const r = pitch / 2 - 8;
  g.roundRect(-r, -r, r * 2, r * 2, r * 0.45)
    .fill(swatch.white.line)
    .stroke({ width: 4, color: ink });
  g.moveTo(-r * 0.5, -r * 0.2)
    .lineTo(-r * 0.15, r * 0.1)
    .lineTo(-r * 0.3, r * 0.45)
    .moveTo(r * 0.25, -r * 0.55)
    .lineTo(r * 0.45, -r * 0.2)
    .stroke({ width: 3, color: ink, alpha: 0.5 });
}

/** A seeded look for the tray: cell tint, cell rim and the plate behind it. Cells and rims avoid the hint (orange) and selection (blue) rings. */
const LOOKS = [
  { name: 'lantern night', cell: swatch.purple.light, rim: swatch.yellow.fill, plate: swatch.purple.line },
  { name: 'autumn', cell: swatch.yellow.light, rim: swatch.brown.fill, plate: swatch.brown.light },
  { name: 'first snow', cell: swatch.white.light, rim: swatch.white.line, plate: swatch.blue.light },
] as const;
/** Each wave: the cleared line pulses, the gems above fall (accelerating, as dropped things do), then squash as they land. */
const PULSE = 0.35,
  FALL = 0.25,
  SQUASH = 0.1,
  WAVE = PULSE + FALL + SQUASH;

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
  readonly look;
  readonly tray = new Container();
  private readonly plate = new Graphics();
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
  private stoneSaid = false;
  private botWait = 0.4;
  /** Touch layout (buttons, tappable gems) until a key or pad is used; couch play never has it. */
  private touch: boolean;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.touch = !ctx.couch;
    this.puzzle = makePuzzle(ctx.level, ctx.rng);
    this.look = ctx.rng.pick(LOOKS);
    this.board = [...this.puzzle.board];
    this.route = solve(this.board, this.puzzle.size);
    this.plate.eventMode = 'none';
    this.tray.addChild(this.plate);
    ctx.stage.addChild(this.tray, this.tally, this.help);
    this.tally.eventMode = this.help.eventMode = 'none';
    this.board.forEach((_, i) => {
      const node = new Container(),
        background = new Graphics(),
        picture = new Graphics(),
        outline = new Graphics();
      node.addChild(background, picture, outline);
      background.eventMode = picture.eventMode = outline.eventMode = 'none';
      onTap(
        node,
        () => {
          if (this.touch) this.choose(i);
        },
        { cooldown: 80 },
      );
      if (!this.touch) node.eventMode = 'none';
      this.nodes.push(node);
      this.pictures.push(picture);
      this.outlines.push(outline);
      this.tray.addChild(node);
    });
    for (const [node, text, act] of [
      [this.undoButton, 'Undo ↶', () => this.undo()],
      [this.hintButton, 'Hint ◇', () => this.askForHint()],
      [this.restartButton, 'Restart ↺', () => this.restart()],
    ] as const) {
      node.addChild(tile(150, 88, 'purple'), label(text, 23));
      node.hitArea = new Rectangle(-75, -44, 150, 88);
      node.visible = this.touch;
      onTap(node, act);
      ctx.stage.addChild(node);
    }
    this.resize(this.view);
  }
  start() {
    void this.ctx.instruct(
      !this.touch
        ? 'couch.how.gem-swap'
        : this.ctx.level === 6
          ? 'gem-swap.long'
          : this.ctx.level === 7
            ? 'gem-swap.stones'
            : 'gem-swap.go',
    );
  }
  resize(v: View) {
    this.view = v;
    const size = this.puzzle.size;
    this.pitch = Math.min(108, (v.w - 180) / size, (v.h - 290) / size);
    this.tray.position.set(
      v.w / 2 - ((size - 1) * this.pitch) / 2,
      (v.h - 10) / 2 - ((size - 1) * this.pitch) / 2,
    );
    this.nodes.forEach((n, i) => {
      n.position.set((i % size) * this.pitch, Math.floor(i / size) * this.pitch);
      n.hitArea = new Rectangle(-this.pitch / 2, -this.pitch / 2, this.pitch, this.pitch);
      const bg = n.children[0] as Graphics;
      bg.clear()
        .roundRect(-this.pitch / 2 + 3, -this.pitch / 2 + 3, this.pitch - 6, this.pitch - 6, 12)
        .fill(this.look.cell)
        .stroke({ width: 3, color: this.look.rim });
    });
    const edge = this.pitch / 2 + 10,
      span = (size - 1) * this.pitch + edge * 2;
    this.plate.clear().roundRect(-edge, -edge, span, span, 22).fill(this.look.plate);
    this.tally.position.set(v.w / 2, 64);
    this.help.position.set(v.w / 2, 105);
    [this.undoButton, this.hintButton, this.restartButton].forEach((n, i) =>
      n.position.set(v.w / 2 + (i - 1) * 170, v.h - 65),
    );
    this.draw();
  }
  private draw() {
    const size = this.puzzle.size,
      shown = this.pending?.waves[this.wave];
    const falling = shown && this.clock >= PULSE;
    const board = !shown
      ? this.board
      : !falling
        ? shown.board
        : (this.pending!.waves[this.wave + 1]?.board ?? this.pending!.board);
    const from = falling ? drops(shown.board, shown.removed, size) : null;
    const fell = Math.min(1, (this.clock - PULSE) / FALL),
      landed = Math.min(1, Math.max(0, (this.clock - PULSE - FALL) / SQUASH));
    this.nodes.forEach((_, i) => {
      const g = this.pictures[i].clear();
      if (board[i] >= 0) gem(g, board[i], this.pitch * 0.29);
      else if (board[i] === STONE) stone(g, this.pitch);
      g.alpha = !falling && shown?.removed.includes(i) ? 0.35 + 0.3 * Math.sin(this.clock * 10) : 1;
      const rows = from && from[i] >= 0 ? Math.floor(i / size) - from[i] : 0;
      g.y = -rows * this.pitch * (1 - fell * fell);
      const squash = rows && fell >= 1 ? 0.1 * Math.sin(landed * Math.PI) : 0;
      g.scale.set(1 + squash * 0.5, 1 - squash);
      const ring = this.outlines[i].clear();
      const color = this.hinted?.includes(i)
        ? swatch.orange.line
        : this.selected === i
          ? swatch.blue.line
          : !this.touch && this.cursor === i
            ? ink
            : null;
      if (color !== null && !this.finished)
        ring
          .roundRect(-this.pitch / 2 + 6, -this.pitch / 2 + 6, this.pitch - 12, this.pitch - 12, 10)
          .stroke({ width: 5, color });
    });
    this.tally.text = `${this.board.filter((k) => k >= 0).length} gems · ${this.presses} swaps · best ${this.puzzle.par}`;
    this.help.text = this.pending
      ? `Line cleared${this.wave ? ' · a falling line!' : ''}`
      : this.route === null
        ? 'No clearing route · Undo or Restart to revise'
        : this.ctx.level === 6
          ? 'Swap neighbours · one swap makes a long line'
          : this.ctx.level === 7
            ? 'Swap neighbours · gems rest on the grey stones'
            : 'Swap neighbours · make a line of three';
  }
  private choose(i: number) {
    if (this.busy || this.finished || this.dead) return;
    // A stone is not a gem she could swap: a spoken reason, no miss, and the selection stays.
    if (this.board[i] === STONE) {
      this.cursor = i;
      sfx.tick();
      // Said once until the next swap, so tapping a stone again does not stack the line.
      if (!this.stoneSaid) void this.ctx.say('gem-swap.stone');
      this.stoneSaid = true;
      this.draw();
      return;
    }
    if (this.board[i] < 0) return;
    this.cursor = i;
    if (this.selected === i) {
      this.selected = null;
      this.draw();
      return;
    }
    if (this.selected === null || !neighbors(this.selected, i, this.puzzle.size)) {
      this.selected = i;
      sfx.tick();
      this.draw();
      return;
    }
    const pair: Swap = [this.selected, i],
      step = swap(this.board, this.puzzle.size, pair);
    this.selected = null;
    if (!step) {
      this.misses++;
      this.sinceMatch++;
      sfx.boing();
      void this.ctx.say('gem-swap.miss');
      if (this.sinceMatch >= 2) this.askForHint();
      this.draw();
      return;
    }
    this.history.push([...this.board]);
    this.presses++;
    this.sinceMatch = 0;
    this.stoneSaid = false;
    this.hinted = null;
    this.pending = step;
    this.wave = 0;
    this.clock = 0;
    this.busy = true;
    sfx.pop(2);
    this.draw();
  }
  private undo() {
    if (this.busy || this.finished || this.dead) return;
    const last = this.history.pop();
    if (last) this.board = last;
    this.selected = this.hinted = null;
    this.sinceMatch = 0;
    this.route = solve(this.board, this.puzzle.size);
    sfx.tick();
    this.draw();
  }
  restart() {
    if (this.busy || this.finished || this.dead) return;
    // Attempts and support remain counted after revision.
    this.hints++;
    this.history.push([...this.board]);
    this.board = [...this.puzzle.board];
    this.selected = this.hinted = null;
    this.sinceMatch = 0;
    this.route = solve(this.board, this.puzzle.size);
    this.draw();
    void this.ctx.say('gem-swap.restart');
  }
  askForHint() {
    if (this.busy || this.finished || this.dead || this.hinted) return;
    if (!this.route) {
      this.restart();
      return;
    }
    const pair = this.route[0];
    if (!pair) return;
    this.hints++;
    this.selected = null;
    this.hinted = pair;
    this.draw();
    void this.ctx.say('gem-swap.hint');
  }
  update(dt: number) {
    if (this.dead || !this.pending) return;
    this.clock += dt;
    if (this.clock < WAVE) {
      this.draw();
      return;
    }
    this.clock = 0;
    this.wave++;
    // A cascade climbs the pentatonic scale, one step a falling line.
    if (this.wave < this.pending.waves.length) {
      sfx.pop(3 + this.wave);
      this.draw();
      return;
    }
    this.board = this.pending.board;
    this.pending = null;
    this.busy = false;
    this.route = solve(this.board, this.puzzle.size);
    this.draw();
    if (clear(this.board)) void this.complete();
    else if (!this.route) void this.ctx.say('gem-swap.stuck');
  }
  private async complete() {
    this.busy = this.finished = true;
    this.draw();
    this.ctx.pet.cheer();
    sfx.tada();
    this.ctx.particles.burst(this.view.w / 2, this.view.h / 2, {
      kind: 'star',
      colors: [swatch.yellow.fill, swatch.teal.fill],
      count: 20,
    });
    await this.ctx.say('gem-swap.done');
    if (this.dead) return;
    this.ctx.finish({ misses: this.misses, hints: this.hints, score: this.presses - this.puzzle.par });
  }
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.dead) return null;
    const to = botTarget(this.route, this.selected);
    return { tap: { on: to === null ? this.restartButton : this.nodes[to] }, pause: 0.25 };
  }
  /** The first key or pad press on the island: the buttons go and the cursor ring shows. Couch play is already here. */
  private useController() {
    if (!this.touch) return;
    this.touch = false;
    for (const b of [this.undoButton, this.hintButton, this.restartButton]) b.visible = false;
    for (const n of this.nodes) n.eventMode = 'none';
    this.draw();
  }

  /** A finger came back after keys: the buttons and tappable gems return. */
  touchReturned() {
    if (this.touch || this.finished || this.dead) return;
    this.touch = true;
    for (const b of [this.undoButton, this.hintButton, this.restartButton]) b.visible = true;
    for (const n of this.nodes) n.eventMode = 'static';
    this.draw();
  }

  control(input: CouchControls, dt: number) {
    this.useController();
    if (this.busy || this.finished || this.dead) return;
    const size = this.puzzle.size;
    for (const d of this.held.poll(input, dt)) {
      const x = this.cursor % size,
        y = Math.floor(this.cursor / size);
      if (d === 0 && x < size - 1) this.cursor++;
      if (d === 1 && y < size - 1) this.cursor += size;
      if (d === 2 && x > 0) this.cursor--;
      if (d === 3 && y > 0) this.cursor -= size;
    }
    if (input.players.some((p) => p.action)) this.choose(this.cursor);
    else if (input.players.some((p) => p.undo)) this.undo();
    this.draw();
  }
  autoplay(dt: number): CouchControls {
    const out = idle();
    this.botWait -= dt;
    if (this.busy || this.finished || this.dead || this.botWait > 0) return out;
    const to = botTarget(this.route, this.selected),
      p = out.players[0];
    p.active = true;
    if (to === null) {
      p.undo = true;
      this.botWait = 0.25;
      return out;
    }
    if (to === this.cursor) {
      p.action = true;
      this.botWait = 0.25;
      return out;
    }
    const size = this.puzzle.size;
    p.direction =
      this.cursor % size < to % size ? 0 : this.cursor % size > to % size ? 2 : this.cursor < to ? 1 : 3;
    this.botWait = 0.12;
    return out;
  }
  destroy() {
    this.dead = true;
    this.pending = null;
  }
}
function sticker(seed: number) {
  const c = new Container(),
    rng = new Rng(seed),
    kinds = rng.shuffle([0, 1, 2, 3, 4, 5]);
  c.addChild(
    new Graphics()
      .roundRect(-90, -46, 180, 92, 18)
      .fill(cream)
      .stroke({ width: 5, color: swatch.purple.line }),
  );
  for (let i = 0; i < 3; i++) {
    const g = new Graphics();
    gem(g, kinds[0], 24);
    g.x = (i - 1) * 56;
    c.addChild(g);
  }
  return c;
}
export const gemSwap: GameModule = {
  id: 'gem-swap',
  liveController: true,
  name: 'Gem Swap',
  titleLine: 'game.gem-swap',
  region: 'puzzle-peaks',
  challenge: 'space',
  skills: ['spatial-planning', 'cause-and-effect'],
  bands: ['grownup'],
  inputs: ['touch', 'controller'],
  touchDemo: true,
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.lullaby,
  coplayHint:
    'Predict which gems will fall after a line disappears. Compare two possible swaps before choosing.',
  offScreen:
    'Arrange colored counters in a grid. Exchange neighbours to make a line of three, then slide the counters above into the gaps.',
  hubIcon: () => {
    const c = sticker(235);
    c.y = -90;
    return new WigglyIcon(c);
  },
  sticker,
  create: (ctx) => new GemSwap(ctx),
};
