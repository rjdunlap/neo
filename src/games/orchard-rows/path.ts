import { Container, Graphics } from 'pixi.js';
import { cream, grass, ink, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { label } from '../../ui/text';
import { tile } from '../shared';
import type { Game, GameContext, TouchIntent } from '../types';
import { drawArrow, FRUIT, tree } from './baskets';
import {
  across,
  answerOf,
  makePathRound,
  PATH_GAP,
  pathBot,
  pathCell,
  pathChoices,
  pathHint,
  pathLayout,
  partsOf,
  pathStep,
  QUESTIONS,
  rowsOf,
  skipCount,
  startPath,
  taskOf,
  unitOf,
  type Box,
  type PathAction,
  type PathLayout,
  type PathRound,
  type PathState,
  type PathTask,
} from './logic';

/** Each part stands on its own ground; its sign wears the same colour. */
const PART_COLOR = ['yellow', 'blue'] as const;
/** Seconds each row of a part stays lit before the next, while the pet counts it. */
const ROW_TIME = 0.4;
/** Seconds the orchard takes to grow, row by row. */
const GROW_ROW = 0.12;

interface Tree {
  node: Graphics;
  row: number;
  col: number;
  at: { x: number; y: number };
}

/** Levels 7–9: a path splits a grown orchard into two parts; she counts each part, then the whole. */
export class PathOrchard implements Game {
  readonly round: PathRound;
  state: PathState;
  layout: PathLayout | null = null;
  /** True through instructions and replies; the controls wait. */
  busy = true;
  finished = false;
  speaking = 0;
  /** The pads for the current question. */
  choices: number[] = [];
  readonly pads: Container[] = [];
  readonly signs: Container[] = [];
  readonly up = new Container();
  readonly down = new Container();
  readonly card = new Container();
  readonly lay = new Container();
  private readonly backdrop: Backdrop;
  private readonly ground = new Graphics();
  private readonly path = new Graphics();
  private readonly lights = new Graphics();
  private readonly orchard = new Container();
  private readonly glow = new Graphics();
  private readonly heading = label('', 30);
  private trees: Tree[] = [];
  private view: View;
  private clock = 0;
  private growStart = -Infinity;
  /** A part's rows lighting one at a time. */
  private lit: { part: 0 | 1; at: number; rows: number; played: number } | null = null;
  /** Where the path is drawn, easing toward the split. */
  private pathAt = 0;
  private arrowWobble: { node: Container; at: number } | null = null;
  private pressed: { node: Container; at: number } | null = null;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.round = makePathRound(ctx.level, ctx.rng);
    this.state = startPath(this.round);
    this.backdrop = new Backdrop(
      {
        sky: [swatch.blue.light, cream],
        hills: [grass, swatch.green.light],
        horizon: 0.3,
        clouds: 2,
        sun: true,
        seed: 46,
      },
      ctx.view,
    );
    for (const g of [this.ground, this.path, this.lights, this.orchard, this.glow, this.heading, this.card])
      g.eventMode = 'none';
    for (let i = 0; i < 3; i++) {
      const pad = new Container();
      onTap(pad, () => this.press({ kind: 'pad', n: this.choices[i] }, pad));
      this.pads.push(pad);
    }
    for (const part of [0, 1] as const) {
      const sign = new Container();
      onTap(sign, () => this.press({ kind: 'sign', part }, sign));
      this.signs.push(sign);
    }
    onTap(this.up, () => this.press({ kind: 'up' }, this.up));
    onTap(this.down, () => this.press({ kind: 'down' }, this.down));
    onTap(this.lay, () => this.press({ kind: 'lay' }, this.lay));
    this.lay.addChild(
      tile(130, 110, 'yellow'),
      new Graphics()
        .roundRect(-48, -14, 96, 28, 8)
        .fill(wood.light)
        .stroke({ width: 3, color: wood.line })
        .circle(-24, 0, 6)
        .circle(0, 0, 6)
        .circle(24, 0, 6)
        .fill(swatch.white.light),
    );
    ctx.stage.addChild(
      this.backdrop,
      this.ground,
      this.path,
      this.lights,
      this.orchard,
      this.heading,
      ...this.signs,
      this.up,
      this.card,
      this.down,
      this.lay,
      ...this.pads,
      this.glow,
    );
  }

  get level() {
    return this.state.level;
  }
  get task(): PathTask {
    return taskOf(this.state);
  }

  start() {
    void this.begin();
  }
  destroy() {
    this.finished = true;
  }

  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.speaking > 0 || this.lighting() || this.growing()) return null;
    const a = pathBot(this.state);
    if (!a) return null;
    if (a.kind === 'pad') {
      const i = this.choices.indexOf(a.n);
      return i < 0 ? null : { tap: { on: this.pads[i] } };
    }
    return a.kind === 'up' || a.kind === 'down' || a.kind === 'lay' ? { tap: { on: this[a.kind] } } : null;
  }

  resize(view: View) {
    this.view = view;
    this.backdrop.resize(view);
    this.heading.position.set(view.w / 2, 62);
    this.layout = pathLayout(view, this.level);
    const l = this.layout;
    if (!l) return;
    const at = (node: Container, b: Box | null) => {
      if (b) node.position.set(b.x + b.w / 2, b.y + b.h / 2);
    };
    l.pads.forEach((b, i) => at(this.pads[i], b));
    l.signs.forEach((b, i) => at(this.signs[i], b));
    at(this.up, l.up);
    at(this.down, l.down);
    at(this.card, l.card);
    at(this.lay, l.lay);
    // The path moves up and down in both orientations.
    if (l.up && l.down) {
      drawArrow(this.up, l.up, 'up');
      drawArrow(this.down, l.down, 'down');
    }
    this.drawPads();
    this.drawSigns();
    this.drawCard();
    this.placeOrchard(false);
  }

  update(dt: number) {
    this.clock += dt;
    this.animate(dt);
    for (const c of [...this.pads, ...this.signs, this.up, this.down, this.lay]) c.alpha = 1;
    if (this.pressed && this.clock - this.pressed.at < 0.15) this.pressed.node.alpha = 0.7;
    this.drawGlow();
  }

  // ---- flow ----

  private async begin() {
    this.resize(this.view);
    await this.newOrchard();
  }

  private async talk(p: Promise<void>) {
    this.speaking++;
    try {
      await p;
    } finally {
      this.speaking--;
    }
  }

  /** The orchard grows row by row with the path drawn across; level 8 then asks for the path. */
  private async newOrchard() {
    this.busy = true;
    this.lit = null;
    this.buildTrees();
    this.growStart = this.clock;
    sfx.sparkle();
    this.showControls();
    this.drawHeading();
    if (!this.state.laid) {
      await this.talk(
        this.ctx.instruct('orchard.choosepath', { rows: this.task.rows, each: this.task.columns }),
      );
    } else await this.ask();
    if (!this.finished) this.busy = false;
  }

  private questionLine() {
    const q = this.state.question;
    if (q === 2) return 'orchard.pathwhole';
    if (across(this.level)) return q === 0 ? 'orchard.pathtop' : 'orchard.pathbottom';
    return q === 0 ? 'orchard.pathten' : 'orchard.pathones';
  }

  /** New pads for the current question, and its spoken instruction. */
  private async ask() {
    this.choices = pathChoices(
      answerOf(this.state),
      QUESTIONS[this.state.question],
      this.task,
      this.level,
      this.ctx.rng,
    );
    this.drawPads();
    this.drawSigns();
    this.showControls();
    await this.talk(this.ctx.instruct(this.questionLine()));
  }

  private press(a: PathAction, node: Container) {
    if (this.finished) return;
    // Touch-down feedback even while a line is playing.
    this.pressed = { node, at: this.clock };
    if (this.busy) return;
    void this.act(a, node);
  }

  private async act(a: PathAction, node: Container) {
    const before = this.state;
    const { state, outcome } = pathStep(this.state, a);
    this.state = state;
    switch (outcome) {
      case 'end':
        this.arrowWobble = { node, at: this.clock };
        sfx.pluck(1, 0.15);
        return;
      case 'moved':
        sfx.pluck(4 + state.split, 0.2);
        this.placeOrchard(false);
        this.drawCard();
        this.drawHeading();
        return;
      case 'ignored':
        return;
      default:
        break;
    }
    this.busy = true;
    if (outcome === 'laid') {
      sfx.clunk();
      this.drawHeading();
      await this.talk(
        this.ctx.say('orchard.pathlaid', { above: this.task.split, below: this.task.rows - this.task.split }),
      );
      if (!this.finished) await this.ask();
    } else if (outcome === 'ask') {
      await this.talk(this.ctx.say(this.questionLine()));
    } else if (outcome === 'recount' && a.kind === 'sign') {
      await this.countPart(a.part);
    } else if (outcome === 'wrong') {
      sfx.boing();
      const glowed = state.glowing && !before.glowing;
      if (before.question === 2) {
        const [pa, pb] = partsOf(this.level, this.task);
        await this.talk(this.ctx.say('orchard.wholehint', { a: pa, b: pb, total: pa + pb }));
      } else await this.countPart(before.question as 0 | 1);
      if (glowed && !this.finished) await this.talk(this.ctx.say('orchard.followglow'));
    } else if (outcome === 'right') {
      // The whole answered: the finished orchard stays on screen (and in the drawing) until the next one grows.
      if (before.question === 2) this.state = before;
      await this.right(before, state);
      return;
    }
    if (!this.finished) this.busy = false;
  }

  /** A part's rows light one at a time while the pet counts them by rows. */
  private async countPart(part: 0 | 1) {
    const t = this.task,
      rows = rowsOf(this.level, t, part),
      each = unitOf(this.level, t, part);
    this.lit = { part, at: this.clock, rows, played: 0 };
    if (rows === 1) await this.talk(this.ctx.say('orchard.partone', { each }));
    else await this.talk(this.ctx.say('orchard.partcount', { rows, each, count: skipCount(rows, each) }));
  }

  private async right(before: PathState, next: PathState) {
    sfx.sparkle();
    const t = taskOf(before);
    const [pa, pb] = partsOf(this.level, t);
    this.choices = [];
    this.drawPads();
    this.drawSigns(before.question + 1);
    if (before.question < 2) {
      const part = before.question as 0 | 1;
      const rows = rowsOf(this.level, t, part),
        each = unitOf(this.level, t, part);
      this.lit = { part, at: this.clock, rows, played: 0 };
      await this.talk(
        this.ctx.say(rows === 1 ? 'orchard.partone' : 'orchard.yes', { rows, each, total: rows * each }),
      );
      if (!this.finished) await this.ask();
      if (!this.finished) this.busy = false;
      return;
    }
    this.drawHeading(true);
    await this.talk(
      this.ctx.say('orchard.pathjoin', { a: pa, b: pb, total: pa + pb, rows: t.rows, each: t.columns }),
    );
    if (this.finished) return;
    this.state = next;
    if (this.state.done) {
      this.finished = true;
      await this.talk(this.ctx.say('orchard.done.path'));
      this.ctx.finish({ misses: this.state.misses, hints: this.state.hints });
      return;
    }
    await this.newOrchard();
  }

  // ---- drawing ----

  /** Before the path is laid, level 8 shows the arrows, the card and the path button; the pads take their place after. */
  private showControls() {
    const choosing = !this.state.laid;
    for (const c of [this.up, this.down, this.card, this.lay]) c.visible = choosing;
    for (const p of this.pads) p.visible = !choosing && this.choices.length > 0;
  }

  private drawHeading(whole = false) {
    const t = this.task;
    if (!this.state.laid) {
      this.heading.text = `${t.rows} × ${t.columns}`;
      return;
    }
    const [a, b] = partsOf(this.level, t);
    const sum = across(this.level)
      ? `${t.split} × ${t.columns} + ${t.rows - t.split} × ${t.columns}`
      : `${t.rows} × 10 + ${t.rows} × ${t.columns - 10}`;
    this.heading.text = `${t.rows} × ${t.columns} = ${sum}${whole ? ` = ${a} + ${b} = ${a + b}` : ''}`;
  }

  private drawPads() {
    const l = this.layout;
    this.pads.forEach((pad, i) => {
      for (const c of pad.removeChildren()) c.destroy({ children: true });
      const n = this.choices[i];
      pad.visible = n !== undefined && this.state.laid;
      if (n === undefined || !l) return;
      pad.addChild(tile(l.pads[i].w, l.pads[i].h, 'white'), label(String(n), 42));
    });
  }

  /** A sign shows its part's rows as dots until that part is answered, then the part's total. */
  private drawSigns(answered: number = this.state.question) {
    const l = this.layout;
    const t = this.task,
      parts = partsOf(this.level, t);
    this.signs.forEach((sign, i) => {
      const part = i as 0 | 1;
      for (const c of sign.removeChildren()) c.destroy({ children: true });
      sign.visible = this.state.laid;
      if (!l) return;
      sign.addChild(tile(l.signs[i].w, l.signs[i].h, PART_COLOR[part]));
      if (answered > part) {
        sign.addChild(label(String(parts[part]), 40));
        return;
      }
      const rows = rowsOf(this.level, t, part),
        each = unitOf(this.level, t, part);
      const sp = Math.min(90 / each, 76 / rows, 14),
        r = Math.max(1.5, Math.min(4.5, sp * 0.35));
      const g = new Graphics();
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < each; x++) g.circle((x - (each - 1) / 2) * sp, (y - (rows - 1) / 2) * sp, r);
      sign.addChild(g.fill(ink));
    });
  }

  /** The card: bars for the rows above, a brown path line, then bars for the rows below. A picture only. */
  private drawCard() {
    for (const c of this.card.removeChildren()) c.destroy({ children: true });
    const b = this.layout?.card;
    if (!b) return;
    this.card.addChild(tile(b.w, b.h, 'white'));
    const t = this.task,
      gap = Math.min(10, 84 / t.rows);
    const top = -(t.rows * gap + 10) / 2;
    const g = new Graphics();
    for (let r = 0; r < t.rows; r++)
      g.roundRect(-40, top + r * gap + (r >= t.split ? 10 : 0), 80, Math.max(3, gap - 3), 2);
    g.fill(swatch.green.line);
    g.rect(-48, top + t.split * gap + 1, 96, 6).fill(wood.line);
    this.card.addChild(g);
  }

  private buildTrees() {
    for (const c of this.orchard.removeChildren()) c.destroy({ children: true });
    this.trees = [];
    const t = this.task,
      fruit = FRUIT[this.round.fruit];
    for (let row = 0; row < t.rows; row++)
      for (let col = 0; col < t.columns; col++) {
        const node = tree(fruit);
        this.orchard.addChild(node);
        this.trees.push({ node, row, col, at: { x: 0, y: 0 } });
      }
    this.pathAt = this.task.split;
    this.placeOrchard(true);
  }

  /** The orchard's geometry: cell, origin and the path's gap after `split` rows (7–8) or ten columns (9). */
  private geometry() {
    const l = this.layout;
    if (!l) return null;
    const t = this.task,
      bed = l.bed,
      cell = pathCell(bed, this.level, t);
    const wide = across(this.level);
    const w = t.columns * cell + (wide ? 0 : PATH_GAP),
      h = t.rows * cell + (wide ? PATH_GAP : 0);
    return { cell, x0: bed.x + (bed.w - w) / 2, y0: bed.y + (bed.h - h) / 2, w, h, wide };
  }

  /** Tree centres for the current split; `snap` places them at once, otherwise they ease there. */
  private placeOrchard(snap: boolean) {
    const g = this.geometry();
    if (!g) return;
    const t = this.task;
    for (const tr of this.trees) {
      const x = g.x0 + (tr.col + 0.5) * g.cell + (!g.wide && tr.col >= 10 ? PATH_GAP : 0);
      const y = g.y0 + (tr.row + 0.5) * g.cell + (g.wide && tr.row >= t.split ? PATH_GAP : 0);
      tr.at = { x, y: y - g.cell * 0.05 };
      tr.node.scale.x = g.cell / 80;
      if (snap) tr.node.position.set(tr.at.x, tr.at.y);
    }
    if (snap) this.pathAt = t.split;
    this.drawGround();
  }

  /** Each part's ground, and the path with its stepping stones between them. */
  private drawGround() {
    const g = this.geometry();
    this.ground.clear();
    this.path.clear();
    if (!g) return;
    const pad = 8;
    const asked = this.state.laid && this.state.question < 2 ? this.state.question : -1;
    const pulse = (0.25 * (1 + Math.sin(this.clock * 4))) / 2;
    const fill = (part: 0 | 1, x: number, y: number, w: number, h: number) => {
      const c = swatch[PART_COLOR[part]];
      this.ground
        .roundRect(x - pad, y - pad, w + 2 * pad, h + 2 * pad, 16)
        .fill({ color: c.light, alpha: 1 })
        .stroke({
          width: 3 + (asked === part ? 3 : 0),
          color: c.line,
          alpha: asked === part ? 0.75 + pulse : 0.6,
        });
    };
    if (g.wide) {
      const split = this.pathAt,
        above = split * g.cell;
      fill(0, g.x0, g.y0, g.w, above);
      fill(1, g.x0, g.y0 + above + PATH_GAP, g.w, g.h - above - PATH_GAP);
      const y = g.y0 + above;
      this.path
        .roundRect(g.x0 - pad - 14, y + 4, g.w + 2 * pad + 28, PATH_GAP - 8, 12)
        .fill(wood.fill)
        .stroke({ width: 2, color: wood.line });
      for (let x = g.x0; x < g.x0 + g.w; x += 46) this.path.ellipse(x + 10, y + PATH_GAP / 2, 11, 7);
      this.path.fill(wood.light);
    } else {
      const left = 10 * g.cell;
      fill(0, g.x0, g.y0, left, g.h);
      fill(1, g.x0 + left + PATH_GAP, g.y0, g.w - left - PATH_GAP, g.h);
      const x = g.x0 + left;
      this.path
        .roundRect(x + 4, g.y0 - pad - 14, PATH_GAP - 8, g.h + 2 * pad + 28, 12)
        .fill(wood.fill)
        .stroke({ width: 2, color: wood.line });
      for (let y = g.y0; y < g.y0 + g.h; y += 46) this.path.ellipse(x + PATH_GAP / 2, y + 10, 7, 11);
      this.path.fill(wood.light);
    }
  }

  growing() {
    return this.clock - this.growStart < this.task.rows * GROW_ROW + 0.3;
  }
  lighting() {
    return this.lit !== null && this.clock - this.lit.at < this.lit.rows * ROW_TIME;
  }

  private animate(dt: number) {
    const g = this.clock - this.growStart;
    const ease = Math.min(1, dt * 14);
    for (const tr of this.trees) {
      tr.node.position.set(
        tr.node.x + (tr.at.x - tr.node.x) * ease,
        tr.node.y + (tr.at.y - tr.node.y) * ease,
      );
      const grow = Math.max(0.05, Math.min(1, (g - tr.row * GROW_ROW) / 0.3));
      tr.node.scale.y = tr.node.scale.x * grow;
    }
    // The path slides a row in about 0.15 s.
    const target = this.task.split;
    if (this.pathAt !== target) {
      const step = dt / 0.15;
      this.pathAt =
        Math.abs(target - this.pathAt) <= step
          ? target
          : this.pathAt + Math.sign(target - this.pathAt) * step;
    }
    this.drawGround();
    this.drawLights();
    for (const c of [this.up, this.down]) c.rotation = 0;
    const aw = this.arrowWobble ? this.clock - this.arrowWobble.at : 1;
    if (this.arrowWobble && aw < 0.4)
      this.arrowWobble.node.rotation = Math.sin(aw * 40) * 0.1 * (1 - aw / 0.4);
  }

  /** The counted part's rows light one at a time, a marimba note for each. */
  private drawLights() {
    this.lights.clear();
    const lit = this.lit,
      g = this.geometry();
    if (!lit || !g) return;
    const shown = Math.min(lit.rows, Math.floor((this.clock - lit.at) / ROW_TIME) + 1);
    if (shown > lit.played && this.clock - lit.at < lit.rows * ROW_TIME) {
      sfx.marimba(3 + shown);
      lit.played = shown;
    }
    // The lit rows fade once the count is through.
    const fade = Math.max(0, Math.min(1, 1 - (this.clock - lit.at - lit.rows * ROW_TIME - 1.2) / 0.5));
    if (fade <= 0) {
      this.lit = null;
      return;
    }
    const t = this.task;
    for (let k = 0; k < shown; k++) {
      let x: number, y: number, w: number;
      if (g.wide) {
        const row = lit.part === 0 ? k : t.split + k;
        x = g.x0;
        w = g.w;
        y = g.y0 + row * g.cell + (row >= t.split ? PATH_GAP : 0);
      } else {
        y = g.y0 + k * g.cell;
        x = lit.part === 0 ? g.x0 : g.x0 + 10 * g.cell + PATH_GAP;
        w = lit.part === 0 ? 10 * g.cell : (t.columns - 10) * g.cell;
      }
      this.lights
        .roundRect(x - 4, y + 2, w + 8, g.cell - 4, 10)
        .fill({ color: swatch.yellow.fill, alpha: 0.45 * fade })
        .stroke({ width: 3, color: swatch.yellow.line, alpha: fade });
    }
  }

  private drawGlow() {
    this.glow.clear();
    const l = this.layout;
    const n = pathHint(this.state);
    if (n === null || this.busy || !l || this.finished) return;
    const i = this.choices.indexOf(n);
    if (i < 0) return;
    const b = l.pads[i];
    this.glow
      .roundRect(b.x - 8, b.y - 8, b.w + 16, b.h + 16, 22)
      .stroke({ width: 6 + 2 * Math.sin(this.clock * 5), color: swatch.yellow.fill });
  }
}
