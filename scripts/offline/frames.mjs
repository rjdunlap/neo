/**
 * Waits `ms` of the app's own scene time rather than the wall clock. `App` clamps each frame's step to 50 ms, so when a
 * software-rendered headless browser draws only a few frames a second, a fixed timeout ends before a curtain, a grow or
 * a menu's arrival has played out and the next fixed-coordinate click lands on the old screen. Counting the same clamped
 * steps waits exactly as long as a fixed timeout on a fast machine, and as many frames as the scene needs on a slow one.
 */
export function sceneWait(page, ms) {
  return page.evaluate(
    (ms) =>
      new Promise((resolve) => {
        let total = 0;
        let last = performance.now();
        const frame = (now) => {
          total += Math.max(0, Math.min(now - last, 50));
          last = now;
          if (total >= ms) resolve();
          else requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      }),
    ms,
  );
}
