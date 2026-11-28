import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { ink, swatch, wood, type ColorName } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { puffs } from '../../art/shapes';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import type { Game, GameContext, Spot, TouchIntent } from '../types';
import { Bloom } from './bloom';
import { CARD, CARD_GAP, STEP, drawCard, drawPacket } from './conditions';
import {
  CONDITIONS,
  LEAF_STEPS,
  RULER,
  answerUnder,
  growthHeight,
  makeUnder,
  moreOf,
  nextLeafStep,
  planFor,
  rootDepth,
  type FlowerKind,
  type GardenPlan,
  type Setup,
  type UnderAvoid,
  type UnderRound,
} from './logic';

/** The soil block under a bed: 180 wide and 140 deep, in the bed's own units (the ground line is y = 0). */
const SOIL_W = 180;
const SOIL_H = 140;
const SOIL = 0x8a5a36;
const ROOT = 0xf5e3c0;
/** The lift button sits under the soil block; its hit area is 140 × 124 in the bed's own units. */
const KNOB_W = 140;
const KNOB_H = 124;
const KNOB_Y = SOIL_H + 8 + KNOB_H / 2;
/** How much of a plant's final root length (and so its ruler steps) each of the five stages has grown. */
const GROWN = [0.18, 0.4, 0.7, 0.85, 1];

type Round15 = UnderRound;

/** A tap target: a transparent object with a hit area, and the spot at its middle for the ghost finger. */
interface Hit {
  node: Container;
  spot: Spot;
}
function makeHit(parent: Container, rect: Rectangle, fn: () => void, cooldown = 200): Hit {
  const node = new Container();
  node.hitArea = rect;
  onTap(node, fn, { cooldown });
  parent.addChild(node);
  return { node, spot: { on: node, x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 } };
}

/** One stylised root system: a main root and a few branches, drawn `steps` ruler steps deep. */
function drawRoots(g: Graphics, steps: number) {
  g.clear();
  const L = STEP * steps;
  const line = { width: 7, color: ROOT, cap: 'round' as const, join: 'round' as const };
  g.moveTo(0, 0)
    .quadraticCurveTo(6, L * 0.5, 0, L)
    .stroke(line);
  const branches: [number, number][] = [
    [0.35, -1],
    [0.5, 1],
    [0.7, -1],
    [0.8, 1],
  ];
  for (const [at, side] of branches) {
    const y = L * at;
    if (L < STEP * 1.5 && at > 0.4) continue;
    g.moveTo(0, y)
      .quadraticCurveTo(side * L * 0.18, y + L * 0.05, side * L * 0.3, y + L * 0.18)
      .stroke({ ...line, width: 5 });
  }
}

/** A ruler along one side of the bed: ticks and numbers going up (-1) or down (1) from the ground line. */
function drawRuler(dir: 1 | -1) {
  const c = new Container();
  c.addChild(
    new Graphics()
      .moveTo(-100, dir * 10)
      .lineTo(-100, dir * (10 + STEP * RULER))
      .stroke({ width: 4, color: wood.line, cap: 'round' }),
  );
  for (let k = 1; k <= RULER; k++) {
    const y = dir * (10 + STEP * k);
    c.addChild(
      new Graphics().moveTo(-112, y).lineTo(-88, y).stroke({ width: 4, color: wood.line, cap: 'round' }),
    );
    const t = new Text({
      text: String(k),
      style: { fontFamily: 'sans-serif', fontSize: 16, fontWeight: '700', fill: wood.line },
    });
    t.anchor.set(1, 0.5);
    t.position.set(-118, y);
    c.addChild(t);
  }
  const flag = new Graphics().poly([-100, 0, -76, -8, -100, -16]).fill(swatch.red.fill);
  flag.visible = false;
  c.addChild(flag);
  c.visible = false;
  return { c, flag };
}

/** A leaf under the soil at one of its three pictured steps: whole, with tiny holes and visitors, then crumbs. */
function drawLeafStep(g: Graphics, step: number) {
  g.clear();
  const leaf = (cx: number, cy: number, rot: number, scale: number, holes: boolean) => {
    const l = new Container();
    const body = new Graphics()
      .ellipse(0, 0, 60 * scale, 26 * scale)
      .fill(swatch.green.fill)
      .stroke({ width: 4, color: swatch.green.line })
      .moveTo(-56 * scale, 0)
      .lineTo(56 * scale, 0)
      .stroke({ width: 3, color: swatch.green.line });
    if (holes)
      for (const [x, y, r] of [
        [-24, -8, 6],
        [10, 9, 7],
        [30, -6, 5],
        [-8, 10, 5],
      ])
        body.circle(x * scale, y * scale, r * scale).fill(SOIL);
    l.addChild(body);
    l.position.set(cx, cy);
    l.rotation = rot;
    return l;
  };
  const worm = (x: number, y: number) =>
    g
      .moveTo(x - 22, y)
      .quadraticCurveTo(x - 10, y - 16, x, y)
      .quadraticCurveTo(x + 10, y + 14, x + 22, y - 2)
      .stroke({ width: 9, color: 0xf4a6a6, cap: 'round' });
  const bug = (x: number, y: number) =>
    g
      .ellipse(x, y, 8, 6)
      .fill(0x4a3a30)
      .circle(x + 8, y - 1, 3.5)
      .fill(0x4a3a30);
  const holder = new Container();
  if (step === 0) {
    holder.addChild(leaf(0, 70, 0.08, 1, false));
  } else if (step === 1) {
    holder.addChild(leaf(0, 62, 0.08, 1, true));
    worm(-30, 112);
    bug(46, 100);
    bug(-60, 90);
  } else {
    // Crumbs: small dark bits and richer, darker soil around them.
    g.ellipse(0, 88, 82, 44).fill({ color: 0x5e3a20, alpha: 0.7 });
    for (const [x, y, r] of [
      [-36, 74, 7],
      [-12, 92, 6],
      [14, 78, 8],
      [38, 96, 6],
      [4, 106, 5],
      [-52, 100, 5],
    ])
      g.circle(x, y, r).fill(0x6d7a3c);
    worm(30, 118);
    bug(-46, 118);
  }
  return holder;
}

type Part = 'roots' | 'shoot';
const ASK_WORD: Record<Part, string> = { roots: 'longer roots', shoot: 'taller shoot' };

/** One bed with a window into the ground: the plant above, its roots below, a lid over the soil, and the buttons that work them. */
class CutBed {
  readonly root = new Container();
  readonly above = new Container();
  readonly under = new Container();
  readonly roots = new Graphics();
  readonly leafPic = new Graphics();
  readonly leafTop = new Graphics();
  readonly lid = new Graphics();
  readonly knob = new Container();
  readonly arrow = new Graphics();
  readonly up = drawRuler(-1);
  readonly down = drawRuler(1);
  bloom: Bloom;
  setup: Setup = { light: 'sun', water: 'more' };
  open = false;
  stage = 1;
  hitShoot!: Hit;
  hitSoil!: Hit;
  hitKnob!: Hit;

  constructor(
    private readonly tw: GameContext['tw'],
    color: ColorName,
    kind: FlowerKind,
    on: { shoot(): void; soil(): void; knob(): void },
  ) {
    const soil = new Graphics()
      .roundRect(-SOIL_W / 2 - 5, -4, SOIL_W + 10, SOIL_H + 9, 14)
      .fill(wood.line)
      .roundRect(-SOIL_W / 2, 0, SOIL_W, SOIL_H, 10)
      .fill(SOIL);
    for (const [x, y] of [
      [-60, 30],
      [50, 50],
      [-30, 110],
      [66, 118],
      [-70, 84],
      [20, 20],
    ])
      soil.circle(x, y, 4).fill(0x6e4526);
    const grass = new Graphics()
      .roundRect(-SOIL_W / 2 - 12, -10, SOIL_W + 24, 16, 8)
      .fill(swatch.green.fill)
      .stroke({ width: 3, color: swatch.green.line });
    this.lid
      .roundRect(-SOIL_W / 2, 0, SOIL_W, SOIL_H, 10)
      .fill(0xc99b66)
      .stroke({ width: 5, color: wood.line });
    for (const y of [SOIL_H / 3, (SOIL_H * 2) / 3])
      this.lid
        .moveTo(-SOIL_W / 2 + 8, y)
        .lineTo(SOIL_W / 2 - 8, y)
        .stroke({ width: 3, color: wood.line, alpha: 0.6 });
    this.lid
      .circle(0, SOIL_H / 2, 12)
      .fill(0xfff8ec)
      .stroke({ width: 3, color: wood.line });
    this.bloom = new Bloom(color, kind);
    this.bloom.setStage(1);
    this.leafTop
      .ellipse(0, -20, 54, 14)
      .fill(swatch.green.fill)
      .stroke({ width: 4, color: swatch.green.line });
    this.leafTop.moveTo(-50, -20).lineTo(50, -20).stroke({ width: 3, color: swatch.green.line });
    this.leafTop.visible = false;
    this.under.addChild(this.roots, this.leafPic);
    this.above.addChild(this.up.c, this.bloom, this.leafTop);
    this.root.addChild(this.above, soil, this.under, this.down.c, this.lid, grass, this.knob);

    this.knob.addChild(
      new Graphics()
        .roundRect(-KNOB_W / 2, -KNOB_H / 2, KNOB_W, KNOB_H, 26)
        .fill(0xfff8ec)
        .stroke({ width: 5, color: wood.line }),
      this.arrow,
    );
    this.knob.position.set(0, KNOB_Y);
    this.paintArrow();
    this.hitShoot = makeHit(
      this.root,
      new Rectangle(-125, -(STEP * RULER + 110), 250, STEP * RULER + 110),
      on.shoot,
      250,
    );
    this.hitSoil = makeHit(this.root, new Rectangle(-SOIL_W / 2, 0, SOIL_W, SOIL_H), on.soil, 250);
    this.hitKnob = makeHit(this.knob, new Rectangle(-KNOB_W / 2, -KNOB_H / 2, KNOB_W, KNOB_H), on.knob, 300);
  }

  private paintArrow() {
    // A lid still down shows an arrow to lift it; a lifted one shows the way back down.
    const d = this.open ? 1 : -1;
    this.arrow
      .clear()
      .poly([-26, -d * 14, 26, -d * 14, 0, d * 18])
      .fill(ink);
  }

  /** Slides the lid up (open) or back down, in a third of a second. */
  async setOpen(open: boolean) {
    this.open = open;
    this.paintArrow();
    if (open) {
      await this.tw.to(this.lid.scale, { y: 0.02 }, { duration: 0.35, ease: ease.outQuad });
      this.lid.visible = false;
    } else {
      this.lid.visible = true;
      await this.tw.to(this.lid.scale, { y: 1 }, { duration: 0.3, ease: ease.outQuad });
    }
  }

  /** Back to a closed bed at once, for a new round. */
  reset(color: ColorName, kind: FlowerKind) {
    this.open = false;
    this.paintArrow();
    this.lid.visible = true;
    this.lid.scale.y = 1;
    this.above.removeChild(this.bloom);
    this.bloom.destroy({ children: true });
    this.bloom = new Bloom(color, kind);
    this.bloom.setStage(1);
    this.above.addChild(this.bloom);
    this.stage = 1;
    this.setRoots(GROWN[0], 3);
    this.up.c.visible = false;
    this.down.c.visible = false;
    this.up.flag.visible = false;
    this.down.flag.visible = false;
    this.leafTop.visible = false;
    this.leafPic.clear();
    this.roots.visible = true;
    this.bloom.visible = true;
  }

  /** Roots `fraction` of the way to `steps` ruler steps deep. */
  setRoots(fraction: number, steps: number) {
    drawRoots(this.roots, Math.max(0.5, fraction * steps));
  }

  /** Shows the ruler flags at `steps` once the plant has grown. */
  setFlags(steps: number) {
    this.up.flag.y = -STEP * steps;
    this.down.flag.y = STEP * steps;
    this.up.c.visible = true;
    this.up.flag.visible = true;
    this.down.c.visible = this.open;
    this.down.flag.visible = this.open;
  }

  /** Both rulers on a grown plant: the one below only shows while its lid is up. */
  syncRulers(grown: boolean) {
    this.up.c.visible = grown;
    this.up.flag.visible = grown;
    this.down.c.visible = grown && this.open;
    this.down.flag.visible = grown && this.open;
  }

  /** Level 14's leaf window: the leaf lies on the ground and its picture sits under the lid. */
  showLeaf(step: number) {
    this.bloom.visible = false;
    this.roots.visible = false;
    this.leafTop.visible = true;
    this.leafPic.clear();
    this.leafPic.removeChildren().forEach((c) => c.destroy({ children: true }));
    const holder = drawLeafStep(this.leafPic, step);
    this.leafPic.addChild(holder);
  }
}

type Phase = 'pre' | 'which';

/**
 * Garden Grow levels 14–15 (docs/definitions/under-the-soil.md). Level 14 lifts the lid on one bed to see the roots below the
 * shoot, grows both with rain, then lifts a second lid under a leaf to watch it crumble in three pictures: nothing is judged.
 * Level 15 puts Growing Conditions' matched beds under that window: lift both, grow, read the ruler above and below, and tap the
 * bed with the longer roots or the taller shoot. The plants are all healthy and the numbers are a toy table.
 */
export class UnderGarden implements Game {
  private readonly plan: GardenPlan;
  private readonly look: boolean;
  private readonly backdrop: Backdrop;
  private readonly glow = new Graphics();
  private readonly packet = new Container();
  private readonly badge = new Container();
  private readonly token = new Container();
  private readonly cardRows: Container[] = [];
  private readonly beds: CutBed[] = [];
  private view: View;
  private round = -1;
  private rounds: { r15?: Round15; kind: FlowerKind; color: ColorName }[] = [];
  private lastKind: FlowerKind | undefined;
  private last: UnderAvoid | undefined;
  private clock = 0;
  private busy = true;
  private finished = false;
  private phase: Phase = 'pre';
  private misses = 0;
  private hints = 0;
  private wrongs = 0;
  private hintOn = false;
  private grown = false;
  private scale = 1;
  /** Level 14: whether this round's window has been lifted, the plant has grown, and which leaf pictures were seen. */
  private lifted = false;
  private grew = 0;
  private leaf = 0;
  private seen = new Set<number>();
  private spoke = false;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.look = this.plan.mode === 'look';
    this.backdrop = new Backdrop(
      {
        sky: [0x8fd3f7, 0xe9f7ff],
        hills: [0xc8ecb0, 0x9edb86],
        horizon: 0.5,
        clouds: 1,
        sun: true,
        seed: 43,
      },
      ctx.view,
    );
    this.glow.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.packet, this.badge);
    const count = this.look ? 1 : 2;
    for (let i = 0; i < count; i++) this.makeBed(i);
    this.buildToken();
    ctx.stage.addChild(this.token, this.glow);
    this.rounds = this.makeRounds();
  }

  private makeRounds() {
    const out: UnderGarden['rounds'] = [];
    for (let i = 0; i < this.plan.requests; i++) {
      if (this.look) {
        out.push({ kind: 'blossom', color: 'red' });
        continue;
      }
      const r = makeUnder(this.ctx.rng, this.last, this.lastKind);
      this.last = { changed: r.changed, taller: r.taller, ask: r.ask };
      this.lastKind = r.kind;
      out.push({ r15: r, kind: r.kind, color: r.color });
    }
    return out;
  }

  private makeBed(i: number) {
    const bed: CutBed = new CutBed(this.ctx.tw, 'red', 'blossom', {
      shoot: () => void this.tapShoot(i),
      soil: () => void this.tapSoil(i),
      knob: () => void this.tapKnob(i),
    });
    this.beds.push(bed);
    this.ctx.stage.addChild(bed.root);
    if (!this.look) {
      const row = new Container();
      this.cardRows.push(row);
      this.ctx.stage.addChild(row);
    }
  }

  private buildToken() {
    const cloud = puffs(
      new Graphics(),
      [
        [-34, 14, 30],
        [0, 0, 40],
        [38, 14, 30],
      ],
      0xffffff,
      0xc9d6e6,
      5,
    );
    if (!this.look)
      this.token.addChild(
        new Graphics()
          .circle(-34, -34, 24)
          .fill(swatch.yellow.fill)
          .stroke({ width: 4, color: swatch.yellow.line }),
      );
    this.token.addChild(cloud);
    this.token.hitArea = new Rectangle(-80, -70, 160, 130);
    onTap(this.token, () => void this.tapToken(), { cooldown: 500 });
  }

  start() {
    void this.begin();
  }

  private get cur() {
    return this.rounds[this.round];
  }

  private async begin() {
    this.round++;
    if (this.round >= this.rounds.length) return void this.finale();
    const r = this.cur;
    this.busy = true;
    this.wrongs = 0;
    this.hintOn = false;
    this.grown = false;
    this.lifted = false;
    this.grew = 0;
    this.leaf = 0;
    this.seen.clear();
    this.spoke = false;
    this.phase = 'pre';
    this.beds.forEach((b, i) => {
      b.reset(r.color, r.kind);
      if (this.look) {
        if (this.round === 1) b.showLeaf(0);
        else {
          // The first window opens on a plant that already shows both its parts: leaves above, roots below.
          b.stage = 3;
          b.bloom.setStage(3);
          b.setRoots(GROWN[2], 5);
        }
        return;
      }
      b.setup = i === 0 ? r.r15!.a : r.r15!.b;
      this.paintCards(i);
    });
    if (!this.look) this.paintBadge();
    this.packet.removeChildren().forEach((c) => c.destroy({ children: true }));
    if (!this.look) this.packet.addChild(drawPacket(r.kind, r.color));
    this.layout();
    this.busy = false;
    if (this.look) {
      return this.round === 0
        ? this.ctx.instruct('grow.soil.lift', { what: 'soil' })
        : this.ctx.instruct('grow.leaf.lift', { what: 'window' });
    }
    return this.ctx.instruct('grow.under.ask', { what: ASK_WORD[r.r15!.ask] });
  }

  private paintCards(i: number) {
    const row = this.cardRows[i];
    row.removeChildren().forEach((c) => c.destroy({ children: true }));
    CONDITIONS.forEach((c, k) => {
      const card = drawCard(new Graphics(), c, this.beds[i].setup);
      card.position.set((k - 0.5) * (CARD + CARD_GAP), 0);
      row.addChild(card);
    });
  }

  /** A "?" card over a little picture of the part to read: a root below the line, or a stem and flower above it. */
  private paintBadge() {
    this.badge.removeChildren().forEach((c) => c.destroy({ children: true }));
    const ask = this.cur.r15!.ask;
    const g = new Graphics()
      .roundRect(-CARD / 2, -CARD / 2, CARD, CARD, 20)
      .fill(0xfff8ec)
      .stroke({ width: 5, color: swatch.purple.line });
    if (ask === 'roots') {
      g.moveTo(-8, -30)
        .quadraticCurveTo(0, 0, -8, 34)
        .stroke({ width: 7, color: 0xb98a5a, cap: 'round' })
        .moveTo(-6, 0)
        .lineTo(-26, 20)
        .moveTo(-4, 14)
        .lineTo(14, 32)
        .stroke({ width: 5, color: 0xb98a5a, cap: 'round' });
    } else {
      g.moveTo(-8, 36)
        .lineTo(-8, -6)
        .stroke({ width: 7, color: swatch.green.line, cap: 'round' })
        .circle(-8, -18, 14)
        .fill(swatch.pink.fill)
        .stroke({ width: 3, color: swatch.pink.line });
    }
    const q = new Text({
      text: '?',
      style: { fontFamily: 'sans-serif', fontSize: 40, fontWeight: '800', fill: swatch.purple.line },
    });
    q.anchor.set(0.5);
    q.position.set(30, -26);
    this.badge.addChild(g, q);
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    this.layout();
  }

  private layout() {
    const { w, h } = this.view;
    const upright = this.view.upright;
    const tokenY = h - (upright ? 170 : 110);
    if (this.look) {
      const top = h * 0.1;
      const s = Math.min(1.5, (tokenY - 90 - top) / (STEP * RULER + 110 + KNOB_Y + KNOB_H / 2));
      this.scale = s;
      this.beds[0].root.scale.set(s);
      this.beds[0].root.position.set(w / 2, top + (STEP * RULER + 110) * s);
      this.token.position.set(w / 2, tokenY);
      return;
    }
    // Level 15: the packet and question across the top, two beds, their lift buttons and cards below, the token last.
    const top = 150;
    const bottom = upright ? tokenY - 80 : h - 60;
    const tall = STEP * RULER + 85 + KNOB_Y + KNOB_H / 2 + 12 + CARD;
    const s = Math.max(0.72, Math.min(1.3, (bottom - top) / tall));
    this.scale = s;
    const ground = top + (STEP * RULER + 85) * s;
    const xs = [w * 0.27, w * 0.73];
    this.beds.forEach((b, i) => {
      b.root.scale.set(s);
      b.root.position.set(xs[i], ground);
      this.cardRows[i].position.set(xs[i], ground + (KNOB_Y + KNOB_H / 2 + 12 + CARD / 2) * s);
      this.cardRows[i].scale.set(s);
    });
    this.packet.position.set(w / 2 - 80, 92);
    this.packet.scale.set(0.85);
    this.badge.position.set(w / 2 + 80, 96);
    this.token.position.set(w / 2, upright ? tokenY : ground - 40 * s);
  }

  update(dt: number) {
    this.clock += dt;
    for (const b of this.beds) b.bloom.step(dt);
    const g = this.glow.clear();
    if (this.busy || this.finished) return;
    const pulse = 6 + 2 * Math.sin(this.clock * 6);
    const ring = (x: number, y: number, w: number, h: number, color: number, width = pulse) =>
      g.roundRect(x - w / 2, y - h / 2, w, h, 24).stroke({ width, color });
    const knobRing = (i: number, color = swatch.yellow.fill) => {
      const b = this.beds[i];
      ring(
        b.root.x,
        b.root.y + KNOB_Y * this.scale,
        (KNOB_W + 14) * this.scale,
        (KNOB_H + 14) * this.scale,
        color,
      );
    };
    if (this.look) {
      if (!this.lifted) knobRing(0);
      else if (this.round === 0 && this.grew === 0)
        ring(this.token.x, this.token.y - 4, 190, 150, swatch.yellow.fill, pulse);
      return;
    }
    const r = this.cur.r15!;
    if (this.phase === 'pre') {
      const lifts = r.ask === 'roots' || this.beds.some((b) => b.open);
      if (r.ask === 'roots') this.beds.forEach((b, i) => !b.open && knobRing(i));
      else if (!lifts) this.beds.forEach((_, i) => knobRing(i));
      if (r.ask !== 'roots' || this.beds.every((b) => b.open))
        ring(this.token.x, this.token.y - 4, 190, 150, swatch.yellow.fill, pulse);
    }
    if (this.hintOn && this.phase === 'which') {
      const b = this.beds[answerUnder(r) === 'a' ? 0 : 1];
      ring(
        b.root.x,
        b.root.y - 90 * this.scale,
        250 * this.scale,
        (STEP * RULER + 100) * this.scale,
        swatch.yellow.fill,
        pulse,
      );
    }
  }

  // ---- Level 14 ----

  /** Wiggles a part so a tap on it shows. */
  private async wiggle(target: Container) {
    await this.ctx.tw.to(target, { rotation: 0.14 }, { duration: 0.1 });
    await this.ctx.tw.to(target, { rotation: -0.1 }, { duration: 0.12 });
    await this.ctx.tw.to(target, { rotation: 0 }, { duration: 0.1 });
  }

  private async tapKnob(i: number) {
    if (this.busy || this.finished) return;
    const b = this.beds[i];
    sfx.pop();
    if (this.look) {
      const opening = !b.open;
      void b.setOpen(opening);
      if (opening && !this.spoke) {
        this.spoke = true;
        this.lifted = true;
        if (this.round === 0) void this.ctx.say('grow.soil.parts', { what: 'Roots' });
        else return this.seeLeaf(0);
      }
      return;
    }
    void b.setOpen(!b.open);
    b.syncRulers(this.grown);
  }

  private async tapSoil(i: number) {
    if (this.busy || this.finished) return;
    const b = this.beds[i];
    if (!b.open) return this.tapKnob(i);
    if (this.look) {
      if (this.round === 0) {
        sfx.pop();
        void this.wiggle(b.roots);
        return void this.ctx.say('grow.soil.root', { part: 'Roots' });
      }
      return this.seeLeaf(nextLeafStep(this.leaf));
    }
    return this.answer(i);
  }

  private async tapShoot(i: number) {
    if (this.busy || this.finished) return;
    const b = this.beds[i];
    if (this.look) {
      if (this.round === 0) {
        sfx.pop();
        void this.wiggle(b.bloom);
        return void this.ctx.say('grow.soil.shoot', { part: 'shoot' });
      }
      // The leaf on the ground: it lifts the lid first and then changes with each tap.
      if (!b.open) return this.tapKnob(i);
      return this.seeLeaf(nextLeafStep(this.leaf));
    }
    return this.answer(i);
  }

  /** Shows the leaf's next picture and says it; the round ends when all three have been seen. */
  private async seeLeaf(step: number) {
    this.leaf = step;
    this.seen.add(step);
    sfx.pop();
    this.beds[0].showLeaf(step);
    const what = ['leaf', 'worm', 'richer'][step];
    await this.ctx.say(`grow.leaf.${step}` as 'grow.leaf.0', { what });
    await this.maybeFinishLook();
  }

  private async maybeFinishLook() {
    if (this.busy || this.finished) return;
    const done = this.round === 0 ? this.lifted && this.grew > 0 : this.seen.size === LEAF_STEPS.length;
    if (!done) return;
    this.busy = true;
    sfx.sparkle();
    this.ctx.pet.cheer();
    await this.ctx.tw.wait(0.8);
    await this.begin();
  }

  // ---- Both levels ----

  private async tapToken() {
    if (this.busy || this.finished) return;
    if (this.look) {
      if (this.round !== 0) return;
      return this.rain();
    }
    const r = this.cur.r15!;
    if (r.ask === 'roots' && !this.beds.every((b) => b.open))
      return void this.ctx.say('grow.under.lift', { what: 'roots' });
    return this.growBoth();
  }

  /** Level 14's rain: one stage more of shoot and roots together; after the last, the plant starts over from its leaves. */
  private async rain() {
    const b = this.beds[0];
    sfx.whoosh();
    const stage = b.stage >= 5 ? 3 : b.stage + 1;
    b.stage = stage;
    b.bloom.setStage(stage);
    b.setRoots(GROWN[stage - 1], 5);
    this.grew++;
    if (!this.lifted) void this.ctx.say('grow.soil.lift', { what: 'soil' });
    await this.maybeFinishLook();
  }

  /** Level 15: both beds grow five stages together, shoot and roots, then the rulers show their steps. */
  private async growBoth() {
    this.busy = true;
    this.grown = false;
    sfx.whoosh();
    for (const b of this.beds) {
      b.syncRulers(false);
      b.bloom.setReach(growthHeight(b.setup) / RULER);
      b.stage = 1;
      b.bloom.setStage(1);
      b.setRoots(GROWN[0], rootDepth(b.setup));
    }
    for (let stage = 2; stage <= 5; stage++) {
      await this.ctx.tw.wait(0.6);
      for (const b of this.beds) {
        b.stage = stage;
        b.bloom.setStage(stage);
        b.setRoots(GROWN[stage - 1], rootDepth(b.setup));
      }
    }
    await this.ctx.tw.wait(0.5);
    this.grown = true;
    for (const b of this.beds) b.setFlags(rootDepth(b.setup));
    if (this.phase === 'pre') {
      this.phase = 'which';
      this.wrongs = 0;
      this.hintOn = false;
      await this.ctx.say('grow.under.which', { n: 'two', what: ASK_WORD[this.cur.r15!.ask] });
    }
    this.busy = false;
  }

  private async miss(say: () => Promise<void>) {
    this.busy = true;
    this.misses++;
    this.wrongs++;
    sfx.boing();
    await say();
    if (this.wrongs >= 2 && !this.hintOn) {
      this.hints++;
      this.hintOn = true;
    }
    this.busy = false;
  }

  private async answer(i: number) {
    const r = this.cur.r15!;
    if (this.phase === 'pre') {
      // Guessing first is free: nothing is judged until the beds have grown and the rulers show.
      if (r.ask === 'roots' && !this.beds.every((b) => b.open))
        return void this.ctx.say('grow.under.lift', { what: 'roots' });
      return void this.ctx.say('grow.under.grow', { n: 'two' });
    }
    if (r.ask === 'roots' && !this.beds.every((b) => b.open))
      return void this.ctx.say('grow.under.lift', { what: 'roots' });
    if (i === (answerUnder(r) === 'a' ? 0 : 1)) {
      this.busy = true;
      sfx.sparkle();
      this.ctx.pet.cheer();
      await this.ctx.say('grow.under.result', {
        what: r.ask === 'roots' ? 'Longer roots' : 'Taller shoot',
        more: moreOf(r.changed),
      });
      await this.ctx.tw.wait(0.3);
      return void this.begin();
    }
    const a = rootDepth(this.beds[i].setup);
    const b = rootDepth(this.beds[1 - i].setup);
    return this.miss(() =>
      this.ctx.say('grow.under.count', { where: r.ask === 'roots' ? 'below' : 'above', a, b }),
    );
  }

  /** The ghost finger: level 14 lifts, taps the parts and the cloud, then the leaf; level 15 lifts both, grows, taps the winner. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.round < 0 || this.round >= this.rounds.length) return null;
    if (this.look) {
      const b = this.beds[0];
      if (!b.open) return { tap: b.hitKnob.spot };
      if (this.round === 0) {
        if (this.grew === 0) return { tap: { on: this.token } };
        return null;
      }
      return { tap: b.hitShoot.spot, pause: 0.8 };
    }
    const r = this.cur.r15!;
    if (this.phase === 'pre') {
      const need = this.beds.findIndex((b) => !b.open);
      if (r.ask === 'roots' && need >= 0) return { tap: this.beds[need].hitKnob.spot };
      return { tap: { on: this.token } };
    }
    return { tap: this.beds[answerUnder(r) === 'a' ? 0 : 1].hitShoot.spot };
  }

  destroy() {}

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    this.busy = true;
    sfx.tada();
    await this.ctx.say('grow.done');
    await this.ctx.tw.wait(0.4);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}
