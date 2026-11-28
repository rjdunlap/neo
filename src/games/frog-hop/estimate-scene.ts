import { Container, Graphics, Rectangle, type Text } from 'pixi.js';
import { frogArt } from '../../art/animals';
import { ink, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { label } from '../../ui/text';
import type { Game, GameContext, TouchIntent } from '../types';
import {
  closeness,
  estimateLayout,
  makeQuestions,
  nearestTen,
  placeOf,
  planFor,
  valueAt,
  type HopQuestion,
} from './logic';

/**
 * Where does it go? (level 15, dive slice 11): a line from 0 to 100 with only its ends labelled. "Where does 37 go?" She taps
 * the line or drags the frog there; then the marks by tens appear and the frog hops to the real place. The three guesses are
 * never wrong. The last question is on a line marked in tens (no numbers but the ends): a wrong mark is a miss, from the
 * second the right mark glows (one counted hint), and the third is a supported finish.
 */
const SKY = {
  sky: [0x8fd3f7, 0xe9f7ff],
  hills: [0x7fd0e8, 0x5bb8d8, 0x4aa8c9],
  horizon: 0.42,
  clouds: 2,
  sun: true,
  seed: 67,
} satisfies ConstructorParameters<typeof Backdrop>[0];

/** The frog's feet sit this far above the line. */
const PERCH = 10;

export class EstimateLine implements Game {
  readonly questions: HopQuestion[];
  private readonly backdrop: Backdrop;
  private readonly line = new Graphics();
  private readonly marks = new Graphics();
  private readonly markLabels = new Container();
  private readonly ends: [Text, Text];
  readonly band = new Container();
  readonly frog = frogArt();
  private readonly frogNum: Text;
  private readonly pin = new Graphics();
  private readonly sign = new Container();
  private readonly signBoard = new Graphics();
  private readonly signText: Text;
  private readonly glow = new Graphics();
  private readonly drag: DragHandle;
  private view: View;
  index = -1;
  busy = true;
  finished = false;
  misses = 0;
  hints = 0;
  /** Wrong marks on the marked line, and whether its hint has been counted. */
  wrong = 0;
  hinted = false;
  /** The mark that glows (a number), or none. */
  glowAt: number | null = null;
  /** What each guess was, for the scripted play and the record. */
  readonly guesses: { target: number; guess: number }[] = [];
  private clock = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.questions = makeQuestions(planFor(ctx.level), ctx.rng);
    this.backdrop = new Backdrop(SKY, ctx.view);
    this.signText = label('', 56, ink);
    this.sign.addChild(this.signBoard, this.signText);
    this.ends = [label('0', 44, ink), label('100', 44, ink)];
    this.frogNum = label('', 40, ink);
    this.pin
      .moveTo(0, 0)
      .lineTo(0, -56)
      .stroke({ width: 5, color: wood.line })
      .poly([2, -56, 34, -46, 2, -36])
      .fill(swatch.red.fill)
      .stroke({ width: 3, color: swatch.red.line });
    this.pin.visible = false;
    for (const n of [
      this.line,
      this.marks,
      this.markLabels,
      this.pin,
      this.sign,
      this.glow,
      this.frogNum,
      ...this.ends,
    ])
      n.eventMode = 'none';
    ctx.stage.addChild(
      this.backdrop,
      this.band,
      this.line,
      this.marks,
      this.markLabels,
      ...this.ends,
      this.pin,
      this.glow,
      this.frog,
      this.frogNum,
      this.sign,
    );
    // The whole band around the line takes a touch as a place on it.
    onTap(this.band, (e) => void this.commit(this.band.toLocal(e.global).x), { cooldown: 250 });
    this.frog.scale.set(1.25);
    this.frog.hitArea = new Rectangle(-60, -90, 120, 110);
    this.drag = draggable(this.frog, ctx.tw, {
      lift: 0,
      keepGrab: true,
      onMove: (x) => {
        const { x0, x1, y } = estimateLayout(this.view).line;
        this.frog.position.set(Math.max(x0, Math.min(x1, x)), y - PERCH);
      },
      onDrop: (x) => {
        // A still tap on the frog is a place on the line, as a tap anywhere on it is.
        void this.commit(x);
        return true;
      },
    });
    this.drag.enabled = false;
  }

  private get q() {
    return this.questions[this.index];
  }

  private get L() {
    return estimateLayout(this.view);
  }

  private x(n: number) {
    const { x0, x1 } = this.L.line;
    return placeOf(n, x0, x1);
  }

  start() {
    void this.next();
  }

  private setSign(text: string) {
    this.signText.text = text;
    const w = Math.max(200, this.signText.width + 80);
    this.signBoard
      .clear()
      .roundRect(-w / 2, -52, w, 104, 26)
      .fill(wood.light)
      .stroke({ width: 6, color: wood.line });
  }

  /** The line, its end labels, and the marks by tens when the question has them (or once a guess is shown). */
  private drawLine(withMarks: boolean, withNumbers: boolean) {
    const { x0, x1, y } = this.L.line;
    this.line
      .clear()
      .moveTo(x0, y)
      .lineTo(x1, y)
      .stroke({ width: 10, color: wood.line, cap: 'round' })
      .moveTo(x0, y - 26)
      .lineTo(x0, y + 26)
      .moveTo(x1, y - 26)
      .lineTo(x1, y + 26)
      .stroke({ width: 7, color: wood.line, cap: 'round' });
    this.ends[0].position.set(x0, y + 62);
    this.ends[1].position.set(x1, y + 62);
    const m = this.marks.clear();
    for (const old of this.markLabels.removeChildren()) old.destroy();
    if (!withMarks) return;
    for (let n = 10; n < 100; n += 10)
      m.moveTo(this.x(n), y - 18)
        .lineTo(this.x(n), y + 18)
        .stroke({ width: 5, color: wood.line, cap: 'round' });
    if (!withNumbers) return;
    for (let n = 10; n < 100; n += 10) {
      const t = label(String(n), 28, ink, '500');
      t.position.set(this.x(n), y + 46);
      this.markLabels.addChild(t);
    }
  }

  private async next() {
    this.busy = true;
    this.drag.enabled = false;
    this.index++;
    this.wrong = 0;
    this.hinted = false;
    this.glowAt = null;
    this.pin.visible = false;
    this.frogNum.text = '';
    if (this.index >= this.questions.length) return void this.finale();
    const q = this.q;
    this.drawLine(q.place === 'ticks', false);
    this.markLabels.alpha = 1;
    this.setSign(String(q.target));
    this.sign.scale.set(0.2);
    void this.ctx.tw.to(this.sign.scale, { x: 1, y: 1 }, { duration: 0.35, ease: ease.outBack });
    // The frog waits on 0.
    const { y } = this.L.line;
    await this.ctx.tw.to(this.frog, { x: this.x(0), y: y - PERCH }, { duration: 0.35, ease: ease.inOutSine });
    this.busy = false;
    this.drag.enabled = true;
    this.ask();
  }

  private ask() {
    const q = this.q;
    if (!q) return;
    void this.ctx.instruct(q.place === 'ticks' ? 'hop.est.ticks' : 'hop.est', { n: q.target });
  }

  /** One hop to a number, the frog's arc as long as the trip. */
  private async leapTo(n: number) {
    const { y } = this.L.line;
    const to = this.x(n);
    const lift = 40 + Math.min(140, Math.abs(to - this.frog.x) * 0.3);
    sfx.pop(5);
    void this.ctx.tw
      .to(this.frog, { y: y - PERCH - lift }, { duration: 0.2, ease: ease.outQuad })
      .then(() => this.ctx.tw.to(this.frog, { y: y - PERCH }, { duration: 0.2, ease: ease.inQuad }));
    await this.ctx.tw.to(this.frog, { x: to }, { duration: 0.4 });
    this.frog.y = y - PERCH;
  }

  /** She chose a place on the line (by a tap, or by letting go of the frog). */
  private async commit(x: number) {
    if (this.busy || this.finished || !this.q) return;
    const { x0, x1 } = this.L.line;
    const n = valueAt(x, x0, x1);
    this.busy = true;
    this.drag.enabled = false;
    if (this.q.place === 'ticks') return void this.placeTick(nearestTen(n));
    return void this.guess(n);
  }

  /** An unscored guess: the pin stays where she chose, the marks and their numbers appear, the frog hops to the real place. */
  private async guess(n: number) {
    const q = this.q;
    this.guesses.push({ target: q.target, guess: n });
    sfx.pluck(6);
    await this.leapTo(n);
    const { y } = this.L.line;
    this.pin.position.set(this.x(n), y - 4);
    this.pin.visible = true;
    await this.ctx.tw.wait(0.3);
    this.drawLine(true, true);
    this.markLabels.alpha = 0;
    sfx.sparkle();
    await this.ctx.tw.to(this.markLabels, { alpha: 1 }, { duration: 0.5 });
    await this.ctx.tw.wait(0.4);
    await this.leapTo(q.target);
    sfx.croak();
    this.showFrogNumber();
    // How close she was and where it really goes, in one line (a far guess hears only where it goes).
    const near = closeness(n, q.target);
    await this.ctx.say(near === 'far' ? 'hop.est.here' : `hop.est.${near}`, { n: q.target });
    await this.ctx.tw.wait(0.6);
    void this.next();
  }

  private showFrogNumber() {
    const { y } = this.L.line;
    this.frogNum.text = String(this.q.target);
    this.frogNum.position.set(this.frog.x, y - 150);
  }

  /** The counted question: a place snaps to its nearest mark. */
  private async placeTick(n: number) {
    const q = this.q;
    await this.leapTo(n);
    if (n === q.target) {
      this.ctx.pet.cheer();
      sfx.croak();
      sfx.sparkle();
      this.showFrogNumber();
      await this.ctx.say('hop.est.ticks.yay', { n });
      return void this.next();
    }
    this.misses++;
    this.wrong++;
    sfx.boing();
    if (this.wrong >= 2) this.charge();
    if (this.wrong >= 3) {
      // A third wrong mark: the pet shows the place, counting the marks.
      await this.ctx.say('hop.est.ticks.hint', { n: q.target });
      await this.leapTo(q.target);
      this.showFrogNumber();
      await this.ctx.say('hop.est.here', { n: q.target });
      return void this.next();
    }
    // The clue plays over an open line: a place chosen while it is spoken still counts.
    this.busy = false;
    this.drag.enabled = true;
    void this.ctx.say(this.wrong >= 2 ? 'hop.est.ticks.hint' : 'hop.est.ticks.wrong', { n, m: q.target });
  }

  /** The right mark glows; one counted hint per question however often it is asked for. */
  private charge() {
    this.glowAt = this.q.target;
    if (!this.hinted) {
      this.hinted = true;
      this.hints++;
    }
  }

  /** Show a hint, from the pause sheet. On a guess there is nothing to count: how the line works. */
  askForHint() {
    if (this.busy || this.finished || !this.q) return;
    if (this.q.place === 'ticks') {
      this.charge();
      void this.ctx.say('hop.est.ticks.hint', { n: this.q.target });
    } else void this.ctx.say('hop.est.hint', { n: this.q.target });
  }

  hintLabel = 'Show a hint';

  /** The ghost finger: a tap on the line at the number's real place. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || !this.q) return null;
    return { tap: { on: this.band, x: this.x(this.q.target), y: this.L.line.y } };
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    const L = this.L;
    this.band.hitArea = new Rectangle(L.band.x, L.band.y, L.band.w, L.band.h);
    this.sign.position.set(L.sign.x, L.sign.y);
    if (!this.q) {
      this.drawLine(false, false);
      this.frog.position.set(this.x(0), L.line.y - PERCH);
      return;
    }
    const shown = this.markLabels.children.length > 0;
    this.drawLine(this.q.place === 'ticks' || shown, shown);
    if (!this.ctx.tw.busy(this.frog)) this.frog.y = L.line.y - PERCH;
    this.pin.y = L.line.y - 4;
  }

  update(dt: number) {
    this.clock += dt;
    const g = this.glow.clear();
    if (this.glowAt !== null && !this.finished) {
      const { y } = this.L.line;
      g.circle(this.x(this.glowAt), y, 40 + 4 * Math.sin(this.clock * 6)).stroke({
        width: 7,
        color: swatch.yellow.fill,
      });
    }
  }

  destroy() {
    this.drag.destroy();
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    sfx.tada();
    await this.ctx.say('hop.done');
    await this.ctx.tw.wait(0.5);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}
