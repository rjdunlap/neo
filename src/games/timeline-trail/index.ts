/**
 * Timeline Trail: hang pictures of one island place on a clothesline between a long-ago post and a now post (level 1
 * taps or drags the older of two to the left post, level 2 drags a third picture into one of three gaps, level 3 grows a
 * line of four one card at a time, level 4 hangs a second place's pictures by the little clue picture in each card's
 * corner, level 5 grows a line of four and then pins the one thing that is in every picture to the "still here"
 * ribbon, level 6 ends with a misty picture that fits two gaps, either of them right, level 7 grows a line of four and
 * then one picture grows big and she taps the part of it that proves when it is from), then watch the finished line
 * play as a flipbook of the place growing, in the order she hung it.
 * Rules: ./logic.ts; definitions: docs/definitions/timeline-trail.md and timeline-trail-5-7.md.
 */
import { Container, type FederatedPointerEvent, Graphics, Rectangle } from 'pixi.js';
import { swatch, type ColorName } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import type { LineId } from '../../content/voice-script';
import {
  card as cardArt,
  chip as chipArt,
  frameArt,
  gap as gapArt,
  iconArt,
  post as postArt,
  ribbon as ribbonArt,
  rope,
  SPARKLE_AT,
  sparkle,
  stickerArt,
} from './art';
import {
  LEVELS,
  asking,
  bare,
  CARD,
  CARD_HIT,
  centre,
  chipReason,
  faceOf,
  FRAME_BORDER,
  inTray,
  lineLayout,
  mistHides,
  MISTY,
  nextCard,
  PLACE_IDS,
  PLACES,
  place,
  planFor,
  POST_PICTURE_Y,
  proofLayout,
  proving,
  roundFor,
  spotAt,
  spotReason,
  Tally,
  validGaps,
  type LaterPlace,
  type LineLayout,
  type ProofLayout,
  type ProofPlace,
  type Pt,
  type Round,
} from './logic';

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

interface ChipNode {
  element: string;
  node: Container;
  handle: DragHandle;
}

/** A chip let go this close to the ribbon's edge still pins (the chip rides above the finger). */
const RIBBON_REACH = 40;

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
  /** Level 5: the three chips while the question is open, and whether the right one is pinned to the ribbon. */
  chipNodes: ChipNode[] = [];
  pinned = false;
  private ribbonNode: Container | null = null;
  private nearRibbon = false;
  /** Level 7: the question is open (the big picture is up and waits for a tap), and whether it has been answered. */
  questioning = false;
  proved = false;
  proof: ProofLayout | null = null;
  /** The big picture's frame, which takes the taps, and the small card before it. */
  proofNode: Container | null = null;
  beforeNode: Container | null = null;
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
    this.backdrop = new Backdrop(
      {
        sky: [0xbfe3ff, 0xfff3dc],
        hills: [0xb9e3a6, 0xa2d98f],
        horizon: 0.62,
        clouds: 3,
        sun: true,
        seed: 211,
      },
      ctx.view,
    );
    this.ropeG.eventMode = 'none';
    this.glow.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.board);
  }

  /** A card or a chip is being carried: a rebuild waits until it is let go, so the thing in hand is never destroyed. */
  private get inHand() {
    return !!this.dragging || this.chipNodes.some((c) => c.handle.dragging);
  }

  private get level() {
    return this.round.level;
  }

  /** Spoken in the instruction and the flipbook: one place, or level 4's "shore and the tree". */
  private get placeName() {
    const name = PLACES[this.round.place].name;
    return this.round.other ? `${name} and the ${PLACES[this.round.other].name}` : name;
  }

  /** What card `n` shows, spoken: its caption. */
  private captionOf(n: number) {
    const f = faceOf(this.round, n);
    return PLACES[f.place].stages[f.stage];
  }

  start() {
    this.build();
    void this.ctx.instruct(`trail.instruct.${this.level}` as LineId, { place: this.placeName });
  }

  destroy() {
    this.alive = false;
    for (const c of [...this.cards, ...this.chipNodes]) c.handle.destroy();
    this.cards = [];
    this.chipNodes = [];
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    if (!this.layoutNow && !this.cards.length) return;
    if (this.frame) {
      // Mid-flipbook: the frame follows the new view; the rest is already out of play.
      const l = lineLayout(this.round, this.line, inTray(this.round, this.loose).length, v);
      if (l) {
        this.layoutNow = l;
        this.frame.position.copyFrom(centre(l.frame));
      }
      return;
    }
    if (this.inHand || this.busy || this.finished) {
      this.relayout = true;
      return;
    }
    this.build();
  }

  // ——— Building ———

  /** The whole board from the model: posts, rope, gaps, hung cards and the tray. */
  private build() {
    this.relayout = false;
    for (const c of [...this.cards, ...this.chipNodes]) c.handle.destroy();
    this.cards = [];
    this.chipNodes = [];
    this.ribbonNode = null;
    this.nearRibbon = false;
    this.gapNodes = [];
    this.frame = null;
    this.nearGap = null;
    this.dragging = null;
    if (this.proofNode) this.ctx.tw.kill(this.proofNode.scale);
    this.proofNode = null;
    this.beforeNode = null;
    this.proof = null;
    this.glow.removeFromParent();
    this.ropeG.removeFromParent();
    for (const c of this.board.removeChildren()) c.destroy({ children: true });
    this.ropeG.clear();
    if (this.finished) return;
    const tray = inTray(this.round, this.loose);
    const l = lineLayout(this.round, this.line, tray.length, this.view);
    this.layoutNow = l;
    if (!l) return;
    const stages = PLACES[this.round.place].stages;

    // Posts, each wearing its small picture: long ago faded on the left, now bright on the right.
    const postPics: [number, boolean][] = [
      [0, true],
      [stages.length - 1, false],
    ];
    [l.posts.left, l.posts.right].forEach((r, i) => {
      const p = postArt(r.w, r.h);
      p.position.set(r.x + r.w / 2, r.y + r.h);
      const [stage, sepia] = postPics[i];
      // Level 4's posts carry the clue too, so long ago and now show both places on the line.
      const clue = this.round.other ? { place: this.round.other, stage } : undefined;
      const pic = cardArt(this.round.place, stage, 96, this.petColor, { sepia, clue });
      pic.position.set(r.x + r.w / 2, r.y + POST_PICTURE_Y + 48);
      this.board.addChild(p, pic);
    });
    // The rope: one line between the post tops, and one along each row (post to post where the posts reach it, else
    // just past the row's ends).
    const cx = (r: { x: number; w: number }) => r.x + r.w / 2;
    rope(
      this.ropeG,
      { x: cx(l.posts.left), y: l.posts.left.y + 12 },
      { x: cx(l.posts.right), y: l.posts.right.y + 12 },
      18,
    );
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
    // Loose cards in the tray, draggable (level 6's misty card only once the other is hung).
    tray.forEach((stage, i) => {
      const r = l.tray[i];
      const node = new Container();
      node.addChild(this.makeCard(stage, CARD, false));
      node.hitArea = new Rectangle(-CARD_HIT / 2, -CARD_HIT / 2, CARD_HIT, CARD_HIT);
      node.position.copyFrom(centre(r));
      this.board.addChild(node);
      const c: CardNode = { stage, node, hung: false, handle: null as unknown as DragHandle };
      c.handle = draggable(node, this.ctx.tw, {
        onPick: () => this.picked(c),
        onMove: (x, y) => this.moved(x, y),
        onDrop: (x, y) => this.dropped(c, x, y),
      });
      // The finger's own travel decides tap or drag; the card's position lifts away from it while it is held.
      node.on('pointerdown', (e: FederatedPointerEvent) => {
        this.downAt = this.board.toLocal(e.global);
        this.travel = 0;
      });
      node.on('globalpointermove', (e: FederatedPointerEvent) => {
        if (!c.handle.dragging || !this.downAt) return;
        const q = this.board.toLocal(e.global);
        this.travel = Math.max(this.travel, Math.hypot(q.x - this.downAt.x, q.y - this.downAt.y));
      });
      this.cards.push(c);
    });
    if (l.ribbon) this.buildRibbon(l);
    if (this.questioning) this.buildQuestion();
    this.board.addChild(this.glow);
    this.redrawGaps();
  }

  /** Level 5's question: the ribbon under the full line, and either the three chips or the pinned one. */
  private buildRibbon(l: LineLayout) {
    const r = l.ribbon!;
    const ribbon = new Container();
    ribbon.eventMode = 'none';
    ribbon.position.copyFrom(centre(r));
    this.board.addChild(ribbon);
    this.ribbonNode = ribbon;
    this.redrawRibbon();
    if (this.pinned) return;
    (this.round.chips ?? []).forEach((element, i) => {
      const at = l.chips[i];
      const node = new Container();
      node.addChild(chipArt(element, CARD));
      node.hitArea = new Rectangle(-CARD_HIT / 2, -CARD_HIT / 2, CARD_HIT, CARD_HIT);
      node.position.copyFrom(centre(at));
      this.board.addChild(node);
      const c: ChipNode = { element, node, handle: null as unknown as DragHandle };
      c.handle = draggable(node, this.ctx.tw, {
        onPick: () => {
          if (this.finished || this.busy) c.handle.enabled = false;
          else sfx.pop(6);
        },
        onMove: (x, y) => {
          const near = this.onRibbon(x, y);
          if (near !== this.nearRibbon) {
            this.nearRibbon = near;
            this.redrawRibbon();
          }
        },
        onDrop: (x, y) => this.droppedChip(c, x, y),
      });
      this.chipNodes.push(c);
    });
  }

  private redrawRibbon() {
    const r = this.layoutNow?.ribbon;
    const node = this.ribbonNode;
    if (!r || !node) return;
    for (const c of node.removeChildren()) c.destroy({ children: true });
    node.addChild(ribbonArt(r.w, r.h, this.nearRibbon));
    if (this.pinned && this.round.still) {
      const pin = chipArt(this.round.still, CARD);
      pin.scale.set((r.h - 12) / CARD);
      node.addChild(pin);
    }
  }

  private onRibbon(x: number, y: number): boolean {
    const r = this.layoutNow?.ribbon;
    if (!r) return false;
    const k = RIBBON_REACH;
    return x >= r.x - k && x <= r.x + r.w + k && y >= r.y - k && y <= r.y + r.h + k;
  }

  /** A chip tapped, or let go on the ribbon, answers; let go anywhere else it floats back, nothing said or counted. */
  private droppedChip(c: ChipNode, x: number, y: number): boolean {
    if (this.nearRibbon) {
      this.nearRibbon = false;
      this.redrawRibbon();
    }
    if (this.finished || this.busy || this.pinned) return false;
    if (!c.handle.tapped && !this.onRibbon(x, y)) {
      if (this.relayout) {
        this.build();
        return true;
      }
      return false;
    }
    const round = this.round;
    if (c.element !== round.still) {
      const { lit } = this.tally.missed(Tally.CHIP_SET, round.chips!.indexOf(c.element));
      sfx.boing();
      void this.ctx.say('trail.still-no', { reason: chipReason(round.place, c.element) });
      if (lit) void this.ctx.say('trail.still-glow');
      return false;
    }
    this.tally.hung(Tally.CHIP_SET);
    this.pinned = true;
    sfx.bell(9, 0.3);
    void this.ctx.say('trail.still-yes', { thing: c.element });
    this.build();
    void this.flipbook();
    return true;
  }

  // ——— Level 7's question ———

  /** The caption of the picture before the asked one, read after "the". */
  private get beforeCaption() {
    return bare(PLACES[this.round.place].stages[this.round.ask! - 1].caption);
  }

  /** The line is full: the asked picture grows big in the frame, and the question becomes the instruction. */
  private openQuestion() {
    this.questioning = true;
    this.build();
    if (!this.proof) {
      // A view too small for the big picture and the card before it: no question, straight to the flipbook.
      this.questioning = false;
      this.proved = true;
      void this.flipbook();
      return;
    }
    if (this.proofNode) {
      // The picture flies up into the frame; it takes taps from the start.
      this.proofNode.scale.set(0.3);
      void this.ctx.tw.to(this.proofNode.scale, { x: 1, y: 1 }, { duration: 0.35, ease: ease.outBack });
    }
    sfx.pop(8);
    void this.ctx.instruct('trail.proof-ask', { caption: this.beforeCaption });
  }

  /** The dimmed line, the big picture in its frame (the tap target) and the card before it, from the model. */
  private buildQuestion() {
    const p = proofLayout(this.round, this.view);
    this.proof = p;
    if (!p) return;
    const ask = this.round.ask!;
    // The line under the frame dims; nothing on it takes input while the question is open.
    const dim = new Graphics().rect(0, 0, this.view.w, this.view.h).fill({ color: 0x2b3a4a, alpha: 0.35 });
    dim.eventMode = 'none';
    this.board.addChild(dim);

    const frame = new Container();
    const at = centre(p.frame);
    frame.position.copyFrom(at);
    const inner = p.frame.w - FRAME_BORDER * 2;
    const f = faceOf(this.round, ask);
    frame.addChild(frameArt(p.frame.w), cardArt(f.place, f.stage, inner, this.petColor, { bare: true }));
    frame.hitArea = new Rectangle(-p.frame.w / 2, -p.frame.h / 2, p.frame.w, p.frame.h);
    onTap(frame, (e) => {
      const q = this.board.toLocal(e.global);
      this.tappedPicture(q);
    });
    this.board.addChild(frame);
    this.proofNode = frame;

    const before = new Container();
    before.position.copyFrom(centre(p.before));
    before.addChild(this.makeCard(ask - 1, CARD, false));
    before.hitArea = new Rectangle(-CARD / 2, -CARD / 2, CARD, CARD);
    onTap(before, () => {
      if (this.finished || this.busy) return;
      sfx.pop(5);
      void this.ctx.say(`trail.card.${this.captionOf(ask - 1).id}` as LineId);
    });
    this.board.addChild(before);
    this.beforeNode = before;
  }

  /**
   * A tap on the big picture: a proving spot answers; any other spot is a miss with its reason (the same thing again
   * repeats the reason and counts nothing); any other part of the picture repeats the question, free.
   */
  private tappedPicture(q: Pt) {
    const p = this.proof;
    if (!p || !this.questioning || this.finished || this.busy) return;
    const round = this.round;
    const place = round.place as ProofPlace;
    const spot = spotAt(p.spots, q);
    if (!spot) {
      sfx.pop(4);
      void this.ctx.say('trail.proof-again', { caption: this.beforeCaption });
      return;
    }
    const reason = spotReason(place, round.ask!, spot.element);
    if (!spot.proves) {
      const elements = [...new Set(p.spots.map((r) => r.element))];
      const { lit } = this.tally.missed(Tally.PROOF, elements.indexOf(spot.element));
      sfx.boing();
      void this.ctx.say('trail.proof-no', { reason });
      if (lit) void this.ctx.say('trail.proof-glow');
      return;
    }
    this.tally.hung(Tally.PROOF);
    this.questioning = false;
    this.proved = true;
    sfx.bell(9, 0.3);
    this.ctx.particles.burst(spot.x + spot.w / 2, spot.y + spot.h / 2, {
      colors: [swatch.yellow.fill, 0xffffff],
      count: 10,
    });
    void this.ctx.say('trail.proof-yes', { reason });
    this.build();
    void this.flipbook();
  }

  /** A picture card; the nest's now card carries the companion itself, level 4's cards their little clue picture, level 6's misty card its veil. */
  private makeCard(n: number, size: number, sepia: boolean): Container {
    const f = faceOf(this.round, n);
    const last = PLACES[f.place].stages.length - 1;
    const rig = f.place === 'nest' && f.stage === last ? this.ctx.companion() : undefined;
    return cardArt(f.place, f.stage, size, this.petColor, { sepia, rig, clue: f.clue, mist: !!f.could });
  }

  /** Where a card's valid gap glows: its gap index, or both for the misty card; none when nothing glows. */
  private glowGaps(): number[] {
    const stage = this.tally.glowing;
    if (stage === null || stage < 0 || this.line.includes(stage)) return [];
    return validGaps(this.round, this.line, stage);
  }

  private redrawGaps() {
    const l = this.layoutNow;
    if (!l) return;
    const lit = this.glowGaps();
    this.gapNodes.forEach((node, i) => {
      for (const c of node.removeChildren()) c.destroy();
      node.addChild(gapArt(l.gaps[i].w, l.gaps[i].h, this.nearGap === i, lit.includes(i)));
    });
  }

  // ——— Dragging and dropping ———

  private picked(c: CardNode) {
    if (this.finished || this.busy) {
      c.handle.enabled = false;
      return;
    }
    this.dragging = c;
    sfx.pop(6);
    // Washing on the line sways a little when lifted.
    this.ctx.tw.kill(c.node);
    void this.ctx.tw.to(c.node, { rotation: 0.06 }, { duration: 0.18, ease: ease.outQuad }).then(() => {
      if (this.alive && c.handle.dragging)
        void this.ctx.tw.to(c.node, { rotation: -0.04 }, { duration: 0.3 });
    });
  }

  private moved(x: number, y: number) {
    const i = this.nearestGap(x, y);
    if (i !== this.nearGap) {
      this.nearGap = i;
      this.redrawGaps();
    }
  }

  private nearestGap(x: number, y: number): number | null {
    const l = this.layoutNow;
    if (!l) return null;
    let best: number | null = null;
    let bd = REACH;
    l.gaps.forEach((r, i) => {
      const p = centre(r);
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < bd) {
        bd = d;
        best = i;
      }
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
      if (this.level === 1) {
        this.answer(c, 0);
        return this.line.includes(c.stage);
      }
      const f = faceOf(this.round, c.stage);
      if (f.could)
        void this.ctx.say('trail.mist', {
          caption: this.captionOf(c.stage).caption,
          hides: mistHides(f.place, f.stage),
        });
      else if (f.clue)
        void this.ctx.say('trail.clue', {
          caption: this.captionOf(c.stage).caption,
          clue: PLACES[f.clue.place].stages[f.clue.stage].caption,
        });
      else void this.ctx.say(`trail.card.${this.captionOf(c.stage).id}` as LineId);
      this.redrawGaps();
      return false;
    }
    const gap = this.nearestGap(x, y);
    if (gap === null) {
      // Let go away from every gap: it settles back, nothing said.
      this.redrawGaps();
      if (this.relayout) {
        this.ctx.tw.kill(c.node.scale);
        this.build();
        return true;
      }
      return false;
    }
    this.answer(c, gap);
    return this.line.includes(c.stage);
  }

  /** Hang `c` in `gap`: the valid gap pegs it (and at level 1 the other card takes the other post); any other slides back with its reason. */
  private answer(c: CardNode, gap: number) {
    const result = place(this.round, this.line, c.stage, gap);
    if (!result.ok) {
      const { lit } = this.tally.missed(c.stage, gap);
      sfx.boing();
      const line: LineId =
        this.level !== 1
          ? 'trail.other'
          : c.stage === Math.max(...this.round.cards)
            ? 'trail.not-first'
            : 'trail.not-now';
      void this.ctx.say(line, { reason: result.reason, place: this.placeName });
      if (lit) void this.ctx.say(c.stage === MISTY ? 'trail.both-glow' : 'trail.hint-glow');
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
    // The misty card in either of its gaps: both are right, and the line keeps the side she chose.
    if (c.stage === MISTY) void this.ctx.say('trail.both-fit');
    else void this.ctx.say('trail.yes', { caption: this.captionOf(c.stage).caption });
    if (this.level === 1 && this.loose.length) {
      // The other picture takes the other post by itself.
      const other = this.loose[0];
      this.tally.hung(other);
      this.line = place(this.round, this.line, other, validGaps(this.round, this.line, other)[0])
        .line as number[];
      this.loose = [];
    }
    this.build();
    if (this.loose.length) {
      // Level 6: the misty picture comes out now, and the pet's repeated instruction turns to it.
      if (this.loose[0] === MISTY) void this.ctx.instruct('trail.mist-ask');
      return;
    }
    // Level 5 asks what is still here before the flipbook; the question becomes the instruction the pet repeats.
    if (asking(this.round, this.line)) void this.ctx.instruct('trail.still-ask');
    else if (proving(this.round, this.line) && !this.proved) this.openQuestion();
    else void this.flipbook();
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
    // The line as she hung it: stage order at every level but 6, where the misty picture plays on the side she chose.
    for (const [i, stage] of this.line.entries()) {
      if (page) {
        page.destroy({ children: true });
        page = null;
      }
      page = this.makeCard(stage, inner, false);
      if (this.pinned) {
        // Level 5: what is still here gets a soft sparkle in every picture.
        const at = SPARKLE_AT[this.round.place as LaterPlace];
        const spark = sparkle(inner * 0.07);
        spark.position.set((at.x * inner) / 100, (at.y * inner) / 100);
        page.addChild(spark);
      }
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
    this.ctx.particles.burst(frame.x, frame.y - l.frame.h / 2, {
      colors: [swatch.yellow.fill, swatch.teal.fill, 0xffffff],
      count: 14,
    });
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
    if (asking(this.round, this.line)) {
      // The right chip glows, once for the chip set.
      this.tally.help(Tally.CHIP_SET);
      void this.ctx.say('trail.still-help');
      return;
    }
    if (this.questioning) {
      // The proving spots glow, once for the question.
      this.tally.help(Tally.PROOF);
      void this.ctx.say('trail.proof-help');
      return;
    }
    const stage = this.dragging?.stage ?? nextCard(this.round, this.loose);
    if (stage === null) return;
    this.tally.help(stage);
    this.redrawGaps();
    void this.ctx.say(stage === MISTY ? 'trail.both-glow' : 'trail.help');
  }

  /** The pause sheet's Start again: the round's first state; misses and hints stay. */
  restart() {
    if (this.finished || this.busy) return;
    this.line = [...this.round.hung];
    this.loose = [...this.round.loose];
    this.pinned = false;
    this.questioning = false;
    this.proved = false;
    this.build();
    // The repeated instruction goes back to the round's first one (levels 5 to 7 change it part-way through).
    void this.ctx.instruct(`trail.instruct.${this.level}` as LineId, { place: this.placeName });
  }

  update(dt: number) {
    this.clock += dt;
    if (this.relayout && !this.inHand && !this.busy && !this.finished) this.build();
    this.glow.clear();
    const l = this.layoutNow;
    if (!l || this.finished || this.busy) return;
    const chip =
      this.tally.glowing === Tally.CHIP_SET && !this.pinned
        ? l.chips[this.round.chips?.indexOf(this.round.still ?? '') ?? -1]
        : undefined;
    const k = 1 + 0.05 * Math.sin(this.clock * 5);
    const spots =
      this.tally.glowing === Tally.PROOF && this.questioning
        ? (this.proof?.spots.filter((r) => r.proves) ?? [])
        : null;
    for (const r of spots ?? (chip ? [chip] : this.glowGaps().map((i) => l.gaps[i]))) {
      if (!r) continue;
      const p = centre(r);
      this.glow
        .roundRect(p.x - (r.w / 2 + 10) * k, p.y - (r.h / 2 + 10) * k, (r.w + 20) * k, (r.h + 20) * k, 24)
        .stroke({ width: 7, color: swatch.yellow.fill, alpha: 0.9 });
    }
  }

  /**
   * The ghost finger: level 1 taps the long-ago card; otherwise it carries the oldest loose card to its gap (the misty
   * card, last, to the earlier of its two), at level 5 it then drags the still-here chip to the ribbon, and at level 7
   * it then taps the first proving spot of the big picture.
   */
  /** Guided first play points at the bot's next move: `autotouch` here only reads the board. */
  showMove(): TouchIntent | null {
    return this.autotouch();
  }

  autotouch(): TouchIntent | null {
    if (this.finished || this.busy || !this.layoutNow) return null;
    if (this.questioning) {
      const spot = this.proof?.spots.find((r) => r.proves);
      if (!spot || !this.proofNode || !this.proof) return null;
      const c = centre(spot);
      const o = centre(this.proof.frame);
      return { tap: { on: this.proofNode, x: c.x - o.x, y: c.y - o.y }, pause: 0.6 };
    }
    if (this.layoutNow.ribbon) {
      const c = this.chipNodes.find((k) => k.element === this.round.still && !k.handle.dragging);
      if (!c) return null;
      const to = centre(this.layoutNow.ribbon);
      return { drag: { on: c.node }, to: { on: this.ctx.stage, x: to.x, y: to.y }, pause: 0.4 };
    }
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
  return stickerArt(
    rng.pick(PLACE_IDS),
    rng.int(0, 2),
    rng.pick(['teal', 'pink', 'blue', 'green', 'orange', 'purple'] as const),
  );
}

export const timelineTrail: GameModule = {
  id: 'timeline-trail',
  name: 'Timeline Trail',
  titleLine: 'game.timeline-trail',
  region: 'story-grove',
  challenge: 'logic',
  skills: ['sequencing', 'then-and-now', 'cause-and-effect'],
  bands: ['preschool', 'prek', 'school'],
  upright: true,
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.paint,
  coplayHint: 'While {name} hangs a picture, ask what changed between this picture and that one.',
  offScreen:
    'Look at a baby photo and a recent photo of the same person, or plant a seed, and talk about what looks different, then and now.',
  hubIcon: () => new TrailIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new TimelineTrail(ctx),
};
