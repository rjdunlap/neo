import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, ink, swatch, wood, type ColorName } from '../../art/palette';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { RoundButton } from '../../ui/buttons';
import { checkIcon } from '../../ui/icons';
import { label } from '../../ui/text';
import type { Game, GameContext, TouchIntent } from '../types';
import {
  BIT_COUNT,
  bitCheck,
  bitsLayout,
  bitTouch,
  LETTERS,
  makeBitRows,
  planFor,
  type BitBox,
  type BitRow,
  type BitsLayout,
  type PixelPlan,
} from './logic';

/** Seconds between one card and the next while the arrow reads the cards. */
const STEP = 0.24;
const EMPTY = 0xf4f4f8;
const LINE = 0xd8d8e2;

const colorOf = (letter: string): ColorName => LETTERS[letter] ?? 'blue';

/** The arrow button's picture: a card, an arrow, a square. */
function decodeIcon(): Graphics {
  return new Graphics()
    .roundRect(-40, -17, 24, 34, 5)
    .stroke({ width: 5, color: ink })
    .moveTo(-9, 0)
    .lineTo(9, 0)
    .moveTo(3, -8)
    .lineTo(11, 0)
    .lineTo(3, 8)
    .stroke({ width: 5, color: ink, cap: 'round', join: 'round' })
    .roundRect(17, -14, 28, 28, 5)
    .fill(ink);
}

/**
 * Pixel Pictures level 11, ones and zeros: four cards say 1 or 0, the arrow turns them into a row of squares (a 1 fills
 * a square, a 0 leaves it empty, left to right) and the check compares that row with the one to make. Flipping and
 * looking are free; only a check that does not match is a miss. The rules are in `logic.ts`.
 */
export class BitsRound implements Game {
  readonly plan: PixelPlan;
  readonly rows: BitRow[];
  /** What the four cards say, left to right. */
  bits: boolean[] = Array(BIT_COUNT).fill(false);
  /** How many squares of her strip the arrow has shown; `BIT_COUNT` once the strip says what the cards say. */
  shown = 0;
  index = -1;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  /** The card glowing as help, until she flips it. */
  glowing: number | null = null;
  readonly cards: Container[] = [];
  readonly arrow: RoundButton;
  readonly check: RoundButton;

  private readonly strips = new Graphics();
  private readonly aside = new Container();
  private readonly glow = new Graphics();
  private readonly flash = new Graphics();
  private readonly faces: Graphics[] = [];
  private readonly digits: ReturnType<typeof label>[] = [];
  private readonly finishedRows: BitRow[] = [];
  private layout: BitsLayout;
  /** The arrow's (or the check's) reading of the cards, one card a step. */
  private run: { i: number; t: number; check: boolean } | null = null;
  /** Failed checks on this row. */
  private fails = 0;
  private wobble: { card: number; t: number } | null = null;
  private readonly pulse: number[] = Array(BIT_COUNT).fill(0);
  private clock = 0;
  /** Bumped by every flip and check, so a spoken hint does not follow a line she has already moved past. */
  private said = 0;

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.rows = makeBitRows(ctx.rng, this.plan.pictures);
    this.layout = this.layoutFor(ctx.view);
    for (const g of [this.strips, this.aside, this.glow, this.flash]) g.eventMode = 'none';
    ctx.stage.addChild(this.strips, this.aside);
    for (let i = 0; i < BIT_COUNT; i++) {
      const card = new Container();
      const face = new Graphics();
      const digit = label('0', 84, ink);
      card.addChild(face, digit);
      onTap(card, () => this.flip(i), { cooldown: 90 });
      this.cards.push(card);
      this.faces.push(face);
      this.digits.push(digit);
      ctx.stage.addChild(card);
    }
    this.arrow = new RoundButton(decodeIcon(), swatch.yellow, 60, () => this.read(false));
    this.check = new RoundButton(checkIcon(), swatch.green, 60, () => this.read(true));
    ctx.stage.addChild(this.arrow, this.check, this.glow, this.flash);
  }

  get target(): boolean[] {
    return this.rows[Math.min(Math.max(this.index, 0), this.rows.length - 1)].bits;
  }

  private get color() {
    return this.rows[Math.min(Math.max(this.index, 0), this.rows.length - 1)].color;
  }

  /** Whether her strip shows what the cards say now. */
  get decoded() {
    return !this.run && this.shown === BIT_COUNT;
  }

  start() {
    this.next();
  }

  private layoutFor(v: View): BitsLayout {
    return bitsLayout(this.ctx.level, v) ?? bitsLayout(this.ctx.level, { w: 1024, h: 768 })!;
  }

  resize(v: View) {
    this.layout = this.layoutFor(v);
    const l = this.layout;
    this.cards.forEach((card, i) => {
      const b = l.cards[i];
      card.position.set(b.x, b.y);
      card.hitArea = new Rectangle(-b.w / 2, -b.h / 2, b.w, b.h);
    });
    this.arrow.position.set(l.arrow.x, l.arrow.y);
    this.check.position.set(l.check.x, l.check.y);
    this.buildAside();
    this.draw();
  }

  update(dt: number) {
    this.clock += dt;
    if (this.run) {
      this.run.t += dt;
      while (this.run && this.run.t >= STEP) {
        this.run.t -= STEP;
        const i = this.run.i++;
        this.shown = i + 1;
        this.pulse[i] = 1;
        sfx.pop(this.bits[i] ? 6 : 1);
        this.draw();
        if (this.run.i >= BIT_COUNT) {
          const judge = this.run.check;
          this.run = null;
          if (judge) this.judge();
        }
      }
    }
    this.cards.forEach((card, i) => {
      this.pulse[i] = Math.max(0, this.pulse[i] - dt * 4);
      card.scale.set(1 + 0.08 * this.pulse[i]);
      card.rotation = 0;
    });
    const f = this.flash.clear();
    if (this.wobble) {
      const w = this.wobble;
      w.t += dt;
      if (w.t > 0.7) this.wobble = null;
      else {
        // The first card that differs and its square in the row to make wobble once.
        this.cards[w.card].rotation = Math.sin(w.t * 26) * 0.1 * (1 - w.t / 0.7);
        const s = this.squareAt(this.layout.ref, w.card);
        f.roundRect(s.x - s.w / 2, s.y - s.h / 2, s.w, s.h, 14).stroke({
          width: 8,
          color: swatch.orange.line,
          alpha: 1 - w.t / 0.7,
        });
      }
    }
    const g = this.glow.clear();
    if (this.glowing !== null && !this.busy) {
      const b = this.layout.cards[this.glowing];
      g.roundRect(b.x - b.w / 2 - 6, b.y - b.h / 2 - 6, b.w + 12, b.h + 12, 24).stroke({
        width: 8 + 2 * Math.sin(this.clock * 6),
        color: swatch.yellow.fill,
      });
    }
  }

  /** The ghost finger: the cards the row needs, left to right, then the arrow, then the check. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.run) return null;
    const move = bitTouch(this.bits, this.target, this.decoded);
    if (move === 'arrow') return { tap: { on: this.arrow } };
    if (move === 'check') return { tap: { on: this.check } };
    return { tap: { on: this.cards[move.card] }, pause: 0.3 };
  }

  destroy() {}

  private next() {
    this.index++;
    if (this.index >= this.rows.length) return void this.finale();
    this.bits = Array(BIT_COUNT).fill(false);
    this.shown = 0;
    this.run = null;
    this.fails = 0;
    this.glowing = null;
    this.buildAside();
    this.draw();
    this.busy = false;
    if (this.index === 0) void this.ctx.instruct('pixel.bits.row');
  }

  /** A tap on a card: it flips, and her strip clears, so the screen never shows a row the cards no longer say. */
  private flip(i: number) {
    if (this.busy || this.finished) return;
    this.said++;
    this.setCard(i, !this.bits[i]);
  }

  private setCard(i: number, value: boolean) {
    this.bits[i] = value;
    this.run = null;
    this.shown = 0;
    if (this.glowing === i) this.glowing = null;
    this.pulse[i] = 1;
    sfx.pop(value ? 6 : 1);
    this.draw();
  }

  /** The arrow, and the check before it compares: read the cards left to right into her strip. */
  private read(check: boolean) {
    if (this.busy || this.finished) return;
    this.said++;
    this.shown = 0;
    this.run = { i: 0, t: STEP, check };
    this.draw();
  }

  /** The check, once her strip shows the cards' row. */
  private judge() {
    const result = bitCheck(this.bits, this.target, this.fails, this.glowing);
    if (result.ok) return void this.rowDone();
    this.misses++;
    this.fails++;
    sfx.boing();
    this.wobble = { card: result.card, t: 0 };
    const token = ++this.said;
    const differ = result.wants ? 'pixel.bits.differ.fill' : 'pixel.bits.differ.empty';
    if (result.hint === 'set') {
      // The glowing card was left alone: flip it for her. The check is still hers to press.
      this.hints++;
      this.setCard(result.card, result.wants);
      void this.ctx.say('pixel.bits.set');
      return;
    }
    if (result.hint === 'glow') {
      this.hints++;
      this.glowing = result.card;
    }
    void this.ctx.say(differ).then(() => {
      if (result.hint === 'glow' && token === this.said && !this.finished)
        void this.ctx.say('pixel.bits.hint');
    });
  }

  /** A right row slides up to the shelf, and the next row waits with the cards back at 0000. */
  private async rowDone() {
    this.busy = true;
    this.glowing = null;
    this.said++;
    const row = this.rows[this.index];
    sfx.bell(3 + this.index * 2, 0.25);
    this.ctx.pet.cheer();
    const from = this.layout.own;
    this.ctx.particles.burst(from.x, from.y, {
      kind: 'star',
      colors: [0xffffff, 0xfff3a0, swatch[colorOf(row.color)].light],
      count: 14,
      speed: [120, 300],
      gravity: 0,
      life: [0.5, 0.9],
    });
    const fly = this.miniStrip(row, this.layout.pitch, this.layout.cell);
    fly.position.set(from.x, from.y);
    fly.eventMode = 'none';
    this.ctx.stage.addChild(fly);
    this.shown = 0;
    this.draw();
    const slot = this.shelfSlot(this.finishedRows.length);
    const k = SHELF_PITCH / this.layout.pitch;
    void this.ctx.say('pixel.bits.rowdone');
    await Promise.all([
      this.ctx.tw.to(fly, { x: slot.x, y: slot.y }, { duration: 0.45 }),
      this.ctx.tw.to(fly.scale, { x: k, y: k }, { duration: 0.45 }),
    ]);
    fly.destroy();
    this.finishedRows.push(row);
    this.next();
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    this.buildAside();
    this.draw();
    sfx.tada();
    await this.ctx.say('pixel.bits.done');
    await this.ctx.tw.wait(0.5);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  /** Square `i` of a strip: straight above card `i`. */
  private squareAt(strip: BitBox, i: number): BitBox {
    const l = this.layout;
    return { x: l.cards[i].x, y: strip.y, w: l.cell, h: l.cell };
  }

  /** Where the `n`th finished row sits on the shelf: the center of its little strip. */
  private shelfSlot(n: number) {
    const s = this.layout.shelf;
    return { x: s.x - 38, y: s.y + (n - 1) * (SHELF_CELL + 14) };
  }

  /** Four squares in a row, centered on the origin. */
  private miniStrip(row: BitRow, pitch: number, cell: number): Graphics {
    const g = new Graphics();
    const sw = swatch[colorOf(row.color)];
    row.bits.forEach((b, i) => {
      const x = (i - (BIT_COUNT - 1) / 2) * pitch;
      g.roundRect(x - cell / 2, -cell / 2, cell, cell, cell * 0.13)
        .fill(b ? sw.fill : EMPTY)
        .stroke({ width: Math.max(2, cell * 0.03), color: b ? sw.line : LINE });
    });
    return g;
  }

  /** The key card (1 is a filled square, 0 an empty one) and the shelf of finished rows with their ones and zeros. */
  private buildAside() {
    this.aside.removeChildren().forEach((c) => c.destroy({ children: true }));
    const { key, shelf } = this.layout;
    const sw = swatch[colorOf(this.color)];
    const panel = (b: BitBox) =>
      new Graphics()
        .roundRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, 20)
        .fill(0xffffff)
        .stroke({ width: 5, color: wood.line });
    const k = panel(key);
    this.aside.addChild(k);
    [true, false].forEach((one, n) => {
      const y = key.y + (n ? 1 : -1) * Math.min(42, key.h / 4);
      const size = Math.min(60, key.h / 2 - 24);
      // A little card, an arrow, the square it makes.
      k.roundRect(key.x - 96, y - size / 2, size * 0.8, size, 8)
        .fill(one ? sw.light : EMPTY)
        .stroke({ width: 3, color: one ? sw.line : LINE });
      k.moveTo(key.x - 22, y)
        .lineTo(key.x + 22, y)
        .moveTo(key.x + 12, y - 10)
        .lineTo(key.x + 22, y)
        .lineTo(key.x + 12, y + 10)
        .stroke({ width: 5, color: ink, cap: 'round', join: 'round' });
      k.roundRect(key.x + 96 - size, y - size / 2, size, size, 8)
        .fill(one ? sw.fill : EMPTY)
        .stroke({ width: 3, color: one ? sw.line : LINE });
      const digit = label(one ? '1' : '0', size * 0.7, ink);
      digit.position.set(key.x - 96 + size * 0.4, y);
      this.aside.addChild(digit);
    });
    this.aside.addChild(panel(shelf));
    this.finishedRows.forEach((row, n) => {
      const slot = this.shelfSlot(n);
      const strip = this.miniStrip(row, SHELF_PITCH, SHELF_CELL);
      strip.position.set(slot.x, slot.y);
      const digits = label(row.bits.map((b) => (b ? '1' : '0')).join(''), 28, ink);
      digits.position.set(shelf.x + 86, slot.y);
      this.aside.addChild(strip, digits);
    });
  }

  private draw() {
    const l = this.layout;
    const g = this.strips.clear();
    const sw = swatch[colorOf(this.color)];
    const half = (BIT_COUNT * l.pitch - (l.pitch - l.cell)) / 2 + 12;
    for (const strip of [l.ref, l.own])
      g.roundRect(strip.x - half, strip.y - l.cell / 2 - 12, half * 2, l.cell + 24, 20)
        .fill(cream)
        .stroke({ width: 6, color: wood.line });
    for (let i = 0; i < BIT_COUNT; i++) {
      const r = this.squareAt(l.ref, i);
      const want = !this.finished && this.target[i];
      g.roundRect(r.x - r.w / 2 + 4, r.y - r.h / 2 + 4, r.w - 8, r.h - 8, 12)
        .fill(want ? sw.fill : EMPTY)
        .stroke({ width: 2, color: want ? sw.line : LINE });
      const o = this.squareAt(l.own, i);
      const seen = i < this.shown;
      const on = seen && this.bits[i];
      g.roundRect(o.x - o.w / 2 + 4, o.y - o.h / 2 + 4, o.w - 8, o.h - 8, 12)
        .fill(on ? sw.fill : 0xffffff)
        .stroke({ width: 2, color: on ? sw.line : LINE });
      // A zero does something too: its square gets a hollow outline.
      if (seen && !on)
        g.roundRect(o.x - o.w / 2 + 16, o.y - o.h / 2 + 16, o.w - 32, o.h - 32, 8).stroke({
          width: 5,
          color: 0xb9bcc8,
        });
    }
    this.cards.forEach((_, i) => {
      const b = l.cards[i];
      const one = this.bits[i];
      const face = this.faces[i].clear();
      // A 1 is tinted and raised, a 0 pale and flat, so the state never rests on the digit alone.
      if (one)
        face
          .roundRect(-b.w / 2, -b.h / 2 + 8, b.w, b.h - 8, 18)
          .fill(sw.line)
          .roundRect(-b.w / 2, -b.h / 2, b.w, b.h - 10, 18)
          .fill(sw.light)
          .stroke({ width: 5, color: sw.line });
      else
        face
          .roundRect(-b.w / 2, -b.h / 2 + 6, b.w, b.h - 6, 18)
          .fill(EMPTY)
          .stroke({ width: 4, color: 0xb9bcc8 });
      this.digits[i].text = one ? '1' : '0';
      this.digits[i].y = one ? -4 : 4;
    });
  }
}

const SHELF_CELL = 34;
const SHELF_PITCH = 40;
