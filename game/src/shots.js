// The staged scenes behind ?shot=title|table|win|loss. Each one arranges a real duel
// state — dealt from the seeded decks, then set into the moment the picture should
// show — so a screenshot is the game itself, not a mock-up, and the same seed always
// stages the same table.
import { makeCard } from './cards.js';
import { energyForTurn, startDuel } from './game.js';

function wound(card, hp) {
  card.hp = hp;
  return card;
}

function trimDeck(side, left) {
  while (side.deck.length > left) side.deck.pop();
}

/**
 * Arrange `state` (a fresh duel from createDuel) into the named scene.
 * Returns the scene name it staged, or null for an unknown one.
 */
export function stageShot(name, state) {
  if (name === 'title') {
    state.phase = 'title';
    state.log = 'The table is set. Begin the duel when you are ready.';
    return 'title';
  }
  if (name === 'table') {
    startDuel(state);
    state.turn = 4;
    state.player.life = 14;
    state.enemy.life = 11;
    state.player.board = [makeCard('hound'), wound(makeCard('golem'), 4), null];
    state.enemy.board = [makeCard('archer'), wound(makeCard('serpent'), 2), null];
    state.player.hand = [makeCard('roc'), makeCard('spark'), makeCard('wisp')];
    state.enemy.hand = [makeCard('imp'), makeCard('hound'), makeCard('wind')];
    trimDeck(state.player, 13);
    trimDeck(state.enemy, 12);
    state.player.maxEnergy = energyForTurn(4);
    state.player.energy = 2;
    state.selected = -1;
    state.log = 'Turn 4 — the duel is warming up. Your move.';
    return 'table';
  }
  if (name === 'win') {
    startDuel(state);
    state.turn = 6;
    state.player.life = 9;
    state.enemy.life = 0;
    state.player.board = [makeCard('roc'), wound(makeCard('titan'), 5), null];
    state.enemy.board = [null, wound(makeCard('imp'), 1), null];
    state.player.hand = [makeCard('wind'), makeCard('archer')];
    state.enemy.hand = [makeCard('wisp'), makeCard('spark')];
    trimDeck(state.player, 8);
    trimDeck(state.enemy, 9);
    state.phase = 'over';
    state.winner = 'player';
    state.log = 'The Ashen Warlock falls. Emberfall is yours!';
    return 'win';
  }
  if (name === 'loss') {
    startDuel(state);
    state.turn = 5;
    state.player.life = 0;
    state.enemy.life = 6;
    state.player.board = [makeCard('wisp'), null, null];
    state.enemy.board = [makeCard('serpent'), wound(makeCard('roc'), 3), null];
    state.player.hand = [makeCard('imp'), makeCard('golem')];
    state.enemy.hand = [makeCard('hound'), makeCard('archer'), makeCard('titan')];
    trimDeck(state.player, 10);
    trimDeck(state.enemy, 7);
    state.phase = 'over';
    state.winner = 'enemy';
    state.log = 'Your light gutters out. The Warlock takes the table.';
    return 'loss';
  }
  return null;
}
