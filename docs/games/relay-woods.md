# Relay Woods

<!-- generated: from src/games/relay-woods; edit the text below the end mark (npm run game-docs) -->

**ID:** `relay-woods` · **Land:** Cozy Village · **Ages:** toddler–school · **Challenge:** space · **Plays by:** touch · **Ghost finger:** yes

**Skills:** connections, route-planning, comparing-hops

| Band | Levels, easiest first |
| --- | --- |
| toddler | 1–2 |
| preschool | 1–4 |
| pre-K | 2–4 |
| school | 4 |

| Level | Plays like |
| --- | --- |
| 1 | Pass it along — tap the next connected friend |
| 2 | Two ways — follow either connected route |
| 3 | Fallen log — find a clear path around a log |
| 4 | The short way — deliver with the fewest hops |

<!-- end generated -->

**Starts as:** pass a picture along three connected friends

**Grows into:** either route, a visible log with retracing, then fewest hops; optional picture Keep

## Design notes

Tap a connected friend to pass an actual6×6 mosaic toward the waving receiver. Level1 has three friends in a line;2 offers two equal routes;3 places a visible log across one edge, with retracing back through the sender always possible;4 compares a two-hop route with a three- or four-hop route. Toddler1–2, preschool1–4, pre-K2–4, school4. Finite seeded graphs have3–6 carriers, all still reachable by clear paths. The sender is the customized companion; the receiver remains pictured in the request.

Every clear adjacent hop is allowed, including revisits. Level1 unjoined exploration is free; at2–4 deliberate unjoined taps count one miss. Crossing the visible log counts one miss, visiting that arm does not. At4 a longer arrival celebrates, compares actual/fewest hop ribbons, counts one miss, then retries the same graph and picture. Start over clears the walk for free and preserves errors/help. Help is capped at one per round, including automatic glow after two errors; BFS from the holder suggests a clear next friend or Start over when a shortest finish is no longer possible. Repeated Help can finish through ghost-finger inputs. Cancellation, outside releases, holder/busy/stale taps do not count. Down feedback is immediate, inside release commits one hop; reduced motion transfers immediately.

Flower, cake, kite, a captured-color toy-face portrait and a musical-note picture are five fixed bounded mosaics. One accepted delivery finishes through the shell once for one sticker and optional Keep in the existing shared picture slot; arrival alone changes no picture ownership. No tune recording, real contact, network access, mailbox, inventory, privacy/lock lesson or later levels. Voice, a level-scoped card and four public-input demos are included. Level4’s instructional demo shows one longer arrival/retry before its shortest route. Device speech/reach and child recognition/enjoyment remain open.
