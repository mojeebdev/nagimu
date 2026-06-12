/* NAGIMU — shared sound toggle UI */

import { initAudio, isAudioEnabled, setAudioEnabled } from './audio.js';
import { getAudioEnabled, saveAudioEnabled } from './db.js';

export function updateAudioToggleButton(button) {
  const on = isAudioEnabled();
  button.setAttribute('aria-pressed', String(on));
  button.setAttribute('aria-label', on ? 'Sound on' : 'Sound off');
  button.classList.toggle('audio-toggle--on', on);
  button.classList.toggle('audio-toggle--off', !on);
}

export async function initAudioToggle(button) {
  if (!button) return;

  setAudioEnabled(await getAudioEnabled());
  updateAudioToggleButton(button);

  button.addEventListener('click', async () => {
    const next = !isAudioEnabled();
    setAudioEnabled(next);
    await saveAudioEnabled(next);
    updateAudioToggleButton(button);
    if (next) await initAudio();
  });
}