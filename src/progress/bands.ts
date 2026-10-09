export type Band = 'lap' | 'toddler' | 'preschool' | 'prek' | 'school';

export interface BandInfo {
  id: Band;
  label: string;
  ages: string;
}

export const BANDS: BandInfo[] = [
  { id: 'lap', label: 'Lap', ages: '18–24 months' },
  { id: 'toddler', label: 'Toddler', ages: '2–3 years' },
  { id: 'preschool', label: 'Preschool', ages: '3–4 years' },
  { id: 'prek', label: 'Pre-K', ages: '5–6 years' },
  { id: 'school', label: 'Early school', ages: '6–8 years' },
];

export const bandInfo = (id: Band): BandInfo => BANDS.find((b) => b.id === id) ?? BANDS[0];
