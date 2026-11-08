// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'seesaw.twins': [
    'Two boxes weigh the same. Balance both boxes with blocks, then find how heavy one box is.',
  ],
  'seesaw.each': [
    'Both boxes weigh {n} blocks together. They weigh the same. How many blocks heavy is one box?',
  ],
  'seesaw.twins-hint': [
    'Share the {n} blocks into two equal groups. Each box weighs {each} blocks. Count each group with me.',
  ],
  'game.seesaw-balance': ['Seesaw!'],
  'seesaw.sort': [
    'Test the presents on the seesaw. Put them on the shelf from light to heavy: little block, middle block, big block.',
  ],
  'seesaw.sort-hint': [
    'That spot is for a different weight. Try two presents on the seesaw. The heavier one goes down.',
  ],
  'seesaw.guess': ['How many blocks heavy is the pumpkin? Make a guess!'],
  'seesaw.guessed': ['You guessed {guess}. Now let us measure!'],
  'seesaw.measure-pumpkin': ['Add blocks until the pumpkin and the blocks balance.'],
  'seesaw.pumpkin-answer': ['Level! How many blocks heavy is the pumpkin?'],
  'seesaw.guess-exact': ['You guessed {guess}. It weighs {n}. Just right!'],
  'seesaw.guess-close': ['You guessed {guess}. It weighs {n}. Close!'],
  'seesaw.guess-more': ['You guessed {guess}. It weighs {n}. A bit more than your guess!'],
  'seesaw.guess-less': ['You guessed {guess}. It weighs {n}. A bit less than your guess!'],
  'seesaw.predict': [
    'Which side will go down? Or will it stay level? Tap a tray or the equal sign in the middle to predict.',
  ],
  'seesaw.predict-sums': ['On the left, {a} and {b} make {left}. On the right, {c} and {d} make {right}.'],
  'seesaw.predict-equal': ['Both sides weigh the same, so the seesaw stayed level.'],
  'seesaw.predict-down': ['{heavy} is more than {light}, so the heavier side went down.'],
  'seesaw.predict-continue': ['Tap the green arrow to continue.'],
  'seesaw.difference': [
    'The {heavy} is heavier than the {light}. How much heavier? Add blocks to the light side until it is level.',
  ],
  'seesaw.already-down': ['That side is already down. Add blocks to the side that is up.'],
  'seesaw.difference-answer': ['Level! How many blocks did it take?'],
  'seesaw.difference-yes': ['It took {n} blocks. That is how much heavier!'],
  'seesaw.bounce': ['Touch the empty end. Make your little friend go up!'],
  'seesaw.ask-heavy': ['Who is heavier? Tap the heavy one.'],
  'seesaw.ask-light': ['Who is lighter? Tap the light one.'],
  'seesaw.hint-heavy': [
    'That one went up, so it is lighter. The heavy one went down. Tap the one that went down.',
  ],
  'seesaw.hint-light': [
    'That one went down, so it is heavier. The light one went up. Tap the one that went up.',
  ],
  'seesaw.yes-heavy': ['Yes! The heavier friend went down!'],
  'seesaw.yes-light': ['Yes! The lighter friend went up!'],
  'seesaw.up': ['Make the {animal} go up! Put a friend on the other side.'],
  'seesaw.heavy': ['Make the {animal} go up! Who is heavy enough?'],
  'seesaw.other': [
    'Oops, the same side! Put a friend on the other side.',
    'That is the same side. Try the other side.',
  ],
  'seesaw.light': [
    'Too light! The {animal} is still down. Try a bigger friend.',
    'Not heavy enough. The {animal} is still down. Try a bigger friend.',
  ],
  'seesaw.wee': ['Wheee! Up goes the {animal}!', 'Up, up, up!'],
  'seesaw.level': ['Make the seesaw level! Put blocks on the other side.'],
  'seesaw.this-side': ['Put them on the other side!'],
  'seesaw.too-many': [
    'Too heavy! That side went down. Take one off.',
    'Oh, that side is too heavy. Take one off.',
  ],
  'seesaw.balanced': ['Level! Just the same!', 'Balanced!'],
  'seesaw.heaviest': [
    'Which present is the heaviest? Try them on the seesaw, then put the heaviest one in the wagon!',
  ],
  'seesaw.not-heaviest': ['Hmm, another present is heavier. Try them on the seesaw!'],
  'seesaw.heaviest-yes': ['Yes! That is the heaviest present!'],
  'seesaw.parts': ['This side weighs {n}. Make the other side weigh {n} too!'],
  'seesaw.mystery': ['How heavy is the mystery box? Add blocks until the seesaw is level!'],
  'seesaw.how-many': ['Level! How many blocks heavy is the box?'],
  'seesaw.box': ['The box weighs {n} blocks!'],
  'seesaw.count-again': ['Let us count the blocks together.'],
  'seesaw.done': ['What a great balancer!'],
  'seesaw.same': [
    'The box and its blocks weigh the same as the blocks on the other side. Take the same off both sides, until the box is alone. Keep it level!',
  ],
  'seesaw.same-boxes': [
    'Boxes on both sides! Every box weighs the same. Take a box for a box and a block for a block, until one box is alone. Keep it level!',
  ],
  'seesaw.tipped': [
    'It tipped! Do the same to the other side to make it level again.',
    'Uh oh, it tipped! Take the same thing off the other side too.',
  ],
  'seesaw.same-hint': ['Try the glowing one.'],
  'seesaw.still-level': ['Still level!', 'Level! Keep going.'],
  'seesaw.alone': ['The box is alone, and the seesaw is level. How many blocks heavy is the box?'],
  'seesaw.share': [
    'Take the same things off both sides. When two boxes are left, share the blocks fairly between them.',
  ],
  'seesaw.share-answer': [
    'Two boxes balance these blocks. Share the blocks fairly: how many blocks belong to each box?',
  ],
  'seesaw.pair-first': [
    'Two boxes today! First, the square box. It balances these blocks. How many blocks heavy is the square box?',
  ],
  'seesaw.pair-tag': ['The square box weighs {n}. It wears its number now.'],
  'seesaw.pair': [
    'Now the round box joins the square box. Take the same off both sides until the round box is alone. The square box counts as {n} blocks!',
  ],
  'seesaw.swap-tipped': ['The square box weighs {n} blocks. Take {n} blocks off the other side.'],
  'seesaw.closer': ['Closer! Keep going.', 'Nearly level! Keep going.'],
  'seesaw.round-stays': ['That is the box we are weighing. Leave it on, and take other things off.'],
  'seesaw.round-alone': [
    'The round box is alone, and the seesaw is level. How many blocks heavy is the round box?',
  ],
} satisfies Record<string, string[]>;
