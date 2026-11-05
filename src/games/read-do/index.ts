import { Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { cream, ink, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { sfx } from '../../audio/sfx';
import { STYLES } from '../../audio/music';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import type { LineId } from '../../content/voice-script';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { actionOf, answerIndex, makeSigns, makeTasks, matches, meaning, missing, planFor, printed, stepFor, type Choice, type Marks, type Sign, type Step, type Word } from './logic';

const LEVELS: BandLevels = { prek: { min: 1, max: 5, order: [1, 2, 4, 5] }, school: { min: 1, max: 6 } };
export const WORD_LINES: Record<Word, LineId> = {
  red: 'read.red', blue: 'read.blue', yellow: 'read.yellow', green: 'read.green', pink: 'read.pink', big: 'read.big', small: 'read.small',
  duck: 'read.duck', cat: 'read.cat', pig: 'read.pig', dog: 'read.dog', the: 'read.the', can: 'read.can', jump: 'read.jump', sleep: 'read.sleep', jumps: 'read.jumps', sleeps: 'read.sleeps',
};

/** Pictures are choices; the printed sign never gives away its answer with color or an animal picture. */
function picture(choice: Choice): Container {
  const node = new Container();
  if (choice.kind === 'hat') {
    const color = swatch[choice.color];
    node.addChild(new Graphics().roundRect(-43, -50, 86, 65, 17).fill(color.fill).stroke({ width: 5, color: color.line })
      .roundRect(-66, 6, 132, 22, 10).fill(color.fill).stroke({ width: 5, color: color.line })
      .rect(-42, -4, 84, 12).fill(cream));
  } else {
    const animal = new Critter(CRITTERS[choice.animal]);
    animal.alive = false;
    animal.scale.set(choice.kind === 'size' ? (choice.size === 'big' ? 0.42 : 0.23) : 0.32);
    animal.position.set(choice.kind === 'action' ? -20 : 0, 55);
    if (choice.kind === 'action' && choice.action === 'sleep') animal.setMood('sleepy');
    node.addChild(animal);
    if (choice.kind === 'action') {
      const mark = choice.action === 'sleep' ? label('Z', 34, swatch.blue.line) : new Graphics()
        .moveTo(50, 35).lineTo(50, -30).moveTo(32, -12).lineTo(50, -30).lineTo(68, -12)
        .stroke({ width: 8, color: swatch.green.line, cap: 'round', join: 'round' });
      if (choice.action === 'sleep') mark.position.set(50, -20);
      mark.eventMode = 'none';
      node.addChild(mark);
    }
  }
  node.eventMode = 'none';
  return node;
}
interface Tile { node: Container; bg: Graphics; choice: Choice }

/** The animal performs a choice: a jump is the arc, anything else a small rock. */
async function actOut(ctx: GameContext, actor: Container, choice: Choice) {
  actor.removeChildren().forEach(c => c.destroy({ children: true }));
  const art = picture(choice);
  art.scale.set(1.3);
  actor.addChild(art);
  if (choice.kind === 'action' && choice.action === 'jump') {
    await ctx.tw.to(art, { y: -55 }, { duration: 0.25 });
    await ctx.tw.to(art, { y: 0 }, { duration: 0.3 });
  } else {
    await ctx.tw.to(art, { rotation: 0.08 }, { duration: 0.18 });
    await ctx.tw.to(art, { rotation: 0 }, { duration: 0.18 });
  }
}
function speaker() {
  const node = new Container();
  node.addChild(new Graphics().roundRect(-55, -50, 110, 100, 24).fill(cream).stroke({ width: 4, color: wood.line })
    .poly([-32, -12, -18, -12, 0, -28, 0, 28, -18, 12, -32, 12]).fill(ink)
    .moveTo(12, -24).quadraticCurveTo(40, 0, 12, 24).stroke({ width: 5, color: ink, cap: 'round' }));
  node.hitArea = new Rectangle(-55, -50, 110, 100);
  return node;
}

class ReadDo implements Game {
  readonly tasks;
  readonly choices: Tile[] = [];
  readonly words: Container[] = [];
  readonly replay = new Container();
  readonly actor = new Container();
  index = -1;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  private alive = true;
  private wrongs = 0;
  private hinted = false;
  private clock = 0;
  private readonly glow = new Graphics();
  private readonly backdrop: Backdrop;
  private view: View;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.tasks = makeTasks(ctx.level, ctx.rng);
    this.backdrop = new Backdrop({ sky: [swatch.green.light, cream], hills: [swatch.green.fill, swatch.teal.light], horizon: 0.72, clouds: 2, sun: false, seed: 47 }, ctx.view);
    this.actor.eventMode = this.glow.eventMode = 'none';
    this.replay.addChild(speaker());
    this.replay.hitArea = new Rectangle(-55, -50, 110, 100);
    onTap(this.replay, () => void this.readSign());
    ctx.stage.addChild(this.backdrop, this.actor, this.replay, this.glow);
  }
  get task() { return this.tasks[this.index]; }
  start() { void this.next(); }
  destroy() { this.alive = false; }
  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    // Five separate, unscaled 108-unit word targets fit even in the 1024-unit design width.
    this.words.forEach((word, i) => word.position.set(v.w / 2 + (i - (this.words.length - 1) / 2) * 116, 185));
    this.replay.position.set(v.w / 2 + 365, 185);
    this.actor.position.set(v.w / 2, v.h * 0.43);
    this.choices.forEach((c, i) => c.node.position.set(
      this.choices.length === 4 ? v.w / 2 + (i % 2 ? 170 : -170) : v.w / 2 + (i - (this.choices.length - 1) / 2) * 220,
      this.choices.length === 4 ? v.h * (i < 2 ? 0.62 : 0.85) : v.h * 0.7,
    ));
  }
  update(dt: number) {
    this.clock += dt;
    this.glow.clear();
    if (!this.hinted || this.busy || this.finished) return;
    const c = this.choices[answerIndex(this.task)].node;
    this.glow.roundRect(c.x - 90, c.y - 85, 180, 170, 26).stroke({ width: 6 + Math.sin(this.clock * 5), color: swatch.yellow.fill });
  }
  autotouch(): TouchIntent | null {
    return this.busy || this.finished || !this.task ? null : { tap: { on: this.choices[answerIndex(this.task)].node } };
  }
  private async next() {
    if (!this.alive) return;
    this.busy = true;
    this.index++;
    this.wrongs = 0;
    this.hinted = false;
    this.glow.clear();
    if (this.index === this.tasks.length) {
      this.finished = true;
      sfx.tada();
      await this.ctx.say('read.done');
      if (this.alive) this.ctx.finish({ misses: this.misses, hints: this.hints });
      return;
    }
    for (const c of this.choices.splice(0)) c.node.destroy({ children: true });
    for (const w of this.words.splice(0)) w.destroy({ children: true });
    this.actor.removeChildren().forEach(c => c.destroy({ children: true }));
    this.actor.addChild(label('?', 72, wood.line));
    for (const word of this.task.words) {
      const node = new Container();
      node.addChild(new Graphics().roundRect(-54, -50, 108, 100, 16).fill(cream).stroke({ width: 3, color: wood.line }), label(word, 30));
      node.hitArea = new Rectangle(-54, -50, 108, 100);
      onTap(node, () => {
        if (this.busy || this.finished) return;
        sfx.pop(2);
        void this.ctx.say(WORD_LINES[word]);
        void this.ctx.tw.to(node, { alpha: 0.65 }, { duration: 0.08 }).then(() => { if (this.alive && !node.destroyed) return this.ctx.tw.to(node, { alpha: 1 }, { duration: 0.15 }); });
      });
      this.words.push(node);
      this.ctx.stage.addChild(node);
    }
    for (const choice of this.task.choices) {
      const node = new Container();
      const bg = new Graphics().roundRect(-85, -80, 170, 160, 24).fill(swatch.white.fill).stroke({ width: 5, color: wood.line });
      node.addChild(bg, picture(choice));
      node.hitArea = new Rectangle(-85, -80, 170, 160);
      const tile = { node, bg, choice };
      this.choices.push(tile);
      onTap(node, () => void this.choose(tile));
      this.ctx.stage.addChild(node);
    }
    this.resize(this.view);
    await this.ctx.instruct('read.instruction');
    if (this.alive) this.busy = false;
  }
  private async speakWords(words: readonly Word[], highlight = false) {
    for (let i = 0; i < words.length; i++) {
      if (!this.alive) return;
      if (highlight) this.words[i].alpha = 0.6;
      await this.ctx.say(WORD_LINES[words[i]]);
      if (!this.alive) return;
      if (highlight) this.words[i].alpha = 1;
    }
  }
  private async readSign() {
    if (this.busy || this.finished) return;
    this.busy = true;
    sfx.pop(2);
    await this.speakWords(this.task.words, true);
    if (this.alive) this.busy = false;
  }
  private act(choice: Choice) { return actOut(this.ctx, this.actor, choice); }
  private async choose(tile: Tile) {
    if (this.busy || this.finished) return;
    this.busy = true;
    tile.bg.tint = swatch.yellow.light;
    const right = matches(this.task, tile.choice);
    if (right) sfx.sparkle(); else { sfx.boing(); this.misses++; this.wrongs++; }
    await this.act(tile.choice);
    if (!this.alive) return;
    tile.bg.tint = swatch.white.fill;
    if (right) {
      this.ctx.pet.cheer();
      await this.ctx.say('read.meaning', { words: this.task.words.join(' ') });
      await this.ctx.tw.wait(0.4);
      await this.next();
    } else {
      await this.ctx.say('read.compare', { words: meaning(tile.choice).join(' ') });
      await this.speakWords(this.task.words, true);
      if (!this.alive) return;
      if (this.wrongs >= 2 && !this.hinted) { this.hinted = true; this.hints++; }
      this.busy = false;
    }
  }
}
const STEP_LINES: Record<Step, LineId> = { cap: 'read.cap.instruction', stop: 'read.stop.instruction', both: 'read.both.instruction' };
function button(text: string, fill: number, line: number, icon: Graphics) {
  const node = new Container();
  icon.position.set(-68, 0);
  const words = label(text, 30);
  words.x = 26;
  node.addChild(new Graphics().roundRect(-100, -50, 200, 100, 26).fill(fill).stroke({ width: 5, color: line }), icon, words);
  node.hitArea = new Rectangle(-100, -50, 200, 100);
  return node;
}
/** A plain dotted square: where a full stop can go, never highlighted until help. */
function socketArt() {
  const g = new Graphics();
  for (let i = -46; i < 46; i += 16) {
    const a = i, b = Math.min(46, i + 8);
    g.moveTo(a, -46).lineTo(b, -46).moveTo(a, 46).lineTo(b, 46).moveTo(-46, a).lineTo(-46, b).moveTo(46, a).lineTo(46, b);
  }
  return g.stroke({ width: 4, color: wood.line, cap: 'round' });
}

/**
 * Levels 4–6 (SS1 A–C): the words are already right; she gives the first word its capital (a toggle tile) and/or
 * stamps the full stop on the end socket, then Send checks only what the level asks. Show it, the speaker and every edit are free.
 */
class SignDo implements Game {
  readonly signs: Sign[];
  readonly step: Step;
  readonly words: Container[] = [];
  readonly replay = speaker();
  readonly actor = new Container();
  readonly socket = new Container();
  readonly stop = new Container();
  readonly send = button('Send', swatch.green.light, swatch.green.line, new Graphics()
    .poly([-22, -22, 24, 0, -22, 22, -12, 0]).fill(swatch.green.line));
  readonly show = button('Show it', cream, wood.line, new Graphics()
    .ellipse(0, 0, 26, 16).fill(swatch.white.fill).stroke({ width: 4, color: ink }).circle(0, 0, 8).fill(ink));
  readonly hintLabel = 'Show a hint';
  marks: Marks = { capital: false, stop: false };
  index = -1;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  hinted = false;
  /** The stop was tapped and waits for a tap on the socket. */
  selected = false;
  private alive = true;
  private wrongs = 0;
  private clock = 0;
  private picked = { x: 0, y: 0, placed: false };
  private readonly drag: DragHandle;
  private readonly glow = new Graphics();
  private readonly backdrop: Backdrop;
  private view: View;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.step = stepFor(ctx.level) ?? 'both';
    this.signs = makeSigns(ctx.level, ctx.rng);
    this.backdrop = new Backdrop({ sky: [swatch.green.light, cream], hills: [swatch.green.fill, swatch.teal.light], horizon: 0.72, clouds: 2, sun: false, seed: 47 }, ctx.view);
    this.actor.eventMode = this.glow.eventMode = 'none';
    onTap(this.replay, () => void this.free(() => this.speakSign()));
    onTap(this.show, () => void this.free(async () => { await this.speakSign(); if (this.alive) await this.perform(); }));
    onTap(this.send, () => void this.sendSign());
    this.socket.addChild(socketArt());
    this.socket.hitArea = new Rectangle(-50, -50, 100, 100);
    onTap(this.socket, () => { if (!this.busy && this.selected) this.place(); });
    this.stop.addChild(new Graphics().roundRect(-50, -50, 100, 100, 22).fill(swatch.yellow.light).stroke({ width: 4, color: wood.line })
      .circle(0, 18, 12).fill(ink));
    this.stop.hitArea = new Rectangle(-50, -50, 100, 100);
    this.drag = draggable(this.stop, ctx.tw, {
      onPick: () => {
        this.picked = { x: this.stop.x, y: this.stop.y, placed: this.marks.stop };
        sfx.pop(4);
        if (!this.marks.stop) void ctx.say('read.stamp');
      },
      onDrop: (x, y) => this.dropStop(x, y),
    });
    ctx.stage.addChild(this.backdrop, this.actor, this.replay, this.socket, this.show, this.send, this.stop, this.glow);
  }
  get sign() { return this.signs[this.index]; }
  /** Where the stamp rests while it is not on the sign. */
  get rest() { return { x: this.view.w / 2 - 270, y: 300 }; }
  start() { void this.next(); }
  destroy() { this.alive = false; this.drag.destroy(); }
  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    // Three unscaled 108-unit word tiles and the 100-unit socket, 116 apart, fit in the 1024-unit design width.
    this.words.forEach((word, i) => word.position.set(v.w / 2 + (i - 1.5) * 116, 185));
    this.socket.position.set(v.w / 2 + 1.5 * 116, 185);
    this.replay.position.set(v.w / 2 + 365, 185);
    this.actor.position.set(v.w / 2, v.h * 0.43);
    this.show.position.set(v.w / 2 - 150, v.h * 0.88);
    this.send.position.set(v.w / 2 + 150, v.h * 0.88);
    this.drag.home = this.rest;
    if (!this.drag.dragging) this.stop.position.copyFrom(this.marks.stop ? this.socket.position : this.rest);
  }
  /** The control she still needs: the first word, the stamp, or Send once the sign is ready. */
  get needed(): Container {
    const gap = missing(this.step, this.marks);
    return gap === 'cap' ? this.words[0] : gap === 'stop' ? this.stop : this.send;
  }
  update(dt: number) {
    this.clock += dt;
    this.glow.clear();
    if (this.finished || !this.sign) return;
    if (this.selected) this.glow.roundRect(this.stop.x - 60, this.stop.y - 60, 120, 120, 26).stroke({ width: 5, color: swatch.blue.fill });
    if (!this.hinted) return;
    const c = this.needed, wide = c === this.send ? 220 : 128;
    this.glow.roundRect(c.x - wide / 2, c.y - 62, wide, 124, 26).stroke({ width: 6 + Math.sin(this.clock * 5), color: swatch.yellow.fill });
  }
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || !this.sign) return null;
    const gap = missing(this.step, this.marks);
    if (gap === 'cap') return { tap: { on: this.words[0] } };
    if (gap === 'stop') return { drag: { on: this.stop }, to: { on: this.socket } };
    return { tap: { on: this.send } };
  }
  askForHint() {
    if (this.finished || !this.sign || this.hinted) return;
    this.hinted = true;
    this.hints++;
  }
  private lock(on: boolean) {
    this.busy = on;
    this.drag.enabled = !on && this.step !== 'cap';
  }
  private async free(run: () => Promise<void>) {
    if (this.busy || this.finished) return;
    this.lock(true);
    sfx.pop(2);
    await run();
    if (this.alive) this.lock(false);
  }
  private async next() {
    if (!this.alive) return;
    this.lock(true);
    this.index++;
    this.wrongs = 0;
    this.hinted = this.selected = false;
    if (this.index === this.signs.length) {
      this.finished = true;
      sfx.tada();
      await this.ctx.say('read.done');
      if (this.alive) this.ctx.finish({ misses: this.misses, hints: this.hints });
      return;
    }
    this.marks = { ...this.sign.start };
    for (const w of this.words.splice(0)) w.destroy({ children: true });
    this.sign.words.forEach((word, i) => {
      const node = new Container();
      node.addChild(new Graphics().roundRect(-54, -50, 108, 100, 16).fill(cream).stroke({ width: 3, color: wood.line }), label(word, 30));
      node.hitArea = new Rectangle(-54, -50, 108, 100);
      onTap(node, () => {
        if (this.busy || this.finished) return;
        sfx.pop(2);
        if (i === 0 && this.step !== 'stop') {
          this.marks.capital = !this.marks.capital;
          this.drawFirst();
        }
        void this.ctx.say(WORD_LINES[word]);
        void this.ctx.tw.to(node, { alpha: 0.65 }, { duration: 0.08 }).then(() => { if (this.alive && !node.destroyed) return this.ctx.tw.to(node, { alpha: 1 }, { duration: 0.15 }); });
      });
      this.words.push(node);
      this.ctx.stage.addChildAt(node, this.ctx.stage.getChildIndex(this.stop));
    });
    this.drawFirst();
    this.actor.removeChildren().forEach(c => c.destroy({ children: true }));
    const art = picture(actionOf(this.sign));
    art.scale.set(1.3);
    this.actor.addChild(art);
    // Level 4 prints the stop already; only level 5 and 6 hand her the stamp.
    this.stop.eventMode = this.step === 'cap' ? 'none' : 'static';
    this.resize(this.view);
    await this.ctx.instruct(STEP_LINES[this.step]);
    if (this.alive) this.lock(false);
  }
  /** The first word changes case and size, never its hit area. */
  private drawFirst() {
    const tile = this.words[0];
    tile.removeChildAt(1).destroy();
    tile.addChild(label(this.marks.capital ? 'The' : 'the', this.marks.capital ? 38 : 30));
  }
  private dropStop(x: number, y: number) {
    const was = this.picked;
    const tapped = Math.hypot(x - was.x, y - was.y) < 50;
    if (this.busy) {
      // Never changes a sign mid-read: it goes back where it was.
      if (was.placed) this.place();
      return was.placed;
    }
    if (tapped) {
      // A tap on a placed stop returns it to the stamp; a tap on the stamp holds it for a tap on the socket.
      this.marks.stop = false;
      this.selected = !was.placed;
      return false;
    }
    this.selected = false;
    if (Math.hypot(x - this.socket.x, y - this.socket.y) < 90) { this.place(); return true; }
    this.marks.stop = false;
    return false;
  }
  private place() {
    this.marks.stop = true;
    this.selected = false;
    sfx.marimba(5, 0.3);
    void this.ctx.tw.to(this.stop, { x: this.socket.x, y: this.socket.y }, { duration: 0.15 });
  }
  private async speakSign() {
    for (let i = 0; i < this.sign.words.length; i++) {
      if (!this.alive) return;
      this.words[i].alpha = 0.6;
      await this.ctx.say(WORD_LINES[this.sign.words[i]]);
      if (!this.alive) return;
      this.words[i].alpha = 1;
    }
    // The stop is named, never read as silence.
    if (this.marks.stop) await this.ctx.say('read.stamp');
  }
  private perform() { return actOut(this.ctx, this.actor, actionOf(this.sign)); }
  private async sendSign() {
    if (this.busy || this.finished) return;
    this.lock(true);
    this.selected = false;
    const gap = missing(this.step, this.marks);
    if (!gap) {
      sfx.sparkle();
      await this.speakSign();
      if (!this.alive) return;
      await this.perform();
      if (!this.alive) return;
      this.ctx.pet.cheer();
      await this.ctx.say('read.ready', { words: printed(this.sign, { ...this.marks, stop: false }) });
      await this.ctx.tw.wait(0.4);
      await this.next();
      return;
    }
    sfx.boing();
    this.misses++;
    this.wrongs++;
    if (this.wrongs >= 2 && !this.hinted) { this.hinted = true; this.hints++; }
    await this.ctx.say(gap === 'cap' ? 'read.cap.missing' : 'read.stop.missing');
    if (this.alive) this.lock(false);
  }
}
function sticker(seed: number) {
  const c = new Container();
  c.addChild(new Graphics().roundRect(-95, -70, 190, 140, 20).fill(cream).stroke({ width: 6, color: wood.line }), picture(new Rng(seed).pick([
    { kind: 'action', animal: 'duck', action: 'jump' }, { kind: 'action', animal: 'cat', action: 'sleep' },
  ] as const)));
  return c;
}
export const readDo: GameModule = {
  id: 'read-do', name: 'Read & Do', titleLine: 'game.read-do', region: 'story-grove', challenge: 'words',
  skills: ['reading', 'word meaning', 'sentences'], bands: ['prek', 'school'],
  levels: band => rangeFor(LEVELS, band), describeLevel: level => planFor(level).name,
  music: STYLES.quiet, touchDemo: true,
  coplayHint: 'Read the sign together, then let your child choose. Hearing a word is free support.',
  offScreen: 'Write big pig or green hat on a card and find a matching toy or drawing together.',
  hubIcon: () => { const art = sticker(1); art.y = -80; return new WigglyIcon(art); },
  sticker, create: ctx => (stepFor(ctx.level) ? new SignDo(ctx) : new ReadDo(ctx)),
};
