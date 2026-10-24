import { describe, expect, it } from 'vitest';
import { SCRIPT } from '../content/voice-script';
import { clipUrl } from './voice-clips';

describe('clipUrl', () => {
  it('finds a clip for a rendered line and leaves the rest to device speech', () => {
    expect(clipUrl(SCRIPT['nav.home'][0])).toMatch(/\.m4a$/);
    expect(clipUrl('Great job, {name}!')).toBeNull();
    expect(clipUrl('A line nobody rendered.')).toBeNull();
    expect(clipUrl('constructor')).toBeNull();
  });
});
