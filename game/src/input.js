// Keyboard control for Emberfall Duel: number keys pick a card from the hand, Q/W/E
// aim at the three slots left to right, and Enter confirms whatever the moment calls
// for (begin, end turn, play again). Mouse and touch do everything too — main.js
// routes both through the same handlers.

export function bindKeys(onAction) {
  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (key >= '1' && key <= '5') {
      onAction({ type: 'hand', index: Number(key) - 1 });
    } else if (key === 'q' || key === 'w' || key === 'e') {
      onAction({ type: 'slot', index: { q: 0, w: 1, e: 2 }[key] });
    } else if (key === 'enter') {
      onAction({ type: 'confirm' });
    }
  });
}
