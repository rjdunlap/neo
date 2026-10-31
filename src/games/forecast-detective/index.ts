import { Container, Graphics, Rectangle } from 'pixi.js';
import { swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { LineId } from '../../content/voice-script';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  cardArt, checkArt, clueInside, flapArt, iconArt, missingArt, nightArt, paintCard, paintCheck, paintCover, ruleArt, sceneArt,
  stickerArt, streaksArt, thermoArt, vaneArt, weatherArt, type Flap,
} from './art';
import {
  CARD_H, CARD_W, CHECK, CLUES, FLAP, LEVELS, RULE, answerOf, answersFor, available, check, clueOrder, forecastLayout, freshHistory,
  makeCase, planFor, possible, stickerWeather, tomorrow, usefulClue, type Answer, type Case, type ClueId, type History, type Layout, type Plan,
  type Side, type Sky, type Verdict, type Weather,
} from './logic';

/** Each level's authored case leads its first round of a session; later rounds remember the ones before. */
const authoredShown = new Set<number>();
const history: Record<1 | 2, History> = { 1: freshHistory(), 2: freshHistory() };
/** "Real weather is trickier" is said once a session, after the first reveal. */
let saidReal = false;

const ISLAND: Record<Side, string> = { west: 'Hill Isle', east: 'Lighthouse Isle' };
const SKY_WORD: Record<Sky, string> = { sun: 'sun', cloud: 'clouds', rain: 'rain' };
const listOf = (ws: string[]) => (ws.length <= 1 ? ws.join('') : `${ws.slice(0, -1).join(', ')} or ${ws[ws.length - 1]}`);

class ForecastDetective implements Game {
  readonly plan: Plan;
  readonly case: Case;
  readonly answers: Answer[];
  open: ClueId[] = [];
  selected: Answer | null = null;
  misses = 0;
  hints = 0;
  glowOn = false;
  crossed = new Set<Answer>();
  busy = false;
  finished = false;
  readonly flaps = {} as Record<ClueId, Flap>;
  readonly cardNodes: Container[] = [];
  readonly rule: Container;
  readonly checkBtn: Container;
  private readonly checkFace: Graphics;
  private readonly cardBacks: Graphics[] = [];
  private readonly crosses: Graphics[] = [];
  private gone = false;
  /** Every Check this round, by answer and open clues: the same Check again repeats its line and counts nothing. */
  private readonly checks = new Map<string, Verdict>();
  private layoutNow: Layout;
  private clock = 0;
  private readonly backdrop: Backdrop;
  private scene: Graphics;
  private readonly vane = new Container();
  private readonly thermo = new Container();
  private streaks: Graphics | null = null;
  private readonly glowRing = new Graphics();
  private readonly revealLayer = new Container();

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    const lv = this.plan.level;
    const first = ctx.demo || !authoredShown.has(lv);
    if (first && !ctx.demo) authoredShown.add(lv);
    const made = makeCase(lv, ctx.rng, first, ctx.demo ? freshHistory() : history[lv]);
    if (!ctx.demo) history[lv] = made.next;
    this.case = made.c;
    this.answers = answersFor(lv);
    this.layoutNow = forecastLayout(ctx.view, lv)!;
    this.backdrop = new Backdrop({ sky: [0xcfe8fb, 0xe9f5ff], hills: [0xcfe8fb], horizon: 0.98, clouds: 0, sun: false, seed: 157 }, ctx.view);
    this.scene = sceneArt(this.layoutNow);
    for (const n of [this.scene, this.vane, this.thermo, this.glowRing, this.revealLayer]) n.eventMode = 'none';
    this.rule = ruleArt(RULE);
    this.rule.hitArea = new Rectangle(-RULE / 2, -RULE / 2, RULE, RULE);
    onTap(this.rule, () => this.tapRule());
    const flapLayer = new Container();
    for (const k of CLUES) {
      const f = flapArt(k, FLAP);
      f.node.hitArea = new Rectangle(-FLAP / 2, -FLAP / 2, FLAP, FLAP);
      onTap(f.node, () => this.tapFlap(k));
      this.flaps[k] = f;
      flapLayer.addChild(f.node);
    }
    if (this.case.missing) this.markMissing(this.case.missing);
    const cardLayer = new Container();
    this.answers.forEach((a, i) => {
      const { node, back, cross } = cardArt(a, CARD_W, CARD_H);
      node.hitArea = new Rectangle(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H);
      onTap(node, () => this.select(i));
      cardLayer.addChild(node);
      this.cardNodes.push(node); this.cardBacks.push(back); this.crosses.push(cross);
    });
    const c = checkArt(CHECK);
    this.checkBtn = c.node; this.checkFace = c.face;
    this.checkBtn.hitArea = new Rectangle(-CHECK / 2, -CHECK / 2, CHECK, CHECK);
    onTap(this.checkBtn, () => this.tapCheck());
    this.vane.addChild(vaneArt(null));
    this.thermo.addChild(thermoArt(null, 50));
    ctx.stage.addChild(this.backdrop, this.scene, this.vane, this.thermo, this.rule, flapLayer, cardLayer, this.checkBtn, this.glowRing, this.revealLayer);
    this.resize(ctx.view);
  }

  /** What a scripted play reads. */
  get state() {
    return {
      level: this.plan.level, case: { ...this.case }, open: [...this.open], selected: this.selected, answers: [...this.answers],
      possible: [...possible(this.case, this.open)], answer: answerOf(this.case), misses: this.misses, hints: this.hints,
      glowOn: this.glowOn, crossed: [...this.crossed], busy: this.busy, finished: this.finished,
    };
  }

  start() { void this.instruct(); }

  private instruct() { return this.ctx.instruct(this.plan.level === 2 ? 'forecast.instruct.2' : 'forecast.instruct.1'); }

  destroy() {
    this.gone = true;
    this.finished = true;
    for (const n of [...this.cardNodes, this.checkBtn, this.rule, ...CLUES.map((k) => this.flaps[k].node)]) this.ctx.tw.kill(n.scale);
    for (const k of CLUES) this.ctx.tw.kill(this.flaps[k].node);
    this.ctx.tw.kill(this.revealLayer);
  }

  private get dead() { return this.gone || this.finished; }

  private press(n: Container) {
    this.ctx.tw.kill(n.scale);
    n.scale.set(0.92);
    void this.ctx.tw.to(n.scale, { x: 1, y: 1 }, { duration: 0.22, ease: ease.outBack });
  }

  // ---- clues ----

  private markMissing(k: ClueId) {
    const f = this.flaps[k];
    paintCover(f.cover, FLAP, true);
    f.picture.visible = false;
    const m = missingArt(FLAP * 0.8);
    m.label = 'missing';
    f.node.addChild(m);
  }

  private tapRule() {
    if (this.dead) return;
    this.press(this.rule);
    sfx.bell(9, 0.22);
    void this.ctx.say('forecast.rules');
  }

  private tapFlap(k: ClueId) {
    if (this.dead || this.busy) return;
    const f = this.flaps[k];
    this.press(f.node);
    if (k === this.case.missing) { void this.ctx.say('forecast.missing'); return; }
    if (!this.open.includes(k)) this.openFlap(k);
    void this.sayClue(k);
  }

  private openFlap(k: ClueId) {
    this.open.push(k);
    const f = this.flaps[k];
    f.cover.visible = false;
    f.picture.visible = false;
    f.inside.addChild(clueInside(k, this.case[k], FLAP * 0.9));
    sfx.brush();
    this.showInScene(k);
    if (this.glowOn) this.updateCrosses();
  }

  /** The town's vane and thermometer show what has been read; the wind's streaks cross the sea. */
  private showInScene(k: ClueId) {
    if (k === 'wind') {
      this.vane.removeChildren().forEach((c) => c.destroy());
      this.vane.addChild(vaneArt(this.case.wind));
      this.streaks?.destroy();
      this.streaks = streaksArt(this.layoutNow, this.case.wind);
      this.streaks.eventMode = 'none';
      this.ctx.stage.addChildAt(this.streaks, this.ctx.stage.getChildIndex(this.scene) + 1);
    }
    if (k === 'temp') {
      this.thermo.removeChildren().forEach((c) => c.destroy());
      this.thermo.addChild(thermoArt(this.case.temp, 50));
    }
  }

  private sayClue(k: ClueId) {
    const c = this.case;
    if (k === 'wind') return this.ctx.say('forecast.wind', { island: ISLAND[c.wind] });
    if (k === 'temp') return this.ctx.say(c.temp === 'freezing' ? 'forecast.freezing' : 'forecast.warm');
    return this.ctx.say('forecast.postcard', { island: ISLAND[k], sky: SKY_WORD[c[k]] });
  }

  // ---- answers ----

  private select(i: number) {
    if (this.dead || this.busy) return;
    this.press(this.cardNodes[i]);
    sfx.pop(7);
    this.selected = this.answers[i];
    this.paintCards();
  }

  private paintCards() {
    this.answers.forEach((a, i) => paintCard(this.cardBacks[i], CARD_W, CARD_H, a === this.selected));
    paintCheck(this.checkFace, CHECK, this.selected !== null);
  }

  private tapCheck() {
    if (this.dead || this.busy) return;
    this.press(this.checkBtn);
    if (this.selected === null) { void this.instruct(); return; }
    const key = `${this.selected}|${[...this.open].sort().join(',')}`;
    // The same Check again repeats its line and counts nothing.
    const seen = this.checks.get(key);
    if (seen) { void this.explain(seen, this.selected); return; }
    const v = check(this.case, this.open, this.selected);
    this.checks.set(key, v);
    if (v.kind === 'right') { void this.reveal(); return; }
    if (v.kind === 'ruled-out' || v.kind === 'overclaim') {
      this.misses++;
      sfx.boing();
    }
    void this.explain(v, this.selected).then(() => {
      if (this.dead || this.busy || this.glowOn || this.misses < 2) return;
      this.glow();
    });
    if (v.kind === 'not-yet') this.bobClosed();
  }

  private explain(v: Verdict, a: Answer): Promise<void> {
    const c = this.case;
    if (v.kind === 'not-yet') return this.ctx.say(a === 'cant-tell' ? 'forecast.notyet.cant' : 'forecast.notyet');
    if (v.kind === 'overclaim') {
      if (a === 'cant-tell') return this.ctx.say('forecast.overclaim.cant');
      const others = [...possible(c, this.open)].filter((w) => w !== a);
      return this.ctx.say('forecast.overclaim', { weather: a, others: listOf(others) });
    }
    if (v.kind === 'ruled-out') {
      const w = a as Weather;
      if (v.by === 'temp') return this.ctx.say(c.temp === 'warm' ? 'forecast.ruledout.warm' : 'forecast.ruledout.freezing');
      if (this.open.includes('wind')) {
        return this.ctx.say('forecast.ruledout.wind', { island: ISLAND[c.wind], sky: SKY_WORD[c[c.wind]], weather: w });
      }
      return this.ctx.say('forecast.ruledout.islands', { a: ISLAND.west, skyA: SKY_WORD[c.west], b: ISLAND.east, skyB: SKY_WORD[c.east], weather: w });
    }
    return Promise.resolve();
  }

  /** Two misses: cross out what the open clues rule out, glow the answer, and bob a clue that would still help. One hint. */
  private glow() {
    this.glowOn = true;
    this.hints++;
    this.updateCrosses();
    const k = usefulClue(this.case, this.open);
    if (k) this.bob(k);
    void this.ctx.say('forecast.glow');
  }

  private updateCrosses() {
    const left = possible(this.case, this.open);
    this.answers.forEach((a, i) => {
      const out = a === 'cant-tell' ? left.size === 1 : !left.has(a);
      if (out) this.crossed.add(a);
      this.crosses[i].visible = this.crossed.has(a);
    });
  }

  private bob(k: ClueId) {
    const n = this.flaps[k].node, y = this.layoutNow.flaps[k].y;
    this.ctx.tw.kill(n);
    n.y = y;
    void this.ctx.tw.to(n, { y: y + 14 }, { duration: 0.18, ease: ease.outQuad }).then(() => {
      if (this.gone) return;
      return this.ctx.tw.to(n, { y }, { duration: 0.3, ease: ease.outBack });
    });
  }

  private bobClosed() {
    for (const k of available(this.case)) if (!this.open.includes(k)) this.bob(k);
  }

  // ---- help ----

  readonly hintLabel = 'Show a hint';

  askForHint() {
    if (this.dead || this.busy) return;
    const k = usefulClue(this.case, this.open);
    if (!k) {
      // Crossing out counts only when it crosses something new; asking again just repeats the line.
      const before = this.crossed.size;
      this.updateCrosses();
      if (this.crossed.size > before) this.hints++;
      void this.ctx.say('forecast.hint.cross');
      return;
    }
    this.hints++;
    const line: LineId = k === 'wind' ? 'forecast.hint.wind' : k === 'temp' ? 'forecast.hint.temp' : 'forecast.hint.postcard';
    this.bob(k);
    this.openFlap(k);
    void this.ctx.say(line, k === 'west' || k === 'east' ? { island: ISLAND[k] } : undefined).then(() => (this.dead ? undefined : this.sayClue(k)));
  }

  restart() {
    if (this.dead) return;
    const go = () => {
      if (this.dead) return;
      if (this.busy) { void this.ctx.tw.wait(0.2).then(go); return; }
      this.open = [];
      this.selected = null;
      for (const k of CLUES) {
        const f = this.flaps[k];
        f.inside.removeChildren(1).forEach((c) => c.destroy({ children: true }));
        if (k !== this.case.missing) { f.cover.visible = true; f.picture.visible = true; }
      }
      this.vane.removeChildren().forEach((c) => c.destroy());
      this.vane.addChild(vaneArt(null));
      this.thermo.removeChildren().forEach((c) => c.destroy());
      this.thermo.addChild(thermoArt(null, 50));
      this.streaks?.destroy();
      this.streaks = null;
      this.crossed.clear();
      if (this.glowOn) this.updateCrosses(); else this.crosses.forEach((x) => { x.visible = false; });
      this.paintCards();
    };
    go();
  }

  // ---- tomorrow ----

  private async reveal() {
    this.busy = true;
    const c = this.case;
    [4, 6, 8, 11].forEach((s, i) => void this.ctx.tw.wait(i * 0.12).then(() => { if (!this.gone) sfx.pluck(s, 0.3); }));
    const answer = this.selected!;
    if (answer === 'cant-tell') {
      await this.ctx.say('forecast.right.cant', { list: listOf([...possible(c, this.open)]) });
    } else {
      await this.ctx.say('forecast.right', { weather: answer });
    }
    if (this.gone) return;
    // Night falls.
    const l = this.layoutNow;
    const night = nightArt(l, this.ctx.view);
    night.alpha = 0;
    this.revealLayer.addChild(night);
    void this.ctx.say('forecast.reveal');
    await this.ctx.tw.to(night, { alpha: 1 }, { duration: 1, ease: ease.inOutSine });
    if (this.gone) return;
    await this.ctx.tw.wait(1);
    if (this.gone) return;
    // Morning: a late postcard arrives first, then the upwind sky slides over on the wind.
    if (c.missing) {
      const f = this.flaps[c.missing];
      f.node.getChildByLabel('missing')?.destroy();
      paintCover(f.cover, FLAP, false);
      f.cover.visible = false;
      f.inside.addChild(clueInside(c.missing, c[c.missing], FLAP * 0.9));
      sfx.chirp();
      if (c.missing === 'wind' || c.missing === 'temp') this.showInScene(c.missing);
    }
    await this.ctx.tw.to(night, { alpha: 0 }, { duration: 0.8, ease: ease.inOutSine });
    if (this.gone) return;
    if (!this.streaks) this.showInScene('wind');
    const weather = tomorrow(c);
    const from = c.wind === 'west' ? l.hill : l.lighthouse;
    const sky = weatherArt(weather, 140);
    sky.position.set(from.x, from.y - 70);
    this.revealLayer.addChild(sky);
    if (weather === 'rainy') [0, 0.4, 0.8, 1.2].forEach((t) => void this.ctx.tw.wait(t).then(() => { if (!this.gone) sfx.pluck(2, 0.08); }));
    if (weather === 'snowy') [0, 0.5, 1].forEach((t, i) => void this.ctx.tw.wait(t).then(() => { if (!this.gone) sfx.bell(12 + i, 0.12); }));
    await this.ctx.tw.to(sky, { x: l.town.x, y: l.town.y - 150 }, { duration: 1.6, ease: ease.inOutSine });
    if (this.gone) return;
    if (weather === 'rainy' || weather === 'snowy') {
      this.ctx.particles.burst(l.town.x, l.town.y - 100, { kind: 'star', colors: weather === 'snowy' ? [0xffffff, 0xcfe8fb] : [swatch.blue.fill, swatch.blue.light], count: 18, speed: [40, 120], gravity: 200, life: [0.6, 1] });
    }
    if (answer === 'cant-tell') await this.ctx.say('forecast.reveal.cant', { weather });
    if (this.gone) return;
    if (!saidReal && !this.ctx.demo) { saidReal = true; await this.ctx.say('forecast.real'); }
    if (this.gone) return;
    this.finished = true;
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  // ---- shell hooks ----

  resize(view: View) {
    const l = this.layoutNow = forecastLayout(view, this.plan.level) ?? this.layoutNow;
    this.backdrop.resize(view);
    const old = this.scene;
    this.scene = sceneArt(l);
    this.scene.eventMode = 'none';
    this.ctx.stage.addChildAt(this.scene, this.ctx.stage.getChildIndex(old));
    old.destroy();
    if (this.streaks) this.showInScene('wind');
    this.vane.position.set(l.town.x, l.town.y - 120);
    this.thermo.position.set(l.town.x + 152, l.town.y);
    this.rule.position.set(l.rule.x, l.rule.y);
    for (const k of CLUES) { this.ctx.tw.kill(this.flaps[k].node); this.flaps[k].node.position.set(l.flaps[k].x, l.flaps[k].y); }
    this.cardNodes.forEach((n, i) => n.position.set(l.cards[i].x, l.cards[i].y));
    this.checkBtn.position.set(l.checkBtn.x, l.checkBtn.y);
  }

  update(dt: number) {
    this.clock += dt;
    this.glowRing.clear();
    if (this.dead || this.busy || !this.glowOn) return;
    const i = this.answers.indexOf(answerOf(this.case));
    const n = this.cardNodes[i];
    const pulse = 6 + 4 * Math.sin(this.clock * 5);
    this.glowRing.roundRect(n.x - CARD_W / 2 - pulse, n.y - CARD_H / 2 - pulse, CARD_W + 2 * pulse, CARD_H + 2 * pulse, 28).stroke({ width: 7, color: swatch.yellow.fill });
  }

  /** Like a detective: the wind, its postcard, the thermometer only when rain is coming (level 2 opens every clue it has). */
  autotouch(): TouchIntent | null {
    if (this.dead || this.busy) return null;
    const c = this.case;
    const order = clueOrder(c).filter((k) => k !== c.missing);
    const wanted: ClueId[] = this.plan.level === 2 ? order : c[c.wind] === 'rain' ? ['wind', c.wind, 'temp'] : ['wind', c.wind];
    const next = wanted.find((k) => !this.open.includes(k));
    if (next) return { tap: { on: this.flaps[next].node }, pause: 1.6 };
    const left = possible(c, this.open);
    const pick: Answer = left.size === 1 ? [...left][0] : 'cant-tell';
    if (this.selected !== pick) return { tap: { on: this.cardNodes[this.answers.indexOf(pick)] }, pause: 0.6 };
    return { tap: { on: this.checkBtn }, pause: 2 };
  }
}

export const forecastDetective: GameModule = {
  id: 'forecast-detective', name: 'Forecast Detective', titleLine: 'game.forecast-detective', region: 'tinker-lab',
  skills: ['weather', 'evidence', 'deduction', 'uncertainty'], bands: ['school'], levels: (b) => rangeFor(LEVELS, b),
  describeLevel: (l) => planFor(l).name,
  music: STYLES.quiet,
  coplayHint: 'One of you is the reporter: open the flaps and say each clue. The other is the forecaster: say which weathers are left, then pick. Swap next round.',
  offScreen: 'Look out of the window together: which way are the trees bending, and what are the clouds doing? Guess tomorrow’s sky, and see tomorrow.',
  hubIcon: () => new WigglyIcon(iconArt()), sticker: (seed) => stickerArt(stickerWeather(seed)), create: (ctx) => new ForecastDetective(ctx),
  touchDemo: true,
};
