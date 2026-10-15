// The airflow diagram card's required roles and options table. setConfig checks a config against them; the card
// reads the options through lib/options.ts.
import { CALCULATION_OPTIONS } from '../calc/inputs';
import type { Requirements } from '../lib/config';
import type { BooleanOption, ChoiceOption, ColorOption, NumberOption, OptionSpec } from '../lib/options';
import type { ExchangerType } from './drawing';
import type { LayoutChoice } from './labels';

/** The card needs the four stream temperatures; every other role is optional. */
export const DIAGRAM_REQUIREMENTS: Requirements = {
  paths: ['outdoor.temperature', 'supply.temperature', 'extract.temperature', 'exhaust.temperature'],
};

const LAYOUTS = ['auto', 'full', 'compact'] as const satisfies readonly LayoutChoice[];
const EXCHANGER_TYPES = ['hrv', 'erv'] as const satisfies readonly ExchangerType[];

/** The card's options; smoothing and air_density are read by the calculation behind the badge. */
export const DIAGRAM_OPTIONS = {
  ...CALCULATION_OPTIONS,
  // Changes only the drawing: an ERV gets a blue-grey exchanger and the moisture recovery figure.
  exchangerType: { kind: 'choice', path: 'exchanger_type', choices: EXCHANGER_TYPES, default: 'hrv' },
  cold: { kind: 'color', path: 'colors.cold', default: '#039be5' },
  warm: { kind: 'color', path: 'colors.warm', default: '#db4437' },
  animation: { kind: 'boolean', path: 'animation.enabled', default: true },
  // In the unit of the flow entities; without it every stream moves at the same speed.
  nominalFlow: { kind: 'number', path: 'animation.nominal_flow', min: 1, max: 100_000, default: undefined },
  layout: { kind: 'choice', path: 'layout', choices: LAYOUTS, default: 'auto' },
  showUnavailable: { kind: 'boolean', path: 'show_unavailable', default: false },
} as const satisfies Record<string, NumberOption | ColorOption | BooleanOption | ChoiceOption>;

export const DIAGRAM_OPTION_LIST: readonly OptionSpec[] = Object.values(DIAGRAM_OPTIONS);
