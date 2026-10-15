import { describe, expect, test } from 'vitest';
import { formatNumber, localeFromHass } from '../../src/lib/format';

const MINUS = '−';

describe('formatNumber', () => {
  test('card-bundle "Thousands separator": a period as thousands separator gives "1.250"', () => {
    expect(formatNumber(1250, { language: 'en', number_format: 'decimal_comma' })).toBe('1.250');
  });

  test("the language setting uses the language's separators", () => {
    expect(formatNumber(1250, { language: 'nl', number_format: 'language' })).toBe('1.250');
    expect(formatNumber(1250, { language: 'en', number_format: 'language' })).toBe('1,250');
  });

  test('a negative value is written with a minus sign in front of the formatted magnitude', () => {
    expect(formatNumber(-1250, { language: 'en', number_format: 'comma_decimal' })).toBe(`${MINUS}1,250`);
    expect(formatNumber(-50, { language: 'en', number_format: 'language' })).toBe(`${MINUS}50`);
  });

  test('a comma decimal format with decimals', () => {
    expect(formatNumber(10.95, { language: 'en', number_format: 'decimal_comma' }, 2)).toBe('10,95');
    expect(formatNumber(-0.25, { language: 'de', number_format: 'language' }, 1)).toBe(`${MINUS}0,3`);
  });

  test('space_comma groups with a space and uses a decimal comma', () => {
    const formatted = formatNumber(1250.5, { language: 'en', number_format: 'space_comma' }, 1);
    expect(formatted.replace(/\s/gu, ' ')).toBe('1 250,5');
  });

  test('none has no grouping', () => {
    expect(formatNumber(1250, { language: 'en', number_format: 'none' })).toBe('1250');
  });

  test('values are rounded to whole numbers by default', () => {
    expect(formatNumber(1324.4, { language: 'en', number_format: 'language' })).toBe('1,324');
    expect(formatNumber(399.6, { language: 'en', number_format: 'language' })).toBe('400');
  });

  test('a value that rounds to zero has no sign, also with decimals', () => {
    expect(formatNumber(-0.04, { language: 'en' }, 1)).toBe('0.0');
    expect(formatNumber(-0.06, { language: 'en' }, 1)).toBe('\u22120.1');
    expect(formatNumber(-0.4, { language: 'en', number_format: 'language' })).toBe('0');
    expect(formatNumber(-0, { language: 'en', number_format: 'language' })).toBe('0');
  });

  test('none has a plain "." decimal whatever the language', () => {
    expect(formatNumber(1250.5, { language: 'nl', number_format: 'none' }, 1)).toBe('1250.5');
    expect(formatNumber(-1250.5, { language: 'de', number_format: 'none' }, 1)).toBe(`${MINUS}1250.5`);
  });

  test('quote_decimal groups with an apostrophe', () => {
    // ICU versions differ on the apostrophe (' or ’).
    expect(formatNumber(1250.5, { language: 'en', number_format: 'quote_decimal' }, 1)).toMatch(/^1['’]250\.5$/u);
  });

  test('a value that is not finite gives n/a', () => {
    expect(formatNumber(Number.NaN, { language: 'en' })).toBe('n/a');
    expect(formatNumber(Number.POSITIVE_INFINITY, { language: 'en' })).toBe('n/a');
  });

  test('decimals outside 0 to 20 are clamped instead of throwing', () => {
    expect(formatNumber(1.25, { language: 'en' }, -1)).toBe('1');
    expect(formatNumber(1.5, { language: 'en' }, 1.7)).toBe('1.5');
    expect(() => formatNumber(1, { language: 'en' }, 101)).not.toThrow();
  });

  test('decimals that are not a number fall back to 0', () => {
    expect(formatNumber(12.6, { language: 'en' }, Number.NaN)).toBe('13');
  });

  test('without a locale the default format is used', () => {
    expect(formatNumber(120, undefined)).toBe('120');
  });
});

describe('localeFromHass', () => {
  test('uses hass.locale when present', () => {
    const locale = { language: 'nl', number_format: 'language' };
    expect(localeFromHass({ locale, language: 'en' })).toBe(locale);
  });

  test('falls back to hass.language on older versions', () => {
    const locale = localeFromHass({ language: 'nl' });
    expect(locale).toEqual({ language: 'nl' });
    expect(formatNumber(1250, locale)).toBe('1.250');
  });

  test('gives an empty locale without either', () => {
    expect(localeFromHass(undefined)).toEqual({});
    expect(localeFromHass({})).toEqual({});
  });
});
