import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Give the pet a fluffy makeover.',
  steps: [
    { from: 11, to: 11, text: 'Listen for two colors and paint both into the fur. Choose where each goes; the picture shows the two colors together.' },
    { from: 12, to: 12, text: 'Make the requested length or curls, then check in the mirror. After loving it, the pet asks for the opposite on the same hair: grow and snip reverse each other, as do curl and comb.' },
    { from: 9, to: 9, text: 'Two customers keep their own pictured two-part requests. Tap either head or card to choose, then use the tools on that head. Tap a card to hear its request again.' },
    { from: 10, to: 10, text: 'Grow or snip your pet’s fur to make it clearly longer or shorter than Pip’s, as asked. Pip’s fur stays fixed; tap the cards to hear the comparison again.' },
    { from: 6, to: 6, text: 'Pat or stroke the fluffy fur on the pet: it grows under your finger.' },
    { from: 7, to: 7, text: 'Tap grow and drag over the fur to make it long, then tap snip and drag over it to cut it short.' },
    { from: 8, to: 8, text: 'Listen for the color the pet wants, tap that bottle, then drag over the fur to paint it.' },
    { to: 5, text: 'Tap a tool, then drag or tap on the pet to use it.' },
    { from: 3, to: 4, text: 'Listen for what the pet wants (like "make it long", or "short and blue") and use the tools to do it.' },
    { from: 5, to: 5, text: 'Look at the pictured style and use the tools to copy its length, curls and color.' },
  ],
  finish: [
    { from: 11, to: 11, text: 'Tap the mirror to check: at least 35% of the strands must have each requested color. Any arrangement that does so finishes.' },
    { from: 12, to: 12, text: 'Check both requests in the mirror. The second check finishes the round with one sticker.' },
    { from: 9, to: 9, text: 'Tap the mirror to check the chosen customer. Both requests must be met; either order finishes the round.' },
    { from: 10, to: 10, text: 'Tap the mirror to compare two straight sample locks with aligned tops and lines across their tips. A clear difference in the asked direction finishes the round.' },
    { from: 6, to: 6, text: 'When the fur is fluffy the pet shakes and a big mirror appears: tap it to finish. If nobody taps, the pet looks in the mirror by itself after 20 seconds.' },
    { from: 7, to: 7, text: 'After some styling a mirror appears and the pet asks for it: tap the mirror to finish.' },
    { to: 2, text: 'After some styling a mirror appears and the pet asks for it: tap the mirror to finish.' },
    { from: 3, to: 3, text: 'Each request finishes by itself as soon as the hair is right; the round ends after the last one.' },
    { from: 8, to: 8, text: 'Each color finishes by itself as soon as it covers the fur; the round ends after the second one.' },
    { from: 4, to: 5, text: 'Tap the mirror to check each request; the round ends after the last one.' },
  ],
  note: [
    { from: 11, to: 12, text: 'Styling stays open to exploration. Only an unfinished mirror check is a miss; after two, a useful tool glows (one hint per request). The style is not saved.' },
    { from: 11, to: 11, text: 'The hint names the missing color and glows strands that can take it while leaving enough of the other color.' },
    { from: 9, to: 10, text: 'Styling is exploration. Only an unfinished mirror check counts as a miss; after two for that customer, the tool for what still needs doing glows (one hint). The style is not saved.' },
    { from: 10, to: 10, text: 'Practice directly comparing lengths: longer and shorter (K.MD.A.2). No counting or units are asked.' },
    { to: 2, text: 'Any look is welcome in free play and nothing counts as a miss; a touch off the fur makes the pet giggle.' },
    { from: 6, to: 7, text: 'Any look is welcome and nothing counts as a miss or a hint; a touch off the fur makes the pet giggle.' },
    { from: 8, to: 8, text: 'A wrong bottle still paints and the pet only names its color; after two wrong bottles the asked one glows (one hint).' },
    { from: 3, to: 3, text: 'Nothing counts as a miss. After 15 seconds without working on what was asked, the tool that helps glows, which counts as a hint.' },
    { from: 4, to: 5, text: 'Looking in the mirror too early counts as a miss, and the pet says what is still missing (when the color is nearly there, the strands still the old color glow); after two, the tool that helps glows, which counts as a hint.' },
  ],
};
