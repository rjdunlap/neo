import { Assets, Graphics, Sprite, type Container, type Texture } from 'pixi.js';
import { cream, grass } from '../palette';
import url from './home-day.webp?url';

let day: Texture | null = null;

/** Loads Home's day backdrop (R06 `home-day-3`, prepared in this folder). Never throws: without it Home draws sky and grass. */
export async function loadHomeBackdrop(): Promise<void> {
  try {
    day = await Assets.load<Texture>(url);
  } catch (e) {
    console.warn('Could not load the home backdrop', e);
  }
}

/** The backdrop anchored at its bottom-centre (place it with `backdropFit`), or a plain sky and grass of the same size. */
export function homeBackdrop(): Container {
  if (day) {
    const s = new Sprite(day);
    s.anchor.set(0.5, 1);
    s.eventMode = 'none';
    return s;
  }
  const g = new Graphics().rect(-768, -1024, 1536, 730).fill(cream).rect(-768, -294, 1536, 294).fill(grass);
  g.eventMode = 'none';
  return g;
}
