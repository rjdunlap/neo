import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, swatch } from '../../art/palette';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { RoundButton } from '../../ui/buttons';
import { replayArt } from '../shared';
import type { Game, GameContext, TouchIntent } from '../types';
import { storyCard } from './art';
import { pictureText, repairMove, repairPuzzle, STORIES, swapPictures, type StoryCard } from './logic';
import { repairLayout } from './layout';

/** A full strip stays editable until it tells the story; trying an order never counts as a miss. */
export class RepairStory implements Game {
  readonly puzzle;
  readonly slots: Container[] = [];
  strip: StoryCard[];
  selected: number | null = null;
  private previous: StoryCard[] | null = null;
  private readonly background = new Graphics();
  private readonly path = new Graphics();
  private readonly glow = new Graphics();
  private readonly hintGlow = new Graphics();
  private readonly replay: RoundButton;
  private readonly undo: RoundButton;
  private swaps = 0;
  private hints = 0;
  private done = false;
  private playing = false;
  private alive = true;
  private clock = 0;

  constructor(private readonly ctx: GameContext) {
    this.puzzle = repairPuzzle(ctx.rng);
    this.strip = this.puzzle.strip;
    this.replay = new RoundButton(replayArt(), swatch.yellow, 50, () => {
      if (!this.done) void this.readStrip();
    });
    const undoIcon = new Container();
    undoIcon.addChild(
      new Graphics()
        .moveTo(20, 17)
        .bezierCurveTo(30, -25, -25, -25, -22, 0)
        .moveTo(-35, -15)
        .lineTo(-22, 0)
        .lineTo(-7, -14)
        .stroke({ width: 7, color: swatch.teal.line, cap: 'round', join: 'round' }),
    );
    this.undo = new RoundButton(undoIcon, swatch.teal, 50, () => this.undoSwap());
    for (const node of [this.background, this.path, this.glow, this.hintGlow]) node.eventMode = 'none';
    ctx.stage.addChild(this.background, this.path, this.replay, this.undo);
    this.strip.forEach((_, i) => {
      const slot = new Container();
      slot.hitArea = new Rectangle(-82, -82, 164, 164);
      onTap(slot, () => this.select(i));
      this.slots.push(slot);
      ctx.stage.addChild(slot);
    });
    ctx.stage.addChild(this.glow, this.hintGlow);
    this.drawCards();
  }
  start() {
    this.instruction();
  }
  private instruction() {
    void this.ctx.instruct('story.repair.start', { story: STORIES[this.puzzle.story].name });
  }
  private select(index: number) {
    if (!this.alive || this.done || this.playing) return;
    sfx.tick();
    if (this.selected === null) {
      this.selected = index;
      void this.ctx.say('story.repair.select', { step: pictureText(this.strip[index]) });
    } else if (this.selected === index) {
      this.selected = null;
    } else {
      this.previous = [...this.strip];
      this.strip = swapPictures(this.strip, this.selected, index);
      this.selected = null;
      this.swaps++;
      this.drawCards();
      if (!repairMove(this.puzzle.sequence, this.strip)) {
        this.done = true;
        sfx.bell(8, 0.3);
        void this.ctx.tw.wait(1.2).then(async () => {
          await this.ctx.say('story.repair.done');
          await this.readStrip();
          if (this.alive) this.ctx.finish({ misses: 0, hints: this.hints });
        });
      } else if (this.swaps >= 8 && this.hints === 0) {
        this.hints = 1;
        const move = repairMove(this.puzzle.sequence, this.strip)!;
        void this.ctx.say('story.repair.hint', { step: pictureText(this.puzzle.sequence[move[0]]) });
      } else void this.ctx.say('story.repair.swap');
    }
    this.drawGlow();
  }
  private undoSwap() {
    if (!this.alive || this.done || this.playing || !this.previous) return;
    this.strip = this.previous;
    this.previous = null;
    this.selected = null;
    this.drawCards();
    this.drawGlow();
    void this.ctx.say('story.repair.undo');
  }
  private drawCards() {
    this.slots.forEach((slot, i) => {
      slot.removeChildren().forEach((child) => child.destroy({ children: true }));
      const picture = storyCard(this.strip[i]);
      picture.eventMode = 'none';
      slot.addChild(picture);
    });
    this.undo.alpha = this.previous ? 1 : 0.45;
  }
  private async readStrip() {
    if (this.playing || !this.alive) return;
    this.playing = true;
    for (let i = 0; i < this.strip.length; i++) {
      const slot = this.slots[i];
      this.glow
        .clear()
        .roundRect(slot.x - 91, slot.y - 91, 182, 182, 24)
        .stroke({ width: 7, color: swatch.yellow.line });
      await this.ctx.say('story.step', { step: pictureText(this.strip[i]) });
      if (!this.alive) return;
      await this.ctx.tw.wait(0.5);
    }
    this.playing = false;
    this.drawGlow();
    if (!this.done) this.instruction();
  }
  resize(v: View) {
    const L = repairLayout(v);
    this.background
      .clear()
      .rect(0, 0, v.w, v.h)
      .fill(swatch.teal.light)
      .roundRect(L.panel.x, L.panel.y, L.panel.w, L.panel.h, 35)
      .fill(cream);
    this.slots.forEach((slot, i) => slot.position.set(L.slots[i].x, L.slots[i].y));
    const p = this.path.clear();
    for (const a of L.arrows)
      p.moveTo(a.x - 8, a.y - 13)
        .lineTo(a.x + 5, a.y)
        .lineTo(a.x - 8, a.y + 13)
        .stroke({ width: 5, color: swatch.teal.line });
    this.replay.position.set(L.replay.x, L.replay.y);
    this.undo.position.set(L.undo.x, L.undo.y);
    this.drawGlow();
  }
  private drawGlow() {
    this.glow.clear();
    this.hintGlow.clear();
    if (this.done) return;
    if (this.selected !== null) {
      const slot = this.slots[this.selected];
      this.glow
        .roundRect(slot.x - 91, slot.y - 91, 182, 182, 24)
        .stroke({ width: 7, color: swatch.yellow.line });
    }
    const move = this.hints ? repairMove(this.puzzle.sequence, this.strip) : null;
    if (move) {
      const slot = this.slots[move[0]];
      this.hintGlow
        .roundRect(slot.x - 87, slot.y - 87, 174, 174, 22)
        .stroke({ width: 6, color: swatch.orange.line });
    }
  }
  update(dt: number) {
    this.clock += dt;
    this.glow.alpha = this.hintGlow.alpha = 0.75 + 0.25 * Math.sin(this.clock * 3);
  }
  autotouch(): TouchIntent | null {
    if (!this.alive || this.done || this.playing) return null;
    const move = repairMove(this.puzzle.sequence, this.strip);
    if (!move) return null;
    // A real selection may already exist; cancel it first if it is not the bot's useful first picture.
    const index = this.selected === null ? move[0] : this.selected === move[0] ? move[1] : this.selected;
    return { tap: { on: this.slots[index] } };
  }
  destroy() {
    this.alive = false;
  }
}
