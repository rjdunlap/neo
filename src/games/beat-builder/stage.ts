import { Container, Graphics } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { grass, swatch, wood } from '../../art/palette';
import type { View } from '../../engine/view';

/** Decoration only: each friend moves when its instrument actually sounds. */
export class WoodlandStage extends Container {
  private readonly scenery = new Graphics();
  private readonly deck = new Graphics();
  private readonly players: Container[] = [];
  private readonly friends: Critter[] = [];

  constructor(rows: number, icon: (row: number) => Graphics) {
    super();
    this.eventMode = 'none';
    this.addChild(this.scenery, this.deck);
    [CRITTERS.bear, CRITTERS.bunny, CRITTERS.cat].slice(0, rows).forEach((spec, row) => {
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

  pulse(row: number) {
    this.friends[row].poke();
    this.friends[row].hop(0.35);
  }

  update(dt: number) {
    for (const friend of this.friends) friend.update(dt);
  }
}
