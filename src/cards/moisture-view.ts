// What the moisture balance card shows, as pure functions of the calculation's moisture figures, the smoothed
// humidities, the bypass position, the options and the locale. The Lit element only renders this.
//
// All rates are relative to the outdoor air: extracted (taken out of the house) = recovered (handed back to the
// supply air by the exchanger) + put outside. Positive: moisture leaves the house (drying); negative: the outdoor air
// is more humid and the house gains moisture.
import { CALCULATION_OPTIONS } from '../calc/inputs';
import type { MoistureRates } from '../calc/recovery';
import { barScale, layoutSegments } from '../lib/bar';
import type { Requirements } from '../lib/config';
import { formatNumber, type LocaleLike } from '../lib/format';
import type { ColorOption, NumberOption, OptionSpec } from '../lib/options';
import { MOISTURE, NO_VALUE, type MoistureFigures } from '../strings';
import { hatch, type DrawnSegment } from './bar';

/** The roles the card needs: a humidity for each stream and the supply flow. */
export const MOISTURE_REQUIREMENTS: Requirements = {
  paths: ['fans.supply_flow'],
  humidity: { streams: ['outdoor', 'supply', 'extract'], rule: 'required' },
};

/** The card's options; smoothing and air_density are read by the calculation, the rest by the view. */
export const MOISTURE_OPTIONS = {
  ...CALCULATION_OPTIONS,
  neutralThreshold: { kind: 'number', path: 'neutral_threshold', min: 0, max: 5, default: 0.3 },
  minScale: { kind: 'number', path: 'min_scale', min: 50, max: 100_000, default: 250 },
  dryingColor: { kind: 'color', path: 'drying_color', default: '#00897b' },
  gainingColor: { kind: 'color', path: 'gaining_color', default: '#8e24aa' },
} as const satisfies Record<string, NumberOption | ColorOption>;

export const MOISTURE_OPTION_LIST: readonly OptionSpec[] = Object.values(MOISTURE_OPTIONS);

/** The bypass strip's colour. */
export const BYPASS_COLOR = '#fdd835';

export interface MoistureSettings {
  dryingColor: string;
  gainingColor: string;
  /** g/m³ */
  neutralThreshold: number;
  /** g/h */
  minScale: number;
}

/** The smoothed absolute humidities the card compares, g/m³. */
export interface IndoorOutdoor {
  indoor: number;
  outdoor: number;
}

export interface MoistureView {
  title: string;
  header: string;
  /** The header's colour; undefined for the theme's secondary text colour (neutral or no value). */
  headerColor?: string;
  segments: DrawnSegment[];
  /** The bypass strip: the position in % and its explanation; undefined to hide it. */
  bypass?: { position: number; text: string };
  /** The swatch words with their fills, then the text lines. */
  swatches: { recovered: string; outside: string; color: string } | undefined;
  lines: string[];
}

/** True while the house gains moisture: the outdoor air is more humid than the extract air. */
export const isGaining = (moisture: MoistureRates): boolean => moisture.extracted < 0;

/** True while indoor and outdoor absolute humidity differ by less than the threshold (within sensor accuracy). */
export const isNeutral = (humidity: IndoorOutdoor, threshold: number): boolean =>
  Math.abs(humidity.indoor - humidity.outdoor) < threshold;

/** The bypass position as shown: rounded and clamped to 0 to 100 %, 0 without a bypass. */
export const bypassPercent = (position: number | undefined): number =>
  position === undefined ? 0 : Math.round(Math.min(Math.max(position, 0), 100));

/** The rates in the direction of the moisture flow, rounded to g/h: positive in the normal case. */
interface DirectedRates {
  gaining: boolean;
  extracted: number;
  recovered: number;
  outside: number;
}

function directedRates(moisture: MoistureRates): DirectedRates {
  const gaining = isGaining(moisture);
  const direction = gaining ? -1 : 1;
  const rate = (value: number): number => Math.round(value * direction);
  return {
    gaining,
    extracted: rate(moisture.extracted),
    recovered: rate(moisture.recovered),
    outside: rate(moisture.outside),
  };
}

const formatRates = (rates: DirectedRates, locale: LocaleLike): MoistureFigures => ({
  gaining: rates.gaining,
  extracted: formatNumber(rates.extracted, locale),
  recovered: formatNumber(rates.recovered, locale),
  outside: formatNumber(rates.outside, locale),
});

/** The figures in the direction of the moisture flow: positive in the normal case, so headers need no minus sign. */
export const directedFigures = (moisture: MoistureRates, locale: LocaleLike): MoistureFigures =>
  formatRates(directedRates(moisture), locale);

function header(
  rates: DirectedRates,
  neutral: boolean,
  bypass: number,
  locale: LocaleLike,
): { title: string; header: string } {
  if (neutral) return { title: MOISTURE.titleNeutral, header: MOISTURE.neutral };
  let text = MOISTURE.header(formatRates(rates, locale));
  if (rates.extracted > 0) {
    const percent = formatNumber((rates.recovered / rates.extracted) * 100, locale);
    text += MOISTURE.percent(percent, bypass > 0 ? formatNumber(bypass, locale) : undefined);
  }
  return { title: rates.gaining ? MOISTURE.titleGaining : MOISTURE.titleDrying, header: text };
}

/** The header text: "Recovered X of Y g/h (N %, with bypass B %)", or the neutral text. */
export const moistureHeader = (
  moisture: MoistureRates,
  neutral: boolean,
  bypass: number,
  locale: LocaleLike,
): { title: string; header: string } => header(directedRates(moisture), neutral, bypass, locale);

/** The view for the calculation's moisture figures, or the no-value view without them. */
export function moistureView(
  moisture: MoistureRates | undefined,
  humidity: IndoorOutdoor | undefined,
  bypassPosition: number | undefined,
  settings: MoistureSettings,
  locale: LocaleLike,
): MoistureView {
  if (moisture === undefined || humidity === undefined) {
    return { title: MOISTURE.title, header: NO_VALUE, segments: [], swatches: undefined, lines: [] };
  }
  const gaining = isGaining(moisture);
  const neutral = isNeutral(humidity, settings.neutralThreshold);
  const color = gaining ? settings.gainingColor : settings.dryingColor;
  const bypass = bypassPercent(bypassPosition);

  const values = [moisture.recovered, moisture.outside];
  const scale = barScale(values, settings.minScale);
  const fills = [color, hatch(color)];
  const segments = layoutSegments(values, scale).map((segment, i) => ({ ...segment, background: fills[i] ?? color }));

  const rates = directedRates(moisture);
  const { title, header: headerText } = header(rates, neutral, bypass, locale);
  const tenths = (value: number): string => formatNumber(value, locale, 1);
  const view: MoistureView = {
    title,
    header: headerText,
    segments,
    swatches: { recovered: MOISTURE.swatchRecovered(gaining), outside: MOISTURE.swatchOutside(gaining), color },
    lines: [
      MOISTURE.flow(formatRates(rates, locale)),
      MOISTURE.humidities(tenths(humidity.indoor), tenths(humidity.outdoor)),
      MOISTURE.scale(formatNumber(scale, locale)),
    ],
  };
  if (!neutral) view.headerColor = color;
  if (bypass > 0) view.bypass = { position: bypass, text: MOISTURE.bypass(formatNumber(bypass, locale)) };
  return view;
}
