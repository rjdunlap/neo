import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, ink, swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { hinted, missEvery, newTally, tally } from '../../progress/coach';
import { rangeFor } from '../../progress/difficulty';
import { RoundButton, spring, squash } from '../../ui/buttons';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { actionIcon, anchorMark, duck, PATCH_COLORS, pips, pondIcon, STONE_COLORS } from './art';
import { CELL, pondLayout, TARGET, TRAY_W } from './layout';
import {
  type Board,
  type Clue,
  type Direction,
  type Placement,
  type Stone,
  LEVELS,
  counts,
  describeLevel,
  directions,
  ends,
  fits,
  hintFor,
  isSolved,
  makeBoard,
  tilings,
  unmetClues,
} from './logic';

const INSTRUCTIONS = ['domino-pond.match', 'domino-pond.rows', 'domino-pond.columns'] as const;
const HINT_LINES = [
  'domino-pond.hint-east',
  'domino-pond.hint-south',
  'domino-pond.hint-west',
  'domino-pond.hint-north',
] as const;
const CLUE_LINES = {
  equal: 'domino-pond.need-equal',
  less: 'domino-pond.need-less',
  more: 'domino-pond.need-more',
} as const;
const SIGNS = { equal: '=', less: '<', more: '>' };
const DRAWN_CELL = 94;
const CONTROL_RADIUS = TARGET / 2;
const ARRIVAL = 1.8;
const ACTIONS = ['help', 'turn', 'undo', 'check'] as const;
type Point = { x: number; y: number };

class Round implements Game {
  readonly root = new Container();
  private readonly scenery = new Graphics();
  private readonly boardArt = new Graphics();
  private readonly clueLayer = new Container();
  private readonly bird = duck();
  readonly board: Board;
  private readonly solutions: Placement[][];
  readonly cells = new Map<number, Container>();
  readonly tray = new Map<number, Container>();
  readonly controls: RoundButton[];
  readonly score = newTally();
  placed: Placement[] = [];
  private readonly undo: Placement[][] = [];
  selected: number | null = null;
  private readonly facing = new Map<number, Direction>();
  shownHint: ReturnType<typeof hintFor> = null;
  private missed: Clue | null = null;
  checked = false;
  private crossed = false;
  private travel = 0;
  private layout: ReturnType<typeof pondLayout>;

  constructor(private readonly ctx: GameContext) {
    const level = ctx.level === 2 || ctx.level === 3 ? ctx.level : 1;
    this.board = makeBoard(level, ctx.rng);
    this.solutions = tilings(this.board).filter((moves) => isSolved(this.board, moves));
    this.layout = pondLayout(ctx.view, level);
    ctx.stage.addChild(this.root);
    this.root.addChild(this.scenery, this.boardArt, this.clueLayer);

    for (const cell of this.board.cells) {
      const target = this.tapArea(CELL, CELL, () => this.tapCell(cell));
      this.cells.set(cell, target);
    }
    for (const stone of this.board.stones) {
      this.facing.set(stone.id, ctx.rng.pick(directions(this.board, stone)));
      const target = this.tapArea(TRAY_W, TARGET, () => this.pick(stone.id));
      target.addChild(new Graphics());
      this.tray.set(stone.id, target);
    }
    const callbacks = [() => this.help(), () => this.turn(), () => this.undoMove(), () => this.check()];
    const colors = [swatch.yellow, swatch.blue, swatch.purple, swatch.green];
    this.controls = ACTIONS.map((action, i) => {
      // The drawings are inset so neighboring controls keep their own full-size touch areas.
      const button = new RoundButton(actionIcon(action), colors[i], CONTROL_RADIUS - 9, callbacks[i]);
      button.hitArea = new Rectangle(-CONTROL_RADIUS, -CONTROL_RADIUS, TARGET, TARGET);
      this.root.addChild(button);
      return button;
    });
    this.root.addChild(this.bird);
    this.resize(ctx.view);
  }

  start() {
    const [left, middle, right] = this.board.clues;
    void this.ctx.instruct(INSTRUCTIONS[this.board.level - 1], {
      left: left.target,
      middle: middle.target,
      right: right?.target ?? 0,
    });
  }

  private tapArea(w: number, h: number, press: () => void) {
    const target = new Container();
    target.hitArea = new Rectangle(-w / 2, -h / 2, w, h);
    target.interactiveChildren = false;
    onTap(target, press);
    this.root.addChild(target);
    return target;
  }

  private direction(id: number): Direction {
    return this.facing.get(id) ?? 0;
  }

  private pick(id: number) {
    sfx.tick();
    const node = this.tray.get(id);
    if (node) {
      squash(node);
      spring(node);
    }
    this.selected = id;
    this.draw();
  }

  private turn() {
    if (this.selected === null) return;
    const stone = this.board.stones.find((stone) => stone.id === this.selected);
    if (!stone) return;
    const turns = directions(this.board, stone);
    const next = (turns.indexOf(this.direction(stone.id)) + 1) % turns.length;
    this.facing.set(stone.id, turns[next]);
    this.draw();
  }

  private tapCell(cell: number) {
    const occupied = this.placed.find((move) => ends(this.board, move).includes(cell));
    if (occupied) {
      sfx.tick();
      this.change(this.placed.filter((move) => move !== occupied));
      return;
    }
    if (this.selected === null) return;
    const move = { stone: this.selected, anchor: cell, direction: this.direction(this.selected) };
    if (!fits(this.board, this.placed, move)) return;
    const next = [...this.placed, move];
    if (this.board.level === 1) {
      const missed = unmetClues(this.board, next)[0];
      if (missed) return this.wrong(missed);
    }
    sfx.tick();
    this.change(next);
    if (this.board.level === 1 && isSolved(this.board, this.placed)) this.cross();
  }

  private change(next: Placement[]) {
    this.undo.push(this.placed);
    this.placed = next;
    this.edited();
  }

  private undoMove() {
    const previous = this.undo.pop();
    if (!previous) return;
    this.placed = previous;
    this.edited();
  }

  private edited() {
    this.selected = null;
    this.checked = false;
    this.missed = null;
    this.shownHint = null;
    this.draw();
  }

  private check() {
    if (this.checked || this.placed.length !== this.board.stones.length) return;
    const missed = unmetClues(this.board, this.placed)[0];
    if (missed) {
      this.checked = true;
      this.wrong(missed);
      return;
    }
    if (isSolved(this.board, this.placed)) this.cross();
  }

  private wrong(clue: Clue) {
    this.missed = clue;
    sfx.boing();
    if (missEvery(this.score)) this.help(false);
    this.draw();
    if (clue.relation === 'match') {
      void this.ctx.say('domino-pond.mismatch', { n: clue.target });
      return;
    }
    const names =
      this.board.level === 2 ? ['top row', 'bottom row'] : ['left column', 'middle column', 'right column'];
    void this.ctx.say(CLUE_LINES[clue.relation], {
      patch: names[this.board.clues.indexOf(clue)],
      n: clue.target,
    });
  }

  private help(speak = true) {
    this.shownHint = hintFor(this.board, this.placed, this.solutions);
    hinted(this.score);
    this.draw();
    if (speak) {
      const hint = this.shownHint;
      void this.ctx.say(
        !hint
          ? 'domino-pond.hint-check'
          : hint.kind === 'remove'
            ? 'domino-pond.remove'
            : HINT_LINES[hint.move.direction],
      );
    }
  }

  private cross() {
    this.crossed = true;
    this.draw();
    void this.ctx.say('domino-pond.cross');
  }

  update(dt: number) {
    if (!this.crossed || this.travel >= ARRIVAL) return;
    this.travel = Math.min(ARRIVAL, this.travel + dt);
    this.moveBird();
    if (this.travel === ARRIVAL) this.ctx.finish(tally(this.score));
  }

  private moveBird() {
    const L = this.layout;
    const start = L.x - 43;
    const end = L.x + CELL * L.columns + 43;
    const t = this.travel / ARRIVAL;
    const across = L.y + 52 - Math.sin(Math.PI * t) * 8 + Math.sin(t * 9 * Math.PI) * 5;
    this.bird.position.set(start + (end - start) * t, across);
  }

  resize(view: View) {
    this.layout = pondLayout(view, this.board.level);
    const L = this.layout;
    for (const [id, node] of this.cells) node.position.copyFrom(L.cell(id));
    this.board.stones.forEach((stone, i) => this.tray.get(stone.id)?.position.copyFrom(L.tray[i]));
    this.controls.forEach((control, i) => control.position.copyFrom(L.controls[i]));
    this.drawScenery();
    this.moveBird();
    this.draw();
  }

  private drawScenery() {
    const L = this.layout;
    const h = L.rows * CELL;
    const w = L.columns * CELL;
    const g = this.scenery
      .clear()
      .roundRect(L.x - 60, L.y - 16, w + 120, h + 32, 72)
      .fill(swatch.teal.light)
      .stroke({ width: 5, color: swatch.teal.fill })
      .roundRect(L.x - 52, L.y - 7, w + 104, h + 14, 61)
      .stroke({ width: 2, color: swatch.white.fill });
    for (const side of [-1, 1]) {
      const x = L.center + side * (w / 2 + 32);
      const y = L.y + h * 0.76;
      g.ellipse(x, y, 15, 8)
        .fill(swatch.green.fill)
        .moveTo(x, y)
        .lineTo(x + side * 10, y - 5)
        .stroke({ width: 2, color: swatch.green.line })
        .circle(x - side * 15, y + 17, 3)
        .fill(swatch.blue.fill);
    }
  }

  private draw() {
    this.drawBoard();
    this.drawTray();
    const enabled = [true, this.selected !== null, this.undo.length > 0, !this.checked];
    this.controls.forEach((control, i) => {
      control.visible =
        !this.crossed &&
        (i !== 3 || (this.board.level > 1 && this.placed.length === this.board.stones.length));
      control.eventMode = enabled[i] ? 'static' : 'none';
      control.alpha = enabled[i] ? 1 : 0.5;
    });
    for (const node of this.cells.values()) node.eventMode = this.crossed ? 'none' : 'static';
  }

  private drawBoard() {
    const L = this.layout;
    const g = this.boardArt.clear();
    for (const child of this.clueLayer.removeChildren()) child.destroy();

    const values = counts(this.board, this.placed);
    this.board.clues.forEach((clue, i) => {
      const first = L.cell(clue.cells[0]);
      const last = L.cell(clue.cells[clue.cells.length - 1]);
      const sw = PATCH_COLORS[clue.relation === 'match' ? Math.floor(i / 2) : i];
      const edge = clue === this.missed ? swatch.red.line : sw.line;
      if (clue.relation === 'match') {
        if (!values.has(clue.cells[0])) pips(g, first.x, first.y, clue.target, 17, ink);
      } else {
        const sum = clue.cells.reduce((n, cell) => n + (values.get(cell) ?? 0), 0);
        const missing = clue.cells.some((cell) => !values.has(cell));
        const horizontal = this.board.level === 2;
        const x = horizontal ? first.x - 126 : first.x;
        const y = horizontal ? first.y : first.y - 83;
        g.roundRect(x - 51, y - 23, 102, 46, 20)
          .fill(sw.light)
          .stroke({ color: edge, width: 3 });
        const text = label(
          `${missing ? (sum > 0 ? `${sum}+·` : '·') : sum} ${SIGNS[clue.relation]} ${clue.target}`,
          25,
        );
        text.position.set(x, y);
        this.clueLayer.addChild(text);
      }
      g.roundRect(first.x - 51, first.y - 51, last.x - first.x + 102, last.y - first.y + 102, 15).stroke({
        color: edge,
        width: clue === this.missed ? 6 : 3,
      });
    });
    for (const cell of this.board.cells) {
      const p = L.cell(cell);
      this.cellRing(g, p, swatch.teal.line, 1.5);
    }
    for (const move of this.placed) {
      const stone = this.board.stones.find((stone) => stone.id === move.stone);
      if (!stone) continue;
      const [a, b] = ends(this.board, move).map(L.cell);
      this.stoneArt(g, stone, a, b, DRAWN_CELL, false);
    }

    const placeHint = this.shownHint?.kind === 'place' ? this.shownHint.move : null;
    const candidates = this.board.cells.filter(
      (anchor) =>
        this.selected !== null &&
        fits(this.board, this.placed, {
          stone: this.selected,
          anchor,
          direction: this.direction(this.selected),
        }),
    );
    const selected = this.selected;
    if (selected !== null && candidates.length) {
      const direction = this.direction(selected);
      const highlighted = new Set(
        candidates.flatMap((anchor) => ends(this.board, { stone: selected, anchor, direction })),
      );
      for (const cell of highlighted) this.cellRing(g, L.cell(cell), swatch.blue.line, 5);
      for (const cell of candidates) {
        const p = L.cell(cell);
        anchorMark(g, p.x - 34, p.y - 33, swatch.blue.line);
      }
    }
    if (this.shownHint) {
      const [a, b] = ends(this.board, this.shownHint.move).map(L.cell);
      this.cellRing(g, a, swatch.orange.line, 7);
      this.cellRing(g, b, swatch.orange.line, 7);
      if (placeHint) anchorMark(g, a.x - 34, a.y - 33, swatch.orange.line);
    }
    if (this.missed) {
      for (const cell of this.missed.cells) this.cellRing(g, L.cell(cell), swatch.red.line, 4);
    }
  }

  private cellRing(g: Graphics, p: Point, color: number, width: number) {
    g.roundRect(p.x - 45, p.y - 45, 90, 90, 12).stroke({ color, width });
  }

  private drawTray() {
    for (const stone of this.board.stones) {
      const node = this.tray.get(stone.id);
      if (!node) continue;
      node.visible = !this.placed.some((move) => move.stone === stone.id);
      if (!node.visible) continue;
      const g = node.children[0] as Graphics;
      g.clear()
        .roundRect(-76, -48, 152, 96, 22)
        .fill(cream)
        .stroke({ color: this.selected === stone.id ? swatch.blue.line : swatch.brown.light, width: 4 });
      if (this.shownHint?.kind === 'place' && this.shownHint.move.stone === stone.id) {
        g.roundRect(-78, -49, 156, 98, 24).stroke({ color: swatch.orange.line, width: 6 });
      }
      const d = this.direction(stone.id);
      const offset = [
        { x: -25, y: 0 },
        { x: 0, y: -22 },
        { x: 25, y: 0 },
        { x: 0, y: 22 },
      ][d];
      this.stoneArt(g, stone, offset, { x: -offset.x, y: -offset.y }, 43, true);
    }
  }

  private stoneArt(g: Graphics, stone: Stone, a: Point, b: Point, size: number, mark: boolean) {
    const sw = STONE_COLORS[stone.id];
    const margin = size / 2;
    g.roundRect(
      Math.min(a.x, b.x) - margin,
      Math.min(a.y, b.y) - margin,
      Math.abs(a.x - b.x) + size,
      Math.abs(a.y - b.y) + size,
      12,
    )
      .fill(sw.fill)
      .stroke({ color: sw.line, width: 4 });
    const x = (a.x + b.x) / 2;
    const y = (a.y + b.y) / 2;
    const dx = a.y !== b.y ? margin - 3 : 0;
    const dy = a.x !== b.x ? margin - 3 : 0;
    g.moveTo(x - dx, y - dy)
      .lineTo(x + dx, y + dy)
      .stroke({ color: sw.line, width: 3 });
    pips(g, a.x, a.y, stone.dots[0], size * 0.16);
    pips(g, b.x, b.y, stone.dots[1], size * 0.16);
    if (mark) anchorMark(g, a.x - 14, a.y - 14, sw.line);
  }

  /** Guided first play points at the bot's next move: `autotouch` here only reads the board. */
  showMove(): TouchIntent | null {
    return this.autotouch();
  }

  autotouch(): TouchIntent | null {
    if (this.crossed) return null;
    const hint = hintFor(this.board, this.placed, this.solutions);
    if (!hint) return { tap: { on: this.controls[3] } };
    const { move } = hint;
    if (hint.kind === 'remove') return { tap: { on: this.cells.get(move.anchor)! } };
    if (this.selected !== move.stone) return { tap: { on: this.tray.get(move.stone)! } };
    if (this.direction(move.stone) !== move.direction) return { tap: { on: this.controls[1] } };
    return { tap: { on: this.cells.get(move.anchor)! } };
  }

  destroy() {
    this.root.destroy({ children: true });
  }
}

export const game: GameModule = {
  id: 'domino-pond',
  name: 'Domino Pond',
  titleLine: 'game.domino-pond',
  region: 'puzzle-peaks',
  challenge: 'numbers',
  skills: ['Count dots', 'Add pairs', 'Compare totals'],
  bands: ['prek', 'school', 'grownup'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel,
  music: STYLES.quiet,
  upright: true,
  touchDemo: true,
  coplayHint: 'Take turns reading a patch clue and laying a stone.',
  offScreen: 'Draw two squares on paper, put a few dots in each, and find a domino to match.',
  hubIcon: () => new WigglyIcon(pondIcon()),
  sticker: () => pondIcon(),
  create: (ctx) => new Round(ctx),
};
