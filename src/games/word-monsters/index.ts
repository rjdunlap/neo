import { Circle, Container, Ellipse, Graphics, Rectangle } from 'pixi.js';
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
import type { View } from '../../engine/view';
import type { LineId } from '../../content/voice-script';
import { RoundButton } from '../../ui/buttons';
import { HINT_AFTER, hinted } from '../../progress/coach';
import { label } from '../../ui/text';
import { letterPicture } from '../../art/letter-pictures';
import { wordPicture, type WordPicture } from './pictures';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  BIG_LEVEL,
  LEVELS,
  bigLetters,
  fits,
  FIRST_WORDS,
  makeQuestions,
  MINE_LEVEL,
  myLetter,
  nextMonster,
  planFor,
  sounded,
  soundOf,
  SOUNDS,
  unitsOf,
  type MonsterPlan,
  type Question,
  toldLine,
} from './logic';
import { rangeFor } from '../../progress/difficulty';
import {
  BODY_R,
  BUILD_PICTURE,
  CARD,
  cardSpots,
  DROP_REACH,
  FIXED_HIT,
  HIT_R,
  LAST_PICTURE,
  PICTURE_HIT,
  READ_AT,
  READ_R,
  SLOT_DY,
  SLOT_ROW_HIT,
  SLOT_SIZE,
  TEAM_HIT_RX,
  TEAM_STRETCH,
  bigSpot,
  looseSpots,
  shelfScale,
  shelfSpot,
  slotSpot,
  slotX,
  topSpot,
} from './layout';

const FURS: ColorName[] = ['purple', 'teal', 'orange', 'pink', 'blue', 'green', 'red', 'yellow'];
/** Level 9's one big monster, about 300 units across its fur. */
const BIG_SCALE = 2.3;
/** Level 13: a team monster shrinks a little in its box so it stays clear of its neighbors (150 apart). */
const TEAM_SLOT_SCALE = 0.78;

const soundLine = (letter: string) => `sound.${letter}` as LineId;

/** A round furry monster wearing its letter on its tummy; a two-letter team (sh) is one wide monster with both. */
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
    // A team stretches sideways: two body puffs, a ring of tufts around both, a wide tummy.
    const w = letter.length > 1 ? TEAM_STRETCH : 0;
    const tufts: [number, number, number][] = w
      ? [
          [-w, 0, BODY_R],
          [w, 0, BODY_R],
        ]
      : [[0, 0, BODY_R]];
    const ring = w ? 14 : 10;
    for (let i = 0; i < ring; i++) {
      const a = (i / ring) * Math.PI * 2;
      tufts.push([Math.cos(a) * (BODY_R * 0.82 + w), Math.sin(a) * BODY_R * 0.82, BODY_R * 0.3]);
    }
    const g = puffs(new Graphics(), tufts, fur.fill, fur.line, 6);
    for (const side of [-1, 1]) g.ellipse(side * (26 + w), BODY_R + 4, 16, 9).fill(fur.line);
    if (w) g.ellipse(0, 12, 40 + w, 40).fill(cream);
    else g.circle(0, 12, 40).fill(cream);
    for (const side of [-1, 1]) {
      g.circle(side * (22 + w / 2), -42, 15)
        .fill(0xffffff)
        .stroke({ width: 3, color: fur.line });
      g.circle(side * (22 + w / 2) + 3, -40, 7).fill(ink);
    }
    const text = label(both ? letter.toUpperCase() + letter : letter, both ? 46 : 62, ink);
    text.position.set(0, 10);
    this.glow.ellipse(0, 0, BODY_R + 26 + w, BODY_R + 26).fill({ color: 0xfff3a0, alpha: 0.85 });
    this.glow.visible = false;
    this.body.addChild(g, this.mouth, text);
    this.addChild(this.glow, this.body);
    // A team's touch area hugs its wide body (about 200 across), so it never reaches over a narrow-row neighbor's.
    this.hitArea = w ? new Ellipse(0, 0, TEAM_HIT_RX, HIT_R) : new Circle(0, 0, HIT_R);
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

/** Level 16: a picture card, with the glow that marks it after two wrong taps. */
interface BlendCard {
  word: WordPicture;
  box: Container;
  glow: Graphics;
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
  /** Level 11: the question whose sounds the boxes have already said, so repeat taps count one hint per word. */
  private slowHinted: Question | null = null;
  /** Level 11: the boxes are saying their sounds; another tap waits for them to finish. */
  private slowSaying = false;
  private readonly readWord: RoundButton | null = null;
  private checkedCorrectLetter = false;
  /** Level 18: the standing monster currently lifted out of its box, and the slot it came from. */
  private liftedMonster: Monster | null = null;
  private liftedFromSlot = -1;
  /** Level 16: the three picture cards, and whether the monsters are saying their sounds (a card tapped then only wiggles). */
  private cards: BlendCard[] = [];
  private blending = false;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.questions = makeQuestions(this.plan, ctx.rng, ctx.childName);
    this.backdrop = new Backdrop(
      {
        sky: [0xc9b8f0, 0xf3ecff],
        hills: [0xc8ecb0, 0xa6de8e],
        horizon: this.plan.mode === 'repair' || this.plan.mode === 'ladder' ? 0.49 : 0.66,
        clouds: 3,
        seed: 26,
      },
      ctx.view,
    );
    this.top.addChild(this.slots, this.slotLetters);
    if (this.plan.mode === 'slow' || this.plan.mode === 'team') {
      // Levels 11 and 13: tapping the boxes says the word slowly for her, sound by sound.
      onTap(this.slots, () => void this.saySlowly(), { cooldown: 600 });
    }
    if (this.plan.mode === 'repair') {
      const speaker = new Graphics()
        .poly([-23, -9, -12, -9, 1, -22, 1, 22, -12, 9, -23, 9])
        .fill(ink)
        .moveTo(10, -10)
        .quadraticCurveTo(21, 0, 10, 10)
        .moveTo(18, -19)
        .quadraticCurveTo(36, 0, 18, 19)
        .stroke({ color: ink, width: 4, cap: 'round' });
      this.readWord = new RoundButton(speaker, swatch.white, READ_R, () => {
        const repair = this.question?.repair;
        if (!this.busy && repair) void this.ctx.say('monster.blend', { word: repair.word });
      });
      this.top.addChild(this.readWord);
    }
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
      this.plan.mode === 'slow' ||
      this.plan.mode === 'team' ||
      this.plan.mode === 'repair' ||
      this.plan.mode === 'ladder' ||
      this.plan.mode === 'magic' ||
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
    this.top.position.copyFrom(topSpot(v, this.plan));
    this.readWord?.position.copyFrom(READ_AT);
    if (this.plan.big) this.crowd.hitArea = new Rectangle(0, 0, v.w, v.h);
    this.layoutMonsters();
    this.layoutShelf();
  }

  /** Level 9: where the big monster stands. */
  private bigSpot() {
    return bigSpot(this.view);
  }

  /** Level 9: where the `i`th kept picture sits along the top, clear of the corners. */
  private shelfSpot(i: number) {
    return shelfSpot(this.view, this.plan.rounds, i);
  }

  private shelfScale() {
    return shelfScale(this.view, this.plan.rounds);
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
    const spots3 = this.cards.length ? cardSpots(v, this.plan) : [];
    this.cards.forEach((c, i) => c.box.position.copyFrom(spots3[i]));
    const loose = this.monsters
      .filter((m) => !m.placed)
      .sort((a, b) => (a === this.liftedMonster ? 1 : b === this.liftedMonster ? -1 : 0));
    const spots = looseSpots(v, this.plan, loose.length, this.slotCount);
    loose.forEach((m, i) => {
      m.position.copyFrom(spots[i]);
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
    if (this.plan.mode === 'blend') {
      const right = this.cards.find((c) => c.word === q.answer);
      return this.blending || !right ? null : { tap: { on: right.box } };
    }
    const wrong = this.wrongMonster();
    if (wrong) return { tap: { on: wrong } };
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
    this.checkedCorrectLetter = false;
    const q = this.question;
    if (!q) return void this.end();
    this.slots.clear();
    this.slotLetters.removeChildren().forEach((c) => c.destroy());
    if (this.plan.mode === 'slow' || this.plan.mode === 'team' || q.repair || q.ladder) {
      this.showPicture(this.sayingPicture(q.answer as WordPicture), BUILD_PICTURE.scale, BUILD_PICTURE.y);
      this.drawSlots(unitsOf(q).length);
    } else if (this.plan.mode === 'magic') {
      // Level 17: the built word's picture, four boxes (the last one waits for the quiet e).
      this.showPicture(this.sayingPicture(q.fixed as WordPicture), BUILD_PICTURE.scale, BUILD_PICTURE.y);
      this.drawSlots(unitsOf(q).length);
    } else if (this.plan.mode === 'family' || this.plan.mode === 'end') {
      // Told, then asked: after the first question only the word is said, so the picture says it again, free.
      this.showPicture(this.sayingPicture(q.answer as WordPicture), BUILD_PICTURE.scale, BUILD_PICTURE.y);
      this.drawSlots(q.answer.length, q.answer);
    } else if (this.building) {
      this.showPicture(wordPicture(q.answer as WordPicture), BUILD_PICTURE.scale, BUILD_PICTURE.y);
      this.drawSlots(q.answer.length, q.answer);
    } else if (this.plan.mode === 'first') {
      this.showPicture(letterPicture(q.answer.toUpperCase()), 0.62);
    } else if ((this.plan.mode === 'last' || this.plan.mode === 'middle') && q.word) {
      // Larger than a building level's picture: there are no slots below it, and it is a thing to tap.
      this.showPicture(this.sayingPicture(q.word), LAST_PICTURE.scale, LAST_PICTURE.y);
    } else {
      this.showPicture(null);
    }
    if (this.plan.mode === 'blend') this.setBlend(q);
    else this.setMonsters(q.monsters, this.plan.mode === 'find' || this.plan.mode === 'mine');
    if (q.repair) {
      this.filled = q.repair.slot;
      for (const m of this.monsters) {
        if (m.drag) m.drag.enabled = false;
        m.alpha = 0.65;
      }
      this.placeFixed(q.repair.word, 0);
      if (this.readWord) this.readWord.visible = true;
    } else if (q.ladder) {
      this.liftedMonster = null;
      this.liftedFromSlot = -1;
      this.filled = q.ladder.slot;
      this.setCandidatesEnabled(false);
      this.placeFixed(q.ladder.from, 0);
    } else if (q.fixed) {
      this.placeFixed(q.fixed, this.plan.mode === 'end' || this.plan.mode === 'magic' ? 0 : 1);
    }
    if (this.plan.mode === 'end') this.filled = 2;
    if (this.plan.mode === 'magic') this.filled = (q.fixed ?? '').length;
    await this.ctx.tw.wait(0.4);
    this.busy = false;
    if (this.plan.mode === 'blend') {
      await this.ask(q);
      return void (await this.playBlend(q));
    }
    if (!said) return void (await this.ask(q));
    // The ask waits for the last sound, or is said at her first tap or by the guide.
    this.unasked = q;
    const gen = ++this.askGen;
    void said.then(() => {
      if (gen === this.askGen) this.askNow();
    });
  }

  /** From level 10: the word's picture, which says the word again when tapped (free: never a miss or a hint). */
  private sayingPicture(word: WordPicture) {
    const p = wordPicture(word);
    // A generous square around the drawing (about 215 units across at its shown scale), clear of the monster row on a short view, so a near miss still counts.
    p.hitArea = new Rectangle(-PICTURE_HIT / 2, -PICTURE_HIT / 2, PICTURE_HIT, PICTURE_HIT);
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

  /** Family, ending, repair and ladder questions all start with monsters already in slots. */
  private placeFixed(letters: string, offset: number) {
    letters.split('').forEach((letter, i) => {
      const m = new Monster(letter, false, FURS[(i + 3) % FURS.length]);
      m.placed = true;
      m.slot = i + offset;
      m.position.copyFrom(this.slotAt(m.slot));
      if (this.question?.repair || this.question?.ladder) {
        if (this.question.ladder) {
          m.drag = draggable(m, this.ctx.tw, {
            onPick: () => this.pick(m),
            onDrop: (x, y) => this.drop(m, x, y),
          });
          m.drag.enabled = false;
        }
        m.hitArea = new Rectangle(-FIXED_HIT.w / 2, -FIXED_HIT.h / 2, FIXED_HIT.w, FIXED_HIT.h);
        onTap(m, () => (this.question?.ladder ? this.tapLadder(m) : this.tapFixed(m)), { cooldown: 400 });
      }
      this.ctx.track(m);
      this.crowd.addChild(m);
      this.monsters.push(m);
    });
  }

  private wrongMonster() {
    const q = this.question;
    if (q?.repair) return this.monsters.find((m) => m.placed && !fits(q.answer, m.slot, m.letter));
    if (q?.ladder) return this.monsters.find((m) => m.placed && m.slot === q.ladder!.slot);
    return undefined;
  }

  private setCandidatesEnabled(enabled: boolean) {
    for (const m of this.monsters) {
      if (m.placed || m === this.liftedMonster) continue;
      if (m.drag) m.drag.enabled = enabled;
      m.alpha = enabled ? 1 : 0.65;
    }
  }

  private returnLifted(dim: boolean) {
    const m = this.liftedMonster;
    const slot = this.liftedFromSlot;
    if (!m || slot < 0) return;
    this.liftedMonster = null;
    this.liftedFromSlot = -1;
    m.placed = true;
    m.slot = slot;
    m.cursor = 'pointer';
    m.hitArea = new Rectangle(-FIXED_HIT.w / 2, -FIXED_HIT.h / 2, FIXED_HIT.w, FIXED_HIT.h);
    if (m.drag) m.drag.enabled = false;
    const at = this.slotAt(slot);
    void this.ctx.tw.to(m, { x: at.x, y: at.y }, { duration: 0.2, ease: ease.outBack });
    if (dim) this.setCandidatesEnabled(false);
  }

  private tapLadder(m: Monster) {
    const q = this.question;
    if (!q?.ladder || this.busy || this.finished || !m.placed) return;
    m.speak();
    sfx.pop(4);
    if (this.liftedMonster) this.returnLifted(false);
    this.liftedMonster = m;
    this.liftedFromSlot = m.slot;
    m.placed = false;
    m.slot = -1;
    m.glow.visible = false;
    m.cursor = 'grab';
    m.hitArea = new Circle(0, 0, HIT_R);
    const spot = looseSpots(this.view, this.plan, 4, this.slotCount)[3];
    if (m.drag) m.drag.home = { x: spot.x, y: spot.y };
    this.setCandidatesEnabled(true);
    void this.ctx.tw.to(m, { x: spot.x, y: spot.y }, { duration: 0.18, ease: ease.outBack }).then(() => {
      if (!this.destroyed && this.liftedMonster === m && m.drag) m.drag.enabled = true;
    });
    if (this.liftedFromSlot === q.ladder.slot) {
      this.wrongs = 0;
      void this.ctx.instruct('monster.ladder.replace', { word: q.answer });
    }
  }

  private tapFixed(m: Monster) {
    const q = this.question;
    const wrong = this.wrongMonster();
    if (!q || this.busy || !wrong) return;
    m.speak();
    if (m !== wrong) {
      if (this.checkedCorrectLetter) {
        this.misses++;
        this.wrongs++;
        sfx.boing();
        if (this.wrongs >= HINT_AFTER && !wrong.glow.visible) {
          wrong.glow.visible = true;
          hinted(this);
        }
      }
      this.checkedCorrectLetter = true;
      void this.ctx.say('monster.repair.keep', { word: q.answer, sound: SOUNDS[m.letter] });
      return;
    }
    this.monsters = this.monsters.filter((other) => other !== m);
    m.eventMode = 'none';
    m.glow.visible = false;
    void this.ctx.tw.to(m, { y: m.y - 85 }, { duration: 0.22, ease: ease.outQuad });
    void this.ctx.tw.to(m.scale, { x: 0, y: 0 }, { duration: 0.22 }).then(() => {
      this.ctx.untrack(m);
      m.destroy({ children: true });
    });
    if (this.readWord) this.readWord.visible = false;
    this.wrongs = 0;
    for (const spare of this.monsters) {
      if (!spare.drag) continue;
      spare.drag.enabled = true;
      spare.alpha = 1;
    }
    sfx.pop(4);
    // The round's second step is the ask now: the caption and the guide stop asking for the letter to take out.
    void this.ctx.instruct('monster.repair.replace', { word: q.answer });
  }

  private ask(q: Question) {
    if (q.repair) return this.ctx.instruct('monster.repair', { word: q.answer, built: q.repair.word });
    if (q.ladder)
      return this.index === 0
        ? this.ctx.instruct('monster.ladder.start', { from: q.ladder.from, word: q.answer })
        : this.ctx.instruct('monster.ladder', { word: q.answer });
    const sound = SOUNDS[q.answer];
    // Levels 7 and 8 are told, then asked: the sounds only in a round's first question, then just the word.
    if (this.plan.mode === 'family')
      return this.ctx.instruct(toldLine('family', this.index), {
        word: q.answer,
        sound: SOUNDS[q.answer[0]],
      });
    if (this.plan.mode === 'end')
      return this.ctx.instruct(toldLine('end', this.index), {
        word: q.answer,
        first: SOUNDS[q.answer[0]],
        second: SOUNDS[q.answer[1]],
        sound: SOUNDS[q.answer[2]],
      });
    switch (this.plan.mode) {
      case 'find':
        return this.ctx.instruct('monster.find', { letter: q.answer.toUpperCase() });
      case 'mine':
        return this.ctx.instruct(myLetter(this.ctx.childName).own ? 'monster.mine' : 'monster.mine.pip', {
          letter: q.answer.toUpperCase(),
        });
      case 'who':
        return this.ctx.instruct('monster.who', { sound });
      case 'first':
        return this.ctx.instruct('monster.first', { word: FIRST_WORDS[q.answer], sound });
      case 'last':
        return this.ctx.instruct('monster.last', { word: q.word ?? '' });
      case 'middle':
        return this.ctx.instruct('monster.middle', { word: q.word ?? '' });
      case 'slow':
        return this.ctx.instruct('monster.slow', { word: q.answer });
      case 'team':
        return this.ctx.instruct('monster.team', { word: q.answer });
      case 'blend':
        return this.ctx.instruct('monster.blendit', { count: 'three' });
      case 'magic':
        return this.ctx.instruct('monster.magic', { base: q.fixed ?? '', word: q.answer });
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
      // Level 15 says her letter's name, never a sound: it asks by name and makes no phonics claim.
      const said =
        this.plan.mode === 'mine'
          ? this.ctx.say(myLetter(this.ctx.childName).own ? 'monster.mine.yes' : 'monster.mine.yes.pip', {
              letter: m.letter.toUpperCase(),
            })
          : this.ctx.say(soundLine(m.letter));
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
    if (this.plan.mode !== 'mine') {
      sfx.boing();
      void this.ctx.say('monster.iam', { letter: m.letter.toUpperCase(), sound: SOUNDS[m.letter] });
    } else {
      // Level 15: the monster says only its name, and a toddler hears no boing (the dive's entry).
      if (this.ctx.band !== 'toddler') sfx.boing();
      void this.ctx.say('monster.iam.name', { letter: m.letter.toUpperCase() });
    }
    if (this.wrongs >= 2) this.hint();
  }

  private hint() {
    const q = this.question;
    if (!q) return;
    if (q.ladder && this.liftedFromSlot !== q.ladder.slot) {
      const target = this.monsters.find((x) => x.placed && x.slot === q.ladder!.slot);
      if (target && !target.glow.visible) {
        target.glow.visible = true;
        hinted(this);
      }
      this.wrongs = 0;
      return;
    }
    const want = this.building ? unitsOf(q)[this.filled] : q.answer;
    const right = this.monsters.find((x) => !x.placed && x.letter === want);
    if (right && !right.glow.visible) {
      right.glow.visible = true;
      hinted(this);
    }
    this.wrongs = 0;
  }

  // Level 16: Blend it ---------------------------------------------------------------------

  /** The word's monsters stand in the boxes' places, tappable to hear the sounds again; three picture cards wait below. */
  private setBlend(q: Question) {
    for (const m of this.monsters) {
      this.ctx.untrack(m);
      m.destroy({ children: true });
    }
    for (const c of this.cards) c.box.destroy({ children: true });
    const shift = this.ctx.rng.int(0, FURS.length - 1);
    this.monsters = q.monsters.map((letter, i) => {
      const m = new Monster(letter, false, FURS[(i + shift) % FURS.length]);
      m.placed = true;
      m.slot = i;
      this.ctx.track(m);
      this.crowd.addChild(m);
      // Hearing the sounds again is free: never a miss or a hint.
      onTap(m, () => void this.playBlend(q), { cooldown: 400 });
      return m;
    });
    this.cards = (q.cards ?? []).map((word) => this.makeCard(word));
    this.layoutMonsters();
    for (const [i, node] of [...this.monsters, ...this.cards.map((c) => c.box)].entries()) {
      node.scale.set(0);
      void this.ctx.tw.to(
        node.scale,
        { x: 1, y: 1 },
        { duration: 0.35, delay: i * 0.08, ease: ease.outBack },
      );
    }
  }

  private makeCard(word: WordPicture): BlendCard {
    const half = CARD.size / 2;
    const box = new Container();
    const glow = new Graphics()
      .roundRect(-half - 14, -half - 14, CARD.size + 28, CARD.size + 28, 34)
      .fill({ color: 0xfff3a0, alpha: 0.9 });
    glow.visible = false;
    const face = new Graphics()
      .roundRect(-half, -half, CARD.size, CARD.size, 28)
      .fill(0xffffff)
      .stroke({ width: 6, color: swatch.purple.line });
    const pic = wordPicture(word);
    pic.scale.set(CARD.scale);
    box.addChild(glow, face, pic);
    box.hitArea = new Rectangle(-half - 8, -half - 8, CARD.size + 16, CARD.size + 16);
    this.crowd.addChild(box);
    const card: BlendCard = { word, box, glow };
    onTap(box, () => void this.cardTap(card), { cooldown: 500 });
    return card;
  }

  /** The monsters light in turn and say their sounds, never the word. */
  private async playBlend(q: Question) {
    if (this.blending || this.finished || this.destroyed || this.question !== q) return;
    this.blending = true;
    for (const [i, m] of this.monsters.entries()) {
      if (this.destroyed || this.question !== q) break;
      m.glow.visible = true;
      m.speak();
      sfx.pop(3 + i);
      await this.ctx.say(soundLine(m.letter));
      m.glow.visible = false;
    }
    this.blending = false;
  }

  private async cardTap(card: BlendCard) {
    const q = this.question;
    if (!q || this.busy || this.finished || this.destroyed) return;
    sfx.pop(5);
    if (this.blending) {
      // Still listening: the card only wiggles, never a miss.
      await this.ctx.tw.to(card.box.scale, { x: 1.06, y: 1.06 }, { duration: 0.1 });
      if (!this.destroyed) await this.ctx.tw.to(card.box.scale, { x: 1, y: 1 }, { duration: 0.1 });
      return;
    }
    if (card.word !== q.answer) {
      this.misses++;
      this.wrongs++;
      sfx.boing();
      const right = this.cards.find((c) => c.word === q.answer);
      if (this.wrongs >= HINT_AFTER && right && !right.glow.visible) {
        right.glow.visible = true;
        hinted(this);
        this.wrongs = 0;
      }
      // It says its own sounds, then the monsters' sounds run again: the answer is never told.
      await this.ctx.say('monster.blendit.not', { word: card.word, sounds: sounded(card.word) });
      return void (await this.playBlend(q));
    }
    this.busy = true;
    card.glow.visible = false;
    sfx.sparkle();
    this.ctx.particles.burst(card.box.x, card.box.y - 40, {
      kind: 'star',
      colors: [0xffffff, 0xfff3a0],
      count: 14,
      speed: [100, 260],
      gravity: 0,
      life: [0.5, 0.9],
    });
    const pic = card.box.children[2];
    if (pic) for (const c of pic.children) if (c instanceof Critter) c.cheer();
    await this.ctx.say('monster.blend', { word: card.word });
    if (this.destroyed) return;
    sfx.tada();
    await this.ctx.tw.wait(0.4);
    if (this.destroyed) return;
    if (this.index + 1 >= this.questions.length) await this.ctx.say('praise');
    await this.next();
  }

  // Building words ---------------------------------------------------------------------

  /** The word's boxes, one per sound. */
  private get slotCount() {
    return this.question ? unitsOf(this.question).length : 3;
  }

  private slotX(i: number) {
    return slotX(i, this.slotCount);
  }

  /** Slot `i`'s middle, in stage units. */
  private slotAt(i: number) {
    return slotSpot(this.view, this.plan, i, this.slotCount);
  }

  /**
   * Level 11's hint (and 13's): the boxes ripple one by one and each says its sound, so she hears the word said slowly;
   * a team's box says its one sound. It counts one hint per word however often she taps; drags stay live while it speaks.
   */
  private async saySlowly() {
    const q = this.question;
    if (!q || this.busy || this.finished || this.destroyed || this.slowSaying) return;
    if (this.askNow()) return;
    if (this.slowHinted !== q) {
      this.slowHinted = q;
      this.hints++;
    }
    this.slowSaying = true;
    const units = unitsOf(q);
    for (let i = 0; i < units.length; i++) {
      // The word's own finish (the last drop) takes over the voice.
      if (this.destroyed || this.busy || this.question !== q) break;
      sfx.pop(3 + i);
      this.ripple(i);
      await this.ctx.say(soundLine(units[i]));
    }
    this.slowSaying = false;
  }

  /** A brief ring over box `i`, so the sound she hears belongs to a place. */
  private ripple(i: number) {
    const ring = new Graphics()
      .roundRect(-SLOT_SIZE / 2, -SLOT_SIZE / 2, SLOT_SIZE, SLOT_SIZE, 26)
      .stroke({ width: 8, color: swatch.purple.light });
    ring.position.set(this.slotX(i), SLOT_DY);
    this.top.addChild(ring);
    void this.ctx.tw.to(ring.scale, { x: 1.18, y: 1.18 }, { duration: 0.35, ease: ease.outQuad });
    void this.ctx.tw.to(ring, { alpha: 0 }, { duration: 0.35 }).then(() => ring.destroy());
  }

  /** `count` boxes, one per sound; level 5 also shows `word`'s letters faintly in them. */
  private drawSlots(count: number, word = '') {
    const g = this.slots.clear();
    // Give the sound hint one generous tap area over the whole row.
    if (this.plan.mode === 'slow' || this.plan.mode === 'team')
      g.hitArea = new Rectangle(
        this.slotX(0) - SLOT_ROW_HIT.pad,
        SLOT_DY - SLOT_ROW_HIT.h / 2,
        this.slotX(count - 1) - this.slotX(0) + 2 * SLOT_ROW_HIT.pad,
        SLOT_ROW_HIT.h,
      );
    for (let i = 0; i < count; i++) {
      g.roundRect(this.slotX(i) - SLOT_SIZE / 2, SLOT_DY - SLOT_SIZE / 2, SLOT_SIZE, SLOT_SIZE, 26)
        .fill({ color: 0xffffff, alpha: 0.7 })
        .stroke({ width: 5, color: swatch.purple.line });
      if (this.plan.mode === 'build') {
        const t = label(word[i], 70, swatch.purple.light);
        t.position.set(this.slotX(i), SLOT_DY);
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
    if (q.ladder) return this.dropLadder(m, x, y, q);
    // The crowd layer sits on the stage untransformed, so (x, y) are stage units.
    const slot = this.slotAt(this.filled);
    // Generous: anywhere over the slot row counts as trying the next slot.
    const units = unitsOf(q);
    const edge = Math.max(280, this.slotX(units.length - 1) + 80);
    if (Math.abs(y - slot.y) > DROP_REACH || Math.abs(x - this.top.x) > edge) return false;
    if (q.repair && (this.wrongMonster() || Math.abs(x - slot.x) > 75)) return false;
    const want = units[this.filled];
    if (!fits(units, this.filled, m.letter)) {
      this.misses++;
      this.wrongs++;
      sfx.boing();
      // Level 13: one letter of the team the box wants hears that it takes two ("That is just sss. Two letters make shh.").
      if (this.plan.mode === 'team' && want.length > 1 && want.includes(m.letter))
        void this.ctx.say('monster.team.half', { sound: SOUNDS[m.letter], team: soundOf(want) });
      // Levels 11 and 13 never say the sound the box wants: the monster says who it is, as a tap does on the finding levels.
      // Level 17: the spare spells another word; the quiet e is the one that changes this one.
      else if (this.plan.mode === 'magic')
        void this.ctx.say('monster.magic.not', { built: `${q.fixed}${m.letter}` });
      else if (this.plan.mode === 'slow' || this.plan.mode === 'team')
        void this.ctx.say('monster.iam', { letter: m.letter.toUpperCase(), sound: soundOf(m.letter) });
      else void this.ctx.say('monster.next', { sound: SOUNDS[want] });
      if (this.wrongs >= 2) this.hint();
      return false;
    }
    m.placed = true;
    m.slot = this.filled;
    m.glow.visible = false;
    if (m.drag) m.drag.enabled = false;
    void this.ctx.tw.to(m, { x: slot.x, y: slot.y }, { duration: 0.25, ease: ease.outBack });
    // The drag's own settle tween would grow a team back to full size over its neighbors' boxes.
    this.ctx.tw.kill(m.scale);
    m.scale.set(m.letter.length > 1 ? TEAM_SLOT_SCALE : 1);
    sfx.squish();
    // In a word family the ending is already there, so the first sound finishes the word.
    this.filled = q.fixed || q.repair ? units.length : this.filled + 1;
    if (this.filled >= units.length) void this.wordDone(q);
    return true;
  }

  private dropLadder(m: Monster, x: number, y: number, q: Question): boolean {
    const ladder = q.ladder;
    if (!ladder || this.liftedFromSlot < 0) return false;
    const open = this.slotAt(this.liftedFromSlot);
    if (Math.abs(y - open.y) > DROP_REACH || Math.abs(x - open.x) > 75) return false;
    if (m === this.liftedMonster) {
      this.returnLifted(true);
      sfx.squish();
      return true;
    }
    if (this.liftedFromSlot !== ladder.slot || m.letter !== q.answer[ladder.slot]) {
      this.misses++;
      this.wrongs++;
      sfx.boing();
      void this.ctx.say('monster.iam', { letter: m.letter.toUpperCase(), sound: soundOf(m.letter) });
      if (this.wrongs >= HINT_AFTER) this.hint();
      return false;
    }
    const old = this.liftedMonster;
    this.liftedMonster = null;
    this.liftedFromSlot = -1;
    if (old) {
      this.monsters = this.monsters.filter((other) => other !== old);
      old.drag?.destroy();
      old.eventMode = 'none';
      void this.ctx.tw.to(old.scale, { x: 0, y: 0 }, { duration: 0.2 }).then(() => {
        this.ctx.untrack(old);
        old.destroy({ children: true });
      });
    }
    m.placed = true;
    m.slot = ladder.slot;
    m.glow.visible = false;
    if (m.drag) m.drag.enabled = false;
    void this.ctx.tw.to(m, { x: open.x, y: open.y }, { duration: 0.25, ease: ease.outBack });
    this.ctx.tw.kill(m.scale);
    m.scale.set(1);
    sfx.squish();
    this.filled = unitsOf(q).length;
    void this.wordDone(q);
    return true;
  }

  private async wordDone(q: Question) {
    this.busy = true;
    if (this.plan.mode === 'magic') await this.magicSpeak(q);
    else {
      // Box by box, so a team says its one sound.
      const placed = this.monsters.filter((m) => m.placed).sort((a, b) => a.slot - b.slot);
      for (const m of placed) {
        m.speak();
        await this.ctx.say(soundLine(m.letter));
      }
      await this.ctx.say('monster.blend', { word: q.answer });
    }
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
    this.ctx.particles.burst(this.top.x, this.top.y, {
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

  /** Level 17: the e is silent, so the word is said whole: the built word, the picture changing, the vowel's name, the new word. */
  private async magicSpeak(q: Question) {
    await this.ctx.say('monster.blend', { word: q.fixed ?? '' });
    if (this.destroyed || this.question !== q) return;
    sfx.tada();
    this.showPicture(this.sayingPicture(q.answer as WordPicture), BUILD_PICTURE.scale, BUILD_PICTURE.y);
    const vowel = this.monsters.find((m) => m.placed && 'aiou'.includes(m.letter));
    vowel?.speak();
    await this.ctx.say('monster.magic.long', { vowel: q.vowel ?? '' });
    await this.ctx.say('monster.blend', { word: q.answer });
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
  entryLevels: [BIG_LEVEL, MINE_LEVEL],
  describeLevel: (level) => planFor(level).name,
  music: STYLES.hub,
  touchDemo: true,
  upright: true,
  coplayHint: 'Make each monster\'s sound together, slowly: "mmm", "sss", then blend them into a word.',
  coplayHintLap:
    'Make each monster\'s sound slowly as {name} taps it: "mmm", "sss". Then blend them into a word.',
  offScreen: 'Play I-spy with sounds: "I spy something that starts with sss."',
  hubIcon: () => new MonstersIcon(),
  sticker,
  create: (ctx) => new WordMonsters(ctx),
};
