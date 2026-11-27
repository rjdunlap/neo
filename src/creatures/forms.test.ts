import { describe, expect, it } from 'vitest';
import { FORM_LOOK } from '../art/creatures/forms';
import { FORM_FLOWER, FORMS, formForFlower } from './forms';

describe('the flower each blossom grows from', () => {
  it('is the flower the blossom is drawn with, one blossom per kind', () => {
    for (const form of FORMS) {
      expect(FORM_FLOWER[form]).toBe(FORM_LOOK[form].kind);
      expect(formForFlower(FORM_FLOWER[form])).toBe(form);
    }
    expect(new Set(Object.values(FORM_FLOWER)).size).toBe(FORMS.length);
  });

  it('grows nothing from a flower that is no blossom', () => {
    for (const kind of ['daisy', 'blossom', 'bell', '', undefined, 4]) expect(formForFlower(kind)).toBeNull();
  });
});
