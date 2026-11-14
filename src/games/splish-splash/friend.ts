import { Circle, Container } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import type { CompanionRig } from '../../creatures/companion';
import { FRIEND, type Friend, type Part } from './logic';

/** What the bath needs of whoever is in the tub: her companion, or a friend (`FriendBather`). */
export type Bather = Container &
  Pick<CompanionRig, 'touch' | 'touchArea' | 'poke' | 'cheer' | 'wiggle' | 'update'> & {
    part(name: Part): readonly Container[];
  };

/** How long a friend's wiggle lasts, in seconds (the companion's is about half a second). */
const WIGGLE_FOR = 0.5;

/**
 * A farm friend in the tub (dive slice 5): a `Critter` with one container riding its body on each of its part points
 * (`FRIEND[kind].points`), so a splotch squashes and hops with it, and the companion's touch surface.
 */
export class FriendBather extends Container implements Bather {
  readonly critter: Critter;
  readonly touch = { x: 0, y: -125, r: 125 };
  private readonly parts = new Map<Part, Container[]>();
  private wiggleT = -1;

  constructor(readonly kind: Friend) {
    super();
    this.critter = new Critter(CRITTERS[kind]);
    this.addChild(this.critter);
    const points = FRIEND[kind].points;
    for (const part of Object.keys(points) as Part[]) {
      const nodes = points[part].map(({ x, y }) => {
        const node = new Container();
        node.position.set(x, y);
        this.critter.attach(node);
        return node;
      });
      this.parts.set(part, nodes);
    }
  }

  part(name: Part): readonly Container[] {
    return this.parts.get(name) ?? [];
  }

  touchArea(grow = 0): Circle {
    return new Circle(this.touch.x, this.touch.y, this.touch.r + grow);
  }

  poke() {
    this.critter.poke();
  }

  cheer() {
    this.critter.cheer();
  }

  wiggle() {
    this.wiggleT = 0;
  }

  update(dt: number) {
    this.critter.update(dt);
    if (this.wiggleT < 0) return;
    this.wiggleT += dt;
    const t = this.wiggleT;
    if (t >= WIGGLE_FOR) {
      this.critter.rotation = 0;
      this.wiggleT = -1;
      return;
    }
    this.critter.rotation = 0.12 * Math.sin(t * 30) * (1 - t / WIGGLE_FOR);
  }
}
