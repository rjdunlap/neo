import { Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { Backdrop } from '../../art/scenery';
import { wood, ink, swatch } from '../../art/palette';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { label } from '../../ui/text';
import type { Game, GameContext, TouchIntent } from '../types';
import { bubbleFrame, Card, drawGate, edgeLine, fencePiece, meadowCell, turfCell } from './art';
import { CELLS, GAP, cellRect, centre, correctChoice, drawnSide, fenceEdges, fixedTasks, meadowLayout,
  neighbours, PenTally, rowsOf, type Badge, type Cell, type Choice, type FixedTask, type MeadowLayout } from './logic';

/** Distinct silhouettes and borders make the two flower badges readable without colour or letters. */
export function badgeArt(badge: Badge, size = 1): Graphics {
  const g = new Graphics();
  if (badge === 'daisy') {
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3;
      g.ellipse(Math.cos(a) * 18, Math.sin(a) * 18, 12, 12).fill(0xffffff).stroke({ width: 2, color: ink });
    }
    g.circle(0, 0, 11).fill(swatch.yellow.fill).stroke({ width: 2, color: ink });
  } else {
    g.moveTo(-25, -22).lineTo(-10, -9).lineTo(0, -28).lineTo(10, -9).lineTo(25, -22)
      .quadraticCurveTo(26, 25, 0, 25).quadraticCurveTo(-26, 25, -25, -22).fill(swatch.pink.fill).stroke({ width: 3, color: ink });
  }
  g.scale.set(size);
  g.eventMode = 'none';
  return g;
}

function materialPicture(fence: boolean): Container {
  const c = new Container();
  const g = new Graphics();
  if (fence) {
    for (const x of [-32, 0, 32]) g.roundRect(x - 5, -34, 10, 68, 3).fill(wood.fill).stroke({ width: 3, color: wood.line });
    g.moveTo(-46, -16).lineTo(46, -16).moveTo(-46, 16).lineTo(46, 16).stroke({ width: 7, color: wood.line });
  } else {
    turfCell(g, { x: -36, y: -36, w: 72, h: 72 }, 2);
  }
  c.addChild(g); c.eventMode = 'none'; return c;
}

class ChoiceCard extends Container {
  readonly ring = new Graphics();
  constructor(readonly value: Choice) {
    super();
    this.addChild(this.ring, new Graphics().roundRect(-65, -65, 130, 130, 22).fill(0xffffff).stroke({ width: 6, color: swatch.blue.line }));
  }
  glow(on: boolean, t: number) {
    this.ring.clear();
    if (on) this.ring.roundRect(-78, -78, 156, 156, 28).fill({ color: swatch.yellow.fill, alpha: 0.65 + Math.sin(t * 6) * 0.2 });
  }
}

/** Fixed fields use only onTap counting targets and a separate answer lane. */
export class FixedMeadow implements Game {
  readonly tasks: FixedTask[];
  readonly tally = new PenTally();
  index = 0;
  busy = true;
  finished = false;
  private alive = true;
  private epoch = 0;
  private clock = 0;
  private lay: MeadowLayout;
  private view: View;
  private gateOpen = 0;
  private botPart = 0;
  private readonly painted = new Set<Cell>();
  private highlight: Cell[] = [];
  private litEdge = -1;
  private summaries: (number | null)[] = [null, null];
  private edgePart = 0;
  private readonly backdrop: Backdrop;
  private readonly drawing = new Graphics();
  private readonly decorations = new Container();
  private readonly countTargets = new Container();
  private readonly bubble = new Container();
  private readonly gate = new Graphics();
  private readonly lane = new Graphics();
  private readonly friend: Critter;
  private readonly companion;
  cards: (Card | ChoiceCard)[] = [];
  partTargets: Container[] = [];
  private finishSent = false;
  constructor(private readonly ctx: GameContext, authored = true) {
    this.view = ctx.view;
    this.lay = meadowLayout(ctx.view, ctx.level)!;
    this.tasks = fixedTasks(ctx.level, ctx.rng, ctx.demo || authored);
    this.backdrop = ctx.track(new Backdrop({ sky: [0xc4ecff, 0xfff6e0], hills: [0xf5d0e6, 0xbfe39a, 0x9ad77e], horizon: 0.22, clouds: 3, sun: true, seed: 131 }, ctx.view));
    this.friend = ctx.track(new Critter(CRITTERS.bunny)); this.friend.scale.set(0.42);
    this.companion = ctx.track(ctx.companion()); this.companion.scale.set(0.42); this.companion.eventMode = 'none';
    for (const n of [this.drawing, this.decorations, this.gate, this.lane]) n.eventMode = 'none';
    onTap(this.friend, () => { if (!this.busy) { this.friend.poke(); void this.replayQuestion(); } }, { cooldown: 600 });
    this.friend.hitArea = new Rectangle(-150, -320, 300, 330);
    ctx.stage.addChild(this.backdrop, this.drawing, this.decorations, this.gate, this.countTargets, this.lane, this.bubble, this.friend, this.companion);
  }
  get task() { return this.tasks[this.index]; }
  start() { this.build(); void this.intro(); }
  private async intro() {
    await this.ctx.instruct(this.ctx.level === 4 ? 'meadow.instruct.4' : 'meadow.instruct.5');
    if (!this.alive) return;
    await this.ask();
    if (this.alive) this.busy = false;
  }
  destroy() { this.alive = false; this.epoch++; }
  resize(view: View) {
    this.view = view; this.backdrop.resize(view);
    this.lay = meadowLayout(view, this.ctx.level)!;
    this.position(); this.redraw();
  }
  update(dt: number) {
    this.clock += dt;
    for (const card of this.cards) card.glow(this.tally.glowing && card.value === correctChoice(this.task), this.clock);
  }
  private async ask(labels = false) {
    const token = this.epoch;
    await this.ctx.say(this.task.kind === 'parts' ? 'meadow.ask5' : this.task.material === 'grass' ? 'meadow.ask4.grass' : 'meadow.ask4.fence');
    if (labels && this.task.kind === 'compare') {
      for (const line of ['meadow.choice4.daisy', 'meadow.choice4.tulip', 'meadow.choice4.same'] as const) {
        if (!this.valid(token)) return;
        await this.ctx.say(line);
      }
    }
  }
  private clear(c: Container) { c.removeChildren().forEach((n) => n.destroy({ children: true })); }
  private build() {
    this.clear(this.decorations); this.clear(this.countTargets); this.clear(this.bubble);
    this.cards.forEach((c) => c.destroy({ children: true })); this.cards = []; this.partTargets = [];
    this.summaries = [null, null];
    this.botPart = 0; this.highlight = []; this.litEdge = -1;
    const t = this.task;
    this.painted.clear();
    if (t.kind === 'compare') t.parts.flat().forEach((c) => this.painted.add(c));
    this.bubble.addChild(bubbleFrame(this.lay.bubble.w, this.lay.bubble.h), materialPicture(t.kind === 'compare' && t.material === 'fence'));
    onTap(this.bubble, () => { if (!this.busy) { this.bubble.scale.set(0.96); void this.ctx.tw.to(this.bubble.scale, { x: 1, y: 1 }, { duration: 0.15 }); void (t.kind === 'compare' ? this.countAll() : this.replayQuestion()); } }, { cooldown: 600 });
    for (let p = 0; p < 2; p++) {
      const target = new Container();
      onTap(target, () => { if (!this.busy) void this.countOne(p); });
      this.partTargets.push(target); this.countTargets.addChild(target);
    }
    t.cards.forEach((value) => {
      const card = typeof value === 'number' ? new Card(value) : new ChoiceCard(value);
      if (card instanceof ChoiceCard && t.kind === 'compare') {
        if (card.value === 'same') {
          for (const x of [-27, 27]) { const pic = materialPicture(t.material === 'fence'); pic.scale.set(0.45); pic.x = x; card.addChild(pic); }
          const equal = label('=', 38, ink); equal.y = 38; card.addChild(equal);
        } else {
          const p = card.value === 'a' ? 0 : 1;
          card.addChild(badgeArt(t.badges[p], 1.25));
          // Daisy is dotted, tulip striped, on both meadow and answer card.
          this.pattern(card, t.badges[p]);
        }
      }
      card.hitArea = new Rectangle(-65, -65, 130, 130);
      onTap(card, () => { void this.pickCard(card); }, { cooldown: 350 });
      this.cards.push(card); this.ctx.stage.addChild(card);
    });
    this.position(); this.redraw();
  }
  private pattern(c: Container, badge: Badge) {
    const g = new Graphics();
    for (let x = -44; x <= 44; x += 22) {
      if (badge === 'daisy') g.circle(x, 47, 4).fill(ink);
      else g.moveTo(x - 5, 41).lineTo(x + 5, 53).stroke({ width: 4, color: ink });
    }
    g.eventMode = 'none'; c.addChild(g);
  }
  private position() {
    const l = this.lay;
    this.friend.position.set(l.friend.x + l.friend.w / 2, l.friend.y + l.friend.h - 6);
    this.companion.position.set(l.companion.x, l.companion.y);
    const b = centre(l.bubble); this.bubble.position.set(b.x, b.y);
    this.bubble.hitArea = new Rectangle(-l.bubble.w / 2, -l.bubble.h / 2, l.bubble.w, l.bubble.h);
    this.cards.forEach((card, i) => { const p = centre(l.cards![i]); card.position.set(p.x, p.y); });
    this.partTargets.forEach((target, p) => {
      // A union of full-sized cell rectangles keeps the notch and neighbouring part out of the target.
      const rects = this.task.parts[p].map((c) => cellRect(l, c));
      target.hitArea = { contains: (x: number, y: number) => rects.some((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) };
    });
    const first = l.cards![0], last = l.cards![2];
    this.lane.clear().roundRect(first.x - 14, first.y - 14, last.x + last.w - first.x + 28, first.h + 28, 28).fill({ color: swatch.blue.fill, alpha: 0.15 });
  }
  private redraw() {
    const g = this.drawing.clear(), t = this.task, l = this.lay;
    this.clear(this.decorations);
    const all = new Set(t.parts.flat());
    for (let c = 0; c < CELLS; c++) {
      const r = cellRect(l, c);
      if (this.painted.has(c)) turfCell(g, r, c);
      else meadowCell(g, r);
      if (t.kind === 'parts' && all.has(c)) {
        // Dots versus slashes distinguish the two rectangles even before they fill.
        if (t.parts[0].includes(c)) for (const dx of [28, 72]) g.circle(r.x + dx, r.y + 72, 4).fill(ink);
        else g.moveTo(r.x + 25, r.y + 75).lineTo(r.x + 45, r.y + 55).moveTo(r.x + 55, r.y + 75).lineTo(r.x + 75, r.y + 55).stroke({ width: 3, color: ink });
      }
      if (this.highlight.includes(c)) g.roundRect(r.x + 4, r.y + 4, r.w - 8, r.h - 8, 12).fill({ color: 0xffffff, alpha: 0.65 });
    }
    const sets = t.kind === 'compare' ? t.parts : [t.parts.flat()];
    sets.forEach((cells) => fenceEdges(new Set(cells)).forEach((edge) => fencePiece(g, edgeLine(cellRect(l, edge.cell), drawnSide(edge.side, l.tall), GAP))));
    if (t.kind === 'parts') {
      const second = new Set(t.parts[1]);
      for (const c of t.parts[0]) for (const n of neighbours(c)) if (second.has(n)) {
        const side = n === c + 1 ? 'right' : n === c - 1 ? 'left' : n > c ? 'down' : 'up';
        const [x1, y1, x2, y2] = edgeLine(cellRect(l, c), drawnSide(side, l.tall), GAP);
        for (let f = 0; f < 1; f += 0.2) g.moveTo(x1 + (x2 - x1) * f, y1 + (y2 - y1) * f).lineTo(x1 + (x2 - x1) * (f + 0.1), y1 + (y2 - y1) * (f + 0.1)).stroke({ width: 4, color: ink });
      }
    } else {
      t.parts.forEach((part, p) => {
        const r = centre(cellRect(l, part[0]));
        const badge = new Container(); badge.addChild(new Graphics().circle(0, 0, 42).fill(0xffffff), badgeArt(t.badges[p]));
        this.pattern(badge, t.badges[p]); badge.position.set(r.x, r.y); badge.eventMode = 'none'; this.decorations.addChild(badge);
        if (this.summaries[p] !== null) {
          const end = centre(cellRect(l, part[part.length - 1]));
          const summary = label(String(this.summaries[p]), 44, ink);
          summary.position.set(end.x, end.y); this.decorations.addChild(summary);
        }
      });
    }
    if (this.litEdge >= 0) {
      const edges = fenceEdges(new Set(t.parts[this.edgePart])); const e = edges[this.litEdge];
      if (e) { const [x1, y1, x2, y2] = edgeLine(cellRect(l, e.cell), drawnSide(e.side, l.tall), GAP); g.moveTo(x1, y1).lineTo(x2, y2).stroke({ width: 16, color: swatch.yellow.fill }); }
    }
    drawGate(this.gate, l.gate, this.gateOpen);
  }
  private valid(token: number) { return this.alive && this.epoch === token; }
  private async countPart(p: number, offset = 0) {
    const token = this.epoch, t = this.task;
    if (t.kind === 'compare') await this.ctx.say(t.badges[p] === 'daisy' ? 'meadow.choice4.daisy' : 'meadow.choice4.tulip');
    if (!this.valid(token)) return;
    if (t.kind === 'compare' && t.material === 'fence') {
      const edges = fenceEdges(new Set(t.parts[p])); this.edgePart = p;
      for (let i = 0; i < edges.length; i++) {
        this.litEdge = i; this.redraw(); sfx.tick();
        await this.ctx.tw.wait(0.1); if (!this.valid(token)) return;
      }
      await this.ctx.say('meadow.fence-total', { n: edges.length });
    } else {
      let total = offset;
      // Snapshot membership/order; resize changes only positions, never the running count.
      for (const row of rowsOf(t.parts[p], this.lay.tall)) {
        for (const c of row) { this.painted.add(c); this.highlight = [c]; this.redraw(); sfx.bell(5); total++;
          await this.ctx.tw.wait(0.06); if (!this.valid(token)) return; }
        await this.ctx.say('count', { n: total }); if (!this.valid(token)) return;
      }
      await this.ctx.say(t.parts[p].length === 1 ? 'meadow.grass-one' : 'meadow.grass-total', { n: t.parts[p].length });
    }
    if (!this.valid(token)) return;
    this.summaries[p] = t.kind === 'compare' && t.material === 'fence' ? fenceEdges(new Set(t.parts[p])).length : t.parts[p].length;
    this.highlight = []; this.litEdge = -1; this.redraw();
  }
  private async explanation() {
    const token = this.epoch, t = this.task;
    await this.countPart(0); if (!this.valid(token)) return;
    await this.countPart(1, t.kind === 'parts' ? t.parts[0].length : 0); if (!this.valid(token)) return;
    if (t.kind === 'parts') await this.ctx.say(`meadow.parts5.${t.id}` as 'meadow.parts5.L1');
    else {
      const answer = correctChoice(t);
      if (answer === 'same') await this.ctx.say(t.material === 'grass' ? 'meadow.same-grass' : 'meadow.same-fence');
      else { const badge = t.badges[answer === 'a' ? 0 : 1]; await this.ctx.say(`meadow.more.${badge}.${t.material}` as 'meadow.more.daisy.grass'); }
    }
  }
  private async countOne(p: number) {
    this.busy = true; const token = this.epoch;
    this.highlight = [this.task.parts[p][0]];
    if (this.task.kind === 'compare' && this.task.material === 'fence') { this.edgePart = p; this.litEdge = 0; }
    this.redraw();
    sfx.pop(5); await this.countPart(p);
    if (this.valid(token)) this.busy = false;
  }
  private async replayQuestion() {
    this.busy = true; const token = this.epoch;
    await this.ask(true); if (this.valid(token)) this.busy = false;
  }
  private async countAll() {
    this.busy = true; const token = this.epoch;
    await this.ask(true); if (!this.valid(token)) return;
    await this.explanation(); if (this.valid(token)) this.busy = false;
  }
  private async pickCard(card: Card | ChoiceCard) {
    if (this.busy || this.finished || !this.alive) return;
    this.busy = true; const token = this.epoch;
    card.scale.set(0.94); void this.ctx.tw.to(card.scale, { x: 1, y: 1 }, { duration: 0.15 });
    const supported = this.tally.glowing;
    const result = this.tally.card(supported || card.value === correctChoice(this.task));
    if (result !== 'ok') { sfx.boing(); this.companion.wiggle(); }
    else sfx.bell(8);
    if (result !== 'ok' || supported) await this.explanation();
    else { this.task.parts.flat().forEach((c) => this.painted.add(c)); this.redraw(); }
    if (!this.valid(token)) return;
    if (this.task.kind === 'parts' && card.value === fenceEdges(new Set(this.task.parts.flat())).length && result !== 'ok') {
      await this.ctx.say('meadow.fence5'); if (!this.valid(token)) return;
    }
    if (result !== 'ok') {
      if (result === 'glow') { await this.ctx.say('meadow.hint-fixed'); if (!this.valid(token)) return; }
      this.busy = false; return;
    }
    await this.complete(token);
  }
  private async complete(token: number) {
    this.gateOpen = 1; this.redraw(); this.friend.cheer(); this.companion.cheer(); this.ctx.pet.cheer();
    const t = this.task;
    const choice = correctChoice(t);
    const part = t.parts[choice === 'b' ? 1 : 0];
    const spot = centre(cellRect(this.lay, part[Math.floor(part.length / 2)]));
    await this.ctx.tw.to(this.friend, { x: spot.x, y: spot.y + 40 }, { duration: 0.4 });
    if (!this.valid(token)) return;
    await this.ctx.say(t.kind === 'compare' ? 'meadow.in' : 'meadow.field-in'); if (!this.valid(token)) return;
    await this.ctx.tw.wait(0.4); if (!this.valid(token)) return;
    if (this.index === this.tasks.length - 1) return this.finale();
    this.index++; this.epoch++; this.tally.next(); this.gateOpen = 0; this.build();
    await this.ask(); if (this.alive) this.busy = false;
  }
  private async finale() {
    this.finished = true; this.busy = true;
    const token = this.epoch;
    this.ctx.particles.burst(this.view.w / 2, this.view.h * 0.35, { kind: 'star', colors: [0xffd54a, 0xffffff], count: 32, speed: [100, 300], gravity: 100, life: [0.5, 1] });
    // The final count and bell can be skipped with a deliberate tap on the answer lane.
    for (const card of this.cards) onTap(card, () => this.sendFinish());
    sfx.tada(); await this.ctx.say('meadow.fixed-all'); if (!this.valid(token)) return;
    await this.ctx.tw.wait(0.5); if (this.valid(token)) this.sendFinish();
  }
  private sendFinish() { if (this.alive && !this.finishSent) { this.finishSent = true; this.ctx.finish({ misses: this.tally.misses, hints: this.tally.hints }); } }
  askForHint() {
    if (this.busy || this.finished || !this.alive) return;
    this.tally.glow(); this.busy = true; const token = this.epoch;
    void this.explanation().then(async () => {
      if (!this.valid(token)) return;
      await this.ctx.say('meadow.hint-fixed'); if (this.valid(token)) this.busy = false;
    });
  }
  restart() {
    if (this.busy || this.finished || !this.alive) return;
    // Keep the fixed task, help, totals and index. Only the free fill/count starts afresh.
    this.epoch++; this.painted.clear();
    if (this.task.kind === 'compare') this.task.parts.flat().forEach((c) => this.painted.add(c));
    this.highlight = []; this.litEdge = -1; this.redraw(); void this.replayQuestion();
  }
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished) return null;
    if (this.botPart < 2) {
      const p = this.botPart++;
      const r = centre(cellRect(this.lay, this.task.parts[p][0]));
      return { tap: { on: this.partTargets[p], x: r.x, y: r.y }, pause: 0.3 };
    }
    const card = this.cards.find((c) => c.value === correctChoice(this.task));
    return card ? { tap: { on: card }, pause: 0.4 } : null;
  }
}
