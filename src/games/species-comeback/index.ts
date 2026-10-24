import { Container, Graphics, Rectangle } from 'pixi.js';
import { turtleArt } from '../../art/animals';
import { ink, swatch, wood, type Swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import type { LineId } from '../../content/voice-script';
import {
  NEEDS, byId, extend, hatch, helpFor, judge, makeRound, missing, ordered, planFor, sharedRelative, suits,
  type Feature, type Pair, type Round, type Site, type Turtle,
} from './logic';

/** Lantern Lake: levels 1–3 in this slice; level 4 (the keeper's two plans) is the next. */
const LEVELS: BandLevels = { grownup: { min: 1, max: 3 } };

export const SHELLS: readonly Swatch[] = [swatch.teal, swatch.green, swatch.brown, swatch.yellow, swatch.orange, swatch.blue];
const CARD = 0xfff8ea;
const WALL = 0xf3e6cf;
const LIT = 0xf5b400;
const NEST_W = 120;
const SITE_W = 260;
const SITE_H = 210;
const MIN_TOUCH = 64;

type Phase = 'busy' | 'pair' | 'site' | 'done';
type Step = 'pair' | 'site';

/** A turtle on the wall: a small turtle over its name tag. Its origin is its middle. */
class TurtleCard extends Container {
  readonly bg = new Graphics();
  private art: Graphics;
  private readonly tag;
  private readonly mark;
  size = 96;
  state: 'normal' | 'lifted' | 'faded' | 'lit' = 'normal';
  constructor(readonly turtle: Turtle) {
    super();
    this.art = turtleArt(50, SHELLS[turtle.tint % SHELLS.length]);
    this.tag = label(turtle.name, 18, ink);
    this.mark = label(turtle.sex === 'f' ? '♀' : '♂', 18, turtle.sex === 'f' ? swatch.pink.line : swatch.blue.line);
    for (const part of [this.bg, this.art, this.tag, this.mark]) part.eventMode = 'none';
    this.addChild(this.bg, this.art, this.tag, this.mark);
    this.draw();
  }
  setSize(s: number) { this.size = s; this.draw(); }
  set(state: TurtleCard['state']) { this.state = state; this.draw(); }
  draw() {
    const s = this.size, u = s / 96;
    this.bg.clear().roundRect(-s / 2, -s / 2, s, s, 14 * u).fill(CARD)
      .stroke({ width: this.state === 'lifted' || this.state === 'lit' ? 6 : 3, color: this.state === 'lit' ? LIT : this.state === 'lifted' ? swatch.green.line : wood.line });
    this.art.scale.set(u);
    this.art.position.set(0, -12 * u);
    this.tag.style.fontSize = Math.round(17 * u);
    this.tag.text = this.turtle.name;
    this.tag.position.set(-8 * u, s / 2 - 16 * u);
    this.mark.style.fontSize = Math.round(19 * u);
    this.mark.position.set(this.tag.x + this.tag.width / 2 + 10 * u, this.tag.y);
    this.alpha = this.state === 'faded' ? 0.6 : 1;
    this.hitArea = new Rectangle(-Math.max(s, MIN_TOUCH) / 2, -Math.max(s, MIN_TOUCH) / 2, Math.max(s, MIN_TOUCH), Math.max(s, MIN_TOUCH));
  }
}

function featureIcon(f: Feature, r: number, ghost = false): Graphics {
  const g = new Graphics();
  if (ghost) {
    g.circle(0, 0, r).stroke({ width: 3, color: 0xb9a98e, alpha: 0.8 });
    g.moveTo(-r * 0.5, -r * 0.5).lineTo(r * 0.5, r * 0.5).stroke({ width: 3, color: 0xb9a98e });
  } else {
    g.circle(0, 0, r).fill(0xffffff).stroke({ width: 3, color: wood.line });
  }
  const a = ghost ? 0.35 : 1;
  if (f === 'water') {
    g.moveTo(-r * 0.6, 0).quadraticCurveTo(-r * 0.3, -r * 0.3, 0, 0).quadraticCurveTo(r * 0.3, r * 0.3, r * 0.6, 0).stroke({ width: r * 0.16, color: swatch.blue.line, alpha: a, cap: 'round' });
    g.moveTo(-r * 0.6, r * 0.35).quadraticCurveTo(-r * 0.3, r * 0.05, 0, r * 0.35).quadraticCurveTo(r * 0.3, r * 0.65, r * 0.6, r * 0.35).stroke({ width: r * 0.12, color: swatch.blue.fill, alpha: a, cap: 'round' });
  } else if (f === 'logs') {
    g.roundRect(-r * 0.65, -r * 0.22, r * 1.3, r * 0.44, r * 0.2).fill({ color: wood.fill, alpha: a }).stroke({ width: 2, color: wood.line, alpha: a });
    g.ellipse(r * 0.6, 0, r * 0.12, r * 0.22).fill({ color: wood.light, alpha: a });
  } else if (f === 'sand') {
    g.moveTo(-r * 0.7, r * 0.35).quadraticCurveTo(0, -r * 0.6, r * 0.7, r * 0.35).closePath().fill({ color: swatch.yellow.fill, alpha: a }).stroke({ width: 2, color: swatch.yellow.line, alpha: a });
  } else if (f === 'plants') {
    for (const x of [-0.3, 0, 0.3]) g.moveTo(r * x, r * 0.5).quadraticCurveTo(r * (x - 0.2), 0, r * x, -r * 0.55).stroke({ width: r * 0.12, color: swatch.green.line, alpha: a, cap: 'round' });
    g.ellipse(r * 0.25, -r * 0.1, r * 0.2, r * 0.1).fill({ color: swatch.green.fill, alpha: a });
  }
  g.eventMode = 'none';
  return g;
}

/** A release site: a little painted scene with its needs' icons along the bottom (a missing one ghosted). */
class SiteCard extends Container {
  readonly icons = new Map<Feature, Graphics>();
  readonly frame = new Graphics();
  constructor(readonly site: Site, readonly w = SITE_W, readonly h = SITE_H) {
    super();
    const g = new Graphics();
    g.roundRect(-w / 2, -h / 2, w, h, 18).fill(0xdff0d6);
    g.rect(-w / 2 + 8, -h / 2 + 8, w - 16, 70).fill(0xd8ecfb);
    const has = (f: Feature) => site.features.includes(f);
    if (has('water')) g.ellipse(-10, 10, 90, 34).fill(swatch.blue.light).stroke({ width: 3, color: swatch.blue.fill });
    else g.moveTo(-w / 2 + 10, 0).quadraticCurveTo(0, 30, w / 2 - 10, 0).stroke({ width: 18, color: swatch.blue.fill }).moveTo(-60, 6).lineTo(-30, 10).moveTo(10, 12).lineTo(40, 8).stroke({ width: 3, color: 0xffffff });
    if (has('logs')) g.roundRect(30, -30, 80, 18, 8).fill(wood.fill).stroke({ width: 2, color: wood.line });
    if (has('sand')) g.moveTo(-130, 50).quadraticCurveTo(-90, 20, -50, 50).closePath().fill(swatch.yellow.fill);
    else g.roundRect(-128, 26, 70, 26, 6).fill(0xb7b2a8);
    if (has('plants')) for (const x of [-60, -40, 20, 46]) g.moveTo(x, 30).quadraticCurveTo(x - 6, 14, x, 0).stroke({ width: 4, color: swatch.green.line, cap: 'round' });
    if (!has('quiet')) g.rect(-w / 2 + 8, -h / 2 + 60, w - 16, 14).fill(0x9a9a9a).rect(-20, -h / 2 + 66, 26, 3).fill(0xffffff);
    g.eventMode = 'none';
    const name = label(site.name, 22, ink);
    name.position.set(0, -h / 2 + 30);
    name.eventMode = 'none';
    this.addChild(g, name, this.frame);
    const lack = new Set(missing(site));
    NEEDS.forEach((f, i) => {
      const icon = featureIcon(f, 20, lack.has(f));
      icon.position.set(-w / 2 + 50 + i * ((w - 100) / 3), h / 2 - 30);
      this.icons.set(f, icon);
      this.addChild(icon);
    });
    this.lit(false);
    this.hitArea = new Rectangle(-w / 2, -h / 2, w, h);
  }
  lit(on: boolean) {
    this.frame.clear().roundRect(-this.w / 2, -this.h / 2, this.w, this.h, 18).stroke({ width: on ? 7 : 4, color: on ? LIT : swatch.green.line });
  }
}

class SpeciesComeback implements Game {
  readonly round: Round;
  misses = 0;
  hints = 0;
  finished = false;
  phase: Phase = 'busy';
  /** Her nests so far, mother first. */
  plan: Pair[] = [];
  lifted: number | null = null;
  readonly cards = new Map<number, TurtleCard>();
  readonly nests: Container[] = [];
  readonly sites: SiteCard[] = [];
  readonly spring = new Container();
  /** Misses in the current step; the glow comes after two. */
  private stepMisses = 0;
  private readonly hinted: Record<Step, boolean> = { pair: false, site: false };
  private glowing: { cards: number[]; nests: number[]; sites: number[] } = { cards: [], nests: [], sites: [] };
  private readonly hatchRng: Rng;
  private hatchlings: Turtle[] = [];
  private readonly baseCount: number;

  private readonly wall = new Graphics();
  private readonly tree = new Container();
  private readonly lines = new Graphics();
  private readonly litLines = new Graphics();
  private readonly glow = new Graphics();
  private readonly nestLayer = new Container();
  private readonly springBg = new Graphics();
  private readonly springText = label('Spring', 30, ink);
  private readonly siteLayer = new Container();
  private readonly needs = new Container();
  private readonly needIcons = new Map<Feature, Graphics>();
  private readonly slots = new Map<number, { x: number; y: number }>();
  private view: View;
  private card = 96;
  private clock = 0;
  /** Spring has come: the nests are empty again and their parents are back in the tree. */
  private sprung = false;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.round = makeRound(ctx.level, ctx.rng);
    this.hatchRng = ctx.rng.clone();
    this.baseCount = this.round.tree.turtles.length;
    for (const part of [this.wall, this.lines, this.litLines, this.glow, this.springBg, this.springText]) part.eventMode = 'none';
    this.tree.addChild(this.lines, this.litLines, this.glow);
    for (const t of this.round.tree.turtles) this.addCard(t);
    for (let i = 0; i < this.round.target; i++) {
      const nest = new Container();
      nest.addChild(new Graphics());
      nest.hitArea = new Rectangle(-NEST_W / 2, -50, NEST_W, 100);
      onTap(nest, () => this.tapNest(i));
      this.nests.push(nest);
      this.nestLayer.addChild(nest);
    }
    this.spring.addChild(this.springBg, this.springText);
    this.spring.hitArea = new Rectangle(-75, -40, 150, 80);
    onTap(this.spring, () => this.tapSpring());
    this.nestLayer.addChild(this.spring);
    // The needs card: the four needs a site must have.
    const nb = new Graphics().roundRect(-150, -60, 300, 120, 16).fill(0xffffff).stroke({ width: 4, color: wood.line });
    nb.eventMode = 'none';
    this.needs.addChild(nb);
    NEEDS.forEach((f, i) => {
      const icon = featureIcon(f, 26);
      icon.position.set(-105 + i * 70, 0);
      this.needIcons.set(f, icon);
      this.needs.addChild(icon);
    });
    this.needs.hitArea = new Rectangle(-150, -60, 300, 120);
    onTap(this.needs, () => { if (this.phase === 'site') void ctx.say('comeback.needs'); });
    this.needs.visible = false;
    this.siteLayer.visible = false;
    ctx.stage.addChild(this.wall, this.tree, this.nestLayer, this.needs, this.siteLayer);
    this.layout();
  }

  private addCard(t: Turtle) {
    const c = new TurtleCard(t);
    onTap(c, () => this.tapTurtle(t.id));
    this.cards.set(t.id, c);
    this.tree.addChild(c);
    if (t.gen === 0 || this.round.tree.nested.some((p) => p.includes(t.id))) c.set('faded');
    return c;
  }

  get depth() { return this.round.plan.depth; }
  get target() { return this.round.target; }
  private isCandidate(id: number) {
    const t = byId(this.round.tree, id);
    return t.gen >= 1 && t.gen <= 2 && !this.round.tree.nested.some((p) => p.includes(id));
  }

  start() { void this.begin(); }

  private async begin() {
    this.phase = 'pair';
    await this.ctx.say('comeback.intro');
    this.instructPair();
  }

  private instructPair() {
    void this.ctx.instruct(this.depth === 2 ? 'comeback.instruct-pair-cousins' : 'comeback.instruct-pair', { n: this.target });
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Layout                                                                                        */
  /* -------------------------------------------------------------------------------------------- */

  resize(v: View) { this.view = v; this.layout(); }

  private layout() {
    const v = this.view, tree = this.round.tree;
    const portrait = v.h > v.w;
    const families: { founders: Turtle[]; kids: Turtle[] }[] = [];
    const founders = tree.turtles.filter((t) => t.gen === 0);
    for (let i = 0; i < founders.length; i += 2) {
      const mum = founders[i], dad = founders[i + 1];
      families.push({ founders: [mum, dad], kids: tree.turtles.filter((t) => t.gen === 1 && t.parents?.[0] === mum.id) });
    }
    const blocks = families.map((f) => Math.max(2, f.kids.length));
    let s = 96;
    const gap = 14, famGap = 30;
    const widthAt = (size: number) => blocks.reduce((a, b) => a + b * (size + gap), 0) + famGap * (blocks.length - 1);
    while (s > MIN_TOUCH && widthAt(s) > v.w - 40) s -= 4;
    this.card = s;
    const rowH = s + 38;
    const top = 112 + s / 2;
    let x = (v.w - widthAt(s)) / 2;
    this.slots.clear();
    families.forEach((f, i) => {
      const bw = blocks[i] * (s + gap), mid = x + bw / 2;
      f.founders.forEach((t, k) => this.slots.set(t.id, { x: mid + (k - 0.5) * (s + gap), y: top }));
      f.kids.forEach((t, k) => this.slots.set(t.id, { x: mid + (k - (f.kids.length - 1) / 2) * (s + gap), y: top + rowH }));
      x += bw + famGap;
    });
    for (const pair of tree.nested) {
      const third = tree.turtles.filter((t) => t.gen === 2 && t.parents?.[0] === pair[0] && t.parents?.[1] === pair[1]);
      const a = this.slots.get(pair[0])!, b = this.slots.get(pair[1])!;
      const mid = Math.min(Math.max((a.x + b.x) / 2, 40 + (third.length * (s + gap)) / 2), v.w - 40 - (third.length * (s + gap)) / 2);
      third.forEach((t, k) => this.slots.set(t.id, { x: mid + (k - (third.length - 1) / 2) * (s + gap), y: top + rowH * 2 }));
    }
    const hatchRow = tree.nested.length ? 3 : 2;
    const hs = Math.max(MIN_TOUCH, Math.round(s * 0.8));
    this.hatchlings.forEach((t, k) => this.slots.set(t.id, { x: v.w / 2 + (k - (this.hatchlings.length - 1) / 2) * (hs + 10), y: top + rowH * hatchRow - (s - hs) / 2 }));
    for (const [id, c] of this.cards) {
      c.setSize(byId(tree, id).gen === 3 ? hs : s);
      if (!this.inNest(id)) { const p = this.slots.get(id)!; c.position.set(p.x, p.y); }
    }
    // The nest row along the bottom, clear of the pet's corner, with Spring at its right end.
    const nestY = portrait ? top + rowH * (hatchRow + 1) + 20 : v.h - 86;
    const spacing = Math.min(170, (v.w - 220 - 200) / Math.max(1, this.nests.length - 1 || 1));
    this.nests.forEach((n, i) => { n.position.set(220 + i * spacing, nestY); this.drawNest(i); });
    this.spring.position.set(v.w - 110, nestY);
    if (!this.sprung) for (const [k, p] of this.plan.entries()) this.placeInNest(k, p, false);
    this.drawSpring();
    this.drawLines();
    this.wall.clear().roundRect(20, 92, v.w - 40, (portrait ? nestY - 60 : nestY - 70) - 92, 24).fill({ color: WALL, alpha: 0.8 });
    if (this.phase === 'site' || this.phase === 'done') this.layoutSites();
  }

  private layoutSites() {
    const v = this.view;
    this.wall.visible = false;
    this.nestLayer.visible = false;
    // The tree shrinks into the top band.
    const bounds = this.tree.getLocalBounds();
    const band = v.h * (v.h > v.w ? 0.26 : 0.24);
    const k = Math.min(1, band / Math.max(1, bounds.height), (v.w - 40) / Math.max(1, bounds.width));
    this.tree.scale.set(k);
    this.tree.position.set(v.w / 2 - (bounds.x + bounds.width / 2) * k, 96 - bounds.y * k);
    const needY = 96 + band + 72;
    this.needs.position.set(v.w / 2, needY);
    // Three across when they fit beside the pet's corner, else two over one.
    const w = SITE_W + 24, row = 3 * w - 24, wide = row <= v.w - 160 - 20;
    const cx = Math.max(v.w / 2, 160 + row / 2), y = needY + 60 + 24 + SITE_H / 2;
    this.sites.forEach((c, i) => {
      if (wide) c.position.set(cx + (i - 1) * w, y);
      else c.position.set(i < 2 ? v.w / 2 + (i - 0.5) * w : v.w / 2, y + (i < 2 ? 0 : SITE_H + 24));
    });
  }

  private drawNest(i: number) {
    const g = this.nests[i].children[0] as Graphics;
    const glowing = this.glowing.nests.includes(i);
    g.clear().ellipse(0, 18, NEST_W / 2, 26).fill(wood.fill).stroke({ width: glowing ? 7 : 4, color: glowing ? LIT : wood.line });
    g.ellipse(0, 12, NEST_W / 2 - 14, 14).fill(wood.light);
    for (let k = -2; k <= 2; k++) g.moveTo(-NEST_W / 2 + 10, 18 + k * 4).quadraticCurveTo(0, 30 + k * 3, NEST_W / 2 - 10, 18 + k * 4).stroke({ width: 2, color: wood.line, alpha: 0.5 });
  }

  private drawSpring() {
    const ready = this.plan.length >= this.target && this.phase === 'pair';
    this.springBg.clear().roundRect(-75, -40, 150, 80, 22).fill(ready ? swatch.green.fill : 0xe4ddd0).stroke({ width: ready ? 6 : 4, color: ready ? swatch.green.line : 0xb9ae9c });
    this.springText.style.fill = ready ? ink : 0x8a8172;
    this.spring.alpha = ready ? 1 : 0.85;
  }

  /** The family lines: a link between each pair of parents, and a line down to each of their young. */
  private drawLines() {
    const g = this.lines.clear(), tree = this.round.tree, s = this.card;
    const pairs = new Map<string, Turtle[]>();
    for (const t of tree.turtles) if (t.parents) {
      const k = t.parents.join('-');
      pairs.set(k, [...(pairs.get(k) ?? []), t]);
    }
    for (const [k, kids] of pairs) {
      const [a, b] = k.split('-').map(Number);
      const pa = this.slots.get(a), pb = this.slots.get(b);
      if (!pa || !pb) continue;
      const mx = (pa.x + pb.x) / 2, my = Math.max(pa.y, pb.y) + s / 2 + 10;
      g.moveTo(pa.x, pa.y + s / 2).lineTo(pa.x, my).lineTo(pb.x, my).lineTo(pb.x, pb.y + s / 2).stroke({ width: 3, color: wood.line, alpha: 0.6 });
      for (const kid of kids) {
        const pk = this.slots.get(kid.id);
        if (!pk) continue;
        const ks = this.cards.get(kid.id)?.size ?? s;
        g.moveTo(mx, my).lineTo(pk.x, pk.y - ks / 2).stroke({ width: 3, color: wood.line, alpha: 0.6 });
      }
    }
  }

  private nestSpot(nest: number, which: 0 | 1) {
    const n = this.nests[nest];
    return { x: n.x + (which === 0 ? -30 : 30), y: n.y - 8 };
  }

  private inNest(id: number) { return !this.sprung && this.plan.some((p) => p.includes(id)); }

  private placeInNest(nest: number, pair: Pair, animate: boolean) {
    pair.forEach((id, k) => {
      const c = this.cards.get(id)!, to = this.nestSpot(nest, k as 0 | 1);
      const scale = 60 / this.card;
      c.set('normal');
      if (animate) {
        void this.ctx.tw.to(c.position, to, { duration: 0.35, ease: ease.outCubic });
        void this.ctx.tw.to(c.scale, { x: scale, y: scale }, { duration: 0.35 });
      } else { c.position.set(to.x, to.y); c.scale.set(scale); }
    });
  }

  private returnToSlot(id: number) {
    const c = this.cards.get(id)!, p = this.slots.get(id)!;
    c.set('normal');
    void this.ctx.tw.to(c.position, p, { duration: 0.3, ease: ease.outCubic });
    void this.ctx.tw.to(c.scale, { x: 1, y: 1 }, { duration: 0.3 });
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Pairing                                                                                       */
  /* -------------------------------------------------------------------------------------------- */

  tapTurtle(id: number) {
    if (this.phase !== 'pair') return;
    const t = byId(this.round.tree, id);
    if (!this.isCandidate(id)) {
      // A founder or a turtle who nested before: hearing its name is free.
      void this.ctx.say('comeback.name', { who: t.name });
      return;
    }
    if (this.inNest(id)) return void this.tapNest(this.plan.findIndex((p) => p.includes(id)));
    if (this.lifted === null) return this.lift(id);
    if (this.lifted === id) { this.putDown(); return; }
    const a = this.lifted;
    const verdict = judge(this.round.tree, this.plan, a, id, this.depth);
    if (verdict === 'ok') return this.nestPair(a, id);
    this.forbidden(a, id, verdict === 'same-sex');
  }

  private lift(id: number) {
    this.lifted = id;
    const c = this.cards.get(id)!;
    c.set('lifted');
    this.tree.addChild(c);
    void this.ctx.tw.to(c.scale, { x: 1.08, y: 1.08 }, { duration: 0.12 });
    sfx.tick();
  }

  private putDown() {
    if (this.lifted === null) return;
    const c = this.cards.get(this.lifted)!;
    c.set('normal');
    void this.ctx.tw.to(c.scale, { x: 1, y: 1 }, { duration: 0.12 });
    this.lifted = null;
  }

  private nestPair(a: number, b: number) {
    const pair = ordered(this.round.tree, a, b);
    this.lifted = null;
    this.plan.push(pair);
    this.clearGlow();
    this.placeInNest(this.plan.length - 1, pair, true);
    sfx.brush();
    this.drawSpring();
    if (this.plan.length >= this.target) void this.ctx.instruct('comeback.spring');
  }

  private forbidden(a: number, b: number, sameSex: boolean) {
    const tree = this.round.tree;
    this.lifted = null;
    this.miss();
    sfx.boing();
    const nest = this.nests[Math.min(this.plan.length, this.nests.length - 1)];
    void this.ctx.tw.to(nest, { y: nest.y - 14 }, { duration: 0.12 }).then(() => this.ctx.tw.to(nest, { y: nest.y + 14 }, { duration: 0.2, ease: ease.outBack }));
    for (const id of [a, b]) this.cards.get(id)!.set('lit');
    if (sameSex) void this.ctx.say('comeback.same-sex');
    else {
      const rel = sharedRelative(tree, a, b);
      if (rel) {
        this.lightPath(rel.id, [a, b]);
        void this.ctx.say('comeback.kin', { who: byId(tree, rel.id).name, a: byId(tree, a).name, ra: rel.toA, b: byId(tree, b).name, rb: rel.toB });
      }
    }
    void this.ctx.tw.wait(2).then(() => {
      if (this.finished) return;
      this.litLines.clear();
      for (const [id, c] of this.cards) if (c.state === 'lit') c.set(this.isCandidate(id) ? 'normal' : 'faded');
      for (const id of [a, b]) if (this.lifted !== id) this.cards.get(id)!.scale.set(1);
      this.drawGlow();
    });
    this.afterMiss('pair');
  }

  /** Light the shared relative and the lines from it down to both turtles. */
  private lightPath(rel: number, ends: number[]) {
    const g = this.litLines.clear(), tree = this.round.tree;
    this.cards.get(rel)?.set('lit');
    for (const end of ends) {
      let at = end;
      while (at !== rel) {
        const parents = byId(tree, at).parents;
        if (!parents) break;
        const up = parents.find((p) => p === rel) ?? parents.find((p) => [...(byId(tree, p).parents ?? [])].includes(rel));
        if (up === undefined) break;
        const from = this.slots.get(at)!, to = this.slots.get(up)!;
        g.moveTo(from.x, from.y).lineTo(to.x, to.y).stroke({ width: 6, color: LIT, alpha: 0.8 });
        if (up !== rel) this.cards.get(up)?.set('lit');
        at = up;
      }
    }
  }

  tapNest(i: number) {
    if (this.phase !== 'pair' || i < 0 || i >= this.plan.length) return;
    // Undo: both turtles go back to the tree. Never a miss.
    const [pair] = this.plan.splice(i, 1);
    this.putDown();
    for (const id of pair) this.returnToSlot(id);
    this.plan.forEach((p, k) => this.placeInNest(k, p, true));
    this.clearGlow();
    this.drawSpring();
    sfx.whoosh();
    void this.ctx.say('comeback.undo');
  }

  tapSpring() {
    if (this.phase !== 'pair') return;
    if (this.plan.length < this.target) { void this.ctx.instruct('comeback.more-pairs', { n: this.target - this.plan.length }); return; }
    void this.doSpring();
  }

  private async doSpring() {
    this.phase = 'busy';
    this.putDown();
    this.clearGlow();
    this.drawSpring();
    for (const n of this.nests) void this.ctx.tw.to(n, { rotation: 0.06 }, { duration: 0.12 }).then(() => this.ctx.tw.to(n, { rotation: 0 }, { duration: 0.25, ease: ease.outElastic }));
    this.hatchlings = hatch(this.round.tree, this.plan, this.hatchRng);
    this.sprung = true;
    // The parents go back to the tree, faded: they have nested.
    for (const pair of this.plan) for (const id of pair) this.returnToSlot(id);
    for (const [k, t] of this.hatchlings.entries()) {
      const c = this.addCard(t);
      const nest = this.nests[Math.floor(k / 2)];
      c.position.set(nest.x, nest.y);
      c.scale.set(0.2);
    }
    this.layoutHatchlingsOnly();
    let k = 0;
    for (const t of this.hatchlings) {
      const c = this.cards.get(t.id)!, p = this.slots.get(t.id)!;
      void this.ctx.tw.to(c.position, p, { duration: 0.5, delay: 0.15 * k, ease: ease.outCubic });
      void this.ctx.tw.to(c.scale, { x: 1, y: 1 }, { duration: 0.5, delay: 0.15 * k });
      void this.ctx.tw.wait(0.15 * k + 0.3).then(() => { if (!this.finished) { sfx.marimba(4, 0.3); void this.ctx.tw.wait(0.12).then(() => sfx.marimba(6, 0.3)); } });
      k++;
    }
    await this.ctx.tw.wait(0.15 * k + 0.6);
    for (const pair of this.plan) for (const id of pair) this.cards.get(id)?.set('faded');
    this.drawLines();
    await this.ctx.say('comeback.hatched');
    if (this.round.plan.site) return this.startSites();
    return this.finishRound();
  }

  /** Slots for new hatchlings without moving anyone mid-tween. */
  private layoutHatchlingsOnly() {
    const saved = new Map([...this.cards].filter(([id]) => this.plan.some((p) => p.includes(id))).map(([id, c]) => [id, { x: c.x, y: c.y, s: c.scale.x }]));
    this.layout();
    for (const t of this.hatchlings) { const c = this.cards.get(t.id)!; const n = this.nests[Math.floor(this.hatchlings.indexOf(t) / 2)]; c.position.set(n.x, n.y); c.scale.set(0.2); }
    for (const [id, p] of saved) { const c = this.cards.get(id)!; c.position.set(p.x, p.y); c.scale.set(p.s); }
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Level 3: the release site                                                                     */
  /* -------------------------------------------------------------------------------------------- */

  private startSites() {
    this.stepMisses = 0;
    for (const site of this.round.sites) {
      const c = new SiteCard(site);
      onTap(c, () => this.tapSite(c));
      this.sites.push(c);
      this.siteLayer.addChild(c);
    }
    this.needs.visible = true;
    this.siteLayer.visible = true;
    this.phase = 'site';
    this.layoutSites();
    void this.ctx.instruct('comeback.needs');
  }

  tapSite(c: SiteCard) {
    if (this.phase !== 'site') return;
    if (suits(c.site)) return void this.release(c);
    this.miss();
    sfx.boing();
    const need = missing(c.site)[0];
    for (const icon of [this.needIcons.get(need)!, c.icons.get(need)!]) {
      const x = icon.x;
      void this.ctx.tw.to(icon, { x: x + 8 }, { duration: 0.06 }).then(() => this.ctx.tw.to(icon, { x: x - 8 }, { duration: 0.1 })).then(() => this.ctx.tw.to(icon, { x }, { duration: 0.08 }));
    }
    void this.ctx.say(`comeback.missing-${need}` as LineId);
    this.afterMiss('site');
  }

  private async release(c: SiteCard) {
    this.phase = 'busy';
    this.clearGlow();
    c.lit(true);
    sfx.sparkle();
    void this.ctx.say('comeback.site-ok');
    // The hatchlings walk to their new home in a line.
    const walkers: Graphics[] = [];
    for (const [k, t] of this.hatchlings.entries()) {
      const card = this.cards.get(t.id)!;
      const from = this.ctx.stage.toLocal(card.getGlobalPosition());
      const w = turtleArt(34, SHELLS[t.tint % SHELLS.length]);
      w.position.set(from.x, from.y);
      this.ctx.stage.addChild(w);
      walkers.push(w);
      card.alpha = 0.3;
      void this.ctx.tw.to(w.position, { x: c.x - 90 + (k % 3) * 60, y: c.y + 6 + Math.floor(k / 3) * 34 }, { duration: 1.1, delay: 0.12 * k, ease: ease.inOutSine });
    }
    await this.ctx.tw.wait(1.3 + 0.12 * walkers.length);
    return this.finishRound();
  }

  private async finishRound() {
    this.phase = 'done';
    sfx.tada();
    await this.ctx.say('comeback.done');
    if (this.finished) return;
    this.finished = true;
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Help                                                                                          */
  /* -------------------------------------------------------------------------------------------- */

  private miss() { this.misses++; this.stepMisses++; }

  private afterMiss(step: Step) {
    if (this.stepMisses >= 2) this.showHelp(step, true);
  }

  private currentStep(): Step | null { return this.phase === 'pair' ? 'pair' : this.phase === 'site' ? 'site' : null; }

  /** The glow for this step; counted as a hint once per step. */
  private showHelp(step: Step, speak: boolean) {
    if (!this.hinted[step]) { this.hinted[step] = true; this.hints++; }
    this.glowing = { cards: [], nests: [], sites: [] };
    if (step === 'pair') {
      const help = helpFor(this.round.tree, this.plan, this.depth, this.target);
      if (help.kind === 'pair') this.glowing.cards = [...help.pair];
      else if (help.kind === 'undo') this.glowing.nests = [help.nest];
      if (speak) {
        if (help.kind === 'pair') void this.ctx.say('comeback.hint-pair');
        else if (help.kind === 'undo') void this.ctx.say('comeback.hint-undo');
        else void this.ctx.instruct('comeback.spring');
      }
    } else {
      this.glowing.sites = this.sites.map((c, i) => (suits(c.site) ? i : -1)).filter((i) => i >= 0);
      if (speak) void this.ctx.say('comeback.hint-site');
    }
    this.nests.forEach((_, i) => this.drawNest(i));
    this.sites.forEach((c, i) => c.lit(this.glowing.sites.includes(i)));
    this.drawGlow();
  }

  private clearGlow() {
    this.glowing = { cards: [], nests: [], sites: [] };
    this.glow.clear();
    this.nests.forEach((_, i) => this.drawNest(i));
    this.sites.forEach((c) => c.lit(false));
  }

  private drawGlow() {
    const g = this.glow.clear();
    for (const id of this.glowing.cards) {
      const c = this.cards.get(id);
      if (!c || this.inNest(id)) continue;
      const r = c.size / 2 + 10;
      g.roundRect(c.x - r, c.y - r, r * 2, r * 2, 20).fill({ color: LIT, alpha: 0.35 + 0.15 * Math.sin(this.clock * 5) });
    }
  }

  askForHint() {
    const step = this.currentStep();
    if (!step) return;
    if (this.hinted[step] && (this.glowing.cards.length || this.glowing.nests.length || this.glowing.sites.length)) {
      if (step === 'pair') this.instructPair(); else void this.ctx.instruct('comeback.needs');
      return;
    }
    this.showHelp(step, true);
  }

  restart() {
    if (this.phase !== 'pair' && this.phase !== 'site') return;
    // The same seeded round from the start; misses and hints made so far keep counting.
    this.putDown();
    this.clearGlow();
    for (const t of this.hatchlings) { const c = this.cards.get(t.id); if (c) { c.destroy({ children: true }); this.cards.delete(t.id); } }
    this.round.tree.turtles.length = this.baseCount;
    this.hatchlings = [];
    for (const c of this.sites) c.destroy({ children: true });
    this.sites.length = 0;
    this.needs.visible = false;
    this.siteLayer.visible = false;
    this.wall.visible = true;
    this.nestLayer.visible = true;
    this.tree.scale.set(1);
    this.tree.position.set(0, 0);
    const back = this.plan.flat();
    this.plan = [];
    this.sprung = false;
    for (const id of back) this.returnToSlot(id);
    this.stepMisses = 0;
    this.phase = 'pair';
    this.layout();
    for (const [id, c] of this.cards) c.set(this.isCandidate(id) ? 'normal' : 'faded');
    this.instructPair();
  }

  update(dt: number) {
    this.clock += dt;
    if (this.glowing.cards.length) this.drawGlow();
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Ghost finger                                                                                  */
  /* -------------------------------------------------------------------------------------------- */

  autotouch(): TouchIntent | null {
    const tree = this.round.tree, depth = this.depth;
    if (this.phase === 'pair') {
      if (this.plan.length >= this.target) return { tap: { on: this.spring } };
      const full = extend(tree, this.plan, depth, this.target);
      if (!full) {
        const help = helpFor(tree, this.plan, depth, this.target);
        return help.kind === 'undo' ? { tap: { on: this.nests[help.nest] } } : null;
      }
      const next = full[this.plan.length];
      if (this.lifted === null) return { tap: { on: this.cards.get(next[0])! }, pause: 0.3 };
      if (this.lifted === next[0]) return { tap: { on: this.cards.get(next[1])! } };
      return { tap: { on: this.cards.get(this.lifted)! } };
    }
    if (this.phase === 'site') {
      const good = this.sites.find((c) => suits(c.site));
      return good ? { tap: { on: good } } : null;
    }
    return null;
  }

  destroy() { this.finished = true; }
}

/* ---------------------------------------------------------------------------------------------- */
/* The game's picture                                                                              */
/* ---------------------------------------------------------------------------------------------- */

/** A nest with two small turtles and a sprig. */
class ComebackIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const g = new Graphics();
    g.ellipse(0, -40, 90, 34).fill(wood.fill).stroke({ width: 5, color: wood.line });
    g.ellipse(0, -50, 72, 18).fill(wood.light);
    g.moveTo(70, -60).quadraticCurveTo(90, -110, 80, -150).stroke({ width: 6, color: swatch.green.line, cap: 'round' });
    g.ellipse(92, -118, 16, 8).ellipse(70, -96, 16, 8).fill(swatch.green.fill);
    c.addChild(g);
    const a = turtleArt(70), b = turtleArt(60, swatch.brown);
    a.position.set(-30, -78);
    b.position.set(30, -74);
    b.rotation = 0.3;
    c.addChild(a, b);
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  c.addChild(new Graphics().circle(0, 0, 78).fill(swatch.blue.light).stroke({ width: 6, color: swatch.teal.line }));
  const g = new Graphics();
  g.roundRect(-58, 18, 116, 28, 12).fill(wood.fill).stroke({ width: 4, color: wood.line });
  g.ellipse(52, 32, 6, 12).fill(wood.light);
  c.addChild(g);
  const t = turtleArt(70, SHELLS[rng.int(0, SHELLS.length - 1)]);
  t.position.set(rng.int(-20, 20), -8);
  t.rotation = rng.range(-0.4, 0.4);
  c.addChild(t);
  return c;
}

export const speciesComeback: GameModule = {
  id: 'species-comeback',
  name: 'Species Comeback',
  titleLine: 'game.species-comeback',
  region: 'barnyard',
  skills: ['animals', 'logic', 'planning', 'reasoning'],
  bands: ['grownup'],
  inputs: ['touch'],
  touchDemo: true,
  coplayHint: 'One of you reads the family tree aloud ("who are Lichen\'s grandparents?") while the other pairs the turtles; then swap.',
  offScreen: 'Draw your own family\'s tree and find your cousins on it.',
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  hubIcon: () => new ComebackIcon(),
  sticker,
  create: (ctx) => new SpeciesComeback(ctx),
};
