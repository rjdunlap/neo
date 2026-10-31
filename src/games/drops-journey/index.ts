import { Container, Graphics, Rectangle } from 'pixi.js';
import { frogArt } from '../../art/animals';
import { swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { LineId } from '../../content/voice-script';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { WigglyIcon, tile } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  badgeArt, bookArt, cardArt, chevronArt, dropArt, landArt, leafArt, paintCard, placeIcon, postcardArt, ringArt, stripCard, sunArt,
} from './art';
import {
  BOOK, CARD_H, CARD_W, LEAF, LEVELS, MOVES, maxCards, PLACES, STATE, canFinish, enough, here, hintFor, isLawful, journeyLayout, makeRound, moveTo,
  moves, offer, planFor, step, stickerPlace, type Choice, type Driver, type Journey, type Layout, type Place, type Plan, type Process,
  type Round,
} from './logic';

/** Each level's authored first round leads its first round of a session. */
const authoredShown = new Set<number>();

/** Spoken names, for "{place}". */
const SPOKEN: Record<Place, string> = { sea: 'sea', cloud: 'cloud', river: 'river', snow: 'snowy mountain top', ground: 'ground under the hill' };
const SHORT: Record<Process, LineId> = {
  evaporate: 'drop.evaporate', rain: 'drop.rain', rainsoak: 'drop.rainsoak', snowfall: 'drop.snowfall',
  melt: 'drop.melt', sublimate: 'drop.sublimate', flow: 'drop.flow', seep: 'drop.seep',
};
const LONG: Record<Process, LineId> = {
  evaporate: 'drop.evaporate.why', rain: 'drop.rain.why', rainsoak: 'drop.rainsoak.why', snowfall: 'drop.snowfall.why',
  melt: 'drop.melt.why', sublimate: 'drop.sublimate.why', flow: 'drop.flow.why', seep: 'drop.seep.why',
};
const HINT: Record<Process | 'stay', LineId> = {
  evaporate: 'drop.hint.up', sublimate: 'drop.hint.up', melt: 'drop.hint.melt', snowfall: 'drop.hint.cold',
  rain: 'drop.hint.down', rainsoak: 'drop.hint.down', flow: 'drop.hint.down', seep: 'drop.hint.down', stay: 'drop.hint.stay',
};
const stayLine = (p: Place): LineId => (p === 'cloud' || p === 'river' ? 'drop.stay.while' : 'drop.stay.long');
const MOVE_TIME = 1.5;

function driverOf(c: Choice): Driver | 'stay' | null {
  if (c.kind === 'move') return c.driver;
  return c.kind === 'stay' ? 'stay' : null;
}

class DropsJourney implements Game {
  readonly plan: Plan;
  readonly round: Round;
  journey: Journey;
  cards: Choice[] = [];
  /** Can't-go cards already tried at this stop (greyed, still on screen). */
  readonly tried = new Set<number>();
  misses = 0;
  hints = 0;
  /** The causal glow (level 3, after two misses in the round): every lawful card glows with its driver's badge. */
  glowOn = false;
  /** The card the requested hint points at, until the next stop. */
  pointing: number | null = null;
  busy = false;
  finished = false;
  replaying = false;
  readonly cardNodes: Container[] = [];
  readonly book: Container;
  readonly leaf: Container;
  private readonly cardBacks: Graphics[] = [];
  private readonly badges: Container[] = [];
  private layoutNow: Layout;
  private clock = 0;
  private saidVapour = false;
  private saidEnough = false;
  private reached = false;
  private readonly backdrop: Backdrop;
  private land: Graphics;
  private readonly sun: Container;
  private readonly rings = new Container();
  private readonly cardLayer = new Container();
  private readonly strip = new Container();
  private readonly glowRing = new Graphics();
  private readonly chevron = chevronArt();
  private readonly dropNode = new Container();
  private readonly postcard: Container | null;
  /** The drop's flight in progress: a curve from a to b over c, at t. */
  private readonly authoredFirstStop: boolean;
  private flight: { ax: number; ay: number; bx: number; by: number; cx: number; cy: number; t: number } | null = null;

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    const first = ctx.demo || !authoredShown.has(this.plan.level);
    if (first && !ctx.demo) authoredShown.add(this.plan.level);
    this.round = makeRound(this.plan.level, ctx.rng, first);
    this.authoredFirstStop = first;
    this.journey = { start: this.round.start, stops: [] };
    this.backdrop = new Backdrop({ sky: [0xcfeaff, 0xfff6e0], hills: [0xd6efc8, 0xc5e7a8], horizon: 0.9, clouds: 0, sun: false, seed: 151 }, ctx.view);
    this.layoutNow = journeyLayout(ctx.view, maxCards(this.plan.level))!;
    this.land = landArt(this.layoutNow);
    this.sun = sunArt();
    this.book = bookArt(BOOK);
    this.book.hitArea = new Rectangle(-BOOK / 2, -BOOK / 2, BOOK, BOOK);
    onTap(this.book, () => this.tapBook());
    this.leaf = leafArt(LEAF);
    this.leaf.hitArea = new Rectangle(-LEAF / 2, -LEAF / 2, LEAF, LEAF);
    this.leaf.visible = false;
    onTap(this.leaf, () => this.tapLeaf());
    this.postcard = this.round.goal ? postcardArt(this.round.goal, frogArt(), LEAF) : null;
    if (this.postcard) this.postcard.eventMode = 'none';
    for (const n of [this.land, this.sun, this.rings, this.strip, this.glowRing, this.chevron, this.dropNode]) n.eventMode = 'none';
    this.chevron.visible = false;
    ctx.stage.addChild(this.backdrop, this.land, this.sun, this.rings, this.strip, this.book, this.leaf, this.cardLayer, this.glowRing, this.chevron, this.dropNode);
    if (this.postcard) ctx.stage.addChild(this.postcard);
    for (let i = 0; i < PLACES.length; i++) this.rings.addChild(ringArt());
    this.setLook(STATE[this.round.start]);
    this.dealCards();
    this.resize(ctx.view);
  }

  /** What a scripted play reads. */
  get state() {
    return {
      level: this.plan.level, start: this.round.start, goal: this.round.goal, at: here(this.journey), stops: this.journey.stops.length,
      moves: moves(this.journey), cards: this.cards.map((c) => (c.kind === 'stay' ? 'stay' : c.kind === 'cant' ? `cant:${c.to}` : c.to)),
      tried: [...this.tried], misses: this.misses, hints: this.hints, glowOn: this.glowOn, pointing: this.pointing, canFinish: this.canFinish,
      leaf: this.leaf.visible, busy: this.busy, replaying: this.replaying, finished: this.finished,
    };
  }

  /** Level 2 stays finishable once the drop has reached the postcard's place, even if it wanders on. */
  get canFinish() { return this.reached || canFinish(this.round, this.journey); }

  start() { void this.instruct(); }

  private instruct() {
    const p = this.plan.level;
    return p === 2 ? this.ctx.instruct('drop.instruct.2', { place: SPOKEN[this.round.goal!] }) : this.ctx.instruct(p === 1 ? 'drop.instruct.1' : 'drop.instruct.3');
  }

  destroy() {
    this.finished = true;
    this.flight = null;
    this.ctx.tw.kill(this.dropNode);
    this.ctx.tw.kill(this.sun.scale);
    for (const n of this.cardNodes) this.ctx.tw.kill(n.scale);
  }

  // ---- cards ----

  private dealCards() {
    const from = here(this.journey);
    this.cards = offer(this.plan.level, from, this.ctx.rng, this.authoredFirstStop && this.journey.stops.length === 0);
    this.tried.clear();
    this.pointing = null;
    this.cardLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.cardNodes.length = 0; this.cardBacks.length = 0; this.badges.length = 0;
    this.cards.forEach((c, i) => {
      const { node, back } = cardArt(c.kind === 'stay' ? 'stay' : c.to, CARD_W, CARD_H);
      node.hitArea = new Rectangle(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H);
      onTap(node, () => this.tapCard(i));
      const d = driverOf(c);
      const badge = d ? badgeArt(d, 40) : new Container();
      badge.position.set(CARD_W / 2 - 24, -CARD_H / 2 + 24);
      badge.visible = this.glowOn;
      node.addChild(badge);
      this.cardLayer.addChild(node);
      this.cardNodes.push(node); this.cardBacks.push(back); this.badges.push(badge);
    });
    this.placeCards();
  }

  private placeCards() {
    const l = journeyLayout(this.ctx.view, this.cards.length) ?? this.layoutNow;
    this.cardNodes.forEach((n, i) => n.position.set(l.cards[i].x, l.cards[i].y));
  }

  private tapCard(i: number) {
    if (this.busy || this.finished || this.replaying) return;
    const node = this.cardNodes[i];
    if (!node || this.tried.has(i)) return;
    this.ctx.tw.kill(node.scale);
    node.scale.set(0.92);
    void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.22, ease: ease.outBack });
    const c = this.cards[i];
    const r = step(this.journey, c);
    if ('wrong' in r) { void this.cantGo(i, c as Extract<Choice, { kind: 'cant' }>); return; }
    void this.travel(c, r.journey);
  }

  private async cantGo(i: number, c: Extract<Choice, { kind: 'cant' }>) {
    this.busy = true;
    this.misses++;
    this.tried.add(i);
    paintCard(this.cardBacks[i], CARD_W, CARD_H, true);
    this.cardNodes[i].alpha = 0.6;
    if (this.pointing === i) this.pointing = null;
    // A short try: the drop starts up the slope and slides back.
    const from = this.layoutNow.places[here(this.journey)], to = this.layoutNow.places[c.to];
    const sx = this.dropNode.x, sy = this.dropNode.y;
    await this.ctx.tw.to(this.dropNode, { x: sx + (to.x - from.x) * 0.25, y: sy + (to.y - from.y) * 0.25 }, { duration: 0.45, ease: ease.outQuad });
    if (this.finished) return;
    sfx.boing();
    await this.ctx.tw.to(this.dropNode, { x: sx, y: sy }, { duration: 0.4, ease: ease.outBack });
    if (this.finished) return;
    this.busy = false;
    await this.ctx.say('drop.uphill');
    if (this.finished) return;
    if (this.misses >= 2 && !this.glowOn) {
      this.glowOn = true;
      this.hints++;
      for (const b of this.badges) b.visible = true;
      await this.ctx.say('drop.glow');
    }
  }

  // ---- moving ----

  private setLook(look: Parameters<typeof dropArt>[0]) {
    this.dropNode.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.dropNode.addChild(dropArt(look));
  }

  /** Play one stop: the drop moves (or rests), the strip grows, the pet says the line. */
  private async travel(c: Choice, next: Journey) {
    this.busy = true;
    this.pointing = null;
    const from = here(this.journey);
    this.journey = next;
    const stop = next.stops[next.stops.length - 1];
    this.addStrip(stop.place, driverOf(c));
    const line = c.kind === 'move' ? (this.plan.level === 3 ? LONG[c.process] : SHORT[c.process]) : stayLine(from);
    const said = this.ctx.say(line);
    if (c.kind === 'move') {
      if (c.driver === 'warm' && c.to === 'cloud' && !this.saidVapour) { this.saidVapour = true; void said.then(() => this.finished ? undefined : this.ctx.say('drop.vapour')); }
      await this.animateMove(from, c.to, c.process, c.driver, MOVE_TIME);
    } else {
      sfx.marimba(0, 0.3);
      await this.ctx.tw.to(this.dropNode.scale, { x: 1.12, y: 0.9 }, { duration: 0.35, ease: ease.outQuad });
      if (this.finished) return;
      await this.ctx.tw.to(this.dropNode.scale, { x: 1, y: 1 }, { duration: 0.35, ease: ease.outBack });
    }
    if (this.finished) return;
    await this.afterStop(said);
  }

  private async animateMove(from: Place, to: Place, process: Process, driver: Driver, time: number) {
    const l = this.layoutNow;
    const a = l.places[from], b = l.places[to];
    const rising = driver === 'warm' && to === 'cloud';
    this.setLook(rising ? 'vapour' : process === 'snowfall' ? 'ice' : process === 'melt' ? 'liquid' : STATE[from] === 'cloud' ? 'liquid' : STATE[from]);
    if (driver === 'warm') {
      this.ctx.tw.kill(this.sun.scale);
      this.sun.scale.set(1.25);
      void this.ctx.tw.to(this.sun.scale, { x: 1, y: 1 }, { duration: time, ease: ease.outQuad });
    }
    this.chevron.visible = driver !== 'warm' || process === 'melt';
    this.notes(rising || process === 'sublimate' ? 'up' : process === 'snowfall' ? 'chime' : 'down', time);
    const midX = (a.x + b.x) / 2, midY = Math.min(a.y, b.y) - (rising ? 40 : 10);
    this.flight = { ax: a.x, ay: a.y, bx: b.x, by: b.y, cx: rising ? a.x : midX, cy: rising ? midY : (process === 'flow' || process === 'melt' || process === 'seep' ? (a.y + b.y) / 2 + 30 : midY), t: 0 };
    await this.ctx.tw.to(this.flight, { t: 1 }, { duration: time, ease: ease.inOutSine });
    if (this.finished) return;
    this.flight = null;
    this.chevron.visible = false;
    this.dropNode.position.set(b.x, b.y);
    this.setLook(STATE[to]);
  }

  private notes(kind: 'up' | 'down' | 'chime', time: number) {
    const steps = kind === 'up' ? [2, 4, 6, 8] : kind === 'down' ? [8, 6, 4, 2] : [10, 12];
    steps.forEach((s, k) => {
      void this.ctx.tw.wait((k * time) / (steps.length + 1)).then(() => {
        if (this.finished) return;
        if (kind === 'chime') sfx.bell(s, 0.2); else sfx.pluck(s, 0.25);
      });
    });
  }

  /** `said` is the stop's own line: the postcard, a repeated request or the leaf line waits for it rather than cut it off. */
  private async afterStop(said: Promise<void>) {
    if (this.round.level === 2 && !this.reached && this.canFinish) {
      this.reached = true;
      sfx.bell(7, 0.3);
      this.ctx.particles.burst(this.dropNode.x, this.dropNode.y, { kind: 'star', colors: [swatch.yellow.fill, swatch.blue.fill, 0xffffff], count: 16, speed: [100, 240], gravity: 300, life: [0.4, 0.8] });
      if (this.postcard) this.postcard.visible = false;
    }
    this.leaf.visible = this.canFinish;
    this.dealCards();
    this.busy = false;
    const stops = this.journey.stops.length;
    await said;
    // She may already have tapped on to another stop; that stop speaks for itself.
    if (this.finished || this.journey.stops.length !== stops) return;
    if (this.reached && this.round.level === 2 && this.journey.stops.length && here(this.journey) === this.round.goal) {
      await this.ctx.say('drop.postcard', { place: SPOKEN[this.round.goal!] });
    } else if (this.round.level === 2 && !this.reached && this.journey.stops.length % 4 === 0) {
      // A long wander: the postcard stays pinned and the pet repeats the request.
      await this.instruct();
    }
    if (this.finished) return;
    if (!this.saidEnough && enough(this.round, this.journey)) { this.saidEnough = true; await this.ctx.say('drop.done'); }
  }

  private addStrip(place: Place, badge: Driver | 'stay' | null) {
    this.strip.addChild(stripCard(place, badge));
    this.layoutStrip();
  }

  /** At most six stops show; older ones slide off the left. The start leads the strip without a badge. */
  private layoutStrip() {
    const s = this.layoutNow.strip;
    const kids = this.strip.children;
    if (kids.length === 0) this.strip.addChild(stripCard(this.journey.start, null));
    const room = Math.max(1, Math.min(6, Math.floor(s.w / 80)));
    const first = Math.max(0, kids.length - room);
    kids.forEach((k, i) => {
      k.visible = i >= first;
      k.position.set(s.x - s.w / 2 + 40 + (i - first) * 80, s.y);
    });
  }

  // ---- the book and the leaf ----

  private async tapBook() {
    if (this.busy || this.finished || this.replaying || this.journey.stops.length === 0) return;
    this.replaying = true;
    this.pointing = null;
    sfx.whoosh();
    const l = this.layoutNow;
    this.dropNode.position.set(l.places[this.journey.start].x, l.places[this.journey.start].y);
    this.setLook(STATE[this.journey.start]);
    let at = this.journey.start;
    for (const s of this.journey.stops) {
      if (this.finished) return;
      if (s.via === 'stay') {
        await this.ctx.say(stayLine(at));
      } else {
        const m = moveTo(at, s.place)!;
        await Promise.all([this.animateMove(at, s.place, m.process, m.driver, MOVE_TIME / 2), this.ctx.say(LONG[m.process])]);
      }
      at = s.place;
    }
    if (this.finished) return;
    this.replaying = false;
  }

  private tapLeaf() {
    if (this.finished || this.busy || this.replaying || !this.canFinish) return;
    this.finished = true;
    sfx.tada();
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  // ---- help ----

  readonly hintLabel = 'Show me';

  askForHint() {
    if (this.busy || this.finished || this.replaying) return;
    const i = hintFor(this.round, here(this.journey), this.cards, this.tried);
    if (this.pointing !== i) this.hints++;
    this.pointing = i;
    const c = this.cards[i];
    void this.ctx.say(HINT[c.kind === 'move' ? c.process : 'stay']);
  }

  restart() {
    if (this.finished) return;
    const go = () => {
      if (this.finished) return;
      if (this.busy || this.replaying) { void this.ctx.tw.wait(0.2).then(go); return; }
      this.journey = { start: this.round.start, stops: [] };
      this.reached = false;
      this.saidEnough = false;
      this.leaf.visible = false;
      if (this.postcard) this.postcard.visible = true;
      this.strip.removeChildren().forEach((c) => c.destroy({ children: true }));
      this.layoutStrip();
      const p = this.layoutNow.places[this.round.start];
      this.dropNode.position.set(p.x, p.y);
      this.setLook(STATE[this.round.start]);
      this.dealCards();
    };
    go();
  }

  // ---- shell hooks ----

  resize(view: View) {
    const l = this.layoutNow = journeyLayout(view, maxCards(this.plan.level)) ?? this.layoutNow;
    this.backdrop.resize(view);
    const old = this.land;
    this.land = landArt(l);
    this.land.eventMode = 'none';
    this.ctx.stage.addChildAt(this.land, this.ctx.stage.getChildIndex(old));
    old.destroy();
    this.sun.position.set(l.sun.x, l.sun.y);
    PLACES.forEach((p, i) => this.rings.children[i].position.set(l.places[p].x, l.places[p].y));
    if (!this.flight) { const p = l.places[here(this.journey)]; this.dropNode.position.set(p.x, p.y); }
    this.book.position.set(l.book.x, l.book.y);
    this.leaf.position.set(l.leaf.x, l.leaf.y);
    this.postcard?.position.set(l.postcard.x, l.postcard.y);
    this.layoutStrip();
    this.placeCards();
  }

  update(dt: number) {
    this.clock += dt;
    const f = this.flight;
    if (f) {
      const t = f.t, u = 1 - t;
      this.dropNode.position.set(u * u * f.ax + 2 * u * t * f.cx + t * t * f.bx, u * u * f.ay + 2 * u * t * f.cy + t * t * f.by);
      this.chevron.position.set(this.dropNode.x, this.dropNode.y + 58);
    }
    this.glowRing.clear();
    if (this.finished || this.busy || this.replaying) return;
    const pulse = 6 + 4 * Math.sin(this.clock * 5);
    const ring = (n: Container, w: number, h: number) => this.glowRing.roundRect(n.x - w / 2 - pulse, n.y - h / 2 - pulse, w + 2 * pulse, h + 2 * pulse, 28).stroke({ width: 7, color: swatch.yellow.fill });
    if (this.glowOn) this.cards.forEach((c, i) => { if (isLawful(c)) ring(this.cardNodes[i], CARD_W, CARD_H); });
    else if (this.pointing !== null && this.cardNodes[this.pointing]) ring(this.cardNodes[this.pointing], CARD_W, CARD_H);
    if (this.leaf.visible && this.saidEnough) ring(this.leaf, LEAF, LEAF);
  }

  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.replaying) return null;
    const level = this.round.level;
    if (this.canFinish && (level !== 3 || moves(this.journey) >= 4)) return { tap: { on: this.leaf }, pause: 0.6 };
    let i: number;
    if (level === 2) i = hintFor(this.round, here(this.journey), this.cards, this.tried);
    else {
      // Keep travelling: a lawful move away from where the drop just came from.
      const prev = this.journey.stops.length > 1 ? this.journey.stops[this.journey.stops.length - 2].place : this.journey.start;
      const ok = this.cards.map((c, k) => ({ c, k })).filter(({ c }) => c.kind === 'move');
      i = (ok.find(({ c }) => c.kind === 'move' && c.to !== prev && this.journey.stops.length > 0) ?? ok[0]).k;
    }
    return { tap: { on: this.cardNodes[i] }, pause: 0.6 };
  }
}

function icon(): Container {
  const c = new Container();
  const cloud = placeIcon('cloud', 150); cloud.y = -90;
  const sea = placeIcon('sea', 160); sea.y = 70;
  const arc = new Graphics();
  for (let k = 0; k < 7; k++) { const t = k / 6; arc.circle(-60 + t * 40 - Math.sin(t * Math.PI) * 20, 40 - t * 110, 6).fill(swatch.blue.line); }
  const d = dropArt('liquid', 80); d.position.set(40, -10);
  c.addChild(sea, cloud, arc, d);
  return c;
}

function sticker(seed: number): Container {
  const c = new Container();
  const place = stickerPlace(seed);
  c.addChild(tile(260, 260, 'white'));
  const pic = placeIcon(place, 200); pic.y = 30;
  const d = dropArt(STATE[place], 90); d.y = -50;
  const into = (Object.keys(MOVES) as Place[]).flatMap((p) => MOVES[p].filter((m) => m.to === place))[0];
  const b = badgeArt(into ? into.driver : 'stay', 56); b.position.set(84, -84);
  c.addChild(pic, d, b);
  return c;
}

export const dropsJourney: GameModule = {
  id: 'drops-journey', name: "Drop's Journey", titleLine: 'game.drops-journey', region: 'tinker-lab',
  skills: ['water', 'states-of-matter', 'cause-and-effect', 'sequencing'], bands: ['preschool', 'prek', 'school'], levels: (b) => rangeFor(LEVELS, b),
  describeLevel: (l) => planFor(l).name,
  music: STYLES.bubbles,
  coplayHint: 'One of you chooses the card; the other tells what made the drop move: the sun, the cold, or downhill. Then swap.',
  offScreen: 'After rain, look for where the water went: puddles, a wet path drying in the sun, water running downhill.',
  hubIcon: () => new WigglyIcon(icon()), sticker, create: (ctx) => new DropsJourney(ctx),
  touchDemo: true,
};
