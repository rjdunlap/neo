import { computeView, NO_INSETS, type View } from '../engine/view';

/**
 * The upright views an upright-ready game is checked at (chunk 31, docs/definitions/phone-portrait.md): a 390 × 844 phone,
 * a small 375 × 667 one and a tall one with a notch and a home bar, each on the 768 × 1024 upright area. Kept apart from
 * the locations' swept `VIEWS` (`resident-check.ts`), which stay sideways until shell slice 2.
 */
export const UPRIGHT_VIEWS: Record<string, View> = {
  phone: computeView(390, 844, NO_INSETS, true),
  small: computeView(375, 667, NO_INSETS, true),
  tall: computeView(430, 932, { top: 59, right: 0, bottom: 34, left: 0 }, true),
};

/** A target's box, by its center. */
export interface Target {
  what: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A square or round target of `size` units centered at `p`. */
export const square = (what: string, p: { x: number; y: number }, size: number): Target => ({
  what,
  x: p.x,
  y: p.y,
  w: size,
  h: size,
});

/**
 * What is wrong with a game's targets in an upright view: each at least `min` units (100; a grown-up game on its own band,
 * 64), inside the view, apart from the others, and clear of the round's chrome: Home and "?" in the top-left column and the
 * guide in the bottom-left corner.
 * Returns nothing when the layout fits; Vitest-free so a test asserts on the list.
 */
export function uprightProblems(v: Pick<View, 'w' | 'h'>, targets: readonly Target[], min = 100): string[] {
  const out: string[] = [];
  const box = (t: Target) => ({ x0: t.x - t.w / 2, y0: t.y - t.h / 2, x1: t.x + t.w / 2, y1: t.y + t.h / 2 });
  const keepOut = [
    { what: 'Home and help', x0: 0, y0: 0, x1: 115, y1: 210 },
    { what: 'the guide', x0: 0, y0: v.h - 170, x1: 150, y1: v.h },
  ];
  const hit = (a: { x0: number; y0: number; x1: number; y1: number }, b: typeof a) =>
    a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
  targets.forEach((t, i) => {
    const b = box(t);
    if (Math.min(t.w, t.h) < min - 1e-6) out.push(`${t.what} is ${Math.round(Math.min(t.w, t.h))} units`);
    if (b.x0 < -1e-6 || b.y0 < -1e-6 || b.x1 > v.w + 1e-6 || b.y1 > v.h + 1e-6)
      out.push(`${t.what} leaves the ${Math.round(v.w)} × ${Math.round(v.h)} view`);
    for (const k of keepOut) if (hit(b, k)) out.push(`${t.what} covers ${k.what}`);
    for (const u of targets.slice(i + 1)) if (hit(b, box(u))) out.push(`${t.what} overlaps ${u.what}`);
  });
  return [...new Set(out)].slice(0, 10);
}
