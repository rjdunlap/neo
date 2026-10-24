import { Container, Graphics, Rectangle } from 'pixi.js';
import { swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { LineId } from '../../content/voice-script';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { finish as finishArt, RoundButton, spring, squash } from '../../ui/buttons';
import { againIcon } from '../../ui/icons';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { arrowShape, badgeArt, cardArt, iconArt, stationArt, webIcon, webPicture } from './art';
import {
  applyHint, BADGE, CARD, caseRecords, check, connect, demoNext, dropTarget, faultRecord, faults, layout, makeRound, newState, planFor,
  restartState, SHOW, STATION_R, undo, type Arrow, type Fault, type FeedingRecord, type Organism, type Pt, type RecordId, type WebState,
} from './logic';

const LEVELS: BandLevels = { school: { min: 1, max: 3 } };

const ASK: Record<number, LineId> = { 1: 'web.ask.make', 2: 'web.ask.turn', 3: 'web.ask.branch' };
const CARD_LINE: Record<RecordId, LineId> = { r1: 'web.card.r1', r2: 'web.card.r2', r3: 'web.card.r3', r4: 'web.card.r4', r5: 'web.card.r5', r6: 'web.card.r6' };
const NAME_LINE: Record<Organism, LineId> = {
  clover: 'web.name.clover', dandelion: 'web.name.dandelion', caterpillar: 'web.name.caterpillar',
  snail: 'web.name.snail', bunny: 'web.name.bunny', bird: 'web.name.bird',
};
const MISS_LINE: Record<Fault['kind'], LineId> = { reversed: 'web.miss.reversed', missing: 'web.miss.missing', extra: 'web.miss.extra' };

const key = (a: Arrow) => `${a.from}>${a.to}`;
const faultKey = (f: Fault) => `${f.kind}:${f.kind === 'extra' ? key(f.arrow) : f.record.id}`;

interface StationNode { organism: Organism; node: Container; badge: Container; handle: DragHandle }
interface CardNode { record: FeedingRecord; node: Container }

class FoodWebWorkshop implements Game {
  readonly s: WebState;
  readonly hintLabel = 'Show a hint';
  readonly stations: StationNode[] = [];
  readonly cards: CardNode[] = [];
  readonly showButton = new Container();
  readonly undoButton: RoundButton;
  /** Cards watched this round, for the ghost finger (which watches before it draws). */
  readonly replayed = new Set<RecordId>();
  busy = true;
  finished = false;

  private readonly backdrop: Backdrop;
  private readonly arrows = new Graphics();
  private readonly glow = new Graphics();
  private readonly stationLayer = new Container();
  private readonly cardLayer = new Container();
  private readonly badgeLayer = new Container();
  private readonly flyLayer = new Container();
  private view: View;
  private clock = 0;
  /** Arrows growing in (or swinging round), 0 → 1. */
  private readonly grow = new Map<string, number>();
  /** The fault that glows after two failed Checks, until it is fixed. */
  private glowKey: string | null = null;
  private showPulse = 0;
  /** During the finish show, the arrow lit now. */
  private lit: string | null = null;
  private replaying = 0;
  private dead = false;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.s = newState(makeRound(ctx.level, ctx.rng));
    this.backdrop = new Backdrop({ sky: [0xbfe9ff, 0xf3fbff], hills: [0xc7ebab, 0x9bd581], horizon: 0.3, clouds: 2, sun: true, seed: 211 }, ctx.view);
    this.arrows.eventMode = 'none';
    this.glow.eventMode = 'none';
    this.flyLayer.eventMode = 'none';

    this.showButton.addChild(finishArt({ w: SHOW.w, h: SHOW.h, corner: 30 }, swatch.green), webPicture());
    this.showButton.hitArea = new Rectangle(-SHOW.w / 2 - 6, -SHOW.h / 2 - 6, SHOW.w + 12, SHOW.h + 12);
    onTap(this.showButton, () => void this.showWeb(), { cooldown: 400 });
    this.undoButton = new RoundButton(againIcon(), swatch.white, 54, () => this.undo());

    for (const record of caseRecords(this.s.round.webCase)) {
      const node = cardArt(record.from, record.to, CARD.w, CARD.h);
      node.hitArea = new Rectangle(-CARD.w / 2, -CARD.h / 2, CARD.w, CARD.h);
      onTap(node, () => void this.replay(record), { cooldown: 300 });
      this.cards.push({ record, node });
      this.cardLayer.addChild(node);
    }
    this.s.round.stations.forEach((organism, i) => {
      const node = stationArt(organism, STATION_R);
      node.hitArea = new Rectangle(-STATION_R, -STATION_R, STATION_R * 2, STATION_R + 12);
      onTap(node, () => this.name(i), { cooldown: 400 });
      this.stationLayer.addChild(node);
      const badge = badgeArt(organism, BADGE);
      badge.hitArea = new Rectangle(-BADGE / 2, -BADGE / 2, BADGE, BADGE);
      this.badgeLayer.addChild(badge);
      const handle = draggable(badge, ctx.tw, {
        onPick: () => sfx.pop(5),
        onDrop: (x, y) => this.drop(i, x, y),
      });
      this.stations.push({ organism, node, badge, handle });
    });
    ctx.stage.addChild(this.backdrop, this.arrows, this.stationLayer, this.glow, this.cardLayer, this.flyLayer, this.badgeLayer, this.showButton, this.undoButton);
  }

  start() {
    this.resize(this.view);
    this.busy = false;
    void this.ctx.instruct(ASK[this.s.round.plan.level]);
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    const L = layout(v, this.cards.length);
    this.cards.forEach((c, i) => c.node.position.set(L.cards[i].x, L.cards[i].y));
    this.stations.forEach((st, i) => {
      st.node.position.set(L.stations[i].x, L.stations[i].y);
      st.handle.home = { ...L.badges[i] };
      if (!st.handle.dragging) {
        this.ctx.tw.kill(st.badge);
        st.badge.position.set(L.badges[i].x, L.badges[i].y);
      }
    });
    this.showButton.position.set(L.show.x, L.show.y);
    this.undoButton.position.set(L.undo.x, L.undo.y);
  }

  update(dt: number) {
    this.clock += dt;
    for (const [k, t] of this.grow) {
      if (t >= 1) this.grow.delete(k);
      else this.grow.set(k, Math.min(1, t + dt * 3));
    }
    if (this.showPulse > 0) this.showPulse -= dt;
    this.undoButton.alpha = this.s.undo.length && !this.finished ? 1 : 0.4;
    this.showButton.alpha = this.s.arrows.length || this.finished ? 1 : 0.55;
    this.drawArrows();
    this.drawGlow();
  }

  destroy() {
    this.dead = true;
    for (const st of this.stations) st.handle.destroy();
  }

  /** The ghost finger: watch each card, then drag its food's badge onto the eater, then Show our web. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.replaying || this.stations.some((st) => st.handle.dragging)) return null;
    const next = demoNext(this.s, this.replayed);
    if (!next) return null;
    if (next === 'show') return { tap: { on: this.showButton }, pause: 1 };
    if ('card' in next) {
      const card = this.cards.find((c) => c.record.id === next.card);
      return card ? { tap: { on: card.node }, pause: 0.3 } : null;
    }
    const from = this.stations.find((st) => st.organism === next.drag.from);
    const to = this.stations.find((st) => st.organism === next.drag.to);
    return from && to ? { drag: { on: from.badge }, to: { on: to.node } } : null;
  }

  restart() {
    if (this.finished) return;
    restartState(this.s);
    this.glowKey = null;
    this.grow.clear();
    sfx.whoosh();
  }

  askForHint() {
    if (this.busy || this.finished) return;
    const h = applyHint(this.s);
    if (!h) return;
    if (h.kind === 'check') {
      this.showPulse = 3;
      void this.ctx.say('web.ready');
      return;
    }
    sfx.sparkle();
    if (h.kind !== 'remove') this.grow.set(key(h.arrow), 0);
    if (h.record) void this.replay(h.record, 'web.hint');
    else void this.ctx.say('web.hint');
  }

  /* -------------------------------------------------------------------------------------------- */

  private center(o: Organism): Pt {
    const st = this.stations.find((s) => s.organism === o)!;
    return { x: st.node.x, y: st.node.y };
  }

  private drop(i: number, x: number, y: number): boolean {
    if (this.finished) return false;
    if (this.busy) return void sfx.tick(), false;
    const target = dropTarget(this.stations.map((st) => ({ x: st.node.x, y: st.node.y })), i, x, y);
    if (target === null) return false;
    const from = this.stations[i].organism, to = this.stations[target].organism;
    const result = connect(this.s, from, to);
    const eater = this.stations[target].node;
    if (result === 'added' || result === 'turned') {
      this.grow.set(key({ from, to }), 0);
      sfx.pop(result === 'turned' ? 9 : 7);
      this.bounce(eater);
      if (result === 'turned') void this.ctx.say('web.turned');
      else if (this.s.round.plan.level === 1) void this.ctx.say('web.arrow');
    } else if (result === 'same') {
      this.grow.set(key({ from, to }), 0.6);
      sfx.tick();
    }
    // The badge is a stamp, not a portion: it always floats home.
    return false;
  }

  private undo() {
    if (this.busy || this.finished) return;
    const c = undo(this.s);
    if (!c) return void sfx.tick();
    sfx.pop(3);
    if (c.kind === 'turn') this.grow.set(key({ from: c.arrow.to, to: c.arrow.from }), 0);
    else if (c.kind === 'remove') this.grow.set(key(c.arrow), 0);
  }

  private name(i: number) {
    if (this.finished) return;
    const st = this.stations[i];
    this.bounce(st.node);
    sfx.pop(6);
    void this.ctx.say(NAME_LINE[st.organism]);
  }

  private bounce(node: Container) {
    this.ctx.tw.kill(node.scale);
    node.scale.set(1.1, 0.9);
    void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.35, ease: ease.outBack });
  }

  /** A card replays: the food glows, its symbol floats into the eater's mouth with a munch, the eater bounces. Nothing moves away. */
  private async replay(record: FeedingRecord, line: LineId = CARD_LINE[record.id]) {
    if (this.finished) return;
    this.replayed.add(record.id);
    const card = this.cards.find((c) => c.record.id === record.id);
    if (card) squash(card.node), spring(card.node, 90);
    this.replaying++;
    const a = this.center(record.from), b = this.center(record.to);
    const fly = iconArt(record.from, 56);
    fly.position.set(a.x, a.y - 20);
    this.flyLayer.addChild(fly);
    const spoken = (async () => {
      if (line !== CARD_LINE[record.id]) await this.ctx.say(line);
      await this.ctx.say(CARD_LINE[record.id]);
    })();
    await this.ctx.tw.to(fly, { x: b.x, y: b.y - 30 }, { duration: 0.9, ease: ease.inOutSine });
    fly.destroy({ children: true });
    if (this.dead) return;
    sfx.munch();
    const eater = this.stations.find((s) => s.organism === record.to);
    if (eater) this.bounce(eater.node);
    await spoken;
    this.replaying = Math.max(0, this.replaying - 1);
  }

  private async showWeb() {
    if (this.busy || this.finished) return;
    if (!this.s.arrows.length) {
      squash(this.showButton), spring(this.showButton, 90);
      sfx.tick();
      return void this.ctx.say(ASK[this.s.round.plan.level]);
    }
    squash(this.showButton), spring(this.showButton, 90);
    const result = check(this.s);
    if (!result) return;
    if (result.ok) return void this.celebrate();
    this.busy = true;
    sfx.boing();
    if (this.s.misses >= 2) this.glowKey = faultKey(result.fault);
    await this.ctx.say(MISS_LINE[result.fault.kind]);
    if (this.dead) return;
    this.busy = false;
    const record = faultRecord(result.fault);
    if (record) void this.replay(record);
  }

  private async celebrate() {
    this.finished = true;
    this.busy = true;
    this.glowKey = null;
    for (const st of this.stations) st.handle.enabled = false;
    const order = caseRecords(this.s.round.webCase);
    for (const [i, r] of order.entries()) {
      this.lit = key(r);
      sfx.bell(4 + i * 2, 0.35);
      const eater = this.stations.find((s) => s.organism === r.to);
      if (eater) this.bounce(eater.node);
      await this.ctx.tw.wait(0.7);
      if (this.dead) return;
    }
    this.lit = null;
    sfx.tada();
    this.ctx.pet.cheer();
    const c = this.center(order[0].to);
    this.ctx.particles.burst(c.x, c.y, { kind: 'star', colors: [swatch.yellow.fill, swatch.green.fill, swatch.orange.fill], count: 18, speed: [80, 240], gravity: 260, life: [0.6, 1.1] });
    await this.ctx.say('web.done');
    if (this.dead) return;
    await this.ctx.tw.wait(0.3);
    this.ctx.finish({ misses: this.s.misses, hints: this.s.hints });
  }

  private drawArrows() {
    const g = this.arrows.clear();
    for (const arrow of this.s.arrows) {
      const a = this.center(arrow.from), b = this.center(arrow.to);
      const t = this.grow.get(key(arrow)) ?? 1;
      const lit = this.lit === key(arrow);
      const color = lit ? swatch.yellow.fill : swatch.orange.fill;
      const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
      const ux = dx / len, uy = dy / len;
      const start = { x: a.x + ux * (STATION_R + 6), y: a.y + uy * (STATION_R + 6) };
      const fullEnd = { x: b.x - ux * (STATION_R + 6), y: b.y - uy * (STATION_R + 6) };
      const end = { x: start.x + (fullEnd.x - start.x) * t, y: start.y + (fullEnd.y - start.y) * t };
      arrowShape(g, start, end, 0xffffff, lit ? 22 : 18, 22, 0);
      arrowShape(g, start, end, color, lit ? 14 : 10, 18, 2);
      // Dots flowing toward the eater: the way the food goes.
      const span = Math.hypot(end.x - start.x, end.y - start.y);
      for (let d = (this.clock * 70) % 40; d < span - 30; d += 40) g.circle(start.x + ux * d, start.y + uy * d, lit ? 6 : 4).fill(0xffffff);
    }
  }

  private drawGlow() {
    const g = this.glow.clear();
    const pulse = 7 + 2 * Math.sin(this.clock * 6);
    if (this.showPulse > 0) g.roundRect(this.showButton.x - SHOW.w / 2 - 10, this.showButton.y - SHOW.h / 2 - 10, SHOW.w + 20, SHOW.h + 20, 34).stroke({ width: pulse, color: swatch.yellow.fill });
    if (!this.glowKey || this.finished) return;
    const f = faults(this.s.arrows, this.s.round.webCase).find((x) => faultKey(x) === this.glowKey);
    if (!f) {
      this.glowKey = null;
      return;
    }
    const pair = f.kind === 'extra' ? f.arrow : f.record;
    for (const o of [pair.from, pair.to]) {
      const c = this.center(o);
      g.circle(c.x, c.y, STATION_R + 12).stroke({ width: pulse, color: swatch.yellow.fill });
    }
    const record = faultRecord(f);
    const card = record && this.cards.find((c) => c.record.id === record.id);
    if (card) g.roundRect(card.node.x - CARD.w / 2 - 10, card.node.y - CARD.h / 2 - 10, CARD.w + 20, CARD.h + 20, 28).stroke({ width: pulse, color: swatch.yellow.fill });
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const round = makeRound(rng.int(1, 3), rng);
  const [a, b] = caseRecords(round.webCase);
  const orgs: [Organism, Organism, Organism] = a.to === b.from ? [a.from, a.to, b.to] : [a.to, a.from, b.to];
  const c = webIcon(orgs);
  c.y = 60;
  return c;
}

export const foodWebWorkshop: GameModule = {
  id: 'food-web-workshop',
  name: 'Food Web Workshop',
  titleLine: 'game.food-web-workshop',
  region: 'tinker-lab',
  skills: ['science', 'models', 'reasoning'],
  bands: ['school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  coplayHint: 'One of you taps a card and tells what you saw; the other makes the arrow. Swap for the next card.',
  offScreen: 'Draw three pictures on paper (a plant, something that eats it, and something that eats that) and join them with arrows from the food to the eater.',
  hubIcon: () => new WigglyIcon(webIcon()),
  touchDemo: true,
  sticker,
  create: (ctx) => new FoodWebWorkshop(ctx),
};
