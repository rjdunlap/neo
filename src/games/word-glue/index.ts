import { Container, Graphics, Rectangle } from 'pixi.js';
import { swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { cardArt, iconArt, madeArt, partArt, type Made } from './art';
import {
  applyHint, canDrag, CARD, COMPOUNDS, currentAsk, drop, dropTarget, hintFor, MADE, makeRound, newState, planFor, restartState, SHELF,
  shelfLayout, tableCentre, tableLayout, type Ask, type Compound, type GlueState, type Pt,
} from './logic';

const LEVELS: BandLevels = {
  lap: { min: 1, max: 1 },
  toddler: { min: 1, max: 2 },
  preschool: { min: 2, max: 3 },
  prek: { min: 3, max: 3 },
  school: { min: 3, max: 3 },
};

/** The made thing is drawn about 160 across. */
const MADE_ART = 160;
/** A tap at level 1 lifts the picture but barely moves it: a release this close to home is a tap. */
const TAP_SLOP = 60;

/** Each level's authored first round leads its first round of a session (and every demonstration). */
const authoredShown = new Set<number>();

interface CardNode {
  key: string;
  node: Container;
  handle: DragHandle | null;
}

interface ShelfThing {
  made: Made;
  t: number;
  /** Still flying up to its slot; `join` puts it there when the flight ends. */
  flying: boolean;
}

class WordGlue implements Game {
  readonly s: GlueState;
  readonly hintLabel = 'Show a hint';
  cards: CardNode[] = [];
  busy = true;
  finished = false;

  private readonly backdrop: Backdrop;
  private readonly glow = new Graphics();
  private readonly cardLayer = new Container();
  private readonly madeLayer = new Container();
  private readonly shelfLayer = new Container();
  private readonly bubble = new Container();
  private readonly level: number;
  private view: View;
  private clock = 0;
  private shelf: ShelfThing[] = [];
  private showing: { made: Made; t: number } | null = null;
  /** The picture a held one would join if let go now. */
  private near: number | null = null;
  /** Level 1's Show a hint glows the pair for a moment; it counts nothing. */
  private hintPulse = 0;
  private restartWanted = false;
  private demoTouched = false;
  private shownAsk: Ask | null = null;
  private dead = false;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.level = planFor(ctx.level).level;
    const authored = !!ctx.demo || !authoredShown.has(this.level);
    if (authored && !ctx.demo) authoredShown.add(this.level);
    this.s = newState(makeRound(this.level, ctx.rng, authored));
    this.backdrop = new Backdrop({ sky: [0xd6efc8, 0xfff6e0], hills: [0x9fd3a8, 0x86c98f, 0x8fcf73], horizon: 0.36, clouds: 2, sun: true, seed: 233 }, ctx.view);
    for (const l of [this.glow, this.madeLayer, this.shelfLayer, this.bubble]) l.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.shelfLayer, this.glow, this.cardLayer, this.madeLayer, this.bubble);
  }

  start() {
    this.resize(this.view);
    void this.present(true);
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    const pts = this.points();
    this.cards.forEach((c, i) => {
      if (c.handle) c.handle.home = { ...pts[i] };
    });
    if (!this.busy) this.relayout();
    const slots = shelfLayout(v, this.s.round.asks.length);
    this.shelf.forEach((th, i) => {
      if (th.flying) return;
      this.ctx.tw.kill(th.made.node);
      th.made.node.position.set(slots[i].x, slots[i].y);
    });
    this.placeBubble();
    if (this.showing && !this.busy) this.showing.made.node.position.set(tableCentre(v, this.cards.length).x, tableCentre(v, this.cards.length).y);
  }

  update(dt: number) {
    this.clock += dt;
    if (this.hintPulse > 0) this.hintPulse -= dt;
    if (this.showing) {
      this.showing.t += dt;
      this.showing.made.alive(this.showing.t);
    }
    for (const th of this.shelf) {
      if (th.t < 2.5) {
        th.t += dt;
        th.made.alive(th.t);
      }
    }
    if (this.level === 3 && this.bubble.visible) this.bubble.y = this.bubbleY() + Math.sin(this.clock * 3) * 4;
    this.drawGlow();
  }

  destroy() {
    this.dead = true;
    for (const c of this.cards) c.handle?.destroy();
  }

  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.cards.some((c) => c.handle?.dragging)) return null;
    const pair = hintFor(this.s);
    const ask = currentAsk(this.s);
    if (!pair || !ask) return null;
    const card = (key: string) => this.cards.find((c) => c.key === key);
    if (this.level === 2 && this.s.index === 0 && !this.demoTouched) {
      // Touching is free: the finger first touches the picture that does not belong.
      const other = this.cards.find((c) => !pair.includes(c.key));
      this.demoTouched = true;
      if (other) return { tap: { on: other.node }, pause: 0.8 };
    }
    const from = card(pair[0]), to = card(pair[1]);
    if (!from || !to) return null;
    if (this.level === 1 && this.ctx.band === 'lap') return { tap: { on: from.node }, pause: 1 };
    return { drag: { on: from.node }, to: { on: to.node } };
  }

  restart() {
    if (this.finished) return;
    if (this.busy) {
      this.restartWanted = true;
      return;
    }
    this.doRestart();
  }

  askForHint() {
    if (this.busy || this.finished) return;
    const pair = applyHint(this.s);
    if (!pair) return;
    sfx.sparkle();
    if (this.level === 1) this.hintPulse = 2.5;
    void this.ctx.say('wordglue.hint');
  }

  /* -------------------------------------------------------------------------------------------- */

  /** Put every card not being held at its place (after a resize while busy). */
  private relayout() {
    const pts = this.points();
    this.cards.forEach((c, i) => {
      if (c.handle?.dragging) return;
      this.ctx.tw.kill(c.node);
      c.node.position.set(pts[i].x, pts[i].y);
    });
    this.placeBubble();
  }

  private points(): Pt[] {
    return tableLayout(this.view, Math.max(2, this.cards.length));
  }

  private doRestart() {
    this.restartWanted = false;
    restartState(this.s);
    for (const th of this.shelf) th.made.node.destroy({ children: true });
    this.shelf = [];
    this.shownAsk = null;
    sfx.whoosh();
    void this.present(true);
  }

  /** Lay out the ask in play: new pictures pop in (level 3 keeps its head's pictures between its two asks). */
  private async present(first = false) {
    const ask = currentAsk(this.s);
    if (!ask) return;
    this.busy = true;
    const same = this.shownAsk && this.shownAsk.pictures.join() === ask.pictures.join();
    this.shownAsk = ask;
    if (!same) {
      for (const c of this.cards) {
        c.handle?.destroy();
        c.node.destroy({ children: true });
      }
      this.cards = ask.pictures.map((key) => this.makeCard(key));
      const pts = this.points();
      this.cards.forEach((c, i) => {
        c.node.position.set(pts[i].x, pts[i].y);
        if (c.handle) c.handle.home = { ...pts[i] };
        c.node.scale.set(0.2);
        void this.ctx.tw.to(c.node.scale, { x: 1, y: 1 }, { duration: 0.4, delay: i * 0.08, ease: ease.outBack });
      });
      sfx.pop(5);
      await this.ctx.tw.wait(0.45 + this.cards.length * 0.08);
      if (this.dead) return;
    } else {
      for (const c of this.cards) c.node.visible = true;
    }
    this.busy = false;
    this.relayout();
    if (this.restartWanted) return this.doRestart();
    if (this.level === 1) {
      if (first) void this.ctx.instruct('wordglue.instruct.stick');
    } else if (this.level === 2) {
      void this.ctx.instruct('wordglue.instruct.make', { word: ask.entry.word });
    } else {
      this.hop(this.cardOf(ask.entry.first));
      void this.ctx.instruct('wordglue.ask', { head: ask.entry.second });
    }
  }

  private makeCard(key: string): CardNode {
    const node = cardArt(key, CARD);
    node.hitArea = new Rectangle(-CARD / 2, -CARD / 2, CARD, CARD);
    this.cardLayer.addChild(node);
    if (!canDrag(this.s, key)) {
      onTap(node, () => this.touch(key), { cooldown: 300 });
      return { key, node, handle: null };
    }
    const card: CardNode = { key, node, handle: null };
    card.handle = draggable(node, this.ctx.tw, {
      onPick: () => this.touch(key),
      onMove: (x, y) => (this.near = this.target(card, x, y)),
      onDrop: (x, y) => this.dropped(card, x, y),
    });
    return card;
  }

  /** Touch-down says the picture's word; at level 3 the asking friend asks again instead. */
  private touch(key: string) {
    if (this.finished) return;
    sfx.pop(6);
    const ask = currentAsk(this.s);
    if (this.level === 3 && ask && key === ask.entry.first) void this.ctx.say('wordglue.ask', { head: ask.entry.second });
    else void this.ctx.say('wordglue.word', { word: key });
  }

  private target(card: CardNode, x: number, y: number): number | null {
    const own = this.cards.indexOf(card);
    return dropTarget(this.cards.map((c) => c.handle?.home ?? { x: c.node.x, y: c.node.y }), own, x, y, this.level === 3 ? [0] : undefined);
  }

  private dropped(card: CardNode, x: number, y: number): boolean {
    this.near = null;
    if (this.finished || this.busy || !card.handle) return false;
    const own = this.cards.indexOf(card);
    const home = card.handle.home;
    let target = this.target(card, x, y);
    if (target === null && this.level === 1 && Math.hypot(x - home.x, y - home.y) < TAP_SLOP) target = own === 0 ? 1 : 0;
    if (target === null) return false;
    const other = this.cards[target];
    const out = drop(this.s, card.key, other.key);
    if (out.kind === 'ignore') return false;
    if (out.kind === 'right' || out.kind === 'assist') {
      void this.join(out.entry, out.kind === 'right' ? card : null);
      // A supported join flies the right pair in; the picture let go floats home.
      return out.kind === 'right';
    }
    const ask = this.shownAsk!;
    if (this.level === 3 && out.made) void this.wrongMade(out.made, ask, card);
    else void this.wrongPair(card, other, ask);
    return false;
  }

  private cardOf(key: string): CardNode | undefined {
    return this.cards.find((c) => c.key === key);
  }

  private hop(card: CardNode | undefined) {
    if (!card) return;
    this.ctx.tw.kill(card.node.scale);
    card.node.scale.set(1.12, 0.9);
    void this.ctx.tw.to(card.node.scale, { x: 1, y: 1 }, { duration: 0.4, ease: ease.outBack });
  }

  /** Level 2: the pair wobbles, a soft boing, and the pet says the asked word and its parts. */
  private async wrongPair(card: CardNode, other: CardNode, ask: Ask) {
    this.busy = true;
    sfx.boing();
    for (const c of [card, other]) {
      this.ctx.tw.kill(c.node);
      void this.ctx.tw.to(c.node, { rotation: 0.14 }, { duration: 0.08 }).then(() => this.ctx.tw.to(c.node, { rotation: -0.1 }, { duration: 0.1 })).then(() => this.ctx.tw.to(c.node, { rotation: 0 }, { duration: 0.12 }));
    }
    await this.ctx.say('wordglue.miss.make', { word: ask.entry.word, first: ask.entry.first, second: ask.entry.second });
    if (this.dead) return;
    this.busy = false;
    this.relayout();
    if (this.restartWanted) this.doRestart();
  }

  /** Level 3: the wrong thing appears for a moment, the pet says what it is and who it is for, and it pops apart. */
  private async wrongMade(made: Compound, ask: Ask, card: CardNode) {
    this.busy = true;
    sfx.boing();
    const head = this.cards[0];
    card.node.visible = false;
    head.node.visible = false;
    const shown = this.show(made);
    await this.ctx.say('wordglue.miss.for', { made: made.word, meaning: made.meaning, head: ask.entry.second });
    if (this.dead) return;
    sfx.pop(3);
    await this.ctx.tw.to(shown.node.scale, { x: 0.01, y: 0.01 }, { duration: 0.25 });
    if (this.dead) return;
    shown.node.destroy({ children: true });
    this.showing = null;
    card.node.visible = true;
    head.node.visible = true;
    this.busy = false;
    this.relayout();
    if (this.restartWanted) return this.doRestart();
    this.hop(this.cardOf(ask.entry.first));
    void this.ctx.say('wordglue.ask', { head: ask.entry.second });
  }

  private show(entry: Compound): Made {
    const made = madeArt(entry.word);
    const c = tableCentre(this.view, this.cards.length);
    made.node.position.set(c.x, c.y);
    made.node.scale.set(0.2);
    this.madeLayer.addChild(made.node);
    this.showing = { made, t: 0 };
    void this.ctx.tw.to(made.node.scale, { x: MADE / MADE_ART, y: MADE / MADE_ART }, { duration: 0.35, ease: ease.outBack });
    return made;
  }

  /** The two pictures hop together with a two-note pop, the made thing appears and comes alive, then goes to the shelf. */
  private async join(entry: Compound, dragged: CardNode | null) {
    this.busy = true;
    for (const c of this.cards) if (c.handle) c.handle.enabled = false;
    const a = this.cardOf(entry.first), b = this.cardOf(entry.second);
    const centre = tableCentre(this.view, this.cards.length);
    const parts = [a, b].filter((c): c is CardNode => !!c);
    // A supported join flies the right pair in; a dragged one is already on its partner.
    await Promise.all(parts.map((c) => {
      this.ctx.tw.kill(c.node);
      return this.ctx.tw.to(c.node, { x: centre.x + (c === dragged ? 10 : 0), y: centre.y }, { duration: 0.25, ease: ease.inOutSine });
    }));
    if (this.dead) return;
    sfx.pop(5);
    void this.ctx.tw.wait(0.12).then(() => !this.dead && sfx.pop(9));
    for (const c of parts) c.node.visible = false;
    this.ctx.particles.burst(centre.x, centre.y, { kind: 'star', colors: [swatch.yellow.fill, swatch.pink.fill, swatch.blue.fill], count: 12, speed: [80, 200], gravity: 200, life: [0.5, 0.9] });
    const made = this.show(entry);
    this.bubble.visible = false;
    await this.ctx.say('wordglue.join', { first: entry.first, second: entry.second, word: entry.word });
    if (this.dead) return;
    await this.ctx.tw.wait(0.5);
    if (this.dead) return;
    // To the shelf: decoration only.
    this.showing = null;
    const slot = shelfLayout(this.view, this.s.round.asks.length)[this.shelf.length];
    this.madeLayer.removeChild(made.node);
    this.shelfLayer.addChild(made.node);
    const thing: ShelfThing = { made, t: 3, flying: true };
    this.shelf.push(thing);
    void this.ctx.tw.to(made.node, { x: slot.x, y: slot.y }, { duration: 0.45, ease: ease.inOutSine });
    void this.ctx.tw.to(made.node.scale, { x: SHELF / MADE_ART, y: SHELF / MADE_ART }, { duration: 0.45 });
    // Waited on rather than the flight itself, so a resize mid-flight can never leave the round stuck.
    await this.ctx.tw.wait(0.5);
    if (this.dead) return;
    thing.flying = false;
    const now = shelfLayout(this.view, this.s.round.asks.length)[this.shelf.length - 1];
    this.ctx.tw.kill(made.node);
    made.node.position.set(now.x, now.y);
    // The pictures go back to their places for the next ask (level 3 keeps them for its head's second ask).
    const pts = this.points();
    this.cards.forEach((c, i) => {
      this.ctx.tw.kill(c.node);
      c.node.position.set(pts[i].x, pts[i].y);
      if (c.handle) c.handle.enabled = true;
    });
    if (this.s.done) return void this.celebrate();
    await this.present();
  }

  private async celebrate() {
    this.finished = true;
    this.busy = true;
    for (const c of this.cards) {
      c.handle?.destroy();
      c.node.visible = false;
    }
    this.bubble.visible = false;
    for (const th of this.shelf) th.t = 0;
    sfx.tada();
    this.ctx.pet.cheer();
    await this.ctx.say('wordglue.done');
    if (this.dead) return;
    await this.ctx.tw.wait(0.6);
    if (this.dead) return;
    this.ctx.finish({ misses: this.s.misses, hints: this.s.hints });
  }

  /** Level 3: a little bubble over the asking friend shows the thing in the middle. */
  private placeBubble() {
    const ask = currentAsk(this.s);
    this.bubble.removeChildren().forEach((c) => c.destroy({ children: true }));
    if (this.level !== 3 || !ask || this.finished) {
      this.bubble.visible = false;
      return;
    }
    const asker = this.cardOf(ask.entry.first);
    if (!asker) return;
    const g = new Graphics().roundRect(-44, -36, 88, 72, 24).fill(0xffffff).stroke({ width: 4, color: swatch.purple.light }).poly([-10, 34, 10, 34, 0, 50]).fill(0xffffff);
    const icon = partArt(ask.entry.second);
    icon.scale.set(0.42);
    this.bubble.addChild(g, icon);
    this.bubble.x = asker.handle?.home.x ?? asker.node.x;
    this.bubble.y = this.bubbleY();
    this.bubble.visible = true;
  }

  private bubbleY(): number {
    const ask = currentAsk(this.s);
    const asker = ask && this.cardOf(ask.entry.first);
    return (asker?.handle?.home.y ?? 0) - CARD / 2 - 46;
  }

  private drawGlow() {
    const g = this.glow.clear();
    if (this.finished) return;
    const pulse = 7 + 2 * Math.sin(this.clock * 6);
    const ring = (c: CardNode | undefined, color: number, width: number) => {
      if (!c || !c.node.visible) return;
      g.roundRect(c.node.x - CARD / 2 - 10, c.node.y - CARD / 2 - 10, CARD + 20, CARD + 20, 34).stroke({ width, color });
    };
    // Near feedback: whichever picture a held one would join glows faintly, the same for every picture.
    if (this.near !== null) ring(this.cards[this.near], swatch.white.fill, 6);
    const ask = currentAsk(this.s);
    if (!ask || this.busy) return;
    if (this.s.glow || this.hintPulse > 0) {
      if (this.level === 3) ring(this.cardOf(ask.entry.first), swatch.yellow.fill, pulse);
      else for (const k of [ask.entry.first, ask.entry.second]) ring(this.cardOf(k), swatch.yellow.fill, pulse);
    }
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const made = madeArt(rng.pick(COMPOUNDS).word);
  made.alive(3);
  made.node.scale.set(0.85);
  made.node.y = 50;
  const c = new Container();
  c.addChild(made.node);
  return c;
}

export const wordGlue: GameModule = {
  id: 'word-glue',
  name: 'Word Glue',
  titleLine: 'game.word-glue',
  region: 'story-grove',
  skills: ['compound-words', 'vocabulary', 'word-meaning'],
  bands: ['lap', 'toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  coplayHint: 'Silly Compounds: take turns inventing names for things in the room, like a spoon hat or a sock house. Let her name one first.',
  offScreen: 'Find a toothbrush, a doorbell or a raincoat at home and say its two little words.',
  hubIcon: () => new WigglyIcon(iconArt()),
  touchDemo: true,
  sticker,
  create: (ctx) => new WordGlue(ctx),
};
