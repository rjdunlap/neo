import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Two plants each give a sprout one copy. Work out what their sprouts can be, and what a plant\'s sprouts tell about it.',
  steps: [
    { from: 1, to: 3, text: 'Tap one copy under each plant, or drag it to its own slot. The sprout opens spotted or plain. Tapping the other copy swaps it, for free.' },
    { from: 1, to: 1, text: 'Then open all four buds. Each one is a way the two plants can give their copies.' },
    { from: 2, to: 2, text: 'Three buds are open. Tap the two glowing copies to grow the last one.' },
    { from: 2, to: 2, text: 'Choose every sprout these plants could make, then tap the leaf to check.' },
    { from: 3, to: 3, text: 'Both plants are spotted. Every bud is closed: tap the two glowing copies of each bud in turn to grow all four.' },
    { from: 3, to: 3, text: 'Choose a card: spotted sometimes, or always spotted. Then tap the leaf. The seed packet grows one way by chance, as often as she likes; it is free and never needed.' },
    { from: 4, to: 4, text: 'A friend wants a bed of spotted sprouts. Each of three cards shows a pair of plants with their copies. The magnifier above a card opens that pair\'s four ways, free, as often as she likes.' },
    { from: 4, to: 4, text: 'Tap every pair whose sprouts are always spotted, then tap the leaf. Sometimes two pairs both fit.' },
    { from: 5, to: 5, text: 'A spotted plant\'s copies are hidden under a seed packet. Tap the watering can: three of its sprouts with a plain plant grow onto the label.' },
    { from: 5, to: 5, text: 'Choose every card of copies the hidden plant could have, then tap the leaf. When both could, that is the right answer: water again and choose again. The seed packet button grows one more sprout by chance; it is free and never needed.' },
    { from: 6, to: 6, text: 'Tap a plant on the bench to plant it beside the hidden one (free to swap), then tap the watering can. The spotted plant grows spotted every way, so the pet shows why it can\'t tell and she picks again.' },
    { from: 6, to: 6, text: 'The plain plant grows six sprouts. Choose every card the hidden plant could have, then tap the leaf; sometimes both is right. The seed packet grows one more by chance, free.' },
    { from: 7, to: 8, text: 'A friend wants every sprout spotted and rimmed. Tap or drag a bench plant into a pot; tap a potted plant to send it back, free.' },
    { from: 7, to: 8, text: 'With both pots full, the spots lens and the rim lens each open the four ways for that marking, free, as often as she likes. Then tap the leaf.' },
    { from: 8, to: 8, text: 'Two pairs both work. After the first, she can plant the other for a second bed, or tap the Finish star.' },
  ],
  finish: [
    { from: 1, to: 1, text: 'Every bud is open: all four ways make a spotted sprout.' },
    { from: 2, to: 2, text: 'The leaf agrees: both sprouts can grow.' },
    { from: 3, to: 3, text: 'The leaf agrees: spotted three ways, plain one way, so spotted is not always.' },
    { from: 4, to: 4, text: 'The leaf agrees: the chosen pairs make a spotted sprout every way.' },
    { from: 5, to: 5, text: 'Check the second choice, then the packet opens on the hidden copies.' },
    { from: 6, to: 6, text: 'Check the choice, then the packet opens on the hidden copies.' },
    { from: 7, to: 7, text: 'The leaf agrees: every way spotted and every way a rim, and the bed fills.' },
    { from: 8, to: 8, text: 'The leaf agrees on either pair; a second plan, or the Finish star, ends the round.' },
  ],
  note: [
    { text: 'A toy rule, made for about 9 and up: a plant holds two copies, and one spot copy is enough for spots. Building a way is not choosing what a real plant makes. Letters on the tiles are for you; they are never spoken.' },
    { from: 2, to: 2, text: 'A wrong Check is one miss; the pet replays the way that was missed, and the second miss makes it glow. Show me does the next step; its first use in each part of the round counts one hint.' },
    { from: 3, to: 3, text: '"Always spotted" is one miss; the pet replays the plain way, and the second miss makes it glow. Try one never counts: four draws need not show all four ways. Show me does the next step; its first use in each part of the round counts one hint.' },
    { from: 4, to: 4, text: 'Made for about 10 and up. Opening a pair\'s four ways is free. A wrong Check is one miss: the pet replays a plain way of a chosen pair, or shows every way of a missed pair spotted, and the second miss makes the right pairs glow. Show me chooses them and counts one hint; she taps the leaf herself.' },
    { from: 5, to: 5, text: 'Made for about 10 and up. Spotted sprouts never prove two spot copies, however many grow; only a plain sprout settles it. Choosing one card where both could, or keeping two spot copies after a plain sprout, is one miss with the ways that show why; the second miss in a choice makes the right cards glow. Show me chooses them and counts one hint per choice; watering, Try one and the cards\' names are free.' },
    { from: 6, to: 6, text: 'About 10 and up. The plain plant could tell because a plain sprout might grow, not because one will. Trying the spotted plant is never a miss. A wrong Check is one miss, the second makes the right cards glow; Show me plants the plain plant, then chooses the cards, one hint each.' },
    { from: 7, to: 8, text: 'About 11 and up. The two markings are given independently in this toy, a rule chosen for the game: true of some real gene pairs, not of others that sit close together. A plant\'s look does not show every copy it carries, so the plant that already looks right can be a risky parent. Either working pair is right.' },
    { from: 7, to: 8, text: 'Planting, swapping and lenses are free. A Check with a pair that can fail is one miss, with the failing way replayed; the second makes a working pair glow. Show me plants one, one hint. After level 8\'s first plan, nothing counts.' },
  ],
};
