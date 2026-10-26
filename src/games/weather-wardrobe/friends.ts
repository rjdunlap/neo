import { Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { grass, swatch } from '../../art/palette';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { spread, type View } from '../../engine/view';
import { tile } from '../shared';
import type { Game, GameContext, TouchIntent } from '../types';
import { clothing, itemIcon } from './art';
import { friendFor, ITEMS, ITEM_WORDS, itemToTap, outfits, SLOTS, wardrobePlan, type Item, type Weather } from './logic';

interface Friend {
  node: Container;
  critter: Critter;
  weather: Weather;
  worn: Map<Item, Container>;
}
interface Choice {
  item: Item;
  node: Container;
  handle: DragHandle;
  used: boolean;
}

/** Level 10: two upright friends can wear the full wardrobe, regardless of the guide's species. */
export class WeatherFriends implements Game {
  readonly plan = wardrobePlan(10);
  readonly rounds;
  readonly friends: Friend[] = [];
  readonly options: Choice[] = [];
  q = 0;
  wrong = 0;
  misses = 0;
  hints = 0;
  busy = false;
  done = false;
  private destroyed = false;
  private cancelled = false;
  private view: View;
  private clock = 0;
  private readonly background = new Graphics();
  private readonly glow = new Graphics();
  // drag.ts returns a released object on pointercancel too; cancellation is always free here.
  private readonly cancel = () => {
    this.cancelled = true;
    queueMicrotask(() => { this.cancelled = false; });
  };

  constructor(private readonly ctx: GameContext, private readonly icon: (w: Weather, size?: number) => Graphics) {
    this.view = ctx.view;
    this.rounds = outfits(this.plan, ctx.rng);
    this.background.eventMode = this.glow.eventMode = 'none';
    ctx.stage.addChild(this.background, this.glow);
    window.addEventListener('pointercancel', this.cancel, true);
  }

  start() { this.ask(); }

  private get outfit() { return this.rounds[this.q]; }

  private instruct() {
    void this.ctx.instruct('weather.friends', { a: this.outfit.weathers[0], b: this.outfit.weathers[1] });
  }

  private clear() {
    for (const o of this.options) { o.handle.destroy(); o.node.destroy({ children: true }); }
    this.options.length = 0;
    for (const f of this.friends) f.node.destroy({ children: true });
    this.friends.length = 0;
  }

  private ask() {
    this.clear();
    this.wrong = 0;
    this.busy = false;
    this.outfit.weathers.forEach((weather, i) => {
      const node = new Container();
      const card = new Graphics().roundRect(-170, -380, 340, 400, 32)
        .fill(weather === 'snowy' ? swatch.white.light : swatch.blue.light)
        .stroke({ width: 5, color: swatch.blue.line });
      card.roundRect(-166, -65, 332, 80, 24).fill(weather === 'snowy' ? swatch.white.fill : grass);
      if (weather === 'rainy') card.ellipse(0, -12, 105, 18).fill(swatch.blue.fill);
      if (weather === 'snowy') for (const x of [-120, -65, 65, 120]) card.circle(x, -85, 6).fill(swatch.white.fill);
      if (weather === 'windy') {
        // Leaves streaming across the card and grass bent the way they go.
        for (const [x, y] of [[-130, -180], [-80, -120], [100, -200], [130, -140]] as const) card.ellipse(x, y, 13, 7).fill(swatch.green.fill).stroke({ width: 2, color: swatch.green.line });
        for (const x of [-120, -40, 40, 120]) for (const dx of [-10, 0, 10]) card.moveTo(x + dx, -60).quadraticCurveTo(x + dx + 12, -80, x + dx + 30, -84);
        card.stroke({ width: 4, color: swatch.green.line, cap: 'round' });
      }
      const sign = new Container();
      sign.addChild(tile(116, 106), this.icon(weather, 80));
      sign.y = -310;
      sign.eventMode = 'none';
      const critter = new Critter(CRITTERS[i === 0 ? 'cat' : 'bear']);
      critter.scale.set(0.65);
      critter.eventMode = 'none';
      node.addChild(card, sign, critter);
      node.hitArea = new Rectangle(-170, -380, 340, 400);
      onTap(node, () => { if (!this.done && !this.busy) { critter.poke(); this.instruct(); } });
      this.friends.push({ node, critter, weather, worn: new Map() });
      this.ctx.stage.addChild(node);
    });
    for (const item of this.outfit.options) {
      const node = new Container();
      node.addChild(tile(124, 124), itemIcon(item, 96));
      node.hitArea = new Rectangle(-70, -70, 140, 140);
      const choice: Choice = { item, node, used: false, handle: null! };
      choice.handle = draggable(node, this.ctx.tw, {
        onPick: () => { sfx.pop(5); this.glow.clear(); },
        onDrop: (x, y) => this.drop(choice, x, y),
      });
      this.options.push(choice);
      this.ctx.stage.addChild(node);
    }
    this.ctx.stage.addChild(this.glow);
    this.resize(this.view);
    this.instruct();
  }

  private drop(choice: Choice, x: number, y: number): boolean {
    if (this.cancelled || this.destroyed || this.busy || this.done || choice.used) return false;
    // Areas do not overlap; sorting also keeps a future close layout nearest-first.
    const friend = this.friends.filter((f) => (f.node.hitArea as Rectangle).contains(x - f.node.x, y - f.node.y))
      .sort((a, b) => Math.hypot(x - a.node.x, y - (a.node.y - 180)) - Math.hypot(x - b.node.x, y - (b.node.y - 180)))[0];
    if (!friend) { this.drawGlow(); return false; }
    if (friend.weather !== ITEMS[choice.item]) {
      this.misses++;
      this.wrong++;
      if (this.wrong === 2) this.hints++;
      sfx.boing();
      friend.critter.poke();
      this.setBusy(true);
      void (async () => {
        await Promise.all([
          choice.handle.floatHome(),
          this.ctx.say('weather.friend.wrong', { item: ITEM_WORDS[choice.item], weather: ITEMS[choice.item], other: friend.weather }),
        ]);
        if (this.destroyed) return;
        this.setBusy(false);
        this.drawGlow();
        if (this.wrong === 2) {
          const item = itemToTap(this.outfit, new Set(this.options.filter((o) => o.used).map((o) => o.item)));
          if (item) void this.ctx.say('weather.friend.hint', { weather: ITEMS[item] });
        }
      })();
      return true; // This branch owns the return animation.
    }
    choice.used = true;
    choice.handle.enabled = false;
    choice.node.visible = false;
    const worn = clothing(choice.item);
    worn.eventMode = 'none';
    friend.worn.set(choice.item, worn);
    // Clothing uses CRITTERS' body coordinates. Coats go under scarves, hats over ears.
    const layers = ['body', 'feet', 'neck', 'hands', 'eyes', 'head', 'held'];
    [...friend.worn].sort(([a], [b]) => layers.indexOf(SLOTS[a]) - layers.indexOf(SLOTS[b])).forEach(([, c]) => friend.critter.attach(c));
    friend.critter.hop(0.5);
    sfx.pop(8);
    this.drawGlow();
    if (this.options.every((o) => o.used)) {
      this.setBusy(true);
      void (async () => {
        await this.ctx.say('weather.friends.ready');
        await this.ctx.tw.wait(0.8);
        if (this.destroyed) return;
        if (this.q + 1 < this.rounds.length) { this.q++; this.ask(); }
        else {
          this.done = true;
          this.ctx.finish({ misses: this.misses, hints: this.hints });
        }
      })();
    } else void this.ctx.say('weather.yes');
    return true;
  }

  private setBusy(busy: boolean) {
    this.busy = busy;
    for (const o of this.options) o.handle.enabled = !busy && !o.used;
  }

  autotouch(): TouchIntent | null {
    if (this.busy || this.done) return null;
    const option = this.options.find((o) => !o.used);
    if (!option) return null;
    const friend = this.friends[friendFor(this.outfit, option.item)!];
    return { drag: { on: option.node }, to: { on: friend.node, y: -150 } };
  }

  resize(v: View) {
    this.view = v;
    this.background.clear().rect(0, 0, v.w, v.h).fill(swatch.blue.light)
      .rect(0, v.h * 0.65, v.w, v.h * 0.35).fill(grass);
    const xs = [v.w * 0.28, v.w * 0.73];
    this.friends.forEach((f, i) => f.node.position.set(xs[i], v.h * 0.62 + 40));
    const choices = spread(4, 210, v.w - 70, 164);
    this.options.forEach((o, i) => {
      // A resize abandons a held object to its new tray slot without scoring it.
      o.handle.home = { x: choices[i], y: v.h - 90 };
      this.ctx.tw.kill(o.node);
      o.node.position.copyFrom(o.handle.home);
    });
    this.drawGlow();
  }

  private drawGlow() {
    const g = this.glow.clear();
    if (this.wrong < 2 || this.done) return;
    const item = itemToTap(this.outfit, new Set(this.options.filter((o) => o.used).map((o) => o.item)));
    const o = this.options.find((o) => o.item === item);
    if (!o) return;
    const f = this.friends[friendFor(this.outfit, o.item)!];
    g.roundRect(o.handle.home.x - 72, o.handle.home.y - 72, 144, 144, 26)
      .stroke({ width: 8, color: swatch.yellow.line })
      .roundRect(f.node.x - 174, f.node.y - 384, 348, 408, 32)
      .stroke({ width: 8, color: swatch.yellow.line });
  }

  update(dt: number) {
    this.clock += dt;
    this.glow.alpha = 0.65 + 0.35 * Math.sin(this.clock * 4);
    for (const f of this.friends) f.critter.update(dt);
  }

  destroy() {
    this.destroyed = true;
    window.removeEventListener('pointercancel', this.cancel, true);
    this.clear();
  }
}
