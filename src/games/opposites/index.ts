import { Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { ink, swatch, wood } from '../../art/palette';
import { starPoints } from '../../art/shapes';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import { spread, type View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule } from '../types';
import { makeRounds, opposites, planFor, word, type Card, type OppPlan, type OppRound } from './logic';

const LEVELS: BandLevels = {
  lap: { min: 1, max: 1 },
  toddler: { min: 1, max: 2 },
  preschool: { min: 2, max: 3 },
  prek: { min: 3, max: 4 },
};

/** A picture of one side of a concept, about 140 units square, centered on (0, 0). */
export function picture(card: Card): Container {
  const c = new Container();
  const g = new Graphics();
  const side = card.side;
  switch (card.concept) {
    case 'size': {
      const bear = new Critter(CRITTERS.bear);
      bear.alive = false;
      bear.scale.set(side === 0 ? 0.48 : 0.22);
      bear.y = 60;
      c.addChild(bear);
      return c;
    }
    case 'mood': {
      const cat = new Critter(CRITTERS.cat);
      cat.alive = false;
      cat.scale.set(0.4);
      cat.y = 58;
      cat.setMood(side === 0 ? 'happy' : 'sad');
      c.addChild(cat);
      return c;
    }
    case 'height': {
      const y = side === 0 ? -40 : 34;
      g.moveTo(0, y + 30).quadraticCurveTo(10, y + 55, 0, side === 0 ? 60 : y + 40).stroke({ width: 3, color: ink, alpha: 0.6 });
      g.ellipse(0, y, 26, 32).fill(swatch.red.fill).stroke({ width: 4, color: swatch.red.line }).ellipse(-8, y - 12, 6, 9).fill({ color: 0xffffff, alpha: 0.6 });
      g.rect(-60, 60, 120, 6).fill(swatch.green.fill);
      const a = side === 0 ? -1 : 1;
      g.poly([46, 0 + a * 20, 58, a * -4, 34, a * -4]).fill(swatch.blue.fill);
      g.rect(42, a * -4 - (a > 0 ? 24 : 0), 8, 24).fill(swatch.blue.fill);
      break;
    }
    case 'lid':
      g.roundRect(-50, -10, 100, 64, 8).fill(wood.fill).stroke({ width: 4, color: wood.line });
      if (side === 0) g.poly([-50, -10, -60, -64, 40, -74, 50, -20]).fill(wood.light).stroke({ width: 4, color: wood.line, join: 'round' }).ellipse(0, -10, 44, 8).fill(0x6b4a2b);
      else g.roundRect(-56, -26, 112, 22, 8).fill(wood.light).stroke({ width: 4, color: wood.line });
      break;
    case 'cup':
      g.moveTo(-36, -50).lineTo(36, -50).lineTo(28, 56).lineTo(-28, 56).closePath().fill({ color: 0xdff3ff, alpha: 0.6 }).stroke({ width: 5, color: swatch.blue.line });
      if (side === 0) g.moveTo(-33, -30).lineTo(33, -30).lineTo(28, 54).lineTo(-28, 54).closePath().fill(swatch.orange.fill);
      break;
    case 'temp':
      if (side === 0) {
        g.roundRect(-36, -14, 64, 64, 12).fill(swatch.red.fill).stroke({ width: 4, color: swatch.red.line });
        g.moveTo(28, 0).bezierCurveTo(56, 0, 56, 34, 28, 34).stroke({ width: 8, color: swatch.red.line });
        for (const x of [-20, -4, 12]) g.moveTo(x, -22).quadraticCurveTo(x + 10, -40, x, -58).stroke({ width: 5, color: 0xb9c6d1, cap: 'round' });
      } else {
        g.roundRect(-40, -30, 80, 80, 14).fill({ color: swatch.blue.light, alpha: 0.9 }).stroke({ width: 5, color: swatch.blue.fill });
        g.moveTo(-24, -16).lineTo(-6, -16).stroke({ width: 5, color: 0xffffff, cap: 'round' });
        for (const [x, y] of [[-50, -40], [48, -46], [52, 30]]) g.poly(starPoints(9, 3).map((n, i) => n + (i % 2 ? y : x))).fill(0xffffff).stroke({ width: 2, color: swatch.blue.fill });
      }
      break;
    case 'sky':
      g.roundRect(-64, -64, 128, 128, 18).fill(side === 0 ? 0x8fd3f7 : 0x2b2f63);
      if (side === 0) g.circle(20, -14, 26).fill(swatch.yellow.fill).stroke({ width: 4, color: swatch.yellow.line });
      else {
        g.circle(18, -16, 24).fill(swatch.yellow.light).circle(30, -24, 20).fill(0x2b2f63);
        for (const [x, y] of [[-36, -30], [-20, 24], [30, 34]]) g.poly(starPoints(8, 3).map((n, i) => n + (i % 2 ? y : x))).fill(swatch.yellow.fill);
      }
      break;
    case 'speed':
      if (side === 0) {
        const bunny = new Critter(CRITTERS.bunny);
        bunny.alive = false;
        bunny.scale.set(0.34);
        bunny.position.set(10, 56);
        c.addChild(bunny);
        for (const y of [-10, 10, 30]) g.moveTo(-70, y).lineTo(-36, y).stroke({ width: 5, color: swatch.blue.fill, cap: 'round' });
      } else {
        g.ellipse(0, 36, 46, 12).fill(swatch.green.light).stroke({ width: 4, color: swatch.green.line });
        g.circle(4, 8, 30).fill(swatch.orange.light).stroke({ width: 4, color: swatch.orange.line });
        g.moveTo(4, 8).arc(4, 8, 14, 0, Math.PI * 1.5).stroke({ width: 4, color: swatch.orange.line });
        g.moveTo(-40, 30).lineTo(-52, 0).moveTo(-42, 30).lineTo(-36, 0).stroke({ width: 3, color: swatch.green.line }).circle(-52, 0, 4).circle(-36, 0, 4).fill(ink);
      }
      break;
  }
  c.addChild(g);
  return c;
}

interface CardView {
  card: Card;
  node: Container;
  bg: Graphics;
  done: boolean;
}

class Opposites implements Game {
  readonly plan: OppPlan;
  readonly rounds: OppRound[];
  readonly cards: CardView[] = [];
  index = -1;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  picked: CardView | null = null;

  private readonly backdrop: Backdrop;
  private readonly shown = new Container();
  private readonly glow = new Graphics();
  private view: View;
  private wrongs = 0;
  private glowing: CardView | null = null;
  private clock = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.rounds = makeRounds(this.plan, ctx.rng);
    this.backdrop = new Backdrop({ sky: [0xffe9b8, 0xfff8ec], hills: [0xc8ecb0, 0xa6de8e], horizon: 0.75, clouds: 2, sun: false, seed: 17 }, ctx.view);
    this.glow.eventMode = 'none';
    this.shown.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.shown, this.glow);
  }

  get round() {
    return this.rounds[this.index];
  }

  start() {
    void this.next();
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    const mode = this.plan.mode;
    if (mode === 'switch') this.cards.forEach((c) => c.node.position.set(v.w / 2, v.h * 0.5));
    else if (mode === 'pairs') {
      const xs = spread(3, 200, v.w - 80, 230);
      this.cards.forEach((c, i) => c.node.position.set(xs[i % 3], i < 3 ? v.h * 0.36 : v.h * 0.72));
    } else {
      const xs = spread(this.cards.length, 200, v.w - 80, 240);
      this.cards.forEach((c, i) => c.node.position.set(xs[i], v.h * 0.64));
    }
    this.shown.position.set(v.w / 2, Math.max(150, v.h * 0.26));
  }

  update(dt: number) {
    this.clock += dt;
    const g = this.glow.clear();
    if (this.glowing && !this.busy) g.roundRect(this.glowing.node.x - 100, this.glowing.node.y - 100, 200, 200, 36).stroke({ width: 7 + 2 * Math.sin(this.clock * 5), color: swatch.yellow.fill });
  }

  destroy() {}

  private makeCard(card: Card, scale = 1): CardView {
    const node = new Container();
    const bg = new Graphics();
    node.addChild(bg, picture(card));
    node.hitArea = new Rectangle(-90, -90, 180, 180);
    node.scale.set(scale);
    const view: CardView = { card, node, bg, done: false };
    this.drawCard(view, false);
    onTap(node, () => void this.tap(view), { cooldown: 350 });
    this.ctx.stage.addChild(node);
    return view;
  }

  private drawCard(c: CardView, on: boolean) {
    c.bg.clear().roundRect(-85, -85, 170, 170, 30).fill(on ? swatch.yellow.light : 0xffffff).stroke({ width: 6, color: on ? swatch.yellow.line : wood.line });
  }

  private async next() {
    this.busy = true;
    this.index++;
    this.wrongs = 0;
    this.glowing = null;
    this.picked = null;
    if (this.index >= this.rounds.length) return void this.finale();
    for (const c of this.cards.splice(0)) c.node.destroy({ children: true });
    this.shown.removeChildren().forEach((c) => c.destroy({ children: true }));
    const r = this.round;
    for (const card of r.cards) this.cards.push(this.makeCard(card, this.plan.mode === 'switch' ? 1.7 : 1));
    if (this.plan.mode === 'opposite') {
      const bubble = new Graphics().roundRect(-95, -95, 190, 190, 40).fill(0xffffff).stroke({ width: 6, color: swatch.purple.line });
      this.shown.addChild(bubble, picture(r.ask!));
    }
    this.resize(this.view);
    for (const c of this.cards) {
      const s = c.node.scale.x;
      c.node.scale.set(0);
      void this.ctx.tw.to(c.node.scale, { x: s, y: s }, { duration: 0.3, ease: ease.outBack });
    }
    await this.ctx.tw.wait(0.35);
    this.busy = false;
    const mode = this.plan.mode;
    if (mode === 'switch') return this.index === 0 ? this.ctx.instruct('opp.switch') : this.ctx.say('opp.word', { word: word(r.cards[0]) });
    if (mode === 'find') return this.ctx.instruct('opp.find', { word: word(r.ask!) });
    if (mode === 'opposite') return this.ctx.instruct('opp.opposite', { word: word(r.ask!) });
    return this.ctx.instruct('opp.pairs');
  }

  private async flip(c: CardView, to: Card) {
    const s = c.node.scale.x;
    await this.ctx.tw.to(c.node.scale, { x: 0 }, { duration: 0.12 });
    c.node.removeChildAt(1).destroy({ children: true });
    c.node.addChild(picture(to));
    c.card = to;
    await this.ctx.tw.to(c.node.scale, { x: s }, { duration: 0.18, ease: ease.outBack });
  }

  private async tap(c: CardView) {
    if (this.busy || this.finished || c.done) return;
    const mode = this.plan.mode;
    sfx.pop(5);
    if (mode === 'switch') {
      // Tap: it flips to its opposite, and the word is said.
      this.busy = true;
      const to = { concept: c.card.concept, side: (1 - c.card.side) as 0 | 1 };
      await this.flip(c, to);
      await this.ctx.say('opp.word', { word: word(to) });
      await this.ctx.tw.wait(0.5);
      return void this.next();
    }
    const r = this.round;
    if (mode === 'find') return void (word(c.card) === word(r.ask!) ? this.right([c]) : this.wrong('opp.notfind', { what: word(c.card), word: word(r.ask!) }));
    if (mode === 'opposite') return void (opposites(c.card, r.ask!) ? this.right([c]) : this.wrong('opp.notopp', { what: word(c.card), word: word(r.ask!) }));
    // Pairs: the first tap picks, the second checks.
    if (!this.picked) {
      this.picked = c;
      this.drawCard(c, true);
      void this.ctx.say('opp.word', { word: word(c.card) });
      return;
    }
    const a = this.picked;
    this.picked = null;
    if (a === c) return void this.drawCard(c, false);
    if (opposites(a.card, c.card)) {
      a.done = c.done = true;
      this.drawCard(c, true);
      sfx.sparkle();
      void this.ctx.say('opp.pair', { a: word(a.card), b: word(c.card) });
      if (this.cards.every((x) => x.done)) {
        this.busy = true;
        await this.ctx.tw.wait(1.2);
        return void this.next();
      }
      return;
    }
    this.drawCard(a, false);
    this.wrong('opp.notpair', { a: word(a.card), b: word(c.card) });
  }

  private wrong(line: 'opp.notfind' | 'opp.notopp' | 'opp.notpair', vars: Record<string, string>) {
    this.misses++;
    this.wrongs++;
    sfx.boing();
    void this.ctx.say(line, vars);
    if (this.wrongs >= 2 && !this.glowing) {
      this.hints++;
      const r = this.round;
      this.glowing = this.plan.mode === 'find' ? this.cards.find((x) => word(x.card) === word(r.ask!))! : this.plan.mode === 'opposite' ? this.cards.find((x) => opposites(x.card, r.ask!))! : this.cards.find((x) => !x.done)!;
    }
  }

  private async right(cs: CardView[]) {
    this.busy = true;
    this.glowing = null;
    for (const c of cs) this.drawCard(c, true);
    sfx.sparkle();
    this.ctx.pet.cheer();
    await this.ctx.say('opp.yay');
    await this.ctx.tw.wait(0.3);
    await this.next();
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    sfx.tada();
    await this.ctx.say('opp.done');
    await this.ctx.tw.wait(0.4);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

class OppIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const a = picture({ concept: 'size', side: 0 });
    a.scale.set(0.8);
    a.position.set(-55, -80);
    const b = picture({ concept: 'size', side: 1 });
    b.scale.set(0.8);
    b.position.set(55, -80);
    c.addChild(a, b);
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const concept = rng.pick(['sky', 'temp', 'cup', 'lid'] as const);
  const a = picture({ concept, side: 0 });
  a.position.set(-70, 0);
  const b = picture({ concept, side: 1 });
  b.position.set(70, 0);
  c.addChild(a, b);
  return c;
}

export const oppositesGame: GameModule = {
  id: 'opposites',
  name: 'Opposites',
  titleLine: 'game.opposites',
  region: 'story-grove',
  skills: ['words', 'concepts', 'opposites', 'listening'],
  bands: ['lap', 'toddler', 'preschool', 'prek'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  coplayHint: 'Act them out together: stretch up big, curl up small, a happy face, a sad face.',
  offScreen: 'Play opposites with toys: put the teddy up high, then down low; open the box, close the box.',
  hubIcon: () => new OppIcon(),
  sticker,
  create: (ctx) => new Opposites(ctx),
};
