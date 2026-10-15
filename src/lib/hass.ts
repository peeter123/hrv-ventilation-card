// The parts of Home Assistant's `hass` object the cards use. HA's frontend types are not published as a package,
// so the cards declare what they read. Fields are added here as the cards start to use them.
import { NO_VALUE } from '../strings';
import { isUnavailable } from './availability';

/** A state object as in `hass.states[entity_id]`. */
export interface HassEntityState {
  entity_id: string;
  state: string;
  attributes: Readonly<Record<string, unknown>> & { unit_of_measurement?: string; friendly_name?: string };
  last_changed?: string;
  last_updated?: string;
}

/** The parts of a state object a value is read from (state and unit). */
export type EntityStateLike = Pick<HassEntityState, 'state' | 'attributes'>;

/** The `hass` object passed to cards. */
export interface HassLike {
  states: Readonly<Record<string, HassEntityState | undefined>>;
  /** Entity registry entries (display precision, name); HA builds new entry objects on every registry update. */
  entities?: Readonly<Record<string, unknown>>;
  /** Language and number format; replaced when the user changes them. */
  locale?: unknown;
  /** The UI language; older versions have it without `locale`. */
  language?: string;
  themes?: { darkMode?: boolean };
  /** Replaced when translations load. */
  localize?: unknown;
  /** HA's own state formatting (unit, precision, translated states); replaced when translations load. */
  formatEntityState?: (stateObj: HassEntityState) => string;
}

/**
 * An entity's state as Home Assistant shows it: `hass.formatEntityState` (unit, display precision, number format,
 * translated states), or on versions without it the raw state with its unit (none on unknown or unavailable). `n/a` for an entity that is missing.
 */
/** The state object of an entity, or undefined without an ID or while Home Assistant does not know the entity. */
export const stateOf = <S>(
  states: Readonly<Record<string, S | undefined>>,
  entityId: string | undefined,
): S | undefined => (entityId === undefined ? undefined : states[entityId]);

export function formatState(hass: Pick<HassLike, 'states' | 'formatEntityState'>, entityId: string): string {
  const stateObj = hass.states[entityId];
  if (stateObj === undefined) return NO_VALUE;
  if (typeof hass.formatEntityState === 'function') return hass.formatEntityState(stateObj);
  const unit = stateObj.attributes.unit_of_measurement;
  return unit && !isUnavailable(stateObj) ? `${stateObj.state} ${unit}` : stateObj.state;
}
