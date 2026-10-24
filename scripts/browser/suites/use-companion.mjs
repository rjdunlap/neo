

export function createSuite({ page }) {
/** Makes a friend of this species the active companion, for the large-pet games' species checks. */
async function useCompanion(species) {
  await page.evaluate((species) => {
    kit.store.data.creatures = { owned: [{ id: 'cmp0', species, name: 'Pebble', look: { color: 'blue', worn: [] }, metAt: `dev:${species}` }], companion: 'cmp0' };
    kit.store.save(); kit.store.flush();
  }, species);
}

return { useCompanion };
}
