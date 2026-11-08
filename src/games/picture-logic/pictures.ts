/**
 * The pictures Picture Logic's puzzles hide, drawn as rows of characters: `.` is an empty square and a letter is a filled one,
 * in a palette color (`r` red, `o` orange, `y` yellow, `g` green, `b` blue, `p` pink, `u` purple, `n` brown). The puzzle only asks
 * whether a square is filled; the colors are what the finished picture turns into. Every picture here can be solved by line logic
 * alone (each row and column on its own, again and again), which a test checks.
 *
 * A picture used by a challenge course is frozen with it: change one and that course's version must change too.
 */
export interface DrawnPicture {
  /** Said when the picture is finished: "It is a sailboat!" */
  name: string;
  rows: readonly string[];
}

export const SAILBOAT: DrawnPicture = {
  name: 'a sailboat',
  rows: [
    '....n.....',
    '....rr....',
    '...rrrr...',
    '..rrrrrr..',
    '.rrrrrrrr.',
    '....n.....',
    '.nnnnnnnn.',
    '..nnnnnn..',
    'bbbbbbbbbb',
    '..........',
  ],
};
export const HEART: DrawnPicture = {
  name: 'a heart',
  rows: [
    '..........',
    '.rrr..rrr.',
    'rrrrrrrrrr',
    'rrrrrrrrrr',
    'rrrrrrrrrr',
    'rrrrrrrrrr',
    '.rrrrrrrr.',
    '..rrrrrr..',
    '...rrrr...',
    '....rr....',
  ],
};
export const HOUSE: DrawnPicture = {
  name: 'a house',
  rows: [
    '..........',
    '....rr....',
    '...rrrr...',
    '..rrrrrr..',
    '.rrrrrrrr.',
    '.yyyyyyyy.',
    '.ybbyyyyy.',
    '.ybbyynny.',
    '.yyyyynny.',
    '.yyyyynny.',
  ],
};
export const TREE: DrawnPicture = {
  name: 'a tree',
  rows: [
    '...gggg...',
    '..gggggg..',
    '.gggggggg.',
    '.gggggggg.',
    '.gggggggg.',
    '..gggggg..',
    '...gggg...',
    '....nn....',
    '....nn....',
    '....nn....',
  ],
};
export const MUSHROOM: DrawnPicture = {
  name: 'a mushroom',
  rows: [
    '...rrrr...',
    '.rrrrrrrr.',
    'rrryyrrrrr',
    'rrryyrryyr',
    'rrrrrrryyr',
    'rrrrrrrrrr',
    '...nnnn...',
    '...nnnn...',
    '...nnnn...',
    '..nnnnnn..',
  ],
};
export const SMILEY: DrawnPicture = {
  name: 'a smiley face',
  rows: [
    '....yy....',
    '..yyyyyy..',
    '.yyyyyyyy.',
    '.yy.yy.yy.',
    'yyy.yy.yyy',
    'yyyyyyyyyy',
    '.yyyyyyyy.',
    '.yy....yy.',
    '..yy..yy..',
    '....yy....',
  ],
};
export const CAT: DrawnPicture = {
  name: 'a cat',
  rows: [
    'oo......oo',
    'ooo....ooo',
    'oooooooooo',
    'oooooooooo',
    'oo.oooo.oo',
    'oo.oooo.oo',
    'oooooooooo',
    '.oo.oo.oo.',
    '.oooooooo.',
    '..oooooo..',
  ],
};
export const FISH: DrawnPicture = {
  name: 'a fish',
  rows: [
    '..........',
    '....bbbb..',
    'b..bbbbbb.',
    'bb.bbbbbbb',
    'bbbbbbbbob',
    'bbbbbbbbbb',
    'bb.bbbbbbb',
    'b..bbbbbb.',
    '....bbbb..',
    '..........',
  ],
};
export const ROCKET: DrawnPicture = {
  name: 'a rocket',
  rows: [
    '....uu....',
    '...uuuu...',
    '..uuuuuu..',
    '..uuuuuu..',
    '..uubbuu..',
    '..uubbuu..',
    '..uuuuuu..',
    '.rruuuurr.',
    '.rr....rr.',
    '....oo....',
  ],
};
export const DUCK: DrawnPicture = {
  name: 'a duck',
  rows: [
    '....yyy...',
    '...yyyyy..',
    '...yy.yyoo',
    '...yyyyyo.',
    '....yyy...',
    '.y..yyyyy.',
    '.yyyyyyyy.',
    'yyyyyyyyy.',
    '.yyyyyyyy.',
    '..yyyyyy..',
  ],
};
export const CUP: DrawnPicture = {
  name: 'a cup',
  rows: [
    '..........',
    '.bbbbbbb..',
    '.bbbbbbbbb',
    '.bbbbbbb.b',
    '.bbbbbbb.b',
    '.bbbbbbbbb',
    '.bbbbbbb..',
    '..bbbbb...',
    'nnnnnnnnnn',
    '..........',
  ],
};
export const CROWN: DrawnPicture = {
  name: 'a crown',
  rows: [
    '..........',
    'y...yy...y',
    'yy..yy..yy',
    'yyy.yy.yyy',
    'yyyyyyyyyy',
    'yyryyyyryy',
    'yyyyyyyyyy',
    'yyyyyyyyyy',
    '..........',
    '..........',
  ],
};
export const BELL: DrawnPicture = {
  name: 'a bell',
  rows: [
    '....yy....',
    '...yyyy...',
    '..yyyyyy..',
    '..yyyyyy..',
    '..yyyyyy..',
    '.yyyyyyyy.',
    '.yyyyyyyy.',
    'yyyyyyyyyy',
    '....nn....',
    '..........',
  ],
};
export const SNAIL: DrawnPicture = {
  name: 'a snail',
  rows: [
    '.......y.y',
    '.......y.y',
    '..uuuu.yyy',
    '.uu..uuyyy',
    '.u.uu.uyy.',
    '.u.u..uyy.',
    '.uu.uuuyy.',
    '..uuuuyyy.',
    'yyyyyyyyy.',
    '.yyyyyyyy.',
  ],
};
export const FLOWER: DrawnPicture = {
  name: 'a flower',
  rows: [
    '..pp..pp..',
    '.pppppppp.',
    '..ppyypp..',
    '.pppyyppp.',
    '..pppppp..',
    '....gg....',
    '.gg.gg....',
    '..gggg.gg.',
    '....gggg..',
    '....gg....',
  ],
};
export const WHALE: DrawnPicture = {
  name: 'a whale',
  rows: [
    '....b.b...',
    '.....b....',
    '..bbbbbb..',
    '.bbbbbbbb.',
    'bb.bbbbbbb',
    'bbbbbbbbbb',
    '.bbbbbbbb.',
    '..bbbbbb.b',
    '.......bb.',
    '..........',
  ],
};

export const LIGHTHOUSE: DrawnPicture = {
  name: 'a lighthouse',
  rows: [
    '......rrr......',
    '.....rrrrr.....',
    'yyyy.yy.yy.yyyy',
    '....nnnnnnn....',
    '.....rrrrr.....',
    '.....rr.rr.....',
    '.....yyyyy.....',
    '.....yyyyy.....',
    '.....rr.rr.....',
    '.....rrrrr.....',
    '.....yynyy.....',
    '.....yynyy.....',
    '...nnnnnnnnn...',
    '.nnnnnnnnnnnnn.',
    'bbbbbbbbbbbbbbb',
  ],
};
export const BUTTERFLY: DrawnPicture = {
  name: 'a butterfly',
  rows: [
    '.....n...n.....',
    '......n.n......',
    '......nnn......',
    '.uuuuu.n.uuuuu.',
    'uuuuuuunuuuuuuu',
    'uuppuuunuuuppuu',
    'uuppuuunuuuppuu',
    'uuuuuuunuuuuuuu',
    '.uuuuuunuuuuuu.',
    '..uuuuunuuuuu..',
    '..uupuunuupuu..',
    '...uuuunuuuu...',
    '....uu.n.uu....',
    '.......n.......',
    '...............',
  ],
};
export const CASTLE: DrawnPicture = {
  name: 'a castle',
  rows: [
    '..r.........r..',
    '..r.........r..',
    'n.n.n.....n.n.n',
    'nnnnn.....nnnnn',
    'nnnnnn.n.nnnnnn',
    'nn.nnnnnnnnn.nn',
    'nnnnnnnnnnnnnnn',
    'nn.nnnnnnnnn.nn',
    'nnnnnnnnnnnnnnn',
    'nnnnnn...nnnnnn',
    'nnnnnn...nnnnnn',
    'nnnnnn...nnnnnn',
    'nnnnnn...nnnnnn',
    'ggggggggggggggg',
    'ggggggggggggggg',
  ],
};
export const SNOWMAN: DrawnPicture = {
  name: 'a snowman',
  rows: [
    '......nnn......',
    '......nnn......',
    '....nnnnnnn....',
    '.....bb.bb.....',
    '.....bbobb.....',
    '.....bbbbb.....',
    '....rrrrrrr....',
    '...bbbbbbbbb...',
    '..bbbbbnbbbbb..',
    '.bbbbbbbbbbbbb.',
    '.bbbbbbnbbbbbb.',
    '.bbbbbbbbbbbbb.',
    '..bbbbbbbbbbb..',
    '...bbbbbbbbb...',
    'ggggggggggggggg',
  ],
};
export const OWL: DrawnPicture = {
  name: 'an owl',
  rows: [
    '..nn.......nn..',
    '..nnn.....nnn..',
    '..nnnnnnnnnnn..',
    '.nnyyynnnyyynn.',
    '.nny.ynnny.ynn.',
    '.nnyyynonyyynn.',
    '..nnnnnonnnnn..',
    '..nnnnnnnnnnn..',
    '..nnyynnnyynn..',
    '..nnnnnnnnnnn..',
    '..nnyynnnyynn..',
    '...nnnnnnnnn...',
    '....nnnnnnn....',
    '.....oo.oo.....',
    'nnnnnnnnnnnnnnn',
  ],
};

export const KITE: DrawnPicture = {
  name: 'a kite',
  rows: [
    '.......u.......',
    '......uuu......',
    '.....uuuuu.....',
    '....uupuuuu....',
    '...uupppuuuu...',
    '..uuuuuuuuuuu..',
    '...uuupppuuu...',
    '....uuuuuuu....',
    '.....uuuuu.....',
    '......uuu......',
    '.......u.......',
    '........n......',
    '.........n.....',
    '........rrr....',
    '.........r.....',
  ],
};
export const CRAB: DrawnPicture = {
  name: 'a crab',
  rows: [
    '.rr.......rr...',
    'r..r.....r..r..',
    'rr.r.....r.rr..',
    '.rrr.....rrr...',
    '..r.......r....',
    '..r.y...y.r....',
    '...rrrrrrr.....',
    '..rrrrrrrrr....',
    'rrrrrrrrrrrrr..',
    '..rrrrrrrrr....',
    'rr.rrrrrrr.rr..',
    'r..r.....r..r..',
    '..r.......r....',
    '...............',
    '...............',
  ],
};
export const UMBRELLA: DrawnPicture = {
  name: 'an umbrella',
  rows: [
    '.......n.......',
    '.....bbbbb.....',
    '...bbbbbbbbb...',
    '..bbbbbbbbbbb..',
    '.bbbbbbbbbbbbb.',
    '.bbbbbbbbbbbbb.',
    'bbbbbbbbbbbbbbb',
    'b..b..bnb..b..b',
    '.......n.......',
    '.......n.......',
    '.......n.......',
    '.......n.......',
    '.......n..n....',
    '........nn.....',
    '...............',
  ],
};
export const RABBIT: DrawnPicture = {
  name: 'a rabbit',
  rows: [
    '..pp...pp......',
    '.p..p.p..p.....',
    '.p..p.p..p.....',
    '.p..p.p..p.....',
    '..pp...pp......',
    '..ppppppp......',
    '.pp.ppp.pp.....',
    '.ppppypppp.....',
    '..ppppppp......',
    '...ppppppp.....',
    '..ppppppppp....',
    '..ppppppppp.pp.',
    '..ppppppppppp..',
    '...ppp...ppp...',
    '...............',
  ],
};
export const PENGUIN: DrawnPicture = {
  name: 'a penguin',
  rows: [
    '.....bbbbb.....',
    '....bbbbbbb....',
    '...bb.bbb.bb...',
    '...bbbbbbbbb...',
    '...bbboooobb...',
    '..bbbbooobbbb..',
    '..bb.......bb..',
    '.bbb.......bbb.',
    'bbb.........bbb',
    'bb...........bb',
    '..bb.......bb..',
    '..bb.......bb..',
    '..bbbbbbbbbbb..',
    '....oo...oo....',
    '...ooo...ooo...',
  ],
};

/**
 * 10 by 10 pictures that need only a few passes of line logic (at most `EASY_PASSES` rounds of "every line, once"), and 10 by
 * 10 pictures that need more care (more than that); a test keeps every picture on its side of the line.
 */
export const EASY_PASSES = 3;
export const EASY_10: readonly DrawnPicture[] = [HOUSE, MUSHROOM, SAILBOAT, CAT, FISH, CUP, CROWN, BELL];
export const HARD_10: readonly DrawnPicture[] = [HEART, TREE, SMILEY, ROCKET, DUCK, SNAIL, FLOWER, WHALE];
export const BIG_15: readonly DrawnPicture[] = [LIGHTHOUSE, BUTTERFLY, CASTLE, SNOWMAN, OWL];
/** 15 by 15 pictures that need more care: a test keeps every one needing more passes than every `BIG_15` picture. */
export const HARD_15: readonly DrawnPicture[] = [KITE, CRAB, UMBRELLA, RABBIT, PENGUIN];

/*
 * Two-colour pictures (level 6): blue and one warm colour, so the two kinds of clue number stay easy to tell apart (red beside
 * orange is the pair to avoid). Each is solved by its coloured numbers alone (`colorLineSolvable`), which a test checks.
 */
export const SUN_SEA: DrawnPicture = {
  name: 'the sun over the sea',
  rows: [
    '...yyyy...',
    '..yyyyyy..',
    '.yyyyyyyy.',
    '.yyyyyyyy.',
    '..yyyyyy..',
    '...yyyy...',
    'bb..bb..bb',
    'bbbbbbbbbb',
    'bbbbbbbbbb',
    'bbbbbbbbbb',
  ],
};
export const POND_DUCK: DrawnPicture = {
  name: 'a duck on the pond',
  rows: [
    '.....yy...',
    '....yyyy..',
    '....yyyyy.',
    '....yyyy..',
    '.y..yyy...',
    '.yyyyyyyy.',
    '.yyyyyyyy.',
    '..yyyyyy..',
    'bbbbbbbbbb',
    '.bbbbbbbb.',
  ],
};
export const BALLOON: DrawnPicture = {
  name: 'a hot-air balloon',
  rows: [
    '...oooo...',
    '..bboobb..',
    '.bbboobbb.',
    '.bbboobbb.',
    '.bbboobbb.',
    '..bboobb..',
    '...boob...',
    '....oo....',
    '...o..o...',
    '...oooo...',
  ],
};
export const WAVE_BOAT: DrawnPicture = {
  name: 'a boat on the waves',
  rows: [
    '....o.....',
    '....oo....',
    '....ooo...',
    '....oooo..',
    '....o.....',
    '.oooooooo.',
    '..oooooo..',
    'b.b.b.b.b.',
    'bbbbbbbbbb',
    'bbbbbbbbbb',
  ],
};
export const BLUEBIRD: DrawnPicture = {
  name: 'a bluebird',
  rows: [
    '..........',
    '...bbbb...',
    '..bbbbbb..',
    '..bb.bbboo',
    '..bbbbbb..',
    '.bbbooooo.',
    'bbbbooooo.',
    '.bbbbooo..',
    '...o..o...',
    '..oo.oo...',
  ],
};

export const TWO_COLOUR_10: readonly DrawnPicture[] = [SUN_SEA, POND_DUCK, BALLOON, WAVE_BOAT, BLUEBIRD];
