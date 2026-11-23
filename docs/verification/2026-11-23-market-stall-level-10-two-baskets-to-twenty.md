# 2026-11-23 — Market Stall level 10, Two baskets to twenty (PR #2071)

**Changed:** Market Stall level 10 adds three paired orders with distinct prices of 4–10 and totals of 11–19. Paying one price prompts the player to add both. After two misses the hint shows a payment, with one hint counted per order.

**Ran:** On the working diff based on `bbceef60a`, typecheck, 106 focused Market Stall tests and scoped format passed. At `http://127.0.0.1:5193`, `BROWSER_SUITE=woods WOODS_ONLY=shop FROM_LEVEL=10` passed at 390 × 844. Two one-price misses led to one hint. An exact payment without the ten-shell coin worked, the saved score was two misses and one hint, and the round earned one sticker. Reviewed the upright screenshot. `BROWSER_SUITE=fingerdemo FINGER_ONLY=market-stall FINGER_LEVELS=10 FINGER_BAND=school` passed in 22.3 s.

**Not run locally:** Full unit suite, build, offline and other browser suites.
