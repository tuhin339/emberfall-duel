// Emberfall Duel's renderer: plain DOM, rebuilt from the state on every beat. Cards
// are real elements — chunky bordered tiles with a cost crystal, a big glyph portrait,
// and attack/health badges — so they stay crisp and readable at screenshot size.
// Clicks are reported through data attributes; main.js owns the handling.

function cardFace(card) {
  const stats = card.kind === 'creature'
    ? `<span class="stats"><span class="badge atk">${card.atk}</span><span class="badge hp${card.hp < card.maxHp ? ' hurt' : ''}">${card.hp}</span></span>`
    : `<span class="stats"><span class="badge atk">✹</span><span class="badge hp">✚</span></span>`;
  return `
    <span class="cost"><span>${card.cost}</span></span>
    <span class="cname">${card.name}</span>
    <span class="art" style="color:${card.accent}">${card.glyph}</span>
    <span class="ctext">${card.text}</span>
    ${stats}`;
}

function slotHtml(state, side, index) {
  const card = state[side].board[index];
  if (card) return `<div class="slot filled"><div class="card ${card.kind}${card.flash ? ' flash' : ''}">${cardFace(card)}</div></div>`;
  const hand = state.player.hand[state.selected];
  const targetable = side === 'player' && state.phase === 'play' && hand && hand.kind === 'creature';
  return `<div class="slot${targetable ? ' targetable' : ''}" data-slot="${index}">+</div>`;
}

function heroRow(state, side) {
  const duelist = state[side];
  const isPlayer = side === 'player';
  const name = isPlayer ? 'YOU' : 'VEX';
  const title = isPlayer ? 'THE EMBER DUELIST' : 'THE ASHEN WARLOCK · AI';
  const crystals = isPlayer
    ? `<div class="crystals"><span class="cap">ENERGY</span>${Array.from({ length: duelist.maxEnergy }, (_, i) => `<span class="${i < duelist.energy ? 'on' : 'off'}">◆</span>`).join('')}</div>`
    : `<div class="backs">${duelist.hand.map(() => '<div class="card-back"></div>').join('')}</div>`;
  const action = isPlayer
    ? `<button id="end-turn" data-action="end-turn" ${state.phase !== 'play' ? 'disabled' : ''}>END TURN ⏎</button>`
    : '';
  return `
    <div class="hero-row">
      <div class="duelist">
        <div class="life-orb${isPlayer ? ' player' : ''}"><span class="life-num">${duelist.life}</span><span class="life-cap">LIFE</span></div>
        <div class="who"><div class="name">${name}</div><div class="sub">${title}</div></div>
      </div>
      ${crystals}
      <div class="pile"><div class="deck-glyph">▤</div><div class="deck-count">${duelist.deck.length}</div><div>DECK</div></div>
      ${action}
    </div>`;
}

function handHtml(state) {
  if (state.player.hand.length === 0) return '<div class="empty-hand">— your hand is empty —</div>';
  return state.player.hand.map((card, i) => {
    const classes = ['card', card.kind];
    if (i === state.selected) classes.push('selected');
    if (card.cost > state.player.energy) classes.push('unaffordable');
    return `<button class="${classes.join(' ')}" data-hand="${i}" aria-label="${card.name}, cost ${card.cost}">${cardFace(card)}</button>`;
  }).join('');
}

function overlayHtml(state) {
  if (state.phase === 'title') {
    return `
    <div class="overlay"><div class="panel">
      <h1>EMBERFALL<br>DUEL</h1>
      <p class="tagline">A card duel of embers and tide — outlast Vex, the Ashen Warlock.</p>
      <p class="rules">
        <b>How to play:</b> each turn you gain energy (turn N gives N, up to 5) and draw a card.
        Click a creature, then an empty slot, to field it. Spells fire the moment you click them.
        On <b>END TURN</b> your creatures strike whatever stands opposite — or the Warlock himself
        if nothing does. First duelist to 0 life falls.<br>
        <b>Keys:</b> 1–5 pick a card · Q/W/E pick a slot · Enter ends the turn.
      </p>
      <button class="big-btn" data-action="start">BEGIN THE DUEL</button>
    </div></div>`;
  }
  if (state.phase === 'over') {
    const won = state.winner === 'player';
    return `
    <div class="overlay"><div class="panel">
      <h1 class="${won ? 'teal' : 'red'}">${won ? 'VICTORY' : 'DEFEAT'}</h1>
      <p class="tagline">${won
        ? 'The Ashen Warlock’s embers gutter out. The table — and Emberfall — are yours.'
        : 'Vex sweeps your ashes from the felt. The tide will bring another challenger.'}</p>
      <p class="rules" style="text-align:center">The duel lasted ${state.turn} turn${state.turn === 1 ? '' : 's'} · You ${state.player.life} life · Vex ${state.enemy.life} life</p>
      <button class="big-btn" data-action="restart">PLAY AGAIN</button>
    </div></div>`;
  }
  return '';
}

/** Paint the whole table for the current state into the app root. */
export function renderApp(state, root, statusEl) {
  root.innerHTML = `
    <div class="topbar">
      <div class="brand">EMBERFALL <small>DUEL</small></div>
      <div class="turn-tag">TURN ${state.turn}</div>
    </div>
    <div class="log">${state.log}</div>
    ${heroRow(state, 'enemy')}
    <div class="board">${[0, 1, 2].map((i) => slotHtml(state, 'enemy', i)).join('')}</div>
    <div class="board">${[0, 1, 2].map((i) => slotHtml(state, 'player', i)).join('')}</div>
    ${heroRow(state, 'player')}
    <div class="hand">${handHtml(state)}</div>
    ${overlayHtml(state)}`;
  if (statusEl) statusEl.textContent = state.log;
}
