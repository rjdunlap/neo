import type { StepEvidence } from '../content/welcome';
import type { StepKind } from './intentions';

/**
 * The five evidence classes (docs/rework/LEARNING-RECAP.md#one-vocabulary), and only these. `none` is never stored.
 * - `independent`: a checked step finished with no misses and no hints, at the plan's level.
 * - `supported`: a checked step finished with any miss or hint (the two-miss glow counts as a hint).
 * - `creative`: a free step finished; there is no right answer.
 * - `encountered`: opened, not finished.
 */
export type EvidenceClass = 'independent' | 'supported' | 'creative' | 'encountered' | 'none';

/** A step's class from its record. A finished checked record at any level but the plan's says nothing. */
export function classify(record: StepEvidence | undefined, kind: StepKind, planLevel: number): EvidenceClass {
  if (!record) return 'none';
  if (!record.finished) return 'encountered';
  if (kind === 'free') return 'creative';
  if (record.level !== planLevel) return 'none';
  return record.misses === 0 && record.hints === 0 ? 'independent' : 'supported';
}
