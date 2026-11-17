/** The porch's motion, shared by both art-lab views so they move alike. Angles in radians, counter-clockwise on screen. */

export type LabView = {
  hello(): void;
  roll(): void;
  dispose(): void;
  /** What the renderer is drawing, for the readout. */
  detail(): string;
};
export type Mount = (host: HTMLElement, say: (text: string) => void, pixelRatio: number) => Promise<LabView>;

export const ROLL_SECONDS = 2.6;

export type Pose = { head: number; arm: number; breath: number; blink: boolean; roll: number };

/** `wave` and `roll` are the times each reaction last started (or far in the past). */
export function pose(time: number, wave: number, roll: number, reduced: boolean): Pose {
  const t = time - wave;
  const active = t >= 0 && t < 2;
  const r = (time - roll) / ROLL_SECONDS;
  return {
    head: active ? Math.sin(t * 3) * 0.08 : reduced ? 0 : Math.sin(time * 0.9) * 0.025,
    arm: active
      ? Math.sin((Math.min(t * 4, 1) * Math.PI) / 2) *
        (0.65 + Math.sin(t * 13) * 0.2) *
        Math.min(1, (2 - t) * 4)
      : 0,
    breath: 1 + (reduced ? 0 : Math.sin(time * 2) * 0.008),
    blink: time % 4.7 < 0.14,
    roll: r >= 0 && r < 1 ? Math.sin(Math.PI * r) : 0,
  };
}
