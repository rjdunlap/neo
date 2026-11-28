import { Container, Graphics } from 'pixi.js';
import { ink, swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { isParentPanelOpen } from '../../parent/panel';
import { rangeFor } from '../../progress/difficulty';
import { RoundButton } from '../../ui/buttons';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { bannerArt, shapeArt, townArt } from './art';
import { marketLayout, townSpot, type MarketLayout } from './layout';
import {
  EMPTY,
  LEVELS,
  clashes,
  deadEnd,
  describeLevel,
  hintFor,
  inConflict,
  isDone,
  makeRound,
  neighbourPairs,
  solve,
  tooManyDays,
  townToward,
  triangles,
  type HintKind,
  type MarketRound,
} from './logic';

/** Hint (a lamp), Undo (an arrow back), Restart (a ring) and Why (a question mark). */
const hintIcon = () => {
  const g = new Graphics()
    .circle(0, -8, 20)
    .fill(swatch.yellow.fill)
    .stroke({ width: 4, color: swatch.yellow.line })
    .roundRect(-11, 12, 22, 14, 4)
    .fill(0xc9ccd6)
    .stroke({ width: 3, color: 0x8c8c9c });
  return g;
};
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

class MarketDays implements Game {
  private readonly round: MarketRound;
  private assign: number[];
  private readonly history: number[][] = [];
  private selected = 0;
  /** The town the key ring is on; null until a key is pressed, so touch play shows no ring. */
  private focus: number | null = null;
  private misses = 0;
  private hints = 0;
  private wrongs = 0;
  private busy = true;
  private finished = false;
  private view: View;
  private L: MarketLayout;
  /** A town the hint is glowing, and the town whose banner a second request places. */
  private glowTown: number | null = null;
  private glowSet: number[] = [];
  private shaking = new Map<number, number>();
  private flutter = 0;
  private time = 0;

  private readonly paths = new Graphics();
  private readonly glow = new Graphics();
  private readonly townLayer = new Container();
  private readonly trayLayer = new Container();
  private readonly towns: Container[] = [];
  private readonly banners: Container[] = [];
  private readonly rings: Graphics[] = [];
  private readonly buttons: RoundButton[] = [];
  private readonly hintBtn: RoundButton;
  private readonly whyBtn: RoundButton | null;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.round = makeRound(ctx.level, ctx.rng);
    this.assign = [...this.round.start];
    this.L = marketLayout(ctx.view, this.round.plan.offered);
    this.paths.eventMode = this.glow.eventMode = 'none';
    ctx.stage.addChild(this.paths, this.glow, this.townLayer, this.trayLayer);
    this.round.map.towns.forEach((_, i) => {
      const c = new Container();
      c.hitArea = undefined;
      onTap(c, () => this.tapTown(i), { radius: this.L.town / 2 + 8, cooldown: 120 });
      this.towns.push(c);
      this.townLayer.addChild(c);
    });
    for (let b = 0; b < this.round.plan.offered; b++) {
      const c = new Container();
      c.addChild(bannerArt(this.round.looks[b], this.L.banner));
      const ring = new Graphics();
      c.addChildAt(ring, 0);
      this.rings.push(ring);
      onTap(c, () => this.select(b), { radius: this.L.banner / 2 + 12, cooldown: 90 });
      this.banners.push(c);
      this.trayLayer.addChild(c);
    }
    const r = this.L.button / 2;
    this.hintBtn = new RoundButton(hintIcon(), swatch.white, r, () => this.askHint());
    const undo = new RoundButton(undoIcon(), swatch.white, r, () => this.undo());
    const restart = new RoundButton(restartIcon(), swatch.white, r, () => this.restart());
    this.whyBtn =
      ctx.level >= 3 ? new RoundButton(label('?', 54, ink), swatch.white, r, () => void this.why()) : null;
    this.buttons.push(this.hintBtn, undo, restart);
    if (this.whyBtn) this.buttons.push(this.whyBtn);
    this.buttons.forEach((b) => ctx.stage.addChild(b));
    this.resize(ctx.view);
  }

  private look(b: number) {
    return this.round.looks[b];
  }

  start() {
    this.busy = false;
    if (!this.ctx.demo) this.ctx.listen(window, 'keydown', this.onKey);
    this.resize(this.view);
    void this.ctx.instruct('market-days.start');
  }

  resize(view: View) {
    this.view = view;
    const L = (this.L = marketLayout(view, this.round.plan.offered));
    this.round.map.towns.forEach((t, i) => this.towns[i].position.set(townSpot(L, t).x, townSpot(L, t).y));
    this.banners.forEach((c, i) => c.position.set(L.tray[i].x, L.tray[i].y));
    this.buttons.forEach((b, i) => b.position.set(L.buttons[i].x, L.buttons[i].y));
    this.paint();
  }

  private paint() {
    const L = this.L;
    this.towns.forEach((c, i) => {
      c.removeChildren().forEach((k) => k.destroy({ children: true }));
      const b = this.assign[i];
      c.addChild(townArt(L.town, b === EMPTY ? null : this.look(b), this.round.start[i] !== EMPTY));
    });
    this.rings.forEach((g, b) => {
      g.clear();
      if (b === this.selected)
        g.roundRect(-L.banner / 2 - 10, -L.banner / 2 - 10, L.banner + 20, L.banner + 20, 22).stroke({
          width: 7,
          color: ink,
        });
    });
    this.banners.forEach((c, b) => {
      c.scale.set(b === this.selected ? 1.12 : 1);
    });
  }

  /** The dotted paths, wobbling red where two joined towns share a day, and the hint's glow. */
  update(dt: number) {
    this.time += dt;
    const L = this.L;
    const map = this.round.map;
    const g = this.paths.clear();
    const bad = new Set(clashes(map, this.assign).map(([a, b]) => `${a}-${b}`));
    for (const [a, b] of neighbourPairs(map)) {
      const pa = townSpot(L, map.towns[a]);
      const pb = townSpot(L, map.towns[b]);
      const isBad = bad.has(`${a}-${b}`);
      const dx = pb.x - pa.x;
      const dy = pb.y - pa.y;
      const len = Math.hypot(dx, dy);
      const steps = Math.floor(len / 18);
      const wob = isBad ? Math.sin(this.time * 14) * 3 : 0;
      for (let k = 0; k < steps; k += 2) {
        const t0 = k / steps;
        const t1 = Math.min(1, (k + 1) / steps);
        g.moveTo(pa.x + dx * t0 - (dy / len) * wob, pa.y + dy * t0 + (dx / len) * wob)
          .lineTo(pa.x + dx * t1 - (dy / len) * wob, pa.y + dy * t1 + (dx / len) * wob)
          .stroke({ width: isBad ? 9 : 6, color: isBad ? swatch.red.fill : 0xb9a47a, cap: 'round' });
      }
    }
    // A town that just clashed shakes once.
    for (const [i, left] of this.shaking) {
      const nl = left - dt;
      const c = this.towns[i];
      const base = townSpot(L, map.towns[i]);
      if (nl <= 0) {
        this.shaking.delete(i);
        c.position.set(base.x, base.y);
      } else {
        this.shaking.set(i, nl);
        c.position.set(base.x + Math.sin(nl * 60) * 7 * (nl / 0.4), base.y);
      }
    }
    if (this.flutter > 0) {
      this.flutter -= dt;
      this.towns.forEach((c, i) => c.scale.set(1 + Math.sin(this.time * 12 + i) * 0.06));
    }
    const glow = this.glow.clear();
    const pulse = 4 + Math.sin(this.time * 6) * 3;
    const lit = this.glowTown !== null ? [this.glowTown] : this.glowSet;
    for (const t of lit) {
      const p = townSpot(L, map.towns[t]);
      glow.circle(p.x, p.y, L.town / 2 + 12 + pulse).stroke({ width: 8, color: swatch.yellow.line });
    }
    if (this.focus !== null && !this.finished) {
      const p = townSpot(L, map.towns[this.focus]);
      glow.circle(p.x, p.y, L.town / 2 + 8).stroke({ width: 7, color: ink });
    }
    if (this.wrongs >= 2 && !this.finished) {
      const p = L.buttons[0];
      glow.circle(p.x, p.y, L.button / 2 + 10 + pulse).stroke({ width: 7, color: swatch.yellow.line });
    }
  }

  /** Arrow keys move a ring over the towns, 1 to 4 pick a banner, Enter or Space gives the ringed town the picked day. */
  private onKey = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.repeat || this.busy || this.finished || isParentPanelOpen())
      return;
    if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select, [contenteditable]'))
      return;
    const arrow = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].indexOf(e.key);
    const digit = Number(e.key);
    if (arrow >= 0) {
      e.preventDefault();
      // The first arrow only shows the ring, on the first town she can still change.
      if (this.focus === null) this.focus = Math.max(0, this.round.start.indexOf(EMPTY));
      else this.focus = townToward(this.round.map, this.focus, arrow) ?? this.focus;
      sfx.tick();
    } else if (digit >= 1 && digit <= this.round.plan.offered) {
      e.preventDefault();
      this.select(digit - 1);
    } else if ((e.key === 'Enter' || e.key === ' ') && this.focus !== null) {
      e.preventDefault();
      this.tapTown(this.focus);
    }
  };

  private select(b: number) {
    if (this.busy || this.finished) return;
    sfx.pop(5 + b);
    this.selected = b;
    this.paint();
  }

  private snapshot() {
    this.history.push([...this.assign]);
  }

  private tapTown(i: number) {
    if (this.busy || this.finished) return;
    if (this.round.start[i] !== EMPTY) {
      // A town that began set stays as it is.
      sfx.tick();
      this.shaking.set(i, 0.25);
      return;
    }
    this.glowTown = null;
    this.glowSet = [];
    this.snapshot();
    if (this.assign[i] === this.selected) {
      this.assign[i] = EMPTY;
      sfx.tick();
      this.paint();
      return;
    }
    this.assign[i] = this.selected;
    this.paint();
    void this.afterPlace(i);
  }

  private async afterPlace(i: number) {
    const map = this.round.map;
    const plan = this.round.plan;
    const mine = inConflict(map, this.assign);
    const created = clashes(map, this.assign).some(([a, b]) => a === i || b === i);
    if (created) {
      this.misses++;
      this.wrongs++;
      sfx.boing();
      mine.forEach((t) => this.shaking.set(t, 0.4));
      await this.ctx.say('market-days.clash');
      return;
    }
    sfx.pop(7);
    if (isDone(map, plan, this.assign)) return this.complete();
    if (tooManyDays(map, plan, this.assign)) {
      void this.ctx.say('market-days.fewer');
      return;
    }
    const stuck = deadEnd(map, plan, this.assign);
    if (stuck !== null) {
      this.glowSet = [stuck];
      void this.ctx.say('market-days.deadEnd');
    }
  }

  private undo() {
    if (this.busy || this.finished) return;
    const prev = this.history.pop();
    if (!prev) return;
    this.assign = prev;
    this.glowTown = null;
    this.glowSet = [];
    this.paint();
  }

  restart() {
    if (this.busy || this.finished) return;
    this.assign = [...this.round.start];
    this.history.length = 0;
    this.glowTown = null;
    this.glowSet = [];
    this.paint();
  }

  private place(town: number, banner: number) {
    this.snapshot();
    this.assign[town] = banner;
    this.selected = banner;
    this.glowTown = null;
    this.glowSet = [];
    sfx.pop(7);
    this.paint();
    if (isDone(this.round.map, this.round.plan, this.assign)) this.complete();
  }

  /** Hint: first the town glows, and a second request on the same town places its day. Either way it is a hint. */
  private askHint() {
    if (this.busy || this.finished) return;
    const h: HintKind | null = hintFor(this.round.map, this.round.plan, this.assign);
    if (!h) return;
    this.hints++;
    if (h.kind === 'fewer') {
      this.glowTown = null;
      this.glowSet = h.towns;
      void this.ctx.say('market-days.fewer');
    } else if (h.kind === 'stuck') {
      this.glowTown = null;
      this.glowSet = h.town === null ? [] : [h.town];
      void this.ctx.say('market-days.deadEnd');
    } else if (this.glowTown === h.town) {
      this.place(h.town, h.banner);
    } else {
      this.glowSet = [];
      this.glowTown = h.town;
      void this.ctx.say(h.kind === 'forced' ? 'market-days.forced' : 'market-days.hint');
    }
  }

  /** Level 3's Why?: three towns that are all a day apart need three days. It explains and never places or counts. */
  private async why() {
    if (this.busy || this.finished) return;
    const tri = triangles(this.round.map)[0];
    this.glowTown = null;
    this.glowSet = [...tri];
    await this.ctx.say('market-days.why');
  }

  private complete() {
    this.finished = true;
    this.glowTown = null;
    this.glowSet = [];
    this.flutter = 1.4;
    sfx.tada();
    void this.ctx.say('market-days.done');
    void this.ctx.tw.wait(1.4).then(() => {
      if (!this.ctx.alive) return;
      this.ctx.finish({ misses: this.misses, hints: this.hints });
    });
  }

  /** The ghost finger: pick the banner the solver needs, then tap the town; the unique finish decides every town. */
  /** Guided first play points at the bot's next move: `autotouch` here only reads the board. */
  showMove(): TouchIntent | null {
    return this.autotouch();
  }

  autotouch(): TouchIntent | null {
    if (this.busy || this.finished) return null;
    const answer = solve(this.round.map, this.round.plan.target, this.assign, 1)[0];
    if (!answer) return null;
    const t = this.assign.findIndex((v, i) => v === EMPTY && answer[i] !== EMPTY);
    if (t < 0) return null;
    if (this.selected !== answer[t]) return { tap: { on: this.banners[answer[t]] }, pause: 0.25 };
    return { tap: { on: this.towns[t] }, pause: 0.35 };
  }

  destroy() {
    this.shaking.clear();
    this.ctx.stage.removeChild(this.paths, this.glow, this.townLayer, this.trayLayer);
    [this.paths, this.glow, this.townLayer, this.trayLayer, ...this.buttons].forEach((o) =>
      o.destroy({ children: true }),
    );
  }
}

const picture = () => {
  const c = new Container();
  c.addChild(
    new Graphics().roundRect(-8, -42, 10, 90, 4).fill(0x8f6142),
    new Graphics()
      .poly([2, -42, 46, -28, 2, -14])
      .fill(swatch.orange.fill)
      .stroke({ width: 4, color: swatch.orange.line }),
  );
  const s = shapeArt(1, 9, 0xffffff, swatch.orange.line);
  s.position.set(18, -28);
  c.addChild(s);
  return c;
};

export const game: GameModule = {
  id: 'market-days',
  name: 'Market Days',
  titleLine: 'market-days.title',
  region: 'tinker-lab',
  challenge: 'logic',
  skills: ['constraint reasoning', 'planning'],
  bands: ['school', 'grownup'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel,
  music: STYLES.quiet,
  coplayHint: 'Take turns: one gives a town its day, the other says whether any joined town clashes.',
  offScreen:
    'Draw six dots on a page, join the near ones with lines, and colour the dots with three pencils so no joined pair matches.',
  ownKeys: true,
  hubIcon: () => new WigglyIcon(picture()),
  touchDemo: true,
  upright: true,
  sticker: () => picture(),
  create: (ctx) => new MarketDays(ctx),
};
