import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { ink, swatch } from '../../art/palette';
import { puffs } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import type { CouchControls } from '../../engine/controller';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { againIcon } from '../../ui/icons';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule } from '../types';
import { eaten, HINT_AFTER, makePuzzle, planFor, slide, solve, type Cell, type Dir, type SlidePlan, type SlidePuzzle } from './logic';

const LEVELS: BandLevels = {
  preschool: { min: 1, max: 2 },
  prek: { min: 1, max: 4 },
  school: { min: 2, max: 5 },
};

const CELL = 100;
const ICE = 0xe3f4ff;

function penguinArt(): Container {
  const c = new Container();
  const g = new Graphics();
  g.ellipse(-14, 34, 13, 7).ellipse(14, 34, 13, 7).fill(swatch.orange.fill);
  g.ellipse(0, 0, 32, 38).fill(ink);
  g.ellipse(0, 8, 22, 28).fill(0xffffff);
  g.ellipse(-30, 6, 8, 20).ellipse(30, 6, 8, 20).fill(ink);
  g.circle(-10, -14, 6).circle(10, -14, 6).fill(0xffffff).circle(-9, -13, 3).circle(11, -13, 3).fill(ink);
  g.poly([-8, -4, 8, -4, 0, 6]).fill(swatch.orange.fill).stroke({ width: 2, color: swatch.orange.line, join: 'round' });
  g.circle(-18, 2, 5).circle(18, 2, 5).fill({ color: swatch.pink.fill, alpha: 0.6 });
  c.addChild(g);
  return c;
}

function fishArt(): Graphics {
  const g = new Graphics();
  g.poly([22, 0, 40, -16, 40, 16]).fill(swatch.orange.fill).stroke({ width: 4, color: swatch.orange.line, join: 'round' });
  g.ellipse(0, 0, 28, 17).fill(swatch.orange.fill).stroke({ width: 4, color: swatch.orange.line });
  g.circle(-12, -4, 4).fill(ink);
  return g;
}

function rockArt(): Graphics {
  const g = new Graphics().poly([-40, 30, -34, -14, -12, -34, 18, -32, 38, -6, 40, 30]).fill(0x9aa6b8).stroke({ width: 5, color: 0x6b778a, join: 'round' });
  return puffs(g, [[-14, -28, 16], [10, -30, 18], [28, -14, 12]], 0xffffff, 0xc9d6e6, 4);
}

function softArt(): Graphics {
  return puffs(new Graphics(), [[-24, 10, 22], [0, 2, 26], [24, 10, 22], [-10, 20, 20], [12, 20, 20]], 0xffffff, 0xc9d6e6, 4);
}

interface Step {
  at: Cell;
  have: number;
}

class PenguinSlide implements Game {
  readonly plan: SlidePlan;
  puzzle!: SlidePuzzle;
  at: Cell = { x: 0, y: 0 };
  have = 0;
  moves = 0;
  index = -1;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  readonly penguin = penguinArt();
  readonly board = new Container();
  readonly undo: RoundButton;

  private readonly floor = new Graphics();
  private readonly things = new Container();
  private readonly arrow = new Graphics();
  private readonly glow = new Graphics();
  private fishNodes: Graphics[] = [];
  private history: Step[] = [];
  private hinting = false;
  private stuck = false;
  private view: View;
  private clock = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.arrow.eventMode = 'none';
    this.glow.eventMode = 'none';
    this.penguin.eventMode = 'none';
    this.board.addChild(this.floor, this.things, this.penguin, this.arrow);
    this.board.eventMode = 'static';
    onTap(this.board, (e) => void this.tapIce(e), { cooldown: 150 });
    this.undo = new RoundButton(againIcon(), swatch.white, 54, () => this.back());
    ctx.stage.addChild(this.board, this.undo, this.glow);
  }

  start() {
    void this.next();
  }

  private at2(c: Cell) {
    return { x: (c.x + 0.5) * CELL, y: (c.y + 0.5) * CELL };
  }

  resize(v: View) {
    this.view = v;
    if (!this.puzzle) return;
    const w = this.puzzle.cols * CELL;
    const h = this.puzzle.rows * CELL;
    this.board.position.set((v.w - w) / 2, Math.max(110, (v.h - h) / 2 + 10));
    this.undo.position.set(this.board.x + w + 70, this.board.y + 50);
  }

  update(dt: number) {
    this.clock += dt;
    if (!this.busy) this.penguin.rotation = 0.05 * Math.sin(this.clock * 3);
    const g = this.glow.clear();
    if (this.stuck && !this.busy) g.circle(this.undo.x, this.undo.y, 68 + 4 * Math.sin(this.clock * 6)).stroke({ width: 7, color: swatch.yellow.fill });
    this.drawArrow();
  }

  destroy() {}

  control(input: CouchControls) {
    if (this.busy || this.finished) return;
    const p = input.players.find(p => p.undo || p.direction >= 0);
    if (p?.undo) this.back();
    else if (p && p.direction >= 0) void this.go(p.direction as Dir);
  }

  private async next() {
    this.busy = true;
    this.index++;
    if (this.index >= this.plan.puzzles) return void this.finale();
    this.puzzle = makePuzzle(this.plan, this.ctx.rng);
    this.at = { ...this.puzzle.start };
    this.have = 0;
    this.moves = 0;
    this.history = [];
    this.hinting = false;
    this.stuck = false;
    this.build();
    this.resize(this.view);
    this.board.alpha = 0;
    await this.ctx.tw.to(this.board, { alpha: 1 }, { duration: 0.3 });
    this.busy = false;
    if (this.index > 0) return;
    if (this.plan.soft) return this.ctx.instruct('slide.soft');
    if (this.plan.fish === 2) return this.ctx.instruct('slide.two');
    return this.ctx.instruct('slide.go');
  }

  private build() {
    const p = this.puzzle;
    const w = p.cols * CELL;
    const h = p.rows * CELL;
    this.floor.clear().roundRect(-16, -16, w + 32, h + 32, 30).fill(0xffffff).stroke({ width: 6, color: 0xc9d6e6 }).roundRect(0, 0, w, h, 18).fill(ICE);
    for (let i = 0; i < 6; i++) this.floor.moveTo((i * 137) % w, (i * 71) % h).lineTo(((i * 137) % w) + 30, ((i * 71) % h) + 12).stroke({ width: 3, color: 0xffffff, alpha: 0.8 });
    this.board.hitArea = new Rectangle(-16, -16, w + 32, h + 32);
    this.things.removeChildren().forEach((c) => c.destroy({ children: true }));
    for (const c of p.soft) this.place(softArt(), c);
    for (const c of p.rocks) this.place(rockArt(), c);
    this.fishNodes = p.fish.map((c) => this.place(fishArt(), c));
    const s = this.at2(this.at);
    this.penguin.position.set(s.x, s.y);
  }

  private place<T extends Container>(node: T, c: Cell): T {
    const p = this.at2(c);
    node.position.set(p.x, p.y);
    node.eventMode = 'none';
    this.things.addChild(node);
    return node;
  }

  /** Tap the ice: the penguin slides toward it, along whichever way is further. */
  private async tapIce(e: FederatedPointerEvent) {
    if (this.busy || this.finished) return;
    const local = this.board.toLocal(e.global);
    const p = this.at2(this.at);
    const dx = local.x - p.x;
    const dy = local.y - p.y;
    if (Math.hypot(dx, dy) < 40) {
      sfx.squeak();
      return;
    }
    const dir: Dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 2) : dy > 0 ? 1 : 3;
    await this.go(dir);
  }

  private async go(dir: Dir) {
    const { to, passed } = slide(this.puzzle, this.at, dir);
    if (!passed.length) {
      // Already against something: a little bump, never a mistake.
      sfx.boing();
      const x = this.penguin.x;
      await this.ctx.tw.to(this.penguin, { x: x + [6, 0, -6, 0][dir] }, { duration: 0.06 });
      await this.ctx.tw.to(this.penguin, { x }, { duration: 0.1 });
      return;
    }
    this.busy = true;
    this.history.push({ at: this.at, have: this.have });
    this.moves++;
    sfx.whoosh();
    this.penguin.rotation = [0.3, 0, -0.3, 0][dir];
    const end = this.at2(to);
    await this.ctx.tw.to(this.penguin, { x: end.x, y: end.y }, { duration: 0.1 * passed.length + 0.08, ease: ease.outQuad });
    sfx.clunk();
    this.penguin.rotation = 0;
    this.at = to;
    const got = eaten(this.puzzle, passed) & ~this.have;
    this.have |= got;
    this.fishNodes.forEach((f, i) => {
      if (got & (1 << i)) {
        f.visible = false;
        this.ctx.particles.burst(this.board.x + f.x, this.board.y + f.y, { kind: 'star', colors: [0xffffff, swatch.orange.light], count: 12, speed: [100, 240], gravity: 0, life: [0.4, 0.8] });
      }
    });
    if (got) {
      sfx.munch();
      void this.ctx.say('slide.yum');
    }
    if (this.have === (1 << this.puzzle.fish.length) - 1) return void this.win();
    this.checkHelp();
    this.busy = false;
  }

  /** Undo one slide: the fish it ate come back too. */
  private back() {
    if (this.busy || this.finished || !this.history.length) return;
    const step = this.history.pop()!;
    this.at = step.at;
    this.have = step.have;
    this.fishNodes.forEach((f, i) => (f.visible = !(this.have & (1 << i))));
    const p = this.at2(this.at);
    void this.ctx.tw.to(this.penguin, { x: p.x, y: p.y }, { duration: 0.25, ease: ease.inOutSine });
    this.checkHelp();
  }

  /** After a few more slides than needed, a yellow arrow shows a best next slide; when there is no way on, undo glows. */
  private checkHelp() {
    const wasStuck = this.stuck;
    this.stuck = solve(this.puzzle, this.at, this.have).moves < 0;
    if (this.stuck && !wasStuck) void this.ctx.say('slide.stuck');
    if (!this.hinting && this.moves > this.puzzle.best + HINT_AFTER) {
      this.hinting = true;
      this.hints++;
      if (!this.stuck) void this.ctx.say('slide.hint');
    }
  }

  private drawArrow() {
    const g = this.arrow.clear();
    if (!this.hinting || this.stuck || this.busy || !this.puzzle) return;
    const { first } = solve(this.puzzle, this.at, this.have);
    if (first < 0) return;
    const p = this.at2(this.at);
    const bob = 6 * Math.sin(this.clock * 6);
    const ux = [1, 0, -1, 0][first];
    const uy = [0, 1, 0, -1][first];
    const tip = { x: p.x + ux * (70 + bob), y: p.y + uy * (70 + bob) };
    const base = { x: p.x + ux * (40 + bob), y: p.y + uy * (40 + bob) };
    g.poly([tip.x, tip.y, base.x - uy * 22, base.y + ux * 22, base.x + uy * 22, base.y - ux * 22]).fill(swatch.yellow.fill).stroke({ width: 4, color: swatch.yellow.line, join: 'round' });
  }

  private async win() {
    this.busy = true;
    this.hinting = false;
    this.stuck = false;
    sfx.sparkle();
    this.ctx.pet.cheer();
    await this.ctx.tw.to(this.penguin.scale, { x: 1.25, y: 1.25 }, { duration: 0.2, ease: ease.outBack });
    await this.ctx.tw.to(this.penguin.scale, { x: 1, y: 1 }, { duration: 0.2 });
    await this.ctx.say('praise');
    await this.ctx.tw.to(this.board, { alpha: 0 }, { duration: 0.3 });
    await this.next();
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    sfx.tada();
    await this.ctx.say('slide.done');
    await this.ctx.tw.wait(0.5);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

class SlideIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    c.addChild(new Graphics().ellipse(0, -30, 120, 40).fill(ICE).stroke({ width: 5, color: 0xc9d6e6 }));
    const fish = fishArt();
    fish.position.set(70, -40);
    const p = penguinArt();
    p.position.set(-40, -70);
    p.scale.set(1.2);
    c.addChild(fish, p);
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const p = penguinArt();
  p.scale.set(1.5);
  const f = fishArt();
  f.position.set(rng.pick([-1, 1]) * 70, 50);
  f.scale.set(0.9);
  c.addChild(p, f);
  return c;
}

export const penguinSlide: GameModule = {
  id: 'penguin-slide',
  name: 'Penguin Slide',
  titleLine: 'game.penguin-slide',
  region: 'puzzle-peaks',
  skills: ['planning', 'spatial-reasoning', 'problem-solving'],
  bands: ['preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.bubbles,
  coplayHint: 'Before each slide, guess together where the penguin will stop.',
  offScreen: 'Slide a toy car across the floor: where does it stop, and what stops it?',
  hubIcon: () => new SlideIcon(),
  sticker,
  create: (ctx) => new PenguinSlide(ctx),
};
