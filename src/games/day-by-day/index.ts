import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, grass, ink, swatch, wood } from '../../art/palette';
import { puffs } from '../../art/shapes';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { choicesFor, DAYS, makeWeek, neighbor, planFor, sunnyCount, toggleMark, WEATHER, weekLayout } from './logic';

const LEVELS: BandLevels = { prek: { min: 1, max: 2 }, school: { min: 2, max: 3 } };

function weatherArt(kind: number): Graphics {
  const g = new Graphics();
  if (kind === 0) {
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      g.moveTo(Math.cos(a) * 30, Math.sin(a) * 30).lineTo(Math.cos(a) * 42, Math.sin(a) * 42);
    }
    g.stroke({ width: 5, color: swatch.yellow.line, cap: 'round' });
    g.circle(0, 0, 23).fill(swatch.yellow.fill).stroke({ width: 3, color: swatch.yellow.line });
  } else {
    puffs(g, [[-20, 0, 18], [-14, -14, 23], [15, -10, 20], [22, 2, 16], [0, 6, 17]],
      kind === 1 ? swatch.white.fill : swatch.blue.light, swatch.blue.line, 3);
    if (kind === 2) for (const x of [-22, 0, 22]) g.moveTo(x, 26).lineTo(x - 5, 39).stroke({ width: 5, color: swatch.blue.fill, cap: 'round' });
  }
  g.eventMode = 'none';
  return g;
}

function flower(color: number, grown: boolean): Graphics {
  const g = new Graphics().moveTo(0, 30).lineTo(0, -10).stroke({ width: 6, color: swatch.green.line })
    .ellipse(-12, 10, 15, 7).ellipse(12, 0, 15, 7).fill(swatch.green.fill);
  if (grown) {
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5;
      g.circle(Math.cos(a) * 17, -23 + Math.sin(a) * 17, 12).fill(color);
    }
    g.circle(0, -23, 10).fill(swatch.yellow.fill);
  } else g.ellipse(0, -15, 8, 12).fill(swatch.green.fill);
  return g;
}

class DayByDay implements Game {
  readonly plan;
  readonly week;
  readonly records: Container[] = [];
  readonly choices: { n: number; node: Container }[] = [];
  readonly confirm = new Container();
  day = 0;
  recorded = 0;
  phase: 'day' | 'weather' | 'relative' | 'tally' = 'day';
  selected: number | null = null;
  answer = 0;
  question = 0;
  marks: number[] = [];
  busy = true;
  finished = false;
  misses = 0;
  hints = 0;
  hinted = false;
  private wrongs = 0;
  private clock = 0;
  private view: View;
  private readonly backdrop: Backdrop;
  private readonly garden = new Container();
  private readonly sky = new Container();
  private readonly heading = label('Our pretend week', 30);
  private readonly caption = label('', 27);
  private readonly note = label('', 23);
  private readonly glow = new Graphics();

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.week = makeWeek(ctx.rng);
    this.backdrop = new Backdrop({ sky: [swatch.blue.light, cream], hills: [grass, swatch.green.light], horizon: 0.65, clouds: 2, seed: 72 }, ctx.view);
    this.confirm.addChild(tile(120, 110, 'teal'), new Graphics().moveTo(-28, 0).lineTo(25, 0).stroke({ width: 8, color: ink, cap: 'round' }).poly([8, -22, 34, 0, 8, 22]).fill(ink));
    onTap(this.confirm, () => void this.place());
    for (let i = 0; i < 7; i++) {
      const node = new Container();
      node.hitArea = new Rectangle(-54, -56, 108, 112);
      onTap(node, () => void this.replay(i));
      this.records.push(node);
    }
    for (const node of [this.garden, this.sky, this.heading, this.caption, this.note, this.glow]) node.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.garden, ...this.records, this.sky, this.heading, this.caption, this.note, this.confirm, this.glow);
    this.drawRecords();
    this.drawGarden();
    this.resize(ctx.view);
  }

  start() { void this.askDay(); }
  destroy() { this.finished = true; }

  resize(view: View) {
    this.view = view;
    this.backdrop.resize(view);
    const l = weekLayout(view.w, view.h);
    this.heading.position.set(view.w / 2, 120);
    this.caption.position.set(view.w / 2, 176);
    this.note.position.set(view.w / 2, 570);
    this.sky.position.set(view.w / 2, 378);
    this.garden.position.set(l.garden.x, l.garden.y);
    this.records.forEach((n, i) => n.position.set(l.records[i].x, l.records[i].y));
    this.choices.forEach((p, i) => p.node.position.set(l.choices[i].x, l.choices[i].y));
    this.confirm.position.set(l.confirm.x, l.confirm.y);
  }

  update(dt: number) {
    this.clock += dt;
    this.glow.clear();
    if (this.busy) return;
    const target = this.hinted ? this.choices.find(p => p.n === this.answer)?.node : null;
    if (target) this.glow.roundRect(target.x - 90, target.y - 60, 180, 120, 20).stroke({ width: 5 + Math.sin(this.clock * 5), color: swatch.yellow.fill });
    if (this.selected !== null) {
      const node = this.choices.find(p => p.n === this.selected)?.node;
      if (node) this.glow.roundRect(node.x - 88, node.y - 58, 176, 116, 20).stroke({ width: 4, color: swatch.teal.line });
    }
  }

  autotouch(): TouchIntent | null {
    if (this.busy || this.finished) return null;
    if (this.phase === 'day' || this.phase === 'relative') {
      if (this.selected === this.answer) return { tap: { on: this.confirm } };
    }
    if (this.phase === 'tally') {
      const day = this.week.findIndex((weather, i) => weather === 0 && !this.marks.includes(i));
      if (day >= 0) return { tap: { on: this.records[day] } };
    }
    const node = this.choices.find(p => p.n === this.answer)?.node;
    return node ? { tap: { on: node } } : null;
  }

  private drawRecords() {
    this.records.forEach((node, i) => {
      for (const child of node.removeChildren()) child.destroy({ children: true });
      const placed = i < this.recorded || (i === this.day && this.phase === 'weather');
      const active = i === this.day && this.recorded < 7;
      node.addChild(new Graphics().roundRect(-54, -56, 108, 112, 14)
        .fill(this.marks.includes(i) ? swatch.yellow.light : placed ? cream : swatch.green.light)
        .stroke({ width: active ? 4 : 2, color: active ? swatch.teal.line : wood.line }));
      const name = label(placed ? DAYS[i] : String(i + 1), placed ? 17 : 28);
      name.y = -30;
      node.addChild(name);
      if (i < this.recorded) {
        const art = weatherArt(this.week[i]); art.scale.set(0.55); art.y = 10; node.addChild(art);
      }
      if (this.marks.includes(i)) node.addChild(new Graphics().circle(39, 40, 7).fill(swatch.yellow.line));
      for (const child of node.children) child.eventMode = 'none';
    });
  }

  private drawGarden() {
    for (const child of this.garden.removeChildren()) child.destroy({ children: true });
    this.garden.addChild(new Graphics().roundRect(-320, 23, 640, 42, 16).fill(wood.fill).stroke({ width: 3, color: wood.line }));
    const colors = [swatch.pink.fill, swatch.purple.fill, swatch.orange.fill];
    for (let i = 0; i < 7; i++) {
      const art = flower(colors[i % colors.length], i < this.recorded);
      art.x = (i - 3) * 85; this.garden.addChild(art);
    }
  }

  private buildChoices(values: number[], kind: 'day' | 'weather' | 'number') {
    for (const p of this.choices.splice(0)) p.node.destroy({ children: true });
    this.selected = null;
    this.hinted = false;
    this.wrongs = 0;
    this.confirm.visible = kind === 'day';
    this.confirm.alpha = 0.45;
    for (const n of values) {
      const node = new Container();
      node.hitArea = new Rectangle(-85, -55, 170, 110);
      node.addChild(tile(170, 110, 'white'));
      if (kind === 'weather') node.addChild(weatherArt(n));
      else node.addChild(label(kind === 'day' ? DAYS[n] : String(n), kind === 'day' ? 24 : 42));
      onTap(node, () => void this.choose(n));
      this.choices.push({ n, node });
      this.ctx.stage.addChild(node);
    }
    // A decoration must never cover controls with an interactive hit region.
    this.ctx.stage.addChild(this.glow);
    this.resize(this.view);
  }

  private async askDay() {
    this.busy = true;
    this.phase = 'day';
    this.answer = this.day;
    this.caption.text = this.day === 0 || this.ctx.level === 1 ? `Place ${DAYS[this.day]}` : `What comes after ${DAYS[this.day - 1]}?`;
    this.note.text = 'Tap a card to hear it. Then tap the arrow to place it.';
    this.buildChoices(choicesFor(this.answer, this.ctx.rng, 'day'), 'day');
    this.drawRecords();
    await this.ctx.instruct(this.day === 0 || this.ctx.level === 1 ? 'week.place' : 'week.next', { day: DAYS[this.day === 0 || this.ctx.level === 1 ? this.day : this.day - 1] });
    this.busy = false;
  }

  private async choose(n: number) {
    if (this.busy || this.finished) return;
    this.busy = true;
    if (this.phase === 'day' || this.phase === 'relative') {
      this.selected = n;
      this.confirm.alpha = 1;
      sfx.pop(4 + n);
      await this.ctx.say('week.name', { day: DAYS[n] });
      this.busy = false;
      return;
    }
    if (n !== this.answer) { await this.miss(); return; }
    sfx.sparkle();
    if (this.phase === 'weather') {
      this.recorded++;
      this.drawRecords();
      this.drawGarden();
      await this.ctx.say('week.record', { day: DAYS[this.day], weather: WEATHER[n] });
      for (const child of this.sky.removeChildren()) child.destroy({ children: true });
      this.day++;
      if (this.day < 7) await this.askDay();
      else if (this.plan.relatives) await this.askRelative();
      else await this.done();
    } else {
      await this.ctx.say('week.total', { n: this.answer });
      await this.done();
    }
  }

  private async place() {
    if (this.busy || this.finished || this.selected === null || !['day', 'relative'].includes(this.phase)) return;
    this.busy = true;
    if (this.selected !== this.answer) { await this.miss(); return; }
    sfx.sparkle();
    if (this.phase === 'relative') {
      await this.ctx.say(this.question === 0 ? 'week.tomorrowyes' : 'week.yesterdayyes', { day: DAYS[this.answer] });
      this.question++;
      if (this.question < 2) await this.askRelative();
      else if (this.plan.tally) await this.askTally();
      else await this.done();
      return;
    }
    this.phase = 'weather';
    this.answer = this.week[this.day];
    this.caption.text = `${DAYS[this.day]}'s pretend weather`;
    this.note.text = 'Look at the sky picture and record its weather.';
    this.buildChoices([0, 1, 2], 'weather');
    this.sky.addChild(weatherArt(this.answer));
    this.drawRecords();
    await this.ctx.instruct('week.weather', { day: DAYS[this.day] });
    this.busy = false;
  }

  private async askRelative() {
    this.busy = true;
    this.phase = 'relative';
    const today = this.question === 0 ? 6 : 0;
    this.answer = neighbor(today, this.question === 0 ? 1 : -1);
    this.caption.text = `Today is ${DAYS[today]}. ${this.question === 0 ? 'Tomorrow' : 'Yesterday'}?`;
    this.note.text = 'The week repeats: Sunday → Monday. Tap records to listen.';
    this.buildChoices(choicesFor(this.answer, this.ctx.rng, 'day'), 'day');
    await this.ctx.instruct(this.question === 0 ? 'week.tomorrow' : 'week.yesterday', { day: DAYS[today] });
    this.busy = false;
  }

  private async askTally() {
    this.busy = true;
    this.phase = 'tally';
    this.answer = sunnyCount(this.week);
    this.caption.text = 'How many sunny days?';
    this.note.text = 'Tap records to mark or unmark them. Choose the total.';
    this.buildChoices(choicesFor(this.answer, this.ctx.rng, 'number'), 'number');
    await this.ctx.instruct('week.tally');
    this.busy = false;
  }

  private async replay(day: number) {
    if (this.busy || this.finished || day >= this.recorded) return;
    this.busy = true;
    if (this.phase === 'tally') {
      this.marks = toggleMark(this.marks, day, this.recorded);
      this.drawRecords();
    }
    sfx.pop(4 + day);
    await this.ctx.say('week.record', { day: DAYS[day], weather: WEATHER[this.week[day]] });
    this.busy = false;
  }

  private async miss() {
    this.misses++;
    this.wrongs++;
    sfx.boing();
    if (this.wrongs >= 2 && !this.hinted) { this.hinted = true; this.hints++; }
    if (this.phase === 'weather') await this.ctx.say('week.weatherhint', { weather: WEATHER[this.answer] });
    else if (this.phase === 'tally') await this.ctx.say('week.tallyhint', { n: this.answer });
    else await this.ctx.say('week.dayhint', { day: DAYS[this.answer] });
    this.busy = false;
  }

  private async done() {
    this.finished = true;
    this.confirm.visible = false;
    for (const p of this.choices) p.node.visible = false;
    this.caption.text = 'A whole pretend week!';
    this.note.text = '';
    await this.ctx.say('week.done');
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

function weekArt(seed: number): Container {
  const art = new Container();
  const rng = new Rng(seed);
  art.addChild(new Graphics().roundRect(-90, -105, 180, 165, 18).fill(cream).stroke({ width: 5, color: wood.line })
    .roundRect(-90, -105, 180, 35, 12).fill(swatch.teal.fill));
  const sky = weatherArt(rng.int(0, 2)); sky.y = -28; art.addChild(sky);
  const bloom = flower(rng.pick([swatch.pink.fill, swatch.purple.fill]), true); bloom.position.set(45, 48); bloom.scale.set(0.8); art.addChild(bloom);
  return art;
}

export const dayByDay: GameModule = {
  id: 'day-by-day', name: 'Day by Day', titleLine: 'game.day-by-day', region: 'cozy-village',
  skills: ['weekday order', 'yesterday and tomorrow', 'weather records', 'counting observations'], bands: ['prek', 'school'],
  levels: band => rangeFor(LEVELS, band), describeLevel: level => planFor(level).name,
  music: STYLES.hub, touchDemo: true,
  coplayHint: 'Take turns: one person names and places the day, the other records its pictured weather. Ask what comes before and after.',
  offScreen: 'Make seven day cards for a pretend week. Lay them out, turn Sunday back toward Monday, and talk about yesterday and tomorrow.',
  hubIcon: () => { const art = weekArt(1); art.y = -65; return new WigglyIcon(art); },
  sticker: weekArt, create: ctx => new DayByDay(ctx),
};
