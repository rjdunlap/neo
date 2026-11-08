/**
 * Paint Mixer level 6, "which jars match?": the sample jar, its recipe row and its ratio table (column 1 shown), four lidded
 * jars labelled with counts, and Check. Tapping a jar chooses it or puts it back (free); tapping its lid opens it, and the
 * first lid opened in a case is that case's one hint. Rules: `jars.ts`. Definition: docs/definitions/paint-mixer-5-6.md.
 */
import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { cream, grass, swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import type { Game, GameContext, TouchIntent } from '../types';
import { button, drop as dropArt, jar as jarArt, labelJar, ratioTable } from './art';
import {
  CASES_PER_ROUND,
  TABLE_COLUMNS,
  checkJars,
  finishTaps,
  inLid,
  layoutJars,
  makeJarRound,
  matchingSet,
  namedJar,
  reveal,
  type JarCase,
  type JarLayout,
  type Reveal,
} from './jars';
import { BUTTON_H, BUTTON_W, JAR_H, JAR_W, emptyCounts, mix, type Pot, type Table } from './logic';

type Glow = { at: 'jar'; jar: number } | { at: 'check' };

/** A label's colour: the pair's pots mixed at its counts. */
function labelColor(c: JarCase, label: readonly [number, number]): number {
  const counts = emptyCounts();
  counts[c.pair[0]] = label[0];
  counts[c.pair[1]] = label[1];
  return mix(counts)!;
}

export class JarShelf implements Game {
  readonly cases: JarCase[];
  caseIndex = 0;
  chosen: boolean[] = [];
  opened: boolean[] = [];
  misses = 0;
  hints = 0;
  /** Misses on the case in play; the second opens the named jar's lid. */
  caseMisses = 0;
  /** A hint has been counted for this case (the first lid opened, however it opened). */
  hinted = false;
  /** The jar whose reveal the table and label show, or null. */
  shown: number | null = null;
  glow: Glow | null = null;
  busy = false;
  finished = false;
  /** The supported finish is choosing the right jars. */
  finishing = false;
  readonly jarNodes: Container[] = [];
  readonly check: Container;
  readonly sampleNode = new Container();
  private readonly recipeNode = new Container();
  private readonly tableNode = new Container();
  private readonly glowRing = new Graphics();
  private readonly backdrop: Backdrop;
  private layoutNow: JarLayout;
  private turn = 0;
  private clock = 0;

  constructor(private readonly ctx: GameContext) {
    this.cases = makeJarRound(ctx.rng);
    this.backdrop = new Backdrop(
      {
        sky: [cream, swatch.blue.light],
        hills: [grass, swatch.green.light],
        horizon: 0.34,
        clouds: 1,
        sun: false,
        seed: 67,
      },
      ctx.view,
    );
    this.sampleNode.hitArea = new Rectangle(-JAR_W / 2, -JAR_H / 2, JAR_W, JAR_H);
    onTap(this.sampleNode, () => this.tapSample());
    this.check = button('check', BUTTON_W, BUTTON_H);
    this.check.hitArea = new Rectangle(-BUTTON_W / 2, -BUTTON_H / 2, BUTTON_W, BUTTON_H);
    onTap(this.check, () => this.tapCheck());
    this.recipeNode.eventMode = this.tableNode.eventMode = this.glowRing.eventMode = 'none';
    for (let i = 0; i < 4; i++) {
      const n = new Container();
      n.hitArea = new Rectangle(-JAR_W / 2, -JAR_H / 2, JAR_W, JAR_H);
      // One handler per jar: the lid knob opens the lid, anywhere else chooses the jar.
      onTap(n, (e: FederatedPointerEvent) => {
        const p = n.toLocal(e.global);
        if (inLid(p.x, p.y)) this.openLid(i, 'her');
        else this.toggle(i);
      });
      this.jarNodes.push(n);
    }
    this.layoutNow = layoutJars(ctx.view);
    ctx.stage.addChild(
      this.backdrop,
      this.sampleNode,
      this.recipeNode,
      this.tableNode,
      ...this.jarNodes,
      this.check,
      this.glowRing,
    );
    this.dressCase();
    this.resize(ctx.view);
  }

  get case(): JarCase {
    return this.cases[this.caseIndex];
  }
  /** What a scripted play reads. */
  get state() {
    const c = this.case;
    return {
      level: 6,
      case: this.caseIndex,
      pair: c.pair,
      base: c.base,
      labels: c.jars.map((j) => j.label),
      matching: matchingSet(c),
      chosen: this.chosen.slice(),
      opened: this.opened.slice(),
      shown: this.shown,
      misses: this.misses,
      hints: this.hints,
      glow: this.glow,
      busy: this.busy,
      finished: this.finished,
      finishing: this.finishing,
    };
  }

  start() {
    void this.instruct();
  }

  private async instruct() {
    const turn = this.turn;
    await this.ctx.instruct('pm.instruct.6');
    if (this.finished || turn !== this.turn) return;
    await this.forEvery();
  }

  private forEvery() {
    const c = this.case;
    return this.ctx.say('pm.for-every', { a: c.base[0], potA: c.pair[0], b: c.base[1], potB: c.pair[1] });
  }

  destroy() {
    this.finished = true;
    for (const n of this.jarNodes) {
      this.ctx.tw.kill(n);
      this.ctx.tw.kill(n.scale);
    }
  }

  // ---- drawing ----

  /** The sample jar and its row for the case in play, then the jars and table. */
  private dressCase() {
    const c = this.case;
    this.chosen = c.jars.map(() => false);
    this.opened = c.jars.map(() => false);
    this.sampleNode.removeChildren().forEach((n) => n.destroy({ children: true }));
    this.sampleNode.addChild(jarArt(labelColor(c, c.base)));
    this.recipeNode.removeChildren().forEach((n) => n.destroy());
    const row: Pot[] = [...Array<Pot>(c.base[0]).fill(c.pair[0]), ...Array<Pot>(c.base[1]).fill(c.pair[1])];
    row.forEach((pot, i) => {
      const d = dropArt(pot);
      d.position.set((i - (row.length - 1) / 2) * 42, 0);
      this.recipeNode.addChild(d);
    });
    this.redraw();
  }

  /** The table's picture for the reveal on show: column 1 alone, or filled to the label's column, or the whole first row. */
  tableShown(): { table: Table; glow: number | null; reveal: Reveal | null } {
    const c = this.case;
    const r = this.shown === null ? null : reveal(c.base, c.jars[this.shown].label);
    const filled = !r ? 1 : r.kind === 'first' ? TABLE_COLUMNS : Math.max(1, Math.min(TABLE_COLUMNS, r.k));
    const values = Array.from({ length: TABLE_COLUMNS }, (_, i) => c.base.map((n) => (i + 1) * n));
    return {
      table: { columns: TABLE_COLUMNS, filled, values },
      glow: r && r.kind !== 'first' ? r.k : null,
      reveal: r,
    };
  }

  private redraw() {
    const c = this.case;
    const { table, glow, reveal: r } = this.tableShown();
    this.tableNode.removeChildren().forEach((n) => n.destroy({ children: true }));
    this.tableNode.addChild(ratioTable(table, c.pair, null, glow));
    c.jars.forEach((jar, i) => {
      const n = this.jarNodes[i];
      n.removeChildren().forEach((k) => k.destroy({ children: true }));
      const mine = this.shown === i ? r : null;
      n.addChild(
        labelJar({
          pots: c.pair,
          label: jar.label,
          color: labelColor(c, jar.label),
          open: this.opened[i],
          chosen: this.chosen[i],
          circle: mine?.kind === 'second' ? 1 : mine?.kind === 'first' ? 0 : null,
          fits: mine?.kind === 'fills',
        }),
      );
    });
    this.place();
  }

  // ---- play ----

  toggle(i: number, ghost = false) {
    if (this.busy || this.finished || (this.finishing && !ghost)) return;
    this.chosen[i] = !this.chosen[i];
    sfx.pluck(this.chosen[i] ? 7 : 4, 0.3);
    if (this.chosen[i]) sfx.bell(9, 0.15);
    const n = this.jarNodes[i];
    this.ctx.tw.kill(n.scale);
    n.scale.set(1.06, 0.94);
    void this.ctx.tw.to(n.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack });
    this.redraw();
    if (this.glow) this.retarget();
  }

  /** Open a lid: its reveal plays. The first lid in a case is the case's one hint, whoever opened it. */
  openLid(i: number, by: 'her' | 'help') {
    if (this.busy || this.finished || this.finishing) return;
    if (!this.hinted) {
      this.hinted = true;
      this.hints++;
    }
    const first = !this.opened[i];
    this.opened[i] = true;
    this.shown = i;
    if (first) sfx.pop(6);
    this.redraw();
    void this.sayReveal(i, by);
  }

  private async sayReveal(i: number, by: 'her' | 'help') {
    const c = this.case,
      jar = c.jars[i],
      r = reveal(c.base, jar.label);
    const words = { a: jar.label[0], potA: c.pair[0], b: jar.label[1], potB: c.pair[1] };
    const turn = this.turn;
    if (by === 'help') await this.ctx.say('pm.jars.look');
    if (this.finished || turn !== this.turn) return;
    if (r.kind === 'fills')
      await this.ctx.say(r.k === 1 ? 'pm.jars.batch-1' : 'pm.jars.batches', { ...words, count: r.k });
    else if (r.kind === 'second')
      await this.ctx.say('pm.jars.table-says', { ...words, expected: r.expected });
    else await this.ctx.say('pm.jars.not-in-row', words);
  }

  private tapSample() {
    if (this.finished) return;
    sfx.bell(7, 0.2);
    void this.forEvery();
  }

  private tapCheck() {
    if (this.busy || this.finished || this.finishing) return;
    this.ctx.tw.kill(this.check.scale);
    this.check.scale.set(0.92);
    void this.ctx.tw.to(this.check.scale, { x: 1, y: 1 }, { duration: 0.2, ease: ease.outBack });
    const v = checkJars(this.case, this.chosen);
    if (v.kind === 'match') {
      void this.celebrate();
      return;
    }
    if (v.kind === 'empty') {
      sfx.pop(3);
      void this.ctx.say('pm.jars.choose');
      return;
    }
    this.misses++;
    this.caseMisses++;
    sfx.boing();
    this.wiggle(v.jar);
    void this.hearWrong(v.way);
  }

  private async hearWrong(way: 'not-same' | 'one-more') {
    const turn = this.turn;
    await this.ctx.say(way === 'not-same' ? 'pm.jars.not-same' : 'pm.jars.one-more');
    if (this.finished || this.busy || turn !== this.turn) return;
    // She may have fixed the set while the line played: no hint for a shelf she solved unaided, and help names the jar as it is now.
    if (checkJars(this.case, this.chosen).kind === 'match') return;
    if (this.caseMisses >= 2 && !this.glow) this.help();
  }

  private wiggle(i: number) {
    const n = this.jarNodes[i];
    this.ctx.tw.kill(n);
    n.rotation = 0.12;
    void this.ctx.tw.to(n, { rotation: 0 }, { duration: 0.5, ease: ease.outElastic });
  }

  /** Help: the named jar's lid lifts and its reveal plays; the glow then leads to the next jar to change, or Check. */
  private help(jar = namedJar(this.case, this.chosen)) {
    this.glow = { at: 'jar', jar };
    this.openLid(jar, 'help');
    this.retarget();
  }

  private retarget() {
    const taps = finishTaps(this.case, this.chosen);
    this.glow = taps.length ? { at: 'jar', jar: taps[0] } : { at: 'check' };
  }

  readonly hintLabel = 'Show me';

  /** Asked-for help: a lid and its reveal (the case's one hint); asked again, the right jars choose themselves and Check glows. */
  askForHint() {
    if (this.busy || this.finished || this.finishing) return;
    if (!this.glow) {
      this.help();
      return;
    }
    void this.supportedFinish();
  }

  private async supportedFinish() {
    this.finishing = true;
    const turn = this.turn;
    for (const i of finishTaps(this.case, this.chosen)) {
      await this.ctx.tw.wait(1);
      if (this.finished || this.busy || turn !== this.turn) break;
      this.toggle(i, true);
    }
    this.finishing = false;
    if (!this.finished && turn === this.turn) this.retarget();
  }

  private async celebrate() {
    this.busy = true;
    this.glow = null;
    const l = this.layoutNow;
    sfx.bell(7, 0.35);
    sfx.bell(11, 0.3);
    // The chosen jars slide toward the sample: the same colour, the same way.
    this.case.jars.forEach((_, i) => {
      if (!this.chosen[i]) return;
      const n = this.jarNodes[i];
      this.ctx.particles.burst(n.x, n.y - 40, {
        kind: 'star',
        colors: [labelColor(this.case, this.case.jars[i].label), swatch.yellow.fill, 0xffffff],
        count: 10,
        speed: [100, 240],
        gravity: 320,
        life: [0.4, 0.8],
      });
      void this.ctx.tw
        .to(n, { y: l.jars[i].y - 34 }, { duration: 0.25, ease: ease.outQuad })
        .then(() =>
          this.ctx.tw.to(n, { y: this.layoutNow.jars[i].y - 14 }, { duration: 0.35, ease: ease.outBack }),
        );
    });
    await this.ctx.say('pm.jars.match');
    if (this.finished) return;
    if (this.caseIndex + 1 >= CASES_PER_ROUND) {
      this.finished = true;
      await this.ctx.say('pm.jars.done');
      await this.ctx.tw.wait(0.5);
      this.ctx.finish({ misses: this.misses, hints: this.hints });
      return;
    }
    await this.ctx.tw.wait(0.4);
    if (this.finished) return;
    this.caseIndex++;
    this.turn++;
    this.caseMisses = 0;
    this.hinted = false;
    this.shown = null;
    sfx.splash();
    this.dressCase();
    await this.ctx.say('pm.jars.next');
    if (this.finished) return;
    this.busy = false;
    void this.instruct();
  }

  // ---- shell hooks ----

  private place() {
    const l = this.layoutNow;
    this.jarNodes.forEach((n, i) => n.position.set(l.jars[i].x, l.jars[i].y - (this.chosen[i] ? 14 : 0)));
  }

  resize(view: View) {
    const l = (this.layoutNow = layoutJars(view));
    this.backdrop.resize(view);
    this.sampleNode.position.set(l.sample.x, l.sample.y);
    this.recipeNode.position.set(l.recipe.x, l.recipe.y);
    this.tableNode.position.set(l.table.x, l.table.y);
    this.check.position.set(l.check.x, l.check.y);
    this.place();
  }

  update(dt: number) {
    this.clock += dt;
    this.glowRing.clear();
    if (!this.glow || this.finished || this.busy) return;
    const l = this.layoutNow;
    const b = this.glow.at === 'check' ? l.check : l.jars[this.glow.jar];
    const pulse = 6 + 4 * Math.sin(this.clock * 5);
    this.glowRing
      .roundRect(b.x - b.w / 2 - pulse, b.y - b.h / 2 - pulse, b.w + 2 * pulse, b.h + 2 * pulse, 30)
      .stroke({ width: 7, color: swatch.yellow.fill });
  }

  /** The bot taps the matching jars (never a lid, never a non-match), then Check. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.finishing) return null;
    const taps = finishTaps(this.case, this.chosen);
    if (taps.length) return { tap: { on: this.jarNodes[taps[0]], x: 0, y: 30 }, pause: 0.5 };
    return { tap: { on: this.check }, pause: 0.6 };
  }
}
