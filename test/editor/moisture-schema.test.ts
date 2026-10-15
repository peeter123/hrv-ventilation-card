import { describe, expect, test } from 'vitest';
import { HrvMoistureBalanceCard } from '../../src/cards/moisture-balance-card';
import { MOISTURE_OPTION_LIST, MOISTURE_REQUIREMENTS } from '../../src/cards/moisture-view';
import { MOISTURE_SCHEMA } from '../../src/editor/moisture-schema';
import {
  fieldsWithPaths,
  hasAdvancedValue,
  visibleSchema,
  type FormSchema,
  type FormSection,
} from '../../src/editor/schema';

const sections = (schema: FormSchema): Map<string, string[]> =>
  new Map(
    schema.filter((item): item is FormSection => 'schema' in item).map((s) => [s.name, s.schema.map((f) => f.name)]),
  );

describe('MOISTURE_SCHEMA', () => {
  test("the schema's field paths are exactly the config keys the card reads", () => {
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
    const paths = fieldsWithPaths(MOISTURE_SCHEMA).map(({ path }) => path);
    expect(new Set(paths)).toEqual(new Set(read));
    expect(paths).toHaveLength(new Set(paths).size);
  });

  test('moisture-balance-card "Editing the card": stream pickers, supply flow required, sensors only', () => {
    const shown = visibleSchema(MOISTURE_SCHEMA, false);
    const named = sections(shown);
    for (const stream of ['outdoor', 'supply', 'extract'])
      expect(named.get(stream)).toEqual(['temperature', 'humidity']);
    const fields = fieldsWithPaths(MOISTURE_SCHEMA);
    const required = fields.filter(({ field }) => field.required === true).map(({ path }) => path);
    expect(required).toEqual(['fans.supply_flow']);
    const pickers = fields.filter(({ field }) => 'entity' in field.selector);
    for (const { field } of pickers) expect(field.selector).toEqual({ entity: { domain: 'sensor' } });
    // Every field that is not a picker is advanced.
    expect(shown.some((item) => !('schema' in item))).toBe(false);
    expect(named.has('calculation')).toBe(false);
    expect(named.has('colors')).toBe(false);
  });

  test('moisture-balance-card "Advanced settings on": absolute humidity, smoothing, density, threshold, scale, colours', () => {
    const shown = visibleSchema(MOISTURE_SCHEMA, true);
    const named = sections(shown);
    for (const stream of ['outdoor', 'supply', 'extract']) expect(named.get(stream)).toContain('absolute_humidity');
    expect(named.get('calculation')).toEqual(['smoothing', 'air_density']);
    expect(named.get('colors')).toEqual(['drying_color', 'gaining_color']);
    const topLevel = shown.filter((item) => !('schema' in item)).map((item) => item.name);
    expect(topLevel).toEqual(['neutral_threshold', 'min_scale']);
  });

  test('options at their defaults do not turn the advanced switch on', () => {
    const defaults = Object.fromEntries(MOISTURE_OPTION_LIST.map((o) => [o.path, o.default]));
    expect(hasAdvancedValue(MOISTURE_SCHEMA, defaults)).toBe(false);
    expect(hasAdvancedValue(MOISTURE_SCHEMA, { neutral_threshold: 0.5 })).toBe(true);
  });
});

describe('HrvMoistureBalanceCard editor and sizing', () => {
  test("getConfigElement returns the shared editor with this card's schema", () => {
    const editor = HrvMoistureBalanceCard.getConfigElement() as HTMLElement & { schema: unknown };
    expect(editor.tagName.toLowerCase()).toBe('hrv-card-editor');
    expect(editor.schema).toBe(MOISTURE_SCHEMA);
  });

  test('the stub config is empty; grid options give full width, no rows, at least 6 columns', () => {
    expect(HrvMoistureBalanceCard.getStubConfig()).toEqual({});
    const card = new HrvMoistureBalanceCard();
    expect(card.getGridOptions()).toEqual({ columns: 12, min_columns: 6 });
    expect(card.getCardSize()).toBe(5);
  });
});
