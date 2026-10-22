import { Container, Graphics, Rectangle } from 'pixi.js';
import { swatch } from '../../art/palette';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { spread, type View } from '../../engine/view';
import { RoundButton } from '../../ui/buttons';
import { arrowIcon } from '../../ui/icons';
import type { Game, GameContext, TouchIntent } from '../types';
import { printArt, traceArt } from './art';
import { pixel, place, planFor, TRACE_MAKERS, traceDemo, traceMargin, tracePress, traceRound, traceTilt, traceUndo, type StampPlan, type TraceMakerId } from './logic';

interface Print { maker: TraceMakerId; x: number; y: number; tilt: number; node: Graphics }

/**
 * Trace Prints (levels 8–9): the paper is soft mud and each stamp is a real thing that leaves its own shape. A press shows the
 * print at once while the maker lifts away from it. Every touch is creative play (0 misses, 0 hints) and nothing is kept.
 */
export class TracePrints implements Game {
  readonly plan: NonNullable<StampPlan['trace']>;
  readonly round = traceRound();
  readonly prints: Print[] = [];
  /** The maker buttons (level 9 only), in the plan's order. */
  readonly makers: RoundButton[] = [];
  readonly paper = new Container();
  readonly sheet = new Graphics();
  readonly finish: RoundButton;
  readonly undo: RoundButton;
  private readonly background = new Graphics();
  private readonly blots = new Graphics();
  private readonly marks = new Container();
  private readonly lifts = new Container();
  private readonly named = new Set<TraceMakerId>();
  chosen: TraceMakerId;
  private width = 600;
  private height = 400;
  private markSaid = false;
  done = false;
  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level).trace!;
    this.chosen = this.plan.makers[0];
    this.blots.eventMode = 'none'; this.marks.eventMode = 'none'; this.lifts.eventMode = 'none';
    this.paper.addChild(this.sheet, this.blots, this.marks, this.lifts);
    ctx.stage.addChild(this.background, this.paper);
    onTap(this.sheet, e => { if (!this.done) { const p = this.paper.toLocal(e.global); this.press(p.x, p.y); } },
      { cooldown: this.plan.makers.length === 1 ? 0 : undefined }); // close pats are all kept
    if (this.plan.makers.length > 1) for (const maker of this.plan.makers) {
      const b = new RoundButton(traceArt(maker, 90 / TRACE_MAKERS[maker].across), swatch.white, 60, () => this.choose(maker));
      ctx.stage.addChild(b); this.makers.push(b);
    }
    this.finish = new RoundButton(arrowIcon(1), swatch.green, 48, () => this.complete());
    this.undo = new RoundButton(arrowIcon(-1), swatch.white, 48, () => this.removeLast());
    ctx.stage.addChild(this.finish, this.undo);
    this.refresh();
  }
  private choose(maker: TraceMakerId) {
    if (this.done) return;
    this.chosen = maker;
    const b = this.makers[this.plan.makers.indexOf(maker)];
    b.scale.set(1.12); void this.ctx.tw.to(b.scale, { x: 1, y: 1 }, { duration: 0.2 });
    if (!this.named.has(maker)) {
      this.named.add(maker);
      const sound = TRACE_MAKERS[maker].sound; if (sound) sfx.animal(sound);
      void this.ctx.say('stamp.foot', { kind: TRACE_MAKERS[maker].name });
    }
    this.refresh();
  }
  private press(x: number, y: number) {
    const maker = this.chosen, margin = traceMargin(maker);
    const at = place(x, y, this.width, this.height, margin);
    const tilt = this.plan.tilt ? traceTilt(this.ctx.rng) : 0;
    const { pair, finish } = tracePress(this.plan, this.round, maker);
    const node = printArt(maker);
    this.marks.addChild(node);
    const print: Print = { maker, ...at, tilt, node };
    this.prints.push(print); this.layoutPrint(print);
    sfx.squish();
    // The maker, pressed flat on its print, lifts away and fades, leaving the mark behind.
    const lift = traceArt(maker); lift.position.copyFrom(node.position); lift.rotation = node.rotation; lift.scale.set(1.05);
    this.lifts.addChild(lift);
    void this.ctx.tw.to(lift, { y: lift.y - 40, alpha: 0 }, { duration: 0.35 }).then(() => { if (!lift.destroyed) lift.destroy(); });
    if (this.plan.makers.length === 1 && !this.markSaid) { this.markSaid = true; void this.ctx.say('stamp.leafmark'); }
    if (pair) void this.ctx.say('stamp.pair');
    this.refresh();
    if (finish) this.complete();
  }
  private removeLast() {
    if (this.done) return;
    const last = this.prints.pop(); if (!last) return;
    traceUndo(this.round); last.node.destroy();
    this.refresh();
  }
  private complete() {
    if (this.done || !this.prints.length) return;
    this.done = this.round.done = true; this.refresh();
    void this.ctx.say('stamp.printsdone'); sfx.sparkle();
    void this.ctx.tw.wait(0.9).then(() => this.ctx.finish({ misses: 0, hints: 0 }));
  }
  private layoutPrint(p: Print) {
    const at = pixel(p, this.width, this.height, traceMargin(p.maker));
    p.node.position.set(at.x, at.y); p.node.rotation = p.tilt * Math.PI / 180;
  }
  private refresh() {
    this.finish.visible = this.undo.visible = this.prints.length > 0;
    this.makers.forEach((b, i) => b.alpha = this.plan.makers[i] === this.chosen ? 1 : 0.68);
  }
  start() { void this.ctx.instruct(this.plan.makers.length === 1 ? 'stamp.leaf' : 'stamp.feet'); }
  resize(v: View) {
    this.background.clear().rect(0, 0, v.w, v.h).fill(swatch.teal.light);
    this.width = v.w - 350; this.height = v.h - 290;
    this.paper.position.set(180, 135);
    this.sheet.clear().roundRect(0, 0, this.width, this.height, 24).fill(swatch.brown.fill).stroke({ width: 7, color: swatch.brown.line });
    this.sheet.hitArea = new Rectangle(0, 0, this.width, this.height);
    // A few soft, darker blots so the tray reads as mud.
    this.blots.clear();
    for (const [x, y, r] of [[0.18, 0.3, 46], [0.62, 0.18, 34], [0.82, 0.7, 52], [0.35, 0.78, 38], [0.5, 0.5, 28]])
      this.blots.ellipse(x * this.width, y * this.height, r * 1.4, r).fill({ color: swatch.brown.line, alpha: 0.12 });
    const xs = spread(this.makers.length, 185, v.w - 180, 135);
    this.makers.forEach((b, i) => b.position.set(xs[i], v.h - 77));
    this.finish.position.set(v.w - 77, 65); this.undo.position.set(v.w - 77, v.h - 77);
    for (const p of this.prints) this.layoutPrint(p);
  }
  update() {}
  /** The ghost finger: pat the mud (level 8), or print three duck feet, choose the paw, print two paws and finish (level 9). */
  autotouch(): TouchIntent | null {
    if (this.done) return null;
    const move = traceDemo(this.plan, { prints: this.round.prints, chosen: this.chosen });
    if (move.do === 'choose') return { tap: { on: this.makers[this.plan.makers.indexOf(move.maker)] } };
    if (move.do === 'press') return { tap: { on: this.sheet, ...pixel(move, this.width, this.height, traceMargin(this.chosen)) } };
    return { tap: { on: this.finish } };
  }
  destroy() {}
}
