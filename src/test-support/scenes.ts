import { Container } from 'pixi.js';
import type { Scene } from '../app/Scene';

/** Own test scenes, including constructor-only scenes whose controls have not yet been attached by init(). */
export function sceneFixture() {
  const scenes = new Set<Scene>();
  const dispose = async (scene: Scene) => {
    scene.destroy();
    scenes.delete(scene);
    // Scene defers display-tree disposal until queued continuations have had a turn.
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    // Constructor-only tests deliberately do not call init(): their unattached controls still own listeners.
    for (const value of Object.values(scene)) {
      if (value instanceof Container && !value.destroyed && !value.parent) value.destroy({ children: true });
    }
  };
  return Object.assign(<T extends Scene>(scene: T): T => {
    scenes.add(scene);
    return scene;
  }, {
    dispose,
    async cleanup() {
      for (const scene of [...scenes]) await dispose(scene);
    },
  });
}
