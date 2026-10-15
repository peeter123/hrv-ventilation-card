// Every text the cards and their editor show, in English, in one place so a later change can add languages.
// Texts with values are functions that take the numbers already formatted for the user's locale (lib/format.ts).
// Plain text only (no emoji). A number and its unit are always joined by NBSP, never a plain space, so a line
// never breaks between them (a test checks every template).
import type { RolePath } from './lib/config';

/** A no-break space: keeps a number on one line with its unit, in every text below. */
const NBSP = ' ';

/** Shown for a figure whose inputs have no value. */
export const NO_VALUE = 'n/a';

/**
 * How each role is named in a configuration error: "Missing required entities: supply air humidity". Typed by
 * RolePath, so every role has a label.
 */
export const ROLE_LABELS: Readonly<Record<RolePath, string>> = {
  'outdoor.temperature': 'outdoor air temperature',
  'outdoor.humidity': 'outdoor air humidity',
  'outdoor.absolute_humidity': 'outdoor air absolute humidity',
  'supply.temperature': 'supply air temperature',
  'supply.humidity': 'supply air humidity',
  'supply.absolute_humidity': 'supply air absolute humidity',
  'extract.temperature': 'extract air temperature',
  'extract.humidity': 'extract air humidity',
  'extract.absolute_humidity': 'extract air absolute humidity',
  'exhaust.temperature': 'exhaust air temperature',
  'exhaust.humidity': 'exhaust air humidity',
  'exhaust.absolute_humidity': 'exhaust air absolute humidity',
  'fans.level': 'fan level',
  'fans.supply_flow': 'supply flow',
  'fans.exhaust_flow': 'exhaust flow',
  'bypass.position': 'bypass position',
  'bypass.mode': 'bypass mode',
  'bypass.next_change': 'next bypass change',
  'status.operating_mode': 'operating mode',
  'status.target_temperature': 'profile target temperature',
  'status.temperature_profile': 'temperature profile',
  'status.next_fan_change': 'next fan change',
  'status.filter_days': 'filter days remaining',
  'status.power': 'power',
  'status.rmot': 'running mean outdoor temperature',
  'seasons.heating': 'heating season',
  'seasons.cooling': 'cooling season',
};

/** The message setConfig throws when required roles are missing. Only call it with a non-empty list. */
export const configError = (missingPaths: readonly RolePath[]): string =>
  `Missing required entities: ${missingPaths.map((path) => ROLE_LABELS[path]).join(', ')}`;

/** The message setConfig throws for an option with an invalid value: what the option accepts. */
export const OPTIONS = {
  invalid: (option: string, accepts: string): string => `Invalid option ${option}: expected ${accepts}`,
  number: (min: string, max: string): string => `a number from ${min} to ${max}`,
  color: 'a CSS colour such as #db4437 or rgb(219, 68, 55)',
  boolean: 'true or false',
  object: 'a group of options',
  choice: (choices: readonly string[]): string => `one of ${choices.join(', ')}`,
} as const;

/** Names and descriptions in the dashboard's card picker. */
export const CARD_PICKER = {
  diagram: {
    name: 'HRV Airflow Diagram',
    description: 'The four air streams of a heat recovery ventilation unit, with bypass, fans and the current saving.',
  },
  recovery: {
    name: 'HRV Recovery Balance',
    description:
      'Heat or cooling recovered and still lost by the exchanger, or the free cooling of the bypass, split into temperature and moisture.',
  },
  moisture: {
    name: 'HRV Moisture Balance',
    description: 'Moisture extracted from the house, recovered by the exchanger and put outside.',
  },
} as const;

/** The shared editor around Home Assistant's form. */
export const EDITOR = {
  advanced: 'Advanced settings',
  noForm: 'The visual editor is not available in this version of Home Assistant. Use the code editor instead.',
  sections: {
    outdoor: 'Outdoor air',
    supply: 'Supply air',
    extract: 'Extract air',
    exhaust: 'Exhaust air',
    fans: 'Fans',
    bypass: 'Bypass',
    status: 'Status',
    seasons: 'Seasons',
    calculation: 'Calculation',
    colors: 'Colours',
    heating: 'Heating colours',
    cooling: 'Cooling colours',
    animation: 'Animation',
  },
  fields: {
    temperature: 'Temperature',
    humidity: 'Relative humidity',
    absolute_humidity: 'Absolute humidity',
    level: 'Fan level',
    supply_flow: 'Supply flow',
    exhaust_flow: 'Exhaust flow',
    position: 'Bypass position',
    mode: 'Bypass mode',
    next_change: 'Next bypass change',
    operating_mode: 'Operating mode',
    target_temperature: 'Profile target temperature',
    temperature_profile: 'Temperature profile',
    next_fan_change: 'Next fan change',
    filter_days: 'Filter days remaining',
    power: 'Power',
    rmot: 'Running mean outdoor temperature',
    heating: 'Heating season',
    cooling: 'Cooling season',
    smoothing: 'Humidity smoothing (minutes, 0 = off)',
    air_density: 'Air density (kg/m³)',
    min_scale: 'Minimum scale',
    neutral_threshold: 'Neutral threshold (g/m³)',
    color: 'Temperature colour',
    color_latent: 'Moisture colour',
    drying_color: 'Drying colour',
    gaining_color: 'Gaining colour',
    cold: 'Cold colour',
    warm: 'Warm colour',
    enabled: 'Animate the air flow',
    nominal_flow: 'Nominal flow (in the unit of the flow entities)',
    layout: 'Layout',
    show_unavailable: 'Show unavailable values',
  },
  layouts: {
    auto: 'Automatic',
    full: 'Full',
    compact: 'Compact',
  },
} as const;

/** The recovery balance bar. Values are formatted numbers without units. */
export const RECOVERY = {
  titleHeating: 'Heat Recovery',
  titleCooling: 'Cooling Recovery',
  titleFreeCooling: 'Free Cooling',
  titleNoValue: 'Recovery',
  header: (recovered: string, potential: string, percent: string): string =>
    `Recovered ${recovered}${NBSP}W of ${potential}${NBSP}W (${percent}${NBSP}%)`,
  headerNoPotential: (recovered: string): string => `Recovered ${recovered}${NBSP}W`,
  /** Free cooling: the cooling the supply air brings, of what fully outdoor air would bring. */
  headerFreeCooling: (cooling: string, potential: string, percent: string): string =>
    `Cooling ${cooling}${NBSP}W of ${potential}${NBSP}W (${percent}${NBSP}%)`,
  headerFreeCoolingNoPotential: (cooling: string): string => `Cooling ${cooling}${NBSP}W`,
  /** The legend's name of each lane of the bar. */
  laneSensible: 'Temperature',
  laneLatent: 'Moisture',
  recovered: (watts: string): string => `Recovered ${watts}${NBSP}W`,
  /** The recovered part's legend while free cooling. */
  cooling: (watts: string): string => `Cooling ${watts}${NBSP}W`,
  lost: (watts: string): string => `Lost ${watts}${NBSP}W`,
  /** The lost part's legend while free cooling: cooling the outdoor air could have brought but the supply did not. */
  missed: (watts: string): string => `Missed ${watts}${NBSP}W`,
  water: (gramsPerHour: string): string => `Water Recovered ${gramsPerHour}${NBSP}g/h`,
  /** The water legend while the rate is negative (outdoor air more humid), with the rate's magnitude. */
  waterKeptOut: (gramsPerHour: string): string => `Water Kept Out ${gramsPerHour}${NBSP}g/h`,
  scale: (watts: string): string => `Scale ±${watts}${NBSP}W`,
} as const;

/** The figures of the moisture bar's texts: formatted magnitudes without units or signs. */
export interface MoistureFigures {
  gaining: boolean;
  extracted: string;
  recovered: string;
  outside: string;
}

/** The moisture balance bar. Values are formatted magnitudes without units or signs. */
export const MOISTURE = {
  title: 'Moisture',
  titleDrying: 'Moisture: House Drying',
  titleGaining: 'Moisture: House Gaining (Outdoor More Humid)',
  titleNeutral: 'Moisture: Indoor ≈ Outdoor',
  neutral: 'within sensor accuracy',
  header: ({ gaining, recovered, extracted }: MoistureFigures): string =>
    `${gaining ? 'Kept out' : 'Recovered'} ${recovered} of ${extracted}${NBSP}g/h`,
  percent: (percent: string, bypass?: string): string =>
    bypass === undefined ? ` (${percent}${NBSP}%)` : ` (${percent}${NBSP}%, with bypass ${bypass}${NBSP}%)`,
  bypass: (position: string): string =>
    `Bypass ${position}${NBSP}% — part of the supply air skips the exchanger, so less is recovered (intended, free cooling)`,
  flow: ({ gaining, extracted, recovered, outside }: MoistureFigures): string =>
    gaining
      ? `Outdoor Air Brings In ${extracted} → Kept Out ${recovered} + Enters ${outside}${NBSP}g/h`
      : `Extracted ${extracted} → Recovered ${recovered} + Outside ${outside}${NBSP}g/h`,
  swatchRecovered: (gaining: boolean): string => (gaining ? 'Kept Out' : 'Recovered'),
  swatchOutside: (gaining: boolean): string => (gaining ? 'Enters' : 'Outside'),
  humidities: (indoor: string, outdoor: string): string =>
    `Indoor ${indoor}${NBSP}g/m³ · Outdoor ${outdoor}${NBSP}g/m³`,
  scale: (gramsPerHour: string): string => `Scale ±${gramsPerHour}${NBSP}g/h`,
} as const;

/** The airflow diagram. */
export const DIAGRAM = {
  prefixes: {
    rmot: 'RMOT ',
  },
  /** Shown, dimmed, in place of a next change while nothing is planned. */
  notPlanned: '—',
  seasons: {
    heating: 'Heating season',
    cooling: 'Cooling season',
    between: 'Between seasons',
  },
  saving: (watts: string): string => `${watts}${NBSP}W`,
} as const;
