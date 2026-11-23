import { Container, Graphics, Circle, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { IllustratedDuck } from '../../art/friends/duck';
import { RAINBOW, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease, type Tweener } from '../../engine/tween';
import type { View } from '../../engine/view';
import { RoundButton } from '../../ui/buttons';
import { checkIcon } from '../../ui/icons';
import { label } from '../../ui/text';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  LEVELS,
  BIG_DUCK_SPOT,
  FRIEND_SLOTS,
  HIDING_SLOTS,
  hidingRevealSlots,
  numberSentence,
  stickerDucks,
  bankSize,
  duckMove,
  hidingPuzzle,
  howManyAnswers,
  layoutFor,
  dotRows,
  padValues,
  PAD_DOT_GAP,
  PAD_DOT_R,
  PAD_DOT_Y,
  PAD_R,
  planFor,
  SLOTS,
  story,
  tenStarts,
  doublesRounds,
  splitSeats,
  frameSeats,
  teenRounds,
  teenAnswer,
  teenPadRange,
  type TeenRound,
  type DoublesRound,
  type DuckPlan,
  type PondStory,
  padSpot,
  bankSpot,
  checkSpot,
  CHECK_HIT_R,
  CHECK_R,
  BANK_HIT_R,
  POND_HIT_R,
  freeSlot,
  stopVerdict,
  enterY,
  pondCenter,
  pondDrawRx,
  signSpot,
  POND_RX,
  POND_RY,
  SPLIT_BRIDGE_HALF,
  type Seating,
} from './logic';
import { rangeFor } from '../../progress/difficulty';
import { HINT_AFTER } from '../../progress/coach';

const WATER = 0x7cc4f2;
const WATER_EDGE = 0x5aa9e0;
const LILY = { fill: 0x7cc463, line: 0x4a9a35 };

/** Level 13's one big duck, well over twice the size of a friend (half of any duck is under its ripple). */
const BIG_DUCK = 2.4;

const plural = (n: number) => `${n} duck${n === 1 ? '' : 's'}`;

/** A duck that waits on the bank, hops along an arc, and bobs on the water up to its middle. */
class Duck extends Container {
  readonly critter = new IllustratedDuck();
  swimming = false;
  pondOffset: [number, number] | null = null;
  /** Sitting this one out (for example once enough ducks are in). */
  resting = false;
  /** Its place in the bank's row, kept while it swims, so a duck sent back (levels 4–5) returns to where it stood. */
  home = 0;
  private readonly glowRing = new Graphics();
  private glowing = false;
  private readonly ripple = new Graphics()
    .ellipse(0, -6, 66, 26)
    .fill(WATER)
    .stroke({ width: 4, color: 0xbfe6ff });
  private clock = Math.random() * 6;
  private arc: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    t: number;
    dur: number;
    h: number;
    done: () => void;
  } | null = null;

  constructor() {
    super();
    this.critter.scale.set(0.36);
    this.ripple.visible = false;
    this.addChild(this.glowRing, this.critter, this.ripple);
    this.hitArea = new Circle(0, -46, 72);
  }

  /** Still on its way along an arc (a tap then waits: a second hop would drop the first one's landing). */
  get hopping() {
    return this.arc !== null;
  }

  /** The hint at levels 4–5: a soft ring behind the duck to move next. */
  glow(on: boolean) {
    this.glowing = on;
    if (!on) this.glowRing.clear();
  }

  hopTo(x: number, y: number, duration = 0.65, height = 130): Promise<void> {
    return new Promise((done) => {
      this.arc = { x0: this.x, y0: this.y, x1: x, y1: y, t: 0, dur: duration, h: height, done };
      this.critter.hop(0.4);
    });
  }

  setSwimming(on: boolean) {
    this.swimming = on;
    this.ripple.visible = on;
  }

  hideUnderBridge() {
    this.critter.visible = false;
    this.ripple.visible = false;
  }

  rest() {
    this.resting = true;
    this.critter.setMood('sleepy');
  }

  update(dt: number) {
    this.clock += dt;
    this.critter.update(dt);
    if (this.arc) {
      const a = this.arc;
      a.t = Math.min(1, a.t + dt / a.dur);
      this.x = a.x0 + (a.x1 - a.x0) * a.t;
      this.y = a.y0 + (a.y1 - a.y0) * a.t - Math.sin(Math.PI * a.t) * a.h;
      if (a.t >= 1) {
        this.arc = null;
        a.done();
      }
    }
    this.critter.y = this.swimming ? 6 + 3 * Math.sin(this.clock * 2.6) : 0;
    if (this.glowing)
      this.glowRing
        .clear()
        .circle(0, -46, 62 + 5 * Math.sin(this.clock * 8))
        .fill({ color: 0xfff3a0, alpha: 0.7 });
  }
}

/** A floating answer button. */
class Pad extends Container {
  readonly value: number;
  private readonly glowRing = new Graphics();
  private glowing = false;
  private shake = 0;
  private clock = 0;

  /** `dots`: the pad also carries its number as dots in fives under a smaller numeral (levels 6–7), so she can match dots to ducks before she reads. */
  constructor(value: number, dots = false) {
    super();
    this.value = value;
    const pad = new Graphics()
      .circle(0, 0, PAD_R)
      .fill(LILY.fill)
      .stroke({ width: 6, color: LILY.line })
      .poly([22, -30, 42, -58, 60, -26])
      .fill(WATER);
    const n = label(String(value), dots ? 48 : 64, 0xffffff);
    n.style.stroke = { color: LILY.line, width: dots ? 7 : 8, join: 'round' };
    // Dots are drawn up to ten (two rows of five); a level whose pads pass ten shows numerals only.
    if (dots && value <= 10) {
      n.y = value === 0 ? 0 : value > 5 ? -24 : -18;
      for (const [x, y] of dotRows(value, PAD_DOT_GAP))
        pad
          .circle(x, PAD_DOT_Y + y, PAD_DOT_R)
          .fill(swatch.yellow.fill)
          .stroke({ width: 2, color: swatch.yellow.line });
    }
    this.addChild(this.glowRing, pad, n);
    this.hitArea = new Circle(0, 0, 74);
  }

  glow(on: boolean) {
    this.glowing = on;
  }

  wobble() {
    this.shake = 1;
  }

  update(dt: number) {
    this.clock += dt;
    this.shake = Math.max(0, this.shake - dt * 2);
    this.rotation = 0.03 * Math.sin(this.clock * 1.5) + 0.25 * this.shake * Math.sin(this.shake * 20);
    this.glowRing.clear();
    if (this.glowing)
      this.glowRing.circle(0, 0, 80 + 5 * Math.sin(this.clock * 8)).fill({ color: 0xfff3a0, alpha: 0.7 });
  }
}

class DuckPond implements Game {
  private readonly plan: DuckPlan;
  private readonly backdrop: Backdrop;
  private readonly pond = new Graphics();
  private readonly bridge = new Graphics();
  private readonly sign = new Container();
  private readonly signText = label('', 76, 0x5a3a22);
  private readonly signDots = new Graphics();
  private readonly ducks = new Container();
  private readonly padLayer = new Container();
  private bank: Duck[] = [];
  /** How many ducks the bank was dealt this round: the row's length, which a duck's `home` place is counted in. */
  private bankCount = 0;
  private swimmers: Duck[] = [];
  private pads: Pad[] = [];
  private view: View;
  /** Half the pond's width: `POND_RX`, or wider while a round seats twenty (`Seating.pondRx`). */
  private pondRx = POND_RX;
  /** Half the pond's height: `POND_RY`, or taller while an upright view stacks twenty (`Seating.pondRy`). */
  private pondRy = POND_RY;
  private round = 0;
  private want = 0;
  private answer = 0;
  private pondStory: PondStory | null = null;
  private misses = 0;
  private hints = 0;
  private wrongThisRound = 0;
  /** Levels 6–7: how many ducks each round shows (zero is an empty pond). */
  private answers: number[] = [];
  /** The layout this round's ducks were dealt (read by the browser check). */
  layoutKind = 'none';
  /** Make-ten levels: how many ducks each round starts with. */
  private starts: number[] = [];
  /** Level 14: the level's doubles rounds still to come, and this round's two sides. */
  private doubles: DoublesRound[] = [];
  sides: DoublesRound | null = null;
  /** Level 15: the level's rounds still to come, and this round (a full ten and some more). */
  private teens: TeenRound[] = [];
  teen: TeenRound | null = null;
  private busy = true;
  private finished = false;
  /** Level 13: the one big duck, and the layer over the whole screen whose touch brings her a friend. */
  private bigDuck: Duck | null = null;
  /** Levels 4–5: "That's enough!", and the ring that glows behind it as a hint once the pond holds the number. */
  private check: RoundButton | null = null;
  private readonly checkRing = new Graphics();
  private readonly touch = new Container();
  /** Level 13: friends called so far (the count), quiet time since the last touch, and when a spare touch last quacked. */
  private friends = 0;
  private idle = 0;
  private quackAt = -1;
  private clock = 0;

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.view = ctx.view;
    this.backdrop = ctx.track(
      new Backdrop(
        {
          sky: [0x8fd3f7, 0xe9f7ff],
          hills: [0xc8ecb0, 0x9edb86],
          horizon: 0.42,
          clouds: 3,
          sun: true,
          seed: 33,
        },
        ctx.view,
      ),
    );
    const board = new Graphics()
      .rect(-8, 40, 16, 110)
      .fill(wood.line)
      .roundRect(-110, -66, 220, 132, 18)
      .fill(wood.fill)
      .stroke({ width: 6, color: wood.line });
    this.signText.y = -14;
    this.sign.addChild(board, this.signText, this.signDots);
    this.sign.visible = false;
    // Ducks lower on the screen (nearer to us) draw in front.
    this.ducks.sortableChildren = true;
    ctx.stage.addChild(this.backdrop, this.pond, this.sign, this.bridge, this.ducks, this.padLayer);
    if (this.plan.stop) {
      this.check = new RoundButton(checkIcon(), swatch.green, CHECK_R, () => void this.pressCheck());
      this.check.visible = this.checkRing.visible = false;
      ctx.stage.addChild(this.checkRing, this.check);
    }
    if (this.plan.mode === 'friends') {
      // Lap's level: the big duck is on the pond from the start, and a layer over the whole screen takes every touch.
      const big = new Duck();
      big.scale.set(BIG_DUCK);
      big.eventMode = 'none';
      big.setSwimming(true);
      this.bigDuck = big;
      this.ducks.addChild(big);
      onTap(this.touch, (e) => this.anywhere(e), { cooldown: 60 });
      this.touch.cursor = 'default';
      ctx.stage.addChild(this.touch);
    }
  }

  private get tw(): Tweener {
    return this.ctx.tw;
  }

  start() {
    void this.nextRound();
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    const { x, y } = this.pondCenter();
    const g = this.pond.clear();
    // A round seating twenty widens the pond; its lily pads and reeds keep their places relative to the rim.
    const rx = pondDrawRx(v, this.pondRx);
    const ry = this.pondRy;
    const k = rx / POND_RX;
    g.ellipse(x, y, rx, ry).fill(WATER).stroke({ width: 10, color: WATER_EDGE });
    g.ellipse(x - 40 * k, y - 20, 300 * k, 80).fill({ color: 0xffffff, alpha: 0.12 });
    for (const [dx, dy, r] of [
      [-330, 50, 28],
      [310, 70, 24],
      [-280, -70, 20],
    ]) {
      g.circle(x + dx * k, y + dy, r)
        .fill(LILY.fill)
        .stroke({ width: 4, color: LILY.line });
    }
    for (const [dx, h] of [
      [-410, 120],
      [-395, 90],
      [405, 110],
      [420, 80],
    ]) {
      // Reeds stand just outside the rim, however wide the pond.
      const rx0 = x + Math.sign(dx) * Math.min(rx + Math.abs(dx) - POND_RX, v.w / 2 - 12);
      g.moveTo(rx0, y + 60)
        .quadraticCurveTo(rx0 + 6, y + 60 - h / 2, rx0 - 4, y + 60 - h)
        .stroke({ width: 7, color: 0x4a9a35, cap: 'round' });
      g.ellipse(rx0 - 4, y + 60 - h, 7, 20).fill(0x8f6142);
    }
    const bridge = this.bridge.clear();
    if (this.plan.split) {
      // A footbridge from the far bank to the near one, splitting the pond into a left and a right side.
      const half = SPLIT_BRIDGE_HALF;
      bridge
        .roundRect(x - half, y - POND_RY - 14, half * 2, POND_RY * 2 + 28, 10)
        .fill(wood.fill)
        .stroke({ width: 6, color: wood.line });
      for (let py = y - POND_RY + 20; py < y + POND_RY; py += 36)
        bridge
          .moveTo(x - half + 6, py)
          .lineTo(x + half - 6, py)
          .stroke({ width: 4, color: wood.line });
    } else {
      // Hiding ducks: the bridge spans the middle, seen from the front.
      bridge.rect(x - 190, y - 58, 28, 138).fill(wood.line);
      bridge.rect(x + 162, y - 58, 28, 138).fill(wood.line);
      bridge
        .roundRect(x - 220, y - 58, 440, 34, 8)
        .fill(wood.fill)
        .stroke({ width: 6, color: wood.line });
      bridge
        .roundRect(x - 220, y - 8, 440, 46, 8)
        .fill(wood.fill)
        .stroke({ width: 6, color: wood.line });
    }
    bridge.visible = this.plan.mode === 'hide' || !!this.plan.split;
    const sg = signSpot(v);
    this.sign.position.set(sg.x, sg.y);
    const ck = checkSpot(v);
    this.check?.position.set(ck.x, ck.y);
    this.checkRing.position.set(ck.x, ck.y);
    this.layoutBank();
    this.layoutPads();
    this.touch.hitArea = new Rectangle(0, 0, v.w, v.h);
    if (this.bigDuck) {
      this.bigDuck.position.set(x + BIG_DUCK_SPOT[0], y + BIG_DUCK_SPOT[1]);
      this.bigDuck.zIndex = this.bigDuck.y;
    }
    this.swimmers.forEach((d, i) => {
      const slot = d.pondOffset ?? SLOTS[i];
      d.position.set(x + slot[0], y + slot[1]);
    });
  }

  update(dt: number) {
    this.clock += dt;
    this.bigDuck?.update(dt);
    // Level 13: while she has not touched for a while, the big duck hops, an invitation without words. It counts nothing.
    if (this.bigDuck && !this.finished && this.friends < this.plan.max) {
      this.idle += dt;
      if (this.idle > 4) {
        this.idle = 0;
        this.bigDuck.critter.hop(0.5);
      }
    }
    for (const d of [...this.bank, ...this.swimmers]) d.update(dt);
    for (const p of this.pads) p.update(dt);
    const ring = this.checkRing.clear();
    if (this.check?.visible && this.wrongThisRound >= HINT_AFTER && this.swimmers.length === this.want)
      ring.circle(0, 0, CHECK_HIT_R + 4 + 5 * Math.sin(this.clock * 8)).fill({ color: 0xfff3a0, alpha: 0.7 });
  }

  /** The ghost finger on the how-to card: send the ducks in (all of them, or as many as the sign says), or touch the lily pad with the answer. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished) return null;
    const move = duckMove(
      this.plan,
      this.bank.filter((d) => !d.resting).length,
      this.swimmers.length,
      this.want,
      this.pads.map((p) => p.value),
      this.answer,
    );
    if (move === null) return null;
    if (move === 'check') return this.check ? { tap: { on: this.check } } : null;
    // Level 13: the finger touches the water or the grass well away from the big duck, to show that anywhere will do.
    if (move === 'duck' && this.bigDuck)
      return {
        tap: {
          on: this.touch,
          x: this.view.w / 2 + (this.friends % 2 ? 1 : -1) * Math.min(300, this.view.w * 0.32),
          y: this.view.h * 0.78,
        },
        pause: 0.4,
      };
    if (move === 'duck')
      return {
        tap: {
          on: (this.plan.mode === 'bye'
            ? this.swimmers[0]
            : this.bank.find((d) => !d.resting && !d.hopping))!,
          y: -46,
        },
      };
    return { tap: { on: this.pads[move.pad] } };
  }

  destroy() {}

  private pondCenter() {
    return pondCenter(this.view);
  }

  // ----- ducks coming and going -----

  private spawnBank(n: number) {
    this.bankCount = n;
    this.bank = Array.from({ length: n }, (_, i) => {
      const d = new Duck();
      d.home = i;
      onTap(d, () => void (this.swimmers.includes(d) ? this.sendBack(d) : this.tapBank(d)), {
        cooldown: 300,
      });
      this.ducks.addChild(d);
      return d;
    });
    this.layoutBank();
    this.bank.forEach((d, i) => {
      d.scale.set(0);
      void this.tw.to(d.scale, { x: 1, y: 1 }, { duration: 0.35, delay: i * 0.08, ease: ease.outBack });
    });
  }

  /** Each waiting duck stands at its own place in the row it was dealt in, so the row never shifts as ducks come and go. */
  private layoutBank() {
    const v = this.view;
    for (const d of this.bank) {
      if (d.hopping) continue;
      const at = bankSpot(v, d.home, this.bankCount);
      d.position.set(at.x, at.y);
      d.zIndex = 10000;
    }
  }

  /** A duck hops from wherever it is into the next free spot on the pond. */
  private async swimIn(d: Duck, slot = SLOTS[this.swimmers.length % SLOTS.length]) {
    d.pondOffset = slot;
    this.swimmers.push(d);
    this.bank = this.bank.filter((b) => b !== d);
    const { x, y } = this.pondCenter();
    await d.hopTo(x + slot[0], y + slot[1]);
    if (d.destroyed) return;
    // A resize during the hop (a phone turned) moved the pond: land on the slot where it is now.
    const now = this.pondCenter();
    d.position.set(now.x + slot[0], now.y + slot[1]);
    d.setSwimming(true);
    d.zIndex = d.y;
    sfx.splash();
    this.ctx.particles.burst(d.x, d.y - 10, {
      colors: [0xffffff, 0xbfe6ff],
      count: 10,
      speed: [80, 220],
      gravity: 500,
      size: [0.2, 0.4],
      life: [0.4, 0.7],
    });
  }

  /**
   * Ducks arriving from off-screen straight into the pond (no tapping needed). A `Seating`'s `scale` draws counted-only
   * ducks smaller, and its `pondRx` widens the pond first (twenty seats).
   */
  private async arrive(
    n: number,
    slots?: readonly [number, number][],
    seating?: Pick<Seating, 'scale' | 'pondRx' | 'pondRy'>,
    fromRight = false,
  ) {
    if (seating && this.sizePond(seating)) {
      this.resize(this.view);
    }
    for (let i = 0; i < n; i++) {
      const d = new Duck();
      d.scale.set(seating?.scale ?? 1);
      d.position.set(fromRight ? this.view.w + 80 : -80, enterY(this.view));
      this.ducks.addChild(d);
      await this.swimIn(d, slots?.[i]);
    }
  }

  /** Takes the pond size a seating asks for; true when it changed, so the pond is drawn again. */
  private sizePond(seats: Pick<Seating, 'pondRx' | 'pondRy'>): boolean {
    const ry = seats.pondRy ?? POND_RY;
    const changed = seats.pondRx !== this.pondRx || ry !== this.pondRy;
    this.pondRx = seats.pondRx;
    this.pondRy = ry;
    return changed;
  }

  /** Level 15: a full ten pops onto the pond at once, with one splash, rather than hopping in one by one. */
  private async arriveTen(seats: Seating) {
    if (this.sizePond(seats)) {
      this.resize(this.view);
    }
    const { x, y } = this.pondCenter();
    const ten = seats.slots.slice(0, 10).map((slot, i) => {
      const d = new Duck();
      d.pondOffset = slot;
      d.position.set(x + slot[0], y + slot[1]);
      d.setSwimming(true);
      d.zIndex = d.y;
      d.scale.set(0);
      this.ducks.addChild(d);
      this.swimmers.push(d);
      return this.tw.to(
        d.scale,
        { x: seats.scale, y: seats.scale },
        { duration: 0.35, delay: i * 0.03, ease: ease.outBack },
      );
    });
    sfx.splash();
    this.ctx.particles.burst(x - 200, y - 10, {
      colors: [0xffffff, 0xbfe6ff],
      count: 24,
      speed: [100, 300],
      gravity: 500,
      size: [0.2, 0.45],
      life: [0.5, 0.8],
    });
    await Promise.all(ten);
  }

  /** Level 15: the ones swim in from the right a little apart, into the second ten-frame. */
  private async arriveOnes(n: number, seats: Seating) {
    await Promise.all(
      Array.from({ length: n }, (_, i) =>
        this.tw.wait(i * 0.22).then(() => {
          const d = new Duck();
          d.scale.set(seats.scale);
          d.position.set(this.view.w + 80, enterY(this.view));
          this.ducks.addChild(d);
          return this.swimIn(d, seats.slots[10 + i]);
        }),
      ),
    );
  }

  /** Ducks beneath the bridge are real, but the bridge hides their count. */
  private async arriveHiding(visible: number, hidden: number) {
    for (let i = 0; i < visible; i++) {
      const d = new Duck();
      d.position.set(-80, enterY(this.view));
      this.ducks.addChild(d);
      await this.swimIn(d, HIDING_SLOTS[i]);
    }
    for (let i = 0; i < hidden; i++) {
      const d = new Duck();
      d.position.set(-80, enterY(this.view));
      this.ducks.addChild(d);
      // Keep hidden ducks directly under the broad center span of the bridge.
      await this.swimIn(d, [-90 + (i % 5) * 45, -16]);
      d.hideUnderBridge();
    }
  }

  /** Everyone on the water paddles off to the right. */
  private async swimAway(ducks = this.swimmers) {
    const leaving = [...ducks];
    this.swimmers = this.swimmers.filter((d) => !leaving.includes(d));
    // A duck paddling past must not catch the touch meant for one it passes.
    for (const d of leaving) d.eventMode = 'none';
    await Promise.all(
      leaving.map(async (d, i) => {
        await this.tw.to(d, { x: this.view.w + 120 }, { duration: 1.4 + i * 0.05, ease: ease.inQuad });
        d.destroy({ children: true });
      }),
    );
  }

  private clearBank() {
    for (const d of this.bank) {
      void this.tw.to(d, { alpha: 0 }, { duration: 0.3 }).then(() => d.destroy({ children: true }));
    }
    this.bank = [];
  }

  private quackChorus() {
    this.swimmers.forEach(
      (d, i) =>
        void this.tw.wait(i * 0.12).then(() => {
          d.critter.cheer();
          if (i < 4) sfx.animal('quack');
        }),
    );
  }

  /** Each swimming duck bobs in turn while the voice counts. */
  private async countAloud() {
    for (let i = 0; i < this.swimmers.length; i++) {
      const d = this.swimmers[i];
      d.critter.hop(0.5);
      sfx.bell(5 + (i % 5), 0.15);
      await this.ctx.say('count', { n: i + 1 });
    }
  }

  // ----- the rounds -----

  private async nextRound() {
    this.busy = true;
    this.wrongThisRound = 0;
    const p = this.plan;
    const rng = this.ctx.rng;
    if (p.mode === 'along') {
      this.spawnBank(p.max);
      if (this.round === 0) await this.ctx.instruct('duck.along');
      this.busy = false;
      return;
    }
    if (p.mode === 'bye') {
      for (let i = 0; i < p.max; i++) {
        const d = new Duck();
        // Five ducks sit 106 units apart, so each target is a 106-unit circle that stays its own.
        d.hitArea = new Circle(0, -46, POND_HIT_R);
        d.position.set(-80, enterY(this.view));
        this.ducks.addChild(d);
        onTap(d, () => void this.tapSwimmer(d), { cooldown: 300 });
        await this.swimIn(d);
      }
      if (this.round === 0) await this.ctx.instruct('duck.byeTap');
      this.busy = false;
      return;
    }
    if (p.mode === 'friends') {
      // Nothing holds her: the first touch counts while the line is still being said.
      this.busy = false;
      void this.ctx.instruct('duck.friends');
      return;
    }
    if (p.mode === 'make') {
      this.want = rng.int(p.min, p.max);
      this.showSign(this.want, !!p.dots);
      this.spawnBank(bankSize(p));
      await this.ctx.instruct(p.stop ? 'duck.makeStop' : 'duck.make', { n: plural(this.want) });
      if (this.check) {
        this.check.visible = this.checkRing.visible = true;
        this.check.scale.set(0);
        void this.tw.to(this.check.scale, { x: 1, y: 1 }, { duration: 0.4, ease: ease.outBack });
      }
      this.busy = false;
      return;
    }
    if (p.mode === 'howmany') {
      if (p.layouts) {
        // Levels 6–7: a dice face, two rows of five or a scatter, and sometimes an empty pond (never first).
        if (!this.answers.length) this.answers = howManyAnswers(rng, p);
        this.answer = this.answers.shift()!;
        const { kind, slots } = layoutFor(rng, p, this.answer);
        this.layoutKind = kind;
        if (this.answer) await this.arrive(this.answer, slots);
        else await this.tw.wait(0.8);
      } else {
        this.answer = rng.int(p.min, p.max);
        await this.arrive(this.answer);
      }
      await this.ctx.instruct('duck.howmany');
      this.showPads(this.answer);
      this.busy = false;
      return;
    }
    if (p.mode === 'ten') {
      if (!this.starts.length) this.starts = tenStarts(rng, p);
      const a = this.starts.shift()!;
      this.answer = 10 - a;
      await this.arrive(a);
      await this.ctx.instruct('duck.ten', { a });
      this.showPads(this.answer);
      this.busy = false;
      return;
    }
    if (p.mode === 'double') {
      // The left side swims in from the left, then the right side from the right, each side seated by the bridge.
      if (!this.doubles.length) this.doubles = doublesRounds(rng, p);
      const sides = this.doubles.shift()!;
      this.sides = sides;
      this.answer = sides.left + sides.right;
      const seats = splitSeats(sides.left, sides.right);
      await this.arrive(sides.left, seats.slots.slice(0, sides.left), seats);
      await this.arrive(sides.right, seats.slots.slice(sides.left), seats, true);
      // Each side bobs as the line names it, so "this side" and "that side" point somewhere.
      for (const d of this.swimmers.slice(0, sides.left)) d.critter.hop(0.5);
      void this.tw.wait(1.2).then(() => {
        for (const d of this.swimmers.slice(sides.left)) if (!d.destroyed) d.critter.hop(0.5);
      });
      await this.ctx.instruct('duck.double', { a: plural(sides.left), b: sides.right });
      this.showPads(this.answer);
      this.busy = false;
      return;
    }
    if (p.mode === 'teen') {
      // A full ten arrives at once, then the ones swim into the second frame; in turn, ask the whole or the ones.
      if (!this.teens.length) this.teens = teenRounds(rng, p);
      const t = this.teens.shift()!;
      this.teen = t;
      this.answer = teenAnswer(t);
      const total = 10 + t.ones;
      const seats = frameSeats(total, !!this.view.upright);
      if (t.ask === 'ones') this.showSign(total, false);
      await this.arriveTen(seats);
      await this.ctx.say('duck.fullTen');
      await this.arriveOnes(t.ones, seats);
      if (t.ask === 'ones') {
        for (const d of this.swimmers.slice(0, 10)) d.critter.hop(0.5);
        void this.tw.wait(1.4).then(() => {
          for (const d of this.swimmers.slice(10)) if (!d.destroyed) d.critter.hop(0.5);
        });
      }
      await this.ctx.instruct(t.ask === 'total' ? 'duck.teen' : 'duck.teenSplit', { b: t.ones, total });
      this.showPads(this.answer);
      this.busy = false;
      return;
    }
    if (p.mode === 'hide') {
      const puzzle = hidingPuzzle(rng, p);
      this.answer = puzzle.hidden;
      this.want = puzzle.total;
      this.showSign(puzzle.total, false);
      await this.arriveHiding(puzzle.visible, puzzle.hidden);
      await this.ctx.instruct('duck.hiding', { total: puzzle.total, visible: puzzle.visible });
      this.showPads(this.answer);
      this.busy = false;
      return;
    }
    // add / take away
    const { a, b, away, answer } = story(rng, p);
    this.answer = answer;
    this.pondStory = { a, b, away, answer };
    if (away) {
      await this.arrive(a);
      await this.ctx.say('duck.away', { a, b });
      await this.swimAway(this.swimmers.slice(-b));
    } else {
      await this.arrive(a);
      await this.ctx.say('duck.more', { a, b });
      await this.arrive(b);
    }
    await this.ctx.instruct('duck.now');
    this.showPads(this.answer);
    this.busy = false;
  }

  private async tapBank(d: Duck) {
    if (this.busy || d.resting || !this.bank.includes(d)) return;
    const p = this.plan;
    if (p.mode === 'along') {
      const n = this.swimmers.length + 1;
      void this.swimIn(d);
      void this.ctx.say('count', { n });
      if (this.bank.length === 0) {
        this.busy = true;
        await this.tw.wait(1.1);
        await this.roundWon(n);
      }
      return;
    }
    if (p.mode === 'make' && p.stop) {
      // Levels 4–5: she decides when it is enough, so every duck may go in; each takes the first free place on the pond.
      if (d.hopping) return;
      const n = this.swimmers.length + 1;
      d.hitArea = new Circle(0, -46, POND_HIT_R);
      void this.swimIn(d, SLOTS[freeSlot(this.swimmers.map((w) => SLOTS.indexOf(w.pondOffset!)))]);
      void this.ctx.say('count', { n });
      this.refreshHint();
      return;
    }
    if (p.mode === 'make') {
      const n = this.swimmers.length + 1;
      void this.swimIn(d);
      void this.ctx.say('count', { n });
      if (n === this.want) {
        // Enough! The rest sit this one out, so there's no way to overshoot.
        this.busy = true;
        this.bank.forEach((b) => b.rest());
        await this.tw.wait(1.1);
        void this.ctx.say('duck.made', { n: plural(n) });
        await this.roundWon(n, false);
      }
    }
  }

  /** Levels 4–5: a duck tapped on the pond hops back to its place on the bank, a free undo that counts nothing. */
  private async sendBack(d: Duck) {
    if (this.busy || !this.plan.stop || !d.swimming || d.hopping) return;
    this.swimmers = this.swimmers.filter((w) => w !== d);
    this.bank.push(d);
    d.setSwimming(false);
    d.pondOffset = null;
    d.hitArea = new Circle(0, -46, BANK_HIT_R);
    d.zIndex = 10000;
    sfx.animal('quack');
    void this.ctx.say('duck.back', { count: plural(this.swimmers.length) });
    this.refreshHint();
    const at = bankSpot(this.view, d.home, this.bankCount);
    await d.hopTo(at.x, at.y, 0.55, 110);
    if (d.destroyed) return;
    // A resize during the hop moved the bank: stand where its place is now.
    const now = bankSpot(this.view, d.home, this.bankCount);
    d.position.set(now.x, now.y);
  }

  /** Levels 4–5: "That's enough!" Just the sign's number ends the round; too few or too many is a gentle miss, counted aloud. */
  private async pressCheck() {
    if (this.busy || this.finished || !this.check?.visible) return;
    this.busy = true;
    // A duck still on its way counts once it lands.
    while ([...this.swimmers, ...this.bank].some((d) => d.hopping)) await this.tw.wait(0.1);
    const n = this.swimmers.length;
    if (stopVerdict(n, this.want) === 'right') {
      this.check.visible = this.checkRing.visible = false;
      for (const d of [...this.bank, ...this.swimmers]) d.glow(false);
      this.bank.forEach((b) => b.rest());
      void this.ctx.say('duck.made', { n: plural(n) });
      await this.roundWon(n, false);
      return;
    }
    this.misses++;
    this.wrongThisRound++;
    sfx.boing();
    if (n) {
      await this.ctx.say('duck.countus');
      await this.countAloud();
    }
    await this.ctx.say('duck.extra', { count: plural(n), n: this.want });
    // From the second miss the duck to move glows (or the check, once the number is there); the question counts one hint.
    if (this.wrongThisRound === HINT_AFTER) this.hints++;
    this.refreshHint();
    this.busy = false;
  }

  /** The hint at levels 4–5, kept up to date as ducks come and go: a waiting duck glows while too few swim, a swimmer while too many. */
  private refreshHint() {
    for (const d of [...this.bank, ...this.swimmers]) d.glow(false);
    if (!this.plan.stop || this.wrongThisRound < HINT_AFTER) return;
    const verdict = stopVerdict(this.swimmers.length, this.want);
    if (verdict === 'few') (this.bank.find((d) => !d.hopping) ?? this.bank[0])?.glow(true);
    if (verdict === 'many') this.swimmers[this.swimmers.length - 1]?.glow(true);
  }

  /** Bye-bye ducks: the tapped duck waves and swims off, the voice counts down, and the last one brings them all back. */
  private async tapSwimmer(d: Duck) {
    if (this.busy || !this.swimmers.includes(d)) return;
    d.critter.cheer();
    sfx.animal('quack');
    const left = this.swimmers.length - 1;
    const gone = this.swimAway([d]);
    void this.ctx.say(left ? 'duck.bye' : 'duck.byeAll', { n: left });
    if (left > 0) return;
    this.busy = true;
    await gone;
    await this.tw.wait(0.5);
    await this.ctx.say('duck.callback');
    await this.arrive(this.plan.max);
    await this.countAloud();
    await this.roundWon(this.plan.max, false);
  }

  /** Level 13: any touch has the big duck quack and brings the next friend swimming in, with the count; after the fifth, a touch gets a quack. */
  private anywhere(e: FederatedPointerEvent) {
    const big = this.bigDuck;
    if (!big) return;
    this.idle = 0;
    // After the fifth (and through the confetti), a touch only quacks.
    if (this.busy || this.finished || this.friends >= this.plan.max) {
      // A spare touch is answered, never ignored, and counts nothing.
      if (this.clock - this.quackAt < 0.25) return;
      this.quackAt = this.clock;
      big.critter.cheer();
      sfx.animal('quack');
      const at = this.ctx.stage.toLocal(e.global);
      this.ctx.particles.burst(at.x, at.y, {
        colors: [0xffffff, 0xbfe6ff],
        count: 6,
        speed: [60, 160],
        gravity: 400,
        size: [0.2, 0.35],
        life: [0.3, 0.5],
      });
      return;
    }
    const n = ++this.friends;
    big.critter.cheer();
    sfx.animal('quack');
    this.showSign(n, true);
    void this.ctx.say('count', { n });
    const d = new Duck();
    d.eventMode = 'none';
    // Friends come from the side she did not just see one come from: left, right, left…
    d.position.set(n % 2 ? -80 : this.view.w + 80, enterY(this.view));
    this.ducks.addChild(d);
    const swum = this.swimIn(d, FRIEND_SLOTS[n - 1]);
    if (n < this.plan.max) return;
    this.busy = true;
    void swum.then(() => this.allFriends());
  }

  /** Level 13: all five friends are in; everyone quacks, then the pond celebrates. */
  private async allFriends() {
    await this.tw.wait(0.5);
    this.bigDuck?.critter.cheer();
    this.quackChorus();
    sfx.sparkle();
    await this.ctx.say('duck.friendsAll');
    await this.tw.wait(0.4);
    void this.finale();
  }

  private async roundWon(n: number, announce = true) {
    this.quackChorus();
    this.ctx.pet.cheer();
    sfx.sparkle();
    if (announce) await this.ctx.say('duck.total', { n });
    else await this.tw.wait(1.2);
    await this.tw.wait(0.4);
    this.clearBank();
    this.hideSign();
    await this.swimAway();
    this.round++;
    if (this.round >= this.plan.rounds) void this.finale();
    else void this.nextRound();
  }

  private showSign(n: number, dots: boolean) {
    this.sign.visible = true;
    this.signText.style.fontSize = 76;
    this.signText.text = String(n);
    this.signText.y = dots ? -18 : 0;
    const g = this.signDots.clear();
    if (dots)
      for (let i = 0; i < n; i++)
        g.circle((i - (n - 1) / 2) * 26, 40, 9)
          .fill(swatch.yellow.fill)
          .stroke({ width: 3, color: swatch.yellow.line });
    this.sign.scale.set(0);
    void this.tw.to(this.sign.scale, { x: 1, y: 1 }, { duration: 0.4, ease: ease.outBack });
  }

  private async showSentence(a: number, b: number, away = false) {
    this.showSign(0, false);
    this.signText.style.fontSize = 32;
    this.signText.text = numberSentence(a, b, away);
    await this.ctx.say(away ? 'duck.minus' : 'duck.plus', { a, b, n: away ? a - b : a + b });
  }

  private hideSign() {
    this.sign.visible = false;
  }

  private showPads(answer: number) {
    const [lo, hi] =
      this.plan.mode === 'teen' && this.teen
        ? teenPadRange(this.teen)
        : [this.plan.zero ? 0 : 1, this.plan.padMax];
    const values = padValues(this.ctx.rng, answer, lo, hi);
    this.pads = values.map((v) => {
      const pad = new Pad(v, !!this.plan.padDots);
      onTap(pad, () => void this.tapPad(pad), { cooldown: 400 });
      pad.scale.set(0);
      this.padLayer.addChild(pad);
      return pad;
    });
    this.layoutPads();
    this.pads.forEach(
      (pad, i) =>
        void this.tw.to(pad.scale, { x: 1, y: 1 }, { duration: 0.4, delay: i * 0.1, ease: ease.outBack }),
    );
  }

  private layoutPads() {
    const v = this.view;
    this.pads.forEach((p, i) => {
      const at = padSpot(v, i, this.pads.length);
      p.position.set(at.x, at.y);
    });
  }

  private clearPads() {
    for (const p of this.pads) p.destroy({ children: true });
    this.pads = [];
  }

  private async tapPad(pad: Pad) {
    if (this.busy || this.finished) return;
    this.busy = true;
    if (pad.value === this.answer && this.plan.mode === 'ten') {
      // The missing ducks swim in and the pond is full: ten.
      pad.glow(true);
      sfx.bell(9, 0.3);
      this.clearPads();
      const a = this.swimmers.length;
      await this.arrive(this.answer);
      await this.showSentence(a, this.answer);
      await this.ctx.say('duck.tenmade', { a, b: this.answer });
      await this.roundWon(10, false);
      return;
    }
    if (pad.value === this.answer && this.plan.mode === 'teen' && this.teen) {
      // Ten and some more: the sign writes "10 + 4 = 14" and the pet reads it.
      pad.glow(true);
      sfx.bell(9, 0.3);
      for (const d of this.swimmers.slice(10)) d.critter.hop(0.5);
      await this.showSentence(10, this.teen.ones);
      await this.tw.wait(0.2);
      this.clearPads();
      await this.roundWon(10 + this.teen.ones, false);
      return;
    }
    if (pad.value === this.answer) {
      pad.glow(true);
      sfx.bell(9, 0.3);
      if (this.plan.mode === 'hide') {
        const visible = this.want - this.answer;
        await this.ctx.say('duck.hidingCount', { visible, total: this.want });
        const slots = hidingRevealSlots({ visible, hidden: this.answer, total: this.want });
        for (let i = 0; i < slots.length; i++) {
          const d = this.swimmers[visible + i];
          d.critter.visible = true;
          d.setSwimming(true);
          d.pondOffset = slots[i];
          const { x, y } = this.pondCenter();
          sfx.splash();
          await Promise.all([
            this.tw.to(d, { x: x + slots[i][0], y: y + slots[i][1] }, { duration: 0.6 }),
            this.ctx.say('count', { n: visible + i + 1 }),
          ]);
          d.zIndex = d.y;
        }
        await this.showSentence(visible, this.answer);
        await this.ctx.say('duck.hidingFound', { hidden: this.answer, visible, total: this.want });
        await this.tw.wait(0.2);
        this.clearPads();
        await this.roundWon(this.want, false);
        return;
      } else if (this.answer === 0) {
        // An empty pond: none is a number too.
        await this.ctx.say('duck.none');
        this.clearPads();
        await this.roundWon(0, false);
        return;
      } else {
        await this.countAloud();
        if (this.plan.mode === 'add' && this.pondStory) {
          const { a, b, away } = this.pondStory;
          await this.showSentence(a, b, away);
        }
        if (this.plan.mode === 'double' && this.sides)
          await this.showSentence(this.sides.left, this.sides.right);
      }
      await this.tw.wait(0.2);
      this.clearPads();
      await this.roundWon(this.answer);
      return;
    }
    // Not quite: count them together, then show the right pad.
    this.misses++;
    this.wrongThisRound++;
    pad.wobble();
    sfx.boing();
    if (this.plan.mode === 'ten') {
      // Count on from the ducks already swimming, up to ten, on the fingers.
      await this.ctx.say('duck.counton', { a: this.swimmers.length });
      for (let n = this.swimmers.length + 1; n <= 10; n++) {
        await this.ctx.say('count', { n });
        await this.tw.wait(0.15);
      }
    } else if (this.plan.mode === 'hide') {
      const visible = this.want - this.answer;
      await this.ctx.say('duck.hidingCount', { visible, total: this.want });
      for (let n = visible + 1; n <= this.want; n++) {
        await this.ctx.say('count', { n });
        await this.tw.wait(0.15);
      }
    } else if (this.plan.mode === 'teen' && this.teen) {
      // In all: count on from the full ten ("ten… eleven, twelve"). Past ten: the ten bobs, then the ones are counted.
      for (const d of this.swimmers.slice(0, 10)) d.critter.hop(0.5);
      const all = this.teen.ask === 'total';
      await this.ctx.say(all ? 'duck.teenCounton' : 'duck.teenTen');
      if (all) await this.ctx.say('count', { n: 10 });
      for (let i = 10; i < this.swimmers.length; i++) {
        this.swimmers[i].critter.hop(0.5);
        sfx.bell(5 + (i % 5), 0.15);
        await this.ctx.say('count', { n: all ? i + 1 : i - 9 });
      }
    } else if (this.plan.mode === 'double' && this.sides) {
      // One side, then count on across the bridge: "4 on this side, and 4 more: 5, 6, 7, 8."
      const { left, right } = this.sides;
      for (const d of this.swimmers.slice(0, left)) d.critter.hop(0.5);
      await this.ctx.say('duck.doubleCount', { a: left, b: right });
      for (let i = left; i < this.swimmers.length; i++) {
        this.swimmers[i].critter.hop(0.5);
        sfx.bell(5 + (i % 5), 0.15);
        await this.ctx.say('count', { n: i + 1 });
      }
    } else if (this.swimmers.length === 0) {
      await this.ctx.say('duck.noneHere');
    } else {
      await this.ctx.say('duck.countus');
      await this.countAloud();
    }
    // The right pad glows from the second miss on a question, and that question counts one hint, however many more misses.
    if (this.wrongThisRound === HINT_AFTER) this.hints++;
    if (this.wrongThisRound >= HINT_AFTER) this.pads.find((p) => p.value === this.answer)?.glow(true);
    this.busy = false;
  }

  private async finale() {
    this.finished = true;
    // On the split pond the five finale ducks sit either side of the footbridge, never on it.
    if (this.plan.split) {
      const seats = splitSeats(3, 2);
      await this.arrive(5, seats.slots, seats);
    } else if (this.plan.mode === 'teen') {
      // The pond narrows back from the two ten-frames for five full-size ducks.
      const seats = frameSeats(5, !!this.view.upright);
      await this.arrive(5, seats.slots, seats);
    } else if (this.plan.mode !== 'friends') await this.arrive(5);
    this.quackChorus();
    this.ctx.pet.cheer();
    const colors = RAINBOW.map((c) => swatch[c].fill);
    const { x, y } = this.pondCenter();
    this.ctx.particles.burst(x, y - 100, {
      kind: 'confetti',
      colors,
      count: 60,
      speed: [200, 600],
      gravity: 600,
      life: [1.2, 2],
    });
    sfx.tada();
    await this.tw.wait(1.8);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

/** The hub's little pond with two ducks bobbing about. */
class PondIcon extends Container {
  private readonly ducks: IllustratedDuck[] = [];
  private clock = 0;
  private next = 2;

  constructor() {
    super();
    const water = new Graphics()
      .ellipse(0, -30, 150, 52)
      .fill(WATER)
      .stroke({ width: 7, color: WATER_EDGE })
      .circle(-100, -16, 18)
      .fill(LILY.fill)
      .stroke({ width: 3, color: LILY.line });
    this.addChild(water);
    for (const x of [-40, 50]) {
      const d = new IllustratedDuck();
      d.scale.set(0.3);
      d.position.set(x, -28);
      this.ducks.push(d);
      const ripple = new Graphics().ellipse(x, -38, 52, 14).fill(WATER).stroke({ width: 3, color: 0xbfe6ff });
      this.addChild(d, ripple);
    }
  }

  update(dt: number) {
    this.clock += dt;
    this.ducks.forEach((d, i) => {
      d.update(dt);
      d.y = -28 + 3 * Math.sin(this.clock * 2.4 + i * 2);
    });
    this.next -= dt;
    if (this.next <= 0) {
      this.next = 1.8 + Math.random() * 2;
      this.ducks[Math.floor(Math.random() * this.ducks.length)].hop(0.5);
    }
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const n = stickerDucks(rng);
  for (let i = 0; i < n; i++) {
    const d = new IllustratedDuck();
    d.alive = false;
    d.scale.set(0.5);
    d.position.set((i - (n - 1) / 2) * 110, i % 2 ? 14 : 0);
    c.addChild(d);
  }
  c.addChild(
    new Graphics()
      .ellipse(0, -6, 80 + n * 50, 26)
      .fill(WATER)
      .stroke({ width: 5, color: 0xbfe6ff }),
  );
  return c;
}

export const duckPond: GameModule = {
  id: 'duck-pond',
  name: 'Duck Pond',
  titleLine: 'game.duck-pond',
  region: 'counting-cove',
  challenge: 'numbers',
  skills: ['counting', 'number-sense', 'adding'],
  bands: ['lap', 'toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => {
    const p = planFor(level);
    if (p.mode === 'along') return `Count along as ${p.max} ducks hop in`;
    if (p.mode === 'bye') return 'Wave bye-bye as each of five ducks swims off, then count them back';
    if (p.mode === 'friends') return 'One big duck: a touch anywhere brings a friend, up to five';
    if (p.mode === 'make')
      return `Put ${p.min} to ${p.max} ducks in the pond${p.dots ? ' (number and dots)' : ' (number only)'}${p.stop ? ', then tap the check' : ''}`;
    if (p.mode === 'howmany')
      return p.zero
        ? `How many ducks? 0 to ${p.max}, ${p.layouts?.includes('scatter') ? 'dice, rows or scattered' : 'dice or rows'}, dotted pads`
        : `How many ducks? ${p.min} to ${p.max}`;
    if (p.mode === 'ten') return 'Make ten: how many more ducks fill the pond to 10?';
    if (p.mode === 'hide') return 'Part and whole: how many ducks hide under the bridge?';
    if (p.mode === 'double')
      return `Doubles: ${p.min} + ${p.min} to ${p.max} + ${p.max} across the bridge, then one more on a side; how many in all?`;
    if (p.mode === 'teen')
      return 'Ten and some more: a full pond of ten and 1 to 9 more; how many in all (11 to 19), or how many past ten?';
    if (p.mode === 'add') return p.subtract ? 'Adding and taking away, up to 10' : 'Adding, up to 5';
    const exhaustive: never = p.mode;
    return exhaustive;
  },
  music: STYLES.hub,
  coplayHint: 'Count out loud with {name}, and touch each duck as you count.',
  coplayHintLap: 'Count out loud as {name} touches each duck: "one, two, three!"',
  offScreen: 'Line up toy ducks or spoons and count them together, touching each one.',
  hubIcon: () => new PondIcon(),
  entryLevels: [12, 13],
  touchDemo: true,
  upright: true,
  sticker,
  create: (ctx) => new DuckPond(ctx),
};
