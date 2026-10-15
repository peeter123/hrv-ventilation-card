// When an entity has "no value": the rule every card applies before it shows or computes a figure.

/** The part of a Home Assistant state object these functions read. */
export interface StateLike {
  state: string;
}

// Only `unknown` and `unavailable`. Text states such as "n/a" are real values; the diagram's label model shows its
// two next-change labels as a dimmed dash on "n/a" (and on unknown) itself.
const UNAVAILABLE_STATES: ReadonlySet<string> = new Set(['unknown', 'unavailable']);
// Plain decimal numbers as HA reports them ("21.4", "-3", "1e-3"), without padding. Number() alone would also
// accept "", " ", "0x10" and "Infinity".
const DECIMAL = /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i;

/** True when the entity is missing from Home Assistant or its state is `unknown` or `unavailable`. */
export function isUnavailable(stateObj: StateLike | undefined): boolean {
  return stateObj === undefined || UNAVAILABLE_STATES.has(stateObj.state);
}

/**
 * A raw state string as a number, or undefined when it is not a plain finite decimal number (also used for the
 * `s` values of the history, where `unknown` and `unavailable` fail the same test). "-0" gives 0.
 */
export function parseNumericState(text: string): number | undefined {
  if (!DECIMAL.test(text)) return undefined;
  const value = Number(text);
  return Number.isFinite(value) ? value + 0 : undefined;
}

/** The state as a number, or undefined when the entity is missing, unknown, unavailable or not numeric. */
export function numericValue(stateObj: StateLike | undefined): number | undefined {
  return stateObj === undefined ? undefined : parseNumericState(stateObj.state);
}
