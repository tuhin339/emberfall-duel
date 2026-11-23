// The Emberfall card pool: eight creatures and two spells, every one invented for this
// game. A duel deck holds 24 cards, built from the pool by the recipe below (trusted
// cheap creatures in threes, the Titan as a single crown), then shuffled with the
// seeded generator so a seed always deals the same duel.
import { shuffled } from './random.js';

export const CARD_POOL = [
  { id: 'wisp', kind: 'creature', name: 'Mist Wisp', cost: 1, atk: 1, hp: 2, glyph: '☾', accent: '#57c7b8', text: 'A lantern-ghost of the drowned marshes.' },
  { id: 'imp', kind: 'creature', name: 'Ember Imp', cost: 1, atk: 2, hp: 1, glyph: '★', accent: '#ff9a3c', text: 'All spark, no patience.' },
  { id: 'hound', kind: 'creature', name: 'Cinder Hound', cost: 2, atk: 3, hp: 2, glyph: '♞', accent: '#ff7847', text: 'It fetches bones. Still warm.' },
  { id: 'archer', kind: 'creature', name: 'Ash Archer', cost: 2, atk: 2, hp: 3, glyph: '⌖', accent: '#b8c4ce', text: 'Her arrows fall like grey snow.' },
  { id: 'golem', kind: 'creature', name: 'Thornback Golem', cost: 3, atk: 3, hp: 5, glyph: '♜', accent: '#8fce6e', text: 'A wall that learned to walk.' },
  { id: 'serpent', kind: 'creature', name: 'Tide Serpent', cost: 3, atk: 4, hp: 3, glyph: '∿', accent: '#4db8ff', text: 'The river, with teeth.' },
  { id: 'roc', kind: 'creature', name: 'Storm Roc', cost: 4, atk: 5, hp: 4, glyph: '☈', accent: '#ffd23c', text: 'Thunder, given wings.' },
  { id: 'titan', kind: 'creature', name: 'Obsidian Titan', cost: 5, atk: 6, hp: 7, glyph: '▲', accent: '#c9a7ff', text: 'A mountain that holds a grudge.' },
  { id: 'spark', kind: 'spell', name: 'Spark Volley', cost: 2, glyph: '✹', accent: '#ffcf5c', text: 'Deal 3 damage to the foe’s strongest creature — or to the foe, if none stands.' },
  { id: 'wind', kind: 'spell', name: 'Second Wind', cost: 2, glyph: '✚', accent: '#7fe08a', text: 'Restore 3 health to your weakest creature — or to yourself, if none stands.' },
];

const BY_ID = new Map(CARD_POOL.map((def) => [def.id, def]));

/** How many copies of each card a 24-card duel deck carries. */
const DECK_RECIPE = [
  ['wisp', 3], ['imp', 3], ['hound', 3], ['archer', 3], ['golem', 2],
  ['serpent', 2], ['roc', 2], ['titan', 1], ['spark', 3], ['wind', 2],
];

let nextUid = 1;

/** A fresh, playable copy of a pool card: creatures start at full health. */
export function makeCard(id) {
  const def = BY_ID.get(id);
  if (!def) throw new Error(`unknown card id: ${id}`);
  const card = { ...def, uid: nextUid };
  nextUid += 1;
  if (def.kind === 'creature') {
    card.maxHp = def.hp;
    card.hp = def.hp;
  }
  return card;
}

/** A shuffled 24-card deck built from the recipe. */
export function buildDeck(rng) {
  const deck = [];
  for (const [id, copies] of DECK_RECIPE) {
    for (let i = 0; i < copies; i += 1) deck.push(makeCard(id));
  }
  return shuffled(rng, deck);
}
