/**
 * Sprout Shuffle level 5, Hidden Sprouts. A spotted plant's tray is covered by a seed packet; she waters it beside a
 * plain plant whose copies are known, its sprouts grow onto a record card, and she chooses every pair of copies that
 * could have made them. Three spotted sprouts leave both; a plain sprout rules out two spot copies; six spotted sprouts
 * still leave both, and "we can't tell yet" is the right answer. Level 6 first asks which known plant to grow it with:
 * the spotted one makes spotted every way and can't tell, the plain one grows the record. The rules: ./logic.ts;
 * definition: docs/definitions/hidden-sprouts.md (G6, levels 5 and 6).
 */
import { Container, Graphics } from 'pixi.js';
import { swatch, type ColorName } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import { spread, type View } from '../../engine/view';
import { RoundButton } from '../../ui/buttons';
import type { Game, GameContext, TouchIntent } from '../types';
import type { LineId } from '../../content/voice-script';
import {
  benchArt,
  BUD_H,
  BUD_W,
  BudCard,
  CAN_R,
  canArt,
  cantTellArt,
  CARD,
  CHECK_R,
  ChoiceCard,
  copiesPic,
  coverArt,
  leafArt,
  PACKET_R,
  packetArt,
  plantArt,
  RECORD_H,
  recordArt,
  slotX,
  Sprout,
  testerArt,
  tileArt,
} from './art';
import {
  CANDIDATES,
  candidates,
  cantTellSprouts,
  couldTell,
  checkCandidates,
  drawSprout,
  GENOTYPES,
  hiddenNextStep,
  hiddenSetupFor,
  looks,
  pickStep,
  routes,
  testerRecord,
  tryRoom,
  type Candidate,
  type Genotype,
  type HiddenPhase,
  type HiddenSetup,
  type HiddenVerdict,
  type Look,
  type Tester,
} from './logic';

const TOP = 100;
const PLANT_H = 160;
const TRAY_TILE = 72;
const FAN_GAP = 16;
const SPROUT_H = 112;
/** Level 6's waiting testers stand on the bench at this scale. */
const BENCH_S = 0.62;

interface Grow {
  sprout: Sprout;
  look: Look;
  p: { v: number };
}

export class SproutHidden implements Game {
  readonly setup: HiddenSetup;
  /** Level 6: she picks the tester from the bench first. */
  readonly picking: boolean;
  phase: HiddenPhase;
  /** Level 6: the bench tester standing in the right pot, if any. */
  potted: Tester | null = null;
  /** Level 6: the bench's testers, one art each, in the setup's bench order. */
  readonly benchPlants: { key: Tester; art: Container }[] = [];
  private readonly bench = benchArt(2 * CARD + 90);
  /** Every sprout on the record card, left to right: the waterings' and any Try one draws. */
  record: Look[] = [];
  misses = 0;
  hints = 0;
  /** Wrong Checks in the current choice task; the second one glows. */
  wrong = 0;
  private readonly glowHintedIn = new Set<HiddenPhase>();
  private readonly showMeIn = new Set<HiddenPhase>();
  /** How many Try one draws she made; never counted toward anything. */
  tries = 0;
  busy = false;
  finished = false;
  private alive = true;
  private clock = 0;
  private view: View;
  private lastInstruction: LineId = 'sprout.hidden-intro';

  private readonly backdrop: Backdrop;
  private readonly board = new Container();
  private readonly hiddenPlant: Container;
  private readonly testerPlant: Container;
  private readonly hiddenTiles: Container[];
  private readonly testerTiles: Container[];
  readonly cover: Container;
  private readonly banner: Container;
  canButton: RoundButton;
  tryButton: RoundButton;
  private readonly recordCard = new Container();
  private readonly glowLayer = new Graphics();
  sprouts: Sprout[] = [];
  private grows: Grow[] = [];
  private budGrows: { card: BudCard; look: Look; p: { v: number } }[] = [];
  cards: ChoiceCard<Candidate>[] = [];
  checkButton: RoundButton;
  chosen = new Set<Candidate>();
  /** The open fan: a candidate's four ways with the tester (at level 6's spotted tester, both candidates' side by side), over the plants. */
  fanOf: readonly Candidate[] | null = null;
  private budLooks: Look[] = [];
  readonly fanPanel = new Graphics();
  private readonly fan = new Container();
  buds: BudCard[] = [];
  private glowBuds = new Set<number>();
  private glowSlots = new Set<number>();
  /** After two wrong Checks in a task the fitting cards glow until chosen. */
  private glowCards = false;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.setup = hiddenSetupFor(ctx.rng, ctx.level);
    const s = this.setup;
    this.picking = s.bench.length > 0;
    this.phase = this.picking ? 'pick' : 'water1';
    this.lastInstruction = this.picking ? 'sprout.tester-intro' : 'sprout.hidden-intro';
    this.backdrop = new Backdrop(
      {
        sky: [0xc4ecff, 0xfff6e0],
        hills: [0xf5d0e6, 0xbfe39a, 0x9ad77e],
        horizon: 0.42,
        clouds: 3,
        sun: false,
        seed: 131,
      },
      ctx.view,
    );
    ctx.stage.addChild(this.backdrop, this.board);
    onTap(this.backdrop, () => this.repeat(), { cooldown: 1200 });

    this.hiddenPlant = plantArt('spotted', s.colors[0], PLANT_H);
    this.testerPlant = plantArt(looks(s.tester), s.colors[1], PLANT_H);
    this.hiddenPlant.eventMode = this.testerPlant.eventMode = 'none';
    this.hiddenTiles = s.hidden.map((c) => tileArt(c, TRAY_TILE));
    this.testerTiles = s.tester.map((c) => tileArt(c, TRAY_TILE));
    for (const t of [...this.hiddenTiles, ...this.testerTiles]) t.eventMode = 'none';
    this.cover = coverArt();
    this.banner = cantTellArt();
    this.banner.visible = false;
    this.canButton = new RoundButton(canArt(), swatch.blue, CAN_R, () => void this.water());
    this.tryButton = new RoundButton(packetArt(), swatch.orange, PACKET_R, () => this.tryOne());
    this.tryButton.visible = false;

    const rec = recordArt();
    rec.eventMode = 'none';
    this.glowLayer.eventMode = 'none';
    this.recordCard.eventMode = 'none';
    this.recordCard.addChild(rec, this.glowLayer);

    for (const key of s.order) {
      const card = new ChoiceCard<Candidate>(key, copiesPic(GENOTYPES[key]));
      onTap(card, () => this.cardTapped(card));
      this.cards.push(card);
    }
    this.checkButton = new RoundButton(leafArt(), swatch.green, CHECK_R, () => this.check());
    this.checkButton.visible = false;

    this.fanPanel.eventMode = 'static';
    onTap(this.fanPanel, () => {
      if (!this.busy) this.closeFan();
    });
    this.fan.addChild(this.fanPanel);
    this.fan.visible = false;

    for (const b of s.bench) {
      const g = GENOTYPES[b.key];
      const art = testerArt(looks(g), g, b.color, PLANT_H);
      onTap(art, () => void this.plant(b.key));
      this.benchPlants.push({ key: b.key, art });
    }
    // Level 6's pot starts empty: the bench's testers stand in for level 5's fixed one.
    this.testerPlant.visible = !this.picking;
    for (const t of this.testerTiles) t.visible = !this.picking;
    this.bench.visible = this.picking;

    this.board.addChild(
      this.hiddenPlant,
      this.testerPlant,
      ...this.hiddenTiles,
      ...this.testerTiles,
      this.cover,
      this.banner,
      this.canButton,
      this.tryButton,
      this.recordCard,
      ...this.cards,
      this.checkButton,
      this.bench,
      ...this.benchPlants.map((b) => b.art),
      this.fan,
    );
  }

  start() {
    this.layout();
    this.instruct(this.picking ? 'sprout.tester-intro' : 'sprout.hidden-intro');
  }

  /** The plant in the right pot: level 5's fixed plain one, or level 6's chosen bench tester (plain once she has watered it). */
  get tester(): Genotype {
    return this.potted ? GENOTYPES[this.potted] : this.setup.tester;
  }

  private get testerColor(): ColorName {
    return this.setup.bench.find((b) => b.key === this.potted)?.color ?? this.setup.colors[1];
  }

  destroy() {
    this.alive = false;
    this.grows = [];
    this.budGrows = [];
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    this.layout();
  }

  private instruct(id: LineId) {
    this.lastInstruction = id;
    void this.ctx.instruct(id);
  }

  private repeat() {
    if (this.finished || this.busy) return;
    void this.ctx.instruct(this.lastInstruction);
  }

  private get choosing() {
    return this.phase === 'choose1' || this.phase === 'choose2';
  }

  // ——— Layout ———

  /** Plants and trays in the top band, the record card under them, the candidate cards and the leaf along the bottom. Portrait centres the same stack. */
  layout() {
    const v = this.view;
    const off = Math.max(0, (v.h - 768) / 2);
    const feet = off + TOP + PLANT_H + 20;
    const trayY = feet + 60;
    const hx = v.w * 0.28;
    const tx = v.w * 0.72;
    this.hiddenPlant.position.set(hx, feet);
    this.testerPlant.position.set(tx, feet);
    for (const [i, t] of this.hiddenTiles.entries())
      t.position.set(hx + (i === 0 ? -1 : 1) * (TRAY_TILE / 2 + 8), trayY);
    for (const [i, t] of this.testerTiles.entries())
      t.position.set(tx + (i === 0 ? -1 : 1) * (TRAY_TILE / 2 + 8), trayY);
    if (!this.finished) this.cover.position.set(hx, trayY);
    this.banner.position.set(hx, feet - PLANT_H - 34);
    this.canButton.position.set(v.w / 2, feet - 90);
    this.tryButton.position.set(v.w - 90, feet - 90);
    const recordY = trayY + 48 + 10 + RECORD_H / 2;
    this.recordCard.position.set(v.w / 2, recordY);
    for (const [i, sp] of this.sprouts.entries())
      sp.position.set(v.w / 2 + slotX(i), recordY + RECORD_H / 2 - 18);
    const cardY = Math.min(v.h - 16 - CARD / 2, recordY + RECORD_H / 2 + 26 + CARD / 2 + (off > 0 ? 40 : 0));
    const xs = spread(3, 150, v.w - 40, CARD + 50);
    for (const [i, c] of this.cards.entries()) {
      c.position.set(xs[i], cardY);
      c.visible = this.phase !== 'pick';
    }
    this.checkButton.position.set(xs[2], cardY);
    // Level 6: the potted tester stands where level 5's does; the others wait on the bench in the cards' row.
    this.bench.position.set((xs[0] + xs[1]) / 2, cardY + 82);
    this.bench.visible = this.phase === 'pick';
    for (const [i, b] of this.benchPlants.entries()) {
      if (b.key === this.potted) {
        b.art.scale.set(1);
        b.art.position.set(tx, feet);
      } else {
        b.art.scale.set(BENCH_S);
        b.art.position.set(xs[i], cardY + 22);
      }
      b.art.visible = this.phase === 'pick' || b.key === this.potted;
    }
    // The fan covers the plants' band while open.
    const top = off + TOP + 4;
    const bottom = trayY + 48;
    this.fanPanel
      .clear()
      .roundRect(20, top, v.w - 40, bottom - top, 28)
      .fill({ color: 0xfffaf0, alpha: 0.94 })
      .stroke({ width: 5, color: swatch.green.line });
    // Two fans side by side share one row in landscape, with a wider gap between them and clear of the corner buttons, and stack in portrait.
    const pair = this.buds.length > 4;
    const rows = pair && v.h > v.w ? 2 : 1;
    const perRow = this.buds.length / rows;
    const split = pair && rows === 1 ? 40 : 0;
    const left = pair && rows === 1 ? 130 : 40;
    const scale = Math.min(
      1,
      (bottom - top - 24 - (rows - 1) * FAN_GAP) / (rows * BUD_H),
      (v.w - 40 - left - split) / (perRow * BUD_W + (perRow - 1) * FAN_GAP),
    );
    const bx = spread(perRow, left, v.w - 40, BUD_W * scale + FAN_GAP);
    const rowH = BUD_H * scale + FAN_GAP;
    for (const [i, b] of this.buds.entries()) {
      const row = Math.floor(i / perRow);
      const col = i % perRow;
      b.scale.set(scale);
      b.position.set(
        bx[col] + (split ? (col < perRow / 2 ? -split / 2 : split / 2) : 0),
        (top + bottom) / 2 + (row - (rows - 1) / 2) * rowH,
      );
    }
  }

  // ——— Watering and the record ———

  /** The can: the next authored three sprouts grow onto the record, half a second apart. */
  async water() {
    if (this.finished || this.busy) return;
    if (this.phase === 'pick') return this.waterPicked();
    if (this.phase !== 'water1' && this.phase !== 'water2') return;
    const second = this.phase === 'water2';
    this.closeFan();
    this.busy = true;
    this.tryButton.visible = false;
    void this.ctx.tw.to(this.canButton, { rotation: 0.5 }, { duration: 0.25, ease: ease.outQuad });
    const looksToGrow = second ? this.setup.second : this.setup.first;
    for (const look of looksToGrow) {
      if (!this.alive) return;
      void this.addSprout(look);
      await this.ctx.tw.wait(0.5);
    }
    if (!this.alive) return;
    void this.ctx.tw.to(this.canButton, { rotation: 0 }, { duration: 0.25, ease: ease.outQuad });
    await this.ctx.tw.wait(0.4);
    if (!this.alive) return;
    this.phase = second ? 'choose2' : 'choose1';
    this.wrong = 0;
    this.glowCards = false;
    this.busy = false;
    this.updateButtons();
    this.instruct('sprout.could-ask');
  }

  /**
   * Level 6's can: with the plain tester the whole authored record grows and she chooses once; with the spotted one,
   * three spotted sprouts grow, both candidates' fans show every way spotted, and the tester goes back to the bench.
   */
  private async waterPicked() {
    if (!this.potted) {
      this.nudgeBench();
      void this.ctx.say('sprout.tester-ask');
      return;
    }
    const telling = couldTell(this.tester);
    this.busy = true;
    this.tryButton.visible = false;
    void this.ctx.tw.to(this.canButton, { rotation: 0.5 }, { duration: 0.25, ease: ease.outQuad });
    for (const look of telling ? testerRecord(this.setup) : cantTellSprouts(this.tester)) {
      if (!this.alive) return;
      void this.addSprout(look);
      await this.ctx.tw.wait(0.5);
    }
    if (!this.alive) return;
    void this.ctx.tw.to(this.canButton, { rotation: 0 }, { duration: 0.25, ease: ease.outQuad });
    await this.ctx.tw.wait(0.4);
    if (!this.alive) return;
    if (!telling) {
      await this.cantTell();
      return;
    }
    this.phase = 'choose2';
    this.wrong = 0;
    this.glowCards = false;
    this.busy = false;
    this.layout();
    this.updateButtons();
    this.instruct('sprout.could-ask');
  }

  /** The spotted tester's lesson, never a miss: both fans, every way spotted; then the record clears and she picks again. */
  private async cantTell() {
    this.openFan(CANDIDATES);
    await this.ctx.say('sprout.tester-all-spotted');
    if (!this.alive) return;
    await this.ctx.tw.wait(0.8);
    if (!this.alive) return;
    this.closeFan();
    for (const sp of this.sprouts) sp.destroy();
    this.sprouts = [];
    this.grows = [];
    this.record = [];
    this.potted = null;
    sfx.pop();
    this.layout();
    this.busy = false;
    this.updateButtons();
    this.instruct('sprout.tester-ask');
  }

  /** Level 6: a bench tester hops into the right pot (the one there goes back, free); tapping the potted one names it. */
  async plant(key: Tester) {
    if (this.finished || this.busy || this.phase !== 'pick') return;
    sfx.tick();
    void this.ctx.say(`sprout.card-${key}` as LineId);
    if (this.potted === key) return;
    this.potted = key;
    const art = this.benchPlants.find((b) => b.key === key)!.art;
    art.scale.set(1.08);
    void this.ctx.tw.to(art.scale, { x: 1, y: 1 }, { duration: 0.4, ease: ease.outBack });
    this.layout();
  }

  /** The bench testers bounce: pick one first. */
  private nudgeBench() {
    for (const b of this.benchPlants) {
      if (b.key === this.potted) continue;
      b.art.scale.set(BENCH_S * 1.15);
      void this.ctx.tw.to(b.art.scale, { x: BENCH_S, y: BENCH_S }, { duration: 0.5, ease: ease.outElastic });
    }
  }

  /** A sprout grows into the next empty slot; a plain one bounces once. */
  private async addSprout(look: Look) {
    const i = this.record.length;
    this.record.push(look);
    // A plain sprout settles it: the banner no longer says can't tell.
    if (candidates(this.tester, this.record).length < 2) this.banner.visible = false;
    const sp = new Sprout(SPROUT_H);
    this.sprouts.push(sp);
    this.recordCard.parent?.addChild(sp);
    this.layout();
    const p = { v: 0 };
    const grow: Grow = { sprout: sp, look, p };
    this.grows.push(grow);
    sfx.pluck(2 + (i % 4) * 2, 0.2);
    await this.ctx.tw.to(p, { v: 1 }, { duration: 0.45, ease: ease.outBack });
    if (!this.alive) return;
    this.grows = this.grows.filter((g) => g !== grow);
    if (sp.destroyed) return;
    sp.open(look, this.setup.colors[0], 1);
    if (look === 'plain') {
      sfx.boing();
      sp.scale.set(1.25);
      void this.ctx.tw.to(sp.scale, { x: 1, y: 1 }, { duration: 0.5, ease: ease.outElastic });
    }
  }

  /** Try one: one more sprout from the hidden plant's true copies, by chance. Free, never needed and never counted. */
  tryOne() {
    if (this.finished || this.busy || tryRoom(this.phase, this.record.length) === 0) return;
    this.tries++;
    const before = candidates(this.tester, this.record).length;
    void this.addSprout(drawSprout(this.setup.hidden, this.tester, this.ctx.rng));
    if (candidates(this.tester, this.record).length < before) {
      // A drawn plain sprout changes the answer: an earlier choice starts over, so a free draw never turns it into a miss.
      this.chosen.clear();
      for (const c of this.cards) c.setChosen(false);
      this.wrong = 0;
      this.glowCards = false;
      void this.ctx.say(this.choosing ? 'sprout.try-plain' : 'sprout.try-plain-water');
    } else if (this.tries === 1) void this.ctx.say('sprout.try-hidden');
    this.updateButtons();
  }

  // ——— Choosing and checking ———

  private cardTapped(card: ChoiceCard<Candidate>) {
    if (this.finished || this.busy) return;
    sfx.tick();
    if (this.choosing) this.setChosen(card.key, !this.chosen.has(card.key));
    void this.ctx.say(`sprout.card-${card.key}` as LineId);
  }

  private setChosen(key: Candidate, on: boolean) {
    if (on) this.chosen.add(key);
    else this.chosen.delete(key);
    for (const c of this.cards) c.setChosen(this.chosen.has(c.key));
    this.updateButtons();
  }

  private updateButtons() {
    const show = this.choosing && this.chosen.size > 0 && !this.finished;
    if (show && !this.checkButton.visible) {
      this.checkButton.visible = true;
      this.checkButton.scale.set(0.01);
      void this.ctx.tw.to(this.checkButton.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
    } else if (!show) this.checkButton.visible = false;
    const fanOpen = this.fanOf !== null;
    this.tryButton.visible = !fanOpen && !this.finished && tryRoom(this.phase, this.record.length) > 0;
    this.canButton.visible = !fanOpen && !this.finished;
  }

  /** The leaf: every candidate that fits the record finishes the task; anything else is one miss and its counterexample. */
  check() {
    if (this.finished || this.busy || !this.choosing || this.chosen.size === 0) return;
    const verdict = checkCandidates(this.chosen, this.tester, this.record);
    if (verdict.ok) {
      void this.settled();
      return;
    }
    this.misses++;
    this.wrong++;
    sfx.boing();
    if (this.wrong === 2 && !this.glowHintedIn.has(this.phase)) {
      this.glowHintedIn.add(this.phase);
      this.hints++;
    }
    if (this.wrong >= 2) this.glowCards = true;
    void this.counter(verdict);
  }

  /** A ruled-out card pulses the plain sprout and opens its fan with no plain way; a left-out card opens its fan, every way fitting. */
  private async counter(verdict: Exclude<HiddenVerdict, { ok: true }>) {
    this.busy = true;
    await this.ctx.tw.wait(0.3);
    if (!this.alive) return;
    if ('extra' in verdict) {
      this.glowSlots = new Set(this.record.flatMap((l, i) => (this.fits(verdict.extra, l) ? [] : [i])));
      this.openFan([verdict.extra]);
      void this.ctx.say('sprout.counter-no-plain');
    } else {
      this.openFan([verdict.missing]);
      if (verdict.missing === 'Aa') {
        // The ways that make the record's looks pulse: one spot copy can make spotted too.
        const rs = routes(GENOTYPES.Aa, this.tester);
        this.glowBuds = new Set(rs.flatMap((r, k) => (this.record.includes(looks(r.sprout)) ? [k] : [])));
        void this.ctx.say('sprout.counter-not-ruled-out');
      } else void this.ctx.say('sprout.counter-fits');
    }
    await this.ctx.tw.wait(3.2);
    if (!this.alive) return;
    this.glowBuds = new Set();
    this.glowSlots = new Set();
    if (this.wrong >= 2) void this.ctx.say('sprout.hidden-glow');
    this.busy = false;
  }

  /** Whether a candidate's fan with the tester can make this look. */
  private fits(c: Candidate, look: Look) {
    return routes(GENOTYPES[c], this.tester).some((r) => looks(r.sprout) === look);
  }

  /** A right Check: both still fit (the first time, water again; the second, the sprouts can't tell), or only one spot copy fits. */
  private async settled() {
    const fit = candidates(this.tester, this.record);
    this.closeFan();
    this.glowCards = false;
    sfx.sparkle();
    if (fit.length === 2 && this.phase === 'choose1') {
      this.phase = 'water2';
      this.chosen.clear();
      for (const c of this.cards) c.setChosen(false);
      this.updateButtons();
      this.banner.visible = true;
      this.banner.scale.set(0.01);
      void this.ctx.tw.to(this.banner.scale, { x: 1, y: 1 }, { duration: 0.4, ease: ease.outBack });
      this.instruct('sprout.both-could');
      return;
    }
    this.busy = true;
    this.checkButton.visible = false;
    await this.ctx.say(
      fit.length === 1 ? 'sprout.plain-tells' : this.picking ? 'sprout.tester-couldnt' : 'sprout.still-both',
    );
    if (!this.alive) return;
    await this.reveal();
  }

  /** The packet peels open on the hidden plant's true copies; then one sticker. */
  private async reveal() {
    this.phase = 'done';
    this.updateButtons();
    this.banner.visible = false;
    sfx.tada();
    this.ctx.pet.cheer();
    void this.ctx.tw.to(
      this.cover,
      { y: this.cover.y - 80, alpha: 0 },
      { duration: 0.7, ease: ease.outQuad },
    );
    const p = this.ctx.stage.toLocal(this.hiddenPlant.getGlobalPosition());
    this.ctx.particles.burst(p.x, p.y + 60, {
      colors: [swatch.green.fill, swatch[this.setup.colors[0]].fill, 0xffffff],
      count: 10,
    });
    await this.ctx.say(this.setup.truth === 'Aa' ? 'sprout.reveal-one' : 'sprout.reveal-two');
    if (!this.alive) return;
    this.finished = true;
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  // ——— The fan ———

  /** Each candidate's four ways with the tester grow over the plants' band. Tapping the panel closes it; tapping a bud regrows it. */
  private openFan(cs: readonly Candidate[]) {
    this.closeFan();
    this.fanOf = cs;
    const colors: readonly [ColorName, ColorName] = [this.setup.colors[0], this.testerColor];
    for (const c of cs) {
      for (const route of routes(GENOTYPES[c], this.tester)) {
        const k = this.buds.length;
        const bud = new BudCard(route.sprout, colors, route.from);
        // Both fans together are a picture the pet explains, too small to tap; one fan's buds regrow on a tap.
        if (cs.length > 1) bud.eventMode = 'none';
        else
          onTap(bud, () => {
            if (!this.busy) void this.growBud(k);
          });
        this.buds.push(bud);
        this.budLooks.push(looks(route.sprout));
        this.fan.addChild(bud);
      }
    }
    this.fan.visible = true;
    this.layout();
    this.updateButtons();
    for (const k of this.buds.keys()) void this.growBud(k, 0.12 * k);
  }

  private async growBud(k: number, delay = 0) {
    const card = this.buds[k];
    if (!card || this.fanOf === null) return;
    const look = this.budLooks[k];
    card.close();
    const p = { v: 0 };
    const grow = { card, look, p };
    this.budGrows = this.budGrows.filter((g) => g.card !== card);
    this.budGrows.push(grow);
    await this.ctx.tw.to(p, { v: 1 }, { duration: 0.5, delay, ease: ease.outBack });
    // A newer grow of the same bud (a second tap) supersedes this one.
    if (!this.alive || !this.budGrows.includes(grow)) return;
    this.budGrows = this.budGrows.filter((g) => g !== grow);
    if (!card.destroyed) card.open(look, this.setup.colors[0], 1);
  }

  closeFan() {
    for (const b of this.buds) b.destroy();
    this.buds = [];
    this.budLooks = [];
    this.budGrows = [];
    this.fanOf = null;
    this.fan.visible = false;
    this.updateButtons();
  }

  // ——— Help ———

  hintLabel = 'Show me';

  /** Show me: the fitting cards are chosen and the leaf pulses; she presses it herself. Counted once per task. A watering step pulses the can, uncounted. */
  askForHint() {
    if (this.finished || this.busy) return;
    if (this.phase === 'pick') {
      // Show me plants the tester that could tell, counted once; she waters it herself.
      if (!this.showMeIn.has('pick')) {
        this.showMeIn.add('pick');
        this.hints++;
      }
      const step = pickStep(this.potted);
      if ('plant' in step) void this.plant(step.plant);
      this.canButton.scale.set(1.15);
      void this.ctx.tw.to(this.canButton.scale, { x: 1, y: 1 }, { duration: 0.5, ease: ease.outElastic });
      void this.ctx.say('plant' in step ? 'sprout.help.tester' : 'sprout.help.water');
      return;
    }
    if (!this.choosing) {
      this.closeFan();
      this.canButton.scale.set(1.15);
      void this.ctx.tw.to(this.canButton.scale, { x: 1, y: 1 }, { duration: 0.5, ease: ease.outElastic });
      void this.ctx.say('sprout.help.water');
      return;
    }
    if (!this.showMeIn.has(this.phase)) {
      this.showMeIn.add(this.phase);
      this.hints++;
    }
    const shown = this.checkButton.visible;
    const fit = candidates(this.tester, this.record);
    for (const c of this.cards) this.setChosen(c.key, fit.includes(c.key));
    if (shown) {
      this.checkButton.scale.set(1.15);
      void this.ctx.tw.to(this.checkButton.scale, { x: 1, y: 1 }, { duration: 0.5, ease: ease.outElastic });
    }
    void this.ctx.say('sprout.help.hidden');
  }

  update(dt: number) {
    this.clock += dt;
    for (const g of this.budGrows)
      if (!g.card.destroyed) g.card.open(g.look, this.setup.colors[0], Math.min(1, Math.max(0.01, g.p.v)));
    for (const g of this.grows)
      if (!g.sprout.destroyed)
        g.sprout.open(g.look, this.setup.colors[0], Math.min(1, Math.max(0.01, g.p.v)));
    const r = 1 + 0.06 * Math.sin(this.clock * 5);
    const live = !this.finished;
    for (const [k, b] of this.buds.entries()) b.glow(live && this.glowBuds.has(k) ? r : null);
    const fit = candidates(this.tester, this.record);
    for (const c of this.cards)
      c.glow(
        live && this.glowCards && this.choosing && fit.includes(c.key) && !this.chosen.has(c.key) ? r : null,
      );
    this.glowLayer.clear();
    // At the glow, the deciding plain sprout glows with the fitting cards.
    const slots = new Set(this.glowSlots);
    if (live && this.glowCards && this.choosing)
      this.record.forEach((l, i) => {
        if (l === 'plain') slots.add(i);
      });
    for (const i of slots)
      this.glowLayer.circle(slotX(i), -4, 36 * r).stroke({ width: 7, color: swatch.yellow.fill });
  }

  /** The ghost finger: (level 6) the plain tester, then the can, the fitting cards, the leaf; again for level 5's second watering. It never presses Try one. */
  autotouch(): TouchIntent | null {
    if (this.finished || this.busy) return null;
    if (this.fanOf !== null) return { tap: { on: this.fanPanel }, pause: 0.6 };
    if (this.phase === 'pick') {
      const pick = pickStep(this.potted);
      if ('water' in pick) return { tap: { on: this.canButton }, pause: 4 };
      return { tap: { on: this.benchPlants.find((b) => b.key === pick.plant)!.art }, pause: 1.2 };
    }
    const step = hiddenNextStep(this.phase, this.chosen, this.tester, this.record);
    if (!step) return null;
    if ('water' in step) return { tap: { on: this.canButton }, pause: 2.4 };
    if ('choose' in step) return { tap: { on: this.cardOf(step.choose) }, pause: 1.1 };
    if ('unchoose' in step) return { tap: { on: this.cardOf(step.unchoose) }, pause: 0.8 };
    return this.checkButton.visible ? { tap: { on: this.checkButton } } : null;
  }

  private cardOf(c: Candidate) {
    return this.cards.find((k) => k.key === c)!;
  }
}
