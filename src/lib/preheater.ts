// Whether the pre-heater runs, read from its power or on/off entity. Pure, shared by the diagram and the calculation.
import type { StateLike } from './availability';
import type { EntityStateLike } from './hass';
import { convertedState } from './units';

/** A pre-heater entity's state; without attributes there is no unit, so a power has no value. */
export type PreHeaterState = StateLike & Partial<Pick<EntityStateLike, 'attributes'>>;

/**
 * True while the pre-heater runs: a power (converted to W) above 0, or the state `on`. False at 0 W or below, or
 * `off`. Undefined when there is no reading (unavailable, unknown, text, an unsupported unit, a missing entity).
 */
export function preHeaterRunning(state: PreHeaterState | undefined): boolean | undefined {
  const power = convertedState(state && { state: state.state, attributes: state.attributes ?? {} }, 'power');
  if (power !== undefined) return power > 0;
  if (state?.state === 'on') return true;
  if (state?.state === 'off') return false;
  return undefined;
}
