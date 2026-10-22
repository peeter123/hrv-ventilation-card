// How fast the air moves along a stream of the airflow diagram. Pure: the card turns the speed into the duration of
// the dashes' CSS animation.
import { isUnavailable, numericValue, type StateLike } from '../lib/availability';

/** The speed range with a nominal flow: a quarter to twice the medium speed. */
export const MIN_SPEED = 0.25;
export const MAX_SPEED = 2;

/**
 * The speed factor of a stream from its flow entity's state, 1 being the medium speed, or 0 while the stream stands
 * still. A flow of 0 or less stops it. Otherwise, with a nominal flow (in the entity's unit), the factor is flow /
 * nominal flow, clamped to 0.25 to 2; without one it is the medium speed. Without a flow entity, or while it has no
 * value (unavailable, unknown), the stream moves at the medium speed, as nothing says the fans have stopped.
 */
export function flowSpeed(flow: StateLike | undefined, nominalFlow: number | undefined): number {
  const value = numericValue(flow);
  if (value === undefined) return 1;
  if (value <= 0) return 0;
  if (nominalFlow === undefined || nominalFlow <= 0) return 1;
  return Math.min(Math.max(value / nominalFlow, MIN_SPEED), MAX_SPEED);
}

/** A state as `ventilationDisabled` compares it: trimmed and in lower case. Normalise the stopped states once. */
export const normalizedState = (state: string): string => state.trim().toLowerCase();

/**
 * True while the ventilation mode entity says the unit does not ventilate: it exists, is not unavailable or unknown
 * (the card does not claim a stop it cannot see), and its raw state, trimmed, equals one of the stopped states
 * ignoring case. The raw state, so the comparison does not depend on the user's language. `stoppedStates` must be
 * normalised with `normalizedState`.
 */
export function ventilationDisabled(stateObj: StateLike | undefined, stoppedStates: readonly string[]): boolean {
  if (stateObj === undefined || isUnavailable(stateObj)) return false;
  return stoppedStates.includes(normalizedState(stateObj.state));
}
