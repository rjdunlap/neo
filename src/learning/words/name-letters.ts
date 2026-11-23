/** A name's Latin letters in capitals, accents dropped (Zoë → ZOE), up to 40; empty when it has none. */
export function latinLetters(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 40);
}

/** A name's letters as a game shows them, or Pip's when it has no Latin letter. */
export function nameLetters(name: string): string {
  return latinLetters(name) || 'PIP';
}
