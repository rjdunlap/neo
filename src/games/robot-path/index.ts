import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, swatch } from '../../art/palette';
import { starPoints } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { RoundButton } from '../../ui/buttons';
import { againIcon, arrowIcon, playIcon } from '../../ui/icons';
import { robotArt, tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule } from '../types';
import { DELTAS, DIRECTIONS, ROBOT_PLANS, runPath, shortestPath, type Cell, type Direction } from './logic';

function arrow(dir: Direction) { const g = arrowIcon(1); g.rotation = DIRECTIONS.indexOf(dir) * Math.PI / 2 - Math.PI / 2; return g; }
class RobotPath implements Game {
  readonly plan;
  readonly program: Direction[] = [];
  readonly solution: Direction[];
  private readonly background = new Graphics();
  private readonly grid = new Graphics();
  private readonly robot = robotArt(65);
  private readonly star = new Graphics().poly(starPoints( 30, 14)).fill(swatch.yellow.fill).stroke({ width: 4, color: swatch.yellow.line });
  private readonly queue = new Container();
  private readonly hint = new Graphics();
  readonly arrows: { dir: Direction; button: RoundButton }[] = [];
  private readonly play: RoundButton;
  private readonly clear: RoundButton;
  private cell = 110;
  private origin: Cell = [160, 155];
  private view: View;
  private running = false;
  private done = false;
  private misses = 0;
  private hints = 0;
  private clock = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = ROBOT_PLANS[Math.max(0, Math.min(ROBOT_PLANS.length - 1, ctx.level - 1))];
    this.solution = shortestPath(this.plan);
    this.play = new RoundButton(playIcon(), swatch.green,  50, () => void this.run());
    this.clear = new RoundButton(againIcon(), swatch.white,  50, () => {
      if (this.running || this.done) return;
      this.program.length = 0; this.drawQueue(); void ctx.say('robot.clear');
    });
    ctx.stage.addChild(this.background, this.grid, this.star, this.robot, this.hint, this.queue, this.play, this.clear);
    for (const dir of DIRECTIONS) {
      const button = new RoundButton(arrow(dir), swatch.teal,  50, () => {
        if (this.running || this.done || this.program.length >= this.plan.limit) return;
        this.program.push(dir); this.drawQueue(); sfx.bell(5 + DIRECTIONS.indexOf(dir), 0.15);
      });
      ctx.stage.addChild(button); this.arrows.push({ dir, button });
    }
  }
  start() { void this.ctx.instruct('robot.start'); }
  private position(cell: Cell): { x: number; y: number } { return { x: this.origin[0] + (cell[0] + 0.5) * this.cell, y: this.origin[1] + (cell[1] + 0.5) * this.cell }; }
  private async run() {
    if (this.running || this.done || !this.program.length) return;
    this.running = true; this.hint.clear();
    const result = runPath(this.plan, this.program);
    for (const cell of result.path.slice(1)) {
      const p = this.position(cell);
      await this.ctx.tw.to(this.robot, { x: p.x, y: p.y + 42 }, { duration: 0.4 });
      sfx.bell(6, 0.12);
    }
    if (result.success) { this.done = true; this.ctx.finish({ misses: this.misses, hints: this.hints }); return; }
    this.misses++;
    sfx.boing(); void this.ctx.say('robot.wrong');
    await this.ctx.tw.wait(0.65);
    const p = this.position([0, 0]);
    await this.ctx.tw.to(this.robot, { x: p.x, y: p.y + 42 }, { duration: 0.4 });
    this.running = false;
    if (this.misses === 2) { this.hints++; void this.ctx.say('robot.hint'); }
    this.drawHint();
  }
  private drawQueue() {
    this.queue.removeChildren().forEach((c) => c.destroy({ children: true }));
    for (let i = 0; i < this.plan.limit; i++) {
      const c = new Container();
      c.addChild(tile(90, 90, this.program[i] ? 'white' : 'teal'));
      if (this.program[i]) c.addChild(arrow(this.program[i]));
      c.position.set(this.view.w / 2 - 165 + (i % 4) * 110, this.view.h - (this.plan.limit > 4 ? 170 : 80) + Math.floor(i / 4) * 110);
      c.hitArea = new Rectangle(-50, -50, 100, 100);
      onTap(c, () => { if (!this.running && !this.done) { this.program.splice(i); this.drawQueue(); } });
      this.queue.addChild(c);
    }
    this.drawHint();
  }
  private drawHint() {
    this.hint.clear();
    if (this.misses < 2 || this.running || this.done) return;
    const prefix = this.program.every((dir, i) => this.solution[i] === dir);
    const next = prefix ? this.arrows.find((a) => a.dir === this.solution[this.program.length])?.button : this.clear;
    const target = next ?? this.play;
    this.hint.circle(target.x, target.y,  62).stroke({ width: 8, color: swatch.yellow.line });
  }
  resize(v: View) {
    this.view = v;
    this.background.clear().rect(0, 0, v.w, v.h).fill(cream);
    this.cell = Math.min(100, (v.h - 350) / this.plan.size);
    this.origin = [Math.max(150, v.w / 2 - 360), 135];
    const g = this.grid.clear();
    for (let y = 0; y < this.plan.size; y++) for (let x = 0; x < this.plan.size; x++) {
      const p = this.position([x, y]);
      g.roundRect(p.x - this.cell / 2 + 4, p.y - this.cell / 2 + 4, this.cell - 8, this.cell - 8, 12).fill(swatch.green.light).stroke({ width: 3, color: swatch.green.fill });
      if (this.plan.rocks.some((r) => r[0] === x && r[1] === y)) g.poly([p.x - 36, p.y + 25, p.x - 25, p.y - 28, p.x + 15, p.y - 36, p.x + 40, p.y + 20]).fill(swatch.brown.fill).stroke({ width: 4, color: swatch.brown.line });
    }
    const start = this.position([0, 0]), goal = this.position(this.plan.goal);
    if (!this.running) this.robot.position.set(start.x, start.y + 42);
    this.star.position.set(goal.x, goal.y);
    const cx = v.w - 190, cy = v.h * 0.44;
    this.arrows.forEach(({ dir, button }) => { const d = DELTAS[dir]; button.position.set(cx + d[0] * 112, cy + d[1] * 112); });
    this.play.position.set(v.w - 90, v.h - 76);
    this.clear.position.set(v.w -  70,  70);
    this.drawQueue();
  }
  update(dt: number) { this.clock += dt; this.hint.alpha = 0.6 + 0.4 * Math.sin(this.clock * 3); }
  destroy() {}
}
export const robotPath: GameModule = {
  id: 'robot-path', name: 'Robot Path', titleLine: 'game.robot-path', region: 'tinker-lab',
  skills: ['planning', 'sequencing', 'spatial-reasoning'], bands: ['prek'], levels: () => ({ min: 1, max: ROBOT_PLANS.length }),
  describeLevel: (l) => ROBOT_PLANS[Math.max(0, Math.min(ROBOT_PLANS.length - 1, l - 1))].name,
  music: STYLES.jelly, offScreen: 'Lay out a few cushions and give a toy one-step directions to reach a favorite object.',
  hubIcon: () => new WigglyIcon(robotArt(160)), sticker: () => robotArt(150), create: (ctx) => new RobotPath(ctx),
};
