import { Container, Graphics, Rectangle, Sprite, Text } from 'pixi.js';
import { gradientTexture } from '../../art/scenery';
import { cream, ink, swatch } from '../../art/palette';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import type { CompanionRig } from '../../creatures/companion';
import type { LineId } from '../../content/voice-script';
import type { Game, GameContext, TouchIntent } from '../types';
import { drawBag, drawBench, propPic, type Look } from './art';
import { playParade } from './parade';
import type { PropId } from './logic';
import {
  BENCH_SIZE,
  SHELF_SIZE,
  applyCheck,
  askReviseHint,
  botEdit,
  edit,
  hintFor,
  request,
  restartRevise,
  reviseLayout,
  startRevise,
  type ReviseEdit,
  type ReviseLayout,
  type ReviseState,
} from './revise';

interface Obj {
  prop: PropId;
  node: Container;
  drag: DragHandle;
  /** In the bag, shown on the shelf. */
  packed: boolean;
}

const TAP_SLOP = 18;
const PACKED_SCALE = SHELF_SIZE / BENCH_SIZE;

/** Level 4's card: the requested pictures with a printed word under each (reading-lite; the voice always says it). */
function drawCard(
  req: readonly PropId[],
  look: Look,
): { node: Container; spots: { x: number; y: number }[] } {
  const c = new Container();
  c.addChild(
    new Graphics()
      .roundRect(-150, -85, 300, 170, 26)
      .fill(cream)
      .stroke({ width: 6, color: swatch.purple.line }),
  );
  const n = req.length;
  const scale = n === 1 ? 0.95 : n === 2 ? 0.78 : 0.6;
  const gap = n === 2 ? 130 : 98;
  const spots: { x: number; y: number }[] = [];
  req.forEach((id, i) => {
    const x = (i - (n - 1) / 2) * gap;
    const p = propPic(id, true, look);
    p.scale.set(scale);
    p.position.set(x, -14);
    c.addChild(p);
    const t = new Text({
      text: id,
      style: {
        fontFamily: 'Nunito, sans-serif',
        fontSize: 22,
        fontWeight: '800',
        fill: ink,
        align: 'center',
      },
    });
    t.anchor.set(0.5);
    t.position.set(x, 58);
    t.eventMode = 'none';
    c.addChild(t);
    spots.push({ x, y: -14 });
  });
  c.eventMode = 'static';
  c.hitArea = new Rectangle(-150, -85, 300, 170);
  return { node: c, spots };
}

const lineFor = (e: ReviseEdit): LineId =>
  ('pack' in e ? `ready.hint.pack-${e.pack}` : `ready.hint.unpack-${e.unpack}`) as LineId;

/** Ready for Adventure level 4: pack for the card, Check, the card changes, repair the bag, Check, parade. */
export class ReviseScene implements Game {
  readonly state: ReviseState;
  private view: View;
  private readonly look: Look;
  private readonly bg = new Sprite(gradientTexture(0xbfe6fb, 0xfff1d0));
  private readonly world = new Container();
  private readonly bench = new Graphics();
  private readonly shelf = new Graphics();
  readonly bagNode = new Container();
  private readonly bag = new Graphics();
  readonly checkNode = new Container();
  readonly cardNode = new Container();
  private cardBody: Container;
  private readonly glow = new Graphics();
  readonly objs: Obj[] = [];
  private readonly rig: CompanionRig;
  private layoutNow: ReviseLayout | null = null;
  private packedOrder: PropId[] = [];
  private selected: Obj | null = null;
  finished = false;
  private gone = false;
  private busy = false;
  private parading = false;
  private finishedCalled = false;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.state = startRevise(ctx.rng);
    const r = this.state.round;
    this.look = { flagShape: r.flagShape, ribbonPattern: r.ribbonPattern, drumPattern: r.drumPattern };
    this.glow.eventMode = 'none';
    this.bench.eventMode = 'static';
    onTap(this.bench, () => this.deselect(), { cooldown: 100 });
    this.shelf.eventMode = 'none';
    this.bagNode.addChild(this.bag);
    this.bagNode.eventMode = 'static';
    this.bagNode.hitArea = new Rectangle(-115, -105, 230, 210);
    onTap(this.bagNode, () => this.tapBag(), { cooldown: 120 });
    this.buildCheck();
    this.cardBody = drawCard(request(this.state), this.look).node;
    this.cardNode.addChild(this.cardBody);
    this.cardNode.eventMode = 'static';
    this.cardNode.hitArea = new Rectangle(-150, -85, 300, 170);
    onTap(this.cardNode, () => this.sayRequest(), { cooldown: 400 });
    this.world.addChild(this.bench, this.shelf, this.bagNode, this.checkNode);
    for (const p of r.order) this.world.addChild(this.makeObj(p).node);
    this.rig = ctx.companion();
    this.rig.scale.set(0.5);
    this.rig.eventMode = 'static';
    this.rig.hitArea = this.rig.touchArea(60);
    onTap(
      this.rig,
      () => {
        this.rig.poke();
        sfx.pop(7);
        this.sayRequest();
      },
      { cooldown: 400 },
    );
    ctx.track(this.rig);
    ctx.stage.addChild(this.bg, this.world, this.cardNode, this.glow, this.rig);
    drawBag(this.bag, false);
    this.layout(this.view);
  }

  start() {
    void this.ctx.instruct('ready.instruct.4' as LineId);
  }

  resize(v: View) {
    this.view = v;
    this.layout(v);
  }

  destroy() {
    this.gone = true;
    for (const o of this.objs) o.drag.destroy();
    this.ctx.untrack(this.rig);
  }

  // ---- Building ---------------------------------------------------------------------------------------------------

  private makeObj(prop: PropId): Obj {
    const node = new Container();
    const pic = propPic(prop, true, this.look);
    pic.scale.set((BENCH_SIZE / 150) * 1.1);
    pic.eventMode = 'none';
    node.addChild(pic);
    node.hitArea = new Rectangle(-BENCH_SIZE / 2, -BENCH_SIZE / 2, BENCH_SIZE, BENCH_SIZE);
    const o: Obj = { prop, node, packed: false, drag: undefined as unknown as DragHandle };
    o.drag = draggable(node, this.ctx.tw, {
      onPick: () => {
        sfx.pluck(4, 0.2);
        this.deselect();
      },
      onDrop: (x, y) => this.dropped(o, x, y),
    });
    this.objs.push(o);
    return o;
  }

  private buildCheck() {
    const g = new Graphics();
    g.circle(0, 0, 58).fill(swatch.green.fill).stroke({ width: 7, color: swatch.green.line });
    g.poly([-26, -4, -12, -18, -4, -8, 22, -38, 34, -26, -4, 22]).fill(0xffffff);
    g.eventMode = 'none';
    const t = new Text({
      text: 'Check',
      style: {
        fontFamily: 'Nunito, sans-serif',
        fontSize: 24,
        fontWeight: '900',
        fill: 0xffffff,
        align: 'center',
      },
    });
    t.anchor.set(0.5);
    t.position.set(0, 34);
    t.eventMode = 'none';
    this.checkNode.addChild(g, t);
    this.checkNode.eventMode = 'static';
    this.checkNode.hitArea = new Rectangle(-60, -60, 120, 120);
    this.checkNode.on('pointerdown', () => {
      this.ctx.tw.kill(this.checkNode.scale);
      this.checkNode.scale.set(0.9);
      sfx.pop(6);
    });
    onTap(this.checkNode, () => void this.doCheck(), { cooldown: 300 });
  }

  // ---- Layout -----------------------------------------------------------------------------------------------------

  private homeOf(o: Obj): { x: number; y: number } {
    const l = this.layoutNow!;
    const r = o.packed
      ? l.shelf[this.packedOrder.indexOf(o.prop)]
      : l.slots[this.state.round.order.indexOf(o.prop)];
    return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
  }

  private layout(v: View) {
    const l = reviseLayout(v);
    this.bg.width = v.w;
    this.bg.height = v.h;
    if (!l) return;
    this.layoutNow = l;
    if (this.parading) return;
    const b = l.slots.reduce(
      (a, r) => ({
        x: Math.min(a.x, r.x),
        y: Math.min(a.y, r.y),
        r: Math.max(a.r, r.x + r.w),
        b: Math.max(a.b, r.y + r.h),
      }),
      { x: 1e9, y: 1e9, r: 0, b: 0 },
    );
    const pad = 24;
    this.bench.clear();
    drawBench(this.bench, b.r - b.x + pad * 2, b.b - b.y + pad * 2);
    this.bench.position.set(b.x - pad, b.y - pad);
    this.bench.hitArea = new Rectangle(0, 0, b.r - b.x + pad * 2, b.b - b.y + pad * 2);
    this.shelf.clear();
    for (const r of l.shelf)
      this.shelf.roundRect(r.x, r.y, r.w, r.h, 18).fill({ color: 0xffffff, alpha: 0.35 }).stroke({
        width: 4,
        color: 0xc9b57f,
        alpha: 0.8,
      });
    this.bagNode.position.set(l.bag.x + l.bag.w / 2, l.bag.y + l.bag.h / 2);
    this.checkNode.position.set(l.check.x + l.check.w / 2, l.check.y + l.check.h / 2);
    this.cardNode.position.set(l.card.x + l.card.w / 2, l.card.y + l.card.h / 2);
    for (const o of this.objs) {
      o.drag.home = this.homeOf(o);
      if (!o.drag.dragging) {
        o.node.position.set(o.drag.home.x, o.drag.home.y);
        o.node.scale.set(o.packed ? PACKED_SCALE : 1);
      }
    }
    this.rig.position.set(l.companion.x, l.companion.y);
    this.drawGlow();
  }

  /** After the bag changes: re-seat every prop on the bench or the shelf. */
  private reseat(except?: Obj) {
    for (const o of this.objs) {
      o.drag.home = this.homeOf(o);
      if (o === except) continue;
      const to = o.drag.home;
      void this.ctx.tw.to(o.node, { x: to.x, y: to.y }, { duration: 0.25, ease: ease.outBack });
      void this.ctx.tw.to(
        o.node.scale,
        { x: o.packed ? PACKED_SCALE : 1, y: o.packed ? PACKED_SCALE : 1 },
        { duration: 0.2 },
      );
    }
  }

  // ---- Speech -----------------------------------------------------------------------------------------------------

  private sayRequest() {
    if (this.finished || this.parading) return;
    void this.ctx.say(`ready.request.${request(this.state).join('-')}` as LineId);
  }

  // ---- Gestures ---------------------------------------------------------------------------------------------------

  private locked = () => this.finished || this.parading || this.busy;

  private overBagArea(x: number, y: number): boolean {
    const l = this.layoutNow!;
    const near = (r: { x: number; y: number; w: number; h: number }, m: number) =>
      x > r.x - m && x < r.x + r.w + m && y > r.y - m && y < r.y + r.h + m;
    return near(l.bag, 20) || l.shelf.some((r) => near(r, 12));
  }

  private dropped(o: Obj, x: number, y: number): boolean {
    if (this.locked()) return false;
    if (Math.hypot(x - o.drag.home.x, y - o.drag.home.y) < TAP_SLOP) {
      this.tapObj(o);
      return false;
    }
    if (!o.packed && this.overBagArea(x, y)) {
      this.pack(o);
      return true;
    }
    if (o.packed && !this.overBagArea(x, y)) {
      this.unpack(o);
      return true;
    }
    return false;
  }

  /** A still tap: a bench prop is held for the bag; a shelf prop comes out at once. */
  private tapObj(o: Obj) {
    if (o.packed) return this.unpack(o);
    const g = this.state.glow;
    if (g && g.prop === o.prop && g.edit === 'pack') return this.pack(o);
    if (this.selected === o) return this.deselect();
    this.selected = o;
    sfx.pluck(5, 0.2);
    this.drawGlow();
  }

  private tapBag() {
    sfx.pop(5);
    this.ctx.tw.kill(this.bagNode.scale);
    this.bagNode.scale.set(0.95);
    void this.ctx.tw.to(this.bagNode.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack });
    if (this.locked()) return;
    if (this.selected && !this.selected.packed) {
      const o = this.selected;
      this.deselect();
      return this.pack(o);
    }
    const g = this.state.glow;
    if (g?.edit === 'pack') this.pack(this.objs.find((x) => x.prop === g.prop)!);
  }

  private deselect() {
    this.selected = null;
    this.drawGlow();
  }

  private pack(o: Obj) {
    if (!edit(this.state, { pack: o.prop })) return;
    o.packed = true;
    this.selected = null;
    this.packedOrder.push(o.prop);
    sfx.pop(6);
    this.reseat();
    this.bagNode.scale.set(1.1);
    void this.ctx.tw.to(this.bagNode.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
    this.drawGlow();
  }

  private unpack(o: Obj) {
    if (!edit(this.state, { unpack: o.prop })) return;
    o.packed = false;
    this.packedOrder = this.packedOrder.filter((p) => p !== o.prop);
    sfx.pluck(3, 0.2);
    this.reseat();
    this.drawGlow();
  }

  // ---- Check ------------------------------------------------------------------------------------------------------

  private async doCheck() {
    this.ctx.tw.kill(this.checkNode.scale);
    void this.ctx.tw.to(this.checkNode.scale, { x: 1, y: 1 }, { duration: 0.2, ease: ease.outBack });
    if (this.locked()) return;
    const { tw } = this.ctx;
    const was = request(this.state).slice();
    const out = applyCheck(this.state);
    if (out.kind === 'empty') {
      void this.ctx.say('ready.checkempty' as LineId);
      return;
    }
    if (out.kind === 'mismatch') {
      sfx.boing();
      this.rig.wiggle();
      const o = this.objs.find((x) => x.prop === out.prop)!;
      void tw
        .to(o.node, { x: o.drag.home.x + 14, y: o.drag.home.y }, { duration: 0.08 })
        .then(() =>
          tw.to(o.node, { x: o.drag.home.x, y: o.drag.home.y }, { duration: 0.25, ease: ease.outBack }),
        );
      void this.ctx.say(`ready.check.${out.why}.${out.prop}` as LineId);
      this.drawGlow();
      if (out.glowed) {
        const h = hintFor(this.state);
        if (h) {
          await tw.wait(1.8);
          if (!this.gone) void this.ctx.say(lineFor(h));
        }
      }
      return;
    }
    this.busy = true;
    this.deselect();
    this.rig.cheer();
    sfx.sparkle();
    if (out.next === 'change') {
      void this.ctx.say('ready.checkpass.1' as LineId);
      await tw.wait(1.4);
      if (this.gone) return;
      await this.changeCard(was);
      this.busy = false;
      return;
    }
    void this.ctx.say('ready.checkpass.2' as LineId);
    await tw.wait(1.2);
    if (this.gone) return;
    void this.parade();
  }

  /** The card flips to the new request; the new pictures get a soft ring for two seconds. */
  private async changeCard(old: readonly PropId[]) {
    const { tw } = this.ctx;
    sfx.pluck(7, 0.2);
    void this.ctx.say('ready.changed' as LineId);
    this.rig.poke();
    await tw.to(this.cardNode.scale, { x: 0, y: 1 }, { duration: 0.18, ease: ease.inQuad });
    if (this.gone) return;
    this.cardBody.destroy({ children: true });
    const next = request(this.state);
    const { node, spots } = drawCard(next, this.look);
    this.cardBody = node;
    this.cardNode.addChildAt(node, 0);
    next.forEach((p, i) => {
      if (old.includes(p)) return;
      node.addChild(
        new Graphics().circle(spots[i].x, spots[i].y, 62).stroke({ width: 7, color: 0xfff08a, alpha: 0.95 }),
      );
    });
    await tw.to(this.cardNode.scale, { x: 1, y: 1 }, { duration: 0.24, ease: ease.outBack });
    await tw.wait(2);
    if (this.gone) return;
    node.children.filter((c) => c instanceof Graphics).forEach((c) => c.destroy());
  }

  // ---- Help -------------------------------------------------------------------------------------------------------

  private drawGlow() {
    const g = this.glow;
    g.clear();
    if (this.selected) {
      const o = this.selected;
      g.circle(o.node.x, o.node.y, BENCH_SIZE / 2 + 12).stroke({ width: 8, color: 0xffffff, alpha: 0.95 });
    }
    const lit = this.state.glow;
    if (!lit || this.finished || !this.layoutNow) return;
    const o = this.objs.find((x) => x.prop === lit.prop)!;
    const r = (o.packed ? SHELF_SIZE : BENCH_SIZE) / 2 + 12;
    g.circle(o.drag.home.x, o.drag.home.y, r).stroke({ width: 10, color: 0xfff08a, alpha: 0.9 });
    // A dotted arc from the prop to where it goes: the bag, or back to its bench slot.
    let tx: number, ty: number;
    if (lit.edit === 'pack') {
      tx = this.bagNode.x;
      ty = this.bagNode.y;
      g.roundRect(tx - 125, ty - 115, 250, 230, 40).stroke({ width: 10, color: 0xfff08a, alpha: 0.9 });
    } else {
      const s = this.layoutNow.slots[this.state.round.order.indexOf(lit.prop)];
      tx = s.x + s.w / 2;
      ty = s.y + s.h / 2;
      g.circle(tx, ty, BENCH_SIZE / 2 + 12).stroke({ width: 10, color: 0xfff08a, alpha: 0.9 });
    }
    const fx = o.drag.home.x,
      fy = o.drag.home.y;
    for (let i = 1; i < 8; i++)
      g.circle(fx + ((tx - fx) * i) / 8, fy + ((ty - fy) * i) / 8 - Math.sin((i / 8) * Math.PI) * 40, 5).fill(
        {
          color: 0xfff08a,
          alpha: 0.9,
        },
      );
  }

  askForHint() {
    if (this.locked()) return;
    const r = askReviseHint(this.state);
    if (!r) return;
    this.drawGlow();
    const h = hintFor(this.state);
    if (h) void this.ctx.say(lineFor(h));
  }

  restart() {
    if (this.finished || this.parading) return;
    restartRevise(this.state);
    this.busy = false;
    this.selected = null;
    this.packedOrder = [];
    for (const o of this.objs) {
      o.packed = false;
      o.node.scale.set(1);
      o.drag.home = this.homeOf(o);
      o.node.position.set(o.drag.home.x, o.drag.home.y);
    }
    this.cardBody.destroy({ children: true });
    this.cardBody = drawCard(request(this.state), this.look).node;
    this.cardNode.addChildAt(this.cardBody, 0);
    this.cardNode.scale.set(1);
    this.drawGlow();
  }

  update(_dt: number) {
    if (this.state.glow && !this.finished) this.glow.alpha = 0.7 + 0.3 * Math.sin(performance.now() / 180);
    else this.glow.alpha = 1;
    if (this.selected) this.drawGlow();
  }

  // ---- The parade -------------------------------------------------------------------------------------------------

  private parade(): Promise<void> {
    return playParade({
      ctx: this.ctx,
      view: () => this.view,
      rig: this.rig,
      packed: request(this.state),
      look: this.look,
      world: this.world,
      hide: [this.cardNode],
      isGone: () => this.gone,
      markFinished: () => {
        if (this.finishedCalled) return false;
        this.finishedCalled = true;
        this.finished = true;
        return true;
      },
      onStart: () => {
        this.parading = true;
        this.glow.clear();
      },
      zip: () => drawBag(this.bag, true),
      result: () => ({ misses: this.state.misses, hints: this.state.hints }),
    });
  }

  // ---- Ghost finger -----------------------------------------------------------------------------------------------

  /** Packs what the card shows, taps Check, waits for the change, then follows `hintFor`: take out, put in, Check. */
  autotouch(): TouchIntent | null {
    if (this.locked()) return null;
    const e = botEdit(this.state);
    if (!e) return { tap: { on: this.checkNode } };
    if ('pack' in e) {
      const o = this.objs.find((x) => x.prop === e.pack)!;
      return { drag: { on: o.node }, to: { on: this.bagNode } };
    }
    return { tap: { on: this.objs.find((x) => x.prop === e.unpack)!.node } };
  }
}
