import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, ink, swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { hintIndex, judge, layoutFor, LEVELS, makeBoard, planFor } from './logic';

function stoneArt(n: number): Container {
  const c = new Container();
  c.addChild(tile(100, 100, 'teal'), label(String(n), 42, ink));
  return c;
}

class BrainBreak implements Game {
  readonly board: number[];
  readonly stones: Container[] = [];
  readonly hintButton = new Container();
  next = 1;
  misses = 0;
  hints = 0;
  hinted = -1;
  finished = false;
  private consecutive = 0;
  private readonly background = new Graphics();
  private readonly status = label('', 36, ink);
  private readonly marks = new Graphics();
  private readonly glow = new Graphics();

  constructor(private readonly ctx: GameContext) {
    this.board = makeBoard(ctx.level, ctx.rng);
    this.background.eventMode = this.status.eventMode = this.marks.eventMode = this.glow.eventMode = 'none';
    this.board.forEach((n, i) => {
      const c = stoneArt(n);
      c.hitArea = new Rectangle(-50, -50, 100, 100);
      onTap(c, () => this.choose(i));
      this.stones.push(c);
    });
    this.hintButton.addChild(tile(132, 100, 'yellow'), label('Hint', 28, ink));
    this.hintButton.hitArea = new Rectangle(-66, -50, 132, 100);
    onTap(this.hintButton, () => this.askForHint());
    ctx.stage.addChild(this.background, this.status, ...this.stones, this.marks, this.glow, this.hintButton);
    this.resize(ctx.view);
  }
  start() { void this.ctx.instruct('brain.start', { n: this.board.length }); }
  private choose(i: number) {
    if (this.finished) return;
    const verdict = judge(this.board[i], this.next);
    if (verdict === 'done') return;
    if (verdict === 'wrong') {
      this.misses++; this.consecutive++; sfx.boing();
      if (this.consecutive === 2) this.askForHint();
      else void this.ctx.say('brain.try', { n: this.next });
      return;
    }
    sfx.bell((this.next - 1) % 5, 0.3);
    this.next++; this.consecutive = 0; this.hinted = -1;
    this.draw();
    if (this.next > this.board.length) {
      this.finished = true;
      void this.complete();
    } else void this.ctx.say('brain.next', { n: this.next });
  }
  private async complete() {
    await this.ctx.say('brain.done', { n: this.board.length });
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
  askForHint() {
    if (this.finished) return;
    this.hints++; this.hinted = hintIndex(this.board, this.next);
    this.draw(); void this.ctx.say('brain.hint', { n: this.next });
  }
  private draw() {
    this.status.text = this.next > this.board.length ? 'All stones lit!' : `Find ${this.next}   ·   ${this.next - 1} / ${this.board.length}`;
    this.marks.clear(); this.glow.clear();
    this.stones.forEach((stone, i) => {
      const done = this.board[i] < this.next;
      stone.alpha = done ? 0.5 : 1;
      if (done) this.marks.moveTo(stone.x + 24, stone.y + 27).lineTo(stone.x + 31, stone.y + 34)
        .lineTo(stone.x + 43, stone.y + 18).stroke({ width: 5, color: swatch.green.line, cap: 'round' });
      if (i === this.hinted) this.glow.roundRect(stone.x - 52, stone.y - 52, 104, 104, 20)
        .stroke({ width: 6, color: swatch.yellow.line });
    });
  }
  resize(view: View) {
    const layout = layoutFor(view.w, view.h, planFor(this.ctx.level).side);
    this.background.clear().rect(0, 0, view.w, view.h).fill(swatch.blue.light)
      .ellipse(view.w / 2, layout.top + 270, view.w * 0.45, 300).fill(swatch.teal.light);
    this.status.position.set(view.w / 2, 120);
    this.stones.forEach((stone, i) => stone.position.set(layout.stones[i].x, layout.stones[i].y));
    this.hintButton.position.set(layout.hint.x, layout.hint.y);
    this.draw();
  }
  autotouch(): TouchIntent | null {
    if (this.finished) return null;
    return { tap: { on: this.stones[hintIndex(this.board, this.next)] }, pause: 0.65 };
  }
  update(_dt: number) {}
  destroy() { this.finished = true; }
}

export const brainBreak: GameModule = {
  id: 'brain-break', name: 'Brain Break', titleLine: 'game.brain-break', region: 'puzzle-peaks',
  skills: ['Visual search', 'Number order'], bands: ['grownup'],
  levels: band => rangeFor(LEVELS, band), describeLevel: level => planFor(level).name,
  music: STYLES.lullaby, touchDemo: true,
  coplayHint: 'Take turns finding the next stone, or let one person call the number and the other find it.',
  offScreen: 'Shuffle numbered paper squares on a table and point to them in order, at your own pace.',
  hubIcon: () => new WigglyIcon(stoneArt(1)),
  sticker: seed => {
    const c = stoneArt(1 + (seed >>> 0) % 25);
    c.addChild(new Graphics().circle(34, -34, 12).fill(cream).stroke({ width: 3, color: swatch.yellow.line }));
    return c;
  },
  create: ctx => new BrainBreak(ctx),
};
