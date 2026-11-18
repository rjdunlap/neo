# Example Express

<!-- generated: from src/games/example-express; edit the text below the end mark (npm run game-docs) -->

**ID:** `example-express` · **Land:** Tinker Lab · **Ages:** school · **Challenge:** logic · **Plays by:** touch · **Ghost finger:** yes

**Skills:** changing labelled examples, observing a fitted rule, testing and revising

| Band | Levels, easiest first |
| --- | --- |
| school | 1–3 |

| Level | Plays like |
| --- | --- |
| 1 | Show, then send: label two examples and check fresh parcels |
| 2 | A surprising parcel: repair a color rule with examples |
| 3 | Choose the lesson: pick up to four examples and their docks |

<!-- end generated -->

**Starts as:** label parcel examples, test the fitted sorter and repair a surprising route

**Grows into:** levels 1–2: label two examples; add any of ten accepted repairs. Level 3: choose up to four examples from all eight parcels and their docks, and teach any shape lesson. Six-rule local fitting, free Test, deliberate Check, Undo/Reset, finite Show me and All delivered. Tinker Lab

## Design notes

*Levels 1–3 · [finite definition](../definitions/example-express.md).* Teach a toy parcel depot with examples, then watch its deliveries. The request sends circles to the tree and squares to the house. Eight authored parcels vary in color, shape and leaf/star stamp; no image recognition or external AI service. Six single-feature rules compete by fewest disagreements with the supplied labels, then fixed order (blue, yellow, circle, square, leaf, star to tree; the opposite value to house). Empty training has no route. Only the fitted rule appears as two feature-to-dock pictures with Hear rule; examples disagreeing with that rule carry a double-arrow mark.

**1 Show, then send:** 0→tree and 2→house stay fixed; tap pending parcels 5 and 7, then a pictured dock. Check sends fresh parcels 1 and 3; only 5→tree and 7→house passes. **2 A surprising parcel:** fixed 0→tree and 7→house select color. The free opening Test visibly sends yellow circle 4 to house instead of tree. After arrival, Back → Examples offers [4→tree, 3→house, 5→tree, 2→house]; choose one and a slot. Both open slots support removal/replacement. All four singletons and six two-card subsets pass; no preferred recipe is required. Practice tray [4,3,1,6] can overlap training.

Test/Send, browsing, edits and observed sorter errors are free. Check snapshots the examples, sends each evaluation parcel and adds exactly one miss per completed failed submission, including incomplete labels. Stop, pointer cancellation, resize and Home abandon unfinished verdicts. After two failures the next solver-backed useful slot/card glows without adding a hint. Show me demonstrates one useful training transaction for one hint; repeated requests while busy or on an already passing board cost nothing. It follows a shortest legal path through the same fitter and never installs a rule. Change opens Undo/Reset and Remove for a selected added example; history restores examples but never counters or the seen-surprise flag.

A successful Check offers Back → All delivered, which alone finishes once through the shell; any edit invalidates that verdict. Route narration completes before the next parcel. Both levels have real-target ghost-finger demos; level 2 shows 4’s surprise, inserts 4→tree, retests it and checks. Co-play: swap curating examples and choosing practice parcels. No six-rule inspector, pre-K, older registration, saved lesson or broad learning/AI reliability claim. Actual device speech, touch comfort and child/coplayer observation remain open.

**3 Choose the lesson:** four open slots, no locked cards. Examples opens a shelf of all eight parcels; a tapped parcel lands in the tapped slot (or the first open one) and waits there, outside the fit, until a tree or house dock is tapped. Tapping an example then a dock relabels it; Examples then a parcel swaps it; Change → Remove takes it out; Undo and Reset as before. Check sends the visible practice tray 0, 3, 5, 6, and every lesson of one to four examples whose fitted rule is shape passes (212 lessons, 132 of them request-labelled). A noisy lesson passes with a spoken line naming the differently-labelled example, with no miss. An empty Check or one with a waiting card counts one miss and names no route. Show me makes one useful change per hint (insert with its dock, relabel or remove) along a shortest path, preferring a request-labelled lesson when one is as near (deepest path 4). The ghost finger builds blue circle leaf to tree and blue square leaf to house, tests the yellow circle with a star, then checks. The practice tray is called practice and a practice parcel can also be one of her examples, so nothing claims held-out accuracy, a test set or fairness findings. The two-miss glow also outlines the dock, Examples, Change and Remove controls the next step uses.

**What the guide repeats.** Level 2's `ee.surprise`, said after the opening yellow circle goes to the wrong dock ("Choose an example to help it use shape."), is an instruction (`ctx.instruct`), so the guide repeats it and the caption keeps it instead of the opening "Watch this yellow circle" line. `ee.success` stays `say` because an edit after a passed check withdraws the pass; the panel prompts, rule read-outs and route results are replies.
