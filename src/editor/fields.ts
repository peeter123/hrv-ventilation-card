// Editor fields and sections shared by the card schemas: the unit's sensors per air stream, the fans and the bypass,
// and the calculation's options. Each card's schema adds its own options.
import { CALCULATION_OPTIONS } from '../calc/inputs';
import type { Stream } from '../lib/config';
import type { BooleanOption, ChoiceOption, NumberOption } from '../lib/options';
import type { EditorField, EditorSection } from './schema';

/** An entity picker that only offers sensors. */
export const SENSOR = { entity: { domain: 'sensor' } };

/** A sensor picker; `advanced` hides it while the "Advanced settings" switch is off. */
export const sensorField = (name: string, { advanced = false, required = false } = {}): EditorField => ({
  name,
  selector: SENSOR,
  ...(advanced ? { advanced } : {}),
  ...(required ? { required } : {}),
});

/** A binary sensor picker. */
export const binarySensorField = (name: string): EditorField => ({
  name,
  selector: { entity: { domain: 'binary_sensor' } },
});

/**
 * A stream section: temperature, relative humidity and absolute humidity. The bar cards keep the absolute humidity
 * advanced (relative humidity with the temperature is enough); the diagram shows it as a label, so there it is basic.
 */
export const streamSection = (
  name: Stream,
  { requiredTemperature, advancedAbsolute = true }: { requiredTemperature: boolean; advancedAbsolute?: boolean },
): EditorSection => ({
  type: 'expandable',
  name,
  schema: [
    sensorField('temperature', { required: requiredTemperature }),
    sensorField('humidity'),
    sensorField('absolute_humidity', { advanced: advancedAbsolute }),
  ],
});

/** A number field from a card's option table, with its range, step and default. */
export const numberField = (name: string, option: NumberOption, step: number, unit?: string): EditorField => ({
  name,
  advanced: true,
  default: option.default,
  selector: {
    number: {
      min: option.min,
      max: option.max,
      step,
      mode: 'box',
      ...(unit === undefined ? {} : { unit_of_measurement: unit }),
    },
  },
});

/** An advanced colour field with the option's default. */
export const colorField = (name: string, fallback: string): EditorField => ({
  name,
  advanced: true,
  default: fallback,
  selector: { text: {} },
});

/** A switch for a boolean option, with its default. */
export const booleanField = (name: string, option: BooleanOption, { advanced = false } = {}): EditorField => ({
  name,
  default: option.default,
  selector: { boolean: {} },
  ...(advanced ? { advanced } : {}),
});

/** A drop-down for a choice option, with a label per choice; advanced unless `advanced: false`. */
export const choiceField = (
  name: string,
  option: ChoiceOption,
  labels: Readonly<Record<string, string>>,
  { advanced = true } = {},
): EditorField => ({
  name,
  ...(advanced ? { advanced } : {}),
  default: option.default,
  selector: {
    select: { mode: 'dropdown', options: option.choices.map((value) => ({ value, label: labels[value] ?? value })) },
  },
});

/** The fans section with the supply flow, which the calculation requires. */
export const FANS_SECTION: EditorSection = {
  type: 'expandable',
  name: 'fans',
  schema: [sensorField('supply_flow', { required: true })],
};

/** The bypass section with the bypass position. */
export const BYPASS_SECTION: EditorSection = {
  type: 'expandable',
  name: 'bypass',
  schema: [sensorField('position')],
};

/** The calculation section: smoothing and air density, flattened so they stay top-level options. */
export const CALCULATION_SECTION: EditorSection = {
  type: 'expandable',
  name: 'calculation',
  flatten: true,
  schema: [
    numberField('smoothing', CALCULATION_OPTIONS.smoothing, 1, 'min'),
    numberField('air_density', CALCULATION_OPTIONS.airDensity, 0.01, 'kg/m³'),
  ],
};
