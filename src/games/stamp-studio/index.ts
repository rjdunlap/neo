import { Circle, Container, Graphics, Rectangle } from 'pixi.js';
import { cream, swatch, type ColorName } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { spread, type View } from '../../engine/view';
import { RoundButton } from '../../ui/buttons';
import { againIcon, arrowIcon } from '../../ui/icons';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { stampArt } from './art';
import { LIMIT, pixel, place, planFor, roundPlan, STAMP_COLORS, STAMP_NAMES, stickerStamp, stampDemo, type Stamp, type StampKind } from './logic';

interface Mark { data: Stamp; node: Container; drag?: DragHandle }
class StampStudio implements Game {
  readonly plan;
  readonly stamps: Mark[] = [];
  readonly choices: RoundButton[] = [];
  readonly colors: RoundButton[] = [];
  readonly paper = new Container();
  private readonly background = new Graphics();
  private readonly sheet = new Graphics();
  private readonly selection = new Graphics();
  readonly finish: RoundButton;
  readonly undo: RoundButton;
  readonly turn: RoundButton;
  readonly grow: RoundButton;
  readonly bin: RoundButton;
  private nudgeTime = 0;
  private selected: Mark | null = null;
  private readonly named = new Set<StampKind>();
  private fullSaid = false;
  private kind: StampKind;
  private color: ColorName;
  private width = 600;
  private height = 400;
  done = false;
  constructor(private readonly ctx: GameContext) {
    const round = roundPlan(ctx.level, ctx.rng);
    this.plan = round.plan; this.color = round.color; this.kind = this.plan.kinds[0];
    this.paper.addChild(this.sheet, this.selection);
    this.selection.eventMode = 'none';
    ctx.stage.addChild(this.background, this.paper);
    onTap(this.sheet, e => {
      if (this.done) return;
      const p = this.paper.toLocal(e.global);
      if (this.stamps.length >= LIMIT) {
        if (!this.fullSaid) { this.fullSaid = true; void ctx.say('stamp.full'); }
        return;
      }
      this.add(p.x, p.y);
    }, { cooldown: this.plan.pat ? 0 : undefined }); // pats close together are all kept
    this.plan.kinds.forEach(kind => {
      const b = new RoundButton(stampArt(kind, this.color, 33), swatch.white, 48, () => { if (this.done) return; this.kind = kind;
        if (!this.named.has(kind)) { this.named.add(kind); void ctx.say('stamp.kind', { kind: STAMP_NAMES[kind] }); }
        this.drawSelection(); });
      ctx.stage.addChild(b); this.choices.push(b);
    });
    if (this.plan.color) for (const color of STAMP_COLORS) {
      const b = new RoundButton(new Graphics().circle(0, 0, 22).fill(swatch[color].fill), swatch.white, 43, () => { if (this.done) return; if (this.color !== color) { this.color = color; this.redrawChoices(); }
        void ctx.say('color.' + color as 'color.blue'); this.drawSelection(); });
      ctx.stage.addChild(b); this.colors.push(b);
    }
    this.finish = new RoundButton(arrowIcon(1), swatch.green, 48, () => this.complete());
    this.undo = new RoundButton(arrowIcon(-1), swatch.white, 48, () => this.remove(this.stamps.at(-1) ?? null));
    const binArt = new Graphics().roundRect(-19, -15, 38, 42, 5).stroke({ width: 6, color: swatch.brown.line })
      .moveTo(-26, -22).lineTo(26, -22).moveTo(-9, -29).lineTo(9, -29)
      .moveTo(-7, -5).lineTo(-7, 16).moveTo(7, -5).lineTo(7, 16).stroke({ width: 6, color: swatch.brown.line });
    this.bin = new RoundButton(binArt, swatch.white, 48, () => { if (this.plan.move) this.remove(this.selected); });
    this.turn = new RoundButton(againIcon(), swatch.white, 48, () => { if (!this.done && this.selected) { this.selected.data.turns = (this.selected.data.turns + 1) % 4; this.layoutStamp(this.selected); this.drawSelection(); } });
    this.grow = new RoundButton(new Graphics().circle(-13, 4, 12).circle(14, -4, 23).fill(swatch.purple.fill), swatch.white, 48, () => { if (!this.done && this.selected) { this.selected.data.size = this.selected.data.size === 1 ? 1.3 : 1; this.layoutStamp(this.selected); this.drawSelection(); } });
    ctx.stage.addChild(this.finish, this.undo, this.turn, this.grow, this.bin);
  }
  private complete() {
    if (this.done || !this.stamps.length) return;
    this.done = true; this.finish.rotation = 0;
    // Freeze before the wake-up, including a stamp held by another finger.
    this.stamps.forEach(s => {
      if (s.drag) { s.drag.enabled = false; s.drag.destroy(); }
      this.ctx.tw.kill(s.node.scale); s.node.scale.set(1); this.layoutStamp(s);
    });
    const creation = { kind: 'picture' as const, stamps: this.stamps.map(s => ({ ...s.data })) };
    void this.ctx.say('stamp.done'); sfx.sparkle();
    void this.ctx.tw.wait(0.9).then(() => this.ctx.finish({ misses: 0, hints: 0, creation }));
  }
  private remove(mark: Mark | null) {
    if (this.done || !mark) return;
    const index = this.stamps.indexOf(mark); if (index < 0) return;
    this.stamps.splice(index, 1);
    mark.drag?.destroy(); this.ctx.tw.kill(mark.node); this.ctx.tw.kill(mark.node.scale);
    mark.node.destroy({ children: true });
    if (this.selected === mark) this.selected = this.stamps.at(-1) ?? null;
    this.drawSelection();
  }
  private redrawChoices() {
    this.choices.forEach((button, i) => {
      button.removeChildAt(1).destroy({ children: true });
      button.addChild(stampArt(this.plan.kinds[i], this.color, 33));
    });
  }
  private add(x: number, y: number) {
    const data: Stamp = { kind: this.kind, color: this.color, ...place(x, y, this.width, this.height), size: this.plan.pat?.size ?? 1, turns: 0 };
    const node = new Container(); node.addChild(stampArt(data.kind, data.color)); node.hitArea = new Circle(0, 0, 55);
    this.paper.addChild(node);
    const mark: Mark = { data, node };
    if (this.plan.move) mark.drag = draggable(node, this.ctx.tw, {
      onPick: () => { this.selected = mark; this.drawSelection(); sfx.tick(); },
      onDrop: (x, y) => {
        Object.assign(data, place(x, y, this.width, this.height));
        this.layoutStamp(mark); this.drawSelection(); return true;
      },
    });
    else node.eventMode = 'none';
    this.stamps.push(mark); this.selected = mark; this.layoutStamp(mark); this.drawSelection(); sfx.pop(5 + this.stamps.length % 5);
    if (this.ctx.level <= 2 && this.stamps.length === LIMIT || this.plan.pat && this.stamps.length >= this.plan.pat.count) this.complete();
  }
  private layoutStamp(s: Mark) {
    const p = pixel(s.data, this.width, this.height);
    this.ctx.tw.kill(s.node); s.node.position.set(p.x, p.y); s.node.rotation = s.data.turns * Math.PI / 2;
    // Transform only the drawing; drag hit areas remain at least 110 units.
    s.node.children[0].scale.set(s.data.size);
    if (s.drag) s.drag.home = p;
  }
  private drawSelection() {
    this.selection.clear();
    if (this.selected && this.plan.move) this.selection.circle(this.selected.node.x, this.selected.node.y, 70).stroke({ width: 5, color: swatch.yellow.line });
    this.finish.visible = this.stamps.length > 0; this.undo.visible = this.stamps.length > 0;
    this.bin.visible = this.plan.move && !!this.selected;
    if (this.stamps.length < 5) { this.nudgeTime = 0; this.finish.rotation = 0; }
    this.turn.visible = this.grow.visible = this.plan.transform && !!this.selected;
    this.choices.forEach((b, i) => b.alpha = this.plan.kinds[i] === this.kind ? 1 : 0.68);
    this.colors.forEach((b, i) => b.alpha = STAMP_COLORS[i] === this.color ? 1 : 0.65);
  }
  start() { void this.ctx.instruct(`stamp.${this.plan.prompt}`); }
  resize(v: View) {
    this.background.clear().rect(0, 0, v.w, v.h).fill(swatch.teal.light);
    this.width = v.w - 350; this.height = v.h - 290;
    this.paper.position.set(180, 135);
    this.sheet.clear().roundRect(0, 0, this.width, this.height, 24).fill(cream).stroke({ width: 7, color: swatch.brown.line });
    this.sheet.hitArea = new Rectangle(0, 0, this.width, this.height);
    const xs = spread(this.choices.length, 185, v.w - 180, 135);
    this.choices.forEach((b,i) => b.position.set(xs[i], v.h - 77));
    this.colors.forEach((b,i) => b.position.set(220 + i * 125, 65));
    this.finish.position.set(v.w - 77, 65); this.undo.position.set(v.w - 77, v.h - 77);
    this.bin.position.set(v.w - 77, v.h / 2 - (this.plan.transform ? 130 : 0));
    this.turn.position.set(v.w - 77, v.h / 2); this.grow.position.set(v.w - 77, v.h / 2 + 130);
    for (const s of this.stamps) this.layoutStamp(s);
    this.drawSelection();
  }
  update(dt: number) {
    if (!this.done && this.ctx.level <= 2 && this.stamps.length >= 5) {
      this.nudgeTime += dt;
      this.finish.rotation = Math.sin(this.nudgeTime * 4) * 0.12;
    }
  }
  /** The ghost finger: make a small picture with what this level offers (stamps, colors, a turn, a bigger stamp, a carried stamp), then press the green arrow. */
  autotouch(): TouchIntent | null {
    if (this.done) return null;
    const move = stampDemo(this.plan, { stamps: this.stamps.map(s => s.data), kind: this.kind, color: this.color });
    switch (move.do) {
      case 'kind': return { tap: { on: this.choices[(this.plan.kinds as readonly StampKind[]).indexOf(move.kind)] } };
      case 'color': return { tap: { on: this.colors[STAMP_COLORS.indexOf(move.color)] } };
      case 'stamp': return { tap: { on: this.sheet, ...pixel(move, this.width, this.height) } };
      case 'turn': return { tap: { on: this.turn } };
      case 'grow': return { tap: { on: this.grow } };
      case 'move': return { drag: { on: this.stamps[move.stamp].node }, to: { on: this.paper, ...pixel(move, this.width, this.height) } };
      default: return { tap: { on: this.finish } };
    }
  }
  destroy() { this.stamps.forEach(s => s.drag?.destroy()); }
}
export const stampStudio: GameModule = {
  id: 'stamp-studio', name: 'Stamp Studio', titleLine: 'game.stamp-studio', region: 'treehouse',
  skills: ['composition', 'creative-expression', 'spatial-reasoning'], bands: ['lap', 'toddler', 'preschool', 'prek', 'school'],
  levels: b => b === 'school' ? { min: 5, max: 6 } : b === 'lap' ? { min: 1, max: 7, order: [7, 1, 2] } : b === 'toddler' ? { min: 2, max: 3 } : b === 'preschool' ? { min: 3, max: 5 } : { min: 4, max: 6 },
  entryLevels: [7], describeLevel: l => planFor(l).name, music: STYLES.paint, touchDemo: true,
  coplayHint: 'Let {name} choose where the picture goes. The green arrow finishes any creation.',
  offScreen: 'Stamp with a sponge or potato on scrap paper, then tell a story about the picture.',
  hubIcon: () => { const c = new Container(); c.addChild(new Graphics().roundRect(-90,-140,180,140,15).fill(cream).stroke({width:7,color:swatch.brown.line})); const a=stampArt('flower','pink');a.y=-70;c.addChild(a);return new WigglyIcon(c); },
  sticker: seed => { const { kind, color } = stickerStamp(seed); return stampArt(kind, color, 70); },
  create: ctx => new StampStudio(ctx),
};
