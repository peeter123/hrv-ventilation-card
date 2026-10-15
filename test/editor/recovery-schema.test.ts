import { describe, expect, test } from 'vitest';
import { HrvRecoveryBalanceCard } from '../../src/cards/recovery-balance-card';
import { RECOVERY_OPTION_LIST, RECOVERY_REQUIREMENTS } from '../../src/cards/recovery-view';
import { RECOVERY_SCHEMA } from '../../src/editor/recovery-schema';
import {
  fieldsWithPaths,
  hasAdvancedValue,
  visibleSchema,
  type FormField,
  type FormSchema,
  type FormSection,
} from '../../src/editor/schema';

const sections = (schema: FormSchema): Map<string, string[]> =>
  new Map(
    schema.filter((item): item is FormSection => 'schema' in item).map((s) => [s.name, s.schema.map((f) => f.name)]),
  );

describe('RECOVERY_SCHEMA', () => {
  test("the schema's field paths are exactly the config keys the card reads", () => {
    const read = [
      ...RECOVERY_REQUIREMENTS.paths,
      ...['outdoor', 'supply', 'extract'].flatMap((s) => [`${s}.humidity`, `${s}.absolute_humidity`]),
      'bypass.position',
      ...RECOVERY_OPTION_LIST.map((option) => option.path),
    ];
    const paths = fieldsWithPaths(RECOVERY_SCHEMA).map(({ path }) => path);
    expect(new Set(paths)).toEqual(new Set(read));
    expect(paths).toHaveLength(new Set(paths).size);
  });

  test('recovery-balance-card "Editing the card": each stream section has a temperature and a relative humidity picker', () => {
    const shown = sections(visibleSchema(RECOVERY_SCHEMA, false));
    expect(shown.get('outdoor')).toEqual(['temperature', 'humidity']);
    expect(shown.get('supply')).toEqual(['temperature', 'humidity']);
    expect(shown.get('extract')).toEqual(['temperature', 'humidity']);
    expect(shown.get('fans')).toEqual(['supply_flow']);
    expect(shown.get('bypass')).toEqual(['position']);
    expect(shown.has('calculation')).toBe(false);
  });

  test('recovery-balance-card "Advanced settings on": absolute humidity, smoothing, air density, scale and colours', () => {
    const shown = visibleSchema(RECOVERY_SCHEMA, true);
    const named = sections(shown);
    expect(named.get('outdoor')).toContain('absolute_humidity');
    expect(named.get('supply')).toContain('absolute_humidity');
    expect(named.get('extract')).toContain('absolute_humidity');
    expect(named.get('calculation')).toEqual(['smoothing', 'air_density']);
    expect(named.get('heating')).toEqual(['color', 'color_latent']);
    expect(named.get('cooling')).toEqual(['color', 'color_latent']);
    expect(shown.some((item) => item.name === 'min_scale')).toBe(true);
  });

  test('the calculation section keeps smoothing and air density top-level (flatten)', () => {
    const calculation = RECOVERY_SCHEMA.find((item) => item.name === 'calculation');
    expect(calculation).toMatchObject({ flatten: true });
  });

  test('pickers only offer sensors; the temperatures and the supply flow are required', () => {
    const fields = fieldsWithPaths(RECOVERY_SCHEMA);
    const pickers = fields.filter(({ field }) => 'entity' in field.selector);
    expect(
      pickers.every(({ field }) => (field.selector as { entity: { domain: string } }).entity.domain === 'sensor'),
    ).toBe(true);
    const required = fields
      .filter(({ field }: { field: FormField }) => field.required === true)
      .map(({ path }) => path);
    expect(required).toEqual(['outdoor.temperature', 'supply.temperature', 'extract.temperature', 'fans.supply_flow']);
  });

  test('options at their defaults do not turn the advanced switch on', () => {
    const defaults = Object.fromEntries(
      RECOVERY_OPTION_LIST.filter((o) => !o.path.includes('.')).map((o) => [o.path, o.default]),
    );
    expect(hasAdvancedValue(RECOVERY_SCHEMA, { ...defaults, heating: { color: '#db4437' } })).toBe(false);
    expect(hasAdvancedValue(RECOVERY_SCHEMA, { smoothing: 5 })).toBe(true);
  });
});

describe('HrvRecoveryBalanceCard editor and sizing', () => {
  test("getConfigElement returns the shared editor with this card's schema", () => {
    const editor = HrvRecoveryBalanceCard.getConfigElement() as HTMLElement & { schema: unknown };
    expect(editor.tagName.toLowerCase()).toBe('hrv-card-editor');
    expect(editor.schema).toBe(RECOVERY_SCHEMA);
  });

  test('the stub config is empty; grid options give full width, no rows, at least 6 columns', () => {
    expect(HrvRecoveryBalanceCard.getStubConfig()).toEqual({});
    const card = new HrvRecoveryBalanceCard();
    expect(card.getGridOptions()).toEqual({ columns: 12, min_columns: 6 });
    expect(card.getCardSize()).toBe(4);
  });
});
