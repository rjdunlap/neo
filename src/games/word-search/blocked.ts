/**
 * Words that must never turn up in a grid by accident. Filler letters are random, and in a big grid read in eight directions a
 * short word appears now and then on its own, so the generator throws away any grid in which one of these can be read, and a test
 * checks the frozen course grids the same way.
 */
export const BLOCKED: readonly string[] = [
  'ASS', 'SEX', 'FAG', 'TIT', 'GAY', 'JEW', 'DAMN', 'HELL', 'CRAP', 'SHIT', 'FUCK', 'CUNT', 'TWAT', 'DICK', 'COCK', 'PISS', 'TITS', 'RAPE', 'NAZI', 'HOMO', 'DYKE', 'COON', 'GOOK', 'KIKE', 'SPIC', 'DICKS',
];
