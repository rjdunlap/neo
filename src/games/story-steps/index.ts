import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { spread, type View } from '../../engine/view';
import { RoundButton } from '../../ui/buttons';
import { replayArt, tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { storyCard, storySticker } from './art';
import { nextPicture, nextSlot, STORIES, STORY_PLANS, sameCard, storyPuzzle, type StoryCard } from './logic';

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

  constructor(private readonly ctx: GameContext) {
    this.plan = STORY_PLANS[Math.max(0, Math.min(STORY_PLANS.length - 1, ctx.level - 1))];
    this.puzzle = storyPuzzle(this.plan, ctx.rng);
    this.puzzle.fixed.forEach((i) => this.placed.add(i));
    this.replay = new RoundButton(replayArt(), swatch.yellow, 50, () => { if (!this.done) void this.readPlaced(); });
    ctx.stage.addChild(this.background, this.path, this.glow, this.hintGlow, this.replay);
    this.puzzle.sequence.forEach((card, i) => {
      const slot = new Container(); slot.addChild(this.placed.has(i) ? storyCard(card) : tile(164, 164, 'teal'));
      this.slots.push(slot); ctx.stage.addChild(slot);
    });
    const size = this.puzzle.choices.length > 4 ? 110 : 156;
    for (const card of this.puzzle.choices) {
      const node = storyCard(card, size); node.hitArea = new Rectangle(-size / 2, -size / 2, size, size);
      ctx.stage.addChild(node);
      const choice = { card, node, placed: false, drag: null as unknown as DragHandle };
      choice.drag = draggable(node, ctx.tw, {
        onPick: () => sfx.tick(),
        onDrop: (x, y) => {
          if (this.done || this.playing) return false;
          const index = this.next(), slot = this.slots[index];
          if (!slot || Math.abs(x - slot.x) > 91 || Math.abs(y - slot.y) > 98) return false;
          if (!sameCard(card, this.puzzle.sequence[index])) {
            this.misses++; this.wrong++; sfx.boing(); void ctx.say('story.wrong');
            if (this.wrong === 2) { this.hints++; void ctx.say('story.hint'); }
            this.drawGlow(); return false;
          }
          this.placed.add(index); choice.placed = true; choice.drag.enabled = false; node.visible = false;
          slot.removeChildren().forEach((c) => c.destroy({ children: true })); slot.addChild(storyCard(card));
          this.wrong = 0; sfx.bell(5 + index, 0.3);
          void ctx.say('story.step', { step: STORIES[card.story].steps[card.stage] });
          if (this.placed.size === this.slots.length) {
            this.done = true; this.choices.forEach((c) => c.drag.enabled = false);
            // Leave a moment to inspect the completed strip, then narrate it in order.
            void ctx.tw.wait(1.6).then(async () => {
              await this.readPlaced();
              if (this.alive) ctx.finish({ misses: this.misses, hints: this.hints });
            });
          }
          this.drawGlow(); return true;
        },
      });
      this.choices.push(choice);
    }
  }
  start() { this.instruction(); }
  private instruction() { void this.ctx.instruct('story.start', { story: STORIES[this.puzzle.story].name }); }
  private next(): number { return nextSlot(this.puzzle.sequence, this.placed); }
  private async readPlaced() {
    if (this.playing || !this.alive) return;
    this.playing = true;
    for (let i = 0; i < this.slots.length; i++) {
      if (!this.placed.has(i)) continue;
      const slot = this.slots[i], card = this.puzzle.sequence[i];
      this.glow.clear().roundRect(slot.x - 91, slot.y - 91, 182, 182, 24).stroke({ width: 7, color: swatch.yellow.line });
      await this.ctx.say('story.step', { step: STORIES[card.story].steps[card.stage] });
      if (!this.alive) return;
      await this.ctx.tw.wait(0.5);
    }
    this.playing = false; this.drawGlow();
    if (!this.done) this.instruction();
  }
  resize(v: View) {
    this.background.clear().rect(0, 0, v.w, v.h).fill(swatch.teal.light).roundRect(155, v.h - 255, v.w - 190, 215, 35).fill(cream);
    const xs = spread(this.slots.length, 85, v.w - 85, 212);
    this.slots.forEach((s, i) => s.position.set(xs[i], v.h * 0.4));
    const p = this.path.clear();
    for (let i = 0; i < xs.length - 1; i++) {
      const x = (xs[i] + xs[i + 1]) / 2, y = v.h * 0.4;
      p.moveTo(x - 8, y - 13).lineTo(x + 5, y).lineTo(x - 8, y + 13).stroke({ width: 5, color: swatch.teal.line });
    }
    const choices = spread(this.choices.length, 170, v.w - 40, this.choices.length > 4 ? 126 : 184);
    this.choices.forEach((c, i) => {
      c.drag.home = { x: choices[i], y: v.h - 148 };
      if (!c.drag.dragging) { this.ctx.tw.kill(c.node); c.node.position.set(c.drag.home.x, c.drag.home.y); }
    });
    this.replay.position.set(v.w - 70, 70);
    this.drawGlow();
  }
  private drawGlow() {
    this.glow.clear(); this.hintGlow.clear();
    if (this.done) return;
    const slot = this.slots[this.next()];
    this.glow.roundRect(slot.x - 91, slot.y - 91, 182, 182, 24).stroke({ width: 7, color: swatch.yellow.line });
    if (this.wrong >= 2) {
      const c = this.choices.find((c) => sameCard(c.card, this.puzzle.sequence[this.next()]))!;
      const r = this.choices.length > 4 ? 65 : 87;
      this.hintGlow.roundRect(c.drag.home.x - r, c.drag.home.y - r, r * 2, r * 2, 22).stroke({ width: 7, color: swatch.yellow.line });
    }
  }
  update(dt: number) { this.clock += dt; this.glow.alpha = this.hintGlow.alpha = 0.75 + 0.25 * Math.sin(this.clock * 3); }
  /** The ghost finger on the how-to card: carry the picture that comes next in the story to the first empty slot. */
  autotouch(): TouchIntent | null {
    if (this.done || this.playing || !this.alive) return null;
    const next = nextPicture(this.puzzle.sequence, this.placed, this.choices.filter((c) => !c.drag.dragging));
    return next ? { drag: { on: next.choice.node }, to: { on: this.ctx.stage, x: this.slots[next.slot].x, y: this.slots[next.slot].y } } : null;
  }
  destroy() { this.alive = false; this.choices.forEach((c) => c.drag.destroy()); }
}
export const storySteps: GameModule = {
  id: 'story-steps', name: 'Story Steps', titleLine: 'game.story-steps', region: 'story-grove',
  skills: ['sequencing', 'cause-and-effect', 'storytelling'], bands: ['toddler', 'preschool', 'prek', 'school'],
  levels: (b) => b === 'school' ? { min: 6, max: 7 } : b === 'prek' ? { min: 4, max: 7 } : b === 'preschool' ? { min: 2, max: 5 } : { min: 1, max: 2 },
  describeLevel: (l) => STORY_PLANS[Math.max(0, Math.min(STORY_PLANS.length - 1, l - 1))].name,
  music: STYLES.paint, touchDemo: true, coplayHint: 'Talk with {name} about the pictures: what happened first, and what changed?',
  offScreen: 'Talk through photos of a familiar activity, or draw the steps for planting a seed together.',
  hubIcon: () => new WigglyIcon(storySticker()), sticker: () => storySticker(), create: (ctx) => new StorySteps(ctx),
};
