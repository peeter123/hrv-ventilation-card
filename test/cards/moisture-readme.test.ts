import { describe, expect, test } from 'vitest';
import { checkMoistureConfig } from '../../src/cards/moisture-balance-card';
import { MOISTURE_OPTION_LIST, MOISTURE_REQUIREMENTS } from '../../src/cards/moisture-view';
import { cardSection, rowCells, tableNames, undocumented, yamlExamples } from '../readme';

const CARD = 'Moisture balance card';

describe('README: moisture balance card', () => {
  test('every config key the card reads appears in an options table', () => {
    const read = [
      ...MOISTURE_REQUIREMENTS.paths,
      ...['outdoor', 'supply', 'extract'].flatMap((s) => [
        `${s}.temperature`,
        `${s}.humidity`,
        `${s}.absolute_humidity`,
      ]),
      'bypass.position',
      ...MOISTURE_OPTION_LIST.map((option) => option.path),
    ];
    // The stream, fans and bypass objects are documented once, in the recovery balance card's section.
    const names = new Set([
      ...tableNames(cardSection('Options', CARD)),
      ...tableNames(cardSection('Options', 'Recovery balance card')),
    ]);
    expect(undocumented(read, names)).toEqual([]);
  });

  test('every option row states the default (and for numbers the range) of the code', () => {
    const text = cardSection('Options', CARD);
    for (const option of MOISTURE_OPTION_LIST) {
      const [, , defaultCell, , description] = rowCells(text, option.path.split('.').at(-1) ?? '');
      expect(defaultCell, option.path).toBe(`\`${String(option.default)}\``);
      if (option.kind === 'number') {
        expect(description, option.path).toContain(`(${String(option.min)} to ${String(option.max)}`);
      }
    }
  });

  test('the full example sets every option', () => {
    const [, full] = yamlExamples(cardSection('Examples', CARD));
    const json = JSON.stringify(full);
    for (const option of MOISTURE_OPTION_LIST) {
      const key = option.path.split('.').at(-1) ?? '';
      expect(json, option.path).toContain(`"${key}":`);
    }
  });

  test("the minimal and the full example pass the card's config check", () => {
    const examples = yamlExamples(cardSection('Examples', CARD));
    expect(examples).toHaveLength(2);
    for (const example of examples) {
      expect(example['type']).toBe('custom:hrv-moisture-balance-card');
      expect(() => {
        checkMoistureConfig(example);
      }).not.toThrow();
    }
  });

  test('the examples use placeholder entity IDs only', () => {
    const ids = JSON.stringify(yamlExamples(cardSection('Examples', CARD))).match(/sensor\.[a-z0-9_]+/g) ?? [];
    expect(ids.length).toBeGreaterThan(0);
    expect(ids.every((id) => id.startsWith('sensor.hrv_'))).toBe(true);
  });
});
