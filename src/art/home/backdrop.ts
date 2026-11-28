import { Graphics, type Container } from 'pixi.js';
import { PAPER_ON, paperizeContext } from '../paperize';
import { paperHome } from './paper-home';

/**
 * Home's backdrop used to be the painted `home-day.webp` (R06). The paper look (docs/ART-STYLE.md) draws it instead
 * (`paper-home.ts`), so there is nothing to load; the picture stays in this folder until the developer settles the look.
 */
export async function loadHomeBackdrop(): Promise<void> {}

/**
 * The backdrop anchored at its bottom-centre (place it with `backdropFit`). It never changes, so it is turned to paper
 * at once and drawn into one cached picture: a phone then paints one layer instead of every piece's shadow, fill,
 * fibre and outline each frame. The picture is sized for this screen (its width in device pixels, plus room for the
 * cover fit's overhang); `?nopaper` keeps it flat and live.
 */
export function homeBackdrop(tree = true): Container {
  const c = paperHome(tree);
  if (typeof window === 'undefined' || !PAPER_ON) return c;
  const walk = (n: Container) => {
    if (n instanceof Graphics) paperizeContext(n.context);
    for (const k of n.children) walk(k as Container);
  };
  walk(c);
  const px = Math.max(window.innerWidth, window.innerHeight) * Math.min(window.devicePixelRatio || 1, 2);
  c.cacheAsTexture({ resolution: Math.min(2, Math.max(0.75, (px / 1536) * 1.2)), antialias: true });
  return c;
}
