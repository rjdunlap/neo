import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Load the camel and walk it to the next water, a day at a time.',
  steps: [
    { from: 1, to: 1, text: 'Tap the camel so it kneels, then tap each bale; tap the camel again and off it goes.' },
    { from: 2, to: 2, text: 'Count the suns on each road; tap the water the camel can reach with two days in its skin.' },
    { from: 3, to: 3, text: 'Tap the stops one at a time all the way to the city so no leg is longer than the skin, then tap Go.' },
    { from: 4, to: 4, text: 'At each stop, give the camel what the next stop wants (look at its bubble), then tap Go.' },
    { from: 5, to: 5, text: 'Tap each load to count its shells at the glowing stop; send the one that brings more.' },
    { from: 6, to: 6, text: 'Choose either road and tap how many days it will take (count the suns and any snow day), then tap Go.' },
    { from: 7, to: 7, text: 'Tap the green places to dig wells so no stretch is longer than a day\'s walk, then tap Done; fewer wells is better but any road that works is fine.' },
  ],
  finish: 'The camel drinks for a long moment at the water.',
  note: [
    { from: 1, to: 1, text: 'Nothing is counted. Loading, unloading and the walk are all free; after a quiet moment the next thing to tap glows.' },
    { from: 2, to: 2, text: 'Counting suns and tapping the skin are never counted; only tapping an oasis is. The far water is one miss, and after two the near water glows, which counts as one hint. Long ago, on the long road from the east, the stopping places were a day\'s walk apart, so there was water at the end of every day.' },
    { from: 3, to: 3, text: 'Flagging, taking a flag out and counting suns are never counted; only Go is. A leg longer than the skin is one miss and the camel comes back to its last stop; after two the next good stop glows, which counts as one hint. Nobody walked the whole road: each caravan went a few stops and handed its load on.' },
    { from: 4, to: 4, text: 'Picking and swapping offers and tapping the bubbles are never counted; only Go is. A good the next stop does not want is one miss and the camel walks back; after two the right offer glows, which counts as one hint. The suns are always within the skin here. Long ago, goods changed hands again and again along the road, each trader taking them a little way.' },
    { from: 5, to: 5, text: 'Looking at the loads and the price boards is never counted; only Go is. The smaller load is one miss, with both sums spoken, and after two the better load glows, which counts as one hint. The better load swaps between the near oasis and the far city. Shells are counters for one sale only; nothing is kept. The same thing can be worth more in one place than another.' },
    { from: 6, to: 6, text: 'Either road is right; only the day count is checked. Choosing or switching roads and moving the card are never counted; only Go is. A wrong count is one miss (the camel stops on that day with the city still ahead, or arrives early) and after two the pet counts the chosen road\'s suns and the snow day while the right card glows, which counts as one hint. Long ago, there was an inn at the end of every day\'s walk. In the mountains a day\'s walk didn\'t go far, so the inns were closer together.' },
    { from: 7, to: 7, text: 'Extra wells are never a mistake; the fewest show faintly after. Only a Done leaving a stretch over four hoofprints is a miss; after two the next well glows (one hint). This follows Ashoka\'s seventh pillar edict (3rd century BCE): wells every eight kos and banyan trees for shade along roads, though the edicts show what a ruler intended more than what was built.' },
  ],
};
