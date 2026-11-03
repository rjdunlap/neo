/**
 * Sprout Shuffle level 5, Hidden Sprouts. A spotted plant's tray is covered by a seed packet; she waters it beside a
 * plain plant whose copies are known, its sprouts grow onto a record card, and she chooses every pair of copies that
 * could have made them. Three spotted sprouts leave both; a plain sprout rules out two spot copies; six spotted sprouts
 * still leave both, and "we can't tell yet" is the right answer. The rules: ./logic.ts; definition:
 * docs/definitions/hidden-sprouts.md (G6, level 5).
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
import { BUD_H, BUD_W, BudCard, CAN_R, canArt, cantTellArt, CARD, CHECK_R, ChoiceCard, copiesPic, coverArt, leafArt, PACKET_R, packetArt, plantArt, RECORD_H, recordArt, slotX, Sprout, tileArt } from './art';
import {
  candidates,
  checkCandidates,
  drawSprout,
  GENOTYPES,
  hiddenNextStep,
  hiddenSetupFor,
  looks,
  routes,
  tryRoom,
  type Candidate,
  type HiddenPhase,
  type HiddenSetup,
  type HiddenVerdict,
  type Look,
} from './logic';

const TOP = 100;
const PLANT_H = 160;
const TRAY_TILE = 72;
const FAN_GAP = 16;
const SPROUT_H = 112;

interface Grow {
  sprout: Sprout;
  look: Look;
  p: { v: number };
}

export class SproutHidden implements Game {
  readonly setup: HiddenSetup;
  phase: HiddenPhase = 'water1';
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
  /** The open fan: a candidate's four ways with the tester, over the plants. */
  fanOf: Candidate | null = null;
  readonly fanPanel = new Graphics();
  private readonly fan = new Container();
  buds: BudCard[] = [];
  private glowBuds = new Set<number>();
  private glowSlots = new Set<number>();
  /** After two wrong Checks in a task the fitting cards glow until chosen. */
  private glowCards = false;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.setup = hiddenSetupFor(ctx.rng);
    const s = this.setup;
    this.backdrop = new Backdrop({ sky: [0xc4ecff, 0xfff6e0], hills: [0xf5d0e6, 0xbfe39a, 0x9ad77e], horizon: 0.42, clouds: 3, sun: false, seed: 131 }, ctx.view);
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
    onTap(this.fanPanel, () => { if (!this.busy) this.closeFan(); });
    this.fan.addChild(this.fanPanel);
    this.fan.visible = false;

    this.board.addChild(
      this.hiddenPlant, this.testerPlant, ...this.hiddenTiles, ...this.testerTiles, this.cover, this.banner,
      this.canButton, this.tryButton, this.recordCard, ...this.cards, this.checkButton, this.fan,
    );
  }

  start() {
    this.layout();
    this.instruct('sprout.hidden-intro');
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
    for (const [i, t] of this.hiddenTiles.entries()) t.position.set(hx + (i === 0 ? -1 : 1) * (TRAY_TILE / 2 + 8), trayY);
    for (const [i, t] of this.testerTiles.entries()) t.position.set(tx + (i === 0 ? -1 : 1) * (TRAY_TILE / 2 + 8), trayY);
    if (!this.finished) this.cover.position.set(hx, trayY);
    this.banner.position.set(hx, feet - PLANT_H - 34);
    this.canButton.position.set(v.w / 2, feet - 90);
    this.tryButton.position.set(v.w - 90, feet - 90);
    const recordY = trayY + 48 + 10 + RECORD_H / 2;
    this.recordCard.position.set(v.w / 2, recordY);
    for (const [i, sp] of this.sprouts.entries()) sp.position.set(v.w / 2 + slotX(i), recordY + RECORD_H / 2 - 18);
    const cardY = Math.min(v.h - 16 - CARD / 2, recordY + RECORD_H / 2 + 26 + CARD / 2 + (off > 0 ? 40 : 0));
    const xs = spread(3, 150, v.w - 40, CARD + 50);
    for (const [i, c] of this.cards.entries()) c.position.set(xs[i], cardY);
    this.checkButton.position.set(xs[2], cardY);
    // The fan covers the plants' band while open.
    const top = off + TOP + 4;
    const bottom = trayY + 48;
    this.fanPanel.clear().roundRect(20, top, v.w - 40, bottom - top, 28).fill({ color: 0xfffaf0, alpha: 0.94 }).stroke({ width: 5, color: swatch.green.line });
    const scale = Math.min(1, (bottom - top - 24) / BUD_H, (v.w - 80) / (4 * BUD_W + 3 * FAN_GAP));
    const bx = spread(4, 40, v.w - 40, BUD_W * scale + FAN_GAP);
    for (const [i, b] of this.buds.entries()) {
      b.scale.set(scale);
      b.position.set(bx[i], (top + bottom) / 2);
    }
  }

  // ——— Watering and the record ———

  /** The can: the next authored three sprouts grow onto the record, half a second apart. */
  async water() {
    if (this.finished || this.busy || (this.phase !== 'water1' && this.phase !== 'water2')) return;
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

  /** A sprout grows into the next empty slot; a plain one bounces once. */
  private async addSprout(look: Look) {
    const i = this.record.length;
    this.record.push(look);
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
    void this.addSprout(drawSprout(this.setup.hidden, this.setup.tester, this.ctx.rng));
    if (this.tries === 1) void this.ctx.say('sprout.try-hidden');
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
    const verdict = checkCandidates(this.chosen, this.setup.tester, this.record);
    if (verdict.ok) {
      void this.settled();
      return;
    }
    this.misses++;
    this.wrong++;
    sfx.boing();
    if (this.wrong === 2 && !this.glowHintedIn.has(this.phase)) { this.glowHintedIn.add(this.phase); this.hints++; }
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
      this.openFan(verdict.extra);
      void this.ctx.say('sprout.counter-no-plain');
    } else {
      this.openFan(verdict.missing);
      if (verdict.missing === 'Aa') {
        // The ways that make the record's looks pulse: one spot copy can make spotted too.
        const rs = routes(GENOTYPES.Aa, this.setup.tester);
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
    return routes(GENOTYPES[c], this.setup.tester).some((r) => looks(r.sprout) === look);
  }

  /** A right Check: both still fit (the first time, water again; the second, the sprouts can't tell), or only one spot copy fits. */
  private async settled() {
    const fit = candidates(this.setup.tester, this.record);
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
    await this.ctx.say(fit.length === 2 ? 'sprout.still-both' : 'sprout.plain-tells');
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
    void this.ctx.tw.to(this.cover, { y: this.cover.y - 80, alpha: 0 }, { duration: 0.7, ease: ease.outQuad });
    const p = this.ctx.stage.toLocal(this.hiddenPlant.getGlobalPosition());
    this.ctx.particles.burst(p.x, p.y + 60, { colors: [swatch.green.fill, swatch[this.setup.colors[0]].fill, 0xffffff], count: 10 });
    await this.ctx.say(this.setup.truth === 'Aa' ? 'sprout.reveal-one' : 'sprout.reveal-two');
    if (!this.alive) return;
    this.finished = true;
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  // ——— The fan ———

  /** A candidate's four ways with the tester grow over the plants' band. Tapping the panel closes it; tapping a bud regrows it. */
  private openFan(c: Candidate) {
    this.closeFan();
    this.fanOf = c;
    const colors: readonly [ColorName, ColorName] = [this.setup.colors[0], this.setup.colors[1]];
    for (const [k, route] of routes(GENOTYPES[c], this.setup.tester).entries()) {
      const bud = new BudCard(route.sprout, colors, route.from);
      onTap(bud, () => { if (!this.busy) void this.growBud(k); });
      this.buds.push(bud);
      this.fan.addChild(bud);
    }
    this.fan.visible = true;
    this.layout();
    this.updateButtons();
    for (const k of this.buds.keys()) void this.growBud(k, 0.12 * k);
  }

  private async growBud(k: number, delay = 0) {
    const card = this.buds[k];
    if (!card || this.fanOf === null) return;
    const look = looks(routes(GENOTYPES[this.fanOf], this.setup.tester)[k].sprout);
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
    if (!this.choosing) {
      this.closeFan();
      this.canButton.scale.set(1.15);
      void this.ctx.tw.to(this.canButton.scale, { x: 1, y: 1 }, { duration: 0.5, ease: ease.outElastic });
      void this.ctx.say('sprout.help.water');
      return;
    }
    if (!this.showMeIn.has(this.phase)) { this.showMeIn.add(this.phase); this.hints++; }
    const shown = this.checkButton.visible;
    const fit = candidates(this.setup.tester, this.record);
    for (const c of this.cards) this.setChosen(c.key, fit.includes(c.key));
    if (shown) {
      this.checkButton.scale.set(1.15);
      void this.ctx.tw.to(this.checkButton.scale, { x: 1, y: 1 }, { duration: 0.5, ease: ease.outElastic });
    }
    void this.ctx.say('sprout.help.hidden');
  }

  update(dt: number) {
    this.clock += dt;
    for (const g of this.budGrows) if (!g.card.destroyed) g.card.open(g.look, this.setup.colors[0], Math.min(1, Math.max(0.01, g.p.v)));
    for (const g of this.grows) if (!g.sprout.destroyed) g.sprout.open(g.look, this.setup.colors[0], Math.min(1, Math.max(0.01, g.p.v)));
    const r = 1 + 0.06 * Math.sin(this.clock * 5);
    const live = !this.finished;
    for (const [k, b] of this.buds.entries()) b.glow(live && this.glowBuds.has(k) ? r : null);
    const fit = candidates(this.setup.tester, this.record);
    for (const c of this.cards) c.glow(live && this.glowCards && this.choosing && fit.includes(c.key) && !this.chosen.has(c.key) ? r : null);
    this.glowLayer.clear();
    for (const i of this.glowSlots) this.glowLayer.circle(slotX(i), -4, 36 * r).stroke({ width: 7, color: swatch.yellow.fill });
  }

  /** The ghost finger: the can, the fitting cards, the leaf; again for the second watering. It never presses Try one. */
  autotouch(): TouchIntent | null {
    if (this.finished || this.busy) return null;
    if (this.fanOf !== null) return { tap: { on: this.fanPanel }, pause: 0.6 };
    const step = hiddenNextStep(this.phase, this.chosen, this.setup.tester, this.record);
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
