import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { cream, swatch, wood } from '../../art/palette';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { RoundButton } from '../../ui/buttons';
import { checkIcon } from '../../ui/icons';
import type { Game, GameContext, TouchIntent } from '../types';
import { CELL, DONE_RADIUS, mosaicLayout, type MosaicBox, type MosaicLayout } from './layout';
import {
  MOSAIC_MODELS,
  MOSAIC_PANES,
  MOSAIC_SIZE,
  hasPane,
  makeMosaicRound,
  mosaicCheck,
  mosaicHint,
  paneCount,
  planFor,
  type MosaicRound as MosaicPlan,
  type PixelPlan,
} from './logic';

/** Seconds between one colored pane's landing and the next in the proof. */
const SLIDE = 0.28;

/** A window: a wood frame, sixteen panes, the colored ones in the round's color. */
function drawWindow(g: Graphics, mask: number, pane: number, color: keyof typeof swatch) {
  const w = MOSAIC_SIZE * pane;
  g.roundRect(-pane * 0.12, -pane * 0.12, w + pane * 0.24, w + pane * 0.24, pane * 0.22)
    .fill(cream)
    .stroke({ width: Math.max(3, pane * 0.07), color: wood.line });
  for (let i = 0; i < MOSAIC_PANES; i++) {
    const x = (i % MOSAIC_SIZE) * pane;
    const y = Math.floor(i / MOSAIC_SIZE) * pane;
    const on = hasPane(mask, i);
    g.roundRect(x + pane * 0.05, y + pane * 0.05, pane * 0.9, pane * 0.9, pane * 0.12)
      .fill(on ? swatch[color].fill : 0xf4f4f8)
      .stroke({ width: 2, color: on ? swatch[color].line : 0xd8d8e2 });
  }
}

/**
 * Pixel Pictures level 13, Window Mosaic: a window hangs with half its panes colored. She colors a second, empty window so
 * the same amount is colored in a shape that looks different (tag 1), picks which of three windows has the same amount
 * colored (tag 2), and watches the colored panes of the model slide across one for one onto hers (the proof, shown and
 * never asked). Only a wrong count or a wrong window is a miss; a turned copy of the model is free. The rules are in
 * `logic.ts` and the definition is `docs/definitions/window-mosaic.md`.
 */
export class MosaicRound implements Game {
  readonly plan: PixelPlan;
  readonly round: MosaicPlan;
  /** Tag 1: the panes she has colored. */
  mask = 0;
  /** 1 = coloring her window, 2 = choosing a window, 3 = the proof and finish. */
  tag: 1 | 2 | 3 = 1;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  readonly board = new Container();
  readonly check: RoundButton;
  readonly choices: Container[] = [];

  private readonly cells = new Graphics();
  private readonly modelWindow = new Graphics();
  private readonly glow = new Graphics();
  private readonly flyers = new Container();
  private readonly choiceFaces: Graphics[] = [];
  private layout: MosaicLayout;
  private wrongs = 0;
  /** The pane glowing as help (tag 1) or the choice (tag 2). */
  private hinted: number | null = null;
  private clock = 0;
  /** Every line carries her name, which keeps these lines on device speech (no rendered clip). */
  private get vars() {
    return { name: this.ctx.childName };
  }

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.round = makeMosaicRound(ctx.rng);
    this.layout = mosaicLayout(ctx.view);
    this.glow.eventMode = 'none';
    this.modelWindow.eventMode = 'none';
    this.cells.eventMode = 'none';
    this.flyers.eventMode = 'none';
    this.board.addChild(this.cells);
    this.board.eventMode = 'static';
    onTap(this.board, (e) => this.tapBoard(e), { cooldown: 80 });
    this.check = new RoundButton(checkIcon(), swatch.green, DONE_RADIUS, () => this.press());
    ctx.stage.addChild(this.modelWindow, this.board, this.check);
    this.round.windows.forEach((_, i) => {
      const node = new Container();
      const face = new Graphics();
      node.addChild(face);
      node.visible = false;
      onTap(node, () => this.choose(i), { cooldown: 300 });
      this.choices.push(node);
      this.choiceFaces.push(face);
      ctx.stage.addChild(node);
    });
    ctx.stage.addChild(this.glow, this.flyers);
  }

  get model() {
    return MOSAIC_MODELS[this.round.model].mask;
  }

  start() {
    this.resize(this.ctx.view);
    this.busy = false;
    void this.ctx.instruct('pixel.mosaic.color', this.vars);
  }

  resize(v: View) {
    this.layout = mosaicLayout(v);
    const l = this.layout;
    this.board.position.set(l.own.x, l.own.y);
    this.board.hitArea = new Rectangle(0, 0, MOSAIC_SIZE * CELL, MOSAIC_SIZE * CELL);
    this.check.position.set(l.check.x, l.check.y);
    this.choices.forEach((node, i) => {
      const b = l.choices[i];
      node.position.set(b.x, b.y);
      const w = MOSAIC_SIZE * b.pane;
      node.hitArea = new Rectangle(-12, -12, w + 24, w + 24);
    });
    this.draw();
  }

  update(dt: number) {
    this.clock += dt;
    const g = this.glow.clear();
    if (this.busy || this.hinted === null) return;
    const pulse = 7 + 2 * Math.sin(this.clock * 6);
    if (this.tag === 1) {
      const x = this.layout.own.x + (this.hinted % MOSAIC_SIZE) * CELL;
      const y = this.layout.own.y + Math.floor(this.hinted / MOSAIC_SIZE) * CELL;
      g.roundRect(x + 4, y + 4, CELL - 8, CELL - 8, 14).stroke({ width: pulse, color: swatch.yellow.fill });
    } else if (this.tag === 2) {
      const b = this.layout.choices[this.hinted];
      const w = MOSAIC_SIZE * b.pane;
      g.roundRect(b.x - 14, b.y - 14, w + 28, w + 28, 22).stroke({ width: pulse, color: swatch.yellow.fill });
    }
  }

  /** The ghost finger: eight panes in a shape that differs from the model, the check, then the right window. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished) return null;
    if (this.tag === 1) {
      if (mosaicCheck(this.mask, this.model) === 'right') return { tap: { on: this.check } };
      const pane = mosaicHint(this.mask, this.model);
      return {
        tap: {
          on: this.board,
          x: (pane % MOSAIC_SIZE) * CELL + CELL / 2,
          y: Math.floor(pane / MOSAIC_SIZE) * CELL + CELL / 2,
        },
        pause: 0.1,
      };
    }
    if (this.tag === 2) return { tap: { on: this.choices[this.round.right], x: 100, y: 100 } };
    return null;
  }

  destroy() {}

  private draw() {
    const l = this.layout;
    const color = this.round.color;
    const m = this.modelWindow.clear();
    const box: MosaicBox = this.tag === 1 ? l.model : l.pickModel;
    m.position.set(box.x, box.y);
    drawWindow(m, this.model, box.pane, color);
    const g = this.cells.clear();
    drawWindow(g, this.mask, CELL, color);
    this.board.visible = this.tag === 1 || this.tag === 3;
    this.check.visible = this.tag === 1;
    this.choices.forEach((node, i) => {
      node.visible = this.tag === 2;
      const face = this.choiceFaces[i].clear();
      drawWindow(face, this.round.windows[i], l.choices[i].pane, color);
    });
  }

  private tapBoard(e: FederatedPointerEvent) {
    if (this.busy || this.finished || this.tag !== 1) return;
    const p = this.board.toLocal(e.global);
    const x = Math.floor(p.x / CELL);
    const y = Math.floor(p.y / CELL);
    if (x < 0 || y < 0 || x >= MOSAIC_SIZE || y >= MOSAIC_SIZE) return;
    const pane = y * MOSAIC_SIZE + x;
    const was = hasPane(this.mask, pane);
    this.mask ^= 1 << pane;
    if (this.hinted === pane) this.hinted = null;
    if (was) sfx.tick();
    else sfx.pop(4 + ((x + y) % 6));
    this.draw();
  }

  /** The green check: a count that is not half is a miss; a turned copy of the model is free and asks for another shape. */
  private press() {
    if (this.busy || this.finished || this.tag !== 1) return;
    const verdict = mosaicCheck(this.mask, this.model);
    if (verdict === 'right') return void this.pick();
    if (verdict === 'empty') return void this.ctx.say('pixel.mosaic.fewer', this.vars);
    if (verdict === 'same') {
      sfx.tick();
      return void this.ctx.say('pixel.mosaic.same', this.vars);
    }
    this.misses++;
    this.wrongs++;
    sfx.boing();
    void this.ctx.say(verdict === 'fewer' ? 'pixel.mosaic.fewer' : 'pixel.mosaic.more', this.vars);
    if (this.wrongs >= 2 && this.hinted === null) {
      this.hints++;
      this.hinted = mosaicHint(this.mask, this.model);
    }
  }

  /** Tag 2: the model on top, three windows under it. */
  private pick() {
    this.tag = 2;
    this.wrongs = 0;
    this.hinted = null;
    sfx.bell(5, 0.25);
    this.ctx.pet.cheer();
    this.draw();
    void this.ctx.instruct('pixel.mosaic.pick', this.vars);
  }

  private choose(i: number) {
    if (this.busy || this.finished || this.tag !== 2) return;
    if (i === this.round.right) return void this.proof();
    this.misses++;
    this.wrongs++;
    sfx.boing();
    void this.ctx.say('pixel.mosaic.wrong', this.vars);
    if (this.wrongs >= 2 && this.hinted === null) {
      this.hints++;
      this.hinted = this.round.right;
      void this.ctx.say('pixel.mosaic.hint', this.vars);
    }
  }

  /** The proof: the model's colored panes, in reading order, slide onto her colored panes one for one. Shown, never asked. */
  private async proof() {
    this.busy = true;
    this.hinted = null;
    this.tag = 3;
    // Her window comes back showing the amount she colored, beside the model.
    this.draw();
    const l = this.layout;
    const color = this.round.color;
    // The model sits where tag 1 left it; hers is the colored window she made.
    const model = this.modelWindow;
    model.position.set(l.model.x, l.model.y);
    const from: { x: number; y: number }[] = [];
    const to: { x: number; y: number }[] = [];
    for (let i = 0; i < MOSAIC_PANES; i++) {
      const pane = l.model.pane;
      if (hasPane(this.model, i))
        from.push({
          x: l.model.x + (i % MOSAIC_SIZE) * pane + pane / 2,
          y: l.model.y + Math.floor(i / MOSAIC_SIZE) * pane + pane / 2,
        });
      if (hasPane(this.mask, i))
        to.push({
          x: l.own.x + (i % MOSAIC_SIZE) * CELL + CELL / 2,
          y: l.own.y + Math.floor(i / MOSAIC_SIZE) * CELL + CELL / 2,
        });
    }
    sfx.bell(3, 0.2);
    void this.ctx.say('pixel.mosaic.proof', this.vars);
    const n = Math.min(from.length, to.length, paneCount(this.model));
    for (let k = 0; k < n; k++) {
      const chip = new Graphics()
        .roundRect(-18, -18, 36, 36, 8)
        .fill(swatch[color].fill)
        .stroke({ width: 3, color: swatch[color].line });
      chip.position.set(from[k].x, from[k].y);
      this.flyers.addChild(chip);
      await this.ctx.tw.to(chip, { x: to[k].x, y: to[k].y }, { duration: SLIDE, ease: ease.outQuad });
      sfx.pop(2 + k);
      this.ctx.particles.burst(to[k].x, to[k].y, {
        kind: 'star',
        colors: [0xffffff, 0xfff3a0, swatch[color].light],
        count: 4,
        speed: [60, 160],
        gravity: 0,
        life: [0.3, 0.5],
      });
    }
    await this.ctx.tw.wait(0.4);
    await this.ctx.say('pixel.mosaic.done', this.vars);
    this.finale();
  }

  private finale() {
    if (this.finished) return;
    this.finished = true;
    sfx.tada();
    this.ctx.pet.cheer();
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}
