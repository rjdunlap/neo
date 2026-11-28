/** Every color in the game comes from here. Each swatch has a fill, a darker outline and a light tint. */
export interface Swatch {
  fill: number;
  line: number;
  light: number;
}

/** A channel-wise step from one colour toward another, `t` of the way (0 stays, 1 arrives). */
export function toward(rgb: number, target: number, t: number): number {
  return [16, 8, 0].reduce((n, shift) => {
    const a = (rgb >> shift) & 0xff;
    const b = (target >> shift) & 0xff;
    return n | (Math.round(a + (b - a) * t) << shift);
  }, 0);
}

/**
 * A swatch for a colour mixed at Paint Mixer level 5: the measured mix as its fill (a test re-derives it from the
 * recipe), an outline a third of the way to ink, so a pale colour still has an edge, and a light tint half way to white.
 */
const mixed = (fill: number): Swatch => ({
  fill,
  line: toward(fill, 0x2b2b3a, 0.35),
  light: toward(fill, 0xffffff, 0.5),
});

export const swatch = {
  red: { fill: 0xf2545b, line: 0xc23a40, light: 0xffc4c4 },
  orange: { fill: 0xff9a3c, line: 0xd9731a, light: 0xffd2a8 },
  yellow: { fill: 0xffd54a, line: 0xd9a520, light: 0xfff0b3 },
  green: { fill: 0x7ccf5a, line: 0x4a9a35, light: 0xd6f5c8 },
  teal: { fill: 0x6fcfd0, line: 0x3a9a9b, light: 0xbff0ec },
  blue: { fill: 0x4fa3f7, line: 0x2f78c9, light: 0xcde6ff },
  purple: { fill: 0x9a6cf0, line: 0x6c45c4, light: 0xe2d6ff },
  pink: { fill: 0xff9ac1, line: 0xd96a96, light: 0xffd6e6 },
  white: { fill: 0xffffff, line: 0x8c8c9c, light: 0xf2f2f6 },
  brown: { fill: 0xc8956a, line: 0x8f6142, light: 0xecd2b8 },
  // The paint shelf's six (Paint Mixer level 5): pet colours once she has mixed them (batch paint-mixer 4).
  peach: mixed(0xfccc97),
  coral: mixed(0xf9b599),
  blush: mixed(0xfcd8c3),
  lavender: mixed(0xbdb4df),
  rose: mixed(0xdca7c1),
  lilac: mixed(0xdfcde2),
} satisfies Record<string, Swatch>;

export type ColorName = keyof typeof swatch;

/** The six colors toddlers learn first, in rainbow order. */
export const RAINBOW: ColorName[] = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];

/** The leaf pet's soft sage (the guide pet and Pip in games): greener and quieter than teal, so it sits with the brown and cream animal friends. */
export const petSage: Swatch = { fill: 0x8cc9a8, line: 0x548f74, light: 0xd3ecdd };
export const ink = 0x2b2b3a;
export const cream = 0xfff4e3;
/** The ground shadow under a button or card (RW14 slice 7), drawn at low alpha. */
export const shadow = 0x2b2440;
export const cheek = 0xff8fa3;
export const grass = 0xddf2cf;
export const wood = { fill: 0xd9a066, line: 0x9c6b3c, light: 0xf0c995 };
