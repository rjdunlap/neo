import { Container, Graphics, Rectangle, type Text } from 'pixi.js';
import { cream, ink, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { LineId } from '../../content/voice-script';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { hinted, missEvery, newTally, tally } from '../../progress/coach';
import { rangeFor } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { WigglyIcon, tile } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { drawSketch } from './art';
import { KeyPanel, type KeyTarget } from './key-panel';
import { layout, sketchCells, type Box, type Layout } from './layout';
import {
  LEVELS,
  LOOKS,
  Misses,
  NAMES,
  PARTS,
  VALUES,
  describeLevel,
  done,
  fault,
  faultLine,
  faultWorking,
  fullWrong,
  give,
  hint,
  hintWorking,
  isQ,
  lift,
  makeBoard,
  newPage,
  pageKey,
  planFor,
  stamp,
  type Board,
  type Hint,
  type Page,
} from './logic';

const line = (id: string) => id as LineId;
const nameLine = (n: number) => line(`key.name.${NAMES[n].toLowerCase()}`);

type Tab = 'sketches' | 'key';
/** `stamping`: the warden is stamping three; `reveal`: the last stamping colours the page in. */
type Phase = 'play' | 'stamping' | 'reveal' | 'done';

/** Seconds between the warden's stamps, and between sketches colouring in at the end. */
const STAMP_PACE = 0.32;

const NOTE_START = 'Choose a sketch, then follow the key from question 1 to a name.';

/** A box drawn as a button: a rounded card with a wood edge. */
function card(g: Graphics, b: Box, fill: number, edge: number = wood.line, width = 4) {
  g.roundRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, 20)
    .fill(fill)
    .stroke({ width, color: edge });
}

/** The warden's stamp: a red ring with a tick, a little tilted. */
function stampMark(g: Graphics, x: number, y: number, r: number) {
  g.circle(x, y, r).stroke({ width: Math.max(2, r * 0.16), color: swatch.red.line, alpha: 0.9 });
  g.moveTo(x - r * 0.45, y + r * 0.02)
    .lineTo(x - r * 0.1, y + r * 0.38)
    .lineTo(x + r * 0.5, y - r * 0.38)
    .stroke({ width: Math.max(2, r * 0.2), color: swatch.red.line, cap: 'round', join: 'round', alpha: 0.9 });
}

function arrow(g: Graphics, b: Box, dir: 1 | -1) {
  card(g, b, swatch.yellow.light, wood.line);
  const s = b.w * 0.22;
  g.poly([b.x + dir * s, b.y, b.x - dir * s * 0.7, b.y - s, b.x - dir * s * 0.7, b.y + s]).fill(wood.line);
}

class KeyItOut implements Game {
  readonly level: number;
  readonly board: Board;
  page: Page;
  chosen = 0;
  tab: Tab = 'sketches';
  phase: Phase = 'play';
  finished = false;
  /** The questions followed from the one first tapped, and the branch ends taken on the way. */
  trail: number[] = [];
  taken = new Set<string>();
  /** The hint showing, and the page it was given on; asking again on the same page is free. */
  hintNow: (Hint & { at: string }) | null = null;
  /** The question a fault lit. */
  faultQ: number | null = null;
  /** Sketches coloured in by the end. */
  private coloured = new Set<number>();
  private readonly score = newTally();
  private readonly counted = new Misses();
  private gen = 0;
  private L: Layout;
  private clock = 0;
  private noteText = NOTE_START;
  private readonly backdrop: Backdrop;
  private readonly chrome = new Graphics();
  private readonly glow = new Graphics();
  private readonly big = new Graphics();
  private readonly stripTexts = new Container();
  readonly prev = new Container();
  readonly next = new Container();
  readonly plate = new Container();
  readonly sketchesTab = new Container();
  readonly keyTab = new Container();
  readonly help = new Container();
  private readonly note: Text = label('', 26);
  /** The Sketches page: one tap target per sketch. */
  readonly cells: Container[] = [];
  private readonly cellArt = new Graphics();
  private readonly cellTexts = new Container();
  readonly key: KeyPanel;

  constructor(private readonly ctx: GameContext) {
    this.level = planFor(ctx.level).level;
    this.board = makeBoard(this.level, ctx.rng);
    this.page = newPage(this.board);
    this.backdrop = new Backdrop(
      {
        sky: [0xcfe6f7, 0xf6ecd6],
        hills: [0xb6d8e6, 0x9cc9d9, 0xcfe3c0],
        horizon: 0.24,
        clouds: 2,
        sun: false,
        seed: 211,
      },
      ctx.view,
    );
    this.L = layout(ctx.view);
    for (const g of [this.chrome, this.glow, this.big, this.cellArt]) g.eventMode = 'none';
    this.stripTexts.eventMode = this.cellTexts.eventMode = 'none';
    this.note.eventMode = 'none';
    this.note.style.wordWrap = true;
    this.note.style.fontWeight = '500';
    this.key = new KeyPanel(this.board, ctx, (t) => this.tapKey(t));
    onTap(this.prev, () => this.step(-1));
    onTap(this.next, () => this.step(1));
    onTap(this.plate, () => this.liftChosen());
    onTap(this.sketchesTab, () => this.open('sketches'));
    onTap(this.keyTab, () => this.open('key'));
    onTap(this.help, () => this.askForHint());
    this.board.sketches.forEach((_, i) => {
      const c = new Container();
      onTap(c, () => this.choose(i, true));
      this.cells.push(c);
    });
    ctx.stage.addChild(
      this.backdrop,
      this.chrome,
      this.big,
      this.stripTexts,
      this.note,
      ...this.cells,
      this.cellArt,
      this.cellTexts,
      this.key,
      this.glow,
      this.prev,
      this.next,
      this.plate,
      this.sketchesTab,
      this.keyTab,
      this.help,
    );
    this.resize(ctx.view);
  }

  /** What a scripted play reads. */
  get state() {
    return {
      level: this.level,
      chosen: this.chosen,
      tab: this.tab,
      phase: this.phase,
      names: this.page.names.slice(),
      stamped: this.page.stamped.slice(),
      answer: this.board.sketches.map((s) => s.name),
      misses: this.score.misses,
      hints: this.score.hints,
      hint: this.hintNow ? { sketch: this.hintNow.sketch, name: this.hintNow.name } : null,
      fault: this.faultQ,
      note: this.noteText,
      finished: this.finished,
    };
  }

  start() {
    void this.ctx.instruct(line('key.start'));
  }

  destroy() {
    this.finished = true;
    this.gen++;
  }

  // ---- choosing and reading ----

  private choose(i: number, fromPage = false) {
    if (this.phase !== 'play') return;
    sfx.tick();
    if (this.chosen !== i) {
      this.chosen = i;
      this.trail = [];
      this.taken.clear();
    }
    // Upright, choosing a sketch on its page opens the key for it; its strip stays in view.
    if (fromPage && this.L.upright) this.tab = 'key';
    this.draw();
  }

  private step(d: 1 | -1) {
    const n = this.board.sketches.length;
    this.choose((this.chosen + d + n) % n);
  }

  private open(tab: Tab) {
    if (this.tab === tab) return;
    sfx.tick();
    this.tab = tab;
    this.draw();
  }

  private tapKey(t: KeyTarget) {
    if (this.phase !== 'play') return;
    const q = this.board.key[t.q];
    if (t.end === 'question') {
      sfx.pop(5);
      this.trail = [t.q];
      this.taken.clear();
      void this.ctx.say(line(`key.q.${PARTS[q.part]}.${VALUES[PARTS[q.part]][q.value]}`));
      this.draw();
      return;
    }
    const b = q[t.end];
    if (isQ(b)) {
      // Following a branch lights the question it leads to, and checks nothing.
      sfx.pop(7);
      if (this.trail.at(-1) !== t.q) this.trail = [t.q];
      this.trail.push(b.q);
      this.taken.add(`${t.q}${t.end}`);
      const next = this.board.key[b.q];
      this.key.reveal(b.q);
      void this.ctx.say(line(`key.q.${PARTS[next.part]}.${VALUES[PARTS[next.part]][next.value]}`));
      this.draw();
      return;
    }
    this.taken.add(`${t.q}${t.end}`);
    this.giveName(b.name);
  }

  // ---- naming ----

  /** Give `name` to the chosen sketch. */
  giveName(name: number) {
    if (this.phase !== 'play') return;
    const on = this.page.names.indexOf(name);
    if (this.page.stamped[this.chosen] || (on >= 0 && this.page.stamped[on])) {
      sfx.tick();
      void this.ctx.say(
        line(this.page.stamped[this.chosen] ? 'key.locked' : `key.name.${NAMES[name].toLowerCase()}`),
      );
      return;
    }
    const next = give(this.page, this.chosen, name);
    if (!next) {
      void this.ctx.say(nameLine(name));
      return;
    }
    sfx.pluck(4, 0.3);
    this.settle(next);
    void this.ctx.say(nameLine(name));
  }

  private liftChosen() {
    if (this.phase !== 'play') return;
    const next = lift(this.page, this.chosen);
    if (!next) return void sfx.tick();
    sfx.whoosh();
    this.page = next;
    this.faultQ = null;
    this.draw();
  }

  /** A naming happened: stamp three if three are right, or judge a full page. */
  private settle(next: Page) {
    const s = stamp(this.board, next);
    this.page = next;
    this.faultQ = null;
    this.draw();
    if (s.stamped.length) return void this.stampThree(s.page, s.stamped);
    if (fullWrong(this.page)) this.wrongPage();
  }

  private async stampThree(after: Page, which: number[]) {
    const g = ++this.gen;
    this.phase = 'stamping';
    this.hintNow = null;
    await this.ctx.tw.wait(0.35);
    for (const [k, i] of which.entries()) {
      if (g !== this.gen) return;
      this.page = { names: this.page.names, stamped: this.page.stamped.map((x, j) => x || j === i) };
      sfx.bell(3 + k * 2, 0.32);
      this.draw();
      await this.ctx.tw.wait(STAMP_PACE);
    }
    if (g !== this.gen) return;
    this.page = after;
    this.noteText = `Stamped: sketches ${which
      .map((i) => i + 1)
      .join(', ')
      .replace(/, (\d+)$/, ' and $1')}.`;
    if (done(this.page)) return void this.end(g);
    this.phase = 'play';
    // Choose the next sketch still to name.
    const open = this.page.stamped.findIndex((x, i) => !x && this.page.names[i] === null);
    if (this.page.stamped[this.chosen]) this.chosen = open >= 0 ? open : this.page.stamped.indexOf(false);
    this.trail = [];
    this.taken.clear();
    this.draw();
    void this.ctx.say(line('key.stamped'));
  }

  /** A full page that does not hold: a boing and what on the page rules a name out. One miss per distinct page. */
  private wrongPage() {
    const f = fault(this.board, this.page)!;
    const due = this.counted.count(this.page) && missEvery(this.score);
    sfx.boing();
    this.chosen = f.sketch;
    this.faultQ = f.q;
    this.trail = [];
    this.taken.clear();
    this.hintNow = null;
    if (this.L.upright) this.tab = 'key';
    this.key.reveal(f.q);
    this.noteText = faultWorking(f);
    this.draw();
    const g = this.gen;
    void this.ctx.say(line(faultLine(f))).then(() => {
      // The second counted miss of the round brings one assisted hint.
      if (due && g === this.gen && this.phase === 'play') this.showHint();
    });
  }

  // ---- hints ----

  readonly hintLabel = 'Help';

  /** Walk the chain to the first sketch without its right name, and show the working. New hints count once. */
  private showHint() {
    const at = pageKey(this.page);
    if (this.hintNow?.at !== at) {
      const h = hint(this.board, this.page);
      if (!h) return;
      hinted(this.score);
      this.hintNow = { ...h, at };
    }
    const h = this.hintNow;
    this.chosen = h.sketch;
    this.faultQ = null;
    this.trail = [];
    this.taken.clear();
    if (this.L.upright) this.tab = 'key';
    this.key.reveal(this.key.endOf(h.name).q);
    this.noteText = hintWorking(this.board, h);
    this.draw();
    void this.ctx.say(line(`key.hint.${h.kind}`));
  }

  /** The Help button, and the pause sheet's "show a hint". */
  askForHint() {
    if (this.finished || this.phase !== 'play') return;
    sfx.tick();
    this.showHint();
  }

  // ---- the end ----

  private async end(g: number) {
    this.phase = 'reveal';
    this.hintNow = null;
    this.faultQ = null;
    this.trail = [];
    this.taken.clear();
    if (this.L.upright) this.tab = 'sketches';
    this.noteText = 'Every sketch has its name.';
    this.draw();
    for (let i = 0; i < this.board.sketches.length; i++) {
      await this.ctx.tw.wait(STAMP_PACE * 0.8);
      if (g !== this.gen) return;
      this.coloured.add(i);
      sfx.bell(1 + (i % 5), 0.22);
      this.draw();
    }
    this.phase = 'done';
    this.finished = true;
    this.ctx.pet.cheer();
    sfx.tada();
    await this.ctx.say(line('key.done'));
    if (g !== this.gen) return;
    await this.ctx.tw.wait(0.4);
    if (g !== this.gen) return;
    this.ctx.finish(tally(this.score));
  }

  // ---- drawing ----

  private plateWords(i: number) {
    const n = this.page.names[i];
    return n === null ? '?' : NAMES[n];
  }

  private draw() {
    const L = this.L;
    const showSketches = !L.upright || this.tab === 'sketches';
    const showKey = !L.upright || this.tab === 'key';
    const c = this.chrome.clear();
    for (const t of this.stripTexts.removeChildren()) t.destroy();
    for (const t of this.cellTexts.removeChildren()) t.destroy();
    const text = (
      into: Container,
      s: string,
      size: number,
      x: number,
      y: number,
      color = ink,
      maxW = Infinity,
    ) => {
      const t = label(s, size, color);
      if (t.width > maxW) t.scale.set(maxW / t.width);
      t.position.set(x, y);
      into.addChild(t);
      return t;
    };

    // The strip: the chosen sketch drawn large, its number over its name plate, and the arrows.
    const s = L.strip;
    c.roundRect(s.x - s.w / 2, s.y - s.h / 2, s.w, s.h, 26)
      .fill({ color: cream, alpha: 0.96 })
      .stroke({ width: 4, color: wood.fill });
    const chosen = this.board.sketches[this.chosen];
    const stamped = this.page.stamped[this.chosen];
    this.big.clear();
    drawSketch(
      this.big,
      chosen.look,
      chosen.hidden,
      chosen.name,
      L.sketchAt.x,
      L.sketchAt.y,
      L.sketchAt.k,
      this.coloured.has(this.chosen),
    );
    arrow(c, L.prev, -1);
    arrow(c, L.next, 1);
    const p = L.plate;
    text(this.stripTexts, `Sketch ${this.chosen + 1}`, 30, p.x, 78);
    card(
      c,
      p,
      stamped ? 0xe6e2da : 0xffffff,
      this.hintNow?.sketch === this.chosen ? swatch.yellow.line : wood.line,
      4,
    );
    text(
      this.stripTexts,
      this.plateWords(this.chosen),
      30,
      p.x,
      p.y,
      this.page.names[this.chosen] === null ? 0x9c98a6 : ink,
      p.w - 20,
    );
    if (stamped) stampMark(c, p.x + p.w / 2 - 6, p.y - p.h / 2 + 4, 24);

    // The tabs and Help.
    const tabs = L.tabs;
    if (tabs.sketches) {
      card(
        c,
        tabs.sketches,
        this.tab === 'sketches' ? swatch.teal.light : 0xffffff,
        wood.line,
        this.tab === 'sketches' ? 6 : 3,
      );
      text(this.stripTexts, 'Sketches', 32, tabs.sketches.x, tabs.sketches.y);
    }
    card(
      c,
      tabs.key,
      showKey && L.upright ? swatch.teal.light : 0xffffff,
      wood.line,
      showKey && L.upright ? 6 : 3,
    );
    text(this.stripTexts, 'Key', 32, tabs.key.x, tabs.key.y);
    card(c, tabs.help, swatch.yellow.fill, wood.line, 4);
    text(this.stripTexts, 'Help', 32, tabs.help.x, tabs.help.y);

    // The warden's note.
    const nb = L.note;
    c.roundRect(nb.x - nb.w / 2, nb.y - nb.h / 2, nb.w, nb.h, 18)
      .fill({ color: 0xfffbea, alpha: 0.96 })
      .stroke({ width: 3, color: wood.light });
    this.note.text = this.noteText;
    this.note.style.wordWrapWidth = nb.w - 36;
    this.note.scale.set(1);
    if (this.note.height > nb.h - 16) this.note.scale.set((nb.h - 16) / this.note.height);
    this.note.position.set(nb.x, nb.y);

    // The Sketches page.
    const cells = sketchCells(L, this.board.sketches.length);
    this.cellArt.clear();
    this.cellArt.visible = this.cellTexts.visible = showSketches;
    if (showSketches) {
      const pb = L.sketches;
      this.cellArt
        .roundRect(pb.x - pb.w / 2, pb.y - pb.h / 2, pb.w, pb.h, 22)
        .fill({ color: cream, alpha: 0.9 });
    }
    cells.forEach((b, i) => {
      const cell = this.cells[i];
      cell.visible = showSketches;
      cell.hitArea = new Rectangle(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h);
      if (!showSketches) return;
      const sk = this.board.sketches[i];
      const isChosen = i === this.chosen;
      card(
        this.cellArt,
        b,
        this.page.stamped[i] ? 0xf2efe8 : 0xffffff,
        isChosen ? swatch.teal.line : wood.light,
        isChosen ? 6 : 3,
      );
      // A wide cell has the drawing on the left and the number over the plate on the right; a narrow one has them below.
      const wide = b.w > b.h * 1.6;
      const k = wide
        ? Math.min((b.h - 14) / 200, (b.w * 0.5) / 260)
        : Math.min((b.h * 0.62) / 200, (b.w - 16) / 260);
      const ax = wide ? b.x - b.w / 2 + 10 + 120 * k : b.x - 10 * k;
      const ay = wide ? b.y : b.y - b.h / 2 + 8 + 110 * k;
      drawSketch(this.cellArt, sk.look, sk.hidden, sk.name, ax, ay, k, this.coloured.has(i));
      const words = this.page.names[i] === null ? 0x9c98a6 : ink;
      if (wide) {
        const tx = (ax + 140 * k + b.x + b.w / 2) / 2;
        const tw = b.x + b.w / 2 - (ax + 140 * k) - 8;
        text(this.cellTexts, String(i + 1), 26, tx, b.y - b.h * 0.22, 0x6b6b78);
        text(this.cellTexts, this.plateWords(i), 26, tx, b.y + b.h * 0.14, words, tw);
      } else {
        text(this.cellTexts, String(i + 1), 24, b.x - b.w / 2 + 20, b.y - b.h / 2 + 22, 0x6b6b78);
        text(this.cellTexts, this.plateWords(i), 28, b.x, b.y + b.h / 2 - 24, words, b.w - 16);
      }
      if (this.page.stamped[i]) stampMark(this.cellArt, b.x + b.w / 2 - 24, b.y - b.h / 2 + 24, 17);
    });

    // The Key page.
    this.key.visible = showKey;
    if (showKey) {
      const h = this.hintNow;
      this.key.draw(this.page, this.page.names[this.chosen], {
        trail: this.trail,
        taken: this.taken,
        hint: new Set(h ? h.path : []),
        hintName: h?.name ?? null,
        fault: this.faultQ,
      });
    }
  }

  resize(view: View) {
    this.L = layout(view);
    const L = this.L;
    this.backdrop.resize(view);
    const hit = (node: Container, b: Box) =>
      (node.hitArea = new Rectangle(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h));
    hit(this.prev, L.prev);
    hit(this.next, L.next);
    hit(this.plate, L.plate);
    hit(this.keyTab, L.tabs.key);
    hit(this.help, L.tabs.help);
    this.sketchesTab.visible = !!L.tabs.sketches;
    if (L.tabs.sketches) hit(this.sketchesTab, L.tabs.sketches);
    this.key.place(L);
    this.draw();
  }

  update(dt: number) {
    this.clock += dt;
    this.glow.clear();
    const h = this.hintNow;
    if (!h || this.phase !== 'play') return;
    // The hinted sketch's plate breathes.
    if (this.chosen === h.sketch) {
      const p = this.L.plate;
      const t = 6 + 4 * Math.sin(this.clock * 5);
      this.glow
        .roundRect(p.x - p.w / 2 - t, p.y - p.h / 2 - t, p.w + 2 * t, p.h + 2 * t, 24)
        .stroke({ width: 6, color: swatch.yellow.fill });
    }
  }

  /** Where a scripted play or the ghost finger taps for a key target, after sliding it into view: in the panel's coordinates. */
  keySpot(t: KeyTarget) {
    this.key.reveal(t.q);
    const b = this.key.boxOf(t);
    return { x: b.x, y: b.y };
  }

  /** The key target that gives `name`. */
  nameEnd(name: number): KeyTarget {
    return this.key.endOf(name);
  }

  autotouch(): TouchIntent | null {
    if (this.finished || this.phase !== 'play') return null;
    const h = hint(this.board, this.page);
    if (!h) return null;
    if (this.chosen !== h.sketch) {
      if (this.L.upright && this.tab !== 'sketches')
        return { tap: { on: this.sketchesTab, ...centre(this.L.tabs.sketches!) } };
      return {
        tap: {
          on: this.cells[h.sketch],
          ...centre(sketchCells(this.L, this.board.sketches.length)[h.sketch]),
        },
      };
    }
    if (this.L.upright && this.tab !== 'key') return { tap: { on: this.keyTab, ...centre(this.L.tabs.key) } };
    const spot = this.keySpot(this.nameEnd(h.name));
    return { tap: { on: this.key, ...spot } };
  }
}

const centre = (b: Box) => ({ x: b.x, y: b.y });

/** The hub icon: an open guide with a branching line ending at a small creature. */
function icon(): Container {
  const c = new Container();
  const g = new Graphics();
  g.roundRect(-92, -190, 88, 120, 10).fill(cream).stroke({ width: 5, color: wood.line });
  g.roundRect(4, -190, 88, 120, 10).fill(cream).stroke({ width: 5, color: wood.line });
  g.moveTo(-70, -170).lineTo(-48, -150).lineTo(-70, -130).stroke({ width: 5, color: ink, cap: 'round' });
  g.moveTo(-48, -150).lineTo(-20, -150).stroke({ width: 5, color: ink, cap: 'round' });
  g.circle(-70, -170, 6).fill(swatch.teal.fill);
  g.circle(-70, -130, 6).fill(swatch.teal.fill);
  drawSketch(g, LOOKS[1 * 27 + 1 * 9 + 0 * 3 + 0], [], 0, 48, -130, 0.3, true);
  c.addChild(g);
  return c;
}

function sticker(seed: number): Container {
  const c = new Container();
  c.addChild(tile(260, 260, 'white'));
  const g = new Graphics();
  const look = LOOKS[(seed * 7 + 13) % 81];
  drawSketch(g, look, [], seed % NAMES.length, -8, 0, 0.85, true);
  stampMark(g, 82, -82, 30);
  c.addChild(g);
  return c;
}

export const game: GameModule = {
  id: 'key-it-out',
  name: 'Key It Out',
  titleLine: 'game.key-it-out',
  region: 'story-grove',
  challenge: 'logic',
  skills: ['following a key', 'reading a reference page', 'ruling things out'],
  bands: ['grownup'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel,
  music: STYLES.quiet,
  coplayHint:
    'One of you describes the chosen sketch aloud; the other reads the key and asks its questions. Swap after a stamping.',
  offScreen:
    'Write a yes-or-no key for five spoons, buttons or leaves, hand it to someone with one of the five, and see whether your questions bring them to it.',
  hubIcon: () => new WigglyIcon(icon()),
  sticker,
  upright: true,
  touchDemo: true,
  create: (ctx) => new KeyItOut(ctx),
};
