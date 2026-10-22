import { describe, expect, test } from 'vitest';
import { checkDiagramConfig } from '../../src/cards/ventilation-card';
import { hasBadge } from '../../src/diagram/badge';
import { DIAGRAM_OPTION_LIST } from '../../src/diagram/options';
import { DIAGRAM_SCHEMA } from '../../src/editor/diagram-schema';
import { fieldsWithPaths } from '../../src/editor/schema';
import { valueAt } from '../../src/lib/config';
import { ROLE_LABELS } from '../../src/strings';
import { cardSection, rowCells, subsections, tableNames, yamlExamples } from '../readme';

const CARD = 'Airflow diagram card';
// TODO(task 1.10): the README does not document the ventilation mode and the stopped states yet.
const UNDOCUMENTED = new Set<string>(['fans.ventilation_mode', 'fans.stopped_states']);
const documented = (path: string): boolean => !UNDOCUMENTED.has(path);

describe('README: airflow diagram card', () => {
  // The table each config group is documented in: the stream, fans and bypass objects are shared with the bar cards
  // and live in the recovery balance card's section; the others in the diagram card's.
  const diagram = subsections(cardSection('Options', CARD));
  const shared = subsections(cardSection('Options', 'Recovery balance card'));
  const TABLES: Readonly<Record<string, string | undefined>> = {
    outdoor: shared.get('Stream object'),
    supply: shared.get('Stream object'),
    extract: shared.get('Stream object'),
    exhaust: shared.get('Stream object'),
    fans: shared.get('Fans object'),
    bypass: shared.get('Bypass object'),
    status: diagram.get('Status object'),
    pre_heater: diagram.get('Pre-heater object'),
    seasons: diagram.get('Seasons object'),
    colors: diagram.get('Colours object'),
    animation: diagram.get('Animation object'),
  };
  /** The table a config path is documented in, and the row name. */
  const tableOf = (path: string): { table: string; name: string } => {
    const [group = '', name] = path.split('.');
    return name === undefined ? { table: diagram.get('') ?? '', name: group } : { table: TABLES[group] ?? '', name };
  };

  test('every config key the card reads is a row of its own table, and each group a row of the main table', () => {
    const read = [...Object.keys(ROLE_LABELS), ...DIAGRAM_OPTION_LIST.map((option) => option.path)].filter(documented);
    const missing = read.filter((path) => {
      const { table, name } = tableOf(path);
      return !tableNames(table).has(name);
    });
    expect(missing).toEqual([]);
    const groups = new Set(read.filter((path) => path.includes('.')).map((path) => path.split('.')[0] ?? ''));
    for (const group of groups) expect(tableNames(diagram.get('') ?? '').has(group), group).toBe(true);
  });

  test('the Advanced column matches the editor (the stream pickers excepted, see the note on absolute humidity)', () => {
    for (const { field, path } of fieldsWithPaths(DIAGRAM_SCHEMA)) {
      if (/^(outdoor|supply|extract|exhaust)\./.test(path)) continue;
      const { table, name } = tableOf(path);
      const [, , , advanced] = rowCells(table, name);
      expect(advanced, path).toBe(field.advanced === true ? 'yes' : '');
    }
  });

  test('every option row states the default (and for numbers the range) of the code', () => {
    const text = cardSection('Options', CARD);
    for (const option of DIAGRAM_OPTION_LIST.filter((option) => documented(option.path))) {
      const [, , defaultCell, , description] = rowCells(text, option.path.split('.').at(-1) ?? '');
      // An option without a default (the nominal flow) has an empty Default cell.
      expect(defaultCell, option.path).toBe(option.default === undefined ? '' : `\`${String(option.default)}\``);
      if (option.kind === 'number') {
        expect(description, option.path).toContain(`(${String(option.min)} to ${String(option.max)}`);
      }
      if (option.kind === 'choice') {
        for (const choice of option.choices) expect(description, option.path).toContain(`\`${choice}\``);
      }
    }
  });

  test('the full example sets every role and every option', () => {
    const [, full] = yamlExamples(cardSection('Examples', CARD));
    const json = JSON.stringify(full);
    for (const path of [...Object.keys(ROLE_LABELS), ...DIAGRAM_OPTION_LIST.map((option) => option.path)].filter(
      documented,
    )) {
      expect(valueAt(full ?? {}, path), path).toBeDefined();
    }
    expect(json).toContain('"type":"custom:hrv-ventilation-card"');
    expect(hasBadge(full ?? {})).toBe(true);
  });

  test("the minimal and the full example pass the card's config check", () => {
    const examples = yamlExamples(cardSection('Examples', CARD));
    expect(examples).toHaveLength(2);
    for (const example of examples) {
      expect(example['type']).toBe('custom:hrv-ventilation-card');
      expect(() => {
        checkDiagramConfig(example);
      }).not.toThrow();
    }
  });

  test('the examples use placeholder entity IDs only', () => {
    const json = JSON.stringify(yamlExamples(cardSection('Examples', CARD)));
    const ids = json.match(/(binary_)?sensor\.[a-z0-9_]+/g) ?? [];
    expect(ids.length).toBeGreaterThan(30);
    expect(ids.every((id) => /^(binary_)?sensor\.hrv_/.test(id))).toBe(true);
  });
});
