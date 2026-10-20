// The saving badge in the centre of the airflow diagram: the saving of the shared recovery calculation, in W; and on
// an ERV the moisture recovery figure right of the exchanger, in g/h. Pure: the Lit element renders the result.
import { recoveryTotals, type RecoveryResult } from '../calc/recovery';
import { missingRoles, type CardConfig, type Requirements } from '../lib/config';
import { formatNumber, type LocaleLike } from '../lib/format';
import type { EntityStateLike } from '../lib/hass';
import { convertedState } from '../lib/units';
import { DIAGRAM, NO_VALUE } from '../strings';
import type { ExchangerType } from './drawing';

/** The roles the badge needs: the calculation's temperatures and humidities of three streams, and the supply flow. */
export const BADGE_REQUIREMENTS: Requirements = {
  paths: ['outdoor.temperature', 'supply.temperature', 'extract.temperature', 'fans.supply_flow'],
  humidity: { streams: ['outdoor', 'supply', 'extract'], rule: 'required' },
};

/**
 * The roles the effectiveness rings need: the badge's without the humidities, which only the moisture ring needs
 * (the calculation is sensible-only without them).
 */
export const RINGS_REQUIREMENTS: Requirements = { paths: BADGE_REQUIREMENTS.paths };

/** A saving above this (W) gets a warm or cold badge; at or below it the badge is grey. */
export const SAVING_THRESHOLD = 0.5;

export interface Badge {
  kind: 'warm' | 'cold' | 'grey';
  text: string;
  /** The configured colour a warm or cold badge is tinted with. */
  tint?: string;
}

/** True when the config has every input the badge needs. Checked once per config by the card. */
export const hasBadge = (config: CardConfig): boolean => missingRoles(config, BADGE_REQUIREMENTS).length === 0;

/** True when the config has the inputs of the sensible calculation, which the effectiveness rings need. */
export const hasRings = (config: CardConfig): boolean => missingRoles(config, RINGS_REQUIREMENTS).length === 0;

/** The configured colour of a calculation mode: cold in cooling, warm in heating and without a mode. */
export const modeColor = (mode: RecoveryResult['mode'] | undefined, colors: { cold: string; warm: string }): string =>
  mode === 'cooling' ? colors.cold : colors.warm;

/**
 * The badge for a calculation result. Heating with a saving above the threshold gives a warm badge, cooling a cold
 * one, anything else a grey badge with the value ("0 W"). Without a result (an input has no value) there is no badge,
 * or a grey "n/a" badge with `showUnavailable`.
 */
export function savingBadge(
  result: RecoveryResult | undefined,
  options: { colors: { cold: string; warm: string }; showUnavailable: boolean },
  locale: LocaleLike,
): Badge | undefined {
  if (result === undefined) return options.showUnavailable ? { kind: 'grey', text: NO_VALUE } : undefined;
  const text = DIAGRAM.saving(formatNumber(result.saving, locale));
  if (result.saving <= SAVING_THRESHOLD) return { kind: 'grey', text };
  return { kind: result.mode === 'heating' ? 'warm' : 'cold', text, tint: modeColor(result.mode, options.colors) };
}

/**
 * The saving entity a tap on the badge opens. Of the two configured saving entities, the one that reads the higher
 * power (both in W), because the sensors decide heating or cooling on their own inputs and may disagree with the
 * calculation near the switch point. With one entity, a reading that is not a number or equal readings: the entity of
 * the calculation's mode. Undefined, so not tappable, without a calculated saving or without that entity.
 */
export function savingTarget(
  result: RecoveryResult | undefined,
  entities: Record<RecoveryResult['mode'], string | undefined>,
  states: Readonly<Record<string, EntityStateLike | undefined>>,
): string | undefined {
  if (result === undefined) return undefined;
  const { heating, cooling } = entities;
  if (heating !== undefined && cooling !== undefined) {
    const watts = [heating, cooling].map((id) => convertedState(states[id], 'power'));
    const [hw, cw] = watts;
    if (hw !== undefined && cw !== undefined && hw !== cw) return hw > cw ? heating : cooling;
  }
  return entities[result.mode];
}

export interface MoistureFigure {
  /** The rate's magnitude without unit or sign, e.g. "418", or "n/a". */
  text: string;
  /** The unit after the number ("g/h"); none for "n/a". */
  unit?: string;
  /** The direction as an icon: water-plus while moisture is recovered, water-minus while it is kept out; none for "n/a". */
  icon?: string;
  /** The tooltip, with the direction in words, e.g. "Moisture kept out: 418 g/h". */
  title: string;
}

/**
 * The moisture recovery figure of an ERV for a calculation result: the magnitude of the recovered moisture rate, with
 * an icon for the direction (no sign). None for an HRV or without the badge's inputs (`badge`). Without a moisture rate
 * (an input has no value) it is hidden like the badge, or "n/a" with `showUnavailable`.
 */
export function moistureFigure(
  result: RecoveryResult | undefined,
  options: { exchanger: ExchangerType; badge: boolean; showUnavailable: boolean },
  locale: LocaleLike,
): MoistureFigure | undefined {
  if (options.exchanger !== 'erv' || !options.badge) return undefined;
  const rate = result?.moisture?.recovered;
  if (rate === undefined)
    return options.showUnavailable ? { text: NO_VALUE, title: DIAGRAM.moistureNoValue } : undefined;
  const text = formatNumber(Math.abs(rate), locale);
  // Kept out only when the rate shows with a sign: a rate that rounds to 0 counts as recovered.
  const keptOut = formatNumber(rate, locale) !== text;
  const magnitude = DIAGRAM.moisture(text);
  return {
    text,
    unit: DIAGRAM.moistureUnit,
    icon: keptOut ? DIAGRAM.moistureKeptOutIcon : DIAGRAM.moistureRecoveredIcon,
    title: keptOut ? DIAGRAM.moistureKeptOut(magnitude) : DIAGRAM.moistureRecovered(magnitude),
  };
}

/**
 * The tooltip and accessible name of the effectiveness rings: the total figure named by the mode (heat, cooling, free
 * cooling) and the moisture figure, each in whole percent with its absolute values as magnitudes (the recovered total
 * and the potential in W, as the recovery card's header; the recovered and the extracted moisture in g/h), "not
 * measurable" for one without a value (or both without a calculation), and the bypass position while it is above 0 %,
 * as the calculation turns to cooling then (whole percent from 1 %, one decimal below). `moisture` is false where no
 * moisture ring is drawn (an HRV, or an ERV without humidity), so the text leaves the moisture figure out.
 */
export function effectivenessLabel(
  result: RecoveryResult | undefined,
  bypass: number | undefined,
  moisture: boolean,
  locale: LocaleLike,
): string {
  const figure = (value: number | undefined): string =>
    value === undefined ? DIAGRAM.effectivenessNoValue : DIAGRAM.effectivenessPercent(formatNumber(value, locale));
  const magnitude = (value: number): string => formatNumber(Math.abs(value), locale);
  const total = result?.effectiveness.total;
  const totals = result && total !== undefined ? recoveryTotals(result) : undefined;
  const rates = result?.effectiveness.moisture === undefined ? undefined : result.moisture;
  const mode =
    result === undefined
      ? undefined
      : result.freeCooling
        ? 'free cooling'
        : result.mode === 'cooling'
          ? 'cooling'
          : 'heat';
  // Any position above 0 turns the ring cold, so it is named; below 1 % with a decimal, never as "0".
  const open = bypass !== undefined && bypass > 0;
  return DIAGRAM.effectiveness(
    DIAGRAM.effectivenessTotal(
      mode,
      figure(total),
      totals && DIAGRAM.effectivenessWatts(magnitude(totals.recovered), magnitude(totals.potential)),
    ),
    moisture
      ? DIAGRAM.effectivenessMoisture(
          figure(result?.effectiveness.moisture),
          rates && DIAGRAM.effectivenessRate(magnitude(rates.recovered), magnitude(rates.extracted)),
        )
      : undefined,
    open ? (bypass >= 1 ? formatNumber(bypass, locale) : formatNumber(Math.max(bypass, 0.1), locale, 1)) : undefined,
  );
}
