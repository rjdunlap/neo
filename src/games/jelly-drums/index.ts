import { Container, Graphics, Rectangle, Sprite } from 'pixi.js';
import { Critter, CRITTERS, type CritterName } from '../../art/critter';
import { cheek, ink, RAINBOW, swatch, wood, type ColorName } from '../../art/palette';
import { gradientTexture } from '../../art/scenery';
import { domePath, musicNote } from '../../art/shapes';
import { music, STYLES, silenced } from '../../audio/music';
import { PITCH_COLORS, pitchColor } from '../../audio/notes';
import { sfx, type AnimalSound } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { RoundButton } from '../../ui/buttons';
import { replayArt } from '../shared';
import type { View } from '../../engine/view';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { entryId } from '../../content/journal';
import { Jelly } from './jelly';
import { drawBackdrop, STAGES, type StageLook } from './stages';
import { CHOICE_RADIUS, HIT_PAD, jellyLayout, ORDER_HW, ORDER_SLOT_RADIUS, type Layout } from './layout';
import {
  answerOf,
  LEVELS,
  awakeJellies,
  drawLineups,
  drawPair,
  drawTune,
  drawWhich,
  fanAnswering,
  IdleNudge,
  JellyNamer,
  jellyToTap,
  nearestAwake,
  orderDirection,
  orderToDrag,
  placeAfterMiss,
  planFor,
  RESUME_FROM_LENGTH,
  sameFlags,
  ScaleWatch,
  JournalWatch,
  SET_STEPS,
  soundSetFor,
  tuneLength,
  verdictOf,
  verdictToTap,
  whichAwake,
  STAGE_OF,
  type OrderLineup,
  type SoundSet,
  type JellyPhase,
  type JellyPlan,
  type Tune,
  type TunePair,
  type Verdict,
} from './logic';
import { rangeFor } from '../../progress/difficulty';

/** Big jelly, low note: C D E G A from left to right, in the one rainbow every pitched colour uses. */
const COLORS = PITCH_COLORS;
const BULBS = 8;

const FANS: CritterName[] = ['duck', 'bunny', 'cat', 'pig'];
/** Each fan's own voice when it answers on level 2. */
const FAN_VOICES: AnimalSound[] = ['quack', 'hop', 'meow', 'oink'];

interface OrderItem {
  jelly: Jelly;
  pitch: number;
  drag: DragHandle;
  placed: boolean;
  slot: number;
  rowIndex: number;
}

/** The picture on an answer button: two matching dots for "same", two unlike ones (a big round one and a small square one) for "different". */
function dotsArt(same: boolean): Graphics {
  const g = new Graphics();
  if (same) {
    g.circle(-22, 0, 17).fill(0xffffff).stroke({ width: 5, color: swatch.green.line });
    g.circle(22, 0, 17).fill(0xffffff).stroke({ width: 5, color: swatch.green.line });
  } else {
    g.circle(-22, 0, 20).fill(0xffffff).stroke({ width: 5, color: swatch.orange.line });
    g.roundRect(8, -11, 22, 22, 4).fill(swatch.purple.fill).stroke({ width: 5, color: swatch.purple.line });
  }
  g.scale.set(1.35);
  return g;
}

class JellyDrums implements Game {
  private readonly plan: JellyPlan;
  /** The round's instrument, from its seed, and the stage it plays on. */
  readonly sounds: SoundSet;
  private readonly look: StageLook;
  private readonly sky: Sprite;
  /** The moon and stars, or the sun. */
  private readonly skyThings = new Graphics();
  private readonly mountains = new Graphics();
  private readonly stageG = new Graphics();
  private readonly garland = new Graphics();
  private readonly jellies: Jelly[];
  private readonly fans: Critter[];
  /** Wake level only: a stage-wide layer last in the stage, so a touch anywhere sings the nearest awake jelly. */
  private readonly anywhere = new Graphics();
  private view: View;
  private lay: Layout;
  private phase: JellyPhase = 'play';
  private lit = 0;
  private notes = 0;
  /** The tune that plays (and, on a backwards level, the reverse of what she taps). */
  private tune: number[] = [];
  /** The jellies she taps, in order: the tune, or on a backwards level the tune last note first. */
  private answer: number[] = [];
  private at = 0;
  private tunesDone = 0;
  /** The tunes already played this round, so none comes round twice. */
  private played: Tune[] = [];
  /** Tune levels: hear the tune again, free (no miss, no hint), whenever it is her turn. */
  private readonly again: RoundButton;
  /** Level 12: the two answer buttons, "same" (two matching dots) and "different" (two unlike dots). */
  private readonly choices: Record<Verdict, RoundButton>;
  /** Level 12: a ring on the right button after two misses on one pair. */
  private readonly ring = new Graphics();
  /** Level 12: which pairs of the round are the same, and the pair now playing. */
  private flags: boolean[] = [];
  private pair: TunePair | null = null;
  /** Level 14 ("Which jelly sang?"): the jelly that sang the mystery note. */
  private whichTarget: number | null = null;
  /** Level 13 ("Lowest to highest"): the shelf of four slots, the lit target pad, the sleeping fifth jelly and active row. */
  private readonly orderShelf = new Graphics();
  private readonly orderSlots = new Graphics();
  private readonly sleeperG = new Graphics();
  private readonly orderLayer = new Container();
  private lineups: OrderLineup[] = [];
  private orderJellies: OrderItem[] = [];
  private placedCount = 0;
  private slotPulse = 0;
  private dead = false;
  /** Four- and five-note tunes: dots for the notes she has right so far (her place after a miss). */
  private readonly ticks = new Graphics();
  /** Backwards level: a rewind arrow beside the listen-again button. */
  private readonly rewind = new Graphics();
  /** Free play: a quiet jelly wiggles after a while without a touch. */
  private readonly nudge = new IdleNudge();
  /** Free play: the voice names a jelly now and then. */
  private readonly namer = new JellyNamer();
  /** Level 3: three neighbours in a row sparkle. */
  private readonly scale = new ScaleWatch();
  /** What this round showed for the journal: low and high. */
  private readonly journal = new JournalWatch();
  private lastJelly = 2;
  private wrongThisTune = 0;
  private misses = 0;
  private hints = 0;
  private clock = 0;
  /** Seconds left of the garland's twinkle after a scale. */
  private twinkle = 0;

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.sounds = soundSetFor(ctx.rng);
    this.look = STAGES[STAGE_OF[this.sounds]];
    this.sky = new Sprite(gradientTexture(...this.look.sky));
    this.skyThings.eventMode = 'none';
    this.mountains.eventMode = 'none';
    this.view = ctx.view;
    this.lay = jellyLayout(ctx.view);
    this.jellies = COLORS.map((c, i) => {
      const hw = 82 - i * 7;
      const j = new Jelly(c, hw, hw * 1.55);
      onTap(j, () => this.tapJelly(i), { cooldown: 90 });
      j.hitArea = new Rectangle(-hw - 18, -hw * 1.55 - 30, hw * 2 + 36, hw * 1.55 + 50);
      return j;
    });
    this.fans = FANS.map((name) => {
      const c = ctx.track(new Critter(CRITTERS[name]));
      c.scale.set(0.3);
      return c;
    });
    this.again = new RoundButton(replayArt(), swatch.yellow, 56, () => void this.listenAgain());
    const tunes = this.plan.mode === 'echo' || this.plan.mode === 'compare' || this.plan.mode === 'which';
    this.again.visible = tunes && !ctx.couch;
    this.choices = {
      same: new RoundButton(dotsArt(true), swatch.green, CHOICE_RADIUS, () => this.answerPair('same')),
      different: new RoundButton(dotsArt(false), swatch.orange, CHOICE_RADIUS, () =>
        this.answerPair('different'),
      ),
    };
    for (const b of Object.values(this.choices)) b.visible = this.plan.mode === 'compare';
    const orderMode = this.plan.mode === 'order';
    this.orderShelf.eventMode = 'none';
    this.orderSlots.eventMode = 'none';
    this.sleeperG.eventMode = 'none';
    this.orderShelf.visible = orderMode;
    this.orderSlots.visible = orderMode;
    this.sleeperG.visible = orderMode;
    this.orderLayer.visible = orderMode;
    if (orderMode) this.jellies.forEach((j) => (j.visible = false));
    ctx.stage.addChild(
      this.sky,
      this.skyThings,
      this.mountains,
      this.garland,
      this.orderShelf,
      this.orderSlots,
      this.stageG,
      ...this.jellies,
      this.sleeperG,
      this.orderLayer,
      ...this.fans,
      this.again,
      this.choices.same,
      this.choices.different,
      this.ring,
      this.ticks,
      this.rewind,
    );
    this.ticks.eventMode = 'none';
    this.ring.eventMode = 'none';
    this.rewind.eventMode = 'none';
    this.rewind.visible = !!this.plan.reverse && !ctx.couch;
    if (this.plan.mode === 'wake') {
      this.jellies.forEach((j) => (j.eventMode = 'none'));
      onTap(
        this.anywhere,
        (e) => {
          const x = ctx.stage.toLocal(e.global).x;
          this.tapJelly(
            nearestAwake(
              this.jellies.map((j) => j.x),
              awakeJellies(this.notes),
              x,
            ),
          );
        },
        { cooldown: 90 },
      );
      ctx.stage.addChild(this.anywhere);
    }
  }

  start() {
    if (this.plan.mode === 'which') {
      this.phase = 'listen';
      this.applyWhichAwake(whichAwake(0), false);
      void this.ctx.instruct('jelly.which', { name: this.ctx.childName });
      void this.ctx.tw.wait(1.8).then(() => this.nextWhich());
      return;
    }
    if (this.plan.mode === 'order') {
      this.lineups = drawLineups(this.ctx.rng, this.plan.goal, this.plan.length);
      this.setupLineup(0);
      void this.ctx.instruct('jelly.order', { name: this.ctx.childName });
      return;
    }
    if (this.plan.mode === 'compare') {
      this.flags = sameFlags(this.ctx.rng, this.plan.goal);
      void this.ctx.instruct('jelly.compare', { a: 1, b: 2 });
      void this.ctx.tw.wait(2).then(() => this.nextPair());
      return;
    }
    void this.ctx.instruct(
      this.plan.reverse ? 'jelly.echo.back' : this.plan.mode === 'echo' ? 'jelly.echo' : 'jelly.free',
    );
    if (this.plan.mode === 'echo') void this.ctx.tw.wait(2).then(() => this.nextTune());
  }

  resize(v: View) {
    this.view = v;
    const l = (this.lay = jellyLayout(v));
    const top = l.mountainBase;
    this.sky.width = v.w;
    this.sky.height = v.h;

    drawBackdrop(this.skyThings, this.mountains, this.look, l, v);

    const { x: sx, w: sw, skirt } = l.stage;
    this.stageG
      .clear()
      .roundRect(sx, top - 12, sw, 40, 18)
      .fill(wood.fill)
      .stroke({ width: 6, color: wood.line })
      .rect(sx + 18, top + 26, sw - 36, skirt)
      .fill(wood.line);
    for (let i = 0; i < 8; i++)
      this.stageG
        .rect(sx + 18 + i * ((sw - 36) / 8) + 54, top + 26, 5, skirt)
        .fill({ color: 0x000000, alpha: 0.12 });

    this.jellies.forEach((j, i) => j.position.set(l.jellies[i].x, l.jellies[i].y));
    this.again.position.set(l.again.x, l.again.y);
    this.choices.same.position.set(l.choices[0].x, l.choices[0].y);
    this.choices.different.position.set(l.choices[1].x, l.choices[1].y);
    this.ticks.position.set(l.again.x, l.again.y - 85);
    this.rewind.position.set(l.again.x - 150, l.again.y);
    this.drawRewind();
    if (this.plan.mode === 'order') {
      this.drawOrderShelf();
      this.drawOrderSlots();
      this.sleeperG.position.set(l.sleeper.x, l.sleeper.y);
      this.sleeperG.scale.set(l.scale);
      for (const item of this.orderJellies) {
        item.jelly.scale.set(l.scale);
        const dest = item.placed ? l.orderSlots[item.slot] : l.orderRow[item.rowIndex];
        item.drag.home = { ...dest };
        if (!item.drag.dragging) item.jelly.position.set(dest.x, dest.y);
      }
    }
    if (this.plan.mode === 'wake') {
      this.anywhere.clear().rect(0, 0, v.w, v.h).fill({ color: 0xffffff, alpha: 0.001 });
      this.wakeLayout();
    } else this.jellies.forEach((j) => j.scale.set(l.scale));
    this.fans.forEach((f, i) => f.position.set(l.fans[i].x, l.fans[i].y));
    this.drawGarland();
  }

  update(dt: number) {
    if (this.dead) return;
    this.clock += dt;
    const beat = music.beat();
    for (const j of this.jellies) j.update(dt, beat);
    for (const item of this.orderJellies) item.jelly.update(dt, beat);
    this.again.alpha = this.phase === 'turn' ? 1 : 0.5;
    for (const b of Object.values(this.choices)) b.alpha = this.phase === 'turn' ? 1 : 0.5;
    if (this.slotPulse > 0) {
      this.slotPulse = Math.max(0, this.slotPulse - dt);
      this.drawOrderSlots();
    }
    if (this.twinkle > 0) {
      this.twinkle = Math.max(0, this.twinkle - dt);
      this.garland.alpha = 0.75 + 0.25 * Math.cos(this.twinkle * 24);
    }
    if (this.plan.mode === 'free' && this.phase === 'play' && this.nudge.tick(dt)) {
      const j = this.jellies[this.lastJelly];
      j.hit(0.5);
      j.glow(1);
    }
  }

  /** The ghost finger on the how-to card: play the scale in free play, and in a tune round wait for the tune, then copy it. */
  autotouch(): TouchIntent | null {
    if (this.plan.mode === 'order') {
      const lineup = this.lineups[this.tunesDone] ?? null;
      const idx = orderToDrag(this.phase, lineup, this.placedCount, this.plan.length);
      if (idx === null) return null;
      const item = this.orderJellies[idx];
      const slot = this.lay.orderSlots[this.placedCount];
      if (!item || item.placed || item.drag.dragging || !slot) return null;
      return {
        drag: { on: item.jelly, y: item.jelly.belly },
        to: { on: this.ctx.stage, x: slot.x, y: slot.y },
        pause: 0.25,
      };
    }
    if (this.plan.mode === 'compare') {
      const v = verdictToTap(this.phase, this.pair);
      return v ? { tap: { on: this.choices[v] }, pause: 0.4 } : null;
    }
    const i = jellyToTap(this.plan.mode, this.phase, this.answer, this.at, this.notes, this.whichTarget);
    // A short rest: the next note belongs with this one, and a long tune round has to fit the window.
    if (i === null) return null;
    const tap = { on: this.jellies[i], y: this.jellies[i].belly };
    return this.plan.mode === 'wake' ? { tap, receiver: this.anywhere, pause: 0.15 } : { tap, pause: 0.15 };
  }

  destroy() {
    this.dead = true;
    this.clearLineup();
  }

  private tapJelly(i: number) {
    if (this.phase === 'done') return;
    this.nudge.touched();
    this.lastJelly = i;
    this.sing(i);
    this.journal.tap(i);
    if (this.plan.mode === 'compare') return; // the songs are for listening; a tap is only music
    if (this.plan.mode === 'which') {
      if (this.phase !== 'turn' || this.whichTarget === null) return;
      if (i === this.whichTarget) {
        this.jellies[i].glow(0.8);
        void this.copied();
      } else {
        void this.oopsWhich();
      }
      return;
    }
    if (this.plan.mode !== 'echo') {
      const woke =
        this.plan.mode === 'wake' ? awakeJellies(this.notes + 1).length - awakeJellies(this.notes).length : 0;
      this.notes++;
      this.setLit(Math.floor((this.notes / this.plan.goal) * BULBS));
      if (woke) this.wakeUp();
      if (this.plan.mode === 'free') this.freeTwists(i);
      if (this.notes >= this.plan.goal) void this.finale();
      return;
    }
    if (this.phase !== 'turn') return; // while the jellies sing, taps just make music
    if (i === this.answer[this.at]) {
      this.at++;
      this.drawTicks();
      if (this.at >= this.answer.length) void this.copied();
      else if (this.wrongThisTune >= 2) this.jellies[this.answer[this.at]].glow(1.2);
    } else {
      void this.oops();
    }
  }

  /** Free play's extras, none of them a goal: a name now and then, the fans answering (level 2), a scale's sparkle (level 3). */
  private freeTwists(i: number) {
    const f = this.plan.twist === 'fans' ? fanAnswering(this.notes, this.fans.length) : null;
    if (f !== null) void this.fanAnswers(f, i);
    // No name over a fan's answer or the finale.
    const line = this.namer.tap(i, f !== null || this.notes >= this.plan.goal);
    if (line) void this.ctx.say(line);
    if (this.plan.twist === 'scale' && this.scale.tap(i)) {
      this.sparkle();
      this.journal.sparkled();
    }
  }

  /** A fan sings back in its own voice, with a note in the color of the jelly she just played. */
  private async fanAnswers(f: number, jelly: number) {
    await this.ctx.tw.wait(0.25);
    const fan = this.fans[f];
    fan.hop(1);
    sfx.animal(FAN_VOICES[f]);
    this.ctx.particles.burst(fan.x, fan.y - 70, {
      kind: 'note',
      colors: [swatch[COLORS[jelly]].line],
      count: 2,
      speed: [80, 130],
      spread: 0.6,
      gravity: -40,
      size: [0.8, 1],
      life: [1, 1.3],
      spin: 1,
    });
  }

  /** A rainbow runs across the stage from the first jelly to the last, and the garland twinkles. */
  private sparkle() {
    const colors = RAINBOW.map((c) => swatch[c].fill);
    this.jellies.forEach((j, k) => {
      void this.ctx.tw.wait(k * 0.06).then(() => {
        j.glow(0.6);
        this.ctx.particles.burst(j.x, j.y - j.height * 0.9, {
          kind: 'star',
          colors,
          count: 8,
          speed: [120, 260],
          life: [0.6, 1],
        });
      });
    });
    this.twinkle = 0.8;
    sfx.sparkle();
  }

  /** Wake level: only the awake jellies show; a lone jelly stands big in the middle, then takes its place as friends join. */
  private wakeLayout() {
    const awake = awakeJellies(this.notes);
    const alone = awake.length === 1;
    const cx = this.view.w / 2;
    this.jellies.forEach((j, i) => {
      j.visible = awake.includes(i);
      j.scale.set(alone ? 1.8 * this.lay.scale : this.lay.scale);
      j.x = alone ? cx : this.lay.jellies[i].x;
    });
  }

  private wakeUp() {
    this.wakeLayout();
    const newest = awakeJellies(this.notes).at(-1)!;
    this.jellies[newest].glow(1);
    sfx.sparkle();
  }

  private sing(i: number, power = 1) {
    this.singPitch(i, this.jellies[i], power);
  }

  private singPitch(pitch: number, j: Jelly, power = 1) {
    j.hit(power);
    this.note(SET_STEPS[this.sounds][pitch]);
    this.ctx.particles.burst(j.x + (Math.random() - 0.5) * 30, j.y - j.height * 0.9, {
      kind: 'note',
      colors: [swatch[j.color].line],
      count: 1,
      speed: [90, 150],
      spread: 0.7,
      gravity: -40,
      size: [0.8, 1.05],
      life: [1, 1.4],
      spin: 1,
    });
    this.ctx.rng.pick(this.fans).hop(0.5);
  }

  /** One note on the round's instrument; `soft` scales it (the finale's chord). */
  private note(step: number, soft = 1) {
    if (this.sounds === 'bells') sfx.bell(step, 0.34 * soft);
    else if (this.sounds === 'hum') sfx.hum(step, 0.32 * soft);
    else sfx.marimba(step, 0.45 * soft);
  }

  private setLit(n: number) {
    const lit = Math.min(BULBS, n);
    if (lit === this.lit) return;
    this.lit = lit;
    this.drawGarland();
  }

  /** A string of bulbs over the stage; each one lit is a bit of progress. */
  private drawGarland() {
    const cx = this.view.w / 2;
    const { x0, x1, y, sag } = this.lay.garland;
    const g = this.garland.clear();
    g.moveTo(x0, y)
      .quadraticCurveTo(cx, y + sag * 2, x1, y)
      .stroke({ width: 4, color: this.look.string });
    for (let k = 0; k < BULBS; k++) {
      const t = (k + 0.5) / BULBS;
      const bx = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1;
      const by = (1 - t) * (1 - t) * y + 2 * (1 - t) * t * (y + sag * 2) + t * t * y;
      const on = k < this.lit;
      const color = swatch[RAINBOW[k % RAINBOW.length]];
      g.rect(bx - 6, by - 4, 12, 10).fill(this.look.string);
      if (on) g.circle(bx, by + 20, 26).fill({ color: color.fill, alpha: 0.25 });
      g.circle(bx, by + 20, 15)
        .fill(on ? color.fill : this.look.bulbOff[0])
        .stroke({ width: 4, color: on ? color.line : this.look.bulbOff[1] });
    }
  }

  // ----- Copy-the-tune mode -----

  private async nextTune() {
    this.phase = 'listen';
    this.at = 0;
    this.wrongThisTune = 0;
    const tune = drawTune(
      this.ctx.rng,
      tuneLength(this.plan, this.tunesDone),
      this.played,
      this.plan.reverse,
    );
    this.played.push(tune);
    this.tune = tune.notes;
    this.answer = answerOf(this.plan, tune.notes);
    this.drawTicks();
    if (tune.title) await this.ctx.say(tune.title);
    await this.playTune(false);
    this.phase = 'turn';
    void this.ctx.instruct(this.plan.reverse ? 'jelly.back' : 'jelly.turn');
  }

  private async playTune(slow: boolean) {
    // The listening phase's ask: the guide repeats it and the caption keeps it while the jellies play.
    await this.ctx.instruct('jelly.listen');
    await this.ctx.tw.wait(0.3);
    for (const i of this.tune) {
      this.jellies[i].glow(slow ? 0.8 : 0.5);
      this.sing(i);
      await this.ctx.tw.wait(slow ? 0.85 : 0.6);
    }
  }

  /** Backwards level, after a miss: the answer itself, last note first, slowly with each jelly glowing as it sings. */
  private async playBack() {
    await this.ctx.tw.wait(0.4);
    for (const i of this.answer) {
      this.jellies[i].glow(0.8);
      this.sing(i);
      await this.ctx.tw.wait(0.85);
    }
  }

  /** A big arrow pointing back, so "backwards" is something she can see beside the listen-again button. */
  private drawRewind() {
    this.rewind
      .clear()
      .poly([-60, 0, -10, -42, -10, -18, 60, -18, 60, 18, -10, 18, -10, 42])
      .fill(swatch.purple.fill)
      .stroke({ width: 6, color: swatch.purple.line, join: 'round' });
  }

  /** The listen-again button: the whole tune again from the top, slowly once she has needed help. Nothing is counted. */
  private async listenAgain() {
    if (this.phase !== 'turn') return;
    this.phase = 'listen';
    if (this.plan.mode === 'compare') {
      await this.playPair(false, false);
      this.phase = 'turn';
      void this.ctx.instruct('jelly.compare.ask', { a: 1, b: 2 });
      return;
    }
    if (this.plan.mode === 'which') {
      await this.playWhichNote(this.wrongThisTune >= 1);
      if (this.dead) return;
      this.phase = 'turn';
      void this.ctx.instruct('jelly.which.ask', { name: this.ctx.childName });
      return;
    }
    this.at = placeAfterMiss(this.tune.length, this.at);
    this.drawTicks();
    const help = this.wrongThisTune >= 2;
    await this.playTune(help);
    this.phase = 'turn';
    void this.ctx.instruct(this.plan.reverse ? 'jelly.back' : 'jelly.turn');
    if (help) this.jellies[this.answer[this.at]].glow(1.5);
  }

  /** Long tunes keep her place after a miss, so a row of dots ticks off the notes she has right (all empty on a restart). */
  private drawTicks() {
    const n = this.tune.length;
    this.ticks.clear();
    if (this.plan.mode !== 'echo' || this.ctx.couch || n < RESUME_FROM_LENGTH) return;
    const gap = 44;
    for (let k = 0; k < n; k++) {
      const x = (k - (n - 1) / 2) * gap;
      const done = k < this.at;
      this.ticks
        .circle(x, 0, 15)
        .fill(done ? swatch.green.fill : 0xffffff)
        .stroke({ width: 4, color: swatch.green.line });
    }
  }

  private async copied() {
    this.phase = 'listen';
    this.tunesDone++;
    this.setLit(Math.round((this.tunesDone / this.plan.goal) * BULBS));
    this.fans.forEach((f) => f.cheer());
    this.ctx.pet.cheer();
    sfx.sparkle();
    void this.ctx.say('jelly.nice');
    await this.ctx.tw.wait(1.6);
    if (this.tunesDone >= this.plan.goal) void this.finale();
    else if (this.plan.mode === 'compare') void this.nextPair();
    else if (this.plan.mode === 'which') void this.nextWhich();
    else void this.nextTune();
  }

  private async oops() {
    this.phase = 'listen';
    this.misses++;
    this.wrongThisTune++;
    if (this.wrongThisTune === 2) this.hints++;
    await this.ctx.tw.wait(0.5);
    await this.ctx.say('jelly.oops');
    this.at = placeAfterMiss(this.tune.length, this.at);
    this.drawTicks();
    const help = this.wrongThisTune >= 2;
    await this.playTune(help);
    if (this.plan.reverse) await this.playBack();
    this.phase = 'turn';
    void this.ctx.instruct(this.plan.reverse ? 'jelly.back' : 'jelly.turn');
    // After two tries, light the way: the next jelly to tap glows.
    if (help) this.jellies[this.answer[this.at]].glow(1.5);
  }

  // ----- Same-or-different mode (level 12) -----

  private async nextPair() {
    this.phase = 'listen';
    this.wrongThisTune = 0;
    this.ring.clear();
    const pair = drawPair(
      this.ctx.rng,
      this.plan.length,
      this.flags[this.tunesDone],
      this.tunesDone,
      this.played,
    );
    this.played.push(pair.base);
    this.pair = pair;
    await this.playPair(false, false);
    this.phase = 'turn';
    void this.ctx.instruct('jelly.compare.ask', { a: 1, b: 2 });
  }

  /** Both songs, one after the other, each named; `show` makes the changed jelly glow hard in each (after a miss). */
  private async playPair(slow: boolean, show: boolean) {
    const pair = this.pair!;
    for (const [n, notes] of [pair.first, pair.second].entries()) {
      await this.ctx.say('jelly.song.n', { n: n + 1 });
      await this.ctx.tw.wait(0.3);
      for (const [k, i] of notes.entries()) {
        this.jellies[i].glow(show && k === pair.changed ? 1.6 : slow ? 0.8 : 0.5);
        this.sing(i);
        await this.ctx.tw.wait(slow ? 0.85 : 0.6);
      }
      await this.ctx.tw.wait(0.5);
    }
  }

  /** A tap on "same" or "different". */
  private answerPair(v: Verdict) {
    if (this.phase !== 'turn' || !this.pair) return;
    if (v === verdictOf(this.pair)) void this.judged();
    else void this.oopsPair();
  }

  private async judged() {
    this.phase = 'listen';
    this.ring.clear();
    await this.copied();
  }

  private async oopsPair() {
    const pair = this.pair!;
    this.phase = 'listen';
    this.misses++;
    this.wrongThisTune++;
    if (this.wrongThisTune === 2) this.hints++;
    await this.ctx.tw.wait(0.5);
    await this.ctx.say('jelly.oops');
    await this.playPair(true, true);
    this.phase = 'turn';
    void this.ctx.instruct('jelly.compare.ask', { a: 1, b: 2 });
    // After two tries, light the way: a ring on the right button.
    if (this.wrongThisTune >= 2) {
      const b = this.choices[verdictOf(pair)];
      this.ring
        .clear()
        .circle(b.x, b.y, CHOICE_RADIUS + 12)
        .stroke({ width: 9, color: 0xffd23f });
    }
  }

  // ----- Which-jelly-sang mode (level 14) -----

  private applyWhichAwake(awake: readonly number[], sparkleNew: boolean) {
    const woke: number[] = [];
    this.jellies.forEach((j, i) => {
      const on = awake.includes(i);
      if (on && !j.visible) woke.push(i);
      j.visible = on;
      j.eventMode = on ? 'static' : 'none';
    });
    if (sparkleNew && woke.length) {
      sfx.sparkle();
      for (const i of woke) this.jellies[i].glow(1);
    }
  }

  private async nextWhich() {
    if (this.dead) return;
    this.phase = 'listen';
    this.wrongThisTune = 0;
    const prevAwake = this.jellies.filter((j) => j.visible).length;
    const awake = whichAwake(this.tunesDone);
    if (awake.length > prevAwake) {
      this.applyWhichAwake(awake, true);
      await this.ctx.tw.wait(0.6);
      if (this.dead) return;
    }
    this.whichTarget = drawWhich(this.ctx.rng, awake, this.whichTarget);
    await this.playWhichNote(false);
    if (this.dead) return;
    this.phase = 'turn';
    void this.ctx.instruct('jelly.which.ask', { name: this.ctx.childName });
  }

  private async playWhichNote(help: boolean) {
    if (this.dead || this.whichTarget === null) return;
    await this.ctx.tw.wait(0.3);
    if (this.dead || this.whichTarget === null) return;
    this.note(SET_STEPS[this.sounds][this.whichTarget]);
    // Neutral cue above the center of the stage so she hears a jelly sang without pointing to which one.
    this.ctx.particles.burst(this.view.w / 2, this.lay.garland.y + 75, {
      kind: 'note',
      colors: [0xffffff, 0xffd23f],
      count: 2,
      speed: [70, 120],
      spread: 0.9,
      gravity: -35,
      size: [0.85, 1.1],
      life: [0.9, 1.2],
      spin: 1,
    });
    this.fans.forEach((f) => f.hop(0.35));
    if (help) this.jellies[this.whichTarget].wiggle(0.8);
    if (this.wrongThisTune >= 2) this.jellies[this.whichTarget].glow(1.5);
    await this.ctx.tw.wait(0.65);
  }

  private async oopsWhich() {
    this.phase = 'listen';
    this.misses++;
    this.wrongThisTune++;
    if (this.wrongThisTune === 2) this.hints++;
    await this.ctx.tw.wait(0.45);
    if (this.dead) return;
    await this.ctx.say('jelly.oops');
    if (this.dead) return;
    await this.playWhichNote(true);
    if (this.dead) return;
    this.phase = 'turn';
    void this.ctx.instruct('jelly.which.ask', { name: this.ctx.childName });
  }

  // ----- Lowest-to-highest mode (level 13) -----

  private clearLineup() {
    for (const item of this.orderJellies) {
      item.drag.destroy();
      item.jelly.destroy({ children: true });
    }
    this.orderJellies = [];
  }

  private setupLineup(index: number) {
    this.clearLineup();
    this.placedCount = 0;
    this.wrongThisTune = 0;
    const lineup = this.lineups[index];
    this.orderJellies = lineup.jellies.map((entry, rowIndex) => {
      const jelly = new Jelly(entry.color, ORDER_HW, ORDER_HW * 1.55);
      const pos = this.lay.orderRow[rowIndex];
      jelly.position.set(pos.x, pos.y);
      jelly.scale.set(this.lay.scale);
      jelly.hitArea = new Rectangle(
        -ORDER_HW - HIT_PAD,
        -ORDER_HW * 1.55 - 30,
        ORDER_HW * 2 + HIT_PAD * 2,
        ORDER_HW * 1.55 + 50,
      );
      this.orderLayer.addChild(jelly);
      const item: OrderItem = {
        jelly,
        pitch: entry.pitch,
        drag: null!,
        placed: false,
        slot: -1,
        rowIndex,
      };
      item.drag = draggable(jelly, this.ctx.tw, {
        onPick: () => {
          if (this.dead || this.phase !== 'turn') return;
          this.singPitch(item.pitch, item.jelly);
        },
        onDrop: (x, y) => this.dropOrder(item, x, y),
      });
      return item;
    });
    this.phase = 'turn';
    this.drawOrderShelf();
    this.drawOrderSlots();
    this.drawSleeper(lineup.sleeper);
  }

  private drawOrderShelf() {
    const slots = this.lay.orderSlots;
    if (this.plan.mode !== 'order' || !slots.length) return;
    const s = this.lay.scale;
    const left = slots[0].x - (ORDER_HW + 24) * s;
    const right = slots[slots.length - 1].x + (ORDER_HW + 24) * s;
    const y = slots[0].y;
    this.orderShelf
      .clear()
      .roundRect(left, y - 8 * s, right - left, 24 * s, 12 * s)
      .fill(wood.fill)
      .stroke({ width: 5, color: wood.line });
  }

  private drawOrderSlots() {
    const g = this.orderSlots.clear();
    if (this.plan.mode !== 'order') return;
    const s = this.lay.scale;
    const r = ORDER_SLOT_RADIUS * s;
    this.lay.orderSlots.forEach((p, k) => {
      const lit = k === this.placedCount && this.phase === 'turn';
      const filled = k < this.placedCount;
      const cy = p.y - 40 * s;
      if (lit) {
        const ringR = r + (this.slotPulse > 0 ? 14 : 8);
        g.circle(p.x, cy, ringR).fill({ color: 0xffd23f, alpha: 0.25 });
      }
      g.circle(p.x, cy, r)
        .fill({ color: filled ? 0xfff8e6 : 0xffffff, alpha: lit ? 0.55 : filled ? 0.25 : 0.2 })
        .stroke({
          width: lit ? 6 : 4,
          color: lit ? 0xffd23f : filled ? swatch.green.line : wood.line,
        });
    });
  }

  private drawSleeper(color: ColorName) {
    const g = this.sleeperG.clear();
    if (this.plan.mode !== 'order') return;
    const hw = 52;
    const h = 68;
    const sw = swatch[color];
    g.position.set(this.lay.sleeper.x, this.lay.sleeper.y);
    g.scale.set(this.lay.scale);
    domePath(g, hw, h)
      .fill({ color: sw.fill, alpha: 0.85 })
      .stroke({ width: 5, color: sw.line, join: 'round' });
    // Closed sleepy eyes and soft cheeks.
    for (const side of [-1, 1]) {
      const ex = side * hw * 0.3;
      const ey = -h * 0.45;
      g.moveTo(ex - 9, ey)
        .quadraticCurveTo(ex, ey + 7, ex + 9, ey)
        .stroke({ width: 4, color: ink, cap: 'round' });
      g.ellipse(side * hw * 0.52, -h * 0.3, hw * 0.12, h * 0.06).fill({ color: cheek, alpha: 0.45 });
    }
    // Little "z"s floating above the sleeping jelly.
    for (const [zx, zy, sz] of [
      [18, -h - 14, 10],
      [34, -h - 32, 13],
    ]) {
      g.moveTo(zx, zy)
        .lineTo(zx + sz, zy)
        .lineTo(zx, zy + sz)
        .lineTo(zx + sz, zy + sz)
        .stroke({ width: 3, color: sw.line, cap: 'round', join: 'round' });
    }
  }

  private slotAt(x: number, y: number): number | null {
    const s = this.lay.scale;
    let best: number | null = null;
    let bestD = Infinity;
    for (let k = 0; k < this.lay.orderSlots.length; k++) {
      const p = this.lay.orderSlots[k];
      if (Math.abs(x - p.x) > 90 * s || y < p.y - 115 * s || y > p.y + 95 * s) continue;
      const d = Math.hypot(x - p.x, y - p.y);
      if (d < bestD) {
        bestD = d;
        best = k;
      }
    }
    return best;
  }

  private lockOrderJelly(item: OrderItem, slot: number, duration: number) {
    item.placed = true;
    item.slot = slot;
    item.drag.destroy();
    onTap(
      item.jelly,
      () => {
        if (!this.dead && this.phase !== 'done') this.singPitch(item.pitch, item.jelly);
      },
      { cooldown: 90 },
    );
    const dest = this.lay.orderSlots[slot];
    item.drag.home = { ...dest };
    void this.ctx.tw.to(item.jelly, { x: dest.x, y: dest.y }, { duration });
  }

  private dropOrder(item: OrderItem, x: number, y: number): boolean {
    if (this.dead || this.phase !== 'turn' || item.placed || item.drag.tapped) return false;
    const hitSlot = this.slotAt(x, y);
    if (hitSlot === null) return false;
    if (hitSlot !== this.placedCount) {
      sfx.tick();
      this.slotPulse = 0.6;
      this.drawOrderSlots();
      return false;
    }
    const lineup = this.lineups[this.tunesDone];
    const targetIndex = lineup.byPitch[this.placedCount];
    const targetPitch = lineup.jellies[targetIndex].pitch;
    if (item.pitch !== targetPitch) {
      this.misses++;
      this.wrongThisTune++;
      if (this.wrongThisTune === 2) this.hints++;
      const dir = orderDirection(item.pitch, targetPitch);
      if (dir) void this.ctx.say('jelly.order.dir', { dir });
      if (this.wrongThisTune >= 2) this.orderJellies[targetIndex].jelly.glow(1.5);
      return false;
    }
    this.lockOrderJelly(item, this.placedCount, 0.16);
    this.placedCount++;
    this.wrongThisTune = 0;
    this.drawOrderSlots();
    if (this.placedCount >= this.plan.length - 1) void this.finishLineup();
    else void this.ctx.instruct('jelly.order.next', { spot: this.placedCount + 1 });
    return true;
  }

  private async finishLineup() {
    this.phase = 'listen';
    const lastSlot = this.plan.length - 1;
    const last = this.orderJellies.find((o) => !o.placed);
    if (last) this.lockOrderJelly(last, lastSlot, 0.28);
    this.placedCount = this.plan.length;
    this.drawOrderSlots();
    await this.ctx.tw.wait(0.35);
    if (this.dead) return;
    const inOrder = [...this.orderJellies].sort((a, b) => a.slot - b.slot);
    for (const o of inOrder) {
      o.jelly.glow(0.45);
      this.singPitch(o.pitch, o.jelly);
      await this.ctx.tw.wait(0.32);
      if (this.dead) return;
    }
    this.tunesDone++;
    this.setLit(Math.round((this.tunesDone / this.plan.goal) * BULBS));
    this.fans.forEach((f) => f.cheer());
    this.ctx.pet.cheer();
    sfx.sparkle();
    void this.ctx.say('jelly.nice');
    await this.ctx.tw.wait(1.3);
    if (this.dead) return;
    if (this.tunesDone >= this.plan.goal) void this.finale();
    else {
      this.setupLineup(this.tunesDone);
      void this.ctx.instruct('jelly.order', { name: this.ctx.childName });
    }
  }

  /** The song is done: a run up the scale, a big chord, and the crowd goes wild. */
  private async finale() {
    this.phase = 'done';
    this.drawOrderSlots();
    await this.ctx.tw.wait(0.4);
    if (this.dead) return;
    if (this.plan.mode === 'order') {
      const inOrder = [...this.orderJellies].sort((a, b) => a.slot - b.slot);
      for (const o of inOrder) {
        this.singPitch(o.pitch, o.jelly);
        await this.ctx.tw.wait(0.14);
        if (this.dead) return;
      }
      await this.ctx.tw.wait(0.2);
      if (this.dead) return;
      for (const o of inOrder) o.jelly.hit(1.4);
    } else {
      for (let i = 0; i < this.jellies.length; i++) {
        this.sing(i);
        await this.ctx.tw.wait(0.14);
        if (this.dead) return;
      }
      await this.ctx.tw.wait(0.2);
      if (this.dead) return;
      this.jellies.forEach((j) => j.hit(1.4));
    }
    // Two thirds of a full note: the marimba keeps its old chord gain of 0.3.
    [0, 2, 3, 5].forEach((s) => this.note(s, 2 / 3));
    this.fans.forEach((f) => f.cheer());
    this.ctx.pet.cheer();
    const colors = RAINBOW.map((c) => swatch[c].fill);
    this.ctx.particles.burst(this.view.w / 2, 120, {
      kind: 'confetti',
      colors,
      count: 60,
      speed: [200, 600],
      gravity: 600,
      life: [1.2, 2],
    });
    sfx.tada();
    await this.ctx.tw.wait(1.6);
    if (this.dead) return;
    const found = this.journal.keys().map((k) => entryId('jelly-drums', k));
    this.ctx.finish({
      misses: this.misses,
      hints: this.hints,
      ...(found.length ? { discoveries: found } : {}),
    });
  }
}

/** The hub's little stage: three jellies bobbing to the music, one singing now and then. */
class JellyStand extends Container {
  private readonly jellies: Jelly[];
  private next = 1;

  constructor() {
    super();
    const riser = new Graphics()
      .roundRect(-160, -20, 320, 34, 14)
      .fill(wood.fill)
      .stroke({ width: 6, color: wood.line })
      .rect(-146, 12, 292, 20)
      .fill(wood.line);
    this.jellies = [0, 1, 2].map((i) => {
      const c = pitchColor(i, 3);
      const hw = 54 - i * 7;
      const j = new Jelly(c, hw, hw * 1.55);
      j.position.set(-98 + i * 98, -10);
      return j;
    });
    this.addChild(riser, ...this.jellies);
  }

  update(dt: number) {
    const beat = music.beat();
    for (const j of this.jellies) j.update(dt, beat);
    this.next -= dt;
    if (this.next <= 0) {
      this.next = 0.9 + Math.random() * 1.4;
      this.jellies[Math.floor(Math.random() * this.jellies.length)].hit(0.6);
    }
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const color = rng.pick(COLORS);
  const c = new Container();
  const j = new Jelly(color, 70, 108);
  j.update(0, 0.5);
  const note = musicNote(new Graphics(), 64, swatch[rng.pick(COLORS.filter((x) => x !== color))].line);
  note.position.set(78, -130);
  c.addChild(j, note);
  return c;
}

export const jellyDrums: GameModule = {
  id: 'jelly-drums',
  name: 'Jelly Drums',
  titleLine: 'game.jelly-drums',
  region: 'music-mountain',
  challenge: 'music',
  skills: ['cause-effect', 'rhythm', 'sequence-memory'],
  bands: ['lap', 'toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  entryLevels: [10, 14],
  describeLevel: (level) => {
    const p = planFor(level);
    if (p.reverse)
      return `Copy a ${p.length}-note tune backwards, ${p.goal} tunes (the last is ${p.lastLength} notes)`;
    if (p.mode === 'compare') return `Are two ${p.length}-note songs the same or different? ${p.goal} pairs`;
    if (p.mode === 'order') return `Line up ${p.length} jellies from lowest to highest, ${p.goal} line-ups`;
    if (p.mode === 'which') return `Listen to one note and tap which jelly sang, ${p.goal} sounds`;
    if (p.mode === 'wake') return `One big jelly, then friends wake, any touch sings, ${p.goal} notes`;
    return p.mode === 'free' ? `Free play, ${p.goal} notes` : `Copy a ${p.length}-note tune, ${p.goal} tunes`;
  },
  music: silenced(STYLES.jelly),
  coplayHint:
    'Sing along! Big jellies sing low, little jellies sing high. Hum the low one, then the high one, and see if {name} plays it.',
  offScreen: {
    all: 'Make a pots-and-pans band: big pot, low sound; small pot, high sound.',
    // School: a build or test with a result, predicting first.
    school:
      'Line up pots by size and guess which one will sound lowest before you tap it. Then play a tune from low to high.',
  },
  hubIcon: () => new JellyStand(),
  touchDemo: true,
  upright: true,
  sticker,
  create: (ctx) => new JellyDrums(ctx),
};
