import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { ink, swatch, wood } from '../../art/palette';
import { musicNote } from '../../art/shapes';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { beatMove, differences, empty, freeBeat, givenStep, hits, makeBeat, planFor, same, type Beat, type BeatPlan } from './logic';

const LEVELS: BandLevels = {
  preschool: { min: 1, max: 2 },
  prek: { min: 1, max: 4 },
  school: { min: 3, max: 5 },
};

const CELL = 100;
const STEP_SECONDS = 0.32;
const ROW_COLORS = [swatch.orange, swatch.teal, swatch.purple];

/** Little pictures for each row: a drum, two clapping hands, a bell. */
function rowIcon(row: number): Graphics {
  const g = new Graphics();
  if (row === 0) {
    g.ellipse(0, -14, 30, 10).fill(swatch.white.fill).stroke({ width: 4, color: swatch.orange.line });
    g.rect(-30, -14, 60, 34).fill(swatch.orange.fill).ellipse(0, 20, 30, 10).fill(swatch.orange.fill).stroke({ width: 4, color: swatch.orange.line });
    g.moveTo(-30, -14).lineTo(-30, 20).moveTo(30, -14).lineTo(30, 20).stroke({ width: 4, color: swatch.orange.line });
  } else if (row === 1) {
    for (const s of [-1, 1]) g.ellipse(s * 12, 0, 14, 24).fill(swatch.teal.fill).stroke({ width: 4, color: swatch.teal.line });
    g.moveTo(-30, -26).lineTo(-22, -18).moveTo(30, -26).lineTo(22, -18).stroke({ width: 4, color: swatch.teal.line, cap: 'round' });
  } else {
    g.poly([-24, 16, -18, -12, 0, -24, 18, -12, 24, 16]).fill(swatch.purple.fill).stroke({ width: 4, color: swatch.purple.line, join: 'round' });
    g.circle(0, 22, 6).fill(swatch.purple.line);
  }
  return g;
}

function checkArt(): Graphics {
  return new Graphics().moveTo(-20, 0).lineTo(-6, 16).lineTo(22, -16).stroke({ width: 10, color: 0xffffff, cap: 'round', join: 'round' });
}

class BeatBuilder implements Game {
  readonly plan: BeatPlan;
  target: Beat;
  beat: Beat;
  index = -1;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  /** The step the playhead is on. */
  step = 0;
  readonly grid = new Container();
  readonly listen: RoundButton;
  readonly check: RoundButton;

  private readonly backdrop: Backdrop;
  private readonly cells = new Graphics();
  private readonly icons = new Container();
  private view: View;
  private timer = 0;
  /** Loops completed since the beat last changed (free play). */
  private loops = 0;
  /** While listening, the target plays instead of the child's beat. */
  private playingTarget = 0;
  private wrongs = 0;
  /** Steps shown faintly after two misses on ear levels. */
  private shown: number[] = [];

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.target = empty(this.plan.rows, this.plan.steps);
    this.beat = empty(this.plan.rows, this.plan.steps);
    this.backdrop = new Backdrop({ sky: [0xc9b8f0, 0xf3ecff], hills: [0xc8ecb0, 0xa6de8e], horizon: 0.78, clouds: 2, seed: 88 }, ctx.view);
    this.grid.addChild(this.cells);
    this.grid.eventMode = 'static';
    onTap(this.grid, (e) => this.tapGrid(e), { cooldown: 90 });
    for (let r = 0; r < this.plan.rows; r++) {
      const icon = rowIcon(r);
      icon.position.set(-60, r * CELL + CELL / 2);
      this.icons.addChild(icon);
    }
    this.grid.addChild(this.icons);
    this.listen = new RoundButton(musicNote(new Graphics(), 40, ink), swatch.white, 56, () => this.playTarget());
    this.listen.visible = this.plan.mode === 'hear';
    this.check = new RoundButton(checkArt(), swatch.green, 56, () => void this.checkBeat());
    this.check.visible = this.plan.mode === 'hear';
    ctx.stage.addChild(this.backdrop, this.grid, this.listen, this.check);
  }

  start() {
    void this.next();
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    const w = this.plan.steps * CELL;
    const x = Math.max(200, (v.w - w) / 2 + 40);
    this.grid.position.set(x, Math.max(130, v.h * 0.26));
    this.grid.hitArea = new Rectangle(0, 0, w, this.plan.rows * CELL);
    const y = this.grid.y + this.plan.rows * CELL + 95;
    this.listen.position.set(v.w / 2 - 90, y);
    this.check.position.set(v.w / 2 + 90, y);
    this.draw();
  }

  update(dt: number) {
    if (this.finished) return;
    this.timer += dt;
    if (this.timer < STEP_SECONDS) return;
    this.timer -= STEP_SECONDS;
    this.step = (this.step + 1) % this.plan.steps;
    if (this.step === 0) {
      this.loops++;
      if (this.playingTarget > 0) this.playingTarget--;
    }
    const playing = this.playingTarget > 0 ? this.target : this.beat;
    playing.forEach((row, r) => {
      if (!row[this.step]) return;
      if (r === 0) sfx.drum();
      else if (r === 1) sfx.knock();
      else sfx.bell(7 + (this.step % 3), 0.22);
    });
    // Free play: once the beat has gone round a couple of times, the green check can finish.
    if (this.plan.mode === 'free' && !this.check.visible && hits(this.beat) >= 3 && this.loops >= 2) {
      this.check.visible = true;
      void this.ctx.say('beat.done-when');
    }
    this.draw();
  }

  /** The ghost finger on the how-to card: make the beat (the faint, heard or half-given one, or boom-clap in free play), then press the check where one is asked for. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.playingTarget > 0) return null;
    const goal = this.plan.mode === 'free' ? freeBeat(this.plan) : this.target;
    const move = beatMove(this.plan, goal, this.beat, this.check.visible);
    if (!move) return null;
    if (move === 'check') return { tap: { on: this.check } };
    // A square's middle, in the grid's own units; the grid works out which square from where the touch lands.
    return { tap: { on: this.grid, x: move.step * CELL + CELL / 2, y: move.row * CELL + CELL / 2 }, pause: 0.15 };
  }

  destroy() {}

  private async next() {
    this.busy = true;
    this.index++;
    this.wrongs = 0;
    this.shown = [];
    if (this.index >= this.plan.beats) return void this.finale();
    this.target = makeBeat(this.plan, this.ctx.rng);
    this.beat = empty(this.plan.rows, this.plan.steps);
    // Repeat levels: the first half is already there.
    if (this.plan.mode === 'repeat') this.target.forEach((row, r) => row.forEach((on, s) => (this.beat[r][s] = givenStep(this.plan, s) && on)));
    this.resize(this.view);
    this.busy = false;
    if (this.plan.mode === 'hear') this.playTarget();
    if (this.index > 0) return;
    const line = { free: 'beat.free', see: 'beat.see', hear: 'beat.hear', repeat: 'beat.repeat' } as const;
    return this.ctx.instruct(line[this.plan.mode]);
  }

  /** The beat to copy plays twice, with the playhead in its own color. */
  private playTarget() {
    if (this.busy || this.finished) return;
    this.playingTarget = 2;
    this.step = this.plan.steps - 1;
    this.timer = STEP_SECONDS;
  }

  private draw() {
    const g = this.cells.clear();
    const { rows, steps } = this.plan;
    g.roundRect(-14, -14, steps * CELL + 28, rows * CELL + 28, 24).fill({ color: 0xffffff, alpha: 0.7 }).stroke({ width: 5, color: wood.line });
    // The playhead column.
    g.roundRect(this.step * CELL + 2, -8, CELL - 4, rows * CELL + 16, 16).fill({ color: this.playingTarget > 0 ? swatch.yellow.light : swatch.blue.light, alpha: 0.8 });
    for (let r = 0; r < rows; r++)
      for (let s = 0; s < steps; s++) {
        const sw = ROW_COLORS[r];
        const on = this.beat[r][s];
        const x = s * CELL + 10;
        const y = r * CELL + 10;
        g.roundRect(x, y, CELL - 20, CELL - 20, 16).fill(on ? sw.fill : 0xffffff).stroke({ width: 4, color: on ? sw.line : 0xd8d8e2 });
        if (givenStep(this.plan, s) && on) g.circle(x + CELL / 2 - 10, y + CELL / 2 - 10, 8).fill({ color: 0xffffff, alpha: 0.8 });
        const faint = this.plan.mode === 'see' || this.shown.includes(s);
        if (faint && this.target[r][s] && !on) g.circle(x + CELL / 2 - 10, y + CELL / 2 - 10, 16).fill({ color: sw.fill, alpha: 0.35 });
      }
    if (this.plan.mode === 'repeat') g.moveTo((steps / 2) * CELL, -14).lineTo((steps / 2) * CELL, rows * CELL + 14).stroke({ width: 4, color: wood.line });
  }

  private tapGrid(e: FederatedPointerEvent) {
    if (this.busy || this.finished) return;
    const p = this.grid.toLocal(e.global);
    const s = Math.floor(p.x / CELL);
    const r = Math.floor(p.y / CELL);
    if (s < 0 || r < 0 || s >= this.plan.steps || r >= this.plan.rows) return;
    if (givenStep(this.plan, s)) return;
    const mode = this.plan.mode;
    // Seeing and repeating levels: a square that isn't in the beat stays off, as a gentle miss.
    if ((mode === 'see' || mode === 'repeat') && !this.beat[r][s] && !this.target[r][s]) {
      this.misses++;
      this.wrongs++;
      sfx.boing();
      void this.ctx.say(mode === 'see' ? 'beat.notsee' : 'beat.notrepeat');
      if (mode === 'repeat' && this.wrongs >= 2 && !this.shown.length) {
        this.hints++;
        this.shown = differences(this.target, this.beat);
      }
      return;
    }
    this.beat[r][s] = !this.beat[r][s];
    this.loops = 0;
    if (this.beat[r][s]) (r === 0 ? sfx.drum() : r === 1 ? sfx.knock() : sfx.bell(7, 0.22));
    this.draw();
    if ((mode === 'see' || mode === 'repeat') && same(this.target, this.beat)) void this.win();
  }

  private async checkBeat() {
    if (this.busy || this.finished) return;
    if (this.plan.mode === 'free') return void this.finale();
    if (same(this.target, this.beat)) return void this.win();
    this.busy = true;
    this.misses++;
    this.wrongs++;
    sfx.boing();
    await this.ctx.say('beat.nothear');
    if (this.wrongs >= 2 && !this.shown.length) {
      this.hints++;
      this.shown = differences(this.target, this.beat);
      void this.ctx.say('beat.hint');
    }
    this.busy = false;
    this.playTarget();
    this.draw();
  }

  private async win() {
    this.busy = true;
    this.playingTarget = 0;
    this.shown = [];
    sfx.sparkle();
    this.ctx.pet.cheer();
    // Let the finished beat play round once more.
    await this.ctx.say('beat.yay');
    await this.ctx.tw.wait(STEP_SECONDS * this.plan.steps);
    await this.next();
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    this.busy = true;
    sfx.tada();
    await this.ctx.say('beat.done');
    await this.ctx.tw.wait(0.4);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

class BeatIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const g = new Graphics().roundRect(-110, -170, 220, 150, 20).fill(0xffffff).stroke({ width: 5, color: wood.line });
    const on = [[1, 0, 1, 0], [0, 1, 0, 1]];
    on.forEach((row, r) => row.forEach((v, s) => g.roundRect(-98 + s * 52, -158 + r * 64, 44, 56, 10).fill(v ? ROW_COLORS[r].fill : 0xf2f2f6)));
    c.addChild(g);
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  for (let r = 0; r < 3; r++)
    for (let s = 0; s < 4; s++) {
      const on = rng.chance(0.45);
      c.addChild(new Graphics().roundRect(-100 + s * 52, -70 + r * 50, 44, 42, 10).fill(on ? ROW_COLORS[r].fill : 0xffffff).stroke({ width: 3, color: ROW_COLORS[r].line }));
    }
  return c;
}

export const beatBuilder: GameModule = {
  id: 'beat-builder',
  name: 'Beat Builder',
  titleLine: 'game.beat-builder',
  region: 'music-mountain',
  skills: ['rhythm', 'patterns', 'listening', 'music'],
  bands: ['preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.quiet,
  coplayHint: 'Clap and stomp the beat together as the playhead goes round.',
  offScreen: 'Make a beat on pots and a wooden spoon: boom, clap, boom, clap. Then take turns copying each other.',
  hubIcon: () => new BeatIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new BeatBuilder(ctx),
};
