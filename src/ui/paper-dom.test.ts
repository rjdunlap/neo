import { describe, expect, it } from 'vitest';
import { paperSheetUrl, parseRgb } from './paper-dom';

describe('a plain-HTML piece of paper', () => {
  it('reads the colour the browser computes, and skips see-through ones', () => {
    expect(parseRgb('rgb(53, 104, 90)')).toBe(0x35685a);
    expect(parseRgb('rgba(255, 216, 108, 0.9)')).toBe(0xffd86c);
    expect(parseRgb('rgb(255 244 227 / 93%)')).toBe(0xfff4e3);
    expect(parseRgb('#fdf6e6')).toBe(0xfdf6e6);
    expect(parseRgb('rgba(0, 0, 0, 0)')).toBeNull();
    expect(parseRgb('transparent')).toBeNull();
  });

  it('draws nothing where there is no canvas or no room', () => {
    expect(paperSheetUrl(4, 40, 0xffffff, 12, 'x')).toBeNull();
  });
});
