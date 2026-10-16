import { Circle, Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { ink, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { spread, type View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { COUNT_PARTS, countParts, countSpot, morePart, type CountPart, exampleIndices, fits, HOOP_R, hasNeitherMat, hintFor, MAT_RX, MAT_RY, neitherMat, hoopCenters, makeRound, nextToSort, sortPlaceAt, placeOf, planFor, RULE_WORDS, ruleToTap, spotFor, type Place, type Rule, type SortCritter, type SortPlan, type SortRound } from './logic';

const LEVELS: BandLevels = {
  prek: { min: 1, max: 6, order: [6, 1, 2, 3] },
  school: { min: 2, max: 11, order: [2, 3, 4, 5, 7, 8, 9, 11] },
};

const SCALE = 0.32;
export const KIND_WORDS: Record<string, string> = { cow: 'cow', duck: 'duck', pig: 'pig', cat: 'cat', bear: 'bear', dog: 'dog', bunny: 'bunny' };

export function hatArt(): Graphics {
  return new Graphics().ellipse(0, -232, 74, 16).fill(ink).roundRect(-44, -320, 88, 90, 10).fill(ink).rect(-44, -258, 88, 16).fill(swatch.red.fill);
}

/** A little picture of a rule, for the sign above a hoop. */
export function ruleIcon(rule: Rule): Graphics {
  const g = new Graphics();
  const head = (color: number) => g.circle(0, 6, 26).fill(color).stroke({ width: 4, color: ink, alpha: 0.5 });
  switch (rule) {
    case 'hat':
      g.ellipse(0, 22, 40, 9).fill(ink).roundRect(-24, -28, 48, 50, 6).fill(ink).rect(-24, 6, 48, 8).fill(swatch.red.fill);
      break;
    case 'brown':
    case 'white': {
      const sw = rule === 'brown' ? swatch.brown : swatch.white;
      g.moveTo(-30, 0).bezierCurveTo(-34, -30, 20, -34, 30, -10).bezierCurveTo(40, 20, -10, 34, -24, 22).closePath().fill(sw.fill).stroke({ width: 4, color: sw.line });
      break;
    }
    case 'floppy':
      head(swatch.white.light);
      g.ellipse(-28, 10, 10, 24).ellipse(28, 10, 10, 24).fill(swatch.brown.fill).stroke({ width: 3, color: swatch.brown.line });
      break;
    case 'pointy':
      g.poly([-26, -6, -18, -34, -4, -14]).poly([26, -6, 18, -34, 4, -14]).fill(swatch.orange.fill).stroke({ width: 3, color: swatch.orange.line, join: 'round' });
      head(swatch.white.light);
      break;
    case 'whiskers':
      head(swatch.white.light);
      for (const s of [-1, 1]) for (const dy of [-4, 6]) g.moveTo(s * 12, 10).lineTo(s * 42, 10 + dy * 1.5).stroke({ width: 3, color: ink, cap: 'round' });
      break;
  }
  return g;
}

interface Sorter {
  c: SortCritter;
  node: Critter;
  drag?: DragHandle;
  placed: Place | null;
  home: { x: number; y: number };
}

class CritterSort implements Game {
  readonly plan: SortPlan;
  round!: SortRound;
  readonly sorters: Sorter[] = [];
  readonly options: { rule: Rule; node: Container }[] = [];
  index = -1;
  pass = 0;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  counting = false;
  readonly counted = new Map<Sorter, number>();
  readonly comparisons: { place: CountPart; node: Container }[] = [];
  private readonly badges = new Container();
  private comparisonHint = false;

  private readonly backdrop: Backdrop;
  private readonly hoops = new Graphics();
  private readonly mat = new Graphics();
  private readonly signs = new Container();
  private readonly glow = new Graphics();
  private view: View;
  private wrongs = 0;
  private hinting: Sorter | null = null;
  private clock = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.backdrop = new Backdrop({ sky: [0x8fd3f7, 0xe9f7ff], hills: [0xc8ecb0, 0x9edb86], horizon: 0.3, clouds: 2, sun: false, seed: 44 }, ctx.view);
    this.glow.eventMode = 'none';
    this.hoops.eventMode = 'none';
    this.mat.eventMode = 'none';
    this.badges.eventMode = 'none';
    this.signs.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.hoops, this.mat, this.signs, this.glow, this.badges);
  }

  start() {
    void this.next();
  }

  private get ruleMode(): boolean | 'butnot' {
    return this.plan.mode === 'butnot' ? 'butnot' : this.plan.mode === 'not';
  }

  private centers() {
    return hoopCenters(this.plan.mode, this.plan.mode === 'butnot' ? 1 : this.round?.rules.length ?? 1, this.view);
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    if (!this.round) return;
    const g = this.hoops.clear();
    const colors = [swatch.orange, swatch.teal];
    this.centers().forEach((c, i) => g.circle(c.x, c.y, HOOP_R).fill({ color: colors[i].light, alpha: 0.45 }).stroke({ width: 10, color: colors[i].fill }));
    this.mat.clear();
    if (hasNeitherMat(this.plan.mode)) {
      const p = neitherMat(this.centers());
      this.mat.ellipse(p.x, p.y, MAT_RX, MAT_RY).fill(swatch.green.light).stroke({ width: 5, color: swatch.green.line });
      for (const dx of [-125, -75, -25, 25, 75, 125]) {
        this.mat.ellipse(p.x + dx, p.y, 30, 46).fill({ color: swatch.green.fill, alpha: 0.6 });
        this.mat.moveTo(p.x + dx, p.y + 35).lineTo(p.x + dx, p.y - 35).stroke({ width: 3, color: swatch.green.line, alpha: 0.6 });
      }
    }
    this.signs.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.centers().forEach((c, i) => {
      const sign = new Container();
      sign.addChild(new Graphics().roundRect(-52, -46, 104, 92, 20).fill(0xffffff).stroke({ width: 6, color: colors[i].fill }));
      if (this.plan.mode === 'guess') sign.addChild(label('?', 64, ink));
      else {
        sign.addChild(ruleIcon(this.round.rules[i]));
        if (this.plan.mode === 'not') sign.addChild(new Graphics().moveTo(-38, -34).lineTo(38, 34).stroke({ width: 9, color: swatch.red.fill, cap: 'round' }));
      }
      if (this.plan.mode === 'butnot') {
        // A single paired sign belongs to the single hoop; the second picture means exclusion.
        sign.children[0].destroy();
        sign.addChildAt(new Graphics().roundRect(-112, -46, 224, 92, 20).fill(0xffffff).stroke({ width: 6, color: colors[i].fill }), 0);
        sign.children[1].x = -58;
        const excluded = ruleIcon(this.round.rules[1]);
        excluded.x = 58;
        sign.addChild(excluded, new Graphics().moveTo(20, -34).lineTo(96, 34).stroke({ width: 9, color: swatch.red.fill, cap: 'round' }));
      }
      sign.position.set(c.x + (this.centers().length === 2 ? (i ? 80 : -80) : 0), c.y - HOOP_R - 50);
      this.signs.addChild(sign);
    });
    const loose = this.sorters.filter((s) => !s.placed);
    const xs = spread(loose.length, 190, v.w - 50, 150);
    loose.forEach((s, i) => {
      s.home = { x: xs[i], y: v.h - 40 };
      if (s.drag) s.drag.home = s.home;
      if (!s.drag?.dragging) s.node.position.set(s.home.x, s.home.y);
    });
    const placedCounts: Record<Place, number> = { left: 0, right: 0, both: 0, out: 0 };
    for (const s of this.sorters) {
      if (!s.placed) continue;
      const k = placedCounts[s.placed]++;
      if (s.placed === 'out' && !hasNeitherMat(this.plan.mode)) {
        const xs = spread(this.sorters.filter((x) => x.placed === 'out').length, 190, v.w - 50, 150);
        s.node.position.set(xs[k], Math.min(v.h * 0.42 + HOOP_R + 120, v.h - 150));
      } else {
        const p = this.counting ? countSpot(this.centers(), s.placed as CountPart, k, this.totals()[s.placed as CountPart]) : this.spotFor(s.placed, k);
        s.node.position.set(p.x, p.y);
      }
    }
    if (this.counting) {
      this.comparisons.forEach((o, i) => o.node.position.set(v.w / 2 + (i - 1) * 190, v.h - 65));
      this.drawBadges();
    }
    const os = spread(this.options.length, 220, v.w - 120, 190);
    this.options.forEach((o, i) => o.node.position.set(os[i], v.h - 90));
  }

  update(dt: number) {
    this.clock += dt;
    const g = this.glow.clear();
    if (this.counting && this.comparisonHint && !this.busy) {
      const right = this.comparisons.find(o => o.place === morePart(this.totals()))!;
      g.roundRect(right.node.x - 80, right.node.y - 60, 160, 120, 24).stroke({ width: 6 + 2 * Math.sin(this.clock * 5), color: swatch.yellow.fill });
    }
    if (!this.hinting || this.busy) return;
    const pulse = 6 + 2 * Math.sin(this.clock * 5);
    const target = this.spotFor(placeOf(this.hinting.c, this.round.rules, this.ruleMode));
    g.circle(target.x, target.y - 50, 60).stroke({ width: pulse, color: swatch.yellow.fill });
    g.circle(this.hinting.node.x, this.hinting.node.y - 50, 70).stroke({ width: pulse, color: swatch.yellow.fill });
  }

  /** The ghost finger carries critters to hoops and the leaf mat, or taps the picture of the rule. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || !this.round) return null;
    if (this.counting) {
      const next = this.sorters.find(s => !this.counted.has(s));
      if (next) return { tap: { on: next.node, y: -120 } };
      const right = this.comparisons.find(o => o.place === morePart(this.totals()));
      return right ? { tap: { on: right.node } } : null;
    }
    if (this.plan.mode === 'guess') {
      const option = this.options.find((o) => o.rule === ruleToTap(this.round));
      return option ? { tap: { on: option.node } } : null;
    }
    const next = nextToSort(this.sorters.filter((s) => !s.drag?.dragging && !s.node.destroyed), this.round.rules, this.ruleMode, hasNeitherMat(this.plan.mode));
    if (!next?.who.drag) return null;
    const spot = this.spotFor(next.place, 1);
    return { drag: { on: next.who.node }, to: { on: this.ctx.stage, x: spot.x, y: spot.y } };
  }

  destroy() {
    for (const s of this.sorters) s.drag?.destroy();
  }

  private spotFor(place: Place, k = 0) {
    return spotFor(this.centers(), this.plan.mode, place, k);
  }

  private async next() {
    this.busy = true;
    this.index++;
    this.wrongs = 0;
    this.hinting = null;
    this.counting = false;
    this.counted.clear();
    this.comparisonHint = false;
    this.badges.removeChildren().forEach(c => c.destroy({ children: true }));
    for (const o of this.comparisons.splice(0)) o.node.destroy({ children: true });
    if (this.index >= this.plan.rounds) return void this.finale();
    for (const s of this.sorters.splice(0)) {
      s.drag?.destroy();
      this.ctx.untrack(s.node);
      s.node.destroy({ children: true });
    }
    for (const o of this.options.splice(0)) o.node.destroy({ children: true });
    this.round = makeRound(this.plan, this.ctx.rng, this.round?.rules.join());
    for (const [i, c] of this.round.critters.entries()) {
      const node = new Critter(CRITTERS[c.kind]);
      node.scale.set(SCALE);
      if (c.hat) node.attach(hatArt());
      node.hitArea = new Circle(0, -120, 170);
      this.ctx.track(node);
      this.ctx.stage.addChild(node);
      const s: Sorter = { c, node, placed: null, home: { x: 0, y: 0 } };
      if (this.plan.mode === 'guess' || (this.plan.newcomer && i !== this.round.newcomer)) {
        // The sorted diagram is a reference, leaving only the newcomer movable.
        node.eventMode = 'none';
        s.placed = placeOf(c, this.round.rules);
      } else s.drag = draggable(node, this.ctx.tw, { onPick: () => sfx.tick(), onDrop: (x, y) => this.drop(s, x, y) });
      this.sorters.push(s);
    }
    // A worked example: one critter already sits in its place in each hoop (the middle when they overlap).
    const examples = exampleIndices(this.plan, this.round).map((i) => this.sorters[i]);
    for (const done of examples) {
      done.placed = placeOf(done.c, this.round.rules, this.ruleMode);
      if (done.drag) done.drag.enabled = false;
    }
    if (this.plan.mode === 'guess') {
      for (const rule of this.round.options!) {
        const node = new Container();
        node.addChild(new Graphics().roundRect(-70, -60, 140, 120, 24).fill(0xffffff).stroke({ width: 6, color: wood.line }), ruleIcon(rule));
        node.hitArea = new Rectangle(-74, -64, 148, 128);
        onTap(node, () => void this.guess(rule), { cooldown: 350 });
        this.options.push({ rule, node });
        this.ctx.stage.addChild(node);
      }
    }
    this.resize(this.view);
    this.busy = false;
    const index = this.index;
    await this.instruct();
    // Name the example only while its round is still on the board.
    if (this.index !== index || this.finished) return;
    const [first, second] = examples.map((s) => KIND_WORDS[s.c.kind]);
    if (second) return this.ctx.say('sort.examples', { a: first, b: second });
    if (first) return this.ctx.say('sort.example', { who: first });
  }

  private instruct() {
    const [a, b] = this.round.rules.map((r) => RULE_WORDS[r]);
    if (this.plan.count) return this.ctx.instruct('sort.howmany.sort', { a, b });
    if (this.plan.mode === 'butnot') return this.ctx.instruct('sort.butnot', { a, b });
    if (this.plan.newcomer) return this.ctx.instruct('sort.newcomer', { a, b });
    if (this.plan.mode === 'resort') return this.ctx.instruct(this.pass ? 'sort.again' : 'sort.first', { a });
    if (this.plan.mode === 'one') return this.ctx.instruct('sort.one', { a });
    if (this.plan.mode === 'two') return this.ctx.instruct('sort.two', { a, b });
    if (this.plan.mode === 'venn') return this.ctx.instruct('sort.venn', { a, b });
    if (this.plan.mode === 'not') return this.ctx.instruct('sort.not', { a });
    return this.ctx.instruct('sort.guess');
  }

  private drop(s: Sorter, x: number, y: number): boolean {
    if (this.busy || this.finished) return false;
    const at = sortPlaceAt(this.centers(), this.plan.mode, x, y);
    // Back on the grass: just put down again, never a mistake.
    if (at === null) return false;
    const right = placeOf(s.c, this.round.rules, this.ruleMode);
    if (at === right) {
      s.placed = at;
      if (s.drag) s.drag.enabled = false;
      sfx.pop(6 + this.sorters.filter((x) => x.placed).length);
      if (this.plan.mode === 'butnot') void this.explainButNot(s);
      if (at === 'out') {
        sfx.whoosh();
        if (this.plan.mode !== 'butnot') void this.ctx.say(this.plan.mode === 'not' ? 'sort.mat.not' : 'sort.mat.yes', { who: KIND_WORDS[s.c.kind], rule: RULE_WORDS[this.round.rules[0]] });
      }
      s.node.cheer();
      this.wrongs = 0;
      if (this.hinting === s) this.hinting = null;
      this.resize(this.view);
      if (this.sorters.every((x) => x.placed || (!hasNeitherMat(this.plan.mode) && placeOf(x.c, this.round.rules, this.ruleMode) === 'out'))) {
        if (this.plan.count) this.startCounting();
        else void this.roundDone();
      }
      return true;
    }
    this.misses++;
    this.wrongs++;
    sfx.boing();
    s.node.setMood('surprised', 1);
    void this.explain(s, at);
    if (this.wrongs >= 2 && !this.hinting) {
      this.hints++;
      this.hinting = hintFor(this.sorters, s, this.round.rules, this.ruleMode, hasNeitherMat(this.plan.mode));
    }
    return false;
  }

  /** Say why it doesn't go there: which rule it fails, or which rule it also fits. */
  private explain(s: Sorter, at: Place) {
    if (this.plan.mode === 'butnot') return this.explainButNot(s);
    const who = KIND_WORDS[s.c.kind];
    const rules = this.round.rules;
    if (at === 'out' && this.plan.mode !== 'not') {
      const rule = rules.find((r) => fits(s.c, r))!;
      return this.ctx.say('sort.mat.hoop', { who, rule: RULE_WORDS[rule] });
    }
    if (this.plan.mode === 'not') return this.ctx.say(fits(s.c, rules[0]) ? 'sort.not.in' : 'sort.not.out', { who, rule: RULE_WORDS[rules[0]] });
    const wantA = at === 'left' || at === 'both';
    const wantB = at === 'right' || at === 'both';
    if (wantA && !fits(s.c, rules[0])) return this.ctx.say('sort.isnot', { who, rule: RULE_WORDS[rules[0]] });
    if (wantB && !fits(s.c, rules[1])) return this.ctx.say('sort.isnot', { who, rule: RULE_WORDS[rules[1]] });
    // It fits both, so it belongs in the middle.
    return this.ctx.say('sort.both', { who, a: RULE_WORDS[rules[0]], b: RULE_WORDS[rules[1]] });
  }

  private explainButNot(s: Sorter) {
    const [a, b] = this.round.rules;
    const key = fits(s.c, a) ? (fits(s.c, b) ? 'sort.butnot.both' : 'sort.butnot.in') :
      (fits(s.c, b) ? 'sort.butnot.onlyb' : 'sort.butnot.neither');
    return this.ctx.say(key, { who: KIND_WORDS[s.c.kind], a: RULE_WORDS[a], b: RULE_WORDS[b] });
  }

  private async guess(rule: Rule) {
    if (this.busy || this.finished) return;
    if (rule === this.round.rules[0]) return void this.roundDone();
    this.busy = true;
    this.misses++;
    this.wrongs++;
    sfx.boing();
    // Find a critter that shows this rule is wrong.
    const witness = this.sorters.find((s) => fits(s.c, rule) !== fits(s.c, this.round.rules[0]))!;
    witness.node.hop(0.8);
    await this.ctx.say(fits(witness.c, rule) ? 'sort.notguess.out' : 'sort.notguess.in', { who: KIND_WORDS[witness.c.kind], rule: RULE_WORDS[rule] });
    if (this.wrongs >= 2) {
      this.hints++;
      const right = this.options.find((o) => o.rule === this.round.rules[0])!;
      right.node.scale.set(1.12);
    }
    this.busy = false;
  }

  private totals() { return countParts(this.round.critters, this.round.rules); }

  private drawBadges() {
    this.badges.removeChildren().forEach(c => c.destroy({ children: true }));
    for (const part of COUNT_PARTS) {
      const center = part === 'out' ? neitherMat(this.centers()) : this.centers()[part === 'left' ? 0 : 1];
      const n = this.comparisonHint ? this.totals()[part] : [...this.counted.keys()].filter(s => s.placed === part).length;
      const badge = new Container();
      badge.addChild(new Graphics().circle(0, 0, 27).fill(0xffffff).stroke({ width: 4, color: wood.line }), label(String(n), 34, ink));
      badge.position.set(center.x + (part === 'out' ? MAT_RX + 40 : HOOP_R + 30), center.y);
      this.badges.addChild(badge);
    }
    // A ring marks each counted critter without intercepting another touch.
    for (const s of this.counted.keys()) {
      this.badges.addChild(new Graphics().circle(s.node.x, s.node.y - 38, 48).stroke({ width: 4, color: swatch.yellow.fill }));
    }
  }

  private startCounting() {
    this.counting = true;
    this.wrongs = 0;
    this.hinting = null;
    for (const s of this.sorters) {
      s.drag?.destroy();
      s.drag = undefined;
      onTap(s.node, () => {
        if (this.busy || this.finished || !this.counting) return;
        if (!this.counted.has(s)) this.counted.set(s, [...this.counted.keys()].filter(x => x.placed === s.placed).length + 1);
        s.node.hop(0.5);
        sfx.tick();
        void this.ctx.say('count', { n: this.counted.get(s)! });
        this.drawBadges();
      });
    }
    for (const [i, place] of COUNT_PARTS.entries()) {
      const node = new Container();
      const color = [swatch.orange, swatch.teal, swatch.green][i];
      node.addChild(new Graphics().roundRect(-72, -54, 144, 108, 22).fill(0xffffff).stroke({ width: 5, color: color.fill }));
      if (place === 'out') node.addChild(new Graphics().ellipse(0, 0, 45, 23).fill(color.light).stroke({ width: 4, color: color.line }));
      else {
        node.addChild(new Graphics().circle(0, 0, 38).stroke({ width: 6, color: color.fill }), ruleIcon(this.round.rules[i]));
      }
      node.hitArea = new Rectangle(-72, -54, 144, 108);
      onTap(node, () => void this.compare(place));
      this.comparisons.push({ place, node });
      this.ctx.stage.addChild(node);
    }
    this.resize(this.view);
    void this.ctx.instruct('sort.howmany.count');
  }

  private async compare(place: CountPart) {
    if (this.busy || this.finished || !this.counting) return;
    const totals = this.totals();
    const right = morePart(totals)!;
    if (place === right) return void this.roundDone();
    this.busy = true;
    this.misses++;
    this.wrongs++;
    sfx.boing();
    this.comparisons.find(o => o.place === place)!.node.scale.set(0.96);
    if (this.wrongs >= 2 && !this.comparisonHint) {
      this.hints++;
      this.comparisonHint = true;
      this.drawBadges();
    }
    await this.ctx.say('sort.howmany.try', { small: totals[place], big: totals[right] });
    this.comparisons.find(o => o.place === place)!.node.scale.set(1);
    this.busy = false;
  }

  private async roundDone() {
    this.busy = true;
    this.hinting = null;
    sfx.sparkle();
    this.ctx.pet.cheer();
    for (const s of this.sorters) if (s.placed && s.placed !== 'out') s.node.cheer();
    await this.ctx.say(this.plan.mode === 'guess' ? 'sort.guessyay' : 'sort.yay', { rule: RULE_WORDS[this.round.rules[0]] });
    await this.ctx.tw.wait(0.5);
    if (this.plan.mode === 'resort' && this.pass === 0) {
      // Keep the very same critters and drag handles; the sign and destinations change.
      await this.ctx.tw.to(this.signs.children[0].scale, { x: 0 }, { duration: 0.25 });
      this.pass = 1;
      this.round.rules = [this.round.nextRule!];
      this.wrongs = 0;
      for (const s of this.sorters) s.placed = null;
      this.resize(this.view);
      this.signs.children[0].scale.x = 0;
      for (const s of this.sorters) s.node.hop();
      await this.ctx.tw.to(this.signs.children[0].scale, { x: 1 }, { duration: 0.25 });
      await this.instruct();
      for (const s of this.sorters) if (s.drag) s.drag.enabled = true;
      this.busy = false;
      return;
    }
    await this.next();
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    sfx.tada();
    await this.ctx.say('sort.done');
    await this.ctx.tw.wait(0.4);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

class SortIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    c.addChild(new Graphics().circle(-40, -90, 70).stroke({ width: 8, color: swatch.orange.fill }).circle(40, -90, 70).stroke({ width: 8, color: swatch.teal.fill }));
    const dog = new Critter(CRITTERS.dog);
    dog.alive = false;
    dog.scale.set(0.3);
    dog.position.set(0, -50);
    c.addChild(dog);
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  c.addChild(new Graphics().circle(-36, 0, 80).stroke({ width: 10, color: swatch.orange.fill }).circle(36, 0, 80).stroke({ width: 10, color: swatch.teal.fill }));
  const k = new Critter(CRITTERS[rng.pick(['cow', 'cat', 'dog', 'bunny'] as const)]);
  k.alive = false;
  k.scale.set(0.34);
  k.y = 40;
  if (rng.chance(0.5)) k.attach(hatArt());
  c.addChild(k);
  return c;
}

export const critterSort: GameModule = {
  id: 'critter-sort',
  name: 'Critter Sort',
  titleLine: 'game.critter-sort',
  region: 'barnyard',
  skills: ['sorting', 'logic', 'attributes', 'data'],
  bands: ['prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  entryLevels: [6],
  describeLevel: (level) => planFor(level).name,
  music: STYLES.hub,
  touchDemo: true,
  coplayHint: 'Ask why each critter goes where it does: "Why is the dog in the middle?"',
  offScreen: 'Sort toys or socks with two hula hoops or loops of string: "red" and "soft". What goes in the middle?',
  hubIcon: () => new SortIcon(),
  sticker,
  create: (ctx) => new CritterSort(ctx),
};
