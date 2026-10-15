import { describe, expect, test } from 'vitest';
import {
  hasAdvancedValue,
  visibleSchema,
  withoutShownDefaults,
  withShownDefaults,
  type EditorSchema,
  type FormSchema,
} from '../../src/editor/schema';
import { BASIC_CONFIG, CHOICE_SCHEMA, SCHEMA } from './fixtures';

const names = (schema: FormSchema): unknown[] =>
  schema.map((item) => ('schema' in item ? { [item.name]: item.schema.map((field) => field.name) } : item.name));

describe('visibleSchema', () => {
  test('with the switch off, advanced fields are left out and a section with only advanced fields disappears', () => {
    expect(names(visibleSchema(SCHEMA, false))).toEqual([{ outdoor: ['temperature', 'humidity'] }, 'bypass_position']);
  });

  test('with the switch on, advanced fields appear in their own section', () => {
    expect(names(visibleSchema(SCHEMA, true))).toEqual([
      { outdoor: ['temperature', 'humidity', 'absolute_humidity'] },
      { calculation: ['smoothing', 'air_density'] },
      'bypass_position',
      'min_scale',
    ]);
  });

  test('the editor-only advanced mark is not passed to ha-form; required, selector and default are', () => {
    const [outdoor, calculation] = visibleSchema(SCHEMA, true);
    const fields = outdoor && 'schema' in outdoor ? outdoor.schema : [];
    expect(fields.every((field) => !('advanced' in field))).toBe(true);
    expect(fields[0]).toEqual({ name: 'temperature', required: true, selector: { entity: { domain: 'sensor' } } });
    expect(calculation && 'schema' in calculation ? calculation.schema[0]?.default : undefined).toBe(10);
  });

  test('sections keep their type, name and title', () => {
    const [outdoor] = visibleSchema(SCHEMA, false);
    expect(outdoor).toMatchObject({ type: 'expandable', name: 'outdoor', title: 'Outdoor air' });
  });
});

describe('hasAdvancedValue', () => {
  test('a config with only basic settings has none', () => {
    expect(hasAdvancedValue(SCHEMA, BASIC_CONFIG)).toBe(false);
  });

  test('a nested advanced value differing from its default counts', () => {
    expect(hasAdvancedValue(SCHEMA, { ...BASIC_CONFIG, calculation: { smoothing: 5 } })).toBe(true);
  });

  test('an advanced value equal to its default does not count', () => {
    expect(hasAdvancedValue(SCHEMA, { ...BASIC_CONFIG, calculation: { smoothing: 10, air_density: 1.2 } })).toBe(false);
    expect(hasAdvancedValue(SCHEMA, { ...BASIC_CONFIG, min_scale: 500 })).toBe(false);
  });

  test('a top-level advanced value counts', () => {
    expect(hasAdvancedValue(SCHEMA, { ...BASIC_CONFIG, min_scale: 750 })).toBe(true);
  });

  test('an advanced entity picker without a default counts once set, but not when empty', () => {
    const withAbsolute = { ...BASIC_CONFIG, outdoor: { absolute_humidity: 'sensor.outdoor_absolute_humidity' } };
    expect(hasAdvancedValue(SCHEMA, withAbsolute)).toBe(true);
    expect(hasAdvancedValue(SCHEMA, { ...BASIC_CONFIG, outdoor: { absolute_humidity: '' } })).toBe(false);
  });

  test('YAML spellings of the default do not count', () => {
    expect(hasAdvancedValue(SCHEMA, { ...BASIC_CONFIG, calculation: { smoothing: '10' } })).toBe(false);
    expect(hasAdvancedValue(SCHEMA, { ...BASIC_CONFIG, min_scale: '500' })).toBe(false);
    expect(hasAdvancedValue(SCHEMA, { ...BASIC_CONFIG, calculation: { air_density: '1.20' } })).toBe(false);
    expect(hasAdvancedValue(SCHEMA, { ...BASIC_CONFIG, calculation: { air_density: 1.0 } })).toBe(true);
  });

  test('basic values never count', () => {
    expect(hasAdvancedValue(SCHEMA, { ...BASIC_CONFIG, bypass_position: 'sensor.bypass' })).toBe(false);
  });
});

describe('shown defaults', () => {
  test('withShownDefaults fills in unset fields, also inside a section, and keeps the config it was given', () => {
    const config = { type: 'custom:x' };
    expect(withShownDefaults(CHOICE_SCHEMA, config)).toEqual({
      type: 'custom:x',
      exchanger_type: 'erv',
      calculation: { mode: 'auto' },
    });
    expect(config).toEqual({ type: 'custom:x' });
    expect(withShownDefaults(CHOICE_SCHEMA, { exchanger_type: 'hrv', calculation: { mode: 'fixed' } })).toEqual({
      exchanger_type: 'hrv',
      calculation: { mode: 'fixed' },
    });
  });

  test('withShownDefaults returns the config itself when no field has a default to add', () => {
    expect(withShownDefaults(visibleSchema(SCHEMA, false), BASIC_CONFIG)).toBe(BASIC_CONFIG);
  });

  test('withoutShownDefaults drops a default the config did not have, and an emptied section with it', () => {
    const current = { type: 'custom:x' };
    const shown = withShownDefaults(CHOICE_SCHEMA, current);
    expect(withoutShownDefaults(CHOICE_SCHEMA, current, { ...shown, other: 1 })).toEqual({
      type: 'custom:x',
      other: 1,
    });
  });

  test('withoutShownDefaults keeps a changed value, and a default the config already had', () => {
    expect(withoutShownDefaults(CHOICE_SCHEMA, { type: 'x' }, { type: 'x', exchanger_type: 'hrv' })).toEqual({
      type: 'x',
      exchanger_type: 'hrv',
    });
    const set = { exchanger_type: 'erv', calculation: { mode: 'auto' } };
    expect(withoutShownDefaults(CHOICE_SCHEMA, set, { ...set })).toEqual(set);
  });

  test('withoutShownDefaults keeps the other keys of a section that was in the config', () => {
    const current = { calculation: { other: 1 } };
    const changed = { calculation: { other: 2, mode: 'auto' } };
    expect(withoutShownDefaults(CHOICE_SCHEMA, current, changed)).toEqual({ calculation: { other: 2 } });
  });

  test('withoutShownDefaults keeps a section the config already had, even when it ends up empty', () => {
    const current = { type: 'x', calculation: {} };
    const shown = withShownDefaults(CHOICE_SCHEMA, current);
    expect(shown).toMatchObject({ calculation: { mode: 'auto' } });
    expect(withoutShownDefaults(CHOICE_SCHEMA, current, { ...shown, other: 1 })).toEqual({
      type: 'x',
      other: 1,
      calculation: {},
    });
  });

  test('withoutShownDefaults removes only the levels the defaults created in a nested path', () => {
    const nested: EditorSchema = [{ type: 'expandable', name: 'a', schema: [{ name: 'b', default: 1, selector: {} }] }];
    expect(withoutShownDefaults(nested, { a: {} }, { a: { b: 1 } })).toEqual({ a: {} });
    expect(withoutShownDefaults(nested, {}, { a: { b: 1 } })).toEqual({});
  });
});
