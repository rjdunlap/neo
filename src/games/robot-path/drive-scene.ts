import { Graphics } from 'pixi.js';
import { cream, swatch } from '../../art/palette';
import { starPoints } from '../../art/shapes';
import { sfx } from '../../audio/sfx';
import { idle, type CouchControls } from '../../engine/controller';
import type { View } from '../../engine/view';
import { RoundButton } from '../../ui/buttons';
import { robotArt } from '../shared';
import type { Game, GameContext, TouchIntent } from '../types';
import { arrow } from './art';
import { robotLayout } from './layout';
import {
  DIRECTIONS,
  DRIVE_PLANS,
  driveNext,
  driveStep,
  type Cell,
  type Direction,
  type RobotPlan,
} from './logic';

/** The stick's directions as the controller reports them: 0 right, 1 down, 2 left, 3 up. */
const STICK_DIRECTIONS: Direction[] = ['right', 'down', 'left', 'up'];

/**
 * Drive the robot (preschool entry, level 16): the four arrows move the robot one cell each, with no program and no play
 * button. A rock or the edge stops it with a little wobble, never a miss, and the round ends when it rolls onto the star.
 */
export class DriveRobot implements Game {
  readonly plan: RobotPlan;
  private at: Cell = [0, 0];
  private readonly background = new Graphics();
  private readonly grid = new Graphics();
  private readonly robot = robotArt(65);
  private readonly star = new Graphics()
    .poly(starPoints(30, 14))
    .fill(swatch.yellow.fill)
    .stroke({ width: 4, color: swatch.yellow.line });
  private readonly hint = new Graphics();
  readonly arrows: { dir: Direction; button: RoundButton }[] = [];
  private cell = 110;
  private origin: [number, number] = [160, 155];
  private moving = false;
  private done = false;
  private hints = 0;
  /** The rock line plays once per rock bump that is not already being spoken. */
  private speaking = false;
  private clock = 0;
  private botWait = 1.5;

  constructor(private readonly ctx: GameContext) {
    this.plan = ctx.rng.pick(DRIVE_PLANS);
    this.hint.eventMode = 'none';
    ctx.stage.addChild(this.background, this.grid, this.star, this.robot, this.hint);
    for (const dir of DIRECTIONS) {
      const button = new RoundButton(arrow(dir), swatch.teal, 50, () => void this.drive(dir));
      ctx.stage.addChild(button);
      this.arrows.push({ dir, button });
    }
  }

  start() {
    void this.ctx.instruct('robot.drive');
  }

  private position(cell: Cell) {
    return {
      x: this.origin[0] + (cell[0] + 0.5) * this.cell,
      y: this.origin[1] + (cell[1] + 0.5) * this.cell,
    };
  }

  /** One arrow: a step with a bell, or a gentle stop. */
  private async drive(dir: Direction) {
    if (this.moving || this.done) return;
    const move = driveStep(this.plan, this.at, dir);
    this.moving = true;
    this.hint.clear();
    if (move.stop === 'step') {
      this.at = move.cell;
      const p = this.position(this.at);
      sfx.bell(5 + DIRECTIONS.indexOf(dir), 0.15);
      await this.ctx.tw.to(this.robot, { x: p.x, y: p.y + 42 }, { duration: 0.28 });
    } else {
      // A little nudge toward the rock or edge, then back: the robot stays where it was.
      const x = this.robot.x,
        y = this.robot.y;
      const [dx, dy] = [
        dir === 'right' ? 1 : dir === 'left' ? -1 : 0,
        dir === 'down' ? 1 : dir === 'up' ? -1 : 0,
      ];
      sfx.tick();
      if (move.stop === 'rock' && !this.speaking) {
        this.speaking = true;
        void this.ctx.say('robot.drive.rock').then(() => (this.speaking = false));
      }
      await this.ctx.tw.to(this.robot, { x: x + dx * 14, y: y + dy * 14 }, { duration: 0.1 });
      await this.ctx.tw.to(this.robot, { x, y }, { duration: 0.14 });
    }
    this.moving = false;
    if (move.star && move.stop === 'step') {
      this.done = true;
      const p = this.position(this.at);
      this.ctx.particles.burst(p.x, p.y, { colors: [swatch.yellow.fill, swatch.teal.fill], count: 14 });
      await this.ctx.say('robot.drive.star');
      this.ctx.finish({ misses: 0, hints: this.hints });
      return;
    }
    if (this.hints) this.drawHint();
  }

  private nextButton(): RoundButton | null {
    const dir = driveNext(this.plan, this.at);
    return dir ? this.arrows.find((a) => a.dir === dir)!.button : null;
  }

  private drawHint() {
    this.hint.clear();
    const target = this.nextButton();
    if (!target || this.done) return;
    this.hint.circle(target.x, target.y, 62).stroke({ width: 8, color: swatch.yellow.line });
  }

  askForHint() {
    if (this.done) return;
    this.hints++;
    this.drawHint();
    void this.ctx.say('robot.hint');
  }

  restart() {
    if (this.moving || this.done) return;
    this.at = [0, 0];
    this.resize(this.ctx.view);
  }

  /** The ghost finger on the how-to card: tap the next arrow of a shortest route. */
  autotouch(): TouchIntent | null {
    if (this.moving || this.done) return null;
    const target = this.nextButton();
    return target ? { tap: { on: target }, pause: 0.45 } : null;
  }

  /** The stick drives the robot one cell per push. */
  control(input: CouchControls) {
    if (this.moving || this.done) return;
    for (const p of input.players) if (p.direction >= 0) void this.drive(STICK_DIRECTIONS[p.direction]);
  }

  /** The "watch me" demo: push the next step of a shortest route. */
  autoplay(dt: number): CouchControls {
    const out = idle();
    out.players[0].active = true;
    this.botWait -= dt;
    if (this.moving || this.done || this.botWait > 0) return out;
    const dir = driveNext(this.plan, this.at);
    if (dir) out.players[0].direction = STICK_DIRECTIONS.indexOf(dir);
    this.botWait = 0.6;
    return out;
  }

  resize(v: View) {
    this.background.clear().rect(0, 0, v.w, v.h).fill(cream);
    const place = robotLayout(v, this.plan.size, 0, 'steps');
    this.cell = place.cell;
    this.origin = place.origin;
    const g = this.grid.clear();
    for (let y = 0; y < this.plan.size; y++)
      for (let x = 0; x < this.plan.size; x++) {
        const p = this.position([x, y]);
        g.roundRect(p.x - this.cell / 2 + 4, p.y - this.cell / 2 + 4, this.cell - 8, this.cell - 8, 12)
          .fill(swatch.green.light)
          .stroke({ width: 3, color: swatch.green.fill });
        if (this.plan.rocks.some((r) => r[0] === x && r[1] === y)) {
          const k = this.cell / 100;
          g.poly([
            p.x - 36 * k,
            p.y + 25 * k,
            p.x - 25 * k,
            p.y - 28 * k,
            p.x + 15 * k,
            p.y - 36 * k,
            p.x + 40 * k,
            p.y + 20 * k,
          ])
            .fill(swatch.brown.fill)
            .stroke({ width: 4, color: swatch.brown.line });
        }
      }
    const here = this.position(this.at);
    if (!this.moving) this.robot.position.set(here.x, here.y + 42);
    this.robot.scale.set(Math.min(1.2, this.cell / 100));
    const goal = this.position(this.plan.goal);
    this.star.position.set(goal.x, goal.y);
    this.arrows.forEach(({ dir, button }) => button.position.set(place.arrows[dir].x, place.arrows[dir].y));
    if (this.hints) this.drawHint();
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
}
