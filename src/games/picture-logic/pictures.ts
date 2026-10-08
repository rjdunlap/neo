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

export const SAILBOAT: DrawnPicture = { name: 'a sailboat', rows: ['....n.....', '....rr....', '...rrrr...', '..rrrrrr..', '.rrrrrrrr.', '....n.....', '.nnnnnnnn.', '..nnnnnn..', 'bbbbbbbbbb', '..........'] };
export const HEART: DrawnPicture = { name: 'a heart', rows: ['..........', '.rrr..rrr.', 'rrrrrrrrrr', 'rrrrrrrrrr', 'rrrrrrrrrr', 'rrrrrrrrrr', '.rrrrrrrr.', '..rrrrrr..', '...rrrr...', '....rr....'] };
export const HOUSE: DrawnPicture = { name: 'a house', rows: ['..........', '....rr....', '...rrrr...', '..rrrrrr..', '.rrrrrrrr.', '.yyyyyyyy.', '.ybbyyyyy.', '.ybbyynny.', '.yyyyynny.', '.yyyyynny.'] };
export const TREE: DrawnPicture = { name: 'a tree', rows: ['...gggg...', '..gggggg..', '.gggggggg.', '.gggggggg.', '.gggggggg.', '..gggggg..', '...gggg...', '....nn....', '....nn....', '....nn....'] };
export const MUSHROOM: DrawnPicture = { name: 'a mushroom', rows: ['...rrrr...', '.rrrrrrrr.', 'rrryyrrrrr', 'rrryyrryyr', 'rrrrrrryyr', 'rrrrrrrrrr', '...nnnn...', '...nnnn...', '...nnnn...', '..nnnnnn..'] };
export const SMILEY: DrawnPicture = { name: 'a smiley face', rows: ['....yy....', '..yyyyyy..', '.yyyyyyyy.', '.yy.yy.yy.', 'yyy.yy.yyy', 'yyyyyyyyyy', '.yyyyyyyy.', '.yy....yy.', '..yy..yy..', '....yy....'] };
export const CAT: DrawnPicture = { name: 'a cat', rows: ['oo......oo', 'ooo....ooo', 'oooooooooo', 'oooooooooo', 'oo.oooo.oo', 'oo.oooo.oo', 'oooooooooo', '.oo.oo.oo.', '.oooooooo.', '..oooooo..'] };
export const FISH: DrawnPicture = { name: 'a fish', rows: ['..........', '....bbbb..', 'b..bbbbbb.', 'bb.bbbbbbb', 'bbbbbbbbob', 'bbbbbbbbbb', 'bb.bbbbbbb', 'b..bbbbbb.', '....bbbb..', '..........'] };
export const ROCKET: DrawnPicture = { name: 'a rocket', rows: ['....uu....', '...uuuu...', '..uuuuuu..', '..uuuuuu..', '..uubbuu..', '..uubbuu..', '..uuuuuu..', '.rruuuurr.', '.rr....rr.', '....oo....'] };
export const DUCK: DrawnPicture = { name: 'a duck', rows: ['....yyy...', '...yyyyy..', '...yy.yyoo', '...yyyyyo.', '....yyy...', '.y..yyyyy.', '.yyyyyyyy.', 'yyyyyyyyy.', '.yyyyyyyy.', '..yyyyyy..'] };

export const LIGHTHOUSE: DrawnPicture = { name: 'a lighthouse', rows: ['......rrr......', '.....rrrrr.....', 'yyyy.yy.yy.yyyy', '....nnnnnnn....', '.....rrrrr.....', '.....rr.rr.....', '.....yyyyy.....', '.....yyyyy.....', '.....rr.rr.....', '.....rrrrr.....', '.....yynyy.....', '.....yynyy.....', '...nnnnnnnnn...', '.nnnnnnnnnnnnn.', 'bbbbbbbbbbbbbbb'] };
export const BUTTERFLY: DrawnPicture = { name: 'a butterfly', rows: ['.....n...n.....', '......n.n......', '......nnn......', '.uuuuu.n.uuuuu.', 'uuuuuuunuuuuuuu', 'uuppuuunuuuppuu', 'uuppuuunuuuppuu', 'uuuuuuunuuuuuuu', '.uuuuuunuuuuuu.', '..uuuuunuuuuu..', '..uupuunuupuu..', '...uuuunuuuu...', '....uu.n.uu....', '.......n.......', '...............'] };
export const CASTLE: DrawnPicture = { name: 'a castle', rows: ['..r.........r..', '..r.........r..', 'n.n.n.....n.n.n', 'nnnnn.....nnnnn', 'nnnnnn.n.nnnnnn', 'nn.nnnnnnnnn.nn', 'nnnnnnnnnnnnnnn', 'nn.nnnnnnnnn.nn', 'nnnnnnnnnnnnnnn', 'nnnnnn...nnnnnn', 'nnnnnn...nnnnnn', 'nnnnnn...nnnnnn', 'nnnnnn...nnnnnn', 'ggggggggggggggg', 'ggggggggggggggg'] };

/** 10 by 10 pictures that need only a few passes of line logic, and 10 by 10 pictures that need more care. */
export const EASY_10: readonly DrawnPicture[] = [HEART, TREE, HOUSE, MUSHROOM, SAILBOAT];
export const HARD_10: readonly DrawnPicture[] = [SMILEY, CAT, FISH, ROCKET, DUCK];
export const BIG_15: readonly DrawnPicture[] = [LIGHTHOUSE, BUTTERFLY, CASTLE];
