// The season icon of the airflow diagram's top row. The unit reports its season as two binary sensors, heating
// season and cooling season; both off is the third state, between seasons. Pure: the Lit element renders the result.
import type { StateLike } from '../lib/availability';
import { entityAt, type CardConfig } from '../lib/config';
import { DIAGRAM } from '../strings';

export type Season = 'heating' | 'cooling' | 'between';

export interface SeasonIcon {
  season: Season;
  icon: string;
  color: string;
  /** Tooltip and accessible name. */
  title: string;
  /** The entity whose more-info dialog opens on tap. */
  entityId: string;
}

const ICONS: Readonly<Record<Season, string>> = {
  heating: 'mdi:sun-thermometer',
  cooling: 'mdi:snowflake-thermometer',
  between: 'mdi:sun-snowflake-variant',
};

/**
 * The season icon for the current states, or undefined when none applies. Heating while the heating entity is on
 * (also when both are on, which the unit should not report), cooling while the cooling entity is on, between
 * seasons only while both entities are configured and both are off: with one entity, off cannot tell between
 * seasons from the other season. Heating takes the warm colour, cooling the cold one.
 */
export function seasonIcon(
  config: CardConfig,
  states: Readonly<Record<string, StateLike | undefined>>,
  colors: { cold: string; warm: string },
): SeasonIcon | undefined {
  const heating = entityAt(config, 'seasons.heating');
  const cooling = entityAt(config, 'seasons.cooling');
  const stateText = (id: string): string | undefined => states[id]?.state;
  const icon = (season: Season, color: string, entityId: string): SeasonIcon => ({
    season,
    icon: ICONS[season],
    color,
    title: DIAGRAM.seasons[season],
    entityId,
  });

  if (heating !== undefined && stateText(heating) === 'on') return icon('heating', colors.warm, heating);
  if (cooling !== undefined && stateText(cooling) === 'on') return icon('cooling', colors.cold, cooling);
  if (heating !== undefined && cooling !== undefined && stateText(heating) === 'off' && stateText(cooling) === 'off') {
    return icon('between', 'var(--secondary-text-color)', heating);
  }
  return undefined;
}
