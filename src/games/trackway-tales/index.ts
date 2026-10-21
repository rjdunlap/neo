import { Container, FederatedPointerEvent, Graphics, Rectangle, Text } from 'pixi.js';
import { cream, ink, swatch, wood } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap, palmOnGlass } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import type { LineId } from '../../content/voice-script';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { FONT } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  accepted, answer, CARD_H, CARD_W, check, CHECK_H, CHECK_W, colX, contacts, glowing, help, informativeColumn, inPuddle, LENS_R, makeRound,
  MOVEMENTS, nearestCol, observed, orderedCols, planFor, PLAY_R, remaining, roundState, rowY, SLOT_H, SLOT_W, stamp, trackLayout,
  type CardId, type Contact, type Heading, type Mark, type Mismatch, type MoveId, type Observed, type Rect, type Round, type RoundState,
  type TrackLayout,
} from './logic';

const LEVELS: BandLevels = { school: { min: 1, max: 3 } };

/** Each level's authored first round leads its first round of a session. */
const authoredShown = new Set<number>();

const MUD = 0xb69a78;
const MUD_DARK = 0x6e5440;
const MUD_LINE = 0x8a6f52;
const CLEAR = 0xf4f0e6;
const GHOST = 0x9a9aa8;
const PUDDLE = 0x7cc7ec;
/** Seconds per contact in a replay; a replay takes about two seconds. */
const STEP = 0.26;
const STEPS = [5, 7, 9, 10, 12, 14, 15, 17];

/* Art -------------------------------------------------------------------------------------------- */

/** A footprint pad about 70 units across with three toes on the side it points to. */
function drawPad(g: Graphics, x: number, y: number, heading: Heading, color: number, alpha = 1, s = 1) {
  g.ellipse(x - heading * 6 * s, y, 24 * s, 18 * s).fill({ color, alpha });
  for (const dy of [-13, 0, 13]) g.circle(x + heading * (24 - Math.abs(dy) * 0.3) * s, y + dy * s, 6.5 * s).fill({ color, alpha });
}

/** The mud walker: a plain gray two-footed silhouette with a nub on the side it walks toward. No face. */
function drawWalker(g: Graphics, heading: Heading, lift = 0) {
  g.clear();
  g.ellipse(0, 6, 22, 6).fill({ color: ink, alpha: 0.12 });
  const y = -lift;
  g.moveTo(-10, y - 6).lineTo(-12, y + 6).moveTo(10, y - 6).lineTo(12, y + 6).stroke({ width: 7, color: GHOST, cap: 'round' });
  g.ellipse(0, y - 34, 28, 30).fill(GHOST).stroke({ width: 4, color: 0x6f6f80 });
  g.ellipse(heading * 26, y - 44, 12, 8).fill(GHOST).stroke({ width: 3, color: 0x6f6f80 });
}

/** A card's little picture: the movement's prints on a short strip. */
function miniPrints(id: MoveId): Graphics {
  const g = new Graphics();
  const m = MOVEMENTS[id];
  const cols = id === 'walk-then-hop' ? 8 : 6;
  const cw = 112 / cols, s = 0.32;
  g.roundRect(-62, -30, 124, 60, 10).fill(MUD);
  for (const mk of stamp(m, cols)) drawPad(g, -56 + (mk.col + 0.5) * cw, mk.row === 0 ? -12 : 12, mk.heading, MUD_DARK, 1, s);
  if (id === 'walk-stand-walk') {
    // A little pause sign over the middle: two bars, where it stood to look.
    const x = -56 + 4 * cw - 2;
    g.roundRect(x - 7, -28, 5, 14, 2).roundRect(x + 2, -28, 5, 14, 2).fill(ink);
  }
  // An arrow the way it went.
  const ay = 40, h = m.heading;
  g.moveTo(-30 * h, ay).lineTo(30 * h, ay).stroke({ width: 5, color: ink, alpha: 0.55, cap: 'round' });
  g.poly([30 * h, ay - 9, 42 * h, ay, 30 * h, ay + 9]).fill({ color: ink, alpha: 0.55 });
  return g;
}

/** The Can't tell card: two little ghosts and a question mark. */
function cantTellArt(): Graphics {
  const g = new Graphics();
  for (const x of [-34, 34]) {
    g.ellipse(x, -8, 20, 22).fill({ color: GHOST, alpha: 0.75 });
    g.ellipse(x + 18, -16, 8, 6).fill({ color: GHOST, alpha: 0.75 });
  }
  g.circle(0, -42, 4).fill(ink);
  g.moveTo(-10, -6).quadraticCurveTo(-10, -26, 2, -26).quadraticCurveTo(14, -26, 12, -14).quadraticCurveTo(10, -6, 0, 0).lineTo(0, 10).stroke({ width: 6, color: swatch.purple.line, cap: 'round' });
  g.circle(0, 24, 4.5).fill(swatch.purple.line);
  return g;
}

function playIcon(): Container {
  const c = new Container();
  c.addChild(new Graphics().circle(0, 0, PLAY_R).fill(swatch.blue.fill).stroke({ width: 5, color: swatch.blue.line }).poly([-14, -20, 22, 0, -14, 20]).fill(0xffffff));
  c.hitArea = new Rectangle(-PLAY_R, -PLAY_R, 2 * PLAY_R, 2 * PLAY_R);
  return c;
}

/* The game --------------------------------------------------------------------------------------- */

interface CardNode { id: CardId; node: Container; face: Container; play: Container | null }
interface Replay { id: MoveId; t: number; heard: number; slow?: boolean }

const MOVE_LINE: Record<MoveId, LineId> = {
  walk: 'trackway-tales.fits-walk', 'walk-stand-walk': 'trackway-tales.fits-walk', hop: 'trackway-tales.fits-hop',
  'walk-back': 'trackway-tales.fits-back', 'hop-back': 'trackway-tales.fits-back', 'walk-then-hop': 'trackway-tales.fits-switch',
};
const MISMATCH_LINE: Record<Mismatch, LineId> = { extra: 'trackway-tales.extra-mark', missing: 'trackway-tales.missing-mark', toe: 'trackway-tales.wrong-toe' };

class TrackwayTales implements Game {
  readonly hintLabel = 'Show a hint';
  readonly round: Round;
  readonly o: Observed;
  state: RoundState;
  busy = true;
  finished = false;
  /** The card on the study board. */
  slot: CardId | null = null;
  /** The movement whose ghost prints are on the practice strip, and how far along it the walker is (in columns, its own order). */
  shown: MoveId | null = null;
  pos = -1;
  replay: Replay | null = null;
  /** Every movement replayed at least once (the bot replays each before choosing). */
  readonly played = new Set<MoveId>();
  /** The mark in the magnifier. */
  open: Mark | null = null;
  /** Green and orange columns on the mud after a Check. */
  private marksLit = new Map<number, 'green' | 'orange'>();
  /** The column the hint rings on both strips. */
  ring: number | null = null;
  private stampText = '';
  private readonly bow = { v: 0 };

  L: TrackLayout;
  private view: View;
  private readonly bg = new Graphics();
  private readonly strips = new Graphics();
  private readonly ghostPrints = new Graphics();
  private readonly overlay = new Graphics();
  private readonly lit = new Graphics();
  private readonly puddles = new Graphics();
  private readonly walker = new Graphics();
  readonly scrubArea = new Container();
  readonly mudArea = new Container();
  private readonly cardLayer = new Container();
  cards: CardNode[] = [];
  readonly slotNode = new Container();
  private readonly slotArt = new Container();
  private readonly slotLabel = new Text({ text: '', style: { fontFamily: FONT, fontSize: 22, fontWeight: '700', fill: swatch.green.line, align: 'center', wordWrap: true, wordWrapWidth: SLOT_W - 16 } });
  readonly checkBtn = new Container();
  private readonly glow = new Graphics();
  private readonly lens = new Container();
  private readonly lensArt = new Graphics();
  private scrubId: number | null = null;
  private t = 0;
  private destroyed = false;
  private readonly onWindowUp = (e: PointerEvent) => { if (e.pointerId === this.scrubId) this.scrubId = null; };

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    const level = planFor(ctx.level).id;
    const first = !authoredShown.has(level) && !ctx.demo;
    if (first) authoredShown.add(level);
    this.round = makeRound(level, ctx.rng, first);
    this.o = observed(this.round.c);
    this.state = roundState(this.round);
    this.L = trackLayout(ctx.view, level);

    const s = ctx.stage;
    this.bg.eventMode = 'static';
    this.bg.on('pointerdown', () => this.closeLens());
    for (const g of [this.strips, this.ghostPrints, this.overlay, this.lit, this.puddles, this.walker, this.glow]) g.eventMode = 'none';
    this.lens.eventMode = 'none';
    this.lens.addChild(this.lensArt);
    this.lens.visible = false;

    this.scrubArea.eventMode = 'static';
    this.scrubArea.cursor = 'grab';
    this.scrubArea.on('pointerdown', (e) => this.scrubDown(e));
    this.scrubArea.on('globalpointermove', (e) => this.scrubMove(e));
    window.addEventListener('pointerup', this.onWindowUp, true);
    window.addEventListener('pointercancel', this.onWindowUp, true);
    onTap(this.mudArea, (e) => this.tapMud(e), { cooldown: 200 });

    s.addChild(this.bg, this.strips, this.lit, this.ghostPrints, this.overlay, this.puddles, this.walker, this.scrubArea, this.mudArea, this.cardLayer, this.slotNode, this.checkBtn, this.glow, this.lens);
    this.buildCards();
    this.buildBoard();
    this.layout();
    if (this.round.magnified) this.openLens(this.round.magnified, false);
  }

  get misses() { return this.state.misses; }
  get hints() { return this.state.hints; }
  get level() { return this.round.c.level; }

  start() {
    const line: LineId = this.level >= 3 ? 'trackway-tales.instruct-puddle' : this.level === 2 ? 'trackway-tales.instruct-toes' : 'trackway-tales.intro';
    void this.ctx.instruct(line).then(() => { if (!this.destroyed && this.level === 1) void this.ctx.say('trackway-tales.mud-dried'); });
    this.busy = false;
  }

  /* Building -------------------------------------------------------------------------------------- */

  private buildCards() {
    for (const id of this.round.cards) {
      const node = new Container();
      const face = new Container();
      const cant = id === 'cant-tell';
      face.addChild(new Graphics().roundRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 18).fill(0xffffff).stroke({ width: 5, color: cant ? swatch.purple.line : wood.line }));
      const art = cant ? cantTellArt() : miniPrints(id);
      art.y = cant ? -40 : -62;
      const label = new Text({ text: cant ? "Can't tell" : MOVEMENTS[id].name, style: { fontFamily: FONT, fontSize: 19, fontWeight: '700', fill: ink, align: 'center', wordWrap: true, wordWrapWidth: CARD_W - 14 } });
      label.anchor.set(0.5, 0);
      label.y = cant ? 30 : -4;
      face.addChild(art, label);
      node.addChild(face);
      // The card is chosen by its upper part; the Play button below it replays.
      const chooseH = cant ? CARD_H : CARD_H - 2 * PLAY_R - 20;
      face.hitArea = new Rectangle(-CARD_W / 2, -CARD_H / 2, CARD_W, chooseH);
      onTap(face, () => this.choose(id), { cooldown: 300 });
      let play: Container | null = null;
      if (!cant) {
        play = playIcon();
        play.y = CARD_H / 2 - PLAY_R - 10;
        onTap(play, () => this.pressPlay(id), { cooldown: 300 });
        node.addChild(play);
      }
      this.cardLayer.addChild(node);
      this.cards.push({ id, node, face, play });
    }
  }

  private buildBoard() {
    const page = new Graphics().roundRect(-SLOT_W / 2, -SLOT_H / 2, SLOT_W, SLOT_H, 16).fill(cream).stroke({ width: 5, color: wood.line });
    for (let i = 1; i < 5; i++) page.moveTo(-SLOT_W / 2 + 12, -SLOT_H / 2 + i * 28).lineTo(SLOT_W / 2 - 12, -SLOT_H / 2 + i * 28).stroke({ width: 2, color: swatch.blue.light });
    this.slotLabel.anchor.set(0.5);
    this.slotLabel.y = 48;
    this.slotNode.addChild(page, this.slotArt, this.slotLabel);
    this.slotNode.hitArea = new Rectangle(-SLOT_W / 2, -SLOT_H / 2, SLOT_W, SLOT_H);
    onTap(this.slotNode, () => { if (!this.busy && this.slot) { this.slot = null; sfx.pop(5); this.drawSlot(); } }, { cooldown: 300 });

    const b = this.checkBtn;
    b.addChild(new Graphics().roundRect(-CHECK_W / 2, -CHECK_H / 2, CHECK_W, CHECK_H, 22).fill(swatch.green.fill).stroke({ width: 5, color: swatch.green.line }));
    b.addChild(new Graphics().moveTo(-62, 0).lineTo(-50, 14).lineTo(-30, -14).stroke({ width: 8, color: 0xffffff, cap: 'round', join: 'round' }));
    const t = new Text({ text: 'Check', style: { fontFamily: FONT, fontSize: 32, fontWeight: '700', fill: 0xffffff } });
    t.anchor.set(0.5);
    t.x = 18;
    b.addChild(t);
    b.hitArea = new Rectangle(-CHECK_W / 2, -CHECK_H / 2, CHECK_W, CHECK_H);
    onTap(b, () => void this.pressCheck(), { cooldown: 400 });
  }

  private layout() {
    const L = this.L, v = this.view;
    this.bg.clear().rect(0, 0, v.w, v.h).fill(0xcdeaf7);
    this.bg.rect(0, L.mud.y + 40, v.w, v.h).fill(0xf6e3b4);
    this.bg.hitArea = new Rectangle(0, 0, v.w, v.h);
    this.scrubArea.hitArea = new Rectangle(L.practice.x, L.practice.y, L.practice.w, L.practice.h);
    this.mudArea.hitArea = new Rectangle(L.mud.x, L.mud.y, L.mud.w, L.mud.h);
    this.cards.forEach((c, i) => c.node.position.set(L.cards[i].x, L.cards[i].y));
    this.slotNode.position.set(L.slot.x, L.slot.y);
    this.checkBtn.position.set(L.check.x, L.check.y);
    this.lens.position.set(L.lens.x, L.lens.y);
    this.drawStrips();
    this.drawGhost();
    this.drawLit();
    this.drawCards();
    this.drawSlot();
  }

  /* Drawing ---------------------------------------------------------------------------------------- */

  private drawStrips() {
    const L = this.L, g = this.strips.clear(), c = this.round.c;
    const strip = (r: Rect, fill: number, line: number) => g.roundRect(r.x - 8, r.y, r.w + 16, r.h, 16).fill(fill).stroke({ width: 4, color: line });
    strip(L.practice, CLEAR, 0xc9c2b0);
    strip(L.mud, MUD, MUD_LINE);
    // Dry cracks in the mud, the same every time.
    for (let i = 0; i < c.cols * 2; i++) {
      const x = L.mud.x + ((i * 53) % L.mud.w), y = L.mud.y + 18 + ((i * 37) % (L.mud.h - 36));
      g.moveTo(x, y).lineTo(x + 14, y + 9).lineTo(x + 22, y + 4).stroke({ width: 2, color: MUD_LINE, alpha: 0.7 });
    }
    for (let col = 1; col < c.cols; col++) {
      const x = L.mud.x + col * L.colW;
      g.moveTo(x, L.practice.y + 10).lineTo(x, L.practice.y + L.practice.h - 10).stroke({ width: 1.5, color: 0xd8d0bc });
    }
    for (const m of this.o.marks) drawPad(g, colX(L, m.col), rowY(L.mud, m.row), m.heading, MUD_DARK);
    const p = this.puddles.clear();
    if (c.puddle) {
      const x0 = L.mud.x + c.puddle.from * L.colW, x1 = L.mud.x + (c.puddle.to + 1) * L.colW;
      for (const r of [L.practice, L.mud]) {
        p.ellipse((x0 + x1) / 2, r.y + r.h / 2, (x1 - x0) / 2 + 10, r.h / 2 - 6).fill({ color: PUDDLE, alpha: 0.92 }).stroke({ width: 4, color: swatch.blue.line });
        p.ellipse((x0 + x1) / 2 - 20, r.y + r.h / 2 - 22, 30, 8).fill({ color: 0xffffff, alpha: 0.5 });
      }
    }
  }

  /** The contacts of the shown movement, each with its place in the movement's own order. */
  private shownContacts(): { k: number; c: Contact }[] {
    if (!this.shown) return [];
    const m = MOVEMENTS[this.shown], cols = this.round.c.cols;
    return contacts(m, cols).map((c) => ({ k: m.heading === 1 ? c.col : cols - 1 - c.col, c }));
  }

  private drawGhost() {
    const L = this.L, g = this.ghostPrints.clear();
    const cols = this.round.c.cols;
    const heading: Heading = this.shown ? MOVEMENTS[this.shown].heading : 1;
    const along = (k: number) => (heading === 1 ? k : cols - 1 - k);
    if (this.replay) {
      const n = Math.floor(this.replay.t / this.step);
      this.shownContacts().slice(0, n + 1).forEach(({ c }) => c.marks.forEach((m) => drawPad(g, colX(L, m.col), rowY(L.practice, m.row), m.heading, GHOST, 0.75)));
    } else {
      for (const { k, c } of this.shownContacts()) if (k <= this.pos + 0.5) c.marks.forEach((m) => drawPad(g, colX(L, m.col), rowY(L.practice, m.row), m.heading, GHOST, 0.75));
    }
    // The walker stands at its place along the strip, or waits at the start.
    const k = this.pos < 0 ? -0.55 : this.pos;
    const x = L.mud.x + (along(k) + 0.5) * L.colW;
    const hop = this.replay ? this.shownContacts()[Math.floor(this.replay.t / this.step)]?.c.gait === 'hop' : false;
    const lift = hop ? Math.sin(((this.replay!.t % this.step) / this.step) * Math.PI) * 26 : 0;
    drawWalker(this.walker, heading, lift);
    this.walker.position.set(Math.max(L.practice.x + 20, Math.min(L.practice.x + L.practice.w - 20, x)), L.practice.y + L.practice.h - 14);
    this.walker.rotation = this.bow.v > 0 ? Math.sin(this.bow.v * Math.PI) * 0.35 * heading : 0;
  }

  private get step() { return this.replay?.slow ? STEP * 2.2 : STEP; }

  private drawLit() {
    const L = this.L, g = this.lit.clear();
    for (const [col, kind] of this.marksLit) {
      const color = kind === 'green' ? swatch.green.fill : swatch.orange.fill;
      g.roundRect(colX(L, col) - L.colW / 2 + 6, L.mud.y + 8, L.colW - 12, L.mud.h - 16, 14).fill({ color, alpha: 0.55 }).stroke({ width: 5, color: kind === 'green' ? swatch.green.line : swatch.orange.line });
    }
    if (this.ring !== null) {
      const a = 0.55 + 0.35 * Math.sin(this.t * 5);
      for (const r of [L.practice, L.mud]) g.roundRect(colX(L, this.ring) - L.colW / 2 + 2, r.y + 2, L.colW - 4, r.h - 4, 14).stroke({ width: 8, color: swatch.yellow.fill, alpha: a });
    }
  }

  private drawCards() {
    for (const c of this.cards) {
      const lifted = this.slot === c.id;
      c.node.alpha = lifted ? 0.45 : 1;
    }
  }

  private drawSlot() {
    this.slotArt.removeChildren().forEach((c) => c.destroy());
    if (this.slot) {
      const art = this.slot === 'cant-tell' ? cantTellArt() : miniPrints(this.slot);
      art.scale.set(1.05);
      art.y = this.stampText ? -26 : -6;
      this.slotArt.addChild(art);
    }
    this.slotLabel.text = this.stampText;
    this.drawCards();
  }

  private drawGlow() {
    const g = this.glow.clear();
    const target = glowing(this.state);
    if (!target || this.finished) return;
    const a = 0.45 + 0.35 * Math.sin(this.t * 5);
    const c = this.cards.find((x) => x.id === target);
    if (c) g.roundRect(c.node.x - CARD_W / 2 - 10, c.node.y - CARD_H / 2 - 10, CARD_W + 20, CARD_H + 20, 24).stroke({ width: 10, color: swatch.yellow.fill, alpha: a });
  }

  /* Replay and scrub ------------------------------------------------------------------------------- */

  private pressPlay(id: MoveId) {
    if (this.busy || this.finished) return;
    this.closeLens();
    this.startReplay(id);
    const c = this.cards.find((x) => x.id === id);
    if (c) void this.ctx.tw.to(c.node.scale, { x: 1.06, y: 1.06 }, { duration: 0.08 }).then(() => this.ctx.tw.to(c.node.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack }));
  }

  private startReplay(id: MoveId, slow = false) {
    this.shown = id;
    this.pos = -1;
    this.replay = { id, t: 0, heard: -1, slow };
    this.drawGhost();
  }

  /** Advance a replay: a soft thud per contact, two together for a hop, a quiet rest for a stand. */
  private tickReplay(dt: number) {
    const r = this.replay;
    if (!r) return;
    r.t += dt;
    const list = this.shownContacts();
    const n = Math.floor(r.t / this.step);
    while (r.heard < Math.min(n, list.length - 1)) {
      r.heard++;
      const c = list[r.heard];
      this.pos = c.k;
      if (c.c.gait === 'walk') sfx.drum(0.35);
      else if (c.c.gait === 'hop') { sfx.drum(0.4); sfx.drum(0.3); }
    }
    if (n >= list.length) {
      this.replay = null;
      this.pos = this.round.c.cols - 1;
      const firstTime = !this.played.has(r.id);
      this.played.add(r.id);
      if (firstTime && this.played.size === 1 && !this.busy) void this.ctx.instruct('trackway-tales.instruct-choose');
    }
    this.drawGhost();
  }

  private scrubDown(e: FederatedPointerEvent) {
    if (this.busy || this.finished || this.scrubId !== null || palmOnGlass()) return;
    this.closeLens();
    if (!this.shown) {
      void this.ctx.say('trackway-tales.instruct-replay');
      return;
    }
    this.scrubId = e.pointerId;
    this.replay = null;
    this.scrubTo(e);
  }

  private scrubMove(e: FederatedPointerEvent) {
    if (this.scrubId === null || e.pointerId !== this.scrubId || this.busy) return;
    this.scrubTo(e);
  }

  private scrubTo(e: FederatedPointerEvent) {
    if (!this.shown) return;
    const p = this.ctx.stage.toLocal(e.global);
    if (!Number.isFinite(p.x)) return;
    const cols = this.round.c.cols;
    const along = (p.x - this.L.mud.x) / this.L.colW - 0.5;
    const k = Math.max(-0.5, Math.min(cols - 1, MOVEMENTS[this.shown].heading === 1 ? along : cols - 1 - along));
    const before = Math.round(this.pos);
    this.pos = k;
    if (Math.round(k) !== before) sfx.drum(0.2);
    this.drawGhost();
  }

  /* Choosing and checking -------------------------------------------------------------------------- */

  private choose(id: CardId) {
    if (this.busy || this.finished) return;
    this.closeLens();
    this.slot = this.slot === id ? null : id;
    sfx.pop(this.slot ? 9 : 5);
    this.drawSlot();
  }

  private say(id: LineId) { return this.ctx.say(id); }

  /** Slide a movement's prints down onto the mud and light its columns in its order, up to the first that differs. */
  private async sweep(id: MoveId, fast = false): Promise<number | null> {
    const L = this.L;
    const g = this.overlay.clear();
    for (const m of stamp(MOVEMENTS[id], this.round.c.cols)) if (!inPuddle(m.col, this.round.c.puddle)) drawPad(g, colX(L, m.col), rowY(L.practice, m.row), m.heading, 0xffffff, 0.75);
    this.overlay.y = 0;
    await this.ctx.tw.to(this.overlay, { y: L.mud.y - L.practice.y }, { duration: fast ? 0.25 : 0.45, ease: ease.inOutSine });
    if (this.destroyed) return null;
    let i = 0;
    for (const col of orderedCols(MOVEMENTS[id], this.o)) {
      const diff = this.columnDiffers(id, col);
      if (diff) {
        this.marksLit.set(col, 'orange');
        this.drawLit();
        sfx.knock();
        return col;
      }
      this.marksLit.set(col, 'green');
      this.drawLit();
      sfx.pluck(STEPS[Math.min(STEPS.length - 1, i++)]);
      await this.ctx.tw.wait(fast ? 0.08 : 0.16);
      if (this.destroyed) return null;
    }
    return null;
  }

  private columnDiffers(id: MoveId, col: number): boolean {
    const key = (m: Mark) => `${m.row}${m.heading}`;
    const a = stamp(MOVEMENTS[id], this.round.c.cols).filter((m) => m.col === col).map(key).sort().join();
    const b = this.o.marks.filter((m) => m.col === col).map(key).sort().join();
    return a !== b;
  }

  private clearSweep() {
    this.overlay.clear();
    this.marksLit.clear();
    this.drawLit();
  }

  private async pressCheck() {
    if (this.busy || this.finished) return;
    this.closeLens();
    const card = this.slot;
    const r = check(this.state, card);
    if (r.kind === 'ignored') return;
    if (r.kind === 'empty') {
      void this.ctx.tw.to(this.slotNode, { rotation: 0.08 }, { duration: 0.08 }).then(() => this.ctx.tw.to(this.slotNode, { rotation: 0 }, { duration: 0.3, ease: ease.outBack }));
      void this.say('trackway-tales.empty-slot');
      return;
    }
    this.busy = true;
    this.replay = null;
    if (r.kind === 'right') { await this.win(r.card); return; }
    if (r.kind === 'wrong') {
      await this.sweep(r.card);
      if (this.destroyed) return;
      sfx.boing();
      await this.say(MISMATCH_LINE[r.mismatch]);
      if (this.destroyed) return;
      this.slot = null;
      this.drawSlot();
      this.clearSweep();
      if (r.glow) await this.showHint();
    } else if (r.kind === 'both-fit') {
      await this.sweep(card as MoveId);
      if (this.destroyed) return;
      this.startReplay(r.other);
      await this.say('trackway-tales.both-fit');
      if (this.destroyed) return;
      this.clearSweep();
      this.slot = null;
      this.drawSlot();
      const ct = this.cards.find((x) => x.id === 'cant-tell');
      if (ct) await this.ctx.tw.to(ct.node, { rotation: 0.1 }, { duration: 0.1 }).then(() => this.ctx.tw.to(ct.node, { rotation: 0 }, { duration: 0.4, ease: ease.outBack }));
    } else {
      sfx.boing();
      await this.say('trackway-tales.cant-tell-wrong');
      if (this.destroyed) return;
      // The clue: each card that does not fit shows where it differs.
      for (const id of this.round.c.cards.filter((x) => !accepted(this.round.c).includes(x))) {
        await this.sweep(id, true);
        if (this.destroyed) return;
        await this.ctx.tw.wait(0.6);
        if (this.destroyed) return;
        this.clearSweep();
      }
      this.slot = null;
      this.drawSlot();
      if (r.glow) await this.showHint();
    }
    if (this.destroyed) return;
    this.busy = false;
  }

  private async win(card: CardId) {
    this.finished = true;
    const c = this.round.c;
    if (card === 'cant-tell') {
      const fitsBoth = accepted(c);
      for (const id of fitsBoth) {
        this.startReplay(id);
        await this.ctx.tw.wait(this.shownContacts().length * STEP + 0.3);
        if (this.destroyed) return;
      }
      await this.sweep(fitsBoth[0]);
      this.stampText = 'two fit: can\'t tell';
    } else {
      await this.sweep(card as MoveId);
      this.stampText = 'fits every mark';
    }
    if (this.destroyed) return;
    this.drawSlot();
    sfx.tada();
    this.ctx.pet.cheer();
    this.pos = c.cols - 1;
    void this.ctx.tw.to(this.bow, { v: 1 }, { duration: 0.7 }).then(() => { this.bow.v = 0; this.drawGhost(); });
    await this.say(card === 'cant-tell' ? 'trackway-tales.fits-cant-tell' : MOVE_LINE[card]);
    if (this.destroyed) return;
    await this.say('trackway-tales.done');
    if (this.destroyed) return;
    await this.ctx.tw.wait(0.3);
    if (this.destroyed) return;
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  /** Ring the telling column on both strips and replay the glowing card slowly. */
  private async showHint() {
    this.ring = informativeColumn(this.round.c, remaining(this.state));
    const target = answer(this.round.c);
    this.startReplay(target === 'cant-tell' ? accepted(this.round.c)[0] : target, true);
    await this.say('trackway-tales.hint-look-here');
  }

  /* Magnifier -------------------------------------------------------------------------------------- */

  private tapMud(e: FederatedPointerEvent) {
    if (this.finished) return;
    const p = this.ctx.stage.toLocal(e.global);
    if (!Number.isFinite(p.x)) return;
    const L = this.L;
    const col = nearestCol(L, p.x, this.round.c.cols);
    const row = p.y < L.mud.y + L.mud.h / 2 ? 0 : 1;
    const marks = this.o.marks;
    if (!marks.length) return;
    const dist = (m: Mark) => Math.abs(m.col - col) * 3 + (m.row === row ? 0 : 1);
    const best = marks.reduce((a, b) => (dist(b) < dist(a) ? b : a));
    this.openLens(best, true);
  }

  private openLens(m: Mark, speak: boolean) {
    this.open = m;
    const g = this.lensArt.clear();
    const R = LENS_R;
    g.circle(0, 0, R + 12).fill(wood.light).stroke({ width: 8, color: wood.line });
    g.circle(0, 0, R).fill(MUD);
    drawPad(g, 0, -10, m.heading, MUD_DARK, 1, 2.6);
    const ay = 74, h = m.heading;
    g.moveTo(-40 * h, ay).lineTo(36 * h, ay).stroke({ width: 8, color: ink, alpha: 0.6, cap: 'round' });
    g.poly([34 * h, ay - 14, 54 * h, ay, 34 * h, ay + 14]).fill({ color: ink, alpha: 0.6 });
    g.circle(0, 0, R).stroke({ width: 6, color: 0xffffff, alpha: 0.5 });
    this.lens.visible = true;
    if (speak) {
      sfx.bell(14, 0.15);
      this.lens.scale.set(0.4);
      void this.ctx.tw.to(this.lens.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack });
      void this.say(m.heading === 1 ? 'trackway-tales.toe-right' : 'trackway-tales.toe-left');
    }
  }

  private closeLens() {
    if (!this.open) return;
    this.open = null;
    this.lens.visible = false;
  }

  /* Help ------------------------------------------------------------------------------------------- */

  askForHint() {
    if (this.finished) return;
    if (help(this.state)) void this.showHint();
    else void this.say('trackway-tales.hint-look-here');
  }

  restart() {
    if (this.finished) return;
    const keep = { misses: this.state.misses, hints: this.state.hints, helped: this.state.helped };
    this.state = roundState(this.round);
    Object.assign(this.state, keep);
    this.slot = null;
    this.shown = null;
    this.pos = -1;
    this.replay = null;
    this.ring = null;
    this.stampText = '';
    this.overlay.clear();
    this.marksLit.clear();
    this.closeLens();
    this.layout();
    this.busy = false;
  }

  /* Frame ------------------------------------------------------------------------------------------ */

  update(dt: number) {
    this.t += dt;
    this.tickReplay(dt);
    if (this.bow.v > 0) this.drawGhost();
    if (this.ring !== null) this.drawLit();
    this.drawGlow();
  }

  resize(view: View) {
    this.view = view;
    this.L = trackLayout(view, this.level);
    this.layout();
    if (this.open) this.openLens(this.open, false);
  }

  /* Bot -------------------------------------------------------------------------------------------- */

  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.replay) return null;
    const L = this.L;
    // Level 2: move the magnifier to the next mark along, so the toes are shown.
    if (this.level === 2 && this.round.magnified && this.open === this.round.magnified) {
      const m = this.round.magnified;
      const next = this.o.marks.find((x) => x.col === m.col - m.heading) ?? this.o.marks.find((x) => x !== m)!;
      return { tap: { on: this.mudArea, x: colX(L, next.col), y: rowY(L.mud, next.row) }, pause: 1.2 };
    }
    const card = (id: CardId) => this.cards.find((c) => c.id === id)!;
    for (const c of this.cards) if (c.play && !this.played.has(c.id as MoveId)) return { tap: { on: c.play }, pause: 0.4 };
    const want = answer(this.round.c);
    if (this.slot !== want) return { tap: { on: card(want).face, x: 0, y: -CARD_H / 2 + 50 }, pause: 0.5 };
    return { tap: { on: this.checkBtn }, pause: 1.5 };
  }

  destroy() {
    this.destroyed = true;
    window.removeEventListener('pointerup', this.onWindowUp, true);
    window.removeEventListener('pointercancel', this.onWindowUp, true);
    this.scrubArea.removeAllListeners();
    this.mudArea.removeAllListeners();
    this.bg.removeAllListeners();
  }
}

/* Icon and sticker ------------------------------------------------------------------------------- */

/** A zigzag of footprints in a strip of mud. */
function trackStrip(hop: boolean): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-110, -45, 220, 90, 18).fill(MUD).stroke({ width: 4, color: MUD_LINE });
  const marks = stamp(MOVEMENTS[hop ? 'hop' : 'walk'], 4);
  for (const m of marks) drawPad(g, -82 + m.col * 55, m.row === 0 ? -18 : 18, m.heading, MUD_DARK, 1, 0.6);
  c.addChild(g);
  return c;
}

function sticker(seed: number): Container {
  const c = new Container();
  const strip = trackStrip(Math.abs(seed) % 2 === 1);
  strip.y = 40;
  const w = new Graphics();
  drawWalker(w, 1);
  w.scale.set(1.3);
  w.position.set(70, -10);
  w.rotation = 0.2;
  c.addChild(strip, w);
  return c;
}

export const trackwayTales: GameModule = {
  id: 'trackway-tales',
  name: 'Trackway Tales',
  titleLine: 'game.trackway-tales',
  region: 'tinker-lab',
  skills: ['evidence', 'inference', 'comparing', 'uncertainty'],
  bands: ['school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.bubbles,
  coplayHint: 'One of you replays and scrubs while the other chooses a card and taps Check, then swap. At the puddle, each say "can tell" or "can\'t tell" before Check.',
  offScreen: 'On sand or snow, one of you walks or hops across while the other looks away; then the looker reads the marks and says how. Swap.',
  touchDemo: true,
  hubIcon: () => new WigglyIcon(trackStrip(false)),
  sticker,
  create: (ctx) => new TrackwayTales(ctx),
};
