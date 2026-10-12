import { Container, Graphics } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { cream, grass, swatch, wood } from '../../art/palette';
import type { View } from '../../engine/view';

/** Decoration only: each friend moves when its instrument actually sounds. */
export interface BeatStage extends Container {
  resize(v: View, gridY: number): void;
  pulse(row: number): void;
  update(dt: number): void;
}

abstract class FriendsStage extends Container implements BeatStage {
  protected readonly scenery = new Graphics();
  protected readonly deck = new Graphics();
  protected readonly players: Container[] = [];
  private readonly friends: Critter[] = [];

  constructor(cast: (typeof CRITTERS)[keyof typeof CRITTERS][], rows: number, icon: (row: number) => Graphics) {
    super();
    this.eventMode = 'none';
    this.addChild(this.scenery, this.deck);
    cast.slice(0, rows).forEach((spec, row) => {
      const player = new Container();
      const friend = new Critter(spec);
      friend.scale.set(0.36);
      const instrument = icon(row);
      instrument.scale.set(0.65);
      instrument.position.set(48, -24);
      player.addChild(friend, instrument);
      this.players.push(player);
      this.friends.push(friend);
      this.addChild(player);
    });
  }

  abstract resize(v: View, gridY: number): void;

  pulse(row: number) {
    this.friends[row].poke();
    this.friends[row].hop(0.35);
  }

  update(dt: number) {
    for (const friend of this.friends) friend.update(dt);
  }
}

export class WoodlandStage extends FriendsStage {
  constructor(rows: number, icon: (row: number) => Graphics) {
    super([CRITTERS.bear, CRITTERS.bunny, CRITTERS.cat], rows, icon);
  }

  resize(v: View, gridY: number) {
    const g = this.scenery.clear();
    // Tall trunks and soft overlapping leaves frame the clearing, behind all controls.
    for (const x of [36, v.w - 36]) {
      g.roundRect(x - 22, 32, 44, v.h * 0.8, 18).fill(wood.fill).stroke({ width: 5, color: wood.line });
      g.moveTo(x, 180).lineTo(x - 55, 110).moveTo(x, 230).lineTo(x + 55, 160).stroke({ width: 18, color: wood.fill, cap: 'round' });
      for (const [dx, y, radius] of [[-64, 42, 90], [65, 48, 96], [0, 100, 90]]) {
        g.circle(x + dx, y, radius).fill(swatch.green.fill);
        g.ellipse(x + dx - 20, y - 20, 30, 16).fill({ color: swatch.green.light, alpha: 0.5 });
      }
      g.ellipse(x, v.h * 0.83, 100, 27).fill(grass);
    }
    const y = gridY - 30;
    const left = 230, right = v.w - 100;
    const deck = this.deck.clear();
    deck.roundRect(left - 70, y - 5, right - left + 140, 26, 13).fill(wood.fill).stroke({ width: 4, color: wood.line });
    deck.moveTo(left - 55, y + 6).lineTo(right + 55, y + 6).stroke({ width: 3, color: wood.light });
    this.players.forEach((player, row) => player.position.set(left + (right - left) * (row + 0.5) / this.players.length, y));
    // Ferns and mushrooms stay at the far edges, away from the corner pet.
    for (const x of [v.w - 70, v.w - 130]) {
      g.roundRect(x - 7, v.h - 70, 14, 35, 6).fill(swatch.white.fill);
      g.ellipse(x, v.h - 70, 27, 14).fill(swatch.red.fill).stroke({ width: 3, color: swatch.red.line });
      g.circle(x - 10, v.h - 73, 4).circle(x + 9, v.h - 74, 5).fill(swatch.white.fill);
    }
  }
}

/** A sunny meadow: a checkered blanket under the band, a basket and flowers at the edges. */
export class PicnicStage extends FriendsStage {
  constructor(rows: number, icon: (row: number) => Graphics) {
    super([CRITTERS.pig, CRITTERS.duck, CRITTERS.dog], rows, icon);
  }

  resize(v: View, gridY: number) {
    const g = this.scenery.clear();
    const y = gridY - 30;
    const left = 230, right = v.w - 100;
    // Rolling meadow hill and a few flowers well away from the corner pet.
    g.ellipse(v.w * 0.55, v.h + 120, v.w * 0.7, v.h * 0.34).fill(grass);
    for (const [fx, fy, color] of [[v.w - 60, v.h - 60, swatch.pink], [v.w - 105, v.h - 45, swatch.yellow], [v.w - 150, v.h - 62, swatch.purple]] as const) {
      g.moveTo(fx, fy).lineTo(fx, fy + 36).stroke({ width: 5, color: swatch.green.line, cap: 'round' });
      for (let k = 0; k < 5; k++) g.circle(fx + Math.cos((k * Math.PI * 2) / 5) * 11, fy + Math.sin((k * Math.PI * 2) / 5) * 11, 8).fill(color.fill);
      g.circle(fx, fy, 6).fill(swatch.yellow.light);
    }
    // The blanket sits behind the friends: red and cream squares in a soft rounded slab.
    const d = this.deck.clear();
    const bx = left - 80, bw = right - left + 160, by = y - 10, bh = 64;
    d.roundRect(bx, by, bw, bh, 14).fill(cream).stroke({ width: 4, color: swatch.red.line });
    const cell = bh / 2;
    for (let c = 0; c * cell < bw - 8; c++) for (let r = 0; r < 2; r++) {
      if ((c + r) % 2) continue;
      const w = Math.min(cell, bw - 4 - c * cell - 4);
      if (w > 4) d.roundRect(bx + 4 + c * cell, by + 4 + r * cell - (r ? 4 : 0), w, cell - 4, 4).fill({ color: swatch.red.fill, alpha: 0.75 });
    }
    // A basket with a handle, off to the left of the first friend.
    const hx = left - 120, hy = by + bh - 18;
    d.roundRect(hx - 30, hy - 26, 60, 34, 8).fill(wood.fill).stroke({ width: 4, color: wood.line });
    d.moveTo(hx - 22, hy - 26).quadraticCurveTo(hx, hy - 66, hx + 22, hy - 26).stroke({ width: 5, color: wood.line });
    this.players.forEach((player, row) => player.position.set(left + (right - left) * (row + 0.5) / this.players.length, y));
  }
}
