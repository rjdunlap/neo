// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.story-steps': ['Story Steps!'],
  'story.start': [
    '{story}! Drag the picture that comes next into the glowing space. The music button tells the pictures we have placed.',
  ],
  'story.wrong': ['What happened before this picture? Let us try another one.'],
  'story.hint': ['Try this glowing picture next!'],
  'story.step': ['{step}'],
  'story.cause.start': ['{effect} What made that happen? Drag its picture into the glowing space before it.'],
  'story.cause.wrong': ['{action} That makes something else happen. What made the picture above happen?'],
  'theater.start': [
    'Let’s make a picnic show! Pick a friend, the weather, and something to bring. Tap the stage with the triangle to watch. Every story is yours.',
  ],
  'theater.start.compare': [
    'Make a picnic show! Pick a friend, the weather, and something to bring. Watch it, then change one thing and watch what happens differently.',
  ],
  'theater.choose': ['Choose one picture from each pair: who, the weather, and what to bring.'],
  'theater.pick.bunny': ['Bunny will star in your show.'],
  'theater.pick.bear': ['Bear will star in your show.'],
  'theater.pick.sun': ['Sunshine for your story.'],
  'theater.pick.rain': ['Rain for your story.'],
  'theater.pick.blanket': ['Bring a picnic blanket.'],
  'theater.pick.umbrella': ['Bring an umbrella.'],
  'theater.keepcast': [
    'Keep the same friend for this comparison. Change the weather or what your friend brings.',
  ],
  'theater.scene.bunny': ['Bunny sets off for a picnic.'],
  'theater.scene.bear': ['Bear sets off for a picnic.'],
  'theater.scene.sun': ['The sun shines on the picnic spot.'],
  'theater.scene.rain': ['Then rain begins to fall on the picnic spot.'],
  'theater.scene.blanket': ['Our friend spreads out a picnic blanket.'],
  'theater.scene.umbrella': ['Our friend opens an umbrella.'],
  'theater.end.sun-blanket': ['The grass is dry. Our friend sits on the blanket for a sunny picnic!'],
  'theater.end.sun-umbrella': ['The umbrella makes a shady spot. Our friend enjoys a picnic in the shade!'],
  'theater.end.rain-blanket': [
    'The blanket gets wet in the rain. Our friend takes it inside and has a cozy indoor picnic!',
  ],
  'theater.end.rain-umbrella': [
    'The umbrella keeps the rain off. Our friend stays outside for a sheltered picnic!',
  ],
  'theater.revise': [
    'Now change the weather or what your friend brings, then tap the stage to watch again. We will compare it with the first show.',
  ],
  'theater.bow': [
    'That is your story! Tap the green check to take a bow, or choose something different and watch another show.',
  ],
  'theater.undo': ['Your last choice is back.'],
  'theater.watchfirst': [
    'Watch your whole story before taking a bow. Pick one picture from each pair, then tap the stage with the triangle.',
  ],
  'theater.help.choose': [
    'The glowing picture is one choice you could make. Any picture in that pair belongs in your story.',
  ],
  'theater.help.change': [
    'Try changing the weather. The first show stays beside the stage. Then watch again to see what changes.',
  ],
  'theater.help.watch': ['Tap the glowing stage with the triangle to watch your story.'],
  'theater.help.bow': ['Your show is ready. Tap the glowing green check to take a bow and finish.'],
  'theater.compare.weather.blanket': [
    'We kept the blanket and changed the weather. In sunshine the picnic stays outside. In rain the blanket gets wet, so our friend goes inside. Tap the green check when you are ready to take a bow.',
  ],
  'theater.compare.weather.umbrella': [
    'We kept the umbrella and changed the weather. In sunshine it makes shade. In rain it keeps the rain off. Tap the green check when you are ready to take a bow.',
  ],
  'theater.compare.prop.sun': [
    'We kept the sunshine and changed what our friend brought. The blanket is a place to sit. The umbrella makes shade. Tap the green check when you are ready to take a bow.',
  ],
  'theater.compare.prop.rain': [
    'We kept the rain and changed what our friend brought. With the blanket our friend goes inside. The umbrella keeps the rain off for a picnic outside. Tap the green check when you are ready to take a bow.',
  ],
  'theater.done': ['A bow for the storyteller!'],
  'story.predict.start': [
    'Look at the three pictures. What will happen next? Drag an ending into the glowing space. Tap a picture to hear it, or the music button to hear the clues again.',
  ],
  'story.predict.try': ['That could happen, but look at {clue}. Try the ending that this clue points to.'],
  'story.predict.reason': ['{reason}'],
  'story.untangle.start': [
    'Two stories! {first} is in the top row. {second} is in the bottom row. Drag each picture to the next glowing space in its own story. Tap the picture beside a row to hear its name.',
  ],
  'story.untangle.row': ['{story}. Put this story in the row beside this picture.'],
  'story.untangle.wrong': [
    'Does this picture belong with {first} or {second}? What happens next in this row?',
  ],
  'story.repair.start': [
    '{story}! These pictures are mixed up. Tap one picture, then another, to swap them. The music button tells this story; the curved arrow undoes your last swap.',
  ],
  'story.repair.select': ['{step} Tap another picture to swap these two.'],
  'story.repair.swap': ['The pictures swapped. Does the story happen in this order?'],
  'story.repair.undo': ['We put those two pictures back. Try another order.'],
  'story.repair.hint': [
    'The glowing picture is out of place. This part belongs there: {step} Find its picture and swap them.',
  ],
  'story.repair.done': ['The story is in order! Let us hear what happens.'],
  'story.cause.because': ['{explanation}'],
} satisfies Record<string, string[]>;
