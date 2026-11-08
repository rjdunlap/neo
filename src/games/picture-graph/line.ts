import { Container, Graphics, Rectangle } from 'pixi.js';
import { ink, swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { driftwood, feather, pebble, shell } from '../../art/shore';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { label } from '../../ui/text';
import { tile } from '../shared';
import type { Game, GameContext, TouchIntent } from '../types';
import {
  choicesFor,
  lineHint,
  lineKinds,
  lineMove,
  lineQuestions,
  makeShore,
  planFor,
  ROW_H,
  shoreArea,
  shoreSpots,
  THING_NAMES,
  THING_SIZE,
  trayLayout,
  type GraphPlan,
  type Question,
  type Shore,
  type ShoreThing,
} from './logic';

/** The shore's backdrop seeds: one a round, so the dunes change while the rule does not. */
const SHORES = [12, 57, 230];
const ROW_TINTS = [0xfff4dc, 0xe8f6f6, 0xfbe9ef];

/** A shore thing drawn round (0, 0), fitting its 100-unit tap square. */
function thingArt(kind: ShoreThing): Graphics {
  const g = new Graphics();
  if (kind === 'shell') shell(g, 0, 26, 2.4);
  else if (kind === 'stone') pebble(g, 0, 0, 1.1);
  else if (kind === 'stick') driftwood(g, 0, 0, 0.95);
  else feather(g, 0, 4, 0.95);
  return g;
}

interface Thing {
  kind: number;
  node: Container;
  placed: boolean;
  /** Its slot in its row once tapped. */
  slot: number;
}

/**
 * Level 8, Line them up: shells, stones, sticks and feathers lie on the sand. Each tap hops one into its kind's row of the
 * tray, where the slots line up one to one across the rows; lining up is never wrong. Then: which row has the most? and, at
 * school, how many more of one kind than another? A wrong row or number is a miss; after two, lines join the rows thing
 * to thing and the things nothing matches glow.
 */
export class LineUp implements Game {
  readonly plan: GraphPlan;
  readonly kinds: number;
  shore!: Shore;
  things: Thing[] = [];
  lined: number[] = [];
  questions: Question[] = [];
  q = 0;
  index = -1;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  readonly rows: Container[] = [];
  readonly pads: { n: number; node: Container }[] = [];

  private readonly backdrop: Backdrop;
  private readonly tray = new Graphics();
  private readonly layer = new Container();
  private readonly glow = new Graphics();
  private view: View;
  private wrongs = 0;
  private hint = false;
  private clock = 0;
  private spotSeed = 1;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.kinds = lineKinds(ctx.band);
    this.backdrop = new Backdrop(
      {
        sky: [0x8fd3f7, 0xe9f7ff],
        hills: [0x7fcbe0, 0xf6e3ad, 0xeed49a],
        horizon: 0.2,
        clouds: 2,
        sun: true,
        seed: ctx.rng.pick(SHORES),
      },
      ctx.view,
    );
    this.tray.eventMode = 'none';
    this.glow.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.tray, this.layer, this.glow);
  }

  start() {
    void this.next();
  }

  private layout() {
    return trayLayout(this.view.w, this.view.h, this.kinds, this.plan.max);
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    if (!this.shore) return;
    const t = this.layout();
    const spots = shoreSpots(this.shore, this.plan, v.w, v.h, new Rng(this.spotSeed));
    this.things.forEach((th, i) => {
      if (th.placed) {
        // A hop still under way would pull it back toward the old layout's slot.
        this.ctx.tw.kill(th.node);
        th.node.position.set(t.slotX(th.slot), t.rowY(th.kind));
      } else th.node.position.set(spots[i].x, spots[i].y);
    });
    this.rows.forEach((r, i) => r.position.set((t.left + t.right) / 2, t.rowY(i)));
    const area = shoreArea(v.w, v.h, this.kinds, this.plan.max);
    this.pads.forEach((p, i) =>
      p.node.position.set(v.w / 2 + (i - (this.pads.length - 1) / 2) * 160, (area.top + area.bottom) / 2),
    );
    this.drawTray();
  }

  update(dt: number) {
    this.clock += dt;
    const g = this.glow.clear();
    const q = this.questions[this.q];
    if (!this.hint || !q || this.finished) return;
    const t = this.layout();
    const pulse = 6 + 2 * Math.sin(this.clock * 5);
    const why = lineHint(q, this.shore.counts);
    // Lines join the rows one to one, slot by slot; the things nothing matches glow.
    for (const link of why.links) {
      if (link.rows.length < 2) continue;
      const ys = link.rows.map((r) => t.rowY(r));
      const x = t.slotX(link.k);
      for (let y = Math.min(...ys); y < Math.max(...ys); y += 18)
        g.moveTo(x, y).lineTo(x, Math.min(y + 10, Math.max(...ys)));
    }
    g.stroke({ width: 5, color: ink, cap: 'round' });
    for (const b of why.glow)
      g.circle(t.slotX(b.k), t.rowY(b.row), 46).stroke({ width: pulse, color: swatch.yellow.fill });
    if (q.ask === 'more') {
      const p = this.pads.find((x) => x.n === q.answer);
      if (p)
        g.roundRect(p.node.x - 66, p.node.y - 60, 132, 120, 22).stroke({
          width: pulse,
          color: swatch.yellow.fill,
        });
    }
  }

  /** The ghost finger: each thing on the sand in turn (quick taps, they belong together), then the row or the number. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || !this.shore) return null;
    const move = lineMove(
      this.things.map((t) => t.placed),
      this.questions[this.q],
    );
    if (!move) return null;
    if (move.do === 'thing') return { tap: { on: this.things[move.index].node }, pause: 0.2 };
    if (move.do === 'row') return { tap: { on: this.rows[move.row], x: 0, y: 0 } };
    const pad = this.pads.find((p) => p.n === move.n);
    return pad ? { tap: { on: pad.node } } : null;
  }

  destroy() {}

  private async next() {
    this.busy = true;
    this.index++;
    this.wrongs = 0;
    this.hint = false;
    this.q = 0;
    this.questions = [];
    this.clearPads();
    if (this.index >= this.plan.graphs) return void this.finale();
    this.shore = makeShore(this.plan, this.kinds, this.ctx.rng);
    this.spotSeed = this.ctx.rng.int(1, 1_000_000);
    this.lined = this.shore.kinds.map(() => 0);
    this.buildThings();
    this.buildRows();
    this.resize(this.view);
    this.busy = false;
    return this.ctx.instruct('graph.line');
  }

  private buildThings() {
    for (const th of this.things) {
      this.ctx.tw.kill(th.node);
      this.ctx.tw.kill(th.node.scale);
      th.node.destroy({ children: true });
    }
    const spots = shoreSpots(this.shore, this.plan, this.view.w, this.view.h, new Rng(this.spotSeed));
    this.things = spots.map((s, i) => {
      const node = new Container();
      node.addChild(thingArt(this.shore.kinds[s.kind]));
      node.hitArea = new Rectangle(-THING_SIZE / 2, -THING_SIZE / 2, THING_SIZE, THING_SIZE);
      onTap(node, () => this.tapThing(i), { cooldown: 200 });
      this.layer.addChild(node);
      return { kind: s.kind, node, placed: false, slot: -1 };
    });
  }

  /** One tap target per row, the row's full width, for "which row has the most?". */
  private buildRows() {
    for (const r of this.rows.splice(0)) r.destroy({ children: true });
    const t = this.layout();
    this.shore.kinds.forEach((_, i) => {
      const row = new Container();
      row.hitArea = new Rectangle(-(t.right - t.left) / 2, -ROW_H / 2, t.right - t.left, ROW_H);
      onTap(row, () => void this.tapRow(i), { cooldown: 200 });
      this.rows.push(row);
      // Under the things, so a thing on the sand above is never shadowed; lined-up things let taps through to their row.
      this.layer.addChildAt(row, 0);
    });
  }

  private drawTray() {
    for (const c of this.tray.children.slice()) c.destroy({ children: true });
    const g = this.tray.clear();
    const t = this.layout();
    g.roundRect(t.left, t.top, t.right - t.left, t.bottom - t.top, 22)
      .fill({ color: 0xffffff, alpha: 0.8 })
      .stroke({ width: 4, color: 0xc9a75e });
    this.shore.kinds.forEach((kind, r) => {
      const y = t.rowY(r);
      g.roundRect(t.left + 8, y - ROW_H / 2 + 3, t.right - t.left - 16, ROW_H - 6, 16).fill(
        ROW_TINTS[r % ROW_TINTS.length],
      );
      // An empty slot is a soft ring, so the rows line up one to one before anything is in them.
      for (let k = 0; k < this.plan.max; k++)
        g.circle(t.slotX(k), y, 34).stroke({ width: 3, color: 0xc9a75e, alpha: 0.45 });
      const pic = new Container();
      pic.addChild(tile(96, 92, 'white'));
      const art = thingArt(kind);
      art.scale.set(0.8);
      pic.addChild(art);
      pic.position.set(t.labelX, y);
      this.tray.addChild(pic);
    });
  }

  private tapThing(i: number) {
    const th = this.things[i];
    if (this.busy || this.finished || th.placed) return;
    // Claimed at once, so a quick second tap can never take the same slot.
    th.placed = true;
    th.slot = this.lined[th.kind]++;
    th.node.eventMode = 'none';
    const n = this.lined[th.kind];
    sfx.pop(2 + n);
    void this.ctx.say('count', { n });
    const t = this.layout();
    th.node.scale.set(0.85);
    void this.ctx.tw.to(th.node.scale, { x: 1, y: 1 }, { duration: 0.15 });
    void this.ctx.tw.to(th.node, { x: t.slotX(th.slot), y: t.rowY(th.kind) }, { duration: 0.35 });
    if (this.things.every((x) => x.placed)) void this.allLined();
  }

  private async allLined() {
    this.busy = true;
    await this.ctx.tw.wait(0.4);
    sfx.sparkle();
    this.ctx.pet.cheer();
    await this.ctx.say('graph.line.lined');
    this.questions = lineQuestions(this.shore, this.ctx.rng);
    this.busy = false;
    return this.askNext();
  }

  private askNext(): Promise<void> | void {
    this.hint = false;
    this.wrongs = 0;
    this.clearPads();
    const q = this.questions[this.q];
    if (!q) return void this.next();
    if (q.ask === 'most') return this.ctx.instruct('graph.line.most');
    if (q.ask !== 'more') return;
    for (const n of choicesFor(q.answer, this.ctx.rng, 1, this.shore.counts[q.a])) {
      const node = new Container();
      node.addChild(tile(116, 104, 'white'), label(String(n), 46, ink));
      node.hitArea = new Rectangle(-62, -56, 124, 112);
      onTap(node, () => void this.answerNumber(n), { cooldown: 300 });
      this.pads.push({ n, node });
      this.ctx.stage.addChild(node);
    }
    this.resize(this.view);
    return this.ctx.instruct('graph.more', { a: this.name(q.a), b: this.name(q.b) });
  }

  private name(i: number) {
    return THING_NAMES[this.shore.kinds[i]];
  }

  private clearPads() {
    for (const p of this.pads.splice(0)) p.node.destroy({ children: true });
  }

  /** A row tap answers "which row has the most?"; before then, or on a number question, it does nothing. */
  private async tapRow(i: number) {
    const q = this.questions[this.q];
    if (this.busy || this.finished || !q || q.ask !== 'most') return;
    if (i === q.answer) return this.right();
    return this.wrong(null);
  }

  private async answerNumber(n: number) {
    const q = this.questions[this.q];
    if (this.busy || this.finished || !q || q.ask !== 'more') return;
    if (n === q.answer) return this.right();
    return this.wrong(n === this.shore.counts[q.a] ? 'taller' : null);
  }

  private async wrong(why: 'taller' | null) {
    this.busy = true;
    this.misses++;
    this.wrongs++;
    sfx.boing();
    const q = this.questions[this.q];
    if (why === 'taller' && q.ask === 'more')
      await this.ctx.say('graph.line.taller', { a: this.name(q.a), b: this.name(q.b) });
    else await this.ctx.say('graph.line.look');
    if (this.wrongs >= 2 && !this.hint) {
      this.hints++;
      this.hint = true;
    }
    this.busy = false;
  }

  private async right() {
    this.busy = true;
    sfx.sparkle();
    this.ctx.pet.cheer();
    await this.ctx.say('graph.yay');
    this.q++;
    this.busy = false;
    if (this.q >= this.questions.length) return void this.next();
    return this.askNext();
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    sfx.tada();
    await this.ctx.say('graph.done');
    await this.ctx.tw.wait(0.4);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}
