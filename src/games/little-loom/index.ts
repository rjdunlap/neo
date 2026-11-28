import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { cream, ink, swatch, wood } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { CLOTH_PALETTE, CLOTH_COLORS } from '../../content/creations';
import { onTap, palmOnGlass } from '../../engine/input';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { finish } from '../../ui/buttons';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { clothArt, emblem, yarnMark } from './art';
import { LEVELS, Round, drawdown, sampleRows, YARN4, PEDALS5, PEDALS, type Pedal } from './logic';
import { layout } from './layout';
class Pad extends Container {
  readonly face = new Container();
  readonly rim = new Graphics();
  constructor(w: number, h: number) {
    super();
    this.hitArea = new Rectangle(-w / 2, -h / 2, w, h);
    this.addChild(finish({ w, h, corner: 20 }, swatch.brown, cream), this.face, this.rim);
    this.face.eventMode = this.rim.eventMode = 'none';
  }
}
const glyph = (lift: readonly boolean[]) => {
  const g = new Graphics();
  lift.forEach((up, c) =>
    g
      .moveTo(-48 + c * 19, up ? -29 : 0)
      .lineTo(-48 + c * 19, up ? 0 : 29)
      .stroke({ color: ink, width: up ? 8 : 3 }),
  );
  return g;
};
export class LittleLoom implements Game {
  readonly root = new Container();
  readonly sceneArt = new Container();
  readonly warp = new Graphics();
  readonly cloth = new Container();
  readonly shuttleArt = new Graphics();
  readonly beater = new Graphics();
  readonly free = new Container();
  readonly shuttle = new Pad(180, 120);
  readonly pots = [0, 1, 2].map(() => new Pad(120, 120));
  readonly pedals = [0, 1].map(() => new Pad(140, 120));
  readonly pots4 = [0, 1].map(() => new Pad(120, 120));
  readonly pedals5 = [0, 1, 2].map(() => new Pad(140, 120));
  readonly undoPad = new Pad(120, 120);
  readonly sampleArt = new Container();
  readonly sampleMark = new Graphics();
  private pulseRow = -1;
  private pulseT = 0;
  private lastGlow: string | null = null;
  readonly round: Round;
  readonly companion;
  boxes;
  elapsed = 0;
  finishing = 0;
  finished = false;
  destroyed = false;
  readonly spoken = new Set<number>();
  hintLabel = 'Show a hint';
  askForHint?: () => void;
  private preview: Pedal | null = null;
  private held: { node: Container; id: number; action: () => void } | null = null;
  get misses() {
    return this.round.misses;
  }
  get hints() {
    return this.round.hints;
  }
  private cancel = () => {
    if (this.held) this.held.node.alpha = 1;
    this.held = null;
    const had = this.preview !== null;
    this.preview = null;
    if (had && !this.destroyed) this.draw();
  };
  private outside = (e: PointerEvent) => {
    if (!(e.target instanceof HTMLCanvasElement)) {
      this.cancel();
      return;
    }
    const b = e.target.getBoundingClientRect();
    if (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom) this.cancel();
  };
  constructor(private ctx: GameContext) {
    this.round = new Round(ctx.level, ctx.rng.int(0, 5));
    this.boxes = layout(ctx.view);
    ctx.stage.addChild(this.root);
    this.root.addChild(
      this.sceneArt,
      this.free,
      this.shuttle,
      ...this.pots,
      ...this.pedals,
      ...this.pots4,
      ...this.pedals5,
      this.undoPad,
    );
    this.sampleArt.eventMode = 'none';
    this.sampleArt.addChild(this.sampleMark);
    this.sceneArt.addChild(this.sampleArt);
    this.sceneArt.eventMode = 'none';
    this.sceneArt.addChild(this.warp, this.cloth, this.shuttleArt, this.beater);
    this.companion = ctx.companion();
    this.companion.scale.set(0.32);
    this.companion.eventMode = 'none';
    ctx.track(this.companion);
    this.sceneArt.addChild(this.companion);
    this.companion.visible = false;
    this.bind(this.free, () => this.throw());
    this.bind(this.shuttle, () => this.throw());
    this.pots.forEach((p, i) => {
      yarnMark(
        p.face.addChild(
          new Graphics().circle(0, 0, 39).fill(CLOTH_COLORS[i]).stroke({ color: ink, width: 3 }),
        ),
        i,
        0,
        0,
        46,
      );
      this.bind(p, () => {
        this.round.choose(i);
        if (!this.spoken.has(i)) {
          this.spoken.add(i);
          void ctx.say('loom.color', { color: CLOTH_PALETTE[i] });
        }
        this.draw();
      });
    });
    const pedalTap = (i: number) => () => {
      this.round.select(i);
      void ctx.instruct('loom.send');
      this.draw();
    };
    this.pedals.forEach((p, i) => {
      p.face.addChild(glyph(PEDALS[i]));
      this.bind(p, pedalTap(i), i);
    });
    this.pedals5.forEach((p, i) => {
      p.face.addChild(glyph(PEDALS5[i]));
      this.bind(p, pedalTap(i), i);
    });
    this.pots4.forEach((p, i) => {
      const id = YARN4[i];
      yarnMark(
        p.face.addChild(
          new Graphics().circle(0, 0, 39).fill(CLOTH_COLORS[id]).stroke({ color: ink, width: 3 }),
        ),
        id,
        0,
        0,
        46,
      );
      this.bind(p, () => {
        this.round.choose(i);
        this.draw();
      });
    });
    this.undoPad.face.addChild(
      new Graphics()
        .moveTo(26, 14)
        .arc(0, 0, 30, 0.5, -Math.PI * 1.1, true)
        .stroke({ color: ink, width: 8 })
        .poly([-34, -34, -34, -2, -2, -18])
        .fill(ink),
    );
    this.bind(this.undoPad, () => {
      if (this.round.undo()) sfx.pop();
      this.pulseRow = -1;
      this.noteHelp();
      this.draw();
    });
    this.shuttle.face.addChild(
      new Graphics()
        .poly([-55, 0, -25, -22, 27, -22, 55, 0, 27, 22, -25, 22])
        .fill(wood.fill)
        .stroke({ color: wood.line, width: 4 }),
    );
    if (this.round.level >= 3)
      this.askForHint = () => {
        if (this.destroyed || this.finished || this.round.busy) return;
        this.round.help();
        this.draw();
        if (this.round.level === 3) void ctx.say('loom.help');
        else this.noteHelp(true);
      };
    this.ctx.listen(window, 'pointercancel', this.cancel, true);
    this.ctx.listen(window, 'pointerup', this.outside, true);
    this.ctx.listen(window, 'blur', this.cancel);
    this.resize(ctx.view);
  }
  private bind(node: Container, action: () => void, preview?: Pedal) {
    onTap(
      node,
      (e) => {
        if (this.destroyed || this.finished || this.round.busy || this.held) return;
        node.alpha = 0.65;
        this.held = { node, id: e.pointerId, action };
        if (preview !== undefined) {
          this.preview = preview;
          this.draw();
        }
      },
      { cooldown: 0 },
    );
    const up = (e: FederatedPointerEvent) => {
      const h = this.held;
      if (!h || h.node !== node || h.id !== e.pointerId) return;
      const p = node.toLocal(e.global);
      const inside = node.hitArea?.contains(p.x, p.y);
      this.cancel();
      if (inside && !palmOnGlass() && !this.round.busy && !this.destroyed && !this.finished) h.action();
    };
    node.on('pointerup', up);
    node.on('pointerupoutside', () => this.cancel());
    node.on('pointerout', () => this.cancel());
  }
  start() {
    void this.ctx.instruct(
      (['loom.zoom', 'loom.yarn', 'loom.pedals', 'loom.checks', 'loom.diagonal'] as const)[
        this.round.level - 1
      ],
    );
  }
  private throw() {
    const r = this.round.begin();
    if (r === 'choose') {
      void this.ctx.instruct('loom.choose-pedal');
      return;
    }
    if (r === 'ignored') return;
    this.elapsed = 0;
    this.draw();
  }
  private draw() {
    const r = this.round,
      l = this.boxes,
      a = l.loom;
    const g = this.warp.clear();
    g.roundRect(a.x - 30, a.y - 35, 6 * a.cell + 60, 8 * a.cell + 65, 18)
      .fill(wood.light)
      .stroke({ color: wood.line, width: 10 });
    for (let c = 0; c < 6; c++) {
      const x = a.x + (c + 0.5) * a.cell;
      g.moveTo(x, a.y - 25)
        .lineTo(x, a.y + 8 * a.cell + 20)
        .stroke({ color: ink, width: 8 });
      g.moveTo(x, a.y - 25)
        .lineTo(x, a.y + 8 * a.cell + 20)
        .stroke({
          color: CLOTH_COLORS[r.warp[c]],
          width: (this.preview ?? r.selected) !== null && r.table[(this.preview ?? r.selected)!][c] ? 6 : 4,
        });
    }
    for (const child of this.cloth.removeChildren()) child.destroy();
    const cells = r.lifts.flatMap((row, i) => drawdown(r.warp, r.yarns[i], row));
    this.cloth.addChild(clothArt(cells, a.cell, r.lifts));
    this.cloth.position.set(a.x, a.y);
    const glow = r.glow,
      plan = r.plan,
      gold = { color: swatch.yellow.fill, width: 6 };
    for (const pots of [this.pots, this.pots4])
      pots.forEach((p, i) => {
        p.rim.clear();
        if (i === r.yarn) p.rim.roundRect(-55, -55, 110, 110, 16).stroke({ color: ink, width: 5 });
        if (r.level === 4 && glow === 'yarn' && plan && YARN4[i] === plan.yarn)
          p.rim.roundRect(-59, -59, 118, 118, 18).stroke(gold);
      });
    for (const pedals of [this.pedals, this.pedals5])
      pedals.forEach((p, i) => {
        p.face.y = (this.preview ?? r.selected) === i ? 8 : 0;
        p.rim.clear();
        if (r.selected === i) p.rim.roundRect(-64, -54, 128, 108, 16).stroke({ color: ink, width: 5 });
        if (r.level === 3 ? r.helped && r.next === i : glow === 'pedal' && plan?.pedal === i)
          p.rim.roundRect(-68, -58, 136, 116, 18).stroke(gold);
      });
    this.undoPad.rim.clear();
    if (glow === 'undo' || (r.full && !r.finished))
      this.undoPad.rim.roundRect(-64, -64, 128, 128, 20).stroke(gold);
    this.drawSample();
    const dir = r.rows % 2 === 0 ? 1 : -1;
    const arrow = this.shuttle.rim.clear();
    arrow
      .moveTo(-dir * 22, 40)
      .lineTo(dir * 25, 40)
      .lineTo(dir * 12, 31)
      .moveTo(dir * 25, 40)
      .lineTo(dir * 12, 49)
      .stroke({ color: ink, width: 5 });
    this.animate();
  }
  private buildSample() {
    const r = this.round,
      a = this.boxes.sample;
    for (const c of this.sampleArt.removeChildren()) if (c !== this.sampleMark) c.destroy();
    this.sampleArt.addChild(this.sampleMark);
    this.sampleArt.visible = !!r.sample;
    if (!r.sample) return;
    this.sampleArt.addChildAt(clothArt(sampleRows(r.sample).flat(), a.cell), 0);
    this.sampleArt.position.set(a.x, a.y);
  }
  private drawSample() {
    const a = this.boxes.sample,
      g = this.sampleMark.clear();
    if (!this.round.sample) return;
    g.roundRect(-5, -5, 6 * a.cell + 10, 8 * a.cell + 10, 8).stroke({ color: wood.line, width: 5 });
    if (this.pulseRow >= 0)
      g.roundRect(-3, this.pulseRow * a.cell - 3, 6 * a.cell + 6, a.cell + 6, 6).stroke({
        color: swatch.yellow.fill,
        width: 6,
        alpha: 0.5 + 0.5 * Math.sin(this.pulseT * 9),
      });
  }
  /** Speaks and glows the right control once, when help has just been asked for. */
  private noteHelp(manual = false) {
    const glow = this.round.glow;
    if (glow && (glow !== this.lastGlow || manual)) {
      const line = ({ undo: 'loom.help-undo', pedal: 'loom.help-pedal', yarn: 'loom.help-yarn' } as const)[
        glow
      ];
      void this.ctx.say(line);
    }
    this.lastGlow = glow;
  }
  private animate() {
    const r = this.round,
      a = this.boxes.loom,
      p = r.pending;
    const t = Math.min(1, this.elapsed / 0.55);
    const dir = r.rows % 2 === 0 ? 1 : -1;
    const start = dir === 1 ? a.x - 45 : a.x + 6 * a.cell + 45,
      end = dir === 1 ? a.x + 6 * a.cell + 45 : a.x - 45;
    const slip = !!p?.error;
    const progress = slip && this.elapsed > 0.55 ? Math.max(0, 1 - (this.elapsed - 0.55) / 0.45) : t;
    const x = p ? start + (end - start) * progress : start,
      y = a.y + Math.min(7, r.rows) * a.cell + a.cell / 2;
    const g = this.shuttleArt.clear();
    if (p) {
      g.moveTo(start, y)
        .lineTo(x, y + (slip ? Math.sin(progress * Math.PI) * 26 : 0))
        .stroke({ color: CLOTH_COLORS[p.yarn], width: 12 });
    }
    g.poly([x - 35, y, x - 15, y - 15, x + 20, y - 15, x + 38, y, x + 20, y + 15, x - 15, y + 15])
      .fill(wood.fill)
      .stroke({ color: wood.line, width: 3 });
    yarnMark(g, p?.yarn ?? r.yarnId, x, y, 16);
    const beat = this.beater.clear();
    if (p && !slip && this.elapsed > 0.55) {
      const by = y - 35 + Math.sin(Math.min(1, (this.elapsed - 0.55) / 0.45) * Math.PI) * 33;
      beat.roundRect(a.x - 20, by, a.cell * 6 + 40, 12, 4).fill(wood.line);
    }
  }
  update(dt: number) {
    if (this.destroyed) return;
    if (this.finishing > 0) {
      this.finishing -= dt;
      if (this.finishing <= 0)
        this.ctx.finish({
          misses: this.round.misses,
          hints: this.round.hints,
          creation: this.round.creation()!,
        });
      return;
    }
    if (this.pulseRow >= 0) {
      this.pulseT += dt;
      if (this.pulseT > 2.2) this.pulseRow = -1;
      this.drawSample();
    }
    if (!this.round.busy) return;
    this.elapsed += dt;
    this.animate();
    if (this.elapsed < 1) return;
    const error = this.round.pending?.error,
      row = this.round.rows;
    const result = this.round.settle();
    if (result === 'slip') {
      sfx.boing();
      void this.ctx.instruct(
        this.round.level >= 4 && error !== 'repeat' ? 'loom.slip-float' : 'loom.slip-repeat',
      );
      this.noteHelp();
    } else if (result === 'differs') {
      sfx.boing();
      this.pulseRow = row;
      this.pulseT = 0;
      void this.ctx.instruct('loom.differs');
      this.noteHelp();
    } else {
      sfx.marimba([0, 2, 4, 7, 9][this.round.rows % 5]);
      if (this.round.level >= 3) void this.ctx.instruct('loom.choose-pedal');
    }
    if (this.round.full && !this.round.finished) {
      this.pulseRow = this.round.firstDiff;
      this.pulseT = 0;
      this.round.help();
      this.lastGlow = null;
      void this.ctx.say('loom.differs');
    }
    this.draw();
    if (this.round.finished && !this.finished) {
      this.finished = true;
      this.companion.visible = true;
      this.cloth.position.set(this.boxes.companion.x - 135, this.boxes.companion.y - 180);
      this.cloth.scale.set(0.5);
      this.finishing = 1.3;
      this.sampleArt.visible = false;
      void this.ctx.say(this.round.level >= 4 ? 'loom.same' : 'loom.done');
    }
  }
  resize(v: View) {
    this.cancel();
    this.boxes = layout(v);
    const l = this.boxes;
    const put = (n: Container, b: { x: number; y: number }) => n.position.set(b.x, b.y);
    const lv = this.round.level,
      hi = lv >= 4;
    put(this.shuttle, hi ? l.shuttle45 : l.shuttle);
    this.pots.forEach((p, i) => {
      put(p, l.pots[i]);
      p.visible = lv === 2;
    });
    this.pots4.forEach((p, i) => {
      put(p, l.pots4[i]);
      p.visible = lv === 4;
    });
    this.pedals.forEach((p, i) => {
      put(p, lv === 4 ? l.pedals4[i] : l.pedals[i]);
      p.visible = lv === 3 || lv === 4;
    });
    this.pedals5.forEach((p, i) => {
      put(p, l.pedals5[i]);
      p.visible = lv === 5;
    });
    put(this.undoPad, l.undo);
    this.undoPad.visible = hi;
    this.buildSample();
    this.shuttle.visible = lv !== 1;
    this.free.visible = this.round.level === 1;
    this.free.hitArea = new Rectangle(l.free.x, l.free.y, l.free.w, l.free.h);
    this.companion.position.set(l.companion.x, l.companion.y);
    this.draw();
  }
  /** Guided first play points at the bot's next move: `autotouch` here only reads the board. */
  showMove(): TouchIntent | null {
    return this.autotouch();
  }

  autotouch(): TouchIntent | null {
    const r = this.round;
    if (this.destroyed || this.finished || r.busy) return null;
    if (r.level === 1)
      return {
        tap: { on: this.free, x: this.boxes.loom.x + 100, y: this.boxes.loom.y + 100 },
        receiver: this.free,
      };
    if (r.level === 2) {
      const yarn = r.rows < 2 ? 0 : r.rows < 5 ? 1 : 2;
      if (r.yarn !== yarn) return { tap: { on: this.pots[yarn] } };
    }
    if (r.level === 3 && r.selected !== r.next) return { tap: { on: this.pedals[r.next] } };
    if (r.level >= 4) {
      const plan = r.plan;
      if (!plan || r.firstDiff >= 0) return null;
      if (r.selected !== plan.pedal)
        return { tap: { on: (r.level === 5 ? this.pedals5 : this.pedals)[plan.pedal] } };
      if (r.level === 4 && r.yarnId !== plan.yarn)
        return { tap: { on: this.pots4[YARN4.indexOf(plan.yarn as 0 | 3)] } };
    }
    return { tap: { on: this.shuttle } };
  }
  destroy() {
    this.cancel();
    this.destroyed = true;
    this.round.destroy();
    this.ctx.untrack(this.companion);
  }
}
export const littleLoom: GameModule = {
  id: 'little-loom',
  name: 'Little Loom',
  titleLine: 'loom.title',
  region: 'treehouse',
  challenge: 'hands',
  skills: ['over and under', 'free stripe choices', 'alternating lifts', 'weaving from a sample'],
  bands: ['toddler', 'preschool', 'prek', 'school'],
  levels: (b) => rangeFor(LEVELS, b),
  describeLevel: (l) =>
    [
      'Zoom the shuttle: eight rows with automatic lifts',
      'Pick the yarn: freely choose each stripe',
      'Two pedals: alternate lifts before each row',
      'Checks: pick pedal and yarn to match a sample cloth',
      'Diagonal: three pedals make a line climb like the sample',
    ][Math.max(0, Math.min(4, l - 1))],
  music: STYLES.quiet,
  touchDemo: true,
  coplayHint:
    'Take turns choosing yarn or pressing a pedal and sending the shuttle. Find a stripe on your clothes together.',
  hubIcon: () => new WigglyIcon(emblem()),
  sticker: () => emblem(),
  create: (ctx) => new LittleLoom(ctx),
};
