import { describe, expect, it } from 'vitest';
import {
  cleanWelcome,
  emptyWelcome,
  finishWelcomeStep,
  MAX_STEP_ROUNDS,
  openWelcomeStep,
  WELCOME_BANDS,
  WELCOME_PLAN,
  WELCOME_STEPS,
  type StepEvidence,
} from '../content/welcome';
import { classify } from './evidence';
import { WELCOME_INTENTIONS } from './intentions';

const rec = (over: Partial<StepEvidence> = {}): StepEvidence => ({
  finished: true,
  misses: 0,
  hints: 0,
  level: 2,
  rounds: 1,
  at: 5,
  ...over,
});

describe('the learning table (RW09)', () => {
  it('pins every step and band to the welcome plan, with number apart from art and music', () => {
    for (const step of WELCOME_STEPS) {
      for (const band of WELCOME_BANDS) {
        const row = WELCOME_INTENTIONS[step][band];
        expect(row.game, `${step} ${band}`).toBe(WELCOME_PLAN[step]!.game);
        expect(row.level, `${step} ${band}`).toBe(WELCOME_PLAN[step]!.level[band]);
        expect(row.intention).toMatch(/^[A-Z].*\.$/);
      }
    }
    expect(WELCOME_INTENTIONS.yummy.preschool).toMatchObject({ subject: 'number', kind: 'checked' });
    expect(WELCOME_INTENTIONS.yummy.prek).toMatchObject({ subject: 'number', kind: 'checked' });
    expect(WELCOME_INTENTIONS.pretty.prek).toMatchObject({ subject: 'art', kind: 'free' });
    expect(WELCOME_INTENTIONS.song.preschool).toMatchObject({ subject: 'music', kind: 'free' });
  });
});

describe('classify', () => {
  it('names every class from the counts', () => {
    expect(classify(undefined, 'checked', 2)).toBe('none');
    expect(classify(rec({ finished: false }), 'checked', 2)).toBe('encountered');
    expect(classify(rec({ finished: false }), 'free', 2)).toBe('encountered');
    expect(classify(rec(), 'checked', 2)).toBe('independent');
    expect(classify(rec({ misses: 1 }), 'checked', 2)).toBe('supported');
    expect(classify(rec({ hints: 1 }), 'checked', 2)).toBe('supported');
    expect(classify(rec(), 'free', 2)).toBe('creative');
    expect(classify(rec({ misses: 4, hints: 2 }), 'free', 2)).toBe('creative');
  });

  it('says nothing about a checked round at a level the plan does not play', () => {
    expect(classify(rec({ level: 3 }), 'checked', 2)).toBe('none');
    expect(classify(rec({ level: 3, misses: 2 }), 'checked', 2)).toBe('none');
  });
});

describe('the evidence record', () => {
  const begun = () => ({ ...emptyWelcome(), band: 'preschool' as const });

  it('opening writes an unfinished record, never downgrades a finished one, and needs a band', () => {
    const none = emptyWelcome();
    expect(openWelcomeStep(none, 'yummy', 1)).toBe(false);
    const p = begun();
    expect(openWelcomeStep(p, 'yummy', 1)).toBe(true);
    expect(p.evidence.yummy).toEqual({ finished: false, misses: 0, hints: 0, level: 2, rounds: 0, at: 1 });
    expect(classify(p.evidence.yummy, 'checked', 2)).toBe('encountered');
    p.steps = ['yummy'];
    expect(finishWelcomeStep(p, 'yummy', { misses: 1, hints: 0, level: 2 }, 2)).toBe(true);
    expect(openWelcomeStep(p, 'yummy', 3)).toBe(false);
    expect(p.evidence.yummy).toMatchObject({ finished: true, misses: 1, rounds: 1, at: 2 });
  });

  it('writes nothing on opening a step finished before records existed', () => {
    const p = { ...begun(), steps: ['pretty' as const] };
    expect(openWelcomeStep(p, 'pretty', 1)).toBe(false);
    expect(p.evidence).toEqual({});
  });

  it('a finished replay replaces the counts and counts rounds up to nine', () => {
    const p = begun();
    p.steps = ['yummy'];
    finishWelcomeStep(p, 'yummy', { misses: 3, hints: 1, level: 2 }, 1);
    expect(classify(p.evidence.yummy, 'checked', 2)).toBe('supported');
    finishWelcomeStep(p, 'yummy', { misses: 0, hints: 0, level: 2 }, 2);
    expect(p.evidence.yummy).toEqual({ finished: true, misses: 0, hints: 0, level: 2, rounds: 2, at: 2 });
    expect(classify(p.evidence.yummy, 'checked', 2)).toBe('independent');
    for (let i = 0; i < 20; i++) finishWelcomeStep(p, 'yummy', { misses: 0, hints: 0, level: 2 }, 3);
    expect(p.evidence.yummy!.rounds).toBe(MAX_STEP_ROUNDS);
  });

  it('writes nothing after the ending or at a level the plan does not play', () => {
    const p = begun();
    expect(finishWelcomeStep(p, 'yummy', { misses: 0, hints: 0, level: 5 }, 1)).toBe(false);
    p.ended = true;
    expect(finishWelcomeStep(p, 'yummy', { misses: 0, hints: 0, level: 2 }, 1)).toBe(false);
    expect(openWelcomeStep(p, 'song', 1)).toBe(false);
    expect(p.evidence).toEqual({});
  });

  it('repairs clamps, unknown steps, a finished record without its step, the wrong level and a missing field', () => {
    const p = cleanWelcome({
      band: 'preschool',
      steps: ['yummy'],
      evidence: {
        yummy: { finished: true, misses: 500, hints: -3.5, level: 2, rounds: 40, at: -1 },
        pretty: { finished: true, misses: 0, hints: 0, level: 3, rounds: 1, at: 1 },
        song: { finished: false, misses: 2, hints: 2, level: 2, rounds: 2.7, at: 'x' },
        cake: { finished: true, misses: 0, hints: 0, level: 1, rounds: 1, at: 1 },
      },
    });
    expect(p.evidence).toEqual({
      yummy: { finished: true, misses: 99, hints: 0, level: 2, rounds: 9, at: 0 },
      song: { finished: false, misses: 0, hints: 0, level: 2, rounds: 2, at: 0 },
    });
    // The wrong level for the band, and no band at all.
    expect(
      cleanWelcome({
        band: 'prek',
        steps: ['yummy'],
        evidence: { yummy: { finished: true, misses: 0, hints: 0, level: 2, rounds: 1, at: 1 } },
      }).evidence,
    ).toEqual({});
    expect(
      cleanWelcome({
        steps: ['yummy'],
        evidence: { yummy: { finished: true, misses: 0, hints: 0, level: 2, rounds: 1, at: 1 } },
      }).evidence,
    ).toEqual({});
    expect(cleanWelcome({ band: 'preschool', steps: [] }).evidence).toEqual({});
    expect(cleanWelcome({ band: 'preschool', evidence: 'x' }).evidence).toEqual({});
  });
});
