// Emberfall Duel — the hand-in program (Node 22, standard library only).
//
// The game itself is the game/ folder beside this file: static HTML and ES modules a
// desktop browser runs offline, no build step, no network. This program's one job is
// to deliver it: copy game/ and whatever screenshots sit in screenshots/ into the
// output directory, then ask the vendored make.fun library to summarise the delivery
// into dossier.json, the file the judge reads.
//
// The output directory is /output inside the grader's container; anywhere else,
// MAKEFUN_OUTPUT_DIR names it instead:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Play the game locally with `node serve.ts`, then open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const home = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(home, 'game'), join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(home, 'screenshots'))) {
  cpSync(join(home, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The caps are the scorer's own (reference/gate.json): at most 4 screenshots of
// 256 KiB each, at most 993 game files totalling 48 MiB, no game path over 1000
// bytes, and 160 KiB of source text in the dossier. Passing them here means the
// hand-in refuses itself rather than handing the scorer something it would refuse.
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
