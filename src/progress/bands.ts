export type Band = 'lap' | 'toddler' | 'preschool' | 'prek';

export interface BandInfo {
  id: Band;
  label: string;
  ages: string;
  /** Default session length in minutes. */
  minutes: number;
}

export const BANDS: BandInfo[] = [
  { id: 'lap', label: 'Lap', ages: '18–24 months', minutes: 5 },
  { id: 'toddler', label: 'Toddler', ages: '2–3 years', minutes: 10 },
  { id: 'preschool', label: 'Preschool', ages: '3–4 years', minutes: 15 },
  { id: 'prek', label: 'Pre-K', ages: '5–6 years', minutes: 20 },
];

export const bandInfo = (id: Band): BandInfo => BANDS.find((b) => b.id === id) ?? BANDS[0];
