import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { CRITTERS, Critter } from '../../art/critter';
import { cream, ink, swatch, wood } from '../../art/palette';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import type { Game, GameContext, TouchIntent } from '../types';
import {
  addToCart, CART_H, CART_SLOT, CART_W, checkJob, decidingPart, doneLine, glowingTools, helpJob, inCart, JOB_CARD_H, JOB_CARD_W,
  JOB_CHECK_R, jobLayout, jobState, JOBS, LENS_R, makeJobRound, planFor, reason, removeFromCart, slotOf, TOOL_BOX, tryTool,
  workingSet, works, type JobId, type JobLayout, type JobRound, type JobState, type Plan, type Reason, type ToolId, type ToolPart,
} from './logic';

/*
 * Attic Finds levels 5-6: a friend needs a load carried. She taps an attic thing to try it on the load (free), drags
 * every thing that can do the job into the cart, and taps Check. The tries happen where the thing sits, so the rug stays
 * still and the corner pet keeps its corner.
 */

const WALL = 0xecd9b8;
const BEAM = 0x9c6b3c;
const RUG = swatch.red.fill;
/** A thing in the cart is drawn smaller so it fits its slot (150 × 0.74 = 111 units, still a full-size target). */
const IN_CART = 0.74;
/** Below this many units of finger travel a touch on a thing is a tap (a try), not a drag. */
const TAP_TRAVEL = 18;

/** Each level's authored first round leads its first round of a session. */
const authoredShown = new Set<number>();

/* Art -------------------------------------------------------------------------------------------- */

const tone = (c: number, k: number) => {
  const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255;
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)));
  return (f(r) << 16) | (f(g) << 8) | f(b);
};

/** A woven wall: alternating strips, with the little gaps between them shown as cream dots unless `tight`. */
function weave(g: Graphics, x0: number, x1: number, y0: number, y1: number, fill: number, line: number) {
  const rows = 4, h = (y1 - y0) / rows;
  for (let r = 0; r < rows; r++) {
    const y = y0 + r * h;
    const inset = ((y - y0) / (y1 - y0)) * 14;
    g.roundRect(x0 + inset, y + 2, x1 - x0 - 2 * inset, h - 4, 4).fill(r % 2 ? fill : tone(fill, 0.88)).stroke({ width: 3, color: line });
  }
  for (let x = x0 + 22; x < x1 - 10; x += 26) g.moveTo(x, y0 + 4).lineTo(x - 4, y1 - 4).stroke({ width: 3, color: line, alpha: 0.5 });
}

/** One attic thing, about 150 units across, seen three-quarter from above so its inside, floor and edge show. */
function toolArt(id: ToolId, colorName: keyof typeof swatch): Container {
  const c = new Container();
  const sw = swatch[colorName];
  const g = new Graphics();
  c.addChild(g);
  if (id === 'basket' || id === 'hoop') {
    // The handle, then the inside (a woven floor, or the rug seen straight through), then the front wall.
    g.moveTo(-58, -22).bezierCurveTo(-56, -98, 56, -98, 58, -22).stroke({ width: 10, color: sw.line, cap: 'round' })
      .moveTo(-58, -22).bezierCurveTo(-56, -98, 56, -98, 58, -22).stroke({ width: 4, color: sw.light, cap: 'round' });
    g.ellipse(0, -18, 70, 22).fill(id === 'basket' ? tone(sw.fill, 0.7) : RUG).stroke({ width: 4, color: sw.line });
    if (id === 'basket') {
      for (let x = -48; x <= 48; x += 16) g.moveTo(x, -30).lineTo(x + 6, -6).stroke({ width: 3, color: sw.line, alpha: 0.5 });
    } else {
      g.ellipse(0, -18, 52, 13).fill({ color: 0xffffff, alpha: 0.18 });
      for (let x = -50; x <= 50; x += 20) g.moveTo(x, -28).lineTo(x, -8).stroke({ width: 5, color: swatch.yellow.fill, alpha: 0.7 });
    }
    weave(g, -70, 70, -18, 52, sw.fill, sw.line);
    g.ellipse(0, -18, 70, 22).stroke({ width: 5, color: sw.line });
  } else if (id === 'tray') {
    // A flat board with a very low lip and two cut-out handholds.
    g.roundRect(-74, 6, 148, 14, 6).fill(tone(sw.fill, 0.8)).stroke({ width: 4, color: sw.line });
    g.poly([-60, -40, 60, -40, 76, 10, -76, 10]).fill(sw.fill).stroke({ width: 5, color: sw.line, join: 'round' });
    g.poly([-50, -32, 50, -32, 62, 2, -62, 2]).fill(sw.light);
    for (const y of [-22, -10]) g.moveTo(-48, y).lineTo(52, y).stroke({ width: 2, color: sw.line, alpha: 0.35 });
    g.roundRect(-72, -22, 18, 10, 5).fill(WALL).stroke({ width: 3, color: sw.line }).roundRect(54, -22, 18, 10, 5).fill(WALL).stroke({ width: 3, color: sw.line });
  } else {
    // A pail of staves bound by two hoops, with a rope handle.
    g.moveTo(-50, -30).bezierCurveTo(-40, -96, 40, -96, 50, -30).stroke({ width: 7, color: wood.light, cap: 'round' });
    g.poly([-56, -24, 56, -24, 44, 56, -44, 56]).fill(sw.fill).stroke({ width: 5, color: sw.line, join: 'round' });
    for (let k = -2; k <= 2; k++) g.moveTo(k * 22, -24).lineTo(k * 17.6, 56).stroke({ width: 3, color: sw.line, alpha: 0.6 });
    for (const y of [-4, 38]) {
      const w = 54 - ((y + 24) / 80) * 12;
      g.roundRect(-w - 2, y - 5, 2 * w + 4, 10, 4).fill(0x8c8c9c).stroke({ width: 2, color: ink, alpha: 0.6 });
    }
    g.ellipse(0, -24, 56, 18).fill(tone(sw.fill, 0.62)).stroke({ width: 5, color: sw.line });
  }
  return c;
}

/** The load, as it sits in a thing or on the shelf: a tied bundle of leaves, a heap of acorns, or water. */
function loadArt(job: JobId): Container {
  const c = new Container();
  const g = new Graphics();
  c.addChild(g);
  if (job === 'leaves') {
    for (const [x, y, r, col] of [[-18, -6, -0.5, swatch.orange], [14, -10, 0.4, swatch.yellow], [0, -20, -0.1, swatch.red], [-4, 2, 0.2, swatch.green]] as const) {
      const l = new Graphics().ellipse(0, 0, 26, 12).fill(col.fill).stroke({ width: 3, color: col.line }).moveTo(-22, 0).lineTo(22, 0).stroke({ width: 2, color: col.line });
      l.position.set(x, y);
      l.rotation = r;
      c.addChild(l);
    }
    const tie = new Graphics().roundRect(-6, -18, 12, 26, 4).fill(wood.light).stroke({ width: 3, color: wood.line });
    c.addChild(tie);
  } else if (job === 'acorns') {
    for (const [x, y] of [[-24, 0], [0, 0], [24, 0], [-12, -18], [12, -18]]) {
      g.ellipse(x, y + 4, 11, 13).fill(0xb7773e).stroke({ width: 3, color: 0x7a4a22 });
      g.ellipse(x, y - 7, 13, 7).fill(0x7a4a22).moveTo(x, y - 13).lineTo(x + 3, y - 19).stroke({ width: 3, color: 0x7a4a22, cap: 'round' });
    }
  } else {
    g.ellipse(0, 0, 44, 13).fill(swatch.blue.fill).stroke({ width: 3, color: swatch.blue.line });
    g.ellipse(-12, -3, 14, 4).fill({ color: 0xffffff, alpha: 0.7 });
  }
  return c;
}

/** The job card's picture of what needs carrying (the water job shows the rain jug and the thirsty plant). */
function jobPicture(job: JobId): Container {
  if (job !== 'water') {
    const c = loadArt(job);
    c.scale.set(1.4);
    return c;
  }
  const c = new Container();
  const g = new Graphics()
    .roundRect(-70, -40, 56, 70, 14).fill(swatch.blue.light).stroke({ width: 4, color: swatch.blue.line })
    .ellipse(-42, -40, 28, 9).fill(swatch.blue.fill).stroke({ width: 3, color: swatch.blue.line })
    .moveTo(-14, -20).bezierCurveTo(2, -20, 4, 4, -14, 6).stroke({ width: 5, color: swatch.blue.line })
    .poly([16, 30, 64, 30, 58, 0, 22, 0]).fill(swatch.orange.fill).stroke({ width: 4, color: swatch.orange.line, join: 'round' })
    .moveTo(40, 0).lineTo(40, -26).bezierCurveTo(40, -40, 56, -40, 60, -24).stroke({ width: 4, color: swatch.green.line })
    .ellipse(58, -20, 10, 6).fill(swatch.green.fill).stroke({ width: 3, color: swatch.green.line })
    .ellipse(30, -16, 10, 5).fill(swatch.green.fill).stroke({ width: 3, color: swatch.green.line });
  c.addChild(g);
  return c;
}

/** The magnifier's close-up of one part. */
function partArt(tool: ToolId, part: ToolPart, colorName: keyof typeof swatch): Container {
  const c = new Container();
  const sw = swatch[colorName];
  const g = new Graphics();
  c.addChild(g);
  g.circle(0, 0, LENS_R - 12).fill(WALL);
  const woven = tool === 'basket' || tool === 'hoop';
  if (part.prop === 'bottom' && part.has) {
    if (woven) {
      g.circle(0, 0, 110).fill(tone(sw.fill, 0.8));
      for (let k = -100; k <= 100; k += 22) g.moveTo(k, -100).lineTo(k, 100).moveTo(-100, k).lineTo(100, k);
      g.stroke({ width: 7, color: sw.line, alpha: 0.6 });
    } else {
      g.roundRect(-110, -70, 220, 140, 10).fill(tool === 'tray' ? sw.light : tone(sw.fill, 0.8)).stroke({ width: 6, color: sw.line });
      for (const y of [-25, 20]) g.moveTo(-100, y).lineTo(100, y).stroke({ width: 4, color: sw.line, alpha: 0.5 });
    }
  } else if (part.prop === 'bottom') {
    // No floor: a woven ring with the rug straight through it.
    g.circle(0, 0, 110).fill(RUG);
    for (let x = -90; x <= 90; x += 36) g.moveTo(x, -100).lineTo(x, 100).stroke({ width: 10, color: swatch.yellow.fill, alpha: 0.7 });
    g.circle(0, 0, 110).stroke({ width: 26, color: sw.fill }).circle(0, 0, 110).stroke({ width: 4, color: sw.line });
  } else if (part.prop === 'rim' && part.has) {
    if (woven) weave(g, -100, 100, -90, 90, sw.fill, sw.line);
    else {
      g.poly([-90, -90, 90, -90, 76, 90, -76, 90]).fill(sw.fill).stroke({ width: 6, color: sw.line, join: 'round' });
      for (let k = -2; k <= 2; k++) g.moveTo(k * 36, -90).lineTo(k * 30, 90).stroke({ width: 4, color: sw.line, alpha: 0.6 });
    }
    g.moveTo(-60, 20).lineTo(-60, -60).stroke({ width: 7, color: ink, cap: 'round' }).poly([-74, -44, -60, -70, -46, -44]).fill(ink);
  } else if (part.prop === 'rim') {
    // The very low edge, with an acorn rolling off it.
    g.roundRect(-115, 10, 230, 60, 8).fill(sw.light).stroke({ width: 6, color: sw.line });
    g.roundRect(-115, 54, 230, 22, 6).fill(tone(sw.fill, 0.8)).stroke({ width: 5, color: sw.line });
    g.ellipse(70, 0, 20, 23).fill(0xb7773e).stroke({ width: 4, color: 0x7a4a22 }).ellipse(70, -19, 23, 12).fill(0x7a4a22);
    g.moveTo(20, -40).lineTo(90, -40).stroke({ width: 6, color: ink, cap: 'round' }).poly([84, -50, 102, -40, 84, -30]).fill(ink);
  } else if (part.has) {
    // Tight: solid wood, or staves pressed together by a hoop.
    g.roundRect(-100, -90, 200, 180, 10).fill(sw.fill).stroke({ width: 6, color: sw.line });
    if (tool === 'pail') {
      for (let x = -60; x <= 60; x += 40) g.moveTo(x, -90).lineTo(x, 90).stroke({ width: 5, color: sw.line });
      g.roundRect(-104, -12, 208, 26, 6).fill(0x8c8c9c).stroke({ width: 3, color: ink, alpha: 0.6 });
    } else for (const y of [-50, -10, 30, 64]) g.moveTo(-90, y).bezierCurveTo(-30, y - 10, 30, y + 10, 90, y).stroke({ width: 3, color: sw.line, alpha: 0.5 });
  } else {
    // Gaps between the strips, with a drop slipping through.
    for (let r = 0; r < 4; r++) g.roundRect(-110, -96 + r * 50, 220, 36, 8).fill(r % 2 ? sw.fill : tone(sw.fill, 0.88)).stroke({ width: 4, color: sw.line });
    g.moveTo(10, -60).lineTo(10, 40).stroke({ width: 14, color: WALL });
    g.poly([10, 44, 0, 62, 10, 70, 20, 62]).fill(swatch.blue.fill).stroke({ width: 3, color: swatch.blue.line });
  }
  const mask = new Graphics().circle(0, 0, LENS_R - 12).fill(0xffffff);
  c.addChild(mask);
  g.mask = mask;
  const rim = new Graphics().circle(0, 0, LENS_R - 6).stroke({ width: 12, color: 0x8c6a3a }).circle(0, 0, LENS_R - 6).stroke({ width: 4, color: ink, alpha: 0.5 });
  c.addChild(rim);
  return c;
}

function cartArt(): Container {
  const c = new Container();
  const w = CART_W, h = CART_H;
  c.addChild(new Graphics()
    .roundRect(-w / 2, -h / 2, w, h - 30, 14).fill(wood.fill).stroke({ width: 6, color: wood.line })
    .moveTo(-w / 2 + 10, -h / 2 + 30).lineTo(w / 2 - 10, -h / 2 + 30).stroke({ width: 3, color: wood.line, alpha: 0.4 })
    .moveTo(-w / 2, -10).lineTo(-w / 2 - 34, -36).stroke({ width: 8, color: wood.line, cap: 'round' })
    .circle(-w / 2 + 60, h / 2 - 20, 22).circle(w / 2 - 60, h / 2 - 20, 22).fill(ink)
    .circle(-w / 2 + 60, h / 2 - 20, 8).circle(w / 2 - 60, h / 2 - 20, 8).fill(0xcccccc));
  return c;
}

/* The game --------------------------------------------------------------------------------------- */

interface ToolNode { id: ToolId; node: Container; drag: DragHandle; rug: { x: number; y: number }; travel: number; down: { x: number; y: number } | null }

export class AtticJobs implements Game {
  readonly plan: Plan;
  readonly round: JobRound;
  readonly hintLabel = 'Show a hint';
  index = 0;
  state!: JobState;
  busy = true;
  finished = false;
  /** Misses and hints from finished jobs (and from before a Start again). */
  banked = { misses: 0, hints: 0 };

  private L: JobLayout;
  private view: View;
  private readonly bg = new Graphics();
  private readonly shelfArt = new Graphics();
  private readonly shelfLayer = new Container();
  private readonly card = new Container();
  private readonly cardPic = new Container();
  private readonly friend: Critter;
  private readonly cart = cartArt();
  private readonly slotMarks = new Graphics();
  private readonly checkBtn = new Container();
  private readonly toolLayer = new Container();
  private readonly fx = new Container();
  private readonly glow = new Graphics();
  private readonly lens = new Container();
  private tools: ToolNode[] = [];
  private shelved: Container[] = [];
  private finaleT: number | null = null;
  private t = 0;
  private destroyed = false;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    const first = !authoredShown.has(this.plan.id) && !ctx.demo;
    if (first) authoredShown.add(this.plan.id);
    this.round = makeJobRound(this.plan, ctx.rng, first);
    this.L = jobLayout(ctx.view);

    this.friend = new Critter(CRITTERS[this.round.friend]);
    this.friend.scale.set(0.42);
    this.card.addChild(
      new Graphics().roundRect(-JOB_CARD_W / 2, -JOB_CARD_H / 2, JOB_CARD_W, JOB_CARD_H, 18).fill(0xffffff).stroke({ width: 5, color: wood.line }),
      this.friend, this.cardPic,
    );
    this.friend.position.set(-JOB_CARD_W / 2 + 60, JOB_CARD_H / 2 - 12);
    this.cardPic.position.set(50, 4);
    this.card.eventMode = 'none';

    this.checkBtn.addChild(
      new Graphics().circle(0, 0, JOB_CHECK_R).fill(swatch.green.fill).stroke({ width: 5, color: swatch.green.line })
        .moveTo(-20, 0).lineTo(-6, 16).lineTo(22, -16).stroke({ width: 9, color: 0xffffff, cap: 'round', join: 'round' }),
    );
    onTap(this.checkBtn, () => void this.pressCheck(), { radius: JOB_CHECK_R + 4, cooldown: 400 });

    const s = ctx.stage;
    this.bg.eventMode = 'static';
    this.bg.on('pointerdown', () => this.closeLens());
    for (const n of [this.shelfArt, this.shelfLayer, this.cart, this.slotMarks, this.fx, this.glow, this.lens]) n.eventMode = 'none';
    s.addChild(this.bg, this.shelfArt, this.shelfLayer, this.card, this.cart, this.slotMarks, this.checkBtn, this.glow, this.toolLayer, this.fx, this.lens);
    this.lens.visible = false;
    this.layout();
    this.buildJob();
  }

  get deal() {
    return this.round.jobs[this.index];
  }

  get misses() {
    return this.banked.misses + (this.state?.misses ?? 0);
  }

  get hints() {
    return this.banked.hints + (this.state?.hints ?? 0);
  }

  start() {
    void this.ctx.say(this.plan.mode === 'same' ? 'attic-finds.instruct-same' : 'attic-finds.instruct-context')
      .then(() => { if (!this.destroyed && !this.finished) void this.ctx.instruct(JOBS[this.deal.job].line); });
    this.busy = false;
    this.syncDrags();
  }

  /* Building -------------------------------------------------------------------------------------- */

  private layout() {
    const v = this.view, L = this.L;
    this.bg.clear().rect(0, 0, v.w, v.h).fill(WALL);
    this.bg.rect(0, v.h - 150, v.w, 150).fill(wood.light);
    for (let x = 0; x < v.w; x += 120) this.bg.moveTo(x, v.h - 150).lineTo(x - 40, v.h).stroke({ width: 3, color: wood.line, alpha: 0.35 });
    this.bg.poly([0, 0, v.w * 0.32, 0, 0, v.h * 0.42]).fill({ color: BEAM, alpha: 0.35 });
    this.bg.poly([v.w, 0, v.w * 0.68, 0, v.w, v.h * 0.42]).fill({ color: BEAM, alpha: 0.35 });
    this.bg.moveTo(v.w * 0.32, 0).lineTo(0, v.h * 0.42).moveTo(v.w * 0.68, 0).lineTo(v.w, v.h * 0.42).stroke({ width: 14, color: BEAM });
    const wx = v.w / 2, wy = 52;
    this.bg.circle(wx, wy, 34).fill(0xcfeeff).stroke({ width: 7, color: BEAM }).moveTo(wx - 34, wy).lineTo(wx + 34, wy).moveTo(wx, wy - 34).lineTo(wx, wy + 34).stroke({ width: 4, color: BEAM });
    // The rug the things sit on.
    const x0 = L.tools[0].x - TOOL_BOX / 2 - 30, x1 = L.tools[2].x + TOOL_BOX / 2 + 30, y = L.tools[0].y + 50;
    this.bg.ellipse((x0 + x1) / 2, y, (x1 - x0) / 2, 44).fill({ color: RUG, alpha: 0.55 });
    this.bg.hitArea = new Rectangle(0, 0, v.w, v.h);
    const sx0 = L.shelf[0].x - 90, sx1 = L.shelf[2].x + 90;
    this.shelfArt.clear().roundRect(sx0, L.shelfY + 38, sx1 - sx0, 18, 6).fill(wood.fill).stroke({ width: 4, color: wood.line })
      .poly([sx0 + 20, L.shelfY + 56, sx0 + 44, L.shelfY + 56, sx0 + 20, L.shelfY + 84]).poly([sx1 - 20, L.shelfY + 56, sx1 - 44, L.shelfY + 56, sx1 - 20, L.shelfY + 84]).fill(wood.line);
    this.shelved.forEach((n, i) => n.position.set(L.shelf[i].x, L.shelfY + 20));
    this.card.position.set(L.card.x, L.card.y);
    this.cart.position.set(L.cart.x, L.cart.y);
    this.checkBtn.position.set(L.check.x, L.check.y);
    this.lens.position.set(L.lens.x, L.lens.y);
    this.slotMarks.clear();
    for (const p of L.slots) this.slotMarks.roundRect(p.x - CART_SLOT / 2, p.y - CART_SLOT / 2, CART_SLOT, CART_SLOT, 16).fill({ color: cream, alpha: 0.6 }).stroke({ width: 3, color: wood.line, alpha: 0.5 });
    for (const [i, tn] of this.tools.entries()) {
      tn.rug = { ...L.tools[i] };
      const at = this.state ? slotOf(this.state, tn.id) : -1;
      const home = at >= 0 ? L.slots[at] : tn.rug;
      tn.drag.home = { ...home };
      this.ctx.tw.kill(tn.node);
      tn.node.position.set(home.x, home.y);
    }
    this.drawCheck();
  }

  private buildJob() {
    const d = this.deal;
    this.state = jobState(d.job, d.tools);
    this.closeLens();
    for (const tn of this.tools) {
      tn.drag.destroy();
      tn.node.destroy({ children: true });
    }
    this.tools = [];
    this.cardPic.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.cardPic.addChild(jobPicture(d.job));
    d.tools.forEach((id, i) => {
      const node = new Container();
      node.addChild(toolArt(id, this.round.colors[id]));
      node.hitArea = new Rectangle(-TOOL_BOX / 2, -TOOL_BOX / 2, TOOL_BOX, TOOL_BOX);
      const rug = { ...this.L.tools[i] };
      node.position.set(rug.x, rug.y);
      this.toolLayer.addChild(node);
      const tn: ToolNode = { id, node, rug, travel: 0, down: null, drag: null! };
      tn.drag = draggable(node, this.ctx.tw, { onDrop: (x, y) => this.dropTool(tn, x, y) });
      // Told apart from a drag by how far the finger went, since a held thing rides above the finger.
      node.on('pointerdown', (e: FederatedPointerEvent) => {
        tn.down = { x: e.global.x, y: e.global.y };
        tn.travel = 0;
        sfx.pop(6);
      });
      node.on('globalpointermove', (e: FederatedPointerEvent) => {
        if (tn.down && tn.drag.dragging) tn.travel = Math.max(tn.travel, Math.hypot(e.global.x - tn.down.x, e.global.y - tn.down.y) / this.view.scale);
      });
      this.tools.push(tn);
    });
    this.syncDrags();
    this.drawCheck();
  }

  private syncDrags() {
    for (const tn of this.tools) tn.drag.enabled = !this.busy && !this.finished;
  }

  private drawCheck() {
    this.checkBtn.alpha = this.state && inCart(this.state).length ? 1 : 0.5;
  }

  /* Touches --------------------------------------------------------------------------------------- */

  private dropTool(tn: ToolNode, x: number, y: number): boolean {
    const s = this.state, L = this.L;
    const tapped = tn.travel < TAP_TRAVEL;
    tn.down = null;
    if (this.busy || this.finished) return false;
    const at = slotOf(s, tn.id);
    if (tapped) {
      if (at >= 0) {
        // A tap on a thing in the cart puts it back on the rug.
        removeFromCart(s, tn.id);
        this.toRug(tn);
        return true;
      }
      this.ctx.tw.kill(tn.node);
      tn.node.position.set(tn.rug.x, tn.rug.y);
      void this.tryOne(tn, true);
      return true;
    }
    const overCart = Math.abs(x - L.cart.x) <= CART_W / 2 + 40 && Math.abs(y - L.cart.y) <= CART_H / 2 + 60;
    if (overCart) {
      const free = L.slots.map((p, i) => ({ i, d: Math.hypot(p.x - x, p.y - y) })).filter(({ i }) => s.cart[i] === null || i === at).sort((a, b) => a.d - b.d);
      if (!free.length) return false;
      if (at >= 0) removeFromCart(s, tn.id);
      const slot = addToCart(s, tn.id, free[0].i);
      tn.drag.home = { ...L.slots[slot] };
      this.ctx.tw.kill(tn.node.scale);
      void this.ctx.tw.to(tn.node.scale, { x: IN_CART, y: IN_CART }, { duration: 0.2 });
      sfx.knock();
      this.drawCheck();
      return false;
    }
    if (at >= 0) {
      removeFromCart(s, tn.id);
      this.toRug(tn);
      return true;
    }
    return false;
  }

  private toRug(tn: ToolNode) {
    tn.drag.home = { ...tn.rug };
    this.ctx.tw.kill(tn.node.scale);
    void this.ctx.tw.to(tn.node.scale, { x: 1, y: 1 }, { duration: 0.2 });
    void tn.drag.floatHome();
    sfx.pop(4);
    this.drawCheck();
  }

  private setBusy(b: boolean) {
    this.busy = b;
    this.syncDrags();
  }

  /** A tap: the thing takes the load and carries it a little way; it holds, or the load shows why not. Never counted. */
  private async tryOne(tn: ToolNode, byHer: boolean) {
    this.setBusy(true);
    this.closeLens();
    const why = byHer ? tryTool(this.state, tn.id) : reason(tn.id, this.state.job);
    await this.playTry(tn, why, true);
    if (this.destroyed) return;
    if (byHer) {
      this.openLens(tn.id);
      await this.ctx.say(why ? `attic-finds.${why}` : 'attic-finds.held');
      if (this.destroyed) return;
      void this.ctx.say(decidingPart(tn.id, this.state.job).line);
    }
    this.setBusy(false);
  }

  /** The animation of one try where the thing sits: the load drops in, it sways along, and holds or fails. */
  private async playTry(tn: ToolNode, why: Reason | null, full: boolean) {
    const n = tn.node, home = { x: n.x, y: n.y }, k = n.scale.x;
    const woven = tn.id === 'basket' || tn.id === 'hoop';
    sfx.pop(woven ? 5 : 3);
    if (!woven) sfx.knock();
    const load = loadArt(this.state.job);
    load.scale.set(0.8 * k);
    load.position.set(home.x, home.y - 120 * k);
    load.alpha = 0;
    this.fx.addChild(load);
    const restY = home.y + (tn.id === 'tray' ? -20 : -14) * k;
    void this.ctx.tw.to(load, { alpha: 1 }, { duration: 0.15 });
    await this.ctx.tw.to(load, { y: restY }, { duration: 0.35, ease: ease.outBack });
    if (this.destroyed) return;
    const sway = full ? 26 : 16;
    const lift = (dx: number, dy: number, t: number) => Promise.all([
      this.ctx.tw.to(n, { x: home.x + dx, y: home.y + dy }, { duration: t, ease: ease.inOutSine }),
      this.ctx.tw.to(load, { x: home.x + dx, y: restY + dy }, { duration: t, ease: ease.inOutSine }),
    ]);
    await lift(sway, -18, 0.25);
    if (this.destroyed) return;
    if (!why) {
      sfx.pluck(8);
      sfx.pluck(11, 0.12);
      await lift(-sway, -18, 0.35);
      if (this.destroyed) return;
      await lift(0, 0, 0.25);
    } else {
      sfx.pluck(9);
      sfx.pluck(5, 0.14);
      await this.playFail(why, load, n, home, k);
      if (this.destroyed) return;
      await this.ctx.tw.to(n, { x: home.x, y: home.y }, { duration: 0.25, ease: ease.inOutSine });
    }
    if (this.destroyed) return;
    await this.ctx.tw.to(load, { alpha: 0 }, { duration: 0.2 });
    load.destroy({ children: true });
  }

  private async playFail(why: Reason, load: Container, n: Container, home: { x: number; y: number }, k: number) {
    const p = this.ctx.particles;
    if (why === 'fell') {
      // Straight through the open bottom, onto the rug.
      this.fx.addChildAt(load, 0);
      await this.ctx.tw.to(load, { y: home.y + 70 * k }, { duration: 0.4, ease: ease.inQuad });
    } else if (why === 'rolled') {
      await Promise.all([
        this.ctx.tw.to(load, { x: n.x + 120 * k, y: home.y + 50 * k, rotation: 2.4 }, { duration: 0.55, ease: ease.inQuad }),
        this.ctx.tw.to(n, { rotation: 0.12 }, { duration: 0.2 }),
      ]);
      await this.ctx.tw.to(n, { rotation: 0 }, { duration: 0.15 });
    } else if (why === 'sloshed') {
      await this.ctx.tw.to(n, { rotation: 0.16 }, { duration: 0.18 });
      p.burst(n.x + 70 * k, n.y - 10 * k, { kind: 'dot', colors: [swatch.blue.fill, swatch.blue.light], count: 12, speed: [80, 180], angle: -0.6, spread: 0.8, gravity: 600, life: [0.5, 0.8] });
      await Promise.all([this.ctx.tw.to(load, { alpha: 0.2, x: n.x + 30 * k }, { duration: 0.4 }), this.ctx.tw.to(n, { rotation: 0 }, { duration: 0.4 })]);
    } else {
      // Drips out between the strips, all the way down.
      for (let i = 0; i < 3; i++) {
        p.burst(n.x + (i - 1) * 30 * k, n.y + 40 * k, { kind: 'dot', colors: [swatch.blue.fill, swatch.blue.light], count: 5, speed: [20, 60], angle: Math.PI / 2, spread: 0.4, gravity: 500, life: [0.4, 0.7] });
        await this.ctx.tw.wait(0.2);
        if (this.destroyed) return;
      }
      await this.ctx.tw.to(load.scale, { y: 0.2 * k, x: 0.6 * k }, { duration: 0.3 });
    }
  }

  private openLens(tool: ToolId) {
    this.lens.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.lens.addChild(partArt(tool, decidingPart(tool, this.state.job), this.round.colors[tool]));
    this.lens.visible = true;
    this.lens.scale.set(0.6);
    void this.ctx.tw.to(this.lens.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack });
  }

  private closeLens() {
    this.lens.visible = false;
  }

  /* Check ----------------------------------------------------------------------------------------- */

  private async pressCheck() {
    if (this.busy || this.finished) return;
    const s = this.state;
    const cart = inCart(s).map((id) => this.tools.find((t) => t.id === id)!).sort((a, b) => slotOf(s, a.id) - slotOf(s, b.id));
    const glowBefore = s.glow;
    const { result, failing } = checkJob(s);
    if (result === 'empty') {
      await this.wiggleCart();
      void this.ctx.say('attic-finds.empty-cart');
      return;
    }
    this.setBusy(true);
    this.closeLens();
    for (const tn of cart) {
      await this.playTry(tn, reason(tn.id, s.job), false);
      if (this.destroyed) return;
    }
    if (result === 'miss') {
      sfx.boing();
      const first = failing[0];
      void this.ctx.say(`attic-finds.${reason(first, s.job)!}`);
      for (const id of failing) this.toRug(this.tools.find((t) => t.id === id)!);
      if (s.glow && !glowBefore) {
        this.openLens(first);
        void this.ctx.say('attic-finds.hint-tools');
      }
      this.setBusy(false);
      return;
    }
    if (result === 'one-more') {
      await this.wiggleCart();
      void this.ctx.say('attic-finds.one-more');
      this.setBusy(false);
      return;
    }
    await this.jobDone(cart);
  }

  private async wiggleCart() {
    const nodes = [this.cart, ...this.tools.filter((t) => slotOf(this.state, t.id) >= 0).map((t) => t.node)];
    sfx.knock();
    await Promise.all(nodes.map((n) => this.ctx.tw.to(n, { rotation: 0.06 }, { duration: 0.1 })
      .then(() => this.ctx.tw.to(n, { rotation: -0.06 }, { duration: 0.12 }))
      .then(() => this.ctx.tw.to(n, { rotation: 0 }, { duration: 0.1 }))));
  }

  private async jobDone(cart: ToolNode[]) {
    const job = this.state.job;
    // The cart rolls toward the friend and back; the friend cheers; the load goes up on the shelf.
    const nodes = [this.cart, ...cart.map((t) => t.node)];
    const dx = -50;
    await Promise.all(nodes.map((n) => this.ctx.tw.to(n, { x: n.x + dx }, { duration: 0.4, ease: ease.inOutSine })));
    if (this.destroyed) return;
    this.friend.cheer();
    sfx.bell(9);
    sfx.bell(12, 0.15);
    const spot = this.L.shelf[this.index];
    const pic = loadArt(job);
    pic.scale.set(0.9);
    pic.position.set(this.L.card.x + 50, this.L.card.y);
    this.shelfLayer.addChild(pic);
    this.shelved.push(pic);
    void this.ctx.tw.to(pic, { x: spot.x, y: this.L.shelfY + 20 }, { duration: 0.6, ease: ease.inOutSine });
    void this.ctx.tw.to(pic.scale, { x: 0.8, y: 0.8 }, { duration: 0.6 });
    await Promise.all(nodes.map((n) => this.ctx.tw.to(n, { x: n.x - dx }, { duration: 0.4, ease: ease.inOutSine })));
    if (this.destroyed) return;
    sfx.bell(7, 0.2);
    this.ctx.pet.cheer();
    await this.ctx.say(doneLine(this.plan, job));
    if (this.destroyed) return;
    this.banked.misses += this.state.misses;
    this.banked.hints += this.state.hints;
    this.state.misses = 0;
    this.state.hints = 0;
    if (this.index + 1 >= this.round.jobs.length) {
      await this.finale();
      return;
    }
    this.index++;
    this.buildJob();
    void this.ctx.instruct(JOBS[this.deal.job].line);
    this.setBusy(false);
  }

  private async finale() {
    this.finished = true;
    this.syncDrags();
    this.finaleT = 0;
    sfx.tada();
    void this.ctx.say('attic-finds.jobs-done');
    await this.ctx.tw.wait(1.4);
    if (this.destroyed) return;
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  /* Help ------------------------------------------------------------------------------------------ */

  askForHint() {
    if (this.finished || this.state.done) return;
    helpJob(this.state);
    const failing = this.state.tools.find((t) => !works(t, this.state.job));
    this.openLens(failing ?? workingSet(this.state.job, this.state.tools)[0]);
    void this.ctx.say('attic-finds.hint-tools');
  }

  restart() {
    if (this.finished) return;
    this.banked.misses += this.state.misses;
    this.banked.hints += this.state.hints;
    for (const n of this.shelved) n.destroy({ children: true });
    this.shelved = [];
    for (const n of this.fx.removeChildren()) n.destroy({ children: true });
    this.index = 0;
    this.buildJob();
    this.setBusy(false);
  }

  /* Frame ----------------------------------------------------------------------------------------- */

  update(dt: number) {
    this.t += dt;
    this.friend.update(dt);
    this.glow.clear();
    if (this.state && !this.finished) {
      const pulse = 0.5 + 0.5 * Math.sin(this.t * 5);
      for (const id of glowingTools(this.state)) {
        const n = this.tools.find((t) => t.id === id)?.node;
        if (!n) continue;
        const r = (TOOL_BOX / 2 + 8) * n.scale.x;
        this.glow.roundRect(n.x - r, n.y - r, 2 * r, 2 * r, 24).fill({ color: swatch.yellow.light, alpha: 0.35 + 0.25 * pulse })
          .stroke({ width: 6, color: swatch.yellow.fill, alpha: 0.6 + 0.4 * pulse });
      }
    }
    if (this.finaleT !== null) {
      this.finaleT += dt;
      const k = Math.min(1, this.finaleT / 0.8);
      this.shelved.forEach((n) => { n.y = this.L.shelfY + 20 - 24 * Math.sin(Math.PI * k); });
      if (k >= 1) this.finaleT = null;
    }
  }

  resize(view: View) {
    this.view = view;
    this.L = jobLayout(view);
    this.layout();
  }

  /* Bot ------------------------------------------------------------------------------------------- */

  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.tools.some((t) => t.drag.dragging)) return null;
    const s = this.state;
    const node = (id: ToolId) => this.tools.find((t) => t.id === id)!.node;
    const good = workingSet(s.job, s.tools), bad = s.tools.filter((t) => !works(t, s.job));
    if (this.plan.mode === 'same') {
      // A failing thing first (a free try), then one that holds, so the demonstration shows trying costs nothing.
      if (bad.length && !s.tried.has(bad[0])) return { tap: { on: node(bad[0]) }, pause: 1.2 };
      if (!good.some((t) => s.tried.has(t))) return { tap: { on: node(good[0]) }, pause: 1.2 };
    } else if (s.tried.size === 0 && inCart(s).length === 0) return { tap: { on: node(s.tools[0]) }, pause: 1.2 };
    const next = good.find((t) => slotOf(s, t) < 0);
    if (next) {
      const slot = s.cart.indexOf(null);
      const to = this.L.slots[slot];
      return { drag: { on: node(next) }, to: { on: this.ctx.stage, x: to.x, y: to.y }, pause: 0.6 };
    }
    return { tap: { on: this.checkBtn } };
  }

  destroy() {
    this.destroyed = true;
    for (const tn of this.tools) tn.drag.destroy();
    this.bg.removeAllListeners();
  }
}
