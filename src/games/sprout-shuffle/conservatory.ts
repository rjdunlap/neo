/**
 * Sprout Shuffle levels 7–8, Patchwork Conservatory. A friend wants a bed where every sprout is spotted and has a rim.
 * She plants two bench plants in the pots, looks through the spots lens and the rim lens at each marking's four ways,
 * and Checks. The plant that already looks right carries copies that do not show, so at level 7 every pair with it can
 * fail; at level 8 two pairs both work, and after the first a second plan is free. The rules: ./logic.ts; definition:
 * docs/definitions/patchwork-conservatory.md (G7).
 */
import { Container, Graphics } from 'pixi.js';
import { Critter, CRITTERS, type CritterName } from '../../art/critter';
import { cream, swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import { spread, type View } from '../../engine/view';
import { finish as finishArt, RoundButton } from '../../ui/buttons';
import type { Game, GameContext, TouchIntent } from '../types';
import type { LineId } from '../../content/voice-script';
import {
  BRIEF_H,
  BRIEF_W,
  briefPic,
  BUD_H,
  BUD_W,
  BudCard,
  CHECK_R,
  conservatoryBedArt,
  leafArt,
  LENS_BIG_R,
  markingLensArt,
  PLANT_H,
  PLANT_W,
  PlantCard,
  potArt,
  type Face,
} from './art';
import {
  conservatoryStep,
  conservatorySetupFor,
  counterFor,
  guaranteed,
  hasPair,
  helpPair,
  locusRoutes,
  looks,
  looks2,
  MARKINGS,
  plantKey,
  type ConservatorySetup,
  type Marking,
} from './logic';

const FRIENDS: readonly CritterName[] = ['bunny', 'pig', 'cat', 'bear', 'duck'];
const FAN_GAP = 16;
const CLOSE_R = 50;

interface Card {
  index: number;
  node: PlantCard;
  handle: DragHandle;
}

export class SproutConservatory implements Game {
  readonly setup: ConservatorySetup;
  /** The two pots, each holding a plant index or nothing. */
  pots: (number | null)[] = [null, null];
  /** The pot filled most recently, which a third plant swaps into. */
  private lastFilled = 1;
  /** The lens open now, and the lenses opened since the pots last changed (the ghost finger's plan). */
  lens: Marking | null = null;
  seen = new Set<Marking>();
  /** Level 8: the first accepted pair she planted, after which nothing counts. */
  found: readonly [number, number] | null = null;
  misses = 0;
  hints = 0;
  wrong = 0;
  private glowHinted = false;
  private showMeUsed = false;
  private glowOn = false;
  busy = false;
  finished = false;
  private alive = true;
  private clock = 0;
  private view: View;
  private lastInstruction: LineId = 'sprout.pc-plant-two';

  private readonly backdrop: Backdrop;
  private readonly board = new Container();
  readonly brief = new Container();
  private readonly friend: Critter;
  private readonly potArts = [potArt(), potArt()];
  readonly cards: Card[] = [];
  readonly lenses: Record<Marking, RoundButton>;
  readonly checkButton: RoundButton;
  readonly finishButton: RoundButton;
  readonly closeButton: RoundButton;
  readonly fanPanel = new Graphics();
  private readonly fan = new Container();
  buds: BudCard[] = [];
  private budFaces: Face[] = [];
  private budGrows: { card: BudCard; face: Face; p: { v: number } }[] = [];
  private glowBud: number | null = null;
  private pulseCard: number | null = null;
  private readonly beds: Container[] = [];

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.setup = conservatorySetupFor(ctx.level, ctx.rng);
    const s = this.setup;
    this.backdrop = new Backdrop(
      {
        sky: [0xd8f0ff, 0xfff6e0],
        hills: [0xcfe8c0, 0xbfe39a, 0x9ad77e],
        horizon: 0.36,
        clouds: 2,
        sun: true,
        seed: 177,
      },
      ctx.view,
    );
    ctx.stage.addChild(this.backdrop, this.board);
    onTap(this.backdrop, () => this.repeat(), { cooldown: 1200 });

    // The brief card: the friend beside the wanted sprout. Pressing it repeats the brief.
    const face = finishArt({ w: BRIEF_W, h: BRIEF_H, corner: 28 }, swatch.yellow, cream);
    this.friend = new Critter(CRITTERS[ctx.rng.pick([...FRIENDS])]);
    this.friend.eventMode = 'none';
    this.friend.scale.set(0.36);
    this.friend.position.set(-80, 74);
    const pic = briefPic(s.colors[0], s.rimColor);
    pic.position.set(40, 0);
    this.brief.addChild(face, this.friend, pic);
    onTap(
      this.brief,
      () => {
        if (this.finished) return;
        void this.ctx.say('sprout.pc-brief');
      },
      { cooldown: 800 },
    );

    for (const i of s.places) {
      const p = s.bench[i];
      const node = new PlantCard(i, p.spots, p.rim, s.colors[i], s.rimColor);
      const card: Card = { index: i, node, handle: null as unknown as DragHandle };
      card.handle = draggable(node, ctx.tw, {
        onPick: () => {
          if (this.finished || this.busy) return;
          sfx.tick();
          void this.ctx.say(`sprout.pc-card-${plantKey(p)}` as LineId);
        },
        onDrop: (x, y) => this.released(card, x, y),
      });
      this.cards.push(card);
    }

    this.lenses = {
      spots: new RoundButton(markingLensArt('spots', s.rimColor), swatch.blue, LENS_BIG_R, () =>
        this.toggleLens('spots'),
      ),
      rim: new RoundButton(markingLensArt('rim', s.rimColor), swatch.blue, LENS_BIG_R, () =>
        this.toggleLens('rim'),
      ),
    };
    this.checkButton = new RoundButton(leafArt(), swatch.green, CHECK_R, () => void this.check());
    this.finishButton = new RoundButton(starArt(), swatch.yellow, CHECK_R, () => this.end());
    this.finishButton.visible = false;
    const x = new Graphics()
      .moveTo(-16, -16)
      .lineTo(16, 16)
      .moveTo(16, -16)
      .lineTo(-16, 16)
      .stroke({ width: 8, color: swatch.brown.line, cap: 'round' });
    this.closeButton = new RoundButton(x, swatch.orange, CLOSE_R, () => {
      if (!this.busy) this.closeFan();
    });

    this.fanPanel.eventMode = 'static';
    onTap(this.fanPanel, () => {
      if (!this.busy) this.closeFan();
    });
    this.fan.addChild(this.fanPanel, this.closeButton);
    this.fan.visible = false;

    this.board.addChild(
      this.brief,
      ...this.potArts,
      ...this.cards.map((c) => c.node),
      this.lenses.spots,
      this.lenses.rim,
      this.checkButton,
      this.finishButton,
      this.fan,
    );
  }

  start() {
    this.layout(true);
    this.updateButtons();
    void this.intro();
  }

  private async intro() {
    await this.ctx.say('sprout.pc-brief');
    if (!this.alive || this.finished) return;
    this.instruct('sprout.pc-plant-two');
  }

  destroy() {
    this.alive = false;
    for (const c of this.cards) c.handle.destroy();
    this.budGrows = [];
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    this.layout(true);
  }

  private instruct(id: LineId) {
    this.lastInstruction = id;
    void this.ctx.instruct(id);
  }

  private repeat() {
    if (this.finished || this.busy) return;
    void this.ctx.instruct(this.lastInstruction);
  }

  private get portrait() {
    return this.view.h > this.view.w;
  }

  private get full() {
    return this.pots[0] !== null && this.pots[1] !== null;
  }

  private cardOf(i: number) {
    return this.cards.find((c) => c.index === i)!;
  }

  // ——— Layout ———

  private geometry() {
    const v = this.view;
    const portrait = this.portrait;
    const top = portrait ? Math.max(0, (v.h - 1180) / 2) : Math.max(0, (v.h - 768) / 2);
    const briefY = top + 20 + BRIEF_H / 2;
    const potScale = portrait ? 0.85 : 1;
    const potCardY = top + (portrait ? 230 : 210) + (PLANT_H * potScale) / 2;
    const potRim = potCardY + (PLANT_H * potScale) / 2 - 6;
    const potX = [v.w * 0.38, v.w * 0.62];
    const n = this.cards.length;
    let benchTop: number;
    let benchBottom: number;
    let benchPos: { x: number; y: number }[];
    const bs = portrait ? 0.9 : 1;
    if (portrait) {
      const rowY = potRim + 130 + 90;
      benchTop = rowY - 16;
      const rows = n > 3 ? 2 : 1;
      const perRow = Math.ceil(n / rows);
      const rowH = PLANT_H * bs + 24;
      benchPos = Array.from({ length: n }, (_, k) => {
        const row = Math.floor(k / perRow);
        const xs = spread(perRow, 150, v.w - 40, PLANT_W * bs + 60);
        return { x: xs[k % perRow], y: rowY + rowH / 2 + row * rowH };
      });
      benchBottom = rowY + rows * rowH;
    } else {
      const y = top + 768 - 16 - PLANT_H / 2;
      const xs = spread(n, 150, v.w - 40, PLANT_W + 30);
      benchPos = xs.map((x) => ({ x, y }));
      benchTop = y - PLANT_H / 2 - 8;
      benchBottom = y + PLANT_H / 2 + 8;
    }
    // Landscape: the lenses stand left of the pots and the leaves right; portrait: all in one row under the pots.
    const ctrl = portrait
      ? (() => {
          const y = potRim + 130;
          const xs = spread(4, 150, v.w - 40, 190);
          return {
            spots: { x: xs[0], y },
            rim: { x: xs[1], y },
            check: { x: xs[2], y },
            finish: { x: xs[3], y },
          };
        })()
      : {
          spots: { x: potX[0] - PLANT_W / 2 - 30 - LENS_BIG_R, y: top + 270 },
          rim: { x: potX[0] - PLANT_W / 2 - 30 - LENS_BIG_R, y: top + 410 },
          check: { x: potX[1] + PLANT_W / 2 + 30 + CHECK_R, y: top + 280 },
          finish: { x: potX[1] + PLANT_W / 2 + 30 + CHECK_R, y: top + 430 },
        };
    const bedY = briefY + 30;
    const beds = [
      { x: v.w / 2 - 290, y: bedY },
      { x: v.w / 2 + 290, y: bedY },
    ];
    return { briefY, potScale, potCardY, potRim, potX, benchPos, bs, benchTop, benchBottom, ctrl, beds };
  }

  /** Puts everything in place; cards move along a short arc unless `snap`. A card held in a drag is left alone. */
  layout(snap = false) {
    const v = this.view;
    const g = this.geometry();
    this.brief.position.set(v.w / 2, g.briefY);
    for (const [k, p] of this.potArts.entries()) {
      p.position.set(g.potX[k], g.potRim);
      p.scale.set(g.potScale);
    }
    for (const [place, card] of this.cards.entries()) {
      const pot = this.pots.indexOf(card.index);
      const to = pot >= 0 ? { x: g.potX[pot], y: g.potCardY } : g.benchPos[place];
      const scale = pot >= 0 ? g.potScale : g.bs;
      card.handle.home = { x: to.x, y: to.y };
      card.node.visible = pot >= 0 || this.lens === null;
      card.handle.enabled = card.node.visible;
      if (card.handle.dragging) continue;
      if (snap) {
        card.node.position.set(to.x, to.y);
        card.node.scale.set(scale);
      } else {
        void this.ctx.tw.to(card.node, { x: to.x, y: to.y }, { duration: 0.35, ease: ease.outBack });
        void this.ctx.tw.to(card.node.scale, { x: scale, y: scale }, { duration: 0.3 });
      }
    }
    this.lenses.spots.position.set(g.ctrl.spots.x, g.ctrl.spots.y);
    this.lenses.rim.position.set(g.ctrl.rim.x, g.ctrl.rim.y);
    this.checkButton.position.set(g.ctrl.check.x, g.ctrl.check.y);
    this.finishButton.position.set(g.ctrl.finish.x, g.ctrl.finish.y);
    for (const [k, bed] of this.beds.entries()) {
      bed.position.set(g.beds[k].x, g.beds[k].y);
      bed.scale.set(0.8);
    }
    // An open fan covers the bench: one row of four in landscape, two by two in portrait.
    // Portrait's fan is two rows of buds even over a one-row bench, so a bud never shrinks below its full size.
    const top = g.benchTop;
    const bottom = this.portrait ? Math.max(g.benchBottom, top + 2 * BUD_H + FAN_GAP + 24) : g.benchBottom;
    this.fanPanel
      .clear()
      .roundRect(20, top, v.w - 40, bottom - top, 28)
      .fill({ color: 0xfffaf0, alpha: 0.95 })
      .stroke({ width: 5, color: swatch.green.line });
    this.closeButton.position.set(v.w - 20 - CLOSE_R - 8, top + CLOSE_R + 8);
    const rows = this.portrait ? 2 : 1;
    const perRow = 4 / rows;
    const left = 150;
    const right = v.w - 40 - 2 * CLOSE_R - 20;
    const scale = Math.min(
      1,
      (bottom - top - 24 - (rows - 1) * FAN_GAP) / (rows * BUD_H),
      (right - left) / (perRow * BUD_W + (perRow - 1) * FAN_GAP),
    );
    const bx = spread(perRow, left, right, BUD_W * scale + FAN_GAP);
    const rowH = BUD_H * scale + FAN_GAP;
    for (const [i, b] of this.buds.entries()) {
      const row = Math.floor(i / perRow);
      b.scale.set(scale);
      b.position.set(bx[i % perRow], (top + bottom) / 2 + (row - (rows - 1) / 2) * rowH);
    }
  }

  private updateButtons() {
    const live = !this.finished && !this.busy;
    const show = this.full && !this.finished;
    for (const m of MARKINGS) this.lenses[m].visible = show;
    this.checkButton.visible = show && live;
    this.finishButton.visible = this.found !== null && live;
  }

  // ——— Planting ———

  /** A card let go: near its own place is a tap (plant it, or send a potted one back); over a pot plants it there. */
  private released(card: Card, x: number, y: number): boolean {
    if (this.finished || this.busy) return false;
    const g = this.geometry();
    const near = (p: { x: number; y: number }, r: number) => Math.hypot(x - p.x, y - p.y) < r;
    const pot = this.pots.indexOf(card.index);
    if (near(card.handle.home, 60)) {
      if (pot >= 0) this.unpot(card.index);
      else this.potInto(card.index, this.pots[0] === null ? 0 : this.pots[1] === null ? 1 : this.lastFilled);
      return true;
    }
    for (const k of [0, 1] as const) {
      if (!near({ x: g.potX[k], y: g.potCardY }, 130)) continue;
      if (pot === k) return false;
      this.potInto(card.index, k);
      return true;
    }
    return false;
  }

  /** Plants a plant in pot `k`; whatever stood there goes back to the bench (or, from the other pot, swaps). Free. */
  potInto(i: number, k: number) {
    const from = this.pots.indexOf(i);
    const there = this.pots[k];
    if (from >= 0) this.pots[from] = there;
    this.pots[k] = i;
    this.lastFilled = k;
    sfx.pluck(4 + k * 2, 0.25);
    this.potsChanged();
  }

  unpot(i: number) {
    const k = this.pots.indexOf(i);
    if (k < 0) return;
    this.pots[k] = null;
    sfx.pop();
    this.potsChanged();
  }

  private potsChanged() {
    this.seen.clear();
    this.closeFan(false);
    this.layout();
    this.updateButtons();
  }

  // ——— Lenses ———

  toggleLens(m: Marking) {
    if (this.finished || this.busy || !this.full) return;
    if (this.lens === m) {
      this.closeFan();
      return;
    }
    this.openLens(m);
    void this.ctx.say(m === 'spots' ? 'sprout.pc-lens-spots' : 'sprout.pc-lens-rim');
  }

  /** The marking's four buds grow over the bench; the other marking's tiles dim in the trays. */
  private openLens(m: Marking, glowRoute: number | null = null) {
    this.closeFan(false);
    const [l, r] = this.pots as [number, number];
    const s = this.setup;
    this.lens = m;
    this.seen.add(m);
    this.glowBud = glowRoute;
    for (const [k, route] of locusRoutes(s.bench[l], s.bench[r], m).entries()) {
      const bud = new BudCard(route.sprout, [s.colors[l], s.colors[r]], route.from, m, s.rimColor);
      const shows = looks(route.sprout) === 'spotted';
      const face: Face =
        m === 'spots'
          ? { spots: shows, rim: null, rimColor: s.rimColor }
          : { spots: null, rim: shows, rimColor: s.rimColor };
      onTap(bud, () => {
        if (!this.busy) void this.growBud(k);
      });
      this.buds.push(bud);
      this.budFaces.push(face);
      this.fan.addChild(bud);
    }
    for (const c of this.cards) c.node.dim(m);
    this.fan.visible = true;
    this.board.addChild(this.fan);
    this.layout(true);
    for (const k of this.buds.keys()) void this.growBud(k, 0.12 * k);
  }

  private async growBud(k: number, delay = 0) {
    const card = this.buds[k];
    if (!card) return;
    const face = this.budFaces[k];
    card.close();
    const p = { v: 0 };
    const grow = { card, face, p };
    this.budGrows = this.budGrows.filter((g) => g.card !== card);
    this.budGrows.push(grow);
    await this.ctx.tw.to(p, { v: 1 }, { duration: 0.5, delay, ease: ease.outBack });
    if (!this.alive || !this.budGrows.includes(grow)) return;
    this.budGrows = this.budGrows.filter((g) => g !== grow);
    if (!card.destroyed) card.open(face, this.setup.colors[this.pots[0] ?? 0], 1);
  }

  closeFan(relayout = true) {
    for (const b of this.buds) b.destroy();
    this.buds = [];
    this.budFaces = [];
    this.budGrows = [];
    this.glowBud = null;
    this.lens = null;
    this.fan.visible = false;
    for (const c of this.cards) c.node.dim(null);
    if (relayout) this.layout(true);
  }

  // ——— Checking ———

  async check() {
    if (this.finished || this.busy || !this.full) return;
    const pair = [this.pots[0]!, this.pots[1]!] as const;
    const s = this.setup;
    if (this.found && hasPair([this.found], pair)) {
      void this.ctx.say('sprout.pc-same-plan');
      return;
    }
    if (guaranteed(s.bench[pair[0]], s.bench[pair[1]])) {
      await this.success(pair);
      return;
    }
    // Before the round's first success a failing pair is one miss; after it, nothing counts.
    if (!this.found) {
      this.misses++;
      this.wrong++;
      sfx.boing();
      if (this.wrong === 2 && !this.glowHinted) {
        this.glowHinted = true;
        this.hints++;
      }
      if (this.wrong >= 2) this.glowOn = true;
    }
    await this.counter(pair);
  }

  /** The failing marking's lens opens on its failing way; then the potted plant that hides the failing copy pulses and is named. */
  private async counter(pair: readonly [number, number]) {
    const c = counterFor(this.setup, pair)!;
    this.busy = true;
    this.updateButtons();
    await this.ctx.tw.wait(0.3);
    if (!this.alive) return;
    const ways = locusRoutes(this.setup.bench[this.pots[0]!], this.setup.bench[this.pots[1]!], c.marking);
    const k = ways.findIndex((r) => looks(r.sprout) !== 'spotted');
    this.openLens(c.marking, k);
    await this.ctx.say(c.marking === 'rim' ? 'sprout.pc-counter-rim' : 'sprout.pc-counter-plain');
    if (!this.alive) return;
    if (c.hider !== null) {
      this.pulseCard = c.hider;
      const both = c.hidden.length === 2;
      await this.ctx.say(
        both
          ? 'sprout.pc-hidden-plain-rim'
          : c.hidden[0] === 'spots'
            ? 'sprout.pc-hidden-plain'
            : 'sprout.pc-hidden-rim',
      );
      if (!this.alive) return;
      this.pulseCard = null;
    }
    if (this.glowOn && !this.found) await this.ctx.say('sprout.pc-glow');
    if (!this.alive) return;
    this.busy = false;
    this.updateButtons();
  }

  /** Both lenses light every way, then the bed fills. Level 7 finishes; level 8's first plan asks for another, free. */
  private async success(pair: readonly [number, number]) {
    this.busy = true;
    this.glowOn = false;
    this.updateButtons();
    sfx.sparkle();
    for (const m of MARKINGS) {
      this.openLens(m);
      await this.ctx.say(m === 'spots' ? 'sprout.pc-every-spotted' : 'sprout.pc-every-rim');
      if (!this.alive) return;
      await this.ctx.tw.wait(0.4);
      if (!this.alive) return;
    }
    this.closeFan();
    const s = this.setup;
    const bed = conservatoryBedArt(s.colors[pair[0]], s.rimColor);
    this.beds.push(bed);
    this.board.addChildAt(bed, 1);
    this.layout(true);
    bed.scale.set(0.01);
    void this.ctx.tw.to(bed.scale, { x: 0.8, y: 0.8 }, { duration: 0.5, ease: ease.outBack });
    sfx.tada();
    this.ctx.pet.cheer();
    this.friend.cheer();
    if (this.found) {
      await this.ctx.say('sprout.pc-two-plans');
      if (!this.alive) return;
      this.busy = false;
      this.end();
      return;
    }
    await this.ctx.say('sprout.pc-always-works');
    if (!this.alive) return;
    // A plant that shows both traits in a working pair: its rim copies are both rim.
    if (
      pair.some((k) => {
        const l = looks2(s.bench[k]);
        return l.spots && l.rim;
      })
    ) {
      await this.ctx.say('sprout.pc-two-rim-copies');
      if (!this.alive) return;
    }
    if (this.setup.accepted.length < 2) {
      this.busy = false;
      this.end();
      return;
    }
    this.found = pair;
    this.pots = [null, null];
    this.busy = false;
    this.potsChanged();
    this.instruct('sprout.pc-another-way');
  }

  /** One brief per round: one sticker, with or without help. */
  end() {
    if (this.finished || this.busy) return;
    this.finished = true;
    this.closeFan();
    this.updateButtons();
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  // ——— Help ———

  hintLabel = 'Show me';

  /** Show me plants a working pair and pulses the leaf; she presses it herself. Its first use before a plan counts one hint. */
  askForHint() {
    if (this.finished || this.busy) return;
    if (!this.found && !this.showMeUsed) {
      this.showMeUsed = true;
      this.hints++;
    }
    const pair = helpPair(this.setup, this.pots, this.found);
    for (const k of [0, 1] as const)
      if (this.pots[k] !== null && !pair.includes(this.pots[k]!)) this.pots[k] = null;
    for (const i of pair) if (!this.pots.includes(i)) this.pots[this.pots[0] === null ? 0 : 1] = i;
    this.potsChanged();
    this.checkButton.scale.set(1.2);
    void this.ctx.tw.to(this.checkButton.scale, { x: 1, y: 1 }, { duration: 0.6, ease: ease.outElastic });
    void this.ctx.say('sprout.help.conservatory');
  }

  update(dt: number) {
    this.clock += dt;
    this.friend.update(dt);
    const color = this.setup.colors[this.pots[0] ?? 0];
    for (const g of this.budGrows)
      if (!g.card.destroyed) g.card.open(g.face, color, Math.min(1, Math.max(0.01, g.p.v)));
    const r = 1 + 0.06 * Math.sin(this.clock * 5);
    for (const [k, b] of this.buds.entries()) b.glow(this.glowBud === k ? r : null);
    const help = this.glowOn && !this.found && !this.finished ? helpPair(this.setup, this.pots) : null;
    for (const c of this.cards) {
      const lit =
        (help !== null && help.includes(c.index) && !this.pots.includes(c.index)) ||
        this.pulseCard === c.index;
      c.node.glow(lit ? r : null);
    }
  }

  /** The ghost finger: level 7's pair (level 8's with the plant that shows both), both lenses, the leaf; level 8 then Finish. It never misses. */
  autotouch(): TouchIntent | null {
    if (this.finished || this.busy) return null;
    const step = conservatoryStep(this.setup.level, this.pots, this.seen, this.found !== null);
    if ('finish' in step) return { tap: { on: this.finishButton } };
    if ('lens' in step) return { tap: { on: this.lenses[step.lens] }, pause: 2.4 };
    if ('check' in step) return this.checkButton.visible ? { tap: { on: this.checkButton } } : null;
    if (this.lens !== null && 'pot' in step) return { tap: { on: this.closeButton }, pause: 0.6 };
    const i = 'pot' in step ? step.pot : step.unpot;
    return { tap: { on: this.cardOf(i).node }, pause: 1.2 };
  }
}

/** The Finish button's star. */
function starArt(): Graphics {
  return new Graphics()
    .star(0, 0, 5, 36, 16)
    .fill(swatch.yellow.light)
    .stroke({ width: 5, color: swatch.yellow.line, join: 'round' });
}
