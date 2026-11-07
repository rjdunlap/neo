import type { GameHowTo } from '../types';

/** The grown-ups' how-to card for this game; src/content/howto.ts gathers every card into HOW_TO. */
export const HOW_TO: GameHowTo = {
  goal: 'Change examples so circles go to the tree and squares to the house.',
  steps: [
    {to:1,text:'Tap an example without a dock, then the tree or house. The first two examples stay fixed.'},
    {from:2,text:'Watch the free surprise. Back → Examples: choose a labelled card, then a slot. Any offered card can repair this lesson.'},
    'Test opens practice: arrows choose a parcel; Send shows its route for free. Back returns. Check submits the lesson.',
    'Show me makes one useful change for one hint. Change opens Undo/Reset; select an added example to Remove. Stop cancels delivery.',
  ],
  finish: 'After a successful Check, tap Back, then All delivered. Editing requires another Check.',
  note: 'Each failed Check counts one miss; Test and edits are free. This toy fits six fixed rules by fewest disagreements, breaking ties in color/shape/stamp order. Practice may overlap training. Swap choosing examples and tests.',
};
