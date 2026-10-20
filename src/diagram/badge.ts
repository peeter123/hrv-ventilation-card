// The saving badge in the centre of the airflow diagram: the saving of the shared recovery calculation, in W; and on
// an ERV the moisture recovery figure at the bottom of the exchanger, in g/h. Pure: the Lit element renders the result.
import type { RecoveryResult } from '../calc/recovery';
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
  return result.mode === 'heating'
    ? { kind: 'warm', text, tint: options.colors.warm }
    : { kind: 'cold', text, tint: options.colors.cold };
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
  /** The signed rate, e.g. "120 g/h", or "−418 g/h" while moisture is kept out; or "n/a". */
  text: string;
  /** The tooltip, with the direction in words, e.g. "Moisture kept out: 418 g/h". */
  title: string;
}

/**
 * The moisture recovery figure of an ERV for a calculation result: the recovered moisture rate, negative while the
 * exchanger keeps moisture out. None for an HRV or without the badge's inputs (`badge`). Without a moisture rate (an
 * input has no value) it is hidden like the badge, or "n/a" with `showUnavailable`.
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
  const text = DIAGRAM.moisture(formatNumber(rate, locale));
  const magnitude = DIAGRAM.moisture(formatNumber(Math.abs(rate), locale));
  // Kept out only when the sign shows: a rate that rounds to 0 is written "0 g/h", without one.
  return {
    text,
    title: text === magnitude ? DIAGRAM.moistureRecovered(magnitude) : DIAGRAM.moistureKeptOut(magnitude),
  };
}

/**
 * The tooltip and accessible name of the effectiveness rings: both figures in whole percent, "not measurable" for one
 * without a value (or both without a calculation), and the bypass position while it is above 0 % (whole percent).
 * `moisture` is false where no moisture ring is drawn (an HRV, or an ERV without humidity), so the text leaves the
 * moisture figure out.
 */
export function effectivenessLabel(
  result: RecoveryResult | undefined,
  bypass: number | undefined,
  moisture: boolean,
  locale: LocaleLike,
): string {
  const figure = (value: number | undefined): string =>
    value === undefined ? DIAGRAM.effectivenessNoValue : DIAGRAM.effectivenessPercent(formatNumber(value, locale));
  // The bypass is decided on the whole percent shown, so a position that rounds to 0 is not written "(bypass 0 %)".
  const shownBypass = bypass === undefined ? undefined : Math.round(bypass);
  return DIAGRAM.effectiveness(
    figure(result?.effectiveness.temperature),
    moisture ? figure(result?.effectiveness.moisture) : undefined,
    shownBypass !== undefined && shownBypass > 0 ? formatNumber(shownBypass, locale) : undefined,
  );
}
