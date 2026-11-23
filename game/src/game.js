// The Emberfall Duel engine: two duelists, 20 life each, three slots a side, and one
// rule for combat — when a turn ends, every creature strikes whatever stands opposite
// it, or the enemy duelist if nothing does. This module owns the rules and nothing
// else: no DOM, no timers. The renderer paints the state; main.js sequences the turns.
import { buildDeck, makeCard } from './cards.js';
import { createRandom } from './random.js';

export const START_LIFE = 20;
export const BOARD_SLOTS = 3;
export const OPENING_HAND = 4;
export const SPARK_DAMAGE = 3;
export const WIND_HEAL = 3;

export function energyForTurn(turn) {
  return Math.min(turn, 5);
}

function freshSide(rng) {
  return {
    life: START_LIFE,
    deck: buildDeck(rng),
    hand: [],
    board: [null, null, null],
    energy: 0,
    maxEnergy: 0,
  };
}

export function createDuel(seed) {
  const rng = createRandom(seed);
  return {
    seed,
    rng,
    phase: 'title', // 'title' | 'play' | 'over'
    winner: null, // 'player' | 'enemy' once phase is 'over'
    turn: 1,
    player: freshSide(rng),
    enemy: freshSide(rng),
    selected: -1, // index into the player's hand, or -1
    log: 'The table is set. Begin the duel when you are ready.',
    fx: [], // sound cue names, drained by main.js after each beat
  };
}

function draw(side, count) {
  for (let i = 0; i < count; i += 1) {
    const card = side.deck.pop();
    if (!card) return;
    side.hand.push(card);
  }
}

/** Deal the opening hands and open turn 1 for the player (no draw: the opening hand is the draw). */
export function startDuel(state) {
  draw(state.player, OPENING_HAND);
  draw(state.enemy, OPENING_HAND);
  state.phase = 'play';
  state.turn = 1;
  state.player.maxEnergy = energyForTurn(state.turn);
  state.player.energy = state.player.maxEnergy;
  state.selected = -1;
  state.log = 'Turn 1 — you drew your opening hand. Play a creature, or end the turn.';
}

/** Open a player turn: draw a card and refill energy to this turn's allowance. */
export function beginPlayerTurn(state, advance = true) {
  if (advance) state.turn += 1;
  draw(state.player, 1);
  state.player.maxEnergy = energyForTurn(state.turn);
  state.player.energy = state.player.maxEnergy;
  state.selected = -1;
}

function say(state, message) {
  state.log = message;
}

/** The strongest creature on a board (highest attack, then most health), or null. */
function strongest(board) {
  let best = null;
  for (const card of board) {
    if (!card) continue;
    if (!best || card.atk > best.atk || (card.atk === best.atk && card.hp > best.hp)) best = card;
  }
  return best;
}

/** The weakest living creature on a board (least current health), or null. */
function weakest(board) {
  let best = null;
  for (const card of board) {
    if (!card) continue;
    if (!best || card.hp < best.hp) best = card;
  }
  return best;
}

/** Remove every creature at 0 health or less; returns true if anything died. */
function sweepDead(state) {
  let died = false;
  for (const side of [state.player, state.enemy]) {
    for (let i = 0; i < BOARD_SLOTS; i += 1) {
      if (side.board[i] && side.board[i].hp <= 0) {
        side.board[i] = null;
        died = true;
      }
    }
  }
  return died;
}

function checkWinner(state) {
  if (state.enemy.life <= 0 && state.player.life > 0) {
    state.enemy.life = Math.max(0, state.enemy.life);
    state.phase = 'over';
    state.winner = 'player';
    state.fx.push('win');
    say(state, 'The Ashen Warlock falls. Emberfall is yours!');
  } else if (state.player.life <= 0) {
    state.player.life = Math.max(0, state.player.life);
    state.phase = 'over';
    state.winner = 'enemy';
    state.fx.push('lose');
    say(state, 'Your light gutters out. The Warlock takes the table.');
  }
}

/** Put the hand card at `handIndex` onto `side`'s board at `slot`, paying its cost. */
function playCreatureFor(state, side, handIndex, slot) {
  const card = side.hand[handIndex];
  if (!card || card.kind !== 'creature') return false;
  if (side.board[slot] || card.cost > side.energy) return false;
  side.hand.splice(handIndex, 1);
  side.energy -= card.cost;
  side.board[slot] = card;
  state.fx.push('play');
  return true;
}

/** Resolve the spell at `handIndex` for `side` against `foe`. Spells need no target click. */
function castSpellFor(state, side, foe, handIndex) {
  const card = side.hand[handIndex];
  if (!card || card.kind !== 'spell' || card.cost > side.energy) return false;
  side.hand.splice(handIndex, 1);
  side.energy -= card.cost;
  if (card.id === 'spark') {
    const target = strongest(foe.board);
    if (target) {
      target.hp -= SPARK_DAMAGE;
      target.flash = true; // renderer flashes the card once so the blow is seen
      state.fx.push('hit');
      say(state, `Spark Volley sears ${target.name} for ${SPARK_DAMAGE}.`);
      if (sweepDead(state)) state.fx.push('death');
    } else {
      foe.life -= SPARK_DAMAGE;
      state.fx.push('hit');
      say(state, `Spark Volley flies past the empty row — the foe takes ${SPARK_DAMAGE}.`);
    }
  } else if (card.id === 'wind') {
    const target = weakest(side.board);
    if (target) {
      const healed = Math.min(WIND_HEAL, target.maxHp - target.hp);
      target.hp += healed;
      state.fx.push('heal');
      say(state, healed > 0 ? `Second Wind knits ${target.name} back together (+${healed}).` : `${target.name} is already whole; the wind passes it by.`);
    } else {
      const healed = Math.min(WIND_HEAL, START_LIFE - side.life);
      side.life += healed;
      state.fx.push('heal');
      say(state, healed > 0 ? `Second Wind restores you (+${healed} life).` : 'You are already whole; the wind passes you by.');
    }
  }
  checkWinner(state);
  return true;
}

/** The player's creature play: hand index + one of their empty slots. */
export function playCreature(state, handIndex, slot) {
  if (state.phase !== 'play') return false;
  const card = state.player.hand[handIndex];
  if (!card) return false;
  if (card.cost > state.player.energy) {
    say(state, `${card.name} needs ${card.cost} energy — you have ${state.player.energy}.`);
    return false;
  }
  if (state.player.board[slot]) {
    say(state, 'That slot is taken. Choose an empty one.');
    return false;
  }
  const ok = playCreatureFor(state, state.player, handIndex, slot);
  if (ok) {
    state.selected = -1;
    say(state, `${card.name} takes the field.`);
  }
  return ok;
}

/** The player's spell cast: resolves at once, no target needed. */
export function castSpell(state, handIndex) {
  if (state.phase !== 'play') return false;
  const card = state.player.hand[handIndex];
  if (!card) return false;
  if (card.cost > state.player.energy) {
    say(state, `${card.name} needs ${card.cost} energy — you have ${state.player.energy}.`);
    return false;
  }
  return castSpellFor(state, state.player, state.enemy, handIndex);
}

/**
 * Combat for the side whose turn is ending: each of its creatures fights the creature
 * opposite (simultaneous damage), and an unopposed creature strikes the enemy duelist.
 */
export function resolveCombat(state, attackerKey) {
  const attacker = state[attackerKey];
  const defender = attackerKey === 'player' ? state.enemy : state.player;
  let struck = false;
  for (let i = 0; i < BOARD_SLOTS; i += 1) {
    const mine = attacker.board[i];
    if (!mine) continue;
    const theirs = defender.board[i];
    struck = true;
    if (theirs) {
      theirs.hp -= mine.atk;
      mine.hp -= theirs.atk;
      theirs.flash = true; // both cards flash on the next paint: the hit must read
      mine.flash = true;
    } else {
      defender.life -= mine.atk;
    }
  }
  if (struck) state.fx.push('hit');
  if (sweepDead(state)) state.fx.push('death');
  checkWinner(state);
}

/**
 * The AI duelist's plays (its combat is a separate beat, so the player can watch the
 * board fill before it strikes). Greedy: field the dearest affordable creature first,
 * then spend leftover energy on spells when they would do some good.
 */
export function runEnemyPlays(state) {
  const foe = state.enemy;
  foe.maxEnergy = energyForTurn(state.turn);
  foe.energy = foe.maxEnergy;
  draw(foe, 1);
  for (let guard = 0; guard < 12; guard += 1) {
    const freeSlot = foe.board.indexOf(null);
    let bestIdx = -1;
    for (let i = 0; i < foe.hand.length; i += 1) {
      const card = foe.hand[i];
      if (card.kind === 'creature' && card.cost <= foe.energy) {
        if (bestIdx === -1 || card.cost > foe.hand[bestIdx].cost) bestIdx = i;
      }
    }
    if (bestIdx !== -1 && freeSlot !== -1) {
      const name = foe.hand[bestIdx].name;
      playCreatureFor(state, foe, bestIdx, freeSlot);
      say(state, `The Warlock fields ${name}.`);
      continue;
    }
    const sparkIdx = foe.hand.findIndex((c) => c.id === 'spark' && c.cost <= foe.energy);
    if (sparkIdx !== -1 && (weakest(state.player.board) || bestIdx === -1)) {
      castSpellFor(state, foe, state.player, sparkIdx);
      continue;
    }
    const windIdx = foe.hand.findIndex((c) => c.id === 'wind' && c.cost <= foe.energy);
    const hurt = foe.board.some((c) => c && c.hp < c.maxHp);
    if (windIdx !== -1 && (hurt || foe.life <= START_LIFE - WIND_HEAL)) {
      castSpellFor(state, foe, state.player, windIdx);
      continue;
    }
    break;
  }
  if (state.phase === 'play') say(state, 'The Warlock ends its turn — its creatures strike!');
}

export { makeCard };
