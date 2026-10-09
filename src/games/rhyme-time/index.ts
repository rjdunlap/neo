import { Container, Graphics, Rectangle } from 'pixi.js';
import { ink, swatch, wood } from '../../art/palette';
import { musicNote } from '../../art/shapes';
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
import { FAMILIES, makeQuestions, planFor, rhymes, wordToTap, type RhymePlan, type RhymeQuestion } from './logic';
import { picture } from './pictures';

const LEVELS: BandLevels = {
  prek: { min: 1, max: 3 },
  school: { min: 2, max: 4 },
};

interface Card {
  word: string;
  node: Container;
  bg: Graphics;
}

class RhymeTime implements Game {
  readonly plan: RhymePlan;
  readonly questions: RhymeQuestion[];
  readonly cards: Card[] = [];
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
    this.questions = makeQuestions(this.plan, ctx.rng);
    this.backdrop = new Backdrop({ sky: [0xffd6e6, 0xfff4e3], hills: [0xc8ecb0, 0xa6de8e], horizon: 0.72, clouds: 2, sun: true, seed: 14 }, ctx.view);
    this.glow.eventMode = 'none';
    this.prompt.eventMode = 'none';
    this.replay = new RoundButton(musicNote(new Graphics(), 40, ink), swatch.white, 52, () => void this.ask());
    ctx.stage.addChild(this.backdrop, this.prompt, this.glow, this.replay);
  }

  get q() {
    return this.questions[this.index];
  }

  start() {
    void this.next();
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    const xs = spread(this.cards.length, 180, v.w - 60, 200);
    this.cards.forEach((c, i) => c.node.position.set(xs[i], v.h * 0.64));
    this.prompt.position.set(v.w / 2, Math.max(170, v.h * 0.27));
    this.replay.position.set(v.w - 80, 90);
  }

  update(dt: number) {
    this.clock += dt;
    const g = this.glow.clear();
    if (this.glowing && !this.busy) g.roundRect(this.glowing.node.x - 92, this.glowing.node.y - 92, 184, 184, 34).stroke({ width: 7 + 2 * Math.sin(this.clock * 5), color: swatch.yellow.fill });
  }

  /** The ghost finger on the how-to card: the rhyming picture, the odd one out, or the pair, one card and then the other. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || !this.q) return null;
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
    if (this.index >= this.questions.length) return void this.finale();
    for (const c of this.cards.splice(0)) c.node.destroy({ children: true });
    this.prompt.removeChildren().forEach((c) => c.destroy({ children: true }));
    const q = this.q;
    if (q.prompt) {
      const bubble = new Graphics().roundRect(-95, -95, 190, 190, 40).fill(0xffffff).stroke({ width: 6, color: swatch.pink.line });
      const art = picture(q.prompt);
      this.prompt.addChild(bubble, art);
    }
    for (const word of q.words) {
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
    this.resize(this.view);
    await this.ctx.tw.wait(0.4);
    this.busy = false;
    await this.ask();
  }

  /** Say the question with every word, so nothing needs reading. */
  private ask() {
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
  coplayHint: 'Say the words slowly and stretch the ends: "caaat, haaat". Then make up a silly rhyme together.',
  offScreen: 'Play "I spy something that rhymes with..." around the house or on a walk.',
  hubIcon: () => new RhymeIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new RhymeTime(ctx),
};
