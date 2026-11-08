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
  answerOf,
  BUBBLE_H,
  BUBBLE_MARGIN,
  BUBBLE_W,
  CARD_H,
  CARD_W,
  clueOf,
  glowFor,
  inBubble,
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

const line = (id: string) => id as LineId;
const nameLine = (s: Story, v: CardValue) =>
  line(s.level === 1 ? `thought.thing.${v}` : s.level === 2 ? `thought.place.${v}` : `thought.reason.${v}`);
const pictureOf = (s: Story, v: CardValue) =>
  s.level === 1 ? thingArt(v as Thing) : s.level === 2 ? placeArt(v as Place) : reasonArt(v as Reason);

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

class ThoughtBubbles implements Game {
  readonly hintLabel = 'Show me';
  readonly level: 1 | 2 | 3;
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
  private readonly bubble = new Container();
  private readonly bubbleCloud = new Graphics();
  private readonly bubbleHeld = new Container();
  private readonly dots = new Graphics();
  private readonly glow = new Graphics();
  private readonly replay: RoundButton;
  private cards: Card[] = [];
  private glowing: Glow = null;
  private clock = 0;
  private hopIn = 2;
  private overBubble = false;
  /** The friend's resting lean (level 1 leans toward the reach), which a head shake returns to. */
  private restRotation = 0;

  // The story's actors.
  private friend: Critter | null = null;
  private mover: Critter | null = null;
  private thing: Container | null = null;
  private door = new Container();
  private windowFace: Critter | null = null;

  constructor(private readonly ctx: GameContext) {
    this.layout = thoughtLayout(ctx.view);
    this.level = planFor(ctx.level).level;
    const first = !!ctx.demo || !authoredShown.has(this.level);
    authoredShown.add(this.level);
    this.stories = roundFor(this.level, ctx.rng, first);

    this.stageBox.addChild(this.scene, this.actors, this.pointer);
    this.pointer.hitArea = new Rectangle(0, 0, STAGE_W, STAGE_H);
    this.pointer.eventMode = 'none';
    onTap(this.pointer, (e) => this.tapPicture(this.stageBox.toLocal(e.global)), { cooldown: 250 });

    this.bubble.addChild(this.bubbleCloud, this.bubbleHeld);
    bubbleArt(this.bubbleCloud, false);
    this.bubble.hitArea = new Rectangle(
      -BUBBLE_W / 2 - BUBBLE_MARGIN,
      -BUBBLE_H / 2 - BUBBLE_MARGIN,
      BUBBLE_W + 2 * BUBBLE_MARGIN,
      BUBBLE_H + 2 * BUBBLE_MARGIN,
    );
    this.bubble.visible = false;
    this.dots.visible = false;
    this.glow.eventMode = 'none';
    this.dots.eventMode = 'none';
    this.replay = new RoundButton(replayArt(), swatch.yellow, 50, () => void this.replayStory());
    this.replay.visible = false;
    ctx.stage.addChild(this.stageBox, this.dots, this.bubble, this.replay, this.glow);
    this.resize(ctx.view);
  }

  get story(): Story {
    return this.stories[Math.min(this.index, this.stories.length - 1)];
  }

  start() {
    void this.next();
  }

  resize(v: View) {
    const l = (this.layout = thoughtLayout(v));
    this.stageBox.position.set(l.stage.x, l.stage.y);
    this.stageBox.scale.set(l.stage.scale);
    this.bubble.position.set(l.bubble.x, l.bubble.y);
    this.replay.position.set(l.replay.x, l.replay.y);
    this.cards.forEach((c, i) => {
      c.drag.home = { ...l.cards[i] };
      if (!c.drag.dragging && c.node.parent !== this.bubbleHeld)
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
    // The bubble swells while a card is carried over it.
    const over = this.cards.some((c) => c.drag.dragging && inBubble(this.layout, c.node.x, c.node.y));
    if (over !== this.overBubble) {
      this.overBubble = over;
      bubbleArt(this.bubbleCloud, over);
      this.bubble.scale.set(over ? 1.08 : 1);
    }
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
    if (this.busy || this.finished || !this.tally.showMe(this.stage)) return;
    const s = this.story;
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
    this.bubble.visible = false;
    this.dots.visible = false;
    this.replay.visible = false;
    this.pointer.eventMode = 'none';
    this.buildScene();
    await this.play();
    if (this.finished) return;
    this.dealCards();
    this.bubble.visible = true;
    this.dots.visible = true;
    this.replay.visible = true;
    this.drawDots();
    this.stage = 'card';
    this.busy = false;
    await this.ctx.instruct(line(`thought.instruct.${this.level}`));
    const s = this.story;
    if (s.level === 2) void this.ctx.say(line(`thought.look.${s.look.template.id}.ask`));
    if (s.level === 3) void this.ctx.say(line(`thought.why.${s.why.id}.ask`));
  }

  private clearCards() {
    for (const c of this.cards) {
      c.drag.destroy();
      c.node.destroy({ children: true });
    }
    this.cards = [];
    this.bubbleHeld.removeChildren().forEach((c) => c.destroy({ children: true }));
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
    if (this.busy || this.finished || this.stage !== 'card' || !inBubble(this.layout, x, y)) return false;
    if (card.value === answerOf(this.story)) {
      this.glowing = null;
      for (const c of this.cards) c.drag.enabled = false;
      this.bubbleHeld.addChild(card.node);
      card.node.position.set(card.node.x - this.bubble.x, card.node.y - this.bubble.y);
      void this.ctx.tw.to(card.node, { x: 0, y: 0 }, { duration: 0.25, ease: ease.outQuad });
      void this.ctx.tw.to(card.node.scale, { x: 0.72, y: 0.72 }, { duration: 0.25 });
      void this.right();
      return true;
    }
    void this.wrong(card.value);
    return false;
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

  private shakeHead() {
    const f = this.friend;
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
    await this.ctx.say('thought.showme');
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
      if (t.mover !== 'wind') this.mover = this.addFriend(t.mover, { x: 560, y: 390 });
      this.friend = this.addFriend(t.owner, MIDDLE);
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
    if (this.mover) this.mover.position.set(560, 390);
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
      if (this.mover) this.mover.position.set(560, 390);
      await this.ctx.tw.wait(0.4);
    }
    if (this.mover) {
      await this.walk(this.mover, STAND_AT[look.start]);
      await this.ctx.tw.to(thing, { x: this.mover.x, y: this.mover.y - 70 }, { duration: 0.3 });
      await Promise.all([
        this.walk(this.mover, STAND_AT[look.end], 0.9),
        this.ctx.tw.to(
          thing,
          { x: STAND_AT[look.end].x, y: STAND_AT[look.end].y - 70 },
          { duration: 0.9, ease: ease.inOutSine },
        ),
      ]);
      await this.ctx.tw.to(thing, ON_PLACE[look.end], { duration: 0.35, ease: ease.outQuad });
      await this.walk(this.mover, { x: 560, y: 390 }, 0.5);
    } else {
      // The wind: the shell tumbles along through the air.
      sfx.whoosh();
      const from = ON_PLACE[look.start];
      const to = ON_PLACE[look.end];
      await this.ctx.tw.to(
        thing,
        { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - 80, rotation: 2 },
        { duration: 0.8, ease: ease.outQuad },
      );
      await this.ctx.tw.to(thing, { x: to.x, y: to.y, rotation: 0 }, { duration: 0.8, ease: ease.inQuad });
    }
    if (replay) {
      await this.ctx.tw.wait(0.3);
      this.setDoor(true);
      this.windowFace!.visible = false;
      owner.alpha = 1;
    }
  }

  /** The trailing dots from the bubble down to the friend's head. */
  private drawDots() {
    const g = this.dots.clear();
    if (!this.friend) return;
    const head = toScreen(this.layout, { x: this.friend.x, y: this.friend.y - 120 });
    const from = { x: this.layout.bubble.x, y: this.layout.bubble.y + BUBBLE_H / 2 };
    for (const [t, r] of [
      [0.35, 12],
      [0.65, 8],
    ] as const) {
      g.circle(from.x + (head.x - from.x) * t, from.y + (head.y - from.y) * t, r)
        .fill(0xffffff)
        .stroke({ width: 4, color: swatch.white.line });
    }
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
  sticker: () => bubblePicture('apple'),
  create: (ctx) => new ThoughtBubbles(ctx),
};
