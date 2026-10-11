import { Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { cream, ink, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { sfx } from '../../audio/sfx';
import { STYLES } from '../../audio/music';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import type { LineId } from '../../content/voice-script';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { answerIndex, makeTasks, matches, meaning, planFor, type Choice, type Word } from './logic';

const LEVELS: BandLevels = { prek: { min: 1, max: 2 }, school: { min: 1, max: 3 } };
export const WORD_LINES: Record<Word, LineId> = {
  red: 'read.red', blue: 'read.blue', yellow: 'read.yellow', big: 'read.big', small: 'read.small',
  duck: 'read.duck', cat: 'read.cat', the: 'read.the', can: 'read.can', jump: 'read.jump', sleep: 'read.sleep',
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
    const animal = new Critter(CRITTERS[choice.kind === 'size' ? 'duck' : choice.animal]);
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
    this.replay.addChild(new Graphics().roundRect(-55, -50, 110, 100, 24).fill(cream).stroke({ width: 4, color: wood.line })
      .poly([-32, -12, -18, -12, 0, -28, 0, 28, -18, 12, -32, 12]).fill(ink)
      .moveTo(12, -24).quadraticCurveTo(40, 0, 12, 24).stroke({ width: 5, color: ink, cap: 'round' }));
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
  private async act(choice: Choice) {
    this.actor.removeChildren().forEach(c => c.destroy({ children: true }));
    const art = picture(choice);
    art.scale.set(1.3);
    this.actor.addChild(art);
    if (choice.kind === 'action' && choice.action === 'jump') {
      await this.ctx.tw.to(art, { y: -55 }, { duration: 0.25 });
      await this.ctx.tw.to(art, { y: 0 }, { duration: 0.3 });
    } else {
      await this.ctx.tw.to(art, { rotation: 0.08 }, { duration: 0.18 });
      await this.ctx.tw.to(art, { rotation: 0 }, { duration: 0.18 });
    }
  }
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
function sticker(seed: number) {
  const c = new Container();
  c.addChild(new Graphics().roundRect(-95, -70, 190, 140, 20).fill(cream).stroke({ width: 6, color: wood.line }), picture(new Rng(seed).pick([
    { kind: 'action', animal: 'duck', action: 'jump' }, { kind: 'action', animal: 'cat', action: 'sleep' },
  ] as const)));
  return c;
}
export const readDo: GameModule = {
  id: 'read-do', name: 'Read & Do', titleLine: 'game.read-do', region: 'story-grove',
  skills: ['reading', 'word meaning', 'sentences'], bands: ['prek', 'school'],
  levels: band => rangeFor(LEVELS, band), describeLevel: level => planFor(level).name,
  music: STYLES.quiet, touchDemo: true,
  coplayHint: 'Read the sign together, then let your child choose. Hearing a word is free support.',
  offScreen: 'Write big duck or red hat on a card and find a matching toy or drawing together.',
  hubIcon: () => { const art = sticker(1); art.y = -80; return new WigglyIcon(art); },
  sticker, create: ctx => new ReadDo(ctx),
};
