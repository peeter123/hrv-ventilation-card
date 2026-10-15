// `npm run check:ids` (part of `npm run check`): fails when a bundle contains identifiers of a particular
// installation, which the cards must take from their config instead. It looks for entity IDs (a domain, a dot and a
// name) after a quote, a backtick, whitespace or a colon, as in "sensor.x", `entity: sensor.x` or "e.g. sensor.x",
// so property access such as `this.event.target` in the code is not mistaken for one, and for the prefixes of the
// hard-coded cards it replaced: the integration's serial-based prefix and the old derived-sensor prefix. An ID
// assembled at runtime from separate pieces is beyond a text search; the tests and the review cover that. The default file is the build in build/; pass another path to check that file instead, e.g.
// `node scripts/check-ids.mjs dist/hrv-ventilation-card.js`.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const DOMAINS = [
  'sensor',
  'binary_sensor',
  'fan',
  'climate',
  'humidifier',
  'water_heater',
  'cover',
  'valve',
  'light',
  'switch',
  'select',
  'number',
  'button',
  'text',
  'event',
  'update',
  'weather',
  'timer',
  'counter',
  'input_boolean',
  'input_number',
  'input_select',
  'input_text',
  'input_datetime',
  'input_button',
];
const BEFORE = `['"\`\\s:]`;
const PATTERNS = [
  {
    what: 'entity ID',
    pattern: new RegExp(`(?<=${BEFORE})(?:${DOMAINS.join('|')})\\.[a-z0-9_]*[a-z0-9]`, 'g'),
  },
  { what: 'serial-based integration prefix', pattern: /zehnder_comfoair_q_[a-z0-9]+_/g },
  { what: 'old derived-sensor prefix', pattern: /comfoair_q450_/g },
];

const file = process.argv[2] ?? fileURLToPath(new URL('../build/hrv-ventilation-card.js', import.meta.url));
let source = '';
try {
  source = readFileSync(file, 'utf8');
} catch (error) {
  process.stderr.write(`check:ids: cannot read ${file}: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}
const found = PATTERNS.flatMap(({ what, pattern }) =>
  [...source.matchAll(pattern)].map((match) => `  ${what}: ${match[0]} (offset ${String(match.index)})`),
);

if (found.length > 0) {
  process.stderr.write(`check:ids: ${file} contains installation identifiers:\n${found.join('\n')}\n`);
  process.exit(1);
}
process.stdout.write(`check:ids: no installation identifiers in ${file}\n`);
