import type { Rng } from '../../engine/random';

/**
 * Teddy Doctor, after Toca Doctor and Dr. Panda: soft-toy patients visit the clinic and the child
 * makes them feel better. The ladder goes from tapping boo-boos, to bandaging a named body part,
 * to choosing what helps a symptom you can see, then one you can only hear about, and finally
 * check-ups done in order: first from a picture card, then from what the patient says.
 */
export type DoctorMode = 'play' | 'part' | 'tool' | 'clue' | 'card' | 'told';

export interface DoctorPlan {
  mode: DoctorMode;
  /** Patients per round. */
  patients: number;
  /** Tools on the tray (tool and clue modes). */
  choices: number;
  name: string;
}

export const PLANS: DoctorPlan[] = [
  { mode: 'play', patients: 2, choices: 0, name: 'Tap the boo-boos to put on bandages' },
  { mode: 'part', patients: 3, choices: 1, name: 'Put a bandage where the patient says: "on my ear"' },
  { mode: 'tool', patients: 3, choices: 3, name: 'See what is wrong (a bump, sniffles, cold feet) and choose what helps' },
  { mode: 'clue', patients: 3, choices: 4, name: 'Listen to what hurts, then use the right thing in the right place' },
  { mode: 'card', patients: 2, choices: 3, name: 'A check-up in the order shown on a picture card' },
  { mode: 'told', patients: 2, choices: 3, name: 'A check-up in the order the patient says' },
];

export const planFor = (level: number) => PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];

export const PATIENTS = ['bear', 'cat', 'dog', 'bunny', 'pig'] as const;
export type Patient = (typeof PATIENTS)[number];

export type Part = 'head' | 'ear' | 'nose' | 'mouth' | 'tummy' | 'feet';
/** Where boo-boos can be. */
export const SCRAPE_PARTS: Part[] = ['head', 'ear', 'tummy', 'feet'];
/** The parts a tool can be aimed at when it matters where it goes. */
export const AIM_PARTS: Part[] = ['head', 'ear', 'nose', 'tummy', 'feet'];

export type Ailment = 'scrape' | 'bump' | 'sniffles' | 'tummy' | 'cold';
export const AILMENTS: Ailment[] = ['scrape', 'bump', 'sniffles', 'tummy', 'cold'];
export type Cure = 'bandage' | 'ice' | 'tissue' | 'bottle' | 'socks';
export type Check = 'stethoscope' | 'thermometer' | 'flashlight';
export type Tool = Cure | Check;

/** What helps each ailment, and where it goes (a scrape's place varies). */
export const CURE: Record<Ailment, { tool: Cure; part: Part | null }> = {
  scrape: { tool: 'bandage', part: null },
  bump: { tool: 'ice', part: 'head' },
  sniffles: { tool: 'tissue', part: 'nose' },
  tummy: { tool: 'bottle', part: 'tummy' },
  cold: { tool: 'socks', part: 'feet' },
};

/** The check-up steps and where each tool goes. */
export const CHECKS: Check[] = ['stethoscope', 'thermometer', 'flashlight'];
export const CHECK_PART: Record<Check, Part> = { stethoscope: 'tummy', thermometer: 'mouth', flashlight: 'ear' };

/** Body spots in the critter's own units (feet at 0, about 250 tall). Ears differ by kind. */
export function partSpot(patient: Patient, part: Part): { x: number; y: number } {
  switch (part) {
    case 'head':
      return { x: 0, y: -206 };
    case 'ear':
      return { bear: { x: 72, y: -222 }, cat: { x: 80, y: -244 }, pig: { x: 80, y: -244 }, dog: { x: 112, y: -190 }, bunny: { x: 46, y: -300 } }[patient];
    case 'nose':
      return { x: 0, y: patient === 'pig' ? -100 : -106 };
    case 'mouth':
      return { x: 0, y: patient === 'pig' ? -70 : -86 };
    case 'tummy':
      return { x: 0, y: -50 };
    case 'feet':
      return { x: 0, y: -6 };
  }
}

/** The part nearest a drop, among the given parts (spots in the critter's own units). */
export function nearestPart(patient: Patient, x: number, y: number, parts: readonly Part[] = AIM_PARTS): Part {
  let best = parts[0];
  let bestD = Infinity;
  for (const part of parts) {
    const s = partSpot(patient, part);
    const d = Math.hypot(s.x - x, s.y - y);
    if (d < bestD) [best, bestD] = [part, d];
  }
  return best;
}

export interface DoctorRound {
  patient: Patient;
  /** Boo-boos to bandage (play and part modes), in the order asked for. */
  scrapes: Part[];
  /** What is wrong (tool and clue modes). */
  ailment: Ailment | null;
  /** Where it hurts: the scrape's place, or the ailment's fixed part. */
  part: Part | null;
  /** On the tray, shuffled. */
  tools: Tool[];
  /** Check-up order (card and told modes). */
  steps: Check[];
}

export function makeRounds(plan: DoctorPlan, rng: Rng): DoctorRound[] {
  const out: DoctorRound[] = [];
  let lastPatient: Patient | null = null;
  let lastAilment: Ailment | null = null;
  let lastSteps = '';
  for (let i = 0; i < plan.patients; i++) {
    const patient = rng.pick(PATIENTS.filter((p) => p !== lastPatient));
    lastPatient = patient;
    const round: DoctorRound = { patient, scrapes: [], ailment: null, part: null, tools: [], steps: [] };
    switch (plan.mode) {
      case 'play':
        round.scrapes = rng.shuffle([...SCRAPE_PARTS]).slice(0, 3);
        break;
      case 'part':
        round.scrapes = rng.shuffle([...SCRAPE_PARTS]).slice(0, 3);
        round.tools = ['bandage'];
        break;
      case 'tool':
      case 'clue': {
        const ailment = rng.pick(AILMENTS.filter((a) => a !== lastAilment));
        lastAilment = ailment;
        round.ailment = ailment;
        round.part = CURE[ailment].part ?? rng.pick(SCRAPE_PARTS);
        const cure = CURE[ailment].tool;
        const others = rng.shuffle(AILMENTS.filter((a) => a !== ailment).map((a) => CURE[a].tool)).slice(0, plan.choices - 1);
        round.tools = rng.shuffle([cure, ...others]);
        break;
      }
      case 'card':
      case 'told': {
        let steps = rng.shuffle([...CHECKS]);
        for (let tries = 0; steps.join() === lastSteps && tries < 10; tries++) steps = rng.shuffle([...CHECKS]);
        lastSteps = steps.join();
        round.steps = steps;
        round.tools = rng.shuffle([...CHECKS]);
        break;
      }
    }
    out.push(round);
  }
  return out;
}

/** The tool that answers this round right now (for checks, the next step). */
export function wantedTool(round: DoctorRound, step = 0): Tool | null {
  if (round.ailment) return CURE[round.ailment].tool;
  if (round.steps.length) return round.steps[step] ?? null;
  if (round.scrapes.length) return 'bandage';
  return null;
}

export type DoctorTouch = { kind: 'tap'; part: Part } | { kind: 'tool'; tool: Tool; part: Part };

/** The next kind, tool and body part a clean doctor demonstration should touch. */
export function doctorTouch(mode: DoctorMode, round: DoctorRound, step = 0, scrapes: readonly Part[] = round.scrapes): DoctorTouch | null {
  if (mode === 'play') return scrapes[0] ? { kind: 'tap', part: scrapes[0] } : null;
  if (mode === 'part') return scrapes[0] ? { kind: 'tool', tool: 'bandage', part: scrapes[0] } : null;
  if (mode === 'tool' || mode === 'clue') {
    const tool = wantedTool(round, step);
    return tool && round.part ? { kind: 'tool', tool, part: round.part } : null;
  }
  const tool = wantedTool(round, step);
  return tool && tool in CHECK_PART ? { kind: 'tool', tool, part: CHECK_PART[tool as Check] } : null;
}
