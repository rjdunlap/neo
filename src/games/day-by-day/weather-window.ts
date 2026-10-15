import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, grass, ink, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { label } from '../../ui/text';
import { tile } from '../shared';
import type { Game, GameContext, TouchIntent } from '../types';
import { weatherArt } from './art';
import { DAYS, makeWindow, summaryTrue, toggleMark, WEATHER, weatherCount, windowLayout, type Summary } from './logic';

/** Supplied evidence mode: browsing never submits an answer or earns a hint. */
export class WeatherWindow implements Game {
  readonly round;
  readonly records: Container[] = [];
  readonly tabs: Container[] = [];
  readonly choices: { n: number; node: Container }[] = [];
  readonly confirm = new Container();
  readonly replayButton = new Container();
  readonly marks: number[][] = [[], []];
  page = 0;
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
  private view: View;
  private readonly backdrop;
  private readonly heading = label('Weather Window · two pretend weeks', 29);
  private readonly caption = label('', 25);
  private readonly note = label('Tap a record to hear and mark it. Tap a summary, then the arrow.', 21);
  private readonly glow = new Graphics();
  // Demo visits both pages and each relevant observation before choosing; no hidden-record memory task.
  private readonly seen = new Set<string>();
  private readonly browsed = new Set<number>();

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.round = makeWindow(ctx.rng);
    this.backdrop = new Backdrop({ sky: [swatch.blue.light, cream], hills: [grass, swatch.green.light], horizon: 0.75, clouds: 2, seed: 72 }, ctx.view);
    this.confirm.hitArea = new Rectangle(-60, -50, 120, 100);
    this.confirm.addChild(tile(120, 100, 'teal'), new Graphics().moveTo(-26, 0).lineTo(25, 0).stroke({ width: 8, color: ink, cap: 'round' }).poly([8, -22, 34, 0, 8, 22]).fill(ink));
    onTap(this.confirm, () => void this.submit());
    // The pictured question is also a large replay control.
    this.replayButton.hitArea = new Rectangle(-55, -50, 110, 100);
    this.replayButton.addChild(tile(110, 100, 'white'));
    onTap(this.replayButton, () => void this.replayQuestion());
    for (let i = 0; i < 2; i++) {
      const tab = new Container();
      tab.hitArea = new Rectangle(-80, -50, 160, 100);
      onTap(tab, () => void this.browse(i));
      this.tabs.push(tab);
    }
    for (let i = 0; i < 7; i++) {
      const node = new Container();
      node.hitArea = new Rectangle(-54, -56, 108, 112);
      onTap(node, () => void this.replayRecord(i));
      this.records.push(node);
    }
    for (const n of [this.heading, this.caption, this.note, this.glow]) n.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.heading, this.caption, this.note, ...this.tabs, ...this.records, this.replayButton, this.confirm, this.glow);
    this.drawPage();
    this.resize(ctx.view);
  }

  start() { void this.ask(); }
  destroy() { this.finished = true; }
  resize(view: View) {
    this.view = view;
    this.backdrop.resize(view);
    const l = windowLayout(view.w);
    this.heading.position.set(view.w / 2, 113);
    this.caption.position.set(view.w / 2, 156);
    this.note.position.set(view.w / 2, 428);
    this.tabs.forEach((n, i) => n.position.set(l.tabs[i].x, l.tabs[i].y));
    this.records.forEach((n, i) => n.position.set(l.records[i].x, l.records[i].y));
    this.choices.forEach((p, i) => p.node.position.set(l.choices[i].x, l.choices[i].y));
    this.confirm.position.set(l.confirm.x, l.confirm.y);
    this.replayButton.position.set(view.w / 2 - 350, 234);
  }

  update(dt: number) {
    this.clock += dt;
    const g = this.glow.clear();
    if (this.finished) return;
    if (this.hinted) {
      this.records.forEach((n, i) => {
        if (this.round.weeks[this.page][i] === this.current.weather) g.roundRect(n.x - 57, n.y - 59, 114, 118, 16).stroke({ width: 4, color: swatch.yellow.line });
      });
      const n = this.choices[this.answer]?.node;
      if (n) g.roundRect(n.x - 150, n.y - 75, 300, 150, 20).stroke({ width: 5 + Math.sin(this.clock * 5), color: swatch.yellow.fill });
    }
    if (this.selected !== null) {
      const n = this.choices[this.selected].node;
      g.roundRect(n.x - 147, n.y - 72, 294, 144, 20).stroke({ width: 4, color: swatch.teal.line });
    }
  }

  private get current() { return this.round.questions[this.question]; }
  private text(summary: Summary) {
    const weather = WEATHER[this.current.weather];
    return summary === 'equal' ? `Both weeks have the same\nnumber of ${weather} days` : summary === 'different' ? `The weeks have different\nnumbers of ${weather} days` : `Week ${summary === 'a-more' ? 'A' : 'B'} has more\n${weather} days`;
  }
  private speakSummary(summary: Summary) {
    return this.ctx.say(summary === 'equal' ? 'window.equal' : summary === 'different' ? 'window.different' : 'window.more', { weather: WEATHER[this.current.weather], week: summary === 'a-more' ? 'A' : 'B' });
  }
  private clear(node: Container) { for (const child of node.removeChildren()) child.destroy({ children: true }); }
  private drawPage() {
    this.tabs.forEach((n, i) => {
      this.clear(n);
      n.addChild(tile(160, 100, this.page === i ? 'teal' : 'white'), label(`Week ${i === 0 ? 'A' : 'B'}`, 26));
      for (const child of n.children) child.eventMode = 'none';
    });
    this.records.forEach((n, i) => {
      this.clear(n);
      const marked = this.marks[this.page].includes(i);
      n.addChild(new Graphics().roundRect(-54, -56, 108, 112, 14).fill(marked ? swatch.yellow.light : cream).stroke({ width: 2, color: wood.line }));
      const name = label(DAYS[i], 17); name.y = -30;
      const sky = weatherArt(this.round.weeks[this.page][i]); sky.scale.set(0.6); sky.y = 13;
      n.addChild(name, sky);
      if (marked) n.addChild(new Graphics().circle(39, 40, 7).fill(swatch.yellow.line));
      for (const child of n.children) child.eventMode = 'none';
    });
  }
  private async ask() {
    this.busy = true;
    this.selected = null;
    this.wrongs = 0;
    this.hinted = false;
    this.seen.clear(); this.browsed.clear(); this.browsed.add(this.page);
    this.marks[0] = []; this.marks[1] = [];
    this.drawPage();
    this.caption.text = `${this.question + 1} of 2 · ${this.question === 0 ? 'Which week has more rainy days?' : 'Are the sunny-day totals equal?'}`;
    this.clear(this.replayButton);
    const picture = weatherArt(this.current.weather); picture.scale.set(0.6);
    this.replayButton.addChild(tile(110, 100, 'white'), picture);
    for (const child of this.replayButton.children) child.eventMode = 'none';
    for (const p of this.choices.splice(0)) p.node.destroy({ children: true });
    this.answer = this.current.choices.findIndex(s => summaryTrue(this.round.weeks, this.current.weather, s));
    this.current.choices.forEach((s, i) => {
      const n = new Container(); n.hitArea = new Rectangle(-145, -70, 290, 140);
      const text = label(this.text(s), 23); text.y = 21;
      // Pictures repeat both the weather and the relation, so the spoken summary stays anchored.
      const a = label(s === 'a-more' ? 'A > B' : s === 'b-more' ? 'B > A' : s === 'equal' ? 'A = B' : 'A ≠ B', 28); a.y = -38;
      const picture = weatherArt(this.current.weather); picture.scale.set(0.3); picture.position.set(-112, -38);
      n.addChild(tile(290, 140, 'white'), a, picture, text);
      for (const child of n.children) child.eventMode = 'none';
      onTap(n, () => void this.choose(i));
      this.choices.push({ n: i, node: n }); this.ctx.stage.addChild(n);
    });
    this.confirm.alpha = 0.45;
    this.ctx.stage.addChild(this.glow);
    this.resize(this.view);
    await this.ctx.instruct(this.question === 0 ? 'window.rain' : 'window.sun');
    this.busy = false;
  }
  private async replayQuestion() {
    if (this.busy || this.finished) return;
    this.busy = true;
    sfx.pop(4);
    await this.ctx.instruct(this.question === 0 ? 'window.rain' : 'window.sun');
    this.busy = false;
  }
  private async browse(page: number) {
    if (this.busy || this.finished) return;
    this.busy = true; this.page = page; this.browsed.add(page);
    this.drawPage(); sfx.pop(4 + page);
    await this.ctx.say('window.page', { week: page === 0 ? 'A' : 'B' });
    this.busy = false;
  }
  private async replayRecord(day: number) {
    if (this.busy || this.finished) return;
    this.busy = true;
    this.marks[this.page] = toggleMark(this.marks[this.page], day, 7);
    this.seen.add(`${this.page}:${day}`);
    this.drawPage(); sfx.pop(4 + day);
    await this.ctx.say('window.record', { week: this.page === 0 ? 'A' : 'B', day: DAYS[day], weather: WEATHER[this.round.weeks[this.page][day]] });
    this.busy = false;
  }
  private async choose(i: number) {
    if (this.busy || this.finished) return;
    this.busy = true; this.selected = i; this.confirm.alpha = 1; sfx.pop(4 + i);
    await this.speakSummary(this.current.choices[i]);
    this.busy = false;
  }
  private async submit() {
    if (this.busy || this.finished || this.selected === null) return;
    this.busy = true;
    const [a, b] = this.round.weeks.map(w => weatherCount(w, this.current.weather));
    const vars = { a, b, weather: WEATHER[this.current.weather] };
    if (this.selected !== this.answer) {
      this.misses++; this.wrongs++; sfx.boing();
      if (this.wrongs >= 2 && !this.hinted) { this.hinted = true; this.hints++; }
      await this.ctx.say('window.counter', vars);
      await this.speakSummary(this.current.choices[this.answer]);
      this.busy = false;
      return;
    }
    sfx.sparkle();
    await this.ctx.say('window.evidence', vars);
    this.question++;
    if (this.question < 2) { await this.ask(); return; }
    this.finished = true;
    this.confirm.visible = false;
    this.choices.forEach(p => p.node.visible = false);
    this.caption.text = 'We compared two pretend weeks!'; this.note.text = '';
    await this.ctx.say('window.done');
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished) return null;
    const day = this.round.weeks[this.page].findIndex((w, i) => w === this.current.weather && !this.seen.has(`${this.page}:${i}`));
    if (day >= 0) return { tap: { on: this.records[day] } };
    const next = [0, 1].find(p => !this.browsed.has(p));
    if (next !== undefined) return { tap: { on: this.tabs[next] } };
    return { tap: { on: this.selected === this.answer ? this.confirm : this.choices[this.answer].node } };
  }
}
