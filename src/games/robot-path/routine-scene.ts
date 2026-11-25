import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, ink, swatch } from '../../art/palette';
import { starPoints } from '../../art/shapes';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { RoundButton } from '../../ui/buttons';
import { playIcon, undoIcon } from '../../ui/icons';
import { label } from '../../ui/text';
import { robotArt, tile } from '../shared';
import type { Game, GameContext, TouchIntent } from '../types';
import { arrow, callMark } from './art';
import { routineLayout, type Point } from './layout';
import { DIRECTIONS, type Cell } from './logic';
import {
  applyTile,
  copyEditor,
  limitOf,
  rowOf,
  routinePress,
  nextRoutinePlan,
  runRoutine,
  selectSlot,
  startEditor,
  type Editor,
  type RoutinePlan,
  type Row,
  type Tile,
} from './routine';

const slotKey = (row: Row, i: number) => `${row}${i}`;

/**
 * Level 15, A routine: the Do this row, the Start here row, a call tile and a short walk through a corridor. The editor
 * state is the only thing a rotation or a re-layout has to keep, so everything drawn is rebuilt from it.
 */
export class RoutineRound implements Game {
  readonly plan: RoutinePlan;
  private editor: Editor;
  private readonly history: Editor[] = [];
  private readonly background = new Graphics();
  private readonly grid = new Graphics();
  private readonly robot = robotArt(65);
  private readonly star = new Graphics()
    .poly(starPoints(30, 14))
    .fill(swatch.yellow.fill)
    .stroke({ width: 4, color: swatch.yellow.line });
  private readonly slots = new Container();
  private readonly marks = new Graphics();
  private readonly hint = new Graphics();
  private readonly headings = [label('Do this', 30, swatch.purple.line), label('Start here', 30, ink)];
  private readonly heads = new Container();
  private readonly targets = new Map<string, Container>();
  private readonly palette: { tile: Tile; button: RoundButton }[] = [];
  private readonly undo: RoundButton;
  private readonly play: RoundButton;
  private at: Cell = [0, 0];
  private activeMain = -1;
  private activeSub = -1;
  /** A brief ring on a row or slot that an incomplete try points at (seconds left). */
  private flash: { row: Row | 'main-first' | 'routine-first'; left: number } | null = null;
  private place = routineLayout({ w: 1024, h: 768, scale: 1 });
  private clock = 0;
  running = false;
  done = false;
  misses = 0;
  hints = 0;

  constructor(private readonly ctx: GameContext) {
    this.plan = nextRoutinePlan((count) => ctx.rng.int(0, count - 1));
    this.editor = startEditor(this.plan);
    this.play = new RoundButton(playIcon(), swatch.green, 50, () => void this.run());
    this.undo = new RoundButton(undoIcon(), swatch.white, 50, () => this.undoEdit());
    ctx.stage.addChild(
      this.background,
      this.grid,
      this.star,
      this.robot,
      this.heads,
      this.slots,
      this.marks,
      this.undo,
      this.play,
      this.hint,
    );
    this.heads.addChild(...this.headings);
    this.heads.eventMode = 'none';
    this.marks.eventMode = 'none';
    this.hint.eventMode = 'none';
    const tiles: Tile[] = ['call', 'up', 'left', 'down', 'right'];
    for (const t of tiles) {
      const art = t === 'call' ? callMark() : arrow(t);
      const button = new RoundButton(art, t === 'call' ? swatch.purple : swatch.teal, 50, () =>
        this.press(t),
      );
      ctx.stage.addChild(button);
      this.palette.push({ tile: t, button });
    }
  }

  start() {
    void this.ctx.instruct('robot.routine');
  }

  private snapshot() {
    this.history.push(copyEditor(this.editor));
  }

  /** A palette tap: the selected slot takes the tile, or the try is told what is missing. Incomplete taps are free. */
  private press(tile: Tile) {
    if (this.running || this.done) return;
    const trial = copyEditor(this.editor);
    const result = applyTile(trial, tile);
    if (result === 'needs-routine') {
      this.flash = { row: 'routine-first', left: 1.6 };
      void this.ctx.say('robot.routine.arrows');
      return;
    }
    if (result === 'needs-main') {
      this.flash = { row: 'main', left: 1.6 };
      void this.ctx.say('robot.routine.call');
      return;
    }
    if (result === 'no-slot') {
      sfx.boing();
      return;
    }
    this.snapshot();
    this.editor = trial;
    this.flash = null;
    this.draw();
    sfx.bell(tile === 'call' ? 8 : 5 + DIRECTIONS.indexOf(tile), 0.15);
  }

  private undoEdit() {
    if (this.running || this.done) return;
    const before = this.history.pop();
    if (!before) return;
    this.editor = before;
    this.flash = null;
    this.draw();
    sfx.tick();
  }

  private tapSlot(row: Row, i: number) {
    if (this.running || this.done) return;
    if (selectSlot(this.editor, row, i)) {
      this.draw();
      sfx.tick();
    }
  }

  private position(cell: Cell): { x: number; y: number } {
    return {
      x: this.place.origin[0] + (cell[0] + 0.5) * this.place.cell,
      y: this.place.origin[1] + (cell[1] + 0.5) * this.place.cell,
    };
  }

  private placeRobot() {
    const p = this.position(this.at);
    this.robot.position.set(p.x, p.y + 42);
  }

  private async run() {
    if (this.running || this.done) return;
    const result = runRoutine(this.plan, this.editor.main, this.editor.routine);
    if (result.kind === 'incomplete') {
      if (result.row === 'play') {
        this.flash = { row: 'main-first', left: 1.6 };
        void this.ctx.say('robot.routine.start');
      } else {
        this.flash = { row: 'routine-first', left: 1.6 };
        void this.ctx.say('robot.routine.arrows');
      }
      return;
    }
    this.running = true;
    this.flash = null;
    this.hint.clear();
    for (let i = 1; i < result.path.length; i++) {
      this.activeMain = result.main[i - 1];
      this.activeSub = result.sub[i - 1];
      this.draw();
      this.at = result.path[i];
      const p = this.position(this.at);
      await this.ctx.tw.to(this.robot, { x: p.x, y: p.y + 42 }, { duration: 0.4 });
      sfx.bell(6, 0.12);
    }
    this.activeMain = -1;
    this.activeSub = -1;
    this.draw();
    if (result.success) {
      this.done = true;
      this.ctx.finish({ misses: this.misses, hints: this.hints });
      return;
    }
    this.misses++;
    sfx.boing();
    if (result.stop === 'bump') {
      const x = this.robot.x;
      const speech = this.ctx.say('robot.bump');
      await this.ctx.tw.to(this.robot, { x: x + 12 }, { duration: 0.08 });
      await this.ctx.tw.to(this.robot, { x: x - 12 }, { duration: 0.16 });
      await this.ctx.tw.to(this.robot, { x }, { duration: 0.08 });
      await speech;
    } else {
      await this.ctx.say('robot.short');
    }
    await this.ctx.tw.wait(0.65);
    this.at = [0, 0];
    const p = this.position(this.at);
    await this.ctx.tw.to(this.robot, { x: p.x, y: p.y + 42 }, { duration: 0.4 });
    this.running = false;
    if (this.misses === 2) {
      this.hints++;
      void this.ctx.say('robot.routine.hint');
    }
    this.draw();
  }

  /** The Do this and Start here rows, drawn from the editor state. */
  private draw() {
    this.slots.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.targets.clear();
    const L = this.place;
    const spots = (row: Row): Point[] => (row === 'main' ? L.mainSlots : L.routineSlots);
    for (const row of ['routine', 'main'] as const) {
      for (let i = 0; i < limitOf(row); i++) {
        const have = rowOf(this.editor, row)[i];
        const lit = row === 'main' ? i === this.activeMain : this.activeMain >= 0 && i === this.activeSub;
        const c = new Container();
        const color = lit
          ? 'yellow'
          : have === 'call'
            ? 'purple'
            : have
              ? 'white'
              : row === 'routine'
                ? 'purple'
                : 'teal';
        c.addChild(tile(90, 90, color));
        if (have === 'call') c.addChild(callMark());
        else if (have) c.addChild(arrow(have));
        else {
          c.children[0].alpha = 0.55;
        }
        c.position.set(spots(row)[i].x, spots(row)[i].y);
        c.hitArea = new Rectangle(-50, -50, 100, 100);
        onTap(c, () => this.tapSlot(row, i));
        this.targets.set(slotKey(row, i), c);
        this.slots.addChild(c);
      }
    }
    this.marks.clear();
    // The selected slot wears a ring; the row names sit above their rows.
    if (!this.running) {
      const { row, i } = this.editor.sel;
      const p = spots(row)[i];
      this.marks.roundRect(p.x - 54, p.y - 54, 108, 108, 22).stroke({ width: 7, color: swatch.yellow.line });
    }
    this.headings[0].position.set(L.routineHead.x + 150, L.routineHead.y);
    this.headings[1].position.set(L.mainHead.x + 150, L.mainHead.y);
    this.drawHint();
  }

  private ring(p: Point, r = 62) {
    this.hint.circle(p.x, p.y, r).stroke({ width: 8, color: swatch.yellow.line });
  }

  private drawHint() {
    this.hint.clear();
    if (this.running || this.done) return;
    const L = this.place;
    if (this.flash) {
      const rows = this.flash.row === 'main' ? L.mainSlots : null;
      if (rows) for (const p of rows) this.ring(p, 58);
      else this.ring(this.flash.row === 'main-first' ? L.mainSlots[0] : L.routineSlots[0], 58);
    }
    if (this.misses < 2) return;
    const press = routinePress(this.plan, this.editor);
    const target = this.helpTarget(press);
    this.ring(target);
  }

  private helpTarget(press: ReturnType<typeof routinePress>): Point {
    const L = this.place;
    if ('play' in press) return L.play;
    if ('slot' in press) return (press.slot.row === 'main' ? L.mainSlots : L.routineSlots)[press.slot.i];
    return press.tile === 'call' ? L.call : L.arrows[press.tile];
  }

  /** The ghost finger: fill the chosen board's two rows from the editor's own state, skip what is already right, then play. */
  autotouch(): TouchIntent | null {
    if (this.running || this.done) return null;
    const press = routinePress(this.plan, this.editor);
    if ('play' in press) return { tap: { on: this.play }, pause: 0.35 };
    if ('slot' in press) {
      const c = this.targets.get(slotKey(press.slot.row, press.slot.i));
      return c ? { tap: { on: c }, pause: 0.35 } : null;
    }
    const button = this.palette.find((p) => p.tile === press.tile)!.button;
    return { tap: { on: button }, pause: 0.35 };
  }

  resize(v: View) {
    this.background.clear().rect(0, 0, v.w, v.h).fill(cream);
    this.place = routineLayout(v);
    const L = this.place;
    const g = this.grid.clear();
    const open = new Set(this.plan.corridor.map((c) => c.join(',')));
    for (let y = 0; y < 4; y++)
      for (let x = 0; x < 4; x++) {
        const p = this.position([x, y]);
        const isOpen = open.has(`${x},${y}`);
        g.roundRect(p.x - L.cell / 2 + 4, p.y - L.cell / 2 + 4, L.cell - 8, L.cell - 8, 12)
          .fill(isOpen ? swatch.green.light : swatch.brown.light)
          .stroke({ width: 3, color: isOpen ? swatch.green.fill : swatch.brown.fill });
        if (!isOpen)
          g.poly([p.x - 30, p.y + 20, p.x - 20, p.y - 24, p.x + 12, p.y - 30, p.x + 32, p.y + 16])
            .fill(swatch.brown.fill)
            .stroke({ width: 4, color: swatch.brown.line });
      }
    const goal = this.position(this.plan.goal);
    this.star.position.set(goal.x, goal.y);
    this.robot.scale.set(1);
    this.placeRobot();
    for (const { tile: t, button } of this.palette) {
      const p = t === 'call' ? L.call : L.arrows[t];
      button.position.set(p.x, p.y);
    }
    this.undo.position.set(L.undo.x, L.undo.y);
    this.play.position.set(L.play.x, L.play.y);
    this.draw();
  }

  update(dt: number) {
    this.clock += dt;
    this.hint.alpha = 0.6 + 0.4 * Math.sin(this.clock * 3);
    if (this.flash && (this.flash.left -= dt) <= 0) {
      this.flash = null;
      this.drawHint();
    }
  }

  destroy() {}

  get finished() {
    return this.done;
  }
}
