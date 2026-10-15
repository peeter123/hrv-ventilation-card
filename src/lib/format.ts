// Formats the numbers a card computes itself (bar headers and legends) with the user's Home Assistant locale:
// the magnitude in the locale's format, a negative value with a "−" (minus sign) in front. Entity states are not
// formatted here; labels use Home Assistant's own formatting.
import type { HassLike } from './hass';
import { NO_VALUE } from '../strings';

/** The parts of `hass.locale` used here. */
export interface LocaleLike {
  language?: string;
  /**
   * Home Assistant's number format setting: `language`, `system`, `comma_decimal`, `decimal_comma`,
   * `quote_decimal`, `space_comma` or `none`. A string, so a value from a newer version falls back to the language.
   */
  number_format?: string;
}

const MINUS = '−';

/** The locale settings of a `hass` object; older versions only have `hass.language`. */
export function localeFromHass(hass: Pick<HassLike, 'locale' | 'language'> | undefined): LocaleLike {
  const locale = hass?.locale;
  if (typeof locale === 'object' && locale !== null) return locale;
  return hass?.language === undefined ? {} : { language: hass.language };
}

// The same mapping as Home Assistant's frontend: each setting picks a locale whose separators it describes.
// `none` is plain digits with a "." decimal and no grouping.
function localesFor(locale: LocaleLike): string[] | undefined {
  switch (locale.number_format) {
    case 'comma_decimal':
      return ['en-US', 'en'];
    case 'decimal_comma':
      return ['de', 'es', 'it'];
    case 'quote_decimal':
      return ['de-CH'];
    case 'space_comma':
      return ['fr', 'sv', 'cs'];
    case 'none':
      return ['en-US'];
    case 'system':
      return undefined;
    default:
      return locale.language === undefined ? undefined : [locale.language];
  }
}

const formatters = new Map<string, Intl.NumberFormat>();

function formatterFor(locale: LocaleLike, decimals: number): Intl.NumberFormat {
  const locales = localesFor(locale);
  const grouping = locale.number_format !== 'none';
  const key = `${locales?.join(',') ?? ''}|${String(decimals)}|${String(grouping)}`;
  let formatter = formatters.get(key);
  if (formatter === undefined) {
    formatter = new Intl.NumberFormat(locales, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: grouping,
    });
    formatters.set(key, formatter);
  }
  return formatter;
}

/**
 * The value formatted with the locale, rounded to `decimals` (0 to 20, default 0: W and g/h are shown whole). A
 * value that rounds to zero has no sign; a value that is not a finite number gives "n/a". Without a locale the
 * browser's default is used.
 */
export function formatNumber(value: number, locale: LocaleLike | undefined, decimals = 0): string {
  if (!Number.isFinite(value)) return NO_VALUE;
  const digits = Number.isFinite(decimals) ? Math.min(20, Math.max(0, Math.trunc(decimals))) : 0;
  // A value that rounds to zero is formatted as 0, so no engine writes "-0".
  const shown = Math.abs(value) < 0.5 / 10 ** digits ? 0 : value;
  return formatterFor(locale ?? {}, digits)
    .formatToParts(shown)
    .map((part) => (part.type === 'minusSign' ? MINUS : part.value))
    .join('');
}
