/** Resolve every requested name before starting work; typos must never produce a successful empty run. */
export function selectNames(value, available, label) {
  const known = new Set(available);
  const picked = value === undefined ? [...known] : value.split(',').map(x => x.trim());
  if (!picked.length || picked.some(x => !x)) throw new Error(`${label}: select at least one value`);
  const unknown = picked.filter(x => !known.has(x));
  if (unknown.length) throw new Error(`${label}: unknown selection ${unknown.join(', ')}; available: ${[...known].join(', ')}`);
  return [...new Set(picked)];
}

export function fingerPlays(games, requestedLevels) {
  const levels = requestedLevels === undefined ? null : requestedLevels.split(',').map(x => Number(x.trim()));
  if (levels && (!levels.length || levels.some(x => !Number.isInteger(x) || x < 1))) throw new Error('FINGER_LEVELS: expected positive integer levels');
  return games.map(game => {
    const plays = levels ? [...new Set(levels)].map(level => {
      const range = game.ranges.find(r => r.levels.includes(level));
      if (!range) throw new Error(`FINGER_LEVELS: ${game.id} has no level ${level}`);
      return { band: range.band, level };
    }) : [
      { band: game.ranges[0].band, level: game.ranges[0].levels[0] },
      { band: game.ranges.at(-1).band, level: game.ranges.at(-1).levels.at(-1) },
    ].filter((p, i, all) => all.findIndex(x => x.level === p.level && x.band === p.band) === i);
    if (!plays.length || plays.some(p => p.level === undefined)) throw new Error(`${game.id}: no demo levels selected`);
    return { ...game, plays };
  });
}

/** Legacy single-value subfilters must not accept lists that their dispatcher cannot execute. */
export function selectValue(value, available, label) {
  if (!available.includes(value)) throw new Error(`${label}: unknown selection ${value}; available: ${available.join(', ')}`);
  return value;
}
