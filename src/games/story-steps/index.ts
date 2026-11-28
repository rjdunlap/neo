import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { replayArt, tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { RepairStory } from './repair';
import { UntangleStory } from './untangle';
import { PredictStory } from './predict';
import { TheaterStoryGame } from './theater';
import { THEATER_PLANS, VIEWPOINTS_NAME } from './theater-logic';
import { ViewpointsGame } from './viewpoints';
import { PREDICTION_PLAN } from './predictions';
import { GROW_LEVEL, LEVELS, UNTANGLE_PLAN, REPAIR_PLAN, stripPlan } from './logic';
import { storyCard, storySticker } from './art';
import { stripLayout } from './layout';
import {
  nextPicture,
  nextSlot,
  CAUSES,
  pictureText,
  STORIES,
  sameCard,
  storyPuzzle,
  type StoryCard,
} from './logic';

class StorySteps implements Game {
  readonly plan;
  readonly puzzle;
  readonly choices: { card: StoryCard; node: Container; drag: DragHandle; placed: boolean }[] = [];
  readonly slots: Container[] = [];
  private readonly placed = new Set<number>();
  private readonly background = new Graphics();
  private readonly path = new Graphics();
  private readonly glow = new Graphics();
  private readonly hintGlow = new Graphics();
  private readonly replay: RoundButton;
  private wrong = 0;
  private misses = 0;
  private hints = 0;
  private done = false;
  private playing = false;
  private alive = true;
  private clock = 0;
  /** One picture grows (level 15): no wrong card, any drop places it, and the picture grows in. */
  private readonly grow: boolean;

  constructor(private readonly ctx: GameContext) {
    this.grow = ctx.level === GROW_LEVEL;
    this.plan = stripPlan(ctx.level);
    this.puzzle = storyPuzzle(this.plan, ctx.rng);
    this.puzzle.fixed.forEach((i) => this.placed.add(i));
    this.replay = new RoundButton(replayArt(), swatch.yellow, 50, () => {
      if (!this.done) void this.readPlaced();
    });
    for (const decoration of [this.background, this.path, this.glow, this.hintGlow])
      decoration.eventMode = 'none';
    ctx.stage.addChild(this.background, this.path, this.glow, this.hintGlow, this.replay);
    this.puzzle.sequence.forEach((card, i) => {
      const slot = new Container();
      slot.addChild(this.placed.has(i) ? storyCard(card) : tile(164, 164, 'teal'));
      this.slots.push(slot);
      ctx.stage.addChild(slot);
    });
    const size = this.puzzle.choices.length > 4 ? 110 : 156;
    for (const card of this.puzzle.choices) {
      const node = storyCard(card, size);
      node.hitArea = new Rectangle(-size / 2, -size / 2, size, size);
      ctx.stage.addChild(node);
      const choice = { card, node, placed: false, drag: null as unknown as DragHandle };
      choice.drag = draggable(node, ctx.tw, {
        onPick: () => sfx.tick(),
        onDrop: (x, y) => {
          if (this.done || this.playing) return false;
          const index = this.next(),
            slot = this.slots[index];
          // One picture grows: the only card is the right one, so any put-down (or a still tap) places it.
          if (!slot || (!this.grow && (Math.abs(x - slot.x) > 91 || Math.abs(y - slot.y) > 98))) return false;
          if (!sameCard(card, this.puzzle.sequence[index])) {
            this.misses++;
            this.wrong++;
            sfx.boing();
            void ctx.say(this.puzzle.cause ? 'story.cause.wrong' : 'story.wrong', {
              action: pictureText(card),
            });
            if (this.wrong === 2) {
              this.hints++;
              void ctx.say('story.hint');
            }
            this.drawGlow();
            return false;
          }
          this.placed.add(index);
          choice.placed = true;
          choice.drag.enabled = false;
          node.visible = false;
          slot.removeChildren().forEach((c) => c.destroy({ children: true }));
          const placedCard = storyCard(card);
          slot.addChild(placedCard);
          if (this.grow) void this.growIn(placedCard, slot);
          this.wrong = 0;
          sfx.bell(5 + index, 0.3);
          void ctx.say('story.step', { step: pictureText(card) });
          if (this.placed.size === this.slots.length) {
            this.done = true;
            this.choices.forEach((c) => (c.drag.enabled = false));
            // Leave a moment to inspect the completed strip, then narrate it in order.
            void ctx.tw.wait(1.6).then(async () => {
              await this.readPlaced();
              if (this.alive) ctx.finish({ misses: this.misses, hints: this.hints });
            });
          }
          this.drawGlow();
          return true;
        },
      });
      this.choices.push(choice);
    }
  }
  start() {
    this.instruction();
  }
  /** The one-second grow: the placed picture springs up from small, with a shower of sparkles. */
  private async growIn(card: Container, slot: Container) {
    card.scale.set(0.35);
    sfx.bell(8, 0.3);
    this.ctx.particles.burst(slot.x, slot.y, { colors: [swatch.yellow.fill, swatch.green.fill], count: 16 });
    await this.ctx.tw.to(card.scale, { x: 1.15, y: 1.15 }, { duration: 0.55 });
    if (!this.alive) return;
    await this.ctx.tw.to(card.scale, { x: 1, y: 1 }, { duration: 0.35 });
  }
  private instruction() {
    if (this.grow) void this.ctx.instruct('story.grow');
    else if (this.puzzle.cause)
      void this.ctx.instruct('story.cause.start', { effect: pictureText(this.puzzle.sequence[1]) });
    else void this.ctx.instruct('story.start', { story: STORIES[this.puzzle.story].name });
  }
  private next(): number {
    return nextSlot(this.puzzle.sequence, this.placed);
  }
  private async readPlaced() {
    if (this.playing || !this.alive) return;
    this.playing = true;
    for (let i = 0; i < this.slots.length; i++) {
      if (!this.placed.has(i)) continue;
      const slot = this.slots[i],
        card = this.puzzle.sequence[i];
      this.glow
        .clear()
        .roundRect(slot.x - 91, slot.y - 91, 182, 182, 24)
        .stroke({ width: 7, color: swatch.yellow.line });
      await this.ctx.say('story.step', { step: pictureText(card) });
      if (!this.alive) return;
      await this.ctx.tw.wait(0.5);
    }
    if (this.done && this.puzzle.cause)
      await this.ctx.say('story.cause.because', { explanation: CAUSES[this.puzzle.cause].because });
    this.playing = false;
    this.drawGlow();
    if (!this.done) this.instruction();
  }
  resize(v: View) {
    const L = stripLayout(v, this.slots.length, this.choices.length);
    this.background
      .clear()
      .rect(0, 0, v.w, v.h)
      .fill(swatch.teal.light)
      .roundRect(L.panel.x, L.panel.y, L.panel.w, L.panel.h, 35)
      .fill(cream);
    this.slots.forEach((s, i) => s.position.set(L.slots[i].x, L.slots[i].y));
    const p = this.path.clear();
    for (const a of L.arrows)
      p.moveTo(a.x - 8, a.y - 13)
        .lineTo(a.x + 5, a.y)
        .lineTo(a.x - 8, a.y + 13)
        .stroke({ width: 5, color: swatch.teal.line });
    this.choices.forEach((c, i) => {
      c.drag.home = { ...L.tray[i] };
      if (!c.drag.dragging) {
        this.ctx.tw.kill(c.node);
        c.node.position.set(c.drag.home.x, c.drag.home.y);
      }
    });
    this.replay.position.set(L.replay.x, L.replay.y);
    this.drawGlow();
  }
  private drawGlow() {
    this.glow.clear();
    this.hintGlow.clear();
    if (this.done) return;
    const slot = this.slots[this.next()];
    this.glow
      .roundRect(slot.x - 91, slot.y - 91, 182, 182, 24)
      .stroke({ width: 7, color: swatch.yellow.line });
    if (this.wrong >= 2) {
      const c = this.choices.find((c) => sameCard(c.card, this.puzzle.sequence[this.next()]))!;
      const r = this.choices.length > 4 ? 65 : 87;
      this.hintGlow
        .roundRect(c.drag.home.x - r, c.drag.home.y - r, r * 2, r * 2, 22)
        .stroke({ width: 7, color: swatch.yellow.line });
    }
  }
  update(dt: number) {
    this.clock += dt;
    this.glow.alpha = this.hintGlow.alpha = 0.75 + 0.25 * Math.sin(this.clock * 3);
  }
  /** The ghost finger on the how-to card: carry the picture that comes next in the story to the first empty slot. */
  /** Guided first play points at the bot's next move: `autotouch` here only reads the board. */
  showMove(): TouchIntent | null {
    return this.autotouch();
  }

  autotouch(): TouchIntent | null {
    if (this.done || this.playing || !this.alive) return null;
    const next = nextPicture(
      this.puzzle.sequence,
      this.placed,
      this.choices.filter((c) => !c.drag.dragging),
    );
    return next
      ? {
          drag: { on: next.choice.node },
          to: { on: this.ctx.stage, x: this.slots[next.slot].x, y: this.slots[next.slot].y },
        }
      : null;
  }
  destroy() {
    this.alive = false;
    this.choices.forEach((c) => c.drag.destroy());
  }
}
export const storySteps: GameModule = {
  id: 'story-steps',
  name: 'Story Steps',
  titleLine: 'game.story-steps',
  region: 'story-grove',
  challenge: 'words',
  skills: ['sequencing', 'cause-and-effect', 'storytelling', 'prediction'],
  bands: ['lap', 'toddler', 'preschool', 'prek', 'school'],
  levels: (b) => rangeFor(LEVELS, b),
  entryLevels: [GROW_LEVEL],
  describeLevel: (l) =>
    l === GROW_LEVEL
      ? stripPlan(l).name
      : l >= 14
        ? VIEWPOINTS_NAME
        : l >= 12
          ? THEATER_PLANS[l >= 13 ? 1 : 0].name
          : l >= 11
            ? PREDICTION_PLAN.name
            : l === 10
              ? UNTANGLE_PLAN.name
              : l === 9
                ? REPAIR_PLAN.name
                : stripPlan(l).name,
  music: STYLES.paint,
  touchDemo: true,
  upright: true,
  coplayHint: 'Talk with {name} about the pictures: what happened first, and what changed?',
  coplayHintLap:
    'Help {name} tap or slide the picture into the space, then say what grew: "One block, two blocks!"',
  offScreen: {
    all: 'Talk through photos of a familiar activity, or draw the steps for planting a seed together.',
    // Under 3 (lap and toddler): no seed (small parts).
    lap: 'Stack two blocks together, or look at a photo of a plant growing.',
    toddler: 'Talk through photos of a familiar activity.',
  },
  hubIcon: () => new WigglyIcon(storySticker()),
  sticker: () => storySticker(),
  create: (ctx) =>
    ctx.level === GROW_LEVEL
      ? new StorySteps(ctx)
      : ctx.level >= 14
        ? new ViewpointsGame(ctx)
        : ctx.level >= 12
          ? new TheaterStoryGame(ctx)
          : ctx.level >= 11
            ? new PredictStory(ctx)
            : ctx.level === 10
              ? new UntangleStory(ctx)
              : ctx.level === 9
                ? new RepairStory(ctx)
                : new StorySteps(ctx),
};
