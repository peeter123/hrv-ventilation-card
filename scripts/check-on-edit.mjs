// PostToolUse hook for Claude Code: checks a TypeScript file under src/, test/ or dev/ after every edit.
// Formats it with Prettier, lints it with ESLint, type-checks the project and runs the related unit tests.
// Exits 2 with the output on failure so the agent sees it. On success it only speaks up when Prettier changed
// the file, so the agent knows its copy is stale. Any other file exits 0 silently. An unreadable payload exits 1
// (a non-blocking error the user sees), so a broken hook does not pass every edit silently.
// Exit codes are set with process.exitCode, not process.exit(), so output on stderr is flushed first.
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const CHECKED_DIRS = ['src', 'test', 'dev'];
const CHECKED_EXTENSIONS = /\.(ts|mts|cts|tsx)$/i;
const TSC_CACHE = join(root, 'node_modules', '.cache', 'check-on-edit.tsbuildinfo');
// Windows paths are case-insensitive, so `SRC\index.ts` is the same file as `src\index.ts`.
/** @param {string} path */
const normalise = (path) => (process.platform === 'win32' ? path.toLowerCase() : path);

/**
 * Runs a tool from node_modules; resolves to null on success or to the labelled output on failure.
 * @param {string} label
 * @param {string} script path below node_modules
 * @param {string[]} args
 * @returns {Promise<string | null>}
 */
function run(label, script, args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [join(root, 'node_modules', script), ...args], { cwd: root });
    let output = '';
    child.stdout.on('data', (chunk) => (output += chunk));
    child.stderr.on('data', (chunk) => (output += chunk));
    child.on('error', (error) => resolve(`${label} failed:\n${output.trim()}\n${String(error)}`));
    child.on('close', (status) => resolve(status === 0 ? null : `${label} failed:\n${output.trim()}`));
  });
}

/** @returns {Promise<number>} the exit code */
async function main() {
  let input;
  try {
    input = JSON.parse(readFileSync(0, 'utf8'));
  } catch (error) {
    process.stderr.write(`check-on-edit: could not read the hook payload, file not checked: ${String(error)}\n`);
    return 1;
  }
  const path = input?.tool_input?.file_path;
  if (typeof path !== 'string' || !path) return 0;

  const absolute = isAbsolute(path) ? path : join(root, path);
  const rel = relative(root, absolute);
  const topDir = normalise(rel.split(sep)[0] ?? '');
  if (!CHECKED_EXTENSIONS.test(rel) || rel.startsWith('..') || !CHECKED_DIRS.includes(topDir)) return 0;

  // A file removed after the edit (rename, checkout) has nothing left to check.
  if (!existsSync(absolute)) return 0;

  // Prettier first, so the other checks see the formatted file; the rest run in parallel.
  const before = readFileSync(absolute, 'utf8');
  const formatFailure = await run('Prettier', 'prettier/bin/prettier.cjs', ['--write', '--log-level', 'warn', rel]);
  const reformatted = readFileSync(absolute, 'utf8') !== before;
  const failures = [
    formatFailure,
    ...(await Promise.all([
      run('ESLint', 'eslint/bin/eslint.js', ['--max-warnings', '0', rel]),
      run('tsc', 'typescript/bin/tsc', [
        '-p',
        'tsconfig.json',
        '--noEmit',
        '--incremental',
        '--tsBuildInfoFile',
        TSC_CACHE,
      ]),
      run('Vitest', 'vitest/vitest.mjs', ['related', rel, '--run', '--project', 'unit', '--passWithNoTests']),
    ])),
  ].filter(Boolean);

  const note = reformatted ? `Prettier reformatted ${rel}; read it again before the next edit.` : '';
  if (failures.length > 0) {
    process.stderr.write(`check-on-edit: ${rel}\n${note ? `${note}\n` : ''}\n${failures.join('\n\n')}\n`);
    return 2;
  }
  if (note) {
    process.stdout.write(
      JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: note } }),
    );
  }
  return 0;
}

process.exitCode = await main();
