/**
 * Count the Ballots' spoken lines (docs/definitions/count-the-ballots.md). A ride's name is a slot, so the lines stay on
 * device speech and no clip has to be rendered. The voice says what each counting rule found and never calls one fairer.
 */
export const VOICE = {
  'game.count-the-ballots': ['Count the Ballots'],
  'ballots.instruct.1': [
    'Nine villagers ranked the rides. Put each ballot in the pile of the ride it likes best. If no pile has five, the smallest pile is out.',
  ],
  'ballots.instruct.2': [
    'Nine villagers ranked the rides. Sort the ballots, move the smallest pile on, then say what the first count found.',
  ],
  'ballots.pick': ['Tap a ballot first.'],
  'ballots.wrong': ['That one likes the {ride} best.'],
  'ballots.wrong-next': ["That one's next choice is the {ride}."],
  'ballots.hint': ['Try the {ride}.'],
  'ballots.count': ['{ride}: {n}.'],
  'ballots.none': ['No ride has {need} yet. The {ride} is out.'],
  'ballots.runoff': ['Move each ballot to its next choice.'],
  'ballots.five': ['The {ride} has {n}!'],
  'ballots.ask': ['Count only the first choices. Which ride wins?'],
  'ballots.ask-wrong': ['Look at the first choices again. Which pile is biggest?'],
  'ballots.found': ['Most first choices: the {first}. Most villagers who can live with it: the {second}.'],
  'ballots.same': ['Most first choices and the run-off found the same ride: the {ride}.'],
};
