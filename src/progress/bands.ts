export type Band = 'lap' | 'toddler' | 'preschool' | 'prek' | 'school';

export interface BandInfo {
  id: Band;
  label: string;
  ages: string;
}

export const BANDS: BandInfo[] = [
  { id: 'lap', label: 'Lap', ages: 'under 2 years' },
  { id: 'toddler', label: 'Toddler', ages: '2 years' },
  { id: 'preschool', label: 'Preschool', ages: '3 years' },
  { id: 'prek', label: 'Pre-K', ages: '4–5 years' },
  { id: 'school', label: 'Early school', ages: '6 years and up' },
];

export const bandInfo = (id: Band): BandInfo => BANDS.find((b) => b.id === id) ?? BANDS[0];
