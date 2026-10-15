// Converts a numeric state into the unit the calculation uses, based on the entity's unit_of_measurement.
// Units the cards do not know count as no value (undefined), so a figure is never computed from a wrong unit.
import { numericValue } from './availability';
import type { EntityStateLike } from './hass';

/** The kinds of input the calculation takes, each with the one unit it calculates in. */
export type Quantity =
  | 'temperature' // °C
  | 'flow' // m³/h
  | 'absolute_humidity' // g/m³
  | 'relative_humidity' // %
  | 'percentage' // %, the bypass position
  | 'power'; // W, the saving sensors

/** calculation value = (value + offset) * scale */
interface Conversion {
  scale: number;
  offset?: number;
}

const SAME: Conversion = { scale: 1 };
const FAHRENHEIT: Conversion = { scale: 5 / 9, offset: -32 };
const KILOWATTS: Conversion = { scale: 1000 };
const LITRES_PER_SECOND: Conversion = { scale: 3.6 };
// 1 ft³ = 0.028316846592 m³, times 60 minutes.
const CUBIC_FEET_PER_MINUTE: Conversion = { scale: 0.028316846592 * 60 };

// One key per unit, in the normalised form below. Maps, so a unit like "constructor" is not found on a prototype.
const CONVERSIONS: Record<Quantity, ReadonlyMap<string, Conversion>> = {
  temperature: new Map([
    ['°c', SAME],
    ['°f', FAHRENHEIT],
  ]),
  flow: new Map([
    ['m3/h', SAME],
    ['l/s', LITRES_PER_SECOND],
    ['ft3/min', CUBIC_FEET_PER_MINUTE],
  ]),
  absolute_humidity: new Map([['g/m3', SAME]]),
  relative_humidity: new Map([['%', SAME]]),
  percentage: new Map([['%', SAME]]),
  power: new Map([
    ['w', SAME],
    ['kw', KILOWATTS],
  ]),
};

/**
 * The unit as a lookup key: trimmed, NFKC-normalised (folds "℃" to "°C" and "³" to "3"), the ordinal indicator
 * "º" read as a degree sign, lower case. So the spellings template and MQTT sensors use find the same unit.
 */
function unitKey(unit: string): string {
  return unit.trim().replaceAll('º', '°').normalize('NFKC').toLowerCase(); // º before NFKC, which makes it "o"
}

/**
 * A state object's value in the calculation unit of `quantity`, or undefined while it has no value or its unit is not
 * supported.
 */
export function convertedState(state: EntityStateLike | undefined, quantity: Quantity): number | undefined {
  const value = numericValue(state);
  return value === undefined ? undefined : toCalcUnit(quantity, value, state?.attributes.unit_of_measurement);
}

/**
 * Converts `value` in `unit` to the calculation unit of `quantity`; undefined when the unit is not supported or the
 * value is not a finite number.
 */
export function toCalcUnit(quantity: Quantity, value: number, unit: string | undefined): number | undefined {
  if (!Number.isFinite(value) || unit === undefined) return undefined;
  const conversion = CONVERSIONS[quantity].get(unitKey(unit));
  return conversion ? (value + (conversion.offset ?? 0)) * conversion.scale : undefined;
}
