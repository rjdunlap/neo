import { Circle, Container, Graphics, Rectangle, Text } from 'pixi.js';
import { ink, swatch, type ColorName } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES, silenced } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import { spread, type View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { FONT } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { Bead, fitTo, handsArt, wordPicture } from './art';
import { answerOf, clapsToGo, clapsWord, makeQuestions, nextToSort, PAUSE, pictureToTap, planFor, syllables, WORDS, type ClapPlan, type Question, type Word } from './logic';

const LEVELS: BandLevels = {
  preschool: { min: 1, max: 2 },
  prek: { min: 2, max: 4 },
  school: { min: 5, max: 5 },
};

const BEAT_COLORS: ColorName[] = ['red', 'yellow', 'blue'];
/** Seconds with no clap before the pet shows the word again. */
const NUDGE = 8;

interface Card {
  word: Word;
  node: Container;
  drag?: DragHandle;
}

interface Bin {
  count: number;
  node: Container;
  filled: number;
}

const INSTRUCTION = { along: 'clap.along', solo: 'clap.solo', sort: 'clap.sort', match: 'clap.match' } as const;

class ClapSyllables implements Game {
  readonly plan: ClapPlan;
  readonly questions: Question[];
  readonly cards: Card[] = [];
  readonly bins: Bin[] = [];
  readonly beads: Bead[] = [];
  readonly pad = new Container();
  readonly replay: RoundButton;
  index = -1;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  /** Claps counted so far on this word: lit beads when the beats are showing, taps in this try when they are not. */
  claps = 0;
  /** The beats are showing and each clap lights one (clap along, and a try she needed help with). */
  guided = false;

  private readonly backdrop: Backdrop;
  private readonly board = new Container();
  private readonly caption: Text;
  private readonly glow = new Graphics();
  private view: View;
  private wrongs = 0;
  private glowing: Container | null = null;
  private clock = 0;
  private lastClap = 0;
  private idle = 0;
  private padFace: Container;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.questions = makeQuestions(this.plan, ctx.rng);
    this.backdrop = new Backdrop({ sky: [0xe0d4ff, 0xfff4e3], hills: [0xc8ecb0, 0xa6de8e], horizon: 0.74, clouds: 2, sun: true, seed: 31 }, ctx.view);
    this.glow.eventMode = 'none';
    this.board.eventMode = 'passive';
    this.caption = new Text({ text: '', style: { fontFamily: FONT, fontSize: 40, fill: ink, fontWeight: '600', align: 'center' } });
    this.caption.anchor.set(0.5);
    this.caption.eventMode = 'none';
    // The big hands: a clap is a touch anywhere on them.
    const disc = new Graphics().circle(0, 6, 96).fill({ color: 0x000000, alpha: 0.12 }).circle(0, 0, 96).fill(swatch.yellow.fill).stroke({ width: 7, color: swatch.yellow.line });
    this.padFace = handsArt(130);
    this.padFace.position.set(0, 12);
    this.pad.addChild(disc, this.padFace);
    this.pad.hitArea = new Circle(0, 0, 104);
    onTap(this.pad, () => this.clap(), { cooldown: 90 });
    this.pad.visible = this.plan.mode === 'along' || this.plan.mode === 'solo';
    this.replay = new RoundButton(handsArt(60), swatch.white, 52, () => void this.again());
    this.replay.visible = this.plan.mode === 'match';
    ctx.stage.addChild(this.backdrop, this.board, this.caption, this.glow, this.pad, this.replay);
  }

  get q() {
    return this.questions[Math.min(this.index, this.questions.length - 1)];
  }

  get word() {
    return this.q.words[0];
  }

  start() {
    void this.next(true);
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    this.pad.position.set(v.w / 2, v.h * 0.82);
    this.replay.position.set(v.w - 80, 90);
    this.layout();
  }

  update(dt: number) {
    this.clock += dt;
    const g = this.glow.clear();
    if (this.glowing && !this.busy) {
      const b = this.glowing.getBounds();
      const p = this.board.toLocal({ x: b.x, y: b.y });
      g.roundRect(p.x - 8, p.y - 8, b.width / this.view.scale + 16, b.height / this.view.scale + 16, 30).stroke({ width: 7 + 2 * Math.sin(this.clock * 5), color: swatch.yellow.fill });
    }
    if (this.busy || this.finished) return;
    const mode = this.plan.mode;
    if (mode === 'solo' && !this.guided && this.claps > 0 && this.clock - this.lastClap > PAUSE) void this.judge();
    // A quiet moment: the pet shows the word again, as often as it takes.
    if ((mode === 'along' || mode === 'solo') && this.claps === 0) {
      this.idle += dt;
      if (this.idle > NUDGE) void this.again();
    }
  }

  /**
   * The ghost finger on the how-to card: clap the pad once for each beat (quickly enough that the game does not count the word
   * before the last beat), carry each picture to the hoop for its beats, or tap the picture with as many beats as were played.
   */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.index < 0 || this.index >= this.questions.length) return null;
    switch (this.plan.mode) {
      case 'along':
      case 'solo':
        // No rest between claps: the gap is the hand's own trip and press, well inside the pause after which a word is counted.
        return clapsToGo(this.word, this.claps) > 0 ? { tap: { on: this.pad }, pause: 0 } : null;
      case 'sort': {
        const next = nextToSort(this.cards.map((card) => ({ card, word: card.word, sorted: !card.drag || !card.drag.enabled || card.drag.dragging })), this.bins);
        return next ? { drag: { on: next.card.card.node }, to: { on: next.bin.node } } : null;
      }
      case 'match': {
        const card = pictureToTap(this.q, this.cards);
        return card ? { tap: { on: card.node } } : null;
      }
    }
  }

  destroy() {
    for (const c of this.cards) c.drag?.destroy();
  }

  // --- a round of questions ---

  private clear() {
    for (const c of this.cards.splice(0)) {
      c.drag?.destroy();
      c.node.destroy({ children: true });
    }
    for (const b of this.bins.splice(0)) b.node.destroy({ children: true });
    for (const b of this.beads.splice(0)) b.destroy();
    this.caption.text = '';
    this.glowing = null;
  }

  private async next(first = false) {
    this.busy = true;
    this.index++;
    this.wrongs = 0;
    this.claps = 0;
    this.idle = 0;
    this.guided = this.plan.mode === 'along';
    if (this.index >= this.questions.length) return void this.finale();
    this.clear();
    const q = this.q;
    switch (this.plan.mode) {
      case 'along':
      case 'solo': {
        const card = this.makeCard(q.words[0], 260);
        this.board.addChild(card.node);
        this.cards.push(card);
        if (this.guided) this.makeBeads(syllables(q.words[0]));
        this.layout();
        card.node.scale.set(0);
        await this.ctx.tw.to(card.node.scale, { x: 1, y: 1 }, { duration: 0.35, ease: ease.outBack });
        if (first) await this.ctx.instruct(INSTRUCTION[this.plan.mode]);
        await this.ctx.say('clap.word', { word: q.words[0].word });
        if (this.guided) await this.demo(q.words[0]);
        break;
      }
      case 'sort':
        this.buildSort(q);
        this.layout();
        await this.ctx.tw.wait(0.4);
        if (first) await this.ctx.instruct(INSTRUCTION.sort);
        break;
      case 'match':
        this.buildMatch(q);
        this.layout();
        await this.ctx.tw.wait(0.4);
        if (first) await this.ctx.instruct(INSTRUCTION.match);
        await this.playClaps(q.target!);
        break;
    }
    this.busy = false;
  }

  /** A picture on a card. */
  private makeCard(word: Word, size: number): Card {
    const node = new Container();
    const h = size / 2;
    const bg = new Graphics().roundRect(-h, -h, size, size, 44).fill(0xffffff).stroke({ width: 6, color: swatch.purple.line });
    const art = fitTo(wordPicture(word.word), size * 0.72);
    art.eventMode = 'none';
    node.addChild(bg, art);
    node.hitArea = new Rectangle(-h, -h, size, size);
    return { word, node };
  }

  private makeBeads(n: number) {
    for (let i = 0; i < n; i++) {
      const bead = new Bead(BEAT_COLORS[i % BEAT_COLORS.length], 26);
      this.board.addChild(bead);
      this.beads.push(bead);
    }
  }

  /** One beat of the pet's clapping: a clap, a bead lighting, the picture bouncing. */
  private beat(i: number, card?: Container) {
    sfx.clap();
    sfx.bell(4 + i * 2, 0.22);
    this.beads[i]?.light(true);
    if (card) {
      card.scale.set(1.07);
      void this.ctx.tw.to(card.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
    }
  }

  /** The pet claps a word, one beat at a time, saying nothing so the claps can be heard. */
  private async demo(word: Word) {
    for (const b of this.beads) b.light(false);
    this.claps = 0;
    for (let i = 0; i < syllables(word); i++) {
      this.beat(i, this.cards[0]?.node);
      await this.ctx.tw.wait(0.6);
    }
    await this.ctx.tw.wait(0.4);
    for (const b of this.beads) b.light(false);
    this.claps = 0;
  }

  /** Just the claps, for 'match': beads show how many. */
  private async playClaps(n: number) {
    this.busy = true;
    for (const b of this.beads) b.light(false);
    for (let i = 0; i < n; i++) {
      this.beat(i);
      await this.ctx.tw.wait(0.6);
    }
    this.busy = false;
  }

  private async again() {
    if (this.busy || this.finished) return;
    this.idle = 0;
    if (this.plan.mode === 'match') return this.playClaps(this.q.target!);
    this.busy = true;
    this.claps = 0;
    if (this.guided) for (const b of this.beads) b.light(false);
    const word = this.word;
    await this.ctx.say('clap.word', { word: word.word });
    if (!this.beads.length) {
      this.makeBeads(syllables(word));
      this.layout();
    }
    await this.demo(word);
    if (!this.guided) for (const b of this.beads.splice(0)) b.destroy();
    this.busy = false;
  }

  // --- clap along, and clap it yourself ---

  private clap() {
    if (this.busy || this.finished) return;
    const mode = this.plan.mode;
    if (mode !== 'along' && mode !== 'solo') return;
    this.idle = 0;
    this.lastClap = this.clock;
    sfx.clap();
    this.pad.scale.set(0.9);
    void this.ctx.tw.to(this.pad.scale, { x: 1, y: 1 }, { duration: 0.2, ease: ease.outBack });
    const card = this.cards[0].node;
    if (this.guided) {
      const n = syllables(this.word);
      if (this.claps >= n) return;
      this.beat(this.claps, card);
      this.claps++;
      if (this.claps === n) void this.wordDone();
    } else {
      this.claps++;
      card.scale.set(1.04);
      void this.ctx.tw.to(card.scale, { x: 1, y: 1 }, { duration: 0.2 });
    }
  }

  /** She stopped clapping: count her claps. A wrong count brings the pet's demonstration and another go. */
  private async judge() {
    this.busy = true;
    const word = this.word;
    const n = syllables(word);
    const got = this.claps;
    this.claps = 0;
    if (got === n) {
      this.makeBeads(n);
      this.layout();
      this.beads.forEach((b) => b.light(true));
      return this.wordDone();
    }
    this.misses++;
    this.wrongs++;
    sfx.boing();
    await this.ctx.say('clap.try');
    this.makeBeads(n);
    this.layout();
    await this.demo(word);
    if (this.wrongs >= 2) {
      // Second try wrong: the beats stay on show and each clap lights one, so the word can be finished.
      this.hints++;
      this.guided = true;
      this.glowing = this.pad;
    } else for (const b of this.beads.splice(0)) b.destroy();
    this.busy = false;
  }

  private async wordDone() {
    this.busy = true;
    this.glowing = null;
    const word = this.word;
    const card = this.cards[0].node;
    sfx.sparkle();
    this.ctx.particles.burst(card.x, card.y, { kind: 'star', colors: [swatch.yellow.fill, 0xffffff, swatch.pink.fill], count: 14, speed: [160, 320], gravity: 0, life: [0.5, 0.9] });
    void this.ctx.tw.to(card.scale, { x: 1.1, y: 1.1 }, { duration: 0.2 }).then(() => this.ctx.tw.to(card.scale, { x: 1, y: 1 }, { duration: 0.25 }));
    this.caption.text = word.parts.join(' · ');
    await this.ctx.say('clap.count', { word: word.word, count: clapsWord(syllables(word)) });
    await this.ctx.tw.wait(0.5);
    void this.next();
  }

  // --- sort pictures by claps ---

  private buildSort(q: Question) {
    for (const word of q.words) {
      const card = this.makeCard(word, 140);
      this.board.addChild(card.node);
      this.cards.push(card);
    }
    const max = this.plan.max;
    for (let n = 1; n <= max; n++) {
      const node = new Container();
      node.addChild(new Graphics().roundRect(-100, -78, 200, 156, 28).fill({ color: 0xffffff, alpha: 0.9 }).stroke({ width: 6, color: swatch.purple.line }));
      for (let i = 0; i < n; i++) {
        const dot = new Bead(BEAT_COLORS[i % BEAT_COLORS.length], 17);
        dot.light(true);
        dot.position.set((i - (n - 1) / 2) * 50, 38);
        node.addChild(dot);
      }
      const hands = handsArt(46);
      hands.position.set(0, -22);
      hands.eventMode = 'none';
      node.addChild(hands);
      this.board.addChild(node);
      this.bins.push({ count: n, node, filled: 0 });
    }
    this.layout();
    for (const card of this.cards) {
      card.drag = draggable(card.node, this.ctx.tw, {
        onPick: () => {
          sfx.tick();
          this.glowing = null;
        },
        onDrop: (x, y) => this.drop(card, x, y),
      });
      card.drag.home = { x: card.node.x, y: card.node.y };
    }
  }

  private drop(card: Card, x: number, y: number): boolean {
    if (this.busy || this.finished) return false;
    // The nearest bin, if the drop is anywhere near one; dropping in empty space is just a try with no penalty.
    const near = this.bins.map((b) => ({ b, d: Math.hypot(b.node.x - x, b.node.y - y) })).sort((a, b) => a.d - b.d)[0];
    if (!near || near.d > 190) return false;
    const n = syllables(card.word);
    if (near.b.count !== n) {
      this.misses++;
      this.wrongs++;
      sfx.boing();
      void this.ctx.say('clap.sort.wrong', { word: card.word.word, count: clapsWord(n) });
      void this.clapOut(n);
      if (this.wrongs >= 2) {
        this.hints++;
        this.glowing = this.bins.find((b) => b.count === n)!.node;
      }
      return false;
    }
    this.wrongs = 0;
    this.glowing = null;
    card.drag!.enabled = false;
    const slot = near.b.filled++;
    void this.ctx.tw.to(card.node, { x: near.b.node.x - 52 + (slot % 3) * 52, y: near.b.node.y - 118 - Math.floor(slot / 3) * 40 }, { duration: 0.35, ease: ease.outBack });
    void this.ctx.tw.to(card.node.scale, { x: 0.38, y: 0.38 }, { duration: 0.35 });
    void this.clapOut(n);
    if (this.cards.every((c) => c.drag && !c.drag.enabled)) void this.sorted();
    return true;
  }

  /** The pet's claps for a word, quickly and without words. */
  private async clapOut(n: number) {
    for (let i = 0; i < n; i++) {
      sfx.clap();
      sfx.bell(4 + i * 2, 0.2);
      await this.ctx.tw.wait(0.32);
    }
  }

  private async sorted() {
    this.busy = true;
    await this.ctx.tw.wait(0.9);
    void this.next();
  }

  // --- hear the claps, find the picture ---

  private buildMatch(q: Question) {
    for (const word of q.words) {
      const card = this.makeCard(word, 180);
      onTap(card.node, () => void this.pick(card), { cooldown: 350 });
      this.board.addChild(card.node);
      this.cards.push(card);
    }
    this.makeBeads(q.target!);
  }

  private async pick(card: Card) {
    if (this.busy || this.finished) return;
    const n = syllables(card.word);
    const q = this.q;
    if (n !== q.target) {
      this.misses++;
      this.wrongs++;
      this.busy = true;
      sfx.boing();
      await this.ctx.say('clap.match.wrong', { word: card.word.word, count: clapsWord(n) });
      await this.clapOut(n);
      await this.playClaps(q.target!);
      if (this.wrongs >= 2) {
        this.hints++;
        this.glowing = this.cards.find((c) => c.word === answerOf(q))!.node;
      }
      this.busy = false;
      return;
    }
    this.busy = true;
    this.glowing = null;
    sfx.sparkle();
    this.ctx.particles.burst(card.node.x, card.node.y, { kind: 'star', colors: [swatch.yellow.fill, 0xffffff], count: 12, speed: [160, 300], gravity: 0, life: [0.5, 0.9] });
    void this.ctx.tw.to(card.node.scale, { x: 1.12, y: 1.12 }, { duration: 0.2 });
    await this.ctx.say('clap.count', { word: card.word.word, count: clapsWord(n) });
    await this.ctx.tw.wait(0.5);
    void this.next();
  }

  // --- layout and the end ---

  private layout() {
    const v = this.view;
    const mode = this.plan.mode;
    if (mode === 'along' || mode === 'solo') {
      const card = this.cards[0]?.node;
      if (card) card.position.set(v.w / 2, v.h * 0.34);
      this.caption.position.set(v.w / 2, v.h * 0.34 + 160);
      this.beads.forEach((b, i) => b.position.set(v.w / 2 + (i - (this.beads.length - 1) / 2) * 76, v.h * 0.34 + 214));
    } else if (mode === 'sort') {
      // Longer words use two rows of four; each picture keeps a large, clear drag target.
      const perRow = this.cards.length > 5 ? 4 : this.cards.length;
      this.cards.forEach((c, i) => {
        if (c.drag?.enabled === false) return;
        const row = Math.floor(i / perRow);
        const rowStart = row * perRow;
        const rowCount = Math.min(perRow, this.cards.length - rowStart);
        const xs = spread(rowCount, 100, v.w - 100, 165);
        const x = xs[i - rowStart];
        const y = this.cards.length > 5 ? v.h * (0.22 + row * 0.22) : v.h * 0.3;
        c.node.position.set(x, y);
        if (c.drag) c.drag.home = { x, y };
      });
      const binY = this.cards.length > 5 ? v.h * 0.66 : v.h * 0.72;
      this.bins.forEach((b, i) => b.node.position.set(v.w / 2 + (i - (this.bins.length - 1) / 2) * 250, binY));
    } else {
      const xs = spread(this.cards.length, 190, v.w - 90, 230);
      this.cards.forEach((c, i) => c.node.position.set(xs[i], v.h * 0.62));
      this.beads.forEach((b, i) => b.position.set(v.w / 2 + (i - (this.beads.length - 1) / 2) * 76, v.h * 0.25));
    }
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    this.busy = true;
    this.clear();
    this.pad.visible = false;
    sfx.sparkle();
    this.ctx.pet.cheer();
    await this.ctx.say('clap.done');
    await this.ctx.tw.wait(0.4);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

function clapIcon(): Container {
  const c = new Container();
  c.addChild(new Graphics().roundRect(-90, -150, 180, 150, 20).fill(0xffffff).stroke({ width: 7, color: swatch.purple.line }));
  const hands = handsArt(120);
  hands.position.set(0, -92);
  c.addChild(hands);
  for (let i = 0; i < 3; i++) {
    const dot = new Bead(BEAT_COLORS[i], 12);
    dot.light(true);
    dot.position.set((i - 1) * 34, -22);
    c.addChild(dot);
  }
  return c;
}

/** A word's picture with a ball for each of its claps. */
function sticker(seed: number): Container {
  const word = new Rng(seed).pick(WORDS);
  const c = new Container();
  const art = fitTo(wordPicture(word.word), 110);
  art.y = -14;
  c.addChild(art);
  for (let i = 0; i < syllables(word); i++) {
    const dot = new Bead(BEAT_COLORS[i % BEAT_COLORS.length], 11);
    dot.light(true);
    dot.position.set((i - (syllables(word) - 1) / 2) * 30, 62);
    c.addChild(dot);
  }
  return c;
}

export const clapSyllables: GameModule = {
  id: 'clap-syllables',
  name: 'Clap the Syllables',
  titleLine: 'game.clap-syllables',
  region: 'story-grove',
  skills: ['syllables', 'phonological-awareness', 'rhythm', 'counting'],
  bands: ['preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  touchDemo: true,
  music: silenced(STYLES.paint),
  coplayHint: 'Clap along with {name} and say the word slowly: "but-ter-fly", one clap for each beat. Try the names of people in the family.',
  offScreen: 'Clap the beats in names, foods and animals at home: "ba-na-na" is three claps, "dog" is one.',
  hubIcon: () => new WigglyIcon(clapIcon()),
  sticker,
  create: (ctx) => new ClapSyllables(ctx),
};
