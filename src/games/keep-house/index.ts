/**
 * Keep House: put the castle's household where its work needs it. Level 1 taps the doors and the well and a worker comes out
 * with their tool; level 2 drags each figure to its workplace; level 3 puts the kitchen, then the stable, on a near or far spot
 * and watches whether the soup (or the horses) arrive well; level 4 fits five rooms on a 3 × 3 plan to five needs and rings the
 * bell to check; level 5 reads a roofless ruin and drags a picture label onto each room; level 6 builds a lord's hall in timber
 * or stone and plays the years. Rules: ./logic.ts; definition: docs/definitions/keep-house.md.
 */
import { Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
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
import { bagArt, bellArt, buildButtonArt, cellArt, hallArt, labelArt, rowArt, ruinCellArt, yearBarArt, doorArt, figureArt, fixedArt, frontArt, iconArt, keepArt, needArt, roomArt, spotArt, steamArt, stickerArt, tileArt, wellArt } from './art';
import {
  account, askBuild, decidingClue as decidingClueOf, askRuin, BUILDS_ORDER, buildTally, cost, fits, keepBuild, label, placeBuild, roomInCell, ruinDone, ruinHint, ruinTally, spareLabel, startBuild, startRuin, YEAR_STEP,
  allPlaced, askPlacement, askPlan, askYard, briefFor, CELL, centre, doorsDone, drop, fixedRect, glowTarget, hintFor, keep, keepLayout, movePlan, NEEDS, nextDoor, place, PLAN_ROOMS, planFor, planTally, ringBell, solutions, SPOT, spotRects, startDoors, startPlacement, startPlan, startYard, stepsTo, tapDoor, tapWell, TILE, walkTally, workplaceOf, yardDone, yardTally,
  type Board, type Brief, type Build, type BuildState, type Hall, type Ruin, type RuinState, type Situation, type DoorsState, type Figure, type KeepLayout, type Move, type Person, type Placement, type PlacementState, type PlanRoom, type PlanState, type Rect, type Room, type Spot, type YardState,
} from './logic';

const LEVELS: BandLevels = {
  toddler: { min: 1, max: 1 },
  preschool: { min: 1, max: 3 },
  prek: { min: 2, max: 4 },
  school: { min: 4, max: 6 },
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
/** Who comes back for a moment when a ruin's room is named. */
const RUIN_FIGURE: Record<PlanRoom, Figure> = { hall: 'ringer', kitchen: 'cook', stable: 'horse', storeroom: 'steward', solar: 'groom' };
/** The lords of level 6, island critters. */
const LORDS: (keyof typeof CRITTERS)[] = ['bunny', 'bear', 'pig', 'cow', 'cat', 'duck'];
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
  ruins: RuinState[] = [];
  ruinIndex = 0;
  /** The label she holds (level 5). */
  heldLabel: PlanRoom | null = null;
  /** A room has been tapped on this ruin (the bot's one look). */
  looked = false;
  private lookToken = 0;
  ruinCells: Container[] = [];
  labelNodes = new Map<PlanRoom, { node: Container; drag: DragHandle }>();
  builds: BuildState[] = [];
  buildIndex = 0;
  /** The row lifted on the card (level 6), and the rows looked at this situation. */
  lifted: Build | null = null;
  rowsSeen = new Set<Build>();
  rowNodes: Container[] = [];
  buildNode: Container | null = null;
  private strip = new Container();
  private site = new Container();
  /** The year and purse the playback shows, or null before a build. */
  private shown: { year: number; purse: number; hall: Hall } | null = null;

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
    if (this.brief.id === 'ruin') this.ruins = this.brief.ruins.map(() => startRuin());
    if (this.brief.id === 'build') this.builds = this.brief.situations.map(() => startBuild());
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

  get ruin() {
    return this.ruins[this.ruinIndex];
  }

  get ruinBrief(): Ruin {
    return (this.brief as { ruins: Ruin[] }).ruins[this.ruinIndex];
  }

  get buildState() {
    return this.builds[this.buildIndex];
  }

  get situation(): Situation {
    return (this.brief as { situations: Situation[] }).situations[this.buildIndex];
  }

  /** Round totals so far, for a check or the finish. */
  get tally() {
    if (this.brief.id === 'workplaces') return yardTally(this.yards);
    if (this.brief.id === 'walk') return walkTally(this.placements);
    if (this.brief.id === 'plan') return planTally(this.plans);
    if (this.brief.id === 'ruin') return ruinTally(this.ruins);
    if (this.brief.id === 'build') return buildTally(this.builds);
    return { misses: 0, hints: 0 };
  }

  start() {
    this.build();
    void this.ctx.instruct(`kh.instruct.${this.level}` as LineId);
    if (this.level >= 5) void this.ctx.say(`kh.history.${this.level}` as LineId);
    else if (this.level >= 2) void this.ctx.say('kh.history');
    if (this.brief.id === 'build') void this.introduceLord();
  }

  destroy() {
    this.alive = false;
    this.releaseDrags();
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    if (!this.layoutNow) return;
    if (this.busy || this.finished || this.held || this.heldRoom || this.tileHeld || this.heldLabel) { this.relayout = true; return; }
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
    for (const t of this.labelNodes.values()) t.drag.destroy();
    this.labelNodes.clear();
    this.held = this.heldRoom = this.heldLabel = null;
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
    this.ruinCells = [];
    this.rowNodes = [];
    this.wellNode = this.tileNode = this.keepNode = this.bellNode = this.buildNode = null;
    this.strip.removeFromParent();
    this.site.removeFromParent();
    for (const c of this.strip.removeChildren()) c.destroy({ children: true });
    for (const c of this.site.removeChildren()) c.destroy({ children: true });
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
    else if (this.brief.id === 'ruin') this.buildRuin(l);
    else if (this.brief.id === 'build') this.buildCard(l);
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
    // One walk at a time: the other figures wait until this one is at work.
    for (const [other, o] of this.figureNodes) if (other !== figure && !this.yard.placed[other]) o.drag.enabled = false;
    const r = l.rooms[roomIndex];
    sfx.pluck(6);
    await this.ctx.tw.to(f.node.position, { x: r.x + r.w / 2, y: r.y + r.h - 14 }, { duration: this.ctx.demo ? 0.3 : 0.5, ease: ease.inOutSine });
    if (!this.live(epoch)) return;
    for (const c of f.node.removeChildren()) c.destroy({ children: true });
    f.node.addChild(figureArt(figure, true));
    AT_WORK_SOUND[figure]();
    this.redrawRooms();
    void this.ctx.say(`kh.at-work.${figure}` as LineId);
    for (const [other, o] of this.figureNodes) if (!this.yard.placed[other]) o.drag.enabled = true;
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
    this.placements[this.placementIndex] = keep(this.placement);
    const now = this.placement;
    if (now.done) {
      // Kept twice: the near spot glows (the placement's one hint, unless Help already spent it), the reason is said, and the far placement stands.
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

  // ——— Level 5 ———

  private buildRuin(l: KeepLayout) {
    const ruin = this.ruinBrief;
    this.ruinCells = l.cells!.map((r, c) => {
      const node = new Container();
      node.position.set(r.x, r.y);
      if (roomInCell(ruin, c)) {
        node.hitArea = new Rectangle(0, 0, CELL, CELL);
        onTap(node, () => this.lookRoom(c), { cooldown: 400 });
      } else node.eventMode = 'none';
      this.board.addChild(node);
      return node;
    });
    PLAN_ROOMS.forEach((room, i) => {
      if (this.ruin.settled.includes(room)) return;
      const node = new Container();
      node.addChild(labelArt(room, TILE.w));
      node.hitArea = new Rectangle(-TILE.w / 2 - 8, -TILE.h / 2 - 8, TILE.w + 16, TILE.h + 16);
      node.position.copyFrom(centre(l.tray![i]));
      this.board.addChild(node);
      const drag = draggable(node, this.ctx.tw, {
        onPick: () => this.pickLabel(room),
        onMove: () => this.redrawRuin(),
        onDrop: (x, y) => this.dropLabel(room, x, y),
      });
      this.labelNodes.set(room, { node, drag });
    });
    this.redrawRuin();
  }

  /** The cells (with the glow's clue), the settled labels and the glowing label, from the model. */
  private redrawRuin() {
    const l = this.layoutNow;
    if (!l?.cells || this.brief.id !== 'ruin') return;
    const ruin = this.ruinBrief;
    const hint = this.busy ? null : ruinHint(ruin, this.ruin, this.heldLabel);
    const held = this.heldLabel ? this.labelNodes.get(this.heldLabel)?.node : null;
    this.ruinCells.forEach((node, c) => {
      for (const ch of node.removeChildren()) ch.destroy({ children: true });
      const at = roomInCell(ruin, c);
      if (!at) {
        node.addChild(cellArt(CELL, c === ruin.board.well ? 'well' : c === ruin.board.gate ? 'gate' : 'ground'));
        return;
      }
      const lit = !!held && contains(l.cells![c], held.x, held.y, 10);
      node.addChild(ruinCellArt(CELL, at.shown, lit, hint && !hint.spare && hint.cell === c ? hint.clue : null));
      if (this.ruin.settled.includes(at.room)) {
        const tag = labelArt(at.room, 50);
        tag.position.set(CELL - 26, 26);
        node.addChild(tag);
      }
    });
    for (const [room, t] of this.labelNodes) {
      const glow = !!hint && (hint.spare ? room === spareLabel(ruin) : hint.label === room);
      for (const ch of t.node.removeChildren()) ch.destroy({ children: true });
      t.node.addChild(labelArt(room, TILE.w, glow));
    }
  }

  private pickLabel(room: PlanRoom) {
    this.heldLabel = room;
    this.lookToken++;
    sfx.pop(7);
    const hint = ruinHint(this.ruinBrief, this.ruin, room);
    void this.ctx.say(hint?.spare ? 'kh.not-here' : (`kh.label.${room}` as LineId));
    this.redrawRuin();
  }

  /** The free look: the cell brightens and the pet names what is left in it, one clue after another. */
  async lookRoom(c: number) {
    if (this.finished || this.busy || this.heldLabel) return;
    const at = roomInCell(this.ruinBrief, c);
    if (!at) return;
    this.looked = true;
    const node = this.ruinCells[c];
    node.alpha = 0.7;
    void this.ctx.tw.to(node, { alpha: 1 }, { duration: 0.4 });
    sfx.tick();
    const token = ++this.lookToken;
    const epoch = this.epoch;
    for (const k of at.shown) {
      await this.ctx.say(`kh.clue.${k}` as LineId);
      if (!this.live(epoch) || token !== this.lookToken) return;
    }
  }

  private dropLabel(room: PlanRoom, x: number, y: number): boolean {
    this.heldLabel = null;
    const l = this.layoutNow;
    if (!l?.cells || this.finished || this.busy) { this.redrawRuin(); return false; }
    const c = l.cells.findIndex((r) => contains(r, x, y, 10));
    if (c < 0) { this.redrawRuin(); return false; }
    const r = label(this.ruinBrief, this.ruin, room, c);
    this.ruins[this.ruinIndex] = r.state;
    if (r.settled) { void this.settleLabel(room, c); return true; }
    this.redrawRuin();
    if (!r.missed) return false;
    sfx.boing();
    const node = this.ruinCells[c];
    void this.ctx.tw.to(node, { x: node.x + 8 }, { duration: 0.06 }).then(() => this.ctx.tw.to(node, { x: l.cells![c].x }, { duration: 0.3, ease: ease.outElastic }));
    const epoch = this.epoch;
    void this.ctx.say('kh.has').then(() => {
      if (!this.live(epoch)) return;
      return this.ctx.say(`kh.clue.${r.clue}` as LineId).then(() => { if (r.glowed && this.live(epoch)) void this.ctx.say('kh.glow-clue'); });
    });
    return false;
  }

  /** The label settles on its room, the room's people come back for a moment, and the pet names the deciding clue. */
  private async settleLabel(room: PlanRoom, c: number) {
    const epoch = this.epoch;
    const l = this.layoutNow!;
    const t = this.labelNodes.get(room);
    this.busy = true;
    if (t) {
      t.drag.enabled = false;
      await this.ctx.tw.to(t.node.position, centre(l.cells![c]), { duration: 0.2, ease: ease.outBack });
      if (!this.live(epoch)) return;
      t.drag.destroy();
      t.node.destroy({ children: true });
      this.labelNodes.delete(room);
    }
    sfx.pluck(4 + this.ruin.settled.length * 2);
    this.redrawRuin();
    const r = l.cells![c];
    const who = figureArt(RUIN_FIGURE[room], true);
    who.scale.set(0.5);
    who.position.set(r.x + CELL / 2 - 14, r.y + CELL - 6);
    who.alpha = 0;
    this.walkLayer.addChild(who);
    void this.ctx.tw.to(who, { alpha: 1 }, { duration: 0.25 });
    AT_WORK_SOUND[RUIN_FIGURE[room]]();
    await this.ctx.say(`kh.clue.${decidingClueOf(this.ruinBrief, room)}` as LineId);
    if (!this.live(epoch)) return;
    await this.ctx.say(`kh.was.${room}` as LineId);
    if (!this.live(epoch)) return;
    await this.ctx.tw.to(who, { alpha: 0 }, { duration: 0.4 });
    if (!this.live(epoch)) return;
    who.destroy({ children: true });
    if (!ruinDone(this.ruinBrief, this.ruin)) {
      this.busy = false;
      this.redrawRuin();
      if (this.relayout) this.build();
      return;
    }
    // The household walks back into every room for a moment, then the ruin is quiet again.
    for (const [i, step] of BELL_STEPS.entries()) void this.ctx.tw.wait(i * 0.25).then(() => { if (this.alive) sfx.bell(step, 0.35); });
    for (const rr of this.ruinBrief.rooms) {
      const cell = l.cells![rr.cell];
      const f = figureArt(RUIN_FIGURE[rr.room], true);
      f.scale.set(0.5);
      f.position.set(cell.x + CELL / 2 - 14, cell.y + CELL - 6);
      this.walkLayer.addChild(f);
    }
    await this.ctx.say('kh.ruin-done');
    if (!this.live(epoch)) return;
    await this.ctx.tw.wait(this.ctx.demo ? 0.3 : 0.6);
    if (!this.live(epoch)) return;
    if (this.ruinIndex + 1 >= this.ruins.length) { this.celebrate(); return; }
    this.ruinIndex++;
    this.looked = false;
    this.busy = false;
    for (const ch of this.walkLayer.removeChildren()) ch.destroy({ children: true });
    this.build();
    void this.ctx.say('kh.next-ruin');
  }

  // ——— Level 6 ———

  private buildCard(l: KeepLayout) {
    this.board.addChild(this.strip, this.site);
    this.rowNodes = l.rows!.map((r, i) => {
      const node = new Container();
      node.position.copyFrom(centre(r));
      node.hitArea = new Rectangle(-r.w / 2 - 6, -r.h / 2 - 6, r.w + 12, r.h + 12);
      onTap(node, () => this.lookRow(BUILDS_ORDER[i]), { cooldown: 300 });
      this.board.addChild(node);
      return node;
    });
    const b = l.build!;
    const build = new Container();
    build.position.copyFrom(centre(b));
    build.hitArea = new Rectangle(-b.w / 2 - 6, -b.h / 2 - 6, b.w + 12, b.h + 12);
    onTap(build, () => this.doBuild(), { cooldown: 500 });
    this.board.addChild(build);
    this.buildNode = build;
    const k = l.keep!;
    const keepNode = new Container();
    keepNode.position.copyFrom(centre(k));
    keepNode.addChild(keepArt(k.w, k.h));
    keepNode.scale.set(k.w / 180 > 1 ? 1 : 1);
    keepNode.hitArea = new Rectangle(-k.w / 2 - 6, -k.h / 2 - 6, k.w + 12, k.h + 12);
    onTap(keepNode, () => this.keepBuildIt(), { cooldown: 500 });
    keepNode.visible = this.keepShown;
    this.board.addChild(keepNode);
    this.keepNode = keepNode;
    this.redrawRows();
    this.redrawStrip();
    this.redrawSite();
  }

  private redrawRows() {
    const l = this.layoutNow;
    if (!l?.rows || this.brief.id !== 'build') return;
    const s = this.buildState;
    const want = fits(this.situation);
    this.rowNodes.forEach((node, i) => {
      for (const ch of node.removeChildren()) ch.destroy({ children: true });
      const b = BUILDS_ORDER[i];
      node.addChild(rowArt(b, l.rows![i].w, l.rows![i].h, this.lifted === b, s.hinted && b === want && !this.busy));
      node.y = centre(l.rows![i]).y - (this.lifted === b ? 6 : 0);
    });
    if (this.buildNode) {
      for (const ch of this.buildNode.removeChildren()) ch.destroy({ children: true });
      this.buildNode.addChild(buildButtonArt(l.build!.w, l.build!.h, !!this.lifted && !s.done && !this.busy, s.choice !== null));
    }
  }

  /** The lord, the purse and the year bar; during playback the purse empties and the bar fills; a lifted row lays its life under the bar. */
  private redrawStrip() {
    const l = this.layoutNow;
    if (!l?.lord) return;
    for (const c of this.strip.removeChildren()) c.destroy({ children: true });
    const sit = this.situation;
    const lord = new Critter(CRITTERS[LORDS[sit.lord % LORDS.length]]);
    lord.alive = false;
    lord.scale.set(0.45);
    lord.position.set(l.lord.x + 50, l.lord.y + l.lord.h - 6);
    this.strip.addChild(lord);
    const purse = this.shown ? this.shown.purse : sit.bags;
    const bx = l.lord.x + 120;
    for (let i = 0; i < sit.bags; i++) {
      const b = bagArt(54, i >= purse);
      b.position.set(bx + 24 + i * 50, l.lord.y + 56);
      this.strip.addChild(b);
    }
    const barW = Math.min(l.lord.w - 130, (sit.years / YEAR_STEP) * 48);
    const bar = yearBarArt(sit.years, this.shown ? this.shown.year + YEAR_STEP : 0, barW);
    bar.position.set(bx, l.lord.y + 80);
    this.strip.addChild(bar);
    if (this.lifted && !this.shown) {
      // The lifted row's life along the stay: timber's 15-year halls side by side, or stone's 8 building years then one hall to the end.
      const g = new Graphics();
      const per = barW / sit.years;
      const y = l.lord.y + 110;
      if (this.lifted === 'timber') {
        for (let t = 0; t < sit.years; t += 15) g.roundRect(bx + t * per + 2, y, Math.min(15, sit.years - t) * per - 4, 16, 6).fill(0xc8935a).stroke({ width: 2, color: 0x7a5530 });
      } else {
        g.roundRect(bx + 2, y, 8 * per - 4, 16, 6).fill(0xd9b36a).stroke({ width: 2, color: 0x9c7a35 });
        g.roundRect(bx + 8 * per + 2, y, (sit.years - 8) * per - 4, 16, 6).fill(0xc9c3b8).stroke({ width: 2, color: 0x8a837a });
      }
      this.strip.addChild(g);
    }
  }

  private redrawSite() {
    const l = this.layoutNow;
    if (!l?.site) return;
    for (const c of this.site.removeChildren()) c.destroy({ children: true });
    const g = new Graphics();
    g.roundRect(l.site.x, l.site.y + l.site.h - 40, l.site.w, 40, 16).fill({ color: 0x8fc277, alpha: 0.8 });
    this.site.addChild(g);
    if (!this.shown) return;
    const hall = hallArt(this.shown.hall, Math.min(l.site.w - 150, 280));
    hall.position.set(l.site.x + l.site.w / 2 - 40, l.site.y + l.site.h - 24);
    this.site.addChild(hall);
  }

  /** A new situation: the lord says what the purse holds and how long the stay is. */
  private async introduceLord() {
    const epoch = this.epoch;
    const sit = this.situation;
    await this.ctx.say('kh.lord');
    if (!this.live(epoch)) return;
    await this.ctx.say(`kh.bags.${sit.bags}` as LineId);
    if (!this.live(epoch)) return;
    await this.ctx.say('kh.stay');
    if (!this.live(epoch)) return;
    await this.ctx.say(`kh.years.${sit.years}` as LineId);
  }

  /** The free look: the row lifts and its life is laid along the year bar; no total is spoken. */
  lookRow(b: Build) {
    if (this.finished || this.busy || this.buildState.done) return;
    this.lifted = b;
    this.rowsSeen.add(b);
    sfx.pop(b === 'timber' ? 6 : 8);
    void this.ctx.say(`kh.build.${b}` as LineId);
    this.redrawRows();
    this.redrawStrip();
  }

  doBuild() {
    if (this.finished || this.busy || this.buildState.done) return;
    const node = this.buildNode;
    if (node) { node.scale.set(0.94); void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.2, ease: ease.outBack }); }
    if (!this.lifted) {
      sfx.shake();
      void this.ctx.say('kh.pick-build');
      for (const r of this.rowNodes) void this.ctx.tw.to(r, { rotation: 0.05 }, { duration: 0.08 }).then(() => this.ctx.tw.to(r, { rotation: 0 }, { duration: 0.3, ease: ease.outElastic }));
      return;
    }
    this.builds[this.buildIndex] = placeBuild(this.situation, this.buildState, this.lifted);
    void this.playYears(this.lifted);
  }

  keepBuildIt() {
    if (this.finished || this.busy || !this.keepShown || this.buildState.done || !this.buildState.choice) return;
    const k = this.keepNode;
    if (k) { k.scale.set(0.94); void this.ctx.tw.to(k.scale, { x: 1, y: 1 }, { duration: 0.2, ease: ease.outBack }); }
    this.builds[this.buildIndex] = keepBuild(this.situation, this.buildState);
    this.lifted = this.buildState.choice;
    void this.playYears(this.buildState.choice!);
  }

  /** The years in 5-year steps: bags leave the purse as each hall goes up, timber greys and is rebuilt, stone stands in scaffolding, then the account. */
  private async playYears(b: Build) {
    const epoch = this.epoch;
    this.busy = true;
    this.keepShown = false;
    if (this.keepNode) this.keepNode.visible = false;
    const sit = this.situation;
    const acc = account(sit, b);
    this.redrawRows();
    const stepSeconds = this.ctx.demo ? 0.15 : 0.55;
    for (const [i, st] of acc.steps.entries()) {
      this.shown = { year: st.year, purse: st.purse, hall: st.hall };
      this.redrawStrip();
      this.redrawSite();
      if (st.event === 'built' || st.event === 'rebuilt' || st.event === 'building') sfx.knock();
      else if (st.event === 'rotted' || st.event === 'ran-out') sfx.pluck(1);
      else if (st.event === 'finished') sfx.bell(7, 0.4);
      else sfx.pluck(3 + (i % 5));
      await this.ctx.tw.wait(stepSeconds);
      if (!this.live(epoch)) return;
    }
    // The account: what it cost, and the hall at the end of the stay.
    await this.ctx.say('kh.spent');
    if (!this.live(epoch)) return;
    await this.ctx.say(`kh.bags.${acc.spent}` as LineId);
    if (!this.live(epoch)) return;
    await this.ctx.say(`kh.${acc.end}` as LineId);
    if (!this.live(epoch)) return;
    const s = this.buildState;
    const want = fits(sit);
    if (s.done && s.choice === want) {
      sfx.tada();
      const l = this.layoutNow!;
      this.ctx.particles.burst(l.site!.x + l.site!.w / 2, l.site!.y + 60, { colors: [swatch.yellow.fill, swatch.green.fill, 0xffffff], count: 14 });
      for (const [i, f] of (['cook', 'steward', 'ringer'] as Figure[]).entries()) {
        const a = figureArt(f, true);
        a.scale.set(0.55);
        a.position.set(l.site!.x + 40 + i * 50, l.site!.y + l.site!.h - 20);
        this.walkLayer.addChild(a);
      }
      await this.ctx.say('kh.cheer');
      if (!this.live(epoch)) return;
      void this.nextSituation();
      return;
    }
    if (s.done) {
      // Kept twice: the fitting row glows and the reason is said; the situation stands as she left it.
      this.busy = false;
      this.redrawRows();
      this.busy = true;
      await this.ctx.say(want === 'stone' ? 'kh.long-for-timber' : 'kh.short-for-stone');
      if (!this.live(epoch)) return;
      void this.nextSituation();
      return;
    }
    // The other choice: both accounts, then the question; Build again (free) or Keep it.
    await this.ctx.say(`kh.would-cost.${want}` as LineId);
    if (!this.live(epoch)) return;
    await this.ctx.say(`kh.bags.${cost(sit, want)}` as LineId);
    if (!this.live(epoch)) return;
    void this.ctx.say('kh.which-build');
    this.busy = false;
    this.shown = null;
    this.keepShown = true;
    if (this.keepNode) this.keepNode.visible = true;
    this.redrawRows();
    this.redrawStrip();
    if (this.relayout) this.build();
  }

  private async nextSituation() {
    const epoch = this.epoch;
    if (this.buildIndex + 1 >= this.builds.length) { this.celebrate(); return; }
    await this.ctx.tw.wait(this.ctx.demo ? 0.3 : 0.8);
    if (!this.live(epoch)) return;
    this.buildIndex++;
    this.lifted = null;
    this.rowsSeen.clear();
    this.shown = null;
    this.keepShown = false;
    this.busy = false;
    for (const c of this.walkLayer.removeChildren()) c.destroy({ children: true });
    this.build();
    await this.ctx.say('kh.next-lord');
    if (this.live(this.epoch)) void this.introduceLord();
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
    if (this.brief.id === 'ruin') {
      this.ruins[this.ruinIndex] = askRuin(this.ruin);
      this.redrawRuin();
      void this.ctx.say('kh.help-clue');
      return;
    }
    if (this.brief.id === 'build') {
      if (this.buildState.done) return;
      this.builds[this.buildIndex] = askBuild(this.buildState);
      this.redrawRows();
      void this.ctx.say('kh.help');
      return;
    }
    this.plans[this.planIndex] = askPlan(this.plan);
    this.redrawCells();
    void this.ctx.say('kh.help');
  }

  update(dt: number) {
    this.clock += dt;
    if (this.relayout && !this.busy && !this.finished && !this.held && !this.heldRoom && !this.tileHeld && !this.heldLabel) this.build();
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
    if (this.brief.id === 'ruin') {
      const ruin = this.ruinBrief;
      const next = ruin.rooms.find((r) => !this.ruin.settled.includes(r.room));
      if (!next) return null;
      const i = ruin.rooms.indexOf(next);
      if (!this.looked) return { tap: { on: this.ruinCells[next.cell], x: CELL / 2, y: CELL / 2 }, pause: 1.2 };
      const t = this.labelNodes.get(next.room);
      if (!t || i < 0) return null;
      return { drag: { on: t.node }, to: { on: this.ruinCells[next.cell], x: CELL / 2, y: CELL / 2 }, pause: 0.8 };
    }
    if (this.brief.id === 'build') {
      if (this.buildState.done || this.keepShown) return null;
      const want = fits(this.situation);
      const unseen = BUILDS_ORDER.find((b) => !this.rowsSeen.has(b));
      const row = (b: Build) => this.rowNodes[BUILDS_ORDER.indexOf(b)];
      if (unseen) return { tap: { on: row(unseen) }, pause: 1.0 };
      if (this.lifted !== want) return { tap: { on: row(want) }, pause: 0.8 };
      return this.buildNode ? { tap: { on: this.buildNode }, pause: 0.6 } : null;
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

