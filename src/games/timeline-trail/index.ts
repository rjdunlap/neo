/**
 * Timeline Trail: hang pictures of one island place on a clothesline between a long-ago post and a now post (level 1
 * taps or drags the older of two to the left post, level 2 drags a third picture into one of three gaps, level 3 grows a
 * line of four one card at a time), then watch the finished line play as a flipbook of the place growing.
 * Rules: ./logic.ts; definition: docs/definitions/timeline-trail.md.
 */
import { Container, type FederatedPointerEvent, Graphics, Rectangle } from 'pixi.js';
import { swatch, type ColorName } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import type { LineId } from '../../content/voice-script';
import { card as cardArt, frameArt, gap as gapArt, iconArt, post as postArt, rope, stickerArt } from './art';
import { CARD, centre, lineLayout, nextCard, PLACE_IDS, PLACES, place, planFor, POST_PICTURE_Y, roundFor, Tally, validGaps, type LineLayout, type Pt, type Round } from './logic';

const LEVELS: BandLevels = {
  preschool: { min: 1, max: 2 },
  prek: { min: 1, max: 3 },
  school: { min: 2, max: 3 },
};

/** A finger that travels less than this before lifting tapped the card rather than dragging it. */
const TAP_TRAVEL = 14;
/** A drop this close to a gap's centre pegs the card there. */
const REACH = 135;

interface CardNode {
  stage: number;
  node: Container;
  handle: DragHandle;
  hung: boolean;
}

class TimelineTrail implements Game {
  readonly round: Round;
  readonly tally = new Tally();
  line: number[];
  loose: number[];
  finished = false;
  busy = false;
  private alive = true;
  private clock = 0;
  private view: View;
  private relayout = false;
  layoutNow: LineLayout | null = null;
  private readonly petColor: ColorName;

  private readonly backdrop: Backdrop;
  private readonly board = new Container();
  private readonly ropeG = new Graphics();
  private readonly glow = new Graphics();
  cards: CardNode[] = [];
  gapNodes: Container[] = [];
  frame: Container | null = null;
  private nearGap: number | null = null;
  private dragging: CardNode | null = null;
  /** How far the finger itself has moved since it touched the card in hand (the card rides 40 above it). */
  private travel = 0;
  private downAt: Pt | null = null;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.round = roundFor(ctx.level, ctx.rng);
    this.line = [...this.round.hung];
    this.loose = [...this.round.loose];
    const rig = ctx.companion();
    this.petColor = rig.color;
    rig.destroy({ children: true });
    this.backdrop = new Backdrop({ sky: [0xbfe3ff, 0xfff3dc], hills: [0xb9e3a6, 0xa2d98f], horizon: 0.62, clouds: 3, sun: true, seed: 211 }, ctx.view);
    this.ropeG.eventMode = 'none';
    this.glow.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.board);
  }

  private get level() {
    return this.round.level;
  }

  private get placeName() {
    return PLACES[this.round.place].name;
  }

  start() {
    this.build();
    void this.ctx.instruct(`trail.instruct.${this.level}` as LineId, { place: this.placeName });
  }

  destroy() {
    this.alive = false;
    for (const c of this.cards) c.handle.destroy();
    this.cards = [];
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    if (!this.layoutNow && !this.cards.length) return;
    if (this.frame) {
      // Mid-flipbook: the frame follows the new view; the rest is already out of play.
      const l = lineLayout(this.round, this.line, this.loose.length, v);
      if (l) { this.layoutNow = l; this.frame.position.copyFrom(centre(l.frame)); }
      return;
    }
    if (this.dragging || this.busy || this.finished) { this.relayout = true; return; }
    this.build();
  }

  // ——— Building ———

  /** The whole board from the model: posts, rope, gaps, hung cards and the tray. */
  private build() {
    this.relayout = false;
    for (const c of this.cards) c.handle.destroy();
    this.cards = [];
    this.gapNodes = [];
    this.frame = null;
    this.nearGap = null;
    this.dragging = null;
    this.glow.removeFromParent();
    this.ropeG.removeFromParent();
    for (const c of this.board.removeChildren()) c.destroy({ children: true });
    this.ropeG.clear();
    if (this.finished) return;
    const l = lineLayout(this.round, this.line, this.loose.length, this.view);
    this.layoutNow = l;
    if (!l) return;
    const stages = PLACES[this.round.place].stages;

    // Posts, each wearing its small picture: long ago faded on the left, now bright on the right.
    const postPics: [number, boolean][] = [[0, true], [stages.length - 1, false]];
    [l.posts.left, l.posts.right].forEach((r, i) => {
      const p = postArt(r.w, r.h);
      p.position.set(r.x + r.w / 2, r.y + r.h);
      const [stage, sepia] = postPics[i];
      const pic = this.makeCard(stage, 96, sepia);
      pic.position.set(r.x + r.w / 2, r.y + POST_PICTURE_Y + 48);
      this.board.addChild(p, pic);
    });
    // The rope: one line between the post tops, and one along each row (post to post where the posts reach it, else
    // just past the row's ends).
    const cx = (r: { x: number; w: number }) => r.x + r.w / 2;
    rope(this.ropeG, { x: cx(l.posts.left), y: l.posts.left.y + 12 }, { x: cx(l.posts.right), y: l.posts.right.y + 12 }, 18);
    if (this.level !== 1) {
      for (const y of l.rows) {
        const items = [...l.cards, ...l.gaps].filter((r) => Math.abs(r.y + r.h / 2 - y) < 1);
        const ry = y - CARD / 2 + 4;
        const within = ry >= l.posts.left.y && ry <= l.posts.left.y + l.posts.left.h;
        const x0 = within ? cx(l.posts.left) : Math.min(...items.map((r) => r.x)) - 24;
        const x1 = within ? cx(l.posts.right) : Math.max(...items.map((r) => r.x + r.w)) + 24;
        rope(this.ropeG, { x: x0, y: ry }, { x: x1, y: ry }, 10);
      }
    }
    this.board.addChild(this.ropeG);

    // Gaps.
    for (const r of l.gaps) {
      const node = new Container();
      node.eventMode = 'none';
      node.position.copyFrom(centre(r));
      node.addChild(gapArt(r.w, r.h, false, false));
      this.board.addChild(node);
      this.gapNodes.push(node);
    }
    // Hung cards, in line order.
    this.line.forEach((stage, i) => {
      const r = l.cards[i];
      const node = this.makeCard(stage, CARD, false);
      node.position.copyFrom(centre(r));
      this.board.addChild(node);
    });
    // Loose cards in the tray, draggable.
    this.loose.forEach((stage, i) => {
      const r = l.tray[i];
      const node = new Container();
      node.addChild(this.makeCard(stage, CARD, false));
      node.hitArea = new Rectangle(-CARD / 2 - 6, -CARD / 2 - 6, CARD + 12, CARD + 12);
      node.position.copyFrom(centre(r));
      this.board.addChild(node);
      const c: CardNode = { stage, node, hung: false, handle: null as unknown as DragHandle };
      c.handle = draggable(node, this.ctx.tw, {
        onPick: () => this.picked(c),
        onMove: (x, y) => this.moved(x, y),
        onDrop: (x, y) => this.dropped(c, x, y),
      });
      // The finger's own travel decides tap or drag; the card's position lifts away from it while it is held.
      node.on('pointerdown', (e: FederatedPointerEvent) => { this.downAt = this.board.toLocal(e.global); this.travel = 0; });
      node.on('globalpointermove', (e: FederatedPointerEvent) => {
        if (!c.handle.dragging || !this.downAt) return;
        const q = this.board.toLocal(e.global);
        this.travel = Math.max(this.travel, Math.hypot(q.x - this.downAt.x, q.y - this.downAt.y));
      });
      this.cards.push(c);
    });
    this.board.addChild(this.glow);
    this.redrawGaps();
  }

  /** A picture card; the nest's now card carries the companion itself. */
  private makeCard(stage: number, size: number, sepia: boolean): Container {
    const stages = PLACES[this.round.place].stages;
    const rig = this.round.place === 'nest' && stage === stages.length - 1 ? this.ctx.companion() : undefined;
    return cardArt(this.round.place, stage, size, this.petColor, { sepia, rig });
  }

  /** Where a card's valid gap glows: its gap index, or null. */
  private glowGap(): number | null {
    const stage = this.tally.glowing;
    if (stage === null || this.line.includes(stage)) return null;
    return validGaps(this.round, this.line, stage)[0] ?? null;
  }

  private redrawGaps() {
    const l = this.layoutNow;
    if (!l) return;
    const lit = this.glowGap();
    this.gapNodes.forEach((node, i) => {
      for (const c of node.removeChildren()) c.destroy();
      node.addChild(gapArt(l.gaps[i].w, l.gaps[i].h, this.nearGap === i, lit === i));
    });
  }

  // ——— Dragging and dropping ———

  private picked(c: CardNode) {
    if (this.finished || this.busy) { c.handle.enabled = false; return; }
    this.dragging = c;
    sfx.pop(6);
    // Washing on the line sways a little when lifted.
    this.ctx.tw.kill(c.node);
    void this.ctx.tw.to(c.node, { rotation: 0.06 }, { duration: 0.18, ease: ease.outQuad }).then(() => { if (this.alive && c.handle.dragging) void this.ctx.tw.to(c.node, { rotation: -0.04 }, { duration: 0.3 }); });
  }

  private moved(x: number, y: number) {
    const i = this.nearestGap(x, y);
    if (i !== this.nearGap) { this.nearGap = i; this.redrawGaps(); }
  }

  private nearestGap(x: number, y: number): number | null {
    const l = this.layoutNow;
    if (!l) return null;
    let best: number | null = null;
    let bd = REACH;
    l.gaps.forEach((r, i) => {
      const p = centre(r);
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  }

  private dropped(c: CardNode, x: number, y: number): boolean {
    this.dragging = null;
    this.nearGap = null;
    this.ctx.tw.kill(c.node);
    c.node.rotation = 0;
    if (this.finished || this.busy) return false;
    const tapped = this.travel < TAP_TRAVEL;
    this.travel = 0;
    this.downAt = null;
    if (tapped) {
      // A tap: at level 1 it answers "long ago"; otherwise it says what the picture shows (free).
      if (this.level === 1) { this.answer(c, 0); return this.line.includes(c.stage); }
      void this.ctx.say(`trail.card.${PLACES[this.round.place].stages[c.stage].id}` as LineId);
      this.redrawGaps();
      return false;
    }
    const gap = this.nearestGap(x, y);
    if (gap === null) {
      // Let go away from every gap: it settles back, nothing said.
      this.redrawGaps();
      if (this.relayout) { this.ctx.tw.kill(c.node.scale); this.build(); return true; }
      return false;
    }
    this.answer(c, gap);
    return this.line.includes(c.stage);
  }

  /** Hang `c` in `gap`: the valid gap pegs it (and at level 1 the other card takes the other post); any other slides back with its reason. */
  private answer(c: CardNode, gap: number) {
    const stages = PLACES[this.round.place].stages;
    const result = place(this.round, this.line, c.stage, gap);
    if (!result.ok) {
      const { lit } = this.tally.missed(c.stage, gap);
      sfx.boing();
      const line: LineId = this.level !== 1 ? 'trail.other' : c.stage === Math.max(...this.round.cards) ? 'trail.not-first' : 'trail.not-now';
      void this.ctx.say(line, { reason: result.reason, place: this.placeName });
      if (lit) void this.ctx.say('trail.hint-glow');
      this.redrawGaps();
      return;
    }
    this.tally.hung(c.stage);
    this.line = result.line;
    this.loose = this.loose.filter((s) => s !== c.stage);
    c.hung = true;
    c.handle.enabled = false;
    this.ctx.tw.kill(c.node);
    this.ctx.tw.kill(c.node.scale);
    sfx.bell(4 + this.line.length, 0.3);
    void this.ctx.say('trail.yes', { caption: stages[c.stage].caption });
    if (this.level === 1 && this.loose.length) {
      // The other picture takes the other post by itself.
      const other = this.loose[0];
      this.tally.hung(other);
      this.line = place(this.round, this.line, other, validGaps(this.round, this.line, other)[0]).line as number[];
      this.loose = [];
    }
    this.build();
    if (!this.loose.length) void this.flipbook();
  }

  // ——— The flipbook ———

  /** The finished line plays stage by stage in the big frame, then the round ends with one sticker. */
  private async flipbook() {
    const l = this.layoutNow;
    if (!l || this.busy) return;
    this.busy = true;
    const hold = this.ctx.demo ? 0.45 : 0.85;
    await this.ctx.tw.wait(0.7);
    if (!this.alive) return;
    void this.ctx.say('trail.flipbook', { place: this.placeName });
    const frame = new Container();
    frame.eventMode = 'none';
    frame.position.copyFrom(centre(l.frame));
    frame.addChild(frameArt(l.frame.w));
    frame.scale.set(0.2);
    this.board.addChild(frame);
    this.frame = frame;
    await this.ctx.tw.to(frame.scale, { x: 1, y: 1 }, { duration: 0.35, ease: ease.outBack });
    if (!this.alive) return;
    const inner = l.frame.w - 24;
    const steps = [4, 5, 7, 8, 9];
    let page: Container | null = null;
    for (const [i, stage] of this.round.cards.entries()) {
      if (page) { page.destroy({ children: true }); page = null; }
      page = this.makeCard(stage, inner, false);
      page.scale.x = 0.05;
      frame.addChild(page);
      sfx.marimba(steps[Math.min(i, steps.length - 1)], 0.4);
      await this.ctx.tw.to(page.scale, { x: 1 }, { duration: 0.28, ease: ease.outQuad });
      if (!this.alive) return;
      await this.ctx.tw.wait(hold);
      if (!this.alive) return;
    }
    sfx.tada();
    this.ctx.pet.cheer();
    this.ctx.particles.burst(frame.x, frame.y - l.frame.h / 2, { colors: [swatch.yellow.fill, swatch.teal.fill, 0xffffff], count: 14 });
    await this.ctx.say('trail.done');
    if (!this.alive) return;
    this.finished = true;
    this.ctx.finish({ misses: this.tally.misses, hints: this.tally.hints });
  }

  // ——— Help, restart ———

  hintLabel = 'Show a hint';

  /** The pause sheet's hint: the gap for the card in hand (or the oldest loose one) glows, once per card. */
  askForHint() {
    if (this.finished || this.busy) return;
    const stage = this.dragging?.stage ?? nextCard(this.round, this.loose);
    if (stage === null) return;
    this.tally.help(stage);
    this.redrawGaps();
    void this.ctx.say('trail.help');
  }

  /** The pause sheet's Start again: the round's first state; misses and hints stay. */
  restart() {
    if (this.finished || this.busy) return;
    this.line = [...this.round.hung];
    this.loose = [...this.round.loose];
    this.build();
  }

  update(dt: number) {
    this.clock += dt;
    if (this.relayout && !this.dragging && !this.busy && !this.finished) this.build();
    this.glow.clear();
    const l = this.layoutNow;
    const lit = this.glowGap();
    if (lit === null || !l || this.finished || this.busy) return;
    const r = l.gaps[lit];
    const k = 1 + 0.05 * Math.sin(this.clock * 5);
    const p = centre(r);
    this.glow.roundRect(p.x - (r.w / 2 + 10) * k, p.y - (r.h / 2 + 10) * k, (r.w + 20) * k, (r.h + 20) * k, 24).stroke({ width: 7, color: swatch.yellow.fill, alpha: 0.9 });
  }

  /** The ghost finger: level 1 taps the long-ago card; otherwise it carries the oldest loose card to its gap. */
  autotouch(): TouchIntent | null {
    if (this.finished || this.busy || !this.layoutNow) return null;
    const stage = nextCard(this.round, this.loose);
    if (stage === null) return null;
    const c = this.cards.find((k) => k.stage === stage && !k.hung && !k.handle.dragging);
    if (!c) return null;
    if (this.level === 1) return { tap: { on: c.node } };
    const [gap] = validGaps(this.round, this.line, stage);
    const to = centre(this.layoutNow.gaps[gap]);
    return { drag: { on: c.node }, to: { on: this.ctx.stage, x: to.x, y: to.y }, pause: 0.4 };
  }
}

class TrailIcon extends WigglyIcon {
  constructor() {
    super(iconArt());
  }
}

/** A seeded place card pegged on a short line. */
function sticker(seed: number): Container {
  const rng = new Rng(seed);
  return stickerArt(rng.pick(PLACE_IDS), rng.int(0, 2), rng.pick(['teal', 'pink', 'blue', 'green', 'orange', 'purple'] as const));
}

export const timelineTrail: GameModule = {
  id: 'timeline-trail',
  name: 'Timeline Trail',
  titleLine: 'game.timeline-trail',
  region: 'story-grove',
  skills: ['sequencing', 'then-and-now', 'cause-and-effect'],
  bands: ['preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  coplayHint: 'While {name} hangs a picture, ask what changed between this picture and that one.',
  offScreen: 'Look at a baby photo and a recent photo of the same person, or plant a seed, and talk about what looks different, then and now.',
  hubIcon: () => new TrailIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new TimelineTrail(ctx),
};
