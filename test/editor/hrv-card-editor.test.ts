import { afterEach, beforeAll, describe, expect, test } from 'vitest';
import type { CardConfig } from '../../src/lib/config';
import { fieldsWithPaths, type EditorSchema, type FormSchema } from '../../src/editor/schema';
import type { HrvCardEditor } from '../../src/editor/hrv-card-editor';
import { EDITOR } from '../../src/strings';
import { BASIC_CONFIG, CHOICE_SCHEMA, SCHEMA } from './fixtures';

/** Stands in for Home Assistant's ha-form: keeps what the editor passes and can emit value-changed. */
class StubForm extends HTMLElement {
  schema: FormSchema = [];
  data: Record<string, unknown> = {};
  computeLabel?: (item: { name: string; type?: string; title?: string; schema?: unknown[] }) => string;

  change(value: Record<string, unknown>): void {
    this.dispatchEvent(new CustomEvent('value-changed', { detail: { value }, bubbles: true, composed: true }));
  }
}

beforeAll(async () => {
  customElements.define('ha-form', StubForm);
  await import('../../src/editor/hrv-card-editor');
});

afterEach(() => {
  document.body.innerHTML = '';
});

async function openEditor(
  config: CardConfig,
  schema: EditorSchema = SCHEMA,
): Promise<{ editor: HrvCardEditor; toggle: StubForm; form: StubForm }> {
  const editor = document.createElement('hrv-card-editor');
  editor.schema = schema;
  editor.setConfig(config);
  document.body.append(editor);
  await editor.updateComplete;
  const [toggle, form] = [...(editor.shadowRoot?.querySelectorAll<StubForm>('ha-form') ?? [])];
  if (!toggle || !form) throw new Error('editor did not render two forms');
  return { editor, toggle, form };
}

const fieldNames = (schema: FormSchema): string[] => fieldsWithPaths(schema).map(({ path }) => path);

describe('hrv-card-editor', () => {
  test('card-bundle "Default editor": the switch is off and no advanced setting is shown', async () => {
    const { toggle, form } = await openEditor(BASIC_CONFIG);
    expect(toggle.data).toEqual({ advanced: false });
    expect(toggle.computeLabel?.({ name: 'advanced' })).toBe(EDITOR.advanced);
    expect(fieldNames(form.schema)).toEqual(['outdoor.temperature', 'outdoor.humidity', 'bypass_position']);
    expect(form.data).toBe(BASIC_CONFIG);
  });

  test('card-bundle "Advanced value already set": smoothing 5 starts the switch on and shows 5', async () => {
    const config = { ...BASIC_CONFIG, calculation: { smoothing: 5 } };
    const { toggle, form } = await openEditor(config);
    expect(toggle.data).toEqual({ advanced: true });
    expect(fieldNames(form.schema)).toContain('calculation.smoothing');
    // The form shows 5 and the defaults of the advanced fields that are unset.
    expect(form.data).toEqual({ ...config, calculation: { smoothing: 5, air_density: 1.2 }, min_scale: 500 });
  });

  test('a nested advanced field is hidden while the switch is off and shown inside its section when on', async () => {
    const { editor, toggle, form } = await openEditor(BASIC_CONFIG);
    expect(fieldNames(form.schema)).not.toContain('outdoor.absolute_humidity');
    toggle.change({ advanced: true });
    await editor.updateComplete;
    const outdoor = form.schema.find((item) => item.name === 'outdoor');
    expect(outdoor && 'schema' in outdoor ? outdoor.schema.map((field) => field.name) : []).toEqual([
      'temperature',
      'humidity',
      'absolute_humidity',
    ]);
    toggle.change({ advanced: false });
    await editor.updateComplete;
    expect(fieldNames(form.schema)).not.toContain('outdoor.absolute_humidity');
  });

  test('card-bundle "Switch not saved": turning the switch on and saving leaves no switch key', async () => {
    const { editor, toggle, form } = await openEditor(BASIC_CONFIG);
    const saved: CardConfig[] = [];
    editor.addEventListener('config-changed', (event) => {
      saved.push((event as CustomEvent<{ config: CardConfig }>).detail.config);
    });

    toggle.change({ advanced: true });
    await editor.updateComplete;
    expect(saved).toEqual([]);

    const edited = { ...BASIC_CONFIG, calculation: { smoothing: 5 } };
    form.change(edited);
    expect(saved).toEqual([edited]);
    expect(saved[0]).not.toHaveProperty('advanced');
  });

  test('value-changed from the forms does not escape the editor', async () => {
    const { toggle, form } = await openEditor(BASIC_CONFIG);
    const escaped: Event[] = [];
    document.body.addEventListener('value-changed', (event) => escaped.push(event));
    toggle.change({ advanced: true });
    form.change(BASIC_CONFIG);
    expect(escaped).toEqual([]);
  });

  test('the form keeps the same schema object across re-renders, so open sections stay open', async () => {
    const { editor, form } = await openEditor(BASIC_CONFIG);
    const schema = form.schema;
    editor.hass = { states: {} };
    await editor.updateComplete;
    editor.setConfig({ ...BASIC_CONFIG, bypass_position: 'sensor.bypass' });
    await editor.updateComplete;
    expect(form.schema).toBe(schema);
  });

  test('an advanced value arriving later (from the code editor) turns the switch on; it never turns itself off', async () => {
    const { editor, toggle } = await openEditor(BASIC_CONFIG);
    editor.setConfig({ ...BASIC_CONFIG, min_scale: 750 });
    await editor.updateComplete;
    expect(toggle.data).toEqual({ advanced: true });
    editor.setConfig(BASIC_CONFIG);
    await editor.updateComplete;
    expect(toggle.data).toEqual({ advanced: true });
  });

  test('labels come from the section title or the editor strings', async () => {
    const { form } = await openEditor(BASIC_CONFIG);
    expect(form.computeLabel?.({ type: 'expandable', name: 'outdoor', title: 'Outdoor air', schema: [] })).toBe(
      'Outdoor air',
    );
    expect(form.computeLabel?.({ type: 'expandable', name: 'calculation', schema: [] })).toBe(
      EDITOR.sections.calculation,
    );
    expect(form.computeLabel?.({ name: 'humidity' })).toBe(EDITOR.fields.humidity);
    expect(form.computeLabel?.({ name: 'unknown_field' })).toBe('unknown_field');
    // A field and a section with the same name get their own labels.
    expect(form.computeLabel?.({ name: 'heating' })).toBe(EDITOR.fields.heating);
    expect(form.computeLabel?.({ type: 'expandable', name: 'heating', schema: [] })).toBe(EDITOR.sections.heating);
  });

  test('the switch cannot be turned off while an advanced value is set, so it is never hidden', async () => {
    const { editor, toggle, form } = await openEditor({ ...BASIC_CONFIG, calculation: { smoothing: 5 } });
    const before = toggle.data;
    toggle.change({ advanced: false });
    await editor.updateComplete;
    expect(toggle.data).toEqual({ advanced: true });
    // A new object, so the real ha-form draws the switch on again instead of keeping the clicked "off".
    expect(toggle.data).not.toBe(before);
    expect(fieldNames(form.schema)).toContain('calculation.smoothing');

    // Once the value is back to its default, the switch can be turned off.
    form.change({ ...BASIC_CONFIG, calculation: { smoothing: 10 } });
    toggle.change({ advanced: false });
    await editor.updateComplete;
    expect(toggle.data).toEqual({ advanced: false });
  });

  test('the switch form gets the same data and label across hass updates', async () => {
    const { editor, toggle } = await openEditor(BASIC_CONFIG);
    const { data, computeLabel } = toggle;
    editor.hass = { states: {} };
    await editor.updateComplete;
    editor.hass = { states: {} };
    await editor.updateComplete;
    expect(toggle.data).toBe(data);
    expect(toggle.computeLabel).toBe(computeLabel);
  });

  test('a field the config leaves unset shows its default, which is not saved when another field changes', async () => {
    const { editor, toggle, form } = await openEditor({ type: 'custom:x', other: 1 }, CHOICE_SCHEMA);
    expect(form.data).toEqual({ type: 'custom:x', other: 1, exchanger_type: 'erv' });
    const saved: CardConfig[] = [];
    editor.addEventListener('config-changed', (event) => {
      saved.push((event as CustomEvent<{ config: CardConfig }>).detail.config);
    });

    form.change({ ...form.data, other: 2 });
    expect(saved).toEqual([{ type: 'custom:x', other: 2 }]);
    await editor.updateComplete;

    // Another default value is a choice of the user and is kept.
    form.change({ ...form.data, exchanger_type: 'hrv' });
    expect(saved[1]).toEqual({ type: 'custom:x', other: 2, exchanger_type: 'hrv' });
    await editor.updateComplete;
    expect(form.data).toEqual({ type: 'custom:x', other: 2, exchanger_type: 'hrv' });

    // A default shown inside a section appears when the switch shows the field, and is dropped again unsaved.
    toggle.change({ advanced: true });
    await editor.updateComplete;
    expect(form.data).toMatchObject({ calculation: { mode: 'auto' } });
    form.change({ ...form.data, other: 3 });
    expect(saved[2]).toEqual({ type: 'custom:x', other: 3, exchanger_type: 'hrv' });
  });

  test('a default the config already sets stays in the saved config', async () => {
    const config = { type: 'custom:x', exchanger_type: 'erv', calculation: { mode: 'auto' } };
    const { editor, form } = await openEditor(config, CHOICE_SCHEMA);
    const saved: CardConfig[] = [];
    editor.addEventListener('config-changed', (event) => {
      saved.push((event as CustomEvent<{ config: CardConfig }>).detail.config);
    });
    form.change({ ...config, other: 1 });
    expect(saved).toEqual([{ ...config, other: 1 }]);
  });
});
