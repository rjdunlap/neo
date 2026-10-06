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
import type { Game, GameContext, GameModule } from '../types';
import { fits, makeRound, placeOf, planFor, RULE_WORDS, type Place, type Rule, type SortCritter, type SortPlan, type SortRound } from './logic';

const LEVELS: BandLevels = {
  prek: { min: 1, max: 3 },
  school: { min: 2, max: 4 },
};

const SCALE = 0.32;
const HOOP_R = 150;
const KIND_WORDS: Record<string, string> = { cow: 'cow', duck: 'duck', pig: 'pig', cat: 'cat', bear: 'bear', dog: 'dog', bunny: 'bunny' };

function hatArt(): Graphics {
  return new Graphics().ellipse(0, -232, 74, 16).fill(ink).roundRect(-44, -320, 88, 90, 10).fill(ink).rect(-44, -258, 88, 16).fill(swatch.red.fill);
}

/** A little picture of a rule, for the sign above a hoop. */
function ruleIcon(rule: Rule): Graphics {
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
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;

  private readonly backdrop: Backdrop;
  private readonly hoops = new Graphics();
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
    this.signs.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.hoops, this.signs, this.glow);
  }

  start() {
    void this.next();
  }

  /** Hoop centers: one hoop in the middle, two apart, or two overlapping. */
  private centers() {
    const v = this.view;
    const y = v.h * 0.42;
    const n = this.round?.rules.length ?? 1;
    if (n === 1) return [{ x: v.w / 2, y }];
    const gap = this.plan.mode === 'venn' ? 210 : 360;
    return [{ x: v.w / 2 - gap / 2, y }, { x: v.w / 2 + gap / 2, y }];
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    if (!this.round) return;
    const g = this.hoops.clear();
    const colors = [swatch.orange, swatch.teal];
    this.centers().forEach((c, i) => g.circle(c.x, c.y, HOOP_R).fill({ color: colors[i].light, alpha: 0.45 }).stroke({ width: 10, color: colors[i].fill }));
    this.signs.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.centers().forEach((c, i) => {
      const sign = new Container();
      sign.addChild(new Graphics().roundRect(-52, -46, 104, 92, 20).fill(0xffffff).stroke({ width: 6, color: colors[i].fill }));
      if (this.plan.mode === 'guess') sign.addChild(label('?', 64, ink));
      else sign.addChild(ruleIcon(this.round.rules[i]));
      sign.position.set(c.x + (this.round.rules.length === 2 ? (i ? 80 : -80) : 0), c.y - HOOP_R - 50);
      this.signs.addChild(sign);
    });
    const loose = this.sorters.filter((s) => !s.placed);
    const xs = spread(loose.length, 190, v.w - 50, 150);
    loose.forEach((s, i) => {
      s.home = { x: xs[i], y: v.h - 40 };
      if (s.drag) s.drag.home = s.home;
      if (!s.drag?.dragging) s.node.position.set(s.home.x, s.home.y);
    });
    const os = spread(this.options.length, 220, v.w - 120, 190);
    this.options.forEach((o, i) => o.node.position.set(os[i], v.h - 90));
  }

  update(dt: number) {
    this.clock += dt;
    const g = this.glow.clear();
    if (!this.hinting || this.busy) return;
    const pulse = 6 + 2 * Math.sin(this.clock * 5);
    const target = this.spotFor(placeOf(this.hinting.c, this.round.rules));
    g.circle(target.x, target.y, 60).stroke({ width: pulse, color: swatch.yellow.fill });
    g.circle(this.hinting.node.x, this.hinting.node.y - 50, 70).stroke({ width: pulse, color: swatch.yellow.fill });
  }

  destroy() {
    for (const s of this.sorters) s.drag?.destroy();
  }

  /** A good spot inside a part of the diagram. */
  private spotFor(place: Place, k = 0) {
    const cs = this.centers();
    const jitter = (k % 3) * 64 - 64;
    if (place === 'both') return { x: (cs[0].x + cs[1].x) / 2, y: cs[0].y + 40 + jitter * 0.6 };
    const c = cs[place === 'right' ? 1 : 0];
    const out = cs.length === 2 && this.plan.mode === 'venn' ? (place === 'right' ? 70 : -70) : 0;
    return { x: c.x + out + jitter, y: c.y + 50 + (k > 2 ? -70 : 0) };
  }

  private async next() {
    this.busy = true;
    this.index++;
    this.wrongs = 0;
    this.hinting = null;
    if (this.index >= this.plan.rounds) return void this.finale();
    for (const s of this.sorters.splice(0)) {
      s.drag?.destroy();
      this.ctx.untrack(s.node);
      s.node.destroy({ children: true });
    }
    for (const o of this.options.splice(0)) o.node.destroy({ children: true });
    this.round = makeRound(this.plan, this.ctx.rng, this.round?.rules.join());
    for (const c of this.round.critters) {
      const node = new Critter(CRITTERS[c.kind]);
      node.scale.set(SCALE);
      if (c.hat) node.attach(hatArt());
      node.hitArea = new Circle(0, -120, 170);
      this.ctx.track(node);
      this.ctx.stage.addChild(node);
      const s: Sorter = { c, node, placed: null, home: { x: 0, y: 0 } };
      if (this.plan.mode === 'guess') {
        // Already sorted: the ones that fit sit in the hoop.
        s.placed = placeOf(c, this.round.rules);
      } else s.drag = draggable(node, this.ctx.tw, { onPick: () => sfx.tick(), onDrop: (x, y) => this.drop(s, x, y) });
      this.sorters.push(s);
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
    // Sorted critters stand in their places (guess level): in the hoop, or outside it on the grass.
    let inK = 0;
    let outK = 0;
    for (const s of this.sorters) {
      if (s.placed === null) continue;
      if (s.placed === 'out') {
        const xs = spread(this.sorters.filter((x) => x.placed === 'out').length, 190, this.view.w - 50, 150);
        s.node.position.set(xs[outK++], this.view.h * 0.42 + HOOP_R + 120);
        s.node.y = Math.min(s.node.y, this.view.h - 150);
      } else {
        const p = this.spotFor(s.placed, inK++);
        s.node.position.set(p.x, p.y);
      }
    }
    this.busy = false;
    const [a, b] = this.round.rules.map((r) => RULE_WORDS[r]);
    if (this.plan.mode === 'one') return this.ctx.instruct('sort.one', { a });
    if (this.plan.mode === 'two') return this.ctx.instruct('sort.two', { a, b });
    if (this.plan.mode === 'venn') return this.ctx.instruct('sort.venn', { a, b });
    return this.ctx.instruct('sort.guess');
  }

  /** Which part of the diagram a drop landed in. */
  private placeAt(x: number, y: number): Place {
    const cs = this.centers();
    const inA = Math.hypot(x - cs[0].x, y - 50 - cs[0].y) < HOOP_R;
    const inB = cs[1] ? Math.hypot(x - cs[1].x, y - 50 - cs[1].y) < HOOP_R : false;
    return inA && inB ? 'both' : inA ? 'left' : inB ? 'right' : 'out';
  }

  private drop(s: Sorter, x: number, y: number): boolean {
    if (this.busy || this.finished) return false;
    const at = this.placeAt(x, y);
    // Back on the grass: just put down again, never a mistake.
    if (at === 'out') return false;
    const right = placeOf(s.c, this.round.rules);
    if (at === right) {
      s.placed = at;
      if (s.drag) s.drag.enabled = false;
      sfx.pop(6);
      s.node.cheer();
      this.wrongs = 0;
      if (this.hinting === s) this.hinting = null;
      this.resize(this.view);
      if (this.sorters.every((x) => x.placed || placeOf(x.c, this.round.rules) === 'out')) void this.roundDone();
      return true;
    }
    this.misses++;
    this.wrongs++;
    sfx.boing();
    s.node.setMood('surprised', 1);
    void this.explain(s, at);
    if (this.wrongs >= 2 && !this.hinting) {
      this.hints++;
      this.hinting = this.sorters.find((x) => !x.placed && placeOf(x.c, this.round.rules) !== 'out') ?? null;
    }
    return false;
  }

  /** Say why it doesn't go there: which rule it fails, or which rule it also fits. */
  private explain(s: Sorter, at: Place) {
    const who = KIND_WORDS[s.c.kind];
    const rules = this.round.rules;
    const wantA = at === 'left' || at === 'both';
    const wantB = at === 'right' || at === 'both';
    if (wantA && !fits(s.c, rules[0])) return this.ctx.say('sort.isnot', { who, rule: RULE_WORDS[rules[0]] });
    if (wantB && !fits(s.c, rules[1])) return this.ctx.say('sort.isnot', { who, rule: RULE_WORDS[rules[1]] });
    // It fits both, so it belongs in the middle.
    return this.ctx.say('sort.both', { who, a: RULE_WORDS[rules[0]], b: RULE_WORDS[rules[1]] });
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

  private async roundDone() {
    this.busy = true;
    this.hinting = null;
    sfx.sparkle();
    this.ctx.pet.cheer();
    for (const s of this.sorters) if (s.placed && s.placed !== 'out') s.node.cheer();
    await this.ctx.say(this.plan.mode === 'guess' ? 'sort.guessyay' : 'sort.yay', { rule: RULE_WORDS[this.round.rules[0]] });
    await this.ctx.tw.wait(0.5);
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
  describeLevel: (level) => planFor(level).name,
  music: STYLES.hub,
  coplayHint: 'Ask why each critter goes where it does: "Why is the dog in the middle?"',
  offScreen: 'Sort toys or socks with two hula hoops or loops of string: "red" and "soft". What goes in the middle?',
  hubIcon: () => new SortIcon(),
  sticker,
  create: (ctx) => new CritterSort(ctx),
};
