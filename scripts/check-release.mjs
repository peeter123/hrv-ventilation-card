// Last step of `npm run release` (after `npm run check` and `npm run build`): loads the build from build/ in
// happy-dom, checks that it registers all three cards, and only then copies that exact file to dist/. So a
// bundle that does not register the cards cannot replace the one that is deployed from dist/; whether the cards
// work is up to the tests that `npm run check` runs first. It refuses a build that is older than src/ (a stale
// build from an earlier `npm run build`) and a build of more than one file (the bundle must be self-contained).
// `--dry-run` checks without copying.
import { copyFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { GlobalRegistrator } from '@happy-dom/global-registrator';

const CARDS = ['hrv-ventilation-card', 'hrv-recovery-balance-card', 'hrv-moisture-balance-card'];
const BUNDLE = 'hrv-ventilation-card.js';
const buildDir = fileURLToPath(new URL('../build/', import.meta.url));
const distDir = fileURLToPath(new URL('../dist/', import.meta.url));
const srcDir = fileURLToPath(new URL('../src/', import.meta.url));
const built = join(buildDir, BUNDLE);

/** @param {string} dir @returns {number} newest modification time of a file below dir */
function newest(dir) {
  return Math.max(
    0,
    ...readdirSync(dir, { withFileTypes: true }).map((entry) => {
      const path = join(dir, entry.name);
      return entry.isDirectory() ? newest(path) : statSync(path).mtimeMs;
    }),
  );
}

/** @returns {Promise<string>} why the build may not be released, or '' when it may */
async function check() {
  const files = readdirSync(buildDir).filter((name) => !name.startsWith('.'));
  if (files.length !== 1 || files[0] !== BUNDLE) return `build/ must hold only ${BUNDLE}, found ${files.join(', ')}`;
  if (statSync(built).mtimeMs < newest(srcDir)) return 'the build is older than src/; run npm run build first';
  GlobalRegistrator.register({ url: 'http://localhost/' });
  try {
    await import(pathToFileURL(built).href);
    // customElements is a happy-dom global now; this file is type-checked without the DOM library.
    const registry = /** @type {{ get(tag: string): unknown }} */ (Reflect.get(globalThis, 'customElements'));
    const missing = CARDS.filter((tag) => !registry.get(tag));
    return missing.length > 0 ? `the build does not register ${missing.join(', ')}` : '';
  } catch (error) {
    return `the build failed to load: ${String(error)}`;
  } finally {
    await GlobalRegistrator.unregister();
  }
}

const failure = await check();
let message;
if (failure) {
  message = `release: ${failure}; dist/ was not touched.\n`;
} else if (process.argv.includes('--dry-run')) {
  message = 'release: all three cards registered (dry run, dist/ not touched).\n';
} else {
  mkdirSync(distDir, { recursive: true });
  copyFileSync(built, join(distDir, BUNDLE));
  message = 'release: all three cards registered; copied build/ to dist/.\n';
}
// Exit explicitly (a timer started by the bundle would keep Node alive), after the message is flushed.
const stream = failure ? process.stderr : process.stdout;
stream.write(message, () => process.exit(failure ? 1 : 0));
