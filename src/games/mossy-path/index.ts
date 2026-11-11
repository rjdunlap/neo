import { Container, Graphics, Rectangle } from 'pixi.js';
import { turtleArt } from '../../art/animals';
import { ink, swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import type { FederatedPointerEvent } from 'pixi.js';
import {
  LEVELS,
  berriesOf,
  bloomedCount,
  completion,
  countsMiss,
  goalOf,
  helpFor,
  hintPlan,
  isMaze,
  isPlanLevel,
  leafSpots,
  levelName,
  makeBoard,
  pickLook,
  mazeBack,
  mazeRestart,
  mazeStart,
  mazeTouch,
  moveError,
  needOf,
  neighbours,
  nextToward,
  planGo,
  planTouch,
  routeBetween,
  solved,
  step,
  visitsOf,
  type Look,
  type MazeMove,
  type MazeState,
} from './logic';

const HEADINGS: Record<number, string> = {
  4: 'Walk the turtle to the pond',
  5: 'Walk the turtle to the pond',
  6: 'Find the way to the pond',
  7: 'Get the berry, then the pond',
  9: 'Get both berries, then the pond',
  10: 'Draw the way, then tap the turtle',
};
/** Seconds per tile as the turtle walks a plan. */
const PLAN_PACE = 0.25;

function flower(g: Graphics, x: number, y: number, size: number, color: number) {
  for (let p = 0; p < 5; p++) {
    const a = (p * Math.PI * 2) / 5;
    g.circle(x + Math.cos(a) * size * 0.65, y + Math.sin(a) * size * 0.65, size * 0.5).fill(color);
  }
  g.circle(x, y, size * 0.35).fill(swatch.yellow.fill);
}
/** Flower petals per season: pink and white in spring, amber and yellow in autumn, purple and white crocuses in snow. */
const PETALS: Record<Look['season'], [number, number]> = {
  spring: [swatch.pink.fill, swatch.white.fill],
  autumn: [swatch.orange.fill, swatch.yellow.light],
  snow: [swatch.purple.fill, swatch.white.fill],
};
/** The one berry drawing (bush, carried on the turtle, and the badge): a red berry, a blueberry or a strawberry. */
function drawBerry(g: Graphics, kind: Look['berry'], x: number, y: number, r: number, empty = false) {
  const colour = kind === 'blue' ? swatch.blue : swatch.red,
    line = empty ? colour.line : ink,
    fill = empty ? swatch.white.light : colour.fill;
  if (kind === 'strawberry') {
    r *= 1.25; // a pointed berry reads smaller than a round one of the same radius
    g.poly([
      x - r,
      y - r * 0.5,
      x + r,
      y - r * 0.5,
      x + r * 0.35,
      y + r * 0.8,
      x,
      y + r * 1.05,
      x - r * 0.35,
      y + r * 0.8,
    ])
      .fill(fill)
      .stroke({ width: 3, color: line, join: 'round' });
    if (!empty)
      for (const [sx, sy] of [
        [-0.45, -0.15],
        [0.4, -0.2],
        [0, 0.25],
        [-0.2, 0.6],
        [0.25, 0.55],
      ])
        g.circle(x + sx * r, y + sy * r, r * 0.08).fill(swatch.yellow.fill);
    for (const k of [-1, 0, 1])
      g.ellipse(x + k * r * 0.4, y - r * 0.62, r * 0.28, r * 0.16)
        .fill(swatch.green.fill)
        .stroke({ width: 2, color: swatch.green.line });
    return;
  }
  g.circle(x, y, r).fill(fill).stroke({ width: 3, color: line });
  if (!empty) g.circle(x - r * 0.33, y - r * 0.28, r * 0.25).fill(swatch.white.fill);
  if (kind === 'blue' && !empty) g.circle(x + r * 0.3, y + r * 0.3, r * 0.18).fill(swatch.blue.line);
  g.ellipse(x + r * 0.45, y - r, r * 0.6, r * 0.3)
    .fill(swatch.green.fill)
    .stroke({ width: 2, color: swatch.green.line });
}
class MossyPath implements Game {
  readonly board;
  /** The round's seeded moss season and berry kind, picked after the board. */
  look: Look;
  path: number[];
  readonly nodes: Container[] = [];
  readonly undoButton = new Container();
  readonly hintButton = new Container();
  readonly againButton = new Container();
  private readonly grid = new Container();
  private readonly trail = new Graphics();
  private readonly heading = label('Bloom a trail to the pond', 32, ink);
  private readonly status = label('', 24, ink);
  private readonly buttonGlow = new Graphics();
  private readonly helped = new Set<string>();
  private hintActive = false;
  private consecutive = 0;
  private cell = 110;
  private alive = true;
  finished = false;
  misses = 0;
  hints = 0;
  hinted = -1;
  /* Levels 4–7, the hedge mazes: one touch layer over the board takes taps and slides (drag stepping). */
  readonly maze: boolean;
  maze_: MazeState | null = null;
  readonly pad = new Container();
  private readonly pulse = new Graphics();
  private readonly pawed = new Set<number>();
  private drag: { id: number; cell: number } | null = null;
  private pressed = -1;
  /** Walking back to an earlier trail tile, one step every 0.15 s; taps wait until it arrives. */
  walkTo = -1;
  private walkClock = 0;
  private idle = 0;
  private pulseTime = 0;
  private pulseCells: number[] = [];
  private readonly berryBadge = new Graphics();
  /* Level 10, plan then go: dotted prints drawn from the turtle, walked when she taps the turtle. */
  readonly planning: boolean;
  /** The drawn plan; its first tile is the turtle's, so a plan of one tile is empty. */
  plan: number[] = [];
  /** Plan tiles the Hint drew, shown gold. */
  private readonly goldPrints = new Set<number>();
  private readonly planLayer = new Graphics();
  /** A press that began on the turtle with a plan drawn: lifting without sliding sends the turtle off. */
  private goArmed = false;
  /** The steps of a Go still to walk, one every `PLAN_PACE` seconds; touches and buttons wait until it ends. */
  going: { state: MazeState; move: MazeMove }[] | null = null;
  private goClock = 0;
  private goMisses = 0;
  /** Level 11: whether this round has said that thick moss needs a second visit. */
  private toldThick = false;
  constructor(private readonly ctx: GameContext) {
    this.board = makeBoard(ctx.level, ctx.rng);
    this.look = pickLook(ctx.rng);
    this.path = [this.board.start];
    this.maze = isMaze(ctx.level);
    if (this.board.thick?.length) this.heading.text = 'Cross the thick moss twice';
    this.planning = isPlanLevel(ctx.level);
    this.planLayer.eventMode = 'none';
    this.trail.eventMode = 'none';
    this.buttonGlow.eventMode = 'none';
    this.pulse.eventMode = 'none';
    this.berryBadge.eventMode = 'none';
    if (this.maze) {
      this.maze_ = mazeStart(this.board);
      this.heading.text = HEADINGS[ctx.level] ?? HEADINGS[6];
      this.pad.eventMode = 'static';
      this.pad.on('pointerdown', this.onDown);
      this.pad.on('globalpointermove', this.onMove);
      this.pad.on('pointerup', this.onUp);
      this.pad.on('pointerupoutside', this.onUp);
      this.ctx.listen(window, 'pointerup', this.onUp);
      this.ctx.listen(window, 'pointercancel', this.onCancel, true);
      this.grid.addChild(this.pad);
    }
    for (let i = 0; i < this.board.rows * this.board.cols; i++) {
      const node = new Container();
      if (this.board.tiles.includes(i) && !this.maze) onTap(node, () => this.choose(i));
      else node.eventMode = 'none';
      this.nodes.push(node);
      this.grid.addChild(node);
    }
    this.grid.addChild(this.trail, this.planLayer, this.pulse);
    for (const [node, text, action] of [
      [this.undoButton, 'Undo ↶', () => this.undo()],
      [this.hintButton, 'Hint ◇', () => this.askForHint()],
      [this.againButton, 'Start over ↺', () => this.restart()],
    ] as const) {
      node.addChild(tile(168, 100, 'purple'), label(text, 24, ink));
      onTap(node, action);
    }
    this.heading.eventMode = 'none';
    this.status.eventMode = 'none';
    ctx.stage.addChild(
      this.heading,
      this.status,
      this.berryBadge,
      this.grid,
      this.undoButton,
      this.hintButton,
      this.againButton,
      this.buttonGlow,
    );
    // Levels 4–5 have no misses to recover from, so no buttons: walking back is the undo.
    if (this.maze && ctx.level <= 5)
      for (const b of [this.undoButton, this.hintButton, this.againButton]) b.visible = false;
    this.resize(ctx.view);
  }
  start() {
    void this.ctx.instruct(
      !this.maze
        ? this.board.thick?.length
          ? 'moss.thick-go'
          : 'moss.go'
        : this.planning
          ? 'moss.plan'
          : this.board.berry2 !== undefined
            ? 'moss.maze-berries'
            : this.board.berry !== undefined
              ? 'moss.maze-berry'
              : 'moss.maze',
    );
  }
  private cellAt(global: { x: number; y: number }): number {
    const p = this.grid.toLocal(global),
      c = Math.round(p.x / this.cell),
      r = Math.round(p.y / this.cell);
    return c >= 0 && r >= 0 && c < this.board.cols && r < this.board.rows ? r * this.board.cols + c : -1;
  }
  private lift(at: number) {
    if (this.pressed >= 0) this.nodes[this.pressed].scale.set(1);
    this.pressed = at;
    if (at >= 0 && this.board.tiles.includes(at)) this.nodes[at].scale.set(1.07);
  }
  // The first finger owns the slide; any other finger is ignored until it lifts (palm rejection).
  private readonly onDown = (e: FederatedPointerEvent) => {
    if (!this.alive || this.drag) return;
    const cell = this.cellAt(e.global);
    this.drag = { id: e.pointerId, cell };
    this.lift(cell);
    if (this.planning) {
      if (this.going || this.finished) return;
      // A press on the turtle with a plan drawn waits: lifting sends it off, sliding away draws a fresh plan.
      if (cell === this.path.at(-1) && this.plan.length > 1) this.goArmed = true;
      else if (cell >= 0) this.editPlan(cell, true);
      return;
    }
    if (cell >= 0) this.touchCell(cell, true);
  };
  private readonly onMove = (e: FederatedPointerEvent) => {
    const d = this.drag;
    if (!d || e.pointerId !== d.id || !this.alive || this.walkTo >= 0) return;
    const cell = this.cellAt(e.global);
    if (cell === d.cell || cell < 0) return;
    d.cell = cell;
    this.lift(cell);
    if (this.planning) {
      if (this.going || this.finished) return;
      if (this.goArmed) {
        this.goArmed = false;
        // Only a slide onto a tile beside the turtle starts a fresh plan; any other drift keeps the drawn plan.
        if (!neighbours(this.board, this.path.at(-1)!).includes(cell)) return;
        this.plan = [];
        this.goldPrints.clear();
      }
      // A slide only draws: tiles that are not beside the plan's end are passed over in silence.
      this.editPlan(cell, false);
      return;
    }
    // A slide only takes steps: tiles that are not beside the turtle are passed over in silence.
    const path = this.maze_!.path,
      here = path[path.length - 1];
    if (
      neighbours(this.board, here).includes(cell) &&
      (!path.includes(cell) || cell === path[path.length - 2])
    )
      this.touchCell(cell, false);
  };
  private readonly onUp = (e: { pointerId: number }) => {
    if (this.drag && e.pointerId === this.drag.id) {
      this.drag = null;
      this.lift(-1);
      if (this.goArmed) {
        this.goArmed = false;
        this.go();
      }
    }
  };
  /** A cancelled press (a palm, the system taking the touch) never sends the turtle off. */
  private readonly onCancel = (e: { pointerId: number }) => {
    if (this.drag && e.pointerId === this.drag.id) this.goArmed = false;
    this.onUp(e);
  };
  /** Level 10: a touch while drawing, by tap or by sliding onto the tile. Drawing is never a miss. */
  private editPlan(at: number, tap: boolean) {
    if (!this.alive || this.finished || this.going || !this.maze_) return;
    const { plan, edit } = planTouch(this.board, this.maze_, this.plan, at);
    if (edit === 'ignore') {
      // A tap on the turtle with nothing drawn shows where a plan can start.
      if (tap && at === this.path.at(-1)) this.pulseAt(neighbours(this.board, at));
      return;
    }
    if (edit === 'far') {
      if (tap) {
        this.pulseAt(neighbours(this.board, plan.at(-1)!).filter((z) => !plan.includes(z)));
        void this.ctx.say('moss.far');
      }
      return;
    }
    if (edit === 'erase') {
      this.goldPrints.delete(this.plan.at(-1)!);
      sfx.tick();
    } else sfx.pop(plan.length % 5);
    this.plan = plan;
    this.idle = 0;
    this.draw();
  }
  /** Level 10: tap the turtle to walk the plan. */
  go() {
    if (!this.alive || this.finished || this.going || !this.maze_ || this.plan.length <= 1) return;
    const steps = planGo(this.board, this.ctx.level, this.maze_, this.plan);
    if (!steps.length) return;
    this.going = steps;
    this.goClock = 0;
    this.goMisses = 0;
    this.hintActive = false;
  }
  /** One step of a Go: the turtle moves, the print under it is used up, and the end of the plan says what happened. */
  private walkPlanStep() {
    const next = this.going!.shift()!;
    this.setMaze(next.state);
    this.plan = this.plan.slice(1);
    this.goldPrints.delete(this.path.at(-1)!);
    const move = next.move;
    if (move.kind === 'back') sfx.tick();
    else if (move.kind === 'forward') {
      sfx.pop(this.path.length % 5);
      if (move.progress) this.consecutive = 0;
      if (move.miss) this.goMisses++;
      if (move.pond) {
        this.going = null;
        this.plan = [];
        this.finished = true;
        this.draw();
        void this.ctx.say('moss.done-maze').then(() => {
          if (this.alive) this.ctx.finish({ misses: this.misses, hints: this.hints });
        });
        return;
      }
    }
    if (!this.going!.length) {
      this.going = null;
      this.plan = [];
      this.goldPrints.clear();
      this.hinted = -1;
      if (this.goMisses) {
        // The plan went into a wrong branch: one boing, and each new branch counts once.
        sfx.boing();
        void this.ctx.say('moss.stop');
        for (let i = 0; i < this.goMisses; i++) this.missed();
      } else void this.ctx.say('moss.plan-more');
    }
    this.draw();
  }
  private setMaze(state: MazeState) {
    this.maze_ = state;
    this.path = state.path;
    this.misses = state.misses;
    for (const at of state.path) this.pawed.add(at);
  }
  /** A touch on a maze tile, by tap or by sliding onto it. */
  private touchCell(at: number, tap: boolean) {
    if (!this.alive || this.finished || this.walkTo >= 0 || !this.maze_) return;
    const { state, move } = mazeTouch(this.board, this.ctx.level, this.maze_, at);
    if (move.kind === 'ignore') {
      if (move.far && tap) {
        this.pulseAt(neighbours(this.board, this.path[this.path.length - 1]));
        if (this.ctx.level >= 6) void this.ctx.say('moss.far');
      }
      return;
    }
    if (move.kind === 'walk') {
      if (tap) {
        this.walkTo = move.to;
        this.walkClock = 0.15;
      }
      return;
    }
    this.setMaze(state);
    this.idle = 0;
    this.hintActive = false;
    this.hinted = -1;
    if (move.kind === 'back') {
      sfx.tick();
      this.draw();
      return;
    }
    if (move.kind === 'refuse') {
      sfx.boing();
      void this.ctx.say(this.board.berry2 !== undefined ? 'moss.snack-both' : 'moss.snack');
      this.pulseAt([this.board.pond]);
      if (move.miss) this.missed();
      this.draw();
      return;
    }
    sfx.pop(this.path.length % 5);
    if (move.progress) this.consecutive = 0;
    if (move.pond) {
      this.finished = true;
      this.draw();
      void this.ctx.say('moss.done-maze').then(() => {
        if (this.alive) this.ctx.finish({ misses: this.misses, hints: this.hints });
      });
      return;
    }
    if (move.miss) {
      sfx.boing();
      void this.ctx.say('moss.stop');
      this.missed();
    } else if (move.berry) void this.ctx.say(move.left > 0 ? 'moss.berry-one' : 'moss.berry');
    else if (move.deadEnd && this.ctx.level === 5) {
      void this.ctx.say('moss.hedge');
      this.hinted = this.path[this.path.length - 2];
    }
    this.draw();
  }
  private missed() {
    this.consecutive++;
    if (this.consecutive >= 2) this.showHint(false);
  }
  private pulseAt(cells: number[]) {
    this.pulseCells = cells;
    this.pulseTime = 0.45;
  }
  private mazeNext(): number {
    const s = this.maze_!;
    const here = s.path[s.path.length - 1];
    return nextToward(this.board, here, goalOf(this.board, s.berry, here, s.eaten));
  }
  choose(at: number) {
    if (this.planning) {
      if (at === this.path.at(-1) && this.plan.length > 1) this.go();
      else this.editPlan(at, true);
      return;
    }
    if (this.maze) {
      this.touchCell(at, true);
      return;
    }
    if (!this.alive || this.finished || at === this.path.at(-1)) return;
    const error = moveError(this.board, this.path, at);
    // Level 8: a far tap is free; the tiles she can step to pulse.
    if (error && !countsMiss(this.ctx.level, error)) {
      this.pulseAt(
        neighbours(this.board, this.path.at(-1)!).filter((z) => !moveError(this.board, this.path, z)),
      );
      void this.ctx.say('moss.far');
      return;
    }
    if (error) {
      this.misses++;
      this.consecutive++;
      sfx.boing();
      void this.ctx.say(`moss.${error}`);
      if (this.consecutive >= 2) this.showHint(false);
      return;
    }
    this.path = step(this.board, this.path, at)!;
    this.consecutive = 0;
    this.hintActive = false;
    this.hinted = -1;
    sfx.pop(this.path.length % 5);
    this.draw();
    if (solved(this.board, this.path)) {
      this.finished = true;
      void this.ctx.say('moss.done').then(() => {
        if (this.alive) this.ctx.finish({ misses: this.misses, hints: this.hints });
      });
    } else if (!completion(this.board, this.path)) void this.ctx.say('moss.blocked');
    else if (needOf(this.board, at) > 1 && visitsOf(this.path, at) === 1 && !this.toldThick) {
      // Level 11: the first tuft she flattens each round says it needs a second visit.
      this.toldThick = true;
      void this.ctx.say('moss.thick');
    }
  }
  private showHint(spoken: boolean) {
    if (!this.alive || this.finished) return;
    if (this.planning) {
      if (this.going || !this.maze_) return;
      const prints = hintPlan(this.board, this.maze_);
      if (prints.length <= 1) return;
      const key = this.path.join(',');
      if (!this.helped.has(key)) {
        this.helped.add(key);
        this.hints++;
      }
      this.hintActive = true;
      this.plan = prints;
      this.goldPrints.clear();
      for (const at of prints.slice(1)) this.goldPrints.add(at);
      this.draw();
      if (spoken) void this.ctx.say('moss.hint-plan');
      return;
    }
    if (this.maze) {
      if (this.walkTo >= 0) return;
      const next = this.mazeNext();
      if (next < 0) return;
      const key = `${this.path.join(',')}+${this.maze_!.eaten.join(',')}`;
      if (!this.helped.has(key)) {
        this.helped.add(key);
        this.hints++;
      }
      this.hintActive = true;
      this.hinted = next;
      this.draw();
      if (spoken) void this.ctx.say('moss.hint-maze');
      return;
    }
    const help = helpFor(this.board, this.path);
    if (!help || help.next < 0) return;
    const key = this.path.join(',');
    if (!this.helped.has(key)) {
      this.helped.add(key);
      this.hints++;
    }
    this.hintActive = true;
    this.hinted = help.undo ? -1 : help.next;
    this.draw();
    if (spoken) void this.ctx.say(help.undo ? 'moss.recover' : 'moss.hint');
  }
  askForHint() {
    this.showHint(true);
  }
  private undo() {
    if (!this.alive || this.finished) return;
    // Level 10: Undo erases the plan's last print first, then steps the turtle back.
    if (this.planning) {
      if (this.going) return;
      if (this.plan.length > 1) {
        this.goldPrints.delete(this.plan.at(-1)!);
        this.plan = this.plan.slice(0, -1);
        sfx.tick();
        this.draw();
        return;
      }
    }
    if (this.path.length <= 1) return;
    if (this.maze) {
      if (this.walkTo >= 0) return;
      this.setMaze(mazeBack(this.maze_!));
      this.hinted = -1;
      this.hintActive = false;
      this.idle = 0;
      sfx.tick();
      this.draw();
      return;
    }
    this.path = this.path.slice(0, -1);
    this.consecutive = 0;
    this.hinted = -1;
    if (this.hintActive) {
      const help = helpFor(this.board, this.path);
      this.hinted = help && !help.undo ? help.next : -1;
    }
    sfx.tick();
    this.draw();
  }
  restart() {
    if (!this.alive || this.finished) return;
    if (this.maze) {
      this.walkTo = -1;
      this.going = null;
      this.goArmed = false;
      this.plan = [];
      this.goldPrints.clear();
      this.setMaze(mazeRestart(this.board, this.maze_!));
      this.hintActive = false;
      this.hinted = -1;
      this.idle = 0;
      this.draw();
      void this.ctx.say('moss.restart');
      return;
    }
    this.path = [this.board.start];
    this.consecutive = 0;
    this.hintActive = false;
    this.hinted = -1;
    this.draw();
    void this.ctx.say('moss.restart');
  }
  private draw() {
    const last = this.path.at(-1)!;
    this.nodes.forEach((node, at) => {
      node.removeChildren().forEach((c) => c.destroy({ children: true }));
      const g = new Graphics(),
        half = this.cell / 2 - 5;
      g.eventMode = 'none';
      if (!this.board.tiles.includes(at) && this.maze) {
        // A clipped hedge, taller than the moss, so the corridors read without colour.
        g.roundRect(-half, -half - 10, half * 2, half * 2 + 10, 16)
          .fill(swatch.green.line)
          .stroke({ width: 3, color: ink });
        for (let k = 0; k < 3; k++)
          g.circle(-half * 0.62 + k * half * 0.62, -half - 8, half * 0.3)
            .fill(swatch.green.line)
            .stroke({ width: 3, color: ink });
        g.roundRect(-half + 2, -half - 2, half * 2 - 4, 12, 6).fill(swatch.green.line);
        if (this.look.season === 'autumn')
          for (const [sx, sy] of leafSpots(at))
            g.ellipse(sx * half * 0.8, -half - 6 + sy * 8, 9, 6)
              .fill(swatch.orange.fill)
              .stroke({ width: 2, color: swatch.orange.line });
        if (this.look.season === 'snow') {
          // A snowy top a quarter of the hedge's height, over the clipped bumps.
          for (let k = 0; k < 3; k++)
            g.circle(-half * 0.62 + k * half * 0.62, -half - 8, half * 0.3).fill(swatch.white.fill);
          g.roundRect(-half, -half - 10, half * 2, (half * 2 + 10) * 0.25, 14)
            .fill(swatch.white.fill)
            .stroke({ width: 2, color: swatch.white.line });
        }
        node.addChild(g);
        return;
      }
      if (!this.board.tiles.includes(at)) {
        g.ellipse(0, 8, half * 0.65, half * 0.48)
          .fill(swatch.white.line)
          .stroke({ width: 3, color: ink });
        g.ellipse(-8, -1, half * 0.38, half * 0.15).fill(swatch.white.light);
        node.addChild(g);
        return;
      }
      // Thick moss (level 11) blooms only on its second visit; after the first it lies flattened.
      const visits = visitsOf(this.path, at),
        thick = needOf(this.board, at) > 1,
        visited = visits >= needOf(this.board, at),
        pond = at === this.board.pond;
      g.roundRect(-half, -half, half * 2, half * 2, 20)
        .fill(pond ? swatch.blue.light : visited || visits ? swatch.green.light : swatch.green.fill)
        .stroke({ width: 3, color: pond ? swatch.blue.line : swatch.green.line });
      if (pond) {
        g.ellipse(0, 0, half * 0.8, half * 0.65).fill(swatch.blue.fill);
        g.ellipse(0, 4, half * 0.5, half * 0.32).stroke({ width: 3, color: swatch.blue.light });
        g.circle(half * 0.48, -half * 0.32, half * 0.23).fill(swatch.green.fill);
      } else if (visited) {
        const [a, b] = PETALS[this.look.season];
        flower(g, -half * 0.6, half * 0.55, 9, a);
        flower(g, half * 0.55, -half * 0.5, 8, b);
        if (thick) flower(g, 0, 0, 13, a);
      } else if (thick && visits) {
        // Flattened: the tall blades lie down, waiting for the second visit.
        for (const y of [-half * 0.3, half * 0.05, half * 0.4])
          g.moveTo(-half * 0.6, y + 6)
            .quadraticCurveTo(0, y - 6, half * 0.6, y + 4)
            .stroke({ width: 6, color: swatch.green.line, cap: 'round' });
      } else if (thick) {
        // A tall tuft, its blades reaching past the tile's middle: taller than plain moss, so it reads without colour.
        for (const x of [-half * 0.5, -half * 0.17, half * 0.17, half * 0.5])
          g.moveTo(x - 9, half * 0.6)
            .lineTo(x, -half * 0.7)
            .lineTo(x + 9, half * 0.6)
            .closePath()
            .fill(swatch.green.line)
            .stroke({ width: 3, color: ink });
      } else if (this.maze && berriesOf(this.board).includes(at) && !this.maze_!.eaten.includes(at)) {
        drawBerry(g, this.look.berry, 0, 6, half * 0.36);
      } else if (this.maze && this.pawed.has(at)) {
        // A faint paw print where the turtle has been: it means nothing to the rules.
        for (const [x, y] of [
          [-10, 6],
          [10, -6],
        ]) {
          g.ellipse(x, y, 7, 9).fill({ color: swatch.green.line, alpha: 0.35 });
        }
      } else {
        for (const x of [-half * 0.5, half * 0.45])
          g.moveTo(x - 7, 12)
            .lineTo(x, 0)
            .lineTo(x + 7, 12)
            .stroke({ width: 3, color: swatch.green.line });
      }
      if (at === this.hinted)
        g.roundRect(-half - 2, -half - 2, half * 2 + 4, half * 2 + 4, 20).stroke({
          width: 6,
          color: swatch.yellow.fill,
        });
      node.addChild(g);
      if (at === last) {
        node.addChild(turtleArt(this.cell * 0.72));
        const carried = this.maze_?.eaten.length ?? 0;
        if (carried) {
          const b = new Graphics();
          b.eventMode = 'none';
          for (let i = 0; i < carried; i++)
            drawBerry(
              b,
              this.look.berry,
              (i - (carried - 1) / 2) * this.cell * 0.2,
              -this.cell * 0.2,
              this.cell * 0.1,
            );
          node.addChild(b);
        }
      }
    });
    this.trail.clear();
    for (let i = 1; i < this.path.length; i++) {
      const a = this.nodes[this.path[i - 1]],
        b = this.nodes[this.path[i]];
      this.trail
        .moveTo(a.x, a.y)
        .lineTo(b.x, b.y)
        .stroke({ width: 6, color: swatch.yellow.line, alpha: 0.55 });
    }
    // Keep the route behind the turtle and flowers, and decorative art outside hit testing.
    this.grid.setChildIndex(this.trail, 0);
    this.drawPlan();
    this.berryBadge.clear();
    if (this.maze) {
      this.status.text = '';
      // One badge slot per berry, filled once it is eaten.
      const berries = berriesOf(this.board),
        eaten = this.maze_!.eaten.length;
      berries.forEach((_, i) =>
        drawBerry(
          this.berryBadge,
          this.look.berry,
          this.status.x + (i - (berries.length - 1) / 2) * 44,
          this.status.y,
          16,
          i >= eaten,
        ),
      );
    } else {
      const blocked = !solved(this.board, this.path) && !completion(this.board, this.path);
      const rule = this.board.thick?.length ? 'Thick moss twice, the rest once; pond last' : 'Visit each tile once; pond last';
      this.status.text = `${bloomedCount(this.board, this.path)} / ${this.board.tiles.length} bloomed · ${blocked ? 'Try Undo to change the trail' : rule}`;
    }
    this.buttonGlow.clear();
    if (this.hintActive && this.hinted < 0 && !this.planning)
      this.buttonGlow
        .roundRect(this.undoButton.x - 88, this.undoButton.y - 54, 176, 108, 20)
        .stroke({ width: 6, color: swatch.yellow.fill });
  }
  /**
   * Level 10's plan, above the tiles and the turtle: a dotted line from print to print and a paw print on each planned
   * tile, white with an ink edge (unlike the faint green prints where the turtle has been), gold where the Hint drew it.
   */
  private drawPlan() {
    const g = this.planLayer;
    g.clear();
    if (!this.planning || this.plan.length <= 1) return;
    this.grid.setChildIndex(g, this.grid.children.length - 1);
    const dots = Math.max(3, Math.round(this.cell / 22));
    for (let i = 1; i < this.plan.length; i++) {
      const a = this.nodes[this.plan[i - 1]],
        b = this.nodes[this.plan[i]];
      for (let k = 1; k < dots; k++) {
        const t = k / dots;
        g.circle(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, 4.5)
          .fill(swatch.white.fill)
          .stroke({ width: 2, color: ink });
      }
    }
    for (const at of this.plan.slice(1)) {
      const n = this.nodes[at],
        gold = this.goldPrints.has(at),
        fill = gold ? swatch.yellow.fill : swatch.white.fill,
        line = gold ? swatch.yellow.line : ink,
        s = this.cell / 110;
      g.ellipse(n.x, n.y + 6 * s, 14 * s, 12 * s)
        .fill(fill)
        .stroke({ width: 3, color: line });
      for (const [tx, ty] of [
        [-13, -9],
        [-4, -16],
        [5, -16],
        [14, -9],
      ])
        g.circle(n.x + tx * s, n.y + ty * s, 5 * s)
          .fill(fill)
          .stroke({ width: 2, color: line });
    }
  }
  resize(v: View) {
    this.cell = Math.min(132, (v.h - 330) / this.board.rows, (v.w - 320) / this.board.cols);
    this.grid.position.set(
      v.w / 2 - ((this.board.cols - 1) * this.cell) / 2,
      v.h / 2 + 12 - ((this.board.rows - 1) * this.cell) / 2,
    );
    this.pad.hitArea = new Rectangle(
      -this.cell / 2,
      -this.cell / 2,
      this.board.cols * this.cell,
      this.board.rows * this.cell,
    );
    this.nodes.forEach((node, at) => {
      node.position.set((at % this.board.cols) * this.cell, Math.floor(at / this.board.cols) * this.cell);
      node.hitArea = new Rectangle(-this.cell / 2, -this.cell / 2, this.cell, this.cell);
    });
    this.heading.position.set(v.w / 2, 110);
    this.status.position.set(v.w / 2, 154);
    [this.undoButton, this.hintButton, this.againButton].forEach((node, i) =>
      node.position.set(v.w / 2 + (i - 1) * 192, v.h - 80),
    );
    this.draw();
  }
  autotouch(): TouchIntent | null {
    if (!this.alive || this.finished) return null;
    if (this.planning) {
      if (this.going) return null;
      const here = this.path[this.path.length - 1];
      // One trace along the way to the pond, then a tap on the turtle to go.
      if (this.plan.at(-1) === this.board.pond)
        return { tap: { on: this.nodes[here] }, receiver: this.pad, pause: 0.6 };
      const route = routeBetween(this.board, here, this.board.pond);
      return {
        trace: { on: this.nodes[here] },
        via: route.slice(1).map((at) => ({ on: this.nodes[at] })),
        receiver: this.pad,
        pause: 0.5,
      };
    }
    if (this.maze) {
      if (this.walkTo >= 0) return null;
      const here = this.path[this.path.length - 1];
      // Level 4 shows the slide: one stroke along the whole way; later levels tap each next tile, looking ahead.
      if (this.ctx.level === 4) {
        const route = routeBetween(this.board, here, this.board.pond);
        return {
          trace: { on: this.nodes[here] },
          via: route.slice(1).map((at) => ({ on: this.nodes[at] })),
          receiver: this.pad,
          pause: 0.6,
        };
      }
      const next = this.mazeNext();
      return next >= 0 ? { tap: { on: this.nodes[next] }, receiver: this.pad, pause: 0.4 } : null;
    }
    const help = helpFor(this.board, this.path);
    return help && help.next >= 0
      ? { tap: { on: help.undo ? this.undoButton : this.nodes[help.next] }, pause: 0.4 }
      : null;
  }
  update(dt: number) {
    if (!this.alive || this.finished) return;
    this.pulse.clear();
    if (this.pulseTime > 0) {
      this.pulseTime -= dt;
      const a = Math.max(0, this.pulseTime / 0.45),
        half = this.cell / 2 - 3;
      for (const at of this.pulseCells) {
        const n = this.nodes[at];
        this.pulse
          .roundRect(n.x - half, n.y - half, half * 2, half * 2, 20)
          .stroke({ width: 6, color: swatch.yellow.fill, alpha: a });
      }
    }
    if (!this.maze) return;
    if (this.going) {
      this.goClock -= dt;
      if (this.goClock <= 0) {
        this.goClock = PLAN_PACE;
        this.walkPlanStep();
      }
      return;
    }
    if (this.walkTo >= 0) {
      this.walkClock -= dt;
      if (this.walkClock <= 0) {
        this.walkClock = 0.15;
        this.setMaze(mazeBack(this.maze_!));
        this.hinted = -1;
        this.hintActive = false;
        this.idle = 0;
        sfx.tick();
        if (this.path.length - 1 <= this.walkTo) this.walkTo = -1;
        this.draw();
      }
    }
    // Levels 4–5: after a pause, the next tile glows as a pace cue (never counted as a hint).
    if (this.ctx.level <= 5 && this.walkTo < 0 && this.hinted < 0) {
      this.idle += dt;
      if (this.idle >= 4) {
        this.idle = 0;
        this.hinted = this.mazeNext();
        this.draw();
      }
    }
  }
  destroy() {
    this.alive = false;
  }
}
function iconArt(seed = 0): Container {
  const c = new Container(),
    g = new Graphics();
  g.eventMode = 'none';
  g.roundRect(-90, -170, 180, 170, 24)
    .fill(swatch.green.light)
    .stroke({ width: 5, color: swatch.green.line });
  flower(g, -58, -42, 16, seed % 2 ? swatch.purple.fill : swatch.pink.fill);
  flower(g, 60, -132, 14, swatch.white.fill);
  c.addChild(g);
  const t = turtleArt(140);
  t.position.set(0, -80);
  c.addChild(t);
  return c;
}
export const mossyPath: GameModule = {
  id: 'mossy-path',
  name: 'Mossy Path',
  titleLine: 'game.mossy-path',
  region: 'puzzle-peaks',
  challenge: 'space',
  skills: ['spatial-reasoning', 'planning', 'path-coverage', 'maze-planning'],
  bands: ['toddler', 'preschool', 'prek', 'school'],
  touchDemo: true,
  levels: (band) => rangeFor(LEVELS, band),
  // School opens on the one-step maze (6); a saved 4 or 5 from a younger band starts school there, not at the hardest patch.
  entryLevels: [4, 5, 6],
  describeLevel: levelName,
  music: STYLES.lullaby,
  coplayHint:
    'One person points out a tile that might be cut off; the other chooses the next step. Swap jobs after Undo. In a maze, point at each fork and guess together which way keeps going.',
  offScreen:
    'Draw a small grid on paper. Walk a toy turtle through every square once, ending at a blue pond. Cross out two squares as rocks. Draw a maze with one wrong turn for each other; trace it with a finger first.',
  hubIcon: () => new WigglyIcon(iconArt()),
  sticker: (seed) => {
    const c = iconArt(seed);
    c.pivot.set(0, -85);
    c.scale.set(0.7);
    return c;
  },
  create: (ctx) => new MossyPath(ctx),
};
