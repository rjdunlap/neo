import { Circle, Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { LineId } from '../../content/voice-script';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  basketArt,
  BellowsArt,
  boardFrame,
  boardMark,
  burrArt,
  hillArt,
  iconArt,
  plumeArt,
  ringArt,
  sceneArt,
  trayArt,
} from './art';
import {
  LEVELS,
  BASKET,
  BELLOWS,
  CARRIERS,
  CRITTER_R,
  CRITTER_SCALE,
  FURRY,
  planFor,
  roundFor,
  SEED_HIT,
  SeedState,
  tripPoint,
  UNITS,
  type Carrier,
  type Furry,
  type Pt,
  type Round,
  type SeedLayout,
  seedLayout,
  type Target,
  type Trip,
  type Unit,
} from './logic';

const ASK: Record<number, LineId> = { 1: 'seeds.ask.breeze', 2: 'seeds.ask.fur', 3: 'seeds.ask.both' };
/** How far up the critter's body its centre (and a seed riding its fur) sits, in its own units. */
const BODY_Y = -125;
const BACK = { x: -20, y: -205 };
const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.max(0, Math.min(1, t));
/** Where a fur trip is along its timeline: hop on, walk, drop, walk off, a new critter strolls in. */
const FUR = { hop: 0.15, walk: 0.55, drop: 0.65, exit: 0.8 };

class SeedTravelers implements Game {
  readonly round: Round;
  readonly state: SeedState;
  layout: SeedLayout | null = null;
  busy = false;
  finished = false;
  /** A running trip's progress (0 to 1) and, at level 1, a Replay's float back from the tray. */
  readonly anim = { t: 0, back: 0 };
  /** The trip being shown (kept after `land()` while its critter walks off). */
  shown: Trip | null = null;
  seeds: Partial<Record<Unit, Container>> = {};
  bellows: BellowsArt | null = null;
  critter: Critter | null = null;
  basket: Container | null = null;

  private alive = true;
  private view: View;
  private epoch = 0;
  private critterKind: Furry;
  private clock = 0;
  private readonly world = new Container();
  private readonly glow = ringArt(90, 0xffe066, 0.5);
  private readonly ring = ringArt(62);
  private boardLayer: Container | null = null;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.round = roundFor(ctx.rng, ctx.level);
    this.state = new SeedState(ctx.level, this.round.order);
    this.critterKind = this.round.critter;
    // Decorations over a target must never take its tap.
    this.glow.eventMode = 'none';
    this.ring.eventMode = 'none';
    ctx.stage.addChild(this.world);
  }

  get level() {
    return this.state.level;
  }

  start() {
    this.build();
    void this.ctx.instruct(ASK[this.level]);
  }

  destroy() {
    this.alive = false;
    if (this.critter) this.ctx.untrack(this.critter);
  }

  resize(v: View) {
    this.view = v;
    this.build();
  }

  // ----- building -----

  private build() {
    if (this.critter) this.ctx.untrack(this.critter);
    for (const c of this.world.removeChildren()) {
      if (c === this.glow || c === this.ring) continue;
      this.ctx.tw.kill(c);
      this.ctx.tw.kill(c.scale);
      c.destroy({ children: true });
    }
    this.seeds = {};
    this.critter = null;
    this.basket = null;
    this.boardLayer = null;
    const v = this.view;
    const l = (this.layout = seedLayout(v, this.round.order));
    this.world.addChild(sceneArt(v.w, v.h, l.ground));
    this.world.addChild(hillArt(l.hill.x, l.ground, this.round.order.length > 1 ? 380 : 260));
    const tray = trayArt();
    tray.position.set(l.tray.x, l.tray.y);
    this.world.addChild(tray);
    if (this.level === 3) this.buildBoard(l);

    if (this.state.plan.carriers.includes('breeze')) {
      const b = (this.bellows = new BellowsArt());
      b.position.set(l.bellows.x, l.bellows.y);
      b.hitArea = new Rectangle(-BELLOWS / 2, -BELLOWS / 2, BELLOWS, BELLOWS);
      onTap(b, () => this.tapCarrier('breeze'), { cooldown: 250 });
      this.world.addChild(b);
    } else this.bellows = null;
    if (this.state.plan.carriers.includes('fur')) this.makeCritter();

    if (this.level === 1) {
      const k = (this.basket = basketArt());
      k.position.set(l.basket.x, l.basket.y);
      k.hitArea = new Rectangle(-BASKET / 2, -BASKET / 2, BASKET, BASKET);
      onTap(k, () => this.tapFinish(), { cooldown: 300 });
      this.world.addChild(k);
    }
    this.world.addChild(this.glow, this.ring);
    for (const u of this.round.order) {
      const s = new Container();
      s.addChild(u === 'plume' ? plumeArt() : burrArt());
      s.hitArea = new Rectangle(-SEED_HIT / 2, -SEED_HIT / 2, SEED_HIT, SEED_HIT);
      onTap(s, () => this.tapUnit(u), { cooldown: 250 });
      this.world.addChild(s);
      this.seeds[u] = s;
    }
    this.update(0);
  }

  private makeCritter() {
    const c = new Critter(CRITTERS[this.critterKind]);
    c.scale.set(CRITTER_SCALE);
    c.hitArea = new Circle(0, BODY_Y, CRITTER_R / CRITTER_SCALE);
    onTap(c, () => this.tapCarrier('fur'), { cooldown: 250 });
    this.critter = this.ctx.track(c);
    const at = this.layout ? this.world.children.indexOf(this.glow) : -1;
    if (at >= 0) this.world.addChildAt(c, at);
    else this.world.addChild(c);
  }

  private buildBoard(l: SeedLayout) {
    const b = new Container();
    b.addChild(boardFrame(l.cell));
    const head = l.cell * 0.8;
    for (const t of this.state.trials) {
      const m = boardMark(t.arrived, l.cell);
      m.position.set(
        head + CARRIERS.indexOf(t.carrier) * l.cell + l.cell / 2,
        head + UNITS.indexOf(t.unit) * l.cell + l.cell / 2,
      );
      b.addChild(m);
    }
    b.position.set(l.board.x, l.board.y);
    this.world.addChild(b);
    this.boardLayer = b;
  }

  // ----- each frame -----

  update(dt: number) {
    const l = this.layout;
    if (!l) return;
    this.clock += dt;
    const trip = this.shown;
    const t = this.anim.t;
    // The critter: waiting at home, or along its trip.
    const c = this.critter;
    if (c) {
      let x = l.critter.x;
      if (trip?.carrier === 'fur') {
        const end = trip.arrived ? l.dropX : l.critter.x + 170;
        if (t < FUR.hop) x = l.critter.x;
        else if (t < FUR.walk) x = lerp(l.critter.x, end, (t - FUR.hop) / (FUR.walk - FUR.hop));
        else if (t < FUR.drop) x = end;
        else if (t < FUR.exit) x = lerp(end, this.view.w + 160, (t - FUR.drop) / (FUR.exit - FUR.drop));
        else x = lerp(-160, l.critter.x, (t - FUR.exit) / (1 - FUR.exit));
      }
      c.position.set(x, l.critter.y);
    }
    for (const u of this.round.order) {
      const s = this.seeds[u];
      if (!s) continue;
      const p = this.seedAt(u, l);
      const lifted = this.state.chosen.unit === u ? -16 : 0;
      s.position.set(p.x, p.y + lifted);
      s.eventMode = this.state.place[u] === 'tray' && this.shown?.unit !== u ? 'none' : 'static';
    }
    const chosen = this.state.chosen.unit && this.seeds[this.state.chosen.unit];
    this.ring.visible = !!chosen;
    if (chosen) this.ring.position.set(chosen.x, chosen.y);
    const carrier = this.state.chosen.carrier;
    if (this.bellows) this.bellows.alpha = carrier === 'fur' ? 0.75 : 1;
    if (c) c.alpha = carrier === 'breeze' ? 0.8 : 1;
    // The help glow: on the next useful control while one is up (a requested hint, or two stays in a row).
    const target = this.state.glow && !this.busy ? this.state.hintAction() : null;
    const at = target ? this.targetPoint(target) : carrier ? this.carrierPoint(carrier) : null;
    this.glow.visible = !!at;
    if (at) {
      this.glow.position.set(at.x, at.y);
      this.glow.tint = target ? 0xffffff : 0xbfffd0;
      this.glow.alpha = 0.55 + 0.35 * Math.sin(this.clock * 5);
    }
    if (this.basket) {
      this.basket.visible = this.state.arrivedOnce && !this.state.finished;
      this.basket.y = l.basket.y + Math.sin(this.clock * 3) * 6;
    }
  }

  /** Where a seed is drawn right now. */
  private seedAt(u: Unit, l: SeedLayout): Pt {
    const trip = this.shown;
    const c = this.critter;
    const onBack = (): Pt =>
      c ? { x: c.x + BACK.x * CRITTER_SCALE, y: c.y + BACK.y * CRITTER_SCALE } : l.patch[u];
    if (trip && trip.unit === u) {
      const t = this.anim.t;
      if (trip.carrier === 'breeze') {
        if (trip.replay && this.anim.back < 1) {
          const b = ease.inOutSine(this.anim.back);
          return {
            x: lerp(l.inTray[u].x, l.patch[u].x, b),
            y: lerp(l.inTray[u].y, l.patch[u].y, b) - Math.sin(b * Math.PI) * 120,
          };
        }
        return tripPoint(l, trip, ease.inOutSine(t));
      }
      const home = l.patch[u];
      if (t < FUR.hop && this.level !== 2) {
        const k = t / FUR.hop;
        const b = onBack();
        return { x: lerp(home.x, b.x, k), y: lerp(home.y, b.y, k) - Math.sin(k * Math.PI) * 90 };
      }
      if (!trip.arrived) {
        const k = (t - FUR.hop) / (FUR.walk - FUR.hop);
        if (k < 0.35) return onBack();
        const b = onBack();
        const s = (k - 0.35) / 0.65;
        return { x: lerp(b.x, home.x, s), y: lerp(b.y, home.y, s) - Math.sin(Math.min(1, s) * Math.PI) * 50 };
      }
      if (t < FUR.walk) return onBack();
      if (t < FUR.drop) {
        const b = { x: l.dropX + BACK.x * CRITTER_SCALE, y: l.critter.y + BACK.y * CRITTER_SCALE };
        const k = (t - FUR.walk) / (FUR.drop - FUR.walk);
        return { x: lerp(b.x, l.inTray[u].x, k), y: lerp(b.y, l.inTray[u].y, k) };
      }
      return l.inTray[u];
    }
    const at = this.state.place[u];
    return at === 'tray' ? l.inTray[u] : at === 'fur' ? onBack() : l.patch[u];
  }

  private carrierPoint(c: Carrier): Pt | null {
    const l = this.layout;
    if (!l) return null;
    if (c === 'breeze') return this.bellows ? { x: this.bellows.x, y: this.bellows.y } : null;
    return this.critter ? { x: this.critter.x, y: this.critter.y + BODY_Y * CRITTER_SCALE } : null;
  }

  private targetPoint(t: Target): Pt | null {
    if ('finish' in t) return this.basket ? { x: this.basket.x, y: this.basket.y } : null;
    if ('carrier' in t) return this.carrierPoint(t.carrier);
    const s = this.seeds[t.unit];
    return s ? { x: s.x, y: s.y } : null;
  }

  private targetObject(t: Target): Container | null {
    if ('finish' in t) return this.basket;
    if ('carrier' in t) return t.carrier === 'breeze' ? this.bellows : this.critter;
    return this.seeds[t.unit] ?? null;
  }

  // ----- taps -----

  private tapUnit(u: Unit) {
    if (this.busy || this.finished) return;
    const s = this.seeds[u];
    if (s) this.bump(s);
    const o = this.state.tapUnit(u);
    if (o.kind === 'name') void this.say(u === 'plume' ? 'seeds.name.plume' : 'seeds.name.burr');
    else if (o.kind === 'which') void this.say(o.ask === 'seed' ? 'seeds.which.seed' : 'seeds.which.helper');
    else if (o.kind === 'load') this.loaded();
    else if (o.kind === 'trip') void this.run(o.trip);
    else if (o.kind === 'chose') sfx.pop(5);
    if (o.kind === 'which') sfx.pop(7);
  }

  private tapCarrier(c: Carrier) {
    if (this.busy || this.finished) return;
    if (c === 'breeze' && this.bellows) this.squash(this.bellows);
    if (c === 'fur') this.critter?.poke();
    const o = this.state.tapCarrier(c);
    if (o.kind === 'trip') void this.run(o.trip);
    else if (o.kind === 'load-first') void this.say('seeds.load.first');
    else if (o.kind === 'which') {
      sfx.pop(7);
      void this.say(o.ask === 'seed' ? 'seeds.which.seed' : 'seeds.which.helper');
    } else if (o.kind === 'chose') sfx.pop(5);
  }

  private tapFinish() {
    if (this.busy || this.finished) return;
    if (this.state.tapFinish().kind === 'finish') void this.finale();
  }

  /** Level 2: the burr hops onto the critter's fur, and a close-up shows its hooks caught in the fur. */
  private loaded() {
    sfx.pop(8);
    const c = this.critter;
    if (!c) return;
    const bubble = new Container();
    bubble.eventMode = 'none';
    const g = new Graphics();
    g.circle(0, 0, 70).fill(0xffffff).stroke({ width: 5, color: 0x2b2b3a, alpha: 0.5 });
    for (let i = 0; i < 12; i++) {
      const x = -55 + i * 10;
      g.moveTo(x, 60)
        .quadraticCurveTo(x + 14, 10, x + 4, -40)
        .stroke({ width: 5, color: c.sw.fill, cap: 'round' });
    }
    bubble.addChild(g);
    const burr = burrArt();
    burr.scale.set(0.9);
    burr.y = -6;
    bubble.addChild(burr);
    bubble.position.set(c.x + 120, c.y - 250);
    bubble.scale.set(0.2);
    this.world.addChild(bubble);
    const e = this.epoch;
    void this.ctx.tw
      .to(bubble.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack })
      .then(async () => {
        if (bubble.destroyed) return;
        await this.ctx.tw.wait(1.4);
        if (!this.alive || e !== this.epoch || bubble.destroyed) return;
        await this.ctx.tw.to(bubble, { alpha: 0 }, { duration: 0.4 });
        if (!bubble.destroyed) bubble.destroy({ children: true });
      });
  }

  // ----- a trip -----

  private async run(trip: Trip) {
    this.busy = true;
    this.shown = trip;
    this.anim.t = 0;
    this.anim.back = trip.replay ? 0 : 1;
    const e = this.epoch;
    const ok = () => this.alive && e === this.epoch;
    if (trip.carrier === 'breeze') {
      if (trip.replay) {
        void this.say('seeds.again');
        await this.ctx.tw.to(this.anim, { back: 1 }, { duration: 0.8 });
        if (!ok()) return;
      }
      this.puff();
      sfx.whoosh();
      await this.ctx.tw.to(this.anim, { t: 1 }, { duration: trip.arrived ? 2.2 : 1.4 });
      if (!ok()) return;
      await this.landed();
    } else {
      sfx.pop(8);
      await this.ctx.tw.to(this.anim, { t: FUR.drop }, { duration: 2.6 });
      if (!ok()) return;
      const said = this.landed(false);
      await this.ctx.tw.to(this.anim, { t: FUR.exit }, { duration: 0.8 });
      if (!ok()) return;
      // A new furry friend strolls in from the left.
      if (this.critter) {
        this.ctx.untrack(this.critter);
        this.critter.destroy({ children: true });
        this.critter = null;
      }
      this.critterKind = FURRY[(FURRY.indexOf(this.critterKind) + 1) % FURRY.length];
      this.makeCritter();
      await this.ctx.tw.to(this.anim, { t: 1 }, { duration: 1.1 });
      if (!ok()) return;
      await said;
      if (!ok()) return;
    }
    this.shown = null;
    this.busy = false;
    if (this.state.done) void this.finale();
  }

  /** The seed has arrived or stayed: record it, say why, and (at level 1, the first time) bring out the basket. */
  private async landed(wait = true) {
    const first = !this.state.arrivedOnce;
    const t = this.state.land();
    if (!t) return;
    if (this.level === 3) this.refreshBoard();
    if (t.arrived) void this.rise();
    const line: LineId = t.arrived
      ? t.carrier === 'breeze'
        ? 'seeds.arrived.breeze'
        : 'seeds.arrived.fur'
      : t.carrier === 'breeze'
        ? 'seeds.stayed.breeze'
        : 'seeds.stayed.fur';
    if (!t.arrived) sfx.squish();
    const e = this.epoch;
    const said = this.say(line).then(() => {
      if (this.alive && e === this.epoch && this.level === 1 && first && t.arrived)
        void this.ctx.instruct('seeds.finish');
    });
    if (wait) await said;
    return said;
  }

  private refreshBoard() {
    const l = this.layout;
    if (!l || !this.boardLayer) return;
    const i = this.world.getChildIndex(this.boardLayer);
    this.boardLayer.destroy({ children: true });
    this.buildBoard(l);
    this.world.setChildIndex(this.boardLayer!, i);
  }

  /** A short pentatonic rise on each arrival. */
  private async rise() {
    const e = this.epoch;
    for (const step of [5, 7, 9]) {
      if (!this.alive || e !== this.epoch) return;
      sfx.bell(step);
      await this.ctx.tw.wait(0.14);
    }
  }

  private puff() {
    const b = this.bellows;
    if (!b) return;
    b.puffs.alpha = 1;
    b.puffs.x = 0;
    void this.ctx.tw.to(b.puffs, { alpha: 0, x: 40 }, { duration: 0.7 });
  }

  private squash(b: BellowsArt) {
    void this.ctx.tw.to(b.body.scale, { x: 0.8 }, { duration: 0.1 }).then(() => {
      if (!b.destroyed) void this.ctx.tw.to(b.body.scale, { x: 1 }, { duration: 0.25, ease: ease.outBack });
    });
  }

  private bump(s: Container) {
    void this.ctx.tw.to(s.scale, { x: 1.15, y: 1.15 }, { duration: 0.1 }).then(() => {
      if (!s.destroyed) void this.ctx.tw.to(s.scale, { x: 1, y: 1 }, { duration: 0.2 });
    });
  }

  private say(id: LineId) {
    return this.ctx.say(id);
  }

  // ----- help, restart, finish -----

  hintLabel = 'Show a hint';

  askForHint() {
    if (this.busy || this.finished) return;
    if (!this.state.askHint()) return;
    void this.say('seeds.hint');
  }

  /** Start again: every seed back on the patch, the board cleared; hints already counted stay. */
  restart() {
    if (this.finished) return;
    this.epoch++;
    this.ctx.tw.kill(this.anim);
    this.anim.t = 0;
    this.anim.back = 1;
    this.shown = null;
    this.busy = false;
    this.state.restart();
    this.build();
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    this.busy = true;
    sfx.tada();
    this.ctx.pet.cheer();
    this.critter?.cheer();
    if (this.level === 3) await this.say('seeds.done');
    await this.ctx.tw.wait(0.8);
    if (this.alive) this.ctx.finish({ misses: 0, hints: this.state.hints });
  }

  // ----- the ghost finger -----

  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || !this.layout) return null;
    const s = this.state;
    // Level 3 first shows a pairing that does not travel: the fluffy seed with the critter.
    if (this.level === 3 && !s.tried('plume', 'fur') && s.place.plume === 'patch' && !s.chosen.carrier) {
      const on = s.chosen.unit === 'plume' ? this.critter : this.seeds.plume;
      if (on && (s.chosen.unit === 'plume' || !s.chosen.unit)) return { tap: { on }, pause: 0.8 };
    }
    const target = s.hintAction();
    const on = target && this.targetObject(target);
    return on ? { tap: { on }, pause: 0.8 } : null;
  }
}

class SeedIcon extends WigglyIcon {
  constructor() {
    const art = iconArt(200);
    art.y = -100;
    super(art);
    this.hitArea = new Circle(0, -100, 110);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  return iconArt(150, rng.pick([0xbfe6ff, 0xffd9c2, 0xd9ccff, 0xc8f0e0]));
}

export const seedTravelers: GameModule = {
  id: 'seed-travelers',
  name: 'Seed Travelers',
  titleLine: 'game.seed-travelers',
  region: 'tinker-lab',
  challenge: 'noticing',
  skills: ['science', 'observation', 'cause and effect', 'living things'],
  bands: ['toddler', 'preschool', 'prek'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.hub,
  touchDemo: true,
  coplayHint:
    'Point to where you think the seed will end up, the hill or the tray, and let {name} tap the helper; then swap.',
  offScreen: {
    all: 'Draw a seed together and talk about how it might travel: on the wind, or caught in fur?',
    // Under 3: no small loose object; blowing like the bellows carries the same idea.
    toddler: 'Blow gently together like the wind, and say where the wind could carry something light.',
  },
  hubIcon: () => new SeedIcon(),
  sticker,
  create: (ctx) => new SeedTravelers(ctx),
};
