import { Container, Graphics, Rectangle } from 'pixi.js';
import { swatch, wood } from '../../art/palette';
import { sfx } from '../../audio/sfx';
import type { LineId } from '../../content/voice-script';
import { idle, type CouchControls } from '../../engine/controller';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import type { Game, GameContext, TouchIntent } from '../types';
import { boatArt, marbleBowlArt, marbleDots, thingArt } from './art';
import {
  boatAccepted,
  boatRoundFor,
  hullCapacity,
  hullVerdict,
  sinkPlan,
  type BoatRound,
  type SinkPlan,
} from './logic';

/** How far a boat sits lower for each marble, so a full boat's rim is just above the water. */
const STEP = 36;
/** A boat's wall height, and how deep an empty boat sits. */
const WALL = 60;
const DRAFT = 20;
const MARBLE = 0.5;
/** The largest a cell is drawn, and the smallest a boat's tap target is. */
const CELL_MAX = 96;
const MIN_W = 200;
const GAP = 16;

type Phase = 'guess' | 'pick' | 'load' | 'wait';

/**
 * Build a Boat (level 11, "How much can it carry?"): foil boats of different widths sit in the tank. Round 1 guesses which of
 * a wide and a narrow boat carries more (unscored), then loads each marble by marble until water comes over. Rounds 2 and 3 pick
 * a boat for a pile of marbles and load it. A boat that spills is an observation, never a miss; two spills in a round glow the
 * narrowest boat that carries the pile (one hint).
 */
export class BoatLoad implements Game {
  readonly plan: SinkPlan;
  readonly rounds: BoatRound[];
  round = 0;
  /** Spills are tests, so misses stay zero and only hints count. */
  readonly misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  phase: Phase = 'wait';
  /** Marbles in each boat now. */
  loaded: number[] = [];
  /** The boat being loaded, and how many marbles of the pile are still in the bowl. */
  target = -1;
  spills = 0;
  /** Round 1: her guess, and the counts each boat held before the water came over. */
  guess = -1;
  readonly held: (number | null)[] = [];
  glowBoat: number | null = null;
  pick = 0;

  readonly boats: Container[] = [];
  readonly bowl = new Container();
  private readonly background = new Graphics();
  private readonly bank = new Graphics();
  private readonly water = new Graphics();
  private readonly marks = new Graphics();
  private readonly glow = new Graphics();
  private readonly ring = new Graphics();
  private readonly stacks = new Graphics();
  private readonly bowlArt = new Container();
  private readonly marbleNodes: Container[][] = [];
  private view: View;
  private clock = 0;
  private lastLine: LineId = 'sink.boat-ask';
  private hinted = false;
  private couchOn = false;
  private botWait = 1.2;
  /** How far each boat has dipped beyond the rim, drawn in `update` (the spill). */
  private readonly dip: number[] = [];
  askForHint = () => this.requestHint();
  hintLabel = 'Show a hint';

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = sinkPlan(ctx.level);
    this.rounds = boatRoundFor(this.plan, ctx.rng);
    ctx.stage.addChild(this.background, this.bank, this.water);
    this.bowl.hitArea = new Rectangle(-85, -75, 170, 150);
    this.bowl.addChild(this.bowlArt);
    onTap(this.bowl, () => void this.tapBowl());
    this.bowl.eventMode = 'none';
    for (const g of [this.marks, this.glow, this.ring, this.stacks]) g.eventMode = 'none';
    ctx.stage.addChild(this.stacks, this.bowl, this.marks, this.glow, this.ring);
  }

  private get current() {
    return this.rounds[this.round];
  }

  private get pile() {
    return this.current.pile;
  }

  start() {
    this.resize(this.view);
    void this.begin(0);
  }

  private instruct(line: LineId) {
    this.lastLine = line;
    void this.ctx.instruct(line, { name: this.ctx.childName });
  }

  // Rounds ------------------------------------------------------------------------------

  private async begin(i: number) {
    this.round = i;
    this.busy = true;
    this.phase = 'wait';
    this.spills = 0;
    this.guess = -1;
    this.target = -1;
    this.hinted = false;
    this.glowBoat = null;
    this.held.length = 0;
    this.stacks.clear();
    this.clearBoats();
    this.loaded = this.current.boats.map(() => 0);
    this.held.push(...this.current.boats.map(() => null));
    this.buildBoats();
    this.drawAll();
    const tw = this.ctx.tw;
    for (const b of this.boats) {
      b.alpha = 0;
      void tw.to(b, { alpha: 1 }, { duration: 0.3 });
      sfx.pop(2);
      await tw.wait(0.2);
    }
    if (this.finished) return;
    this.pick = 0;
    this.busy = false;
    this.phase = this.current.pile === null ? 'guess' : 'pick';
    this.live();
    this.instruct(this.current.pile === null ? 'sink.boat-ask' : 'sink.boat-next');
  }

  private clearBoats() {
    for (const b of this.boats) {
      this.ctx.tw.kill(b);
      b.destroy({ children: true });
    }
    this.boats.length = 0;
    this.marbleNodes.length = 0;
    this.dip.length = 0;
  }

  private buildBoats() {
    this.current.boats.forEach((cells, i) => {
      const b = new Container();
      onTap(b, () => void this.tapBoat(i));
      b.eventMode = 'none';
      b.addChild(boatArt(cells, this.cellW(), WALL));
      this.boats.push(b);
      this.marbleNodes.push([]);
      this.dip.push(0);
      this.ctx.stage.addChild(b);
    });
    // Keep the glow and ring above the boats.
    this.ctx.stage.addChild(this.marks, this.glow, this.ring);
  }

  /** Boats take touches only while she can choose or load. */
  private live() {
    const on = !this.finished && (this.phase === 'guess' || this.phase === 'pick');
    for (const b of this.boats) b.eventMode = on ? 'static' : 'none';
    this.bowl.eventMode = !this.finished && this.phase === 'load' ? 'static' : 'none';
  }

  // Choosing and loading -------------------------------------------------------------------

  private async tapBoat(i: number) {
    if (this.busy || this.finished) return;
    if (this.phase === 'guess') {
      // Unscored: either boat just sets what she expects.
      this.guess = i;
      sfx.pop(5);
      return void this.startLoad(i);
    }
    if (this.phase === 'pick') {
      sfx.pop(5);
      this.glowBoat = null;
      return void this.startLoad(i);
    }
  }

  private startLoad(i: number) {
    this.target = i;
    this.phase = 'load';
    this.pick = this.boats.length;
    this.live();
    this.drawAll();
    this.instruct('sink.boat-load');
  }

  private async tapBowl() {
    if (this.busy || this.finished || this.phase !== 'load' || this.target < 0) return;
    const i = this.target;
    const cells = this.current.boats[i];
    const next = this.loaded[i] + 1;
    this.busy = true;
    this.live();
    const verdict = hullVerdict(cells, next);
    if (verdict.kind === 'over') return void (await this.spill(i));
    this.loaded[i] = next;
    await this.dropMarble(i, next - 1);
    if (this.finished) return;
    if (this.pile !== null && next >= this.pile) return void (await this.carried());
    this.busy = false;
    this.live();
  }

  /** One marble falls into boat `i` at slot `k`, and the boat sits one step lower. */
  private async dropMarble(i: number, k: number) {
    const boat = this.boats[i];
    const node = thingArt('marble');
    node.scale.set(MARBLE);
    node.eventMode = 'none';
    boat.addChild(node);
    this.marbleNodes[i].push(node);
    const rest = this.slotPos(i, k);
    node.position.set(rest.x, rest.y - 240);
    sfx.pop(2 + k);
    await this.ctx.tw.to(node, { y: rest.y }, { duration: 0.28, ease: ease.inQuad });
    if (this.finished) return;
    sfx.clunk();
    this.ctx.particles.burst(boat.x + rest.x, this.surface(), {
      colors: [swatch.blue.fill, swatch.blue.light],
      count: 6,
      speed: [60, 140],
      gravity: 600,
      angle: -Math.PI / 2,
      spread: 1.2,
      size: [0.25, 0.4],
    });
    this.drawAll();
  }

  private slotPos(i: number, k: number) {
    const cap = hullCapacity(this.current.boats[i]);
    const w = this.current.boats[i] * this.cellW();
    return { x: -w / 2 + ((k + 0.5) * w) / cap, y: -26 };
  }

  /** The marble after the last seat arrives: water comes over the rim, the boat dips, and the marbles hop back to the bowl. */
  private async spill(i: number) {
    const tw = this.ctx.tw;
    const boat = this.boats[i];
    const count = this.loaded[i];
    sfx.splash();
    this.ctx.particles.burst(boat.x, this.surface(), {
      colors: [swatch.blue.fill, swatch.blue.light],
      count: 18,
      speed: [120, 260],
      gravity: 700,
      angle: -Math.PI / 2,
      spread: 1.6,
      size: [0.3, 0.5],
    });
    await tw.to(this.dip, { [i]: STEP * 0.9 }, { duration: 0.4, ease: ease.inOutSine });
    if (this.finished) return;
    const nodes = this.marbleNodes[i];
    this.marbleNodes[i] = [];
    this.loaded[i] = 0;
    sfx.boing();
    await Promise.all(
      nodes.map((n) =>
        tw
          .to(n, { y: n.y - 200, alpha: 0 }, { duration: 0.35, ease: ease.outQuad })
          .then(() => n.destroy({ children: true })),
      ),
    );
    if (this.finished) return;
    await tw.to(this.dip, { [i]: 0 }, { duration: 0.5, ease: ease.outBack });
    if (this.finished) return;
    this.drawAll();
    if (this.pile === null) return void (await this.measured(i, count));
    // A pile round: the boat could not carry it. Say why and pick again; two spills glow the best boat.
    this.spills++;
    this.phase = 'pick';
    this.target = -1;
    this.pick = 0;
    this.live();
    this.busy = true;
    await this.ctx.say('sink.boat-over', { name: this.ctx.childName });
    if (this.finished) return;
    this.busy = false;
    if (this.spills >= 2) this.showHint();
  }

  /** Round 1: one boat's count is in. The other boat is loaded next; when both are counted, the answer comes. */
  private async measured(i: number, count: number) {
    this.held[i] = count;
    this.drawStacks();
    await this.ctx.say('sink.boat-count', { name: this.ctx.childName });
    if (this.finished) return;
    const other = this.held.findIndex((h) => h === null);
    if (other >= 0) {
      this.busy = false;
      return void this.startLoad(other);
    }
    const wider = this.current.boats.indexOf(Math.max(...this.current.boats));
    await this.ctx.say(this.guess === wider ? 'sink.boat-right' : 'sink.boat-wide', {
      name: this.ctx.childName,
    });
    if (this.finished) return;
    this.next();
  }

  /** The whole pile is in: the boat floats happily. */
  private async carried() {
    sfx.sparkle();
    this.ctx.pet.cheer();
    const boat = this.boats[this.target];
    this.ctx.particles.burst(boat.x, this.surface() - 60, {
      kind: 'star',
      colors: [swatch.yellow.fill, swatch.white.fill],
      count: 14,
      speed: [120, 240],
      gravity: 200,
      angle: -Math.PI / 2,
      spread: 2,
    });
    await this.ctx.tw.wait(0.9);
    if (this.finished) return;
    this.next();
  }

  private next() {
    if (this.round + 1 >= this.rounds.length) return void this.end();
    void this.begin(this.round + 1);
  }

  // Hints --------------------------------------------------------------------------------

  /** The narrowest boat that carries the pile glows. One hint per round, however it was asked for. */
  private showHint() {
    const best = boatAccepted(this.current);
    if (best === null || this.phase !== 'pick') return void this.instruct(this.lastLine);
    if (!this.hinted) {
      this.hinted = true;
      this.hints++;
    }
    this.glowBoat = best;
    this.drawAll();
    void this.ctx.say('sink.boat-hint', { name: this.ctx.childName });
  }

  /** The pause sheet's Show a hint: the glow once she is choosing a boat for a pile, otherwise the instruction again, uncounted. */
  private requestHint() {
    if (this.finished) return;
    if (!this.busy && this.phase === 'pick') this.showHint();
    else void this.ctx.instruct(this.lastLine, { name: this.ctx.childName });
  }

  private async end() {
    if (this.finished) return;
    this.finished = true;
    this.live();
    await this.ctx.tw.wait(0.5);
    this.ctx.pet.cheer();
    sfx.sparkle();
    await this.ctx.say('sink.done');
    // No journal entry at this level: boats are not one of the things.
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  // Bots and the controller ------------------------------------------------------------

  /** The boat the bot wants: the widest in round 1 (its guess), the narrowest that carries the pile after. */
  private wanted(): number {
    const best = boatAccepted(this.current);
    if (best !== null) return best;
    return this.current.boats.indexOf(Math.max(...this.current.boats));
  }

  autotouch(): TouchIntent | null {
    if (this.finished || this.busy) return null;
    if (this.phase === 'guess' || this.phase === 'pick') {
      const i = this.wanted();
      return { tap: { on: this.boats[i], x: this.boats[i].x, y: this.boats[i].y } };
    }
    if (this.phase === 'load') return { tap: { on: this.bowl, x: this.bowl.x, y: this.bowl.y } };
    return null;
  }

  /** Left and right move a ring over the boats and the bowl; the action button picks a boat or drops a marble. */
  control(input: CouchControls) {
    this.couchOn = true;
    if (this.busy || this.finished) return;
    const stops = this.boats.length + 1;
    for (const p of input.players) {
      if (p.direction === 0) this.pick = Math.min(stops - 1, this.pick + 1);
      else if (p.direction === 2) this.pick = Math.max(0, this.pick - 1);
      if (!p.action) continue;
      if (this.phase === 'load') return void this.tapBowl();
      if (this.pick < this.boats.length) return void this.tapBoat(this.pick);
    }
  }

  autoplay(dt: number): CouchControls {
    const out = idle();
    out.players[0].active = true;
    this.botWait -= dt;
    if (this.busy || this.finished || this.botWait > 0) return out;
    const want = this.phase === 'load' ? this.boats.length : this.wanted();
    if (want !== this.pick) {
      out.players[0].direction = want > this.pick ? 0 : 2;
      this.botWait = 0.4;
      return out;
    }
    out.players[0].action = true;
    this.botWait = 0.5;
    return out;
  }

  // Layout -----------------------------------------------------------------------------

  /** The boats' row spans from clear of the pet to the right margin. */
  private get left0() {
    return 170;
  }

  /** The widest cell, up to 96, at which this round's whole row still fits. */
  private cellW(): number {
    const avail = this.view.w - 20 - this.left0;
    const boats = this.current?.boats ?? [];
    for (let c = CELL_MAX; c >= 40; c -= 2) {
      const total = boats.reduce((n, b) => n + Math.max(MIN_W, b * c), 0) + GAP * (boats.length - 1);
      if (total <= avail) return c;
    }
    return 40;
  }

  private boatWidth(i: number) {
    return Math.max(MIN_W, this.current.boats[i] * this.cellW());
  }

  private surface() {
    return this.view.h * 0.46;
  }

  private layoutBoats() {
    const boats = this.current?.boats ?? [];
    const total = boats.reduce((n, _, i) => n + this.boatWidth(i), 0) + GAP * (boats.length - 1);
    let x = this.left0 + (this.view.w - 20 - this.left0 - total) / 2;
    boats.forEach((_, i) => {
      const w = this.boatWidth(i);
      const b = this.boats[i];
      if (!b) return;
      b.x = x + w / 2;
      b.hitArea = new Rectangle(-w / 2, -WALL - 80, w, WALL + 80 + 150);
      x += w + GAP;
    });
  }

  resize(v: View) {
    this.view = v;
    const s = this.surface();
    this.background.clear().rect(0, 0, v.w, v.h).fill(swatch.teal.light);
    this.water
      .clear()
      .rect(0, s, v.w, v.h - s)
      .fill({ color: swatch.blue.fill, alpha: 0.5 });
    this.water.moveTo(0, s);
    for (let x = 0; x <= v.w; x += 20) this.water.lineTo(x, s + Math.sin(x / 30) * 4);
    this.water.stroke({ width: 4, color: swatch.blue.fill, alpha: 0.8 });
    this.bank
      .clear()
      .rect(0, v.h * 0.78, v.w, v.h * 0.22)
      .fill(wood.light)
      .rect(0, v.h * 0.78 - 8, v.w, 12)
      .fill(wood.fill);
    this.bowl.position.set(v.w - 125, v.h - 85);
    this.drawAll();
  }

  /** Everything that follows the loads: boat heights, marbles, the bowl and the glow. */
  private drawAll() {
    const s = this.surface();
    this.layoutBoats();
    this.current?.boats.forEach((cells, i) => {
      const b = this.boats[i];
      if (!b) return;
      const frac = this.loaded[i] / hullCapacity(cells);
      b.y = s + DRAFT + STEP * frac + this.dip[i];
      this.marbleNodes[i].forEach((n, k) => (n.x = this.slotPos(i, k).x));
    });
    this.drawBowl();
    this.drawStacks();
    this.drawGlow();
  }

  private drawBowl() {
    this.bowlArt.removeChildren().forEach((c) => c.destroy({ children: true }));
    const left =
      this.pile === null || this.target < 0 ? 6 : Math.max(0, this.pile - this.loaded[this.target]);
    this.bowlArt.addChild(marbleBowlArt(left));
    this.bowl.visible = !this.finished;
  }

  /** Round 1: the counts as marble dots above each boat, once measured. */
  private drawStacks() {
    const g = this.stacks.clear();
    this.held.forEach((h, i) => {
      if (h === null || !this.boats[i]) return;
      marbleDots(g, this.boats[i].x, this.surface() - WALL - 80, h);
    });
  }

  private drawGlow() {
    const g = this.glow.clear();
    if (this.glowBoat === null || this.finished || !this.boats[this.glowBoat]) return;
    const b = this.boats[this.glowBoat];
    const w = this.boatWidth(this.glowBoat);
    g.roundRect(b.x - w / 2 - 6, this.surface() - WALL - 40, w + 12, WALL + 120, 20).stroke({
      width: 8,
      color: swatch.yellow.line,
    });
  }

  update(dt: number) {
    this.clock += dt;
    this.glow.alpha = 0.6 + 0.4 * Math.sin(this.clock * 4);
    const s = this.surface();
    // The boats bob a little, and the dip of a spill is drawn by `drawAll`'s base height plus `dip`.
    this.current?.boats.forEach((cells, i) => {
      const b = this.boats[i];
      if (!b) return;
      const frac = this.loaded[i] / hullCapacity(cells);
      b.y = s + DRAFT + STEP * frac + this.dip[i] + Math.sin(this.clock * 2.2 + i) * 2.5;
    });
    // The waterline mark across each boat at the surface.
    const m = this.marks.clear();
    this.boats.forEach((b, i) => {
      const w = this.boatWidth(i);
      m.moveTo(b.x - w / 2 - 14, s);
      for (let dx = -w / 2 - 14; dx < w / 2 + 14; dx += 14) {
        m.moveTo(b.x + dx, s).lineTo(b.x + Math.min(dx + 8, w / 2 + 14), s);
      }
    });
    m.stroke({ width: 3, color: swatch.blue.line, cap: 'round' });
    const ring = this.ring.clear();
    if (this.couchOn && !this.busy && !this.finished) {
      if (this.pick >= this.boats.length || this.phase === 'load')
        ring
          .roundRect(this.bowl.x - 92, this.bowl.y - 82, 184, 164, 30)
          .stroke({ width: 8, color: swatch.teal.line });
      else {
        const b = this.boats[this.pick];
        const w = this.boatWidth(this.pick);
        ring
          .roundRect(b.x - w / 2 - 6, s - WALL - 40, w + 12, WALL + 120, 22)
          .stroke({ width: 8, color: swatch.teal.line });
      }
    }
  }

  destroy() {
    this.finished = true;
  }
}
