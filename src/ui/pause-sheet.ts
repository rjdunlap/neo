import type { PauseAction } from '../app/pause';
import { gearButton, type Gear } from './grownups';

export interface PauseSheetOptions {
  /** "Keep playing" was pressed. (Esc is handled by the app, which calls `close` itself.) */
  onResume: () => void;
  /** The gear was held long enough. */
  onGrownUps: () => void;
  /** The gear was only tapped. */
  onShort?: () => void;
  /** The round's own entries, under "Keep playing": each resumes, then runs. */
  actions?: readonly PauseAction[];
}

export interface PauseSheet {
  close(): void;
  /** A pad: move the focus up (-1) or down (1) the sheet's buttons, the held gear aside. */
  move(step: -1 | 1): void;
  /** A pad: press the focused button. */
  press(): void;
}

/**
 * What Esc shows on the island: the scene underneath holds still, and a grown-up can keep playing or hold the gear to
 * open settings, and a round can offer its own entries (start again, show a hint). Plain HTML so a keyboard reaches every
 * button; a pad moves over them through `move` and `press`.
 */
export function openPauseSheet({ onResume, onGrownUps, onShort, actions = [] }: PauseSheetOptions): PauseSheet {
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
  const buttons = [resume];
  for (const action of actions) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn';
    button.textContent = action.label;
    button.addEventListener('click', () => {
      onResume();
      action.run();
    });
    resume.parentElement!.insertBefore(button, root.querySelector('.pause__grownups'));
    buttons.push(button);
  }

  // The scene underneath may listen on the window (a drag, a slingshot); none of this should reach it.
  for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'] as const) {
    root.addEventListener(type, (e) => e.stopPropagation());
  }

  document.body.appendChild(root);
  resume.focus();
  const focused = () => buttons.indexOf(document.activeElement as HTMLButtonElement);
  return {
    close: () => {
      gear.destroy();
      root.remove();
    },
    move: (step) => {
      root.classList.add('pause--pad');
      const at = focused();
      buttons[at < 0 ? 0 : (at + step + buttons.length) % buttons.length].focus();
    },
    press: () => {
      root.classList.add('pause--pad');
      const at = focused();
      if (at < 0) buttons[0].focus();
      else buttons[at].click();
    },
  };
}
