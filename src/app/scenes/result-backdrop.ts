import { Container } from 'pixi.js';
import { homeBackdrop } from '../../art/home/backdrop';
import { Backdrop, type BackdropStyle } from '../../art/scenery';
import { backdropFit } from '../../creatures/home-layout';
import { landFor } from '../../content/lands';
import type { View } from '../../engine/view';
import type { Origin } from '../App';
import { LOCATIONS } from './LocationScene';

/**
 * The place a root round's celebration and result stand in (RW14 slice 5): the origin location's own sky (the grove's
 * night, the lab's cave, else its land's day), or the home backdrop for a round from Explore, the library, a home spot or
 * nowhere. Null keeps the flat cream: a story's result, and every result on the classic island.
 * Slice 4 adds a location's picture here, beside its code-drawn sky.
 */
export function resultPlace(origin: Origin | undefined, opts: { story: boolean; root: boolean }): BackdropStyle | 'home' | null {
  if (!opts.root || opts.story) return null;
  if (origin && 'land' in origin && origin.land in LOCATIONS) return LOCATIONS[origin.land]!.backdrop ?? landFor(origin.land).backdrop;
  return 'home';
}

/** The result's place, drawn under its veil: sized to the view in `resize`, its sun and clouds moved in `update`. */
export class ResultBackdrop extends Container {
  private readonly sky: Backdrop | null;
  private readonly home: Container | null;

  constructor(place: BackdropStyle | 'home', view: View) {
    super();
    this.eventMode = 'none';
    this.sky = place === 'home' ? null : new Backdrop(place, view);
    this.home = place === 'home' ? homeBackdrop() : null;
    this.addChild((this.sky ?? this.home)!);
    this.resize(view);
  }

  resize(view: View) {
    this.sky?.resize(view);
    if (this.home) {
      const fit = backdropFit(view);
      this.home.position.set(fit.x, fit.y);
      this.home.scale.set(fit.scale);
    }
  }

  update(dt: number) {
    this.sky?.update(dt);
  }
}
