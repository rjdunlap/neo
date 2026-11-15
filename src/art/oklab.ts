export const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
export const toSrgb = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);
export const channels = (hex: number): [number, number, number] => [
  (hex >> 16) & 255,
  (hex >> 8) & 255,
  hex & 255,
];

function oklab(hex: number): [number, number, number] {
  const [r, g, b] = channels(hex).map((v) => toLinear(v / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** Oklab distance ×100: about 1–2 is a just-noticeable step side by side. */
export function oklabDistance(c1: number, c2: number): number {
  const a = oklab(c1),
    b = oklab(c2);
  return 100 * Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/** Blend two sRGB fills along a straight segment in OKLab. */
export function mixOklab(from: number, to: number, t: number): number {
  if (t === 0) return from;
  if (t === 1) return to;
  const end = oklab(to);
  const [light, a, b] = oklab(from).map((value, i) => value + (end[i] - value) * t);
  const l = (light + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (light - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (light - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const [r, g, blue] = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((value) => Math.round(Math.min(1, Math.max(0, toSrgb(value))) * 255));
  return (r << 16) | (g << 8) | blue;
}
