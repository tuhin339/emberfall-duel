// Emberfall Duel's boot and turn conductor. The engine (game.js) owns the rules; this
// file owns the clock: a click or a key changes the state, the table is repainted, and
// END TURN plays out in beats — your combat, the Warlock's plays, its combat, your
// next turn — with a pause between them so each blow can be seen landing.
//
// ?seed=N fixes the shuffle. ?shot=title|table|win|loss (with &seed=N) stages that
// scene instead of opening live play, paints it, and sets window.__shotReady.
import { drainFx } from './audio.js';
import { bindKeys } from './input.js';
import { renderApp } from './render.js';
import { stageShot } from './shots.js';
import {
  beginPlayerTurn, castSpell, createDuel, playCreature, resolveCombat, runEnemyPlays, startDuel,
} from './game.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const root = document.getElementById('app');
const statusEl = document.getElementById('status');

let state = createDuel(seed);
let busy = false; // true while the end-turn beats play out; input waits

function paint() {
  renderApp(state, root, statusEl);
  drainFx(state);
  // A damage flash shows exactly once: the class is on the freshly painted card,
  // so clear the flags now and the next repaint builds the card without it.
  for (const side of [state.player, state.enemy]) {
    for (const card of side.board) if (card) delete card.flash;
  }
}

const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

function startGame(newSeed) {
  state = createDuel(newSeed);
  startDuel(state);
  busy = false;
  paint();
}

function pickHand(index) {
  if (busy || state.phase !== 'play') return;
  const card = state.player.hand[index];
  if (!card) return;
  if (card.kind === 'spell') {
    castSpell(state, index);
    state.selected = -1;
    paint();
    return;
  }
  state.selected = state.selected === index ? -1 : index;
  paint();
}

function pickSlot(index) {
  if (busy || state.phase !== 'play' || state.selected === -1) return;
  playCreature(state, state.selected, index);
  paint();
}

async function endTurn() {
  if (busy || state.phase !== 'play') return;
  busy = true;
  state.selected = -1;
  resolveCombat(state, 'player');
  paint();
  if (state.phase === 'over') { busy = false; return; }
  await sleep(750);
  runEnemyPlays(state);
  paint();
  if (state.phase === 'over') { busy = false; return; }
  await sleep(750);
  resolveCombat(state, 'enemy');
  if (state.phase === 'play') state.log = 'The Warlock’s creatures strike!';
  paint();
  if (state.phase === 'over') { busy = false; return; }
  await sleep(450);
  beginPlayerTurn(state);
  state.log = `Turn ${state.turn} — you draw a card. Your move.`;
  busy = false;
  paint();
}

function confirm() {
  if (state.phase === 'title') startGame(seed);
  else if (state.phase === 'over') startGame(Math.floor(Math.random() * 4294967296));
  else void endTurn();
}

root.addEventListener('click', (event) => {
  const el = event.target.closest('[data-action], [data-hand], [data-slot]');
  if (!el) return;
  if (el.dataset.action === 'start' || el.dataset.action === 'restart') {
    startGame(el.dataset.action === 'start' ? seed : Math.floor(Math.random() * 4294967296));
  } else if (el.dataset.action === 'end-turn') {
    void endTurn();
  } else if (el.dataset.hand !== undefined) {
    pickHand(Number(el.dataset.hand));
  } else if (el.dataset.slot !== undefined) {
    pickSlot(Number(el.dataset.slot));
  }
});

bindKeys((action) => {
  if (action.type === 'hand') pickHand(action.index);
  else if (action.type === 'slot') pickSlot(action.index);
  else if (action.type === 'confirm') confirm();
});

if (shot) {
  stageShot(shot, state);
  paint();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
} else {
  paint();
}
