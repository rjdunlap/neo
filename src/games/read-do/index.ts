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
import { rangeFor } from '../../progress/difficulty';
import type { LineId } from '../../content/voice-script';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  LEVELS,
  act,
  actionOf,
  answerIndex,
  hintFor,
  makeMendSigns,
  makeSigns,
  makeTasks,
  makeWishes,
  matches,
  MAX_SLOTS,
  meaning,
  missing,
  planFor,
  printed,
  resolveDrop,
  sameAct,
  signLayout,
  stepFor,
  type Box,
  type Choice,
  type Drop,
  type Hint,
  type Marks,
  type Outcome,
  type Sign,
  type SignLayout,
  type SlotWord,
  type Step,
  type Wish,
  type WishSign,
  type Word,
} from './logic';

export const WORD_LINES: Record<Word, LineId> = {
  red: 'read.red',
  blue: 'read.blue',
  yellow: 'read.yellow',
  green: 'read.green',
  pink: 'read.pink',
  big: 'read.big',
  small: 'read.small',
  duck: 'read.duck',
  cat: 'read.cat',
  pig: 'read.pig',
  dog: 'read.dog',
  the: 'read.the',
  can: 'read.can',
  jump: 'read.jump',
  sleep: 'read.sleep',
  jumps: 'read.jumps',
  sleeps: 'read.sleeps',
};

/** Pictures are choices; the printed sign never gives away its answer with color or an animal picture. */
function picture(choice: Choice): Container {
  const node = new Container();
  if (choice.kind === 'hat') {
    const color = swatch[choice.color];
    node.addChild(
      new Graphics()
        .roundRect(-43, -50, 86, 65, 17)
        .fill(color.fill)
        .stroke({ width: 5, color: color.line })
        .roundRect(-66, 6, 132, 22, 10)
        .fill(color.fill)
        .stroke({ width: 5, color: color.line })
        .rect(-42, -4, 84, 12)
        .fill(cream),
    );
  } else {
    const animal = new Critter(CRITTERS[choice.animal]);
    animal.alive = false;
    animal.scale.set(choice.kind === 'size' ? (choice.size === 'big' ? 0.42 : 0.23) : 0.32);
    animal.position.set(choice.kind === 'action' ? -20 : 0, 55);
    if (choice.kind === 'action' && choice.action === 'sleep') animal.setMood('sleepy');
    node.addChild(animal);
    if (choice.kind === 'action') {
      const mark =
        choice.action === 'sleep'
          ? label('Z', 34, swatch.blue.line)
          : new Graphics()
              .moveTo(50, 35)
              .lineTo(50, -30)
              .moveTo(32, -12)
              .lineTo(50, -30)
              .lineTo(68, -12)
              .stroke({ width: 8, color: swatch.green.line, cap: 'round', join: 'round' });
      if (choice.action === 'sleep') mark.position.set(50, -20);
      mark.eventMode = 'none';
      node.addChild(mark);
    }
  }
  node.eventMode = 'none';
  return node;
}
interface Tile {
  node: Container;
  bg: Graphics;
  choice: Choice;
}

/** The animal performs a choice: a jump is the arc, anything else a small rock. */
async function actOut(ctx: GameContext, actor: Container, choice: Choice) {
  actor.removeChildren().forEach((c) => c.destroy({ children: true }));
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
  node.addChild(
    new Graphics()
      .roundRect(-55, -50, 110, 100, 24)
      .fill(cream)
      .stroke({ width: 4, color: wood.line })
      .poly([-32, -12, -18, -12, 0, -28, 0, 28, -18, 12, -32, 12])
      .fill(ink)
      .moveTo(12, -24)
      .quadraticCurveTo(40, 0, 12, 24)
      .stroke({ width: 5, color: ink, cap: 'round' }),
  );
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
  /** The next sign's instruction, waiting behind the last right picture's line (U7 R4); `askGen` drops a stale wait. */
  unasked = false;
  private askGen = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.tasks = makeTasks(ctx.level, ctx.rng);
    this.backdrop = new Backdrop(
      {
        sky: [swatch.green.light, cream],
        hills: [swatch.green.fill, swatch.teal.light],
        horizon: 0.72,
        clouds: 2,
        sun: false,
        seed: 47,
      },
      ctx.view,
    );
    this.actor.eventMode = this.glow.eventMode = 'none';
    this.replay.addChild(speaker());
    this.replay.hitArea = new Rectangle(-55, -50, 110, 100);
    onTap(this.replay, () => void this.readSign());
    ctx.stage.addChild(this.backdrop, this.actor, this.replay, this.glow);
  }
  get task() {
    return this.tasks[this.index];
  }
  start() {
    void this.next();
  }
  destroy() {
    this.alive = false;
  }
  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    // Five separate, unscaled 108-unit word targets fit even in the 1024-unit design width.
    this.words.forEach((word, i) =>
      word.position.set(v.w / 2 + (i - (this.words.length - 1) / 2) * 116, 185),
    );
    this.replay.position.set(v.w / 2 + 365, 185);
    this.actor.position.set(v.w / 2, v.h * 0.43);
    this.choices.forEach((c, i) =>
      c.node.position.set(
        this.choices.length === 4
          ? v.w / 2 + (i % 2 ? 170 : -170)
          : v.w / 2 + (i - (this.choices.length - 1) / 2) * 220,
        this.choices.length === 4 ? v.h * (i < 2 ? 0.62 : 0.85) : v.h * 0.7,
      ),
    );
  }
  update(dt: number) {
    this.clock += dt;
    this.glow.clear();
    if (!this.hinted || this.busy || this.finished) return;
    const c = this.choices[answerIndex(this.task)].node;
    this.glow
      .roundRect(c.x - 90, c.y - 85, 180, 170, 26)
      .stroke({ width: 6 + Math.sin(this.clock * 5), color: swatch.yellow.fill });
  }
  autotouch(): TouchIntent | null {
    return this.busy || this.finished || this.unasked || !this.task
      ? null
      : { tap: { on: this.choices[answerIndex(this.task)].node } };
  }
  /** Says the waiting instruction, if there is one. */
  private askNow() {
    if (!this.unasked || this.finished) return false;
    this.dropAsk();
    void this.ctx.instruct('read.instruction');
    return true;
  }
  private dropAsk() {
    this.unasked = false;
    this.askGen++;
  }
  /** The guide was tapped while the next sign's instruction waits: say it, not the one before it. */
  sayWaitingAsk() {
    return this.askNow();
  }
  /**
   * The next sign. With `said` (the last right picture's line, still playing), it opens with input open and its
   * instruction waits for the line, her first tap or the guide (U7 R4).
   */
  private async next(said?: Promise<unknown>) {
    if (!this.alive) return;
    this.dropAsk();
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
    this.actor.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.actor.addChild(label('?', 72, wood.line));
    for (const word of this.task.words) {
      const node = new Container();
      node.addChild(
        new Graphics().roundRect(-54, -50, 108, 100, 16).fill(cream).stroke({ width: 3, color: wood.line }),
        label(word, 30),
      );
      node.hitArea = new Rectangle(-54, -50, 108, 100);
      onTap(node, () => {
        if (this.busy || this.finished) return;
        // Reading the sign herself: the waiting instruction is not needed.
        this.dropAsk();
        sfx.pop(2);
        void this.ctx.say(WORD_LINES[word]);
        void this.ctx.tw.to(node, { alpha: 0.65 }, { duration: 0.08 }).then(() => {
          if (this.alive && !node.destroyed) return this.ctx.tw.to(node, { alpha: 1 }, { duration: 0.15 });
        });
      });
      this.words.push(node);
      this.ctx.stage.addChild(node);
    }
    for (const choice of this.task.choices) {
      const node = new Container();
      const bg = new Graphics()
        .roundRect(-85, -80, 170, 160, 24)
        .fill(swatch.white.fill)
        .stroke({ width: 5, color: wood.line });
      node.addChild(bg, picture(choice));
      node.hitArea = new Rectangle(-85, -80, 170, 160);
      const tile = { node, bg, choice };
      this.choices.push(tile);
      onTap(node, () => void this.choose(tile));
      this.ctx.stage.addChild(node);
    }
    this.resize(this.view);
    if (said) {
      this.unasked = true;
      this.busy = false;
      const gen = this.askGen;
      void said.then(() => {
        if (gen === this.askGen) this.askNow();
      });
      return;
    }
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
    this.dropAsk();
    this.busy = true;
    sfx.pop(2);
    await this.speakWords(this.task.words, true);
    if (this.alive) this.busy = false;
  }
  private act(choice: Choice) {
    return actOut(this.ctx, this.actor, choice);
  }
  private async choose(tile: Tile) {
    if (this.busy || this.finished) return;
    const right = matches(this.task, tile.choice);
    if (this.unasked) {
      // A tap before she has heard the instruction: a right picture goes ahead; another says the instruction, not a miss.
      if (!right) return void this.askNow();
      this.dropAsk();
    }
    this.busy = true;
    tile.bg.tint = swatch.yellow.light;
    if (right) sfx.sparkle();
    else {
      sfx.boing();
      this.misses++;
      this.wrongs++;
    }
    await this.act(tile.choice);
    if (!this.alive) return;
    tile.bg.tint = swatch.white.fill;
    if (right) {
      this.ctx.pet.cheer();
      const said = this.ctx.say('read.meaning', { words: this.task.words.join(' ') });
      // The line starts and the next sign follows the beat with input open (U7 R4); the last sign's line is heard out.
      if (this.index + 1 < this.tasks.length) {
        await this.ctx.tw.wait(0.4);
        return void this.next(said);
      }
      await said;
      await this.ctx.tw.wait(0.4);
      await this.next();
    } else {
      await this.ctx.say('read.compare', { words: meaning(tile.choice).join(' ') });
      await this.speakWords(this.task.words, true);
      if (!this.alive) return;
      if (this.wrongs >= 2 && !this.hinted) {
        this.hinted = true;
        this.hints++;
      }
      this.busy = false;
    }
  }
}
const STEP_LINES: Record<Step, LineId> = {
  cap: 'read.cap.instruction',
  stop: 'read.stop.instruction',
  both: 'read.both.instruction',
};
function button(text: string, fill: number, line: number, icon: Graphics, width = 200) {
  const node = new Container();
  const narrow = width < 200;
  icon.position.set(-width / 2 + (narrow ? 26 : 32), 0);
  if (narrow) icon.scale.set(0.6);
  const words = label(text, narrow ? 26 : 30);
  words.x = narrow ? 18 : 26;
  node.addChild(
    new Graphics()
      .roundRect(-width / 2, -50, width, 100, 26)
      .fill(fill)
      .stroke({ width: 5, color: line }),
    icon,
    words,
  );
  node.hitArea = new Rectangle(-width / 2, -50, width, 100);
  return node;
}
const sendIcon = () => new Graphics().poly([-22, -22, 24, 0, -22, 22, -12, 0]).fill(swatch.green.line);
const eyeIcon = () =>
  new Graphics()
    .ellipse(0, 0, 26, 16)
    .fill(swatch.white.fill)
    .stroke({ width: 4, color: ink })
    .circle(0, 0, 8)
    .fill(ink);
/** A plain dotted rectangle (a square by default): where a full stop or a word can go, never highlighted until help. */
function socketArt(hw = 46, hh = 46, color: number = wood.line) {
  const g = new Graphics();
  for (let i = -hw; i < hw; i += 16)
    g.moveTo(i, -hh)
      .lineTo(Math.min(hw, i + 8), -hh)
      .moveTo(i, hh)
      .lineTo(Math.min(hw, i + 8), hh);
  for (let i = -hh; i < hh; i += 16)
    g.moveTo(-hw, i)
      .lineTo(-hw, Math.min(hh, i + 8))
      .moveTo(hw, i)
      .lineTo(hw, Math.min(hh, i + 8));
  return g.stroke({ width: 4, color, cap: 'round' });
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
  readonly send = button('Send', swatch.green.light, swatch.green.line, sendIcon());
  readonly show = button('Show it', cream, wood.line, eyeIcon());
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
  /** The next sign's instruction, waiting behind the last sign's `read.ready` (U7 R4); `askGen` drops a stale wait. */
  unasked = false;
  private askGen = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.step = stepFor(ctx.level) ?? 'both';
    this.signs = makeSigns(ctx.level, ctx.rng);
    this.backdrop = new Backdrop(
      {
        sky: [swatch.green.light, cream],
        hills: [swatch.green.fill, swatch.teal.light],
        horizon: 0.72,
        clouds: 2,
        sun: false,
        seed: 47,
      },
      ctx.view,
    );
    this.actor.eventMode = this.glow.eventMode = 'none';
    onTap(this.replay, () => void this.free(() => this.speakSign()));
    onTap(
      this.show,
      () =>
        void this.free(async () => {
          await this.speakSign();
          if (this.alive) await this.perform();
        }),
    );
    onTap(this.send, () => void this.sendSign());
    this.socket.addChild(socketArt());
    this.socket.hitArea = new Rectangle(-50, -50, 100, 100);
    onTap(this.socket, () => {
      if (!this.busy && this.selected) this.place();
    });
    this.stop.addChild(
      new Graphics()
        .roundRect(-50, -50, 100, 100, 22)
        .fill(swatch.yellow.light)
        .stroke({ width: 4, color: wood.line })
        .circle(0, 18, 12)
        .fill(ink),
    );
    this.stop.hitArea = new Rectangle(-50, -50, 100, 100);
    this.drag = draggable(this.stop, ctx.tw, {
      onPick: () => {
        this.dropAsk();
        this.picked = { x: this.stop.x, y: this.stop.y, placed: this.marks.stop };
        sfx.pop(4);
        if (!this.marks.stop) void ctx.say('read.stamp');
      },
      onDrop: (x, y) => this.dropStop(x, y),
    });
    ctx.stage.addChild(
      this.backdrop,
      this.actor,
      this.replay,
      this.socket,
      this.show,
      this.send,
      this.stop,
      this.glow,
    );
  }
  get sign() {
    return this.signs[this.index];
  }
  /** Where the stamp rests while it is not on the sign. */
  get rest() {
    return { x: this.view.w / 2 - 270, y: 300 };
  }
  start() {
    void this.next();
  }
  destroy() {
    this.alive = false;
    this.drag.destroy();
  }
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
    if (this.selected)
      this.glow
        .roundRect(this.stop.x - 60, this.stop.y - 60, 120, 120, 26)
        .stroke({ width: 5, color: swatch.blue.fill });
    if (!this.hinted) return;
    const c = this.needed,
      wide = c === this.send ? 220 : 128;
    this.glow
      .roundRect(c.x - wide / 2, c.y - 62, wide, 124, 26)
      .stroke({ width: 6 + Math.sin(this.clock * 5), color: swatch.yellow.fill });
  }
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.unasked || !this.sign) return null;
    const gap = missing(this.step, this.marks);
    if (gap === 'cap') return { tap: { on: this.words[0] } };
    if (gap === 'stop') return { drag: { on: this.stop }, to: { on: this.socket } };
    return { tap: { on: this.send } };
  }
  /** Says the waiting instruction, if there is one. */
  private askNow() {
    if (!this.unasked || this.finished) return false;
    this.dropAsk();
    void this.ctx.instruct(STEP_LINES[this.step]);
    return true;
  }
  private dropAsk() {
    this.unasked = false;
    this.askGen++;
  }
  /** The guide was tapped while the next sign's instruction waits: say it, not the one before it. */
  sayWaitingAsk() {
    return this.askNow();
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
    this.dropAsk();
    this.lock(true);
    sfx.pop(2);
    await run();
    if (this.alive) this.lock(false);
  }
  /**
   * The next sign. With `said` (the last sign's `read.ready`, still playing), it opens with input open and its instruction
   * waits for the line, her first tap or the guide (U7 R4).
   */
  private async next(said?: Promise<unknown>) {
    if (!this.alive) return;
    this.dropAsk();
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
      node.addChild(
        new Graphics().roundRect(-54, -50, 108, 100, 16).fill(cream).stroke({ width: 3, color: wood.line }),
        label(word, 30),
      );
      node.hitArea = new Rectangle(-54, -50, 108, 100);
      onTap(node, () => {
        if (this.busy || this.finished) return;
        // Working on the sign herself: the waiting instruction is not needed.
        this.dropAsk();
        sfx.pop(2);
        if (i === 0 && this.step !== 'stop') {
          this.marks.capital = !this.marks.capital;
          this.drawFirst();
        }
        void this.ctx.say(WORD_LINES[word]);
        void this.ctx.tw.to(node, { alpha: 0.65 }, { duration: 0.08 }).then(() => {
          if (this.alive && !node.destroyed) return this.ctx.tw.to(node, { alpha: 1 }, { duration: 0.15 });
        });
      });
      this.words.push(node);
      this.ctx.stage.addChildAt(node, this.ctx.stage.getChildIndex(this.stop));
    });
    this.drawFirst();
    this.actor.removeChildren().forEach((c) => c.destroy({ children: true }));
    const art = picture(actionOf(this.sign));
    art.scale.set(1.3);
    this.actor.addChild(art);
    // Level 4 prints the stop already; only level 5 and 6 hand her the stamp.
    this.stop.eventMode = this.step === 'cap' ? 'none' : 'static';
    this.resize(this.view);
    if (said) {
      this.unasked = true;
      this.lock(false);
      const gen = this.askGen;
      void said.then(() => {
        if (gen === this.askGen) this.askNow();
      });
      return;
    }
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
    if (Math.hypot(x - this.socket.x, y - this.socket.y) < 90) {
      this.place();
      return true;
    }
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
  private perform() {
    return actOut(this.ctx, this.actor, actionOf(this.sign));
  }
  private async sendSign() {
    if (this.busy || this.finished) return;
    const gap = missing(this.step, this.marks);
    // Send before she has heard what this sign needs: the instruction, not a miss.
    if (gap && this.askNow()) return;
    this.dropAsk();
    this.lock(true);
    this.selected = false;
    if (!gap) {
      sfx.sparkle();
      await this.speakSign();
      if (!this.alive) return;
      await this.perform();
      if (!this.alive) return;
      this.ctx.pet.cheer();
      const said = this.ctx.say('read.ready', { words: printed(this.sign, { ...this.marks, stop: false }) });
      // The lesson starts and the next sign follows the beat with input open (U7 R4); the last sign's line is heard out.
      if (this.index + 1 < this.signs.length) {
        await this.ctx.tw.wait(0.4);
        return void this.next(said);
      }
      await said;
      await this.ctx.tw.wait(0.4);
      await this.next();
      return;
    }
    sfx.boing();
    this.misses++;
    this.wrongs++;
    if (this.wrongs >= 2 && !this.hinted) {
      this.hinted = true;
      this.hints++;
    }
    await this.ctx.say(gap === 'cap' ? 'read.cap.missing' : 'read.stop.missing');
    if (this.alive) this.lock(false);
  }
}
/** The wish card's picture: the wished animal at its stage size, mid-action. Never a word. */
function wishArt(wish: Wish): Container {
  const node = new Container();
  const animal = new Critter(CRITTERS[wish.actor.animal]);
  animal.alive = false;
  animal.scale.set(wish.actor.size === 'big' ? 0.42 : 0.23);
  animal.position.set(-22, 58);
  if (wish.verb === 'sleeps') animal.setMood('sleepy');
  const mark =
    wish.verb === 'sleeps'
      ? label('Z', 34, swatch.blue.line)
      : new Graphics()
          .moveTo(0, 35)
          .lineTo(0, -30)
          .moveTo(-18, -12)
          .lineTo(0, -30)
          .lineTo(18, -12)
          .stroke({ width: 8, color: swatch.green.line, cap: 'round', join: 'round' });
  mark.position.set(66, wish.verb === 'sleeps' ? -30 : -10);
  node.addChild(animal, mark);
  node.eventMode = 'none';
  return node;
}
function wordTile(word: string, size = 30) {
  const node = new Container();
  node.addChild(
    new Graphics().roundRect(-54, -50, 108, 100, 16).fill(cream).stroke({ width: 3, color: wood.line }),
    label(word, size),
  );
  node.hitArea = new Rectangle(-54, -50, 108, 100);
  return node;
}
interface MakeTile {
  word: SlotWord;
  node: Container;
  drag: DragHandle;
  slot: number;
}
const STAGE_SCALE = 1.3;
const centre = (b: Box) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

/**
 * Level 7 (WC3, *Make the sign*): the pet's wish is a picture; she drags word tiles between a locked *The* and stop
 * (insert, move and take out are free), Show it acts the sign as written, and Send judges it against the wish.
 * Levels 8–9 (KE1, *Mend the sign*) start from an authored broken sign that the animals act out first; level 9 adds
 * the swap, a tray tile dropped onto a slot word.
 */
class MakeDo implements Game {
  readonly wishes: WishSign[];
  readonly tiles: MakeTile[] = [];
  /** The slot words on the sign, in order. */
  sign: SlotWord[] = [];
  readonly the = wordTile('The', 38);
  readonly stop = wordTile('.', 60);
  readonly replay = speaker();
  readonly card = new Container();
  readonly actors = new Container();
  readonly socket = new Container();
  readonly gapMark = new Container();
  readonly outlines = new Container();
  readonly send = button('Send', swatch.green.light, swatch.green.line, sendIcon(), 150);
  readonly show = button('Show it', cream, wood.line, eyeIcon(), 150);
  index = -1;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  hinted = false;
  private alive = true;
  private wrongs = 0;
  private toldFull = false;
  private clock = 0;
  private hover: number | null = null;
  /** Level 9: the slot word a held tray tile would replace, and that word's tile (dimmed and wobbling). */
  private held: Drop | null = null;
  private swapNode: Container | null = null;
  private readonly level: number;
  /** Where the finger went down and where it is now, in stage units: a short travel is a tap that says the word. */
  private finger = { x: 0, y: 0, travel: 0 };
  private critters: Critter[] = [];
  /** The next sign's opening (levels 8–9: the broken sign acted out) and instruction, waiting behind `read.make.yes` (U7 R4). */
  unasked = false;
  private askGen = 0;
  private L: SignLayout;
  private readonly glow = new Graphics();
  private readonly backdrop: Backdrop;
  private view: View;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.level = ctx.level;
    this.L = signLayout(ctx.view, this.level);
    this.wishes = this.level >= 8 ? makeMendSigns(ctx.rng, this.level) : makeWishes(ctx.rng);
    this.backdrop = new Backdrop(
      {
        sky: [swatch.green.light, cream],
        hills: [swatch.green.fill, swatch.teal.light],
        horizon: 0.72,
        clouds: 2,
        sun: false,
        seed: 47,
      },
      ctx.view,
    );
    this.actors.eventMode =
      this.glow.eventMode =
      this.outlines.eventMode =
      this.socket.eventMode =
      this.gapMark.eventMode =
        'none';
    this.socket.addChild(socketArt());
    this.gapMark.addChild(socketArt(16, 46, swatch.yellow.line));
    onTap(this.replay, () => void this.free(() => this.speakSign()));
    onTap(
      this.show,
      () =>
        void this.free(async () => {
          await this.speakSign();
          if (this.alive) await this.perform(act(this.sign, this.round.stage));
        }),
    );
    onTap(this.send, () => void this.sendSign());
    onTap(this.the, () => this.hear('read.the', this.the));
    onTap(this.stop, () => this.hear('read.stamp', this.stop));
    onTap(this.card, () => {
      if (!this.busy && !this.finished && !this.touched()) {
        sfx.pop(2);
        void ctx.say('read.make.wish');
      }
    });
    ctx.stage.addChild(
      this.backdrop,
      this.actors,
      this.card,
      this.outlines,
      this.socket,
      this.the,
      this.stop,
      this.replay,
      this.show,
      this.send,
      this.gapMark,
      this.glow,
    );
  }
  get round() {
    return this.wishes[this.index];
  }
  private get instruction(): LineId {
    return this.level >= 9
      ? 'read.mend.swap.instruction'
      : this.level === 8
        ? 'read.mend.instruction'
        : 'read.make.instruction';
  }
  start() {
    void this.next();
  }
  destroy() {
    this.alive = false;
    for (const t of this.tiles) t.drag.destroy();
  }
  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    this.L = signLayout(v, this.level);
    const at = (node: Container, b: Box) => node.position.copyFrom(centre(b));
    at(this.the, this.L.row[0]);
    at(this.stop, this.L.row[4]);
    at(this.socket, this.L.row[1]);
    at(this.replay, this.L.speaker);
    at(this.card, this.L.wish);
    at(this.show, this.L.show);
    at(this.send, this.L.send);
    this.actors.position.set(v.w / 2, v.h * 0.43);
    this.outlines.children.forEach((o, i) => at(o as Container, this.L.tray[i]));
    for (const t of this.tiles) t.drag.home = centre(this.L.tray[t.slot]);
    this.place(false);
  }
  /** Where a tile rests: its sign place (spread open around a hovered gap) or its tray slot. */
  private spot(t: MakeTile) {
    const i = this.sign.indexOf(t.word);
    if (i < 0) return centre(this.L.tray[t.slot]);
    const c = centre(this.L.row[1 + i]);
    return { x: c.x + (this.hover === null ? 0 : i < this.hover ? -29 : 29), y: c.y };
  }
  private place(animate: boolean) {
    for (const t of this.tiles) {
      if (t.drag.dragging) continue;
      const to = this.spot(t);
      if (animate) void this.ctx.tw.to(t.node, to, { duration: 0.18 });
      else {
        this.ctx.tw.kill(t.node);
        t.node.position.copyFrom(to);
      }
    }
    this.socket.visible = this.sign.length === 0;
  }
  /** The centres of `words` slot words at rest, with nothing spread open. */
  private rest(words: number) {
    return this.L.row.slice(1, 1 + words).map((b) => centre(b).x);
  }
  private gapX(gap: number) {
    return centre(this.L.row[1]).x - 58 + gap * 116;
  }
  private overSign(x: number, y: number) {
    const d = this.L.drop;
    return x >= d.x && x <= d.x + d.w && y >= d.y && y <= d.y + d.h;
  }
  update(dt: number) {
    this.clock += dt;
    this.glow.clear();
    this.gapMark.visible = false;
    if (this.swapNode && !this.swapNode.destroyed) this.swapNode.rotation = Math.sin(this.clock * 14) * 0.07;
    if (!this.hinted || this.busy || this.finished || !this.round || this.tiles.some((t) => t.drag.dragging))
      return;
    const hint = hintFor(this.sign, this.round, this.level);
    if (hint.kind === 'add') this.gapMark.visible = true;
    for (const target of this.hintTargets(hint)) {
      const wide = target === this.send ? 170 : 128;
      this.glow
        .roundRect(target.x - wide / 2, target.y - 62, wide, 124, 26)
        .stroke({ width: 6 + Math.sin(this.clock * 5), color: swatch.yellow.fill });
    }
  }
  /** What the hint points at, the thing to move first; for a word to add, also sets the dotted mark at its gap; a swap glows the tray word and the word it replaces. */
  private hintTargets(hint: Hint): Container[] {
    if (hint.kind === 'send') return [this.send];
    if (hint.kind === 'out') return [this.tileOf(this.sign[hint.index]).node];
    if (hint.kind === 'swap') return [this.tileOf(hint.word).node, this.tileOf(this.sign[hint.index]).node];
    this.gapMark.position.set(this.gapX(hint.gap), centre(this.L.row[1]).y);
    return [this.tileOf(hint.word).node];
  }
  private tileOf(word: SlotWord) {
    return this.tiles.find((t) => t.word === word)!;
  }
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.unasked || !this.round || this.tiles.some((t) => t.drag.dragging))
      return null;
    const hint = hintFor(this.sign, this.round, this.level);
    const [target, onto] = this.hintTargets(hint);
    if (hint.kind === 'send') return { tap: { on: this.send } };
    if (hint.kind === 'add') return { drag: { on: target }, to: { on: this.gapMark } };
    if (hint.kind === 'swap') return { drag: { on: target }, to: { on: onto } };
    return {
      drag: { on: target },
      to: { on: this.outlines.children[this.tileOf(this.sign[hint.index]).slot] as Container },
    };
  }
  private lock(on: boolean) {
    this.busy = on;
    for (const t of this.tiles) t.drag.enabled = !on;
  }
  /** Says the waiting opening and instruction, if there are any. */
  private askNow() {
    if (!this.unasked || this.finished) return false;
    this.dropAsk();
    void this.opening().then(() => {
      if (this.alive && !this.finished) this.lock(false);
    });
    return true;
  }
  private dropAsk() {
    this.unasked = false;
    this.askGen++;
  }
  /**
   * A touch while the next sign's opening waits. At level 7 she is making the sign already, so the instruction is dropped;
   * at levels 8–9 she has not yet seen what is wrong with it, so the broken sign is acted out now and the touch does nothing else.
   */
  private touched() {
    if (!this.unasked) return false;
    if (this.level >= 8) return this.askNow();
    this.dropAsk();
    return false;
  }
  /** The guide was tapped while the next sign's instruction waits: say it, not the one before it. */
  sayWaitingAsk() {
    return this.askNow();
  }
  private hear(line: LineId, node: Container) {
    if (this.busy || this.finished || this.touched()) return;
    sfx.pop(2);
    void this.ctx.say(line);
    void this.ctx.tw.to(node, { alpha: 0.65 }, { duration: 0.08 }).then(() => {
      if (this.alive && !node.destroyed) return this.ctx.tw.to(node, { alpha: 1 }, { duration: 0.15 });
    });
  }
  private async free(run: () => Promise<void>) {
    if (this.busy || this.finished || this.tiles.some((t) => t.drag.dragging) || this.touched()) return;
    this.lock(true);
    sfx.pop(2);
    await run();
    if (this.alive) this.lock(false);
  }
  /**
   * The next wish or broken sign. With `said` (the last sign's `read.make.yes`, still playing), it opens with input open
   * and its opening and instruction wait for the line, her first touch or the guide (U7 R4).
   */
  private async next(said?: Promise<unknown>) {
    if (!this.alive) return;
    this.dropAsk();
    this.lock(true);
    this.index++;
    this.wrongs = 0;
    this.hinted = this.toldFull = false;
    this.sign = [];
    for (const t of this.tiles.splice(0)) {
      t.drag.destroy();
      t.node.destroy({ children: true });
    }
    if (this.index === this.wishes.length) {
      this.finished = true;
      sfx.tada();
      await this.ctx.say('read.done');
      if (this.alive) this.ctx.finish({ misses: this.misses, hints: this.hints });
      return;
    }
    this.outlines.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.round.tray.forEach((word, slot) => {
      this.outlines.addChild(socketArt(50, 46)).alpha = 0.35;
      const node = wordTile(word);
      const tile: MakeTile = { word, node, slot, drag: undefined as unknown as DragHandle };
      tile.drag = draggable(node, this.ctx.tw, {
        onPick: () => {
          // At levels 8–9 a pick before the broken sign was shown shows it; the tile then goes home unchanged.
          this.touched();
          this.ctx.stage.addChildAt(node, this.ctx.stage.getChildIndex(this.gapMark));
          sfx.pop(4);
        },
        onMove: (x, y) => this.hovering(tile, x, y),
        onDrop: (x, y) => this.dropTile(tile, x, y),
      });
      tile.drag.enabled = false;
      node.on('pointerdown', (e) => {
        const p = this.ctx.stage.toLocal(e.global);
        this.finger = { x: p.x, y: p.y, travel: 0 };
      });
      node.on('globalpointermove', (e) => {
        if (!tile.drag.dragging) return;
        const p = this.ctx.stage.toLocal(e.global);
        this.finger.travel = Math.max(
          this.finger.travel,
          Math.hypot(p.x - this.finger.x, p.y - this.finger.y),
        );
      });
      this.tiles.push(tile);
      this.ctx.stage.addChildAt(node, this.ctx.stage.getChildIndex(this.gapMark));
    });
    this.card.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.card.addChild(
      new Graphics()
        .poly([-60, 70, -100, 110, -30, 78])
        .fill(cream)
        .stroke({ width: 4, color: wood.line })
        .roundRect(-100, -80, 200, 160, 30)
        .fill(cream)
        .stroke({ width: 4, color: wood.line }),
      wishArt(this.round.wish),
    );
    this.card.hitArea = new Rectangle(-100, -80, 200, 160);
    this.sign = 'start' in this.round ? [...(this.round.start as SlotWord[])] : [];
    this.cast();
    this.resize(this.view);
    if (said) {
      this.unasked = true;
      this.lock(false);
      const gen = this.askGen;
      void said.then(() => {
        if (gen === this.askGen) this.askNow();
      });
      return;
    }
    await this.opening();
    if (this.alive) this.lock(false);
  }
  /** The sign's opening, with input locked: at levels 8–9 the broken sign acted out, then the instruction. */
  private async opening() {
    this.lock(true);
    if (this.level >= 8) {
      // The broken sign acts itself out first, as Show it would: she sees what is wrong before she is asked to fix it.
      await this.ctx.say('read.mend.watch');
      if (!this.alive) return;
      await this.speakSign();
      if (!this.alive) return;
      await this.perform(act(this.sign, this.round.stage));
      if (!this.alive) return;
    }
    await this.ctx.instruct(this.instruction);
  }
  /** Puts the stage's animals in their places: one in the middle, or the big one left and the small one right. */
  private cast() {
    this.actors.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.critters = this.round.stage.map((a, i, all) => {
      const critter = new Critter(CRITTERS[a.animal]);
      critter.alive = false;
      critter.scale.set((a.size === 'big' ? 0.42 : 0.23) * STAGE_SCALE);
      critter.position.set(all.length === 1 ? 0 : i === 0 ? -110 : 110, 55 * STAGE_SCALE);
      this.actors.addChild(critter);
      return critter;
    });
  }
  /** Where a held tile would land; only a tray tile can swap (a sign word moves to a gap, as at level 7). */
  private landing(tile: MakeTile, x: number, y: number): Drop | null {
    if (!this.overSign(x, y)) return null;
    const others = this.sign.filter((w) => w !== tile.word).length;
    return resolveDrop(x, this.rest(others), others === this.sign.length ? this.level : 7, this.held);
  }
  /** Dims and wobbles the slot word a held tile would replace (null: none). */
  private setSwap(drop: Drop | null) {
    const node = drop?.kind === 'swap' ? this.tileOf(this.sign[drop.index]).node : null;
    this.held = drop?.kind === 'swap' ? drop : null;
    if (node === this.swapNode) return;
    if (this.swapNode && !this.swapNode.destroyed) {
      this.swapNode.alpha = 1;
      this.swapNode.rotation = 0;
    }
    this.swapNode = node;
    if (node) {
      node.alpha = 0.55;
      sfx.pop(1);
    }
  }
  private hovering(tile: MakeTile, x: number, y: number) {
    const drop = this.landing(tile, x, y);
    this.setSwap(drop);
    const others = this.sign.filter((w) => w !== tile.word).length;
    const gap = drop?.kind === 'gap' && others < MAX_SLOTS ? drop.gap : null;
    if (gap === this.hover) return;
    this.hover = gap;
    // Spread the words around the gap she is over, as if she had taken hers out.
    const was = this.sign;
    this.sign = was.filter((w) => w !== tile.word);
    this.place(true);
    this.sign = was;
  }
  private dropTile(tile: MakeTile, x: number, y: number) {
    this.hover = null;
    const drop = this.landing(tile, x, y);
    this.setSwap(null);
    const tapped = this.finger.travel < 30;
    const others = this.sign.filter((w) => w !== tile.word);
    if (this.busy) {
      /* never changes a sign mid-read */
    } else if (tapped) {
      sfx.pop(2);
      void this.ctx.say(WORD_LINES[tile.word]);
    } else if (drop?.kind === 'swap') {
      // The tray word takes the slot word's place; the replaced word floats to its home slot.
      this.sign = this.sign.map((w, i) => (i === drop.index ? tile.word : w));
      sfx.marimba(drop.index + 3, 0.2);
    } else if (drop) {
      if (others.length >= MAX_SLOTS) {
        if (!this.toldFull) {
          this.toldFull = true;
          void this.ctx.say('read.make.full');
        }
      } else {
        const gap = drop.gap;
        this.sign = [...others.slice(0, gap), tile.word, ...others.slice(gap)];
        sfx.marimba(this.sign.length + 2, 0.25);
      }
    } else this.sign = others;
    this.place(true);
    return true;
  }
  private async speakSign() {
    const nodes = [this.the, ...this.sign.map((w) => this.tileOf(w).node)];
    const lines: LineId[] = ['read.the', ...this.sign.map((w) => WORD_LINES[w])];
    for (let i = 0; i < lines.length; i++) {
      if (!this.alive) return;
      nodes[i].alpha = 0.6;
      await this.ctx.say(lines[i]);
      if (!this.alive) return;
      nodes[i].alpha = 1;
    }
  }
  /** The animals do what the sign says; every reaction is gentle and ends with them back in place. */
  private async perform(o: Outcome) {
    const tw = this.ctx.tw;
    if (o.kind === 'unreadable') {
      const row = [this.the, ...this.sign.map((w) => this.tileOf(w).node), this.stop];
      for (const dx of [-10, 10, 0]) {
        row.forEach((n) => void tw.to(n, { x: n.x + dx }, { duration: 0.1 }));
        await tw.wait(0.1);
      }
      this.place(false);
      return;
    }
    if (o.kind === 'none') {
      const mark = label('?', 72, wood.line);
      mark.position.set(0, -130);
      this.actors.addChild(mark);
      for (const r of [-0.15, 0.15, 0])
        await Promise.all(this.critters.map((c) => tw.to(c, { rotation: r }, { duration: 0.25 })));
      if (!mark.destroyed) mark.destroy();
      return;
    }
    if (o.kind === 'which') {
      this.critters.forEach((c) => c.setMood('surprised'));
      await Promise.all(
        this.critters.map((c, i) => tw.to(c, { rotation: i === 0 ? 0.18 : -0.18 }, { duration: 0.25 })),
      );
      await tw.wait(0.5);
      await Promise.all(this.critters.map((c) => tw.to(c, { rotation: 0 }, { duration: 0.25 })));
      this.critters.forEach((c) => {
        if (!c.destroyed) c.setMood('happy');
      });
      return;
    }
    const critter =
      this.critters[
        this.round.stage.findIndex((a) => a.animal === o.actor.animal && a.size === o.actor.size)
      ];
    if (o.verb === 'jumps') {
      const y = critter.y;
      await tw.to(critter, { y: y - 60 }, { duration: 0.25 });
      await tw.to(critter, { y }, { duration: 0.3 });
      return;
    }
    critter.setMood('sleepy');
    const z = label('Z', 40, swatch.blue.line);
    z.position.set(critter.x + 50, -110);
    this.actors.addChild(z);
    await tw.to(z, { y: -150, alpha: 0.3 }, { duration: 0.9 });
    if (!z.destroyed) z.destroy();
    if (!critter.destroyed) critter.setMood('happy');
  }
  private async sendSign() {
    if (this.busy || this.finished || this.tiles.some((t) => t.drag.dragging)) return;
    if (!this.sign.length || this.level >= 8) {
      // Before the opening was heard (or with nothing to judge): the opening or the instruction, never a miss.
      if (this.askNow()) return;
    } else this.dropAsk();
    if (!this.sign.length) {
      // Nothing to judge yet: the instruction again, never a miss.
      this.lock(true);
      await this.ctx.instruct(this.instruction);
      if (this.alive) this.lock(false);
      return;
    }
    this.lock(true);
    const outcome = act(this.sign, this.round.stage);
    const words = ['the', ...this.sign].join(' ');
    await this.speakSign();
    if (!this.alive) return;
    await this.perform(outcome);
    if (!this.alive) return;
    if (sameAct(outcome, this.round.wish)) {
      sfx.sparkle();
      this.ctx.pet.cheer();
      const said = this.ctx.say('read.make.yes', { words });
      // The line starts and the next wish or sign follows the beat with input open (U7 R4); the last line is heard out.
      if (this.index + 1 < this.wishes.length) {
        await this.ctx.tw.wait(0.4);
        return void this.next(said);
      }
      await said;
      await this.ctx.tw.wait(0.4);
      await this.next();
      return;
    }
    sfx.boing();
    this.misses++;
    this.wrongs++;
    if (outcome.kind === 'act') await this.ctx.say('read.make.other', { words });
    else if (outcome.kind === 'which') await this.ctx.say('read.make.which', { animal: outcome.animal });
    else if (outcome.kind === 'none')
      await this.ctx.say('read.make.none', {
        words: outcome.size ? `${outcome.size} ${outcome.animal}` : outcome.animal,
      });
    else await this.ctx.say('read.make.mixed');
    if (!this.alive) return;
    if (this.wrongs >= 2 && !this.hinted) {
      this.hinted = true;
      this.hints++;
    }
    if (this.hinted) {
      const hint = hintFor(this.sign, this.round, this.level);
      if (hint.kind === 'add') {
        await this.ctx.say('read.make.hint.add');
        if (this.alive) await this.ctx.say(WORD_LINES[hint.word]);
      } else if (hint.kind === 'swap') {
        await this.ctx.say('read.mend.hint.swap');
        if (this.alive) await this.ctx.say(WORD_LINES[hint.word]);
      } else if (hint.kind === 'out') await this.ctx.say('read.make.hint.out');
    }
    if (this.alive) this.lock(false);
  }
}
function sticker(seed: number) {
  const c = new Container();
  c.addChild(
    new Graphics().roundRect(-95, -70, 190, 140, 20).fill(cream).stroke({ width: 6, color: wood.line }),
    picture(
      new Rng(seed).pick([
        { kind: 'action', animal: 'duck', action: 'jump' },
        { kind: 'action', animal: 'cat', action: 'sleep' },
      ] as const),
    ),
  );
  return c;
}
export const readDo: GameModule = {
  id: 'read-do',
  name: 'Read & Do',
  titleLine: 'game.read-do',
  region: 'story-grove',
  challenge: 'words',
  skills: ['reading', 'word meaning', 'sentences'],
  bands: ['prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.quiet,
  touchDemo: true,
  coplayHint: 'Read the sign together, then let your child choose. Hearing a word is free support.',
  offScreen: 'Write big pig or green hat on a card and find a matching toy or drawing together.',
  hubIcon: () => {
    const art = sticker(1);
    art.y = -80;
    return new WigglyIcon(art);
  },
  sticker,
  create: (ctx) =>
    ctx.level >= 7 ? new MakeDo(ctx) : stepFor(ctx.level) ? new SignDo(ctx) : new ReadDo(ctx),
};
