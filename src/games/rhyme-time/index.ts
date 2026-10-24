import { Container, Graphics, Rectangle } from 'pixi.js';
import { ink, swatch, wood } from '../../art/palette';
import { musicNote, starPoints } from '../../art/shapes';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import { spread, type View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { chipsFor, FAMILIES, guessFor, makeQuestions, makeRiddles, makeTap, planFor, rhymes, spokenList, TAGS, wordToTap, type Riddle, type RhymePlan, type RhymeQuestion, type Tag } from './logic';
import { picture, tagGlyph } from './pictures';

/** Pre-K plays the first riddle (5) after pairs; odd one out (4) and the meaning-first and make-it riddles (6–7) stay school. */
const LEVELS: BandLevels = {
  prek: { min: 1, max: 5, order: [1, 2, 3, 5] },
  school: { min: 2, max: 7 },
};

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
}

class RhymeTime implements Game {
  readonly plan: RhymePlan;
  readonly questions: RhymeQuestion[];
  /** Levels 5–7: the round's riddles (the questions stay empty). */
  readonly riddles: Riddle[] | null;
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
  finished = false;
  /** Pair levels: the first card chosen. */
  picked: Card | null = null;

  private readonly backdrop: Backdrop;
  private readonly prompt = new Container();
  private readonly glow = new Graphics();
  private view: View;
  private wrongs = 0;
  private glowing: Card | null = null;
  private clock = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    const riddle = RIDDLE_MODES.includes(this.plan.mode);
    this.questions = riddle ? [] : makeQuestions(this.plan, ctx.rng);
    this.riddles = riddle ? makeRiddles(this.plan, ctx.rng) : null;
    this.backdrop = new Backdrop({ sky: [0xffd6e6, 0xfff4e3], hills: [0xc8ecb0, 0xa6de8e], horizon: 0.72, clouds: 2, sun: true, seed: 14 }, ctx.view);
    this.glow.eventMode = 'none';
    this.prompt.eventMode = 'none';
    this.replay = new RoundButton(musicNote(new Graphics(), 40, ink), swatch.white, 52, () => void this.ask());
    ctx.stage.addChild(this.backdrop, this.prompt, this.glow, this.replay);
  }

  get q() {
    return this.questions[this.index];
  }

  get riddle(): Riddle | undefined {
    return this.riddles?.[this.index];
  }

  start() {
    void this.next();
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    const xs = spread(this.cards.length, 180, v.w - 60, 200);
    const make = this.plan.mode === 'make';
    this.cards.forEach((c, i) => c.node.position.set(xs[i], v.h * (make ? 0.42 : 0.64)));
    // Level 7: the sound pair, the meaning pair, then the pet's mouth, in one row under the shelf.
    const row = [...this.chips.map((c) => c.node), ...(this.guessButton ? [this.guessButton] : [])];
    // Starts right of the corner pet, which the bottom row would otherwise reach.
    const cx = spread(row.length, 240, v.w - 50, 165);
    row.forEach((n, i) => n.position.set(cx[i], Math.min(v.h - 90, v.h * 0.42 + 250)));
    this.prompt.position.set(v.w / 2, Math.max(170, v.h * 0.27));
    this.replay.position.set(v.w - 80, 90);
  }

  update(dt: number) {
    this.clock += dt;
    const g = this.glow.clear();
    if (this.glowing && !this.busy) g.roundRect(this.glowing.node.x - 92, this.glowing.node.y - 92, 184, 184, 34).stroke({ width: 7 + 2 * Math.sin(this.clock * 5), color: swatch.yellow.fill });
    const r = this.riddle;
    if (this.chipGlow && r && !this.busy) {
      for (const c of this.chips.filter((c) => c.sound === r.clueWord || c.tag === r.tag)) g.roundRect(c.node.x - 74, c.node.y - 74, 148, 148, 30).stroke({ width: 7 + 2 * Math.sin(this.clock * 5), color: swatch.yellow.fill });
    }
  }

  /** The ghost finger on the how-to card: the rhyming picture, the odd one out, or the pair, one card and then the other. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished) return null;
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

  destroy() {}

  private async next() {
    this.busy = true;
    this.index++;
    this.wrongs = 0;
    this.glowing = null;
    this.picked = null;
    this.sound = null;
    this.tag = null;
    this.tries = 0;
    this.chipGlow = false;
    if (this.index >= (this.riddles ?? this.questions).length) return void this.finale();
    for (const c of this.cards.splice(0)) {
      this.ctx.tw.kill(c.node);
      this.ctx.tw.kill(c.node.scale);
      c.node.destroy({ children: true });
    }
    for (const c of this.chips.splice(0)) c.node.destroy({ children: true });
    this.guessButton?.destroy({ children: true });
    this.guessButton = null;
    this.prompt.removeChildren().forEach((c) => c.destroy({ children: true }));
    const q = this.q;
    const words = this.riddle?.words ?? q.words;
    if (q?.prompt) {
      const bubble = new Graphics().roundRect(-95, -95, 190, 190, 40).fill(0xffffff).stroke({ width: 6, color: swatch.pink.line });
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
      onTap(node, () => void this.tap(card), { cooldown: 350 });
      node.scale.set(0);
      void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.3, delay: this.cards.length * 0.07, ease: ease.outBack });
      this.cards.push(card);
      this.ctx.stage.addChild(node);
    }
    if (this.plan.mode === 'make') this.makeChips(this.riddle!);
    this.resize(this.view);
    await this.ctx.tw.wait(0.4);
    this.busy = false;
    await this.ask();
  }

  /** Say the question with every word, so nothing needs reading. */
  private ask() {
    const r = this.riddle;
    if (r && !this.finished) {
      if (this.plan.mode === 'make') return this.ctx.instruct('rhyme.make', { answer: r.answer });
      const vars = { sound: r.clueWord, clue: TAGS[r.tag].clue, list: spokenList(r.words) };
      return this.ctx.instruct(this.plan.mode === 'riddle' ? 'rhyme.riddle' : 'rhyme.riddle2', vars);
    }
    const q = this.q;
    if (!q || this.finished) return;
    const list = q.words.join(', ');
    if (this.plan.mode === 'match') return this.ctx.instruct('rhyme.match', { prompt: q.prompt!, list });
    if (this.plan.mode === 'pair') return this.ctx.instruct('rhyme.pair', { list });
    return this.ctx.instruct('rhyme.odd', { list });
  }

  private drawCard(c: Card, selected: boolean) {
    c.bg.clear().roundRect(-80, -80, 160, 160, 28).fill(selected ? swatch.yellow.light : 0xffffff).stroke({ width: 6, color: selected ? swatch.yellow.line : wood.line });
  }

  private async tap(c: Card) {
    if (this.busy || this.finished) return;
    const q = this.q;
    sfx.pop(5);
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
    if (q.answer.includes(c.word)) return void this.right(c, null);
    if (this.plan.mode === 'match') return void this.wrong('rhyme.no', { word: c.word, prompt: q.prompt! });
    const other = this.cards.find((x) => x !== c && rhymes(x.word, c.word))!;
    return void this.wrong('rhyme.noodd', { word: c.word, other: other.word });
  }

  private async wrong(line: 'rhyme.no' | 'rhyme.nopair' | 'rhyme.noodd', vars: Record<string, string>) {
    this.busy = true;
    this.misses++;
    this.wrongs++;
    sfx.boing();
    await this.ctx.say(line, vars);
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
      void this.ctx.tw.to(c.node, { y: c.node.y - 30 }, { duration: 0.18, ease: ease.outQuad }).then(() => this.ctx.tw.to(c.node, { y: c.node.y + 30 }, { duration: 0.2, ease: ease.inQuad }));
    }
    const q = this.q;
    if (this.plan.mode === 'match') await this.ctx.say('rhyme.yes', { a: q.prompt!, b: a.word });
    else if (this.plan.mode === 'pair') await this.ctx.say('rhyme.yes', { a: a.word, b: b!.word });
    else await this.ctx.say('rhyme.oddyes', { word: a.word });
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
      void this.act(c, r.tag);
      await this.ctx.say('rhyme.riddleYes', { answer: r.answer, sound: r.clueWord, clue: inSentence(clue.clue) });
      await this.ctx.tw.wait(0.3);
      return void this.next();
    }
    this.busy = true;
    this.misses++;
    this.wrongs++;
    sfx.boing();
    // A mate rhymes but fails the meaning; a trap or the decoy does not rhyme.
    if (rhymes(c.word, r.clueWord)) await this.ctx.say('rhyme.riddleNoMeaning', { word: c.word, sound: r.clueWord, fact: clue.fact });
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
        return tw.to(n, { y: y - 60 }, { duration: 0.35, ease: ease.outQuad }).then(() => tw.to(n, { y }, { duration: 0.45, ease: ease.inOutSine }));
      case 'ride':
        return tw.to(n, { x: x + 70 }, { duration: 0.3, ease: ease.inQuad }).then(() => tw.to(n, { x }, { duration: 0.4, ease: ease.outBack }));
      case 'swim':
        return tw.to(n, { rotation: 0.15 }, { duration: 0.15 }).then(() => tw.to(n, { rotation: -0.15 }, { duration: 0.2 })).then(() => tw.to(n, { rotation: 0 }, { duration: 0.35, ease: ease.outElastic }));
      case 'sit':
      case 'eat':
      case 'eatwith':
        return tw.to(n.scale, { y: 0.8 }, { duration: 0.15 }).then(() => tw.to(n.scale, { y: 1 }, { duration: 0.35, ease: ease.outElastic }));
      default:
        return tw.to(n, { y: y - 30 }, { duration: 0.18, ease: ease.outQuad }).then(() => tw.to(n, { y }, { duration: 0.2, ease: ease.inQuad }));
    }
  }

  /** Level 7: a star on the pet's picture, the sound and meaning chips, and the mouth that guesses. */
  private makeChips(r: Riddle) {
    const answer = this.cards.find((c) => c.word === r.answer)!;
    answer.node.addChild(new Graphics().poly(starPoints(30, 13).map((p, i) => p + (i % 2 ? -112 : 0))).fill(swatch.yellow.fill).stroke({ width: 5, color: swatch.yellow.line, join: 'round' }));
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
      c.bg.clear().roundRect(-62, -62, 124, 124, 26).fill(on ? swatch.yellow.light : 0xffffff).stroke({ width: on ? 9 : 6, color: on ? swatch.yellow.line : sw.line });
    }
  }

  /** A chip stays changeable: one sound and one meaning are chosen at a time, and each says what it means. */
  private pickChip(c: Chip) {
    if (this.busy || this.finished) return;
    sfx.pop(c.sound ? 6 : 8);
    if (c.sound) {
      this.sound = c.sound;
      void this.ctx.say('rhyme.chipSound', { word: c.sound });
    } else if (c.tag) {
      this.tag = c.tag;
      void this.ctx.say('rhyme.chipMeaning', { clue: TAGS[c.tag].clue });
    }
    this.drawChips();
  }

  /** The pet finds what her clues keep. Nothing here is a miss: a wrong find is the lesson, and two glow the working chips (one hint). */
  private async guess() {
    const r = this.riddle;
    if (this.busy || this.finished || !r) return;
    if (!this.sound || !this.tag) return void this.ctx.say('rhyme.makeBoth');
    this.busy = true;
    const found = guessFor(r, this.sound, this.tag);
    const card = this.cards.find((c) => c.word === found);
    if (found === r.answer && card) {
      sfx.sparkle();
      this.ctx.pet.cheer();
      this.drawCard(card, true);
      void this.act(card, r.tag);
      await this.ctx.say('rhyme.makeGuess', { sound: r.clueWord, clue: inSentence(TAGS[r.tag].clue), answer: r.answer });
      await this.ctx.tw.wait(0.3);
      return void this.next();
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
  skills: ['rhyming', 'listening', 'phonological-awareness', 'words'],
  bands: ['prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  coplayHint: 'Say the words slowly and stretch the ends: "caaat, haaat". Then make up a silly rhyme together, or ask the pet\'s riddle back: it rhymes with cat and you wear it. What is it?',
  offScreen: 'Play "I spy something that rhymes with..." around the house or on a walk.',
  hubIcon: () => new RhymeIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new RhymeTime(ctx),
};
