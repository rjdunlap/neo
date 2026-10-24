import { Container, Graphics } from 'pixi.js';
import { cream, ink, swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { idle, type CouchControls } from '../../engine/controller';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule } from '../types';
import { COURSES, courseMinimum, isTypingCourse } from './course';
import { describeTypingLevel, keyName, roundBubbles, typingLevel, Typist } from './logic';

export const LEVELS: BandLevels = { school: { min: 1, max: 3 } };
const INSTRUCTION = ['pt.one', 'pt.one', 'pt.name', 'pt.word'] as const;

/** A big soap bubble with a shine, centred on its origin. */
function bubbleArt(r: number): Graphics {
  return new Graphics()
    .circle(0, 0, r).fill({ color: 0xe8f7ff, alpha: 0.85 }).stroke({ width: 6, color: swatch.blue.line, alpha: 0.7 })
    .ellipse(-r * 0.42, -r * 0.45, r * 0.22, r * 0.12).fill({ color: 0xffffff, alpha: 0.9 });
}

/** A keyboard key cap, centred on its origin. */
function keyCap(text: string, w: number, h: number, glow: boolean): Container {
  const c = new Container();
  const g = new Graphics();
  if (glow) g.roundRect(-w / 2 - 10, -h / 2 - 10, w + 20, h + 20, 22).fill({ color: swatch.yellow.light, alpha: 0.9 });
  g.roundRect(-w / 2, -h / 2 + 6, w, h, 16).fill(0x9aa3b5).roundRect(-w / 2, -h / 2, w, h, 16).fill(cream).stroke({ width: 4, color: 0x9aa3b5 });
  const t = label(text, Math.min(54, h * 0.55), ink); t.anchor.set(0.5);
  c.addChild(g, t);
  return c;
}

class PondTyping implements Game {
  /** The couch's demonstration waits for this. */
  finished = false;
  private typist!: Typist;
  private readonly level: number;
  private readonly ponds: (readonly string[])[];
  private pond = 0;
  /** Course numbers: keys pressed on each finished pond, and those carried into the one being resumed. */
  private readonly done: number[] = [];
  private carry = 0;
  private assisted = false;
  private misses = 0;
  private hints = 0;
  private firstTry = 0;
  private busy = true;
  private clock = 0;
  private botWait = 1.2;
  private botSlipped = false;
  private readonly water = new Graphics();
  private readonly bubble = new Container();
  private readonly chars = new Container();
  private readonly cap = new Container();
  private radius = 150;

  constructor(private readonly ctx: GameContext) {
    this.level = typingLevel(ctx.level);
    const run = ctx.couch?.course;
    if (run && isTypingCourse(run.id)) {
      this.ponds = COURSES[run.id].ponds.map((p) => p.slice());
      this.pond = Math.min(run.resume.board, this.ponds.length - 1);
      this.done = run.resume.done.slice();
      this.carry = run.resume.attempts;
      this.assisted = run.resume.assisted;
    } else {
      const bubbles = roundBubbles(this.level, ctx.rng, ctx.childName);
      this.ponds = [ctx.demo ? bubbles.slice(0, 3) : bubbles];
    }
    for (const part of [this.water, this.bubble, this.chars, this.cap]) part.eventMode = 'none';
    this.bubble.addChild(bubbleArt(this.radius), this.chars);
    ctx.stage.addChild(this.water, this.bubble, this.cap);
    this.typist = new Typist(this.ponds[this.pond]);
  }

  /** A course's ponds change what is typed, so the instruction follows the pond, not the level. */
  private instruction() {
    if (!this.ctx.couch?.course) return INSTRUCTION[this.level];
    return this.ponds[this.pond].every((b) => b.length === 1) ? 'pt.one' : 'pt.word';
  }

  start() {
    void this.ctx.instruct(this.instruction());
    this.busy = false;
    this.draw();
  }

  resize(view: View) {
    const { w, h } = view;
    const portrait = h > w;
    this.water.clear().rect(0, 0, w, h).fill(0xcdeefa).rect(0, h * 0.42, w, h * 0.58).fill(0x8fd3e8);
    for (const [fx, fy, r] of [[0.18, 0.8, 70], [0.84, 0.74, 56], [0.7, 0.9, 44]] as const) {
      this.water.ellipse(w * fx, h * fy, r, r * 0.45).fill(swatch.green.fill).stroke({ width: 3, color: swatch.green.line });
    }
    this.bubble.position.set(w / 2, portrait ? h * 0.32 : h * 0.4);
    this.cap.position.set(w / 2, portrait ? h * 0.72 : h * 0.83);
  }

  /** The bubble's text, typed part green, the next character underlined; and the key cap for the next character. */
  private draw() {
    for (const c of this.chars.removeChildren()) c.destroy();
    for (const c of this.cap.removeChildren()) c.destroy({ children: true });
    const text = this.typist.text;
    if (!text) return;
    // The longest phrase still fits inside the bubble.
    const size = text.length === 1 ? 150 : Math.min(76, (this.radius * 1.8) / (text.length * 0.66));
    const step = size * 0.66;
    const x0 = -((text.length - 1) * step) / 2;
    [...text].forEach((ch, i) => {
      const x = x0 + i * step;
      if (ch === ' ') {
        const bar = new Graphics().roundRect(x - step * 0.4, size * 0.12, step * 0.8, size * 0.16, 6).fill(i === this.typist.at ? swatch.orange.fill : 0x9aa3b5);
        this.chars.addChild(bar);
        return;
      }
      const t = label(ch, size, i < this.typist.at ? swatch.green.line : ink); t.anchor.set(0.5); t.x = x;
      this.chars.addChild(t);
      if (i === this.typist.at && text.length > 1) this.chars.addChild(new Graphics().roundRect(x - step * 0.4, size * 0.44, step * 0.8, 8, 4).fill(swatch.orange.fill));
    });
    const wanted = this.typist.wanted;
    const space = wanted === ' ';
    this.cap.addChild(keyCap(space ? 'space' : wanted.toUpperCase(), space ? 360 : 120, 120, this.typist.glowing));
  }

  control(input: CouchControls) {
    if (this.busy || this.finished) return;
    for (const key of input.typed ?? []) {
      if (this.busy || this.finished) break;
      this.press(key);
    }
  }

  private press(key: string) {
    const r = this.typist.press(key);
    if (r.kind === 'ignored') return;
    if (r.kind === 'wrong') {
      sfx.boing();
      void this.ctx.tw.to(this.bubble, { rotation: 0.08 }, { duration: 0.06 }).then(() => this.ctx.tw.to(this.bubble, { rotation: -0.06 }, { duration: 0.08 })).then(() => this.ctx.tw.to(this.bubble, { rotation: 0 }, { duration: 0.06 }));
      if (r.why === 'wantSpace') void this.ctx.say('pt.spacewant');
      else if (r.why === 'space') void this.ctx.say('pt.space', { wanted: keyName(r.wanted) });
      else void this.ctx.say('pt.that', { pressed: keyName(r.pressed), wanted: keyName(r.wanted) });
      if (r.glow) this.helped();
      this.draw(); this.report();
      return;
    }
    sfx.pop(3 + (this.typist.presses % 5));
    if (!r.bubbleDone) { this.draw(); this.report(); return; }
    void this.popped(r.roundDone);
  }

  private helped() {
    this.assisted = true;
    this.report();
  }

  private async popped(roundDone: boolean) {
    this.busy = true;
    const word = this.typist.bubbles[this.typist.bubble - 1];
    const { x, y } = this.bubble.position;
    this.ctx.particles.burst(x, y, { kind: 'star', colors: [0xffffff, swatch.blue.light, swatch.pink.light], count: 16, speed: [140, 320], gravity: 0, life: [0.4, 0.8] });
    await this.ctx.tw.to(this.bubble.scale, { x: 1.2, y: 1.2 }, { duration: 0.1 });
    this.bubble.alpha = 0;
    if (word.length > 1) await this.ctx.say('pt.said', { word });
    this.bubble.scale.set(0.3);
    if (roundDone) { await this.pondDone(); return; }
    this.draw();
    this.bubble.alpha = 1;
    await this.ctx.tw.to(this.bubble.scale, { x: 1, y: 1 }, { duration: 0.25 });
    this.busy = false;
    this.report();
  }

  private async pondDone() {
    const t = this.typist;
    this.misses += t.misses; this.hints = Math.max(this.hints, t.hints); this.firstTry += t.firstTry;
    if (this.ctx.couch?.course) { this.done.push(this.carry + t.presses); this.carry = 0; }
    this.ctx.pet.cheer();
    sfx.sparkle();
    if (this.level === 2 && !this.ctx.couch?.course) await this.ctx.say('pt.said', { word: t.bubbles.join('') });
    if (this.pond + 1 < this.ponds.length) {
      this.pond += 1;
      this.report(true);
      this.typist = new Typist(this.ponds[this.pond]);
      void this.ctx.instruct(this.instruction());
      this.draw();
      this.bubble.alpha = 1;
      await this.ctx.tw.to(this.bubble.scale, { x: 1, y: 1 }, { duration: 0.25 });
      this.busy = false;
      return;
    }
    this.finished = true;
    this.report(true);
    sfx.tada();
    await this.ctx.say('pt.done');
    this.ctx.finish({ misses: this.misses, hints: this.hints, score: this.firstTry });
  }

  /** Hand a course's numbers to the shell: after every key, so a reload loses none. */
  private report(between = false) {
    const run = this.ctx.couch?.course;
    if (!run || !isTypingCourse(run.id)) return;
    run.progress({
      board: this.pond, boards: this.ponds.length, done: this.done.slice(),
      attempts: between ? 0 : this.carry + this.typist.presses,
      par: this.ponds[this.pond].join('').length, minimum: courseMinimum(run.id), assisted: this.assisted,
    });
  }

  askForHint() {
    if (this.finished || this.typist.done) return;
    this.typist.showHint();
    this.helped();
    this.draw();
  }

  restart() {
    // Every bubble already popped stays popped: there is nothing on a pond to put back except the bubble in play.
    if (this.finished || this.typist.done) return;
    this.typist.at = 0;
    this.draw();
  }

  /** The demonstration types the key the bubble shows; once a round it slips on one key, so the free first miss shows. */
  autoplay(dt: number): CouchControls {
    const out = idle();
    if (this.busy || this.finished) return out;
    this.botWait -= dt;
    if (this.botWait > 0) return out;
    this.botWait = 0.45;
    const wanted = this.typist.wanted;
    if (!this.botSlipped && this.typist.bubble === 1 && this.typist.at === 0) {
      this.botSlipped = true;
      out.typed = [wanted === 'q' ? 'p' : 'q'];
      return out;
    }
    out.typed = [wanted];
    return out;
  }

  update(dt: number) {
    this.clock += dt;
    if (!this.busy) this.bubble.y += Math.sin(this.clock * 2) * 0.25;
    const glow = this.cap.children[0];
    if (glow && this.typist.glowing) glow.alpha = 0.75 + 0.25 * Math.sin(this.clock * 6);
  }

  destroy() {}
}

function pondTypingArt(): Container {
  const c = new Container();
  const b = bubbleArt(70); b.position.set(-20, -40);
  const k = keyCap('A', 80, 80, false); k.position.set(40, 40);
  c.addChild(b, k);
  return c;
}

export const pondTyping: GameModule = {
  id: 'pond-typing', name: 'Pond Typing', titleLine: 'game.pond-typing', region: 'story-grove',
  skills: ['letters'], bands: ['school'], levels: (b) => rangeFor(LEVELS, b),
  describeLevel: describeTypingLevel,
  inputs: ['controller'], typing: true,
  music: STYLES.quiet,
  offScreen: 'On a real keyboard, take turns: one says a letter, the other finds the key and presses it.',
  hubIcon: () => new WigglyIcon(pondTypingArt()), sticker: () => pondTypingArt(), create: (ctx) => new PondTyping(ctx),
};
