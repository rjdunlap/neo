import { Container, type Sprite } from 'pixi.js';
import { homeBackdrop } from '../../art/home/backdrop';
import { locationPicture, pictureSprite, placePicture } from '../../art/locations';
import { Backdrop, type BackdropStyle } from '../../art/scenery';
import { backdropFit } from '../../creatures/home-layout';
import { landFor, type LandId } from '../../content/lands';
import type { View } from '../../engine/view';
import type { Origin } from '../App';
import { LOCATIONS } from './LocationScene';

/**
 * The place a root round's celebration and result stand in (RW14 slice 5): the origin location's own sky (the grove's
 * night, the lab's cave, else its land's day), or the home backdrop for a round from Explore, the library, a home spot or
 * nowhere. Null keeps the flat cream: a story's result, and every result on the classic island. A location with a loaded
 * picture (RW14 slice 4) stands its result on that picture, over its sky, with the horizon where the location has it.
 */
export type ResultPlace = BackdropStyle | 'home' | { picture: LandId; sky: BackdropStyle };

export function resultPlace(origin: Origin | undefined, opts: { story: boolean; root: boolean }): ResultPlace | null {
  if (!opts.root || opts.story) return null;
  if (origin && 'land' in origin && origin.land in LOCATIONS) {
    const sky = LOCATIONS[origin.land]!.backdrop ?? landFor(origin.land).backdrop;
    return locationPicture(origin.land) ? { picture: origin.land, sky } : sky;
  }
  return 'home';
}

/** The result's place, drawn under its veil: sized to the view in `resize`, its sun and clouds moved in `update`. */
export class ResultBackdrop extends Container {
  private readonly sky: Backdrop | null;
  private readonly home: Container | null;
  private readonly picture: { id: LandId; sprite: Sprite } | null = null;

  constructor(place: ResultPlace, view: View) {
    super();
    this.eventMode = 'none';
    const pictured = typeof place === 'object' && 'picture' in place ? place : null;
    const sprite = pictured ? pictureSprite(pictured.picture) : null;
    // Under a picture the sky only fills behind it, without a sun or clouds.
    this.sky = place === 'home' ? null : pictured ? new Backdrop({ ...pictured.sky, sun: false, clouds: 0 }, view) : new Backdrop(place as BackdropStyle, view);
    this.home = place === 'home' ? homeBackdrop() : null;
    this.addChild((this.sky ?? this.home)!);
    if (pictured && sprite) {
      this.picture = { id: pictured.picture, sprite };
      this.addChild(sprite);
    }
    this.resize(view);
  }

  resize(view: View) {
    this.sky?.resize(view);
    if (this.picture && this.sky) placePicture(this.picture.sprite, this.picture.id, view, this.sky.groundY);
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
