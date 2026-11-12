import { Circle, Container, Graphics, Rectangle } from 'pixi.js';
import { cream, RAINBOW, swatch } from '../../art/palette';
import { pail } from '../../art/shore';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { label } from '../../ui/text';
import {
  guideDots,
  guideShown,
  hintDue,
  offTrail,
  showTheWay,
  tuneStep,
  type Guide,
  type Look,
} from '../../learning/tracing/feedback';
import { advanceTrace, sampleStroke, traceWaypoints, type Point } from '../../learning/tracing/strokes';
import { WigglyIcon, tile } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { DIGITS } from './digits';
import { drawThing } from './things';
import {
  CARD_H,
  CARD_W,
  ENTRY_LEVELS,
  LEVELS,
  askLayout,
  cardHintDue,
  cardsFor,
  THING_HIT,
  groupSize,
  guidesFor,
  hintCounts,
  planFor,
  roundFor,
  spotsFor,
  stickerDigit,
  type Arrangement,
  thingWord,
  trailTolerance,
} from './logic';

/** Write how many (level 5) counts and chooses a card before the trace; the other levels start at the trace. */
type Phase = 'count' | 'cards' | 'trace' | 'show' | 'wake' | 'done';

/** A sleeping thing is tinted this pale blue, with a small z, until she wakes it. */
const ASLEEP = 0xc5cdea;

/** The numeral drawn with the same stroke table the game traces, for icons and stickers. */
function numeralArt(digit: number, width: number, color: number): Graphics {
  const g = new Graphics();
  for (const stroke of DIGITS[String(digit)]) {
    stroke.forEach(([x, y], i) =>
      i === 0 ? g.moveTo(x * width, y * width * 1.4) : g.lineTo(x * width, y * width * 1.4),
    );
    g.stroke({ width: width * 0.16, color, cap: 'round', join: 'round' });
  }
  return g;
}

class NumberTrails implements Game {
  readonly n: number;
  private readonly thing: ReturnType<typeof roundFor>['thing'];
  private readonly look: Look;
  private readonly arrangement: Arrangement;
  /** The fifth of the stroke whose note last sounded; the firefly's note climbs as she reaches each new one. */
  private fifth = 0;
  /** The second wander on a stroke asks the firefly to show the way once she lets go. */
  private showPending = false;
  private phase: Phase = 'trace';
  /** Less help each time: the guide each try shows, the try she is on, and the hints counted on it. */
  private readonly guides: readonly Guide[];
  private attempt = 0;
  private tryHints = 0;
  private readonly pips = new Graphics();
  private stroke = 0;
  private progress = 0;
  private points: Point[] = [];
  private previous: Point = [0, 0];
  private readonly background = new Graphics();
  private readonly canvas = new Container();
  private readonly outline = new Graphics();
  private readonly ink = new Graphics();
  private readonly cue = new Graphics();
  private readonly beacon = new Graphics();
  private readonly firefly = new Container();
  private readonly heading = label('', 64, swatch.purple.line);
  private readonly pile = new Container();
  private readonly handle: DragHandle;
  private things: Container[] = [];
  private woken = 0;
  private readonly awake = new Set<Container>();
  private size = 420;
  private view: View;
  private busy = false;
  private misses = 0;
  private hints = 0;
  private wrong = 0;
  private missedDrag = false;
  /** `nt.start` waits behind the right card's count (U7 R4), or is said at her first stroke. */
  private unasked = false;
  private clock = 0;
  private readonly tolerance: number;
  private readonly strokes: readonly (readonly Point[])[];
  /** Write how many: the three numeral cards, the things she has counted, wrong cards this round, and the right card's glow. */
  private readonly asking: boolean;
  private readonly choices: number[] = [];
  private readonly cardRow = new Container();
  private cards: Container[] = [];
  private readonly counted = new Set<Container>();
  private wrongCards = 0;
  private glowing = false;
  /** The pet is counting the group again after a wrong card. */
  private recounting = false;
  private readonly glow = new Graphics();
  private basket: Graphics | null = null;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    const round = roundFor(ctx.level, ctx.rng);
    this.n = round.n;
    this.thing = round.thing;
    this.look = round.look;
    this.arrangement = round.arrangement;
    this.strokes = DIGITS[String(this.n)];
    this.tolerance = trailTolerance(ctx.level);
    this.asking = planFor(ctx.level).writeHowMany === true;
    this.guides = guidesFor(ctx.level);
    ctx.stage.addChild(
      this.background,
      this.canvas,
      this.pile,
      this.cardRow,
      this.glow,
      this.heading,
      this.pips,
    );
    this.glow.eventMode = 'none';
    this.canvas.addChild(this.outline, this.ink, this.cue, this.beacon, this.firefly);
    this.firefly.addChild(
      new Graphics()
        .ellipse(-14, -12, 16, 10)
        .ellipse(14, -12, 16, 10)
        .fill(swatch.teal.light)
        .circle(0, 0, 18)
        .fill(swatch.yellow.fill)
        .stroke({ width: 4, color: swatch.yellow.line })
        .circle(-6, -3, 3)
        .circle(6, -3, 3)
        .fill(swatch.brown.line),
    );
    this.firefly.hitArea = new Circle(0, 0, 56);
    this.handle = draggable(this.firefly, ctx.tw, {
      lift: 0,
      onPick: () => {
        this.askNow();
        this.previous = this.points[this.progress];
        this.missedDrag = false;
        sfx.bell(7, 0.15);
      },
      onMove: (x, y) => this.trace([x / this.size, y / this.size]),
      onDrop: () => {
        this.placeFirefly();
        if (this.showPending) void this.showWay();
        return true;
      },
    });
    this.prepareStroke();
    if (this.asking) this.prepareAsk();
  }

  /** Write how many: the group (or an empty basket for zero) waits to be counted; the numeral stays hidden until she picks it. */
  private prepareAsk() {
    this.choices.push(...cardsFor(this.n, this.ctx.rng));
    this.phase = 'count';
    this.canvas.visible = false;
    this.handle.enabled = false;
    this.heading.text = '?';
    if (this.n === 0) {
      this.basket = new Graphics();
      pail(this.basket, 0, 60, swatch.blue);
      this.pile.addChild(this.basket);
      return;
    }
    this.things = Array.from({ length: this.n }, () => {
      const t = drawThing(this.thing.id);
      t.hitArea = new Circle(0, 0, THING_HIT);
      onTap(t, () => this.countThing(t), { cooldown: 200 });
      this.pile.addChild(t);
      return t;
    });
  }

  /** A counting tap: the next number, said aloud and written small above the thing. Never wrong; a second tap only bounces. */
  private countThing(t: Container) {
    if (this.phase !== 'count' || this.busy) return;
    void this.ctx.tw
      .to(t.scale, { x: 1.15, y: 1.15 }, { duration: 0.15, ease: ease.outBack })
      .then(() => this.ctx.tw.to(t.scale, { x: 1, y: 1 }, { duration: 0.15 }));
    if (this.counted.has(t)) {
      sfx.tick();
      return;
    }
    this.counted.add(t);
    const count = this.counted.size;
    sfx.marimba((count - 1) % 8, 0.4);
    const mark = label(`${count}`, 34, swatch.purple.line);
    mark.position.set(0, -THING_HIT - 6);
    mark.name = 'count';
    t.addChild(mark);
    void this.ctx.say('nt.count', { n: count });
    if (count === this.n) void this.showCards();
  }

  /** Three numeral cards along the bottom: which one tells how many? */
  private async showCards() {
    this.busy = true;
    await this.ctx.tw.wait(0.6);
    this.phase = 'cards';
    this.cards = this.choices.map((d) => {
      const card = new Container();
      card.addChild(tile(CARD_W, CARD_H, 'yellow'));
      const art = numeralArt(d, 80, swatch.purple.fill);
      art.position.set(-40, -56);
      card.addChild(art);
      card.hitArea = new Rectangle(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H);
      card.scale.set(0);
      onTap(card, () => void this.choose(d, card), { cooldown: 250 });
      this.cardRow.addChild(card);
      void this.ctx.tw.to(card.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
      return card;
    });
    this.placeAsk();
    await this.ctx.tw.wait(0.3);
    this.busy = false;
    // Zero's own question (the basket) is already being asked.
    if (this.n > 0) await this.ctx.instruct('nt.which', { things: this.thing.plural });
  }

  private async choose(d: number, card: Container) {
    if (this.phase !== 'cards') return;
    // During the pet's recount the right card still works (it cuts the recount short); another card only ticks.
    if (this.recounting) {
      if (d !== this.n) {
        sfx.tick();
        return;
      }
      this.recounting = false;
    } else if (this.busy) return;
    this.busy = true;
    if (d === this.n) {
      this.glowing = false;
      this.glow.clear();
      sfx.sparkle();
      this.cards.forEach((c) => {
        if (c !== card) void this.ctx.tw.to(c, { alpha: 0 }, { duration: 0.25 });
      });
      await this.ctx.tw.to(card.scale, { x: 1.2, y: 1.2 }, { duration: 0.2, ease: ease.outBack });
      // The card's count never holds the tracing (U7 R4): it starts, the 0.3 s beat and the tracing follow at once, and
      // `nt.start` waits for the count or her first stroke.
      const line = this.ctx.say('nt.count', { n: this.n });
      await this.ctx.tw.wait(0.3);
      this.cardRow.visible = false;
      this.pile.visible = false;
      this.canvas.visible = true;
      this.phase = 'trace';
      this.busy = false;
      this.handle.enabled = true;
      this.draw();
      this.placeFirefly();
      this.unasked = true;
      await line;
      this.askNow();
      return;
    }
    // A wrong card: a gentle boing, then the pet counts the group again, touching each thing; the second glows the answer.
    this.misses++;
    this.wrongCards++;
    if (cardHintDue(this.wrongCards)) {
      this.hints++;
      this.glowing = true;
    }
    sfx.boing();
    const x = card.x;
    await this.ctx.tw.to(card, { x: x - 12 }, { duration: 0.06 });
    await this.ctx.tw.to(card, { x: x + 12 }, { duration: 0.08 });
    await this.ctx.tw.to(card, { x }, { duration: 0.06 });
    if (this.phase !== 'cards') return;
    this.recounting = true;
    if (this.n === 0) {
      await this.ctx.say('nt.zero', { things: this.thing.plural });
    } else {
      await this.ctx.say('nt.recount');
      for (const [i, t] of this.things.entries()) {
        if (!this.recounting) return;
        sfx.marimba(i % 8, 0.4);
        void this.ctx.tw
          .to(t.scale, { x: 1.2, y: 1.2 }, { duration: 0.15, ease: ease.outBack })
          .then(() => this.ctx.tw.to(t.scale, { x: 1, y: 1 }, { duration: 0.15 }));
        await this.ctx.say('nt.count', { n: i + 1 });
      }
      if (!this.recounting) return;
      await this.ctx.say('nt.made', { n: this.n, things: thingWord(this.thing, this.n) });
    }
    if (!this.recounting || this.phase !== 'cards') return;
    this.recounting = false;
    this.busy = false;
  }

  /** Says `nt.start` if it is still waiting behind the right card's count. */
  private askNow() {
    if (!this.unasked || this.phase !== 'trace') return false;
    this.unasked = false;
    void this.ctx.instruct('nt.start', { n: this.n });
    return true;
  }

  /** The guide was tapped while `nt.start` waits: say it, not the cards' `nt.which`. */
  sayWaitingAsk() {
    return this.askNow();
  }

  /** Lays the group (or the basket) and the cards out on the asking screen. */
  private placeAsk() {
    const { things, cards } = askLayout(this.view);
    this.basket?.position.set(things.x + things.w / 2, things.y + things.h / 2);
    const spots = spotsFor(this.arrangement, this.things.length, things);
    if (spots) this.things.forEach((t, i) => t.position.set(spots[i].x, spots[i].y));
    this.cards.forEach((c, i) => c.position.set(cards[i].x, cards[i].y));
  }

  private prepareStroke() {
    this.points = sampleStroke(this.strokes[this.stroke]);
    this.progress = 0;
    this.previous = this.points[0];
    this.wrong = 0;
    this.fifth = 0;
    this.showPending = false;
    this.handle.enabled = true;
    this.firefly.visible = true;
    this.draw();
    this.placeFirefly();
  }

  private placeFirefly() {
    const p = this.points[this.progress];
    this.firefly.position.set(p[0] * this.size, p[1] * this.size);
    this.handle.home.x = this.firefly.x;
    this.handle.home.y = this.firefly.y;
  }

  private trace(to: Point) {
    if (this.busy || this.phase !== 'trace') {
      this.placeFirefly();
      return;
    }
    const next = advanceTrace(this.points, this.progress, this.previous, to, this.tolerance);
    const checkpoint = this.points[this.progress];
    if (next === this.progress && offTrail(to, checkpoint, this.tolerance) && !this.missedDrag) {
      this.missedDrag = true;
      this.misses++;
      this.wrong++;
      sfx.boing();
      void this.ctx.say('nt.wrong');
      if (hintCounts(this.ctx.level, this.wrong, this.tryHints)) {
        this.hints++;
        this.tryHints++;
      }
      if (hintDue(this.wrong)) this.showPending = true;
    }
    this.progress = next;
    const fifth = tuneStep(next, this.points.length);
    if (fifth > this.fifth) {
      this.fifth = fifth;
      sfx.marimba(5 + fifth, 0.3);
    }
    this.previous = to;
    this.placeFirefly();
    this.draw();
    if (this.progress === this.points.length - 1) void this.completeStroke();
  }

  /** The hint: the firefly flies the next stretch of trail by itself, leaving dots where it went, then comes back to her. */
  private async showWay() {
    this.showPending = false;
    if (this.busy || this.phase !== 'trace') return;
    this.askNow();
    this.busy = true;
    this.handle.enabled = false;
    const path = showTheWay(this.points, this.progress);
    const trail = new Graphics();
    this.canvas.addChildAt(trail, this.canvas.getChildIndex(this.firefly));
    sfx.chirp();
    for (const p of path.slice(1)) {
      await this.ctx.tw.to(this.firefly, { x: p[0] * this.size, y: p[1] * this.size }, { duration: 0.07 });
      trail.circle(p[0] * this.size, p[1] * this.size, 7).fill({ color: swatch.yellow.fill, alpha: 0.8 });
    }
    await this.ctx.tw.wait(0.3);
    const home = this.points[this.progress];
    await this.ctx.tw.to(
      this.firefly,
      { x: home[0] * this.size, y: home[1] * this.size },
      { duration: 0.35 },
    );
    trail.destroy();
    if (this.phase !== 'trace') return;
    this.busy = false;
    this.handle.enabled = true;
    this.placeFirefly();
  }

  private async completeStroke() {
    this.busy = true;
    this.handle.enabled = false;
    sfx.sparkle();
    // Every new stroke starts with a fresh touch, so moving across a pen lift never draws it.
    while (this.handle.dragging) await this.ctx.tw.wait(0.05);
    await this.ctx.tw.wait(0.2);
    this.stroke++;
    if (this.stroke < this.strokes.length) {
      this.busy = false;
      this.prepareStroke();
      void this.ctx.instruct('nt.stroke');
      return;
    }
    if (this.attempt < this.guides.length - 1) {
      // The same numeral again with less of the trail shown: the ink clears and the firefly goes back to the start.
      await this.ctx.tw.wait(0.5);
      this.attempt++;
      this.tryHints = 0;
      this.stroke = 0;
      this.busy = false;
      this.prepareStroke();
      void this.ctx.instruct(this.guides[this.attempt] === 'dotted' ? 'nt.dots' : 'nt.alone', { n: this.n });
      return;
    }
    this.pips.clear();
    this.outline.clear();
    this.ink.clear();
    this.cue.clear();
    this.beacon.clear();
    this.firefly.visible = false;
    this.handle.enabled = false;
    await this.meetThings();
  }

  /** The numeral is done: the things it stands for come out, either by themselves or as she wakes them. */
  private async meetThings() {
    const plan = planFor(this.ctx.level);
    const size = groupSize(this.n, plan.wakeThem);
    this.heading.text = `${this.n}`;
    if (this.asking) {
      await this.showWritten();
      return;
    }
    if (this.n === 0) {
      await this.ctx.say('nt.zero', { things: this.thing.plural });
      await this.ctx.tw.wait(1);
      this.phase = 'done';
      this.ctx.finish({ misses: this.misses, hints: this.hints });
      return;
    }
    const spots = spotsFor(this.arrangement, size, this.pileRect());
    if (!spots) throw new Error(`Number Trails: ${size} things do not fit this view`);
    this.things = spots.map((s) => {
      const t = drawThing(this.thing.id);
      t.position.set(s.x, s.y);
      t.hitArea = new Circle(0, 0, THING_HIT);
      this.pile.addChild(t);
      return t;
    });
    if (plan.wakeThem) {
      this.things.forEach((t) => {
        t.tint = ASLEEP;
        t.scale.set(0.85);
        const z = label('z', 38, swatch.purple.fill);
        z.position.set(-46, -50);
        z.name = 'z';
        t.addChild(z);
        onTap(t, () => this.wake(t), { cooldown: 200 });
      });
      this.phase = 'wake';
      this.busy = false;
      await this.ctx.instruct('nt.wake', { n: this.n, things: thingWord(this.thing, this.n) });
      return;
    }
    this.things.forEach((t) => t.scale.set(0));
    this.phase = 'show';
    for (let i = 0; i < this.things.length; i++) {
      const t = this.things[i];
      sfx.marimba(i % 8, 0.4);
      void this.ctx.tw.to(t.scale, { x: 1, y: 1 }, { duration: 0.35, ease: ease.outBack });
      await this.ctx.say('nt.count', { n: i + 1 });
      await this.ctx.tw.wait(0.2);
    }
    await this.ctx.say('nt.made', { n: this.n, things: thingWord(this.thing, this.n) });
    await this.ctx.tw.wait(1);
    this.phase = 'done';
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  /** Write how many's ending: the group she counted comes back beside the numeral she wrote, all at once. */
  private async showWritten() {
    this.phase = 'show';
    this.pile.visible = true;
    const room = this.pileRect();
    this.basket?.position.set(room.x + room.w / 2, room.y + room.h / 2);
    const spots = spotsFor(this.arrangement, this.things.length, room);
    this.things.forEach((t, i) => {
      t.eventMode = 'none';
      t.getChildByName('count')?.destroy();
      if (spots) t.position.set(spots[i].x, spots[i].y);
      t.scale.set(0);
      void this.ctx.tw.to(t.scale, { x: 1, y: 1 }, { duration: 0.35, ease: ease.outBack });
    });
    sfx.sparkle();
    if (this.n === 0) await this.ctx.say('nt.zero', { things: this.thing.plural });
    else await this.ctx.say('nt.made', { n: this.n, things: thingWord(this.thing, this.n) });
    await this.ctx.tw.wait(1);
    this.phase = 'done';
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  private async wake(t: Container) {
    if (this.phase !== 'wake' || this.busy) return;
    if (this.awake.has(t)) return;
    this.awake.add(t);
    this.woken++;
    const count = this.woken;
    t.tint = 0xffffff;
    t.getChildByName('z')?.destroy();
    sfx.marimba((count - 1) % 8, 0.4);
    void this.ctx.tw
      .to(t.scale, { x: 1.15, y: 1.15 }, { duration: 0.18, ease: ease.outBack })
      .then(() => this.ctx.tw.to(t.scale, { x: 1, y: 1 }, { duration: 0.15 }));
    if (count < this.n) {
      void this.ctx.say('nt.count', { n: count });
      return;
    }
    this.busy = true;
    await this.ctx.say('nt.made', { n: this.n, things: thingWord(this.thing, this.n) });
    // The ones left over go back to sleep for good: nothing more to tap.
    this.things.forEach((x) => {
      if (!this.awake.has(x)) x.eventMode = 'none';
    });
    await this.ctx.tw.wait(1);
    this.phase = 'done';
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  private pileRect() {
    if (this.phase === 'count' || this.phase === 'cards') return askLayout(this.view).things;
    const v = this.view;
    return { x: 150, y: 140, w: v.w - 190, h: v.h - 190 };
  }

  private drawPath(g: Graphics, points: readonly Point[], color: number, width: number) {
    g.moveTo(points[0][0] * this.size, points[0][1] * this.size);
    points.slice(1).forEach((p) => g.lineTo(p[0] * this.size, p[1] * this.size));
    g.stroke({ width, color, cap: 'round', join: 'round' });
  }

  /** The round's look: teal, a rainbow that changes color along the trail, gold with glitter, or sand. Paint only. */
  private drawInk(points: readonly Point[]) {
    if (this.look === 'rainbow') {
      for (let i = 1; i < points.length; i++)
        this.drawPath(
          this.ink,
          [points[i - 1], points[i]],
          swatch[RAINBOW[Math.floor(i / 4) % RAINBOW.length]].fill,
          24,
        );
    } else if (this.look === 'glitter') {
      this.drawPath(this.ink, points, swatch.yellow.fill, 24);
      points.forEach((p, i) => {
        if (i % 3 === 1)
          this.ink
            .circle(p[0] * this.size + (i % 2 ? 5 : -5), p[1] * this.size + (i % 4 < 2 ? -4 : 4), 3)
            .fill(swatch.white.fill);
      });
    } else {
      this.drawPath(this.ink, points, this.look === 'sand' ? swatch.brown.light : swatch.teal.fill, 24);
      if (this.look === 'sand') this.drawPath(this.ink, points, swatch.brown.fill, 6);
    }
  }

  /** The guide on screen for the stroke she is on: the try's own, or the solid trail again once she has wandered. */
  private guideNow(): Guide {
    return guideShown(this.guides[this.attempt], this.wrong);
  }

  private draw() {
    if (this.phase !== 'trace') return;
    this.outline.clear();
    this.ink.clear();
    this.cue.clear();
    this.strokes.forEach((stroke, i) => {
      const color = i === this.stroke ? swatch.purple.light : swatch.white.line;
      const guide = i === this.stroke ? this.guideNow() : this.guides[this.attempt];
      if (guide === 'solid') this.drawPath(this.outline, stroke, color, 28);
      else if (guide === 'dotted')
        for (const p of guideDots(sampleStroke(stroke)))
          this.outline
            .circle(p[0] * this.size, p[1] * this.size, 8)
            .fill(i === this.stroke ? { color: swatch.purple.fill, alpha: 0.55 } : color);
      if (i < this.stroke) this.drawInk(sampleStroke(stroke));
    });
    this.drawPips();
    if (this.progress > 0) this.drawInk(this.points.slice(0, this.progress + 1));
    if (this.progress === 0) this.drawStart();
    this.heading.text = `${this.n}`;
  }

  /** Less help each time: three pips under the numeral, filled up to the try she is on. */
  private drawPips() {
    this.pips.clear();
    if (this.guides.length < 2) return;
    this.guides.forEach((_, i) => {
      const x = this.view.w / 2 + (i - (this.guides.length - 1) / 2) * 34;
      this.pips.circle(x, 124, 9).stroke({ width: 4, color: swatch.purple.line });
      if (i <= this.attempt) this.pips.circle(x, 124, 9).fill(swatch.purple.fill);
    });
  }

  /** A ring at the start and an arrow just ahead of it, pointing the way the stroke leaves. */
  private drawStart() {
    const a = this.points[0],
      b = this.points[Math.min(this.points.length - 1, 7)];
    const ax = a[0] * this.size,
      ay = a[1] * this.size,
      bx = b[0] * this.size,
      by = b[1] * this.size;
    this.cue.circle(ax, ay, 34).stroke({ width: 5, color: swatch.green.line, alpha: 0.9 });
    const len = Math.hypot(bx - ax, by - ay) || 1,
      dx = (bx - ax) / len,
      dy = (by - ay) / len;
    const tipX = bx + dx * 12,
      tipY = by + dy * 12;
    this.cue
      .poly([
        tipX,
        tipY,
        tipX - dx * 26 - dy * 14,
        tipY - dy * 26 + dx * 14,
        tipX - dx * 26 + dy * 14,
        tipY - dy * 26 - dx * 14,
      ])
      .fill(swatch.green.fill)
      .stroke({ width: 4, color: swatch.green.line, cap: 'round', join: 'round' });
  }

  resize(v: View) {
    this.view = v;
    this.background.clear().rect(0, 0, v.w, v.h).fill(cream);
    this.size = Math.min(v.h - 260, v.w - 360, 520);
    this.canvas.position.set(v.w / 2 - this.size / 2 + 35, (v.h - this.size) / 2 + 55);
    this.heading.position.set(v.w / 2, 70);
    this.draw();
    this.placeFirefly();
    if (this.phase === 'count' || this.phase === 'cards') this.placeAsk();
    else if (this.things.length || this.basket) {
      this.basket?.position.set(
        this.pileRect().x + this.pileRect().w / 2,
        this.pileRect().y + this.pileRect().h / 2,
      );
      const spots = spotsFor(this.arrangement, this.things.length, this.pileRect());
      if (spots) this.things.forEach((t, i) => t.position.set(spots[i].x, spots[i].y));
    }
  }

  async start() {
    if (!this.asking) {
      void this.ctx.instruct('nt.start', { n: this.n });
      return;
    }
    if (this.n === 0) {
      void this.ctx.instruct('nt.basket', { things: this.thing.plural });
      void this.showCards();
      return;
    }
    void this.ctx.instruct('nt.how-many', { things: this.thing.plural });
  }

  update(dt: number) {
    this.clock += dt;
    this.beacon.clear();
    this.glow.clear();
    if (this.glowing && this.phase === 'cards') {
      const card = this.cards[this.choices.indexOf(this.n)];
      const pad = 12 + Math.sin(this.clock * 4) * 5;
      this.glow
        .roundRect(
          card.x - CARD_W / 2 - pad,
          card.y - CARD_H / 2 - pad,
          CARD_W + 2 * pad,
          CARD_H + 2 * pad,
          26,
        )
        .stroke({ width: 8, color: swatch.yellow.line });
    }
    if (this.phase !== 'trace' || this.busy) return;
    const lead = Math.min(
      this.points.length - 1,
      this.progress + 1 + Math.floor(((this.clock % 1.8) / 1.8) * 16),
    );
    const p = this.points[lead];
    // The dot that runs ahead is part of the trail: the start-only try hides it until she has wandered.
    if (this.guideNow() !== 'start')
      this.beacon
        .circle(p[0] * this.size, p[1] * this.size, 12)
        .fill({ color: swatch.yellow.fill, alpha: 0.7 });
    if (this.wrong >= 2)
      this.beacon
        .circle(this.firefly.x, this.firefly.y, 40 + Math.sin(this.clock * 4) * 5)
        .stroke({ width: 6, color: swatch.yellow.line });
  }

  autotouch(): TouchIntent | null {
    if (this.phase === 'count' && !this.busy) {
      const next = this.things.find((t) => !this.counted.has(t));
      return next ? { tap: { on: next } } : null;
    }
    if (this.phase === 'cards' && !this.busy) {
      const right = this.cards[this.choices.indexOf(this.n)];
      return right ? { tap: { on: right } } : null;
    }
    if (this.phase === 'wake' && !this.busy) {
      const next = this.things.find((t) => !this.awake.has(t));
      return next ? { tap: { on: next } } : null;
    }
    if (this.phase !== 'trace' || this.busy || !this.firefly.visible) return null;
    const route = traceWaypoints(this.points.slice(this.progress));
    if (route.length < 2) return null;
    return {
      trace: { on: this.firefly },
      via: route.slice(1).map((p) => ({ on: this.canvas, x: p[0] * this.size, y: p[1] * this.size })),
      pause: 0.12,
    };
  }

  destroy() {
    this.handle.destroy();
  }
}

function icon(): Container {
  const c = new Container();
  const three = numeralArt(3, 120, swatch.purple.fill);
  three.position.set(-60, -170);
  c.addChild(
    three,
    new Graphics()
      .circle(62, -150, 18)
      .fill(swatch.yellow.fill)
      .ellipse(44, -164, 14, 9)
      .ellipse(80, -164, 14, 9)
      .fill(swatch.teal.light),
  );
  return c;
}

function sticker(seed: number): Container {
  const c = new Container(),
    d = stickerDigit(seed);
  const board = tile(260, 260, 'yellow');
  const digit = numeralArt(d, 120, swatch.purple.fill);
  digit.position.set(-60, -85);
  c.addChild(board, digit);
  return c;
}

export const numberTrails: GameModule = {
  id: 'number-trails',
  name: 'Number Trails',
  titleLine: 'game.number-trails',
  region: 'counting-cove',
  challenge: 'numbers',
  skills: ['numerals', 'counting', 'fine-motor', 'writing'],
  bands: ['preschool', 'prek'],
  levels: (b) => rangeFor(LEVELS, b),
  entryLevels: ENTRY_LEVELS,
  describeLevel: (l) => planFor(l).name,
  music: STYLES.paint,
  coplayHint:
    'Say each number aloud with {name} as the things appear, and trace the same numeral in the air together.',
  offScreen:
    'Draw big numerals in sand, flour or on a foggy window, then line up that many pebbles beside each one.',
  hubIcon: () => new WigglyIcon(icon()),
  sticker,
  create: (ctx) => new NumberTrails(ctx),
  touchDemo: true,
};
