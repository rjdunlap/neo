import { createFixture } from './fixture.mjs';
import { runSuite } from './registry.mjs';

/** A selected suite owns its context, profile, errors and artifacts, even when another suite fails. */
export async function runBrowserSuites(browser, suites) {
  for (const suite of suites) {
    const fixture = await createFixture(browser, suite);
    try {
      await fixture.page.goto(fixture.islandUrl(process.env.GAME_URL || 'http://localhost:5173'));
      await fixture.ready();
      const completed = await runSuite(suite, fixture);
      if (fixture.errors.length) throw new Error(fixture.errors.join('\n'));
      fixture.log(`PASS: ${suite} (${completed.length} checks)`);
    } catch (error) {
      await fixture.screenshot('failure').catch(() => {});
      console.error('BROWSER FAILURE', suite, error);
      console.error('State:', await fixture.page.evaluate(() => ({ scene: window.neo?.scene?.constructor.name, switching: window.neo?.switching, game: window.neo?.scene?.mod?.id, level: window.neo?.scene?.level })).catch(() => null));
      throw error;
    } finally { await fixture.context.close(); }
  }
}
