import { Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { LineId } from '../../content/voice-script';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { replayArt, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  actionArt,
  bubbleArt,
  cardFace,
  doorArt,
  friendNode,
  lookRoomArt,
  PLACE_AT,
  placeArt,
  reachArm,
  reasonArt,
  thingArt,
  wantSceneArt,
  whyRoomArt,
  WINDOW_AT,
} from './art';
import {
  LEVELS,
  actualPlace,
  answerOf,
  answersOf,
  beatsOf,
  bubbleAt,
  firstUnfilled,
  lastSeen,
  BUBBLE_H,
  BUBBLE_MARGIN,
  BUBBLE_W,
  CARD_H,
  CARD_W,
  clueOf,
  glowFor,
  planFor,
  rectToScreen,
  regionAt,
  regionRect,
  roundFor,
  STAGE_H,
  STAGE_W,
  Tally,
  thoughtLayout,
  toScreen,
  WHY_FRIEND_AT,
  type Friend,
  type Glow,
  type Place,
  type Reason,
  type Stage,
  type Story,
  type StoryEvent,
  type Thing,
  type ThoughtLayout,
} from './logic';

/** Each level's authored first round leads its first round of a session, and every demonstration. */
const authoredShown = new Set<number>();

type CardValue = Thing | Place | Reason;

interface Card {
  value: CardValue;
  node: Container;
  drag: DragHandle;
}

/** A thought bubble: its cloud, what it holds and, at level 4, the head of the friend it belongs to. */
interface Bubble {
  node: Container;
  cloud: Graphics;
  held: Container;
  badge: Container;
  filled: boolean;
  over: boolean;
}

type TwoStoryOf = Extract<Story, { level: 4 }>;

const line = (id: string) => id as LineId;
const nameLine = (s: Story, v: CardValue) =>
  line(s.level === 1 ? `thought.thing.${v}` : s.level === 3 ? `thought.reason.${v}` : `thought.place.${v}`);
const pictureOf = (s: Story, v: CardValue) =>
  s.level === 1 ? thingArt(v as Thing) : s.level === 3 ? reasonArt(v as Reason) : placeArt(v as Place);

/** Where a thing rests on each place, in stage units. */
const ON_PLACE: Record<Place, { x: number; y: number }> = {
  redBox: { x: PLACE_AT.redBox.x, y: PLACE_AT.redBox.y - 50 },
  blueBasket: { x: PLACE_AT.blueBasket.x, y: PLACE_AT.blueBasket.y - 46 },
  shelf: { x: PLACE_AT.shelf.x, y: PLACE_AT.shelf.y - 22 },
};
/** Where friends stand: in the room, in the doorway, under each place. */
const MIDDLE = { x: 330, y: 385 };
const DOORWAY = { x: 90, y: 300 };
const STAND_AT: Record<Place, { x: number; y: number }> = {
  redBox: { x: 150, y: 390 },
  blueBasket: { x: 520, y: 390 },
  shelf: { x: 470, y: 390 },
};
/**
 * Where a friend who moves things waits, and at level 4 where the two owners stand (bubble 0's on the left): beside the
 * red box and between the two floor places, so no friend hides a place.
 */
const MOVER_REST = { x: 560, y: 390 };
const FRONT = [
  { x: 138, y: 392 },
  { x: 330, y: 392 },
];

class ThoughtBubbles implements Game {
  readonly hintLabel = 'Show me';
  readonly level: 1 | 2 | 3 | 4;
  readonly stories: Story[];
  readonly tally = new Tally();
  index = -1;
  stage: Stage = 'watch';
  busy = true;
  finished = false;

  private layout: ThoughtLayout;
  /** The 640 × 400 picture, scaled into place. */
  private readonly stageBox = new Container();
  private readonly scene = new Container();
  private readonly actors = new Container();
  /** Level 3: catches taps anywhere on the picture and finds the region under them. */
  private readonly pointer = new Container();
  /** One bubble; at level 4 two, bubble 0 for the first friend. */
  private readonly bubbles: Bubble[];
  private readonly dots = new Graphics();
  private readonly glow = new Graphics();
  private readonly replay: RoundButton;
  private cards: Card[] = [];
  private glowing: Glow = null;
  private clock = 0;
  private hopIn = 2;
  /** Level 4: which bubbles' glow is on (after two misses or Show me), and the bubble pulsing while its beat replays. */
  private twoGlow = [false, false];
  private pulsing = -1;
  /** The friend's resting lean (level 1 leans toward the reach), which a head shake returns to. */
  private restRotation = 0;

  // The story's actors.
  private friend: Critter | null = null;
  /** Level 4: the two owners, in bubble order. */
  private friends: Critter[] = [];
  private mover: Critter | null = null;
  private thing: Container | null = null;
  private door = new Container();
  private windowFace: Critter | null = null;

  constructor(private readonly ctx: GameContext) {
    this.level = planFor(ctx.level).level;
    this.layout = thoughtLayout(ctx.view, this.level);
    const first = !!ctx.demo || !authoredShown.has(this.level);
    authoredShown.add(this.level);
    const round = roundFor(this.level, ctx.rng, first);
    // Level 4's stories are long (a put, two moves, two friends coming and going), so its demonstration shows two of the
    // three: the authored different story and the same one.
    this.stories = ctx.demo && this.level === 4 ? round.slice(0, 2) : round;

    this.stageBox.addChild(this.scene, this.actors, this.pointer);
    this.pointer.hitArea = new Rectangle(0, 0, STAGE_W, STAGE_H);
    this.pointer.eventMode = 'none';
    onTap(this.pointer, (e) => this.tapPicture(this.stageBox.toLocal(e.global)), { cooldown: 250 });

    this.bubbles = Array.from({ length: this.level === 4 ? 2 : 1 }, () => {
      const node = new Container();
      const cloud = bubbleArt(new Graphics(), false);
      const held = new Container();
      const badge = new Container();
      node.addChild(cloud, held, badge);
      node.hitArea = new Rectangle(
        -BUBBLE_W / 2 - BUBBLE_MARGIN,
        -BUBBLE_H / 2 - BUBBLE_MARGIN,
        BUBBLE_W + 2 * BUBBLE_MARGIN,
        BUBBLE_H + 2 * BUBBLE_MARGIN,
      );
      node.visible = false;
      return { node, cloud, held, badge, filled: false, over: false };
    });
    this.dots.visible = false;
    this.glow.eventMode = 'none';
    this.dots.eventMode = 'none';
    this.replay = new RoundButton(replayArt(), swatch.yellow, 50, () => void this.replayStory());
    this.replay.visible = false;
    ctx.stage.addChild(this.stageBox, this.dots, ...this.bubbles.map((b) => b.node), this.replay, this.glow);
    this.resize(ctx.view);
  }

  /** The first bubble (the only one at levels 1–3). */
  get bubble(): Container {
    return this.bubbles[0].node;
  }

  /** Which bubbles are filled, in bubble order. */
  get filled(): boolean[] {
    return this.bubbles.map((b) => b.filled);
  }

  get story(): Story {
    return this.stories[Math.min(this.index, this.stories.length - 1)];
  }

  start() {
    void this.next();
  }

  resize(v: View) {
    const l = (this.layout = thoughtLayout(v, this.level));
    this.stageBox.position.set(l.stage.x, l.stage.y);
    this.stageBox.scale.set(l.stage.scale);
    this.bubbles.forEach((b, i) => b.node.position.set(l.bubbles[i].x, l.bubbles[i].y));
    this.replay.position.set(l.replay.x, l.replay.y);
    this.cards.forEach((c, i) => {
      c.drag.home = { ...l.cards[i] };
      if (!c.drag.dragging && !this.bubbles.some((b) => c.node.parent === b.held))
        c.node.position.set(l.cards[i].x, l.cards[i].y);
    });
    this.drawDots();
  }

  update(dt: number) {
    this.clock += dt;
    if (this.finished) return;
    // Level 1: the friend hops toward the thing now and then, as if it is just out of reach.
    if (this.level === 1 && this.friend && this.stage !== 'done') {
      this.hopIn -= dt;
      if (this.hopIn <= 0) {
        this.hopIn = 2.4;
        this.friend.hop(0.45);
      }
    }
    // A bubble swells while a card is carried over it, and pulses while its friend's beat replays.
    this.bubbles.forEach((b, i) => {
      const over =
        !b.filled &&
        this.cards.some((c) => c.drag.dragging && bubbleAt(this.layout, c.node.x, c.node.y) === i);
      if (over !== b.over) {
        b.over = over;
        bubbleArt(b.cloud, over);
      }
      b.node.scale.set((over ? 1.08 : 1) * (this.pulsing === i ? 1 + 0.05 * Math.sin(this.clock * 8) : 1));
    });
    const g = this.glow.clear();
    if (!this.glowing || this.busy) return;
    const w = 6 + 2 * Math.sin(this.clock * 5);
    if ('card' in this.glowing) {
      const card = this.cards.find((c) => c.value === (this.glowing as { card: CardValue }).card);
      if (card)
        g.roundRect(
          card.node.x - CARD_W / 2 - 10,
          card.node.y - CARD_H / 2 - 10,
          CARD_W + 20,
          CARD_H + 20,
          24,
        ).stroke({ width: w, color: swatch.yellow.fill });
      // Level 4: the bubble the card belongs in glows too.
      const at = this.glowing.bubble === undefined ? null : this.layout.bubbles[this.glowing.bubble];
      if (at)
        g.roundRect(
          at.x - BUBBLE_W / 2 - 14,
          at.y - BUBBLE_H / 2 - 14,
          BUBBLE_W + 28,
          BUBBLE_H + 28,
          70,
        ).stroke({ width: w, color: swatch.yellow.fill });
    } else if (this.story.level === 3) {
      const region = this.story.why.regions.find((r) => r.id === (this.glowing as { region: string }).region);
      if (region) {
        const b = rectToScreen(this.layout, regionRect(region));
        g.roundRect(b.x - 4, b.y - 4, b.w + 8, b.h + 8, 16).stroke({ width: w, color: swatch.yellow.fill });
      }
    }
  }

  /** Show me: glow what to do now, as one hint. */
  askForHint() {
    if (this.busy || this.finished) return;
    const s = this.story;
    if (s.level === 4) {
      // The first unfilled bubble (left or top first) and its card, unless that bubble's glow is already on.
      const b = firstUnfilled(this.filled);
      if (this.stage !== 'card' || b < 0 || !this.tally.showMe('card', b)) return;
      this.twoGlow[b] = true;
      this.glowing = glowFor(s, 'card', this.filled);
      return;
    }
    if (!this.tally.showMe(this.stage)) return;
    if (s.level !== 2) {
      this.glowing = glowFor(s, this.stage);
      return;
    }
    // Level 2: the deciding beat plays again first, so the glow comes with its reason.
    this.busy = true;
    void Promise.all([this.ctx.say(line(`thought.look.${s.look.template.id}.saw`)), this.playMove()]).then(
      () => {
        if (this.finished || this.stage !== 'card') return;
        this.glowing = glowFor(this.story, 'card');
        this.busy = false;
      },
    );
  }

  /** The ghost finger: drag the right card into the bubble, then at level 3 tap the clue. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.index < 0) return null;
    if (this.stage === 'card' && this.story.level === 4) {
      const g = glowFor(this.story, 'card', this.filled);
      if (!g || !('card' in g)) return null;
      const card = this.cards.find((c) => c.value === g.card);
      return card ? { drag: { on: card.node }, to: { on: this.bubbles[g.bubble!].node } } : null;
    }
    if (this.stage === 'card') {
      const card = this.cards.find((c) => c.value === answerOf(this.story));
      return card ? { drag: { on: card.node }, to: { on: this.bubble } } : null;
    }
    if (this.stage === 'point' && this.story.level === 3) {
      const b = regionRect(clueOf(this.story.why));
      return { tap: { on: this.pointer, x: b.x + b.w / 2, y: b.y + b.h / 2 } };
    }
    return null;
  }

  destroy() {
    for (const c of this.cards) c.drag.destroy();
    this.cards = [];
  }

  // ---------------------------------------------------------------- the round

  private async next() {
    this.busy = true;
    this.index++;
    this.glowing = null;
    this.tally.newStory();
    if (this.index >= this.stories.length) return this.finale();
    this.stage = 'watch';
    this.clearCards();
    this.twoGlow = [false, false];
    this.pulsing = -1;
    for (const b of this.bubbles) {
      b.node.visible = false;
      b.filled = false;
    }
    this.dots.visible = false;
    this.replay.visible = false;
    this.pointer.eventMode = 'none';
    this.buildScene();
    await this.play();
    if (this.finished) return;
    this.dealCards();
    this.setBadges();
    for (const b of this.bubbles) b.node.visible = true;
    this.dots.visible = true;
    this.replay.visible = true;
    this.drawDots();
    this.stage = 'card';
    this.busy = false;
    const s = this.story;
    await this.ctx.instruct(line(`thought.instruct.${this.level}`));
    // The story's own question is then the line the guide repeats and the caption keeps, unless she has already answered it.
    if (this.finished || this.story !== s || this.stage !== 'card') return;
    if (s.level === 2) void this.ctx.instruct(line(`thought.look.${s.look.template.id}.ask`));
    if (s.level === 3) void this.ctx.instruct(line(`thought.why.${s.why.id}.ask`));
    if (s.level === 4) void this.ctx.instruct(line(`thought.two.${s.two.template.id}.ask`));
  }

  private clearCards() {
    for (const c of this.cards) {
      c.drag.destroy();
      c.node.destroy({ children: true });
    }
    this.cards = [];
    for (const b of this.bubbles) b.held.removeChildren().forEach((c) => c.destroy({ children: true }));
  }

  /** Level 4: each bubble carries its friend's head on its rim, so whose it is shows without reading. */
  private setBadges() {
    const s = this.story;
    this.bubbles.forEach((b, i) => {
      b.badge.removeChildren().forEach((c) => c.destroy({ children: true }));
      if (s.level !== 4) return;
      const face = new Critter(CRITTERS[s.two.template.friends[i]]);
      face.alive = false;
      face.eventMode = 'none';
      face.scale.set(0.25);
      face.position.set(0, 48);
      const ring = new Graphics()
        .circle(0, 0, 34)
        .fill(0xffffff)
        .stroke({ width: 4, color: swatch.white.line });
      const mask = new Graphics().circle(0, 0, 31).fill(0xffffff);
      face.mask = mask;
      b.badge.addChild(ring, mask, face);
      b.badge.position.set(-98, 44);
    });
  }

  private dealCards() {
    const s = this.story;
    this.cards = s.cards.map((value, i) => {
      const node = cardFace(pictureOf(s, value), CARD_W, CARD_H);
      node.hitArea = new Rectangle(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H);
      node.position.set(this.layout.cards[i].x, this.layout.cards[i].y);
      this.ctx.stage.addChildAt(node, this.ctx.stage.getChildIndex(this.glow));
      const card: Card = { value, node, drag: null as unknown as DragHandle };
      card.drag = draggable(node, this.ctx.tw, {
        onPick: () => {
          sfx.tick();
          void this.ctx.say(nameLine(s, value));
        },
        onDrop: (x, y) => this.drop(card, x, y),
      });
      return card;
    });
  }

  /** A card let go: in the bubble it is her answer; anywhere else it floats home, free. */
  private drop(card: Card, x: number, y: number): boolean {
    const at = bubbleAt(this.layout, x, y);
    if (this.busy || this.finished || this.stage !== 'card' || at < 0) return false;
    if (this.story.level === 4) return this.dropTwo(this.story, card, at);
    if (card.value === answerOf(this.story)) {
      this.glowing = null;
      for (const c of this.cards) c.drag.enabled = false;
      this.bubbles[0].held.addChild(card.node);
      card.node.position.set(card.node.x - this.bubble.x, card.node.y - this.bubble.y);
      void this.ctx.tw.to(card.node, { x: 0, y: 0 }, { duration: 0.25, ease: ease.outQuad });
      void this.ctx.tw.to(card.node.scale, { x: 0.72, y: 0.72 }, { duration: 0.25 });
      void this.right();
      return true;
    }
    void this.wrong(card.value);
    return false;
  }

  /**
   * Level 4: a card let go in one of the two bubbles. A right card floats home and leaves its picture, so one place
   * card can fill both bubbles; a filled bubble takes no more drops, free; a wrong card is that bubble's miss.
   */
  private dropTwo(s: TwoStoryOf, card: Card, at: number): boolean {
    const b = this.bubbles[at];
    if (b.filled) return false;
    if (card.value !== answerOf(s, at)) {
      void this.wrongTwo(s, at);
      return false;
    }
    b.filled = true;
    sfx.sparkle();
    const kept = cardFace(placeArt(card.value as Place), CARD_W, CARD_H);
    kept.scale.set(0.3);
    b.held.addChild(kept);
    void this.ctx.tw.to(kept.scale, { x: 0.72, y: 0.72 }, { duration: 0.25, ease: ease.outQuad });
    this.friends[at]?.poke();
    this.showTwoGlow(s);
    if (this.bubbles.every((x) => x.filled)) void this.rightTwo(s);
    return false;
  }

  /** Level 4: the glow follows the first unfilled bubble whose glow is on. */
  private showTwoGlow(s: TwoStoryOf) {
    const b = [0, 1].find((i) => this.twoGlow[i] && !this.bubbles[i].filled);
    this.glowing = b === undefined ? null : { card: answerOf(s, b), bubble: b };
  }

  /** Level 4: a wrong card. The pet asks what that friend saw last and that beat plays again, the friend's bubble pulsing. */
  private async wrongTwo(s: TwoStoryOf, at: number) {
    const glow = this.tally.wrong(at);
    sfx.boing();
    this.shakeHead(this.friends[at]);
    this.busy = true;
    this.pulsing = at;
    const who = s.two.template.friends[at];
    await Promise.all([
      this.ctx.say(line(`thought.two.saw.${who}`)),
      this.replayBeat(s, lastSeen(s.two.events, who, s.two.template.thing)),
    ]);
    if (this.finished) return;
    this.pulsing = -1;
    if (glow) this.twoGlow[at] = true;
    this.showTwoGlow(s);
    this.busy = false;
  }

  /**
   * Level 4, both bubbles filled: each friend walks to the place in its own bubble, bubble 0 first. One who thought where
   * it really is finds it; the others are kindly shown where it went. No friend walks to a place that was not its answer.
   */
  private async rightTwo(s: TwoStoryOf) {
    this.busy = true;
    this.stage = 'done';
    this.glowing = null;
    this.dots.visible = false;
    for (const c of this.cards) c.drag.enabled = false;
    const two = s.two;
    const answers = answersOf(two);
    const lost = answers.map((a) => a !== two.actual);
    await this.ctx.tw.wait(0.4);
    for (const b of [0, 1]) {
      const f = this.friends[b];
      const spot = STAND_AT[answers[b]];
      await this.walk(f, { x: spot.x + (b === 1 && answers[0] === answers[1] ? 62 : 0), y: spot.y });
      if (!lost[b]) {
        sfx.sparkle();
        f.cheer();
        await Promise.all([this.ctx.say('thought.two.found'), this.liftThing()]);
      } else {
        f.setMood('surprised', 1.4);
        // Two friends at the wrong place are shown together, once.
        if (b === 0 && lost[1]) await this.ctx.tw.wait(0.3);
        else {
          const helped = this.ctx.say(line(`thought.two.${two.template.id}.helped`));
          if (this.mover) await this.walk(this.mover, { x: STAND_AT[two.actual].x + 40, y: 390 });
          await this.liftThing();
          await helped;
        }
      }
      if (this.finished) return;
    }
    for (const f of this.friends) f.cheer();
    await this.ctx.say(answers[0] === answers[1] ? 'thought.two.done.same' : 'thought.two.done.different');
    await this.ctx.tw.wait(0.4);
    return this.next();
  }

  /** The thing hops up from its place and settles again: here it is. */
  private async liftThing() {
    const thing = this.thing!;
    const y = thing.y;
    await this.ctx.tw.to(thing, { y: y - 36 }, { duration: 0.3, ease: ease.outQuad });
    await this.ctx.tw.to(thing, { y }, { duration: 0.3, ease: ease.inQuad });
  }

  private async wrong(value: CardValue) {
    const s = this.story;
    const glow = this.tally.wrong();
    sfx.boing();
    this.shakeHead();
    // The glow comes with the second miss; at level 2 only after the deciding beat has replayed.
    const lightUp = () => {
      if (glow && !this.finished && this.stage === 'card') this.glowing = glowFor(this.story, 'card');
    };
    if (s.level !== 2) lightUp();
    if (s.level === 1) {
      await this.ctx.say(line(`thought.want.${s.want.id}.hint`));
    } else if (s.level === 2) {
      // The friend never walks to a wrong place; the deciding beat plays again with the story's question.
      this.busy = true;
      await Promise.all([this.ctx.say(line(`thought.look.${s.look.template.id}.saw`)), this.playMove()]);
      if (this.finished) return;
      lightUp();
      this.busy = false;
    } else {
      this.friend?.setMood('surprised', 1);
      await this.ctx.say(line(`thought.need.${value}`));
    }
  }

  private shakeHead(f = this.friend) {
    if (!f) return;
    const base = this.restRotation;
    this.ctx.tw.kill(f);
    void this.ctx.tw
      .to(f, { rotation: base + 0.1 }, { duration: 0.1 })
      .then(() => this.ctx.tw.to(f, { rotation: base - 0.1 }, { duration: 0.15 }))
      .then(() => this.ctx.tw.to(f, { rotation: base }, { duration: 0.1 }));
  }

  private async right() {
    this.busy = true;
    const s = this.story;
    sfx.sparkle();
    if (s.level === 1) {
      this.stage = 'done';
      const f = this.friend!;
      const item = this.actors.children.find((c) => c.label === s.want.cued);
      if (item) await this.ctx.tw.to(item, { x: f.x, y: f.y - 60 }, { duration: 0.6, ease: ease.inOutSine });
      f.rotation = 0;
      f.cheer();
      await this.ctx.say(line(`thought.want.${s.want.id}.got`));
      await this.ctx.tw.wait(0.6);
      return this.next();
    }
    if (s.level === 2) {
      this.stage = 'done';
      const owner = this.friend!;
      const answer = answerOf(s) as Place;
      await this.walk(owner, STAND_AT[answer]);
      if (s.look.kind === 'away') {
        // Not there: the mover kindly shows him where it went.
        owner.setMood('surprised', 1.2);
        const helped = this.ctx.say(line(`thought.look.${s.look.template.id}.helped`));
        if (this.mover) await this.walk(this.mover, { x: STAND_AT[s.look.end].x + 40, y: 390 });
        await this.ctx.tw.to(
          this.thing!,
          { x: owner.x, y: owner.y - 70 },
          { duration: 0.8, ease: ease.inOutSine },
        );
        await helped;
      } else {
        await this.ctx.tw.to(
          this.thing!,
          { x: owner.x, y: owner.y - 70 },
          { duration: 0.5, ease: ease.inOutSine },
        );
      }
      owner.cheer();
      await this.ctx.say(s.look.kind === 'away' ? 'thought.away.done' : 'thought.watching.done');
      await this.ctx.tw.wait(0.4);
      return this.next();
    }
    // Level 3: the friend nods and the bubble keeps the picture; then where the picture shows it.
    this.friend?.poke();
    this.stage = 'point';
    this.pointer.eventMode = 'static';
    this.busy = false;
    // A new ask: the bubble is filled, so "Put the reason in her thought bubble" no longer says what to do.
    await this.ctx.instruct('thought.showme');
  }

  /** Level 3: a tap on the picture. The clue ends the story; anything else is named, free. */
  private async tapPicture(p: { x: number; y: number }) {
    const s = this.story;
    if (this.busy || this.finished || this.stage !== 'point' || s.level !== 3) return;
    const region = regionAt(s.why, p);
    if (!region) return;
    if (region === clueOf(s.why)) {
      this.busy = true;
      this.stage = 'done';
      this.glowing = null;
      this.pointer.eventMode = 'none';
      const b = rectToScreen(this.layout, regionRect(region));
      sfx.sparkle();
      this.ctx.particles.burst(b.x + b.w / 2, b.y + b.h / 2, {
        colors: [swatch.yellow.fill, 0xffffff],
        count: 14,
        speed: [60, 180],
        gravity: 0,
        size: [0.25, 0.4],
      });
      this.friend?.cheer();
      await this.ctx.say(line(`thought.why.${s.why.id}.found`));
      await this.ctx.tw.wait(0.4);
      return this.next();
    }
    sfx.tick();
    const glow = this.tally.freeTap();
    await this.ctx.say(line(`thought.region.${s.why.id}.${region.id}`));
    if (glow && this.stage === 'point' && !this.finished) {
      this.glowing = glowFor(s, 'point');
      void this.ctx.say(line(`thought.why.${s.why.id}.again`));
    }
  }

  private async replayStory() {
    if (this.busy || this.finished || this.stage === 'watch' || this.stage === 'done') return;
    this.busy = true;
    this.buildScene();
    this.drawDots();
    await this.play();
    if (this.finished) return;
    this.busy = false;
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    this.busy = true;
    sfx.tada();
    this.friend?.cheer();
    await this.ctx.tw.wait(0.6);
    this.ctx.finish({ misses: this.tally.misses, hints: this.tally.hints });
  }

  // ---------------------------------------------------------------- the stage

  /** Draw the story's picture and put its friends in their starting places. */
  private buildScene() {
    for (const c of [...this.actors.children]) {
      if (c instanceof Critter) this.ctx.untrack(c);
    }
    this.scene.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.actors.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.friend = this.mover = this.windowFace = null;
    this.friends = [];
    this.restRotation = 0;
    this.thing = null;
    const s = this.story;
    if (s.level === 1) {
      const w = s.want;
      this.scene.addChild(wantSceneArt(w));
      for (const item of w.items) {
        const art = thingArt(item.thing);
        art.label = item.thing;
        art.position.set(item.x, item.y);
        this.actors.addChild(art);
      }
      const f = (this.friend = this.addFriend(w.friend, w.friendAt));
      // The reach: a paw from the shoulder toward the thing, and a lean that way.
      const lean = Math.cos((w.reach * Math.PI) / 180) >= 0 ? 10 : -10;
      f.rotation = this.restRotation = (lean * Math.PI) / 180;
      const arm = reachArm(f.sw, w.reach - lean);
      arm.position.set(40, -110);
      f.attach(arm);
    } else if (s.level === 2) {
      this.scene.addChild(lookRoomArt());
      this.door = new Container();
      this.scene.addChild(this.door);
      this.setDoor(true);
      const t = s.look.template;
      // The owner's face at the window, shown only while he watches.
      const face = new Critter(CRITTERS[t.owner]);
      face.scale.set(0.42);
      face.position.set(WINDOW_AT.x, WINDOW_AT.y + 80);
      face.eventMode = 'none';
      const mask = new Graphics().circle(WINDOW_AT.x, WINDOW_AT.y, WINDOW_AT.r - 4).fill(0xffffff);
      face.mask = mask;
      face.visible = false;
      this.actors.addChild(mask, face);
      this.ctx.track(face);
      this.windowFace = face;
      this.thing = thingArt(t.thing);
      this.thing.visible = false;
      if (t.mover !== 'wind') this.mover = this.addFriend(t.mover, MOVER_REST);
      this.friend = this.addFriend(t.owner, MIDDLE);
      this.actors.addChild(this.thing);
    } else if (s.level === 4) {
      // The level-2 cottage; the window is not used. Two owners at the front, and the friend who makes the second move.
      this.scene.addChild(lookRoomArt());
      this.door = new Container();
      this.scene.addChild(this.door);
      this.setDoor(true);
      const t = s.two.template;
      this.thing = thingArt(t.thing);
      this.thing.visible = false;
      this.mover = this.addFriend(t.movers[1], MOVER_REST);
      this.friends = t.friends.map((f, i) => this.addFriend(f, FRONT[i]));
      this.friend = this.friends[0];
      this.actors.addChild(this.thing);
    } else {
      const w = s.why;
      this.scene.addChild(whyRoomArt(w.regions.map((r) => ({ id: r.id, rect: regionRect(r) }))));
      const f = (this.friend = this.addFriend(w.friend, WHY_FRIEND_AT));
      const prop = actionArt(w.action);
      if (prop) f.attach(prop);
    }
  }

  private addFriend(name: Friend, at: { x: number; y: number }): Critter {
    const f = friendNode(name);
    f.position.set(at.x, at.y);
    this.actors.addChild(f);
    this.ctx.track(f);
    return f;
  }

  private setDoor(open: boolean) {
    this.door.removeChildren().forEach((c) => c.destroy());
    this.door.addChild(doorArt(open));
  }

  private walk(who: Container, to: { x: number; y: number }, duration = 0.7): Promise<void> {
    return this.ctx.tw.to(who, { x: to.x, y: to.y }, { duration, ease: ease.inOutSine });
  }

  /** Play the story once, narrated. */
  private async play() {
    const s = this.story;
    if (s.level === 4) {
      // Beat by beat: one short line as each beat plays. A friend who stays behind looks up; nothing else moves.
      this.setTwoStage(s, 0);
      for (const beat of beatsOf(s.two)) {
        const say = this.ctx.say(line(beat.line));
        if (beat.event !== null) await this.playEvent(s, beat.event);
        else if (beat.who) this.friends[s.two.template.friends.indexOf(beat.who)]?.poke();
        await say;
        if (this.finished) return;
        await this.ctx.tw.wait(0.2);
      }
      return;
    }
    if (s.level === 1) {
      await this.ctx.say(line(`thought.want.${s.want.id}.story`));
      await this.ctx.tw.wait(0.5);
      return;
    }
    if (s.level === 3) {
      const say = this.ctx.say(line(`thought.why.${s.why.id}.story`));
      const f = this.friend!;
      if (s.why.action === 'tiptoe') {
        // Slow, small steps across the room.
        f.x = WHY_FRIEND_AT.x - 90;
        for (let i = 0; i < 4; i++) {
          f.hop(0.25);
          await this.ctx.tw.to(f, { x: f.x + 45 }, { duration: 0.6, ease: ease.inOutSine });
        }
      } else {
        f.cheer();
      }
      await say;
      await this.ctx.tw.wait(0.4);
      return;
    }
    // Level 2: put it away, go out (or to the window), the move, come back.
    const look = s.look;
    const t = look.template;
    const owner = this.friend!;
    const thing = this.thing!;
    const say = this.ctx.say(line(`thought.look.${t.id}.${look.kind}`));
    owner.position.set(MIDDLE.x, MIDDLE.y);
    owner.alpha = 1;
    this.windowFace!.visible = false;
    this.setDoor(true);
    if (this.mover) this.mover.position.set(MOVER_REST.x, MOVER_REST.y);
    thing.visible = true;
    thing.position.set(owner.x, owner.y - 70);
    await this.walk(owner, STAND_AT[look.start]);
    await this.ctx.tw.to(thing, ON_PLACE[look.start], { duration: 0.4, ease: ease.outQuad });
    await this.walk(owner, DOORWAY, 0.9);
    await this.ctx.tw.to(owner, { alpha: 0 }, { duration: 0.3 });
    if (look.kind === 'away') this.setDoor(false);
    else this.windowFace!.visible = true;
    await this.ctx.tw.wait(0.4);
    await this.playMove(false);
    await this.ctx.tw.wait(0.3);
    this.setDoor(true);
    this.windowFace!.visible = false;
    owner.position.set(DOORWAY.x + 20, 390);
    await this.ctx.tw.to(owner, { alpha: 1 }, { duration: 0.3 });
    await say;
  }

  /** Level 2's deciding beat: the thing goes from the start place to the end place, seen from the window or not at all. */
  private async playMove(replay = true) {
    const s = this.story;
    if (s.level !== 2) return;
    const look = s.look;
    const thing = this.thing!;
    const owner = this.friend!;
    if (replay) {
      // Back to the moment before it moved: the owner out of the door or at the window.
      owner.alpha = 0;
      if (look.kind === 'away') this.setDoor(false);
      else this.windowFace!.visible = true;
      thing.position.set(ON_PLACE[look.start].x, ON_PLACE[look.start].y);
      if (this.mover) this.mover.position.set(MOVER_REST.x, MOVER_REST.y);
      await this.ctx.tw.wait(0.4);
    }
    await this.moveThing(look.template.mover === 'wind' ? null : this.mover, look.start, look.end);
    if (replay) {
      await this.ctx.tw.wait(0.3);
      this.setDoor(true);
      this.windowFace!.visible = false;
      owner.alpha = 1;
    }
  }

  /** A thing goes from one place to another: carried by a friend, who then goes back to wait, or blown by the wind (null). */
  private async moveThing(mover: Critter | null, from: Place, to: Place) {
    const thing = this.thing!;
    if (mover) {
      await this.walk(mover, STAND_AT[from]);
      await this.ctx.tw.to(thing, { x: mover.x, y: mover.y - 70 }, { duration: 0.3 });
      await Promise.all([
        this.walk(mover, STAND_AT[to], 0.9),
        this.ctx.tw.to(
          thing,
          { x: STAND_AT[to].x, y: STAND_AT[to].y - 70 },
          { duration: 0.9, ease: ease.inOutSine },
        ),
      ]);
      await this.ctx.tw.to(thing, ON_PLACE[to], { duration: 0.35, ease: ease.outQuad });
      await this.walk(mover, MOVER_REST, 0.5);
    } else {
      // The wind: the thing tumbles along through the air.
      sfx.whoosh();
      const a = ON_PLACE[from];
      const b = ON_PLACE[to];
      await this.ctx.tw.to(
        thing,
        { x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) - 80, rotation: 2 },
        { duration: 0.8, ease: ease.outQuad },
      );
      await this.ctx.tw.to(thing, { x: b.x, y: b.y, rotation: 0 }, { duration: 0.8, ease: ease.inQuad });
    }
  }

  // ---------------------------------------------------------------- level 4's stage

  /** Who is out of the door after the first `n` events. */
  private outAfter(events: readonly StoryEvent[], n: number): Set<Friend> {
    const out = new Set<Friend>();
    for (const e of events.slice(0, n)) {
      if (e.kind === 'leave') out.add(e.who);
      if (e.kind === 'back') out.delete(e.who);
    }
    return out;
  }

  /** Put the stage as it stands after the first `n` events: who is in the room, the door, where the thing is. */
  private setTwoStage(s: TwoStoryOf, n: number) {
    const { template: t, events } = s.two;
    const out = this.outAfter(events, n);
    this.friends.forEach((f, i) => {
      f.position.set(FRONT[i].x, FRONT[i].y);
      f.rotation = 0;
      f.alpha = out.has(t.friends[i]) ? 0 : 1;
    });
    this.setDoor(out.size === 0);
    this.mover?.position.set(MOVER_REST.x, MOVER_REST.y);
    const thing = this.thing!;
    const at = actualPlace(events.slice(0, n), t.thing);
    thing.visible = true;
    thing.rotation = 0;
    thing.position.set(at ? ON_PLACE[at].x : FRONT[0].x, at ? ON_PLACE[at].y : FRONT[0].y - 70);
  }

  /** Play one event from the stage as it stands before it. The two moves take the same time whoever is watching. */
  private async playEvent(s: TwoStoryOf, i: number) {
    const { template: t, events } = s.two;
    const e = events[i];
    const thing = this.thing!;
    if (e.kind === 'put') {
      const f = this.friends[0];
      const at = STAND_AT[e.to];
      await Promise.all([
        this.walk(f, at),
        this.ctx.tw.to(thing, { x: at.x, y: at.y - 70 }, { duration: 0.7, ease: ease.inOutSine }),
      ]);
      await this.ctx.tw.to(thing, ON_PLACE[e.to], { duration: 0.4, ease: ease.outQuad });
      await this.walk(f, FRONT[0]);
    } else if (e.kind === 'move') {
      await this.moveThing(e.who === 'wind' ? null : this.mover, e.from, e.to);
    } else if (e.kind === 'leave') {
      const f = this.friends[t.friends.indexOf(e.who)];
      this.setDoor(true);
      await this.walk(f, DOORWAY, 0.9);
      await this.ctx.tw.to(f, { alpha: 0 }, { duration: 0.3 });
      this.setDoor(false);
    } else {
      const at = t.friends.indexOf(e.who);
      const f = this.friends[at];
      this.setDoor(true);
      f.position.set(DOORWAY.x + 20, 390);
      await this.ctx.tw.to(f, { alpha: 1 }, { duration: 0.3 });
      await this.walk(f, FRONT[at]);
      this.setDoor(this.outAfter(events, i + 1).size === 0);
    }
  }

  /** A miss replays the beat that friend saw last, then the stage returns to the story's end. */
  private async replayBeat(s: TwoStoryOf, i: number) {
    this.setTwoStage(s, i);
    await this.ctx.tw.wait(0.4);
    await this.playEvent(s, i);
    await this.ctx.tw.wait(0.3);
    if (this.finished) return;
    this.setTwoStage(s, s.two.events.length);
  }

  /** The trailing dots from each bubble down to its friend's head. */
  private drawDots() {
    const g = this.dots.clear();
    this.layout.bubbles.forEach((at, i) => {
      const friend = this.level === 4 ? this.friends[i] : this.friend;
      if (!friend) return;
      const head = toScreen(this.layout, { x: friend.x, y: friend.y - 120 });
      const from = { x: at.x, y: at.y + BUBBLE_H / 2 };
      for (const [t, r] of [
        [0.35, 12],
        [0.65, 8],
      ] as const) {
        g.circle(from.x + (head.x - from.x) * t, from.y + (head.y - from.y) * t, r)
          .fill(0xffffff)
          .stroke({ width: 4, color: swatch.white.line });
      }
    });
  }
}

class ThoughtIcon extends WigglyIcon {
  constructor() {
    super(bubblePicture(null));
  }
}

/** A friend with a thought bubble, empty (the hub icon) or holding the apple (the sticker). */
function bubblePicture(thing: Thing | null): Container {
  const c = new Container();
  const bunny = new Critter(CRITTERS.bunny);
  bunny.alive = false;
  bunny.scale.set(0.5);
  c.addChild(bunny);
  const cloud = bubbleArt(new Graphics(), false);
  cloud.scale.set(0.5);
  cloud.position.set(70, -170);
  const dots = new Graphics()
    .circle(30, -118, 7)
    .circle(18, -100, 5)
    .fill(0xffffff)
    .stroke({ width: 3, color: swatch.white.line });
  c.addChild(dots, cloud);
  if (thing) {
    const inBubble = thingArt(thing);
    inBubble.position.set(70, -172);
    inBubble.scale.set(0.7);
    const held = thingArt(thing);
    held.position.set(30, -70);
    held.scale.set(0.7);
    c.addChild(inBubble, held);
  }
  return c;
}

export const thoughtBubbles: GameModule = {
  id: 'thought-bubbles',
  name: 'Thought Bubbles',
  titleLine: 'game.thought-bubbles',
  region: 'story-grove',
  challenge: 'words',
  skills: ['characters', 'perspective', 'inference', 'listening'],
  bands: ['prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  coplayHint:
    'Play the hider: while the friend is out of the room, say where the thing goes, then ask where the friend will look. Swap turns.',
  offScreen: 'Hide a toy while teddy is "asleep", then ask: where will teddy look for it? How do you know?',
  hubIcon: () => new ThoughtIcon(),
  touchDemo: true,
  upright: true,
  sticker: () => bubblePicture('apple'),
  create: (ctx) => new ThoughtBubbles(ctx),
};
