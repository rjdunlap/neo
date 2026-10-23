import { Container, Graphics, Rectangle, Sprite } from 'pixi.js';
import { gradientTexture } from '../../art/scenery';
import { swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import type { CompanionRig } from '../../creatures/companion';
import type { LineId } from '../../content/voice-script';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { bellPic, beaterPic, cardPic, drawBag, drawBench, flagPic, partPic, propPic, railTick, readySticker, ribbonPic, wagonPic, type Look } from './art';
import {
  PART_OF, apply, askHint, botAction, describeReady, done, hintFor, judge, readyLayout, restart, startState,
  type Action, type Dragged, type PartId, type PropId, type ReadyState, type Target,
} from './logic';

const LEVELS: BandLevels = {
  toddler: { min: 1, max: 1 },
  preschool: { min: 1, max: 2 },
  prek: { min: 2, max: 3 },
};

interface Obj {
  key: string;
  node: Container;
  pic: Container;
  size: number;
  drag: DragHandle;
  prop?: PropId;
  part?: PartId;
  /** Packed or attached: no longer a target. */
  gone: boolean;
}

const TAP_SLOP = 18;
const dragOf = (o: Obj): Dragged => (o.prop ? { prop: o.prop } : { part: o.part! });

class ReadyForAdventure implements Game {
  readonly state: ReadyState;
  private view: View;
  private readonly look: Look;
  private readonly bg = new Sprite(gradientTexture(0xbfe6fb, 0xfff1d0));
  private readonly world = new Container();
  private readonly bench = new Graphics();
  readonly bagNode = new Container();
  private readonly bag = new Graphics();
  readonly cardNode = new Container();
  private readonly rail = new Container();
  private readonly glow = new Graphics();
  readonly objs: Obj[] = [];
  private readonly ticks: { node: Container; job: PropId; step: 'attach' | 'pack' }[] = [];
  private readonly rig: CompanionRig;
  private selected: Obj | null = null;
  finished = false;
  private gone = false;
  private parading = false;
  private skipParade = false;
  private finishedCalled = false;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.state = startState(ctx.level, ctx.rng);
    const r = this.state.round;
    this.look = { flagShape: r.flagShape, ribbonPattern: r.ribbonPattern, drumPattern: r.drumPattern };
    this.glow.eventMode = 'none';
    this.rail.eventMode = 'none';
    this.bench.eventMode = 'static';
    onTap(this.bench, () => this.deselect(), { cooldown: 100 });
    this.bagNode.addChild(this.bag);
    this.bagNode.eventMode = 'static';
    this.bagNode.hitArea = new Rectangle(-115, -105, 230, 210);
    onTap(this.bagNode, () => this.tapBag(), { cooldown: 120 });
    onTap(this.cardNode, () => this.sayRequest(), { cooldown: 400 });
    this.cardNode.addChild(cardPic(r.request, this.look));
    this.cardNode.hitArea = new Rectangle(-150, -80, 300, 160);
    this.world.addChild(this.bench, this.bagNode);
    for (const k of r.order) this.world.addChild(this.makeObj(k).node);
    this.buildRail();
    this.rig = ctx.companion();
    this.rig.scale.set(0.5);
    this.rig.eventMode = 'static';
    this.rig.hitArea = this.rig.touchArea(60);
    onTap(this.rig, () => { this.rig.poke(); sfx.pop(7); this.sayRequest(); }, { cooldown: 400 });
    ctx.track(this.rig);
    ctx.stage.addChild(this.bg, this.world, this.rail, this.cardNode, this.glow, this.rig);
    drawBag(this.bag, false);
    this.layout(this.view);
  }

  start() {
    void this.ctx.instruct(`ready.instruct.${this.ctx.level}` as LineId);
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

  // ---- Building -------------------------------------------------------------------------------------------------

  private makeObj(k: string): Obj {
    const [kind, id] = k.split(':');
    const isProp = kind === 'prop';
    const node = new Container();
    const pic = new Container();
    pic.eventMode = 'none';
    node.addChild(pic);
    const o: Obj = {
      key: k, node, pic, size: isProp ? 150 : 120, gone: false,
      prop: isProp ? (id as PropId) : undefined, part: isProp ? undefined : (id as PartId),
      drag: undefined as unknown as DragHandle,
    };
    node.hitArea = new Rectangle(-o.size / 2, -o.size / 2, o.size, o.size);
    o.drag = draggable(node, this.ctx.tw, {
      onPick: () => { sfx.pluck(4, 0.2); this.deselect(); },
      onDrop: (x, y) => this.dropped(o, x, y),
    });
    this.drawObj(o);
    this.objs.push(o);
    return o;
  }

  private drawObj(o: Obj) {
    o.pic.removeChildren().forEach((c) => c.destroy({ children: true }));
    const p = o.prop ? propPic(o.prop, this.state.props[o.prop] !== 'bare', this.look) : partPic(o.part!, this.look);
    p.scale.set(o.size / 150 * (o.prop ? 1.1 : 1.2));
    o.pic.addChild(p);
  }

  private buildRail() {
    const r = this.state.round;
    if (this.ctx.level < 2) return;
    for (const job of r.request) {
      const steps: ('attach' | 'pack')[] = r.bare && PART_OF[job] ? ['attach', 'pack'] : ['pack'];
      for (const step of steps) {
        const n = new Container();
        n.addChild(railTick(false));
        const pic = step === 'attach' ? (job === 'flag' ? ribbonPic(this.look.ribbonPattern) : beaterPic()) : propPic(job, true, this.look);
        pic.scale.set(0.26);
        n.addChild(pic);
        this.rail.addChild(n);
        this.ticks.push({ node: n, job, step });
      }
    }
  }

  private refreshRail() {
    this.ticks.forEach((t) => {
      const st = this.state.props[t.job];
      const on = t.step === 'attach' ? st !== 'bare' : st === 'packed';
      t.node.getChildAt(0).destroy();
      t.node.addChildAt(railTick(on), 0);
      t.node.alpha = on ? 1 : 0.85;
    });
  }

  // ---- Layout -----------------------------------------------------------------------------------------------------

  private layout(v: View) {
    const l = readyLayout(v, this.ctx.level, this.state.round.order);
    this.bg.width = v.w;
    this.bg.height = v.h;
    if (!l || this.parading) return;
    this.bench.clear();
    drawBench(this.bench, l.bench.w, l.bench.h);
    this.bench.position.set(l.bench.x, l.bench.y);
    this.bench.hitArea = new Rectangle(0, 0, l.bench.w, l.bench.h);
    this.bagNode.position.set(l.bag.x + l.bag.w / 2, l.bag.y + l.bag.h / 2);
    this.cardNode.position.set(l.card.x + l.card.w / 2, l.card.y + l.card.h / 2);
    this.rail.position.set(l.rail.x + l.rail.w / 2, l.rail.y + l.rail.h / 2);
    const n = this.ticks.length;
    this.ticks.forEach((t, i) => t.node.position.set((i - (n - 1) / 2) * 56, 0));
    this.state.round.order.forEach((k, i) => {
      const o = this.objs.find((x) => x.key === k)!;
      const s = l.slots[i];
      o.drag.home = { x: s.x + s.w / 2, y: s.y + s.h / 2 };
      if (!o.drag.dragging && !o.gone) o.node.position.set(o.drag.home.x, o.drag.home.y);
    });
    this.rig.position.set(l.companion.x, l.companion.y);
  }

  // ---- Speech -----------------------------------------------------------------------------------------------------

  private sayRequest() {
    if (this.finished) return;
    void this.ctx.say(`ready.request.${this.state.round.request.join('-')}` as LineId);
  }

  // ---- Gestures ---------------------------------------------------------------------------------------------------

  private targetAt(self: Obj, x: number, y: number): { target: Target; obj?: Obj } | null {
    let best: { target: Target; obj?: Obj; d: number } | null = null;
    const consider = (target: Target, cx: number, cy: number, hw: number, hh: number, obj?: Obj) => {
      const dx = Math.abs(x - cx), dy = Math.abs(y - cy);
      if (dx > hw || dy > hh) return;
      const d = Math.hypot(dx / hw, dy / hh);
      if (!best || d < best.d) best = { target, obj, d };
    };
    consider({ bag: true }, this.bagNode.x, this.bagNode.y, 125, 115);
    for (const o of this.objs) {
      if (o === self || o.gone) continue;
      consider(o.prop ? { prop: o.prop } : { part: o.part! }, o.node.x, o.node.y, o.size / 2 + 25, o.size / 2 + 25, o);
    }
    return best;
  }

  private dropped(o: Obj, x: number, y: number): boolean {
    if (this.finished || this.parading) return false;
    const home = o.drag.home;
    if (Math.hypot(x - home.x, y - home.y) < TAP_SLOP) { this.tapObj(o); return false; }
    const hit = this.targetAt(o, x, y);
    if (!hit) return false;
    return this.gesture(o, hit.target, hit.obj);
  }

  /** Tap-select, tap-place: the same gesture as a drop. */
  private tapObj(o: Obj) {
    if (this.selected && this.selected !== o) {
      const from = this.selected;
      this.deselect();
      this.gesture(from, o.prop ? { prop: o.prop } : { part: o.part! }, o, true);
      return;
    }
    if (this.selected === o) return this.deselect();
    if (this.glowAction()) {
      // A lit object does its step when tapped.
      const a = this.glowAction()!;
      const lit = 'attach' in a ? [a.attach, a.to] : [a.pack];
      const id = o.prop ?? o.part;
      if (lit.includes(id as never)) return void this.assist(a);
    }
    this.selected = o;
    sfx.pluck(5, 0.2);
    this.drawSelection();
  }

  private tapBag() {
    sfx.pop(5);
    this.ctx.tw.kill(this.bagNode.scale);
    this.bagNode.scale.set(0.95);
    void this.ctx.tw.to(this.bagNode.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack });
    if (this.selected && !this.finished && !this.parading) {
      const from = this.selected;
      this.deselect();
      this.gesture(from, { bag: true }, undefined, true);
      return;
    }
    const a = this.glowAction();
    if (a && 'pack' in a) this.assist(a);
  }

  private deselect() {
    this.selected = null;
    this.drawSelection();
  }

  private drawSelection() {
    const g = this.glow;
    g.clear();
    this.drawGlowRings();
  }

  /** Judge and perform a deliberate gesture. Returns whether the drag was taken (else it floats home). */
  private gesture(from: Obj, target: Target, to?: Obj, byTap = false): boolean {
    const v = judge(this.state, dragOf(from), target);
    if (v.kind === 'free') return false;
    const out = apply(this.state, v);
    if (v.kind === 'attach') {
      void this.doAttach(from, to!, v.part, v.prop);
      return true;
    }
    if (v.kind === 'pack') {
      void this.doPack(from);
      return true;
    }
    // A refusal: float home, wiggle, say why.
    sfx.boing();
    this.rig.wiggle();
    if (byTap) void this.ctx.tw.to(from.node, { x: from.drag.home.x, y: from.drag.home.y }, { duration: 0.1 });
    void this.ctx.say(this.refusalLine(v) as LineId);
    if (out.glowed) this.drawGlowRings();
    return false;
  }

  private refusalLine(v: { reason: string; job: PropId; prop?: PropId; part?: PartId }): string {
    if (v.reason === 'notReady') return `ready.notyet.${v.job}`;
    if (v.reason === 'notRequested') return `ready.notcard.${this.state.round.request[0]}`;
    return `ready.part.${v.part ?? PART_OF[v.job]}`;
  }

  private async doAttach(a: Obj, b: Obj, part: PartId, prop: PropId) {
    const { tw } = this.ctx;
    const partObj = a.part ? a : b;
    const propObj = a.prop ? a : b;
    void part;
    partObj.gone = true;
    partObj.drag.enabled = false;
    sfx.sparkle();
    await tw.to(partObj.node, { x: propObj.node.x, y: propObj.node.y - 10 }, { duration: 0.25, ease: ease.outQuad });
    if (this.gone) return;
    tw.to(partObj.node.scale, { x: 0.1, y: 0.1 }, { duration: 0.2 });
    partObj.node.visible = false;
    this.drawObj(propObj);
    // The prop goes back to its slot (it may have been the dragged one).
    void tw.to(propObj.node, { x: propObj.drag.home.x, y: propObj.drag.home.y }, { duration: 0.25, ease: ease.outBack });
    propObj.node.scale.set(1.15);
    void tw.to(propObj.node.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
    this.rig.cheer();
    this.refreshRail();
    this.drawGlowRings();
    void this.ctx.say(`ready.ready.${prop}` as LineId);
  }

  private async doPack(o: Obj) {
    const { tw } = this.ctx;
    o.gone = true;
    o.drag.enabled = false;
    sfx.pop(6);
    await tw.to(o.node, { x: this.bagNode.x, y: this.bagNode.y - 30 }, { duration: 0.25, ease: ease.outQuad });
    if (this.gone) return;
    o.node.visible = false;
    this.bagNode.scale.set(1.1);
    void tw.to(this.bagNode.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
    this.refreshRail();
    this.drawGlowRings();
    if (done(this.state)) { void this.parade(); return; }
    void this.ctx.say('ready.packed');
  }

  // ---- Help -------------------------------------------------------------------------------------------------------

  private glowAction(): Action | null {
    const j = this.state.glow;
    return j ? hintFor(this.state, j) : null;
  }

  private find(a: Action): { from: Obj; to: Obj | null } {
    if ('attach' in a) return { from: this.objs.find((o) => o.part === a.attach)!, to: this.objs.find((o) => o.prop === a.to)! };
    return { from: this.objs.find((o) => o.prop === a.pack)!, to: null };
  }

  private drawGlowRings() {
    const g = this.glow;
    g.clear();
    if (this.selected) {
      const o = this.selected;
      g.circle(o.node.x, o.node.y, o.size / 2 + 12).stroke({ width: 8, color: 0xffffff, alpha: 0.95 });
    }
    const a = this.glowAction();
    if (!a || this.finished) return;
    const { from, to } = this.find(a);
    const ring = (x: number, y: number, r: number) => g.circle(x, y, r).stroke({ width: 10, color: 0xfff08a, alpha: 0.9 });
    ring(from.node.x, from.node.y, from.size / 2 + 12);
    if (to) ring(to.node.x, to.node.y, to.size / 2 + 12);
    else g.roundRect(this.bagNode.x - 125, this.bagNode.y - 115, 250, 230, 40).stroke({ width: 10, color: 0xfff08a, alpha: 0.9 });
    const tx = to ? to.node.x : this.bagNode.x, ty = to ? to.node.y : this.bagNode.y;
    for (let i = 1; i < 8; i++) g.circle(from.node.x + ((tx - from.node.x) * i) / 8, from.node.y + ((ty - from.node.y) * i) / 8, 5).fill({ color: 0xfff08a, alpha: 0.9 });
  }

  /** The companion carries the lit thing to where it goes. */
  private assist(a: Action) {
    if (this.parading || this.finished) return;
    const { from, to } = this.find(a);
    const target: Target = to ? (to.prop ? { prop: to.prop } : { part: to.part! }) : { bag: true };
    const v = judge(this.state, dragOf(from), target);
    if (v.kind !== 'attach' && v.kind !== 'pack') return;
    apply(this.state, v);
    this.rig.cheer();
    if (v.kind === 'attach') void this.doAttach(from, to!, v.part, v.prop);
    else void this.doPack(from);
  }

  askForHint() {
    if (this.finished || this.parading) return;
    const r = askHint(this.state);
    if (!r) return;
    this.drawGlowRings();
    const a = this.glowAction();
    if (a) void this.ctx.say(('attach' in a ? `ready.hint.attach-${a.attach}` : `ready.hint.pack-${a.pack}`) as LineId);
  }

  restart() {
    if (this.finished || this.parading) return;
    restart(this.state);
    for (const o of this.objs) {
      o.gone = false;
      o.drag.enabled = true;
      o.node.visible = true;
      o.node.scale.set(1);
      this.drawObj(o);
      o.node.position.set(o.drag.home.x, o.drag.home.y);
    }
    this.refreshRail();
    this.drawGlowRings();
  }

  update(_dt: number) {
    if (this.state.glow && !this.finished) {
      this.glow.alpha = 0.7 + 0.3 * Math.sin(performance.now() / 180);
    } else this.glow.alpha = 1;
    if (this.selected) this.drawGlowRings();
  }

  // ---- The parade -------------------------------------------------------------------------------------------------

  private async parade() {
    const { tw, view } = { tw: this.ctx.tw, view: this.view };
    this.parading = true;
    this.glow.clear();
    drawBag(this.bag, true);
    sfx.tada();
    void this.ctx.say('ready.allpacked');
    await tw.wait(0.9);
    if (this.gone) return;
    const lane = new Graphics();
    lane.rect(0, view.h * 0.7, view.w, view.h * 0.3).fill(0xe8d9b0);
    lane.moveTo(0, view.h * 0.7).lineTo(view.w, view.h * 0.7).stroke({ width: 6, color: 0xc9b57f });
    const bunting = new Graphics();
    for (let i = 0; i < 8; i++) {
      const x = (view.w / 7) * i;
      bunting.poly([x - 30, 20, x + 30, 20, x, 80]).fill([swatch.red, swatch.yellow, swatch.blue, swatch.green][i % 4].fill);
    }
    this.ctx.stage.addChildAt(lane, 1);
    this.ctx.stage.addChildAt(bunting, 2);
    await tw.to(this.world, { y: view.h }, { duration: 0.5, ease: ease.inQuad });
    if (this.gone) return;
    this.world.visible = false;
    this.rail.visible = false;
    this.cardNode.visible = false;
    // The wagon with exactly what was packed.
    const wagon = new Container();
    wagon.addChild(wagonPic());
    const packed = this.state.round.request;
    const riders: Container[] = [];
    packed.forEach((id, i) => {
      const p = propPic(id, true, this.look);
      p.scale.set(0.7);
      p.position.set((i - (packed.length - 1) / 2) * 100, -60);
      wagon.addChild(p);
      riders.push(p);
    });
    const y = view.h * 0.7 + 70;
    wagon.position.set(-300, y);
    wagon.eventMode = 'none';
    this.ctx.stage.addChild(wagon);
    this.rig.position.set(-100, y);
    const skip = new Container();
    skip.eventMode = 'static';
    skip.hitArea = new Rectangle(0, 0, view.w, view.h);
    skip.on('pointerdown', () => { this.skipParade = true; });
    this.ctx.stage.addChild(skip);
    void this.ctx.say('ready.parade');
    const beat = () => {
      packed.forEach((id, i) => {
        if (id === 'drum') sfx.knock();
        else if (id === 'bell') sfx.bell(4 + i);
        else if (id === 'flag') sfx.pluck(6, 0.15);
      });
    };
    const stops = 6;
    for (let i = 0; i < stops && !this.skipParade; i++) {
      const frac = (i + 1) / stops;
      beat();
      riders.forEach((r, k) => { r.rotation = (i % 2 ? 1 : -1) * 0.12 * (k % 2 ? -1 : 1); });
      const wx = -100 + frac * (view.w * 0.85);
      void tw.to(wagon, { x: wx - 200 }, { duration: 0.9, ease: ease.inOutSine });
      await tw.to(this.rig, { x: wx }, { duration: 0.9, ease: ease.inOutSine });
      if (this.gone) return;
    }
    if (this.gone || this.finishedCalled) return;
    this.finishedCalled = true;
    this.finished = true;
    this.rig.cheer();
    sfx.tada();
    this.ctx.particles.burst(view.w / 2, view.h * 0.45, { kind: 'dot', colors: [0xfff3a0, 0xffffff, 0xff9ac1], count: 26, speed: [120, 300], gravity: 200, life: [0.6, 1] });
    await tw.wait(0.8);
    if (this.gone) return;
    this.ctx.finish({ misses: this.state.misses, hints: this.state.hints });
  }

  // ---- Ghost finger -----------------------------------------------------------------------------------------------

  autotouch(): TouchIntent | null {
    if (this.finished || this.parading) return null;
    const a = botAction(this.state);
    if (!a) return null;
    const { from, to } = this.find(a);
    return { drag: { on: from.node }, to: to ? { on: to.node } : { on: this.bagNode } };
  }
}

class ReadyIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const bag = new Graphics();
    drawBag(bag, false);
    bag.scale.set(0.9);
    bag.position.set(0, 30);
    const flag = flagPic(0, 0, true);
    flag.scale.set(0.8);
    flag.position.set(-10, -30);
    const bell = bellPic();
    bell.scale.set(0.35);
    bell.position.set(70, -10);
    c.addChild(flag, bag, bell);
    super(c);
  }
}

export const readyForAdventure: GameModule = {
  id: 'ready-for-adventure',
  name: 'Ready for Adventure',
  titleLine: 'game.ready-for-adventure',
  region: 'cozy-village',
  skills: ['planning', 'sequencing', 'prerequisites', 'everyday-life'],
  bands: ['toddler', 'preschool', 'prek'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: describeReady,
  music: STYLES.paint,
  coplayHint: 'Point at the card and ask "What does it need first?" Let the child do it, then swap who points.',
  offScreen: 'Which toy would you bring to a pretend parade? What would it need first?',
  hubIcon: () => new ReadyIcon(),
  touchDemo: true,
  sticker: readySticker,
  create: (ctx) => new ReadyForAdventure(ctx),
};
