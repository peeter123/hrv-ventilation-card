// What the recovery balance card shows, as a pure function of the calculation, the options and the locale. The Lit
// element only renders this.
import type { RecoveryResult } from '../calc/recovery';
import { barScale, layoutSegments } from '../lib/bar';
import type { Requirements } from '../lib/config';
import { formatNumber, type LocaleLike } from '../lib/format';
import type { ColorOption, NumberOption, OptionSpec } from '../lib/options';
import { CALCULATION_OPTIONS } from '../calc/inputs';
import { NO_VALUE, RECOVERY } from '../strings';
import { hatch, type DrawnSegment } from './bar';

/** The roles the card needs: the three temperatures and the supply flow; humidity on all streams or none. */
export const RECOVERY_REQUIREMENTS: Requirements = {
  paths: ['outdoor.temperature', 'supply.temperature', 'extract.temperature', 'fans.supply_flow'],
  humidity: { streams: ['outdoor', 'supply', 'extract'], rule: 'all_or_none' },
};

const color = (path: string, value: string): ColorOption => ({ kind: 'color', path, default: value });

/** The card's options; smoothing and air_density are read by the calculation, the rest by the view. */
export const RECOVERY_OPTIONS = {
  ...CALCULATION_OPTIONS,
  minScale: { kind: 'number', path: 'min_scale', min: 50, max: 100_000, default: 500 },
  heatingColor: color('heating.color', '#db4437'),
  heatingLatent: color('heating.color_latent', '#f4a09a'),
  coolingColor: color('cooling.color', '#039be5'),
  coolingLatent: color('cooling.color_latent', '#8fd3f7'),
} as const satisfies Record<string, NumberOption | ColorOption>;

export const RECOVERY_OPTION_LIST: readonly OptionSpec[] = Object.values(RECOVERY_OPTIONS);

export interface RecoveryColors {
  heating: { color: string; latent: string };
  cooling: { color: string; latent: string };
}

/** One legend entry: a lane's name with its recovered and lost part, or plain text. */
export type LegendEntry =
  { kind: 'part'; color: string; label: string; recovered: string; lost: string } | { kind: 'text'; text: string };

export interface RecoveryView {
  title: string;
  header: string;
  /** The header's colour; undefined for the theme's secondary text colour (no value). */
  headerColor?: string;
  /** The temperature lane and, with humidity, the moisture lane: each its recovered then its lost part. */
  lanes: DrawnSegment[][];
  legend: LegendEntry[];
}

/** The view for a calculation result, or the no-value view without one. */
export function recoveryView(
  result: RecoveryResult | undefined,
  options: { colors: RecoveryColors; minScale: number },
  locale: LocaleLike,
): RecoveryView {
  if (result === undefined) return { title: RECOVERY.titleNoValue, header: NO_VALUE, lanes: [], legend: [] };

  const { color, latent: latentColor } = options.colors[result.mode];
  const round = Math.round;
  const watts = (value: number): string => formatNumber(value, locale);
  const recovered = { sensible: round(result.recovered.sensible), latent: round(result.recovered.latent) };
  const lost = { sensible: round(result.lost.sensible), latent: round(result.lost.latent) };

  // One lane per kind (temperature, and moisture with humidity), each its solid recovered and its hatched lost part,
  // on the scale of the fuller lane.
  const lane = (recoveredPart: number, lostPart: number, laneColor: string) => ({
    values: [recoveredPart, lostPart],
    backgrounds: [laneColor, hatch(laneColor)],
  });
  const laneParts = [lane(recovered.sensible, lost.sensible, color)];
  if (result.latentKnown) laneParts.push(lane(recovered.latent, lost.latent, latentColor));
  const scale = Math.max(...laneParts.map(({ values }) => barScale(values, options.minScale)));
  const lanes = laneParts.map(({ values, backgrounds }) =>
    layoutSegments(values, scale).map((segment, i) => ({ ...segment, background: backgrounds[i] ?? color })),
  );

  const recoveredTotal = recovered.sensible + recovered.latent;
  const potential = recoveredTotal + lost.sensible + lost.latent;
  // Free cooling words the same figures as cooling delivered rather than recovered.
  const [withPotential, withoutPotential] = result.freeCooling
    ? [RECOVERY.headerFreeCooling, RECOVERY.headerFreeCoolingNoPotential]
    : [RECOVERY.header, RECOVERY.headerNoPotential];
  const header =
    potential > 0
      ? withPotential(watts(recoveredTotal), watts(potential), formatNumber((recoveredTotal / potential) * 100, locale))
      : withoutPotential(watts(recoveredTotal));

  // Free cooling delivers cooling rather than recovering it, and what it does not deliver is missed, not lost.
  const [recoveredText, lostText] = result.freeCooling
    ? [RECOVERY.cooling, RECOVERY.missed]
    : [RECOVERY.recovered, RECOVERY.lost];
  const legend: LegendEntry[] = [
    {
      kind: 'part',
      color,
      label: RECOVERY.laneSensible,
      recovered: recoveredText(watts(recovered.sensible)),
      lost: lostText(watts(lost.sensible)),
    },
  ];
  if (result.latentKnown) {
    legend.push({
      kind: 'part',
      color: latentColor,
      label: RECOVERY.laneLatent,
      recovered: recoveredText(watts(recovered.latent)),
      lost: lostText(watts(lost.latent)),
    });
  }
  legend.push({ kind: 'text', text: RECOVERY.scale(watts(scale)) });

  return {
    title: result.freeCooling
      ? RECOVERY.titleFreeCooling
      : result.mode === 'heating'
        ? RECOVERY.titleHeating
        : RECOVERY.titleCooling,
    header,
    headerColor: color,
    lanes,
    legend,
  };
}
