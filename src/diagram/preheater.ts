// The glow level of the pre-heater coil in the airflow diagram, 0 (off) to 1 (full). Pure: the Lit element draws it.
import type { StateLike } from '../lib/availability';
import type { EntityStateLike } from '../lib/hass';
import { convertedState } from '../lib/units';

/** Smallest level while the heater draws power, so a modulating heater at a few percent does not look off. */
const MIN_LEVEL = 0.1;

/** A pre-heater entity's state; without attributes there is no unit, so a power has no value. */
export type PreHeaterState = StateLike & Partial<Pick<EntityStateLike, 'attributes'>>;

/**
 * How hot the coil glows. A power (converted to W) gives 0 at or below 0 W; with `maxPower` it is the share of it,
 * at least 0.1 and at most 1; without one it is 1. An on/off entity gives 1 when on and 0 when off. Anything else
 * (unavailable, unknown, text, an unsupported unit, a missing entity) gives 0.
 */
export function preHeaterLevel(state: PreHeaterState | undefined, maxPower: number | undefined): number {
  const power = convertedState(state && { state: state.state, attributes: state.attributes ?? {} }, 'power');
  if (power !== undefined) {
    if (power <= 0) return 0;
    return maxPower === undefined ? 1 : Math.min(Math.max(power / maxPower, MIN_LEVEL), 1);
  }
  return state?.state === 'on' ? 1 : 0;
}

/** True while the pre-heater heats: its glow level is above 0 (never while unavailable, unknown or missing). */
export function preHeaterOn(state: PreHeaterState | undefined): boolean {
  return preHeaterLevel(state, undefined) > 0;
}
