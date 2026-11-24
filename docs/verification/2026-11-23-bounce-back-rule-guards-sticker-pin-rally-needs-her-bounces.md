# 2026-11-23 — Bounce Back rule guards (sticker pin, rally needs her bounces)

**Changed:** `src/games/bounce-back/logic.test.ts` only: a snapshot pin of the sticker drawings for seeds 0–99, and a plan test that every rally-counted goal needs at least two of her own bounces (no single pet-only rally finishes a round). No game code changed.
**Ran:** typecheck and the Bounce Back rule tests (17 passing).
**Not run:** `BATCH_ONLY=bounce` browser play (test-only change).
