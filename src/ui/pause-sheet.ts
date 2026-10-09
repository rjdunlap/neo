import { gearButton, type Gear } from './grownups';

export interface PauseSheetOptions {
  /** "Keep playing" was pressed. (Esc is handled by the app, which calls `close` itself.) */
  onResume: () => void;
  /** The gear was held long enough. */
  onGrownUps: () => void;
  /** The gear was only tapped. */
  onShort?: () => void;
}

export interface PauseSheet {
  close(): void;
}

/**
 * What Esc shows on the island: the scene underneath holds still, and a grown-up can keep playing or hold the gear to
 * open settings. Plain HTML so a keyboard reaches both buttons.
 */
export function openPauseSheet({ onResume, onGrownUps, onShort }: PauseSheetOptions): PauseSheet {
  const root = document.createElement('div');
  root.className = 'pause';
  root.innerHTML = `
    <div class="pause__card" role="dialog" aria-modal="true" aria-labelledby="pause-title">
      <h1 id="pause-title">Paused</h1>
      <button type="button" class="btn btn--primary" data-resume>Keep playing</button>
      <div class="pause__grownups">
        <span data-gear></span>
        <p>Grown-ups: press and hold the gear to open settings.</p>
      </div>
    </div>`;

  const gear: Gear = gearButton({ onOpen: onGrownUps, onShort, inline: true });
  root.querySelector('[data-gear]')!.replaceWith(gear.el);
  const resume = root.querySelector<HTMLButtonElement>('[data-resume]')!;
  resume.addEventListener('click', onResume);

  // The scene underneath may listen on the window (a drag, a slingshot); none of this should reach it.
  for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'] as const) {
    root.addEventListener(type, (e) => e.stopPropagation());
  }

  document.body.appendChild(root);
  resume.focus();
  return {
    close: () => {
      gear.destroy();
      root.remove();
    },
  };
}
