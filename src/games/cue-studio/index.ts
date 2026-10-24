import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, ink, RAINBOW, swatch, wood, type ColorName, type Swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { CompanionRig } from '../../creatures/companion';
import type { LineId } from '../../content/voice-script';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { finish as finishArt, spring, squash } from '../../ui/buttons';
import { againIcon, checkIcon, nextIcon, playIcon } from '../../ui/icons';
import { saysFrame } from '../pet-says/logic';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { canFinish, checkRun, mismatch, demoNext, finishRun, firstEmpty, help, isComplete, newStudio, planFor, playRun, restart, step, stickerRecipe, tapAction, tapSlot, trace, undo, type Cue, type CuePlan, type Studio } from './logic';

// The 2026-10-23 decision separates pre-K creation from school requested repair.
const LEVELS: BandLevels = {
  prek: { min: 1, max: 2 },
  school: { min: 3, max: 3 },
};

/** Every card, slot and control is this square, in logical units. */
const BOX = 112;
const CUE_COLOR: Record<Cue, ColorName> = { W: 'orange', T: 'purple' };

/** An open hand: the Wave card. */
function handIcon(color = ink): Graphics {
  const g = new Graphics();
  for (const [x, h] of [[-15, 30], [-5, 36], [5, 36], [15, 30]] as const) g.roundRect(x - 4.5, -12 - h, 9, h + 8, 4.5).fill(color);
  g.roundRect(-20, -18, 40, 36, 14).fill(color);
  return g.roundRect(14, -14, 9, 26, 4.5).fill(color);
}

/** The Wave or Turn picture, for a card, a slot, the hub icon or a sticker. */
function cueIcon(cue: Cue, color = 0xffffff): Graphics {
  if (cue === 'W') {
    const g = handIcon(color);
    g.position.set(0, 8);
    g.rotation = -0.25;
    return g;
  }
  const g = againIcon(color);
  g.scale.set(1.4);
  return g;
}

/** Undo: a hooked arrow coming back on itself. */
function undoIcon(color = ink): Graphics {
  return new Graphics()
    .moveTo(20, 20).lineTo(20, -2).arc(0, -2, 20, 0, Math.PI, true).lineTo(-20, 6)
    .stroke({ width: 8, color, cap: 'round', join: 'round' })
    .poly([-33, 2, -20, 20, -7, 2]).fill(color);
}

/** Show me: a little lit bulb. */
function bulbIcon(color = ink): Graphics {
  return new Graphics().circle(0, -8, 20).fill(swatch.yellow.fill).stroke({ width: 5, color })
    .roundRect(-10, 12, 20, 14, 4).fill(color);
}

/** A square that answers on touch-down, squashing at once and springing back. */
class Pad extends Container {
  readonly face = new Container();
  private art: Graphics;

  constructor(private sw: Swatch, icon: Container | null, private readonly onPress: () => void, faceColor?: number) {
    super();
    this.art = finishArt({ w: BOX, h: BOX, corner: 24 }, sw, faceColor);
    this.addChild(this.art, this.face);
    if (icon) this.face.addChild(icon);
    this.hitArea = new Rectangle(-BOX / 2, -BOX / 2, BOX, BOX);
    onTap(this, () => this.press(), { cooldown: 250 });
  }

  press() {
    squash(this);
    spring(this, 90);
    this.onPress();
  }

  /** A new swatch, keeping the picture. */
  paint(sw: Swatch, faceColor?: number) {
    if (this.sw === sw && faceColor === undefined) return;
    this.sw = sw;
    this.art.destroy();
    this.art = finishArt({ w: BOX, h: BOX, corner: 24 }, sw, faceColor);
    this.addChildAt(this.art, 0);
  }

  setIcon(icon: Container | null) {
    for (const c of this.face.removeChildren()) c.destroy();
    if (icon) this.face.addChild(icon);
  }
}

class CueStudio implements Game {
  readonly plan: CuePlan;
  readonly s: Studio;
  readonly star: CompanionRig;
  readonly actor = new Container();
  readonly mitten: Graphics;
  readonly cards: Record<Cue, Pad>;
  readonly slots: Pad[] = [];
  readonly requests: Pad[] = [];
  readonly clue = new Graphics();
  readonly requestShelf = new Graphics();
  watchedInitial = false;
  /** A dot under each slot that lights as its command runs: the trace of the show. */
  readonly marks: Graphics[] = [];
  /** The arrow over the slot she picked to change. */
  readonly pointer = new Graphics().poly([-18, -14, 18, -14, 0, 8]).fill(ink);
  /** The wooden shelf the show's slots stand on, so they never look like the action cards. */
  readonly shelf = new Graphics();
  readonly playButton: Pad;
  readonly stepButton: Pad;
  readonly undoButton: Pad;
  readonly hintButton: Pad;
  readonly finishButton: Pad;
  busy = true;
  finished = false;
  /** The ghost finger has made its change (level 2). */
  changed = false;
  /** The slot running now, for its glow; -1 when nothing runs. */
  running = -1;
  /** How far the trace has lit, in commands. */
  lit = 0;
  private dead = false;
  private runId = 0;
  private readonly backdrop: Backdrop;
  private readonly frame: ReturnType<typeof saysFrame>;
  private readonly height: number;

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.s = newStudio(this.plan.slots, this.plan.request);
    this.backdrop = ctx.track(new Backdrop({ sky: [0xc8f0ec, 0xfff6e0], hills: [0xa9e0d6, 0xc5e7a8, 0xddf2cf], horizon: 0.5, clouds: 2, sun: true, seed: 151 }, ctx.view));
    this.star = ctx.track(ctx.companion());
    this.star.eventMode = 'none';
    this.height = this.star.getLocalBounds().height;
    this.frame = saysFrame((p) => this.star.partPoints(p), this.star.bodyBounds());
    const sw = swatch[this.star.color as ColorName];
    this.mitten = new Graphics().circle(0, 0, 24).fill(sw.fill).stroke({ width: 6, color: sw.line }).circle(-8, -9, 6).fill({ color: 0xffffff, alpha: 0.35 });
    this.mitten.position.copyFrom(this.frame.rest.right);
    this.star.attach(this.mitten);
    this.actor.addChild(this.star);
    this.actor.eventMode = 'none';

    this.cards = {
      W: new Pad(swatch[CUE_COLOR.W], cueIcon('W'), () => this.choose('W')),
      T: new Pad(swatch[CUE_COLOR.T], cueIcon('T'), () => this.choose('T')),
    };
    for (let i = 0; i < this.plan.slots; i++) {
      this.slots.push(new Pad(swatch.white, null, () => this.pickSlot(i), cream));
      this.marks.push(new Graphics());
    }
    if (this.s.request) for (const cue of this.s.request) {
      this.requests.push(new Pad(swatch[CUE_COLOR[cue]], cueIcon(cue), () => this.say(cue === 'W' ? 'cue.request-wave' : 'cue.request-turn')));
    }
    this.clue.eventMode = 'none';
    this.requestShelf.eventMode = 'none';
    this.playButton = new Pad(swatch.green, playIcon(), () => void this.play());
    this.stepButton = new Pad(swatch.teal, nextIcon(0xffffff), () => void this.stepOnce());
    this.undoButton = new Pad(swatch.yellow, undoIcon(), () => this.undo());
    this.hintButton = new Pad(swatch.white, bulbIcon(), () => void this.help());
    this.finishButton = new Pad(swatch.blue, checkIcon(), () => void (this.s.request && !this.s.checked ? this.check() : this.finish()));
    this.pointer.eventMode = 'none';
    this.shelf.eventMode = 'none';
    this.pointer.visible = false;
    ctx.stage.addChild(this.backdrop, this.actor, this.requestShelf, ...this.requests, this.shelf, this.cards.W, this.cards.T, ...this.slots, ...this.marks, this.clue, this.pointer,
      this.playButton, this.stepButton, this.undoButton, this.hintButton, this.finishButton);
    this.draw();
  }

  start() {
    void this.intro();
  }

  private async intro() {
    const run = this.runId;
    await this.ctx.instruct(this.s.request ? 'cue.repair' : this.plan.slots === 1 ? 'cue.one' : 'cue.two');
    if (this.dead || run !== this.runId) return;
    this.busy = false;
  }

  resize(v: View) {
    this.backdrop.resize(v);
    const portrait = v.h > v.w;
    const ox = Math.max(0, (v.w - 1024) / 2);
    // The definition's rectangles (top-left corners); each box's centre is half a box in.
    const oy = portrait ? Math.max(0, (v.h - 900) / 2) : Math.max(0, (v.h - 768) / 2);
    const at = (node: Container, x: number, y: number) => node.position.set(ox + x + BOX / 2, oy + y + BOX / 2);
    const k = Math.min(1.3, 190 / this.height);
    this.actor.scale.set(k);
    const one = this.plan.slots === 1;
    if (portrait) {
      this.actor.position.set(ox + (this.s.request ? 800 : 512), oy + 360);
      for (let i = 0; i < this.slots.length; i++) at(this.slots[i], one ? 448 : 384 + i * 128, 420);
      // A little lower than the definition's 564/708, to leave room under the show's shelf.
      at(this.cards.W, 384, 600);
      at(this.cards.T, 512, 600);
      [this.playButton, this.stepButton, this.undoButton, this.hintButton, this.finishButton].forEach((b, i) => at(b, 192 + i * 128, 748));
    } else {
      this.actor.position.set(ox + 828, oy + 330);
      for (let i = 0; i < this.slots.length; i++) at(this.slots[i], one ? 448 : 384 + i * 128, 356);
      // 32 units left of the definition's 128/256, so the cards stand clear of the shelf.
      at(this.cards.W, 96, 356);
      at(this.cards.T, 224, 356);
      [this.playButton, this.stepButton, this.undoButton, this.hintButton, this.finishButton].forEach((b, i) => at(b, 192 + i * 128, 532));
    }
    this.requests.forEach((pad, i) => at(pad, 384 + i * 128, portrait ? 144 : 136));
    this.requestShelf.clear();
    if (this.requests.length) {
      const first = this.requests[0];
      this.requestShelf.roundRect(first.x - 72, first.y - 72, 272, 144, 24).fill(cream).stroke({ width: 5, color: wood.line });
    }
    this.slots.forEach((slot, i) => this.marks[i].position.set(slot.x, slot.y + BOX / 2 + 16));
    const [first, last] = [this.slots[0], this.slots[this.slots.length - 1]];
    const [x0, x1, y0] = [first.x - BOX / 2 - 18, last.x + BOX / 2 + 18, first.y - BOX / 2 - 18];
    this.shelf.clear().roundRect(x0, y0, x1 - x0, BOX + 52, 26).fill(wood.light).stroke({ width: 6, color: wood.line })
      .roundRect(x0, y0 + BOX + 30, x1 - x0, 22, 11).fill(wood.fill).stroke({ width: 6, color: wood.line });
    this.draw();
  }

  update() {}

  /** The slots, the selection, the trace and which controls are ready, from the state. */
  draw() {
    const { program, selected } = this.s;
    this.slots.forEach((pad, i) => {
      const cue = program[i];
      // The running slot glows yellow while the companion acts it.
      pad.paint(this.running === i ? swatch.yellow : cue ? swatch[CUE_COLOR[cue]] : swatch.white, cue ? undefined : cream);
      pad.setIcon(cue ? cueIcon(cue) : null);
      const on = i < this.lit;
      this.marks[i].clear();
      // Actual trace retains the command picture below its editor slot, to compare with the request above.
      for (const child of this.marks[i].removeChildren()) child.destroy();
      if (on && cue) {
        const icon = cueIcon(cue, ink);
        icon.scale.set(0.32);
        this.marks[i].addChild(icon);
      } else this.marks[i].circle(0, 0, 10).fill(0xffffff).stroke({ width: 4, color: swatch.white.line });
    });
    // The picked slot: a dark outline and an arrow over it, so it never depends on colour.
    const sel = selected !== null ? this.slots[selected] : null;
    this.pointer.visible = !!sel;
    if (sel) this.pointer.position.set(sel.x, sel.y - BOX / 2 - 18);
    if (sel) {
      const ring = new Graphics().roundRect(-BOX / 2 - 6, -BOX / 2 - 6, BOX + 12, BOX + 12, 28).stroke({ width: 8, color: ink });
      sel.face.addChild(ring);
    }
    this.clue.clear();
    const wrong = mismatch(this.s);
    if (wrong >= 0 && this.s.helped.size) {
      const slot = this.slots[wrong];
      this.clue.roundRect(slot.x - 62, slot.y - 62, 124, 124, 26).stroke({ width: 7, color: swatch.yellow.line });
      const request = this.requests[wrong];
      this.clue.roundRect(request.x - 62, request.y - 62, 124, 124, 26).stroke({ width: 7, color: swatch.yellow.line });
    }
    this.finishButton.setIcon(this.s.request && !this.s.checked ? playIcon() : checkIcon());
    this.finishButton.paint(this.s.request && !this.s.checked ? swatch.orange : swatch.blue);
    this.undoButton.alpha = this.s.undo ? 1 : 0.5;
    this.finishButton.alpha = this.s.request || canFinish(this.s) ? 1 : 0.45;
  }

  private nudge(node: Container) {
    this.ctx.tw.kill(node);
    node.rotation = 0;
    void this.ctx.tw.to(node, { rotation: 0.1 }, { duration: 0.1 }).then(() => this.ctx.tw.to(node, { rotation: -0.08 }, { duration: 0.12 })).then(() => this.ctx.tw.to(node, { rotation: 0 }, { duration: 0.1 }));
  }

  private pulse(node: Container) {
    squash(node);
    spring(node, 60);
  }

  private say(id: LineId) {
    void this.ctx.say(id);
  }

  /** An action card. */
  choose(cue: Cue) {
    if (this.busy || this.finished) return this.nudge(this.cards[cue]);
    const { selected, program } = this.s;
    const target = selected !== null && program[selected] !== null ? selected : firstEmpty(program);
    const result = tapAction(this.s, cue);
    if (result === 'full') {
      sfx.boing();
      for (const slot of this.slots) this.pulse(slot);
      this.say('cue.full');
    } else {
      sfx.pop(cue === 'W' ? 7 : 9);
      this.say(cue === 'W' ? 'cue.wave' : 'cue.turn');
      if (result === 'replace' && this.plan.slots > 1) this.changed = true;
      // The same move again changes nothing, so its lit trace stays.
      if (result !== 'same') this.lit = 0;
    }
    this.draw();
    if (result !== 'full') this.pulse(this.slots[target]);
  }

  pickSlot(i: number) {
    if (this.busy || this.finished) return this.nudge(this.slots[i]);
    const result = tapSlot(this.s, i);
    sfx.tick();
    if (result === 'selected') this.say('cue.selected');
    this.draw();
  }

  undo() {
    if (this.busy || this.finished) return this.nudge(this.undoButton);
    if (undo(this.s)) {
      sfx.tick();
      this.lit = 0;
      this.say('cue.undo');
    } else this.nudge(this.undoButton);
    this.draw();
  }

  /** An empty shelf, or a hole where a move belongs: show the first empty slot. */
  private showEmpty() {
    const at = firstEmpty(this.s.program);
    if (at >= 0) this.pulse(this.slots[at]);
    this.say(trace(this.s.program).length ? 'cue.incomplete' : 'cue.empty');
  }

  /** Play: the whole show from the start, each command in turn. */
  async play() {
    const run = this.runId;
    if (this.busy || this.finished) return this.nudge(this.playButton);
    const cues = playRun(this.s);
    if (!cues.length) return this.showEmpty();
    this.s.selected = null;
    this.busy = true;
    this.lit = 0;
    this.draw();
    for (let i = 0; i < cues.length; i++) {
      await this.perform(i, cues[i]);
      if (this.dead || run !== this.runId) return;
    }
    const wasReady = this.s.played;
    finishRun(this.s);
    this.busy = false;
    this.draw();
    if (!isComplete(this.s.program)) return this.showEmpty();
    this.watchedInitial = true;
    if (!wasReady && !this.s.request) this.say('cue.ready');
  }

  /** A deliberate Check plays every command, then compares its trace with the pictured request. */
  async check() {
    const run = this.runId;
    if (this.busy || this.finished) return this.nudge(this.finishButton);
    if (!isComplete(this.s.program)) return this.showEmpty();
    this.busy = true;
    this.s.selected = null;
    this.lit = 0;
    this.say('cue.check');
    const cues = playRun(this.s);
    for (let i = 0; i < cues.length; i++) {
      await this.perform(i, cues[i]);
      if (this.dead || run !== this.runId) return;
    }
    finishRun(this.s);
    const at = checkRun(this.s);
    this.watchedInitial = true;
    this.busy = false;
    this.draw();
    if (at === null) return;
    if (at < 0) { sfx.pop(12); this.say('cue.success'); }
    else {
      sfx.boing();
      this.pulse(this.slots[at]);
      this.say(at === 0 ? 'cue.mismatch-first' : 'cue.mismatch-second');
    }
  }

  /** Step: one command per press, from the start after an edit or a finished show. */
  async stepOnce() {
    const run = this.runId;
    if (this.busy || this.finished) return this.nudge(this.stepButton);
    const wasReady = this.s.played;
    const next = step(this.s);
    if (!next) return this.showEmpty();
    this.s.selected = null;
    this.busy = true;
    if (next.at === 0) this.lit = 0;
    this.draw();
    this.say(next.cue === 'W' ? 'cue.wave' : 'cue.turn');
    await this.perform(next.at, next.cue);
    if (this.dead || run !== this.runId) return;
    this.busy = false;
    this.draw();
    if (next.at === trace(this.s.program).length - 1 && !isComplete(this.s.program)) this.showEmpty();
    else if (!wasReady && this.s.played && !this.s.request) this.say('cue.ready');
  }

  /** The companion acts one command; its slot glows and its trace dot lights. */
  private async perform(at: number, cue: Cue) {
    const run = this.runId;
    const tw = this.ctx.tw;
    this.running = at;
    this.lit = at + 1;
    this.draw();
    this.star.setMood('happy', 2);
    if (cue === 'W') {
      sfx.chirp(10);
      await tw.to(this.mitten, this.frame.wave, { duration: 0.3, ease: ease.inOutSine });
      if (this.dead || run !== this.runId) return;
      sfx.chirp(12);
      await tw.wait(0.25);
      if (this.dead || run !== this.runId) return;
      await tw.to(this.mitten, this.frame.rest.right, { duration: 0.3, ease: ease.inOutSine });
    } else {
      sfx.whoosh();
      this.star.spin();
      await tw.wait(1);
    }
    if (this.dead || run !== this.runId) return;
    await tw.wait(0.2);
    if (this.dead || run !== this.runId) return;
    this.running = -1;
    this.draw();
  }

  /** Show me: an offered Wave for an empty slot, a played show, or a pointer to Finish. */
  async help() {
    const run = this.runId;
    if (this.busy || this.finished) return this.nudge(this.hintButton);
    const result = help(this.s);
    if (result.kind === 'clue' || result.kind === 'repair') {
      this.draw();
      this.pulse(this.slots[result.at]);
      this.pulse(this.requests[result.at]);
      this.say(result.at === 0 ? 'cue.fix-first' : 'cue.fix-second');
      if (result.kind === 'repair') {
        this.lit = 0;
        this.busy = true;
        await this.perform(result.at, result.cue);
        if (this.dead || run !== this.runId) return;
        this.lit = 0;
        this.busy = false;
        this.draw();
      }
      return;
    }
    if (result.kind === 'check') {
      this.pulse(this.finishButton);
      this.say('cue.help-check');
      return;
    }
    if (result.kind === 'insert') {
      this.lit = 0;
      this.pulse(this.cards.W);
      sfx.pop(7);
      this.draw();
      this.pulse(this.slots[result.at]);
      this.say('cue.help-wave');
      return;
    }
    if (result.kind === 'finish') {
      this.pulse(this.finishButton);
      this.say('cue.help-finish');
      return;
    }
    this.pulse(this.playButton);
    this.busy = true;
    await this.ctx.say('cue.help-play');
    if (this.dead || run !== this.runId) return;
    this.busy = false;
    await this.play();
  }

  /** Finish: only a show that has played through as it stands. */
  async finish() {
    if (this.busy || this.finished) return this.nudge(this.finishButton);
    if (!isComplete(this.s.program)) return this.showEmpty();
    if (!canFinish(this.s)) {
      this.pulse(this.playButton);
      this.say('cue.watch');
      return;
    }
    this.finished = true;
    this.busy = true;
    this.star.cheer();
    sfx.tada();
    await this.ctx.say('cue.done');
    if (this.dead) return;
    await this.ctx.tw.wait(0.3);
    if (this.dead) return;
    // Only deliberate wrong Checks count misses; supplied help still counts.
    this.ctx.finish({ misses: this.s.misses, hints: this.s.hints });
  }

  restart() {
    if (this.finished) return;
    this.runId++;
    this.ctx.tw.kill(this.mitten);
    this.mitten.position.copyFrom(this.frame.rest.right);
    this.star.update(1); // settle a turn interrupted by Start again
    this.running = -1;
    this.busy = false;
    restart(this.s);
    this.watchedInitial = false;
    this.lit = 0;
    this.draw();
  }

  /** The ghost finger: the definition's clean demonstration, from the state. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished) return null;
    const press = this.s.request && this.watchedInitial && mismatch(this.s) >= 0
      ? (this.s.selected === mismatch(this.s) ? { action: this.s.request[mismatch(this.s)] } : { slot: mismatch(this.s) })
      : demoNext(this.s, this.changed);
    if (press === 'play') return { tap: { on: this.playButton } };
    if (press === 'check') return { tap: { on: this.finishButton } };
    if (press === 'finish') return { tap: { on: this.finishButton } };
    if ('slot' in press) return { tap: { on: this.slots[press.slot] }, pause: 0.8 };
    return { tap: { on: this.cards[press.action] } };
  }

  destroy() {
    this.dead = true;
  }
}

class CueIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const tileAt = (cue: Cue, x: number) => {
      const t = finishArt({ w: 96, h: 96, corner: 20 }, swatch[CUE_COLOR[cue]]);
      t.position.set(x, -70);
      const i = cueIcon(cue);
      i.position.set(x, -70);
      c.addChild(t, i);
    };
    tileAt('W', -56);
    tileAt('T', 56);
    const play = finishArt({ radius: 34 }, swatch.green);
    play.position.set(0, -150);
    const p = playIcon();
    p.scale.set(0.6);
    p.position.set(3, -150);
    c.addChild(play, p);
    super(c);
  }
}

function sticker(seed: number): Container {
  const { cue, color } = stickerRecipe(new Rng(seed));
  const c = new Container();
  const sw = swatch[RAINBOW[color]];
  c.addChild(finishArt({ w: 150, h: 150, corner: 30 }, sw));
  const icon = cueIcon(cue);
  icon.scale.set(icon.scale.x * 1.5);
  c.addChild(icon);
  return c;
}

export const cueStudio: GameModule = {
  id: 'cue-studio',
  name: 'Cue Studio',
  titleLine: 'game.cue-studio',
  region: 'tinker-lab',
  skills: ['following a sequence of instructions', 'choosing a command', 'order', 'changing a plan'],
  bands: ['prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.quiet,
  coplayHint: 'Ask {name} what the pet will do before pressing Play, then watch together. Take turns choosing a move.',
  offScreen: 'Take turns giving each other a two-move show to act out: "wave, then turn around". Then swap the order.',
  hubIcon: () => new CueIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new CueStudio(ctx),
};
