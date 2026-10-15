import { describe, expect, test } from 'vitest';
import { checkRecoveryConfig } from '../../src/cards/recovery-balance-card';
import { RECOVERY_OPTION_LIST, RECOVERY_REQUIREMENTS } from '../../src/cards/recovery-view';
import { cardSection, rowCells, tableNames, undocumented, yamlExamples } from '../readme';

const CARD = 'Recovery balance card';

describe('README: recovery balance card', () => {
  test('every config key the card reads appears in an options table', () => {
    const read = [
      ...RECOVERY_REQUIREMENTS.paths,
      ...['outdoor', 'supply', 'extract'].flatMap((stream) => [`${stream}.humidity`, `${stream}.absolute_humidity`]),
      'bypass.position',
      ...RECOVERY_OPTION_LIST.map((option) => option.path),
    ];
    expect(undocumented(read, tableNames(cardSection('Options', CARD)))).toEqual([]);
  });

  test('every option row states the default (and for numbers the range) of the code', () => {
    const text = cardSection('Options', CARD);
    for (const option of RECOVERY_OPTION_LIST) {
      const [, , defaultCell, , description] = rowCells(text, option.path.split('.').at(-1) ?? '');
      expect(defaultCell, option.path).toContain(`\`${String(option.default)}\``);
      if (option.kind === 'number') {
        expect(description, option.path).toContain(`(${String(option.min)} to ${String(option.max)}`);
      }
    }
  });

  test('the full example sets every option', () => {
    const [, full] = yamlExamples(cardSection('Examples', CARD));
    const json = JSON.stringify(full);
    for (const option of RECOVERY_OPTION_LIST) {
      const key = option.path.split('.').at(-1) ?? '';
      expect(json, option.path).toContain(`"${key}":`);
    }
  });

  test("the minimal and the full example pass the card's config check", () => {
    const examples = yamlExamples(cardSection('Examples', CARD));
    expect(examples).toHaveLength(2);
    for (const example of examples) {
      expect(example['type']).toBe('custom:hrv-recovery-balance-card');
      expect(() => {
        checkRecoveryConfig(example);
      }).not.toThrow();
    }
  });

  test('the examples use placeholder entity IDs only', () => {
    const ids = JSON.stringify(yamlExamples(cardSection('Examples', CARD))).match(/sensor\.[a-z0-9_]+/g) ?? [];
    expect(ids.length).toBeGreaterThan(0);
    expect(ids.every((id) => id.startsWith('sensor.hrv_'))).toBe(true);
  });
});
