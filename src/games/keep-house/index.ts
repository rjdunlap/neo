/**
 * Keep House: put the castle's household where its work needs it. Level 1 taps the doors and the well and a worker comes out
 * with their tool; level 2 drags each figure to its workplace; level 3 puts the kitchen, then the stable, on a near or far spot
 * and watches whether the soup (or the horses) arrive well; level 4 fits five rooms on a 3 × 3 plan to five needs and rings the
 * bell to check. Rules: ./logic.ts; definition: docs/definitions/keep-house.md.
 */
import { Container, Graphics, Rectangle } from 'pixi.js';
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
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import type { LineId } from '../../content/voice-script';
import { bellArt, cellArt, doorArt, figureArt, fixedArt, frontArt, iconArt, keepArt, needArt, roomArt, spotArt, steamArt, stickerArt, tileArt, wellArt } from './art';
import {
  allPlaced, askPlacement, askPlan, askYard, briefFor, CELL, centre, doorsDone, drop, fixedRect, glowTarget, hintFor, keep, keepLayout, movePlan, NEEDS, nextDoor, place, PLAN_ROOMS, planFor, planTally, ringBell, solutions, SPOT, spotRects, startDoors, startPlacement, startPlan, startYard, stepsTo, tapDoor, tapWell, TILE, walkTally, workplaceOf, yardDone, yardTally,
  type Board, type Brief, type DoorsState, type Figure, type KeepLayout, type Move, type Person, type Placement, type PlacementState, type PlanRoom, type PlanState, type Rect, type Room, type Spot, type YardState,
} from './logic';

const LEVELS: BandLevels = {
  toddler: { min: 1, max: 1 },
  preschool: { min: 1, max: 3 },
  prek: { min: 2, max: 4 },
  school: { min: 4, max: 4 },
};

/** A closed door glows after this long with no tap (entry guidance; it records nothing). */
const IDLE_GLOW = 8;
const PERSON_SOUND: Record<Person, () => void> = {
  cook: () => sfx.clunk(),
  groom: () => sfx.brush(),
  ringer: () => sfx.bell(7),
  steward: () => sfx.tick(),
};
const AT_WORK_SOUND: Record<Figure, () => void> = {
  cook: () => sfx.squish(),
  groom: () => sfx.brush(),
  ringer: () => sfx.bell(9),
  steward: () => sfx.knock(),
  horse: () => sfx.munch(),
  hens: () => sfx.animal('cluck'),
};
/** The castle's own bell, step by step, as the Finish sound. */
const BELL_STEPS = [4, 7, 9];

const contains = (r: Rect, x: number, y: number, pad = 0) => x >= r.x - pad && x <= r.x + r.w + pad && y >= r.y - pad && y <= r.y + r.h + pad;

class KeepHouse implements Game {
  readonly brief: Brief;
  doors: DoorsState | null = null;
  yards: YardState[] = [];
  yardIndex = 0;
  placements: PlacementState[] = [];
  placementIndex = 0;
  plans: PlanState[] = [];
  planIndex = 0;
  /** An animation is running; inputs wait. */
  busy = false;
  finished = false;
  /** The well has been tapped at least once this round (the bot's one well tap). */
  wellTapped = false;
  private alive = true;
  private epoch = 0;
  private clock = 0;
  private idle = 0;
  private view: View;
  private relayout = false;
  layoutNow: KeepLayout | null = null;
  /** The figure or room tile she holds. */
  held: Figure | null = null;
  heldRoom: PlanRoom | null = null;
  tileHeld = false;
  /** Keep it is shown (a cold arrival is waiting on her). */
  keepShown = false;

  private readonly backdrop: Backdrop;
  private readonly board = new Container();
  private readonly glow = new Graphics();
  private readonly walkLayer = new Container();
  doorNodes: Container[] = [];
  private peopleOut: Container[] = [];
  wellNode: Container | null = null;
  figureNodes = new Map<Figure, { node: Container; drag: DragHandle }>();
  roomNodes: Container[] = [];
  tileNode: Container | null = null;
  private tileDrag: DragHandle | null = null;
  spotNodes: { near: Container; far: Container } | null = null;
  keepNode: Container | null = null;
  cellNodes: Container[] = [];
  planTiles = new Map<PlanRoom, { node: Container; drag: DragHandle }>();
  cardNodes: Container[] = [];
  bellNode: Container | null = null;
  /** The last bell's verdict per need, shown on the cards until she moves a room. */
  private verdict: Map<number, boolean> | null = null;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.brief = briefFor(ctx.level, ctx.band, ctx.rng);
    this.backdrop = new Backdrop({ sky: [0xd6ecf7, 0xfff6e0], hills: [0xb9dc9a, 0xa3cf85, 0x8fc277], horizon: 0.38, clouds: 2, sun: true, seed: 311 }, ctx.view);
    this.glow.eventMode = 'none';
    this.walkLayer.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.board);
    if (this.brief.id === 'doors') this.doors = startDoors(this.brief);
    if (this.brief.id === 'workplaces') this.yards = this.brief.yards.map(() => startYard());
    if (this.brief.id === 'walk') this.placements = this.brief.placements.map(() => startPlacement());
    if (this.brief.id === 'plan') this.plans = this.brief.boards.map(() => startPlan());
  }

  get level() {
    return this.brief.level;
  }

  get yard() {
    return this.yards[this.yardIndex];
  }

  get yardBrief() {
    return (this.brief as { yards: { figures: Figure[]; rooms: Room[] }[] }).yards[this.yardIndex];
  }

  get placement() {
    return this.placements[this.placementIndex];
  }

  get placementBrief() {
    return (this.brief as { placements: Placement[] }).placements[this.placementIndex];
  }

  get plan() {
    return this.plans[this.planIndex];
  }

  get boardNow() {
    return (this.brief as { boards: Board[] }).boards[this.planIndex];
  }

  /** Round totals so far, for a check or the finish. */
  get tally() {
    if (this.brief.id === 'workplaces') return yardTally(this.yards);
    if (this.brief.id === 'walk') return walkTally(this.placements);
    if (this.brief.id === 'plan') return planTally(this.plans);
    return { misses: 0, hints: 0 };
  }

  start() {
    this.build();
    void this.ctx.instruct(`kh.instruct.${this.level}` as LineId);
    if (this.level >= 2) void this.ctx.say('kh.history');
  }

  destroy() {
    this.alive = false;
    this.releaseDrags();
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    if (!this.layoutNow) return;
    if (this.busy || this.finished || this.held || this.heldRoom || this.tileHeld) { this.relayout = true; return; }
    this.build();
  }

  /** A guard after every await: the scene is alive and nothing rebuilt the board meanwhile. */
  private live(epoch: number) {
    return this.alive && epoch === this.epoch && !this.finished;
  }

  private releaseDrags() {
    for (const f of this.figureNodes.values()) f.drag.destroy();
    this.figureNodes.clear();
    this.tileDrag?.destroy();
    this.tileDrag = null;
    for (const t of this.planTiles.values()) t.drag.destroy();
    this.planTiles.clear();
    this.held = this.heldRoom = null;
    this.tileHeld = false;
  }

  // ——— Building ———

  private build() {
    this.epoch++;
    this.relayout = false;
    this.releaseDrags();
    this.doorNodes = [];
    this.peopleOut = [];
    this.roomNodes = [];
    this.cellNodes = [];
    this.cardNodes = [];
    this.wellNode = this.tileNode = this.keepNode = this.bellNode = null;
    this.spotNodes = null;
    this.glow.removeFromParent();
    this.walkLayer.removeFromParent();
    for (const c of this.walkLayer.removeChildren()) c.destroy({ children: true });
    for (const c of this.board.removeChildren()) c.destroy({ children: true });
    if (this.finished) return;
    const l = keepLayout(this.brief, this.view);
    this.layoutNow = l;
    if (!l) return;
    if (this.brief.id === 'doors') this.buildDoors(l);
    else if (this.brief.id === 'workplaces') this.buildYard(l);
    else if (this.brief.id === 'walk') this.buildWalk(l);
    else this.buildPlan(l);
    this.board.addChild(this.walkLayer, this.glow);
  }

  private buildDoors(l: KeepLayout) {
    const b = this.brief as { doors: Person[] };
    const doors = l.doors!;
    const first = doors[0], last = doors[doors.length - 1];
    const wallX = Math.min(first.x, l.well!.x) - 110;
    const wallW = Math.max(last.x + last.w, l.well!.x + l.well!.w) + 110 - wallX;
    const front = frontArt(wallW, first.h + 120);
    front.position.set(wallX, first.y - 100);
    this.board.addChild(front);
    this.doorNodes = doors.map((r, i) => {
      const node = new Container();
      node.position.set(r.x, r.y);
      node.hitArea = new Rectangle(-10, -10, r.w + 20, r.h + 20);
      onTap(node, () => this.tapDoor(i), { cooldown: 250 });
      this.board.addChild(node);
      return node;
    });
    const w = l.well!;
    const well = new Container();
    well.position.set(w.x + w.w / 2, w.y + w.h);
    well.hitArea = new Rectangle(-w.w / 2 - 10, -w.h - 10, w.w + 20, w.h + 20);
    onTap(well, () => this.tapWell(), { cooldown: 300 });
    this.board.addChild(well);
    this.wellNode = well;
    this.redrawDoors();
    // People already out stand in front of their doors.
    this.doors!.opened.forEach((open, i) => { if (open) this.standOut(i, b.doors[i]); });
  }

  private buildYard(l: KeepLayout) {
    const yb = this.yardBrief;
    this.roomNodes = l.rooms!.map((r) => {
      const node = new Container();
      node.position.set(r.x, r.y);
      node.hitArea = new Rectangle(0, 0, r.w, r.h);
      node.eventMode = 'none';
      this.board.addChild(node);
      return node;
    });
    this.redrawRooms();
    yb.figures.forEach((figure, i) => {
      const node = new Container();
      const placed = this.yard.placed[figure];
      if (placed) {
        const r = l.rooms![yb.rooms.indexOf(placed)];
        node.position.set(r.x + r.w / 2, r.y + r.h - 14);
        node.addChild(figureArt(figure, true));
        node.eventMode = 'none';
        this.board.addChild(node);
        return;
      }
      const s = l.slots![i];
      node.position.set(s.x + s.w / 2, s.y + s.h);
      node.addChild(figureArt(figure));
      node.hitArea = new Rectangle(-s.w / 2 - 6, -s.h - 6, s.w + 12, s.h + 12);
      this.board.addChild(node);
      const drag = draggable(node, this.ctx.tw, {
        onPick: () => { this.held = figure; this.idle = 0; },
        onDrop: (x, y) => this.dropFigure(figure, x, y),
      });
      this.figureNodes.set(figure, { node, drag });
    });
  }

  private buildWalk(l: KeepLayout) {
    const p = this.placementBrief;
    const f = fixedRect(p, l.yard!);
    const fixed = fixedArt(p.fixed, f.w, f.h);
    fixed.position.set(f.x, f.y);
    this.board.addChild(fixed);
    const spots = spotRects(p, l.yard!);
    const spotNode = (r: Rect) => {
      const node = new Container();
      node.position.copyFrom(centre(r));
      node.eventMode = 'none';
      this.board.addChild(node);
      return node;
    };
    this.spotNodes = { near: spotNode(spots.near), far: spotNode(spots.far) };
    this.redrawSpots();
    // The tile: in its tray slot, or on the spot it stands on.
    const tile = new Container();
    tile.addChild(tileArt(p.room, TILE.w));
    tile.hitArea = new Rectangle(-TILE.w / 2 - 8, -TILE.h / 2 - 8, TILE.w + 16, TILE.h + 16);
    const s = this.placement.spot;
    const home = s && this.placement.done ? centre(spots[s]) : centre(l.tile!);
    tile.position.set(home.x, home.y);
    this.board.addChild(tile);
    this.tileNode = tile;
    this.tileDrag = draggable(tile, this.ctx.tw, {
      onPick: () => { this.tileHeld = true; this.redrawSpots(); },
      onMove: () => this.redrawSpots(),
      onDrop: (x, y) => this.dropTile(x, y),
    });
    this.tileDrag.enabled = !this.placement.done;
    const k = l.keep!;
    const keepNode = new Container();
    keepNode.position.copyFrom(centre(k));
    keepNode.addChild(keepArt(k.w, k.h));
    keepNode.hitArea = new Rectangle(-k.w / 2 - 8, -k.h / 2 - 8, k.w + 16, k.h + 16);
    onTap(keepNode, () => this.keepIt(), { cooldown: 400 });
    keepNode.visible = this.keepShown;
    this.board.addChild(keepNode);
    this.keepNode = keepNode;
  }

  private buildPlan(l: KeepLayout) {
    this.cellNodes = l.cells!.map((r) => {
      const node = new Container();
      node.position.set(r.x, r.y);
      node.eventMode = 'none';
      this.board.addChild(node);
      return node;
    });
    this.cardNodes = l.cards!.map((r, i) => {
      const node = new Container();
      node.position.copyFrom(centre(r));
      node.hitArea = new Rectangle(-r.w / 2 - 4, -r.h / 2 - 4, r.w + 8, r.h + 8);
      onTap(node, () => this.sayNeed(i + 1), { cooldown: 400 });
      this.board.addChild(node);
      return node;
    });
    const bell = new Container();
    const br = l.bell!;
    bell.position.copyFrom(centre(br));
    bell.hitArea = new Rectangle(-br.w / 2 - 8, -br.h / 2 - 8, br.w + 16, br.h + 16);
    onTap(bell, () => this.ring(), { cooldown: 500 });
    this.board.addChild(bell);
    this.bellNode = bell;
    this.redrawCells();
    this.redrawCards();
    this.redrawBell();
    PLAN_ROOMS.forEach((room) => {
      const node = new Container();
      node.addChild(tileArt(room, TILE.w));
      node.hitArea = new Rectangle(-TILE.w / 2 - 8, -TILE.h / 2 - 8, TILE.w + 16, TILE.h + 16);
      node.position.copyFrom(this.tileHome(room));
      this.board.addChild(node);
      const drag = draggable(node, this.ctx.tw, {
        onPick: () => { this.heldRoom = room; this.redrawCells(); },
        onMove: () => this.redrawCells(),
        onDrop: (x, y) => this.dropRoom(room, x, y),
      });
      drag.enabled = !this.plan.done;
      this.planTiles.set(room, { node, drag });
    });
  }

  // ——— Redrawing from the model ———

  private redrawDoors() {
    const l = this.layoutNow;
    if (!l?.doors || !this.doors) return;
    const glowing = this.idle >= IDLE_GLOW && !this.busy ? nextDoor(this.doors) : null;
    this.doorNodes.forEach((node, i) => {
      for (const c of node.removeChildren()) c.destroy({ children: true });
      node.addChild(doorArt(l.doors![i].w, l.doors![i].h, this.doors!.opened[i], glowing === i));
    });
    if (this.wellNode) {
      for (const c of this.wellNode.removeChildren()) c.destroy({ children: true });
      this.wellNode.addChild(wellArt(l.well!.w, l.well!.h, this.doors.bucket === 'up'));
    }
  }

  /** A person standing in front of door `i`. */
  private standOut(i: number, person: Person): Container {
    const r = this.layoutNow!.doors![i];
    const node = figureArt(person);
    node.position.set(r.x + r.w / 2, r.y + r.h + 10);
    this.walkLayer.addChild(node);
    this.peopleOut[i] = node;
    return node;
  }

  private redrawRooms() {
    const l = this.layoutNow;
    if (!l?.rooms) return;
    const yb = this.yardBrief;
    const g = glowTarget(yb, this.yard, this.held);
    yb.rooms.forEach((room, i) => {
      const node = this.roomNodes[i];
      for (const c of node.removeChildren()) c.destroy({ children: true });
      const working = yb.figures.some((f) => this.yard.placed[f] === room);
      node.addChild(roomArt(room, l.rooms![i].w, l.rooms![i].h, working, g?.room === room && !this.busy));
    });
  }

  private redrawSpots() {
    const l = this.layoutNow;
    if (!l?.yard || !this.spotNodes) return;
    const p = this.placementBrief;
    const spots = spotRects(p, l.yard);
    const t = this.tileNode;
    for (const s of ['near', 'far'] as const) {
      const node = this.spotNodes[s];
      for (const c of node.removeChildren()) c.destroy({ children: true });
      const lit = this.tileHeld && !!t && contains(spots[s], t.x, t.y, 30);
      node.addChild(spotArt(SPOT.w, lit, s === 'near' && this.placement.hinted && !this.placement.done));
    }
  }

  private cellKind(c: number): 'ground' | 'well' | 'gate' | 'cool' | 'sunny' | 'cool-sunny' {
    const b = this.boardNow;
    if (c === b.well) return 'well';
    if (c === b.gate) return 'gate';
    const sunny = b.sunny.includes(c);
    if (c === b.cool) return sunny ? 'cool-sunny' : 'cool';
    return sunny ? 'sunny' : 'ground';
  }

  private redrawCells() {
    const l = this.layoutNow;
    if (!l?.cells) return;
    const held = this.heldRoom ? this.planTiles.get(this.heldRoom)?.node : null;
    const hint = this.plan.hinted && !this.plan.done ? hintFor(this.boardNow, this.plan.layout) : null;
    this.cellNodes.forEach((node, c) => {
      for (const ch of node.removeChildren()) ch.destroy({ children: true });
      const kind = this.cellKind(c);
      const lit = !!held && kind !== 'well' && kind !== 'gate' && contains(l.cells![c], held.x, held.y, 10);
      node.addChild(cellArt(CELL, kind, lit, hint?.to === c));
    });
  }

  private redrawCards() {
    const l = this.layoutNow;
    if (!l?.cards) return;
    this.cardNodes.forEach((node, i) => {
      for (const ch of node.removeChildren()) ch.destroy({ children: true });
      node.addChild(needArt(i + 1, l.cards![i].w, l.cards![i].h, this.verdict ? (this.verdict.get(i + 1) ?? null) : null));
    });
  }

  private redrawBell() {
    const l = this.layoutNow;
    if (!l?.bell || !this.bellNode) return;
    for (const ch of this.bellNode.removeChildren()) ch.destroy({ children: true });
    this.bellNode.addChild(bellArt(l.bell.w, l.bell.h, allPlaced(this.plan.layout) && !this.plan.done));
  }

  /** Where a room tile rests: its cell, or its tray slot. */
  private tileHome(room: PlanRoom) {
    const l = this.layoutNow!;
    const c = this.plan.layout[room];
    return centre(c === undefined ? l.tray![PLAN_ROOMS.indexOf(room)] : l.cells![c]);
  }

  /** Every tile to its home (after a move, a swap or a return), the glow recomputed. */
  private settleTiles(animated = true) {
    for (const [room, t] of this.planTiles) {
      const home = this.tileHome(room);
      t.drag.home = home;
      if (t.node.x !== home.x || t.node.y !== home.y) {
        if (animated) void this.ctx.tw.to(t.node.position, { x: home.x, y: home.y }, { duration: 0.3, ease: ease.outQuad });
        else t.node.position.set(home.x, home.y);
      }
    }
    this.redrawCells();
    this.redrawBell();
  }

  // ——— Level 1 ———

  tapDoor(i: number) {
    if (this.finished || !this.doors || !this.layoutNow) return;
    const node = this.doorNodes[i];
    this.idle = 0;
    // The door starts to swing on touch-down, before any rule.
    node.scale.x = 0.94;
    void this.ctx.tw.to(node.scale, { x: 1 }, { duration: 0.2, ease: ease.outBack });
    const b = this.brief as { doors: Person[] };
    if (this.doors.opened[i]) {
      const p = this.peopleOut[i];
      if (p) { sfx.pop(9); void this.ctx.tw.to(p, { rotation: -0.15 }, { duration: 0.12 }).then(() => this.ctx.tw.to(p, { rotation: 0 }, { duration: 0.2, ease: ease.outBack })); }
      return;
    }
    this.doors = tapDoor(this.doors, i);
    this.redrawDoors();
    const person = b.doors[i];
    PERSON_SOUND[person]();
    sfx.pluck(4 + i * 2);
    void this.ctx.say(`kh.door.${person}` as LineId);
    const r = this.layoutNow.doors![i];
    const out = this.standOut(i, person);
    out.y = r.y + r.h - 30;
    out.alpha = 0;
    void this.ctx.tw.to(out, { alpha: 1 }, { duration: 0.2 });
    void this.ctx.tw.to(out.position, { y: r.y + r.h + 10 }, { duration: 0.4, ease: ease.outQuad });
    if (doorsDone(this.doors)) void this.wave();
  }

  tapWell() {
    if (this.finished || !this.doors) return;
    this.idle = 0;
    this.wellTapped = true;
    this.doors = tapWell(this.doors);
    sfx.splash();
    this.redrawDoors();
    const w = this.wellNode;
    if (w) { w.scale.y = 0.95; void this.ctx.tw.to(w.scale, { y: 1 }, { duration: 0.25, ease: ease.outBack }); }
  }

  /** Every door is open: the people wave together, then the round finishes. */
  private async wave() {
    const epoch = this.epoch;
    this.busy = true;
    await this.ctx.tw.wait(0.5);
    if (!this.live(epoch)) return;
    for (const p of this.peopleOut) if (p) void this.ctx.tw.to(p, { rotation: -0.12 }, { duration: 0.15 }).then(() => this.ctx.tw.to(p, { rotation: 0 }, { duration: 0.25, ease: ease.outBack }));
    sfx.giggle();
    await this.ctx.tw.wait(0.5);
    if (!this.live(epoch)) return;
    this.celebrate();
  }

  // ——— Level 2 ———

  private dropFigure(figure: Figure, x: number, y: number): boolean {
    this.held = null;
    const l = this.layoutNow;
    if (!l?.rooms || this.finished) return false;
    const yb = this.yardBrief;
    const i = l.rooms.findIndex((r) => contains(r, x, y + 50, 10));
    if (i < 0) { this.redrawRooms(); return false; }
    const room = yb.rooms[i];
    const r = drop(yb, this.yard, figure, room);
    this.yards[this.yardIndex] = r.state;
    if (r.taken) { void this.walkIn(figure, i); return true; }
    sfx.boing();
    void this.ctx.say(`kh.wrong.${figure}` as LineId).then(() => { if (r.glowed && this.alive) void this.ctx.say('kh.glow'); });
    const node = this.roomNodes[i];
    void this.ctx.tw.to(node, { rotation: 0.04 }, { duration: 0.08 }).then(() => this.ctx.tw.to(node, { rotation: 0 }, { duration: 0.25, ease: ease.outElastic }));
    this.redrawRooms();
    return false;
  }

  /** The figure walks into its room and its work starts. */
  private async walkIn(figure: Figure, roomIndex: number) {
    const epoch = this.epoch;
    const f = this.figureNodes.get(figure);
    const l = this.layoutNow;
    if (!f || !l?.rooms) return;
    this.busy = true;
    f.drag.enabled = false;
    f.node.eventMode = 'none';
    const r = l.rooms[roomIndex];
    sfx.pluck(6);
    await this.ctx.tw.to(f.node.position, { x: r.x + r.w / 2, y: r.y + r.h - 14 }, { duration: this.ctx.demo ? 0.3 : 0.5, ease: ease.inOutSine });
    if (!this.live(epoch)) return;
    for (const c of f.node.removeChildren()) c.destroy({ children: true });
    f.node.addChild(figureArt(figure, true));
    AT_WORK_SOUND[figure]();
    this.redrawRooms();
    void this.ctx.say(`kh.at-work.${figure}` as LineId);
    if (!yardDone(this.yardBrief, this.yard)) {
      this.busy = false;
      if (this.relayout) this.build();
      return;
    }
    await this.ctx.tw.wait(1.2);
    if (!this.live(epoch)) return;
    if (this.yardIndex + 1 >= this.yards.length) { this.celebrate(); return; }
    this.yardIndex++;
    this.busy = false;
    this.build();
    void this.ctx.say('kh.next-yard');
  }

  // ——— Level 3 ———

  private dropTile(x: number, y: number): boolean {
    this.tileHeld = false;
    const l = this.layoutNow;
    if (!l?.yard || this.finished || this.placement.done) { this.redrawSpots(); return false; }
    const spots = spotRects(this.placementBrief, l.yard);
    const spot = (['near', 'far'] as const).find((s) => contains(spots[s], x, y, 30));
    this.redrawSpots();
    if (!spot) return false;
    this.placements[this.placementIndex] = place(this.placementBrief, this.placement, spot);
    void this.walkTo(spot);
    return true;
  }

  /** The tile snaps to its spot and the walk plays: the cook from the kitchen to the hall, or the horses from the gate to the stable. */
  private async walkTo(spot: Spot) {
    const epoch = this.epoch;
    const l = this.layoutNow;
    const t = this.tileNode;
    if (!l?.yard || !t) return;
    this.busy = true;
    this.tileDrag!.enabled = false;
    if (this.keepNode) this.keepNode.visible = false;
    this.keepShown = false;
    const p = this.placementBrief;
    const spots = spotRects(p, l.yard);
    const to = centre(spots[spot]);
    this.tileDrag!.home = to;
    await this.ctx.tw.to(t.position, { x: to.x, y: to.y }, { duration: 0.25, ease: ease.outBack });
    if (!this.live(epoch)) return;
    sfx.tick();
    const steps = stepsTo(p, spot);
    const hot = this.placement.arrived === 'hot';
    const fixed = fixedRect(p, l.yard);
    const fixedAt = { x: fixed.x + fixed.w / 2, y: fixed.y + fixed.h - 14 };
    const spotAt = { x: to.x, y: to.y + SPOT.h / 2 - 8 };
    const from = p.room === 'kitchen' ? spotAt : fixedAt;
    const dest = p.room === 'kitchen' ? fixedAt : spotAt;
    const walker = figureArt(p.room === 'kitchen' ? 'cook' : 'horse', true);
    walker.position.set(from.x, from.y);
    this.walkLayer.addChild(walker);
    const steam = steamArt(true);
    steam.position.set(p.room === 'kitchen' ? 34 : 0, p.room === 'kitchen' ? -70 : -130);
    if (p.room === 'kitchen') walker.addChild(steam); else steam.destroy();
    const stepSeconds = this.ctx.demo ? 0.18 : 0.45;
    for (let s = 1; s <= steps; s++) {
      const k = s / steps;
      sfx.tick();
      void this.ctx.tw.to(walker.scale, { y: 0.94 }, { duration: stepSeconds * 0.5 }).then(() => this.ctx.tw.to(walker.scale, { y: 1 }, { duration: stepSeconds * 0.5 }));
      await this.ctx.tw.to(walker.position, { x: from.x + (dest.x - from.x) * k, y: from.y + (dest.y - from.y) * k }, { duration: stepSeconds, ease: ease.linear });
      if (!this.live(epoch)) return;
      // From the far spot the steam is gone by the second step.
      if (!hot && s === 2 && p.room === 'kitchen') void this.ctx.tw.to(steam, { alpha: 0 }, { duration: stepSeconds });
    }
    if (hot) {
      sfx.tada();
      this.ctx.particles.burst(dest.x, dest.y - 80, { colors: [swatch.yellow.fill, swatch.orange.fill, 0xffffff], count: 12 });
      if (p.room === 'stable') AT_WORK_SOUND.horse();
      await this.ctx.say('kh.hot');
      if (!this.live(epoch)) return;
      await this.ctx.tw.wait(0.3);
      if (!this.live(epoch)) return;
      void this.nextPlacement();
      return;
    }
    sfx.sigh();
    void this.ctx.tw.to(walker, { alpha: 0.6 }, { duration: 0.3 });
    await this.ctx.say(p.room === 'kitchen' ? 'kh.cold' : 'kh.cold-horses');
    if (!this.live(epoch)) return;
    if (this.placement.done) {
      // Kept twice: the walk replayed cold and the placement stands as she left it.
      void this.nextPlacement();
      return;
    }
    void this.ctx.say('kh.ask-move');
    // The tile lifts back to her hand and Keep it appears.
    const home = centre(l.tile!);
    this.tileDrag!.home = home;
    await this.ctx.tw.to(t.position, { x: home.x, y: home.y }, { duration: 0.4, ease: ease.inOutSine });
    if (!this.live(epoch)) return;
    this.tileDrag!.enabled = true;
    if (this.keepNode) this.keepNode.visible = true;
    this.keepShown = true;
    this.busy = false;
    if (this.relayout) this.build();
  }

  keepIt() {
    if (this.finished || this.busy || !this.keepShown || this.placement.done || this.placement.spot !== 'far') return;
    const k = this.keepNode;
    if (k) { k.scale.set(0.94); void this.ctx.tw.to(k.scale, { x: 1, y: 1 }, { duration: 0.2, ease: ease.outBack }); }
    const was = this.placement;
    this.placements[this.placementIndex] = keep(was);
    const now = this.placement;
    if (now.hinted && !was.hinted) {
      // Kept twice: the near spot glows (the placement's one hint), the reason is said, and the far placement stands.
      this.redrawSpots();
      void this.ctx.say('kh.keep-shown');
    }
    void this.walkTo('far');
  }

  /** Called while busy: the next placement's yard, or the finish. */
  private async nextPlacement() {
    const epoch = this.epoch;
    this.tileDrag!.enabled = false;
    if (this.placementIndex + 1 >= this.placements.length) { this.celebrate(); return; }
    await this.ctx.tw.wait(0.6);
    if (!this.live(epoch)) return;
    this.placementIndex++;
    this.keepShown = false;
    this.busy = false;
    for (const c of this.walkLayer.removeChildren()) c.destroy({ children: true });
    this.build();
    void this.ctx.say('kh.next-stable');
  }

  // ——— Level 4 ———

  private dropRoom(room: PlanRoom, x: number, y: number): boolean {
    this.heldRoom = null;
    const l = this.layoutNow;
    if (!l?.cells || this.finished || this.plan.done) { this.redrawCells(); return false; }
    const c = l.cells.findIndex((r) => contains(r, x, y, 10));
    let move: Move | null = null;
    if (c >= 0 && c !== this.boardNow.well && c !== this.boardNow.gate) move = { room, to: c };
    else if (c < 0 && l.tray!.some((r) => contains(r, x, y, 60))) move = { room, to: 'tray' };
    if (!move) { this.settleTiles(); return false; }
    this.plans[this.planIndex] = movePlan(this.boardNow, this.plan, move);
    this.verdict = null;
    this.redrawCards();
    sfx.pop(move.to === 'tray' ? 4 : 8);
    this.settleTiles();
    return true;
  }

  sayNeed(i: number) {
    if (this.finished) return;
    const node = this.cardNodes[i - 1];
    if (node) { node.scale.set(0.96); void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.2, ease: ease.outBack }); }
    void this.ctx.say(`kh.need.${i}` as LineId);
  }

  ring() {
    if (this.finished || this.busy || this.plan.done) return;
    const bell = this.bellNode;
    if (bell) { bell.rotation = -0.12; void this.ctx.tw.to(bell, { rotation: 0 }, { duration: 0.35, ease: ease.outElastic }); }
    const r = ringBell(this.boardNow, this.plan);
    this.plans[this.planIndex] = r.state;
    if (r.empty) {
      sfx.shake();
      void this.ctx.say('kh.tray');
      for (const [room, t] of this.planTiles) if (this.plan.layout[room] === undefined) void this.ctx.tw.to(t.node, { rotation: 0.08 }, { duration: 0.08 }).then(() => this.ctx.tw.to(t.node, { rotation: 0 }, { duration: 0.3, ease: ease.outElastic }));
      return;
    }
    this.verdict = new Map(NEEDS.map((n) => [n.index, !r.unmet.includes(n)]));
    this.redrawCards();
    if (r.unmet.length === 0) { void this.moveIn(); return; }
    sfx.boing();
    for (const need of r.unmet) for (const room of need.rooms) {
      const t = this.planTiles.get(room);
      if (t) void this.ctx.tw.to(t.node, { rotation: 0.1 }, { duration: 0.08 }).then(() => this.ctx.tw.to(t.node, { rotation: 0 }, { duration: 0.35, ease: ease.outElastic }));
    }
    void this.ctx.say(`kh.unmet.${r.unmet[0].index}` as LineId).then(() => { if (r.glowed && this.alive) void this.ctx.say('kh.glow'); });
    this.redrawCells();
  }

  /** Every need met: the bell rings, the household walks in, and the next plan or the finish follows. */
  private async moveIn() {
    const epoch = this.epoch;
    const l = this.layoutNow;
    if (!l?.cells) return;
    this.busy = true;
    for (const t of this.planTiles.values()) t.drag.enabled = false;
    this.redrawBell();
    this.redrawCells();
    for (const [i, step] of BELL_STEPS.entries()) { void this.ctx.tw.wait(i * 0.25).then(() => { if (this.alive) sfx.bell(step, 0.35); }); }
    void this.ctx.say('kh.plan-done');
    const who: [Figure, PlanRoom][] = [['cook', 'kitchen'], ['horse', 'stable'], ['steward', 'storeroom']];
    const gate = l.cells[this.boardNow.gate];
    for (const [figure, room] of who) {
      const c = this.plan.layout[room]!;
      const r = l.cells[c];
      const f = figureArt(figure, true);
      f.scale.set(0.55);
      f.position.set(gate.x + gate.w / 2, gate.y + gate.h - 8);
      this.walkLayer.addChild(f);
      void this.ctx.tw.to(f.position, { x: r.x + r.w / 2, y: r.y + r.h - 8 }, { duration: this.ctx.demo ? 0.4 : 0.8, ease: ease.inOutSine });
    }
    await this.ctx.tw.wait(this.ctx.demo ? 0.6 : 1.3);
    if (!this.live(epoch)) return;
    this.ctx.particles.burst(l.cells[4].x + CELL / 2, l.cells[4].y, { colors: [swatch.yellow.fill, swatch.green.fill, 0xffffff], count: 14 });
    await this.ctx.tw.wait(0.5);
    if (!this.live(epoch)) return;
    if (this.planIndex + 1 >= this.plans.length) { this.celebrate(); return; }
    this.planIndex++;
    this.verdict = null;
    this.busy = false;
    for (const c of this.walkLayer.removeChildren()) c.destroy({ children: true });
    this.build();
    void this.ctx.say('kh.next-plan');
  }

  // ——— Finishing and help ———

  private celebrate() {
    if (this.finished) return;
    this.busy = true;
    sfx.tada();
    this.ctx.pet.cheer();
    const result = this.tally;
    void this.ctx.say('kh.done').then(() => {
      if (!this.alive || this.finished) return;
      this.finished = true;
      this.ctx.finish(result);
    });
  }

  hintLabel = 'Help';

  /** The pet's Help: at level 1 the ask again (free); at levels 2–4 the glow, the part's one hint if not yet spent. */
  askForHint() {
    if (this.finished) return;
    if (this.brief.id === 'doors') { void this.ctx.instruct('kh.instruct.1'); return; }
    if (this.busy) return;
    if (this.brief.id === 'workplaces') {
      this.yards[this.yardIndex] = askYard(this.yard);
      this.redrawRooms();
      void this.ctx.say('kh.help');
      return;
    }
    if (this.brief.id === 'walk') {
      this.placements[this.placementIndex] = askPlacement(this.placement);
      this.redrawSpots();
      void this.ctx.say('kh.help-near');
      return;
    }
    this.plans[this.planIndex] = askPlan(this.plan);
    this.redrawCells();
    void this.ctx.say('kh.help');
  }

  update(dt: number) {
    this.clock += dt;
    if (this.relayout && !this.busy && !this.finished && !this.held && !this.heldRoom && !this.tileHeld) this.build();
    if (this.brief.id === 'doors' && this.doors && !this.busy && !this.finished) {
      const was = this.idle >= IDLE_GLOW;
      this.idle += dt;
      if (!was && this.idle >= IDLE_GLOW) this.redrawDoors();
    }
    this.glow.clear();
    if (this.finished || !this.layoutNow || this.busy) return;
    const r = 1 + 0.05 * Math.sin(this.clock * 5);
    const ring = (rect: Rect, pad: number) => this.glow.roundRect(rect.x - pad * r, rect.y - pad * r, rect.w + 2 * pad * r, rect.h + 2 * pad * r, 26).stroke({ width: 8, color: swatch.yellow.fill });
    if (this.brief.id === 'plan' && this.plan.hinted && !this.plan.done) {
      const h = hintFor(this.boardNow, this.plan.layout);
      if (h) {
        const t = this.planTiles.get(h.room)?.node;
        if (t && !this.heldRoom) ring({ x: t.x - TILE.w / 2, y: t.y - TILE.h / 2, w: TILE.w, h: TILE.h }, 8);
        if (h.to === 'tray') ring(this.layoutNow.tray![PLAN_ROOMS.indexOf(h.room)], 10);
      }
    }
  }

  /** The ghost finger: each closed door (the well once before the last); each figure to its workplace; the tile to the near spot; each room to a cell of the first solution, then the bell. Never a wrong drop. */
  autotouch(): TouchIntent | null {
    if (this.finished || this.busy || !this.layoutNow) return null;
    const l = this.layoutNow;
    if (this.brief.id === 'doors') {
      if (!this.doors) return null;
      const next = nextDoor(this.doors);
      if (next === null) return null;
      const left = this.doors.opened.filter((o) => !o).length;
      if (!this.wellTapped && left === 1 && this.wellNode) return { tap: { on: this.wellNode, y: -l.well!.h / 2 }, pause: 0.8 };
      return { tap: { on: this.doorNodes[next], x: l.doors![next].w / 2, y: l.doors![next].h / 2 }, pause: 1.0 };
    }
    if (this.brief.id === 'workplaces') {
      const yb = this.yardBrief;
      const figure = yb.figures.find((f) => !this.yard.placed[f]);
      if (!figure) return null;
      const f = this.figureNodes.get(figure);
      const i = yb.rooms.indexOf(workplaceOf(figure));
      if (!f || i < 0) return null;
      return { drag: { on: f.node, y: -60 }, to: { on: this.roomNodes[i], x: l.rooms![i].w / 2, y: l.rooms![i].h / 2 }, pause: 0.9 };
    }
    if (this.brief.id === 'walk') {
      if (this.placement.done || this.placement.spot || !this.tileNode || !this.spotNodes) return null;
      return { drag: { on: this.tileNode }, to: { on: this.spotNodes.near }, pause: 0.8 };
    }
    if (this.plan.done) return null;
    const target = solutions(this.boardNow)[0];
    for (const room of PLAN_ROOMS) {
      if (this.plan.layout[room] === target[room]) continue;
      const t = this.planTiles.get(room);
      if (!t) return null;
      return { drag: { on: t.node }, to: { on: this.cellNodes[target[room]!], x: CELL / 2, y: CELL / 2 }, pause: 0.6 };
    }
    return this.bellNode ? { tap: { on: this.bellNode }, pause: 0.6 } : null;
  }
}

class CastleIcon extends WigglyIcon {
  constructor() {
    super(iconArt());
  }
}

/** A seeded sticker: a small plan with the five rooms placed and the cook at the hearth. */
function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const cells = rng.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, 5);
  return stickerArt(cells, cells[1]);
}

export const keepHouse: GameModule = {
  id: 'keep-house',
  name: 'Keep House',
  titleLine: 'game.keep-house',
  region: 'cozy-village',
  skills: ['matching', 'spatial-reasoning', 'reasons', 'checking'],
  bands: ['toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.hub,
  coplayHint: 'Steward and mason: one of you says who comes out of each door or reads the needs aloud, the other places; swap after each plan.',
  hubIcon: () => new CastleIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new KeepHouse(ctx),
};

