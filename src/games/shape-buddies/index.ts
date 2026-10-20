import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, grass, ink, swatch, wood, type ColorName } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { failureLine, guidance, layout, planFor, SeedRound, type Dock, type Shape } from './logic';

const LEVELS: BandLevels = { prek: { min: 1, max: 3 }, school: { min: 1, max: 3 } };
const DESCRIPTIONS: Record<number, string> = {
  1: 'Reshape a bridge and cup; test and plant one seed',
  2: 'A step down: only a slope bridge reaches the low bank; test and plant one seed',
  3: 'Two make one: a flat friend and a cup friend make a spoon; test and plant one seed',
};
const TOOLS = ['flatten', 'scoop', 'slope'] as const;
function paper(shape: Shape, color: ColorName): Graphics {
  const g = new Graphics(), c = swatch[color];
  if (shape === 'flatten') g.roundRect(-80, -12, 160, 30, 8);
  else if (shape === 'slope') g.poly([-80, -28, 80, 14, 80, 34, -80, 34]);
  else if (shape === 'scoop') g.moveTo(-48, -30).quadraticCurveTo(-45, 48, 0, 48).quadraticCurveTo(45, 48, 48, -30).lineTo(30, -30).quadraticCurveTo(25, 20, 0, 20).quadraticCurveTo(-25, 20, -30, -30).closePath();
  else g.poly([-45, 34, -42, -34, -22, -18, 0, -42, 22, -18, 42, -34, 45, 34]);
  g.fill(c.fill).stroke({ width: 4, color: c.line, join: 'round' });
  const y = shape === 'flatten' ? 2 : shape === 'slope' ? 14 : shape === 'scoop' ? 34 : 0;
  g.circle(-12, y, 4).circle(12, y, 4).fill(ink).moveTo(-6, y + 9).quadraticCurveTo(0, y + 15, 6, y + 9).stroke({ width: 2, color: ink });
  g.eventMode = 'none'; return g;
}
function seedArt() { return new Graphics().ellipse(0, 0, 12, 16).fill(swatch.brown.fill).stroke({ width: 3, color: swatch.brown.line }); }
function potArt() { return new Graphics().poly([-40, -12, 40, -12, 30, 45, -30, 45]).fill(swatch.orange.fill).stroke({ width: 4, color: swatch.orange.line }).roundRect(-46, -23, 92, 20, 6).fill(wood.fill).stroke({ width: 4, color: wood.line }); }

class ShapeBuddies implements Game {
  readonly round: SeedRound;
  readonly level: number;
  private readonly step: number;
  /** Level 3: the two docks are halves of one wide gap, and the friends hold hands. */
  private readonly joined: boolean;
  private clasped = false;
  readonly friends = [new Container(), new Container()];
  readonly parks = [new Container(), new Container()];
  readonly docks = { bridge: new Container(), receiver: new Container() };
  readonly tools = TOOLS.map(() => new Container());
  readonly tryButton = new Container();
  readonly undoButton = new Container();
  readonly helpButton = new Container();
  readonly pot = new Container();
  readonly handles: DragHandle[] = [];
  readonly colors: ColorName[];
  finished = false;
  busy = false;
  private dead = false;
  private view: View;
  private readonly scenery = new Graphics();
  private readonly seed = seedArt();
  private readonly sprout = new Graphics();
  private readonly rings = new Graphics();
  private readonly join = new Graphics();
  private readonly heading = label('A bridge, a cup, a little sprout', 30);
  private readonly caption = label('Choose a friend. Change its shape. Drag it to a dock.', 23);
  private readonly tryLabel = label('Try', 23);
  private clock = 0;
  private flight = { x: 0, y: 0 };
  get misses() { return this.round.misses; }
  get hints() { return this.round.hints; }

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.level = ctx.level; this.step = planFor(ctx.level).drop; this.joined = !!planFor(ctx.level).joined; this.round = new SeedRound(ctx.level);
    this.colors = ctx.rng.shuffle(['teal', 'purple', 'pink', 'blue'] as ColorName[]).slice(0, 2);
    const far = layout(this.view.w, this.view.h, this.level).receiverWidth;
    for (const dock of ['bridge', 'receiver'] as const) {
      const node = this.docks[dock], w = dock === 'bridge' ? 180 : far;
      node.hitArea = new Rectangle(-w / 2, -55, w, 110);
      node.addChild(new Graphics().roundRect(-w / 2, -55, w, 110, 15).fill({ color: cream, alpha: 0.55 }).stroke({ width: 3, color: swatch.teal.line, alpha: 0.7 }));
      const text = label(this.joined ? dock === 'bridge' ? 'Near half' : 'Far half' : dock === 'bridge' ? 'Bridge' : 'Catch', 21); text.y = -76; node.addChild(text);
      for (const child of node.children) child.eventMode = 'none';
    }
    this.parks.forEach((p, i) => {
      p.addChild(new Graphics().roundRect(-70, -55, 140, 110, 18).fill(cream).stroke({ width: 3, color: swatch[this.colors[i]].line }));
      const text = label('Park', 18); text.y = 73; p.addChild(text); p.eventMode = 'none';
    });
    this.friends.forEach((node, i) => {
      node.hitArea = new Rectangle(-90, -55, 180, 110);
      // A parked friend has a narrower area to keep the two parking controls separate.
      onTap(node, () => { if (this.canEdit()) { this.round.select(i); this.drawRings(); } });
      this.handles.push(draggable(node, ctx.tw, {
        onPick: () => { this.round.select(i); this.drawRings(); },
        onDrop: (x, y) => this.drop(i, x, y),
      }));
    });
    this.tools.forEach((node, i) => {
      node.addChild(tile(130, 110, 'white'));
      const art = paper(TOOLS[i], 'teal'); art.scale.set(0.55); art.y = -12; node.addChild(art);
      const text = label(['Flat', 'Cup', 'Slope'][i], 21); text.y = 31; node.addChild(text);
      onTap(node, () => {
        if (!this.canEdit()) return;
        this.round.edit(TOOLS[i]); sfx.pop(4 + i); this.sync(); void ctx.say(`buddies.${TOOLS[i]}`);
      });
    });
    for (const [node, text] of [[this.tryButton, this.tryLabel], [this.undoButton, label('Undo ↶', 23)], [this.helpButton, label('Help ◇', 23)]] as const) node.addChild(tile(150, 110, 'teal'), text);
    onTap(this.tryButton, () => { void this.run(); });
    onTap(this.undoButton, () => { if (this.canEdit() && this.round.undo()) { sfx.pop(); this.sync(); } });
    onTap(this.helpButton, () => { if (this.canEdit()) { this.round.help(); this.drawRings(); void this.explain(); } });
    this.pot.addChild(potArt()); this.pot.hitArea = new Rectangle(-60, -60, 120, 120);
    const potLabel = label('Plant', 22); potLabel.y = 80; this.pot.addChild(potLabel);
    onTap(this.pot, () => { void this.carry(); });
    for (const node of [this.scenery, this.join, this.seed, this.sprout, this.rings, this.heading, this.caption]) node.eventMode = 'none';
    if (this.joined) this.heading.text = 'Two friends make one spoon';
    ctx.stage.addChild(this.scenery, ...this.parks, this.docks.bridge, this.docks.receiver, this.join, this.pot, ...this.friends, ...this.tools, this.tryButton, this.undoButton, this.helpButton, this.seed, this.sprout, this.heading, this.caption, this.rings);
    this.resize(ctx.view); this.sync();
  }
  start() { void this.ctx.instruct(this.joined ? 'buddies.start3' : this.step ? 'buddies.start2' : 'buddies.start'); }
  private place() { return layout(this.view.w, this.view.h, this.level); }
  private canEdit() { return !this.dead && !this.busy && this.round.editable && !this.handles.some(h => h.dragging); }
  private drop(i: number, x: number, y: number) {
    if (this.dead || this.busy) return false;
    this.round.select(i);
    const l = this.place();
    const candidates = [
      { place: 'bridge' as const, ...l.bridge, radius: 90 }, { place: 'receiver' as const, ...l.receiver, radius: this.joined ? 90 : 70 },
      { place: 'park' as const, ...l.parks[i], radius: 70 },
    ].map(p => ({ ...p, distance: Math.hypot(x - p.x, y - p.y) })).filter(p => p.distance <= p.radius).sort((a, b) => a.distance - b.distance);
    const target = candidates[0];
    if (!target) return false;
    const occupied = target.place !== 'park' && this.round.state.friends.some((f, j) => i !== j && f.place === target.place);
    if (occupied) { sfx.boing(); void this.ctx.say('buddies.occupied'); return false; }
    this.round.edit(undefined, target.place); sfx.pop(); this.sync(); return true;
  }
  private sync() {
    const l = this.place();
    this.friends.forEach((node, i) => {
      for (const c of node.removeChildren()) c.destroy({ children: true });
      const art = paper(this.round.state.friends[i].shape, this.colors[i]);
      if (this.step && this.round.state.friends[i].place === 'bridge') {
        // Over a step down: Flat stays level and ends above the stream; Slope tilts down to the low bank.
        if (this.round.state.friends[i].shape === 'flatten') { art.scale.x = 0.8; art.x = -10; }
        if (this.round.state.friends[i].shape === 'slope') { art.rotation = 0.2; art.y = 8; }
      }
      node.addChild(art);
      const place = this.round.state.friends[i].place, wide = place === 'bridge' || (this.joined && place === 'receiver');
      node.hitArea = new Rectangle(wide ? -90 : -70, -55, wide ? 180 : 140, 110);
      const p = place === 'park' ? l.parks[i] : l[place];
      this.handles[i].home = { ...p };
      if (!this.busy && !this.handles[i].dragging) { this.ctx.tw.kill(node); node.position.set(p.x, p.y); }
      this.handles[i].enabled = !this.busy && this.round.editable;
    });
    this.drawJoin(l);
    this.tryLabel.text = this.round.phase === 'caught' ? 'Replay ↶' : 'Try ▶';
    this.caption.text = this.round.phase === 'caught' ? 'The cup caught it! Tap the pot to plant.' : 'Choose a friend. Change its shape. Drag it to a dock.';
    this.seed.visible = !this.finished;
    if (!this.busy) this.seed.position.set(this.round.phase === 'caught' ? l.receiver.x : l.bridge.x - 180, this.round.phase === 'caught' ? l.receiver.y + 5 : l.bridge.y - 48);
    this.drawRings();
  }
  /** Level 3 only: a dashed outline makes the two halves one thing, and two filled halves hold hands with a soft clasp. */
  private drawJoin(l: ReturnType<typeof layout>) {
    this.join.clear();
    if (!this.joined) return;
    const x0 = l.bridge.x - 96, x1 = l.receiver.x + l.receiverWidth / 2 + 6, y0 = l.bridge.y - 61, y1 = l.bridge.y + 61;
    for (let x = x0; x < x1; x += 24) this.join.moveTo(x, y0).lineTo(Math.min(x + 12, x1), y0).moveTo(x, y1).lineTo(Math.min(x + 12, x1), y1);
    this.join.stroke({ width: 3, color: swatch.teal.line, alpha: 0.6 });
    const both = this.round.state.friends.every(f => f.place !== 'park');
    if (both && !this.clasped) sfx.bell(9);
    this.clasped = both;
    if (!both || this.round.phase === 'carrying' || this.finished) return;
    // Hands reach from the end of the near friend to the far friend's near edge and overlap there.
    const y = l.bridge.y + 2, from = l.bridge.x + 70, to = l.receiver.x - 40;
    for (const i of [0, 1]) this.join.moveTo(i ? to : from, y).lineTo((from + to) / 2 + (i ? 5 : -5), y).stroke({ width: 6, color: swatch[this.colors[i]].line, cap: 'round' });
    this.join.circle((from + to) / 2 - 5, y, 8).fill(swatch[this.colors[0]].fill).circle((from + to) / 2 + 5, y, 8).fill(swatch[this.colors[1]].fill);
  }
  private drawRings() {
    this.rings.clear();
    if (this.busy || this.dead) return;
    const node = this.friends[this.round.state.selected];
    this.rings.roundRect(node.x - 94, node.y - 59, 188, 118, 18).stroke({ width: 3, color: swatch[this.colors[this.round.state.selected]].line });
    const g = guidance(this.round.state, this.level);
    if (g && this.round.shown.has(g.dock)) {
      const l = this.place(), p = l[g.dock], tool = this.tools[TOOLS.indexOf(g.shape as typeof TOOLS[number])];
      const friend = this.friends[g.friend];
      for (const [x, y, w] of [[p.x, p.y, g.dock === 'bridge' ? 188 : l.receiverWidth + 10], [tool.x, tool.y, 138], [friend.x, friend.y, 188]]) this.rings.roundRect(x - w / 2, y - 60, w, 120, 16).stroke({ width: 5 + Math.sin(this.clock * 5), color: swatch.yellow.line });
    }
    if (this.round.phase === 'caught') this.rings.circle(this.pot.x, this.pot.y, 66).stroke({ width: 5, color: swatch.yellow.line });
  }
  private explain() {
    return this.ctx.say(failureLine(this.round.state, this.level) ?? (this.round.phase === 'caught' ? 'buddies.plant' : 'buddies.try'));
  }
  private async run() {
    if (!this.canEdit()) return;
    if (this.round.phase === 'caught') { this.round.replay(); this.sync(); return; }
    const result = this.round.trySeed(); if (!result) return;
    this.busy = true; this.sync(); this.flight = { x: -180, y: -48 };
    const move = (x: number, y: number, duration: number) => this.ctx.tw.to(this.flight, { x, y }, { duration });
    // The trace decides; these offsets from the bridge dock only draw it. `d` is the far bank's step down.
    const d = this.step, flat = d > 0 && this.round.state.friends.some(f => f.place === 'bridge' && f.shape === 'flatten');
    const l = this.place(), far = l.receiver.x - l.bridge.x;
    await move(-85, -25, 0.45); if (this.dead) return;
    if (this.joined) {
      // Along the handle into the bowl, or the way the spoon fell short: near water, the slope's dip, the gap, or right across.
      const line = failureLine(this.round.state, this.level);
      const path = line === 'buddies.joinPath' ? [[-30, 112]] : line === 'buddies.joinSlope' ? [[0, 15], [30, 112]]
        : line === 'buddies.joinShort' ? [[90, -25], [150, 112]] : line === 'buddies.joinCup' ? [[far + 90, -25], [far + 200, 112]] : [[110, -25], [far, 5]];
      for (const [x, y] of path) { await move(x, y, 0.45); if (this.dead) return; }
    } else if (flat) { await move(55, -25, 0.4); if (this.dead) return; await move(45, 112 + d, 0.5); if (this.dead) return; }
    else { await move(result === 'bridge' ? 0 : 90, result === 'bridge' ? 112 + d : -20 + d, 0.6); if (this.dead) return; }
    if (result !== 'bridge' && !this.joined) { await move(far, result === 'caught' ? 5 + d : 112 + d, 0.5); if (this.dead) return; }
    if (result !== 'caught') { await this.ctx.tw.wait(0.5); if (this.dead) return; sfx.boing(); } else sfx.sparkle();
    this.round.settle(result); this.busy = false; this.sync();
    if (result === 'caught') await this.ctx.instruct('buddies.plant'); else await this.explain();
  }
  private async carry() {
    if (this.dead || this.busy || !this.round.carry()) return;
    this.busy = true; this.sync();
    const receiver = this.round.state.friends.findIndex(f => f.place === 'receiver');
    const d = this.step, l = this.place(), far = l.receiver.x - l.bridge.x, pot = l.pot.x - l.bridge.x;
    if (this.joined) void this.ctx.say('buddies.together');
    this.flight = { x: far, y: 5 + d };
    await this.ctx.tw.to(this.flight, { x: pot, y: -25 + d }, { duration: 1 }); if (this.dead) return;
    void this.ctx.tw.to(this.friends[receiver], { rotation: 0.6 }, { duration: 0.4 });
    await this.ctx.tw.to(this.flight, { y: 25 + d }, { duration: 0.4 }); if (this.dead) return;
    if (!this.round.finish()) return;
    this.finished = true; this.seed.visible = false;
    this.friends[receiver].position.set(l.pot.x - 95, l.pot.y);
    if (this.joined) this.friends[1 - receiver].position.set(l.pot.x - 265, l.pot.y);
    this.sprout.moveTo(0, 0).lineTo(0, -68).stroke({ width: 7, color: swatch.green.line }).ellipse(-17, -45, 21, 10).ellipse(17, -62, 21, 10).fill(swatch.green.fill);
    this.caption.text = 'Your shapes brought a seed home!'; sfx.sparkle();
    for (const friend of this.friends) {
      void this.ctx.tw.to(friend, { rotation: -0.12 }, { duration: 0.25 }).then(async () => {
        if (this.dead) return;
        await this.ctx.tw.to(friend, { rotation: 0.12 }, { duration: 0.25 });
        if (!this.dead) void this.ctx.tw.to(friend, { rotation: 0 }, { duration: 0.25 });
      });
    }
    this.ctx.particles.burst(l.pot.x, l.pot.y - 50, { colors: [swatch.green.fill, swatch.yellow.fill], count: 20 });
    await this.ctx.say('buddies.done'); if (this.dead) return;
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
  update(dt: number) {
    this.clock += dt;
    if (this.busy && !this.finished) {
      const l = this.place();
      this.seed.position.set(l.bridge.x + this.flight.x, l.bridge.y + this.flight.y);
      if (this.round.phase === 'carrying') {
        const i = this.round.state.friends.findIndex(f => f.place === 'receiver');
        this.friends[i].position.set(this.seed.x, this.seed.y - 5);
        // Both friends carry the spoon: the handle walks at its place behind the bowl.
        if (this.joined) this.friends[1 - i].position.set(this.seed.x - (l.receiver.x - l.bridge.x), this.seed.y - 5);
      }
    }
    this.drawRings();
  }
  resize(view: View) {
    this.view = view; const l = layout(view.w, view.h, this.level), x = l.bridge.x, d = this.step;
    this.scenery.clear().rect(0, 0, view.w, view.h).fill(cream);
    // The wide gap: the near bank ends at left + 290 and the far bank starts at left + 690. Cushions sit under
    // the near half (no path, or a slope's dip), in the gap between the halves, and on the far bank past the spoon.
    if (this.joined) this.scenery.roundRect(x - 230, 340, 140, 75, 20).roundRect(x + 310, 340, 270, 75, 20).fill(grass)
      .roundRect(x - 50, 397, 120, 22, 10).roundRect(x + 110, 397, 80, 22, 10).roundRect(x + 350, 397, 100, 22, 10).fill(swatch.pink.light);
    else {
      this.scenery.roundRect(x - 250, 340 - d, 175, 75 + d, 20).roundRect(x + 75, 340, 485, 75, 20).fill(grass)
        .roundRect(x + 180, 397, 100, 22, 10).fill(swatch.pink.light);
      // A step down gets a second cushion in the stream, under the end of a flat bridge.
      if (d) this.scenery.roundRect(x - 70, 397, 80, 22, 10).roundRect(x + 15, 397, 60, 22, 10).fill(swatch.pink.light);
      else this.scenery.roundRect(x - 65, 397, 130, 22, 10).fill(swatch.pink.light);
    }
    this.scenery.poly([x - 245, 238 - d, x - 175, 260 - d, x - 85, 285 - d, x - 85, 303 - d, x - 245, 257 - d]).fill(wood.fill).stroke({ width: 4, color: wood.line });
    // The raised bridge dock's label sits where the caption was, so a step down lifts the words, never a target.
    this.heading.position.set(view.w / 2, d ? 110 : 128); this.caption.position.set(view.w / 2, d ? 150 : 180);
    for (const dock of ['bridge', 'receiver'] as Dock[]) this.docks[dock].position.set(l[dock].x, l[dock].y);
    this.pot.position.set(l.pot.x, l.pot.y); this.sprout.position.set(l.pot.x, l.pot.y - 20);
    this.parks.forEach((p, i) => p.position.set(l.parks[i].x, l.parks[i].y));
    this.tools.forEach((p, i) => p.position.set(l.tools[i].x, l.tools[i].y));
    [this.tryButton, this.undoButton, this.helpButton].forEach((p, i) => p.position.set(l.buttons[i].x, l.buttons[i].y));
    if (this.handles.length === 2) this.sync();
  }
  autotouch(): TouchIntent | null {
    if (!this.canEdit() || this.finished) return null;
    if (this.round.phase === 'caught') return { tap: { on: this.pot } };
    const g = guidance(this.round.state, this.level);
    if (!g) return { tap: { on: this.tryButton } };
    if (this.round.state.selected !== g.friend) return { tap: { on: this.friends[g.friend] } };
    if (this.round.state.friends[g.friend].shape !== g.shape) return { tap: { on: this.tools[TOOLS.indexOf(g.shape as typeof TOOLS[number])] } };
    return { drag: { on: this.friends[g.friend] }, to: { on: this.docks[g.dock] } };
  }
  destroy() { this.dead = true; this.handles.forEach(h => h.destroy()); }
}
function sticker(seed: number) {
  const rng = new Rng(seed), c = new Container();
  const bridge = paper('flatten', rng.pick(['teal', 'blue'] as ColorName[])); bridge.position.set(-35, 20); bridge.scale.set(0.7);
  const cup = paper('scoop', 'purple'); cup.position.set(70, -10); cup.scale.set(0.8);
  const s = seedArt(); s.position.set(70, -15); c.addChild(bridge, cup, s); return c;
}
export const shapeBuddies: GameModule = {
  id: 'shape-buddies', name: 'Shape Buddies', titleLine: 'game.shape-buddies', region: 'tinker-lab',
  skills: ['shape and function', 'spatial planning', 'testing and revision'], bands: ['prek', 'school'],
  levels: band => rangeFor(LEVELS, band), describeLevel: level => DESCRIPTIONS[level] ?? DESCRIPTIONS[1],
  music: STYLES.hub, touchDemo: true,
  coplayHint: 'Ask which shape can hold the seed. Take turns choosing a friend and testing what its shape does. When the far bank is lower, ask why the flat one did not work this time. Across the wide gap, ask what the two friends made together.',
  offScreen: 'Slide a large soft toy over a cardboard bridge into a bowl. Change the bridge or bowl and try again. For a step down, slide it down a cardboard ramp from a cushion to the floor and into the bowl. For two make one, lay a flat book across two cushions with a bowl at the far end, and roll a large soft ball along it into the bowl.',
  hubIcon: () => new WigglyIcon(sticker(1)), sticker, create: ctx => new ShapeBuddies(ctx),
};
