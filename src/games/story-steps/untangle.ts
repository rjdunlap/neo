import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, swatch } from '../../art/palette';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { spread, type View } from '../../engine/view';
import { RoundButton } from '../../ui/buttons';
import { replayArt, tile } from '../shared';
import type { Game, GameContext, TouchIntent } from '../types';
import { storyCard } from './art';
import { nextSlot, nextUntangle, pictureText, STORIES, untanglePuzzle, untangleTarget, type StoryCard } from './logic';

export class UntangleStory implements Game {
  readonly puzzle;
  readonly placed = [new Set<number>(), new Set<number>()];
  readonly slots: Container[][] = [[], []];
  readonly choices: { card: StoryCard; node: Container; drag: DragHandle; placed: boolean }[] = [];
  readonly anchors: Container[] = [];
  readonly replay: RoundButton;
  private readonly background = new Graphics();
  private readonly path = new Graphics();
  private readonly glow = new Graphics();
  private readonly hintGlow = new Graphics();
  private wrong = 0;
  private hintRow = 0;
  private misses = 0;
  private hints = 0;
  private done = false;
  private playing = false;
  private alive = true;
  private clock = 0;

  constructor(private readonly ctx: GameContext) {
    this.puzzle = untanglePuzzle(ctx.rng);
    for (const d of [this.background, this.path, this.glow, this.hintGlow]) d.eventMode = 'none';
    this.replay = new RoundButton(replayArt(), swatch.yellow, 50, () => { if (!this.done) void this.readPlaced(); });
    ctx.stage.addChild(this.background, this.path, this.glow, this.hintGlow, this.replay);
    this.puzzle.rows.forEach((row, r) => {
      // A picture beside each row makes its identity visible without reading or guessing an invisible assignment.
      const anchor = storyCard(row[2], 110);
      anchor.hitArea = new Rectangle(-55, -55, 110, 110);
      onTap(anchor, () => { if (!this.playing && !this.done) void ctx.say('story.untangle.row', { story: STORIES[this.puzzle.stories[r]].name }); });
      this.anchors.push(anchor); ctx.stage.addChild(anchor);
      row.forEach(() => { const slot = new Container(); slot.addChild(tile(164, 164, 'teal')); this.slots[r].push(slot); ctx.stage.addChild(slot); });
    });
    for (const card of this.puzzle.choices) {
      const node = storyCard(card, 110); node.hitArea = new Rectangle(-55, -55, 110, 110); ctx.stage.addChild(node);
      const choice = { card, node, placed: false, drag: null as unknown as DragHandle };
      choice.drag = draggable(node, ctx.tw, {
        onPick: () => sfx.tick(),
        onDrop: (x, y) => {
          if (this.done || this.playing || !this.alive) return false;
          const targets = this.slots.flatMap((row, r) => row.map((slot, i) => ({ slot, r, i })))
            .filter(({ slot }) => Math.abs(x - slot.x) <= 91 && Math.abs(y - slot.y) <= 98)
            .sort((a, b) => Math.hypot(x - a.slot.x, y - a.slot.y) - Math.hypot(x - b.slot.x, y - b.slot.y));
          const target = targets[0];
          if (!target) return false;
          const { slot, r, i } = target;
          if (untangleTarget(this.puzzle.rows, this.placed, r, card) !== i) {
            this.misses++; this.wrong++; this.hintRow = nextSlot(this.puzzle.rows[r], this.placed[r]) < 0 ? 1 - r : r;
            sfx.boing(); void ctx.say('story.untangle.wrong', this.names());
            if (this.wrong === 2) { this.hints++; void ctx.say('story.hint'); }
            this.drawGlow(); return false;
          }
          this.placed[r].add(i); choice.placed = true; choice.drag.enabled = false; node.visible = false;
          slot.removeChildren().forEach((c) => c.destroy({ children: true })); slot.addChild(storyCard(card));
          this.wrong = 0; sfx.bell(5 + i, 0.3); void ctx.say('story.step', { step: pictureText(card) });
          if (this.placed.every((p) => p.size === 3)) {
            this.done = true; this.choices.forEach((c) => c.drag.enabled = false);
            void ctx.tw.wait(1.6).then(async () => { await this.readPlaced(); if (this.alive) ctx.finish({ misses: this.misses, hints: this.hints }); });
          }
          this.drawGlow(); return true;
        },
      });
      this.choices.push(choice);
    }
  }
  private names() { return { first: STORIES[this.puzzle.stories[0]].name, second: STORIES[this.puzzle.stories[1]].name }; }
  start() { void this.ctx.instruct('story.untangle.start', this.names()); }
  private async readPlaced() {
    if (this.playing || !this.alive) return;
    this.playing = true;
    for (let r = 0; r < 2; r++) {
      await this.ctx.say('story.untangle.row', { story: STORIES[this.puzzle.stories[r]].name });
      for (let i = 0; i < 3; i++) {
        if (!this.placed[r].has(i)) continue;
        const slot = this.slots[r][i];
        this.glow.clear().roundRect(slot.x - 91, slot.y - 91, 182, 182, 24).stroke({ width: 7, color: swatch.yellow.line });
        await this.ctx.say('story.step', { step: pictureText(this.puzzle.rows[r][i]) });
        if (!this.alive) return;
        await this.ctx.tw.wait(0.5);
      }
    }
    this.playing = false; this.drawGlow(); if (!this.done) this.start();
  }
  resize(v: View) {
    this.background.clear().rect(0, 0, v.w, v.h).fill(swatch.teal.light).roundRect(155, v.h - 235, v.w - 185, 195, 35).fill(cream);
    const xs = spread(3, 320, v.w - 110, 210);
    const ys = [v.h * 0.29, v.h * 0.56];
    this.path.clear();
    this.slots.forEach((row, r) => {
      this.anchors[r].position.set(195, ys[r]);
      row.forEach((s, i) => s.position.set(xs[i], ys[r]));
      for (let i = 0; i < 2; i++) {
        const x = (xs[i] + xs[i + 1]) / 2, y = ys[r];
        this.path.moveTo(x - 8, y - 13).lineTo(x + 5, y).lineTo(x - 8, y + 13).stroke({ width: 5, color: swatch.teal.line });
      }
    });
    const tray = spread(6, 215, v.w - 80, 126);
    this.choices.forEach((c, i) => { c.drag.home = { x: tray[i], y: v.h - 135 }; if (!c.drag.dragging) { this.ctx.tw.kill(c.node); c.node.position.set(c.drag.home.x, c.drag.home.y); } });
    this.replay.position.set(v.w - 70, 70); this.drawGlow();
  }
  private drawGlow() {
    this.glow.clear(); this.hintGlow.clear(); if (this.done) return;
    this.slots.forEach((row, r) => {
      const i = nextSlot(this.puzzle.rows[r], this.placed[r]); if (i < 0) return;
      const s = row[i]; this.glow.roundRect(s.x - 91, s.y - 91, 182, 182, 24).stroke({ width: 7, color: swatch.yellow.line });
    });
    if (this.wrong >= 2) {
      const i = nextSlot(this.puzzle.rows[this.hintRow], this.placed[this.hintRow]);
      const c = this.choices.find((c) => untangleTarget(this.puzzle.rows, this.placed, this.hintRow, c.card) === i && !c.placed);
      if (c) this.hintGlow.roundRect(c.drag.home.x - 65, c.drag.home.y - 65, 130, 130, 22).stroke({ width: 7, color: swatch.yellow.line });
    }
  }
  update(dt: number) { this.clock += dt; this.glow.alpha = this.hintGlow.alpha = 0.75 + 0.25 * Math.sin(this.clock * 3); }
  autotouch(): TouchIntent | null {
    if (this.done || this.playing || !this.alive) return null;
    const next = nextUntangle(this.puzzle.rows, this.placed, this.choices.filter((c) => !c.drag.dragging));
    if (!next) return null;
    const slot = this.slots[next.row][next.slot];
    return { drag: { on: next.choice.node }, to: { on: this.ctx.stage, x: slot.x, y: slot.y } };
  }
  destroy() { this.alive = false; this.choices.forEach((c) => c.drag.destroy()); this.anchors.forEach((a) => a.removeAllListeners()); }
}
