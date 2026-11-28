import { crayon, drawFibre, PAPER_BG, roundRectPoints } from '../art/paper';
import { dense, softPath } from '../art/creatures/paper/canvas';
import { PAPER_ON } from '../art/paperize';

/**
 * The paper look (docs/ART-STYLE.md) for plain-HTML screens: couch play's menus, pages and panels. A button or panel
 * the skin is given becomes a piece of construction paper, drawn once on a 2D canvas at its size and used as its
 * background picture: a torn edge, a warm shadow, a flat fill with paper fibre and a double crayon outline in a darker
 * shade of its own colour. Its colour comes from the CSS custom property `--paper` (any CSS colour), so a stylesheet
 * still decides colours and states (`.couch-chosen`, `.on`); a change of class, size or `--paper` repaints it. Nothing is
 * redrawn per frame, and pictures are shared between pieces of one size and colour.
 *
 * `paperGroundUrl()` is the oatmeal ground with its fibre, a tile for a page's background.
 */

type Pt = [number, number];

const SHADOW = 'rgba(45,30,20,0.26)';

let ground: string | null | undefined;

/** The oatmeal ground with fibre, as a repeating tile (a data URL), or null where there is no canvas. */
export function paperGroundUrl(): string | null {
  if (ground !== undefined) return ground;
  ground = null;
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = c.height = 384;
  const x = c.getContext('2d');
  if (!x || typeof x.quadraticCurveTo !== 'function') return null;
  x.fillStyle = hex(PAPER_BG);
  x.fillRect(0, 0, 384, 384);
  x.scale(2, 2);
  x.globalAlpha = 0.6;
  drawFibre(x);
  ground = c.toDataURL('image/png');
  return ground;
}

let fibreTile: HTMLCanvasElement | null | undefined;
function fibre(): HTMLCanvasElement | null {
  if (fibreTile !== undefined) return fibreTile;
  fibreTile = null;
  const c = document.createElement('canvas');
  c.width = c.height = 192;
  const x = c.getContext('2d');
  if (!x || typeof x.quadraticCurveTo !== 'function') return null;
  drawFibre(x);
  fibreTile = c;
  return c;
}

const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;

/** A CSS colour as the browser computes it ("rgb(…)" or "rgba(…)") to a 0xRRGGBB number, or null when see-through. */
export function parseRgb(css: string): number | null {
  const m = /rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:[ ,/]+([\d.]+%?))?/.exec(css);
  if (!m) {
    const h = /^#([0-9a-f]{6})$/i.exec(css.trim());
    return h ? parseInt(h[1], 16) : null;
  }
  const a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
  if (a < 0.5) return null;
  return (Math.round(+m[1]) << 16) | (Math.round(+m[2]) << 8) | Math.round(+m[3]);
}

/** Room left round a piece inside its box for the torn edge and the shadow, in CSS pixels. */
export const PAD = { x: 3, top: 3, bottom: 6 };

const cache = new Map<string, string>();

/** One piece of paper `w` × `h` CSS pixels with corners of `radius`, as a data URL (cached). */
export function paperSheetUrl(
  w: number,
  h: number,
  fill: number,
  radius: number,
  seed: string,
): string | null {
  const dpr = Math.min(2, Math.max(1, typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1));
  const key = `${w}x${h}|${fill}|${radius}|${seed}|${dpr}`;
  const known = cache.get(key);
  if (known) return known;
  if (typeof document === 'undefined' || w < 8 || h < 8) return null;
  const c = document.createElement('canvas');
  c.width = Math.ceil(w * dpr);
  c.height = Math.ceil(h * dpr);
  const x = c.getContext('2d');
  if (!x || typeof x.quadraticCurveTo !== 'function' || typeof Path2D === 'undefined') return null;
  x.scale(dpr, dpr);
  const iw = w - PAD.x * 2;
  const ih = h - PAD.top - PAD.bottom;
  const r = Math.max(2, Math.min(radius, iw / 2, ih / 2));
  const small = Math.min(iw, ih) < 40;
  const amp = small ? 1 : Math.min(2.2, Math.min(iw, ih) / 40);
  const pts = dense(roundRectPoints(PAD.x, PAD.top, iw, ih, r) as Pt[], 9);
  const path = softPath(pts, amp, seed);
  // Shadow: one offset sheet, warm brown, never black and never a live blur.
  x.save();
  x.translate(1, small ? 2 : 3.5);
  x.fillStyle = SHADOW;
  x.fill(path);
  x.restore();
  x.fillStyle = hex(fill);
  x.fill(path);
  const tile = fibre();
  if (tile) {
    x.save();
    x.clip(path);
    x.globalAlpha = 0.28;
    const pattern = x.createPattern(tile, 'repeat');
    if (pattern) {
      x.fillStyle = pattern;
      x.fillRect(0, 0, w, h);
    }
    x.restore();
  }
  // The double crayon outline in a darker shade of the piece's own colour.
  const line = hex(crayon(fill));
  x.save();
  x.lineJoin = 'round';
  x.strokeStyle = line;
  x.globalAlpha = 0.9;
  x.lineWidth = small ? 1.8 : 2.6;
  x.stroke(path);
  x.translate(0.9, -0.7);
  x.globalAlpha = 0.45;
  x.lineWidth = small ? 0.9 : 1.2;
  x.stroke(path);
  x.restore();
  const url = c.toDataURL('image/png');
  if (cache.size > 300) cache.delete(cache.keys().next().value as string);
  cache.set(key, url);
  return url;
}

/**
 * Keeps every element under `root` that matches `selector` dressed as paper while the screen is up. Elements are found
 * again whenever the screen's contents change, and repainted when their size, class or colour does.
 */
export class PaperSkin {
  private readonly sizes = new ResizeObserver(() => this.schedule());
  private readonly changes = new MutationObserver(() => this.schedule());
  private frame = 0;
  private readonly watched = new WeakSet<Element>();
  private alive = true;

  constructor(
    private readonly root: HTMLElement,
    private readonly selector: string,
  ) {
    if (!PAPER_ON) return;
    const url = paperGroundUrl();
    if (url) root.style.setProperty('--paper-ground', `url(${url})`);
    this.changes.observe(root, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class', 'aria-pressed', 'hidden'],
    });
    this.schedule();
  }

  private schedule() {
    if (!this.alive || this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.paint();
    });
  }

  /** Paints every matching element whose size, colour or corners changed since it was last painted. */
  paint() {
    if (!this.alive) return;
    for (const el of this.root.querySelectorAll<HTMLElement>(this.selector)) {
      if (!this.watched.has(el)) {
        this.watched.add(el);
        this.sizes.observe(el);
      }
      const w = Math.round(el.offsetWidth);
      const h = Math.round(el.offsetHeight);
      if (!w || !h) continue;
      // The colour the stylesheet gives it now (`.is-paper` hides it, so read it with that class off for a moment).
      const was = el.classList.contains('is-paper');
      if (was) el.classList.remove('is-paper');
      const style = getComputedStyle(el);
      const fill = parseRgb(style.getPropertyValue('--paper').trim() || style.backgroundColor);
      if (was) el.classList.add('is-paper');
      if (fill === null) continue;
      const radius = Math.round(parseFloat(style.getPropertyValue('--paper-radius')) || 14);
      const seed = el.dataset.paperSeed ?? el.className;
      const key = `${w}x${h}|${fill}|${radius}|${seed}`;
      if (el.dataset.paperKey === key) continue;
      const url = paperSheetUrl(w, h, fill, radius, seed);
      if (!url) continue;
      el.dataset.paperKey = key;
      el.classList.add('is-paper');
      el.style.backgroundImage = `url(${url})`;
    }
    // The class flips above are the skin's own changes, not the screen's: drop them so they do not paint again.
    this.changes.takeRecords();
  }

  destroy() {
    this.alive = false;
    if (this.frame) cancelAnimationFrame(this.frame);
    this.sizes.disconnect();
    this.changes.disconnect();
  }
}
