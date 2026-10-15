import { describe, expect, test } from 'vitest';
import { HrvVentilationCard } from '../../src/cards/ventilation-card';
import { DIAGRAM_OPTION_LIST } from '../../src/diagram/options';
import { DIAGRAM_SCHEMA } from '../../src/editor/diagram-schema';
import {
  fieldsWithPaths,
  hasAdvancedValue,
  visibleSchema,
  type FormSchema,
  type FormSection,
} from '../../src/editor/schema';
import type { RolePath } from '../../src/lib/config';
import { ROLE_LABELS } from '../../src/strings';

const sections = (schema: FormSchema): Map<string, string[]> =>
  new Map(
    schema.filter((item): item is FormSection => 'schema' in item).map((s) => [s.name, s.schema.map((f) => f.name)]),
  );

describe('DIAGRAM_SCHEMA', () => {
  test("the schema's field paths are exactly the config keys the card reads", () => {
    // The diagram reads every role (ROLE_LABELS lists them all) and every option of its table.
    const read = [...(Object.keys(ROLE_LABELS) as RolePath[]), ...DIAGRAM_OPTION_LIST.map((option) => option.path)];
    const paths = fieldsWithPaths(DIAGRAM_SCHEMA).map(({ path }) => path);
    expect(new Set(paths)).toEqual(new Set(read));
    expect(paths).toHaveLength(new Set(paths).size);
  });

  test('airflow-diagram-card "Editing the card": the exchanger type, roles per group, then the animation switch', () => {
    const shown = visibleSchema(DIAGRAM_SCHEMA, false);
    expect(shown.map((item) => item.name)).toEqual([
      'exchanger_type',
      'outdoor',
      'supply',
      'extract',
      'exhaust',
      'fans',
      'bypass',
      'status',
      'seasons',
      'animation',
    ]);
    const named = sections(shown);
    for (const stream of ['outdoor', 'supply', 'extract', 'exhaust'])
      expect(named.get(stream)).toEqual(['temperature', 'humidity', 'absolute_humidity']);
    expect(named.get('fans')).toEqual(['level', 'supply_flow', 'exhaust_flow']);
    expect(named.get('bypass')).toEqual(['position', 'mode']);
    expect(named.get('status')).toEqual(['operating_mode', 'filter_days', 'power', 'rmot']);
    expect(named.get('seasons')).toEqual(['heating', 'cooling']);
    expect(named.get('animation')).toEqual(['enabled']);
  });

  test('the four temperatures are required; season pickers offer binary sensors, the others sensors', () => {
    const fields = fieldsWithPaths(DIAGRAM_SCHEMA);
    const required = fields.filter(({ field }) => field.required === true).map(({ path }) => path);
    expect(required).toEqual([
      'outdoor.temperature',
      'supply.temperature',
      'extract.temperature',
      'exhaust.temperature',
    ]);
    for (const { field, path } of fields.filter(({ field }) => 'entity' in field.selector)) {
      const domain = path.startsWith('seasons.') ? 'binary_sensor' : 'sensor';
      expect(field.selector, path).toEqual({ entity: { domain } });
    }
  });

  test('airflow-diagram-card "Advanced settings on": niche pickers, colours, layout, unavailable values, nominal flow and the calculation', () => {
    const named = sections(visibleSchema(DIAGRAM_SCHEMA, true));
    expect(named.get('status')).toEqual([
      'operating_mode',
      'target_temperature',
      'temperature_profile',
      'next_fan_change',
      'filter_days',
      'power',
      'rmot',
      'saving',
      'moisture_recovery',
    ]);
    expect(named.get('bypass')).toEqual(['position', 'mode', 'next_change']);
    expect(named.get('animation')).toEqual(['enabled', 'nominal_flow']);
    expect(named.get('calculation')).toEqual(['smoothing', 'air_density']);
    expect(named.get('colors')).toEqual(['cold', 'warm']);
    const topLevel = visibleSchema(DIAGRAM_SCHEMA, true).filter((item) => !('schema' in item));
    expect(topLevel.map((item) => item.name)).toEqual(['exchanger_type', 'layout', 'show_unavailable']);
  });

  test('the exchanger type is a basic choice of HRV and ERV, HRV by default', () => {
    const field = DIAGRAM_SCHEMA.find((item) => item.name === 'exchanger_type');
    expect(field).toEqual({
      name: 'exchanger_type',
      default: 'hrv',
      selector: {
        select: {
          mode: 'dropdown',
          options: [
            { value: 'hrv', label: 'Heat recovery (HRV)' },
            { value: 'erv', label: 'Energy recovery (ERV)' },
          ],
        },
      },
    });
  });

  test('the layout is a choice of automatic, full and compact', () => {
    const layout = DIAGRAM_SCHEMA.find((item) => item.name === 'layout');
    expect(layout && 'selector' in layout ? layout.selector : undefined).toEqual({
      select: {
        mode: 'dropdown',
        options: [
          { value: 'auto', label: 'Automatic' },
          { value: 'full', label: 'Full' },
          { value: 'compact', label: 'Compact' },
        ],
      },
    });
  });

  test('options at their defaults do not turn the advanced switch on', () => {
    const defaults = {
      smoothing: 10,
      air_density: 1.2,
      colors: { cold: '#039be5', warm: '#db4437' },
      animation: { enabled: true },
      layout: 'auto',
      show_unavailable: false,
    };
    expect(hasAdvancedValue(DIAGRAM_SCHEMA, defaults)).toBe(false);
    expect(hasAdvancedValue(DIAGRAM_SCHEMA, { ...defaults, animation: { enabled: false } })).toBe(false);
    expect(hasAdvancedValue(DIAGRAM_SCHEMA, { layout: 'compact' })).toBe(true);
    expect(hasAdvancedValue(DIAGRAM_SCHEMA, { animation: { nominal_flow: 400 } })).toBe(true);
    expect(hasAdvancedValue(DIAGRAM_SCHEMA, { status: { next_fan_change: 'sensor.hrv_next' } })).toBe(true);
    expect(hasAdvancedValue(DIAGRAM_SCHEMA, { status: { saving: 'sensor.hrv_saving' } })).toBe(true);
    expect(hasAdvancedValue(DIAGRAM_SCHEMA, { exchanger_type: 'erv' })).toBe(false);
  });
});

describe('HrvVentilationCard editor and sizing', () => {
  test("getConfigElement returns the shared editor with this card's schema", () => {
    const editor = HrvVentilationCard.getConfigElement() as HTMLElement & { schema: unknown };
    expect(editor.tagName.toLowerCase()).toBe('hrv-card-editor');
    expect(editor.schema).toBe(DIAGRAM_SCHEMA);
  });

  test('the stub config is empty; grid options give full width, no rows, at least 9 columns', () => {
    expect(HrvVentilationCard.getStubConfig()).toEqual({});
    const card = new HrvVentilationCard();
    expect(card.getGridOptions()).toEqual({ columns: 12, min_columns: 9 });
    expect(card.getCardSize()).toBe(6);
  });
});
