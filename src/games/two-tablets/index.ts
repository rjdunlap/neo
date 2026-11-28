import { Container, Graphics } from 'pixi.js';
import { ink, swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { isParentPanelOpen } from '../../parent/panel';
import { rangeFor } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { WigglyIcon } from '../shared';
import type { LineId } from '../../content/voice-script';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { keyCellArt, pictureCard, signCell, tabletsPicture } from './art';
import { tabletsLayout, type TabletsLayout } from './layout';
import {
  LEVELS,
  SIGNS,
  SOUNDS,
  WORDS,
  cribMap,
  describeLevel,
  hintGroup,
  judge,
  knownSigns,
  makeRound,
  readingHint,
  type ReadingHint,
  type TabletsRound,
} from './logic';

const readIcon = () =>
  new Graphics()
    .poly([-26, 2, -10, 20, 28, -22])
    .stroke({ width: 10, color: ink, cap: 'round', join: 'round' });
const showIcon = () =>
  new Graphics()
    .circle(0, -8, 20)
    .fill(swatch.yellow.fill)
    .stroke({ width: 4, color: swatch.yellow.line })
    .roundRect(-11, 12, 22, 14, 4)
    .fill(0xc9ccd6)
    .stroke({ width: 3, color: 0x8c8c9c });
const undoIcon = () =>
  new Graphics()
    .arc(2, 2, 22, Math.PI * 1.1, Math.PI * 2.1)
    .stroke({ width: 8, color: ink, cap: 'round' })
    .poly([-24, -8, -8, -20, -6, 0])
    .fill(ink);
const restartIcon = () =>
  new Graphics()
    .arc(0, 0, 24, Math.PI * 0.3, Math.PI * 1.85)
    .stroke({ width: 8, color: ink, cap: 'round' })
    .poly([14, -34, 30, -14, 6, -14])
    .fill(ink);

/** One thing a key press can land on, in reading order. */
interface Stop {
  obj: Container;
  size: number;
  act: () => void;
}

class TwoTablets implements Game {
  private readonly round: TabletsRound;
  /** The candidate chosen for each group, or -1. */
  private picks: number[];
  private readonly history: number[][] = [];
  private readonly right = new Set<number>();
  /** Signs whose sound sits in the key strip: tapped on the first tablet or read in a right group. */
  private readonly stamped = new Set<number>();
  private readonly wrongs: number[];
  private readonly steps: number[];
  private readonly dimmed: Set<number>[];
  private misses = 0;
  private hints = 0;
  private busy = true;
  private finished = false;
  private view: View;
  private L: TabletsLayout;
  private time = 0;
  private shake = 0;
  private flutter = 0;
  private focus: number | null = null;
  /** What the hint is glowing: a crib sign, a group's sign, a candidate card, a key cell. */
  private glow: { crib?: [number, number]; cand?: [number, number]; groupSigns?: number; keySign?: number } =
    {};

  private readonly panels = new Graphics();
  private readonly gfx = new Graphics();
  private readonly cribLayer = new Container();
  private readonly groupLayer = new Container();
  private readonly keyLayer = new Container();
  private readonly cribPics: Container[] = [];
  private readonly cribSigns: Container[][] = [];
  private readonly groupSigns: Container[][] = [];
  private readonly cards: Container[][] = [];
  private readonly buttons: RoundButton[] = [];
  private readonly stops: Stop[] = [];

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.round = makeRound(ctx.level, ctx.rng);
    const def = this.round.def;
    this.picks = def.groups.map(() => -1);
    this.wrongs = def.groups.map(() => 0);
    this.steps = def.groups.map(() => 0);
    this.dimmed = def.groups.map(() => new Set<number>());
    this.L = tabletsLayout(ctx.view, def.crib.length, def.groups.length);
    this.panels.eventMode = this.gfx.eventMode = 'none';
    this.keyLayer.eventMode = 'none';
    ctx.stage.addChild(this.panels, this.cribLayer, this.groupLayer, this.keyLayer, this.gfx);
    const cell = this.L.cell;
    def.crib.forEach((e, w) => {
      const pic = new Container();
      pic.addChild(pictureCard(e.word, cell));
      onTap(pic, () => this.tapPicture(w), { radius: cell / 2 + 6, cooldown: 150 });
      this.cribPics.push(pic);
      this.cribLayer.addChild(pic);
      const row = e.signs.map((s, k) => {
        const c = new Container();
        c.addChild(signCell(this.round.shapes[s], cell));
        onTap(c, () => this.tapCribSign(w, k), { radius: cell / 2 + 6, cooldown: 150 });
        this.cribLayer.addChild(c);
        return c;
      });
      this.cribSigns.push(row);
    });
    def.groups.forEach((g, gi) => {
      this.groupSigns.push(
        g.signs.map((_, k) => {
          const c = new Container();
          onTap(c, () => this.tapGroupSign(gi, k), { radius: cell / 2 + 6, cooldown: 150 });
          this.groupLayer.addChild(c);
          return c;
        }),
      );
      this.cards.push(
        g.candidates.map((w, ci) => {
          const c = new Container();
          c.addChild(pictureCard(w, cell));
          onTap(c, () => this.choose(gi, ci), { radius: cell / 2 + 8, cooldown: 120 });
          this.groupLayer.addChild(c);
          return c;
        }),
      );
    });
    const r = this.L.button / 2;
    this.buttons.push(
      new RoundButton(readIcon(), swatch.green, r, () => this.read()),
      new RoundButton(showIcon(), swatch.white, r, () => this.show()),
      new RoundButton(undoIcon(), swatch.white, r, () => this.undo()),
      new RoundButton(restartIcon(), swatch.white, r, () => this.restart()),
    );
    this.buttons.forEach((b) => ctx.stage.addChild(b));
    this.buildStops();
    this.resize(ctx.view);
  }

  /** Key order: each first-tablet picture and its signs, each group's signs and cards, then the four buttons. */
  private buildStops() {
    const cell = this.L.cell;
    this.round.def.crib.forEach((_, w) => {
      this.stops.push({ obj: this.cribPics[w], size: cell, act: () => this.tapPicture(w) });
      this.cribSigns[w].forEach((o, k) =>
        this.stops.push({ obj: o, size: cell, act: () => this.tapCribSign(w, k) }),
      );
    });
    this.round.def.groups.forEach((_, g) => {
      this.groupSigns[g].forEach((o, k) =>
        this.stops.push({ obj: o, size: cell, act: () => this.tapGroupSign(g, k) }),
      );
      this.cards[g].forEach((o, c) => this.stops.push({ obj: o, size: cell, act: () => this.choose(g, c) }));
    });
    const acts = [() => this.read(), () => this.show(), () => this.undo(), () => this.restart()];
    this.buttons.forEach((b, i) => this.stops.push({ obj: b, size: this.L.button, act: acts[i] }));
  }

  start() {
    this.busy = false;
    if (!this.ctx.demo) this.ctx.listen(window, 'keydown', this.onKey);
    this.resize(this.view);
    void this.ctx.instruct('two-tablets.start');
  }

  resize(view: View) {
    this.view = view;
    const def = this.round.def;
    const L = (this.L = tabletsLayout(view, def.crib.length, def.groups.length));
    def.crib.forEach((_, w) => {
      this.cribPics[w].position.set(L.cribPic[w].x, L.cribPic[w].y);
      this.cribSigns[w].forEach((o, k) => o.position.set(L.cribSigns[w][k].x, L.cribSigns[w][k].y));
    });
    def.groups.forEach((_, g) => {
      this.groupSigns[g].forEach((o, k) => o.position.set(L.groups[g].signs[k].x, L.groups[g].signs[k].y));
      this.cards[g].forEach((o, c) => o.position.set(L.groups[g].cands[c].x, L.groups[g].cands[c].y));
    });
    this.buttons.forEach((b, i) => b.position.set(L.buttons[i].x, L.buttons[i].y));
    this.panels.clear();
    L.panels.forEach((p, i) =>
      this.panels
        .roundRect(p.x, p.y, p.w, p.h, 26)
        .fill(i === 0 ? 0xe7cf98 : 0xf1e0b4)
        .stroke({ width: 5, color: 0xb59b66 }),
    );
    this.paint();
  }

  private known() {
    return knownSigns(this.round.def, this.right);
  }

  private paint() {
    const L = this.L;
    const def = this.round.def;
    const known = this.known();
    this.groupSigns.forEach((row, g) =>
      row.forEach((o, k) => {
        o.removeChildren().forEach((c) => c.destroy({ children: true }));
        const s = def.groups[g].signs[k];
        o.addChild(signCell(this.round.shapes[s], L.cell, known.has(s)));
      }),
    );
    this.cards.forEach((row, g) =>
      row.forEach((o, c) => {
        const sel = this.picks[g] === c;
        const dim = this.dimmed[g].has(c);
        const done = this.right.has(g);
        o.removeChildren().forEach((k) => k.destroy({ children: true }));
        o.addChild(
          pictureCard(
            def.groups[g].candidates[c],
            L.cell,
            done && sel ? swatch.green.light : sel ? 0xfff0b3 : 0xfff8e6,
          ),
        );
        o.alpha = dim ? 0.3 : 1;
        o.scale.set(sel && !done ? 1.1 : 1);
      }),
    );
    this.keyLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    L.keyCells.forEach((p, j) => {
      const sign = this.round.shapes.indexOf(j);
      const cell = keyCellArt(
        j,
        L.keyCell,
        this.stamped.has(sign) || this.right.size === def.groups.length ? SOUNDS[sign] : null,
      );
      cell.position.set(p.x, p.y);
      this.keyLayer.addChild(cell);
    });
  }

  update(dt: number) {
    this.time += dt;
    const L = this.L;
    const g = this.gfx.clear();
    const pulse = 4 + Math.sin(this.time * 6) * 3;
    const ring = (o: Container, size: number, color: number, extra = 0) =>
      g
        .roundRect(
          o.x - size / 2 - 8 - extra,
          o.y - size / 2 - 8 - extra,
          size + 16 + 2 * extra,
          size + 16 + 2 * extra,
          22,
        )
        .stroke({
          width: 7,
          color,
        });
    if (this.glow.crib) {
      const [w, k] = this.glow.crib;
      ring(this.cribSigns[w][k], L.cell, swatch.yellow.line, pulse);
      ring(this.cribPics[w], L.cell, swatch.yellow.line, pulse);
    }
    if (this.glow.cand)
      ring(this.cards[this.glow.cand[0]][this.glow.cand[1]], L.cell, swatch.yellow.line, pulse);
    if (this.glow.groupSigns !== undefined)
      this.groupSigns[this.glow.groupSigns].forEach((o) => ring(o, L.cell, swatch.yellow.line, pulse));
    if (this.glow.keySign !== undefined) {
      const p = L.keyCells[this.round.shapes[this.glow.keySign]];
      g.roundRect(
        p.x - L.keyCell / 2 - 6 - pulse,
        p.y - L.keyCell / 2 - 6 - pulse,
        L.keyCell + 12 + 2 * pulse,
        L.keyCell + 12 + 2 * pulse,
        16,
      ).stroke({
        width: 6,
        color: swatch.yellow.line,
      });
    }
    this.right.forEach((gi) =>
      this.cards[gi].forEach((o, c) => this.picks[gi] === c && ring(o, L.cell, swatch.green.line)),
    );
    if (this.focus !== null && !this.finished) {
      const s = this.stops[this.focus];
      ring(s.obj, s.size, ink);
    }
    if (this.wrongs.some((w, gi) => w >= 2 && !this.right.has(gi)) && !this.finished) {
      g.circle(L.buttons[1].x, L.buttons[1].y, L.button / 2 + 10 + pulse).stroke({
        width: 7,
        color: swatch.yellow.line,
      });
    }
    if (this.shake > 0) {
      this.shake -= dt;
      const dx = this.shake > 0 ? Math.sin(this.shake * 60) * 7 * (this.shake / 0.4) : 0;
      this.cards.forEach((row, gi) =>
        row.forEach((o, c) => {
          if (!this.right.has(gi))
            o.x = L.groups[gi].cands[c].x + (this.wrongs[gi] > 0 && this.picks[gi] === -1 ? dx : 0);
        }),
      );
    }
    if (this.flutter > 0) {
      this.flutter -= dt;
      this.groupSigns.forEach((row) =>
        row.forEach((o, i) => o.scale.set(1 + Math.sin(this.time * 12 + i) * 0.06)),
      );
    }
  }

  private onKey = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.repeat || this.busy || this.finished || isParentPanelOpen())
      return;
    if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select, [contenteditable]'))
      return;
    const step = ['ArrowRight', 'ArrowDown'].includes(e.key)
      ? 1
      : ['ArrowLeft', 'ArrowUp'].includes(e.key)
        ? -1
        : 0;
    if (step) {
      e.preventDefault();
      this.focus = this.focus === null ? 0 : (this.focus + step + this.stops.length) % this.stops.length;
      sfx.tick();
    } else if ((e.key === 'Enter' || e.key === ' ') && this.focus !== null) {
      e.preventDefault();
      this.stops[this.focus].act();
    } else if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      this.read();
    }
  };

  private sayWord(word: string) {
    void this.ctx.say(`two-tablets.w.${word}` as LineId);
  }
  private saySound(snd: number) {
    void this.ctx.say(`two-tablets.s.${SOUNDS[snd]}` as LineId);
  }

  private tapPicture(w: number) {
    if (this.busy || this.finished) return;
    sfx.pop(4);
    this.sayWord(this.round.def.crib[w].word);
  }

  /** A first-tablet sign is a lookup: it says its sound and drops it into the key strip. Never a miss. */
  private tapCribSign(w: number, k: number) {
    if (this.busy || this.finished) return;
    const sign = this.round.def.crib[w].signs[k];
    sfx.pop(5 + k);
    this.stamped.add(sign);
    this.glow = {};
    this.saySound(WORDS[this.round.def.crib[w].word][k]);
    this.paint();
  }

  private tapGroupSign(g: number, k: number) {
    if (this.busy || this.finished) return;
    const sign = this.round.def.groups[g].signs[k];
    const via = cribMap(this.round.def).get(sign) ?? this.signRead(sign);
    if (via < 0) {
      sfx.tick();
      void this.ctx.say('two-tablets.notyet');
      return;
    }
    sfx.pop(5 + k);
    this.stamped.add(sign);
    this.saySound(via);
    this.paint();
  }

  /** The sound a sign carries once a right group has read it, or -1. */
  private signRead(sign: number): number {
    for (const gi of this.right) {
      const g = this.round.def.groups[gi];
      const at = g.signs.indexOf(sign);
      if (at >= 0) return WORDS[g.answer][at];
    }
    return -1;
  }

  private choose(g: number, c: number) {
    if (this.busy || this.finished || this.right.has(g)) return;
    if (this.dimmed[g].has(c)) {
      sfx.tick();
      return;
    }
    this.history.push([...this.picks]);
    this.picks[g] = c;
    this.glow = {};
    sfx.pop(5 + c);
    this.sayWord(this.round.def.groups[g].candidates[c]);
    this.paint();
  }

  /** Commit every unread group at once. A wrong group goes back to unchosen; one commit with several wrong is one miss. */
  private read() {
    if (this.busy || this.finished) return;
    const def = this.round.def;
    const open = def.groups.map((_, g) => g).filter((g) => !this.right.has(g));
    if (open.some((g) => this.picks[g] < 0)) {
      sfx.tick();
      void this.ctx.say('two-tablets.pick');
      return;
    }
    this.glow = {};
    const verdict = judge(def, this.picks);
    const wrong = open.filter((g) => verdict[g] === false);
    open.forEach((g) => {
      if (verdict[g]) {
        this.right.add(g);
        def.groups[g].signs.forEach((s) => this.stamped.add(s));
      }
    });
    if (wrong.length) {
      this.misses++;
      wrong.forEach((g) => {
        this.wrongs[g]++;
        this.picks[g] = -1;
      });
      this.shake = 0.4;
      sfx.boing();
      this.paint();
      void this.ctx.say('two-tablets.again');
      return;
    }
    this.paint();
    if (this.right.size === def.groups.length) return this.complete();
    sfx.pop(7);
    void this.ctx.say('two-tablets.right');
  }

  /** Show me: dim a card that cannot be it, then point at the crib sign that gives it away. Each request is a hint. */
  private show() {
    if (this.busy || this.finished) return;
    const def = this.round.def;
    const lagging = this.wrongs.findIndex((w, g) => w >= 2 && !this.right.has(g));
    const g = lagging >= 0 ? lagging : hintGroup(def, this.right);
    const h: ReadingHint = readingHint(def, g, this.steps[g], this.right, this.dimmed[g]);
    this.hints++;
    this.steps[g]++;
    this.glow = {};
    if (h.kind === 'dim') {
      this.dimmed[g].add(h.candidate);
      if (this.picks[g] === h.candidate) this.picks[g] = -1;
      void this.ctx.say('two-tablets.hint.dim');
    } else if (h.kind === 'other') {
      this.glow = { groupSigns: h.first };
      void this.ctx.say('two-tablets.hint.other');
    } else {
      this.glow = { cand: [g, h.candidate] };
      if (h.entry >= 0) this.glow.crib = [h.entry, h.pos];
      else if (h.pos >= 0) this.glow.keySign = def.groups[g].signs[h.pos];
      void this.ctx.say('two-tablets.hint.crib');
    }
    sfx.pop(6);
    this.paint();
  }

  private undo() {
    if (this.busy || this.finished) return;
    const prev = this.history.pop();
    if (!prev) return;
    this.picks = this.picks.map((p, g) => (this.right.has(g) ? p : prev[g]));
    this.glow = {};
    this.paint();
  }

  restart() {
    if (this.busy || this.finished) return;
    this.picks = this.picks.map((p, g) => (this.right.has(g) ? p : -1));
    this.history.length = 0;
    this.glow = {};
    this.paint();
  }

  private complete() {
    this.finished = true;
    this.flutter = 1.4;
    this.glow = {};
    for (let s = 0; s < SIGNS; s++) this.stamped.add(s);
    this.paint();
    sfx.tada();
    void this.ctx.say('two-tablets.done');
    void this.ctx.tw.wait(1.4).then(() => {
      if (!this.ctx.alive) return;
      this.ctx.finish({ misses: this.misses, hints: this.hints });
    });
  }

  /** The ghost finger: tap each first-tablet sign, choose the right picture for every group, then Read it. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished) return null;
    const def = this.round.def;
    for (let w = 0; w < def.crib.length; w++)
      for (let k = 0; k < def.crib[w].signs.length; k++)
        if (!this.stamped.has(def.crib[w].signs[k])) return { tap: { on: this.cribSigns[w][k] }, pause: 0.3 };
    for (let g = 0; g < def.groups.length; g++) {
      if (this.right.has(g)) continue;
      const want = def.groups[g].candidates.indexOf(def.groups[g].answer);
      if (this.picks[g] !== want) return { tap: { on: this.cards[g][want] }, pause: 0.45 };
    }
    return { tap: { on: this.buttons[0] }, pause: 0.6 };
  }

  destroy() {
    this.ctx.stage.removeChild(this.panels, this.cribLayer, this.groupLayer, this.keyLayer, this.gfx);
    [this.panels, this.cribLayer, this.groupLayer, this.keyLayer, this.gfx, ...this.buttons].forEach((o) =>
      o.destroy({ children: true }),
    );
  }
}

export const game: GameModule = {
  id: 'two-tablets',
  name: 'Two Tablets',
  titleLine: 'two-tablets.title',
  region: 'story-grove',
  challenge: 'logic',
  skills: ['deduction', 'pattern recognition'],
  bands: ['grownup'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel,
  music: STYLES.quiet,
  coplayHint:
    'Share the first tablet: one reads a sign aloud while the other finds the picture it belongs to.',
  offScreen:
    'Write three short words on one page and invented symbols for their syllables on another, swap with a friend, and read each other’s new line from the first page.',
  ownKeys: true,
  hubIcon: () => new WigglyIcon(tabletsPicture()),
  touchDemo: true,
  upright: true,
  sticker: () => tabletsPicture(),
  create: (ctx) => new TwoTablets(ctx),
};
