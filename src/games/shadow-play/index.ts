import { Container, Graphics, Rectangle, type Text } from 'pixi.js';
import { cream, ink, shadow, swatch, toward, wood } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { LineId } from '../../content/voice-script';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { hinted, missEvery, newTally, tally } from '../../progress/coach';
import { rangeFor } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { distanceAt, markX, shadowLayout, type Box, type RailRow, type ShadowLayout } from './layout';
import {
  GRID_H,
  GRID_W,
  LEVELS,
  MARKS,
  SPOTS,
  accepted,
  boardFor,
  boardKey,
  boardsPerRound,
  countsAsMiss,
  demoBoard,
  describeLevel,
  firstWrong,
  hintFor,
  hintLine,
  missLine,
  nearestMark,
  part,
  partHeight,
  shadowHeight,
  sizeLine,
  slide,
  type Arrangement,
  type Board,
  type Cutout,
  type Mark,
  type Placed,
  type Step,
  type Wrong,
} from './logic';

/** The size, miss and hint ids are computed in `voice.ts`; `voice.test.ts` checks each one the pools produce has a line. */
const line = (id: string) => id as LineId;

/** The board each level showed last, so the next round never repeats it. */
const lastBoard: Record<number, string | undefined> = {};

const SHADE = toward(shadow, 0xffffff, 0.28);
const CLOTH = toward(cream, 0xffffff, 0.5);

/** A cut-out, or a shadow part, standing on (x, baseY) at `u` units a square. */
function drawCutout(g: Graphics, { shape, w, h }: Cutout, x: number, baseY: number, u: number, fill: number) {
  const hw = (w * u) / 2;
  const top = baseY - h * u;
  if (shape === 'block') g.rect(x - hw, top, hw * 2, h * u);
  else if (shape === 'tent') g.poly([x - hw, baseY, x, top, x + hw, baseY]);
  else {
    const pts: number[] = [];
    for (let i = 0; i <= 24; i++) {
      const a = Math.PI - (Math.PI * i) / 24;
      pts.push(x + Math.cos(a) * hw, baseY - Math.sin(a) * h * u);
    }
    g.poly(pts);
  }
  g.fill(fill);
}

/** Dashes along a polyline, so the outline reads by line style and not by colour alone. */
function dashed(g: Graphics, pts: { x: number; y: number }[], on: number, off: number) {
  let left = on;
  let draw = true;
  for (let i = 1; i < pts.length; i++) {
    let a = pts[i - 1];
    const b = pts[i];
    let span = Math.hypot(b.x - a.x, b.y - a.y);
    while (span > 1e-6) {
      const step = Math.min(left, span);
      const t = step / span;
      const p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      if (draw) g.moveTo(a.x, a.y).lineTo(p.x, p.y);
      a = p;
      span -= step;
      left -= step;
      if (left <= 1e-6) {
        draw = !draw;
        left = draw ? on : off;
      }
    }
  }
}

function lamp(g: Graphics, x: number, y: number, s: number, lit: boolean) {
  const glass = lit ? swatch.yellow : swatch.white;
  if (lit) g.circle(x, y - 10 * s, 20 * s).fill({ color: swatch.yellow.light, alpha: 0.8 });
  g.roundRect(x - 8 * s, y, 16 * s, 10 * s, 3 * s).fill(wood.line);
  g.circle(x, y - 10 * s, 11 * s)
    .fill(glass.fill)
    .stroke({ color: glass.line, width: 3 * s });
}

/** The hub icon and sticker: a lamp throwing a tent's shadow on a screen. */
function icon() {
  const g = new Graphics();
  g.roundRect(-54, -50, 108, 100, 20).fill(swatch.lavender.light);
  g.roundRect(8, -40, 40, 72, 6).fill(CLOTH).stroke({ color: wood.line, width: 3 });
  g.poly([12, 28, 28, -30, 44, 28]).fill(SHADE);
  g.poly([-20, 28, -12, 2, -4, 28]).fill(swatch.coral.line);
  g.rect(-13, 28, 2, 10).fill(wood.line);
  g.rect(-50, 36, 100, 6).fill(wood.fill);
  lamp(g, -40, 26, 0.9, true);
  return new Container().addChild(g);
}

function button(root: Container, run: () => void) {
  const node = new Container();
  const panel = new Graphics();
  const text = label('', 32);
  panel.eventMode = text.eventMode = 'none';
  node.addChild(panel, text);
  onTap(node, run);
  root.addChild(node);
  return { node, panel, text };
}

type Button = ReturnType<typeof button>;

function place(node: Container, { x, y, w, h }: Box) {
  node.position.set(x, y);
  node.hitArea = new Rectangle(-w / 2, -h / 2, w, h);
}

class Round implements Game {
  private readonly root = new Container();
  private readonly backdrop = new Graphics();
  private readonly screen = new Graphics();
  private readonly table = new Graphics();
  private readonly rows: Container[];
  private readonly handles: { node: Container; art: Graphics; drag: DragHandle }[];
  private readonly numbers: Text[][];
  private readonly sizes: Text[];
  private readonly helpButton: Button;
  private readonly lightButton: Button;
  private readonly boards: Board[];
  private readonly rejected = new Set<string>();
  private readonly counts = newTally();
  private readonly heard = new Set<string>();
  private at = 0;
  private arr: Arrangement;
  /** The lamp: always lit at level 1; at the dark levels, lit by Light until the next move. */
  private lit: boolean;
  private hint: Step | null = null;
  private hintedAt: string | null = null;
  private wrong: Wrong | null = null;
  /** A handle in the finger: its rail and how far from the lamp it is, so a lit shadow follows the slide. */
  private sliding: { rail: number; distance: number } | null = null;
  private windows = 0;
  private busy = false;
  /** Bumped by every touch, so a hint waiting behind a miss line never speaks over the player. */
  private turn = 0;
  private view: View;
  private layout: ShadowLayout;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.layout = shadowLayout(this.view);
    const { level } = ctx;
    if (ctx.demo) this.boards = [demoBoard(level)];
    else {
      this.boards = [];
      for (let i = 0; i < boardsPerRound(level); i++) {
        const board = boardFor(level, ctx.rng, lastBoard[level]);
        lastBoard[level] = boardKey(board.solution);
        this.boards.push(board);
      }
    }
    this.arr = this.boards[0].start;
    this.lit = level === 1;
    this.backdrop.eventMode = this.screen.eventMode = this.table.eventMode = 'none';
    this.root.addChild(this.backdrop, this.screen, this.table);
    this.rows = [0, 1, 2].map((rail) => {
      const row = new Container();
      onTap(row, (e) => {
        if (this.busy) return;
        const x = this.root.toLocal(e.global).x;
        this.touch(rail);
        this.move(rail, nearestMark(distanceAt(this.layout.rails[rail], x)));
      });
      this.root.addChild(row);
      return row;
    });
    this.numbers = [0, 1, 2].map(() =>
      MARKS.map((mark) => {
        const t = label(String(mark), 22);
        t.eventMode = 'none';
        this.root.addChild(t);
        return t;
      }),
    );
    this.sizes = [0, 1, 2].map(() => {
      const t = label('', 18);
      t.eventMode = 'none';
      this.root.addChild(t);
      return t;
    });
    this.handles = [0, 1, 2].map((rail) => {
      const node = new Container();
      const art = new Graphics();
      art.eventMode = 'none';
      node.addChild(art);
      this.root.addChild(node);
      let downX = 0;
      let spoke = false;
      const drag = draggable(node, ctx.tw, {
        keepGrab: true,
        onPick: () => {
          spoke = this.touch(rail);
          sfx.pop(5);
        },
        onMove: (x) => {
          const r = this.layout.rails[rail];
          const at = Math.min(markX(r, 6), Math.max(markX(r, 2), x));
          node.position.set(at, r.row.y);
          this.sliding = { rail, distance: distanceAt(r, at) };
          if (this.lit && this.ctx.level > 1) this.dark();
          this.drawScreen();
        },
        onDrop: () => {
          const from = this.sliding;
          this.sliding = null;
          if (!drag.tapped && from) this.move(rail, nearestMark(from.distance));
          else {
            // The marks sit closer than the handle is wide, so a still tap on the handle that is nearer another mark
            // moves the cut-out there; a tap on the cut-out where it stands says its size again, free.
            const mark = nearestMark(distanceAt(this.layout.rails[rail], downX));
            if (mark !== this.arr[rail].mark) this.move(rail, mark);
            else {
              if (!spoke) void this.ctx.say(line(sizeLine(this.arr[rail].cutout)));
              this.render();
            }
          }
          return true;
        },
      });
      // Heard before the drag's own listener is asked where the finger went down.
      node.on('pointerdown', (e) => (downX = this.root.toLocal(e.global).x));
      return { node, art, drag };
    });
    this.helpButton = button(this.root, () => this.askForHint());
    this.lightButton = button(this.root, () => this.light());
    this.helpButton.text.text = 'Help';
    this.lightButton.text.text = 'Light';
    this.lightButton.node.visible = level > 1;
    ctx.stage.addChild(this.root);
    this.render();
  }

  private get board() {
    return this.boards[this.at];
  }

  start() {
    void this.ctx.instruct(this.ctx.level === 1 ? 'shadow.start.lit' : 'shadow.start.dark');
  }

  /** The first touch of a rail's cut-out on a board says its size. */
  private touch(rail: number) {
    this.turn++;
    const key = `${this.at}:${rail}`;
    if (this.heard.has(key)) return false;
    this.heard.add(key);
    void this.ctx.say(line(sizeLine(this.arr[rail].cutout)));
    return true;
  }

  /** A move puts the lamp out again at the dark levels, and clears the hint and the last explanation. */
  private dark() {
    this.lit = this.ctx.level === 1;
    this.hint = null;
    this.wrong = null;
  }

  /** Sliding is always free; nothing is refused. At level 1 the board finishes by itself when the shadow fills the outline. */
  private move(rail: number, mark: Mark) {
    if (this.busy) return;
    const changed = this.arr[rail].mark !== mark;
    this.arr = slide(this.arr, rail, mark);
    if (changed) {
      this.dark();
      sfx.marimba(MARKS.indexOf(mark) * 2);
    }
    this.render();
    if (this.ctx.level === 1 && accepted(this.board, this.arr)) void this.win();
  }

  private key() {
    return `${this.at}:${this.arr.map((p) => p.mark).join(',')}`;
  }

  /** Shows the next hint, counting it once until the arrangement changes. Null when every cut-out is in place. */
  private showHint(): Step | null {
    this.hint = hintFor(this.board, this.arr);
    if (!this.hint) return null;
    if (this.hintedAt !== this.key()) {
      hinted(this.counts);
      this.hintedAt = this.key();
    }
    this.render();
    return this.hint;
  }

  /** The Help button, and the pause sheet's "show a hint". */
  askForHint() {
    if (this.busy) return;
    this.turn++;
    this.wrong = null;
    const hint = this.showHint();
    if (hint) void this.ctx.say(line(hintLine(this.board, hint)));
    else {
      this.render();
      void this.ctx.say('shadow.hint.done');
    }
  }

  /** Light checks a worked answer: the real shadow shows over the outline, and a wrong one names its first rail. */
  private light() {
    if (this.busy || this.ctx.level === 1) return;
    this.turn++;
    this.lit = true;
    if (accepted(this.board, this.arr)) {
      void this.win();
      return;
    }
    const wrong = firstWrong(this.board, this.arr);
    if (!wrong) return;
    // One miss per distinct wrong arrangement; the same one lit again replays the explanation, free.
    const first = countsAsMiss(this.rejected, this.at, this.arr);
    const due = first && missEvery(this.counts);
    if (first) sfx.boing();
    this.wrong = wrong;
    this.hint = null;
    this.render();
    const turn = this.turn;
    void this.ctx.say(line(missLine(wrong))).then(() => {
      if (!due || !this.ctx.alive || turn !== this.turn) return;
      const hint = this.showHint();
      if (hint) void this.ctx.say(line(hintLine(this.board, hint)));
    });
  }

  /** The shadow fills the outline: the lamp glows and the skyline's windows light one part at a time. */
  private async win() {
    const { ctx } = this;
    this.busy = true;
    this.lit = true;
    this.hint = null;
    this.wrong = null;
    this.render();
    for (let rail = 0; rail < 3; rail++) {
      await ctx.tw.wait(0.3);
      if (!ctx.alive) return;
      this.windows = rail + 1;
      sfx.bell(4 + rail * 2);
      this.drawScreen();
    }
    await ctx.tw.wait(0.5);
    if (!ctx.alive) return;
    if (this.at < this.boards.length - 1) {
      this.at++;
      this.arr = this.board.start;
      this.windows = 0;
      this.hintedAt = null;
      this.lit = ctx.level === 1;
      this.busy = false;
      this.render();
      void ctx.say('shadow.next');
      return;
    }
    await ctx.say('shadow.done');
    if (ctx.alive) ctx.finish(tally(this.counts));
  }

  /** What stands on each rail right now, a handle in the finger at its true distance. */
  private standing(): Placed[] {
    return this.arr.map((p, rail) =>
      this.sliding?.rail === rail ? { ...p, mark: this.sliding.distance } : p,
    );
  }

  private drawScreen() {
    const g = this.screen.clear();
    const { screen, sq } = this.layout;
    const x0 = screen.x - screen.w / 2;
    const y0 = screen.y + screen.h / 2;
    const px = (x: number) => x0 + x * sq;
    const py = (h: number) => y0 - h * sq;
    g.roundRect(x0 - 8, py(GRID_H) - 8, screen.w + 16, screen.h + 16, 10)
      .fill(CLOTH)
      .stroke({ color: wood.line, width: 4 });
    if (this.hint) {
      const want = part(this.board.solution[this.hint.rail]);
      g.rect(px(SPOTS[this.hint.rail] - want.w / 2), py(want.h), want.w * sq, want.h * sq).fill({
        color: swatch.yellow.fill,
        alpha: 0.45,
      });
    }
    const now = this.standing();
    if (this.lit)
      now.forEach((p, rail) => {
        const { shape, w, h } = part(p);
        drawCutout(g, { shape, w, h }, px(SPOTS[rail]), y0, sq, SHADE);
      });
    for (let i = 0; i <= GRID_W; i++)
      g.moveTo(px(i), py(0))
        .lineTo(px(i), py(GRID_H))
        .stroke({
          color: this.lit ? swatch.white.line : ink,
          width: i % 6 ? 1 : 2.5,
          alpha: i % 6 ? 0.28 : 0.55,
        });
    for (let i = 0; i <= GRID_H; i++)
      g.moveTo(px(0), py(i))
        .lineTo(px(GRID_W), py(i))
        .stroke({
          color: this.lit ? swatch.white.line : ink,
          width: i % 6 ? 1 : 2.5,
          alpha: i % 6 ? 0.28 : 0.55,
        });
    for (const spot of SPOTS)
      g.poly([px(spot) - 7, y0 + 12, px(spot), y0 + 2, px(spot) + 7, y0 + 12]).fill(wood.line);

    const want = (x: number) => shadowHeight(this.board.solution, x);
    if (this.lit && this.wrong) {
      const got = (x: number) => Math.max(...now.map((p, rail) => partHeight(p, rail, x)));
      // Shadow outside the outline: upright strokes. Outline left uncovered: level strokes. Hatching as well as colour.
      // A stroke with no new path would redraw the last shape, so each group strokes only what it added.
      let strokes = 0;
      for (let x = 0.25; x < GRID_W; x += 0.5)
        if (got(x) > want(x) + 1e-6) {
          g.moveTo(px(x), py(want(x))).lineTo(px(x), py(got(x)));
          strokes++;
        }
      if (strokes) g.stroke({ color: swatch.orange.fill, width: 3 });
      strokes = 0;
      for (let h = 0.25; h < GRID_H; h += 0.5) {
        let from: number | null = null;
        for (let i = 0; i <= GRID_W * 8; i++) {
          const x = i / 8;
          const open = i < GRID_W * 8 && got(x) < h && h < want(x);
          if (open && from === null) from = x;
          if (!open && from !== null) {
            g.moveTo(px(from), py(h)).lineTo(px(x), py(h));
            strokes++;
            from = null;
          }
        }
      }
      if (strokes) g.stroke({ color: swatch.blue.line, width: 3 });
    }
    const pts = [{ x: px(0), y: py(0) }];
    for (let i = 0; i <= GRID_W * 32; i++)
      pts.push({ x: px(i / 32), y: py(want(Math.min(GRID_W - 1e-9, i / 32))) });
    pts.push({ x: px(GRID_W), y: py(0) });
    // A pale edge under the dark dashes keeps the outline readable over cloth and shadow alike.
    dashed(g, pts, 12, 8);
    g.stroke({ color: CLOTH, width: 8, cap: 'round' });
    dashed(g, pts, 12, 8);
    g.stroke({ color: ink, width: 4, cap: 'round' });
    for (let rail = 0; rail < this.windows; rail++) {
      const { h } = part(this.board.solution[rail]);
      const s = Math.max(0.3, Math.min(0.8, h * 0.14)) * sq;
      g.rect(px(SPOTS[rail]) - s / 2, py(h * 0.4) - s / 2, s, s).fill(swatch.yellow.fill);
    }
  }

  /** Where a rail's table line and mark numbers sit under its handle. */
  private railLine(r: RailRow) {
    return this.layout.upright
      ? { y: r.row.y + 16, numbers: r.row.y + 35 }
      : { y: r.row.y + 34, numbers: r.row.y + 58 };
  }

  private render() {
    this.layout = shadowLayout(this.view);
    const { layout } = this;
    this.backdrop.clear().rect(0, 0, this.view.w, this.view.h).fill(swatch.lavender.light);
    this.drawScreen();
    const g = this.table.clear();
    const u = layout.upright ? 22 : 18;
    layout.rails.forEach((r, rail) => {
      const { row, chip } = r;
      const pointed = this.hint?.rail === rail;
      const broken = this.wrong?.rail === rail;
      const color = broken ? swatch.coral : pointed ? swatch.yellow : swatch.white;
      g.roundRect(row.x - row.w / 2 + 2, row.y - row.h / 2 + 2, row.w - 4, row.h - 4, 18)
        .fill(broken || pointed ? color.light : swatch.white.fill)
        .stroke({ color: color.line, width: broken || pointed ? 5 : 3 });
      const at = this.railLine(r);
      g.moveTo(r.lampX, at.y).lineTo(r.screenX, at.y).stroke({ color: wood.line, width: 5, cap: 'round' });
      g.roundRect(r.screenX - 4, at.y - 50, 8, 56, 3).fill(swatch.lavender.line);
      lamp(g, r.lampX, at.y - 12, 0.8, this.lit);
      MARKS.forEach((mark, i) => {
        const x = markX(r, mark);
        const target = pointed && this.hint?.mark === mark;
        g.circle(x, at.y, target ? 12 : 7)
          .fill(target ? swatch.yellow.fill : wood.fill)
          .stroke({ color: wood.line, width: 3 });
        this.numbers[rail][i].position.set(x, at.numbers);
      });
      const { cutout } = this.arr[rail];
      g.roundRect(chip.x - chip.w / 2, chip.y - chip.h / 2, chip.w, chip.h, 12).fill(swatch.peach.light);
      drawCutout(g, cutout, chip.x, chip.y + 6, 13, swatch.coral.line);
      this.sizes[rail].text = `${cutout.w} × ${cutout.h}`;
      this.sizes[rail].position.set(chip.x, chip.y + chip.h / 2 - 12);

      const handle = this.handles[rail];
      place(this.rows[rail], row);
      handle.node.hitArea = new Rectangle(-r.handle.w / 2, -r.handle.h / 2, r.handle.w, r.handle.h);
      handle.drag.enabled = !this.busy;
      if (!handle.drag.dragging) {
        handle.node.position.set(markX(r, this.arr[rail].mark), row.y);
        handle.drag.home.x = handle.node.x;
        handle.drag.home.y = row.y;
      }
      const base = at.y - row.y;
      const a = handle.art.clear();
      a.rect(-2, base - 6, 4, 6).fill(wood.line);
      drawCutout(a, cutout, 0, base - 6, u, swatch.coral.line);
      // Its squares, so the size reads off the cut-out as well as the chip.
      for (let i = 1; i < cutout.w; i++)
        a.moveTo((i - cutout.w / 2) * u, base - 6).lineTo((i - cutout.w / 2) * u, base - 6 - cutout.h * u);
      for (let i = 1; i < cutout.h; i++)
        a.moveTo((-cutout.w / 2) * u, base - 6 - i * u).lineTo((cutout.w / 2) * u, base - 6 - i * u);
      if (cutout.w + cutout.h > 2) a.stroke({ color: swatch.coral.light, width: 2 });
    });
    for (const [control, at, main] of [
      [this.helpButton, layout.help, false],
      [this.lightButton, layout.light, true],
    ] as const) {
      place(control.node, at);
      const color = main ? swatch.yellow : swatch.white;
      control.panel
        .clear()
        .roundRect(-at.w / 2 + 4, -at.h / 2 + 4, at.w - 8, at.h - 8, 22)
        .fill(main ? color.light : color.fill)
        .stroke({ color: color.line, width: main ? 5 : 3 });
      control.node.alpha = this.busy ? 0.55 : 1;
    }
  }

  update() {}

  resize(view: View) {
    this.view = view;
    this.render();
  }

  autotouch(): TouchIntent | null {
    if (this.busy || this.handles.some((h) => h.drag.dragging)) return null;
    const next = hintFor(this.board, this.arr);
    if (!next) return this.ctx.level > 1 ? { tap: { on: this.lightButton.node } } : null;
    const r = this.layout.rails[next.rail];
    return {
      drag: { on: this.handles[next.rail].node },
      to: { on: this.rows[next.rail], x: markX(r, next.mark) - r.row.x },
      lift: 0,
    };
  }

  destroy() {
    for (const { drag } of this.handles) drag.destroy();
    this.root.destroy({ children: true });
  }
}

export const game: GameModule = {
  id: 'shadow-play',
  name: 'Shadow Play',
  titleLine: 'game.shadow-play',
  region: 'tinker-lab',
  challenge: 'space',
  skills: [
    'how a point of light scales a shadow with distance',
    'reading a joined outline back into its parts',
  ],
  bands: ['grownup'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel,
  music: STYLES.quiet,
  hubIcon: () => new WigglyIcon(icon()),
  sticker: icon,
  upright: true,
  touchDemo: true,
  coplayHint:
    'One person reads the outline’s sizes aloud from the grid and the other sets the rails. Swap after a round.',
  offScreen:
    'Hold a paper shape between a torch and a wall. Find where its shadow is twice as tall, then measure how far the shape is from the torch and from the wall.',
  create: (ctx) => new Round(ctx),
};
