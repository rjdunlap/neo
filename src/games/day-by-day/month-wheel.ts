import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, grass, ink, swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { label } from '../../ui/text';
import { tile } from '../shared';
import type { Game, GameContext, TouchIntent } from '../types';
import { MONTH, monthLayout, SUBMIT } from './layout';
import { monthNeighbor, MONTHS, monthQuestions, type MonthQuestion } from './logic';

/** Month order in a cycle: twelve named cards in a ring, three questions about the month before or after one. */
export class MonthWheel implements Game {
  readonly questions: MonthQuestion[];
  readonly cards: Container[] = [];
  readonly confirm = new Container();
  question = 0;
  selected: number | null = null;
  busy = true;
  finished = false;
  misses = 0;
  hints = 0;
  hinted = false;
  private wrongs = 0;
  private clock = 0;
  /** A card's name is a line that holds no input; the ghost finger lets it be heard before the next tap. */
  private playing: Promise<void> | null = null;
  private readonly backdrop;
  private readonly heading = label('Month wheel', 30);
  private readonly caption = label('', 25);
  private readonly ask = label('', 30);
  private readonly note = label('Tap a month to hear it, then tap the arrow.', 21);
  private readonly ring = new Graphics();
  private readonly glow = new Graphics();

  constructor(private readonly ctx: GameContext) {
    this.questions = monthQuestions(ctx.rng);
    this.backdrop = new Backdrop(
      {
        sky: [swatch.blue.light, cream],
        hills: [grass, swatch.green.light],
        horizon: 0.75,
        clouds: 2,
        seed: 72,
      },
      ctx.view,
    );
    this.confirm.hitArea = new Rectangle(-SUBMIT.w / 2, -SUBMIT.h / 2, SUBMIT.w, SUBMIT.h);
    this.confirm.addChild(
      tile(SUBMIT.w, SUBMIT.h, 'teal'),
      new Graphics()
        .moveTo(-26, 0)
        .lineTo(25, 0)
        .stroke({ width: 8, color: ink, cap: 'round' })
        .poly([8, -22, 34, 0, 8, 22])
        .fill(ink),
    );
    this.confirm.alpha = 0.45;
    onTap(this.confirm, () => void this.submit());
    MONTHS.forEach((_, i) => {
      const node = new Container();
      node.hitArea = new Rectangle(-MONTH.w / 2, -MONTH.h / 2, MONTH.w, MONTH.h);
      onTap(node, () => this.choose(i));
      this.cards.push(node);
    });
    for (const n of [this.heading, this.caption, this.ask, this.note, this.ring, this.glow])
      n.eventMode = 'none';
    ctx.stage.addChild(
      this.backdrop,
      this.ring,
      this.heading,
      this.caption,
      this.ask,
      this.note,
      ...this.cards,
      this.confirm,
      this.glow,
    );
    this.drawCards();
    this.resize(ctx.view);
  }

  private get current() {
    return this.questions[this.question];
  }

  start() {
    void this.begin();
  }
  destroy() {
    this.finished = true;
  }

  resize(view: View) {
    this.backdrop.resize(view);
    const l = monthLayout(view);
    this.heading.position.copyFrom(l.heading);
    this.caption.position.copyFrom(l.caption);
    this.ask.position.copyFrom(l.centre);
    this.note.position.copyFrom(l.note);
    this.confirm.position.copyFrom(l.confirm);
    this.cards.forEach((n, i) => n.position.set(l.months[i].x, l.months[i].y));
    // A faint ring joins the months, so the year reads as going round and round.
    this.ring
      .clear()
      .ellipse(l.ring.x, l.ring.y, l.ring.rx, l.ring.ry)
      .stroke({ width: 8, color: swatch.teal.light, alpha: 0.7 });
  }

  update(dt: number) {
    this.clock += dt;
    const g = this.glow.clear();
    if (this.finished) return;
    if (this.hinted) {
      for (const i of [this.current.anchor, this.current.answer]) {
        const n = this.cards[i];
        g.roundRect(n.x - MONTH.w / 2 - 6, n.y - MONTH.h / 2 - 6, MONTH.w + 12, MONTH.h + 12, 20).stroke({
          width: 5 + Math.sin(this.clock * 5),
          color: swatch.yellow.fill,
        });
      }
    }
    if (this.selected !== null) {
      const n = this.cards[this.selected];
      g.roundRect(n.x - MONTH.w / 2 - 4, n.y - MONTH.h / 2 - 4, MONTH.w + 8, MONTH.h + 8, 20).stroke({
        width: 4,
        color: swatch.teal.line,
      });
    }
  }

  private drawCards() {
    this.cards.forEach((n, i) => {
      for (const child of n.removeChildren()) child.destroy({ children: true });
      const anchor = !this.finished && this.current && this.current.anchor === i;
      n.addChild(tile(MONTH.w, MONTH.h, anchor ? 'yellow' : 'white'), label(MONTHS[i], 18));
      for (const child of n.children) child.eventMode = 'none';
    });
  }

  private words() {
    const q = this.current;
    return {
      month: MONTHS[q.anchor],
      answer: MONTHS[q.answer],
      before: MONTHS[monthNeighbor(q.anchor, -1)],
      after: MONTHS[monthNeighbor(q.anchor, 1)],
    };
  }

  private async begin() {
    this.busy = true;
    this.selected = null;
    this.wrongs = 0;
    this.hinted = false;
    this.confirm.alpha = 0.45;
    const q = this.current;
    const dir = q.direction === 1 ? 'after' : 'before';
    this.caption.text = `${this.question + 1} of 3`;
    this.ask.text = `Which month comes ${dir}\n${MONTHS[q.anchor]}?`;
    this.drawCards();
    await this.ctx.instruct(q.direction === 1 ? 'month.after' : 'month.before', this.words());
    this.busy = false;
  }

  private choose(i: number) {
    if (this.busy || this.finished) return;
    this.selected = i;
    this.confirm.alpha = 1;
    sfx.pop(4 + (i % 8));
    const line = this.ctx.say('month.name', { month: MONTHS[i] });
    this.playing = line;
    void line.then(() => {
      if (this.playing === line) this.playing = null;
    });
  }

  private async submit() {
    if (this.busy || this.finished || this.selected === null) return;
    this.busy = true;
    const vars = this.words();
    if (this.selected !== this.current.answer) {
      this.misses++;
      this.wrongs++;
      sfx.boing();
      if (this.wrongs >= 2 && !this.hinted) {
        this.hinted = true;
        this.hints++;
      }
      await this.ctx.say('month.counter', vars);
      if (this.hinted)
        await this.ctx.say(this.current.direction === 1 ? 'month.hint.after' : 'month.hint.before', vars);
      this.busy = false;
      return;
    }
    sfx.sparkle();
    const wrap = Math.abs(this.current.answer - this.current.anchor) === 11;
    const line = this.ctx.say(
      this.current.direction === 1
        ? wrap
          ? 'month.yes.wrap'
          : 'month.yes.after'
        : wrap
          ? 'month.yes.wrapback'
          : 'month.yes.before',
      vars,
    );
    if (this.question < this.questions.length - 1) {
      await line;
      this.question++;
      return void this.begin();
    }
    this.finished = true;
    await line;
    this.confirm.visible = false;
    this.glow.clear();
    this.caption.text = 'The year goes round and round!';
    this.ask.text = '';
    this.note.text = '';
    await this.ctx.say('month.done');
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.playing) return null;
    return {
      tap: { on: this.selected === this.current.answer ? this.confirm : this.cards[this.current.answer] },
    };
  }
}
