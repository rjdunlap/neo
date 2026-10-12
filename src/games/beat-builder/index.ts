import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { grass, ink, swatch, wood } from '../../art/palette';
import { musicNote } from '../../art/shapes';
import { Backdrop } from '../../art/scenery';
import { PicnicStage, WoodlandStage, type BeatStage } from './stage';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { returnGate, returnHint, returnMove, returnStarter, type SectionOrder } from './logic';
import { clonePiece, newPiece, pieceGate, previewOrder, sectionsMove, type Piece, type SectionId } from './logic';
import { oneHit } from './logic';
import { beatMove, firstMismatch, mendCopy, repairs, replayTick, empty, freeBeat, givenCell, givenStep, hits, reviseStart, INSTRUMENTS, roundPhrases, planFor, same, type Beat, type BeatPlan } from './logic';

const LEVELS: BandLevels = {
  toddler: { min: 1, max: 1 },
  preschool: { min: 1, max: 2 },
  prek: { min: 1, max: 6 },
  school: { min: 3, max: 9 },
};

const CELL = 100;
const STEP_SECONDS = 0.32;
const ROW_COLORS = [swatch.orange, swatch.teal, swatch.purple];

/** Little pictures for each row: a drum, two clapping hands, a bell. */
function rowIcon(row: number): Graphics {
  const g = new Graphics();
  if (INSTRUMENTS[row].id === 'drum') {
    g.ellipse(0, -14, 30, 10).fill(swatch.white.fill).stroke({ width: 4, color: swatch.orange.line });
    g.rect(-30, -14, 60, 34).fill(swatch.orange.fill).ellipse(0, 20, 30, 10).fill(swatch.orange.fill).stroke({ width: 4, color: swatch.orange.line });
    g.moveTo(-30, -14).lineTo(-30, 20).moveTo(30, -14).lineTo(30, 20).stroke({ width: 4, color: swatch.orange.line });
  } else if (INSTRUMENTS[row].id === 'clap') {
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

const sectionArt = (section: SectionId): Graphics => {
  const g = new Graphics();
  if (section === 'a') g.circle(0, 0, 24).fill(0xffffff).stroke({ width: 6, color: swatch.orange.line });
  else g.roundRect(-22, -22, 44, 44, 8).fill(0xffffff).stroke({ width: 6, color: swatch.purple.line });
  return g;
};
const copyArt = (): Graphics => new Graphics()
  .roundRect(-26, -26, 30, 30, 6).fill(0xffffff).stroke({ width: 4, color: swatch.blue.line })
  .roundRect(-4, -4, 30, 30, 6).fill(swatch.blue.light).stroke({ width: 4, color: swatch.blue.line });
const undoArt = (): Graphics => new Graphics()
  .moveTo(-14, -6).lineTo(-26, 6).lineTo(-8, 14).stroke({ width: 8, color: 0xffffff, cap: 'round', join: 'round' })
  .moveTo(-24, 6).quadraticCurveTo(12, -26, 24, 6).stroke({ width: 8, color: 0xffffff, cap: 'round' });
const playArt = (): Graphics => new Graphics().poly([-14, -22, 24, 0, -14, 22]).fill(0xffffff).stroke({ width: 4, color: 0xffffff, join: 'round' });

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
  /** Revise levels: hear only the target's claps. */
  readonly solo: RoundButton;
  private soloing = false;
  /** Toddler play: the free beat can finish after a single sound has been heard. */
  private readonly gentle: boolean;
  /** Level 8: the piece's two sections, the one on the grid, and what undo can step back to. */
  piece: Piece;
  current: SectionId = 'a';
  previewed = false;
  private previewIdx = -1;
  private undoStack: { piece: Piece; order: SectionOrder }[] = [];
  /** Level 9: the three cards in time order, and the strip that shows them. */
  order: SectionOrder = ['a', 'b', 'a'];
  readonly slots = new Container();
  private readonly slotView = new Graphics();
  private previewSeq = previewOrder(4);
  readonly tabA: RoundButton;
  readonly tabB: RoundButton;
  readonly copyBtn: RoundButton;
  readonly undoBtn: RoundButton;
  readonly previewBtn: RoundButton;
  private readonly marker = new Graphics();

  private readonly phrases: ReturnType<typeof roundPhrases>;
  private readonly backdrop: Backdrop;
  private readonly woodland: BeatStage;
  private readonly cells = new Graphics();
  /** Mend levels: the model to match, drawn small under the controls. */
  private readonly model = new Graphics();
  private readonly icons = new Container();
  private view: View;
  private timer = 0;
  /** Loops completed since the beat last changed (free play). */
  private loops = 0;
  /** Target steps remaining, plus one boundary tick to let the final step finish. */
  private playingTarget = 0;
  private wrongs = 0;
  /** Automatic repair help is counted once per target. */
  private helped = false;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.gentle = ctx.band === 'toddler' && this.plan.mode === 'free';
    this.phrases = roundPhrases(this.plan, ctx.rng);
    this.piece = newPiece(this.plan);
    this.target = empty(this.plan.rows, this.plan.steps);
    this.beat = empty(this.plan.rows, this.plan.steps);
    this.backdrop = new Backdrop({ sky: [swatch.blue.light, swatch.green.light], hills: [grass, swatch.green.light], horizon: 0.78, clouds: 2, seed: 88 }, ctx.view);
    this.woodland = ctx.level === 3 || ctx.level === 5 ? new PicnicStage(this.plan.rows, rowIcon) : new WoodlandStage(this.plan.rows, rowIcon);
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
    this.listen.visible = this.plan.mode === 'hear' || this.plan.mode === 'mend' || this.plan.mode === 'revise';
    this.check = new RoundButton(checkArt(), swatch.green, 56, () => void this.checkBeat());
    this.check.visible = this.plan.mode === 'hear' || this.plan.mode === 'mend' || this.plan.mode === 'revise';
    const soloArt = rowIcon(1);
    soloArt.scale.set(0.8);
    this.solo = new RoundButton(soloArt, swatch.teal, 56, () => this.playTarget(true));
    this.solo.visible = this.plan.mode === 'revise';
    const sec = this.plan.mode === 'sections' || this.plan.mode === 'return';
    const ret = this.plan.mode === 'return';
    this.tabA = new RoundButton(sectionArt('a'), swatch.orange, 56, () => this.switchTo('a'));
    this.tabB = new RoundButton(sectionArt('b'), swatch.purple, 56, () => this.switchTo('b'));
    this.copyBtn = new RoundButton(copyArt(), swatch.blue, 56, () => this.copyAToB());
    this.undoBtn = new RoundButton(undoArt(), swatch.teal, 56, () => this.undo());
    this.previewBtn = new RoundButton(playArt(), swatch.yellow, 56, () => this.preview());
    for (const b of [this.tabA, this.tabB, this.copyBtn, this.undoBtn, this.previewBtn]) b.visible = sec;
    this.copyBtn.visible = this.plan.mode === 'sections';
    this.slots.visible = ret;
    this.slots.addChild(this.slotView);
    this.slots.eventMode = 'static';
    onTap(this.slots, (e) => this.tapSlot(e), { cooldown: 120 });
    if (sec) this.check.visible = true;
    this.marker.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.woodland, this.marker, this.tabA, this.tabB, this.copyBtn, this.undoBtn, this.previewBtn, this.slots, this.grid, this.listen, this.solo, this.check, this.model);
    this.model.eventMode = 'none';
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
    this.woodland.resize(v, this.grid.y);
    this.grid.hitArea = new Rectangle(0, 0, w, this.plan.rows * CELL);
    const y = this.grid.y + this.plan.rows * CELL + 95;
    const reviseRow = this.plan.mode === 'revise';
    this.listen.position.set(v.w / 2 - (reviseRow ? 170 : 90), y);
    this.solo.position.set(v.w / 2, y);
    this.check.position.set(v.w / 2 + (reviseRow ? 170 : 90), y);
    this.model.position.set(v.w / 2, y + 95);
    if (this.plan.mode === 'return') {
      const x = v.w / 2;
      [this.tabA, this.tabB, this.undoBtn, this.previewBtn, this.check].forEach((b, i) => b.position.set(x - 300 + i * 150, y));
      this.slots.position.set(x - 185, y + 85);
      this.slots.hitArea = new Rectangle(0, 0, 370, 110);
    }
    if (this.plan.mode === 'sections') {
      const x = v.w / 2;
      [this.tabA, this.tabB, this.copyBtn, this.undoBtn].forEach((b, i) => b.position.set(x - 225 + i * 150, y));
      this.previewBtn.position.set(x - 75, y + 135);
      this.check.position.set(x + 75, y + 135);
    }
    this.draw();
  }

  update(dt: number) {
    if (this.finished) return;
    this.woodland.update(dt);
    this.timer += dt;
    if (this.timer < STEP_SECONDS) return;
    this.timer -= STEP_SECONDS;
    if (this.previewIdx >= 0) {
      this.previewTick();
      this.draw();
      return;
    }
    let target = false;
    if (this.playingTarget > 0) {
      const tick = replayTick(this.plan.steps, this.playingTarget);
      this.step = tick.step;
      target = tick.target;
      this.playingTarget = tick.remaining;
    } else this.step = (this.step + 1) % this.plan.steps;
    if (this.step === 0 && !target) this.loops++;
    const playing = target ? this.target : this.beat;
    playing.forEach((row, r) => {
      if (!row[this.step] || (target && this.soloing && r === 0)) return;
      this.sound(r, this.step);
    });
    // Free play: once the beat has gone round a couple of times, the green check can finish.
    // Two-year-olds finish after one sound has gone round once; every creation is welcome, even a single hit.
    if (this.plan.mode === 'free') {
      const ready = this.gentle ? hits(this.beat) >= 1 && this.loops >= 1 : hits(this.beat) >= 3 && this.loops >= 2;
      if (!this.check.visible && ready) {
        this.check.visible = true;
        void this.ctx.say('beat.done-when');
      } else if (this.gentle && this.check.visible && hits(this.beat) === 0) {
        this.check.visible = false;
        void this.ctx.say('beat.toddler-empty');
      }
    }
    this.draw();
  }

  /** The ghost finger on the how-to card: make the beat (the faint, heard or half-given one, or boom-clap in free play), then press the check where one is asked for. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.playingTarget > 0 || this.previewIdx >= 0) return null;
    if (this.plan.mode === 'return') {
      const move = returnMove(this.piece, this.order, this.previewed);
      if (!move) return null;
      if (move === 'preview') return { tap: { on: this.previewBtn } };
      if (move === 'check') return { tap: { on: this.check } };
      return { tap: { on: this.slots, x: move.slot * 130 + 55, y: 55 }, pause: 0.15 };
    }
    if (this.plan.mode === 'sections') {
      const move = sectionsMove(this.plan, this.piece, this.current, this.previewed);
      if (!move) return null;
      if (move === 'copy') return { tap: { on: this.copyBtn } };
      if (move === 'preview') return { tap: { on: this.previewBtn } };
      if (move === 'check') return { tap: { on: this.check } };
      return { tap: { on: this.grid, x: move.step * CELL + CELL / 2, y: move.row * CELL + CELL / 2 }, pause: 0.15 };
    }
    const goal = this.plan.mode === 'free' ? (this.gentle ? oneHit(this.plan) : freeBeat(this.plan)) : this.target;
    const move = beatMove(this.plan, goal, this.beat, this.check.visible);
    if (!move) return null;
    if (move === 'check') return { tap: { on: this.check } };
    // A square's middle, in the grid's own units; the grid works out which square from where the touch lands.
    return { tap: { on: this.grid, x: move.step * CELL + CELL / 2, y: move.row * CELL + CELL / 2 }, pause: 0.15 };
  }

  destroy() { this.finished = true; this.playingTarget = 0; this.previewIdx = -1; }

  private snapshot() {
    this.undoStack.push({ piece: clonePiece(this.piece), order: [...this.order] });
    if (this.undoStack.length > 50) this.undoStack.shift();
    this.previewed = false;
  }

  private switchTo(section: SectionId) {
    if (this.busy || this.finished || this.previewIdx >= 0) return;
    this.current = section;
    this.beat = this.piece[section];
    this.loops = 0;
    this.draw();
  }

  private copyAToB() {
    if (this.busy || this.finished || this.previewIdx >= 0) return;
    if (hits(this.piece.a) === 0) return void this.ctx.say('beat.ab-empty-a');
    this.snapshot();
    this.piece.b = clonePiece(this.piece).a;
    this.switchTo('b');
  }

  private undo() {
    if (this.busy || this.finished || this.previewIdx >= 0) return;
    const before = this.undoStack.pop();
    if (!before) return;
    this.piece = before.piece;
    this.order = before.order;
    this.previewed = false;
    this.beat = this.piece[this.current];
    this.draw();
  }

  /** Plays every step of A, then of B, once; Done waits for it. */
  private preview() {
    if (this.busy || this.finished || this.previewIdx >= 0) return;
    this.previewSeq = previewOrder(this.plan.steps, this.plan.mode === 'return' ? this.order : ['a', 'b']);
    this.previewIdx = 0;
    this.timer = STEP_SECONDS;
  }

  private previewTick() {
    const at = this.previewSeq[this.previewIdx];
    if (!at) {
      // One boundary tick lets the last step finish before the playhead goes back to looping.
      this.previewIdx = -1;
      this.previewed = true;
      this.step = 0;
      return;
    }
    this.previewIdx++;
    this.current = at.section;
    this.beat = this.piece[at.section];
    this.step = at.step;
    this.beat.forEach((row, r) => { if (row[at.step]) this.sound(r, at.step); });
  }

  private async checkPiece() {
    if (this.plan.mode === 'return') return this.checkReturn();
    const gate = pieceGate(this.piece, this.previewed);
    if (gate) return void this.ctx.say(`beat.ab-${gate}` as const);
    await this.win();
  }

  /** Sound and hearing gates only guide; a song that does not come back is one miss, with a reason. */
  private async checkReturn() {
    const gate = returnGate(this.piece, this.order, this.previewed);
    if (gate && gate !== 'order') return void this.ctx.say(`beat.ab-${gate}` as const);
    if (!gate) return void this.win();
    this.busy = true;
    this.misses++;
    this.wrongs++;
    sfx.boing();
    await this.ctx.say('beat.ret-order');
    if (this.wrongs >= 2 && !this.helped) {
      this.hints++;
      this.helped = true;
      void this.ctx.say('beat.ret-hint');
    }
    this.busy = false;
    this.draw();
  }

  private tapSlot(e: FederatedPointerEvent) {
    if (this.busy || this.finished || this.previewIdx >= 0) return;
    const i = Math.floor(this.slots.toLocal(e.global).x / 130);
    if (i < 0 || i > 2) return;
    this.snapshot();
    this.order[i] = this.order[i] === 'a' ? 'b' : 'a';
    this.draw();
  }

  private sound(row: number, step: number) {
    this.woodland.pulse(row);
    if (INSTRUMENTS[row].id === 'drum') sfx.drum();
    else if (INSTRUMENTS[row].id === 'clap') sfx.knock();
    else sfx.bell(7 + (step % 3), 0.22);
  }

  private async next() {
    this.busy = true;
    this.index++;
    this.wrongs = 0;
    this.playingTarget = 0;
    this.helped = false;
    if (this.index >= this.plan.beats) return void this.finale();
    const phrase = this.phrases[this.index];
    this.target = phrase?.beat ?? empty(this.plan.rows, this.plan.steps);
    this.beat = empty(this.plan.rows, this.plan.steps);
    // Repeat levels: the first half is already there.
    if (this.plan.mode === 'revise') this.beat = reviseStart(this.target, this.ctx.rng);
    if (this.plan.mode === 'mend') this.beat = mendCopy(this.target, this.index, this.ctx.rng);
    if (this.plan.mode === 'repeat') this.target.forEach((row, r) => row.forEach((on, s) => (this.beat[r][s] = givenStep(this.plan, s) && on)));
    this.resize(this.view);
    const line = { free: 'beat.free', see: 'beat.see', hear: 'beat.hear', repeat: 'beat.repeat', mend: 'beat.mend', revise: 'beat.revise', sections: 'beat.ab', return: 'beat.ret' } as const;
    if (this.plan.mode === 'free') {
      this.busy = false;
      return this.ctx.instruct(this.gentle ? 'beat.free-toddler' : line.free, { drum: INSTRUMENTS[0].name, clap: INSTRUMENTS[1].name });
    }
    if (this.plan.mode === 'return') {
      const start = returnStarter(this.plan, this.ctx.rng);
      this.piece = start.piece;
      this.order = start.order;
      this.current = 'a';
      this.beat = this.piece.a;
      this.undoStack = [];
      this.previewed = false;
      this.previewIdx = -1;
    }
    if (this.plan.mode === 'sections') { this.piece = newPiece(this.plan); this.current = 'a'; this.beat = this.piece.a; this.undoStack = []; this.previewed = false; this.previewIdx = -1; }
    if (this.index === 0) await this.ctx.instruct(line[this.plan.mode], { drum: INSTRUMENTS[0].name, clap: INSTRUMENTS[1].name });
    if (phrase) await this.ctx.say('beat.phrase', { phrase: phrase.name });
    this.busy = false;
    if (this.plan.mode === 'hear' || this.plan.mode === 'revise') this.playTarget();
  }

  /** The beat to copy plays twice, with the playhead in its own color. */
  private playTarget(solo = false) {
    if (this.busy || this.finished) return;
    this.soloing = solo;
    this.playingTarget = this.plan.steps * 2 + 1;
    this.step = this.plan.steps - 1;
    this.timer = STEP_SECONDS;
    this.draw();
  }

  private drawModel() {
    const m = this.model.clear();
    if (this.plan.mode !== 'mend') return;
    const { rows, steps } = this.plan, c = 44;
    const x0 = -(steps * c) / 2;
    m.roundRect(x0 - 10, -8, steps * c + 20, rows * c + 16, 14).fill({ color: 0xffffff, alpha: 0.85 }).stroke({ width: 4, color: wood.line });
    for (let r = 0; r < rows; r++) for (let s = 0; s < steps; s++) {
      const on = this.target[r][s];
      m.roundRect(x0 + s * c + 3, r * c + 3, c - 6, c - 6, 8).fill(on ? ROW_COLORS[r].fill : 0xf2f2f6).stroke({ width: 3, color: on ? ROW_COLORS[r].line : 0xd8d8e2 });
    }
    if (this.playingTarget > 0) m.roundRect(x0 + this.step * c, -4, c, rows * c + 8, 10).stroke({ width: 4, color: swatch.yellow.line });
  }

  /** Three big cards in time order, each showing its part's picture and its notes. */
  private drawSlots() {
    const g = this.slotView.clear();
    if (this.plan.mode !== 'return') return;
    const hint = this.helped ? returnHint(this.order) : -1;
    const playing = this.previewIdx >= 0 ? Math.min(2, Math.floor(this.previewIdx / this.plan.steps)) : -1;
    for (let i = 0; i < 3; i++) {
      const x = i * 130, section = this.order[i], sw = section === 'a' ? swatch.orange : swatch.purple;
      g.roundRect(x, 0, 110, 110, 18).fill(i === playing ? swatch.yellow.light : 0xffffff).stroke({ width: i === hint ? 8 : 5, color: i === hint ? swatch.yellow.line : sw.line });
      if (section === 'a') g.circle(x + 22, 22, 11).fill(0xffffff).stroke({ width: 4, color: swatch.orange.line });
      else g.roundRect(x + 11, 11, 22, 22, 4).fill(0xffffff).stroke({ width: 4, color: swatch.purple.line });
      const m = this.piece[section];
      m.forEach((row, r) => row.forEach((on, s) => g.roundRect(x + 11 + s * 24, 48 + r * 28, 20, 22, 4).fill(on ? ROW_COLORS[r].fill : 0xf2f2f6)));
    }
  }

  private drawMarker() {
    const m = this.marker.clear();
    if (this.plan.mode !== 'sections' && this.plan.mode !== 'return') return;
    const tab = this.current === 'a' ? this.tabA : this.tabB;
    m.circle(tab.x, tab.y, 68).fill({ color: swatch.yellow.light, alpha: 0.9 }).stroke({ width: 5, color: swatch.yellow.line });
    this.undoBtn.alpha = this.undoStack.length ? 1 : 0.45;
  }

  private draw() {
    this.drawModel();
    this.drawSlots();
    this.drawMarker();
    const g = this.cells.clear();
    const { rows, steps } = this.plan;
    g.roundRect(-14, -14, steps * CELL + 28, rows * CELL + 28, 24).fill({ color: 0xffffff, alpha: 0.7 }).stroke({ width: 5, color: wood.line });
    // The playhead column.
    g.roundRect(this.step * CELL + 2, -8, CELL - 4, rows * CELL + 16, 16).fill({ color: this.playingTarget > 0 ? swatch.yellow.light : swatch.blue.light, alpha: 0.8 });
    const help = this.helped && this.plan.mode !== 'return' ? repairs(this.plan, this.target, this.beat) : [];
    for (let r = 0; r < rows; r++)
      for (let s = 0; s < steps; s++) {
        const sw = ROW_COLORS[r];
        const on = this.beat[r][s];
        const x = s * CELL + 10;
        const y = r * CELL + 10;
        g.roundRect(x, y, CELL - 20, CELL - 20, 16).fill(on ? sw.fill : 0xffffff).stroke({ width: 4, color: on ? sw.line : 0xd8d8e2 });
        if (givenCell(this.plan, r, s) && on) g.circle(x + CELL / 2 - 10, y + CELL / 2 - 10, 8).fill({ color: 0xffffff, alpha: 0.8 });
        const repair = help.find((cell) => cell.row === r && cell.step === s);
        const faint = this.plan.mode === 'see' || repair?.add;
        if (faint && this.target[r][s] && !on) g.circle(x + CELL / 2 - 10, y + CELL / 2 - 10, 16).fill({ color: sw.fill, alpha: 0.35 });
        if (repair) {
          g.roundRect(x - 4, y - 4, CELL - 12, CELL - 12, 18).stroke({ width: 5, color: swatch.yellow.line });
          const cx = x + 40, cy = y + 40;
          g.moveTo(cx - 16, cy).lineTo(cx + 16, cy);
          if (repair.add) g.moveTo(cx, cy - 16).lineTo(cx, cy + 16);
          g.stroke({ width: 6, color: sw.line, cap: 'round' });
        }
      }
    if (this.plan.mode === 'repeat') g.moveTo((steps / 2) * CELL, -14).lineTo((steps / 2) * CELL, rows * CELL + 14).stroke({ width: 4, color: wood.line });
  }

  private tapGrid(e: FederatedPointerEvent) {
    if (this.busy || this.finished || this.playingTarget > 0 || this.previewIdx >= 0) return;
    const p = this.grid.toLocal(e.global);
    const s = Math.floor(p.x / CELL);
    const r = Math.floor(p.y / CELL);
    if (s < 0 || r < 0 || s >= this.plan.steps || r >= this.plan.rows) return;
    if (givenCell(this.plan, r, s)) {
      if (this.plan.mode === 'revise') {
        sfx.tick();
        void this.ctx.say('beat.locked');
      }
      return;
    }
    const mode = this.plan.mode;
    // Seeing and repeating levels: a square that isn't in the beat stays off, as a gentle miss.
    if ((mode === 'see' || mode === 'repeat') && !this.beat[r][s] && !this.target[r][s]) {
      this.misses++;
      this.wrongs++;
      sfx.boing();
      void this.ctx.say(mode === 'see' ? 'beat.notsee' : 'beat.notrepeat');
      if (mode === 'repeat' && this.wrongs >= 2 && !this.helped) {
        this.hints++;
        this.helped = true;
        void this.ctx.say('beat.hint');
      }
      this.draw();
      return;
    }
    if (mode === 'sections' || mode === 'return') this.snapshot();
    this.beat[r][s] = !this.beat[r][s];
    this.loops = 0;
    if (this.beat[r][s]) this.sound(r, s);
    this.draw();
    if ((mode === 'see' || mode === 'repeat') && same(this.target, this.beat)) void this.win();
  }

  private async checkBeat() {
    if (this.busy || this.finished || this.playingTarget > 0 || this.previewIdx >= 0) return;
    if (this.plan.mode === 'free') return this.gentle && hits(this.beat) === 0 ? undefined : void this.finale();
    if (this.plan.mode === 'sections' || this.plan.mode === 'return') return void this.checkPiece();
    if (same(this.target, this.beat)) return void this.win();
    this.busy = true;
    this.misses++;
    this.wrongs++;
    sfx.boing();
    if (this.plan.mode === 'mend' || this.plan.mode === 'revise') {
      const m = firstMismatch(this.target, this.beat);
      await this.ctx.say('beat.mendno', { instrument: INSTRUMENTS[m?.row ?? 0].name, place: ['first', 'second', 'third', 'fourth'][m?.step ?? 0] });
    } else await this.ctx.say('beat.nothear');
    if (this.wrongs >= 2 && !this.helped) {
      this.hints++;
      this.helped = true;
      void this.ctx.say('beat.hint');
    }
    this.busy = false;
    if (this.plan.mode !== 'mend' && this.plan.mode !== 'revise') this.playTarget();
    this.draw();
  }

  private async win() {
    this.busy = true;
    this.playingTarget = 0;
    this.helped = false;
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
  bands: ['toddler', 'preschool', 'prek', 'school'],
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
