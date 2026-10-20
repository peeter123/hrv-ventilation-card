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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * A copy of the config with `value` at the dotted path (parents created when missing); `undefined` removes it. A
 * parent left empty by a removal is removed as well, unless `original` already had it.
 */
function withValueAt(config: CardConfig, path: string, value: unknown, original?: CardConfig, prefix = ''): CardConfig {
  const [key, ...rest] = path.split('.') as [string, ...string[]];
  const record = config as Record<string, unknown>;
  const { [key]: current, ...others } = record;
  if (rest.length === 0) return value === undefined ? others : { ...others, [key]: value };
  const child = withValueAt(isRecord(current) ? current : {}, rest.join('.'), value, original, `${prefix}${key}.`);
  const existed = original !== undefined && valueAt(original, `${prefix}${key}`) !== undefined;
  if (value === undefined && Object.keys(child).length === 0 && !existed) return others;
  return { ...record, [key]: child };
}

/**
 * The config as `ha-form` displays it: every field of the schema that the config leaves unset shows its default.
 * `ha-form` does not draw the `default` of a selector for missing data, so a new card would show blank drop-downs.
 * This is display data only; `withoutShownDefaults` takes the defaults out again before a change is saved. The
 * paths in `emptied` are fields the user just cleared: they stay empty instead of showing their default again.
 * Returns the config itself when there is nothing to add.
 */
export function withShownDefaults(
  schema: EditorSchema | FormSchema,
  config: CardConfig,
  emptied: ReadonlySet<string> = new Set(),
): CardConfig {
  return fieldsWithPaths(schema as EditorSchema).reduce(
    (shown, { field, path }) =>
      field.default !== undefined && valueAt(config, path) === undefined && !emptied.has(path)
        ? withValueAt(shown, path, field.default)
        : shown,
    config,
  );
}

/**
 * The paths of the fields the user cleared: set in what `ha-form` displayed (`shown`) and unset in what it reports
 * (`changed`, where a cleared field is missing or `undefined`).
 */
export function clearedPaths(schema: EditorSchema | FormSchema, shown: CardConfig, changed: CardConfig): string[] {
  return fieldsWithPaths(schema as EditorSchema)
    .map(({ path }) => path)
    .filter((path) => valueAt(shown, path) !== undefined && valueAt(changed, path) === undefined);
}

/**
 * A copy without the keys whose value is `undefined`, in sections too: `ha-form` reports a cleared field as
 * `{ name: undefined }`, which must not reach the saved config. Returns the value itself when it has none.
 */
export function withoutUndefined<T>(value: T): T {
  if (!isRecord(value)) return value;
  const entries = Object.entries(value).filter(([, item]) => item !== undefined);
  const cleaned = entries.map(([key, item]) => [key, withoutUndefined(item)] as const);
  const changed = cleaned.length !== Object.keys(value).length || cleaned.some(([key, item]) => item !== value[key]);
  return changed ? (Object.fromEntries(cleaned) as T) : value;
}

/**
 * The config to save after `ha-form` reports `changed`: a field the current config left unset is dropped again when
 * its value is still the default that `withShownDefaults` displayed, so editing one field never writes the defaults
 * of the others into the card's YAML.
 */
export function withoutShownDefaults(
  schema: EditorSchema | FormSchema,
  current: CardConfig,
  changed: CardConfig,
): CardConfig {
  return fieldsWithPaths(schema as EditorSchema).reduce(
    (saved, { field, path }) =>
      field.default !== undefined &&
      valueAt(current, path) === undefined &&
      valueAt(saved, path) !== undefined &&
      !differsFromDefault(valueAt(saved, path), field)
        ? withValueAt(saved, path, undefined, current)
        : saved,
    changed,
  );
}
