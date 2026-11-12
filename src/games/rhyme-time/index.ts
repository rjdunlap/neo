import { Container, Graphics, Rectangle } from 'pixi.js';
import { ink, swatch, wood } from '../../art/palette';
import { musicNote, starPoints } from '../../art/shapes';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import { spread, type View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  LEVELS,
  andList,
  basketFor,
  chipsFor,
  FAMILIES,
  familySong,
  guessFor,
  makeQuestions,
  makeRiddles,
  makeTap,
  makeTrays,
  planFor,
  rhymes,
  sceneFor,
  spokenList,
  TAGS,
  wordToTap,
  type Riddle,
  type RhymePlan,
  type RhymeQuestion,
  type Tag,
  type Tray,
} from './logic';
import { picture, tagGlyph } from './pictures';

/** Level 8's place is drawn this much larger than a card picture, its rider this much smaller inside it. */
const PLACE_SCALE = 1.6;
const RIDER_SCALE = 0.6;

const RIDDLE_MODES: readonly RhymePlan['mode'][] = ['riddle', 'riddle2', 'make'];

/** "You can sit on it." said inside a sentence: "…, and you can sit on it." */
const inSentence = (clue: string) => clue[0].toLowerCase() + clue.slice(1);

/** Level 7's clue chips: a sound (a picture to rhyme with) or a meaning (a tag's sign). */
interface Chip {
  sound?: string;
  tag?: Tag;
  node: Container;
  bg: Graphics;
}

/** The Guess button's face: the pet's mouth, open to say what it finds. */
function mouthIcon(): Container {
  const g = new Graphics();
  g.circle(-18, -16, 7).circle(18, -16, 7).fill(ink);
  g.ellipse(0, 16, 24, 18).fill(swatch.red.line).ellipse(0, 24, 14, 8).fill(swatch.pink.fill);
  const c = new Container();
  c.addChild(g);
  return c;
}

interface Card {
  word: string;
  node: Container;
  bg: Graphics;
  /** Level 10: the picture's drag, and once it is in, its basket and place there. */
  drag?: DragHandle;
  placed?: number;
  slot?: number;
}

/** Level 10: a basket with its key picture on the front. */
interface Basket {
  key: string;
  node: Container;
  filled: number;
}

/** Level 10: a picture dropped this close to a basket's middle goes to the nearest basket. */
const DROP_RADIUS = 180;
/** A basket's middle sits this far below its node (the handle rises above, the body hangs below). */
const BASKET_MID = 20;

/** A woven basket, its handle up, with the key picture on a round badge on the front. */
function basketArt(key: string): Container {
  const g = new Graphics();
  g.arc(0, -10, 80, Math.PI, 2 * Math.PI).stroke({ width: 12, color: wood.line, cap: 'round' });
  g.poly([-100, -10, 100, -10, 82, 112, -82, 112])
    .fill(wood.fill)
    .stroke({ width: 6, color: wood.line, join: 'round' });
  for (let y = 26; y < 112; y += 28) {
    const inset = ((y + 10) * 18) / 122;
    g.moveTo(-100 + inset, y)
      .lineTo(100 - inset, y)
      .stroke({ width: 3, color: wood.line, alpha: 0.45 });
  }
  g.roundRect(-110, -24, 220, 26, 13).fill(wood.light).stroke({ width: 6, color: wood.line });
  g.circle(0, 56, 50).fill(0xffffff).stroke({ width: 5, color: swatch.pink.line });
  const art = picture(key);
  art.scale.set(0.55);
  art.position.set(0, 56);
  const c = new Container();
  c.addChild(g, art);
  return c;
}

class RhymeTime implements Game {
  readonly plan: RhymePlan;
  readonly questions: RhymeQuestion[];
  /** Levels 5–7: the round's riddles (the questions stay empty). */
  readonly riddles: Riddle[] | null;
  /** Level 10: the round's trays (the questions stay empty). */
  readonly trays: Tray[] | null;
  readonly baskets: Basket[] = [];
  /** Level 10: wrong drops per picture this tray; the second glows its basket (one hint per picture). */
  private readonly basketMisses = new Map<string, number>();
  private basketGlow: { card: Card; basket: Basket } | null = null;
  readonly cards: Card[] = [];
  /** Level 7: the four clue chips and the pet's Guess button. */
  readonly chips: Chip[] = [];
  guessButton: RoundButton | null = null;
  sound: string | null = null;
  tag: Tag | null = null;
  /** Level 7: combinations tried this riddle that did not find the starred picture; two glow the working chips. */
  tries = 0;
  chipGlow = false;
  readonly replay: RoundButton;
  index = -1;
  misses = 0;
  hints = 0;
  busy = true;
  /** The next question's instruction, waiting behind the last right answer's line (U7 R4); `askGen` drops a stale wait. */
  unasked = false;
  private askGen = 0;
  finished = false;
  /** Pair levels: the first card chosen. */
  picked: Card | null = null;

  private readonly backdrop: Backdrop;
  private readonly prompt = new Container();
  /** Level 8: the place, scaled up, holding the rider once one hops in. */
  private place: Container | null = null;
  private readonly glow = new Graphics();
  private view: View;
  private wrongs = 0;
  private glowing: Card | null = null;
  private clock = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    const riddle = RIDDLE_MODES.includes(this.plan.mode);
    const baskets = this.plan.mode === 'baskets';
    this.questions = riddle || baskets ? [] : makeQuestions(this.plan, ctx.rng);
    this.riddles = riddle ? makeRiddles(this.plan, ctx.rng) : null;
    this.trays = baskets ? makeTrays(this.plan, ctx.rng) : null;
    this.backdrop = new Backdrop(
      {
        sky: [0xffd6e6, 0xfff4e3],
        hills: [0xc8ecb0, 0xa6de8e],
        horizon: 0.72,
        clouds: 2,
        sun: true,
        seed: 14,
      },
      ctx.view,
    );
    this.glow.eventMode = 'none';
    this.prompt.eventMode = 'none';
    this.replay = new RoundButton(
      musicNote(new Graphics(), 40, ink),
      swatch.white,
      52,
      () => void this.ask(),
    );
    ctx.stage.addChild(this.backdrop, this.prompt, this.glow, this.replay);
  }

  get q() {
    return this.questions[this.index];
  }

  get riddle(): Riddle | undefined {
    return this.riddles?.[this.index];
  }

  get tray(): Tray | undefined {
    return this.trays?.[this.index];
  }

  start() {
    void this.next();
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    const xs = spread(this.cards.length, 180, v.w - 60, 200);
    const make = this.plan.mode === 'make';
    if (this.trays) this.layoutBaskets(v);
    else this.cards.forEach((c, i) => c.node.position.set(xs[i], v.h * (make ? 0.42 : 0.64)));
    // Level 7: the sound pair, the meaning pair, then the pet's mouth, in one row under the shelf.
    const row = [...this.chips.map((c) => c.node), ...(this.guessButton ? [this.guessButton] : [])];
    // Starts right of the corner pet, which the bottom row would otherwise reach.
    const cx = spread(row.length, 240, v.w - 50, 165);
    row.forEach((n, i) => n.position.set(cx[i], Math.min(v.h - 90, v.h * 0.42 + 250)));
    // Level 8's place stands just above the riders, its top clear of the corner buttons.
    this.prompt.position.set(
      v.w / 2,
      this.plan.mode === 'scene' ? Math.max(250, v.h * 0.64 - 230) : Math.max(170, v.h * 0.27),
    );
    this.replay.position.set(v.w - 80, 90);
  }

  update(dt: number) {
    this.clock += dt;
    const g = this.glow.clear();
    if (this.glowing && !this.busy)
      g.roundRect(this.glowing.node.x - 92, this.glowing.node.y - 92, 184, 184, 34).stroke({
        width: 7 + 2 * Math.sin(this.clock * 5),
        color: swatch.yellow.fill,
      });
    const r = this.riddle;
    if (this.chipGlow && r && !this.busy) {
      for (const c of this.chips.filter((c) => c.sound === r.clueWord || c.tag === r.tag))
        g.roundRect(c.node.x - 74, c.node.y - 74, 148, 148, 30).stroke({
          width: 7 + 2 * Math.sin(this.clock * 5),
          color: swatch.yellow.fill,
        });
    }
    const bg = this.basketGlow;
    if (bg && !this.busy) {
      const { node: b } = bg.basket;
      const w = 7 + 2 * Math.sin(this.clock * 5);
      g.roundRect(b.x - 122, b.y - 104, 244, 230, 36).stroke({ width: w, color: swatch.yellow.fill });
      if (!bg.card.drag?.dragging)
        g.roundRect(bg.card.node.x - 92, bg.card.node.y - 92, 184, 184, 34).stroke({
          width: w,
          color: swatch.yellow.fill,
        });
    }
  }

  /** The ghost finger on the how-to card: the rhyming picture, the odd one out, or the pair, one card and then the other. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.unasked) return null;
    const t = this.tray;
    if (t) {
      const card = this.cards.find((c) => c.placed === undefined);
      const basket = card && this.baskets[basketFor(card.word, t.keys)];
      return card && basket ? { drag: { on: card.node }, to: { on: basket.node, y: BASKET_MID } } : null;
    }
    const r = this.riddle;
    if (r && this.plan.mode === 'make') {
      const next = makeTap(r, this.sound, this.tag);
      if (next === 'guess') return this.guessButton ? { tap: { on: this.guessButton } } : null;
      const chip = this.chips.find((c) => ('sound' in next ? c.sound === next.sound : c.tag === next.tag));
      return chip ? { tap: { on: chip.node } } : null;
    }
    if (r) {
      const card = this.cards.find((c) => c.word === r.answer);
      return card ? { tap: { on: card.node } } : null;
    }
    if (!this.q) return null;
    const word = wordToTap(this.plan, this.q, this.picked?.word ?? null);
    const card = this.cards.find((c) => c.word === word);
    return card ? { tap: { on: card.node } } : null;
  }

  destroy() {
    for (const c of this.cards) c.drag?.destroy();
  }

  /** Questions, riddles or trays in the round. */
  private get total() {
    return this.trays?.length ?? (this.riddles ?? this.questions).length;
  }

  /**
   * After a right answer: the line starts and, after the beat (and the answer's own motion), the next question comes with
   * input open, its instruction waiting for the line (U7 R4). The round's last line is heard out.
   */
  private async onward(said: Promise<unknown>, beat: number, motion?: Promise<unknown>) {
    if (this.index + 1 < this.total) {
      // A killed tween never resolves, so the motion's wait is capped.
      await Promise.all([this.ctx.tw.wait(beat), motion && Promise.race([motion, this.ctx.tw.wait(1.6)])]);
      return this.next(said);
    }
    await said;
    await this.ctx.tw.wait(beat);
    return this.next();
  }

  /** Says the waiting instruction, if there is one. */
  private askNow() {
    if (!this.unasked || this.finished) return false;
    this.dropAsk();
    void this.ask();
    return true;
  }

  private dropAsk() {
    this.unasked = false;
    this.askGen++;
  }

  /** The guide was tapped while the next instruction waits: say it, not the one before it. */
  sayWaitingAsk() {
    return this.askNow();
  }

  private async next(said?: Promise<unknown>) {
    this.busy = true;
    this.dropAsk();
    this.index++;
    this.wrongs = 0;
    this.glowing = null;
    this.picked = null;
    this.sound = null;
    this.tag = null;
    this.tries = 0;
    this.chipGlow = false;
    this.basketGlow = null;
    this.basketMisses.clear();
    if (this.index >= this.total) return void this.finale();
    for (const b of this.baskets.splice(0)) {
      this.ctx.tw.kill(b.node.scale);
      b.node.destroy({ children: true });
    }
    for (const c of this.cards.splice(0)) {
      c.drag?.destroy();
      this.ctx.tw.kill(c.node);
      this.ctx.tw.kill(c.node.scale);
      this.ctx.tw.kill(c.bg);
      c.node.destroy({ children: true });
    }
    for (const c of this.chips.splice(0)) c.node.destroy({ children: true });
    this.guessButton?.destroy({ children: true });
    this.guessButton = null;
    if (this.place) {
      this.ctx.tw.kill(this.place);
      this.ctx.tw.kill(this.place.scale);
    }
    this.place = null;
    this.prompt.removeChildren().forEach((c) => c.destroy({ children: true }));
    const q = this.q;
    const tray = this.tray;
    if (tray) this.makeBaskets(tray);
    const words = tray?.words ?? this.riddle?.words ?? q.words;
    if (q?.prompt && this.plan.mode === 'scene') this.drawPlace(q.prompt);
    else if (q?.prompt) {
      const bubble = new Graphics()
        .roundRect(-95, -95, 190, 190, 40)
        .fill(0xffffff)
        .stroke({ width: 6, color: swatch.pink.line });
      const art = picture(q.prompt);
      this.prompt.addChild(bubble, art);
    }
    for (const word of words) {
      const node = new Container();
      const bg = new Graphics();
      node.addChild(bg, picture(word));
      node.hitArea = new Rectangle(-85, -85, 170, 170);
      const card: Card = { word, node, bg };
      this.drawCard(card, false);
      if (tray) {
        card.drag = draggable(node, this.ctx.tw, {
          onPick: () => this.pickUp(card),
          onDrop: (x, y) => this.dropOn(card, x, y),
        });
        card.drag.enabled = false;
      } else onTap(node, () => void this.tap(card), { cooldown: 350 });
      node.scale.set(0);
      void this.ctx.tw.to(
        node.scale,
        { x: 1, y: 1 },
        { duration: 0.3, delay: this.cards.length * 0.07, ease: ease.outBack },
      );
      this.cards.push(card);
      this.ctx.stage.addChild(node);
    }
    if (this.plan.mode === 'make') this.makeChips(this.riddle!);
    this.resize(this.view);
    await this.ctx.tw.wait(0.4);
    this.setBusy(false);
    if (!said) return void (await this.ask());
    // The instruction waits for the last answer's line, or is said at her first tap or by the guide.
    this.unasked = true;
    const gen = this.askGen;
    void said.then(() => {
      if (gen === this.askGen) this.askNow();
    });
  }

  /** Busy holds the pictures still too, so nothing is picked up while the pet is speaking feedback. */
  private setBusy(busy: boolean) {
    this.busy = busy;
    for (const c of this.cards) if (c.drag) c.drag.enabled = !busy && c.placed === undefined;
  }

  /** Say the question with every word, so nothing needs reading. */
  private ask() {
    const t = this.tray;
    if (t && !this.finished) return this.ctx.instruct('rhyme.baskets', { keys: andList(t.keys) });
    const r = this.riddle;
    if (r && !this.finished) {
      if (this.plan.mode === 'make') return this.ctx.instruct('rhyme.make', { answer: r.answer });
      const vars = { sound: r.clueWord, clue: TAGS[r.tag].clue, list: spokenList(r.words) };
      return this.ctx.instruct(this.plan.mode === 'riddle' ? 'rhyme.riddle' : 'rhyme.riddle2', vars);
    }
    const q = this.q;
    if (!q || this.finished) return;
    const list = q.words.join(', ');
    if (this.plan.mode === 'scene' && this.plan.choices === 2)
      return this.ctx.instruct('rhyme.scene2', { place: q.prompt!, list: spokenList(q.words) });
    if (this.plan.mode === 'scene')
      return this.ctx.instruct('rhyme.scene', {
        place: q.prompt!,
        prep: sceneFor(q.prompt!).prep,
        list: spokenList(q.words),
      });
    if (this.plan.mode === 'match') return this.ctx.instruct('rhyme.match', { prompt: q.prompt!, list });
    if (this.plan.mode === 'pair') return this.ctx.instruct('rhyme.pair', { list });
    return this.ctx.instruct('rhyme.odd', { list });
  }

  private drawCard(c: Card, selected: boolean) {
    c.bg
      .clear()
      .roundRect(-80, -80, 160, 160, 28)
      .fill(selected ? swatch.yellow.light : 0xffffff)
      .stroke({ width: 6, color: selected ? swatch.yellow.line : wood.line });
  }

  private async tap(c: Card) {
    if (this.busy || this.finished) return;
    const q = this.q;
    sfx.pop(5);
    if (this.unasked) {
      // A tap before she has heard the instruction: a right answer goes ahead; anything else says the instruction, not a miss.
      if (this.plan.mode === 'pair') {
        this.picked = c;
        this.drawCard(c, true);
        return void this.askNow();
      }
      const r = this.riddle;
      const right = r ? this.plan.mode !== 'make' && c.word === r.answer : q.answer.includes(c.word);
      if (!right) return void this.askNow();
      this.dropAsk();
    }
    if (this.riddle) return void this.tapRiddle(c, this.riddle);
    if (this.plan.mode === 'pair') {
      if (!this.picked) {
        this.picked = c;
        this.drawCard(c, true);
        void this.ctx.say('rhyme.word', { word: c.word });
        return;
      }
      if (this.picked === c) {
        this.drawCard(c, false);
        this.picked = null;
        return;
      }
      const a = this.picked;
      this.picked = null;
      this.drawCard(a, false);
      if (rhymes(a.word, c.word)) return void this.right(a, c);
      return void this.wrong('rhyme.nopair', { a: a.word, b: c.word });
    }
    if (this.plan.mode === 'scene')
      return void (q.answer.includes(c.word) ? this.rightScene(c) : this.wrongScene(c));
    if (q.answer.includes(c.word)) return void this.right(c, null);
    if (this.plan.mode === 'match') return void this.wrong('rhyme.no', { word: c.word, prompt: q.prompt! });
    const other = this.cards.find((x) => x !== c && rhymes(x.word, c.word))!;
    return void this.wrong('rhyme.noodd', { word: c.word, other: other.word });
  }

  private async wrong(
    line: 'rhyme.no' | 'rhyme.nopair' | 'rhyme.noodd' | 'rhyme.sceneNo',
    vars: Record<string, string>,
    after?: () => Promise<void>,
  ) {
    this.busy = true;
    this.misses++;
    this.wrongs++;
    sfx.boing();
    await this.ctx.say(line, vars);
    await after?.();
    if (this.wrongs >= 2 && !this.glowing) {
      this.hints++;
      this.glowing = this.cards.find((x) => x.word === this.q.answer[0]) ?? null;
      void this.ctx.say('rhyme.hint');
    }
    this.busy = false;
  }

  private async right(a: Card, b: Card | null) {
    this.busy = true;
    this.glowing = null;
    sfx.sparkle();
    this.ctx.pet.cheer();
    for (const c of [a, b].filter(Boolean) as Card[]) {
      this.drawCard(c, true);
      void this.ctx.tw
        .to(c.node, { y: c.node.y - 30 }, { duration: 0.18, ease: ease.outQuad })
        .then(() => this.ctx.tw.to(c.node, { y: c.node.y + 30 }, { duration: 0.2, ease: ease.inQuad }));
    }
    const q = this.q;
    const said =
      this.plan.mode === 'match'
        ? this.ctx.say('rhyme.yes', { a: q.prompt!, b: a.word })
        : this.plan.mode === 'pair'
          ? this.ctx.say('rhyme.yes', { a: a.word, b: b!.word })
          : this.ctx.say('rhyme.oddyes', { word: a.word });
    // The bounce (0.38 s) fits inside the beat.
    await this.onward(said, 0.3);
  }

  // Silly pairs (level 8) ----------------------------------------------------------

  /** The place in the middle, on a road (the truck) or a soft shadow, scaled up so a rider fits. */
  private drawPlace(word: string) {
    const art = picture(word);
    const bottom = art.getLocalBounds().maxY * PLACE_SCALE;
    const ground = new Graphics();
    if (word === 'truck') {
      ground.roundRect(-190, bottom - 14, 380, 34, 14).fill(0x8d8f99);
      for (let x = -160; x < 160; x += 56) ground.roundRect(x, bottom - 1, 30, 7, 3).fill(0xffffff);
    } else ground.ellipse(0, bottom - 4, 120, 16).fill({ color: ink, alpha: 0.12 });
    this.place = new Container();
    this.place.scale.set(PLACE_SCALE);
    this.place.addChild(art);
    this.prompt.addChild(ground, this.place);
  }

  /** Where a rider sits, in stage units. */
  private anchorPoint(place: string) {
    const { anchor } = sceneFor(place);
    return { x: this.prompt.x + anchor.x * PLACE_SCALE, y: this.prompt.y + anchor.y * PLACE_SCALE };
  }

  /** The card's picture hops up to the place, its card fading away. */
  private async hopIn(c: Card, place: string) {
    const { tw } = this.ctx;
    const to = this.anchorPoint(place);
    sfx.pop(7);
    void tw.to(c.bg, { alpha: 0 }, { duration: 0.2 });
    void tw.to(
      c.node.scale,
      { x: PLACE_SCALE * RIDER_SCALE, y: PLACE_SCALE * RIDER_SCALE },
      { duration: 0.4 },
    );
    await tw.to(
      c.node,
      { x: (c.node.x + to.x) / 2, y: Math.min(c.node.y, to.y) - 90 },
      { duration: 0.2, ease: ease.outQuad },
    );
    await tw.to(c.node, { x: to.x, y: to.y }, { duration: 0.2, ease: ease.inQuad });
  }

  /** A rider that does not rhyme: in it hops, the pet giggles at the silly sight, and back it hops to its slot. */
  private async wrongScene(c: Card) {
    this.busy = true;
    const place = this.q.prompt!;
    await this.hopIn(c, place);
    const scene = sceneFor(place);
    await this.wrong('rhyme.sceneNo', { word: c.word, prep: scene.prep, place }, async () => {
      const { tw } = this.ctx;
      const xs = spread(this.cards.length, 180, this.view.w - 60, 200);
      const home = { x: xs[this.cards.indexOf(c)], y: this.view.h * 0.64 };
      void tw.to(c.bg, { alpha: 1 }, { duration: 0.3 });
      void tw.to(c.node.scale, { x: 1, y: 1 }, { duration: 0.4 });
      await tw.to(
        c.node,
        { x: (c.node.x + home.x) / 2, y: c.node.y - 70 },
        { duration: 0.2, ease: ease.outQuad },
      );
      await tw.to(c.node, home, { duration: 0.22, ease: ease.inQuad });
    });
  }

  /** The rider that rhymes hops in and stays; the place does its thing (the truck drives off and back), and on to the next scene. */
  private async rightScene(c: Card) {
    this.busy = true;
    this.glowing = null;
    const place = this.q.prompt!;
    const scene = sceneFor(place);
    await this.hopIn(c, place);
    c.node.visible = false;
    const rider = picture(c.word);
    rider.scale.set(RIDER_SCALE);
    rider.position.set(scene.anchor.x, scene.anchor.y);
    if (this.place) {
      if (scene.behind) this.place.addChildAt(rider, 0);
      else this.place.addChild(rider);
    }
    sfx.sparkle();
    this.ctx.pet.cheer();
    const acted = this.actScene(place);
    const said = this.ctx.say('rhyme.sceneYes', { rider: c.word, prep: scene.prep, place });
    // The place finishes its act (the truck's drive) before the next scene replaces it.
    await this.onward(said, 0.4, acted);
  }

  private async actScene(place: string) {
    const p = this.place;
    if (!p) return;
    const { tw } = this.ctx;
    if (place === 'truck') {
      await tw.to(p, { x: this.view.w / 2 + 160 }, { duration: 0.6, ease: ease.inQuad });
      p.x = -this.view.w / 2 - 160;
      return tw.to(p, { x: 0 }, { duration: 0.7, ease: ease.outBack });
    }
    await tw.to(p.scale, { y: PLACE_SCALE * 0.85 }, { duration: 0.15 });
    return tw.to(p.scale, { y: PLACE_SCALE }, { duration: 0.4, ease: ease.outElastic });
  }

  // Rhyme baskets (level 10) ------------------------------------------------------

  /** Three baskets; tapping one says its key, for free. */
  private makeBaskets(t: Tray) {
    for (const key of t.keys) {
      const node = basketArt(key);
      node.hitArea = new Rectangle(-112, -100, 224, 220);
      const b: Basket = { key, node, filled: 0 };
      onTap(
        node,
        () => {
          if (this.finished) return;
          sfx.pop(4);
          void this.ctx.say('rhyme.word', { word: key });
        },
        { cooldown: 350 },
      );
      this.baskets.push(b);
      this.ctx.stage.addChild(node);
    }
  }

  /** Baskets in a row along the top; the six pictures in two rows of three below, clear of the corner pet. */
  private layoutBaskets(v: View) {
    const bx = spread(this.baskets.length, 200, v.w - 60, 290);
    const by = Math.max(230, v.h * 0.3);
    this.baskets.forEach((b, i) => b.node.position.set(bx[i], by));
    const tx = spread(3, 180, v.w - 60, 200);
    const row1 = Math.max(by + 250, v.h * 0.6);
    const row2 = Math.min(v.h - 90, row1 + 185);
    this.cards.forEach((c, i) => {
      if (c.placed !== undefined)
        return void c.node.position.copyFrom(this.slotPoint(this.baskets[c.placed], c.slot!));
      const home = { x: tx[i % 3], y: i < 3 ? row1 : row2 };
      if (c.drag) c.drag.home = home;
      if (!c.drag?.dragging) c.node.position.set(home.x, home.y);
    });
  }

  /** Where a picture sits once it is in: peeking over the rim, the first on the left, the second on the right. */
  private slotPoint(b: Basket, slot: number) {
    return { x: b.node.x + (slot ? 46 : -46), y: b.node.y - 36 };
  }

  private pickUp(c: Card) {
    sfx.pop(5);
    void this.ctx.say('rhyme.word', { word: c.word });
  }

  /** A drop near a basket is judged against the nearest one; anywhere else it floats home, free. */
  private dropOn(c: Card, x: number, y: number): boolean {
    const t = this.tray;
    if (this.busy || this.finished || !t) return false;
    let best = -1;
    let bestD = DROP_RADIUS;
    this.baskets.forEach((b, i) => {
      const d = Math.hypot(b.node.x - x, b.node.y + BASKET_MID - y);
      if (d < bestD) [best, bestD] = [i, d];
    });
    if (best < 0) return false;
    if (basketFor(c.word, t.keys) === best) {
      void this.rightBasket(c, this.baskets[best]);
      return true;
    }
    void this.wrongBasket(c, this.baskets[best], this.baskets[basketFor(c.word, t.keys)]);
    return false;
  }

  private async rightBasket(c: Card, b: Basket) {
    this.setBusy(true);
    c.placed = this.baskets.indexOf(b);
    c.slot = b.filled++;
    c.node.eventMode = 'none';
    if (this.basketGlow?.card === c) this.basketGlow = null;
    const { tw } = this.ctx;
    tw.kill(c.node);
    tw.kill(c.node.scale);
    sfx.sparkle();
    this.ctx.pet.cheer();
    void tw.to(c.bg, { alpha: 0 }, { duration: 0.2 });
    void tw.to(c.node.scale, { x: 0.5, y: 0.5 }, { duration: 0.3 });
    await tw.to(c.node, this.slotPoint(b, c.slot), { duration: 0.3, ease: ease.outBack });
    void this.bounce(b.node);
    const said = this.ctx.say('rhyme.yes', { a: b.key, b: c.word });
    if (this.cards.every((x) => x.placed !== undefined)) {
      // The tray's last picture: its line is heard out before the baskets sing.
      await said;
      return void this.sing();
    }
    // The other pictures can be carried while the line plays (U7 R4); her next drop's line cuts it.
    this.setBusy(false);
  }

  /** The wrong basket shakes its head and the picture floats home; the second miss on one picture glows its basket. */
  private async wrongBasket(c: Card, b: Basket, right: Basket) {
    this.setBusy(true);
    this.misses++;
    const n = (this.basketMisses.get(c.word) ?? 0) + 1;
    this.basketMisses.set(c.word, n);
    sfx.boing();
    const { tw } = this.ctx;
    const x = b.node.x;
    void tw
      .to(b.node, { x: x - 12 }, { duration: 0.07 })
      .then(() => tw.to(b.node, { x: x + 12 }, { duration: 0.1 }))
      .then(() => tw.to(b.node, { x }, { duration: 0.2, ease: ease.outElastic }));
    await this.ctx.say('rhyme.basketNo', { word: c.word, key: b.key });
    if (n === 2) {
      this.hints++;
      this.basketGlow = { card: c, basket: right };
      await this.ctx.say('rhyme.basketHint', { word: c.word, key: right.key });
    }
    this.setBusy(false);
  }

  private bounce(node: Container) {
    const { tw } = this.ctx;
    return tw
      .to(node.scale, { y: 0.88 }, { duration: 0.12 })
      .then(() => tw.to(node.scale, { y: 1 }, { duration: 0.4, ease: ease.outElastic }));
  }

  /** The tray is empty: each basket sings its family in turn, then the next tray, or the end. */
  private async sing() {
    for (const b of this.baskets) {
      void this.bounce(b.node);
      const [a, bb, c] = familySong(b.key);
      await this.ctx.say('rhyme.basketSong', { a, b: bb, c });
    }
    await this.ctx.tw.wait(0.3);
    await this.next();
  }

  // Rhyme Riddles (levels 5–7) ----------------------------------------------------

  /** Levels 5–6: the picture that fits both clues does what the meaning said; one that fails a clue is told which. Level 7's shelf only says its words. */
  private async tapRiddle(c: Card, r: Riddle) {
    if (this.plan.mode === 'make') return void this.ctx.say('rhyme.word', { word: c.word });
    const clue = TAGS[r.tag];
    if (c.word === r.answer) {
      this.busy = true;
      this.glowing = null;
      sfx.sparkle();
      this.ctx.pet.cheer();
      this.drawCard(c, true);
      const acted = this.act(c, r.tag);
      const said = this.ctx.say('rhyme.riddleYes', {
        answer: r.answer,
        sound: r.clueWord,
        clue: inSentence(clue.clue),
      });
      return void this.onward(said, 0.3, acted);
    }
    this.busy = true;
    this.misses++;
    this.wrongs++;
    sfx.boing();
    // A mate rhymes but fails the meaning; a trap or the decoy does not rhyme.
    if (rhymes(c.word, r.clueWord))
      await this.ctx.say('rhyme.riddleNoMeaning', { word: c.word, sound: r.clueWord, fact: clue.fact });
    else await this.ctx.say('rhyme.riddleNoRhyme', { word: c.word, sound: r.clueWord });
    if (this.wrongs === 1) await this.ctx.say('rhyme.riddleClues', { sound: r.clueWord, clue: clue.clue });
    else if (!this.glowing) {
      this.hints++;
      this.glowing = this.cards.find((x) => x.word === r.answer) ?? null;
      await this.ctx.say('rhyme.riddleHint');
    }
    this.busy = false;
  }

  /** The clue made real on the card: a flyer floats up, a ride drives off and back, food takes a bite, a seat is sat on. */
  private act(c: Card, tag: Tag) {
    const { tw } = this.ctx;
    const n = c.node;
    // A new motion starts from the card's slot, not from wherever the last one left it.
    tw.kill(n);
    tw.kill(n.scale);
    n.rotation = 0;
    n.scale.set(1);
    this.resize(this.view);
    const { x, y } = n;
    switch (tag) {
      case 'fly':
      case 'sky':
        return tw
          .to(n, { y: y - 60 }, { duration: 0.35, ease: ease.outQuad })
          .then(() => tw.to(n, { y }, { duration: 0.45, ease: ease.inOutSine }));
      case 'ride':
        return tw
          .to(n, { x: x + 70 }, { duration: 0.3, ease: ease.inQuad })
          .then(() => tw.to(n, { x }, { duration: 0.4, ease: ease.outBack }));
      case 'swim':
        return tw
          .to(n, { rotation: 0.15 }, { duration: 0.15 })
          .then(() => tw.to(n, { rotation: -0.15 }, { duration: 0.2 }))
          .then(() => tw.to(n, { rotation: 0 }, { duration: 0.35, ease: ease.outElastic }));
      case 'sit':
      case 'eat':
      case 'eatwith':
        return tw
          .to(n.scale, { y: 0.8 }, { duration: 0.15 })
          .then(() => tw.to(n.scale, { y: 1 }, { duration: 0.35, ease: ease.outElastic }));
      default:
        return tw
          .to(n, { y: y - 30 }, { duration: 0.18, ease: ease.outQuad })
          .then(() => tw.to(n, { y }, { duration: 0.2, ease: ease.inQuad }));
    }
  }

  /** Level 7: a star on the pet's picture, the sound and meaning chips, and the mouth that guesses. */
  private makeChips(r: Riddle) {
    const answer = this.cards.find((c) => c.word === r.answer)!;
    answer.node.addChild(
      new Graphics()
        .poly(starPoints(30, 13).map((p, i) => p + (i % 2 ? -112 : 0)))
        .fill(swatch.yellow.fill)
        .stroke({ width: 5, color: swatch.yellow.line, join: 'round' }),
    );
    const { sound, meaning } = chipsFor(r);
    const add = (chip: Omit<Chip, 'node' | 'bg'>, art: Container) => {
      const node = new Container();
      const bg = new Graphics();
      node.addChild(bg, art);
      node.hitArea = new Rectangle(-68, -68, 136, 136);
      const c: Chip = { ...chip, node, bg };
      onTap(node, () => this.pickChip(c), { cooldown: 250 });
      this.chips.push(c);
      this.ctx.stage.addChild(node);
    };
    for (const word of this.ctx.rng.shuffle([...sound])) {
      const art = picture(word);
      art.scale.set(0.7);
      add({ sound: word }, art);
    }
    for (const tag of this.ctx.rng.shuffle([...meaning])) add({ tag }, tagGlyph(tag));
    this.guessButton = new RoundButton(mouthIcon(), swatch.yellow, 62, () => void this.guess());
    this.ctx.stage.addChild(this.guessButton);
    this.drawChips();
  }

  private drawChips() {
    for (const c of this.chips) {
      const on = c.sound ? c.sound === this.sound : c.tag === this.tag;
      const sw = c.sound ? swatch.pink : swatch.green;
      c.bg
        .clear()
        .roundRect(-62, -62, 124, 124, 26)
        .fill(on ? swatch.yellow.light : 0xffffff)
        .stroke({ width: on ? 9 : 6, color: on ? swatch.yellow.line : sw.line });
    }
  }

  /** A chip stays changeable: one sound and one meaning are chosen at a time, and each says what it means. */
  private pickChip(c: Chip) {
    if (this.busy || this.finished) return;
    sfx.pop(c.sound ? 6 : 8);
    // Her first chip before the instruction was heard: it is chosen, and the instruction is said in place of its name.
    const asked = this.askNow();
    if (c.sound) {
      this.sound = c.sound;
      if (!asked) void this.ctx.say('rhyme.chipSound', { word: c.sound });
    } else if (c.tag) {
      this.tag = c.tag;
      if (!asked) void this.ctx.say('rhyme.chipMeaning', { clue: TAGS[c.tag].clue });
    }
    this.drawChips();
  }

  /** The pet finds what her clues keep. Nothing here is a miss: a wrong find is the lesson, and two glow the working chips (one hint). */
  private async guess() {
    const r = this.riddle;
    if (this.busy || this.finished || !r) return;
    if (this.askNow()) return;
    if (!this.sound || !this.tag) return void this.ctx.say('rhyme.makeBoth');
    this.busy = true;
    const found = guessFor(r, this.sound, this.tag);
    const card = this.cards.find((c) => c.word === found);
    if (found === r.answer && card) {
      sfx.sparkle();
      this.ctx.pet.cheer();
      this.drawCard(card, true);
      const acted = this.act(card, r.tag);
      const said = this.ctx.say('rhyme.makeGuess', {
        sound: r.clueWord,
        clue: inSentence(TAGS[r.tag].clue),
        answer: r.answer,
      });
      return void this.onward(said, 0.3, acted);
    }
    this.tries++;
    if (card) {
      sfx.pop(3);
      void this.act(card, 'wear');
      await this.ctx.say('rhyme.makeWrong', { guess: found!, answer: r.answer });
    } else {
      sfx.boing();
      await this.ctx.say('rhyme.makeNone');
    }
    if (this.tries >= 2 && !this.chipGlow) {
      this.chipGlow = true;
      this.hints++;
      await this.ctx.say('rhyme.makeHint');
    }
    this.busy = false;
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    sfx.tada();
    await this.ctx.say('rhyme.done');
    await this.ctx.tw.wait(0.4);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

class RhymeIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const cat = picture('cat');
    cat.position.set(-50, -60);
    const hat = picture('hat');
    hat.scale.set(0.7);
    hat.position.set(55, -80);
    c.addChild(cat, hat);
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const fam = FAMILIES[rng.pick(Object.keys(FAMILIES))];
  const c = new Container();
  const a = picture(fam[0]);
  a.position.set(-60, 0);
  const b = picture(fam[1]);
  b.position.set(60, 0);
  c.addChild(a, b);
  return c;
}

export const rhymeTime: GameModule = {
  id: 'rhyme-time',
  name: 'Rhyme Time',
  titleLine: 'game.rhyme-time',
  region: 'story-grove',
  challenge: 'words',
  skills: ['rhyming', 'listening', 'phonological-awareness', 'words'],
  bands: ['preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  entryLevels: [9],
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  coplayHint:
    'Say the words slowly and stretch the ends: "caaat, haaat". Then make up a silly rhyme together, or ask the pet\'s riddle back: it rhymes with cat and you wear it. What is it?',
  offScreen: 'Play "I spy something that rhymes with..." around the house or on a walk.',
  hubIcon: () => new RhymeIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new RhymeTime(ctx),
};
