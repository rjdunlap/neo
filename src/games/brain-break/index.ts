import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { cream, ink, swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { hintIndex, judge, layoutFor, LEVELS, makeBoard, makeLabels, planFor, showsSums } from './logic';

/** Sets a stone's label, shrinking a sum to stay inside the stone. */
function setLabel(t: Text, text: string) {
  t.text = text;
  t.style.fontSize = text.length > 2 ? 34 : 42;
  t.scale.set(1);
  if (t.width > 88) t.scale.set(88 / t.width);
}

function stoneArt(text: string): Container {
  const c = new Container(),
    t = label('', 42, ink);
  setLabel(t, text);
  c.addChild(tile(100, 100, 'teal'), t);
  return c;
}

class BrainBreak implements Game {
  readonly board: number[];
  readonly labels: string[];
  readonly sums: boolean;
  readonly stones: Container[] = [];
  private readonly texts: Text[] = [];
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
    this.labels = makeLabels(this.board, ctx.level, ctx.rng);
    this.sums = showsSums(ctx.level);
    this.background.eventMode = this.status.eventMode = this.marks.eventMode = this.glow.eventMode = 'none';
    this.board.forEach((_, i) => {
      const c = stoneArt(this.labels[i]);
      this.texts.push(c.children[1] as Text);
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
  start() {
    void this.ctx.instruct(this.sums ? 'brain.sums.start' : 'brain.start', { n: this.board.length });
  }
  private choose(i: number) {
    if (this.finished) return;
    const verdict = judge(this.board[i], this.next);
    if (verdict === 'done') return;
    if (verdict === 'wrong') {
      this.misses++;
      this.consecutive++;
      sfx.boing();
      if (this.consecutive === 2) this.askForHint();
      else if (this.sums) void this.ctx.say('brain.sums.try', { m: this.board[i], n: this.next });
      else void this.ctx.say('brain.try', { n: this.next });
      return;
    }
    sfx.bell((this.next - 1) % 5, 0.3);
    if (this.sums) setLabel(this.texts[i], String(this.board[i]));
    this.next++;
    this.consecutive = 0;
    this.hinted = -1;
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
    this.hints++;
    this.hinted = hintIndex(this.board, this.next);
    this.draw();
    void this.ctx.say(this.sums ? 'brain.sums.hint' : 'brain.hint', { n: this.next });
  }
  private draw() {
    this.status.text =
      this.next > this.board.length
        ? 'All stones lit!'
        : `${this.sums ? 'Make' : 'Find'} ${this.next}   ·   ${this.next - 1} / ${this.board.length}`;
    this.marks.clear();
    this.glow.clear();
    this.stones.forEach((stone, i) => {
      const done = this.board[i] < this.next;
      stone.alpha = done ? 0.5 : 1;
      if (done)
        this.marks
          .moveTo(stone.x + 24, stone.y + 27)
          .lineTo(stone.x + 31, stone.y + 34)
          .lineTo(stone.x + 43, stone.y + 18)
          .stroke({ width: 5, color: swatch.green.line, cap: 'round' });
      if (i === this.hinted)
        this.glow
          .roundRect(stone.x - 52, stone.y - 52, 104, 104, 20)
          .stroke({ width: 6, color: swatch.yellow.line });
    });
  }
  resize(view: View) {
    const layout = layoutFor(view.w, view.h, planFor(this.ctx.level).side);
    this.background
      .clear()
      .rect(0, 0, view.w, view.h)
      .fill(swatch.blue.light)
      .ellipse(view.w / 2, layout.top + 270, view.w * 0.45, 300)
      .fill(swatch.teal.light);
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
  destroy() {
    this.finished = true;
  }
}

export const brainBreak: GameModule = {
  id: 'brain-break',
  name: 'Brain Break',
  titleLine: 'game.brain-break',
  region: 'puzzle-peaks',
  challenge: 'noticing',
  skills: ['Visual search', 'Number order', 'Adding and taking away'],
  bands: ['grownup'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.lullaby,
  touchDemo: true,
  upright: true,
  coplayHint:
    'Take turns finding the next stone, or let one person call the number and the other find it. With sums, one person reads a sum aloud and the other says what it makes.',
  offScreen:
    'Shuffle numbered paper squares on a table and point to them in order, at your own pace; later, write sums on the squares and lay them out in order.',
  hubIcon: () => new WigglyIcon(stoneArt('1')),
  sticker: (seed) => {
    const c = stoneArt(String(1 + ((seed >>> 0) % 25)));
    c.addChild(
      new Graphics().circle(34, -34, 12).fill(cream).stroke({ width: 3, color: swatch.yellow.line }),
    );
    return c;
  },
  create: (ctx) => new BrainBreak(ctx),
};
