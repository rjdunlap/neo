import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, ink, swatch } from '../../art/palette';
import { starPoints } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { idle, type CouchControls } from '../../engine/controller';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { RoundButton } from '../../ui/buttons';
import { againIcon, arrowIcon, playIcon } from '../../ui/icons';
import { label } from '../../ui/text';
import { robotArt, tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { DELTAS, DIRECTIONS, expand, nextPress, ROBOT_PLANS, runPath, shortestPath, slotOfStep, type Cell, type Direction, type RobotPlan, type Slot } from './logic';

/** Levels 1–6 are the original one-step-per-slot programs; 7–10 add counted steps, then loops. */
const PREK_TOP = 6;
const planFor = (level: number) => ROBOT_PLANS[Math.max(0, Math.min(ROBOT_PLANS.length - 1, level - 1))];

/** The stick's directions as the controller reports them: 0 right, 1 down, 2 left, 3 up. */
const STICK_DIRECTIONS: Direction[] = ['right', 'down', 'left', 'up'];

function arrow(dir: Direction) {
  const g = arrowIcon(1);
  g.rotation = (DIRECTIONS.indexOf(dir) * Math.PI) / 2 - Math.PI / 2;
  return g;
}

class RobotPath implements Game {
  readonly plan: RobotPlan;
  readonly mode: 'steps' | 'counts' | 'loop';
  readonly program: Slot[] = [];
  /** How many times the whole program runs (loop levels). */
  loop = 1;
  readonly solution: Slot[];
  readonly arrows: { dir: Direction; button: RoundButton }[] = [];
  readonly loopButton: RoundButton;
  private readonly background = new Graphics();
  private readonly grid = new Graphics();
  private readonly robot = robotArt(65);
  private readonly star = new Graphics().poly(starPoints(30, 14)).fill(swatch.yellow.fill).stroke({ width: 4, color: swatch.yellow.line });
  private readonly queue = new Container();
  private readonly hint = new Graphics();
  private readonly loopLabel = label('×1', 30, ink);
  private readonly play: RoundButton;
  private readonly clear: RoundButton;
  private cell = 110;
  private origin: Cell = [160, 155];
  private view: View;
  running = false;
  done = false;
  misses = 0;
  hints = 0;
  /** The slot the robot is carrying out, lit up during playback. */
  private active = -1;
  private clock = 0;
  private botWait = 1.5;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.mode = this.plan.mode ?? 'steps';
    this.solution = this.plan.solution?.slots ?? shortestPath(this.plan).map((dir) => ({ dir, n: 1 }));
    this.play = new RoundButton(playIcon(), swatch.green, 50, () => void this.run());
    this.clear = new RoundButton(againIcon(), swatch.white, 50, () => {
      if (this.running || this.done) return;
      this.program.length = 0;
      this.loop = 1;
      this.drawQueue();
      void ctx.say('robot.clear');
    });
    // The loop button: each tap repeats the whole program one more time (×1 to ×4).
    const loopArt = new Container();
    loopArt.addChild(againIcon(), this.loopLabel);
    this.loopLabel.position.set(0, 40);
    this.loopLabel.style.fontSize = 22;
    this.loopButton = new RoundButton(loopArt, swatch.purple, 54, () => {
      if (this.running || this.done) return;
      this.loop = (this.loop % 4) + 1;
      sfx.bell(3 + this.loop, 0.2);
      this.drawQueue();
    });
    this.loopButton.visible = this.mode === 'loop';
    ctx.stage.addChild(this.background, this.grid, this.star, this.robot, this.queue, this.play, this.clear, this.loopButton, this.hint);
    this.hint.eventMode = 'none';
    for (const dir of DIRECTIONS) {
      const button = new RoundButton(arrow(dir), swatch.teal, 50, () => this.add(dir));
      ctx.stage.addChild(button);
      this.arrows.push({ dir, button });
    }
  }

  start() {
    void this.ctx.instruct(this.mode === 'loop' ? 'robot.loop' : this.mode === 'counts' ? 'robot.counts' : 'robot.start');
  }

  /** An arrow tap: a new step, or on counted levels one more of the same step. */
  private add(dir: Direction) {
    if (this.running || this.done) return;
    const last = this.program[this.program.length - 1];
    if (this.mode !== 'steps' && last && last.dir === dir && last.n < 5) last.n++;
    else if (this.program.length < this.plan.limit) this.program.push({ dir, n: 1 });
    else {
      sfx.boing();
      return;
    }
    this.drawQueue();
    sfx.bell(5 + DIRECTIONS.indexOf(dir), 0.15);
  }

  private position(cell: Cell): { x: number; y: number } {
    return { x: this.origin[0] + (cell[0] + 0.5) * this.cell, y: this.origin[1] + (cell[1] + 0.5) * this.cell };
  }

  private async run() {
    if (this.running || this.done || !this.program.length) return;
    this.running = true;
    this.hint.clear();
    const steps = expand(this.program, this.loop);
    const from = slotOfStep(this.program, this.loop);
    const result = runPath(this.plan, steps);
    for (let i = 1; i < result.path.length; i++) {
      // Step-through playback: the slot being carried out lights up.
      this.active = from[i - 1];
      this.drawQueue();
      const p = this.position(result.path[i]);
      await this.ctx.tw.to(this.robot, { x: p.x, y: p.y + 42 }, { duration: 0.4 });
      sfx.bell(6, 0.12);
    }
    this.active = -1;
    this.drawQueue();
    if (result.success) {
      this.done = true;
      this.ctx.finish({ misses: this.misses, hints: this.hints });
      return;
    }
    this.misses++;
    sfx.boing();
    void this.ctx.say('robot.wrong');
    await this.ctx.tw.wait(0.65);
    const p = this.position([0, 0]);
    await this.ctx.tw.to(this.robot, { x: p.x, y: p.y + 42 }, { duration: 0.4 });
    this.running = false;
    if (this.misses === 2) {
      this.hints++;
      void this.ctx.say('robot.hint');
    }
    this.drawHint();
  }

  private slotX(i: number) {
    return this.view.w / 2 - 165 + (i % 4) * 110;
  }

  private drawQueue() {
    this.queue.removeChildren().forEach((c) => c.destroy({ children: true }));
    const rows = this.plan.limit > 4 ? 2 : 1;
    const top = this.view.h - (rows > 1 ? 170 : 80);
    if (this.mode === 'loop') {
      // A bracket around the program, with how many times it repeats.
      const g = new Graphics().roundRect(this.slotX(0) - 62, top - 62, this.plan.limit * 110 + 14, 124, 22).stroke({ width: 6, color: swatch.purple.line });
      const times = label(`×${this.loop}`, 34, swatch.purple.line);
      times.position.set(this.slotX(0) + this.plan.limit * 110 - 18, top - 70);
      this.queue.addChild(g, times);
      this.loopLabel.text = `×${this.loop}`;
    }
    for (let i = 0; i < this.plan.limit; i++) {
      const c = new Container();
      const slot = this.program[i];
      c.addChild(tile(90, 90, i === this.active ? 'yellow' : slot ? 'white' : 'teal'));
      if (slot) {
        const a = arrow(slot.dir);
        c.addChild(a);
        if (slot.n > 1) {
          a.x = -12;
          const n = label(`×${slot.n}`, 24, ink);
          n.position.set(22, 22);
          c.addChild(n);
        }
      }
      c.position.set(this.slotX(i), top + Math.floor(i / 4) * 110);
      c.hitArea = new Rectangle(-50, -50, 100, 100);
      // Tap a slot to take it, and everything after it, back out.
      onTap(c, () => {
        if (!this.running && !this.done) {
          this.program.splice(i);
          this.drawQueue();
        }
      });
      this.queue.addChild(c);
    }
    this.drawHint();
  }

  /** After two misses, a ring on the next useful button, from a known solution. */
  private drawHint() {
    this.hint.clear();
    if (this.misses < 2 || this.running || this.done) return;
    const target = this.nextHelp();
    this.hint.circle(target.x, target.y, 62).stroke({ width: 8, color: swatch.yellow.line });
  }

  private nextHelp(): RoundButton {
    const press = nextPress(this.solution, this.program, this.mode, this.loop, this.plan.solution?.loop ?? 1);
    if ('clear' in press) return this.clear;
    if ('arrow' in press) return this.arrows.find((a) => a.dir === press.arrow)!.button;
    if ('loop' in press) return this.loopButton;
    return this.play;
  }

  /** The ghost finger on the how-to card: press the next button of the known route, one at a time, then play. */
  autotouch(): TouchIntent | null {
    if (this.running || this.done) return null;
    return { tap: { on: this.nextHelp() }, pause: 0.35 };
  }

  resize(v: View) {
    this.view = v;
    this.background.clear().rect(0, 0, v.w, v.h).fill(cream);
    this.cell = Math.min(100, (v.h - 350) / this.plan.size);
    this.origin = [Math.max(150, v.w / 2 - 360), 135];
    const g = this.grid.clear();
    for (let y = 0; y < this.plan.size; y++)
      for (let x = 0; x < this.plan.size; x++) {
        const p = this.position([x, y]);
        g.roundRect(p.x - this.cell / 2 + 4, p.y - this.cell / 2 + 4, this.cell - 8, this.cell - 8, 12).fill(swatch.green.light).stroke({ width: 3, color: swatch.green.fill });
        if (this.plan.rocks.some((r) => r[0] === x && r[1] === y)) {
          const k = this.cell / 100;
          g.poly([p.x - 36 * k, p.y + 25 * k, p.x - 25 * k, p.y - 28 * k, p.x + 15 * k, p.y - 36 * k, p.x + 40 * k, p.y + 20 * k]).fill(swatch.brown.fill).stroke({ width: 4, color: swatch.brown.line });
        }
      }
    const start = this.position([0, 0]);
    const goal = this.position(this.plan.goal);
    if (!this.running) this.robot.position.set(start.x, start.y + 42);
    this.robot.scale.set(Math.min(1, this.cell / 100));
    this.star.position.set(goal.x, goal.y);
    const cx = v.w - 190;
    const cy = v.h * 0.44;
    this.arrows.forEach(({ dir, button }) => {
      const d = DELTAS[dir];
      button.position.set(cx + d[0] * 112, cy + d[1] * 112);
    });
    this.play.position.set(v.w - 90, v.h - 76);
    this.clear.position.set(v.w - 70, 70);
    this.loopButton.position.set(this.slotX(0) + this.plan.limit * 110 + 50, v.h - 80);
    this.drawQueue();
  }

  update(dt: number) {
    this.clock += dt;
    this.hint.alpha = 0.6 + 0.4 * Math.sin(this.clock * 3);
  }

  destroy() {}

  /** The round is over. The couch checks read this name on every game. */
  get finished() {
    return this.done;
  }

  /** Couch play: the stick adds a step, the bottom button plays the program, the left button takes the last step back out. */
  control(input: CouchControls) {
    if (this.running || this.done) return;
    for (const p of input.players) {
      if (p.direction >= 0) this.add(STICK_DIRECTIONS[p.direction]);
      if (p.undo) this.undoLast();
      if (p.action) void this.run();
    }
  }

  /** One step back: on counted levels the last slot counts down before it goes. */
  private undoLast() {
    const last = this.program[this.program.length - 1];
    if (!last) return;
    if (last.n > 1) last.n--;
    else this.program.pop();
    this.drawQueue();
    sfx.tick();
  }

  /** The "watch me" demo: press the steps of the known route one at a time, then play. */
  autoplay(dt: number): CouchControls {
    const out = idle();
    out.players[0].active = true;
    this.botWait -= dt;
    if (this.running || this.done || this.botWait > 0) return out;
    const want = expand(this.solution);
    const have = expand(this.program);
    let at = 0;
    while (at < have.length && have[at] === want[at]) at++;
    if (at < have.length) {
      out.players[0].undo = true;
      this.botWait = 0.3;
    } else if (at < want.length) {
      out.players[0].direction = STICK_DIRECTIONS.indexOf(want[at]);
      this.botWait = 0.45;
    } else {
      out.players[0].action = true;
      this.botWait = 1;
    }
    return out;
  }
}

export const robotPath: GameModule = {
  id: 'robot-path',
  name: 'Robot Path',
  titleLine: 'game.robot-path',
  region: 'tinker-lab',
  skills: ['planning', 'sequencing', 'spatial-reasoning', 'loops'],
  bands: ['prek', 'school'],
  levels: (b) => (b === 'school' ? { min: 4, max: ROBOT_PLANS.length } : { min: 1, max: PREK_TOP }),
  describeLevel: (l) => planFor(l).name,
  music: STYLES.jelly,
  offScreen: 'Lay out a few cushions and give a toy one-step directions to reach a favorite object. Then try "three steps forward" and "do it again".',
  hubIcon: () => new WigglyIcon(robotArt(160)),
  touchDemo: true,
  sticker: () => robotArt(150),
  create: (ctx) => new RobotPath(ctx),
};
