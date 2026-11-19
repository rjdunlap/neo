import { Container, Graphics, Rectangle, type FederatedPointerEvent, type Text } from 'pixi.js';
import { turtleArt } from '../../art/animals';
import { ink, swatch, wood, type Swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap, palmOnGlass } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import type { LineId } from '../../content/voice-script';
import {
  LEVELS,
  NEEDS,
  REASONS,
  REASON_FITS,
  byId,
  extend,
  hatch,
  helpFor,
  judge,
  kin,
  makeRound,
  missing,
  ordered,
  planFor,
  relatedPairs,
  sharedRelative,
  suits,
  type Feature,
  type Pair,
  type PlanChoice,
  type ReasonId,
  type Round,
  type Site,
  type Tree,
  type Turtle,
} from './logic';

export const SHELLS: readonly Swatch[] = [
  swatch.teal,
  swatch.green,
  swatch.brown,
  swatch.yellow,
  swatch.orange,
  swatch.blue,
];
const CARD = 0xfff8ea;
const WALL = 0xf3e6cf;
const LIT = 0xf5b400;
const NEST_W = 120;
const SITE_W = 260;
const SITE_H = 210;
const MIN_TOUCH = 64;
const UPRIGHT_CARD = 88;
const SLIDE_SLOP = 12;

/** Level 4 runs plan, reason, ready (the keeper's plan is in the nests; only Spring is left), then the site. */
type Phase = 'busy' | 'pair' | 'plan' | 'reason' | 'ready' | 'site' | 'done';
type Step = 'pair' | 'site' | 'plan' | 'reason';
type Rect = { x: number; y: number; w: number; h: number };
const REASON_TEXT: Record<ReasonId, string> = {
  more: 'It has more pairs',
  apart: 'Its pairs are less closely related',
  every: 'It uses every turtle',
};
const RELATED = swatch.orange.line;

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
    this.mark = label(
      turtle.sex === 'f' ? '♀' : '♂',
      18,
      turtle.sex === 'f' ? swatch.pink.line : swatch.blue.line,
    );
    for (const part of [this.bg, this.art, this.tag, this.mark]) part.eventMode = 'none';
    this.addChild(this.bg, this.art, this.tag, this.mark);
    this.draw();
  }
  setSize(s: number) {
    this.size = s;
    this.draw();
  }
  set(state: TurtleCard['state']) {
    this.state = state;
    this.draw();
  }
  draw() {
    const s = this.size,
      u = s / 96;
    this.bg
      .clear()
      .roundRect(-s / 2, -s / 2, s, s, 14 * u)
      .fill(CARD)
      .stroke({
        width: this.state === 'lifted' || this.state === 'lit' ? 6 : 3,
        color: this.state === 'lit' ? LIT : this.state === 'lifted' ? swatch.green.line : wood.line,
      });
    this.art.scale.set(u);
    this.art.position.set(0, -12 * u);
    this.tag.style.fontSize = Math.round(17 * u);
    this.tag.text = this.turtle.name;
    this.tag.position.set(-8 * u, s / 2 - 16 * u);
    this.mark.style.fontSize = Math.round(19 * u);
    this.mark.position.set(this.tag.x + this.tag.width / 2 + 10 * u, this.tag.y);
    this.alpha = this.state === 'faded' ? 0.6 : 1;
    this.hitArea = new Rectangle(
      -Math.max(s, MIN_TOUCH) / 2,
      -Math.max(s, MIN_TOUCH) / 2,
      Math.max(s, MIN_TOUCH),
      Math.max(s, MIN_TOUCH),
    );
  }
}

function featureIcon(f: Feature, r: number, ghost = false): Graphics {
  const g = new Graphics();
  if (ghost) {
    g.circle(0, 0, r).stroke({ width: 3, color: 0xb9a98e, alpha: 0.8 });
    g.moveTo(-r * 0.5, -r * 0.5)
      .lineTo(r * 0.5, r * 0.5)
      .stroke({ width: 3, color: 0xb9a98e });
  } else {
    g.circle(0, 0, r).fill(0xffffff).stroke({ width: 3, color: wood.line });
  }
  const a = ghost ? 0.35 : 1;
  if (f === 'water') {
    g.moveTo(-r * 0.6, 0)
      .quadraticCurveTo(-r * 0.3, -r * 0.3, 0, 0)
      .quadraticCurveTo(r * 0.3, r * 0.3, r * 0.6, 0)
      .stroke({ width: r * 0.16, color: swatch.blue.line, alpha: a, cap: 'round' });
    g.moveTo(-r * 0.6, r * 0.35)
      .quadraticCurveTo(-r * 0.3, r * 0.05, 0, r * 0.35)
      .quadraticCurveTo(r * 0.3, r * 0.65, r * 0.6, r * 0.35)
      .stroke({ width: r * 0.12, color: swatch.blue.fill, alpha: a, cap: 'round' });
  } else if (f === 'logs') {
    g.roundRect(-r * 0.65, -r * 0.22, r * 1.3, r * 0.44, r * 0.2)
      .fill({ color: wood.fill, alpha: a })
      .stroke({ width: 2, color: wood.line, alpha: a });
    g.ellipse(r * 0.6, 0, r * 0.12, r * 0.22).fill({ color: wood.light, alpha: a });
  } else if (f === 'sand') {
    g.moveTo(-r * 0.7, r * 0.35)
      .quadraticCurveTo(0, -r * 0.6, r * 0.7, r * 0.35)
      .closePath()
      .fill({ color: swatch.yellow.fill, alpha: a })
      .stroke({ width: 2, color: swatch.yellow.line, alpha: a });
  } else if (f === 'plants') {
    for (const x of [-0.3, 0, 0.3])
      g.moveTo(r * x, r * 0.5)
        .quadraticCurveTo(r * (x - 0.2), 0, r * x, -r * 0.55)
        .stroke({ width: r * 0.12, color: swatch.green.line, alpha: a, cap: 'round' });
    g.ellipse(r * 0.25, -r * 0.1, r * 0.2, r * 0.1).fill({ color: swatch.green.fill, alpha: a });
  }
  g.eventMode = 'none';
  return g;
}

/** A sign or a choice at level 4: lines of text on a card, shrunk to fit the box it is given. Its origin is its middle. */
class ChoiceCard extends Container {
  private readonly bg = new Graphics();
  private readonly texts: Text[];
  private w = 0;
  private h = 0;
  private glowing = false;
  private readonly sizes: number[];
  /** Where layout put its middle, so a shake always comes back to it. */
  homeX = 0;
  constructor(lines: readonly { text: string; size: number; color?: number }[]) {
    super();
    this.sizes = lines.map((l) => l.size);
    this.bg.eventMode = 'none';
    this.addChild(this.bg);
    this.texts = lines.map((l) => {
      const t = label(l.text, l.size, l.color ?? ink);
      t.eventMode = 'none';
      this.addChild(t);
      return t;
    });
  }
  setText(i: number, text: string) {
    this.texts[i].text = text;
    this.place({ x: this.x - this.w / 2, y: this.y - this.h / 2, w: this.w, h: this.h });
  }
  place(r: Rect) {
    this.position.set(r.x + r.w / 2, r.y + r.h / 2);
    this.homeX = this.x;
    this.w = r.w;
    this.h = r.h;
    const shown = this.texts.filter((t) => t.text !== '');
    for (const t of this.texts) {
      t.visible = t.text !== '';
      t.style.wordWrap = true;
      t.style.wordWrapWidth = r.w - 28;
    }
    // The largest type that fits the box, from twice its size (an upright phone has the room) down to whatever fits. The
    // font size changes, never the scale, so large type stays sharp.
    const gap = 4;
    let total = 0;
    for (let k = 2; ; k -= 0.1) {
      this.texts.forEach((t, i) => (t.style.fontSize = Math.round(this.sizes[i] * k)));
      total = shown.reduce((a, t) => a + t.height, 0) + gap * Math.max(0, shown.length - 1);
      if (total <= r.h - 18 || k <= 0.5) break;
    }
    let y = -total / 2;
    for (const t of shown) {
      t.position.set(0, y + t.height / 2);
      y += t.height + gap;
    }
    this.hitArea = new Rectangle(-r.w / 2, -r.h / 2, r.w, r.h);
    this.draw();
  }
  lit(on: boolean) {
    this.glowing = on;
    this.draw();
  }
  private draw() {
    this.bg
      .clear()
      .roundRect(-this.w / 2, -this.h / 2, this.w, this.h, 16)
      .fill(0xffffff)
      .stroke({ width: this.glowing ? 7 : 4, color: this.glowing ? LIT : wood.line });
  }
}

/** A release site: a little painted scene with its needs' icons along the bottom (a missing one ghosted). */
class SiteCard extends Container {
  readonly icons = new Map<Feature, Graphics>();
  readonly frame = new Graphics();
  constructor(
    readonly site: Site,
    readonly w = SITE_W,
    readonly h = SITE_H,
  ) {
    super();
    const g = new Graphics();
    g.roundRect(-w / 2, -h / 2, w, h, 18).fill(0xdff0d6);
    g.rect(-w / 2 + 8, -h / 2 + 8, w - 16, 70).fill(0xd8ecfb);
    const has = (f: Feature) => site.features.includes(f);
    if (has('water'))
      g.ellipse(-10, 10, 90, 34).fill(swatch.blue.light).stroke({ width: 3, color: swatch.blue.fill });
    else
      g.moveTo(-w / 2 + 10, 0)
        .quadraticCurveTo(0, 30, w / 2 - 10, 0)
        .stroke({ width: 18, color: swatch.blue.fill })
        .moveTo(-60, 6)
        .lineTo(-30, 10)
        .moveTo(10, 12)
        .lineTo(40, 8)
        .stroke({ width: 3, color: 0xffffff });
    if (has('logs')) g.roundRect(30, -30, 80, 18, 8).fill(wood.fill).stroke({ width: 2, color: wood.line });
    if (has('sand'))
      g.moveTo(-130, 50).quadraticCurveTo(-90, 20, -50, 50).closePath().fill(swatch.yellow.fill);
    else g.roundRect(-128, 26, 70, 26, 6).fill(0xb7b2a8);
    if (has('plants'))
      for (const x of [-60, -40, 20, 46])
        g.moveTo(x, 30)
          .quadraticCurveTo(x - 6, 14, x, 0)
          .stroke({ width: 4, color: swatch.green.line, cap: 'round' });
    if (!has('quiet'))
      g.rect(-w / 2 + 8, -h / 2 + 60, w - 16, 14)
        .fill(0x9a9a9a)
        .rect(-20, -h / 2 + 66, 26, 3)
        .fill(0xffffff);
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
    this.frame
      .clear()
      .roundRect(-this.w / 2, -this.h / 2, this.w, this.h, 18)
      .stroke({ width: on ? 7 : 4, color: on ? LIT : swatch.green.line });
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
  private readonly hinted: Record<Step, boolean> = { pair: false, site: false, plan: false, reason: false };
  private glowing: { cards: number[]; nests: number[]; sites: number[]; choice: boolean } = {
    cards: [],
    nests: [],
    sites: [],
    choice: false,
  };
  /** Level 4: the keeper's note, the two plan cards and the three reason cards, and the plan she chose. */
  readonly keeperLayer = new Container();
  note: ChoiceCard | null = null;
  readonly planCards = new Map<PlanChoice, ChoiceCard>();
  readonly reasonCards = new Map<ReasonId, ChoiceCard>();
  chosen: PlanChoice | null = null;
  private restarted = false;
  private readonly hatchRng: Rng;
  private hatchlings: Turtle[] = [];
  private readonly baseCount: number;

  private readonly wall = new Graphics();
  private readonly treeWindow = new Container();
  private readonly treeClip = new Graphics();
  private readonly scrollTrack = new Graphics();
  private readonly tree = new Container();
  private readonly nestCards = new Container();
  private maxScroll = 0;
  private press: {
    id: number;
    x: number;
    y: number;
    scroll: number;
    moved: boolean;
    card?: TurtleCard;
  } | null = null;
  private readonly lines = new Graphics();
  private readonly litLines = new Graphics();
  private readonly glow = new Graphics();
  private readonly nestLayer = new Container();
  private readonly springBg = new Graphics();
  private readonly springText = label('Spring', 30, ink);
  private readonly siteLayer = new Container();
  private readonly needs = new Container();
  private readonly needIcons = new Map<Feature, Graphics>();
  private slots = new Map<number, { x: number; y: number }>();
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
    for (const part of [this.wall, this.lines, this.litLines, this.glow, this.springBg, this.springText])
      part.eventMode = 'none';
    this.tree.addChild(this.lines, this.litLines, this.glow);
    this.treeWindow.addChild(this.tree, this.treeClip, this.scrollTrack);
    this.scrollTrack.eventMode = 'none';
    this.treeWindow.eventMode = 'passive';
    this.treeWindow.on('pointerdown', (e) => {
      if (e.target === this.treeWindow) this.startSlide(e);
    });
    this.treeWindow.on('globalpointermove', (e) => this.moveSlide(e));
    this.treeWindow.on('pointerup', (e) => this.endSlide(e));
    this.treeWindow.on('pointerupoutside', (e) => this.cancelSlide(e));
    ctx.listen(window, 'pointerup', (e) => this.cancelSlide(e));
    ctx.listen(window, 'pointercancel', (e) => this.cancelSlide(e), { capture: true });
    ctx.listen(window, 'blur', () => this.clearPress());
    ctx.listen(document, 'visibilitychange', () => this.clearPress());
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
    this.nestLayer.addChild(this.spring, this.nestCards);
    this.nestCards.eventMode = 'none';
    // The needs card: the four needs a site must have.
    const nb = new Graphics()
      .roundRect(-150, -60, 300, 120, 16)
      .fill(0xffffff)
      .stroke({ width: 4, color: wood.line });
    nb.eventMode = 'none';
    this.needs.addChild(nb);
    NEEDS.forEach((f, i) => {
      const icon = featureIcon(f, 26);
      icon.position.set(-105 + i * 70, 0);
      this.needIcons.set(f, icon);
      this.needs.addChild(icon);
    });
    this.needs.hitArea = new Rectangle(-150, -60, 300, 120);
    onTap(this.needs, () => {
      if (this.phase === 'site') void ctx.say('comeback.needs');
    });
    this.needs.visible = false;
    this.siteLayer.visible = false;
    if (this.round.keeper) this.buildKeeper();
    this.keeperLayer.visible = !!this.round.keeper;
    this.nestLayer.visible = !this.round.keeper;
    ctx.stage.addChild(
      this.wall,
      this.treeWindow,
      this.nestLayer,
      this.keeperLayer,
      this.needs,
      this.siteLayer,
    );
    this.layout();
  }

  private badge(choice: PlanChoice) {
    const k = this.round.keeper!,
      related = relatedPairs(this.round.tree, k[choice]);
    return `${k[choice].length} pairs, ${related || 'none'} related`;
  }

  private buildKeeper() {
    const k = this.round.keeper!,
      tree = this.round.tree;
    this.note = new ChoiceCard([
      { text: "The keeper's note", size: 17, color: 0x8a8172 },
      {
        text:
          k.note === 'room'
            ? `Room for ${k.b.length} nests this spring. Keep the pairs as far apart in the family as you can.`
            : 'A big spring: we need as many hatchlings as we can raise.',
        size: 21,
      },
      { text: '', size: 17, color: swatch.green.line },
    ]);
    onTap(this.note, () => this.tapNote());
    this.keeperLayer.addChild(this.note);
    for (const choice of ['a', 'b'] as const) {
      const card = new ChoiceCard([
        { text: choice === 'a' ? 'Plan A' : 'Plan B', size: 26 },
        ...k[choice].map(([f, m]) => {
          const related = kin(tree, f, m, 2);
          return {
            text: `${byId(tree, f).name} ♀ + ${byId(tree, m).name} ♂${related ? ' (related)' : ''}`,
            size: 16,
            color: related ? RELATED : ink,
          };
        }),
        { text: this.badge(choice), size: 20 },
      ]);
      onTap(card, () => this.tapPlan(choice));
      this.planCards.set(choice, card);
      this.keeperLayer.addChild(card);
    }
    for (const id of REASONS) {
      const card = new ChoiceCard([{ text: REASON_TEXT[id], size: 21 }]);
      card.visible = false;
      onTap(card, () => this.tapReason(id));
      this.reasonCards.set(id, card);
      this.keeperLayer.addChild(card);
    }
  }

  private addCard(t: Turtle) {
    const c = new TurtleCard(t);
    onTap(c, (e) => {
      if (this.maxScroll) this.startSlide(e, c);
      else this.tapTurtle(t.id);
    });
    c.on('pointerup', (e) => this.endSlide(e, c));
    this.cards.set(t.id, c);
    this.tree.addChild(c);
    if (t.gen === 0 || this.round.tree.nested.some((p) => p.includes(t.id))) c.set('faded');
    return c;
  }

  get depth() {
    return this.round.plan.depth;
  }
  get target() {
    return this.round.target;
  }
  private isCandidate(id: number) {
    const t = byId(this.round.tree, id);
    return t.gen >= 1 && t.gen <= 2 && !this.round.tree.nested.some((p) => p.includes(id));
  }

  start() {
    void this.begin();
  }

  private async begin() {
    const k = this.round.keeper;
    this.phase = k ? 'plan' : 'pair';
    await this.ctx.say('comeback.intro');
    // Start again during the intro has already given the instruction.
    if (this.restarted) return;
    if (!k) return this.instructPair();
    await this.sayNote();
    if (this.phase === 'plan' && !this.restarted) this.instructPlan();
  }

  private sayNote() {
    const k = this.round.keeper!;
    return k.note === 'room'
      ? this.ctx.say('comeback.note-room', { n: k.b.length })
      : this.ctx.say('comeback.note-big');
  }

  private instructPlan() {
    const k = this.round.keeper!;
    void this.ctx.instruct('comeback.plans', {
      a: k.a.length,
      r: relatedPairs(this.round.tree, k.a),
      b: k.b.length,
    });
  }

  private instructPair() {
    void this.ctx.instruct(this.depth === 2 ? 'comeback.instruct-pair-cousins' : 'comeback.instruct-pair', {
      n: this.target,
    });
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Layout                                                                                        */
  /* -------------------------------------------------------------------------------------------- */

  resize(v: View) {
    this.clearPress();
    this.view = v;
    this.layout();
  }

  private layout() {
    const v = this.view,
      tree = this.round.tree;
    const l = comebackLayout(v, tree, this.hatchlings, this.nests.length);
    const preview = this.phase === 'site' || this.phase === 'done';
    this.maxScroll = preview ? 0 : l.scroll;
    this.treeWindow.eventMode = this.maxScroll ? 'static' : 'passive';
    this.treeWindow.hitArea = this.maxScroll
      ? new Rectangle(20, l.wall.top, v.w - 40, l.wall.bottom - l.wall.top)
      : null;
    this.treeClip.clear();
    if (this.treeWindow.hitArea) {
      this.treeClip.rect(20, l.wall.top, v.w - 40, l.wall.bottom - l.wall.top).fill(0xffffff);
    }
    this.tree.mask = this.maxScroll ? this.treeClip : null;
    this.setScroll(-this.tree.x);
    this.card = l.card;
    this.slots = l.slots;
    for (const [id, c] of this.cards) {
      c.setSize(byId(tree, id).gen === 3 ? l.hatch : l.card);
      this.ctx.tw.kill(c.position);
      this.ctx.tw.kill(c.scale);
      if (!this.inNest(id)) {
        if (c.parent !== this.tree) this.tree.addChild(c);
        c.scale.set(this.lifted === id ? 1.08 : 1);
        const p = this.slots.get(id)!;
        c.position.set(p.x, p.y);
      }
    }
    this.nests.forEach((n, i) => {
      n.position.copyFrom(l.nests[i]);
      this.drawNest(i);
    });
    this.spring.position.copyFrom(l.spring);
    if (!this.sprung) for (const [k, p] of this.plan.entries()) this.placeInNest(k, p, false);
    this.drawSpring();
    this.drawLines();
    this.wall
      .clear()
      .roundRect(20, l.wall.top, v.w - 40, l.wall.bottom - l.wall.top, 24)
      .fill({ color: WALL, alpha: 0.8 });
    this.note?.place(l.keeper.note);
    const z = l.keeper.zone;
    const split = (cards: ChoiceCard[], gap: number) => {
      const w = (z.w - gap * (cards.length - 1)) / cards.length;
      cards.forEach((c, i) => c.place({ x: z.x + i * (w + gap), y: z.y, w, h: z.h }));
    };
    split([...this.planCards.values()], 12);
    split([...this.reasonCards.values()], 10);
    if (this.phase === 'site' || this.phase === 'done') this.layoutSites();
  }

  private layoutSites() {
    const v = this.view;
    this.clearPress();
    this.maxScroll = 0;
    this.tree.mask = null;
    this.treeWindow.eventMode = 'none';
    this.treeWindow.hitArea = null;
    this.scrollTrack.clear();
    this.wall.visible = false;
    this.nestLayer.visible = false;
    // The tree shrinks into the top band.
    const bounds = this.tree.getLocalBounds();
    const wide = 3 * (SITE_W + 24) - 24 <= v.w - 160 - 20;
    const top = v.upright ? 210 : 96;
    const siteRows = wide ? 1 : 2;
    const siteRoom = 72 + 60 + 24 + siteRows * SITE_H + (siteRows - 1) * 24;
    const band = Math.min(v.h * (v.h > v.w ? 0.26 : 0.24), v.h - top - siteRoom - 20);
    const k = Math.min(1, band / Math.max(1, bounds.height), (v.w - 40) / Math.max(1, bounds.width));
    this.tree.scale.set(k);
    this.tree.position.set(v.w / 2 - (bounds.x + bounds.width / 2) * k, top - bounds.y * k);
    const needY = top + band + 72;
    this.needs.position.set(v.w / 2, needY);
    // Three across when they fit beside the pet's corner, else two over one.
    const w = SITE_W + 24,
      row = 3 * w - 24;
    const cx = Math.max(v.w / 2, 160 + row / 2),
      y = needY + 60 + 24 + SITE_H / 2;
    this.sites.forEach((c, i) => {
      if (wide) c.position.set(cx + (i - 1) * w, y);
      else c.position.set(i < 2 ? v.w / 2 + (i - 0.5) * w : v.w / 2, y + (i < 2 ? 0 : SITE_H + 24));
    });
  }

  private setScroll(scroll: number) {
    const x = Math.max(0, Math.min(this.maxScroll, scroll));
    this.tree.x = -x;
    this.scrollTrack.clear();
    if (!this.maxScroll) return;
    const width = this.view.w - 64;
    const thumb = (width * (this.view.w - 40)) / (this.view.w - 40 + this.maxScroll);
    this.scrollTrack
      .roundRect(32, 208, width, 6, 3)
      .fill(wood.light)
      .roundRect(32 + ((width - thumb) * x) / this.maxScroll, 206, thumb, 10, 5)
      .fill(wood.line);
  }

  private startSlide(e: FederatedPointerEvent, card?: TurtleCard) {
    if (!this.maxScroll || this.phase === 'busy' || this.press || palmOnGlass() || e.button > 0) return;
    const { x, y } = this.treeWindow.toLocal(e.global);
    this.press = { id: e.pointerId, x, y, scroll: -this.tree.x, moved: false, card };
    if (card) card.alpha *= 0.7;
  }

  private moveSlide(e: FederatedPointerEvent) {
    const press = this.press;
    if (!press || press.id !== e.pointerId) return;
    if (palmOnGlass()) return this.clearPress();
    const { x, y } = this.treeWindow.toLocal(e.global);
    const dx = x - press.x;
    if (!press.moved && Math.hypot(dx, y - press.y) < SLIDE_SLOP) return;
    press.moved = true;
    this.setScroll(press.scroll - dx);
  }

  private endSlide(e: FederatedPointerEvent, card?: TurtleCard) {
    const press = this.press;
    if (!press || press.id !== e.pointerId) return;
    this.moveSlide(e);
    const tap = this.press && !press.moved && card && press.card === card;
    this.clearPress();
    if (tap) this.tapTurtle(card.turtle.id);
  }

  private cancelSlide(e: { pointerId: number }) {
    if (e.pointerId === this.press?.id) this.clearPress();
  }

  private clearPress() {
    const card = this.press?.card;
    if (card) card.alpha = card.state === 'faded' ? 0.6 : 1;
    this.press = null;
  }

  private drawNest(i: number) {
    const g = this.nests[i].children[0] as Graphics;
    const glowing = this.glowing.nests.includes(i);
    g.clear()
      .ellipse(0, 18, NEST_W / 2, 26)
      .fill(wood.fill)
      .stroke({ width: glowing ? 7 : 4, color: glowing ? LIT : wood.line });
    g.ellipse(0, 12, NEST_W / 2 - 14, 14).fill(wood.light);
    for (let k = -2; k <= 2; k++)
      g.moveTo(-NEST_W / 2 + 10, 18 + k * 4)
        .quadraticCurveTo(0, 30 + k * 3, NEST_W / 2 - 10, 18 + k * 4)
        .stroke({ width: 2, color: wood.line, alpha: 0.5 });
  }

  private drawSpring() {
    const halfHeight = this.view.upright ? UPRIGHT_CARD / 2 : 40;
    this.spring.hitArea = new Rectangle(-75, -halfHeight, 150, halfHeight * 2);
    const ready = this.phase === 'ready' || (this.plan.length >= this.target && this.phase === 'pair');
    this.springBg
      .clear()
      .roundRect(-75, -halfHeight, 150, halfHeight * 2, 22)
      .fill(ready ? swatch.green.fill : 0xe4ddd0)
      .stroke({ width: ready ? 6 : 4, color: ready ? swatch.green.line : 0xb9ae9c });
    this.springText.style.fill = ready ? ink : 0x8a8172;
    this.spring.alpha = ready ? 1 : 0.85;
  }

  /** The family lines: a link between each pair of parents, and a line down to each of their young. */
  private drawLines() {
    const g = this.lines.clear(),
      tree = this.round.tree,
      s = this.card;
    const pairs = new Map<string, Turtle[]>();
    for (const t of tree.turtles)
      if (t.parents) {
        const k = t.parents.join('-');
        pairs.set(k, [...(pairs.get(k) ?? []), t]);
      }
    for (const [k, kids] of pairs) {
      const [a, b] = k.split('-').map(Number);
      const pa = this.slots.get(a),
        pb = this.slots.get(b);
      if (!pa || !pb) continue;
      const mx = (pa.x + pb.x) / 2,
        my = Math.max(pa.y, pb.y) + s / 2 + 10;
      g.moveTo(pa.x, pa.y + s / 2)
        .lineTo(pa.x, my)
        .lineTo(pb.x, my)
        .lineTo(pb.x, pb.y + s / 2)
        .stroke({ width: 3, color: wood.line, alpha: 0.6 });
      for (const kid of kids) {
        const pk = this.slots.get(kid.id);
        if (!pk) continue;
        const ks = this.cards.get(kid.id)?.size ?? s;
        g.moveTo(mx, my)
          .lineTo(pk.x, pk.y - ks / 2)
          .stroke({ width: 3, color: wood.line, alpha: 0.6 });
      }
    }
  }

  private nestSpot(nest: number, which: 0 | 1) {
    const n = this.nests[nest];
    return { x: n.x + (which === 0 ? -30 : 30), y: n.y - 8 };
  }

  private inNest(id: number) {
    return !this.sprung && this.plan.some((p) => p.includes(id));
  }

  private placeInNest(nest: number, pair: Pair, animate: boolean) {
    pair.forEach((id, k) => {
      const c = this.cards.get(id)!,
        to = this.nestSpot(nest, k as 0 | 1);
      const scale = 60 / this.card;
      this.moveCard(c, this.nestCards);
      c.set('normal');
      if (animate) {
        void this.ctx.tw.to(c.position, to, { duration: 0.35, ease: ease.outCubic });
        void this.ctx.tw.to(c.scale, { x: scale, y: scale }, { duration: 0.35 });
      } else {
        c.position.set(to.x, to.y);
        c.scale.set(scale);
      }
    });
  }

  private moveCard(card: TurtleCard, layer: Container) {
    if (card.parent === layer) return;
    this.ctx.tw.kill(card.position);
    this.ctx.tw.kill(card.scale);
    const dx = layer === this.tree ? -this.tree.x : this.tree.x;
    layer.addChild(card);
    card.x += dx;
  }

  private returnToSlot(id: number) {
    const c = this.cards.get(id)!,
      p = this.slots.get(id)!;
    this.moveCard(c, this.tree);
    c.set('normal');
    void this.ctx.tw.to(c.position, p, { duration: 0.3, ease: ease.outCubic });
    void this.ctx.tw.to(c.scale, { x: 1, y: 1 }, { duration: 0.3 });
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Pairing                                                                                       */
  /* -------------------------------------------------------------------------------------------- */

  tapTurtle(id: number) {
    const keeper = this.phase === 'plan' || this.phase === 'reason' || this.phase === 'ready';
    if (this.phase !== 'pair' && !keeper) return;
    const t = byId(this.round.tree, id);
    // With the keeper's plans nobody is paired by hand: every turtle only says its name.
    if (keeper || !this.isCandidate(id)) {
      // A founder or a turtle who nested before: hearing its name is free.
      void this.ctx.say('comeback.name', { who: t.name });
      return;
    }
    if (this.inNest(id)) return void this.tapNest(this.plan.findIndex((p) => p.includes(id)));
    if (this.lifted === null) return this.lift(id);
    if (this.lifted === id) {
      this.putDown();
      return;
    }
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
    void this.ctx.tw
      .to(nest, { y: nest.y - 14 }, { duration: 0.12 })
      .then(() => this.ctx.tw.to(nest, { y: nest.y + 14 }, { duration: 0.2, ease: ease.outBack }));
    for (const id of [a, b]) this.cards.get(id)!.set('lit');
    if (sameSex) void this.ctx.say('comeback.same-sex');
    else {
      const rel = sharedRelative(tree, a, b);
      if (rel) {
        this.lightPath(rel.id, [a, b]);
        void this.ctx.say('comeback.kin', {
          who: byId(tree, rel.id).name,
          a: byId(tree, a).name,
          ra: rel.toA,
          b: byId(tree, b).name,
          rb: rel.toB,
        });
      }
    }
    void this.ctx.tw.wait(2).then(() => {
      if (this.finished) return;
      this.litLines.clear();
      for (const [id, c] of this.cards)
        if (c.state === 'lit') c.set(this.isCandidate(id) ? 'normal' : 'faded');
      for (const id of [a, b]) if (this.lifted !== id && !this.inNest(id)) this.cards.get(id)!.scale.set(1);
      this.drawGlow();
    });
    this.afterMiss('pair');
  }

  /** Light the shared relative and the lines from it down to both turtles. */
  private lightPath(rel: number, ends: number[]) {
    const g = this.litLines.clear(),
      tree = this.round.tree;
    this.cards.get(rel)?.set('lit');
    for (const end of ends) {
      let at = end;
      while (at !== rel) {
        const parents = byId(tree, at).parents;
        if (!parents) break;
        const up =
          parents.find((p) => p === rel) ??
          parents.find((p) => [...(byId(tree, p).parents ?? [])].includes(rel));
        if (up === undefined) break;
        const from = this.slots.get(at)!,
          to = this.slots.get(up)!;
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
    if (this.phase === 'ready') return void this.doSpring();
    if (this.phase !== 'pair') return;
    if (this.plan.length < this.target) {
      void this.ctx.instruct('comeback.more-pairs', { n: this.target - this.plan.length });
      return;
    }
    void this.doSpring();
  }

  private async doSpring() {
    this.phase = 'busy';
    this.putDown();
    this.clearGlow();
    this.drawSpring();
    for (const n of this.nests)
      void this.ctx.tw
        .to(n, { rotation: 0.06 }, { duration: 0.12 })
        .then(() => this.ctx.tw.to(n, { rotation: 0 }, { duration: 0.25, ease: ease.outElastic }));
    this.hatchlings = hatch(this.round.tree, this.plan, this.hatchRng);
    for (const turtle of this.hatchlings) this.addCard(turtle);
    this.clearPress();
    this.setScroll(this.maxScroll / 2);
    this.layout();
    this.sprung = true;
    // Use the current tree coordinates after the layout has added the hatchling row.
    for (const pair of this.plan) for (const id of pair) this.returnToSlot(id);
    let k = 0;
    for (const t of this.hatchlings) {
      const c = this.cards.get(t.id)!,
        p = this.slots.get(t.id)!,
        nest = this.nests[Math.floor(k / 2)];
      c.position.set(nest.x - this.tree.x, nest.y);
      c.scale.set(0.2);
      void this.ctx.tw.to(c.position, p, { duration: 0.5, delay: 0.15 * k, ease: ease.outCubic });
      void this.ctx.tw.to(c.scale, { x: 1, y: 1 }, { duration: 0.5, delay: 0.15 * k });
      void this.ctx.tw.wait(0.15 * k + 0.3).then(() => {
        if (!this.finished) {
          sfx.marimba(4, 0.3);
          void this.ctx.tw.wait(0.12).then(() => sfx.marimba(6, 0.3));
        }
      });
      k++;
    }
    await this.ctx.tw.wait(0.15 * k + 0.6);
    for (const pair of this.plan) for (const id of pair) this.cards.get(id)?.set('faded');
    this.drawLines();
    await this.ctx.say('comeback.hatched');
    if (this.round.plan.site) return this.startSites();
    return this.finishRound();
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Level 4: the keeper's two plans                                                               */
  /* -------------------------------------------------------------------------------------------- */

  tapNote() {
    if (this.phase === 'plan' || this.phase === 'reason') void this.sayNote();
  }

  private boingCard(card: ChoiceCard) {
    sfx.boing();
    const x = card.homeX;
    void this.ctx.tw
      .to(card, { x: x + 10 }, { duration: 0.06 })
      .then(() => this.ctx.tw.to(card, { x: x - 10 }, { duration: 0.1 }))
      .then(() => this.ctx.tw.to(card, { x }, { duration: 0.08 }));
  }

  tapPlan(choice: PlanChoice) {
    const k = this.round.keeper;
    if (this.phase !== 'plan' || !k) return;
    if (choice !== k.fits) {
      // Both plans follow the rule; this one does not fit this year's note. The trade is spoken.
      this.miss();
      this.boingCard(this.planCards.get(choice)!);
      void this.ctx.say(k.note === 'room' ? 'comeback.plan-wrong-room' : 'comeback.plan-wrong-big');
      this.afterMiss('plan');
      return;
    }
    this.clearGlow();
    this.chosen = choice;
    this.stepMisses = 0;
    sfx.sparkle();
    for (const c of this.planCards.values()) c.visible = false;
    for (const c of this.reasonCards.values()) c.visible = true;
    this.note?.setText(2, `You chose Plan ${choice === 'a' ? 'A' : 'B'}: ${this.badge(choice)}`);
    this.phase = 'reason';
    void this.ctx.instruct('comeback.reason-ask');
  }

  tapReason(id: ReasonId) {
    const k = this.round.keeper;
    if (this.phase !== 'reason' || !k) return;
    if (REASON_FITS[id] !== k.fits) {
      this.miss();
      this.boingCard(this.reasonCards.get(id)!);
      void this.ctx.say(`comeback.reason-wrong-${id}` as LineId);
      this.afterMiss('reason');
      return;
    }
    void this.settlePlan(id);
  }

  /** The chosen plan's pairs slide into the nests, and only Spring is left to press. */
  private async settlePlan(id: ReasonId) {
    const k = this.round.keeper!;
    this.phase = 'busy';
    this.clearGlow();
    this.reasonCards.get(id)!.lit(true);
    sfx.sparkle();
    await this.ctx.tw.wait(0.6);
    if (this.finished) return;
    this.keeperLayer.visible = false;
    this.nestLayer.visible = true;
    this.plan = k[k.fits].slice();
    this.plan.forEach((p, i) => this.placeInNest(i, p, true));
    sfx.brush();
    await this.ctx.tw.wait(0.45);
    if (this.finished) return;
    this.phase = 'ready';
    this.drawSpring();
    void this.ctx.instruct('comeback.reason-ok');
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Levels 3 and 4: the release site                                                              */
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
      void this.ctx.tw
        .to(icon, { x: x + 8 }, { duration: 0.06 })
        .then(() => this.ctx.tw.to(icon, { x: x - 8 }, { duration: 0.1 }))
        .then(() => this.ctx.tw.to(icon, { x }, { duration: 0.08 }));
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
      void this.ctx.tw.to(
        w.position,
        { x: c.x - 90 + (k % 3) * 60, y: c.y + 6 + Math.floor(k / 3) * 34 },
        { duration: 1.1, delay: 0.12 * k, ease: ease.inOutSine },
      );
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

  private miss() {
    this.misses++;
    this.stepMisses++;
  }

  private afterMiss(step: Step) {
    if (this.stepMisses >= 2) this.showHelp(step, true);
  }

  private currentStep(): Step | null {
    const p = this.phase;
    return p === 'pair' || p === 'site' || p === 'plan' || p === 'reason' ? p : null;
  }

  /** The glow for this step; counted as a hint once per step. */
  private showHelp(step: Step, speak: boolean) {
    if (!this.hinted[step]) {
      this.hinted[step] = true;
      this.hints++;
    }
    this.glowing = { cards: [], nests: [], sites: [], choice: false };
    const k = this.round.keeper;
    if ((step === 'plan' || step === 'reason') && k) {
      // The plan that fits the note, or the card that says why.
      this.glowing.choice = true;
      if (step === 'plan') this.planCards.get(k.fits)!.lit(true);
      else this.reasonCards.get(REASONS.find((id) => REASON_FITS[id] === k.fits)!)!.lit(true);
      if (speak) void this.ctx.say(step === 'plan' ? 'comeback.hint-plan' : 'comeback.hint-reason');
      return;
    }
    if (step === 'pair') {
      const help = helpFor(this.round.tree, this.plan, this.depth, this.target);
      if (help.kind === 'pair') {
        this.glowing.cards = [...help.pair];
        this.revealPair(help.pair);
      } else if (help.kind === 'undo') this.glowing.nests = [help.nest];
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

  private revealPair(pair: Pair) {
    if (!this.maxScroll) return;
    const [a, b] = pair.map((id) => this.slots.get(id)!.x);
    const margin = this.card / 2 + 26;
    const min = Math.max(a, b) - this.view.w + margin;
    const max = Math.min(a, b) - margin;
    const next = this.slots.get(pair.find((id) => id !== this.lifted)!)!.x;
    this.setScroll(min <= max ? Math.min(max, Math.max(min, -this.tree.x)) : next - this.view.w / 2);
  }

  private clearGlow() {
    this.glowing = { cards: [], nests: [], sites: [], choice: false };
    for (const c of [...this.planCards.values(), ...this.reasonCards.values()]) c.lit(false);
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
      g.roundRect(c.x - r, c.y - r, r * 2, r * 2, 20).fill({
        color: LIT,
        alpha: 0.35 + 0.15 * Math.sin(this.clock * 5),
      });
    }
  }

  askForHint() {
    // With the keeper's plan in the nests, only Spring is left: say so.
    if (this.phase === 'ready') return void this.ctx.instruct('comeback.spring');
    const step = this.currentStep();
    if (!step) return;
    if (
      this.hinted[step] &&
      (this.glowing.cards.length ||
        this.glowing.nests.length ||
        this.glowing.sites.length ||
        this.glowing.choice)
    ) {
      if (step === 'pair') this.instructPair();
      else if (step === 'plan') this.instructPlan();
      else if (step === 'reason') void this.ctx.instruct('comeback.reason-ask');
      else void this.ctx.instruct('comeback.needs');
      return;
    }
    this.showHelp(step, true);
  }

  restart() {
    if (this.phase === 'busy' || this.phase === 'done') return;
    this.restarted = true;
    this.clearPress();
    // The same seeded round from the start; misses and hints made so far keep counting.
    this.putDown();
    this.clearGlow();
    for (const t of this.hatchlings) {
      const c = this.cards.get(t.id);
      if (c) {
        c.destroy({ children: true });
        this.cards.delete(t.id);
      }
    }
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
    this.plan = [];
    this.sprung = false;
    this.stepMisses = 0;
    const keeper = !!this.round.keeper;
    this.phase = keeper ? 'plan' : 'pair';
    this.chosen = null;
    this.keeperLayer.visible = keeper;
    this.nestLayer.visible = !keeper;
    for (const c of this.planCards.values()) c.visible = true;
    for (const c of this.reasonCards.values()) c.visible = false;
    this.note?.setText(2, '');
    this.layout();
    for (const [id, c] of this.cards) c.set(this.isCandidate(id) ? 'normal' : 'faded');
    if (keeper) this.instructPlan();
    else this.instructPair();
  }

  update(dt: number) {
    this.clock += dt;
    if (this.glowing.cards.length) this.drawGlow();
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Ghost finger                                                                                  */
  /* -------------------------------------------------------------------------------------------- */

  autotouch(): TouchIntent | null {
    const tree = this.round.tree,
      depth = this.depth,
      k = this.round.keeper;
    if (this.phase === 'plan' && k) return { tap: { on: this.planCards.get(k.fits)! }, pause: 0.6 };
    if (this.phase === 'reason' && k)
      return {
        tap: { on: this.reasonCards.get(REASONS.find((id) => REASON_FITS[id] === k.fits)!)! },
        pause: 0.6,
      };
    if (this.phase === 'ready') return { tap: { on: this.spring } };
    if (this.phase === 'pair') {
      if (this.plan.length >= this.target) return { tap: { on: this.spring } };
      const full = extend(tree, this.plan, depth, this.target);
      if (!full) {
        const help = helpFor(tree, this.plan, depth, this.target);
        return help.kind === 'undo' ? { tap: { on: this.nests[help.nest] } } : null;
      }
      const next = full[this.plan.length];
      const id = this.lifted === null ? next[0] : this.lifted === next[0] ? next[1] : this.lifted;
      const card = this.cards.get(id)!;
      const edge = UPRIGHT_CARD / 2 + 22;
      const x = card.x + this.tree.x;
      if (this.maxScroll && (x < edge || x > this.view.w - edge)) {
        const from = this.view.w / 2;
        return {
          trace: { on: this.treeWindow, x: from, y: 235 },
          via: [{ on: this.treeWindow, x: Math.max(24, Math.min(this.view.w - 24, 2 * from - x)), y: 235 }],
        };
      }
      return { tap: { on: card }, pause: this.lifted === null ? 0.3 : undefined };
    }
    if (this.phase === 'site') {
      const good = this.sites.find((c) => suits(c.site));
      return good ? { tap: { on: good } } : null;
    }
    return null;
  }

  destroy() {
    this.finished = true;
    this.clearPress();
  }
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
    g.moveTo(70, -60)
      .quadraticCurveTo(90, -110, 80, -150)
      .stroke({ width: 6, color: swatch.green.line, cap: 'round' });
    g.ellipse(92, -118, 16, 8).ellipse(70, -96, 16, 8).fill(swatch.green.fill);
    c.addChild(g);
    const a = turtleArt(70),
      b = turtleArt(60, swatch.brown);
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
  c.addChild(
    new Graphics().circle(0, 0, 78).fill(swatch.blue.light).stroke({ width: 6, color: swatch.teal.line }),
  );
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

/**
 * The tree's slots (card centers), card sizes, nests, Spring and the wall behind the tree. Upright (chunk 31) the tree starts
 * below Home and "?", and Spring stands under a centered row of nests rather than at the row's right end.
 */
export function comebackLayout(v: View, tree: Tree, hatchlings: readonly Turtle[], nests: number) {
  const portrait = v.h > v.w;
  const families: { founders: Turtle[]; kids: Turtle[] }[] = [];
  const founders = tree.turtles.filter((t) => t.gen === 0);
  for (let i = 0; i < founders.length; i += 2) {
    const mum = founders[i],
      dad = founders[i + 1];
    families.push({
      founders: [mum, dad],
      kids: tree.turtles.filter((t) => t.gen === 1 && t.parents?.[0] === mum.id),
    });
  }
  const blocks = families.map((f) => Math.max(2, f.kids.length));
  // Up to eight in a row draw at 96 and nine or ten at 80 (level 4). A row still too wide at the 64-unit floor (level 4
  // on the 768-wide areas) closes its gaps rather than shrink a card.
  let s = blocks.reduce((a, b) => a + b, 0) > 8 ? 80 : 96;
  let gap = 14,
    famGap = 30;
  const widthAt = (size: number) =>
    blocks.reduce((a, b) => a + b * (size + gap), 0) + famGap * (blocks.length - 1);
  // Sideways the founders' row is level with Home and "?", so a wide tree keeps to their right.
  const CHROME = 125;
  const largeTree = v.upright && families.length >= 3;
  if (largeTree) s = UPRIGHT_CARD;
  else while (s > MIN_TOUCH && widthAt(s) > v.w - (portrait ? 40 : CHROME + 20)) s -= 4;
  if (!largeTree && widthAt(s) > v.w - 40) {
    gap = 8;
    famGap = 20;
  }
  const treeWidth = largeTree ? Math.max(v.w, widthAt(s) + 40) : v.w;
  const rowH = s + 38;
  let x = (treeWidth - widthAt(s)) / 2;
  // Not upright, a tree that would reach under Home and "?" moves right of them, or (too wide for that) starts below them
  // as the upright tree does.
  const below = v.upright || (x < CHROME && widthAt(s) > v.w - CHROME - 20);
  if (!below) x = Math.max(x, Math.min(CHROME, v.w - 20 - widthAt(s)));
  const wallTop = below ? 200 : 92;
  const top = wallTop + 20 + s / 2;
  const slots = new Map<number, { x: number; y: number }>();
  families.forEach((f, i) => {
    const bw = blocks[i] * (s + gap),
      mid = x + bw / 2;
    f.founders.forEach((t, k) => slots.set(t.id, { x: mid + (k - 0.5) * (s + gap), y: top }));
    f.kids.forEach((t, k) =>
      slots.set(t.id, { x: mid + (k - (f.kids.length - 1) / 2) * (s + gap), y: top + rowH }),
    );
    x += bw + famGap;
  });
  // Each third generation sits under the middle of its parents, inside the wall; two of them (level 4) move apart.
  const thirds = tree.nested
    .map((pair) => {
      const third = tree.turtles.filter(
        (t) => t.gen === 2 && t.parents?.[0] === pair[0] && t.parents?.[1] === pair[1],
      );
      const w = third.length * (s + gap);
      const want = (slots.get(pair[0])!.x + slots.get(pair[1])!.x) / 2;
      return { third, w, mid: Math.min(Math.max(want, 40 + w / 2), treeWidth - 40 - w / 2) };
    })
    .sort((p, q) => p.mid - q.mid);
  for (let i = 1; i < thirds.length; i++)
    thirds[i].mid = Math.max(thirds[i].mid, thirds[i - 1].mid + (thirds[i - 1].w + thirds[i].w) / 2 + famGap);
  for (let i = thirds.length - 1; i >= 0; i--) {
    const g = thirds[i],
      next = thirds[i + 1];
    g.mid = Math.min(g.mid, next ? next.mid - (next.w + g.w) / 2 - famGap : treeWidth - 40 - g.w / 2);
  }
  for (const g of thirds)
    g.third.forEach((t, k) =>
      slots.set(t.id, { x: g.mid + (k - (g.third.length - 1) / 2) * (s + gap), y: top + rowH * 2 }),
    );
  const hatchRow = tree.nested.length ? 3 : 2;
  const hs = Math.max(MIN_TOUCH, Math.round(s * 0.8));
  hatchlings.forEach((t, k) =>
    slots.set(t.id, {
      x: treeWidth / 2 + (k - (hatchlings.length - 1) / 2) * (hs + 10),
      y: top + rowH * hatchRow - (s - hs) / 2,
    }),
  );
  // The nest row along the bottom, clear of the pet's corner, with Spring at its right end (upright: centered, Spring below).
  const nestY = portrait ? top + rowH * (hatchRow + 1) + 20 : v.h - 86;
  const spacing = v.upright
    ? Math.min(170, (v.w - 40 - NEST_W) / Math.max(1, nests - 1))
    : Math.min(170, (v.w - 220 - 200) / Math.max(1, nests - 1 || 1));
  const left = v.upright ? v.w / 2 - ((nests - 1) * spacing) / 2 : 220;
  // Level 4's note and choices stand under the tree, where the hatchlings and (upright) the nests come later: the note
  // across the top with the two plans or three reasons under it, or sideways the note at their left.
  const kTop = top + rowH * (hatchRow - 1) + s / 2 + 12;
  const kBottom = nestY - 74;
  // Upright there is room below the tree, so the choices grow (their text with them) and stop above the guide's corner
  // or, when the view is short, stand beside it.
  const zTop = kTop + 180,
    zH = Math.max(170, Math.min(420, v.h - zTop - 20)),
    zLeft = zTop + zH > v.h - 170 ? 170 : 20;
  const keeper: { note: Rect; zone: Rect } = portrait
    ? {
        note: { x: 20, y: kTop, w: v.w - 40, h: 170 },
        zone: { x: zLeft, y: zTop, w: v.w - 20 - zLeft, h: zH },
      }
    : {
        note: { x: 20, y: kTop, w: 270, h: kBottom - kTop },
        zone: { x: 302, y: kTop, w: v.w - 322, h: kBottom - kTop },
      };
  return {
    keeper,
    card: s,
    hatch: hs,
    scroll: treeWidth - v.w,
    slots,
    nests: Array.from({ length: nests }, (_, i) => ({ x: left + i * spacing, y: nestY })),
    spring: v.upright ? { x: v.w / 2, y: nestY + 120 } : { x: v.w - 110, y: nestY },
    wall: { top: wallTop, bottom: portrait ? nestY - 60 : nestY - 70 },
  };
}

export const speciesComeback: GameModule = {
  id: 'species-comeback',
  upright: true,
  name: 'Species Comeback',
  titleLine: 'game.species-comeback',
  region: 'barnyard',
  challenge: 'logic',
  skills: ['animals', 'logic', 'planning', 'reasoning'],
  bands: ['grownup'],
  inputs: ['touch'],
  touchDemo: true,
  coplayHint:
    'One of you reads the family tree aloud ("who are Lichen\'s grandparents?") while the other pairs the turtles; then swap.',
  offScreen: "Draw your own family's tree and find your cousins on it.",
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  hubIcon: () => new ComebackIcon(),
  sticker,
  create: (ctx) => new SpeciesComeback(ctx),
};
