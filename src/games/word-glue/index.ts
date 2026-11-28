import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { cardArt, iconArt, inventedArt, madeArt, partArt, type Made } from './art';
import { endingArt, endingTileArt } from './ending-art';
import {
  LEVELS,
  applyHint,
  BIG,
  BIG_LEVEL,
  bigJoin,
  canDrag,
  CARD,
  COMPOUNDS,
  currentAsk,
  DOER_LEVEL,
  EMPTY_CUP,
  ENDING_LEVEL,
  endingLayout,
  FULL_CUP,
  drop,
  dropTarget,
  headFixed,
  hintFor,
  KIND_LEVEL,
  kindLayout,
  MADE,
  makeRound,
  NAME_LEVEL,
  nameIt,
  nameLayout,
  newState,
  place,
  planFor,
  PAIRED_SHELF,
  PERSON,
  REVERSED_LEVEL,
  reversedLayout,
  restartState,
  rightChoice,
  SHELF,
  shelfLayout,
  tableCentre,
  tableLayout,
  takeBack,
  tap,
  type Ask,
  type Compound,
  type Ending,
  type GlueState,
  type Pt,
} from './logic';
import { actionLine, choiceLine, doerLine, endingLine, endingTileLine, nameLine } from './voice';

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
  made?: Made;
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
  /** The next ask's line, waiting behind `wordglue.join` (U7 R4); `askGen` drops a stale wait. */
  private unasked: (() => void) | null = null;
  private askGen = 0;
  private endingPrompt: Promise<unknown> | null = null;
  private endingHop: { node: Container; to: number; progress: number } | null = null;
  finished = false;

  private readonly backdrop: Backdrop;
  private readonly glow = new Graphics();
  private readonly cardLayer = new Container();
  private readonly madeLayer = new Container();
  /** Level 7: the two name cards' outlines and the pause dot between them. */
  private readonly nameCards = new Graphics();
  private readonly shelfLayer = new Container();
  private readonly bubble = new Container();
  /** Level 4: a layer over the whole view takes every touch. */
  private readonly touchLayer = new Container();
  private readonly level: number;
  private view: View;
  private clock = 0;
  private shelf: ShelfThing[] = [];
  private choiceAnimation: { made: Made; t: number } | null = null;
  private showing: { made: Made; t: number } | null = null;
  /** The picture a held one would join if let go now. */
  private near: number | null = null;
  /** Level 1's Show a hint glows the pair for a moment; it counts nothing. */
  private hintPulse = 0;
  private restartWanted = false;
  private demoTouched = false;
  private shownAsk: Ask | null = null;
  /** The finger and picture that started a choice. */
  private held: { id: number; key: string; node: Container; canAnswer: boolean } | null = null;
  private dead = false;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.level = planFor(ctx.level).level;
    const authored = !!ctx.demo || !authoredShown.has(this.level);
    if (authored && !ctx.demo) authoredShown.add(this.level);
    this.s = newState(makeRound(this.level, ctx.rng, authored));
    this.backdrop = new Backdrop(
      {
        sky: [0xd6efc8, 0xfff6e0],
        hills: [0x9fd3a8, 0x86c98f, 0x8fcf73],
        horizon: 0.36,
        clouds: 2,
        sun: !this.reversed,
        seed: 233,
      },
      ctx.view,
    );
    for (const l of [this.glow, this.madeLayer, this.shelfLayer, this.bubble, this.nameCards])
      l.eventMode = 'none';
    ctx.stage.addChild(
      this.backdrop,
      this.shelfLayer,
      this.nameCards,
      this.glow,
      this.cardLayer,
      this.madeLayer,
      this.bubble,
    );
    // Levels 5 and 7: the thing on the table repeats the question when tapped.
    if (this.kind || this.naming || this.ending) this.madeLayer.eventMode = 'passive';
    if (this.choosing) {
      ctx.listen(
        window,
        'pointercancel',
        (e) => {
          if (e.pointerId === this.held?.id) this.cancelChoice();
        },
        true,
      );
      ctx.listen(document, 'visibilitychange', () => this.cancelChoice());
    }
    if (this.big) {
      // The whole view joins the big picture: the cards take no touches of their own.
      this.cardLayer.eventMode = 'none';
      ctx.stage.addChild(this.touchLayer);
      onTap(this.touchLayer, () => this.bigTouch(), { cooldown: 300 });
    }
  }

  /** Level 4, lap's opening: one big picture, and a touch anywhere flies its partner in. */
  get big() {
    return this.level === BIG_LEVEL;
  }

  /** Level 5: a made thing over its two parts, and a tap on the part it is. */
  get kind() {
    return this.level === KIND_LEVEL;
  }

  private get reversed() {
    return this.level === REVERSED_LEVEL;
  }

  /** Level 7: a thing nobody has named, two name cards and its three pictures. */
  private get naming() {
    return this.level === NAME_LEVEL;
  }

  /** Level 8: an action joins the person to make someone who does it. */
  private get doing() {
    return this.level === DOER_LEVEL;
  }

  private get ending() {
    return this.level === ENDING_LEVEL;
  }

  /** Levels 5 to 7 and 9 answer by tapping: a touch-down says the picture and only a release on it acts. */
  private get choosing() {
    return this.kind || this.reversed || this.naming || this.ending;
  }

  /** Where a made thing appears: the table's centre, above the two parts at level 5, or above the name cards at level 7. */
  private madeSpot(): Pt {
    if (this.ending) return endingLayout(this.view).made;
    if (this.naming) return nameLayout(this.view).made;
    return this.kind ? kindLayout(this.view).made : tableCentre(this.view, this.cards.length);
  }

  /** A card's full size: level 4's are big. */
  private scaleOf() {
    return this.big ? BIG / CARD : 1;
  }

  start() {
    this.resize(this.view);
    void this.present(true);
  }

  resize(v: View) {
    this.cancelChoice();
    this.view = v;
    this.backdrop.resize(v);
    this.touchLayer.hitArea = new Rectangle(0, 0, v.w, v.h);
    const pts = this.points();
    this.cards.forEach((c, i) => {
      if (c.handle) c.handle.home = { ...pts[i] };
    });
    if (!this.busy || this.reversed || this.ending) this.relayout();
    // Level 7's name cards follow the view even while a line plays.
    else this.drawNameCards();
    const slots = this.shelfSlots();
    this.shelf.forEach((th, i) => {
      if (th.flying) return;
      this.ctx.tw.kill(th.made.node);
      th.made.node.position.set(slots[i].x, slots[i].y);
    });
    this.placeBubble();
    this.placeEndingHop();
    if (this.showing && (!this.busy || this.kind || this.naming || this.ending)) {
      this.ctx.tw.kill(this.showing.made.node);
      this.showing.made.node.position.set(this.madeSpot().x, this.madeSpot().y);
    }
  }

  update(dt: number) {
    this.clock += dt;
    this.placeEndingHop();
    if (this.hintPulse > 0) this.hintPulse -= dt;
    const animation = this.choiceAnimation ?? this.showing;
    if (animation) {
      animation.t += dt;
      animation.made.alive(animation.t);
    }
    for (const th of this.shelf) {
      if (th.t < 2.5) {
        th.t += dt;
        th.made.alive(th.t);
      }
    }
    if (this.level === 3 && this.bubble.visible)
      this.bubble.y = this.bubbleY() + Math.sin(this.clock * 3) * 4;
    this.drawGlow();
  }

  destroy() {
    this.dead = true;
    for (const c of this.cards) c.handle?.destroy();
  }

  /** Guided first play: its demonstration tries the other card once, so the hand shows the right one. The bot's own flags are put back. */
  showMove(): TouchIntent | null {
    const demoTouched = this.demoTouched;
    this.demoTouched = true;
    const move = this.autotouch();
    this.demoTouched = demoTouched;
    return move;
  }

  autotouch(): TouchIntent | null {
    // Level 4: the ghost finger touches the grass beside the big picture, since anywhere joins it.
    if (this.big)
      return this.busy || this.finished || !currentAsk(this.s)
        ? null
        : {
            tap: { on: this.touchLayer, x: this.view.w * 0.18, y: this.view.h * 0.9 },
            receiver: this.touchLayer,
          };
    if (
      this.busy ||
      this.finished ||
      this.unasked ||
      this.endingPrompt ||
      this.cards.some((c) => c.handle?.dragging)
    )
      return null;
    if (this.naming) return this.nameTouch();
    if (this.choosing) {
      const key = rightChoice(this.s);
      if ((this.reversed || this.ending) && this.s.index === 0 && !this.demoTouched) {
        const other = this.ending
          ? this.cardOf(key === FULL_CUP ? EMPTY_CUP : FULL_CUP)
          : this.cards.find((c) => c.key !== key);
        this.demoTouched = true;
        if (other)
          return {
            trace: { on: other.node },
            via: [this.ending ? { on: other.node, y: CARD / 2 + 40 } : { on: other.node, x: MADE / 2 + 40 }],
            pause: 0.7,
          };
      }
      const right = this.cards.find((c) => c.key === key);
      return right ? { tap: { on: right.node }, pause: 1 } : null;
    }
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
    const from = card(pair[0]),
      to = card(pair[1]);
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
    if (this.level === 1 || this.big) this.hintPulse = 2.5;
    if (this.choosing) {
      if (!this.askNow()) this.askChoice();
      return;
    }
    // Level 4 has one picture on screen: the hint says what to do, touch anywhere.
    void this.ctx.say(this.big ? 'wordglue.instruct.big' : 'wordglue.hint');
  }

  /* -------------------------------------------------------------------------------------------- */

  /** Level 7's ghost finger: it touches the head and slides off (free), then taps a detail and the head. */
  private nameTouch(): TouchIntent | null {
    const ask = currentAsk(this.s);
    const row = ask?.invented;
    if (!ask || !row) return null;
    const card = (key: string) => this.cardOf(key);
    if (this.s.index === 0 && !this.demoTouched) {
      this.demoTouched = true;
      const head = card(row.head);
      if (head)
        return { trace: { on: head.node }, via: [{ on: head.node, x: CARD / 2 + 40, y: 0 }], pause: 0.7 };
    }
    const [a, b] = this.s.slots;
    // A picture in the wrong card comes back out first.
    const out = a === row.head ? a : b !== null && b !== row.head ? b : null;
    if (out) return { tap: { on: card(out)!.node }, pause: 0.6 };
    const next = a === null ? ask.pictures.find((k) => row.details.includes(k))! : row.head;
    const c = card(next);
    return c ? { tap: { on: c.node }, pause: 0.8 } : null;
  }

  /** Put every card not being held at its place (after a resize while busy). */
  private relayout() {
    const pts = this.points();
    this.cards.forEach((c, i) => {
      if (c.handle?.dragging) return;
      this.ctx.tw.kill(c.node);
      c.node.position.set(pts[i].x, pts[i].y);
    });
    this.placeBubble();
    this.drawNameCards();
  }

  /** Level 7: the two empty name cards with a small pause dot between them. */
  private drawNameCards() {
    const g = this.nameCards.clear();
    if (!this.naming || this.finished) return;
    const { cards, dot } = nameLayout(this.view);
    for (const p of cards)
      g.roundRect(p.x - CARD / 2, p.y - CARD / 2, CARD, CARD, 28)
        .fill({ color: 0xffffff, alpha: 0.45 })
        .stroke({ width: 6, color: swatch.purple.light });
    g.circle(dot.x, dot.y, 9).fill(swatch.purple.light);
  }

  private points(): Pt[] {
    if (this.big) {
      // The big picture in the middle; its partner waits off the right edge until a touch flies it in.
      const c = tableCentre(this.view, 2);
      return [c, { x: this.view.w + BIG, y: c.y }];
    }
    if (this.ending) return endingLayout(this.view).tiles;
    if (this.kind) return kindLayout(this.view).parts;
    if (this.reversed) return reversedLayout(this.view);
    if (this.naming) {
      // A picture in a name card sits on it; the rest wait in their places in the row.
      const { cards, tiles } = nameLayout(this.view);
      return this.cards.map((c, i) => {
        const slot = this.s.slots.indexOf(c.key);
        return slot >= 0 ? cards[slot] : tiles[i];
      });
    }
    return tableLayout(this.view, Math.max(2, this.cards.length));
  }

  private doRestart() {
    this.restartWanted = false;
    this.unasked = null;
    this.endingPrompt = null;
    this.askGen++;
    restartState(this.s);
    for (const th of this.shelf) th.made.node.destroy({ children: true });
    this.shelf = [];
    this.shownAsk = null;
    this.clearShowing();
    sfx.whoosh();
    void this.present(true);
  }

  /** Lay out the ask in play: new pictures pop in (level 3 keeps its head's pictures between its two asks). */
  private async present(first = false, said?: Promise<unknown>) {
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
      this.held = null;
      // Levels 5 and 7: the thing is on the table from the start and comes alive as it is asked about.
      if (this.kind) this.showKind(ask.entry);
      if (ask.invented) this.showInvented(ask.invented.head);
      if (ask.ending) this.showEnding(ask.ending, 'neutral');
      const pts = this.points();
      const k = this.scaleOf();
      this.cards.forEach((c, i) => {
        c.node.position.set(pts[i].x, pts[i].y);
        if (c.handle) c.handle.home = { ...pts[i] };
        if (this.big) {
          c.node.scale.set(k);
          if (i > 0) return;
          // The next big picture rolls in from the left.
          c.node.x = -BIG;
          c.node.rotation = -Math.PI * 2;
          void this.ctx.tw.to(c.node, { x: pts[0].x, rotation: 0 }, { duration: 0.45, ease: ease.outBack });
          return;
        }
        c.node.scale.set(0.2);
        void this.ctx.tw.to(
          c.node.scale,
          { x: 1, y: 1 },
          { duration: 0.4, delay: i * 0.08, ease: ease.outBack },
        );
      });
      sfx.pop(5);
      await this.ctx.tw.wait(0.45 + this.cards.length * 0.08);
      if (this.dead) return;
    } else {
      for (const c of this.cards) c.node.visible = true;
    }
    if (this.ending && first) {
      await this.ctx.say('wordglue.instruct.ending');
      if (this.dead) return;
    }
    this.busy = false;
    this.relayout();
    if (this.restartWanted) return this.doRestart();
    const say = () => {
      if (this.big) {
        if (first) void this.ctx.instruct('wordglue.instruct.big');
      } else if (this.level === 1) {
        if (first) void this.ctx.instruct('wordglue.instruct.stick');
      } else if (this.level === 2) {
        void this.ctx.instruct('wordglue.instruct.make', { word: ask.entry.word });
      } else if (this.choosing) {
        if (this.showing) this.showing.t = 0;
        this.askChoice();
      } else if (this.doing) {
        // No hop: the asked word's action is the answer, so nothing on the table points at it.
        if (!first) return this.askDoer();
        void this.ctx.say('wordglue.instruct.doer').then(() => {
          // A miss during the instruction has already asked again.
          if (!this.dead && !this.finished && !this.busy && !this.s.wrongDrops && currentAsk(this.s) === ask)
            this.askDoer();
        });
      } else {
        this.hop(this.cardOf(ask.entry.first));
        void this.ctx.instruct('wordglue.ask', { head: ask.entry.second });
      }
    };
    if (!said || this.level === 1 || this.big) return say();
    // The ask waits for the join, or is said at her first touch or by the guide.
    this.unasked = say;
    const gen = ++this.askGen;
    void said.then(() => {
      if (gen === this.askGen) this.askNow();
    });
  }

  /** Level 8: the word to make, the line the pet repeats. */
  private askDoer() {
    const ask = currentAsk(this.s);
    if (ask) void this.ctx.instruct(doerLine(ask.entry.word, 'ask'));
  }

  /** Says the waiting ask, if there is one. */
  private askNow() {
    const say = this.unasked;
    if (!say || this.finished || this.dead) return false;
    this.unasked = null;
    this.askGen++;
    say();
    return true;
  }

  /** The guide was tapped while the next ask waits: say it, not the ask before it. */
  sayWaitingAsk() {
    return this.askNow();
  }

  private makeCard(key: string): CardNode {
    const size = this.reversed ? MADE : CARD;
    const made = this.reversed ? madeArt(key) : undefined;
    const ending = currentAsk(this.s)?.ending;
    const node = cardArt(key, size, ending?.base === key ? endingTileArt(ending.base) : made?.node);
    node.hitArea = new Rectangle(-size / 2, -size / 2, size, size);
    this.cardLayer.addChild(node);
    if (this.big) {
      node.eventMode = 'none';
      return { key, node, handle: null };
    }
    if (ending?.base === key) {
      onTap(
        node,
        () => {
          if (!this.busy) this.touch(key);
        },
        { cooldown: 300 },
      );
      return { key, node, handle: null };
    }
    if (this.choosing) {
      onTap(node, (e) => this.hold(key, node, e.pointerId), { cooldown: 300 });
      node.on('pointerup', (e) => this.release(node, e, true));
      node.on('pointerupoutside', (e) => this.release(node, e, false));
      return { key, node, made, handle: null };
    }
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
    // Her first touch before the ask is heard says the ask, not the picture's word.
    if (this.askNow()) return;
    const ask = currentAsk(this.s);
    if (this.level === 3 && ask && key === ask.entry.first)
      void this.ctx.say('wordglue.ask', { head: ask.entry.second });
    else if (this.doing) void this.ctx.say(key === PERSON ? 'wordglue.doer.person' : actionLine(key));
    else if (this.reversed) void this.ctx.say(choiceLine(key, 'name'));
    else if (ask?.ending) {
      const line =
        key === FULL_CUP
          ? 'wordglue.ending.cup.full'
          : key === EMPTY_CUP
            ? 'wordglue.ending.cup.empty'
            : endingTileLine(ask.ending.base);
      void this.ctx.say(line);
    } else void this.ctx.say('wordglue.word', { word: key });
  }

  /** The question of the ask in play, in the order this ask says its two parts. */
  private askChoice() {
    const ask = currentAsk(this.s);
    if (!ask) return;
    if (ask.ending) {
      const prompt = this.ctx.instruct(endingLine(ask.entry.word, 'ask'));
      this.endingPrompt = prompt;
      void prompt.then(() => {
        if (this.endingPrompt === prompt) this.endingPrompt = null;
      });
      return;
    }
    if (ask.other) {
      void this.ctx.instruct(choiceLine(ask.entry.word, 'ask'));
      return;
    }
    if (ask.invented) {
      void this.ctx.instruct('wordglue.instruct.name');
      return;
    }
    const a = ask.saidFirst ?? ask.entry.first;
    const b = a === ask.entry.first ? ask.entry.second : ask.entry.first;
    void this.ctx.instruct('wordglue.instruct.kind', { word: ask.entry.word, a, b });
  }

  private hold(key: string, node: Container, id: number) {
    if (this.finished || this.dead || this.busy || this.held) return;
    // A touch that starts a waiting question cannot also answer it.
    this.held = { id, key, node, canAnswer: !this.unasked && !this.endingPrompt };
    this.ctx.tw.kill(node.scale);
    node.scale.set(1.1);
    this.touch(key);
  }

  private cancelChoice() {
    const held = this.held;
    this.held = null;
    if (!held || held.node.destroyed) return;
    this.ctx.tw.kill(held.node.scale);
    void this.ctx.tw.to(held.node.scale, { x: 1, y: 1 }, { duration: 0.2, ease: ease.outBack });
  }

  private release(node: Container, e: FederatedPointerEvent, onIt: boolean) {
    const held = this.held;
    if (this.dead || held?.id !== e.pointerId || held.node !== node) return;
    this.cancelChoice();
    if (!onIt || !held.canAnswer || this.finished || this.busy) return;
    const local = node.toLocal(e.global);
    if (!node.hitArea?.contains(local.x, local.y)) return;
    const ask = this.shownAsk;
    if (this.naming) return this.nameTap(held.key);
    const out = tap(this.s, held.key);
    if (!ask || out.kind === 'ignore') return;
    if (out.kind === 'wrong') void this.wrongChoice(held.key, ask);
    else if (ask.ending) void this.joinEnding(ask.ending, out.entry);
    else if (ask.other) void this.joinReversed(ask);
    else void this.joinKind(out.entry);
  }

  private async wrongChoice(key: string, ask: Ask) {
    this.busy = true;
    sfx.boing();
    const c = this.cardOf(key);
    if (c) {
      this.ctx.tw.kill(c.node);
      void this.ctx.tw
        .to(c.node, { rotation: 0.14 }, { duration: 0.08 })
        .then(() => this.ctx.tw.to(c.node, { rotation: -0.1 }, { duration: 0.1 }))
        .then(() => this.ctx.tw.to(c.node, { rotation: 0 }, { duration: 0.12 }));
    }
    if (ask.ending) await this.ctx.say(endingLine(ask.entry.word, 'wrong'));
    else if (ask.other) await this.ctx.say(choiceLine(ask.entry.word, 'wrong'));
    else
      await this.ctx.say('wordglue.kind.wrong', {
        word: ask.entry.word,
        first: ask.entry.first,
        second: ask.entry.second,
        meaning: ask.entry.meaning,
      });
    if (this.dead) return;
    this.busy = false;
    this.relayout();
    // A short line can end before the wobble does; never leave the picture tilted.
    if (c && !c.node.destroyed) c.node.rotation = 0;
    if (this.restartWanted) return this.doRestart();
    if (!ask.other && !ask.ending) this.askChoice();
  }

  private async joinReversed(ask: Ask) {
    this.busy = true;
    const right = this.cardOf(ask.entry.word)!;
    sfx.pop(5);
    const said = this.ctx.say(choiceLine(ask.entry.word, 'right'));
    // The chosen picture comes alive while both names are spoken. Keep the card positions current if the view turns.
    this.choiceAnimation = right.made ? { made: right.made, t: 0 } : null;
    await this.ctx.tw.wait(1.1);
    this.choiceAnimation = null;
    if (this.dead) return;
    const pair = this.cards.map((card) => {
      const made = card.made!;
      made.node.position.copyFrom(card.node.position);
      card.node.visible = false;
      this.madeLayer.addChild(made.node);
      return made;
    });
    await this.shelve(pair, said);
  }

  /** Level 5, the right part (or the supported finish): it hops into the made thing, which then goes to the shelf. */
  private async joinKind(entry: Compound) {
    const made = this.showing?.made;
    const right = this.cardOf(entry.second);
    if (!made || !right) return;
    this.busy = true;
    const spot = this.madeSpot();
    this.ctx.tw.kill(right.node);
    await this.ctx.tw.to(right.node, { x: spot.x, y: spot.y }, { duration: 0.3, ease: ease.inOutSine });
    if (this.dead) return;
    sfx.pop(5);
    void this.ctx.tw.wait(0.12).then(() => !this.dead && sfx.pop(9));
    for (const c of this.cards) c.node.visible = false;
    this.ctx.particles.burst(spot.x, spot.y, {
      kind: 'star',
      colors: [swatch.yellow.fill, swatch.pink.fill, swatch.blue.fill],
      count: 12,
      speed: [80, 200],
      gravity: 200,
      life: [0.5, 0.9],
    });
    if (this.showing) this.showing.t = 0;
    const said = this.ctx.say('wordglue.kind.right', {
      word: entry.word,
      second: entry.second,
      meaning: entry.meaning,
    });
    await this.shelve([made], said);
  }

  private async joinEnding(ending: Ending, entry: Compound) {
    this.busy = true;
    const base = this.cardOf(ending.base)!;
    const cup = this.cardOf(entry.second)!;
    const hop = { node: base.node, to: this.cards.indexOf(cup), progress: 0 };
    this.endingHop = hop;
    await this.ctx.tw.to(hop, { progress: 1 }, { duration: 0.38, ease: ease.inOutSine });
    this.endingHop = null;
    if (this.dead) return;
    for (const card of this.cards) card.node.visible = false;
    const made = this.showEnding(ending, entry.second === FULL_CUP ? 'full' : 'without');
    made.node.scale.set((MADE / MADE_ART) * 0.84);
    void this.ctx.tw.to(
      made.node.scale,
      { x: MADE / MADE_ART, y: MADE / MADE_ART },
      { duration: 0.32, ease: ease.outBack },
    );
    sfx.pop(5);
    await this.shelve([made], this.ctx.say(endingLine(entry.word, 'right')));
  }

  private placeEndingHop() {
    const hop = this.endingHop;
    if (!hop) return;
    const tiles = endingLayout(this.view).tiles;
    const start = tiles[0];
    const end = tiles[hop.to];
    hop.node.position.set(
      start.x + (end.x - start.x) * hop.progress,
      start.y - 48 * Math.sin(Math.PI * hop.progress),
    );
  }

  private showEnding(ending: Ending, state: Parameters<typeof endingArt>[1]): Made {
    this.clearShowing();
    const made = endingArt(ending, state);
    const spot = this.madeSpot();
    made.node.position.set(spot.x, spot.y);
    made.node.scale.set(MADE / MADE_ART);
    this.madeLayer.addChild(made.node);
    this.showing = { made, t: 0 };
    if (state === 'neutral') this.tapToAsk(made);
    return made;
  }

  /** Level 7: a tap sends a picture to the first empty name card, or takes one in a card back out; two full cards are judged. */
  private nameTap(key: string) {
    if (takeBack(this.s, key) !== null) {
      sfx.pop(3);
      this.settleTiles();
      return;
    }
    const slot = place(this.s, key);
    if (slot === null) return;
    this.settleTiles();
    if (this.s.slots.every((k) => k !== null)) void this.judgeName();
  }

  /** Level 7: every picture glides to its name card or back to its place in the row. */
  private settleTiles(duration = 0.22) {
    const pts = this.points();
    this.cards.forEach((c, i) => {
      this.ctx.tw.kill(c.node);
      void this.ctx.tw.to(c.node, { x: pts[i].x, y: pts[i].y }, { duration, ease: ease.inOutSine });
    });
  }

  /** Level 7: the pet says the name in the two cards; a name with the thing last joins, any other teaches and empties the cards. */
  private async judgeName() {
    this.busy = true;
    await this.ctx.tw.wait(0.26);
    if (this.dead) return;
    const [first, last] = this.s.slots as [string, string];
    const out = nameIt(this.s);
    if (out.kind === 'ignore') {
      this.busy = false;
      return;
    }
    if (out.kind === 'wrong') {
      sfx.boing();
      for (const k of [first, last]) {
        const c = this.cardOf(k);
        if (!c) continue;
        this.ctx.tw.kill(c.node);
        void this.ctx.tw
          .to(c.node, { rotation: 0.14 }, { duration: 0.08 })
          .then(() => this.ctx.tw.to(c.node, { rotation: -0.1 }, { duration: 0.1 }))
          .then(() => this.ctx.tw.to(c.node, { rotation: 0 }, { duration: 0.12 }));
      }
      await this.ctx.say(nameLine(out.row.head, first, last));
      if (this.dead) return;
      for (const c of this.cards) c.node.rotation = 0;
      this.settleTiles(0.3);
      await this.ctx.tw.wait(0.32);
      if (this.dead) return;
      this.busy = false;
      this.relayout();
      if (this.restartWanted) return this.doRestart();
      this.askChoice();
      return;
    }
    // A supported name: the head goes to the last card and her detail to the first.
    if (out.kind === 'assist') {
      this.s.slots = [out.first, out.row.head];
      this.settleTiles(0.3);
      this.s.slots = [null, null];
      await this.ctx.tw.wait(0.45);
      if (this.dead) return;
    }
    const made = this.showing?.made;
    if (!made) return;
    const spot = this.madeSpot();
    const pair = [out.first, out.row.head].map((k) => this.cardOf(k)!);
    await Promise.all(
      pair.map((c) => {
        this.ctx.tw.kill(c.node);
        return this.ctx.tw.to(c.node, { x: spot.x, y: spot.y }, { duration: 0.3, ease: ease.inOutSine });
      }),
    );
    if (this.dead) return;
    sfx.pop(5);
    void this.ctx.tw.wait(0.12).then(() => !this.dead && sfx.pop(9));
    for (const c of this.cards) c.node.visible = false;
    this.ctx.particles.burst(spot.x, spot.y, {
      kind: 'star',
      colors: [swatch.yellow.fill, swatch.pink.fill, swatch.blue.fill],
      count: 12,
      speed: [80, 200],
      gravity: 200,
      life: [0.5, 0.9],
    });
    if (this.showing) this.showing.t = 0;
    const said = this.ctx.say(nameLine(out.row.head, out.first, out.row.head));
    // The thing comes alive while its name is said, then goes to the shelf.
    await this.ctx.tw.wait(1.2);
    if (this.dead) return;
    await this.shelve([made], said);
  }

  /** Level 7: put the thing nobody has named on the table; a tap on it asks the question again. */
  private showInvented(head: string) {
    this.clearShowing();
    const made = inventedArt(head);
    const c = this.madeSpot();
    made.node.position.set(c.x, c.y);
    made.node.scale.set(0.2);
    this.madeLayer.addChild(made.node);
    this.showing = { made, t: 0 };
    void this.ctx.tw.to(
      made.node.scale,
      { x: MADE / MADE_ART, y: MADE / MADE_ART },
      { duration: 0.35, ease: ease.outBack },
    );
    this.tapToAsk(made);
  }

  /** Level 5: put the made thing on the table above its parts; a tap on it asks the question again. */
  private showKind(entry: Compound) {
    this.clearShowing();
    const made = this.show(entry);
    this.tapToAsk(made);
  }

  /** The thing on the table repeats the question when tapped. */
  private tapToAsk(made: Made) {
    made.node.hitArea = new Rectangle(-MADE_ART / 2, -MADE_ART / 2, MADE_ART, MADE_ART);
    onTap(
      made.node,
      () => {
        if (this.busy || this.finished || this.showing?.made !== made) return;
        sfx.pop(6);
        if (!this.askNow()) this.askChoice();
      },
      { cooldown: 600 },
    );
  }

  /** Take a made thing still on the table away (Start again at level 5). */
  private clearShowing() {
    if (!this.showing) return;
    this.ctx.tw.kill(this.showing.made.node);
    this.ctx.tw.kill(this.showing.made.node.scale);
    this.showing.made.node.destroy({ children: true });
    this.showing = null;
  }

  private target(card: CardNode, x: number, y: number): number | null {
    const own = this.cards.indexOf(card);
    return dropTarget(
      this.cards.map((c) => c.handle?.home ?? { x: c.node.x, y: c.node.y }),
      own,
      x,
      y,
      headFixed(this.level) ? [0] : undefined,
    );
  }

  private dropped(card: CardNode, x: number, y: number): boolean {
    this.near = null;
    if (this.finished || this.busy || !card.handle) return false;
    const own = this.cards.indexOf(card);
    const home = card.handle.home;
    let target = this.target(card, x, y);
    if (target === null && this.level === 1 && Math.hypot(x - home.x, y - home.y) < TAP_SLOP)
      target = own === 0 ? 1 : 0;
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
    if (headFixed(this.level) && out.made) void this.wrongMade(out.made, ask, card);
    else void this.wrongPair(card, other, ask);
    return false;
  }

  /**
   * Level 4: a touch anywhere flies the big picture's partner in to stick on; the join line plays over the shelf flight
   * and the next big picture. While a join is under way a touch still answers: the big picture hops.
   */
  private bigTouch() {
    if (this.finished || this.dead) return;
    if (this.busy) {
      const c = this.cards[0];
      if (c?.node.visible && !this.showing) {
        sfx.pop(6);
        this.hop(c);
      }
      return;
    }
    const entry = bigJoin(this.s);
    if (!entry) return;
    sfx.pop(6);
    void this.join(entry, null);
  }

  private cardOf(key: string): CardNode | undefined {
    return this.cards.find((c) => c.key === key);
  }

  private hop(card: CardNode | undefined) {
    if (!card) return;
    const k = this.scaleOf();
    this.ctx.tw.kill(card.node.scale);
    card.node.scale.set(1.12 * k, 0.9 * k);
    void this.ctx.tw.to(card.node.scale, { x: k, y: k }, { duration: 0.4, ease: ease.outBack });
  }

  /** Level 2: the pair wobbles, a soft boing, and the pet says the asked word and its parts. */
  private async wrongPair(card: CardNode, other: CardNode, ask: Ask) {
    this.busy = true;
    sfx.boing();
    for (const c of [card, other]) {
      this.ctx.tw.kill(c.node);
      void this.ctx.tw
        .to(c.node, { rotation: 0.14 }, { duration: 0.08 })
        .then(() => this.ctx.tw.to(c.node, { rotation: -0.1 }, { duration: 0.1 }))
        .then(() => this.ctx.tw.to(c.node, { rotation: 0 }, { duration: 0.12 }));
    }
    await this.ctx.say('wordglue.miss.make', {
      word: ask.entry.word,
      first: ask.entry.first,
      second: ask.entry.second,
    });
    if (this.dead) return;
    this.busy = false;
    this.relayout();
    if (this.restartWanted) this.doRestart();
  }

  /**
   * Levels 3 and 8: the wrong thing appears for a moment, the pet says what it is (and at level 3 who it is for), and it
   * pops apart.
   */
  private async wrongMade(made: Compound, ask: Ask, card: CardNode) {
    this.busy = true;
    sfx.boing();
    const head = this.cards[0];
    card.node.visible = false;
    head.node.visible = false;
    const shown = this.show(made);
    if (this.doing) await this.ctx.say(doerLine(made.word, 'made'));
    else
      await this.ctx.say('wordglue.miss.for', {
        made: made.word,
        meaning: made.meaning,
        head: ask.entry.second,
      });
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
    if (this.doing) return this.askDoer();
    this.hop(this.cardOf(ask.entry.first));
    void this.ctx.say('wordglue.ask', { head: ask.entry.second });
  }

  private show(entry: Compound): Made {
    const made = madeArt(entry.word);
    const c = this.madeSpot();
    made.node.position.set(c.x, c.y);
    made.node.scale.set(0.2);
    this.madeLayer.addChild(made.node);
    this.showing = { made, t: 0 };
    const size = this.big ? BIG : MADE;
    void this.ctx.tw.to(
      made.node.scale,
      { x: size / MADE_ART, y: size / MADE_ART },
      { duration: 0.35, ease: ease.outBack },
    );
    return made;
  }

  /** The two pictures hop together with a two-note pop, the made thing appears and comes alive, then goes to the shelf. */
  private async join(entry: Compound, dragged: CardNode | null) {
    this.busy = true;
    for (const c of this.cards) if (c.handle) c.handle.enabled = false;
    const a = this.cardOf(entry.first),
      b = this.cardOf(entry.second);
    const centre = tableCentre(this.view, this.cards.length);
    const parts = [a, b].filter((c): c is CardNode => !!c);
    // A supported join flies the right pair in; a dragged one is already on its partner.
    await Promise.all(
      parts.map((c) => {
        this.ctx.tw.kill(c.node);
        return this.ctx.tw.to(
          c.node,
          { x: centre.x + (c === dragged ? 10 : 0), y: centre.y },
          // Level 4's partner flies in from off the edge, so it takes a little longer.
          { duration: this.big ? 0.45 : 0.25, ease: ease.inOutSine },
        );
      }),
    );
    if (this.dead) return;
    sfx.pop(5);
    void this.ctx.tw.wait(0.12).then(() => !this.dead && sfx.pop(9));
    for (const c of parts) c.node.visible = false;
    this.ctx.particles.burst(centre.x, centre.y, {
      kind: 'star',
      colors: [swatch.yellow.fill, swatch.pink.fill, swatch.blue.fill],
      count: 12,
      speed: [80, 200],
      gravity: 200,
      life: [0.5, 0.9],
    });
    const made = this.show(entry);
    this.bubble.visible = false;
    const said = this.doing
      ? this.ctx.say(doerLine(entry.word, 'right'))
      : this.ctx.say('wordglue.join', {
          first: entry.first,
          second: entry.second,
          word: entry.word,
        });
    await this.shelve([made], said);
  }

  private shelfSlots() {
    return shelfLayout(this.view, this.s.round.asks.length, this.reversed);
  }

  /** The made pictures fly up to the shelf before the next ask or the finish. */
  private async shelve(made: Made[], said: Promise<unknown>) {
    if (this.s.done) await said;
    if (this.dead) return;
    await this.ctx.tw.wait(0.5);
    if (this.dead) return;
    this.showing = null;
    const slots = this.shelfSlots();
    const start = this.shelf.length;
    const scale = (this.reversed ? PAIRED_SHELF : SHELF) / MADE_ART;
    const flying = made.map((piece, i) => {
      const { node } = piece;
      node.eventMode = 'none';
      this.ctx.tw.kill(node.scale);
      this.shelfLayer.addChild(node);
      const thing: ShelfThing = { made: piece, t: 3, flying: true };
      this.shelf.push(thing);
      const { x, y } = slots[start + i];
      void this.ctx.tw.to(node, { x, y }, { duration: 0.45, ease: ease.inOutSine });
      void this.ctx.tw.to(node.scale, { x: scale, y: scale }, { duration: 0.45 });
      return thing;
    });
    // Wait for the beat, then put the pictures in the current slots even after rotation.
    await this.ctx.tw.wait(0.5);
    if (this.dead) return;
    const now = this.shelfSlots();
    flying.forEach((thing, i) => {
      thing.flying = false;
      const { node } = thing.made;
      this.ctx.tw.kill(node);
      node.position.set(now[start + i].x, now[start + i].y);
    });
    // The pictures go back to their places for the next ask (level 3 keeps them for its head's second ask).
    const pts = this.points();
    this.cards.forEach((c, i) => {
      this.ctx.tw.kill(c.node);
      c.node.position.set(pts[i].x, pts[i].y);
      if (c.handle) c.handle.enabled = true;
    });
    if (this.s.done) return void this.celebrate();
    await this.present(false, said);
  }

  private async celebrate() {
    this.finished = true;
    this.busy = true;
    for (const c of this.cards) {
      c.handle?.destroy();
      c.node.visible = false;
    }
    this.bubble.visible = false;
    this.nameCards.clear();
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
    const g = new Graphics()
      .roundRect(-44, -36, 88, 72, 24)
      .fill(0xffffff)
      .stroke({ width: 4, color: swatch.purple.light })
      .poly([-10, 34, 10, 34, 0, 50])
      .fill(0xffffff);
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
    const side = this.reversed ? MADE : CARD * this.scaleOf();
    const ring = (c: CardNode | undefined, color: number, width: number) => {
      if (!c || !c.node.visible) return;
      g.roundRect(c.node.x - side / 2 - 10, c.node.y - side / 2 - 10, side + 20, side + 20, 34).stroke({
        width,
        color,
      });
    };
    // Near feedback: whichever picture a held one would join glows faintly, the same for every picture.
    if (this.near !== null) ring(this.cards[this.near], swatch.white.fill, 6);
    const ask = currentAsk(this.s);
    if (!ask || this.busy) return;
    if (this.s.glow || this.hintPulse > 0) {
      if (this.naming) {
        // The thing's own picture and the last name card, where it goes.
        ring(this.cardOf(ask.entry.second), swatch.yellow.fill, pulse);
        const last = nameLayout(this.view).cards[1];
        g.roundRect(last.x - side / 2 - 10, last.y - side / 2 - 10, side + 20, side + 20, 34).stroke({
          width: pulse,
          color: swatch.yellow.fill,
        });
      } else if (headFixed(this.level)) ring(this.cardOf(ask.entry.first), swatch.yellow.fill, pulse);
      else if (this.choosing) ring(this.cardOf(rightChoice(this.s) ?? ''), swatch.yellow.fill, pulse);
      else
        for (const k of [ask.entry.first, ask.entry.second]) ring(this.cardOf(k), swatch.yellow.fill, pulse);
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
  challenge: 'words',
  skills: ['compound-words', 'vocabulary', 'word-meaning'],
  bands: ['lap', 'toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  entryLevels: [BIG_LEVEL],
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  upright: true,
  coplayHint:
    'Take turns inventing names for things, like a spoon hat. Try swapping the parts. What would a hat spoon look like?',
  // At one year she points and pats while the grown-up does the naming (U5a's lap tip rule).
  coplayHintLap:
    'Silly Compounds: hold up two things from the room, like a spoon and a hat, and call them a spoon hat. She pats each one while you say the silly name.',
  offScreen: 'Find a toothbrush, a doorbell or a raincoat at home and say its two little words.',
  hubIcon: () => new WigglyIcon(iconArt()),
  touchDemo: true,
  sticker,
  create: (ctx) => new WordGlue(ctx),
};
