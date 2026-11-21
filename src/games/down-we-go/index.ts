import { Container, Graphics, Rectangle } from 'pixi.js';
import { swatch } from '../../art/palette';
import { fishArt, turtleArt } from '../../art/animals';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { dialArt, glowFishArt, iconArt, ledgeArt, lanternArt, plateArt, shellArt, sproutArt } from './art';
import { downLayout, type DownLayout } from './layout';
import {
  LEVELS,
  aboveKnot,
  canGrow,
  compare,
  deepest,
  describeLevel,
  fade,
  halfOf,
  hintKnot,
  lightKind,
  questionsFor,
  roundFor,
  type DialQ,
  type Dive,
} from './logic';

/** Spoken once a session: the first finish's reason, and the glowing fish. */
let whySaid = false;
let cloudySaid = false;
let limitsSaid = false;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
function water(t: number, cloudy = false): number {
  const mix = (s: number, e: number, shift: number) =>
    Math.round(lerp((s >> shift) & 255, (e >> shift) & 255, t));
  const [a, b] = cloudy ? [0xa9c9c0, 0x55657a] : [0x79d0f2, 0x2f3f8f];
  return (mix(a, b, 16) << 16) | (mix(a, b, 8) << 8) | mix(a, b, 0);
}

class DownWeGo implements Game {
  private readonly dives: Dive[];
  private readonly qs: DialQ[] = [];
  private qi = 0;
  private predicted = false;
  private predicting = false;
  private revealed = false;
  private hintSplit = false;
  private glowCard: number | null = null;
  private cards: Container[] = [];
  private plates: Container[] = [];
  private idx = 0;
  private d!: Dive;
  private measured: boolean[] = [];
  private at = 0;
  private ride = false;
  private busy = false;
  private moving = 0;
  private finished = false;
  private misses = 0;
  private hints = 0;
  private wrongs = 0;
  private glowKnot: number | null = null;
  private glowed = false;
  private view: View;
  private L!: DownLayout;
  private readonly kinds = new Set<string>();
  private t = 0;

  private readonly root = new Container();
  private dials: Graphics[] = [];
  private ledges: Container[] = [];
  private knotHits: Container[] = [];
  private lantern!: Container;
  private drag: DragHandle | null = null;
  private sprout: Graphics | null = null;
  private sproutAt = -1;
  private friends: { node: Container; y: number; phase: number }[] = [];
  private glow = new Graphics();

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.dives = ctx.level === 4 ? [] : roundFor(ctx.level, ctx.rng, !!ctx.demo);
    if (ctx.level === 4) this.qs = questionsFor(ctx.rng);
    ctx.stage.addChild(this.root);
  }

  start() {
    this.begin();
  }

  private begin() {
    if (this.ctx.level === 4) return this.beginQuestion();
    this.d = this.dives[this.idx];
    this.predicting = this.ctx.level === 3 && this.idx === 1 && !this.predicted;
    this.measured = this.d.light.map((_, k) => k === 0);
    this.at = 0;
    this.wrongs = 0;
    this.glowKnot = null;
    this.glowed = false;
    this.sprout = null;
    this.sproutAt = -1;
    this.ride = this.ctx.level === 1;
    this.busy = false;
    this.build();
    if (this.predicting) {
      const w = this.d.water;
      void this.ctx.instruct('down.instruct.3b', { water: w });
      return;
    }
    if (this.ctx.level === 3) {
      if (this.idx === 0) void this.ctx.instruct('down.instruct.3a');
    } else if (this.ctx.level === 1) {
      if (this.idx === 0) void this.ctx.instruct('down.instruct.1');
    } else void this.ctx.instruct('down.instruct.2', { need: this.d.need });
  }

  private beginQuestion() {
    const q = this.qs[this.qi];
    this.d = { light: fade('clear'), need: 1, water: 'clear' };
    this.measured = this.d.light.map(() => true);
    this.at = 0;
    this.wrongs = 0;
    this.glowed = false;
    this.glowCard = null;
    this.hintSplit = false;
    this.revealed = false;
    this.busy = false;
    this.build();
    this.lantern.y = this.L.knots[Math.max(0, aboveKnot(q))].y;
    if (this.qi === 0) void this.ctx.instruct('down.instruct.4');
  }

  // Building -----------------------------------------------------------------------------

  private build() {
    this.drag?.destroy();
    this.drag = null;
    this.root.removeChildren().forEach((c) => c.destroy({ children: true }));
    const L = (this.L = downLayout(this.view, this.d.light.length)!);
    const v = this.view;
    const n = this.d.light.length;
    const cloudy = this.d.water === 'cloudy';
    const sea = new Graphics();
    sea.rect(0, 0, v.w, L.seaTop).fill(0xcdeeff);
    for (let k = 0; k < n; k++)
      sea.rect(0, L.seaTop + k * L.band, v.w, L.band + 1).fill(water(n === 1 ? 0 : k / (n - 1), cloudy));
    sea.rect(0, L.seaTop + n * L.band, v.w, v.h).fill(water(1, cloudy));
    sea.rect(L.wallX, L.seaTop, v.w - L.wallX, v.h).fill(0x6e5a66);
    sea
      .moveTo(L.ropeX, L.boat.y + 30)
      .lineTo(L.ropeX, L.knots[n - 1].y + 40)
      .stroke({ width: 6, color: 0xf3e6c8 });
    L.knots.forEach((p) => sea.circle(p.x, p.y, 12).fill(0xf3e6c8).stroke({ width: 3, color: 0xb59a6a }));
    // The boat on the calm top, and the need card beside it.
    sea
      .poly([
        L.boat.x - 80,
        L.boat.y,
        L.boat.x + 80,
        L.boat.y,
        L.boat.x + 56,
        L.boat.y + 34,
        L.boat.x - 56,
        L.boat.y + 34,
      ])
      .fill(swatch.red.fill)
      .stroke({ width: 4, color: swatch.red.line })
      .poly([L.boat.x - 6, L.boat.y - 8, L.boat.x - 6, L.boat.y - 70, L.boat.x + 44, L.boat.y - 8])
      .fill(0xffffff)
      .stroke({ width: 3, color: swatch.blue.line });
    if (cloudy)
      for (let i = 0; i < 40; i++)
        sea
          .circle(((i * 197) % v.w) | 0, L.seaTop + ((i * 83) % (n * L.band)), 3 + (i % 3))
          .fill({ color: 0xe8e0c8, alpha: 0.5 });
    this.root.addChild(sea);
    const card = new Container();
    card.addChild(
      new Graphics()
        .roundRect(-110, -56, 220, 112, 22)
        .fill(0xffffff)
        .stroke({ width: 4, color: swatch.teal.line }),
    );
    const cs = sproutArt();
    cs.position.set(-60, 34);
    cs.scale.set(0.8);
    const cd = dialArt(this.d.need, 44);
    cd.position.set(40, 0);
    for (const c of cd.children) if (c.alpha !== undefined) c.alpha = 1;
    card.addChild(cs, cd);
    card.position.set(L.needCard.x, L.needCard.y);
    card.eventMode = 'none';
    if (this.ctx.level !== 4) this.root.addChild(card);
    else card.destroy({ children: true });

    // Friends: a fish near the top, a turtle in the middle, a small fish that glows by itself at the darkest knot.
    this.friends = [];
    const mk = (node: Container, k: number, dx: number) => {
      node.position.set(L.ropeX + dx, L.knots[k].y);
      node.eventMode = 'none';
      this.root.addChild(node);
      this.friends.push({ node, y: L.knots[k].y, phase: k * 1.7 });
    };
    const fish = fishArt(swatch.orange);
    fish.scale.set(0.8);
    mk(fish, 0, 130);
    if (n >= 4) mk(turtleArt(60), 1, 140);
    mk(glowFishArt(), n - 1, 120);

    // Dials, then ledges, knot hit areas and the lantern.
    this.dials = L.dials.map((p) => {
      const g = new Graphics();
      g.position.set(p.x, p.y);
      g.eventMode = 'none';
      this.root.addChild(g);
      return g;
    });
    this.ledges = (this.ctx.level === 4 ? [] : L.ledges).map((p, k) => {
      const c = new Container();
      c.position.set(p.x, p.y);
      c.hitArea = new Rectangle(-L.ledge.w / 2, -L.ledge.h / 2, L.ledge.w, L.ledge.h);
      onTap(c, () => void this.onLedge(k), { cooldown: 250 });
      this.root.addChild(c);
      return c;
    });
    this.knotHits = (this.ctx.level === 4 ? [] : L.knots).map((p, k) => {
      const c = new Container();
      c.position.set(p.x, p.y);
      c.addChild(new Graphics().rect(-60, -L.band / 2, 120, L.band).fill({ color: 0xffffff, alpha: 0.001 }));
      c.hitArea = new Rectangle(-60, -L.band / 2, 120, L.band);
      onTap(c, () => void this.moveTo(k), { cooldown: 200 });
      this.root.addChild(c);
      return c;
    });
    this.lantern = lanternArt();
    this.lantern.position.set(L.ropeX, L.knots[this.at].y);
    this.glow = new Graphics();
    this.root.addChild(this.glow, this.lantern);
    if (this.ctx.level !== 4)
      this.drag = draggable(this.lantern, this.ctx.tw, {
        lift: 0,
        keepGrab: true,
        onMove: (_x, y) => {
          this.lantern.x = L.ropeX;
          this.lantern.y = Math.max(L.knots[0].y, Math.min(L.knots[n - 1].y, y));
          this.reach(this.nearest(this.lantern.y), false);
        },
        onDrop: (_x, y) => {
          void this.moveTo(this.nearest(y));
          return true;
        },
      });
    if (this.drag) this.drag.home = { x: L.ropeX, y: L.knots[this.at].y };
    if (this.sproutAt >= 0) this.plant(this.sproutAt, false);
    this.drawDials();
    this.drawLedges();
    this.buildExtras();
  }

  /** Level 3's logbook, answer plates; level 4's dial cards. */
  private buildExtras() {
    const L = this.L;
    const lvl = this.ctx.level;
    this.plates = [];
    this.cards = [];
    if (lvl === 3 && this.idx === 1) {
      L.logbook.forEach((p, k) => {
        const g = dialArt(this.dives[0].light[k], L.logR);
        g.position.set(p.x, p.y);
        g.eventMode = 'none';
        this.root.addChild(g);
      });
    }
    if (this.predicting) {
      for (const k of this.ledges) k.visible = false;
      for (const k of this.knotHits) k.visible = false;
      this.lantern.visible = false;
      for (const g of this.dials) g.visible = false;
      ([true, false] as const).forEach((deeper, i) => {
        const c = plateArt(deeper, L.plate.w, L.plate.h);
        c.position.set(L.plates[i].x, L.plates[i].y);
        c.hitArea = new Rectangle(-L.plate.w / 2, -L.plate.h / 2, L.plate.w, L.plate.h);
        onTap(c, () => void this.onPlate(deeper), { cooldown: 250 });
        this.root.addChild(c);
        this.plates.push(c);
      });
    }
    if (lvl === 4) {
      const q = this.qs[this.qi];
      this.cards = q.options.map((opt, i) => {
        const c = new Container();
        c.addChild(
          new Graphics()
            .roundRect(-L.card.w / 2, -L.card.h / 2, L.card.w, L.card.h, 22)
            .fill(0x35508f)
            .stroke({ width: 4, color: swatch.teal.line }),
          dialArt(opt, 52),
        );
        c.position.set(L.cards[i].x, L.cards[i].y);
        c.hitArea = new Rectangle(-L.card.w / 2, -L.card.h / 2, L.card.w, L.card.h);
        onTap(c, () => void this.onCard(i), { cooldown: 250 });
        this.root.addChild(c);
        return c;
      });
    }
  }

  private nearest(y: number): number {
    let best = 0;
    this.L.knots.forEach((p, k) => {
      if (Math.abs(p.y - y) < Math.abs(this.L.knots[best].y - y)) best = k;
    });
    return best;
  }

  private drawDials() {
    this.dials.forEach((g, k) => {
      g.removeChildren().forEach((c) => c.destroy());
      if (this.ctx.level === 4) {
        const q = this.qs[this.qi];
        const val = q.shown[k];
        if (val === undefined) return;
        if (val === null && !this.revealed) return void g.addChild(shellArt(this.L.dialR));
        g.addChild(dialArt(val ?? q.answer, this.L.dialR));
        if (this.hintSplit && k === aboveKnot(q))
          g.addChild(
            new Graphics()
              .moveTo(0, -this.L.dialR)
              .lineTo(0, this.L.dialR)
              .stroke({ width: 5, color: swatch.blue.line }),
          );
        return;
      }
      g.addChild(dialArt(this.measured[k] ? this.d.light[k] : 0, this.L.dialR, !this.measured[k]));
    });
  }

  private drawLedges() {
    this.ledges.forEach((c, k) => {
      c.removeChildren().forEach((x) => x.destroy());
      const lit = !this.ride || this.measured[k];
      const g = ledgeArt(this.L.ledge.w, this.L.ledge.h, lit);
      c.addChild(g);
      c.alpha = this.ride ? 0.7 : 1;
    });
  }

  private plant(k: number, droop: boolean): Graphics {
    this.sprout?.destroy();
    const s = sproutArt(droop);
    const p = this.L.ledges[k];
    s.position.set(p.x, p.y - this.L.ledge.h / 2 + 30);
    s.eventMode = 'none';
    this.root.addChild(s);
    this.sprout = s;
    this.sproutAt = k;
    return s;
  }

  // Play ---------------------------------------------------------------------------------

  /** The lantern reaches a knot: its dial opens and stays open for the rest of the dive. */
  private reach(k: number, tone = true) {
    if (this.measured[k]) return;
    this.measured[k] = true;
    if (tone) sfx.pop(9 - k);
    this.drawDials();
    const kind = lightKind(this.d.light[k]);
    if (!this.kinds.has(kind)) {
      this.kinds.add(kind);
      void this.ctx.say(`down.knot.${kind}` as 'down.knot.lots').then(() => {
        if (kind === 'none' && this.ctx.alive) return this.ctx.say('down.glow');
      });
    }
    if (this.ride && this.measured.every(Boolean)) {
      this.ride = false;
      this.drawLedges();
      sfx.sparkle();
    }
  }

  private async moveTo(k: number) {
    if (this.finished) return;
    this.at = k;
    this.moving++;
    this.drag && (this.drag.home = { x: this.L.ropeX, y: this.L.knots[k].y });
    await this.ctx.tw.to(
      this.lantern,
      { x: this.L.ropeX, y: this.L.knots[k].y },
      { duration: 0.35, ease: ease.outBack },
    );
    this.moving--;
    if (!this.ctx.alive || this.lantern.destroyed) return;
    this.reach(k);
  }

  private async onLedge(k: number) {
    if (this.busy || this.finished) return;
    if (this.ride) {
      sfx.boing();
      return void this.ctx.say('down.ride');
    }
    const was = this.measured[k];
    this.busy = true;
    if (!was) await this.moveTo(k);
    if (!this.ctx.alive) return;
    const d = this.d;
    if (canGrow(d, k)) {
      const s = this.plant(k, false);
      sfx.tada();
      this.glowKnot = null;
      void this.ctx.tw.to(s.scale, { x: 1.25, y: 1.25 }, { duration: 0.15, ease: ease.outBack }).then(() => {
        if (this.ctx.alive && !s.destroyed) void this.ctx.tw.to(s.scale, { x: 1, y: 1 }, { duration: 0.2 });
      });
      if (k === deepest(d)) {
        await this.ctx.say('down.rooted');
        return void this.nextDive();
      }
      await this.ctx.say('down.deeper');
      if (this.ctx.alive) this.busy = false;
      return;
    }
    // Too dark: the sprout droops and floats back to the boat. Counted only when the ledge's open dial already showed it.
    const s = this.plant(k, true);
    this.sprout = null;
    this.sproutAt = -1;
    sfx.boing();
    if (was) {
      this.misses++;
      this.wrongs++;
    }
    void this.ctx.tw
      .to(s, { x: this.L.boat.x, y: this.L.boat.y, alpha: 0 }, { duration: 0.8, ease: ease.inOutSine })
      .then(() => s.destroy());
    await this.ctx.say(was ? 'down.wrong' : 'down.unmeasured', { n: d.light[k], need: d.need });
    if (!this.ctx.alive) return;
    if (this.wrongs >= 2 && !this.glowed) {
      this.glowed = true;
      this.hints++;
      this.glowKnot = hintKnot(d);
    }
    this.busy = false;
  }

  /** Level 3: the free guess about the second cove, then the answer. */
  private async onPlate(deeper: boolean) {
    if (this.busy || !this.predicting) return;
    this.busy = true;
    sfx.pop(5);
    const truth = compare(this.dives[0], this.dives[1]) === 'deeper';
    const cl = this.d.water === 'cloudy';
    await this.ctx.say(
      deeper === truth
        ? cl
          ? 'down.predict.rightCloudy'
          : 'down.predict.rightClear'
        : cl
          ? 'down.predict.otherCloudy'
          : 'down.predict.otherClear',
    );
    if (!this.ctx.alive) return;
    if (cl && !cloudySaid) {
      cloudySaid = true;
      await this.ctx.say('down.cloudy');
      if (!this.ctx.alive) return;
    }
    this.predicted = true;
    this.begin();
  }

  /** Level 4: a dial card. The first question never counts; from the second a wrong card is one miss. */
  private async onCard(i: number) {
    if (this.busy || this.finished) return;
    const q = this.qs[this.qi];
    const opt = q.options[i];
    this.busy = true;
    if (opt !== q.answer) {
      sfx.boing();
      const above = q.shown[aboveKnot(q)] as number;
      if (this.qi > 0) {
        this.misses++;
        this.wrongs++;
      }
      this.hintSplit = true;
      this.drawDials();
      await this.ctx.say('down.hint.4', { n: above, half: halfOf(above) });
      if (!this.ctx.alive) return;
      if (this.wrongs >= 2 && !this.glowed) {
        this.glowed = true;
        this.hints++;
        this.glowCard = q.options.indexOf(q.answer);
      }
      this.busy = false;
      return;
    }
    sfx.tada();
    this.glowCard = null;
    this.revealed = true;
    this.drawDials();
    await this.ctx.tw.to(this.lantern, { y: this.L.knots[q.at].y }, { duration: 0.5, ease: ease.outBack });
    if (!this.ctx.alive) return;
    await this.ctx.say('down.dial.right');
    if (!this.ctx.alive) return;
    await this.ctx.tw.wait(0.4);
    if (!this.ctx.alive) return;
    this.qi++;
    if (this.qi < this.qs.length) return void this.beginQuestion();
    this.finished = true;
    if (!limitsSaid) {
      limitsSaid = true;
      await this.ctx.say('down.limits');
      if (!this.ctx.alive) return;
    }
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  private async nextDive() {
    await this.ctx.tw.wait(0.5);
    if (!this.ctx.alive) return;
    this.idx++;
    if (this.idx < this.dives.length) return void this.begin();
    this.finished = true;
    await this.ctx.tw.to(this.lantern, { y: this.L.knots[0].y }, { duration: 0.7 });
    if (!this.ctx.alive) return;
    if (!whySaid) {
      whySaid = true;
      await this.ctx.say('down.why');
      if (!this.ctx.alive) return;
    }
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  /** The pause sheet's "show a hint": the lantern goes to the deepest ledge's knot and its ledge glows. Counted once a press. */
  askForHint() {
    if (this.finished || this.busy || this.predicting) return;
    if (this.ctx.level === 4) {
      const q = this.qs[this.qi];
      const above = q.shown[aboveKnot(q)] as number;
      this.hints++;
      this.hintSplit = true;
      this.drawDials();
      void this.ctx.say('down.hint.4', { n: above, half: halfOf(above) });
      return;
    }
    this.hints++;
    this.glowKnot = hintKnot(this.d);
    this.ride = false;
    this.drawLedges();
    void this.moveTo(this.glowKnot);
    void this.ctx.say('down.hint');
  }

  /** The pause sheet's "start again": the same dive, lantern at the top, dials shut; misses and hints keep counting. */
  restart() {
    if (!this.finished) this.begin();
  }

  update(dt: number) {
    this.t += dt;
    if (this.sprout && !this.sprout.destroyed) this.sprout.rotation = Math.sin(this.t * 2) * 0.06;
    for (const f of this.friends) f.node.y = f.y + Math.sin(this.t * 1.5 + f.phase) * 8;
    const g = this.glow.clear();
    if (this.glowCard !== null && !this.finished) {
      const p = this.L.cards[this.glowCard];
      g.roundRect(p.x - 80, p.y - 80, 160, 160, 24).stroke({
        width: 7 + Math.sin(this.t * 5) * 2,
        color: swatch.yellow.line,
      });
    }
    if (this.glowKnot !== null && !this.finished && this.ctx.level !== 4) {
      const p = this.L.ledges[this.glowKnot];
      g.roundRect(p.x - 95, p.y - 60, 190, 120, 24).stroke({
        width: 7 + Math.sin(this.t * 5) * 2,
        color: swatch.yellow.line,
      });
    }
  }

  resize(v: View) {
    this.view = v;
    if (this.d) this.build();
  }

  destroy() {
    this.drag?.destroy();
  }

  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.moving) return null;
    if (this.predicting) {
      const deeper = compare(this.dives[0], this.dives[1]) === 'deeper';
      return { tap: { on: this.plates[deeper ? 0 : 1] }, pause: 0.8 };
    }
    if (this.ctx.level === 4) {
      const q = this.qs[this.qi];
      return { tap: { on: this.cards[q.options.indexOf(q.answer)] }, pause: 0.8 };
    }
    const d = this.d;
    for (let k = 0; k < d.light.length; k++) {
      if (!this.measured[k]) return { tap: { on: this.knotHits[k] }, pause: 0.5 };
      if (!this.ride && !canGrow(d, k)) break;
    }
    return { tap: { on: this.ledges[deepest(d)] }, pause: 0.8 };
  }
}

export const game: GameModule = {
  id: 'down-we-go',
  name: 'Down We Go',
  titleLine: 'game.down-we-go',
  region: 'tinker-lab',
  challenge: 'noticing',
  skills: ['ocean', 'light', 'measuring', 'evidence'],
  bands: ['prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel,
  music: STYLES.bubbles,
  coplayHint:
    'One of you is the diver who moves the lantern and counts the petals aloud; the other says "deeper" or "stop" and plants. Swap each dive.',
  offScreen:
    'Shine a torch through one sheet of paper, then two, then three. How many sheets before you cannot see the light?',
  hubIcon: () => new WigglyIcon(iconArt()),
  touchDemo: true,
  sticker: () => iconArt(),
  create: (ctx) => new DownWeGo(ctx),
};
