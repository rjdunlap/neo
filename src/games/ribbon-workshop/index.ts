import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, ink, RAINBOW, swatch, wood, type ColorName } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { RoundButton } from '../../ui/buttons';
import { arrowIcon } from '../../ui/icons';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  AMOUNTS, CAPACITY, compositionKey, GiftTally, HALF, hintAction, judge, planFor, roundFor, total, trayLayout, UNIT, Workbench, WRITTEN,
  type GiftCase, type Hint, type Piece,
} from './logic';

/** Where the whole lines up: the spool and the bench both start here, so a whole on one is a whole on the other. */
const X0 = 110;
const SPOOL_Y = 205;
const BENCH_Y = 370;
const RIBBON_H = 64;

function ribbon(len: number, color: ColorName, h = RIBBON_H): Graphics {
  const s = swatch[color], g = new Graphics();
  g.roundRect(-len / 2, -h / 2, len, h, 10).fill(s.fill).stroke({ width: 4, color: s.line });
  g.rect(-len / 2 + 8, -h / 2 + 9, len - 16, h * 0.18).fill({ color: 0xffffff, alpha: 0.35 });
  return g;
}

function giftBox(color: ColorName, bow: boolean): Container {
  const c = new Container(), s = swatch[color], g = new Graphics();
  g.roundRect(-42, -36, 84, 72, 8).fill(s.light).stroke({ width: 4, color: s.line });
  g.rect(-42, -36, 84, 14).fill(s.fill);
  if (bow) {
    g.rect(-7, -36, 14, 72).fill(s.fill);
    g.ellipse(-20, -44, 18, 11).fill(s.fill).stroke({ width: 3, color: s.line });
    g.ellipse(20, -44, 18, 11).fill(s.fill).stroke({ width: 3, color: s.line });
    g.circle(0, -42, 8).fill(s.line);
  }
  c.addChild(g);
  return c;
}

function bowIcon(): Graphics {
  const g = new Graphics();
  g.ellipse(-17, 0, 17, 11).fill(0xffffff).ellipse(17, 0, 17, 11).fill(0xffffff).circle(0, 0, 8).fill(0xffffff);
  g.moveTo(-4, 6).lineTo(-14, 26).stroke({ width: 6, color: 0xffffff }).moveTo(4, 6).lineTo(14, 26).stroke({ width: 6, color: 0xffffff });
  return g;
}

function scissorsIcon(): Graphics {
  const g = new Graphics();
  g.circle(-14, 18, 10).stroke({ width: 6, color: ink }).circle(14, 18, 10).stroke({ width: 6, color: ink });
  g.moveTo(-8, 10).lineTo(14, -26).stroke({ width: 6, color: ink }).moveTo(8, 10).lineTo(-14, -26).stroke({ width: 6, color: ink });
  return g;
}

/** A short dashed line, for the target outline. */
function dashed(g: Graphics, x1: number, y1: number, x2: number, y2: number, color: number) {
  const len = Math.hypot(x2 - x1, y2 - y1), n = Math.max(1, Math.floor(len / 22));
  for (let i = 0; i < n; i += 2) {
    const a = i / n, b = Math.min(1, (i + 1) / n);
    g.moveTo(x1 + (x2 - x1) * a, y1 + (y2 - y1) * a).lineTo(x1 + (x2 - x1) * b, y1 + (y2 - y1) * b);
  }
  g.stroke({ width: 4, color });
}

class RibbonWorkshop implements Game {
  private view: View;
  readonly plan;
  readonly gifts: GiftCase[];
  gift = 0;
  bench!: Workbench;
  readonly tally = new GiftTally();
  misses = 0;
  hints = 0;
  /** The round is over. */
  done = false;
  /** A finished gift is tying its bow; touches wait. */
  busy = false;
  /** The scissors are on: the next tap on a tray half snips it, anything else turns them off. */
  snipping = false;
  private clock = 0;
  private readonly colors = new Map<number, ColorName>();
  private readonly colorRng: Rng;
  private giftColor: ColorName = 'red';
  private readonly catcher = new Graphics();
  private readonly decor = new Graphics();
  private readonly flash = new Graphics();
  private readonly glow = new Graphics();
  readonly tag = new Container();
  private readonly giftLayer = new Container();
  private readonly benchLayer = new Container();
  private readonly trayLayer = new Container();
  /** The pieces' drawings, by id, rebuilt after every action. */
  readonly trayCards = new Map<number, Container>();
  readonly benchPieces = new Map<number, Container>();
  readonly bow: RoundButton;
  readonly scissors: RoundButton;
  readonly undo: RoundButton;
  private readonly cancel = () => this.snipOff();

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    const gifts = roundFor(ctx.level, ctx.rng);
    // The how-to card's demonstration plays one gift: the snip gift where there is one.
    this.gifts = ctx.demo ? gifts.slice(-1) : gifts;
    this.colorRng = new Rng(ctx.rng.int(0, 2 ** 30));
    this.catcher.eventMode = 'static';
    this.catcher.on('pointerdown', () => this.snipOff());
    this.flash.eventMode = 'none';
    this.glow.eventMode = 'none';
    this.decor.eventMode = 'none';
    this.giftLayer.eventMode = 'none';
    onTap(this.tag, () => { if (this.snipOff()) return; this.ask(); }, { cooldown: 600 });
    this.bow = new RoundButton(bowIcon(), swatch.green, 60, () => this.check());
    this.scissors = new RoundButton(scissorsIcon(), swatch.yellow, 60, () => this.toggleSnip());
    this.undo = new RoundButton(arrowIcon(-1), swatch.white, 60, () => {
      if (this.snipOff() || this.busy || this.done) return;
      if (this.bench.undo()) { sfx.tick(); this.draw(); }
    });
    this.scissors.visible = this.plan.snip;
    ctx.stage.addChild(this.catcher, this.decor, this.giftLayer, this.tag, this.flash, this.benchLayer, this.trayLayer, this.glow, this.bow, this.scissors, this.undo);
    window.addEventListener('pointercancel', this.cancel, true);
    window.addEventListener('blur', this.cancel);
    this.setGift(0);
  }

  get state() { return this.bench.state; }
  get target() { return this.bench.gift.target; }

  private setGift(i: number) {
    this.gift = i;
    this.bench = new Workbench(this.gifts[i]);
    this.tally.nextGift();
    this.snipping = false;
    this.giftColor = RAINBOW[this.colorRng.int(0, RAINBOW.length - 1)];
    for (const p of this.state.tray) this.colors.set(p.id + i * 100, RAINBOW[this.colorRng.int(0, RAINBOW.length - 1)]);
    this.layout();
  }

  /** A piece's ribbon colour: decoration only. A snipped half's quarters keep its colour. */
  private colorOf(p: Piece): ColorName {
    const key = p.id + this.gift * 100;
    if (!this.colors.has(key)) this.colors.set(key, this.lastSnipColor ?? 'pink');
    return this.colors.get(key)!;
  }
  private lastSnipColor: ColorName | null = null;

  private ask() { void this.ctx.instruct(`ribbon.ask.${AMOUNTS[this.target]}`); }

  /** Turn the scissors off; true when they were on, so the touch that did it does nothing else. */
  private snipOff(): boolean {
    if (!this.snipping) return false;
    this.snipping = false;
    this.draw();
    return true;
  }

  private toggleSnip() {
    if (this.busy || this.done) return;
    if (this.snipOff()) return;
    if (!this.state.tray.some(p => p.size === HALF)) { void this.ctx.say('ribbon.snip.none'); return; }
    this.snipping = true;
    void this.ctx.say('ribbon.snip.on');
    this.draw();
  }

  private tapTray(p: Piece) {
    if (this.busy || this.done) return;
    if (this.snipping) {
      this.snipping = false;
      if (p.size !== HALF) { void this.ctx.say('ribbon.snip.quarter'); this.draw(); return; }
      this.lastSnipColor = this.colorOf(p);
      this.bench.act({ kind: 'snip', id: p.id });
      for (const q of this.state.tray) this.colorOf(q);
      this.lastSnipColor = null;
      sfx.snip();
      void this.ctx.say('ribbon.snip.done');
      this.draw();
      return;
    }
    if (!this.bench.act({ kind: 'place', id: p.id })) {
      sfx.boing();
      void this.ctx.say('ribbon.full');
      const card = this.trayCards.get(p.id);
      if (card) void this.ctx.tw.to(card, { rotation: 0.08 }, { duration: 0.06 }).then(() => this.ctx.tw.to(card, { rotation: -0.08 }, { duration: 0.1 })).then(() => this.ctx.tw.to(card, { rotation: 0 }, { duration: 0.06 }));
      return;
    }
    sfx.pop(total(this.state.bench) + 2);
    void this.ctx.say(p.size === HALF ? 'ribbon.piece.half' : 'ribbon.piece.quarter');
    this.draw(p.id);
  }

  private tapBench(p: Piece) {
    if (this.snipOff() || this.busy || this.done) return;
    this.bench.act({ kind: 'return', id: p.id });
    sfx.tick();
    this.draw(p.id);
  }

  private check() {
    if (this.snipOff() || this.busy || this.done) return;
    const glowing = this.tally.glow;
    const v = this.tally.check(judge(this.state, this.target));
    this.misses = this.tallyMisses + this.tally.misses;
    this.hints = this.tallyHints + this.tally.hints;
    if (v === 'empty') { void this.ctx.say('ribbon.empty'); return; }
    if (v === 'right') { this.succeed(); return; }
    sfx.boing();
    this.flashMiss(v);
    // The glow that comes with the second miss says its own line; one line at a time.
    void this.ctx.say(this.tally.glow && !glowing ? 'ribbon.hint' : v === 'short' ? 'ribbon.short' : 'ribbon.long');
    this.draw();
  }
  /** Totals from finished gifts; the tally holds the gift in play. */
  private tallyMisses = 0;
  private tallyHints = 0;

  askForHint() {
    if (this.busy || this.done) return;
    if (this.tally.ask()) { this.hints = this.tallyHints + this.tally.hints; void this.ctx.say('ribbon.hint'); }
    this.draw();
  }
  readonly hintLabel = 'Show a hint';

  restart() {
    if (this.busy || this.done) return;
    this.snipping = false;
    this.bench.restart();
    this.draw();
  }

  private flashMiss(v: 'short' | 'long') {
    const end = X0 + total(this.state.bench) * UNIT, goal = X0 + this.target * UNIT;
    const [a, b] = v === 'short' ? [end, goal] : [goal, end];
    this.ctx.tw.kill(this.flash);
    this.flash.clear().roundRect(a, BENCH_Y - 46, b - a, 92, 12).fill({ color: v === 'short' ? swatch.yellow.fill : swatch.red.fill, alpha: 0.55 });
    this.flash.alpha = 1;
    void this.ctx.tw.to(this.flash, { alpha: 0 }, { duration: 1.6 });
  }

  private succeed() {
    this.busy = true;
    this.snipping = false;
    const key = compositionKey(this.state.bench), len = total(this.state.bench) * UNIT;
    this.draw();
    // The pieces join into one ribbon and tie round the gift.
    const fused = ribbon(len, this.giftColor);
    fused.position.set(X0 + len / 2, BENCH_Y);
    fused.alpha = 0;
    this.benchLayer.addChild(fused);
    void this.ctx.tw.to(fused, { alpha: 1 }, { duration: 0.35 });
    this.drawGift(true);
    this.ctx.particles.burst(X0 + len, BENCH_Y - 100, { colors: [swatch[this.giftColor].fill, swatch.yellow.fill], count: 18 });
    [0, 2, 4, 5, 7].forEach((step, i) => void this.ctx.tw.wait(i * 0.12).then(() => sfx.bell(step, 0.25)));
    this.tallyMisses += this.tally.misses;
    this.tallyHints += this.tally.hints;
    this.tally.misses = this.tally.hints = 0;
    void this.ctx.say(`ribbon.made.${key}` as 'ribbon.made.hh').then(() => this.ctx.tw.wait(0.4)).then(() => {
      if (this.gift + 1 < this.gifts.length) {
        return this.ctx.say('ribbon.next').then(() => {
          this.busy = false;
          this.setGift(this.gift + 1);
          this.ask();
        });
      }
      this.done = true;
      this.ctx.finish({ misses: this.misses, hints: this.hints });
    });
  }

  /** The hint glow's target for an action (or the bow). */
  private targetOf(h: Hint): Container | null {
    // With the scissors on, anything but a snip starts by turning them off.
    if (this.snipping && h.kind !== 'snip') return this.scissors;
    if (h.kind === 'check') return this.bow;
    if (h.kind === 'return') return this.benchPieces.get(h.id) ?? null;
    if (h.kind === 'snip') return this.snipping ? this.trayCards.get(h.id) ?? null : this.scissors;
    return this.trayCards.get(h.id) ?? null;
  }

  private drawGlow() {
    this.glow.clear();
    if (!this.tally.glow || this.busy || this.done) return;
    const h = hintAction(this.state, this.target, this.plan.snip);
    const t = h && this.targetOf(h);
    if (!t) return;
    const b = t.getLocalBounds();
    if (t instanceof RoundButton) this.glow.circle(t.x, t.y, t.radius + 12);
    else this.glow.roundRect(t.x + b.x - 10, t.y + b.y - 10, b.width + 20, b.height + 20, 20);
    this.glow.stroke({ width: 8, color: swatch.yellow.line });
  }

  private drawGift(tied: boolean) {
    for (const c of this.giftLayer.removeChildren()) { this.ctx.tw.kill(c.scale); c.destroy({ children: true }); }
    const box = giftBox(this.giftColor, tied);
    box.position.set(X0 + this.target * UNIT, BENCH_Y - 82);
    this.giftLayer.addChild(box);
    if (tied) { box.scale.set(0.7); void this.ctx.tw.to(box.scale, { x: 1.1, y: 1.1 }, { duration: 0.2 }).then(() => this.ctx.tw.to(box.scale, { x: 1, y: 1 }, { duration: 0.2 })); }
  }

  private drawTag() {
    for (const c of this.tag.removeChildren()) c.destroy({ children: true });
    const g = new Graphics();
    g.roundRect(-150, -52, 300, 104, 18).fill(cream).stroke({ width: 5, color: swatch.brown.line });
    g.circle(-132, 0, 7).fill(swatch.brown.line);
    // A mini spool: the whole, with the asked-for part in the gift's colour.
    g.roundRect(-110, -14, 160, 28, 6).fill(swatch.white.light).stroke({ width: 3, color: swatch.white.line });
    g.roundRect(-110, -14, (160 * this.target) / 4, 28, 6).fill(swatch[this.giftColor].fill).stroke({ width: 3, color: swatch[this.giftColor].line });
    this.tag.addChild(g);
    const t = label(WRITTEN[this.target], 54);
    t.anchor?.set(0.5);
    t.position.set(105, 0);
    this.tag.addChild(t);
    this.tag.hitArea = new Rectangle(-150, -52, 300, 104);
  }

  /** Rebuild the tray and bench from the state; `moved` pops as it lands. */
  private draw(moved?: number) {
    const v = this.view, s = this.state;
    for (const c of [...this.trayLayer.removeChildren(), ...this.benchLayer.removeChildren()]) { this.ctx.tw.kill(c); this.ctx.tw.kill(c.scale); c.destroy({ children: true }); }
    this.trayCards.clear();
    this.benchPieces.clear();
    for (const spot of trayLayout(s.tray)) {
      const p = s.tray.find(q => q.id === spot.id)!, len = p.size * UNIT, card = new Container();
      const wiggle = this.snipping && p.size === HALF;
      card.addChild(new Graphics().roundRect(-len / 2, -55, len, 110, 16).fill(wiggle ? swatch.yellow.light : cream).stroke({ width: 4, color: wiggle ? swatch.yellow.line : swatch.brown.line }));
      const bar = ribbon(len - 20, this.colorOf(p), 38);
      bar.y = 22;
      card.addChild(bar);
      const t = label(p.size === HALF ? '½' : '¼', 34);
      t.anchor?.set(0.5);
      t.y = -22;
      card.addChild(t);
      card.position.set(spot.x, v.h - 90 - spot.row * 125);
      onTap(card, () => this.tapTray(p), { cooldown: 250 });
      card.hitArea = new Rectangle(-len / 2, -55, len, 110);
      this.trayLayer.addChild(card);
      this.trayCards.set(p.id, card);
      if (p.id === moved) { card.scale.set(0.8); void this.ctx.tw.to(card.scale, { x: 1, y: 1 }, { duration: 0.18 }); }
    }
    let at = 0;
    for (const p of s.bench) {
      const len = p.size * UNIT, piece = new Container();
      piece.addChild(ribbon(len - 4, this.colorOf(p)));
      piece.position.set(X0 + (at + p.size / 2) * UNIT, BENCH_Y);
      at += p.size;
      onTap(piece, () => this.tapBench(p), { cooldown: 250 });
      piece.hitArea = new Rectangle(-len / 2, -60, len, 120);
      this.benchLayer.addChild(piece);
      this.benchPieces.set(p.id, piece);
      if (p.id === moved) { piece.scale.set(1, 1.25); void this.ctx.tw.to(piece.scale, { x: 1, y: 1 }, { duration: 0.18 }); }
    }
    this.scissors.alpha = this.snipping ? 1 : 0.92;
    this.undo.alpha = this.bench.canUndo ? 1 : 0.5;
    this.drawGlow();
  }

  private layout() {
    const v = this.view;
    this.catcher.clear().rect(0, 0, v.w, v.h).fill(swatch.pink.light);
    const g = this.decor.clear();
    // The spool: one whole, the same length as a whole on the bench.
    g.roundRect(X0, SPOOL_Y - 17, 4 * UNIT, 34, 8).fill(swatch.purple.light).stroke({ width: 4, color: swatch.purple.line });
    for (let i = 1; i < 16; i++) g.moveTo(X0 + i * 35, SPOOL_Y - 15).lineTo(X0 + i * 35 - 10, SPOOL_Y + 15);
    g.stroke({ width: 3, color: swatch.purple.fill });
    for (const x of [X0, X0 + 4 * UNIT]) g.roundRect(x - 7, SPOOL_Y - 30, 14, 60, 6).fill(wood.fill).stroke({ width: 3, color: wood.line });
    // The bench: a plank as long as it holds, and the dashed outline of the gift's length.
    g.roundRect(X0 - 14, BENCH_Y + 44, CAPACITY * UNIT + 28, 22, 8).fill(wood.fill).stroke({ width: 4, color: wood.line });
    const end = X0 + this.target * UNIT;
    dashed(g, X0, BENCH_Y - 36, end, BENCH_Y - 36, swatch.brown.line);
    dashed(g, X0, BENCH_Y + 36, end, BENCH_Y + 36, swatch.brown.line);
    dashed(g, X0, BENCH_Y - 36, X0, BENCH_Y + 36, swatch.brown.line);
    g.moveTo(end, BENCH_Y - 46).lineTo(end, BENCH_Y + 46).stroke({ width: 6, color: swatch.brown.line });
    if (!this.spoolLabel) { this.spoolLabel = label('1 whole', 30); this.spoolLabel.anchor?.set(0.5); this.ctx.stage.addChildAt(this.spoolLabel, 2); }
    // Above the spool's middle, clear of the gift that sits at a whole's end.
    this.spoolLabel.position.set(X0 + 2 * UNIT, SPOOL_Y - 44);
    this.tag.position.set(Math.max(300, v.w / 2 - 120), 82);
    this.undo.position.set(v.w - 80, 82);
    this.scissors.position.set(v.w - 80, v.h - 215);
    this.bow.position.set(v.w - 80, v.h - 90);
    this.drawTag();
    // A resize while the bow ties keeps the joined ribbon and the tied gift.
    if (this.busy) return;
    this.drawGift(false);
    this.draw();
  }
  private spoolLabel: ReturnType<typeof label> | null = null;

  start() { this.ask(); }

  resize(v: View) {
    this.view = v;
    this.layout();
  }

  update(dt: number) {
    this.clock += dt;
    this.glow.alpha = 0.65 + 0.35 * Math.sin(this.clock * 3);
    if (this.snipping) for (const [id, card] of this.trayCards) if (this.state.tray.find(p => p.id === id)?.size === HALF) card.rotation = Math.sin(this.clock * 14) * 0.03;
  }

  /** The ghost finger: follow the hint path, pressing the scissors before a snip, and the bow when the ribbon is right. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.done) return null;
    const h = hintAction(this.state, this.target, this.plan.snip);
    const t = h && this.targetOf(h);
    return t ? { tap: { on: t } } : null;
  }

  destroy() {
    window.removeEventListener('pointercancel', this.cancel, true);
    window.removeEventListener('blur', this.cancel);
  }
}

export const ribbonWorkshop: GameModule = {
  id: 'ribbon-workshop',
  name: 'Ribbon Workshop',
  titleLine: 'game.ribbon-workshop',
  region: 'counting-cove',
  skills: ['fractions', 'equivalent-fractions', 'measurement'],
  bands: ['school'],
  levels: () => ({ min: 1, max: 3 }),
  describeLevel: (l) => {
    const p = planFor(l);
    return l === 1 ? `${p.name}: a whole from halves and quarters` : l === 2 ? `${p.name}: a half, then a quarter that needs the scissors` : `${p.name}: ¾ as ½ + ¼, then from two halves with a snip`;
  },
  music: STYLES.paint,
  touchDemo: true,
  coplayHint: 'Ask {name} for a length, like "make me three quarters", and watch which pieces make it.',
  offScreen: 'Fold a paper strip in half and in half again, cut the pieces, and lay them against a whole strip.',
  hubIcon: () => {
    const c = new Container(), g = new Graphics();
    g.circle(0, -70, 46).fill(swatch.pink.fill).stroke({ width: 5, color: swatch.pink.line });
    g.circle(0, -70, 16).fill(wood.fill).stroke({ width: 4, color: wood.line });
    g.moveTo(40, -50).quadraticCurveTo(70, -20, 52, 0).stroke({ width: 14, color: swatch.pink.fill });
    c.addChild(g);
    return new WigglyIcon(c);
  },
  sticker: (seed) => {
    const c = new Container(), box = giftBox(RAINBOW[new Rng(seed).int(0, RAINBOW.length - 1)], true);
    box.scale.set(1.4);
    c.addChild(box);
    return c;
  },
  create: (ctx) => new RibbonWorkshop(ctx),
};
