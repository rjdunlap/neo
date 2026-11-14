import { Circle, Container, Graphics, Rectangle } from 'pixi.js';
import { Critter } from '../../art/critter';
import { cream, ink, swatch, type ColorName } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { puffs } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import { spread, type View } from '../../engine/view';
import type { LineId } from '../../content/voice-script';
import { label } from '../../ui/text';
import { letterPicture } from '../../art/letter-pictures';
import { wordPicture } from './pictures';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  BIG_LEVEL,
  LEVELS,
  bigLetters,
  fits,
  FIRST_WORDS,
  makeQuestions,
  nextMonster,
  planFor,
  sounded,
  SOUNDS,
  type PictureWord,
  type MonsterPlan,
  type Question,
} from './logic';
import { rangeFor } from '../../progress/difficulty';

const FURS: ColorName[] = ['purple', 'teal', 'orange', 'pink', 'blue', 'green', 'red', 'yellow'];
const BODY_R = 62;
/** Level 9's one big monster, about 300 units across its fur. */
const BIG_SCALE = 2.3;
/** Level 9's kept pictures, small along the top. */
const SHELF_SCALE = 0.3;

const soundLine = (letter: string) => `sound.${letter}` as LineId;

/** A round furry monster wearing its letter on its tummy. */
class Monster extends Container {
  readonly body = new Container();
  readonly glow = new Graphics();
  private readonly mouth = new Graphics();
  private clock = Math.random() * 6;
  private talk = 0;
  drag: DragHandle | null = null;
  placed = false;
  slot = -1;

  constructor(
    readonly letter: string,
    both: boolean,
    color: ColorName = FURS[letter.charCodeAt(0) % FURS.length],
  ) {
    super();
    const fur = swatch[color];
    const tufts: [number, number, number][] = [[0, 0, BODY_R]];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      tufts.push([Math.cos(a) * BODY_R * 0.82, Math.sin(a) * BODY_R * 0.82, BODY_R * 0.3]);
    }
    const g = puffs(new Graphics(), tufts, fur.fill, fur.line, 6);
    for (const side of [-1, 1]) g.ellipse(side * 26, BODY_R + 4, 16, 9).fill(fur.line);
    g.circle(0, 12, 40).fill(cream);
    for (const side of [-1, 1]) {
      g.circle(side * 22, -42, 15)
        .fill(0xffffff)
        .stroke({ width: 3, color: fur.line });
      g.circle(side * 22 + 3, -40, 7).fill(ink);
    }
    const text = label(both ? letter.toUpperCase() + letter : letter, both ? 46 : 62, ink);
    text.position.set(0, 10);
    this.glow.circle(0, 0, BODY_R + 26).fill({ color: 0xfff3a0, alpha: 0.85 });
    this.glow.visible = false;
    this.body.addChild(g, this.mouth, text);
    this.addChild(this.glow, this.body);
    this.hitArea = new Circle(0, 0, BODY_R + 24);
    this.drawMouth();
  }

  speak() {
    this.talk = 0.6;
    this.body.scale.set(1.12, 0.9);
  }

  update(dt: number) {
    this.clock += dt;
    this.talk = Math.max(0, this.talk - dt);
    const k = Math.min(1, dt * 10);
    this.body.scale.x += (1 - this.body.scale.x) * k;
    this.body.scale.y += (1 - this.body.scale.y) * k;
    this.body.rotation =
      0.05 * Math.sin(this.clock * 2) + (this.talk > 0 ? 0.12 * Math.sin(this.clock * 30) : 0);
    if (this.glow.visible) this.glow.alpha = 0.6 + 0.4 * Math.sin(this.clock * 7);
    this.drawMouth();
  }

  private drawMouth() {
    const m = this.mouth.clear();
    if (this.talk > 0) m.ellipse(0, -18, 12, 8 + 5 * Math.abs(Math.sin(this.clock * 18))).fill(0x7a2e3e);
    else m.moveTo(-10, -20).quadraticCurveTo(0, -12, 10, -20).stroke({ width: 4, color: ink, cap: 'round' });
  }
}

class WordMonsters implements Game {
  readonly plan: MonsterPlan;
  readonly questions: Question[];
  monsters: Monster[] = [];
  index = -1;
  filled = 0;
  taps = 0;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;

  private readonly backdrop: Backdrop;
  private readonly top = new Container();
  private readonly slots = new Graphics();
  private readonly slotLetters = new Container();
  private readonly crowd = new Container();
  private picture: Container | null = null;
  private view: View;
  private wrongs = 0;
  /** The next question's ask, waiting behind the right monster's sound (U7 R4); `askGen` drops a stale wait. */
  private unasked: Question | null = null;
  private askGen = 0;
  /** Level 9: the monsters who wake, one per touch, and the pictures they leave on the shelf. */
  private bigQueue: string[] = [];
  private readonly shelf = new Container();
  private flying: Container | null = null;
  private destroyed = false;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.questions = makeQuestions(this.plan, ctx.rng);
    this.backdrop = new Backdrop(
      { sky: [0xc9b8f0, 0xf3ecff], hills: [0xc8ecb0, 0xa6de8e], horizon: 0.66, clouds: 3, seed: 26 },
      ctx.view,
    );
    this.top.addChild(this.slots, this.slotLetters);
    ctx.stage.addChild(this.backdrop, this.top, this.crowd, this.shelf);
    if (this.plan.big) {
      this.bigQueue = bigLetters(ctx.rng, this.plan.rounds);
      // The whole screen wakes the monster: any touch makes it say its sound.
      onTap(
        this.crowd,
        () => {
          if (this.finished) return;
          const m = this.monsters[0];
          // Between monsters a touch still answers: the one on screen wiggles.
          if (this.busy || !m) return void m?.speak();
          void this.bigTouch(m);
        },
        { cooldown: 300 },
      );
    }
  }

  get question(): Question | undefined {
    return this.questions[this.index];
  }

  private get building() {
    return (
      this.plan.mode === 'build' ||
      this.plan.mode === 'spell' ||
      this.plan.mode === 'family' ||
      this.plan.mode === 'end'
    );
  }

  start() {
    if (this.plan.big) {
      this.wakeBig();
      this.busy = false;
      void this.ctx.instruct('monster.big');
      return;
    }
    if (this.plan.mode === 'play') {
      this.setMonsters(this.questions[0].monsters, true);
      this.busy = false;
      void this.ctx.instruct('monster.play');
      return;
    }
    void this.next();
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    this.top.position.set(v.w / 2, v.h * 0.3);
    if (this.plan.big) this.crowd.hitArea = new Rectangle(0, 0, v.w, v.h);
    this.layoutMonsters();
    this.layoutShelf();
  }

  /** Level 9: where the big monster stands. */
  private bigSpot() {
    return { x: this.view.w / 2, y: this.view.h * 0.62 };
  }

  /** Level 9: where the `i`th kept picture sits along the top, clear of the corners. */
  private shelfSpot(i: number) {
    const v = this.view;
    const xs = spread(this.plan.rounds, 150, v.w - 150, 110);
    return { x: xs[i], y: Math.max(90, v.h * 0.14) };
  }

  /** Level 9: a kept picture's scale, smaller when the shelf is narrow so six never overlap (a picture is about 220 wide). */
  private shelfScale() {
    const xs = spread(this.plan.rounds, 150, this.view.w - 150, 110);
    return Math.min(SHELF_SCALE, ((xs[1] ?? 0) - xs[0] || 110) / 260);
  }

  private layoutShelf() {
    const k = this.shelfScale();
    this.shelf.children.forEach((p, i) => {
      // A picture still flying up is left to its tween.
      if (p === this.flying) return;
      p.position.copyFrom(this.shelfSpot(i));
      p.scale.set(k);
    });
  }

  private layoutMonsters() {
    const v = this.view;
    if (this.plan.big) {
      // Only the monster on screen is kept here; the one stepping away has already left the list.
      for (const m of this.monsters) m.position.copyFrom(this.bigSpot());
      return;
    }
    for (const m of this.monsters) if (m.placed) m.position.copyFrom(this.slotAt(m.slot));
    const loose = this.monsters.filter((m) => !m.placed);
    const xs = spread(loose.length, 150, v.w - 40, 190);
    loose.forEach((m, i) => {
      m.position.set(xs[i], v.h - 130 + (i % 2 ? 18 : -10));
      if (m.drag) m.drag.home = { x: m.x, y: m.y };
    });
  }

  update() {}

  /**
   * The ghost finger on the how-to card: tap each monster in turn to hear them, tap the one that is the answer, or carry the
   * letter that comes next to the first empty slot.
   */
  autotouch(): TouchIntent | null {
    // Free play never starts a question, so its monsters belong to the first.
    // Level 9: the ghost finger touches the grass beside the big monster, since anywhere wakes it.
    if (this.plan.big)
      return this.busy || this.finished || !this.monsters[0]
        ? null
        : {
            tap: { on: this.crowd, x: this.view.w * 0.18, y: this.view.h * 0.9 },
            receiver: this.crowd,
          };
    const q = this.question ?? (this.plan.mode === 'play' ? this.questions[0] : undefined);
    if (this.busy || this.finished || this.unasked || !q) return null;
    const m = nextMonster(
      this.plan,
      q,
      this.monsters.filter((x) => !x.destroyed),
      this.filled,
      this.taps,
    );
    if (!m) return null;
    if (!this.building) return { tap: { on: m } };
    const slot = this.slotAt(this.filled);
    return m.drag && !m.drag.dragging
      ? { drag: { on: m }, to: { on: this.crowd, x: slot.x, y: slot.y } }
      : null;
  }

  destroy() {
    this.destroyed = true;
    for (const m of this.monsters) m.drag?.destroy();
  }

  // Level 9: one big monster ---------------------------------------------------------------

  /** The next big monster pops up in the middle, wiggling awake, because she touched. */
  private wakeBig() {
    const letter = this.bigQueue[this.taps];
    const woke = this.taps;
    if (!letter) return;
    const m = new Monster(letter, true, FURS[(this.taps * 3) % FURS.length]);
    m.eventMode = 'none';
    this.ctx.track(m);
    this.crowd.addChild(m);
    this.monsters = [m];
    m.position.copyFrom(this.bigSpot());
    m.scale.set(0);
    void this.ctx.tw
      .to(m.scale, { x: BIG_SCALE, y: BIG_SCALE }, { duration: 0.4, ease: ease.outBack })
      .then(() => {
        // A monster already touched has wiggled; only an untouched one wiggles awake.
        if (!m.destroyed && this.taps === woke) m.speak();
      });
  }

  /**
   * A touch anywhere: the big monster says its sound and its first-word picture pops out above it, then settles on the
   * shelf along the top and stays; the monster steps away and the next one wakes. The sound never holds the next
   * monster; the last is heard out before the finish.
   */
  private async bigTouch(m: Monster) {
    this.busy = true;
    this.taps++;
    m.speak();
    sfx.pop(4 + (m.letter.charCodeAt(0) % 6));
    const said = this.ctx.say(soundLine(m.letter));
    const p = letterPicture(m.letter.toUpperCase());
    const from = this.bigSpot();
    // Above the monster's head, but never above the shelf on a short view.
    p.position.set(from.x, Math.max(this.shelfSpot(0).y + 110, from.y - BODY_R * BIG_SCALE - 120));
    this.flying = p;
    p.scale.set(0);
    this.shelf.addChild(p);
    const to = this.shelfSpot(this.shelf.children.length - 1);
    await this.ctx.tw.to(p.scale, { x: 0.5, y: 0.5 }, { duration: 0.35, ease: ease.outBack });
    await this.ctx.tw.wait(0.25);
    if (this.destroyed) return;
    sfx.whoosh();
    const k = this.shelfScale();
    void this.ctx.tw.to(p.scale, { x: k, y: k }, { duration: 0.4 });
    await this.ctx.tw.to(p, { x: to.x, y: to.y }, { duration: 0.4, ease: ease.inOutSine });
    if (this.destroyed) return;
    this.flying = null;
    this.layoutShelf();
    // The monster that spoke steps out to the side; the next wakes because she touched.
    const side = this.taps % 2 ? 1 : -1;
    void this.ctx.tw
      .to(m, { x: m.x + side * (this.view.w / 2 + 260) }, { duration: 0.35, ease: ease.inQuad })
      .then(() => {
        this.ctx.untrack(m);
        m.destroy({ children: true });
      });
    if (this.taps >= this.plan.rounds) {
      this.monsters = [];
      await said;
      if (!this.destroyed) void this.end();
      return;
    }
    this.wakeBig();
    await this.ctx.tw.wait(0.4);
    if (this.destroyed || this.finished) return;
    this.busy = false;
  }

  private setMonsters(letters: string[], both: boolean) {
    for (const m of this.monsters) {
      m.drag?.destroy();
      this.ctx.untrack(m);
      m.destroy({ children: true });
    }
    // Neighbors always wear different colors, so color never gives away (or confuses) a letter.
    const shift = this.ctx.rng.int(0, FURS.length - 1);
    this.monsters = letters.map((letter, i) => {
      const m = new Monster(letter, both, FURS[(i + shift) % FURS.length]);
      this.ctx.track(m);
      this.crowd.addChild(m);
      if (this.building) {
        m.drag = draggable(m, this.ctx.tw, {
          onPick: () => this.pick(m),
          onDrop: (x, y) => this.drop(m, x, y),
        });
      } else {
        onTap(m, () => void this.tap(m), { cooldown: 400 });
      }
      return m;
    });
    this.layoutMonsters();
    this.monsters.forEach((m, i) => {
      m.scale.set(0);
      void this.ctx.tw.to(m.scale, { x: 1, y: 1 }, { duration: 0.35, delay: i * 0.08, ease: ease.outBack });
    });
  }

  private showPicture(p: Container | null, scale = 0.62, y = -10) {
    if (this.picture) {
      const old = this.picture;
      void this.ctx.tw
        .to(old.scale, { x: 0, y: 0 }, { duration: 0.2 })
        .then(() => old.destroy({ children: true }));
    }
    this.picture = p;
    if (!p) return;
    p.y = y;
    p.scale.set(0);
    this.top.addChild(p);
    void this.ctx.tw.to(p.scale, { x: scale, y: scale }, { duration: 0.4, ease: ease.outBack });
  }

  // Questions ----------------------------------------------------------------------------

  private async next(said?: Promise<unknown>) {
    this.busy = true;
    this.index++;
    this.wrongs = 0;
    this.filled = 0;
    const q = this.question;
    if (!q) return void this.end();
    this.slots.clear();
    this.slotLetters.removeChildren().forEach((c) => c.destroy());
    if (this.building) {
      this.showPicture(wordPicture(q.answer as PictureWord), 0.5, -110);
      this.drawSlots(q.answer);
    } else if (this.plan.mode === 'first') {
      this.showPicture(letterPicture(q.answer.toUpperCase()), 0.62);
    } else if (this.plan.mode === 'last' && q.word) {
      // Larger than a building level's picture: there are no slots below it, and it is a thing to tap.
      this.showPicture(this.sayingPicture(q.word), 0.9);
    } else {
      this.showPicture(null);
    }
    this.setMonsters(q.monsters, this.plan.mode === 'find');
    if (q.fixed) {
      if (this.plan.mode === 'end') this.placeBeginning(q.fixed);
      else this.placeEnding(q.fixed);
    }
    if (this.plan.mode === 'end') this.filled = 2;
    await this.ctx.tw.wait(0.4);
    this.busy = false;
    if (!said) return void (await this.ask(q));
    // The ask waits for the last sound, or is said at her first tap or by the guide.
    this.unasked = q;
    const gen = ++this.askGen;
    void said.then(() => {
      if (gen === this.askGen) this.askNow();
    });
  }

  /** Level 10: the word's picture, which says the word again when tapped (free: never a miss or a hint). */
  private sayingPicture(word: PictureWord) {
    const p = wordPicture(word);
    // A generous square around the drawing (about 190 units across at its shown scale), so a near miss still counts.
    p.hitArea = new Rectangle(-150, -150, 300, 300);
    onTap(
      p,
      () => {
        if (this.finished || this.picture !== p) return;
        // Before the ask is heard, the tap asks it, which says the word too.
        if (this.askNow()) return;
        for (const c of p.children) if (c instanceof Critter) c.cheer();
        void this.ctx.say('monster.blend', { word });
      },
      { cooldown: 600 },
    );
    return p;
  }

  /** Says the waiting ask, if there is one. */
  private askNow() {
    const q = this.unasked;
    if (!q || this.finished) return false;
    this.unasked = null;
    this.askGen++;
    void this.ask(q);
    return true;
  }

  /** The guide was tapped while the next ask waits: say it, not the ask before it. */
  sayWaitingAsk() {
    return this.askNow();
  }

  /** Word families: the ending's monsters already stand in the last slots. */
  private placeEnding(ending: string) {
    ending.split('').forEach((letter, i) => {
      const m = new Monster(letter, false, FURS[(i + 3) % FURS.length]);
      m.placed = true;
      m.slot = i + 1;
      m.position.copyFrom(this.slotAt(i + 1));
      this.ctx.track(m);
      this.crowd.addChild(m);
      this.monsters.push(m);
    });
  }

  /** Level 8 keeps the first two letters in the slots and changes the last sound. */
  private placeBeginning(beginning: string) {
    beginning.split('').forEach((letter, i) => {
      const m = new Monster(letter, false, FURS[(i + 3) % FURS.length]);
      m.placed = true;
      m.slot = i;
      m.position.copyFrom(this.slotAt(i));
      this.ctx.track(m);
      this.crowd.addChild(m);
      this.monsters.push(m);
    });
  }

  private ask(q: Question) {
    const sound = SOUNDS[q.answer];
    if (this.plan.mode === 'family')
      return this.ctx.instruct('monster.family', { word: q.answer, sound: SOUNDS[q.answer[0]] });
    if (this.plan.mode === 'end')
      return this.ctx.instruct('monster.end', {
        word: q.answer,
        first: SOUNDS[q.answer[0]],
        second: SOUNDS[q.answer[1]],
        sound: SOUNDS[q.answer[2]],
      });
    switch (this.plan.mode) {
      case 'find':
        return this.ctx.instruct('monster.find', { letter: q.answer.toUpperCase() });
      case 'who':
        return this.ctx.instruct('monster.who', { sound });
      case 'first':
        return this.ctx.instruct('monster.first', { word: FIRST_WORDS[q.answer], sound });
      case 'last':
        return this.ctx.instruct('monster.last', { word: q.word ?? '' });
      default:
        return this.ctx.instruct('monster.build', { word: q.answer, sounds: sounded(q.answer) });
    }
  }

  private async tap(m: Monster) {
    if (this.busy || this.finished) return;
    m.speak();
    sfx.pop(4 + (m.letter.charCodeAt(0) % 6));
    if (this.plan.mode === 'play') {
      this.taps++;
      this.showPicture(FIRST_WORDS[m.letter] ? letterPicture(m.letter.toUpperCase()) : null, 0.55);
      await this.ctx.say(soundLine(m.letter));
      if (this.taps >= this.plan.rounds && !this.finished) void this.end();
      return;
    }
    const q = this.question!;
    const waiting = this.unasked !== null;
    if (m.letter === q.answer) {
      this.unasked = null;
      this.askGen++;
      this.busy = true;
      m.glow.visible = false;
      sfx.sparkle();
      this.ctx.particles.burst(m.x, m.y - 40, {
        kind: 'star',
        colors: [0xffffff, 0xfff3a0],
        count: 14,
        speed: [100, 260],
        gravity: 0,
        life: [0.5, 0.9],
      });
      const said = this.ctx.say(soundLine(m.letter));
      if (this.index + 1 < this.questions.length) {
        // The sound starts and the next question's monsters come at once, its ask waiting for the sound (U7 R4).
        await this.next(said);
        return;
      }
      // The last question's sound and praise are heard out.
      await said;
      await this.ctx.say('praise');
      await this.next();
      return;
    }
    // A tap before she has heard the ask is not a mistake: the ask is said now.
    if (waiting) return void this.askNow();
    this.wrong(m);
  }

  private wrong(m: Monster) {
    this.misses++;
    this.wrongs++;
    sfx.boing();
    void this.ctx.say('monster.iam', { letter: m.letter.toUpperCase(), sound: SOUNDS[m.letter] });
    if (this.wrongs >= 2) this.hint();
  }

  private hint() {
    const q = this.question;
    if (!q) return;
    const want = this.building ? q.answer[this.filled] : q.answer;
    const right = this.monsters.find((x) => !x.placed && x.letter === want);
    if (right && !right.glow.visible) {
      right.glow.visible = true;
      this.hints++;
    }
    this.wrongs = 0;
  }

  // Building words ---------------------------------------------------------------------

  private slotX(i: number) {
    return (i - 1) * 150;
  }

  /** Slot `i`'s middle, in stage units. */
  private slotAt(i: number) {
    return { x: this.top.x + this.slotX(i), y: this.top.y + 106 };
  }

  private drawSlots(word: string) {
    const g = this.slots.clear();
    for (let i = 0; i < word.length; i++) {
      g.roundRect(this.slotX(i) - 66, 40, 132, 132, 26)
        .fill({ color: 0xffffff, alpha: 0.7 })
        .stroke({ width: 5, color: swatch.purple.line });
      if (this.plan.mode === 'build') {
        const t = label(word[i], 70, swatch.purple.light);
        t.position.set(this.slotX(i), 106);
        this.slotLetters.addChild(t);
      }
    }
  }

  private pick(m: Monster) {
    m.speak();
    void this.ctx.say(soundLine(m.letter));
  }

  private drop(m: Monster, x: number, y: number): boolean {
    const q = this.question;
    if (!q || this.busy) return false;
    // The crowd layer sits on the stage untransformed, so (x, y) are stage units.
    const slot = this.slotAt(this.filled);
    // Generous: anywhere over the slot row counts as trying the next slot.
    if (Math.abs(y - slot.y) > 140 || Math.abs(x - this.top.x) > 280) return false;
    if (!fits(q.answer, this.filled, m.letter)) {
      this.misses++;
      this.wrongs++;
      sfx.boing();
      void this.ctx.say('monster.next', { sound: SOUNDS[q.answer[this.filled]] });
      if (this.wrongs >= 2) this.hint();
      return false;
    }
    m.placed = true;
    m.slot = this.filled;
    m.glow.visible = false;
    if (m.drag) m.drag.enabled = false;
    void this.ctx.tw.to(m, { x: slot.x, y: slot.y }, { duration: 0.25, ease: ease.outBack });
    m.scale.set(1);
    sfx.squish();
    // In a word family the ending is already there, so the first sound finishes the word.
    this.filled = q.fixed ? q.answer.length : this.filled + 1;
    if (this.filled >= q.answer.length) void this.wordDone(q);
    return true;
  }

  private async wordDone(q: Question) {
    this.busy = true;
    const placed = q.answer.split('').map((l) => this.monsters.find((m) => m.placed && m.letter === l)!);
    for (const m of placed) {
      m.speak();
      await this.ctx.say(soundLine(m.letter));
    }
    await this.ctx.say('monster.blend', { word: q.answer });
    // The word comes alive.
    const p = this.picture;
    if (p) {
      const s = p.scale.x;
      for (let i = 0; i < 2; i++) {
        await this.ctx.tw.to(p, { y: p.y - 40 }, { duration: 0.18, ease: ease.outQuad });
        await this.ctx.tw.to(p, { y: p.y + 40 }, { duration: 0.18, ease: ease.inQuad });
      }
      p.scale.set(s);
      for (const c of p.children) if (c instanceof Critter) c.cheer();
    }
    sfx.tada();
    this.ctx.particles.burst(this.view.w / 2, this.view.h * 0.3, {
      kind: 'star',
      colors: [0xffffff, 0xfff3a0, swatch.purple.light],
      count: 24,
      speed: [150, 360],
      gravity: 0,
      life: [0.7, 1.1],
    });
    await this.ctx.tw.wait(0.6);
    await this.next();
  }

  private async end() {
    if (this.finished) return;
    this.finished = true;
    this.busy = true;
    this.ctx.pet.cheer();
    await this.ctx.say('monster.done');
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

class MonstersIcon extends WigglyIcon {
  private readonly pair: Monster[];
  constructor() {
    const c = new Container();
    const a = new Monster('a', false);
    const b = new Monster('b', false);
    a.position.set(-60, -80);
    b.position.set(60, -70);
    b.scale.set(0.85);
    c.addChild(a, b);
    super(c);
    this.pair = [a, b];
  }
  update(dt: number) {
    super.update(dt);
    for (const m of this.pair) m.update(dt);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const m = new Monster(rng.pick('abcdefghjkmnoprstuwz'.split('')), false);
  m.y = -10;
  c.addChild(m);
  return c;
}

export const wordMonsters: GameModule = {
  id: 'word-monsters',
  name: 'Word Monsters',
  titleLine: 'game.word-monsters',
  region: 'story-grove',
  challenge: 'words',
  skills: ['letter-sounds', 'phonics', 'vocabulary'],
  bands: ['lap', 'toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  entryLevels: [BIG_LEVEL],
  describeLevel: (level) => planFor(level).name,
  music: STYLES.hub,
  touchDemo: true,
  coplayHint: 'Make each monster\'s sound together, slowly: "mmm", "sss", then blend them into a word.',
  coplayHintLap:
    'Make each monster\'s sound slowly as {name} taps it: "mmm", "sss". Then blend them into a word.',
  offScreen: 'Play I-spy with sounds: "I spy something that starts with sss."',
  hubIcon: () => new MonstersIcon(),
  sticker,
  create: (ctx) => new WordMonsters(ctx),
};
