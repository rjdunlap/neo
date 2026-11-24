import { Container, Graphics, Rectangle } from 'pixi.js';
import { ink, swatch } from '../../art/palette';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { RoundButton } from '../../ui/buttons';
import { undoIcon } from '../../ui/icons';
import { hinted } from '../../progress/coach';
import type { GameContext, TouchIntent } from '../types';
import { COIN_R } from './logic';
import { isFewestTrade, nextTrade, trade, tradeSlot, tradeTo, TRADE_CELL } from './trade-logic';

interface TradeCoin {
  node: Container;
  art: Container;
  ring: Graphics;
}

function tradeIcon() {
  return new Graphics()
    .circle(-24, -10, 9)
    .circle(-24, 12, 9)
    .circle(21, 1, 16)
    .fill(swatch.yellow.fill)
    .stroke({ color: ink, width: 3 })
    .moveTo(-10, 1)
    .lineTo(0, 1)
    .lineTo(-4, -4)
    .moveTo(0, 1)
    .lineTo(-4, 6)
    .stroke({ color: ink, width: 3, cap: 'round' });
}

export class TradeCounter extends Container {
  readonly undo = new RoundButton(undoIcon(), swatch.white, 56, () => this.undoTrade()).named('Undo');
  readonly exchange = new RoundButton(tradeIcon(), swatch.white, 56, () => void this.exchangeCoins()).named(
    'Trade',
  );
  readonly coins: TradeCoin[] = [];
  readonly picked = new Set<number>();
  heap: number[] = [];
  private readonly history: number[][] = [];
  private readonly undoGlow = new Graphics().circle(0, 0, 65).fill(swatch.yellow.fill);
  private readonly tradeGlow = new Graphics().circle(0, 0, 65).fill(swatch.yellow.fill);
  busy = false;
  private earlyBells = 0;

  constructor(
    private readonly ctx: GameContext,
    private readonly makeCoin: (value: number) => Container,
    private readonly tally: { misses: number; hints: number },
  ) {
    super();
    this.undoGlow.eventMode = 'none';
    this.undo.addChildAt(this.undoGlow, 0);
    this.tradeGlow.eventMode = 'none';
    this.exchange.addChildAt(this.tradeGlow, 0);
    this.tradeGlow.visible = false;
  }

  start(amount: number) {
    this.busy = false;
    this.history.length = 0;
    this.earlyBells = 0;
    this.setHeap(Array<number>(amount).fill(1));
    return this.ctx.instruct('shop.trade.ask', { n: amount });
  }

  private setHeap(heap: number[]) {
    this.coins.splice(0).forEach(({ node }) => node.destroy({ children: true }));
    this.heap = heap;
    this.picked.clear();
    this.clearHint();
    for (const [i, value] of heap.entries()) {
      const node = new Container();
      const art = this.makeCoin(value);
      const ring = new Graphics();
      ring.eventMode = 'none';
      node.addChild(art, ring);
      const { x, y } = tradeSlot(i);
      node.position.set(x, y);
      node.hitArea = new Rectangle(-TRADE_CELL / 2, -TRADE_CELL / 2, TRADE_CELL, TRADE_CELL);
      onTap(node, () => this.toggle(i), { cooldown: 80 });
      this.addChild(node);
      this.coins.push({ node, art, ring });
    }
  }

  private toggle(i: number) {
    if (this.busy) return;
    if (!this.picked.delete(i)) this.picked.add(i);
    const { art } = this.coins[i];
    art.y = this.picked.has(i) ? -5 : 0;
    sfx.tick();
    this.drawHints();
  }

  private hintGroup: number[] | null = null;
  private undoHint = false;

  private drawHints() {
    this.coins.forEach(({ ring, art }, i) => {
      ring.clear();
      if (this.hintGroup?.includes(i)) ring.circle(0, 0, 47).stroke({ color: swatch.yellow.fill, width: 6 });
      if (this.picked.has(i))
        ring.circle(0, art.y, COIN_R[this.heap[i]] + 1).stroke({ color: swatch.white.fill, width: 4 });
    });
    this.tradeGlow.visible = tradeTo([...this.picked].map((i) => this.heap[i])) !== null;
    this.undo.alpha = this.undoHint || this.history.length ? 1 : 0.7;
    this.undoGlow.visible = this.undoHint;
  }

  private clearHint() {
    this.hintGroup = null;
    this.undoHint = false;
    this.drawHints();
  }

  private async exchangeCoins() {
    if (this.busy) return;
    const indices = [...this.picked].sort((a, b) => a - b);
    const after = trade(this.heap, indices);
    if (!after) {
      void this.ctx.say('shop.trade.pick');
      return;
    }
    this.busy = true;
    const { x, y } = tradeSlot(indices[0]);
    const values = indices.map((i) => this.heap[i]);
    this.history.push(this.heap);
    await Promise.all(indices.map((i) => this.ctx.tw.to(this.coins[i].node, { x, y }, { duration: 0.24 })));
    this.setHeap(after);
    const value = after[indices[0]];
    sfx.bell(value === 10 ? 9 : value === 5 ? 7 : 5);
    const list = `${values.slice(0, -1).join(', ')} and ${values.at(-1)}`;
    void this.ctx.say('shop.trade.made', { list, v: value });
    this.busy = false;
  }

  private undoTrade() {
    if (this.busy) return;
    const before = this.history.pop();
    if (before) this.setHeap(before);
  }

  async check(amount: number): Promise<boolean> {
    if (this.busy) return false;
    if (isFewestTrade(this.heap)) {
      this.busy = true;
      const size = this.heap.length;
      await Promise.all(
        this.coins.map(({ node }) => this.ctx.tw.to(node, { x: 260, y: -115, alpha: 0 }, { duration: 0.35 })),
      );
      sfx.bell(10);
      await this.ctx.say(size === 1 ? 'shop.trade.one' : 'shop.trade.yes', { n: amount, k: size });
      return true;
    }
    this.earlyBells++;
    if (this.earlyBells === 1) {
      void this.ctx.say('shop.trade.more');
      return false;
    }
    if (this.earlyBells === 2) hinted(this.tally);
    this.hintGroup = nextTrade(this.heap);
    this.undoHint = this.hintGroup === null;
    this.drawHints();
    void this.ctx.say(this.undoHint ? 'shop.trade.stuck' : 'shop.trade.hint');
    return false;
  }

  touch(bell: RoundButton): TouchIntent | null {
    if (this.busy) return null;
    if (isFewestTrade(this.heap)) return { tap: { on: bell } };
    const group = nextTrade(this.heap);
    if (!group) return { tap: { on: this.undo } };
    const stray = [...this.picked].find((i) => !group.includes(i));
    const next = stray ?? group.find((i) => !this.picked.has(i));
    return { tap: { on: next === undefined ? this.exchange : this.coins[next].node } };
  }
}
