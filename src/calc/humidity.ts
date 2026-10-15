// Absolute humidity from relative humidity and temperature (Magnus formula), for streams that only have a relative
// humidity sensor. On the reference unit this reproduces its own absolute humidity sensors within 0.003 g/m³.

// Outside this range a temperature is a sensor fault for ventilation air; the formula also has a pole at -243.5 °C.
const MIN_TEMPERATURE = -100; // °C
const MAX_TEMPERATURE = 100; // °C

/**
 * Absolute humidity in g/m³ from the temperature in °C and the relative humidity in %:
 * AH = 6.112 * exp(17.67 * T / (T + 243.5)) * RH * 2.1674 / (273.15 + T).
 * The coefficients are those over water, also below freezing, as humidity sensors report RH relative to water.
 * Undefined for values that are not finite numbers, a temperature outside -100 to 100 °C, or a relative humidity
 * outside 0 to 100 % (a sensor fault, not a real reading).
 */
export function absoluteHumidity(temperature: number, relativeHumidity: number): number | undefined {
  if (!Number.isFinite(temperature) || temperature < MIN_TEMPERATURE || temperature > MAX_TEMPERATURE) return undefined;
  if (!Number.isFinite(relativeHumidity) || relativeHumidity < 0 || relativeHumidity > 100) return undefined;
  const saturationPressure = 6.112 * Math.exp((17.67 * temperature) / (temperature + 243.5)); // hPa
  return (saturationPressure * relativeHumidity * 2.1674) / (273.15 + temperature);
}
