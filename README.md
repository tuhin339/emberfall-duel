# Emberfall Duel

An original one-player card battler. You are the Ember Duelist; across the felt sits
**Vex, the Ashen Warlock**, an AI opponent. Both duelists start at **20 life** — the
first to reach 0 falls.

## How to play

- You open with 4 cards, then draw 1 at the start of each of your turns.
- **Energy:** on turn N you have N energy (up to 5), refilled every turn. Every card
  costs energy, shown in the teal crystal at its corner.
- **Creatures** go on your row of 3 slots: click a creature in your hand, then click
  an empty slot. Each shows its attack (orange badge) and health (red badge).
- **Spells** resolve the moment you click them — no target needed:
  - *Spark Volley* deals 3 damage to the enemy's strongest creature, or to Vex
    himself if his row is empty.
  - *Second Wind* restores 3 health to your weakest creature, or to you if your row
    is empty.
- **END TURN** starts combat: each of your creatures fights the creature opposite it
  (they wound each other at the same time; anything at 0 health dies), and a creature
  with nothing opposite it strikes the enemy duelist's life directly. Then Vex takes
  his turn the same way — he fields the dearest creatures he can afford, casts spells
  when they help, and his row strikes back.

The card pool holds ten original cards — Mist Wisp, Ember Imp, Cinder Hound, Ash
Archer, Thornback Golem, Tide Serpent, Storm Roc, Obsidian Titan, and the two spells —
dealt from a shuffled 24-card deck.

## Controls

- **Mouse / touch:** click a hand card to select it (spells cast at once), click a
  glowing slot to field a creature, click END TURN to fight.
- **Keyboard:** `1`–`5` pick a hand card, `Q` / `W` / `E` pick the left / middle /
  right slot, `Enter` begins the duel, ends the turn, or starts again.

Win and loss end on a full-screen panel with a **Play Again** button.

## How it was built

Plain static files — no libraries, no build step, no network. `game/index.html`
carries the ember-and-teal felt table styling; the game logic lives in ES modules
under `game/src/`:

- `game.js` — the rules engine: turns, energy, combat, spells, and the AI duelist's
  greedy play. No DOM, so the rules stand alone.
- `cards.js` — the card pool and the 24-card deck recipe.
- `render.js` — the DOM table: life orbs, energy crystals, card backs, boards, hand,
  message log, and the title / victory / defeat overlays.
- `main.js` — boot and the end-turn sequence, played in beats so each blow lands
  visibly; also wires mouse and keyboard to the same handlers.
- `input.js` — the keyboard map. `audio.js` — a tiny WebAudio synth (card, hit,
  death, heal, win and lose blips; no audio files). `random.js` — a seeded mulberry32
  generator, so `?seed=N` reproduces a duel and the screenshot scenes are stable.
- `shots.js` — the staged scenes behind `?shot=title|table|win|loss`.

Run it locally with `node serve.ts` and open <http://localhost:8080>. Hand it in with
`node main.ts`, which copies `game/` and `screenshots/` to the output directory and
writes `dossier.json` via the vendored make.fun library.
