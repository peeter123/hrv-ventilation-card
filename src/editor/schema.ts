// The editor schema of a card: Home Assistant `ha-form` fields and expandable sections, each field marked basic
// or advanced. The pure functions here decide what the form shows; the editor element only renders their result.
import { parseNumericState } from '../lib/availability';
import type { CardConfig } from '../lib/config';
import { valueAt } from '../lib/config';

/** One form field. `selector` is a Home Assistant selector, e.g. `{ entity: { domain: 'sensor' } }`. */
export interface EditorField {
  name: string;
  selector: Readonly<Record<string, unknown>>;
  required?: boolean;
  /** Hidden while the "Advanced settings" switch is off. */
  advanced?: boolean;
  /**
   * The value the card uses when the field is not set. An advanced field set to anything else turns the switch
   * on, so every advanced field that is not an entity picker should declare it.
   */
  default?: unknown;
}

/**
 * An expandable section; `ha-form` nests its fields' values under `name` in the config, or keeps them at the top
 * level with `flatten` (a section that only groups fields in the editor). Without a `title` the editor looks the
 * name up in the editor strings.
 */
export interface EditorSection {
  type: 'expandable';
  name: string;
  title?: string;
  flatten?: boolean;
  schema: readonly EditorField[];
}

export type EditorSchema = readonly (EditorField | EditorSection)[];

/** What `ha-form` receives: the same shapes without the editor's own `advanced` mark. */
export type FormField = Omit<EditorField, 'advanced'>;

export interface FormSection extends Omit<EditorSection, 'schema'> {
  schema: readonly FormField[];
}

export type FormSchema = readonly (FormField | FormSection)[];

/** True for a section, in an editor schema or in the form schema derived from it. */
export function isSection<T extends EditorField | FormField>(
  item: T | EditorSection | FormSection,
): item is Exclude<typeof item, T> {
  return 'type' in item;
}

function toFormField(field: EditorField): FormField {
  const { advanced, ...formField } = field;
  return formField;
}

/** Every field of the schema with the config path its value lives at ("outdoor.temperature", "min_scale"). */
export function fieldsWithPaths(schema: EditorSchema): { field: EditorField; path: string }[] {
  return schema.flatMap((item) =>
    isSection(item)
      ? item.schema.map((field) => ({ field, path: item.flatten ? field.name : `${item.name}.${field.name}` }))
      : [{ field: item, path: item.name }],
  );
}

/**
 * The schema for `ha-form`: everything while `showAdvanced` is on; without the advanced fields while it is off.
 * Advanced fields stay in their own section, and a section left without fields is left out.
 */
export function visibleSchema(schema: EditorSchema, showAdvanced: boolean): FormSchema {
  const shown = (field: EditorField): boolean => showAdvanced || field.advanced !== true;
  return schema.flatMap((item): (FormField | FormSection)[] => {
    if (!isSection(item)) return shown(item) ? [toFormField(item)] : [];
    const fields = item.schema.filter(shown).map(toFormField);
    return fields.length > 0 ? [{ ...item, schema: fields }] : [];
  });
}

/**
 * Whether a config value counts as set to something other than the field's default. Numbers are compared as
 * numbers ("1.20" equals 1.2), other values as text ignoring case ("#FFF" equals "#fff").
 */
function differsFromDefault(value: unknown, field: EditorField): boolean {
  if (value === undefined || value === null || value === '') return false;
  if (field.default === undefined) return true;
  if (typeof field.default === 'number') {
    const number = typeof value === 'number' ? value : typeof value === 'string' ? parseNumericState(value) : undefined;
    if (number !== undefined) return number !== field.default;
  }
  return comparable(value) !== comparable(field.default);
}

function comparable(value: unknown): string {
  const text =
    typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
      ? String(value)
      : JSON.stringify(value);
  return text.toLowerCase();
}

/** True when the config sets any advanced field to a value other than its default, so the switch starts on. */
export function hasAdvancedValue(schema: EditorSchema, config: CardConfig): boolean {
  return fieldsWithPaths(schema).some(
    ({ field, path }) => field.advanced === true && differsFromDefault(valueAt(config, path), field),
  );
}
