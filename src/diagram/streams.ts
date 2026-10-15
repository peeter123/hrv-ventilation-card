// How the airflow diagram draws its streams: the bypass strength and the colour of each stream end. Pure: the Lit
// element renders the result.
import { numericValue, type StateLike } from '../lib/availability';
import type { EntityStateLike } from '../lib/hass';
import { mapStreams, type Stream } from '../lib/config';
import { convertedState } from '../lib/units';

/** The colour of a stream end without a usable temperature. */
export const NO_TEMPERATURE_COLOR = 'var(--disabled-text-color, #9e9e9e)';

/** The colour range is at least this wide (K), so near-equal temperatures stay near the midpoint colour. */
const MIN_RANGE = 10;

/**
 * The share of the outdoor-to-supply stream that takes the bypass, 0 to 1: the bypass position in % divided by 100,
 * clamped. 0 without a bypass entity or while its state is not numeric.
 */
export function bypassStrength(state: StateLike | undefined): number {
  const position = numericValue(state);
  return position === undefined ? 0 : Math.min(Math.max(position / 100, 0), 1);
}

/**
 * Each stream end's position in the colour range, 0 (cold) to 1 (warm), or undefined without a usable temperature
 * (unavailable, or a unit other than °C and °F). The range is centred midway between the coldest and the warmest
 * usable temperature and is as wide as their spread, but at least 10 K: with a spread of 10 K or more the coldest end
 * gets the cold colour and the warmest the warm colour.
 */
export function temperaturePositions(
  temperatures: Readonly<Record<Stream, EntityStateLike | undefined>>,
): Record<Stream, number | undefined> {
  const values = mapStreams((stream) => convertedState(temperatures[stream], 'temperature'));
  const known = Object.values(values).filter((value): value is number => value !== undefined);
  const low = Math.min(...known);
  const high = Math.max(...known);
  const width = Math.max(high - low, MIN_RANGE);
  const bottom = (low + high) / 2 - width / 2;
  const position = (value: number | undefined): number | undefined =>
    value === undefined ? undefined : Math.min(Math.max((value - bottom) / width, 0), 1);
  return mapStreams((stream) => position(values[stream]));
}

/** The colour at a position between the cold (0) and the warm (1) colour; grey without a position. */
export function mixColor(position: number | undefined, colors: { cold: string; warm: string }): string {
  if (position === undefined) return NO_TEMPERATURE_COLOR;
  const percent = Math.round(position * 1000) / 10;
  if (percent <= 0) return colors.cold;
  if (percent >= 100) return colors.warm;
  return `color-mix(in srgb, ${colors.warm} ${String(percent)}%, ${colors.cold})`;
}

/** The colour of each stream end from the four stream temperatures. */
export function temperatureColors(
  temperatures: Readonly<Record<Stream, EntityStateLike | undefined>>,
  colors: { cold: string; warm: string },
): Record<Stream, string> {
  const positions = temperaturePositions(temperatures);
  return mapStreams((stream) => mixColor(positions[stream], colors));
}
