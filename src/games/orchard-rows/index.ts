import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, grass, ink, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { choicesFor, countGroup, makeOrchards, missingTrees, orchardLayout, planFor, total, turn, type Orchard } from './logic';

const LEVELS: BandLevels = { school: { min: 1, max: 3 } };

/** Trees are pictures; the whole row is the large touch control. */
function tree(color: number): Graphics {
  return new Graphics().ellipse(0, 35, 25, 7).fill({ color: swatch.green.line, alpha: 0.2 })
    .roundRect(-6, 0, 12, 34, 4).fill(wood.fill).stroke({ width: 2, color: wood.line })
    .circle(0, -10, 29).fill(swatch.green.fill).stroke({ width: 3, color: swatch.green.line })
    .circle(-12, -12, 6).circle(12, -7, 6).circle(0, 5, 6).fill(color);
}

class OrchardRows implements Game {
  readonly plan;
  readonly orchards;
  orchard!: Orchard;
  oriented!: Orchard;
  index = -1;
  phase: 'plant' | 'count' | 'answer' | 'turn' | 'missing' = 'plant';
  planted: number[] = [];
  counted: number[] = [];
  turned = false;
  busy = true;
  finished = false;
  misses = 0;
  hints = 0;
  hinted = false;
  wrongs = 0;
  answer = 0;
  readonly groups: Container[] = [];
  readonly pads: { n: number; node: Container }[] = [];
  readonly rotate = new Container();
  private readonly backdrop: Backdrop;
  private readonly bed = new Container();
  private readonly glow = new Graphics();
  private readonly heading = label('', 30);
  private readonly sentence = label('', 26);
  private view: View;
  private clock = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.orchards = makeOrchards(ctx.level, ctx.rng);
    this.backdrop = new Backdrop({ sky: [swatch.blue.light, cream], hills: [grass, swatch.green.light], horizon: 0.3, clouds: 2, sun: true, seed: 46 }, ctx.view);
    this.glow.eventMode = this.heading.eventMode = this.sentence.eventMode = 'none';
    this.rotate.addChild(tile(120, 110, 'teal'));
    this.rotate.addChild(new Graphics().moveTo(-25, 15).lineTo(-25, -20).lineTo(25, -20).lineTo(25, 15).stroke({ width: 7, color: ink, join: 'round' })
      .poly([10, 5, 25, 25, 40, 5]).fill(ink));
    onTap(this.rotate, () => void this.rotateOrchard());
    ctx.stage.addChild(this.backdrop, this.bed, this.heading, this.sentence, this.rotate, this.glow);
    this.rotate.visible = false;
  }

  start() { void this.next(); }
  destroy() { this.finished = true; }

  autotouch(): TouchIntent | null {
    if (this.busy || this.finished) return null;
    if (this.phase === 'turn') return { tap: { on: this.rotate } };
    if (this.phase === 'missing' || this.phase === 'answer') {
      const p = this.pads.find(p => p.n === this.answer);
      return p ? { tap: { on: p.node } } : null;
    }
    const used = this.phase === 'plant' ? this.planted : this.counted;
    const row = this.groups.findIndex((_, i) => !used.includes(i));
    return row < 0 ? null : { tap: { on: this.groups[row] } };
  }

  resize(view: View) {
    this.view = view;
    this.backdrop.resize(view);
    this.heading.position.set(view.w / 2, 122);
    this.sentence.position.set(view.w / 2, 170);
    this.rotate.position.set(view.w - 130, 250);
    this.pads.forEach((p, i) => p.node.position.set(view.w - 130, 390 + i * 125));
    if (!this.oriented) return;
    const l = orchardLayout(view.w, view.h, this.oriented);
    this.groups.forEach((node, i) => {
      node.position.set(l.x, l.y + i * l.rowHeight + l.rowHeight / 2);
      node.hitArea = new Rectangle(-l.width / 2, -50, l.width, 100);
    });
    this.drawRows();
  }

  update(dt: number) {
    this.clock += dt;
    this.glow.clear();
    if (!this.hinted || this.busy) return;
    const pad = this.pads.find(p => p.n === this.answer);
    if (pad) this.glow.roundRect(pad.node.x - 65, pad.node.y - 60, 130, 120, 20).stroke({ width: 6 + 2 * Math.sin(this.clock * 5), color: swatch.yellow.fill });
  }

  private async next() {
    this.busy = true;
    this.index++;
    if (this.index === this.orchards.length) {
      this.finished = true;
      await this.ctx.say('orchard.done');
      this.ctx.finish({ misses: this.misses, hints: this.hints });
      return;
    }
    this.orchard = this.orchards[this.index];
    this.oriented = { ...this.orchard };
    this.turned = false;
    this.counted = [];
    this.planted = this.plan.mode === 'missing' ? Array.from({ length: this.orchard.rows - 1 }, (_, i) => i) : [];
    this.phase = this.plan.mode === 'missing' ? 'missing' : 'plant';
    this.rotate.visible = false;
    this.clearPads();
    this.buildRows();
    this.heading.text = `${this.orchard.rows} × ${this.orchard.columns}`;
    this.sentence.text = '';
    if (this.phase === 'missing') {
      this.ask(missingTrees(this.orchard));
      await this.ctx.instruct('orchard.missing', { rows: this.orchard.rows, each: this.orchard.columns, total: total(this.orchard) });
    } else {
      await this.ctx.instruct('orchard.plant', { rows: this.orchard.rows, each: this.orchard.columns });
    }
    this.busy = false;
  }

  private buildRows() {
    for (const node of this.groups.splice(0)) node.destroy({ children: true });
    for (let row = 0; row < this.oriented.rows; row++) {
      const node = new Container();
      onTap(node, () => void this.tapRow(row));
      this.bed.addChild(node);
      this.groups.push(node);
    }
    this.resize(this.view);
  }

  private drawRows() {
    const l = orchardLayout(this.view.w, this.view.h, this.oriented);
    this.groups.forEach((node, row) => {
      for (const child of node.removeChildren()) child.destroy({ children: true });
      const counted = this.counted.includes(row);
      const planted = this.turned || this.planted.includes(row);
      const g = new Graphics().roundRect(-l.width / 2, -46, l.width, 92, 18)
        .fill(counted ? swatch.yellow.light : planted ? swatch.green.light : wood.light)
        .stroke({ width: counted ? 4 : 2, color: counted ? swatch.yellow.line : wood.line });
      g.eventMode = 'none';
      node.addChild(g);
      for (let col = 0; col < this.oriented.columns; col++) {
        const x = (col - (this.oriented.columns - 1) / 2) * (l.width / this.oriented.columns);
        const art = planted ? tree(this.index % 2 ? swatch.orange.fill : swatch.red.fill)
          : new Graphics().ellipse(0, 20, 24, 10).fill(wood.line).moveTo(0, 10).lineTo(0, -10).stroke({ width: 4, color: swatch.green.line })
            .ellipse(-9, -10, 10, 5).ellipse(9, -15, 10, 5).fill(swatch.green.fill);
        art.position.set(x, 0);
        art.eventMode = 'none';
        node.addChild(art);
      }
    });
  }

  private async tapRow(row: number) {
    if (this.busy || this.finished || !['plant', 'count', 'answer'].includes(this.phase)) return;
    this.busy = true;
    if (this.phase === 'plant') {
      if (!this.planted.includes(row)) {
        this.planted.push(row);
        sfx.pop(5 + row);
        this.drawRows();
      }
      await this.ctx.say('orchard.planted', { each: this.orchard.columns, total: this.planted.length * this.orchard.columns });
      if (this.planted.length === this.orchard.rows) await this.beginCount();
    } else {
      // Replaying any row is support, not a mistake or an extra count.
      if (this.phase === 'count') this.counted = countGroup(this.counted, row, this.oriented);
      sfx.marimba(5 + row);
      this.drawRows();
      const subtotal = this.counted.length * this.oriented.columns;
      this.sentence.text = Array(this.counted.length).fill(this.oriented.columns).join(' + ') + ` = ${subtotal}`;
      await this.ctx.say('orchard.counted', { group: this.turned ? 'column' : 'row', each: this.oriented.columns, total: subtotal });
      if (this.phase === 'count' && this.counted.length === this.oriented.rows) {
        this.phase = 'answer';
        this.ask(total(this.orchard));
        await this.ctx.instruct('orchard.total');
      }
    }
    this.busy = false;
  }

  private async beginCount() {
    this.phase = 'count';
    this.counted = [];
    this.sentence.text = '';
    this.clearPads();
    this.drawRows();
    await this.ctx.instruct(this.turned ? 'orchard.columns' : 'orchard.rows', { each: this.oriented.columns });
  }

  private ask(answer: number) {
    this.clearPads();
    this.answer = answer;
    this.wrongs = 0;
    this.hinted = false;
    for (const n of choicesFor(answer, this.ctx.rng, this.phase === 'missing' ? this.orchard.rows : undefined)) {
      const node = new Container();
      node.addChild(tile(120, 110, 'white'), label(String(n), 42));
      onTap(node, () => void this.choose(n));
      this.pads.push({ n, node });
      this.ctx.stage.addChild(node);
    }
    this.resize(this.view);
  }

  private clearPads() {
    for (const p of this.pads.splice(0)) p.node.destroy({ children: true });
    this.hinted = false;
  }

  private async choose(n: number) {
    if (this.busy || this.finished) return;
    this.busy = true;
    if (n !== this.answer) {
      this.misses++;
      this.wrongs++;
      sfx.boing();
      if (this.wrongs >= 2 && !this.hinted) { this.hints++; this.hinted = true; }
      await this.ctx.say(this.phase === 'missing' ? 'orchard.missinghint' : 'orchard.totalhint', { each: this.oriented.columns, total: total(this.orchard), groups: this.oriented.rows });
      this.busy = false;
      return;
    }
    sfx.sparkle();
    this.clearPads();
    if (this.phase === 'missing') {
      this.phase = 'plant';
      this.sentence.text = `+ ${this.orchard.columns}`;
      await this.ctx.instruct('orchard.fill', { each: this.orchard.columns });
      this.busy = false;
      return;
    }
    await this.ctx.say(this.turned ? 'orchard.same' : 'orchard.yes', { total: total(this.orchard), rows: this.orchard.rows, each: this.orchard.columns });
    if (this.plan.mode !== 'plant' && !this.turned) {
      this.phase = 'turn';
      this.rotate.visible = true;
      await this.ctx.instruct('orchard.turn');
      this.busy = false;
    } else await this.next();
  }

  private async rotateOrchard() {
    if (this.busy || this.finished || this.phase !== 'turn') return;
    this.busy = true;
    this.turned = true;
    this.rotate.visible = false;
    this.oriented = turn(this.orchard);
    this.counted = [];
    this.buildRows();
    this.heading.text = `${this.oriented.rows} × ${this.oriented.columns}`;
    await this.beginCount();
    this.busy = false;
  }
}

function orchardArt(seed: number): Container {
  const rng = new Rng(seed);
  const art = new Container();
  art.addChild(new Graphics().roundRect(-105, -105, 210, 175, 20).fill(swatch.green.light).stroke({ width: 4, color: wood.line }));
  const fruit = rng.pick([swatch.red.fill, swatch.orange.fill]);
  for (let row = 0; row < 2; row++) for (let col = 0; col < 3; col++) {
    const t = tree(fruit);
    t.scale.set(0.8);
    t.position.set((col - 1) * 65, -65 + row * 75);
    art.addChild(t);
  }
  return art;
}

export const orchardRows: GameModule = {
  id: 'orchard-rows', name: 'Orchard Rows', titleLine: 'game.orchard-rows', region: 'counting-cove',
  skills: ['equal groups', 'arrays', 'skip counting', 'multiplication'], bands: ['school'],
  levels: band => rangeFor(LEVELS, band), describeLevel: level => planFor(level).name,
  music: STYLES.hub, touchDemo: true,
  coplayHint: 'Count one row together, then add that same number for each new row. Ask what changes when the orchard turns.',
  offScreen: 'Arrange blocks in three rows of four. Count by rows, then look from the side and count by columns. Did any blocks appear?',
  hubIcon: () => { const art = orchardArt(1); art.y = -70; return new WigglyIcon(art); },
  sticker: orchardArt, create: ctx => new OrchardRows(ctx),
};
