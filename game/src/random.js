// Seeded randomness for Emberfall Duel. A mulberry32 generator: feed it a seed and it
// deals the same shuffle every time, which keeps the screenshot scenes repeatable and
// lets a shared seed reproduce a whole duel card for card.

export function createRandom(seed) {
  let state = seed | 0;
  return function next() {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates shuffle driven by a seeded generator; shuffles in place and returns the array. */
export function shuffled(rng, items) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const held = items[i];
    items[i] = items[j];
    items[j] = held;
  }
  return items;
}
