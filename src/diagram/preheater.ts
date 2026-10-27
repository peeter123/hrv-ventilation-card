// The glow level of the pre-heater coil in the airflow diagram, 0 (off) to 1 (full). Pure: the Lit element draws it.
import { type PreHeaterState, preHeaterRunning } from '../lib/preheater';
import { convertedState } from '../lib/units';

export type { PreHeaterState };

/** Smallest level while the heater draws power, so a modulating heater at a few percent does not look off. */
const MIN_LEVEL = 0.1;

/**
 * How hot the coil glows. A power (converted to W) gives 0 at or below 0 W; with `maxPower` it is the share of it,
 * at least 0.1 and at most 1; without one it is 1. An on/off entity gives 1 when on and 0 when off. Anything else
 * (unavailable, unknown, text, an unsupported unit, a missing entity) gives 0.
 */
export function preHeaterLevel(state: PreHeaterState | undefined, maxPower: number | undefined): number {
  if (!preHeaterRunning(state)) return 0;
  const power = convertedState(state && { state: state.state, attributes: state.attributes ?? {} }, 'power');
  if (power === undefined || maxPower === undefined) return 1;
  return Math.min(Math.max(power / maxPower, MIN_LEVEL), 1);
}

/** True while the pre-heater heats: its glow level is above 0 (never while unavailable, unknown or missing). */
export function preHeaterOn(state: PreHeaterState | undefined): boolean {
  return preHeaterLevel(state, undefined) > 0;
}
