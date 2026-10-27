/**
 * Sprout Shuffle: two plants each hand a sprout one copy of a petal tile, and the sprout opens spotted or plain. Then
 * she opens every bud the same two plants could make (level 1), or finishes the one missing bud and chooses every
 * sprout that could grow (level 2). The model and plans: ./logic.ts; definition: docs/definitions/sprout-shuffle.md.
 */
import { Container, Graphics } from 'pixi.js';
import { swatch, type ColorName } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import { spread, type View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import type { LineId } from '../../content/voice-script';
import { BUD_H, BUD_W, BudCard, CARD, CHECK_R, ChoiceCard, iconArt, leafArt, plantArt, slotArt, Sprout, stickerArt, TILE, tileArt } from './art';
import { builtBud, checkLooks, freshRound, looks, nextStep, PETAL_COLORS, planFor, setupFor, support, type Look, type Round, type Setup } from './logic';

const LEVELS: BandLevels = {
  school: { min: 1, max: 2 },
};

type Side = 0 | 1;

interface Tile {
  side: Side;
  index: 0 | 1;
  node: Container;
  handle: DragHandle;
}

class SproutShuffle implements Game {
  readonly setup: Setup;
  round: Round;
  misses = 0;
  hints = 0;
  /** Wrong Checks in the current choice task; the second one glows. */
  wrong = 0;
  private glowHinted = false;
  private readonly showMeIn = new Set<string>();
  busy = false;
  finished = false;
  private alive = true;
  private clock = 0;
  private view: View;

  private readonly backdrop: Backdrop;
  private readonly board = new Container();
  private readonly paths = new Graphics();
  private readonly rings = new Graphics();
  private readonly plants: Container[] = [];
  tiles: Tile[] = [];
  private readonly slots: Graphics[] = [];
  private readonly slotTiles: (Container | null)[] = [null, null];
  private readonly sprout: Sprout;
  private sproutScale = 1;
  buds: BudCard[] = [];
  private readonly fan = new Container();
  cards: ChoiceCard[] = [];
  private readonly choice = new Container();
  checkButton: RoundButton | null = null;
  /** The bud and the choice card that glow after two wrong Checks. */
  private glowBud: number | null = null;
  private glowCard: Look | null = null;
  private lastInstruction: LineId = 'sprout.give';

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.setup = setupFor(ctx.level, ctx.rng);
    this.round = freshRound(this.setup);
    this.backdrop = new Backdrop({ sky: [0xc4ecff, 0xfff6e0], hills: [0xf5d0e6, 0xbfe39a, 0x9ad77e], horizon: 0.42, clouds: 3, sun: false, seed: 131 }, ctx.view);
    this.paths.eventMode = this.rings.eventMode = 'none';
    this.sprout = new Sprout(200);
    ctx.stage.addChild(this.backdrop, this.board);
    onTap(this.backdrop, () => this.repeat(), { cooldown: 1200 });
  }

  private get level() {
    return this.setup.plan.level;
  }

  start() {
    this.build();
    this.instruct('sprout.give');
  }

  destroy() {
    this.alive = false;
    for (const t of this.tiles) t.handle.destroy();
    this.tiles = [];
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    if (this.tiles.length) this.layout();
  }

  private instruct(id: LineId) {
    this.lastInstruction = id;
    void this.ctx.instruct(id);
  }

  /** A tap on the meadow: the current instruction again. */
  private repeat() {
    if (this.finished || this.busy) return;
    void this.ctx.instruct(this.lastInstruction);
  }

  // ——— Building and layout ———

  private build() {
    const s = this.setup;
    for (const side of [0, 1] as const) {
      const g = side === 0 ? s.left : s.right;
      const plant = plantArt(looks(g), s.colors[side]);
      plant.eventMode = 'none';
      this.plants.push(plant);
      this.board.addChild(plant);
      const slot = slotArt(s.colors[side]);
      slot.eventMode = 'none';
      this.slots.push(slot);
    }
    this.board.addChild(this.paths, ...this.slots, this.sprout, this.rings, this.fan, this.choice);
    for (const side of [0, 1] as const) {
      const g = side === 0 ? s.left : s.right;
      for (const index of [0, 1] as const) {
        const node = tileArt(g[index]);
        const tile: Tile = { side, index, node, handle: null as unknown as DragHandle };
        tile.handle = draggable(node, this.ctx.tw, { onDrop: (x, y) => this.released(tile, x, y) });
        this.tiles.push(tile);
        this.board.addChild(node);
      }
    }
    for (const [i, route] of s.routes.entries()) {
      const card = new BudCard(route.sprout, s.colors, route.from);
      if (this.round.opened[i]) card.open(looks(route.sprout), s.colors[0], 1);
      onTap(card, () => this.budTapped(i));
      this.buds.push(card);
      this.fan.addChild(card);
    }
    this.fan.visible = false;
    for (const look of ['spotted', 'plain'] as const) {
      const card = new ChoiceCard(look, s.colors[look === 'spotted' ? 0 : 1]);
      onTap(card, () => this.cardTapped(card));
      this.cards.push(card);
      this.choice.addChild(card);
    }
    this.checkButton = new RoundButton(leafArt(), swatch.green, CHECK_R, () => this.check());
    this.checkButton.visible = false;
    this.choice.addChild(this.checkButton);
    this.choice.visible = false;
    this.layout();
  }

  private get portrait() {
    return this.view.h > this.view.w;
  }

  /** The stage: plants left and right with their trays, the sprout between, the fan along the bottom (a 2 × 2 grid in portrait). */
  private layout() {
    const v = this.view;
    const px = [v.w * 0.17, v.w * 0.83];
    const plantFeet = 300;
    const trayY = plantFeet + 90;
    for (const side of [0, 1] as const) {
      this.plants[side].position.set(px[side], plantFeet);
      this.slots[side].position.set(v.w / 2 + (side === 0 ? -1 : 1) * 90, plantFeet - 20);
      this.slotTiles[side]?.position.copyFrom(this.slots[side].position);
    }
    for (const t of this.tiles) {
      if (t.handle.dragging) continue;
      const x = px[t.side] + (t.index === 0 ? -1 : 1) * (TILE / 2 + 12);
      t.node.position.set(x, trayY);
      t.handle.home = { x, y: trayY };
    }
    this.sprout.position.set(v.w / 2, plantFeet - 40);
    this.sprout.scale.set(this.sproutScale);
    if (this.portrait) {
      const cy = [v.h * 0.5 + 130, v.h * 0.5 + 130 + BUD_H + 24];
      const cx = [v.w / 2 - BUD_W / 2 - 14, v.w / 2 + BUD_W / 2 + 14];
      this.buds.forEach((b, i) => b.position.set(cx[i % 2], cy[Math.floor(i / 2)]));
    } else {
      const xs = spread(4, 150, v.w - 40, BUD_W + 30);
      this.buds.forEach((b, i) => b.position.set(xs[i], v.h - BUD_H / 2 - 40));
    }
    const cardY = 230;
    this.cards.forEach((c, i) => c.position.set(v.w / 2 + (i === 0 ? -1 : 1) * (CARD / 2 + 10), cardY));
    this.checkButton?.position.set(v.w / 2, cardY + CARD / 2 + CHECK_R + 30);
    this.drawPaths();
  }

  // ——— Giving a copy ———

  /** A tile let go: on its own tray (a tap) or in its parent's slot it is given; anywhere else it floats home, silently. */
  private released(tile: Tile, x: number, y: number): boolean {
    if (this.finished || this.busy) return false;
    const home = tile.handle.home;
    const slot = this.slots[tile.side].position;
    const near = (p: { x: number; y: number }, r: number) => Math.hypot(x - p.x, y - p.y) < r;
    const tapped = near(home, 60);
    if (this.round.phase === 'give') {
      if (!tapped && !near(slot, 95)) return false;
      void tile.handle.floatHome();
      this.give(tile);
      return true;
    }
    if (this.round.phase === 'fan' && this.setup.missing !== null && tapped) {
      this.buildWith(tile);
      return true;
    }
    return false;
  }

  /** The copy travels along its parent's path into the sprout's slot; the other tile of the same tray swaps it, for free. */
  private give(tile: Tile) {
    const slots: [0 | 1 | null, 0 | 1 | null] = [this.round.slots[0], this.round.slots[1]];
    slots[tile.side] = tile.index;
    this.round = { ...this.round, slots };
    this.slotTiles[tile.side]?.destroy();
    const copy = tileArt(this.setup[tile.side === 0 ? 'left' : 'right'][tile.index], TILE * 0.9);
    copy.position.copyFrom(tile.node.position);
    copy.eventMode = 'none';
    this.board.addChildAt(copy, this.board.getChildIndex(this.sprout));
    this.slotTiles[tile.side] = copy;
    sfx.pluck(4 + tile.side * 3, 0.25);
    const slot = this.slots[tile.side].position;
    void this.ctx.tw.to(copy, { x: slot.x, y: slot.y }, { duration: 0.45, ease: ease.outQuad });
    this.drawPaths();
    if (slots[0] !== null && slots[1] !== null) void this.openSprout();
    else if (this.round.slots[tile.side] !== null && this.lastInstruction === 'sprout.give') this.instruct('sprout.other-plant');
  }

  /** Both copies are in: the sprout uncurls over 0.8 s, its paths glow, and the pet says what it made. */
  private async openSprout() {
    this.busy = true;
    for (const t of this.tiles) t.handle.enabled = false;
    const [i, j] = this.round.slots as [0 | 1, 0 | 1];
    const g = [this.setup.left[i], this.setup.right[j]] as const;
    const look = looks(g);
    await this.ctx.tw.wait(0.5);
    if (!this.alive) return;
    sfx.pluck(9, 0.3);
    const t = { v: 0 };
    const p = this.ctx.tw.to(t, { v: 1 }, { duration: 0.8, ease: ease.outBack });
    const tick = () => { this.sprout.open(look, this.setup.colors[0], Math.min(1, t.v)); if (t.v < 1 && this.alive) requestAnimationFrame(tick); };
    tick();
    await p;
    if (!this.alive) return;
    this.sprout.open(look, this.setup.colors[0], 1);
    this.ctx.particles.burst(this.sprout.x, this.sprout.y - 150, { colors: [swatch[this.setup.colors[0]].fill, swatch[this.setup.colors[1]].fill, 0xffffff], count: 10 });
    await this.ctx.say(look === 'spotted' ? 'sprout.spotted' : 'sprout.plain');
    if (!this.alive) return;
    this.showFan();
  }

  // ——— The bud fan ———

  private showFan() {
    this.round = { ...this.round, phase: 'fan' };
    this.fan.visible = true;
    for (const [i, b] of this.buds.entries()) {
      b.scale.set(0.01);
      void this.ctx.tw.to(b.scale, { x: 1, y: 1 }, { duration: 0.4, delay: 0.08 * i, ease: ease.outBack });
    }
    const mine = builtBud(this.round);
    if (mine !== null) { this.glowBud = mine; void this.ctx.tw.wait(1.6).then(() => { if (this.glowBud === mine && this.round.phase === 'fan') this.glowBud = null; }); }
    this.busy = false;
    if (this.setup.missing === null) {
      this.instruct('sprout.fan');
    } else {
      for (const t of this.tiles) t.handle.enabled = true;
      this.instruct('sprout.fill-bud');
    }
  }

  private budTapped(i: number) {
    if (this.finished || this.busy || this.round.phase === 'give') return;
    if (this.round.opened[i]) { void this.replay(i); return; }
    if (this.setup.missing === i) {
      // Guided: the bud she must build lights its two source tiles.
      sfx.tick();
      void this.ctx.say('sprout.fill-bud');
      return;
    }
    void this.openBud(i);
  }

  /** Level 1: a closed bud opens with its route's paths lit; the fourth one finishes the round. */
  private async openBud(i: number) {
    this.busy = true;
    const opened = this.round.opened.map((o, k) => o || k === i);
    this.round = { ...this.round, opened };
    sfx.pluck(2 + i * 2, 0.25);
    await this.bloom(i);
    if (!this.alive) return;
    this.busy = false;
    if (opened.every(Boolean)) {
      if (this.setup.plan.task === 'open-all') void this.end('sprout.every-spotted');
    } else if (this.setup.plan.task === 'open-all' && opened.filter(Boolean).length === 1) {
      void this.ctx.say('sprout.open-more');
    }
  }

  /** Grow bud `i` from closed to open over about 0.6 s, with its route's paths. */
  private async bloom(i: number) {
    const route = this.setup.routes[i];
    const look = looks(route.sprout);
    const card = this.buds[i];
    card.close();
    this.litRoute = i;
    const t = { v: 0 };
    const p = this.ctx.tw.to(t, { v: 1 }, { duration: 0.6, ease: ease.outBack });
    const tick = () => { card.open(look, this.setup.colors[0], Math.min(1, Math.max(0, t.v))); if (t.v < 1 && this.alive) requestAnimationFrame(tick); };
    tick();
    await p;
    if (!this.alive) return;
    card.open(look, this.setup.colors[0], 1);
    await this.ctx.tw.wait(0.5);
    if (this.litRoute === i) this.litRoute = null;
    this.drawPaths();
  }

  /** The paths of a bud's route, lit while it opens or replays. */
  private litRoute: number | null = null;

  private async replay(i: number) {
    this.busy = true;
    sfx.pluck(2 + i * 2, 0.2);
    await this.bloom(i);
    this.busy = false;
  }

  /** Level 2: a tapped source tile of the missing bud grows half of it; the second one opens the bud and brings the choice. */
  private buildWith(tile: Tile) {
    const m = this.setup.missing!;
    const route = this.setup.routes[m];
    if (route.from[tile.side] !== tile.index || this.round.built[tile.side]) {
      // Not this one: a small shake, no miss. The lit tiles show which.
      sfx.tick();
      const home = tile.handle.home;
      void this.ctx.tw.to(tile.node, { x: home.x + 10 }, { duration: 0.08 }).then(() => { if (this.alive) void this.ctx.tw.to(tile.node, { x: home.x }, { duration: 0.12, ease: ease.outBack }); });
      return;
    }
    const built: [boolean, boolean] = [this.round.built[0], this.round.built[1]];
    built[tile.side] = true;
    this.round = { ...this.round, built };
    sfx.pluck(4 + tile.side * 3, 0.25);
    const copy = tileArt(this.setup[tile.side === 0 ? 'left' : 'right'][tile.index], 44, false);
    copy.position.copyFrom(tile.node.position);
    copy.eventMode = 'none';
    this.board.addChild(copy);
    const to = this.buds[m].toGlobal({ x: (tile.side === 0 ? -1 : 1) * BUD_W * 0.25, y: -BUD_H / 2 + 42 });
    const local = this.board.toLocal(to);
    this.busy = true;
    void this.ctx.tw.to(copy, { x: local.x, y: local.y }, { duration: 0.45, ease: ease.outQuad }).then(async () => {
      if (!this.alive) return;
      copy.destroy();
      if (!(built[0] && built[1])) { this.busy = false; return; }
      for (const t of this.tiles) t.handle.enabled = false;
      const opened = this.round.opened.map((o, k) => o || k === m);
      this.round = { ...this.round, opened };
      await this.bloom(m);
      if (!this.alive) return;
      this.busy = false;
      this.showChoice();
    });
  }

  // ——— The choice ———

  private showChoice() {
    this.round = { ...this.round, phase: 'choose' };
    this.wrong = 0;
    // Her sprout joins the fan: it shrinks away into the matching bud, leaving the stage to the choice cards.
    const mine = builtBud(this.round);
    const target = mine === null ? this.sprout.position : this.board.toLocal(this.buds[mine].getGlobalPosition());
    void this.ctx.tw.to(this.sprout, { x: target.x, y: target.y + 60 }, { duration: 0.6, ease: ease.inOutSine });
    void this.ctx.tw.to(this.sprout.scale, { x: 0.01, y: 0.01 }, { duration: 0.6, ease: ease.inOutSine }).then(() => { this.sproutScale = 0.01; if (this.alive) this.sprout.visible = false; });
    for (const s of this.slots) void this.ctx.tw.to(s, { alpha: 0 }, { duration: 0.4 });
    for (const s of this.slotTiles) if (s) void this.ctx.tw.to(s, { alpha: 0 }, { duration: 0.4 });
    this.choice.visible = true;
    for (const [i, c] of this.cards.entries()) {
      c.scale.set(0.01);
      void this.ctx.tw.to(c.scale, { x: 1, y: 1 }, { duration: 0.4, delay: 0.5 + 0.1 * i, ease: ease.outBack });
    }
    this.instruct('sprout.choose-could');
  }

  private cardTapped(card: ChoiceCard) {
    if (this.finished || this.busy || this.round.phase !== 'choose') return;
    sfx.tick();
    card.setChosen(!card.chosen);
    const chosen = new Set(this.cards.filter((c) => c.chosen).map((c) => c.look));
    this.round = { ...this.round, chosen };
    void this.ctx.say(card.look === 'spotted' ? 'sprout.card-spotted' : 'sprout.card-plain');
    if (this.glowCard === card.look && card.chosen) this.glowCard = null;
    this.updateCheck();
  }

  private updateCheck() {
    if (!this.checkButton) return;
    const show = this.round.chosen.size > 0 && this.round.phase === 'choose';
    if (show && !this.checkButton.visible) {
      this.checkButton.visible = true;
      this.checkButton.scale.set(0.01);
      void this.ctx.tw.to(this.checkButton.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
    } else if (!show) this.checkButton.visible = false;
  }

  /** Check: the only accepted set is every look these plants can make; a wrong set is one miss with its counterexample replayed. */
  private check() {
    if (this.finished || this.busy || this.round.phase !== 'choose' || this.round.chosen.size === 0) return;
    const verdict = checkLooks(this.round.chosen, this.setup.routes);
    if (verdict.ok) {
      void this.end('sprout.both-grow');
      return;
    }
    this.misses++;
    this.wrong++;
    sfx.boing();
    if (this.wrong === 2 && !this.glowHinted) { this.glowHinted = true; this.hints++; }
    if ('missing' in verdict) {
      const i = this.setup.routes.indexOf(verdict.route);
      if (this.wrong >= 2) { this.glowBud = i; this.glowCard = verdict.missing; }
      void this.counter(i, verdict.missing);
    } else {
      void this.ctx.say('sprout.no-way');
    }
  }

  private async counter(i: number, missing: Look) {
    this.busy = true;
    await this.ctx.tw.wait(0.3);
    if (!this.alive) return;
    void this.ctx.say(missing === 'plain' ? 'sprout.counter-plain' : 'sprout.counter-spotted');
    await this.bloom(i);
    if (!this.alive) return;
    if (this.wrong >= 2) void this.ctx.say('sprout.glow');
    this.busy = false;
  }

  // ——— Finishing ———

  private async end(line: LineId) {
    this.busy = true;
    this.round = { ...this.round, phase: 'done' };
    this.glowBud = null;
    this.glowCard = null;
    for (const t of this.tiles) t.handle.enabled = false;
    sfx.tada();
    this.ctx.pet.cheer();
    for (const b of this.buds) {
      const p = b.getGlobalPosition();
      const l = this.ctx.stage.toLocal(p);
      this.ctx.particles.burst(l.x, l.y - 40, { colors: [swatch.green.fill, swatch[this.setup.colors[0]].fill, 0xffffff], count: 6 });
    }
    await this.ctx.say(line);
    if (!this.alive) return;
    this.finished = true;
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  // ——— Help ———

  hintLabel = 'Show me';

  /** The pet's Show me: the next missing step. Counted once per task (once per round at level 1), however often she asks. */
  askForHint() {
    if (this.finished || this.busy) return;
    const step = nextStep(this.round);
    if (!step) return;
    const key = this.level === 1 ? 'round' : this.round.phase;
    if (!this.showMeIn.has(key)) { this.showMeIn.add(key); this.hints++; }
    if ('give' in step) {
      const tile = this.tiles.find((t) => t.side === step.give && t.index === step.tile)!;
      void this.ctx.say('sprout.help.give');
      this.give(tile);
    } else if ('open' in step) {
      void this.ctx.say('sprout.help.open');
      void this.openBud(step.open);
    } else if ('build' in step) {
      void this.ctx.say('sprout.help.build');
      this.buildWith(this.tiles.find((t) => t.side === step.side && t.index === step.tile)!);
    } else {
      const can = support(this.setup.routes);
      for (const c of this.cards) c.setChosen(can.has(c.look));
      this.round = { ...this.round, chosen: new Set(can) };
      this.glowCard = null;
      this.updateCheck();
      if (this.checkButton) { this.checkButton.scale.set(1.15); void this.ctx.tw.to(this.checkButton.scale, { x: 1, y: 1 }, { duration: 0.5, ease: ease.outElastic }); }
      void this.ctx.say('sprout.help.choose');
    }
  }

  // ——— Drawing ———

  /** The parent-coloured paths: from each given tile to its slot, and a lit route's two paths to its bud. */
  private drawPaths() {
    const g = this.paths.clear();
    if (this.round.phase === 'give' || this.round.phase === 'fan') {
      for (const side of [0, 1] as const) {
        const idx = this.round.slots[side];
        if (idx === null || this.round.phase !== 'give') continue;
        const tile = this.tiles.find((t) => t.side === side && t.index === idx)!;
        const from = tile.handle.home, to = this.slots[side].position;
        g.moveTo(from.x, from.y).bezierCurveTo(from.x, to.y + 60, to.x, to.y + 90, to.x, to.y).stroke({ width: 10, color: swatch[this.setup.colors[side]].fill, alpha: 0.7, cap: 'round' });
      }
    }
    if (this.litRoute !== null) {
      const route = this.setup.routes[this.litRoute];
      const card = this.buds[this.litRoute];
      for (const side of [0, 1] as const) {
        const tile = this.tiles.find((t) => t.side === side && t.index === route.from[side])!;
        const from = tile.handle.home;
        const to = this.board.toLocal(card.toGlobal({ x: (side === 0 ? -1 : 1) * BUD_W * 0.25, y: -BUD_H / 2 + 42 }));
        g.moveTo(from.x, from.y).bezierCurveTo(from.x, (from.y + to.y) / 2, to.x, (from.y + to.y) / 2, to.x, to.y).stroke({ width: 8, color: swatch[this.setup.colors[side]].fill, alpha: 0.75, cap: 'round' });
      }
    }
  }

  update(dt: number) {
    this.clock += dt;
    const r = 1 + 0.06 * Math.sin(this.clock * 5);
    const rings = this.rings.clear();
    if (this.litRoute !== null) this.drawPaths();
    if (!this.finished && this.round.phase === 'fan' && this.setup.missing !== null) {
      // The missing bud's two source tiles are lit until each is given.
      const route = this.setup.routes[this.setup.missing];
      for (const side of [0, 1] as const) {
        if (this.round.built[side]) continue;
        const tile = this.tiles.find((t) => t.side === side && t.index === route.from[side])!;
        if (tile.handle.dragging) continue;
        rings.circle(tile.node.x, tile.node.y, (TILE / 2 + 10) * r).stroke({ width: 7, color: swatch.yellow.fill, alpha: 0.9 });
      }
      this.buds[this.setup.missing].glow(this.clock % 2 < 1 ? r : null);
    }
    for (const [i, b] of this.buds.entries()) if (!(this.round.phase === 'fan' && i === this.setup.missing)) b.glow(this.glowBud === i && !this.finished ? r : null);
    for (const c of this.cards) c.glow(this.glowCard === c.look && !this.finished ? r : null);
  }

  /** The ghost finger: a copy from each plant, every bud (or the missing bud's two tiles), the right cards, then the leaf. */
  autotouch(): TouchIntent | null {
    if (this.finished || this.busy) return null;
    const step = nextStep(this.round);
    if (!step) return null;
    if ('give' in step) return { tap: { on: this.tiles.find((t) => t.side === step.give && t.index === step.tile)!.node } };
    if ('open' in step) return { tap: { on: this.buds[step.open] }, pause: 0.9 };
    if ('build' in step) return { tap: { on: this.tiles.find((t) => t.side === step.side && t.index === step.tile)!.node }, pause: 0.8 };
    if ('choose' in step) return { tap: { on: this.cards.find((c) => c.look === step.choose)! }, pause: 0.9 };
    return this.checkButton?.visible ? { tap: { on: this.checkButton } } : null;
  }
}

class SproutIcon extends WigglyIcon {
  constructor() {
    super(iconArt());
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  return stickerArt(rng.chance(0.5) ? 'spotted' : 'plain', rng.pick([...PETAL_COLORS]) as ColorName);
}

export const sproutShuffle: GameModule = {
  id: 'sprout-shuffle',
  name: 'Sprout Shuffle',
  titleLine: 'game.sprout-shuffle',
  region: 'rainbow-meadow',
  skills: ['inheritance', 'modeling', 'possible outcomes'],
  bands: ['school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  coplayHint: 'Before the buds open, one of you says which sprouts the two plants could make; the other opens the buds to check.',
  offScreen: 'Draw two plants and four arrows between them on paper, and talk about which sprout each arrow would make.',
  hubIcon: () => new SproutIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new SproutShuffle(ctx),
};
