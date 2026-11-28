# 2026-11-28 — Mix and offline checks wait on scene time

**Changed:** three local checks that failed on `main` (found by PR #2314) were the checks, not the app.
- Since the paper look, the headless Chromium in a cloud container (SwiftShader, 4 cores) draws a place at about 2–3 frames a second (4 with `?nopaper`); the paper pass's own JavaScript is about 1 ms a frame, so the cost is software rendering. `App` clamps each frame's step to 50 ms, so scene time runs well behind the wall clock there.
- `DISCOVERY_ONLY=my-mix`: the 0.6 s hold is scene time, a dozen frames; its 5 s wait for the table is now 20 s.
- `npm run test:offline` (root and classic): every fixed `waitForTimeout` after a click is now `sceneWait` (new `scripts/offline/frames.mjs`), which counts the same clamped frame steps the app does. On a fast machine it waits as long as before; on a slow one the curtain, grow or menu has played out before the next fixed-coordinate click.
- `DISCOVERY_ONLY=mix` and `my-mix`: spoken lines are read from `voice.speak`/`speakIn` instead of `speechSynthesis.speak`. "Bubbles!" has a rendered clip, which plays as audio and never reaches device speech, so the title-tap assertion missed it.

**Ran:** headless Chromium (`BROWSER_EXECUTABLE=/opt/pw-browsers/chromium`) on the dev server: `BROWSER_SUITE=discovery DISCOVERY_ONLY=mix` **passed**, `DISCOVERY_ONLY=my-mix` **passed**. On a production build and preview: `OFFLINE_SUITE=root npm run test:offline` **passed** (about 2 minutes), `OFFLINE_SUITE=classic` **passed** (slower than before at this frame rate). `prettier --check` on the changed scripts.

**Not run:** unit tests, typecheck and build (no `src/` change; CI runs them). The `line 109` mix failure PR #2314 recorded did not reproduce here; the title-tap one did.
