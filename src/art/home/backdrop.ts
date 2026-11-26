import type { Container } from 'pixi.js';
import { paperHome } from './paper-home';

/**
 * Home's backdrop used to be the painted `home-day.webp` (R06). The paper look (docs/ART-STYLE.md) draws it instead
 * (`paper-home.ts`), so there is nothing to load; the picture stays in this folder until the developer settles the look.
 */
export async function loadHomeBackdrop(): Promise<void> {}

/** The backdrop anchored at its bottom-centre (place it with `backdropFit`). */
export function homeBackdrop(): Container {
  return paperHome();
}
