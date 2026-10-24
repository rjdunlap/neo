import { Circle, Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { againIcon, arrowIcon, checkIcon } from '../../ui/icons';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import type { LineId } from '../../content/voice-script';
import { beadBody, beadTrio, cardArt, drawHands, drawLinks, LINK_COLOR, shapePicture, tableArt } from './art';
import {
  allHeld, BEAD_R, beadAt, beadLayout, Bench, canLink, centre, CheckTally, helpFor, linkAt, linked, nextMove, planFor, roundFor, tally,
  type BeadLayout, type Help, type Kind, type Link, type Plan, type Pt, type Step,
} from './logic';

const LEVELS: BandLevels = {
  school: { min: 1, max: 2 },
};

/** Finger travel below this is a tap on a bead (select it, or link to the selected one), not a carry. */
const PRESS_TRAVEL = 15;

class BondBeads implements Game {
  readonly plan: Plan;
  readonly steps: Step[];
  readonly tally = new CheckTally();
  index = 0;
  bench!: Bench;
  finished = false;
  busy = false;
  /** Tap-tap linking: the bead tapped first, waiting for a second. */
  selected: number | null = null;
  layoutNow: BeadLayout | null = null;
  /** What the glow or a pulse points at, refreshed after every change. */
  help: Help | null = null;
  private alive = true;
  private epoch = 0;
  private clock = 0;
  private view: View;
  private relayout = false;
  private wasStuck = false;

  private readonly backdrop: Backdrop;
  private readonly board = new Container();
  private readonly linkGfx = new Graphics();
  private readonly pull = new Graphics();
  private readonly glow = new Graphics();
  linkLayer: Container | null = null;
  beadNodes: Container[] = [];
  private hands: Graphics[] = [];
  private drags: DragHandle[] = [];
  checkButton: RoundButton | null = null;
  undoButton: RoundButton | null = null;
  againButton: RoundButton | null = null;
  private press = { bead: -1, x: 0, y: 0, travel: 0 };

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.steps = roundFor(this.plan.level, ctx.rng);
    this.backdrop = new Backdrop({ sky: [0xc8f0ec, 0xfff6e0], hills: [0xa9e0d6, 0xc5e7a8], horizon: 0.5, clouds: 2, sun: true, seed: 173 }, ctx.view);
    for (const n of [this.linkGfx, this.pull, this.glow]) n.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.board);
  }

  private get level2() {
    return this.plan.level === 2;
  }

  private instruction(): LineId {
    return this.level2 ? 'bondbeads.instruct.copy' : 'bondbeads.instruct.hold';
  }

  start() {
    this.openStep();
    void this.ctx.instruct(this.instruction());
  }

  destroy() {
    this.alive = false;
    for (const d of this.drags) d.destroy();
    this.drags = [];
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    // The shell can resize before start() opens the first tray.
    if (!this.bench) return;
    if (this.busy || this.finished || this.drags.some((d) => d.dragging)) { this.relayout = true; return; }
    this.build();
  }

  private openStep() {
    const s = this.steps[this.index];
    this.bench = new Bench(s.kinds, s.card);
    this.tally.next();
    this.selected = null;
    this.wasStuck = false;
    this.build();
  }

  /** Every node of the board, rebuilt from the model. */
  private build() {
    this.epoch++;
    this.relayout = false;
    for (const d of this.drags) d.destroy();
    this.drags = [];
    this.beadNodes = [];
    this.hands = [];
    this.linkLayer = null;
    this.checkButton = this.undoButton = this.againButton = null;
    for (const n of [this.linkGfx, this.pull, this.glow]) n.removeFromParent();
    for (const c of this.board.removeChildren()) c.destroy({ children: true });
    if (this.finished) return;
    const s = this.steps[this.index];
    const l = beadLayout(this.view, s.kinds.length, s.card !== null);
    this.layoutNow = l;
    if (!l) return;

    const table = tableArt(l.table.w, l.table.h);
    table.eventMode = 'none';
    table.position.copyFrom(centre(l.table));
    this.board.addChild(table);

    // Taps between the beads break the nearest link; the beads, drawn above, take their own touches.
    const layer = new Container();
    layer.hitArea = new Rectangle(l.table.x, l.table.y, l.table.w, l.table.h);
    onTap(layer, (e: FederatedPointerEvent) => this.tapLinks(this.board.toLocal(e.global)), { cooldown: 150 });
    layer.addChild(this.linkGfx, this.pull);
    this.board.addChild(layer);
    this.linkLayer = layer;

    s.kinds.forEach((kind, i) => this.buildBead(kind, i, l.beads[i]));
    this.board.addChild(this.glow);

    this.buildTally(l, s.kinds);
    if (s.card && l.card) {
      const card = new Container();
      card.eventMode = 'none';
      card.position.copyFrom(centre(l.card));
      const pic = shapePicture(s.card, 64, 24);
      const fit = Math.min(1.6, (l.card.w - 40) / Math.max(1, pic.width), (l.card.h - 40) / Math.max(1, pic.height));
      pic.scale.set(fit);
      const b = pic.getLocalBounds();
      pic.position.set(-(b.x + b.width / 2) * fit, -(b.y + b.height / 2) * fit);
      card.addChild(cardArt(l.card.w, l.card.h), pic);
      this.board.addChild(card);
    }
    if (l.check) {
      this.checkButton = new RoundButton(checkIcon(), swatch.green, l.check.w / 2, () => this.check());
      this.checkButton.position.copyFrom(centre(l.check));
      this.board.addChild(this.checkButton);
    }
    this.undoButton = new RoundButton(arrowIcon(-1), swatch.yellow, l.undo.w / 2, () => this.undo());
    this.undoButton.position.copyFrom(centre(l.undo));
    this.againButton = new RoundButton(againIcon(), swatch.blue, l.again.w / 2, () => this.restart());
    this.againButton.position.copyFrom(centre(l.again));
    this.board.addChild(this.undoButton, this.againButton);
    this.redraw();
  }

  private buildBead(kind: Kind, i: number, at: Pt) {
    const node = new Container();
    const hands = new Graphics();
    hands.eventMode = 'none';
    const body = beadBody(kind, BEAD_R);
    body.eventMode = 'none';
    node.addChild(hands, body);
    node.hitArea = new Circle(0, 0, BEAD_R + 14);
    node.position.set(at.x, at.y);
    this.board.addChild(node);
    node.on('pointerdown', (e: FederatedPointerEvent) => {
      this.press = { bead: i, x: e.global.x, y: e.global.y, travel: 0 };
    });
    node.on('globalpointermove', (e: FederatedPointerEvent) => {
      if (this.press.bead === i) this.press.travel = Math.max(this.press.travel, Math.hypot(e.global.x - this.press.x, e.global.y - this.press.y) / Math.max(0.01, this.view.scale));
    });
    const drag = draggable(node, this.ctx.tw, {
      onPick: () => sfx.tick(),
      onMove: (x, y) => this.drawPull(i, { x, y }),
      onDrop: (x, y) => this.dropBead(i, { x, y }),
    });
    this.drags.push(drag);
    this.beadNodes.push(node);
    this.hands.push(hands);
  }

  private buildTally(l: BeadLayout, kinds: Kind[]) {
    const strip = new Container();
    strip.eventMode = 'none';
    const groups = tally(kinds);
    const row = () => {
      const c = new Container();
      let x = 0;
      for (const g of groups) {
        for (let n = 0; n < g.count; n++) {
          const b = beadBody(g.kind, 14, false);
          b.position.set(x + 14, 0);
          c.addChild(b);
          x += 32;
        }
        const t = label(String(g.count), 26);
        t.position.set(x + 10, 0);
        c.addChild(t);
        x += 44;
      }
      return { c, w: x };
    };
    const now = row();
    if (this.level2) {
      const before = row();
      const arrow = arrowIcon(1);
      arrow.scale.set(0.6);
      const gap = 60;
      const total = before.w + gap + now.w;
      before.c.x = -total / 2;
      arrow.x = -total / 2 + before.w + gap / 2 - 6;
      now.c.x = -total / 2 + before.w + gap;
      strip.addChild(before.c, arrow, now.c);
    } else {
      now.c.x = -now.w / 2;
      strip.addChild(now.c);
    }
    strip.position.copyFrom(centre(l.tally));
    const fit = Math.min(1, (l.tally.w - 20) / Math.max(1, strip.width));
    strip.scale.set(fit);
    this.board.addChild(strip);
  }

  /** The beads' hands, the links and the selection, from the model. */
  private redraw() {
    const l = this.layoutNow;
    if (!l) return;
    const beads = l.beads;
    this.linkGfx.clear();
    drawLinks(this.linkGfx, beads, this.bench.links);
    this.bench.kinds.forEach((kind, i) => {
      const held = this.bench.links.filter((k) => k[0] === i || k[1] === i).map((k) => {
        const j = k[0] === i ? k[1] : k[0];
        return Math.atan2(beads[j].y - beads[i].y, beads[j].x - beads[i].x);
      });
      drawHands(this.hands[i], kind, BEAD_R, held);
      if (this.selected === i) this.hands[i].circle(0, 0, BEAD_R + 20).stroke({ width: 7, color: swatch.yellow.fill });
    });
    this.help = helpFor(this.bench);
  }

  private drawPull(i: number, at: Pt) {
    const l = this.layoutNow;
    if (!l) return;
    this.pull.clear();
    this.pull.moveTo(l.beads[i].x, l.beads[i].y).lineTo(at.x, at.y).stroke({ width: 10, color: LINK_COLOR, alpha: 0.6, cap: 'round' });
  }

  private dropBead(i: number, at: Pt): boolean {
    this.pull.clear();
    const l = this.layoutNow;
    const tapped = this.press.bead === i && this.press.travel < PRESS_TRAVEL;
    this.press.bead = -1;
    if (!l || this.busy || this.finished) return false;
    if (tapped) {
      this.tapBead(i);
      return false;
    }
    const j = beadAt(at, l.beads, i);
    // Dropped on the table, or on a bead with no hand free: it floats home and nothing counts.
    if (j !== null) this.tryLink(i, j);
    else this.selected = null;
    this.redraw();
    return false;
  }

  private tapBead(i: number) {
    const sel = this.selected;
    if (sel === null || sel === i) {
      this.selected = sel === i ? null : i;
      sfx.pop(sel === i ? 5 : 8);
      this.redraw();
      return;
    }
    this.selected = null;
    this.tryLink(sel, i);
    this.redraw();
  }

  private tryLink(a: number, b: number) {
    this.selected = null;
    if (!canLink(this.bench.kinds, this.bench.links, a, b)) {
      if (!linked(this.bench.links, a, b)) void this.ctx.say('bondbeads.full');
      void this.wiggle(this.beadNodes[b]);
      return;
    }
    this.bench.link(a, b);
    sfx.pluck(2 + this.bench.links.length);
    const l = this.layoutNow!;
    const m = { x: (l.beads[a].x + l.beads[b].x) / 2, y: (l.beads[a].y + l.beads[b].y) / 2 };
    this.ctx.particles.burst(m.x, m.y, { colors: [swatch.yellow.fill, 0xffffff], count: 6 });
    this.changed();
  }

  private tapLinks(p: Pt) {
    if (this.busy || this.finished || !this.layoutNow) return;
    const link = linkAt(p, this.layoutNow.beads, this.bench.links);
    if (!link) return;
    this.cut(link);
  }

  private cut(link: Link) {
    this.bench.unlink(link[0], link[1]);
    this.selected = null;
    sfx.pop(4);
    this.changed();
  }

  private undo() {
    if (this.busy || this.finished) return;
    if (this.bench.undo()) { this.selected = null; this.changed(); }
  }

  /** Start again (on screen and on the pause sheet): the opening beads with no links; Undo can bring the build back. */
  restart() {
    if (this.busy || this.finished) return;
    this.bench.startAgain();
    this.selected = null;
    this.changed();
  }

  /** After a link, a break or an undo: redraw, then a finished tray (level 1) or a stuck one. */
  private changed() {
    this.redraw();
    if (this.level2) return;
    if (this.bench.done) { void this.stepDone(); return; }
    // Every hand that is free is on a bead that cannot reach another: show a link to break, never counted.
    const stuck = this.bench.stuck;
    if (stuck && this.help) {
      // Said once as the tray gets stuck; the pulse shows the link again on every later change.
      if (!this.wasStuck) void this.ctx.say('bondbeads.stuck');
      void this.pulse(this.help);
    }
    this.wasStuck = stuck;
  }

  /** Level 2's Check. */
  check() {
    if (this.busy || this.finished || !this.level2) return;
    const v = this.tally.check(this.bench);
    if (v === 'match') { void this.stepDone(); return; }
    if (v === 'assist') { void this.assist(); return; }
    const h = this.help;
    if (v === 'glow') { void this.ctx.say('bondbeads.hint'); return; }
    void this.ctx.say(this.factLine(h));
    if (h) void this.pulse(h);
  }

  /** One fact about the build: a free hand, a bead left over, or a link the card does not have. */
  private factLine(h: Help | null): LineId {
    if (!h) return 'bondbeads.instruct.copy';
    if (h.kind === 'free') return 'bondbeads.free';
    if (h.kind === 'left') return 'bondbeads.left';
    return allHeld(this.bench.kinds, this.bench.links) ? 'bondbeads.notcard' : 'bondbeads.break';
  }

  /** Where a help points, on the board. */
  private helpAt(h: Help): Pt {
    const b = this.layoutNow!.beads;
    if (h.kind === 'break') return { x: (b[h.link[0]].x + b[h.link[1]].x) / 2, y: (b[h.link[0]].y + b[h.link[1]].y) / 2 };
    return b[h.bead];
  }

  private async pulse(h: Help) {
    if (!this.layoutNow) return;
    const at = this.helpAt(h);
    const ring = new Graphics().circle(0, 0, h.kind === 'break' ? 34 : BEAD_R + 16).stroke({ width: 8, color: swatch.yellow.fill });
    ring.eventMode = 'none';
    ring.position.set(at.x, at.y);
    this.board.addChild(ring);
    const epoch = this.epoch;
    await this.ctx.tw.to(ring.scale, { x: 1.3, y: 1.3 }, { duration: 0.4, ease: ease.outBack });
    if (!this.alive || epoch !== this.epoch || ring.destroyed) return;
    await this.ctx.tw.to(ring, { alpha: 0 }, { duration: 0.35 });
    if (!this.alive || epoch !== this.epoch || ring.destroyed) return;
    ring.destroy();
  }

  private async wiggle(n: Container | undefined) {
    if (!n) return;
    const x = n.x;
    for (const dx of [8, -8, 5, 0]) {
      if (!this.alive || n.destroyed) return;
      await this.ctx.tw.to(n, { x: x + dx }, { duration: 0.05 });
    }
  }

  /** The supported finish: the remaining breaks and links play by themselves, with nothing more counted. */
  private async assist() {
    this.busy = true;
    const epoch = this.epoch;
    void this.ctx.say('bondbeads.hint');
    for (let n = 0; n < 12 && !this.bench.done; n++) {
      await this.ctx.tw.wait(0.5);
      if (!this.alive || epoch !== this.epoch) return;
      const m = nextMove(this.bench);
      if (!m || 'check' in m) break;
      if ('make' in m) this.bench.link(m.make[0], m.make[1]);
      else this.bench.unlink(m.cut[0], m.cut[1]);
      sfx.pluck(3 + this.bench.links.length);
      this.redraw();
    }
    await this.ctx.tw.wait(0.4);
    if (!this.alive || epoch !== this.epoch) return;
    this.busy = false;
    void this.stepDone();
  }

  private async stepDone() {
    if (this.busy) return;
    this.busy = true;
    this.selected = null;
    const epoch = this.epoch;
    const l = this.layoutNow!;
    sfx.tada();
    for (const b of l.beads) this.ctx.particles.burst(b.x, b.y, { colors: [swatch.yellow.fill, swatch.red.fill, 0xffffff], count: 6 });
    this.ctx.pet.cheer();
    for (const n of this.beadNodes) void this.hop(n);
    await this.ctx.say(this.level2 ? 'bondbeads.match' : 'bondbeads.held');
    if (!this.alive || epoch !== this.epoch) return;
    if (this.index + 1 >= this.steps.length) return this.finale();
    this.index++;
    this.busy = false;
    this.openStep();
  }

  private async hop(n: Container) {
    const y = n.y;
    await this.ctx.tw.to(n, { y: y - 24 }, { duration: 0.18, ease: ease.outBack });
    if (this.alive && !n.destroyed) await this.ctx.tw.to(n, { y }, { duration: 0.22 });
  }

  private async finale() {
    sfx.tada();
    await this.ctx.say('bondbeads.done');
    if (!this.alive) return;
    this.finished = true;
    this.ctx.finish({ misses: this.tally.misses, hints: this.tally.hints });
  }

  update(dt: number) {
    this.clock += dt;
    if (this.relayout && !this.busy && !this.finished && !this.drags.some((d) => d.dragging)) this.build();
    this.glow.clear();
    if (!this.tally.glowing || !this.help || !this.layoutNow || this.busy) return;
    const at = this.helpAt(this.help);
    const r = (this.help.kind === 'break' ? 34 : BEAD_R + 16) * (1 + 0.06 * Math.sin(this.clock * 5));
    this.glow.circle(at.x, at.y, r).stroke({ width: 8, color: swatch.yellow.fill });
  }

  /** The pause sheet's Show a hint: at level 2 the glow (one hint per card); at level 1 a free pulse, never counted. */
  askForHint() {
    if (this.busy || this.finished || !this.help) return;
    if (this.level2) {
      this.tally.ask();
      void this.ctx.say('bondbeads.hint');
      return;
    }
    void this.ctx.say(this.factLine(this.help) === 'bondbeads.notcard' ? 'bondbeads.stuck' : this.factLine(this.help));
    void this.pulse(this.help);
  }

  hintLabel = 'Show a hint';

  /** The ghost finger: carry a bead to the one the next link needs, tap a link that has to go, then (level 2) Check. */
  autotouch(): TouchIntent | null {
    if (this.finished || this.busy || this.drags.some((d) => d.dragging) || !this.layoutNow) return null;
    const m = nextMove(this.bench);
    if (!m) return null;
    if ('check' in m) return this.checkButton ? { tap: { on: this.checkButton } } : null;
    if ('cut' in m) {
      const b = this.layoutNow.beads;
      const at = { x: (b[m.cut[0]].x + b[m.cut[1]].x) / 2, y: (b[m.cut[0]].y + b[m.cut[1]].y) / 2 };
      return this.linkLayer ? { tap: { on: this.linkLayer, x: at.x, y: at.y } } : null;
    }
    const [a, b] = m.make;
    return { drag: { on: this.beadNodes[a] }, to: { on: this.beadNodes[b] } };
  }
}

class BeadIcon extends WigglyIcon {
  constructor() {
    const trio = beadTrio(30);
    trio.position.set(0, -70);
    const c = new Container();
    c.addChild(trio);
    super(c);
  }
}

/** A seeded little shape of linked beads. */
function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const kinds = rng.pick<Kind[]>([['H', 'O', 'H'], ['O', 'O', 'O'], ['H', 'C', 'H'], ['O', 'C', 'O']]);
  const c = beadTrio(34, kinds, rng.range(0.2, 0.5));
  return c;
}

export const bondBeads: GameModule = {
  id: 'bond-beads',
  name: 'Bond Beads',
  titleLine: 'game.bond-beads',
  region: 'tinker-lab',
  skills: ['composition', 'conservation', 'rearrangement', 'spatial'],
  bands: ['school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.stickers,
  coplayHint: "What's the same? Look at a shape together, break it, build another and say what stayed the same.",
  offScreen: 'Take a set of snap-together blocks, build something, take it apart and build something different. Count the blocks each time.',
  hubIcon: () => new BeadIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new BondBeads(ctx),
};
