import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, grass, ink, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { label } from '../../ui/text';
import { tile } from '../shared';
import type { Game, GameContext, TouchIntent } from '../types';
import { daylightLayout, REPLAY, SUBMIT, SUMMARY } from './layout';
import {
  DAYLIGHT_BARS,
  DAYLIGHT_SCALE,
  daylightTrue,
  makeDaylight,
  type DaylightQuestion,
  type DaylightSummary,
} from './logic';

const NAMES = ['A', 'B'] as const;
const WHEN = ['one time of year', 'another time of year'] as const;

/** Which panels a summary is about: the longer one, or both when the records are the same or differ. */
export const hintPanels = (q: DaylightQuestion): number[] => {
  const [a, b] = q.records;
  return a.every((v, i) => v > b[i]) ? [0] : b.every((v, i) => v > a[i]) ? [1] : [0, 1];
};

/**
 * Daylight records (level 8): two supplied, explicitly pretend records from one pretend town, each five bars on a toy
 * scale of ten. Browsing is free; only a wrong confirmation is a miss. No hours, seasons or causes are claimed.
 */
export class DaylightRecords implements Game {
  readonly round;
  readonly panels: Container[] = [];
  readonly choices: { n: number; node: Container }[] = [];
  readonly confirm = new Container();
  readonly replayButton = new Container();
  question = 0;
  selected: number | null = null;
  answer = 0;
  busy = true;
  finished = false;
  misses = 0;
  hints = 0;
  hinted = false;
  private wrongs = 0;
  private clock = 0;
  /** The second question's ask, waiting behind the first question's evidence line; said at her first tap or by the guide. */
  private unasked: (() => Promise<void>) | null = null;
  private playing: Promise<void> | null = null;
  private view: View;
  private readonly backdrop;
  private readonly heading = label('Daylight records · a pretend town', 29);
  private readonly caption = label('', 25);
  private readonly note = label('A longer bar is more daylight. Tap a record to hear it.', 21);
  private readonly glow = new Graphics();
  private readonly visited = new Set<number>();
  private marked = -1;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.round = makeDaylight(ctx.rng);
    this.backdrop = new Backdrop(
      {
        sky: [swatch.blue.light, cream],
        hills: [grass, swatch.green.light],
        horizon: 0.75,
        clouds: 2,
        seed: 81,
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
    onTap(this.confirm, () => void this.submit());
    this.replayButton.hitArea = new Rectangle(-REPLAY.w / 2, -REPLAY.h / 2, REPLAY.w, REPLAY.h);
    this.replayButton.addChild(tile(REPLAY.w, REPLAY.h, 'white'), this.sunArt());
    for (const child of this.replayButton.children) child.eventMode = 'none';
    onTap(this.replayButton, () => void this.replayQuestion());
    for (let i = 0; i < 2; i++) {
      const node = new Container();
      onTap(node, () => this.hearRecord(i));
      this.panels.push(node);
    }
    for (const n of [this.heading, this.caption, this.note, this.glow]) n.eventMode = 'none';
    ctx.stage.addChild(
      this.backdrop,
      this.heading,
      this.caption,
      this.note,
      ...this.panels,
      this.replayButton,
      this.confirm,
      this.glow,
    );
    this.resize(ctx.view);
    this.drawPanels();
  }

  start() {
    void this.ask();
  }
  destroy() {
    this.finished = true;
  }
  sayWaitingAsk() {
    return this.askNow();
  }
  private get current() {
    return this.round.questions[this.question];
  }
  private sunArt() {
    const sun = new Graphics()
      .circle(0, 0, 22)
      .fill(swatch.yellow.fill)
      .stroke({ width: 3, color: swatch.yellow.line });
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      sun.moveTo(Math.cos(a) * 30, Math.sin(a) * 30).lineTo(Math.cos(a) * 40, Math.sin(a) * 40);
    }
    return sun.stroke({ width: 5, color: swatch.yellow.line, cap: 'round' });
  }
  private hear(line: Promise<void>) {
    this.playing = line;
    void line.then(() => {
      if (this.playing === line) this.playing = null;
    });
  }
  private askNow() {
    const ask = this.unasked;
    if (!ask || this.finished) return false;
    this.unasked = null;
    void ask();
    return true;
  }
  resize(view: View) {
    this.view = view;
    this.backdrop.resize(view);
    const l = daylightLayout(view);
    this.heading.position.copyFrom(l.heading);
    this.caption.position.copyFrom(l.caption);
    this.note.position.copyFrom(l.note);
    this.panels.forEach((n, i) => {
      n.position.set(l.panels[i].x, l.panels[i].y);
      n.hitArea = new Rectangle(-l.panel.w / 2, -l.panel.h / 2, l.panel.w, l.panel.h);
    });
    this.choices.forEach((p, i) => p.node.position.set(l.choices[i].x, l.choices[i].y));
    this.confirm.position.set(l.confirm.x, l.confirm.y);
    this.replayButton.position.copyFrom(l.replay);
    this.drawPanels();
  }

  update(dt: number) {
    this.clock += dt;
    const g = this.glow.clear();
    if (this.finished) return;
    const panel = daylightLayout(this.view).panel;
    if (this.hinted) {
      for (const i of hintPanels(this.current)) {
        const n = this.panels[i];
        g.roundRect(n.x - panel.w / 2 - 4, n.y - panel.h / 2 - 4, panel.w + 8, panel.h + 8, 18).stroke({
          width: 4,
          color: swatch.yellow.line,
        });
      }
      const n = this.choices[this.answer]?.node;
      if (n)
        g.roundRect(n.x - 150, n.y - 75, 300, 150, 20).stroke({
          width: 5 + Math.sin(this.clock * 5),
          color: swatch.yellow.fill,
        });
    }
    if (this.selected !== null) {
      const n = this.choices[this.selected].node;
      g.roundRect(n.x - 147, n.y - 72, 294, 144, 20).stroke({ width: 4, color: swatch.teal.line });
    }
  }

  private text(summary: DaylightSummary) {
    return summary === 'same'
      ? 'The two records show the\nsame daylight'
      : summary === 'different'
        ? 'The two records show\ndifferent daylight'
        : `Record ${summary === 'a-longer' ? 'A' : 'B'} shows\nlonger daylight`;
  }
  private speakSummary(summary: DaylightSummary) {
    return this.ctx.say(
      summary === 'same'
        ? 'daylight.same'
        : summary === 'different'
          ? 'daylight.different'
          : 'daylight.longer',
      { record: summary === 'a-longer' ? 'A' : 'B' },
    );
  }
  private clear(node: Container) {
    for (const child of node.removeChildren()) child.destroy({ children: true });
  }
  private drawPanels() {
    const panel = daylightLayout(this.view).panel;
    const barW = panel.w - 110;
    const barH = panel.h > 160 ? 22 : 19;
    const gap = (panel.h - 44 - DAYLIGHT_BARS * barH) / (DAYLIGHT_BARS - 1);
    this.panels.forEach((n, i) => {
      this.clear(n);
      const g = new Graphics()
        .roundRect(-panel.w / 2, -panel.h / 2, panel.w, panel.h, 16)
        .fill(this.marked === i ? swatch.yellow.light : cream)
        .stroke({ width: 3, color: wood.line });
      n.addChild(g);
      const name = label(`Record ${NAMES[i]}`, 24);
      name.position.set(-panel.w / 2 + 62, -panel.h / 2 + 24);
      n.addChild(name);
      const left = -panel.w / 2 + 66;
      for (let b = 0; b < DAYLIGHT_BARS; b++) {
        const y = -panel.h / 2 + 50 + b * (barH + gap);
        // The faint track is the whole toy scale of ten, so a bar's length reads against a fixed measure.
        const bars = new Graphics()
          .roundRect(left, y, barW, barH, 6)
          .fill(swatch.blue.light)
          .roundRect(left, y, (barW * this.record(i)[b]) / DAYLIGHT_SCALE, barH, 6)
          .fill(swatch.yellow.fill)
          .stroke({ width: 2, color: swatch.yellow.line });
        n.addChild(bars);
      }
      for (const child of n.children) child.eventMode = 'none';
    });
  }
  private record(i: number): readonly number[] {
    return this.current.records[i];
  }
  private async ask(after?: Promise<unknown>) {
    this.busy = true;
    this.selected = null;
    this.wrongs = 0;
    this.hinted = false;
    this.marked = -1;
    this.visited.clear();
    this.caption.text = `${this.question + 1} of 2 · ${this.question === 0 ? 'Which record shows longer daylight?' : 'Are the two records the same?'}`;
    for (const p of this.choices.splice(0)) p.node.destroy({ children: true });
    this.answer = this.current.choices.findIndex((s) => daylightTrue(this.current.records, s));
    this.current.choices.forEach((s, i) => {
      const n = new Container();
      n.hitArea = new Rectangle(-SUMMARY.w / 2, -SUMMARY.h / 2, SUMMARY.w, SUMMARY.h);
      const text = label(this.text(s), 23);
      text.y = 21;
      const a = label(
        s === 'a-longer' ? 'A > B' : s === 'b-longer' ? 'B > A' : s === 'same' ? 'A = B' : 'A ≠ B',
        28,
      );
      a.y = -38;
      n.addChild(tile(SUMMARY.w, SUMMARY.h, 'white'), a, text);
      for (const child of n.children) child.eventMode = 'none';
      onTap(n, () => this.choose(i));
      this.choices.push({ n: i, node: n });
      this.ctx.stage.addChild(n);
    });
    this.confirm.alpha = 0.45;
    this.ctx.stage.addChild(this.glow);
    this.resize(this.view);
    const line = this.question === 0 ? 'daylight.first' : 'daylight.second';
    if (after) {
      const run = async () => {
        this.busy = true;
        await this.ctx.instruct(line);
        this.busy = false;
      };
      this.unasked = run;
      this.busy = false;
      void after.then(() => {
        if (this.unasked === run) this.askNow();
      });
      return;
    }
    await this.ctx.instruct(line);
    this.busy = false;
  }
  private async replayQuestion() {
    if (this.busy || this.finished || this.askNow()) return;
    this.busy = true;
    sfx.pop(4);
    await this.ctx.instruct(this.question === 0 ? 'daylight.first' : 'daylight.second');
    this.busy = false;
  }
  // A record's and a summary's names never hold input: her next tap cuts the line.
  private hearRecord(i: number) {
    if (this.busy || this.finished || this.askNow()) return;
    this.marked = this.marked === i ? -1 : i;
    this.visited.add(i);
    this.drawPanels();
    sfx.pop(4 + i);
    this.hear(this.ctx.say('daylight.record', { record: NAMES[i], when: WHEN[i] }));
  }
  private choose(i: number) {
    if (this.busy || this.finished || this.askNow()) return;
    this.selected = i;
    this.confirm.alpha = 1;
    sfx.pop(4 + i);
    this.hear(this.speakSummary(this.current.choices[i]));
  }
  private async submit() {
    if (this.busy || this.finished || this.askNow() || this.selected === null) return;
    this.busy = true;
    const truth = this.current.choices[this.answer];
    if (this.selected !== this.answer) {
      this.misses++;
      this.wrongs++;
      sfx.boing();
      if (this.wrongs >= 2 && !this.hinted) {
        this.hinted = true;
        this.hints++;
      }
      await this.ctx.say('daylight.counter');
      await this.speakSummary(truth);
      this.busy = false;
      return;
    }
    sfx.sparkle();
    const line = this.ctx.say(
      truth === 'same'
        ? 'daylight.evidence.same'
        : truth === 'different'
          ? 'daylight.evidence.different'
          : 'daylight.evidence.longer',
      { record: truth === 'a-longer' ? 'A' : 'B' },
    );
    if (this.question === 0) {
      this.question++;
      this.drawPanels();
      void this.ask(line);
      return;
    }
    this.finished = true;
    await line;
    this.question++;
    this.confirm.visible = false;
    this.choices.forEach((p) => (p.node.visible = false));
    this.caption.text = 'We compared two pretend records!';
    this.note.text = '';
    await this.ctx.say('daylight.done');
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.unasked || this.playing) return null;
    const next = [0, 1].find((p) => !this.visited.has(p));
    if (next !== undefined) return { tap: { on: this.panels[next] } };
    return { tap: { on: this.selected === this.answer ? this.confirm : this.choices[this.answer].node } };
  }
}
