import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, swatch } from '../../art/palette';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { spread, type View } from '../../engine/view';
import { RoundButton } from '../../ui/buttons';
import { replayArt, tile } from '../shared';
import type { Game, GameContext, TouchIntent } from '../types';
import { predictionPicture } from './prediction-art';
import { predictionFeedback, predictionPuzzle } from './predictions';

export class PredictStory implements Game {
  readonly puzzle;
  readonly slots: Container[] = [];
  readonly choices: { ending: number; node: Container; drag: DragHandle }[] = [];
  readonly replay: RoundButton;
  private readonly background = new Graphics();
  private readonly glow = new Graphics();
  private unsupported = 0;
  private misses = 0;
  private hints = 0;
  private done = false;
  private playing = false;
  private alive = true;
  private clock = 0;

  constructor(private readonly ctx: GameContext) {
    this.puzzle = predictionPuzzle(ctx.rng);
    this.background.eventMode = this.glow.eventMode = 'none';
    this.replay = new RoundButton(replayArt(), swatch.yellow, 50, () => { if (!this.done) void this.read(); });
    ctx.stage.addChild(this.background, this.glow, this.replay);
    for (let i = 0; i < 4; i++) {
      const slot = new Container(); slot.addChild(i < 3 ? predictionPicture(this.puzzle.story, i) : tile(164, 164, 'teal'));
      if (i < 3) {
        slot.hitArea = new Rectangle(-82, -82, 164, 164);
        onTap(slot, () => { if (!this.playing && !this.done) void ctx.say('story.step', { step: this.puzzle.story.opening[i] }); });
      }
      this.slots.push(slot); ctx.stage.addChild(slot);
    }
    for (const ending of this.puzzle.choices) {
      const node = predictionPicture(this.puzzle.story, 3, ending); node.hitArea = new Rectangle(-82, -82, 164, 164); ctx.stage.addChild(node);
      const choice = { ending, node, drag: null as unknown as DragHandle };
      choice.drag = draggable(node, ctx.tw, {
        onPick: () => sfx.tick(),
        onDrop: (x, y) => {
          const slot = this.slots[3];
          if (this.done || this.playing || !this.alive || Math.abs(x - slot.x) > 95 || Math.abs(y - slot.y) > 98) return false;
          const feedback = predictionFeedback(ending, this.unsupported);
          if (feedback.miss) { this.misses++; sfx.boing(); }
          if (feedback.hint) this.hints++;
          if (!feedback.complete) this.unsupported++;
          this.done = feedback.complete; this.playing = true;
          this.choices.forEach((c) => c.drag.enabled = false);
          slot.removeChildren().forEach((c) => c.destroy({ children: true }));
          slot.addChild(predictionPicture(this.puzzle.story, 3, ending));
          if (this.done) { node.visible = false; sfx.bell(8, 0.3); }
          else sfx.tick();
          this.drawGlow(); void this.playEnding(ending);
          return this.done;
        },
      });
      this.choices.push(choice);
    }
  }
  start() { void this.ctx.instruct('story.predict.start'); }
  private async playEnding(ending: number) {
    await this.ctx.say('story.step', { step: this.puzzle.story.endings[ending] });
    await this.ctx.tw.wait(0.8);
    if (this.done) {
      await this.ctx.say('story.predict.reason', { reason: this.puzzle.story.reason });
      if (this.alive) this.ctx.finish({ misses: this.misses, hints: this.hints });
      return;
    }
    await this.ctx.say('story.predict.try', { clue: this.puzzle.story.clue });
    if (!this.alive) return;
    const slot = this.slots[3];
    slot.removeChildren().forEach((c) => c.destroy({ children: true })); slot.addChild(tile(164, 164, 'teal'));
    this.playing = false; this.choices.forEach((c) => c.drag.enabled = true); this.drawGlow(); this.start();
  }
  private async read() {
    if (this.playing || !this.alive) return;
    this.playing = true; this.choices.forEach((c) => c.drag.enabled = false);
    for (const step of this.puzzle.story.opening) { await this.ctx.say('story.step', { step }); await this.ctx.tw.wait(0.35); }
    if (!this.alive) return;
    this.playing = false; this.choices.forEach((c) => c.drag.enabled = true); this.start();
  }
  resize(v: View) {
    this.background.clear().rect(0, 0, v.w, v.h).fill(swatch.teal.light).roundRect(155, v.h - 255, v.w - 190, 215, 35).fill(cream);
    const xs = spread(4, 100, v.w - 100, 210);
    this.slots.forEach((s, i) => s.position.set(xs[i], v.h * 0.4));
    const tray = spread(2, 260, v.w - 110, 230);
    this.choices.forEach((c, i) => { c.drag.home = { x: tray[i], y: v.h - 148 }; if (!c.drag.dragging) { this.ctx.tw.kill(c.node); c.node.position.set(c.drag.home.x, c.drag.home.y); } });
    this.replay.position.set(v.w - 70, 70); this.drawGlow();
  }
  private drawGlow() {
    this.glow.clear(); if (this.done) return;
    const slot = this.slots[3];
    this.glow.roundRect(slot.x - 91, slot.y - 91, 182, 182, 24).stroke({ width: 7, color: swatch.yellow.line });
    if (this.unsupported >= 2) {
      const clue = this.slots[2];
      this.glow.roundRect(clue.x - 91, clue.y - 91, 182, 182, 24).stroke({ width: 7, color: swatch.yellow.line });
    }
  }
  update(dt: number) { this.clock += dt; this.glow.alpha = 0.75 + 0.25 * Math.sin(this.clock * 3); }
  autotouch(): TouchIntent | null {
    if (this.done || this.playing || !this.alive) return null;
    const choice = this.choices.find((c) => c.ending === this.puzzle.supported && !c.drag.dragging);
    const slot = this.slots[3];
    return choice ? { drag: { on: choice.node }, to: { on: this.ctx.stage, x: slot.x, y: slot.y } } : null;
  }
  destroy() { this.alive = false; this.choices.forEach((c) => c.drag.destroy()); this.slots.forEach((s) => s.removeAllListeners()); }
}
