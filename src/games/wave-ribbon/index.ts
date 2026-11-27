/**
 * Wave Ribbon: send one smooth pulse along a stretched ribbon and watch a bead on its post rise and settle back in place while
 * the crest travels on to a flag. Level 1 watches a pulse (Send, Replay, Step); level 2 sends a small and a tall one, then
 * picks the pictured bead trace that matches the height asked for and Checks it. Sending, replaying, stepping and trying
 * either height are never misses; only a Check of a wrong picture at level 2 is. Rules: ./logic.ts;
 * definition: docs/definitions/wave-ribbon.md.
 */
import { Container, Graphics, Rectangle } from 'pixi.js';
import { swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { againIcon, checkIcon, magnifierIcon, nextIcon, playIcon } from '../../ui/icons';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { cardArt, handIcon, pennant, pulseIcon, ribbonPicture, stickerArt } from './art';
import { waveLayout, type Pt, type WaveLayout } from './layout';
import {
  AMPLITUDES,
  ARRIVAL_STEP,
  DT_STEP,
  GLOW_AFTER,
  HelpTally,
  LEVELS,
  L_RIBBON,
  PEAK_STEP,
  STEP_COUNT,
  T_ARRIVE,
  T_PEAK,
  T_RUN,
  X_FLAG,
  X_MARKER,
  checkCard,
  describeLevel,
  doneReady,
  emptySeen,
  frameAt,
  makeRound,
  markerState,
  nextHelp,
  nextMove,
  noteTime,
  planFor,
  rightCard,
  sampleRibbon,
  unwatched,
  watched,
  type CardId,
  type LevelPlan,
  type Preset,
  type Round,
  type Seen,
} from './logic';

class WaveRibbon implements Game {
  readonly plan: LevelPlan;
  readonly round: Round;
  readonly tally = new HelpTally();
  seen: Seen = emptySeen();
  /** The height the next Send launches, and the playhead: seconds into the run, 0 when the ribbon is flat. */
  preset: Preset;
  t = 0;
  playing = false;
  /** The other height she last ran, drawn faint beside the one on the bench (level 2). */
  private prev: Preset | null = null;
  picked: CardId | null = null;
  checked = false;
  private lastWrong: CardId | null = null;
  misses = 0;
  finished = false;
  private ran = false;
  private started = false;
  private alive = true;
  private clock = 0;
  private glowAt: Pt | null = null;
  private pulsed = { peak: false, arrival: false };
  layout!: WaveLayout;

  private readonly background = new Graphics();
  private readonly board = new Graphics();
  private readonly glow = new Graphics();
  private readonly badge = new Container();
  readonly cardNodes: Container[] = [];
  readonly sendButton: RoundButton;
  readonly replayButton: RoundButton;
  readonly stepButton: RoundButton;
  readonly helpButton: RoundButton;
  readonly doneButton: RoundButton;
  readonly checkButton: RoundButton | null = null;
  readonly presetButtons: Partial<Record<Preset, RoundButton>> = {};

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.round = makeRound(this.plan, ctx.rng);
    this.preset = this.plan.presets[0];
    for (const g of [this.background, this.board, this.glow, this.badge]) g.eventMode = 'none';
    ctx.stage.addChild(this.background, this.board);
    this.sendButton = new RoundButton(playIcon(), swatch.green, 50, () => this.send());
    this.replayButton = new RoundButton(againIcon(), swatch.blue, 50, () => this.replay());
    this.stepButton = new RoundButton(nextIcon(0xffffff), swatch.purple, 50, () => this.step());
    this.helpButton = new RoundButton(handIcon(), swatch.orange, 50, () => this.help());
    this.doneButton = new RoundButton(checkIcon(), swatch.green, 50, () => this.done());
    ctx.stage.addChild(this.sendButton, this.replayButton, this.stepButton, this.helpButton, this.doneButton);
    if (this.plan.check) {
      this.checkButton = new RoundButton(magnifierIcon(), swatch.yellow, 50, () => this.check());
      ctx.stage.addChild(this.checkButton);
      for (const p of this.plan.presets) {
        const b = new RoundButton(pulseIcon(p), swatch.teal, 50, () => this.choose(p));
        this.presetButtons[p] = b;
        ctx.stage.addChild(b);
      }
      this.badge.addChild(
        new Graphics()
          .circle(0, 0, 46)
          .fill(swatch.purple.light)
          .stroke({ width: 5, color: swatch.purple.line }),
      );
      const pic = pulseIcon(this.round.target);
      pic.tint = swatch.purple.line;
      pic.scale.set(0.8);
      this.badge.addChild(pic);
      ctx.stage.addChild(this.badge);
      this.round.cards.forEach((id, i) => {
        const node = new Container();
        const { w, h } = waveLayout(ctx.view, true).card;
        node.hitArea = new Rectangle(-w / 2, -h / 2, w, h);
        onTap(node, () => this.pick(id), { cooldown: 150 });
        this.cardNodes[i] = node;
        ctx.stage.addChild(node);
      });
    }
    ctx.stage.addChild(this.glow);
    this.layout = waveLayout(ctx.view, this.plan.check);
  }

  get hints() {
    return this.tally.count;
  }

  private get amp() {
    return AMPLITUDES[this.preset];
  }

  /** Both heights watched, which is when the cards unlock. */
  private get unlocked() {
    return watched(this.seen, 'small') && watched(this.seen, 'tall');
  }

  // ---- Running the ribbon ----

  /** Launches a pulse of the chosen height from the driver. */
  send() {
    if (this.finished) return;
    this.t = 0;
    this.playing = true;
    this.ran = true;
    this.pulsed = { peak: false, arrival: false };
    this.glowAt = null;
    sfx.pluck(5);
  }

  replay() {
    if (this.finished) return;
    if (!this.ran) {
      this.glowAt = { ...this.layout.send };
      void this.ctx.say('wave-ribbon.observe-first');
      return;
    }
    this.send();
  }

  /** One frame forward (a quarter second); after the last it starts again from flat. */
  step() {
    if (this.finished) return;
    const next = frameAt(this.t) + 1;
    this.playing = false;
    this.ran = true;
    this.t = next > STEP_COUNT ? 0 : next * DT_STEP;
    if (this.t === 0) this.pulsed = { peak: false, arrival: false };
    this.glowAt = null;
    sfx.tick();
    this.noteFrame();
  }

  /** Switches the height she will send: the ribbon goes flat, and the one she ran is kept as the faint comparison. */
  choose(p: Preset) {
    if (this.finished || p === this.preset) return;
    if (this.plan.check && (this.t > 0 || watched(this.seen, this.preset))) this.prev = this.preset;
    this.preset = p;
    this.t = 0;
    this.playing = false;
    this.pulsed = { peak: false, arrival: false };
    this.glowAt = null;
    sfx.tick();
  }

  /** Marks what the playhead has shown, and sounds the moments: the bead at its highest, the crest at the flag. */
  private noteFrame() {
    noteTime(this.seen, this.preset, this.t);
    if (!this.pulsed.peak && this.t >= T_PEAK - 1e-9) {
      this.pulsed.peak = true;
      sfx.marimba(7, 0.4);
    }
    if (!this.pulsed.arrival && this.t >= T_ARRIVE - 1e-9) {
      this.pulsed.arrival = true;
      sfx.bell(11, 0.3);
    }
  }

  // ---- Cards, Check, Help and Done ----

  pick(id: CardId) {
    if (this.finished) return;
    if (!this.unlocked) {
      this.glowAt = { ...this.layout[unwatched(this.seen)] };
      void this.ctx.say('wave-ribbon.need-both');
      return;
    }
    this.picked = id;
    this.checked = false;
    this.glowAt = null;
    sfx.tick();
    this.drawCards();
  }

  /** A Check: waits on both pulses watched and a card picked (neither is a miss); a wrong picture is the only miss. */
  check() {
    if (this.finished || !this.plan.check) return;
    const r = checkCard(this.plan, this.seen, this.round, this.picked);
    if (r.kind === 'need-both') {
      this.glowAt = { ...this.layout[unwatched(this.seen)] };
      void this.ctx.say('wave-ribbon.need-both');
      return;
    }
    if (r.kind === 'pick-card') {
      void this.ctx.say('wave-ribbon.pick-card');
      return;
    }
    if (r.kind === 'right') {
      if (!this.checked) {
        sfx.bell(11, 0.3);
        this.ctx.pet.cheer();
      }
      this.checked = true;
      this.glowAt = { ...this.layout.done };
      void this.ctx.say('wave-ribbon.ready-done');
      return;
    }
    // A wrong picture: one miss (not again for the same unchanged choice), the pulse she was asked about runs again.
    if (this.lastWrong !== r.card) this.misses++;
    this.lastWrong = r.card;
    sfx.boing();
    this.choose(this.round.target);
    this.send();
    this.ran = true;
    if (this.misses >= GLOW_AFTER) {
      this.tally.give('pick-trace');
      this.glowAt = { ...this.layout.cards[this.round.cards.indexOf(rightCard(this.round.target))] };
    }
    void this.ctx.say(r.card === 'sideways' ? 'wave-ribbon.wrong-sideways' : 'wave-ribbon.wrong-height');
  }

  help() {
    if (this.finished) return;
    const id = this.plan.check && this.checked ? null : nextHelp(this.plan, this.seen);
    if (!id) {
      this.glowAt = { ...(this.plan.check && !this.checked ? this.layout.check : this.layout.done) };
      void this.ctx.say(
        this.plan.check && !this.checked ? 'wave-ribbon.pick-card' : 'wave-ribbon.ready-done',
      );
      return;
    }
    this.tally.give(id);
    if (id === 'send-pulse') {
      this.send();
      void this.ctx.say('wave-ribbon.observe-first');
    } else if (id === 'run-both') {
      const want = unwatched(this.seen);
      this.choose(want);
      this.send();
      void this.ctx.say('wave-ribbon.need-both');
    } else {
      this.glowAt = { ...this.layout.cards[this.round.cards.indexOf(rightCard(this.round.target))] };
      void this.ctx.say('wave-ribbon.pick-card');
    }
  }

  askForHint() {
    this.help();
  }

  private done() {
    if (this.finished) return;
    if (!doneReady(this.plan, this.seen, this.checked)) {
      // Not yet: say what is left and point at it. Never a miss.
      if (!this.plan.check) {
        this.glowAt = { ...this.layout.send };
        void this.ctx.say('wave-ribbon.observe-first');
      } else if (!this.unlocked) {
        this.glowAt = { ...this.layout[unwatched(this.seen)] };
        void this.ctx.say('wave-ribbon.need-both');
      } else {
        this.glowAt = { ...this.layout.check };
        void this.ctx.say('wave-ribbon.pick-card');
      }
      return;
    }
    this.finished = true;
    this.glowAt = null;
    sfx.sparkle();
    this.ctx.pet.cheer();
    void this.ctx.tw
      .wait(0.6)
      .then(() => this.alive && this.ctx.finish({ misses: this.misses, hints: this.tally.count }));
  }

  restart() {
    if (this.finished) return;
    this.seen = emptySeen();
    this.t = 0;
    this.playing = false;
    this.ran = false;
    this.prev = null;
    this.picked = null;
    this.checked = false;
    this.lastWrong = null;
    this.preset = this.plan.presets[0];
    this.pulsed = { peak: false, arrival: false };
    this.glowAt = null;
    this.drawCards();
  }

  // ---- Drawing ----

  private ribbonPoints(t: number, amp: number) {
    const L = this.layout;
    return sampleRibbon(t, amp).map((p) => ({ x: L.ribbonX + p.x, y: L.restY - p.dy }));
  }

  private drawBoard() {
    const L = this.layout,
      g = this.board.clear();
    const { ribbon, bead } = this.round;
    // The tie-post at the far end, the driver, the bead's dotted post and the pennant.
    g.roundRect(L.ribbonX + L_RIBBON - 4, L.restY - 40, 16, 80, 6).fill(swatch.brown.fill);
    g.roundRect(L.ribbonX - 26, L.restY - 36, 24, 72, 10)
      .fill(this.playing && this.t < 0.3 ? swatch.yellow.fill : swatch.teal.fill)
      .stroke({ width: 4, color: swatch.teal.line });
    for (let y = L.restY - 100; y < L.restY + 36; y += 16)
      g.moveTo(L.ribbonX + X_MARKER, y).lineTo(L.ribbonX + X_MARKER, y + 8);
    g.stroke({ width: 4, color: swatch.brown.light, cap: 'round' });
    const arrived = this.t >= T_ARRIVE - 1e-9;
    // A faint copy of the other height's ribbon at the same moment, for comparing (level 2).
    if (this.prev && this.prev !== this.preset) {
      const pts = this.ribbonPoints(this.t, AMPLITUDES[this.prev]);
      for (let i = 0; i + 1 < pts.length; i += 2)
        g.moveTo(pts[i].x, pts[i].y).lineTo(pts[i + 1].x, pts[i + 1].y);
      g.stroke({ width: 6, color: swatch.brown.light, cap: 'round' });
    }
    // Trail dots: where the bead has been on its post this run.
    for (let k = 0; k <= frameAt(this.t); k++) {
      const m = markerState(k * DT_STEP, this.amp);
      g.circle(L.ribbonX + m.x, L.restY - m.dy, 7).fill({ color: swatch[bead].light, alpha: 0.9 });
    }
    const pts = this.ribbonPoints(this.t, this.amp);
    g.moveTo(pts[0].x, pts[0].y);
    for (const p of pts.slice(1)) g.lineTo(p.x, p.y);
    g.stroke({ width: 12, color: swatch[ribbon].fill, cap: 'round', join: 'round' });
    const m = markerState(this.t, this.amp);
    g.circle(L.ribbonX + m.x, L.restY - m.dy, 20)
      .fill(swatch[bead].fill)
      .stroke({ width: 6, color: swatch[bead].line });
    g.circle(L.ribbonX + m.x, L.restY - m.dy, 7).fill(0xffffff);
    pennant(g, L.ribbonX + X_FLAG, L.restY + 40, arrived, swatch.red.fill);
    this.drawRuler(g);
  }

  /** The frozen time ruler: a tick for every frame, the one showing now filled, the flag's frame stamped once reached. */
  private drawRuler(g: Graphics) {
    const L = this.layout,
      y = L.restY + 78,
      now = frameAt(this.t);
    for (let k = 0; k <= STEP_COUNT; k++) {
      const x = L.ribbonX + (L_RIBBON * k) / STEP_COUNT;
      g.moveTo(x, y - 10)
        .lineTo(x, y + 10)
        .stroke({
          width: k === now ? 8 : 3,
          color: k === now ? swatch.blue.line : swatch.brown.light,
          cap: 'round',
        });
    }
    g.moveTo(L.ribbonX, y)
      .lineTo(L.ribbonX + L_RIBBON, y)
      .stroke({ width: 3, color: swatch.brown.light });
    if (this.t >= T_ARRIVE - 1e-9) {
      const x = L.ribbonX + (L_RIBBON * ARRIVAL_STEP) / STEP_COUNT;
      g.poly([x, y - 14, x + 26, y - 24, x, y - 34]).fill(swatch.red.fill);
      g.moveTo(x, y - 14)
        .lineTo(x, y + 12)
        .stroke({ width: 5, color: swatch.red.line, cap: 'round' });
    }
    if (this.t >= T_PEAK - 1e-9) {
      const x = L.ribbonX + (L_RIBBON * PEAK_STEP) / STEP_COUNT;
      g.circle(x, y + 22, 7).fill(swatch[this.round.bead].fill);
    }
  }

  private drawCards() {
    const L = this.layout;
    this.round.cards.forEach((id, i) => {
      const node = this.cardNodes[i];
      if (!node) return;
      node.removeChildren().forEach((c) => c.destroy({ children: true }));
      const art = cardArt(id, L.card.w, L.card.h, this.picked === id);
      art.alpha = this.unlocked ? 1 : 0.55;
      node.addChild(art);
    });
  }

  // ---- Game ----

  start() {
    this.started = true;
    this.drawCards();
    void this.ctx.instruct(this.plan.check ? 'wave-ribbon.instruct.2' : 'wave-ribbon.instruct.1');
  }

  update(dt: number) {
    this.clock += dt;
    if (this.playing) {
      this.t = Math.min(T_RUN, this.t + dt);
      if (this.t >= T_RUN) this.playing = false;
    }
    if (this.started) {
      const before = this.unlocked;
      this.noteFrame();
      if (this.unlocked !== before || (this.plan.check && this.unlocked)) this.drawCards();
    }
    this.drawBoard();
    this.doneButton.alpha = doneReady(this.plan, this.seen, this.checked) ? 1 : 0.55;
    this.replayButton.alpha = this.ran ? 1 : 0.55;
    for (const p of this.plan.presets) {
      const b = this.presetButtons[p];
      if (b) b.scale.set(p === this.preset ? 1.12 : 1);
    }
    const g = this.glow.clear();
    if (this.plan.check) this.checkButton!.alpha = this.picked ? 1 : 0.7;
    const at = this.glowAt;
    if (at)
      g.circle(at.x, at.y, 66).stroke({
        width: 8,
        color: swatch.yellow.line,
        alpha: 0.6 + 0.4 * Math.sin(this.clock * 4),
      });
  }

  resize(v: View) {
    this.layout = waveLayout(v, this.plan.check);
    const L = this.layout;
    this.background.clear().rect(0, 0, v.w, v.h).fill(0xeaf6ff);
    this.background
      .roundRect(L.bench.x, L.bench.y, L.bench.w, L.bench.h, 36)
      .fill(0xfbfdff)
      .stroke({ width: 4, color: swatch.blue.light });
    this.sendButton.position.copyFrom(L.send);
    this.replayButton.position.copyFrom(L.replay);
    this.stepButton.position.copyFrom(L.step);
    this.helpButton.position.copyFrom(L.help);
    this.doneButton.position.copyFrom(L.done);
    this.checkButton?.position.copyFrom(L.check);
    this.presetButtons.small?.position.copyFrom(L.small);
    this.presetButtons.tall?.position.copyFrom(L.tall);
    this.badge.position.copyFrom(L.badge);
    this.cardNodes.forEach((n, i) => n.position.copyFrom(L.cards[i]));
    this.glowAt = null;
    this.drawCards();
  }

  /** The ghost finger: send the height she has not watched, pick the matching picture, Check, then Done. */
  autotouch(): TouchIntent | null {
    if (this.finished || !this.started) return null;
    const move = nextMove(
      this.plan,
      this.seen,
      this.round,
      this.picked,
      this.checked,
      this.preset,
      this.playing,
    );
    if (!move) return null;
    if ('done' in move) return { tap: { on: this.doneButton } };
    if ('send' in move) return { tap: { on: this.sendButton } };
    if ('preset' in move) {
      const b = this.presetButtons[move.preset];
      return b ? { tap: { on: b } } : null;
    }
    if ('card' in move) return { tap: { on: this.cardNodes[this.round.cards.indexOf(move.card)] } };
    return this.checkButton ? { tap: { on: this.checkButton } } : null;
  }

  destroy() {
    this.alive = false;
  }
}

export const waveRibbon: GameModule = {
  id: 'wave-ribbon',
  name: 'Wave Ribbon',
  titleLine: 'game.wave-ribbon',
  region: 'tinker-lab',
  challenge: 'noticing',
  skills: ['waves', 'cause-and-effect', 'observation'],
  bands: ['school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel,
  music: STYLES.paint,
  touchDemo: true,
  upright: true,
  coplayHint:
    'Before tapping Send, one of you points to where the bead will be when the wave reaches the flag, then watch together and swap.',
  hubIcon: () => new WigglyIcon(ribbonPicture()),
  sticker: (seed) => stickerArt(seed),
  create: (ctx) => new WaveRibbon(ctx),
};
