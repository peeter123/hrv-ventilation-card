/// <reference types="vite/client" />
// Reads README.md for the tests that keep the docs and the code in step: the option names in a card's tables and
// the YAML examples of a card.
import { parse } from 'yaml';

const files = import.meta.glob<string>('../README.md', { query: '?raw', import: 'default', eager: true });
export const README = Object.values(files)[0] ?? '';

/** The text from `start` up to the next line that starts with `end` (or the end of the text). */
function between(text: string, start: string, end: RegExp): string {
  const from = text.indexOf(start);
  if (from < 0) throw new Error(`README has no "${start}"`);
  const rest = text.slice(from + start.length);
  const match = end.exec(rest);
  return match ? rest.slice(0, match.index) : rest;
}

/** A card's subsection ("### <card>") within a top-level section ("## <section>"), up to the next "## " or "### ". */
export function cardSection(section: string, card: string): string {
  return between(between(README, `\n## ${section}\n`, /\n## /), `\n### ${card}\n`, /\n#{2,3} /);
}

/**
 * A card section split into its tables: the main table (before the first "#### " heading) under the key "", and each
 * "#### <name>" subsection under its name.
 */
export function subsections(text: string): Map<string, string> {
  const [main = '', ...rest] = text.split(/\n#### /);
  const parts = new Map([['', main]]);
  for (const part of rest) {
    const newline = part.indexOf('\n');
    parts.set(part.slice(0, newline), part.slice(newline));
  }
  return parts;
}

/** Every option name in the tables of a text: the first column, written as `name`. */
export function tableNames(text: string): Set<string> {
  const names = [...text.matchAll(/^\| `([a-z_]+)` \|/gm)].map((match) => match[1] ?? '');
  return new Set(names);
}

/** The YAML code blocks of a text, parsed. */
export function yamlExamples(text: string): Record<string, unknown>[] {
  return [...text.matchAll(/```yaml\n([\s\S]*?)```/g)].map((match) => parse(match[1] ?? '') as Record<string, unknown>);
}

/** The config paths among `paths` that the tables do not name: every segment of a path must be in a table. */
export function undocumented(paths: readonly string[], names: Set<string>): string[] {
  return paths.filter((path) => !path.split('.').every((segment) => names.has(segment)));
}

/** The cells of every row named `name` in a text (the same leaf name can be in several tables, like `color`). */
export function rowsCells(text: string, name: string): string[][] {
  return text
    .split('\n')
    .filter((line) => line.startsWith(`| \`${name}\` |`))
    .map((row) =>
      row
        .split('|')
        .slice(1, -1)
        .map((cell) => cell.trim()),
    );
}

/** The cells of an option's row in a table (Name, Type, Default, Advanced, Description), or [] without one. */
export function rowCells(text: string, name: string): string[] {
  return rowsCells(text, name)[0] ?? [];
}
