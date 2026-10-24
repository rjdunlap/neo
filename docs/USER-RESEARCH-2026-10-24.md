# User research review, 2026-10-24

*Research and recommendations only. Nothing here changes the app. Reviewed against `origin/main` at `83d2a3ce`.*

Puddle Island has three kinds of user: the developer's daughter (one year old this month), the grown-up who holds the iPad and plays with her, and the adults who play couch games on their own. This review asks what is known about each, what the app assumes about them, and where the two disagree. It draws on the project's own documents and verification record, a first-run walkthrough of the root app in Chrome as a new lap-band player, and published research on children under three and touchscreens. It did **not** observe the child, an iPad or a controller; that gap is the first finding.

## Headline findings

### 1. The primary user has never been observed, and the gap is widening

Every verification entry since the project began records headless Chrome and unit tests. [DEVICE-CHECKS](DEVICE-CHECKS.md) holds **241 open items**, most of them "device speech and child play remain unobserved", and its [fifteen-minute iPad session](DEVICE-CHECKS.md#one-ipad-session-about-fifteen-minutes) has never been run. In the same month the repository took about 3,200 commits and the catalog reached 131 games. The roadmap still says the immediate feedback loop is "grown-ups playing in a desktop browser".

That loop is informative for the grown-up and couch users. It says nothing about the one-year-old. Published usability work with children stops at about age three (NN/g's children studies cover 3 to 12; Sesame Workshop's tablet guide covers preschoolers), so no external study can stand in for watching her. The project's single most valuable research act is a five-minute observation on the iPad, repeated weekly, with the notes written down. [The protocol below](#a-five-minute-observation-protocol-for-the-lap-band) is built for that, and [OBSERVATIONS.md](OBSERVATIONS.md) is where the entries go.

### 2. At twelve to eighteen months she will tap, bang and swipe; dragging is not yet reliable

What a child this age does with a tablet, from the developmental and HCI literature:

- Tapping is the first reliable gesture. Sesame Workshop's review of more than fifty touchscreen studies found tapping the most intuitive gesture for preschoolers and dragging hard because children lose "finger-on-screen continuity"; it recommends accepting partial completion. A later practitioner summary recommends "tap, then tap the destination" instead of drag for under-fives.
- Children rest a wrist on the bottom edge of the device, so lower-corner hotspots fire by accident (the same guide). Puddle Island keeps its pet bottom-left and the Home button bottom-right on the result screen.
- Fine motor skill grows through the second year: at twelve months she points, bangs and puts things in containers; stacking and imitating chores arrive around eighteen months. Early active scrolling correlates with fine-motor milestones (TABLET project), but the direction of cause is unknown.
- Under-twos learn far less from a screen than from the same thing in the room: Strouse and Samson's 2021 meta-analysis puts the transfer deficit under 36 months at about three times the size of older children's. Repetition and a co-viewing adult who names what is happening are the two levers that shrink it.

How the app compares: the README counts 46 games with lap levels, and the how-to cards of 21 of them describe a drag, slide or pull. Several (Peg Garden, Bubble Pop, Pet Says, Peekaboo Barn) deliberately answer any touch at their easiest level, which is the right pattern. The rest were built for the grown-up's mouse. The recommendation is not to remove them but to audit each lap level for one question: **can a single finger that only taps finish this round?** Where it cannot, either add a tap-only path or move that level to toddler.

### 3. The grown-up is the real player at lap, and the app gives them a reading job

At lap the child cannot navigate, so the adult does. The walkthrough as a new lap player found:

| Step | What the adult does | What the child can do |
| --- | --- | --- |
| "Who's playing?" | Add a player: name, birth month, year | nothing |
| Hatch | hear "Tap the egg", tap it about seven times | tap the egg, if shown where |
| Color and name | pick a color, pick or type a name, green arrow twice | tap a color |
| Home | understand four unlabelled buttons and a ball | pat the creature, roll the ball |
| Explore | read four labelled cards (Places, Favorites, All games, Family play) | nothing |
| Places | read eleven land cards | nothing |
| Bubble Beach | choose among seven unlabelled game icons and a signpost | tap one |
| How-to card | read about ninety words, press Play | nothing |
| Round | a pink "GROWN-UP TIP" line sits inside the play field in 12-point type | play |
| Result | six round buttons: sticker, heart, next, again, back, home | tap any |

Eight adult decisions, three of them reading screens, precede the first round. Each piece is well made; the sequence is tuned for a four-year-old who navigates herself. For lap, the adult wants one thing: *start something she can do, now, and tell me in one sentence how to help.* Explore's Mix ("Little surprises") and the home spot's path already hold most of the parts.

Two smaller observations from the same walk. The how-to card shows "THIS LEVEL: 8" to a brand-new lap player, because Peg Garden's lap ladder correctly starts at its easiest entry (level 8, four huge flowers); a grown-up reads it as "my one-year-old is on level 8". The card's level line should carry the level's name, not its number. And nothing on the hatch screen shows the egg is tappable except the spoken line, so with sound off (an iPad's silent switch) the first screen is a still picture.

### 4. Breadth is now a cost at the younger bands

Hirsh-Pasek and colleagues' four pillars of a genuinely educational app are *minds-on* engagement, *no distraction* from the learning, *meaningfulness* to the child's life, and *social interaction*. Sago Mini and Toca Boca, the best-regarded toddler studios, ship a handful of toys with no levels, no text and no narrator. The AAP's 2016 statement notes that very few of the tens of thousands of "educational" apps meet any learning standard, and that under two the question is not what is on the screen but who else is in the room.

Puddle Island's design rules already match the pillars: no timers, no lives, one sticker per round, spoken support, co-play hints on 124 games. What does not match is the number. At eighteen months she will have three to five favorites and will ask for them by pointing. Each new lap or toddler game competes for the same few minutes and adds a card to the land she must be carried through. The catalog is an asset for later bands; for this one, depth in her observed favorites beats another game, and nothing can tell which games those are except watching.

### 5. The couch route serves its grown-ups, but has its own unobserved checks

The couch route grew for the developer's wife and then for grandparents on TV, laptop and touch. Its player guide is clear and its bot demos show the input in use. It has never been played with a real controller on a TV. That check is cheaper than the child's and needs only one evening; it belongs in the same first session.

## Recommendations, in priority order

| # | Recommendation | Why | Cost |
| --- | --- | --- | --- |
| R1 | **Run the fifteen-minute iPad session this week, and the five-minute lap observation below three times.** Write both in [OBSERVATIONS.md](OBSERVATIONS.md). | Nothing else here can be judged without it; it closes dozens of device checks at once | A person, no code |
| R2 | **Lap-level audit: every lap level finishes with taps alone.** Add a tap-then-tap or tap-anywhere path, or move the level to toddler. Guard it with a rule test per game where the logic allows | Drag is the least reliable gesture before three | Medium; one game per batch |
| R3 | **A lap start that needs no reading.** For a lap player, Home's green play button opens a round of a lap favorite (or Mix's next pick) directly; the card shows the ghost-finger demo and one sentence, with Play as the only other target. The full Explore stays one tap away | Removes three reading screens from every session | Medium; shell |
| R4 | **The card and tip talk to the adult in one line.** Level names instead of numbers on the card; the grown-up tip spoken once at round start and shown outside the play field | The adult is the player at lap and is holding the iPad one-handed | Small |
| R5 | **Make "This week" a research instrument.** Per round, record duration, touches that nothing answered, misses, hints and how the round ended (again, next, back, home, left). Show it as a short table and offer a copy button, so an observation entry is one paste | Turns every play session into data without a camera | Small to medium |
| R6 | **Pause new lap and toddler games until R1 has run twice.** Keep building at preschool and above, where the catalog has room, and spend the lap budget on R2 and R3 | Breadth no longer helps the youngest band; observed favorites decide what deserves depth | Process only |
| R7 | **Hatch and Home show what to touch when sound is off.** A wobble or sparkle on the egg; a bounce on the creature | iPads are often silent; speech is the only cue today | Small |
| R8 | **One couch evening with a real controller and a TV**, recorded as a device check | The route's whole premise is unobserved | A person, no code |

R1 and R8 are the developer's. R2 to R5 and R7 are build slices and should enter [READY](READY.md) through the usual claim, in the order above. R6 is a planning rule for the coordinator.

## A five-minute observation protocol for the lap band

Children under three cannot think aloud, and pairing them with another child does not work at this age, so the method is plain observation with a fixed set of things to look for, written down immediately. The adult who plays with her cannot also take notes, so either a second adult watches or the notes are written in the two minutes after.

**Before:** the iPad installed from the Home Screen, her profile chosen, sound on, the how-to card setting as it is for daily use. Pick one game from the lap shelf; the first three sessions should use the same game so repetition is visible.

**During, watch for:**

1. The first thing she does when the game appears (tap, bang, swipe, look at you, reach for the edge).
2. Dead touches: touches that nothing answered. Count roughly.
3. Whether she looks at the pet or at you when something happens.
4. Whether she repeats an action that worked.
5. How she leaves: hands it back, hits Home by accident, swipes out of the app, is lifted away, round ends.

**After, write one entry (ten lines at most) in [OBSERVATIONS.md](OBSERVATIONS.md):**

```
## 2026-10-26 · Peg Garden level 8 · build 83d2a3ce
Who held the iPad: parent, on a lap, landscape
First action: banged flat hand on the water
Dead touches: ~6 (hits on the pink tray, the card, the sun)
Looked at: the pet when the flower bloomed; me when confetti came
Repeated: tapped the same flower four times
Left by: hit Home with her palm at the second round
Adult said: "pearl", "flower", "pop" each time
Changed my mind about: the tip banner, she tried to grab it
```

Three entries decide more than a hundred Chrome checks. After the first three, pick the next game from what she went back to, not from the roadmap.

## What this review could not do

No child, iPad, controller or grandparent was observed. The walkthrough used a mouse in a 1024-by-768 Chrome tab, so hand size, speech voice, frame rate and the silent switch are untested. The research cited is about children in general; it tells us what is likely, not what she does. Every statement about her in this review is a hypothesis for the protocol to test.

## Sources

Project: [ROADMAP](ROADMAP.md#where-we-are), [DEVICE-CHECKS](DEVICE-CHECKS.md), [VERIFICATION](VERIFICATION.md), [FAMILY-EXPERIENCE](FAMILY-EXPERIENCE.md), [DISCOVERY](DISCOVERY.md), [rework README](rework/README.md), `src/parent/panel.ts`, `src/content/howto.ts`, `src/games/peg-garden/index.ts`.

External:

- Hirsh-Pasek, Zosh, Golinkoff, Gray, Robb and Kaufman (2015), [Putting Education in "Educational" Apps](https://www.psychologicalscience.org/publications/educational-apps.html), *Psychological Science in the Public Interest* 16(1).
- Sesame Workshop (2012), [Best Practices: Designing Touch Tablet Experiences for Preschoolers](https://joanganzcooneycenter.org/?p=19607), via the Joan Ganz Cooney Center.
- Joan Ganz Cooney Center, [The New Coviewing: Designing for Learning through Joint Media Engagement](https://joanganzcooneycenter.org/publication/the-new-coviewing-designing-for-learning-through-joint-media-engagement/) and [Designing Apps for Co-Play](https://joanganzcooneycenter.org/?p=12518).
- Strouse and Samson (2021), meta-analysis of the transfer deficit, summarized in [Frontiers in Psychology](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2020.576940/epub) and [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC7868415); Barr's earlier [review of 2D to 3D transfer](https://pubmed.ncbi.nlm.nih.gov/20563302).
- [Toddlers' fine motor milestone achievement is associated with early touchscreen scrolling](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4969291/) (TABLET project, 2016).
- NPR, [American Academy of Pediatrics lifts "no screens under 2" rule](https://www.npr.org/sections/ed/2016/10/21/498550475/american-academy-of-pediatrics-lifts-no-screens-under-2-rule) (2016 policy statement).
- Nielsen Norman Group, [Design for Kids Based on Their Stage of Physical Development](https://www.nngroup.com/articles/children-ux-physical-development/) and the [young users topic](https://www.nngroup.com/topic/young-users/).
- Kidscreen (2015), [Sago Sago dishes on developing for the preschool market](https://kidscreen.com/2015/04/09/sago-sago-dishes-on-developing-for-the-preschool-market).
- Khan Academy blog, [Supporting English Language Acquisition with Khan Academy Kids](https://blog.khanacademy.org/supporting-english-language-acquisition-with-khan-academy-kids/).
- [Design Considerations for Little Fingers](https://uxdesign.cc/design-considerations-for-little-fingers-ad2a19ed3816) (practitioner article on tap-and-tap for under-fives).
- CDC, [Developmental Milestones](https://www.cdc.gov/ncbddd/actearly/milestones/) (12, 15 and 18 months).
- Als, Jensen and Skov, [Comparison of think-aloud and constructive interaction in usability testing with children](https://homes.cs.aau.dk/~dubois/papers/p443-als.pdf).
