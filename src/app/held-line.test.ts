import { describe, expect, it } from 'vitest';
import { HeldLines } from './held-line';

const line = () => {
  let end!: () => void;
  const spoken = new Promise<void>((r) => (end = r));
  return { spoken, end };
};
const settle = () => new Promise((r) => setTimeout(r, 0));

describe('HeldLines (U7 R5)', () => {
  it('talks while a line is pending and stops when it ends or is cut', async () => {
    const held = new HeldLines();
    const a = line();
    const b = line();
    void held.line(a.spoken);
    void held.line(b.spoken);
    expect(held.talking).toBe(true);
    a.end();
    await settle();
    expect(held.talking).toBe(true);
    b.end();
    await settle();
    expect(held.talking).toBe(false);
  });

  it('ticks for a tap that did nothing while a line held the game', () => {
    const held = new HeldLines();
    void held.line(line().spoken);
    held.down(5);
    expect(held.frame(5)).toBe(false); // not lifted yet
    held.up();
    expect(held.frame(5)).toBe(true);
    expect(held.frame(5)).toBe(false); // once
  });

  it('stays quiet when the tap made a sound or started a line', () => {
    const held = new HeldLines();
    void held.line(line().spoken);
    held.down(5);
    held.up();
    expect(held.frame(6)).toBe(false);
    held.down(6);
    void held.line(line().spoken);
    held.up();
    expect(held.frame(6)).toBe(false);
  });

  it('never ticks when no line is playing, or after a cancel', async () => {
    const held = new HeldLines();
    held.down(0);
    held.up();
    expect(held.frame(0)).toBe(false);
    const a = line();
    void held.line(a.spoken);
    held.down(0);
    held.cancel();
    held.up();
    expect(held.frame(0)).toBe(false);
  });
});
