import { RAINBOW, swatch } from '../../art/palette';
import type { Rng } from '../../engine/random';

/** The places a round of bubbles can float in. Each round draws one with the seeded RNG; the sticker and map icon stay on the shore. */
export const SCENES = ['shore', 'bath', 'night', 'sea'] as const;
export type SceneName = (typeof SCENES)[number];

export interface SceneLook {
  /** Sky (or wall, or water) gradient, top to the horizon. */
  sky: [number, number];
  /** Hills from back to front; the last is the ground (sand, bathwater). */
  hills: number[];
  horizon: number;
  clouds: number;
  sun: boolean;
  /** The rim of a plain bubble, light on a dark scene and darker on a pale one so it still shows. */
  rim: number;
}

export const LOOKS: Record<SceneName, SceneLook> = {
  shore: { sky: [0x8fd3f7, 0xe9f7ff], hills: [0x7cc4f2, 0xf6dfb0], horizon: 0.78, clouds: 3, sun: true, rim: 0x8fd0ff },
  bath: { sky: [0xa6e6e0, 0xe0f7f4], hills: [0x8fd6f0, 0x6cc3ea], horizon: 0.8, clouds: 0, sun: false, rim: 0x3d8fc4 },
  night: { sky: [0x141a4a, 0x39408a], hills: [0x2a3270, 0x1d2459], horizon: 0.8, clouds: 0, sun: false, rim: 0xcfe9ff },
  sea: { sky: [0x7fdbe8, 0x2f9fbf], hills: [0xf2dc9c, 0xe8c982], horizon: 0.88, clouds: 0, sun: false, rim: 0xeafaff },
};

/** The scene for a round: any of the four, so the same toy looks different from one round to the next. */
export const sceneFor = (rng: Rng): SceneName => rng.pick(SCENES);

const channel = (c: number) => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
/** WCAG relative luminance of a 0xRRGGBB color. */
export const luminance = (rgb: number) => 0.2126 * channel((rgb >> 16) & 255) + 0.7152 * channel((rgb >> 8) & 255) + 0.0722 * channel(rgb & 255);
/** WCAG contrast ratio, 1 (none) to 21. */
export const contrast = (a: number, b: number) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const lab = (rgb: number): [number, number, number] => {
  const [r, g, b] = [channel((rgb >> 16) & 255), channel((rgb >> 8) & 255), channel(rgb & 255)];
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const [x, y, z] = [f((0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047), f(0.2126 * r + 0.7152 * g + 0.0722 * b), f((0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883)];
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
};
/** How far apart two colors look (CIE76 ΔE: about 2 is a just-noticeable difference, 10 plainly different, 30 and up unmistakable). Hue counts, which luminance contrast misses. */
export const colorGap = (a: number, b: number) => Math.hypot(...lab(a).map((v, i) => v - lab(b)[i]) as [number, number, number]);

const mix = (a: number, b: number, t: number) => {
  const c = (shift: number) => Math.round(((a >> shift) & 255) * (1 - t) + ((b >> shift) & 255) * t);
  return (c(16) << 16) | (c(8) << 8) | c(0);
};

/** What a colored bubble (78% solid) looks like over a background color. */
export const bubbleOver = (color: (typeof RAINBOW)[number], bg: number) => mix(bg, swatch[color].fill, 0.78);

/** The backgrounds a bubble can sit on in a scene: the gradient's two ends and middle, and each hill. */
export const backgroundsOf = (look: SceneLook): number[] => [look.sky[0], mix(look.sky[0], look.sky[1], 0.5), look.sky[1], ...look.hills];
